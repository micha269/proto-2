#!/bin/sh
set -e
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "Creando .env desde .env.example ..."
  cp .env.example .env
  echo "Edite .env con sus credenciales antes de continuar."
  exit 1
fi

echo "Construyendo e iniciando CoopTech RISK-CORE (Docker)..."
docker compose up --build -d

echo ""
echo "  Panel web:  http://localhost:5173/"
echo "  API:        http://localhost:8000/api/ping/"
echo "  Ver logs:   docker compose logs -f"
echo "  Detener:    docker compose down"
