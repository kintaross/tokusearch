# ワークフロー レイアウト設計書

## 機能ブロック分類

### ① 入力ブロック（トリガー）
**ノード**: 
- SlackTrigger
- ExtractSlackRequest
- WebhookTrigger
- ExtractWebhookRequest
- MergeRequests

**付箋文言**: `① Slack/Webからのリクエスト受信`

**配置**: キャンバス左側（x: -800〜-100, y: -200）

---

### ② テーマ生成ブロック
**ノード**:
- BuildThemePrompt
- GenerateTheme
- ParseTheme

**付箋文言**: `② AIでコラムテーマ生成（Gemini）`

**配置**: キャンバス中央左（x: 0〜400, y: -200）

---

### ③ データ保存ブロック
**ノード**:
- PrepareSaveData
- SaveToSheet

**付箋文言**: `③ リクエスト情報をスプレッドシートに保存`

**配置**: キャンバス中央（x: 500〜800, y: -200）

---

### ④ 承認要求ブロック
**ノード**:
- BuildApprovalMessage
- SendApprovalRequest

**付箋文言**: `④ Slackでテーマ案の承認を依頼`

**配置**: キャンバス中央右（x: 900〜1200, y: -200）

---

### ⑤ 承認判定ブロック
**ノード**:
- BuildApprovalJudgmentPrompt
- JudgeApprovalResponse
- ParseApprovalJudgment
- SwitchApprovalType

**付箋文言**: `⑤ ユーザー返信をAIで判定（承認/修正/却下）`

**配置**: キャンバス右側上段（x: 1300〜2000, y: -200）

---

### ⑥ 記事生成ブロック（承認後）
**ノード**:
- PrepareColumnGeneration
- BuildArticlePrompt
- GenerateArticle
- ParseArticleJSON
- PrepareColumnData
- PostColumn
- UpdateStatus
- BuildCompletionMessage
- NotifyCompletion

**付箋文言**: `⑥ 承認後：コラム記事生成・投稿・完了通知`

**配置**: キャンバス下段右側（x: 2200〜4400, y: 200）

---

### ⑦ 再生成ブロック（却下・修正時）
**ノード**:
- CheckRetryCount
- IfRetryAvailable
- IncrementRetryCount
- BuildAbortMessage
- AbortNotification

**付箋文言**: `⑦ 却下時：テーマ再生成（最大2回）または中断`

**配置**: キャンバス下段左側（x: 2200〜3200, y: -100〜-300）

---

## 配置イメージ

```
[概要付箋]                 [①入力] → [②テーマ生成] → [③保存] → [④承認要求] → [⑤承認判定]
                                                                                      ↓
                                                                              [SwitchApprovalType]
                                                                                      ↓
                                                                              ┌───────┴───────┐
                                                                              ↓               ↓
                                                                      [⑥記事生成]     [⑦再生成]
                                                                      (下段右)         (下段左)
                                                                              ↓               ↓
                                                                      [NotifyCompletion] [BuildAbortMessage]
```

## レイアウト方針

1. **横一列を避ける**: 上段（メインフロー）と下段（分岐処理）に分ける
2. **左から右へ流れる**: 入力 → 処理 → 出力の順
3. **下段で分岐を可視化**: 承認後は右下、却下・修正時は左下
4. **各ブロックに付箋**: 機能が一目でわかるように

## 付箋の色設定

- 概要: 青色（color: 4）
- 各ブロック付箋: 緑色（color: 7）または黄色（color: 6）で統一
- 再生成ブロック: 黄色（color: 6）で警告色を表現

## 実装手順

1. **各ブロックにSticky Noteノードを追加**
   - 各ブロックの左上に配置
   - 短い日本語で機能を説明

2. **ノード位置の調整**
   - 上段（y: -200）: 入力 → テーマ生成 → データ保存 → 承認要求 → 承認判定
   - 下段右（y: 200）: 記事生成ブロック（承認後）
   - 下段左（y: -200〜-300）: 再生成ブロック（却下・修正時）

3. **位置調整の原則**
   - 横一列に並べない（y座標を2段以上に分ける）
   - 左から右への流れを明確にする
   - 各ブロック間は適度な間隔（240px）を空ける

