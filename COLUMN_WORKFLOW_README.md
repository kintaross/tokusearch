# コラム自動生成システム - n8nワークフロー

**バージョン**: 1.0  
**作成日**: 2025-11-27  
**ステータス**: 本番環境対応

---

## 🎯 概要

Gemini APIを使用して記事と画像を自動生成し、TokuSearchに投稿する完全自動化システムです。

### 主な機能

✅ **記事自動生成** - Gemini 2.0 Flash APIで高品質な記事を生成  
✅ **画像自動生成** - Gemini Imagen APIで記事に合った画像を生成  
✅ **自動投稿** - TokuSearch APIに記事と画像を自動投稿  
✅ **テーマ管理** - Google Sheetsで200件のテーマを管理  
✅ **完全無料** - 既存のGemini無料枠内で運用可能  
✅ **スケジュール実行** - 毎日指定時刻に自動実行

---

## 📦 ファイル一覧

```
tokuSearch/
├── column-auto-generation-workflow.json    # n8nワークフロー定義
├── COLUMN_WORKFLOW_README.md               # このファイル
└── docs/
    ├── COLUMN_AUTO_GENERATION.md           # 仕様書（元ドキュメント）
    ├── COLUMN_WORKFLOW_SETUP.md            # セットアップガイド
    └── N8N_CREDENTIALS_SETUP.md            # 認証情報設定ガイド
```

---

## 🚀 クイックスタート

### 前提条件

- [ ] n8nアカウント（クラウド版 or セルフホスト）
- [ ] Google Sheets（`column_themes`シート作成済み）
- [ ] Gemini API Key（Google AI Studio）
- [ ] TokuSearch本番環境（デプロイ済み）

### 5分でセットアップ

#### ステップ1: ワークフローをインポート

```bash
# n8nダッシュボードで
1. 「+」→ 「Import from File」
2. column-auto-generation-workflow.json を選択
3. インポート完了
```

#### ステップ2: 認証情報を設定

詳細は [`docs/N8N_CREDENTIALS_SETUP.md`](docs/N8N_CREDENTIALS_SETUP.md) を参照してください。

**必要な認証情報**:
1. Google Service Account（既存）
2. Gemini API（既存）
3. Gemini Header Auth（新規作成）
4. N8N API Key（新規作成）

**N8N API Keyの生成**:
```powershell
# PowerShellで実行
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**環境変数に追加**:
```env
# .env.local と Vercel に追加
N8N_API_KEY=<N8N_API_KEY>
```

#### ステップ3: テスト実行

```bash
# n8nで
1. 「毎日9時トリガー」ノードを右クリック
2. 「Execute Node」をクリック
3. 各ノードの出力を確認
```

#### ステップ4: スケジュール有効化

```bash
# n8nで
1. ワークフローを「Active」に変更（右上のトグル）
2. 毎日9時に自動実行されます
```

---

## 🔧 ワークフロー構造

```
┌─────────────────────────────────────────────────────────────────┐
│                    コラム自動生成ワークフロー                       │
└─────────────────────────────────────────────────────────────────┘

1. 📅 Schedule Trigger
   └─> 毎日9時に実行（Cron: 0 9 * * *）
        │
2. 📊 Google Sheets: Read
   └─> column_themesから未使用テーマ取得（used=FALSE）
        │
3. 🎲 Code: ランダム選択
   └─> 1件のテーマをランダムに選択
        │
4. 📝 Code: 記事生成プロンプト作成
   └─> Gemini用のプロンプトを構築
        │
5. 🤖 HTTP: Gemini API（記事生成）
   └─> Gemini 2.0 Flash で記事を生成
        │
6. 🔍 Code: JSON解析
   └─> 記事データを抽出（title, content, description等）
        │
7. 🖼️ Code: 画像生成プロンプト作成
   └─> Gemini Imagen用のプロンプトを構築
        │
8. 🎨 HTTP: Gemini Imagen API（画像生成）
   └─> 日本語プロンプトで画像を生成
        │
9. 📦 Convert to File
   └─> Base64 → ファイル変換
        │
9.5 📤 Extract from File
   └─> ファイル → Base64変換（アップロード用）
        │
10. ☁️ HTTP: TokuSearch Upload API
   └─> 画像をGoogle Cloud Storageにアップロード
        │
11. 📄 Code: 投稿データ準備
   └─> TokuSearch投稿用にデータを整形
        │
12. 🚀 HTTP: TokuSearch Column API
   └─> 記事をTokuSearchに投稿
        │
13. ✅ Google Sheets: Update
   └─> テーマを使用済み（used=TRUE）に更新
        │
14. 🔔 Code: 完了通知メッセージ作成
   └─> 実行結果を通知（Slack連携可能）
