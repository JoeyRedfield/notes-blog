---
title: "AI Agent 自动化任务方案对比"
subtitle: "传统 Cron vs Codex Automations vs Claude Code Routines vs 自建方案——四种范式的原理、优劣与选型"
created: 2026-05-25
tags:
  - "ai-agent"
  - "自动化"
  - "定时任务"
  - "claude-code"
  - "codex"
  - "知识手册"
---

# AI Agent 自动化任务方案对比

> 四种方案本质不同：Cron 跑的是固定脚本，Codex Automations 跑的是 AI 增强版个人定时器，Claude Routines 跑的是云端常驻 Agent，自建方案跑的是 Claude Code + 第三方模型的本地 AI 定时任务。

---

## 一、三种范式的技术原理

### 1.1 传统 Cron —— 确定性定时执行

```
cron 表达式 → 到时间 → 执行固定脚本 → 输出日志
```

- **无 AI**：运行的是预先写死的命令或脚本
- **无状态**：每次执行从零开始，不保留上次的上下文
- **本地执行**：依赖服务器或本机在线

### 1.2 Codex Automations —— 桌面端 AI 定时器

```
Schedule 触发 → 唤醒 Codex App → 在同一线程中继续上下文 → AI 推理执行 → 结果进入 Review Queue
```

- **核心机制**：Thread Automations（线程自动化）——定时唤醒**同一个对话线程**，保留完整上下文
- **底层持久化**：`/goal` 命令基于 **SQLite** (`thread_goals` 表)，记录目标、状态、token 预算、已用时间
- **Heartbeats**（心跳）：类 cron 循环，每 N 分钟检查一次，配合 `@computer` 操作全自动执行
- **Chronicle**（记忆驱动）：记录全天活动 → 自动识别重复模式 → 转化为可复用技能
- **局限**：依赖 Codex App 在本机运行，笔记本合上就停了

### 1.3 Claude Code Routines —— 云端常驻 Agent

```
Schedule / API / GitHub Event → 云端触发 → 完整 Claude Code 会话 → 读写仓库 + Connectors → 输出可审查会话
```

- **云端执行**：Anthropic 云基础设施运行，笔记本关机也照跑
- **三种触发方式**：定时（cron）、API（HTTP POST + Bearer Token）、GitHub 事件（PR/Release/Issue）
- **完整会话**：不是简单的脚本执行，而是完整的 Claude Code 云会话
- **配额限制**：Pro 5 次/天、Max 15 次/天、Team/Enterprise 25 次/天，最小间隔 1 小时

### 1.4 自建 AI 定时任务 —— Cron + Claude Code + 第三方模型

```
系统 Cron → 触发 → Claude Code CLI（新会话）→ DeepSeek/其他 Anthropic 兼容 API → AI 推理执行
   ↑                    ↑
 定时调度          Skills + Hooks + MCP + 子Agent 全部照常工作
```

- **调度层**：标准系统 Cron（Claude Code 的 CronCreate 本质就是帮你写入 `.claude/scheduled_tasks.json`）
- **Harness 层**：Claude Code CLI——Skills、Hooks、MCP、子 Agent、规则文件全部正常工作，与使用 Anthropic 官方 API 时无差异
- **模型层**：第三方 API（DeepSeek 等），通过 `ANTHROPIC_BASE_URL` 接入
- **典型用户画像**：因 VPN/网络环境无法使用 Claude 官方 API，或追求成本控制（DeepSeek 便宜 85-95%）的用户
- **局限**：电脑关机就停、定时任务 7 天自动过期需续期、没有 Webhook/API 事件触发、每次启动是新会话（无上下文延续）

### 1.5 自建方案运行时细节：REPL、调度机制与上下文污染

自建方案的本质是"在现有 Claude Code 会话中排队一个任务，到时间后注入当前会话"。理解这一点需要先了解 REPL。

#### REPL 机制

Claude Code 的交互核心是一个 **REPL**（Read-Eval-Print Loop）状态机，由 `QueryGuard` 锁保证严格串行：

