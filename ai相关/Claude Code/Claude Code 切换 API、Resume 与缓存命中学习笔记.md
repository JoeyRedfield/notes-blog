---
title: "Claude Code 切换 API、Resume 与缓存命中学习笔记"
created: 2026-05-28
updated: 2026-06-22
tags:
  - "claude-code"
  - "deepseek"
  - "agent"
  - "缓存"
  - "prompt-caching"
  - "中转站"
  - "学习笔记"
source_type: experimental-observation
---

# Claude Code 切换 API、Resume 与缓存命中学习笔记

> [!warning]
> 这篇笔记里混合了两类内容：
> - **官方已明确说明的机制**
> - **基于实际链路实验得出的经验判断**
>
> 我已在 `2026-06-22` 加上官方锚点。
> 其中“跨后端切换后是否还能继承旧缓存”这件事，官方文档没有给出通用保证，因此仍应视为**实验性结论**，不要当成硬规则。

> 适用场景：`2026-05-28` 这条真实链路是 `10:00` 在 `Claude Code` 中接入 `DeepSeek 官方 API`，`10:10` 退出 `Claude Code`，切到 `link` 中转站 API，再用 `resume` 恢复同一会话。

> 这篇笔记要解决 3 个问题：
> 1. `resume` 恢复的到底是什么
> 2. 切换 API / 中转站后上下文和性能会怎样
> 3. 第一次恢复时，怎么判断缓存有没有命中

## 一、先说结论

### 1.0 截至 2026-06-22，官方已明确的三件事

根据 Claude Code 官方文档，目前可以确定：

- **Session 会持续保存到本地 transcript 文件。** 官方 session 文档明确写到，sessions are saved continuously to local transcript files。
- **`resume` / `continue` 恢复的是本地保存的会话。** 官方文档明确写到 Claude Code stores it locally as you work。
- **Claude Code 会自动使用 prompt caching。** 官方 model config 文档明确写到 Claude Code automatically uses prompt caching。

另外，官方 data usage 文档还明确写到：

- 本地 transcript 默认保留 **30 天**
- 位置在 `~/.claude/projects/`
- 可通过 `cleanupPeriodDays` 调整

下面 1.1 到 1.4 的判断，应放在这些官方事实之上理解。

### 1.1 `resume` 恢复的是本地 transcript，不是服务端会话状态

- `Claude Code` 会把 session 保存在本地。
- `resume` / `continue` 是重新打开这个本地 session，并继续追加消息。
- 它不是恢复某个模型在服务端的“脑内状态”。

这意味着：

- 即使换了 API 地址，只要本地 transcript 还在，会话连续性通常还在。
- 但这种连续性主要是**文本历史连续**，不是**内部推理状态连续**。

### 1.2 每一轮请求都会重新组装上下文

`Claude Code` 每轮都会重新发送一整套上下文，通常包括：

- system prompt
- 项目规则
- 对话历史
- 工具结果
- 新输入

所以“恢复对话”的本质是：

> 让新的后端重新读取旧 transcript，然后继续往下工作。

### 1.3 切 API 地址，不等于切会话；但很可能切了缓存世界

- `ANTHROPIC_BASE_URL` 改的是“请求发到哪里”。
- `resume` 时，本地 transcript 仍然在。
- 但缓存通常属于具体后端或具体缓存域，不属于 `Claude Code` 本地。

因此：

- 切 API 地址后，会话可能还能继续。
- 但缓存能不能继承，往往要重新验证。

### 1.4 在 `DeepSeek 官方 -> link 中转站 -> resume` 这条链路里，第一次恢复默认按“高概率冷启动”理解更稳妥

原因：

- transcript 还在本地，所以语义连续性还在。
- 但旧缓存是否还能被新的 `link` 请求读到，不由本地 transcript 决定，而由新的后端缓存域、模型映射、请求前缀一致性共同决定。

实务上更稳妥的默认假设是：

> 第一次恢复大概率偏冷，第二条紧跟消息才更可能变热。

## 二、这条链路里到底有哪几层

可以把这件事拆成 4 层：

### 2.1 本地会话层

- `Claude Code` 本地保存 transcript。
- `resume` 直接依赖这一层。

### 2.2 请求重建层

- 每一轮都重建上下文并重新发请求。
- 所以历史越长，第一次恢复的重算成本越值得关注。

### 2.3 网关 / 中转层

- `DeepSeek 官方 API` 是直接的 Anthropic 兼容入口：`https://api.deepseek.com/anthropic`
- `link` 则是中转站。
- 这一层可能做模型映射、鉴权、日志、计费、路由、负载均衡。

### 2.4 上游模型 / 缓存层

- 真正回答问题的是上游模型。
- 真正存缓存的也通常是上游模型侧，或者网关自己实现的缓存域。

这 4 层不能混在一起：

