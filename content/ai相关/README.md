---
tags: [index]
---

# AI 相关

这里存放 AI 应用开发、Claude Code、Agent 与自动化、工具与发布、学习路线、AI 编码实践和 AI 伦理相关内容。

> [!note]
> 这个目录里的页面来源差异很大。为了降低“把旧经验当官方事实”的风险，后续统一按下面四类阅读：
>
> - **`[官方机制]`**：官方文档、官方研究、官方博客为主，稳定性最高
> - **`[第三方接入]`**：某个工具、模型或平台的接入方式，通常强时效
> - **`[社区快照]`**：演讲、推文、文章、生态统计、stars、安装量、趋势判断
> - **`[实验观察]`**：你或别人基于某个版本、某条链路、某套本机环境做出的验证记录
>
> 读取原则：
>
> 1. 先看 `[官方机制]`
> 2. 再看 `[第三方接入]`
> 3. `[社区快照]` 用来扩展视野，不直接抄配置
> 4. `[实验观察]` 只在相近环境下复用

## 来源层级

| 标签 | 适合拿来做什么 | 不适合拿来做什么 |
|---|---|---|
| `[官方机制]` | 建立基础理解、形成长期笔记主干 | 直接替代你的本机配置细节 |
| `[第三方接入]` | 配置某个具体工具链、模型或网关 | 当成长期稳定规范 |
| `[社区快照]` | 看趋势、收集案例、找新思路 | 当成官方承诺或稳定事实 |
| `[实验观察]` | 复盘某条真实链路、排查问题、保存版本切片 | 脱离上下文到处复用 |

## 内容索引

### 学习路线

- [[ai应用开发路线参考]] — `[社区快照]` AI 应用开发学习路线
- [[AI应用开发学习库.base]] — 学习库

### AI 工具使用与自我管理

- [[AI 工具与注意力管理——从 ADHD 放大器到自律工具]] — `[社区快照]` AI 编码工具的注意力陷阱与自律对策：意图三问、时间盒、三角循环嵌入

### Claude Code

- [[Claude Code/Claude Code Skills 官方实践指南——Anthropic 内部经验]] — `[官方机制]` Anthropic 内部数百个 skills 的九大分类框架、制作技巧与分发管理
- [[Claude Code/Claude Code Skills 与 MCP 精华笔记]] — `[社区快照]` Skills/MCP 概念、生态和常见安装方式
- [[Claude Code/ECC（Everything Claude Code）知识手册]] — `[社区快照]` ECC 项目全面知识：是什么、怎么用、何时用
- [[Claude Code/Claude Code 接入 DeepSeek 完整配置]] — `[第三方接入]` settings.json 模板、模型路由与兼容接入说明
- [[Claude Code/Claude Code 切换 API、Resume 与缓存命中学习笔记]] — `[实验观察]` API 切换、Session Resume 与缓存链路观察
- [[Claude Code/Claude Code CLI 新会话检查清单]] — `[实验观察]` 当前机器上的 MCP / hooks / MemPalace 检查单
- [[Claude Code/Claude Code 源码未文档化功能挖掘]] — `[实验观察]` 基于特定源码版本的 hooks / skills / memory 扩展点观察
- [[Claude Code/把一本书做成 AI Skill 方法论]] — `[社区快照]` 六步把一本书做成可调用 AI skill 的实操方法
- [[Claude Code/Claude Code 记忆系统——与 CLAUDE.md 的区别及构建方法]] — `[官方机制]` 跨会话记忆、CLAUDE.md 与 auto memory 的边界

### Agent 与自动化

- [[Agent与自动化/AI Harness（驾驭层）知识手册]] — `[官方机制]` Agent 工程第三波范式：定义、架构、演进与各大玩家实践
- [[Agent与自动化/AI Agent 自动化任务方案对比]] — `[第三方接入]` 传统 Cron vs Codex vs Claude Routines 三种范式对比与选型
- [[Agent与自动化/项目目录里 Codex 计划 + Claude Code CLI 开发工作流模板]] — `[实验观察]` 适合“Codex 做计划、Claude 做实现”的项目内工作流模板
- [[Agent与自动化/Codex 写计划、Claude Code CLI 写代码：模型与成本选型建议]] — `[实验观察]` 某时间点的模型分工与成本案例
- [[Agent与自动化/上海十五五规划-AI智能体政策解读]] — `[社区快照]` 上海地方政策信号解读
- [[Agent与自动化/商务部等8部门“人工智能+消费”实施意见解读]] — `[官方机制]` 国家级政策原文导向的场景解读
- [[Agent与自动化/国家“人工智能+消费”与上海AI智能体政策对照]] — `[社区快照]` 国家与地方政策对照
- [[Agent与自动化/“人工智能+消费”政策对职业方向的含义]] — `[社区快照]` 从政策信号推到职业路线判断
- [[Agent与自动化/政策信号到行动清单：学什么、做什么项目]] — `[实验观察]` 从政策页继续收束成行动清单
- [[Agent与自动化/AI时代软件开发职业方向]] — `[实验观察]` AI 时代软件开发程序员的两个务实方向
- [[Agent与自动化/Agent方向12周学习计划：从lienjack到作品集]] — `[实验观察]` 以本地 RAG + Agent 作品集为目标的 12 周学习和产出路线
- [[Agent与自动化/Harness Engineering——人类掌舵 Agent 执行]] — `[社区快照]` Ryan Lopopolo 演讲：Code is free，如何构建 Agent 驾驭层
- [[Agent与自动化/Agentic Engineering 实战技巧集（2026年6月）]] — `[社区快照]` @mvanhorn 的 22 个 Agentic Engineering 实战技巧
- [[Agent与自动化/Claude Code Dynamic Workflows 动态工作流]] — `[官方机制]` Claude Code 动态工作流机制与编排模式
- [[Agent与自动化/Loop Engineering]] — `[社区快照]` Addy Osmani + @0xCodez：从 prompt 到 loop 的范式转变
- [[Agent与自动化/Harness Engineering 腾讯实践案例——从 AI 写得快到干得稳]] — `[社区快照]` 腾讯技术工程：AI 驱动研发全链路的协议、管线、纪律、知识库与运营闭环
- [[Agent与自动化/Harness Eval——把工作流评测变成一场考试]] — `[社区快照]` 腾讯技术工程：把 Harness 工作流评测做成考试系统
- [[Agent与自动化/Is it agentic enough——如何评测 Agent 是否真会用你的工具]] — `[官方机制]` Hugging Face：工具使用评测框架
- [[Agent与自动化/Hermes 学习笔记——Profile、Personality、Memory 与 Gateway 模型关系]] — `[实验观察]` Hermes 四层概念关系的澄清
- [[Agent与自动化/Hermes 实操入门：profile、gateway、memory 怎么搭]] — `[第三方接入]` Hermes 的实际搭建入口
- [[Agent与自动化/Hermes 排错手册：profile、gateway、memory、model 为什么没按预期工作]] — `[实验观察]` Hermes 排错页

