# n8n TokuSearch統合セットアップガイド

このガイドでは、n8nワークフローにTokuSearchスプレッドシート更新機能を統合する手順を説明します。

## 📋 前提条件

- n8nがインストール・設定済みであること
- Googleサービスアカウントが設定済みであること（既存の `DxDzJ5750h7eaniE`）
- Grok API、Slack API、Gemini APIの認証情報が設定済みであること

## 🔧 セットアップ手順

### 1. TokuSearch用スプレッドシートの作成

#### 1-1. 新規スプレッドシート作成

Googleスプレッドシートで新しいスプレッドシートを作成します：
- 名前: `TokuSearch` （任意）
- シート名: `Sheet1` （デフォルト）

#### 1-2. ヘッダー行の設定

1行目に以下のヘッダーを設定してください：

```
id | date | title | summary | detail | steps | service | expiration | conditions | notes | category_main | category_sub | is_public | priority | discount_rate | discount_amount | score | created_at | updated_at
```

**重要**: カラムの順序は上記の通りにしてください。

#### 1-3. サービスアカウントの共有

スプレッドシートを以下のサービスアカウントと共有してください：
- メールアドレス: `tokusearch@reverberant-kit-475103-q0.iam.gserviceaccount.com`
- 権限: **編集者**

### 2. スプレッドシートIDの取得

作成したスプレッドシートのURLから、IDを取得します：

```
https://docs.google.com/spreadsheets/d/【ここがスプレッドシートID】/edit
```

例: `1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t`

### 3. n8nワークフローのインポート

#### 3-1. ワークフローJSONの準備

1. `n8n-workflow-updated.json` ファイルを開く
2. 以下の箇所を修正：

```json
"documentId": {
  "__rl": true,
  "value": "SPREADSHEET_ID_HERE",  // ← ここを実際のスプレッドシートIDに変更
  "mode": "id"
}
```

#### 3-2. n8nへのインポート

1. n8nのWeb UIを開く
2. **Workflows** → **Import from File**
3. 修正した `n8n-workflow-updated.json` をアップロード
4. ワークフローが正常にインポートされたことを確認

### 4. ワークフローの動作確認

#### 4-1. 手動実行テスト

1. n8nでインポートしたワークフローを開く
2. **Execute Workflow** をクリック
3. 各ノードが正常に実行されることを確認
4. TokuSearchスプレッドシートにデータが追加されることを確認

#### 4-2. スケジュール確認

ワークフローは以下のスケジュールで自動実行されます：
- 毎日 **10:00**
- 毎日 **20:00**

## 📊 ワークフロー構成

### 新規追加ノード

#### 1. TransformForTokuSearch（Codeノード）

**機能:**
- Grok収集データをTokuSearch形式に変換
- UUID生成
- カテゴリ自動判定（7カテゴリ）
- 優先度自動判定（A/B/C）
- 割引率・金額の抽出
- スコアリング（0-100）
- タイムスタンプ生成

**カテゴリ判定ルール:**
- `ドラッグストア・日用品`: マツキヨ、サンドラッグ、ツルハ、ウエルシア等
- `スーパー・量販店・EC`: イオン、Amazon、楽天、セブン、ファミマ等
- `グルメ・外食`: スタバ、マック、すき家、松屋等
- `旅行・交通`: JR、JAL、ANA、ソラシド、ホテル等
- `決済・ポイント`: PayPay、LINE Pay、ポイント還元、MNP等
- `タバコ・嗜好品`: タバコ、アイコス、プルーム等
- `その他`: 上記以外

**優先度判定ルール:**
- **A**: 割引率20%以上 または 割引額3000円以上
- **B**: 割引率10%以上 または 割引額1000円以上
- **C**: その他

**スコアリングロジック:**
- ベーススコア: 50点
- 優先度ボーナス: A=+30, B=+20, C=+10
- 割引率ボーナス: 最大10点
- 割引額ボーナス: 最大10点
- 期限情報ボーナス: +5点

#### 2. UpdateTokuSearchSheet（Google Sheetsノード）

**機能:**
- TokuSearchスプレッドシートに新規データを追加（Append操作）
- 全19フィールドのマッピング

### ワークフローフロー

