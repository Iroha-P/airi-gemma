param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [string]$OutputDir = (Join-Path $ProjectRoot 'backups'),
  [ValidateSet('Source', 'PrivateFull')]
  [string]$PackageMode = 'Source',
  [string]$AiriUserDataPath = '',
  [switch]$IncludeNodeModules,
  [switch]$IncludePythonVenv,
  [switch]$KeepExpandedBackup,
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

function New-DirectoryIfMissing {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

function Invoke-CheckedPowerShell {
  param(
    [string]$Name,
    [string[]]$Arguments
  )

  Write-Host "==> $Name"
  $output = & powershell @Arguments 2>&1
  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0) {
    $joined = ($output | ForEach-Object { [string]$_ }) -join [Environment]::NewLine
    throw "$Name failed with exit code $exitCode.$([Environment]::NewLine)$joined"
  }

  return @($output)
}

function Write-Utf8File {
  param(
    [string]$Path,
    [string]$Content
  )

  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

$resolvedProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
New-DirectoryIfMissing -Path $OutputDir
$resolvedOutputDir = (Resolve-Path -LiteralPath $OutputDir).Path

if ($PackageMode -eq 'PrivateFull') {
  $backupScript = Join-Path $resolvedProjectRoot 'scripts\backup-airi.ps1'
  if (-not (Test-Path -LiteralPath $backupScript)) {
    throw "Backup script not found: $backupScript"
  }

  $backupArgs = @(
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    $backupScript,
    '-ProjectRoot',
    $resolvedProjectRoot,
    '-OutputDir',
    $resolvedOutputDir
  )

  if ($AiriUserDataPath) {
    $backupArgs += @('-AiriUserDataPath', $AiriUserDataPath)
  }

  if ($IncludeNodeModules) {
    $backupArgs += '-IncludeNodeModules'
  }

  if ($IncludePythonVenv) {
    $backupArgs += '-IncludePythonVenv'
  }

  $backupOutput = Invoke-CheckedPowerShell -Name 'Create expanded AIRI private backup' -Arguments $backupArgs

  $backupRoot = ''
  foreach ($line in $backupOutput) {
    if ([string]$line -match '^Backup created:\s*(.+)$') {
      $backupRoot = $Matches[1].Trim()
      break
    }
  }

  if (-not $backupRoot -or -not (Test-Path -LiteralPath $backupRoot)) {
    throw "Could not resolve backup folder from backup-airi.ps1 output."
  }
}
else {
  $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $backupRoot = Join-Path $resolvedOutputDir "airi-gemma-backup-$timestamp"
  $projectBackup = Join-Path $backupRoot 'project'
  $manifestPath = Join-Path $backupRoot 'manifest.json'

  New-DirectoryIfMissing -Path $backupRoot

  $projectExcludeDirs = @(
    '.git',
    '.cursor',
    '.gemini',
    '.specstory',
    '.zed',
    'node_modules',
    '.turbo',
    '.cache',
    '.venv',
    'venv',
    '__pycache__',
    'dist',
    'out',
    'build',
    'bundle',
    'coverage',
    'backups',
    'airi-brain',
    'gsv',
    'stt-whisper',
    'stt-funasr',
    'tmp-public-release'
  )

  if ($IncludeNodeModules) {
    $projectExcludeDirs = $projectExcludeDirs | Where-Object { $_ -ne 'node_modules' }
  }

  Write-Host '==> Create expanded AIRI source package'
  $excludePaths = @($projectExcludeDirs | ForEach-Object {
    $_
    Join-Path $resolvedProjectRoot $_
  })
  $robocopyArgs = @(
    $resolvedProjectRoot,
    $projectBackup,
    '/E',
    '/R:1',
    '/W:1',
    '/NFL',
    '/NDL',
    '/NJH',
    '/NJS',
    '/NC',
    '/NS',
    '/XD'
  ) + $excludePaths

  & robocopy @robocopyArgs | Out-Null
  if ($LASTEXITCODE -gt 7) {
    throw "robocopy failed while creating source package with exit code $LASTEXITCODE."
  }

  $manifest = [ordered]@{
    createdAt = (Get-Date).ToString('o')
    projectRoot = $resolvedProjectRoot
    backupRoot = $backupRoot
    packageMode = $PackageMode
    copied = @('project')
    missing = @('local-data')
  }

  $manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $manifestPath -Encoding UTF8
}

$installGuidePath = Join-Path $backupRoot 'INSTALL.zh-CN.md'
$installScriptPath = Join-Path $backupRoot 'install-from-package.ps1'
$packageManifestPath = Join-Path $backupRoot 'package-manifest.json'

$installGuide = @'
# AIRI Gemma Development Package

This package is for moving the current development snapshot to another Windows machine.

It contains:

- project/: source code, docs, scripts, and current uncommitted development progress.
- local-data/: only present when the package was created with -PackageMode PrivateFull.
- manifest.json: backup source, created time, copied items, and missing items.
- package-manifest.json: package metadata.
- install-from-package.ps1: one-click restore and install entrypoint.

By default it does not include node_modules, build outputs, or Python virtual environments. Reinstall dependencies on the target machine.

## Install On A New Machine

Unzip the package first:

```powershell
Expand-Archive D:\AIRI-Backup\airi-gemma-dev-package-YYYYMMDD-HHMMSS.zip -DestinationPath D:\AIRI-Package
```

Then run:

```powershell
powershell -ExecutionPolicy Bypass -File D:\AIRI-Package\install-from-package.ps1 `
  -DestinationRoot F:\project\airi-gemma `
  -ObsidianPath E:\Obsidian\Obsidian.exe
```

If the target folder already contains files and you intentionally want to overwrite it, add -Force.

If you only want to restore files first, add -SkipInstall -SkipTypecheck.

## Modes

- Source: default, suitable for private GitHub Release assets when the zip stays under GitHub limits. It excludes .git, node_modules, build outputs, gsv, STT folders, airi-brain, and private local data.
- PrivateFull: created with -PackageMode PrivateFull. It includes local data discovered by backup-airi.ps1 and is intended for external drives or private cloud storage, not public release.

## Privacy

Do not publish PrivateFull packages directly. Real chat logs, Memory DB, voice assets, model weights, API keys, and local personal paths must be treated as private data.
'@

$installScript = @'
param(
  [string]$DestinationRoot = 'F:\project\airi-gemma',
  [string]$AiriUserDataPath = '',
  [string]$ObsidianPath = '',
  [switch]$CheckEndpoints,
  [switch]$Force,
  [switch]$SkipInstall,
  [switch]$SkipTypecheck
)

$ErrorActionPreference = 'Stop'

function Invoke-Step {
  param(
    [string]$Name,
    [scriptblock]$Script
  )

  Write-Host "==> $Name"
  & $Script
}

function Invoke-CheckedNative {
  param(
    [string]$Name,
    [scriptblock]$Script
  )

  Invoke-Step -Name $Name -Script {
    & $Script
    if ($LASTEXITCODE -ne 0) {
      throw "$Name failed with exit code $LASTEXITCODE."
    }
  }
}

$packageRoot = $PSScriptRoot
$restoreScript = Join-Path $packageRoot 'project\scripts\restore-airi.ps1'

if (-not (Test-Path -LiteralPath $restoreScript)) {
  throw "Restore script not found in package: $restoreScript"
}

$restoreArgs = @(
  '-NoProfile',
  '-ExecutionPolicy',
  'Bypass',
  '-File',
  $restoreScript,
  '-BackupPath',
  $packageRoot,
  '-DestinationRoot',
  $DestinationRoot,
  '-RestoreProject',
  '-RestoreLocalData'
)

if ($AiriUserDataPath) {
  $restoreArgs += @('-AiriUserDataPath', $AiriUserDataPath)
}

if ($Force) {
  $restoreArgs += '-Force'
}

Invoke-CheckedNative -Name 'Restore package contents' -Script {
  & powershell @restoreArgs
}

if (-not $SkipInstall) {
  if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    throw 'pnpm was not found. Install Node.js and pnpm first, or re-run with -SkipInstall.'
  }

  Invoke-CheckedNative -Name 'Install pnpm dependencies' -Script {
    & pnpm -C $DestinationRoot install
  }
}

