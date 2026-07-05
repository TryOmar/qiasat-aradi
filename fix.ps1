$lines = Get-Content 'Page11/script.js'
$newLines = @()
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($i -lt 453 -or $i -gt 456) {
        $newLines += $lines[$i]
    }
}
$newLines | Set-Content 'Page11/script.js' -Encoding UTF8
