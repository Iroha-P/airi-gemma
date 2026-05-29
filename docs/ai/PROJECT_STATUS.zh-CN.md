# AIRI Gemma 当前工程状态

> 更新时间：2026-05-28  
> 目的：给后续迁移设备、继续开发和开源前自查提供一页式状态索引。

## 总体完成度

当前工程完成度约为 **80%**。

已经完成的是核心闭环：本地长期记忆、导入审查、RAG/LLMWiki、Obsidian/AIRI-Brain 导出、Dream 整理、LoRA 数据候选、安全门禁、Agent Orchestrator、Computer Use 安全预览与低/中风险确认执行。

剩余 20% 主要是产品化和交付打磨：真实数据试跑、迁移演练、UI 易用性整理、更多端到端 smoke、开源脱敏、以及本地模型/语音服务在新机器上的配置复核。

## 已落地能力

- **Memory Service**：PGlite + Drizzle 本地记忆库，支持 CRUD、状态、隐私分级、摘要、标签、审计和 Review Workbench。
- **多数据源导入**：支持 Markdown/Obsidian 知识库、微信/飞书/QQ 聊天记录的受控导入，导入结果默认进入 `needs_review`。
- **安全扫描**：统一拦截本地路径、凭据、提示注入、不可见字符、摘要风险、原始聊天标记和历史 unsafe metadata。
- **RAG / LLMWiki**：可导出 LLMWiki Markdown，并在 RAG preview/runtime 前对 memory 与 LLMWiki snippet 做安全过滤。
- **Obsidian/AIRI-Brain**：可导出可迁移 vault，包含 index/log/manifest/inbox 等文件，适合人工整理和 Obsidian 图谱查看。
- **Dream Cycle**：本地 Gemma 梦境整理会生成可审查的记忆、routine、LLMWiki、LoRA 候选；Review Action 只使用 `sanitizedReport`。
- **Agent Orchestrator**：能读取本地记忆/RAG 上下文，支持本地/云端 OpenAI-compatible runtime 配置，并保留隐私边界。
- **Computer Use**：支持 `controlled_execution` 策略预览、审计、renderer 本地保护、main process 二次校验、Agent confirmation 执行保护，以及批准后的 `read_file`、`search_files`、`open_url`、`open_path` 安全执行；高风险动作仍不可执行。
- **LoRA 数据闭环**：支持公开画像/LoRA 候选导出、preflight、manifest、训练包、dry-run、训练脚本模板和训练后清单。
- **迁移脚本**：已有备份、恢复、迁移预检脚本，以及对应测试。
- **开源隐私预检**：已有开源发布检查清单和 `scripts/check-airi-open-source.ps1`，用于发布前扫描本地路径、真实画像线索、凭据词和原始聊天标记。
- **公开画像样例**：已有 `docs/ai/PUBLIC_PROFILE_TEMPLATE.zh-CN.md` 和 `scripts/create-airi-public-profile-sample.ps1`，可生成不含真实隐私数据的 public profile 与 public LoRA 样例。
- 如果要做公开 demo 或对外交付材料，先用 `scripts/create-airi-public-release.ps1` 生成独立脱敏公开候选包，并确认包目录的开源扫描为 0 blocker、0 warning。
- **公开候选包生成**：已有 `scripts/create-airi-public-release.ps1`，可生成独立脱敏 public release 包，包含 README、公开画像模板、public LoRA 样例、manifest 和开源扫描摘要。
- **本地服务预检**：已有 `scripts/check-airi-local-services.ps1`，用于迁移或重装时检查 Obsidian、GPT-SoVITS/STT 工作区、基础命令和可选本地 endpoint。
- **Obsidian vault 预检**：已有 `scripts/check-airi-obsidian-vault.ps1`，用于检查 AIRI-Brain 首页、索引、日志、compact profile、`.airi/manifest.json` 和 Obsidian 可执行文件路径。
- **readiness 汇总**：已有 `scripts/collect-airi-readiness.ps1`，可以一次性生成迁移、开源、本地服务、Obsidian vault JSON 报告和汇总。
- **迁移 smoke 演练**：已有 `scripts/run-airi-migration-smoke.ps1`，会生成脱敏样例数据并收集 readiness 报告，用于换电脑前或新电脑恢复后的快速验收。
- **脱敏样例数据**：已有 `scripts/create-airi-sanitized-demo-data.ps1`，可生成 knowledge/wechat/feishu/qq 合成样例，供真实数据导入前试跑。
- **本地模型/语音指南**：已有 `docs/ai/LOCAL_MODEL_VOICE_SETUP.zh-CN.md`，记录 Ollama/OpenAI-compatible 接入、RTX 3070 Ti 8GB 的 LoRA 现实边界和语音服务迁移验收。
- **前端可维护性整理**：Memory 设置页已拆出 `MemoryStatusCards.vue`、`DreamCyclePanel.vue`、`RagPreviewPanel.vue`、`EvolutionPreviewPanel.vue`、`LlmWikiSearchPanel.vue`、`ComputerUsePanel.vue`、`AgentChatRuntimePanel.vue`、`RoutineLibraryPanel.vue`、`AgentConsolePanel.vue`、`MemoryEditorPanel.vue`、`MemoryListPanel.vue`、`MemoryResultsPanel.vue`、`MemoryActionsPanel.vue`、`ImportResultsPanel.vue`、`LoraTrainingDryRunPanel.vue`、`ExportPreflightPanel.vue`、`ExportFileListPanel.vue`、`LlmWikiExportPanel.vue`、`ObsidianExportPanel.vue`、`CompactProfilePanel.vue`、`BackupPreviewPanel.vue`、`BackupImportResultPanel.vue` 与 `ReviewWorkbenchPanel.vue`，根页面继续保留 store 编排，独立功能区变成展示组件。

