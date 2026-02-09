# Google Sheets: column_requests シートスキーマ

## 概要

Slackおよび Webサイトからのコラムリクエストを管理するためのシートです。

## セットアップ手順

### 1. シートの作成

TokuSearch スプレッドシート（`1iz1ApPwoLMMyqeQW_GA0XYM1qU74tzULNVq6vav3g14`）に、新しいシート `column_requests` を追加します。

### 2. ヘッダー行の設定

1行目に以下のヘッダーを設定してください：

| 列 | ヘッダー名 | 説明 |
|----|-----------|------|
| A | request_id | リクエストの一意識別子（Slackメッセージts または日時） |
| B | source | リクエスト元（`slack` または `web`） |
| C | channel_id | SlackチャンネルID |
| D | thread_ts | ~~Slackスレッドのタイムスタンプ（承認フロー用）~~ **非推奨：Ver1.6以前** |
| E | original_text | 元のリクエストテキスト |
| F | themes_json | 生成されたテーマ案（JSON形式） |
| G | status | ステータス（`pending`, `approved`, `completed`, `cancelled`） |
| H | created_at | 作成日時（ISO 8601形式） |
| I | parent_thread_ts | **Ver1.7以降**: テーマ案を投稿したメッセージのts（スレッド検索用） |

### 3. ヘッダー行の入力

スプレッドシートの1行目に以下を入力：

```
request_id | source | channel_id | thread_ts | original_text | themes_json | status | created_at | parent_thread_ts
```

**重要**: 既存のシートに`parent_thread_ts`カラム（I列）を追加してください。

## データ形式

### request_id
- Slack経由: メッセージのタイムスタンプ（例: `1234567890.123456`）
- Web経由: ISO 8601形式の日時（例: `2025-01-27T09:00:00.000Z`）

### source
- `slack`: Slack #column-request チャンネルからのリクエスト
- `web`: Webサイト /columns/request からのリクエスト
- `slack-revise`: Slackでの修正依頼

### themes_json
JSON配列形式でテーマ案を保存：

```json
[
  {
    "no": 1,
    "title": "楽天ポイントを効率的に貯める5つの方法",
    "level": "初心者向け",
    "description": "初心者でも今日から実践できる楽天ポイントの基本的な貯め方を解説"
  },
  {
    "no": 2,
    "title": "マイル最大化ルート完全ガイド",
    "level": "中級者以上向け",
    "description": "航空マイルを効率的に貯めるための具体的なルートを解説"
  }
]
```

### status
- `pending`: テーマ案提示中（承認待ち）
- `approved`: 承認済み（記事生成中）
- `completed`: 記事生成完了
- `cancelled`: キャンセル

## サンプルデータ（Ver1.7以降）

| request_id | source | channel_id | thread_ts | original_text | themes_json | status | created_at | parent_thread_ts |
|------------|--------|------------|-----------|---------------|-------------|--------|------------|------------------|
| 2025-01-27T09:00:00.000Z | slack | C0A0AAKQ7D1 | 2025-01-27T09:00:00.000Z | マイルの貯め方について | [...] | completed | 2025-01-27T09:00:00.000Z | 1234567890.123457 |
| 2025-01-27T10:30:00.000Z | web | column-request | 2025-01-27T10:30:00.000Z | ポイント多重取りのコツ | [...] | pending | 2025-01-27T10:30:00.000Z | 1234567890.123458 |

## 注意事項

1. **parent_thread_ts が重要（Ver1.7以降）**: 承認フローで使用するため、必ず Slackに投稿後のメッセージts（スレッドの親）を保存してください
2. **thread_ts は非推奨（Ver1.6以前）**: 後方互換性のため残していますが、Ver1.7以降は使用しません
3. **themes_json は有効なJSON**: パース可能なJSON形式で保存してください
4. **status の更新**: ワークフローが自動的に更新します

## Ver1.7での変更点

### スレッド管理の改善

- **以前（Ver1.6）**: テーマ案をリクエストメッセージのスレッドとして投稿
- **Ver1.7**: テーマ案を新しいスレッドとして投稿し、その`ts`を`parent_thread_ts`として保存
- **利点**: 
  - 承認返信がメンションなしでも動作
  - スレッドが整理される
  - 全ての通知がスレッド内に統一される

