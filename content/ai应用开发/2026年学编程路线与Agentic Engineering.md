---
tags: [ai应用开发, agentic-engineering, learning]
created: 2026-06-02
source: "[[raw/How To Learn To Code In 2026]]"
raw: "[[raw/How To Learn To Code In 2026]]"
---

# 2026 年学编程路线与 Agentic Engineering

> 来源：Tina Huang（前 Meta 数据科学家）YouTube 视频 [[How To Learn To Code In 2026]]，2026 年 3 月发布。

## 核心概念：从 Vibe Coding 到 Agentic Engineering

**Vibe Coding**（Karpathy，2025.02）：完全交给 AI，凭感觉写代码，"忘了代码存在"。适合一次性周末项目，但不严肃。

**Agentic Engineering**（Karpathy，2026.02）：专业人员使用 LLM Agent 编程已成为默认工作流，但与 vibe coding 不同的是有更多**监督和审查**。你在终端/IDE 中编排多个 AI Agent，像傀儡师一样指挥它们——"做这个、修那个、不，别那样做、改做这样"。

但核心前提是：**你必须是一个有经验的软件工程师才能做好这件事**。你需要：
- 知道如何结构化需求让 AI agent 理解
- 能提供上下文和文档
- 能判断 AI 的输出是否正确
- 像好的管理者一样，**需要知道你在管理什么**

> 这与当前笔记库中以 Claude Code 为主的 AI 辅助编程工作模式高度一致。

## 2026 年编程学习五大主题

Tina 按时间顺序推荐了五个模块（假设零基础，6 个月全日制可完成）：

### 1. 编程基础

变量、类型、if/循环、OOP、API。**无论如何必须掌握**，否则连 AI 生成的代码都看不懂。

Tina 推荐 Python 作为入门语言（适合 AI Agent 和数据方向），Web 方向可选 JavaScript。

> 个人关联：这些基础用户已具备（CS 硕士 + Java 主力），此模块可跳过。

### 2. 软件架构

- 项目结构怎么组织
- 技术栈怎么选
- 系统设计：用什么 API、数据怎么流转、存在哪里、什么数据库
- **测试**（使用 AI agent 时尤其重要，需要理解怎么写测试用例）
- 部署：代码托管在哪里运行

这是软件工程的**核心能力**。用 AI agent 时，你需要能构思最终产品应该长什么样，基于需求做出设计决策。例如：要存海量数据且多人同时查询 → 选什么数据库？怎么设计 UI 支持并发访问？

> 个人关联：系统设计是用户正在提升的方向，与入职后制造业软件开发直接相关。

### 3. 版本控制与 GitHub

- Git 跟踪代码随时间的变化，支持回退和多人协作
- GitHub 是行业标准的代码展示和协作平台
- **对 agentic engineering 关键**：跟踪 AI agent 的每次改动，出错时可以 revert
- 很多不懂基础的 vibe coder 因此丢失了整个代码库

### 4. 安全与隐私

Tina 将这个话题独立成章的原因：**安全与隐私是 AI coding agent 的主要盲区**。你不能指望 AI 自动处理好安全问题，必须明确地融入安全原则。

不需要学得很深，但必须知道。偏执狂才能成为好工程师。

> 个人关联：制造业软件（WMS/MES）涉及生产数据，安全隐私意识尤为关键。使用 Claude Code 写代码时也要主动考虑安全边界。

### 5. 微服务与容器化（可选但推荐）

将应用代码和所有依赖打包在一起，与宿主机环境隔离，在不同环境中一致运行（Docker）。

**为什么对 agentic engineering 重要**：
- AI agent 可能搞乱你的开发环境
- 容器化后，最坏情况只需关掉容器环境
- 确保 AI 构建的产物能正确部署和被他人使用

> 个人关联：用户已有 Docker 基础。在让 AI agent 自由发挥时，用容器做隔离是非常实用的自保手段。

## Agentic Engineering 工具

Agentic engineering 本身也是一项技能：怎么搭建项目、配置 AI agent、沟通需求、监控运行。

