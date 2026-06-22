---
tags: [ai, agent, claude-code]
created: 2026-06-03
source: "https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code"
raw: "[[raw/A harness for every task dynamic workflows in Claude Code]]"
source_type: official-mechanism
---

# Claude Code Dynamic Workflows（动态工作流）

Claude Code 新增的动态工作流（Dynamic Workflows）能力：Claude 能在运行时**自己编写 JavaScript 编排脚本**（harness），为当前任务定制一套多 Agent 协调方案。由 Anthropic 技术团队成员 Thariq Shihipar 和 Sid Bidasaria 撰写。

## 一句话理解

默认的 Claude Code 是"一个 Claude 在一个上下文窗口里干活"。Dynamic Workflows 允许 Claude **自己写一个编排脚本**，按需派出多个子 Agent（subagent），每个子 Agent 有独立上下文窗口、独立工作目标和独立模型选择，Claude 负责协调和合并结果。

## 成熟度评估

动态工作流是一个**已发布但尚在早期阶段**的功能。几个信号：

- **模型依赖未就绪**：文章提到需要 Claude Opus 4.8 级别智能才能可靠生成编排脚本，但当前（2026 年 6 月）最新模型仍是 Opus 4.7
- **触发方式是实验性代号**："ultracode" 不像正式命令名，更像内部实验代号
- **文章性质偏探索**：全文是"这些模式可能有用""这些场景可以试试"，而非 API 参考或配置文档。真正成熟的特性通常有对应的 CLI 命令和稳定参数
- **没有独立命令**：对比 `/deep-research` 是明确的 skill 命令，动态工作流目前更像一个底层能力——引擎跑通了，但上层交互范式还没定型

**总结**：底层机制已落地，上层产品和最佳实践还在形成中。适合了解概念和提前思考使用场景，但目前不必期望它像 Skills/MCP 一样稳定可用。

## 为什么需要动态工作流

单个上下文窗口长时间执行复杂任务时，会出现三种典型失败模式：

| 失败模式 | 表现 | 举例 |
|---------|------|------|
| **Agentic Laziness（代理懒惰）** | 任务未完成就声称完成，只做了部分工作就停手 | 安全审查要求检查 50 项，Claude 检查了 35 项就宣布完成 |
| **Self-preferential Bias（自我偏好偏差）** | 倾向于认可自己的结果，无法客观审查自己的输出 | 让 Claude 验证自己刚写的代码，它倾向于说"没问题" |
| **Goal Drift（目标漂移）** | 经过多轮对话和上下文压缩后，逐渐偏离原始目标 | 多次 compaction 后，"不要改 X"之类的约束条件被丢失 |

动态工作流通过**为不同子任务分配独立上下文窗口和聚焦目标**来对抗这些失败模式。每个子 Agent 只关心一件事，不会被其他信息干扰。

## 工作原理

动态工作流执行一个 **JavaScript 文件**，其中包含：

- **特殊函数**：用于 spawn 和协调 subagent 的 API
- **标准 JS 函数**：JSON、Math、Array 等数据处理能力
- **模型选择**：工作流可以决定每个子 Agent 使用什么模型（Sonnet/Opus）
- **隔离控制**：可以选择子 Agent 是否在独立 worktree 中运行

工作流如果被中断（用户操作、终端退出等），resume 会话后可以从断点继续执行。

## 动态工作流 vs 静态工作流

| | 静态工作流 | 动态工作流 |
|---|---|---|
| **定义方式** | 人工预写脚本（Agent SDK / `claude -p`） | Claude 根据任务实时生成 |
| **通用性** | 需要覆盖所有边界情况，通常更泛化 | 为当前用例量身定制 |
| **灵活性** | 固定流程 | 按需调整策略和模式 |
| **适用场景** | 重复性标准化任务 | 复杂、一次性、高价值任务 |
| **前提条件** | 需要 Claude Opus 4.8 级别的智能来生成可靠的编排脚本 | |

## 六大核心模式

Claude 在构建工作流时，会组合使用以下模式：

### 1. Classify-and-Act（分类后执行）

用一个分类 Agent 判断任务类型，然后路由到不同的处理 Agent。或在末尾用分类 Agent 判定输出质量。

```
输入 → [分类Agent] → 类型A → [处理Agent A]
                   → 类型B → [处理Agent B]
                   → 类型C → [处理Agent C]
```

### 2. Fan-out-and-Synthesize（扇出后综合）

将大任务拆分为多个小步骤，每个步骤派一个独立 Agent 并行执行，最后合并结构化输出。**适合步骤多、各步骤需要干净上下文互不干扰的场景**。Synthesize 步骤是一道屏障——等所有扇出 Agent 完成后统一合并。

```
         → [子Agent 1] →
主任务 → [子Agent 2] → [综合Agent] → 最终结果
         → [子Agent 3] →
```

### 3. Adversarial Verification（对抗性验证）

对每个执行 Agent 的输出，派另一个 Agent 按评分标准进行对抗性审查。

```
[执行Agent] → 输出 → [验证Agent：按评分标准检查] → 通过/驳回
```

### 4. Generate-and-Filter（生成后过滤）

生成大量想法或方案，然后按评分标准过滤、去重，只返回最优质的、经过检验的结果。

### 5. Tournament（锦标赛）

