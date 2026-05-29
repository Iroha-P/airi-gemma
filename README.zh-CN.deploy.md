# AIRI + Gemma 4 桌面宠物部署指南

基于 [Project AIRI](https://github.com/moeru-ai/airi) 搭建本地 AI 桌面宠物，使用 Google Gemma 4 作为大脑，完全本地运行，无需付费 API。

## 效果展示

- 桌面宠物角色（Live2D / VRM 模型）
- 文字对话（Gemma 4 驱动）
- 本地语音合成（Kokoro TTS）
- 支持 Windows / macOS

## 前置要求

| 项目 | 要求 |
|------|------|
| 操作系统 | Windows 10/11 或 macOS |
| Node.js | >= 18 |
| Git | 已安装 |
| 显卡 | NVIDIA（推荐 8GB 显存以上） |
| 磁盘空间 | 项目约 2GB + 模型约 3-8GB |

## 快速开始

### 1. 安装 pnpm

```bash
npm install -g pnpm
```

国内用户建议切换镜像：

```bash
pnpm config set registry https://registry.npmmirror.com
```

### 2. 克隆并安装项目

```bash
git clone https://github.com/Iroha-P/airi.git
cd airi
pnpm install
```

> **已知问题：** `canvas` 包可能编译失败（需要 Visual Studio C++ 工具），该包仅 Minecraft 服务使用。可跳过：
> ```bash
> pnpm install --filter "!@proj-airi/minecraft"
> ```

### 3. 安装 Ollama

1. 访问 https://ollama.com/download 下载安装
2. 安装完成后重新打开终端（环境变量需要刷新）
3. 验证：`ollama --version`

**修改模型存储路径（可选）：**

默认存储在 C 盘，如需更改：

- Windows：添加系统环境变量 `OLLAMA_MODELS`，值为目标路径（如 `F:\ollama\models`）
- 必须在拉取模型之前设置

### 4. 下载 Gemma 4 模型

根据你的显卡选择合适的模型：

| 模型 | 显存需求 | 说明 |
|------|----------|------|
| `gemma4:e4b` | ~3-4 GB | **推荐**，8GB 显卡流畅运行 |
| `gemma4:e2b` | ~2 GB | 轻量版，显存极小的设备 |
| `gemma4` (26B MoE) | ~10-14 GB | 效果最好，需要 12GB+ 显卡 |
| `gemma4:31b` | ~16 GB+ | 需要高端显卡 |

```bash
# 推荐（8GB 显卡最佳选择）
ollama pull gemma4:e4b
```

测试模型：

```bash
ollama run gemma4:e4b
# 输入文字测试，/bye 退出
```

### 5. 启动桌面宠物

```bash
pnpm dev:tamagotchi
```

## 配置 AIRI

### 首次启动

启动后弹出欢迎页面，点击右边的 **"配置您自己的 AI 服务来源"**（不需要登录）。

### 配置 LLM 大脑（意识模块）

进入 **设置 -> 机体模块 -> 意识**：

1. 选择 **Ollama** 作为提供商
2. API 地址：`http://localhost:11434/v1/`
3. 模型：`gemma4:e4b`
4. API Key：留空或随意填写

### 配置语音合成（发声模块）

进入 **设置 -> 机体模块 -> 发声**：

1. 选择 **Kokoro TTS（本地）**
2. 模型选择 **FP32 (WebGPU)**（GPU 加速，速度最快）
3. 如果不支持 WebGPU，选 **FP32 (WASM)**

### 配置语音识别（听觉模块，可选）

进入 **设置 -> 机体模块 -> 听觉**：

- 目前无免费本地 STT 内置
- 可跳过，先用键盘文字聊天

### 打开聊天窗口

聊天窗口是独立浮窗，不在主窗口中：

1. 鼠标移到角色模型上，出现控制岛按钮
2. 点击 **聊天气泡图标** 打开聊天窗口
3. 在输入框中打字，Enter 发送

## 常见问题

### 端口冲突 (EADDRINUSE 6121)

之前的进程没有完全退出：

```bash
# Windows
taskkill /F /IM electron.exe
# 然后重新启动
pnpm dev:tamagotchi
```

### Ollama 命令无法识别

安装后需要**重新打开终端**，或使用完整路径：

```powershell
& "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" --version
```

### pnpm install 下载慢或超时

切换国内镜像后重试：

```bash
pnpm config set registry https://registry.npmmirror.com
pnpm install
```

### 桌面宠物无法对话

1. 确认 Ollama 正在运行：`curl http://localhost:11434`
2. 确认模型已下载：`ollama list`
3. 检查 AIRI 设置中 API 地址是否正确（末尾需要 `/v1/`）

## 常用命令

```bash
# 启动桌面宠物
pnpm dev:tamagotchi

# 启动网页版
pnpm dev

# 查看已下载的模型
ollama list

# 删除模型
ollama rm <模型名>

# 更新模型
ollama pull <模型名>
```

## 技术栈

- **AIRI**：基于 Vue.js + Electron 的桌面宠物框架
- **Gemma 4**：Google 开源大语言模型（Apache 2.0 许可）
- **Ollama**：本地模型运行工具，提供 OpenAI 兼容 API
- **Kokoro TTS**：本地语音合成
- **xsai**：AIRI 的 LLM 接入层，兼容 OpenAI API 格式

## 进阶：接入 GPT-SoVITS 语音合成

如果你有训练好的 GPT-SoVITS 模型，可以替代或并存 Kokoro TTS，获得更好的中日文语音效果。

### 1. 启动 GPT-SoVITS API 服务

```bash
# 进入 GPT-SoVITS 目录
cd E:\GPT-SoVITS-v2pro-20250604

# 启动 API 服务
runtime\python.exe api_v2.py -a 127.0.0.1 -p 9881
```

### 2. 在 AIRI 中配置

进入 **设置 -> 机体模块 -> 发声**：

1. 选择 **GPT-SoVITS (本地)** 作为提供商
2. 服务地址：`http://127.0.0.1:9881`
3. 参考音频路径：填写你的参考音频绝对路径（如 `E:\models\character\ref.wav`）
4. 提示文本：填写参考音频的文字内容
5. 提示语言 / 合成语言：选择对应语言（ja / zh / en）
6. 建议开启**流式模式**以降低延迟

## 进阶：接入本地语音识别（STT）

提供两种本地 STT 方案，均兼容 OpenAI API 格式，可在 AIRI 中随时切换。

| 方案 | 优势 | 显存占用 | 适合场景 |
|------|------|----------|----------|
| **faster-whisper** | 多语言、成熟稳定 | ~1 GB (small) | 日英混合、通用场景 |
| **Paraformer (FunASR)** | 中文识别极强、延迟低 | ~0.5 GB | 中文为主的对话 |

---

### 方案 A：faster-whisper-server

基于 OpenAI Whisper 的加速版本，多语言支持好。

#### 1. 安装

需要 Python 3.8+，推荐使用虚拟环境：

```bash
# 创建虚拟环境（可选但推荐）
python -m venv stt-env
# Windows 激活
stt-env\Scripts\activate

# 安装 faster-whisper-server
pip install faster-whisper-server
```

> **CUDA 用户：** faster-whisper 默认使用 CUDA 加速。如果遇到 CUDA 相关错误，确保已安装 [CUDA Toolkit](https://developer.nvidia.com/cuda-toolkit) 和 [cuDNN](https://developer.nvidia.com/cudnn)。

#### 2. 启动服务

```bash
# small 模型（约 1GB 显存，推荐）
faster-whisper-server --host 127.0.0.1 --port 8000 --model Systran/faster-whisper-small

# 如果显存紧张，可用 CPU 模式（速度稍慢但不占显存）
faster-whisper-server --host 127.0.0.1 --port 8000 --model Systran/faster-whisper-small --device cpu
```

首次启动会自动下载模型（约 500MB），之后直接加载。

#### 3. 在 AIRI 中配置

进入 **设置 -> 机体模块 -> 听觉**：

1. 选择 **OpenAI Compatible** 作为提供商
2. API 地址：`http://127.0.0.1:8000/v1/`
3. API Key：随便填（如 `sk-local`）
4. 模型：`Systran/faster-whisper-small`

---

### 方案 B：Paraformer（FunASR）

阿里达摩院开源的语音识别模型，中文识别效果极佳，延迟低于 Whisper。

#### 1. 安装

需要 Python 3.8+，推荐使用独立虚拟环境：

```bash
# 创建虚拟环境（可选但推荐）
python -m venv funasr-env
# Windows 激活
funasr-env\Scripts\activate

# 安装 FunASR
pip install funasr

# 安装 PyTorch（如果还没装）— 选择你的 CUDA 版本
# CUDA 11.8
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118
# CUDA 12.1
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu121
# CPU 版本
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
```

#### 2. 创建 OpenAI 兼容服务

FunASR 本身不提供 OpenAI 兼容 API，需要一个简单的包装服务。在任意位置创建 `funasr_server.py`：

```python
"""FunASR Paraformer — OpenAI Compatible STT Server"""
import io
import tempfile
import uvicorn
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from funasr import AutoModel

app = FastAPI()

# 加载 Paraformer 模型（首次运行自动下载，约 500MB）
model = AutoModel(
    model="paraformer-zh",       # 中文优化版
    vad_model="fsmn-vad",        # 语音活动检测
    punc_model="ct-punc",        # 标点恢复
)

@app.post("/v1/audio/transcriptions")
async def transcribe(
    file: UploadFile = File(...),
    model_name: str = Form(default="paraformer-zh", alias="model"),
    language: str = Form(default="zh"),
):
    # 保存上传的音频到临时文件
    audio_bytes = await file.read()
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    # 识别
    result = model.generate(input=tmp_path)
    text = result[0]["text"] if result else ""

    return JSONResponse({"text": text})

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
```

安装服务依赖：

```bash
pip install fastapi uvicorn python-multipart
```

#### 3. 启动服务

```bash
python funasr_server.py
```

首次启动会自动下载 Paraformer 模型（约 500MB），之后直接加载。

#### 4. 在 AIRI 中配置

进入 **设置 -> 机体模块 -> 听觉**：

1. 选择 **OpenAI Compatible** 作为提供商
2. API 地址：`http://127.0.0.1:8000/v1/`
3. API Key：随便填（如 `sk-local`）
4. 模型：`paraformer-zh`

---

### 切换 STT 方案

两个方案都使用 `http://127.0.0.1:8000` 端口，同一时间只运行一个即可。切换时：

1. 关闭当前运行的 STT 服务（Ctrl+C）
2. 启动另一个 STT 服务
3. 在 AIRI 设置中修改模型名称（`Systran/faster-whisper-small` 或 `paraformer-zh`）

如果想同时运行两个，把其中一个改到不同端口（如 8001），然后在 AIRI 中切换 API 地址。

### 显存预算参考（以 8GB 显卡为例）

| 服务 | 显存占用 |
|------|----------|
| Gemma 4 E4B (Ollama) | ~3-4 GB |
| GPT-SoVITS | ~2-3 GB |
| faster-whisper-small | ~1 GB |
| Paraformer | ~0.5 GB |
| **合计（选一个 STT）** | **~6-8 GB** |

> 如果显存不够，两个 STT 方案都支持 CPU 模式运行，速度稍慢但不占显存。
> - faster-whisper：启动时加 `--device cpu`
> - Paraformer：安装 CPU 版 PyTorch 即可

## 一键启动

项目根目录提供了启动脚本：

- **一键启动.bat** — 自动启动 Ollama + AIRI（支持编译版和开发版）
- **一键关闭.bat** — 关闭所有相关进程

首次使用建议先编译便携版：

```bash
pnpm -rF @proj-airi/stage-tamagotchi run build:unpack
```

编译后双击 `一键启动.bat` 即可秒开。

## 致谢

- [Project AIRI (moeru-ai/airi)](https://github.com/moeru-ai/airi) - 原始项目
- [Ollama](https://ollama.com) - 本地模型运行
- [Google Gemma](https://ai.google.dev/gemma) - 开源大语言模型
