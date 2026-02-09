# Slack承認機能の使い方

## 現在の状態

テーマ案は表示されていますが、**承認・非承認ボタンが表示されていません**。

## 問題の原因

Block Kit形式のメッセージ（ボタン付き）が正しく送信されていない可能性があります。

## 解決方法

### 方法1: n8nのUIで設定を確認

1. **`PostApprovalMessage`ノードを開く**
2. **「オプション」セクションを開く**
3. **「Blocks」フィールドを確認**
   - 値が正しく設定されているか確認
   - `{{ JSON.parse($json.slackBlocks || '[]') }}` が設定されているか確認

### 方法2: Slack Interactive Componentsの設定

ボタンが表示されない場合、Slack Appの設定が必要です：

1. **Slack Appの設定**
   - [Slack API](https://api.slack.com/apps)にアクセス
   - 対象のSlack Appを選択
   - **「Interactivity & Shortcuts」**を有効化
   - **Request URL**に以下を設定：
     ```
     https://[n8n-instance]/webhook/slack-interactive
     ```
   - `SlackInteractiveWebhook`ノードのURLを確認して設定

2. **必要なスコープ**
   - `chat:write`
   - `channels:read`
   - `im:read`
   - `users:read`

### 方法3: 一時的な回避策（ボタンなしで承認）

現在、ボタンが表示されない場合は、以下の方法で承認できます：

1. **スレッドに返信**
   - テーマ案のメッセージにスレッドで返信
   - 「承認」または「approve」と入力
   - （この方法は現在のワークフローでは実装されていません）

2. **別のワークフローで承認**
   - 新しいワークフローを作成
   - スレッド返信をトリガーに設定
   - 承認処理を実装

## 推奨される解決方法

**Slack Interactive Componentsの設定を完了させる**ことが最も確実です。

1. `SlackInteractiveWebhook`ノードのURLを確認
2. Slack Appの「Interactivity & Shortcuts」でRequest URLを設定
3. ワークフローを再実行

これで、承認・非承認ボタンが表示され、クリックで承認処理が実行されます。



