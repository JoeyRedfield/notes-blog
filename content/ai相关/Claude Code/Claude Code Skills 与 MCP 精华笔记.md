---
title: "Claude Code Skills 与 MCP 精华笔记"
source: "https://juejin.cn/post/7620060655607857178"
author:
  - "[[蝎子莱莱爱打怪]]"
published: 2026-03-23
created: 2026-05-23
updated: 2026-06-22
description: "32 个 Skills + 8 个 MCP 的精华梳理，含核心概念、分类速查、关键命令和推荐安装顺序。"
tags:
  - "clippings"
  - "claude-code"
  - "skills"
  - "mcp"
source_type: community-snapshot
---

# Claude Code Skills 与 MCP 精华笔记

> 原文：[[别再裸用 Claude Code 了！32 个亲测Skills + 8 个 MCP，开发效率直接拉满！]]

> [!warning]
> 这篇笔记保留了较多**社区生态快照**信息，不应被当成 Claude Code 官方手册直接照抄。
> 我在 `2026-06-22` 做了第一轮修正，重点区分：
> - **Claude Code 官方事实**
> - **第三方技能市场 / 社区安装器 / 生态统计**
>
> 尤其要注意：
> - `npx skills add ...` 不是 Claude Code 官方内置的唯一技能机制
> - Claude Code 官方文档当前强调的是 **bundled skills** 与 filesystem-based **custom skills**
> - MCP 生态数据、下载量、Server 数都属于时间快照

## 先看官方对齐版结论

根据 Claude Code 官方文档，截至 `2026-06-22` 可以先记住三点：

1. **Claude Code 自带 bundled skills。** 官方文档明确列出 `/code-review`、`/batch`、`/debug`、`/loop`、`/claude-api` 等 bundled skills，可在每个 session 里直接使用。
2. **Claude Code 的自定义 skills 是 filesystem-based。** 官方文档当前强调通过 `.claude/skills/` 中的 `SKILL.md` 目录结构来创建和共享 skills。
3. **Claude Code 只支持 Custom Skills。** Anthropic 平台/API 还存在预置 Agent Skills 与 Skills API；但在 Claude Code 里，官方文档当前明确写的是“supports only Custom Skills”。

因此，这页后文更适合被理解为：

> **“2026 年上半年围绕 Claude Code、Skills、MCP 的社区生态与实操入口整理”**，
> 而不是“Claude Code 官方唯一正确的安装与使用方式”。

---

## 一、核心概念：Skills vs MCP

| 维度 | Skills | MCP |
|------|--------|-----|
| 本质 | 封装的提示词 / 标准化工作流 | 本地运行的工具 / API 服务 |
| 一句话 | 让 AI **更聪明**（懂怎么干） | 让 AI **更能干**（真能去干） |
| 常见安装/接入方式 | 社区安装器、项目内 `.claude/skills/`、插件/仓库分发 | 编辑 `~/.claude/mcp.json` / 项目 `.mcp.json` |
| 运行位置 | 大模型内部 | 本地独立进程 |
| 访问外部 | 不支持 | 支持（文件系统、浏览器、API） |
| 额外依赖 | 仅需 Node 环境 | 部分需要 API Key |

**要点**：Skills 和 MCP 是互补关系，搭配使用才能最大化 Claude Code 能力。
但要区分：

- **官方 Claude Code Skills 机制**：bundled skills + `.claude/skills/` 自定义 skills
- **社区技能市场 / 安装器**：例如文中提到的 `npx skills ...` 一类工具链

---

## 二、关键命令

> [!note]
> 下面这组 `npx skills ...` 命令来自社区技能生态，不是 Claude Code 官方文档中的唯一入口。
> 如果你要按 Claude Code 官方机制新增 project skills，更稳定的做法是直接维护：
>
> ```text
> .claude/skills/<skill-name>/SKILL.md
> ```

```bash
# Skills
npx skills find <关键词>          # 搜索技能
npx skills add <owner/repo@名称> -y -g  # 安装技能
npx skills list -g                # 查看已安装
npx skills check                  # 检查更新
npx skills update                 # 更新全部

# 已安装技能路径
ls ~/.claude/skills/
```

```jsonc
// MCP 配置文件位置
// 全局：~/.claude/mcp.json
// 项目级：项目根目录/.mcp.json

{
  "mcpServers": {
    "服务器名称": {
      "command": "执行命令",
      "args": ["参数"],
      "env": { "KEY": "VALUE" }
    }
  }
}
```

