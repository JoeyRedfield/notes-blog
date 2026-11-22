---
tags: [ai, agent, multi-agent, orchestration]
created: 2026-10-28
source: "https://addyosmani.com/blog/code-agent-orchestra/"
raw: "[[raw/网页剪藏/The Code Agent Orchestra]]"
source_type: community-snapshot
author:
  - "[[Addy Osmani]]"
references:
  - "https://talks.addy.ie/oreilly-codecon-march-2026/"
  - "https://talks.addy.ie/oreilly-codecon-march-2026/overview/"
  - "https://arxiv.org/abs/2602.11988"
---

# Code Agent Orchestra——多 Agent 编码协作的模式与质量闸门

> 来源：Addy Osmani 在 O'Reilly AI CodeCon（2026-03）的演讲整理稿，2026-03-26 发布。主题是把「和单个 AI 结对编程」升级成「管理一支 agent 团队」时，真正要落地的三种编排模式、三档工具，以及靠什么保证产出可信。

> [!note]
> 这页回答：多 agent 编码有哪些形态、各自解决什么问题、什么时候该升级、质量闸门怎么搭。
>
> 这页不回答：
> - 单 agent 内部的 prompt / 上下文怎么写 → 见 [[Agent与自动化/Loop Engineering|Loop Engineering]]、[[Agent与自动化/AI Harness（驾驭层）知识手册|AI Harness]]
> - 团队组织与流程怎么改 → 见 [[AI原生工程团队运作实践]]
> - 官方编排机制的细节 → 见 [[Agent与自动化/Claude Code Dynamic Workflows 动态工作流|Claude Code Dynamic Workflows]]
>
> 定位是 **`[社区快照]`**：模式层面的判断相对稳定，但 Agent Teams 仍是实验特性，工具清单是 2026-03 的切片。本次入库时做了时效复核，见文末「时效性核对」。

## 一、核心转变：从 conductor 到 orchestrator

| | Conductor（指挥） | Orchestrator（编排） |
|---|---|---|
| Agent 数量 | 一个 | 多个 |
| 交互方式 | 同步、逐轮 | 异步、计划 + 定期查看 |
| 天花板 | 单个上下文窗口 | 每个 agent 各自一个上下文窗口 |
| 典型工具 | Claude Code CLI、Cursor 编辑器内 agent | Agent Teams、Conductor、Codex、Copilot Coding Agent |
| 需要的技能 | 写好 prompt、实时纠偏 | 写清 spec、拆工作、验收产出 |

这个转变的类比是「结对编程 → 管理一个团队」：你不再逐行指导，而是定义任务、分配、定期检查。**代码库变成画布，对话线程不再是工作区。**

文中引用了 Steve Yegge 的「AI 辅助编程八级」作为定位框架：多数人卡在 L3–L4，编排层从 L6 才真正开始：

![[assets/code-agent-orchestra/levels.jpg|620]]

## 二、为什么单 agent 会撞墙

三堵墙：

1. **上下文过载**：大代码库塞不进一个窗口，对话越长越丢细节。
2. **无专业化**：一个 agent 同时管数据层、API、UI、测试，样样通样样松。只管 `db.js` 的 agent 写数据库代码，明显强于一个要照看整个仓库的通才。
3. **无协作**：即使生成了帮手，它们之间不能通信、没有共享任务表、无法处理依赖——加得越多越乱。

Subagents 解决前两个，Agent Teams 三个全解决。

**多 agent 的四个理由是相乘不是相加**：

- **并行**：三个 agent 同时做前端、后端、测试。
- **专业化**：每个 agent 只看自己拥有的文件。
- **隔离**：git worktree 给每个 agent 独立工作目录，工作期间不会互相踩。
- **复利学习**：`AGENTS.md` 跨会话积累模式和坑，每次会话让下一次更好。

## 三、模式一：Subagents——聚焦委派

最简单的多 agent 形态，也是最该先试的。父 agent 用 Task 工具派生专职子 agent，把任务拆成几块，并**手工维护依赖图**。

书签管理器 Link Shelf 的例子：

| 子 agent | 产出 | 依赖 |
|---|---|---|
| 数据层 | `db.js`：schema + CRUD，完成后写 `DATA.md` | 无 |
| 业务逻辑 | `validation.js`：输入规则，完成后写 `LOGIC.md` | 无 |
| API 路由 | `server.js`：Express 路由 | 读 `DATA.md` + `LOGIC.md` |

前两个并行跑；第三个等两份报告文件就位再启动。**用文件当作 agent 之间的交接契约**，是这里最实用的一招。

