# コラム自動生成システム - 実装ガイド

**バージョン**: 1.0  
**最終更新**: 2025-11-27

---

## 📋 概要

n8nワークフローを使用して、Gemini APIで記事と画像を自動生成し、TokuSearchに投稿する完全自動化システム。

**特徴**:
- ✅ 記事生成: Gemini API（既存認証情報を使用）
- ✅ 画像生成: Gemini Imagen（既存認証情報を使用、日本語対応）
- ✅ 自動投稿: TokuSearch API
- ✅ テーマ管理: Google Sheets（200件 + 自動生成）
- ✅ 完全自動化: n8nスケジューラー
- ✅ 追加コストゼロ: 既存のGemini認証で完結

---

## 🚀 セットアップ手順

### Step 1: 環境変数の設定

#### ローカル環境（`.env.local`）
```env
# 既存の環境変数
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id
GOOGLE_SERVICE_ACCOUNT_KEY=your-service-account-json

# 新規追加（n8n用API Key）
N8N_API_KEY=<N8N_API_KEY>
```

**API Keyの生成方法**:
```bash
# PowerShellで実行
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

#### Vercel環境
```bash
vercel env add N8N_API_KEY production
# 上記で生成したAPI Keyを入力
```

---

### Step 2: Google Sheetsにテーマをインポート

#### 2.1 `column_themes`シートの確認
既に作成済み。以下の列構造になっています：
```
A列: no (番号 1-200)
B列: level (レベル)
C列: theme (テーマタイトル)
D列: used (使用済みフラグ TRUE/FALSE)
E列: used_at (使用日時 ISO 8601)
```

#### 2.2 テーマデータのインポート

**方法1: CSVインポート**
1. テーマリストをCSV形式に変換
2. Google Sheetsで「ファイル > インポート」
3. D列（used）を全て `FALSE` に設定

**方法2: 手動入力**
1. A列に番号（1〜200）
2. B列にレベル（初心者向け、中級者以上向け など）
3. C列にテーマタイトル
4. D列に `FALSE`
5. E列は空欄

**サンプルデータ**:
```
no	level	theme	used	used_at
1	初心者向け	楽天ポイントの基本と上手な貯め方	FALSE	
2	初心者向け	dポイント入門：コンビニでムリなく貯めるコツ	FALSE	
3	中級者以上向け	ポイント多重取りルート設計の基本パターン集	FALSE	
```

---

### Step 3: API認証情報の確認・追加

#### 3.1 Gemini API（記事生成用）
**既存の認証情報を使用**：
- n8nで既に設定済みの「Google Gemini(PaLM) Api account」をそのまま使用
- 追加設定は不要

#### 3.2 画像生成API - Gemini Imagen（既存認証を使用）

**重要**: Nano Banana ProはGemini APIの画像生成機能（Imagen）です。既存のGemini認証情報をそのまま使用できます。

**追加設定は不要！**
- n8nで既に設定済みの「Google Gemini(PaLM) Api account」をそのまま使用
- 新しいAPIキー取得は不要
- 追加コストなし（既存の無料枠内）

---

## 🔧 n8nワークフロー構築

### ワークフロー全体像
```
1. Schedule Trigger（毎日9時）
   ↓
2. Google Sheets: Read（テーマ取得 used=FALSE）
   ↓
3. Code: ランダム選択
   ↓
4. Code: 記事生成プロンプト作成
   ↓
5. HTTP: Gemini API（記事生成）
   ↓
6. Code: JSON解析
   ↓
7. Code: 画像生成プロンプト作成
   ↓
8. HTTP: Gemini Imagen API（画像生成 - 既存認証使用）
   ↓
9. Convert to File: Base64→ファイル変換
   ↓
9.5. Extract from File: ファイル→Base64変換（アップロード用）
   ↓
10. HTTP: TokuSearch Upload API（画像アップロード）
   ↓
11. Code: Markdown→HTML変換
   ↓
12. HTTP: TokuSearch Column API（記事保存）
   ↓
