# 🎭 Mock Data Quick Start (PowerShell)
# Chạy: .\mock-data.ps1

param(
    [Parameter(Position=0)]
    [ValidateSet("seed", "cleanup", "menu", "help")]
    [string]$Command = "menu"
)

$ErrorActionPreference = "Stop"
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

function Show-Banner {
    Clear-Host
    Write-Host "🎭 ══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "🎭  GYM MANAGEMENT - MOCK DATA SYSTEM" -ForegroundColor Cyan
    Write-Host "🎭 ══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Help {
    Write-Host "📚 MOCK DATA SYSTEM - USAGE" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "PowerShell Commands:" -ForegroundColor Green
    Write-Host "  .\mock-data.ps1 seed      - Generate mock data"
    Write-Host "  .\mock-data.ps1 cleanup   - Delete all mock data"
    Write-Host "  .\mock-data.ps1 menu      - Interactive menu"
    Write-Host "  .\mock-data.ps1 help      - Show this help"
    Write-Host ""
    Write-Host "NPM Commands:" -ForegroundColor Green
    Write-Host "  npm run seed              - Generate mock data"
    Write-Host "  npm run cleanup           - Delete all mock data"
    Write-Host "  npm run mock:menu         - Interactive menu"
    Write-Host ""
    Write-Host "Node Commands:" -ForegroundColor Green
    Write-Host "  node scripts/seed-mock-data.js"
    Write-Host "  node scripts/cleanup-mock-data.js"
    Write-Host "  node scripts/quick-start.js"
    Write-Host ""
    Write-Host "📖 Full Documentation: MOCK_DATA_GUIDE.md" -ForegroundColor Cyan
    Write-Host ""
}

function Invoke-Seed {
    Write-Host "🚀 Generating Mock Data..." -ForegroundColor Green
    Write-Host ""
    
    Push-Location $scriptPath
    try {
        node scripts/seed-mock-data.js
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Mock data generated successfully!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "❌ Error generating mock data" -ForegroundColor Red
            exit 1
        }
    } finally {
        Pop-Location
    }
}

function Invoke-Cleanup {
    Write-Host "🗑️  Cleaning Up Mock Data..." -ForegroundColor Yellow
    Write-Host ""
    
    Push-Location $scriptPath
    try {
        node scripts/cleanup-mock-data.js
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Mock data cleaned up successfully!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "❌ Error cleaning up mock data" -ForegroundColor Red
            exit 1
        }
    } finally {
        Pop-Location
    }
}

function Invoke-Menu {
    Push-Location $scriptPath
    try {
        node scripts/quick-start.js
    } finally {
        Pop-Location
    }
}

# Main execution
Show-Banner

switch ($Command) {
    "seed" {
        Invoke-Seed
    }
    "cleanup" {
        Invoke-Cleanup
    }
    "menu" {
        Invoke-Menu
    }
    "help" {
        Show-Help
    }
    default {
        Show-Help
    }
}

Write-Host ""
Write-Host "👋 Done!" -ForegroundColor Cyan
Write-Host ""
