# 残り2ファイルの修正範囲と影響（columns API）

現行を壊さないための変更内容の整理です。

---

## n8n ワークフロー確認結果（実態）

実際の n8n ワークフロー JSON を確認した結果は以下のとおりです。

### 認証ヘッダの送り方（3パターン）

| パターン | 例 | 送っているヘッダ |
|----------|-----|-------------------|
| **ヘッダ直書き** | `column-theme-approval-db.json`, `columns-auto-noimage-db.json`, `columns-auto-with-images-db.json`, `deals-workflow-db-ingest.json` 等 | `x-api-key` と `Authorization: Bearer <キー>` の**両方**を同じキーで送っている |
| **環境変数参照** | `columns-unified-db.json` | `={{$env.N8N_API_KEY}}` で x-api-key と Bearer の両方に設定 |
| **認証情報参照** | `コラム自動生成（画像なし版）(4).json`, `columns-auto-no-image-db.json` | `httpHeaderAuth` の credential を参照（JSON にキーは含まれない） |

### 呼び出し先との対応

- **POST /api/admin/columns**（コラム作成）: 上記いずれも **x-api-key**（および多くの場合 Bearer）を送っている。
- **POST /api/admin/columns/upload-image**（画像アップロード）: `columns-auto-with-images-db.json`, `columns-image-backfill-nanobanana-db.json`, `columns-unified-db.json` 等で同様に **x-api-key** と **Authorization: Bearer** を送っている。

### 未コミット修正との互換性

- `getIngestApiKey(request)` は **x-api-key を優先**して取得し、なければ `Authorization: Bearer` から取得する。  
  → 現行の「x-api-key と Bearer の両方を送る」運用と**そのまま互換**。
- 比較は `(N8N_API_KEY ?? N8N_INGEST_API_KEY ?? '').trim()` と行う。  
  → n8n 側でキーに前後空白を付けていなければ、現行と**同じ条件で通る**。
- **結論**: n8n ワークフローを参照したうえでも、**現行の動きを壊す変更ではない**。

---

## 対象ファイル

| ファイル | 役割 | 呼び出し元 |
|----------|------|------------|
| `app/api/admin/columns/route.ts` | コラム一覧GET・コラム作成POST | 管理画面（Cookie）、n8n（x-api-key） |
| `app/api/admin/columns/upload-image/route.ts` | コラム用画像アップロード（Base64 JSON） | n8n のみ（管理画面は `/api/admin/upload` を使用） |

---

## 1. `app/api/admin/columns/route.ts` の変更

### 変更内容（差分）

| 項目 | コミット済み（現行） | 未コミット（修正案） |
|------|----------------------|------------------------|
| APIキー取得 | `request.headers.get('x-api-key')` のみ | `getIngestApiKey(request)`（x-api-key または Authorization: Bearer） |
| 期待値 | `process.env.N8N_API_KEY \|\| process.env.N8N_INGEST_API_KEY`（そのまま比較） | `(N8N_API_KEY ?? N8N_INGEST_API_KEY ?? '').trim()` と比較 |
| 一致判定 | `!!expected && apiKey === expected` | `expected.length > 0 && apiKey === expected` |
| ログ | 認証デバッグ用の console.log あり | 削除 |

### 挙動の違い（現行を壊すか）

- **管理画面**: Cookie で認証するため、**変更の影響なし**。従来どおり動作。
- **n8n（x-api-key で送っている場合）**:
  - `getIngestApiKey(request)` は `x-api-key` を優先して返すので、**送り方が同じなら「通る/通らない」は変わらない**。
  - 違いは次の2点だけ:
    1. **環境変数の前後空白**: 現行は空白付きでも「そのまま一致」すれば通る。修正後は `expected` を trim するので、**環境変数にだけ空白がある場合は修正後の方が通りやすくなる**（n8n 側キーに空白が付いていると従来は不一致だった可能性あり）。
    2. **Authorization: Bearer**: 修正後は `Authorization: Bearer <key>` でも通る。**x-api-key は従来どおり有効**なので、現行の呼び出しはそのまま通る。
- **結論**: 現行で「x-api-key に正しいキーを設定して n8n が送っている」なら、**壊れない**。ログが消えるだけ。

---

## 2. `app/api/admin/columns/upload-image/route.ts` の変更

### 変更内容（差分）

| 項目 | コミット済み（現行） | 未コミット（修正案） |
|------|----------------------|------------------------|
| 認証 | `apiKey = request.headers.get('x-api-key')` と `apiKey !== process.env.N8N_API_KEY` のみ | `isIngestAuthorized(request)`（ingest-auth を使用） |
| 参照する環境変数 | **N8N_API_KEY のみ** | **N8N_API_KEY と N8N_INGEST_API_KEY の両方**（ingest-auth と同じ） |

### 挙動の違い（現行を壊すか）

- **現行**: `N8N_API_KEY` だけと比較。`N8N_INGEST_API_KEY` は**見ていない**。
- **修正後**: `lib/ingest-auth` の `isIngestAuthorized` を使うため、`N8N_API_KEY ?? N8N_INGEST_API_KEY` のどちらかと一致すれば通る。
- **呼び出し元**: このエンドポイントは **n8n のワークフローのみ**。管理画面は `ImageUploader` で `/api/admin/upload` を使っている。
- **結論**:
  - 現行で **N8N_API_KEY** を n8n に設定して upload-image を呼んでいる → **修正後も同じキーで通る。壊れない。**
  - 現行で **N8N_INGEST_API_KEY** だけ設定している環境では、現行の upload-image は 401。修正後は **N8N_INGEST_API_KEY でも通る**（挙動の改善）。

---

## 懸念への回答「現行で動いている物を壊したくない」

- **管理画面**: どちらのファイルも Cookie 認証または別エンドポイント利用のため、**影響なし**。
- **n8n（コラム作成）**: キーを x-api-key で送っている現行運用なら、**キー比較ロジックは実質同じ**（取得方法の共通化＋trim と N8N_INGEST_API_KEY 対応のみ）。**壊れない**。
- **n8n（画像アップロード）**: N8N_API_KEY で送っている現行なら、**同じ条件で通る**。N8N_INGEST_API_KEY のみの環境は修正後の方が通る。

**注意**: 環境変数 `N8N_API_KEY` や `N8N_INGEST_API_KEY` に**意図せず前後空白が入っている**場合、現行は「空白付きのまま」比較しているため、n8n 側も同じ空白付きで送っていれば通っている。修正後はサーバー側で trim するため、**n8n 側でキーを trim して送っていれば**従来より安定して通る。n8n 側でキーを「空白付き」のまま送っている稀なケースでは、trim により不一致になる可能性はあるが、多くの環境ではキーは空白なしで設定するため問題にならない。

---

## 推奨

- 上記のとおり、**現行の正常な運用（管理画面＋n8n で正しいキーを x-api-key で送っている）を壊す変更ではない**。
- 修正案は「認証を ingest-auth に寄せ、N8N_INGEST_API_KEY を upload-image でも使えるようにし、デバッグログを消す」だけ。
- **この2ファイルの修正をコミットしてよい**と判断して問題ない範囲です。必要なら、本番反映前に n8n のコラム作成・画像アップロードを1回ずつ手動実行して 200 になることを確認するとより安心です。
