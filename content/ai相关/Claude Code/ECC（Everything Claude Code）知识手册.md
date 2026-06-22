---
title: "ECC（Everything Claude Code）知识手册"
subtitle: "AI 编码 Agent 框架——是什么、怎么用、何时用"
created: 2026-05-25
updated: 2026-06-22
tags:
  - "claude-code"
  - "ai-agent"
  - "ecc"
  - "开发工具"
  - "知识手册"
source_type: community-snapshot
---

# ECC（Everything Claude Code）知识手册

> 系统梳理 ECC 的核心概念、架构、适用场景和使用决策，便于快速查阅和选型判断。

> [!warning]
> 这篇笔记既包含**相对稳定的框架定位**，也包含**强时效的项目数据和安装方式**。
> 我已在 `2026-06-22` 做了第一轮修正。当前阅读方式应改成：
>
> - “ECC 是什么、适不适合我” → 相对稳定
> - “现在有多少 stars / agents / skills、具体怎么安装、支持哪些 harness” → 时间快照，复用前要重新核对

## 先看当前稳定结论

截至 `2026-06-22`，更稳定的结论可以压成三条：

1. **ECC 已经不该再只理解成“Claude Code 插件”。** 它更像一个跨 harness 的 agent harness / operator layer。
2. **Claude Code 仍然是 ECC 的一等公民场景之一，但不是唯一目标。**
3. **真正容易过时的是顶层数字、安装路径、功能数量和兼容矩阵。**

---

## 一、一句话定义

**ECC（Everything Claude Code）** 是 Affaan Mustafa 创建的 AI 编码 Agent 框架——一套预配置的智能体（Agent）、技能（Skill）、钩子（Hook）、规则（Rule）和 MCP 配置集合，让 Claude Code 等 AI 编程工具从"代码补全助手"升级为"全流程开发搭档"。

