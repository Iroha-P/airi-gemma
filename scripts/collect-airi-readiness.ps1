param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [string]$OutputDir = '',
  [string]$AiriUserDataPath = '',
  [string]$ObsidianPath = '',
  [string]$VaultPath = '',
  [switch]$CheckEndpoints
)

$ErrorActionPreference = 'Stop'

function New-DefaultOutputDir {
  param([string]$Root)

  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  Join-Path $Root (Join-Path 'airi-brain' (Join-Path '95-backups' "readiness-$stamp"))
}

function Read-JsonFile {
  param([string]$Path)

  Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
}

$resolvedProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$resolvedOutputDir = if ($OutputDir) { $OutputDir } else { New-DefaultOutputDir -Root $resolvedProjectRoot }

if (-not (Test-Path -LiteralPath $resolvedOutputDir)) {
  New-Item -ItemType Directory -Path $resolvedOutputDir | Out-Null
}

$migrationReportPath = Join-Path $resolvedOutputDir 'migration-check.json'
$openSourceReportPath = Join-Path $resolvedOutputDir 'open-source-check.json'
$localServicesReportPath = Join-Path $resolvedOutputDir 'local-services-check.json'
$obsidianVaultReportPath = Join-Path $resolvedOutputDir 'obsidian-vault-check.json'
$summaryPath = Join-Path $resolvedOutputDir 'readiness-summary.json'

$migrationArgs = @{
  ProjectRoot = $resolvedProjectRoot
  OutputPath = $migrationReportPath
}
if ($AiriUserDataPath) {
  $migrationArgs.AiriUserDataPath = $AiriUserDataPath
}

& (Join-Path $PSScriptRoot 'check-airi-migration.ps1') @migrationArgs *> $null
& (Join-Path $PSScriptRoot 'check-airi-open-source.ps1') `
  -ProjectRoot $resolvedProjectRoot `
  -OutputPath $openSourceReportPath *> $null

$localServicesArgs = @{
  ProjectRoot = $resolvedProjectRoot
  OutputPath = $localServicesReportPath
}
if ($ObsidianPath) {
  $localServicesArgs.ObsidianPath = $ObsidianPath
}
if ($CheckEndpoints) {
  $localServicesArgs.CheckEndpoints = $true
}

& (Join-Path $PSScriptRoot 'check-airi-local-services.ps1') @localServicesArgs *> $null

$obsidianVaultArgs = @{
  ProjectRoot = $resolvedProjectRoot
  OutputPath = $obsidianVaultReportPath
}
if ($ObsidianPath) {
  $obsidianVaultArgs.ObsidianPath = $ObsidianPath
}
if ($VaultPath) {
  $obsidianVaultArgs.VaultPath = $VaultPath
}

& (Join-Path $PSScriptRoot 'check-airi-obsidian-vault.ps1') @obsidianVaultArgs *> $null

$migrationReport = Read-JsonFile -Path $migrationReportPath
$openSourceReport = Read-JsonFile -Path $openSourceReportPath
$localServicesReport = Read-JsonFile -Path $localServicesReportPath
$obsidianVaultReport = Read-JsonFile -Path $obsidianVaultReportPath

$summary = [ordered]@{
  checkedAt = (Get-Date).ToString('o')
  projectRoot = $resolvedProjectRoot
  outputDir = $resolvedOutputDir
  ready = [bool]$migrationReport.ready
  migration = [ordered]@{
    ready = [bool]$migrationReport.ready
    missingRequired = $migrationReport.missingRequired
    missingRecommended = $migrationReport.missingRecommended
    gitStatus = $migrationReport.gitStatus
    reportPath = $migrationReportPath
  }
  openSource = [ordered]@{
    releaseReady = [bool]$openSourceReport.releaseReady
    blockerCount = [int]$openSourceReport.blockerCount
    warningCount = [int]$openSourceReport.warningCount
    reportPath = $openSourceReportPath
  }
  localServices = [ordered]@{
    ready = [bool]$localServicesReport.ready
    checkEndpoints = [bool]$localServicesReport.checkEndpoints
    missingRecommended = $localServicesReport.missingRecommended
    reportPath = $localServicesReportPath
  }
  obsidianVault = [ordered]@{
    ready = [bool]$obsidianVaultReport.ready
    manifestValid = [bool]$obsidianVaultReport.manifestValid
    missingRequired = $obsidianVaultReport.missingRequired
    missingRecommended = $obsidianVaultReport.missingRecommended
    reportPath = $obsidianVaultReportPath
  }
  nextActions = @(
    'Back up the whole working tree or commit changes before moving machines.',
    'Export AIRI-Brain and check obsidianVault.ready before relying on Obsidian migration.',
    'Run a small real sanitized-data smoke test before importing private archives.',
    'Do not publish the current private docs directly while openSource.releaseReady is false.'
  )
}

$summaryJson = $summary | ConvertTo-Json -Depth 8
$summaryJson | Set-Content -LiteralPath $summaryPath -Encoding UTF8

Write-Host "Readiness reports: $resolvedOutputDir"
Write-Host $summaryJson
