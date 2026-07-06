# UI 优化计划

> 创建日期：2026-07-06
> 适用分支：`v5`
> 状态标记：每个任务完成后把 `[ ]` 改为 `[x]`，并在末尾追加提交哈希。

## 背景与现状

当前 UI 基于 `quartz/styles/custom.scss`（约 1050 行暖纸色编辑风主题）+ `custom-plugins/reading-enhancements`（返回顶部、TOC 高亮、图片灯箱、图片懒加载）。近期已修复移动端侧栏与宽表格溢出（`46b2184`）。

本计划聚焦四个方向：**可访问性、性能、阅读体验细化、视觉一致性**。不改变整体视觉风格。

## 全局约束（每个任务都适用）

1. **优先改 `quartz/styles/custom.scss` 和 `custom-plugins/`**，尽量不动 `quartz/` 核心代码（避免 `git merge upstream/main` 冲突）。确需改核心文件时，在本文件"核心改动登记"一节记录文件与原因。
2. 不编辑 `content/` 中的笔记正文（内容由 notes 侧驱动）。
3. 每个阶段完成后执行验证基线：
   ```bash
   npx quartz build          # 必须无错误
   npm run test:font-subset  # 涉及字体改动时
   npx quartz build --serve  # 手动抽查：桌面 / 平板(~1000px) / 移动(~390px)
   ```
4. 手动抽查页面清单（覆盖所有页面类型）：
   - 首页 `/`（长列表页）
   - 任意长文章（含代码块、表格、图片、callout、脚注）
   - 文件夹页（如 `/ai相关/`）、标签页
   - 加密页面（encrypted-pages）、404 页
   - 明暗两种主题都要看
5. 提交粒度：一个任务一个 commit，中文提交信息，说明动机而非罗列改动。

---

## Phase 0 — 基线记录（先做，半小时内完成）

- [x] **0.1 记录性能基线**（2026-07-06：Lighthouse JSON 已保存到 `docs-internal/ui-baseline/`）
  - 运行 `npx quartz build --serve`，用 Chrome DevTools Lighthouse 对首页和一篇长文章各跑一次（移动端模式），把 Performance / Accessibility / Best Practices 分数和 LCP、CLS 数值记到本文件末尾"基线数据"一节。
  - 后续每个 Phase 完成后复测一次，防止回归。
- [x] **0.2 截图基线**（2026-07-06：20 张截图已保存到 `docs-internal/ui-baseline/`，目录已加入 `.gitignore`）
  - 对抽查清单里的每类页面截桌面+移动、明+暗共 4 张图，存到 `docs-internal/ui-baseline/`（该目录加入 `.gitignore`，不提交）。

---

## Phase 1 — 可访问性（优先级最高）

- [x] **1.1 支持 `prefers-reduced-motion`**
  - 文件：`quartz/styles/custom.scss`（末尾新增一节）、`custom-plugins/reading-enhancements/components.js`。
  - 做法：
    ```scss
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        transition-duration: 0.01ms !important;
        animation-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
    ```
  - `components.js` 中返回顶部按钮的 `window.scrollTo({ behavior: "smooth" })` 改为先检测 `window.matchMedia("(prefers-reduced-motion: reduce)").matches`，命中时用 `"auto"`。
  - 验证：macOS 系统设置 → 辅助功能 → 减弱动态效果，开启后刷新页面确认无平滑滚动、无过渡动画。

- [x] **1.2 添加"跳转到正文"链接（skip link）**
  - 文件：`custom-plugins/reading-enhancements/components.js`（在 `ReadingEnhancements` 组件里加一个 `<a href="#quartz-body" class="skip-to-content">跳转到正文</a>`，注意该插件目前挂在 `afterBody`，skip link 需要出现在 DOM 靠前位置——如果 afterBody 位置导致 Tab 顺序不对，改为在 CSS 里用 `position: fixed` + 仅 `:focus-visible` 时可见，仍可接受；若不可接受，登记为核心改动，加到 `quartz/components/renderPage.tsx`）。
  - 样式：默认 `transform: translateY(-200%)` 隐藏，`:focus-visible` 时滑入左上角，使用现有 `--paper-raised` / `--accent` 变量。
  - 验证：刷新页面按 Tab，第一个焦点应为 skip link，回车后焦点落到正文区。

- [x] **1.3 焦点可见性审计**
  - 范围：explorer 链接、TOC 链接、breadcrumb、标签 pill、页脚链接、搜索按钮、darkmode/readermode 按钮、灯箱内关闭按钮。
  - 做法：给上述元素统一补 `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }`（custom.scss 已有 clipboard-button 的样式可作模板）。
  - 验证：纯键盘 Tab 遍历整页，每个可交互元素都有清晰焦点环。

