"""El cronista: el navegador manda el estado de su partida y recibe la escena.

El prompt y la clave de API viven en el servidor; el cliente no puede mandar
texto libre al modelo.
"""

import logging
from typing import Any

import anthropic
from fastapi import APIRouter, HTTPException, status

from ..config import ajustes
from ..cronista import CronistaNoDisponible, CronistaSeNego, RespuestaIlegible, pedir_cronica
from ..deps import SesionDb, UsuarioActual
from ..limites import Ventana, apuntar_llamada
from ..schemas import CronicaIn

log = logging.getLogger(__name__)

router = APIRouter(prefix="/cronista", tags=["cronista"])

# Tope por jugador: una encrucijada tarda lo suyo, así que 30 por minuto es de
# sobra para jugar y corta un cliente desbocado. Es por proceso: con varias
# réplicas del backend haría falta llevarlo a Redis. El techo del gasto, en
# cambio, va en la base y se cumple siempre (ver `limites.py`).
_por_usuario = Ventana(ajustes.tope_cronista_por_usuario, 60.0)


@router.post("/encrucijada")
async def encrucijada(peticion: CronicaIn, usuario: UsuarioActual, sesion: SesionDb) -> dict[str, Any]:
    """El siguiente fragmento de la crónica, tal cual lo devuelve el modelo."""
    if not _por_usuario.admite(str(usuario.id)):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiadas encrucijadas seguidas. Espera un momento.",
        )

    # El techo del día, antes de gastar nada.
    cabe, total = await apuntar_llamada(sesion, ajustes.tope_diario_cronista)
    if not cabe:
        log.warning("tope diario alcanzado: %s llamadas (tope %s)", total, ajustes.tope_diario_cronista)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "El cronista ha escrito todo lo que podía escribir hoy. "
                "Vuelve mañana y seguirá la crónica."
            ),
        )

    try:
        return await pedir_cronica(peticion)
    except CronistaNoDisponible:
        # 503 es el que el cliente enseña tal cual: es un aviso, no un fallo.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "El cronista no responde: el servidor no tiene configurada la clave "
                "de API (ANTHROPIC_API_KEY) para escribir la historia."
            ),
        ) from None
    except CronistaSeNego:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="el cronista se negó a escribir esta escena",
        ) from None
    except RespuestaIlegible:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="formato") from None
    except anthropic.RateLimitError:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="el cronista está desbordado, prueba en un momento",
        ) from None
    except anthropic.APIConnectionError:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail="no se llegó al cronista"
        ) from None
    except anthropic.APIStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=f"error del cronista ({e.status_code})"
        ) from None
