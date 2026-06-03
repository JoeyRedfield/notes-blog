---
tags:
  - ai-coding
  - software-fundamentals
  - agent-workflow
  - tdd
  - design
created: 2026-06-03
raw: '[["Software Fundamentals Matter More Than Ever" — Matt Pocock]]'
source: https://www.youtube.com/watch?v=v4F1gFy-hqg
author: "[[Matt Pocock]]"
---

# 软件基础在 AI 时代更重要 — Matt Pocock

> Matt Pocock（Total TypeScript 作者、Claude Code 教学者）在 AI Engineer 大会上的演讲。核心论点：**AI 编码工具在好的代码库里表现极好，在差的代码库里是灾难。代码不是变便宜了——坏代码比以往任何时候都更昂贵。**软件基础（通用语言、TDD、深度模块、持续设计）不仅没有过时，反而更重要了。

## 背景：specs-to-code 的失败

业界有一种"specs-to-code"运动：写一份规范，让 AI 生成代码，有问题就改规范重新编译，**不怎么看代码本身**。

Matt 的实际体验：跑一次得到代码，跑第二次得到更差的代码，继续跑继续差——最终得到垃圾。他把这称为"vibe coding 的另一个名字"。

这引出了核心问题：**代码不是免费的。坏代码是最贵的。**

> 因为如果代码库难以修改，你就无法利用 AI 能带来的全部红利。AI 在好的代码库里表现极好。

## 五大失败模式与解决方案

Matt 在 18 个月教学中总结了开发者在 AI 编码中遇到的五种失败模式，每一种的解药都来自**几十年前的软件工程经典**。

### 1. AI 没做我想要的东西 → "Grill Me"（共享设计概念）

**问题**：你和 AI 之间存在通信障碍。AI 做了需求收集，但做出来的不是你脑子里想的东西。

**来源**：Frederick P. Brooks《The Design of Design》— "设计概念"（design concept）：当多个人一起设计时，每个人脑子里漂浮着关于"正在构建什么"的临时想法，这个东西就是设计概念。它不是文档资产，是无法放进 Markdown 文件的"不可见理论"。

**解决方案**：创建 **"Grill Me"** Skill。

```
Interview me relentlessly about every aspect of this plan until 
we reach a shared understanding. Walk down each branch of the 
design tree, resolving dependencies between decisions one by one.
```

这个 Skill 让 AI 变成**对手方**——不断向你提问，可能问 40、60、甚至 100 个问题，直到它确认达成了共享理解。对话过程本身可以直接转化为 PRD 或 Issue。

> Matt 认为这比 Claude Code 默认的 Plan Mode 更好——Plan Mode 太急于产出文档资产，而 Grill Me 先建立共享设计概念。

### 2. AI 太啰嗦，词汇不对齐 → 通用语言（Ubiquitous Language）

**问题**：AI 用太多词来描述一件事，你和 AI 各说各话，就像开发者和领域专家之间存在"语言鸿沟"。

**来源**：Domain-Driven Design（领域驱动设计）— **通用语言**：开发者之间的对话、代码中的表达、和领域专家的沟通，都应该来自同一套领域模型。

**解决方案**：创建 **Ubiquitous Language** Skill。扫描代码库，提取所有术语，生成一个 Markdown 文件（术语表和定义）。然后：

- 在和 AI 对话时始终传入这份术语表
- Matt 自己会在"Grill Me"和规划时一直开着这份文件
- 观察 AI 的思维链发现：**不仅改善了规划质量，还让 AI 用更少的词来思考**，实现结果也更对齐

### 3. AI 写的东西不能运行 → TDD + 反馈循环

**问题**：AI 默认行为是一次产出大量代码，然后才想"哦我应该检查一下"。

**来源**：《The Pragmatic Programmer》— "**反馈的速度就是你的速度上限**"（The rate of feedback is your speed limit）。同理，"超过你的头灯范围开车"（outrunning your headlights）——开太快，看不清前面的路。

**解决方案**：

- **静态类型**：不用 TypeScript 是疯狂的（对 Java 来说，强类型体系本身就是优势）
- **浏览器反馈**：前端项目给 AI 浏览器访问权，让它能看到运行结果
- **TDD（测试驱动开发）**：强制 AI 小步前进——先写测试 → 让测试通过 → 重构改进设计

