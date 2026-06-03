---
tags: [ai, agent, claude-code, workflow, tools]
created: 2026-06-03
source: "https://x.com/mvanhorn/status/2061877533885473181"
author: "[[@mvanhorn]]"
raw: "[[raw/Every Agentic Engineering Hack I Know (June 2026)]]"
---

# Agentic Engineering 实战技巧集（2026 年 6 月）

> 作者 @mvanhorn 是 Compound Engineering 插件第三大贡献者、last30days（27K+ stars）和 Printing Press（4K+ stars）的作者，同时也是 Python、Go、OpenCV 等多个知名开源项目的贡献者。这篇文章是他三个月前"Every Claude Code Hack I Know"（91.3 万次浏览）的更新版。

**核心主张**：从"Vibe Coding"到"Agentic Engineering"——AI 编程已经从业余玩具变成真正的生产力工具。完整工作流是：**语音输入 → plan.md 规划 → agent 执行 → 人类做信号（品味+判断）**。

---

## 一、CE plan.md 工作流（技巧 1-3）★ 核心

### 1.1 理念：规划先行，执行机械化

传统开发是 80% 编码 + 20% 规划。Agentic Engineering 翻转这个比例：**思考放在 plan 里，执行是机械的**。

规则：**除非是单行改动，否则永远先有 plan.md。**

### 1.2 三种启动方式

| 场景 | 命令 | 说明 |
|------|------|------|
| 有明确想法 | `/ce-plan` | 直接生成计划 |
| 想法模糊 | `/ce-brainstorm` → `/ce-plan` | 先跟 agent 讨论清楚再规划 |
| 有截图/链接/错误 | 粘贴素材 + `/ce-plan` | 支持图片、GitHub Issue URL、终端错误截图、Slack 对话等 |

### 1.3 /ce-plan 内部机制

```
/ce-plan 触发
  ├── 并行启动研究 agent：
  │   ├── 阅读你的代码库，找模式、检查约定
  │   ├── 搜索你过去的解决方案，提取经验
  │   └── （可选）搜索外部文档和最佳实践
  └── 汇总 → 输出结构化 plan.md：
      ├── 问题描述
      ├── 技术方案
      ├── 涉及文件清单
      ├── 带 checkbox 的验收标准
      └── 从你自身代码中提取的编码模式
```

关键在于**它是基于你的仓库、你的约定、你的历史**的个性化计划，不是通用建议。

### 1.4 不要读 plan.md

> "Plan 是给 agent 的，不是给你这个人类读的。"

强制让 agent 写 plan 的目的是**让它不偷懒**——做研究、承诺方案、写下验收标准。agent 有 plan 能完成完整工作，没 plan 就会走捷径。

实操：只需扫一眼标题，直接 `/ce-work`。有疑问时在 session 里追问：
- `TLDR?` — 一句话概括
- `eli5 this plan` — 用最简单的话解释
- `wait, why this approach?` — 质疑方案

### 1.5 非工程工作也用这个流程

`/ce-plan` 有**通用规划模式**（universal planning mode），不仅限于代码。策略文档、产品规格、竞品分析、董事会汇报都可以。

**核心技巧：给 plan 本身写 plan**。直接要求输出物，LLM 会走捷径；先要求它规划"如何产出输出物"，再执行那个 plan，它每次都会给出深度版本。

实操示例：

```
/ce-plan make a plan for the plan.
我要给你两份材料：一本 PDF 书和一个两小时的会议转录。
我想要一个 thoughtful 的计划，说明如何把这三者（业务问题、会议讨论、书中经验）整合成一份可用的文档。
现在不要写那个文档——写文档是后面的工作。
现在我只想要一个 plan，说明你将如何阅读这本书、挖掘转录内容、产出一份好文档。
```

### 1.6 对你的实际价值

- 你已经深度使用 Claude Code，但可能还没有建立"先 plan 后 work"的肌肉记忆
- 你入职后面对不熟悉的业务系统（WMS/MES），用 `/ce-plan` 先让 agent 理解代码库再动手改，比直接改安全得多
- Plan 文件是你跨 session 的检查点——上下文炸了，新 session 指向 plan 就能继续
- Compound Engineering 插件安装：`/plugin marketplace add EveryInc/compound-engineering-plugin`