$migrationCheck = Join-Path $DestinationRoot 'scripts\check-airi-migration.ps1'
if (Test-Path -LiteralPath $migrationCheck) {
  Invoke-CheckedNative -Name 'Run migration preflight' -Script {
    & powershell -NoProfile -ExecutionPolicy Bypass -File $migrationCheck -ProjectRoot $DestinationRoot
  }
}

$localServicesCheck = Join-Path $DestinationRoot 'scripts\check-airi-local-services.ps1'
if (Test-Path -LiteralPath $localServicesCheck) {
  $localArgs = @(
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    $localServicesCheck,
    '-ProjectRoot',
    $DestinationRoot
  )

  if ($ObsidianPath) {
    $localArgs += @('-ObsidianPath', $ObsidianPath)
  }

  if ($CheckEndpoints) {
    $localArgs += '-CheckEndpoints'
  }

  Invoke-CheckedNative -Name 'Run local service preflight' -Script {
    & powershell @localArgs
  }
}

if (-not $SkipTypecheck) {
  Invoke-CheckedNative -Name 'Run stage-tamagotchi typecheck' -Script {
    & pnpm -C $DestinationRoot -F '@proj-airi/stage-tamagotchi' typecheck
  }
}

$summary = [ordered]@{
  installedAt = (Get-Date).ToString('o')
  packageRoot = $packageRoot
  destinationRoot = $DestinationRoot
  restoredLocalData = $true
  installSkipped = [bool]$SkipInstall
  typecheckSkipped = [bool]$SkipTypecheck
}

