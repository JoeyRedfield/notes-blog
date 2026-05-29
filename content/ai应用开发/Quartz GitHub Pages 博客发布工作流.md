---
title: Quartz GitHub Pages 博客发布工作流
tags:
  - blog
  - quartz
  - github-pages
  - obsidian
---

# Quartz GitHub Pages 博客发布工作流

## 目标

在不破坏本地 Obsidian vault 的前提下，把 `notes` 里允许公开的笔记同步到 Quartz 博客仓库，再发布到 GitHub Pages。

核心思路：

```text
本地 Obsidian vault 保持不动
-> 在 Quartz 仓库维护公开白名单
-> 同步白名单内容和被引用附件
-> 本地预览
-> 推送到 GitHub Pages
```

## 目录关系

```text
/Users/wuzhuoyi/Documents/notes   # 原始 Obsidian vault，不直接对外发布
/Users/wuzhuoyi/Documents/quartz  # Quartz 博客仓库，发布到 GitHub Pages
```

线上地址：

```text
https://joeyredfield.github.io/notes-blog/
```

GitHub 仓库：

```text
https://github.com/JoeyRedfield/notes-blog.git
```

当前发布分支：

```text
v5
```

## 日常发布流程

### 1. 在 Obsidian 里写笔记

正常在 `/Users/wuzhuoyi/Documents/notes` 里写，不需要改变原始 vault 结构。

只有被加入公开白名单的目录或文件，才会同步到博客仓库。

### 2. 调整公开白名单

编辑 Quartz 仓库里的配置：

```text
/Users/wuzhuoyi/Documents/quartz/publish.config.json
```

常用字段：

```json
{
  "sourceVault": "../notes",
  "contentDir": "./content",
  "reportPath": "./reports/public-sync-report.md",
  "include": ["llm-from-scratch", "设计模式"],
  "excludeFiles": [],
  "exclude": [
    ".git",
    ".obsidian",
    "个人信息",
    "日记",
    "入党相关",
    "我的投机（投资",
    "破解",
    "assets"
  ]
}
```

调整规则：

- 想公开一个目录：加到 `include`。
- 想公开一篇单独笔记：把具体 `.md` 路径加到 `include`。
- 想从已公开目录里排除某篇笔记：加到 `excludeFiles`。
- 涉及隐私、账号、认证、日记、投资、个人材料的目录：放在 `exclude`，默认不公开。

## 同步与预览

进入 Quartz 仓库：

```bash
cd /Users/wuzhuoyi/Documents/quartz
```

同步 notes 里的白名单内容：

```bash
npm run sync:notes
```

这个命令实际执行的是：

```json
"sync:notes": "node scripts/sync-public-notes.mjs"
```

同步脚本位置：

```text
/Users/wuzhuoyi/Documents/quartz/scripts/sync-public-notes.mjs
```

脚本会做这些事：

- 只复制白名单里的 Markdown。
- 跳过黑名单目录。
- 只复制公开文章实际引用到的附件。
- 生成同步报告。
- 扫描敏感词并在报告里提示 warning。

查看同步报告：

```text
/Users/wuzhuoyi/Documents/quartz/reports/public-sync-report.md
```

本地预览：

```bash
npx quartz build --serve
```

默认访问：

```text
http://localhost:8080
```

本地确认没问题后，退出预览服务：

```text
Ctrl+C
```

## 发布到 GitHub Pages

在 Quartz 仓库执行：

```bash
npx quartz sync
```

它会构建站点，并把内容同步推送到 GitHub 仓库。GitHub Pages 更新后，访问：

```text
https://joeyredfield.github.io/notes-blog/
```

## 发布前检查清单

- `npm run sync:notes` 没有报错。
- `reports/public-sync-report.md` 里没有不能接受的敏感词 warning。
- 报告里没有缺失附件，或者缺失附件是明确可接受的。
- `npx quartz build --serve` 本地能正常打开。
- 左侧文件树点击文件夹文字是展开/收起，不是跳到 404。
- 页面链接路径包含 `/notes-blog`，不是直接挂在 `joeyredfield.github.io/` 根路径。

## 常见问题

### 页面还显示旧内容

可能是 GitHub Pages 或浏览器缓存。先等几分钟，再用硬刷新：

```text
Cmd+Shift+R
```

### 点击文件夹跳到 404

Quartz 的 Explorer 需要设置文件夹点击行为：

```text
folderClickBehavior: collapse
```

这样点击 `设计模式`、`llm-from-scratch` 这类文件夹文字时，会展开或收起，而不是跳转到同名路径。

### 中文路径变成百分号编码

这是 URL 编码，属于正常现象。例如：

```text
%E8%AE%BE%E8%AE%A1%E6%A8%A1%E5%BC%8F
```

对应：

```text
设计模式
```

如果编码后的路径 404，通常不是编码本身的问题，而是 `baseUrl`、目录链接行为或对应页面没有生成。

### 资源路径 404

GitHub Pages 项目站必须让 Quartz 知道站点部署在 `/notes-blog` 下。

Quartz 配置里应包含类似设置：

```text
baseUrl: joeyredfield.github.io/notes-blog
```

如果缺少 `/notes-blog`，JS、CSS 或页面链接可能会从域名根路径加载，导致 404。

## 相关笔记

- [[AI应用开发路线参考]]
- [[项目目录里 Codex 计划 + Claude Code CLI 开发工作流模板]]
- [[Claude Code CLI 新会话检查清单]]
