# 🔧 OAuth 2.0 トラブルシューティングガイド

## `invalid_grant`エラーの解決方法

### エラーの原因

`invalid_grant`エラーは、リフレッシュトークンが無効であることを示しています。以下の原因が考えられます：

1. **リフレッシュトークンが期限切れまたは取り消し済み**
2. **リフレッシュトークンが別のクライアントID/シークレットで取得されたもの**
3. **Google Cloud Consoleで認証情報がリセットされた**
4. **リフレッシュトークンが正しく設定されていない**

### 解決方法

#### ステップ1: 新しいリフレッシュトークンを取得

1. **認証URLを生成**
   ```powershell
   node scripts/reset-oauth-token.js
   ```

2. **ブラウザで認証URLを開く**
   - 表示されたURLをコピーしてブラウザで開く
   - Googleアカウントでログイン（必要に応じて）
   - 「許可」をクリック

3. **認証コードを取得**
   - リダイレクト後のURLから認証コードを取得
   - URLの例: `http://localhost:3000/oauth2callback?code=4/0AeanS...`
   - `code=` の後の文字列（`&` の前まで）をコピー

4. **リフレッシュトークンを取得してVercelに設定**
   ```powershell
   node scripts/reset-oauth-token.js <認証コード>
   ```

#### ステップ2: Google Cloud Consoleの設定を確認

1. **OAuth 2.0認証情報を確認**
   - https://console.cloud.google.com/apis/credentials
   - OAuth 2.0クライアントIDが正しく設定されているか確認

2. **リダイレクトURIを確認**
   - 以下のURIが登録されているか確認：
     - `http://localhost:3000/oauth2callback`
     - `https://tokusearch.vercel.app/oauth2callback`

3. **認証情報をリセット（必要に応じて）**
   - Google Cloud Consoleで認証情報を削除
   - 新しい認証情報を作成
   - 上記の手順でリフレッシュトークンを再取得

#### ステップ3: 再デプロイ

環境変数を設定した後、必ず再デプロイしてください：

```powershell
vercel --prod --yes
```

## その他のエラー

### `invalid_client`エラー

**原因**: クライアントIDまたはクライアントシークレットが正しくない

**解決方法**:
1. Google Cloud ConsoleでOAuth 2.0認証情報を確認
2. クライアントIDとシークレットが正しく設定されているか確認
3. Vercelの環境変数が正しく設定されているか確認

### `access_denied`エラー

**原因**: ユーザーが認証を拒否した、またはスコープが不足している

**解決方法**:
1. 認証URLを再度開いて、すべての権限を許可する
2. スコープが正しく設定されているか確認（`https://www.googleapis.com/auth/drive`）

### リフレッシュトークンが取得できない

**原因**: 既に認証済みの場合、リフレッシュトークンが返されないことがある

**解決方法**:
1. Google Cloud Consoleで認証情報を削除
2. 新しい認証情報を作成
3. `prompt: 'consent'`を使用して認証URLを生成（`reset-oauth-token.js`で実装済み）

## 確認事項チェックリスト

- [ ] Google Cloud ConsoleでOAuth 2.0認証情報が正しく設定されている
- [ ] リダイレクトURIが正しく登録されている
- [ ] Vercelの環境変数が正しく設定されている（Production, Preview, Development）
- [ ] リフレッシュトークンが最新である
- [ ] 再デプロイが完了している

## 参考リンク

- [Google OAuth 2.0 ドキュメント](https://developers.google.com/identity/protocols/oauth2)
- [Google Drive API ドキュメント](https://developers.google.com/drive/api)
- [Vercel環境変数設定](https://vercel.com/docs/concepts/projects/environment-variables)



