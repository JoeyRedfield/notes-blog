---
tags: [index]
---

# AI 相关

这里存放 AI 应用开发、Claude Code、Agent 与自动化、工具与发布、学习路线、AI 编码实践和 AI 伦理相关内容。

## 内容索引

### 学习路线

- [[ai应用开发路线参考]] — AI 应用开发学习路线
- [[AI应用开发学习库.base]] — 学习库

### AI 工具使用与自我管理

- [[AI 工具与注意力管理——从 ADHD 放大器到自律工具]] — AI 编码工具的注意力陷阱与自律对策：意图三问、时间盒、三角循环嵌入

### Claude Code

- [[Claude Code/Claude Code Skills 与 MCP 精华笔记]] — 32 个 Skills + 8 个 MCP 速查与安装指南
- [[Claude Code/ECC（Everything Claude Code）知识手册]] — ECC 项目全面知识：是什么、怎么用、何时用
- [[Claude Code/Claude Code 接入 DeepSeek 完整配置]] — settings.json 完整配置模板与模型路由说明
- [[Claude Code/Claude Code 切换 API、Resume 与缓存命中学习笔记]] — API 切换、Session Resume 机制与 Prompt Caching 缓存命中策略实践笔记
- [[Claude Code/Claude Code CLI 新会话检查清单]] — 确认 MCP 与 hooks 是否在新会话里真正生效
- [[Claude Code/Claude Code 源码未文档化功能挖掘]] — 源码级未文档化功能：Hook 响应字段、Skill/Agent 隐藏 frontmatter、YOLO Classifier、自学习回路
- [[Claude Code/把一本书做成 AI Skill 方法论]] — 六步把一本书变成可调用的 AI skill：纯文本提取→结构映射→台账提炼→skill 生成→召回测试，附 Prompt 模板
- [[Claude Code/Claude Code 记忆系统——与 CLAUDE.md 的区别及构建方法]] — 跨会话持久化记忆系统：结构与加载机制、四种类型、与 CLAUDE.md 的受众/内容/生命周期边界、三步日常积累策略

### Agent 与自动化

- [[Agent与自动化/AI Harness（驾驭层）知识手册]] — Agent 工程第三波范式：定义、架构、演进与各大玩家实践
- [[Agent与自动化/AI Agent 自动化任务方案对比]] — 传统 Cron vs Codex vs Claude Routines 三种范式对比与选型
- [[Agent与自动化/项目目录里 Codex 计划 + Claude Code CLI 开发工作流模板]] — 适合"Codex 做计划、Claude 做实现"的项目内工作流
- [[Agent与自动化/Codex 写计划、Claude Code CLI 写代码：模型与成本选型建议]] — 结合 GPT-5.4 / GPT-5.5 与 DeepSeek V4 Pro 的实际分工建议
- [[Agent与自动化/上海十五五规划-AI智能体政策解读]] — 上海"十五五"服务业规划首次将多模态 AI 智能体列为重点方向
- [[Agent与自动化/AI时代软件开发职业方向]] — AI 时代软件开发程序员的两个务实方向：AI Agent 应用开发 + AI 赋能后端
- [[Agent与自动化/Harness Engineering——人类掌舵 Agent 执行]] — Ryan Lopopolo (OpenAI) 演讲：Code is free，如何构建 Agent 驾驭层让 AI 完成完整软件工程
- [[Agent与自动化/Agentic Engineering 实战技巧集（2026年6月）]] — @mvanhorn 的 22 个 Agentic Engineering 实战技巧：CE plan 工作流、Skills 编写、笔记即知识库、Claude+Codex 双引擎等
- [[Agent与自动化/Claude Code Dynamic Workflows 动态工作流]] — CLI 动态工作流机制：Claude 自编 JS 编排脚本、六大 Agent 协调模式（扇出/对抗/锦标赛等）、对抗三大失败模式
- [[Agent与自动化/Loop Engineering]] — Addy Osmani：从 prompt engineering 到 loop engineering 的范式转变，五大构建块 + 状态记忆的完整自主循环设计

