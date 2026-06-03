---
title: "Claude Code 接入 DeepSeek 完整配置"
created: 2026-05-25
tags:
  - "claude-code"
  - "deepseek"
  - "配置"
---

# Claude Code 接入 DeepSeek 完整配置

> 配置文件路径：`~/.claude/settings.json`

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.deepseek.com/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "sk-你的DeepSeek-API-Key",

    "ANTHROPIC_MODEL": "deepseek-v4-pro",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "deepseek-v4-pro[1M]",
    "ANTHROPIC_DEFAULT_OPUS_MODEL_NAME": "deepseek-v4-pro",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "deepseek-v4-pro[1M]",
    "ANTHROPIC_DEFAULT_SONNET_MODEL_NAME": "deepseek-v4-pro",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "deepseek-v4-flash",
    "ANTHROPIC_SMALL_FAST_MODEL": "deepseek-v4-flash",

    "CLAUDE_CODE_SUBAGENT_MODEL": "deepseek-v4-flash",
    "CLAUDE_CODE_EFFORT_LEVEL": "max",
    "API_TIMEOUT_MS": "600000",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  },
  "model": "opus",
  "includeCoAuthoredBy": false,
  "skipWebFetchPreflight": true,
  "skipDangerousModePermissionPrompt": true
}
```

---

## 环境变量说明

### 基础连接

| 变量 | 值 | 说明 |
|------|----|------|
| `ANTHROPIC_BASE_URL` | `https://api.deepseek.com/anthropic` | DeepSeek 的 Anthropic 兼容端点，**不要**在末尾加 `/v1` |
| `ANTHROPIC_AUTH_TOKEN` | `sk-...` | DeepSeek API Key，**必须用 `AUTH_TOKEN`**，不要用 `API_KEY` |

### 模型路由（四个槽位都要设）

| 变量 | 值 | 对应 Claude Code 中的角色 |
|------|----|--------------------------|
| `ANTHROPIC_MODEL` | `deepseek-v4-pro` | 默认主模型 |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | `deepseek-v4-pro[1M]` | Opus 级槽位（复杂推理） |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | `deepseek-v4-pro[1M]` | Sonnet 级槽位（标准编码） |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | `deepseek-v4-flash` | Haiku 级槽位（子 Agent、快速任务） |
| `ANTHROPIC_SMALL_FAST_MODEL` | `deepseek-v4-flash` | 轻量任务（权限检查、简单查询） |

> 以上四个槽位不全部显式设置，未设置的槽位会走默认值，导致部分请求模型不一致。

### 显示名称

| 变量 | 值 | 说明 |
|------|----|------|
| `ANTHROPIC_DEFAULT_OPUS_MODEL_NAME` | `deepseek-v4-pro` | 启动界面显示的 Opus 模型名 |
| `ANTHROPIC_DEFAULT_SONNET_MODEL_NAME` | `deepseek-v4-pro` | 启动界面显示的 Sonnet 模型名 |

### 子 Agent

| 变量 | 值 | 说明 |
|------|----|------|
| `CLAUDE_CODE_SUBAGENT_MODEL` | `deepseek-v4-flash` | Explore、Plan 等子 Agent 使用的模型。可用 Pro 获得更好质量，或用 Flash 省成本 |

### 性能与行为

