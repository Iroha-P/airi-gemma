# AIRI Gemma 项目总览

> 更新时间：2026-05-29  
> 用途：给项目迁移、GitHub 上传、继续开发、对外介绍和后续 Agent 接手提供一份入口级总结。

## 1. 项目一句话

AIRI Gemma 是一个围绕 `moeru-ai/airi` Electron 桌面端改造的本地优先个人智能体项目，目标是把 AIRI 做成可长期陪伴、能管理用户本地记忆、能接入本地/云端 LLM、能做受控 Computer Use、并最终支持 LoRA 微调数据闭环的桌面助理。

这个项目不是单纯聊天 UI，也不是单纯 RAG 工具。它更接近一个“本地长期记忆 + Agent Orchestrator + 可审查数据治理 + 可迁移个人知识库”的个人 AI 系统。

## 2. 当前定位

项目当前围绕四个核心目标推进：

1. **本地长期记忆**：把用户的偏好、项目状态、学习习惯、聊天记录摘要、知识库内容沉淀为可审查记忆。
2. **陪伴与桌面助理**：让 AIRI 能理解用户长期背景，结合当前任务给出更稳定、更有连续性的响应。
3. **本地优先与隐私保护**：默认把真实 Memory DB、聊天记录、语音素材、模型权重留在本机，不进入 GitHub。
4. **LoRA 与面试叙事**：未来可以从审查后的公开/训练候选数据中生成 LoRA 数据集，形成可讲清楚的算法岗项目。

## 3. 当前完成度

当前工程完成度约为 **80%**。

已经完成的主链路：

- Memory Service：PGlite + Drizzle 本地记忆库设计与接口。
- 多数据源导入：Markdown/Obsidian、微信、飞书、QQ 聊天记录的受控导入流程。
- Review Workbench：导入后的记忆默认进入 `needs_review`，人工审核后再激活。
- RAG / LLMWiki：可导出 LLMWiki Markdown，并在 RAG preview/runtime 前做安全过滤。
- Obsidian/AIRI-Brain：可导出 Obsidian-compatible vault，方便人类阅读、整理和迁移。
- Dream Cycle：本地 Gemma 可用于整理近期经历，生成记忆、routine、LLMWiki、LoRA 候选。
- Agent Orchestrator：可读取本地记忆/RAG 上下文，支持本地/云端 OpenAI-compatible runtime。
- Computer Use：已有安全预览、审计、确认执行、main process 二次校验和低/中风险动作执行保护。
- LoRA 数据闭环：已有公开画像、LoRA 候选导出、preflight、manifest、dry-run、训练脚本模板和训练后清单。
- 迁移与开源工具：已有备份、恢复、迁移预检、本地服务预检、公开隐私扫描、公开候选包生成、一键 bootstrap 脚本。
- 前端可维护性：Memory 设置页已拆成多个 Vue 展示组件，根页面逐步收敛为 store 编排层。

剩余 20% 主要是：

- 用真实数据跑一遍完整导入、审查、激活和导出链路。
- 做一次真实换电脑迁移演练。
- 清理公开仓库中的个人画像和本地路径。
- 继续打磨 UI 易用性和本地模型/语音服务诊断。
- 真机 LoRA 训练、评测和 adapter 发布流程。

## 4. 目前还没有真正产生的私有资产

下面这些类别已经在迁移方案中预留，但当前大部分还没有真正产生：

- **真实 Memory DB**：当前迁移预检仍提示缺少 `AIRI userData memory store`，说明还没有真实可迁移的 PGlite 记忆库。
- **真实聊天记录**：微信、飞书、QQ 导入流程和教程已经有了，但还没有导入真实聊天记录。
- **语音素材**：还没有整理成正式角色音色资产。
- **模型权重**：本机 Ollama 可有模型，但模型权重不属于 Git 仓库内容，也不会放进 GitHub。
- **GPT-SoVITS 资产**：`gsv/` 作为本地资产入口存在，但正式音色、训练结果和权重还没形成可迁移资产。
- **AIRI-Brain 真实 vault**：导出脚本和预检脚本已有，真实导出需要在 AIRI 里产生数据后再做。

因此，目前 GitHub 上传主要上传的是源码、文档、脚本和工程改造；真实个人数据以后通过本地备份包迁移。

## 5. 技术栈

### 桌面端

- Electron
- Vue 3
- Vite / electron-vite
- TypeScript
- Pinia
- VueUse
- UnoCSS
- Eventa IPC/RPC
- Vitest
- ESLint