- [x] **1.4 颜色对比度检查**
  - 工具：Lighthouse Accessibility 审计 + 手动检查。
  - 重点怀疑对象：`--gray`（`#a89e8e` on `#faf7f2`，用于 content-meta、breadcrumb、面板标题）大概率不足 4.5:1。
  - 做法：小字号（<0.85rem）的 `--gray` 文本如不达标，改用 `--ink-muted` 或加深 `--gray` 色值（同时微调 darkMode 对应值保持风格统一）。
  - 验证：Lighthouse Accessibility ≥ 95，且明暗两模式目测无风格突变。

- [x] **1.5 灯箱可访问性补全**
  - 文件：`custom-plugins/reading-enhancements/components.js`。
  - 检查项：`<dialog>` 原生已有焦点陷阱和 Esc 关闭；补充关闭后焦点归还到触发图片（记录 `document.activeElement` 并在 `closeLightbox` 里 `focus()` 回去）；`img[role="button"]` 补 `aria-label`（用 alt 文本或"放大图片"）。
  - 验证：键盘打开灯箱 → Esc 关闭 → 焦点回到原图片。

---

## Phase 2 — 性能与加载

- [x] **2.1 字体子集 preload**（2026-07-06：通过 `reading-enhancements` 插件 `externalResources().additionalHead` 注入页面相对 preload）
  - 现状：`LXGWWenKai-Regular.subset.woff2` 是首屏渲染关键资源，但没有 preload，靠 CSS 解析后才发现。
  - 做法（按优先顺序尝试）：
    1. 查看 `custom-plugins/reading-enhancements/index.js` 能否通过插件 `externalResources()` / `additionalHead` 注入 `<link rel="preload" as="font" type="font/woff2" crossorigin>`（参考其他社区插件如何注入 head 资源）。
    2. 若插件机制做不到，改 `quartz/components/Head.tsx`（登记核心改动），在 `coreStylesheet` preload 附近加一行，href 用 `static/fonts/LXGWWenKai-Regular.subset.woff2` 并带上 baseUrl 前缀逻辑（照抄同文件已有资源路径写法）。
  - 验证：DevTools Network 面板，字体请求应在 HTML 解析早期发出（priority: High）；Lighthouse LCP 不劣化。

- [x] **2.2 确认全量字体不被多余下载**（2026-07-06：4 个样本页网络复测仅请求 subset；全量字体保留 CJK `unicode-range` 缺字兜底）
  - 现状：`custom.scss` 同时声明 subset 和全量 `LXGWWenKai-Regular.woff2`（约几 MB），字体栈里 subset 在前。
  - 做法：DevTools Network 验证正常浏览时**只**下载 subset；如果全量也被下载（可能因为某字符不在子集触发 fallback），评估两个选项——(a) 接受（这是设计意图，缺字兜底）；(b) 给全量 `@font-face` 加 `unicode-range` 限制。把结论写进本文件。
  - 验证：清缓存后访问 3 篇不同文章，观察字体请求。

- [x] **2.3 TOC 高亮与返回顶部改用 IntersectionObserver**（2026-07-06：浏览器验证 TOC active、返回顶部显示/隐藏、SPA 跳转后 sentinel/skip link 不重复）
  - 文件：`custom-plugins/reading-enhancements/components.js`。
  - 现状：两个 `scroll` 监听器每次滚动都遍历 headings 并调 `getBoundingClientRect()`（强制布局）。
  - 做法：
    - TOC 高亮：用 IntersectionObserver 观察所有 `article h1-h6[id]`，`rootMargin: "0px 0px -80% 0px"` 模拟当前 128px 阈值行为；维护"最后一个越过阈值的 heading"状态。
    - 返回顶部：用 IntersectionObserver 观察一个页面顶部哨兵元素（或 `.page-header`），离开视口即显示按钮。
    - 保留现有 `window.addCleanup` 清理模式（SPA 导航必需），observer 在 cleanup 里 `disconnect()`。
  - 验证：长文章滚动时 TOC 高亮行为与现在一致（对照改动前录屏）；SPA 跳转 3 次后无重复绑定（看 `is-active` 是否错乱）。
  - 风险：行为微妙差异。如果 IntersectionObserver 版本在快速滚动时跳档，可退回 scroll 监听 + `requestAnimationFrame` 节流的折中方案。

