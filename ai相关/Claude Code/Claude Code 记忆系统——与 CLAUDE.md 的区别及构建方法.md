---
tags: [claude-code]
created: 2026-06-03
updated: 2026-06-22
source_type: official-mechanism
---

# Claude Code 记忆系统——与 CLAUDE.md 的区别及构建方法

> [!note]
> 这页已在 `2026-06-22` 对齐 Claude Code 官方 memory 文档。
> 当前官方术语更准确的说法是：
> - `CLAUDE.md files`
> - `auto memory`
>
> 两者都是“跨会话知识层”，但职责完全不同。

## 什么是记忆系统

Claude Code 当前有两套互补的跨会话知识机制：

1. **`CLAUDE.md` 文件**：你写给 Claude 的持久说明
2. **auto memory**：Claude 根据你的纠正、偏好和项目经验自动积累的记忆

官方文档明确说明：**两者都会在每次对话开始时加载**，但都只是 context，不是强制执行配置。

### 三部分构成

| 部分 | 位置 | 说明 |
|------|------|------|
| auto memory 目录 | `~/.claude/projects/<project>/memory/` | 每个仓库一套，worktree 共享，机器本地 |
| 索引入口 | 同目录 `MEMORY.md` | auto memory 的入口页，启动时只加载前 200 行或 25KB |
| 主题文件 | `debugging.md`、`patterns.md` 等 | 详细记忆按主题拆分，启动时不全量加载，按需读取 |
| 全局记忆 | `~/.claude/CLAUDE.md` | 跨所有项目生效的个人全局配置 |

## 与 CLAUDE.md 的区别

| 维度 | auto memory | CLAUDE.md |
|------|----------|-----------|
| **位置** | `~/.claude/projects/.../memory/`，本机私有 | 用户级 `~/.claude/CLAUDE.md` 或项目级 `./CLAUDE.md` / `./.claude/CLAUDE.md` |
| **谁写** | Claude 自动写，也可手工改 | 你手工写 |
| **内容** | Learnings and patterns：偏好、调试经验、构建命令、Claude 自己发现的习惯 | Instructions and rules：规范、流程、架构约定、红线 |
| **作用域** | 每个仓库一套，worktree 共享 | 可按用户级、项目级、组织级分层 |
| **共享性** | 机器本地，不随 git 自动共享 | 项目级可随 git 共享；用户级只属于自己 |

### 判例

同样是"用户是 Java 后端 + AI 应用开发者"：
- **放记忆（user 类型）**：正确。私密、跨会话生效，下次优先用 Java 类比而非 C++。
- **放 CLAUDE.md**：错误。个人信息不应进 git 公开仓库。

同样是"删除文件前必须先列出清单"：
- **放 CLAUDE.md**：正确。这是项目安全规则，任何 AI 都应该遵守。
- **放记忆**：意义不大，这不是个人偏好。

## 四种记忆类型

> [!note]
> 下面这四类是这篇笔记为了便于理解而做的**实用分类**，不是 Claude Code 官方文档里的固定 schema。

| 类型 | 用途 | 示例 |
|------|------|------|
| **user** | 角色、偏好、技术背景、沟通风格 | "Java 后端 + AI 应用开发，偏好用 Java 类比新概念" |
| **feedback** | 用户纠正过的做法、验证有效的模式 | "简洁回复、不用 emoji、不要结尾总结" |
| **project** | 项目背景、进行中的工作、截止日期 | "merge freeze 从 2026-03-05 开始" |
| **reference** | 外部系统的指针 | "bug 追踪在 Linear 项目 INGEST" |

## 不该存入记忆的内容

- 代码模式、文件路径、项目结构 → 读代码即可推导
- git 历史、bug 修复方案 → git log / commit message 是权威来源
- 临时任务状态 → 仅当前会话有效
- 已在 CLAUDE.md 中的信息 → 不重复

## 构建策略

**三步走**，不需要一次性建完：

1. **初始种子**：已明确且不太会变的基础事实先记（技术背景、沟通偏好、当前工作重点），3-4 条即可
2. **日常积累**：每次对话中碰到就顺手记——纠正做法时记 feedback、提到新工作重点时记 project、提及外部工具时记 reference
3. **定期清理**：每次跑 `/neat-freak` 顺带审查——过期事实改掉、重复的合并、没复用价值的删掉

关键原则：**不用刻意回顾，碰到了就记。**记忆系统价值在于日积月累，不是一次性大扫除。

## 当前官方补充要点

- auto memory 默认开启，需要 Claude Code `v2.1.59+`
- 可以通过 `/memory` 开关 auto memory，也可以用 `autoMemoryEnabled` 配置项关闭
- 也可以用环境变量 `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` 关闭
- 官方建议 `CLAUDE.md` 目标控制在 **200 行以内**，因为过长会降低遵循度

如果你要排查“Claude 没按规则来”，官方建议先做三件事：

1. 用 `/memory` 确认相关 `CLAUDE.md` / auto memory 是否真的加载
2. 检查是否有冲突规则
3. 把模糊表述改成更具体、可执行的规则
