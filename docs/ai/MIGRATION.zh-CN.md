# AIRI Gemma 项目迁移与备份指南

本文用于毕业后换电脑、重装系统或移动项目目录时，恢复 AIRI Gemma 的开发环境、记忆数据、本地知识库和语音/模型资产。

## 1. 迁移目标

迁移分成两层：

- **项目层**：源码、文档、配置、脚本、`pnpm-lock.yaml`。推荐通过 Git 或完整文件夹备份保存。
- **本机数据层**：AIRI 本地记忆库、LLMWiki、Obsidian/AIRI-Brain vault、模型权重、语音素材、STT/TTS 服务配置、私有密钥。这些默认不进入 Git，需要单独备份。

换电脑时，不建议直接拷贝 `node_modules`、`dist`、`out`、`build`、`.turbo` 这类可重新生成的目录。

## 2. 建议备份内容

### 2.1 必备

| 内容 | 位置 | 说明 |
| --- | --- | --- |
| 项目源码 | `F:\project\airi-gemma` | 包含当前开发改动、文档和脚本 |
| pnpm lockfile | `pnpm-lock.yaml` | 保证新电脑安装依赖版本一致 |
| 主设计文档 | `docs/ai/airi-memory-agent-orchestrator-design.zh-CN.md` | 后续开发依据 |
| 一周完善计划 | `docs/ai/graduation-delivery-plan.zh-CN.md` | 毕业后迁移和继续开发优先级 |
| 迁移脚本 | `scripts/backup-airi.ps1`、`scripts/restore-airi.ps1` | 自动备份和恢复项目数据 |
| 迁移预检脚本 | `scripts/check-airi-migration.ps1` | 换设备前检查必备文件、本地服务目录和 AIRI userData |
| GitHub 一键部署脚本 | `scripts/bootstrap-airi-from-github.ps1` | 新电脑 clone/pull GitHub 仓库、安装依赖、恢复本地备份并运行预检 |
| 一键压缩开发安装包 | `scripts/create-airi-dev-package.ps1` | 把当前工作区开发进度和本地数据备份成一个 zip，并在包内生成安装脚本 |
| 开源隐私预检 | `scripts/check-airi-open-source.ps1`、`docs/ai/OPEN_SOURCE_PRIVACY_CHECKLIST.zh-CN.md` | 开源、公开报告或 demo 发布前检查脱敏风险 |
| 公开候选包生成 | `scripts/create-airi-public-release.ps1` | 生成独立脱敏 public release 包，包含公开画像、public LoRA 样例、manifest 和扫描摘要 |
| 本地服务预检 | `scripts/check-airi-local-services.ps1` | 检查 Obsidian、语音/STT 目录、基础命令和可选本地 endpoint |
| Obsidian vault 预检 | `scripts/check-airi-obsidian-vault.ps1` | 检查 AIRI-Brain 首页、索引、日志、manifest 和 Obsidian 可执行文件 |
| readiness 汇总 | `scripts/collect-airi-readiness.ps1` | 一次性生成迁移、开源、本地服务、Obsidian vault JSON 报告和汇总 |
| 迁移 smoke 演练 | `scripts/run-airi-migration-smoke.ps1` | 生成脱敏样例并汇总 readiness，适合换电脑前快速验收 |
| 启动脚本 | `start.bat`、`一键启动.bat`、`一键关闭.bat` | 新电脑快速启动入口 |
| AIRI 本地记忆库 | Electron `userData\memory\pglite` | Memory Service 的 PGlite 数据 |
| Memory JSON 备份 | `airi-brain/95-backups/airi-memory-backup.json` | 跨电脑恢复时优先使用 |
| LLMWiki 导出 | `airi-brain/70-llmwiki/` | 面向 RAG/知识库整理的 Markdown 结构 |
| Obsidian/AIRI-Brain vault | `airi-brain/` | 面向人类阅读和 Obsidian 图谱管理 |
| 本地语音/模型资产 | `gsv/`、语音角色素材、模型权重 | 体积较大，默认不进 Git |
| 本地 STT 服务脚本与配置 | `stt-whisper/`、`stt-funasr/` | Python 环境可重建，配置和脚本需要保留 |

### 2.2 可重建

| 内容 | 处理方式 |
| --- | --- |
| `node_modules` | 新电脑运行 `pnpm install` |
| `.turbo`、`.cache` | 自动生成 |
| `dist`、`out`、`build` | 重新构建 |
| Python venv 目录 | 推荐新电脑重新创建 |

