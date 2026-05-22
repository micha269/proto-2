Set-Location $PSScriptRoot

if (-not (Test-Path ".\.env")) {
    Write-Host "Creando .env desde .env.example ..." -ForegroundColor Yellow
    Copy-Item ".\.env.example" ".\.env"
    Write-Host "Edite .env con sus credenciales de Supabase y Groq antes de continuar." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker no esta instalado. Instale Docker Desktop:" -ForegroundColor Red
    Write-Host "  https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

Write-Host "Construyendo e iniciando CoopTech RISK-CORE (Docker)..." -ForegroundColor Cyan
docker compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "  Panel web:  http://localhost:5173/" -ForegroundColor Green
    Write-Host "  API:        http://localhost:8000/api/ping/" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Ver logs:   docker compose logs -f" -ForegroundColor Gray
    Write-Host "  Detener:    docker compose down" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  La primera sincronizacion con Supabase puede tardar 2-3 minutos." -ForegroundColor Yellow
}
