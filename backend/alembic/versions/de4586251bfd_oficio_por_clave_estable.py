"""oficio por clave estable

Hasta ahora el oficio se guardaba como índice de la lista OFICIOS. Si esa lista
se reordena o se le inserta una clase por en medio, las partidas guardadas
pasan a apuntar a otro oficio sin decir nada. La clave («mercenario»,
«cazador»…) no se mueve.

El relleno usa el orden que tenía OFICIOS cuando se escribió esta migración;
está a propósito escrito a mano y no importado del código, para que siga siendo
correcto aunque la lista cambie después.

Revision ID: de4586251bfd
Revises: b571c8a23e27
Create Date: 2026-09-15 21:51:55.627069

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'de4586251bfd'
down_revision: Union[str, Sequence[str], None] = 'b571c8a23e27'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# El orden de OFICIOS en el momento de esta migración.
CLAVES_POR_INDICE = {0: 'mercenario', 1: 'ladron', 2: 'fraile', 3: 'cazador'}


def upgrade() -> None:
    op.add_column('partidas', sa.Column('oficio_clave', sa.String(length=30), server_default='', nullable=False))

    for indice, clave in CLAVES_POR_INDICE.items():
        op.execute(
            sa.text("UPDATE partidas SET oficio_clave = :clave WHERE oficio = :indice AND oficio_clave = ''")
            .bindparams(clave=clave, indice=indice)
        )


def downgrade() -> None:
    # `oficio` nunca dejó de escribirse, así que no se pierde nada al volver.
    op.drop_column('partidas', 'oficio_clave')