### 2.3 不建议公开

- 微信、飞书、QQ 聊天原文。
- 本地 Memory DB。
- Memory JSON 备份。
- 私有语音素材和模型权重。
- `.env`、证书、API key、token。
- 真实文件路径、账号信息、联系人关系和个人生活细节。

## 3. AIRI 本地记忆库位置

Memory Service 当前设计为 Electron main process 使用 PGlite + Drizzle，数据目录：

```text
app.getPath('userData')/memory/pglite
```

Windows 上一般位于：

```text
%APPDATA%\<AIRI 应用名>\memory\pglite
```

因为 Electron 应用名可能随开发版/打包版变化，备份脚本会优先扫描 `%APPDATA%` 下可能包含 `memory\pglite` 的 AIRI 目录。找不到时，可以手动传入 `-AiriUserDataPath`。

## 4. 迁移前一小时检查清单

换设备前建议按这个顺序做一次：

1. 先运行迁移预检脚本，看必备文件、本地服务目录、基础命令环境和 Git 工作区状态是否齐全。

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-airi-migration.ps1
```

如果希望把结果保存成 JSON：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-airi-migration.ps1 `
  -OutputPath D:\AIRI-Backup\migration-check.json
```

2. 运行本地服务预检脚本，确认 Obsidian、语音/STT 目录、基础命令和 NVIDIA GPU 是否能在当前机器上识别。

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-airi-local-services.ps1 `
  -ObsidianPath E:\Obsidian\Obsidian.exe
```

如果已经启动 Ollama、LM Studio 或 GPT-SoVITS，可以加 `-CheckEndpoints` 检查常见本地 endpoint：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-airi-local-services.ps1 `
  -ObsidianPath E:\Obsidian\Obsidian.exe `
  -CheckEndpoints
```

3. 如果已经导出 Obsidian/AIRI-Brain vault，运行 vault 预检，确认迁移包里的人类可读层结构完整。

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-airi-obsidian-vault.ps1 `
  -VaultPath .\airi-brain `
  -ObsidianPath E:\Obsidian\Obsidian.exe
```

4. 生成 readiness 汇总报告，便于换电脑前留档。

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\collect-airi-readiness.ps1 `
  -OutputDir D:\AIRI-Backup\readiness `
  -ObsidianPath E:\Obsidian\Obsidian.exe `
  -CheckEndpoints
```

5. 做一次不含真实隐私数据的迁移 smoke 演练，确认脱敏样例和 readiness 报告能完整生成。

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-airi-migration-smoke.ps1 `
  -OutputDir D:\AIRI-Backup\migration-smoke `
  -ObsidianPath E:\Obsidian\Obsidian.exe `
  -CheckEndpoints
```

6. 关闭 AIRI、Ollama、GPT-SoVITS、Whisper/FunASR 等正在写数据的进程。
7. 在 AIRI 设置页导出 `airi-memory-backup.json`。
8. 导出 LLMWiki。
9. 导出 Obsidian/AIRI-Brain vault。
10. 如果已经生成 LoRA 训练包，单独复制到备份目录。
11. 确认 `.env`、API key、token 只进入私有备份，不进入 Git。
12. 运行备份脚本。

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup-airi.ps1 -OutputDir D:\AIRI-Backup
```

如果脚本无法自动找到 AIRI `userData`：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup-airi.ps1 `
  -OutputDir D:\AIRI-Backup `
  -AiriUserDataPath "$env:APPDATA\AIRI"
```

备份脚本当前应包含：

- 项目源码。
- `start.bat`、`一键启动.bat`、`一键关闭.bat`。
- AIRI `userData`。
- `airi-brain/`，会作为 `local-data/airi-brain` 单独备份，不混入源码快照。
- `gsv/`。
- `stt-whisper/`。
- `stt-funasr/`。

### 4.1 一键压缩开发安装包

如果你希望把当前开发进度做成一个可搬走的压缩包，而不是只保留展开的备份目录，可以运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\create-airi-dev-package.ps1 `
  -OutputDir D:\AIRI-Backup `
  -Force
```

生成结果类似：

```text
D:\AIRI-Backup\airi-gemma-dev-package-YYYYMMDD-HHMMSS.zip
```

这个 zip 会包含：

