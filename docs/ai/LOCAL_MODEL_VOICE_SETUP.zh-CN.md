# AIRI Gemma 本地模型与语音接入指南

> 目的：把“本地 Gemma / LoRA / 语音服务怎么接入 AIRI”整理成可迁移的操作说明。本文面向 Windows 本机开发环境。

## 1. 当前机器诊断

可以运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-airi-local-services.ps1 `
  -ObsidianPath E:\Obsidian\Obsidian.exe `
  -CheckEndpoints
```

当前机器已识别：

- GPU：NVIDIA GeForce RTX 3070 Ti，8GB 显存。
- Ollama：命令存在，`http://127.0.0.1:11434/api/tags` 可达。
- Ollama OpenAI-compatible：`http://127.0.0.1:11434/v1/models` 可达。
- 当前 Ollama 模型清单：脚本检测到 `gemma4:e4b`，可直接作为本地 Agent Chat Runtime 的模型 id。
- Obsidian：`E:\Obsidian\Obsidian.exe` 可用。
- 本地目录：`gsv`、`stt-whisper`、`stt-funasr`、`scripts/training/gemma-qlora` 均存在。
- LM Studio 默认端口：当前不可达。
- GPT-SoVITS 默认端口：当前不可达，说明服务未启动或端口不是 `9880`。

## 2. AIRI 里的本地 LLM 接入方式

AIRI 当前按 OpenAI-compatible endpoint 接入 Agent Chat Runtime。推荐本地优先使用 Ollama：

```json
{
  "enabled": true,
  "provider": "openai-compatible",
  "target": "local",
  "openAICompatible": {
    "baseURL": "http://127.0.0.1:11434/v1",
    "model": "gemma4:e4b"
  }
}
```

说明：

- `target: local` 表示 RAG 可以使用本地可见记忆，但仍会拦截 `secret` 和安全风险内容。
- 如果接云端 API，必须把 `target` 改成 `cloud`，这样 RAG 只允许 `public` 记忆进入上下文。
- 本地 Ollama 通常不需要 `apiKey`。
- 如果使用 LM Studio、vLLM、llama.cpp server，只要它们提供 OpenAI-compatible `/v1/chat/completions`，就可以换 `baseURL`。

## 3. 8GB 显存能做什么

RTX 3070 Ti 8GB 可以做本地 AIRI，但要现实一点：

| 任务 | 可行性 | 建议 |
| --- | --- | --- |
| 本地 4B/7B 量化推理 | 可行 | Ollama / LM Studio / llama.cpp，优先 Q4/Q5 |
| 本地 Agent + RAG | 可行 | 模型负责对话，记忆放在 PGlite/LLMWiki，不塞进参数 |
| 4B QLoRA 微调 | 可行但需保守 | 小 batch、短序列、梯度累积、4-bit |
| 7B QLoRA 微调 | 勉强 | 数据小、参数保守，可能需要 CPU offload 或 Colab/云 GPU |
| 27B/70B 微调 | 不适合 | 使用云 GPU 或只做推理量化 |
| 全参数微调 | 不适合 | 本项目路线是 LoRA/QLoRA |

推荐路线：

1. 先用本地 Gemma/Ollama 跑 Agent、Memory、Dream、RAG。
2. 用 `training_sanitized` 数据导出 LoRA 候选。
3. 用小样本 dry-run 确认隐私门禁和训练包结构。
4. 本机先尝试 4B QLoRA；如果显存压力大，换云 GPU 完成正式训练。
5. 训练完成后把 adapter 合并或转 GGUF，再接回 Ollama/LM Studio。

## 4. 本地语音接入原则

语音分两层：

- STT：Whisper 或 FunASR，把用户语音转文本。
- TTS：GPT-SoVITS、IndexTTS、Deepgram 等，把 AIRI 回复转语音。

当前项目目录已存在：

- `stt-whisper`
- `stt-funasr`
- `gsv`

迁移时这些目录需要单独备份，因为它们可能包含 Python 环境、模型权重、参考音频和本地配置，不适合只依赖 Git。

## 5. GPT-SoVITS 默认检查

如果启动了 GPT-SoVITS API 服务，再运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-airi-local-services.ps1 `
  -ObsidianPath E:\Obsidian\Obsidian.exe `
  -CheckEndpoints
```

如果 `GPT-SoVITS API` 仍然不可达，优先检查：

- 服务是否已经启动。
- 实际端口是否是 `9880`。
- 防火墙或代理是否拦截 localhost。
- AIRI 设置页里的 GPT-SoVITS base URL 是否和服务端口一致。

## 6. 迁移后最小验收

新电脑上按顺序做：

1. 运行 `scripts/check-airi-migration.ps1`，确认项目文件齐全。
2. 运行 `scripts/check-airi-local-services.ps1 -ObsidianPath <新电脑 Obsidian.exe 路径>`。
3. 启动 Ollama，确认 `/v1/models` 可达，并用 `scripts/check-airi-local-services.ps1 -CheckEndpoints` 查看 `modelIds` 是否包含目标 Gemma 模型。
4. 在 AIRI 设置页配置 Agent Chat Runtime，使用本地 OpenAI-compatible endpoint。
5. 用一条合成记忆测试 RAG，不要先导入真实聊天记录。
6. 启动语音服务后再测试 STT/TTS。
7. 最后再导入真实脱敏数据。

## 7. 关键边界

- LoRA 学习稳定风格和工具使用习惯，不负责记住隐私事实。
- 真实长期记忆保存在 Memory DB / LLMWiki / Obsidian vault。
- 云端模型只接收 public-safe 上下文。
- 本地模型也不能直接吞原始聊天记录；仍然要经过导入、审查、摘要和隐私分级。
