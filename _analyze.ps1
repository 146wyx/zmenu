$root = $PSScriptRoot
$f = Join-Path $root 'editor-assets\zmenu-editor.js'
$text = [System.IO.File]::ReadAllText($f)

# 1) find _actionTypes = [...]
$marker = '_actionTypes=['
$idx = $text.IndexOf($marker)
Write-Host "_actionTypes found at char index: $idx"
if ($idx -ge 0) {
    $start = $idx + $marker.Length - 1
    # find matching closing bracket for the array
    $depth = 0
    $inString = $null
    $end = -1
    $escaped = $false
    for ($i = $start; $i -lt $text.Length; $i++) {
        $ch = $text[$i]
        if ($inString) {
            if ($escaped) { $escaped = $false; continue }
            if ($ch -eq '\') { $escaped = $true; continue }
            if ($ch -eq $inString) { $inString = $null }
            continue
        }
        if ($ch -eq '"' -or $ch -eq "'" -or $ch -eq '`') { $inString = $ch; continue }
        if ($ch -eq '[') { $depth++ }
        elseif ($ch -eq ']') {
            $depth--
            if ($depth -eq 0) { $end = $i; break }
        }
    }
    if ($end -gt 0) {
        $len = $end - $start + 1
        $sub = $text.Substring($start, $len)
        Write-Host "----- _actionTypes array (length=$len) -----"
        # pretty-print: break after commas between items, keep short
        $pretty = $sub -replace '(\},\{)', ('}' + "`n" + '{')
        $pretty
        # save for external use
        $outPath = Join-Path $root '_actionTypes_raw.txt'
        [System.IO.File]::WriteAllText($outPath, $pretty)
        Write-Host "Saved raw to: $outPath"
    }
}

Write-Host ""
Write-Host "============================================================"

# 2) find "添加操作" or "Add an action" or "ADD AN ACTION"
$markers = @('添加操作','Add an action','ADD AN ACTION','addAction','add_action')
foreach ($m in $markers) {
    $indices = @()
    $p = 0
    while ($true) {
        $k = $text.IndexOf($m, $p)
        if ($k -lt 0) { break }
        $indices += $k
        $p = $k + 1
    }
    if ($indices.Count -gt 0) {
        Write-Host "Marker '$m' found at char indices: $($indices -join ', ')"
        foreach ($ki in $indices) {
            $s = [Math]::Max(0, $ki - 150)
            $l = [Math]::Min(500, $text.Length - $s)
            Write-Host "--- context around $ki ---"
            $text.Substring($s, $l)
            Write-Host ""
        }
    }
}

Write-Host ""
Write-Host "============================================================"

# 3) find action.type or actions.map or actions.
$marker2 = 'actions.map'
$idx2 = $text.IndexOf($marker2)
if ($idx2 -ge 0) {
    Write-Host "'actions.map' found at $idx2"
    $s = [Math]::Max(0, $idx2 - 200)
    $l = [Math]::Min(800, $text.Length - $s)
    $text.Substring($s, $l)
} else {
    Write-Host "'actions.map' NOT found; trying '.map(' and 'action' nearby ..."
    $p = 0
    $count = 0
    while ($count -lt 3) {
        $k = $text.IndexOf('.map(', $p)
        if ($k -lt 0) { break }
        # check context has action
        $ctxStart = [Math]::Max(0, $k - 100)
        $ctxLen = [Math]::Min(200, $text.Length - $ctxStart)
        $ctx = $text.Substring($ctxStart, $ctxLen)
        if ($ctx -match 'action') {
            Write-Host "--- .map( at $k with 'action' context ---"
            $ctx
            Write-Host ""
            $count++
        }
        $p = $k + 1
    }
}
