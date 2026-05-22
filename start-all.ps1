Set-Location $PSScriptRoot
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

Write-Host "=== COOPTECH RISK-CORE ===" -ForegroundColor Cyan
Write-Host "Levantando Backend (Django :8000) y Frontend (Vite :5173)..." -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path ".\.venv\Scripts\python.exe")) {
    python -m venv .venv
    .\.venv\Scripts\pip install -r requirements.txt
}

if (-not (Test-Path ".\frontend\node_modules")) {
    Push-Location frontend
    npm install
    Pop-Location
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; .\.venv\Scripts\python manage.py runserver 127.0.0.1:8000 --noreload"
Start-Sleep -Seconds 3
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "  Frontend:  http://localhost:5173/" -ForegroundColor Green
Write-Host "  Backend:   http://127.0.0.1:8000/api/dashboard/analisis/" -ForegroundColor Green
Write-Host ""
Write-Host "Primera carga de datos: 2-3 min (sincroniza Supabase). Luego es rapido." -ForegroundColor Yellow
Write-Host "Abra: http://localhost:5173/" -ForegroundColor Green
