# Test Chat Notification API
# PowerShell script

Write-Host "🧪 Testing Chat Notification API..." -ForegroundColor Cyan

$backendUrl = "http://localhost:3000/api/chat/notification"

# Test data
$body = @{
    chatId = "pt123_client456"
    senderId = "pt123"
    receiverId = "client456"
    messageText = "Test notification from PowerShell"
} | ConvertTo-Json

Write-Host "`n📤 Sending request to: $backendUrl" -ForegroundColor Yellow
Write-Host "📦 Body:" -ForegroundColor Yellow
Write-Host $body -ForegroundColor White

try {
    $response = Invoke-RestMethod -Uri $backendUrl -Method Post -Body $body -ContentType "application/json"
    
    Write-Host "`n✅ Success!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "`n❌ Error!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`nIs backend running? Try: cd backend\src; node server.js" -ForegroundColor Yellow
}
