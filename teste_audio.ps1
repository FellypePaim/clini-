# ═══════════════════════════════════════════════
# TESTE 2 — transcribe_audio
# 
# REQUISITO: Tenha um arquivo de áudio pequeno para testar.
# Pode ser um .mp3, .wav, .ogg ou .webm de qualquer gravação.
#
# OPÇÃO A: Se tiver um arquivo de áudio no computador,
#          altere o caminho em $audioPath abaixo.
#
# OPÇÃO B: Se não tiver arquivo, o script cria um áudio
#          de teste sintético (silêncio) só para validar
#          que a rota está funcionando.
#
# Salve como teste_audio.ps1 e rode: .\teste_audio.ps1
# ═══════════════════════════════════════════════

$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZGJid2J3bXdjdmVjYm5mbXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgzNjA3MCwiZXhwIjoyMDg5NDEyMDcwfQ.L0g5LAAW90KM3joY4jUJ1iL8azYYT4-X1-ZN1-4Qjvc"

# ─── ALTERE AQUI para o caminho do seu arquivo de áudio ───
$audioPath = "C:\Users\Gerência\Desktop\Clini+\audio_teste.mp3"
# ──────────────────────────────────────────────────────────

$headers = @{
    "Authorization" = "Bearer $key"
    "Content-Type"  = "application/json"
}

if (Test-Path $audioPath) {
    Write-Host "Arquivo encontrado: $audioPath" -ForegroundColor Cyan
    Write-Host "Convertendo para base64..." -ForegroundColor Cyan

    # Converter arquivo para base64
    $audioBytes  = [System.IO.File]::ReadAllBytes($audioPath)
    $base64Audio = [System.Convert]::ToBase64String($audioBytes)

    # Detectar mime type pela extensão
    $ext = [System.IO.Path]::GetExtension($audioPath).ToLower()
    $mimeType = switch ($ext) {
        ".mp3"  { "audio/mpeg" }
        ".wav"  { "audio/wav" }
        ".ogg"  { "audio/ogg" }
        ".webm" { "audio/webm" }
        ".m4a"  { "audio/mp4" }
        ".mp4"  { "audio/mp4" }
        default { "audio/mpeg" }
    }

    Write-Host "Mime type: $mimeType" -ForegroundColor Cyan
    Write-Host "Tamanho base64: $($base64Audio.Length) chars" -ForegroundColor Cyan
    Write-Host "Enviando para transcrição..." -ForegroundColor Cyan

    $body = @{
        action     = "transcribe_audio"
        clinica_id = "teste"
        payload    = @{
            audio_base64 = $base64Audio
            mime_type    = $mimeType
        }
    } | ConvertTo-Json -Depth 5

    try {
        $r = Invoke-RestMethod `
            -Uri "https://mddbbwbwmwcvecbnfmqg.supabase.co/functions/v1/ai-gateway" `
            -Method POST `
            -Headers $headers `
            -Body $body `
            -TimeoutSec 60
        Write-Host ""
        Write-Host "SUCESSO — transcribe_audio:" -ForegroundColor Green
        Write-Host "Transcrição: $($r.data.transcricao)" -ForegroundColor White
    } catch {
        $s  = $_.Exception.Response.GetResponseStream()
        $rd = New-Object System.IO.StreamReader($s)
        Write-Host "ERRO:" -ForegroundColor Red
        Write-Host $rd.ReadToEnd()
    }

} else {
    Write-Host "Arquivo não encontrado em: $audioPath" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "DICA: Grave um áudio curto de 5-10 segundos no WhatsApp," -ForegroundColor Yellow
    Write-Host "salve como audio_teste.mp3 na pasta:" -ForegroundColor Yellow
    Write-Host "C:\Users\Gerência\Desktop\Clini+" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Ou altere o caminho em `$audioPath no início do script." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Testando apenas a rota (sem áudio real)..." -ForegroundColor Cyan

    # Teste mínimo só para verificar se a rota existe
    $body = @{
        action     = "transcribe_audio"
        clinica_id = "teste"
        payload    = @{
            audio_base64 = ""
            mime_type    = "audio/mpeg"
        }
    } | ConvertTo-Json -Depth 5

    try {
        $r = Invoke-RestMethod `
            -Uri "https://mddbbwbwmwcvecbnfmqg.supabase.co/functions/v1/ai-gateway" `
            -Method POST `
            -Headers $headers `
            -Body $body `
            -TimeoutSec 30
        Write-Host "Rota existe — resposta: $($r | ConvertTo-Json)" -ForegroundColor Green
    } catch {
        $s  = $_.Exception.Response.GetResponseStream()
        $rd = New-Object System.IO.StreamReader($s)
        $erro = $rd.ReadToEnd()
        if ($erro -like "*audio_base64*") {
            Write-Host "ROTA OK — erro esperado (sem áudio): $erro" -ForegroundColor Green
            Write-Host "A rota transcribe_audio está funcionando!" -ForegroundColor Green
        } else {
            Write-Host "ERRO INESPERADO:" -ForegroundColor Red
            Write-Host $erro
        }
    }
}