- “能 `resume`”不等于“命中旧缓存”
- “命中缓存”也不等于“恢复了旧模型内部状态”

## 三、这次最值得记住的几个机制

### 3.1 关于“resume 后是否仍按原模型走”

这点要比旧版本表述得更谨慎。

如果 `10:00` 那个 session 用的是 `deepseek-v4-pro`，那么 `10:10` 切到 `link` 后再 `resume`：

- 本地 transcript 会被续上
- 但真正发请求时，仍会受到你当前启动时的 provider / model 配置影响

结果会分成几种：

- `link` 也支持这个模型 ID：通常能继续
- `link` 不支持这个模型 ID：可能报错
- `link` 悄悄做了模型映射：能跑，但实际可能已经不是原来的模型

### 3.2 Claude Code 自动用 prompt caching，但后端是否继承要分层看

Claude Code 官方当前已明确：**Claude Code automatically uses prompt caching**。
但这不等于“任何第三方后端切换后都能继承同一份缓存”。

更稳妥的理解是：

- Claude Code 侧：会自动启用缓存机制
- 具体 provider / gateway 侧：是否命中、命中规则、usage 是否透传，仍由后端决定

### 3.3 DeepSeek 官方有自己的硬盘缓存

`DeepSeek` 官方文档明确说明：

- 上下文硬盘缓存默认开启
- 按前缀匹配
- 只有前缀完整命中才算命中
- usage 里会返回：
  - `prompt_cache_hit_tokens`
  - `prompt_cache_miss_tokens`

所以如果后端真的是 `DeepSeek 官方`，最权威的缓存命中指标是这两个字段。

### 3.4 Anthropic 风格缓存指标和 DeepSeek 指标不是一套名字

做实验时要分清楚。

| 视角 | 关键字段 | 含义 |
|---|---|---|
| Claude / Anthropic 风格 | `cache_read_input_tokens` | 从缓存读取了多少输入 tokens |
| Claude / Anthropic 风格 | `cache_creation_input_tokens` | 这轮为缓存创建了多少输入 tokens |
| DeepSeek 风格 | `prompt_cache_hit_tokens` | DeepSeek 硬盘缓存命中的 tokens |
| DeepSeek 风格 | `prompt_cache_miss_tokens` | DeepSeek 硬盘缓存未命中的 tokens |

### 3.5 `link` 如果不透传 usage，就只能间接推断

这是实际使用里最容易踩坑的点。

如果 `link`：

- 不展示上游原始 usage
- 不在日志里暴露缓存字段
- 只给一个总 token / 总费用

那么你就很难“证明”第一次恢复是否命中缓存。

这时只能看弱证据：

- 首次恢复 latency 是否显著偏高
- 首次恢复输入计费是否接近整段历史重算
- 第二条紧跟消息是否显著变快

## 四、第一次恢复是否命中缓存：最小实验法

目标不是“猜”，而是做一个低噪声对照实验。

## 4.1 固定变量

实验时尽量不要同时改变这些东西：

- 不换目录
- 不切分支
- 不新增 commit
- 不改大量文件
- 不切模型
- 不切 effort
- 不连/断 MCP
- 不做 `/compact`
- 不升级 `Claude Code`

如果这些变量一起动了，很容易把“缓存 miss”误判成“模型差”或“中转站差”。

## 4.2 做两组对照

### A 组：基线组

```text
DeepSeek 官方 API -> 等 10 分钟 -> 仍然使用 DeepSeek 官方 API -> resume
```

作用：

- 测同后端下 `10` 分钟后恢复的大致表现

### B 组：目标组

```text
DeepSeek 官方 API -> 等 10 分钟 -> 切到 link 中转站 API -> resume
```

作用：

- 测切中转站后，第一次恢复有没有继承旧缓存

## 4.3 每组都按同一流程走

1. 开一个新 session。
2. 使用同一个模型 ID。
3. 喂一段足够长、固定不变的长材料。
4. 先连续问两轮和这段材料有关的问题。
5. 退出 `Claude Code`。
6. 等 `10` 分钟。
7. 按组别切换或不切换 API。
8. `resume` 后发送固定测试语句。
9. 紧接着发送第二条固定测试语句。

### 推荐测试语句 1

```text
不要读取新文件，不要调用工具，只用一句话复述我们刚才那份长材料的核心结论。
```

### 推荐测试语句 2

```text
现在把刚才那句话扩成三句话，仍然不要读取新文件，不要调用工具。
```

这样设计的目的是：

- 第一条恢复时新增输入极短，便于把延迟和成本主要归因到旧上下文是否被重算
- 第二条紧跟消息可以观察“第一次恢复后，新后端是否已把缓存重新建立起来”

## 五、怎么判读结果

## 5.1 强证据：看 usage 字段

### 如果看得到 Anthropic 风格 usage

