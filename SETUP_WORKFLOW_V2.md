# コラム自動生成ワークフロー v2.0 - セットアップガイド

**ファイル**: `column-workflow-v2-gemini25.json`  
**動作確認**: ✅ Gemini 2.5 Flash（記事生成）で成功

---

## 🎉 既に動作確認済み

✅ **記事生成**: `gemini-2.5-flash` で成功  
✅ **既存認証**: Google Service Account, Gemini API  
✅ **スプレッドシート**: TokuSearch連携済み

---

## 🚀 セットアップ手順

### ステップ1: ワークフローをインポート（1分）

1. **n8nで「+」→「Import from File」**

2. **`column-workflow-v2-gemini25.json` を選択**

3. **インポート完了**

---

### ステップ2: 画像生成方法を選択（どちらか選ぶ）

#### 🅰️ オプションA: Nano Banana Pro を試す（推奨・簡単）

**メリット**: 既存認証だけで動作、設定が簡単

1. **「Gemini画像生成（Nano Banana）」ノード（Node 8）を確認**
   - 既に `models/nano-banana-pro-preview` に設定済み
   - 認証情報も既存のGemini APIを使用

2. **テスト実行**:
   - 「画像生成プロンプト作成」ノードから実行
   - レスポンスを確認

3. **成功したら**:
   - 「Gemini画像生成（HTTP代替）」ノード（Node 9）を削除
   - Base64変換ノードの設定を調整

4. **失敗したら**:
   - オプションBに切り替え

---

#### 🅱️ オプションB: HTTPリクエスト方式（確実）

**メリット**: 確実に動作、Gemini Imagen 3.0を使用

1. **「Gemini画像生成（Nano Banana）」ノード（Node 8）を削除**

2. **「Gemini画像生成（HTTP代替）」ノード（Node 9）を有効化**:
   - 「画像生成プロンプト作成」から接続

3. **Gemini Header Auth 認証情報を作成**:
   ```
   n8n → Credentials → Create New → Header Auth
   Name: Gemini Header Auth
   Header Name: x-goog-api-key
   Header Value: 既存のGemini APIキー
   ```

4. **HTTPノードに認証情報を設定**

---

### ステップ3: N8N API Key を設定（3分）

#### 3-1: API Keyを生成

**PowerShell**:
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**例**: `<N8N_API_KEY>`

#### 3-2: 環境変数に追加

**`.env.local`**:
```env
N8N_API_KEY=<N8N_API_KEY>
```

**Vercel**:
```bash
vercel env add N8N_API_KEY production
```

#### 3-3: n8nで認証情報を作成

```
n8n → Credentials → Create New → Header Auth
Name: N8N API Key Auth
Header Name: x-api-key
Header Value: <N8N_API_KEY>
```

#### 3-4: ノードに設定

- **画像アップロード**ノード（Node 11）
- **コラム投稿**ノード（Node 13）

---

### ステップ4: テスト実行（3分）

1. **「毎日9時トリガー」ノードを右クリック → Execute Node**

2. **各ノードを確認**:
   ```
   ✅ 未使用テーマ取得 → テーマリストが表示
   ✅ ランダムテーマ選択 → 1件選択
   ✅ Gemini記事生成 → 記事が生成
   ✅ 記事JSON解析 → データ抽出成功
   ✅ 画像生成 → 画像データ取得
   ✅ 画像アップロード → URL取得
   ✅ コラム投稿 → 記事ID取得
   ✅ テーマ使用済み更新 → Sheets更新
   ```

3. **TokuSearchで確認**:
   - https://tokusearch.vercel.app/columns
   - 新しい記事が表示される

4. **成功！** 🎉

---

### ステップ5: スケジュール有効化（1分）

1. **ワークフロー画面右上のトグル → Active**

2. **毎日9時に自動実行されます**

---

## 🎨 画像生成の2つの方法

### 方法1: Nano Banana Pro（Gemini Chat Model）

**構成**:
```
画像生成プロンプト作成
  ↓
Gemini Chat Model（nano-banana-pro-preview）
  ↓
Base64→ファイル変換
  ↓
ファイル→Base64変換
  ↓
画像アップロード
```

**メリット**:
- ✅ 既存認証だけで動作
- ✅ 設定が簡単
- ✅ n8n標準ノード

**デメリット**:
- ⚠️ 動作するか要確認
- ⚠️ レスポンス形式が不明

---

### 方法2: HTTP Request（Gemini Imagen API）

**構成**:
```
画像生成プロンプト作成
  ↓
HTTP Request（Imagen API）
  ↓
Base64→ファイル変換
  ↓
ファイル→Base64変換
  ↓
画像アップロード
```

