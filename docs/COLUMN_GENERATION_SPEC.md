# コラム自動生成システム 仕様書

## 概要

SlackまたはWebサイトからのリクエストを受け取り、AIでテーマ案を生成し、承認後に記事を自動生成・投稿するシステム。

## システム構成

### 1. トリガー

#### 1.1 Slackトリガー
- **チャンネル**: `#column-request` (ID: `C0A0AAKQ7D1`)
- **イベント**: `app_mention` (ボットメンション時のみ)
- **ボット**: `@n8n Bot`
- **リクエスト形式**: `@n8n Bot [ざっくりしたテーマ内容]`

#### 1.2 Webhookトリガー
- **エンドポイント**: `POST /api/column-requests`
- **認証**: なし（公開アクセス）
- **リクエスト形式**:
  ```json
  {
    "requestText": "テーマ内容"
  }
  ```

## 処理フロー

### 2. テーマ生成フロー

1. **リクエスト受信** → `ExtractSlackRequest` / `ExtractWebhookRequest`
2. **プロンプト構築** → `BuildThemePrompt`
3. **AI生成** → Google Gemini 2.5 Flash
4. **テーマ解析** → `ParseThemes`
5. **メッセージ整形** → `FormatSlackMessage`

**出力形式（JSON）**:
```json
{
  "themes": [
    {
      "no": 1,
      "title": "テーマタイトル（30〜50文字）",
      "level": "初心者向け",
      "description": "概要（50〜100文字）"
    }
  ]
}
```

### 3. 承認フロー

#### 3.1 Slack Block Kitによる承認（実装済み）

**方式**: Slack Interactive Components（Block Kit）を使用した承認

1. **テーマ案をBlock Kit形式で投稿** → `PostThemesToSlack`
   - 各テーマにチェックボックスを配置
   - 「選択したテーマを承認」「すべて承認」「キャンセル」ボタンを配置
   - 元のメンションへのスレッド返信として投稿（可能な場合）

2. **Google Sheetsに保存** → `SaveRequest`
   - `status`: `pending`
   - `request_id`: リクエストID（メッセージのtsまたは生成されたID）

3. **ユーザーのボタンクリックを待つ**
   - `SlackInteractiveWebhook`: SlackからのInteractive Componentsイベントを受信
   - Webhookエンドポイント: `POST /slack-interactive`

4. **承認処理**:
   - `ParseInteractiveResponse`: インタラクティブイベントを解析
   - `LookupRequest`: Google Sheetsから`request_id`で検索
   - `MergeApprovalData`: 承認データとリクエストデータをマージ
   - `SendApprovalResponse`: Slackに承認受付メッセージを送信
   - `IsApproved`: 承認タイプを判定

**承認パターン**:
- **すべて承認**: 「すべて承認」ボタンをクリック → 全テーマを承認
- **選択承認**: チェックボックスでテーマを選択 → 「選択したテーマを承認」ボタンをクリック
- **キャンセル**: 「キャンセル」ボタンをクリック → 処理を中止

**Block Kit構造**:
```json
{
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "📝 *テーマ案（N件）*"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*1. テーマタイトル*\\nレベル: 初心者向け\\n説明..."
      },
      "accessory": {
        "type": "checkboxes",
        "options": [{"text": {"type": "plain_text", "text": "承認"}, "value": "theme_0"}],
        "action_id": "select_theme_0"
      }
    },
    {
      "type": "actions",
      "elements": [
        {"type": "button", "text": {"type": "plain_text", "text": "✅ 選択したテーマを承認"}, "action_id": "approve_selected"},
        {"type": "button", "text": {"type": "plain_text", "text": "✅ すべて承認"}, "action_id": "approve_all"},
        {"type": "button", "text": {"type": "plain_text", "text": "❌ キャンセル"}, "action_id": "cancel"}
      ]
    }
  ]
}
```

#### 3.2 Slack Interactive Componentsの設定

**必要な設定**:
1. Slack Appの設定でInteractive Componentsを有効化
2. Request URLにn8nのWebhook URLを設定: `https://[n8n-instance]/webhook/slack-interactive`
3. n8nのWebhookTriggerで`slack-interactive`パスを設定

**注意**: Slack Interactive Componentsは3秒以内にレスポンスを返す必要があります。承認処理は非同期で実行されます。

### 4. 記事生成フロー