- **解决了什么**：上下文隔离、专业化、独立任务并行；总成本约 220k token，基本成本中性。
- **还缺什么**：依赖图靠父 agent 手工管；没有 agent 之间的点对点消息；没有共享任务列表；文件作用域写不严就可能两个 agent 改同一个文件。

> 结论：subagents = 并行执行 + 手工协调。任务能干净拆开就够用；一旦协调本身成了瓶颈，再上 Agent Teams。

### Pro-tip：层级化 subagents（teams of teams）

不要只做一层委派。让编排者只派生两个 **feature lead**，每个 lead 自己再派生 2–3 个专家：

```
编排者 ── Feature Lead A ── Data / Logic / API
       └─ Feature Lead B ── Data / Logic / API
```

父 agent 只跟两个对象对话，上下文保持干净；更细的拆分永远不下传到父层。这等价于真实组织里「VP 不会直接给每个工程师派活，而是经过技术 lead 层层分解」。

## 四、模式二：Agent Teams——真正的并行

Agent Teams 补上了 subagents 缺的三个协调原语：**带依赖跟踪的共享任务列表、agent 之间的点对点消息、文件锁**。

开启方式（2026-03 时点）：

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

### 三层结构

```
Team Lead         拆解工作、建任务列表、汇总结果
    │
Shared Task List  pending / in_progress / completed / blocked + 依赖 + 文件锁
    │
Teammates         各自独立的上下文窗口，从共享列表自领任务
```

运行机制：

- 每个任务有状态；被依赖的任务完成后，blocked 的任务**自动翻成 pending**，立刻有人接手。
- teammate 之间直接发消息（例如后端把 `GET /search?q=` 的接口契约直接告诉前端），不经过 lead。**peer 消息防止 lead 变成瓶颈。**
- 文件锁避免两人同时改同一文件。
- 按 `Ctrl+T` 可以随时调出任务列表浮层。
- teammate 空闲时 lead 会自动收到通知。

### 关键结论

- **3–5 个 teammate 是甜点**。token 成本随人数线性上升，三个聚焦的 teammate 稳定优于五个散漫的。
- **风险任务先过 plan approval**：让 teammate 先写计划，lead 审批后再动手。改坏计划的成本远低于改坏代码。
- **一个文件一个 owner**：冲突是速度杀手。

### 可靠性 pro-tip

- **循环护栏 + 强制反思**：每个 teammate 硬上限 `MAX_ITERATIONS=8`，每次重试前强制回答三问：「什么失败了？具体改什么能修？我是不是在重复同一个做法？」——这一条显著减少卡死循环。
- **常驻 `@reviewer` teammate**：只读模型、只开 lint / test / security-scan 工具、每个任务完成时自动触发、每 3–4 个 builder 配 1 个。lead 只看得到通过审查的代码，相当于把 CI 质量门嵌进团队。

## 五、模式三：规模化编排的三档工具（2026-03 快照）

需要同时管 5、10、20+ 个 agent 时，才需要专门的编排工具。分三档：

| 档位 | 形态 | 适用 | 代表工具 |
|---|---|---|---|
| **Tier 1** | 进程内 subagents / teams | 单终端即可，从这里开始 | Claude Code subagents、Agent Teams |
| **Tier 2** | 本地编排器：多 worktree + 看板 + diff 审查 | 3–10 个 agent、熟悉的代码库 | Conductor、Vibe Kanban、Gastown、OpenClaw + Antfarm、Claude Squad、Antigravity、Cursor Background Agents |
| **Tier 3** | 云端异步 agent：派任务、关笔记本、回来收 PR | 清积压、无本地环境 | Claude Code Web、GitHub Copilot Coding Agent、Jules、Codex Web |

多数人的用法是**三档并用**：Tier 1 做交互式开发，Tier 2 跑并行冲刺，Tier 3 夜里清 backlog。

文中还给了两个落地细节：

- **多模型路由**：规划/架构 → 便宜模型；实现 → Sonnet/Opus/Codex；审查 → 专做安全的模型。用一份 `MODEL_ROUTING.md` 固定下来。
- **worktree 生命周期脚本**：`agent-spin` / `agent-merge` / `agent-clean` 三个别名，约 12 行 bash 解决建分支、rebase + 开 PR、清理工作树。

## 六、质量闸门：三件套

