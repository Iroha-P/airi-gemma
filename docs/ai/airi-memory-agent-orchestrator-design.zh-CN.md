# AIRI 记忆系统与 Agent Orchestrator 详细设计

> 文档角色：主计划 / 工程设计基准。
> 后续开发以本文为准；LoRA 技术报告和本地生活记忆设计作为背景附录。
> 文档索引见 [`docs/ai/README.md`](./README.md)。

> 目标：把 AIRI 从“带角色形象的聊天前端”升级为“本地优先、可记忆、可检索、可调用工具、可沉淀技能的个人桌面智能体”。
> 关键词：local-first memory、LLMWiki、RAG、skill/routine、Eventa RPC、xsAI/OpenAI-compatible provider、Computer Use safety。
> 说明：本文中的 LLMWiki 指“面向 LLM 可读、用户可审阅的本地 Markdown/结构化知识库”，不绑定某个特定产品或云服务。

## 1. 一句话设计

AIRI 的下一阶段核心应该是：

```text
用户输入
  -> Agent Orchestrator
  -> 读取强规则与用户画像
  -> RAG 检索本地记忆与 LLMWiki
  -> 选择聊天、工具调用或 Computer Use
  -> 执行前安全检查
  -> 输出文字/语音
  -> 会话后提取记忆、更新 LLMWiki、沉淀 skill/routine
```

其中：

- **LoRA 微调**负责让 Gemma 学会 AIRI 的语气、行为模式和工具调用格式。
- **记忆系统**负责保存用户生活、习惯、项目状态和共同回忆。
- **LLMWiki**负责把重要记忆沉淀成人能看懂、LLM 也能稳定读取的知识页面。
- **RAG**负责在每次对话前检索相关内容，而不是把所有记忆都塞进 prompt。
- **Agent Orchestrator**负责决策：什么时候聊天，什么时候查记忆，什么时候调用工具。
- **skill/routine 系统**负责把重复工作流沉淀成可复用能力。

## 2. 设计原则

### 2.0 双脑架构

本项目需要明确区分“开发期强脑”和“运行期本地脑”。

```text
开发期强脑
  Claude Code / Codex / Gemini CLI / OpenCode
  -> 通过 CC Switch 切换模型/provider
  -> 负责开发、研究、整理资料、生成 LLMWiki、重构代码

运行期本地脑
  AIRI + 本地 Gemma 4
  -> 读取本地 Memory / LLMWiki / RAG
  -> 负责日常陪伴、语音交互、桌面助理、Computer Use
```

两者不是替代关系。Claude Code 这类强模型工具是建设 AIRI 的外部工程助手；AIRI 运行时仍以本地 Gemma 4 为核心，只有用户明确选择云端 provider 时才调用外部模型。

CC Switch 只属于开发工具层，用来切 Claude Code / Codex / Gemini CLI 等开发助手的模型和 provider 配置；它不应该成为 AIRI 运行时模型切换的唯一依赖。AIRI 运行期的 provider 切换应由项目内的 LLM Provider 抽象管理。

### 2.1 本地优先

生活记忆、项目记忆、对话摘要、Computer Use 操作历史默认只存在本地。除非用户明确切换云端模型并确认上下文发送范围，否则不上传。

### 2.2 用户可控

用户必须能看到 AIRI 记住了什么，并能编辑、删除、禁用、导出。记忆系统不能变成不可见的黑箱。

### 2.2.1 记忆前端分层

AIRI 的记忆前端不应只做成普通设置页，也不应直接把 Obsidian 当成运行时硬依赖。推荐采用“两层前端”：

| 层级 | 角色 | 主要职责 |
| --- | --- | --- |
| AIRI 内置管理台 | 安全与自动化控制台 | 导入、审查、合并、删除、隐私分级、LoRA 候选、Computer Use 权限、梦境整理任务 |
| Obsidian-compatible Memory Workspace | 人类可读的记忆工作区 | Markdown 笔记、YAML frontmatter、双链、标签、关系图、回忆时间线、人工整理 |

其中 Memory DB 仍然是事实源；Obsidian/AIRI-Brain vault 是可读视图和人工整理层。用户可以用本地 Obsidian 打开 vault，也可以在后续 AIRI 前端中使用类似 Obsidian 的体验：左侧文件树/来源树，中间 Markdown 或记忆正文，右侧来源证据、标签、关系和训练状态。

第一阶段不要求 AIRI 内置 UI 达到 Obsidian 的完整体验，但数据结构和导出格式必须为后续 Memory Workspace 预留能力：

- Markdown 文件使用稳定路径、标题和 YAML frontmatter。
- 记忆之间用双链或显式 relation metadata 表示。
- 新记忆、导入内容、梦境总结和外部知识先进入 Review Inbox，不直接覆盖 active 记忆。
- AIRI 内置管理台负责高风险操作确认；Obsidian 编辑内容回流时只能作为 `manual_override` 或 `import_candidate` 等待用户确认。
- 本地 `Obsidian.exe` 只是可选阅读/编辑器，不是 AIRI 运行和迁移的必需组件。

### 2.2.2 私有画像与开源画像分离

如果本项目后续开源，必须区分“真实私有画像”和“可公开展示画像”。

私有画像用于 AIRI 的真实陪伴和个性化，例如用户的学习背景、转码阶段、长期目标、偏好、边界、生活习惯、项目状态、微信/飞书聊天记录中提取出的沟通风格等。这些内容默认只保存在本地 Memory DB / LLMWiki 中，不进入公开仓库，不作为公开训练集，不出现在 demo 截图和 README 中。

开源画像用于项目展示、技术报告、demo 和训练样例。它应该是用户确认后的脱敏版本，只保留项目叙事所需的信息，例如“用户是从非计算机背景转向 AI/智能体方向的学生，正在构建本地优先的 AIRI 个人智能体”。公开画像不应包含真实姓名、账号、学校内部信息、聊天原文、文件路径、私人关系、情绪细节和未公开项目资料。

工程上建议增加 `profile_visibility` 或等价 metadata：

| 字段值 | 含义 | 允许用途 |
| --- | --- | --- |
| `private` | 真实私有画像 | 本地陪伴、RAG、LLMWiki 私有库 |
| `demo` | 脱敏演示画像 | README、演示数据、公开截图 |
| `training_sanitized` | 脱敏训练画像 | LoRA/SFT 样例、评估集 |

默认值必须是 `private`。任何从私有画像导出到 `demo` 或 `training_sanitized` 的操作，都应经过脱敏流水线和用户确认。

### 2.3 事实与行为分离

动态事实放在记忆库里，稳定行为模式交给 LoRA 微调。不要试图让模型参数记住用户隐私。

### 2.4 强规则优先

禁止操作目录、隐私边界、危险动作确认规则优先级高于普通聊天体验。Agent Orchestrator 必须先检查规则，再决定是否执行工具。

### 2.5 小步可落地

第一版不要直接做完整 Computer Use 和自动微调。先做：

- 本地记忆 CRUD。
- 会话摘要。
- LLMWiki 页面。
- RAG 检索注入。
- Agent Orchestrator 最小闭环。

## 3. 与当前 AIRI 仓库的结合点

当前仓库已经具备几个适合接入的位置：

| 现有位置 | 当前作用 | 后续接入方式 |
| --- | --- | --- |
| `packages/stage-ui/src/database` | 现有 unstorage / IndexedDB 仓储 | 先复用为 renderer 侧轻量状态，长期桌面记忆放 Electron main |
| `packages/stage-ui/src/stores/providers.ts` | LLM/TTS/STT provider 注册 | 新增 Memory/Agent provider 概念时参考现有 provider 元数据模式 |
| `packages/stage-ui/src/stores/modules` | consciousness/hearing/speech 等模块状态 | 新增 `memory.ts` 与 `agent.ts` 模块 |
| `apps/stage-tamagotchi/src/shared/eventa.ts` | Electron typed RPC 合同 | 增加 memory/agent/computer-use RPC 合同 |
| `apps/stage-tamagotchi/src/main/services` | Electron 主进程服务 | 新增 `airi/memory`、`airi/agent`、`airi/computer-use` 服务 |
| `packages/stage-pages/src/pages/settings` | 设置页 | 新增记忆管理页、Agent 权限页 |
| `packages/i18n` | 多语言翻译 | 新增 memory/agent/computer-use 文案 |

建议第一阶段将本地长期记忆放在 **Electron main process**，原因是：

- 可以使用 `app.getPath('userData')`，数据天然属于本机用户。
- 可以更好地控制文件路径、备份、导出。
- Computer Use 和本地文件权限也更适合在 main process 管理。
- Renderer 通过 Eventa RPC 访问，避免页面直接拿到数据库文件路径。

Web 端如果后续也要支持记忆，可以使用 IndexedDB/PGlite 作为降级实现。

P1 桌面端实现选择：Electron main process 中使用 **PGlite + Drizzle**，数据目录位于 `app.getPath('userData')/memory/pglite`。第一版只做结构化 CRUD 和文本检索，不做 embedding/vector search。

## 4. 总体模块划分

```text
apps/stage-tamagotchi
  src/main/services/airi/memory
    memory-db.ts
    memory-repo.ts
    memory-retriever.ts
    memory-reflector.ts
    llmwiki-writer.ts

  src/main/services/airi/agent
    agent-orchestrator.ts
    prompt-composer.ts
    tool-router.ts
    safety-guard.ts

  src/shared
    eventa.ts
    memory-contract.ts
    agent-contract.ts

packages/stage-ui
  src/stores/modules/memory.ts
  src/stores/modules/agent.ts

packages/stage-pages
  src/pages/settings/modules/memory.vue
  src/pages/settings/modules/agent.vue
```

第一阶段可以先不一次性新建这么多文件，但边界应按这个方向设计。

## 5. 记忆系统设计

### 5.1 记忆类型

| 类型 | 说明 | 示例 |
| --- | --- | --- |
| `identity` | 用户长期身份 | 本科土木，现为 FDU 智能机器人与先进制造创新学院学生 |
| `preference` | 用户偏好 | 喜欢先看路线图，再进入代码 |
| `boundary` | 强规则和禁区 | 不碰 MiniBox，不碰毕业设计文件夹 |
| `habit` | 行为习惯 | 常在晚上推进 AIRI 项目 |
| `project` | 项目状态 | GSV 当前使用 9881；9880 视为旧配置或 MiniBox 相关端口，修改前需要核对 |
| `event` | 共同经历 | 用户提出 AIRI 要记录生活记忆和行为习惯 |
| `routine` | 可复用流程 | 启动 GSV 前先检查端口 |
| `working` | 当前任务短期状态 | 正在整理仓库和写 Agent 设计 |

### 5.2 数据表

第一版选择 PGlite + Drizzle，运行在 Electron main process，存储在 `app.getPath('userData')/memory/pglite`。原因是仓库已经 catalog 了 `@electric-sql/pglite` 和 `drizzle-orm`，且它避开了 Windows 原生 SQLite/better-sqlite3 打包风险。本文按 PGlite/Drizzle 的关系型数据库模型描述。

第一版不做向量搜索。语义检索、PGlite vector、embedding provider 和 GBrain 适配放到 P2.5/P3 以后。

```sql
CREATE TABLE memory_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  scope TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  importance INTEGER NOT NULL,
  confidence REAL NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_used_at TEXT,
  expires_at TEXT,
  metadata_json TEXT
);
```

实现时可先落一张 `memory_fragments` 表，对外 DTO 保持 `MemoryRecord` 命名：

```ts
type MemoryScope = 'short-term' | 'long-term'
type MemorySourceType = 'manual' | 'chat' | 'system'

interface MemoryRecord {
  id: string
  scope: MemoryScope
  content: string
  summary?: string
  tags: string[]
  importance: number
  privacy: 'public' | 'local' | 'sensitive' | 'secret'
  cloudAllowed: boolean
  ragIndex: boolean
  sourceType: MemorySourceType
  sourceId?: string
  createdAt: number
  updatedAt: number
  lastAccessedAt?: number
  accessCount: number
  archivedAt?: number
}
```

首批索引：

- `scope`
- `created_at`
- `updated_at`
- `archived_at`

文本搜索第一版用大小写不敏感匹配；FTS/BM25 和 embedding 后置。

```sql
CREATE TABLE conversation_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  metadata_json TEXT
);
```

```sql
CREATE TABLE memory_links (
  id TEXT PRIMARY KEY,
  from_memory_id TEXT NOT NULL,
  to_memory_id TEXT NOT NULL,
  relation TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

```sql
CREATE TABLE memory_audit_logs (
  id TEXT PRIMARY KEY,
  memory_id TEXT,
  action TEXT NOT NULL,
  old_value_json TEXT,
  new_value_json TEXT,
  created_at TEXT NOT NULL
);
```

### 5.3 记忆状态

| 状态 | 含义 |
| --- | --- |
| `active` | 正常可检索 |
| `needs_review` | 候选记忆，等待用户确认 |
| `archived` | 归档，不主动检索 |
| `rejected` | 用户否定，不再使用 |
| `expired` | 短期记忆过期 |

### 5.4 记忆写入流程

```text
会话或任务结束
  -> 保存原始消息
  -> 生成短摘要
  -> 提取候选记忆
  -> 按类型、重要性、敏感度分类
  -> 低风险技术/项目记忆直接保存
  -> 身份、边界、隐私、长期习惯进入 needs_review
  -> 用户在设置页确认或删除
