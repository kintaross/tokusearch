$headers = @{
    "x-api-key" = "xMQKbeidhj97S04kGoOpsmvnlBR1WIcZ"
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



