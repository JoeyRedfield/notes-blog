---
title: "AI Harness（驾驭层）知识手册"
subtitle: "从 Prompt 到 Context 再到 Harness——AI Agent 工程的第三波范式"
created: 2026-05-25
tags:
  - "ai-agent"
  - "harness"
  - "ai-engineering"
  - "知识手册"
---

# AI Harness（驾驭层）知识手册

> Agent = Model + Harness。引擎是模型，Harness 是变速箱、刹车、方向盘和仪表盘。

---

## 一、一句话定义

**Harness（驾驭层）** 是位于 LLM 与外部世界之间的**运行时基础设施层**，负责将原始的模型能力转化为可靠、可控、生产可用的 Agent 系统。

如果 LLM 是一台裸引擎（有马力但不能上路），Harness 就是整车的传动、制动、转向和仪表系统——**让引擎的力量被安全驾驭**。

> 来源：[arXiv - AI Harness Engineering: A Runtime Substrate](https://browse-export.arxiv.org/abs/2605.13357)、[阿里云 - Prompt、Context、Harness 三层架构](https://developer.aliyun.com/article/1725017)

---

## 二、为什么会出现这个概念

### 2.1 问题的根源

LLM 本身有四个致命限制：

| 限制 | 问题 |
|------|------|
| **无状态** | 每次调用都是全新的，不记得上一轮说了什么 |
| **无工具** | 不能查数据库、不能跑代码、不能读文件 |
| **会漂移** | 长任务中遗忘目标、产生幻觉、过早宣称"完成了" |
| **无约束** | 可能执行危险命令、泄露敏感信息、陷入死循环 |

### 2.2 业界发现的真相

实践者逐渐意识到：**大多数 Agent 失败不是模型能力不够，而是基础设施不牢。** 关键证据：LangChain 只优化了 harness 层（模型没换），Terminal Bench 2.0 通过率从 52.8% 跳到 66.5%，提升 14 个百分点。

> "If you're not the model, you're the harness."
> — LangChain 社区

> 来源：[36Kr - Harness Engineering](https://eu.36kr.com/zh/p/3749464991187458)、[Milvus Blog](https://blog.milvus.io/zh-hant/blog/harness-engineering-ai-agents.md)

---

## 三、AI 工程的三波范式演进

| 阶段 | 时期 | 核心问题 | 关键词 |
|------|------|---------|--------|
| **Prompt Engineering** | 2023 | 怎么跟模型说话 | 提示词优化、few-shot、chain-of-thought |
| **Context Engineering** | 2024-2025 | 模型能看到什么 | 检索增强（RAG）、记忆压缩、上下文组装 |
| **Harness Engineering** | 2025-2026 | 模型运行在什么系统里 | 工具编排、安全沙箱、验证闭环、状态恢复 |

每一波都是在解决前一阶段解决不了的问题——Prompt 搞不定的靠 Context，Context 搞不定的靠 Harness。

> 来源：[阿里云 - Prompt、Context、Harness 三层架构](https://developer.aliyun.com/article/1725017)、[百度开发者 - 构建生产级 AI Agent](https://developer.baidu.com/article/detail.html?id=6794975)

---

## 四、Harness 的核心组成

一个完整的 Harness 包含以下子系统：

### 4.1 基础模块

| 模块 | 职责 |
|------|------|
| **编排循环引擎**（Orchestration Loop） | 控制 Agent 的交互流程：计划 → 行动 → 观察 → 重复（ReAct 循环） |
| **工具集成层**（Tool Integration） | 标准化 API 封装外部工具（搜索、代码执行、数据库查询）、动态加载、限流、熔断 |
| **记忆系统**（Memory） | 短期记忆（滑动上下文窗口）、中期记忆（向量数据库语义检索）、长期记忆（结构化知识图谱） |
| **状态持久化**（State Persistence） | 事件溯源式检查点，支持暂停/恢复、回滚、跨会话连续性 |
| **上下文组装**（Context Assembly） | 动态组合 prompt、检索文档、工具输出，作为每次 LLM 调用的输入 |

### 4.2 保障模块

| 模块 | 职责 |
|------|------|
| **验证与反馈闭环**（Verification Loop） | 前置检查（输入校验）、运行时监控、事后评估、迭代纠错 |
| **安全沙箱**（Security Sandbox） | RBAC 权限、输入净化、资源配额、容器隔离、审计日志 |
| **错误恢复**（Error Recovery） | 指数退避重试、熔断器、自动检查点恢复、人工升级通道 |
| **自适应调度**（Adaptive Scheduling） | 基于 RL 的动态资源分配、预测性工具预加载、多 Agent 并发管理 |

### 4.3 IMPACT 框架

由 swyx 在 2025 AI Engineer Summit 提出：

> **I**ntent（意图） → **M**emory（记忆） → **P**lanning（规划） → **A**uthority（权限） → **C**ontrol Flow（控制流） → **T**ools（工具）

> 来源：[Morphllm - Agent Engineering: Harness Patterns](https://www.morphllm.com/agent-engineering)、[Microsoft Agent Framework Blog](https://devblogs.microsoft.com/agent-framework/agent-harness-in-agent-framework/)

---

## 五、词源与关键人物

| 人物/组织 | 贡献 |
|----------|------|
| **Mitchell Hashimoto**（HashiCorp 创始人） | 2026 年 2 月博客中普及了"Harness Engineering"一词。定义：*"每当 Agent 犯一个错误，就投入时间设计一套机制，让它永远不再犯同样的错误。"* |
| **LangChain** | 2026 年 3 月发表《The Anatomy of an Agent Harness》，给出了"If you're not the model, you're the harness"的名言 |
| **Anthropic** | 2026 年 4 月发表工程文章，详细披露 Claude Code 的生产 Harness 架构 |
| **OpenAI** | 2026 年 4 月重写 Agents SDK，将 Harness 作为独立概念产品化 |
| **Zhong & Zhu**（学术） | 2026 年 5 月在 arXiv 发表《AI Harness Engineering: A Runtime Substrate》，首次给出 Harness 的学术框架定义 |

> 来源：上述各组织官方博客及 arXiv

---

## 六、各大玩家的 Harness 实践

| 玩家 | Harness 思路 | 关键数据 |
|------|-------------|---------|
| **OpenAI** | 2026 年 4 月重写 Agents SDK，harness 与 sandbox 分离；Manifest 抽象层解耦 7 家沙箱厂商（Cloudflare、Vercel、E2B、Modal 等）；"repo-as-truth" 原则 | 5 个月用 Agent 产出 **100 万+ 行代码**，0 行人类手写 |
| **Anthropic（Claude Code）** | 初始化 Agent + 编码 Agent 双模式；CLAUDE.md 注入上下文；MCP 管理工具；git checkpoint + progress 文件做状态恢复；1-feature-per-session 原则 | - |
| **Microsoft** | 2026 年 3 月发布 Agent Framework，本地/托管 shell harness + 审批流 + 上下文压缩 | - |
| **LangChain/LangGraph** | 开源 Harness 参考实现 | 只换 harness 不换模型，基准测试 **+14pp**（52.8%→66.5%） |
| **Manus**（Meta ~20 亿美元收购） | KV-cache 优化的 ReAct 循环；文件系统作为扩展上下文；logit masking 替代工具移除；`todo.md` 在上下文窗口末尾复述 | 5 个月内**重写 5 次** harness |
| **Cursor** | 每个模型通过 tool-use 轨迹训练专属 harness；推理轨迹保留（丢失则性能降 30%） | - |
| **AG2** | 开源 Agent Harness 框架，支持多 Agent 编排 | - |

> 来源：[OFweek - Anthropic 和 OpenAI 把 Harness 带出圈](https://www.ofweek.com/ai/2026-04/ART-201717-8140-30684854.html)、[36Kr - OpenAI GPT-5.4 + Codex Harness](https://m.36kr.com/p/3769362731467272)、[AG2 Docs](https://docs.ag2.ai/latest/docs/beta/agent_harness/)

---

## 七、Harness 成熟度模型（H0-H3）

来自 Zhong & Zhu 的学术框架（arXiv, 2026 年 5 月）：

| 等级 | Agent 产出的内容 | 特征 |
|:---:|------|------|
| **H0** | 仅最终 patch | 最基本的"给代码，跑一下" |
| **H1** | + 复现日志 | 能交代"我是怎么改的" |
| **H2** | + 失败归因 + 确定性需求检查 | 能说清楚"为什么失败""改完有没有真满足需求" |
| **H3** | + 结构化验证报告 | 产出**可审计、可验证、可归因、可维护**的变更——生产级 |

大多数团队目前处于 H0-H1。H3 是业界正在追求的目标。

> 来源：[arXiv - AI Harness Engineering: A Runtime Substrate for Foundation-Model Software Agents](https://browse-export.arxiv.org/abs/2605.13357)

---

## 八、Harness 与相关概念的辨析

| 概念 | 关系 | 一句话区别 |
|------|------|---------|
| **Agent** | Agent = Model + Harness | Agent 是最终产物，Harness 是其中的基础设施层 |
| **MCP**（Model Context Protocol） | MCP 是 Harness 中**工具集成层**的一种标准协议 | Harness 是整体架构，MCP 是其中的一个协议 |
| **Skills**（Claude Code 技能） | Skill 是 Harness 中**编排循环**可调用的封装工作流 | Harness 执行 Skill，Skill 是 Harness 里的指令卡 |
| **Hooks**（生命周期钩子） | Hook 是 Harness 中**验证与反馈闭环**的实现机制 | Hook 在 Harness 的关键节点自动触发检查 |
| **Sandbox**（沙箱） | Sandbox 是 Harness 中**安全模块**的具体实现 | Harness 决定"需要隔离"，Sandbox 执行隔离 |
| **RAG**（检索增强生成） | RAG 是 Harness 中**记忆系统**的一种技术方案 | RAG 解决"给模型看什么"，属于 Context Engineering 的遗产 |

---

## 九、为什么 Harness 是"产品"

2025-2026 年 AI 工程界达成了一个重要共识：

> **"Harness, not the model, is increasingly the product."**
> （Harness 越来越成为产品本身，而不是模型。）

三个论据支撑这个判断：

1. **模型在趋同**——前沿模型的编码能力差距在缩小，差异化越来越难靠模型本身实现
2. **Harness 决定天花板**——同样的模型，不同的 Harness 设计可以产生 14-48 个百分点的性能差距
3. **Harness 可以自主迭代**——OpenAI 的案例证明，一个好的 Harness 可以让 Agent **自己写代码改进自己**

这意味着未来的竞争不再是"谁有更好的模型"，而是"谁有更好的 Harness"。

> 来源：[OFweek - Harness 带出圈](https://www.ofweek.com/ai/2026-04/ART-201717-8140-30684854.html)、[百度开发者 - Harness 架构](https://developer.baidu.com/article/detail.html?id=7005881)

---

## 十、与本文其它笔记的关联

- [[ECC（Everything Claude Code）知识手册]] — ECC 将自己定位为 "agent harness performance optimization system"，本质是在 Claude Code 的 Harness 层之上叠加一套增强系统
- [[Claude Code Skills 与 MCP 精华笔记]] — Skills 和 MCP 都是 Harness 体系中的具体组件：Skill 是编排层的指令卡，MCP 是工具层的标准协议
- [[ai应用开发路线参考]] — 理解 Harness 是 AI 应用开发从"调 API"走向"系统工程"的关键一步

---

## 十一、进一步阅读

- **学术论文**：[AI Harness Engineering: A Runtime Substrate for Foundation-Model Software Agents](https://browse-export.arxiv.org/abs/2605.13357)（Zhong & Zhu, 2026.05）
- **学术论文**：[Harness Engineering as Categorical Architecture](https://arxiv.org/html/2605.12239v1)（2026.05）
- **LangChain**：The Anatomy of an Agent Harness（2026.03）
- **Mitchell Hashimoto**：原始博客文章普及 "Harness Engineering"（2026.02）
- **阿里云**：[Prompt、Context、Harness：AI Agent 工程的三层架构解析](https://developer.aliyun.com/article/1725017)
- **36Kr**：[一文读懂 Harness Engineering](https://eu.36kr.com/zh/p/3749464991187458)
- **OFweek**：[Anthropic 和 OpenAI 把 Harness 带出圈](https://www.ofweek.com/ai/2026-04/ART-201717-8140-30684854.html)
- **Microsoft**：[Agent Harness in Agent Framework](https://devblogs.microsoft.com/agent-framework/agent-harness-in-agent-framework/)
- **Morphllm**：[Agent Engineering: Harness Patterns, IMPACT Framework](https://www.morphllm.com/agent-engineering)
