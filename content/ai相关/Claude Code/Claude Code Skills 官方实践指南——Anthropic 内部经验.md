---
title: "Claude Code Skills 官方实践指南——Anthropic 内部经验"
source: "https://claude.com/blog/lessons-from-building-claude-code-how-we-use-skills"
author: "Thariq Shihipar（Anthropic 技术团队成员，Claude Code 项目）"
published: 2026-06-03
created: 2026-06-25
updated: 2026-06-25
description: "Anthropic 内部使用数百个 skills 后总结的九大分类框架、八条制作技巧，以及分发、组合与度量方法。"
tags:
  - "claude-code"
  - "skills"
  - "agent-engineering"
  - "note"
source_type: official-mechanism
raw: "[[raw/Lessons from building Claude Code How we use skills]]"
---

# Claude Code Skills 官方实践指南——Anthropic 内部经验

> 原文：[[raw/Lessons from building Claude Code How we use skills]]

## 定位

这篇是 Anthropic Claude Code 团队官方博客，作者 Thariq Shihipar。核心价值在于：

1. **九大 skill 分类框架**——不是拍脑袋分的，是统计 Anthropic 内部数百个在用 skills 后聚类出来的
2. **八条制作技巧**——每条都来自内部高频使用后的迭代经验
3. **分发、组合与度量**——从单人 skill 到团队 marketplace 的演进路径

与 [[Claude Code Skills 与 MCP 精华笔记]] 的关系：后者是社区生态快照（有哪些 skills/MCP 可用），这篇是官方方法论（怎么做出好 skill）。

## Skills 不是"只是 markdown 文件"

常见误解：skill = 一个 SKILL.md 文件。

实际上 skill 是一个**文件夹**，可以包含：

- 脚本（scripts）
- 静态资源（assets）
- 数据文件（data）
- 配置文件（config.json）
- 动态 hooks（仅在 skill 激活时生效，会话结束后卸载）

Claude 可以探索、读取和操作这个文件夹里的所有内容。

## 九大 Skill 分类

Anthropic 统计内部所有 skills 后发现它们聚成九类。最好的 skill 干净地落在一类里；试图做太多的 skill 跨越多类，反而让 agent 困惑。

### 1. 库与 API 参考（Library and API reference）

解释如何正确使用某个库、CLI 或 SDK。通常包含参考代码片段文件夹 + 常见踩坑列表。

- `billing-lib` — 内部计费库的边界情况和坑
- `internal-platform-cli` — 内部 CLI 每个子命令的用法和场景
- `sandbox-proxy` — 配置开发环境出口网关：哪些主机可达、如何排查 "connection refused"

### 2. 产品验证（Product verification）★ 影响最大

描述如何测试或验证代码是否正常工作。常配合 Playwright、tmux 等外部工具。

**这是 Anthropic 内部对 Claude 输出质量提升最可量化的 skill 类型。** 值得花一周专门打磨验证类 skills。

技巧：让 Claude 录制操作视频、在每一步做程序化断言。

- `signup-flow-driver` — 无头浏览器跑完注册→邮箱验证→引导流程
- `checkout-verifier` — 用 Stripe 测试卡驱动结算 UI，验证发票状态
- `tmux-cli-driver` — 需要 TTY 的交互式 CLI 测试

### 3. 数据获取与分析（Data fetching and analysis）

连接数据和监控栈。包含数据获取库、仪表盘 ID、常用查询模式等。

- `funnel-query` — "哪些事件 join 能看到注册→激活→付费"，附规范 user_id 来源
- `cohort-compare` — 两队列留存/转化对比，标记统计显著差异
- `grafana` / `datadog` — 数据源 UID、集群名、问题→仪表盘对照表、字段参考

### 4. 业务流程与团队自动化（Business process and team automation）

把重复性工作流变成一条命令。通常依赖其他 skills 或 MCP。用日志文件保存历史结果有助于模型保持一致性。

- `standup-post` — 聚合工单系统 + GitHub + Slack → 格式化的差分日报
- `create-<ticket>-ticket` — 强制 schema + 创建后自动通知
- `weekly-recap` — PR + 关闭的工单 + 部署 → 格式化的周报

