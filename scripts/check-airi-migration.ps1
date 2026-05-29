param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [string]$AiriUserDataPath = '',
  [string]$OutputPath = ''
)

$ErrorActionPreference = 'Stop'

function Test-PathItem {
  param(
    [string]$Label,
    [string]$Path,
    [string]$Kind,
    [bool]$Required
  )

  $exists = Test-Path -LiteralPath $Path

  [ordered]@{
    label = $Label
    path = $Path
    kind = $Kind
    required = $Required
    exists = $exists
  }
}

function Test-CommandItem {
  param(
    [string]$Label,
    [string]$Name,
    [bool]$Required
  )

  $command = Get-Command -Name $Name -ErrorAction SilentlyContinue

  [ordered]@{
    label = $Label
    path = if ($command) { $command.Source } else { $Name }
    kind = 'command'
    required = $Required
    exists = [bool]$command
  }
}

function Find-AiriUserDataCandidates {
  $appData = [Environment]::GetFolderPath('ApplicationData')
  if (-not $appData -or -not (Test-Path -LiteralPath $appData)) {
    return @()
  }

  Get-ChildItem -LiteralPath $appData -Directory -ErrorAction SilentlyContinue |
    Where-Object {
      $_.Name -match 'airi|stage|tamagotchi' -and
      (Test-Path -LiteralPath (Join-Path $_.FullName 'memory\pglite'))
    } |
    Select-Object -ExpandProperty FullName
}

function Get-GitStatusSummary {
  param([string]$Path)

  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $insideWorkTree = & git -C $Path rev-parse --is-inside-work-tree 2>$null
    if ($LASTEXITCODE -ne 0 -or $insideWorkTree -ne 'true') {
      return [ordered]@{
        isRepository = $false
        changed = 0
        untracked = 0
        modified = 0
        staged = 0
      }
    }

    $statusLines = @(& git -C $Path status --porcelain 2>$null)
    if ($LASTEXITCODE -ne 0) {
      $statusLines = @()
    }
  }
  finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }

  $untracked = 0
  $modified = 0
  $staged = 0

  foreach ($line in $statusLines) {
    if ($line.StartsWith('??')) {
      $untracked += 1
      continue
    }

    if ($line.Length -ge 1 -and $line[0] -ne ' ') {
      $staged += 1
    }

    if ($line.Length -ge 2 -and $line[1] -ne ' ') {
      $modified += 1
    }
  }

  [ordered]@{
    isRepository = $true
    changed = $statusLines.Count
    untracked = $untracked
    modified = $modified
    staged = $staged
  }
}

$resolvedProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$resolvedUserData = $AiriUserDataPath
if (-not $resolvedUserData) {
  $resolvedUserData = @(Find-AiriUserDataCandidates)[0]
}

$oneClickStartScript = [string]::Concat([char]0x4E00, [char]0x952E, [char]0x542F, [char]0x52A8, '.bat')
$oneClickStopScript = [string]::Concat([char]0x4E00, [char]0x952E, [char]0x5173, [char]0x95ED, '.bat')
$items = New-Object System.Collections.Generic.List[object]

$requiredFiles = @(
  @{ Label = 'pnpm lockfile'; Path = 'pnpm-lock.yaml' },
  @{ Label = 'migration guide'; Path = 'docs/ai/MIGRATION.zh-CN.md' },
  @{ Label = 'main design document'; Path = 'docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md' },
  @{ Label = 'one-week migration plan'; Path = 'docs/ai/graduation-delivery-plan.zh-CN.md' },
  @{ Label = 'backup script'; Path = 'scripts/backup-airi.ps1' },
  @{ Label = 'restore script'; Path = 'scripts/restore-airi.ps1' },
  @{ Label = 'GitHub bootstrap script'; Path = 'scripts/bootstrap-airi-from-github.ps1' },
  @{ Label = 'development package script'; Path = 'scripts/create-airi-dev-package.ps1' },
  @{ Label = 'migration check script'; Path = 'scripts/check-airi-migration.ps1' },
  @{ Label = 'open-source privacy check script'; Path = 'scripts/check-airi-open-source.ps1' },
  @{ Label = 'local services check script'; Path = 'scripts/check-airi-local-services.ps1' },
  @{ Label = 'Obsidian vault check script'; Path = 'scripts/check-airi-obsidian-vault.ps1' },
  @{ Label = 'readiness collection script'; Path = 'scripts/collect-airi-readiness.ps1' },
  @{ Label = 'migration smoke script'; Path = 'scripts/run-airi-migration-smoke.ps1' },
  @{ Label = 'sanitized demo data script'; Path = 'scripts/create-airi-sanitized-demo-data.ps1' },
  @{ Label = 'public profile sample script'; Path = 'scripts/create-airi-public-profile-sample.ps1' },
  @{ Label = 'public release package script'; Path = 'scripts/create-airi-public-release.ps1' },
  @{ Label = 'open-source privacy checklist'; Path = 'docs/ai/OPEN_SOURCE_PRIVACY_CHECKLIST.zh-CN.md' },
  @{ Label = 'public profile template'; Path = 'docs/ai/PUBLIC_PROFILE_TEMPLATE.zh-CN.md' },
  @{ Label = 'start script'; Path = 'start.bat' },
  @{ Label = 'one-click start script'; Path = $oneClickStartScript },
  @{ Label = 'one-click stop script'; Path = $oneClickStopScript }
)