### AI 编码实践

- [[AI编码实践/AI编码全流程工作流——Matt Pocock 工作坊]] — Matt Pocock 2 小时工作坊：从需求到部署的完整 AI 编码六阶段流程（Grill Me → PRD → Kanban → AFK TDD → QA）
- [[AI编码实践/软件基础在AI时代更重要——Matt Pocock]] — Matt Pocock 演讲：AI 时代软件基础更重要、五大失败模式与经典解药
- [[AI编码实践/AI编码能力提升路线]] — 基于当前背景梳理的六大 AI 编码提升方向
- [[AI编码实践/三角循环——AI编码核心概念内化记录]] — 交互式 Review 学习记录：五大知识点内化过程与自我检验结果
- [[AI编码实践/inbound-order-PRD]] — 入库单管理系统 PRD：完整需求文档与设计决策
- [[AI编码实践/inbound-order-实战记录]] — AI 编码全流程实战：从 Grill Me → PRD → Issues → TDD 完整走通入库单管理系统

### 工具与发布

- [[工具与发布/MemPalace 学习笔记]] — 本地优先 AI 记忆系统：架构、代码阅读路线与上手方法
- [[工具与发布/MarkItDown 文档转 Markdown 工具]] — 微软开源工具，将 Word/PDF/PPT 等转为 Markdown，配合 LLM 知识库摄入
- [[工具与发布/Quartz GitHub Pages 博客发布工作流]] — 从 Obsidian notes 到 Quartz/GitHub Pages 的公开发布流程
- [[工具与发布/Quartz GitHub Pages 子路径跳转问题排查记录]] — 记录 `/notes-blog` 丢失的根因、修复和验证方法

### 观点与趋势

- [[Agentic Coding 与专业知识的持久回报]] — Anthropic 官方研究：40 万次会话分析，领域专长 > 编程背景决定 AI 编码成功率
- [[2026年学编程路线与Agentic Engineering]] — Tina Huang 2026 年编程学习路线：从 Vibe Coding 到 Agentic Engineering 的范式演进
- [[技术面试的终结与人才评估的未来]] — Steve Yegge 论技术面试为何消亡：Campfire 模型、可携带成就记录、AI 如何加速变革
- [[AI原生工程团队运作实践]] — Fiona Fung 演讲：Claude Code 团队在 AI 原生时代如何重写规划、审查、团队构成等工程规范
- [[斯坦福法学院研究：AI法律推理超越教授]] — 斯坦福法学院盲评研究：AI 合同法答疑 75% 胜率、危害标记率仅 3.5%（低关联）
- [[2026年技术求职路线图与AI技能选择——Meta工程师视角]] — Jason Ku（Meta 工程师）2026 年技术求职路线图：就业市场分析、三阶段策略、三个高价值 AI 项目方向

### learn-agent 系列

来自 [LienJack/learn-agent](https://github.com/LienJack/learn-agent) 的系统化技术博客，覆盖 AI Agent、Claude Code 源码解析、Agent 设计范式、Build Harness 教程和 Learn LLM。

- [[learn-agent/README|learn-agent 索引]] — 全部 100+ 篇文章的完整索引

### AI 伦理与人权

- [[AI伦理/生成式AI的人权代价——国际特赦组织2026报告]] — 国际特赦组织 2026 重磅报告总览：生成式 AI 与五大核心人权问题
- [[AI伦理/生成式AI与国际人权法——法律框架分析]] — 隐私权、平等与非歧视、言论自由、思想自由、商业人权标准的法律分析
- [[AI伦理/生成式AI人权风险——案例、数据与公司回应]] — 五大核心问题的具体案例、关键研究数据与 AI 公司回应详情

## 相关笔记

- [[提示词/README|提示词]] — AI 提示词模板和技巧
- [[llm-from-scratch/README|LLM 从零实现]] — 深度学习底层原理
- [[兴趣阅读/README|兴趣阅读]] — AI 相关读书笔记

> 最后更新: 2026-06-03
