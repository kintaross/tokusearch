# Googleスプレッドシート設置ガイド

このガイドでは、TokuSearchサイトで使用するGoogleスプレッドシートの作成から連携までの手順を説明します。

## 📋 手順概要

1. Googleスプレッドシートを作成
2. ヘッダー行とサンプルデータを設定
3. 認証方法を選択（APIキー or サービスアカウント）
4. 環境変数を設定
5. アプリケーションと連携

---

## ステップ1: Googleスプレッドシートの作成

### 1-1. スプレッドシートを新規作成

1. [Googleスプレッドシート](https://sheets.google.com/) にアクセス
2. 「空白」をクリックして新規スプレッドシートを作成
3. スプレッドシート名を変更（例: `TokuSearch お得情報データ`）

### 1-2. スプレッドシートIDを取得

スプレッドシートのURLからIDを取得します：

```
https://docs.google.com/spreadsheets/d/[ここがスプレッドシートID]/edit
```

例: URLが `https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j/edit` の場合
→ スプレッドシートIDは `1a2b3c4d5e6f7g8h9i0j`

**重要:** このIDは後で環境変数に設定します。

---

## ステップ2: ヘッダー行とデータ構造の設定

### 2-1. ヘッダー行を入力

1行目に以下のヘッダーを入力してください（順序は自由ですが、推奨順序）：

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| id | date | title | summary | detail | steps | service | expiration | conditions | notes | category_main | category_sub | is_public | priority | discount_rate | discount_amount | score | created_at | updated_at |

### 2-2. サンプルデータを追加（テスト用）

2行目以降にサンプルデータを追加します。以下は例です：

| id | date | title | summary | category_main | is_public | priority |
|---|---|---|---|---|---|---|
| `550e8400-e29b-41d4-a716-446655440000` | `2024-01-15` | `PayPayボーナス還元キャンペーン` | `PayPayで最大20%還元！期間限定のお得なキャンペーンです。` | `決済・ポイント` | `TRUE` | `A` |

**詳細なカラム仕様:** [SPREADSHEET_TEMPLATE.md](./SPREADSHEET_TEMPLATE.md) を参照

### 2-3. データ検証の設定（推奨）

入力ミスを防ぐため、データ検証を設定することを推奨します：

**`category_main` カラム:**
1. カラムK（`category_main`）を選択
2. 「データ」→「データの検証」
3. 条件: 「リスト」
4. 値: `ドラッグストア・日用品,スーパー・量販店・EC,グルメ・外食,旅行・交通,決済・ポイント,タバコ・嗜好品,その他`

**`priority` カラム:**
1. カラムN（`priority`）を選択
2. 「データ」→「データの検証」
3. 条件: 「リスト」
4. 値: `A,B,C`

**`is_public` カラム:**
1. カラムM（`is_public`）を選択
2. 「データ」→「データの検証」
3. 条件: 「リスト」
4. 値: `TRUE,FALSE`

---

## ステップ3: 認証方法の選択と設定

アプリケーションがスプレッドシートにアクセスするには、認証が必要です。以下の2つの方法から選択してください。

### 方法1: APIキー（公開スプレッドシート用）【簡単】

**メリット:** 設定が簡単  
**デメリット:** スプレッドシートを公開する必要がある

#### 3-1-1. Google Cloud ConsoleでAPIキーを取得

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを選択（または新規作成）
3. 「APIとサービス」→「ライブラリ」
4. 「Google Sheets API」を検索して有効化
5. 「APIとサービス」→「認証情報」
6. 「認証情報を作成」→「APIキー」
7. APIキーをコピー（後で使用）

#### 3-1-2. スプレッドシートを公開設定

1. スプレッドシートを開く
2. 「共有」ボタンをクリック
3. 「リンクを知っている全員」に変更
4. 「閲覧者」を選択
5. 「完了」をクリック

#### 3-1-3. 環境変数を設定

プロジェクトルートに `.env.local` ファイルを作成（または編集）：

```env
GOOGLE_SHEETS_SPREADSHEET_ID=1a2b3c4d5e6f7g8h9i0j
GOOGLE_SHEETS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 方法2: サービスアカウント（プライベートスプレッドシート用）【推奨】

**メリット:** スプレッドシートを非公開にできる（セキュア）  
**デメリット:** 設定が少し複雑

#### 3-2-1. サービスアカウントを作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを選択（または新規作成）
3. 「APIとサービス」→「認証情報」
4. 「認証情報を作成」→「サービスアカウント」
5. サービスアカウント名を入力（例: `toku-search-reader`）
6. 「作成して続行」
7. ロールは「編集者」を選択（またはスキップ）
8. 「完了」をクリック

#### 3-2-2. JSONキーをダウンロード

1. 作成したサービスアカウントをクリック
2. 「キー」タブを選択
3. 「キーを追加」→「新しいキーを作成」
4. キーのタイプ: 「JSON」
5. 「作成」をクリック
6. JSONファイルがダウンロードされます（保存しておく）

#### 3-2-3. スプレッドシートにサービスアカウントを共有

1. スプレッドシートを開く
2. 「共有」ボタンをクリック
3. JSONファイル内の `client_email` の値をコピー（例: `toku-search-reader@project-id.iam.gserviceaccount.com`）
4. そのメールアドレスを入力
5. 権限: 「閲覧者」を選択
6. 「送信」をクリック

#### 3-2-4. 環境変数を設定

JSONファイルの内容を1行の文字列に変換します：

**Windows (PowerShell):**
```powershell
$json = Get-Content -Path "path/to/service-account-key.json" -Raw
$json.Replace("`n", "\n").Replace("`"", '\"') | Out-File -FilePath ".env.local" -Encoding utf8
```

**macOS/Linux:**
```bash
cat service-account-key.json | jq -c . | sed 's/"/\\"/g' > temp.txt
echo "GOOGLE_SERVICE_ACCOUNT_KEY=$(cat temp.txt)" >> .env.local
```

または、手動で `.env.local` に追加：

```env
GOOGLE_SHEETS_SPREADSHEET_ID=1a2b3c4d5e6f7g8h9i0j
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"toku-search-reader@project-id.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

**重要:** 改行は `\n` でエスケープしてください。

---

## ステップ4: 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成します：

```env
# 必須: スプレッドシートID
GOOGLE_SHEETS_SPREADSHEET_ID=1a2b3c4d5e6f7g8h9i0j

# 認証方法（いずれか一方を設定）

# 方法1: APIキー（公開スプレッドシート用）
GOOGLE_SHEETS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# 方法2: サービスアカウント（プライベートスプレッドシート用・推奨）
# GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# オプション: カスタムシート名（デフォルト: Sheet1）
# GOOGLE_SHEETS_SHEET_NAME=Sheet1
```

---

## ステップ5: 動作確認

### 5-1. 開発サーバーを起動

```bash
npm run dev
```

### 5-2. ブラウザで確認

1. http://localhost:3000 を開く
2. スプレッドシートのデータが表示されることを確認
3. エラーが表示される場合は、以下を確認：
   - 環境変数が正しく設定されているか
   - スプレッドシートIDが正しいか
   - 認証情報が正しいか
   - スプレッドシートの共有設定が正しいか

---

## 📝 よくある質問

### Q: スプレッドシートを複数使いたい

A: 環境変数 `GOOGLE_SHEETS_SPREADSHEET_ID` を変更するか、複数の環境変数ファイル（`.env.development`, `.env.production`）を使用してください。

### Q: シート名を変更したい

A: 環境変数 `GOOGLE_SHEETS_SHEET_NAME` を設定してください。デフォルトは `Sheet1` です。

### Q: データが表示されない

A: 以下を確認してください：
- `is_public` が `TRUE` になっているか
- 必須フィールド（`id`, `title`, `date`）が入力されているか
- 環境変数が正しく設定されているか
- スプレッドシートの共有設定が正しいか

### Q: エラーが発生する

A: ブラウザのコンソールとサーバーのログを確認してください。よくある原因：
- 環境変数の設定ミス
- スプレッドシートIDの誤り
- 認証情報の誤り
- APIの有効化漏れ

---

## 🔗 関連ドキュメント

- [UPDATE_GUIDE.md](./UPDATE_GUIDE.md) - 記事更新ガイド
- [SPREADSHEET_TEMPLATE.md](./SPREADSHEET_TEMPLATE.md) - スプレッドシートテンプレート
- [README.md](../README.md) - セットアップ手順

---

## 📞 サポート

問題が解決しない場合は、以下を確認してください：

1. Google Cloud ConsoleでAPIが有効化されているか
2. スプレッドシートの共有設定が正しいか
3. 環境変数の形式が正しいか（特にサービスアカウントキーのエスケープ）

