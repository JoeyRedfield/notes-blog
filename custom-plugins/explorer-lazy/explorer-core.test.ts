import assert from "node:assert/strict"
import test, { describe } from "node:test"
import { runInNewContext } from "node:vm"
import { render } from "preact-render-to-string"

async function core() {
  return import("./explorer-core.js")
}

describe("createTrieCache", () => {
  test("shares one promise and trie for concurrent and later calls with the same serialized key", async () => {
    const { createTrieCache, serializeTrieCacheKey } = await core()
    const cache = createTrieCache<object>()
    const key = serializeTrieCacheKey(
      JSON.stringify({ order: ["filter", "map", "sort"] }),
      JSON.stringify({ folderDefaultState: "collapsed", folderClickBehavior: "link" }),
    )
    let loads = 0
    let release: (() => void) | undefined
    const blocked = new Promise<void>((resolve) => {
      release = resolve
    })
    const loader = async () => {
      loads += 1
      await blocked
      return { id: loads }
    }

    const first = cache.get(key, loader)
    const second = cache.get(key, loader)
    assert.strictEqual(first, second)
    release?.()

    const [firstTrie, secondTrie] = await Promise.all([first, second])
    const third = cache.get(key, loader)

    assert.strictEqual(firstTrie, secondTrie)
    assert.strictEqual(third, first)
    assert.strictEqual(await third, firstTrie)
    assert.equal(loads, 1)
  })

  test("isolates different serialized dataFns and component configs", async () => {
    const { createTrieCache, serializeTrieCacheKey } = await core()
    const cache = createTrieCache<string>()
    const defaultKey = serializeTrieCacheKey("default-data-fns", "collapsed-link")
    const mappedKey = serializeTrieCacheKey("mapped-data-fns", "collapsed-link")
    const openKey = serializeTrieCacheKey("default-data-fns", "open-link")
    let loads = 0

    const values = await Promise.all(
      [defaultKey, mappedKey, openKey].map((key) => cache.get(key, async () => `trie-${++loads}`)),
    )

    assert.deepStrictEqual(values, ["trie-1", "trie-2", "trie-3"])
    assert.notEqual(defaultKey, mappedKey)
    assert.notEqual(defaultKey, openKey)
    assert.equal(loads, 3)
  })

  test("clears a rejected load so the same key can retry", async () => {
    const { createTrieCache, serializeTrieCacheKey } = await core()
    const cache = createTrieCache<string>()
    const key = serializeTrieCacheKey("default", "collapsed")
    let attempts = 0
    const loader = async () => {
      attempts += 1
      if (attempts === 1) throw new Error("temporary explorer failure")
      return "recovered"
    }

    await assert.rejects(cache.get(key, loader), /temporary explorer failure/)

    assert.equal(await cache.get(key, loader), "recovered")
    assert.equal(attempts, 2)
  })

  test("reloads after invalidate", async () => {
    const { createTrieCache, serializeTrieCacheKey } = await core()
    const cache = createTrieCache<object>()
    const key = serializeTrieCacheKey("default", "collapsed")
    let loads = 0
    const loader = async () => ({ load: ++loads })

    const first = await cache.get(key, loader)
    cache.invalidate()
    const second = await cache.get(key, loader)

    assert.notStrictEqual(first, second)
    assert.equal(loads, 2)
  })
})

describe("Explorer trie", () => {
  test("builds a stable flat-map trie without treating content as a wrapper", async () => {
    const { buildTrie } = await core()
    const index = Object.fromEntries([
      ["z", { slug: "z", title: "Zed", filePath: "z.md" }],
      ["a/b/note", { slug: "a/b/note", title: "Note", filePath: "a/b/note.md" }],
      ["a/index", { slug: "a/index", title: "index", filePath: "a/index.md" }],
      ["tags/performance", { slug: "tags/performance", title: "Tag page" }],
      ["content", { slug: "content", title: "Content slug", filePath: "content.md" }],
      ["__proto__", { slug: "__proto__", title: "Prototype slug", filePath: "proto.md" }],
    ])

    const trie = buildTrie(index)

    assert.equal(trie.slug, "")
    assert.equal(trie.isFolder, true)
    assert.deepStrictEqual(
      trie.children.map(({ slug }) => slug),
      ["a", "content", "__proto__", "z"],
    )

    const folder = trie.children[0]
    assert.equal(folder.slugSegment, "a")
    assert.equal(folder.displayName, "a")
    assert.equal(folder.isFolder, true)
    assert.equal(folder.data?.title, "index")
    assert.deepStrictEqual(
      folder.children.map(({ slug }) => slug),
      ["a/b"],
    )
    assert.deepStrictEqual(
      folder.children[0]?.children.map(({ slug }) => slug),
      ["a/b/note"],
    )

    const content = trie.children.find(({ slug }) => slug === "content")
    const prototype = trie.children.find(({ slug }) => slug === "__proto__")
    assert.equal(content?.data?.title, "Content slug")
    assert.equal(prototype?.data?.title, "Prototype slug")
    assert.equal(
      trie.children.some(({ slugSegment }) => slugSegment === "tags"),
      false,
    )
  })

  test("does not require full-text content and honors serialized filter/map/sort order", async () => {
    const { buildTrie } = await core()
    const index = {
      alpha: { slug: "alpha", title: "Alpha", links: [], tags: [] },
      beta: { slug: "beta", title: "Beta", links: [], tags: [] },
      hidden: { slug: "hidden", title: "Hidden", links: [], tags: [] },
    }
    const dataFns = JSON.stringify({
      filterFn: "(node) => node.slugSegment !== 'hidden'",
      mapFn: "(node) => { node.displayName = node.displayName.toUpperCase() }",
      sortFn: "(a, b) => b.displayName.localeCompare(a.displayName)",
      order: ["map", "filter", "sort"],
    })

    const trie = buildTrie(index, dataFns)

    assert.deepStrictEqual(
      trie.children.map(({ slug, displayName }) => [slug, displayName]),
      [
        ["beta", "BETA"],
        ["alpha", "ALPHA"],
      ],
    )
  })

  test("only exposes root nodes, open folder descendants, and the active path", async () => {
    const { buildTrie, visibleSlugs } = await core()
    const trie = buildTrie({
      "a/b/note": { slug: "a/b/note", title: "Note" },
      "a/b/other": { slug: "a/b/other", title: "Other" },
      "a/file": { slug: "a/file", title: "File" },
      z: { slug: "z", title: "Zed" },
    })

    assert.deepStrictEqual(visibleSlugs(trie, new Set(), "a/b/note"), ["a", "a/b", "a/b/note", "z"])
    assert.deepStrictEqual(visibleSlugs(trie, new Set(["a/index", "a/b/index"]), "z"), [
      "a",
      "a/b",
      "a/b/note",
      "a/b/other",
      "a/file",
      "z",
    ])
  })

  test("materializes a folder's children only once", async () => {
    const { buildTrie, materializeChildrenOnce } = await core()
    const trie = buildTrie({
      "a/first": { slug: "a/first", title: "First" },
      "a/second": { slug: "a/second", title: "Second" },
    })
    const folder = trie.children[0]
    const marker: { generated?: string } = {}
    const rendered: string[] = []

    assert.equal(
      materializeChildrenOnce(folder, marker, (child) => rendered.push(child.slug)),
      true,
    )
    assert.equal(
      materializeChildrenOnce(folder, marker, (child) => rendered.push(child.slug)),
      false,
    )
    assert.deepStrictEqual(rendered, ["a/first", "a/second"])
    assert.equal(marker.generated, "true")
  })
})

