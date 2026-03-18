# ═══════════════════════════════════════════════
# TESTE 1 — generate_summary
# Salve como teste_summary.ps1 e rode: .\teste_summary.ps1
# ═══════════════════════════════════════════════

$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZGJid2J3bXdjdmVjYm5mbXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgzNjA3MCwiZXhwIjoyMDg5NDEyMDcwfQ.L0g5LAAW90KM3joY4jUJ1iL8azYYT4-X1-ZN1-4Qjvc"

$body = @{
    action     = "generate_summary"
    clinica_id = "teste"
    payload    = @{
        especialidade      = "Estética"
        texto_clinico      = "Paciente Maria Silva, 38 anos, compareceu para aplicacao de toxina botulinica na regiao frontal e glabela. Queixa principal de rugas de expressao. Foram aplicadas 20 unidades na testa e 15 unidades na glabela. Paciente tolerou bem o procedimento, sem intercorrencias. Orientada sobre cuidados pos procedimento: nao deitar por 4 horas, nao fazer atividade fisica por 24 horas, retorno em 15 dias para avaliacao."
        historico_paciente = "Paciente ja realizou 2 sessoes anteriores de botox com bons resultados. Sem alergias conhecidas. Nao faz uso de anticoagulantes."
    }
} | ConvertTo-Json -Depth 5

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
    Write-Host "SUCESSO — generate_summary:" -ForegroundColor Green
    $r.data.resumo | ConvertTo-Json -Depth 5
} catch {
    $s  = $_.Exception.Response.GetResponseStream()
    $rd = New-Object System.IO.StreamReader($s)
    Write-Host "ERRO:" -ForegroundColor Red
    Write-Host $rd.ReadToEnd()
}