Write-Host ($summary | ConvertTo-Json -Depth 5)
'@

Write-Utf8File -Path $installGuidePath -Content $installGuide
Write-Utf8File -Path $installScriptPath -Content $installScript

$packageName = (Split-Path -Leaf $backupRoot) -replace '^airi-gemma-backup-', 'airi-gemma-dev-package-'
$zipPath = Join-Path $resolvedOutputDir "$packageName.zip"

if ((Test-Path -LiteralPath $zipPath) -and -not $Force) {
  throw "Package zip already exists: $zipPath. Re-run with -Force to overwrite it."
}

$packageManifest = [ordered]@{
  createdAt = (Get-Date).ToString('o')
  projectRoot = $resolvedProjectRoot
  backupRoot = $backupRoot
  zipPath = $zipPath
  packageMode = $PackageMode
  includesCurrentWorkingTree = $true
  includeNodeModules = [bool]$IncludeNodeModules
  includePythonVenv = [bool]$IncludePythonVenv
  installScript = 'install-from-package.ps1'
  installGuide = 'INSTALL.zh-CN.md'
  privacy = [ordered]@{
    intendedForPrivateMigration = $true
    suitableForPublicRelease = ($PackageMode -eq 'Source')
  }
}

$packageManifest | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $packageManifestPath -Encoding UTF8

$archiveItems = @(Get-ChildItem -LiteralPath $backupRoot -Force)
if ($archiveItems.Count -eq 0) {
  throw "Backup folder is empty: $backupRoot"
}

Compress-Archive -Path ($archiveItems | Select-Object -ExpandProperty FullName) -DestinationPath $zipPath -Force:$Force

if (-not $KeepExpandedBackup) {
  Remove-Item -LiteralPath $backupRoot -Recurse -Force
}

$summary = [ordered]@{
  createdAt = (Get-Date).ToString('o')
  projectRoot = $resolvedProjectRoot
  outputDir = $resolvedOutputDir
  zipPath = $zipPath
  packageMode = $PackageMode
  expandedBackupKept = [bool]$KeepExpandedBackup
  backupRoot = if ($KeepExpandedBackup) { $backupRoot } else { '' }
  includeNodeModules = [bool]$IncludeNodeModules
  includePythonVenv = [bool]$IncludePythonVenv
  installScript = 'install-from-package.ps1'
  installGuide = 'INSTALL.zh-CN.md'
}

Write-Host ($summary | ConvertTo-Json -Depth 6)
