# テーマ自動生成機能 - 設計書

**バージョン**: 1.0  
**最終更新**: 2025-11-27  
**目的**: 200件のテーマリストを使い切った後、自動的に新しいテーマを生成して無限に記事を生成し続ける

---

## 📋 概要

### 基本フロー
```
1. テーマ在庫チェック（used=FALSEの数）
   ↓
2. 在庫あり → 通常フロー（既存テーマ使用）
   ↓
3. 在庫なし → テーマ自動生成
   ↓
4. 新テーマをGoogle Sheetsに追加
   ↓
5. その新テーマで記事生成
```

---

## 🔧 n8nワークフロー拡張

### Node 2.5: テーマ在庫チェック（新規追加）

**Google Sheets: Read の後に追加**

```javascript
// 前のノードでテーマを取得
const unusedThemes = $input.all().map(item => item.json);

if (unusedThemes.length > 0) {
  // 在庫あり → 通常フロー
  return [{ json: { hasThemes: true, themes: unusedThemes } }];
} else {
  // 在庫なし → テーマ生成フロー
  return [{ json: { hasThemes: false } }];
}
```

### IF条件分岐ノード

**条件設定**:
```
IF: {{$json.hasThemes}} === true
  → 通常フロー（Node 3へ）
ELSE:
  → テーマ生成フロー（Node 3.1へ）
```

---

## 🎯 テーマ生成フロー

### Node 3.1: テーマ生成プロンプト作成

```javascript
const prompt = `
【システム指示】
あなたは「TokuSearch」のコンテンツプランナーです。
ポイ活・節約・お得情報に関する記事テーマを10件生成してください。

【出力形式（JSON）】
{
  "themes": [
    {
      "level": "初心者向け",
      "theme": "具体的なテーマタイトル"
    },
    ... (10件)
  ]
}

【テーマ生成ルール】
1. **レベル配分**:
   - 初心者向け: 3件
   - 中級者以上向け: 3件
   - 上級者向け: 2件
   - 超ポイ活特化: 2件

2. **テーマの特徴**:
   - 具体的で実用的
   - 読者が「知りたい」と思う内容
   - 既存の類似テーマと重複しない
   - 20〜40文字程度

3. **ジャンル例**:
   - ポイント活用術（楽天、d、T、マイル）
   - QR決済（PayPay、楽天ペイ、d払い）
   - クレジットカード活用
   - キャンペーン攻略
   - 節約テクニック
   - ふるさと納税
   - 家計管理
   - ウエル活・ポン活
   - 旅行お得術
   - 時短×節約

4. **禁止事項**:
   - 既出テーマの完全コピー
   - 抽象的すぎるテーマ
   - 実行不可能な内容

【重要】
- JSON形式のみ出力
- 必ず10件生成
- 各レベルの配分を守る
`.trim();

return [{ json: { prompt } }];
```

### Node 3.2: Gemini API（テーマ生成）

**HTTPリクエスト設定**:
```
Method: POST
URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent
Authentication: Header Auth
  - Header Name: x-goog-api-key
  - Header Value: {{$env.GOOGLE_GEMINI_API_KEY}}
```

**ボディ**:
```json
{
  "contents": [{
    "parts": [{
      "text": "{{$json.prompt}}"
    }]
  }]
}
```

### Node 3.3: JSON解析（テーマ）

```javascript
// Geminiのレスポンスからテーマを抽出
const response = $json.candidates[0].content.parts[0].text;

// JSONブロックを抽出（```json``` があれば除去）
const jsonMatch = response.match(/\{[\s\S]*\}/);
if (!jsonMatch) {
  throw new Error('テーマ生成に失敗しました');
}

const themesData = JSON.parse(jsonMatch[0]);
const themes = themesData.themes;

// 現在のテーマ番号を取得（最大番号 + 1から開始）
const currentMaxNo = 200; // 初回は200、後で動的に取得

const newThemes = themes.map((t, index) => ({
  no: currentMaxNo + index + 1,
  level: t.level,
  theme: t.theme,
  used: 'FALSE',
  used_at: ''
}));

return [{ json: { newThemes } }];
```

### Node 3.4: Google Sheets（テーマ追加）

**Google Sheets: Append**

設定:
```
Spreadsheet: {{$env.GOOGLE_SHEETS_SPREADSHEET_ID}}
Sheet: column_themes
Range: A:E
```

データマッピング:
```javascript
$json.newThemes.map(t => [t.no, t.level, t.theme, t.used, t.used_at])
```

### Node 3.5: 最初のテーマを選択