- `cache_read_input_tokens > 0`
  - 说明至少发生了缓存读取
- `cache_read_input_tokens = 0` 且 `cache_creation_input_tokens` 很高
  - 典型冷启动特征

### 如果看得到 DeepSeek usage

- `prompt_cache_hit_tokens > 0`
  - 说明命中了 DeepSeek 硬盘缓存
- `prompt_cache_hit_tokens = 0` 且 `prompt_cache_miss_tokens` 很高
  - 说明这轮在 DeepSeek 侧没有命中旧缓存

## 5.2 弱证据：看延迟和第二条消息

如果 `link` 不透传 usage，就按下面方式粗判：

- 第一条恢复明显慢，第二条明显快
  - 高概率是：第一次恢复没继承旧缓存，但新后端已经把前缀重新缓存了

- 第一条和第二条都慢
  - 高概率是：前缀持续不稳定，或者压根没有建立可复用缓存

- 第一条恢复就很快
  - 可能命中了旧缓存，也可能命中了网关自己的缓存，需要结合 usage 再确认

## 5.3 一个常见误判

“回答看起来记得上下文”不等于“缓存命中”。

原因：

- transcript 本地还在，模型当然还能读到历史消息
- 但它是重新读历史，还是直接复用了旧前缀计算结果，是两回事

所以要把：

- `语义连续`
- `缓存命中`

明确分开判断。

## 六、和我当前成本策略的关系

结合 [[AI模型使用成本与场景选择指南]]，缓存命中最值得关注的不是轻量短对话，而是：

- `DeepSeek` 长文本整理
- `Claude Code` 长上下文实现任务
- `link` 上较贵模型的长会话恢复

原因很直接：

- 短对话本来就便宜，缓存收益有限
- 长会话一旦第一次恢复冷启动，整段历史重算的时间和费用更明显

因此我的实际策略应该是：

- 日常轻任务优先按模型总成本选型
- 长上下文任务额外关注“恢复时是否冷启动”
- 如果要频繁 `resume`，就尽量减少中途换模型、换后端、换目录、换路由

## 七、实验记录模板

下面这份可以直接复制到新笔记里使用。

