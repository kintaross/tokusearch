# コラム自動生成（画像なし版）- セットアップガイド

**ファイル**: `column-workflow-no-image.json`  
**所要時間**: 5分  
**月間コスト**: $0（完全無料）

---

## 🎯 このワークフローで実現すること

✅ 毎日自動で記事生成  
✅ Gemini 2.5 Flash使用（無料）  
✅ デフォルト画像使用（無料）  
✅ TokuSearchに自動投稿  
✅ **完全無料で運用可能**

---

## 📊 ワークフロー構成

```
📅 トリガー（午前9時）
  ↓
📚 テーマ選択
  ├─ 未使用テーマ取得
  └─ ランダムに1件選択
  ↓
✍️ 記事生成
  ├─ プロンプト作成
  ├─ Gemini 2.5 Flash（無料）
  └─ JSON解析
  ↓
🚀 投稿処理
  ├─ 投稿データ準備（デフォルト画像）
  ├─ TokuSearch投稿
  └─ テーマ使用済み更新
  ↓
✅ 完了通知
```

---

## 🚀 セットアップ手順

### ステップ1: ワークフローをインポート（1分）

```
1. n8nで「+」→「Import from File」
2. column-workflow-no-image.json を選択
3. インポート完了
```

---

### ステップ2: 認証情報を確認（1分）

#### 既に設定済み（追加作業不要）✅

- ✅ Google Service Account
- ✅ Gemini API

#### 新規作成が必要⚠️

**N8N API Key Auth**（TokuSearch投稿用）

---

### ステップ3: N8N API Key を設定（3分）

#### 3-1. API Keyを生成

**PowerShell**:
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

#### 3-2. 環境変数に追加

**`.env.local`**:
```env
N8N_API_KEY=<N8N_API_KEY>
```

**Vercel**:
```bash
vercel env add N8N_API_KEY production
```

#### 3-3. n8nで認証情報を作成

```
Credentials → Create New → Header Auth
Name: N8N API Key Auth
Header Name: x-api-key
Header Value: <N8N_API_KEY>
```

#### 3-4. ノードに設定

「コラム投稿」ノードを開く
→ Credential for Header Auth
→ N8N API Key Auth を選択

---

## ✅ テスト実行

### 手動テスト

```
「毎日9時トリガー」ノードを右クリック
→ Execute Node
```

### 確認ポイント

```
✅ テーマが選択される
✅ 記事が生成される（JSON形式）
✅ デフォルト画像URLが設定される
✅ TokuSearchに投稿される
✅ Google Sheetsが更新される
```

### TokuSearchで確認

```
https://tokusearch.vercel.app/columns
→ 新しい記事が表示される
→ デフォルト画像が表示される
```

---

## 📅 スケジュール有効化

```
ワークフロー画面右上のトグル
→ Inactive から Active に変更
```

**毎日午前9時に自動実行されます**

---

## 🎨 デフォルト画像について

### 現在の設定

```
URL: https://placehold.co/1200x675/f97316/ffffff?text=TokuSearch+Column

サイズ: 1200x675（16:9）
色: オレンジ (#f97316)
テキスト: TokuSearch Column
```

### 変更したい場合

「投稿データ準備」ノードのコードを編集：

```javascript
// この行を変更
const thumbnailUrl = 'https://placehold.co/1200x675/f97316/ffffff?text=TokuSearch+Column';

// 例：色とテキストを変更
const thumbnailUrl = 'https://placehold.co/1200x675/3b82f6/ffffff?text=Column';
```

### 独自画像を使用する場合

```javascript
// 固定の画像URLを使用
const thumbnailUrl = 'https://yourdomain.com/images/default-thumbnail.png';
```

---

## 💰 コスト

| 項目 | 使用量/日 | 月間コスト |
|------|----------|-----------|
| Gemini 2.5 Flash | 1リクエスト | $0 |
| デフォルト画像 | - | $0 |
| TokuSearch API | 1リクエスト | $0 |
| Google Sheets | 2操作 | $0 |

**合計**: $0/月（完全無料）

---

## 🔧 カスタマイズ

### 実行時刻を変更

「毎日9時トリガー」ノード → Cron Expression

```
0 9 * * *     → 毎日9時
0 21 * * *    → 毎日21時
0 9 * * 1,3,5 → 月・水・金の9時
```

### 記事の文字数を変更

「記事生成プロンプト作成」ノード

```javascript
// この行を変更
【文字数】: 2000-3000文字
↓
【文字数】: 1500-2000文字
```

---

## 📈 後で画像生成を追加する

このワークフローは後から画像生成を追加できます：

### オプション1: Nano Banana Pro API

- コスト: $1〜2/月
- 品質: 高品質な自動生成画像
- 設定: `column-workflow-final.json`を参照

### オプション2: 手動で画像追加

- コスト: $0
- 作業: 管理画面から手動追加
- 柔軟性: 完全なコントロール

---

## 🐛 トラブルシューティング

### 問題1: N8N API Key エラー

**エラー**: `Unauthorized`

**対策**:
1. `.env.local`と`Vercel`で環境変数を確認
2. n8nの認証情報を再確認
3. APIキーを再生成

### 問題2: 記事生成エラー

**エラー**: `Quota exceeded`

**対策**:
1. 24時間待つ
2. 実行頻度を下げる（週3回など）

### 問題3: テーマが取得できない

**エラー**: `全てのテーマを使用済みです`

**対策**:
Google Sheetsで`used`列をすべて`FALSE`にリセット

---

## 📊 付箋の説明

ワークフローに付箋（Sticky Note）が5つあります：

### 付箋1: トリガー（青）
```
毎日午前9時に自動実行
Cron設定で時刻変更可能
```

### 付箋2: テーマ選択（緑）
```
Google Sheetsから未使用テーマを取得
ランダムに1件選択
```

### 付箋3: 記事生成（黄）
```
Gemini 2.5 Flashで記事生成
2000-3000文字の高品質な記事
```

### 付箋4: 投稿処理（オレンジ）
```
デフォルト画像を使用
TokuSearchに投稿
テーマを使用済みに更新
```

### 付箋5: 完了通知（紫）
```
投稿完了メッセージを作成
オプションでSlack通知追加可能
```

---

## 🎉 完成！

これで完全無料のコラム自動生成システムが完成しました！

### 毎日自動で実行される内容

1. ⏰ 午前9時に起動
2. 📚 テーマを1件選択
3. ✍️ 2000-3000文字の記事を生成
4. 🖼️ デフォルト画像を設定
5. 🚀 TokuSearchに投稿
6. ✅ テーマを使用済みに更新

### 次のステップ

- [ ] 実際に使ってみる
- [ ] 記事の品質を確認
- [ ] 必要に応じてプロンプトを調整
- [ ] 画像生成が必要か検討

---

**お疲れ様でした！** 🎊

質問があれば、お気軽にお聞きください！

---

**作成者**: TokuSearch開発チーム  
**最終更新**: 2025-11-27  
**バージョン**: 4.0（画像なし版・完成）



