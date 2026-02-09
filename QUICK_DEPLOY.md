# 🚀 5分でデプロイ！クイックスタートガイド

## 最も簡単な方法（Gitなし）

### ステップ1: Vercelアカウント作成
1. https://vercel.com/ を開く
2. 「Sign Up」をクリック
3. Githubまたはメールで登録

### ステップ2: プロジェクトをデプロイ

**オプションA: Gitを使う（推奨）**

プロジェクトフォルダで実行：
```bash
# Gitがインストールされている場合
git init
git add .
git commit -m "Initial commit"

# Vercel CLIでデプロイ
npx vercel --prod
```

**オプションB: Web UIから直接デプロイ（Gitなし）**

1. Vercelダッシュボードにログイン
2. 「Add New...」→「Project」
3. 「Import Git Repository」または「Deploy with Vercel CLI」を選択
4. このプロジェクトフォルダを選択

### ステップ3: 環境変数を設定

Vercelダッシュボードで：

1. プロジェクト → Settings → Environment Variables
2. 以下を追加：

```
GOOGLE_SHEETS_SPREADSHEET_ID = (スプレッドシートのID)
GOOGLE_SHEETS_SHEET_NAME = Sheet1
GOOGLE_SERVICE_ACCOUNT_KEY = (サービスアカウントのJSON全体)
```

3. 「Save」して「Redeploy」

### 完了！ 🎉

あなたのサイトは `https://yourproject.vercel.app` で公開されました！

---

## トラブルシューティング

**データが表示されない？**
- 環境変数が正しく設定されているか確認
- Google Sheetsがサービスアカウントと共有されているか確認
- Vercelのログを確認（Dashboard → Deployments → View Function Logs）

**ビルドエラー？**
- `node_modules`フォルダを削除して `npm install` を実行
- Vercelで再デプロイ

---

詳細は `DEPLOYMENT.md` をご覧ください。

