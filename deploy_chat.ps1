# Deploy Chat Feature to Firebase
# PowerShell script để deploy Firestore rules và indexes cho chat feature

Write-Host "🚀 Deploying Chat Feature to Firebase..." -ForegroundColor Cyan
Write-Host ""

# Di chuyển vào thư mục backend
Set-Location -Path "backend" -ErrorAction Stop

Write-Host "📝 Step 1: Deploying Firestore Rules..." -ForegroundColor Yellow
firebase deploy --only firestore:rules

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Firestore rules deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to deploy Firestore rules" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📊 Step 2: Deploying Firestore Indexes..." -ForegroundColor Yellow
firebase deploy --only firestore:indexes

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Firestore indexes deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to deploy Firestore indexes" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Chat Feature deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Test chat functionality in the React app"
Write-Host "2. Verify indexes are created in Firebase Console"
Write-Host "3. Check Firestore rules in Firebase Console > Firestore > Rules"
Write-Host ""
Write-Host "📖 Documentation:" -ForegroundColor Cyan
Write-Host "- CHAT_USAGE_GUIDE.md - Hướng dẫn sử dụng"
Write-Host "- CHAT_FIRESTORE_SETUP.md - Chi tiết setup"

# Quay lại thư mục gốc
Set-Location -Path ".."
