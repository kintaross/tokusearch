# n8n LLMタグ付けノード実装ガイド

## 概要

このドキュメントは、n8nワークフローに追加する「LLMタグ付けノード」の実装仕様を定義します。

---

## ノード配置

### 挿入位置
`UnpackGeminiResults`ノードの**後**、`TransformForTokuSearch`ノードの**前**に挿入

### ワークフロー全体図
```
GeneratePrompt 
  ↓
CallGrokAI 
  ↓
ParseGrokResponse 
  ↓
MergeInputs ← FilterRecentHistory ← GetSentHistory
  ↓
FilterByID
  ↓
WrapItemsAsArray
  ↓
BuildGeminiPrompt
  ↓
Message a model (Gemini) ← 重複チェック用
  ↓
UnpackGeminiResults
  ↓
★ BuildLLMTaggingPrompt (新規追加)
  ↓
★ CallGeminiForTagging (新規追加)
  ↓
★ ParseTaggingResults (新規追加)
  ↓
TransformForTokuSearch
  ↓
SaveToHistory / BuildSlackMessage → SlackNotify
```

---

## ノード1: BuildLLMTaggingPrompt

### タイプ
`n8n-nodes-base.set` (Set node)

### 目的
全案件をまとめてLLMに渡すためのプロンプトを構築

### 設定
```javascript
// assignments.assignments[0].value (JavaScript式)
{{(() => {
  const items = $input.all().map(item => item.json);
  
  // LLMに渡す簡略化データ（コスト削減のため必要情報のみ）
  const simplifiedItems = items.map((item, index) => ({
    index: index,
    title: item.title || '',
    summary: item.summary || '',
    detail: (item.detail || '').substring(0, 300), // 最初の300文字のみ
    steps: item.steps || '',
    service: item.service || '',
    conditions: item.conditions || '',
    category_main: item.category_main || ''
  }));
  
  const prompt = `
以下のお得情報に対して、各案件ごとに以下の情報を判定してください。

# 判定項目

1. difficulty: 案件の難易度
   - low: エントリー＋支払い程度（会員登録が1サービス内で完結）
   - medium: 条件が2〜3個ある、2サービス連携など
   - high: 銀行口座・証券口座・クレカ・保険などの新規開設が必要

2. area_type: 利用チャネル
   - online: 申込〜利用がオンライン完結
   - store: 実店舗での購入・利用がメイン
   - online+store: 決済手段・ポイントなど、どちらでも利用可能

3. target_user_type: 対象ユーザー種別
   - all: 誰でも利用可能
   - new_or_inactive: 新規・休眠ユーザー限定（「初めて」「新規」「利用なし」「久しぶり」等）
   - limited: 特定プラン・家族・学生など限定

4. usage_type: 主な用途
   - daily_goods: ドラッグストア・日用品・日常消費
   - eating_out: グルメ・外食
   - travel: 旅行・交通・レジャー
   - financial: 銀行・証券・投資・クレカ・決済系
   - utility_bills: 公共料金・通信費・税金
   - hobby: ゲーム・サブスク・エンタメ
   - other: その他

5. is_welkatsu: ウエル活関連かどうか（boolean）
   - serviceが「ウエルシア」を含む、または本文に「ウエルシア」「ウエル活」が含まれる場合はtrue
   - それ以外はfalse

6. tags: 検索・関連表示用のタグ（3〜7個の配列）
   - セール名、サービス名、決済名、汎用ワードを含む
   - 類義語は統一する

# 入力データ

${JSON.stringify(simplifiedItems, null, 2)}

# 出力形式

必ず以下のJSON配列形式で返してください。コードブロック記法（\`\`\`）は不要です。

[
  {
    "index": 0,
    "difficulty": "low",
    "area_type": "online",
    "target_user_type": "all",
    "usage_type": "daily_goods",
    "is_welkatsu": false,
    "tags": ["タグ1", "タグ2", "タグ3"]
  },
  {
    "index": 1,
    ...
  }
]

⚠️ 重要:
- 純粋なJSON配列のみを返す（説明文・マークダウン記法は不要）
- どのフィールドもnull・空文字・"unknown"を返さない
- 迷った場合は最も近いものを選ぶ
- indexは入力データと同じ順序で返す
`.trim();

  return { prompt, originalItems: items };
})()}}
```

### 出力フィールド
- `prompt`: LLMに渡すプロンプト文字列
- `originalItems`: 元の案件データ（後で結合するため保持）

---

## ノード2: CallGeminiForTagging

### タイプ
`@n8n/n8n-nodes-langchain.googleGemini` (Google Gemini Chat Model)

### 設定
- **Model ID**: `models/gemini-2.0-flash-exp`（高速・低コスト）
- **Messages**: 
  ```
  {{ $json.prompt }}
  ```
- **Options**: デフォルト

### 認証
- 既存のGemini API認証情報を使用

---

## ノード3: ParseTaggingResults

### タイプ
`n8n-nodes-base.code` (Code node)

### 目的
LLMの出力をパースし、元の案件データと結合

### コード
```javascript
// LLMの出力を取得
const llmOutput = $json.content.parts[0].text;

