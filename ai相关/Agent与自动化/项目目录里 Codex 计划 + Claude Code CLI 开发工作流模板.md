---
title: "项目目录里 Codex 计划 + Claude Code CLI 开发工作流模板"
created: 2026-05-26
tags:
  - "workflow"
  - "codex"
  - "claude-code"
  - "mempalace"
  - "ai-agent"
source_type: experimental-observation
---

# 项目目录里 Codex 计划 + Claude Code CLI 开发工作流模板

> 适用场景：`Codex` 和 `Claude Code CLI` 都在**同一个代码项目目录**下工作。  
> 分工建议：`Codex` 负责计划、拆解、澄清边界；`Claude Code CLI` 负责按计划实现、调试、落代码。

## 一、核心原则

不要把“当前代码项目的计划”默认写回个人 `notes`。  
更推荐：

- 个人长期知识放在 `notes`
- 当前项目计划放在**当前项目目录**

这样好处是：

1. 计划和代码天然同目录
2. `Codex` / `Claude Code CLI` 都能直接读
3. 计划、决策、debug 记录不会和个人学习笔记混在一起

## 二、推荐目录结构

项目里建议至少有一个轻量文档区：

```text
project-root/
  docs/
    plan/
      2026-05-26-任务规划.md
    decisions/
      2026-05-26-技术决策.md
    debug/
      2026-05-26-问题排查.md
```

如果你不想分这么细，最小化也可以：

```text
project-root/
  docs/
    current-plan.md
    debug-log.md
```

## 三、推荐工作流

### Step 1：先在项目目录里让 Codex 写计划

计划文档至少写清楚：

- 目标
- 边界
- 风险点
- 实施步骤
- 验收标准

最小模板：

```md
# 任务计划

## 目标

## 不做什么

## 现状

## 实施步骤

## 风险与回滚点

## 验收标准
```

### Step 2：如果项目也接了 MemPalace，就更新项目记忆

在项目目录里执行：

```bash
mempalace init .
mempalace mine .
```

如果之前已经初始化过，通常只需要：

```bash
mempalace mine .
```

### Step 3：再让 Claude Code CLI 按计划实现

给 Claude 的指令建议尽量明确，例如：

- 先读 `docs/plan/current-plan.md` 再开始实现
- 按计划步骤执行，不要自行扩大范围
- 每完成一个阶段，更新对应 debug/decision 文档

### Step 4：关键改动后补一次项目文档

建议补：

- 为什么这样改
- 实际和原计划哪里不一样
- 剩余问题

### Step 5：阶段结束后再 `mine` 一次

```bash
mempalace mine .
```

这样后续无论是 `Codex` 还是 `Claude`，都能在项目目录里回忆到最新上下文。

## 四、Codex 和 Claude 的分工建议

### Codex 更适合做的事

- 需求拆解
- 技术路线比较
- 计划文档编写
- 风险预判
- 验收标准整理
- 任务复盘

### Claude Code CLI 更适合做的事

- 按计划直接改代码
- 修 bug
- 跑命令
- 看报错
- 调试实现细节
- 快速迭代

一句话：

> `Codex` 更像架构/项目推进搭子，`Claude Code CLI` 更像执行实现搭子。

## 五、CLI 要不要挂 hooks？

我的建议分两档。

### 结论先说

> **Claude Code CLI：建议挂 hooks。**  
> **Codex：不急着挂。**

### 为什么 Claude Code CLI 更适合挂 hooks

因为你准备用它来：

- 实现代码
- 调试
- 长时间连续改动

而 hooks 最有价值的地方就是：

- 在会话关键节点自动保存上下文
- 在压缩前自动存档
- 降低“写到一半上下文散掉”的风险

所以它更适合承担“自动记忆沉淀器”这个角色。

### 为什么 Codex 不急着挂 hooks

因为你现在更偏向让 Codex：

- 写计划
- 写文档
- 理清思路

这些内容本来就更容易直接落成 Markdown 文件。  
对 Codex 来说，**把计划写进项目文档本身，就已经是一种稳定保存**。

所以 Codex 当前阶段：

- 有 MCP 就够用了
- hooks 不是刚需

### 最实用的决策

