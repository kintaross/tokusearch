# コラム自動生成ワークフロー - 簡単セットアップ（画像なし版）

**ファイル**: `コラム自動生成ワークフロー_画像なし.json`

---

## 🚀 セットアップ（3ステップ）

### Step 1: インポート（30秒）

1. n8nを開く
2. 右上「...」→「Import from File」
3. `コラム自動生成ワークフロー_画像なし.json`を選択

---

### Step 2: TokuSearch API Key認証を作成（1分）

1. n8n右上「Credentials」→「Add Credential」
2. 「Header Auth」を選択
3. 入力：
   ```
   Name: TokuSearch API Key
   Header Name: x-api-key
   Header Value: xMQKbeidhj97S04kGoOpsmvnlBR1WIcZ
   ```
4. 「Save」

5. `PostColumn`ノードを開く
   - Authentication: Generic Credential Type → Header Auth
   - 作成した「TokuSearch API Key」を選択
   - 保存

---

### Step 3: テスト実行（1分）

1. 「Execute Workflow」をクリック
2. 各ノードが緑色✅になることを確認
3. 最後まで成功したら完了！

---

## ✅ 確認ポイント

### Node 2: GetUnusedThemes
- ✅ 未使用テーマが取得できているか

### Node 5: GenerateArticle
- ✅ Geminiが記事を生成しているか

### Node 6: ParseArticleJSON
- ✅ JSONが正しく解析できているか
- ❌ エラーが出たら → プロンプトを再調整

### Node 8: PostColumn
- ✅ TokuSearchに記事が投稿されているか
- 確認: https://tokusearch.vercel.app/columns

### Node 9: UpdateThemeUsed
- ✅ Google Sheetsで該当テーマの`used`が`TRUE`になっているか

---

## ⚠️ トラブルシューティング

### エラー1: Node 6でJSON解析エラー

**症状**: `記事のJSON解析に失敗`

**対策**: Node 5の出力を確認して、Geminiが純粋なJSONを返しているか確認

**修正**: Node 4のプロンプトをさらに強化：
```
【絶対厳守】
- 出力は { で始まり } で終わる純粋なJSONのみ
- ```json は絶対に使わない
- 説明文は一切書かない
```

---

### エラー2: Node 8で401エラー

**症状**: `Authorization failed`

**対策**: 
1. 認証情報を確認
2. Header Name: `x-api-key`（小文字、ハイフン）
3. Header Value: `xMQKbeidhj97S04kGoOpsmvnlBR1WIcZ`（正確に）

---

## 🎯 スケジュール設定

テストが成功したら：

1. ワークフローを**Activate**（右上のトグル）
2. 毎日9時に自動実行されます

---

## 📊 運用

### 毎日の確認
- n8n実行履歴: 成功しているか
- TokuSearch: 新しい記事が投稿されているか
- Google Sheets: テーマが使用済みになっているか

### 200記事達成後
- テーマ自動生成機能を実装
- または手動でテーマを追加

---

## 🖼️ 画像を後で追加する方法

1. TokuSearchの管理画面から手動でアップロード
2. または後日、画像生成ノードを追加

---

**これで完全自動でコラム生成が始まります！**

問題があればすぐに報告してください🚀



