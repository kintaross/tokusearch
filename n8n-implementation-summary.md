# n8n TokuSearch統合 実装完了サマリー

## ✅ 実装完了

n8nワークフローにTokuSearchスプレッドシート更新機能を統合しました。

## 📁 成果物

### 1. `n8n-workflow-updated.json`
- 更新されたn8nワークフロー設定ファイル
- n8nにインポートして使用可能

### 2. `n8n-tokusearch-setup.md`
- 詳細なセットアップガイド
- トラブルシューティング情報
- カスタマイズ方法

### 3. `n8n-implementation-summary.md`（このファイル）
- 実装の概要とクイックスタート

## 🚀 クイックスタート

### ステップ1: スプレッドシート作成

1. Googleスプレッドシートで新規作成（名前: `TokuSearch`）
2. 1行目に以下のヘッダーを設定:
   ```
   id | date | title | summary | detail | steps | service | expiration | conditions | notes | category_main | category_sub | is_public | priority | discount_rate | discount_amount | score | created_at | updated_at
   ```
3. サービスアカウント `tokusearch@reverberant-kit-475103-q0.iam.gserviceaccount.com` に**編集者**権限で共有
4. スプレッドシートIDをコピー（URLの `/d/` と `/edit` の間の文字列）

### ステップ2: ワークフロー設定

1. `n8n-workflow-updated.json` を開く
2. `SPREADSHEET_ID_HERE` を実際のスプレッドシートIDに置換（1箇所のみ）
3. ファイルを保存

### ステップ3: n8nにインポート

1. n8n Web UIを開く
2. **Workflows** → **Import from File**
3. 修正した `n8n-workflow-updated.json` をアップロード
4. **Execute Workflow** で動作確認

### ステップ4: tokuSearchアプリ設定

`.env.local` に以下を追加:

```bash
GOOGLE_SHEETS_SPREADSHEET_ID=【TokuSearchスプレッドシートID】
GOOGLE_SHEETS_SHEET_NAME=Sheet1
```

## 🎯 実装内容

### 新規追加ノード

#### 1. TransformForTokuSearch（Codeノード）

**位置**: `RemoveAlreadySentItems` の後

**機能**:
- ✅ UUID自動生成
- ✅ カテゴリ自動判定（7カテゴリ）
  - ドラッグストア・日用品
  - スーパー・量販店・EC
  - グルメ・外食
  - 旅行・交通
  - 決済・ポイント
  - タバコ・嗜好品
  - その他
- ✅ 優先度自動判定（A/B/C）
  - A: 割引率20%以上 または 割引額3000円以上
  - B: 割引率10%以上 または 割引額1000円以上
  - C: その他
- ✅ 割引率・金額の正規表現抽出
- ✅ スコアリング（0-100点）
- ✅ タイムスタンプ自動付与
- ✅ 出典情報をnotesに追記

#### 2. UpdateTokuSearchSheet（Google Sheetsノード）

**位置**: `TransformForTokuSearch` の後

**機能**:
- ✅ TokuSearchスプレッドシートに新規行追加（Append）
- ✅ 全19フィールドのマッピング

### ワークフローフロー図

```
                    TriggerEvery1 (10:00, 20:00)
                            ↓
    ┌───────────────────────┴───────────────────────┐
    ↓                                               ↓
GeneratePrompt                              GetSentHistory
    ↓                                               ↓
CallGrokAI                                  FilterRecentHistory
    ↓                                               ↓
ParseGrokResponse ───────→ MergeInputs ←────────────┘
                                ↓
                          FilterByUrl
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
            ┌───────────────────┼───────────────────┐
            ↓                   ↓                   ↓
   TransformForTokuSearch  BuildSlackMessage  SaveToHistory
            ↓                   ↓
   UpdateTokuSearchSheet  SlackNotify
```

## 📊 データ変換の詳細

### 入力（n8n Grokデータ）
```json
{
  "date": "2025-11-20",
  "title": "PayPayボーナス還元キャンペーン",
  "summary": "PayPayで最大20%還元！",
  "detail": "還元率: 20%\n還元額目安: 約5,000円",
  "steps": "1. PayPayアプリを開く...",
  "service": "PayPay",
  "url": "https://x.com/.../status/...",
  "source_name": "ことはむ",
  "source_id": "@kotoham_pkt",
  "expiration": "2025-12-20",
  "conditions": "新規会員限定",
  "notes": "※還元額は購入金額により変動します"
}
```