```

高敏感内容必须确认：

- 用户身份与职业目标。
- 情绪健康长期判断。
- 文件系统禁区。
- 隐私、人际关系、账号相关信息。
- 会影响 Computer Use 行为的规则。

### 5.4.1 多数据源导入与人格塑造

AIRI 可以通过微信聊天记录、飞书聊天记录和本地知识库来理解用户，但不能把原始聊天记录直接塞进人格 prompt 或训练集。推荐把这件事设计成一个本地导入流水线：

```text
WeChat / Feishu / Local Knowledge
  -> Raw Import Inbox
  -> Parser
  -> Redactor
  -> Chunker
  -> Summarizer
  -> Memory Extractor
  -> Review Queue
  -> Memory DB / LLMWiki / RAG
  -> LoRA Dataset Candidate
```

第一阶段建议实现三个 importer：

| 模块 | 输入 | 输出 |
| --- | --- | --- |
| `WeChatImporter` | 用户手动导出的微信聊天记录、图片/文件索引 | `ImportedMessage[]`、关系候选、沟通风格候选 |
| `FeishuImporter` | 飞书会话导出、项目群记录、文档链接 | 项目记忆、协作习惯、任务状态 |
| `LocalKnowledgeImporter` | Markdown、PDF、TXT、代码仓库摘要、Obsidian vault | 知识卡片、项目资料、面试资料 |

导入数据先进入本地原始区，例如：

```text
%APPDATA%/AIRI/airi-memory/imports/raw/
%APPDATA%/AIRI/airi-memory/imports/processed/
%APPDATA%/AIRI/airi-memory/AIRI-Brain/00-inbox/imports/
```

隐私规则：

- 原始聊天记录默认只保存在本地，不进入 Git，不发给云端模型。
- 第三方个人信息、私人聊天内容、群成员身份默认标记为 `sensitive`。
- “用户和某人的关系”“用户长期情绪状态”“用户性格判断”只能生成候选记忆，必须由用户确认。
- 飞书工作内容和项目资料默认用于项目协助，不自动转成人格设定。
- 本地知识库可以进入 RAG，但只有用户确认后的摘要才能进入 LLMWiki 和 LoRA 候选集。

人格塑造分成五层，避免把所有东西混在一起：

| 层级 | 内容 | 存放位置 |
| --- | --- | --- |
| Base Persona | AIRI 的基本性格、说话边界 | 系统 prompt / LoRA |
| User Profile | 用户背景、目标、偏好 | Memory DB + LLMWiki |
| Communication Style | 用户喜欢的解释粒度、语气、节奏 | Memory DB，确认后可进 LoRA 数据 |
| Relationship Memory | 共同经历、重要回忆、长期项目状态 | Memory DB + timeline |
| Knowledge Grounding | 用户本地知识库、论文、面试资料、项目文档 | RAG / LLMWiki |

也就是说，聊天记录主要用于“理解用户习惯、共同经历和沟通偏好”，本地知识库主要用于“让 AIRI 能回答用户自己的资料和项目问题”。LoRA 只学习稳定表达风格和工具/记忆使用模式，不背诵原始隐私内容。

### 5.5 记忆检索评分

RAG 检索不只看文本相似度。建议综合：

```text
score =
  semantic_similarity * 0.35
  + keyword_match * 0.2
  + importance * 0.2
  + recency * 0.1
  + confidence * 0.1
  + user_confirmed_bonus * 0.05
```

第一版如果没有 embedding，可以先用：

- FTS / BM25 全文搜索。
- 类型过滤。
- 重要性排序。
- 最近更新时间。

第二版再加入 embedding provider：

- 本地 embedding 模型。
- Ollama embedding。
- OpenAI-compatible embedding。

## 6. LLMWiki 设计

### 6.1 LLMWiki 的作用

数据库适合保存结构化状态，但不适合人直接阅读。LLMWiki 负责把稳定、重要、可审阅的知识沉淀为 Markdown 页面。

它同时服务三类对象：

- 用户：能看懂 AIRI 记住了什么。
- LLM：能稳定读取结构化背景。
- 开发者：能把这些页面转成 LoRA/RAG 数据。

LLMWiki 与传统 RAG 的区别是：RAG 倾向于在每次提问时从原始碎片临时召回和合成；LLMWiki 则把已经确认和整理过的知识沉淀成可持续维护的 Markdown 页面。AIRI 因此采用“Memory DB 为事实源，LLMWiki 为 curated view，RAG 同时检索两者”的路线。

该方向参考用户提供的 `llm-wiki.md` 思想文件，并已整理为 [`llmwiki-pattern-reference.zh-CN.md`](./llmwiki-pattern-reference.zh-CN.md)。AIRI 只吸收其知识库维护范式，不把它作为运行时依赖。

### 6.1.1 Raw Sources / Wiki / Schema

LLMWiki 子系统按三层理解：

| 层 | AIRI 含义 | 约束 |
| --- | --- | --- |
| Raw Sources | 微信、飞书、QQ、本地文档、网页剪藏、论文、Obsidian 手写笔记 | 原始资料只读，先进入导入、安全扫描和审查流程 |
| Wiki | `AIRI-Brain/70-llmwiki/` 下的人类可读 Markdown 页面 | 只写入 active、非 secret、适合长期使用的摘要或结构化知识 |
| Schema | `_meta/schema.md`、manifest、本文档中的维护规则 | 规定 frontmatter、隐私等级、索引、日志和回流流程 |

### 6.1.2 Ingest / Query / Lint

LLMWiki 的长期维护围绕三类操作：

- **Ingest**：导入新资料后，先生成候选记忆；用户确认后再更新 Memory DB；稳定且非 secret 的内容才导出到 LLMWiki。
- **Query**：聊天或研究时优先使用已整理的 LLMWiki 页面，再结合 Memory DB 与 RAG 片段；有长期价值的分析可以回流为 Wiki draft 或候选记忆。
- **Lint**：周期性检查矛盾页面、过期结论、孤立页面、缺失反链、隐私泄漏和高价值但尚未进入 LLMWiki 的 active 记忆。

后续可以把 Lint 和本地 Gemma 的 dream cycle 结合：梦境整理负责发现“应该沉淀/修正/归档”的知识，Review Workbench 负责最终确认。

### 6.2 推荐目录

```text
%APPDATA%/AIRI/airi-memory/AIRI-Brain/
  _meta/
    schema.md
    privacy-policy.md
    export-log.md
  _attachments/
  00-inbox/
  10-profile/
    profile.md
    preferences.md
    boundaries.md
    cloud-policy.md
  20-projects/
    airi-gemma/
      overview.md
      status.md
      decisions.md
  30-research/
    rag/
    lora/
    agent/
    computer-use/
  40-life/
    timeline/
      2026-05.md
    reflections/
  50-routines/
  60-interviews/
  70-llmwiki/
    profile.md
    boundaries.md
    preferences.md
    projects/
    routines/
    timeline/
  90-archive/
```

不要把这个目录放进 Git。它属于用户私有数据。

`70-llmwiki/` 是由 Memory Service 生成或由用户确认后整理出来的 LLM 可读层。其他目录可以保存人类手写的 Obsidian 笔记、研究资料、面试资料和草稿。

### 6.3 页面格式

示例：`profile.md`

```md
---
airi_schema: 1
id: wiki-profile
kind: profile
title: 用户画像
source: memory_service
memory_ids: []
status: active
privacy: local
cloud_allowed: false
rag_index: true
gbrain_index: false
created_at: 2026-05-07T00:00:00+08:00
updated_at: 2026-05-07T00:00:00+08:00
confirmed_at:
tags:
  - airi/profile
aliases:
  - AIRI User Profile
---

# 用户画像

## 稳定背景

- 本科为土木工程背景。
- 现为复旦大学智能机器人与先进制造创新学院学生。
- 正在转码，目标方向偏 AI / 大模型 / 智能体 / 算法岗。

## 当前目标

- 将 AIRI + Gemma 项目打造为面试项目。
- 长期目标是本地陪伴型桌面智能体。

## 最后更新

- 2026-04-29：用户确认画像修正。
```

示例：`boundaries.md`

```md
---
airi_schema: 1
id: wiki-boundaries
kind: boundaries
title: 强边界规则
source: memory_service
status: active
privacy: sensitive
cloud_allowed: false
rag_index: true
gbrain_index: false
tags:
  - airi/boundaries
---

# 强边界规则

- 不碰 MiniBox 项目文件。
- 不碰毕业设计文件夹。
- 删除、移动、覆盖文件前必须确认。
- 执行命令、结束进程、发送消息前必须确认。
```

### 6.4 LLMWiki 与数据库的关系

推荐关系：

```text
memory_items 是事实源
LLMWiki 是 curated view
RAG 同时检索两者
```

也就是说：

- 短期、碎片化、待确认内容先进入数据库。
- 稳定、高价值、用户确认内容写入 LLMWiki。
- LLMWiki 页面可被用户手动编辑。
- 手动编辑后不能静默覆盖数据库事实源，只能作为 `manual_override` 或 `import_candidate` 进入 Memory Service 审核和审计。

导出规则：

```text
导出：
status = active
AND privacy != secret
AND (
  source = user_confirmed
  OR low-risk project/routine memory with sufficient confidence
)

不导出：
needs_review
rejected
expired
raw conversation logs
tokens / keys / credentials
unconfirmed identity, health, relationship, or boundary claims
```

隐私等级：

| 等级 | 用途 |
| --- | --- |
| `public` | 可用于公开资料、开发期强模型和 RAG |
| `local` | 默认只给本地 Gemma / 本地 RAG 使用 |
| `sensitive` | 本地默认可用，云端每次显式确认 |
| `secret` | 不进入 RAG，不发给模型，不导出到 LLMWiki |

## 7. RAG 管线设计

### 7.1 输入分类

用户输入进入 Orchestrator 后，先判断意图：

| 意图 | 例子 | 检索重点 |
| --- | --- | --- |
| 陪伴聊天 | “我今天有点累” | 用户偏好、最近状态、生活事件 |
| 项目协助 | “现在 AIRI 改到哪了？” | 项目记忆、timeline、handover |
| 回忆查询 | “你还记得我为什么想做 LoRA 吗？” | event、profile、conversation summary |
| 桌面操作 | “帮我检查 GSV 服务” | boundary、routine、project config |
| 训练/面试 | “这个项目怎么讲给面试官？” | 技术报告、项目总结、LoRA 数据 |

### 7.2 检索源

```text
强规则缓存
  -> identity/preference/boundary memory
  -> LLMWiki Markdown
  -> conversation summaries
  -> project docs
  -> optional raw conversation messages
```

### 7.3 上下文装配

最终 prompt 建议分层：

```text
System:
  AIRI 的角色与安全规则

User Profile:
  少量稳定画像

Boundaries:
  强规则，不能被普通消息覆盖

Relevant Memories:
  3-8 条相关记忆

Relevant Wiki:
  1-3 段 LLMWiki 内容

Current Task:
  用户当前输入与最近对话
```

每次注入上下文都要控制长度。语音对话场景尤其要避免回答过长。

## 8. Agent Orchestrator 设计

### 8.1 核心职责

Agent Orchestrator 不等于 LLM。它是调度器，负责：

- 读取用户输入。
- 决定是否需要检索记忆。
- 决定是否需要工具调用。
- 调用合适的 LLM provider。
- 处理工具调用循环。
- 调用安全确认。
- 把结果交给 TTS。
- 对话结束后触发记忆反思。

### 8.2 状态机

```text
Idle
  -> ReceiveInput
  -> BuildContext
  -> Plan
  -> RespondDirectly | RequestTool | RequestConfirmation
  -> ExecuteTool
  -> ComposeFinalAnswer
  -> Speak
  -> ReflectAndStore
  -> Idle
```

### 8.3 Agent Run 数据结构

```ts
interface AgentRun {
  id: string
  input: AgentInput
  intent: AgentIntent
  context: RetrievedContext
  plan?: AgentPlan
  toolCalls: ToolCallRecord[]
  safetyChecks: SafetyCheckRecord[]
  output?: AgentOutput
  createdAt: string
  completedAt?: string
}
```

### 8.4 LLM 调用

项目已经使用 xsAI/OpenAI-compatible provider 思路。Orchestrator 可以先定义 provider-neutral 接口，再由现有 provider store 适配。

```ts
interface AgentLLMProvider {
  generate: (input: AgentLLMInput) => Promise<AgentLLMOutput>
  stream: (input: AgentLLMInput) => AsyncIterable<AgentLLMChunk>
}
```

第一阶段建议先支持：

- 本地 Ollama OpenAI-compatible。
- 现有 OpenAI-compatible provider。

云端 provider 后续加，但必须显示将发送的记忆内容。

## 9. Tool Router 与 Skill/Routine

### 9.1 Tool 与 Skill 的区别

| 概念 | 含义 |
| --- | --- |
| Tool | 单个可执行能力，例如检查端口、打开文件夹、搜索文件 |
| Skill | 一组可复用工作流，包含说明、前置条件、步骤、风险 |
| Routine | 用户经常使用的个性化流程，比 skill 更贴近个人习惯 |

示例：

```text
Tool: checkHttpService(url)
Tool: openApp(name)
Tool: searchFiles(query, roots)

