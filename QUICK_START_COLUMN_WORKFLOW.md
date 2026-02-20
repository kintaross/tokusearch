# コラム自動生成システム - クイックスタート

**所要時間**: 15分  
**難易度**: ⭐⭐☆☆☆（中級）

---

## 🎯 ゴール

このガイドを完了すると、以下が実現します：

✅ 毎日自動で記事が生成される  
✅ 画像も自動で生成・アップロードされる  
✅ TokuSearchに自動投稿される  
✅ 完全無料で運用できる

---

## 📦 必要なもの

- [ ] n8nアカウント（https://n8n.io/ - 無料）
- [ ] Gemini API Key（https://aistudio.google.com/app/apikey - 無料）
- [ ] TokuSearch本番環境（既にデプロイ済み）
- [ ] PowerShell（Windows標準）

---

## 🚀 セットアップ（5ステップ）

### ステップ1: N8N API Keyを生成（2分）

**PowerShellで実行**:
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**実行例**:
```
<N8N_API_KEY>
```

このキーをコピーして、メモ帳に保存してください。

---

### ステップ2: 環境変数を追加（2分）

#### ローカル環境

`.env.local`に追加:
```env
N8N_API_KEY=<N8N_API_KEY>
```

#### Vercel環境

```bash
vercel env add N8N_API_KEY production
# プロンプトが表示されたら、生成したキーを貼り付け
```

**または、Vercelダッシュボードで**:
```
1. Settings → Environment Variables
2. 「Add」をクリック
3. Name: N8N_API_KEY
4. Value: <N8N_API_KEY>
5. Environment: Production
6. Save
```

---

### ステップ3: ワークフローをインポート（3分）

1. **n8nにログイン**
   - https://app.n8n.cloud/（クラウド版）
   - または、セルフホスト版のURL

2. **ワークフローをインポート**
   ```
   左上の「+」→「Import from File」
   → column-auto-generation-workflow.json を選択
   ```

3. **インポート完了**
   - 15個のノードが表示されます
   - 一部のノードに赤いアイコン（認証エラー）が表示されます

---

### ステップ4: 認証情報を設定（5分）

#### 4.1 Gemini Header Auth（新規作成）

1. **左メニューから「Credentials」をクリック**

2. **「Create New」→「Header Auth」を選択**

3. **以下を設定**:
   ```
   Name: Gemini Header Auth
   Header Name: x-goog-api-key
   Header Value: YOUR_GEMINI_API_KEY
   ```

4. **Gemini API Keyを取得**:
   - https://aistudio.google.com/app/apikey にアクセス
   - 「Create API Key」→ プロジェクトを選択
   - APIキーをコピー
   - 上記「Header Value」に貼り付け

5. **「Save」をクリック**

#### 4.2 N8N API Key Auth（新規作成）

1. **「Credentials」→「Create New」→「Header Auth」**

2. **以下を設定**:
   ```
   Name: N8N API Key Auth
   Header Name: x-api-key
   Header Value: <N8N_API_KEY>
   ```
   （ステップ1で生成したキー）

3. **「Save」をクリック**

#### 4.3 Google Service Account（既存を確認）

1. **「Credentials」→「Google Service Account」を検索**

2. **既存の認証情報を確認**:
   - 名前: 「Google Service Account account 2」
   - サービスアカウントメール: `xxx@xxx.iam.gserviceaccount.com`

3. **追加設定不要**（既に設定済み）

#### 4.4 ワークフローに認証情報を設定

1. **ワークフロー画面に戻る**

2. **「Gemini画像生成」ノード（Node 8）を開く**
   - 「Credential for Header Auth」→「Gemini Header Auth」を選択

3. **「画像アップロード」ノード（Node 10）を開く**
   - 「Credential for Header Auth」→「N8N API Key Auth」を選択

4. **「コラム投稿」ノード（Node 12）を開く**
   - 「Credential for Header Auth」→「N8N API Key Auth」を選択

5. **すべてのノードから赤いアイコンが消えたことを確認**

---

### ステップ5: テスト実行（3分）

1. **「毎日9時トリガー」ノード（一番左）を右クリック**

2. **「Execute Node」をクリック**

