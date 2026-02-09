# Googleスプレッドシートテンプレート

このドキュメントは、記事更新用のGoogleスプレッドシートのテンプレート形式を説明します。

## 📊 スプレッドシート構造

### シート名
- デフォルト: `Sheet1`
- カスタム名を使用する場合は環境変数 `GOOGLE_SHEETS_SHEET_NAME` で指定

### ヘッダー行（1行目）

以下の順序でカラムを配置してください：

```
id | date | title | summary | detail | steps | service | expiration | conditions | notes | category_main | category_sub | is_public | priority | discount_rate | discount_amount | score | created_at | updated_at
```

## 📝 各カラムの詳細

### 必須カラム

| カラム | 型 | 説明 | 例 |
|--------|-----|------|-----|
| `id` | 文字列 | ユニークID（UUID推奨） | `550e8400-e29b-41d4-a716-446655440000` |
| `date` | 日付 | 掲載日（YYYY-MM-DD） | `2024-01-15` |
| `title` | 文字列 | 記事タイトル | `PayPayボーナス還元キャンペーン` |
| `summary` | 文字列 | サマリー（概要） | `PayPayで最大20%還元！期間限定のお得なキャンペーンです。` |
| `category_main` | 文字列 | メインカテゴリ | `決済・ポイント` |
| `is_public` | 真偽値 | 公開フラグ | `TRUE` または `FALSE` |
| `priority` | 文字列 | 優先度 | `A`, `B`, または `C` |

### オプションカラム

| カラム | 型 | 説明 | 例 |
|--------|-----|------|-----|
| `detail` | 文字列 | 詳細内容（改行は`\n`） | `【詳細】\nPayPayで実施中の特別キャンペーンです。` |
| `steps` | 文字列 | 利用手順（改行は`\n`） | `【利用手順】\n1. PayPayアプリを開く` |
| `service` | 文字列 | サービス名 | `PayPay` |
| `expiration` | 日付 | 期限（YYYY-MM-DD） | `2024-02-15` |
| `conditions` | 文字列 | 適用条件・注意点 | `新規会員限定 / 先着順` |
| `notes` | 文字列 | 備考 | `※還元額は購入金額により変動します` |
| `category_sub` | 文字列 | サブカテゴリ | `QR` |
| `discount_rate` | 数値 | 割引率（%） | `20` |
| `discount_amount` | 数値 | 還元額（円） | `5000` |
| `score` | 数値 | スコア（0-100） | `85` |
| `created_at` | 日時 | 作成日時（ISO形式） | `2024-01-15T10:00:00Z` |
| `updated_at` | 日時 | 更新日時（ISO形式） | `2024-01-15T10:00:00Z` |

## 📋 カテゴリ一覧

### メインカテゴリ（`category_main`）

以下のいずれかを指定してください：

- `ドラッグストア・日用品`
- `スーパー・量販店・EC`
- `グルメ・外食`
- `旅行・交通`
- `決済・ポイント`
- `タバコ・嗜好品`
- `その他`

### 優先度（`priority`）

- `A`: 注目案件（🔥 注目として表示）
- `B`: おすすめ（⭐ おすすめとして表示）
- `C`: 通常（✨ 通常として表示）

## 📄 サンプルデータ

```csv
id,date,title,summary,detail,steps,service,expiration,conditions,notes,category_main,category_sub,is_public,priority,discount_rate,discount_amount,score,created_at,updated_at
550e8400-e29b-41d4-a716-446655440000,2024-01-15,PayPayボーナス還元キャンペーン,PayPayで最大20%還元！期間限定のお得なキャンペーンです。,"【詳細】
PayPayで実施中の特別キャンペーンです。

還元率: 20%
還元額目安: 約5,000円","【利用手順】
1. PayPayアプリを開く
2. キャンペーンページからエントリー
3. 対象商品を購入
4. 還元ポイントが付与されます",PayPay,2024-02-15,新規会員限定 / 先着順 / 1回限り,"※還元額は購入金額により変動します
※キャンペーン期間中に購入した商品が対象です",決済・ポイント,QR,TRUE,A,20,5000,85,2024-01-15T10:00:00Z,2024-01-15T10:00:00Z
```

## 🔧 Googleスプレッドシートでの設定

### 1. スプレッドシートの作成

1. Googleスプレッドシートを新規作成
2. 1行目に上記のヘッダーを入力
3. 2行目以降にデータを入力

### 2. データ検証の設定（推奨）

**`category_main` カラム:**
- データ → データの検証
- 条件: リスト
- 値: `ドラッグストア・日用品,スーパー・量販店・EC,グルメ・外食,旅行・交通,決済・ポイント,タバコ・嗜好品,その他`

**`priority` カラム:**
- データ → データの検証
- 条件: リスト
- 値: `A,B,C`

**`is_public` カラム:**
- データ → データの検証
- 条件: リスト
- 値: `TRUE,FALSE`

### 3. 日付形式の設定

**`date` と `expiration` カラム:**
- 形式 → 数値 → 日付
- 形式: `YYYY-MM-DD`

### 4. 数値形式の設定

**`discount_rate`, `discount_amount`, `score` カラム:**
- 形式 → 数値

## 📤 CSVインポート時の注意点

CSVファイルからインポートする場合：

1. UTF-8エンコーディングで保存
2. カンマ区切り（`,`）
3. 改行を含む場合は `\n` でエスケープ
4. ダブルクォートで囲む（必要に応じて）

## 🔗 関連ドキュメント

- [UPDATE_GUIDE.md](./UPDATE_GUIDE.md) - 更新ガイド
- [README.md](../README.md) - セットアップ手順

