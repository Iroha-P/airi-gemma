# AIRI-Gemma LoRA Adapter 本地部署说明

这份说明覆盖训练完成后的部署路径。默认产物是 PEFT LoRA adapter，不是完整模型。AIRI 桌面端仍通过本地 OpenAI-compatible endpoint 调用模型，而不是直接加载 Python adapter。

## 1. 产物类型

训练脚本默认输出：

- PEFT adapter 权重
- tokenizer 文件
- 训练配置副本
- 可选 Hugging Face Hub adapter 仓库

如果运行环境支持 PEFT adapter，可以直接加载 base model + adapter。如果要给 Ollama 或部分 llama.cpp 路线使用，通常需要先 merge adapter，再转换 GGUF。

## 2. Transformers / PEFT 路线

适合 Python 服务、vLLM adapter 路线或自定义 OpenAI-compatible server。

基本思路：

1. 加载 base model。
2. 使用 PEFT 加载 adapter。
3. 暴露 OpenAI-compatible `/v1/chat/completions`。
4. 在 AIRI 的 `agent-chat-runtime-config.json` 中配置本地 endpoint。

## 3. GGUF / Ollama 路线

Ollama 通常消费 GGUF 或已打包模型，不直接消费普通 PEFT adapter。推荐流程：

1. 将 LoRA adapter merge 到 base model。
2. 使用 llama.cpp 转换为 GGUF。
3. 编写 Ollama Modelfile。
4. `ollama create airi-gemma-lora -f Modelfile`。
5. 通过 `http://localhost:11434/v1` 暴露 OpenAI-compatible 接口。

然后 AIRI 可使用：

```json
{
  "enabled": true,
  "provider": "openai-compatible",
  "target": "local",
  "openAICompatible": {
    "baseURL": "http://localhost:11434/v1",
    "model": "airi-gemma-lora"
  }
}
```

## 4. LM Studio 路线

LM Studio 适合加载本地 GGUF 模型并暴露 OpenAI-compatible server。

1. 准备 merged GGUF。
2. 在 LM Studio 中加载模型。
3. 启动本地 server。
4. 将 AIRI `agent-chat-runtime-config.json` 指向 LM Studio 的 OpenAI-compatible endpoint。

## 5. vLLM 路线

vLLM 适合更强 GPU 环境。可以选择：

- 直接服务 merged model。
- 使用 vLLM 的 LoRA adapter 支持服务 base model + adapter。

无论哪种方式，AIRI 只需要看到 OpenAI-compatible endpoint，并把 `target` 设为 `local`。

## 6. 接回 AIRI

AIRI 桌面端读取 `agent-chat-runtime-config.json`。本地模型配置必须满足：

- `enabled: true`
- `provider: "openai-compatible"`
- `target: "local"`
- `baseURL` 指向本地服务
- `model` 与本地服务中的模型名一致

上线前建议：

- 用 Memory 设置页的连接测试检查 endpoint。
- 用 RAG Context Preview 确认本地 target 会保留 local memory。
- 用 Agent Console 做 5 到 10 条行为测试。
- 检查模型不会泄漏训练样本原文。

## 7. 部署前审计

在正式服务 adapter、合并 GGUF 或准备公开发布前，先填写并检查 [MODEL_CARD_TEMPLATE.zh-CN.md](./MODEL_CARD_TEMPLATE.zh-CN.md)。模型卡至少应记录：

- `recordSchemaVersion`
- 训练 JSONL 记录的 `schemaVersion`
- AIRI dry-run `jsonl_records_parseable`
- AIRI dry-run `record_schema_matches_config`
- AIRI dry-run `training_runbook_exists`
- AIRI dry-run `post_training_checklist_exists`
- 导出包内 `lora-post-training-checklist.zh-CN.md`
- 脚本侧 dry-run 是否通过

如果记录格式版本或 dry-run 结果不明确，不要继续部署或发布；应回到 AIRI Memory 导出、`validateLoraTrainingPackage` 和训练脚本 dry-run 重新生成可追溯的训练包。

## 8. 发布边界

本地部署不等于可以公开发布。公开发布 adapter、GGUF 或模型卡前，必须重新审查隐私门禁、数据来源和评估结果。