3. **各ノードの実行結果を確認**:
   ```
   ✅ 未使用テーマ取得 → テーマリストが表示される
   ✅ ランダムテーマ選択 → 1件のテーマが選択される
   ✅ Gemini記事生成 → JSON形式の記事が生成される
   ✅ Gemini画像生成 → Base64画像データが返る
   ✅ 画像アップロード → URLが返る
   ✅ コラム投稿 → 記事IDとスラッグが返る
   ✅ テーマ使用済み更新 → Google Sheetsが更新される
   ```

4. **TokuSearchで確認**:
   - https://tokusearch.vercel.app/columns にアクセス
   - 新しい記事が表示されることを確認

5. **成功！** 🎉

---

### ステップ6: スケジュールを有効化（1分）

1. **ワークフロー画面右上のトグルスイッチをクリック**
   - 「Inactive」→「Active」に変更

2. **毎日9時に自動実行されます**

3. **完了！**

---

## 🎨 カスタマイズ（オプション）

### 実行時刻を変更

「毎日9時トリガー」ノードを開いて、Cronパターンを変更:

```
0 9 * * *   → 毎日9時
0 21 * * *  → 毎日21時
0 12 * * 1  → 毎週月曜12時
0 18 * * 1,3,5 → 月水金の18時
```

### 記事の文字数を変更

「記事生成プロンプト作成」ノードのコードを編集:

```javascript
// 元: 【文字数】: 2000-3000文字
// 変更例: 【文字数】: 1500-2000文字
```

### 画像スタイルを変更

「画像生成プロンプト作成」ノードのコードを編集:

```javascript
// カラーパレットを変更
- カラーパレット: ブルー（#3b82f6）、グリーン（#10b981）を基調
```

---

## 🐛 トラブルシューティング

### 問題: Gemini画像生成エラー

**エラーメッセージ**: `HTTP 400 Bad Request` または `HTTP 404 Not Found`

**原因**: APIエンドポイントが間違っている、または変更された

**解決策**:

1. **Google AI Studioで最新のエンドポイントを確認**
   - https://ai.google.dev/docs
   - Imagen APIのドキュメントを参照

2. **「Gemini画像生成」ノードのURLを更新**
   ```
   現在: https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict
   → 最新のエンドポイントに変更
   ```

3. **代替案: 画像生成をスキップ**
   ```javascript
   // 「画像生成プロンプト作成」ノードの後にIF条件分岐を追加
   // エラー時はデフォルト画像を使用
   if (error) {
     thumbnailUrl = 'https://tokusearch.vercel.app/default-thumbnail.png';
   }
   ```

### 問題: 記事JSON解析失敗

**エラーメッセージ**: `記事JSONの解析に失敗しました`

**原因**: Gemini APIが純粋なJSON形式で返していない

**解決策**:

「記事JSON解析」ノードのコードを以下に置き換え:

