# n8n認証情報セットアップガイド

**作成日**: 2025-11-27  
**対象ワークフロー**: コラム自動生成システム

---

## 📋 概要

このガイドでは、コラム自動生成ワークフローで使用する4つの認証情報の設定方法を詳しく説明します。

---

## 🔐 認証情報一覧

| # | 認証情報名 | タイプ | 使用ノード | 状態 |
|---|-----------|--------|-----------|------|
| 1 | Google Service Account | Google Service Account | Google Sheets | 既存 |
| 2 | Gemini API | Google PaLM API | Gemini記事生成 | 既存 |
| 3 | Gemini Header Auth | Header Auth | Gemini画像生成 | 新規 |
| 4 | N8N API Key | Header Auth | TokuSearch API | 新規 |

---

## 1️⃣ Google Service Account（既存）

### 概要
Google Sheetsへのアクセスに使用します。既に設定済みのため、追加設定は不要です。

### 使用箇所
- **未使用テーマ取得**ノード（Node 2）
- **テーマ使用済み更新**ノード（Node 13）

### 設定確認

1. n8nで「Credentials」→「Google Service Account」を検索
2. 既存の認証情報「Google Service Account account 2」を確認
3. 以下の情報が設定されているか確認:
   ```
   Service Account Email: xxx@xxx.iam.gserviceaccount.com
   Private Key: -----BEGIN PRIVATE KEY-----...
   ```

### 権限確認

Google Sheetsで以下を確認:
```
対象シート: column_themes
権限: サービスアカウントに編集権限を付与
```

---

## 2️⃣ Gemini API（既存）

### 概要
記事生成に使用するGemini APIの認証情報です。既に設定済みのため、追加設定は不要です。

### 使用箇所
- **Gemini記事生成**ノード（Node 5）

### 設定確認

1. n8nで「Credentials」→「Google PaLM API」を検索
2. 既存の認証情報「Google Gemini(PaLM) Api account」を確認
3. 以下の情報が設定されているか確認:
   ```
   API Key: AIzaSy...
   ```

### APIキーの取得方法（必要な場合）

1. Google AI Studioにアクセス
   - URL: https://aistudio.google.com/app/apikey
2. 「Create API Key」をクリック
3. プロジェクトを選択
4. APIキーをコピー
5. n8nの認証情報に貼り付け

### 無料枠

```
モデル: Gemini 2.0 Flash
無料枠: 1日25リクエスト
レート制限: 2リクエスト/分
```

---

## 3️⃣ Gemini Header Auth（新規作成）

### 概要
画像生成に使用するGemini Imagen APIの認証情報です。Header Auth形式で設定します。

### 使用箇所
- **Gemini画像生成**ノード（Node 8）

### 作成手順

#### ステップ1: 認証情報の作成

1. n8nで「Credentials」をクリック
2. 「Create New」→「Header Auth」を選択
3. 名前: `Gemini Header Auth`
4. 以下を設定:
   ```
   Name: x-goog-api-key
   Value: YOUR_GEMINI_API_KEY
   ```
5. 「Save」をクリック

#### ステップ2: APIキーの取得

既存のGemini APIキーを使用できます（追加料金なし）:

1. Google AI Studio（https://aistudio.google.com/app/apikey）にアクセス
2. 既存のAPIキーを確認
3. 新規作成も可能:
   - 「Create API Key」をクリック
   - プロジェクトを選択
   - APIキーをコピー

#### ステップ3: ワークフローに設定

1. 「Gemini画像生成」ノードを開く
2. 「Credential for Header Auth」→「Gemini Header Auth」を選択
3. 保存

### API仕様

**エンドポイント**:
```
https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict
```

**ヘッダー**:
```
x-goog-api-key: YOUR_API_KEY
Content-Type: application/json
```

**リクエストボディ**:
```json
{
  "instances": [{
    "prompt": "画像生成プロンプト"
  }],
  "parameters": {
    "sampleCount": 1,
    "aspectRatio": "16:9",
    "outputMimeType": "image/png"
  }
}
```

**レスポンス**:
```json
{
  "predictions": [{
    "bytesBase64Encoded": "iVBORw0KGgoAAAANS..."
  }]
}
```

### トラブルシューティング

**エラー: 400 Bad Request**
- リクエストボディの形式を確認
- プロンプトが長すぎる可能性（1000文字以内推奨）

**エラー: 401 Unauthorized**
- APIキーが正しいか確認
- ヘッダー名が`x-goog-api-key`であることを確認

**エラー: 404 Not Found**
- エンドポイントURLを確認
- モデル名が正しいか確認（`imagen-3.0-generate-001`）

**代替モデル**:
```
imagen-2.0-generate-001（Imagen 2）
imagen-3.0-generate-001（Imagen 3）
```

---

## 4️⃣ N8N API Key（新規作成）

### 概要
TokuSearch APIへのアクセスに使用する認証情報です。Header Auth形式で設定します。

### 使用箇所
- **画像アップロード**ノード（Node 10）
- **コラム投稿**ノード（Node 12）

### 作成手順

#### ステップ1: API Keyの生成

**PowerShellで生成**:
```powershell
# 32文字のランダムな英数字を生成
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**実行例**:
```
PS C:\> -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
<N8N_API_KEY>
```

このキーをコピーしてください。

#### ステップ2: 環境変数に追加

**ローカル環境（`.env.local`）**:
```env
N8N_API_KEY=<N8N_API_KEY>
```

**Vercel環境**:
```bash
# Vercel CLIで追加
vercel env add N8N_API_KEY production

