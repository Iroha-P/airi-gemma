param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [string[]]$IncludePaths = @('docs/ai', 'scripts/training', 'README.md', 'README.zh-CN.deploy.md'),
  [string]$OutputPath = ''
)

$ErrorActionPreference = 'Stop'

function ConvertTo-RelativePath {
  param(
    [string]$Root,
    [string]$Path
  )

  $rootUri = [Uri]((Resolve-Path -LiteralPath $Root).Path.TrimEnd('\') + '\')
  $pathUri = [Uri](Resolve-Path -LiteralPath $Path).Path
  [Uri]::UnescapeDataString($rootUri.MakeRelativeUri($pathUri).ToString()).Replace('/', '\')
}

function Get-ScannableFiles {
  param(
    [string]$Root,
    [string[]]$Paths
  )

  $extensions = @('.md', '.txt', '.json', '.jsonl', '.yaml', '.yml')
  $excludedSegments = @('\.git\', '\node_modules\', '\dist\', '\out\', '\build\', '\coverage\')
  $excludedRelativePaths = @('docs\ai\OPEN_SOURCE_PRIVACY_CHECKLIST.zh-CN.md')
  $files = New-Object System.Collections.Generic.List[string]

  foreach ($path in $Paths) {
    $candidate = Join-Path $Root $path
    if (-not (Test-Path -LiteralPath $candidate)) {
      continue
    }

    $item = Get-Item -LiteralPath $candidate
    if (-not $item.PSIsContainer) {
      $relativePath = ConvertTo-RelativePath -Root $Root -Path $item.FullName
      if (($extensions -contains $item.Extension.ToLowerInvariant()) -and -not ($excludedRelativePaths -contains $relativePath)) {
        $files.Add($item.FullName)
      }
      continue
    }

    Get-ChildItem -LiteralPath $item.FullName -File -Recurse -ErrorAction SilentlyContinue |
      Where-Object {
        $fullName = $_.FullName
        $relativePath = ConvertTo-RelativePath -Root $Root -Path $fullName
        ($extensions -contains $_.Extension.ToLowerInvariant()) -and
        -not ($excludedSegments | Where-Object { $fullName -like "*$_*" }) -and
        -not ($excludedRelativePaths -contains $relativePath)
      } |
      ForEach-Object { $files.Add($_.FullName) }
  }

  $files.ToArray() | Sort-Object -Unique
}

function New-Finding {
  param(
    [string]$RuleId,
    [string]$Severity,
    [string]$Path,
    [int]$Line,
    [string]$Snippet
  )

  $normalizedSnippet = $Snippet.Trim()
  if ($normalizedSnippet.Length -gt 160) {
    $normalizedSnippet = $normalizedSnippet.Substring(0, 157) + '...'
  }

  [ordered]@{
    ruleId = $RuleId
    severity = $Severity
    path = $Path
    line = $Line
    snippet = $normalizedSnippet
  }
}

$resolvedProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$rules = @(
  @{
    Id = 'local_absolute_path'
    Severity = 'blocker'
    Pattern = '(?i)([A-Z]:\\(?:Users|project|private|Downloads?|Desktop)\\|/Users/[^/\s]+|/home/[^/\s]+)'
  },
  @{
    Id = 'credential_keyword'
    Severity = 'blocker'
    Pattern = @'
(?i)(\b(?:api[_-]?key|access[_-]?token|secret[_-]?key|password)\b\s*[:=]\s*["']?(?!<|your-|example|xxx|redacted)[^\s"',`]{8,}|bearer\s+[a-z0-9._-]{12,})
'@
  },
  @{
    Id = 'private_identity_profile'
    Severity = 'blocker'
    Pattern = '(?i)(\bfdu\b|\u590d\u65e6|\u571f\u6728|\u667a\u80fd\u673a\u5668\u4eba\u4e0e\u5148\u8fdb\u5236\u9020|\u8f6c\u7801|weimi)'
  },
  @{
    Id = 'raw_chat_marker'
    Severity = 'warning'
    Pattern = '(\[\u5fae\u4fe1\]|\[\u98de\u4e66\]|\[QQ\]|\u804a\u5929\u539f\u6587|\u539f\u59cb\u804a\u5929\u8bb0\u5f55|\u672a\u8131\u654f\u804a\u5929)'
  },
  @{
    Id = 'personal_account_marker'
    Severity = 'blocker'
    Pattern = '(?i)(\b1[3-9]\d{9}\b|\b\d{17}[\dXx]\b|\b\d{6,}@qq\.com\b|(?:\u5fae\u4fe1\u53f7|\u5b66\u53f7)\s*[:\uff1a]\s*\S{4,})'
  }
)

$findings = New-Object System.Collections.Generic.List[object]
$files = Get-ScannableFiles -Root $resolvedProjectRoot -Paths $IncludePaths

foreach ($file in $files) {
  $relativePath = ConvertTo-RelativePath -Root $resolvedProjectRoot -Path $file
  $lineNumber = 0

  foreach ($line in [System.IO.File]::ReadLines($file)) {
    $lineNumber += 1

    foreach ($rule in $rules) {
      if ($line -match $rule.Pattern) {
        $findings.Add((New-Finding `
          -RuleId $rule.Id `
          -Severity $rule.Severity `
          -Path $relativePath `
          -Line $lineNumber `
          -Snippet $line))
      }
    }
  }
}

$findingArray = $findings.ToArray()
$blockers = @($findingArray | Where-Object { $_.severity -eq 'blocker' })
$warnings = @($findingArray | Where-Object { $_.severity -eq 'warning' })

$report = [ordered]@{
  checkedAt = (Get-Date).ToString('o')
  projectRoot = $resolvedProjectRoot
  includePaths = $IncludePaths
  scannedFiles = @($files).Count
  releaseReady = ($blockers.Count -eq 0)
  blockerCount = $blockers.Count
  warningCount = $warnings.Count
  findings = $findingArray
}

$json = $report | ConvertTo-Json -Depth 6

if ($OutputPath) {
  $outputParent = Split-Path -Parent $OutputPath
  if ($outputParent -and -not (Test-Path -LiteralPath $outputParent)) {
    New-Item -ItemType Directory -Path $outputParent | Out-Null
  }

  $json | Set-Content -LiteralPath $OutputPath -Encoding UTF8
  Write-Host "Open-source check report: $OutputPath"
}

Write-Host $json
