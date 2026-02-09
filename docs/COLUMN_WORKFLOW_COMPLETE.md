# コラム自動生成ワークフロー（完全版）実装ガイド

## 概要

このドキュメントは、コラム自動生成ワークフローの完全版実装について説明します。
残フェーズA（コラムテーマ自動生成）とB（画像生成）を実装したワークフローです。

## 実装済み機能

### A. コラムテーマ自動生成機能

未使用テーマが0件の場合、自動的に新しいテーマを生成します。

#### ワークフロー構造

1. **GetUnusedThemes** - 未使用テーマを取得
2. **CheckUnusedThemes** (IFノード) - 未使用テーマ数が0件かチェック
   - `true` (0件以上): 通常のコラム生成フローへ
   - `false` (0件): テーマ生成フローへ
3. **GetAllThemes** - 既存の全テーマを取得（重複チェック用）
4. **BuildThemePrompt** - テーマ生成プロンプトを構築
   - 既存テーマの最大Noを取得
   - 開始No = 最大No + 1
   - 生成数: 50件
   - レベル配分: 初心者向け10件／中級者以上向け20件／上級者向け10件／超ポイ活特化10件
5. **GenerateThemes** (Gemini) - 新しいテーマを生成
6. **ParseThemes** - CSV形式のレスポンスをパース
7. **AppendThemes** - スプレッドシートに追加
8. **GetUnusedThemes** (再実行) - 生成後、再度未使用テーマを取得

#### プロンプト仕様

提供されたプロンプトをベースに、以下の点を実装：
- 既存テーマとの重複チェック
- レベル別の配分指定
- CSV形式での出力

### B. 画像生成機能

Gemini 3.0 (nanobananapro) を使用して画像を生成し、コラムに追加します。

#### 実装内容

1. **サムネイル画像生成**
   - **ExtractImageMarkers** - 記事内の[IMAGE: description]マーカーを抽出
   - **GenerateThumbnail** (Gemini 3.0) - サムネイル画像を生成
   - **ProcessThumbnail** - 画像データを処理
   - **UploadThumbnail** - `/api/admin/upload`にアップロード
   - **PrepareColumnData** - サムネイルURLをコラムデータに追加

2. **記事内画像生成** (未実装 - 要追加)

#### 注意事項

⚠️ **Gemini 3.0の画像生成APIについて**

現在の実装は仮実装です。以下の点を確認・調整する必要があります：

1. **API仕様の確認**
   - Gemini 3.0 (nanobananapro) の画像生成APIの実際のレスポンス形式
   - n8nのGeminiノードで画像生成がサポートされているか
   - 画像生成用のモデルID（`models/gemini-2.0-flash-exp`は仮）

2. **画像データの処理**
   - 現在は`inlineData.data`形式を想定していますが、実際のAPIレスポンスに合わせて調整が必要
   - base64エンコードされた画像データの処理方法

3. **アップロード処理**
   - `/api/admin/upload`は`multipart/form-data`形式を期待
   - base64データをBlob/File形式に変換する必要がある可能性

## 追加実装が必要な項目

### 1. 記事内画像の生成と挿入

現在、サムネイル画像のみ実装されています。記事内の`[IMAGE: description]`マーカーに対応する画像生成と挿入が必要です。

#### 実装方針

```javascript
// ExtractImageMarkersで抽出したimageMarkersをループ処理
for (const marker of imageMarkers) {
  // 1. 画像生成プロンプトを構築
  const imagePrompt = `記事の内容に基づいて、以下の説明に合う画像を生成してください: ${marker.description}`;
  
  // 2. Gemini 3.0で画像生成
  // 3. 画像をアップロード
  // 4. content_markdown内の[IMAGE: description]を<img>タグに置換
}
```

### 2. Gemini 3.0画像生成APIの実装確認

n8nでGemini 3.0の画像生成を使用する場合、以下のいずれかの方法が必要です：

- **方法1**: n8nのGeminiノードが画像生成をサポートしている場合
  - ノード設定で画像生成モードを選択
  - レスポンス形式を確認して処理

- **方法2**: HTTP Requestノードで直接Gemini APIを呼び出す
  - `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`
  - APIキーを使用した認証
  - 画像生成用のプロンプトを送信

### 3. 画像アップロード処理の改善

現在の`UploadThumbnail`ノードは不完全です。以下の改善が必要：

```javascript
// base64データをBlobに変換
const base64Data = $json.thumbnailImageData;
const binaryData = Buffer.from(base64Data, 'base64');

// multipart/form-data形式で送信
// n8nのHTTP Requestノードでファイルアップロード機能を使用
```

## ワークフローの使用方法

1. n8nにワークフローをインポート
2. 認証情報を設定：
   - Google Sheets API (Service Account)
   - Gemini API
   - HTTP Header Auth (TokuSearch API)
3. Gemini 3.0の画像生成機能を確認・実装
4. 画像アップロード処理を調整
5. テスト実行

## その他の改善提案

### C. コラム内容の自動生成と編集支援

- **コラム本文の自動生成**: 既に実装済み（GenerateArticle）
- **編集支援ツール**: 文法チェック、スタイルガイド適合性チェックを追加可能

### D. SEO最適化の自動化

- **キーワード提案**: 記事生成時にSEOキーワードを自動提案
- **メタデータ生成**: タイトルタグ、メタディスクリプション、ALTテキストの自動生成

### E. ユーザーエンゲージメントの向上

- **関連コンテンツ推薦**: 既存コラムとの関連性を分析して推薦
- **インタラクティブ要素**: クイズやアンケートの自動生成

## トラブルシューティング

### テーマ生成が失敗する場合

- 既存テーマの取得に失敗していないか確認
- Gemini APIのレスポンス形式がCSVになっているか確認
- スプレッドシートへの書き込み権限を確認

### 画像生成が失敗する場合

- Gemini 3.0の画像生成APIが利用可能か確認
- n8nのGeminiノードで画像生成がサポートされているか確認
- 画像アップロードAPIの認証を確認

## 参考資料

- [コラム自動生成ワークフロー（画像なし版）](../コラム自動生成（画像なし版）.json)
- [コラム自動生成ワークフロー（完全版）](../コラム自動生成（完全版）.json)
- [コラムAPI仕様](../app/api/admin/columns/route.ts)
- [画像アップロードAPI仕様](../app/api/admin/upload/route.ts)