### 5. 代码脚手架与模板（Code scaffolding and templates）

为特定框架生成样板代码。适合有自然语言需求、不能纯靠代码模板覆盖的场景。

- `new-<framework>-workflow` — 脚手架新服务/工作流/处理器
- `new-migration` — 迁移文件模板 + 常见坑
- `create-app` — 新内部应用，预配 auth、日志、部署配置

### 6. 代码质量与审查（Code quality and review）

在组织内强制代码质量、辅助代码审查。可包含确定性脚本，适合作为 hooks 或 GitHub Action 自动运行。

- `adversarial-review` — 启动"新鲜眼睛"子 agent 批判性审查→实施修复→迭代到只剩吹毛求疵
- `code-style` — 强制执行 Claude 默认做不好的代码风格
- `testing-practices` — 如何写测试、测什么的指南

### 7. CI/CD 与部署（CI/CD and deployment）

获取、推送和部署代码。可能引用其他 skills 收集数据。

- `babysit-pr` — 监控 PR→重试 flaky CI→解决合并冲突→启用自动合并
- `deploy-<service>` — 构建→冒烟测试→渐进流量 + 错误率对比→异常自动回滚
- `cherry-pick-prod` — 隔离 worktree→cherry-pick→解决冲突→模板化 PR

### 8. 运维手册（Runbooks）

从症状（Slack 线程、告警、错误签名）出发，走多工具调查流程，产出结构化报告。

- `<service>-debugging` — 症状→工具→查询模式映射
- `oncall-runner` — 获取告警→检查常见疑点→格式化发现
- `log-correlator` — 给定 request ID，拉取所有可能接触它的系统的日志

### 9. 基础设施运维（Infrastructure operations）

例行维护和运维操作，部分涉及破坏性操作，需要护栏。让工程师在关键操作中更容易遵循最佳实践。

- `<resource>-orphans` — 找出孤儿 Pod/Volume→发 Slack→冷静期→用户确认→级联清理
- `dependency-management` — 组织级依赖审批工作流
- `cost-investigation` — "为什么存储/出口账单飙升"，含具体 bucket 和查询模式

## 制作 Skills 的八条技巧

### 1. 不要陈述显而易见的东西

Claude 已经会写代码、能读你的代码库。如果 skill 只是重述 Claude 默认会做的事，它只增加上下文成本而不增加价值。把重点放在**推动 Claude 偏离其默认思维路径**的信息上。

正面例子：[frontend-design skill](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)，通过迭代改善了 Claude 的设计品味，避免了 Inter 字体、紫色渐变等"模板化默认"。

### 2. 建立 Gotchas（踩坑）节

任何 skill 中**信号密度最高**的内容。从 Claude 使用该 skill 时的常见失败点中积累，持续更新。

示例：

- "`subscriptions` 表是 append-only 的。你要用的是 version 最高的那行，不是 `created_at` 最近的那行。"
- "这个字段在 API 网关叫 `@request_id`，在计费服务叫 `trace_id`。它们是同一个值。"
- "Staging 返回 200 即使 Stripe webhook 没有真正处理。检查 `payment_events` 获取真实状态。"

### 3. 利用文件系统和渐进式披露

Skill 是文件夹。把整个文件系统当作**上下文工程的工具**——告诉 Claude skill 里有哪些文件，它会在合适的时机读取。

最简单的渐进披露：指向其他 markdown 文件。例如把详细函数签名和用法放到 `references/api.md`。

如果最终产物是 markdown 文件，可以在 `assets/` 放一个模板让 Claude 复制使用。

### 4. 避免过度限制 Claude

Claude 会尽量遵循你的指令。因为 skills 复用性很强，**指令不要写得太死**。给足够的信息，但保留适应具体情境的灵活性。

### 5. 考虑初始化设置

有些 skills 需要用户上下文才能工作（例如发 standup 到哪个 Slack 频道）。

