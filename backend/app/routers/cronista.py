"""El cronista: el navegador manda el estado de su partida y recibe la escena.

El prompt y la clave de API viven en el servidor; el cliente no puede mandar
texto libre al modelo.
"""

import time
import uuid
from collections import defaultdict, deque
from typing import Any

import anthropic
from fastapi import APIRouter, HTTPException, status

from ..cronista import CronistaNoDisponible, CronistaSeNego, RespuestaIlegible, pedir_cronica
from ..deps import UsuarioActual
from ..schemas import CronicaIn

router = APIRouter(prefix="/cronista", tags=["cronista"])

# Tope por jugador: una encrucijada tarda lo suyo, así que 30 por minuto es de
# sobra para jugar y corta un cliente desbocado. Es por proceso: con varias
# réplicas del backend haría falta llevar la cuenta en Redis o en la base.
LIMITE = 30
VENTANA = 60.0
_marcas: dict[uuid.UUID, deque[float]] = defaultdict(deque)


def _dentro_del_limite(usuario_id: uuid.UUID) -> bool:
    ahora = time.monotonic()
    marcas = _marcas[usuario_id]
    while marcas and ahora - marcas[0] > VENTANA:
        marcas.popleft()
    if not marcas:
        _marcas.pop(usuario_id, None)
        marcas = _marcas[usuario_id]
    if len(marcas) >= LIMITE:
        return False
    marcas.append(ahora)
    return True


@router.post("/encrucijada")
async def encrucijada(peticion: CronicaIn, usuario: UsuarioActual) -> dict[str, Any]:
    """El siguiente fragmento de la crónica, tal cual lo devuelve el modelo."""
    if not _dentro_del_limite(usuario.id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiadas encrucijadas seguidas. Espera un momento.",
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
