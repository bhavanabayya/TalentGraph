# Seed Data Runner Script for TalentGraph
# ========================================
# This script activates the virtual environment and runs the seed data script

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "    TalentGraph - Seed Data Runner" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the backend directory
$currentDir = Get-Location
if (-not (Test-Path ".\app\models.py")) {
    Write-Host "❌ Error: Please run this script from the backend directory" -ForegroundColor Red
    Write-Host "Current directory: $currentDir" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Usage: cd backend && .\run_seed_data.ps1" -ForegroundColor Yellow
    exit 1
}

# Check if virtual environment exists
if (-not (Test-Path ".\venv\Scripts\Activate.ps1")) {
    Write-Host "❌ Error: Virtual environment not found" -ForegroundColor Red
    Write-Host "Please create a virtual environment first:" -ForegroundColor Yellow
    Write-Host "  python -m venv venv" -ForegroundColor Yellow
    Write-Host "  .\venv\Scripts\Activate.ps1" -ForegroundColor Yellow
    Write-Host "  pip install -r requirements.txt" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Activating virtual environment..." -ForegroundColor Green
& .\venv\Scripts\Activate.ps1

Write-Host "✓ Running seed data script..." -ForegroundColor Green
Write-Host ""

python seed_data.py

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "    ✅ Seed Data Created Successfully!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Start the backend server:" -ForegroundColor White
    Write-Host "     uvicorn app.main:app --reload" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  2. Start the frontend:" -ForegroundColor White
    Write-Host "     cd ..\react-frontend" -ForegroundColor Yellow
    Write-Host "     npm start" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  3. Login with the provided credentials" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "    ❌ Seed Data Creation Failed" -ForegroundColor Red
    Write-Host "================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the error messages above" -ForegroundColor Yellow
    exit 1
}
