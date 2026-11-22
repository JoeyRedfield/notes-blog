---
title: PI Agent 模型上下文窗口配置
created: 2026-08-17
updated: 2026-08-17
tags:
  - note
  - ai
  - pi-agent
  - context-window
  - provider
source_type: official-and-experimental
---

# PI Agent 模型上下文窗口配置

## 两个容易混淆的字段

| 字段 | 含义 | pi 自定义模型默认值 |
|---|---|---:|
| `contextWindow` | 一次请求中输入与输出共享的总 token 窗口 | `128000` |
| `maxTokens` | 单次响应允许生成的最大输出 token | `16384` |

约束可理解为：

$$
\text{input tokens} + \text{output tokens} \le \text{contextWindow}
$$

同时：

$$
\text{output tokens} \le \text{maxTokens}
$$

因此两者不需要设成相同值。例如总窗口 `272000`、最大输出 `128000` 是合法配置，但输入接近上限时，实际可用输出会被总窗口进一步限制。

## 自定义 provider 配置位置

全局自定义模型位于：

```text
~/.pi/agent/models.json
```

典型结构：

```json
{
  "providers": {
    "example-provider": {
      "baseUrl": "https://example.invalid/v1",
      "api": "openai-completions",
      "apiKey": "$EXAMPLE_API_KEY",
      "models": [
        {
          "id": "example-model",
          "name": "Example Model",
          "reasoning": true,
          "contextWindow": 272000,
          "maxTokens": 128000
        }
      ]
    }
  }
}
```

> [!danger] 不要扩散凭证
> `models.json` 可能包含 API Key。学习笔记、日志、截图和 Git 仓库中只保留环境变量形式或脱敏示例。

## 本次修改案例

`klinkw` 下三个 GPT-5.6 路由条目从 `1050000` 改为 `272000`：

- `gpt-5.6`
- `gpt-5.6-sol`
- `gpt-5.6-terra`

保留 `maxTokens: 128000`。验证命令：

```bash
pi --list-models klinkw
```

预期关键列：

```text
klinkw  gpt-5.6        272K  128K
klinkw  gpt-5.6-sol    272K  128K
klinkw  gpt-5.6-terra  272K  128K
```

`models.json` 在打开 `/model` 时重新加载。当前会话如仍持有旧模型元数据，可打开 `/model` 并重新选择模型。

## 修改窗口为什么影响 footer

Footer 的 context 百分比使用当前模型的 `contextWindow` 作分母。相同的 `51,332 tokens`：

```text
51,332 / 1,050,000 = 4.9%
51,332 /   272,000 = 18.9%
```

所以把窗口从 1.05M 改成 272K 后，即使会话内容完全没变，占用百分比也会立即变大。这是分母变化，不是 token 突然增加。

## 配置检查清单

- [ ] `contextWindow` 是否符合实际路由限制，而不是模型理论最大值
- [ ] `maxTokens` 是否小于总窗口并被上游 API 支持
- [ ] `api` 是否匹配代理实现，如 `openai-completions`
- [ ] reasoning model 的 `thinkingLevelMap` 是否与网关支持一致
- [ ] 是否用环境变量或 pi 登录存储管理凭证
- [ ] 修改后是否用 `pi --list-models <provider>` 验证运行时加载结果
- [ ] 当前会话是否需要通过 `/model` 重新选择模型

## 相关笔记

- [[PI Agent 上下文占用计算与诊断]]
- [[PI Agent 自动重试与网络中断恢复]]

## 本机依据

- 官方模型文档：`@earendil-works/pi-coding-agent/docs/models.md`
- 官方 provider 文档：`@earendil-works/pi-coding-agent/docs/custom-provider.md`
- 本机有效配置验证：`pi --list-models klinkw`
