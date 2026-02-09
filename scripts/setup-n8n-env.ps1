# n8n Webhook URL環境変数を追加するPowerShellスクリプト

$envLocalPath = ".\.env.local"
$n8nWebhookUrl = "https://k-n8n.xvps.jp/webhook/column-request-webhook"

Write-Host "`n🔧 n8n Webhook URL環境変数を追加します...`n" -ForegroundColor Cyan

# .env.localファイルが存在するか確認
if (Test-Path $envLocalPath) {
    Write-Host "✓ .env.localファイルが見つかりました`n" -ForegroundColor Green
    
    # ファイルの内容を読み取り
    $content = Get-Content $envLocalPath -Raw
    
    # 既にN8N_WEBHOOK_URLが設定されているか確認
    if ($content -match "N8N_WEBHOOK_URL=") {
        Write-Host "⚠️  N8N_WEBHOOK_URLは既に設定されています。更新します...`n" -ForegroundColor Yellow
        
        # 既存のN8N_WEBHOOK_URLを更新
        $updatedContent = $content -replace "N8N_WEBHOOK_URL=.*", "N8N_WEBHOOK_URL=$n8nWebhookUrl"
        
        Set-Content -Path $envLocalPath -Value $updatedContent -NoNewline
        Write-Host "✅ N8N_WEBHOOK_URLを更新しました！`n" -ForegroundColor Green
    } else {
        # 既存の.env.localに追加
        $separator = if ($content.EndsWith("`n")) { "" } else { "`n" }
        $newContent = "$content$separator`n# n8n Webhook URL (コラムリクエスト用)`nN8N_WEBHOOK_URL=$n8nWebhookUrl`n"
        
        Set-Content -Path $envLocalPath -Value $newContent -NoNewline
        Write-Host "✅ .env.localファイルにN8N_WEBHOOK_URLを追加しました！`n" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  .env.localファイルが見つかりません。新規作成します...`n" -ForegroundColor Yellow
    
    # 新規作成
    $content = "# n8n Webhook URL (コラムリクエスト用)`nN8N_WEBHOOK_URL=$n8nWebhookUrl`n"
    
    Set-Content -Path $envLocalPath -Value $content -NoNewline
    Write-Host "✅ .env.localファイルを作成し、N8N_WEBHOOK_URLを追加しました！`n" -ForegroundColor Green
}

Write-Host "追加内容: N8N_WEBHOOK_URL=$n8nWebhookUrl`n" -ForegroundColor Cyan
Write-Host "📝 次のステップ:" -ForegroundColor Yellow
Write-Host "   1. .env.localファイルを確認してください"
Write-Host "   2. 開発サーバーを再起動してください (npm run dev)`n"


