# フロントエンド 本番リリース手順書

## 概要

コラムリクエスト機能を本番環境にリリースするための手順書です。

## 実装済み機能

### 1. コラムリクエストページ
- **URL**: `/columns/request`
- **機能**: ユーザーがコラムのテーマをリクエストできるフォーム
- **ファイル**: `app/columns/request/page.tsx`

### 2. APIエンドポイント
- **URL**: `/api/column-requests`
- **メソッド**: `POST`
- **機能**: リクエストを受信し、n8n Webhookに転送
- **ファイル**: `app/api/column-requests/route.ts`

### 3. UIコンポーネント
- **RequestButton**: コラム一覧ページのヘッダーに表示
- **RequestCTA**: コラム詳細ページの下部に表示
- **ファイル**: `components/columns/RequestButton.tsx`

### 4. 統合箇所
- **コラム一覧ページ**: `app/columns/page.tsx` (ヘッダーにボタン追加)
- **コラム詳細ページ**: `app/columns/[slug]/page.tsx` (記事下部にCTA追加)

## 環境変数の設定

### 必須環境変数

#### サーバーサイド (`.env.local` または Vercel環境変数)

```
# n8n Webhook URL
N8N_WEBHOOK_URL=https://k-n8n.xvps.jp/webhook/column-request-webhook
```

## デプロイ手順

### 1. 環境変数の確認

Vercelダッシュボードで以下を確認：
- `N8N_WEBHOOK_URL` が設定されているか

### 2. ビルドテスト

```bash
npm run build
```

エラーがないことを確認。

### 3. デプロイ

```bash
# Vercel CLIを使用する場合
vercel --prod

# またはGitHubから自動デプロイ（推奨）
git push origin main
```

### 4. 動作確認

デプロイ後、以下を確認：

1. **コラムリクエストページ**
   - URL: `https://tokusearch.vercel.app/columns/request`
   - フォームが表示される
   - 送信ボタンが動作する

2. **コラム一覧ページ**
   - URL: `https://tokusearch.vercel.app/columns`
   - ヘッダーに「📝 コラムリクエスト」ボタンが表示される
   - クリックでリクエストページに遷移する

3. **コラム詳細ページ**
   - 任意のコラム記事を開く
   - 記事下部にリクエストCTAが表示される
   - クリックでリクエストページに遷移する

4. **APIエンドポイント**
   - リクエストページから送信を実行
   - 成功メッセージが表示される
   - n8nのWebhookが呼び出される（ログで確認）

## トラブルシューティング

### エラー: "N8N_WEBHOOK_URL is not configured"

**原因**: 環境変数が設定されていない

**解決方法**:
1. Vercelダッシュボードで環境変数を確認
2. `.env.local`に設定（ローカル開発時）
3. Vercel環境変数に設定（本番環境）

### Webhookが呼び出されない

**原因**: n8nのWebhook URLが正しくない、またはn8nワークフローが無効

**解決方法**:
1. `N8N_WEBHOOK_URL`が正しいか確認
2. n8nのワークフローが有効になっているか確認
3. n8nのログでWebhookが受信されているか確認

### フォーム送信後にエラーが表示される

**原因**: APIエンドポイントのエラー、またはネットワークエラー

**解決方法**:
1. ブラウザの開発者ツールでエラーを確認
2. サーバーログでエラーを確認
3. ネットワーク接続を確認

## 既知の制限事項

1. **エラーハンドリング**
   - Webhookが失敗してもユーザーには成功メッセージが表示される
   - サーバーログでエラーを確認する必要がある

2. **リクエスト履歴**
   - ユーザー側ではリクエスト履歴を確認できない
   - n8nとGoogle Sheetsで管理

## 今後の改善案

1. リクエスト送信後の確認メール（オプション）
2. リクエスト履歴ページの追加
3. リクエストステータスの通知機能
4. より詳細なエラーメッセージの表示



