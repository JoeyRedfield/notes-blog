---
tags:
  - ai-coding
  - agent-workflow
  - tdd
  - skills-ecosystem
  - claude-code
created: 2026-06-03
raw: "[[raw/Full Walkthrough Workflow for AI Coding — Matt Pocock]]"
source: "https://www.youtube.com/watch?v=-QFHIoCo-Ko"
author: "[[Matt Pocock]]"
published: 2026-04-24
---

# AI 编码全流程工作流 — Matt Pocock 工作坊

> Matt Pocock 在 AI Engineer 大会上的 2 小时实践工作坊。从一条 Slack 消息这种模糊需求出发，完整走完"Grill Me → PRD → Kanban Issues → AFK Agent 实现 → QA"的全链路。核心信息：**规划阶段必须人类在场，实现阶段可以 AFK；反馈循环质量 = AI 编码质量的天花板。**

## 两个 LLM 核心约束

### 1. Smart Zone vs Dumb Zone（智能区 vs 愚蠢区）

LLM 每个 token 之间都有注意力关系，随着 token 增加，注意力关系呈**二次方增长**。大约 **100K token** 开始进入"Dumb Zone"——AI 开始做出愚蠢决策。

**实践含义**：
- 不要把任务塞进一个超长上下文让它一次性做完
- 每次任务尽量保持在 Smart Zone 内
- 状态栏显示实时 token 使用量是**必须的信息**，不知道 token 用量就是在盲飞
- 1M 上下文窗口只是"更长的 Dumb Zone"，适合检索但不适合编码

### 2. Memento 遗忘症

每次清空上下文，LLM 回到系统提示的最初状态——像《记忆碎片》的主角。Matt **更偏好清空（clear）而非压缩（compact）**，因为清空后的初始状态是确定且可预测的。

这意味着：设计工作流时，要假设每次新会话都从零开始，用结构化的文档（而非会话历史）来传递信息。

## 完整六阶段工作流

### Phase 1：Grill Me（拷问我）—— 建立共享设计概念

**作用**：让 AI 变成对手方，持续追问直到达成共享理解。这是 Matt **开始每一段工作的第一步**。

Skill 核心内容（极短）：
```
Interview me relentlessly about every aspect of this plan until 
we reach a shared understanding. Walk down each branch of the 
decision tree, resolving dependencies one by one.
```

**关键做法**：
- 先 `clear` 清空上下文，只传入 skill + 需求描述，保持极简
- 使用 sub-agent 探索代码库（sub-agent 在隔离上下文中运行，只把摘要返回给主 agent）
- AI 每个问题附带**推荐答案**——Matt 的经验是 AI 的推荐通常很好
- Grill Me 会话可能问 40、60、甚至 100 个问题，持续一小时——**这是人类必须在场的环节，不能 AFK**

**为什么比 Plan Mode 好**：Plan Mode 急于产出文档；Grill Me 先建立共享设计概念（Frederick P. Brooks 在《The Design of Design》中提出的概念——团队之间漂浮的、对"正在构建什么"的临时理解）。

**变体用法**：把与领域专家的会议记录丢进 Grill Me 会话，让 AI 追问会议中的假设和模糊点。

### Phase 2：编写 PRD（产品需求文档）—— 目的地文档

**作用**：把 Grill Me 中建立的共享设计概念固化为一份结构化文档——描述"我们要去哪里"。

PRD 内容结构：
- 问题描述（用户痛点）
- 解决方案概述
- 用户故事（User Stories）
- 实现决策记录（为什么这样设计）
- 测试决策（怎么验证）
- **不在范围内的东西**（Out of Scope —— 定义"完成"的边界，很重要）

**Matt 的争议性观点：你不必审阅 PRD。**

理由：如果 Grill Me 阶段已经达成了共享设计概念，PRD 只是 AI 做总结（LLM 最擅长的能力）。审读 PRD 只是在测试 LLM 的摘要能力，而不是测试设计方向。**真正需要校准的是共享理解（Phase 1），而非文档本身。**

### Phase 3：切分 Issues —— 曳光弹 + Kanban 看板

**作用**：把 PRD 拆成可独立交付的小任务，任务是"垂直切片"而非"水平层"。

#### 曳光弹（Tracer Bullets）

来自《The Pragmatic Programmer》：防空炮手在夜间射击时，每隔几发子弹掺一颗磷光弹，能看到弹道轨迹从而校准瞄准。

→ **每一期的交付都应该跨过所有架构层，让你能看到完整反馈。**
→ AI 默认喜欢**水平编码**（先做完数据库层 → 再做 API 层 → 最后前端），这在第三阶段之前无法验证系统是否集成正确。
→ 正确的做法是**垂直切片**：Schema + Service + 前端最小展示 在一个 issue 内完成，立刻可验证。

