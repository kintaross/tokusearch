# Slackコラムテーマ作成と承認ワークフロー実装ドキュメント

## 概要

SlackメッセージまたはWebサイトからリクエストを受け取り、コラムテーマを生成し、承認フローを経てコラム記事を自動生成するn8nワークフローです。

### 承認方式

本ワークフローは**Wait + resumeUrl方式**を使用しています：
- Slack Block Kitのボタンの`url`パラメータに`{{ $execution.resumeUrl }}?action=approve/reject`を設定
- Waitノードが実行時にWebhook URL（`resumeUrl`）を生成
- ボタンクリック時にそのWebhook URLが呼び出され、ワークフローが再開
- Waitノードの後のIfノードで`$json.query.action`をチェックして承認/却下を判定

この方式により、Slackのインタラクティブボタンで承認フローを実現しています。

## ワークフローファイル

`n8n_workflow/slack-column-theme-approval-workflow.json`

## ワークフロー構成

### 1. トリガー部分

#### SlackTrigger
- **タイプ**: `n8n-nodes-base.slackTrigger`
- **トリガー**: `app_mention`（ボットへのメンション）
- **チャンネル**: `#column-request`
- **機能**: Slackで`@n8n Bot`にメンションするとワークフローが開始

#### WebhookTrigger
- **タイプ**: `n8n-nodes-base.webhook`
- **パス**: `column-request`
- **メソッド**: POST
- **機能**: フロントエンド（`/api/column-requests`）からリクエストを受け取る

### 2. テーマ生成部分

#### BuildThemePrompt
- **タイプ**: Code Node
- **機能**: 
  - `retryCount`に応じてプロンプトを調整
  - retryCount=0: 通常プロンプト
  - retryCount=1: より具体的な指示
  - retryCount=2: 別のアプローチ

#### GenerateTheme
- **タイプ**: Google Gemini (Gemini 2.5 Flash)
- **機能**: メッセージ内容からテーマを1件生成

#### ParseTheme
- **タイプ**: Code Node
- **機能**: Geminiの出力からテーマデータを抽出（JSON形式）

### 3. 承認要求部分

#### SaveToSheet
- **タイプ**: Google Sheets
- **シート**: `column_requests`
- **機能**: リクエストとテーマ案をシートに保存

#### BuildApprovalMessage
- **タイプ**: Code Node
- **機能**: Slack Block Kit形式のメッセージを構築
  - テーマ情報を表示
  - resumeUrlを含む承認/却下ボタンを追加
  - **注意**: WaitノードのWebhook URLは実行時に`$execution.resumeUrl`として参照可能

#### SendApprovalRequest
- **タイプ**: Slack Node
- **機能**: Block Kit形式でSlackに投稿

#### Wait
- **タイプ**: Wait Node
- **設定**: `resume: webhook`
- **機能**: 承認/却下を待機
  - Webhook URL: `{{ $execution.resumeUrl }}`
  - ボタンクリック時に`?action=approve`または`?action=reject`で再開

### 4. 承認判定部分

#### IfApproved
- **タイプ**: If Node
- **条件**: `query.action === 'approve'`
- **True**: 記事生成フローへ
- **False**: 再生成フローへ

### 5. 再生成ロジック

#### CheckRetryCount
- **タイプ**: Code Node
- **機能**: retryCountをチェック

#### IfRetryAvailable
- **タイプ**: If Node
- **条件**: `retryCount < 2`
- **True**: 再生成へ（retryCountをインクリメント）
- **False**: 中断通知へ

#### IncrementRetryCount
- **タイプ**: Code Node
- **機能**: retryCountをインクリメントしてBuildThemePromptに戻る

#### AbortNotification
- **タイプ**: Slack Node
- **機能**: 2回とも却下の場合、中断通知を送信

### 6. コラム生成部分

既存の`コラム自動生成_稼働Ver.json`ワークフローを参考に実装：

#### BuildArticlePrompt
- 承認されたテーマから記事生成プロンプトを構築

#### GenerateArticle
- Gemini 2.5 Flashで記事を生成

#### ParseArticleJSON
- 堅牢なJSONパーサーで記事データを抽出

#### PrepareColumnData
- API用データ整形（slug生成、HTML変換）

#### PostColumn
- TokuSearch APIに投稿（`POST /api/admin/columns`）

