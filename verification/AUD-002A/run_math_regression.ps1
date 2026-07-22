param(
    [string]$WorkingDir = "",
    [string]$PayloadPath = "verification\AUD-002A\math_regression_payload.js",
    [string]$OutDir = "verification\AUD-002A",
    [string]$EdgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    [string]$PagePath = "Page11\index.html",
    [int]$Port = 9225,
    [int]$WaitSeconds = 5
)

if (-not $WorkingDir) { $WorkingDir = (Get-Location).Path }
Set-Location $WorkingDir

$url = "file:///" + (Join-Path $WorkingDir $PagePath).Replace("\", "/")
$js = [System.IO.File]::ReadAllText((Join-Path $WorkingDir $PayloadPath), [System.Text.Encoding]::UTF8)

Write-Host "Starting Edge Headless on port $Port..."
$edge = Start-Process -FilePath $EdgePath -ArgumentList "--headless","--disable-gpu","--remote-debugging-port=$Port","`"$url`"" -PassThru
Start-Sleep -Seconds $WaitSeconds

try {
    $pages = Invoke-RestMethod -Uri "http://localhost:$Port/json"
    $t = $pages | Where-Object { $_.type -eq "page" } | Select-Object -First 1
    if (-not $t) { throw "No CDP target" }

    $ws = New-Object System.Net.WebSockets.ClientWebSocket
    $cts = New-Object System.Threading.CancellationTokenSource(30000)
    $ws.ConnectAsync((New-Object System.Uri($t.webSocketDebuggerUrl)), $cts.Token).Wait()
    Write-Host "CDP connected. Sending payload..."

    $payload = @{ id = 1; method = "Runtime.evaluate"; params = @{ expression = $js; returnByValue = $true } }
    $payloadJson = $payload | ConvertTo-Json -Depth 5 -Compress
    $payloadBytes = [System.Text.Encoding]::UTF8.GetBytes($payloadJson)
    $ws.SendAsync([System.ArraySegment[byte]]$payloadBytes, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()

    $recvBuf = New-Object byte[] 524288
    $recvResult = $ws.ReceiveAsync([System.ArraySegment[byte]]$recvBuf, $cts.Token)
    $recvResult.Wait()
    $responseText = [System.Text.Encoding]::UTF8.GetString($recvBuf, 0, $recvResult.Result.Count)
    $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "done", $cts.Token).Wait()

    $parsedResponse = $responseText | ConvertFrom-Json
    $resultJson = $parsedResponse.result.result.value

    if (-not $resultJson) {
        Write-Host "FAIL: Empty CDP result."
        Write-Host $responseText
        exit 1
    }

    $result = $resultJson | ConvertFrom-Json
    Write-Host "----------------------------------------------------------------------"
    Write-Host "AUD-002A Results: $($result.status) ($($result.passedTests)/$($result.totalTests))"
    Write-Host "----------------------------------------------------------------------"
    foreach ($c in $result.categories) {
        $s = if ($c.failed -eq 0) { "PASS" } else { "FAIL" }
        Write-Host "  [$s] $($c.category): $($c.passed)/$($c.total)"
    }
    Write-Host "----------------------------------------------------------------------"

    $outFullDir = Join-Path $WorkingDir $OutDir
    New-Item -ItemType Directory -Force -Path $outFullDir | Out-Null
    [System.IO.File]::WriteAllText("$outFullDir\regression-report.json", $resultJson, [System.Text.Encoding]::UTF8)

    $failLines = New-Object System.Collections.ArrayList
    foreach ($c in $result.categories) {
        foreach ($tt in $c.results) {
            if (-not $tt.pass) {
                $failLines.Add("[$($c.category)] $($tt.name): expected=$($tt.expected) got=$($tt.got) diff=$($tt.diff)") | Out-Null
            }
        }
    }
    $failContent = $failLines -join "`n"
    [System.IO.File]::WriteAllText("$outFullDir\failed-tests.txt", $failContent, [System.Text.Encoding]::UTF8)

    $csvLines = New-Object System.Collections.ArrayList
    $csvLines.Add("category,test,expected,got,diff,pass") | Out-Null
    foreach ($c in $result.categories) {
        foreach ($tt in $c.results) {
            $csvLines.Add("$($c.category),`"$($tt.name)`",$($tt.expected),$($tt.got),$($tt.diff),$($tt.pass)") | Out-Null
        }
    }
    [System.IO.File]::WriteAllText("$outFullDir\benchmark.csv", ($csvLines -join "`n"), [System.Text.Encoding]::UTF8)

    Write-Host "Evidence saved to $outFullDir"
    if ($result.status -eq "PASS") { exit 0 } else { exit 1 }

} catch {
    $em = $_.Exception.Message
    Write-Host "ERROR: $em"
    exit 1
} finally {
    if ($edge) { Stop-Process -Id $edge.Id -Force -ErrorAction SilentlyContinue }
}