---

## 二、多会话并行（技巧 5-6）

### 2.1 cmux 多标签工作法

保持 4-6 个 cmux 标签，每个是独立的 Claude Code session：

- 一个在写 plan
- 一个在从已有 plan 构建
- 一个在跑 last30days 调研
- 一个在修测试中发现的 bug

一个 session 等结果时，切换到另一个继续推进。这是异步并行的核心。

### 2.2 终端默认启动 Claude Code

新标签页直接进入 Claude Code 而非 shell。每次启动成本降到一个按键，就自然会开更多 session。

---

## 三、语音输入（技巧 4）

> "Voice-to-LLM 不同于 voice-to-anything-else。转录不需要完美，因为 LLM 能理解上下文、猜测麦克风遗漏的词。"

**Mac 方案**：Monologue（Every 出品）或 Wispr Flow，选一个即可。配一个鹅颈麦克风。

**手机方案**：直接用 Apple 内置听写，因为 LLM 能容错，即使转录错了一半 agent 仍能理解。

**限制**：作者承认在办公室环境中很难用语音（不想打扰别人），独处时效果好。如果你有共享办公环境的语音方案，这篇文章的作者也在求建议。

---

## 四、远程操控与邮件触发（技巧 7）

### 4.1 始终开启远程控制

```json
// ~/.claude/settings.json
{ "remoteControlAtStartup": true }
```

所有窗口都可以从手机 Claude App 远程接入。桌面开始的任务，路上用手机继续操控。

### 4.2 AgentMail：给 Claude 一个邮箱

