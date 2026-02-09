# TokuSearch デプロイメントガイド

## 🚀 Vercelへの公開手順

### 前提条件
- Google Sheetsのスプレッドシートが準備済み
- サービスアカウントキーまたはAPIキーが取得済み
- `.env.local`ファイルが正しく設定されている

---

## 📝 手順

### 1. Vercelアカウントの作成

1. [Vercel](https://vercel.com/)にアクセス
2. 「Sign Up」をクリック
3. GitHubアカウントで登録（推奨）またはメールアドレスで登録

### 2. プロジェクトのデプロイ

#### 方法A: GitHubを使用（推奨）

**Step 1: GitHubリポジトリの作成**

1. [GitHub](https://github.com/)にログイン
2. 「New repository」をクリック
3. リポジトリ名: `tokusearch`（任意）
4. Private/Publicを選択
5. 「Create repository」をクリック

**Step 2: コードをGitHubにプッシュ**

プロジェクトフォルダで以下のコマンドを実行：

```bash
# Gitリポジトリの初期化
git init

# .gitignoreの確認（既に存在します）

# 全ファイルをステージング
git add .

# コミット
git commit -m "Initial commit: TokuSearch"

# GitHubリポジトリをリモートに追加（YOUR_USERNAMEを実際のユーザー名に変更）
git remote add origin https://github.com/YOUR_USERNAME/tokusearch.git

# メインブランチにプッシュ
git branch -M main
git push -u origin main
```

**Step 3: VercelでGitHubリポジトリをインポート**

1. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
2. 「Add New...」→「Project」をクリック
3. 「Import Git Repository」から作成したリポジトリを選択
4. 「Import」をクリック
5. Framework Preset: **Next.js** が自動選択されます
6. 「Deploy」をクリック

#### 方法B: Vercel CLIを使用

```bash
# Vercel CLIをインストール（初回のみ）
npm install -g vercel

# ログイン
vercel login

# デプロイ
vercel

# 本番環境にデプロイ
vercel --prod
```

#### 方法C: ZIPファイルでアップロード（Git不要）

1. プロジェクトフォルダを圧縮（node_modules、.next、.env.localは除外）
2. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
3. 「Add New...」→「Project」
4. 「Deploy from ZIP」を選択
5. ZIPファイルをアップロード

---

### 3. 環境変数の設定

デプロイ後、必ず環境変数を設定してください。

1. Vercelダッシュボードでプロジェクトを開く
2. 「Settings」タブをクリック
3. 「Environment Variables」を選択
4. 以下の環境変数を追加：

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `GOOGLE_SHEETS_SPREADSHEET_ID` | `1abc...` | スプレッドシートID |
| `GOOGLE_SHEETS_SHEET_NAME` | `Sheet1` | シート名（デフォルト: Sheet1）|
| `GOOGLE_SERVICE_ACCOUNT_KEY` | `{"type":"service_account",...}` | サービスアカウントキー（JSON全体）|

**または**

| 変数名 | 値 |
|--------|-----|
| `GOOGLE_SHEETS_SPREADSHEET_ID` | `1abc...` |
| `GOOGLE_SHEETS_SHEET_NAME` | `Sheet1` |
| `GOOGLE_SHEETS_API_KEY` | `AIza...` |

**重要**: `GOOGLE_SERVICE_ACCOUNT_KEY`を使用する場合は、JSON全体を1行で貼り付けてください。

5. 「Save」をクリック
6. 「Redeploy」をクリックして再デプロイ

---

### 4. カスタムドメインの設定（オプション）

1. Vercelダッシュボードでプロジェクトを開く
2. 「Settings」→「Domains」
3. 独自ドメインを追加（お持ちの場合）
4. DNSレコードを設定（Vercelが指示を表示）

---

## ✅ デプロイ完了後の確認

1. Vercelが提供するURL（例: `https://tokusearch.vercel.app`）にアクセス
2. お得情報が正しく表示されることを確認
3. 各機能（検索、フィルター、お気に入りなど）の動作確認

---

## 🔄 更新方法

### GitHubを使用している場合

```bash
# 変更をコミット
git add .
git commit -m "Update: 機能追加"

# GitHubにプッシュ
git push

# Vercelが自動的に検知して再デプロイ
```

### Vercel CLIを使用している場合

```bash
vercel --prod
```

---

## 🐛 トラブルシューティング

### データが表示されない

1. 環境変数が正しく設定されているか確認
2. Google Sheetsの共有設定を確認
   - サービスアカウントのメールアドレスに共有されているか
   - または、APIキーを使用している場合はシートが「リンクを知っている全員」に公開されているか
3. Vercelのログを確認（Function Logs）

### ビルドエラー

- `package.json`の依存関係を確認
- Node.jsのバージョンを確認（Vercelはデフォルトで最新LTSを使用）
- ビルドログでエラーメッセージを確認

---

## 📊 パフォーマンス最適化

Vercelは自動的に以下を行います：
- 自動スケーリング
- グローバルCDN配信
- 画像最適化
- エッジキャッシング

追加の最適化は不要です。

---

## 💡 ヒント

- **無料プラン**: 個人プロジェクトには十分
- **自動デプロイ**: GitHubにプッシュすると自動デプロイ
- **プレビュー**: プルリクエストごとにプレビューURL生成
- **分析**: Vercel Analyticsで訪問者数を確認可能

---

## 📞 サポート

問題が発生した場合：
1. [Vercelドキュメント](https://vercel.com/docs)を確認
2. [Next.jsドキュメント](https://nextjs.org/docs)を確認
3. Vercelサポートに問い合わせ

---

🎉 **デプロイ完了！あなたのお得情報サイトが世界中に公開されました！**