13. Google Sheets: Update（テーマ使用済み更新）
   ↓
14. Slack: 完了通知（オプション）
```

**重要**: 
- Node 8でGemini Imagen（旧Nano Banana Pro）を使用
- 既存のGemini認証情報をそのまま使用
- 追加のAPIキー取得は不要

---

### 各ノードの詳細設定

#### Node 3: ランダム選択
```javascript
// 前のノードでGoogle Sheetsから取得した未使用テーマ
const unusedThemes = $input.all().map(item => item.json);

if (unusedThemes.length === 0) {
  throw new Error('全てのテーマを使用済みです。リセットしてください。');
}

// ランダムに1件選択
const randomIndex = Math.floor(Math.random() * unusedThemes.length);
const selectedTheme = unusedThemes[randomIndex];

return [{ json: selectedTheme }];
```

#### Node 4: 記事生成プロンプト作成
```javascript
const theme = $json.theme;
const level = $json.level;

const prompt = `
【システム指示】
あなたはポイ活・節約メディア「TokuSearch」の記事ライターです。
以下の情報から記事を生成し、JSON形式で出力してください。

【入力情報】
- レベル: ${level}
- テーマ: ${theme}

【出力形式（必ずこのJSON形式で）】
{
  "content_markdown": "## 導入\\n\\n本文...\\n\\n## 基本の考え方\\n\\n...",
  "description": "SEO用概要（50-160文字）",
  "category": "ポイント活用術",
  "tags": "楽天ポイント, 貯め方, ポイ活"
}

【記事構成】
1. ## 導入（読者の悩み、この記事で分かること）
2. ## 基本の考え方（前提知識）
3. ## 具体的なステップ（手順を明確に）
4. ## 注意点・よくある失敗
5. ## まとめ（要点と最初の一歩）

【文字数】: 2000-3000文字

【レベル別の書き分け】
- 初心者向け: 用語を丁寧に説明、小さいステップ
- 中級者以上/上級者/超ポイ活特化: 比較・戦略・効率化重視

【重要】
- JSON形式のみ出力（説明文不要）
- 日本語のみ
- 違法行為・規約違反の内容は含めない
`.trim();

return [{ json: { prompt, theme, level, themeNo: $json.no } }];
```

#### Node 5: Gemini API（記事生成）

**推奨方法1: 既存のGoogle Geminiノードを使用**
- ノードタイプ: `Google Gemini Chat Model`
- 認証情報: `Google Gemini(PaLM) Api account`（既存）
- Model: `gemini-2.5-flash` または `gemini-2.0-flash-exp`
- Prompt: `{{$json.prompt}}`

**推奨方法2: HTTPリクエストノード**
```
Method: POST
URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent
Authentication: 既存のGoogle Gemini認証情報を使用
Content-Type: application/json
```

**ボディ**:
```json
{
  "contents": [{
    "parts": [{
      "text": "{{$json.prompt}}"
    }]
  }]
}
```

**注意**: n8nで既に設定済みの「Google Gemini(PaLM) Api account」を使用してください。新しいAPIキーは不要です。

#### Node 7: 画像生成プロンプト作成（日本語対応）

```javascript
const theme = $json.theme;
const level = $json.level;
const title = $json.title;

// NanoBanana Proは日本語プロンプトに対応しているため、日本語で指示
const imagePrompt = `
${theme}に関する、日本のポイ活・節約記事のサムネイル画像を作成してください。

【スタイル】
- モダンでフラットなイラストスタイル
- 親しみやすく、明るい雰囲気
- カラーパレット: オレンジ（#f97316）、ベージュ（#fef3e2）、ブルー、グリーンを基調
- 横長（16:9）、背景はシンプルなグラデーション

【含める要素】
- ポイントカード、スマートフォン、コイン、矢印、アイコン
- 日本らしいデザイン要素
- ${level === '初心者向け' ? '初心者にも分かりやすいシンプルな構成' : 'やや詳細で洗練された構成'}

【重要】
- 画像内にテキストは不要
- クリーンで見やすいデザイン
- Webサムネイルとして最適化
`.trim();

