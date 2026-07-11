import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test, { describe } from "node:test"
import type { Root } from "hast"
import ContentIndex, { buildIndexes } from "./index.js"

type TestContent = [Root, { data: Record<string, unknown> }]

function page(
  slug: string,
  options: {
    filePath?: string
    relativePath?: string
    title?: string
    tags?: string[]
    links?: string[]
    text?: string
    description?: string
    unlisted?: boolean
    dates?: Record<string, string>
    defaultDateType?: string
  } = {},
): TestContent {
  const title = options.title ?? slug
  return [
    {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "p",
          properties: {},
          children: [{ type: "text", value: `Rendered ${title}` }],
        },
      ],
    },
    {
      data: {
        slug,
        ...(options.filePath === undefined ? {} : { filePath: options.filePath }),
        ...(options.relativePath === undefined ? {} : { relativePath: options.relativePath }),
        frontmatter: {
          title,
          tags: options.tags ?? [],
        },
        links: options.links ?? [],
        text: options.text ?? "",
        description: options.description ?? `${title} description`,
        ...(options.unlisted === undefined ? {} : { unlisted: options.unlisted }),
        ...(options.dates === undefined ? {} : { dates: options.dates }),
        ...(options.defaultDateType === undefined
          ? {}
          : { defaultDateType: options.defaultDateType }),
      },
    },
  ]
}

function fixture(): TestContent[] {
  return [
    page("notes/real", {
      filePath: "/tmp/content/notes/real.md",
      relativePath: "notes/real.md",
      title: "Real note",
      tags: ["performance"],
      links: ["notes/linked"],
      text: "Searchable full text",
    }),
    page("tags/performance", {
      relativePath: "tags/performance.md",
      title: "Performance tag",
      links: ["notes/real"],
      text: "Generated virtual page text",
    }),
    page("notes/private", {
      relativePath: "notes/private.md",
      title: "Private note",
      text: "Must never be indexed",
      unlisted: true,
    }),
  ]
}

