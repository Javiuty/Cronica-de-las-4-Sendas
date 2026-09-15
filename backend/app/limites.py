"""Frenos contra el abuso.

Dos capas, a propósito:

1. **Por IP y por usuario**, en memoria del proceso. Filtran la molestia (crear
   cuentas en bucle, machacar el login) pero se apoyan en cabeceras que, en el
   peor caso, alguien podría falsear.
2. **Un tope global diario**, en la base de datos. Ese no depende de acertar con
   la IP ni sobrevive a un reinicio mal dado: es el techo del gasto y se cumple
   siempre.

Si la primera capa falla, la segunda sigue en pie. El dinero lo garantiza la
segunda; la primera solo evita llegar hasta ella.
"""

import time
from collections import deque
from datetime import datetime, timezone

from fastapi import Request
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from .models import UsoDiario


class Ventana:
    """Ventana deslizante: como mucho `tope` sucesos por `ventana` segundos."""

    def __init__(self, tope: int, ventana: float) -> None:
        self.tope = tope
        self.ventana = ventana
        self._marcas: dict[str, deque[float]] = {}
        self._ultima_limpieza = time.monotonic()

    def _limpiar(self, ahora: float) -> None:
        """Tira las claves sin actividad reciente, para no crecer sin fin."""
        if ahora - self._ultima_limpieza < self.ventana:
            return
        self._ultima_limpieza = ahora
        muertas = [k for k, v in self._marcas.items() if not v or ahora - v[-1] > self.ventana]
        for k in muertas:
            del self._marcas[k]

    def admite(self, clave: str) -> bool:
        ahora = time.monotonic()
        self._limpiar(ahora)
        marcas = self._marcas.setdefault(clave, deque())
        while marcas and ahora - marcas[0] > self.ventana:
            marcas.popleft()
        if len(marcas) >= self.tope:
            return False
        marcas.append(ahora)
        return True


def ip_de(peticion: Request) -> str:
    """La IP del cliente, mirando las cabeceras que ponen Cloudflare y NPM.

    El backend no es alcanzable desde fuera (solo el proxy llega a él), así que
    estas cabeceras son razonables para contar peticiones. No son prueba de
    identidad: quien controle muchas IPs, o sepa falsear la cabecera llegando
    por el proxy, puede saltarse este freno. Por eso existe el tope diario.
    """
    cf = peticion.headers.get("cf-connecting-ip")
    if cf:
        return cf.strip()
    reenviada = peticion.headers.get("x-forwarded-for")
    if reenviada:
        return reenviada.split(",")[0].strip()
    return peticion.client.host if peticion.client else "desconocida"


async def apuntar_llamada(sesion: AsyncSession, tope: int) -> tuple[bool, int]:
    """Suma una llamada al cronista al contador de hoy.

    Devuelve (cabe, total_de_hoy). Es una sola sentencia atómica, así que dos
    peticiones a la vez no pueden colarse por encima del tope.
    """
    hoy = datetime.now(timezone.utc).date()
    sentencia = (
        insert(UsoDiario)
        .values(dia=hoy, llamadas=1)
        .on_conflict_do_update(index_elements=["dia"], set_={"llamadas": UsoDiario.llamadas + 1})
        .returning(UsoDiario.llamadas)
    )
    total = (await sesion.execute(sentencia)).scalar_one()
    await sesion.commit()
    return total <= tope, total
