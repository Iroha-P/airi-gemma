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
  Join-Path $resolvedProjectRoot 'airi-brain\00-inbox\sanitized-demo-import'
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
# AIRI Sanitized Demo Import

This folder contains synthetic demo data for testing AIRI memory import.
It does not contain private chat history, account identifiers, local file paths, or real profile details.

Suggested order:

1. Import `knowledge/` as a Markdown knowledge base.
2. Import `chat/wechat/` as WeChat records.
3. Import `chat/feishu/` as Feishu/Lark records.
4. Import `chat/qq/` as QQ records.
5. Review generated memories in AIRI before activating anything.

Expected behavior:

- Imported chat messages should enter `needs_review`.
- Persona-like candidates should remain review-only.
- Public profile examples are synthetic and safe for demo testing.
'@
$files.Add($readmePath)

$knowledgePath = Join-Path $resolvedOutputDir 'knowledge\airi-memory-agent.md'
Write-TextFile -Path $knowledgePath -Content @'
---
tags: [airi, memory, demo]
privacy: local
---

# AIRI Memory Agent Demo

AIRI is a local-first companion and desktop assistant.

The memory system keeps raw imports reviewable first, then promotes only confirmed summaries into long-term recall.
The agent should use memory to explain context, respect privacy boundaries, and avoid sending private notes to cloud models.

Useful demo facts:

- The user wants AIRI to summarize work sessions after several hours.
- AIRI should keep public demo profile text separate from private memory.
- LoRA samples should learn stable behavior, not private facts.
'@
$files.Add($knowledgePath)

$wechatPath = Join-Path $resolvedOutputDir 'chat\wechat\synthetic-chat.txt'
Write-TextFile -Path $wechatPath -Content @'
[2026-05-28 09:30:00] User: AIRI should remember that synthetic demo data must stay reviewable before activation.
[2026-05-28 09:31:00] Friend: Keep imported chat memories in needs_review until the user approves a summary.
[2026-05-28 09:32:00] User: I want the assistant to help review study plans and project milestones.
'@
$files.Add($wechatPath)

$feishuPath = Join-Path $resolvedOutputDir 'chat\feishu\synthetic-chat.txt'
Write-TextFile -Path $feishuPath -Content @'
2026-05-28 10:10:00 User: The AIRI project needs migration checks, local model checks, and backup reports.
2026-05-28 10:11:00 Teammate: Keep cloud model access public-only and use local Gemma for private memory consolidation.
2026-05-28 10:12:00 User: The review workbench should show imported candidates before activation.
'@
$files.Add($feishuPath)

$qqPath = Join-Path $resolvedOutputDir 'chat\qq\synthetic-chat.md'
Write-TextFile -Path $qqPath -Content @'
[2026/05/28 11:00] User: AIRI should help me recall safe project history without exposing original chat logs.
[2026/05/28 11:01] Friend: A public demo profile should be synthetic and separated from private memories.
[2026/05/28 11:02] User: Dream consolidation can propose memory candidates, but the user must review them.
'@
$files.Add($qqPath)

$manifestPath = Join-Path $resolvedOutputDir 'manifest.json'
$manifest = [ordered]@{
  schemaVersion = 1
  generatedAt = (Get-Date).ToString('o')
  description = 'Synthetic sanitized AIRI import sample.'
  privacy = 'demo'
  files = @($files | ForEach-Object { ConvertTo-RelativePath -Root $resolvedOutputDir -Path $_ })
  importOrder = @(
    'knowledge',
    'chat/wechat',
    'chat/feishu',
    'chat/qq'
  )
}
$manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $manifestPath -Encoding UTF8
$files.Add($manifestPath)

$report = [ordered]@{
  outputDir = $resolvedOutputDir
  files = @($files | ForEach-Object { ConvertTo-RelativePath -Root $resolvedOutputDir -Path $_ })
}

Write-Host ($report | ConvertTo-Json -Depth 4)
