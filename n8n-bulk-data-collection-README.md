# 【一時】TokuSearch大量データ収集ワークフロー

直近1ヶ月のお得情報を一括収集するための一時的なワークフローです。

## 📋 概要

- **収集期間**: 直近30日間
- **データ数上限**: 300件
- **created_at**: ツイート日時をISO 8601形式で取得（例: `2025-11-21T02:17:21.752Z`）

## 🔧 セットアップ手順

### 1. n8nへのインポート

1. n8nのWeb UIを開く
2. **Workflows** → **Import from File**
3. `n8n-bulk-data-collection.json` をアップロード

### 2. 認証情報の確認

以下の認証情報が正しく設定されているか確認してください：

- **Grok API**: `xAi account` (ID: `m3OLs9FipQlOJmOA`)
- **Google Service Account**: `Google Service Account account 2` (ID: `r9kAyVencycJeNjy`)

### 3. 実行

1. ワークフローを開く
2. **Execute Workflow** をクリック
3. 処理完了を待つ（数分かかる場合があります）

## 📊 ワークフロー構成

### ノード一覧

1. **ManualTrigger** (Schedule Trigger)
   - 手動実行用トリガー

2. **GeneratePromptBulk** (Code)
   - 直近30日間の日付範囲を生成
   - Grok用プロンプトを作成

3. **CallGrokBulk** (HTTP Request)
   - Grok APIを呼び出し
   - `max_search_results: 100` で大量データを収集
   - `post_favorite_count: 5` でフィルタリング

4. **ParseGrokBulk** (Code)
   - GrokのJSON応答をパース

5. **TransformForTokuSearchBulk** (Code)
   - TokuSearch形式に変換
   - **created_at**: `tweet_created_at`フィールドを使用（ISO 8601形式）
   - **上限300件に制限**
   - カテゴリ自動判定
   - 優先度自動判定
   - スコアリング

6. **SaveToSheetsBulk** (Google Sheets)
   - TokuSearchスプレッドシートに追加

## 🎯 主な変更点（既存ワークフローとの違い）

### 1. 収集期間の拡大
- **既存**: 過去24時間
- **本ワークフロー**: 過去30日間

### 2. データ数の増加
- **既存**: `max_search_results: 30`
- **本ワークフロー**: `max_search_results: 100` + 上限300件制限

### 3. created_atの変更
- **既存**: 現在時刻（`new Date().toISOString()`）
- **本ワークフロー**: ツイート日時（`tweet_created_at`）を使用

```javascript
// ツイート日時をISO形式に変換
function formatTweetCreatedAt(tweetCreatedAt, fallbackDate) {
  // tweet_created_atが既にISO形式の場合はそのまま使用
  if (tweetCreatedAt && /\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}/.test(tweetCreatedAt)) {
    return tweetCreatedAt;
  }
  
  // fallbackDateがある場合、それを使って00:00:00のISO形式を作成
  if (fallbackDate && /\\d{4}-\\d{2}-\\d{2}/.test(fallbackDate)) {
    return `${fallbackDate}T00:00:00.000Z`;
  }
  
  // どちらもない場合は現在時刻
  return new Date().toISOString();
}
```

### 4. 重複チェックの簡略化
- 既存の履歴チェック機能を省略（一時的な大量収集のため）
- 重複は手動で確認・削除する想定

## ⚠️ 注意事項

### 1. 実行は1回のみ推奨
このワークフローは**一時的なデータ補充用**です。定期実行には適していません。

### 2. 重複データの可能性
既存ワークフローとの重複データが発生する可能性があります。以下の対応を推奨：

- スプレッドシートで `id` 列でソートして重複を確認
- 重複がある場合は手動で削除

### 3. API使用量
Grokの`max_search_results: 100`により、API使用量が通常より多くなります。

### 4. 実行時間
大量データ処理のため、実行完了まで**3〜5分程度**かかる場合があります。

## 📈 期待される結果

- **収集件数**: 50〜300件（重複除外後）
- **期間**: 過去30日間
- **created_at**: ツイート日時（ISO 8601形式）
- **カテゴリ**: 自動判定済み
- **優先度**: A/B/C自動判定済み
- **スコア**: 0〜100で自動計算済み

## 🔄 実行後の確認

1. **Google Sheets**
   - TokuSearchスプレッドシートを開く
   - 新規データが追加されているか確認
   - `created_at`列がツイート日時になっているか確認

2. **Webサイト**
   - https://tokusearch.vercel.app にアクセス
   - 新規データが表示されるか確認
   - 日付フィルタで古いデータも表示されるか確認

## 🗑️ 後片付け

データ収集が完了したら、このワークフローは削除またはアーカイブしてください。

---

## 💡 トラブルシューティング

### エラー: "Event handlers cannot be passed"
→ これは別の問題です。ワークフローとは無関係です。

### データが0件
→ Grokの応答内容をログで確認してください：
```javascript
console.log(`📦 Grok応答サイズ: ${response.length}文字`);
```

### 300件より少ない
→ 正常です。重複除外や条件フィルタリングにより、実際の収集件数は変動します。

### created_atが現在時刻になっている
→ Grokが`tweet_created_at`フィールドを返していない可能性があります。その場合は`date`フィールド（YYYY-MM-DD）から`YYYY-MM-DDT00:00:00.000Z`形式に変換されます。