- [x] **2.4 清理无效的 Latin 字体配置**（2026-07-06：删除 custom.scss 中 Fraunces variable 相关死代码；config typography 保留给 OG 插件）
  - 现状：`quartz.config.yaml` typography 配了 Fraunces/Inter/IBM Plex Mono，但 `fontOrigin: local` 且这些字体不在 `static/fonts/`；custom.scss 又把 `--bodyFont`/`--headerFont`/`--titleFont` 全部覆盖为文楷栈。结果是 Fraunces 的 `font-variation-settings`（custom.scss 中 `.page-title`、`.article-title`、`article h1-h6` 共 4 处）在访客机器上是死代码。
  - 决策（二选一，做之前想清楚）：
    - **方案 A（推荐，零成本）**：接受"全站文楷"现状，删除 custom.scss 中 4 处 `font-variation-settings` 和 `font-optical-sizing` 死代码，`quartz.config.yaml` typography 改为与实际一致（如都写文楷名），消除误导。
    - **方案 B（视觉升级，有体积成本）**：真正引入 Latin 显示字体给标题用——下载 Fraunces variable woff2（latin subset 约 50-100KB）放入 `static/fonts/`，加 `@font-face`，字体栈改为 `"Fraunces", var(--font-wenkai)`，让英文标题用 Fraunces、中文回落文楷。需确认中英混排基线对齐不难看。
  - 验证：方案 B 需在含英文标题的文章上对比截图；两方案都要跑 `npx quartz build`。

---

## Phase 3 — 阅读体验细化

- [x] **3.1 打印样式**
  - 文件：`quartz/styles/custom.scss` 末尾新增 `@media print` 一节。
  - 做法：隐藏侧栏（`.sidebar`）、搜索、darkmode/readermode、graph、返回顶部、页脚导航、面包屑；正文放开 `max-width`；链接后打印 URL（`article a[href^="http"]::after { content: " (" attr(href) ")"; }`）；代码块允许换行避免截断；背景渐变去掉（省墨）。
  - 验证：Chrome 打印预览查看长文章，1 页内无侧栏残留、代码不溢出。

- [x] **3.2 代码块体验**
  - 文件：`quartz/styles/custom.scss`。
  - 做法：
    - 长代码块（>40 行）目前一屏占满——给 `pre` 加 `max-height: 32rem; overflow-y: auto`，配现有细滚动条样式。
    - 显示语言标签：syntax-highlighting 插件输出 `data-language` 属性（先 `npx quartz build` 后在 `public/` 里 grep 确认属性名），用 `pre::before { content: attr(data-language); }` 在右上角显示小标签，样式对齐现有 eyebrow 风格（`--tracking-eyebrow`、`--gray`）。
  - 验证：找一篇含长代码块的文章，确认可滚动、语言标签显示、复制按钮不与标签重叠。

- [x] **3.3 标题锚点可发现性**
  - 现状：确认 hover 标题时是否有锚点链接标识（Quartz 默认有 `[role="anchor"]` 处理，custom.scss 第 506 行有涉及但无可见样式）。
  - 做法：`article h1-h6:hover a[role="anchor"]` 显示 `#` 或链接图标，颜色 `--gray`，hover 变 `--accent`；默认 `opacity: 0`。
  - 验证：hover 各级标题出现锚点标识，点击后 URL 带 fragment 且能复制。

- [x] **3.4 外部链接标识**
  - 做法：`article a:not(.internal):not([role="anchor"])::after` 加一个小的"↗"（用伪元素而非图标字体，`font-size: 0.75em`），排除图片链接（`a:has(> img)` 不加）。
  - 验证：外链有标识、内链没有、图片链接没有；换行时标识不孤行（`white-space: nowrap` 处理最后一个词——若做不到简单实现就只加标识不管孤行）。

- [x] **3.5 表格表头吸顶（可选，低优先）**
  - 做法：`.table-container` 内 `th { position: sticky; top: 0; }`。注意 `.table-container` 有 `overflow-x: auto`，sticky 在滚动容器内的表现要实测；若与横向滚动冲突则放弃此项并记录原因。
  - 验证：长表格纵向滚动时表头保持可见，横向滚动不错位。

---

## Phase 4 — 视觉一致性打磨

- [ ] **4.1 `theme-color` meta 跟随明暗主题**
  - 做法：检查 `public/` 产物是否有 `<meta name="theme-color">`；没有则注入两条（`media="(prefers-color-scheme: light)"` 用 `#faf7f2`，dark 用 `#1f1c18`）。注入途径同 2.1（优先插件，其次 Head.tsx 登记核心改动）。
  - 注意：站点是手动切换主题（`saved-theme` 属性）而非纯 prefers-color-scheme，手动切换时 meta 不会跟——可在 reading-enhancements 脚本里监听 `themechange` 事件（Quartz darkmode 组件会派发，先在 `quartz/components/scripts/darkmode.inline.ts` 确认事件名）动态更新 meta。
  - 验证：iOS Safari / Android Chrome 地址栏颜色与页面背景一致，切主题后跟随。