test("ExplorerLazy renders a lightweight shell and bundles deferred delegated behavior", async () => {
  const originalFetch = globalThis.fetch
  let fetches = 0
  globalThis.fetch = async () => {
    fetches += 1
    throw new Error("component creation must not fetch")
  }

  try {
    const { ExplorerLazy } = await import("./components.js")
    const Component = ExplorerLazy({
      title: "Files",
      filterFn: (node: { slugSegment?: string }) => node.slugSegment !== "drafts",
    })
    const html = render(
      Component({
        displayClass: "desktop-only",
        cfg: { locale: "en-US" },
      } as never),
    )
    const firstChild = html.indexOf("><button")
    const rootTag = firstChild === -1 ? "" : html.slice(0, firstChild + 1)

    assert.match(rootTag, /class="[^"]*\bexplorer\b/)
    assert.match(rootTag, /\bnav-files-container\b/)
    assert.doesNotMatch(rootTag, /aria-expanded=/)
    assert.match(rootTag, /data-data-fns="[^"]*filterFn/)
    assert.match(rootTag, /data-config="[^"]*folderDefaultState/)
    assert.match(html, /class="[^"]*\bexplorer-toggle\b[^"]*\bmobile-explorer\b/)
    assert.match(html, /class="[^"]*\bexplorer-toggle\b[^"]*\bdesktop-explorer\b/)
    assert.match(html, /aria-expanded="false"/)
    assert.match(html, /aria-expanded="true"/)
    assert.match(html, /aria-controls="explorer-lazy-/)
    assert.match(html, /class="[^"]*\bexplorer-ul\b[^"]*\boverflow\b/)
    assert.match(html, /class="overflow-end"/)
    assert.match(html, /<template[^>]*explorer-file-template/)
    assert.match(html, /<template[^>]*explorer-folder-template/)

    const script = Component.afterDOMLoaded ?? ""
    assert.match(script, /content-index-updated/)
    assert.match(script, /"nav"/)
    assert.match(script, /"render"/)
    assert.match(script, /generated/)
    assert.equal((script.match(/addEventListener\("click"/gu) ?? []).length, 1)
    assert.equal(typeof Component.css, "string")
    assert.equal(fetches, 0)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("ExplorerLazy bundle waits for nav/render before reading the DOM or content index", async () => {
  const { ExplorerLazy } = await import("./components.js")
  const script = ExplorerLazy().afterDOMLoaded ?? ""
  type Listener = (event?: Record<string, unknown>) => void
  const listeners = new Map<string, Set<Listener>>()
  let domQueries = 0
  let fetchReads = 0
  const fetchData = {
    then() {
      fetchReads += 1
      throw new Error("fetchData must stay lazy until nav or render")
    },
  }
  const document = {
    addEventListener(type: string, listener: Listener) {
      const values = listeners.get(type) ?? new Set<Listener>()
      values.add(listener)
      listeners.set(type, values)
    },
    querySelectorAll() {
      domQueries += 1
      return []
    },
  }

  assert.doesNotThrow(() =>
    runInNewContext(script, {
      console,
      document,
      fetchData,
      URL,
      window: {},
    }),
  )
  assert.equal(domQueries, 0)
  assert.equal(fetchReads, 0)
  assert.equal(listeners.get("nav")?.size, 1)
  assert.equal(listeners.get("render")?.size, 1)
  assert.equal(listeners.get("content-index-updated")?.size, 1)
})
