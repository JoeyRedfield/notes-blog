# Quartz 网站性能改造实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将全文索引和重型交互移出首屏链路，降低目录与标签 DOM，生成可缓存的响应式图片，并减少无效 KaTeX 与 OG 构建工作。

**Architecture:** 用新的仓库内本地插件替换 ContentIndex、Search、Explorer、Graph 和 TagPage，避免修改或删除 `.quartz/plugins` 缓存；图片变体由核心 Assets emitter 写入忽略缓存后发射；页面渲染层只做按树过滤，构建调度层只调整 OG 输入集合。

**Tech Stack:** Quartz v5、TypeScript/JavaScript、Preact、esbuild、Sharp、Node test runner、Playwright、Lighthouse。

---

### Task 1: 拆分元数据索引与全文搜索索引

**Files:**

- Create: `custom-plugins/content-index-lite/package.json`
- Create: `custom-plugins/content-index-lite/index.js`
- Create: `custom-plugins/content-index-lite/index.test.ts`
- Modify: `quartz.config.yaml`

- [ ] **Step 1: 写出双索引字段契约的失败测试**

```ts
test("builds separate metadata and search records", () => {
  const { metadata, search } = buildIndexes(sampleContent)
  assert.deepEqual(metadata.note, {
    slug: "note",
    filePath: "note.md",
    title: "Note",
    links: ["other"],
    tags: ["perf"],
  })
  assert.equal("content" in metadata.note, false)
  assert.deepEqual(search.note, {
    title: "Note",
    tags: ["perf"],
    content: "full body",
  })
  assert.equal(search["tags/perf"], undefined)
})
```

- [ ] **Step 2: 运行 RED**

Run: `npx tsx --test custom-plugins/content-index-lite/index.test.ts`

Expected: FAIL，因为 `buildIndexes` 和本地插件尚不存在。

- [ ] **Step 3: 实现最小 emitter**

`index.js` 导出 `buildIndexes(content)` 与默认插件工厂。内部完整记录只用于 RSS/sitemap；写出：

```js
await writeJson(ctx, "static/contentIndex.json", metadata)
await writeJson(ctx, "static/searchIndex.json", search)
```

真实搜索页以 `data.filePath !== undefined` 判断；`unlisted` 页面同时从两个索引排除；实现 `emit` 与 `partialEmit` 共用同一函数，不原地删除记录字段。

- [ ] **Step 4: 切换配置但保留远端插件**

将远端 `content-index` 设为 `enabled: false`，新增 `./custom-plugins/content-index-lite`，沿用 `enableSiteMap`、`enableRSS` 配置。新目录名不得与缓存中的 `content-index` 相同。

- [ ] **Step 5: 运行 GREEN 与回归测试**

Run: `npx tsx --test custom-plugins/content-index-lite/index.test.ts quartz/components/renderPage.test.ts`

Expected: PASS；测试确认 RSS/sitemap、unlisted、虚拟页元数据和 partial emit 契约。

- [ ] **Step 6: 提交**

```bash
git add custom-plugins/content-index-lite quartz.config.yaml
git commit -m "perf: split metadata and search indexes"
```

### Task 2: 搜索首次打开时加载全文索引

**Files:**

- Create: `custom-plugins/search-lazy/package.json`
- Create: `custom-plugins/search-lazy/index.js`
- Create: `custom-plugins/search-lazy/components.js`
- Create: `custom-plugins/search-lazy/search-core.ts`
- Create: `custom-plugins/search-lazy/search-core.test.ts`
- Create: `custom-plugins/search-lazy/search.inline.ts`
- Create: `custom-plugins/search-lazy/search.css`
- Modify: `quartz.config.yaml`

- [ ] **Step 1: 写出并发去重和排序的失败测试**

```ts
test("loads the search index once for concurrent first opens", async () => {
  let calls = 0
  const ensure = createLazySearchLoader(async () => {
    calls++
    return sampleIndex
  })
  const [a, b] = await Promise.all([ensure(), ensure()])
  assert.equal(calls, 1)
  assert.equal(a, b)
})

test("ranks title matches before body-only matches", () => {
  const results = searchRecords(buildSearchRecords(sampleIndex), "quartz", 8)
  assert.deepEqual(
    results.map((item) => item.slug),
    ["quartz-title", "body-only"],
  )
})
```

