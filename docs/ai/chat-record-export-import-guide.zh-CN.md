# 聊天记录导出与导入知识库教程

本文用于指导把微信、飞书、QQ、本地知识库资料整理成 AIRI 可导入的长期记忆与 LLMWiki 文档。目标不是把所有原始聊天无差别喂给模型，而是先脱敏、摘要、分级，再进入 `needs_review` 审核区。

## 1. 基本原则

- 先小样本验证，再批量导入。
- 原始聊天记录默认视为 `sensitive`，不要直接变成 `active` 长期记忆。
- 第三方隐私、公司机密、账号密码、身份证、手机号、住址、客户资料默认不导入。
- 导入前先做摘要、去重、冲突检测和隐私分级。
- 可以保留原始导出文件在本地加密目录，但 AIRI 记忆库只保存可解释的结构化摘要。

## 2. 推荐目录结构

```text
airi-brain/
  00-inbox/
    chat-exports/
      wechat/
      lark/
      qq/
  10-profile/
  20-preferences/
  30-projects/
  40-events/
  50-habits/
  60-knowledge/
  70-llmwiki/
```

`00-inbox/chat-exports` 存放原始导出或中间文件；`10-60` 存放人工整理后的事实；`70-llmwiki` 存放可被检索的长文档。

## 2.1 当前实现支持的聊天导入格式

当前 AIRI 设置页已经提供微信、飞书、QQ 三类聊天记录导入入口。第一版只读取你选择文件夹下的 `.txt` 和 `.md` 文件，跳过隐藏目录、空文件和非文本文件。导入后的候选记忆默认是：

- `privacy: sensitive`
- `status: needs_review`
- `type: conversation`

也就是说，导入不会直接塑造人格或写入活跃长期记忆，必须先在 Memory 设置页审核。

目前建议把导出的聊天记录整理成下面这种逐行格式：

```text
[2026-05-01 12:30:00] Alice: 我今天在整理 AIRI 的长期记忆方案。
这是一条换行延续内容。
[2026-05-01 12:31:00] Bob: 记得把微信、飞书、QQ 都先做本地审查。
```

也支持不带方括号的格式：

```text
2026-05-01 12:30:00 Alice: 我今天在整理 AIRI 的长期记忆方案。
2026-05-01 12:31:00 Bob: 记得把微信、飞书、QQ 都先做本地审查。
```

解析规则：

- 时间格式支持 `YYYY-MM-DD HH:mm`、`YYYY-MM-DD HH:mm:ss`，日期分隔符也可用 `/`。
- 说话人和内容之间支持英文冒号 `:` 或中文冒号 `：`。
- 没有时间戳的新行会作为上一条消息的延续内容。
- 微信入口会加 `wechat` 标签，飞书入口会加 `feishu` 标签，QQ 入口会加 `qq` 标签。
- 原始导出文件路径只保存在本地 metadata 中，用于回溯来源。

## 2.2 先用脱敏样例试跑

在导入你的真实聊天记录前，建议先生成一套合成样例数据：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\create-airi-sanitized-demo-data.ps1
```

默认输出目录：

```text
airi-brain/00-inbox/sanitized-demo-import/
```

里面会包含：

- `knowledge/airi-memory-agent.md`：合成 Markdown 知识库样例。
- `chat/wechat/synthetic-chat.txt`：微信样例。
- `chat/feishu/synthetic-chat.txt`：飞书样例。
- `chat/qq/synthetic-chat.md`：QQ 样例。
- `manifest.json`：样例数据清单。

推荐先在 AIRI 设置页按这个顺序导入：

1. 把 `knowledge/` 作为 Markdown knowledge base 导入。
2. 把 `chat/wechat/` 作为微信聊天记录导入。
3. 把 `chat/feishu/` 作为飞书聊天记录导入。
4. 把 `chat/qq/` 作为 QQ 聊天记录导入。
5. 到 Review Workbench 检查候选记忆，不要直接批量激活。

这套样例不包含真实账号、真实聊天、真实学校、真实路径或私人关系，目的是确认导入、审查、RAG、LLMWiki、Obsidian 导出和备份流程能跑通。

## 3. 微信聊天记录

可选路径：

- 微信 PC 客户端自带备份：适合保留原始数据，不适合直接解析。
- 第三方导出工具：只在本机离线使用，导出前确认工具可信。
- 手工复制重要片段：最安全，适合第一阶段。

建议中间格式：

```markdown
---
sourceType: import_wechat
chat: 微信-朋友或群名
dateRange: 2024-09 至 2026-05
privacy: sensitive
tags: [wechat, social]
---