## 最近一次验收

已通过：

```powershell
pnpm exec vitest run apps/stage-tamagotchi/src/main/services/airi/memory apps/stage-tamagotchi/src/main/services/airi/agent apps/stage-tamagotchi/src/main/services/airi/chat-runtime apps/stage-tamagotchi/src/main/services/airi/computer-use apps/stage-tamagotchi/src/main/services/airi/dream apps/stage-tamagotchi/src/main/services/airi/routines apps/stage-tamagotchi/src/renderer/stores/settings/memory.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/dream.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/agent.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/computer-use.test.ts apps/stage-tamagotchi/src/renderer/stores/settings/routines.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/rag-safety-withheld-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/dream-sanitized-lora-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/dream-withheld-safety-ui.test.ts apps/stage-tamagotchi/src/renderer/pages/settings/memory/computer-use-can-execute-ui.test.ts apps/stage-tamagotchi/scripts/migration-scripts.test.ts
```

结果：**44 个测试文件通过，204 个测试用例通过**。其中合成端到端 smoke 覆盖导入知识库、聊天记录生成待审画像、人工激活、LLMWiki/RAG、Obsidian 公共画像、备份预览和公开 preflight；迁移脚本测试覆盖 Unicode 一键脚本、开源隐私预检、本地服务预检、Ollama/OpenAI-compatible 模型清单解析、Obsidian vault 预检、readiness 汇总脚本、脱敏样例数据生成脚本、公开画像样例生成脚本、公开候选包生成脚本、迁移 smoke 演练脚本，以及 AIRI-Brain 作为 local-data 单独备份/恢复的边界。新增 Export/Backup/Review Workbench/Memory List/Evolution/Results 面板拆分后，Memory 设置页、settings stores 与迁移脚本范围回归为 **48 个测试文件通过，90 个测试用例通过**，Review Workbench 针对性 UI 测试为 **14 个测试文件通过，14 个测试用例通过**，`@proj-airi/stage-tamagotchi` typecheck 通过；Memory 设置页根组件已降到 1,404 行。

```powershell
pnpm -F @proj-airi/stage-tamagotchi typecheck
```

结果：通过。

```powershell
pnpm -F @proj-airi/stage-tamagotchi build
```

结果：通过。构建输出中仍有 Vite/UnoCSS 的 warning，但没有阻断构建。

```powershell
git diff --check
```

结果：通过。只出现 Windows 换行提示，无 whitespace error。

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-airi-migration.ps1
```

结果：`ready: true`。唯一 recommended 缺口是当前机器未发现 AIRI `userData/memory/pglite`，说明还没有可迁移的真实本地 Memory DB；源码、文档、脚本、本地服务目录和基础命令均可识别。当前工作区仍有大量未提交/未追踪改动，预检显示 `gitStatus.changed: 135`、`untracked: 60`、`modified: 75`；换电脑前必须完整备份项目文件夹，或先整理提交，不能只依赖远端 Git。

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-airi-open-source.ps1
```

结果：脚本可运行，当前输出 `releaseReady: false`，发现 `blockerCount: 22`、`warningCount: 15`。这些主要来自真实画像、迁移示例里的本地路径，以及聊天记录导入语境。因此项目适合私有开发和迁移，不建议原样开源；开源前需要按 `docs/ai/OPEN_SOURCE_PRIVACY_CHECKLIST.zh-CN.md` 生成单独 public 分支或 release 包。

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\create-airi-public-release.ps1 `
  -OutputDir .\tmp-public-release `
  -Force
```

结果：脚本已加入测试覆盖，并已在当前仓库实测生成临时公开候选包。生成后的 `tmp-public-release/` 再次运行开源扫描，结果为 `releaseReady: true`、`blockerCount: 0`、`warningCount: 0`；正式发布时应换成备份盘或单独 release 目录。

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-airi-local-services.ps1 `
  -ObsidianPath E:\Obsidian\Obsidian.exe
