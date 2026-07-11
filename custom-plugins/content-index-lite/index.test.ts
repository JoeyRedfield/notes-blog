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
    relativePath?: string
    title?: string
    tags?: string[]
    links?: string[]
    text?: string
    description?: string
    unlisted?: boolean
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
        ...(options.relativePath === undefined ? {} : { relativePath: options.relativePath }),
        frontmatter: {
          title,
          tags: options.tags ?? [],
        },
        links: options.links ?? [],
        text: options.text ?? "",
        description: options.description ?? `${title} description`,
        ...(options.unlisted === undefined ? {} : { unlisted: options.unlisted }),
      },
    },
  ]
}

function fixture(): TestContent[] {
  return [
    page("notes/real", {
      relativePath: "notes/real.md",
      title: "Real note",
      tags: ["performance"],
      links: ["notes/linked"],
      text: "Searchable full text",
    }),
    page("tags/performance", {
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
        filePath: null,
        title: "Performance tag",
        links: ["notes/real"],
        tags: [],
      },
    })
    assert.deepStrictEqual(searchIndex, {
      "notes/real": {
        slug: "notes/real",
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
  })

  test("honors includeEmptyFiles for real and virtual pages", () => {
    const content = [
      page("notes/empty", { relativePath: "notes/empty.md", text: "" }),
      page("tags/empty", { text: "" }),
      page("notes/full", { relativePath: "notes/full.md", text: "body" }),
    ]

    const { metadataIndex, searchIndex } = buildIndexes(content, { includeEmptyFiles: false })

    assert.deepStrictEqual(Object.keys(metadataIndex), ["notes/full"])
    assert.deepStrictEqual(Object.keys(searchIndex), ["notes/full"])
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