### 出力（TokuSearch形式）
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "date": "2025-11-20",
  "title": "PayPayボーナス還元キャンペーン",
  "summary": "PayPayで最大20%還元！",
  "detail": "還元率: 20%\n還元額目安: 約5,000円",
  "steps": "1. PayPayアプリを開く...",
  "service": "PayPay",
  "expiration": "2025-12-20",
  "conditions": "新規会員限定",
  "notes": "※還元額は購入金額により変動します\n【出典】ことはむ (@kotoham_pkt)\nhttps://x.com/.../status/...",
  "category_main": "決済・ポイント",
  "category_sub": "",
  "is_public": "TRUE",
  "priority": "A",
  "discount_rate": 20,
  "discount_amount": 5000,
  "score": 95,
  "created_at": "2025-11-20T16:26:36.726Z",
  "updated_at": "2025-11-20T16:26:36.726Z"
}
```

## 🔄 スケジュール実行

ワークフローは以下のスケジュールで自動実行されます：

- **毎日 10:00** （日本時間）
- **毎日 20:00** （日本時間）

1日2回、最新のお得情報を収集し、TokuSearchスプレッドシートに自動追加されます。

## 🎨 カスタマイズポイント

### カテゴリ判定のカスタマイズ

`TransformForTokuSearch` ノードの `determineCategory` 関数を編集することで、カテゴリ判定ルールをカスタマイズできます。

**例**: 新しいキーワードを追加
```javascript
// 決済・ポイント
if (/paypay|line pay|d払い|新しいキーワード/.test(text)) {
  return '決済・ポイント';
}
```

### 優先度判定のカスタマイズ

`TransformForTokuSearch` ノードの `determinePriority` 関数を編集することで、優先度判定のしきい値を変更できます。

**例**: Aランクのしきい値を上げる
```javascript
// A: 30%以上 または 5000円以上
if ((discountRate && discountRate >= 30) || (discountAmount && discountAmount >= 5000)) {
  return 'A';
}
```

### スコアリングのカスタマイズ

`TransformForTokuSearch` ノードの `calculateScore` 関数を編集することで、スコアの計算方法を変更できます。

**例**: 優先度Aの重みを増やす
```javascript
// 優先度によるボーナス
if (priority === 'A') score += 40; // 30から40に変更
```

## 📋 確認事項チェックリスト

- [ ] TokuSearchスプレッドシートを作成
- [ ] ヘッダー行（19カラム）を設定
- [ ] サービスアカウントに編集者権限で共有
- [ ] スプレッドシートIDを取得
- [ ] `n8n-workflow-updated.json` のスプレッドシートIDを更新
- [ ] n8nにワークフローをインポート
- [ ] 手動実行で動作確認
- [ ] tokuSearchアプリの `.env.local` を更新
- [ ] tokuSearchアプリで表示確認

## ⚠️ 注意事項

1. **スプレッドシートIDは機密情報**: 公開リポジトリにコミットしない
2. **サービスアカウントキーの管理**: 環境変数として設定し、.gitignoreに追加
3. **データのバックアップ**: 定期的にスプレッドシートをバックアップ
4. **パフォーマンス監視**: データ量が増えた場合の対策を検討

## 🐛 トラブルシューティング

### Permission Denied エラー
→ サービスアカウントがスプレッドシートに**編集者**権限で共有されているか確認

### Sheet not found エラー
→ シート名が `Sheet1` であることを確認

### データが追加されない
→ 1行目のヘッダーが正確に設定されているか確認

### カテゴリが「その他」になる
→ `TransformForTokuSearch` のカテゴリ判定ルールにキーワードを追加

詳細は `n8n-tokusearch-setup.md` を参照してください。

## 📞 サポート

実装に関する質問や問題がある場合は、以下のドキュメントを参照してください：

- `n8n-tokusearch-setup.md` - 詳細なセットアップガイド
- `docs/SPREADSHEET_TEMPLATE.md` - スプレッドシートテンプレート
- `docs/UPDATE_GUIDE.md` - 更新ガイド

## 🎉 完了

以上で、n8n TokuSearch統合の実装は完了です！

ワークフローが1日2回自動実行され、お得情報がTokuSearchスプレッドシートに追加され、tokuSearchアプリで表示されます。