### 本地记忆与智能体

- PGlite + Drizzle：本地 Memory DB。
- Memory Service：CRUD、状态、隐私分级、摘要、标签、审计。
- Agent Orchestrator：组合本地记忆、RAG、LLM runtime 和工具调用。
- Computer Use：受控桌面/文件/URL 操作。
- Dream Cycle：定期整理近期经历和候选记忆。

### 知识库与导出

- LLMWiki：面向 RAG 的 Markdown 知识结构。
- Obsidian-compatible AIRI-Brain：面向人类整理、双链和图谱查看。
- Public Profile / Public LoRA Sample：面向公开 demo 和训练样例的脱敏输出。

### 本地模型与语音

- Ollama / LM Studio / OpenAI-compatible endpoint。
- Gemma 本地模型作为主要方向。
- GPT-SoVITS 作为未来 TTS 音色方向。
- Whisper / FunASR 作为 STT 方向。

## 6. 关键目录

```text
apps/stage-tamagotchi/
  Electron 桌面端主工程。

apps/stage-tamagotchi/src/main/services/airi/
  AIRI memory、agent、dream、computer-use、routines、chat-runtime 等核心服务。

apps/stage-tamagotchi/src/renderer/pages/settings/memory/
  Memory 设置页和拆分后的 Vue 组件。

apps/stage-tamagotchi/src/renderer/stores/settings/
  renderer 侧 Pinia store，承接 memory/agent/dream/computer-use/routines 配置与状态。

apps/stage-tamagotchi/src/shared/eventa.ts
  Electron main/renderer 的 Eventa IPC/RPC 类型契约。

docs/ai/
  项目计划、技术报告、迁移指南、隐私检查、聊天记录导入教程等中文文档。

scripts/
  备份、恢复、迁移预检、本地服务预检、公开隐私扫描、public release、bootstrap 等 PowerShell 脚本。

scripts/training/gemma-qlora/
  Gemma QLoRA 训练脚本模板和训练说明。

stt-whisper/、stt-funasr/
  本地 STT 服务脚本和 requirements。Python venv 可重建，不应提交虚拟环境。

gsv/
  GPT-SoVITS 本地资产入口。真实模型和语音素材不进 Git。
```

## 7. GitHub 上传策略

### 私有仓库

私有仓库可以上传完整源码、文档、脚本和工程改造，用于换电脑和继续开发。

但即使是私有仓库，也不建议上传：

- `node_modules`
- Python venv
- 真实聊天记录
- Memory DB
- API key / token
- 模型权重
- GPT-SoVITS 音色资产
- 私人语音素材

这些应该走本地备份包或外置硬盘。

### 公开仓库

当前主工程不建议原样公开。开源隐私扫描仍会发现个人画像、本地路径和聊天记录语境。

如果要公开展示，推荐使用：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\create-airi-public-release.ps1 `
  -OutputDir .\tmp-public-release `
  -Force
```

当前 `tmp-public-release/` 已验证为：

```text
releaseReady: true
blockerCount: 0
warningCount: 0
```

这份适合单独上传到公开 GitHub 仓库，用于项目展示。

## 8. 换电脑一键部署

已经新增 GitHub bootstrap 脚本：

```text
scripts/bootstrap-airi-from-github.ps1
```

新电脑上可以先从 GitHub 下载这个脚本，然后执行：

```powershell
powershell -ExecutionPolicy Bypass -File D:\AIRI-Bootstrap\bootstrap-airi-from-github.ps1 `
  -RepoUrl https://github.com/<your-name>/<private-repo>.git `
  -DestinationRoot F:\project\airi-gemma `
  -BackupPath D:\AIRI-Backup\airi-gemma-backup-YYYYMMDD-HHMMSS `
  -ObsidianPath E:\Obsidian\Obsidian.exe `
  -CheckEndpoints
```

它会自动：

1. clone 或 pull GitHub 仓库。
2. 运行 `pnpm install`。
3. 如果传入 `-BackupPath`，恢复本地备份包里的 local data。
4. 运行迁移预检。
5. 运行本地服务预检。
6. 运行 `pnpm -F @proj-airi/stage-tamagotchi typecheck`。

注意：GitHub 仓库不能替代本地备份包。真实 Memory DB、聊天记录、语音素材、模型权重和 API key 仍然要通过 `backup-airi.ps1` 或外置硬盘迁移。

如果你想把当前开发进度做成一个可直接搬走、适合放到私有 GitHub Release 的轻量压缩包，可以使用：

```text
scripts/create-airi-dev-package.ps1
```

