---
title: "Claude Code CLI 新会话检查清单"
created: 2026-05-26
updated: 2026-06-22
tags:
  - "claude-code"
  - "mcp"
  - "hooks"
  - "checklist"
source_type: experimental-observation
---

# Claude Code CLI 新会话检查清单

> 适用场景：已经给 Claude Code CLI 接好了 `MemPalace MCP` 和 `MemPalace hooks`，现在想确认新开的会话是否真的生效。

> [!warning]
> 这页不是“Claude Code 通用官方排查流程”，而是你当前机器上的**本机环境检查单**。
> 它依赖：
>
> - `MemPalace MCP`
> - 你本地的 hooks 路径
> - `~/.mempalace/` 下的日志目录
>
> 所以它的正确定位是：
>
> - 对你自己的机器：可直接执行
> - 对别人或未来新环境：只能当排查思路模板，不能逐字照抄路径

## 本页定位

这页回答的不是“Claude Code 的 MCP / hooks 一般怎么排查”，而是：

> **在你这台机器上，怎么最快确认 MemPalace 这套接入是否在新会话里真的活着。**

## 一、先确认这是新会话

MemPalace hooks 改完以后，**要新开一个 Claude Code CLI 会话** 才会生效。

最简单做法：

1. 结束当前 `claude` 会话
2. 在目标项目目录重新打开 `claude`

## 二、先查 MCP 是否连上

在终端执行：

```bash
claude mcp list
```

你希望看到类似结果：

```text
mempalace: mempalace-mcp  - ✓ Connected
```

如果没有看到：

- 说明 MCP 没接上
- 先不要测 hooks，先回头查 MCP 配置

## 三、在会话里确认 Claude 能用 MemPalace

进 Claude 会话后，可以直接给一个很小的测试指令：

```text
先用 MemPalace 搜索我关于 AI Harness 的笔记，再告诉我找到了什么。
```

如果它能正常使用 `mempalace_search` 或明确提到从 MemPalace 找到了结果，说明：

- MCP 工作正常

## 四、确认 hooks 配置文件还在

> 这里检查的是你当前使用的本机配置文件，不代表所有 Claude Code 用户都应该用 `settings.local.json`。

终端检查：

```bash
sed -n '1,220p' ~/.claude/settings.local.json
```

你希望看到里面有：

- `Stop`
- `PreCompact`

并且命令路径类似：

```text
/Users/wuzhuoyi/.claude-plugin/mempalace-hooks/hooks/mempal-stop-hook.sh
/Users/wuzhuoyi/.claude-plugin/mempalace-hooks/hooks/mempal-precompact-hook.sh
```

## 五、确认 hook 脚本权限正常

执行：

```bash
ls -l ~/.claude-plugin/mempalace-hooks/hooks/
```

你希望看到：

- `mempal-stop-hook.sh`
- `mempal-precompact-hook.sh`
- 两个脚本都带可执行权限，比如 `-rwxr-xr-x`

## 六、最实用的 hooks 生效检查

> 这里看的 `~/.mempalace/hook_state/hook.log` 也是你这套环境的私有路径。

真正想看 hooks 有没有生效，最直接的是看日志：

```bash
cat ~/.mempalace/hook_state/hook.log
```

如果 hooks 正常跑过，通常会看到类似内容：

```text
[时间] Session ...
[时间] TRIGGERING SAVE ...
[时间] PRE-COMPACT triggered ...
```

如果这个文件还没有内容，不一定说明坏了，也可能只是：

- 你还没触发到保存阈值
- 新会话还没发生 PreCompact

## 七、如果你只想做最小验证

我建议最少做这 3 步：

1. `claude mcp list`
2. 新开 Claude 会话，要求它先用 MemPalace 搜一次
3. `cat ~/.mempalace/hook_state/hook.log`

这三步通过，基本就够了。

## 八、出现问题时先看什么

### 情况 1：`claude mcp list` 没看到 `mempalace`

先查：

- `~/.claude.json`
- MCP 是否被项目级配置覆盖

### 情况 2：Claude 会话里用不了 MemPalace

先查：

- `claude mcp list` 是否显示 `✓ Connected`
- 当前是不是在正确项目目录里

### 情况 3：MCP 正常，但 hooks 没反应

先查：

1. 你是不是新开的会话
2. `~/.claude/settings.local.json` 里 hooks 还在不在
3. `~/.mempalace/hook_state/hook.log`

## 九、一句话版本

> 新开 Claude 会话后，先看 `claude mcp list`，再让它实际用一次 MemPalace，最后查 `~/.mempalace/hook_state/hook.log`。

## 如果以后要泛化成通用版

这页要想变成“更通用的 Claude Code MCP / hooks 检查单”，至少要拆成两层：

1. **通用层**
   - `claude mcp list`
   - 新会话验证
   - 实际调用一次 MCP 工具
   - 检查 hooks 是否被加载
2. **本机层**
   - MemPalace 专属路径
   - 你自己的 shell 脚本位置
   - `~/.mempalace/hook_state/hook.log` 这类私有日志
