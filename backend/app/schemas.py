"""Contratos de la API.

El cliente habla camelCase (es el mismo objeto que ya vivía en `localStorage`)
y Python habla snake_case: lo resuelve el generador de alias.
"""

import uuid
from datetime import datetime
from typing import Annotated, Any, Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel


class Esquema(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


# ---- Cuentas ----------------------------------------------------------------

Contrasena = Annotated[str, Field(min_length=8, max_length=128)]


class RegistroIn(Esquema):
    correo: EmailStr
    nombre: Annotated[str, Field(min_length=1, max_length=60)]
    contrasena: Contrasena


class LoginIn(Esquema):
    correo: EmailStr
    contrasena: Contrasena


class PreferenciasIn(Esquema):
    """Las seis opciones de partida. `None` significa «como venga por defecto»."""

    opt_dificultad: str | None = Field(default=None, max_length=20)
    opt_duracion: str | None = Field(default=None, max_length=20)
    opt_sellos: bool | None = None
    opt_musica: bool | None = None
    opt_efectos: bool | None = None
    opt_ambiente: bool | None = None


class UsuarioOut(Esquema):
    id: uuid.UUID
    correo: EmailStr
    nombre: str
    preferencias: dict[str, Any] = {}


class TokenOut(Esquema):
    token: str
    usuario: UsuarioOut


# ---- Piezas de la partida ---------------------------------------------------


class Objeto(Esquema):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="allow")

    nombre: Annotated[str, Field(max_length=80)]
    rareza: str | None = Field(default=None, max_length=20)
    nota: str | None = Field(default=None, max_length=400)


class Arma(Esquema):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="allow")

    nombre: Annotated[str, Field(max_length=80)]
    rareza: str | None = Field(default=None, max_length=20)
    tipo: Literal["cuerpo", "distancia"] = "cuerpo"
    bono: int = Field(default=1, ge=1, le=4)
    nota: str | None = Field(default=None, max_length=400)


class Armas(Esquema):
    cuerpo: Arma | None = None
    distancia: Arma | None = None


class Rasgos(Esquema):
    honor: int = Field(default=0, ge=0, le=99)
    astucia: int = Field(default=0, ge=0, le=99)
    piedad: int = Field(default=0, ge=0, le=99)
    codicia: int = Field(default=0, ge=0, le=99)


class Opcion(Esquema):
    # Viene tal cual del cronista: se deja pasar lo que no conocemos.
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="allow")

    texto: str = Field(default="", max_length=300)
    rasgo: str | None = Field(default=None, max_length=20)
    riesgo: str | None = Field(default=None, max_length=20)
    combate: str | None = Field(default=None, max_length=20)
    dificultad: int | None = Field(default=None, ge=0, le=40)


class Escena(Esquema):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="allow")

    terreno: str | None = Field(default=None, max_length=30)
    cielo: str | None = Field(default=None, max_length=30)
    estructuras: list[Annotated[str, Field(max_length=30)]] = Field(default_factory=list, max_length=3)


class Entrada(Esquema):
    texto: str = Field(default="", max_length=4000)


# ---- Partidas ---------------------------------------------------------------


class PartidaIn(Esquema):
    """Lo que el navegador guardaba en `localStorage`, tal cual."""

    nombre: str = Field(default="", max_length=60)
    oficio: int = Field(default=0, ge=0, le=99)
    objeto_ini: int = Field(default=0, ge=0, le=99)
    retrato: int = Field(default=0, ge=0, le=99)

    turno: int = Field(default=0, ge=0, le=100)
    vida: int = Field(default=10, ge=0, le=99)
    vida_max: int = Field(default=10, ge=1, le=99)
    oro: int = Field(default=0, ge=0, le=99999)

    inv: list[Objeto] = Field(default_factory=list, max_length=8)
    armas: Armas = Field(default_factory=Armas)
    rasgos: Rasgos = Field(default_factory=Rasgos)
    gastados: list[Annotated[str, Field(max_length=80)]] = Field(default_factory=list, max_length=8)
    lugar: str = Field(default="", max_length=120)
    ambiente: str = Field(default="", max_length=120)
    prosa: str = Field(default="", max_length=4000)
    opciones: list[Opcion] = Field(default_factory=list, max_length=4)
    log: list[Entrada] = Field(default_factory=list, max_length=6)
    # En el cliente se llama `full`; en la tabla, `completa`. Acepta los dos
    # nombres al validar (JSON del navegador y fila de la base) y escribe `full`.
    completa: list[Annotated[str, Field(max_length=4000)]] = Field(
        default_factory=list,
        max_length=200,
        validation_alias=AliasChoices("full", "completa"),
        serialization_alias="full",
    )
    escena: Escena | None = None

    opt_dificultad: str | None = Field(default=None, max_length=20)
    opt_duracion: str | None = Field(default=None, max_length=20)
    opt_sellos: bool | None = None


class CierreIn(Esquema):
    """Cómo acabó la crónica, al cerrar el libro."""

    muerto: bool = False
    titulo_final: str | None = Field(default=None, max_length=120)
    epilogo: str | None = Field(default=None, max_length=4000)


class PartidaOut(PartidaIn):
    id: uuid.UUID
    terminada: bool
    muerto: bool
    titulo_final: str | None = None
    epilogo: str | None = None
    creada_en: datetime
    actualizada_en: datetime


class CronicaResumen(Esquema):
    """Una línea del historial de crónicas cerradas."""

    id: uuid.UUID
    nombre: str
    oficio: int
    turno: int
    lugar: str
    muerto: bool
    titulo_final: str | None = None
    epilogo: str | None = None
    rasgos: Rasgos
    creada_en: datetime
    actualizada_en: datetime


# ---- Cronista ---------------------------------------------------------------


class Tirada(Esquema):
    cara: int = Field(ge=1, le=20)
    mod: int = Field(ge=-20, le=20)
    total: int = Field(ge=-20, le=60)
    dif: int = Field(ge=0, le=40)
    resultado: Literal["exito", "coste", "fallo"]
    objeto: str | None = Field(default=None, max_length=80)
    combate: str | None = Field(default=None, max_length=20)
    arma: str | None = Field(default=None, max_length=80)


class Eleccion(Esquema):
    texto: str = Field(default="", max_length=300)
    rasgo: str | None = Field(default=None, max_length=20)
    riesgo: str | None = Field(default=None, max_length=20)


class EstadoCronista(Esquema):
    """El estado que el cronista necesita ver para escribir el siguiente trozo."""

    jugador: str = Field(default="sin nombre", max_length=60)
    oficio: str = Field(default="", max_length=60)
    turno: int = Field(default=1, ge=1, le=100)
    vida: str = Field(default="10/10", max_length=20)
    oro: int = Field(default=0, ge=0, le=99999)
    arma_cuerpo: str = Field(default="ninguna", max_length=120)
    arma_distancia: str = Field(default="ninguna", max_length=120)
    zurron: list[Annotated[str, Field(max_length=80)]] = Field(default_factory=list, max_length=8)
    rasgos: Rasgos = Field(default_factory=Rasgos)
    lugar: str = Field(default="", max_length=120)
    cronica: list[Annotated[str, Field(max_length=4000)]] = Field(default_factory=list, max_length=6)


class CronicaIn(Esquema):
    estado: EstadoCronista
    eleccion: Eleccion | None = None
    tirada: Tirada | None = None
    # Encrucijadas que dura la partida (corta 8, media 12, larga 18).
    largo: int = Field(default=12, ge=1, le=24)
