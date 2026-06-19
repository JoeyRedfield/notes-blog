---
tags: [ai, agent, automation]
created: 2026-06-17
source: "https://addyosmani.com/blog/loop-engineering/"
author: "[[Addy Osmani]]"
raw: "[[raw/Loop Engineering]]"
---

# Loop Engineering

**Loop Engineering = 不再手动 prompt agent，而是设计一个系统来替你 prompt。** 这里的 loop 本质是一个递归目标：定义一个目的，AI 持续迭代直到完成。

> Peter Steinberger："You shouldn't be prompting coding agents anymore. You should be designing loops that prompt your agents."
> Boris Cherny（Claude Code 负责人）："I don't prompt Claude anymore. I have loops running that prompt Claude and figuring out what to do. My job is to write loops."

## 核心转变

过去两年：写好 prompt → 读回复 → 写下一个 prompt → 循环。Agent 是工具，你全程握着它。

现在：构建一个小系统来**发现工作、派发任务、检查结果、记录完成、决定下一步**，让系统去戳 agent，而不是你。

Loop Engineering 比 [[Agent与自动化/AI Harness（驾驭层）知识手册|AI Harness]] 高一层——Harness 是单个 agent 的运行环境，Loop 是在 timer 上运行的 harness，会自己孵化 helper、自己喂自己。

## 五大构建块 + 状态记忆

### 1. Automations（自动化调度）—— 心跳

让 loop 成为真正的循环而非一次性运行。按时间表自动触发，做发现和 triage。

| 平台 | 实现方式 |
|------|---------|
| **Codex** | Automations tab：选项目、prompt、频率、环境；结果进 Triage inbox；`/goal` 跑直到完成 |
| **Claude Code** | `/loop`（定时重跑）、`/goal`（跑到条件满足为止）、cron 定时任务、hooks、GitHub Actions |

`/goal` 的关键设计：每轮结束后用一个**独立小模型**判断是否完成，而不是让写代码的 agent 自己打分（maker-checker 分离）。

### 2. Worktrees（工作树隔离）—— 并行不乱

多个 agent 同时跑时，文件冲突是核心失败模式。Git worktree 在独立工作目录 + 独立分支上运行，共享同一 repo 历史，互不干扰。

| 平台 | 实现方式 |
|------|---------|
| **Codex** | 内置 worktree per thread |
| **Claude Code** | `git worktree`、`--worktree` flag、subagent 的 `isolation: worktree` |

> 关键限制：worktree 解决的是机械冲突，**你的审查带宽才是真正的天花板**（[[Agent与自动化/Harness Engineering——人类掌舵 Agent 执行|编排税]]）。

### 3. Skills（技能）—— 不再每次都解释项目

Skill 是把项目知识写在外面的机制——约定、构建步骤、"我们因为那次事故才这样做"——写一次，agent 每次运行都读到。没有 skills，loop 每轮从零重新推导整个项目。

Codex 和 Claude Code 都用相同格式：`SKILL.md` 文件夹，内有指令和元数据，可选脚本/参考/资源。

> Skill 是创作格式，Plugin 是分发方式。想跨 repo 共享或打包多个 skill → 打包成 plugin。

### 4. Plugins / Connectors（连接器）—— 触及真实工具

基于 MCP，让 agent 能读 issue tracker、查数据库、调 staging API、发 Slack 消息。两边都支持 MCP，为一边写的 connector 通常另一边也能用。

区别：没有 connector 的 agent 说"这是修复方案"，有 connector 的 loop **自己开 PR、关联 Linear ticket、CI 绿了自动 ping 频道**。

### 5. Sub-agents（子 agent）—— maker 和 checker 分离

loop 里最有用的结构设计：**写代码的人和检查代码的人不能是同一个**。写代码的模型给自己的作业打分太宽容。

| 平台 | 实现方式 |
|------|---------|
| **Codex** | `.codex/agents/` 定义 TOML 文件，按需 spawn，并行运行后合并结果 |
| **Claude Code** | `.claude/agents/` 定义子 agent，agent teams 传递工作 |

典型分工：一个探索、一个实现、一个对照 spec 验证。这也是 Claude Code `/goal` 底层做的事——新模型判断 loop 是否完成，而非做事的模型自己判断。

> 子 agent 消耗更多 token（每个独立做模型推理 + 工具调用），在值得花钱买第二意见的地方使用。

### 6. State（状态记忆）—— 脊梁骨

