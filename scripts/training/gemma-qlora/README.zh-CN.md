# AIRI-Gemma Gemma QLoRA 训练模板

这个目录放的是外部训练模板，不属于 Electron 桌面端运行时。AIRI 负责导出、预检和 dry-run；真正训练应该在独立 Python 环境、独立 GPU 机器或云端训练环境中执行。

## 输入文件

先在 AIRI Memory 设置页导出 LoRA 数据，并运行 `validateLoraTrainingPackage`。通过后，导出目录里应包含：

- `lora-training-config.json`
- `lora-dataset-train.jsonl`
- `lora-dataset-eval.jsonl`
- `lora-dataset-manifest.json`
- `lora-training-runbook.zh-CN.md`
- `lora-post-training-checklist.zh-CN.md`

这些交接文档的相对路径会写入 `lora-training-config.json.artifacts`。脚本侧 dry-run 不再假设 checklist 永远位于导出目录根部，而是读取 `artifacts.postTrainingChecklistPath`，并校验 `trainingRunbookPath` / `postTrainingChecklistPath` 都是安全相对路径。

## 本地运行

建议先用普通 Python 做一次训练脚本侧 dry-run。这个模式只读取 config 和 JSONL，不导入 Unsloth / TRL / Datasets，也不需要 GPU：

```bash
python F:/project/airi-gemma/scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py --config lora-training-config.json --dry-run
```

dry-run 通过后，再在 LoRA 导出目录中运行正式训练：

脚本侧 dry-run 会额外检查 `lora-training-config.json.dryRunContract` 是否与脚本契约一致、`artifacts` 中声明的交接文档路径是否安全、训练包是否包含 `artifacts.trainingRunbookPath` 指向的训练交接说明和 `artifacts.postTrainingChecklistPath` 指向的训练后清单、每条训练样本的 messages 角色、assistant 内容是否存在、assistant 内容是否过短，以及样本正文中是否疑似包含本地路径；如果 JSONL 行格式损坏，会返回对应文件和行号，便于回到导出包定位。

### 记录格式版本

LoRA 导出包会在 `lora-training-config.json.dataset.recordSchemaVersion` 中声明当前 JSONL 记录格式版本。每条 `lora-dataset-*.jsonl` 记录也必须带有 `schemaVersion`，并与 config 中的 `recordSchemaVersion` 一致。

AIRI 桌面端的 `validateLoraTrainingPackage` 会先做轻量检查：

- `jsonl_records_parseable`：确认 candidates/train/eval 的非空 JSONL 行能解析成 JSON object。
- `record_schema_matches_config`：确认每条记录的 `schemaVersion` 与 config 声明一致。

脚本侧 dry-run 也会拒绝缺失或过期的记录 schema，避免旧格式数据进入正式训练。

这类预期内的数据错误会以 `ERROR: ...` 输出并使用退出码 2，不会进入正式训练依赖加载阶段。

如果需要被 AIRI 前端或外部编排器解析，可以追加 `--error-format json`，预期内的数据错误会以 `{"ok":false,"error":{"type":"validation_error","message":"..."}}` 写入 stderr。

成功 dry-run 会向 stdout 写入 `schemaVersion`、`ok`、`checks`、`counts` 和 `artifacts`，例如：

```json
{ "schemaVersion": 1, "ok": true, "checks": ["privacy_flags", "dataset_counts", "chat_record_safety", "training_runbook_exists", "post_training_checklist_exists"], "counts": { "candidates": 1, "train": 1, "eval": 0 }, "artifacts": { "trainingRunbookPath": "lora-training-runbook.zh-CN.md", "postTrainingChecklistPath": "lora-post-training-checklist.zh-CN.md" } }
```

```bash
uv run F:/project/airi-gemma/scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py --config lora-training-config.json --base-model google/gemma-3-4b-it
```

脚本使用 PEP 723 inline dependencies，`uv run` 会为脚本解析依赖。首次运行会下载 Unsloth、TRL、Transformers、Datasets、PEFT、bitsandbytes 等依赖。

## 训练路线

模板默认走 Unsloth + TRL：

- Unsloth：负责更省显存地加载 Gemma-family 模型并注入 LoRA adapter。
- TRL：使用 `SFTTrainer` / `SFTConfig` 做 chat-style supervised fine-tuning。
- QLoRA：默认 4bit 加载，LoRA rank/alpha/dropout/sequence length 从 `lora-training-config.json` 读取。

训练脚本会读取 `lora-dataset-train.jsonl` 和 `lora-dataset-eval.jsonl`，不会硬编码数据集数量。正式训练前请确认 AIRI 的 `validateLoraTrainingPackage` 已经通过。

## 隐私要求

训练前必须满足：

- `containsRawChatImports` 为 `false`
- `containsBlockedMemoryContent` 为 `false`
- `containsSourceMetadataPaths` 为 `false`
- `requiresHumanApprovalBeforeTraining` 为 `true`

如果 dry-run 或脚本发现这些隐私门禁不满足，应停止训练，回到 Memory Review、export preflight 和 quality gate 流程重新处理数据。

## 云端训练

如果你用 Hugging Face Jobs 或其他云 GPU，建议先把已经脱敏、人工确认过的数据上传到私有 Dataset/Hub 仓库，再把脚本改成从 Hub 读取。不要直接上传原始微信、飞书、QQ 聊天记录，也不要上传 `needs_review` 或被 preflight 拦截的记忆。

## 训练后交付

训练完成后，继续填写和阅读：

- [MODEL_CARD_TEMPLATE.zh-CN.md](./MODEL_CARD_TEMPLATE.zh-CN.md)：记录 base model、adapter、数据来源、privacy gates、train/eval 数量、评估和局限性。
- [DEPLOYMENT.zh-CN.md](./DEPLOYMENT.zh-CN.md)：说明 PEFT adapter、GGUF、Ollama、LM Studio、vLLM 和 AIRI `agent-chat-runtime-config.json` 的本地部署路径。
- 导出包内的 `lora-post-training-checklist.zh-CN.md`：训练目录离开仓库后，用它逐项核对模型卡、部署说明、记录 schema、dry-run 证据和 public-safe 发布门禁。
