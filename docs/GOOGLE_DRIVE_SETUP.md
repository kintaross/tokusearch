# Google Drive API セットアップガイド

## 概要

TokuSearchのコラム機能で、画像をGoogle Driveに保存するためのセットアップ手順です。

**重要**: Service Accountにはストレージクォータがないため、OAuth 2.0認証を使用してユーザーのトークンでファイルを作成します。

## 前提条件

- 既にGoogle Sheets APIを使用している（同じGoogle Cloudプロジェクトを使用）
- Googleアカウント（個人アカウントでも可）

## セットアップ手順

### 1. Google Cloud ConsoleでDrive APIを有効化

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 既存のプロジェクト（Google Sheets APIを使用しているプロジェクト）を選択
3. **APIとサービス** → **ライブラリ** に移動
4. 「Google Drive API」を検索
5. **Google Drive API** をクリック
6. **有効にする** をクリック

### 2. OAuth 2.0認証情報を作成

1. **APIとサービス** → **認証情報** に移動
2. **認証情報を作成** → **OAuth クライアント ID** をクリック
3. **アプリケーションの種類** で「ウェブアプリケーション」を選択
4. **名前** を入力（例: `TokuSearch Drive Upload`）
5. **承認済みのリダイレクト URI** に以下を追加:
   - `http://localhost:3000/oauth2callback`（開発用）
   - `https://tokusearch.vercel.app/oauth2callback`（本番用）
   - カスタムドメインがある場合: `https://yourdomain.com/oauth2callback`
6. **作成** をクリック
7. **クライアント ID** と **クライアント シークレット** をコピー（後で使用）

### 3. リフレッシュトークンを取得

#### 方法1: スクリプトを使用（推奨）

1. 環境変数を設定:
   ```bash
   export GOOGLE_DRIVE_CLIENT_ID="your-client-id"
   export GOOGLE_DRIVE_CLIENT_SECRET="your-client-secret"
   ```

2. スクリプトを実行:
   ```bash
   node scripts/get-google-drive-refresh-token.js
   ```

3. ブラウザで表示されたURLにアクセス
4. Googleアカウントでログインし、アクセスを許可
5. リダイレクトされたページのURLから認証コードを取得（`code=` の後の文字列）
6. 認証コードをスクリプトに入力
7. リフレッシュトークンを取得

#### 方法2: 手動で取得

1. 以下のURLをブラウザで開く（`YOUR_CLIENT_ID`を実際のクライアントIDに置き換える）:
   ```
   https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000/oauth2callback&response_type=code&scope=https://www.googleapis.com/auth/drive.file&access_type=offline&prompt=consent
   ```

2. Googleアカウントでログインし、アクセスを許可
3. リダイレクトされたページのURLから認証コードを取得（`code=` の後の文字列）
4. 以下のコマンドでリフレッシュトークンを取得（`YOUR_CLIENT_ID`, `YOUR_CLIENT_SECRET`, `YOUR_CODE`を実際の値に置き換える）:
   ```bash
   curl -X POST https://oauth2.googleapis.com/token \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "code=YOUR_CODE" \
     -d "grant_type=authorization_code" \
     -d "redirect_uri=http://localhost:3000/oauth2callback"
   ```

5. レスポンスから `refresh_token` を取得

### 4. 環境変数を設定

Vercelの環境変数に以下を追加:

```env
GOOGLE_DRIVE_CLIENT_ID=your-client-id
GOOGLE_DRIVE_CLIENT_SECRET=your-client-secret
GOOGLE_DRIVE_REFRESH_TOKEN=your-refresh-token
```

**Vercel CLIで設定する場合**:
```bash
vercel env add GOOGLE_DRIVE_CLIENT_ID production
vercel env add GOOGLE_DRIVE_CLIENT_SECRET production
vercel env add GOOGLE_DRIVE_REFRESH_TOKEN production
```

**Vercelダッシュボードで設定する場合**:
1. Vercelダッシュボード → プロジェクト → Settings
2. Environment Variables → Add New
3. 上記の3つの環境変数を追加
4. Environment: Production, Preview, Development すべてにチェック
5. Save

