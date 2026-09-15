"""Tablas: jugadores y sus crónicas.

El catálogo del juego (oficios, armas, objetos) sigue viviendo en
`frontend/src/juego/datos.js`; aquí solo se guarda lo que cambia al jugar.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text, func, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    correo: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    nombre: Mapped[str] = mapped_column(String(60))
    hash_contrasena: Mapped[str] = mapped_column(String(255))
    # Música, dificultad, duración, sellos, efectos y ambiente: viajan con la
    # cuenta para que las mismas opciones valgan en cualquier navegador.
    preferencias: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    partidas: Mapped[list["Partida"]] = relationship(
        back_populates="usuario", cascade="all, delete-orphan", lazy="selectin"
    )


class Partida(Base):
    """Una crónica. Mientras `terminada` es falsa es la partida en curso."""

    __tablename__ = "partidas"
    __table_args__ = (
        # El juego guarda una sola partida a la vez: la base de datos lo sostiene.
        Index(
            "uq_partida_en_curso_por_usuario",
            "usuario_id",
            unique=True,
            postgresql_where=text("NOT terminada"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("usuarios.id", ondelete="CASCADE"), index=True, nullable=False
    )

    # ---- Personaje ------------------------------------------------------------
    nombre: Mapped[str] = mapped_column(String(60), nullable=False, server_default="")
    oficio: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    objeto_ini: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    retrato: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")

    # ---- Marcador -------------------------------------------------------------
    turno: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    vida: Mapped[int] = mapped_column(Integer, nullable=False, server_default="10")
    vida_max: Mapped[int] = mapped_column(Integer, nullable=False, server_default="10")
    oro: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")

    # ---- Estado de la partida -------------------------------------------------
    inv: Mapped[list] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    armas: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    rasgos: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    gastados: Mapped[list] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    lugar: Mapped[str] = mapped_column(String(120), nullable=False, server_default="")
    ambiente: Mapped[str] = mapped_column(String(120), nullable=False, server_default="")
    prosa: Mapped[str] = mapped_column(Text, nullable=False, server_default="")
    opciones: Mapped[list] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    # Las últimas seis entradas que ve el cronista.
    log: Mapped[list] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    # La crónica entera, para releerla al cerrar el libro.
    completa: Mapped[list] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    escena: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # ---- Ajustes con los que empezó -------------------------------------------
    opt_dificultad: Mapped[str | None] = mapped_column(String(20), nullable=True)
    opt_duracion: Mapped[str | None] = mapped_column(String(20), nullable=True)
    opt_sellos: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    # ---- Cierre ---------------------------------------------------------------
    terminada: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    muerto: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    titulo_final: Mapped[str | None] = mapped_column(String(120), nullable=True)
    epilogo: Mapped[str | None] = mapped_column(Text, nullable=True)

    creada_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizada_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    usuario: Mapped[Usuario] = relationship(back_populates="partidas")
