---
tags: [ai-agent, career, job-market]
created: 2026-10-22
updated: 2026-10-22
source_type: community-snapshot
---

# Agent 相关新岗位图谱（2026）

> [!warning] 时效性
> 本页是 2026 年 10 月的招聘市场快照。岗位名称、薪资和招聘方变化很快，国内“FDE”口径尤其混乱；引用前请回到原始 JD 核对。

## 一句话结论

FDE（Forward Deployed Engineer，前向/前线部署工程师）是这一轮 Agent 浪潮里最有名的“新岗位”，但它只是**离客户最近的一层**。完整的岗位生态已经分成四层：落地交付、系统构建、质量运维、产品管理。真正新增的岗位集中在“交付”和“评测/运维”两端，而不是又一个算法工程师。

## 一、四层岗位图谱

| 层级 | 代表岗位 | 核心职责 | 典型招聘方 |
|---|---|---|---|
| 落地交付层 | FDE、Applied AI Engineer、AI Deployment Strategist、Agentic Solutions Architect | 嵌入客户现场，找场景、做 PoC、上线，背采用率和 ROI | OpenAI、Anthropic、Palantir、Google Cloud、Deloitte、Snowflake、ServiceNow、字节、蚂蚁、智谱、月之暗面、华为云、阿里云、腾讯 |
| 系统构建层 | AI Agent Engineer、Agent Architect、Multi-Agent Systems Engineer、AI Orchestration Engineer | 设计并实现 Agent、工具调用、多智能体编排和业务集成 | 各 AI 产品公司、企业 AI 平台团队 |
| 质量与运维层 | AgentOps Engineer、AI Evaluation Engineer、Context Engineer、AI Governance/Trust Engineer | 让非确定性系统可观测、可评测、可回滚、可合规 | 前沿实验室、Agent 平台、金融/医疗等强监管行业 |
| 产品与管理层 | Agent PM、AI Transformation Lead、Human-Agent Interaction Designer | 定义 Agent 产品、推动组织采用、设计人机协作界面 | 企业数字化部门、咨询公司、AI 产品团队 |

### 1.1 落地交付层

- **FDE / Forward Deployed Engineer**：源自 Palantir，现在被改造成“Agent 时代的交付工程师”。典型工作是驻客户现场，识别模糊问题，几周内做出 PoC 并推上生产，负责采用率和 ROI，再把可复用的模式带回产品。岗位变体包括 AI FDE、Agentic AI FDE、Founding FDE、前线部署工程师。
- **Applied AI Engineer（应用 AI 工程师）**：比 FDE 少一些客户现场，更偏“把模型和 Agent 做成产品”。Anthropic、OpenAI 都有独立序列。
- **AI Deployment Strategist（部署策略师）**：FDE 的商业另一半，负责 ROI 基线、范围、合同和变革管理，和 FDE 配对工作。Snowflake、ServiceNow、Palo Alto、ElevenLabs、Money Forward 都有类似岗位。
- **Agentic Solutions Architect（智能体解决方案架构师）**：企业架构层，把 Agent 接进现有技术栈。Salesforce、Amazon、EY 等在招。

### 1.2 系统构建层

- **AI Agent Engineer / Agentic AI Engineer**：最主流的“做 Agent 的人”，要求 Python、LangChain/LangGraph、RAG、工具调用。
- **Agent Architect / Multi-Agent Systems Engineer**：负责多智能体编排、状态管理、失败恢复，常用 LangGraph、CrewAI、AutoGen。
- **AI Orchestration / Integration Engineer**：把 Agent 接到工具、API、数据库和 RAG 管线，偏集成工程。
- **Agentic Workflow Designer**：设计人机分工和业务流程，不一定写底层代码。

### 1.3 质量与运维层（新增且最缺人）

- **AgentOps Engineer / Agent Reliability Engineer**：可以理解为“面向非确定性系统的 SRE/MLOps”，负责 trace、可观测性、成本/延迟、回滚和护栏。有招聘方直接把它写成 AgentOps Architect。
- **AI Evaluation Engineer / Evals Engineer**：从生产 trace 里挖评测集，设计约束和 Docker 化测试环境，用 LLM-as-judge 和统计分析量化 Agent 质量。
- **Context Engineer**：Prompt Engineer 的升级形态，负责上下文组装、检索、记忆和注意力管理。G.E.H.A 已出现“Sr AI Context Engineer”岗位。
- **AI Governance / Trust Engineer**：合规、审计、EU AI Act、NIST AI RMF，强监管行业需求更明显。