// コードブロック記号を除去
const jsonString = llmOutput
  .replace(/^```json\s*/, '')
  .replace(/```$/, '')
  .trim();

let taggingResults;
try {
  taggingResults = JSON.parse(jsonString);
} catch (e) {
  throw new Error("❌ LLMの出力をJSONとしてパースできませんでした。内容: " + jsonString);
}

if (!Array.isArray(taggingResults)) {
  throw new Error("❌ LLMの出力が配列ではありません。内容: " + jsonString);
}

// BuildLLMTaggingPromptで保存された元データを取得
const originalItems = $items("BuildLLMTaggingPrompt", 0)[0].json.originalItems;

console.log(`📊 タグ付け完了: ${taggingResults.length}件`);

// タグ情報を元のデータに結合
const enrichedItems = originalItems.map((item, index) => {
  const tagging = taggingResults.find(t => t.index === index);
  
  if (!tagging) {
    console.warn(`⚠️ インデックス${index}のタグ情報が見つかりません`);
    // デフォルト値を設定
    return {
      ...item,
      difficulty: 'medium',
      area_type: 'online+store',
      target_user_type: 'all',
      usage_type: 'other',
      is_welkatsu: false,
      tags: []
    };
  }
  
  // タグ配列を文字列に変換（カンマ区切り）
  const tagsString = Array.isArray(tagging.tags) 
    ? tagging.tags.join(',') 
    : '';
  
  return {
    ...item,
    difficulty: tagging.difficulty,
    area_type: tagging.area_type,
    target_user_type: tagging.target_user_type,
    usage_type: tagging.usage_type,
    is_welkatsu: tagging.is_welkatsu,
    tags: tagsString
  };
});

console.log(`✅ データ結合完了: ${enrichedItems.length}件`);

// n8n形式で返す
return enrichedItems.map(item => ({ json: item }));
```

---

## ノード4: TransformForTokuSearch の更新

### 変更点
新しいフィールドがすでに存在するため、そのまま使用する。

### 更新後のコード（該当箇所のみ）
```javascript
// TokuSearch形式のオブジェクトを作成
const transformed = {
  id: id,
  date: data.date || new Date().toISOString().slice(0, 10),
  title: data.title || '',
  summary: data.summary || '',
  detail: data.detail || '',
  steps: data.steps || '',
  service: data.service || '',
  expiration: data.expiration || '',
  conditions: data.conditions || '',
  notes: notes,
  category_main: category_main,
  category_sub: '',
  is_public: 'TRUE',
  priority: priority,
  discount_rate: rate || '',
  discount_amount: amount || '',
  score: score,
  created_at: now,
  updated_at: now,
  // v2.0 新規追加フィールド（LLMタグ付けノードから取得）
  difficulty: data.difficulty || 'medium',
  area_type: data.area_type || 'online+store',
  target_user_type: data.target_user_type || 'all',
  usage_type: data.usage_type || 'other',
  is_welkatsu: data.is_welkatsu === true ? 'TRUE' : 'FALSE',
  tags: data.tags || ''
};
```

---

## 接続設定

### 新しい接続
1. `UnpackGeminiResults` → `BuildLLMTaggingPrompt`
2. `BuildLLMTaggingPrompt` → `CallGeminiForTagging`
3. `CallGeminiForTagging` → `ParseTaggingResults`
4. `ParseTaggingResults` → `TransformForTokuSearch`

### 削除する接続
- `UnpackGeminiResults` → `TransformForTokuSearch`（既存の直接接続を削除）

---

## テスト方法

### 1. 手動実行
n8nエディタで「Test workflow」をクリック

### 2. 確認ポイント
- `ParseTaggingResults`の出力に`difficulty`, `area_type`等が含まれているか
- `TransformForTokuSearch`の出力がGoogleスプレッドシート形式になっているか
- スプレッドシートに新しいカラムのデータが保存されるか

### 3. エラー対応
- LLMの出力がJSON形式でない場合、プロンプトを調整
- タグが空配列の場合、デフォルト値を設定

---

## コスト見積もり

### 1回の実行あたり
- Grokで7件取得
- Gemini呼び出し1回（7件まとめて処理）
- 入力トークン数: 約2000トークン
- 出力トークン数: 約1000トークン

### 月間コスト（1日3回実行）
- Gemini 2.0 Flash: 約$1〜2/月（無料枠内）

---

## 関連ドキュメント

- [スプレッドシート構造仕様書 v2.0](./SPREADSHEET_SCHEMA_V2.md)
- [n8nワークフロー設定](../n8n-tokusearch-setup.md)

