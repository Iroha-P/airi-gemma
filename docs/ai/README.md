# AIRI Gemma 记忆智能体文档索引

本文档夹采用“一份主计划 + 迁移/导入指南 + 背景附录”的结构，后续开发计划以主计划为准。

## 主计划

- [`airi-memory-agent-orchestrator-design.zh-CN.md`](./airi-memory-agent-orchestrator-design.zh-CN.md)

这是当前最新版项目计划与工程设计文档。后续关于 Memory Service、Agent Orchestrator、RAG、LLMWiki、Computer Use、多数据源导入、skill/routine、自进化记忆等内容，都优先更新到这份文档。

当前前端管理方向也以这份主计划为准：AIRI 内置管理台负责安全审查、导入、权限、梦境整理和 LoRA 数据闭环；Obsidian-compatible AIRI-Brain vault 负责人类可读的长期记忆、Markdown 整理、双链、标签和 Graph 视图。Obsidian 是可选外部编辑器与体验参考，不是 AIRI 运行时硬依赖。

- [`graduation-delivery-plan.zh-CN.md`](./graduation-delivery-plan.zh-CN.md)

一周完善与毕业后迁移计划。用于接下来把项目继续做完整：优先保证迁移设备、隐私备份、核心测试、文档表达和 LoRA/Memory/Agent 闭环，而不是为了临时汇报停止开发或硬封版。

## 迁移与备份

- [`PROJECT_SUMMARY.zh-CN.md`](./PROJECT_SUMMARY.zh-CN.md)

项目总览入口。用于快速理解 AIRI Gemma 的定位、当前完成度、技术栈、GitHub 上传策略、换电脑部署方式、尚未产生的私有资产和下一步工作。

- [`PROJECT_STATUS.zh-CN.md`](./PROJECT_STATUS.zh-CN.md)

当前工程状态、最近一次验收结果、剩余工作和迁移前优先级。后续换电脑或继续开发时，可以先读这一份快速定位项目完成度。

- [`MIGRATION.zh-CN.md`](./MIGRATION.zh-CN.md)

换电脑、重装系统或移动项目目录时使用这份迁移指南。它说明哪些内容走 Git，哪些内容需要单独备份，例如本地 Memory DB、语音模型、STT/TTS 服务配置和私有素材。配套脚本位于 `scripts/backup-airi.ps1` 与 `scripts/restore-airi.ps1`。

换设备前可以先运行 `scripts/check-airi-migration.ps1` 生成迁移预检报告，确认源码、关键文档、启动脚本、本地服务目录和基础命令环境是否齐全。

换设备或重装本地模型/语音工具时，可以再运行 `scripts/check-airi-local-services.ps1`。它会检查 Obsidian 可执行文件、GPT-SoVITS/STT 工作区、Git/Node/pnpm/Python/Ollama 命令，并可选检查 Ollama、LM Studio、GPT-SoVITS 的本地 endpoint。
导出 Obsidian-compatible AIRI-Brain vault 后，可以运行 `scripts/check-airi-obsidian-vault.ps1`，检查首页、索引、日志、compact profile、`.airi/manifest.json` 和 Obsidian 可执行文件路径是否齐全。

换设备前也可以直接运行 `scripts/collect-airi-readiness.ps1`，一次性生成迁移预检、开源隐私预检、本地服务预检、Obsidian vault 预检和汇总 JSON。
如果只想做一次不接触真实隐私数据的迁移演练，可以运行 `scripts/run-airi-migration-smoke.ps1`。它会生成脱敏样例数据并收集 readiness 报告，适合换电脑前或新电脑恢复后快速确认链路。

- [`LOCAL_MODEL_VOICE_SETUP.zh-CN.md`](./LOCAL_MODEL_VOICE_SETUP.zh-CN.md)

本地 Gemma/Ollama、OpenAI-compatible endpoint、RTX 3070 Ti 8GB 显存边界、QLoRA 可行性、GPT-SoVITS/STT/TTS 迁移和验收说明。后续换电脑或接本地模型/语音服务时优先看这一份。

