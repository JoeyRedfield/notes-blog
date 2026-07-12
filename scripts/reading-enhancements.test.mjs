import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { after, before, describe, test } from "node:test"
import { h } from "preact"
import { render } from "preact-render-to-string"
import sharp from "sharp"
import YAML from "yaml"
import { normalizeHastElement, slugifyFilePath } from "@quartz-community/utils"
import { responsivePath } from "../quartz/plugins/emitters/responsive-images.js"

import plugin, {
  ReadingEnhancements,
  addLazyLoadingToImages,
  fontPreloadHref,
  fontSubsetPath,
  readingEnhancementsScript,
  themeColorDark,
  themeColorLight,
} from "../custom-plugins/reading-enhancements/index.js"

test("adds lazy loading and async decoding to article images without overriding explicit loading", async () => {
  const tree = {
    type: "root",
    children: [
      {
        type: "element",
        tagName: "article",
        properties: {},
        children: [
          {
            type: "element",
            tagName: "img",
            properties: { src: "a.png", alt: "A" },
            children: [],
          },
          {
            type: "element",
            tagName: "p",
            properties: {},
            children: [
              {
                type: "element",
                tagName: "img",
                properties: { src: "hero.png", loading: "eager", decoding: "sync" },
                children: [],
              },
            ],
          },
        ],
      },
    ],
  }

  await addLazyLoadingToImages(tree)

  const [article] = tree.children
  const [firstImage, paragraph] = article.children
  const [explicitImage] = paragraph.children

  assert.equal(firstImage.properties.loading, "lazy")
  assert.equal(firstImage.properties.decoding, "async")
  assert.equal(explicitImage.properties.loading, "eager")
  assert.equal(explicitImage.properties.decoding, "sync")
})

async function writeAnimatedGif(fp, width = 800, pageHeight = 40) {
  const pages = 2
  const channels = 4
  const pixels = Buffer.alloc(width * pageHeight * pages * channels)
  for (let y = 0; y < pageHeight * pages; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * channels
      pixels[offset] = y < pageHeight ? 255 : 0
      pixels[offset + 1] = y < pageHeight ? 0 : 255
      pixels[offset + 2] = 0
      pixels[offset + 3] = 255
    }
  }

  await sharp(pixels, {
    raw: { width, height: pageHeight * pages, pageHeight, channels },
  })
    .gif({ delay: [100, 100], loop: 0 })
    .toFile(fp)
}