#### UpdateStatus
- `column_requests`シートのstatusを`completed`に更新

#### NotifyCompletion
- 完了通知をSlackスレッドに投稿

## 実装の詳細ポイント

### Wait + resumeUrl方式

参考テンプレートの方式を採用：

1. **Waitノードの設定**:
   - `resume: "webhook"`を設定
   - Webhook IDが自動生成される

2. **Slackメッセージの構築**:
   ```javascript
   const resumeUrl = '{{ $execution.resumeUrl }}';
   
   blocks.push({
     type: 'actions',
     elements: [
       {
         type: 'button',
         text: { type: 'plain_text', text: '✅ 承認して保存' },
         style: 'primary',
         url: `${resumeUrl}?action=approve`
       },
       {
         type: 'button',
         text: { type: 'plain_text', text: '❌ 却下' },
         style: 'danger',
         url: `${resumeUrl}?action=reject`
       }
     ]
   });
   ```

3. **承認判定**:
   ```javascript
   // Waitノードの後に来るIfノード
   const action = $json.query?.action || $json.body?.query?.action || '';
   // action === 'approve' を判定
   ```

### テーマ生成プロンプトの調整（retryCount別）

**retryCount=0 (初回)**:
```
あなたはポイ活・節約メディア「TokuSearch」の編集者です。
以下のリクエストから、具体的なコラム記事のテーマ案を1件生成してください。

リクエスト: {{requestText}}

出力形式:
{
  "title": "テーマタイトル（30〜50文字程度、キャッチーに）",
  "level": "初心者向け",
  "description": "このテーマで書く記事の概要（50〜100文字）"
}
```

**retryCount=1 (1回目の再生成)**:
```
[前のプロンプトに追加]
前回のテーマが承認されませんでした。以下の点を重視して、より具体的で実践的なテーマを生成してください:
- より具体的な数字や事例を含める
- 読者がすぐに実践できる内容にする
- 前回とは異なる切り口で提案する
```

**retryCount=2 (2回目の再生成)**:
```
[前のプロンプトに追加]
2回目の再生成です。以下のアプローチで別の視点からテーマを生成してください:
- より基本的な内容から始める、またはより高度な内容に挑戦する
- 異なるターゲット層を想定する
- 全く違う角度からリクエストを解釈する
```

### column_requestsシートへの保存

既存スキーマに準拠：

- `request_id`: Slack ts または timestamp
- `source`: 'slack' or 'web'
- `channel_id`: SlackチャンネルID
- `original_text`: 元のリクエストテキスト
- `themes_json`: `[{ title, level, description, retryCount }]` (JSON文字列)
- `status`: 'pending' → 'approved' → 'completed'
- `created_at`: ISO 8601形式
- `parent_thread_ts`: Slackメッセージのts

## セットアップ手順

### 1. n8nにワークフローをインポート

1. n8nのワークフロー画面で「Import from File」を選択
2. `n8n_workflow/slack-column-theme-approval-workflow.json`を選択
3. ワークフローがインポートされる

### 2. 認証情報の設定

以下の認証情報を設定してください：

- **Slack API**: 既存のSlack認証情報を使用
- **Google Sheets**: 既存のGoogle Service Account認証情報を使用
- **Google Gemini API**: 既存のGemini API認証情報を使用
- **HTTP Header Auth**: TokuSearch API認証情報を使用

### 3. SlackTriggerの設定

**重要**: SlackTriggerが動作するためには、Slack Appの設定が必要です。

1. **n8nでSlackTriggerノードを設定**:
   - ワークフローをn8nにインポート後、SlackTriggerノードを開く
   - 認証情報（Slack account）を選択
   - チャンネルIDを設定（デフォルト: `C0A0AAKQ7D1`）
   - ワークフローを保存すると、Webhook URLが自動生成される

2. **Slack AppのEvent Subscriptionsを設定**:
   - Slack API（https://api.slack.com/apps）にアクセス
   - 使用しているSlack Appを選択
   - 「Event Subscriptions」を開く
   - 「Enable Events」をONにする
   - 「Request URL」に、n8nのSlackTriggerから表示されるWebhook URLを入力
     - 例: `https://your-n8n-instance.com/webhook/slack-column-theme-trigger`
   - SlackがURLを検証する（「Verified」と表示される必要がある）
   - 「Subscribe to bot events」で`app_mentions:read`を追加
   - 「Save Changes」をクリック

