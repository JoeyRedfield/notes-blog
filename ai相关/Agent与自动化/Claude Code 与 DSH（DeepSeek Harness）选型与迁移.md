---
tags: [note]
created: 2026-11-02
updated: 2026-11-02
---

# Claude Code 与 DSH（DeepSeek Harness）选型与迁移

> [!note]
> 版本与结论时点：2026-11-02。DSH 官方包仍在 RC/alpha，后续接口和插件规范可能变化；换之前先复核 npm 版本。

## 结论

- 不建议现在把主力从 Claude Code 切到 DSH，值得并行试用一周再判断。
- 你现在是「Claude Code 外壳 + DeepSeek 模型」：Claude Code 通过 Anthropic 兼容接口调 DeepSeek。换 DSH + DeepSeek 换的是外壳，模型没变。
- 只有遇到兼容层的具体痛点才值得换：工具调用不稳、KV cache 命中差、长上下文表现低于预期、成本不透明。仅因「官方原生」不构成理由。

## 两者是什么

| | Claude Code | DSH（DeepSeek Harness） |
|---|---|---|
| 定位 | Anthropic 的 agent harness | DeepSeek 官方 harness |
| 接入 DeepSeek | Anthropic 兼容接口 / 中转 | 原生 `@deepseek-ai/dsh-llm-deepseek` |
| 扩展方式 | settings.json、hooks、skills、plugins、MCP | Cordis 插件、profile、`cordis.patch.yml`、pnpm 插件 |
| 项目指令 | CLAUDE.md | 原生注入 AGENTS.md；CLAUDE.md 靠插件 |
| 会话存储 | `.jsonl` transcript | event-sourced session（`@deepseek-ai/dsh-session`） |
| 成熟度（2026-11-02） | 稳定 | `@deepseek-ai/dsh` 0.2.1-rc.5 / 0.2.2-alpha.2，RC 阶段 |

DSH 的启动方式：`dsh web` 起 Web host（默认 `127.0.0.1:3080`），终端用社区 TUI；`dsh` 的 profile 还包括 `headless`、`sdk`、`acp` 等。

## 换与不换的判断

值得试的信号：

- DeepSeek 在 Claude Code 兼容层下工具调用经常漏调用、参数错、长任务跑偏。
- 长上下文和缓存表现明显低于 DeepSeek 官方口径。
- 你需要按 DeepSeek 原生协议控制计费、缓存和上下文窗口。

不构成理由：

- 「官方出品」「原生」本身。
- 想换模型。DSH 也接 DeepSeek，模型不变。
- 想把 Claude Code 的会话历史带过去。带不过去，见下表。

## 资产迁移清单

| 资产 | 能否迁 | 说明 |
|---|---|---|
| 项目 `CLAUDE.md` | 内容能，文件名要改 | DSH 原生只注入 `AGENTS.md`；复制成 AGENTS.md 最省事。或用社区插件 `dsh-context-imports` 读 CLAUDE.md 并展开 `@import` |
| `~/.claude/.../memory/*.md` | 文件能拷，机制不能 | DSH 没有内建自动记忆。社区插件有 `dsh-persona-memory`（MEMORY.md/USER.md）、`dsh-mnemon`、`@jipika/dsh-memory`、`dsh-context-memory` 等，目录和格式各不相同；MEMORY.md 索引要按插件格式重写，写入/召回行为也要重调 |
| Skills | 大体能，需适配 | DSH 有 `dsh-skill` 注册表 + `dsh-skill-filesystem` 本地 provider；SKILL.md 类 skill 有社区「跨 agent 导入」工具，但不保证直接可用。ponytail 这类带 statusline/hook 的插件不行 |
| MCP | 能接 | 社区 `dsh-mcp-bridge` 可接 MCP server，codegraph 可以走这条路；但 Claude Code 的 UserPromptSubmit hook（`codegraph prompt-hook`）不迁，DSH 是 Cordis 事件，要重写或退回命令行 `codegraph explore` |
| 会话历史 | 不能 | `.jsonl` transcript 与 DSH 的 event-sourced session 不互通；上下文只能靠 AGENTS.md + `docs/` + memory 重建 |
| 权限白名单、statusline、插件市场 | 不能 | DSH 用 profile + `cordis.patch.yml` + pnpm 插件，全部重配 |

一句话：知识资产（CLAUDE.md、`docs/`、memory 正文）是可移植的纯文本；迁移丢的是 Claude Code 生态的胶水。

## 如果决定试：迁移路径

1. 并行安装，不动 `~/.claude`。DSH 配置在 `~/.dsh`，与 Claude Code 互不干扰，可以长期共存。
2. 复制项目 `CLAUDE.md` → `AGENTS.md`；需要 `@import` 展开时再装 `dsh-context-imports`。
3. 先接基础能力：shell、codegraph MCP。
4. memory 最后迁：选一个记忆插件，把 `MEMORY.md` 索引和 `memory/*.md` 按插件格式重写。
5. 用同一个真实长任务做 A/B，至少一周；切换前不要删 `~/.claude`。

## 风险

- DSH 仍在 RC 阶段，官方包和社区插件接口会变。
- npm 上大量个人发布的 memory 插件权限很大（能读源码、跑 shell）。项目里有内部 git 地址、数据库/OSS 口令，只装官方 `@deepseek-ai/*` 或审计过源码的插件。
- DSH 工作区规则要求从项目子目录启动，不能在用户根目录（如 `C:\Users\<user>`）启动，否则临时目录落在工作区内会被拒绝。
- 你是通过中转还是 DeepSeek 官方 key 接入，直接影响原生 DSH 的收益和成本，迁移前先核对。

## 来源与时效

- `@deepseek-ai/dsh` npm 包与 README（CLI、profile、`dsh web`）：https://www.npmjs.com/package/@deepseek-ai/dsh
- `dsh-tui` README（host 默认 `127.0.0.1:3080`、工作区建议）：https://github.com/MashedPotato817/dsh-tui
- `dsh-context-imports` README（AGENTS.md/CLAUDE.md、`@import`）：https://www.npmjs.com/package/dsh-context-imports
- `@deepseek-ai/dsh-session`、`@deepseek-ai/dsh-skill`、`@deepseek-ai/dsh-skill-filesystem` npm 包说明
- 版本数据来自 2026-11-02 的 npm registry 查询，之后需复核。

## 相关笔记

- [[AI Harness（驾驭层）知识手册]]
- [[Claude Code 接入 DeepSeek 完整配置]]
- [[Claude Code 记忆系统——与 CLAUDE.md 的区别及构建方法]]
- [[AI Agent 自动化任务方案对比]]
- [[Lost in the Middle 触发条件与上下文管理]]