- [ ] **4.2 滚动条全局风格统一**
  - 现状：`.sidebar` 和 `.table-container` 有 scrollbar-color，但 `pre`、搜索结果、body 主滚动条没有。
  - 做法：`:root { scrollbar-color: color-mix(in srgb, var(--gray) 50%, transparent) transparent; scrollbar-width: thin; }` 统一，再删掉重复的局部声明。body 主滚动条保持默认宽度（thin 的主滚动条不好抓），只统一颜色。
  - 验证：明暗两模式下各滚动条颜色协调。

- [ ] **4.3 首页列表页视觉（不改内容，只改样式）**
  - 现状：首页是大量 `[[wikilink]]` 平铺列表，视觉密度高。
  - 做法（仅 CSS）：给首页正文里的 `ul` 增加呼吸感——`article > ul > li { margin: 0.35rem 0; }`；`h2` 之间已有 border-top 分隔，够用。**不做卡片化**（内容结构是 notes 侧生成的列表，卡片化需要改内容或写 transformer，超出本计划范围——如果想做，单独立项）。
  - 验证：首页明暗两模式截图对比基线，密度改善且无排版跳变。

- [ ] **4.4 图片说明（caption）样式**
  - 做法：确认 Obsidian 图片 alt 是否被渲染为可见 caption（看 public 产物）。若图片后紧跟 `<em>` 段落是常见写法，不强行处理；仅当产物里有 `<figure><figcaption>` 结构时补样式：居中、`--gray`、0.86rem（对齐灯箱 caption 风格）。
  - 验证：找含图文章确认效果。

---

## Phase 5 — 移动端专项

- [ ] **5.1 搜索弹层移动端体验**
  - 检查项：390px 宽度下打开搜索——输入框是否被软键盘遮挡、结果列表能否滚动、预览面板是否该隐藏（窄屏没空间）。
  - 做法：按实测结果修 custom.scss 的 `@media all and ($mobile)` 一节；预览面板窄屏隐藏是常见处理。
  - 验证：真机或 DevTools 设备模拟器输入中文搜索词，全流程可用。

- [ ] **5.2 移动端 TOC 可达性**
  - 现状：TOC 在 right sidebar，确认移动端布局里它出现在文章后面（grid 顺序 `grid-sidebar-right` 在 center 之后）——读者读长文时无法快速跳节。
  - 做法（低成本方案）：接受现状但确认 TOC 折叠状态在移动端默认收起（避免长 TOC 把 backlinks/graph 推得太远）。如果 Quartz TOC 组件支持 `collapsed` 默认值就配置之；不支持则在 reading-enhancements 脚本里移动端宽度下初始加 collapsed class。
  - 验证：390px 宽度打开长文章，滚到文末，TOC 默认收起、可展开。

- [ ] **5.3 触控目标尺寸审计**
  - 检查项：explorer 链接、TOC 链接、标签 pill、页脚链接的可点击高度 ≥ 44px（当前 `padding: 0.18rem 0.4rem` + `font-size: 0.88rem` 约 30px，偏小）。
  - 做法：`@media all and ($mobile)` 内把侧栏链接 padding 提到 `0.4rem 0.5rem`。
  - 验证：Lighthouse Best Practices / 手动点按不误触。

---

## 核心改动登记

> 修改了 `quartz/` 核心文件（非 custom.scss / custom-plugins）时在此登记，upstream merge 时对照检查。

| 文件 | 改动 | 原因 | 任务 |
| ---- | ---- | ---- | ---- |
| （暂无） | | | |

## 基线数据

> Phase 0 填写，各 Phase 完成后追加复测行。

