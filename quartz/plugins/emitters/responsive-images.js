import { createHash, randomUUID } from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const CANDIDATE_WIDTHS = [720, 1440]
const RESPONSIVE_IMAGE_VERSION = "v1"
const RESPONSIVE_IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"])

export const defaultResponsiveCacheDir = path.join(".quartz-cache", "responsive-images")

export function responsiveWidths(sourceWidth) {
  return CANDIDATE_WIDTHS.filter((width) => width < sourceWidth)
}

export function isResponsiveImagePath(fp) {
  return RESPONSIVE_IMAGE_EXTENSIONS.has(path.posix.extname(fp).toLowerCase())
}

function assignmentKey(fp, width) {
  return `${fp}\0${width}`
}

function collisionKey(fp) {
  return fp.toLowerCase()
}

function availableResponsivePath(fp, width, occupied) {
  const preferred = `${fp}.w${width}.webp`
  if (!occupied.has(collisionKey(preferred))) return preferred

  const hash = createHash("sha256").update(fp).digest("hex").slice(0, 12)
  let attempt = 0
  while (true) {
    const suffix = attempt === 0 ? hash : `${hash}-${attempt}`
    const candidate = `${fp}.${suffix}.w${width}.webp`
    if (!occupied.has(collisionKey(candidate))) return candidate
    attempt += 1
  }
}

export function createResponsivePathResolver(occupiedPaths = []) {
  const sourcePaths = [...new Set(Array.from(occupiedPaths, String))]
  const occupied = new Set(sourcePaths.map(collisionKey))
  const assignments = new Map()

  for (const sourcePath of sourcePaths.filter(isResponsiveImagePath).sort()) {
    for (const width of CANDIDATE_WIDTHS) {
      const candidate = availableResponsivePath(sourcePath, width, occupied)
      occupied.add(collisionKey(candidate))
      assignments.set(assignmentKey(sourcePath, width), candidate)
    }
  }

  return (fp, width) => {
    const assigned = assignments.get(assignmentKey(fp, width))
    if (assigned !== undefined) return assigned
    return availableResponsivePath(fp, width, occupied)
  }
}

export function responsivePath(fp, width, occupiedPaths = []) {
  const paths = new Set(occupiedPaths)
  paths.add(fp)
  return createResponsivePathResolver(paths)(fp, width)
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
  resolveOutputPath = responsivePath,
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
          outputPath: resolveOutputPath(outputPath, width),
        })
      }
    } catch (error) {
      warn(`Unable to create ${width}px responsive image for "${sourcePath}": ${String(error)}`)
    }
  }

  return { metadata, variants }
}