---

## 三、32 个 Skills 分类速查

### 必装入口（1）

| 技能 | 用途 | 安装量 |
|------|------|:---:|
| **find-skills** | 技能市场搜索引擎 | 159.6K |

### 前端开发（9）

| 技能 | 用途 | 安装量 |
|------|------|:---:|
| **frontend-design** | 网页/Dashboard/落地页设计 | 52.7K |
| **web-artifacts-builder** | 复杂 SPA 构建 | - |
| **canvas-design** | 架构图/流程图生成 | 6.1K |
| **theme-factory** | 主题美化与视觉统一 | - |
| **vercel-react-best-practices** | React 开发最佳实践（Vercel 官方） | 109.8K |
| **web-design-guidelines** | 网页设计规范（Vercel 官方） | 83.1K |
| **vercel-composition-patterns** | 组件组合模式 | 29.7K |
| **shadcn** | shadcn/ui 专属支持 | - |
| **vercel-react-native-skills** | React Native 开发指导 | 21.6K |

### 文档与办公（6）

| 技能 | 用途 | 安装量 |
|------|------|:---:|
| **technical-writer** | README/API 文档/技术教程 | - |
| **doc-coauthoring** | 技术方案/RFC/设计文档 | - |
| **docx** | Word 创建/编辑/格式转换 | 8.6K |
| **pptx** | PPT 生成与编辑 | 9.2K |
| **pdf** | PDF 合并/拆分/OCR/水印 | 11.1K |
| **xlsx** | Excel 数据处理/图表生成 | 8.6K |

### 架构与代码质量（5）

| 技能 | 用途 |
|------|------|
| **planning-with-files** | 任务拆解 + 进度文件 + **会话恢复** |
| **project-planner** | 需求文档 + 架构设计 + 分阶段计划 |
| **architecture-patterns** | 架构模式推荐 |
| **architecture-decision-records** | ADR 架构决策记录 |
| **requesting-code-review** | 专业代码审查 |

### 记忆管理（3）

| 技能 | 用途 |
|------|------|
| **memory-intake** | 经验/踩坑记录/项目规范存入记忆库 |
| **memory-audit** | 记忆库健康检查，清理过期内容 |
| **memory-evolution** | 记忆库优化，精简冗余，整理关联 |

### 测试（2）

| 技能 | 用途 | 安装量 |
|------|------|:---:|
| **webapp-testing** | Playwright E2E 测试生成 | 7.6K |
| **test-driven-development** | TDD 红绿重构引导 | 6.5K |

### 开发提效（4）

| 技能 | 用途 | 安装量 |
|------|------|:---:|
| **brainstorming** | 技术问题多角度头脑风暴 | 13.4K |
| **systematic-debugging** | 结构化 bug 排查与根因定位 | 7.5K |
| **writing-plans** | 任务拆解 + 实施计划生成 | 6.4K |
| **executing-plans** | 按计划执行 + 进度追踪 | - |

### 其他（2）

| 技能 | 用途 | 安装量 |
|------|------|:---:|
| **audit-website** | 网站安全漏洞扫描 | 15.3K |
| **skill-creator** | 自定义技能创建 | 26.1K |

---

## 四、8 个 MCP 服务器速查

| MCP | 核心功能 | 需 API Key |
|-----|---------|:---:|
| **neural-memory** | 跨会话神经网络记忆系统 | ❌ |
| **playwright** | 浏览器自动化、E2E 测试 | ❌ |
| **filesystem** | 本地文件系统批量读写 | ❌ |
| **sequential-thinking** | 链式推理、复杂问题拆解 | ❌ |
| **web_reader** | 网页抓取 → Markdown | ❌ |
| **figma-developer-mcp** | Figma 设计稿读取 → 代码生成 | ✅ Figma Token |
| **supercharged-figma** | Figma 画布实时编辑 | ❌（需插件） |
| **4_5v_mcp** | AI 图片分析、UI 组件识别 | ⚠️ |

### 关键配置示例

```json
// neural-memory —— 跨会话记忆（最推荐）
{ "neural-memory": { "command": "neural-memory", "args": ["--mcp"] } }

// playwright —— 浏览器自动化
{ "playwright": { "command": "npx", "args": ["-y", "@playwright/mcp@latest"] } }

// filesystem —— 文件系统访问（仅授权工作区！）
{ "filesystem": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-filesystem", "/你的工作区路径"] } }

// sequential-thinking —— 链式推理
{ "sequential-thinking": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"] } }

// web_reader —— 网页抓取
{ "web_reader": { "command": "npx", "args": ["-y", "web-reader-mcp"] } }
```