安装 [agentmail-to-claude-code](https://github.com/mvanhorn/agentmail-to-claude-code) 后，发邮件到一个专用邮箱，Mac 上自动启动新的 Claude Code session 处理邮件内容。

三个组件：
- **守护进程**：通过 WebSocket 监听 AgentMail 收件箱
- **终端后端**：支持 cmux 或 Ghostty
- **发送端**：作者绑定到 Hermes 的 `cc` 命令，从手机发 `cc <任务>` 就能远程启动 session

安全措施：白名单机制，只有指定地址能触发，DKIM/SPF 验证失败的邮件直接丢弃。

### 4.2 对你的场景

入职后如果公司配台式机，这个方案让你在外出/开会时用手机远程操控办公室电脑上的 agent 执行任务。

---

## 五、权限与音效（技巧 8）

### 5.1 YOLO 模式

六六个 session 并行时不可能逐个确认权限。两关键设置：

```json
// ~/.claude/settings.json
{
  "permissions": {
    "allow": ["WebSearch", "WebFetch", "Bash", "Read", "Write", "Edit", "Glob", "Grep", "Task", "TodoWrite"],
    "deny": [],
    "defaultMode": "bypassPermissions"
  },
  "skipDangerousModePermissionPrompt": true
}
```

### 5.2 完成音效 Hook

```json
{
  "hooks": {
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "afplay /System/Library/Sounds/Blow.aiff"
      }]
    }]
  }
}
```

多 session 并行时，声音是分辨哪个 session 刚完成的关键信号。走开，听到声音再回来。

> ⚠ **注意**：YOLO 模式意味着 agent 可以执行任何命令。作者的态度是"这是我的电脑，有 GitHub 在就搞不坏"。你需要自己评估风险。

---

## 六、Claude 规划 + Codex 执行（技巧 9）★

### 6.1 分工模式

作者几乎不直接打开 Codex CLI，而是通过三种方式从 Claude 内部把工作交给 Codex：

1. **Codex IDE 扩展**：发送任务，应用结果，不出 Claude 终端
2. **`/ce-work --codex`**：在 Compound Engineering 循环内直接把构建委托给 Codex
3. **Printing Press Codex 模式**：在 prompt 末尾加 `codex` 即可交给 Codex 构建

### 6.2 配置建议

| 工具 | reasoning | fast mode | 月费 |
|------|-----------|-----------|------|
| Codex | xhigh | **开** | $200 |
| Claude Code | xhigh | **关**（按 token 额外计费） | $200 |

两个 $200 计划并排使用 = 完整的第二引擎。大量并行构建推给 Codex，Claude 专注规划和品味把关。有朋友反过来用也一样有效。

### 6.3 对你的参考

你已经在用 Codex 辅助，这个分工模式可以直接参考。不过你需要评估两个 $200/月的成本是否合理——目前你可能更适合 Claude Code 主力 + Codex 辅助的模式。

---

## 七、last30days 调研（技巧 10）

安装 [last30days](https://github.com/mvanhorn/last30days-skill)（27K+ stars），在 `/ce-plan` 之前先 `/last30days <topic>`。

它并行搜索 Reddit、X、YouTube、TikTok、Instagram、HN、Polymarket、GitHub 和网页，几分钟内返回社区最新讨论。选库、做功能、见客户、写文章之前都可以先跑一下。

**研究 → 规划 → 构建**，这是真正的循环。

---

## 八、Granola 会议转录（技巧 11）

[Granola](https://granola.ai/) 是会议转录工具。核心技巧：**直接把原始转录丢给 agent，不要先做摘要**。

杂乱的原始转录中夹杂着关于寿司的闲谈也没关系，让 LLM 自己提取关键信息——它会自动忽略无关内容。结合代码库和过去的策略文档一起喂给 agent，输出质量远超人工摘要。

作者还写了 Printing Press Granola CLI，可以在 session 中直接拉取任何会议的结构化数据。

---

## 九、人类信号（技巧 12）★

> "当你在跑六个 agent 时，你的工作不是做事情。你的工作是做信号。"

Agent 提供**量**。你提供**品味、方向、反应-重定向循环**。

典型操作：
- "方案二更接近，但用方案一的措辞"
- "先解决最大的风险"
- "这段话太长"

循环中稀缺且有价值的是**你的判断，不是你的打字**。越早接受"我是信号源而非执行手"的定位，产出越高。

---

## 十、写自己的 Skills（技巧 17）★ 详解

### 10.1 核心原则

> "做两次以上的事，就写成 skill"

Skill 是可复用的 agent 指令，写一次，之后每个 session 都更快。这就是"Compound Engineering"中"复利"的含义。

### 10.2 实践方法：不要从零写

不需要从空白开始。关键技巧：**让 agent 看一个已有的 skill，照它的形状抄**。

```
"看 Compound Engineering 的 skill，帮我做一个类似的，用于 [我想自动化的事情]"
```

Agent 会：
1. 阅读一个成功 skill 的结构
2. 学习其模式（触发条件、输入处理、输出格式）
3. 基于你的需求 scaffold 一个同结构的 skill

### 10.3 作者的 Skill 开发生态

作者的 GitHub 几乎全是 skills 和相关工具：
- **last30days**：始于自己想要一个调研工具的 skill，现在 27K+ stars
- **Printing Press**：生成 agent-native CLI 的工厂，320+ PR 已合并
- **Compound Engineering 本身**：作者是第三大贡献者

### 10.4 对你可能值得封装成 Skill 的重复工作流

- Ingest 流程（raw → wiki 笔记）的标准化步骤
- 日记模板填充
- Java 后端 CRUD 模板生成
- Obsidian 笔记维护（frontmatter 检查、链接验证）

### 10.5 Skill 设计要点（从文章中推断）

- 明确触发条件（什么时候该用）
- 结构化输出（agent 知道"做完"是什么样）
- 引用你的代码库规范和已有方案（个性化，不是泛泛的）

---

## 十一、笔记即 Agent 知识库（技巧 14）★ 详解

### 11.1 核心理念

> "Plan 越来越好的原因是 Claude 能看到我之前写过的所有 plan。复利式上下文。"

把 agent 指向整个知识库——笔记、会议记录、半成品想法、决策记录——让 agent 更懂你。每多放一点东西进去，每个 session 就变得更智能。这就是**个人 RAG，而不叫这个名字**。

### 11.2 作者推荐的工具栈

| 工具 | 类型 | 说明 |
|------|------|------|
| [Bear](https://bear.app/) | 笔记工具 | 作者主力，有 CLI，十年笔记 agent 可读写 |
| [Obsidian](https://obsidian.md/) | 笔记工具 | **你正在用的！**作者说"不用但我听说很好，插件生态深" |
| [gbrain](https://github.com/garrytan/gbrain) | Agent 记忆 | Garry Tan 的作品，跨机器同步 agent 记忆 |
| [supermemory](https://supermemory.ai/) | Agent 记忆层 | 专业 agent 记忆工具，作者正在评估 |

### 11.3 与你现有的架构的对应关系

你已经在做这件事了，而且做得比文章中描述的更系统：

| 文章中的概念 | 你的 LLM Wiki 架构对应 |
|-------------|----------------------|
| "把笔记指向 agent" | `CLAUDE.md` 定义了完整的三层 ingest 流程 |
| "每多放一点东西，agent 就更聪明" | 每次 ingest 都在扩充 wiki，让 agent 更了解你的知识结构 |
| "决策记录" | `raw/` → wiki 笔记的摄入流程 |
| "复利式上下文" | `index.md` + wikilink 交叉引用就是这个效果 |
| Bear CLI（作者） | Obsidian（你）+ MemPalace 记忆系统 |

### 11.4 还可以加强的方向

- **更充分地利用 `private/个人信息/`**：让 agent 在做计划时主动参考你的技术栈和职业方向
- **会议转录接入**：入职后如果有会议录音/转录，可以走 ingest 流程进入知识库
- **项目笔记积累**：每做一个项目（苍穹外卖、天机学堂），把踩坑经验写回知识库，后续 agent 能引用
- **Skills 沉淀**：你总结的工作流模板（如 `日记模板`、`CLAUDE.md` 中的操作规范）本质就是 skill

---

## 十二、开源贡献（技巧 18）

作者用 `/ce-plan` + `/ce-work` 的循环贡献了数百个 PR，在 Compound Engineering、Superpowers、GStack、Paperclip 等项目上排进贡献者前五。

他的方法论：
1. 选一个每天在用的工具
2. 找一个真正缺的功能
3. 用 plan → work 循环提交 PR
4. 进入项目的 Discord，认识维护者，交真正的朋友

他通过这种方式找到了一位工程师加入他的新公司。

---

## 十三、Printing Press CLI（技巧 20）

[Printing Press](https://printingpress.dev/) 是一组 CLI，把现实世界服务包装成 agent 可调用的命令。关键是 [Agent Cookie](https://agentcookie.dev/)——把你的浏览器 session 交给 CLI，免密码免重新认证。

作者的日常：Tesla 预热、Instacart 下单、ESPN 赛事监控、Alaska Airlines 比价订票——全部通过终端指令完成。

**对国内用户参考价值有限**，但这个思路值得了解：把重复性的生活/工作操作封装成 agent 可调用的接口。

---

## 十四、AI 成瘾警告（技巧 21）★

> "Agent 本该替我们做所有工作。事实上，我认识的每个朋友都处于人生中工作最拼命的状态。"

用 agent 构建东西是**有史以来最好玩的电子游戏**，这个反馈循环令人上瘾。作者有些朋友完全沉浸在构建中，忽略了生活中的人。

**三点提醒**：
1. 休息，去摸草
2. 跟爱的人聊天
3. 做有人需要的东西——哪怕"有人"只是你自己

如果要做给更多人，遵循 Gary Vaynerchuk 的内容路径：从一个注意到你的人开始，然后三个、十个、一百个，逐步积累。

---

## 十五、技巧速查表

| # | 技巧 | 一句话 | 关联度 |
|---|------|--------|--------|
| 1 | /ce-plan | 有想法先写 plan，永远不跳过 | ★★★ |
| 2 | 不读 plan | Plan 是 agent 的缰绳，不是给你读的 | ★★★ |
| 3 | 非代码也用 plan | 策略、文档、分析都用 plan→work 循环 | ★★★ |
| 4 | 语音输入 | Monologue/Wispr Flow，LLM 容错率高 | ★★ |
| 5 | cmux 多标签 | 4-6 个 session 异步并行 | ★★ |
| 6 | 终端默认 Claude | 新标签 = agent，降低启动成本 | ★ |
| 7 | 远程+邮件 | 手机操控桌面 agent | ★★ |
| 8 | YOLO 模式 | 跳过权限确认 + 完成音效 | ★★ |
| 9 | Claude + Codex | 双引擎：Claude 规划，Codex 构建 | ★★★ |
| 10 | last30days | 做事前先调研社区最新讨论 | ★★★ |
| 11 | Granola | 原始会议转录直接丢给 agent | ★★ |
| 12 | 人类信号 | 你出品味，agent 出量 | ★★★ |
| 13 | 视频 | HyperFrames 制作视频 | ☆ |
| 14 | 笔记=知识库 | Obsidian/Bear 作为 agent 上下文 | ★★★ |
| 15 | Mac mini | Mosh + Tmux 远程开发 | ☆ |
| 16 | Proof | 分享 plan 给非终端用户审阅 | ☆ |
| 17 | 写 Skills | 重复两次以上的事封装成 skill | ★★★ |
| 18 | 开源贡献 | plan→work 循环同样适用于开源 | ★ |
| 19 | 硬件 | M5 Max 64GB + Anker 电源方案 | ☆ |
| 20 | Printing Press | CLI 驱动现实生活服务 | ★ |
| 21 | AI 成瘾 | 注意沉迷，保持生活平衡 | ★★★ |
| 22 | 本文写法 | 这篇文章本身就是这样写出来的 | — |

---

> [!note]- 延伸阅读：低关联技巧详情
> ### 技巧 13：HyperFrames 视频制作
>
> [HyperFrames](https://hyperframes.heygen.com/) 允许用 HTML 构建视频，agent 可以编写。流程：写 `script.md`（逐场景、动态排版、字幕）→ agent 渲染为 MP4。作者用它做产品发布视频，甚至把渲染好的 demo 直接放进 GitHub PR。上传 GIF 到 [catbox](https://catbox.moe/) 可以在 GitHub README/PR/Issue 中精美渲染。
>
> ### 技巧 15：Mac mini 远程工作
>
> - **Mosh**：替代 SSH，在差网络和漫游下保持 session 响应流畅（普通 SSH 下 Claude Code 几乎不可用）
> - **Tmux**：跨大西洋航班上 SSH 进远程机器，断网 20 分钟重连后 session 原封不动
> - **Hermes + OpenClaw**：自主远程 agent，Hermes 有自学习回路，OpenClaw 有广度
> - **Agent Cookie**：Mac mini 和主力 Mac 之间同步 cookies 和 .env
>
> ### 技巧 16：Proof 编辑器
>
> [Proof](https://proofeditor.ai/)（Every 出品）用于把 plan.md 分享给不活在终端里的同事。在 Proof 中打开 plan，发送链接，对方可以在浏览器中阅读和评论，评论可以回流到 agent 循环中。
>
> ### 技巧 19：硬件配置
>
> 作者从两年前的旧笔记本升级到 M5 Max 64GB，但仍被工作负载（6 个 Claude session + Codex）消耗到电池只能撑一小时。解决方案：
> - `sudo pmset -a disablesleep 1` 防止休眠
> - 随身携带 Anker 电池砖
> - 车里放一个 Anker 充电器

---

## 相关笔记

- [[2026年学编程路线与Agentic Engineering]] — Tina Huang 的编程学习路线，Agentic Engineering 范式的先行介绍
- [[Harness Engineering——人类掌舵 Agent 执行]] — Ryan Lopopolo (OpenAI) 的驾驭层理念
- [[AI编码全流程工作流——Matt Pocock 工作坊]] — Matt Pocock 的六阶段 AI 编码实操流程
- [[软件基础在AI时代更重要——Matt Pocock]] — AI 时代的软件基础价值与五大失败模式
- [[AI编码能力提升路线]] — 基于当前情况制定的六大 AI 编码提升方向
- [[Claude Code/Claude Code Skills 与 MCP 精华笔记]] — Skills 和 MCP 的速查与安装指南
- [[Claude Code/ECC（Everything Claude Code）知识手册]] — Claude Code 全面知识
- [[Agent与自动化/Codex 写计划、Claude Code CLI 写代码：模型与成本选型建议]] — 与技巧 9 互补的分工与成本建议
- [[Agent与自动化/AI Agent 自动化任务方案对比]] — 自动化方案选型参考
