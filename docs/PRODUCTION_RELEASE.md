# 本番リリース手順

## 実装完了内容

以下の機能を実装しました：

1. **カード型レイアウト対応**
   - Markdownパーサーの導入（react-markdown）
   - カード型レイアウト用CSS追加
   - レスポンシブ対応（PC/スマホ）

2. **共有機能の修正**
   - ShareButtonコンポーネントの汎用化
   - パスタイプ対応（deals/columns）
   - URLエンコード追加

## 本番リリース手順

### 方法1: Vercel CLIでデプロイ（推奨）

```powershell
# Vercel CLIがインストールされていない場合
npm install -g vercel

# Vercelにログイン
vercel login

# 本番環境にデプロイ
vercel --prod
```

### 方法2: GitHub経由で自動デプロイ

1. **Gitリポジトリを初期化（初回のみ）**
   ```powershell
   git init
   git add .
   git commit -m "カード型レイアウト対応と共有機能修正"
   ```

2. **GitHubリポジトリにプッシュ**
   ```powershell
   git remote add origin https://github.com/YOUR_USERNAME/tokusearch.git
   git branch -M main
   git push -u origin main
   ```

3. **Vercelダッシュボードで自動デプロイ**
   - GitHubリポジトリを接続済みの場合、自動的にデプロイが開始されます

### 方法3: Vercelダッシュボードから手動デプロイ

1. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
2. プロジェクトを選択
3. 「Deployments」タブで「Redeploy」をクリック

## デプロイ後の確認事項

- [ ] カード型レイアウトが正しく表示される
- [ ] 共有機能が正しく動作する（deals/columnsの両方）
- [ ] スマホ表示で横スクロールが不要である
- [ ] Markdownが正しくレンダリングされる

## トラブルシューティング

### ビルドエラーが発生する場合

```powershell
# 依存関係を再インストール
Remove-Item -Recurse -Force node_modules
npm install
```

### 環境変数が設定されていない場合

Vercelダッシュボードで以下を確認：
- Settings → Environment Variables
- 必要な環境変数が設定されているか確認
- 設定後、再デプロイを実行

## 変更ファイル

- `app/deals/[id]/page.tsx` - Markdownパーサー導入
- `app/columns/[slug]/page.tsx` - ShareButton修正
- `components/ShareButton.tsx` - 汎用化とパスタイプ対応
- `app/globals.css` - カード型レイアウト用CSS追加