# 微信聊天片段总结

- 我经常讨论转码、算法岗面试、机器人方向。
- 我希望 AIRI 帮我复盘学习计划和项目表达。
- 某些具体联系人信息不进入长期记忆。
```

## 4. 飞书聊天记录

飞书更适合通过开放平台或工作台导出结构化消息。个人阶段建议先手动导出重要对话或文档链接，不建议一开始拉全量组织数据。

建议处理流程：

1. 导出重要会话或文档。
2. 删除公司机密、客户资料、未公开业务信息。
3. 按项目、会议、任务、个人偏好切块。
4. 对每块生成摘要和标签。
5. 导入时默认 `privacy: sensitive`、`status: needs_review`。

## 5. QQ 聊天记录

QQ 可参考 ex-skill 项目的思路：先从聊天记录中抽取人格、偏好、关系、长期事实，再由用户审核。

建议中间格式：

```markdown
---
sourceType: import_qq
chat: QQ-好友或群名
dateRange: 2024-09 至 2026-05
privacy: sensitive
tags: [qq, social, study]
---

# QQ 聊天片段总结

- 我在这个群里经常讨论转码、算法岗、机器人方向。
- 我对项目展示和面试表达比较焦虑。
- 我希望 AIRI 能帮我复盘学习计划和面试准备。
```

## 6. 推荐导入顺序

第一阶段：低风险资料

```text
Obsidian / Markdown 知识库
个人学习笔记
AIRI 项目文档
算法岗面试笔记
```

第二阶段：半结构化聊天总结

```text
手工整理后的微信/QQ/飞书片段总结
重要偏好
长期事实
项目经历
用户明确希望 AIRI 记住的内容
```

第三阶段：原始聊天解析器

```text
微信导出解析器
飞书消息解析器
QQ 导出解析器
冲突检测
去重合并
隐私分级
```

## 7. 导入 AIRI 的建议 JSON

```json
{
  "source": {
    "type": "import_wechat",
    "id": "2026-05-wechat-sample",
    "label": "微信样本导入"
  },
  "defaults": {
    "privacy": "sensitive",
    "tags": ["wechat"],
    "status": "needs_review"
  },
  "entries": [
    {
      "externalId": "message-or-summary-id",
      "content": "整理后的记忆内容",
      "summary": "简短摘要",
      "type": "profile",
      "tags": ["career", "interview"],
      "occurredAt": "2026-05-07T00:00:00.000Z"
    }
  ]
}
```

## 8. 审核标准

导入后不要直接信任结果。每条候选记忆都应回答：

- 这是真实、长期有效的信息吗？
- 这会帮助 AIRI 更好陪伴或协作吗？
- 这是否过于私密，应该标记为 `secret` 或不导入？
- 这是否只是一次性情绪，不应成为长期画像？
- 这条记忆是否可能误导 AIRI？

## 9. 不要导入的内容

- 他人的身份证、手机号、住址、账号、密码。
- 公司机密、未公开业务资料、客户资料。
- 大段未脱敏原始聊天。
- 涉及第三方隐私、健康、家庭关系的敏感细节。
- 你不希望未来模型长期记住的临时情绪。

## 10. 参考资料

- [ex-skill 项目](https://github.com/therealXiaomanChu/ex-skill)
- [ex-skill PRD](https://raw.githubusercontent.com/therealXiaomanChu/ex-skill/main/docs/PRD.md)
- [ex-skill persona builder](https://raw.githubusercontent.com/therealXiaomanChu/ex-skill/main/prompts/persona_builder.md)
- [飞书开放平台消息接口](https://open.feishu.cn/document/server-docs/im-v1/message/get)
