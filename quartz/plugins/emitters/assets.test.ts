import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { after, before, describe, test } from "node:test"
import sharp from "sharp"
import {
  Assets,
  ensureResponsiveVariants,
  imageMetadata,
  responsiveCachePath,
  responsivePath,
  responsiveWidths,
} from "./assets"

async function writeAnimatedGif(fp: string, width = 800, pageHeight = 40) {
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

async function emittedFiles(emitted: AsyncIterable<string> | Promise<string[]>) {
  const result: string[] = []
  const resolved = await emitted
  if (Symbol.asyncIterator in resolved) {
    for await (const fp of resolved) result.push(fp)
  } else {
    result.push(...resolved)
  }
  return result
}

describe("responsive image helpers", () => {
  test("creates only non-upscaled responsive candidates", () => {
    assert.deepEqual(responsiveWidths(1600), [720, 1440])
    assert.deepEqual(responsiveWidths(1000), [720])
    assert.deepEqual(responsiveWidths(600), [])
    assert.deepEqual(responsiveWidths(720), [])
    assert.deepEqual(responsiveWidths(1440), [720])
  })

  test("uses deterministic WebP names for the final extension", () => {
    assert.equal(responsivePath("assets/photo.png", 720), "assets/photo.w720.webp")
    assert.equal(responsivePath("assets/photo.final.PNG", 1440), "assets/photo.final.w1440.webp")
    assert.equal(responsivePath("assets/photo.JpEg", 720), "assets/photo.w720.webp")
  })
})

describe("image metadata", () => {
  let fixtureDir: string
  let cacheDir: string

  before(async () => {
    fixtureDir = await fs.mkdtemp(path.join(os.tmpdir(), "quartz-responsive-metadata-"))
    cacheDir = path.join(fixtureDir, "cache")
    await Promise.all([
      sharp({
        create: { width: 1600, height: 900, channels: 3, background: "#cc4422" },
      })
        .png()
        .toFile(path.join(fixtureDir, "fixture.png")),
      sharp({
        create: { width: 1000, height: 500, channels: 3, background: "#228844" },
      })
        .jpeg()
        .toFile(path.join(fixtureDir, "fixture.jpg")),
      sharp({
        create: { width: 600, height: 400, channels: 3, background: "#224488" },
      })
        .webp()
        .toFile(path.join(fixtureDir, "fixture.webp")),
    ])

    await writeAnimatedGif(path.join(fixtureDir, "animated.gif"))
  })

  after(async () => {
    await fs.rm(fixtureDir, { recursive: true, force: true })
  })

  test("reads natural dimensions from PNG, JPEG, and WebP fixtures", async () => {
    const png = await imageMetadata(path.join(fixtureDir, "fixture.png"))
    const jpeg = await imageMetadata(path.join(fixtureDir, "fixture.jpg"))
    const webp = await imageMetadata(path.join(fixtureDir, "fixture.webp"))

    assert.deepEqual([png.width, png.height, png.format], [1600, 900, "png"])
    assert.deepEqual([jpeg.width, jpeg.height, jpeg.format], [1000, 500, "jpeg"])
    assert.deepEqual([webp.width, webp.height, webp.format], [600, 400, "webp"])
  })

  test("uses the source content hash and conversion version in cache paths", async () => {
    const source = path.join(fixtureDir, "fixture.png")
    const digest = createHash("sha256")
      .update(await fs.readFile(source))
      .digest("hex")

    assert.equal(
      responsiveCachePath(digest, 720, cacheDir),
      path.join(cacheDir, `${digest}-v1-w720.webp`),
    )
  })

  test("reuses cached variants and changes the cache key when source content changes", async () => {
    const source = path.join(fixtureDir, "fixture.png")
    const first = await ensureResponsiveVariants({
      sourcePath: source,
      outputPath: "assets/fixture.png",
      cacheDir,
    })

    assert.deepEqual(
      first.variants.map((variant) => variant.width),
      [720, 1440],
    )
    const cachedPath = first.variants[0].cachePath
    const preservedTime = new Date("2026-01-02T03:04:05.000Z")
    await fs.utimes(cachedPath, preservedTime, preservedTime)

    const reused = await ensureResponsiveVariants({
      sourcePath: source,
      outputPath: "assets/fixture.png",
      cacheDir,
    })
    assert.equal(reused.variants[0].cachePath, cachedPath)
    assert.equal((await fs.stat(cachedPath)).mtimeMs, preservedTime.getTime())

    await sharp({
      create: { width: 1600, height: 900, channels: 3, background: "#884422" },
    })
      .png()
      .toFile(source)
    const changed = await ensureResponsiveVariants({
      sourcePath: source,
      outputPath: "assets/fixture.png",
      cacheDir,
    })

    assert.notEqual(changed.variants[0].cachePath, cachedPath)
    await fs.access(cachedPath)
    await fs.access(changed.variants[0].cachePath)
  })

  test("preserves all GIF frames in the derived WebP", async () => {
    const generated = await ensureResponsiveVariants({
      sourcePath: path.join(fixtureDir, "animated.gif"),
      outputPath: "assets/animated.gif",
      cacheDir,
    })

    assert.ok(generated.metadata)
    assert.equal(generated.metadata.pages, 2)
    assert.equal(generated.metadata.pageHeight, 40)
    assert.deepEqual(
      generated.variants.map((variant) => variant.width),
      [720],
    )

    const derived = await sharp(generated.variants[0].cachePath, { animated: true }).metadata()
    assert.equal(derived.format, "webp")
    assert.equal(derived.pages, 2)
    assert.equal(derived.pageHeight, 36)
  })
})

describe("Assets emitter", () => {
  let root: string
  let contentDir: string
  let outputDir: string
  let originalCwd: string

  before(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "quartz-assets-emitter-"))
    contentDir = path.join(root, "content")
    outputDir = path.join(root, "public")
    originalCwd = process.cwd()
    await fs.mkdir(path.join(contentDir, "Assets"), { recursive: true })
    await Promise.all([
      sharp({
        create: { width: 1600, height: 900, channels: 3, background: "#cc4422" },
      })
        .png()
        .toFile(path.join(contentDir, "Assets", "Photo.Final.PNG")),
      sharp({
        create: { width: 1000, height: 500, channels: 3, background: "#228844" },
      })
        .jpeg()
        .toFile(path.join(contentDir, "Assets", "Portrait.JPEG")),
      sharp({
        create: { width: 1000, height: 600, channels: 3, background: "#224488" },
      })
        .webp()
        .toFile(path.join(contentDir, "Assets", "Diagram.WebP")),
      writeAnimatedGif(path.join(contentDir, "Assets", "Motion.GIF")),
      fs.writeFile(path.join(contentDir, "Assets", "Broken.png"), "not an image"),
    ])
  })

  after(async () => {
    process.chdir(originalCwd)
    await fs.rm(root, { recursive: true, force: true })
  })

  test("copies originals and emits only successfully generated responsive variants", async () => {
    const warnings: string[] = []
    const originalWarn = console.warn
    console.warn = (message) => warnings.push(String(message))
    process.chdir(root)

    try {
      const emitter = Assets()
      const ctx = {
        argv: {
          directory: contentDir,
          output: outputDir,
          verbose: false,
          serve: false,
          watch: false,
          port: 8080,
          wsPort: 3001,
        },
        cfg: {
          configuration: { ignorePatterns: [] },
          plugins: { pageTypes: [] },
        },
      }
      const outputs = await emittedFiles(emitter.emit(ctx as never, [], {} as never))

      assert.deepEqual(outputs.map((fp) => path.relative(outputDir, fp)).sort(), [
        "assets/broken.png",
        "assets/diagram.WebP",
        "assets/diagram.w720.webp",
        "assets/motion.GIF",
        "assets/motion.w720.webp",
        "assets/photo.final.PNG",
        "assets/photo.final.w1440.webp",
        "assets/photo.final.w720.webp",
        "assets/portrait.JPEG",
        "assets/portrait.w720.webp",
      ])
      assert.equal(warnings.length, 1)
      assert.match(warnings[0], /Broken\.png/)

      const animated = await sharp(path.join(outputDir, "assets/motion.w720.webp"), {
        animated: true,
      }).metadata()
      assert.equal(animated.pages, 2)
      await fs.access(path.join(outputDir, "assets/broken.png"))
      await fs.access(path.join(contentDir, "Assets", "Broken.png"))
    } finally {
      console.warn = originalWarn
      process.chdir(originalCwd)
    }
  })

  test("partial add and change refresh variants while delete preserves source and cache", async () => {
    const source = path.join(contentDir, "Assets", "Incremental.jpg")
    await sharp({
      create: { width: 1000, height: 500, channels: 3, background: "#335577" },
    })
      .jpeg()
      .toFile(source)

    process.chdir(root)
    try {
      const emitter = Assets()
      const ctx = {
        argv: {
          directory: contentDir,
          output: outputDir,
          verbose: false,
          serve: false,
          watch: true,
          port: 8080,
          wsPort: 3001,
        },
        cfg: {
          configuration: { ignorePatterns: [] },
          plugins: { pageTypes: [] },
        },
      }
      const partialEmit = emitter.partialEmit
      assert.equal(typeof partialEmit, "function")

      const added = await emittedFiles(
        partialEmit!(ctx as never, [], {} as never, [
          { type: "add", path: "Assets/Incremental.jpg" as never },
        ]) as never,
      )
      assert.deepEqual(
        added.map((fp) => path.relative(outputDir, fp)),
        ["assets/incremental.jpg", "assets/incremental.w720.webp"],
      )

      await sharp({
        create: { width: 1600, height: 900, channels: 3, background: "#773355" },
      })
        .jpeg()
        .toFile(source)
      const changed = await emittedFiles(
        partialEmit!(ctx as never, [], {} as never, [
          { type: "change", path: "Assets/Incremental.jpg" as never },
        ]) as never,
      )
      assert.deepEqual(
        changed.map((fp) => path.relative(outputDir, fp)),
        ["assets/incremental.jpg", "assets/incremental.w720.webp", "assets/incremental.w1440.webp"],
      )

      const cacheDir = path.join(root, ".quartz-cache", "responsive-images")
      const cacheBeforeShrink = (await fs.readdir(cacheDir)).sort()
      await sharp({
        create: { width: 600, height: 400, channels: 3, background: "#557733" },
      })
        .jpeg()
        .toFile(source)
      const shrunk = await emittedFiles(
        partialEmit!(ctx as never, [], {} as never, [
          { type: "change", path: "Assets/Incremental.jpg" as never },
        ]) as never,
      )
      assert.deepEqual(
        shrunk.map((fp) => path.relative(outputDir, fp)),
        ["assets/incremental.jpg"],
      )
      await assert.rejects(fs.access(path.join(outputDir, "assets/incremental.w720.webp")))
      await assert.rejects(fs.access(path.join(outputDir, "assets/incremental.w1440.webp")))
      assert.deepEqual((await fs.readdir(cacheDir)).sort(), cacheBeforeShrink)

      const cacheBeforeDelete = (await fs.readdir(cacheDir)).sort()
      const deleted = await emittedFiles(
        partialEmit!(ctx as never, [], {} as never, [
          { type: "delete", path: "Assets/Incremental.jpg" as never },
        ]) as never,
      )

      assert.deepEqual(deleted, [])
      await assert.rejects(fs.access(path.join(outputDir, "assets/incremental.jpg")))
      await assert.rejects(fs.access(path.join(outputDir, "assets/incremental.w720.webp")))
      await assert.rejects(fs.access(path.join(outputDir, "assets/incremental.w1440.webp")))
      await fs.access(source)
      assert.deepEqual((await fs.readdir(cacheDir)).sort(), cacheBeforeDelete)
    } finally {
      process.chdir(originalCwd)
    }
  })
})
