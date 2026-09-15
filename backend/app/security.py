"""Contraseñas (argon2) y sesiones (JWT)."""

import uuid
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

from .config import ajustes

_hasher = PasswordHasher()


def hashear(contrasena: str) -> str:
    return _hasher.hash(contrasena)


def verificar(contrasena: str, hash_guardado: str) -> bool:
    try:
        _hasher.verify(hash_guardado, contrasena)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False
    return True


def crear_token(usuario_id: uuid.UUID) -> str:
    ahora = datetime.now(timezone.utc)
    carga = {
        "sub": str(usuario_id),
        "iat": ahora,
        "exp": ahora + timedelta(days=ajustes.jwt_dias),
    }
    return jwt.encode(carga, ajustes.jwt_secreto, algorithm=ajustes.jwt_algoritmo)


def leer_token(token: str) -> uuid.UUID | None:
    """El id del jugador, o `None` si el token no vale o ha caducado."""
    try:
        carga = jwt.decode(token, ajustes.jwt_secreto, algorithms=[ajustes.jwt_algoritmo])
        return uuid.UUID(carga["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None