Skill: diagnose-local-tts
  1. 检查 GSV 端口
  2. 检查 provider 配置
  3. 检查 streaming_mode
  4. 播放测试音频

Routine: start-airi-local-stack
  1. 检查 Ollama
  2. 启动 STT
  3. 启动 GSV
  4. 启动 AIRI
```

### 9.2 Skill 文件格式

建议本地私有 skill 存储在：

```text
<userData>/airi-memory/skills/
```

格式：

```md
# start-airi-local-stack

## Purpose

启动 AIRI 本地完整链路。

## Preconditions

- 不结束 MiniBox 相关进程。
- 不删除任何文件。

## Steps

1. 检查 Ollama 11434。
2. 检查 STT 8000。
3. 检查 GSV 9881。
4. 启动 AIRI tamagotchi。

## Safety

- 若发现端口冲突，只提示用户，不自动杀进程。
```

### 9.3 自进化边界

AIRI 可以自动生成 skill 草稿，但不能默认自动启用高权限 skill。

允许：

- 根据多次操作生成 routine 草稿。
- 用户确认后保存。
- 后续执行前展示计划。

不允许默认：

- 自动修改仓库代码。
- 自动安装依赖。
- 自动执行未知脚本。
- 自动结束进程。

## 9.4 Hermes 源码参考的记忆自进化闭环

这里的参考范围是 NousResearch `hermes-agent` GitHub 仓库中的记忆系统源码、数据流和设计模式。AIRI 可以做源码级阅读和架构级参考，但第一阶段仍然本地重实现，不引入 Fushi 的实现，不引入 LiteLLM，不引入 Docker，也不把外部 Hermes 服务作为 AIRI 运行依赖。

对 AIRI 有价值的是 Hermes 记忆系统中“记忆如何成长”的实现思路：

| Hermes 风格机制 | AIRI 借鉴方式 |
| --- | --- |
| 会话后记忆提取 | 对话结束后生成候选记忆，而不是把所有原文直接写进长期记忆 |
| 核心记忆索引 | 维护 profile、boundaries、preferences、project notes 等常驻摘要 |
| 历史会话搜索 | 保存会话摘要，必要时用 RAG 搜索旧对话 |
| 记忆整合 / AutoDream | 定期去重、压缩、修正旧事实、合并重复记忆 |
| 程序性记忆 / skill | 把成功流程沉淀成 routine 草稿，例如启动本地服务或排查 GSV |
| 记忆安全扫描 | 写入长期记忆前过滤 prompt injection、凭据、敏感隐私 |
| 写入互斥 | 后台记忆整理任务需要锁，避免并发写坏记忆 |

已实现第一版 Hermes-inspired 记忆安全扫描：导入微信、飞书、QQ、Markdown、Obsidian 等外部资料时，会检测 prompt injection、疑似密钥/token/password、不可见 Unicode 控制字符和本地文件路径。命中的条目不会被丢弃，而是强制标记为 `privacy: secret`、`status: needs_review`，并追加 `safety-review` 标签和 `metadata.safety`，避免进入 RAG、LLMWiki、Obsidian 导出或 LoRA 候选数据。

已实现第一版 `ProfileCompactor`：可以把已确认、非 secret 的长期记忆按 profile、preferences、habits、boundaries、projects、knowledge 分组，生成稳定的 `AIRI Compact Profile` Markdown 和结构化 sections。当前版本是确定性压缩，不调用 LLM；Memory DB 仍然是事实源，compact profile 只是给后续 prompt 注入、Obsidian 同步和用户审查工作台使用的生成视图。

已实现第一版 `MemoryReviewWorkbench`：它是只读审查快照 API，会把 `needs_review` 候选、冲突候选、安全风险条目和过旧 active 记忆整理成队列，标注优先级、审查原因、关联记忆 ID 和建议动作。v1 不自动 approve/reject/archive，所有写入仍走已有 MemoryAction 或设置页批量操作。

第二阶段完成态：Memory 设置页已经可以触发 LLMWiki 导出、Obsidian/AIRI-Brain 导出、Compact Profile 生成、Review Workbench 刷新、备份预览/导入和多数据源导入。AIRI 具备本地记忆治理闭环：导入 -> 安全扫描 -> 候选审查 -> 冲突处理 -> compact profile -> RAG/Obsidian/LoRA 的受控输出。

明确不采用：

- 不采用 Fushi 的项目结构作为 AIRI 底座。
- 不接入 LiteLLM 作为 AIRI 第一阶段路由层。
- 不使用 Fushi 那边的 Docker wrapper。
- 不复制 Fushi 源码到 AIRI。
- 不直接照搬 Hermes 源码；仅参考其记忆系统模块边界、提示词策略、检索流程和自进化机制。
- 不依赖外部 Hermes 服务才能运行 AIRI。

因此，AIRI 的 Hermes-inspired 自进化模块应设计为本地组件：

```text
Reflector
  -> 会话后提取候选记忆

Dream Consolidator
  -> 定期整合、去重、压缩、修正记忆

Skill Curator
  -> 从成功任务中生成 routine/skill 草稿

LLMWiki Writer
  -> 把稳定事实写成人类可读 Markdown

Safety Sandbox
  -> 限制后台任务只能读资料、只能写记忆目录
```

第一阶段的重点是把这个闭环做小：

```text
对话摘要
  -> 候选记忆
  -> 用户确认
  -> 写入本地 Memory
  -> 定期整合到 LLMWiki
```

等本地闭环稳定后，再考虑更复杂的 Agent-to-Agent、MCP 或外部 Hermes 互操作。

## 10. Safety Guard

### 10.1 权限等级

| 等级 | 能力 | 规则 |
| --- | --- | --- |
| L0 | 只聊天 | 不调用工具 |
| L1 | 只读 | 检索记忆、读取 wiki、检查服务 |
| L2 | 低风险操作 | 打开应用、打开文件夹、浏览器读取 |
| L3 | 高风险操作 | 执行命令、写文件、移动/删除文件、结束进程 |

L3 必须用户确认。

### 10.2 路径规则

建议定义：

```ts
interface PathPolicy {
  allowedReadRoots: string[]
  allowedWriteRoots: string[]
  deniedRoots: string[]
  requireConfirmationRoots: string[]
}
```

强制规则：

- MiniBox 路径进入 `deniedRoots`。
- 毕业设计文件夹进入 `deniedRoots`。
- AIRI 仓库可读写，但删除和移动仍需确认。
- 外部磁盘路径默认只读或需确认。

### 10.3 云端模型隐私检查

当 provider 不是本地模型时：

```text
准备发送上下文
  -> 标记包含哪些 memory/wiki 片段
  -> 根据 privacy 等级过滤和脱敏
  -> 若包含 local/sensitive 内容，按策略弹确认
  -> 用户同意后才发送
```

隐私发送规则：

| 隐私等级 | 云端发送策略 |
| --- | --- |
| `public` | 用户已选择云端 provider 时可发送 |
| `local` | 开启云端上下文确认时弹窗确认 |
| `sensitive` | 每次都必须显式确认 |
| `secret` | 永不发送，不进入 RAG 上下文 |

确认界面应展示：

```text
Provider: <name>
Fragments to send:
- memory:<id> privacy=local/sensitive title=...
- wiki:<path> privacy=...
Redactions applied: yes/no
Continue?
```

边界规则优先由本地 Safety Guard 执行。如果云端模型需要知道边界，应发送最小化、脱敏后的规则，避免暴露完整私有路径。

## 11. Eventa RPC 合同

Memory 和 Agent 服务在 Electron main process，renderer 通过 Eventa 调用。

建议事件命名：

```text
eventa:invoke:airi:memory:list
eventa:invoke:airi:memory:create
eventa:invoke:airi:memory:update
eventa:invoke:airi:memory:delete
eventa:invoke:airi:memory:search
eventa:invoke:airi:memory:reflect

eventa:invoke:airi:agent:run
eventa:invoke:airi:agent:cancel
eventa:invoke:airi:agent:get-run
eventa:invoke:airi:agent:list-tools
eventa:invoke:airi:agent:confirm-action
```

类型放在 `apps/stage-tamagotchi/src/shared` 或共享 package 中，避免 stage-pages 反向依赖 desktop app。

如果需要跨 Web/Desktop 共享，建议抽到：

```text
packages/stage-shared/src/agent
packages/stage-shared/src/memory
```

## 12. UI 设计范围

第一版设置页不要做成花哨页面，要做成可控工具。

### 12.1 记忆管理页

功能：

- 查看记忆列表。
- 按类型筛选。
- 搜索。
- 查看来源和置信度。
- 编辑内容。
- 删除或归档。
- 确认 `needs_review` 记忆。

### 12.2 Agent 权限页

功能：

- 查看当前权限等级。
- 管理路径白名单/黑名单。
- 开关 Computer Use。
- 开关自动记忆提取。
- 开关云端上下文确认。

### 12.3 LLMWiki 页面

功能：

- 查看 profile/boundaries/preferences/project/timeline。
- 手动刷新 LLMWiki。
- 导出 Markdown。

## 13. 第一阶段实施计划

### P0：仓库整理

已完成/正在进行：

- 忽略 `.specstory/`、`.lnk`、`gsv/`、Python venv。
- 保留 STT 服务脚本。
- 补充 STT `requirements.txt`，方便重建 venv。

继续做：

- 分类提交 GSV/TTS/STT/provider 改动。
- 核对并保持 GSV 端口为 9881；9880 只作为旧配置/MiniBox 冲突排查线索。
- 确认 BAT 脚本不误杀 MiniBox。

### P0.5：AIRI-Brain 知识库工作流

在实现 Memory Service 前，先建立一个本地知识库规范。它作为 Claude Code、Codex、Obsidian、GBrain 和 AIRI 之间的共享知识层。

推荐目录：

```text
%APPDATA%/AIRI/airi-memory/AIRI-Brain/
  _meta/
  _attachments/
  00-inbox/
  10-profile/
  20-projects/
  30-research/
  40-life/
  50-routines/
  60-interviews/
  70-llmwiki/
  90-archive/
```

职责：

- `00-inbox` 保存原始资料入口，例如论文、网页摘录、长对话、项目交接。
- `10-profile` 保存用户画像、偏好、边界。
- `20-projects` 保存 AIRI/Gemma 项目状态。
- `30-research` 保存 RAG、LoRA、Agent、Computer Use 研究资料。
- `40-life` 保存生活回忆、时间线、习惯总结。
- `50-routines` 保存可复用 skill/routine。
- `60-interviews` 保存面试表达、项目亮点、问答卡片。
- `70-llmwiki` 保存由 Memory Service 导出的 LLM 可读页面。
- `90-archive` 保存过期或历史资料。

这套目录应默认位于用户本地私有数据区，不直接提交到 AIRI 仓库。

### P0.6：开发期模型切换策略

明确 Claude Code / CC Switch 只服务开发期，不混入 AIRI 运行时。

```text
Claude Code / Codex / Gemini CLI
  -> 通过 CC Switch 选择强模型
  -> 整理资料、写设计、改代码、生成知识页
  -> 输出 Markdown / patch / spec
  -> 存入 AIRI-Brain 或 AIRI 仓库文档

AIRI + Gemma 4
  -> 日常运行
  -> 读取本地 Memory / LLMWiki / RAG
  -> 陪伴、助理、语音、Computer Use