一个 markdown 文件或 Linear board，活在单次对话之外，记录**已完成**和**下一步**。听起来太简单，但这是每个长运行 agent 依赖的关键机制——模型在运行间遗忘一切，记忆必须在磁盘上而非上下文中。

## 一个完整的 Loop 长什么样

1. 每天早上，一个 automation 在 repo 上运行
2. 它的 prompt 调用一个 triage skill，读取昨天的 CI 失败、open issues、最近 commits
3. 发现的内容写入 markdown 文件或 Linear board
4. 对每个值得处理的问题，开独立 worktree，派一个子 agent 写修复
5. 第二个子 agent 对照项目 skills 和已有测试审查该修复
6. Connectors 让 loop 自己开 PR、更新 ticket
7. Loop 处理不了的进 triage inbox 等你
8. 状态文件记住：哪些试过了、哪些通过了、哪些还开着——明天早上继续

**你设计了一次，没有手动 prompt 任何一步。** 这就是 Steinberger 的核心观点。

## Loop 仍然不会替你做的事

三个问题随着 loop 变强反而更尖锐：

1. **验证仍然在你**：无人值守的 loop = 无人值守地犯错。拆分 verifier sub-agent 只是让"完成"声明更有意义，但"完成"是声明而非证明。你的工作是交付你**确认能跑**的代码。

2. **理解力仍然会腐化**：loop 越快交付你没写的代码，已有代码和你真正理解的东西之间的差距就越大。这就是 [[AI编码实践/三角循环——AI编码核心概念内化记录|理解负债]]——平滑的 loop 只会让它增长更快，除非你阅读 loop 产出的内容。

3. **舒适的姿态最危险**：loop 自己跑起来后，很容易不再有自己的判断，loop 给什么就拿什么。这就是**认知投降**。用心设计 loop 是解药，逃避思考时设计 loop 是加速器——同样动作，相反结果。

## 个人关联

这篇文章描述的五块积木与你已有的知识体系精确对应：

| 积木 | 你已有的积累 |
|------|-------------|
| Automations | 已了解 `/loop`、cron、hooks 机制（[[Agent与自动化/AI Agent 自动化任务方案对比]]） |
| Worktrees | 使用 `git worktree` 进行 Agent 隔离（[[Agent与自动化/Claude Code Dynamic Workflows 动态工作流]]） |
| Skills | 已安装 39 个 skills，理解 SKILL.md 格式和渐进式披露（[[Claude Code/Claude Code Skills 与 MCP 精华笔记]]） |
| Plugins/Connectors | MemPalace MCP 已在使用（[[工具与发布/MemPalace 学习笔记]]） |
| Sub-agents | 理解 maker-checker 分离、fan-out 模式（[[Agent与自动化/Claude Code Dynamic Workflows 动态工作流]]） |
| State | LLM Wiki 的 `log.md`、`index.md` 就是 state 机制 |

**当前阶段**：处于从"手动 prompt agent"到"设计 loop"的过渡期。已经在用 skills 和 `/goal`，但尚未构建一个真正的自主 loop（自动化调度 + worktree 隔离 + sub-agent 审查 + 状态跟踪的完整闭环）。

**可能的 loop 场景**：
- 每天早上自动 triage CI 失败和最近 commits，写摘要到笔记库
- 业务系统代码库的定期代码质量扫描 → 自动开 issue
- 数据库 migration 脚本的自动审查（对照项目 skills 中的规范）

**关键提醒**：loop 越强，越需要保持三角循环（你设计 → AI 执行 → 你审查）的纪律。Loop 不是让你退出循环，而是让你的审查精力从"每步都盯"升级为"盯关键决策点"。

## 延伸阅读

- [[Agent与自动化/AI Harness（驾驭层）知识手册]] — Loop 的下层基础：单 agent 的驾驭环境
- [[Agent与自动化/Agentic Engineering 实战技巧集（2026年6月）]] — 实操技巧：CE plan、Skills 编写、双引擎
- [[Agent与自动化/Claude Code Dynamic Workflows 动态工作流]] — Claude Code 六大编排模式
- [[AI编码实践/三角循环——AI编码核心概念内化记录]] — 你设计→AI执行→你审查 的心智模型
- [[Agent与自动化/Harness Engineering——人类掌舵 Agent 执行]] — Ryan Lopopolo：Code is free，人类管设计
- [[AI原生工程团队运作实践]] — Claude Code 团队如何运作