describe("responsive article images", () => {
  let root
  let contentDir
  let cacheDir
  let pageFile
  let ctx

  before(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), "reading-responsive-images-"))
    contentDir = path.join(root, "content")
    cacheDir = path.join(root, "cache")
    await mkdir(path.join(contentDir, "知识", "图片 目录"), { recursive: true })
    await sharp({
      create: { width: 1600, height: 900, channels: 3, background: "#cc4422" },
    })
      .png()
      .toFile(path.join(contentDir, "知识", "图片 目录", "封面 图.PNG"))
    await writeAnimatedGif(path.join(contentDir, "知识", "图片 目录", "动画.GIF"))
    await sharp({
      create: { width: 600, height: 400, channels: 3, background: "#336699" },
    })
      .webp()
      .toFile(path.join(contentDir, "知识", "图片 目录", "小 图.webp"))
    await Promise.all([
      sharp({
        create: { width: 1000, height: 500, channels: 3, background: "#226688" },
      })
        .png()
        .toFile(path.join(contentDir, "知识", "图片 目录", "冲突 图.PNG")),
      sharp({
        create: { width: 600, height: 300, channels: 3, background: "#882266" },
      })
        .webp()
        .toFile(path.join(contentDir, "知识", "图片 目录", "冲突-图.PNG.w720.webp")),
    ])
    await writeFile(path.join(contentDir, "知识", "图片 目录", "损坏.jpg"), "not an image")
    await writeFile(
      path.join(contentDir, "知识", "图片 目录", "vector.svg"),
      '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="500"></svg>',
    )

    pageFile = {
      data: {
        slug: "知识/嵌套-页面",
        relativePath: "知识/嵌套 页面.md",
        filePath: path.join(contentDir, "知识", "嵌套 页面.md"),
      },
    }
    ctx = {
      argv: { directory: contentDir },
      cfg: { configuration: { baseUrl: "joeyredfield.github.io/notes-blog" } },
      allFiles: [
        "知识/嵌套 页面.md",
        "知识/图片 目录/封面 图.PNG",
        "知识/图片 目录/动画.GIF",
        "知识/图片 目录/小 图.webp",
        "知识/图片 目录/冲突 图.PNG",
        "知识/图片 目录/冲突-图.PNG.w720.webp",
        "知识/图片 目录/损坏.jpg",
        "知识/图片 目录/vector.svg",
      ],
    }
  })

  after(async () => {
    await rm(root, { recursive: true, force: true })
  })

  test("adds natural dimensions and stable base-path variants for nested localized assets", async () => {
    const tree = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "img",
          properties: { src: encodeURI("./图片-目录/封面-图.PNG") },
          children: [],
        },
        {
          type: "element",
          tagName: "img",
          properties: { src: encodeURI("./图片-目录/动画.GIF") },
          children: [],
        },
        {
          type: "element",
          tagName: "img",
          properties: {
            src: encodeURI("./图片-目录/封面-图.PNG"),
            width: "auto",
            height: "auto",
          },
          children: [],
        },
        {
          type: "element",
          tagName: "img",
          properties: {
            src: encodeURI("./图片-目录/封面-图.PNG"),
            srcSet: "/custom/image.webp 1x",
            sizes: "50vw",
          },
          children: [],
        },
      ],
    }

    await addLazyLoadingToImages(tree, pageFile, ctx, { cacheDir })

    const [image, animated, autoSized, explicitSrcSet] = tree.children
    const base = encodeURI("/notes-blog/知识/图片-目录/封面-图.PNG")
    assert.equal(image.properties.width, 1600)
    assert.equal(image.properties.height, 900)
    assert.equal(image.properties.srcSet, `${base}.w720.webp 720w, ${base}.w1440.webp 1440w`)
    assert.equal(image.properties.sizes, "(max-width: 800px) calc(100vw - 2rem), 800px")
    assert.equal(animated.properties.width, 800)
    assert.equal(animated.properties.height, 40)
    assert.equal(
      animated.properties.srcSet,
      `${encodeURI("/notes-blog/知识/图片-目录/动画.GIF")}.w720.webp 720w`,
    )
    assert.equal(autoSized.properties.width, 1600)
    assert.equal(autoSized.properties.height, 900)
    assert.equal(explicitSrcSet.properties.srcSet, "/custom/image.webp 1x")
    assert.equal(explicitSrcSet.properties.sizes, "50vw")

    const html = render(h("img", image.properties))
    assert.match(html, /srcset="[^"]+w720\.webp 720w, [^"]+w1440\.webp 1440w"/)
    assert.doesNotMatch(html, /srcSet=/)

    const transcluded = normalizeHastElement(image, "知识/嵌套-页面", "其他/目标页面")
    assert.notEqual(transcluded.properties.src, image.properties.src)
    assert.equal(transcluded.properties.srcSet, image.properties.srcSet)
  })

  test("uses root-relative variants while serving locally", async () => {
    const tree = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "img",
          properties: { src: encodeURI("./图片-目录/封面-图.PNG") },
          children: [],
        },
      ],
    }
    const serveCtx = {
      ...ctx,
      argv: { ...ctx.argv, serve: true },
    }

    await addLazyLoadingToImages(tree, pageFile, serveCtx, { cacheDir })

    const [image] = tree.children
    const rootAsset = encodeURI("/知识/图片-目录/封面-图.PNG")
    assert.equal(
      image.properties.srcSet,
      `${rootAsset}.w720.webp 720w, ${rootAsset}.w1440.webp 1440w`,
    )
    assert.doesNotMatch(image.properties.srcSet, /\/notes-blog\//)
  })

  test("matches the Assets collision-free path when a legal source occupies the preferred URL", async () => {
    const tree = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "img",
          properties: { src: encodeURI("./图片-目录/冲突-图.PNG") },
          children: [],
        },
      ],
    }
    const occupied = ctx.allFiles.map((fp) => slugifyFilePath(fp))
    const outputPath = "知识/图片-目录/冲突-图.PNG"
    const expectedVariant = responsivePath(outputPath, 720, occupied)

    await addLazyLoadingToImages(tree, pageFile, ctx, { cacheDir })

    assert.notEqual(expectedVariant, `${outputPath}.w720.webp`)
    assert.equal(
      tree.children[0].properties.srcSet,
      `${encodeURI(`/notes-blog/${expectedVariant}`)} 720w`,
    )
  })

  test("skips unsupported sources and keeps local fallbacks when no variant is usable", async () => {
    const skippedSources = [
      "https://example.com/image.png",
      "http://example.com/image.png",
      "//cdn.example.com/image.png",
      "data:image/png;base64,AAAA",
      "blob:https://example.com/id",
      encodeURI("./图片-目录/vector.svg"),
      encodeURI("./图片-目录/missing.png"),
    ]
    const tree = {
      type: "root",
      children: [
        ...skippedSources.map((src) => ({
          type: "element",
          tagName: "img",
          properties: { src },
          children: [],
        })),
        {
          type: "element",
          tagName: "img",
          properties: { src: encodeURI("./图片-目录/小-图.webp") },
          children: [],
        },
        {
          type: "element",
          tagName: "img",
          properties: { src: encodeURI("./图片-目录/损坏.jpg") },
          children: [],
        },
        {
          type: "element",
          tagName: "img",
          properties: { src: encodeURI("./图片 目录/封面 图.PNG") },
          children: [],
        },
      ],
    }
    const warnings = []
    const originalWarn = console.warn
    console.warn = (message) => warnings.push(String(message))
    try {
      await addLazyLoadingToImages(tree, pageFile, ctx, { cacheDir })
    } finally {
      console.warn = originalWarn
    }

    for (const image of tree.children.slice(0, skippedSources.length)) {
      assert.equal(image.properties.loading, "lazy")
      assert.equal(image.properties.decoding, "async")
      assert.equal(image.properties.srcSet, undefined)
      assert.equal(image.properties.sizes, undefined)
    }

    const [small, broken, rawSource] = tree.children.slice(skippedSources.length)
    assert.equal(small.properties.width, 600)
    assert.equal(small.properties.height, 400)
    assert.equal(small.properties.srcSet, undefined)
    assert.equal(small.properties.sizes, undefined)
    assert.equal(broken.properties.width, undefined)
    assert.equal(broken.properties.srcSet, undefined)
    assert.equal(warnings.length, 1)
    assert.match(warnings[0], /损坏\.jpg/)
    assert.equal(rawSource.properties.width, 1600)
    assert.match(rawSource.properties.srcSet, /w720\.webp 720w/)
  })

  test("does not advertise variants when cache generation fails", async () => {
    const blockedCache = path.join(root, "blocked-cache")
    await writeFile(blockedCache, "not a directory")
    const tree = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "img",
          properties: { src: encodeURI("./图片-目录/封面-图.PNG") },
          children: [],
        },
      ],
    }
    const warnings = []
    const originalWarn = console.warn
    console.warn = (message) => warnings.push(String(message))
    try {
      await addLazyLoadingToImages(tree, pageFile, ctx, { cacheDir: blockedCache })
    } finally {
      console.warn = originalWarn
    }

    const [image] = tree.children
    assert.equal(image.properties.width, 1600)
    assert.equal(image.properties.height, 900)
    assert.equal(image.properties.srcSet, undefined)
    assert.equal(image.properties.sizes, undefined)
    assert.equal(warnings.length, 1)
    assert.match(warnings[0], /responsive image cache/)
  })
})

