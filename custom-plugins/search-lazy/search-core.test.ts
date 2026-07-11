import assert from "node:assert/strict"
import { runInNewContext } from "node:vm"
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

  test("preserves every flat-map slug including content and __proto__", async () => {
    const { buildSearchRecords, extractSearchIndex } = await core()
    const source = Object.fromEntries([
      ["normal", { title: "Normal", tags: [], content: "Body" }],
      ["content", { title: "Content slug", tags: ["edge"], content: "Entry body" }],
      ["__proto__", { title: "Prototype slug", tags: [], content: "Safe body" }],
    ])

    assert.deepStrictEqual(
      buildSearchRecords(extractSearchIndex(source)).map(({ slug, title }) => [slug, title]),
      [
        ["normal", "Normal"],
        ["content", "Content slug"],
        ["__proto__", "Prototype slug"],
      ],
    )
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
      "search-close",
      "search-container",
      "search-space",
      "search-bar",
      "search-layout",
      "results-container",
    ]) {
      assert.match(html, new RegExp(`class="[^"]*\\b${className}\\b`))
    }
    assert.match(html, /aria-label="关闭搜索"/)
    assert.match(html, /role="combobox"/)
    assert.match(html, /aria-expanded="false"/)
    assert.match(html, /aria-autocomplete="list"/)
    assert.doesNotMatch(html, /id="search-lazy-results"/)
    assert.doesNotMatch(html, /aria-controls="search-lazy-results"/)
    assert.match(Component.afterDOMLoaded ?? "", /searchIndex\.json/)
    assert.match(Component.afterDOMLoaded ?? "", /content-index-updated/)
    assert.match(Component.afterDOMLoaded ?? "", /search-lazy-results-/)
    assert.match(Component.afterDOMLoaded ?? "", /aria-activedescendant/)
    assert.match(Component.afterDOMLoaded ?? "", /-option-/)
    assert.match(Component.afterDOMLoaded ?? "", /"Tab"/)
    assert.doesNotMatch(Component.afterDOMLoaded ?? "", /innerHTML\s*=/)
    assert.equal(typeof Component.css, "string")
    assert.equal(fetches, 0)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("SearchLazy waits for nav and flushes the current query before Enter", async () => {
  const { SearchLazy } = await import("./components.js")
  const script = SearchLazy().afterDOMLoaded ?? ""
  type Listener = (event?: Record<string, unknown>) => void

  class FakeClassList {
    private readonly values = new Set<string>()

    add(value: string) {
      this.values.add(value)
    }

    remove(value: string) {
      this.values.delete(value)
    }

    contains(value: string) {
      return this.values.has(value)
    }

    toggle(value: string, force?: boolean) {
      const enabled = force ?? !this.values.has(value)
      if (enabled) this.values.add(value)
      else this.values.delete(value)
      return enabled
    }
  }

  class FakeElement {
    readonly attributes = new Map<string, string>()
    readonly children: FakeElement[] = []
    readonly classList = new FakeClassList()
    readonly dataset: Record<string, string> = {}
    readonly listeners = new Map<string, Set<Listener>>()
    className = ""
    clicks = 0
    hidden = false
    href = ""
    id = ""
    isConnected = true
    parent?: FakeElement
    textContent = ""
    value = ""

    constructor(private readonly ownerDocument: FakeDocument) {}

    addEventListener(type: string, listener: Listener) {
      const listeners = this.listeners.get(type) ?? new Set<Listener>()
      listeners.add(listener)
      this.listeners.set(type, listeners)
    }

    removeEventListener(type: string, listener: Listener) {
      this.listeners.get(type)?.delete(listener)
    }

    appendChild(child: FakeElement) {
      child.parent = this
      this.children.push(child)
      return child
    }

    click() {
      this.clicks += 1
    }

    dispatch(type: string, event: Record<string, unknown> = {}) {
      for (const listener of this.listeners.get(type) ?? []) listener(event)
    }

    focus() {
      this.ownerDocument.activeElement = this
    }

    querySelector(_selector: string): FakeElement | null {
      return null
    }

    querySelectorAll(selector: string): FakeElement[] {
      if (selector === ".result-card") {
        return this.children.filter((child) =>
          child.className.split(/\s+/u).includes("result-card"),
        )
      }
      return []
    }

    remove() {
      if (!this.parent) return
      const index = this.parent.children.indexOf(this)
      if (index !== -1) this.parent.children.splice(index, 1)
    }

    removeAttribute(name: string) {
      this.attributes.delete(name)
    }

    scrollIntoView() {}

    setAttribute(name: string, value: string) {
      this.attributes.set(name, value)
    }
  }

  class FakeDocument {
    activeElement: FakeElement | null = null
    readonly body = { dataset: { basepath: "" } }
    readonly listeners = new Map<string, Set<Listener>>()
    readonly roots: FakeElement[] = []
    searchQueries = 0

    addEventListener(type: string, listener: Listener) {
      const listeners = this.listeners.get(type) ?? new Set<Listener>()
      listeners.add(listener)
      this.listeners.set(type, listeners)
    }

    createElement() {
      return new FakeElement(this)
    }

    dispatch(type: string, event: Record<string, unknown> = {}) {
      for (const listener of this.listeners.get(type) ?? []) listener(event)
    }

    querySelectorAll(selector: string) {
      if (selector !== ".search") return []
      this.searchQueries += 1
      return this.roots
    }
  }

  const document = new FakeDocument()
  const createRoot = () => {
    const root = new FakeElement(document)
    const elements = Object.fromEntries(
      [
        ".search-button",
        ".search-close",
        ".search-container",
        ".search-bar",
        ".search-layout",
        ".results-container",
        ".search-status",
        ".search-retry",
      ].map((selector) => [selector, new FakeElement(document)]),
    ) as Record<string, FakeElement>
    root.querySelector = (selector: string) => elements[selector] ?? null
    return { root, elements }
  }
  const first = createRoot()
  const second = createRoot()
  document.roots.push(first.root, second.root)
  let fetches = 0
  let nextTimerId = 0
  const timers = new Map<number, () => void>()
  const cleanup: Array<() => void> = []
  const window = {
    clearTimeout: (timerId: number) => timers.delete(timerId),
    location: { origin: "https://example.com" },
    setTimeout: (callback: () => void) => {
      const timerId = ++nextTimerId
      timers.set(timerId, callback)
      return timerId
    },
  } as Record<string, unknown>

  assert.doesNotThrow(() =>
    runInNewContext(script, {
      URL,
      console,
      document,
      fetch: async () => {
        fetches += 1
        return {
          json: async () => ({
            "notes/quartz": { title: "Quartz", tags: [], content: "Static site generator" },
            "notes/performance": { title: "性能", tags: [], content: "Redis optimization" },
          }),
          ok: true,
        }
      },
      window,
    }),
  )
  assert.equal(document.searchQueries, 0)
  assert.equal(fetches, 0)
  assert.equal(document.listeners.get("nav")?.size, 1)

  window.addCleanup = (fn: () => void) => cleanup.push(fn)
  document.dispatch("nav")

  assert.equal(cleanup.length, 2)
  assert.equal(first.root.dataset.searchLazyBound, "true")
  assert.equal(second.root.dataset.searchLazyBound, "true")
  const firstResultsId = first.elements[".results-container"].id
  const secondResultsId = second.elements[".results-container"].id
  assert.match(firstResultsId, /^search-lazy-results-/)
  assert.match(secondResultsId, /^search-lazy-results-/)
  assert.notEqual(firstResultsId, secondResultsId)
  assert.equal(first.elements[".search-bar"].attributes.get("aria-controls"), firstResultsId)
  assert.equal(second.elements[".search-bar"].attributes.get("aria-controls"), secondResultsId)
  assert.equal(fetches, 0)

  const input = first.elements[".search-bar"]
  const results = first.elements[".results-container"]
  input.value = "Quartz"
  first.elements[".search-button"].dispatch("click")
  await new Promise<void>((resolve) => setImmediate(resolve))

  assert.equal(fetches, 1)
  assert.equal(results.children.length, 1)
  const staleResult = results.children[0]
  assert.equal(staleResult.href, "/notes/quartz")

  input.value = "性能"
  input.dispatch("input")
  input.dispatch("keydown", {
    isComposing: false,
    key: "Enter",
    preventDefault() {},
  })

  assert.equal(staleResult.clicks, 0)
  assert.equal(timers.size, 0)
  assert.equal(results.children.length, 1)
  assert.equal(results.children[0].href, "/notes/performance")
  assert.equal(results.children[0].clicks, 1)
})
