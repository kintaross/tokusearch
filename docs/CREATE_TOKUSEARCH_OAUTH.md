# 🔐 TokuSearch用OAuth 2.0クライアントIDの作成方法

## 問題

現在使用しているOAuth 2.0クライアントIDは「n8n」用のもので、認証画面に「n8n」が表示されています。
「TokuSearch」用のOAuth 2.0クライアントIDを作成する必要があります。

## 解決方法

### ステップ1: Google Cloud ConsoleでOAuth 2.0クライアントIDを作成

1. **Google Cloud Consoleにアクセス**
   - https://console.cloud.google.com/apis/credentials

2. **プロジェクトを選択**
   - プロジェクト: `reverberant-kit-475103-q0`（または適切なプロジェクト）

3. **OAuth 2.0クライアントIDを作成**
   - 「認証情報を作成」→「OAuth 2.0 クライアント ID」
   - **アプリケーションの種類**: 「ウェブアプリケーション」
   - **名前**: `TokuSearch`（または任意の名前）
   - **承認済みのリダイレクト URI**:
     - `http://localhost:3000/oauth2callback`
     - `https://tokusearch.vercel.app/oauth2callback`
   - 「作成」をクリック

4. **クライアントIDとシークレットをコピー**
   - 表示されたクライアントIDとシークレットをコピー
   - **重要**: シークレットは一度しか表示されません。必ず保存してください

### ステップ2: JSONファイルを作成

プロジェクトルートに以下のJSONファイルを作成してください：

**ファイル名**: `client_secret_tokusearch.json`（または任意の名前）

```json
{
  "web": {
    "client_id": "YOUR_TOKUSEARCH_CLIENT_ID.apps.googleusercontent.com",
    "project_id": "reverberant-kit-475103-q0",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "YOUR_TOKUSEARCH_CLIENT_SECRET",
    "redirect_uris": [
      "http://localhost:3000/oauth2callback",
      "https://tokusearch.vercel.app/oauth2callback"
    ]
  }
}
```

**置き換え**:
- `YOUR_TOKUSEARCH_CLIENT_ID`: ステップ1で取得したクライアントID
- `YOUR_TOKUSEARCH_CLIENT_SECRET`: ステップ1で取得したシークレット

### ステップ3: スクリプトを更新

スクリプトが新しいJSONファイルを読み込むように更新します。

### ステップ4: OAuth同意画面の設定（必要に応じて）

1. **OAuth同意画面を開く**
   - https://console.cloud.google.com/apis/credentials/consent

2. **アプリ情報を設定**
   - **アプリ名**: `TokuSearch`
   - **ユーザーサポートメール**: あなたのメールアドレス
   - **デベロッパーの連絡先情報**: あなたのメールアドレス

3. **スコープを追加**
   - 「スコープを追加または削除」
   - `https://www.googleapis.com/auth/drive` を追加
   - 「保存して次へ」

4. **テストユーザーを追加**（開発中の場合）
   - あなたのGoogleアカウントを追加
   - 「保存して次へ」

5. **概要を確認して「ダッシュボードに戻る」**

## 確認事項

- [ ] 「TokuSearch」という名前のOAuth 2.0クライアントIDが作成された
- [ ] JSONファイルが正しく作成された
- [ ] リダイレクトURIが正しく設定された
- [ ] OAuth同意画面で「TokuSearch」が表示されるようになった

## 次のステップ

JSONファイルを作成したら、以下のコマンドで自動設定を実行してください：

```powershell
node scripts/auto-setup-oauth.js
```

認証画面に「TokuSearch」が表示されることを確認してください。



