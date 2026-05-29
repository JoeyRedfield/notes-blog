---
title: "Claude Code Skills 与 MCP 精华笔记"
source: "https://juejin.cn/post/7620060655607857178"
author:
  - "[[蝎子莱莱爱打怪]]"
published: 2026-03-23
created: 2026-05-23
description: "32 个 Skills + 8 个 MCP 的精华梳理，含核心概念、分类速查、关键命令和推荐安装顺序。"
tags:
  - "clippings"
  - "claude-code"
  - "skills"
  - "mcp"
---

# Claude Code Skills 与 MCP 精华笔记

> 原文：[[别再裸用 Claude Code 了！32 个亲测Skills + 8 个 MCP，开发效率直接拉满！]]

---

## 一、核心概念：Skills vs MCP

| 维度 | Skills | MCP |
|------|--------|-----|
| 本质 | 封装的提示词 / 标准化工作流 | 本地运行的工具 / API 服务 |
| 一句话 | 让 AI **更聪明**（懂怎么干） | 让 AI **更能干**（真能去干） |
| 安装方式 | `npx skills add <名称> -y -g` | 编辑 `~/.claude/mcp.json` |
| 运行位置 | 大模型内部 | 本地独立进程 |
| 访问外部 | 不支持 | 支持（文件系统、浏览器、API） |
| 额外依赖 | 仅需 Node 环境 | 部分需要 API Key |

**要点**：Skills 和 MCP 是互补关系，搭配使用才能最大化 Claude Code 能力。大多数能力会自动触发，无需手动调用。

---

## 二、关键命令

```bash
# Skills
npx skills find <关键词>          # 搜索技能
npx skills add <owner/repo@名称> -y -g  # 安装技能
npx skills list -g                # 查看已安装
npx skills check                  # 检查更新
npx skills update                 # 更新全部

# 已安装技能路径
ls ~/.claude/skills/
```

```jsonc
// MCP 配置文件位置
// 全局：~/.claude/mcp.json
// 项目级：项目根目录/.mcp.json

{
  "mcpServers": {
    "服务器名称": {
      "command": "执行命令",
      "args": ["参数"],
      "env": { "KEY": "VALUE" }
    }
  }
}
```

---

## 三、32 个 Skills 分类速查

### 必装入口（1）

| 技能 | 用途 | 安装量 |
|------|------|:---:|
| **find-skills** | 技能市场搜索引擎 | 159.6K |

### 前端开发（9）

| 技能 | 用途 | 安装量 |
|------|------|:---:|
| **frontend-design** | 网页/Dashboard/落地页设计 | 52.7K |
| **web-artifacts-builder** | 复杂 SPA 构建 | - |
| **canvas-design** | 架构图/流程图生成 | 6.1K |
| **theme-factory** | 主题美化与视觉统一 | - |
| **vercel-react-best-practices** | React 开发最佳实践（Vercel 官方） | 109.8K |
| **web-design-guidelines** | 网页设计规范（Vercel 官方） | 83.1K |
| **vercel-composition-patterns** | 组件组合模式 | 29.7K |
| **shadcn** | shadcn/ui 专属支持 | - |
| **vercel-react-native-skills** | React Native 开发指导 | 21.6K |

### 文档与办公（6）

| 技能 | 用途 | 安装量 |
|------|------|:---:|
| **technical-writer** | README/API 文档/技术教程 | - |
| **doc-coauthoring** | 技术方案/RFC/设计文档 | - |
| **docx** | Word 创建/编辑/格式转换 | 8.6K |
| **pptx** | PPT 生成与编辑 | 9.2K |
| **pdf** | PDF 合并/拆分/OCR/水印 | 11.1K |
| **xlsx** | Excel 数据处理/图表生成 | 8.6K |

### 架构与代码质量（5）

| 技能 | 用途 |
|------|------|
| **planning-with-files** | 任务拆解 + 进度文件 + **会话恢复** |
| **project-planner** | 需求文档 + 架构设计 + 分阶段计划 |
| **architecture-patterns** | 架构模式推荐 |
| **architecture-decision-records** | ADR 架构决策记录 |
| **requesting-code-review** | 专业代码审查 |

### 记忆管理（3）

| 技能 | 用途 |
|------|------|
| **memory-intake** | 经验/踩坑记录/项目规范存入记忆库 |
| **memory-audit** | 记忆库健康检查，清理过期内容 |
| **memory-evolution** | 记忆库优化，精简冗余，整理关联 |

### 测试（2）

| 技能 | 用途 | 安装量 |
|------|------|:---:|
| **webapp-testing** | Playwright E2E 测试生成 | 7.6K |
| **test-driven-development** | TDD 红绿重构引导 | 6.5K |

