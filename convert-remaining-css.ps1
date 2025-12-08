# Convert remaining CSS files to CSS Modules
$ErrorActionPreference = "Continue"

function Convert-ToCamelCase {
    param([string]$text)
    $parts = $text -split '-'
    $result = $parts[0]
    for ($i = 1; $i -lt $parts.Length; $i++) {
        $result += $parts[$i].Substring(0,1).ToUpper() + $parts[$i].Substring(1)
    }
    return $result
}

function Convert-CSSToModule {
    param(
        [string]$cssPath,
        [string]$jsxPath
    )
    
    Write-Host "Converting: $cssPath" -ForegroundColor Cyan
    
    $cssFileName = Split-Path $cssPath -Leaf
    $cssDir = Split-Path $cssPath -Parent
    $moduleCssName = $cssFileName -replace '\.css$', '.module.css'
    $moduleCssPath = Join-Path $cssDir $moduleCssName
    
    # Read and convert CSS
    $cssContent = Get-Content $cssPath -Raw
    $lines = $cssContent -split "`n"
    $convertedLines = @()
    
    foreach ($line in $lines) {
        if ($line -match '^\s*\.([a-z][a-z0-9-]+)(\s|{|$)') {
            $className = $matches[1]
            $camelCase = Convert-ToCamelCase $className
            $line = $line -replace "(\.)$className\b", "`$1$camelClass"
        }
        $convertedLines += $line
    }
    
    $convertedLines -join "`n" | Set-Content $moduleCssPath -Encoding UTF8
    Write-Host "  Created: $moduleCssPath" -ForegroundColor Green
    
    # Convert JSX
    if (Test-Path $jsxPath) {
        $jsxContent = Get-Content $jsxPath -Raw
        $baseName = $cssFileName -replace '\.css$', ''
        
        # Update import
        $jsxContent = $jsxContent -replace "import\s+['""]\./$baseName\.css['""];?", "import styles from './$($baseName).module.css';"
        
        # Convert className
        $jsxContent = $jsxContent -replace 'className="([a-z][a-z0-9-]+)"', {
            param($match)
            $originalClass = $match.Groups[1].Value
            $camelClass = Convert-ToCamelCase $originalClass
            "className={styles.$camelClass}"
        }
        
        $jsxContent | Set-Content $jsxPath -Encoding UTF8
        Write-Host "  Updated: $jsxPath" -ForegroundColor Green
    }
    
    # Delete old CSS
    Remove-Item $cssPath -Force
    Write-Host "  Deleted: $cssPath" -ForegroundColor Yellow
}

# List of remaining files
$files = @(
    @{
        css = "d:\git\gym-management\frontend_react\src\pages\financial\FinancialDashboard.css"
        jsx = "d:\git\gym-management\frontend_react\src\pages\financial\FinancialDashboard.jsx"
    },
    @{
        css = "d:\git\gym-management\frontend_react\src\features\payment\paymentHistory\paymentHistory.css"
        jsx = "d:\git\gym-management\frontend_react\src\features\payment\paymentHistory\paymentHistory.jsx"
    },
    @{
        css = "d:\git\gym-management\frontend_react\src\features\packages\components\packageTable\packageTable.css"
        jsx = "d:\git\gym-management\frontend_react\src\features\packages\components\packageTable\packageTable.jsx"
    },
    @{
        css = "d:\git\gym-management\frontend_react\src\features\admin\components\DetailMember.css"
        jsx = "d:\git\gym-management\frontend_react\src\features\admin\components\DetailMember.jsx"
    },
    @{
        css = "d:\git\gym-management\frontend_react\src\features\admin\components\DataTableCheckin.css"
        jsx = "d:\git\gym-management\frontend_react\src\features\admin\components\DataTableCheckin.jsx"
    }
)

Write-Host "`n=== Converting remaining CSS files ===" -ForegroundColor Magenta
foreach ($file in $files) {
    if (Test-Path $file.css) {
        try {
            Convert-CSSToModule -cssPath $file.css -jsxPath $file.jsx
            Write-Host ""
        } catch {
            Write-Host "FAILED: $($file.css)" -ForegroundColor Red
            Write-Host "Error: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "NOT FOUND: $($file.css)" -ForegroundColor Yellow
    }
}
Write-Host "=== Done! ===" -ForegroundColor Magenta
