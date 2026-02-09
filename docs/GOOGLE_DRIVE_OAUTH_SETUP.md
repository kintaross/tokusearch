# Google Drive OAuth 2.0認証情報のセットアップガイド

## 🚀 自動セットアップ（推奨）

最も簡単な方法です。以下のコマンドを実行するだけで、OAuth 2.0認証情報の取得とVercelへの設定を自動で行います。

```bash
npm run drive:setup-oauth
```

または:

```bash
node scripts/setup-google-drive-oauth.js
```

### 手順

1. **Google Cloud ConsoleでOAuth 2.0認証情報を作成**（初回のみ）
   - スクリプトが手順を表示します
   - または、下記の「手動セットアップ」を参照

2. **スクリプトを実行**
   - OAuth 2.0クライアントIDとシークレットを入力
   - ブラウザで認証URLにアクセス
   - 認証コードを入力
   - Vercelへの自動設定を選択（y/N）

3. **完了！**
   - 環境変数がVercelに設定されます
   - 再デプロイを実行: `vercel --prod --yes`

---

## 📝 手動セットアップ

### ステップ1: Google Cloud ConsoleでOAuth 2.0認証情報を作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを選択（既存のプロジェクト、または新規作成）
3. **APIとサービス** → **ライブラリ** に移動
4. 「Google Drive API」を検索して**有効にする**
5. **APIとサービス** → **認証情報** に移動
6. **認証情報を作成** → **OAuth クライアント ID** をクリック
7. **アプリケーションの種類** で「ウェブアプリケーション」を選択
8. **名前** を入力（例: `TokuSearch Drive Upload`）
9. **承認済みのリダイレクト URI** に以下を追加:
   - `http://localhost:3000/oauth2callback`（開発用）
   - `https://tokusearch.vercel.app/oauth2callback`（本番用）
   - カスタムドメインがある場合: `https://yourdomain.com/oauth2callback`
10. **作成** をクリック
11. **クライアント ID** と **クライアント シークレット** をコピー（後で使用）

### ステップ2: リフレッシュトークンを取得

#### 方法A: 自動スクリプトを使用（推奨）

```bash
npm run drive:get-token
```

または:

```bash
node scripts/get-google-drive-refresh-token.js
```

1. クライアントIDとシークレットを入力（または環境変数で設定）
2. ブラウザで表示されたURLにアクセス
3. Googleアカウントでログインし、アクセスを許可
4. リダイレクトされたページのURLから認証コードを取得（`code=` の後の文字列）
5. 認証コードをスクリプトに入力
6. リフレッシュトークンを取得

#### 方法B: 手動で取得

1. 以下のURLをブラウザで開く（`YOUR_CLIENT_ID`を実際のクライアントIDに置き換える）:
   ```
   https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000/oauth2callback&response_type=code&scope=https://www.googleapis.com/auth/drive.file&access_type=offline&prompt=consent
   ```

2. Googleアカウントでログインし、アクセスを許可
3. リダイレクトされたページのURLから認証コードを取得（`code=` の後の文字列）
4. 以下のコマンドでリフレッシュトークンを取得:
   ```bash
   curl -X POST https://oauth2.googleapis.com/token \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "code=YOUR_CODE" \
     -d "grant_type=authorization_code" \
     -d "redirect_uri=http://localhost:3000/oauth2callback"
   ```

5. レスポンスから `refresh_token` を取得

### ステップ3: Vercelに環境変数を設定

#### 方法A: 自動設定（推奨）

`npm run drive:setup-oauth` を実行し、「Vercelに環境変数を自動設定しますか？」で `y` を選択

#### 方法B: Vercel CLIで手動設定

```bash
vercel env add GOOGLE_DRIVE_CLIENT_ID production
# プロンプトでクライアントIDを入力

vercel env add GOOGLE_DRIVE_CLIENT_SECRET production
# プロンプトでクライアントシークレットを入力

vercel env add GOOGLE_DRIVE_REFRESH_TOKEN production
# プロンプトでリフレッシュトークンを入力
```

**Preview環境とDevelopment環境にも設定する場合**:
```bash
vercel env add GOOGLE_DRIVE_CLIENT_ID preview
vercel env add GOOGLE_DRIVE_CLIENT_SECRET preview
vercel env add GOOGLE_DRIVE_REFRESH_TOKEN preview

vercel env add GOOGLE_DRIVE_CLIENT_ID development
vercel env add GOOGLE_DRIVE_CLIENT_SECRET development
vercel env add GOOGLE_DRIVE_REFRESH_TOKEN development
```

#### 方法C: Vercelダッシュボードで設定

1. [Vercelダッシュボード](https://vercel.com/dashboard) にアクセス
2. プロジェクトを選択
3. **Settings** → **Environment Variables** に移動
4. **Add New** をクリック
5. 以下の3つの環境変数を追加:
   - `GOOGLE_DRIVE_CLIENT_ID` = クライアントID
   - `GOOGLE_DRIVE_CLIENT_SECRET` = クライアントシークレット
   - `GOOGLE_DRIVE_REFRESH_TOKEN` = リフレッシュトークン
6. **Environment** で `Production`, `Preview`, `Development` すべてにチェック
7. **Save** をクリック

### ステップ4: 再デプロイ

環境変数を設定したら、再デプロイを実行:

```bash
vercel --prod --yes
```

---

## ✅ 動作確認

1. 管理画面にログイン
2. コラム作成/編集ページを開く
3. 「サムネイル画像」セクションで画像を選択
4. アップロードが成功することを確認
5. Google Driveで `TokuSearch/columns/thumbnails/{年}/{月}/` フォルダを確認

---

## 🔍 トラブルシューティング

### エラー: "OAuth 2.0認証情報が設定されていません"

**解決方法**:
- 環境変数が正しく設定されているか確認: `vercel env ls`
- 再デプロイを実行: `vercel --prod --yes`

### エラー: "invalid_grant" または "Token has been expired or revoked"

**原因**: リフレッシュトークンが無効になっています。

**解決方法**:
1. リフレッシュトークンを再取得: `npm run drive:get-token`
2. 新しいリフレッシュトークンをVercelに設定
3. 再デプロイ

### リフレッシュトークンが取得できない

**原因**: 既に認証済みの場合、リフレッシュトークンが返されないことがあります。

**解決方法**:
1. Google Cloud Consoleで認証情報を削除
2. 再度認証フローを実行
3. `prompt=consent` パラメータを使用（スクリプトでは自動で設定されます）

---

## 📚 関連ドキュメント

- [Google Drive API セットアップガイド](./GOOGLE_DRIVE_SETUP.md) - 詳細な技術情報
- [Google Cloud Console](https://console.cloud.google.com/) - OAuth 2.0認証情報の作成

