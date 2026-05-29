# AIRI-Gemma LoRA Adapter 模型卡模板

> 复制这份模板到训练输出目录，按实际训练结果填写。不要把未脱敏的个人记忆、原始聊天记录或本地文件路径写进模型卡。

## 基本信息

- Adapter 名称：
- Base model：
- 训练方法：QLoRA / PEFT adapter
- 训练脚本：`train_gemma_qlora_unsloth.py`
- 训练配置：`lora-training-config.json`
- 训练日期：
- 训练机器：
- 负责人：

## 数据来源

- 数据来源：AIRI Memory Review 后导出的 LoRA package
- 完整候选池：
- train/eval 数量：
- 使用的导出清单：`lora-dataset-manifest.json`
- 使用的训练集：`lora-dataset-train.jsonl`
- 使用的验证集：`lora-dataset-eval.jsonl`

## 数据格式契约

- `lora-training-config.json.dataset.recordSchemaVersion`：
- JSONL 记录 `schemaVersion`：
- AIRI dry-run `jsonl_records_parseable`：
- AIRI dry-run `record_schema_matches_config`：
- AIRI dry-run `training_runbook_exists`：
- AIRI dry-run `post_training_checklist_exists`：
- 训练后清单：`lora-post-training-checklist.zh-CN.md`
- 脚本侧 dry-run 是否通过：

如果 `recordSchemaVersion` 或记录 `schemaVersion` 与训练脚本预期不一致，应停止发布，回到 AIRI LoRA 导出和 dry-run 流程重新生成训练包。

## 隐私和治理

训练前必须确认以下 privacy gates：

- `containsRawChatImports = false`
- `containsBlockedMemoryContent = false`
- `containsSourceMetadataPaths = false`
- `requiresHumanApprovalBeforeTraining = true`

发布前必须确认：

- no raw chat imports
- 没有微信、飞书、QQ 原始聊天片段
- 没有身份证、手机号、住址、账号、token、私有路径等敏感字段
- 没有 `needs_review`、`sensitive`、`secret` 或被 preflight 拦截的记忆
- 如果准备开源，只能发布已经明确 public-safe 的 adapter 和模型卡
- 已根据 `lora-post-training-checklist.zh-CN.md` 复核模型卡、部署说明、schema、dry-run 证据和 public-safe 发布门禁

## 评估

请至少记录：

- 训练 loss：
- eval loss：
- 过拟合迹象：
- 人格一致性测试：
- 桌面助理任务测试：
- 拒绝危险操作测试：
- 隐私泄漏抽检：
- 长期记忆事实问答：

## 适用场景

- 本地陪伴聊天
- 本地桌面助理风格适配
- 个人偏好和表达风格学习
- 面试项目展示中的 LoRA / RAG / Agent 结合案例

## 局限性

- 该 adapter 不是完整基础模型，只是针对 base model 的 LoRA adapter。
- 它不能替代 RAG、长期记忆数据库或安全策略。
- 它可能学习到过时偏好，需要定期重新评估。
- 它不应该被当作公开通用助手发布，除非完成 public-safe 审计。

## 发布决策

- [ ] 仅本地使用
- [ ] 上传私有 Hugging Face 仓库
- [ ] 公开发布

公开发布前，需要再次检查 privacy gates、模型卡内容和训练数据来源。
