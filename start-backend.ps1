Set-Location $PSScriptRoot
if (-not (Test-Path ".\.venv\Scripts\python.exe")) {
    python -m venv .venv
    .\.venv\Scripts\pip install -r requirements.txt
}
.\.venv\Scripts\python manage.py migrate --run-syncdb | Out-Null
Write-Host "Iniciando Django en http://127.0.0.1:8000 ..."
Write-Host ""
Write-Host "  API activa en :8000 — deje esta ventana ABIERTA" -ForegroundColor Green
Write-Host "  Luego en OTRA terminal:  .\start-frontend.ps1" -ForegroundColor Cyan
Write-Host "  Abrir navegador:          http://localhost:5173/" -ForegroundColor Green
Write-Host ""
.\.venv\Scripts\python manage.py runserver 127.0.0.1:8000 --noreload
