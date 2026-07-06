---
title: "Harness Engineering 腾讯实践案例——从 AI 写得快到干得稳"
created: 2026-06-29
updated: 2026-06-29
tags:
  - ai相关
  - agent
  - harness
  - ai-coding
source: "https://mp.weixin.qq.com/s/uhc7_-0Vm_cw9p17b9VyJA"
author: "腾讯程序员 / 腾讯技术工程"
raw: "[[开启Harness Engineering探索之旅]]"
source_type: community-snapshot
---

# Harness Engineering 腾讯实践案例：从 AI 写得快到干得稳

> [!note]
> 这是一篇腾讯团队的实践案例笔记，不是 Harness Engineering 的标准定义页。概念定义与行业框架优先看 [[AI Harness（驾驭层）知识手册]]，OpenAI 工程实践优先看 [[Harness Engineering——人类掌舵 Agent 执行]]。

![[assets/harness-engineering-tencent/00-opening-banner.gif|720]]

## 一、这篇文章解决的问题

文章的核心问题不是“AI 能不能写代码”，而是：**当 AI 写代码越来越快，为什么研发全链路没有等比例变快？**

腾讯团队给出的答案是：瓶颈从“写代码”转移到了“理解、对齐、追溯、沉淀、验证”。AI 降低了编码这一步的附属复杂度，但需求澄清、方案契约、测试验证、上线纪律和知识沉淀这些本质复杂度没有消失。

所以这篇文章的价值在于，它把 Harness Engineering 从抽象概念落到一套企业研发管线：用协议、管线、纪律、知识库和运营闭环，让 AI 不只是“出码快”，而是能在团队工程体系里“干得稳”。

![[assets/harness-engineering-tencent/01-ai-engineering-focus-shifts.webp|720]]

这张图可以作为本文的概念入口：Prompt Engineering 关心“怎么说”，Context Engineering 关心“给模型看什么”，Harness Engineering 关心“模型运行在什么工作环境里”。腾讯案例实际讨论的是第三层。

![[assets/harness-engineering-tencent/02-harness-concept-timeline.png|720]]

文章中的时间线说明：Harness Engineering 是先有一线实践，再被命名和系统化总结。读这类材料时要注意，它还不是一个完全标准化的学科名词，更像一组正在收敛的工程责任。

## 二、可复用的总框架

腾讯方案可以压缩成一个结构：

```text
AI 驱动研发全链路
├── 轨道 1：研发端到端交付
│   ├── 协议层：每一步输入输出有契约
│   ├── 管线层：P0-P6 阶段化推进
│   └── 纪律层：TDD、调试、验证、评审、评分门禁
├── 轨道 2：线上运营
│   └── 告警、取证、根因分析、修复、回归、归档
└── 长期记忆：项目知识库
    ├── 项目级 specs/
    └── 变更级 knowledge-spec/
```

这个框架对应 Harness 的三个核心目标：

| 目标  | 腾讯案例里的落地方式                               |
| --- | ---------------------------------------- |
| 可执行 | 阶段化 P0-P6 管线、SubAgent、Skill、脚本           |
| 可约束 | 模板、契约、评分卡、SQL 人工确认、Git 规范                |
| 可验证 | test-cases 同源、UI 视觉比对、API 测试自愈、部署轮询、归档对齐 |

![[assets/harness-engineering-tencent/03-ai-driven-rd-goal.png|720]]

目标图里的关键链路是：人提需求 → AI 理解 → AI 执行 → 人确认。它不是把人从研发里拿掉，而是把人的位置从“亲自做每一步”前移到“定义约束、确认关键节点、处理高风险决策”。

![[assets/harness-engineering-tencent/04-two-tracks-one-memory.png|720]]

两条轨道和长期记忆的关系是本文最重要的结构：

- 研发轨道负责上线前，把需求、设计、实现、测试、部署、归档串成固定工序。
- 运营轨道负责上线后，把告警、证据采集、根因分析、修复、回归、归档串成闭环。
- 知识库负责让两条轨道共享业务规则、接口契约、历史变更和事故经验。

## 三、研发轨道：把需求到上线做成固定工序

研发端到端交付的目标是：换一个人、换一个项目，AI 的产出质量仍然稳定、可预期。

它不是让 AI 自由发挥，而是把研发过程拆成固定工序：