---

## 五、踩坑避雷

1. **技能必须 `-g` 全局安装**，否则 Claude Code 不识别
2. **安装/配置后必须重启 Claude Code**，完全退出再打开
3. **不要一次装超过 20 个技能**，会增加上下文负担，拖慢响应
4. **MCP 配置前校验 JSON 格式**，逗号/括号不闭合直接失效
5. **filesystem MCP 严禁开放根目录**，只授权工作区路径
6. **API Key 不要提交到 Git**，仅保留在本地配置文件
7. **更新技能前先关闭 Claude Code**，避免文件占用

---

## 六、推荐安装顺序

### 第一步：安装入口技能

```bash
npx skills add find-skills -y -g
```

装上"应用商店"，后续搜技能不用去网页翻。

### 第二步：安装新手核心包（8 个）

```bash
# 前端设计
npx skills add frontend-design -y -g

# 文档处理
npx skills add technical-writer -y -g
npx skills add pdf -y -g

# 代码审查
npx skills add obra/superpowers@requesting-code-review -y -g

# 开发提效
npx skills add obra/superpowers@brainstorming -y -g
npx skills add obra/superpowers@systematic-debugging -y -g

# 任务规划（可会话恢复，很重要）
npx skills add planning-with-files -y -g
```

### 第三步：配置 MCP 核心（2 个）

编辑 `~/.claude/mcp.json`：

