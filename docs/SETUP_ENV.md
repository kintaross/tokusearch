# 環境変数セットアップガイド

`.env.local` ファイルを作成する方法を説明します。

## 方法1: 対話形式セットアップ（推奨）

```bash
node scripts/setup-env.js
```

対話形式で以下を入力します：
- スプレッドシートID
- 認証方法（APIキー or サービスアカウント）
- JSONファイルのパス（サービスアカウントの場合）

## 方法2: コマンドライン引数で直接指定（簡単）

```bash
node scripts/setup-env-simple.js <スプレッドシートID> <JSONファイルパス>
```

**例:**
```bash
node scripts/setup-env-simple.js 1a2b3c4d5e6f7g8h9i0j "C:\Users\username\Downloads\service-account-key.json"
```

**注意:** JSONファイルのパスは引用符で囲む必要がある場合があります。

## JSONファイルのパス指定方法

### Windowsの場合

**絶対パス:**
```
C:\Users\username\Downloads\service-account-key.json
```

**相対パス:**
```
..\Downloads\service-account-key.json
```

**ドラッグ&ドロップ:**
- エクスプローラーからファイルをドラッグ&ドロップすると、自動的にパスが入力されます
- 引用符が自動的に追加される場合がありますが、スクリプトが自動的に処理します

### よくある問題と解決方法

#### 1. ファイルが見つからない

**原因:** パスが正しくない、またはファイルが存在しない

**解決方法:**
- ファイルパスを確認（エクスプローラーで右クリック → パスのコピー）
- 相対パスの場合は、プロジェクトルートからの相対パスを指定

#### 2. JSONの形式エラー

**原因:** JSONファイルが破損している、または形式が正しくない

**解決方法:**
- JSONファイルをテキストエディタで開いて確認
- 必須フィールドが含まれているか確認:
  - `type`: "service_account"
  - `project_id`
  - `private_key`
  - `client_email`

#### 3. PowerShellの実行ポリシーエラー

**原因:** PowerShellのセキュリティ設定

**解決方法:**
- `npm run` の代わりに `node` コマンドを直接使用:
  ```bash
  node scripts/setup-env.js
  ```

## 手動で作成する場合

`.env.local` ファイルを手動で作成する場合:

```env
# Google Sheets設定
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id

# サービスアカウント（プライベートスプレッドシート用）
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

**重要:** `GOOGLE_SERVICE_ACCOUNT_KEY` の値は、JSONファイルの内容を1行の文字列として設定してください。改行は `\n` でエスケープされます。

## 動作確認

セットアップ後、以下で動作確認:

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開いて、データが表示されることを確認してください。

エラーが発生する場合は、ブラウザのコンソールとサーバーのログを確認してください。