### AI 编码实践

- [[AI编码实践/Codex Superpowers 插件与 brainstorming skill 的关系]] — `[实验观察]` 解释 `superpowers` 插件、`brainstorming` skill 与当前会话技能暴露层之间的关系
- [[AI编码实践/AI编码全流程工作流——Matt Pocock 工作坊]] — `[社区快照]` Matt Pocock 的完整 AI 编码六阶段流程
- [[AI编码实践/软件基础在AI时代更重要——Matt Pocock]] — `[社区快照]` AI 时代软件基础更重要、五大失败模式
- [[AI编码实践/AI编码能力提升路线]] — `[实验观察]` 基于当前背景梳理的六大 AI 编码提升方向
- [[AI编码实践/三角循环——AI编码核心概念内化记录]] — `[实验观察]` 交互式 Review 的心智模型内化记录
- [[AI编码实践/inbound-order-PRD]] — `[实验观察]` 入库单管理系统 PRD
- [[AI编码实践/inbound-order-实战记录]] — `[实验观察]` AI 编码全流程实战记录

### 工具与发布

- [[工具与发布/MemPalace 学习笔记]] — `[第三方接入]` 本地优先 AI 记忆系统：架构、代码阅读路线与上手方法
- [[工具与发布/MarkItDown 文档转 Markdown 工具]] — `[官方机制]` 微软开源工具，将 Word/PDF/PPT 等转为 Markdown
- [[工具与发布/Quartz GitHub Pages 博客发布工作流]] — `[第三方接入]` Obsidian notes 到 Quartz/GitHub Pages 的公开发布流程
- [[工具与发布/Quartz GitHub Pages 子路径跳转问题排查记录]] — `[实验观察]` `/notes-blog` 丢失的根因、修复和验证方法

### 观点与趋势

- [[Agentic Coding 与专业知识的持久回报]] — `[官方机制]` Anthropic 官方研究：40 万次会话分析
- [[2026年学编程路线与AgenticEngineering]] — `[社区快照]` Tina Huang 2026 年编程学习路线
- [[技术面试的终结与人才评估的未来]] — `[社区快照]` Steve Yegge 论技术面试消亡
- [[AI原生工程团队运作实践]] — `[社区快照]` Fiona Fung 演讲：AI 原生时代如何重写工程规范
- [[斯坦福法学院研究：AI法律推理超越教授]] — `[官方机制]` 斯坦福法学院盲评研究
- [[2026年技术求职路线图与AI技能选择——Meta工程师视角]] — `[社区快照]` Jason Ku（Meta）2026 技术求职路线图

### learn-agent 系列

来自 [LienJack/learn-agent](https://github.com/LienJack/learn-agent) 的系统化技术博客，覆盖 AI Agent、Claude Code 源码解析、Agent 设计范式、Build Harness 教程和 Learn LLM。

- [[lienjack/README|learn-agent 索引]] — 已同步到 `lienjack/` 目录的完整入口

### AI 伦理与人权

- [[AI伦理/生成式AI的人权代价——国际特赦组织2026报告]] — `[官方机制]` 国际特赦组织 2026 重磅报告总览
- [[AI伦理/生成式AI与国际人权法——法律框架分析]] — `[官方机制]` 国际人权法框架分析
- [[AI伦理/生成式AI人权风险——案例、数据与公司回应]] — `[官方机制]` 五大核心问题的案例、数据与公司回应

## 相关笔记

- [[提示词/README|提示词]] — AI 提示词模板和技巧
- [[llm-from-scratch/README|LLM 从零实现]] — 深度学习底层原理
- [[兴趣阅读/README|兴趣阅读]] — AI 相关读书笔记

> 最后更新: 2026-06-29
