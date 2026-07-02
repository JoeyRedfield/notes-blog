---
tags: [meta]
created: 2026-06-25
---

# CLAUDE.md

本文件定义 Claude Code 在此 Quartz 发布项目中的工作方式。

## 项目性质

这是 [Quartz v5](https://quartz.jzhao.xyz/) 实例，将 Obsidian 笔记库发布为静态网站。

- **内容源**：`/Users/wuzhuoyi/Documents/notes`（通过 `content/` 符号链接或脚本同步）
- **发布目标**：`joeyredfield.github.io/notes-blog`（GitHub Pages）
- **远程仓库**：`origin` → `https://github.com/JoeyRedfield/notes-blog.git`，`upstream` → `https://github.com/jackyzha0/quartz.git`

## 常用命令

```bash
# 本地预览
npx quartz build --serve

# 仅构建（输出到 public/）
npx quartz build

# 刷新霞鹜文楷字体子集（内容大更新或发布前执行）
npm run font:subset

# 完整发布 notes 内容到 GitHub Pages
npm run publish:notes

# 同步上游 quartz 框架更新
git fetch upstream && git merge upstream/main
```

## 关键文件

- `quartz.config.yaml` — 站点配置（标题、域名、主题、插件）
- `quartz.config.default.yaml` — 上游默认配置参考，不要改
- `content/` — 发布的笔记内容
- `public/` — 构建产物
- `quartz/static/fonts/LXGWWenKai-Regular.subset.woff2` — 当前内容语料生成的霞鹜文楷字体子集

## 配置要点

- 语言：`zh-CN`
- 标题：`HenryWu's Blog`
- 忽略模式：`private`、`templates`、`.obsidian`
- 插件：Obsidian Flavored Markdown、KaTeX、加密页面（encrypted-pages）、OG 图片、RSS/Sitemap、别名重定向等
- 禁止提交 `node_modules/`、`public/`、`.DS_Store`

## 工作原则

- 修改 `quartz.config.yaml` 前先确认影响范围
- 更新 quartz 框架版本（`git merge upstream/main`）后运行 `npm install` 并本地预览验证
- 内容同步由 notes 侧驱动，不在 quartz 侧直接编辑 `content/` 中的笔记正文
- 内容大更新后必须刷新字体子集：先同步 `content/`，再运行 `npm run font:subset`，然后运行 `npm run test:font-subset` 和 `npx quartz build`
- `npm run publish:notes` 已包含 `sync:notes`、`font:subset`、同步测试、字体子集测试、构建和 Quartz 同步发布
- 字体子集脚本依赖本机 `python3 -m fontTools.subset`；如果环境缺少 fontTools，先安装后再发布
