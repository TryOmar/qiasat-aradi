$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$WD = (Get-Location).Path
$Port = 9229

# Test Page11
$p11Url = "file:///" + (Join-Path $WD "Page11\index.html").Replace("\", "/")
$p11Proc = Start-Process -FilePath $edgePath -ArgumentList "--headless","--disable-gpu","--remote-debugging-port=$Port","`"$p11Url`"" -PassThru
Start-Sleep -Seconds 3

$cdpPages  = Invoke-RestMethod -Uri "http://localhost:$Port/json"
$cdpTarget = $cdpPages | Where-Object { $_.type -eq "page" } | Select-Object -First 1

$sock = New-Object System.Net.WebSockets.ClientWebSocket
$cts  = New-Object System.Threading.CancellationTokenSource(30000)
$sock.ConnectAsync((New-Object System.Uri($cdpTarget.webSocketDebuggerUrl)), $cts.Token).Wait()

function Receive-WSMessage($socket, $cancelToken) {
    $ms = New-Object System.IO.MemoryStream
    $buffer = New-Object byte[] 65536
    do {
        $segment = New-Object System.ArraySegment[byte] -ArgumentList (,$buffer)
        $task = $socket.ReceiveAsync($segment, $cancelToken)
        $task.Wait()
        $res = $task.Result
        if ($res.Count -gt 0) { $ms.Write($buffer, 0, $res.Count) }
    } while (-not $res.EndOfMessage)
    return [System.Text.Encoding]::UTF8.GetString($ms.ToArray())
}

$jsP11 = @"
(function() {
  var l1 = document.getElementById('length1'); if (l1) l1.value = '40';
  var w1 = document.getElementById('width1'); if (w1) w1.value = '30';
  if (typeof calculateGeneral === 'function') calculateGeneral(true);
  
  var hasClear = typeof clearAll === 'function' || typeof clearAllInputs === 'function';
  var hasPrint = typeof printReport === 'function';
  return JSON.stringify({ page: 'Page11', l1Val: l1 ? l1.value : '', hasClear: hasClear, hasPrint: hasPrint });
})();
"@

$evalCmd11 = @{ id = 1; method = "Runtime.evaluate"; params = @{ expression = $jsP11; returnByValue = $true } }
$evalBytes11 = [System.Text.Encoding]::UTF8.GetBytes(($evalCmd11 | ConvertTo-Json -Depth 5 -Compress))
$sock.SendAsync([System.ArraySegment[byte]]$evalBytes11, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()
$respText11 = Receive-WSMessage $sock $cts.Token
$res11 = ($respText11 | ConvertFrom-Json).result.result.value

$sock.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "ok", $cts.Token).Wait()
if ($p11Proc) { Stop-Process -Id $p11Proc.Id -Force -ErrorAction SilentlyContinue }

# Test Page13
$p13Url = "file:///" + (Join-Path $WD "Page13\section1\index.html").Replace("\", "/")
$p13Proc = Start-Process -FilePath $edgePath -ArgumentList "--headless","--disable-gpu","--remote-debugging-port=$Port","`"$p13Url`"" -PassThru
Start-Sleep -Seconds 3

$cdpPages  = Invoke-RestMethod -Uri "http://localhost:$Port/json"
$cdpTarget = $cdpPages | Where-Object { $_.type -eq "page" } | Select-Object -First 1

$sock = New-Object System.Net.WebSockets.ClientWebSocket
$cts  = New-Object System.Threading.CancellationTokenSource(30000)
$sock.ConnectAsync((New-Object System.Uri($cdpTarget.webSocketDebuggerUrl)), $cts.Token).Wait()

$jsP13 = @"
(function() {
  var len = document.getElementById('rect-length'); if (len) len.value = '50';
  var wid = document.getElementById('rect-width'); if (wid) wid.value = '30';
  if (typeof calculateAll === 'function') calculateAll();

  var canvas = document.getElementById('landCanvas');
  var hasCanvas = !!canvas;
  var hasAddPartner = typeof addNewHeir === 'function';
  var hasPrint = typeof printCroquis === 'function';

  return JSON.stringify({ page: 'Page13', hasCanvas: hasCanvas, hasAddPartner: hasAddPartner, hasPrint: hasPrint });
})();
"@

$evalCmd13 = @{ id = 1; method = "Runtime.evaluate"; params = @{ expression = $jsP13; returnByValue = $true } }
$evalBytes13 = [System.Text.Encoding]::UTF8.GetBytes(($evalCmd13 | ConvertTo-Json -Depth 5 -Compress))
$sock.SendAsync([System.ArraySegment[byte]]$evalBytes13, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()
$respText13 = Receive-WSMessage $sock $cts.Token
$res13 = ($respText13 | ConvertFrom-Json).result.result.value

$sock.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "ok", $cts.Token).Wait()
if ($p13Proc) { Stop-Process -Id $p13Proc.Id -Force -ErrorAction SilentlyContinue }

Write-Host "Page11 Smoke Check: " $res11
Write-Host "Page13 Smoke Check: " $res13
