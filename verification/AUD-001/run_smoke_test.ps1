param()

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$workingDir = (Get-Location).Path

$pageIds = @("index","page1","page1help","page3","page4","page5","page6","page7","page8","page10","page11","page12","page13")
$pagePaths = @{
    "index"    = "index.html"
    "page1"    = "Page1\section1\index.html"
    "page1help"= "Page1\section1\help2\index.html"
    "page3"    = "Page3\index.html"
    "page4"    = "Page4\index.html"
    "page5"    = "Page5\index.html"
    "page6"    = "Page6\index.html"
    "page7"    = "Page7\index.html"
    "page8"    = "Page8\index.html"
    "page10"   = "Page10\index.html"
    "page11"   = "Page11\index.html"
    "page12"   = "Page12\index.html"
    "page13"   = "Page13\section1\index.html"
}

$results = @()
$overallPass = $true

foreach ($pageKey in $pageIds) {
    $relPath = $pagePaths[$pageKey]
    $filePath = Join-Path $workingDir $relPath
    $url = "file:///" + $filePath.Replace("\", "/")

    Write-Host "Testing $pid => $relPath"

    $titleState = ""
    $pageStatus = "PASS"
    $errorDetail = ""

    try {
        $edge = Start-Process -FilePath $edgePath -ArgumentList "--headless","--disable-gpu","--remote-debugging-port=9223","`"$url`"" -PassThru
        Start-Sleep -Seconds 2

        $pagesJson = Invoke-RestMethod -Uri "http://localhost:9223/json"
        $target = $pagesJson | Where-Object { $_.type -eq "page" } | Select-Object -First 1

        if ($target) {
            $ws = New-Object System.Net.WebSockets.ClientWebSocket
            $cts = New-Object System.Threading.CancellationTokenSource(8000)
            $uri = New-Object System.Uri($target.webSocketDebuggerUrl)
            $ws.ConnectAsync($uri, $cts.Token).Wait()

            $titleCmd = @{ id=1; method="Runtime.evaluate"; params=@{ expression="document.title + '|' + document.readyState"; returnByValue=$true } } | ConvertTo-Json -Depth 5 -Compress
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($titleCmd)
            $ws.SendAsync((New-Object System.ArraySegment[byte] -ArgumentList (,$bytes)), [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()

            $buf = New-Object byte[] 65536
            $recv = $ws.ReceiveAsync((New-Object System.ArraySegment[byte] -ArgumentList (,$buf)), $cts.Token)
            $recv.Wait()
            $resp = [System.Text.Encoding]::UTF8.GetString($buf, 0, $recv.Result.Count) | ConvertFrom-Json
            $titleState = $resp.result.result.value

            $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $cts.Token).Wait()
            Write-Host "  => $titleState"
        } else {
            $pageStatus = "FAIL"
            $errorDetail = "CDP: No page target found"
            $overallPass = $false
            Write-Host "  => FAIL: no CDP target"
        }
    } catch {
        $pageStatus = "FAIL"
        $errorDetail = $_.Exception.Message
        $overallPass = $false
        Write-Host "  => FAIL: $_"
    } finally {
        if ($edge) { Stop-Process -Id $edge.Id -Force -ErrorAction SilentlyContinue }
        Start-Sleep -Milliseconds 500
    }

    $results += @{
        pageId = $pageKey
        path = $relPath
        status = $pageStatus
        titleState = $titleState
        errorDetail = $errorDetail
    }
}

Write-Host ""
Write-Host "======================================"
$total = $results.Count
$passed = ($results | Where-Object { $_["status"] -eq "PASS" }).Count
Write-Host "AUD-001: $passed / $total Pages Passed"
Write-Host "======================================"

$null = New-Item -ItemType Directory -Force -Path (Join-Path $workingDir "verification\AUD-001")
$outFile = Join-Path $workingDir "verification\AUD-001\smoke-test.json"
$jsonOut = @{
    audId = "AUD-001"
    status = if ($overallPass) { "PASS" } else { "FAIL" }
    totalPages = $total
    passedPages = $passed
    timestamp = (Get-Date -Format "o")
    results = $results
}
$jsonOut | ConvertTo-Json -Depth 5 | Out-File -FilePath $outFile -Encoding utf8
Write-Host "Saved: $outFile"
