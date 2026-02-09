$ErrorActionPreference = "Stop"

$filePath = "n8n_workflow\コラム自動生成_Ver1.0.json"

Write-Host "ファイルを読み込み中: $filePath"

try {
    $content = Get-Content $filePath -Raw -Encoding UTF8
    Write-Host "✅ ファイル読み込み成功 (サイズ: $($content.Length) 文字)"
    
    # JSONとしてパース試行
    $json = $content | ConvertFrom-Json
    
    Write-Host "✅ JSONパース成功！"
    Write-Host "  - ワークフロー名: $($json.name)"
    Write-Host "  - ノード数: $($json.nodes.Count)"
    Write-Host "  - 接続数: $($json.connections.PSObject.Properties.Count)"
    
    # 重複チェック
    $nodeIds = $json.nodes | ForEach-Object { $_.id }
    $duplicateIds = $nodeIds | Group-Object | Where-Object { $_.Count -gt 1 }
    if ($duplicateIds) {
        Write-Host "⚠️ 重複しているノードID:"
        $duplicateIds | ForEach-Object { Write-Host "    - $($_.Name)" }
    }
    
    $nodeNames = $json.nodes | ForEach-Object { $_.name }
    $duplicateNames = $nodeNames | Group-Object | Where-Object { $_.Count -gt 1 }
    if ($duplicateNames) {
        Write-Host "⚠️ 重複しているノード名:"
        $duplicateNames | ForEach-Object { Write-Host "    - $($_.Name)" }
    }
    
} catch {
    Write-Host "❌ エラー発生:"
    Write-Host "  メッセージ: $($_.Exception.Message)"
    
    if ($_.Exception.Message -match "position") {
        $match = [regex]::Match($_.Exception.Message, "position (\d+)")
        if ($match.Success) {
            $pos = [int]$match.Groups[1].Value
            Write-Host "  エラー位置: $pos"
            
            $start = [Math]::Max(0, $pos - 100)
            $end = [Math]::Min($content.Length, $pos + 100)
            Write-Host "`n  エラー位置の前後200文字:"
            Write-Host "  ---"
            Write-Host $content.Substring($start, $end - $start)
            Write-Host "  ---"
            
            # 行番号を計算
            $beforeError = $content.Substring(0, $pos)
            $lineNumber = ($beforeError -split "`n").Count
            $lastNewline = $beforeError.LastIndexOf("`n")
            $columnNumber = if ($lastNewline -eq -1) { $pos } else { $pos - $lastNewline - 1 }
            Write-Host "`n  行番号: $lineNumber, 列番号: $columnNumber"
        }
    }
    
    exit 1
}

