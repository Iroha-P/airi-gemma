param(
  [Parameter(Mandatory = $true)]
  [string]$RepoUrl,
  [string]$DestinationRoot = 'F:\project\airi-gemma',
  [string]$Branch = '',
  [string]$BackupPath = '',
  [string]$ObsidianPath = '',
  [switch]$CheckEndpoints,
  [switch]$ForceRestore,
  [switch]$SkipInstall,
  [switch]$SkipTypecheck,
  [switch]$SkipPull,
  [string]$SummaryPath = ''
)

$ErrorActionPreference = 'Stop'

function Test-CommandAvailable {
  param([string]$Name)

  if (-not (Get-Command -Name $Name -ErrorAction SilentlyContinue)) {
    throw "Required command was not found: $Name"
  }
}

function Test-DirectoryIsEmpty {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    return $true
  }

  $item = Get-Item -LiteralPath $Path
  if (-not $item.PSIsContainer) {
    return $false
  }

  $child = Get-ChildItem -LiteralPath $Path -Force -ErrorAction SilentlyContinue | Select-Object -First 1
  return $null -eq $child
}

function Invoke-Step {
  param(
    [string]$Name,
    [scriptblock]$Script
  )

  Write-Host "==> $Name"
  & $Script
}

Test-CommandAvailable -Name 'git'
Test-CommandAvailable -Name 'pnpm'

$destinationParent = Split-Path -Parent $DestinationRoot
if ($destinationParent -and -not (Test-Path -LiteralPath $destinationParent)) {
  New-Item -ItemType Directory -Path $destinationParent | Out-Null
}

$resolvedDestination = $DestinationRoot
$gitDir = Join-Path $resolvedDestination '.git'

if (Test-Path -LiteralPath $gitDir) {
  Invoke-Step -Name 'Use existing Git checkout' -Script {
    Write-Host "Project already exists: $resolvedDestination"
  }

  if (-not $SkipPull) {
    $dirty = @(& git -C $resolvedDestination status --porcelain)
    if ($dirty.Count -gt 0) {
      Write-Host 'Existing checkout has local changes; skipping git pull.'
    }
    else {
      Invoke-Step -Name 'Pull latest repository changes' -Script {
        & git -C $resolvedDestination pull --rebase
      }
    }
  }
}
else {
  if (-not (Test-DirectoryIsEmpty -Path $resolvedDestination)) {
    throw "Destination is not empty and is not a Git checkout: $resolvedDestination"
  }

  $cloneArgs = @('clone')
  if ($Branch) {
    $cloneArgs += @('--branch', $Branch)
  }
  $cloneArgs += @($RepoUrl, $resolvedDestination)

  Invoke-Step -Name 'Clone GitHub repository' -Script {
    & git @cloneArgs
  }
}

$resolvedDestination = (Resolve-Path -LiteralPath $resolvedDestination).Path

if (-not $SkipInstall) {
  Invoke-Step -Name 'Install pnpm dependencies' -Script {
    & pnpm -C $resolvedDestination install
  }
}

if ($BackupPath) {
  $restoreScript = Join-Path $resolvedDestination 'scripts\restore-airi.ps1'
  if (-not (Test-Path -LiteralPath $restoreScript)) {
    throw "Restore script not found after clone: $restoreScript"
  }

  $restoreArgs = @(
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    $restoreScript,
    '-BackupPath',
    $BackupPath,
    '-DestinationRoot',
    $resolvedDestination,
    '-RestoreLocalData'
  )

  if ($ForceRestore) {
    $restoreArgs += '-Force'
  }

  Invoke-Step -Name 'Restore local AIRI data from backup' -Script {
    & powershell @restoreArgs
  }
}

$migrationCheckScript = Join-Path $resolvedDestination 'scripts\check-airi-migration.ps1'
$localServicesScript = Join-Path $resolvedDestination 'scripts\check-airi-local-services.ps1'

Invoke-Step -Name 'Run migration preflight' -Script {
  & powershell -ExecutionPolicy Bypass -File $migrationCheckScript -ProjectRoot $resolvedDestination
}

$localServiceArgs = @(
  '-ExecutionPolicy',
  'Bypass',
  '-File',
  $localServicesScript,
  '-ProjectRoot',
  $resolvedDestination
)

if ($ObsidianPath) {
  $localServiceArgs += @('-ObsidianPath', $ObsidianPath)
}
if ($CheckEndpoints) {
  $localServiceArgs += '-CheckEndpoints'
}

Invoke-Step -Name 'Run local service preflight' -Script {
  & powershell @localServiceArgs
}

if (-not $SkipTypecheck) {
  Invoke-Step -Name 'Run desktop typecheck' -Script {
    & pnpm -C $resolvedDestination -F '@proj-airi/stage-tamagotchi' typecheck
  }
}

$summary = [ordered]@{
  completedAt = (Get-Date).ToString('o')
  repoUrl = $RepoUrl
  branch = $Branch
  destinationRoot = $resolvedDestination
  backupPath = $BackupPath
  installSkipped = [bool]$SkipInstall
  typecheckSkipped = [bool]$SkipTypecheck
  localDataRestoreRequested = [bool]$BackupPath
}

if ($SummaryPath) {
  $summaryDir = Split-Path -Parent $SummaryPath
  if ($summaryDir -and -not (Test-Path -LiteralPath $summaryDir)) {
    New-Item -ItemType Directory -Path $summaryDir | Out-Null
  }
  $summary | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $SummaryPath -Encoding UTF8
}

$summary | ConvertTo-Json -Depth 4
