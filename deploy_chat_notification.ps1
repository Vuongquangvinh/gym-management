# Deploy Chat Notification Cloud Function
# PowerShell script

Write-Host "🚀 Deploying Chat Notification Cloud Function..." -ForegroundColor Cyan

# Navigate to functions directory
Set-Location backend\functions

# Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Build TypeScript
Write-Host "`n🔨 Building TypeScript..." -ForegroundColor Yellow
npm run build

# Deploy to Firebase
Write-Host "`n☁️ Deploying to Firebase..." -ForegroundColor Yellow
firebase deploy --only functions:onNewChatMessage

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Open Flutter app and send a chat message" -ForegroundColor White
Write-Host "2. Check Firebase Console → Functions → onNewChatMessage" -ForegroundColor White
Write-Host "3. View logs: firebase functions:log --only onNewChatMessage" -ForegroundColor White