| 阶段 | 作用 | 关键约束 |
| --- | --- | --- |
| P0 brainstorming | 可选前置澄清 | 先讨论边界，不急着实现 |
| P1 requirements | 固化需求口径 | TAPD 原始口径、AC 可测、test-cases 同源 |
| P2 design | 固化机器可读契约 | 接口、状态、字段、错误码、D-x 改动点 |
| P3 implementation | 按设计实现 | D2C、UI 校准、code-reviewer 三档审查 |
| P4 e2e-test | 集成测试 | 前端自动化、后端 API 测试、失败诊断 |
| P5 deploy | 部署 | Git 规范、部署状态轮询、SQL 强制确认 |
| P6 archive | 归档 | changes-sync、knowledge-sync、delta-spec |

这里最值得借鉴的是 **P1 与 P4 同源**：需求阶段就把验收标准拆成可测 case，测试阶段不再重新解释需求。这样能减少“AI 写完了，但测试并没有测真正需求”的断层。

![[assets/harness-engineering-tencent/06-pipeline-standardized-chain.png|720]]

![[assets/harness-engineering-tencent/07-pipeline-stage-cards.png|720]]

### 3.1 P1：需求口径先钉死

P1 的重点不是“让 AI 猜用户真正想要什么”，而是防止 AI 歪曲已经表达出来的需求。

| 机制 | 作用 |
| --- | --- |
| TAPD 拉取需求底稿 | 让官方需求成为 `requirements.md` 的原始口径，避免 AI 自行复述变形 |
| AC 可测 | 把验收标准写成 WHEN → THEN / SHALL 形式，禁止“性能要好”这类不可测表达 |
| `requirements.md` 与 `test-cases.md` 同源 | 需求和测试复用同一批 AC，避免 P4 再重新解释需求 |
| 双 SubAgent 串联 | 先生成澄清问题，再基于澄清后的需求生成测试用例 |

这个阶段的关键判断是：**需求不清时停下来问人，比下游返工便宜。**

### 3.2 P2：设计文档变成机器可读契约

P2 的 `design.md` 不是传统意义上的说明文，而是给 P3 实现和 code-reviewer 使用的契约。

| 契约项 | 说明 |
| --- | --- |
| 接口签名 | 输入、输出、错误码、字段必填项要写死 |
| 数据模型 | 用表格表达字段、类型、来源和约束 |
| 状态机 / 时序图 | 用 Mermaid 或结构化图示表达状态转移和调用顺序 |
| `sandbox_mode` | 前端变更是否先写沙箱目录，避免直接污染主链路 |
| D-x 改动点 | 把设计拆成 D-1 / D-2 / D-3，每个点对应文件、函数、目的和实现 |

这类设计文档的标准不是“写得优美”，而是“下游能逐项比对”。

### 3.3 P3：实现阶段用三套兜底

P3 的风险是 AI 写得快，但“对不对、像不像、稳不稳”都需要额外机制兜住。

![[assets/harness-engineering-tencent/08-d2c-ui-implementation-flow.png|720]]

前端 D2C 被拆成三个 Skill：获取 Figma 与资源、本地化重构、UI 校准。这里的启发是：不要让 AI 从设计图一步到位生成最终代码，而是插入结构化中间产物和校准闭环。

![[assets/harness-engineering-tencent/09-ui-calibration-loop.png|720]]

UI 校准把“像不像”变成像素差异 + SSIM 双指标。任何一项低于 95% 就触发最多 5 轮局部修复，耗尽后交给人判断是否继续。

后端 code-reviewer 则按三档输出：

| 等级 | 含义 | 处理方式 |
| --- | --- | --- |
| Critical | 契约违反、接口签名不一致、错误码缺失 | 必修，且需要人审和留痕 |
| Important | 可绕过但有偏差 | 必须标记已知偏差和原因 |
| Suggestion | 命名、风格、注释等 | 自由处置 |

这个分级避免把所有 review 意见都当成同等紧急，也避免 AI 被低价值建议拖住。

### 3.4 P4：测试失败后要能自动回溯

![[assets/harness-engineering-tencent/10-p4-integration-testing.png|720]]

P4 的重点不是“跑测试”，而是“测试失败以后能不能不靠人手工排查”。

| 场景 | 做法 |
| --- | --- |
| Web 前端 | Playwright 跑端到端用例并截图 |
| 小程序 | 小程序自动化 + 真机云测 |
| 后端 API | 从 API 测试用例生成 Node.js 测试脚本 |
| API 失败诊断 | trace-id → CLS 日志 → MySQL 数据行 → Redis key 状态 |

失败诊断报告会回传给 implementation Agent 修复，再自动重跑失败 case。同一用例多轮诊断仍不通过时才升级人工。

