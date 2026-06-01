---
title: "Claude Code CLI 新会话检查清单"
created: 2026-05-26
tags:
  - "claude-code"
  - "mcp"
  - "hooks"
  - "checklist"
---

# Claude Code CLI 新会话检查清单

> 适用场景：你已经给 Claude Code CLI 接好了 `MemPalace MCP` 和 `MemPalace hooks`，现在想确认新开的会话是否真的生效。

## 一、先确认你是新会话

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