**メリット**:
- ✅ 確実に動作
- ✅ Imagen 3.0を使用
- ✅ レスポンス形式が明確

**デメリット**:
- ⚠️ Gemini Header Auth が必要
- ⚠️ 設定がやや複雑

---

## 📊 設定済みの内容

### ✅ 既に設定済み（追加作業不要）

| 項目 | 設定内容 |
|------|----------|
| Google Service Account | ID: `r9kAyVencycJeNjy` |
| Gemini API | ID: `gojn353h4HLDUzF2` |
| Spreadsheet ID | `1iz1ApPwoLMMyqeQW_GA0XYM1qU74tzULNVq6vav3g14` |
| Sheet Name | `column_themes` |
| 記事生成モデル | `gemini-2.5-flash` ✅ 動作確認済み |
| 画像生成モデル | `nano-banana-pro-preview` 🧪 テスト要 |

### ⚠️ 新規作成が必要

1. **N8N API Key Auth**（必須）
   - 画像アップロード
   - コラム投稿

2. **Gemini Header Auth**（オプションBの場合のみ）
   - HTTP画像生成

---

## 🐛 トラブルシューティング

### 問題1: Nano Banana Proがエラー

**エラー**: `Model not found` または `Invalid model`

**対策**:
1. オプションBに切り替え
2. HTTPリクエスト方式を使用
3. Gemini Header Authを作成

---

### 問題2: 画像のBase64変換エラー

**エラー**: `Cannot read property 'bytesBase64Encoded'`

**対策**:
1. Node 8のレスポンスを確認
2. 「Base64→ファイル変換」ノードの `sourceProperty` を調整
3. レスポンス構造に合わせて修正

**よくあるパターン**:
```
predictions[0].bytesBase64Encoded  ← HTTPリクエスト
content.parts[0].text  ← Chat Model（Base64文字列）
data  ← 直接Base64
```

---

### 問題3: 記事生成エラー（クォータ超過）

**エラー**: `Quota exceeded`

**対策**:
1. 24時間待つ
2. 実行頻度を下げる（週3回など）
3. APIキーを確認

---

## 📝 ワークフロー構成

```
1. 毎日9時トリガー
   ↓
2. 未使用テーマ取得（Google Sheets）
   ↓
3. ランダムテーマ選択
   ↓
4. 記事生成プロンプト作成
   ↓
5. Gemini記事生成（2.5 Flash）✅ 動作確認済み
   ↓
6. 記事JSON解析
   ↓
7. 画像生成プロンプト作成
   ↓
8. Gemini画像生成（Nano Banana）🧪 テスト要
   ↓
10. Base64→ファイル変換
   ↓
11. ファイル→Base64変換
   ↓
12. 画像アップロード（N8N API Key）⚠️ 要設定
   ↓
13. 投稿データ準備
   ↓
14. コラム投稿（N8N API Key）⚠️ 要設定
   ↓
15. テーマ使用済み更新（Google Sheets）
   ↓
16. 完了通知メッセージ作成
```

---

## 🎯 次のステップ

### 1. まず試すこと

1. **記事生成のみをテスト**:
   - 「記事JSON解析」ノードまで実行
   - 記事が正しく生成されるか確認

2. **画像生成をテスト**:
   - Nano Banana Proを試す
   - うまくいかない場合はHTTPに切り替え

3. **完全なフローをテスト**:
   - すべてのノードを実行
   - TokuSearchで記事を確認

### 2. カスタマイズ

- **実行時刻を変更**: Cronパターンを編集
- **記事の文字数を調整**: プロンプトを編集
- **画像スタイルを変更**: 画像プロンプトを編集

### 3. モニタリング

- **n8n実行履歴**: エラーチェック
- **TokuSearch**: 記事品質チェック
- **Google Sheets**: テーマ残数チェック

---

## 💰 コスト（完全無料）

| サービス | 使用量/日 | 月間コスト |
|---------|----------|-----------|
| Gemini 2.5 Flash | 1リクエスト | $0 |
| Nano Banana Pro | 1リクエスト | $0 |
| TokuSearch API | 2リクエスト | $0 |
| Google Sheets | 2操作 | $0 |

**無料枠**: Gemini API 25リクエスト/日

---

## 📚 関連ドキュメント

- **GEMINI_API_TROUBLESHOOTING.md** - APIエラー対策
- **COLUMN_WORKFLOW_README.md** - 詳細仕様
- **SETUP_READY_WORKFLOW.md** - 元のセットアップガイド

---

**作成者**: TokuSearch開発チーム  
**最終更新**: 2025-11-27  
**バージョン**: 2.0（Gemini 2.5 Flash対応）