foreach ($file in $requiredFiles) {
  $items.Add((Test-PathItem `
    -Label $file.Label `
    -Path (Join-Path $resolvedProjectRoot $file.Path) `
    -Kind 'file' `
    -Required $true))
}

$recommendedDirectories = @(
  @{ Label = 'AI docs'; Path = 'docs/ai' },
  @{ Label = 'superpowers plans'; Path = 'docs/superpowers' },
  @{ Label = 'GPT-SoVITS workspace'; Path = 'gsv' },
  @{ Label = 'Whisper STT service'; Path = 'stt-whisper' },
  @{ Label = 'FunASR STT service'; Path = 'stt-funasr' }
)

foreach ($directory in $recommendedDirectories) {
  $items.Add((Test-PathItem `
    -Label $directory.Label `
    -Path (Join-Path $resolvedProjectRoot $directory.Path) `
    -Kind 'directory' `
    -Required $false))
}

$recommendedCommands = @(
  @{ Label = 'Git command'; Name = 'git' },
  @{ Label = 'Node.js command'; Name = 'node' },
  @{ Label = 'pnpm command'; Name = 'pnpm' },
  @{ Label = 'Python command'; Name = 'python' }
)

foreach ($command in $recommendedCommands) {
  $items.Add((Test-CommandItem `
    -Label $command.Label `
    -Name $command.Name `
    -Required $false))
}

if ($resolvedUserData) {
  $items.Add((Test-PathItem `
    -Label 'AIRI userData memory store' `
    -Path $resolvedUserData `
    -Kind 'directory' `
    -Required $false))
}
else {
  $items.Add([ordered]@{
    label = 'AIRI userData memory store'
    path = ''
    kind = 'directory'
    required = $false
    exists = $false
  })
}

$missingRequired = New-Object System.Collections.Generic.List[object]
$missingRecommended = New-Object System.Collections.Generic.List[object]
$missingRequiredLabels = New-Object System.Collections.Generic.List[string]
$missingRecommendedLabels = New-Object System.Collections.Generic.List[string]

foreach ($item in $items) {
  if ($item.required -and -not $item.exists) {
    $missingRequired.Add($item)
    $missingRequiredLabels.Add([string]$item.label)
  }
  elseif (-not $item.required -and -not $item.exists) {
    $missingRecommended.Add($item)
    $missingRecommendedLabels.Add([string]$item.label)
  }
}

$missingRequiredLabelArray = $missingRequiredLabels.ToArray()
$missingRecommendedLabelArray = $missingRecommendedLabels.ToArray()
$itemArray = $items.ToArray()

$report = [ordered]@{
  checkedAt = (Get-Date).ToString('o')
  projectRoot = $resolvedProjectRoot
  airiUserDataPath = $resolvedUserData
  gitStatus = Get-GitStatusSummary -Path $resolvedProjectRoot
  ready = ($missingRequired.Count -eq 0)
  missingRequired = $missingRequiredLabelArray
  missingRecommended = $missingRecommendedLabelArray
  items = $itemArray
}

$json = $report | ConvertTo-Json -Depth 6

if ($OutputPath) {
  $outputParent = Split-Path -Parent $OutputPath
  if ($outputParent -and -not (Test-Path -LiteralPath $outputParent)) {
    New-Item -ItemType Directory -Path $outputParent | Out-Null
  }

  $json | Set-Content -LiteralPath $OutputPath -Encoding UTF8
  Write-Host "Migration check report: $OutputPath"
}

Write-Host $json