Tina 推荐 Warp + Oz（Warp 是视频赞助商）：
- Warp：终端/IDE，覆盖 AI 编程全流程
- Oz：云端 agent 编排平台，多 agent 并行（一个写后端、一个写文档、一个写测试），提供实时状态面板
- 70 万工程师在使用，97% 代码 diff 被接受

其他主流选择包括 Claude Code、Codex、Cursor 等。

## 学习加速技巧

### 资源利用类

1. **NotebookLM 预习**：把所有学习材料丢进 NotebookLM，让它总结和生成引导性问题，帮你建立知识地图
2. **AI 实时解释**：学习中遇到不懂的代码/概念，直接复制给 AI 解释。Claude 是代码理解方面最好的模型，免费/开源模型（Qwen、DeepSeek）也够用
3. **类比法**：让 AI 用一个概念给出多个例子和类比（如"用类比解释面向对象编程"），帮助加深理解
4. **AI 读代码**：把别人写的代码丢给 AI，让它解释结构、逐行说明、各模块怎么衔接。Tina 说这是她学代码时最羡慕现在学习者的能力

### 项目驱动类

1. **做项目是最好的学习方式**：看再多视频和书都是假掌握，只有真正动手才算学会
2. **边学边做**：学会 API 就做一个用 API 的项目，学会测试就写测试
3. **用 AI agent 辅助项目**：直接给 agent 需求描述（如"用 Django 后端 + Next.js 前端 + SQLite 做一个音乐存储软件"），在构建中学习
4. **修改他人项目**：fork 别人的项目，加功能、改代码、看结果变化
5. **让 AI 给多种实现方案**：扩展知识面，成为更好的程序员
6. **AI 辅助读文档**：用 AI 帮你理解和消化技术文档

> [!note]- 延伸阅读
>
> ### 语言选择建议
>
> Tina 推荐 Python（AI/数据方向）或 JavaScript（Web 开发方向）。用户主力是 Java，Python 正在系统学习计划中（见 [[private/个人信息/个人技术栈和情况简介]]），语言选择方面不需要调整。
>
> ### 学习时间线
>
> Tina 估算：传统方式学完这些需要几年（上学 + 工作），AI 辅助后全日制约 6 个月。对用户而言，大部分基础已有，重点在于 agentic engineering 实践和安全/容器化的 AI 使用模式。
>
> ### 相关资源
>
> - Tina 的 AI Sprint 28 天路线图：https://www.lonelyoctopus.com/ai-sprint-roadmap
> - Coding study plan prompt（可定制语言和学习目标）：Google Doc 链接见视频描述
> - 视频中提到的人工资源推荐（如 CS50、freeCodeCamp 等）因视频画面不可见，未能完整收录

## Coding Study Plan Prompt 分析

Tina 在视频中提供了一个 prompt，让观众丢给任意 AI 聊天机器人，即可生成个性化的编程学习计划。以下是对该 prompt 的设计分析。

### Prompt 原文

```
I want you to create a personalized coding study plan for me. 

First, ask me ONE question: "What is your main goal with coding?" 
(e.g. build AI agents, data science/ML, web apps, automation, mobile apps, etc.)

Based on my answer, you will:

1. RECOMMEND A LANGUAGE by matching my goal to the best-fit language from this list:
   - Python → data science, ML/AI, AI agents, automation, scripting
   - JavaScript/TypeScript → web frontends, full-stack web apps, browser tools
   - Swift → iOS/macOS apps
   - Kotlin → Android apps
   - Go → backend services, DevOps tooling, CLIs
   - Rust → systems programming, performance-critical tools
   - SQL → data analysis, analytics engineering (pair with Python)
   If my goal doesn't fit neatly, pick the closest match and briefly explain why.

2. BUILD A STUDY PLAN around these 4–5 core topics IN ORDER:
   Topic 1: Coding Basics
   Topic 2: Software Architecture
   Topic 3: Version Control & GitHub
   Topic 4: Privacy & Security
   Topic 5: Microservices & Containerization [OPTIONAL]

3. FOR EACH TOPIC, recommend a curated resource list with this exact format:
   | Resource | Type | Free? | Time | Description | Key Topics |
   Rules: 4-5 resources per topic, mix of types, at least ONE free option per topic

4. END with total estimated time and a suggested weekly schedule.
```

