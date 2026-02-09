# 🚀 TokuSearch 管理画面セットアップガイド

WordPress風の管理画面を使い始めるための手順です。

---

## ✅ ステップ1: 環境変数を追加

`.env.local`ファイルに以下を追加してください：

```bash
# NextAuth.js設定
NEXTAUTH_SECRET=ランダムな文字列（32文字以上）
NEXTAUTH_URL=http://localhost:3000
```

### NEXTAUTH_SECRETの生成方法

以下のコマンドでランダムな文字列を生成できます：

**Windowsの場合（PowerShell）:**
```powershell
[Convert]::ToBase64String((1..32|%{Get-Random -Maximum 256}))
```

**macOS/Linuxの場合:**
```bash
openssl rand -base64 32
```

---

## ✅ ステップ2: Google Sheetsにシートを作成

```bash
node scripts/create-admin-sheets.js
```

**実行結果:**
```
🔧 管理画面用シートを作成します...
✅ columnsシートを作成しました
✅ admin_usersシートを作成しました
🎉 シート作成が完了しました！
```

---

## ✅ ステップ3: 初期管理者を作成

```bash
node scripts/create-default-admin.js
```

**デフォルトのログイン情報:**
- **ユーザー名**: `admin`
- **パスワード**: `admin123`

⚠️ **セキュリティのため、初回ログイン後に必ずパスワードを変更してください！**

**実行結果:**
```
👤 デフォルト管理者アカウントを作成します
✅ デフォルト管理者アカウントを作成しました！
--- ログイン情報 ---
URL: http://localhost:3000/login
ユーザー名: admin
パスワード: admin123
```

---

## ✅ ステップ4: 開発サーバーを起動

```bash
npm run dev
```

---

## ✅ ステップ5: 管理画面にログイン

1. ブラウザで `http://localhost:3000/login` にアクセス
2. ユーザー名: `admin` / パスワード: `admin123` でログイン
3. ログイン成功！ダッシュボードが表示されます

---

## 📚 管理画面の機能

### 1. ダッシュボード (`/admin/dashboard`)
- コラム・お得情報の統計
- 最近の活動一覧

### 2. コラム管理 (`/admin/columns`)
- コラムの作成・編集・削除
- マークダウンまたはリッチテキストエディタ
- 画像アップロード
- カテゴリ・タグ管理

### 3. お得情報管理 (`/admin/deals`)
- n8nで自動収集されたお得情報の閲覧
- ステータス変更（準備中）

---

## 🎨 公開側のコラムページ

管理画面でコラムを公開すると、以下のページで表示されます：

- **コラム一覧**: `http://localhost:3000/columns`
- **コラム詳細**: `http://localhost:3000/columns/[slug]`

---

## 📖 詳細なガイド

詳しい使い方は `docs/ADMIN_GUIDE.md` を参照してください。

---

## 🐛 トラブルシューティング

### ログインできない

1. `.env.local`に`NEXTAUTH_SECRET`が設定されているか確認
2. 初期管理者が作成されているか確認（`node scripts/create-default-admin.js`）
3. 開発サーバーを再起動（`npm run dev`）

### シートが作成されない

1. `.env.local`の`GOOGLE_SERVICE_ACCOUNT_KEY`が正しいか確認
2. Google Sheetsのスプレッドシートが存在するか確認
3. サービスアカウントに編集権限があるか確認

### 画像がアップロードできない

1. `public/columns/images/`ディレクトリが存在するか確認
2. ファイルサイズが5MB以下か確認
3. 画像ファイル形式か確認（PNG, JPG, GIF）

---

## 🎉 完了！

管理画面のセットアップが完了しました。
コラムを作成して、TokuSearchをより充実させましょう！

© 2025 TokuSearch. All rights reserved.