#### Kanban 看板（DAG 依赖）

把 issues 组织成有向无环图（DAG），而非线性序列：
- Issue 1 做完 → Issue 2、3 可并行
- Issue 2、3 都做完 → Issue 4 开始
- 标注每个 issue 是 **AFK** 还是 **Human-in-the-Loop**

为什么不用多阶段计划（Phase 1→2→3→4）：**线性计划只能由一个 agent 串行执行，Kanban 看板让多个 agent 并行工作。**

### Phase 4：AFK 实现循环 —— Agent 自主编码

**作用**：人类离开键盘，让 agent 按 TDD 方式逐个消化 issues。

核心 Prompt 结构（Ralph loop）：
1. **传入全部 issues**（`cat` 所有 issue markdown 文件到上下文）
2. **传入最近 5 个 commit**（给 agent 知道做了什么）
3. **优先级策略**：关键 bug 修复 > 开发基础设施 > 曳光弹 > 打磨性优化 > 重构
4. **工作流**：探索 repo → 选下一个 AFK 任务 → TDD 实现 → 运行反馈循环 → 提交

**TDD（红-绿-重构）为什么对 Agent 特别重要**：
- AI 默认行为是一次产出大量代码，然后才想"我应该检查一下"
- TDD 强制小步前进：先写失败测试 → 实现让测试通过 → 重构
- **防止 AI "作弊"**：AI 容易先实现全部功能再写测试，这样测试只是对实现的事后描述而非真正的需求约束
- TDD 让测试先于代码存在，AI 更难走捷径

**反馈循环 = AI 编码质量的天花板**：
- 没有反馈循环，AI 在盲写
- 类型检查（TypeScript/Java 编译）、测试套件、linting——这些是 AI 能自我纠错的基础
- 如果 AI 产出质量差，**先看反馈循环是不是不够好**，不要怪 AI

### Phase 5：Human-in-the-Loop 审查

**作用**：人类回到循环中，对 AFK 产出的代码做 QA 和代码审查。

**AI Review → 人工 QA 两层机制**：
1. 先让 AI 自我 review（但要注意：如果实现在 Smart Zone 做的，同一会话内的 review 会在 Dumb Zone —— **清空上下文后再做 review 效果更好**）
2. 再人工 QA：实际运行、手动测试、代码审查

**QA 的核心价值是注入品味**：如果你试图把 QA 也自动化，最终得到的是没有人类品味的"slop"。QA 是将你的判断和审美施加到代码上的环节。

**代码审查永远无法避免**：把编码委派给 AI 之后，代码审查量实际上是增加的。这是 AI 编码时代的硬成本——你需要审查比以往更多的代码。

**审查策略**：先审查测试（确保测试在测合理的东西），再审查实现代码。

### Phase 6：持续迭代 —— QA 驱动新 Issues

QA 阶段发现的任何问题，都转化为新的 issues，加入到 Kanban 看板中（可以是 blocking issues），形成闭环。

## 代码架构：让 AI 能高效工作的设计

### 深度模块 vs 浅模块

| 深度模块 | 浅模块 |
|---------|--------|
| 简单接口，大量功能内部封装 | 接口复杂，功能很少 |
| 测试在接口层面做，覆盖深 | 需要 mock 大量依赖，测试碎片化 |
| AI 易于理解和修改 | AI 迷失在依赖关系中 |

**策略：你设计接口 → AI 填充实现。** 把深度模块当"灰盒"用：你知道接口和用途，不必逐行审查内部实现（对非关键模块），在模块边界上验行为。

**Improve Codebase Architecture Skill**：扫描代码库，找到逻辑相关但散落各处的代码，用深度模块包裹它们。

## 实践技巧

### 编码标准的 Push vs Pull

- **Pull（拉取）**：编码标准写成 skill，agent 有需要时自己去查——适合**实现阶段**
- **Push（推送）**：编码标准直接注入 prompt——适合**审查阶段**
- 实践中：实现 agent 用 Sonnet（让标准按需拉取），审查 agent 用 Opus（推送全部标准，需要更高的判断力）

### 关于文档：警惕"文档腐化"

PRD 和规划文档**在实现完成后应该丢弃**。原因：
- 一个月后代码已经变了很多，旧的 PRD 描述可能完全不匹配
- 如果 agent 在新任务中找到了旧 PRD，会被过时信息误导
- Matt 用 GitHub Issues 的方式——完成后标记为 closed，视觉上有"已完成"的指示

### 并行化 Sandcastle

