$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$WD = (Get-Location).Path
$Port = 9229

# Test Page13 Reset & PreparePrint
$p13Url = "file:///" + (Join-Path $WD "Page13\section1\index.html").Replace("\", "/")
$p13Proc = Start-Process -FilePath $edgePath -ArgumentList "--headless","--disable-gpu","--remote-debugging-port=$Port","`"$p13Url`"" -PassThru
Start-Sleep -Seconds 4

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

$jsTest13 = @"
(function() {
  var logs = [];
  var origLog = console.log;
  console.log = function() { logs.push(Array.from(arguments).join(' ')); origLog.apply(console, arguments); };

  // Set values
  var len = document.getElementById('rect-length');
  if (len) len.value = '50';
  var wid = document.getElementById('rect-width');
  if (wid) wid.value = '30';
  if (typeof calculateAll === 'function') calculateAll();

  localStorage.setItem('p13-test-key', 'test');
  
  var areaBefore = document.getElementById('total-sqm') ? document.getElementById('total-sqm').innerText : '';
  
  // Test preparePrintPage13
  var printPrep = typeof preparePrintPage13 === 'function' ? preparePrintPage13() : null;

  // Test resetPage13
  if (typeof resetPage13 === 'function') resetPage13();
  
  var areaAfter = document.getElementById('total-sqm') ? document.getElementById('total-sqm').innerText : '';
  var lenAfter = len ? len.value : '';

  return JSON.stringify({
    hasResetFunc: typeof resetPage13 === 'function',
    hasPrintPrepFunc: typeof preparePrintPage13 === 'function',
    areaBefore: areaBefore,
    areaAfter: areaAfter,
    lenAfter: lenAfter,
    hasLogs: logs.filter(l => l.indexOf('RESET') !== -1 || l.indexOf('PRINT') !== -1)
  });
})();
"@

$evalCmd = @{ id = 1; method = "Runtime.evaluate"; params = @{ expression = $jsTest13; returnByValue = $true } }
$evalBytes = [System.Text.Encoding]::UTF8.GetBytes(($evalCmd | ConvertTo-Json -Depth 5 -Compress))
$sock.SendAsync([System.ArraySegment[byte]]$evalBytes, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()
$respText = Receive-WSMessage $sock $cts.Token
$res13 = ($respText | ConvertFrom-Json).result.result.value

$sock.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "ok", $cts.Token).Wait()
if ($p13Proc) { Stop-Process -Id $p13Proc.Id -Force -ErrorAction SilentlyContinue }

Write-Host "Page13 Hotfix Test Result:"
Write-Host $res13

# Test Page11 Reset & PreparePrint
$p11Url = "file:///" + (Join-Path $WD "Page11\index.html").Replace("\", "/")
$p11Proc = Start-Process -FilePath $edgePath -ArgumentList "--headless","--disable-gpu","--remote-debugging-port=$Port","`"$p11Url`"" -PassThru
Start-Sleep -Seconds 4

$cdpPages  = Invoke-RestMethod -Uri "http://localhost:$Port/json"
$cdpTarget = $cdpPages | Where-Object { $_.type -eq "page" } | Select-Object -First 1

$sock = New-Object System.Net.WebSockets.ClientWebSocket
$cts  = New-Object System.Threading.CancellationTokenSource(30000)
$sock.ConnectAsync((New-Object System.Uri($cdpTarget.webSocketDebuggerUrl)), $cts.Token).Wait()

$jsTest11 = @"
(function() {
  var logs = [];
  var origLog = console.log;
  console.log = function() { logs.push(Array.from(arguments).join(' ')); origLog.apply(console, arguments); };

  var l1 = document.getElementById('length1'); if (l1) l1.value = '40';
  var w1 = document.getElementById('width1'); if (w1) w1.value = '30';
  if (typeof calculateGeneral === 'function') calculateGeneral(true);

  var printPrep = typeof preparePrintPage11 === 'function' ? preparePrintPage11() : null;
  if (typeof resetPage11 === 'function') resetPage11();

  var l1After = l1 ? l1.value : '';

  return JSON.stringify({
    hasResetFunc: typeof resetPage11 === 'function',
    hasPrintPrepFunc: typeof preparePrintPage11 === 'function',
    l1After: l1After,
    hasLogs: logs.filter(l => l.indexOf('RESET') !== -1 || l.indexOf('PRINT') !== -1)
  });
})();
"@

$evalCmd = @{ id = 1; method = "Runtime.evaluate"; params = @{ expression = $jsTest11; returnByValue = $true } }
$evalBytes = [System.Text.Encoding]::UTF8.GetBytes(($evalCmd | ConvertTo-Json -Depth 5 -Compress))
$sock.SendAsync([System.ArraySegment[byte]]$evalBytes, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()
$respText11 = Receive-WSMessage $sock $cts.Token
$res11 = ($respText11 | ConvertFrom-Json).result.result.value

$sock.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "ok", $cts.Token).Wait()
if ($p11Proc) { Stop-Process -Id $p11Proc.Id -Force -ErrorAction SilentlyContinue }

Write-Host "Page11 Hotfix Test Result:"
Write-Host $res11
