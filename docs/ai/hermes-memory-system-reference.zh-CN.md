# Hermes 记忆系统参考与 AIRI 落地方案

本文用于说明 Nous Research 的 [Hermes Agent](https://github.com/NousResearch/hermes-agent) 记忆系统中哪些设计值得 AIRI 借鉴，以及如何把它落到当前 `airi-gemma` 项目里。

结论先行：Hermes 不适合被 AIRI 整体照搬，但它的“有限长期记忆 + 会话搜索 + 外部记忆 Provider + 自我改进 Skill”的组合，非常适合指导 AIRI 的下一阶段记忆治理设计。

## 1. 当前 AIRI 所处阶段

AIRI 目前主要在做第一层：数据源导入。

已经落地或正在落地的部分：

- 本地 Memory Service：PGlite 存储长期记忆。
- 待确认记忆：导入内容默认进入 `needs_review`。
- 记忆来源：`manual`、`chat_turn`、`import_wechat`、`import_lark`、`import_qq`、`knowledge_base`、`llmwiki`。
- Markdown / Obsidian 知识库导入：扫描 `.md` 文件，提取标题、tags 和正文。
- LLMWiki 导出与检索：把长期记忆导出为 Markdown 页面，并在聊天前做轻量 RAG 注入。
- 访问追踪：聊天真正使用某条记忆时，更新 `accessCount` 和 `lastAccessedAt`。

Hermes 参考主要属于第二层和第三层：

```text
第一层：数据源导入
微信 / 飞书 / QQ / Obsidian -> 待确认记忆

第二层：记忆治理
待确认记忆 -> 去重 -> 合并 -> 分级 -> 用户确认 -> 长期记忆

第三层：自进化记忆
长期记忆 -> 用户画像 / AIRI 自我经验 / 技能 / 纠错 / 压缩
```

## 2. Hermes 记忆系统核心设计

### 2.1 双文件长期记忆

Hermes 的内置长期记忆由两个文件组成：

- `MEMORY.md`：agent 自己的环境事实、项目约定、工具经验、做事教训。
- `USER.md`：用户画像、沟通偏好、工作习惯、期望和身份信息。

官方文档说明，这两个文件会存放在 `~/.hermes/memories/`，并在会话开始时注入系统提示词。

AIRI 可对应为：

```text
AIRI_MEMORY.md   AIRI 自己的经验、项目事实、桌面环境、工具使用经验
USER_PROFILE.md  用户画像、偏好、生活习惯、沟通方式、长期目标
```

注意：AIRI 不应该只靠两个 Markdown 文件存储全部记忆。更合理的是：

- PGlite 作为真实数据库。
- LLMWiki / Markdown 作为可读导出层。
- `AIRI_MEMORY.md` 和 `USER_PROFILE.md` 作为高密度摘要层。

### 2.2 有容量上限的长期记忆

Hermes 的内置记忆有明确字符限制：`MEMORY.md` 约 2200 字符，`USER.md` 约 1375 字符。容量限制的作用不是省空间，而是迫使 agent 只保留高价值、密度高、长期有效的信息。

AIRI 应该借鉴这个思想，但不必照搬字符数。

建议：

```text
USER_PROFILE_SUMMARY      1500-3000 中文字
AIRI_MEMORY_SUMMARY       1500-3000 中文字
PROJECT_CONTEXT_SUMMARY   每项目 1000-2000 中文字
RAW_MEMORY_DB             不设很小上限，但必须检索使用
```

也就是说：

- 原始记忆可以很多，但不能全部塞进 prompt。
- 每轮对话只注入有限摘要 + 检索命中的少量片段。
- 超过阈值时触发合并、降权、归档。

### 2.3 冻结快照注入

Hermes 会在会话开始时把记忆作为“冻结快照”注入。会话中新增或修改的记忆会立即持久化，但不会马上改变当前系统提示词，通常要到下一次会话才进入固定记忆区。

这个设计的优点：

- 稳定，不会让同一轮长会话中的系统上下文频繁变化。
- 对 prefix cache 更友好。
- 记忆工具的结果仍可展示当前实时状态。

AIRI 可以采用类似策略：

```text
会话开始：
  加载 USER_PROFILE_SUMMARY + AIRI_MEMORY_SUMMARY

每轮消息前：
  RAG 检索 active 记忆和 LLMWiki 片段

会话结束或空闲时：
  总结新事实 -> needs_review / active candidate
  更新 profile summary 的候选版本
```

### 2.4 记忆工具化

Hermes 的 memory tool 主要提供：

- `add`：增加记忆。
- `replace`：替换旧记忆。
- `remove`：删除旧记忆。

它没有 `read` 动作，因为记忆会自动注入到系统提示词。

AIRI 应该扩展成更适合陪伴和本地助理的工具动作：

```text
memory.add_candidate     添加待确认记忆
memory.approve           用户确认
memory.reject            用户拒绝
memory.replace           合并/替换旧记忆
memory.archive           归档低价值记忆
memory.delete            删除敏感或错误记忆
memory.reclassify        修改隐私等级/类型/重要性
memory.search            检索长期记忆
memory.explain_usage     解释为什么使用了某条记忆
```

其中 `approve / reject / explain_usage` 对 AIRI 特别重要，因为它是陪伴型产品，用户必须知道 AIRI 为什么记得、怎么记得。

### 2.5 保存什么，跳过什么

Hermes 文档中明确区分了应保存和应跳过的内容。

可保存：

- 用户偏好。
- 环境事实。
- 项目约定。
- 工具使用经验。
- 明确的“请记住”请求。
- 纠正信息。

应跳过：

- 太模糊的信息。
- 容易重新搜索到的事实。
- 大段原始日志、表格、数据。
- 一次性的临时上下文。
- 已经在上下文文件里的内容。

AIRI 应该改写为：

可保存：

- 用户长期身份与目标，例如“FDU 智能机器人与先进制造创新学院学生，正在转码”。
- 用户明确偏好，例如“喜欢中文解释和能听懂的技术文档”。
- 长期项目，例如 `airi-gemma` 的目标、技术路线和迁移策略。
- 生活习惯和陪伴偏好，但必须用户确认。
- 用户纠错，例如“这不是我的真实偏好，不要再这样记”。

应跳过：

- 大段微信/QQ/飞书原文。
- 他人的隐私信息。
- 临时情绪。
- 未确认的关系推断。
- 可能伤害用户或第三方的敏感画像。
- 可以通过文档或网页重新查到的公共事实。

### 2.6 重复与容量治理

Hermes 会拒绝精确重复，并在容量接近上限时要求 agent 合并或替换旧记忆。

AIRI 目前已经有相似度去重的雏形，后续应升级为四层治理：

```text
精确重复：直接跳过
语义近似：合并为同一条候选
事实冲突：进入冲突待确认
低价值旧记忆：降权或归档
```

示例：

```text
旧记忆：用户本科是土木工程。
新记忆：用户大学专业是土木，现在在复旦相关学院读机器人方向。

处理：replace/merge
结果：用户本科背景为土木工程，目前在 FDU 智能机器人与先进制造创新学院学习，正在转码 AI/算法方向。
```

### 2.7 安全扫描

Hermes 会对记忆条目做安全扫描，阻止 prompt injection、凭证外泄、不可见 Unicode 等危险内容进入系统提示词。

AIRI 需要这一步，尤其是导入聊天记录和知识库后。

建议 P0 安全规则：

- 检测 API key、token、密码、私钥。
- 检测“忽略之前指令”“泄露系统提示词”等 prompt injection 片段。
- 检测大量不可见字符。
- 检测他人手机号、身份证、地址等隐私信息。
- 对高风险内容标记为 `secret` 或阻止导入。

## 3. Hermes Memory Providers 对 AIRI 的启发

Hermes 支持外部 memory provider。官方文档说明，外部 provider 是附加层：内置 `MEMORY.md / USER.md` 仍然存在，外部 provider 负责更多跨会话知识、搜索和建模。

Hermes 的外部 provider 会做几类事：

- 把 provider context 注入系统提示词。
- 每轮对话前预取相关记忆。
- 每轮对话后同步消息。
- 会话结束时抽取记忆。
- 镜像内置记忆写入。
- 提供搜索、存储、管理工具。

AIRI 可以借鉴为本地优先的 provider 架构：

```text
MemoryProvider
├─ PGliteMemoryProvider       默认本地长期记忆
├─ LLMWikiProvider            Markdown 可读知识库
├─ ObsidianProvider           本地 vault
├─ ChatArchiveProvider        微信/飞书/QQ 历史检索
├─ VectorProvider             后续向量检索
└─ ExternalProvider           可选 Honcho/Mem0/GBrain 等
```

当前阶段不必接 Honcho、Mem0。先把本地 provider 抽象打稳。

## 4. Hermes 与 ex-skill 的分工

ex-skill 更像“资料整理器”：

```text
原始聊天 / 照片 / 口述 -> memory.md / persona.md / correction.md
```

Hermes 更像“长期记忆治理系统”：

```text
会话经验 -> 添加/替换/删除长期记忆 -> 搜索历史 -> 生成技能 -> 自我改进
```

AIRI 应该这样组合：

```text
ex-skill 思路：
  用于把微信/QQ/飞书/Obsidian 导出资料整理成人可读画像文档。

Hermes 思路：
  用于决定这些画像如何进入长期记忆、如何压缩、如何更新、如何检索、如何纠错。
```

## 5. AIRI 目标架构

### 5.1 分层架构

```text
Data Sources
  WeChat / Lark / QQ / Obsidian / Markdown / Manual Input

Ingestion Layer
  parser -> normalized entries -> memory.ingest

Review Layer
  needs_review -> approve / reject / reclassify

Memory Store
  PGlite raw memories
  LLMWiki markdown export
  optional vector index

Governance Layer
  dedupe / merge / conflict / privacy / safety / decay

Context Layer
  USER_PROFILE_SUMMARY
  AIRI_MEMORY_SUMMARY
  RAG snippets

Self-evolution Layer
  corrections
  routines
  skills
  behavior policy updates
```

### 5.2 记忆类型建议

当前已有：

```text
profile
preference
project
event
conversation
habit
knowledge
note
```

建议后续增加或用 metadata 表示：

```text
correction       用户纠错
boundary         禁忌、边界、不要做什么
routine          用户习惯流程
skill_seed       可沉淀为 skill 的经验
relationship     人际关系摘要，默认 sensitive
life_event        重要生活事件，默认 sensitive
```

### 5.3 隐私分级

当前已有：

```text
public
local
sensitive
secret
```

建议使用规则：

- `public`：可用于 demo、开源样例、脱敏训练。
- `local`：普通本地个性化事实。
- `sensitive`：聊天、关系、生活、身份、求职等私密内容。
- `secret`：账号、密钥、极私密内容，默认不进入 prompt。

## 6. 自进化记忆流程

### 6.1 每轮对话结束

```text
1. 判断本轮是否产生长期价值
2. 抽取候选记忆
3. 检查重复和冲突
4. 标记 privacy / type / importance
5. 写入 needs_review
```

### 6.2 用户确认后

```text
1. 变为 active
2. 可被 RAG 检索
3. 可进入 LLMWiki 导出
4. 可参与 USER_PROFILE_SUMMARY 更新
```

### 6.3 空闲或会话结束时

```text
1. 汇总本会话新记忆
2. 更新短摘要
3. 判断是否需要合并 profile
4. 生成可审查 diff
5. 用户确认后替换摘要
```

### 6.4 用户纠错时

```text
用户：不是这样，我不是不喜欢数学，我是讨厌没有例子的抽象解释。

AIRI：
1. 找到相关旧记忆
2. 写入 correction
3. 替换旧偏好
4. 降权/归档错误记忆
5. 后续回答引用新偏好
```

## 7. 当前项目落地路线

### P0：导入与审查

已完成或正在进行：

- `memory.ingest` 标准入口。
- `knowledge_base` Markdown 导入。
- `import_wechat / import_lark / import_qq` 来源类型。
- 设置页记忆审查与确认。

下一步：

- 微信/QQ/飞书解析器先支持小样本。
- 导入后显示来源、文件、时间范围。
- 支持批量确认/拒绝。

### P1：Hermes 式治理工具

实现：

```text
memory.replace
memory.archive
memory.reclassify
memory.explain_usage
memory.detect_conflict
memory.compact_profile
```

同时把当前设置页从 CRUD 升级为“记忆审查工作台”。

### P2：摘要层

实现：

```text
USER_PROFILE_SUMMARY
AIRI_MEMORY_SUMMARY
PROJECT_CONTEXT_SUMMARY
```

这些摘要不替代 PGlite，而是作为 prompt 中的高密度长期记忆。

当前 AIRI 已实现第一版 `ProfileCompactor`：它会从已确认、非 secret 的 Memory DB 条目生成确定性的 compact profile，按用户画像、偏好、习惯、边界、项目和知识分组。v1 不调用 LLM，避免在记忆治理早期引入不可测试的总结漂移；后续可以在这个稳定输出之上加入 LLM 辅助摘要和用户审查。

### P3：安全扫描

实现：

- secret/token 检测。
- prompt injection 检测。
- 第三方隐私检测。
- 导入前风险报告。

当前 AIRI 已实现第一版 `PromptInjectionScanner` 思路：导入链路会扫描 prompt injection、疑似凭据和不可见 Unicode。高风险条目保留给用户审查，但会被强制降级为 `secret + needs_review + safety-review`，因此不会直接进入 RAG、LLMWiki、Obsidian vault 或 LoRA 数据候选。

### P4：自进化 Skill / Routine

借鉴 Hermes 的 skill 自改进思路，但 AIRI 要更保守：

- 先生成 skill candidate。
- 用户确认后启用。
- 每个 skill 有来源、用途、风险和回滚。

## 8. 不能照搬 Hermes 的地方

### 8.1 不照搬容量数值

Hermes 的 2200/1375 字符限制适合 CLI agent。AIRI 是桌面陪伴 + 本地助理，记忆类型更多，中文信息密度也不同，应使用更灵活的 token/字符预算。

### 8.2 不照搬云端 provider 默认思路

AIRI 的定位是本地优先。外部 provider 可以可选，但默认必须能完全离线运行。

### 8.3 不照搬自动保存强度

Hermes 更偏工程 agent，主动保存项目事实是合理的。AIRI 涉及生活、聊天、关系、情绪，自动保存必须更谨慎。

### 8.4 不照搬“没有 read action”

Hermes 没有 memory read，因为会话开始时已注入。AIRI 需要 UI 可观察性，所以必须有查询、解释、审查视图。

## 9. 与 LoRA 微调的关系

Hermes 式记忆系统不是 LoRA 的替代，而是 LoRA 前的数据治理层。

推荐顺序：

```text
聊天记录 / 知识库
  -> 导入待确认记忆
  -> 用户审核
  -> 生成 USER_PROFILE / AIRI_PERSONA / corrections
  -> 脱敏
  -> 构造训练样本
  -> LoRA SFT / DPO
```

不要直接用原始微信/QQ/飞书聊天记录做 LoRA。

## 10. 推荐下一步

下一步可以把 Hermes 设计转成工程任务：

```text
P1.1 MemoryAction API
P1.2 MemoryConflictDetector
P1.3 ProfileCompactor
P1.4 CorrectionMemory
P1.5 PromptInjectionScanner
P1.6 MemoryReviewWorkbench
```

当前 AIRI 已实现第一版 `MemoryReviewWorkbench`：它会读取 Memory DB，生成只读审查队列，覆盖待确认候选、冲突、安全风险和过旧 active 记忆。这个工作台不直接修改记忆，而是为设置页和后续自进化流程提供“为什么需要审查、建议怎么处理”的解释层。

其中最优先的是：

```text
MemoryAction API + CorrectionMemory
```

因为它们能让 AIRI 从“会存东西”升级到“会被纠正、会改记忆、会解释记忆”。

## 11. 参考资料

- Hermes Agent GitHub：<https://github.com/NousResearch/hermes-agent>
- Hermes Persistent Memory：<https://hermes-agent.nousresearch.com/docs/user-guide/features/memory/>
- Hermes Memory Providers：<https://hermes-agent.nousresearch.com/docs/user-guide/features/memory-providers/>
- Hermes Skills：<https://hermes-agent.nousresearch.com/docs/skills>
