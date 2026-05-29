---
title: "Codex 写计划、Claude Code CLI 写代码：模型与成本选型建议"
created: 2026-05-26
tags:
  - "codex"
  - "claude-code"
  - "deepseek"
  - "openai"
  - "workflow"
  - "成本"
---

# Codex 写计划、Claude Code CLI 写代码：模型与成本选型建议

> 适用场景：我当前的工作流是 `Codex` 通过中转 API 使用 `GPT-5.4 / GPT-5.5`，`Claude Code CLI` 通过 Anthropic 兼容端点接 `DeepSeek V4 Pro`，想判断“Codex 写计划、Claude 写代码”是否合适。

## 一、结论先说

这套分工**是合适的，而且偏优解**：

- `Codex` 负责计划、拆解、风险识别、验收标准整理
- `Claude Code CLI` 负责按计划实现、调试、改代码

如果要再压缩成一句话：

> **默认用 `GPT-5.4` 写计划，复杂规划再升到 `GPT-5.5`；默认用 `Claude Code CLI + DeepSeek V4 Pro` 写代码。**

---

## 二、为什么这个分工顺

### 1. 计划和编码本来就是两类任务

“写计划”更看重：

- 需求澄清
- 边界拆分
- 方案比较
- 风险预判
- 验收标准

“写代码”更看重：

- 长上下文持续工作
- 多文件修改
- 工具调用
- 调试报错
- 小步迭代

所以把两者拆开，本身就符合任务形态。

### 2. 你当前的个人工作流也和这个分工一致

当前工作方式已经比较明确：

- `notes` 仓库主要放学习笔记、日常记录、读书心得
- 当前代码项目的计划，不默认写回 `notes`
- `Codex` 和 `Claude Code CLI` 在**同一个项目目录**下协作
- `Codex` 更偏向写计划，`Claude` 更偏向落地实现

这意味着交接不会靠“口头描述”，而是靠项目目录里的计划文档完成，摩擦会小很多。

---

## 三、从效果看：为什么 Claude 更适合当实现主力

当前 `Claude Code CLI` 这套本地配置已经比较成熟：

- 主模型可走 `deepseek-v4-pro[1M]`
- `CLAUDE_CODE_EFFORT_LEVEL=max`
- 子 agent 可走 `deepseek-v4-flash`
- MCP 已接好
- hooks 已配置，适合在长会话里沉淀上下文

这几个点叠在一起，对“持续编码实现”很友好。

