---
title: Quartz GitHub Pages 子路径跳转问题排查记录
tags:
  - blog
  - quartz
  - github-pages
  - troubleshooting
---

# Quartz GitHub Pages 子路径跳转问题排查记录

## 问题现象

博客部署地址是：

```text
https://joeyredfield.github.io/notes-blog/
```

但是从首页点击文章链接后，路径里的 `notes-blog` 会丢失。例如点击：

```text
ai应用开发/mempalace-学习笔记
```

实际跳到了：

```text
https://joeyredfield.github.io/ai%E5%BA%94%E7%94%A8%E5%BC%80%E5%8F%91/mempalace-%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0
```

正确地址应该是：

```text
https://joeyredfield.github.io/notes-blog/ai%E5%BA%94%E7%94%A8%E5%BC%80%E5%8F%91/mempalace-%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0
```

## 根因

这次问题不是文章链接本身写错，而是 Quartz 的站点配置被改成了默认示例配置。

错误配置：

```yaml
configuration:
  pageTitle: Quartz 5
  locale: en-US
  baseUrl: quartz.jzhao.xyz
```

对于 GitHub Pages 项目站点，`baseUrl` 必须包含项目子路径：

```yaml
configuration:
  pageTitle: HenryWu's Blog
  locale: zh-CN
  baseUrl: joeyredfield.github.io/notes-blog
```

`baseUrl` 错误会导致 Quartz 生成的页面里 `data-basepath` 为空：

```html
<body data-slug="index" data-basepath>
```

Quartz 的 SPA 跳转逻辑依赖这个 `data-basepath`。当它为空时，前端内部跳转会把链接解析到域名根路径，于是 `/notes-blog` 被丢掉。

修复后生成结果应该包含：

```html
<body data-slug="index" data-basepath="/notes-blog">
```

## 排查过程

### 1. 确认线上内容已经部署

先确认内容同步和文章本身没有问题：

```bash
curl -L --silent https://joeyredfield.github.io/notes-blog/static/contentIndex.json
```

线上 `contentIndex.json` 已经包含 `ai应用开发`，说明新内容确实已经发布。

### 2. 检查线上 HTML

查看线上首页和文章页：

```bash
curl -L --silent https://joeyredfield.github.io/notes-blog/
curl -L --silent https://joeyredfield.github.io/notes-blog/ai%E5%BA%94%E7%94%A8%E5%BC%80%E5%8F%91/mempalace-%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0
```

发现页面里有这些错误信号：

```html
<meta property="twitter:domain" content="quartz.jzhao.xyz">
<meta property="og:url" content="https://quartz.jzhao.xyz/index">
<body data-slug="index" data-basepath>
```

这说明不是 GitHub Pages 路由规则问题，而是 Quartz 构建时拿到的站点基础路径就是错的。

### 3. 检查本地配置

检查：

```text
/Users/wuzhuoyi/Documents/quartz/quartz.config.yaml
```

发现 `baseUrl` 被改成了：

```yaml
baseUrl: quartz.jzhao.xyz
```

这正好解释了线上跳转丢失 `/notes-blog` 的现象。

## 修复步骤

修改：

```text
/Users/wuzhuoyi/Documents/quartz/quartz.config.yaml
```

把配置改回：

```yaml
configuration:
  pageTitle: HenryWu's Blog
  locale: zh-CN
  baseUrl: joeyredfield.github.io/notes-blog
```

然后重新构建：

```bash
cd /Users/wuzhuoyi/Documents/quartz
npm run quartz -- build
```

检查生成结果：

```bash
rg -n "data-basepath|joeyredfield.github.io/notes-blog|quartz.jzhao.xyz" public/index.html public/ai应用开发/mempalace-学习笔记.html
```

期望看到：

```html
data-basepath="/notes-blog"
https://joeyredfield.github.io/notes-blog/ai应用开发/mempalace-学习笔记
```

不应该再看到文章页的 canonical / Open Graph URL 指向 `quartz.jzhao.xyz`。

## 验证命令

本次修复时跑过：

```bash
npm run test:sync-notes
npm run quartz -- build
git diff --check
```

还额外用脚本确认：

```bash
node --input-type=module -e "import fs from 'node:fs'; import yaml from 'yaml'; const cfg = yaml.parse(fs.readFileSync('quartz.config.yaml','utf8')); const html = fs.readFileSync('public/ai应用开发/mempalace-学习笔记.html','utf8'); if (cfg.configuration.baseUrl !== 'joeyredfield.github.io/notes-blog') throw new Error('bad baseUrl'); if (!html.includes('data-basepath=\"/notes-blog\"')) throw new Error('missing /notes-blog data-basepath'); if (!html.includes('https://joeyredfield.github.io/notes-blog/ai应用开发/mempalace-学习笔记')) throw new Error('missing fixed canonical URL'); console.log('path verification ok');"
```

线上验证：

```bash
curl -L --silent "https://joeyredfield.github.io/notes-blog/?deploycheck=1" \
  | rg -o 'data-basepath="/notes-blog"|twitter:domain" content="joeyredfield.github.io/notes-blog"'
```

期望输出：

```text
twitter:domain" content="joeyredfield.github.io/notes-blog"
data-basepath="/notes-blog"
```

## 相关提交

```text
78931c7 Quartz sync: May 29, 2026, 9:19 PM
0bec9b5 Fix GitHub Pages base path
```

其中 `78931c7` 引入了错误的默认站点配置，`0bec9b5` 修复了 GitHub Pages 子路径。

## 经验总结

### 1. GitHub Pages 项目站点必须配置子路径

用户页：

```text
https://username.github.io/
```

通常不需要额外子路径。

项目页：

```text
https://username.github.io/repo-name/
```

必须让 Quartz 知道 `/repo-name`。在这个博客里就是：

```yaml
baseUrl: joeyredfield.github.io/notes-blog
```

### 2. 不要只看 Markdown 里的链接

这次首页 Markdown 里的链接是相对路径，看起来没问题；真正出错的是 Quartz 生成页面时的全局 `basepath`。

排查这类问题要同时看：

- `quartz.config.yaml`
- 生成后的 `public/*.html`
- 线上 HTML 的 `data-basepath`
- 线上 HTML 的 `og:url` / `twitter:domain`

### 3. GitHub Pages 有缓存

推送后如果浏览器仍然显示旧侧边栏或旧跳转，可以先强刷：

```text
Cmd + Shift + R
```

或者给 URL 临时加 query 参数验证最新部署：

```text
https://joeyredfield.github.io/notes-blog/?deploycheck=1
```

这能避开部分浏览器缓存，但最终还是要以不带 query 的正式地址为准。

## 关联笔记

- [[Quartz GitHub Pages 博客发布工作流]]
