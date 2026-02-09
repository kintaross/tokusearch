# セットアップ済みワークフロー - 5分で完了！

**ファイル**: `column-auto-generation-workflow-ready.json`  
**所要時間**: 5分  
**既存認証を流用**: ✅

---

## 🎉 既に設定済みの認証情報

以下の認証情報は、既存のワークフローから流用済みです。**追加設定不要！**

✅ **Google Service Account** (Google Sheets用)  
✅ **Gemini API** (記事生成用)  
✅ **Spreadsheet ID** (TokuSearchスプレッドシート)

---

## 🔧 必要な作業（2つの認証情報のみ）

### 1️⃣ Gemini Header Auth を作成（2分）

画像生成用の認証情報です。**既存のGemini APIキーをそのまま使用します**。

#### 手順

1. **n8nで「Credentials」→「Create New」→「Header Auth」**

2. **以下を設定**:
   ```
   Name: Gemini Header Auth
   Header Name: x-goog-api-key
   Header Value: （既存のGemini APIキーを貼り付け）
   ```

3. **既存のGemini APIキーを取得**:
   - Google AI Studio: https://aistudio.google.com/app/apikey
   - 既存のAPIキーをコピー
   - または、既存ワークフローの認証情報から確認

4. **保存**

5. **ワークフローで設定**:
   - 「Gemini画像生成」ノード（Node 8）を開く
   - 「Credential for Header Auth」→「Gemini Header Auth」を選択

---

### 2️⃣ N8N API Key Auth を作成（3分）

TokuSearch API用の認証情報です。

#### ステップ1: API Keyを生成

**PowerShellで実行**:
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**実行例**:
```
a3Kf8xZq9TyU2pL5nW7mC4vB6jH1sD0g
```

このキーをコピーしてください。

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

#### ステップ3: n8nで認証情報を作成

1. **n8nで「Credentials」→「Create New」→「Header Auth」**

2. **以下を設定**:
   ```
   Name: N8N API Key Auth
   Header Name: x-api-key
   Header Value: a3Kf8xZq9TyU2pL5nW7mC4vB6jH1sD0g
   ```
   （上記で生成したAPI Key）

3. **保存**

4. **ワークフローで設定**:
   - 「画像アップロード」ノード（Node 10）を開く
   - 「Credential for Header Auth」→「N8N API Key Auth」を選択
   - 「コラム投稿」ノード（Node 12）でも同様に設定

---

## 🚀 ワークフローのインポート

1. **n8nで「+」→「Import from File」**

2. **`column-auto-generation-workflow-ready.json` を選択**

3. **インポート完了**

4. **認証情報エラーの確認**:
   - 「Gemini画像生成」ノード: 赤いアイコンが表示される（要設定）
   - 「画像アップロード」ノード: 赤いアイコンが表示される（要設定）
   - 「コラム投稿」ノード: 赤いアイコンが表示される（要設定）
   - その他のノード: ✅ すべて緑（設定済み）

5. **上記の2つの認証情報を設定**

---

## ✅ テスト実行

1. **「毎日9時トリガー」ノードを右クリック**

2. **「Execute Node」をクリック**

3. **各ノードの実行結果を確認**:
   - ✅ 未使用テーマ取得 → テーマが表示される
   - ✅ Gemini記事生成 → 記事が生成される
   - ✅ Gemini画像生成 → 画像が生成される
   - ✅ 画像アップロード → URLが返る
   - ✅ コラム投稿 → 記事が投稿される
   - ✅ テーマ使用済み更新 → Sheetsが更新される

4. **TokuSearchで確認**:
   - https://tokusearch.vercel.app/columns
   - 新しい記事が表示されることを確認

5. **成功！** 🎉

---

## 📊 スケジュール有効化

1. **ワークフロー画面右上のトグルを「Active」に変更**

2. **毎日9時に自動実行されます**

---

## 🔍 既存認証情報の詳細

以下の認証情報が既に設定されています：

### Google Service Account
- **ID**: `r9kAyVencycJeNjy`
- **Name**: `Google Service Account account 2`
- **使用ノード**:
  - 未使用テーマ取得（Node 2）
  - テーマ使用済み更新（Node 13）

### Google Gemini (PaLM) API
- **ID**: `gojn353h4HLDUzF2`
- **Name**: `Google Gemini(PaLM) Api account`
- **使用ノード**:
  - Gemini記事生成（Node 5）

### Spreadsheet
- **ID**: `1iz1ApPwoLMMyqeQW_GA0XYM1qU74tzULNVq6vav3g14`
- **Name**: `TokuSearch`
- **シート**: `column_themes`

---

## 🎨 オプション: Slack通知を追加

完了通知メッセージ作成ノードの後に、Slackノードを追加できます：

1. **Slackノードを追加**

2. **既存のSlack認証情報を使用**:
   - **ID**: `kahTvH10blaEP2kb`
   - **Name**: `Slack account`

3. **チャンネル**: `#daily_o-toku` または任意のチャンネル

4. **メッセージ**: `={{$json.message}}`

---

## 🐛 トラブルシューティング

### 問題: Gemini画像生成エラー

**エラー**: `HTTP 400/404`

**対策**:
1. APIエンドポイントURLを最新版に更新
2. Google AI Studioで確認: https://ai.google.dev/docs

### 問題: 認証情報が見つからない

**エラー**: `Credential with ID xxx not found`

**対策**:
1. n8nの「Credentials」画面で既存の認証情報を確認
2. IDが一致しているか確認
3. 必要に応じて、ワークフローJSON内のIDを書き換え

### 問題: テーマが取得できない

**エラー**: `全てのテーマを使用済みです`

**対策**:
1. Google Sheetsで `column_themes` シートを開く
2. `used` 列をすべて `FALSE` にリセット
3. `used_at` 列を空にする

---

## 📚 その他のドキュメント

- **COLUMN_WORKFLOW_README.md** - 全体概要
- **QUICK_START_COLUMN_WORKFLOW.md** - 詳細セットアップ
- **docs/N8N_CREDENTIALS_SETUP.md** - 認証情報詳細ガイド

---

## ✨ まとめ

**既存認証を流用** → 新規作成は **たった2つ** → **5分で完了！**

1. ✅ Gemini Header Auth（既存APIキー使用）
2. ✅ N8N API Key Auth（新規生成）

**これだけでコラム自動生成システムが稼働します！** 🚀

---

**作成者**: TokuSearch開発チーム  
**最終更新**: 2025-11-27  
**所要時間**: 5分



