# Quartz 网站性能改造设计

## 目标

在不删除现有字体、原始图片、GIF 或插件缓存的前提下，降低 Quartz 站点首屏传输、主线程阻塞、DOM 规模和重复构建成本，并保持搜索、目录、关系图、数学公式、标签页、RSS、站点地图和社交分享能力可用。

## 基线

- `contentIndex.json`: 15,001,292 B，gzip 约 5.3 MiB。
- 移动端 Lighthouse Performance: 43，TBT: 1,073 ms，观测 LCP: 2.315 s。
- 完整构建: 75.33 s，峰值 RSS 约 2.64 GiB，输出约 321 MiB。
- Explorer 首次执行约 2.69 s；D3 与 Pixi 合计执行约 2.63 s。
- `tags/index.html`: 约 1.05 MiB，约 53,712 个 HTML 标签。
- KaTeX 资源注入约 1,058 个页面，实际仅少量页面包含公式。
- 228 张大图约 134.6 MiB；最大 GIF 约 7.08 MiB。

## 约束

- 不直接修改 `.quartz/plugins`。该目录被忽略，并且当前隔离工作区与主工作区共享插件缓存。
- 不删除任何已有文件。原始位图、GIF、字体和插件缓存全部保留。
- 新插件使用不同目录名，避免 Quartz 安装本地插件时替换同名缓存目录。
- 行为改动采用 RED/GREEN 测试循环；每个阶段完成规格审查和代码质量审查。
- 不推送远端、不创建 PR，除非用户另行要求。

## 总体架构

### 1. 双索引

新增本地 emitter `content-index-lite`：

- `static/contentIndex.json` 只包含 `slug`、`filePath`、`title`、`links`、`tags`，继续供 Explorer 和 Graph 使用。
- `static/searchIndex.json` 只包含真实内容页的 `title`、`tags`、`content`，仅在搜索首次打开时请求。
- RSS 和 sitemap 继续基于 emitter 内部的完整记录生成，不从轻量 JSON 反推。

`renderPage.tsx` 现有 `fetchData` 可以继续首屏请求元数据索引，因为压缩后目标约 50 KiB；全文不再进入首屏请求链。

### 2. 延迟交互模块

- `search-lazy`: 初始阶段只注册按钮和快捷键；首次打开后并发去重地请求全文索引并构建内存搜索记录。失败时清空 Promise，允许重试。
- `explorer-lazy`: 模块级缓存处理后的 Trie；SPA 导航复用 Trie，只渲染根节点、已展开目录和当前页面祖先。折叠目录首次展开时才生成子节点 DOM。
- `graph-lazy`: 初始阶段只注册观察器和控件；桌面端关系图接近视口后加载 D3/Pixi，移动端由明确按钮触发，全局图由按钮或快捷键触发。库 Promise 与标准化图数据均缓存。

三个组件都使用仓库内本地插件和根目录 `esbuild` 在构建时打包浏览器脚本，不提交插件安装缓存。

### 3. 响应式图片

扩展核心 Assets emitter：

- 原始资源仍照常复制。
- 对 PNG/JPEG/WebP 生成不放大的 720w、1440w WebP；对 GIF 使用 `sharp(input, { animated: true })` 生成动画 WebP。
- 派生图写入 `.quartz-cache/responsive-images` 后复制到输出目录；缓存键包含源文件内容摘要、宽度和编码版本。
- `reading-enhancements` 在 HAST 阶段读取图片元数据，写入数值 `width`/`height`、`srcset` 和 `sizes`，并保留原始 `src` 回退。
- 外部 URL、data URL、SVG 和无法读取的图片保持原样。

GitHub Actions 缓存 `.quartz-cache/responsive-images`，因此 CI 可复用未变化图片。

### 4. 页面和构建瘦身

- `tag-page-lite` 的标签总览只渲染标签、计数和链接，不再为每个标签内嵌文章预览；单个标签页仍完整列出文章。
- 页面渲染完成 transclusion 后检测 `.katex`，无公式页面移除 KaTeX CSS 和 copy-tex JS。
- emitter 调度对 `CustomOgImages` 使用真实内容集合，不把虚拟标签/目录页交给 OG 生成器；这些虚拟页继续使用默认 OG 图。
- GitHub Actions 插件缓存移除宽泛 `restore-keys`，避免恢复与 lockfile 不匹配的孤儿缓存。

## 兼容与降级

- 搜索数据请求失败时显示可重试状态，不影响页面导航。
- 浏览器不支持 `IntersectionObserver` 时，桌面 Graph 在空闲回调中加载，移动端仍保留手动按钮。
- 图片转换失败时仅输出原图，HTML 不引用缺失变体。
- KaTeX 过滤只识别已渲染树中的 `.katex`，包括 transclusion 后出现的公式。
- 原社区插件配置保留但设为禁用，回退时只需切换 YAML，不需要恢复缓存文件。

## 成功标准

- 首页不请求 `searchIndex.json`、D3 或 Pixi；打开搜索后才请求全文索引；Graph 触发后才请求图形库。
- `contentIndex.json` 原始体积小于 500 KiB，且不包含 `content` 字段。
- `tags/index.html` 小于 150 KiB，DOM 元素显著低于基线。
- 无公式页面不包含 KaTeX CSS/copy-tex JS，公式页面仍正常渲染和复制。
- 虚拟标签/目录页不生成独立 OG 图片。
- 大图获得数值尺寸和 WebP `srcset`；动画 GIF 的派生 WebP 保持多帧。
- 全套测试、TypeScript、格式检查、生产构建和桌面/移动浏览器回归通过。
- 相同环境下移动端 Lighthouse Performance 和 TBT 明显优于 43 / 1,073 ms 基线。
