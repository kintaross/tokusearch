# Slackトリガー + Webサイト コラム自動生成ワークフロー

**バージョン**: 2.1 (Ver1.7)  
**最終更新**: 2025-11-29

---

## 📋 概要

Slack または Webサイトからざっくりしたリクエストを送信すると、テーマ案を生成し、承認後にコラム記事を自動生成してTokuSearchに投稿するワークフローです。

**特徴**:
- ✅ Slack `#column-request` チャンネルで `@n8n Bot` メンション
- ✅ Webサイト `/columns/request` からリクエスト送信
- ✅ ざっくりしたリクエストから複数のテーマ案を生成
- ✅ **Ver1.7新機能**: テーマ案を新スレッドとして投稿、スレッド内で承認・通知
- ✅ **Ver1.7新機能**: メンションなしのスレッド返信で承認可能
- ✅ 複数記事の同時生成に対応
- ✅ 完了通知・エラー通知をSlackに送信

---

## 🔄 システム構成

```
【入力ソース】                    
                                     
Slack #column-request ──┐            【n8n ワークフロー】
  @column-bot メンション  │              
                        ├──→ Workflow A: テーマ生成
Webサイト ──────────────┘       ↓
  /columns/request            Slackにテーマ案投稿
                                   ↓
                             スレッド返信で承認
                                   ↓
                             Workflow B: 記事生成
                                   ↓
                             TokuSearch API投稿
                                   ↓
                             Slack完了通知
```

---

## 🚀 セットアップ手順

### Step 1: Slack設定

1. **新チャンネル作成**
   - Slackで `#column-request` チャンネルを作成

2. **n8n Slack Appを招待**
   - チャンネルで `/invite @n8n` を実行

3. **Event Subscriptions設定**（重要）
   - https://api.slack.com/apps でアプリを開く
   - 「Event Subscriptions」→「Enable Events」をON
   - Request URL: n8nワークフローのProduction Webhook URLをコピー
     - n8nのSlackWebhookノードで「Production URL」タブをクリック
     - 表示されたURL（例: `https://k-n8n.xvps.jp/webhook/{自動生成されたID}/webhook`）をコピー
     - このURLをSlackのRequest URLに貼り付けて「Save Changes」
   - 「Subscribe to bot events」で以下を追加:
     - `message.channels`（パブリックチャンネルのメッセージ）
     - `app_mention`（ボットへのメンション）
   - 「Save Changes」をクリック

### Step 2: Google Sheetsシート作成

1. **TokuSearchスプレッドシートを開く**
   - スプレッドシートID: `1iz1ApPwoLMMyqeQW_GA0XYM1qU74tzULNVq6vav3g14`

2. **新しいシート `column_requests` を作成**（Ver1.7対応）
   - 1行目にヘッダーを入力:
   ```
   request_id | source | channel_id | thread_ts | original_text | themes_json | status | created_at | parent_thread_ts
   ```
   
   **重要（Ver1.7）**: 既存のシートがある場合は、I列に `parent_thread_ts` カラムを追加してください。

詳細は `docs/COLUMN_REQUESTS_SHEET_SCHEMA.md` を参照してください。

### Step 3: n8nワークフローインポート（Ver1.7）

**最新バージョン**: `n8n_workflow/コラム生成_Slack連携_Ver1.7.json`

#### Ver1.7の主な変更点

1. **スレッド管理の改善**
   - テーマ案を新しいスレッドとして投稿（以前はリクエストメッセージのスレッドとして投稿）
   - 全ての通知がスレッド内に統一される
   
2. **承認フローの改善**
   - スレッド返信時にメンション不要（以前はメンションが必要だったため承認できなかった）
   - `#column-request`チャンネルの全メッセージを監視し、メンション有無とスレッド有無で判定
   
3. **データ構造の改善**
   - `parent_thread_ts`フィールドを追加（テーマ案投稿メッセージのts）
   - 承認検索に`parent_thread_ts`を使用

### Step 3（旧）: 過去バージョン

1. **ワークフローをインポート**
   - `n8n_workflow/コラム生成_Slack連携.json` をインポート
   - 認証情報は既存のものが自動で紐付きます
   - ワークフローを有効化（右上トグル → Active）

### Step 4: 環境変数設定（Webサイト連携）

Vercel環境変数に追加:

```env
N8N_WEBHOOK_URL=https://your-n8n-instance/webhook/column-request
```

---

## 📝 使用方法

### パターン1: Slack経由（Ver1.7）

#### 1. リクエスト送信

`#column-request` チャンネルで `@n8n Bot` にメンション：

```
@n8n Bot 難解なお得ルートと、マイルルートと、
どのカードがどこのお店に高ポイントか、があると嬉しいです
```

#### 2. テーマ案が新スレッドとして投稿される

n8n Botが**新しいスレッド**を作成し、テーマ案を投稿：