| 闸门 | 作用 | 实现 |
|---|---|---|
| **计划审批** | 在代码存在之前拦住坏架构 | teammate 写计划 → lead 审 → 批准/驳回 → 再实现 |
| **Hooks** | 在生命周期事件上强制自动检查 | `TaskCompleted` 跑 lint + test，失败就继续干；`TeammateIdle` 验证测试全过才允许停 |
| **AGENTS.md** | 跨会话复利学习 | 每次会话读、每次会话写，模式与坑持续累积 |

### AGENTS.md 的关键证据：人写，别让 AI 写

这是全文最值得记住的一条。ETH Zurich 的研究（Gloaguen et al., arXiv 2602.11988，2026-02）在 SWE-bench Lite 与新造的 AGENTbench 上测了四种 agent：

- **LLM 生成的 context file**：平均成功率 **−3%**，推理成本 **+20% 以上**。
- **开发者手写的 context file**：约 **+4%**，成本同样上升（最高约 19%）。
- **原因**：不是 agent 不听话，而是太听话——它照着文件里的指令多跑测试、多读文件、多用仓库专属工具，但并没有更快定位到相关文件；而 LLM 生成的内容大多在复述已有文档，属于冗余。
- **反证**：把仓库自带文档删掉后，同一批自动生成的文件反而变成正向收益（+2.7%）。

对应的做法：**绝不让 agent 直接写 `AGENTS.md`，每一行都要 lead 审批**；只保留无法从代码推断的信息（确切的 build/test/lint 命令、自定义工具、真实踩过的坑），宁短勿长。文中给的骨架是 `STYLE` / `GOTCHAS` / `ARCH_DECISIONS` / `TEST_STRATEGY` 四段。

## 七、自我改进：Ralph Loop

Ralph Loop 把开发拆成原子的任务，在**无状态但可迭代**的循环里跑：

```
Pick（从 tasks.json 取任务）→ Implement → Validate（测试/类型/lint）
→ Commit（通过才提交）→ Reset（清空上下文，下一轮）
```

关键洞察是「每轮重置」：不重置会累积混乱，小而有限的任务产出比一个巨型 prompt 干净得多。跨重置靠四条记忆通道续命：**git 提交历史、进度日志、`tasks.json` 状态、`AGENTS.md` 长期语义记忆**。

让 loop 变可靠的护栏：

- 把错误回灌给 agent 自动重试，但**同一错误卡 3 轮以上就杀掉换人**。
- 永远在 feature 分支上跑。
- 给迭代次数、时间、token 设硬上限。
- agent 只负责开 PR，人负责合并。

进阶做法：

- **`REFLECTION.md` 提案**：每个任务后强制写「什么让我意外 / 该加进 AGENTS.md 的一条模式 / 一条 prompt 改进」，lead 审批后合入。
- **token 预算与 kill criteria**：按 agent 设预算（如前端 180k、后端 280k），85% 时暂停通知，卡死 3 轮就换新 agent。
- **beads 持久记忆**：Gastown 的做法——把每次决策与结果记成不可变、git 支撑的记录，用任务图 + SQL 可查询的数据面检索，而不是向量 RAG。

## 八、瓶颈已经转移：验证，而不是生成

Agent 能飞快地产出「看起来很棒」的代码，难的是确认它是对的：

- 改动前能过的测试，不保证能抓住这次改动引入的回归。
- agent 写得出技术上合法、但恰好漏掉关键 case 的测试。
- 上下文窗口有限，agent 会漏掉视野之外的重要约束。
- 单人偶发的 flaky test，在四十个 agent 同时撞上时变成系统性阻塞。

> 在验证基础设施追上生成能力之前，人工审查不是可选的额外开销，而是安全系统。

文章由此给出两条纪律：

**委派任务，不委派判断。** Agent 擅长有紧评估函数的事：样板代码、迁移、测试脚手架、你没时间手工尝试的方案探索。人保留：架构与 API 设计（模型见过太多坏架构，会很乐意把企业级套路 cargo-cult 进你的项目）、决定「不做什么」、以及带着全局上下文审查产出。

**spec 就是杠杆。** 并行 50 个 agent 时，含糊的需求不是拖慢你，而是**乘数级放大错误**——几十条并行线路各自往略微不同的错误方向跑。写得精确的 spec（清晰的架构、集成边界、边界条件、不变量）会同样乘数级地放大成精确实现。强工程师从这套工具里获得的是更多杠杆，不是更少。

## 九、工厂模型

你不再只是写代码，而是在建**生产软件的工厂**。生产线六步：

