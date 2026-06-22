---
tags:
  - ai-coding
  - codex
  - skills-ecosystem
  - agent-workflow
  - note
created: 2026-06-22
updated: 2026-06-22
source_type: experimental-observation
---

# Codex Superpowers 插件与 brainstorming skill 的关系

> 这篇笔记回答一个很容易混淆的问题：**Codex 的 `superpowers` 插件** 和 **其中的 `brainstorming` skill** 到底是什么关系，以及为什么它们可以共存。

## 结论先行

- `superpowers` 是**插件 / 技能包**。
- `brainstorming` 是 `superpowers` 插件里的**一个具体 skill**。
- 在这台机器上，除了插件缓存目录中的那一份 skill 之外，`~/.cc-switch/skills/` 下还有一套**同内容的本地副本**。
- 当前这次 Codex 会话里，模型实际看到的 skill 列表，主要来自这套 **`.cc-switch/skills/` 本地 skills**。
- 所以真实关系不是“`superpowers` 和 `brainstorming` 哪个覆盖哪个”，而是：
  `superpowers 插件` → `其中包含 brainstorming skill` → `本地副本被暴露给当前会话` → `运行时按触发规则选中它`

## 图示

完整版：

![[diagram/codex-superpowers-relationship/codex-superpowers-relationship.svg]]

极简版：

![[diagram/codex-superpowers-relationship/codex-superpowers-relationship-minimal.svg]]

如果某些环境对 SVG 预览不稳定，也可以直接查看 PNG 预览：

- [完整版 PNG](/Users/wuzhuoyi/Documents/notes/diagram/codex-superpowers-relationship/codex-superpowers-relationship-ql.png)
- [极简版 PNG](/Users/wuzhuoyi/Documents/notes/diagram/codex-superpowers-relationship/codex-superpowers-relationship-minimal-ql.png)

## 分层理解

### 1. 插件层

`superpowers` 在 Codex 里首先是一个插件包，缓存路径类似：

`~/.codex/plugins/cache/openai-curated/superpowers/...`

这个插件包内部包含多个 skill，例如：

- `using-superpowers`
- `brainstorming`
- `writing-plans`
- `systematic-debugging`
- `test-driven-development`

所以从概念上讲，`brainstorming` 不是和 `superpowers` 平级的另一个系统，而是 **`superpowers` 的组成部分**。

### 2. 本地副本层

在这台机器上，还存在一套本地 skills：

`~/.cc-switch/skills/`

其中也有：

- `~/.cc-switch/skills/using-superpowers/SKILL.md`
- `~/.cc-switch/skills/brainstorming/SKILL.md`

对照检查时，这两份内容和插件缓存中的对应 `SKILL.md` 当前是一致的，可以把它理解为**本地镜像 / 同步副本**。

### 3. 会话暴露层

Codex 真正执行时，不是“插件目录里有什么就直接全用什么”，而是由宿主把某一套 skills **暴露到当前会话的 Skills 列表**中。

这一步决定：

- 当前模型能看到哪些 skill
- 模型此刻能调用哪些 skill

就这次会话而言，真正暴露给模型的，是 `.cc-switch/skills` 这一套，而不是直接从插件缓存路径里读出来的那一套。

## 运行时关系

运行时常见链路是：

1. 用户提出任务
2. 命中 `using-superpowers`
3. `using-superpowers` 要求先检查还有哪些 skill 适用
4. 如果任务属于设计、创作、功能改动，就继续触发 `brainstorming`

也就是说：

- `using-superpowers` 更像**总控入口规则**
- `brainstorming` 更像**其中一个被优先触发的流程 skill**

所以它们不是冲突关系，而是**前后衔接关系**。

## 这次对话里最重要的三个知识点

### 知识点 1：插件和 skill 不是一个层级

问“`superpowers` 和 `brainstorming` 能不能共存”，如果不先区分层级，很容易越说越乱。

更准确的问法应该是：

- `brainstorming` 是否属于 `superpowers` 插件？
- 当前会话实际暴露的是插件内 skill，还是本地 skill 副本？

### 知识点 2：当前会话看到的，不一定是插件缓存里那份

这次本地检查最大的收获不是“插件里有 `brainstorming`”，而是：

> **当前会话真正使用的 skill 列表，主要来自 `.cc-switch/skills/`。**

这解释了为什么有时候你看“插件目录”和“会话里的 skill 列表”会感觉像两套东西。

### 知识点 3：要区分“装配关系图”和“执行流程图”

这次前后画了两种不同的图：

- **装配关系图**：说明插件、skill、本地副本、会话暴露之间的关系
- **执行流程图**：说明用户任务如何命中 `using-superpowers`，再进一步触发 `brainstorming`

如果问题本身是“它们是什么关系”，优先应该画**装配关系图**，而不是流程图。

## 我的当前理解

用一句最压缩的话总结：

> `superpowers` 是插件包，`brainstorming` 是其中一个 skill；在这台机器上又存在一份本地同内容副本，而当前会话实际主要暴露的是这套本地 skills。

## 相关笔记

- [[Agent与自动化/Agentic Engineering 实战技巧集（2026年6月）]]
- [[Agent与自动化/Loop Engineering]]
- [[Claude Code/Claude Code Skills 与 MCP 精华笔记]]