1. **承認通知** → `NotifyStart`
2. **テーマ分割** → `SplitThemes` (ループ処理用)
3. **プロンプト構築** → `BuildArticlePrompt`
4. **AI生成** → Google Gemini 2.5 Flash
5. **記事解析** → `ParseArticleJSON`
6. **データ準備** → `PrepareColumnData`
   - Markdown → HTML変換
   - Slug生成
7. **API投稿** → `PostColumn`
   - エンドポイント: `https://tokusearch.vercel.app/api/admin/columns`
8. **完了通知** → `NotifyComplete`
9. **ステータス更新** → `UpdateStatus`
   - `status`: `completed`

## データ構造

### Google Sheets: `column_requests`

| カラム名 | 型 | 説明 |
|---------|-----|------|
| request_id | string | リクエストID（メッセージのts） |
| source | string | `slack` or `web` |
| channel_id | string | SlackチャンネルID |
| thread_ts | string | スレッドのts（メッセージのts） |
| original_text | string | 元のリクエストテキスト |
| themes_json | string | テーマのJSON文字列 |
| status | string | `pending` / `completed` |
| created_at | datetime | 作成日時 |
| parent_thread_ts | string | 親スレッドのts（元メッセージのts） |

### APIリクエスト/レスポンス

#### Webhook POST `/api/column-requests`

**リクエスト**:
```json
{
  "requestText": "避けるべきお得まとめ"
}
```

**レスポンス**:
```json
{
  "success": true,
  "message": "リクエストを受け付けました"
}
```

#### TokuSearch API POST `/api/admin/columns`

**リクエスト**:
```json
{
  "slug": "article-slug",
  "title": "記事タイトル",
  "description": "記事の説明",
  "content_markdown": "Markdown形式の本文",
  "content_html": "<p>HTML形式の本文</p>",
  "category": "ポイント活用",
  "tags": "タグ1,タグ2",
  "thumbnail_url": "",
  "author": "TokuSearch AI",
  "status": "published",
  "is_featured": false
}
```

## エラーハンドリング

- **エラートリガー**: `ErrorTrigger`
- **エラーメッセージ構築**: `BuildErrorMessage`
- **Slack通知**: `NotifyError` (#column-requestチャンネル)

## 認証情報

- **Slack API**: `kahTvH10blaEP2kb` (Slack account)
- **Google Gemini**: `gojn353h4HLDUzF2` (Google Gemini(PaLM) Api account)
- **Google Sheets**: `r9kAyVencycJeNjy` (Google Service Account account 2)
- **TokuSearch API**: `RT6aq4TB1Vj8V2Tn` (Credential Name)

## 実装済み機能

### 1. 承認フローの実装

**実装方式**: Slack Block Kit（Interactive Components）を使用
- ✅ 各テーマにチェックボックスを配置
- ✅ 「選択したテーマを承認」「すべて承認」「キャンセル」ボタンを実装
- ✅ Webhook経由でインタラクティブイベントを受信
- ✅ Google Sheetsからリクエストデータを取得して承認処理

### 2. 複数テーマの選択承認

**実装済み**: チェックボックスで複数テーマを選択可能
- 各テーマにチェックボックスを配置
- 「選択したテーマを承認」ボタンで選択テーマのみ承認
- 「すべて承認」ボタンで全テーマを承認

## 未解決課題

### 1. 修正依頼の処理

**現状**: 修正依頼時は新しいリクエストとして処理
**課題**: 修正履歴の管理方法が未定

### 2. Slack Interactive Componentsのタイムアウト

**現状**: Slackは3秒以内にレスポンスを要求
**実装**: 即座に受付メッセージを返し、処理は非同期で実行
**課題**: エラー時の通知方法を改善する必要がある可能性

## 動作確認済み機能

- ✅ Slackメンションによるトリガー
- ✅ テーマ生成（Gemini）
- ✅ Webhookトリガー（Webサイトからのリクエスト）
- ✅ 記事生成（Gemini）
- ✅ TokuSearch APIへの投稿

## 動作確認済み機能（更新）

- ✅ Slackメンションによるトリガー
- ✅ テーマ生成（Gemini）
- ✅ Webhookトリガー（Webサイトからのリクエスト）
- ✅ 記事生成（Gemini）
- ✅ TokuSearch APIへの投稿
- ✅ Slack Block Kitによる承認フロー
- ✅ 複数テーマの選択承認

## 動作未確認機能

- ❌ 修正依頼の処理
- ❌ Slack Interactive Componentsのエラーハンドリング