| 步骤 | 内容 |
|---|---|
| **Plan** | 写带验收标准的 spec——spec 就是杠杆 |
| **Spawn** | 组队、分配 agent |
| **Monitor** | 每 5–10 分钟看进度、解阻塞，别一直盯着 |
| **Verify** | 跑测试、审查代码；验证才是瓶颈 |
| **Integrate** | 合并分支、解冲突 |
| **Retro** | 把新学到的模式写回 AGENTS.md |

运行规则：WIP 上限（别跑超过你能认真审查的数量，3–5 个）、kill criteria（同一错误 3 轮就停）、异步检查（5–10 分钟一次）、一文件一 owner。

## 十、时效性核对（2026-10-28 核实）

这篇文章发布已 7 个月，读的时候要区分「模式」和「接口」：

- ✅ **Agent Teams 仍是实验特性**，`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 仍有效（也可写进 `settings.json` 的 `env`）。
- ⚠️ **但机制已变**：Claude Code 2.1.178 移除了 `TeamCreate` / `TeamDelete`，改为每个会话一个隐式 team，用 Agent 工具直接派生带 `name` 的 teammate，用 `SendMessage` 通信、`TaskCreate` / `TaskList` / `TaskUpdate` 管任务。文章里的「Task 工具」与「每个 teammate 一个独立 Claude Code 实例跑在 tmux 分屏」也已不准确——现在默认是进程内 teammate，tmux 分屏要靠 `--teammate-mode tmux` 显式开。
- ⚠️ 文中 `@reviewer` 用「Claude Opus 4.6」只是 2026-03 的型号快照，按当时的可用模型重新选。
- ⚠️ Tier 2 / Tier 3 的工具清单是 2026-03 切片，选型前应重新核对各工具的现状。
- ✅ **AGENTS.md 的 ETH Zurich 研究结论已复核属实**（arXiv 2602.11988）：LLM 生成 −3% / 成本 +20%，人写约 +4%。

## 十一、和现有笔记的关系

- [[Agent与自动化/Loop Engineering|Loop Engineering]] — 同一位作者的上层框架：这篇讲「多个 agent 怎么排兵布阵」，Loop 讲「让系统按时间自己跑起来」。Ralph Loop 是两者的交集。
- [[Agent与自动化/AI Harness（驾驭层）知识手册|AI Harness]] — harness 是单个 agent 的运行环境；本文的 Plan / Verify / AGENTS.md 就是 harness 在多 agent 场景下的展开。
- [[AI原生工程团队运作实践]] — Fiona Fung 的团队视角同样把瓶颈指向验证（Verification）与代码审查，本文给了对应的机制（plan approval、hooks、reviewer teammate）。
- [[Agent与自动化/Claude Code Dynamic Workflows 动态工作流|Claude Code Dynamic Workflows]] — 官方编排模式；本文的 subagents / Agent Teams 是其中两种的具体化。
- [[Agent与自动化/Agentic Engineering 实战技巧集（2026年6月）|Agentic Engineering 实战技巧集]] — 个人层面的多会话并行技巧，可与本文的团队级模式对照。
- [[Agentic Coding 与专业知识的持久回报]] — Anthropic 40 万会话研究：专业知识的回报，与本文「不要外包判断」「spec 是杠杆」互为证据。
- [[批判性思维与认知投降——Agent 时代的思考纪律]] — 个人认知层：三档光谱、「读决定而非读摘要」与验证假信号，和本文的团队级质量闸门互补。

### 对当前工作流的可用性

按 2026-10 的实际使用方式，优先级大概是：

1. **先改 spec，不急着加 agent**（成本最低、收益最直接）。
2. **用 subagents 拆独立任务**（Claude Code 的 Agent 工具已经默认可用），并用「产出报告文件当交接契约」的做法。
3. **AGENTS.md 只写人确认过的东西**，别让 `/init` 生成后直接提交。
4. Agent Teams 可以用，但要先接受 2.5–4 倍 token 开销，且只适合边界清晰、文件不重叠的任务。

## 来源

- Addy Osmani: [The Code Agent Orchestra - what makes multi-agent coding work](https://addyosmani.com/blog/code-agent-orchestra/)（2026-03-26）
- 演讲材料：[Interactive slide deck](https://talks.addy.ie/oreilly-codecon-march-2026/) / [Overview & resources](https://talks.addy.ie/oreilly-codecon-march-2026/overview/)
- Gloaguen et al. (ETH Zurich): [Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?](https://arxiv.org/abs/2602.11988)（arXiv 2602.11988，2026-02）
- 时效复核：Claude Code 官方文档 [Orchestrate teams of Claude Code sessions](https://code.claude.com/docs/en/agent-teams)（2026-10 查阅）
