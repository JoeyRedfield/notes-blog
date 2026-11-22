---
tags: [prd, ai-coding, practice]
created: 2026-06-03
project: inbound-order
status: ready-for-agent
source_type: experimental-observation
---

# PRD：入库单管理系统（inbound-order）

## Problem Statement

仓库管理员需要创建和管理入库单——记录哪批货、从哪个供应商、入哪个仓库。当前流程依赖纸质单据或 Excel，状态不透明，容易出错。需要一个极简的入库单管理系统，覆盖创建、编辑、提交、查询、取消的完整生命周期。

## Solution

一个 Spring Boot 后端 API 系统，提供 6 个 REST 接口管理入库单及其明细行。入库单经历 草稿 → 已提交 → 收货中 → 已完成 的正向流转，异常时可取消。系统通过统一响应格式和异常处理保证调用方体验一致。

## User Stories

1. 作为仓库管理员，我想要创建一张入库单并填写预计入库的 SKU 明细，以便记录即将到货的批次
2. 作为仓库管理员，我想要编辑草稿状态的入库单（修改供应商、仓库、明细等），以便修正填写错误
3. 作为仓库管理员，我想要提交草稿入库单使其进入已提交状态，以便通知仓库准备收货
4. 作为仓库管理员，我想要按仓库、供应商、状态筛选入库单列表并分页浏览，以便快速找到目标单据
5. 作为仓库管理员，我想要查看某张入库单的完整信息（含所有明细行），以便了解具体收货要求
6. 作为仓库管理员，我想要取消一张尚未开始收货的入库单，以便处理供应商变更等异常情况
7. 作为开发者，我期望所有接口返回统一的 JSON 响应格式，以便前端/调用方统一处理
8. 作为开发者，我期望非法状态转换（如编辑已提交的单据）返回明确的错误信息，以便快速定位问题

## Implementation Decisions

### 项目基础

- Spring Boot 3.x + Java 17 + MyBatis + MySQL/H2
- 包结构：controller / service / mapper / entity / dto / enums / exception
- 无用户认证（练习项目，Out of Scope）

### 数据模型

两张表，主表 `inbound_order` + 明细表 `inbound_order_detail`。`order_no` 格式 `IN-YYYYMMDD-XXX`，数据库唯一索引防重。

### 状态机

```
草稿 ──submit──→ 已提交 ──start_receiving──→ 收货中 ──complete──→ 已完成
  │                │
  └──cancel──→ 已取消  └──cancel──→ 已取消
```

- 草稿可编辑、可提交、可取消
- 已提交可取消
- 已完成/已取消是终态，不可再变更
- 收货中→完成 的接口本 PRD 不做（Out of Scope）

### API 契约

| # | 方法 | 路径 | 说明 |
|---|------|------|------|
| 1 | POST | `/api/inbound-orders` | 创建（含明细，初始草稿） |
| 2 | PUT | `/api/inbound-orders/{id}` | 编辑（仅草稿，明细全量替换） |
| 3 | PUT | `/api/inbound-orders/{id}/submit` | 提交流转 |
| 4 | GET | `/api/inbound-orders` | 分页列表（状态/仓库/供应商筛选） |
| 5 | GET | `/api/inbound-orders/{id}` | 详情（含明细） |
| 6 | PUT | `/api/inbound-orders/{id}/cancel` | 取消流转 |

### 统一响应

```json
// 成功
{ "code": 200, "message": "success", "data": {...} }

// 分页
{ "code": 200, "message": "success", "data": { "total": 100, "page": 1, "pageSize": 20, "list": [...] } }

// 错误
{ "code": 40001, "message": "仅草稿状态可编辑", "data": null }
```

### 异常处理

- `BusinessException(code, message)` + `GlobalExceptionHandler` 统一捕获
- 状态校验异常码：40001~40005
- 资源不存在异常码：40401

## Testing Decisions

- **策略**：集成测试为主，`MockMvc` + `@SpringBootTest` + H2 内存数据库
- **切面**：HTTP 请求 → 全链路 → 验证 JSON 响应，不 mock Service/Mapper
- **覆盖**：每个接口至少 2 个用例——正常路径 + 异常路径（如非法状态转换）
- **测试标准**：只测外部行为（HTTP 响应码 + JSON 结构），不测内部实现细节

## Out of Scope

- 收货执行接口（start_receiving / complete）
- 物理删除入库单
- 入库单幂等校验
- 用户认证与权限
- 前端页面
- Docker 部署

## Further Notes

- 这是 AI 编码全流程工作流练习项目，PRD 完成后切 Issues 进入 TDD 实现
- 项目路径：`/Users/wuzhuoyi/Desktop/code/inbound-order`
- 可复用的模式：状态机校验逻辑、统一响应封装、全局异常处理——这些是制造业 CRUD 系统的通用模式
