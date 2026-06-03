---
tags: [career, ai-agent]
created: 2026-06-01
---

# AI 时代软件开发职业方向

## 背景

2026 年，上海"十五五"规划首次将多模态 AI 智能体列为服务业重点方向，明确推动智能客服、智能运营、智能决策等工具的规模化应用。在此背景下，软件开发程序员有以下务实方向。

## 方向一：AI Agent 应用开发工程师（主线）

### 角色定位

使用现有 Agent 框架、平台和工具，面向业务场景构建 AI Agent 应用。不训练模型，不做底层推理优化，而是做 **Agent 的工程化落地**。

### 对应的实际需求

- 企业需要把 AI Agent 接入现有业务系统（客服、OA、ERP）
- 需要能搭多 Agent 协作流程的人
- 需要能写 MCP Server 把企业内部工具暴露给 AI 的人
- 上海的"智能客服/运营/决策规模化应用"直接对应

### 技能要求

**已有基础：**
- 会用 Claude Code + Skills/MCP 做实际开发
- 理解 Agent 自动化方案的区别和适用场景
- Agent 工程化方法论（[[AI Harness（驾驭层）知识手册|AI Harness]]、[[《12-factor-agents》]]）

**需要补充：**
- Agent 编排框架：LangGraph、Agno、CrewAI 等——能搭多 Agent 协作流程
- MCP 协议本身——能写自定义 MCP Server，不只是使用别人的
- Python 基础（Agent 生态主力语言），不需要深，能写 Tool/Function 即可
- Prompt Engineering 进阶（[[《A practical guide to building agents》学习笔记|Anthropic 实践指南]]中的模式）

### 入门路径

1. 用 LangChain/LangGraph 搭建一个能调用业务 API 的 Agent 原型
2. 写一个自定义 MCP Server，暴露某个内部系统的查询接口
3. 在企业内部场景中落地一个 Agent 应用（如自动化工单处理）

---

## 方向二：AI 赋能的后端开发（互补）

### 角色定位

以 Java/Spring Boot 为主技术栈的后端工程师，将 AI 能力嵌入到传统业务系统中，做 **AI 集成的工程化**。

### 对应的实际需求

- 企业内 AI 平台/中间件的二次开发与维护
- RAG 系统的工程化落地（非研究，是接入现有业务）
- 传统业务系统的 AI 改造升级
- 通用后端能力永远不会消失（事务、并发、分布式），AI 只是一个新的集成维度

### 技能要求

**已有基础：**
- Java/Spring Boot 完整项目经验（苍穹外卖、天机学堂）
- 缓存、定时任务、工作流等后端通用能力

**需要补充：**
- Spring AI 或 LangChain4j——Java 生态的 AI 集成框架
- RAG 工程实践：向量数据库选型与接入、文档切分策略、检索 pipeline 设计
- 模型服务化概念：理解 MaaS 模式、API 网关、成本控制
- AI 应用的后端架构模式：流式响应处理、Token 计费、多模型路由

### 入门路径

1. 在现有 Spring Boot 项目中接入 Spring AI，实现一个 LLM 调用端点
2. 搭建一个简易 RAG 系统（文档上传 → 向量化 → 检索 → 生成）
3. 将 Agent 能力嵌入到业务流程中（如订单处理、客服工单）

---

## 两个方向的交叉点

两个方向不是互斥的，它们的交集是最大的价值区：

- **Agent + 后端 = 能落地的 Agent 系统**：Agent 最终要调用业务 API、操作数据库、触发工作流，这些都需要后端能力
- **后端 + Agent = 智能化的业务系统**：不是给后端加个聊天框，而是让 Agent 参与业务流程的编排和决策
- **MCP Server 开发**是两个方向的天然交汇点——既需要理解后端系统和 API 设计，又需要理解 Agent 的调用模式

---

## 不需要做的事情

- 不需要重新捡起 C++ 去卷推理引擎优化——那是另一个赛道
- 不需要去卷模型训练/微调——算法工程师的路线，投入产出不成比例
- 不需要成为 Python 专家——Agent 开发需要 Python，但够用就行

## 相关笔记

- [[上海十五五规划-AI智能体政策解读]] — 政策背景
- [[AI Harness（驾驭层）知识手册]] — Agent 工程化基础
- [[AI Agent 自动化任务方案对比]] — 自动化方案选型
- [[《12-factor-agents》]] — Agent 工程化原则
- [[《A practical guide to building agents》学习笔记]] — Anthropic Agent 实践指南
- [[ai应用开发路线参考]] — AI 应用开发学习路线
