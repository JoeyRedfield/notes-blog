---
tags: [ai, agent, automation]
created: 2026-06-17
updated: 2026-06-22
source: "https://addyosmani.com/blog/loop-engineering/"
references:
  - "https://x.com/0xCodez/status/2064374643729773029"
  - "https://www.anthropic.com/research/building-effective-agents"
  - "https://developers.openai.com/codex/app/automations"
  - "https://modelcontextprotocol.io/docs/getting-started/intro"
  - "https://www.anthropic.com/institute/recursive-self-improvement"
author:
  - "[[Addy Osmani]]"
  - "[[@0xCodez]]"
raw:
  - "[[raw/Loop Engineering]]"
  - "[[raw/Loop engineering the 14-step roadmap from prompter to loop designer..md]]"
source_type: community-snapshot
---

# Loop Engineering

**Loop Engineering = 不再手动 prompt agent，而是设计一个系统，替你发现工作、分派任务、验证结果、记录状态，并决定下一步。**

它不是“提示词工程的加强版”，而是把杠杆点从“写好一句 prompt”上移到“设计一个可重复运行的闭环”。

与 [[Agent与自动化/AI Harness（驾驭层）知识手册|AI Harness]] 的关系是：Harness 更像**单个 agent 的运行环境**，Loop 则是**跑在时间轴上的编排层**。它会定时触发、调用 skill、拉起子 agent、写回状态。

> [!note]
> 这页整合了两份来源：
> 1. Addy Osmani 的长文《Loop Engineering》
> 2. `@0xCodez` 的“14-step roadmap”长帖
> 前者给出总体框架，后者补齐了“什么时候值得上 loop、最小可行 loop、常见失败模式、安全税”。

## 一、先别急着造 loop：先过 4 条件测试

不是所有任务都值得 loop 化。满足下面 4 条件，loop 才大概率赚回成本：

1. **任务会重复出现。** 一次性任务通常是一条好 prompt 更划算。
2. **验证能自动化。** 至少要有测试、类型检查、构建或 linter 之一。
3. **预算能承受重试和探索。** Loop 会重复读上下文、重试、分叉尝试，token 消耗会显著上升。
4. **Agent 拥有“高级工程师工具”。** 它得能读日志、运行代码、复现问题，而不是闭眼瞎改。

如果缺任意一项，loop 很可能只是把“你手动盯梢”的成本，换成“机器烧 token + 你事后收拾残局”的成本。

## 二、30 秒任务筛查：这件事现在该不该做成 loop

面对一个具体任务，可以再做一轮更战术的判断：

- 这事是否至少每周出现一次
- 是否存在明确的自动拒绝门，比如 test / build / typecheck / lint
- Agent 是否能在本地或隔离环境里真正运行它改过的代码
- 是否设了硬停止条件，比如 token 上限、迭代次数、时间上限
- 是否在 merge、deploy、依赖升级这类不可逆动作前保留人工审批

只要有一项答不上来，就先别上 loop，先做成**可重复的手工流程**。

## 三、五大构建块 + 一个状态层

### 1. Automations：心跳

Loop 先得能自己被触发。没有自动调度，就只是“你手动多跑了几次”。

OpenAI 的 Codex 官方文档把 `Automations` 定义为后台定时任务，结果会进入 inbox，没有发现则自动归档。Claude Code 侧则通常由 `/loop`、`/goal`、cron、hooks 或 GitHub Actions 组合出同样形态。

这里最关键的不是“定时”，而是**停止条件不能由执行者自己说了算**。`/goal` 这类机制的价值，就是把“做事的人”和“判断做完的人”拆开。

### 2. Worktrees：并行隔离

多 agent 并行时，第一层问题不是智能，而是文件冲突。

`git worktree` 提供的是**物理隔离**：不同 checkout、不同分支、共享同一仓库历史。它解决机械冲突，但不解决更高层的问题：**你的审查带宽才是真正的上限**。

### 3. Skills：把项目知识写在外面

没有 skill，agent 每一轮都要重新“猜”你的项目约定。