### 设计分析

**整体结构**：这是一个渐进式约束型 prompt，分四步递进——先建立用户上下文（目标 → 语言），再用预设框架填充内容（主题 → 资源 → 时间线）。每一步的输出作为下一步的输入，形成链式推理。

**值得注意的设计决策**：

1. **单问题启动**（`ask me ONE question`）
   - 只问一个最关键的问题（目标），不做冗长的需求访谈
   - 用一个问题锚定用户意图，降低交互门槛
   - 同时给出了选项提示（`e.g. build AI agents, data science/ML...`），用少量示例帮用户快速定位

2. **内置决策矩阵**（goal → language mapping）
   - 在 prompt 中硬编码了目标到语言的映射关系，本质上是把一个决策表写进了指令
   - 好处是输出一致性好、不受模型偏好影响；代价是映射表固定，新增目标类型需要更新 prompt
   - 边缘情况有兜底：`If my goal doesn't fit neatly, pick the closest match and briefly explain why`

3. **固定主题框架 + 可选标记**
   - 五个主题名称不变（`Do NOT change the topic names or their core content`），保证输出的可比较性——不同用户拿到的是同一套框架下的个性化填充
   - Topic 5 标记为 `[OPTIONAL]`，因目标而异（如数据分析方向可能不需要容器化），用规则而非模型判断来决定是否包含

4. **资源推荐的表格格式约束**
   - 规定了精确的 6 列表头（Resource | Type | Free? | Time | Description | Key Topics），这种结构化输出方便横向比较
   - 硬约束：4-5 个资源、混合类型、至少一个免费 → 这些约束让 prompt 不只是"推荐一些资源"而是"做个平衡的资源组合"
   - 隐含的质量约束：`well-documented, widely used resources only (no obscure picks)`

5. **时间估算作为收尾**
   - 先给总量再给周计划（`~X months`），让用户对投入有预期，降低放弃率

### 可复用的 prompt 模式

- **决策矩阵内嵌**：把"如果 A 则选 X"的规则直接写在 prompt 里，比让模型自己判断更可控
- **单问题破冰**：限制第一轮交互只问一个问题，避免认知过载
- **结构化表格输出**：明确表头和列的语义，比自然语言段落更适合做工具化的对比
- **可选标记驱动分支**：`[OPTIONAL]` 标签让 prompt 在不增加分支逻辑的情况下实现条件输出

### 与个人方向的关联

这个 prompt 的框架可以直接用在你自己的场景中：

- **如果给自己定制**：目标选 "build AI agents" → 语言 Python → 五大主题中 Topic 5（容器化）保留。Tina 内置的语言映射会把 AI agent 导向 Python，与你的 Python 学习计划方向一致
- **如果给新人定制**：在格力入职后，如果带新同事入门，可以用这个 prompt 快速生成一份个性化的 Java 后端学习计划（把 prompt 中的语言映射表扩展一行 `Java → enterprise backend, manufacturing software, WMS/MES systems`）
- **prompt 本身的参考价值**：这个 prompt 的设计水平不错——结构清晰、约束精确、有兜底。可以作为写"定制化方案类 prompt"的参考模板

## 相关笔记

- [[Agent与自动化/AI Harness（驾驭层）知识手册]] — Agent 工程第三波范式的完整理论框架
- [[Agent与自动化/AI时代软件开发职业方向]] — AI 时代的两个务实开发方向
- [[Agent与自动化/AI Agent 自动化任务方案对比]] — Cron vs Codex vs Claude Routines
- [[Claude Code/ECC（Everything Claude Code）知识手册]] — Claude Code 全面实践知识
- [[Claude Code/Claude Code CLI 新会话检查清单]] — MCP 与 Hooks 生效验证
- [[ai应用开发路线参考]] — AI 应用开发整体学习路线
- [[《12-factor-agents》]] — AI Agent 工程化 12 要素
- [[《A practical guide to building agents》学习笔记]] — Anthropic Agent 构建实践指南