### 开发提效（4）

| 技能 | 用途 | 安装量 |
|------|------|:---:|
| **brainstorming** | 技术问题多角度头脑风暴 | 13.4K |
| **systematic-debugging** | 结构化 bug 排查与根因定位 | 7.5K |
| **writing-plans** | 任务拆解 + 实施计划生成 | 6.4K |
| **executing-plans** | 按计划执行 + 进度追踪 | - |

### 其他（2）

| 技能 | 用途 | 安装量 |
|------|------|:---:|
| **audit-website** | 网站安全漏洞扫描 | 15.3K |
| **skill-creator** | 自定义技能创建 | 26.1K |

---

## 四、8 个 MCP 服务器速查

| MCP | 核心功能 | 需 API Key |
|-----|---------|:---:|
| **neural-memory** | 跨会话神经网络记忆系统 | ❌ |
| **playwright** | 浏览器自动化、E2E 测试 | ❌ |
| **filesystem** | 本地文件系统批量读写 | ❌ |
| **sequential-thinking** | 链式推理、复杂问题拆解 | ❌ |
| **web_reader** | 网页抓取 → Markdown | ❌ |
| **figma-developer-mcp** | Figma 设计稿读取 → 代码生成 | ✅ Figma Token |
| **supercharged-figma** | Figma 画布实时编辑 | ❌（需插件） |
| **4_5v_mcp** | AI 图片分析、UI 组件识别 | ⚠️ |

### 关键配置示例

```json
// neural-memory —— 跨会话记忆（最推荐）
{ "neural-memory": { "command": "neural-memory", "args": ["--mcp"] } }

// playwright —— 浏览器自动化
{ "playwright": { "command": "npx", "args": ["-y", "@playwright/mcp@latest"] } }

// filesystem —— 文件系统访问（仅授权工作区！）
{ "filesystem": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-filesystem", "/你的工作区路径"] } }

// sequential-thinking —— 链式推理
{ "sequential-thinking": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"] } }

// web_reader —— 网页抓取
{ "web_reader": { "command": "npx", "args": ["-y", "web-reader-mcp"] } }
```

---

## 五、踩坑避雷

1. **技能必须 `-g` 全局安装**，否则 Claude Code 不识别
2. **安装/配置后必须重启 Claude Code**，完全退出再打开
3. **不要一次装超过 20 个技能**，会增加上下文负担，拖慢响应
4. **MCP 配置前校验 JSON 格式**，逗号/括号不闭合直接失效
5. **filesystem MCP 严禁开放根目录**，只授权工作区路径
6. **API Key 不要提交到 Git**，仅保留在本地配置文件
7. **更新技能前先关闭 Claude Code**，避免文件占用

---

## 六、推荐安装顺序

### 第一步：安装入口技能

```bash
npx skills add find-skills -y -g
```

装上"应用商店"，后续搜技能不用去网页翻。

### 第二步：安装新手核心包（8 个）

```bash
# 前端设计
npx skills add frontend-design -y -g

# 文档处理
npx skills add technical-writer -y -g
npx skills add pdf -y -g

# 代码审查
npx skills add obra/superpowers@requesting-code-review -y -g

# 开发提效
npx skills add obra/superpowers@brainstorming -y -g
npx skills add obra/superpowers@systematic-debugging -y -g

# 任务规划（可会话恢复，很重要）
npx skills add planning-with-files -y -g
```

### 第三步：配置 MCP 核心（2 个）

编辑 `~/.claude/mcp.json`：

```json
{
  "mcpServers": {
    "neural-memory": {
      "command": "neural-memory",
      "args": ["--mcp"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

> `neural-memory` 需先 `pip install neural-memory`。

### 第四步：按场景补充

- **前端为主** → 加装 `web-artifacts-builder`、`canvas-design`、`vercel-react-best-practices`、`theme-factory`
- **文档为主** → 加装 `docx`、`pptx`、`xlsx`、`doc-coauthoring`
- **后端/架构** → 加装 `architecture-patterns`、`architecture-decision-records`、`project-planner`
- **测试需求** → 加装 `webapp-testing`、`test-driven-development`，MCP 加装 `playwright`
- **设计联动** → MCP 加装 `figma-developer-mcp` 或 `supercharged-figma`

### 第五步：进阶

- 用 **memory-intake / memory-audit / memory-evolution** 建立长期记忆体系
- 用 **skill-creator** 封装自己的专属工作流
- 用 **writing-plans + executing-plans** 实现复杂项目的全流程管控