尤其是 DeepSeek 官方文档里明确写到，对 `Claude Code` 一类复杂 agent 请求，thinking 模式建议使用更高推理强度；在当前映射下，`max` 会走更强的推理模式。  
来源：[DeepSeek Thinking Mode](https://api-docs.deepseek.com/guides/thinking_mode)

所以从“编码体验”和“CLI 工具链适配”这件事上，`Claude Code CLI + DeepSeek V4 Pro` 是说得通的。

---

## 四、从成本看：你当前这套为什么很能打

## 4.1 我这次能核实到什么

这次判断基于三类信息：

1. 你提供的中转平台实际账单
2. OpenAI 官方公开 API 定价
3. DeepSeek 官方公开 API 定价

需要注意：

> `ai.klinkw.com` 的 dashboard 是登录态页面，我无法直接公开核验你账户里的专属折扣规则，所以对中转平台的判断以你提供的**真实账单**为准。

### 4.2 你当前 `GPT-5.4` 的实际成本非常低

你提供的数据：

- OpenAI 总费用：`¥2.2339`
- 请求数：`214`
- Token：`26.9M`

其中：

| 模型 | 请求 | Token | 实际 | 标准 |
|---|---:|---:|---:|---:|
| `gpt-5.4` | 210 | 26.9M | `¥2.2319` | `¥14.8794` |
| `gpt-5.4-mini` | 4 | 28.1K | `¥0.0020` | `¥0.0132` |

按这组数据折算：

- 实际成本约 `¥0.083 / 1M tokens`
- 标准成本约 `¥0.553 / 1M tokens`
- 实付约等于标准价的 **15%**

也就是大概打了 **85% 折**。

这意味着：

> **在你当前这条中转链路下，用 `GPT-5.4` 写计划，成本压力几乎可以忽略。**

### 4.3 OpenAI 官方价其实远高于你当前实付

OpenAI 官方当前价格如下：

- `GPT-5.4`：输入 `$2.50/M`，输出 `$15.00/M`
- `GPT-5.5`：输入 `$5.00/M`，输出 `$30.00/M`
- `GPT-5.4 mini`：输入 `$0.75/M`，输出 `$4.50/M`

来源：[OpenAI API Pricing](https://openai.com/api/pricing/)

按 2026-05-26 附近公开汇率粗算，`1 USD` 约等于 `6.79 CNY`：  
来源：[Forbes USD/CNY Converter](https://www.forbes.com/advisor/money-transfer/currency-converter/usd-cny/)

大致折成人民币后：

| 模型 | 输入 | 输出 |
|---|---:|---:|
| `GPT-5.4` | 约 `¥17/M` | 约 `¥102/M` |
| `GPT-5.5` | 约 `¥34/M` | 约 `¥204/M` |

所以你现在的中转实际成本，明显低于官方牌价。

### 4.4 DeepSeek V4 Pro 官方价适合长时间编码

DeepSeek 官方当前 `deepseek-v4-pro` 价格：

- Cache hit input：`$0.003625/M`
- Cache miss input：`$0.435/M`
- Output：`$0.87/M`

来源：[DeepSeek Models & Pricing](https://api-docs.deepseek.com/quick_start/pricing)

按同样汇率粗算：

| 项目 | 美元 | 人民币约值 |
|---|---:|---:|
| 输入（命中缓存） | `$0.003625/M` | `¥0.025/M` |
| 输入（未命中缓存） | `$0.435/M` | `¥2.95/M` |
| 输出 | `$0.87/M` | `¥5.91/M` |

这说明如果只看官方牌价，`DeepSeek V4 Pro` 作为长时间编码模型，成本是很有优势的。

### 4.5 把两边放一起看，结论是什么

如果站在“公开官方牌价”的世界观里：

- `DeepSeek V4 Pro` 很适合做高 token 编码
- `GPT-5.5` 明显更贵
- `GPT-5.4` 也不便宜

但站在“你现在的真实账单”里：

- `GPT-5.4` 的中转实付已经很低
- 所以用它写计划几乎没有成本负担

因此你的最佳策略不是“全都丢给便宜模型”，而是：

> **让便宜且好用的那一边承担长时间编码，让当前折扣很低的 OpenAI 侧承担高价值规划。**

---

## 五、推荐分工

### 默认分工

- `Codex + GPT-5.4`：默认计划模型
- `Claude Code CLI + DeepSeek V4 Pro`：默认实现模型

### 升级分工

遇到下面这些场景时，再把计划阶段升到 `GPT-5.5`：

- 大范围重构
- 架构迁移
- 多方案对比且代价差异大
- 风险很高、回滚代价很高
- 需求边界模糊，需要更强整理能力

### 不建议的做法

- 把 `GPT-5.5` 设成所有计划任务的默认模型
- 每个小任务都先让 `Codex` 产出完整计划再交给 `Claude`

原因很简单：不是所有任务都值得两段式协作。

---

## 六、什么时候这套分工不合适

### 1. 很小的任务

比如：

- 改一个配置
- 修一个小 bug
- 改一段文案

这种时候直接让 `Claude Code CLI` 干就行，先写计划反而增加摩擦。

### 2. 需求本身还没想明白

如果你还在探索：

- 值不值得做
- 有哪些可能路线
- 真实约束是什么

那就先把时间花在 `Codex` 侧，把问题想清楚，再交给 `Claude`。

### 3. 任务依赖视觉理解

当前 DeepSeek 路线主要是文本型工作流。  
如果任务强依赖截图、图像、视觉分析，这条链路未必是最优选择。

---

## 七、最实用的工作方式

项目里建议至少放这两个文件：

- `docs/current-plan.md`
- `docs/debug-log.md`

推荐闭环：

1. `Codex` 把计划写进 `docs/current-plan.md`
2. `Claude Code CLI` 开始前先读计划
3. 实现过程中把偏差和问题写进 `docs/debug-log.md`
4. 如果项目接了 MemPalace，再执行一次：

```bash
mempalace mine .
```

这套方式的好处是：

- 计划和代码同目录
- 交接靠文档，不靠记忆
- 方便后续 MCP / MemPalace 回忆上下文

更完整的做法可以看：[[项目目录里 Codex 计划 + Claude Code CLI 开发工作流模板]]

---

## 八、最终建议

当前这套组合，综合考虑**成本、效果、工作流稳定性**，结论是：

> **继续用，而且把 `GPT-5.5` 当“难题升级档”而不是默认档。**

一句话版建议：

- 日常计划：`GPT-5.4`
- 复杂规划：`GPT-5.5`
- 日常实现：`Claude Code CLI + DeepSeek V4 Pro`

这样既保留了高质量规划能力，也不会把所有成本都堆到最贵的模型上。

---

## 九、关联笔记

- [[项目目录里 Codex 计划 + Claude Code CLI 开发工作流模板]]
- [[Claude Code 接入 DeepSeek 完整配置]]
- [[Claude Code CLI 新会话检查清单]]
- [[MemPalace 学习笔记]]
