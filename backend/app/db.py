"""Motor, sesiones y base declarativa de SQLAlchemy."""

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from .config import ajustes


class Base(DeclarativeBase):
    pass


motor = create_async_engine(ajustes.database_url, pool_pre_ping=True)
CrearSesion = async_sessionmaker(motor, expire_on_commit=False)


async def get_sesion() -> AsyncIterator[AsyncSession]:
    """Dependencia de FastAPI: una sesión por petición."""
    async with CrearSesion() as sesion:
        yield sesion
