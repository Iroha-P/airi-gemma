# AIRI Gemma 开源发布隐私检查清单

> 目的：把“私有陪伴项目”和“可公开展示项目”分开。开源代码可以公开，真实用户画像、聊天记录、生活细节和本地路径默认不能公开。

## 1. 发布前先跑脚本

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-airi-open-source.ps1
```

如果要保存报告：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-airi-open-source.ps1 `
  -OutputPath D:\AIRI-Backup\open-source-check.json
```

如果需要先生成一份安全的公开画像样例包：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\create-airi-public-profile-sample.ps1 `
  -OutputDir D:\AIRI-Backup\public-profile-sample
```

如果需要生成一份可以单独交付的脱敏公开候选包：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\create-airi-public-release.ps1 `
  -OutputDir D:\AIRI-Backup\airi-public-release `
  -Force
```

公开候选包会包含 README、公开画像模板、合成 public profile、public LoRA 样例、manifest 和开源扫描摘要。脚本会先运行开源扫描；只要发现 blocker，就不会把该目录标记为可发布。

脚本会扫描 `docs/ai`、`scripts/training`、根目录 README 等公开候选内容，并输出：

- `releaseReady`：没有 blocker 时为 `true`。
- `blockerCount`：必须处理的风险数量。
- `warningCount`：需要人工确认的风险数量。
- `findings`：包含规则、文件、行号和片段。

脚本是发布前预检，不是最终安全保证。它能发现常见风险，但真实发布前仍然要人工通读 README、技术报告、demo 数据、截图和训练样例。

## 2. 绝对不能开源的内容

- 真实微信、飞书、QQ 聊天原文。
- 真实姓名、手机号、邮箱、账号、学号、身份证、微信号、QQ 号。
- 未脱敏的学校/导师/同学/朋友/家人关系细节。
- 本地绝对路径，例如 `C:\Users\...`、`F:\project\...`。
- API key、token、password、cookie、私有仓库链接。
- Memory DB、PGlite 数据目录、Obsidian 私有 vault、AIRI userData。
- 任何 `privacy: sensitive`、`privacy: secret`、`needs_review` 的导出数据。

## 3. 可以公开的内容

- 架构设计、模块边界、测试策略、迁移方法。
- 脱敏后的公开画像，例如“用户是从非计算机背景转向 AI Agent 方向的学生，正在构建本地优先的个人智能体”。
- `docs/ai/PUBLIC_PROFILE_TEMPLATE.zh-CN.md` 或 `scripts/create-airi-public-profile-sample.ps1` 生成的合成公开画像样例。
- 手写的合成 demo 数据。
- 经过 `training_sanitized` 标记、preflight 通过、人工确认过的 LoRA 样例。
- 不含真实路径和账号的脚本模板、模型卡模板、运行说明。

## 4. 开源画像改写规则

私有画像可以很细，开源画像必须抽象。

| 私有表达 | 开源表达 |
| --- | --- |
| 具体学校、学院、专业、转码细节 | 非计算机背景的 AI/机器人方向学生 |
| 具体聊天记录和情绪状态 | 用户希望本地智能体能长期陪伴、总结和回忆 |
| 具体电脑路径、工具账号、文件名 | 本地知识库、聊天记录导出、桌面端数据 |
| 具体朋友/同学/导师关系 | 私人人际关系信息 |

## 5. LoRA 和 demo 数据发布规则

LoRA 可以训练本地专攻模型，但不要让模型参数记住隐私。

发布 adapter、训练数据或 demo 前必须确认：

- 数据来自 `public` 或 `training_sanitized` 画像。
- 没有原始聊天记录。
- 没有本地路径、账号、凭据、第三方个人信息。
- `scripts/training/gemma-qlora` 的 preflight 通过。
- 模型卡写明数据来源、隐私门禁、局限性和禁止用途。

## 6. 推荐发布顺序

1. 先提交或完整备份当前工作区。
2. 跑迁移预检：`scripts/check-airi-migration.ps1`。
3. 跑开源预检：`scripts/check-airi-open-source.ps1`。
4. 按 `findings` 删除或改写 blocker。
5. 人工通读 README、`docs/ai`、训练脚本模板和 demo 数据。
6. 用一个全新的临时目录 clone/解压项目，确认没有私有 userData 或 Memory DB。
7. 再发布公开仓库、技术报告或 demo 截图。

## 7. 当前建议

这个项目目前适合继续私有开发和迁移，不建议立刻原样开源。原因是文档里保留了真实研究背景、路径和聊天记录导入设计说明。开源前应该先生成一套单独的 public 分支或 release 包，只保留脱敏画像、合成样例和可公开技术说明。