test("exports a Quartz transformer that registers the image loading rehype plugin", () => {
  const transformer = plugin()

  assert.equal(transformer.name, "ReadingEnhancements")
  assert.equal(typeof transformer.htmlPlugins, "function")
  assert.equal(transformer.htmlPlugins().length, 1)
})

test("injects a page-relative preload for the LXGW subset font", () => {
  const transformer = plugin()
  const resources = transformer.externalResources({
    cfg: { configuration: { baseUrl: "joeyredfield.github.io/notes-blog" } },
  })

  assert.equal(fontSubsetPath, "static/fonts/LXGWWenKai-Regular.subset.woff2")
  assert.equal(resources.additionalHead.length, 3)

  const preload = resources.additionalHead[0]({ slug: "lienjack/ai/example" })
  const lightThemeColor = resources.additionalHead[1]
  const darkThemeColor = resources.additionalHead[2]

  assert.equal(preload.type, "link")
  assert.equal(preload.props.rel, "preload")
  assert.equal(preload.props.as, "font")
  assert.equal(preload.props.type, "font/woff2")
  assert.equal(preload.props.crossOrigin, "anonymous")
  assert.equal(preload.props.href, "../../static/fonts/LXGWWenKai-Regular.subset.woff2")

  assert.equal(themeColorLight, "#faf7f2")
  assert.equal(themeColorDark, "#1f1c18")
  assert.equal(lightThemeColor.type, "meta")
  assert.equal(lightThemeColor.props.name, "theme-color")
  assert.equal(lightThemeColor.props.content, themeColorLight)
  assert.equal(lightThemeColor.props.media, "(prefers-color-scheme: light)")
  assert.equal(lightThemeColor.props["data-theme-color"], "light")
  assert.equal(darkThemeColor.type, "meta")
  assert.equal(darkThemeColor.props.name, "theme-color")
  assert.equal(darkThemeColor.props.content, themeColorDark)
  assert.equal(darkThemeColor.props.media, "(prefers-color-scheme: dark)")
  assert.equal(darkThemeColor.props["data-theme-color"], "dark")

  assert.equal(fontPreloadHref({ slug: "index" }), "./static/fonts/LXGWWenKai-Regular.subset.woff2")
  assert.equal(
    fontPreloadHref({ slug: "lienjack/ai/learn-llm/index" }),
    "../../../static/fonts/LXGWWenKai-Regular.subset.woff2",
  )
  assert.equal(
    fontPreloadHref({ slug: "404" }, "/notes-blog"),
    "/notes-blog/static/fonts/LXGWWenKai-Regular.subset.woff2",
  )
})

