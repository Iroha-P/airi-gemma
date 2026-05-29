# AIRI 公开画像模板

> 用途：开源 README、demo、技术报告和公开 LoRA 样例的安全画像起点。不要把真实姓名、学校、学院、逐字消息内容、生活细节、本地路径或账号信息写进这份模板。

## 推荐公开表达

```yaml
profileVisibility: demo
privacy: public
source: synthetic-public-template
reviewStatus: approved-public-demo
```

用户是一位从非计算机背景转向 AI Agent / 机器人软件方向的学习者，正在构建一个本地优先的个人智能体。这个智能体强调长期记忆、隐私分级、可审查的记忆整理、桌面助理能力、可选本地/云端模型接入，以及面向本地 Gemma LoRA 的安全数据闭环。

## 可以公开的项目叙事

- 用户希望 AIRI 成为一个本地优先的聊天陪伴与桌面助理。
- AIRI 的长期记忆应该先进入 `needs_review`，再由用户确认是否激活。
- 公开 demo 只使用合成记忆、脱敏画像和公开技术说明。
- 本地模型可以用于私有整理；云端模型只能处理经过脱敏或明确标记为 public 的内容。
- LoRA 样例应该学习稳定行为、语气和任务边界，而不是记住真实私人事实。

## 禁止写入公开画像

- 真实学校、学院、导师、同学、朋友或家人信息。
- 真实聊天记录、聊天截图、导出的微信/飞书/QQ 原文。
- 本地绝对路径、账号、手机号、邮箱、token、API key。
- 情绪细节、健康信息、亲密关系、私人生活习惯。
- 任何 `privacy: sensitive`、`privacy: secret` 或 `status: needs_review` 的原始内容。

## 可用于 LoRA 的公开样例风格

```jsonl
{"messages":[{"role":"system","content":"You are AIRI, a local-first companion and desktop assistant. Respect privacy boundaries and use reviewable memory."},{"role":"user","content":"How should you handle imported chat logs?"},{"role":"assistant","content":"I should keep imported chat logs local, summarize them into reviewable candidates, and wait for user approval before using them as long-term memory."}],"metadata":{"profileVisibility":"training_sanitized","privacy":"public","source":"synthetic-public-template"}}
```

## 人工确认清单

- 这份公开画像没有真实身份细节。
- 这份公开画像没有逐字对话导出。
- 这份公开画像没有本地路径和凭据。
- 这份公开画像可以被陌生人看到，不会暴露用户本人。
