$apiKey = $env:N8N_INGEST_API_KEY
if (-not $apiKey) { $apiKey = $env:N8N_API_KEY }
if (-not $apiKey) {
    throw "APIキーが未設定です。`$env:N8N_INGEST_API_KEY または `$env:N8N_API_KEY を設定してください。"
}

$headers = @{
    "x-api-key" = $apiKey
    "Content-Type" = "application/json"
}

$body = @{
    title = "Test Article"
    description = "Test Description"
    content_markdown = "# Test Content"
    category = "Test"
    tags = "test"
    status = "draft"
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "https://tokusearch.vercel.app/api/admin/columns" -Method POST -Headers $headers -Body $body
    Write-Host "Success!" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host $_.Exception.Response.StatusCode
}



