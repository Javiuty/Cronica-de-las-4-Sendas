#!/bin/sh
# Pone la base al día y levanta el servidor. Los argumentos extra van a uvicorn
# (docker compose le pasa --reload en desarrollo).
set -e

echo "Aplicando migraciones..."
alembic upgrade head

echo "Levantando el backend en el puerto 8000..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 "$@"
