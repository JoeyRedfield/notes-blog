---
title: Hermes 学习笔记——Profile、Personality、Memory 与 Gateway 模型关系
created: 2026-06-20
updated: 2026-06-20
tags:
  - ai
  - agent
  - hermes
  - gateway
  - memory
  - profile
  - personality
source_type: experimental-observation
---

# Hermes 学习笔记——Profile、Personality、Memory 与 Gateway 模型关系

> 这篇笔记用于澄清学习 Hermes 时最容易混淆的几个概念：`profile`、`personality`、`memory`、`model`、`gateway`。核心问题是：**多平台接入时，哪些东西是共享的，哪些东西是隔离的？**

> [!note]
> 本页是 **Hermes 概念澄清页**，优先回答“这些边界到底是什么”。
>
> 推荐阅读顺序：
> 1. 先读这页，建立 `profile / personality / memory / model / gateway` 的分层
> 2. 再读 [[Hermes 实操入门：profile、gateway、memory 怎么搭]]，决定单 profile 还是多 profile
> 3. 真跑起来不符合预期时，再读 [[Hermes 排错手册：profile、gateway、memory、model 为什么没按预期工作]]
>
> 它不负责：
> - 逐步搭建命令
> - 排错流程
> - 某次本机运行态故障复盘

## 一、先给结论

### 1.1 微信和 QQ Gateway 默认调用什么模型？

在单一 profile 下，Hermes Gateway **默认读取该 profile 的全局 `model` 配置**，而不是天然为 `weixin`、`qqbot` 各自维护一套独立模型配置。

本次本地检查到的当前配置示例（`default` profile）：

```yaml
model:
  default: gpt-5.4
  provider: custom
  base_url: https://ai.klinkw.com/v1
  api_mode: codex_responses
```

因此，在当前这套配置里：

- 微信 gateway → `gpt-5.4`
- QQ gateway → `gpt-5.4`

### 1.2 微信和 QQ 能否改成不同模型？

**能实现，但最稳妥的方式通常不是在一个 profile 里直接给不同平台分别写模型，而是拆成两个 profile。**

原因：

- 单 profile 更偏向“同一实例、多入口”
- 多 profile 才是 Hermes 原生支持的“配置、会话、记忆、技能、模型隔离”方案

### 1.3 两个 profile 会不会共用 memory？

**不会。**

Hermes 的 profile 是隔离单元。不同 profile 默认拥有各自独立的：

- config
- sessions
- skills
- memory

所以：

- `wechat` profile 记住的内容，不会自动进入 `qq` profile
- `qq` profile 的长期记忆，也不会自动同步给 `wechat`

---

## 二、最重要的概念分层

很多混乱来自于把 **profile** 和 **personality** 当成同一级概念。其实不是。

### 2.1 一张图看懂

```text
Hermes
└── Profile（实例 / 隔离空间）
    ├── config.yaml
    ├── model
    ├── memory
    ├── skills
    ├── sessions
    ├── gateway 连接
    └── personality / system_prompt
         └── 决定“怎么说话、什么语气、什么风格”
```

### 2.2 四个关键词的本质

#### Profile

`profile` 是 **一个独立的 Hermes 实例空间**。

它决定的是：

- 用哪份 `config.yaml`
- 用哪个模型配置
- 用哪份 memory
- 保存哪套 sessions
- 加载哪套 skills
- 接哪些 gateway

可以把它理解为：**一个完整身份容器**。

#### Personality

`personality` 是 **这个容器内部的一种说话风格模板**。

它主要影响：

- 语气
- 风格
- system prompt
- 助手“像什么样的人在说话”

它不负责隔离 memory，也不负责隔离 sessions，更不直接决定 model。

#### Model

`model` 是 **底层调用的推理模型**。

它影响的是：

- 成本
- 速度
- 能力上限
- 工具调用和长任务时的稳定性

#### Memory

`memory` 是 **跨会话长期保留的信息层**。

它会记住：

- 用户偏好
- 环境事实
- 长期有用的约定

但它是**跟着 profile 走的**，不是全局自动共享。

---

## 三、Profile 和 Personality 到底是什么关系？

### 3.1 profile 是大房子，personality 是房子里的说话说明书

这是最实用的理解方式：

- **profile = 大房子**
- **personality = 房子里的说话说明书**

也就是说：

- 换 personality，不等于换 profile
- 换 profile，通常连 personality 配置也一起换了

### 3.2 personality 属于 profile 内部配置的一部分

因为每个 profile 都有自己的 `config.yaml`，而 personality / system prompt 就存在配置里。

所以：

- `profile A` 可以用 `teacher` 风格
- `profile B` 可以用 `technical` 风格
- 二者互不影响

### 3.3 改 personality，不会切换 memory

同一个 profile 里：

- 先执行 `/personality teacher`
- 后执行 `/personality technical`

