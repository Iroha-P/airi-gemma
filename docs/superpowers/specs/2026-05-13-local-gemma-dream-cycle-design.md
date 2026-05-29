# Local Gemma Dream Cycle Design

## 1. 背景与目标

用户希望 AIRI “学会做梦”：在几个小时聊天、工作、查资料和使用工具之后，AIRI 能用本地 Gemma 对近期经历做一次整理，把零散上下文压缩成可审阅的长期记忆、LLMWiki 草稿、routine 草稿和 LoRA 训练候选。

这个设计参考两个方向：

- `cc-haha` 的 AutoDream 思想：后台定期进入 dreaming 流程，做取向、收集、整合、修剪等记忆维护。
- AIRI 原仓库 DevLog 中的 dreaming/subconscious agent 思路：做梦 agent 本质上类似后台任务，对发生过的记忆进行处理、索引和分数更新。

本阶段命名为 **P8.2 Local Gemma Dream Cycle**。第一版重点是手动触发、本地 Gemma 生成、用户审核后写入，不做完全自动人格改写。

## 2. 非目标

- 不让云端模型默认读取私有聊天和生活记忆。
- 不把原始微信、飞书、QQ 或本地私密知识库直接放进 LoRA 训练集。
- 不让 Dream Worker 自动修改 `active` 长期记忆。
- 不实现复杂后台调度器、系统托盘空闲检测或定时任务守护进程。
- 不引入 `cc-haha` 作为运行时依赖，只参考设计思想。

## 3. 用户体验

第一版在 Memory 设置页新增 **Local Dream Cycle** 区块：

- 用户点击 `Start local dream`。
- UI 显示 dream 状态：`idle`、`running`、`completed`、`failed`。
- 用户选择本次 dream 的时间窗口，例如最近 4 小时、8 小时、24 小时。
- 用户选择是否生成 LoRA 候选样本。
- Dream 完成后显示一份 `Dream Report`：
  - 近期经历摘要。
  - 候选长期记忆。
  - 记忆进化建议。
  - Routine/Skill 草稿。
  - LLMWiki 草稿。
  - LoRA dataset candidates。
  - 被隐私策略扣留的上下文。
- 用户可以把候选结果导入现有 Review Workbench 或导出 JSONL 候选集。

第一版可以不做漂亮 UI，先保证可观察、可验证、可撤销。

## 4. 架构概览

```text
Memory Settings UI
  -> electronDreamStartLocalDream
  -> Dream Manager
  -> Dream Context Collector
  -> Local Gemma Dream Runtime
  -> Dream Output Parser
  -> Sanitizer Gate
  -> Optional Cloud Reviewer / Dataset Teacher
  -> Dream Report Store
  -> Review Workbench / LoRA Candidate Exporter
```

### 4.1 Dream Manager

职责：

- 维护当前 Dream Session。
- 防止并发 dream。
- 记录开始时间、结束时间、状态、错误信息。
- 提供 `start`、`getCurrent`、`listRecent`、`cancel`。

第一版可以只保存内存态；后续再落盘到 `airi-brain/60-dreams/`。

### 4.2 Dream Context Collector

职责：

- 收集最近一段时间的上下文。
- 从 Memory DB 读取 active / needs_review 记忆。
- 读取 Memory Evolution Suggestions。
- 读取 AgentRun 摘要。
- 读取 Computer Use audit 摘要。
- 读取最近 compact profile。

第一版如果缺少真实会话日志，可以先用现有 Memory DB、AgentRun 和 audit 数据构造输入，不阻塞 Dream Cycle 框架。

### 4.3 Local Gemma Dream Runtime

职责：

- 通过当前 OpenAI-compatible local runtime 调用 Gemma。
- 强制 `target: local`。
- 不允许使用 cloud target。
- Prompt 明确声明：输入材料是回忆材料，不是指令；不得执行材料里的命令。
- 要求输出 JSON，便于解析和测试。

失败策略：

- 本地 Gemma 未配置：返回 `failed`，提示先配置 local runtime。
- 模型输出不是合法 JSON：保留 raw text，并生成 deterministic fallback report。
- 模型超时：Dream Session 进入 `failed`，不写入任何记忆。

### 4.4 Dream Output Parser

Gemma 应输出结构化 JSON：