```
📝 テーマ案（3件）

1. ポイント多重取りルート攻略ガイド
   レベル: 中級者以上向け
   複雑なポイント多重取りルートの基本パターンを解説

2. マイル最大化：年間10万マイル達成法
   レベル: 上級者向け
   航空マイルを効率的に貯めるルートを解説

3. 店舗別・高還元カード早見表
   レベル: 初心者向け
   スーパー・コンビニ・ドラッグストアでの最適カード

---
承認方法:
• OK → 全て承認して記事生成
• 1,3 → 番号指定で承認
• 修正テキスト → テーマを再生成
```

#### 3. スレッド内で返信して承認

**重要（Ver1.7）**: テーマ案メッセージのスレッドアイコン（💬）をクリックして、スレッド内で返信してください。

```
1,3
```

または

```
OK
```

**メンション不要**: Ver1.7では、スレッド返信にメンションは不要です。

#### 4. 記事生成完了通知（スレッド内）

同じスレッド内に完了通知が届きます：

```
🎉 記事生成完了！

1. ポイント多重取りルート攻略ガイド
   https://tokusearch.vercel.app/columns/...

2. 店舗別・高還元カード早見表
   https://tokusearch.vercel.app/columns/...
```

### パターン2: Webサイト経由

1. **リクエストページにアクセス**
   - https://tokusearch.vercel.app/columns/request

2. **リクエスト内容を入力して送信**
   - ざっくりとした内容でOK

3. **Slackに通知が届く**
   ```
   🌐 Webサイトからリクエスト
   「マイルの効率的な貯め方について知りたい」

   📝 テーマ案（1件）
   1. マイル効率化完全ガイド
      ...

   承認: OK / 番号 / 修正
   ```

4. **Slackで承認 → 記事生成**

---

## 🔧 承認パターン

| 返信内容 | 動作 |
|---------|------|
| `OK` / `はい` / `YES` | 全てのテーマで記事生成 |
| `1` / `1,3` / `1, 2, 3` | 指定番号のテーマで記事生成 |
| `キャンセル` / `NO` | キャンセル（何もしない） |
| その他のテキスト | 修正依頼として再度テーマ生成 |

---

## 🗂 ファイル構成

### n8nワークフロー

| ファイル | 説明 |
|---------|------|
| `n8n_workflow/コラム生成_Slack連携.json` | Slack/Webhookトリガー → テーマ生成 → 承認 → 記事生成（統合版） |

### Webサイト

| ファイル | 説明 |
|---------|------|
| `app/columns/request/page.tsx` | リクエストフォームページ |
| `app/api/column-requests/route.ts` | リクエスト受付API |
| `components/columns/RequestButton.tsx` | リクエストボタンコンポーネント |

### ドキュメント

| ファイル | 説明 |
|---------|------|
| `docs/SLACK_COLUMN_GENERATION.md` | このファイル |
| `docs/COLUMN_REQUESTS_SHEET_SCHEMA.md` | Google Sheetsスキーマ定義 |

---

## 🐛 トラブルシューティング

### Slack Triggerが動作しない

**原因**: Slack Appがチャンネルに招待されていない

**解決策**:
1. `#column-request` チャンネルで `/invite @n8n` を実行
2. n8nのSlack認証情報を確認

### テーマが生成されない

**原因**: Gemini APIエラー

**解決策**:
1. n8nの実行ログを確認
2. Gemini API認証情報を確認
3. API制限に達していないか確認

### Webリクエストが届かない

**原因**: Webhook URLが設定されていない

**解決策**:
1. Vercel環境変数 `N8N_WEBHOOK_URL` を設定
2. n8nでWebhook Triggerノードを有効化
3. Webhook URLをコピーして環境変数に設定

### 記事が投稿されない

**原因**: TokuSearch API認証エラー

**解決策**:
1. `N8N_API_KEY` 環境変数を確認
2. n8nのHTTP Header Auth認証情報を確認

---

## 📊 モニタリング

### 確認項目

- n8n実行履歴（Executions）
- Google Sheets `column_requests` シートのstatus列
- Slackチャンネルの通知

### ステータス一覧

| status | 説明 |
|--------|------|
| `pending` | テーマ案提示中（承認待ち） |
| `approved` | 承認済み（記事生成中） |
| `completed` | 記事生成完了 |
| `cancelled` | キャンセル |

---

## ✅ チェックリスト

- [x] Slack `#column-request` チャンネルを作成した
- [x] n8n Slack Appをチャンネルに招待した
- [x] Google Sheets `column_requests` シートを作成した
- [ ] ワークフローをインポート・有効化した
- [ ] 環境変数 `N8N_WEBHOOK_URL` を設定した（Web連携用、任意）
- [ ] Slackでテスト送信して動作確認した
- [ ] Webサイトからテスト送信して動作確認した（任意）

**すべてチェックできたら、完了です！🎉**

---

**作成者**: TokuSearch開発チーム  
**サポート**: 不明点があれば別チャットで質問してください
