import assert from "node:assert/strict"
import test, { describe } from "node:test"
import { render } from "preact-render-to-string"

async function core() {
  return import("./search-core.js")
}

describe("createLazySearchLoader", () => {
  test("shares one fetch and build across concurrent and later calls", async () => {
    const { createLazySearchLoader } = await core()
    let fetches = 0
    let builds = 0
    let release: (() => void) | undefined
    const blocked = new Promise<void>((resolve) => {
      release = resolve
    })
    const loader = createLazySearchLoader(
      async () => {
        fetches += 1
        await blocked
        return { note: { title: "Note", tags: [], content: "Body" } }
      },
      (index) => {
        builds += 1
        return Object.keys(index)
      },
    )

    const first = loader()
    const second = loader()
    assert.strictEqual(first, second)
    release?.()

    const [firstResult, secondResult] = await Promise.all([first, second])
    const thirdResult = await loader()

    assert.strictEqual(firstResult, secondResult)
    assert.strictEqual(secondResult, thirdResult)
    assert.deepStrictEqual(thirdResult, ["note"])
    assert.equal(fetches, 1)
    assert.equal(builds, 1)
  })

  test("clears a rejected promise so a later call can retry", async () => {
    const { createLazySearchLoader } = await core()
    let attempts = 0
    const loader = createLazySearchLoader(async () => {
      attempts += 1
      if (attempts === 1) throw new Error("temporary failure")
      return { recovered: { title: "Recovered", tags: [], content: "Ready" } }
    })

    await assert.rejects(loader(), /temporary failure/)
    const records = await loader()

    assert.equal(attempts, 2)
    assert.equal(records[0]?.slug, "recovered")
  })
})

describe("buildSearchRecords", () => {
  test("uses object keys as slugs and normalizes searchable fields", async () => {
    const { buildSearchRecords } = await core()
    const records = buildSearchRecords({
      "Notes/Case": {
        title: "  Hello   世界  ",
        tags: ["TypeScript", " 中文 ", 42],
        content: "  BODY\n Text  ",
      },
    })

    assert.deepStrictEqual(records, [
      {
        slug: "Notes/Case",
        title: "Hello 世界",
        tags: ["TypeScript", "中文"],
        content: "BODY Text",
        normalizedTitle: "hello 世界",
        normalizedTags: ["typescript", "中文"],
        normalizedContent: "body text",
      },
    ])
  })
})

describe("searchRecords", () => {
  test("ranks title prefix, title contains, tag, then body matches", async () => {
    const { buildSearchRecords, searchRecords } = await core()
    const records = buildSearchRecords({
      prefix: { title: "Alpha guide", tags: [], content: "" },
      contains: { title: "Guide to alpha", tags: [], content: "" },
      tag: { title: "Tag hit", tags: ["ALPHA"], content: "" },
      body: { title: "Body hit", tags: [], content: "mentions Alpha here" },
    })

    assert.deepStrictEqual(
      searchRecords(records, "ALPHA").map((result) => result.slug),
      ["prefix", "contains", "tag", "body"],
    )
  })

  test("normalizes Chinese and English, filters tags, limits to eight, and rejects empty queries", async () => {
    const { buildSearchRecords, searchRecords } = await core()
    const source = Object.fromEntries(
      Array.from({ length: 10 }, (_, index) => [
        `note-${index}`,
        {
          title: `中文 TypeScript ${index}`,
          tags: [index % 2 === 0 ? "性能" : "other"],
          content: "BODY",
        },
      ]),
    )
    const records = buildSearchRecords(source)

    assert.equal(searchRecords(records, "中文 typescript").length, 8)
    assert.deepStrictEqual(
      searchRecords(records, "#性能").map((result) => result.slug),
      ["note-0", "note-2", "note-4", "note-6", "note-8"],
    )
    assert.deepStrictEqual(searchRecords(records, "   "), [])
    assert.deepStrictEqual(searchRecords(records, "#"), [])
  })

  test("returns a bounded plain-text snippet without producing markup", async () => {
    const { buildSearchRecords, searchRecords } = await core()
    const attack = `<img src=x onerror="alert(1)"> ${"before ".repeat(30)}needle ${"after ".repeat(30)}`
    const records = buildSearchRecords({ attack: { title: "Unsafe", tags: [], content: attack } })

    const [result] = searchRecords(records, "needle")

    assert.ok(result)
    assert.ok(result.snippet.includes("needle"))
    assert.ok(result.snippet.length <= 163)
    assert.doesNotMatch(result.snippet, /<[^>]*>/)
    assert.doesNotMatch(result.snippet, /&lt;/)
  })
})

describe("content index patch merging", () => {
  test("queues slugs before initialization and consumes patches afterward", async () => {
    const { buildSearchRecords, createSearchRecordMerger } = await core()
    const merger = createSearchRecordMerger()

    assert.deepStrictEqual(merger.queue(["locked", "metadata-only", "locked"]), [])
    assert.deepStrictEqual(merger.takeQueuedSlugs(), ["locked", "metadata-only"])

    const initial = buildSearchRecords({ base: { title: "Base", tags: [], content: "Body" } })
    merger.initialize(initial)
    const merged = merger.merge(
      {
        locked: { slug: "ignored-slug", title: "Unlocked", tags: ["Secret"], content: "Text" },
        "metadata-only": { title: "Metadata", tags: ["Patch"] },
      },
      ["locked", "metadata-only", "missing"],
    )

    assert.deepStrictEqual(
      merged.map((record) => [record.slug, record.title, record.tags, record.content]),
      [
        ["locked", "Unlocked", ["Secret"], "Text"],
        ["metadata-only", "Metadata", ["Patch"], ""],
      ],
    )
    assert.deepStrictEqual(
      merger.getRecords().map((record) => record.slug),
      ["base", "locked", "metadata-only"],
    )
  })

  test("merges queued slugs immediately when records are already initialized", async () => {
    const { buildSearchRecords, createSearchRecordMerger } = await core()
    const merger = createSearchRecordMerger()
    merger.initialize(buildSearchRecords({ base: { title: "Base" } }))

    assert.deepStrictEqual(merger.queue(["patch"]), ["patch"])
    assert.deepStrictEqual(merger.takeQueuedSlugs(), [])
  })
})

test("SearchLazy renders the established markup and bundles a lazy browser script", async () => {
  const originalFetch = globalThis.fetch
  let fetches = 0
  globalThis.fetch = async () => {
    fetches += 1
    throw new Error("component creation must not fetch")
  }

  try {
    const { SearchLazy } = await import("./components.js")
    const Component = SearchLazy()
    const html = render(
      Component({
        displayClass: "desktop-only",
        cfg: { locale: "zh-CN" },
      } as never),
    )

    for (const className of [
      "search",
      "search-button",
      "search-container",
      "search-space",
      "search-bar",
      "search-layout",
      "results-container",
    ]) {
      assert.match(html, new RegExp(`class="[^"]*\\b${className}\\b`))
    }
    assert.match(Component.afterDOMLoaded ?? "", /searchIndex\.json/)
    assert.match(Component.afterDOMLoaded ?? "", /content-index-updated/)
    assert.doesNotMatch(Component.afterDOMLoaded ?? "", /innerHTML\s*=/)
    assert.equal(typeof Component.css, "string")
    assert.equal(fetches, 0)
  } finally {
    globalThis.fetch = originalFetch
  }
})