3. **Bot Token Scopesを設定**:
   - 「OAuth & Permissions」を開く
   - 「Bot Token Scopes」に以下のスコープを追加:
     - `app_mentions:read`
     - `chat:write`
     - `chat:write.public`（必要に応じて）
   - スコープを追加した場合は、「Reinstall to Workspace」をクリックして再インストール

4. **ボットをチャンネルに招待**:
   - `#column-request`チャンネルで以下を実行:
     ```
     /invite @n8n Bot
     ```

5. **チャンネルIDの確認**:
   - Slackで`#column-request`チャンネルを開く
   - チャンネル名をクリック → 「設定」→「詳細情報」
   - チャンネルIDをコピー（例: `C0A0AAKQ7D1`）
   - n8nのSlackTriggerノードと`SendApprovalRequest`ノードの`channelId`に設定

### 4. WaitノードのWebhook URLについて

**重要**: WaitノードのWebhook URLは実行時に自動生成されます。ただし、メッセージ送信時にresumeUrlを含める必要があるため、以下のいずれかの方法で対応してください：

1. **方法1（推奨）**: Waitノードを先に配置してから、そのWebhook URLをメッセージ構築時に参照
   - Waitノードが設定されると、`$execution.resumeUrl`が実行時に利用可能になる
   - ただし、Waitノードが実行される前にメッセージを送信する必要があるため、実装が複雑になる

2. **方法2**: WaitノードのWebhook IDからURLを構築
   - WaitノードのWebhook IDは設定時に決定される
   - このIDからURLを構築してメッセージに含める

3. **方法3**: 実装時の注意事項として、WaitノードのWebhook URLを動的に取得する方法を検討
   - 実行時に`$execution.resumeUrl`を使用
   - メッセージ構築時にはプレースホルダーを使用し、実際のURLは実行時に置換

現在の実装では、方法3を採用しています。実装時に動作確認を行い、必要に応じて調整してください。

### 5. Webhook URLの設定

フロントエンド（`/api/column-requests`）からn8n Webhookを呼び出すため、環境変数を設定：

```bash
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/column-request
```

### 6. ワークフローの有効化

1. n8nのワークフロー画面で、インポートしたワークフローを選択
2. 「Active」スイッチをONにする
3. SlackTriggerとWebhookTriggerが有効になる

## 使い方

### Slackからリクエスト

1. `#column-request`チャンネルで`@n8n Bot`にメンション
2. テーマに関する情報を入力
   - 例: `@n8n Bot 楽天ポイントの貯め方についてのコラムテーマを考えて`
3. ボットがテーマ案を生成して投稿
4. 承認ボタンまたは却下ボタンをクリック
5. 承認すると記事が生成され、完了通知がスレッドに投稿される

### Webサイトからリクエスト

1. `/columns/request`ページでリクエストを入力
2. 送信ボタンをクリック
3. `/api/column-requests`からn8n Webhookが呼び出される
4. Slackにテーマ案が投稿される
5. 以降の承認フローは同じ

## トラブルシューティング

### SlackTriggerが動かない（メンションしても反応しない）

**原因1: SlackTriggerのwebhookIdが設定されていない**
- n8nでSlackTriggerノードを開く
- 「Webhook URL」または「Listen for Events」セクションを確認
- Webhook URLが表示されていない場合は、ワークフローを一度保存して再度開く
- Webhook URLが表示されたら、そのURLをコピー

**原因2: Slack AppのEvent Subscriptionsが設定されていない**
1. Slack API（https://api.slack.com/apps）にアクセス
2. 使用しているSlack Appを選択
3. 「Event Subscriptions」を開く
4. 「Enable Events」をONにする
5. 「Request URL」に、n8nのSlackTriggerから表示されるWebhook URLを入力
   - 例: `https://your-n8n-instance.com/webhook/slack-column-theme-trigger`
6. SlackがURLを検証する（「Verified」と表示される必要がある）
7. 「Subscribe to bot events」で以下のイベントを追加:
   - `app_mentions:read` - ボットへのメンションを受信
8. 「Save Changes」をクリック

