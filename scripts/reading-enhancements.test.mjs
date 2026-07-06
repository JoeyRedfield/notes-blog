import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { render } from "preact-render-to-string"

import plugin, {
  ReadingEnhancements,
  addLazyLoadingToImages,
  fontPreloadHref,
  fontSubsetPath,
  readingEnhancementsScript,
  themeColorDark,
  themeColorLight,
} from "../custom-plugins/reading-enhancements/index.js"

test("adds lazy loading and async decoding to article images without overriding explicit loading", () => {
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
                properties: { src: "hero.png", loading: "eager" },
                children: [],
              },
            ],
          },
        ],
      },
    ],
  }

  addLazyLoadingToImages(tree)

  const [article] = tree.children
  const [firstImage, paragraph] = article.children
  const [explicitImage] = paragraph.children

  assert.equal(firstImage.properties.loading, "lazy")
  assert.equal(firstImage.properties.decoding, "async")
  assert.equal(explicitImage.properties.loading, "eager")
  assert.equal(explicitImage.properties.decoding, "async")
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
  assert.doesNotMatch(css, /font-variation-settings/)
  assert.doesNotMatch(css, /font-optical-sizing/)
})

test("custom styles include print-friendly reading output", () => {
  const css = readFileSync("quartz/styles/custom.scss", "utf8")

  assert.match(css, /@media print/)
  assert.match(css, /\.sidebar,[\s\S]*\.search,[\s\S]*\.darkmode,[\s\S]*\.readermode/)
  assert.match(css, /\.back-to-top,[\s\S]*\.skip-to-content,[\s\S]*\.breadcrumb-container,[\s\S]*footer/)
  assert.match(css, /display: none !important/)
  assert.match(css, /article a\[href\^="http"\]::after[\s\S]*content: " \(" attr\(href\) "\)"/)
  assert.match(css, /article a\.external\[href\^="http"\]:not\(:has\(> img\)\)::after/)
  assert.match(css, /article a\.external:not\(\[href\^="http"\]\):not\(:has\(> img\)\)::after[\s\S]*display: none !important/)
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

  assert.match(css, /article h1\[id\] > a\[role="anchor"\],[\s\S]*article h6\[id\] > a\[role="anchor"\]/)
  assert.match(css, /content: "#"/)
  assert.match(css, /article h1\[id\] > a\[role="anchor"\] > svg,[\s\S]*article h6\[id\] > a\[role="anchor"\] > svg[\s\S]*display: none/)
  assert.match(css, /opacity: 0/)
  assert.match(css, /article h1\[id\]:hover > a\[role="anchor"\],[\s\S]*article h6\[id\]:hover > a\[role="anchor"\]/)
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

  assert.match(css, /@media all and \(\$mobile\)[\s\S]*\.search > \.search-container\s*{[\s\S]*height: 100dvh/)
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
  assert.match(css, /@media all and \(\$mobile\)[\s\S]*button\.toc-header\s*{[\s\S]*min-height: 44px/)
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
  assert.match(css, /@media all and \(\$mobile\)[\s\S]*a\.internal\.tag-link\s*{[\s\S]*min-height: 44px/)
})
