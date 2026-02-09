# 📦 環境変数インポートガイド

## ステップ1: `.env.production` ファイルを編集

1. プロジェクトフォルダの `.env.production` ファイルを開く
2. 以下の値を入力：

```env
GOOGLE_SHEETS_SPREADSHEET_ID=あなたのスプレッドシートID
GOOGLE_SHEETS_SHEET_NAME=Sheet1
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

**重要**: 
- `GOOGLE_SERVICE_ACCOUNT_KEY` は JSON全体を**1行**で貼り付けてください
- 改行は含めないでください

---

## ステップ2: Vercelにインポート

### 方法A: Web UIから（簡単）

1. https://vercel.com/kintaross-projects/tokusearch/settings/environment-variables を開く

2. ページ右上の **"Import .env"** ボタンをクリック

3. `.env.production` ファイルを選択してアップロード

4. **Environment** で `Production`, `Preview`, `Development` を選択

5. **"Import"** をクリック

### 方法B: CLIから

```powershell
# .env.production の内容をVercelにアップロード
vercel env pull .env.production
```

---

## ステップ3: 再デプロイ

環境変数をインポートしたら、以下のいずれかで再デプロイ：

### Web UIから
1. **Deployments** タブを開く
2. 最新のデプロイの「...」→「Redeploy」

### CLIから
```powershell
vercel --prod --yes
```

---

## ✅ 完了！

再デプロイが完了すると、サイトが実際のGoogle Sheetsデータを表示するようになります。

---

## 🔍 スプレッドシートIDの確認方法

スプレッドシートのURLから取得：
```
https://docs.google.com/spreadsheets/d/【このID部分】/edit
                                      ↑
                           これがスプレッドシートID
```

例: `1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t`

---

## 🔑 サービスアカウントキーの確認

`.env.local` ファイルに保存されているはずです。
確認できない場合は、Google Cloud Consoleから再取得してください。