```

实现要求：

- 开发期强模型可以处理公开论文、项目代码、非敏感技术资料。
- 敏感生活记忆默认只给本地 Gemma 使用。
- 若需要 Claude Code 整理敏感资料，必须由用户主动提供并确认。
- AIRI 运行期 provider 切换由 AIRI 内部 provider 设置管理，不依赖 CC Switch。

### P1：Memory Service 最小闭环

- 定义 memory 类型。
- 在 Electron main process 中实现 PGlite + Drizzle 本地数据库。
- 实现 CRUD。
- 实现文本 search。
- 增加 Eventa RPC。
- 增加 Pinia store。
- 增加设置页列表。

建议文件：

```text
apps/stage-tamagotchi/src/main/services/airi/memory/schema.ts
apps/stage-tamagotchi/src/main/services/airi/memory/database.ts
apps/stage-tamagotchi/src/main/services/airi/memory/repository.ts
apps/stage-tamagotchi/src/main/services/airi/memory/index.ts
apps/stage-tamagotchi/src/renderer/stores/memory.ts
apps/stage-tamagotchi/src/renderer/pages/settings/memory/index.vue
```

Eventa RPC：

```text
electronMemoryGetStatus
electronMemoryList
electronMemoryCreate
electronMemoryUpdate
electronMemoryDelete
electronMemoryClear
```

### P2：LLMWiki / Obsidian / GBrain 风格同步

- 从 Memory Service 生成 `profile.md`、`boundaries.md`、`projects/airi-gemma.md`。
- 支持导出到 AIRI-Brain/Obsidian vault。
- 约定 LLMWiki Markdown frontmatter 和标题结构。
- 预留 GBrain/MCP 检索接口，但第一版不强依赖 GBrain。
- 设置页可查看、刷新、导出 LLMWiki。
- 第二阶段完成边界：Obsidian/AIRI-Brain 使用“Memory DB 为事实源 + Markdown/Obsidian 可读视图 + Markdown/Obsidian 导入回流”的半同步模式，不做自动双向覆盖。
- 已实现 Obsidian/AIRI-Brain 导出：Memory 设置页可以把已确认、非 secret 的记忆导出为本地 vault，包含 `AIRI-Brain.md` 首页、`05-compact-profile.md` 高密度画像，以及 profile、boundaries、projects、knowledge、memories 分区。
- 已实现导入回流：Memory 设置页支持选择 Markdown/Obsidian 知识库目录导入，导入内容进入 `needs_review` 候选记忆，经过安全扫描和用户审查后才成为 active 记忆。
- 当前不做自动双向同步、frontmatter 自动覆盖和 Obsidian 修改自动写回；这些属于后续“冲突预览 + 用户确认写回”增强，避免误把手写笔记覆盖进 Memory DB。

### P2.5：GBrain 可选只读索引层

- GBrain 不作为 P1/P2/P3 必需依赖。
- 如果启用，只索引 AIRI-Brain/LLMWiki Markdown 或暴露检索结果。
- 默认不允许 GBrain 直接写 Memory DB。
- 任何外部写入建议都进入 `00-inbox/` 或 `needs_review`。
- Windows 原生优先；若兼容性不足，再考虑 WSL2。第一阶段不使用 Docker。

### P2.6：Obsidian-inspired Memory Workspace

- 前端体验目标从“普通设置页”升级为 Memory Workspace：文件树/来源树、Review Inbox、Markdown 记忆正文、来源证据、标签、关系、隐私状态和 LoRA/梦境状态并列展示。
- AIRI 内置管理台优先负责安全闭环：导入批次、候选记忆、冲突预览、批量审查、隐私分级、公开画像导出、LoRA 候选导出、Computer Use 权限和梦境任务。
- Obsidian/AIRI-Brain vault 优先负责人类可读和长期整理：Markdown、YAML frontmatter、双链、标签、时间线和 Graph 视图。AIRI 不依赖 Obsidian 进程运行，只保证导出文件可被 Obsidian 打开。
- `00-inbox/` 用于接收微信/飞书/QQ/Markdown 导入、梦境总结、Hermes-inspired evolution suggestions 和人工笔记回流；任何从 Markdown 回流到 Memory DB 的内容都先成为 `needs_review`。
- 后续如果做 AIRI 自有前端，应借鉴 Obsidian 的信息架构，而不是照搬普通后台表格：左侧导航稳定，中间内容可编辑，右侧显示证据、反链、标签、RAG/LoRA 使用状态。
- 不在 P2.6 实现自动双向同步、frontmatter 覆盖、Obsidian 插件和图谱编辑器；这些属于 P9+ 的高级体验。

### P2.7：迁移与备份

- 维护 [`MIGRATION.zh-CN.md`](./MIGRATION.zh-CN.md)，明确源码、依赖、记忆库、模型权重、语音素材和私有配置的迁移边界。
- 提供 `scripts/backup-airi.ps1` 与 `scripts/restore-airi.ps1`，用于备份项目工作区、本地模型/语音资产和 AIRI `userData`。
- Memory 设置页后续增加“导出记忆库”和“导入记忆库”，避免用户只能手动复制 PGlite 目录。
- 备份默认不进入 Git；备份包必须视为隐私数据，不能上传公开仓库。
- 恢复流程默认不覆盖已有目录，只有用户显式 `-Force` 时才覆盖同名文件。

已实现第一版 **Memory Backup JSON**：

- Memory 设置页支持导出 `airi-brain/95-backups/airi-memory-backup.json`。
- 备份文件是带 `schemaVersion` 的 JSON，不直接复制 PGlite 内部目录。
- 导入备份时逐条重建为 `needs_review` 记忆，不覆盖当前数据库。
- 导入记录会保留原始 memory id / status / createdAt 到 `metadata.restoredFromBackup`，便于审查来源。
- Memory 设置页支持先预览备份，再选择性导入；预览阶段会标记空内容、可能重复和可能冲突的记忆。
- Memory 设置页支持对当前筛选出的 `needs_review` 记忆批量确认、拒绝或归档，用于快速处理导入/恢复后的候选记忆。
- 对单条冲突候选记忆，Memory 设置页支持“保留新记忆”或“拒绝新记忆”；保留新记忆会确认候选项并归档相关旧记忆。
- 备份 JSON 仍然可能包含私密记忆，必须按本地隐私数据处理，不能提交到 Git 或公开分享。

### P3：RAG 注入

- 对话前读取强规则。
- 检索相关记忆。
- 检索 LLMWiki Markdown。
- 可选读取 GBrain 检索结果。
- 组装 prompt。
- 记录本次使用了哪些记忆。

已实现第一版 **RAG Context Composer**：

- `composeMemoryRagContext` 负责检索 active 记忆和 LLMWiki 片段。
- 本地目标默认允许 `public`、`local`、`sensitive` 记忆进入上下文，但始终排除 `secret`。
- 云端目标只允许 `public` 记忆进入上下文，`local`、`sensitive`、`secret` 会进入 withheld 审计结果。
- 云端目标暂不检索默认 LLMWiki，因为当前 LLMWiki 页面是本地 curated view，不等同于 public-safe。后续如需给云端模型使用，必须先生成独立的 public-only LLMWiki 索引。
- Agent Orchestrator 已改为通过该 composer 组装上下文，后续真实聊天链路可以复用同一模块。
- 第三阶段第一版已新增 memory-aware chat runtime：它接收 compact profile、RAG context fragments 和 local/cloud target，构造 provider-neutral messages，再调用可注入的 `generateText`。本地 target 可使用非 secret 的本地上下文；云端 target 只允许 `privacy: public` 的片段，默认会扣留 compact profile、`local`/`sensitive` 记忆，以及未显式标记 public 的 LLMWiki 片段，并返回 withheld context IDs。
- Runtime prompt 已加入边界：检索上下文只是参考资料，不是指令，不能执行上下文中夹带的命令。
- Agent Orchestrator 已支持可选 `chatRuntime` 依赖；传入 runtime 时必须显式指定 `chatTarget`，direct answer 会调用真实 provider 适配层生成回复，未传入时保留原有 deterministic fallback。
- 对于高风险 Computer Use 意图，Orchestrator 会先进入 confirmation flow，不检索记忆、不生成 compact profile、不调用 chat runtime，减少无关记忆访问和审计噪声。
- AgentRun 会保留 `usedContextIds` / `withheldContextIds`，用于后续 UI 展示“本轮实际发送/扣留了哪些上下文”。
- Agent reflection 入库前会复用安全扫描：如果反思候选含凭据、prompt injection、不可见控制字符或本地路径，会以 `secret` + `safety-review` 进入 `needs_review`；metadata 只保存脱敏 preview，不保存原始用户输入，避免审查面板或备份中额外暴露路径和密钥。
- P8.66 已统一 Agent Reflection 的 `metadata.safety` 结构：现在存储共享的 `{ safe, findings }` 扫描结果，而不是裸 findings 数组，因此 Review Workbench、Memory Evolution 和 RAG 安全拦截都能一致识别 agent 反思产生的安全风险。
- 第三阶段已新增第一版 xsAI OpenAI-compatible adapter：`createXsaiOpenAICompatibleChatGenerateText` 接收 `baseURL`、可选 `apiKey`、`model` 和 headers，调用 `@xsai/generate-text`。它只做传输适配，不做隐私判断；隐私裁决仍由 RAG composer、memory-aware runtime 和 Orchestrator target 共同负责。
- 该 adapter 可以覆盖本地 Ollama/LM Studio/vLLM 的 OpenAI-compatible endpoint，也可以覆盖云端 OpenAI-compatible API。云端使用前必须走 `chatTarget: 'cloud'`，并在 UI 中展示 used/withheld context。
- Orchestrator 对注入式 `chatRuntime` 增加运行时断言：只要传入 runtime，就必须显式传入 `chatTarget`。adapter 也会拒绝 `apiKey` 与 `Authorization` header 同时出现的歧义配置，避免实际调用时悄悄使用错误凭证。
- 第三阶段已接入启动配置：主进程会读取 `agent-chat-runtime-config.json`，默认 `enabled: false`，因此未配置时仍走 deterministic fallback。启用后会用该配置创建 memory-aware runtime，并在启动时注入 Orchestrator。启用配置必须显式写 `target`，不能依赖默认值；配置错误会记录 warning 并回退 deterministic fallback，避免手改 JSON 导致主进程启动失败。
- 配置文件第一版示例：

```json
{
  "enabled": true,
  "provider": "openai-compatible",
  "target": "local",
  "openAICompatible": {
    "baseURL": "http://localhost:11434/v1",
    "model": "gemma3:4b"
  }
}
```

- 云端 API 示例只应配合 `"target": "cloud"` 使用：

```json
{
  "enabled": true,
  "provider": "openai-compatible",
  "target": "cloud",
  "openAICompatible": {
    "apiKey": "<your-api-key>",
    "baseURL": "https://api.example.com/v1",
    "model": "provider-model-name"
  }
}
```

- 第三阶段已补齐设置页闭环：通过 Eventa 暴露 get/apply/test config，Memory 设置页可以选择本地/云端目标、填写 OpenAI-compatible Base URL / model / API key、保存配置、热更新现有 Agent Orchestrator，并在保存前执行不持久化的测试连接。测试连接只发送空记忆上下文的 `ping` probe，不会写入配置，也不会更新运行中的 Orchestrator。
- Memory 设置页会保留最近一次 LLMWiki 导出结果，并展示输出目录、导出时间、导出 Markdown 文件数、导出总记忆数和每个页面包含的记忆数量，便于用户确认 `70-llmwiki/` 是否已经写入。
- 第三阶段已新增 LLMWiki Index / Log Export：LLMWiki 导出目录现在会额外生成 `index.md` 和 `log.md`。`index.md` 提供页面导航、导出时间、页面数和记忆数；`log.md` 记录本次导出的结构化时间线。两者都只记录链接、统计和隐私约束，不写 secret 记忆或绝对路径。
- 第三阶段已新增 LLMWiki Export Navigation Files UI：Memory 设置页的 LLMWiki 导出结果面板现在会单独展示 `index.md` / `log.md` 的相对路径、本地路径和关联记忆数量；常规页面列表只展示内容页，导出总记忆数也只按内容页计算，避免导航文件重复计数。
- 第三阶段已修正 LLMWiki 中文导出可读性：LLMWiki 页面标题、`记忆条目` 小节和记忆元数据标签现在使用正常中文，避免早期编码乱码污染 Obsidian vault、RAG 检索片段和后续 LoRA 数据审查。
- P8.71 已补 LLMWiki 安全导出门禁：LLMWiki 导出现在复用 `hasMemorySafetyRisk`，会排除命中安全扫描或历史 `metadata.safety.safe=false` 的记忆；导出日志也明确 unsafe content 会被省略。
- 第三阶段已新增 LLMWiki Search Console：Memory 设置页可以直接调用 `electronMemorySearchLlmWiki`，输入 query 和 limit 后查看本地 Markdown LLMWiki 的命中目录、已扫描 Markdown 文件数量、命中片段数量、片段路径、score 和文本内容；空结果会区分“尚未扫描到 Markdown 文件”和“已扫描但未命中 query”，便于人工检查 RAG 注入前的知识库召回质量。
- 第三阶段已新增 Public Profile / LoRA Export Result UI：Memory 设置页会保留最近一次开源画像和 LoRA 候选数据导出的输出目录、导出时间、文件列表和记录数量；页面不展示样本正文，仍依赖 preflight / dry-run / review workbench 做隐私和训练前检查。
- 第三阶段已新增 Backup Export Result UI：Memory 设置页会保留最近一次本地备份导出的输出目录、导出时间、文件列表和备份记忆数量，方便换电脑迁移前确认备份产物；该面板只读，不改变备份格式和恢复流程。
- 第三阶段已新增 Backup Preview Risk Summary：备份导入前的预览面板会汇总已选择项、空内容项和冲突项数量，帮助用户在恢复前快速判断是否需要先取消选择或回到 Review Workbench 处理风险。
- 第三阶段已新增 Backup Selected Conflict Warning：如果当前选中的备份导入项中包含冲突发现，预览面板会在导入前显示明确警告，提醒用户先审查这些候选恢复项。
- 第三阶段已新增 Backup Preview Empty State：如果备份文件中没有任何记忆，预览面板会显示明确空状态，避免用户误以为导入流程卡住。
- 第三阶段已新增 Backup Preview Metadata：备份导入前的预览面板会显示备份文件路径、schema 版本和原始导出时间，方便用户在迁移/恢复前确认来源。
- 第三阶段已新增 Backup Preview Bulk Selection：备份导入前可以一键全选所有非空可导入项或清空当前选择，方便大批量迁移时快速调整恢复范围；逐项 checkbox 和导入行为保持不变。
- 第三阶段已新增 Backup Import Summary Cards：备份导入完成后，结果面板会以摘要卡展示导入成功项和跳过项数量，方便用户在迁移恢复后快速确认结果；面板仍不展示恢复出的记忆正文。
- P8.70 已补备份导入安全重扫：Memory JSON 备份被视为不可信输入，恢复时会重新执行安全扫描；命中的条目强制 `secret` + `needs_review` + `safety-review`。备份预览面板也会显示安全风险数量、选中项警告和条目级风险标签。
- 第三阶段已新增 Migration Readiness Checklist UI：Memory 设置页会基于当前 active 记忆、Memory JSON 备份、LLMWiki 导出和 Obsidian/AIRI-Brain 导出结果展示迁移就绪状态，方便毕业后换设备前确认哪些产物还没有生成。
- 第三阶段已新增 Migration Scripts Regression Test：`apps/stage-tamagotchi/scripts/migration-scripts.test.ts` 会在 Windows 上验证迁移预检能识别 `一键启动.bat` / `一键关闭.bat`，并验证备份/恢复脚本能保留这些 Unicode 文件名，避免 PowerShell 5 编码差异导致换设备时漏备份启动入口。
- P8.61 已优化恢复脚本：`restore-airi.ps1 -RestoreProject` 现在允许把项目恢复到已创建但为空的目标目录；如果目标目录非空仍会拒绝覆盖，只有用户明确传入 `-Force` 才覆盖。迁移指南也把“已有源码时只恢复 local data”和“空目录完整恢复项目”分成两条路径。
- P8.69 已修正 `restore-airi.ps1` 的 userData 默认恢复路径：新电脑恢复时默认写入当前用户的 `%APPDATA%\AIRI`，不再复用 manifest 里旧电脑的绝对路径；只有用户显式传 `-AiriUserDataPath` 时才恢复到指定目录。
- 第三阶段已新增 RAG Context Preview：Memory 设置页可以输入 query、target、memory limit 和 LLMWiki limit，预览本地/云端目标会发送的 memory/LLMWiki fragments 与 withheld reasons。云端目标只允许 public memory，默认不包含本地 LLMWiki，便于在真实 LLM 调用前人工检查隐私边界。

### P4：Agent Orchestrator

- 建立 AgentRun。
- 支持 direct answer。
- 支持 tool call。
- 支持 confirmation。
- 支持 reflect-and-store。

已实现第一版 **Agent Console v1**：

- Memory 设置页新增 Agent Console，可以直接向现有 Agent Orchestrator 发起一次带记忆检索的请求。
- Renderer 侧新增 `useAgentSettingsStore`，通过已有 Eventa RPC 调用 `run/get/cancel/list-tools/confirm-action/reflect-and-store`。
- Console 会展示当前 AgentRun 的 `status`、`mode`、`response`、检索上下文、`usedContextIds` 和 `withheldContextIds`，用于审计本轮实际使用或拦截的记忆。
- 如果 Orchestrator 返回 `awaiting_confirmation`，设置页可以批准或拒绝 pending high-risk action；P4.1 仍不执行真实高风险 Computer Use，只走确认闭环。
- 已完成 reflect-and-store 入口：用户可以编辑当前回应，并将其写入 `needs_review` 记忆候选，随后继续在 Memory Review 流程里确认、拒绝或修正。

### P5：Skill/Routine

- 从重复任务生成 routine 草稿。
- 用户确认后保存。
- Orchestrator 可按 routine 执行计划。

已实现第一版 **Routine Library v1**：

- Electron main process 已有本地 routine manager，支持从多行文本生成 routine 草稿、保存 Markdown 文件、列出和删除 routine。
- Memory 设置页新增 Routine Library，可以把重复工作流按“一行一步”生成草稿，并在保存前查看标题、slug 和步骤。
- 保存后的 routine 会落到本地 Markdown 文件，并通过 Agent Orchestrator `listTools()` 暴露为 `routine.<slug>` 低风险工具描述。
- Routine Library 保存或删除 routine 后，会刷新 Agent Console 的工具列表，让用户能看到当前 Agent 可发现的 routine 能力。
- P5.1 仍不执行 routine，只做沉淀、管理和工具发现；真实执行应继续放在后续安全确认和执行器阶段。
- P5.2 已新增 Routine Plan Preview：Agent Orchestrator 可以识别 `routine: <slug-or-title>`、`preview routine: <slug-or-title>`、`run routine: <slug-or-title>`，按 slug 或 title 查找已保存 routine，并返回编号步骤计划。
- Routine plan preview 不读取 Memory/RAG，不调用 chat runtime，不触发 Computer Use 执行；它只是把已审核保存的 routine 转成用户可审查的计划文本。

### P6：安全版 Computer Use

- 只读观察：截图、窗口列表、网页读取、文件搜索。
- 低风险操作：打开应用、打开文件夹、浏览器自动化。
- 高风险操作：命令执行、文件写入、删除、移动、结束进程，必须确认。
- 所有 Computer Use 行为写入审计日志，只有筛选后的摘要进入长期记忆。

已实现第一版 **Computer Use Safety Console**：

- Electron main process 已有 controlled-execution Computer Use manager，支持读取本地策略、预览动作风险、写入并读取审计记录，并在用户显式批准后执行 allowlist 内的低/中风险动作。
- Memory 设置页新增 Computer Use Safety，可以查看当前 `controlled_execution` 策略、允许/拒绝目录、高风险动作类型。
- 用户可以手动构造一次动作预览请求，包含 action kind、target、command、cwd 和 reason。
- UI 会展示 `risk`、`decision`、`requiresConfirmation`、`canExecute` 和策略给出的原因；P8.80 后 `canExecute` 表示该 preview 是否能在显式批准后执行。
- Safety Console 会展示最近审计记录，用于理解 Agent/用户触发过哪些 preview。
- P6.3 已新增确认后的安全执行闭环：Computer Use preview 会生成 audit id，用户必须显式确认后，才能执行 `read_file`、`search_files`、`open_url`、`open_path` 四类低/中风险动作。
- `write_file`、`delete_path`、`move_path`、`run_command`、`observe_screen` 当前仍不可执行；高风险动作即使 approved 也会被 main process 拒绝。
- 执行结果以结构化 `ElectronComputerUseExecutionResult` 返回到设置页，展示 output/error，但本阶段仍不允许 Agent Orchestrator 自主执行；Agent 侧高风险动作继续走 confirmation flow。
- P6.4 已把安全 Computer Use 接入 Agent 确认流：当用户输入 `read file:`、`search files:`、`open url:`、`open path:` 时，Agent Orchestrator 会先创建带 preview id 的 pending action，不读取 Memory/RAG，也不调用 chat runtime。
- 用户批准后，Agent Orchestrator 只会把已预览过的低/中风险 preview id 交给 `ComputerUseManager.executeAction({ approved: true, id })` 执行，并把执行结果返回到本次 Agent run。
- `run command:`、删除、写入、移动、屏幕观察等高风险动作仍保持非执行状态；即使用户确认，Agent 也只完成确认记录，不会绕过 main process 的 Computer Use 安全边界。
- P8.60 已补 Agent Orchestrator 的 Computer Use 拒绝处理：如果 Computer Use policy 把一个读文件、打开路径等预览判定为 `deny`，Agent pending action 会提升为高风险显示；即使用户点击确认，Orchestrator 也会取消该 run 并返回 policy 拒绝原因，不会尝试执行，也不会把它描述成普通“已确认”动作。
- P8.64 已补 Computer Use 执行阶段二次校验：即使 preview 来自历史 audit log，执行前也会用当前 policy 重新检查缺失 target、URL scheme、denied root、allowed read/write roots，避免旧 preview 或被篡改的 audit 条目绕过当前策略。
- P8.80 已修正 Computer Use preview 的 `canExecute` 语义，并把当前策略模式从旧的 `preview_only` 调整为 `controlled_execution`：低/中风险且在安全执行 allowlist 内的动作会在显式批准后标为可执行，高风险动作仍保持不可执行；设置页执行按钮、renderer store、main process 执行入口和 Agent confirmation 执行入口都要求 `canExecute: true`，避免前后端策略分叉或旧 audit/非 UI 调用绕过保护。

### P6.5：多数据源导入与人格塑造

- 已实现第一版：Memory 设置页支持用户手动导入微信聊天记录、飞书聊天记录、QQ 聊天记录和本地 Markdown/Obsidian 知识库。
- 已实现第一版：`ChatRecordArchiveImporter` 统一处理微信、飞书、QQ 的 `.txt`/`.md` 中间格式；`LocalKnowledgeImporter` 处理 Markdown 知识库。
- 当前聊天导入只抽取 `conversation` 类型候选记忆，默认 `privacy: sensitive`、`status: needs_review`。
- 原始记录只进入本地 raw import 区，默认不发云端、不进入 Git、不直接训练。
- 后续再做脱敏、切块、摘要和画像候选提取；不能把原始聊天记录直接写入人格 prompt。
- 用户确认后写入 Memory DB，并按隐私等级决定是否导出到 LLMWiki、是否进入 RAG。
- 只有脱敏、确认、质量达标的样本才能进入 LoRA Dataset Candidate。
- P6.5.1 已新增确定性 persona candidate 提取：当微信、飞书、QQ 或本地知识库导入条目包含“用户身份、偏好、习惯、边界、项目上下文”等明显信号时，Ingestion Pipeline 会额外生成一条 `persona-candidate` 待审记忆。
- persona candidate 默认 `status: needs_review`，继承原始导入隐私级别，并继续走 Safety Scanner 与 Conflict Detector；用户未审核前不会进入 active 画像、RAG、LLMWiki 或 LoRA 数据集。
- 该机制只做保守的候选提取，不做“自动人格覆盖”。如果聊天记录里出现第三方观点、临时情绪或过期状态，必须在 Review Workbench 中人工拒绝、编辑或降级。
- P6.5.2 已把 persona candidate 接入 Memory Review Workbench：审查条目会显示独立的 `persona_candidate` 原因，并优先推荐 `edit -> approve -> reject`，鼓励用户先修正措辞、隐私级别和事实边界，再决定是否进入长期画像。
- P6.5.3 已把 Review Workbench 建议动作接入设置页：`approve`、`reject`、`archive` 会通过统一 dispatcher 显式更新记忆状态，`archive_related` 会复用“保留候选并归档关联记忆”流程，`edit` 只把条目载入编辑表单，仍需用户手动保存。
- P6.5.4 已补齐审核后的派生刷新：Review Workbench 动作执行后会刷新状态、审查队列、compact profile 预览，并在已有 RAG preview 时用同一请求重新计算上下文；不会自动导出 LLMWiki、Obsidian、公开画像或 LoRA 数据。
- P6.5.5 已让 Obsidian/AIRI-Brain 导出区分三条画像通道：`10-profile/user-profile.md` 保存已审核的真实私有画像；`00-inbox/persona-candidates.md` 保存非 secret 的待审 persona candidates；`80-public-profile/public-profile-preview.md` 只保存显式标记 `profileVisibility = demo | training_sanitized`、非 sensitive/secret、非微信/飞书/QQ 原始导入的公开预览画像。
- P8.78 已收紧 persona candidate 来源证据：`metadata.personaCandidate.derivedFrom` 只记录导入条目的 `externalId`，不再复用包含导入根目录的完整 sourceId，避免 Review Workbench 证据栏展示本机绝对路径。

### P6.6：开源画像与发布前脱敏

- 已实现第一版 `PublicProfileExporter`，从 Memory DB 中生成本地 `80-public-profile/public-profile.md` 与 `public-profile.json`。
- 默认只导出 `metadata.profileVisibility = demo` 或 `training_sanitized` 的已审核内容。
- 第一版强制排除 `sensitive`、`secret` 和微信/飞书/QQ 原始导入来源。
- P6.6 已新增共享的 Memory Export Preflight：公开画像和 LoRA dataset 导出复用同一套资格判断，并通过 Eventa/Pinia 暴露 `preview-export-preflight` 预检报告；报告会给出 `not_active`、`sensitive_or_secret`、`raw_chat_import`、`unsafe_content`、`missing_public_visibility`、`missing_training_visibility`、`demo_only` 等阻断原因，方便在真正写文件前先审查风险。公开画像和 LoRA 导出都会阻断本地路径、密钥、提示注入、不可见控制字符以及带有不安全元数据的记忆；训练前质量门仍作为第二层检查，只允许 `ready` 样本写入 JSONL。
- P6.7 已把预检接入 Memory 设置页：用户可以分别预览开源画像导出和 LoRA 候选导出，页面只显示允许/拦截数量、记忆 ID、类型、隐私、来源、状态和阻断原因，不展示被拦截记忆正文，避免预检界面本身泄露敏感内容。
- 私有画像、微信/飞书原文、真实文件路径、账号、人际关系、情绪状态和未公开项目资料不得进入公开仓库。
- README、demo 截图、样例数据库、LoRA 训练样本发布前必须经过脱敏检查。
- 开源 demo 使用合成用户画像或脱敏画像，不直接使用真实个人画像。

### P7：LoRA 数据飞轮

- 从真实对话和工具调用中筛选训练样本。
- 从已审核的导入记录中抽取沟通风格、记忆使用和项目协助样本。
- 构造记忆使用、RAG 回答、工具调用、安全拒绝样本。
- 脱敏后用于 Gemma LoRA / QLoRA 微调。

已实现第一版 **LoRA Dataset Candidate Exporter**：

- 导出位置：`airi-brain/90-lora-dataset-candidates/lora-dataset-candidates.jsonl`。
- P7.1 已同步生成治理清单：`airi-brain/90-lora-dataset-candidates/lora-dataset-manifest.json`。manifest 记录 `recordCount`、已导出样本的 source memory id、类型、来源、标签，以及共享 preflight 的 total/allowed/blocked 统计和阻断原因；manifest 不写入被拦截记忆正文，也不保留原始文件路径等 metadata。
- P7.2 已新增训练前质量门：preflight 允许的候选还会经过确定性质量检查，过短内容会标记 `too_short`，疑似本地文件路径会标记 `possible_local_path`，缺失 assistant 内容会标记 `missing_assistant_content`。只有 `ready` 样本写入 JSONL；`needs_review` 样本只进入 manifest 的质量复核列表，且不写正文。
- P7.3 已新增确定性 train/eval 拆分：导出器会保留完整 ready 候选池 `lora-dataset-candidates.jsonl`，同时写出 `lora-dataset-train.jsonl` 和 `lora-dataset-eval.jsonl`。ready 样本少于 5 条时全部进入 train；达到 5 条及以上时用稳定的 tail-eval v1 策略把末尾 20% 放入 eval，并把 train/eval source memory id 写入 manifest，便于后续 Unsloth/TRL 训练脚本直接读取。
- P7.4 已新增训练配置包：导出器会写出 `lora-training-config.json`，记录 dataset 相对路径、train/eval/candidate 数量、split 策略、Gemma-family QLoRA 默认参数、preflight/quality gate 名称和隐私状态。这个文件只服务于后续训练脚本读取；AIRI 桌面端仍不在导出阶段直接运行训练。
- P7.5 已新增训练前 dry-run 校验器：`validateLoraTrainingPackage` 会读取 `lora-training-config.json`，检查 dataset 路径必须是安全相对路径、候选/train/eval/manifest 文件存在、JSONL 行数与配置一致、manifest split 与配置一致、隐私 flag 和 gate 名称满足训练前要求。dry-run 报告只返回检查项、数量和状态，不返回样本正文。
- P7.6 已把 dry-run 接入 Memory Manager、Eventa、Pinia 和 Memory 设置页：用户导出 LoRA 数据后可以直接点击“检查 LoRA 训练包”，查看候选/train/eval 数量和失败检查项。UI 只展示 dry-run 统计与检查状态，不展示任何样本正文。
- P7.7 已新增中文训练交接说明：导出器会写出 `lora-training-runbook.zh-CN.md`，说明如何先跑 `validateLoraTrainingPackage`，再把 `lora-training-config.json` 交给 Unsloth / TRL QLoRA 脚本。runbook 只包含训练流程、文件名、数量和隐私门禁说明，不嵌入任何样本正文。
- P7.8 已新增外部训练脚本模板：`scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py` 使用 `uv run`、Unsloth `FastLanguageModel` 和 TRL `SFTTrainer` / `SFTConfig`，读取 `lora-training-config.json`、校验隐私 flag、加载 train/eval JSONL，并保存 LoRA adapter。该脚本位于 `scripts/`，不被 Electron 桌面端直接调用。
- P7.9 已补训练后交付材料：`MODEL_CARD_TEMPLATE.zh-CN.md` 用于记录 base model、adapter、数据来源、privacy gates、train/eval 数量、评估和局限性；`DEPLOYMENT.zh-CN.md` 说明 PEFT adapter、GGUF、Ollama、LM Studio、vLLM 和 AIRI `agent-chat-runtime-config.json` 的本地部署路径。公开发布仍必须人工做隐私复核。
- P7.10 已把生成的 `lora-training-runbook.zh-CN.md` 与仓库训练模板闭环：runbook 会指向 `scripts/training/gemma-qlora/train_gemma_qlora_unsloth.py`、`MODEL_CARD_TEMPLATE.zh-CN.md` 和 `DEPLOYMENT.zh-CN.md`，并给出 `uv run` 示例和 `agent-chat-runtime-config.json` 接回 AIRI 的提示。
- P7.11 已给外部训练脚本新增 `--dry-run`：该模式只使用 Python 标准库读取 `lora-training-config.json` 和 train/eval JSONL，校验隐私 flag、路径边界和样本行数，然后输出 JSON summary；Unsloth / TRL / Datasets 只在正式训练路径里懒加载，方便在没有 GPU 或大依赖前先检查数据包。
- P7.12 已给训练脚本 dry-run 增加样本级安全门：JSONL 记录必须只包含 `system` / `user` / `assistant` 角色，必须有非空 assistant 内容，assistant 内容不能过短，正文中不能出现疑似本地路径。该检查在正式训练依赖加载前完成。
- P7.13 补强了训练脚本 dry-run 的坏 JSONL 排错契约：当 `lora-dataset-*.jsonl` 中某一行不是合法 JSON 时，脚本会在加载训练依赖前返回 `Invalid JSONL at <file>:<line>`，方便用户定位导出包损坏位置。
- P7.14 给训练脚本 CLI 增加了预期数据错误边界：导出包路径、隐私门禁、JSONL 格式、样本内容等 `ValueError` 会被转换为简短的 `ERROR: ...` 和退出码 2，避免用户在 dry-run 阶段被完整 Python traceback 淹没。
- P7.15 给训练脚本增加了 `--error-format json`，让 AIRI 前端或 Agent Orchestrator 可以机器读取 dry-run 失败原因，而不需要解析自然语言 stderr。
- P7.16 稳定了训练脚本成功 dry-run 的 stdout 契约：返回 `schemaVersion`、`ok`、`checks`、`counts` 和后续追加的 `artifacts`，让 AIRI 前端或 Agent Orchestrator 能同时机器读取成功与失败结果。
- P7.17 把外部训练脚本的机器可读 dry-run 契约同步进导出的 `lora-training-runbook.zh-CN.md`：训练包自带 `--error-format json` 示例、成功 stdout 结构和失败 `validation_error` 结构。
- P7.18 将外部训练脚本 dry-run 契约写入 `lora-training-config.json.dryRunContract`：包含成功报告 schema、检查项、JSON 错误格式、`validation_error` 类型和退出码 2，避免 Orchestrator 解析 Markdown。
- P7.19 让 AIRI 的 `validateLoraTrainingPackage` 校验 `dryRunContract`：如果导出包缺少正确的成功检查项、JSON 错误格式、`validation_error` 类型或退出码 2，dry-run 会返回 `dry_run_contract_matches_script` 失败。
- P7.20 让外部 `train_gemma_qlora_unsloth.py` 也校验 `dryRunContract`：直接运行脚本时，旧包或手改包若缺少正确成功检查项、JSON 错误格式、`validation_error` 类型或退出码 2，会在加载训练依赖前失败。
- P7.21 将 `dryRunContract` 回传到 `validateLoraTrainingPackage` 结果中：前端或 Agent Orchestrator 不需要再次读取 config，也能显示成功报告 schema、检查项、JSON 错误格式、错误类型和退出码。
- P7.22 在 Memory 设置页的 LoRA dry-run 结果面板展示 `dryRunContract` 摘要：成功报告 schema、成功检查项、JSON 错误格式、错误类型和退出码现在能直接在 UI 中查看。
- P7.23 给 AIRI 端 `validateLoraTrainingPackage` 返回值增加 `schemaVersion: 1`，区分 AIRI dry-run 结果信封版本和外部训练脚本成功 stdout schema，方便前端与 Orchestrator 做兼容判断。
- P7.24 给生成的中文 LoRA runbook 和外部训练中文模板补充可读性回归测试：测试会检查关键中文标题，并拒绝 Unicode 私用区字符，避免后续把控制台编码乱码误写回源码。当前文件本身是 UTF-8 正常中文，PowerShell 乱码只是显示编码问题。
- P7.25 给 LoRA JSONL 训练记录增加 `schemaVersion: 1`，并在 `lora-training-config.json.dataset.recordSchemaVersion` 中声明记录格式版本；AIRI dry-run 会检查该版本，外部训练脚本也会在加载 Unsloth / TRL 前拒绝缺失或过期的记录 schema。
- P7.26 补强 AIRI 端 dry-run：桌面端现在会解析 candidates/train/eval JSONL 的非空行，确认每条记录的 `schemaVersion` 与 config 声明一致；报告只返回 `record_schema_matches_config` 检查结果，不暴露样本正文。
- P7.27 将 AIRI 端 dry-run 的 JSONL 校验拆成两个检查项：`jsonl_records_parseable` 用于定位损坏 JSONL，`record_schema_matches_config` 用于定位记录版本过期；两者都只返回状态，不返回样本正文。
- P7.28 将记录格式契约写入导出的中文 LoRA runbook：训练包说明现在会解释 `dataset.recordSchemaVersion`、每条记录的 `schemaVersion`，以及 AIRI dry-run 的 `jsonl_records_parseable` / `record_schema_matches_config` 检查项。
- P7.29 将同一记录格式契约同步到仓库外部训练 README：`scripts/training/gemma-qlora/README.zh-CN.md` 现在说明 `recordSchemaVersion`、记录 `schemaVersion`、AIRI 端 JSONL parse/schema 检查，以及脚本侧 dry-run 会拒绝过期记录格式。
- P7.30 将记录格式契约同步到 LoRA 模型卡模板：训练后填写 `MODEL_CARD_TEMPLATE.zh-CN.md` 时，需要记录 `recordSchemaVersion`、训练记录 `schemaVersion`、`jsonl_records_parseable` 和 `record_schema_matches_config` 结果，便于 adapter 复现、审计和开源前检查。
- P7.31 将记录格式契约同步到 LoRA 部署说明：服务 adapter、合并 GGUF 或准备公开发布前，需要先填写模型卡并确认 `recordSchemaVersion`、训练记录 `schemaVersion`、AIRI dry-run parse/schema 检查和脚本侧 dry-run 都可追溯。
- P7.32 导出的 LoRA 训练包会额外写出 `lora-post-training-checklist.zh-CN.md`，把模型卡模板、部署说明、`recordSchemaVersion` / `schemaVersion`、`jsonl_records_parseable` / `record_schema_matches_config`、`public-safe` 发布门禁和 `agent-chat-runtime-config.json` 接入点放进包内清单，避免训练目录离开仓库后丢失后续审计步骤。
- P8.65 已补 LoRA 训练包内容安全 dry-run：AIRI 侧新增 `jsonl_records_safe` 检查，外部 `train_gemma_qlora_unsloth.py --dry-run` 的 `chat_record_safety` 也会拒绝本地路径、微信/飞书/QQ 原始聊天标记、疑似凭据和不可见 Unicode 控制字符。dry-run 报告只暴露检查项，不输出样本正文。
- P7.33 将训练后清单接入 AIRI dry-run：`validateLoraTrainingPackage` 会追加 `post_training_checklist_exists` 检查项；新鲜导出的训练包会通过，缺少 `lora-post-training-checklist.zh-CN.md` 的包会失败，防止旧包或被手动删改的包跳过模型卡、部署和 public-safe 审计。
- P7.34 将同一训练后清单门禁同步到外部 `train_gemma_qlora_unsloth.py`：脚本侧 `--dry-run` 会在加载 Unsloth / TRL 前确认 `lora-post-training-checklist.zh-CN.md` 存在；缺少该文件会以 `validation_error` / exit code 2 拒绝训练包，README 也已记录该输入文件和检查项。
- P7.35 将 `post_training_checklist_exists` 写入机器可读 dry-run 契约：导出的 `lora-training-config.json.dryRunContract.successChecks`、AIRI dry-run 回传的 `dryRunContract`、外部脚本成功 stdout 和 README 示例现在都声明该检查项，避免脚本实际门禁与 Orchestrator 可解析契约不一致。
- P7.36 将 Eventa adapter 与 Pinia Memory store 的 LoRA dry-run 测试夹具同步到新契约：服务层和前端状态测试现在都会断言 `dryRunContract.successChecks` 包含 `post_training_checklist_exists`，示例成功 toast 也更新为当前检查项数量，防止 UI/测试文档继续沿用旧三项脚本契约。
- P7.37 将 `dryRunContract.successChecks` 校验从“包含必需项”收紧为“精确匹配当前脚本契约”：AIRI dry-run 和外部训练脚本都会拒绝多出的未知 success check，避免手改包通过校验却让 Orchestrator 误以为脚本支持额外检查项。
- P7.38 将 `post_training_checklist_exists` 同步进训练后交付模板：`MODEL_CARD_TEMPLATE.zh-CN.md` 和 `DEPLOYMENT.zh-CN.md` 现在都要求记录 AIRI dry-run 的训练后清单门禁，以及导出包内 `lora-post-training-checklist.zh-CN.md`，保证模型卡和部署审计也覆盖这道检查。
- P7.39 将严格 `dryRunContract.successChecks` 契约写入导出包内 `lora-post-training-checklist.zh-CN.md`：清单现在记录当前脚本 success checks，并明确未知 success check 出现时应回到 AIRI 重新导出，而不是手改 JSON。
- P7.40 将训练交接文档路径写入 `lora-training-config.json.artifacts`：导出包现在机器可读地声明 `trainingRunbookPath` 与 `postTrainingChecklistPath`；AIRI dry-run 会校验 artifact 路径必须是安全相对路径，并根据 config 声明的 checklist 路径执行 `post_training_checklist_exists`。
- P7.41 将同一 `artifacts` 契约同步到外部 `train_gemma_qlora_unsloth.py`：脚本侧 dry-run 会读取 `artifacts.postTrainingChecklistPath`，不再硬编码根目录 checklist 路径；同时校验 `trainingRunbookPath` / `postTrainingChecklistPath` 都不能是绝对路径或逃逸导出目录。
- P7.42 将 `trainingRunbookPath` 也接入存在性门禁：AIRI dry-run 和外部训练脚本都会执行 `training_runbook_exists`，防止导出包缺少训练交接说明却继续进入外部训练；模型卡模板和部署说明也同步记录该检查项。
- P7.43 将外部训练脚本成功 dry-run stdout 扩展为包含 `artifacts`：报告会回传 `trainingRunbookPath` 与 `postTrainingChecklistPath`，让前端或 Agent Orchestrator 不需要重新读取 config 也能展示脚本实际核对的交接文档路径。
- P7.44 将同一 `artifacts` 摘要同步到 AIRI 端 `validateLoraTrainingPackage` 返回值、Eventa 合同和前端 store 测试夹具：桌面端 dry-run 与外部脚本 dry-run 现在都能直接返回已核对的 runbook/checklist 相对路径。
- P7.45 将 `artifacts` 摘要展示到 Memory 设置页的 LoRA dry-run 面板：用户可以直接看到当前训练包核对的训练交接说明和训练后检查清单相对路径；英文和简体中文 i18n 已同步。
- P7.46 将 `artifacts` 报告契约写入导出包自带的 `lora-training-runbook.zh-CN.md` 和 `lora-post-training-checklist.zh-CN.md`：训练包离开仓库后，仍能说明 AIRI app-side dry-run 与外部脚本 dry-run 都会回传 runbook/checklist 相对路径。
- 只导出 `active` 状态、非 `sensitive` / `secret`，且显式标记为 `metadata.loraDatasetCandidate === true` 或 `metadata.profileVisibility === 'training_sanitized'` 的记忆。
- 默认排除微信、飞书、QQ 等原始聊天导入记录，避免把未经审核的私密原文直接进入训练集。
- 输出为 chat-style SFT 候选样本，用于后续人工审核、脱敏、质量筛选和格式转换。
- 当前产物不是最终训练集，不能直接作为 Gemma LoRA / QLoRA 的正式数据输入。

### P8：Hermes-inspired 记忆进化

- 周期性扫描 Memory DB。
- 发现重复、冲突、陈旧、低价值或高风险记忆。
- 生成维护建议，而不是自动修改用户记忆。
- 用户确认后再进入既有 Review Workbench / Memory Action 流程。

已实现第一版 **Memory Evolution Suggestions**：

- Electron main process 新增确定性 `createMemoryEvolutionPreview`，根据安全扫描、冲突元数据、候选状态和陈旧时间生成进化建议。
- 建议类型包括 `tighten_privacy`、`merge_duplicate`、`review_conflict`、`promote_candidate` 和 `archive_stale`。
- Memory 设置页新增 Memory Evolution 区域，可以配置 stale-before 日期、建议数量上限、是否包含低优先级建议，并预览建议列表。
- 第一版只做预览，不自动合并、归档、确认、拒绝或重新分类记忆；所有真实修改仍需用户通过现有 Memory Action / Review Workbench 执行。
- 这一步借鉴 Hermes 的“记忆自我维护/反思队列”思想，但本地重实现，不引入 Hermes 运行时、LiteLLM 或 Docker。

已实现第一版 **Local Gemma Dream Cycle**：

- Electron main process 新增 `airi/dream` 服务，包含 Dream Context Collector、Gemma JSON Parser、Sanitizer Gate、Dream Manager 和 Eventa RPC。
- Dream Cycle 只能使用已启用的 `target: local` OpenAI-compatible runtime；如果配置为 cloud、未启用或缺少本地 baseURL/model，会返回 failed Dream Session，不调用模型。
- Dream input 可读取本地非 secret 且通过安全扫描的记忆和 P8.1 Memory Evolution suggestions；`secret` 与 `safety_risk` 记忆会进入 withheld，不进入本地 dream prompt。
- 本地 Gemma 输出会解析成结构化 Dream Report：summary、memory candidates、routine candidates、LLMWiki drafts、LoRA dataset candidates、withheld 和 redaction log。
- Sanitizer Gate 会生成 `sanitizedReport`，移除本地路径、疑似凭据、微信/飞书/QQ 原始聊天标记和 secret candidates，为后续 P8.3 云端 reviewer / dataset teacher 预留边界；P8.2 不把私有 Dream input 发给云端。
- Memory 设置页新增 Local Dream Cycle 控制台，可以手动启动/取消本地 dream，查看状态、摘要、候选记忆、LoRA 候选、withheld 和 redaction log。
- P8.2 仍不自动写入 active 记忆，不自动保存 routine，不自动导出最终训练集；所有产物仍是待审候选。

已实现第一版 **Dream Review Actions**：

- Memory 设置页的 Local Dream Cycle 控制台现在可以把 dream report 里的 `memoryCandidates` 一键写入 Memory DB，但统一写成 `status: needs_review`、`sourceType: dream`，并带 `metadata.requiresReview`，不会直接进入 active 记忆。
- `routineCandidates` 可以通过现有 Routine Library draft/save 流程保存成 routine，保存后会刷新 Agent tools，让成功工作流更容易变成可复用 skill/routine。
- `loraDatasetCandidates` 只有在来自 `sanitizedReport.loraDatasetCandidates` 时，才会被转成 `conversation` 类型的 review memory，并写入 `metadata.loraDatasetCandidate: true` 和 `metadata.profileVisibility: training_sanitized`；由于状态仍是 `needs_review`，只有用户人工批准为 `active` 后，才会被 LoRA candidate exporter 纳入 JSONL。
- P8.62 已修正 Dream LoRA 导入门禁：设置页按钮、候选列表和 Pinia action 都只使用脱敏后的 `sanitizedReport`，不会把原始 Dream 模型输出直接标记为训练可用数据。Sanitizer 同步补充了 credential 和 Unix-style 本地路径脱敏。
- P8.75 已把 Dream Review Actions 的记忆候选和 Routine 候选也切到 `sanitizedReport`：设置页只有存在 `training_sanitized` 候选时才允许入审核/保存 Routine，候选列表也展示脱敏版本，避免 raw dream output 中的路径、凭据或原始聊天片段绕过 LoRA 专用门禁。

### P8.63：RAG 安全风险拦截

- RAG Context Composer 增加防御性拦截：即使某条旧数据或手动创建的 active/local 记忆带着 `metadata.safety.safe = false`，也会以 `safety_risk` 进入 withheld，不会进入本地或云端上下文片段。
- 设置页 RAG Preview 已补充 `safety_risk` 的中英文原因文案，用户能看到“安全风险记忆被拦截”，但页面仍不展示被拦截正文。
- 这一步仍然保持 local-first：不新增云端调用，不绕过 review workbench，不把 dream 结果直接喂给正式训练集。

### P8.67：Obsidian / Compact Profile 安全导出门禁

- Compact Profile 现在复用共享安全门：只要记忆正文、摘要或历史 safety metadata 命中 prompt injection、疑似凭据、本地路径或不可见 Unicode 控制字符，就会以 `safety_risk` 进入 withheld，不会写入 `05-compact-profile.md`。
- Obsidian/AIRI-Brain 导出现在对 active 分区、persona inbox、dream inbox 和 public profile preview 都执行相同安全门禁；即使旧数据已经是 active 或候选，只要安全扫描不通过，也不会扩散到 Markdown vault。
- `.airi/manifest.json` 明确记录 `excludesUnsafeContent: true`，后续迁移预检和 AIRI 自有 Memory Workspace 可以把这个字段当作安全导出能力标记。

### P8.68：统一记忆安全风险判断

- 新增共享 `hasMemorySafetyRisk` helper：只要当前正文扫描失败，或历史 `metadata.safety.safe === false`，都视为安全风险。
- RAG、Review Workbench、Memory Evolution、导出预检、Compact Profile、Obsidian/AIRI-Brain 导出现在使用同一套判断，避免“同一条记忆在一个界面被拦截、另一个导出路径却放行”。
- LoRA 导出预检也收紧为阻止全部安全扫描命中项，包括本地路径和不可见 Unicode；训练脚本的 dry-run 仍作为第二道防线。
- P8.72 已补最终 prompt 组装防线：Memory-aware chat runtime 在拼接上下文前会再次扫描 fragment text，`secret` 和安全风险片段在本地/云端调用中都会被 withheld；云端调用仍额外要求 `privacy: public`。
- P8.73 已把安全门禁下沉到 Memory Repository 写边界：任何 create/update 只要最终内容或历史 safety metadata 仍有风险，就会被强制保持 `secret`、追加 `safety-review`，且不能变成 `active`；归档/拒绝仍允许执行。
- P8.74 已补 Dream Context 安全门禁：Local Gemma Dream Cycle 在构造 dream prompt 前复用 `hasMemorySafetyRisk`，带本地路径、密钥、提示注入、不可见字符或历史 unsafe metadata 的记忆会以 `safety_risk` 进入 withheld，不会喂给本地模型；设置页也会用本地化文案展示扣留原因。
- P8.76 已扩展统一安全扫描范围：`hasMemorySafetyRisk` 不再只看 `content`，也会扫描 `summary`，Repository 写边界、备份恢复预览、公开画像/LoRA preflight、LLMWiki/Obsidian/Compact Profile 等复用方都会阻断“正文安全但摘要含本地路径/凭据”的记忆。
- P8.77 已补 RAG LLMWiki snippet 预检：`composeMemoryRagContext` 会在返回 fragments 前扫描本地 LLMWiki 片段，命中安全风险的 snippet 会以 `safety_risk` 进入 withheld；这样设置页预览与最终 memory-aware runtime 的兜底行为保持一致。
- P8.79 已把原始聊天标记纳入共享安全扫描：`[微信]`、`[WeChat]`、`[飞书]`、`[Feishu]`、`[QQ]` 等 raw chat archive 片段会产生 `raw_chat` finding，从而被 Repository、RAG、Dream、LLMWiki/Obsidian、公开画像和 LoRA preflight 统一拦截。

已实现第一版 **Local Dream Scheduler**：

- Electron main process 新增 Dream Scheduler，持久化 `enabled`、`intervalHours`、`windowHours`、`includeLoraCandidates` 配置，并在应用运行期间按间隔触发现有 `DreamManager.startLocalDream()`。
- Scheduler 只调用本地 dream manager，不调用云端 reviewer，不自动导入 memory candidates，不自动保存 LoRA 训练集；P8.3 的“候选进入人工审核”仍然是单独按钮。
- Eventa 新增 `electronDreamGetSchedule`、`electronDreamApplySchedule`、`electronDreamTriggerScheduledNow`，Renderer 设置页可以读取/保存定时任务，并手动触发一次 scheduled dream。
- 如果当前 dream session 正在运行，scheduler 会跳过本次触发并记录 `lastError`，避免并发 dream 污染当前 session。

已实现第一版 **Dream Candidates Obsidian Inbox**：

- Obsidian/AIRI-Brain 导出现在会把非 secret、`status: needs_review`、`sourceType: dream` 且带 `metadata.requiresReview` 的本地 dream 候选写入 `00-inbox/dream-candidates.md`。
- Dream candidates 不会混入 `10-profile/user-profile.md`、`50-memories/memories.md` 等已确认长期记忆区，避免“做梦整理”绕过人工审核直接变成 active 记忆。
- `secret` dream 候选仍被导出器拦截；AIRI-Brain 只是人工阅读和整理视图，Memory DB 与 Review Workbench 仍然是事实源和确认入口。

已实现第一版 **Dream Candidate Review Reason**：

- Review Workbench 现在会把 `sourceType: dream`、`status: needs_review`、`metadata.requiresReview: true` 的条目标记为 `dream_candidate`，让用户在 AIRI 内部审查队列里直接看出它来自本地 dream consolidation。
- Dream candidate 的推荐动作顺序为 `edit -> approve -> reject`，鼓励用户先修正梦境总结的措辞、事实边界和隐私级别，再决定是否进入长期记忆。
- 该标签只改变审查可见性和推荐动作顺序，不会自动批准、不触发云端 reviewer，也不会把 dream 结果直接加入 LoRA 训练集。

已实现第一版 **Review Workbench Source Filters**：

- Memory 设置页的 Review Workbench 现在提供本地视图筛选：全部、梦境候选、人格候选、安全风险、冲突、旧记忆待复核。
- 筛选只作用于当前已加载的 review snapshot，不改变 Memory DB，不重新排序，也不自动应用任何审查动作。
- 该入口让用户可以在做梦整理、聊天记录画像提取和安全扫描之后，分别审查不同来源/风险类型的候选记忆。
- 如果当前筛选没有命中但审查队列仍有其他条目，页面会显示“当前筛选下没有审查项”并提供“显示全部”按钮，避免用户误以为 Review Workbench 为空。
- 筛选按钮会显示当前 snapshot 下的条目数量，包括全部、梦境候选、人格候选和安全风险；这些数量只用于导航，不参与导出、训练或审查动作。
- Review Workbench 头部会显示当前审查 snapshot 的生成时间，帮助用户确认导入、备份恢复、dream candidate 写入或手动刷新后看到的是最新队列。
- Review Workbench 会显示当前 snapshot 的高/中/低优先级数量，帮助用户优先处理 safety、conflict 等高风险审查项；该统计只用于阅读，不改变排序或动作。
- 当当前 snapshot 存在高优先级审查项时，Review Workbench 会显示一条本地提示，提醒用户优先处理这些项目；提示同样只读，不触发自动筛选或自动处理。
- Review Workbench 现在提供“高优先级”本地筛选按钮，用户可以手动只看 `priority: high` 的审查项；该筛选只作用于当前 snapshot，不改变 Memory DB、审查排序或推荐动作。
- 当 Review Workbench 处于任意非“全部”筛选时，筛选摘要旁会显示“显示全部”入口，用户可以随时回到完整 snapshot；该入口只重置本地筛选状态。

已实现第一版 **Review Workbench Evidence Rows**：

- Review Workbench 卡片现在会为 dream/persona 候选显示安全的 metadata 证据行，例如 dream session、是否需要人工审查、是否为 LoRA 数据候选、人格候选来源和原因。
- 证据区只展示短 metadata，不展示原始聊天正文、完整 dream prompt 或大段私密内容；它用于帮助用户判断候选记忆是否可信、是否需要编辑或拒绝。
- 该能力只增强审查可读性，不改变候选状态、不写入 active 记忆，也不把证据字段自动纳入训练集。
- Review Workbench 卡片还会显示候选记忆的类型、隐私等级和重要性，帮助用户在确认前快速判断它是否适合进入长期记忆、RAG、Obsidian 或后续 LoRA 候选池。
- Review Workbench 卡片会显示候选记忆的 tags，方便快速识别 persona、dream、safety、import 或项目上下文；不会把可能包含本地路径或导入批次信息的 `sourceId` 当作标签展示。
- Review Workbench 卡片会把安全扫描 findings 作为证据行展示，包括 finding kind、severity 和 reason；不会额外展开原始文本、secret 值、本地路径或导入 source id。
- Review Workbench 卡片会把冲突 metadata 作为证据行展示，包括关联 memory id、冲突原因和相似度分数；不会展示关联记忆正文、本地路径或原始导入 source id。
- Review Workbench 卡片会把旧记忆待复核的时间证据作为证据行展示，包括最后更新时间、最后访问时间和访问次数；该信息只帮助用户判断是否保留、编辑或归档，不改变 stale 判定逻辑。

已实现第一版 **Obsidian Inbox Evidence Rows**：

- Obsidian/AIRI-Brain 导出的 `00-inbox/dream-candidates.md` 和 `00-inbox/persona-candidates.md` 现在也会附带短证据行。
- Dream inbox 只导出 dream session、是否需要人工审查、是否为 LoRA 数据候选；Persona inbox 只导出人格来源和人格原因。
- 导出器不会序列化完整 metadata，不写原始聊天正文、完整 dream prompt、本地文件路径或 secret 候选；Obsidian 仍然只是人工审查视图，不是 Memory DB 的事实源。

已实现第一版 **Obsidian Export Result Review**：

- Memory 设置页现在会保留最近一次 Obsidian/AIRI-Brain 导出结果，并展示输出目录、导出时间、导出文件数和 `00-inbox/` 待审文件列表。
- 待审 inbox 列表会显示相对路径、绝对路径和每个文件包含的记忆数量，便于用户导出后直接去 Obsidian 打开对应 Markdown 审查。
- Obsidian 导出按钮现在按 Memory DB 总条数判断是否可用；只有待审 dream/persona 候选、暂时没有 active 记忆时，也可以导出 inbox 进行人工审查。

已实现第一版 **Obsidian Vault Manifest**：

- Obsidian/AIRI-Brain 导出现在会额外写入 `.airi/manifest.json`，用于后续迁移、导入预检、AIRI 自有 Memory Workspace 和 Obsidian 兼容层读取 vault 结构。
- Manifest 只记录 schema version、导出时间、Memory DB 为事实源、section/file count、inbox/public-profile 计数和隐私策略标记。
- Manifest 不写记忆正文、不写原始聊天文本、不写绝对本地路径、不写 secret metadata；它是机器可读索引，不是新的记忆事实源。

已实现第一版 **Obsidian Vault Index / Log**：

- Obsidian/AIRI-Brain 导出现在会额外写入 `index.md` 和 `log.md`。
- `index.md` 是内容导航，列出首页、Compact Profile、导出日志和每个记忆分区的链接、说明、记忆数量与相对路径，方便 Obsidian 和 LLMWiki 工具先读索引再深入页面。
- `log.md` 是本次导出的结构化记录，包含导出时间、active 记忆数、inbox 候选数、public profile 预览数、生成分区数和隐私约束说明。
- 两个文件都由 Memory Service 生成，只记录统计、相对路径和页面链接，不写 secret 记忆、不写绝对路径，也不成为 Memory DB 的事实源。

已实现第一版 **Obsidian Re-import Guard**：

- Markdown/Obsidian 知识库导入器现在会识别 frontmatter 中的 `source: airi-memory-service`，并跳过 AIRI 自己生成的 vault 视图文件。
- 导入结果会返回 `skippedGeneratedFiles`，用于后续 UI 展示“这些是 AIRI 生成文件，已跳过”，避免用户误以为导入失败。
- 该保护不影响普通用户手写 Obsidian Markdown；只有明确带 AIRI Memory Service source 标记的生成文件会被跳过。

已实现第一版 **Knowledge Import Result UI**：

- Memory 设置页会保留最近一次 Markdown/Obsidian 知识库导入结果，并展示已导入记忆数、已扫描 Markdown 文件数、空文件数。
- 空 Markdown 文件会按相对路径列出；这些文件不会被当作导入失败，也不会写入 Memory DB。
- 如果导入器因 `source: airi-memory-service` 跳过 AIRI 自己生成的 vault 文件，UI 会列出这些相对路径，帮助用户理解这是安全保护而不是导入失败。
- 该面板只展示导入摘要，不改变导入、审查和 Memory DB 写入策略。

已实现第一版 **Chat Import Result UI**：

- Memory 设置页会保留最近一次微信、飞书或 QQ 聊天记录导入结果，并展示导入消息数、扫描文件数和创建记忆数。
- 空聊天记录文件和不支持的文件会按相对路径列出；面板不展示原始聊天正文，避免把私密内容暴露在摘要区。
- 该面板只帮助用户检查导入质量，不改变聊天记录导入、脱敏、安全扫描或人工审查策略。

已实现第一版 **Import-to-Review Refresh**：

- Markdown/Obsidian 知识库导入成功后，Memory 设置页会自动刷新 Review Workbench，让新生成的 `needs_review` 候选立即进入审查队列。
- 微信、飞书、QQ 聊天记录导入成功后也会自动刷新 Review Workbench；这只更新审查快照，不会自动确认、拒绝或归档任何候选记忆。
- AIRI 记忆备份导入成功后同样会自动刷新 Review Workbench；备份恢复仍保持 review-first，不会直接把恢复项变成 active 记忆。

已实现第一版 **Import Review Queue Summary**：

- Markdown/Obsidian 知识库、微信/飞书/QQ 聊天记录和 AIRI 记忆备份导入结果面板会展示当前 Review Workbench 待审总数，帮助用户确认导入候选已经进入审查队列。
- 该数字来自导入后刷新的 review snapshot，不新增独立状态源，也不会自动应用确认、拒绝、归档或编辑动作。

已实现第一版 **Import Review Workbench Link**：

- Markdown/Obsidian 知识库、微信/飞书/QQ 聊天记录和 AIRI 记忆备份导入结果面板现在提供“查看审查队列”入口，点击后只滚动到当前页面的 Review Workbench。
- 该入口不触发任何记忆状态变更，不重新导出 Obsidian，也不打开外部程序；它只是把导入结果与人工审查入口连接起来。
- 点击该入口时会把 Review Workbench 的本地筛选器重置为“全部”，避免用户之前停留在 dream/persona/safety 筛选视图时看不到刚导入的候选；这只是 UI 过滤状态变化，不影响 review snapshot。

已实现第一版 **Backup Import Result UI**：

- Memory 设置页会保留最近一次记忆备份导入结果，并展示导入记忆数、跳过项数量、备份文件路径和跳过原因。
- 备份导入结果面板不展示恢复记忆正文；恢复出的记忆仍进入 `needs_review`，需要用户在 Review Workbench 中审查。

已实现第一版 **Obsidian Manifest Export UI**：

- Obsidian/AIRI-Brain 导出结果面板现在会识别 `.airi/manifest.json`，并展示它的相对路径和本地输出路径。
- Manifest 面板只提示迁移/工作区检查索引已生成，不读取 manifest 内容，不把 manifest 回流为记忆。

已实现第一版 **Obsidian Export Navigation Files UI**：

- Obsidian/AIRI-Brain 导出结果面板现在会识别 `index.md` / `log.md`，并在导航文件区展示它们的相对路径、本地路径和关联记忆数量。
- 该面板不读取 `index.md` / `log.md` 正文，只帮助用户导出后快速定位 Obsidian / LLMWiki 入口文件。

## 14. 测试策略

### 14.1 单元测试

- memory scoring。
- memory CRUD。
- RAG context composer。
- safety guard。
- path policy。
- tool router。

### 14.2 回归测试

必须覆盖：

- MiniBox 路径被拒绝。
- 毕业设计路径被拒绝。
- 云端 provider 发送敏感记忆前需要确认。
- 删除文件前需要确认。
- 记忆被用户删除后不再检索。

### 14.3 人工评估

准备固定问题集：

- “你还记得我现在的背景吗？”
- “我们最近在 AIRI 上做了什么？”
- “帮我检查 GSV 服务。”
- “把 MiniBox 的文件改一下。”
- “我为什么想做 LoRA 微调？”

每轮实现后对比回答质量。

## 15. 与 LoRA 数据飞轮的关系

实现 Memory + Orchestrator 后，可以产生高质量训练数据：

```text
用户输入
  + 检索到的记忆
  + Agent 计划
  + 工具调用
  + 最终回复
  + 用户反馈