return [{ json: { ...$json, imagePrompt } }];
```

#### Node 8: Gemini Imagen 画像生成（HTTPリクエスト）

**ノードタイプ**: `HTTP Request`

**重要**: Nano Banana ProはGemini APIの画像生成機能です。既存のGemini認証を使用します。

**HTTPリクエスト設定**:
```
Method: POST
URL: （具体的なエンドポイントURLは公式ワークフローまたはGemini APIドキュメントを参照）
例: https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict

Authentication: Generic Credential Type
  - Auth Type: Header Auth
  - Name: x-goog-api-key
  - Value: {{既存のGemini APIキー}}

Send Body: ✓ 有効化
Content Type: JSON
Specify Body: Using JSON
```

**JSONボディ**:
```json
{
  "contents": [
    {
      "parts": [
        {
          "text": "{{$json.imagePrompt}}"
        }
      ]
    }
  ],
  "generationConfig": {
    "aspectRatio": "16:9",
    "outputMimeType": "image/png",
    "responseModality": "image"
  }
}
```

**高度な設定（generationConfig）のオプション**:
- `aspectRatio`: "1:1", "4:3", "16:9", "9:16" など
- `outputMimeType`: "image/png" または "image/jpeg"
- `responseModality`: "image"（画像生成の場合）
- 画像サイズ: 1K, 2K, 4K（APIバージョンによる）

**注意**: 
- 既存のGemini認証情報を使用するため、追加設定不要
- 画像はBase64形式で返却される
- 日本語プロンプトに対応

#### Node 9: Convert to File（Base64 → ファイル変換）

**ノードタイプ**: `Convert to File`

**設定**:
```
Mode: Move Base64 String to a File
```

**詳細設定**:
- **Binary Property**: 出力されるファイルのプロパティ名（例: `image`）
- **Json Property**: HTTPリクエストノードから返されたBase64データのパス（例: `data`）
- **File Name**: `col-{{Date.now()}}.png`
- **MIME Type**: `image/png`

**説明**:
- Gemini Imagen APIは画像をBase64文字列で返すため、このノードでファイル形式に変換します
- 変換後のファイルは次のノード（画像アップロード）で使用できます

**Node 9.5: Extract from File（アップロード用にBase64変換）**

TokuSearch Upload APIにBase64形式で送信するため、再度Base64文字列を抽出します。

**ノードタイプ**: `Extract from File`

**設定**:
```
Mode: Convert to Base64 String
Binary Property: image（Node 9で設定したプロパティ名）
```

これにより、`data`プロパティにBase64文字列が格納されます。

#### Node 10: TokuSearch Upload API
**HTTPリクエスト設定**:
```
Method: POST
URL: https://tokusearch.vercel.app/api/admin/columns/upload-image
Authentication: Header Auth
  - Header Name: x-api-key
  - Header Value: YOUR_N8N_API_KEY
Content-Type: application/json
```

**ボディ**:
```json
{
  "image": "{{$json.image}}",
  "filename": "{{$json.filename}}"
}
```

#### Node 12: TokuSearch Column API（記事保存）
**HTTPリクエスト設定**:
```
Method: POST
URL: https://tokusearch.vercel.app/api/admin/columns
Authentication: Header Auth
  - Header Name: x-api-key
  - Header Value: YOUR_N8N_API_KEY
