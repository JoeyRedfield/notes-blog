import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import test from "node:test"
import assert from "node:assert/strict"
import { fileURLToPath } from "node:url"

import {
  findMarkdownFiles,
  getReferencedAttachments,
  isExcludedPath,
  scanSensitiveTerms,
  syncPublicNotes,
} from "./sync-public-notes.mjs"

async function withTempDir(fn) {
  const dir = await mkdtemp(path.join(tmpdir(), "public-notes-sync-"))
  try {
    await fn(dir)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

test("isExcludedPath matches full path segments only", () => {
  assert.equal(isExcludedPath("个人信息/README.md", ["个人信息"]), true)
  assert.equal(isExcludedPath("ai应用开发/个人信息处理.md", ["个人信息"]), false)
  assert.equal(isExcludedPath(".obsidian/app.json", [".obsidian"]), true)
})

test("findMarkdownFiles includes markdown under allowlisted directories and skips excluded dirs", async () => {
  await withTempDir(async (vault) => {
    await mkdir(path.join(vault, "ai应用开发"), { recursive: true })
    await mkdir(path.join(vault, "个人信息"), { recursive: true })
    await mkdir(path.join(vault, "ai应用开发", "assets"), { recursive: true })
    await writeFile(path.join(vault, "ai应用开发", "note.md"), "public")
    await writeFile(path.join(vault, "ai应用开发", "skip.txt"), "skip")
    await writeFile(path.join(vault, "ai应用开发", "assets", "image.md"), "asset note")
    await writeFile(path.join(vault, "个人信息", "secret.md"), "secret")

    const files = await findMarkdownFiles(vault, ["ai应用开发"], ["assets", "个人信息"])

    assert.deepEqual(
      files.map((file) => path.relative(vault, file)),
      [path.join("ai应用开发", "note.md")],
    )
  })
})

test("findMarkdownFiles skips exact relative files from excludeFiles", async () => {
  await withTempDir(async (vault) => {
    await mkdir(path.join(vault, "公开"), { recursive: true })
    await writeFile(path.join(vault, "公开", "keep.md"), "keep")
    await writeFile(path.join(vault, "公开", "skip.md"), "skip")

    const files = await findMarkdownFiles(vault, ["公开"], [], ["公开/skip.md"])

    assert.deepEqual(
      files.map((file) => path.relative(vault, file)),
      [path.join("公开", "keep.md")],
    )
  })
})

test("getReferencedAttachments extracts Obsidian embeds and markdown images", () => {
  const markdown = [
    "![[Untitled 1.png]]",
    "![[assets/diagram.jpg|600]]",
    "![alt](images/pic.webp)",
    "[regular link](https://example.com/a.png)",
  ].join("\n")

  assert.deepEqual(getReferencedAttachments(markdown), [
    "Untitled 1.png",
    "assets/diagram.jpg",
    "images/pic.webp",
  ])
})

test("getReferencedAttachments ignores obvious placeholder examples", () => {
  const markdown = [
    "图片嵌入用 ![[...]]",
    "历史报告中会提到 ![[Untitled*.png]] 这种示例",
    "![real](assets/real.png)",
  ].join("\n")

  assert.deepEqual(getReferencedAttachments(markdown), ["assets/real.png"])
})

test("siteIntro does not reference missing local images", async () => {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const configPath = path.join(repoRoot, "publish.config.json")
  const config = JSON.parse(await readFile(configPath, "utf8"))
  const contentDir = path.resolve(repoRoot, config.contentDir ?? "content")
  const refs = getReferencedAttachments(config.siteIntro ?? "")
  const localRefs = refs.filter((ref) => !/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(ref))
  const missing = []

  for (const ref of localRefs) {
    try {
      await access(path.resolve(contentDir, ref))
    } catch {
      missing.push(ref)
    }
  }

  assert.deepEqual(missing, [])
})

test("scanSensitiveTerms reports configured keywords with line numbers", () => {
  const warnings = scanSensitiveTerms("a\nAPI_KEY=123\n普通 token 说明", ["api_key", "token"])

  assert.deepEqual(warnings, [
    { line: 2, term: "api_key", text: "API_KEY=123" },
    { line: 3, term: "token", text: "普通 token 说明" },
  ])
})

test("syncPublicNotes copies only referenced attachments from global assets", async () => {
  await withTempDir(async (root) => {
    const vault = path.join(root, "vault")
    const content = path.join(root, "content")
    const reportPath = path.join(root, "reports", "sync.md")
    await mkdir(path.join(vault, "公开"), { recursive: true })
    await mkdir(path.join(vault, "assets", "欢迎"), { recursive: true })
    await writeFile(path.join(vault, "公开", "note.md"), "![[image 1.png]]")
    await writeFile(path.join(vault, "assets", "欢迎", "image 1.png"), "png")
    await writeFile(path.join(vault, "assets", "欢迎", "unused.png"), "png")

    const result = await syncPublicNotes({
      sourceVault: vault,
      contentDir: content,
      reportPath,
      include: ["公开"],
      exclude: ["assets"],
      sensitiveTerms: [],
    })

    assert.deepEqual(result.copiedAttachments, ["assets/欢迎/image 1.png"])
    assert.deepEqual(result.missingAttachments, [])
  })
})

test("syncPublicNotes removes stale content not in current include list", async () => {
  await withTempDir(async (root) => {
    const vault = path.join(root, "vault")
    const content = path.join(root, "content")
    const reportPath = path.join(root, "reports", "sync.md")
    await mkdir(path.join(vault, "keep"), { recursive: true })
    await mkdir(path.join(vault, "drop"), { recursive: true })
    await writeFile(path.join(vault, "keep", "note.md"), "keep")
    await writeFile(path.join(vault, "drop", "old.md"), "drop")

    // Pre-populate content with stale files
    await mkdir(path.join(content, "keep"), { recursive: true })
    await mkdir(path.join(content, "drop"), { recursive: true })
    await writeFile(path.join(content, "keep", "note.md"), "keep")
    await writeFile(path.join(content, "drop", "old.md"), "old content")

    const result = await syncPublicNotes({
      sourceVault: vault,
      contentDir: content,
      reportPath,
      include: ["keep"],
      exclude: [],
      sensitiveTerms: [],
    })

    assert.deepEqual(result.removed, ["drop/old.md"])
    assert.deepEqual(result.copiedMarkdown.includes("keep/note.md"), true)
  })
})

test("syncPublicNotes writes index without trailing blank lines", async () => {
  await withTempDir(async (root) => {
    const vault = path.join(root, "vault")
    const content = path.join(root, "content")
    const reportPath = path.join(root, "reports", "sync.md")
    await mkdir(path.join(vault, "公开"), { recursive: true })
    await writeFile(path.join(vault, "公开", "note.md"), "keep")

    await syncPublicNotes({
      sourceVault: vault,
      contentDir: content,
      reportPath,
      include: ["公开"],
      exclude: [],
      sensitiveTerms: [],
    })

    const index = await readFile(path.join(content, "index.md"), "utf8")
    assert.equal(index.endsWith("\n"), true)
    assert.equal(index.endsWith("\n\n"), false)
  })
})

test("syncPublicNotes resolves short embeds from note-specific asset folders", async () => {
  await withTempDir(async (root) => {
    const vault = path.join(root, "vault")
    const content = path.join(root, "content")
    const reportPath = path.join(root, "reports", "sync.md")
    await mkdir(path.join(vault, "gzhu", "assets", "GZHU-计算机-毕业论文与材料"), {
      recursive: true,
    })
    await writeFile(path.join(vault, "gzhu", "GZHU-计算机-毕业论文与材料.md"), "![[image-4.png]]")
    await writeFile(
      path.join(vault, "gzhu", "assets", "GZHU-计算机-毕业论文与材料", "image-4.png"),
      "png",
    )

    const result = await syncPublicNotes({
      sourceVault: vault,
      contentDir: content,
      reportPath,
      include: ["gzhu"],
      exclude: ["assets"],
      sensitiveTerms: [],
    })

    assert.deepEqual(result.copiedAttachments, [
      "gzhu/assets/GZHU-计算机-毕业论文与材料/image-4.png",
    ])
    assert.deepEqual(result.missingAttachments, [])
  })
})
