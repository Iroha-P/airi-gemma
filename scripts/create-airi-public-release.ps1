param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [string]$OutputDir = '',
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

function Write-TextFile {
  param(
    [string]$Path,
    [string]$Content
  )

  $parent = Split-Path -Parent $Path
  if ($parent -and -not (Test-Path -LiteralPath $parent)) {
    New-Item -ItemType Directory -Path $parent | Out-Null
  }

  $Content | Set-Content -LiteralPath $Path -Encoding UTF8
}

function Copy-FileIfExists {
  param(
    [string]$Source,
    [string]$Destination
  )

  if (-not (Test-Path -LiteralPath $Source)) {
    return $false
  }

  $parent = Split-Path -Parent $Destination
  if ($parent -and -not (Test-Path -LiteralPath $parent)) {
    New-Item -ItemType Directory -Path $parent | Out-Null
  }

  Copy-Item -LiteralPath $Source -Destination $Destination -Force
  return $true
}

function ConvertTo-RelativePath {
  param(
    [string]$Root,
    [string]$Path
  )

  $rootUri = [Uri]((Resolve-Path -LiteralPath $Root).Path.TrimEnd('\') + '\')
  $pathUri = [Uri](Resolve-Path -LiteralPath $Path).Path
  [Uri]::UnescapeDataString($rootUri.MakeRelativeUri($pathUri).ToString()).Replace('/', '\')
}

$resolvedProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$resolvedOutputDir = if ($OutputDir) {
  $OutputDir
}
else {
  Join-Path $resolvedProjectRoot 'public-release\airi-public-release'
}

if ((Test-Path -LiteralPath $resolvedOutputDir) -and -not $Force) {
  throw "Output directory already exists: $resolvedOutputDir. Re-run with -Force to overwrite."
}

if ($Force -and (Test-Path -LiteralPath $resolvedOutputDir)) {
  Remove-Item -LiteralPath $resolvedOutputDir -Recurse -Force
}

New-Item -ItemType Directory -Path $resolvedOutputDir | Out-Null

$files = New-Object System.Collections.Generic.List[string]

$readmePath = Join-Path $resolvedOutputDir 'README.md'
Write-TextFile -Path $readmePath -Content @'
# AIRI Public Release Candidate

This package is a sanitized public demo candidate for AIRI Gemma.

It contains only synthetic public profile material, public LoRA rehearsal samples, and public-facing documentation templates. It does not contain private memory databases, raw chat records, local vault exports, local file paths, account identifiers, API keys, or real user profile details.

Use this package for README drafts, demos, public technical reports, and public LoRA data rehearsals.

Before publishing:

1. Read every file manually.
2. Keep private Memory DB, AIRI-Brain vault, chat exports, and voice assets out of the release package.
3. Run the open-source privacy check on this package.
4. Publish only if the release check summary says releaseReady is true.
'@
$files.Add($readmePath)

$templateSource = Join-Path $resolvedProjectRoot 'docs\ai\PUBLIC_PROFILE_TEMPLATE.zh-CN.md'
$templateDestination = Join-Path $resolvedOutputDir 'docs\PUBLIC_PROFILE_TEMPLATE.zh-CN.md'
if (Copy-FileIfExists -Source $templateSource -Destination $templateDestination) {
  $files.Add($templateDestination)
}

$sampleDir = Join-Path $resolvedOutputDir 'samples\public-profile'
& (Join-Path $PSScriptRoot 'create-airi-public-profile-sample.ps1') `
  -ProjectRoot $resolvedProjectRoot `
  -OutputDir $sampleDir `
  -Force *> $null

Get-ChildItem -LiteralPath $sampleDir -Recurse -File | ForEach-Object { $files.Add($_.FullName) }

$temporaryCheckPath = [System.IO.Path]::GetTempFileName()
try {
  & (Join-Path $PSScriptRoot 'check-airi-open-source.ps1') `
    -ProjectRoot $resolvedProjectRoot `
    -IncludePaths $resolvedOutputDir `
    -OutputPath $temporaryCheckPath *> $null
  $checkReport = Get-Content -LiteralPath $temporaryCheckPath -Raw | ConvertFrom-Json
}
finally {
  if (Test-Path -LiteralPath $temporaryCheckPath) {
    Remove-Item -LiteralPath $temporaryCheckPath -Force
  }
}
if (-not $checkReport.releaseReady) {
  throw "Generated public release package did not pass open-source check. Blockers: $($checkReport.blockerCount), warnings: $($checkReport.warningCount)"
}

$checkSummaryPath = Join-Path $resolvedOutputDir 'open-source-check-summary.json'
$checkSummary = [ordered]@{
  checkedAt = (Get-Date).ToString('o')
  releaseReady = [bool]$checkReport.releaseReady
  scannedFiles = [int]$checkReport.scannedFiles
  blockerCount = [int]$checkReport.blockerCount
  warningCount = [int]$checkReport.warningCount
}
$checkSummary | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $checkSummaryPath -Encoding UTF8
$files.Add($checkSummaryPath)

$manifestPath = Join-Path $resolvedOutputDir 'manifest.json'
$manifest = [ordered]@{
  schemaVersion = 1
  generatedAt = (Get-Date).ToString('o')
  description = 'Sanitized AIRI public release candidate.'
  privacy = 'public'
  containsPrivateData = $false
  releaseReady = [bool]$checkReport.releaseReady
  files = @($files | ForEach-Object { ConvertTo-RelativePath -Root $resolvedOutputDir -Path $_ })
}
$manifest | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $manifestPath -Encoding UTF8
$files.Add($manifestPath)

$report = [ordered]@{
  outputDir = $resolvedOutputDir
  releaseReady = [bool]$checkReport.releaseReady
  files = @($files | ForEach-Object { ConvertTo-RelativePath -Root $resolvedOutputDir -Path $_ })
}

Write-Host ($report | ConvertTo-Json -Depth 6)
