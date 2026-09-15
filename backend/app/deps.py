"""Dependencias compartidas por los routers."""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from .db import get_sesion
from .models import Usuario
from .security import leer_token

bearer = HTTPBearer(auto_error=False)

SesionDb = Annotated[AsyncSession, Depends(get_sesion)]


def _no_autorizado() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Sesión no válida o caducada.",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def usuario_actual(
    sesion: SesionDb,
    credencial: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)] = None,
) -> Usuario:
    if credencial is None:
        raise _no_autorizado()
    usuario_id = leer_token(credencial.credentials)
    if usuario_id is None:
        raise _no_autorizado()
    usuario = await sesion.get(Usuario, usuario_id)
    if usuario is None:
        raise _no_autorizado()
    return usuario


UsuarioActual = Annotated[Usuario, Depends(usuario_actual)]
