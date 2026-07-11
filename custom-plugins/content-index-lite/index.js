import fs from "node:fs/promises"
import path from "node:path"

const defaultOptions = {
  enableSiteMap: true,
  enableRSS: true,
  rssLimit: 10,
  rssFullHtml: false,
  rssSlug: "index",
  includeEmptyFiles: true,
  rssRecentNotesText: "Recent notes",
  rssLastFewNotesText: (count) => `Last ${count} notes`,
}

function joinSegments(...segments) {
  return segments
    .filter((segment) => segment !== undefined && segment !== null && segment !== "")
    .map((segment) => String(segment).replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/")
}

function simplifySlug(slug) {
  if (slug === "index") return ""
  return slug.endsWith("/index") ? slug.slice(0, -"/index".length) : slug
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

const voidElements = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
])

function propertyName(name) {
  if (name === "className") return "class"
  if (name === "htmlFor") return "for"
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
}

function serializeProperties(properties = {}) {
  return Object.entries(properties)
    .flatMap(([name, value]) => {
      if (value === undefined || value === null || value === false) return []
      const attribute = propertyName(name)
      if (value === true) return [attribute]
      const serialized = Array.isArray(value) ? value.join(" ") : String(value)
      return [`${attribute}="${escapeHTML(serialized)}"`]
    })
    .join(" ")
}

function serializeHast(node) {
  if (!node) return ""
  if (node.type === "root") return (node.children ?? []).map(serializeHast).join("")
  if (node.type === "text") return escapeHTML(node.value ?? "")
  if (node.type === "raw") return String(node.value ?? "")
  if (node.type === "comment") return `<!--${node.value ?? ""}-->`
  if (node.type === "doctype") return "<!doctype html>"
  if (node.type !== "element") return ""

  const attributes = serializeProperties(node.properties)
  const openingTag = `<${node.tagName}${attributes ? ` ${attributes}` : ""}>`
  if (voidElements.has(node.tagName)) return openingTag
  return `${openingTag}${(node.children ?? []).map(serializeHast).join("")}</${node.tagName}>`
}

function asStringArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : []
}

function contentDate(data) {
  const frontmatter = data.frontmatter ?? {}
  const dates = data.dates ?? {}
  const preferredDate =
    typeof data.defaultDateType === "string" ? dates[data.defaultDateType] : undefined
  const candidates = [
    preferredDate,
    dates.modified,
    dates.published,
    dates.created,
    frontmatter.date,
  ]

  for (const candidate of candidates) {
    if (candidate instanceof Date && !Number.isNaN(candidate.getTime())) return new Date(candidate)
    if (typeof candidate === "string" || typeof candidate === "number") {
      const parsed = new Date(candidate)
      if (!Number.isNaN(parsed.getTime())) return parsed
    }
  }

  return new Date()
}

export function buildIndexes(content, opts = {}) {
  const options = { ...defaultOptions, ...opts }
  const fullIndex = new Map()
  const metadataEntries = []
  const searchEntries = []

  for (const [tree, file] of content) {
    const data = file?.data ?? {}
    if (data.unlisted === true) continue

    const text = typeof data.text === "string" ? data.text : ""
    if (!options.includeEmptyFiles && text === "") continue

    const slug = typeof data.slug === "string" ? data.slug : ""
    if (slug === "") continue

    const frontmatter = data.frontmatter ?? {}
    const title = typeof frontmatter.title === "string" ? frontmatter.title : ""
    const links = asStringArray(data.links)
    const tags = asStringArray(frontmatter.tags)
    const filePath = typeof data.relativePath === "string" ? data.relativePath : null
    const isRealFile = typeof data.filePath === "string"
    const fullDetails = {
      slug,
      filePath,
      title,
      links: [...links],
      tags: [...tags],
      content: text,
      richContent:
        options.rssFullHtml && data.encrypted !== true
          ? escapeHTML(serializeHast(tree))
          : undefined,
      date: contentDate(data),
      description: typeof data.description === "string" ? data.description : "",
    }

    fullIndex.set(slug, fullDetails)
    metadataEntries.push([
      slug,
      {
        slug,
        filePath,
        title,
        links: [...links],
        tags: [...tags],
      },
    ])

    if (isRealFile) {
      searchEntries.push([
        slug,
        {
          title,
          tags: [...tags],
          content: text,
        },
      ])
    }
  }

  const metadataIndex = Object.fromEntries(metadataEntries)
  const searchIndex = Object.fromEntries(searchEntries)
  return { fullIndex, metadataIndex, searchIndex }
}