### 1.4 产品与管理层

- **Agent PM / AI Product Owner**：定义 Agent 的能力边界、成功指标和人机交接流程。
- **AI Transformation Lead / AI Enablement**：在企业内部推动各业务线真正用起来，常见于咨询和大企业数字化部门。
- **Human-Agent Interaction Designer**：设计人和 Agent 的协作界面，目前尚未标准化。

## 二、FDE 专项

### 2.1 它到底是什么

FDE 的核心不是“会写代码”，而是**对交付结果负责**：发现问题 → 快速做 PoC → 推上生产 → 让客户真正用起来 → 把经验产品化。Anthropic 的 JD 把早期 FDE 称为“founding FDE”，交付物直接写成 MCP server、sub-agent 和 agent skill；OpenAI 则把 FDE 集中到专门的部署子公司，只服务 ARR 千万美元以上的客户。

### 2.2 市场数据

- LinkedIn 2026 年 1 月报告：FDE 岗位自 2023 年增长 **42 倍**，同期 AI Engineer 增长 13 倍；《华尔街日报》称其为“科技行业最热门的工作”。
- Indeed：FDE 岗位从 2025 年 4 月的 643 个增至 2026 年 4 月的 **5,330 个**。
- 国内脉脉：2026 年上半年 FDE 职位发布量同比 **21 倍**；猎聘 2026 年 9 月报告平均年薪 **40.8 万元**，人才供需比 **0.28**（约 3.5 个岗位抢 1 人）。
- 霞光智库：全球 565 家公司在招 FDE，美国中位基本工资 **19.3 万美元**，供需比约 1:2.7，人才缺口超 60%。

> 以上均为媒体/招聘平台汇总口径，不是官方统计；国内数据尤其容易把“实施/售前”算进 FDE。

### 2.3 薪资区间

| 公司/地区 | 月薪或年薪 | 备注 |
|---|---|---|
| 字节跳动 豆包 AI FDE | 3.5 万–7 万/月 × 15 薪 | 年包最高约 105 万元 |
| 蚂蚁数科 B 端 FDE | 4 万–6 万/月 × 15 薪 | 最高约 90 万元 |
| 智谱 FDE 负责人 | 6 万–8 万/月 | 年包约 96 万元 |
| 月之暗面 Kimi 企业版 FDE | 4 万–6.5 万/月 × 14 薪 | 最高约 109 万元 |
| 华为云 盘古大模型 FDE | 3.5 万–6 万/月 × 14 薪 | — |
| 阿里云 大模型 FDE | 2 万–5.5 万/月 × 16 薪 | — |
| OpenAI FDE | 16.2 万–28 万美元/年 + 股权 | 旧金山、西雅图、东京、首尔、新加坡 |
| Anthropic FDE | 底薪 20 万–30 万美元/年 | Founding FDE |
| 美国 FDE 市场中高级 | 总包 30 万–55 万美元 | 2026 年约 1000–1200 份 JD 分析 |

### 2.4 能力要求

- **工程**：Python/TypeScript/SQL/云与容器是底线；LLM 应用开发、RAG、评测、Agent 编排是主体；MCP、多智能体、安全合规是加分项。
- **客户**：需求发现、范围界定、ROI 沟通、高管汇报、变革管理。2026 年约 70% 的 JD 明确要求客户发现能力。
- **交付**：能把 PoC 推到生产，并留下可观测、可交接的系统，而不是演示完就走。
- **面试**：常见编码轻量系统轮、模糊部署场景轮、客户模拟轮（最容易挂）、价值观/行为轮。

### 2.5 主要招聘方

海外：Anthropic、OpenAI、Palantir（招聘量最大）、Google Cloud/DeepMind（FDE-GenAI I–IV）、Deloitte（Senior FDE – Agentic AI）、Mastercard、Snowflake、ServiceNow、Palo Alto、ElevenLabs。

国内：字节（豆包、飞书、火山引擎）、蚂蚁数科、智谱、月之暗面、华为云、阿里云、腾讯（社招“前线部署工程师”归产品类；字节的“AI FDE 工程师”归研发类，实习岗归销售支持类）。同一岗位在不同公司归类不同，说明它还没有形成统一职级。

## 三、怎么辨别真假 FDE