- 当前工作区源码、文档、脚本和未提交开发进度快照。
- 包内安装入口 `install-from-package.ps1`。
- 包内说明 `INSTALL.zh-CN.md`。

默认模式是 `Source`，适合放到私有 GitHub Release：不包含 `.git`、`node_modules`、构建产物、`airi-brain/`、`gsv/`、`stt-whisper/`、`stt-funasr/`、AIRI `userData` 和其他真实本地数据。新电脑上解压后运行：

```powershell
Expand-Archive D:\AIRI-Backup\airi-gemma-dev-package-YYYYMMDD-HHMMSS.zip -DestinationPath D:\AIRI-Package

powershell -ExecutionPolicy Bypass -File D:\AIRI-Package\install-from-package.ps1 `
  -DestinationRoot F:\project\airi-gemma `
  -ObsidianPath E:\Obsidian\Obsidian.exe
```

如果目标目录已经有文件，并且你确认要覆盖，加 `-Force`。如果只想先恢复文件，不想安装依赖和跑 typecheck，加 `-SkipInstall -SkipTypecheck`。

如果你要做完整私有迁移包，显式使用：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\create-airi-dev-package.ps1 `
  -OutputDir D:\AIRI-Backup `
  -PackageMode PrivateFull `
  -Force
```

`PrivateFull` 会尝试包含 `airi-brain/`、`gsv/`、`stt-whisper/`、`stt-funasr/` 和可找到的 AIRI `userData`，体积可能很大，适合外置硬盘、NAS 或私有网盘，不适合公开 GitHub Release。

## 5. 新电脑恢复流程

### 5.0 GitHub 上传后一键部署

推荐把迁移拆成两份材料：

- **GitHub 私有仓库**：源码、文档、脚本、`pnpm-lock.yaml`、STT 服务脚本和训练脚本。
- **本地备份包**：AIRI `userData`、`airi-brain/`、GPT-SoVITS 资产、语音素材、模型权重和其他不适合进 Git 的文件。

新电脑上准备好 Git、Node.js、pnpm、Python、显卡驱动和 Ollama/LM Studio 等基础环境后，可以用 bootstrap 脚本一键拉取和恢复：

如果新电脑还没有这个仓库，先从 GitHub 下载 bootstrap 脚本到临时目录。不要直接执行未知远程脚本，先下载后打开看一眼：

```powershell
New-Item -ItemType Directory -Force -Path D:\AIRI-Bootstrap | Out-Null
Invoke-WebRequest `
  -Uri https://raw.githubusercontent.com/<your-name>/<private-repo>/<branch>/scripts/bootstrap-airi-from-github.ps1 `
  -OutFile D:\AIRI-Bootstrap\bootstrap-airi-from-github.ps1
```

然后运行：

```powershell
powershell -ExecutionPolicy Bypass -File D:\AIRI-Bootstrap\bootstrap-airi-from-github.ps1 `
  -RepoUrl https://github.com/<your-name>/<private-repo>.git `
  -DestinationRoot F:\project\airi-gemma `
  -BackupPath D:\AIRI-Backup\airi-gemma-backup-YYYYMMDD-HHMMSS `
  -ObsidianPath E:\Obsidian\Obsidian.exe `
  -CheckEndpoints
```

如果新电脑还没有项目目录，脚本会自动 `git clone`。如果目录已经是 Git 仓库且没有本地改动，脚本会 `git pull --rebase`；如果已有本地改动，它会跳过 pull，避免覆盖未保存工作。

脚本会按顺序执行：

1. 检查 `git` 和 `pnpm` 命令。
2. clone 或更新 GitHub 仓库。
3. 运行 `pnpm install`。
4. 如果传入 `-BackupPath`，调用 `restore-airi.ps1 -RestoreLocalData` 恢复本地数据。
5. 运行 `check-airi-migration.ps1`。
6. 运行 `check-airi-local-services.ps1`。
7. 运行 `pnpm -F @proj-airi/stage-tamagotchi typecheck`。

如果只是先拉源码，不恢复本地数据：

```powershell
powershell -ExecutionPolicy Bypass -File D:\AIRI-Bootstrap\bootstrap-airi-from-github.ps1 `
  -RepoUrl https://github.com/<your-name>/<private-repo>.git `
  -DestinationRoot F:\project\airi-gemma
