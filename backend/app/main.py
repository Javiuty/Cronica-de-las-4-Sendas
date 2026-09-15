"""Backend de Crónica de las Cuatro Sendas."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import ajustes
from .routers import auth, cronista, partidas

app = FastAPI(
    title="Crónica de las Cuatro Sendas",
    description="Cuentas, partidas guardadas y el cronista.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ajustes.origenes,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(partidas.router, prefix="/api")
app.include_router(cronista.router, prefix="/api")


@app.get("/api/salud", tags=["servicio"])
async def salud() -> dict[str, object]:
    """Para el healthcheck de docker compose y para saber si el cronista puede escribir."""
    return {"estado": "en pie", "cronista": bool(ajustes.anthropic_api_key)}
