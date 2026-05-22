#!/bin/sh
set -e
cd /app
mkdir -p .cache
python manage.py migrate --run-syncdb 2>/dev/null || true
echo "Backend CoopTech RISK-CORE en http://0.0.0.0:8000"
exec gunicorn cooptech.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 2 \
  --threads 4 \
  --timeout 300 \
  --access-logfile - \
  --error-logfile -