```

如果新电脑依赖已经安装过，想跳过耗时步骤：

```powershell
powershell -ExecutionPolicy Bypass -File D:\AIRI-Bootstrap\bootstrap-airi-from-github.ps1 `
  -RepoUrl https://github.com/<your-name>/<private-repo>.git `
  -DestinationRoot F:\project\airi-gemma `
  -SkipInstall `
  -SkipTypecheck
```

注意：GitHub 仓库不能替代本地备份包。真实 Memory DB、聊天记录、语音素材、模型权重和 API key 不应进入 Git；这些必须通过 `backup-airi.ps1` 生成的备份包或外置硬盘迁移。

### 5.1 基础环境

先安装：

- Git。
- Node.js。
- pnpm。
- Python。
- CUDA/显卡驱动。
- 本地 LLM 运行工具，例如 Ollama、LM Studio 或 OpenAI-compatible server。
- 本地 TTS/STT 所需环境。

### 5.2 恢复备份

将备份包复制到新电脑后运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\restore-airi.ps1 `
  -BackupPath D:\AIRI-Backup\airi-gemma-backup-YYYYMMDD-HHMMSS `
  -RestoreLocalData
```

如果新电脑还没有项目源码，可以把项目恢复到一个空目录：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\restore-airi.ps1 `
  -BackupPath D:\AIRI-Backup\airi-gemma-backup-YYYYMMDD-HHMMSS `
  -DestinationRoot F:\project\airi-gemma `
  -RestoreProject
```

如果目标目录已经有文件，脚本会拒绝覆盖；只有确认要覆盖时才添加 `-Force`。

恢复 AIRI `userData` 时，脚本默认写入新电脑当前用户的 `%APPDATA%\AIRI`，不会复用备份 manifest 里记录的旧电脑绝对路径。只有你明确想恢复到自定义目录时，才传入 `-AiriUserDataPath`：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\restore-airi.ps1 `
  -BackupPath D:\AIRI-Backup\airi-gemma-backup-YYYYMMDD-HHMMSS `
  -RestoreLocalData `
  -AiriUserDataPath "$env:APPDATA\AIRI"
```

如果旧电脑导出了 `airi-memory-backup.json`，在 AIRI 设置页中使用“预览记忆备份”查看内容，勾选需要恢复的记录后再导入，并逐条审核。

这个 JSON 备份不会直接覆盖 PGlite 数据库。导入时会把每条记录恢复为 `needs_review`，需要用户重新审核后再激活。这样比直接复制数据库目录更适合跨电脑迁移。

### 5.3 安装依赖与检查

在项目目录中运行：

```powershell
pnpm install
pnpm -F @proj-airi/stage-tamagotchi typecheck
```

如需检查记忆相关核心测试，可运行：

```powershell
pnpm exec vitest run `
  apps/stage-tamagotchi/src/main/services/airi/memory/backup.test.ts `
  apps/stage-tamagotchi/src/main/services/airi/memory/obsidian-vault.test.ts `
  apps/stage-tamagotchi/src/main/services/airi/memory/llmwiki.test.ts
```

最后启动本地 LLM、TTS、STT 服务，再启动 AIRI。

## 6. 迁移后检查清单

- `scripts/check-airi-migration.ps1` 输出 `ready: true`，或只剩可接受的 recommended 缺失项；同时查看 `gitStatus.changed`，确认工作区改动已经提交或完整备份。
- 项目能正常安装依赖。
- `pnpm -F @proj-airi/stage-tamagotchi typecheck` 通过。
- AIRI 能启动。
- Memory 设置页能打开。
- 备份 JSON 能预览。
- 选中的记忆能导入为 `needs_review`。
- 审核后的记忆能激活。
- LLMWiki 导出能看到 index/log/manifest。
- Obsidian/AIRI-Brain vault 能在 Obsidian 中打开。
- 本地 LLM provider 能连接。
- TTS/STT 服务能连接。
- 语音角色素材路径有效。
- 重要本地路径规则仍然正确。

## 7. 迁移后的继续开发建议

新电脑恢复后，优先做这些事：

- 跑通一次导入 -> 审查 -> 激活 -> RAG -> LLMWiki/Obsidian 导出链路。
- 给真实聊天记录先做脱敏备份，再导入 AIRI。
- 不要把真实个人数据放进公开仓库。
- 如果要训练 LoRA，先用少量脱敏数据跑 dry-run。
- UI 美化可以继续做，但不要破坏记忆、备份、恢复和安全审查链路。
