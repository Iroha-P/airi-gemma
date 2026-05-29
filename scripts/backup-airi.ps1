param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [string]$OutputDir = (Join-Path $ProjectRoot 'backups'),
  [string]$AiriUserDataPath = '',
  [switch]$IncludeNodeModules,
  [switch]$IncludePythonVenv
)

$ErrorActionPreference = 'Stop'

function New-DirectoryIfMissing {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

function Copy-DirectoryIfExists {
  param(
    [string]$Source,
    [string]$Destination,
    [string[]]$Exclude = @()
  )

  if (-not (Test-Path -LiteralPath $Source)) {
    return $false
  }

  New-DirectoryIfMissing -Path (Split-Path -Parent $Destination)
  Copy-Item -LiteralPath $Source -Destination $Destination -Recurse -Force -Exclude $Exclude
  return $true
}

function Copy-FileIfExists {
  param(
    [string]$Source,
    [string]$Destination
  )

  if (-not (Test-Path -LiteralPath $Source)) {
    return $false
  }

  New-DirectoryIfMissing -Path (Split-Path -Parent $Destination)
  Copy-Item -LiteralPath $Source -Destination $Destination -Force
  return $true
}

function Remove-DirectoryIfExists {
  param([string]$Path)

  if (Test-Path -LiteralPath $Path) {
    Remove-Item -LiteralPath $Path -Recurse -Force
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

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupRoot = Join-Path $OutputDir "airi-gemma-backup-$timestamp"
$projectBackup = Join-Path $backupRoot 'project'
$localDataBackup = Join-Path $backupRoot 'local-data'
$manifestPath = Join-Path $backupRoot 'manifest.json'
$copied = New-Object System.Collections.Generic.List[string]
$missing = New-Object System.Collections.Generic.List[string]

New-DirectoryIfMissing -Path $backupRoot

$projectExcludes = @(
  'node_modules',
  '.turbo',
  '.cache',
  'dist',
  'out',
  'build',
  'bundle',
  'coverage',
  'backups',
  'airi-brain'
)

if ($IncludeNodeModules) {
  $projectExcludes = $projectExcludes | Where-Object { $_ -ne 'node_modules' }
}

Copy-Item -LiteralPath $ProjectRoot -Destination $projectBackup -Recurse -Force -Exclude $projectExcludes
foreach ($name in @('node_modules', '.turbo', '.cache', 'dist', 'out', 'build', 'bundle', 'coverage', 'backups', 'airi-brain')) {
  if ($IncludeNodeModules -and $name -eq 'node_modules') {
    continue
  }

  Remove-DirectoryIfExists -Path (Join-Path $projectBackup $name)
}
$copied.Add('project')

$localDirectories = @('gsv', 'airi-brain')
foreach ($name in $localDirectories) {
  $source = Join-Path $ProjectRoot $name
  $destination = Join-Path $localDataBackup $name
  if (Copy-DirectoryIfExists -Source $source -Destination $destination) {
    $copied.Add($name)
  }
  else {
    $missing.Add($name)
  }
}

$pythonServiceExcludes = if ($IncludePythonVenv) {
  @()
}
else {
  @('Include', 'Lib', 'Scripts', 'share', 'pyvenv.cfg', '__pycache__')
}

foreach ($name in @('stt-whisper', 'stt-funasr')) {
  $source = Join-Path $ProjectRoot $name
  $destination = Join-Path $localDataBackup $name
  if (Copy-DirectoryIfExists -Source $source -Destination $destination -Exclude $pythonServiceExcludes) {
    $copied.Add($name)
  }
  else {
    $missing.Add($name)
  }
}

$oneClickStartScript = [string]::Concat([char]0x4E00, [char]0x952E, [char]0x542F, [char]0x52A8, '.bat')
$oneClickStopScript = [string]::Concat([char]0x4E00, [char]0x952E, [char]0x5173, [char]0x95ED, '.bat')

foreach ($name in @('start.bat', $oneClickStartScript, $oneClickStopScript)) {
  $source = Join-Path $ProjectRoot $name
  $destination = Join-Path $localDataBackup $name
  if (Copy-FileIfExists -Source $source -Destination $destination) {
    $copied.Add($name)
  }
  else {
    $missing.Add($name)
  }
}

$resolvedUserData = $AiriUserDataPath
if (-not $resolvedUserData) {
  $resolvedUserData = @(Find-AiriUserDataCandidates)[0]
}

if ($resolvedUserData -and (Test-Path -LiteralPath $resolvedUserData)) {
  Copy-DirectoryIfExists -Source $resolvedUserData -Destination (Join-Path $localDataBackup 'airi-user-data') | Out-Null
  $copied.Add('airi-user-data')
}
else {
  $missing.Add('airi-user-data')
}

$manifest = [ordered]@{
  createdAt = (Get-Date).ToString('o')
  projectRoot = $ProjectRoot
  backupRoot = $backupRoot
  airiUserDataPath = $resolvedUserData
  includeNodeModules = [bool]$IncludeNodeModules
  includePythonVenv = [bool]$IncludePythonVenv
  copied = @($copied)
  missing = @($missing)
}

$manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $manifestPath -Encoding UTF8

Write-Host "Backup created: $backupRoot"
Write-Host "Manifest: $manifestPath"
if ($missing.Count -gt 0) {
  Write-Host "Missing or skipped items: $($missing -join ', ')"
}
