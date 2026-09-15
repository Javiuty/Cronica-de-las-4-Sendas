"""La partida en curso y el historial de crónicas cerradas.

Un jugador tiene como mucho una partida sin terminar: guardar es siempre
escribir encima de esa, igual que hacía `localStorage`.
"""

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select

from ..deps import SesionDb, UsuarioActual
from ..models import Partida, Usuario
from ..schemas import CierreIn, CronicaResumen, PartidaIn, PartidaOut

router = APIRouter(prefix="/partidas", tags=["partidas"])


async def _en_curso(sesion: SesionDb, usuario: Usuario) -> Partida | None:
    fila = await sesion.execute(
        select(Partida).where(Partida.usuario_id == usuario.id, Partida.terminada.is_(False))
    )
    return fila.scalar_one_or_none()


@router.get("", response_model=list[CronicaResumen])
async def historial(usuario: UsuarioActual, sesion: SesionDb) -> list[CronicaResumen]:
    """Las crónicas ya cerradas, de la más reciente a la más vieja."""
    filas = await sesion.execute(
        select(Partida)
        .where(Partida.usuario_id == usuario.id, Partida.terminada.is_(True))
        .order_by(Partida.actualizada_en.desc())
        .limit(50)
    )
    return [CronicaResumen.model_validate(p) for p in filas.scalars()]


@router.get("/en-curso", response_model=PartidaOut | None)
async def leer(usuario: UsuarioActual, sesion: SesionDb) -> PartidaOut | None:
    partida = await _en_curso(sesion, usuario)
    return PartidaOut.model_validate(partida) if partida else None


@router.put("/en-curso", response_model=PartidaOut)
async def guardar(datos: PartidaIn, usuario: UsuarioActual, sesion: SesionDb) -> PartidaOut:
    """Crea la partida en curso o escribe encima de la que hubiera."""
    partida = await _en_curso(sesion, usuario)
    if partida is None:
        partida = Partida(usuario_id=usuario.id)
        sesion.add(partida)

    # Los nombres de `PartidaIn` son los de las columnas, uno a uno.
    for campo, valor in datos.model_dump(mode="json").items():
        setattr(partida, campo, valor)

    await sesion.commit()
    await sesion.refresh(partida)
    return PartidaOut.model_validate(partida)


@router.post("/en-curso/cierre", response_model=PartidaOut)
async def cerrar(cierre: CierreIn, usuario: UsuarioActual, sesion: SesionDb) -> PartidaOut:
    """Cierra el libro: la partida pasa al historial y deja de ser la de en curso."""
    partida = await _en_curso(sesion, usuario)
    if partida is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No hay ninguna partida en curso."
        )

    partida.terminada = True
    partida.muerto = cierre.muerto
    partida.titulo_final = cierre.titulo_final
    partida.epilogo = cierre.epilogo

    await sesion.commit()
    await sesion.refresh(partida)
    return PartidaOut.model_validate(partida)


@router.delete("/en-curso", status_code=status.HTTP_204_NO_CONTENT)
async def borrar(usuario: UsuarioActual, sesion: SesionDb) -> Response:
    """Tira la partida en curso sin guardarla en el historial."""
    partida = await _en_curso(sesion, usuario)
    if partida is not None:
        await sesion.delete(partida)
        await sesion.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