### 3.5 P5：部署阶段宁可慢，不可错

![[assets/harness-engineering-tencent/11-p5-deploy-scorecard.png|720]]

P5 体现的是高风险动作的人机边界：AI 可以准备步骤、解析任务、轮询状态，但数据库 DDL / DML 这类动作必须人工确认。

| 端 | 关键约束 |
| --- | --- |
| 前端 | commit message 规范、测试环境部署、状态轮询、`deploy.md` 落盘 |
| 后端 | 解析 `deploy.md` 任务列表、流水线发布、失败拉取 K8s 日志 |
| 数据库 | SQL diff 必须用户显式 yes/no，AI 不自动执行 |

### 3.6 P6：归档是复利，不是收尾杂活

![[assets/harness-engineering-tencent/12-p6-archive-state-markdown.png|720]]

P6 的三件套让一次交付变成下一次 AI 的可用上下文：

| 动作 | 目的 |
| --- | --- |
| changes-sync | 实际 git 改动和 design / planning 对齐 |
| knowledge-sync | 把复用规则、坑点、约定沉淀进 specs |
| specs-generator | 基于 `delta-spec.md` 增量合并，避免知识库膨胀 |

## 四、协议层：AI 协作必须靠契约，不靠默契

文章反复强调“契约”这一层：人和人之间可以靠默契补全背景，但人和 AI 协作必须把隐性约束显式化。

![[assets/harness-engineering-tencent/05-protocol-layer-contract.png|720]]

协议层主要解决四件事：

| 约束 | 含义 |
| --- | --- |
| 标准模板 | 每一步必须产出固定格式文档 |
| 机器校验 | 文档写完后能自动检查是否达标 |
| 增量历史 | 每次变更保留 diff 和历史，不覆盖事实 |
| 下游复用 | P2/P3/P4/P6 都读同一份契约，不各自再解释一遍 |

这和 [[Harness Engineering——人类掌舵 Agent 执行]] 中“把非功能性需求写成 Agent 能看到的规则”是一致的，只是腾讯案例更偏企业研发流程。

## 五、纪律层：针对 AI 的偷懒模式设门禁

文章对 AI Coding 的一个判断很实际：AI 容易跳过测试、猜测修复、没验证就说完成、自己给自己打高分。

对应的纪律防线是：

| AI 易犯问题 | 防线 |
| --- | --- |
| 跳过测试直接写代码 | TDD 或测试先行 |
| 遇到 bug 猜修法 | 系统化调试与根因分析 |
| 没有证据就宣称完成 | verification 门禁 |
| 实现偏离设计 | code-reviewer 对照 design 契约 |
| 自评偏高 | 独立 evaluation 评分 |

这条原则可以概括为：**不要相信 AI 单点输出，要相信“输出 + 验证 + 记录”的闭环。**

![[assets/harness-engineering-tencent/15-discipline-layer-gates.png|720]]

## 六、可观测性：信任 AI 的工程前提

腾讯方案把可观测性拆成三层：

| 维度 | 要回答的问题 | 典型产物 |
| --- | --- | --- |
| 可追踪 | AI 到底做了什么？ | `.phase-metrics.jsonl`、`evaluation.md`、Report API payload |
| 可回溯 | 失败后怎么定位根因？ | trace-id、日志、MySQL、Redis、诊断报告 |
| 可度量 | 这套体系值不值？ | token、成本、耗时、失败率、代码改动量 |

这和 arXiv 论文《AI Harness Engineering: A Runtime Substrate for Foundation-Model Software Agents》里对 Harness 的描述相互印证：Harness 不只管理工具和上下文，还要管理任务状态、可观测性、失败归因、验证、权限和人工介入记录。

![[assets/harness-engineering-tencent/13-observability-three-dimensions.png|720]]

三层可观测性对应三种信任问题：

- 可追踪：不要相信“我做完了”，要有阶段记录、产物和评分。
- 可回溯：失败时能从 trace、日志、数据状态反推根因。
- 可度量：把效果和成本从感觉变成 token、耗时、失败率、重试次数、改动量。

![[assets/harness-engineering-tencent/14-cost-metrics-hook-events.png|720]]

这里尤其值得注意 token 双层结算：SubAgent 不是免费的上下文压缩器，它只是把上下文和 token 账单挪到了另一处。所有 SubAgent 都应优先读 diff 和关键片段，避免默认读全仓、读全文件。

## 七、知识库：把一次交付变成下一次的上下文