# または、Vercelダッシュボードで追加
# Settings → Environment Variables → Add
```

#### ステップ3: n8nで認証情報を作成

1. n8nで「Credentials」をクリック
2. 「Create New」→「Header Auth」を選択
3. 名前: `N8N API Key Auth`
4. 以下を設定:
   ```
   Name: x-api-key
   Value: <N8N_API_KEY>
   ```
   （上記で生成したAPI Keyを入力）
5. 「Save」をクリック

#### ステップ4: ワークフローに設定

1. 「画像アップロード」ノードを開く
2. 「Credential for Header Auth」→「N8N API Key Auth」を選択
3. 同様に「コラム投稿」ノードでも設定
4. 保存

### API仕様

**画像アップロードAPI**:
```
POST https://tokusearch.vercel.app/api/admin/columns/upload-image
Headers:
  x-api-key: YOUR_N8N_API_KEY
  Content-Type: application/json
Body:
  {
    "image": "base64データ",
    "filename": "col-123.png"
  }
Response:
  {
    "url": "https://storage.googleapis.com/.../col-123.png"
  }
```

**コラム投稿API**:
```
POST https://tokusearch.vercel.app/api/admin/columns
Headers:
  x-api-key: YOUR_N8N_API_KEY
  Content-Type: application/json
Body:
  {
    "title": "記事タイトル",
    "slug": "",
    "description": "概要",
    "content_markdown": "本文...",
    "category": "ポイント活用術",
    "tags": "楽天ポイント,貯め方",
    "thumbnail_url": "https://...",
    "author": "TokuSearch編集部",
    "status": "published"
  }
Response:
  {
    "id": 123,
    "slug": "generated-slug",
    "created_at": "2025-11-27T09:00:00.000Z"
  }
```

### セキュリティ

1. **API Keyは絶対に公開しない**
   - GitHubなどに誤ってコミットしない
   - `.env.local`を`.gitignore`に追加

2. **定期的にローテーション**
   - 3-6ヶ月ごとにAPI Keyを再生成
   - 新しいキーを環境変数とn8nに設定
   - 古いキーを削除

3. **権限の制限**
   - TokuSearch APIは管理者専用
   - 必要最小限の権限のみ付与

---

## ✅ 認証情報の確認チェックリスト

各ノードで以下を確認してください:

### Node 2: 未使用テーマ取得
- [ ] Google Service Account認証が設定されている
- [ ] スプレッドシートIDが正しい（環境変数から取得）
- [ ] シート名が`column_themes`

### Node 5: Gemini記事生成
- [ ] Google PaLM API認証が設定されている
- [ ] APIキーが有効
- [ ] モデル名が`gemini-2.0-flash-exp`

### Node 8: Gemini画像生成
- [ ] Header Auth（Gemini Header Auth）が設定されている
- [ ] ヘッダー名が`x-goog-api-key`
- [ ] APIキーが有効
- [ ] エンドポイントURLが正しい

### Node 10: 画像アップロード
- [ ] Header Auth（N8N API Key Auth）が設定されている
- [ ] ヘッダー名が`x-api-key`
- [ ] API Keyが環境変数と一致

### Node 12: コラム投稿
- [ ] Header Auth（N8N API Key Auth）が設定されている
- [ ] ヘッダー名が`x-api-key`
- [ ] API Keyが環境変数と一致

### Node 13: テーマ使用済み更新
- [ ] Google Service Account認証が設定されている
- [ ] スプレッドシートIDが正しい
- [ ] シート名が`column_themes`

---

## 🐛 トラブルシューティング

### 問題: "Invalid credentials"エラー

**症状**: ノード実行時に認証エラーが発生

**確認項目**:
1. 認証情報が正しく設定されているか
2. APIキーが有効期限内か
3. ヘッダー名が正しいか（`x-goog-api-key`, `x-api-key`）

**対策**:
1. 認証情報を削除して再作成
2. APIキーを再生成
3. n8nを再起動

### 問題: Google Sheets アクセスエラー

**症状**: "Permission denied"エラー

**原因**:
- サービスアカウントに権限がない
- スプレッドシートIDが間違っている

**対策**:
1. Google Sheetsで共有設定を確認
2. サービスアカウントのメールアドレスに編集権限を付与
3. スプレッドシートIDを再確認

### 問題: Gemini API エラー

**症状**: "API key not valid"

**原因**:
- APIキーが間違っている
- APIが有効化されていない
- 無料枠を超過している

**対策**:
1. Google Cloud Consoleで「Generative Language API」を有効化
2. APIキーを再生成
3. 無料枠の使用状況を確認

### 問題: TokuSearch API エラー

**症状**: "Unauthorized"

**原因**:
- N8N API Keyが間違っている
- 環境変数が設定されていない

**対策**:
1. `.env.local`とVercelの環境変数を確認
2. n8nの認証情報と一致しているか確認
3. Vercelをデプロイし直す

---

## 📚 参考資料

### Google AI Studio
- URL: https://aistudio.google.com/
- APIキー管理: https://aistudio.google.com/app/apikey
- ドキュメント: https://ai.google.dev/

### Gemini API
- 公式ドキュメント: https://ai.google.dev/docs
- 価格: https://ai.google.dev/pricing
- 無料枠: 1日25リクエスト

### n8n認証情報
- 公式ガイド: https://docs.n8n.io/credentials/
- Header Auth: https://docs.n8n.io/credentials/headerauth/

---

**作成者**: TokuSearch開発チーム  
**最終更新**: 2025-11-27