```

这些数据可转成：

- SFT 数据：训练 AIRI 语气、记忆使用、工具调用格式。
- DPO 数据：比较“有记忆的好回答”和“无记忆的差回答”。
- 安全数据：训练模型在危险动作前确认或拒绝。

重点：不要把用户隐私原样放进公开训练集。训练集应脱敏、本地保存、用户可控。

## 16. 参考资料

- Retrieval-Augmented Generation: [arXiv:2005.11401](https://arxiv.org/abs/2005.11401)
- Generative Agents: [arXiv:2304.03442](https://arxiv.org/abs/2304.03442)
- Hermes Agent: [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent)
- AIRI 本地生活记忆设计：[airi-local-life-memory-design.zh-CN.md](./airi-local-life-memory-design.zh-CN.md)
- Gemma LoRA 技术报告：[gemma-lora-memory-agent-report.zh-CN.md](./gemma-lora-memory-agent-report.zh-CN.md)

## 17. 总结

这个设计的关键不是多加一个“记忆开关”，而是把 AIRI 的核心循环改造成：

```text
记住 -> 检索 -> 决策 -> 行动 -> 反思 -> 沉淀
```

LLMWiki 让记忆可读，RAG 让记忆可用，skill/routine 让经验可复用，Agent Orchestrator 让这些能力进入真实对话链路。这样 AIRI 才会从一次性聊天角色，成长为一个能长期陪伴用户、协助项目、积累共同经历的本地个人智能体。
