# 🔍 Vercel環境変数の確認方法

## `GOOGLE_DRIVE_REFRESH_TOKEN`の確認

### 方法1: Vercel CLIで確認（推奨）

```powershell
# 本番環境の環境変数を確認
vercel env ls production

# 特定の環境変数の値を確認（表示されない場合は、値が設定されていない可能性があります）
vercel env pull .env.production
# .env.productionファイルを開いて確認
```

**注意**: セキュリティ上の理由で、`vercel env ls`では値は表示されません。値が設定されているかどうかのみ確認できます。

### 方法2: Vercel Web UIで確認

1. **Vercelダッシュボードにアクセス**
   - https://vercel.com/kintaross-projects/tokusearch/settings/environment-variables

2. **環境変数一覧を確認**
   - `GOOGLE_DRIVE_REFRESH_TOKEN`が表示されているか確認
   - 表示されている場合、値は`●●●●●●`のように隠されています

3. **環境ごとの確認**
   - Production、Preview、Developmentの各環境で設定されているか確認

### 方法3: 環境変数が設定されているかテストする

以下のコマンドで、環境変数が正しく読み込まれているか確認できます：

```powershell
# ローカルでテスト（.env.localが必要）
node -e "require('dotenv').config({ path: '.env.local' }); console.log(process.env.GOOGLE_DRIVE_REFRESH_TOKEN ? '設定済み' : '未設定')"
```

## 🔧 環境変数が設定されていない場合

### リフレッシュトークンを再取得する

1. **認証URLを生成**
   ```powershell
   node scripts/generate-auth-url.js
   ```

2. **ブラウザで認証URLを開き、認証コードを取得**

3. **リフレッシュトークンを取得してVercelに設定**
   ```powershell
   node scripts/get-refresh-token-with-code.js
   ```

### 手動でVercelに設定する

1. **Vercelダッシュボードにアクセス**
   - https://vercel.com/kintaross-projects/tokusearch/settings/environment-variables

2. **「Add New」をクリック**

3. **以下を入力**
   - **Key**: `GOOGLE_DRIVE_REFRESH_TOKEN`
   - **Value**: リフレッシュトークン（`1//...`で始まる文字列）
   - **Environment**: Production, Preview, Development をすべて選択

4. **「Save」をクリック**

5. **再デプロイ**
   ```powershell
   vercel --prod --yes
   ```

## 📋 確認すべき3つの環境変数

以下の3つがすべて設定されているか確認してください：

1. `GOOGLE_DRIVE_CLIENT_ID`
2. `GOOGLE_DRIVE_CLIENT_SECRET`
3. `GOOGLE_DRIVE_REFRESH_TOKEN`

## ⚠️ トラブルシューティング

### `invalid_client`エラーが発生する場合

1. **クライアントIDとシークレットが正しいか確認**
   - Google Cloud Consoleで確認: https://console.cloud.google.com/apis/credentials

2. **リダイレクトURIが正しく設定されているか確認**
   - Google Cloud ConsoleのOAuth 2.0認証情報で、以下のURIが登録されているか確認：
     - `http://localhost:3000/oauth2callback`
     - `https://tokusearch.vercel.app/oauth2callback`

3. **リフレッシュトークンが有効か確認**
   - リフレッシュトークンは無期限ですが、Google Cloud Consoleで認証情報を削除した場合は無効になります
   - その場合は、再度リフレッシュトークンを取得する必要があります

## 🔐 セキュリティ注意事項

- リフレッシュトークンは機密情報です。Gitにコミットしないでください
- `.env.local`ファイルは`.gitignore`に含まれています
- Vercelの環境変数は暗号化されて保存されます



