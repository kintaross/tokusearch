# Slack OAuth2認証設定ガイド

## 問題

`Wait for Approval`ノードで「Unable to sign without access token」エラーが発生しています。

## 原因

`sendAndWait`操作には`oAuth2`認証が必要ですが、認証情報が正しく設定されていません。

## 解決方法

### 方法1: n8nでSlack OAuth2認証情報を作成する（推奨）

1. **n8nのワークフローエディタを開く**
   - ワークフローを開く

2. **`Wait for Approval`ノードを開く**
   - ノードをクリック

3. **認証情報を設定**
   - 「Credentials」セクションを開く
   - 「Create New」または「Add Credential」をクリック
   - 「Slack OAuth2 API」を選択

4. **Slack Appの設定**
   - **Client ID**: Slack AppのClient ID
   - **Client Secret**: Slack AppのClient Secret
   - **Scope**: 以下のスコープが必要
     - `chat:write`
     - `channels:read`
     - `im:read`
     - `users:read`

5. **認証を完了**
   - 「Connect my account」をクリック
   - Slackで認証を許可

6. **認証情報を保存**
   - 認証情報名を入力（例: "Slack OAuth2"）
   - 「Save」をクリック

7. **ワークフローに適用**
   - `Wait for Approval`ノードで作成した認証情報を選択
   - ワークフローを保存

### 方法2: 既存の認証情報を使用する

既に`oAuth2`認証情報がある場合：

1. **`Wait for Approval`ノードを開く**
2. **認証情報を選択**
   - 「Credentials」から既存の`oAuth2`認証情報を選択
3. **ワークフローを保存**

### 方法3: ワークフローファイルを直接修正する

n8nで認証情報を作成した後、認証情報IDを確認してワークフローファイルを修正：

1. **認証情報IDを確認**
   - n8nの「Credentials」ページで作成した認証情報のIDを確認
   - または、ワークフローエディタでノードを開き、認証情報のIDを確認

2. **ワークフローファイルを修正**
   ```json
   "credentials": {
     "slackOAuth2Api": {
       "id": "【ここに認証情報IDを入力】",
       "name": "Slack account"
     }
   }
   ```

## Slack Appの設定

Slack AppでOAuth2認証を有効にする必要があります：

1. [Slack API](https://api.slack.com/apps)にアクセス
2. 対象のSlack Appを選択
3. **OAuth & Permissions**を開く
4. **Redirect URLs**に以下を追加：
   ```
   https://[n8n-instance]/rest/oauth2-credential/callback
   ```
5. **Scopes**に以下を追加：
   - `chat:write`
   - `channels:read`
   - `im:read`
   - `users:read`
6. **Client ID**と**Client Secret**をコピー

## トラブルシューティング

### エラー: "Unable to sign without access token"

**原因**: OAuth2認証情報が正しく設定されていない、または認証が完了していない

**解決方法**:
1. 認証情報を再作成
2. 「Connect my account」をクリックして再認証
3. スコープが正しく設定されているか確認

### エラー: "Invalid client credentials"

**原因**: Client IDまたはClient Secretが間違っている

**解決方法**:
1. Slack Appの設定でClient IDとClient Secretを確認
2. n8nの認証情報設定で正しい値を入力

### エラー: "Missing required scope"

**原因**: 必要なスコープが設定されていない

**解決方法**:
1. Slack Appの「OAuth & Permissions」で必要なスコープを追加
2. 認証情報を再作成して再認証