```markdown
---
title: "Claude Code Resume 缓存命中实验记录"
created: 2026-05-28
tags:
  - "claude-code"
  - "deepseek"
  - "缓存实验"
---

# Claude Code Resume 缓存命中实验记录

## 一、实验目的

验证第一次 `resume` 恢复时，是否命中了旧缓存。

## 二、实验环境

- 日期：
- 目录：
- Claude Code 版本：
- 操作系统：
- 模型 ID：
- 原始后端：
- 恢复后后端：
- 是否切换中转站：
- 是否改动目录 / git 状态：
- 是否启用 MCP：

## 三、固定前提

- 长材料来源：
- 长材料是否完全固定：
- 测试前是否已连续问过两轮：
- 等待时长：

## 四、恢复测试语句

### 第一句

```text
不要读取新文件，不要调用工具，只用一句话复述我们刚才那份长材料的核心结论。
```

### 第二句

```text
现在把刚才那句话扩成三句话，仍然不要读取新文件，不要调用工具。
```

## 五、观测数据

### 第一次恢复

- 本轮 latency：
- input_tokens：
- cache_read_input_tokens：
- cache_creation_input_tokens：
- prompt_cache_hit_tokens：
- prompt_cache_miss_tokens：
- 费用：
- 主观感受：

### 第二条紧跟消息

- 本轮 latency：
- input_tokens：
- cache_read_input_tokens：
- cache_creation_input_tokens：
- prompt_cache_hit_tokens：
- prompt_cache_miss_tokens：
- 费用：
- 主观感受：

## 六、结果判断

- 是否能证明命中旧缓存：
- 证据类型：
- 更像是直接命中 / 冷启动后重建 / 无法判断：
- 备注：

## 七、结论

- 结论类型：
- 主要证据：
- 一句话结论：
- 下次实验要控制的变量：

## 八、这些参数到底怎么看

这一节专门解决一个实际问题：

> 知道字段名，不等于知道去哪里看，也不等于知道怎么判读。

## 8.1 先分清“Claude Code 能直接看到的”与“可能要看后端日志的”

### Claude Code 状态栏里通常能直接看到

这些字段来自 `Claude Code` 发给状态栏脚本的 session JSON：

- `model.id`
- `context_window.current_usage.input_tokens`
- `context_window.current_usage.cache_read_input_tokens`
- `context_window.current_usage.cache_creation_input_tokens`
- `context_window.total_input_tokens`
- `context_window.used_percentage`
- `cost.total_api_duration_ms`

### DeepSeek 风格字段不一定能在 Claude Code 里直接看到

这两个字段来自 `DeepSeek API` 返回的 `usage`：

- `prompt_cache_hit_tokens`
- `prompt_cache_miss_tokens`

关键点：

- `Claude Code` 官方状态栏文档明确列出了 `current_usage` 和 `cost` 这类字段。
- 但 `prompt_cache_hit_tokens` / `prompt_cache_miss_tokens` 不是 `Claude Code` 通用状态栏 schema 里的标准字段。
- 所以是否看得到，取决于你当前后端或中转站是否把原始 usage 暴露出来。

实务上通常有三种情况：

1. 直接走 `DeepSeek 官方 API`，且你能看到原始返回或日志：最好判断。
2. 走 `link` 之类中转站，但它透传了上游 usage：也能判断。
3. 走中转站，但它不展示这两个字段：那就只能做间接推断，不能下硬结论。

## 8.2 每个参数分别是什么意思

| 字段 | 典型查看位置 | 含义 | 怎么看 | 常见误区 |
|---|---|---|---|---|
| `本轮 latency` | 手工计时，或 `cost.total_api_duration_ms` 前后差值 | 这一轮请求从发出到收到响应的等待时长 | 第一条恢复明显慢、第二条明显快，常见于“第一次冷启动，第二次开始热起来” | `cost.total_api_duration_ms` 是累计 API 等待时长，不是单轮值，不能直接抄 |
| `input_tokens` | `context_window.current_usage.input_tokens` | 本轮新鲜输入 tokens，不含缓存读写部分 | 大说明这一轮有大量“未缓存输入”需要计算 | 不能把它当“总输入”；总输入要结合缓存字段一起看 |
| `cache_read_input_tokens` | `context_window.current_usage.cache_read_input_tokens` | 本轮从缓存中读取的输入 tokens | `> 0` 说明本轮至少发生了缓存读取 | 只说明“当前处理这轮请求的后端读到了缓存”，不自动证明一定继承了你 10 分钟前那份旧缓存 |
| `cache_creation_input_tokens` | `context_window.current_usage.cache_creation_input_tokens` | 本轮写入缓存的输入 tokens | 首轮高、后续降低通常正常；如果每轮都很高，前缀可能一直在变 | 高不等于坏事；第一次恢复冷启动时它本来就可能很高 |
| `prompt_cache_hit_tokens` | `DeepSeek` 原始 usage 或中转站透传日志 | DeepSeek 硬盘缓存命中的 tokens | `> 0` 是 DeepSeek 命中缓存的直接证据 | 看不到不等于没命中，可能只是中转站没给你看 |
| `prompt_cache_miss_tokens` | `DeepSeek` 原始 usage 或中转站透传日志 | DeepSeek 硬盘缓存未命中的 tokens | 很高通常表示这轮大部分前缀重新算了 | 它不是“总输入”，而是 DeepSeek 视角下未命中的那部分输入 |

## 8.3 `input_tokens` 和 `total_input_tokens` 不是一回事

这点很容易看混。

`Claude Code` 状态栏文档明确说明：

- `context_window.current_usage.input_tokens` 是最近一次 API 调用里“新鲜输入”的部分
- `context_window.total_input_tokens` 是当前上下文窗口里的总输入
- 这个总输入等于：

```text
input_tokens + cache_creation_input_tokens + cache_read_input_tokens
```

所以：

- 想看“这轮到底有多少输入进入上下文”，看 `total_input_tokens`
- 想拆分“新算了多少”和“缓存复用了多少”，看 `current_usage`

## 8.4 `latency` 该怎么记才不误判

你模板里写的 `latency`，建议理解为：

> 这一轮 API 请求的等待时长

但 `Claude Code` 状态栏原生给你的 `cost.total_api_duration_ms` 是：

> 从 session 开始到现在，累计等待 API 的总时长

所以正确记录方法有两个：

### 方法一：最稳

手工记本轮开始和结束时间，直接算单轮耗时。

### 方法二：更方便

记下这轮发送前后的 `cost.total_api_duration_ms`，用：

```text
本轮 latency = 本轮结束后的 total_api_duration_ms - 本轮开始前的 total_api_duration_ms
```

不要直接把 `cost.total_api_duration_ms` 那个累计值抄进模板，否则会把第二条、第三条消息都越记越大。

## 8.5 我建议你在 Claude Code 里至少观察这几个字段

最小观察组合：

- `model.id`
- `context_window.current_usage.input_tokens`
- `context_window.current_usage.cache_read_input_tokens`
- `context_window.current_usage.cache_creation_input_tokens`
- `context_window.used_percentage`
- `cost.total_api_duration_ms`

你可以直接用 `/statusline` 让 Claude Code 生成状态栏脚本。按官方文档，这个命令支持自然语言描述。一个够用的描述可以是：

```text
/statusline show model id, current input tokens, cache read input tokens, cache creation input tokens, context percentage, and total api duration
```

如果你更习惯看中文，可以用同样意思的中文描述；核心是让状态栏把上面几个字段展示出来。

## 8.6 `prompt_cache_hit_tokens` 和 `prompt_cache_miss_tokens` 去哪里找

这是 DeepSeek 相关实验里最容易卡住的地方。

优先级建议如下：

1. 看后端原始响应或网关日志里的 `usage`
2. 看中转站控制台是否展示了这两个字段
3. 如果都没有，就只能依赖 `cache_read_input_tokens`、`cache_creation_input_tokens` 和延迟做间接推断

如果你是在 `Claude Code` 里直接看不到这两个字段，不代表它们不存在，只代表：

- 当前这条链路没有把它们暴露到你手边

## 九、结果分类速记

你做完实验后，可以直接按这个速记法判断。

### 9.1 更像“直接命中旧缓存”

常见信号：

- 第一次恢复就不慢
- `cache_read_input_tokens > 0`
- 如果能看到 `prompt_cache_hit_tokens`，它也明显大于 `0`

注意：

- 这能证明“当前后端读到了缓存”
- 但如果你切过中转站，它仍然未必能单独证明“命中的一定就是 10:00 那次官方直连留下的那一份缓存”

### 9.2 更像“第一次冷启动，第二次开始变热”

常见信号：

- 第一次恢复慢
- 第一次 `cache_creation_input_tokens` 高
- 第二条紧跟消息明显快
- 第二条 `cache_read_input_tokens` 变高

这是你这条 `DeepSeek 官方 -> link -> resume` 路径里最值得重点观察的一种结果。

### 9.3 更像“始终不稳定，难以复用缓存”

常见信号：

- 第一条和第二条都慢
- `cache_creation_input_tokens` 连续偏高
- `cache_read_input_tokens` 持续偏低

这通常说明前缀在变，或者中转站这一跳没有给你稳定的缓存复用条件。

## 十、`sub2api` 面板里的 Cache Creation、Cache Read、Cache Hit Rate 是什么

这一节解决的是中转站面板的概念，不是 `Claude Code` 状态栏字段本身。

## 10.1 这三个指标本质上是什么

结合 `sub2api` 源码，可以把它们理解为：

- `Cache Creation`
  - 聚合统计里“被写入缓存”的输入 tokens
  - 对应上游 Anthropic 风格 usage 里的 `cache_creation_input_tokens`

- `Cache Read`
  - 聚合统计里“直接从缓存复用”的输入 tokens
  - 对应上游 Anthropic 风格 usage 里的 `cache_read_input_tokens`

- `Cache Hit Rate`
  - `sub2api` 前端按 token 维度计算出的缓存命中率
  - 不是“请求次数命中率”，而是“prompt token 命中率”

`sub2api` 前端图表里的实际计算公式是：

```text
Cache Hit Rate = Cache Read / (Input + Cache Read + Cache Creation)
```

也就是说：

- 分子是“从缓存读到的输入 tokens”
- 分母是“这轮 prompt 相关总输入 tokens”

这里的命中率是 **token 级比例**，不是“今天 10 个请求里命中了 7 个”这种请求级统计。

## 10.2 这三个指标和 Claude Code 里的字段怎么对应

| `sub2api` 面板名 | 更底层的字段 | 说明 |
|---|---|---|
| `Input` | `input_tokens` | 新鲜计算的输入 tokens |
| `Cache Creation` | `cache_creation_input_tokens` | 被写入缓存的输入 tokens |
| `Cache Read` | `cache_read_input_tokens` | 从缓存读取的输入 tokens |
| `Cache Hit Rate` | 前端自行计算 | `cache_read_tokens / (input_tokens + cache_read_tokens + cache_creation_tokens)` |

所以：

- `sub2api` 的 `Cache Read`，本质上就是你在 Anthropic 风格 usage 里看到的 `cache_read_input_tokens` 的汇总或展示
- `sub2api` 的 `Cache Creation`，本质上就是 `cache_creation_input_tokens` 的汇总或展示

## 10.3 怎么解读这三个指标

### `Cache Creation` 高

通常说明：

- 当前请求在“建缓存”
- 常见于第一次长会话、第一次恢复、前缀变化较大时

它不是坏事。

如果你刚开始一个长上下文任务，`Cache Creation` 高反而正常。

### `Cache Read` 高

通常说明：

- 当前请求复用了大量旧前缀
- 前缀稳定，缓存读取得好

这个指标比 `Cache Creation` 更接近“这轮有没有真正省算力、降延迟、降成本”。

### `Cache Hit Rate` 高

通常说明：

- 在 prompt 相关 token 里，有很大比例走了缓存复用

但要注意：

- 它是 token 级命中率，不是请求级命中率
- 它高，不代表每一条请求都命中了
- 它低，也不一定是系统坏了，可能只是你这轮前缀变化大

## 10.4 一个很容易误解的点

`Cache Creation = 0`，不一定意味着“今天没有建过缓存”。

还可能是：

- 你看的时间范围里主要是在读旧缓存
- 上游或中转站没有把 cache write 指标完整暴露出来
- 你看的页面是聚合统计，字段映射并不完全

所以不能看到 `0` 就立刻下结论说：

> 今天完全没有发生缓存写入。

## 10.5 用你今天这组数做例子

今天你给的数据是：

- `Input: 638.34K`
- `Output: 69.02K`
- `Cache Creation: 0`
- `Cache Read: 1.34M`
- `Cache Hit Rate: 67.7%`

这组数的直接计算逻辑是：

```text
总 prompt 输入 = 638.34K + 1.34M + 0 = 1.97834M
Cache Hit Rate = 1.34M / 1.97834M ≈ 67.7%
```

这说明：

- 今天 prompt 相关输入里，大约三分之二走了缓存读取
- 只有约三分之一是重新算的输入
- 从“整体输入复用效果”看，今天缓存表现是不错的

### 这组数更像说明什么

更像说明：

- 今天你做了不少前缀稳定的长会话
- 或者你在同一批上下文上持续追问
- 或者第一次恢复后，后续轮次很快又热起来了

### 这组数不能单独证明什么

不能单独证明：

> `10:10` 切到 `link` 之后，第一次 `resume` 的那条请求一定直接命中了旧缓存。

原因是：

- 这是“今天累计”的聚合统计
- 不是那一条具体请求的明细

所以它更适合回答：

- “今天整体缓存利用率怎么样”

不适合单独回答：

- “那一次第一次恢复到底是不是命中旧缓存”

## 10.6 如果想判断第一次恢复，要看什么

如果目标是判断某次具体 `resume` 的首条消息，优先看那一条请求本身的：

- `Cache Read`
- `Cache Creation`
- `first_token_ms`
- `duration_ms`

判读思路可以简化成这样：

- 第一次恢复就有明显 `Cache Read`，而且延迟不高
  - 更像直接命中了缓存

- 第一次恢复 `Cache Read` 低或为 `0`，但第二条紧跟消息明显升高
  - 更像第一次冷启动，第二条开始热起来

- 当天总命中率很高，但第一次恢复那一条并不高
  - 说明“今天整体缓存不错”，但“那次切 API 的首条恢复未必继承了旧缓存”

## 十一、为什么“模型记得历史”，缓存却仍然可能 miss

这两个概念一定要分开：

- `模型记得历史`
  - 说明这轮请求里，历史消息仍然被发给了模型

- `缓存命中`
  - 说明这轮请求里，旧前缀被后端直接复用了，而不是重新计算

所以会出现一种很常见的情况：

> 模型看起来完全记得前文，但缓存其实没有命中。

## 11.1 为什么会这样

因为在 `Claude Code` 里，每一轮都会重新发送完整上下文。

只要：

- 本地 transcript 还在
- 历史消息还没有被丢掉
- 当前请求仍然把这些历史带上

那模型就仍然能“记得历史”。

但缓存命中要求更严格，它要求：

- 请求前缀足够稳定
- 模型没变
- 后端缓存域没变
- 系统层前缀没有发生足够大的扰动

## 11.2 常见的“记得历史但缓存 miss”原因

### 换了模型

即使对话历史还在，缓存通常也不会跨模型共享。

所以：

- 会话还能续
- 但缓存往往重新算

### 换了 provider / 网关 / `ANTHROPIC_BASE_URL`

这时最容易出现的就是：

- 本地 transcript 还在，所以模型仍然能读到历史
- 但缓存属于新的服务端世界，不一定继承原来的缓存

### 系统前缀变了

例如：

- MCP 工具集合变了
- 做了 `/compact`
- Claude Code 升级了
- 项目上下文拼装方式变了

这时语义上你会觉得“还是同一个任务”，但技术上 prompt 前缀已经变了。

### DeepSeek 的缓存前缀匹配更严格

`DeepSeek` 官方文档明确说明，它的硬盘缓存按前缀单元匹配，不是“差不多就行”。

所以：

- 共享一部分前缀，不一定立刻命中
- 有时要等前缀单元被单独落盘后，后续请求才开始明显命中

## 十二、缓存命中与否，会不会影响模型回复质量

先说结论：

- `直接影响`：原则上不会
- `间接影响`：现实里你可能会觉得“质量变了”，但通常不是缓存本身导致的

## 12.1 为什么说“原则上不会”

从机制上说，缓存做的是：

- 复用旧前缀计算结果
- 跳过不必要的重复计算

它不改变：

- 当前轮真正要生成的输出目标
- 模型参数
- 解码过程本身

也就是说：

- 命中缓存不会让模型“更聪明”
- 不命中缓存也不会让模型“降智”

缓存主要影响的是：

- 延迟
- 输入侧成本
- 长上下文重算压力

不是模型能力本身。

## 12.2 为什么现实里会觉得“质量变了”

因为很多缓存 miss 的场景，同时也发生了真正会影响质量的变量变化。

常见情况：

- 切了模型
- 换了中转站，背后未必还是同一个上游
- 做了 `/compact`，早期细节变成了摘要
- 工具集合变了
- 系统 prompt 变了
- 不同 provider 的超时、流式、采样、路由行为不同

这时你看到的是：

- 缓存 miss
- 同时请求条件也变了

真正更可能影响质量的，往往是后者，不是“是否命中缓存”这件事本身。

## 12.3 最实用的判断方法

如果你想区分“这是缓存问题”还是“这是质量问题”，可以这样看：

### 更像缓存问题

- 模型没变
- provider 没变
- 系统前缀没变
- 工具集合没变
- 只是第一次慢、第二次快

这时更该理解为：

- 性能和成本差异

而不是：

- 模型质量差异

### 更像质量问题

- 切了模型
- 换了中转站或上游
- 触发了 `/compact`
- prompt 或系统环境变了

这时就不能把“回答质量变化”归因给缓存。

## 12.4 一句最值得记住的话

> 缓存命中主要影响“算得快不快、贵不贵”，不直接决定“答得好不好”。

如果命中与不命中同时伴随模型、后端、上下文形态变化，那么你观察到的“质量差异”更应该优先归因给这些变化，而不是缓存本身。

## 十三、术语：turn 和 agent loop 是什么

这两个词很基础，但很容易混。

## 13.1 `turn`

`turn` 就是一轮交互。

最简单地理解：

- 用户发一条消息
- agent 基于当前上下文处理
- 返回一个结果

这就算一个 `turn`。

在普通聊天里，一个 `turn` 往往就是：

- 用户一句
- 助手一句

在 agent 系统里，一个 `turn` 的内部可能并不简单，因为模型在给出最终回复前，可能会多次调用工具。

## 13.2 `agent loop`

`agent loop` 是 agent 在完成一个 `turn` 时，内部反复执行的工作循环。

典型流程可以理解成：

```text
读取用户目标
-> 判断下一步
-> 调工具
-> 读取工具结果
-> 再判断下一步
-> 继续调工具
-> ...
-> 最后给用户回复
```

所以：

- `turn` 是你从外部看到的一轮
- `agent loop` 是这一轮内部 agent 自己跑的多步闭环

## 13.3 为什么这两个概念重要

因为很多性能、缓存、成本问题，真正发生的位置并不一样：

- `turn` 之间关心的是：历史如何延续、上下文如何增长
- `agent loop` 内部关心的是：工具调用多不多、每一步是不是都要重复处理大量上下文

## 十四、什么是“系统前缀”

`系统前缀` 不是 `Claude Code` 官方严格术语，是为了方便理解缓存机制而使用的工作名词。

更准确地说，它指的是每轮请求前面那段：

- 靠前
- 相对稳定
- 经常重复出现

的上下文内容。

## 14.1 在 Claude Code 里，它大致由什么组成

结合官方文档，可以把 Claude Code 每轮请求的结构大致理解成：

```text
[System prompt][Project context][Conversation history][New message]
```

其中前两层最接近我前面说的“系统前缀”：

- `System prompt`
- `Project context`

## 14.2 `System prompt` 通常包括什么

通常包括：

- 核心系统指令
- 工具定义
- 输出行为要求
- 通过 `--append-system-prompt` 等方式追加的系统级内容

在某些场景下，还可能带一些运行环境信息，例如：

- 当前工作目录
- shell
- 操作系统信息
- memory 路径等

## 14.3 `Project context` 通常包括什么

通常包括：

- `CLAUDE.md`
- auto memory
- 项目级规则
- 一些与当前项目相关的稳定背景信息

## 14.4 为什么“系统前缀”对缓存特别重要

因为缓存是按请求前缀匹配的。

所以：

- 如果只是后面的对话内容增长，前面的系统前缀仍有机会持续命中
- 如果最前面的系统层内容变了，后面整段内容都可能跟着失去原有缓存前缀

这也是为什么下面这些变化特别容易影响缓存：

- Claude Code 升级
- MCP 工具集合变化
- system prompt 调整
- 项目上下文层变化

## 十五、Claude Code 每轮都重发完整上下文，会不会导致输入计费很高

会，但不能简单理解成“越聊越线性爆炸”。

## 15.1 为什么会让人觉得贵

因为 `Claude Code` 的新一轮请求，确实会把已有历史重新纳入上下文。

这意味着：

- 会话越长
- 每轮看到的输入越多

如果完全没有缓存，这当然会让输入计费明显上升。

## 15.2 为什么又不一定爆炸

因为“上下文被重新发送”不等于“上下文全部按原价重新计算”。

真正计费时，通常会拆成：

- `input_tokens`
- `cache_creation_input_tokens`
- `cache_read_input_tokens`

理解方式是：

- `input_tokens`
  - 这轮需要新鲜计算的输入

- `cache_creation_input_tokens`
  - 这轮新写入缓存的输入

- `cache_read_input_tokens`
  - 这轮直接从缓存复用的输入

所以：

- 会话历史会被重新纳入请求
- 但其中相当一部分可能按“缓存读取”处理，而不是按“完整重算”处理

## 15.3 真正会让输入侧变贵的常见情况

这些情况最容易让长会话成本抬高：

- 会话刚开始，缓存还没建立
- 缓存 TTL 到期
- 切模型
- 切 `ANTHROPIC_BASE_URL` / provider / 中转站
- Claude Code 升级
- 做了 `/compact`
- MCP 工具变化
- 新读了很多文件
- 工具输出很长

## 15.4 一句结论

> Claude Code 会重发完整上下文，但不代表完整上下文每次都按原价重算；真正决定输入计费高不高的，是缓存命中率和缓存是否被频繁打断。

## 十六、Codex 和 Claude Code 在上下文处理上是不是一样

不完全一样，但语义层面很像。

## 16.1 相同点

两者都属于多轮 agent 系统，因此都具备这些特征：

- 新一轮会带上已有历史
- 上下文会随着会话增长而变长
- 都要管理 context window
- 都可能在上下文过长时做 compact / 压缩

## 16.2 Claude Code 更容易理解成“每轮重建上下文”

在理解上，`Claude Code` 更适合用下面这个模型去想：

- 新一轮请求来了
- 重新组装系统层、项目层、对话层
- 再发给后端

这也是为什么在 Claude Code 里，缓存、前缀稳定性、系统层变化会这么关键。

## 16.3 Codex 现在的实现更强调“连接内状态复用”

根据 OpenAI 官方工程文章，Codex 在概念上也会把已有会话历史纳入新 turn 的上下文。

但它现在做了更激进的工程优化：

- 用 `previous_response_id` 延续会话状态
- 在 WebSocket 持久连接里缓存前一个 response state
- 尽量避免在 follow-up 请求里重复处理整段历史

所以更准确地说：

- `语义上`
  - Codex 和 Claude Code 都会延续历史

- `工程实现上`
  - Codex 更强调持久连接、连接内状态缓存、增量化处理
  - Claude Code 更适合理解成“每轮重建上下文，再依赖 prompt caching 降低代价”

## 16.4 一个简化对比

| 维度 | Claude Code | Codex |
|---|---|---|
| 新 turn 是否带历史 | 是 | 是 |
| 是否容易理解成每轮重建上下文 | 是 | 部分是，但实现上更增量 |
| 内部 agent loop 是否强调持久连接复用 | 相对没那么突出 | 更突出 |
| 上下文过长时是否需要 compact | 是 | 是 |

## 十七、我的当前工作假设

在没有实验数据前，先使用这套默认假设：

1. `resume` 恢复的是本地 transcript，不是服务端隐藏状态。
2. `DeepSeek 官方 -> link -> resume` 的第一次恢复，高概率按冷启动理解更稳妥。
3. 第二条紧跟消息如果明显变快，通常说明新后端已经开始重新建缓存。
4. 真正判断缓存命中，优先看 usage 字段，不看“模型好像记得历史”这种体感。

## 十八、关联笔记

- [[Claude Code 接入 DeepSeek 完整配置]]
- [[AI模型使用成本与场景选择指南]]
- [[Codex 写计划、Claude Code CLI 写代码：模型与成本选型建议]]

## 十九、参考资料

- [Claude Code sessions](https://code.claude.com/docs/en/sessions)
- [Claude Code prompt caching](https://code.claude.com/docs/en/prompt-caching)
- [Claude Code model configuration](https://code.claude.com/docs/en/model-config)
- [Claude Code statusline](https://code.claude.com/docs/en/statusline)
- [Claude Code modifying system prompts](https://code.claude.com/docs/en/agent-sdk/modifying-system-prompts)
- [DeepSeek API 首次调用](https://api-docs.deepseek.com/zh-cn/)
- [DeepSeek Anthropic API](https://api-docs.deepseek.com/guides/anthropic_api)
- [DeepSeek 上下文硬盘缓存](https://api-docs.deepseek.com/zh-cn/guides/kv_cache/)
- [sub2api GitHub](https://github.com/Wei-Shaw/sub2api)
- [Unrolling the Codex agent loop](https://openai.com/index/unrolling-the-codex-agent-loop/)
- [Speeding up agentic workflows with WebSockets in the Responses API](https://openai.com/index/speeding-up-agentic-workflows-with-websockets/)
