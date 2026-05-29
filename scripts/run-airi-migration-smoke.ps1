param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [string]$OutputDir = '',
  [string]$AiriUserDataPath = '',
  [string]$ObsidianPath = '',
  [string]$VaultPath = '',
  [switch]$CheckEndpoints,
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

function New-DefaultOutputDir {
  param([string]$Root)

  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  Join-Path $Root (Join-Path 'airi-brain' (Join-Path '95-backups' "migration-smoke-$stamp"))
}

function Read-JsonFile {
  param([string]$Path)

  Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
}

function Remove-OutputDirIfSafe {
  param(
    [string]$Root,
    [string]$Path
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    return
  }

  $resolvedRoot = (Resolve-Path -LiteralPath $Root).Path
  $resolvedPath = (Resolve-Path -LiteralPath $Path).Path
  if (-not $resolvedPath.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to remove output outside project root: $resolvedPath"
  }

  Remove-Item -LiteralPath $resolvedPath -Recurse -Force
}

$resolvedProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$resolvedOutputDir = if ($OutputDir) { $OutputDir } else { New-DefaultOutputDir -Root $resolvedProjectRoot }

if ((Test-Path -LiteralPath $resolvedOutputDir) -and -not $Force) {
  throw "Output directory already exists: $resolvedOutputDir. Re-run with -Force to overwrite."
}

if ($Force) {
  Remove-OutputDirIfSafe -Root $resolvedProjectRoot -Path $resolvedOutputDir
}

New-Item -ItemType Directory -Path $resolvedOutputDir | Out-Null

$sanitizedDemoDir = Join-Path $resolvedOutputDir 'sanitized-demo-import'
$readinessDir = Join-Path $resolvedOutputDir 'readiness'
$summaryPath = Join-Path $resolvedOutputDir 'migration-smoke-summary.json'

& (Join-Path $PSScriptRoot 'create-airi-sanitized-demo-data.ps1') `
  -ProjectRoot $resolvedProjectRoot `
  -OutputDir $sanitizedDemoDir `
  -Force *> $null

$readinessArgs = @{
  ProjectRoot = $resolvedProjectRoot
  OutputDir = $readinessDir
}
if ($AiriUserDataPath) {
  $readinessArgs.AiriUserDataPath = $AiriUserDataPath
}
if ($ObsidianPath) {
  $readinessArgs.ObsidianPath = $ObsidianPath
}
if ($VaultPath) {
  $readinessArgs.VaultPath = $VaultPath
}
if ($CheckEndpoints) {
  $readinessArgs.CheckEndpoints = $true
}

& (Join-Path $PSScriptRoot 'collect-airi-readiness.ps1') @readinessArgs *> $null

$readinessSummaryPath = Join-Path $readinessDir 'readiness-summary.json'
$readinessSummary = Read-JsonFile -Path $readinessSummaryPath
$sanitizedManifestPath = Join-Path $sanitizedDemoDir 'manifest.json'
$sanitizedManifest = Read-JsonFile -Path $sanitizedManifestPath

$summary = [ordered]@{
  checkedAt = (Get-Date).ToString('o')
  projectRoot = $resolvedProjectRoot
  outputDir = $resolvedOutputDir
  sanitizedDemo = [ordered]@{
    outputDir = $sanitizedDemoDir
    manifestPath = $sanitizedManifestPath
    fileCount = @(Get-ChildItem -LiteralPath $sanitizedDemoDir -Recurse -File).Count
  }
  readiness = [ordered]@{
    summaryPath = $readinessSummaryPath
    ready = [bool]$readinessSummary.ready
    migrationReady = [bool]$readinessSummary.migration.ready
    localServicesReady = [bool]$readinessSummary.localServices.ready
    obsidianVaultReady = [bool]$readinessSummary.obsidianVault.ready
    openSourceReleaseReady = [bool]$readinessSummary.openSource.releaseReady
  }
  nextActions = @(
    'Use sanitized-demo-import for a manual import rehearsal before private data.',
    'Review readiness/readiness-summary.json before moving machines.',
    'Export AIRI-Brain and rerun the smoke when obsidianVaultReady is false.'
  )
}

$summaryJson = $summary | ConvertTo-Json -Depth 8
$summaryJson | Set-Content -LiteralPath $summaryPath -Encoding UTF8

Write-Host "Migration smoke output: $resolvedOutputDir"
Write-Host $summaryJson