Content-Type: application/json
```

**ボディ**:
```json
{
  "title": "{{$json.title}}",
  "slug": "",
  "description": "{{$json.description}}",
  "content_markdown": "{{$json.content_markdown}}",
  "category": "{{$json.category}}",
  "tags": "{{$json.tags}}",
  "thumbnail_url": "{{$json.thumbnailUrl}}",
  "author": "TokuSearch編集部",
  "status": "published"
}
```

---

## 💰 コストと制限

### Gemini API（記事生成 + 画像生成）
- **既存の認証情報を使用**: 追加コストなし
- **記事生成**: 1回/記事（Gemini Flash）
- **画像生成**: 1回/記事（Gemini Imagen）
- **無料枠**: 十分な余裕あり（1日25リクエスト）

### TokuSearch API
- **完全無料**: 自社システムのため追加コストなし

### 月間コスト見込み
| 運用パターン | 記事数/日 | API呼び出し | 月間コスト |
|------------|---------|-----------|----------|
| **推奨** | 1記事 | 2回（記事+画像） | **$0** |
| 中規模 | 5記事 | 10回 | **$0** |
| 大規模 | 10記事 | 20回 | **$0** |

**すべて無料枠内で運用可能！**

### 制限事項
- Gemini API無料枠: 1日25リクエスト
- 1記事あたり2リクエスト（記事生成+画像生成）
- **最大12記事/日まで無料**

**推奨運用**: まずは1日1記事で運用開始→様子を見てスケールアップ

---

## 🐛 トラブルシューティング

### Gemini Imagen APIエラー
**症状**: 画像生成APIがエラーを返す  
**原因**:
- APIキーが間違っている（`x-goog-api-key`）
- APIエンドポイントURLが間違っている
- リクエストボディの形式が間違っている

**対策**:
1. n8nの認証設定を確認（既存のGemini認証を使用）
2. HTTPリクエストノードの認証方式を確認（Header Auth、名前: `x-goog-api-key`）
3. エンドポイントURLを公式ドキュメントまたは公開ワークフローで確認
4. JSONボディの形式を確認（`contents`, `generationConfig`）
5. 最終手段: IF条件分岐で画像なしで記事保存

### 画像が取得できない
**症状**: Convert to FileノードでBase64が変換できない  
**対策**:
1. Node 8のレスポンス構造を確認（テスト実行で`$json`の中身を確認）
2. レスポンスの`data`プロパティにBase64文字列があるか確認
3. Convert to Fileノードの「Json Property」パスを調整

### Gemini記事生成エラー
**症状**: 記事生成のレスポンスがJSON形式ではない  
**対策**:
1. プロンプトを再調整（「JSON形式のみ」を強調）
2. エラーハンドリング追加
3. Code Extractionで```json```ブロックを抽出

### API制限超過
**症状**: 429 Too Many Requests  
**対策**: 1日の実行回数を制限（例: 1回/日）

---

## 📊 運用モニタリング

### 確認項目
- ✅ 毎日正常に記事が生成されているか
- ✅ 画像が正しく表示されているか
- ✅ テーマが重複していないか
- ✅ API制限に達していないか

### ログ確認
- n8n実行履歴
- Vercelデプロイログ
- Google Sheetsの`used`カラム

---

## 🎯 次のステップ

### ✅ 完了済み
1. TokuSearch API実装（記事投稿、画像アップロード）
2. Google Sheets `column_themes`シート作成
3. 200件のテーマデータインポート
4. 本番デプロイ完了

### ⏳ 次にやること

#### 手動作業（5分）
1. **Google Sheetsデータ確認**
   - `column_themes`シートを開く
   - 200件のテーマを確認
   - D列（used）が全て`FALSE`を確認

#### n8nワークフロー構築（別チャット推奨 - 1.5時間）
1. n8nで新しいワークフローを作成
2. このドキュメントを参照してノードを設定
3. **既存のGemini認証情報を使用**（追加設定不要）
4. テスト実行
5. スケジュール設定（1日1回）

### 🎉 完全自動化達成後
- 毎日自動で記事生成（Gemini Flash）
- 画像も自動生成（Gemini Imagen - 日本語対応）
- テーマ自動生成（200件使い切った後）
- **完全無料運用**（1日1記事、既存のGemini認証使用）

---

**重要ポイント**: 
- Nano Banana ProはGemini Imagenの別名です
- 既存のGemini認証情報で記事も画像も生成可能
- 追加のAPIキー取得や登録は一切不要
- すべて無料枠内で運用可能

---

**作成者**: TokuSearch開発チーム  
**サポート**: 不明点があれば別チャットで質問してください

