import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { render } from "preact-render-to-string"

import plugin, {
  ReadingEnhancements,
  addLazyLoadingToImages,
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
})
