# Script de prueba para webhooks de Aircall
# Ejecuta: .\test-webhook.ps1

$baseUrl = "http://localhost:3001"

Write-Host "Probando Webhook de Aircall..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Llamada finalizada
Write-Host "Test 1: Llamada contestada y finalizada" -ForegroundColor Yellow

$body = @{
    event     = "call.ended"
    timestamp = 1702742400
    token     = "sebatianeunmamagranaso12345"
    data      = @{
        id          = 12345
        direct_link = "https://dashboard.aircall.io/calls/12345"
        status      = "done"
        direction   = "inbound"
        started_at  = 1702742300
        answered_at = 1702742305
        ended_at    = 1702742400
        duration    = 95
        from        = "+34612345678"
        to          = "+34987654321"
        user        = @{
            id    = 1
            name  = "Juan Pérez"
            email = "juan@example.com"
        }
        recording   = "https://api.aircall.io/recordings/abc123.mp3"
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/webhooks/aircall" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✅ Respuesta: $($response | ConvertTo-Json)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# Test 2: Llamada perdida
Write-Host "Test 2: Llamada perdida" -ForegroundColor Yellow

$body2 = @{
    event     = "call.ended"
    timestamp = 1702742500
    token     = "test-webhook-token"
    data      = @{
        id                 = 12346
        status             = "done"
        direction          = "inbound"
        started_at         = 1702742450
        ended_at           = 1702742500
        duration           = 0
        from               = "+34611111111"
        to                 = "+34987654321"
        missed_call_reason = "short_abandoned"
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/webhooks/aircall" -Method Post -Body $body2 -ContentType "application/json"
    Write-Host "✅ Respuesta: $($response | ConvertTo-Json)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# Test 3: Voicemail
Write-Host "Test 3: Llamada con voicemail" -ForegroundColor Yellow

$body3 = @{
    event     = "call.ended"
    timestamp = 1702742600
    token     = "test-webhook-token"
    data      = @{
        id         = 12347
        status     = "done"
        direction  = "inbound"
        started_at = 1702742550
        ended_at   = 1702742600
        from       = "+34622222222"
        to         = "+34987654321"
        voicemail  = "https://api.aircall.io/voicemails/xyz789.mp3"
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/webhooks/aircall" -Method Post -Body $body3 -ContentType "application/json"
    Write-Host "✅ Respuesta: $($response | ConvertTo-Json)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Pruebas completadas!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para ver los datos guardados, consulta la base de datos:" -ForegroundColor White
Write-Host "   SELECT * FROM webhook_events ORDER BY receivedAt DESC LIMIT 5;" -ForegroundColor Gray
Write-Host "   SELECT * FROM calls ORDER BY createdAt DESC LIMIT 5;" -ForegroundColor Gray