Matt 自己构建的 TypeScript 库，用于运行并行的 agent 循环：
-  Planner：分析 backlog，选出可并行的 issues
-  每个 issue：创建独立 git worktree + Docker sandbox
-  实现 agent → 审查 agent → 合并 agent 三步流水线
-  Sonnet 写代码，Opus 做 review

### Sub-Agent（子代理）的价值

Sub-agent 在**隔离的上下文窗口**中运行，只返回摘要给主 agent。这意味着：
- 探索代码库可以烧掉 90K+ token 在 Opus 上，但不影响主上下文
- 主 agent 保持精简，不进入 Dumb Zone

## Skills 生态：工作流 → 可安装 Skill 映射

Matt Pocock 把工作坊中演示的每个阶段都发布为独立的可安装 skill，托管在 `mattpocock/skills`（GitHub 97.5K Stars），所有 skill 安全审查均为 Safe/0 alerts/Low Risk。

### 六阶段 → Skill 映射

| 工作坊阶段 | 对应 Skill | 安装量 | 核心作用 |
|-----------|-----------|--------|---------|
| Phase 1 拷问 | `grill-me` | 251.2K | 苏格拉底式追问，建立共享设计概念 |
| Phase 1（带文档）| `grill-with-docs` | 193.7K | 同上 + 自动提取项目术语表 |
| Phase 2 PRD | `to-prd` | 175.1K | 从对话上下文生成结构化 PRD |
| Phase 3 切 Issues | `to-issues` | 168.2K | 垂直切片拆分，DAG 依赖标注 AFK/HITL |
| Phase 4 TDD 实现 | `tdd` | 193.5K | 红绿重构 + 曳光弹 + 行为测试 |
| 代码架构优化 | `improve-codebase-architecture` | 203.5K | 扫描代码库，识别深度模块候选 |
| 原型验证 | `prototype` | 122.0K | 快速生成可交互原型获取反馈 |
| 阶段交接 | `handoff` | 115.5K | 在阶段之间传递上下文 |

### Matt Pocock（Library）vs obra/superpowers（Framework）

这两个体系代表了 Agent Skills 生态的两大阵营，社区已形成共识：

| 维度 | Matt Pocock | obra/superpowers |
|------|------------|------------------|
| **定位** | Library（工具库）— 按需手动触发 | Framework（方法论框架）— 自动激活不可绕过 |
| **控制权** | 在工程师手里，`/skill` 调用 | 在框架手里，brainstorming→plan→execute 流水线 |
| **哲学** | "我给你最好的工具，怎么组合你决定" | "我替你做了方法论决策，你跟着走" |
| **Stars** | ~97.5K | ~201K |
| **安装量 Top Skill** | grill-me 251.2K | brainstorming 197.5K |
| **适合** | 独立开发者、有自己工作流偏好 | 团队需要强制纪律、统一工程文化 |

**核心差异示例**：

- `grill-me`（Matt）：10 行，三句话，"Interview me relentlessly... Ask questions one at a time"，极简但实测可问 20-50 个精准问题。社区评价："Of 16 questions asked, I hadn't thought about half of them before coding."
- `brainstorming`（superpowers）：165 行，9 步流程 + DOT 图 + Visual Companion + spec 文档产出。社区评价："更热闹但计划文档没有 grill-me 清晰，步骤更少更粗"（实测 7-8 个问题 vs grill-me 20+）。

**社区评测结论**（来源：LINUX DO、V2EX、Devtalk、ToKnow.ai）：
> - "grill-me > brainstorming > plan" — 多篇评测一致排序
> - "Matt Pocock：目前最平衡的。Grill 问的问题技术含量高，skill 数量和设计都合理"
> - "Superpowers 太简单，提的问题常常不在点子上"
> - "独立工程师、对工作流有自己的想法 → 主力 mattpocock/skills；团队纪律差、bug 多 → 主力 superpowers"

### 具体重叠 Skill 的取舍

**TDD：`tdd`（Matt）vs `test-driven-development`（superpowers）**

两者都做红绿重构，但 Matt 的 `tdd` 独有：
- **反模式：水平切片警告** — 禁止"先把全部测试写好再写全部实现"，必须逐测试→逐实现（曳光弹垂直切片）
- **测行为不测实现** — 强调通过公共接口测试，"code can change entirely; tests shouldn't"
- **与深度模块设计联动** — 引用 `deep-modules.md` 和 `interface-design.md`
- **Planning 确认步骤** — 实现前先和用户确认要测哪些行为、接口怎么设计

superpowers 的 `test-driven-development`（370 行）特点：Iron Law（测试前写代码 = 删掉重来）、借口反驳表、更偏纪律约束。

**取舍**：保留 `tdd`（与 Matt 全家桶配套，193.5K installs），卸载 `test-driven-development`。已执行。

