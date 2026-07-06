---
tags:
  - ai相关
  - agent
  - rag
  - career
  - learning-plan
created: 2026-07-01
updated: 2026-07-01
aliases:
  - Agent 方向 12 周学习计划
  - 从 lienjack 到 Agent 作品集
status: active
---

# Agent 方向 12 周学习计划：从 lienjack 到作品集

## 目标

12 周内做出一个能展示的本地 RAG + Agent 工程作品，并且能讲清架构、失败案例和改进过程。

不要把目标定成“学完 lienjack”。更有效的目标是：

```text
学一小段
-> 复述
-> 做一个小模块
-> 解释关键代码
-> 记录失败和改进
```

最终作品建议命名为：

```text
Obsidian Agentic RAG Assistant
```

## 总原则

- 每学 1-2 篇内容，就做一次费曼复述。
- 每学 2-3 篇内容，就用 Codex 做一个最小可运行模块。
- Codex 可以写代码、搭骨架、补测试、修 bug，但自己必须能解释关键设计。
- 不追求一次性做大项目，而是让项目一点点长出来。
- 每周至少沉淀一条失败案例或改进记录。
- 作品集看重的是工程判断，不只是用了什么库。

## 12 周路线

### 第 1 阶段：RAG 基础（第 1-2 周）

目标：理解并实现“本地 Obsidian 知识库问答”的最小链路。

学习内容：

- [[lienjack/AI/2.Rag/01.整体步骤|RAG 整体流程：从资料入库到检索增强回答的完整链路]]
- [[lienjack/AI/2.Rag/02.数据导入|RAG 数据导入：不是把文件上传进去，而是把证据整理出来]]
- [[lienjack/AI/2.Rag/03.分块技术|RAG 分块技术：不是把长文档切碎，而是把知识切成能被找到的证据]]
- [[lienjack/AI/2.Rag/04.向量嵌入与向量数据库|向量嵌入与向量数据库]]

产出：

- Markdown loader：读取 Obsidian 笔记，解析 frontmatter、标题层级、wikilink。
- chunker：按标题和段落切块，保留 `source`、`heading_path`、`line_start`、`line_end`。
- 最小向量检索 demo：输入问题，返回 top_k 笔记片段和来源。

Codex 任务提示：

```text
请帮我实现一个 Obsidian Markdown loader。
要求保留 frontmatter、标题路径、文件路径、行号。
先不要做 embedding，先写测试证明结构被保留。
```

验收标准：

- 能解释 `Document`、`chunk`、`metadata` 的区别。
- 任意一个检索结果都能回到原始笔记位置。
- 能说出一个 chunk 太大或太小导致的问题。

### 第 2 阶段：RAG 质量优化（第 3-4 周）

目标：从“能搜到”变成“搜得准、能评估”。

学习内容：

- [[lienjack/AI/2.Rag/05.检索前置处理|检索前置处理]]
- [[lienjack/AI/2.Rag/06.索引优化|索引优化]]
- [[lienjack/AI/2.Rag/07.检索后处理|检索后处理]]
- [[lienjack/AI/2.Rag/08.检验召回质量|检验召回质量]]

产出：

- 查询改写或关键词补充。
- hybrid search：关键词 + 向量检索。
- rerank 或简单重排。
- 20 条问题的小评估集：问题、期望命中文档、实际 top_k。

验收标准：

- 能说清 recall、precision、top_k 命中是什么意思。
- 每次改 chunk 或检索策略，都能用评估集比较前后效果。
- README 中有“失败案例与改进”章节。

### 第 3 阶段：Agent 基础（第 5-6 周）

目标：理解 Agent 不是 prompt，而是“模型 + 工具 + 上下文 + 控制系统”。

学习内容：

- [[lienjack/AI/1.概念介绍/03.从对话到干活-Agent|从对话到干活-Agent]]
- [[lienjack/AI/1.概念介绍/04.如何让Agent更好干活-Harness|如何让 Agent 更好干活-Harness]]
- [[lienjack/AI/build-harness/build-harness|build-harness 系列总览]]，重点读 `00-01` 到 `00-10`

产出：