不让 Agent 分工，而是让它们**竞争**。派 N 个 Agent 用不同方法做同一件事，然后由裁判 Agent 两两比对，逐轮淘汰，决出胜者。

```
方案1 ─┐
方案2 ─┤→ [裁判：两两对比] → 胜者 → ... → 冠军
方案3 ─┤
方案4 ─┘
```

比较判断（"A 和 B 哪个更好"）比绝对打分更可靠，适合排序、命名、方案选择等需要"品味"的任务。

### 6. Loop Until Done（循环至完成）

对于工作量不确定的任务，循环派出 Agent 直到停止条件满足（如无新发现、日志无新错误），而非固定轮次。

## 典型用例

### 迁移与重构
将任务拆分为一系列步骤（调用点、失败测试、模块等），每个修复派一个子 Agent 在独立 worktree 中执行，再由另一个 Agent 对抗性审查后合并。Bun 从 Zig 重写为 Rust 就是用这种工作流完成的。

### 深度研究
扇出多个搜索 Agent → 获取来源 → 对抗性验证声明 → 综合产出带引用的报告。Claude Code 内置的 `/deep-research` skill 就使用了动态工作流。不仅限于网络搜索，也可用于从 Slack 上下文汇总状态报告、深度探索代码库等。

### 深度验证
一个 Agent 识别报告中所有事实性声明 → 为每个声明派子 Agent 逐一核实 → 再派验证 Agent 检查来源质量。

### 大规模排序
有大量条目需要按定性标准排序（如按 bug 严重程度排 1000+ 个工单）时，使用锦标赛模式两两比较，或分桶后并行排序再合并。每个比较是独立 Agent，只有排名状态留在上下文中。

### 规则遵守与记忆挖掘
为每条规则派一个验证 Agent 检查是否被遵守。反向操作：挖掘最近会话中的反复纠正 → 并行聚类 → 对抗性验证（这条规则真的能防止实际错误吗？）→ 提炼幸存者写回 `CLAUDE.md`。

### 根因调查
从互不重叠的证据（日志、文件、数据）中各自生成假设，每个假设面对一组验证和反驳 Agent。适用于代码调试、销售下降分析、数据管道故障排查等。

### 大规模分类处理
对每个条目分类、去重、采取行动。关键安全模式是**隔离（quarantine）**：读取不受信内容的 Agent 不能执行高权限操作，由专门的动作 Agent 执行。可与 `/loop` 配合实现持续分类。

### 探索与品味
让多个 Agent 探索不同方案，由评审 Agent 按评分标准判断是否达标。适合设计、命名等需要主观判断的任务。

### 轻量级评估
在独立 worktree 中运行不同 Agent，再由比较 Agent 按评分标准对比输出。适合评估和迭代改进 skill。

### 模型与智能路由
用一个分类 Agent 先调研任务复杂度（如"auth 模块有多少文件、代码库结构如何"），再根据预期复杂度路由到 Sonnet 或 Opus。

## 何时不用动态工作流

- **常规编码任务不需要**：大部分日常编码不需要 5 个评审员的豪华阵容
- **简单任务不值得**：工作流会消耗更多 token，简单任务用默认 harness 即可
- **判断标准**：问自己"这个任务真的需要更多算力吗？"

## 实用技巧

- **详细提示词**：明确描述你想要的模式（如"用 fan-out-and-synthesize 模式"），效果更好
- **快速工作流**：可以要求"quick workflow"做轻量级对抗性审查等小任务
- **配合 `/goal` 和 `/loop`**：可重复的工作流（分类、研究、验证）配合定期循环和硬性完成条件
- **Token 预算**：用"use 10k tokens"显式设置 token 上限
- **保存与分享**：按 `s` 键保存工作流到 `~/.claude/workflows`，可提交到 git 或通过 skill 分发。在 skill 中引用工作流 JS 文件时，建议提示 Claude 将其视为模板而非必须逐字执行的脚本

> [!note]- 延伸阅读
> 工作流目前仍在快速演进中，最佳实践尚在形成。Anthropic 鼓励将工作流视为探索 Claude Code 新边界的起点，而非固定工具。
>
> 相关资源：
> - [Dynamic Workflows 官方文档](https://code.claude.com/docs/en/workflows)
> - [Claude Code Glossary - Agentic Harness](https://code.claude.com/docs/en/glossary#agentic-harness)
> - [Jarred Sumner 用工作流将 Bun 从 Zig 重写为 Rust 的 X 线程](https://x.com/jarredsumner/status/2060050578026189172)

## 与当前工作流的关联

- 已经掌握了 [[三角循环——AI编码核心概念内化记录|三角循环（我设计→AI 执行→我审查）]]，动态工作流是这个模式的**规模化版本**——从一个人审查一个 AI 的输出，升级为多个 AI 互相审查
- [[AI Harness（驾驭层）知识手册|AI Harness]] 中讨论的"驾驭层"概念，动态工作流正是 Claude Code 层面的具体实现——Claude 自己生成 harness 来协调多 Agent
- 在 [[inbound-order-实战记录|入库单实战]] 中，手动执行了"拆分 Issues → 逐个实现"的流程，动态工作流可以自动化这个过程
- 处理复杂业务需求时，可以考虑用工作流做**大规模代码变更的拆分和并行执行**
