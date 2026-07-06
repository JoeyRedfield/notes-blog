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
  assert.equal(resources.additionalHead.length, 1)

  const preload = resources.additionalHead[0]({ slug: "lienjack/ai/example" })

  assert.equal(preload.type, "link")
  assert.equal(preload.props.rel, "preload")
  assert.equal(preload.props.as, "font")
  assert.equal(preload.props.type, "font/woff2")
  assert.equal(preload.props.crossOrigin, "anonymous")
  assert.equal(preload.props.href, "../../static/fonts/LXGWWenKai-Regular.subset.woff2")

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