- [ ] **Step 2: 运行 RED**

Run: `npx tsx --test custom-plugins/search-lazy/search-core.test.ts`

Expected: FAIL，因为 lazy loader 和搜索核心尚不存在。

- [ ] **Step 3: 实现纯搜索核心**

`createLazySearchLoader` 缓存进行中的 Promise；失败时清空缓存以允许重试。`buildSearchRecords` 只在首次加载时生成小写标题、标签和正文。`searchRecords` 使用标题前缀、标题包含、标签包含、正文包含四级权重，最多返回 8 条并生成安全文本摘要。

- [ ] **Step 4: 实现轻量组件和浏览器脚本**

组件只渲染按钮、dialog-like overlay、输入框、状态区和结果列表。`components.js` 用根目录 `esbuild.buildSync` 将 `search.inline.ts` 打包为浏览器脚本。浏览器脚本在 `nav`/`render` 只绑定 DOM；按钮或 `Cmd/Ctrl+K` 调用：

```ts
const records = await ensureSearchIndex()
showSearchOverlay()
renderResults(searchRecords(records, input.value, 8))
```

索引 URL 使用站点 base path 解析为 `static/searchIndex.json`，输入事件做 120 ms debounce，Escape 关闭，结果链接交给 Quartz SPA 路由。

- [ ] **Step 5: 切换配置**

禁用远端 `search`，新增 `search-lazy`，保持原来的 toolbar 布局、grow 和优先级。

- [ ] **Step 6: 运行 GREEN**

Run: `npx tsx --test custom-plugins/search-lazy/search-core.test.ts`

Expected: PASS，包含首次一次、失败重试、中文大小写归一、标签过滤和标题优先排序。

- [ ] **Step 7: 提交**

```bash
git add custom-plugins/search-lazy quartz.config.yaml
git commit -m "perf: load full text search on demand"
```

### Task 3: 缓存 Explorer Trie 并按需生成目录 DOM

**Files:**

- Create: `custom-plugins/explorer-lazy/package.json`
- Create: `custom-plugins/explorer-lazy/index.js`
- Create: `custom-plugins/explorer-lazy/components.js`
- Create: `custom-plugins/explorer-lazy/explorer-core.ts`
- Create: `custom-plugins/explorer-lazy/explorer-core.test.ts`
- Create: `custom-plugins/explorer-lazy/explorer.inline.ts`
- Create: `custom-plugins/explorer-lazy/explorer.css`
- Modify: `quartz.config.yaml`

- [ ] **Step 1: 写出缓存与可见节点测试**

```ts
test("reuses a trie until the content index is invalidated", async () => {
  const cache = createTrieCache()
  const first = await cache.get("default", loadIndex)
  const second = await cache.get("default", loadIndex)
  assert.equal(first, second)
  assert.equal(loadCalls, 1)
  cache.invalidate()
  await cache.get("default", loadIndex)
  assert.equal(loadCalls, 2)
})

test("only exposes roots, open folders, and the active path", () => {
  assert.deepEqual(visibleSlugs(trie, new Set(), "a/b/note"), ["a", "a/b", "a/b/note", "z"])
})
```

- [ ] **Step 2: 运行 RED**

Run: `npx tsx --test custom-plugins/explorer-lazy/explorer-core.test.ts`

Expected: FAIL，因为 Trie cache 和可见节点计算尚不存在。

- [ ] **Step 3: 实现 Trie 与缓存**

缓存键包含 `dataFns`；同 key 并发共享 Promise；失败删除 key。`content-index-updated` 调用 `invalidate()`。Trie 节点保存 slug、显示名、文件数据和有序 children；默认过滤 `tags`。

- [ ] **Step 4: 实现事件委托和惰性子树**

每次 SPA 导航只把缓存 Trie 渲染到新 Explorer 容器。根节点立即生成；当前 slug 祖先和 localStorage 中展开的目录生成子节点；其他目录只生成外壳。首次点击折叠图标时生成一次 children，并通过单个容器 click handler 处理展开、保存状态和移动端开关。