这只是在换 prompt 风格，**memory 仍然是同一份**。

因此：

> personality 解决的是“怎么说”，不是“是谁”。

---

## 四、学习 Hermes 时最容易犯的三个错误

### 错误 1：以为 personality = profile

错。

- `profile` 是实例边界
- `personality` 是表达风格

二者不是同级概念。

### 错误 2：以为改 personality 会把微信和 QQ 自动隔离

错。

如果仍然是同一个 profile：

- memory 还是共享的
- sessions 体系还是同一个实例空间
- model 默认还是同一套全局配置

### 错误 3：以为想分平台模型，只要改 personality 就行

错。

`personality` 主要修改的是 system prompt / 说话风格，**不负责模型路由**。

如果需求是：

- 微信用强模型
- QQ 用便宜模型

那是 **profile / model 配置层** 的问题，不是 personality 层的问题。

---

## 五、围绕微信 / QQ 的三种典型架构

### 方案 A：一个 profile，统一 memory，统一 model

```text
Profile: default
├── Model: 一套
├── Memory: 一份共享
├── WeChat gateway
└── QQ gateway
```

适合：

- 最在乎上下文连续性
- 希望两边像“同一个助手”
- 接受模型基本统一

优点：

- memory 共用
- 管理简单
- 所有会话知识连续

缺点：

- 平台级不同模型不自然
- 场景容易互相污染

### 方案 B：两个 profile，完全隔离

```text
Profile: wechat
├── Model: A
├── Memory: 微信独立
└── Personality: X

Profile: qq
├── Model: B
├── Memory: QQ独立
└── Personality: Y
```

适合：

- 微信像生活助理
- QQ像工作助理
- 模型、记忆、技能都希望隔离

优点：

- 模型可独立
- memory 不串
- 风格也可独立

缺点：

- 两边记忆不共享
- 同一类偏好可能需要分别教两次

### 方案 C：一个 profile + personality 区分风格

```text
Profile: default
├── Model: 一套
├── Memory: 一份
├── WeChat: 偏 teacher 风格
└── QQ: 偏 technical 风格
```

适合：

- 本质上仍想把两边当成“同一个助手”
- 只是希望表达风格有所区别

优点：

- 配置简单
- memory 共用
- 风格可区分

缺点：

- 不是严格意义上的两个独立助手
- 模型仍然不天然按平台分离

---

## 六、一个压缩判断公式

以后遇到类似问题，可以直接套下面这四句：

```text
profile 决定“是不是同一个 Hermes”
personality 决定“这个 Hermes 怎么说话”
model 决定“它用哪个脑子”
memory 决定“它记住什么”
```

进一步压缩：

- 想改“口气” → 改 personality
- 想改“身份边界、模型、记忆、会话隔离” → 改 profile

---

## 七、本次学习里顺手确认到的 Hermes 细节

### 7.1 `/personality` 本质上在改 system prompt

Hermes 的 personality 机制，本质是把选中的风格模板写入 `agent.system_prompt`（或等价的运行时 prompt 配置），因此它更像“风格开关”，而不是“实例切换器”。

### 7.2 Gateway 支持会话级模型切换，但这不是平台级永久隔离

Hermes gateway 存在会话级模型 override（例如通过 `/model` 对某个会话临时切换模型）。这意味着：

- 某个会话可以临时改模型
- 但这不等于“微信平台永久一套模型，QQ 平台永久另一套模型”

所以不要把：

- **会话级 override**
- **平台级策略**
- **profile 级隔离**

混成同一回事。

---

## 八、如何向自己提问，快速判断该怎么设计

如果未来再遇到 Hermes 架构问题，可以先问自己三句：

### 问题 1：我到底想要“一个助手”还是“两个助手”？

- 一个助手 → 倾向单 profile
- 两个助手 → 倾向双 profile

### 问题 2：我更在乎 memory 共用，还是模型隔离？

- 更在乎 memory 共用 → 单 profile
- 更在乎模型隔离 → 双 profile

### 问题 3：我只是想换语气，还是想换边界？

- 换语气 → personality
- 换边界 → profile

---

## 九、我的当前理解（可复习版）

如果用一句话总结这次学习：

> **Hermes 的多平台接入默认更像“同一个 agent 的多个入口”；只有当我显式拆成多个 profile 时，它才变成“多个独立 agent 实例”。而 personality 只是这些实例内部的说话风格，不是实例边界本身。**

---

## 相关笔记

- [[lienjack/AI/1.概念介绍/05.OpenClaw、Hermes和Harness关系|OpenClaw、Hermes 和 Harness：它们到底是什么关系]]
- [[Agent与自动化/AI Agent 自动化任务方案对比|AI Agent 自动化任务方案对比]]
- [[Agent与自动化/Agentic Engineering 实战技巧集（2026年6月）]]
