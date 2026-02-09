#!/usr/bin/env node
/**
 * n8nワークフローのレイアウト調整スクリプト（Node.js版）
 * - 各ブロックにSticky Noteを追加
 * - ノードのpositionを調整して見やすいレイアウトにする
 * - 実装ロジック（parameters、connectionsなど）は一切変更しない
 */

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

// ブロックごとのノード名と新しい位置
const BLOCKS = {
    "入力": {
        "nodes": ["SlackTrigger", "ExtractSlackRequest", "WebhookTrigger", "ExtractWebhookRequest", "MergeRequests"],
        "sticky_note": {
            "content": "① Slack/Webからのリクエスト受信",
            "position": [-900, -200],
            "color": 7
        },
        "base_position": [-656, -144],
        "spacing": 240,
        "layout_type": "parallel"  // 並列パスを2列に配置
    },
    "テーマ生成": {
        "nodes": ["BuildThemePrompt", "GenerateTheme", "ParseTheme"],
        "sticky_note": {
            "content": "② AIでコラムテーマ生成（Gemini）",
            "position": [-100, -200],
            "color": 7
        },
        "base_position": [0, -200],
        "spacing": 240
    },
    "データ保存": {
        "nodes": ["PrepareSaveData", "SaveToSheet"],
        "sticky_note": {
            "content": "③ リクエスト情報をスプレッドシートに保存",
            "position": [650, -200],
            "color": 7
        },
        "base_position": [800, -200],
        "spacing": 240
    },
    "承認要求": {
        "nodes": ["BuildApprovalMessage", "SendApprovalRequest"],
        "sticky_note": {
            "content": "④ Slackでテーマ案の承認を依頼",
            "position": [1200, -200],
            "color": 7
        },
        "base_position": [1520, -200],
        "spacing": 240
    },
    "承認判定": {
        "nodes": ["BuildApprovalJudgmentPrompt", "JudgeApprovalResponse", "ParseApprovalJudgment", "SwitchApprovalType"],
        "sticky_note": {
            "content": "⑤ ユーザー返信をAIで判定（承認/修正/却下）",
            "position": [1850, -200],
            "color": 7
        },
        "base_position": [2000, -200],
        "spacing": 240
    },
    "記事生成": {
        "nodes": ["PrepareColumnGeneration", "BuildArticlePrompt", "GenerateArticle", "ParseArticleJSON", 
                  "PrepareColumnData", "PostColumn", "UpdateStatus", "BuildCompletionMessage", "NotifyCompletion"],
        "sticky_note": {
            "content": "⑥ 承認後：コラム記事生成・投稿・完了通知",
            "position": [2200, 50],
            "color": 7
        },
        "base_position": [2960, 200],
        "spacing": 240
    },
    "再生成": {
        "nodes": ["CheckRetryCount", "IfRetryAvailable", "IncrementRetryCount", "BuildAbortMessage", "AbortNotification"],
        "sticky_note": {
            "content": "⑦ 却下時：テーマ再生成（最大2回）または中断",
            "position": [2200, -350],
            "color": 6
        },
        "base_position": [2720, -144],
        "spacing": 240,
        "vertical_layout": true  // 縦配置
    }
};

function generateUUID() {
    return randomUUID();
}