**Grill Me vs Brainstorming：互补保留**

`grill-me` 适合**有明确想法但需要被追问挑战**的场景（日常编码任务起步）。`brainstorming` 适合**从零探索、需要对比多种方案**的场景（新功能设计）。两者场景不同，保留。

**Plan 产出：`to-prd` / `to-issues`（Matt）vs `writing-plans`（superpowers）**

三者处于不同抽象层级，不直接冲突：
- `to-prd`：高层目的地文档（用户故事、设计决策、Out of Scope）
- `to-issues`：垂直切片 issues（AFK/HITL 标注、DAG 依赖）
- `writing-plans`：逐步骤代码级计划（精确文件路径 + 完整代码片段）

Matt 哲学倾向前两者（给 agent 方向和约束、让它自主实现），`writing-plans` 作为降级方案（agent 在某个 issue 上反复出错时给出精确指令）。

### 本机当前 Skills 配置

2026-06-03 审查后，保留 **39 个** skill（删 1 个重叠），分三层：

| 层级 | Skills | 数量 |
|------|--------|------|
| **AI 编码工作流** | grill-me, to-prd, to-issues, tdd, brainstorming, writing-plans, executing-plans, subagent-driven-development, dispatching-parallel-agents | 9 |
| **编码质量** | karpathy-guidelines, systematic-debugging, verification-before-completion, requesting-code-review, receiving-code-review, simplify | 6 |
| **基础设施** | obsidian-vault, obsidian-markdown, neat-freak, using-git-worktrees, finishing-a-development-branch, skill-creator, writing-skills, find-skills, using-superpowers, fewer-permission-prompts, init, pdf, storage-analyzer, baoyu-compress-image, 及其他低频工具 | 24 |

另有 9 个建议卸载但暂留（公众号内容创作套件 khazix-writer/edit-article/baoyu-article-illustrator/baoyu-markdown-to-html、LaTeX 论文 latex-paper-en、Diátaxis 文档 documentation-writer、前端设计 frontend-design、changelog-generator），使用频率极低或与当前方向无关，可视后续使用情况决定去留。

## 与我自己的关联

### 当前可直接应用的

**Grill Me Skill** 可以在 Claude Code 中创建——开始任何非平凡任务前，先让 AI 追问 10-20 个问题，建立共享理解。这比直接 /plan 可能效果更好。

**TDD + Agent**：在 Java 项目中（JUnit + Mockito），可以要求 Claude Code 严格按 TDD 流程工作：先写测试 → 确认红 → 实现 → 确认绿。这直接提升 AI 产出代码的质量。

**"清空上下文再 review"** 原则：做完一个大块实现后，开新会话做代码审查，让审查发生在 Smart Zone。

### 进入业务系统后可用的

**Kanban 看板 + DAG 拆分**：在业务系统开发场景中，把功能需求拆成有依赖关系的小 issues（垂直切片），标注哪些可以独立并行、哪些有依赖——这跟分层架构天然契合。

**深度模块实践**：Spring Boot Service 层天然是深度模块——设计好 Service 接口和 Repository 边界，Service 内部逻辑可以更放心交给 AI。

**通用语言文件**：为术语密集的业务系统建立一份术语定义文件（如入库/上架/拣货/波次/库位等），在 AI 协作时始终传入——这是从 Matt 的 Ubiquitous Language Skill 直接借鉴的做法。

## 相关笔记

- [[软件基础在AI时代更重要——Matt Pocock]] — Matt 的另一场演讲（AI 时代五大失败模式），与本工作坊互补（理念 vs 实操）
- [[Harness Engineering——人类掌舵 Agent 执行]] — 相同的人类战略 + AI 执行范式
- [[AI编码能力提升路线]] — 六大 AI 编码提升方向
- [[Claude Code Skills 与 MCP 精华笔记]] — Skills 机制参考
- [[2026年学编程路线与Agentic Engineering]] — AI 编码范式演进全景
- [[Codex 写计划、Claude Code CLI 写代码：模型与成本选型建议]] — Claude Code + Codex 分工实践

> [!note]- 延伸阅读：Sandcastle 并行化细节
> Matt 自己构建的 Sandcastle 库用于管理并行 agent。核心是 TypeScript 运行时，主要概念：
> - **Sandbox**：每个 agent 在独立的 git worktree + Docker 容器中运行
> - **Planner → Implementer → Reviewer → Merger** 四步流水线
> - **Merge Agent**：专门的 agent 负责处理合入冲突，包括解决类型和测试问题
> - 使用场景是多个 AFK 任务同时推进，适合有一定规模的项目
> - 如果只是个人开发 + 单线任务，直接用 Claude Code 的 /loop 就够，不需要这套并行设施
