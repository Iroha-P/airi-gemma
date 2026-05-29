param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [string]$ObsidianPath = '',
  [switch]$CheckEndpoints,
  [string]$OllamaNativeUrl = 'http://127.0.0.1:11434/api/tags',
  [string]$OllamaOpenAIUrl = 'http://127.0.0.1:11434/v1/models',
  [string]$LmStudioUrl = 'http://127.0.0.1:1234/v1/models',
  [string]$GptSoVitsUrl = 'http://127.0.0.1:9880/',
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

  [ordered]@{
    label = $Label
    path = $Path
    kind = $Kind
    required = $Required
    exists = ($Path -and (Test-Path -LiteralPath $Path))
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

function Find-ObsidianCandidates {
  param([string]$ExplicitPath)

  $candidates = New-Object System.Collections.Generic.List[string]

  if ($ExplicitPath) {
    $candidates.Add($ExplicitPath)
  }

  $localAppData = [Environment]::GetFolderPath('LocalApplicationData')
  $programFiles = [Environment]::GetFolderPath('ProgramFiles')

  $knownPaths = @(
    'E:\Obsidian\Obsidian.exe',
    (Join-Path $localAppData 'Obsidian\Obsidian.exe'),
    (Join-Path $programFiles 'Obsidian\Obsidian.exe')
  )

  foreach ($path in $knownPaths) {
    if ($path -and -not $candidates.Contains($path)) {
      $candidates.Add($path)
    }
  }

  $candidates.ToArray()
}

function Test-EndpointItem {
  param(
    [string]$Label,
    [string]$Url
  )

  $status = 'unreachable'
  $statusCode = $null
  $errorMessage = $null
  $modelIds = @()

  try {
    $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 2 -UseBasicParsing
    $status = 'reachable'
    $statusCode = [int]$response.StatusCode

    try {
      $body = $response.Content | ConvertFrom-Json
      if ($body.models) {
        $modelIds = @($body.models | ForEach-Object { if ($_.name) { $_.name } elseif ($_.model) { $_.model } })
      }
      elseif ($body.data) {
        $modelIds = @($body.data | ForEach-Object { if ($_.id) { $_.id } })
      }
    }
    catch {
      $modelIds = @()
    }
  }
  catch {
    $message = $_.Exception.Message
    $errorMessage = if ($message.Length -gt 180) { $message.Substring(0, 177) + '...' } else { $message }
  }

  [ordered]@{
    label = $Label
    url = $Url
    kind = 'endpoint'
    required = $false
    exists = ($status -eq 'reachable')
    status = $status
    statusCode = $statusCode
    modelCount = $modelIds.Count
    modelIds = @($modelIds | Select-Object -First 20)
    errorMessage = $errorMessage
  }
}

function Get-GpuItems {
  $command = Get-Command -Name 'nvidia-smi' -ErrorAction SilentlyContinue
  if (-not $command) {
    return @([ordered]@{
      label = 'NVIDIA GPU'
      path = 'nvidia-smi'
      kind = 'gpu'
      required = $false
      exists = $false
      name = $null
      memoryMiB = $null
      driverVersion = $null
      errorMessage = 'nvidia-smi command was not found.'
    })
  }

  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $lines = @(& nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader,nounits 2>$null)
    if ($LASTEXITCODE -ne 0 -or $lines.Count -eq 0) {
      return @([ordered]@{
        label = 'NVIDIA GPU'
        path = $command.Source
        kind = 'gpu'
        required = $false
        exists = $false
        name = $null
        memoryMiB = $null
        driverVersion = $null
        errorMessage = 'nvidia-smi did not return GPU details.'
      })
    }
  }
  finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }

  $items = New-Object System.Collections.Generic.List[object]
  foreach ($line in $lines) {
    $parts = $line.Split(',') | ForEach-Object { $_.Trim() }
    $memoryMiB = $null
    if ($parts.Count -ge 2) {
      [int]::TryParse($parts[1], [ref]$memoryMiB) | Out-Null
    }

    $items.Add([ordered]@{
      label = 'NVIDIA GPU'
      path = $command.Source
      kind = 'gpu'
      required = $false
      exists = $true
      name = if ($parts.Count -ge 1) { $parts[0] } else { $null }
      memoryMiB = $memoryMiB
      driverVersion = if ($parts.Count -ge 3) { $parts[2] } else { $null }
      errorMessage = $null
    })
  }

  $items.ToArray()
}

$resolvedProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$items = New-Object System.Collections.Generic.List[object]

$directories = @(
  @{ Label = 'GPT-SoVITS workspace'; Path = 'gsv' },
  @{ Label = 'Whisper STT service'; Path = 'stt-whisper' },
  @{ Label = 'FunASR STT service'; Path = 'stt-funasr' },
  @{ Label = 'training scripts'; Path = 'scripts/training/gemma-qlora' },
  @{ Label = 'AI docs'; Path = 'docs/ai' }
)

foreach ($directory in $directories) {
  $items.Add((Test-PathItem `
    -Label $directory.Label `
    -Path (Join-Path $resolvedProjectRoot $directory.Path) `
    -Kind 'directory' `
    -Required $false))
}

$commands = @(
  @{ Label = 'Git command'; Name = 'git' },
  @{ Label = 'Node.js command'; Name = 'node' },
  @{ Label = 'pnpm command'; Name = 'pnpm' },
  @{ Label = 'Python command'; Name = 'python' },
  @{ Label = 'Ollama command'; Name = 'ollama' }
)

foreach ($command in $commands) {
  $items.Add((Test-CommandItem `
    -Label $command.Label `
    -Name $command.Name `
    -Required $false))
}

$obsidianCandidates = Find-ObsidianCandidates -ExplicitPath $ObsidianPath
$obsidianPath = ($obsidianCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1)
$items.Add((Test-PathItem `
  -Label 'Obsidian executable' `
  -Path $(if ($obsidianPath) { $obsidianPath } elseif ($obsidianCandidates.Count -gt 0) { $obsidianCandidates[0] } else { '' }) `
  -Kind 'file' `
  -Required $false))

foreach ($gpu in Get-GpuItems) {
  $items.Add($gpu)
}

if ($CheckEndpoints) {
  $endpoints = @(
    @{ Label = 'Ollama native API'; Url = $OllamaNativeUrl },
    @{ Label = 'Ollama OpenAI-compatible models'; Url = $OllamaOpenAIUrl },
    @{ Label = 'LM Studio OpenAI-compatible models'; Url = $LmStudioUrl },
    @{ Label = 'GPT-SoVITS API'; Url = $GptSoVitsUrl }
  )

  foreach ($endpoint in $endpoints) {
    $items.Add((Test-EndpointItem -Label $endpoint.Label -Url $endpoint.Url))
  }
}

$itemArray = $items.ToArray()
$missingRecommended = @($itemArray | Where-Object { -not $_.required -and -not $_.exists } | ForEach-Object { $_.label })

$report = [ordered]@{
  checkedAt = (Get-Date).ToString('o')
  projectRoot = $resolvedProjectRoot
  checkEndpoints = [bool]$CheckEndpoints
  ready = $true
  missingRecommended = $missingRecommended
  items = $itemArray
}

$json = $report | ConvertTo-Json -Depth 6

if ($OutputPath) {
  $outputParent = Split-Path -Parent $OutputPath
  if ($outputParent -and -not (Test-Path -LiteralPath $outputParent)) {
    New-Item -ItemType Directory -Path $outputParent | Out-Null
  }

  $json | Set-Content -LiteralPath $OutputPath -Encoding UTF8
  Write-Host "Local services check report: $OutputPath"
}

Write-Host $json