生成命令：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\create-airi-dev-package.ps1 `
  -OutputDir D:\AIRI-Backup `
  -Force
```

新电脑解压后运行包内的 `install-from-package.ps1`，它会恢复项目、本地数据、安装依赖，并执行迁移和本地服务预检。

注意：默认 `Source` 模式不包含真实本地数据。如果要做完整私有迁移包，使用：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\create-airi-dev-package.ps1 `
  -OutputDir D:\AIRI-Backup `
  -PackageMode PrivateFull `
  -Force
```

`PrivateFull` 包通常不适合 GitHub Release，因为 GitHub Release 单个资产文件有 2 GiB 限制，真实语音、STT 和模型资产很容易超出。

### GitHub Release 是否能放一键安装包

- **私有仓库 Release**：可以放默认 `Source` 包，前提是 zip 小于 GitHub Release 单文件限制。
- **公开仓库 Release**：只放 `create-airi-public-release.ps1` 生成的脱敏包。
- **完整私有资产包**：不建议放 GitHub Release。用外置硬盘、NAS、OneDrive、百度网盘，或后续分卷包加 sha256 校验清单。

## 9. 当前验证状态

最近已通过：

```powershell
pnpm -F @proj-airi/stage-tamagotchi typecheck
pnpm exec vitest run apps/stage-tamagotchi/src/renderer/stores/settings apps/stage-tamagotchi/src/renderer/pages/settings/memory apps/stage-tamagotchi/scripts/migration-scripts.test.ts
pnpm exec vitest run apps/stage-tamagotchi/scripts/migration-scripts.test.ts
git diff --check
powershell -ExecutionPolicy Bypass -File .\scripts\check-airi-migration.ps1
```

结果摘要：

- Memory 设置页、settings stores 和迁移脚本范围：`48` 个测试文件、`90` 个用例通过。
- 迁移脚本单测：`16` 个用例通过。
- `@proj-airi/stage-tamagotchi` typecheck 通过。
- `git diff --check` 通过，仅有 Windows 换行提示。
- 迁移预检 `ready: true`。
- 唯一 recommended 缺口：当前还没有真实 AIRI `userData/memory/pglite`。

## 10. 下一步建议

### 10.1 上传 GitHub 前

1. 确认目标是私有仓库还是公开仓库。
2. 私有仓库：整理 commit，确认 `.gitignore` 排除了 venv、模型权重、语音素材和私有数据。
3. 公开仓库：只上传 `tmp-public-release/` 或单独 public branch。
4. 再跑一次：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-airi-open-source.ps1
```

### 10.2 迁移设备前

1. 先上传私有 GitHub 仓库。
2. 跑：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-airi-migration.ps1
```

3. 做本地备份：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup-airi.ps1 -OutputDir D:\AIRI-Backup
```

4. 如果希望保存为一个适合私有 GitHub Release 的轻量 zip 安装包，运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\create-airi-dev-package.ps1 `
  -OutputDir D:\AIRI-Backup `
  -Force
```

5. 把 GitHub 仓库地址和 `D:\AIRI-Backup` 备份包都保存好。

### 10.3 后续产品化

- 用脱敏样例数据先完整试跑导入、审查、RAG、LLMWiki、Obsidian 导出。
- 再导入一小份真实聊天记录，确认 Review Workbench 和隐私分级符合预期。
- 继续改 Memory 设置页，把页面级派生逻辑抽到 composable。
- 做本地 Gemma runtime 和语音服务的连接诊断 UI。
- 最后再做 UI 美化和真机 LoRA 训练。

## 11. 文档入口

- `docs/ai/PROJECT_STATUS.zh-CN.md`：当前工程状态。
- `docs/ai/MIGRATION.zh-CN.md`：迁移与备份指南。
- `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md`：主设计文档。
- `docs/ai/gemma-lora-memory-agent-report.zh-CN.md`：LoRA 与面试表达技术报告。
- `docs/ai/chat-record-export-import-guide.zh-CN.md`：聊天记录导出导入教程。
- `docs/ai/LOCAL_MODEL_VOICE_SETUP.zh-CN.md`：本地模型和语音服务指南。
- `docs/ai/OPEN_SOURCE_PRIVACY_CHECKLIST.zh-CN.md`：开源隐私检查清单。
- `docs/ai/hermes-memory-system-reference.zh-CN.md`：Hermes 记忆系统参考。
- `docs/ai/llmwiki-pattern-reference.zh-CN.md`：LLMWiki 思想参考。