```javascript
try {
  const responseText = $json.candidates[0].content.parts[0].text;
  
  // JSONブロックを抽出（複数パターン対応）
  let jsonText = responseText;
  
  // ```json```で囲まれている場合
  let jsonMatch = responseText.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1];
  } else {
    // ```のみで囲まれている場合
    jsonMatch = responseText.match(/```\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }
  }
  
  // 前後の空白を削除
  jsonText = jsonText.trim();
  
  // JSONオブジェクトの開始位置を探す
  const startIndex = jsonText.indexOf('{');
  const endIndex = jsonText.lastIndexOf('}');
  if (startIndex !== -1 && endIndex !== -1) {
    jsonText = jsonText.substring(startIndex, endIndex + 1);
  }
  
  const articleData = JSON.parse(jsonText);
  
  // 前のノードのデータを保持
  return [{ 
    json: { 
      ...articleData,
      theme: $('記事生成プロンプト作成').item.json.theme,
      level: $('記事生成プロンプト作成').item.json.level,
      themeNo: $('記事生成プロンプト作成').item.json.themeNo,
      rowIndex: $('記事生成プロンプト作成').item.json.rowIndex
    } 
  }];
} catch (err) {
  throw new Error('記事JSONの解析に失敗: ' + err.message);
}
```

### 問題: 認証エラー

**エラーメッセージ**: `Invalid credentials` または `Unauthorized`

**原因**: APIキーが間違っている、または環境変数が設定されていない

**解決策**:

1. **n8nの認証情報を確認**
   - 「Credentials」→ 該当の認証情報を開く
   - APIキーを再入力

2. **環境変数を確認**
   ```bash
   # .env.local
   cat .env.local | grep N8N_API_KEY
   
   # Vercel
   vercel env ls
   ```

3. **APIキーを再生成**
   - Gemini: https://aistudio.google.com/app/apikey
   - N8N: PowerShellで再生成

### 問題: テーマが取得できない

**エラーメッセージ**: `全てのテーマを使用済みです`

**原因**: Google Sheetsの`used`列がすべて`TRUE`

**解決策**:

Google Sheetsでテーマをリセット:

```javascript
// Google Apps Script
function resetThemes() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('column_themes');
  const lastRow = sheet.getLastRow();
  
  // D列（used）をすべてFALSEに
  sheet.getRange(2, 4, lastRow - 1, 1).setValue(false);
  
  // E列（used_at）をすべて空に
  sheet.getRange(2, 5, lastRow - 1, 1).clearContent();
}
```

---

## 📊 モニタリング

### 確認方法

**n8nで実行履歴を確認**:
```
1. ワークフロー画面 → 「Executions」タブ
2. 実行日時、成功/失敗を確認
3. エラーがある場合はログを確認
```

**TokuSearchで記事を確認**:
```
1. https://tokusearch.vercel.app/admin/columns
2. 新しい記事が追加されているか確認
3. 画像が正しく表示されているか確認
```

**Google Sheetsでテーマを確認**:
```
1. column_themesシートを開く
2. used=TRUEの件数を確認
3. used_atで最終実行日時を確認
```

### 推奨チェック頻度

- **毎日**: n8n実行履歴（成功/失敗）
- **毎週**: TokuSearch記事一覧（品質確認）
- **毎月**: Google Sheets（残りテーマ数）

---

## 💰 コスト

### 完全無料！

| サービス | 月間コスト |
|---------|-----------|
| Gemini API | $0（無料枠内） |
| n8n | $0（無料プラン） |
| TokuSearch | $0（自社システム） |
| Google Sheets | $0 |

**条件**:
- 1日1記事（午前9時）
- Gemini無料枠: 1日25リクエスト
- n8n無料プラン: 月5000実行まで

---

## 🎯 次のステップ

### オプション機能

#### 1. Slack通知を追加

```
完了通知メッセージ作成ノードの後に:
1. Slackノードを追加
2. Webhook URLを設定
3. メッセージ: {{$json.message}}
```

#### 2. 複数記事を生成

```
ランダムテーマ選択ノードを:
1. ループノードに変更
2. 1日3記事など、複数生成
3. API制限に注意（1日25リクエスト）
```

#### 3. テーマ自動生成

```
未使用テーマ取得の後にIF分岐を追加:
1. テーマ数が0の場合
2. Gemini APIで新テーマ生成
3. Google Sheetsに追加
```

---

## 📚 詳細ドキュメント

より詳しい情報は、以下のドキュメントを参照してください:

- **COLUMN_WORKFLOW_README.md** - 全体概要と詳細仕様
- **docs/COLUMN_WORKFLOW_SETUP.md** - 詳細セットアップガイド
- **docs/N8N_CREDENTIALS_SETUP.md** - 認証情報の詳細設定
- **docs/COLUMN_AUTO_GENERATION.md** - 元の仕様書

---

## 🆘 サポート

### 質問がある場合

- **n8nの使い方**: https://docs.n8n.io/
- **Gemini API**: https://ai.google.dev/
- **TokuSearch**: 別チャットで質問してください

### よくある質問

**Q: スケジュールを一時停止したい**  
A: ワークフロー画面右上のトグルスイッチを「Inactive」に変更してください。

**Q: 記事の品質を上げたい**  
A: 「記事生成プロンプト作成」ノードのプロンプトを調整してください。具体的な指示を追加すると品質が向上します。

**Q: 画像が生成されない**  
A: Gemini Imagen APIのエンドポイントを最新版に更新してください。代替案として、デフォルト画像を使用することもできます。

---

## ✅ チェックリスト

セットアップが完了したら、以下を確認してください:

- [ ] N8N API Keyを生成した
- [ ] `.env.local`とVercelに環境変数を追加した
- [ ] ワークフローをn8nにインポートした
- [ ] 認証情報を4つすべて設定した
- [ ] テスト実行が成功した
- [ ] TokuSearchで記事が表示された
- [ ] スケジュールを有効化した
- [ ] n8n実行履歴を確認する方法を理解した

**すべてチェックできたら、完了です！🎉**

---

**作成者**: TokuSearch開発チーム  
**最終更新**: 2025-11-27  
**所要時間**: 15分  
**難易度**: ⭐⭐☆☆☆



