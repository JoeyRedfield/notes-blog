import { h } from "preact"
import path from "node:path"
import { joinSegments, pathToRoot, slugifyFilePath } from "@quartz-community/utils"
import {
  createResponsivePathResolver,
  ensureResponsiveVariants,
} from "../../quartz/plugins/emitters/responsive-images.js"

export { ReadingEnhancements, readingEnhancementsScript } from "./components.js"

export const fontSubsetPath = "static/fonts/LXGWWenKai-Regular.subset.woff2"
export const themeColorLight = "#faf7f2"
export const themeColorDark = "#1f1c18"

export function fontPreloadHref(pageData = {}, basePath = "") {
  const slug = pageData.slug

  if (!slug || slug === "404") {
    return joinSegments(basePath, fontSubsetPath)
  }

  return joinSegments(pathToRoot(slug), fontSubsetPath)
}

const responsiveImageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"])
const responsiveImageSizes = "(max-width: 800px) calc(100vw - 2rem), 800px"

async function walkElements(node, visitor) {
  if (!node || typeof node !== "object") return

  if (node.type === "element") {
    await visitor(node)
  }

  if (!Array.isArray(node.children)) return

  for (const child of node.children) {
    await walkElements(child, visitor)
  }
}

function siteBasePath(ctx) {
  if (ctx?.argv?.serve) return "/"
  const baseUrl = ctx?.cfg?.configuration?.baseUrl
  return new URL(`https://${baseUrl ?? "example.com"}`).pathname
}

function withoutLeadingSlash(value) {
  return value.startsWith("/") ? value.slice(1) : value
}

