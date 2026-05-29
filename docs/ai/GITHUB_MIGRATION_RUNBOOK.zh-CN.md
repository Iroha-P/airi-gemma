# AIRI Gemma GitHub 仓库与换电脑迁移操作说明

本文用于把当前 AIRI Gemma 改造项目上传到你的 GitHub 私有仓库，并在新电脑上恢复开发环境。

## 1. 仓库策略

当前本地项目保留两个远端：

| 远端名 | 用途 |
| --- | --- |
| `origin` | 原始 AIRI 上游仓库，用来对照或后续同步上游 |
| `clone` | 你的 AIRI Gemma 私有改造仓库，用来保存当前开发进度 |

不要把真实记忆库、聊天记录、语音素材、模型权重、Python venv、备份目录直接提交进 Git。

## 2. 已排除的本地私有/大体积内容

`.gitignore` 已排除：

- `gsv/`
- `airi-brain/`
- `backups/`
- `tmp-public-release/`
- `node_modules/`
- `stt-whisper/Lib/`、`stt-whisper/Scripts/` 等 Python venv 文件
- `stt-funasr/Lib/`、`stt-funasr/Scripts/` 等 Python venv 文件
- `*.zip`、`*.7z`、`*.tar`、`*.tar.gz`
- `.env`、证书、密钥文件、音频文件

`stt-whisper/whisper_server.py`、`stt-whisper/requirements.txt`、`stt-funasr/funasr_server.py`、`stt-funasr/requirements.txt` 可以进入 Git，因为它们是服务脚本，不是模型权重或 venv。

## 3. 上传当前项目到你的私有仓库

本机已登录 GitHub CLI 后，创建私有仓库：

```powershell
gh repo create Iroha-P/airi-gemma `
  --private `
  --description "AIRI Gemma local-first memory agent clone" `
  --source . `
  --remote clone `
  --push
```

如果仓库已经存在，只需要添加远端并推送：

```powershell
git remote add clone https://github.com/Iroha-P/airi-gemma.git
git push -u clone codex/memory-service-p1
```

建议保持当前分支名：

```text
codex/memory-service-p1
```

后续如果要把它作为主分支，可以在 GitHub 网页端把 default branch 改成这个分支，或者新建 `main` 分支再推送。

## 4. 上传一键安装包到 GitHub Release

当前推荐上传轻量 Source 包：

```text
F:\project\airi-gemma-release-packages\airi-gemma-dev-package-20260529-120758.zip
```

这个包不包含 `gsv/`、`stt-whisper/`、`stt-funasr/`、`airi-brain/`、`backups/`、`.git/`、`node_modules/`。

创建 Release：

```powershell
gh release create v0.1.0-migration `
  F:\project\airi-gemma-release-packages\airi-gemma-dev-package-20260529-120758.zip `
  --repo Iroha-P/airi-gemma `
  --target codex/memory-service-p1 `
  --title "AIRI Gemma migration package v0.1.0" `
  --notes "Source package for private migration. Large local assets are excluded."
```

GitHub Release 单个资产文件限制是 2 GiB。完整私有资产包通常会超过这个限制，不建议上传 GitHub Release。

## 5. 新电脑恢复方式 A：从 GitHub 仓库恢复

在新电脑安装：

- Git
- Node.js
- pnpm
- Python 3.11 或项目需要的 Python 版本
- GPU 驱动、CUDA、Ollama/LM Studio 等本地模型环境
- Obsidian，如果要看 `airi-brain/`

克隆仓库：

```powershell
git clone https://github.com/Iroha-P/airi-gemma.git F:\project\airi-gemma
cd F:\project\airi-gemma
git checkout codex/memory-service-p1
pnpm install
pnpm -F @proj-airi/stage-tamagotchi typecheck
```

运行迁移预检：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-airi-migration.ps1
```

如果有 Obsidian：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-airi-local-services.ps1 `
  -ObsidianPath E:\Obsidian\Obsidian.exe
```

## 6. 新电脑恢复方式 B：从 Release 一键安装包恢复

下载 Release 里的 zip 后：

```powershell
Expand-Archive D:\AIRI-Backup\airi-gemma-dev-package-20260529-120758.zip -DestinationPath D:\AIRI-Package

powershell -ExecutionPolicy Bypass -File D:\AIRI-Package\install-from-package.ps1 `
  -DestinationRoot F:\project\airi-gemma `
  -ObsidianPath E:\Obsidian\Obsidian.exe
```

如果目标目录已有文件，确认要覆盖时再加：

```powershell
-Force
```

如果只想恢复文件，暂时不安装依赖和 typecheck：

```powershell
-SkipInstall -SkipTypecheck
```

## 7. 私有数据迁移

GitHub 仓库和轻量 Release 包不包含真实私有数据。以下内容需要单独保存：

- AIRI `userData/memory/pglite`
- `airi-brain/`
- 微信、飞书、QQ 聊天记录原始导出
- GPT-SoVITS 资产和语音素材
- 本地 STT/TTS 模型权重
- LoRA adapter 和训练数据
- `.env`、API key、token

完整私有备份包命令：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\create-airi-dev-package.ps1 `
  -OutputDir D:\AIRI-Backup `
  -PackageMode PrivateFull `
  -Force
```

这个包适合外置硬盘、NAS、OneDrive 或百度网盘，不适合公开 GitHub。

## 8. 迁移后检查清单

新电脑恢复后确认：

- `git status` 没有异常的大量未跟踪文件。
- `pnpm install` 成功。
- `pnpm -F @proj-airi/stage-tamagotchi typecheck` 通过。
- `scripts/check-airi-migration.ps1` 输出 `ready: true`。
- 本地 LLM provider 能连接。
- STT/TTS 服务能启动。
- Memory 设置页能打开。
- `airi-brain/` 能用 Obsidian 打开。
- 真实私有数据没有被提交到公开仓库。