| 日期 | 页面 | Perf | A11y | LCP | CLS | 备注 |
| ---- | ---- | ---- | ---- | --- | --- | ---- |
| 2026-07-06 | 首页 `/` | 55 | 90 | 125592ms | 0 | Phase 0 mobile Lighthouse；JSON: `docs-internal/ui-baseline/lighthouse-home-baseline.json` |
| 2026-07-06 | 长文章 `/lienjack/ai/learn-llm/math_foundations_deep_dive` | 55 | 88 | 125283ms | 0 | Phase 0 mobile Lighthouse；覆盖图片/代码块/表格/callout；JSON: `docs-internal/ui-baseline/lighthouse-long-baseline.json` |
| 2026-07-06 | 首页 `/` | 55 | 100 | 125939ms | 0 | Phase 1 mobile Lighthouse；JSON: `docs-internal/ui-baseline/lighthouse-home-phase1.json` |
| 2026-07-06 | 长文章 `/lienjack/ai/learn-llm/math_foundations_deep_dive` | 55 | 100 | 127977ms | 0 | Phase 1 mobile Lighthouse；JSON: `docs-internal/ui-baseline/lighthouse-long-phase1.json` |
| 2026-07-06 | 首页 `/` | 45 | 100 | 82821ms | 0 | Phase 2 mobile Lighthouse；JSON: `docs-internal/ui-baseline/lighthouse-home-phase2.json` |
| 2026-07-06 | 长文章 `/lienjack/ai/learn-llm/math_foundations_deep_dive` | 31 | 100 | 84923ms | 0 | Phase 2 mobile Lighthouse；JSON: `docs-internal/ui-baseline/lighthouse-long-phase2.json` |

## 决策记录

- 2026-07-06 计划创建。范围明确排除：评论系统（comments 插件保持关闭）、首页卡片化改版（需 notes 侧配合，单独立项）、stacked-pages（保持关闭）。
- 2026-07-06 Phase 0 截图样本：`/`、`/lienjack/ai/learn-llm/math_foundations_deep_dive`、`/ai相关/`、`/tags/ai`、`/__ui-baseline-missing-page__`；每个样本截桌面/移动、明/暗各 1 张。当前 `public/static/encryptedContentIndex.json` entries 为空，未找到可确认的加密页面样本。
- 2026-07-06 Phase 0 产物观察：代码块语言属性为 `data-language`（`pre` 和 `code` 均有）；正文图片主要渲染为 `<p><img ...></p>`，未发现全站 `<figcaption>` 结构。
- 2026-07-06 Phase 1：`--gray` 明色从 `#a89e8e` 调整为 `#7a7064`（对 `#faf7f2` 约 4.54:1），暗色从 `#7d756a` 调整为 `#9a9185`（对 `#1f1c18` 约 5.46:1）。移动端 Explorer 容器会由插件脚本抑制错误的容器级 `aria-expanded`，保留按钮和内容区上的可访问状态。
- 2026-07-06 Phase 2 字体加载：subset preload 在首页/长文/文件夹页/标签页均由 HTML link 触发，`performance` 里 `initiatorType=link`；补充 `©` 到子集保底文本，breadcrumb 分隔符 `❯` 改用系统字体（源文楷字体本身无该 glyph），全量文楷增加 CJK/常用标点 `unicode-range`，复测 4 个样本页只下载 `LXGWWenKai-Regular.subset.woff2`，不下载 8MB 全量 WOFF2。
- 2026-07-06 Phase 2 字体配置：`quartz.config.yaml` 的 typography 保留 `Fraunces` / `Inter` / `IBM Plex Mono`，因为 `.quartz/plugins/og-image` 会按 config 字体名抓取 Google Fonts TTF；改成 `LXGW WenKai` 会导致 `CustomOgImages: No fonts are loaded` 构建失败。实际页面字体仍由 `custom.scss` 覆盖为文楷栈。
- 2026-07-06 Phase 2 TOC 复验：长文页大距离回顶一度看似没有回到顶部，根因是 Quartz 基础样式 `html { scroll-behavior: smooth; }`，700ms 固定等待不足以覆盖超长页面平滑滚动。改用条件等待到 `scrollY <= 2` 后，`window.scrollTo` 和返回顶部按钮均恢复到 `scrollY=0`，TOC 仅有首标题 1 个 `.is-active`，按钮隐藏；连续 SPA 跳转 `/`、`/ai相关/`、`/tags/ai`、长文页后 skip link、sentinel、返回顶部按钮均保持单例。
- 2026-07-06 Phase 3：打印样式隐藏侧栏、搜索、Graph、返回顶部、面包屑、skip link 和页脚，正文放开宽度，`http(s)` 外链打印 URL，非 `http(s)` 外链不打印屏幕态箭头；首页 PDF 复验不含 `跳转到正文` / `Graph View`，`GitHub` 链接打印 `https://github.com/JoeyRedfield`。代码块实测 `max-height=512px`、`overflow-y=auto`、语言标签显示 `data-language`，复制按钮右上角偏移正常；标题 hover 只显示 `#`，隐藏 Quartz 自带 SVG；正文外链屏幕态显示 `↗` 且隐藏原 SVG；长表格容器内 `th` sticky 生效。
