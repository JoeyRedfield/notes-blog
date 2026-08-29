---
title: PI Agent 上下文归因插件设计
created: 2026-08-17
updated: 2026-08-17
tags:
  - note
  - ai
  - pi-agent
  - extension
  - context
  - design
status: proposed
source_type: design-proposal
---

# PI Agent 上下文归因插件设计

## 目标

开发一个全局 pi extension，通过 `/context-breakdown` 展示当前上下文大致由哪些活动构成，例如系统提示词、用户消息、assistant 输出、thinking、工具调用和工具结果。

## 能做到什么

Pi extension API 提供：

- `ctx.getContextUsage()`：当前总 token、窗口和百分比
- `ctx.sessionManager.buildContextEntries()`：compaction 后实际有效的 session 条目
- `ctx.sessionManager.getBranch()`：当前分支
- `ctx.getSystemPrompt()`：当前 pi 系统提示词
- `ctx.getSystemPromptOptions()`：工具描述、skills、上下文文件等结构化来源
- `message_end`、`tool_execution_end`、`session_compact`：触发更新
- `ctx.ui.custom()`：详细面板
- `ctx.ui.setStatus()`：footer 摘要

推荐输出：

```text
Context: 74.6K / 272K (27.4%)

Estimated sources:
  System prompt and tool schemas    7.2K   9.7%
  User messages                     1.4K   1.9%
  Assistant replies                 5.8K   7.8%
  Assistant reasoning               2.1K   2.8%
  Tool calls                        2.4K   3.2%
  Tool results                     54.0K  72.4%
  Protocol/accounting remainder     1.7K   2.2%

Largest contributors:
  read custom-provider.md          11.8K
  read models.md                   10.2K
  bash search session history       8.7K
```

## 精度边界

> [!important]
> 插件应明确使用 “estimated” 或“估算”。Provider 通常只返回整个请求的 usage，不返回每条消息经过真实 tokenizer 后的 token 数。

推荐采用“两层计量”：

1. **总量锚点**：`ctx.getContextUsage()`，尽可能接近 provider 实际值。
2. **来源权重**：按有效消息本地估算，再归一化到总量。

无法归因的差额单列为：

- 系统模板与工具 schema
- provider 序列化开销
- tokenizer 偏差
- API 协议或隐藏字段

不要按字符数直接宣称精确 token。可以先使用稳定启发式，后续再允许配置 tokenizer。

## 分类模型

| 类别 | 识别方式 |
|---|---|
| System prompt | `ctx.getSystemPrompt()` 与 `getSystemPromptOptions()` |
| User | `message.role === "user"` |
| Assistant text | assistant content 的 `text` block |
| Reasoning | assistant content 的 `thinking` block |
| Tool call | assistant content 的 `toolCall` 参数与名称 |
| Tool result | `message.role === "toolResult"`，再按 `toolName` 分组 |
| Compaction summary | compaction entry 转换后的 summary |
| Custom message | `custom_message` 或 `role === "custom"` |
| Remainder | 精确总量减去归一化前可解释项 |

对 `read` 工具可从调用参数提取文件名；对 `bash` 可生成脱敏、截断后的命令摘要。不要把完整工具输出再次放进报告。

## UI 方案

### MVP

只实现 `/context-breakdown` 命令：

- 默认展示总量、一级分类、前 10 个贡献项
- 使用 `ctx.ui.custom()` 打开只读面板
- 不向 LLM 发送报告
- 不注册 agent 可调用工具，避免增加工具 schema 和系统提示词本身

### 后续增强

- footer 只显示紧凑状态：`ctx 31% · tools 72%`
- 参数支持 `/context-breakdown tools`、`system`、`top 20`
- 在 `session_compact` 后重建统计
- 提供 JSON 导出，但默认写临时文件而非 session 消息

## 避免自我干扰

- UI 报告使用 `ctx.ui.custom()` 或 `ctx.ui.notify()`。
- 持久状态如有必要使用 `pi.appendEntry()`，custom entry 不进入 LLM context。
- 不使用 `pi.sendMessage()` 输出统计，否则报告自身会进入上下文。
- 不保存完整消息副本，只保存派生统计。
- 不在每个 streaming delta 上重算，优先在 `message_end`、`agent_settled` 或命令执行时计算。

## 开发与测试策略

**在新 session 开发，回到当前高占用 session 做回归验证。**

理由：

1. 当前 session 已被完整文档和搜索结果污染，继续开发会快速增加占用。
2. 新 session 有干净基线，可观察每种行为带来的增量。
3. 当前 session 是很好的真实样本，包含大型 read、bash 搜索、cacheRead 和窗口调整。
4. 不应先 compact 当前样本，否则逐条历史会被摘要折叠，降低归因验证价值。

建议流程：

1. 在新 session 创建 `~/.pi/agent/extensions/context-breakdown/`。
2. 实现纯函数：提取有效消息、分类、估算、归一化。
3. 为 user/assistant/toolResult/compaction/branch 编写单元测试。
4. 用 `/reload` 热加载。
5. 在新 session 制造小型可控样本。
6. 回到当前 session，执行 `/reload` 与 `/context-breakdown`。
7. 将结果与人工分析的 `74.6K / 272K` 和工具结果主导结论对照。

## MVP 验收标准

- [ ] 总量与 footer 基本一致
- [ ] 使用 `buildContextEntries()`，不会把废弃分支或 compaction 前无效历史重复统计
- [ ] 能按 user、assistant、thinking、tool call、tool result 分类
- [ ] 能按工具名和文件/命令摘要列出最大贡献项
- [ ] 明确展示估算误差和 remainder
- [ ] 报告本身不进入 LLM context
- [ ] `/reload`、`/new`、`/resume`、`/tree`、`/compact` 后仍可工作
- [ ] 不记录 API Key、Authorization header 或完整敏感命令

## 相关笔记

- [[PI Agent 上下文占用计算与诊断]]
- [[PI Agent 模型上下文窗口配置]]

## 本机依据

- 扩展文档：`@earendil-works/pi-coding-agent/docs/extensions.md`
- Session 格式：`@earendil-works/pi-coding-agent/docs/session-format.md`
- TUI 文档：`@earendil-works/pi-coding-agent/docs/tui.md`