Skill 的本质不是提示词模板，而是**把长期有效的项目意图外置成稳定说明**：目录约定、构建步骤、禁区、已知坑、验收规则。写一次，每轮都能重读。

### 4. Connectors / MCP：接入真实世界

只会读写文件的 loop 很弱。

MCP 官方把它定义为连接 AI 应用与外部系统的开放协议。接上 GitHub、Linear、Slack、数据库、错误追踪系统后，loop 才能从“告诉你该怎么做”升级成“自己开 PR、回写 ticket、发通知、查线上信号”。

### 5. Sub-agents：maker 和 checker 分离

Loop 中最值钱的结构设计，通常不是更大的模型，而是**把写的人和审的人拆开**。

这和 Anthropic 在 2024-12-19 官方文章里总结的 `evaluator-optimizer` 模式是同一条线：一个模型生成，另一个模型评估并反馈，再进入下一轮。

### 6. State：让 loop 真正“接着上次干”

状态文件看起来最土，但常常最重要。

它可以是 `STATE.md`、Linear board、Issue 列表，关键是它必须存在于**单轮对话之外**。因为模型会忘，但仓库不会忘。

状态层至少应记录：

- 上次 run 的时间与结果
- 当前进行中的分支或任务
- 已完成项
- 已升级给人工处理的问题
- 新学到的环境约束或排错结论

## 四、14 步路线图：从“会 prompt”到“会设计 loop”

`@0xCodez` 的 14 步可以压成 3 层：

### 第一层：先判断值不值得

1. 明确 loop engineering 的定义：你替换的不是工程师，而是“持续手动下 prompt 的自己”。
2. 做 4 条件测试：重复性、自动验证、预算、工具。
3. 看经济性：谁会受益，谁会被 token 成本反噬。
4. 做 30 秒任务筛查：针对某个具体任务判定现在该不该 loop 化。

### 第二层：掌握 5 个构建块

5. 学会用 automations 作为触发心跳。
6. 用 worktrees 保证并行隔离。
7. 用 skills 固化项目知识。
8. 用 connectors / MCP 接入真实工具链。
9. 用 sub-agents 做 maker-checker 分离。

### 第三层：把 loop 做对，而不是只是做出来

10. 给 loop 一个持久 state。
11. 从最小可行 loop 起步，而不是一上来就搞 swarm。
12. 识别“Ralph Wiggum loop”这类假完成、静默失败。
13. 警惕理解负债与认知投降。
14. 把安全税算进去，因为无人值守 loop 也是无人值守攻击面。

## 五、最小可行 Loop：先做四件套

真正值得先做的，不是“大型自主代理系统”，而是最小闭环：

1. **一个 automation**
2. **一个 skill**
3. **一个 state file**
4. **一个 objective gate**

这里的 `gate` 必须是客观门禁，而不是“再叫一个 agent 来 review 一下”。

可接受的 gate：

- 测试通过 / 失败
- 类型检查通过 / 失败
- 构建成功 / 失败
- linter 返回零 / 非零

不够硬的 gate：

- “看起来差不多完成了”
- “另一个 agent 觉得可以”
- “这次 diff 不大”

推荐顺序不是“先自动化”，而是：

1. 先把一次手工 run 做稳定
2. 再把这次手工 run 提炼成 skill
3. 再把它包进 loop
4. 最后再上 schedule

## 六、Loop 最常见的失败模式

### 1. 没有客观 gate

这是最常见也最致命的错误。没有客观 gate，loop 只是在不断生成“自我感觉良好”的输出。

### 2. 写的人自己验

这就是 maker 给自己打分。它会系统性高估“完成度”。

### 3. 没有 state

第二天从零开始，不叫持续系统，只叫重复劳动。

### 4. 停止条件模糊

“看起来好了”“差不多完成”这类条件，天然会诱发假完成。

### 5. 没有预算上限

Loop 会天然倾向于多看一点、多试一次、多总结一轮。没有 cap，它就会把你的 token 当免费资源。

### 6. 把 loop 用在判断型工作

