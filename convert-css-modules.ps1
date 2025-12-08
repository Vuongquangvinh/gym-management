# CSS Modules Conversion Script
# Automatically converts all remaining CSS files to CSS Modules

$ErrorActionPreference = "Continue"

# Function to convert kebab-case to camelCase
function Convert-ToCamelCase {
    param([string]$text)
    $parts = $text -split '-'
    $result = $parts[0]
    for ($i = 1; $i -lt $parts.Length; $i++) {
        $result += $parts[$i].Substring(0,1).ToUpper() + $parts[$i].Substring(1)
    }
    return $result
}

# Function to convert CSS file
function Convert-CSSFile {
    param(
        [string]$cssPath,
        [string]$jsxPath
    )
    
    Write-Host "Converting: $cssPath" -ForegroundColor Cyan
    
    # Get file names
    $cssFileName = Split-Path $cssPath -Leaf
    $cssDir = Split-Path $cssPath -Parent
    $moduleCssName = $cssFileName -replace '\.css$', '.module.css'
    $moduleCssPath = Join-Path $cssDir $moduleCssName
    
    # Read CSS content
    $cssContent = Get-Content $cssPath -Raw
    
    # Convert class names from kebab-case to camelCase
    $lines = $cssContent -split "`n"
    $convertedLines = @()
    
    foreach ($line in $lines) {
        if ($line -match '^\s*\.([a-z][a-z0-9-]+)\s*\{?\s*$' -or $line -match '^\s*\.([a-z][a-z0-9-]+)\s+') {
            $className = $matches[1]
            $camelCase = Convert-ToCamelCase $className
            $line = $line -replace "(\.)$className\b", "`$1$camelCase"
        }
        $convertedLines += $line
    }
    
    # Write module CSS
    $convertedLines -join "`n" | Set-Content $moduleCssPath -Encoding UTF8
    
    # Update JSX file
    if (Test-Path $jsxPath) {
        $jsxContent = Get-Content $jsxPath -Raw
        
        # Update import
        $baseName = $cssFileName -replace '\.css$', ''
        $jsxContent = $jsxContent -replace "import\s+['""]\./$baseName\.css['""];?", "import styles from './$($baseName).module.css';"
        
        # Update className references (simple pattern replacement)
        $jsxContent = $jsxContent -replace 'className="([a-z][a-z0-9-]+)"', {
            param($match)
            $originalClass = $match.Groups[1].Value
            $camelClass = Convert-ToCamelCase $originalClass
            "className={styles.$camelClass}"
        }
        
        $jsxContent | Set-Content $jsxPath -Encoding UTF8
        Write-Host "  Updated JSX: $jsxPath" -ForegroundColor Green
    }
    
    # Delete old CSS
    Remove-Item $cssPath -Force
    Write-Host "  Deleted old CSS: $cssPath" -ForegroundColor Yellow
    Write-Host "  Created module: $moduleCssPath" -ForegroundColor Green
    Write-Host ""
}

# List of files to convert
$filesToConvert = @(
    @{
        css = "d:\git\gym-management\frontend_react\src\features\pt\components\PTFaceRegistrationModal.css"
        jsx = "d:\git\gym-management\frontend_react\src\features\pt\components\PTFaceRegistrationModal.jsx"
    },
    @{
        css = "d:\git\gym-management\frontend_react\src\features\pt\components\PTFaceCheckinModal.css"
        jsx = "d:\git\gym-management\frontend_react\src\features\pt\components\PTFaceCheckinModal.jsx"
    },
    @{
        css = "d:\git\gym-management\frontend_react\src\features\admin\components\CheckinDashboard.css"
        jsx = "d:\git\gym-management\frontend_react\src\features\admin\components\CheckinDashboard.jsx"
    },
    @{
        css = "d:\git\gym-management\frontend_react\src\features\admin\components\pt\PTPricingPage.css"
        jsx = "d:\git\gym-management\frontend_react\src\features\admin\components\pt\PTPricingPage.jsx"
    },
    @{
        css = "d:\git\gym-management\frontend_react\src\features\pt\components\PTChat.css"
        jsx = "d:\git\gym-management\frontend_react\src\features\pt\components\PTChat.jsx"
    },
    @{
        css = "d:\git\gym-management\frontend_react\src\features\pt\components\ClientDetailModal.css"
        jsx = "d:\git\gym-management\frontend_react\src\features\pt\components\ClientDetailModal.jsx"
    },
    @{
        css = "d:\git\gym-management\frontend_react\src\features\admin\components\pt\PTInfoModal.css"
        jsx = "d:\git\gym-management\frontend_react\src\features\admin\components\pt\PTInfoModal.jsx"
    },
    @{
        css = "d:\git\gym-management\frontend_react\src\features\admin\pages\Employees.css"
        jsx = "d:\git\gym-management\frontend_react\src\features\admin\pages\Employees.jsx"
    },
    @{
        css = "d:\git\gym-management\frontend_react\src\features\admin\components\pt\TimeSlotManager.css"
        jsx = "d:\git\gym-management\frontend_react\src\features\admin\components\pt\TimeSlotManager.jsx"
    },
    @{
        css = "d:\git\gym-management\frontend_react\src\features\admin\components\AddEmployeeModal.css"
        jsx = "d:\git\gym-management\frontend_react\src\features\admin\components\AddEmployeeModal.jsx"
    },
    @{
        css = "d:\git\gym-management\frontend_react\src\features\admin\pages\SchedulePage.css"
        jsx = "d:\git\gym-management\frontend_react\src\features\admin\pages\SchedulePage.jsx"
    },
    @{
        css = "d:\git\gym-management\frontend_react\src\features\admin\pages\FaceCheckinPage.css"
        jsx = "d:\git\gym-management\frontend_react\src\features\admin\pages\FaceCheckinPage.jsx"
    },
    @{
        css = "d:\git\gym-management\frontend_react\src\features\admin\components\pt\PTPricingModal.css"
        jsx = "d:\git\gym-management\frontend_react\src\features\admin\components\pt\PTPricingModal.jsx"
    },
    @{
        css = "d:\git\gym-management\frontend_react\src\features\pt\pages\PTSchedule.css"
        jsx = "d:\git\gym-management\frontend_react\src\features\pt\pages\PTSchedule.jsx"
    }
)

Write-Host "=== CSS Modules Bulk Conversion ===" -ForegroundColor Magenta
Write-Host "Converting $($filesToConvert.Count) files..." -ForegroundColor Magenta
Write-Host ""

$converted = 0
$failed = 0

foreach ($file in $filesToConvert) {
    if (Test-Path $file.css) {
        try {
            Convert-CSSFile -cssPath $file.css -jsxPath $file.jsx
            $converted++
        } catch {
            Write-Host "FAILED: $($file.css)" -ForegroundColor Red
            Write-Host "  Error: $_" -ForegroundColor Red
            $failed++
        }
    } else {
        Write-Host "SKIPPED (not found): $($file.css)" -ForegroundColor Yellow
    }
}

Write-Host "=== Conversion Complete ===" -ForegroundColor Magenta
Write-Host "Converted: $converted files" -ForegroundColor Green
Write-Host "Failed: $failed files" -ForegroundColor Red
Write-Host ""
Write-Host "Note: You may need to manually fix:"  -ForegroundColor Yellow
Write-Host "  - Dynamic class names"  -ForegroundColor Yellow
Write-Host "  - Conditional class names"  -ForegroundColor Yellow
Write-Host "  - Third-party library classes (:global wrapper)"  -ForegroundColor Yellow
