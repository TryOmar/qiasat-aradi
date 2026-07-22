param(
    [string]$WD = "",
    [int]$Port = 9226,
    [int]$Wait = 5
)
if (-not $WD) { $WD = (Get-Location).Path }
$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$payloadFile = Join-Path $WD "verification\AUD-002B\visual_regression_payload.js"
$outDir = Join-Path $WD "verification\AUD-002B"
$baselineDir = Join-Path $outDir "baseline"
$currentDir  = Join-Path $outDir "current"
$diffDir     = Join-Path $outDir "diff"
New-Item -ItemType Directory -Force -Path $outDir    | Out-Null
New-Item -ItemType Directory -Force -Path $baselineDir | Out-Null
New-Item -ItemType Directory -Force -Path $currentDir  | Out-Null
New-Item -ItemType Directory -Force -Path $diffDir     | Out-Null

$js = [System.IO.File]::ReadAllText($payloadFile, [System.Text.Encoding]::UTF8)

$pages = @(
    "page12|Page12\index.html|CroquisMain",
    "page5|Page5\index.html|PartitionHeritage",
    "page11|Page11\index.html|VarLengthPartition",
    "page13|Page13\index.html|ReportsPrint"
)

$allPassed = $true
$ssCount = 0
$pageResultsJson = "["
$first = $true

function Receive-WSMessage($socket, $cancelToken) {
    $ms = New-Object System.IO.MemoryStream
    $buffer = New-Object byte[] 65536
    do {
        $segment = New-Object System.ArraySegment[byte] -ArgumentList (,$buffer)
        $task = $socket.ReceiveAsync($segment, $cancelToken)
        $task.Wait()
        $res = $task.Result
        if ($res.Count -gt 0) {
            $ms.Write($buffer, 0, $res.Count)
        }
    } while (-not $res.EndOfMessage)
    return [System.Text.Encoding]::UTF8.GetString($ms.ToArray())
}

foreach ($entry in $pages) {
    $parts = $entry.Split("|")
    $pageKey  = $parts[0]
    $pagePath = $parts[1]
    $pageDesc = $parts[2]
    $fileUrl  = "file:///" + (Join-Path $WD $pagePath).Replace("\", "/")

    Write-Host "AUD-002B: $pageKey ($pageDesc)"
    $edgeProc = Start-Process -FilePath $edgePath -ArgumentList "--headless","--disable-gpu","--window-size=1920,1080","--remote-debugging-port=$Port","`"$fileUrl`"" -PassThru
    Start-Sleep -Seconds $Wait

    try {
        $cdpPages  = Invoke-RestMethod -Uri "http://localhost:$Port/json"
        $cdpTarget = $cdpPages | Where-Object { $_.type -eq "page" } | Select-Object -First 1
        if (-not $cdpTarget) { throw "No CDP target" }

        $sock = New-Object System.Net.WebSockets.ClientWebSocket
        $cts  = New-Object System.Threading.CancellationTokenSource(30000)
        $sock.ConnectAsync((New-Object System.Uri($cdpTarget.webSocketDebuggerUrl)), $cts.Token).Wait()

        # --- Payload FIRST (before screenshot to avoid buffer overflow) ---
        $evalCmd   = @{ id = 1; method = "Runtime.evaluate"; params = @{ expression = $js; returnByValue = $true } }
        $evalBytes = [System.Text.Encoding]::UTF8.GetBytes(($evalCmd | ConvertTo-Json -Depth 5 -Compress))
        $sock.SendAsync([System.ArraySegment[byte]]$evalBytes, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()
        $evalText  = Receive-WSMessage $sock $cts.Token
        $evalResp  = ($evalText | ConvertFrom-Json).result.result.value

        # --- Screenshot (separate command after payload) ---
        $ssCmd   = '{"id":2,"method":"Page.captureScreenshot","params":{"format":"png","quality":80}}'
        $ssBytes = [System.Text.Encoding]::UTF8.GetBytes($ssCmd)
        $sock.SendAsync([System.ArraySegment[byte]]$ssBytes, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()
        $ssText  = Receive-WSMessage $sock $cts.Token
        $ssData  = ($ssText | ConvertFrom-Json).result.data
        if ($ssData) {
            [System.IO.File]::WriteAllBytes((Join-Path $baselineDir ($pageKey + ".png")), [System.Convert]::FromBase64String($ssData))
            $ssCount++
            Write-Host "  Screenshot: baseline/$pageKey.png"
        }

        $sock.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "ok", $cts.Token).Wait()

        if (-not $evalResp) {
            Write-Host "  FAIL: empty CDP eval response"
            $allPassed = $false
        } else {
            [System.IO.File]::WriteAllText((Join-Path $currentDir ($pageKey + "-result.json")), $evalResp, [System.Text.Encoding]::UTF8)
            $res = $evalResp | ConvertFrom-Json
            Write-Host "  Status: $($res.status) ($($res.passedTests)/$($res.totalTests))"
            if ($res.status -ne "PASS") {
                $allPassed = $false
                foreach ($cat in $res.categories) {
                    if ($cat.failed -gt 0) {
                        Write-Host "    [FAIL] $($cat.category): $($cat.passed)/$($cat.total)"
                    }
                }
            }
            if (-not $first) { $pageResultsJson += "," }
            $pageResultsJson += '{"page":"' + $pageKey + '","status":"' + $res.status + '","passed":' + $res.passedTests + ',"total":' + $res.totalTests + '}'
            $first = $false
        }
    } catch {
        $em = $_.Exception.Message
        Write-Host "  ERROR: $em"
        $allPassed = $false
    } finally {
        if ($edgeProc) { Stop-Process -Id $edgeProc.Id -Force -ErrorAction SilentlyContinue }
        Start-Sleep -Milliseconds 800
    }
}

$pageResultsJson += "]"
$finalStatus = if ($allPassed) { "PASS" } else { "FAIL" }
Write-Host ""
Write-Host "======================================================================"
Write-Host "AUD-002B Final: $finalStatus | Screenshots: $ssCount/3"
Write-Host "======================================================================"

$summaryJson = '{"audId":"AUD-002B","status":"' + $finalStatus + '","screenshotsTaken":' + $ssCount + ',"pagesAudited":3,"pageResults":' + $pageResultsJson + '}'
[System.IO.File]::WriteAllText((Join-Path $outDir "summary.json"), $summaryJson, [System.Text.Encoding]::UTF8)
Write-Host "Saved: summary.json"
if ($allPassed) { exit 0 } else { exit 1 }
