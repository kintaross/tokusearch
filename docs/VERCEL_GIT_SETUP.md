# Vercel を Git 連携に乗り換える手順

いまは「直接デプロイ」や ZIP アップロードで運用している場合、Git（GitHub / GitLab 等）経由のデプロイに切り替える手順です。

## 前提

- ローカルで **Git リポジトリは初期化済み**（`git init` 済み、初回コミット済み）
- ブランチ名は **`main`**

## 1. GitHub にリポジトリを作成

1. [GitHub](https://github.com/new) で **New repository** を開く
2. リポジトリ名（例: `tokuSearch`）を入力
3. **Private** または **Public** を選択
4. **Create repository** をクリック（README 等は追加しない）
5. 表示される **リポジトリ URL**（例: `https://github.com/あなたのユーザー名/tokuSearch.git`）を控える

## 2. リモートを追加してプッシュ

プロジェクトルートで実行:

```powershell
git remote add origin https://github.com/あなたのユーザー名/tokuSearch.git
git push -u origin main
```

（URL は実際のリポジトリ URL に置き換えてください。GitHub の「Code」ボタンからコピーできます。）

## 3. Vercel で Git からインポート

### 既存の Vercel プロジェクトがある場合

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. 該当プロジェクト（例: tokusearch）を開く
3. **Settings** → **Git** を開く
4. **Connect Git Repository** をクリックし、GitHub のリポジトリを選択して接続
5. 接続後は **main** ブランチへの push で自動デプロイされます

既存プロジェクトを「Git に切り替え」できない場合は、下記「新規に Git から作成」で新プロジェクトを作り、同じドメインを割り当てる方法もあります。

### 新規に Git から作成する場合

1. [Vercel Dashboard](https://vercel.com/dashboard) → **Add New...** → **Project**
2. **Import Git Repository** で GitHub を選び、**tokuSearch** リポジトリを選択
3. **Import** をクリック
4. Framework Preset: **Next.js** のまま、**Deploy** をクリック
5. デプロイ後、**Settings** → **Environment Variables** で本番用の環境変数を設定（既存の手動デプロイで使っていた値と同じものを設定）
6. 必要なら **Redeploy** で再デプロイ

## 4. 今後のデプロイ

- **main** ブランチに `git push` すると、Vercel が自動でビルド・デプロイします
- プレビュー用に別ブランチを push すると、そのブランチ用のプレビューURLが発行されます

## 注意

- 秘密情報（`.env.production`、`client_secret*.json` 等）は `.gitignore` で除外済みのため、リポジトリには含まれません。Vercel の **Environment Variables** で本番用の値を設定してください。
- 既存の「手動デプロイ」や「ZIP デプロイ」は、Git 連携に切り替えたあとは使わず、**Git の push のみ**でデプロイする運用にすると分かりやすいです。
