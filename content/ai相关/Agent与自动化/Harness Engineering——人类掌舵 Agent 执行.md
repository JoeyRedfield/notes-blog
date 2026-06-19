---
tags:
  - ai相关
  - agent
  - harness
created: 2026-06-02
source: https://www.youtube.com/watch?v=am_oeAoUhew
speaker: Ryan Lopopolo (OpenAI)
raw: "[[Harness Engineering How to Build Software When Humans Steer, Agents Execute — Ryan Lopopolo, OpenAI]]"
---

# Harness Engineering：人类掌舵，Agent 执行

> Ryan Lopopolo，OpenAI 成员 of technical staff，9 个月完全用 Agent 编写软件，"token billionaire"（每天消耗超 10 亿 output token）。

## 一、核心命题

**代码是免费的（Code is free）**。GPT-5.2 之后，模型已经能完成软件工程师的完整工作。实现不再是稀缺资源——稀缺的是人的时间、人的注意力、模型的上下文窗口。

在这个世界里，每个工程师都是 **Staff Engineer**，管理着 5 到 5000 个 Agent"工程师"。你的角色从"写代码的人"变成了"设计系统、写 Prompt、建 Guardrails 的人"。

## 二、Harness Engineering 是什么

**Harness（驾驭层）** 是让 Agent 按照你的标准持续产出高质量代码的系统。它不是一个大而全的框架，而是一套**在正确的时刻向模型注入正确指令**的机制。

核心理念：
- 模型在训练中见过数万亿行代码，覆盖了所有可能的非功能性需求选择
- 你的工作是**指定**那些非功能性需求——写成文档，让 Agent 看到"什么是好的代码"
- 如果 Agent 没做好，不是模型不行，是你的 harness 没给够上下文

## 三、关键实践

### 3.1 用 Prompt 注入非功能性需求

不要靠人肉 code review 来反复纠正同样的问题。把"好代码的标准"写成文档，然后通过多种渠道注入给 Agent：

| 注入渠道 | 说明 |
|---------|------|
| CLAUDE.md / AGENTS.md | 项目级规则，但会被 auto-compaction 压缩掉 |
| Reviewer Agent | 每次 push 触发，以特定 persona（前端架构/可靠性/安全）审查代码 |
| Lint 即 Prompt | 自定义 ESLint 规则的**错误消息本身就是 prompt**，告诉 Agent 为什么错、怎么改 |
| 测试即约束 | 写测试来约束代码结构（如"文件不超过 350 行"），适配模型的上下文窗口 |

### 3.2 Reviewer Agent 模式

为每种 review persona 创建一个 reviewer agent，在 CI 中每次 push 时运行：

```
安全 Agent → 检查网络请求是否有 timeout + retry
可靠性 Agent → 检查错误处理是否完整
前端架构 Agent → 检查组件拆分是否合理
```

这些 reviewer 的判定标准来自团队文档，Agent 在合并前必须处理 reviewer 的反馈。但允许 Agent **自行判断接受、推迟或拒绝**反馈——不要强制处理每一条，否则 reviewer 会"霸凌"实现 Agent。

### 3.3 错误消息作为 Prompt

一个 lint 报错说 `await in loop` 是不够的。好的错误消息应该：

> "你不应该在这里有 `unknown` 类型，因为我们在边界处 parse-don't-validate，你这里一定有一个从 Zod schema 推导出来的类型。"

这本质上就是一次 prompt injection——不需要改模型权重，只需要把指令放在 Agent 会看到的地方。

### 3.4 让代码库对 Agent 友好

- **统一风格**：一个项目里做同一件事只有一种方式（一个并发工具、一种 OM、一种 CI 脚本写法）
- **包隐私**：用 monorepo 的 package 边界隔离领域，Agent 只需要看当前子树的代码
- **小文件**：文件不超过 350 行，适配上下文窗口
- **大规模重构免费**：不再有挂 6 个月的迁移——发 15 个 Agent 并行推进即可

### 3.5 工作流：从 Ticket 开始

Ryan 团队的工作方式：