```

结果：脚本已加入测试覆盖。迁移或重装本地模型/语音服务时，用它确认 Obsidian、本地语音/STT 工作区、Git/Node/pnpm/Python/Ollama 命令和 NVIDIA GPU 是否可见；如果本地服务已经启动，可以额外加 `-CheckEndpoints` 检查 Ollama、LM Studio 和 GPT-SoVITS 常见端口。

当前机器预检结果：`ready: true`，已识别 `E:\Obsidian\Obsidian.exe`、`gsv`、`stt-whisper`、`stt-funasr`、Git、Node.js、pnpm、Python、Ollama 和 NVIDIA GeForce RTX 3070 Ti 8GB。Ollama native API 与 OpenAI-compatible `/v1/models` 可达，并检测到本地模型 `gemma4:e4b`；LM Studio 与 GPT-SoVITS 默认端口当前不可达，说明它们未启动或不在默认端口。

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-airi-obsidian-vault.ps1 `
  -VaultPath .\airi-brain `
  -ObsidianPath E:\Obsidian\Obsidian.exe
```

结果：脚本已加入测试覆盖。当前仓库根目录尚未生成真实 `airi-brain/` vault 时，该检查会显示 `ready: false`，这是正常迁移提醒；在 AIRI 设置页导出 Obsidian/AIRI-Brain 后再运行它，应该看到首页、索引、日志、compact profile 和 `.airi/manifest.json` 全部存在。

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\collect-airi-readiness.ps1 `
  -OutputDir D:\AIRI-Backup\readiness `
  -ObsidianPath E:\Obsidian\Obsidian.exe `
  -CheckEndpoints
```

结果：脚本已加入测试覆盖。换电脑前可以用它把迁移、开源、本地服务和 Obsidian vault 状态落成 JSON 报告，避免只靠聊天记录回忆。

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-airi-migration-smoke.ps1 `
  -OutputDir D:\AIRI-Backup\migration-smoke `
  -ObsidianPath E:\Obsidian\Obsidian.exe `
  -CheckEndpoints
```

结果：脚本已加入测试覆盖。它会生成 `sanitized-demo-import/`、`readiness/` 和 `migration-smoke-summary.json`，适合在不导入真实聊天记录的情况下验证迁移链路。

## 下一步优先级

### P0：迁移前必须做

- 已用自动化合成数据跑通完整链路 smoke：导入 -> 审查 -> 激活 -> RAG preview -> LLMWiki/Obsidian 导出 -> 备份。迁移前仍建议先运行 `scripts/create-airi-sanitized-demo-data.ps1` 生成可手动导入的脱敏样例，再用一小份真实脱敏数据人工试跑。
- 跑 `scripts/check-airi-migration.ps1`，确认项目源码、文档、脚本、本地服务目录和 AIRI userData 都能被识别。
- 跑 `scripts/check-airi-local-services.ps1`，确认 Obsidian、语音/STT 目录和本地模型相关命令在新电脑上可见。
- 导出 Obsidian/AIRI-Brain 后跑 `scripts/check-airi-obsidian-vault.ps1`，确认 vault manifest 和核心 Markdown 文件齐全。
- 跑 `scripts/run-airi-migration-smoke.ps1`，确认脱敏样例和 readiness 报告能在当前机器生成。
- 做一次 `scripts/backup-airi.ps1` 的真实备份，并确认备份目录里有源码、userData、gsv、STT 服务目录和 manifest。
- 如果要开源或发公开报告，先跑 `scripts/check-airi-open-source.ps1`，并清理所有 blocker。
- 如果要做公开 demo，先用 `scripts/create-airi-public-profile-sample.ps1` 生成合成公开画像样例，不要直接复用真实 Memory DB。

### P1：继续增强

- 继续拆 Memory 设置页：状态卡片、Dream、RAG Preview、Evolution Preview、LLMWiki Search、Computer Use、Agent Chat Runtime、Routine Library、Agent Console、Memory Editor、Memory List、Memory Results 与各结果子面板已完成，下一步优先抽离页面级派生逻辑到 composable，直到根页面只保留 store 编排。
- 为真实 Obsidian vault 导入/导出做一次端到端 smoke，并用 vault 预检脚本留档。
- 为本地 Gemma runtime 和语音服务写更明确的连接诊断。
- 继续扩公开版画像工具：在公开候选包里补充更多合成 demo 场景和截图前检查流程。
- 为公开分支准备合成 demo 数据，不复用真实 Memory DB 或聊天记录导出。

### P2：毕业后继续做

- 自动化更强的 Computer Use。
- 真机 LoRA 训练、评测和 adapter 发布流程。
- 前端视觉与交互体验重做。
- 多端同步和移动端适配。

## 关键入口

- 主设计文档：`docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`
- 迁移指南：`docs/ai/MIGRATION.zh-CN.md`
- 本地模型与语音接入：`docs/ai/LOCAL_MODEL_VOICE_SETUP.zh-CN.md`
- 聊天记录导出导入指南：`docs/ai/chat-record-export-import-guide.zh-CN.md`
- 开源隐私检查清单：`docs/ai/OPEN_SOURCE_PRIVACY_CHECKLIST.zh-CN.md`
- LoRA 技术报告：`docs/ai/gemma-lora-memory-agent-report.zh-CN.md`
- Hermes 记忆系统参考：`docs/ai/hermes-memory-system-reference.zh-CN.md`
- LLMWiki 思想参考：`docs/ai/llmwiki-pattern-reference.zh-CN.md`
