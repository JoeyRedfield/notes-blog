---
tags:
  - claude-code
  - hooks
  - skills
  - agents
  - deep-dive
created: 2026-06-01
raw: "[[I Read the Claude Code Source Code. Here's Everything You Can Configure That the Docs Don't Tell You.]]"
---

# Claude Code 源码未文档化功能挖掘

> 来源：André Figueira，2026.04.02，基于 `@anthropic-ai/claude-code@2.1.87` 源码分析。未文档化功能可能随版本变动。

## 一、Hook 响应字段

文档只说 hook 通过 stdin 收 JSON、exit code 2 可阻断操作。**源码揭示 hook 可通过 stdout 返回 JSON，包含事件特定字段来实时修改 Claude Code 行为**。

### PreToolUse 可返回

| 字段 | 作用 |
|------|------|
| `updatedInput` | 改写工具输入，**在命令执行前修改命令** |
| `permissionDecision` | 强制 `allow` 或 `deny`，无需用户确认 |
| `permissionDecisionReason` | 决策理由（显示在 UI） |
| `additionalContext` | 注入对话上下文 |

**实战——自动给 `git push` 加 `--dry-run`：**

```bash
#!/bin/bash
INPUT=$(jq -r '.tool_input.command' < /dev/stdin)
if echo "$INPUT" | grep -q 'git push'; then
  jq -n --arg cmd "$INPUT --dry-run" '{"updatedInput": {"command": $cmd}}'
fi
```

Claude 以为在执行 `git push origin main`，hook 已悄悄改写为 `git push origin main --dry-run`。

**实战——自动批准只读命令：**

```bash
#!/bin/bash
CMD=$(jq -r '.tool_input.command' < /dev/stdin)
if echo "$CMD" | grep -qE '^(ls|cat|echo|pwd|whoami|date|git status|git log|git diff)'; then
  echo '{"permissionDecision": "allow", "permissionDecisionReason": "Safe read-only command"}'
fi
```

### SessionStart 可返回

| 字段 | 作用 |
|------|------|
| `watchPaths` | 自动监听文件变化，触发 FileChanged 事件 |
| `initialUserMessage` | 在首次用户消息前注入内容 |
| `additionalContext` | 注入整个会话持久化的上下文 |

### PostToolUse 可返回

| 字段 | 作用 |
|------|------|
| `updatedMCPToolOutput` | 修改 MCP 工具返回内容 |
| `additionalContext` | 工具执行后注入上下文 |

---

## 二、Hook 生命周期控制（三个未文档化字段）

| 字段 | 作用 | 适用场景 |
|------|------|----------|
| `once: true` | 执行一次后自动移除 | 首次会话初始化（如复制 `.env.example`） |
| `async: true` | 后台执行，不阻塞 Claude | 审计日志、非关键检查 |
| `asyncRewake: true` | 后台执行 + 出错时唤醒模型阻断操作 | **安全扫描**——正常时不阻塞，检测到问题时阻断 |

**`async` vs `asyncRewake` 的区别是重点**：async 纯后台，asyncRewake 在 exit code 2 时会唤醒模型并阻断。

**实战——扫描 Claude 写入的文件是否含硬编码密钥：**

```bash
#!/bin/bash
FILE=$(jq -r '.tool_input.file_path // .tool_response.filePath' < /dev/stdin)
if grep -qE '(password|secret|api_key)\s*=' "$FILE" 2>/dev/null; then
  exit 2  # 阻断：检测到密钥
fi
exit 0    # 安全：继续
```

---

## 三、Skill 未文档化 Frontmatter

| 字段 | 作用 | 示例 |
|------|------|------|
| `model` | 覆盖该 Skill 使用的模型 | `model: haiku` 做快速 lint，`model: opus` 做深度审查 |
| `effort` | 控制推理深度 | `low` / `medium` / `high` / `max` |
| `hooks` | Skill 激活期间的范围 hook（激活时注册，结束时移除） | 写 TypeScript 时自动 type-check |
| `agent` | 将 Skill 委托给指定 Agent | `agent: security-review` |
| `disable-model-invocation: true` | 禁止自动触发，只能显式 `/skill-name` | 破坏性 Skill 防误触发 |
| `shell` | 指定执行 Shell | `shell: bash` |