### 5. 再デプロイ

環境変数を追加したら、再デプロイを実行:

```bash
vercel --prod --yes
```

## 動作確認

### 1. 管理画面で画像をアップロード

1. 管理画面 → コラム作成/編集
2. 「サムネイル画像」セクションで画像を選択
3. アップロードが成功することを確認
4. 画像がプレビュー表示されることを確認

### 2. Google Driveで確認

1. Google Driveを開く
2. `TokuSearch/columns/thumbnails/{年}/{月}/` フォルダを確認
3. アップロードした画像が保存されていることを確認

## トラブルシューティング

### エラー: "Drive API is not enabled"

**解決方法**:
- Google Cloud ConsoleでDrive APIが有効化されているか確認
- プロジェクトが正しく選択されているか確認

### エラー: "OAuth 2.0認証情報が設定されていません"

**解決方法**:
- `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, `GOOGLE_DRIVE_REFRESH_TOKEN` が正しく設定されているか確認
- Vercelの環境変数が正しく設定されているか確認
- 再デプロイを実行

### エラー: "invalid_grant" または "Token has been expired or revoked"

**原因**: リフレッシュトークンが無効になっている可能性があります。

**解決方法**:
1. リフレッシュトークンを再取得（上記の手順3を参照）
2. 新しいリフレッシュトークンを環境変数に設定
3. 再デプロイ

### エラー: "Service Accounts do not have storage quota"

**原因**: Service Accountを使用してファイルを作成しようとしている場合に発生します。

**解決方法**:
- OAuth 2.0認証情報（`GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, `GOOGLE_DRIVE_REFRESH_TOKEN`）が正しく設定されているか確認
- Service Accountではなく、OAuth 2.0認証を使用していることを確認

### 画像が表示されない

**確認事項**:
1. Google Driveのファイルが共有設定（Anyone with the link）になっているか
2. 画像URLが正しく保存されているか（Google Sheetsの`thumbnail_url`列を確認）
3. ブラウザのコンソールでエラーが出ていないか

## 技術的な詳細

### アップロードフロー

1. クライアント（管理画面）から画像ファイルを選択
2. `/api/admin/upload` にPOSTリクエスト
3. OAuth 2.0リフレッシュトークンを使用してアクセストークンを取得
4. アクセストークンでGoogle Drive APIを使用してアップロード
5. ファイルを共有可能に設定（Anyone with the link）
6. 画像URLを生成: `https://drive.google.com/uc?export=view&id={fileId}`
7. URLをGoogle Sheetsの`thumbnail_url`列に保存

### 使用しているスコープ

- `https://www.googleapis.com/auth/drive.file` - ファイルの作成・管理用（最小権限の原則）

### ファイル保存場所

**ディレクトリ構造**:
```
Google Drive (ユーザーアカウント)/
└── TokuSearch/
    └── columns/
        └── thumbnails/
            └── {年}/
                └── {月}/
                    └── column-thumbnail-{timestamp}-{random}.{extension}
```

**例**:
```
TokuSearch/
  columns/
    thumbnails/
      2024/
        11/
          column-thumbnail-1732800000000-abc123.jpg
          column-thumbnail-1732800001000-def456.png
```

- フォルダは自動的に作成されます（存在しない場合）
- ファイル名: `column-thumbnail-{timestamp}-{random}.{extension}`
- 共有設定: Anyone with the link can view
- **所有権**: ユーザーアカウント（OAuth 2.0で認証したアカウント）

## 注意事項

1. **ストレージ容量**: Google Driveの無料プランは15GBまで（OAuth 2.0で認証したユーザーのクォータを使用）
2. **ファイル管理**: 削除されたコラムの画像は手動でGoogle Driveから削除する必要があります
3. **共有設定**: すべての画像が「リンクを知っている全員が閲覧可能」になります
4. **リフレッシュトークン**: リフレッシュトークンは機密情報です。環境変数に安全に保存してください

## 今後の改善案

- 特定のフォルダに画像を整理
- 不要な画像の自動削除機能
- 画像の最適化（リサイズ、圧縮）
