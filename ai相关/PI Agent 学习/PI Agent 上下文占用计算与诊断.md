---
title: PI Agent 上下文占用计算与诊断
created: 2026-08-17
updated: 2026-08-17
tags:
  - note
  - ai
  - pi-agent
  - context
  - diagnostics
source_type: experimental-observation
---

# PI Agent 上下文占用计算与诊断

## Footer 百分比是什么

在没有 compaction 边界干扰时，pi 取最近一次有效 assistant usage，再加上其后的消息估算值：

$$
\text{percent} = \frac{\text{estimated current context tokens}}{\text{model.contextWindow}} \times 100\%
$$

最近一次 provider usage 的上下文 token 使用：

```text
usage.totalTokens
```

如果 provider 未给出有效总数，则回退为：

```text
input + output + cacheRead + cacheWrite
```

## `cacheRead` 不应重复相加理解

一次请求可能显示：

```text
input:      1,183
cacheRead: 73,216
output:       161
total:     74,560
```

这表示当前请求上下文中有 `73,216` token 命中了 provider 缓存，另有 `1,183` token 是新增或未缓存输入。`cacheRead` 仍是当前请求上下文的一部分，不是需要再次加在历史总量之外的累计账单。

## 本次 27.4% 的真实拆解

会话先在 1.05M 窗口下积累到约 `51,332 tokens`：

```text
51,332 / 1,050,000 = 4.9%
```

将模型窗口改成 272K 后，同一批内容立即变为：

```text
51,332 / 272,000 = 18.9%
```

之后为了查 pi 配置，又读取了完整文档和宽泛搜索结果：

- 完整 `models.md`，约 23.7K 字符
- 完整 `custom-provider.md`，约 28.1K 字符
- 搜索 `klinkw` 返回约 22.3K 字符，并命中大量历史 session 内容
- `models.json`、实现片段和其他较小工具结果

最终 provider 报告：

```text
74,560 / 272,000 = 27.4%
```

因此增长来源可分为：

- 约 14 个百分点：窗口分母从 1.05M 缩小到 272K
- 约 8.5 个百分点：完整文档与大型搜索结果进入上下文
- 其余：模型输出、配置内容和工具调用记录

## 为什么工具结果很容易成为最大项

Pi 会把工具结果作为 `toolResult` 消息写入 session，并在下一次模型调用时回放。常见高占用行为：

1. 完整读取长文档，而不是按 offset/limit 分段。
2. `rg` 搜索范围包含 session、构建产物或大型依赖目录。
3. 搜索结果单行很长，即使行数不多也接近 50KB 截断上限。
4. 重复读取同一份内容；缓存降低费用或延迟，但不降低当前上下文规模。
5. 为了诊断上下文又输出完整 session，形成观察行为本身增加占用。

> [!tip] 控制上下文的操作习惯
> - 先用 `rg -n` 定位，再用 `read offset/limit` 读取必要片段。
> - 搜索时排除 `.git`、session、依赖、生成目录。
> - 对命令输出主动使用 `head`、字段筛选或结构化摘要。
> - 已经知道目标字段时，不要读取整份长文档。
> - 大型诊断最好在新 session 进行，旧 session 留作回归样本。

## 手工诊断流程

### 1. 定位当前 session

```bash
printf '%s\n' "$PI_SESSION_FILE"
printf '%s\n' "$PI_SESSION_ID"
```

### 2. 查看 assistant usage 时间线

读取 JSONL 中每个 assistant message 的：

- `usage.input`
- `usage.output`
- `usage.cacheRead`
- `usage.cacheWrite`
- `usage.totalTokens`
- `stopReason`

寻找 token 突增发生在哪次工具调用之后。

### 3. 按消息内容大小排序

重点检查：

- `toolResult` 的文本长度
- assistant tool call 参数长度
- 完整文档读取
- 搜索输出
- 图片 base64 或自定义消息

字符长度只能用于排序和近似，不能当成精确 token。

### 4. 检查窗口是否变化

对照 model change 和 `models.json`。百分比突增可能只是 `contextWindow` 变小。

### 5. 检查 compaction

Compaction 后，pi 会以 summary 和 retained tail 重建有效上下文。此时不要简单统计整个 JSONL 文件；应使用 `buildContextEntries()` 或 `buildSessionContext()` 获取真正参与当前请求的分支。

## 什么时候使用 `/compact`

适合：

- 大量文档和搜索输出已经完成使命
- 当前任务进入新阶段
- 高占用历史可以被摘要表达

不适合：

- 正在开发上下文统计工具并需要逐条历史作为测试样本
- 需要保留精确工具输出继续实现或排错

## 相关笔记

- [[PI Agent 模型上下文窗口配置]]
- [[PI Agent 上下文归因插件设计]]
