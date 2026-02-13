# ウエル活当日攻略 Playbook ワークフロー

毎月20日のウエル活向け「当日攻略」コンテンツを LLM で生成し、DB に投入する n8n ワークフローのセットアップ・運用手順です。

---

## 1) 概要

- **ワークフロー名**: ウエル活当日攻略 Playbook 生成＆DB投入
- **ファイル**: `n8n_workflow/welkatsu-playbook-db-ingest.json`
- **目的**: 当月の `welkatsu_playbooks` を 1 件 upsert し、`/welkatsu` ページで「当日攻略」として表示する

---

## 2) 実行条件

- **スケジュール**: 毎日 06:00（n8n の Schedule Trigger）
- **日付ガード**: **18〜21日のみ** 本番処理を実行。それ以外の日は何もしない（0 件返却で後続ノードは実行されない）

---

## 3) 環境変数（n8n 側）

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `N8N_API_KEY` | はい | Ingest API 認証。Vercel の `N8N_API_KEY` と同一値 |

（オプション）本番ドメインが異なる場合、ワークフロー内の **IngestWelkatsuPlaybooks** ノードの URL を  
`https://あなたのドメイン/api/ingest/welkatsu-playbooks` に変更するか、n8n の変数で `TOKUSEARCH_BASE_URL` を定義し、URL を `{{ $env.TOKUSEARCH_BASE_URL }}/api/ingest/welkatsu-playbooks` にしてください。

---

## 4) アプリ側（Ingest API）

- **エンドポイント**: `POST /api/ingest/welkatsu-playbooks`
- **認証**: `x-api-key` ヘッダー（または `Authorization: Bearer <N8N_API_KEY>`）
- **Body**: 単体オブジェクト or 配列 or `{ "items": [...] }`

### リクエスト例（1件）

```json
{
  "id": "welkatsu-2026-02",
  "month": "2026-02",
  "title": "2026年2月のウエル活・当日攻略",
  "summary": "ポイント確認→クーポン取得→レジで提示の順で。",
  "content_json": {
    "phases": [
      { "key": "BeforeStore", "title": "店舗に行く前", "steps": ["WAON POINT残高確認", "アプリでクーポン取得"] },
      { "key": "InStore", "title": "店内で", "steps": ["対象商品を選ぶ", "レジへ"] },
      { "key": "AfterStore", "title": "支払い後", "steps": ["レシート確認"] }
    ],
    "timeline": [
      { "label": "朝", "description": "在庫豊富", "tips": ["混雑前がおすすめ"] },
      { "label": "夕方・閉店前", "description": "売れ残りセールと併用可" }
    ],
    "register_steps": [
      { "order": 1, "label": "クーポン提示", "detail": "アプリまたは画面を店員に提示" },
      { "order": 2, "label": "ポイント適用", "detail": "200pt=300円分" },
      { "order": 3, "label": "支払い", "detail": "残額を現金/電子マネーで" }
    ],
    "pitfalls": [
      { "title": "対象外に注意", "description": "一部商品・処方箋は対象外", "severity": "warning" }
    ],
    "point_calc": { "description": "200ptで300円分。端数は現金等で支払い。", "example": "1500円買い→1000pt使用＋500円" },
    "checklist_labels": ["前日にWAON POINT残高確認", "アプリでクーポン取得", "レジでクーポン提示"]
  },
  "sources_json": [{ "title": "ウエルシア公式", "url": "https://www.welcia.co.jp/" }]
}
```

- `id` は省略時、`welkatsu-{month}` として扱われます。
- `content_json` が必須。`phases` / `timeline` / `register_steps` / `pitfalls` / `point_calc` / `checklist_labels` のいずれかが存在する必要があります。

---

## 5) DB スキーマ

テーブル定義は `scripts/db/schema.sql` の **welkatsu_playbooks** を参照してください。

- `id` (TEXT PK), `month` (TEXT UNIQUE), `title`, `summary`, `content_json` (JSONB), `sources_json` (JSONB), `created_at`, `updated_at`

既存 DB にテーブルを追加する場合は、該当 CREATE TABLE と INDEX を実行してください。

---

## 6) ワークフロー構成（ノード概要）

1. **ScheduleDaily** … 毎日 06:00 実行
2. **DateGuardAndPrompt** … 18〜21日なら当月（YYYY-MM）と LLM 用プロンプトを出力
3. **IfInRange** … `month` がある場合のみ True 側へ
4. **GeminiPlaybook** … Google Gemini で JSON 形式の playbook を生成
5. **ParseAndValidate** … 応答テキストをパースし、`content_json` を検証。`id` / `month` を付与
6. **IngestWelkatsuPlaybooks** … `POST /api/ingest/welkatsu-playbooks` に送信

---

## 7) トラブルシューティング

- **401 Unauthorized**: n8n の `N8N_API_KEY` と Vercel（またはアプリ）の値が一致しているか確認
- **400 Validation failed**: `month`（YYYY-MM）、`title`、`content_json`（オブジェクト）が渡っているか確認
- **LLM が JSON を返さない**: ParseAndValidate でコードブロック除去・`{`〜`}` 抽出をしているため、通常は対応可能。それでも失敗する場合はプロンプトの「JSONのみ出力」を強調

---

## 8) 関連ドキュメント

- [n8n → DB Ingest 概要](N8N_DB_INGEST.md)
- [アプリ概要・機能](APP_OVERVIEW_AND_SPEC.md)（`/welkatsu` の説明）
