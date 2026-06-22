---
tags: [index]
---

# Claude Code

Claude Code CLI 的配置、技巧、生态快照与源码分析。

> [!note]
> 这个目录里的页面时效性差异很大：
> - **相对稳定**：记忆机制、skills 目录结构、会话恢复的基本原理
> - **强时效**：模型配置、第三方兼容接入、价格、社区生态数据、安装命令
>
> 因此阅读顺序建议是：
> 1. 先看官方机制类页面
> 2. 再看第三方接入和生态快照页
> 3. 复用配置前一定二次核对官方文档

## 阅读建议

- 想理解 Claude Code 自己怎么工作：先看 [[Claude Code 记忆系统——与 CLAUDE.md 的区别及构建方法]]
- 想做第三方接入：先看 [[Claude Code 接入 DeepSeek 完整配置]]
- 想看会话恢复、缓存与 API 切换：看 [[Claude Code 切换 API、Resume 与缓存命中学习笔记]]
- 想看社区生态和工具扩展：看 [[Claude Code Skills 与 MCP 精华笔记]]

## 内容索引

- [[Claude Code Skills 与 MCP 精华笔记]] — 社区生态快照：Skills/MCP 的概念、常见安装方式与 2026 年上半年生态变化；不是纯官方手册
- [[ECC（Everything Claude Code）知识手册]] — ECC 项目全面知识：是什么、怎么用、何时用；其中 stars、数量、兼容矩阵属于时间快照
- [[Claude Code 接入 DeepSeek 完整配置]] — 强时效配置页：`settings.json` 模板、模型路由、环境变量与第三方兼容接入注意事项
- [[Claude Code 切换 API、Resume 与缓存命中学习笔记]] — 会话恢复、API 切换与缓存观察；其中“跨后端缓存是否继承”属于实验性判断
- [[Claude Code CLI 新会话检查清单]] — 确认 MCP 与 hooks 是否在新会话里真正生效
- [[Claude Code 源码未文档化功能挖掘]] — Hook 响应字段、Skill/Agent 隐藏 frontmatter、YOLO Classifier、自学习回路等源码级功能
- [[把一本书做成 AI Skill 方法论]] — 偏实操方法论，适合作为 skill 生产流程参考，不是 Claude Code 官方能力说明
- [[Claude Code 记忆系统——与 CLAUDE.md 的区别及构建方法]] — 官方机制对齐版：CLAUDE.md 与 auto memory 的边界、作用域与加载方式

## 相关笔记

- [[AI Harness（驾驭层）知识手册]] — Agent 工程范式
- [[AI Agent 自动化任务方案对比]] — 自动化方案选型
- [[MemPalace 学习笔记]] — AI 记忆系统
