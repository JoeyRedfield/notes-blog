# Quartz 网站性能改造报告

验证日期：2026-07-12

对比范围：同一份 365 篇内容，基线提交 `a497ad2`，改造后提交 `b5cd40b`。两次生产构建都在独立 `/tmp` 镜像中使用 Node 22.16.0、Quartz 5.0.0 和 `-c 1`，共享相同的已安装 Quartz 插件与 `node_modules`。Lighthouse 使用同一 gzip 静态服务口径。

## 结论

移动端 Lighthouse Performance 从 47 提升到 78，TBT 从 877 ms 降到 0 ms，LCP 从 33.10 s 降到 5.42 s。首屏传输从约 6.0 MiB 降到 677 KiB，且不再加载全文搜索索引、D3 或 Pixi。

主要收益来自：拆分轻量元数据索引与全文索引、按需搜索、Explorer 惰性 DOM、Graph 延迟加载、标签页压缩、按页过滤 KaTeX，以及仅为真实内容生成 OG 图片。响应式图片增加了输出体积与首次构建成本，但对等缓存复用构建比基线快 23.6%。

## Lighthouse

| 指标 | 基线 | 改造后 | 差值 |
| --- | ---: | ---: | ---: |
| Performance | 47 | 78 | +31 |
| FCP | 2.18 s | 2.17 s | 基本持平 |
| LCP | 33.10 s | 5.42 s | -27.69 s (-83.7%) |
| TBT | 877 ms | 0 ms | -877 ms |
| CLS | 0 | 0.015 | +0.015 |
| 首屏传输 | 6,292,946 B | 692,804 B | -89.0% |
| 请求数 | 53 | 50 | -3 |

基线首屏包含：

- `contentIndex.json`：5,085,379 B 实际传输。
- D3：92,913 B。
- Pixi：433,585 B。

改造后移动端首屏只包含 47,329 B 实际传输的轻量 `contentIndex.json`；`searchIndex.json`、D3、Pixi 均不在 Lighthouse 首屏请求中。

## 构建与产物

| 指标 | 基线 | 改造后 | 差值 |
| --- | ---: | ---: | ---: |
| 首次构建时间 | 87.55 s | 107.61 s | +20.06 s (+22.9%) |
| 缓存复用构建 | 87.18 s | 66.63 s | -20.55 s (-23.6%) |
| 首次构建峰值 RSS | 约 2.44 GiB | 约 2.76 GiB | 约 +13.1% |
| 输出逻辑体积 | 321.05 MiB | 357.89 MiB | +11.5% |
| 输出文件 | 3,970 | 4,429 | +459 |
| 首屏元数据索引 | 15,001,292 B | 288,702 B | -98.1% |
| 按需全文索引 | 无独立文件 | 14,774,421 B | 首次搜索加载 |
| `tags/index.html` | 1,052,967 B | 119,142 B | -88.7% |
| OG 图片 | 1,057 | 365 | -692 (-65.5%) |
| 含 KaTeX 资源的 HTML | 1,058 | 4 | -99.6% |
| 响应式 WebP | 0 | 1,149 | +1,149 |

响应式图片明细：720w 689 个，1440w 460 个，HTML `srcset` 675 处；缓存目录 1,149 个文件、45,541,166 B。派生名保留源扩展，例如 `photo.png.w720.webp` 与 `photo.jpg.w720.webp`。全局 resolver 会先保留所有合法源输出；首选派生名被占用时使用源路径 SHA-256 的前 12 位作为稳定 fallback，并在极端重复占用时稳定递增。不同源资产若 slug 化后仍映射到同一输出路径，构建会在写文件前失败并列出冲突源，避免静默覆盖。

## 浏览器回归

- 搜索：打开前不请求 `searchIndex.json`；首次打开后只请求 1 次；“人工智能”和 `PostgreSQL` 均返回 8 条结果；Escape、关闭按钮、快捷键和 SPA 跳转正常。
- Explorer：首页只生成 5 个根节点；首次展开后生成到 19 个节点，并写入折叠状态；导航后继续复用轻量元数据。
- Graph：移动端点击前不加载 D3/Pixi，点击后各请求 1 次并生成 1 个 canvas；SPA 导航后旧 canvas 清理。桌面端局部 Graph 进入视口后自动加载。
- 图片：大图输出数值 `width="1536"`、`height="1024"` 和 720w/1440w `srcset`；浏览器选择 WebP，灯箱 `src` 与源图 `currentSrc` 一致；动画 GIF 保留原文件与全部帧。
- KaTeX：普通页无 `.katex`、KaTeX CSS 或 copy-tex；实际公式页有 31 个 `.katex` 节点并保留 CSS/脚本；组件生成公式的页面也有自动化回归。
- 标签：首页 662 个紧凑条目，无文章预览结构；单标签页保留全部文章、日期和标题。

## 自动化检查

- `npm test`：222/222 通过，0 failure。
- `npx tsc --noEmit`：通过。
- Task 1-6 定向与相邻测试：通过。
- 变更文件范围 Prettier：通过。
- `git diff --check`：通过。
- `npm run check`：TypeScript 通过，但全仓 Prettier 因 350 个既有内容、样式和脚本文件未格式化而退出 1。本次没有批量改写用户内容；变更文件单独检查通过。

## 已知权衡与风险

- 首次构建会生成响应式图片，因此时间、峰值 RSS、输出体积均高于基线；CI/本地缓存命中后构建快于对等 warm 基线。
- 图片 watch 变更为保证 `width/height/srcset` 与派生文件一致，会重解析全部 Markdown；365 篇内容的实测增量重建约 1 分钟。
- 1280x720 桌面首页中局部 Graph 已位于视口，所以 IntersectionObserver 会按设计加载 D3/Pixi；移动端首屏和 Lighthouse 不加载。若要求所有桌面首页也完全不加载图形库，需要改为显式交互或调整布局。
- `htmlHasClass` 对 `data-class="katex"` 存在误判，只会让少量无公式页多保留数学资源；当前仓库没有该属性用法。
- 浏览器 SPA 回归发现一个既有内容链接的 popover 请求返回 404，与本次性能代码无关。
- watch 图片 add/change/delete、同 slug 重命名两种事件顺序、派生路径迁移和合法源占位均有自动化回归；原始资产 mutation 统一先删除再写入，避免事件顺序导致新文件被误删。

## 复现实验

```bash
npm test
npx tsc --noEmit

# 在无 .quartz-cache 的独立镜像中执行 cold build，避免清理工作树的 public
/usr/bin/time -l npx quartz build -o public --bundleInfo -c 1

# 不修改输入，立即执行第二次作为 warm build
/usr/bin/time -l npx quartz build -o public -c 1

# 输出逻辑体积，避免 du 的文件系统分配块差异
find public -type f -exec stat -f '%z' {} + | awk '{s+=$1} END {print s}'

npx lighthouse http://127.0.0.1:18206/notes-blog/ \
  --output=json \
  --output-path=/tmp/quartz-lighthouse-mobile-final-b5cd40b-gzip-20260712.json \
  --chrome-flags='--headless --no-sandbox' \
  --quiet
```

原始 Lighthouse 报告：

- 基线：`/tmp/quartz-lighthouse-mobile-baseline-20260712.json`
- 改造后：`/tmp/quartz-lighthouse-mobile-final-b5cd40b-gzip-20260712.json`
