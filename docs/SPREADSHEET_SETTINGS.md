# Googleスプレッドシートの設定項目

Googleスプレッドシートを連携するために必要な設定項目を説明します。

## 必要な設定項目（3つ）

### 1. スプレッドシートID ✅ 必須

**説明:** GoogleスプレッドシートのURLから取得できる一意のID

**取得方法:**
1. Googleスプレッドシートを開く
2. URLを確認: `https://docs.google.com/spreadsheets/d/[ここがID]/edit`
3. `/d/` と `/edit` の間の文字列がスプレッドシートID

**例:**
```
URL: https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j/edit
ID: 1a2b3c4d5e6f7g8h9i0j
```

**環境変数:**
```env
GOOGLE_SHEETS_SPREADSHEET_ID=1a2b3c4d5e6f7g8h9i0j
```

---

### 2. 認証情報 ✅ 必須（いずれか一方）

#### 方法A: APIキー（公開スプレッドシート用）

**説明:** Google Cloud Consoleで取得するAPIキー

**取得方法:**
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを選択（または新規作成）
3. 「APIとサービス」→「ライブラリ」
4. 「Google Sheets API」を検索して有効化
5. 「APIとサービス」→「認証情報」→「認証情報を作成」→「APIキー」
6. APIキーをコピー

**重要:** スプレッドシートを「リンクを知っている全員」に公開する必要があります

**環境変数:**
```env
GOOGLE_SHEETS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

#### 方法B: サービスアカウント（プライベートスプレッドシート用・推奨）

**説明:** Google Cloud Consoleで作成するサービスアカウントのJSONキー

**取得方法:**
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを選択（または新規作成）
3. 「APIとサービス」→「認証情報」→「認証情報を作成」→「サービスアカウント」
4. サービスアカウント名を入力 → 「作成」
5. 「キー」タブ → 「キーを追加」→「新しいキーを作成」→「JSON」
6. JSONファイルをダウンロード

**重要:** スプレッドシートにサービスアカウントのメールアドレスを共有（閲覧権限）

**環境変数:**
```env
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

---

### 3. シート名 ⚠️ オプション

**説明:** データが入っているシートの名前（デフォルト: `Sheet1`）

**確認方法:**
1. Googleスプレッドシートを開く
2. 下部のタブでシート名を確認
3. 通常は `Sheet1` ですが、変更している場合はその名前を指定

**環境変数:**
```env
GOOGLE_SHEETS_SHEET_NAME=Sheet1
```

**注意:** シート名を変更していない場合は設定不要です

---

## ベースURLについて

**ベースURL（`NEXT_PUBLIC_BASE_URL`）はスプレッドシートの設定ではありません。**

- **スプレッドシートの設定:** 上記の3項目のみ
- **ベースURL:** サイトを公開する際のURL（本番環境用、現在は未使用）

ベースURLは開発環境では不要で、スプレッドシートとは無関係です。

詳細: [docs/BASE_URL.md](./BASE_URL.md)

---

## 設定の確認方法

### 1. 環境変数ファイル（.env.local）を確認

プロジェクトルートに `.env.local` ファイルがあることを確認：

```env
# 必須
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SHEETS_API_KEY=your_api_key
# または
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# オプション
GOOGLE_SHEETS_SHEET_NAME=Sheet1
```

### 2. スプレッドシートの共有設定を確認

**APIキーを使用する場合:**
- スプレッドシートが「リンクを知っている全員」に公開されているか確認

**サービスアカウントを使用する場合:**
- スプレッドシートにサービスアカウントのメールアドレスが共有されているか確認
- 権限が「閲覧者」以上になっているか確認

### 3. 動作確認

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開いて、データが表示されることを確認してください。

---

## よくある質問

### Q: スプレッドシートIDはどこで確認できますか？

**A:** GoogleスプレッドシートのURLから取得できます：
```
https://docs.google.com/spreadsheets/d/[ここがID]/edit
```

### Q: APIキーとサービスアカウント、どちらを使えばいい？

**A:** 
- **APIキー:** スプレッドシートを公開しても問題ない場合（簡単）
- **サービスアカウント:** スプレッドシートを非公開にしたい場合（推奨・セキュア）

### Q: シート名を変更した場合は？

**A:** 環境変数 `GOOGLE_SHEETS_SHEET_NAME` に変更後のシート名を設定してください。

### Q: 複数のシートがある場合は？

**A:** 現在の実装では1つのシートのみ対応しています。複数のシートを使用する場合は、それぞれ別のスプレッドシートとして設定するか、コードを拡張する必要があります。

---

## まとめ

**スプレッドシートの設定に必要なのは3項目のみ:**

1. ✅ **スプレッドシートID**（必須）
2. ✅ **認証情報**（必須・APIキー or サービスアカウント）
3. ⚠️ **シート名**（オプション・デフォルト: Sheet1）

ベースURLはスプレッドシートの設定とは無関係です。