好的模式：在 skill 目录放一个 `config.json`。如果配置未设置，agent 可以主动询问用户。需要结构化多选题时，引导 Claude 使用 `AskUserQuestion` 工具。

### 6. 为模型写描述，不是为人写

Claude Code 启动时会构建所有可用 skill 的列表及描述。Claude 扫描这个列表来判断"有没有处理这个请求的 skill？"。所以 **description 不是摘要，是触发条件说明**。

在描述里加上触发词，比如 "babysit"、"standup"、"deploy"，帮助模型匹配。

### 7. 帮助 Claude 记住

某些 skills 可以通过内部存储数据来实现"记忆"。从简单的追加式文本日志到 SQLite 数据库都行。

例如 `standup-post` skill 维护一个 `standups.log`，记录每次发布的帖子。下次运行时 Claude 读到自己的历史，就知道昨天以来发生了什么变化。

持久化数据目录：`${CLAUDE_PLUGIN_DATA}`。

### 8. 存脚本、生成代码

给 Claude 代码是最有力的赋能之一。提供脚本和库，让 Claude 把精力花在**组合**上——决定下一步做什么——而不是重建样板代码。

例如 `data-science` skill 里提供一组获取事件数据的辅助函数，Claude 可以现场生成脚本来组合这些函数完成更复杂的分析。

### 附：使用按需 Hooks

Skills 可以包含仅在 skill 激活时生效、会话结束后卸载的 hooks。适合那些不想一直开着但偶尔极其有用的约束：

- `/careful` — 拦截 `rm -rf`、`DROP TABLE`、`force-push`、`kubectl delete`。只在你知道自己碰生产环境时用
- `/freeze` — 拦截特定目录外的所有 Edit/Write。调试时防止"不小心修了别处"

## 分发 Skills

两种方式：

| 方式 | 适用场景 |
|---|---|
| 签入仓库（`./.claude/skills`） | 小团队、跨少量仓库 |
| 插件市场（plugin marketplace） | 规模扩大后，让团队按需安装 |

注意：每个签入的 skill 都会略微增加模型上下文。规模大了之后内部插件市场更优。

## 管理 Skills 市场

Anthropic 的做法：**没有中央团队拍板**，而是有机发现。

1. 有人做了一个 skill 想让别人试 → 上传到 GitHub 的 sandbox 文件夹，在 Slack 等渠道推广
2. skill 获得足够 traction（由作者自己判断）
3. 提 PR 移入正式 marketplace

## 组合 Skills

Skills 之间可以依赖。目前没有原生的依赖管理机制，但可以让一个 skill 引用另一个 skill 的名称，模型会自动调用已安装的那个。

## 度量 Skills

用 PreToolUse hook 记录 skill 使用情况（[示例代码](https://gist.github.com/ThariqS/24defad423d701746e23dc19aace4de5)）。可以找出哪些 skills 受欢迎、哪些触发率低于预期。

## 起点建议

大多数最好的 skill 都始于几行说明和一个 gotcha，然后在 Claude 不断遇到新的边界情况时被人持续补充。**最好的入门方式就是开始做、迭代、观察什么对你有用。**

## 与现有笔记的关系

- [[Claude Code Skills 与 MCP 精华笔记]]：社区生态快照——有哪些 skills 和 MCP 可用。本页是其官方方法论补充
- [[把一本书做成 AI Skill 方法论]]：具体实操流程，可对照本页的八条技巧来优化
- [[Agent与自动化/Agentic Engineering 实战技巧集（2026年6月）]]：包含 skill 编写技巧，与本页互补

> [!note]- 延伸阅读
> - [Introduction to agent skills (Skilljar)](https://anthropic.skilljar.com/introduction-to-agent-skills)
> - [Claude Code Skills 文档](https://code.claude.com/docs/en/skills)
> - [Claude Code 插件市场文档](https://code.claude.com/docs/en/plugin-marketplaces)
> - [Persisting data in skills](https://code.claude.com/docs/en/plugins-reference#persistent-data-directory)
> - [Skill 使用统计示例代码](https://gist.github.com/ThariqS/24defad423d701746e23dc19aace4de5)