文章里的知识库不是“文档归档”，而是 AI 的长期记忆。它分两类：

| 类型 | 内容 | 粒度 |
| --- | --- | --- |
| 项目级 `specs/` | 业务规则、技术架构、接口契约、术语表 | 产品或服务 |
| 变更级 `knowledge-spec/` | 本次需求的 requirements、design、planning、test-cases、delta-spec、archive | change |

关键做法是 P6 强制归档：

1. `changes-sync`：让实际 git 改动和设计文档对齐。
2. `knowledge-sync`：提炼可复用规则、坑点、契约。
3. `specs-generator`：按 `delta-spec.md` 增量合并，避免知识库膨胀。

这对当前 Obsidian 笔记库也有启发：`raw/` 只保存源材料，wiki 页负责提炼结构，索引和日志负责让后续检索可追溯。

![[assets/harness-engineering-tencent/17-knowledge-context-injection.png|720]]

知识库运行时不是“全量塞给模型”，而是先看 `index.md`，再跳到相关 spec，最后只读必要片段。这一点和本库的 LLM Wiki 工作流一致：索引不是装饰，而是控制上下文成本和提高命中率的入口。

![[assets/harness-engineering-tencent/18-knowledge-five-directory-layers.png|720]]

![[assets/harness-engineering-tencent/19-knowledge-directory-structure.png|720]]

文章给出的项目知识库依赖方向是：

```text
business/  -> frontend/、backend/
common/    -> 由协议派生，不反向依赖实现
changes/   -> 可引用 business/frontend/backend/common
archives/、issues/ -> 辅助记录
```

这个结构的核心不是目录名，而是 **单向依赖 + 单一事实来源**。改业务规则只动 business，改接口契约只动 common，changes 记录演进但不反向污染上层事实。

## 八、线上运营轨道：Harness 不只服务上线前

研发管线处理“人提需求，AI 执行”；线上运营处理“系统告警，AI 响应”。

![[assets/harness-engineering-tencent/16-online-operations-track.png|720]]

运营轨道可以抽象成七步：

1. 告警或巡检触发。
2. 清洗与合并同源告警。
3. 采集 trace、日志、数据库、缓存、变更记录。
4. 形成“假设 + 证据 + 影响面”的根因分析。
5. 低风险问题由 AI 出 PR，高风险问题必须人工签字。
6. 对原失败 case 做回归验证。
7. 把故障原因、修复方式、复现场景归档进知识库。

这说明 Harness 的边界不止是 coding agent，而是覆盖“开发态 + 运营态”的工程控制系统。

线上运营轨道和研发轨道的区别在于输入入口不同：

| 轨道 | 输入 | 节奏 | 人工介入点 |
| --- | --- | --- | --- |
| 研发轨道 | 人提出需求 | 主动计划式 | 需求确认、方案确认、高风险部署 |
| 运营轨道 | 告警或巡检 | 被动响应式 | 高风险修复、灰度策略、回滚决策 |

两者共享知识库、trace 检索 SOP 和评分门槛，才不会变成两套割裂系统。

## 九、四条工程原则

文章最后沉淀的四条原则可以作为个人或团队的 Harness 检查清单：

| 原则 | 可执行解释 |
| --- | --- |
| 追求确定性，而不是自由发挥 | 用 Fixed Flow、模板、门禁和状态文件约束长链路 |
| 控制上下文 | 规则固化到文件，按需读取，避免一次性塞满全仓 |
| 优化 token 成本 | 按任务选模型、控制上下文、必要时新开 session |
| 确定性过程脚本化 | 能用脚本稳定完成的事，不要反复消耗 AI 推理 |

最重要的一句是：**确定的事用脚本，不确定的事用 AI。**

## 十、对个人和小团队的迁移建议

不要一开始照搬腾讯的全链路 SpecWorker。更务实的路径是按成本从低到高迁移：

1. 在项目根目录维护 `AGENTS.md` / `CLAUDE.md`，把反复纠正的问题写进去。
2. 需求阶段强制写可测 AC，最好同步生成测试用例草案。
3. 设计阶段把接口、状态、错误码写成表格或 Mermaid，而不是只写叙述文。
4. 完成前必须跑验证命令，并把输出证据写进交付说明。
5. 每次踩坑后补一条规则、脚本或检查项，而不是下次继续靠人工提醒。
6. 对重复出现的问题，再考虑 reviewer agent、hook、CI gate 或专门 skill。

