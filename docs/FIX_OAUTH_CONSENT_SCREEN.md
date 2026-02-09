# 🔧 OAuth同意画面の設定を修正する方法

## 問題

認証画面に「n8n」が表示される場合、Google Cloud ConsoleのOAuth同意画面の設定で「n8n」という名前が設定されています。

## 解決方法

### ステップ1: OAuth同意画面を開く

1. **Google Cloud Consoleにアクセス**
   - https://console.cloud.google.com/apis/credentials/consent?project=reverberant-kit-475103-q0

2. **OAuth同意画面の設定を確認**
   - 「アプリ名」が「n8n」になっている場合は、これを「TokuSearch」に変更

### ステップ2: アプリ名を変更

1. **「編集」ボタンをクリック**
2. **「アプリ名」を「TokuSearch」に変更**
3. **「保存して次へ」をクリック**
4. **「ダッシュボードに戻る」をクリック**

### ステップ3: 確認

認証URLを再度開いて、認証画面に「TokuSearch」が表示されることを確認してください。

## 注意事項

- OAuth同意画面の設定は、プロジェクト全体に適用されます
- 複数のOAuth 2.0クライアントIDがある場合、すべて同じアプリ名が使用されます
- アプリ名を変更すると、次回の認証時から新しい名前が表示されます



