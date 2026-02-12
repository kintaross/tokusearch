# Google OAuth クライアント設定手順書

TokuSearch の「ログイン（Google）」機能で使う OAuth 2.0 クライアントを、Google Cloud Console で作成・設定する手順です。

---

## 前提

- Google アカウントがあること
- ブラウザで [Google Cloud Console](https://console.cloud.google.com/) にアクセスできること

---

## 手順 1: プロジェクトを選ぶ（または作る）

1. [Google Cloud Console](https://console.cloud.google.com/) を開く
2. 画面上部の**プロジェクト名**（「マイファーストプロジェクト」など）をクリック
3. 表示された一覧から、TokuSearch 用のプロジェクトを選択する  
   - まだなければ **「新しいプロジェクト」** をクリック
   - **プロジェクト名**（例: `TokuSearch`）を入力
   - **作成** をクリックし、作成後にそのプロジェクトを選択

---

## 手順 2: OAuth 同意画面を設定する

OAuth クライアントを作る前に、「このアプリが Google にログインします」という同意画面の設定が必要です。

1. 左メニューで **「API とサービス」** → **「OAuth 同意画面」** を開く  
   （または画面上部の検索で「OAuth 同意画面」と検索）
2. **ユーザータイプ** で次を選ぶ:
   - **外部** … どの Google アカウントでもログイン可能（一般向け）
   - **内部** … 同じ組織の Google アカウントのみ（Google Workspace のみ）
3. **作成** をクリック
4. **OAuth 同意画面** の入力:
   - **アプリ名**: 例 `TokuSearch`
   - **ユーザーサポートメール**: 自分のメールを選択
   - **デベロッパーの連絡先情報**: 自分のメールを入力
5. **保存して次へ** をクリック
6. **スコープ** はそのまま **保存して次へ**
7. **テストユーザー**（「外部」を選んだ場合）:
   - 公開前に「テスト」状態のときは、ここに追加したメールだけがログイン可能
   - 本番で誰でも使う場合は、あとで **「アプリを公開」** にする
8. **保存して次へ** → **ダッシュボードに戻る**

---

## 手順 3: OAuth 2.0 クライアント ID を作成する

1. 左メニューで **「API とサービス」** → **「認証情報」** を開く
2. 画面上部の **「+ 認証情報を作成」** をクリック
3. **「OAuth クライアント ID」** を選択
4. **アプリケーションの種類** で **「ウェブアプリケーション」** を選ぶ
5. **名前** に例: `TokuSearch Web` と入力（識別用で任意）

---

## 手順 4: リダイレクト URI を追加する

同じ画面の **「承認済みのリダイレクト URI」** で、**「+ URI を追加」** を押して以下を 1 件ずつ追加する。

| 環境   | リダイレクト URI |
|--------|------------------|
| ローカル開発 | `http://localhost:3000/api/auth/callback/google` |
| 本番（Vercel など） | `https://あなたのドメイン/api/auth/callback/google` |

例:

- 開発のみ:  
  `http://localhost:3000/api/auth/callback/google`
- 本番が `https://tokusearch.vercel.app` の場合:  
  `https://tokusearch.vercel.app/api/auth/callback/google`
- 開発と本番両方使う場合は、上 2 つを両方追加する

**注意**:  
- `http` / `https`、末尾の `/` の有無、ポート番号を間違えないこと  
- 本番ドメインは実際の URL に置き換えること

---

## 手順 5: 作成して ID とシークレットを控える

1. **作成** をクリック
2. ポップアップに **クライアント ID** と **クライアント シークレット** が表示される
3. **クライアント ID**  
   - 形式例: `123456789012-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`  
   - これをコピーして控える → のちに **`GOOGLE_CLIENT_ID`** に設定
4. **クライアント シークレット**  
   - 形式例: `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx`  
   - これをコピーして控える → のちに **`GOOGLE_CLIENT_SECRET`** に設定
5. **OK** で閉じる  
   - シークレットは一覧では「●●●●」と隠れます。再表示は **認証情報** 一覧の対象クライアントの編集から可能です。

---

## 手順 6: 環境変数に設定する

### ローカル（.env.local）

`.env.local` に次を追加（値は手順 5 で控えたものに置き換え）:

```env
GOOGLE_CLIENT_ID=123456789012-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
```

本番で使う場合は:

```env
NEXTAUTH_URL=https://あなたのドメイン
```

### Vercel（本番）

1. Vercel ダッシュボード → 対象プロジェクト → **Settings** → **Environment Variables**
2. 次を追加:
   - **Name**: `GOOGLE_CLIENT_ID` / **Value**: クライアント ID
   - **Name**: `GOOGLE_CLIENT_SECRET` / **Value**: クライアント シークレット
   - 未設定なら **Name**: `NEXTAUTH_URL` / **Value**: `https://あなたのドメイン`
3. 適用する環境（Production / Preview / Development）を選んで保存
4. 設定を反映するために **再デプロイ** する

---

## 手順 7: 動作確認

1. アプリを起動（ローカルなら `npm run dev`）
2. トップページの **「ログイン（Google）」** をクリック
3. Google のログイン画面に遷移し、アカウント選択・許可後にアプリのトップに戻ること
4. ヘッダーに **「マイページ」「ログアウト」** が表示されれば成功

---

## よくあるトラブル

| 現象 | 確認すること |
|------|----------------|
| 「リダイレクト URI が無効です」 | 手順 4 の URI が、ブラウザのアドレスバー（開発なら `http://localhost:3000`、本番なら `https://...`）と一致しているか確認。`/api/auth/callback/google` まで含める。 |
| 「アクセスブロック: このアプリは確認されていません」 | OAuth 同意画面で「外部」を選んだ場合、公開前は「テスト」状態。手順 2 の「テストユーザー」に自分のメールを追加するか、必要なら「アプリを公開」する。 |
| ログインボタンを押しても反応しない | ブラウザのコンソールやネットワークタブでエラーを確認。`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` が正しく設定されているか、再デプロイしたか確認。 |

---

## 参照

- 一般ユーザー認証の全体像: [ENDUSER_AUTH_SETUP.md](ENDUSER_AUTH_SETUP.md)
- Google の公式ドキュメント: [OAuth 2.0 の設定](https://support.google.com/cloud/answer/6158849)