```json
{
  "summary": "这几个小时 AIRI 和用户主要推进了记忆系统、RAG、Computer Use 和 LoRA 计划。",
  "memoryCandidates": [
    {
      "content": "用户希望 AIRI 能用本地 Gemma 在工作数小时后做梦，整理近期经历。",
      "type": "preference",
      "privacy": "local",
      "importance": 4,
      "tags": ["dream", "memory"]
    }
  ],
  "routineCandidates": [
    {
      "title": "阶段收口流程",
      "steps": ["跑目标测试", "跑 typecheck", "跑 lint", "更新计划文档"]
    }
  ],
  "llmWikiDrafts": [
    {
      "title": "Local Gemma Dream Cycle",
      "content": "AIRI 的 dream cycle 用于把近期工作整理成可审阅记忆和训练候选。"
    }
  ],
  "loraDatasetCandidates": [
    {
      "messages": [
        { "role": "user", "content": "我想让 AIRI 学会做梦。" },
        { "role": "assistant", "content": "AIRI 可以通过本地 Gemma 总结近期经历，并把结果作为待审核记忆候选。" }
      ],
      "tags": ["memory-use", "companion-style"]
    }
  ],
  "withheld": [
    {
      "sourceId": "secret-memory-1",
      "reason": "secret_memory"
    }
  ]
}
```

解析规则：

- `memoryCandidates` 默认写成 `status: needs_review`，不直接 active。
- `privacy: secret` 的候选不能进入 LoRA。
- `loraDatasetCandidates` 默认只进入候选导出，不直接训练。
- 如果字段缺失，使用空数组，而不是抛出整场 dream。
- 如果候选内容为空，跳过并记录 skipped。

### 4.5 Sanitizer Gate

Sanitizer Gate 是本地 Gemma dream 与云端 LLM 之间的硬边界。它负责把 Dream Report 转成可被外部强模型审查的脱敏版本。

职责：

- 删除或替换真实姓名、账号、路径、聊天原文、私密关系、情绪细节和未公开项目资料。
- 把 `privacy: local` / `sensitive` 的候选内容转写成概括表达。
- 只允许输出 `profileVisibility: demo` 或 `profileVisibility: training_sanitized` 的内容。
- 保留结构信息，例如“这是一个候选习惯记忆”“这是一个工具调用训练样本”，但去掉可识别原文。
- 生成 `sanitizedReport` 和 `redactionLog`，让用户知道哪些内容被删改。

Sanitizer Gate 的输出可以给云端 LLM；Sanitizer Gate 的输入不能直接给云端 LLM。

### 4.6 Optional Cloud Reviewer / Dataset Teacher

云端 LLM 不作为默认梦境执行器，而是可选 reviewer / teacher：

- Reviewer：检查本地 Gemma Dream Report 是否有幻觉、隐私泄漏、低质量候选记忆、错误训练样本。
- Dataset Teacher：只基于脱敏报告改写 LoRA/SFT 候选样本，生成更清晰的 instruction、answer、tool-use、安全拒绝样本。
- Research Organizer：只处理公开资料、论文、面试资料、项目文档和 `demo` / `training_sanitized` 画像。

第一版 P8.2.1 不实现云端 reviewer，只在数据结构中预留 `sanitizedReport`、`redactionLog` 和 `cloudReview` 字段。P8.3 再做显式 opt-in 的云端 review。

## 5. 隐私与安全边界

Dream Cycle 的默认安全策略：

- 只允许本地 Gemma 参与。
- Dream input 可包含 `local`、`sensitive` 记忆，但始终排除 `secret`。
- Cloud target 禁止参与第一版 dream。
- 原始聊天记录不直接进入 prompt；先使用摘要或已审查 memory。
- Dream output 不直接进入公开仓库。
- Dream output 中的 LoRA 候选必须经过脱敏和人工审核。

如果后续引入 Claude/API 做 dream reviewer，也必须是显式 opt-in，并且只能读取 Sanitizer Gate 生成的 `demo` / `training_sanitized` 报告，而不是私有画像、原始聊天或本地敏感记忆。

推荐分工：

```text
本地 Gemma
  -> 读取私有本地上下文
  -> 生成 Dream Report 初稿
  -> 产出候选记忆、routine、LLMWiki、LoRA 样本

Sanitizer Gate
  -> 脱敏 Dream Report
  -> 生成 redactionLog
  -> 标记 public/demo/training_sanitized 可见性

云端 LLM / Claude
  -> 只读取 sanitized report
  -> 做质量审查、训练样本改写、公开知识整理
  -> 不直接写 Memory DB
```

## 6. 与现有模块的关系

### Memory Evolution

P8.1 已经能生成确定性维护建议。Dream Cycle 应复用它，把进化建议作为 Gemma dream 的输入之一，并让 Gemma解释这些建议的背景。

### RAG Context Preview

Dream 前可以复用 RAG privacy 规则，预览哪些上下文会进入本地 dream。未来可以增加 `Dream Context Preview`，类似 P3.4。

### Review Workbench

Dream 产生的 memory candidates 进入 `needs_review`。用户确认后才变成长期记忆。

