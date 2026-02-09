# n8n Webhook URL設定（簡易手順）

## 自動設定（推奨）

以下のいずれかのコマンドを実行してください：

```bash
# Node.jsスクリプトを使用
node scripts/add-n8n-webhook-env.js

# または PowerShellスクリプトを使用
powershell -ExecutionPolicy Bypass -File scripts/setup-n8n-env.ps1
```

## 手動設定

`.env.local`ファイルを開き、以下の行を追加または更新してください：

```env
# n8n Webhook URL (コラムリクエスト用)
N8N_WEBHOOK_URL=https://k-n8n.xvps.jp/webhook/column-request-webhook
```

**ファイルが存在しない場合**: プロジェクトルートに`.env.local`ファイルを作成して上記の内容を追加してください。

## 設定後の確認

1. `.env.local`ファイルを開いて`N8N_WEBHOOK_URL`が設定されているか確認
2. 開発サーバーを再起動（`npm run dev`）
3. `/columns/request`ページでリクエストを送信して動作確認

## 詳細

詳細な手順やトラブルシューティングは [docs/N8N_WEBHOOK_SETUP.md](./docs/N8N_WEBHOOK_SETUP.md) を参照してください。