1. 写 Ticket（任务块）
2. 给 Agent ticket + 若干 skills（启动应用、启动可观测性栈、连接 Chrome DevTools 等）
3. Codex 是入口点——不是把 Agent 放进开发环境，而是教 Agent **如何使用**开发环境
4. Agent 自行完成：编码 → 测试 → 自查 → 提 PR
5. Reviewer Agent 在 CI 中审查
6. 实现 Agent 处理反馈后合并

关键洞察：**每次你需要手动点"继续"，都是 harness 的失败**。好的 harness 应该让 Agent 能从 ticket 一路跑到合并。

## 四、实践策略

### 4.1 Garbage Collection Day

每周五，团队不写新功能，专门做这件事：

> 回顾这一周所有让人难受的 code review 反馈 → 找出**类别性失效** → 写文档/加 lint/加 reviewer agent 来**永久消除这一类问题**

这是一个闭环：人类反馈 → 文档化 → 自动注入 → Agent 自修复 → 人类不再需要关注这类问题。

### 4.2 从 Code Review 中抽身

1. 先让 Agent 写测试——提升你对代码的信心，也提升 Agent 导航代码库的能力
2. 观察你在哪里花时间（等 CI？等 review？写代码？）→ 逐步自动化那些环节
3. 把 review 反馈分类（前端架构/可靠性/安全）→ 每类建一个 reviewer agent
4. 让 reviewer agent 标注 P2 及以上问题 → 实现 Agent 必须处理

### 4.3 不要过度设计 Harness

Harness 唯一要做的事：**在正确的时刻给模型正确的文本**。不要一开始就加载所有规则——让 Agent 先"自由烹饪"，在 lint/test 阶段再注入约束。这种 just-in-time 的指令注入不会被模型能力提升淘汰。

### 4.4 关于 Plan 的看法

Ryan **不使用** plan mode。他认为如果你不读 plan 就批准，等于在编码一批你不想遵循的指令。如果要用 plan：把 plan 作为独立 PR 提交，经过完整人工 review 后再执行。

## 五、对个人开发者的启示

结合当前工作模式（Claude Code 主力 + AI 驱动开发），可以实践的点：

1. **把你反复在 code review 中提的意见写下来**——放进 CLAUDE.md 或项目文档
2. **为你的项目建一个 reviewer skill**——在提交前让另一个 Agent 以特定视角审查代码
3. **错误处理模式文档化**——比如"网络请求必须带 timeout+retry"，写成文档后 Agent 会遵守
4. **让 Agent 自己写测试**——提升信心，减少人工审查负担
5. **每次手动干预都是一次改进信号**——记录为什么需要干预，把解决方案固化到 harness 中

> 核心心态转变：不再是"我写代码 + AI 帮忙"，而是"我设计约束 + Agent 执行 + 我审查结果"。

## 六、关键引用

- "Code is free. It's free to produce, free to refactor."
- "Every time you have to interact with the agent is a failure of the harness."
- "Don't accept slop. You won't get slop in your codebase."
- "Models are trained to follow instructions. All the harness should do is surface instructions to the model at the right time."
- "Large scale refactoring is free. There's never going to be a migration that hangs open for six months."

## 相关笔记

- [[AI Harness（驾驭层）知识手册]] — Agent 工程第三波范式，Harness 概念的完整知识手册
- [[《12-factor-agents》]] — AI Agent 工程化的 12 个核心原则
- [[《A practical guide to building agents》学习笔记]] — Anthropic 的 Agent 构建实践指南
- [[AI Agent 自动化任务方案对比]] — Cron vs Codex vs Claude Routines 方案对比
- [[Codex 写计划、Claude Code CLI 写代码：模型与成本选型建议]] — 多模型分工实践
- [[Claude Code Skills 与 MCP 精华笔记]] — 32 个 Skills + 8 个 MCP 速查
- [[AI时代软件开发职业方向]] — AI 时代程序员的两个务实方向

> [!note]- 延伸阅读
> Ryan 团队使用 750 个 package 的 PNPM monorepo，按业务领域和栈层隔离。他用"LLM 作为模糊编译器"的比喻——代码是编译产物，prompt 和 guardrails 是编译约束和优化 pass。这些大规模架构实践对你目前阶段参考价值有限，但随着项目规模增长可回看。