test("deploy workflow caches content-addressed responsive images independently", () => {
  const workflow = YAML.parse(readFileSync(".github/workflows/deploy.yml", "utf8"))
  const responsiveCache = workflow.jobs.build.steps.find(
    (step) => step.name === "Cache responsive images",
  )

  assert.ok(responsiveCache)
  assert.equal(responsiveCache.with.path, ".quartz-cache/responsive-images")
  assert.match(responsiveCache.with.key, /runner\.os.*responsive-images-v1-.*hashFiles/)
  for (const extensionGlob of [
    "[pP][nN][gG]",
    "[jJ][pP][gG]",
    "[jJ][pP][eE][gG]",
    "[wW][eE][bB][pP]",
    "[gG][iI][fF]",
  ]) {
    assert.ok(responsiveCache.with.key.includes(`content/**/*.${extensionGlob}`))
  }
  assert.equal(
    responsiveCache.with["restore-keys"].trim(),
    "${{ runner.os }}-responsive-images-v1-",
  )
})

test("renders the reading enhancement controls and ships SPA-aware script hooks", () => {
  const Component = ReadingEnhancements()
  const html = render(Component({}))

  assert.match(html, /class="back-to-top"/)
  assert.match(html, /tabindex="-1"/)
  assert.match(html, /class="skip-to-content"/)
  assert.match(html, /href="#quartz-body"/)
  assert.match(html, /class="image-lightbox"/)
  assert.match(readingEnhancementsScript, /document\.addEventListener\("nav"/)
  assert.match(readingEnhancementsScript, /document\.addEventListener\("render"/)
  assert.match(readingEnhancementsScript, /prefers-reduced-motion: reduce/)
  assert.match(readingEnhancementsScript, /scrollTo/)
  assert.match(readingEnhancementsScript, /tabIndex = isVisible \? 0 : -1/)
  assert.match(readingEnhancementsScript, /removeAttribute\("aria-expanded"\)/)
  assert.match(readingEnhancementsScript, /IntersectionObserver/)
  assert.doesNotMatch(
    readingEnhancementsScript,
    /window\.addEventListener\("scroll", updateActiveToc/,
  )
  assert.doesNotMatch(readingEnhancementsScript, /getBoundingClientRect\(\)/)
  assert.match(readingEnhancementsScript, /window\.scrollY \+ 128/)
  assert.match(readingEnhancementsScript, /heading\.offsetTop <= activeOffset/)
  assert.match(readingEnhancementsScript, /is-active/)
  assert.match(readingEnhancementsScript, /data-for/)
  assert.match(readingEnhancementsScript, /readingEnhancementsBound/)
  assert.match(readingEnhancementsScript, /dataset\.readingEnhancementsBound === "true"/)
  assert.match(readingEnhancementsScript, /delete root\.dataset\.readingEnhancementsBound/)
  assert.match(readingEnhancementsScript, /lastLightboxTrigger/)
  assert.match(readingEnhancementsScript, /放大图片/)
  assert.match(readingEnhancementsScript, /themechange/)
  assert.match(readingEnhancementsScript, /syncThemeColorMeta/)
  assert.match(readingEnhancementsScript, /data-theme-color/)
  assert.match(readingEnhancementsScript, /not all/)
  assert.match(readingEnhancementsScript, /setupMobileTocCollapsed/)
  assert.match(readingEnhancementsScript, /max-width: 800px/)
  assert.match(readingEnhancementsScript, /\.toc-header/)
  assert.match(readingEnhancementsScript, /\.toc-content/)
  assert.match(Component.css, /skip-to-content/)
  assert.match(Component.css, /prefers-reduced-motion: reduce/)
  assert.match(Component.css, /focus-visible/)
})

test("custom styles include accessible motion and focus affordances", () => {
  const css = readFileSync("quartz/styles/custom.scss", "utf8")

  assert.match(css, /prefers-reduced-motion: reduce/)
  assert.match(css, /outline: 2px solid var\(--accent\)/)
  assert.match(css, /\.breadcrumb-container a:focus-visible/)
  assert.match(css, /\.tag-link:focus-visible/)
  assert.match(css, /footer a:focus-visible/)
  assert.match(css, /ul\.toc-content\.overflow > li > a:focus-visible/)
  assert.match(css, /\.breadcrumb-container p/)
  assert.match(css, /article\s+img\s*\{[^}]*height:\s*auto/s)
  assert.doesNotMatch(css, /font-variation-settings/)
  assert.doesNotMatch(css, /font-optical-sizing/)
})

test("custom styles include print-friendly reading output", () => {
  const css = readFileSync("quartz/styles/custom.scss", "utf8")

  assert.match(css, /@media print/)
  assert.match(css, /\.sidebar,[\s\S]*\.search,[\s\S]*\.darkmode,[\s\S]*\.readermode/)
  assert.match(
    css,
    /\.back-to-top,[\s\S]*\.skip-to-content,[\s\S]*\.breadcrumb-container,[\s\S]*footer/,
  )
  assert.match(css, /display: none !important/)
  assert.match(css, /article a\[href\^="http"\]::after[\s\S]*content: " \(" attr\(href\) "\)"/)
  assert.match(css, /article a\.external\[href\^="http"\]:not\(:has\(> img\)\)::after/)
  assert.match(
    css,
    /article a\.external:not\(\[href\^="http"\]\):not\(:has\(> img\)\)::after[\s\S]*display: none !important/,
  )
  assert.match(css, /pre,[\s\S]*pre > code[\s\S]*white-space: pre-wrap/)
})

test("custom styles improve code block scanning without covering controls", () => {
  const css = readFileSync("quartz/styles/custom.scss", "utf8")

  assert.match(css, /pre\s*{[\s\S]*max-height: 32rem/)
  assert.match(css, /pre\s*{[\s\S]*overflow: auto/)
  assert.match(css, /pre\[data-language\]:not\(\[data-language=""\]\)::before/)
  assert.match(css, /content: attr\(data-language\)/)
  assert.match(css, /pre > \.clipboard-button\s*{[\s\S]*top: 0\.55rem/)
  assert.match(css, /pre > \.clipboard-button\s*{[\s\S]*right: 0\.55rem/)
})

test("custom styles expose heading anchors and external links intentionally", () => {
  const css = readFileSync("quartz/styles/custom.scss", "utf8")

  assert.match(
    css,
    /article h1\[id\] > a\[role="anchor"\],[\s\S]*article h6\[id\] > a\[role="anchor"\]/,
  )
  assert.match(css, /content: "#"/)
  assert.match(
    css,
    /article h1\[id\] > a\[role="anchor"\] > svg,[\s\S]*article h6\[id\] > a\[role="anchor"\] > svg[\s\S]*display: none/,
  )
  assert.match(css, /opacity: 0/)
  assert.match(
    css,
    /article h1\[id\]:hover > a\[role="anchor"\],[\s\S]*article h6\[id\]:hover > a\[role="anchor"\]/,
  )
  assert.match(css, /article a\.external:not\(:has\(> img\)\)::after/)
  assert.match(css, /content: "↗"/)
  assert.match(css, /article a\.external \.external-icon[\s\S]*display: none/)
})

test("custom styles make table headers sticky when the scroll container supports it", () => {
  const css = readFileSync("quartz/styles/custom.scss", "utf8")

  assert.match(css, /\.table-container\s*{[\s\S]*overflow: auto/)
  assert.match(css, /\.table-container th\s*{[\s\S]*position: sticky/)
  assert.match(css, /\.table-container th\s*{[\s\S]*top: 0/)
  assert.match(css, /\.table-container th\s*{[\s\S]*z-index: 1/)
})

test("custom styles keep visual polish consistent across scrollbars and the home list", () => {
  const css = readFileSync("quartz/styles/custom.scss", "utf8")

  assert.match(
    css,
    /:root\s*{[\s\S]*scrollbar-color: color-mix\(in srgb, var\(--gray\) 50%, transparent\) transparent/,
  )
  assert.match(css, /pre\s*{[\s\S]*scrollbar-width: thin/)
  assert.match(css, /\.table-container\s*{[\s\S]*scrollbar-width: thin/)
  assert.match(css, /body\[data-slug="index"\] article \.markdown-preview-view > ul > li/)
  assert.match(css, /margin: 0\.35rem 0/)
  assert.doesNotMatch(css, /\.page > #quartz-body \.sidebar\s*{[\s\S]*scrollbar-color/)
})

test("custom styles improve mobile search, toc, and touch ergonomics", () => {
  const css = readFileSync("quartz/styles/custom.scss", "utf8")

  assert.match(
    css,
    /@media all and \(\$mobile\)[\s\S]*\.search > \.search-container\s*{[\s\S]*height: 100dvh/,
  )
  assert.match(
    css,
    /@media all and \(\$mobile\)[\s\S]*\.search > \.search-container\s*{[\s\S]*overscroll-behavior: contain/,
  )
  assert.match(
    css,
    /@media all and \(\$mobile\)[\s\S]*\.search > \.search-container > \.search-space\s*{[\s\S]*width: calc\(100% - 2rem\)/,
  )
  assert.match(
    css,
    /@media all and \(\$mobile\)[\s\S]*\.page > #quartz-body \.sidebar\.left\s*{[\s\S]*width: 100%/,
  )
  assert.match(
    css,
    /@media all and \(\$mobile\)[\s\S]*\.page > #quartz-body \.sidebar\.left\s*{[\s\S]*flex-wrap: wrap/,
  )
  assert.match(css, /@media all and \(\$mobile\)[\s\S]*\.page-title\s*{[\s\S]*min-width: 0/)
  assert.match(
    css,
    /@media all and \(\$mobile\)[\s\S]*\.search > \.search-container > \.search-space > \.search-layout > \.preview-container\s*{[\s\S]*display: none !important/,
  )
  assert.match(
    css,
    /@media all and \(\$mobile\)[\s\S]*\.search > \.search-container > \.search-space > \.search-layout > \.results-container[\s\S]*max-height: calc\(100dvh - 8\.5rem\)/,
  )
  assert.match(
    css,
    /@media all and \(\$mobile\)[\s\S]*button\.toc-header\s*{[\s\S]*min-height: 44px/,
  )
  assert.match(
    css,
    /@media all and \(\$mobile\)[\s\S]*\.search > \.search-button,[\s\S]*\.readermode\s*{[\s\S]*min-width: 44px/,
  )
  assert.match(
    css,
    /@media all and \(\$mobile\)[\s\S]*\.page > #quartz-body \.sidebar\.right\s*{[\s\S]*flex-direction: column/,
  )
  assert.match(
    css,
    /@media all and \(\$mobile\)[\s\S]*\.page > #quartz-body \.sidebar\.right > \.toc\s*{[\s\S]*display: block/,
  )
  assert.match(
    css,
    /@media all and \(\$mobile\)[\s\S]*\.page > #quartz-body \.sidebar\.right > \.toc \.toc-content\.collapsed\s*{[\s\S]*display: none/,
  )
  assert.match(
    css,
    /@media all and \(\$mobile\)[\s\S]*\.explorer-content ul li > a,[\s\S]*footer a\s*{[\s\S]*min-height: 44px/,
  )
  assert.match(
    css,
    /@media all and \(\$mobile\)[\s\S]*a\.internal\.tag-link\s*{[\s\S]*min-height: 44px/,
  )
})
