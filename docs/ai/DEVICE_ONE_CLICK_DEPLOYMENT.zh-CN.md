# AIRI Gemma 换设备后一键安装部署说明

本文只讲换电脑后的两种恢复方式：

- 方法 A：从 GitHub 私有仓库恢复源码。
- 方法 B：从 GitHub Release 一键安装包恢复。

两种方法都能恢复当前工程进度，但都不包含真实私有数据。真实 Memory DB、聊天记录、语音素材、模型权重、GPT-SoVITS 资产、LoRA adapter、API key 需要单独备份。

## 0. 新电脑先准备什么

新电脑建议先安装：

- Git
- Node.js
- pnpm
- Python 3.11 或项目指定版本
- 显卡驱动和 CUDA，如果后续要跑本地模型或训练
- Ollama、LM Studio 或其他 OpenAI-compatible 本地模型服务
- Obsidian，如果你要管理 `airi-brain/`
- GPT-SoVITS、Whisper、FunASR 等语音服务依赖，如果你要恢复本地语音能力

检查基础命令：

```powershell
git --version
node --version
pnpm --version
python --version
```

## 1. 方法 A：从 GitHub 私有仓库恢复源码

适合场景：

- 新电脑可以访问 GitHub。
- 你想恢复项目源码、文档、脚本和当前工程进度。
- 你不需要通过 zip 包离线迁移。

当前仓库：

```text
https://github.com/Iroha-P/airi-gemma
```

执行：

```powershell
git clone https://github.com/Iroha-P/airi-gemma.git F:\project\airi-gemma
cd F:\project\airi-gemma
pnpm install
pnpm -F @proj-airi/stage-tamagotchi typecheck
```

然后运行迁移预检：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-airi-migration.ps1
```

如果新电脑已经安装 Obsidian：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-airi-local-services.ps1 `
  -ObsidianPath E:\Obsidian\Obsidian.exe
```

如果你想检查本地模型、TTS、STT endpoint，再加：

```powershell
-CheckEndpoints
```

例如：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-airi-local-services.ps1 `
  -ObsidianPath E:\Obsidian\Obsidian.exe `
  -CheckEndpoints
```

### 方法 A 的优点

- 最标准，最适合后续继续开发。
- 文件结构干净。
- 不依赖本地压缩包。
- 方便后续 `git pull` 更新。

### 方法 A 的限制

GitHub 仓库不包含：

- `gsv/`
- `airi-brain/`
- AIRI 本地 Memory DB
- 真实微信、飞书、QQ 聊天记录
- GPT-SoVITS 语音素材
- STT/TTS 模型权重
- LoRA adapter 和训练产物
- `.env`、API key、token

这些内容需要你单独从外置硬盘、NAS、私有网盘或完整私有备份包恢复。

## 2. 方法 B：从 GitHub Release 一键安装包恢复

适合场景：

- 你想下载一个 zip 包后直接恢复。
- 你不想手动 clone、安装和检查。
- 你希望有一个更接近“一键部署”的入口。

当前 Release：

```text
https://github.com/Iroha-P/airi-gemma/releases/tag/v0.1.0-migration
```

下载文件：

```text
airi-gemma-dev-package-20260529-120758.zip
```

校验值：

```text
sha256: d34065bbd32a6a5203349983af764b46c99348dfcfd8eccf5ccb4c71400fc99c
```

### 2.1 解压

假设你把 zip 下载到了：

```text
D:\AIRI-Backup\airi-gemma-dev-package-20260529-120758.zip
```

解压：

```powershell
Expand-Archive D:\AIRI-Backup\airi-gemma-dev-package-20260529-120758.zip -DestinationPath D:\AIRI-Package
```

### 2.2 一键安装

执行：

```powershell
powershell -ExecutionPolicy Bypass -File D:\AIRI-Package\install-from-package.ps1 `
  -DestinationRoot F:\project\airi-gemma `
  -ObsidianPath E:\Obsidian\Obsidian.exe
```

