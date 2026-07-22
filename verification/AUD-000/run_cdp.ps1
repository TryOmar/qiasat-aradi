$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$workingDir = Get-Location
$filePath = Join-Path $workingDir "Page11\index.html"
$url = "file:///" + $filePath.Replace("\", "/")

Write-Host "Launching Edge Headless with CDP Debugging..."
$edge = Start-Process -FilePath $edgePath -ArgumentList "--headless", "--disable-gpu", "--remote-debugging-port=9222", "`"$url`"" -PassThru

Start-Sleep -Seconds 3

try {
    $pagesJson = Invoke-RestMethod -Uri "http://localhost:9222/json"
    $targetPage = $pagesJson | Where-Object { $_.type -eq "page" } | Select-Object -First 1

    if ($targetPage) {
        Write-Host "Found CDP Target Page: $($targetPage.title)"
        $wsUrl = $targetPage.webSocketDebuggerUrl

        Add-Type -AssemblyName "System.Net.Http"
        $ws = New-Object System.Net.WebSockets.ClientWebSocket
        $cts = New-Object System.Threading.CancellationTokenSource(10000)
        $uri = New-Object System.Uri($wsUrl)

        $ws.ConnectAsync($uri, $cts.Token).Wait()
        Write-Host "WebSocket Connected to CDP!"

        $evalPayload = @{
            id = 1
            method = "Runtime.evaluate"
            params = @{
                expression = "window.runMasterRCAudit(); window.getAuditJSON();"
                returnByValue = $true
            }
        }
        $evalCmd = $evalPayload | ConvertTo-Json -Depth 5 -Compress

        $bytes = [System.Text.Encoding]::UTF8.GetBytes($evalCmd)
        $segment = New-Object System.ArraySegment[byte] -ArgumentList (,$bytes)
        $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()

        $buffer = New-Object byte[] 65536
        $recvSegment = New-Object System.ArraySegment[byte] -ArgumentList (,$buffer)
        $result = $ws.ReceiveAsync($recvSegment, $cts.Token)
        $result.Wait()

        $respText = [System.Text.Encoding]::UTF8.GetString($buffer, 0, $result.Result.Count)
        $respObj = $respText | ConvertFrom-Json

        $auditDataRaw = $respObj.result.result.value
        Write-Host "Audit JSON Result Received:"
        Write-Host $auditDataRaw

        if ($auditDataRaw) {
            $outFile = Join-Path $workingDir "verification\AUD-000\suite-discovery.json"
            [System.IO.File]::WriteAllText($outFile, $auditDataRaw, [System.Text.Encoding]::UTF8)
            Write-Host "Saved verification/AUD-000/suite-discovery.json successfully!"
        }

        $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $cts.Token).Wait()
    } else {
        Write-Host "Could not find target page in CDP"
    }
} catch {
    Write-Host "Exception in CDP Script: $_"
} finally {
    Stop-Process -Id $edge.Id -Force -ErrorAction SilentlyContinue
}
