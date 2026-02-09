# コラム自動生成ワークフロー - 最終セットアップガイド

**ファイル**: `column-workflow-final.json`  
**所要時間**: 10分  
**動作確認**: ✅ Gemini 2.5 Flash（記事生成）

---

## ✅ 設定済み（追加作業不要）

- ✅ **記事生成**: Gemini 2.5 Flash（動作確認済み）
- ✅ **Google Service Account**: 既存認証使用
- ✅ **Gemini API**: 既存認証使用
- ✅ **Spreadsheet**: TokuSearch連携済み
- ✅ **すべてのノード接続**: 完了

---

## 🔧 必要な作業（2つの認証情報のみ）

### 1️⃣ Gemini Header Auth を作成（3分）

画像生成用の認証情報です。

#### ステップ1: 既存のGemini APIキーを確認

**方法1: n8nから確認**
```
n8n → Credentials → Google Gemini(PaLM) Api account → Edit
→ APIキーをコピー
```

**方法2: Google AI Studioから確認**
```
https://aistudio.google.com/app/apikey
→ 既存のAPIキーを確認、またはCreate API Key
```

#### ステップ2: Header Auth認証情報を作成

```
n8n → Credentials → Create New → Header Auth

設定:
  Name: Gemini Header Auth
  Header Name: x-goog-api-key
  Header Value: （ステップ1でコピーしたAPIキー）
```

#### ステップ3: ワークフローに設定

```
「Gemini画像生成」ノード（Node 8）を開く
→ Credential for Header Auth
→ Gemini Header Auth を選択
→ 保存
```

---

### 2️⃣ N8N API Key Auth を作成（5分）

TokuSearch API用の認証情報です。

#### ステップ1: API Keyを生成

**PowerShell**:
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**実行例**:
```
a3Kf8xZq9TyU2pL5nW7mC4vB6jH1sD0g
```

コピーしてメモ帳に保存してください。

#### ステップ2: 環境変数に追加

**ローカル（`.env.local`）**:
```env
N8N_API_KEY=a3Kf8xZq9TyU2pL5nW7mC4vB6jH1sD0g
```

**Vercel**:
```bash
vercel env add N8N_API_KEY production
# プロンプトが表示されたら、生成したキーを貼り付け
```

または、Vercelダッシュボードで:
```
Settings → Environment Variables → Add
Name: N8N_API_KEY
Value: a3Kf8xZq9TyU2pL5nW7mC4vB6jH1sD0g
Environment: Production
→ Save
```

#### ステップ3: n8nで認証情報を作成

```
n8n → Credentials → Create New → Header Auth

設定:
  Name: N8N API Key Auth
  Header Name: x-api-key
  Header Value: a3Kf8xZq9TyU2pL5nW7mC4vB6jH1sD0g
```

#### ステップ4: ワークフローに設定

以下の2つのノードに設定:

1. **「画像アップロード」ノード（Node 11）**:
   ```
   ノードを開く → Credential for Header Auth
   → N8N API Key Auth を選択 → 保存
   ```

2. **「コラム投稿」ノード（Node 13）**:
   ```
   ノードを開く → Credential for Header Auth
   → N8N API Key Auth を選択 → 保存
   ```

---

## 🚀 ワークフローのインポート

```
n8n → 「+」 → Import from File
→ column-workflow-final.json を選択
→ インポート完了
```

---

## ✅ テスト実行

### ステップ1: 手動テスト

```
「毎日9時トリガー」ノードを右クリック
→ Execute Node
```

### ステップ2: 各ノードを確認

```
✅ 未使用テーマ取得 → テーマリストが表示
✅ ランダムテーマ選択 → 1件選択
✅ Gemini記事生成 → 記事が生成（JSON形式）
✅ 記事JSON解析 → データ抽出成功
✅ 画像生成プロンプト作成 → プロンプト作成
✅ Gemini画像生成 → Base64画像データ取得
✅ Base64→ファイル変換 → ファイル変換成功
✅ ファイル→Base64変換 → Base64再変換
✅ 画像アップロード → URLが返る
✅ 投稿データ準備 → データ整形完了
✅ コラム投稿 → 記事ID・slugが返る
✅ テーマ使用済み更新 → Sheets更新成功
✅ 完了通知メッセージ作成 → 通知メッセージ生成
```

### ステップ3: TokuSearchで確認

```
https://tokusearch.vercel.app/columns
→ 新しい記事が表示されることを確認
→ 画像が正しく表示されることを確認
```

### ステップ4: 成功！ 🎉

---

## 📅 スケジュール有効化

```
ワークフロー画面右上のトグル
→ Inactive から Active に変更
→ 毎日9時に自動実行されます
```

**Cron設定**: `0 9 * * *`（毎日午前9時）

---

## 🎨 ワークフロー構成