- [`OPEN_SOURCE_PRIVACY_CHECKLIST.zh-CN.md`](./OPEN_SOURCE_PRIVACY_CHECKLIST.zh-CN.md)

开源、发技术报告、放 demo 截图或发布 LoRA adapter 前使用这份检查清单。配套脚本位于 `scripts/check-airi-open-source.ps1`，用于扫描公开候选文档和训练模板中的本地路径、真实画像线索、凭据词和原始聊天标记。
- [`PUBLIC_PROFILE_TEMPLATE.zh-CN.md`](./PUBLIC_PROFILE_TEMPLATE.zh-CN.md)

开源 README、demo、技术报告和公开 LoRA 样例的安全画像模板。配套脚本位于 `scripts/create-airi-public-profile-sample.ps1`，可生成不含真实隐私数据的 public profile 与 public LoRA 样例包。

如果需要生成一份可以单独打包、迁移或发给他人看的脱敏公开候选包，使用 `scripts/create-airi-public-release.ps1`。它会把公开画像模板、合成 public profile、public LoRA 样例、manifest 和开源扫描摘要放到独立目录，并在存在 blocker 时停止输出。

## 数据导入指南

- [`chat-record-export-import-guide.zh-CN.md`](./chat-record-export-import-guide.zh-CN.md)

微信、飞书、QQ、Obsidian/Markdown 等资料的导出、备份、整理和导入指南。该文档借鉴 ex-skill 的 `memory.md` / `persona.md` 思路，但目标改为构建用户专属的本地 AIRI 长期记忆与陪伴风格。

导入真实聊天记录前，可以先运行 `scripts/create-airi-sanitized-demo-data.ps1` 生成脱敏合成样例，用它测试知识库、微信、飞书和 QQ 导入流程。

## 外部系统参考

- [`hermes-memory-system-reference.zh-CN.md`](./hermes-memory-system-reference.zh-CN.md)

Hermes Agent 记忆系统的中文拆解与 AIRI 落地路线。重点说明 `MEMORY.md` / `USER.md`、有限长期记忆、memory tool、外部 memory provider、自进化 skill/routine 等设计如何服务 AIRI 的记忆治理层，而不是直接替代当前的数据导入层。

- [`llmwiki-pattern-reference.zh-CN.md`](./llmwiki-pattern-reference.zh-CN.md)

用户提供的 `llm-wiki.md` 思想整理。重点说明 LLMWiki 与传统 RAG 的区别、Raw Sources / Wiki / Schema 三层架构，以及 Ingest / Query / Lint 如何服务 AIRI 的 Obsidian-compatible 长期记忆工作区。

## 背景附录

- [`gemma-lora-memory-agent-report.zh-CN.md`](./gemma-lora-memory-agent-report.zh-CN.md)

面向学习、面试讲述和项目展示的技术报告。重点解释 LoRA 微调、长期记忆、端侧智能体、Computer Use、训练方案和面试表达。它不作为日常开发的唯一计划源。

- [`airi-local-life-memory-design.zh-CN.md`](./airi-local-life-memory-design.zh-CN.md)

面向产品想法的本地生活记忆设计稿。重点解释生活记忆、行为习惯、共同回忆、陪伴体验和隐私控制。它作为主计划中记忆系统设计的产品背景。

## 开源画像原则

项目可以开源，但用户画像必须分层处理：

- 私有画像：保存在本地 Memory DB / LLMWiki 中，用于真实陪伴、个性化和项目协助。
- 开源画像：只保留经过用户确认的公开版本，用于 README、demo、技术报告和训练样例。
- 默认策略：不公开真实聊天记录、飞书/微信原文、文件路径、账号信息、私人关系、情绪状态和生活细节。
- 发布前检查：任何导出的训练数据、demo 数据、截图和文档，都必须经过脱敏与人工确认。