describe("buildIndexes", () => {
  test("splits exact metadata fields from searchable content without mutating input", () => {
    const content = fixture()
    const before = structuredClone(content)

    const { fullIndex, metadataIndex, searchIndex } = buildIndexes(content)

    assert.deepStrictEqual(metadataIndex, {
      "notes/real": {
        slug: "notes/real",
        filePath: "notes/real.md",
        title: "Real note",
        links: ["notes/linked"],
        tags: ["performance"],
      },
      "tags/performance": {
        slug: "tags/performance",
        filePath: "tags/performance.md",
        title: "Performance tag",
        links: ["notes/real"],
        tags: [],
      },
    })
    assert.deepStrictEqual(searchIndex, {
      "notes/real": {
        title: "Real note",
        tags: ["performance"],
        content: "Searchable full text",
      },
    })
    assert.deepStrictEqual([...fullIndex.keys()], ["notes/real", "tags/performance"])
    assert.deepStrictEqual(content, before)

    for (const details of Object.values(metadataIndex)) {
      assert.deepStrictEqual(Object.keys(details).sort(), [
        "filePath",
        "links",
        "slug",
        "tags",
        "title",
      ])
    }
    for (const details of Object.values(searchIndex)) {
      assert.deepStrictEqual(Object.keys(details).sort(), ["content", "tags", "title"])
    }
  })

  test("honors includeEmptyFiles for real and virtual pages", () => {
    const content = [
      page("notes/empty", {
        filePath: "/tmp/content/notes/empty.md",
        relativePath: "notes/empty.md",
        text: "",
      }),
      page("tags/empty", { relativePath: "tags/empty.md", text: "" }),
      page("notes/full", {
        filePath: "/tmp/content/notes/full.md",
        relativePath: "notes/full.md",
        text: "body",
      }),
    ]

    const { metadataIndex, searchIndex } = buildIndexes(content, { includeEmptyFiles: false })

    assert.deepStrictEqual(Object.keys(metadataIndex), ["notes/full"])
    assert.deepStrictEqual(Object.keys(searchIndex), ["notes/full"])
  })

  test("preserves dangerous real and virtual slugs through JSON serialization", () => {
    const realIndexes = buildIndexes([
      page("__proto__", {
        filePath: "/tmp/content/proto.md",
        relativePath: "proto.md",
        text: "real prototype content",
      }),
    ])
    const virtualIndexes = buildIndexes([
      page("__proto__", {
        relativePath: "tags/proto.md",
        text: "virtual prototype content",
      }),
    ])

    const realMetadata = JSON.parse(JSON.stringify(realIndexes.metadataIndex))
    const realSearch = JSON.parse(JSON.stringify(realIndexes.searchIndex))
    const virtualMetadata = JSON.parse(JSON.stringify(virtualIndexes.metadataIndex))

    assert.ok(Object.hasOwn(realMetadata, "__proto__"))
    assert.ok(Object.hasOwn(realSearch, "__proto__"))
    assert.ok(Object.hasOwn(virtualMetadata, "__proto__"))
    assert.equal(realMetadata.__proto__.slug, "__proto__")
    assert.equal(realSearch.__proto__.content, "real prototype content")
    assert.equal(virtualMetadata.__proto__.filePath, "tags/proto.md")
  })

  test("uses defaultDateType before the fallback date order", () => {
    const dates = {
      modified: "2026-03-01T00:00:00.000Z",
      published: "2026-02-01T00:00:00.000Z",
      created: "2026-01-01T00:00:00.000Z",
    }
    const preferred = buildIndexes([
      page("notes/preferred-date", {
        filePath: "/tmp/content/notes/preferred-date.md",
        relativePath: "notes/preferred-date.md",
        text: "body",
        dates,
        defaultDateType: "created",
      }),
    ])
    const fallback = buildIndexes([
      page("notes/fallback-date", {
        filePath: "/tmp/content/notes/fallback-date.md",
        relativePath: "notes/fallback-date.md",
        text: "body",
        dates: { modified: dates.modified, created: dates.created },
        defaultDateType: "published",
      }),
    ])

    assert.equal(preferred.fullIndex.get("notes/preferred-date").date.toISOString(), dates.created)
    assert.equal(fallback.fullIndex.get("notes/fallback-date").date.toISOString(), dates.modified)
  })
})

describe("ContentIndex emitter", () => {
  for (const method of ["emit", "partialEmit"] as const) {
    test(`${method} writes metadata, search, RSS, and sitemap outputs`, async () => {
      const output = await fs.mkdtemp(path.join(os.tmpdir(), `content-index-${method}-`))
      const emitter = ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
        rssFullHtml: true,
        rssSlug: "feed",
      })
      const ctx = {
        argv: { output },
        cfg: {
          configuration: {
            baseUrl: "example.com/notes",
            pageTitle: "Example Notes",
          },
        },
      }
      const run = emitter[method]
      assert.equal(typeof run, "function")

      const outputs = await run!(ctx as never, fixture() as never)

      assert.equal(emitter.name, "ContentIndex")
      assert.equal(outputs.length, 4)
      const metadata = JSON.parse(
        await fs.readFile(path.join(output, "static/contentIndex.json"), "utf8"),
      )
      const search = JSON.parse(
        await fs.readFile(path.join(output, "static/searchIndex.json"), "utf8"),
      )
      const rss = await fs.readFile(path.join(output, "feed.xml"), "utf8")
      const sitemap = await fs.readFile(path.join(output, "sitemap.xml"), "utf8")

      assert.deepStrictEqual(Object.keys(metadata), ["notes/real", "tags/performance"])
      assert.deepStrictEqual(Object.keys(search), ["notes/real"])
      assert.equal(search["notes/real"].content, "Searchable full text")
      assert.match(rss, /Real note/)
      assert.match(rss, /Performance tag/)
      assert.match(rss, /Rendered Real note/)
      assert.doesNotMatch(rss, /Private note/)
      assert.match(sitemap, /notes\/real/)
      assert.match(sitemap, /tags\/performance/)
      assert.doesNotMatch(sitemap, /notes\/private/)
    })
  }
})