架构改造、权限系统、支付流程、模糊产品需求，这类工作不适合第一批 loop。

### 7. 把安装来的 skill 当可信输入

Skill 本身也是指令面。社区 skill、第三方 connector、宽权限 MCP，都可能把 prompt injection 或权限扩张带进 loop。

## 七、两个长期风险：理解负债与认知投降

Loop 越顺，越容易有两个副作用：

- **理解负债**：仓库里存在的代码，和你真正理解的代码，差距越来越大。
- **认知投降**：你不再形成独立判断，而是开始默认“loop 给的就是对的”。

这两个问题没有银弹，只能靠工程纪律缓解：

- 读 diff，而不是只读摘要
- 抽查 gate 是否真的能拦住你关心的失败模式
- 限制 loop 只做小而可机检的变更
- 在设计 loop 时做双人审视，而不是一个人闷头搭

## 八、安全税：无人值守 loop 也是无人值守攻击面

一旦 loop 能自动运行、自动写代码、自动接外部系统，它就天然变成安全边界的一部分。

重点风险包括：

- 自动生成的不安全代码被快速推进
- skill / connector 作为注入入口
- 调试日志泄露密钥
- 权限越开越大却长期不复审

所以 loop 的 gate 除了测试，还应该逐步补进：

- SAST / secret scanning
- 依赖审计
- 高风险目录禁写规则
- 人工审批闸门

## 九、什么任务最适合作为第一批 loop

好的第一批 loop 通常有三个共同点：**重复、可机检、低业务风险**。

典型例子：

- CI 失败归因与摘要
- 依赖升级 PR 草稿
- lint-and-fix
- flaky test 复现
- 强测试代码库中的 issue-to-PR draft

不适合一开始就 loop 化的任务：

- 架构重写
- 登录、权限、支付
- 生产部署
- 目标模糊的产品探索

## 十、和你现有知识体系的连接

这篇笔记可以直接挂到你已经有的几条主线下：

- [[Agent与自动化/AI Harness（驾驭层）知识手册]]：Harness 是单 agent 的运行壳，Loop 是上层编排壳
- [[Agent与自动化/Claude Code Dynamic Workflows 动态工作流]]：动态工作流关注编排模式，Loop 更强调长期运行闭环
- [[Agent与自动化/Harness Eval——把工作流评测变成一场考试]]：Loop 不是跑起来就行，还需要用评测看 accepted change 成本
- [[Agent与自动化/Is it agentic enough——如何评测 Agent 是否真会用你的工具]]：工具表面是否好用，会直接决定 loop 的真实收益
- [[Claude Code/Claude Code Skills 与 MCP 精华笔记]]：Skill 和 MCP 是让 loop 变得可持续、可接工具链的关键底座

## 十一、你当前最值得尝试的首个 loop 形态

以你现在的积累，最值得优先尝试的不是“自动写复杂业务代码”，而是**自动 triage + 人工审查**型 loop。

例如：

1. 每天定时扫描某个代码仓库的 CI 失败与最近提交
2. 调用一个 triage skill 分类原因
3. 把结果写入状态文件或 issue
4. 只对低风险、强可验证的问题起草修复
5. 保留人工合并闸门

这类 loop 的价值在于：它不会一上来就吞掉你的判断权，但能明显减少你在“发现问题、整理问题、重复试错”上的机械劳动。

## 来源

- Addy Osmani: [Loop Engineering](https://addyosmani.com/blog/loop-engineering/)
- `@0xCodez`： [Loop engineering: the 14-step roadmap from prompter to loop designer](https://x.com/0xCodez/status/2064374643729773029)
- Anthropic: [Building effective agents](https://www.anthropic.com/research/building-effective-agents)
- OpenAI Developers: [Automations – Codex app](https://developers.openai.com/codex/app/automations)
- MCP 官方文档: [Model Context Protocol Intro](https://modelcontextprotocol.io/docs/getting-started/intro)
- Anthropic: [When AI builds itself](https://www.anthropic.com/institute/recursive-self-improvement)