async function write({ ctx, content, slug, ext }) {
  const pathToPage = path.join(ctx.argv.output, `${slug}${ext}`)
  await fs.mkdir(path.dirname(pathToPage), { recursive: true })
  await fs.writeFile(pathToPage, content)
  return pathToPage
}

function generateSiteMap(cfg, fullIndex) {
  const base = cfg.baseUrl ?? ""
  const entries = Array.from(fullIndex, ([slug, details]) => {
    const location = joinSegments(base, encodeURI(simplifySlug(slug)))
    const lastModified = details.date ? `<lastmod>${details.date.toISOString()}</lastmod>` : ""
    return `<url>
    <loc>https://${location}</loc>
    ${lastModified}
  </url>`
  }).join("")

  return `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries}</urlset>`
}

function generateRSSFeed(cfg, fullIndex, options, limit) {
  const base = cfg.baseUrl ?? ""
  const pageTitle = cfg.pageTitle ?? ""
  const recentNotesText = options.rssRecentNotesText ?? "Recent notes"
  const lastFewNotesText = options.rssLastFewNotesText ?? ((count) => `Last ${count} notes`)

  const items = Array.from(fullIndex)
    .sort(([, first], [, second]) => {
      if (first.date && second.date) return second.date.getTime() - first.date.getTime()
      if (first.date) return -1
      if (second.date) return 1
      return first.title.localeCompare(second.title)
    })
    .map(([slug, details]) => {
      const location = joinSegments(base, encodeURI(simplifySlug(slug)))
      return `<item>
    <title>${escapeHTML(details.title)}</title>
    <link>https://${location}</link>
    <guid>https://${location}</guid>
    <description><![CDATA[ ${details.richContent ?? details.description} ]]></description>
    <pubDate>${details.date?.toUTCString()}</pubDate>
  </item>`
    })
    .slice(0, limit ?? fullIndex.size)
    .join("")

  const description = `${
    limit ? lastFewNotesText(limit) : recentNotesText
  } on ${escapeHTML(pageTitle)}`

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
    <channel>
      <title>${escapeHTML(pageTitle)}</title>
      <link>https://${base}</link>
      <description>${description}</description>
      <generator>Quartz -- quartz.jzhao.xyz</generator>
      ${items}
    </channel>
  </rss>`
}

const ContentIndex = (opts = {}) => {
  const options = { ...defaultOptions, ...opts }

  const emitAll = async (ctx, content) => {
    const cfg = ctx.cfg.configuration
    const { fullIndex, metadataIndex, searchIndex } = buildIndexes(content, options)
    const outputs = []

    if (options.enableSiteMap) {
      outputs.push(
        await write({
          ctx,
          content: generateSiteMap(cfg, fullIndex),
          slug: "sitemap",
          ext: ".xml",
        }),
      )
    }

    if (options.enableRSS) {
      outputs.push(
        await write({
          ctx,
          content: generateRSSFeed(cfg, fullIndex, options, options.rssLimit),
          slug: options.rssSlug ?? "index",
          ext: ".xml",
        }),
      )
    }

    outputs.push(
      await write({
        ctx,
        content: JSON.stringify(metadataIndex),
        slug: joinSegments("static", "contentIndex"),
        ext: ".json",
      }),
    )
    outputs.push(
      await write({
        ctx,
        content: JSON.stringify(searchIndex),
        slug: joinSegments("static", "searchIndex"),
        ext: ".json",
      }),
    )

    return outputs
  }

  return {
    name: "ContentIndex",
    emit: (ctx, content) => emitAll(ctx, content),
    partialEmit: (ctx, content) => emitAll(ctx, content),
  }
}

export default ContentIndex
