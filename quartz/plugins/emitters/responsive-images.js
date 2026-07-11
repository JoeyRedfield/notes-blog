import { createHash, randomUUID } from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const CANDIDATE_WIDTHS = [720, 1440]
const RESPONSIVE_IMAGE_VERSION = "v1"

export const defaultResponsiveCacheDir = path.join(".quartz-cache", "responsive-images")

export function responsiveWidths(sourceWidth) {
  return CANDIDATE_WIDTHS.filter((width) => width < sourceWidth)
}

export function responsivePath(fp, width) {
  return `${fp}.w${width}.webp`
}

export function responsiveCachePath(sourceHash, width, cacheDir = defaultResponsiveCacheDir) {
  return path.join(cacheDir, `${sourceHash}-${RESPONSIVE_IMAGE_VERSION}-w${width}.webp`)
}

function isGif(fp) {
  return path.extname(fp).toLowerCase() === ".gif"
}

function sharpInput(input, sourcePath) {
  return sharp(input, isGif(sourcePath) ? { animated: true } : undefined)
}

export function imageMetadata(sourcePath) {
  return sharpInput(sourcePath, sourcePath).metadata()
}

async function pathExists(fp) {
  try {
    await fs.access(fp)
    return true
  } catch {
    return false
  }
}

async function createCachedVariant(input, sourcePath, cachePath, width) {
  if (await pathExists(cachePath)) return

  const tempPath = `${cachePath}.${process.pid}.${randomUUID()}.tmp`
  try {
    await sharpInput(input, sourcePath)
      .resize({ width, withoutEnlargement: true })
      .webp()
      .toFile(tempPath)

    try {
      await fs.link(tempPath, cachePath)
    } catch (error) {
      if (error?.code !== "EEXIST") throw error
    }
  } finally {
    await fs.unlink(tempPath).catch(() => undefined)
  }
}

export async function ensureResponsiveVariants({
  sourcePath,
  outputPath,
  cacheDir = defaultResponsiveCacheDir,
  warn = console.warn,
}) {
  let input
  let metadata
  try {
    input = await fs.readFile(sourcePath)
    metadata = await sharpInput(input, sourcePath).metadata()
  } catch (error) {
    warn(`Unable to read responsive image metadata for "${sourcePath}": ${String(error)}`)
    return { metadata: undefined, variants: [] }
  }

  if (metadata.width === undefined) {
    return { metadata, variants: [] }
  }

  const widths = responsiveWidths(metadata.width)
  if (widths.length === 0) {
    return { metadata, variants: [] }
  }

  try {
    await fs.mkdir(cacheDir, { recursive: true })
  } catch (error) {
    warn(`Unable to create responsive image cache for "${sourcePath}": ${String(error)}`)
    return { metadata, variants: [] }
  }

  const sourceHash = createHash("sha256").update(input).digest("hex")
  const variants = []
  for (const width of widths) {
    const cachePath = responsiveCachePath(sourceHash, width, cacheDir)
    try {
      await createCachedVariant(input, sourcePath, cachePath, width)
      if (await pathExists(cachePath)) {
        variants.push({
          width,
          cachePath,
          outputPath: responsivePath(outputPath, width),
        })
      }
    } catch (error) {
      warn(`Unable to create ${width}px responsive image for "${sourcePath}": ${String(error)}`)
    }
  }

  return { metadata, variants }
}
