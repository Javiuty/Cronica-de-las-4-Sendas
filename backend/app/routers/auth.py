"""Registro, entrada y preferencias del jugador."""

from fastapi import APIRouter, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from ..config import ajustes
from ..deps import SesionDb, UsuarioActual
from ..limites import Ventana, ip_de
from ..models import Usuario
from ..schemas import LoginIn, PreferenciasIn, RegistroIn, TokenOut, UsuarioOut
from ..security import crear_token, hashear, verificar

router = APIRouter(prefix="/auth", tags=["cuentas"])

# Hash de descarte: al entrar con un correo que no existe se comprueba contra
# este, para que la respuesta tarde lo mismo y no delate qué correos hay dados
# de alta.
_SENUELO = hashear("ningun-jugador-usa-esta-contrasena")

# Sin esto, cualquiera crea cuentas en bucle y cada una estrena su cupo de
# encrucijadas: el límite por jugador no serviría de nada.
_registros = Ventana(ajustes.tope_registros_por_ip, 3600)
# El login es caro a propósito (argon2), así que machacarlo también es una forma
# de tumbar la máquina, no solo de probar contraseñas.
_logins = Ventana(ajustes.tope_logins_por_ip, 300)


def _frenar(ventana: Ventana, peticion: Request, mensaje: str) -> None:
    if not ventana.admite(ip_de(peticion)):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=mensaje)


def _respuesta(usuario: Usuario) -> TokenOut:
    return TokenOut(token=crear_token(usuario.id), usuario=UsuarioOut.model_validate(usuario))


@router.post("/registro", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
async def registro(datos: RegistroIn, sesion: SesionDb, peticion: Request) -> TokenOut:
    _frenar(_registros, peticion, "Demasiadas cuentas nuevas desde aquí. Prueba dentro de un rato.")
    usuario = Usuario(
        correo=datos.correo.strip().lower(),
        nombre=datos.nombre.strip(),
        hash_contrasena=hashear(datos.contrasena),
        preferencias={},
    )
    sesion.add(usuario)
    try:
        await sesion.commit()
    except IntegrityError:
        await sesion.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya hay una cuenta con ese correo.",
        ) from None
    await sesion.refresh(usuario)
    return _respuesta(usuario)


@router.post("/login", response_model=TokenOut)
async def login(datos: LoginIn, sesion: SesionDb, peticion: Request) -> TokenOut:
    _frenar(_logins, peticion, "Demasiados intentos desde aquí. Prueba dentro de un rato.")
    correo = datos.correo.strip().lower()
    fila = await sesion.execute(select(Usuario).where(Usuario.correo == correo))
    usuario = fila.scalar_one_or_none()

    if usuario is None or not verificar(datos.contrasena, usuario.hash_contrasena):
        if usuario is None:
            verificar(datos.contrasena, _SENUELO)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos.",
        )
    return _respuesta(usuario)


@router.get("/yo", response_model=UsuarioOut)
async def yo(usuario: UsuarioActual) -> UsuarioOut:
    return UsuarioOut.model_validate(usuario)


@router.put("/yo/preferencias", response_model=UsuarioOut)
async def guardar_preferencias(
    preferencias: PreferenciasIn, usuario: UsuarioActual, sesion: SesionDb
) -> UsuarioOut:
    """Música, dificultad, duración, sellos, efectos y ambiente."""
    usuario.preferencias = preferencias.model_dump(mode="json", by_alias=True)
    await sesion.commit()
    await sesion.refresh(usuario)
    return UsuarioOut.model_validate(usuario)