> 注意：测试一直很难，因为需要决定测多大粒度、mock 什么、测哪些行为——而这些决策彼此关联。**好的代码库就是容易测试的代码库。**

### 4. 测试本身就很难写 → 深度模块（Deep Modules）

**问题**：代码库充满"浅模块"——大量暴露复杂接口的小模块。AI 在探索这样的代码库时会迷失，理解不了依赖关系，无法有效利用反馈循环。

**来源**：John Ousterhout《A Philosophy of Software Design》— **深度模块 vs 浅模块**。

| 深度模块 | 浅模块 |
|---------|--------|
| 大量功能隐藏在简单接口后面 | 功能很少，接口复杂 |
| 你**可以**深入看实现，但**不需要** | 必须逐个理解才能使用 |
| 测试在接口层面做，简洁高效 | 测试需要处理复杂的模块间依赖 |

**解决方案**：**Improve Codebase Architecture** Skill。探索代码库，找到逻辑上相关的代码，用深度模块包裹它们——设计好接口，实现细节可以交给 AI。

> 这就是 AI 时代的好架构：**接口由你来设计，实现由 AI 来填充。**

### 5. 大脑跟不上了 → 设计接口，委派实现

**问题**：AI 让你能产出的代码量前所未有地大，但你的大脑认知负荷也前所未有地高——你需要理解所有代码。

**解决方案**：把深度模块当作**灰盒**来用。
- 你设计接口并理解模块的用途
- 实现细节不必逐行审查（非关键模块）
- 在模块边界上用测试验证行为
- AI 管模块内部，你管模块之间的结构

**来源**：Kent Beck — "**每天投资系统设计**"（Invest in the design of the system every day）。specs-to-code 的本质是**撤资设计**——放弃对设计的掌控。而正确的做法是每天都在设计上投入。

## 核心洞察

### 代码不便宜，坏代码最贵

> "If you have a codebase that's hard to change, you're not able to take all of the bounty that AI can offer."

在好的代码库里，AI 如鱼得水。在烂的代码库里，AI 加速制造更多烂代码。软件基础**不是被 AI 淘汰了，而是被 AI 放大了**——好代码库和坏代码库的差距被 AI 急剧拉大。

### 你是战略层，AI 是战术层

> "Think about AI as a really great on-the-ground programmer, a tactical programmer, a sergeant on the ground. You need someone thinking on the strategic level. And that's you."

AI 是执行力极强的地面部队，但**战略决策必须由你来**——模块怎么划分、接口怎么设计、什么该测、什么可以委派。这些决策依赖的是 20 年以上的软件工程基本功。

## 与我自己的关联

### Claude Code 工作流优化

Matt 的"Grill Me" Skill 直接可用：在开始一个任务前，让 AI 反复追问直到达成共享理解，而非急于生成计划文档。这个模式可以加入 Claude Code 的日常使用习惯中。

### Java 后端的深度模块实践

Spring Boot 项目的 Service 层本身就在鼓励深度模块——Controller 暴露简单接口（REST API），Service 封装复杂业务逻辑。关键意识是：**接口自己设计好，Service 内部实现可以更放心地交给 AI**。

### TDD 的重新审视

之前项目（苍穹外卖、天机学堂）没有系统使用 TDD。Matt 的论点不是"TDD 是好的工程实践"，而是**"TDD 是控制 AI 输出质量的关键机制"**——这给了 TDD 一个全新的、AI 时代特有的理由。

### DDD 通用语言

如果你入职格力后参与 WMS/WCS 系统，仓储物流领域有大量专有术语（入库、上架、拣货、波次、库位……）。和 AI 协作前先建立一份通用语言文件，可能是提升 AI 理解准确度的关键步骤。

## 相关笔记

- [[Harness Engineering——人类掌舵 Agent 执行]] — 同样讨论人类掌舵 + AI 执行的范式
- [[AI编码全流程工作流——Matt Pocock 工作坊]] — Matt 另一场工作坊：从需求到部署的完整六阶段 AI 编码实操流程
- [[Claude Code Skills 与 MCP 精华笔记]] — Skills 机制和最佳实践
- [[2026年学编程路线与Agentic Engineering]] — AI 时代编程范式演进
- [[AI时代软件开发职业方向]] — AI 时代程序员的职业选择
- [[《设计数据密集型应用2》DDIA2]] — 系统设计基础
- [[设计模式 - SOLID、创建型、结构型、行为型]] — 软件设计原则
