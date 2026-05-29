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

  if ((Test-Path -LiteralPath $Path) -and -not $Force) {
    throw "File already exists: $Path. Re-run with -Force to overwrite."
  }

  $Content | Set-Content -LiteralPath $Path -Encoding UTF8
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
  Join-Path $resolvedProjectRoot 'public-release\airi-public-profile-sample'
}

if ((Test-Path -LiteralPath $resolvedOutputDir) -and -not $Force) {
  throw "Output directory already exists: $resolvedOutputDir. Re-run with -Force to overwrite."
}

if ($Force -and (Test-Path -LiteralPath $resolvedOutputDir)) {
  Remove-Item -LiteralPath $resolvedOutputDir -Recurse -Force
}

New-Item -ItemType Directory -Path $resolvedOutputDir | Out-Null

$files = New-Object System.Collections.Generic.List[string]

$profilePath = Join-Path $resolvedOutputDir 'public-profile.md'
Write-TextFile -Path $profilePath -Content @'
---
profileVisibility: demo
privacy: public
source: synthetic-public-template
reviewStatus: approved-public-demo
---

# AIRI Public Demo Profile

The user is a learner moving from a non-computer-science background toward AI Agent and robotics-oriented software work.

They are building AIRI as a local-first companion and desktop assistant with reviewable long-term memory, privacy boundaries, optional local/cloud model routing, computer-use safety checks, and a safe LoRA data loop for local Gemma specialization.

Public demo scope:

- Use only synthetic or manually sanitized memories.
- Keep imported chat records in review before activation.
- Use cloud models only for public or sanitized content.
- Train behavior and boundaries, not private facts.
'@
$files.Add($profilePath)

$loraPath = Join-Path $resolvedOutputDir 'public-lora-sample.jsonl'
Write-TextFile -Path $loraPath -Content @'
{"messages":[{"role":"system","content":"You are AIRI, a local-first companion and desktop assistant. Respect privacy boundaries and use reviewable memory."},{"role":"user","content":"How should you handle imported chat logs?"},{"role":"assistant","content":"I should keep imported chat logs local, summarize them into reviewable candidates, and wait for user approval before using them as long-term memory."}],"metadata":{"profileVisibility":"training_sanitized","privacy":"public","source":"synthetic-public-template"}}
{"messages":[{"role":"system","content":"You are AIRI, a local-first companion and desktop assistant. Respect privacy boundaries and use reviewable memory."},{"role":"user","content":"Can you send my private memory to a cloud model?"},{"role":"assistant","content":"No. Private memory should stay local unless the user explicitly approves a sanitized public summary for cloud use."}],"metadata":{"profileVisibility":"training_sanitized","privacy":"public","source":"synthetic-public-template"}}
'@
$files.Add($loraPath)

$manifestPath = Join-Path $resolvedOutputDir 'manifest.json'
$manifest = [ordered]@{
  schemaVersion = 1
  generatedAt = (Get-Date).ToString('o')
  description = 'Synthetic public AIRI profile sample for README, demo, and LoRA rehearsal.'
  privacy = 'public'
  containsPrivateData = $false
  files = @($files | ForEach-Object { ConvertTo-RelativePath -Root $resolvedOutputDir -Path $_ })
}
$manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $manifestPath -Encoding UTF8
$files.Add($manifestPath)

$report = [ordered]@{
  outputDir = $resolvedOutputDir
  files = @($files | ForEach-Object { ConvertTo-RelativePath -Root $resolvedOutputDir -Path $_ })
}

Write-Host ($report | ConvertTo-Json -Depth 5)