这个顺序符合 Mitchell Hashimoto 对 harness engineering 的实践建议：看到 Agent 犯同类错误后，用工程机制让它之后不要再犯。

更具体地说，可以从最小可行版本开始：

| 目标 | 最小做法 | 之后再升级 |
| --- | --- | --- |
| 需求不跑偏 | PRD 里强制写 AC 和反例 | 生成同源 test-cases |
| 设计不漂移 | 写接口表、状态表、错误码表 | 让 reviewer agent 对照设计审查 |
| 完成不靠嘴 | 交付说明必须贴验证命令和结果 | CI / hook 自动拦截 |
| 经验不丢 | 每次踩坑补一条项目规则 | 周期性 knowledge-sync |
| 成本不爆 | 先读索引，再读相关文件 | SubAgent 默认只读 diff |

## 十一、与已有笔记的关系

- [[AI Harness（驾驭层）知识手册]] — 概念定义、行业框架、H0-H3 成熟度。
- [[Harness Engineering——人类掌舵 Agent 执行]] — OpenAI 工程师 Ryan Lopopolo 视角，强调人类掌舵、Agent 执行、规则注入。
- [[Harness Eval——把工作流评测变成一场考试]] — 同为腾讯技术工程案例，聚焦评测系统；本文聚焦研发全链路 Harness。
- [[Claude Code Dynamic Workflows 动态工作流]] — 官方动态工作流机制，可与本文的固定管线形成对照。
- [[Loop Engineering]] — 更上层的自主循环设计，本文属于单次研发/运营闭环的工程化实践。

## 十二、来源与核实

- 原始材料：[[开启Harness Engineering探索之旅]]，腾讯程序员 / 腾讯技术工程，2026-06-29。
- 外部概念来源：[Mitchell Hashimoto - My AI Adoption Journey](https://mitchellh.com/writing/my-ai-adoption-journey)，2026-02-05，提出将反复出现的 Agent 错误固化为 harness 工程机制。
- 学术框架：[AI Harness Engineering: A Runtime Substrate for Foundation-Model Software Agents](https://arxiv.org/abs/2605.13357)，2026-05-13，提出 model-harness-environment 视角和 H0-H3 梯度。

> [!warning]
> 文章中的 SpecWorker、TAPD、CLS、内部 SubAgent 名称和 95 分门禁属于腾讯团队的工程实现细节。迁移时应抽象为“阶段契约、自动校验、失败回溯、人工确认、归档复利”，而不是照抄工具名。

## 十三、本地图片资产

图片已保存到 `assets/harness-engineering-tencent/`，正文优先嵌入了对理解 Harness 结构有帮助的图。末尾公众号宣传图也已保存，但不嵌入正文。

| 文件 | 内容 |
| --- | --- |
| `00-opening-banner.gif` | 文章开头动图 |
| `01-ai-engineering-focus-shifts.webp` | Prompt → Context → Harness 关注点迁移 |
| `02-harness-concept-timeline.png` | Harness Engineering 概念结晶时间线 |
| `03-ai-driven-rd-goal.png` | AI 驱动研发全链路目标 |
| `04-two-tracks-one-memory.png` | 2 条轨道 + 1 个长期记忆 |
| `05-protocol-layer-contract.png` | 协议层：输入输出契约 |
| `06-pipeline-standardized-chain.png` | 管线层：需求到上线链路 |
| `07-pipeline-stage-cards.png` | P1-P6 阶段能力卡片 |
| `08-d2c-ui-implementation-flow.png` | 前端 D2C 实现流程 |
| `09-ui-calibration-loop.png` | UI 校准自愈闭环 |
| `10-p4-integration-testing.png` | P4 集成测试双流程 |
| `11-p5-deploy-scorecard.png` | P5 部署评分卡 |
| `12-p6-archive-state-markdown.png` | P6 归档与 Markdown 状态管理 |
| `13-observability-three-dimensions.png` | 可追踪、可回溯、可度量 |
| `14-cost-metrics-hook-events.png` | 成本与 hook_events 汇聚 |
| `15-discipline-layer-gates.png` | 纪律层门禁 |
| `16-online-operations-track.png` | 线上运营轨道 |
| `17-knowledge-context-injection.png` | 上下文注入与两级查找 |
| `18-knowledge-five-directory-layers.png` | 知识库五类目录分层 |
| `19-knowledge-directory-structure.png` | 知识库目录结构 |
| `20-tga-promo.jpg` | 文末 TGA 推广图 |
| `22-qr-follow.png` | 文末公众号关注图 |
