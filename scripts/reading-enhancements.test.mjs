import assert from "node:assert/strict"
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
  assert.match(html, /class="image-lightbox"/)
  assert.match(readingEnhancementsScript, /document\.addEventListener\("nav"/)
  assert.match(readingEnhancementsScript, /document\.addEventListener\("render"/)
  assert.match(readingEnhancementsScript, /scrollTo/)
  assert.match(readingEnhancementsScript, /is-active/)
  assert.match(readingEnhancementsScript, /data-for/)
  assert.match(readingEnhancementsScript, /readingEnhancementsBound/)
  assert.match(readingEnhancementsScript, /dataset\.readingEnhancementsBound === "true"/)
  assert.match(readingEnhancementsScript, /delete root\.dataset\.readingEnhancementsBound/)
})
