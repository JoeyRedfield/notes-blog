---
tags: [note]
created: 2026-11-02
updated: 2026-11-02
---

# Lost in the Middle 触发条件与上下文管理

> [!note]
> 这是模型注意力位置偏置的通用机制，不是某个 harness 的 bug。Claude Code 和 DSH 跑同一个模型时，基线风险相同；harness 只能通过上下文编排缓解或放大。

## 一句话

关键信息放在长上下文的中间时，模型利用率明显低于开头和结尾；触发条件是「长上下文 + 关键信息在中间 + 需要跨中间聚合」，没有一个统一的 token 阈值。

## 典型触发条件

1. **上下文变长，关键信息落在中间 1/3**。经验上几千到几万 token 就可能开始，约到有效窗口的 30%–50% 后更明显；1M 窗口只是把「中间」拉长，不是解药。
2. **中间有大量相似或干扰内容**：多个文件、多个候选方案、重复日志、近似文档。模型容易拿中间的相似内容凑答案。
3. **任务要跨中间多处信息聚合/多跳**：比较、计数、满足多条约束、跨文件追踪调用链。单点查找不容易翻车，聚合类最容易。
4. **一长串约束，中间那条被漏**：尤其否定约束（「不要动 X」「不要改表结构」）。编号列表越长，中间项越容易被跳过。
5. **多轮对话把早期约定推到中间**：几十轮工具输出后，最初的接口约定已不在近因区；auto-compact 后细节进一步丢。
6. **大段粘贴或检索**：答案埋在材料中间；RAG 里正确 chunk 排在 top-K 中间。

## 不太会触发的场景

- 几 K 以内的短上下文。
- 目标在开头或结尾。
- 只依赖单一明显信息。
- 纯全文摘要类任务（需要全读，但细节精度仍会掉）。

## AI 编码场景的落点

- 长会话里大量 Read/日志/SQL 输出，把 CLAUDE.md/AGENTS.md 的约定推到中间。
- 项目约定文件写太长，中段约定失效。
- 一次把整个 `docs/` 或表结构塞进去，中间的表/字段被忽略。
- 多约束任务（「改 A、删 B、别动 C」）中间那条漏。

## 怎么判断是否触发

- 同一句指令分别放开头/中间/结尾跑三次，看中间是否漏。
- 让模型先复述所有约束，看漏哪条。
- 逐步截断上下文，找性能拐点。

## 防护

- 关键约束开头和结尾各放一次；最重要的检查项放最后一句。
- 长材料按需检索（codegraph/grep/Read offset），别整段倒。
- 约束编号、显式列成清单，别埋在大段叙述里。
- 长任务分段、结论写回文件、新会话续。
- compact 后重新注入关键事实。
- harness 层：DSH 可用插件把记忆注入每步末尾（近因位），但注入太多会挤占近因位；Claude Code 靠 compact/subagent 隔离上下文。

## 来源

- Liu et al., "Lost in the Middle: How Language Models Use Long Contexts", TACL 2024：https://arxiv.org/abs/2307.03172
- Chroma, "Context Rot: How Increasing Input Tokens Impacts LLM Performance", 2025：https://research.trychroma.com/context-rot
- 实操结论来自 2026-11-02 与 Claude Code + DeepSeek / DSH 的讨论，未做双端长上下文实测；具体偏置强度需用自己的长任务验证。

## 相关笔记

- [[Generative-Software-Engineering-NJU/02-提示词工程（NJU）——固定材料回归新版]]
- [[Claude Code 记忆系统——与 CLAUDE.md 的区别及构建方法]]
- [[Claude Code 与 DSH（DeepSeek Harness）选型与迁移]]