**`model` + `effort` 组合是关键——可以用 Haiku + low 做快速任务，Opus + max 做深度分析，且 fork 场景下设置不同 model 会破坏 prompt cache（见第九节）。**

---

## 四、Agent 未文档化字段

| 字段 | 作用 |
|------|------|
| `color` | UI 颜色：red/orange/yellow/green/blue/purple/pink/gray |
| `memory` | **持久化记忆**：`user`（全局）/ `project`（项目级）/ `local`（gitignore） |
| `omitClaudeMd: true` | 跳过加载 CLAUDE.md 指令层级，用行业标准而非项目约定审查代码 |
| `criticalSystemReminder_EXPERIMENTAL` | 每轮对话重新注入的系统提醒，**压缩后仍保留** |
| `requiredMcpServers` | 指定必须配置的 MCP Server，不满足则 Agent 不出现 |

**`memory` 是最重要的未文档化字段**——Agent 可以跨会话积累经验。审阅者记住过去的发现，代码导航员记住项目结构，越用越聪明。

**`criticalSystemReminder_EXPERIMENTAL` 具有 EXPERIMENTAL 标签，随时可能移除，不要在其上构建关键基础设施。**

---

## 五、Auto-Mode YOLO Classifier

源码中 Auto-mode 权限系统内部叫 **"YOLO Classifier"**。其 `environment` 字段接受**自然语言描述**而非模式匹配：

```json
{
  "autoMode": {
    "allow": ["Bash(npm test)", "Bash(git status)", "Read", "Grep"],
    "soft_deny": ["Bash(git push *)", "Bash(rm *)"],
    "environment": [
      "NODE_ENV=development",
      "This is a local dev machine with no production database access",
      "All Docker containers use isolated networks"
    ]
  }
}
```

Classifier 读取这些英文描述来理解环境上下文，直接影响对模糊命令的安全性判断。写得越具体，决策越准确。

---

## 六、自学习回路

两个 settings.json 字段激活 Claude Code 的自我改进系统：

```json
{
  "autoMemoryEnabled": true,
  "autoDreamEnabled": true
}
```

- **`autoMemoryEnabled`**：每次会话结束后，后台 Agent 自动提取值得记住的内容（偏好、模式、决策），写入 `~/.claude/projects/<path>/memory/`
- **`autoDreamEnabled`**：每 24 小时检查一次，若积累 ≥5 个会话，后台 Agent 回顾记录并进行记忆合并（去重、消解矛盾、相对时间转绝对、清理过时条目）

**复合效应**：会话产生记忆 → Dream 合并记忆 → 合并后的记忆指导未来会话。几周后 Claude Code 无需提示就能记住你的偏好和项目模式。

---

## 七、Magic Docs 格式

正则：`/^#\s*MAGIC\s+DOC:\s*(.+)$/im`。必须是一级标题，大小写不敏感，下一行可写斜体指令限定更新范围：

```markdown
# MAGIC DOC: API Endpoint Reference
_Only document public REST endpoints. Include method, path, request body, response schema, and auth requirements._

## Endpoints

(content auto-maintained by Claude Code)
```

删除标题即停止自动追踪。

---

## 八、权限规则完整语法

```
Bash(npm *)              # npm 后的通配
Bash(git commit *)       # 特定子命令
Read(*.ts)               # 文件扩展名
Read(src/**/*.ts)        # 递归目录 + 扩展名
Write(src/**)            # 递归目录所有文件
mcp__slack               # 某个 Server 全部工具
mcp__slack__post_message # 特定 MCP 工具
```

`*` 在边界内匹配（类似 shell glob），`**` 递归匹配目录。MCP 工具用双下划线分隔：`mcp__<server>__<tool>`。

---

## 九、context: fork 与模型缓存

`context: fork` 的 Skill 作为后台 fork subagent 运行，fork 与父会话通过 `CacheSafeParams` 共享 prompt cache——所有 fork 产生字节级相同的 API 请求前缀以最大化缓存命中。

**关键影响**：如果在 fork Skill 上设置与父会话不同的 model，缓存断裂，全额计费。要么不设 model，要么用 `model: inherit` 保持缓存。

