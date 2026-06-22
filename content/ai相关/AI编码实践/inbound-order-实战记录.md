---
tags: [ai-coding, practice-record, tdd]
created: 2026-06-03
project: inbound-order
source_type: experimental-observation
---

# 入库单管理系统——AI 编码全流程实战记录

> 2026-06-03 实战练习。从一条模糊需求出发，完整走完 Grill Me → PRD → Issues → TDD 实现 → 人工审查五阶段。

## 项目概要

- **需求**：Spring Boot 入库单管理 REST API
- **技术栈**：Spring Boot 3.3 + MyBatis + H2
- **项目路径**：`/Users/wuzhuoyi/Desktop/code/inbound-order`
- **测试结果**：10/10 通过

## 实战流程

### Phase 1：Grill Me（6 个问题）

从"入库单管理"四个字开始，AI 逐一追问了以下决策点：

1. 状态生命周期：草稿 → 已提交 → 收货中 → 已完成 / 已取消
2. 数据模型：主表 11 字段 + 明细表 6 字段
3. 接口范围：6 个（创建/编辑/提交/列表/详情/取消），收获和完成暂不放入
4. 异常策略：唯一索引 + 友好错误码，不做幂等，不做物理删除
5. 响应格式：统一 `{code, message, data}`
6. 测试策略：H2 + @SpringBootTest 集成测试

### Phase 2：PRD

产出结构化 PRD（[[inbound-order-PRD]]），定义完整的 Problem Statement、User Stories、Implementation Decisions、Testing Decisions、Out of Scope。

### Phase 3：切分 Issues

5 个垂直切片，DAG 依赖：

```
Issue 1 (HITL) 🎯 项目骨架 + 创建接口
   ├── Issue 2 [AFK] 查询详情
   ├── Issue 3 [AFK] 编辑（含状态校验）
   ├── Issue 4 [AFK] 分页列表（含筛选）
   └── Issue 5 [AFK] 提交 + 取消（状态流转）
```

Issue 1 手工确认骨架后，2-5 均可 AFK。

### Phase 4：TDD 实现

每轮先写测试（红），再写实现（绿），验证后再进入下一个 Issue：

| 轮次 | Issue | 测试覆盖 |
|------|-------|---------|
| 1 | 创建 | 正常创建含明细、空明细校验 → 40000 |
| 2 | 详情 | 查询成功、不存在 → 40401 |
| 3 | 编辑 | 草稿可编辑、已提交拒绝 → 40002 |
| 4 | 列表 | 分页、按仓库筛选 |
| 5 | 流转 | 提交（仅草稿）、取消草稿、取消已提交 |

**遇到的坑**：`jakarta.validation` 需要额外引入 `spring-boot-starter-validation`；DTO 的 `@NotEmpty` 返回 40000 而非自定义 40001，统一交给 `@Valid` 处理。

### Phase 5：人工审查

用户审视 `OrderStatus.canCancel()` 的实现逻辑（`DRAFT || SUBMITTED`），确认符合设计意图后通过。

## 最终交付

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/inbound-orders` | POST | 创建（含明细，初始草稿） |
| `/api/inbound-orders` | GET | 分页列表（状态/仓库/供应商筛选） |
| `/api/inbound-orders/{id}` | GET | 详情（含明细） |
| `/api/inbound-orders/{id}` | PUT | 编辑（仅草稿） |
| `/api/inbound-orders/{id}/submit` | PUT | 提交（草稿→已提交） |
| `/api/inbound-orders/{id}/cancel` | PUT | 取消（草稿/已提交→已取消） |

## 关键收获

1. **Grill Me 的价值**：4 个字的需求变成了 6 个明确的设计决策，后续实现几乎没有返工
2. **垂直切片 vs 水平分层**：每个 Issue 都跨全链路，完成后立即可验证
3. **TDD 对 AI 编码的控制**：先写测试 = 先定义"什么叫完成"，AI 不能走捷径
4. **深度模块实践**：Controller 定义接口契约（REST 端点 + 校验），Service 封装业务逻辑（状态机 + 事务），Mapper 只管数据访问——边界清晰

## 相关笔记

- [[三角循环——AI编码核心概念内化记录]] — 五大知识点内化过程
- [[软件基础在AI时代更重要——Matt Pocock]] — 五大失败模式与解药
- [[AI编码全流程工作流——Matt Pocock 工作坊]] — 六阶段实操流程
- [[inbound-order-PRD]] — 本项目的 PRD 文档
- [[AI编码能力提升路线]] — 六大 AI 编码提升方向