```
┌──────────────────────────────────────┐
│                                      │
│   Read（空闲等输入）                   │
│       ↓ 用户按 Enter                 │
│   Eval（模型推理 + 工具执行）          │
│       ↓                              │
│   Print（流式输出 token）             │
│       ↓                              │
│   Read（回到空闲）                    │
│                                      │
│   定时任务在 Read 阶段插入 ←           │
└──────────────────────────────────────┘
```

| 阶段 | Claude Code 在干嘛 | 定时任务 |
|------|-------------------|:---:|
| **Read**（空闲） | `PromptInput` 组件活跃，每秒检查到期任务 | ✅ **此时触发** |
| **Eval**（推理中） | 模型推理中、工具执行中，QueryGuard 锁持有 | ❌ 排队等待 |
| **Print**（流式输出） | 逐 token 输出文本 | ❌ 排队等待 |

关键设计：
- 调度器**每秒检查一次**有无到期任务
- **只在 REPL 空闲时触发**——绝不打断正在运行的推理
- 如果到时间时正在推理中，等待当前轮次结束后再触发
- 如果到时间时**所有窗口都忙**，可能**直接跳过**

> 来源：[DeepWiki - Claude Code REPL](https://deepwiki.com/claude-code-best/claude-code/10.1-repl-screen-and-conversation-flow)、[Claude Code Docs - Scheduled Tasks](https://code.claude.com/docs/en/scheduled-tasks)

#### 上下文污染问题

**这是自建方案最大的缺陷**——定时任务**注入到你当前会话中执行**，不是开新窗口，不是在后台静默跑。

```
你的上下文 = 之前对话历史（可能累积了数万 tokens）
           + 定时任务 prompt
           + 定时任务执行过程（工具调用 + AI 推理）

→ 周报任务跑完，你的对话窗口里能看到全部执行过程
→ 你之前的对话内容也会混入周报生成的 context
```

已知的关联问题（GitHub Issues）：

- **Issue #2572**：同一项目下不同会话的上下文相互"串台"—Claude 说出 "based on previous session" 然后执行与当前任务无关的操作
- **Issue #7702**：两个 Claude Code 会话在同一项目目录下**共享聊天历史**，按上箭头能翻到另一个会话的输入
- **Issue #16311**：`.claude/CLAUDE.local.md` 在同一项目所有并发会话间**共享**，一个会话的修改会影响其他会话

这说明上下文隔离在 Claude Code 中尚未完全解决。

> 来源：[GitHub Issue #2572](https://github.com/anthropics/claude-code/issues/2572)、[Issue #7702](https://github.com/anthropics/claude-code/issues/7702)、[Issue #16311](https://github.com/anthropics/claude-code/issues/16311)

#### 实际场景推演

以你的周报任务（周一 9:07）为例：

| 当时状态 | 结果 |
|---------|------|
| 你开着 Claude Code 且空闲 | 在当前窗口执行周报任务，你能看到全部过程 |
| 你正在跟 Claude Code 对话 | 等当前轮次结束，空闲时触发 |
| 你开了多个窗口，其中一个空闲 | 在空闲的那个窗口执行 |
| 所有窗口都忙或没开 | **错过了**。下次启动时作为"遗漏任务"补上 |
| 你在做敏感/重要任务时被插入周报 | 周报占用你的上下文，可能影响当前任务质量 |

#### 与 Claude Routines 的运行隔离对比

| 维度 | 自建（CronCreate） | Claude Routines |
|------|:---:|:---:|
| 执行环境 | **当前会话中** | 独立云端会话 |
| 上下文隔离 | ❌ 混入当前对话 | ✅ 每次是干净新会话 |
| 是否可见 | ✅ 用户看到全部执行过程 | ⚠️ 执行完可审查 |
| 会污染对话吗 | ❌ **会** | ✅ **不会** |
| 并发安全性 | ❌ 多窗口可能冲突 | ✅ 云端独立调度 |
| 可关闭 | 设 `CLAUDE_CODE_DISABLE_CRON=1` | 直接暂停 Routine |

> 来源：[Claude Code Docs - Scheduled Tasks](https://code.claude.com/docs/zh-CN/scheduled-tasks)、[Miraflow - Claude Code Routines Guide](https://miraflow.ai/blog/claude-code-routines-explained-ai-works-while-you-sleep-complete-setup-guide-2026)

#### 缓解措施

| 措施 | 效果 |
|------|------|
| 定时任务触发时手动确认 | 不会静默执行 |
| 设 `CLAUDE_CODE_DISABLE_CRON=1` | 完全关闭，避免干扰 |
| 开一个专门用来执行定时任务的窗口 | 隔离影响（但要注意 #7702 的串台问题） |
| 任务完成后 `/clear` | 清理被污染的上下文 |
| 使用 `git worktree` 创建隔离工作区 | 物理隔离，但操作复杂 |

---

> 来源：[Kanaries - Claude Code Routines](https://docs.kanaries.net/zh/topics/AICoding/claude-code-routines)、[SiliconANGLE 报道](https://siliconangle.com/2026/04/14/anthropics-claude-code-gets-automated-routines-desktop-makeover/)、[OpenAI Academy - Codex Automations](https://openai.com/academy/codex-automations/)

---

## 二、全面对比

### 2.0 四种范式一句话定义

```
Cron：     系统定时 → 固定脚本 → 日志
Codex：    桌面定时 → 同一线程唤醒 → AI 自适应执行 → Review Queue
Routines： 云端定时/API/GitHub → 完整 Claude Code 会话 → 云端可审查
自建：     系统 Cron → Claude Code CLI → 第三方模型 API → AI 执行
```

### 2.1 核心维度

| 维度 | 传统 Cron | Codex Automations | Claude Code Routines | 自建（Cron + CC + 第三方模型） |
|------|-----------|-------------------|---------------------|--------------------------|
| **运行位置** | 本机/服务器 | 本机（Codex App） | **云端** | 本机 |
| **触发方式** | 仅时间 | 仅时间 | 时间 + API + GitHub 事件 | 仅时间（CronCreate） |
| **AI 推理** | ❌ 无 | ✅ 有 | ✅ 有 | ✅ 有（依赖第三方模型能力） |
| **上下文延续** | ❌ 每次从零开始 | ✅ 同一线程唤醒 | ⚠️ 每次是完整新会话 | ❌ 每次是新会话 |
| **设备依赖** | 需要服务器在线 | **需要 Mac 开机** | **不需要** | **需要本机开机** |
| **外部集成** | 需自行编码 | 有限 | Connectors（Slack/Linear 等） | MCP（仅本地可用） |
| **输出审查** | 日志文件 | Review Queue | 可审查的会话记录 | 会话记录 + 文件变更 |
| **模型成本** | 无 | ChatGPT 订阅内含 | Pro/Max 订阅内含 | **极低**（DeepSeek 省 85-95%） |
| **厂商锁定** | 无 | OpenAI 生态 | Anthropic 生态 | **无**（自由切换 API） |

### 2.2 智能化程度

| 维度 | 传统 Cron | Codex Automations | Claude Code Routines | 自建 |
|------|-----------|-------------------|---------------------|------|
| 自适应能力 | ❌ | ✅ 根据上下文调整 | ✅ 完整 Agent 自主决策 | ✅ Skills + Agent 驱动 |
| 多步推理 | ❌ | ⚠️ 有限 | ✅ 子 Agent + 工具调用 | ✅ 子 Agent + MCP |
| 自我纠错 | ❌ | ⚠️ 有限 | ✅ 验证闭环 | ⚠️ 取决于模型能力 |
| 外部工具调用 | ❌ | ✅ `@computer` 操作 | ✅ MCP + Connectors | ✅ MCP + Hooks |
| 视觉/图片能力 | ❌ | ✅ | ✅ | ❌（DeepSeek 不支持） |

### 2.3 任务持久化机制

| 维度 | 传统 Cron | Codex Automations | Claude Code Routines | 自建 |
|------|-----------|-------------------|---------------------|------|
| **持久化方式** | 无 | SQLite（`thread_goals` 表） | `.claude/scheduled_tasks.json` | `.claude/scheduled_tasks.json` |
| **状态追踪** | 退出码 | goal_id 版本化 + 状态机 | 会话记录 | 会话记录 + Git 变更 |
| **中断恢复** | ❌ | ✅ 自动续跑 | ✅ 云端保留会话 | ❌（新会话从零开始） |
| **预算控制** | ❌ | ✅ token/时间预算 | ❌ | ❌（API 用量靠 DeepSeek 后台监控） |
| **生命周期** | 手动管理 | 线程不销毁则长期 | 长期 | **7 天自动过期**（需续期） |

> 来源：[GitHub Gist - Codex /goal architecture](https://gist.github.com/patleeman/b1b5768393f9bf2f60865b1defeeb819)、[Anthropic - Claude Code Routines](https://github.com/anthropics/claude-code/issues/4785)

---

## 三、适用场景矩阵

| 场景 | 推荐方案 | 理由 |
|------|---------|------|
| 简单固定任务（备份、清理日志、重启服务） | **Cron** | 不需要 AI，cron 最可靠最省 |
| 个人开发者，日常定时 AI 辅助（每日 PR review） | **Codex Automations** | 已付 ChatGPT 订阅，零额外成本 |
| 需要关电脑后继续跑的任务 | **Claude Routines** | 云端执行，不依赖本机 |
| 由外部事件触发的任务（告警、部署、GitHub） | **Claude Routines** | API + GitHub 事件触发 |
| 需要跨天跨周保留完整上下文的长期任务 | **Codex Automations** | 同一线程唤醒，上下文不丢 |
| 企业级、需审计的成本中心隔离 | **Claude Routines** | 独立配额、独立计费 |
| CI/CD 流水线中的 AI 环节 | **Claude Routines** | HTTP API 触发，可嵌入 pipeline |
| 预算极其敏感的场景 | **Cron + Shell** 或 **自建方案** | 自建用 DeepSeek 成本极低 |
| 无法使用 Claude 官方 API（VPN/网络限制） | **自建方案** | 不依赖 Anthropic 云端 |
| 高频率任务（< 1 小时间隔） | **Cron** 或 **自建** | Claude Routines 最小间隔 1 小时 |
| 需要完全掌控技术栈、不想锁定厂商 | **自建方案** | 自由切换 API 提供商 |

---

## 四、选型决策树

```
任务需要 AI 推理吗？
├── 不需要 → 传统 Cron
└── 需要
    ├── 电脑关机后还要跑？
    │   ├── 是 → Claude Code Routines
    │   └── 否
    │       ├── 能使用 Claude 官方 API 吗？
    │       │   ├── 不能（VPN/网络限制）→ 自建方案（Cron + Claude Code + 第三方 API）
    │       │   └── 能
    │       │       ├── 需要保留跨天上下文？
    │       │       │   ├── 是 → Codex Automations
    │       │       │   └── 否
    │       │       │       ├── 已有 ChatGPT 订阅？
    │       │       │       │   ├── 是 → Codex Automations
    │       │       │       │   └── 否 → Claude Code Routines
    │       │       │       └── 需要 GitHub 事件触发？
    │       │       │           └── → Claude Code Routines
    │       │       └── 企业级需求（审计/成本中心）？
    │       │           └── → Claude Code Routines
    │       └── 想极致省钱？
    │           └── → 自建方案（DeepSeek API 省 85-95%）
    └── 需要高频（< 1 小时间隔）？
        └── → Cron + Shell 或 自建方案
```

---

## 五、针对当前场景：笔记库周报自动化

回到这个具体需求——**每周自动生成 notes 笔记库周报**：

| 方案 | 可行性 | 评价 |
|------|:---:|------|
| **Claude Code CronCreate** | ✅ 可用 | 免费、已配好、在 Obsidian 同一环境中。但 7 天过期需续期，关机不执行 |
| **Claude Code Routines** | ✅ 理想 | 云端执行不依赖本机、API/GitHub 触发、不自动过期。但需 Pro 以上订阅，且有每日次数限制 |
| **Codex Automations** | ⚠️ 需切换 | 需要 Codex App 运行，还需迁移到 Codex 生态 |
| **传统 Cron + git log 脚本** | ✅ 最稳 | 不需要 AI 也能生成基本报告（文件变更列表），但无法智能分类和写摘要 |

### 推荐

你的约束条件：无法使用 Claude 官方 API（VPN 环境），已接入 DeepSeek API。

| 方案 | 适合你吗？ | 理由 |
|------|:---:|------|
| **自建（CronCreate + DeepSeek）** | ✅ **当前最优** | 已配好、成本极低、已验证可用。唯一缺点是 7 天过期需续期 |
| Claude Code Routines | ❌ | 需要 Claude 官方 API，你的 VPN 环境不可用 |
| Codex Automations | ❌ | 需要切换到 Codex 生态 |
| 传统 Cron + Shell | ⚠️ 兜底 | 只生成文件列表 + commit 记录，无 AI 智能分类和摘要 |

**实际策略**：

- **主力**：自建方案（CronCreate + DeepSeek），每周自动生成周报
- **续期**：注意 7 天过期限制，过期后重新创建定时任务即可
- **兜底**：如果不想要 AI 生成内容（只需文件列表），直接 `git log --since="7 days ago"` 就够

---

## 六、2026 年已验证的高价值自动化场景

| 场景 | 推荐方案 | 触发方式 |
|------|---------|---------|
| 夜间 Issue 分类打标 | Claude Routines | Schedule（每晚） |
| 告警分诊 → 关联提交 → 草拟修复 | Claude Routines | **API**（告警系统调用） |
| 部署后自动冒烟测试 | Claude Routines | **API**（CD pipeline 调用） |
| PR 自动代码审查 | Claude Routines | **GitHub**（PR 事件） |
| 文档漂移检测（周报） | Claude Routines | Schedule（每周） |
| 每日晨间简报 | Codex Automations | Schedule（每天早上） |
| 跨语言 SDK 同步 | Claude Routines | GitHub（SDK PR 合并事件） |
| 定期依赖审计 | Cron + Shell | Schedule |

> 来源：[Kanaries - Claude Code Routines](https://docs.kanaries.net/topics/AICoding/claude-code-routines)、[Miraflow - Complete Setup Guide](https://miraflow.ai/blog/claude-code-routines-explained-ai-works-while-you-sleep-complete-setup-guide-2026)

---

## 七、关键结论

1. **这是四种不同范式的产物，不是同一事物的四个版本**——Cron 跑脚本，Codex 跑桌面 AI，Routines 跑云端 Agent，自建跑本地 Claude Code + 第三方模型

2. **核心分水岭有两个**：
   - **执行位置**：Cron = 你的机器 / Codex = 你的桌面 / Routines = 云端 / 自建 = 你的机器
   - **模型来源**：Cron = 无 / Codex = OpenAI / Routines = Anthropic / 自建 = **任意**

3. **自建方案填补了一个重要空白**：无法使用 Claude 官方 API 的用户（VPN 限制、网络环境、成本控制），可以用 Claude Code 的完整能力 + 第三方模型实现 AI 定时任务

4. **AI 自动化的真正价值不在"省掉手动输入 cron 表达式"，而在"任务本身能根据实际情况自适应"**

5. **不要只用一个工具**：团队常见组合是 Cursor（IDE 日常）+ Claude Code（复杂任务）+ Claude Routines（云端定时）+ 传统 Cron（简单固定任务）。自建用户用 CronCreate + DeepSeek 替代 Routines

---

## 八、关联笔记

- [[Claude Code 接入 DeepSeek 完整配置]] — 自建方案的核心配置文件
- [[AI Harness（驾驭层）知识手册]] — 理解 Agent 运行时基础设施（Harness = 自建方案的中间层）
- [[ECC（Everything Claude Code）知识手册]] — ECC 的自动化 Hook 体系

---

## 九、进一步阅读

- [OpenAI Academy - Codex Automations](https://openai.com/academy/codex-automations/)
- [Kanaries - Claude Code Routines 指南](https://docs.kanaries.net/zh/topics/AICoding/claude-code-routines)
- [SiliconANGLE - Anthropic Introduces Routines](https://siliconangle.com/2026/04/14/anthropics-claude-code-gets-automated-routines-desktop-makeover/)
- [Miraflow - Claude Code Routines Complete Setup Guide](https://miraflow.ai/blog/claude-code-routines-explained-ai-works-while-you-sleep-complete-setup-guide-2026)
- [GitHub - Codex scheduled tasks Issue #8317](https://github.com/openai/codex/issues/8317)
- [GitHub Gist - Codex /goal slash command architecture](https://gist.github.com/patleeman/b1b5768393f9bf2f60865b1defeeb819)
- [Yage.ai - Three Products, Three Companies: Coding Agent DNA Divergence](https://yage.ai/share/anthropic-coding-agents-dna-divergence-en-20260416.html)
- [Codex CLI Automation: Workflow Patterns](https://smartscope.blog/en/generative-ai/chatgpt/codex-cli-automation-workflow-patterns/)

---

## 2026 年生态更新

> 本章节记录 2026 年 4-5 月间 AI Agent 自动化领域的重大进展。截至 2026 年 6 月，定时任务/自动化已成为所有主流 AI 编码平台的标配能力。

### 1. Claude Code Routines 正式发布（2026.04.14）

2026 年 4 月 14 日，Anthropic 在 Claude Code 桌面版大改版中正式推出 **Routines**，定位为"云端常驻 Agent 模板"。关键变化：

| 维度 | 此前的 `/schedule` CLI 命令 | Routines（正式版） |
|------|--------------------------|-------------------|
| 管理界面 | 仅 CLI `/schedule` | Web 控制台 `code.claude.com/docs/en/routines` |
| 触发方式 | 仅定时 | **三种**：定时（cron）+ API（HTTP POST + Bearer Token）+ GitHub 事件 |
| 配额 | 无独立配额概念 | Pro 5/天、Max 15/天、Team/Enterprise 25/天，可按量加购 |
| 网络控制 | 无 | 可配置网络隔离级别 |
| 环境变量 | 不支持 | 安全注入 API Key、Token 等密钥 |
| 分支安全 | 无 | 默认仅可推送到 `claude/*` 前缀分支 |
| 身份 | 无 | 以用户身份操作（commit、PR、Slack 消息均带用户凭证） |

旧 `/schedule` 命令创建的任务**自动迁移**至 Routines 体系。

> 来源：[Claude Code Docs - What's New Week 16](https://code.claude.com/docs/en/whats-new/2026-w16)、[InfoQ 中文报道](https://www.infoq.cn/article/pqiTGU8VMOZ1fOZh8H98)、[SiliconANGLE](https://siliconangle.com/2026/04/14/anthropics-claude-code-gets-automated-routines-desktop-makeover/)

### 2. OpenAI Codex Automations 重大升级（2026.03-04）

OpenAI Codex 在 2026 年 Q1-Q2 经历了一系列密集更新，自动化能力大幅增强：

| 时间 | 更新 | 核心内容 |
|------|------|---------|
| **2026.03** (v26.312) | 自动化重构 | 可选本地/worktree 执行、自定义推理级别和模型、模板化创建 |
| **2026.03** | **Triggers（事件触发器）** | GitHub Issue/PR 创建、CI 失败、@mention 时自动触发，无需人工干预 |
| **2026.04** (v26.415) | **Thread Automations（线程自动化）** | 定时自唤醒、跨天跨周保留完整上下文、休眠后可断点续跑 |
| **2026.04** | Computer Use (macOS) | 可直接操作 Mac 应用，`@computer` 能力全面开放 |
| **2026.04** | 插件系统 + 应用内浏览器 | 90+ 插件、内存预览、产物查看器 |
| **2026.05** | Codex for Chrome + 并行标签页 | 浏览器扩展，后台并行工作 |

**关键变化**：Codex 从"桌面端 AI 定时器"演进为具备 **事件驱动 + 定时调度 + 跨天上下文延续 + 桌面操控** 的完整自动化平台。

> 来源：[OpenAI Codex Changelog](https://developers.openai.com/codex/changelog?type=codex-app)、[GitHub Release v0.135.0](https://github.com/openai/codex/releases/tag/rust-v0.135.0)、[163 报道](https://www.163.com/dy/article/KQO8D93K051180F7.html)

### 3. 新竞争者入场：2026 年新发布的 Agent 定时/自动化方案

2026 年 4-5 月，多家厂商推出 AI Agent 定时调度能力，竞争格局从三足鼎立转向群雄逐鹿：

#### 3.1 Google — Gemini Spark + Antigravity 2.0（2026.05 I/O 大会）

| 产品 | 定位 | 核心能力 |
|------|------|---------|
| **Gemini Spark** | 7x24 云端后台 Agent | 基于 Gemini 3.5 Flash，Google Cloud 虚拟机常驻运行。三大核心模块：**Tasks**（任务分解执行）、**Skills**（可复用能力）、**Schedules**（定时/条件触发）。手机关机也能跑，支持多步骤自主决策。 |
| **Antigravity 2.0** | 通用 Agent 工作平台 | 从 IDE 转型为通用 Agent 平台。新增 `/schedule` 命令（一次性 + 周期性调度）、**Managed Agents**（一次 API 请求即可在隔离 Linux 环境启动长驻 Agent）。 |

> 来源：[IT之家 - Antigravity 2.0](https://www.ithome.com/0/952/535.htm)、[Gigazine - Gemini Spark](https://gigazine.net/gsc_news/en/20260520-google-gemini-spark)

#### 3.2 OpenAI — ChatGPT Workspace Agents（2026.04）

- **7x24 云端运行**，员工离线后持续执行复杂长周期工作流
- 支持定时调度 + Slack 集成，可自动回复问题、链接文档、提交工单
- 面向 Business / Enterprise / Edu 用户，2026 年 5 月 6 日后转为计费模式
- 与 Codex 的定位差异：Workspace Agents 面向**非开发者团队工作流**，Codex 面向**开发者编码任务**

> 来源：[IT之家 - ChatGPT Workspace Agents](https://www.ithome.com/0/942/362.htm)、[SiliconANGLE](https://siliconangle.com/2026/04/22/openai-subscribers-get-new-workspace-agents-automate-complex-tasks-across-teams/)

#### 3.3 Notion — Custom Agents（2026.02 公测）

- 在 Notion 工作区内**后台定时运行或按触发器自动执行**
- 典型场景：自动 Q&A、任务分类派发、定期生成报表
- 支持跨 Slack / 邮件 / 日历集成，按使用量计费（Notion Credits）

> 来源：[IT Brief - Notion Custom Agents](https://itbrief.in/story/notion-unveils-custom-agents-to-automate-team-workflows)

#### 3.4 Emergent — Wingman（2026.04）

- **始终在线**的后台自主 Agent，支持**时间表 + 事件触发器**双模调度
- 跨 Gmail / Outlook / Slack / CRM / GitHub / WhatsApp 执行任务
- 区分低风险自动执行与高风险需确认动作

> 来源：[IT Brief - Emergent Wingman](https://itbrief.in/story/emergent-launches-wingman-autonomous-ai-agent-for-work)

#### 3.5 其他值得关注的发布

| 厂商 | 工具 | 亮点 |
|------|------|------|
| **Automation Anywhere** | APA 平台 2026 增强版 | Context Intelligence Graph（4 亿+ 执行数据）、AI Evaluations、低代码 Agent 构建 |
| **Productive 5.0** | AI Agents | 面向专业服务公司，自动处理资源分配、时间追踪、报表 |
| **Freshworks** | Freddy AI Agent Studio | 无代码客服 Agent，覆盖工时外 47% IT 工单 |

> 来源：[TMCnet - Automation Anywhere](https://www.tmcnet.com/usubmit/2026/05/19/10385176.htm)、[GlobeNewsWire - Productive 5.0](https://www.globenewswire.com/de/news-release/2026/05/12/3293312/0/en/productive-launches-5-0-with-ai-agents-that-free-teams-from-routine-work.html)、[IT Brief - Freshworks](https://itbrief.in/story/freshworks-launches-freddy-ai-agent-studio-for-service)

### 4. 2026 年行业趋势总结

1. **「始终在线」成为标配**：几乎所有新发布的 Agent 都支持 7x24 云端/后台运行，脱离人工实时交互
2. **定时 + 触发器双模调度**：不再仅依赖 cron 式周期性任务，事件驱动触发（GitHub 事件、告警、CI 状态变化）成为第二引擎
3. **从「个人助手」走向「团队 Agent」**：可共享、可协作、可跨工具集成，治理与权限控制成为差异化卖点
4. **云端沙箱执行**：Google 和 OpenAI 均采用云虚拟机承载 Agent，确保隔离性和持久化状态
5. **定价模式转向按用量**：从固定席位费转向基于 credits / token 的使用量计费
6. **竞争格局从三足鼎立走向多极化**：2026 年初是 Anthropic（Routines）vs OpenAI（Codex）vs 自建，年中 Google（Gemini Spark）、Notion、Emergent 等均已入局

### 5. 对本文原对比框架的影响

| 原方案 | 2026 年 6 月状态 |
|--------|:---:|
| 传统 Cron | 仍是最简单可靠的选择，无变化 |
| Codex Automations | 从"桌面 AI 定时器"大幅升级为"事件驱动 + 定时 + 跨天上下文 + 桌面操控"平台 |
| Claude Code Routines | 从 Research Preview 正式发布，新增 Web 控制台、API/GitHub 触发、安全管控，可用性大幅提升 |
| 自建（Cron + CC + 第三方模型） | 仍是 VPN/网络受限用户的唯一解，但新平台（Gemini Spark、Wingman）可能成为替代选项 |

**新晋竞争者**：Gemini Spark 有望成为第一个**跨厂商覆盖**的云端 Agent 调度方案（不锁定特定 IDE）；Notion Custom Agents 将 Agent 自动化带入非开发者日常工作流。

### 6. 进一步阅读（2026 更新）

- [Claude Code Docs - What's New Week 16 (Routines Launch)](https://code.claude.com/docs/en/whats-new/2026-w16)
- [Claude Code Routines 官方文档](https://code.claude.com/docs/en/routines)
- [OpenAI Codex Changelog](https://developers.openai.com/codex/changelog?type=codex-app)
- [GitHub - Codex Release v0.135.0](https://github.com/openai/codex/releases/tag/rust-v0.135.0)
- [Gemini Spark 官方介绍](https://gigazine.net/gsc_news/en/20260520-google-gemini-spark)
- [IT之家 - Antigravity 2.0 发布](https://www.ithome.com/0/952/535.htm)
- [IT之家 - ChatGPT Workspace Agents](https://www.ithome.com/0/942/362.htm)
- [dev.to - Codex April 2026 Update Review](https://dev.to/bean_bean/openai-codex-april-2026-update-review-computer-use-memory-90-plugins-is-the-hype-real-2hnp)
- [BigHat Group - Codex Enterprise Automation](https://www.bighatgroup.com/blog/openai-codex-enterprise-ai-automation-april-2026/)