- [ ] **Step 5: 切换配置并运行 GREEN**

禁用远端 `explorer`，新增 `explorer-lazy`，保留 left/priority。运行：

Run: `npx tsx --test custom-plugins/explorer-lazy/explorer-core.test.ts`

Expected: PASS，包含不同配置隔离、失败重试、invalidate、当前路径展开和折叠状态。

- [ ] **Step 6: 提交**

```bash
git add custom-plugins/explorer-lazy quartz.config.yaml
git commit -m "perf: cache and lazily render explorer tree"
```

### Task 4: Graph 进入视口或点击后加载 D3/Pixi

**Files:**

- Create: `custom-plugins/graph-lazy/package.json`
- Create: `custom-plugins/graph-lazy/index.js`
- Create: `custom-plugins/graph-lazy/components.js`
- Create: `custom-plugins/graph-lazy/graph-load.ts`
- Create: `custom-plugins/graph-lazy/graph-load.test.ts`
- Create: `custom-plugins/graph-lazy/graph.inline.ts`
- Create: `custom-plugins/graph-lazy/graph.css`
- Modify: `quartz.config.yaml`

- [ ] **Step 1: 写出加载策略的失败测试**

```ts
test("does not auto-load the graph on mobile", () => {
  assert.equal(graphLoadAction({ mobile: true, intersecting: true, explicit: false }), "wait")
})

test("loads on desktop intersection or explicit activation", () => {
  assert.equal(graphLoadAction({ mobile: false, intersecting: true, explicit: false }), "load")
  assert.equal(graphLoadAction({ mobile: true, intersecting: false, explicit: true }), "load")
})
```

- [ ] **Step 2: 运行 RED**

Run: `npx tsx --test custom-plugins/graph-lazy/graph-load.test.ts`

Expected: FAIL，因为策略函数和库 loader 尚不存在。

- [ ] **Step 3: 实现可重试的库 loader**

`ensureGraphLibraries()` 并发去重加载 `d3@7/dist/d3.min.js` 和 `pixi.js@8/dist/pixi.min.js`；成功后缓存，失败后清空 Promise。标准化 `fetchData` 结果也只执行一次，`content-index-updated` 时失效。

- [ ] **Step 4: 延迟初始化现有 Graph 运行时**

保留局部图、全局图、拖拽、缩放、主题变化和 SPA cleanup。启动阶段仅注册：

- 桌面 `IntersectionObserver(rootMargin: "200px")`。
- 移动端“加载关系图”按钮。
- 全局图按钮和 `Cmd/Ctrl+G`。

触发后才 await libraries 和 metadata，再创建 canvas/simulation。无 IntersectionObserver 的桌面浏览器用 `requestIdleCallback` 或 1 秒 timeout 回退。

- [ ] **Step 5: 切换配置并运行 GREEN**

禁用远端 `graph`，新增 `graph-lazy`，保留 right/priority。运行：

Run: `npx tsx --test custom-plugins/graph-lazy/graph-load.test.ts`

Expected: PASS，包含移动/桌面策略、并发一次、失败重试和显式触发。

- [ ] **Step 6: 提交**

```bash
git add custom-plugins/graph-lazy quartz.config.yaml
git commit -m "perf: defer graph libraries until needed"
```

### Task 5: 生成响应式 WebP、动画 WebP 和稳定尺寸

**Files:**

- Modify: `quartz/plugins/emitters/assets.ts`
- Create: `quartz/plugins/emitters/assets.test.ts`
- Modify: `custom-plugins/reading-enhancements/index.js`
- Modify: `scripts/reading-enhancements.test.mjs`
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: 写出派生路径和候选宽度的失败测试**

```ts
test("creates only non-upscaled responsive candidates", () => {
  assert.deepEqual(responsiveWidths(1600), [720, 1440])
  assert.deepEqual(responsiveWidths(1000), [720])
  assert.deepEqual(responsiveWidths(600), [])
})

test("uses deterministic webp names", () => {
  assert.equal(responsivePath("assets/photo.png", 720), "assets/photo.w720.webp")
})
```

