# AIRI Gemma 一周完善与毕业后迁移计划

> 状态：一周继续完善版。
> 目标：毕业后换设备时，项目、数据、文档、模型配置和后续开发路径都能顺利带走。

## 1. 当前策略

现在不是为了毕业汇报做一个临时展示版，而是利用接下来一周把项目继续做扎实，重点保证：

```text
能继续开发
能完整迁移
能保护隐私数据
能恢复本地记忆与知识库
能在新电脑上重新跑起来
```

这一阶段的项目定位是：

> 基于 AIRI 桌面端，构建一个本地优先的记忆增强陪伴型桌面智能体原型，具备长期记忆导入、审查、检索、LLMWiki/Obsidian 导出、Agent 编排、安全 Computer Use 预览、梦境整理和 LoRA 数据闭环能力。

后续一周继续完善功能，但所有新增工作都要服务于迁移、稳定、可维护、可继续训练和可继续开发。

## 2. 一周内优先完善什么

### P0：毕业后换设备前必须稳住

| 方向 | 目标 |
| --- | --- |
| 迁移 | 源码、文档、Memory 备份、LLMWiki/Obsidian、LoRA 训练包、本地服务配置都能带走 |
| 稳定性 | 关键导入/导出链路有测试保护，typecheck 能通过 |
| 记忆系统 | 导入 -> 安全扫描 -> 审查 -> active -> RAG/LLMWiki/Obsidian/备份链路清楚 |
| 数据安全 | 私人聊天原文、API key、真实路径、账号信息不进入 Git 或公开 demo |
| 本地运行 | 新电脑能重新安装依赖，连接本地 LLM/TTS/STT 服务 |
| 文档 | 新电脑恢复步骤、数据备份边界、常用命令和后续开发方向清楚 |

### P1：继续增强项目完整度

| 方向 | 目标 |
| --- | --- |
| Obsidian/AIRI-Brain | 完善 index/log/manifest/inbox，方便人类阅读和长期维护 |
| LLMWiki | 完善 Raw Sources / Wiki / Schema 结构，支撑 RAG 与知识库整理 |
| Dream | 让本地 Gemma 能整理最近几小时交互，生成可审查的候选记忆 |
| Agent Orchestrator | 让 Agent 更清楚地读取记忆、运行时配置和上下文 |
| LoRA | 完善候选数据导出、preflight、dry-run 和训练包说明 |
| UI 管理 | 先保证功能分区清楚，再逐步提升美观和易用性 |

### P2：毕业后继续做也可以

| 方向 | 原因 |
| --- | --- |
| 完整自动 Computer Use 执行 | 风险高，先保留安全预览、审计和确认流 |
| 自动双向 Obsidian 同步 | 容易误覆盖，先保持受控导入/导出 |
| 大规模真实 LoRA 训练 | 容易被算力和数据质量拖住，先把数据闭环和脚本准备好 |
| 商业级前端重做 | 可以继续优化，但不要压过核心系统迁移与稳定 |
| 多端同步 | 当前桌面端 MVP 更重要 |

## 3. 推荐自测链路

换设备前建议至少跑通一遍：

```text
1. 导入一份脱敏聊天记录或 Markdown 知识文件
2. Safety Scanner 标记风险内容
3. Review Workbench 审查候选记忆
4. 激活部分记忆
5. 生成 Compact Profile
6. 导出 LLMWiki
7. 导出 Obsidian/AIRI-Brain vault
8. 用 RAG Context Preview 检查本地模型会看到什么
9. 用 Agent Orchestrator 进行一次带记忆的回答
10. 查看 Computer Use 安全预览
11. 导出 LoRA 候选数据并 dry-run
12. 导出备份，确认新电脑恢复流程
```

这条链路足够覆盖：

- 本地长期记忆。
- 隐私与安全控制。
- RAG 增强。
- Agent 工程。
- LoRA 数据飞轮。
- 迁移与可维护性。

## 4. 换设备前必须确认

### 代码层

- 当前工作区完整备份。
- `pnpm-lock.yaml` 保留。
- `docs/ai/` 和 `docs/superpowers/` 保留。
- `scripts/backup-airi.ps1` 和 `scripts/restore-airi.ps1` 可用。
- `scripts/check-airi-migration.ps1` 能输出迁移预检报告。
- 根目录启动脚本保留：`start.bat`、`一键启动.bat`、`一键关闭.bat`。

### 数据层

- AIRI Memory 备份 JSON 已导出。
- Obsidian/AIRI-Brain vault 已导出。
- LLMWiki 已导出。
- LoRA 训练包如果已生成，需要单独备份。
- 本地 STT/TTS、语音素材、模型权重单独备份。
- `.env`、API key、token 不进 Git，只进私有备份。

### 新电脑恢复后检查

```powershell
pnpm install
pnpm -F @proj-airi/stage-tamagotchi typecheck
```

然后检查：

- AIRI 能启动。
- Memory 设置页能打开。
- 备份 JSON 能预览。
- LLMWiki/Obsidian 导出结果能看到 index/log/manifest。
- 本地模型 provider 能连接。
- 语音服务路径可用。

## 5. 接下来执行规则

从现在开始：

- 继续完善，不停止。
- 优先迁移、稳定、测试、文档和核心闭环。
- 不把真实私人聊天原文放进 demo、训练样本或公开文档。
- UI 可以继续优化，但优先保证功能链路清楚。
- 每个新功能都要考虑：它换电脑后怎么恢复，它的数据放在哪里，它是否会泄露隐私。

这份文档是接下来一周继续开发和毕业后迁移设备的优先级依据。
