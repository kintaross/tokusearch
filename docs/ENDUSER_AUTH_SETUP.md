# 一般ユーザー認証（Googleログイン）セットアップ

一般ユーザーが Google でログインし、お気に入り・保存・メモ・損益を端末間で同期する機能を有効にする手順です。

## 必要な環境変数

| 変数名 | 説明 |
|--------|------|
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 のクライアントID（NextAuth Google Provider 用） |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 のクライアントシークレット |
| `DATABASE_URL` | PostgreSQL 接続URL（`users` 等の個人データ用テーブルが作成されていること） |
| `NEXTAUTH_SECRET` | NextAuth の署名用シークレット（既存の管理画面認証と同じ） |
| `NEXTAUTH_URL` | 本番の場合は `https://あなたのドメイン` |

**注意**: `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` は、Google Drive 用の `GOOGLE_DRIVE_CLIENT_*` とは別です。

## Google OAuth クライアントの設定

クライアント ID とシークレットの作成手順は、別ドキュメントにまとめています。

- **[Google OAuth クライアント設定手順書](GOOGLE_OAUTH_CLIENT_SETUP.md)** … プロジェクト作成・OAuth 同意画面・リダイレクト URI・環境変数まで順を追って記載

## データベース

個人データ用テーブル（`users`, `user_favorites`, `user_saved_deals`, `user_deal_notes`, `user_saved_searches`, `user_deal_transactions`）は `scripts/db/schema.sql` に含まれています。

初回またはスキーマ更新後は以下で適用してください:

```bash
# DATABASE_URL を設定したうえで
npx ts-node scripts/db/apply-schema.ts
```

## 動作確認

1. トップページのヘッダーに「ログイン（Google）」が表示されること。
2. クリック後、Google の認証画面に遷移し、ログイン完了でトップに戻ること。
3. ログイン後は「マイページ」「ログアウト」が表示され、`/account` でお気に入り・保存・損益サマリを確認できること。
4. 管理画面（`/login` の ID/パスワード）は従来どおり利用でき、メンテナンスモード時の裏口は管理者・編集者のみ有効であること。

## メンテナンスモード

`MAINTENANCE_MODE=1` のとき、一般ユーザーが Google でログインしていてもサイトはメンテ表示のままです。`/admin` から ID/パスワードでログインした管理者・編集者のみ全ページにアクセスできます。