function decodePath(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function sourcePathPart(src) {
  return decodePath(src.split(/[?#]/, 1)[0])
}

function assetLookup(ctx) {
  const byOutputPath = new Map()
  const bySourcePath = new Map()
  const occupiedOutputPaths = (ctx?.allFiles ?? []).map((filePath) =>
    slugifyFilePath(String(filePath)),
  )
  const resolveResponsivePath = createResponsivePathResolver(occupiedOutputPaths)
  for (const filePath of ctx?.allFiles ?? []) {
    const sourcePath = String(filePath)
    if (!responsiveImageExtensions.has(path.posix.extname(sourcePath).toLowerCase())) continue

    const asset = {
      sourcePath,
      outputPath: slugifyFilePath(sourcePath),
    }
    bySourcePath.set(path.posix.normalize(sourcePath), asset)
    byOutputPath.set(path.posix.normalize(asset.outputPath), asset)
  }
  return { byOutputPath, bySourcePath, resolveResponsivePath }
}

function removeBasePath(pathname, basePath) {
  const normalizedPath = withoutLeadingSlash(path.posix.normalize(decodePath(pathname)))
  const normalizedBase = withoutLeadingSlash(path.posix.normalize(decodePath(basePath)))
  if (normalizedBase === "." || normalizedBase === "") return normalizedPath
  if (normalizedPath === normalizedBase) return ""
  if (normalizedPath.startsWith(`${normalizedBase}/`)) {
    return normalizedPath.slice(normalizedBase.length + 1)
  }
  return normalizedPath
}

function resolveContentAsset(src, file, ctx, lookup) {
  if (typeof src !== "string" || src.length === 0) return undefined
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(src)) return undefined

  const { byOutputPath, bySourcePath } = lookup
  const basePath = siteBasePath(ctx)
  const pageSlug = String(file?.data?.slug ?? "")
  const pagePath = joinSegments(basePath, pageSlug)
  const pageUrl = `https://example.com${pagePath.startsWith("/") ? pagePath : `/${pagePath}`}`
  try {
    const resolvedOutputPath = removeBasePath(new URL(src, pageUrl).pathname, basePath)
    const outputMatch = byOutputPath.get(path.posix.normalize(resolvedOutputPath))
    if (outputMatch) return outputMatch
  } catch {
    return undefined
  }

  const relativePath = String(file?.data?.relativePath ?? "")
  if (relativePath.length === 0) return undefined
  const rawPath = sourcePathPart(src)
  const resolvedSourcePath = rawPath.startsWith("/")
    ? removeBasePath(rawPath, basePath)
    : path.posix.normalize(path.posix.join(path.posix.dirname(relativePath), rawPath))
  return bySourcePath.get(path.posix.normalize(resolvedSourcePath))
}

function numericDimension(value) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value
  if (typeof value !== "string" || value.trim().toLowerCase() === "auto") return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function addNaturalDimensions(properties, metadata) {
  const naturalWidth = metadata?.width
  const naturalHeight = metadata?.pageHeight ?? metadata?.height
  if (!naturalWidth || !naturalHeight) return

  const explicitWidth = numericDimension(properties.width)
  const explicitHeight = numericDimension(properties.height)
  if (explicitWidth && explicitHeight) {
    properties.width = explicitWidth
    properties.height = explicitHeight
  } else if (explicitWidth) {
    properties.width = explicitWidth
    properties.height = Math.round((naturalHeight * explicitWidth) / naturalWidth)
  } else if (explicitHeight) {
    properties.width = Math.round((naturalWidth * explicitHeight) / naturalHeight)
    properties.height = explicitHeight
  } else {
    properties.width = naturalWidth
    properties.height = naturalHeight
  }
}

function responsiveUrl(basePath, outputPath) {
  const joined = joinSegments(basePath, outputPath)
  const absolute = joined.startsWith("/") ? joined : `/${joined}`
  return encodeURI(absolute)
}

export async function addLazyLoadingToImages(tree, file = {}, ctx = {}, options = {}) {
  const lookup = assetLookup(ctx)
  await walkElements(tree, async (node) => {
    if (node.tagName !== "img") return

    node.properties = node.properties ?? {}

    if (!node.properties.loading) {
      node.properties.loading = "lazy"
    }

    if (!node.properties.decoding) {
      node.properties.decoding = "async"
    }

    const asset = resolveContentAsset(node.properties.src, file, ctx, lookup)
    if (!asset) return

    try {
      const sourcePath = path.join(ctx.argv.directory, asset.sourcePath)
      const generated = await ensureResponsiveVariants({
        sourcePath,
        outputPath: asset.outputPath,
        cacheDir: options.cacheDir,
        resolveOutputPath: lookup.resolveResponsivePath,
      })
      addNaturalDimensions(node.properties, generated.metadata)

      const hasExplicitSrcSet =
        node.properties.srcSet !== undefined || node.properties.srcset !== undefined
      if (hasExplicitSrcSet || generated.variants.length === 0) return

      const basePath = siteBasePath(ctx)
      node.properties.srcSet = generated.variants
        .map((variant) => `${responsiveUrl(basePath, variant.outputPath)} ${variant.width}w`)
        .join(", ")
      node.properties.sizes = responsiveImageSizes
    } catch (error) {
      console.warn(
        `Unable to enhance responsive image "${String(node.properties.src)}": ${String(error)}`,
      )
    }
  })
}

export default function ReadingEnhancementsTransformer() {
  return {
    name: "ReadingEnhancements",
    externalResources(ctx = {}) {
      const baseUrl = ctx.cfg?.configuration?.baseUrl
      const basePath = new URL(`https://${baseUrl ?? "example.com"}`).pathname

      return {
        additionalHead: [
          (pageData) =>
            h("link", {
              rel: "preload",
              href: fontPreloadHref(pageData, basePath),
              as: "font",
              type: "font/woff2",
              crossOrigin: "anonymous",
            }),
          h("meta", {
            name: "theme-color",
            content: themeColorLight,
            media: "(prefers-color-scheme: light)",
            "data-theme-color": "light",
          }),
          h("meta", {
            name: "theme-color",
            content: themeColorDark,
            media: "(prefers-color-scheme: dark)",
            "data-theme-color": "dark",
          }),
        ],
      }
    },
    htmlPlugins(ctx = {}) {
      return [
        () => {
          return (tree, file) => addLazyLoadingToImages(tree, file, ctx)
        },
      ]
    },
  }
}