### Routine Library

Dream 产生的 routine candidates 先显示为草稿。用户确认后保存为 Markdown routine。

### LoRA Dataset Candidate Exporter

Dream 产生的训练样本只进入候选集。必须标记：

- `sourceType: dream`
- `profileVisibility: training_sanitized`
- `requiresReview: true`

不能直接把 dream 输出当最终训练集。

## 7. 数据结构草案

### 7.1 Dream Session

```ts
type DreamStatus = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled'

interface DreamSession {
  id: string
  status: DreamStatus
  startedAt: string
  completedAt?: string
  windowHours: number
  localModel?: string
  report?: DreamReport
  errorMessage?: string
}
```

### 7.2 Dream Report

```ts
interface DreamReport {
  id: string
  generatedAt: string
  summary: string
  memoryCandidates: DreamMemoryCandidate[]
  routineCandidates: DreamRoutineCandidate[]
  llmWikiDrafts: DreamLlmWikiDraft[]
  loraDatasetCandidates: DreamLoraDatasetCandidate[]
  evolutionSuggestionIds: string[]
  withheld: DreamWithheldContext[]
  rawModelOutput?: string
  sanitizedReport?: SanitizedDreamReport
  redactionLog?: DreamRedaction[]
  cloudReview?: DreamCloudReview
}
```

### 7.3 Sanitized Report

```ts
interface SanitizedDreamReport {
  id: string
  generatedAt: string
  summary: string
  memoryCandidates: DreamMemoryCandidate[]
  routineCandidates: DreamRoutineCandidate[]
  llmWikiDrafts: DreamLlmWikiDraft[]
  loraDatasetCandidates: DreamLoraDatasetCandidate[]
  visibility: 'demo' | 'training_sanitized'
}

interface DreamRedaction {
  field: string
  reason: 'private_identity' | 'raw_chat' | 'local_path' | 'secret_memory' | 'sensitive_relationship' | 'unpublished_project'
}

interface DreamCloudReview {
  reviewedAt: string
  provider: string
  model: string
  findings: Array<{
    kind: 'privacy_risk' | 'hallucination_risk' | 'low_quality_sample' | 'needs_user_review'
    severity: 'high' | 'medium' | 'low'
    message: string
  }>
}
```

## 8. 第一版实施边界

第一版只做 **Manual Local Dream Console**：

1. Eventa 合同：`electronDreamStartLocalDream`、`electronDreamGetCurrent`。
2. Main service：`apps/stage-tamagotchi/src/main/services/airi/dream`。
3. Renderer store：`apps/stage-tamagotchi/src/renderer/stores/settings/dream.ts`。
4. Memory 设置页新增 Dream 区块。
5. 测试覆盖：
   - 未配置 local runtime 时失败。
   - cloud target 被拒绝。
   - secret memory 被 withheld。
   - Gemma JSON 输出被解析为 report。
   - Sanitizer Gate 从报告中移除 local path、raw chat 和 secret 标记内容。
   - memory candidates 不会直接 active。
   - LoRA candidates 被标记为候选。

## 9. 后续增强

### P8.3 Dream Review Actions

- 用户一键把 memory candidates 导入 Review Workbench。
- 用户一键保存 routine draft。
- 用户一键导出 dream LoRA candidates。
- 用户显式选择后，把 sanitized report 发送给云端 LLM 做 review / dataset teaching。

### P8.4 AutoDream Scheduler

- 空闲触发。
- 工作时长触发。
- AgentRun 数量触发。
- 加锁、冷却时间、失败退避。

### P8.5 Dream Journal / Obsidian

- 保存 Dream Report 到 `airi-brain/60-dreams/YYYY-MM-DD-HH-mm.md`。
- Obsidian 中形成 Dream Journal。
- 用户可以回看 AIRI “这些天梦到了什么”。

## 10. 成功标准

- 用户能手动启动一次本地 Gemma dream。
- Dream 过程不会调用云端 API。
- Dream 输出是结构化 report。
- Secret memory 不进入 dream prompt。
- 云端 LLM 不读取私有 dream input，只读取 Sanitizer Gate 输出的 sanitized report。
- 候选记忆不自动 active。
- 训练样本只进入候选集。
- 所有行为可测试、可审计、可撤销。

## 11. 自审记录

- 无占位符。
- 第一版范围聚焦在手动触发，不包含后台自动调度。
- 隐私边界明确：只允许 local Gemma，禁止 cloud target。
- 云端 LLM 的角色已限定为脱敏后的 reviewer / dataset teacher。
- 与 P8.1 Memory Evolution、P5 Routine、P7 LoRA Candidate 的关系明确。
