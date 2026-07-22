param()

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$workingDir = (Get-Location).Path

$suspectPages = @(
    @{ key="page6";  path="Page6\index.html" },
    @{ key="page8";  path="Page8\index.html" },
    @{ key="page10"; path="Page10\index.html" }
)

foreach ($page in $suspectPages) {
    $filePath = Join-Path $workingDir $page.path
    $url = "file:///" + $filePath.Replace("\", "/")
    Write-Host "Retesting $($page.key) with 5s wait: $($page.path)"

    try {
        $edge = Start-Process -FilePath $edgePath -ArgumentList "--headless","--disable-gpu","--remote-debugging-port=9224","`"$url`"" -PassThru
        Start-Sleep -Seconds 5

        $pagesJson = Invoke-RestMethod -Uri "http://localhost:9224/json"
        $target = $pagesJson | Where-Object { $_.type -eq "page" } | Select-Object -First 1

        if ($target) {
            $ws = New-Object System.Net.WebSockets.ClientWebSocket
            $cts = New-Object System.Threading.CancellationTokenSource(8000)
            $uri = New-Object System.Uri($target.webSocketDebuggerUrl)
            $ws.ConnectAsync($uri, $cts.Token).Wait()

            $cmd = @{ id=1; method="Runtime.evaluate"; params=@{ expression="document.title + '|' + document.readyState"; returnByValue=$true } } | ConvertTo-Json -Depth 5 -Compress
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($cmd)
            $ws.SendAsync((New-Object System.ArraySegment[byte] -ArgumentList (,$bytes)), [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()

            $buf = New-Object byte[] 65536
            $recv = $ws.ReceiveAsync((New-Object System.ArraySegment[byte] -ArgumentList (,$buf)), $cts.Token)
            $recv.Wait()
            $resp = [System.Text.Encoding]::UTF8.GetString($buf, 0, $recv.Result.Count) | ConvertFrom-Json
            $titleState = $resp.result.result.value
            Write-Host "  => $titleState"

            $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $cts.Token).Wait()
        } else {
            Write-Host "  => FAIL: no CDP target"
        }
    } catch {
        Write-Host "  => ERROR: $_"
    } finally {
        if ($edge) { Stop-Process -Id $edge.Id -Force -ErrorAction SilentlyContinue }
        Start-Sleep -Milliseconds 800
    }
}
Write-Host "Retest complete."
