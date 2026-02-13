# コツコツポイ活 n8n ワークフロー セットアップ・運用手順

## 概要

**コツコツポイ活（X→DB Ingest）** は、X（Twitter）から「ポチポチ・コツコツ系」のポイ活情報のみを抽出し、TokuSearch の DB（`deals` テーブル）へ投入する専用ワークフローです。

- **対象**: お小遣いLINKのポチポチ、ログインボーナス、チェックイン、毎日ミッション、ポイントサイトの日次タスクなど
- **除外**: カード発行・FX・投資・高単価紹介・抽選、フォロー/リポスト必須、終了済み
- **投入先**: 既存 `deals` テーブル（`category_sub='コツコツ'`、`tags` に「コツコツ,ポチポチ」を付与）
- **表示**: アプリの `/kotsukotsu` ページで絞り込み表示

## ファイル

- **ワークフローJSON**: `n8n_workflow/kotsukotsu-workflow-db-ingest.json`

## 前提

- n8n が稼働していること（Cloud / セルフホストどちらでも可）
- **xAi (Grok) API** の認証情報が n8n に登録済みであること（既存「お得情報自動収集」ワークフローと同じ xAi アカウントで可）
- TokuSearch 本番（または検証）の **Ingest API** が利用可能であること
- Ingest API 用の API キーは、**deals-workflow-db-ingest.json と同じリテラル値**をワークフロー内に記載しています（n8n の環境変数は使わない前提）。

## インポート手順

1. n8n の Web UI を開く
2. **Workflows** → **Import from File** を選択
3. `n8n_workflow/kotsukotsu-workflow-db-ingest.json` をアップロード
4. ワークフローが開いたら、以下を確認・設定する

### 認証・設定

- **CallGrokAI** ノード: **Credentials** で xAi API を選択（既存の「xAi account」など）
- **GetRecentDeals** / **PostIngestDeals** ノード:  
  - URL は `https://tokusearch.vercel.app` のまま、または自ドメインに変更  
  - **x-api-key** と **Authorization** は、deals-workflow と同様に **JSON 内にリテラルで記載**済み。キーをローテーションした場合は、このワークフローと `deals-workflow-db-ingest.json` の両方の該当箇所を同じ値に更新すること

## ノード構成（流れ）

1. **ScheduleTrigger** … 1日2回（10:00 / 22:00）実行
2. **GetRecentDeals** … `GET /api/ingest/deals/recent?days=30` で直近30日分を取得（重複チェック用）
3. **UnwrapRecentDeals** … レスポンスの `deals` 配列を展開
4. **FilterRecentHistory** … 30日以内の履歴のみ残す
5. **GenerateKotsukotsuPrompt** … コツコツ特化の検索プロンプトを生成（対象・除外ルールを明記）
6. **CallGrokAI** … Grok (X検索) API を呼び出し
7. **ParseGrokResponse** … 返却 JSON 配列をパース
8. **FilterByID** … 既存履歴の URL（Twitter status ID）と重複するものを除外
9. **TransformKotsukotsu** … Deal 形式に変換（`category_main=決済・ポイント`, `category_sub=コツコツ`, `tags=コツコツ,ポチポチ,...`, `difficulty=low`, `area_type=online`, `target_user_type=all` など固定）
10. **IfNotEmpty** … 変換結果が空でない場合のみ次へ
11. **PostIngestDeals** … `POST /api/ingest/deals` で 1件ずつ投入

## プロンプト調整ポイント（GenerateKotsukotsuPrompt）

- **監視キーワード**: お小遣いLINK、ポチポチ、ログインボーナス、チェックイン、毎日ミッション、ポイントサイト、日次タスク、くじ、広告視聴 など
- **除外キーワード**: カード発行、FX、投資、紹介リンク、高単価、抽選、フォロー必須、リポスト必須、終了、TikTok
- **検索期間**: 現在は「過去24時間」でプロンプトを生成。必要に応じてノード内の `oneDayAgo` を 2日・3日に変更可能

## 運用

- ワークフローを **有効化** すると、スケジュールに従って自動実行されます
- 初回は手動で **Execute Workflow** して、GetRecentDeals → … → PostIngestDeals までエラーなく流れるか確認することを推奨
- 本番の **Ingest API** は `https://tokusearch.vercel.app` を参照しています。検証用の場合はノードの URL を変更してください

## トラブルシューティング

- **401 Unauthorized**: `N8N_API_KEY` が n8n とアプリ側で一致しているか確認
- **Grok が 0件返す**: プロンプトの期間やキーワードを調整。X の検索結果が少ない時間帯は 0件になることがあります
- **重複が入る**: FilterByID は「Twitter status ID」ベースの重複除外のみ。同一ツイート内の複数案件は別 ID になる場合があるため、必要なら Transform 側で title/service ベースのユニーク化を検討

## 関連ドキュメント

- [N8N_DB_INGEST.md](./N8N_DB_INGEST.md) … Ingest API 一覧と認証
- [N8N_CREDENTIALS_SETUP.md](./N8N_CREDENTIALS_SETUP.md) … 認証情報の設定
