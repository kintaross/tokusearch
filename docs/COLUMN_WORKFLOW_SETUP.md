# コラム自動生成ワークフロー - セットアップガイド

**対象**: `コラム自動生成ワークフロー.json`

---

## 📋 インポート方法

1. n8nを開く
2. 右上の「...」→「Import from File」
3. `コラム自動生成ワークフロー.json`を選択
4. インポート完了

---

## ⚙️ 必要な設定（3つ）

### 1. Google Sheets認証（既存）

**対象ノード**: 
- `GetUnusedThemes`
- `UpdateThemeUsed`

**設定**:
- ✅ **既に設定済み**
- 認証ID: `r9kAyVencycJeNjy`
- 認証名: `Google Service Account account 2`
- **追加設定不要**

---

### 2. Gemini API認証（既存）

**対象ノード**:
- `GenerateArticle`（記事生成）
- `GenerateImage`（画像生成）

**設定**:
- ✅ **既に設定済み**
- 認証ID: `gojn353h4HLDUzF2`
- 認証名: `Google Gemini(PaLM) Api account`
- **追加設定不要**

---

### 3. TokuSearch API Key認証（新規作成必要）⭐

**対象ノード**:
- `UploadImage`
- `PostColumn`

**設定手順**:

#### Step 1: 認証情報を作成
1. n8n右上の「Credentials」をクリック
2. 「Add Credential」をクリック
3. 検索ボックスに「Header Auth」と入力
4. 「Header Auth」を選択

#### Step 2: 認証情報を入力
```
Name: TokuSearch API Key
Header Name: x-api-key
Header Value: xMQKbeidhj97S04kGoOpsmvnlBR1WIcZ
```

#### Step 3: 保存
- 「Save」をクリック

#### Step 4: ノードに適用
1. `UploadImage`ノードを開く
2. 「Authentication」→「Generic Credential Type」→「Header Auth」
3. 作成した「TokuSearch API Key」を選択
4. 同じ手順を`PostColumn`ノードにも適用

---

## 🧪 テスト実行

### Step 1: 手動実行
1. `ScheduleTrigger`ノードを選択
2. 「Execute Workflow」をクリック
3. 各ノードの実行結果を確認

### Step 2: 確認ポイント

#### ✅ Node 2: GetUnusedThemes
- 出力: 未使用テーマの配列
- 確認: `used=FALSE`のテーマが取得できているか

#### ✅ Node 3: RandomThemeSelection
- 出力: 1件のテーマ
- 確認: ランダムに選択されているか

#### ✅ Node 5: GenerateArticle
- 出力: Geminiのレスポンス
- 確認: `content.parts[0].text`にJSON文字列があるか

#### ✅ Node 6: ParseArticleJSON
- 出力: 記事データ（JSON）
- 確認: `title`, `description`, `content_markdown`があるか

#### ✅ Node 8: GenerateImage
- 出力: Gemini Imagenのレスポンス
- 確認: **ここでエラーが出る可能性あり**（要調整）

#### ✅ Node 11: UploadImage
- 出力: 画像URL
- 確認: `{\"url\": \"/columns/images/col-xxxxx.png\"}`

#### ✅ Node 13: PostColumn
- 出力: 投稿結果
- 確認: 新しいコラムが作成されたか

#### ✅ Node 14: UpdateThemeUsed
- 確認: Google Sheetsで該当テーマの`used`が`TRUE`になっているか

---

## ⚠️ トラブルシューティング

### エラー1: Node 8 (GenerateImage) でエラー

**症状**: `models/imagen-3.0-generate-001` が見つからない

**原因**: Gemini Imagenのモデル名が間違っている可能性

**対策**:
1. Node 8を開く
2. `modelId`を以下のいずれかに変更して試す：
   ```
   - models/imagegeneration-002
   - models/imagen-3
   - models/gemini-2.0-flash-exp（画像生成可能な場合）
   ```
3. または、Gemini APIドキュメントで正しいモデル名を確認

**代替案（画像生成をスキップ）**:
1. Node 7とNode 8の間の接続を削除
2. Node 7から直接Node 12に接続
3. Node 12の`imageUrl`を固定値に変更：
   ```javascript
   const imageUrl = '/columns/images/default-thumbnail.png';
   ```

---

### エラー2: Node 11 (UploadImage) で401 Unauthorized

**症状**: APIキー認証エラー

**対策**:
1. 認証情報「TokuSearch API Key」を確認
2. Header Name: `x-api-key`（正確に）
3. Header Value: `xMQKbeidhj97S04kGoOpsmvnlBR1WIcZ`（正確に）
4. 認証情報を再作成

---

### エラー3: Node 9 (ConvertToFile) でエラー

**症状**: Base64データが見つからない

**原因**: Node 8のレスポンス構造が想定と異なる

**対策**:
1. Node 8の出力を確認
2. Base64データのパスを特定
3. Node 9の`jsonPropertyName`を修正
   - 現在: `predictions[0].bytesBase64Encoded`
   - 候補: `data`, `image`, `content.parts[0].data`

---

### エラー4: Node 13 (PostColumn) で500エラー

**症状**: TokuSearch APIエラー

**対策**:
1. Node 12の出力を確認
2. 必須フィールドが揃っているか確認：
   - `title`, `slug`, `content_markdown`, `content_html`
3. Vercelログを確認

---

## 🎯 スケジュール設定

テストが成功したら、自動実行を有効化：

1. `ScheduleTrigger`ノードを開く
2. 設定を確認：
   ```
   Trigger Interval: Days
   Days Between Triggers: 1
   Trigger at Hour: 9
   Trigger at Minute: 0
   ```
3. ワークフローを**Activate**（右上のトグル）

---

## 📊 運用モニタリング

### 確認項目
- ✅ 毎日9時に実行されているか
- ✅ 記事が正しく生成されているか
- ✅ 画像がアップロードされているか
- ✅ テーマが使用済みになっているか

### ログ確認
- n8n実行履歴: ワークフロー画面の「Executions」タブ
- Google Sheets: `column_themes`シートの`used`列
- TokuSearch: `https://tokusearch.vercel.app/columns`

---

## 🚀 完成！

すべて設定できたら、1日1記事が自動生成されます。

**次のステップ**:
1. 数日間様子を見る
2. 記事品質を確認
3. プロンプトを調整（必要に応じて）
4. テーマが200件使い切ったら、テーマ自動生成機能を実装

---

**作成者**: TokuSearch開発チーム  
**サポート**: 問題があればこのチャットで質問してください