- 最小 agent loop。
- 支持工具调用：读文件、搜索笔记、列目录。
- 支持任务状态：plan、act、observe、final。

验收标准：

- 能解释 chatbot、workflow、agent、harness 的区别。
- agent 每一步都有 trace 日志。
- 工具调用失败时，不是直接崩，而是能返回错误观察。

### 第 4 阶段：Agent 工程化（第 7-9 周）

目标：把 agent 做成可调试、可扩展、可控的系统。

学习内容：

- [[lienjack/AI/3.ClaudeCode源码解析/02.核心机制-ReAct|核心机制-ReAct]]
- [[lienjack/AI/3.ClaudeCode源码解析/03.核心机制-Prompt编写|核心机制-Prompt 编写]]
- [[lienjack/AI/3.ClaudeCode源码解析/04.1核心机制-Context管理|核心机制-Context 管理]]
- [[lienjack/AI/3.ClaudeCode源码解析/05.0核心机制-Tools|核心机制-Tools]]
- [[lienjack/AI/3.ClaudeCode源码解析/06.MCP|MCP]]
- [[lienjack/AI/3.ClaudeCode源码解析/07.Skill|Skill]]
- [[lienjack/AI/3.ClaudeCode源码解析/08.1Agent协作|Agent 协作]]
- [[lienjack/AI/3.ClaudeCode源码解析/09.1Plan|Plan]]

产出：

- tool registry：工具注册、参数 schema、权限说明。
- context manager：控制塞给模型的上下文。
- skill / plugin 雏形：把 RAG 查询做成一个工具。
- agent trace viewer：至少能用 JSONL 看每一步输入输出。

验收标准：

- 能解释 ReAct、tool calling、context window、MCP、skill 各自解决什么问题。
- 能判断 agent 失败是检索失败、工具失败、上下文污染，还是模型规划失败。
- 能展示一条完整 agent 执行轨迹。

### 第 5 阶段：作品集包装（第 10-12 周）

目标：把学习成果变成求职可展示项目。

最终项目功能范围：

- 读取本地 Obsidian 笔记。
- 构建可追溯 RAG 索引。
- 支持自然语言问答，返回引用来源。
- 支持 agent 调工具：搜索笔记、打开相关文件、生成学习笔记草稿。
- 有评估集、trace、失败案例、架构图。

README 必须包含：

- 项目解决什么问题。
- 架构图。
- RAG 数据流。
- Agent 执行流。
- 关键设计取舍。
- 评估方法。
- 失败案例。
- 下一步计划。

## 每周固定节奏

建议一周 5 天，每天 1.5-2 小时。

```text
周一：读 lienjack 1-2 篇，做费曼复述
周二：让 Codex 实现一个小模块
周三：自己读代码，要求能逐段解释
周四：写测试 / 跑评估 / 找失败案例
周五：整理 README 或学习笔记
周末：补欠账，不开新坑
```

## 当前下一步

不要继续泛泛读。下一步直接做第一个小模块：

```text
Obsidian Markdown loader
```

最小要求：

- 读取 `.md` 文件。
- 解析 frontmatter。
- 解析标题路径。
- 提取正文块。
- 保留文件路径和行号。
- 写测试证明标题层级和行号能被保留。

这是 RAG 数据导入和分块的第一块积木。完成它之后，学习内容才开始变成作品。

## 相关笔记

- [[ai相关/2026年技术求职路线图与AI技能选择——Meta工程师视角|2026 年技术求职路线图与 AI 技能选择——Meta 工程师视角]]
- [[ai相关/Agent与自动化/AI时代软件开发职业方向|AI 时代软件开发职业方向]]
- [[ai相关/Agent与自动化/Agentic Engineering 实战技巧集（2026年6月）|Agentic Engineering 实战技巧集（2026 年 6 月）]]
- [[ai相关/Agent与自动化/Harness Engineering——人类掌舵 Agent 执行|Harness Engineering——人类掌舵 Agent 执行]]
- [[ai相关/Agent与自动化/Harness Eval——把工作流评测变成一场考试|Harness Eval——把工作流评测变成一场考试]]
- [[feynman-notes/03.RAG整体流程、数据导入与分块|03.RAG 整体流程、数据导入与分块]]
