"""Configuración del backend, leída del entorno (o de un `.env` en local)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Ajustes(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # ---- Base de datos --------------------------------------------------------
    database_url: str = "postgresql+asyncpg://cronica:cronica@localhost:5432/cronica"

    # ---- Sesiones -------------------------------------------------------------
    # Sin valor por defecto a propósito: un secreto de firma compartido en el
    # repositorio dejaría que cualquiera falsificase la sesión de cualquier
    # jugador. Genera uno con `openssl rand -hex 32`.
    jwt_secreto: str
    jwt_algoritmo: str = "HS256"
    jwt_dias: int = 14

    # ---- Cronista -------------------------------------------------------------
    anthropic_api_key: str | None = None
    claude_modelo: str = "claude-opus-5"
    claude_max_tokens: int = 4096
    # Esfuerzo medio: margen para cumplir las reglas de estilo sin que la
    # encrucijada tarde demasiado en llegar.
    claude_esfuerzo: str = "medium"

    # ---- Frenos contra el abuso -----------------------------------------------
    # Techo de gasto: llamadas al cronista por día en todo el servidor. Es el
    # único límite que se cumple pase lo que pase; los demás solo filtran.
    tope_diario_cronista: int = 500
    # Por jugador, por minuto.
    tope_cronista_por_usuario: int = 30
    # Por IP: cuentas nuevas por hora, e intentos de entrar cada cinco minutos.
    tope_registros_por_ip: int = 5
    tope_logins_por_ip: int = 20

    # ---- CORS -----------------------------------------------------------------
    # Lista separada por comas; el `.env` no tiene que llevar JSON.
    origenes_permitidos: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def origenes(self) -> list[str]:
        return [o.strip() for o in self.origenes_permitidos.split(",") if o.strip()]


@lru_cache
def obtener_ajustes() -> Ajustes:
    return Ajustes()  # type: ignore[call-arg]  # los campos llegan del entorno


ajustes = obtener_ajustes()