```json
{
  "mcpServers": {
    "neural-memory": {
      "command": "neural-memory",
      "args": ["--mcp"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

> `neural-memory` 需先 `pip install neural-memory`。

### 第四步：按场景补充

- **前端为主** → 加装 `web-artifacts-builder`、`canvas-design`、`vercel-react-best-practices`、`theme-factory`
- **文档为主** → 加装 `docx`、`pptx`、`xlsx`、`doc-coauthoring`
- **后端/架构** → 加装 `architecture-patterns`、`architecture-decision-records`、`project-planner`
- **测试需求** → 加装 `webapp-testing`、`test-driven-development`，MCP 加装 `playwright`
- **设计联动** → MCP 加装 `figma-developer-mcp` 或 `supercharged-figma`

### 第五步：进阶

- 用 **memory-intake / memory-audit / memory-evolution** 建立长期记忆体系
- 用 **skill-creator** 封装自己的专属工作流
- 用 **writing-plans + executing-plans** 实现复杂项目的全流程管控

---

## 2026 年上半年重大进展

> [!warning]
> 本节的数据和时间线都是**时点快照**。
> 例如 MCP 月下载量、活跃 Server 数、AAIF 成员数、企业使用率，都应在复用前重新核对来源。

> 本章节基于 2026 年 6 月最新数据整理，反映 Skills 和 MCP 生态在过去半年的关键变化。

### 一、MCP 捐赠给 Linux Foundation：从业界标准到中立基础设施

**时间线**：

| 时间 | 事件 |
|------|------|
| 2024.11 | Anthropic 开源 MCP（MIT 许可证） |
| 2025.04 | OpenAI 全产品线接入 MCP |
| 2025.07 | Microsoft Copilot Studio 集成 MCP |
| **2025.12** | **Anthropic 将 MCP 捐赠给 Linux Foundation 下属的 Agentic AI Foundation（AAIF）** |

**AAIF 创始成员**：Anthropic、Block、OpenAI 三方联合发起，铂金级支持者包括 Google、Microsoft、AWS、Cloudflare、Bloomberg。

**战略意义**：
- 消除供应商锁定顾虑——MCP 在 Linux Foundation 中立治理下，竞争对手也能放心贡献
- 触发网络效应——OpenAI、Google、Microsoft 全部接入后，任何 MCP Server 对所有平台自动可用
- 遵循 Kubernetes、Node.js、PyTorch 同等的中立治理模式

> 来源：[ITPro 报道](https://www.itpro.com/software/open-source/anthropic-says-mcp-will-stay-open-neutral-and-community-driven-after-donating-project-to-linux-foundation)、[CIO Dive 分析](https://www.ciodive.com/news/big-tech-develop-open-standards-agentic-ai/807608/)、[IT Brief](https://itbrief.co.nz/story/anthropic-donates-mcp-to-new-agentic-ai-foundation)

### 二、MCP 生态增长数据（截至 2026 年 5 月）

| 指标 | 数据 | 来源 |
|------|------|------|
| 月 SDK 下载量（Python + TypeScript） | ~9700 万 | [dev.to](https://dev.to/raxxostudios/mcp-hit-97-million-downloads-the-protocol-war-is-over-before-it-started-3ekh) |
| 活跃公共 MCP Server | 10,000 ~ 13,000+ | [dev.to](https://dev.to/grahamduescn/mcp-in-2026-the-numbers-behind-the-ecosystem-explosion-3j72) |
| 注册工具总数 | 177,000+ | 同上 |
| AAIF 成员组织 | ~150 家 | 同上 |
| Smithery 注册表 Server 数 | 7,000+ | 同上 |
| 企业 AI 团队（50+ 人）使用 MCP 生产 | 78%（Q1 2026） | [AgentModeAI](https://agentmodeai.com/mcp-enterprise-agent-tooling/) |
| CTO 将 MCP 设为默认集成标准 | 67% | 同上 |

**增长轨迹**：从 2024.11 月均 10 万下载 → 2025.03 OpenAI 接入后 2200 万 → 2025.12 捐赠时已是大规模生态 → 2026.03 达到 9700 万/月。

> 来源：[MCP in 2026: The numbers behind the ecosystem explosion](https://dev.to/grahamduescn/mcp-in-2026-the-numbers-behind-the-ecosystem-explosion-3j72)、[MCP Hit 97 Million Downloads](https://dev.to/raxxostudios/mcp-hit-97-million-downloads-the-protocol-war-is-over-before-it-started-3ekh)

### 三、Agent Skills 开放标准：从 Claude Code 专属到行业通用

**2025 年 12 月 18 日**，Anthropic 将 Agent Skills 正式作为开放标准发布，上线规范站点 [agentskills.io](https://agentskills.io)，提供开源 SDK 和正式规范文档。

**Skills 与 MCP 的分工**：
- **MCP**（连接层）：定义"模型能访问什么"——工具、API、数据源
- **Skills**（能力层）：定义"模型该怎么做"——可复用的领域知识、标准操作流程

**48 小时内采纳 Skills 标准的公司/工具**：

| 公司/工具 | 采纳方式 |
|-----------|---------|
| **Microsoft** | VS Code 和 GitHub Copilot 直接集成 |
| **OpenAI** | ChatGPT 和 Codex CLI 采用几乎相同架构 |
| **Cursor** | 原生支持 |
| **Goose** | 原生支持 |
| **Amp** | 原生支持 |
| **OpenCode** | 原生支持 |
| **Atlassian、Figma、Canva、Stripe、Notion、Zapier、Box、Browserbase** | 首批企业级 Skills 合作伙伴 |

> 来源：[VentureBeat 报道](https://venturebeat.com/ai/anthropic-launches-enterprise-agent-skills-and-opens-the-standard)、[Unite.AI 分析](https://www.unite.ai/anthropic-opens-agent-skills-standard-continuing-its-pattern-of-building-industry-infrastructure/)、[byteiota](https://byteiota.com/agent-skills-standard-microsoft-openai-adopt-in-48-hours/)

**Gartner 预测**：到 2026 年，75% 的 AI 项目将聚焦于可组合的 Skills 而非单体 Agent。

### 四、Claude Code 的四大/五大扩展体系

Claude Code 目前支持完整的扩展生态，可分为五个层次：

| 层次 | 扩展类型 | 配置文件 | 核心作用 |
|------|----------|----------|----------|
| 基础层 | **CLAUDE.md** | 项目根目录 | 始终加载的项目约定和背景知识 |
| 连接层 | **MCP Server** | `.mcp.json` 或 `~/.claude.json` | 连接外部工具/API，为 Claude 增加可调用的工具 |
| 能力层 | **Skill** | `.claude/skills/` 或 `~/.claude/skills/` | 按需加载的专家指令和斜杠命令 |
| 隔离层 | **Custom Agent** | `.claude/agents/` 或 `~/.claude/agents/` | 独立上下文窗口运行专用任务，可限制工具/模型 |
| 自动化层 | **Hook** | `.claude/settings.json` | 生命周期事件自动执行 Shell 命令（保证执行） |
| 分发层 | **Plugin** | `.claude-plugin/plugin.json` | 打包以上所有组件，用于团队共享和分发 |

**关键区别**：

- **MCP**：消耗大量上下文（5 个 Server、58 个工具可能占用 55,000+ token），Anthropic 的 Tool Search 功能可减少约 85% 开销
- **Skill**：启动时仅占 30-50 token/Skill（渐进式披露），安装 100+ Skill 几乎不增加上下文负担
- **Custom Agent**：在独立上下文窗口运行，输出量大、需限制工具权限、任务自包含时最佳；也可选更便宜的模型（如 Haiku）降低成本
- **Hook**：**保证执行**——PreToolUse 可拦截危险命令（`exit 2`），PostToolUse 可自动格式化代码，Stop 事件可发送通知
- **CLAUDE.md vs Skill**：CLAUDE.md 始终加载（适合项目约定），Skill 按需加载（适合特定工作流）

> 来源：[Morph Blog](https://www.morphllm.com/claude-code-extensions)、[DeepWiki](https://deepwiki.com/anthropics/claude-code/3.6-plugin-system)

### 五、渐进式披露（Progressive Disclosure）：三级 token 效率机制

Agent Skills 的核心创新在于**三级渐进披露机制**，解决了上下文窗口的瓶颈问题：

| 层级 | 加载时机 | 加载内容 | Token 消耗 |
|------|----------|----------|:---:|
| **一级（元数据）** | Agent 启动时 | SKILL.md 的 YAML frontmatter（`name` + `description`） | 约 50-100 token/Skill |
| **二级（指令）** | 任务匹配到 Skill 时 | SKILL.md 正文（流程、检查清单、工作流步骤） | 约 500-5000 token |
| **三级（资源）** | 执行中按需读取 | `references/`、`scripts/`、`assets/` 中的文件 | 变量（可能很大） |

**效率数据**（基于 SkillReducer 论文和社区实测）：

| 指标 | 数据 |
|------|------|
| 平均 token 消耗降低 | 48%-65% |
| 上下文窗口有效利用率 | 从 ~40% 提升至 85%+ |
| 有效 token 比例 | 从 35% 提升至 78% |
| 单会话可支持的 Skill 数 | 从 ~20 个提升至 200+ 个 |
| 内存占用减少 | 62% |
| 响应延迟降低 | 41% |

**核心设计原则**：
1. **描述中编码触发条件**——一级元数据的 `description` 字段必须说清"何时使用"，而非仅说"做什么"
2. **SKILL.md 保持精简**——只保留核心流程，分类法、长示例、模板放入 `references/`
3. **链接代替内联**——用 Markdown 链接引用资源文件，Agent 按需读取
4. **独立的上下文环境**——每个 Skill 有独立上下文，防止跨 Skill 污染

> 来源：[SkillReducer 论文 (arXiv:2603.29919)](https://arxiv.org/html/2603.29919v1)、[Skywork 分析](https://skywork.ai/blog/claude-skills-progressive-disclosure-ultimate-guide-2/)

### 六、OpenClaw 社区生态：Skills 民主化的另一极

与 Anthropic 主导的 Agent Skills 标准并行，社区驱动的 **OpenClaw**（原名 Clawdbot/MoltBot）在 2026 年形成了另一极庞大的 Skills 生态：

| 指标 | 数据（截至 2026 年 3 月） |
|------|------|
| ClawHub 公共注册表 Skill 总数 | 18,140+ |
| GitHub Stars | 250,829+ |
| Fork 数 | 49,900+ |
| 日均新增 Skill | 40-60 个 |
| 用户规模 | 220 万+ |
| 精选库过滤后保留 | 5,490+ 高质量 Skill |

**注册表架构**：
- **ClawHub**：官方公共技能市场，基于 Convex + React + 向量搜索，支持自然语言发现技能
- **awesome-openclaw-skills**：社区维护的 GitHub 精选库，过滤掉垃圾/加密货币/重复/恶意技能

**技能分类覆盖（前 10）**：

| 分类 | Skill 数 |
|------|:---:|
| AI & LLMs | 287 |
| 搜索与研究 | 253 |
| DevOps & 云 | 212 |
| Web 前端 | 202 |
| 营销与销售 | 143 |
| 浏览器自动化 | 139 |
| 生产力与任务 | 135 |
| 编码智能体 | 133 |
| 通讯 | 132 |
| CLI 工具 | 129 |

**安全挑战**：约 11%-20% 的注册表 Skill 包含恶意代码（ClawHavoc 攻击事件），衍生出 NanoClaw（Docker 隔离执行）和 OpenClaw Security Auditor（OSA）等安全工具，ClawHub 已接入 VirusTotal 扫描。

> 来源：[阿里云开发者](https://developer.aliyun.com/article/1713117)、[Skywork](https://skywork.ai/skypage/en/clawhub-openclaw-skill-registry/2038573559848898560)

### 七、Skills as Natural Language Programming：自然语言编程新范式

2026 年，Skills 的兴起催生了"**自然语言编程**"（Natural Language Programming）这一新范式：

**核心论点**：
- **Skills = 新的编程语言**：Skills 定义了"语法"，Agent 作为"执行器/编译器"
- **从写 Prompt 到写 Skill**：将一次性提示词工程化为可复用、可组合、可版本化的 Skill 模块
- **自进化系统**：Agent 执行完任务后评估自身表现，自动更新 SKILL.md——在计算历史上首次实现无需人类干预的自我改进

**学术研究支撑**：

- 2026 年 5 月《A Comprehensive Survey on Agent Skills》(arXiv) 提出四阶段生命周期：表示→获取→检索→进化
- 2026 年 4 月《Scaling Coding Agents via Atomic Skills》(arXiv) 将软件工程抽象为五种原子 Skill（代码定位、编辑、单测生成、问题复现、代码审查），联合强化学习训练后平均提升 18.7%

**行业影响**：

| 指标 | 数据 |
|------|------|
| 传统算法工程师需求下降 | 37% |
| Agent/AI 工程师职位增长 | 215% |
| Gartner 预测 2027 年非专业人员完成开发 | 75% |
| 新兴角色 | Prompt 逻辑架构师、Agent UX 设计师、AI 伦理合规官 |

**未解决的核心挑战**：
- 跨会话记忆：多 Agent 并发会话无法轻松共享记忆
- 多项目协调：Agent 难以理解跨项目依赖
- Skill 供应链安全："Skill 注入攻击"和兼容性标准仍需行业方案
- 长周期状态管理：多轮长任务工作流仍存在连续性问题

> 来源：[Tencent Cloud 开发者](https://cloud.tencent.com.cn/developer/article/2624428)、[Baidu 开发者](https://developer.baidu.com/article/detail.html?id=7300002)、[arXiv:2605.07358](https://arxiv.org/abs/2605.07358v1)、[arXiv:2604.05013](https://arxiv.org/html/2604.05013v1)

### 八、Skill 触发匹配机制：语义匹配与冲突解决

#### 基本原理

Skill 的触发**不是关键词匹配，而是语义匹配**。Claude Code 会将用户消息与所有已安装 Skill 的 `description` 字段做语义相似度计算，取**最高分**的 Skill 触发。

这意味着：
- **中英文都行**：中文消息同样能触发 Skill（如 `obsidian-vault` 的 description 写的是 "User wants to find, create, or organize notes in Obsidian"，中文"帮我找一篇笔记"一样能匹配）
- **意图比措辞重要**：不需要记住精确的触发词，只要意图对就能匹配

#### 多 Skill 冲突问题

当安装了较多 Skill 且语义域重叠时，可能出现匹配偏差。常见的容易冲突组合：

| 用户说的话 | 可能匹配 | 哪个更合适？ |
|-----------|---------|-------------|
| "帮我改一下这篇文章" | `khazix-writer`（写作）vs `edit-article`（编辑） | 看意图是续写还是润色 |
| "帮我规划一下这个功能" | `brainstorming` vs `writing-plans` | 前者偏创意发散，后者偏实施计划 |
| "创建一个 Obsidian 笔记" | `obsidian-vault` vs `obsidian-markdown` | vault 管查找/创建，markdown 管语法格式 |

#### 解决方式

1. **显式指定**：用 `/skill-name` 直接调用目标 Skill，跳过语义匹配。如 `/edit-article` 或直接说"用 edit-article 的 skill 帮我改"
2. **精简安装**：不建议把语义域高度重叠的 Skill 都装上，用哪个装哪个，减少干扰
3. **检查 description**：安装前看 Skill 的 description 字段是否与已有 Skill 有明确边界

#### 与渐进式披露的关系

这里的匹配机制是第五节渐进式披露的**前序步骤**：先做语义匹配确定哪个 Skill 命中 → 然后才是渐进式披露的三级加载（元数据 → 正文 → 资源文件）。匹配发生在"一级加载"之前，决定了哪个 Skill 的正文会被展开。
