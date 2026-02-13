# コラム画像バックフィル（サムネ + 記事内差し込み）運用ガイド

このドキュメントは「画像が未設定の既存コラム」に対して、**Nano Banana Pro** で画像を生成し、

- **サムネイル画像**（`thumbnail_url`）
- **記事内の差し込み画像**（本文中の `[IMAGE: ...]` マーカー）

を自動生成・登録していくためのガイドです。

---

## 1. 現状のプレースホルダー仕様（ターゲット抽出の根拠）

### サムネ（アイキャッチ）
- `columns.thumbnail_url` が空の場合、記事ページではプレースホルダーが表示されます。
- `thumbnail_url` が入れば、そのURLが表示されます。

### 記事内差し込み
本文（`content_markdown`）内に **`[IMAGE: 説明]`** があると、UIで「📷 画像挿入位置」としてプレースホルダー表示します。

このため、バックフィル対象は以下です：
- `thumbnail_url` が未設定（空/NULL/旧プレースホルダー）
- または `content_markdown` に `[IMAGE:` が残っている

---

## 2. 追加されたAPI（n8n向け）

### 2.1 次に処理すべきコラムを取得

`GET /api/ingest/columns-images/next`

- **認証**: `x-api-key`（または `Authorization: Bearer`）に `N8N_API_KEY` を設定
- **クエリ**:
  - `limit`: 1〜3（デフォルト 1）
  - `max_inline`: 0〜10（デフォルト 6）… 1記事から返す差し込み画像の最大数

**レスポンス**（要旨）:
- `items[].thumbnail.prompt`: サムネ生成用プロンプト（必要な場合のみ）
- `items[].inline.items[].prompt`: 記事内差し込み用プロンプト（マーカーごと）

### 2.2 生成した画像URLを反映

`POST /api/ingest/columns-images/apply`

- **認証**: `x-api-key`（同上）
- **Body**:

```json
{
  "column_id": "col-xxxx",
  "thumbnail_url": "/columns/images/xxx.png",
  "inline_images": [
    { "description": "お小遣いアプリの利用履歴画面", "url": "/columns/images/a.png" },
    { "description": "キャッシュレスお小遣いの選択肢の比較表", "url": "/columns/images/b.png" }
  ]
}
```

反映内容:
- `thumbnail_url` を更新（渡された場合）
- 本文内の `[IMAGE: description]` を `![description](url)` に置換（渡された場合）

---

## 3. n8n（画像生成専用）ワークフローの推奨構成（1日3記事）

### 3.1 実行スケジュール
**1日3回（各回=1記事）**が安定します。

例: 09:00 / 12:00 / 21:00

### 3.2 ノード構成（概要）

1. Schedule Trigger（1日3回）
2. HTTP Request（`GET /api/ingest/columns-images/next?limit=1&max_inline=6`）
3. IF（itemsが0なら終了）
4. Code（サムネ + 差し込みの「画像ジョブ配列」を作る）
5. Split in Batches（1ジョブずつ）
6. HTTP Request（Nano Banana Proで画像生成）
7. Code（レスポンスから `inlineData.data` のbase64を抽出）
8. HTTP Request（`POST /api/admin/columns/upload-image` で保存）
9. Code（生成結果を集約し、`thumbnail_url` と `inline_images[]` を組み立て）
10. HTTP Request（`POST /api/ingest/columns-images/apply`）

---

## 4. Nano Banana Pro の推奨呼び出し（HTTP）

モデルは **`gemini-3-pro-image-preview`**（Nano Banana Pro）を使用します。

詳しいAPI仕様: https://ai.google.dev/gemini-api/docs/image-generation

例:
- URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent`
- Header: `x-goog-api-key: <GEMINI_API_KEY>`
- Body（概念）:
  - `generationConfig.responseModalities=["TEXT","IMAGE"]`
  - `generationConfig.imageConfig.aspectRatio="16:9"`
  - `generationConfig.imageConfig.imageSize="1K"`

---

## 5. 注意（コスト/枚数）

記事内の `[IMAGE: ...]` の数だけ画像が増えます。

運用の現実解として、`max_inline` を 2〜6 などに制限し、まずは毎日コツコツ埋めるのを推奨します。

---

## 6. n8n Cloud で `{{$env...}}` が使えない場合

n8n（特にCloud環境）では、式内の `{{$env.VAR_NAME}}` 参照がセキュリティ上ブロックされることがあり、
以下のようなエラーになります。

- `access to env vars denied`

この場合は **`$env` を使わず**、次のどちらかに切り替えてください。

- **推奨**: Credentials（`Header Auth`）を作り、HTTPノードの認証に割り当てる
  - `N8N API Key Auth`: Header Name=`x-api-key`, Value=`N8N_API_KEY`
  - `Gemini Header Auth`: Header Name=`x-goog-api-key`, Value=`GEMINI_API_KEY`
- **代替**: n8nの「Variables」機能が使えるなら `{{$vars.xxx}}` に置き換える

本リポジトリの雛形ワークフロー（`n8n_workflow/columns-image-backfill-nanobanana-db.json`）は、
**Credentials参照**で動くようにしてあります（`PLEASE_CREATE_...` を作成して割り当ててください）。