```
TriggerEvery1 (10:00, 20:00)
    ↓
GeneratePrompt → CallGrokAI → ParseGrokResponse
    ↓                                ↓
GetSentHistory                  MergeInputs
    ↓                                ↓
FilterRecentHistory             FilterByUrl
                                     ↓
                              WrapItemsAsArray
                                     ↓
                              BuildGeminiPrompt
                                     ↓
                              Message a model
                                     ↓
                              UnpackGeminiResults
                                     ↓
                              RemoveAlreadySentItems
                                     ↓
                              TransformForTokuSearch ← 新規ノード
                                     ↓
                    ┌────────────────┼────────────────┐
                    ↓                ↓                ↓
          UpdateTokuSearchSheet  BuildSlackMessage  SaveToHistory
             ← 新規ノード            ↓
                              SlackNotify
```

## 🔍 トラブルシューティング

### エラー: Permission Denied

**原因**: サービスアカウントがスプレッドシートにアクセスできない

**解決方法**:
1. スプレッドシートの共有設定を確認
2. `tokusearch@reverberant-kit-475103-q0.iam.gserviceaccount.com` が**編集者**権限で追加されているか確認

### エラー: Sheet not found

**原因**: シート名が一致しない

**解決方法**:
1. スプレッドシートのシート名が `Sheet1` であることを確認
2. 異なる場合は、`UpdateTokuSearchSheet` ノードの設定を変更

### データが追加されない

**原因**: ヘッダー行が正しく設定されていない

**解決方法**:
1. 1行目のヘッダーが正確に設定されているか確認
2. スペルミス、スペースの有無を確認

### カテゴリが「その他」になってしまう

**原因**: サービス名・タイトル・詳細にカテゴリ判定キーワードが含まれていない

**解決方法**:
- `TransformForTokuSearch` ノードのコードを編集し、キーワードを追加

## 📝 カスタマイズ

### カテゴリ判定のカスタマイズ

`TransformForTokuSearch` ノードの `determineCategory` 関数を編集：

```javascript
function determineCategory(service, title, detail) {
  const text = `${service} ${title} ${detail}`.toLowerCase();
  
  // 新しいカテゴリ判定ルールを追加
  if (/カスタムキーワード/.test(text)) {
    return 'カスタムカテゴリ';
  }
  
  // ... 既存のルール
}
```

### 優先度判定のカスタマイズ

`TransformForTokuSearch` ノードの `determinePriority` 関数を編集：

```javascript
function determinePriority(discountRate, discountAmount) {
  // しきい値をカスタマイズ
  if ((discountRate && discountRate >= 30) || (discountAmount && discountAmount >= 5000)) {
    return 'A';
  }
  // ...
}
```

### スコアリングのカスタマイズ

`TransformForTokuSearch` ノードの `calculateScore` 関数を編集：

```javascript
function calculateScore(discountRate, discountAmount, priority, hasExpiration) {
  let score = 50; // ベーススコアを変更
  
  // ボーナス計算をカスタマイズ
  if (priority === 'A') score += 40; // Aの重みを増やす
  // ...
}
```

## 🚀 tokuSearchアプリでの表示確認

### 環境変数の設定

tokuSearchアプリの `.env.local` ファイルに、TokuSearchスプレッドシートのIDを設定：

```bash
GOOGLE_SHEETS_SPREADSHEET_ID=【TokuSearchスプレッドシートID】
GOOGLE_SHEETS_SHEET_NAME=Sheet1
GOOGLE_SERVICE_ACCOUNT_KEY='【サービスアカウントキーJSON】'
```

### アプリの起動

```bash
npm run dev
```

### 動作確認

1. ブラウザで `http://localhost:3000` にアクセス
2. n8nで追加されたお得情報が表示されることを確認
3. カテゴリ、優先度、スコアが正しく表示されることを確認

## 📚 参考資料

- [n8nドキュメント](https://docs.n8n.io/)
- [Google Sheets APIドキュメント](https://developers.google.com/sheets/api)
- [tokuSearch スプレッドシートテンプレート](./docs/SPREADSHEET_TEMPLATE.md)

## ⚠️ 注意事項

1. **スプレッドシートIDは機密情報です**: 公開リポジトリにコミットしないでください
2. **サービスアカウントキーは厳重に管理**: 環境変数として設定し、.gitignoreに追加
3. **定期的なバックアップ**: スプレッドシートは定期的にバックアップを取得
4. **データ量の監視**: 大量のデータが蓄積された場合、パフォーマンスに影響する可能性があります

## 🎉 完了

以上でn8n TokuSearch統合のセットアップは完了です！

ワークフローが1日2回（10:00と20:00）自動実行され、お得情報がTokuSearchスプレッドシートに追加され、tokuSearchアプリで表示されます。