function updateWorkflowLayout(inputFile, outputFile) {
    console.log(`📖 ワークフローファイルを読み込み中: ${inputFile}`);
    const workflow = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
    
    // ノード名からノードオブジェクトへのマッピング
    const nodeMap = {};
    workflow.nodes.forEach(node => {
        nodeMap[node.name] = node;
    });
    
    // 各ブロックのSticky Noteを追加
    const newStickyNotes = [];
    
    for (const [blockName, blockConfig] of Object.entries(BLOCKS)) {
        // Sticky Noteノードを作成
        const stickyId = generateUUID();
        const stickyNote = {
            "parameters": {
                "content": blockConfig.sticky_note.content,
                "height": 150,
                "width": 300,
                "color": blockConfig.sticky_note.color
            },
            "id": stickyId,
            "name": `StickyNote_${blockName}`,
            "type": "n8n-nodes-base.stickyNote",
            "typeVersion": 1,
            "position": blockConfig.sticky_note.position
        };
        newStickyNotes.push(stickyNote);
        
        // ブロック内のノードの位置を調整
        const [baseX, baseY] = blockConfig.base_position;
        const spacing = blockConfig.spacing || 240;
        const vertical = blockConfig.vertical_layout || false;
        const layoutType = blockConfig.layout_type;
        
        blockConfig.nodes.forEach((nodeName, idx) => {
            if (nodeMap[nodeName]) {
                const node = nodeMap[nodeName];
                
                if (layoutType === "parallel" && blockName === "入力") {
                    // 入力ブロック: 2列の並列パス
                    // SlackTrigger → ExtractSlackRequest (左列)
                    // WebhookTrigger → ExtractWebhookRequest (右列)
                    // MergeRequests (中央下)
                    if (nodeName === "SlackTrigger") {
                        node.position = [baseX - 200, baseY];
                    } else if (nodeName === "ExtractSlackRequest") {
                        node.position = [baseX - 200, baseY + spacing];
                    } else if (nodeName === "WebhookTrigger") {
                        node.position = [baseX + 200, baseY];
                    } else if (nodeName === "ExtractWebhookRequest") {
                        node.position = [baseX + 200, baseY + spacing];
                    } else if (nodeName === "MergeRequests") {
                        node.position = [baseX, baseY + spacing * 2];
                    }
                } else if (vertical) {
                    // 縦配置（再生成ブロックなど）
                    node.position = [
                        baseX,
                        baseY + (idx * spacing)
                    ];
                } else {
                    // 横配置（通常）
                    node.position = [
                        baseX + (idx * spacing),
                        baseY
                    ];
                }
                console.log(`✓ ${nodeName} の位置を調整: [${node.position[0]}, ${node.position[1]}]`);
            } else {
                console.log(`⚠️  警告: ノード '${nodeName}' が見つかりません`);
            }
        });
    }
    
    // Sticky Noteノードをワークフローに追加（既存のSticky Noteの後）
    const existingStickyIndices = workflow.nodes
        .map((node, index) => node.type === "n8n-nodes-base.stickyNote" ? index : -1)
        .filter(idx => idx !== -1);
    
    let insertIndex;
    if (existingStickyIndices.length > 0) {
        insertIndex = Math.max(...existingStickyIndices) + 1;
    } else {
        insertIndex = 0;
    }
    
    workflow.nodes.splice(insertIndex, 0, ...newStickyNotes);
    
    // 出力
    console.log(`\n💾 ワークフローファイルを保存中: ${outputFile}`);
    fs.writeFileSync(outputFile, JSON.stringify(workflow, null, 2), 'utf-8');
    
    console.log(`\n✅ レイアウト更新完了: ${outputFile}`);
    console.log(`   追加したSticky Note: ${newStickyNotes.length}個`);
}

// メイン処理
const scriptDir = __dirname;
const inputFile = path.join(scriptDir, "コラムテーマ作成と承認ワークフロー（Slack + Web連携） (1).json");
const outputFile = path.join(scriptDir, "コラムテーマ作成と承認ワークフロー（Slack + Web連携）_レイアウト改善.json");

if (!fs.existsSync(inputFile)) {
    console.error(`❌ エラー: 入力ファイルが見つかりません: ${inputFile}`);
    console.error(`   現在のディレクトリ: ${process.cwd()}`);
    process.exit(1);
}

try {
    updateWorkflowLayout(inputFile, outputFile);
    console.log(`\n✅ 完了！出力ファイル: ${outputFile}`);
} catch (error) {
    console.error(`❌ エラーが発生しました: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
}

