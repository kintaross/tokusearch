# Vercel手動デプロイ手順（Git不要）

## 方法1: Vercelダッシュボードから再デプロイ（推奨）

既存のプロジェクトがある場合：

1. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
2. ログイン後、**tokusearch** プロジェクトを選択
3. 「**Deployments**」タブを開く
4. 最新のデプロイの右側の「**...**」（三点リーダー）をクリック
5. 「**Redeploy**」を選択
6. 「**Redeploy**」ボタンをクリック

これで最新のコードが自動的にデプロイされます。

---

## 方法2: ZIPファイルでアップロード（新規プロジェクトの場合）

既存プロジェクトがない場合、または新規デプロイしたい場合：

### ステップ1: プロジェクトを圧縮

1. プロジェクトフォルダで以下を除外してZIPを作成：
   - `node_modules` フォルダ（除外）
   - `.next` フォルダ（除外）
   - `.env.local` ファイル（除外）
   - `.vercel` フォルダ（除外）
   - `debug` フォルダ（除外）

### ステップ2: Vercelにアップロード

1. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
2. 「**Add New...**」→「**Project**」をクリック
3. 「**Deploy from ZIP**」を選択
4. ZIPファイルをアップロード
5. Framework Preset: **Next.js** が自動選択されます
6. 「**Deploy**」をクリック

### ステップ3: 環境変数の設定

デプロイ後、必ず環境変数を設定：

1. プロジェクト → 「**Settings**」タブ
2. 「**Environment Variables**」を選択
3. 以下を追加：

```
GOOGLE_SHEETS_SPREADSHEET_ID = (スプレッドシートのID)
GOOGLE_SHEETS_SHEET_NAME = Sheet1
GOOGLE_SERVICE_ACCOUNT_KEY = (サービスアカウントのJSON全体)
```

4. 「**Save**」をクリック
5. 「**Redeploy**」をクリック

---

## 方法3: コマンドプロンプト（CMD）から実行

PowerShellではなく、通常のコマンドプロンプト（CMD）を使用：

1. Windowsキー + R → `cmd` と入力
2. プロジェクトフォルダに移動：
   ```
   cd C:\Users\ksaka\.cursor\PJ\tokuSearch
   ```
3. Vercel CLIでデプロイ：
   ```
   npx vercel --prod
   ```

---

## 今回の変更内容

✅ **カード型レイアウト対応**
- Markdownパーサー導入（react-markdown）
- カード型レイアウト用CSS追加
- レスポンシブ対応

✅ **共有機能の修正**
- ShareButtonコンポーネントの汎用化
- パスタイプ対応（deals/columns）
- URLエンコード追加

---

## デプロイ後の確認

- [ ] カード型レイアウトが正しく表示される
- [ ] 共有機能が正しく動作する
- [ ] スマホ表示で横スクロールが不要である
- [ ] Markdownが正しくレンダリングされる