- [ ] **Step 2: 运行 RED**

Run: `npx tsx --test quartz/plugins/emitters/assets.test.ts scripts/reading-enhancements.test.mjs`

Expected: FAIL，因为响应式 helper 和 HAST 属性尚不存在。

- [ ] **Step 3: 扩展 Assets emitter**

对 `.png/.jpg/.jpeg/.webp/.gif` 读取 metadata；始终复制原图。大于候选宽度时用 Sharp 输出 WebP；GIF 使用 `{ animated: true }`。缓存路径为 `.quartz-cache/responsive-images/<sha256>-v1-w<width>.webp`。转换失败记录 warning 并继续，绝不删除或替换原文件。

- [ ] **Step 4: 扩展 HAST 图片属性**

将 `addLazyLoadingToImages` 改为异步增强函数：从页面 slug 和相对 `src` 定位 content 资源，读取 metadata，覆盖 `width="auto"`/`height="auto"` 为数值，按相同 helper 写入：

```js
image.properties.srcSet = variants.map(({ src, width }) => `${src} ${width}w`).join(", ")
image.properties.sizes = "(max-width: 800px) calc(100vw - 2rem), 800px"
```

外部、data、SVG 和无可用变体图片不写 `srcset`；继续保留 loading/decoding；灯箱继续使用 `currentSrc`。

- [ ] **Step 5: 缓存 CI 派生图**

在 deploy workflow 新增 `.quartz-cache/responsive-images` cache，key 包含 OS、转换版本和内容图片 hash；允许版本前缀 restore 以复用未变化图片。

- [ ] **Step 6: 运行 GREEN**

Run: `npx tsx --test quartz/plugins/emitters/assets.test.ts scripts/reading-enhancements.test.mjs`

Expected: PASS，包含 PNG/JPEG、动画 GIF 多页 metadata、外部/SVG 跳过、数值尺寸、无放大和失败 fallback。

- [ ] **Step 7: 提交**

```bash
git add quartz/plugins/emitters/assets.ts quartz/plugins/emitters/assets.test.ts custom-plugins/reading-enhancements/index.js scripts/reading-enhancements.test.mjs .github/workflows/deploy.yml
git commit -m "perf: emit cached responsive images"
```

### Task 6: 压缩标签页并按页过滤 KaTeX/OG 工作

**Files:**

- Create: `custom-plugins/tag-page-lite/package.json`
- Create: `custom-plugins/tag-page-lite/index.js`
- Create: `custom-plugins/tag-page-lite/index.test.ts`
- Create: `custom-plugins/tag-page-lite/tag-page.css`
- Modify: `quartz.config.yaml`
- Modify: `quartz/components/renderPage.tsx`
- Modify: `quartz/components/renderPage.test.ts`
- Modify: `quartz/processors/emit.ts`
- Create: `quartz/processors/emit.test.ts`
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: 写出标签总览、KaTeX 和 OG 输入测试**

```ts
test("tag index renders one compact link per tag without article previews", () => {
  const html = renderTagIndex(sampleFiles)
  assert.equal(countMatches(html, 'class="tag-index-item"'), 2)
  assert.doesNotMatch(html, /section-ul/)
})

test("filters katex resources only when the rendered tree has no math", () => {
  const filtered = filterResourcesForTree(resources, plainTree)
  assert.equal(filtered.css.some(isKatexResource), false)
  assert.equal(filterResourcesForTree(resources, mathTree).css.length, resources.css.length)
})

test("custom og images receive real files but not virtual pages", () => {
  assert.deepEqual(contentForEmitter({ name: "CustomOgImages" }, real, withVirtual), real)
})
```

- [ ] **Step 2: 运行 RED**

Run: `npx tsx --test custom-plugins/tag-page-lite/index.test.ts quartz/components/renderPage.test.ts quartz/processors/emit.test.ts`

Expected: FAIL，因为三个优化边界尚不存在。

- [ ] **Step 3: 实现轻量标签页**

本地 pageType 继续生成同样的 `tags/<tag>` URL。`tags/index` 按字母/首字符分组，只输出标签名、文章数和链接；单标签页按日期与标题列出全部文章。禁用远端 `tag-page`，启用 `tag-page-lite`。

