# お得情報まとめサイト

Xを徘徊しなくても、その日のお得情報を効率的に確認できる「閲覧専用」の一般公開サイト。

## 🚀 クイックスタート（5分）

**詳細は [QUICK_START.md](./QUICK_START.md) を参照してください。**

```bash
# 1. 依存関係をインストール
npm install

# 2. 環境変数を自動セットアップ（対話形式）
npm run setup
# PowerShellでエラーが出る場合: node scripts/setup-env.js

# 3. スプレッドシートテンプレートCSVを生成
npm run create-template
# PowerShellでエラーが出る場合: node scripts/create-template-sheet.js

# 4. Googleスプレッドシートを作成してCSVをインポート
# （Google Cloud Consoleで認証設定も必要）

# 5. 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

## 📋 セットアップ手順（詳細）

### 1. Node.jsをインストール（v18以上推奨）

### 2. 依存関係をインストール
```bash
npm install
```

### 3. Googleスプレッドシートを設置

**自動セットアップ:**
```bash
npm run create-template  # CSVテンプレートを生成
```

**手動セットアップ:**
- [Googleスプレッドシート](https://sheets.google.com/) で新規作成
- ヘッダー行を設定（`id`, `date`, `title`, `summary`, `category_main`, `is_public`, `priority` など）
- スプレッドシートIDを取得（URLの `/d/` と `/edit` の間）

詳細: [docs/SETUP_SPREADSHEET.md](./docs/SETUP_SPREADSHEET.md)

### 4. 環境変数を設定

**自動セットアップ（推奨）:**
```bash
npm run setup
```

**手動セットアップ:**
`.env.local.example` をコピーして `.env.local` を作成し、値を設定:

```env
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SHEETS_API_KEY=your_api_key
# または
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

### 5. Google Cloud Consoleで認証設定

**方法1: APIキー（公開スプレッドシート用・簡単）**
- [Google Cloud Console](https://console.cloud.google.com/) でAPIキーを取得
- Google Sheets APIを有効化
- スプレッドシートを「リンクを知っている全員」に公開

**方法2: サービスアカウント（プライベートスプレッドシート用・推奨）**
- Google Cloud Consoleでサービスアカウントを作成
- JSONキーをダウンロード
- スプレッドシートにサービスアカウントのメールアドレスを共有（閲覧権限）

詳細: [docs/SETUP_SPREADSHEET.md](./docs/SETUP_SPREADSHEET.md)

## 機能

- お得情報の一覧表示（グリッド/リスト切り替え・ページネーション対応）
- フリーワード検索 / 検索履歴
- 期間・カテゴリ・並び順フィルタ
- 人気・注目セクション、マガジンページ、ランキングページ
- 詳細ページ表示（お気に入り・共有）
- アバウト / ポリシーページ

## 記事の更新方法

このサイトは**Google Sheets**をデータソースとして使用しています。

### 基本的な更新方法

1. **Googleスプレッドシートで直接編集**
   - スプレッドシートに新しい行を追加、または既存の行を編集
   - `is_public` を `TRUE` に設定するとサイトに表示されます
   - 詳細は [docs/UPDATE_GUIDE.md](./docs/UPDATE_GUIDE.md) を参照

2. **n8n + LLM による自動収集（推奨）**
   - X（Twitter）などの情報源から自動収集
   - LLMで構造化・分類
   - Google Sheetsに自動書き込み

3. **CSVインポート**
   - 大量データを一度に追加する場合に便利
   - テンプレート形式は [docs/SPREADSHEET_TEMPLATE.md](./docs/SPREADSHEET_TEMPLATE.md) を参照

### 必要なスプレッドシート形式

必須カラム: `id`, `date`, `title`, `summary`, `category_main`, `is_public`, `priority`

詳細なカラム仕様とサンプルデータは [docs/SPREADSHEET_TEMPLATE.md](./docs/SPREADSHEET_TEMPLATE.md) を参照してください。

