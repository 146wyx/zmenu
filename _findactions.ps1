$root = $PSScriptRoot
$f = Join-Path $root 'editor-assets\zmenu-editor.js'
$bytes = [System.IO.File]::ReadAllBytes($f)
$text = [System.Text.Encoding]::UTF8.GetString($bytes)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$out = New-Object System.Collections.Generic.List[string]

$idx1 = 1178494
$s = [Math]::Max(0, $idx1 - 800)
$l = [Math]::Min(3000, $text.Length - $s)
[void]$out.Add("===== choose_action_type at $idx1 =====")
[void]$out.Add($text.Substring($s, $l))
[void]$out.Add("----")

$idx2 = 1178650
$s = [Math]::Max(0, $idx2 - 800)
$l = [Math]::Min(3000, $text.Length - $s)
[void]$out.Add("===== add_action at $idx2 =====")
[void]$out.Add($text.Substring($s, $l))
[void]$out.Add("----")

$p = 0
$hits = 0
while ($hits -lt 5) {
    $k = $text.IndexOf("Actions", $p, [System.StringComparison]::Ordinal)
    if ($k -lt 0) { break }
    $s = [Math]::Max(0, $k - 5)
    $l = [Math]::Min(40, $text.Length - $s)
    $ctx = $text.Substring($s, $l)
    if ($ctx -match 'Actions.{0,6}\(') {
        $hits++
        $s2 = [Math]::Max(0, $k - 600)
        $l2 = [Math]::Min(2500, $text.Length - $s2)
        [void]$out.Add("===== Actions_/_paren at $k =====")
        [void]$out.Add($text.Substring($s2, $l2))
        [void]$out.Add("----")
    }
    $p = $k + 7
}
[void]$out.Add("Actions_w/_paren hits: $hits")

$outPath = Join-Path $root '_findactions_out.txt'
[System.IO.File]::WriteAllText($outPath, ([string]::Join("`r`n", $out)), $utf8NoBom)
Write-Output "DONE ($($out.Count) blocks)"