- [ ] **Step 4: 在最终树上过滤 KaTeX 资源**

在 `renderPage` 完成 transclusion 和 tree transforms 后调用 `filterResourcesForTree`。无 `.katex` class 时移除 URL 含 `/katex@` 或 `copy-tex` 的 CSS/JS，并同步更新 `componentData.externalResources` 与尾部脚本集合；公式页完全保留。

- [ ] **Step 5: 只让 OG emitter 处理真实内容**

导出 `contentForEmitter` helper；当 emitter 名为 `CustomOgImages` 时传入原始 `content`，其他 emitter 仍传 `contentWithVirtual`。这与 OG Head 对虚拟页使用默认图的既有行为一致。

- [ ] **Step 6: 收紧插件缓存 key**

移除 `.quartz/plugins` cache 的宽泛 `restore-keys`，只恢复与 `quartz.lock.json` 完全匹配的缓存；不执行 prune，不删除现有缓存。

- [ ] **Step 7: 运行 GREEN**

Run: `npx tsx --test custom-plugins/tag-page-lite/index.test.ts quartz/components/renderPage.test.ts quartz/processors/emit.test.ts`

Expected: PASS，包含虚拟标签 URL、标签计数、transclusion 公式、普通页资源过滤和所有非 OG emitter 契约。

- [ ] **Step 8: 提交**

```bash
git add custom-plugins/tag-page-lite quartz.config.yaml quartz/components/renderPage.tsx quartz/components/renderPage.test.ts quartz/processors/emit.ts quartz/processors/emit.test.ts .github/workflows/deploy.yml
git commit -m "perf: slim tag pages and conditional resources"
```

### Task 7: 完整构建与浏览器性能验证

**Files:**

- Modify: `docs/superpowers/plans/2026-07-11-quartz-performance-overhaul.md`（只更新 checkbox）
- Create: `reports/performance-overhaul-2026-07-11.md`

- [ ] **Step 1: 运行全部自动化检查**

Run: `npm test`

Expected: 所有测试 PASS，0 failure。

Run: `npm run check`

Expected: TypeScript 与 Prettier 均 exit 0。

- [ ] **Step 2: 运行生产构建并记录资源指标**

Run: `/usr/bin/time -l npx quartz build --output /tmp/quartz-performance-overhaul --bundleInfo`

Expected: exit 0。记录时间、峰值 RSS、输出体积、`contentIndex.json`、`searchIndex.json`、`tags/index.html`、响应式图片数量和 OG 图片数量。

- [ ] **Step 3: 运行桌面和移动浏览器回归**

用本地静态服务器和 Playwright 验证：

- 首页加载后未请求 `searchIndex.json`、D3、Pixi。
- 点击搜索后只请求一次全文索引，中文/英文查询可用。
- 桌面 Graph 进入视口后加载；移动端点击后加载；SPA 导航无重复 canvas。
- Explorer 导航后复用数据，折叠目录首次点击生成子节点。
- 大图有数值尺寸和 WebP `srcset`，灯箱显示 `currentSrc`。
- 普通页无 KaTeX，公式页有 KaTeX；标签总览可用。

- [ ] **Step 4: 运行移动端 Lighthouse**

Run: `npx lighthouse http://127.0.0.1:<port>/ --output=json --output-path=/tmp/quartz-lighthouse-mobile-after.json --chrome-flags='--headless --no-sandbox'`

Expected: 报告成功生成；Performance 高于 43，TBT 低于 1,073 ms，首屏传输不含全文索引与图形库。

- [ ] **Step 5: 写性能对比报告并最终审查**

报告列出基线、改造后、差值、未解决风险和复现实验命令。随后进行一次全量规格审查和代码质量审查，修复所有 Critical/Important 问题并重新运行受影响验证。

- [ ] **Step 6: 提交验证报告**

```bash
git add docs/superpowers/plans/2026-07-11-quartz-performance-overhaul.md reports/performance-overhaul-2026-07-11.md
git commit -m "docs: record performance overhaul results"
```
