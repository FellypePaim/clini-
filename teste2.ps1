$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZGJid2J3bXdjdmVjYm5mbXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgzNjA3MCwiZXhwIjoyMDg5NDEyMDcwfQ.L0g5LAAW90KM3joY4jUJ1iL8azYYT4-X1-ZN1-4Qjvc"

$body = '{"action":"detect_intent","payload":{"texto":"quero agendar uma consulta de botox"}}'

$headers = @{
    "Authorization" = "Bearer $key"
    "Content-Type"  = "application/json"
}

try {
    $r = Invoke-RestMethod `
        -Uri "https://mddbbwbwmwcvecbnfmqg.supabase.co/functions/v1/ai-gateway" `
        -Method POST `
        -Headers $headers `
        -Body $body
    Write-Host "SUCESSO:" -ForegroundColor Green
    $r | ConvertTo-Json -Depth 5
} catch {
    $s = $_.Exception.Response.GetResponseStream()
    $rd = New-Object System.IO.StreamReader($s)
    Write-Host "ERRO:" -ForegroundColor Red
    Write-Host $rd.ReadToEnd()
}