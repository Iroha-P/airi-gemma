# LLMWiki 模式参考

> 来源：用户提供的本地 `llm-wiki.md`。本文不是逐字翻译，而是把其中对 AIRI 有价值的思想整理成可落地的中文参考。

## 1. 核心判断

这份资料的价值在于：它把个人知识库从“每次查询时临时 RAG”提升为“由 LLM 持续维护的 Markdown Wiki”。

传统 RAG 更像临时检索：

```text
原始文档 -> 切块/向量索引 -> 查询时召回 -> 临时合成答案
```

LLMWiki 模式更像长期编译：

```text
原始资料 -> LLM 整理/交叉引用/冲突标注 -> 持久 Markdown Wiki -> RAG/人类/训练数据复用
```

对 AIRI 来说，这意味着记忆系统不能只保存碎片，也不能只依赖向量库。AIRI 需要一层人能读、模型能读、可审查、可迁移的 `LLMWiki / Obsidian-compatible AIRI-Brain`。

## 2. 三层架构

### Raw Sources

原始资料层是事实来源，原则上只读，不让 LLM 直接覆盖：

- 微信、飞书、QQ 聊天记录导出。
- 本地 Markdown、PDF、TXT、项目文档、面试资料。
- 网页剪藏、论文、会议记录、语音转写。
- 用户手动写的 Obsidian 笔记。

在 AIRI 中，Raw Sources 进入导入管线后必须经过安全扫描、隐私分级和 Review Workbench。

### Wiki

Wiki 是 LLM 维护的人类可读层：

- 用户画像、偏好、边界、习惯、项目状态。
- 概念页、人物页、事件页、时间线。
- 研究主题、面试知识、项目决策、长期目标。
- 冲突记录、过期提醒、待确认条目。

在 AIRI 中，Wiki 不替代 Memory DB。Memory DB 仍是事实源，Wiki 是 `curated view`。

### Schema

Schema 是维护规则，相当于给 LLM 的知识库操作手册：

- 目录结构。
- frontmatter 字段。
- 隐私规则。
- ingest/query/lint 工作流。
- 页面命名、双链、索引和日志约定。

在 AIRI 中，Schema 应落在 `AIRI-Brain/_meta/schema.md`、主设计文档和导出 manifest 中。

## 3. 三个核心操作

### Ingest

导入新资料时，不只是存进向量库，而是形成候选记忆和 Wiki 更新草稿：

1. 读取原始资料。
2. 抽取事实、偏好、人物、项目、事件、边界。
3. 安全扫描：prompt injection、密钥、账号、隐私内容。
4. 写入 `needs_review` 候选记忆。
5. 用户确认后，更新 Memory DB。
6. 稳定且非 secret 的内容再进入 LLMWiki / Obsidian 视图。

适合 AIRI 的约束：不要自动把聊天原文写入 Wiki；优先写摘要、证据行、来源类型和审查状态。

### Query

查询时，LLM 不应只搜原始碎片，也要优先利用已经整理过的 Wiki：

1. 先读 `index.md` 或检索 LLMWiki。
2. 再按需要检索 Memory DB 和 Raw Sources 摘要。
3. 合成回答时标注来源、隐私等级和 withheld reasons。
4. 如果产生了有长期价值的分析，可以作为新的 Wiki 草稿或候选记忆回流。

适合 AIRI 的约束：云端 LLM 默认不能读取本地私有 Wiki；只有 public-safe 的独立导出才可进入云端上下文。

### Lint

周期性健康检查用于让知识库持续变好：

- 查找互相矛盾的页面。
- 查找过期结论。
- 查找孤立页面和缺失反链。
- 查找被多次提到但还没有独立页面的概念。
- 查找高价值但尚未进入 LLMWiki 的 active 记忆。
- 查找可能误入 Wiki 的 sensitive / secret 内容。

这可以和 AIRI 的“梦境整理”结合：本地 Gemma 在数小时聊天或工作后生成整理报告，强模型可选作为研究员/审查员，但最终写入仍需遵守本地隐私规则。

## 4. index.md 与 log.md

LLMWiki 至少需要两个导航文件：

### index.md

内容索引，帮助人和 LLM 快速找到页面：

```md
# AIRI-Brain Index

## Profile

- [[10-profile/profile]]: 用户稳定背景、目标和身份。
- [[10-profile/preferences]]: 长期偏好与交流风格。

## Projects

- [[20-projects/airi-gemma/overview]]: AIRI Gemma 项目总览。
```

### log.md

时间线日志，记录 Wiki 的演化：

```md
## [2026-05-27] ingest | WeChat export

- 扫描微信导出资料。
- 生成 12 条候选记忆。
- 2 条被标记为 secret，需要人工审查。

## [2026-05-27] lint | Memory health check

- 发现 1 处项目状态冲突。
- 建议新增 `interview-preparation.md` 页面。
```

在 AIRI 中，log 应保持 append-only，便于迁移、审计和后续训练数据追溯。

## 5. 与 AIRI 现有设计的关系

| 层 | LLMWiki 文档中的思想 | AIRI 落地方式 |
| --- | --- | --- |
| Raw Sources | 原始资料不可直接覆盖 | 多数据源导入 + Safety Scanner + Review Workbench |
| Wiki | LLM 维护 Markdown 知识库 | `AIRI-Brain/70-llmwiki/` 与 Obsidian-compatible vault |
| Schema | 约束 LLM 如何维护 Wiki | `_meta/schema.md`、manifest、主设计文档 |
| Ingest | 新资料会更新多页 Wiki | 导入候选 -> 审查 -> active -> LLMWiki 导出 |
| Query | 好答案可以回写 Wiki | RAG Context Preview + future Wiki draft candidate |
| Lint | 定期查冲突、孤页、过期 | Dream / Review Workbench / Memory Evolution |

## 6. 不应照搬的部分

- 不应让 LLM 直接拥有全部写权限；AIRI 需要用户确认和审计。
- 不应把 Obsidian 当运行时硬依赖；它是可选外部前端和体验参考。
- 不应把 Wiki 当事实源覆盖 Memory DB；Wiki 是可读视图。
- 不应把私有 Wiki 默认给云端 LLM；必须经过 privacy gate。
- 不应把 Raw Sources 原文无差别写入 LoRA 训练集；训练数据需要单独脱敏、筛选和 dry-run。

## 7. 推荐进入 AIRI 后续路线

短期：

- 在 `AIRI-Brain` 导出中补齐 `index.md` 和 `log.md`。
- 让 LLMWiki 导出结果显示页面数量、记忆数量和最近导出时间。
- 继续保持 Memory DB -> LLMWiki 的单向可审查导出。

中期：

- 增加 LLMWiki Lint：孤立页、隐私泄漏、过期记忆、冲突页面。
- 让 Dream Report 产出 `llmwikiDrafts`，进入 Review Workbench。
- 支持把高价值 RAG 回答保存为 Wiki draft。

长期：

- 做 AIRI 自有 Memory Workspace，借鉴 Obsidian 的文件树、Markdown 阅读、反链、标签和 Graph 思路。
- 支持 public-only LLMWiki 分支，用于云端 LLM、开源 demo 和训练样例。
- 将 Wiki 演化日志纳入 LoRA 数据集审计链路。