```javascript
// 新しく追加したテーマの1件目を使用
const firstTheme = $json.newThemes[0];

return [{ json: firstTheme }];
```

---

## 🔄 改善版ワークフロー全体

```
1. [Schedule Trigger]
   ↓
2. [Google Sheets: Read] - テーマ取得（used=FALSE）
   ↓
2.5 [Code] - テーマ在庫チェック
   ↓
   ┌─[IF] hasThemes === true ?
   │
   ├─YES → 3. [Code] ランダム選択
   │         ↓
   │         (通常の記事生成フローへ)
   │
   └─NO  → 3.1 [Code] テーマ生成プロンプト
            ↓
            3.2 [HTTP] Gemini API（テーマ生成）
            ↓
            3.3 [Code] JSON解析
            ↓
            3.4 [Google Sheets] テーマ追加
            ↓
            3.5 [Code] 最初のテーマ選択
            ↓
            (通常の記事生成フローへ合流)
```

---

## 💡 改善案：段階的な在庫補充

### 推奨: 在庫が10件以下になったら補充

**Node 2.5 の改善版**:

```javascript
const unusedThemes = $input.all().map(item => item.json);
const threshold = 10; // 閾値

if (unusedThemes.length === 0) {
  // 完全に在庫切れ → 10件生成
  return [{ json: { hasThemes: false, generateCount: 10 } }];
} else if (unusedThemes.length < threshold) {
  // 在庫が少ない → 5件生成しつつ既存テーマも使用
  return [{ json: { hasThemes: true, themes: unusedThemes, shouldGenerate: true, generateCount: 5 } }];
} else {
  // 在庫十分 → 通常フロー
  return [{ json: { hasThemes: true, themes: unusedThemes, shouldGenerate: false } }];
}
```

### メリット
- ✅ 完全に在庫切れになる前に補充
- ✅ 1回のワークフロー実行時間を短縮
- ✅ スムーズな運用

---

## 📊 テーマ生成のバリエーション

### レベル別テーマ例

**初心者向け**:
- "○○の基本と始め方"
- "初めての○○で失敗しないコツ"
- "○○をゼロから理解する入門"

**中級者以上向け**:
- "○○の最適化戦略"
- "○○を組み合わせた多重取り術"
- "○○のリアル試算とシミュレーション"

**上級者向け**:
- "○○を自動化する仕組み作り"
- "○○の分析とデータ活用"
- "○○を極めるロードマップ"

**超ポイ活特化**:
- "○○で1ポイントもムダにしない方法"
- "○○の裏ワザと上限攻略"
- "○○を時給換算で評価する思考法"

---

## ⚠️ 注意事項

### 1. テーマの重複チェック

現在の実装では重複チェックがありません。将来的には：

```javascript
// 既存テーマを取得してチェック
const existingThemes = await fetchAllThemes();
const newTheme = generateTheme();

// タイトルの類似度チェック（簡易版）
const isDuplicate = existingThemes.some(t => 
  t.theme.includes(newTheme.theme.substring(0, 10))
);

if (isDuplicate) {
  // 再生成
}
```

### 2. テーマ品質の維持

- 定期的に生成されたテーマをレビュー
- 低品質なテーマは手動で削除
- プロンプトを改善

### 3. コスト管理

- テーマ生成: 1回のAPI呼び出し（10件生成）
- 記事生成: 1回のAPI呼び出し
- 画像生成: 1回のAPI呼び出し
- **合計**: 3回/記事（無料枠内）

---

## 🚀 実装手順

### Step 1: 既存の200件をインポート
```bash
node scripts/import-themes.js
```

### Step 2: n8nワークフローにテーマ生成機能を追加
- Node 2.5: テーマ在庫チェック
- IF条件分岐
- Node 3.1-3.5: テーマ生成フロー

### Step 3: テスト実行
1. 手動でテーマを全て `used=TRUE` に変更
2. n8nワークフローを実行
3. 新しいテーマが10件生成されることを確認
4. そのテーマで記事が生成されることを確認

### Step 4: 本番運用
- 在庫閾値を10件に設定
- 毎日1記事生成
- 月次でテーマ品質をレビュー

---

## 📈 期待される効果

### 短期（1-3ヶ月）
- 200記事の自動生成完了
- コンテンツの自動更新

### 中期（3-6ヶ月）
- 300記事達成
- SEO効果の向上

### 長期（6ヶ月以降）
- 無限にコンテンツ生成
- 完全自動運用
- ドメインオーソリティの向上

---

**作成者**: TokuSearch開発チーム  
**サポート**: テーマ生成の品質が低い場合はプロンプトを調整してください



