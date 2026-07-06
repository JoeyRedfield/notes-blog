#!/usr/bin/env node
import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { globby } from "globby"

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
export const repoRoot = path.resolve(scriptDir, "..")
export const sourceFontPath = "quartz/static/fonts/LXGWWenKai-Regular.ttf"
export const outputFontPath = "quartz/static/fonts/LXGWWenKai-Regular.subset.woff2"
export const subsetContentPatterns = ["content/**/*.{md,mdx}", "content/index.md"]

export const fallbackSubsetText = `
HenryWu's Blog
阅读提示：如果页面字体看着偏小或偏大，可以直接用浏览器缩放；macOS 按 Command (⌘) + + 放大、Command (⌘) + - 缩小、Command (⌘) + 0 还原，Windows/Linux 按 Ctrl + +、Ctrl + -、Ctrl + 0。
返回顶部 图片预览 关闭图片预览 搜索 目录 暗色模式 亮色模式 阅读模式 联系我
© ❯
，。！？；：“”‘’（）《》〈〉【】「」『』、·…—－～￥%
0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz
`

export function uniqueCharacters(text) {
  return Array.from(new Set(Array.from(text)))
    .sort()
    .join("")
}

export async function collectSubsetText(rootDir = repoRoot, patterns = subsetContentPatterns) {
  const files = await globby(patterns, {
    cwd: rootDir,
    absolute: true,
    gitignore: true,
    onlyFiles: true,
  })

  const chunks = [fallbackSubsetText]
  for (const file of files) {
    chunks.push(await readFile(file, "utf8"))
  }

  return uniqueCharacters(chunks.join("\n"))
}

export function subsetFont(text, rootDir = repoRoot) {
  const source = path.join(rootDir, sourceFontPath)
  const output = path.join(rootDir, outputFontPath)
  if (!existsSync(source)) {
    throw new Error(`Source font not found: ${source}`)
  }

  const tempDir = mkdtempSync(path.join(tmpdir(), "lxgw-font-subset-"))
  const textFile = path.join(tempDir, "subset.txt")

  try {
    writeFileSync(textFile, text, "utf8")
    const result = spawnSync(
      "python3",
      [
        "-m",
        "fontTools.subset",
        source,
        `--text-file=${textFile}`,
        `--output-file=${output}`,
        "--flavor=woff2",
        "--layout-features=*",
        "--glyph-names",
        "--symbol-cmap",
        "--legacy-cmap",
        "--notdef-glyph",
        "--notdef-outline",
        "--recommended-glyphs",
        "--no-hinting",
      ],
      { cwd: rootDir, stdio: "inherit" },
    )

    if (result.status !== 0) {
      throw new Error(`fontTools.subset exited with status ${result.status}`)
    }

    return {
      characterCount: Array.from(text).length,
      sourceBytes: statSync(source).size,
      outputBytes: statSync(output).size,
      output,
    }
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const text = await collectSubsetText()
  const result = subsetFont(text)
  const ratio = ((result.outputBytes / result.sourceBytes) * 100).toFixed(1)
  console.log(
    `Generated ${outputFontPath} with ${result.characterCount} unique characters (${result.outputBytes} bytes, ${ratio}% of source TTF).`,
  )
}