国内相当一部分“FDE”其实是实施工程师、售前或运维岗改名。通信产业网 2026 年 10 月的评论直接指出“概念膨胀大于市场扩张”，市面上还出现了速成培训班。判断标准可以看五条：

1. 是否要求**写生产代码**，而不只是配置、演示或写方案。
2. 是否对**评测和上线质量**负责，而不是交付即结束。
3. 是否背**采用率/ROI**，而不是只背工时或合同额。
4. 是否有**产品回流机制**，能把客户现场问题变成可复用能力。
5. 团队是否与产品/研发**同权**，而不是外包式实施。

只要缺两条以上，基本可以按“售前/实施”理解，不要按 FDE 的职业路径规划。

## 四、对个人的含义

如果你的背景是 Java 后端 + 制造业 ToB 交付 + Agent 应用开发（参见 [[AI时代软件开发职业方向]]），FDE 是相邻岗位上最自然的一步：制造业场景里既懂业务又懂 Agent 落地的人比纯算法的人稀缺。

三条可行入口：

| 入口 | 已有优势 | 需要补的 |
|---|---|---|
| FDE / Applied AI | 后端工程、客户现场、业务理解 | 评测、Agent 编排、MCP、全栈交付 |
| Agent 构建 | Java/Spring、RAG 接入经验 | LangGraph/CrewAI、Python、前端联调 |
| AgentOps / Evals | 测试与排障习惯 | trace/可观测性、LLM-as-judge、统计 |

不必急着换 title。更划算的是在现岗位做一个**可量化的 Agent 落地案例**：有评测、有上线、有 ROI 数字。这是 FDE 面试最认的作品，也能直接复用为内部转岗材料。技能补齐顺序建议：评测 → 编排 → MCP → 前端/全栈 → 商务沟通。

## 延伸阅读

- [[AI时代软件开发职业方向]] — Agent 应用开发 + AI 赋能后端两条主线
- [[Agent方向12周学习计划：从lienjack到作品集]] — 以 RAG + Agent 作品集为目标的执行路线
- [[AI Harness（驾驭层）知识手册]] — Agent 工程化的基础框架
- [[Harness Eval——把工作流评测变成一场考试]] — 评测系统的具体设计
- [[Is it agentic enough——如何评测 Agent 是否真会用你的工具]] — 工具使用评测
- [[2026年技术求职路线图与AI技能选择——Meta工程师视角]] — 2026 年求职市场与项目选择
- [[技术面试的终结与人才评估的未来]] — 面试制度变迁

## 来源

- [36氪：硅谷最火的新岗位，划出了 AI 时代职场的斩杀线](https://eu.36kr.com/zh/p/3960032943504520)
- [通信产业网：吴昱旻——FDE 的虚与实](https://www.ccidcom.com/jishu/20261014/BNvNPB5ZNK7AA6gV41d0fpgzmaf1c.html)
- [杭州网：月薪 30–50k，大厂抢人，FDE 成招聘市场新贵](https://jrsh.hangzhou.com.cn/content/2026-08/12/content_9278365.html)
- [腾讯云开发者社区：FDE——AI 时代最抢手的四不像岗位](https://cloud.tencent.com.cn/developer/article/2732877)
- [川观智库：岗位激增，FDE 成 AI 落地重要工种](https://comment.scol.com.cn/m/011080/202609/83332208.html)
- [Agentic AI Job Titles, Explained (2026 Taxonomy)](https://agenticengineeringjobs.com/guides/agentic-ai-job-titles-explained)
- [Agentic Dev Handbook: Roles in Agentic Development](https://www.agentic-dev.org/handbook/team-model/roles)
- [2026 FDE Hiring Trends: What 1,000 Job Posts Reveal](https://getperspective.ai/blog/2026-fde-hiring-trends-what-1000-job-posts-reveal)
- [FDE vs Applied AI Engineer (2026)](https://fde.academy/blog/forward-deployed-engineer-vs-applied-ai-engineer)
- [Economic Times: Demand for agentic AI talent rises 260%](https://economictimes.indiatimes.com/ai/ai-insights/demand-for-agentic-ai-talent-rises-260-as-enterprises-embrace-ai-report/printarticle/133922683.cms)
- [Deloitte: Senior Forward Deployed Engineer – Agentic AI](https://apply.deloitte.com/en_US/careers/JobDetail/Senior-Forward-Deployed-Engineer-Agentic-AI/353421)

> 数据检索日期：2026-10-22。薪资与岗位数均为二手汇总，引用时请保留原始口径。