| 变量 | 值 | 说明 |
|------|----|------|
| `CLAUDE_CODE_EFFORT_LEVEL` | `max` | 推理强度，详见下方 [Effort Level 与 DeepSeek 推理模式](Claude%20Code%20接入%20DeepSeek%20完整配置.md#effort-level-与-deepseek-推理模式) |
| `API_TIMEOUT_MS` | `600000` | 超时时间（10 分钟），DeepSeek max effort 下推理较慢 |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | `1` | 禁用非必要的后台网络请求，减少开销 |

### settings.json 顶层字段

| 字段 | 值 | 说明 |
|------|----|------|
| `model` | `"opus"` | 告诉 Claude Code 使用 Opus 级槽位作为主模型 |
| `includeCoAuthoredBy` | `false` | 不在 commit 中添加 co-authored-by |
| `skipWebFetchPreflight` | `true` | 跳过 WebFetch 工具的预检 |
| `skipDangerousModePermissionPrompt` | `true` | 跳过危险模式权限提示 |

> **不要**在顶层写 `"effortLevel"`。顶层 `effortLevel` 可能被 schema 校验拒绝而静默回退到 `high`，且会被 `env` 中的 `CLAUDE_CODE_EFFORT_LEVEL` 覆盖。只使用 `CLAUDE_CODE_EFFORT_LEVEL` 环境变量即可。来源：[HackerNoon - Navigating Claude Code Models, Tiers, and Effort](https://hackernoon.com/navigating-claude-code-models-tiers-and-effort)

---

## `[1M]` 后缀说明

- `deepseek-v4-pro` — 上下文窗口为默认大小（~200K）
- `deepseek-v4-pro[1M]` — 上下文窗口解锁为 100 万 tokens
- Claude Code CLI 会识别 `[1M]` 后缀并正确设置上下文预算，发送到 API 前会自动剥离后缀
- Flash 通常不需要 `[1M]` 后缀，因为子 Agent 任务上下文较小

---

## Effort Level 与 DeepSeek 推理模式

### 为什么设 `max` 是正确的

DeepSeek 有自己的推理模式映射，**不会**像 Anthropic 非 Opus 模型那样把 `max` 降级为 `high`：

| Claude Code 传入的值 | DeepSeek 实际执行的模式 |
|---------------------|----------------------|
| `low`、`medium` | Think **High** |
| `high` | Think **High** |
| `xhigh` | Think **Max** |
| `max` | Think **Max** |

DeepSeek 的 "Think Max" 和 "Think High" 是**两种不同的推理模式**，Think Max 在编码和 Agent 任务上表现显著更强。DeepSeek 官方文档也说明：对 Claude Code 等复杂 Agent 请求，effort 应设为 `max`。

多个社区实测验证：不设 `CLAUDE_CODE_EFFORT_LEVEL=max` 会导致复杂任务推理深度不够。

> 来源：[DeepSeek API Docs - Thinking Mode](https://api-docs.deepseek.com/guides/thinking_mode)、[Cherry Studio PR #14572](https://github.com/CherryHQ/cherry-studio/pull/14572)、[LINUX DO 配置指南](https://linux.do/t/topic/2109483/9)

### 不要同时写顶层 `effortLevel`

```json
// ❌ 不要这样做
{
  "env": {
    "CLAUDE_CODE_EFFORT_LEVEL": "max"   // 环境变量——可靠
  },
  "effortLevel": "xhigh"                 // 顶层字段——不可靠
}
```

**三个理由**：

1. **优先级覆盖**：`env` 中的 `CLAUDE_CODE_EFFORT_LEVEL` 优先级高于顶层 `effortLevel`，两个都写时顶层字段完全被忽略
2. **Schema 校验风险**：顶层 `effortLevel` 可能被 Claude Code 的 schema 校验拒绝，静默回退到 `high`
3. **不持久化**：`/effort max` 命令设置的 effort 不会在会话间持久化，重启后依赖配置文件中的值

**正确做法**：只使用 `CLAUDE_CODE_EFFORT_LEVEL` 环境变量。

> 来源：[HackerNoon - Navigating Claude Code Models, Tiers, and Effort](https://hackernoon.com/navigating-claude-code-models-tiers-and-effort)

### 附：Anthropic 原生模型的 Effort 限制（对比参考）

对于**使用 Anthropic 官方 API 的用户**，effort 降级规则如下：

| 模型 | `low` | `medium` | `high` | `xhigh` | `max` |
|------|:---:|:---:|:---:|:---:|:---:|
| Opus 4.7 | ✅ | ✅ | ✅ | ✅ | ✅ |
| Opus 4.6 | ✅ | ✅ | ✅ | ❌ → `high` | ✅ |
| Sonnet 4.6 | ✅ | ✅ | ✅ | ❌ → `high` | ❌ → `high` |
| Haiku 4.5 | ✅ | ✅ | ✅ | ❌ → `high` | ❌ → `high` |

这个降级规则**仅适用于 Anthropic 原生模型**，与 DeepSeek 无关。写在这里是为了避免混淆——这就是我之前错误地认为 DeepSeek 也会降级的原因。

---

## 踩坑清单

| 坑 | 说明 |
|----|------|
| `ANTHROPIC_AUTH_TOKEN` vs `ANTHROPIC_API_KEY` | 必须用 `AUTH_TOKEN`，用 `API_KEY` 会 401；**不能同时设置两者** |
| Base URL 末尾加 `/v1` | 不要加，直接 `https://api.deepseek.com/anthropic` |
| 模型名写错 | DeepSeek API 遇到不认识的模型名会**静默 fallback 到 v4-flash**，不报错 |
| 四个模型槽位漏设 | 未设的槽位会走默认值，导致部分请求模型不一致 |
| 不带 `[1M]` 后缀 | 上下文只有 ~200K |
| 超时太短 | DeepSeek max effort 推理慢，默认 30 秒不够，建议 10 分钟 |
| 图片任务发给 DeepSeek | DeepSeek 是纯文本模型，不支持视觉输入 |

---

## 验证配置是否生效

1. 启动 Claude Code，观察启动界面显示的模型名称
2. 在对话中输入 `/context` 查看当前模型和上下文用量
3. 去 DeepSeek 控制台查看 API 调用记录，确认所有请求都走的预期模型
4. 在对话中问"你当前使用的是什么模型？"

---

## 关联笔记

- [[AI Harness（驾驭层）知识手册]] — Harness 模型路由是 Harness 层的核心机制
- [[ECC（Everything Claude Code）知识手册]] — ECC 在 DeepSeek 下的兼容性分析
- [[Claude Code Skills 与 MCP 精华笔记]] — Skills 和 MCP 的安装与配置