适用场景：安全扫描、依赖分析、文档生成、测试套件——这些重活在后台运行，主会话保持响应。

---

## 总结：源码揭示的四层能力

1. **Hook 中间件层**——可编程的 AI 工具调用中间件，比大多数 CI/CD 管道更灵活
2. **Agent 持久记忆**——跨会话积累专业知识的 AI 专家
3. **Dream 合并系统**——无需模型重训练的从经验中学习
4. **YOLO Classifier**——用自然语言描述环境来做安全决策

这些不是隐藏彩蛋，而是持久化、自学习、自治 AI 开发环境的脚手架，已经在 npm 包里可用。

## 相关笔记

- [[Claude Code Skills 与 MCP 精华笔记]] — Skills 与 MCP 生态
- [[ECC（Everything Claude Code）知识手册]] — ECC 框架全貌
- [[Claude Code 切换 API、Resume 与缓存命中学习笔记]] — 缓存机制
- [[AI Harness（驾驭层）知识手册]] — Agent 工程范式

---

## 个人应用分析

> 从自身情况出发，判断哪些可以直接用、哪些与职业方向相关。

### 立刻能用的

**1. 自动批准安全命令 Hook**

当前操作笔记库时，大量只读命令（`ls`、`git status`、`find`、`cat`）反复弹确认框。一个 PreToolUse hook 即可消除噪音：

```bash
#!/bin/bash
CMD=$(jq -r '.tool_input.command' < /dev/stdin)
if echo "$CMD" | grep -qE '^(ls|cat|echo|pwd|git status|git log|git diff|find)'; then
  echo '{"permissionDecision": "allow", "permissionDecisionReason": "Safe read-only"}'
fi
```

**2. Skill 的 model/effort 控制成本**

自己写 Skill 时可按场景选模型：快速整理用 `haiku + low`，深度分析用 `opus + max`。

### 与职业方向直接相关

**3. Agent 持久记忆（`memory` 字段）**

三种记忆层级（user/project/local）本质上是 LLM Wiki 架构在 Agent 层面的工程化实现。理解记忆系统设计是 AI Agent 开发的核心工程问题。详见 [[AI时代软件开发职业方向]]。

**4. 自学习回路的设计模式**

```
会话产生记忆 → Dream 合并去重 → 合并后的记忆指导未来会话
```

与笔记库的 Ingest → Lint → Query 循环思想一致。设计 Agent 系统时，难点不在于"记什么"，而在于"怎么合并、去重、淘汰过时记忆"——和缓存失效是同一类难题。

### 值得了解但不急用

**5. Skill 作用域 Hook**

与全局 Hook（settings.json 中配置，始终生效）不同，Skill 作用域 Hook 只在 Skill 运行期间生效：

| | 全局 Hook | Skill 作用域 Hook |
|---|---|---|
| 生效时机 | 一直开着 | Skill 激活时注册，结束时注销 |
| 适用场景 | 通用策略（安全、权限） | 某个任务需要的临时约束 |
| 配置位置 | settings.json | Skill 的 frontmatter |

反面模式：全局挂一堆互不相关的 Hook——TypeScript type-check、安全审计、密钥扫描、日志记录全挤在全局。结果做什么任务都跑一整条检查链。

正确用法：只在对应场景才挂对应的 Hook。TypeScript type-check 只在 TypeScript Skill 里跑，安全审计只在 security-review Skill 里跑。互不污染。

**当前自身情况**：只有一个全局 Hook（自动批准安全命令），而且"安全命令"本身就是通用策略，应该全局。没有犯反面模式。

**6. YOLO Classifier 的自然语言安全策略**：暗示安全策略从规则引擎向语义理解迁移的趋势，做 Agent 安全设计时可参考。

### 已实际配置

**自动批准安全命令 Hook**（2026-06-01 配置）：

- 脚本：`~/.claude/hooks/auto-approve-readonly.sh`
- 覆盖 9 类安全命令：文件浏览（ls/cat/pwd）、Git 只读（status/log/diff/branch）、文本处理（find/wc/head/tail/grep）、系统信息（du/df/ps）等
- 验证通过：`ls`/`git status` 自动批准，`git push`/`npm install` 正常走权限流程
- 注册于 `~/.claude/settings.json` → PreToolUse hook，下次新会话生效
