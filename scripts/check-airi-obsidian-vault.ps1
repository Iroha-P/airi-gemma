param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [string]$VaultPath = '',
  [string]$ObsidianPath = '',
  [string]$OutputPath = ''
)

$ErrorActionPreference = 'Stop'

function Test-VaultItem {
  param(
    [string]$Label,
    [string]$RelativePath,
    [string]$Kind,
    [bool]$Required
  )

  $path = Join-Path $resolvedVaultPath $RelativePath
  [ordered]@{
    label = $Label
    relativePath = $RelativePath
    path = $path
    kind = $Kind
    required = $Required
    exists = Test-Path -LiteralPath $path
  }
}

function Test-OptionalFile {
  param(
    [string]$Label,
    [string]$Path
  )

  [ordered]@{
    label = $Label
    path = $Path
    kind = 'file'
    required = $false
    exists = if ($Path) { Test-Path -LiteralPath $Path } else { $false }
  }
}

$resolvedProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$resolvedVaultPath = if ($VaultPath) {
  $VaultPath
}
else {
  Join-Path $resolvedProjectRoot 'airi-brain'
}

$items = New-Object System.Collections.Generic.List[object]
$items.Add((Test-VaultItem -Label 'AIRI-Brain home' -RelativePath 'AIRI-Brain.md' -Kind 'file' -Required $true))
$items.Add((Test-VaultItem -Label 'AIRI-Brain index' -RelativePath 'index.md' -Kind 'file' -Required $true))
$items.Add((Test-VaultItem -Label 'AIRI-Brain export log' -RelativePath 'log.md' -Kind 'file' -Required $true))
$items.Add((Test-VaultItem -Label 'AIRI compact profile' -RelativePath '05-compact-profile.md' -Kind 'file' -Required $true))
$items.Add((Test-VaultItem -Label 'AIRI manifest' -RelativePath '.airi\manifest.json' -Kind 'file' -Required $true))

$recommendedDirectories = @(
  @{ Label = 'Inbox candidates'; Path = '00-inbox' },
  @{ Label = 'Profile notes'; Path = '10-profile' },
  @{ Label = 'Boundary notes'; Path = '20-boundaries' },
  @{ Label = 'Project notes'; Path = '30-projects' },
  @{ Label = 'Knowledge notes'; Path = '40-knowledge' },
  @{ Label = 'General memories'; Path = '50-memories' },
  @{ Label = 'LLMWiki export'; Path = '70-llmwiki' },
  @{ Label = 'Public profile preview'; Path = '80-public-profile' },
  @{ Label = 'LoRA dataset candidates'; Path = '90-lora-dataset-candidates' },
  @{ Label = 'Memory backups'; Path = '95-backups' }
)

foreach ($directory in $recommendedDirectories) {
  $items.Add((Test-VaultItem -Label $directory.Label -RelativePath $directory.Path -Kind 'directory' -Required $false))
}

$items.Add((Test-OptionalFile -Label 'Obsidian executable' -Path $ObsidianPath))

$missingRequiredLabels = New-Object System.Collections.Generic.List[string]
$missingRecommendedLabels = New-Object System.Collections.Generic.List[string]
foreach ($item in $items) {
  if ($item.required -and -not $item.exists) {
    $missingRequiredLabels.Add([string]$item.label)
  }
  elseif (-not $item.required -and -not $item.exists) {
    $missingRecommendedLabels.Add([string]$item.label)
  }
}

$manifestPath = Join-Path $resolvedVaultPath '.airi\manifest.json'
$manifest = $null
$manifestValid = $false
$manifestErrors = New-Object System.Collections.Generic.List[string]
if (Test-Path -LiteralPath $manifestPath) {
  try {
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    $manifestValid = $true
    if ($manifest.schemaVersion -ne 1) {
      $manifestValid = $false
      $manifestErrors.Add('manifest schemaVersion should be 1')
    }
    if ($manifest.sourceOfTruth -ne 'memory-db') {
      $manifestValid = $false
      $manifestErrors.Add('manifest sourceOfTruth should be memory-db')
    }
    if (-not $manifest.privacy.excludesSecretMemories) {
      $manifestValid = $false
      $manifestErrors.Add('manifest privacy.excludesSecretMemories should be true')
    }
    if (-not $manifest.privacy.inboxRequiresReview) {
      $manifestValid = $false
      $manifestErrors.Add('manifest privacy.inboxRequiresReview should be true')
    }
  }
  catch {
    $manifestValid = $false
    $manifestErrors.Add($_.Exception.Message)
  }
}
else {
  $manifestErrors.Add('manifest file is missing')
}

$sourceMarkerCount = 0
if (Test-Path -LiteralPath $resolvedVaultPath) {
  $markdownFiles = @(Get-ChildItem -LiteralPath $resolvedVaultPath -Recurse -File -Filter '*.md' -ErrorAction SilentlyContinue)
  foreach ($file in $markdownFiles) {
    $content = Get-Content -LiteralPath $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -match 'source:\s+airi-memory-service') {
      $sourceMarkerCount += 1
    }
  }
}

$report = [ordered]@{
  checkedAt = (Get-Date).ToString('o')
  projectRoot = $resolvedProjectRoot
  vaultPath = $resolvedVaultPath
  ready = $missingRequiredLabels.Count -eq 0 -and $manifestValid
  manifestValid = $manifestValid
  manifestErrors = $manifestErrors.ToArray()
  sourceMarkerCount = $sourceMarkerCount
  missingRequired = $missingRequiredLabels.ToArray()
  missingRecommended = $missingRecommendedLabels.ToArray()
  items = $items.ToArray()
}

if ($OutputPath) {
  $outputParent = Split-Path -Parent $OutputPath
  if ($outputParent -and -not (Test-Path -LiteralPath $outputParent)) {
    New-Item -ItemType Directory -Path $outputParent | Out-Null
  }
  $report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutputPath -Encoding UTF8
}

Write-Host ($report | ConvertTo-Json -Depth 8)
