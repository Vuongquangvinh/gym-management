# Convert detailPackage.css to CSS Module
$cssPath = "d:\git\gym-management\frontend_react\src\features\packages\components\detailPackage\detailPackage.css"
$jsxPath = "d:\git\gym-management\frontend_react\src\features\packages\components\detailPackage\detailPackage.jsx"
$moduleCssPath = "d:\git\gym-management\frontend_react\src\features\packages\components\detailPackage\detailPackage.module.css"

# Read CSS
$cssContent = Get-Content $cssPath -Raw

# Convert class names (kebab-case to camelCase)
$lines = $cssContent -split "`n"
$convertedLines = @()

foreach ($line in $lines) {
    # Skip :root and * selectors
    if ($line -match '^\s*:root' -or $line -match '^\s*\*\s*{') {
        $convertedLines += $line
        continue
    }
    
    # Convert .class-name to .className
    if ($line -match '^\s*\.([a-z][a-z0-9-]+)') {
        $className = $matches[1]
        # Convert to camelCase
        $parts = $className -split '-'
        $camelCase = $parts[0]
        for ($i = 1; $i -lt $parts.Length; $i++) {
            $camelCase += $parts[$i].Substring(0,1).ToUpper() + $parts[$i].Substring(1)
        }
        $line = $line -replace "(\.)$className\b", "`$1$camelCase"
    }
    $convertedLines += $line
}

# Save module CSS
$convertedLines -join "`n" | Set-Content $moduleCssPath -Encoding UTF8
Write-Host "Created: $moduleCssPath" -ForegroundColor Green

# Update JSX
if (Test-Path $jsxPath) {
    $jsxContent = Get-Content $jsxPath -Raw
    $jsxContent = $jsxContent -replace 'import\s+"\.\/DetailPackage\.css";', 'import styles from "./detailPackage.module.css";'
    
    # Update className references
    $classNames = @(
        'detail-package-container',
        'header', 'back-button', 'title', 'action-buttons',
        'btn', 'btn-secondary', 'btn-primary', 'btn-danger',
        'main-content', 'info-card', 'card-header', 'card-title',
        'info-grid', 'info-item', 'info-label', 'info-value',
        'status-badge', 'price-display', 'stats-grid', 'stat-card',
        'stat-icon', 'stat-content', 'stat-label', 'stat-value',
        'active-members-section', 'section-header', 'member-count',
        'search-filter-bar', 'search-box', 'filter-group',
        'members-table-container', 'members-table', 'no-data',
        'action-cell', 'btn-icon', 'btn-edit', 'btn-delete',
        'pagination', 'page-info', 'page-controls', 'page-button'
    )
    
    foreach ($className in $classNames) {
        $parts = $className -split '-'
        $camelCase = $parts[0]
        for ($i = 1; $i -lt $parts.Length; $i++) {
            $camelCase += $parts[$i].Substring(0,1).ToUpper() + $parts[$i].Substring(1)
        }
        $jsxContent = $jsxContent -replace "className=`"$className`"", "className={styles.$camelCase}"
        $jsxContent = $jsxContent -replace "className=`"([^`"]*\s)?$className(\s[^`"]*)?`"", {
            param($match)
            $full = $match.Groups[0].Value
            if ($full -match '\s') {
                # Multiple classes - need template literal
                $full -replace "$className", "{styles.$camelCase}"
            } else {
                "className={styles.$camelCase}"
            }
        }
    }
    
    $jsxContent | Set-Content $jsxPath -Encoding UTF8
    Write-Host "Updated: $jsxPath" -ForegroundColor Green
}

# Delete old CSS
Remove-Item $cssPath -Force
Write-Host "Deleted: $cssPath" -ForegroundColor Yellow
Write-Host "Done!" -ForegroundColor Magenta
