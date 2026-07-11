import { readFileSync } from "node:fs"
import { h } from "preact"
import {
  getAllSegmentPrefixes,
  getDate,
  joinSegments,
  resolveRelative,
  simplifySlug,
} from "@quartz-community/utils"
import { htmlToJsx } from "@quartz-community/utils/jsx"

const style = readFileSync(new URL("./tag-page.css", import.meta.url), "utf8")

function isListed(file) {
  return file?.unlisted !== true
}

function tagsForFiles(files) {
  return [
    ...new Set(
      files
        .filter(isListed)
        .flatMap((file) => file.frontmatter?.tags ?? [])
        .flatMap(getAllSegmentPrefixes),
    ),
  ]
}

function pagesWithTag(files, tag) {
  return files.filter(isListed).filter((file) => {
    const tags = (file.frontmatter?.tags ?? []).flatMap(getAllSegmentPrefixes)
    return tags.includes(tag)
  })
}

function titleForPage(page) {
  return page.frontmatter?.title ?? page.slug ?? ""
}

function byDateAndTitle(locale) {
  return (first, second) => {
    const firstDate = getDate(first)?.getTime()
    const secondDate = getDate(second)?.getTime()
    if (firstDate !== undefined && secondDate !== undefined && firstDate !== secondDate) {
      return secondDate - firstDate
    }
    if (firstDate !== undefined && secondDate === undefined) return -1
    if (firstDate === undefined && secondDate !== undefined) return 1
    return titleForPage(first).localeCompare(titleForPage(second), locale)
  }
}

function initialForTag(tag, locale) {
  return (Array.from(tag)[0] ?? "#").toLocaleUpperCase(locale)
}

function authoredContent(tree, description) {
  if (tree?.children?.length > 0) {
    return h("article", { class: "tag-page-description" }, htmlToJsx(tree))
  }
  return description ? h("article", { class: "tag-page-description" }, description) : null
}

export function TagPageContent({ tree, fileData, allFiles, cfg }) {
  const slug = fileData.slug
  if (!(slug === "tags" || slug?.startsWith("tags/"))) {
    throw new Error(`TagPageLite tried to render a non-tag page: ${slug}`)
  }

  const locale = cfg?.locale ?? "en-US"
  const tag = simplifySlug(slug.slice("tags/".length))
  const content = authoredContent(tree, fileData.description)

  if (tag === "/") {
    const tags = tagsForFiles(allFiles).sort((a, b) => a.localeCompare(b, locale))
    const groups = new Map()
    for (const currentTag of tags) {
      const initial = initialForTag(currentTag, locale)
      const values = groups.get(initial) ?? []
      values.push(currentTag)
      groups.set(initial, values)
    }

    return h(
      "div",
      { class: "tag-page-lite popover-hint" },
      content,
      h("p", { class: "tag-index-summary" }, `${tags.length} 个标签`),
      h(
        "div",
        { class: "tag-groups" },
        ...[...groups.entries()]
          .sort(([first], [second]) => first.localeCompare(second, locale))
          .map(([initial, groupedTags]) =>
            h(
              "section",
              { class: "tag-group" },
              h("h2", { class: "tag-group-heading" }, initial),
              h(
                "ul",
                { class: "tag-index-list" },
                ...groupedTags.map((currentTag) =>
                  h(
                    "li",
                    { class: "tag-index-item" },
                    h(
                      "a",
                      {
                        class: "internal tag-link",
                        href: resolveRelative(slug, joinSegments("tags", currentTag)),
                      },
                      currentTag,
                    ),
                    h(
                      "span",
                      { class: "tag-count" },
                      String(pagesWithTag(allFiles, currentTag).length),
                    ),
                  ),
                ),
              ),
            ),
          ),
      ),
    )
  }

  const pages = pagesWithTag(allFiles, tag).sort(byDateAndTitle(locale))
  return h(
    "div",
    { class: "tag-page-lite popover-hint" },
    content,
    h("p", { class: "tag-page-summary" }, `${pages.length} 篇文章`),
    h(
      "ul",
      { class: "tag-article-list" },
      ...pages.map((page) => {
        const date = getDate(page)
        return h(
          "li",
          { class: "tag-article-item" },
          date
            ? h(
                "time",
                { dateTime: date.toISOString() },
                date.toLocaleDateString(locale, {
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                }),
              )
            : h("span", { class: "tag-article-date" }),
          h(
            "a",
            {
              class: "internal",
              href: resolveRelative(slug, page.slug),
            },
            titleForPage(page),
          ),
        )
      }),
    ),
  )
}

TagPageContent.css = style

export default function TagPageLite() {
  return {
    name: "TagPageLite",
    priority: 10,
    match: ({ slug }) => slug === "tags" || slug.startsWith("tags/"),
    generate({ content }) {
      const allFiles = content.map(([, file]) => file.data).filter(isListed)
      const tags = new Set(tagsForFiles(allFiles))
      tags.add("index")

      const existingTagSlugs = new Set(
        content
          .map(([, file]) => file.data.slug)
          .filter((slug) => typeof slug === "string" && slug.startsWith("tags/")),
      )

      return [...tags].flatMap((tag) => {
        const slug = joinSegments("tags", tag)
        if (existingTagSlugs.has(slug)) return []
        return [{ slug, title: tag === "index" ? "标签索引" : tag, data: {} }]
      })
    },
    layout: "tag",
    body: () => TagPageContent,
  }
}
