#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
n8nワークフローのレイアウト調整スクリプト
- 各ブロックにSticky Noteを追加
- ノードのpositionを調整して見やすいレイアウトにする
- 実装ロジック（parameters、connectionsなど）は一切変更しない
"""

import json
import uuid

# ブロックごとのノード名と新しい位置
BLOCKS = {
    "入力": {
        "nodes": ["SlackTrigger", "ExtractSlackRequest", "WebhookTrigger", "ExtractWebhookRequest", "MergeRequests"],
        "sticky_note": {
            "content": "① Slack/Webからのリクエスト受信",
            "position": [-900, -200],
            "color": 7
        },
        "base_position": [-800, -200],
        "spacing": 240
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
        "vertical_layout": True  # 縦配置
    }
}

def generate_uuid():
    """UUIDを生成"""
    return str(uuid.uuid4())

def update_workflow_layout(input_file, output_file):
    """ワークフローのレイアウトを更新"""
    with open(input_file, 'r', encoding='utf-8') as f:
        workflow = json.load(f)
    
    # ノード名からノードオブジェクトへのマッピング
    node_map = {node["name"]: node for node in workflow["nodes"]}
    
    # 各ブロックのSticky Noteを追加
    new_sticky_notes = []
    
    for block_name, block_config in BLOCKS.items():
        # Sticky Noteノードを作成
        sticky_id = generate_uuid()
        sticky_note = {
            "parameters": {
                "content": block_config["sticky_note"]["content"],
                "height": 150,
                "width": 300,
                "color": block_config["sticky_note"]["color"]
            },
            "id": sticky_id,
            "name": f"StickyNote_{block_name}",
            "type": "n8n-nodes-base.stickyNote",
            "typeVersion": 1,
            "position": block_config["sticky_note"]["position"]
        }
        new_sticky_notes.append(sticky_note)
        
        # ブロック内のノードの位置を調整
        base_x, base_y = block_config["base_position"]
        spacing = block_config.get("spacing", 240)
        vertical = block_config.get("vertical_layout", False)
        
        for idx, node_name in enumerate(block_config["nodes"]):
            if node_name in node_map:
                node = node_map[node_name]
                if vertical:
                    # 縦配置（再生成ブロックなど）
                    node["position"] = [
                        base_x,
                        base_y + (idx * spacing)
                    ]
                else:
                    # 横配置（通常）
                    node["position"] = [
                        base_x + (idx * spacing),
                        base_y
                    ]
                print(f"✓ {node_name} の位置を調整: {node['position']}")
    
    # Sticky Noteノードをワークフローに追加（既存のSticky Noteの後）
    # 既存の概要Sticky Noteはそのまま残す
    existing_sticky_indices = [i for i, node in enumerate(workflow["nodes"]) if node.get("type") == "n8n-nodes-base.stickyNote"]
    if existing_sticky_indices:
        insert_index = max(existing_sticky_indices) + 1
    else:
        insert_index = 0
    workflow["nodes"] = workflow["nodes"][:insert_index] + new_sticky_notes + workflow["nodes"][insert_index:]
    
    # 出力
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(workflow, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ レイアウト更新完了: {output_file}")
    print(f"   追加したSticky Note: {len(new_sticky_notes)}個")

if __name__ == "__main__":
    import os
    import sys
    
    # スクリプトのディレクトリを取得
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    input_file = "コラムテーマ作成と承認ワークフロー（Slack + Web連携） (1).json"
    output_file = "コラムテーマ作成と承認ワークフロー（Slack + Web連携）_レイアウト改善.json"
    
    if not os.path.exists(input_file):
        print(f"❌ エラー: 入力ファイルが見つかりません: {input_file}")
        print(f"   現在のディレクトリ: {os.getcwd()}")
        sys.exit(1)
    
    try:
        update_workflow_layout(input_file, output_file)
        print(f"\n✅ 完了！出力ファイル: {output_file}")
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

