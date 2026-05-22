Set-Location (Join-Path $PSScriptRoot "frontend")

$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js/npm no encontrado. Instale desde https://nodejs.org/ o ejecute:" -ForegroundColor Red
    Write-Host "  winget install OpenJS.NodeJS.LTS" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path ".\node_modules")) {
    Write-Host "Instalando dependencias..."
    npm install
}

Write-Host ""
Write-Host "  React SPA:  http://localhost:5173/" -ForegroundColor Green
Write-Host "  (Requiere backend en http://127.0.0.1:8000 - ejecute start-backend.ps1)" -ForegroundColor Yellow
Write-Host ""
npm run dev