```

---

## 📊 各ノードの詳細

| # | ノード名 | タイプ | 説明 |
|---|---------|--------|------|
| 1 | 毎日9時トリガー | Schedule Trigger | 毎日9時に自動実行 |
| 2 | 未使用テーマ取得 | Google Sheets | used=FALSEのテーマを取得 |
| 3 | ランダムテーマ選択 | Code | 1件をランダムに選択 |
| 4 | 記事生成プロンプト作成 | Code | Gemini用プロンプト構築 |
| 5 | Gemini記事生成 | HTTP Request | 記事生成API呼び出し |
| 6 | 記事JSON解析 | Code | JSON抽出・解析 |
| 7 | 画像生成プロンプト作成 | Code | Imagen用プロンプト構築 |
| 8 | Gemini画像生成 | HTTP Request | 画像生成API呼び出し |
| 9 | Base64→ファイル変換 | Convert to File | Base64をファイルに変換 |
| 9.5 | ファイル→Base64変換 | Extract from File | アップロード用に再変換 |
| 10 | 画像アップロード | HTTP Request | TokuSearchに画像アップロード |
| 11 | 投稿データ準備 | Code | 投稿用データ整形 |
| 12 | コラム投稿 | HTTP Request | TokuSearchに記事投稿 |
| 13 | テーマ使用済み更新 | Google Sheets | used=TRUEに更新 |
| 14 | 完了通知メッセージ作成 | Code | 通知メッセージ作成 |

---

## 💰 コスト

### 完全無料で運用可能！

| サービス | 使用量（1記事） | 月間コスト |
|---------|---------------|-----------|
| Gemini API（記事生成） | 1リクエスト | **$0** |
| Gemini Imagen（画像生成） | 1リクエスト | **$0** |
| TokuSearch API | 2リクエスト | **$0** |
| Google Sheets | 2操作 | **$0** |

**無料枠**:
- Gemini API: 1日25リクエスト
- 1記事あたり2リクエスト（記事+画像）
- **最大12記事/日まで無料**

**推奨運用**: 1日1記事（午前9時）

---

## 🎨 生成される記事の品質

### 記事の構成

```markdown
## 導入
読者の悩みを提起し、記事で分かることを明示

## 基本の考え方
前提知識や基本概念を説明

## 具体的なステップ
手順を明確に、実行可能な形で提示

## 注意点・よくある失敗
陥りやすいミスや注意事項

## まとめ
要点の整理と最初の一歩を提示
```

### 文字数
- **2000-3000文字**
- 読みやすく、情報量も十分

### SEO最適化
- タイトル: 魅力的で具体的
- Description: 50-160文字（検索結果に最適）
- タグ: 関連キーワードを適切に設定

### レベル別の書き分け

| レベル | 特徴 |
|--------|------|
| 初心者向け | 用語を丁寧に説明、小さいステップ |
| 中級者以上 | 比較・戦略・効率化重視 |
| 上級者 | 深掘りした分析、高度なテクニック |
| 超ポイ活特化 | マニアック、最新情報、裏技 |

---

## 🖼️ 生成される画像の品質

### スタイル
- **モダンでフラットなイラスト**
- 親しみやすく、明るい雰囲気
- サムネイルとして最適

### カラーパレット
- オレンジ: `#f97316`（TokuSearchのブランドカラー）
- ベージュ: `#fef3e2`
- ブルー、グリーンを基調

### アスペクト比
- **16:9**（横長）
- Webサムネイルに最適

### 含まれる要素
- ポイントカード
- スマートフォン
- コイン、矢印
- 日本らしいデザイン要素

---

## 📋 テーマ管理

### Google Sheets構造

```
column_themes シート

A列: no (番号 1-200)
B列: level (レベル)
C列: theme (テーマタイトル)
D列: used (使用済みフラグ TRUE/FALSE)
E列: used_at (使用日時 ISO 8601)
```

### テーマの例

```
1 | 初心者向け | 楽天ポイントの基本と上手な貯め方 | FALSE |
2 | 初心者向け | dポイント入門：コンビニでムリなく貯めるコツ | FALSE |
3 | 中級者以上向け | ポイント多重取りルート設計の基本パターン集 | FALSE |
```

### テーマのリセット

200件すべて使用済みになった場合:

```javascript
// Google Apps Scriptでリセット
function resetThemes() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('column_themes');
  const lastRow = sheet.getLastRow();
  
  // D列（used）をすべてFALSEに
  sheet.getRange(2, 4, lastRow - 1, 1).setValue(false);
  
  // E列（used_at）をすべて空に
  sheet.getRange(2, 5, lastRow - 1, 1).clearContent();
}
```

---

## 🔍 モニタリング

### 確認項目

- ✅ 毎日正常に記事が生成されているか
- ✅ 画像が正しく表示されているか
- ✅ テーマが重複していないか
- ✅ API制限に達していないか

### ログ確認

#### n8n実行履歴
```
1. ワークフロー画面 → 「Executions」タブ
2. 実行結果を確認（成功/失敗）
3. エラーログの確認
```