这个脚本会做：

1. 把包内 `project/` 恢复到 `F:\project\airi-gemma`。
2. 运行 `pnpm install`。
3. 运行迁移预检。
4. 运行本地服务预检。
5. 运行 `pnpm -F @proj-airi/stage-tamagotchi typecheck`。

### 2.3 目标目录已有文件怎么办

如果目标目录已经存在并且有文件，脚本会拒绝覆盖。

你确认要覆盖时，再加 `-Force`：

```powershell
powershell -ExecutionPolicy Bypass -File D:\AIRI-Package\install-from-package.ps1 `
  -DestinationRoot F:\project\airi-gemma `
  -ObsidianPath E:\Obsidian\Obsidian.exe `
  -Force
```

### 2.4 只恢复文件，不安装依赖

如果你只是想先恢复项目文件，不想立刻安装依赖和跑 typecheck：

```powershell
powershell -ExecutionPolicy Bypass -File D:\AIRI-Package\install-from-package.ps1 `
  -DestinationRoot F:\project\airi-gemma `
  -SkipInstall `
  -SkipTypecheck
```

### 方法 B 的优点

- 操作更简单。
- 包内自带安装入口。
- 适合换设备时快速恢复工程进度。
- 不需要记太多命令。

### 方法 B 的限制

当前 Release 包是轻量 `Source` 包，不包含：

- `gsv/`
- `airi-brain/`
- `stt-whisper/` 的 venv、模型或大文件
- `stt-funasr/` 的 venv、模型或大文件
- AIRI 本地 Memory DB
- 真实聊天记录
- 语音素材
- 模型权重
- API key

所以方法 B 只能恢复工程项目本体。真实私有资产仍然需要单独恢复。

## 3. 真实私有数据怎么迁移

你需要单独保存这些内容：

| 内容 | 建议方式 |
| --- | --- |
| AIRI Memory DB | 通过 AIRI 备份导出，或备份 `%APPDATA%\AIRI` / 实际 userData |
| `airi-brain/` | 外置硬盘、NAS、私有网盘 |
| 微信、飞书、QQ 聊天记录 | 原始导出文件单独保存，不进 Git |
| GPT-SoVITS 资产 | 外置硬盘、NAS、私有网盘 |
| STT/TTS 模型权重 | 外置硬盘、NAS、私有网盘 |
| LoRA adapter | 私有模型目录或 Hugging Face private repo |
| `.env` / API key / token | 密码管理器，不要放进项目目录 |

完整私有迁移包可以用：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\create-airi-dev-package.ps1 `
  -OutputDir D:\AIRI-Backup `
  -PackageMode PrivateFull `
  -Force
```

注意：`PrivateFull` 包可能非常大，不适合 GitHub Release。建议放外置硬盘、NAS、OneDrive、百度网盘或其他私有存储。

## 4. 换设备后最终检查清单

完成方法 A 或方法 B 后，检查：

```powershell
cd F:\project\airi-gemma
git status
pnpm -F @proj-airi/stage-tamagotchi typecheck
powershell -ExecutionPolicy Bypass -File .\scripts\check-airi-migration.ps1
```

确认：

- 项目目录存在。
- `pnpm install` 成功。
- typecheck 通过。
- `check-airi-migration.ps1` 输出 `ready: true`。
- Obsidian 路径正确。
- 本地 LLM 服务能连接。
- TTS/STT 服务能启动。
- Memory 设置页能打开。
- 私有聊天记录、Memory DB、语音素材没有被误提交到 GitHub。

## 5. 推荐选择

日常换电脑继续开发：

```text
优先用方法 A：GitHub clone
```

想快速恢复、少敲命令：

```text
用方法 B：Release 一键安装包
```

要迁移真实个人记忆和模型资产：

```text
方法 A 或 B + 单独私有数据备份
```
