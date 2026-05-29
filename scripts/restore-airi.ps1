param(
  [Parameter(Mandatory = $true)]
  [string]$BackupPath,
  [string]$DestinationRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [string]$AiriUserDataPath = '',
  [switch]$RestoreProject,
  [switch]$RestoreLocalData,
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

function New-DirectoryIfMissing {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
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

function Copy-DirectorySafe {
  param(
    [string]$Source,
    [string]$Destination,
    [switch]$Overwrite
  )

  if (-not (Test-Path -LiteralPath $Source)) {
    return $false
  }

  if ((Test-Path -LiteralPath $Destination) -and -not $Overwrite -and -not (Test-DirectoryIsEmpty -Path $Destination)) {
    throw "Destination already exists: $Destination. Re-run with -Force if you want to overwrite it."
  }

  New-DirectoryIfMissing -Path $Destination
  foreach ($item in Get-ChildItem -LiteralPath $Source -Force) {
    Copy-Item -LiteralPath $item.FullName -Destination $Destination -Recurse -Force
  }
  return $true
}

function Copy-FileSafe {
  param(
    [string]$Source,
    [string]$Destination,
    [switch]$Overwrite
  )

  if (-not (Test-Path -LiteralPath $Source)) {
    return $false
  }

  if ((Test-Path -LiteralPath $Destination) -and -not $Overwrite) {
    throw "Destination already exists: $Destination. Re-run with -Force if you want to overwrite it."
  }

  New-DirectoryIfMissing -Path (Split-Path -Parent $Destination)
  Copy-Item -LiteralPath $Source -Destination $Destination -Force
  return $true
}

function Get-DefaultAiriUserDataPath {
  $appData = [Environment]::GetFolderPath('ApplicationData')
  if (-not $appData) {
    return ''
  }

  return Join-Path $appData 'AIRI'
}

$resolvedBackup = (Resolve-Path -LiteralPath $BackupPath).Path
$manifestPath = Join-Path $resolvedBackup 'manifest.json'
$projectBackup = Join-Path $resolvedBackup 'project'
$localDataBackup = Join-Path $resolvedBackup 'local-data'

if (-not (Test-Path -LiteralPath $manifestPath)) {
  throw "Backup manifest not found: $manifestPath"
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json

if (-not $RestoreProject -and -not $RestoreLocalData) {
  $RestoreProject = $true
  $RestoreLocalData = $true
}

if ($RestoreProject) {
  Copy-DirectorySafe -Source $projectBackup -Destination $DestinationRoot -Overwrite:$Force | Out-Null
  Write-Host "Project restored to: $DestinationRoot"
}

if ($RestoreLocalData) {
  foreach ($name in @('gsv', 'airi-brain', 'stt-whisper', 'stt-funasr')) {
    $source = Join-Path $localDataBackup $name
    $destination = Join-Path $DestinationRoot $name
    if (Copy-DirectorySafe -Source $source -Destination $destination -Overwrite:$Force) {
      Write-Host "Restored: $name"
    }
  }

  $oneClickStartScript = [string]::Concat([char]0x4E00, [char]0x952E, [char]0x542F, [char]0x52A8, '.bat')
  $oneClickStopScript = [string]::Concat([char]0x4E00, [char]0x952E, [char]0x5173, [char]0x95ED, '.bat')

  foreach ($name in @('start.bat', $oneClickStartScript, $oneClickStopScript)) {
    $source = Join-Path $localDataBackup $name
    $destination = Join-Path $DestinationRoot $name
    if (Copy-FileSafe -Source $source -Destination $destination -Overwrite:$Force) {
      Write-Host "Restored: $name"
    }
  }

  $userDataSource = Join-Path $localDataBackup 'airi-user-data'
  $resolvedUserData = $AiriUserDataPath
  if (-not $resolvedUserData) {
    $resolvedUserData = Get-DefaultAiriUserDataPath
  }

  if ($resolvedUserData) {
    if (Copy-DirectorySafe -Source $userDataSource -Destination $resolvedUserData -Overwrite:$Force) {
      Write-Host "AIRI userData restored to: $resolvedUserData"
    }
  }
}

Write-Host "Restore complete."