#### Vercelログ
```
1. Vercelダッシュボード → 「Logs」
2. API呼び出しの確認
3. エラーログの確認
```

#### Google Sheets
```
1. column_themesシートを開く
2. used=TRUEの件数を確認
3. used_atで最終実行日時を確認
```

#### TokuSearch
```
1. 管理画面 → コラム一覧
2. 新しい記事が追加されているか確認
3. 画像が正しく表示されているか確認
```

---

## 🐛 トラブルシューティング

### よくある問題と解決方法

#### 問題1: Gemini画像生成エラー

**症状**: `HTTP 400/404 エラー`

**対策**:
1. APIエンドポイントURLを確認
2. Google AI Studioで最新のドキュメントを確認
3. リクエストボディの形式を確認

**代替案**: デフォルト画像を使用
```javascript
if ($json.error) {
  return [{ 
    json: { 
      thumbnailUrl: 'https://tokusearch.vercel.app/default-thumbnail.png' 
    } 
  }];
}
```

#### 問題2: 記事JSON解析失敗

**症状**: `記事JSONの解析に失敗しました`

**対策**: Node 6のコードを改善版に置き換え（詳細は`docs/COLUMN_WORKFLOW_SETUP.md`参照）

#### 問題3: API制限超過

**症状**: `429 Too Many Requests`

**対策**:
- 1日の実行回数を1回に制限
- 無料枠: 1日25リクエスト
- 1記事あたり2リクエスト

#### 問題4: 認証エラー

**症状**: `Invalid credentials` / `Unauthorized`

**対策**:
1. 認証情報を再確認（詳細は`docs/N8N_CREDENTIALS_SETUP.md`参照）
2. APIキーを再生成
3. 環境変数を確認（`.env.local` と Vercel）

---

## 🎯 次のステップ

### オプション機能の追加

#### 1. Slack通知
```
完了通知メッセージ作成ノードの後に:
1. Slackノードを追加
2. Webhook URLを設定
3. メッセージ: {{$json.message}}
```

#### 2. エラー通知
```
各HTTPノードに:
1. 「On Error」ブランチを追加
2. エラー時にSlack通知
3. 管理者にメール送信
```

#### 3. テーマ自動生成
```
200件使用済み後:
1. 条件分岐ノードを追加
2. Gemini APIで新テーマ生成
3. Google Sheetsに追加
```

#### 4. A/Bテスト
```
複数のプロンプトパターンを試す:
1. プロンプトのバリエーションを作成
2. ランダムに選択
3. 効果測定（PV、滞在時間など）
```

#### 5. 多言語対応
```
英語版記事の自動生成:
1. 記事生成後に翻訳ノードを追加
2. 別のスラッグで投稿
3. 言語切り替え機能と連携
```

---

## 📚 関連ドキュメント

| ドキュメント | 説明 |
|-------------|------|
| [`docs/COLUMN_AUTO_GENERATION.md`](docs/COLUMN_AUTO_GENERATION.md) | 仕様書（元ドキュメント） |
| [`docs/COLUMN_WORKFLOW_SETUP.md`](docs/COLUMN_WORKFLOW_SETUP.md) | 詳細セットアップガイド |
| [`docs/N8N_CREDENTIALS_SETUP.md`](docs/N8N_CREDENTIALS_SETUP.md) | 認証情報設定ガイド |
| [`docs/ADMIN_GUIDE.md`](docs/ADMIN_GUIDE.md) | TokuSearch管理者ガイド |

---

## 🤝 サポート

### 問い合わせ

- **n8nの使い方**: n8n公式ドキュメント（https://docs.n8n.io/）
- **Gemini API**: Google AI Studio（https://ai.google.dev/）
- **TokuSearch**: 別チャットで質問してください

### よくある質問

**Q: 画像生成APIのエンドポイントが分かりません**  
A: Google AI Studio（https://aistudio.google.com/）で最新のドキュメントを確認してください。

**Q: 記事が生成されません**  
A: n8nの実行履歴を確認し、どのノードでエラーが発生しているか特定してください。

**Q: テーマを追加したい**  
A: Google Sheetsの`column_themes`シートに手動で追加するか、Gemini APIで自動生成してください。

**Q: スケジュール時間を変更したい**  
A: 「毎日9時トリガー」ノードのCron設定を変更してください（例: `0 21 * * *`で21時実行）。

---

## 📜 ライセンス

このワークフローはTokuSearchプロジェクトの一部です。

---

## 🎉 完成！

これで、完全自動化されたコラム生成システムが稼働します。

**運用開始後の流れ**:
1. 毎日9時に自動実行
2. 記事と画像が生成される
3. TokuSearchに自動投稿
4. Google Sheetsのテーマが使用済みに更新
5. 完了通知（オプション）

**質問や問題があれば、別チャットで気軽に聞いてください！**

---

**作成者**: TokuSearch開発チーム  
**最終更新**: 2025-11-27  
**バージョン**: 1.0



