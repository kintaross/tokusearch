# Slack Interactive Components 設定ガイド

## 概要

コラム生成ワークフローで使用するSlack Interactive Components（Block Kit）の設定方法を説明します。

## 前提条件

- Slack Appが作成済みであること
- n8nワークフローがデプロイ済みであること
- Slack AppにBot Tokenが設定されていること

## 設定手順

### 1. Slack Appの設定

1. [Slack API](https://api.slack.com/apps)にアクセス
2. 対象のSlack Appを選択
3. **Features** → **Interactivity & Shortcuts** を開く
4. **Interactivity** を有効化
5. **Request URL** に以下のURLを設定:
   ```
   https://[n8n-instance]/webhook/slack-interactive
   ```
   - `[n8n-instance]` は実際のn8nインスタンスのURLに置き換えてください
   - 例: `https://your-n8n.example.com/webhook/slack-interactive`

### 2. n8nワークフローの確認

ワークフロー内の `SlackInteractiveWebhook` ノードを確認:

- **Path**: `slack-interactive`
- **HTTP Method**: `POST`
- **Webhook ID**: `slack-interactive-webhook`

### 3. 動作確認

1. Slackで `@n8n Bot [テーマ内容]` とメンション
2. テーマ案がBlock Kit形式で表示されることを確認
3. チェックボックスでテーマを選択
4. 「選択したテーマを承認」または「すべて承認」ボタンをクリック
5. 承認処理が正常に実行されることを確認

## トラブルシューティング

### エラー: Request URL verification failed

**原因**: SlackがWebhook URLにアクセスできない、またはレスポンスが正しくない

**解決方法**:
1. n8nのWebhook URLが正しく設定されているか確認
2. n8nインスタンスが外部からアクセス可能か確認
3. ファイアウォールやセキュリティグループの設定を確認

### エラー: Interactive component response must be sent within 3 seconds

**原因**: Slackは3秒以内にレスポンスを要求するが、処理に時間がかかっている

**解決方法**:
- ワークフローでは即座に受付メッセージを返し、処理は非同期で実行
- `SendApprovalResponse`ノードで即座にレスポンスを返すように実装済み

### ボタンが表示されない

**原因**: Block Kit形式のメッセージが正しく送信されていない

**解決方法**:
1. `FormatSlackMessage`ノードで`blocks`が正しく生成されているか確認
2. `PostThemesToSlack`ノードで`blocks`パラメータが設定されているか確認
3. Slack AppのBot Tokenに必要なスコープが付与されているか確認:
   - `chat:write`
   - `chat:write.public`
   - `channels:history`
   - `im:history`

### チェックボックスの選択が反映されない

**原因**: チェックボックスの`action_id`が正しく設定されていない

**解決方法**:
1. `FormatSlackMessage`ノードで各テーマの`action_id`が一意であることを確認
2. `ParseInteractiveResponse`ノードでチェックボックスの値を正しく解析しているか確認

## 参考資料

- [Slack Block Kit](https://api.slack.com/block-kit)
- [Slack Interactive Components](https://api.slack.com/interactivity)
- [n8n Slack Node Documentation](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.slack/)

