"""La llamada al modelo. La clave de API nunca sale de aquí."""

import json
import logging

import anthropic

from ..config import ajustes
from ..schemas import CronicaIn
from . import prompt

log = logging.getLogger(__name__)


class CronistaNoDisponible(Exception):
    """No hay clave de API configurada en el servidor."""


class CronistaSeNego(Exception):
    """El modelo declinó escribir la escena."""


class RespuestaIlegible(Exception):
    """La respuesta no traía un JSON que se pudiera leer."""


_cliente: anthropic.AsyncAnthropic | None = None


def _sdk() -> anthropic.AsyncAnthropic | None:
    global _cliente
    if not ajustes.anthropic_api_key:
        return None
    if _cliente is None:
        _cliente = anthropic.AsyncAnthropic(api_key=ajustes.anthropic_api_key)
    return _cliente


def parsear(txt: str) -> dict | None:
    """Del primer `{` al último `}`, igual que hacía el cliente."""
    if not txt:
        return None
    a = txt.find("{")
    b = txt.rfind("}")
    if a < 0 or b < a:
        return None
    try:
        leido = json.loads(txt[a : b + 1])
    except json.JSONDecodeError:
        return None
    return leido if isinstance(leido, dict) else None


async def pedir_cronica(peticion: CronicaIn) -> dict:
    sdk = _sdk()
    if sdk is None:
        raise CronistaNoDisponible()

    respuesta = await sdk.beta.messages.create(
        model=ajustes.claude_modelo,
        max_tokens=ajustes.claude_max_tokens,
        system=prompt.sistema(peticion),
        messages=[{"role": "user", "content": prompt.usuario(peticion)}],
        # Si el modelo declina la peticion, el servidor la reintenta con el
        # modelo de respaldo recomendado en lugar de devolver el rechazo.
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
        output_config={"effort": ajustes.claude_esfuerzo},
    )

    if respuesta.stop_reason == "refusal":
        detalle = getattr(respuesta.stop_details, "category", None)
        log.warning("el cronista se nego a escribir la escena (%s)", detalle)
        raise CronistaSeNego()

    txt = "".join(bloque.text for bloque in respuesta.content if bloque.type == "text")
    leido = parsear(txt)
    if leido is None:
        raise RespuestaIlegible()
    return leido