> 来源：[GitHub 仓库](https://github.com/affaan-m/ECC)、[BigHatGroup 分析文章](https://www.bighatgroup.com/blog/everything-claude-code-ai-agent-harness-guide/)

---

## 二、核心数据（时间快照）

| 指标 | 数据（截至 2026.06.22 附近） |
|------|---------------------|
| GitHub Stars | **211K+** |
| Forks | **32K+** |
| 贡献者 | **230+** |
| 智能体 / 技能 / 命令数 | **不要信任本页旧数值，优先看仓库当前 README / 发布说明** |
| 支持语言 | **12+** 语言生态 |
| 许可证 | MIT |
| 官网 | [ecc.tools](https://ecc.tools) |

> 来源：GitHub 仓库首页与官网快照。
> 这里不再继续维护“精确 agent / skill / command 数”，因为这类数字变化过快，极易让知识页半过时。

---

## 三、起源与背景

- **2025 年 9 月**：Affaan 和队友参加 **Anthropic × Forum Ventures 黑客松**，使用 Claude Code 在 8 小时内构建了完整产品并获胜。
- **2026 年 1 月 17 日**：经过 10 个月的高强度日常使用和产品开发打磨后，将配置系统开源（初版 9 个 Agent、14 个命令、11 个 Skill）。
- **2026 年 1 月底**：突破 50,000 GitHub Stars。
- **2026 年 3 月**：突破 84,000 Stars，v1.8.0 发布，997 个测试通过。
- **2026 年 4 月**：v2.0.0-rc.1 发布，引入 Dashboard GUI、运营工作流、跨 harness 架构、Rust 控制层原型（ECC 2.0 alpha）。
- **2026 年 5 月**：达到 190,000+ Stars，29,500+ Forks。

> 来源：GitHub API、BigHatGroup 文章

---

## 四、名字辨析：ECC 的三个身份

ECC 有三种不同的标识符，**不可混用**：

| 标识符 | 用途 |
|--------|------|
| `affaan-m/ECC` | GitHub 源码仓库 |
| `ecc@ecc` | Claude Code marketplace/plugin 标识符 |
| `ecc-universal` | npm 包名 |

> 来源：仓库 README.md "Naming + Migration Note" 节

---

## 五、支持的 AI 编码工具（Harness）

ECC 设计为**跨框架通用**，并非仅限 Claude Code：

- **Claude Code**（主要目标）
- **OpenAI Codex**（CLI + App）
- **Cursor**
- **OpenCode**
- **Gemini**
- **Zed**
- **GitHub Copilot**
- **Qwen**
- **Antigravity**
- **Trae**

> 来源：仓库 README、发布说明与仓库目录。
> 这份列表本身也属于时间快照；这里更重要的是“ECC 是跨 harness 的”，而不是死记具体名单。

---

## 六、四层架构

ECC 的系统设计分为四个层级：

| 层级 | 说明 | 示例 |
|------|------|------|
| **交互层**（Interaction） | 57+ 斜杠命令 | `/code-review`、`/plan`、`/tdd` |
| **智能层**（Intelligence） | 25+ 专业 Agent | `code-reviewer`、`security-reviewer`、`planner` |
| **自动化层**（Automation） | 生命周期钩子 | `PreToolUse`、`PostToolUse`、`SessionStart`、`Stop` |
| **学习层**（Learning） | 跨会话持续学习 | v2 本能系统（Instincts），含置信度评分 |

> 来源：BigHatGroup 分析文章、SOUL.md

---

## 七、核心能力一览

### 7.1 Agent 体系（60 个）

ECC 按照"Agent-First"原则设计，**尽早就将工作路由到正确的专家 Agent**：

| 类别 | Agent 示例 | 用途 |
|------|-----------|------|
| 规划 | `planner`、`project-planner` | 需求拆解、实施计划 |
| 编码 | `tdd-guide`、`build-error-resolver` | 测试驱动开发、构建问题修复 |
| 审查 | `code-reviewer`、`security-reviewer`、`refactor-cleaner` | 代码质量、安全、重构 |
| 语言专项 | `typescript-reviewer`、`python-reviewer`、`go-reviewer`、`rust-reviewer`、`java-reviewer`、`kotlin-reviewer`、`cpp-reviewer` | 各语言专项审查 |
| 运维 | `chief-of-staff`、`loop-operator`、`harness-optimizer` | 编排、循环控制、性能优化 |
| 安全 | `security-reviewer` | 安全漏洞扫描、硬编码密钥检测 |

> 来源：AGENTS.md、SOUL.md、仓库 `agents/` 目录

### 7.2 核心设计原则（来自 SOUL.md）

1. **Agent-First** — 尽早就将工作路由到正确的专家
2. **Test-Driven** — 在信任实现变更之前，先写或更新测试
3. **Security-First** — 验证输入、保护密钥、保持安全默认值
4. **Immutability** — 优先选择显式状态转换而非可变修改
5. **Plan Before Execute** — 复杂变更应拆分为有意为之的阶段

> 来源：仓库 SOUL.md

---

## 八、三种上下文模式（Context Modes）

ECC 定义了三种工作模式，决定了何时使用哪种 Agent：

| 模式 | 文件 | 适用场景 | 关键 Agent |
|------|------|---------|-----------|
| **开发模式** | `dev.md` | 功能实现、Bug 修复 | `planner`、`tdd-guide`、`build-error-resolver` |
| **研究模式** | `research.md` | 探索、API 调研、原型验证 | `docs-lookup`、`architect` |
| **审查模式** | `review.md` | 代码质量、安全审计、维护 | `code-reviewer`、`security-reviewer`、`refactor-cleaner` |

> 来源：BigHatGroup 分析文章、DeepWiki (deepwiki.com)

---

## 九、什么时候该用 ECC？

### 适合使用的场景

| 场景 | 理由 |
|------|------|
| **你是 Claude Code 重度用户** | ECC 提供开箱即用的 Agent/Skill/规则体系，大幅减少每次会话的上下文铺垫 |
| **你需要在多个 AI 编码工具间切换** | ECC 支持 Claude Code/Codex/Cursor/OpenCode/Gemini 等 9 个框架，一套配置多平台复用 |
| **你需要标准化的开发工作流** | "Plan → TDD → Review → Commit" 的固定流程，适合团队统一规范 |
| **你需要跨会话记忆** | ECC 的内存持久化钩子可自动在会话间保存/加载上下文 |
| **你有复杂项目管理需求** | `planning-with-files` + `multi-*` 命令支持多 Agent 并行编排 |
| **你做安全敏感的代码开发** | 内置 AgentShield、安全扫描、CVE 防护 |
| **你想系统学习 AI 编码最佳实践** | 三个指南（精简/详细/安全）覆盖 Token 优化、评估体系、并行化等主题 |

### 不太适合的场景

| 场景 | 理由 |
|------|------|
| **你只是偶尔用 Claude Code** | ECC 的上下文量较大，偶尔使用反而增加开销 |
| **你的项目已有成熟的规则/提示词体系** | 叠加 ECC 可能导致规则冲突或重复 |
| **你需要极致轻量** | 60 个 Agent + 232 个 Skill 即使按需安装，对简单任务也偏重 |
| **你主要用非英语语言开发** | 虽然有 12 种语言翻译，但核心 Agent 的提示词以英文为主 |
| **你的机器性能有限** | Hook 和 Agent 运行时需要 Node/Python 环境，部分 Agent 启动较慢 |

> 来源：综合 README.md 安装建议、踩坑提醒

---

## 十、推荐使用流程

ECC 推荐的开发节奏：

```
Plan（计划） → TDD（测试驱动） → Implement（实现） → Review（审查） → Commit（提交）
```

1. **需求来了** → 先调用 `planner` 制定实施方案
2. **开始编码** → `tdd-guide` 引导先写测试
3. **构建报错** → `build-error-resolver` 自动排查
4. **代码写完** → `code-reviewer` 立即审查（仅报告 ≥80% 置信度的问题）
5. **涉及安全** → `security-reviewer` 强制扫描（commit 前必经步骤）
6. **提交之前** → 审查模式质量检查通过

> 来源：SOUL.md 核心原则、BigHatGroup 分析文章

---

## 十一、安装方式决策

> [!warning]
> 这一节最容易过时。
> 尤其是 `/plugin marketplace add ...`、`/plugin install ...`、`install.sh --profile ...` 这些入口，后续版本很可能继续调整。

| 方式 | 适用人群 | 注意事项 |
|------|---------|---------|
| **插件安装**（推荐） | 大多数用户 | 以仓库当前 README / maintainer 讨论区给出的命令为准 |
| **手动安装** | 需要精细控制 | `./install.sh --profile full`，不要和插件叠加 |
| **最小安装** | 不需要 Hook 的用户 | `./install.sh --profile minimal`，仅安装规则和基础技能 |
| **按需组件安装** | 不确定需要什么的用户 | 先用 `npx ecc consult "关键词"` 查询匹配组件 |

**关键提醒**：绝对不要既用插件安装又用手动安装器——这是最常见的故障原因。

截至 `2026-06-22`，我能核到的维护者建议安装路径，仍是先把 GitHub 仓库加入 Claude Code 的 plugin marketplace，再执行：

```text
/plugin install ecc@ecc
```

但这类命令本质上属于“当前发布面的操作说明”，复用前请以仓库 README 和 maintainer 讨论区最新说明为准。

---

## 十二、DeepSeek 兼容性分析

当 Claude Code 通过自定义 API 端点接入 DeepSeek 时，ECC 各组件的兼容情况如下：

### 12.1 兼容性总览

| 组件 | 兼容性 | 原因 |
|------|:---:|------|
| **Skills** | ✅ 完全兼容 | `SKILL.md` 无需修改，DeepSeek 实测能正确遵循 Skill 指令 |
| **Hooks** | ✅ 完全兼容 | Hooks 是 Claude Code **客户端侧**功能，由 Claude Code 进程调度，与后端模型无关 |
| **MCP 配置** | ✅ 完全兼容 | 标准化协议，配置格式不变 |
| **Sub-agents** | ✅ 完全兼容 | 设置 `CLAUDE_CODE_SUBAGENT_MODEL=deepseek-v4-pro` 即可 |
| **Rules（规则文件）** | ✅ 完全兼容 | 纯文本指令，注入上下文后模型可遵循 |
| **Commands（斜杠命令）** | ✅ 完全兼容 | 本质是预定义的 prompt 模板 |
| **Agent 执行质量** | ⚠️ 有折扣 | ECC Agent 提示词围绕 Claude 行为特征优化，DeepSeek 在安全审查、多文件推理场景下表现略逊 |
| **图片/视觉输入** | ❌ 不可用 | DeepSeek V4-Pro 是纯文本模型，发送图片仅收到占位符 |

> 来源：[阿里云 - DeepSeek V4-Pro 接入 Claude Code 实战](https://developer.aliyun.com/article/1733999)、[CSDN - DeepSeek V4 Pro 完整指南](https://blog.csdn.net/2501_93065236/article/details/161172926)、[SegmentFault - DeepSeek V4 对接 Claude Code](https://segmentfault.com/a/1190000047727977)

### 12.2 受影响较大的 ECC 功能

| 受影响场景 | 说明 |
|-----------|------|
| **代码审查 Agent** | `code-reviewer` 在 DeepSeek 下的安全漏洞判断可能不如 Claude 精准 |
| **安全扫描** | `security-reviewer` 严重依赖模型的安全推理能力，**不建议用 DeepSeek** |
| **多文件协同重构** | DeepSeek 在 6+ 文件协调修改时自洽性略逊于 Opus |
| **图片相关任务** | 截图分析、UI 还原、架构图理解等完全不可用 |
| **"Plan → TDD → Review → Commit" 流程** | DeepSeek 可能不如 Claude 严格遵循 ECC 的规划→测试→审查→提交节奏 |

### 12.3 推荐策略：混合使用

| 场景 | 推荐模型 | 理由 |
|------|---------|------|
| 日常编码、文档生成、数据处理 | **DeepSeek** | 成本低 85-95%，效果可接受 |
| 代码审查（`/code-review`） | **Claude**（优先） | 安全判断更可靠 |
| 安全扫描（`security-reviewer`） | **Claude**（必须） | 安全不容有失 |
| 涉及图片/截图的任务 | **Claude**（必须） | DeepSeek 不支持视觉 |
| 架构设计/复杂多文件重构 | **Claude**（优先） | 多文件一致性更好 |

### 12.4 DeepSeek 接入关键配置

> [!note]
> 这段配置要与 [[Claude Code 接入 DeepSeek 完整配置]] 一起看。
> 那一页已经在 `2026-06-22` 修正过：
> - `ANTHROPIC_AUTH_TOKEN` / `ANTHROPIC_API_KEY` 的边界
> - `ANTHROPIC_SMALL_FAST_MODEL` 已废弃
>
> 因此这里保留这段更多是为了说明“ECC 不会阻止你接 DeepSeek”，而不是推荐你逐字照抄。

```bash
export ANTHROPIC_BASE_URL="https://api.deepseek.com/anthropic"
export ANTHROPIC_AUTH_TOKEN="sk-你的密钥"   # 注意是 AUTH_TOKEN，不是 API_KEY
export ANTHROPIC_MODEL="deepseek-v4-pro[1m]"  # [1m] 开启 1M 上下文
export ANTHROPIC_DEFAULT_SONNET_MODEL="deepseek-v4-pro"
export ANTHROPIC_DEFAULT_OPUS_MODEL="deepseek-v4-pro"
export CLAUDE_CODE_SUBAGENT_MODEL="deepseek-v4-pro"
export CLAUDE_CODE_EFFORT_LEVEL="max"
export API_TIMEOUT_MS="600000"  # DeepSeek max effort 推理较慢
```

> 这里不再保留“必须用 `ANTHROPIC_AUTH_TOKEN`，否则 401”这种绝对说法。
> Claude Code 官方支持 `ANTHROPIC_API_KEY` 与 `ANTHROPIC_AUTH_TOKEN` 两种头；但 DeepSeek 官方 Claude Code 接入示例当前默认使用 `ANTHROPIC_AUTH_TOKEN`。
> 具体场景以 [[Claude Code 接入 DeepSeek 完整配置]] 中的修正版说明为准。

> 来源：[阿里云 - DeepSeek V4-Pro 接入实战](https://developer.aliyun.com/article/1733999)、[腾讯云 - DeepSeek 接入 Claude Code](https://cloud.tencent.com/developer/article/2607797)

---

## 十三、相关安全事件（了解背景）

ECC 在 README 中提到了相关的安全 CVE，这也是其内置安全扫描能力的背景：

| CVE 编号 | CVSS 评分 | 问题描述 |
|---------|----------|---------|
| **CVE-2025-59536** | 8.7 | 项目包含的代码可能在信任对话框接受之前执行 |
| **CVE-2026-21852** | - | 攻击者控制的 `ANTHROPIC_BASE_URL` 可能重定向 API 流量并泄露 API Key |

> 来源：Check Point Research 2026 年 2 月报告、BigHatGroup 文章

---

## 十四、与本文其它笔记的关联

- [[Claude Code Skills 与 MCP 精华笔记]] — ECC 是 Skills + MCP 思路的"集大成"实践，包含 232 个 Skill 和 MCP 配置
- [[ai应用开发路线参考]] — ECC 可作为 AI 应用开发工具链的核心组件

---

## 十五、进一步阅读

- **GitHub 仓库**：[https://github.com/affaan-m/ECC](https://github.com/affaan-m/ECC)
- **官方网站**：[https://ecc.tools](https://ecc.tools)
- **精简指南**（先读这个）：[Shorthand Guide to Everything Claude Code](https://x.com/affaanmustafa/status/2012378465664745795)
- **详细指南**：[Longform Guide to Everything Claude Code](https://x.com/affaanmustafa/status/2014040193557471352)
- **安全指南**：[Shorthand Guide to Everything Agentic Security](https://x.com/affaanmustafa/status/2033263813387223421)
- **BigHatGroup 独立分析**：[Everything Claude Code: The Agent Harness Your Team Is Missing](https://www.bighatgroup.com/blog/everything-claude-code-ai-agent-harness-guide/)
- **DeepWiki**：[ECC on DeepWiki](https://deepwiki.com/affaan-m/everything-claude-code)
- **ECC Tools GitHub App**：[GitHub Marketplace](https://github.com/marketplace/ecc-tools)

---

## 十六、历史核实记录（保留作时间切片）

> 核实日期：2026-06-01 | 数据来源：GitHub API、仓库 README.md、[ROSS Index Q1 2026](https://runacap.com/ross-index/q1-2026/)

> [!note]
> 本节保留的价值是“看这个项目增长有多快”，不是继续当作当前事实。
> 如果只是想知道 ECC 现在怎么样，请优先看仓库首页和最近 release。

### 16.1 核心数据对比

| 指标 | 原文数据（2026.05） | 核实数据（2026.06.01） | 变化 | 备注 |
|------|-------------------|----------------------|:--:|------|
| GitHub Stars | **190,000+** | **200,657** | +5.6% | GitHub API 实时数据，原文略有低估 |
| Forks | **29,500+** | **30,790** | +4.4% | GitHub API 实时数据 |
| 贡献者 | **170+** | **203** | +19% | 通过 GitHub API 分页头部获取 |
| 智能体（Agent） | **60 个** | **63 个** | +3 | 仓库 `agents/` 目录最新统计 |
| 技能（Skill） | **232 个** | **249 个** | +17 | 仓库 `skills/` 目录最新统计 |
| 旧版命令 | **75 个** | **79 个** | +4 | README 标注为 "legacy command shims" |

> 来源：GitHub API `GET /repos/affaan-m/ECC`（返回 `stargazers_count: 200657, forks_count: 30790`），贡献者数通过 API 分页 Link header 获取（203 页）。

### 16.2 原文未提及的重要新信息

以下信息在原文中未涉及，但在本次核实中发现：

#### 16.2.1 ROSS Index Q1 2026 排名第一

ECC Tools（`affaan-m/everything-claude-code`）在 **Runa Capital ROSS Index Q1 2026**（开源初创公司按 GitHub 星标增长排名）中位列 **第 1 名**：

| 指标 | 数据 |
|------|------|
| 排名 | **#1** |
| 期末星标 | 119.8K（截至 2026-03-31） |
| 增长率 | **119.8 倍** |
| 定位 | Agent harness 系统，含技能、智能体与安全扫描 |
| 对比 | 第二名 World Monitor 仅 45.5K stars / 45.5x 增长，不到 ECC 的一半 |

> 来源：[ROSS Index Q1 2026 - Runa Capital](https://runacap.com/ross-index/q1-2026/)

#### 16.2.2 AgentShield 安全引擎

ECC 生态中包含一个独立的安全组件 **AgentShield**（`affaan-m/agentshield`，2026 年 2 月 Cerebral Valley x Anthropic 黑客松构建），并非只是一个功能名称：

| 指标 | 数据 |
|------|------|
| 独立仓库 | [github.com/affaan-m/agentshield](https://github.com/affaan-m/agentshield) |
| 静态分析规则 | **102 条** |
| 测试用例 | **1,282 项** |
| 测试覆盖率 | **98%** |
| 运行方式 | CLI (`npx ecc-agentshield scan`)、GitHub Action、ECC 插件、GitHub App |
| 红蓝对抗 | `--opus` 模式运行 Red Team / Blue Team / Auditor 三代理管线 |
| 检测范围 | 密钥检测、权限审计、Hook 注入、MCP 漏洞、零宽度字符注入 |

> 来源：[AgentShield GitHub 仓库](https://github.com/affaan-m/agentshield)

#### 16.2.3 当前版本状态

原文记录的 v2.0.0-rc.1（2026 年 4 月）仍是当前最新版本。该版本引入了：
- Dashboard GUI（基于 Tkinter）
- Operator 工作流（运营自动化）
- ECC 2.0 Alpha（Rust 控制层原型，`ecc2/` 目录）
- 品牌营销与视频创作技能

截至 2026-06-01，尚未发布更新的稳定版本。ECC 2.0 的 Rust 控制平面处于 alpha 阶段。

> 来源：[GitHub Releases](https://github.com/affaan-m/ECC/releases)

### 16.3 数据差异说明

- **Stars 差异**：原文写的是 `190,000+`，而 GitHub API 返回 `200,657`。产生差异的原因是原文为 2026 年 5 月的估算值（README banner 当时标注为 "182K+"），而 README banner 更新滞后于实际星标增长。实际上截至 6 月 1 日已突破 20 万，原文数字偏保守。
- **Forks 差异**：原文 `29,500+` vs 实际 `30,790`，同理为估算偏差。
- **Agent / Skill / Command 数量**：ECC 是一个活跃开发中的项目，原文撰写后已有增量更新（Agent 60→63、Skill 232→249、Commands 75→79）。这些差异属于正常的版本迭代。
- **原文质量评价**：原文的核心架构描述（四层架构、三种上下文模式、安装方式、DeepSeek 兼容性分析）依然准确。本次核实主要补充了 ROSS Index 排名和 AgentShield 详情这两个原文遗漏的重要信息。

### 16.4 核实来源汇总

| 来源 | URL |
|------|-----|
| GitHub API | `https://api.github.com/repos/affaan-m/ECC` |
| 仓库 README | [github.com/affaan-m/ECC](https://github.com/affaan-m/ECC) |
| ROSS Index Q1 2026 | [runacap.com/ross-index/q1-2026/](https://runacap.com/ross-index/q1-2026/) |
| AgentShield 仓库 | [github.com/affaan-m/agentshield](https://github.com/affaan-m/agentshield) |
| GitHub Releases | [github.com/affaan-m/ECC/releases](https://github.com/affaan-m/ECC/releases) |