**原因3: Slack Botの権限（OAuth Scopes）が不足している**
1. Slack APIの「OAuth & Permissions」を開く
2. 「Bot Token Scopes」に以下のスコープが追加されているか確認:
   - `app_mentions:read` - メンションを読み取る
   - `channels:history` - チャンネルのメッセージ履歴を読み取る（必要に応じて）
   - `chat:write` - メッセージを投稿する
   - `chat:write.public` - パブリックチャンネルにメッセージを投稿する（必要に応じて）
3. スコープを追加した場合は、ワークスペースに再インストールが必要:
   - 「Reinstall to Workspace」をクリック
   - 権限を承認

**原因4: ワークフローがアクティブになっていない**
- n8nのワークフロー画面で、ワークフロー名の横の「Active」スイッチがONになっているか確認
- OFFの場合はONにする

**原因5: チャンネルIDが間違っている**
- SlackTriggerの`channelId`が正しいか確認
- `#column-request`チャンネルのIDを確認:
  1. Slackでチャンネルを開く
  2. チャンネル名をクリック → 「設定」→「詳細情報」
  3. チャンネルIDをコピー（例: `C0A0AAKQ7D1`）
- n8nのSlackTriggerノードで正しいチャンネルIDを設定

**原因6: ボットがチャンネルに参加していない**
- `#column-request`チャンネルにボットを招待:
  ```
  /invite @n8n Bot
  ```

**デバッグ方法**:
1. n8nの実行履歴を確認
   - SlackTriggerがトリガーされているか確認
   - エラーメッセージがないか確認
2. SlackのEvent Subscriptionsでイベント履歴を確認
   - Slack APIの「Event Subscriptions」→「Recent Events」
   - `app_mention`イベントが送信されているか確認
3. n8nのワークフローログを確認
   - 「Executions」タブで実行履歴を確認

### 承認ボタンが表示されない、またはクリックしても反応しない

**原因1: ボタンのURLが正しく設定されていない**
- BuildApprovalMessageノードで、ボタンの`url`パラメータに`{{ $execution.resumeUrl }}?action=approve`または`{{ $execution.resumeUrl }}?action=reject`が設定されているか確認
- `action_id`や`value`ではなく、`url`パラメータを使用していることを確認

**原因2: Waitノードが配置されていない**
- UpdateParentThreadTsノードの後にWaitノードが配置されているか確認
- Waitノードの設定が`resume: webhook`になっているか確認

**原因3: WaitノードのWebhook IDが正しく設定されていない**
- WaitノードのWebhook IDが`wait-approval-webhook`になっているか確認

**原因4: `$execution.resumeUrl`が利用できない**
- Waitノードがワークフローに配置されると、実行時に`$execution.resumeUrl`が自動的に利用可能になる
- BuildApprovalMessageノードで`{{ $execution.resumeUrl }}`を直接参照していることを確認

### Waitノードが動作しない

- WaitノードのWebhook IDを確認（`wait-approval-webhook`）
- Waitノードの設定（`resume: webhook`）を確認
- Waitノードの後にIfApprovedノードが接続されているか確認
- IfApprovedノードで`$json.query.action`が正しく参照されているか確認

### テーマが生成されない

- Gemini APIの認証情報を確認
- プロンプトの内容を確認
- エラーログを確認

### Slackメッセージが投稿されない

- Slack APIの認証情報を確認
- チャンネルIDが正しいか確認
- Block Kit形式のメッセージが正しく構築されているか確認

### 記事が生成されない

- TokuSearch APIの認証情報を確認
- APIエンドポイント（`/api/admin/columns`）が正しいか確認
- エラーログを確認

## 参考資料

- 既存ワークフロー: `n8n_workflow/コラム自動生成_稼働Ver.json`
- column_requestsシートスキーマ: `docs/COLUMN_REQUESTS_SHEET_SCHEMA.md`
- コラムデータ型定義: `types/column.ts`

## 注意事項

- WaitノードのWebhook URLは実行時に動的に生成されるため、実装時に動作確認が必要
- retryCountが2回を超える場合は中断される
- 記事生成部分は既存のワークフローをできるだけ流用
- エラーハンドリングとログ出力を実装（Error Triggerを使用）

## 更新履歴

- 2025-01-XX: 初版作成
  - SlackTrigger/WebhookTrigger実装
  - テーマ生成（1件、retryCount対応）
  - Wait + resumeUrl方式の承認フロー
  - 再生成ロジック（最大2回）
  - 記事生成（既存ワークフローを参考）

