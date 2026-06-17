---
tags: [index]
source: "https://github.com/LienJack/learn-agent"
author: LienJack
created: 2026-06-17
---

# learn-agent 系列

来自 [LienJack/learn-agent](https://github.com/LienJack/learn-agent) 的技术博客，用工程师视角系统学习 AI Agent、Claude Code 源码、数据库、Redis 和系统设计。

## 系列索引

### 概念介绍

从 LLM 基础到 Agent、Harness 的演进路径。

- [[概念介绍/00.系列导读]] — 阅读路径总览
- [[概念介绍/01.LLM的原理]] — LLM 到底在做什么
- [[概念介绍/02.如何让LLM更聪明]] — Prompt、Context、RAG 是什么
- [[概念介绍/03.从对话到干活-Agent]] — Agent、Tools、Function Calling、MCP、Skill
- [[概念介绍/04.如何让Agent更好干活-Harness]] — 从聊天模型到 Agent Harness
- [[概念介绍/05.OpenClaw、Hermes和Harness关系]] — 三者分层关系
- [[概念介绍/06.历史进程]] — LLM 到 Agent Harness 演进时间线

### RAG 全流程

- [[RAG/01.整体步骤]] — RAG 完整流程概览
- [[RAG/02.数据导入]] — 数据源接入与预处理
- [[RAG/03.分块技术]] — 文本分块策略
- [[RAG/04.向量嵌入与向量数据库]] — 嵌入模型与向量存储
- [[RAG/05.检索前置处理]] — 查询改写与扩展
- [[RAG/06.索引优化]] — 索引结构与性能优化
- [[RAG/07.检索后处理]] — 结果重排序与过滤
- [[RAG/08.检验召回质量]] — 召回评估方法
- [[RAG/09.GraphRag]] — 图谱增强检索

### Claude Code 源码解析

- [[ClaudeCode源码解析/00.系列导读]] — 源码阅读路径
- [[ClaudeCode源码解析/01.工程架构]] — 总体结构
- [[ClaudeCode源码解析/02.核心机制-ReAct]] — ReAct 主循环
- [[ClaudeCode源码解析/03.核心机制-Prompt编写]] — Prompt 与系统指令
- [[ClaudeCode源码解析/04.1核心机制-Context管理]] — Context 管理
- [[ClaudeCode源码解析/04.2ContextManage（选修）]] — Context 治理进阶
- [[ClaudeCode源码解析/05.0核心机制-Tools]] — 工具系统总览
- [[ClaudeCode源码解析/05.1文件工具-文件管理]] — 文件工具
- [[ClaudeCode源码解析/05.2终端工具-命令执行]] — 终端工具
- [[ClaudeCode源码解析/05.3工作流工具-任务管理]] — 任务管理工具
- [[ClaudeCode源码解析/06.MCP]] — MCP 协议实现
- [[ClaudeCode源码解析/07.Skill]] — Skill 机制
- [[ClaudeCode源码解析/08.1Agent协作]] — 多 Agent 协作
- [[ClaudeCode源码解析/08.2业界的Agent协作（选修）]] — 业界协作方案
- [[ClaudeCode源码解析/09.1Plan]] — Plan 机制
- [[ClaudeCode源码解析/09.2业界Plan（选修）]] — 业界 Plan 方案

### Agent 设计范式

- [[Agent设计范式/00.专栏导读]] — 设计范式总览
- [[Agent设计范式/01-context-manager-attention-os]] — Context Manager：注意力操作系统
- [[Agent设计范式/02-agent-long-term-memory-self-upgrade]] — 长期记忆与自我优化
- [[Agent设计范式/03-tool-manager-action-os]] — Tool Manager：行动操作系统
- [[Agent设计范式/04-agent-team-assignment-communication]] — Agent Team 任务分配与通信
- [[Agent设计范式/05-text2sql-new-paradigm-design-v2]] — Text2SQL 新范式设计

### Build Harness

从零构建 Agent Harness 的完整教程（25 篇）。

- [[BuildHarness/build-harness]] — 系列总入口
- [[BuildHarness/00-01-agent-not-a-prompt]] — Agent 不是一句 Prompt
- [[BuildHarness/00-02-agent-components]] — Agent 组件拆解
- [[BuildHarness/00-03-chatbot-workflow-agent-harness]] — Chatbot → Workflow → Agent → Harness
- [[BuildHarness/00-04-harness-control-system]] — Harness 控制系统
- [[BuildHarness/00-05-agent-evolution-path]] — Agent 演进路径
- [[BuildHarness/00-06-handwrite-agent-meaning]] — 手写 Agent 的意义
- [[BuildHarness/00-07-llm-provider-cli-first-call]] — LLM Provider 与首次调用
- [[BuildHarness/00-08-minimal-agent-loop]] — 最小 Agent Loop
- [[BuildHarness/00-09-m0-core-kernel]] — M0 核心内核
- [[BuildHarness/00-10-intent-execution-separation]] — 意图与执行分离
- [[BuildHarness/00-11-plugin-host-core-extension]] — 插件化核心扩展
- [[BuildHarness/00-12-provider-runtime-tool-intent]] — Provider、Runtime、Tool、Intent
- [[BuildHarness/00-13-tool-runtime-observation]] — 工具运行时与观察
- [[BuildHarness/00-14-local-tool-bundle-permission-runtime]] — 本地工具、权限与运行时
- [[BuildHarness/00-15-context-policy-model-input]] — 上下文策略与模型输入
- [[BuildHarness/00-16-session-replay-event-log]] — 会话回放与事件日志
- [[BuildHarness/00-17-capability-discovery-skills-mcp]] — 能力发现：Skills 与 MCP
- [[BuildHarness/00-18-delegation-runtime-control]] — 委托与运行时控制
- [[BuildHarness/00-19-trace-analysis-agent-failures]] — Trace 分析与 Agent 失败诊断
- [[BuildHarness/00-20-memory-governance-candidate-ledger]] — 记忆治理与候选台账
- [[BuildHarness/00-21-scoped-retrieval-audit-snapshot]] — 作用域检索与审计快照
- [[BuildHarness/00-22-productized-cli-profile-extension]] — 产品化 CLI 与配置扩展
- [[BuildHarness/00-23-hosted-harness-durable-execution]] — 托管 Harness 与持久执行
- [[BuildHarness/00-24-agent-harness-terminology-map]] — Agent Harness 术语地图

### Learn LLM

从零学习 LLM 的 PyTorch 实战教程（22 篇 + 数学基础）。

- [[LearnLLM/00_course_goal_and_risk_boundary]] — 课程目标与风险边界
- [[LearnLLM/math_foundations_deep_dive]] — 数学基础深度解析
- [[LearnLLM/01_pytorch_training_loop]] — PyTorch 训练循环
- [[LearnLLM/02_tensor_shape_pytorch]] — Tensor Shape 与 PyTorch
- [[LearnLLM/03_next_token_language_modeling]] — Next Token 语言建模
- [[LearnLLM/04_tokenizer_dataset_label_masking]] — Tokenizer、数据集与标签掩码
- [[LearnLLM/05_embedding_and_similarity]] — 嵌入与相似度
- [[LearnLLM/06_bigram_to_neural_lm]] — 从 Bigram 到神经语言模型
- [[LearnLLM/07_attention_from_scratch]] — 从零实现 Attention
- [[LearnLLM/08_transformer_block]] — Transformer Block
- [[LearnLLM/09_mini_gpt]] — Mini GPT
- [[LearnLLM/10_llama_modern_block]] — LLaMA 现代 Block
- [[LearnLLM/11_huggingface_workflow]] — HuggingFace 工作流
- [[LearnLLM/12_minimum_eval_harness]] — 最小评估框架
- [[LearnLLM/13_domain_task_and_data_engineering]] — 领域任务与数据工程
- [[LearnLLM/14_rag_baseline]] — RAG 基线
- [[LearnLLM/15_sft_instruction_tuning]] — SFT 指令微调
- [[LearnLLM/16_lora_qlora]] — LoRA / QLoRA
- [[LearnLLM/17_evidence_constrained_distillation]] — 证据约束蒸馏
- [[LearnLLM/18_safety_model_card]] — 安全与模型卡
- [[LearnLLM/19_quantization_serving_release_gate]] — 量化、服务与发布门禁
- [[LearnLLM/20_legal_contract_review_project]] — 法律合同审查项目
- [[LearnLLM/21_medical_qa_assistant_project]] — 医疗问答助手项目
- [[LearnLLM/22_graduation_release_audit]] — 毕业发布与审计

## 相关笔记

- [[ai相关/README|AI 相关]] — 本目录其他 AI 笔记
- [[数据库/README|数据库]] — MySQL、PostgreSQL、Redis 笔记
- [[系统设计/README|系统设计]] — 系统设计专栏
- [[llm-from-scratch/README|LLM 从零实现]] — 原有 LLM 实现笔记

> 来源：https://github.com/LienJack/learn-agent | 整合日期：2026-06-17
