# 🚀 クイックスタートガイド

このガイドでは、**5分で** TokuSearchサイトをセットアップする方法を説明します。

## ステップ1: 環境変数の自動セットアップ（2分）

```bash
npm run setup
```

**PowerShellでエラーが出る場合:**
```bash
node scripts/setup-env.js
```

対話形式で `.env.local` ファイルが作成されます。

**必要な情報:**
- スプレッドシートID（後で作成します）
- APIキー または サービスアカウントJSON

## ステップ2: Googleスプレッドシートの作成（2分）

### 2-1. スプレッドシートを作成

1. [Googleスプレッドシート](https://sheets.google.com/) にアクセス
2. 「空白」をクリック
3. スプレッドシート名を変更（例: `TokuSearch お得情報データ`）

### 2-2. スプレッドシートIDを取得

URLからIDをコピー:
```
https://docs.google.com/spreadsheets/d/[ここがID]/edit
```

### 2-3. テンプレートCSVをインポート

```bash
npm run create-template
```

**PowerShellでエラーが出る場合:**
```bash
node scripts/create-template-sheet.js
```

生成された `spreadsheet-template.csv` をGoogleスプレッドシートにインポート:
1. ファイル → インポート → アップロード
2. `spreadsheet-template.csv` を選択
3. 「カンマ区切り」を選択してインポート

または、CSVファイルを開いて内容をコピー＆ペースト

## ステップ3: Google Cloud Consoleで認証設定（1分）

### 方法A: APIキー（簡単・公開スプレッドシート）

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを選択（または新規作成）
3. 「APIとサービス」→「ライブラリ」
4. 「Google Sheets API」を検索して有効化
5. 「APIとサービス」→「認証情報」→「認証情報を作成」→「APIキー」
6. APIキーをコピー
7. スプレッドシートを「共有」→「リンクを知っている全員」に公開

### 方法B: サービスアカウント（推奨・プライベート）

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを選択（または新規作成）
3. 「APIとサービス」→「認証情報」→「認証情報を作成」→「サービスアカウント」
4. サービスアカウント名を入力 → 「作成」
5. 「キー」タブ → 「キーを追加」→「新しいキーを作成」→「JSON」
6. JSONファイルをダウンロード
7. スプレッドシートを「共有」→ JSONファイル内の `client_email` を追加（閲覧権限）

## ステップ4: 環境変数を設定

### 方法1: 自動セットアップ（推奨）

```bash
npm run setup
```

スプレッドシートIDと認証情報を入力すると、`.env.local` が自動生成されます。

### 方法2: 手動設定

`.env.local.example` をコピーして `.env.local` を作成:

```bash
cp .env.local.example .env.local
```

`.env.local` を編集して値を設定:

```env
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SHEETS_API_KEY=your_api_key
# または
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

## ステップ5: 動作確認

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開いて、データが表示されることを確認！

## ✅ 完了！

これでセットアップは完了です。スプレッドシートにデータを追加すると、自動的にサイトに反映されます。

## 📚 詳細ドキュメント

- [docs/SETUP_SPREADSHEET.md](./docs/SETUP_SPREADSHEET.md) - 詳細なセットアップ手順
- [docs/UPDATE_GUIDE.md](./docs/UPDATE_GUIDE.md) - 記事更新ガイド
- [docs/SPREADSHEET_TEMPLATE.md](./docs/SPREADSHEET_TEMPLATE.md) - スプレッドシートテンプレート

## 🆘 トラブルシューティング

### データが表示されない

1. `.env.local` が正しく設定されているか確認
2. スプレッドシートの `is_public` が `TRUE` になっているか確認
3. ブラウザのコンソールでエラーを確認

### エラーが発生する

1. Google Sheets APIが有効化されているか確認
2. スプレッドシートの共有設定を確認
3. 環境変数の形式が正しいか確認