```
1. 毎日9時トリガー（Cron）
2. 未使用テーマ取得（Google Sheets）
3. ランダムテーマ選択（Code）
4. 記事生成プロンプト作成（Code）
5. Gemini記事生成（Gemini 2.5 Flash）✅ 動作確認済み
6. 記事JSON解析（Code）
7. 画像生成プロンプト作成（Code）
8. Gemini画像生成（HTTP Request）⚠️ Gemini Header Auth 要設定
9. Base64→ファイル変換（Convert to File）
10. ファイル→Base64変換（Extract from File）
11. 画像アップロード（HTTP Request）⚠️ N8N API Key Auth 要設定
12. 投稿データ準備（Code）
13. コラム投稿（HTTP Request）⚠️ N8N API Key Auth 要設定
14. テーマ使用済み更新（Google Sheets）
15. 完了通知メッセージ作成（Code）
```

---

## 🐛 トラブルシューティング

### 問題1: 画像生成エラー

**エラー**: `HTTP 400` または `404`

**原因**: APIエンドポイントが間違っている

**対策**:
1. Google AI Studioで最新のエンドポイントを確認
2. 「Gemini画像生成」ノードのURLを更新

**最新情報**: https://ai.google.dev/docs

---

### 問題2: 認証エラー

**エラー**: `Unauthorized` または `Invalid credentials`

**対策**:
1. 認証情報を再確認
2. APIキーを再生成
3. n8nを再起動

---

### 問題3: クォータ超過

**エラー**: `Quota exceeded`

**対策**:
1. 24時間待つ
2. 実行頻度を下げる（週3回など）
3. Google Cloud Consoleでクォータを確認

---

### 問題4: 画像変換エラー

**エラー**: `Cannot read property 'bytesBase64Encoded'`

**原因**: Gemini Imagen APIのレスポンス構造が想定と異なる

**対策**:
1. 「Gemini画像生成」ノードの実行結果を確認
2. レスポンスの構造を確認
3. 「Base64→ファイル変換」ノードの `sourceProperty` を調整

**よくあるパターン**:
```
predictions[0].bytesBase64Encoded  ← 現在の設定
content.parts[0].text              ← 代替案1
data                               ← 代替案2
```

---

## 💰 コスト（完全無料）

| サービス | 使用量/日 | 月間コスト |
|---------|----------|-----------|
| Gemini 2.5 Flash（記事） | 1リクエスト | $0 |
| Gemini Imagen（画像） | 1リクエスト | $0 |
| TokuSearch API | 2リクエスト | $0 |
| Google Sheets | 2操作 | $0 |

**無料枠**: Gemini API 25リクエスト/日  
**使用量**: 2リクエスト/日（記事+画像）  
**余裕**: 23リクエスト/日

---

## 🎯 カスタマイズ

### 実行時刻を変更

```
「毎日9時トリガー」ノード → Cron Expression

例:
  0 9 * * *     → 毎日9時
  0 21 * * *    → 毎日21時
  0 9 * * 1,3,5 → 月・水・金の9時
```

### 記事の文字数を調整

```
「記事生成プロンプト作成」ノード → Code

【文字数】: 2000-3000文字
↓
【文字数】: 1500-2000文字（短縮版）
```

### 画像スタイルを変更

```
「画像生成プロンプト作成」ノード → Code

カラーパレット: オレンジ、ベージュ...
↓
カラーパレット: ブルー、グリーン...
```

---

## 📊 モニタリング

### 毎日チェック

- ✅ n8n実行履歴（成功/失敗）
- ✅ TokuSearch記事一覧

### 毎週チェック

- ✅ 記事品質（読みやすさ、情報の正確性）
- ✅ 画像品質（デザイン、視認性）

### 毎月チェック

- ✅ Google Sheets（残りテーマ数）
- ✅ APIクォータ使用状況

---

## 🎉 完成！

これで、コラム自動生成システムが完成しました！

### 毎日自動で実行される内容

1. **午前9時**: ワークフローが起動
2. **テーマ選択**: Google Sheetsから未使用テーマを1件選択
3. **記事生成**: Gemini 2.5 Flashで2000-3000文字の記事を生成
4. **画像生成**: Gemini Imagenで16:9のサムネイル画像を生成
5. **自動投稿**: TokuSearchに記事と画像を投稿
6. **記録**: Google Sheetsのテーマを使用済みに更新

### 結果

- ✅ **毎日1記事**: 自動で投稿される
- ✅ **高品質**: Gemini 2.5 Flashによる記事生成
- ✅ **完全無料**: 無料枠内で運用可能
- ✅ **完全自動**: 手動作業なし

---

**お疲れ様でした！** 🎊

質問があれば、お気軽にお聞きください！

---

**作成者**: TokuSearch開発チーム  
**最終更新**: 2025-11-27  
**バージョン**: 3.0（最終版）