如果你现在只想先上一套不折腾的版本，我建议：

1. `Codex`：只用 MCP，不挂 hooks
2. `Claude Code CLI`：后续优先挂 hooks

## 六、Codex / Claude / CLI / MCP / hooks 对照表

先记住一句话：

> `mempalace` 这个 CLI 本身是同一个；差别主要来自 **MCP 有没有接上**、**hooks 有没有挂上**、**当前项目有没有 `init/mine`**。

| 项目 | Codex | Claude Code CLI | 当前判断 |
|---|---|---|---|
| 直接跑 `mempalace` 命令 | 可以 | 可以 | 两边本质上都在调用你本机同一个 `mempalace` |
| `mempalace init .` | 可以 | 可以 | 效果主要取决于当前所在项目目录 |
| `mempalace mine .` | 可以 | 可以 | 效果主要取决于当前项目内容是否发生变化 |
| `mempalace search "..."` | 可以 | 可以 | 都是在查同一个 palace |
| Agent 直接调用 MemPalace 工具 | 要看 MCP | 要看 MCP | 不取决于 CLI 命令本身，而取决于当前项目会话是否接上 `mempalace-mcp` |
| 会话自动沉淀 | 默认没有 | 有 hooks 时自动触发 | 当前更适合由 `Claude Code CLI` 承担 |
| 新项目是否自动可检索 | 不会 | 不会 | 都要先 `init`，再至少 `mine` 一次 |
| 新项目是否自动能用 MCP 工具 | 看配置 | 看配置 | 新项目默认不要假设“自动有” |

### 6.1 CLI 层

这些命令在 `Codex` / `Claude` 里差别通常不大：

```bash
mempalace init .
mempalace mine .
mempalace search "关键词"
```

只要：

- 在同一个项目目录
- 用的是同一台机器
- 没有特殊环境变量差异

那结果通常就是一样的。

### 6.2 MCP 工具层

这里差别会明显变大。

- 终端里 `mempalace search "xxx"` 能跑
- 不代表 Agent 会话里一定能直接调用 `mempalace_search`

因为能不能在对话里直接用 MemPalace，取决于：

- 当前项目有没有接上 `mempalace-mcp`
- 当前会话是不是读到了这份 MCP 配置

### 6.3 hooks 层

这里也不能混淆。

- hooks 负责会话关键时机的自动沉淀
- `mine` 负责把项目文件真正挖进 palace

也就是说：

> **挂了 hooks，不等于项目文件已经自动完成 `mine`。**

### 6.4 最容易混淆的几个点

| 名称 | 负责什么 | 不负责什么 |
|---|---|---|
| `mempalace init .` | 把当前项目注册为一个可管理的 MemPalace 项目 | 不负责把全部文件自动持续更新进记忆库 |
| `mempalace mine .` | 把项目文件真正入库并更新索引 | 不负责会话自动沉淀 |
| MCP | 让 Agent 能直接调用 MemPalace 工具 | 不负责自动把项目内容挖进去 |
| hooks | 在会话关键节点自动沉淀上下文 | 不负责替代 `init` / `mine` |
| `resume` | 恢复会话 | 不负责给新项目自动完成初始化 |

## 七、最小可执行版本

如果你想用最轻的方式开始，一个项目只做这几件事就够：

1. `Codex` 在项目里写 `docs/current-plan.md`
2. `Claude Code CLI` 开始前先读这个计划
3. 改完一轮后更新 `docs/debug-log.md`
4. 跑一次：

```bash
mempalace mine .
```

这已经是一套能工作的闭环了。

## 八、推荐口令

### 对 Codex 说

- 帮我把这个需求拆成可执行计划，落到 `docs/current-plan.md`
- 给我补一版验收标准，不要写实现代码
- 帮我把今天的改动整理成决策记录

### 对 Claude Code CLI 说

- 先读 `docs/current-plan.md`，再开始实现
- 按计划步骤执行，不要扩大范围
- 完成后把偏差记录到 `docs/debug-log.md`

## 九、最终建议

如果你之后真按这套长期使用，我建议项目里至少保留这两个文件：

- `docs/current-plan.md`
- `docs/debug-log.md`

它们的性价比最高，几乎不会后悔。
