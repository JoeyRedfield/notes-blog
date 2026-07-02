import assert from "node:assert/strict"
import { existsSync, readFileSync, statSync } from "node:fs"
import { test } from "node:test"

import {
  collectSubsetText,
  fallbackSubsetText,
  outputFontPath,
  sourceFontPath,
} from "./subset-lxgw-font.mjs"

function assertContainsCharacters(text, required) {
  for (const character of Array.from(required)) {
    assert.ok(text.includes(character), `subset text should include ${character}`)
  }
}

test("collects deterministic subset text with required interface copy", async () => {
  const text = await collectSubsetText(process.cwd(), ["content/index.md"])

  assert.equal(
    text,
    Array.from(new Set(Array.from(text)))
      .sort()
      .join(""),
  )
  assertContainsCharacters(text, "阅读提示")
  assertContainsCharacters(text, "返回顶部")
  assert.match(fallbackSubsetText, /Command/)
})

test("committed LXGW subset font exists and is smaller than the full font", () => {
  assert.equal(existsSync(outputFontPath), true)

  const subsetSize = statSync(outputFontPath).size
  const fullTtfSize = statSync(sourceFontPath).size
  const fullWoff2Size = statSync("quartz/static/fonts/LXGWWenKai-Regular.woff2").size

  assert.ok(subsetSize > 100_000, `subset font is unexpectedly small: ${subsetSize}`)
  assert.ok(subsetSize < fullTtfSize, `subset font should be smaller than TTF: ${subsetSize}`)
  assert.ok(
    subsetSize < fullWoff2Size,
    `subset font should be smaller than full WOFF2: ${subsetSize}`,
  )
})

test("custom styles prefer the subset family before the full LXGW font", () => {
  const css = readFileSync("quartz/styles/custom.scss", "utf8")

  assert.match(css, /LXGWWenKai-Regular\.subset\.woff2/)
  assert.ok(
    css.indexOf('"LXGW WenKai Subset"') < css.indexOf('font-family: "LXGW WenKai";'),
    "subset @font-face should be declared before the full font",
  )
  assert.match(css, /"LXGW WenKai Subset", "LXGW WenKai"/)
})
