import assert from "node:assert/strict"
import test, { describe } from "node:test"
import { runInNewContext } from "node:vm"
import { render } from "preact-render-to-string"

async function core() {
  return import("./graph-load.js")
}

describe("graphLoadAction", () => {
  test("waits for an explicit action on mobile even when intersecting", async () => {
    const { graphLoadAction } = await core()

    assert.equal(graphLoadAction({ mobile: true, intersecting: true, explicit: false }), "wait")
  })

  test("loads an intersecting desktop graph", async () => {
    const { graphLoadAction } = await core()

    assert.equal(graphLoadAction({ mobile: false, intersecting: true, explicit: false }), "load")
  })

  test("loads an explicitly requested graph on every viewport", async () => {
    const { graphLoadAction } = await core()

    assert.equal(graphLoadAction({ mobile: true, intersecting: false, explicit: true }), "load")
    assert.equal(graphLoadAction({ mobile: false, intersecting: false, explicit: true }), "load")
  })

  test("waits while a graph is outside the viewport and was not requested", async () => {
    const { graphLoadAction } = await core()

    assert.equal(graphLoadAction({ mobile: false, intersecting: false, explicit: false }), "wait")
  })
})

test("globalGraphButtonLabel follows the overlay state", async () => {
  const { globalGraphButtonLabel } = await core()

  assert.equal(globalGraphButtonLabel(false), "打开全局关系图")
  assert.equal(globalGraphButtonLabel(true), "关闭全局关系图")
})

describe("createRetryableLoader", () => {
  test("shares one attempt across concurrent and later successful calls", async () => {
    const { createRetryableLoader } = await core()
    let attempts = 0
    let release: (() => void) | undefined
    const blocked = new Promise<void>((resolve) => {
      release = resolve
    })
    const loader = createRetryableLoader(async () => {
      attempts += 1
      await blocked
      return { attempt: attempts }
    })

    const first = loader()
    const second = loader()
    assert.strictEqual(first, second)
    release?.()

    const [firstValue, secondValue] = await Promise.all([first, second])
    const thirdValue = await loader()

    assert.strictEqual(firstValue, secondValue)
    assert.strictEqual(secondValue, thirdValue)
    assert.equal(attempts, 1)
  })

  test("clears a rejected attempt so a later call can retry", async () => {
    const { createRetryableLoader } = await core()
    let attempts = 0
    const loader = createRetryableLoader(async () => {
      attempts += 1
      if (attempts === 1) throw new Error("temporary graph library failure")
      return "ready"
    })

    await assert.rejects(loader(), /temporary graph library failure/)
    assert.equal(await loader(), "ready")
    assert.equal(attempts, 2)
  })
})

describe("graph library loading", () => {
  type FakeWindow = { d3?: object; PIXI?: object }
  type FakeScript = {
    crossOrigin: string
    dataset: Record<string, string>
    onerror?: () => void
    onload?: () => void
    removed: boolean
    src: string
    remove: () => void
  }

  function browserHarness(loadGlobals: (script: FakeScript, window: FakeWindow) => void) {
    const window: FakeWindow = {}
    const scripts: FakeScript[] = []
    const document = {
      createElement(tagName: string) {
        assert.equal(tagName, "script")
        const script: FakeScript = {
          crossOrigin: "",
          dataset: {},
          removed: false,
          src: "",
          remove() {
            script.removed = true
          },
        }
        return script
      },
      head: {
        appendChild(script: FakeScript) {
          scripts.push(script)
          queueMicrotask(() => {
            loadGlobals(script, window)
            script.onload?.()
          })
          return script
        },
      },
      querySelector(selector: string) {
        const match = selector.match(/^script\[src="(.+)"\]$/)
        return scripts.find((script) => !script.removed && script.src === match?.[1]) ?? null
      },
    }
    return { document, scripts, window }
  }

  test("reuses already loaded globals without inserting scripts", async () => {
    const { createGraphLibraryLoader } = await core()
    const harness = browserHarness(() => {})
    harness.window.d3 = { ready: true }
    harness.window.PIXI = { ready: true }
    const load = createGraphLibraryLoader(harness)

    const libraries = await load()

    assert.strictEqual(libraries.d3, harness.window.d3)
    assert.strictEqual(libraries.PIXI, harness.window.PIXI)
    assert.equal(harness.scripts.length, 0)
  })

  test("loads exact CDN scripts, requires both globals, and retries after removing failures", async () => {
    const { createGraphLibraryLoader, D3_CDN_URL, PIXI_CDN_URL } = await core()
    let successfulAttempt = false
    const harness = browserHarness((script, window) => {
      if (!successfulAttempt) return
      if (script.src === D3_CDN_URL) window.d3 = { ready: true }
      if (script.src === PIXI_CDN_URL) window.PIXI = { ready: true }
    })
    const load = createGraphLibraryLoader(harness)

    const failed = load()
    assert.strictEqual(failed, load())
    await assert.rejects(failed, /globals were unavailable/)
    assert.deepStrictEqual(
      harness.scripts.map(({ src }) => src),
      [
        "https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js",
        "https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.js",
      ],
    )
    assert.equal(
      harness.scripts.every(({ removed }) => removed),
      true,
    )

    successfulAttempt = true
    const libraries = await load()

    assert.strictEqual(libraries.d3, harness.window.d3)
    assert.strictEqual(libraries.PIXI, harness.window.PIXI)
    assert.equal(harness.scripts.length, 4)
  })

  test("replaces an existing script whose load event and global are unavailable", async () => {
    const { createGraphLibraryLoader, D3_CDN_URL, PIXI_CDN_URL } = await core()
    const harness = browserHarness((script, window) => {
      if (script.src === D3_CDN_URL) window.d3 = { ready: true }
      if (script.src === PIXI_CDN_URL) window.PIXI = { ready: true }
    })
    const staleD3 = harness.document.createElement("script")
    staleD3.src = D3_CDN_URL
    const stalePixi = harness.document.createElement("script")
    stalePixi.src = PIXI_CDN_URL
    harness.scripts.push(staleD3, stalePixi)
    const load = createGraphLibraryLoader(harness)

    const libraries = await Promise.race([
      load(),
      new Promise<never>((_resolve, reject) => {
        setTimeout(() => reject(new Error("existing graph script load timed out")), 50)
      }),
    ])

    assert.equal(staleD3.removed, true)
    assert.equal(stalePixi.removed, true)
    assert.equal(harness.scripts.length, 4)
    assert.strictEqual(libraries.d3, harness.window.d3)
    assert.strictEqual(libraries.PIXI, harness.window.PIXI)
  })
})

describe("createGraphTriggerController", () => {
  test("ignores mobile intersections and shares an explicit initialization", async () => {
    const { createGraphTriggerController } = await core()
    let initializations = 0
    let release: (() => void) | undefined
    const blocked = new Promise<void>((resolve) => {
      release = resolve
    })
    const controller = createGraphTriggerController({
      mobile: true,
      load: async () => {
        initializations += 1
        await blocked
      },
    })

    assert.equal(controller.intersect(true), undefined)
    assert.equal(initializations, 0)

    const first = controller.explicit()
    const second = controller.explicit()
    assert.strictEqual(first, second)
    release?.()
    await first

    await controller.explicit()
    assert.equal(initializations, 1)
    assert.equal(controller.isLoaded(), true)
  })

  test("unlocks after a failed initialization so an explicit retry can succeed", async () => {
    const { createGraphTriggerController } = await core()
    let attempts = 0
    const controller = createGraphTriggerController({
      mobile: false,
      load: async () => {
        attempts += 1
        if (attempts === 1) throw new Error("temporary render failure")
      },
    })

    await assert.rejects(controller.intersect(true)!, /temporary render failure/)
    await controller.explicit()

    assert.equal(attempts, 2)
    assert.equal(controller.isLoaded(), true)
  })

  test("updates intersection policy when the viewport crosses the mobile breakpoint", async () => {
    const { createGraphTriggerController } = await core()
    let mobileStarted = 0
    const fromMobile = createGraphTriggerController({
      mobile: true,
      load: async () => {
        mobileStarted += 1
      },
    })

    fromMobile.setMobile(false)
    await fromMobile.intersect(true)
    assert.equal(mobileStarted, 1)

    let desktopStarted = 0
    const fromDesktop = createGraphTriggerController({
      mobile: false,
      load: async () => {
        desktopStarted += 1
      },
    })
    fromDesktop.setMobile(true)

    assert.equal(fromDesktop.intersect(true), undefined)
    assert.equal(desktopStarted, 0)
  })
})

describe("graph metadata", () => {
  test("normalizes a flat content index without treating content as a wrapper", async () => {
    const { normalizeGraphMetadata } = await core()
    const source = Object.fromEntries([
      ["normal", { slug: "normal", title: "Normal", links: ["content"], tags: ["graph"] }],
      ["content", { slug: "content", title: "Content slug", links: [], tags: ["edge"] }],
      ["__proto__", { slug: "__proto__", title: "Prototype slug", links: [], tags: [] }],
    ])

    const metadata = normalizeGraphMetadata(source)

    assert.deepStrictEqual([...metadata.keys()], ["normal", "content", "__proto__"])
    assert.deepStrictEqual(metadata.get("content"), {
      slug: "content",
      title: "Content slug",
      links: [],
      tags: ["edge"],
    })
    assert.equal(metadata.get("__proto__")?.title, "Prototype slug")
  })

  test("shares metadata work, retries failures, and rebuilds after invalidation", async () => {
    const { createGraphMetadataLoader } = await core()
    let attempts = 0
    let fail = true
    const metadata = createGraphMetadataLoader(async () => {
      attempts += 1
      if (fail) throw new Error("temporary metadata failure")
      return {
        [`note-${attempts}`]: {
          slug: `note-${attempts}`,
          title: `Attempt ${attempts}`,
          links: [],
          tags: [],
        },
      }
    })

    const failed = metadata.load()
    assert.strictEqual(failed, metadata.load())
    await assert.rejects(failed, /temporary metadata failure/)

    fail = false
    const first = metadata.load()
    const concurrent = metadata.load()
    assert.strictEqual(first, concurrent)
    const firstValue = await first
    assert.strictEqual(await metadata.load(), firstValue)
    assert.deepStrictEqual([...firstValue.keys()], ["note-2"])

    metadata.invalidate()
    const secondValue = await metadata.load()
    assert.notStrictEqual(secondValue, firstValue)
    assert.deepStrictEqual([...secondValue.keys()], ["note-3"])
    assert.equal(attempts, 3)
  })

  test("rebuilds an in-flight request before exposing data invalidated mid-load", async () => {
    const { createGraphMetadataLoader } = await core()
    const releases: Array<(value: unknown) => void> = []
    const metadata = createGraphMetadataLoader(
      () =>
        new Promise((resolve) => {
          releases.push(resolve)
        }),
    )

    const first = metadata.load()
    await Promise.resolve()
    assert.equal(releases.length, 1)

    metadata.invalidate()
    releases[0]({ stale: { slug: "stale", title: "Stale", links: [], tags: [] } })
    await new Promise<void>((resolve) => setImmediate(resolve))

    assert.equal(releases.length, 2)
    releases[1]({ fresh: { slug: "fresh", title: "Fresh", links: [], tags: [] } })
    const value = await first

    assert.deepStrictEqual([...value.keys()], ["fresh"])
    assert.strictEqual(await metadata.load(), value)
  })
})

test("GraphLazy renders the complete lazy shell without fetching during component creation", async () => {
  const originalFetch = globalThis.fetch
  let fetches = 0
  globalThis.fetch = async () => {
    fetches += 1
    throw new Error("component creation must not fetch")
  }

  try {
    const { GraphLazy, defaultGraphOptions } = await import("./components.js")
    assert.deepStrictEqual(defaultGraphOptions, {
      localGraph: {
        drag: true,
        zoom: true,
        depth: 1,
        scale: 1.1,
        repelForce: 0.5,
        centerForce: 0.3,
        linkDistance: 30,
        fontSize: 0.6,
        opacityScale: 1,
        showTags: true,
        removeTags: [],
        focusOnHover: false,
        enableRadial: false,
      },
      globalGraph: {
        drag: true,
        zoom: true,
        depth: -1,
        scale: 0.9,
        repelForce: 0.5,
        centerForce: 0.2,
        linkDistance: 30,
        fontSize: 0.6,
        opacityScale: 1,
        showTags: true,
        removeTags: [],
        focusOnHover: true,
        enableRadial: true,
      },
    })

    const Component = GraphLazy()
    const html = render(
      Component({
        displayClass: "desktop-only",
        cfg: { locale: "zh-CN" },
      } as never),
    )

    for (const className of [
      "graph",
      "graph-outer",
      "graph-container",
      "graph-load-button",
      "global-graph-icon",
      "global-graph-outer",
      "global-graph-container",
    ]) {
      assert.match(html, new RegExp(`class="[^"]*\\b${className}\\b`))
    }
    assert.match(html, /<h3>关系图谱<\/h3>/)
    assert.match(html, /class="graph-container"[^>]*data-cfg=/)
    assert.match(html, /class="global-graph-container"[^>]*data-cfg=/)
    assert.match(html, /class="graph-load-button"[^>]*type="button"/)
    assert.match(html, /aria-label="加载关系图"/)
    assert.match(html, /加载关系图/)
    assert.match(html, /class="global-graph-icon"[^>]*type="button"/)
    assert.match(html, /aria-expanded="false"/)
    assert.match(html, /class="global-graph-outer"[^>]*aria-hidden="true"/)
    assert.doesNotMatch(html, /<script\b/)
    assert.equal(typeof Component.css, "string")
    assert.equal(fetches, 0)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("GraphLazy exposes the retry button after a desktop load error", async () => {
  const { GraphLazy } = await import("./components.js")
  const css = GraphLazy().css ?? ""

  assert.match(
    css,
    /\.graph-outer\[data-state=["']error["']\]\s+\.graph-load-button:not\(\[hidden\]\)[^{]*\{[^}]*display:\s*inline-flex/,
  )
})

test("GraphLazy bundle contains the deferred runtime contracts", async () => {
  const { GraphLazy } = await import("./components.js")
  const script = GraphLazy().afterDOMLoaded ?? ""

  for (const token of [
    "https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js",
    "https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.js",
    "IntersectionObserver",
    "200px",
    "requestIdleCallback",
    "content-index-updated",
    "prenav",
    "nav",
    "render",
    "themechange",
  ]) {
    assert.match(script, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")))
  }
  assert.match(script, /setTimeout/)
  assert.match(script, /1e3|1000/)
  assert.match(script, /metaKey|ctrlKey/)
  assert.match(script, /shiftKey/)
  assert.match(script, /"g"/)
  assert.match(script, /addEventListener\("change"/)
})

test("GraphLazy rolls back the global overlay when Pixi initialization fails", async () => {
  const { GraphLazy } = await import("./components.js")
  const script = GraphLazy().afterDOMLoaded ?? ""
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
  }

  class FakeElement {
    readonly attributes = new Map<string, string>()
    readonly classList = new FakeClassList()
    readonly dataset: Record<string, string> = {}
    readonly style: Record<string, string> = {}
    firstChild: FakeElement | null = null
    hidden = false
    isConnected = true
    offsetHeight = 600
    offsetWidth = 800
    root?: FakeElement
    textContent = ""

    constructor(readonly className = "") {}

    appendChild(child: FakeElement) {
      this.firstChild = child
      return child
    }

    closest(selector: string) {
      if (selector === ".graph") return this.root ?? (this.className === "graph" ? this : null)
      if (selector === ".global-graph-icon" && this.className === "global-graph-icon") return this
      return null
    }

    querySelector(_selector: string): FakeElement | null {
      return null
    }

    remove() {
      this.firstChild = null
    }

    removeAttribute(name: string) {
      this.attributes.delete(name)
    }

    setAttribute(name: string, value: string) {
      this.attributes.set(name, value)
    }
  }

  const root = new FakeElement("graph")
  root.root = root
  const elements = Object.fromEntries(
    [
      ".graph-outer",
      ".graph-container",
      ".graph-load-button",
      ".graph-load-status",
      ".global-graph-icon",
      ".global-graph-outer",
      ".global-graph-container",
    ].map((selector) => {
      const element = new FakeElement(selector.slice(1))
      element.root = root
      return [selector, element]
    }),
  ) as Record<string, FakeElement>
  root.querySelector = (selector: string) => elements[selector] ?? null
  elements[".graph-container"].dataset.cfg = "{}"
  elements[".global-graph-container"].dataset.cfg = "{}"

  const listeners = new Map<string, Set<Listener>>()
  const document = {
    body: Object.assign(new FakeElement(), { dataset: { basepath: "" } }),
    documentElement: new FakeElement(),
    addEventListener(type: string, listener: Listener) {
      const values = listeners.get(type) ?? new Set<Listener>()
      values.add(listener)
      listeners.set(type, values)
    },
    createElement() {
      return new FakeElement()
    },
    dispatch(type: string, event: Record<string, unknown> = {}) {
      for (const listener of listeners.get(type) ?? []) listener(event)
    },
    querySelectorAll(selector: string) {
      return selector === ".graph" ? [root] : []
    },
  }
  const mediaListeners = new Set<Listener>()
  const window = {
    PIXI: {
      Application: class {
        async init() {
          throw new Error("pixi init failed")
        }
      },
    },
    d3: {},
    devicePixelRatio: 1,
    location: { href: "https://example.com/", origin: "https://example.com", pathname: "/" },
    matchMedia() {
      return {
        matches: true,
        addEventListener(_type: string, listener: Listener) {
          mediaListeners.add(listener)
        },
        removeEventListener(_type: string, listener: Listener) {
          mediaListeners.delete(listener)
        },
      }
    },
  }
  const storage = new Map<string, string>()
  const localStorage = {
    getItem(key: string) {
      return storage.get(key) ?? null
    },
    setItem(key: string, value: string) {
      storage.set(key, value)
    },
  }

  runInNewContext(script, {
    URL,
    console,
    document,
    fetchData: Promise.resolve({ index: { title: "Home", links: [], tags: [] } }),
    getComputedStyle: () => ({ getPropertyValue: () => "" }),
    localStorage,
    window,
  })
  document.dispatch("nav", { detail: { url: "index" } })
  document.dispatch("click", { target: elements[".global-graph-icon"] })
  await new Promise<void>((resolve) => setImmediate(resolve))

  assert.equal(elements[".global-graph-outer"].classList.contains("active"), false)
  assert.equal(elements[".global-graph-outer"].attributes.get("aria-hidden"), "true")
  assert.equal(elements[".global-graph-container"].attributes.get("aria-busy"), "false")
  assert.equal(elements[".global-graph-icon"].attributes.get("aria-expanded"), "false")
  assert.equal(elements[".global-graph-icon"].dataset.state, "error")
  assert.equal(
    elements[".global-graph-icon"].attributes.get("aria-label"),
    "全局关系图加载失败，重试",
  )
})

test("GraphLazy bundle starts inert and only registers event handlers", async () => {
  const { GraphLazy } = await import("./components.js")
  const script = GraphLazy().afterDOMLoaded ?? ""
  type Listener = (event?: Record<string, unknown>) => void
  const listeners = new Map<string, Set<Listener>>()
  let domQueries = 0
  let scriptCreations = 0
  let scriptInsertions = 0
  let fetchReads = 0
  let mediaReads = 0
  const document = {
    addEventListener(type: string, listener: Listener) {
      const values = listeners.get(type) ?? new Set<Listener>()
      values.add(listener)
      listeners.set(type, values)
    },
    createElement() {
      scriptCreations += 1
      throw new Error("initial execution must not create elements")
    },
    head: {
      appendChild() {
        scriptInsertions += 1
      },
    },
    querySelectorAll() {
      domQueries += 1
      return []
    },
  }
  const fetchData = {
    then() {
      fetchReads += 1
      throw new Error("initial execution must not await fetchData")
    },
  }
  const window = {
    matchMedia() {
      mediaReads += 1
      return { matches: false }
    },
  }

  assert.doesNotThrow(() =>
    runInNewContext(script, {
      URL,
      console,
      document,
      fetchData,
      window,
    }),
  )
  assert.equal(domQueries, 0)
  assert.equal(scriptCreations, 0)
  assert.equal(scriptInsertions, 0)
  assert.equal(fetchReads, 0)
  assert.equal(mediaReads, 0)
  for (const eventName of [
    "click",
    "keydown",
    "content-index-updated",
    "prenav",
    "nav",
    "render",
    "themechange",
  ]) {
    assert.equal(listeners.get(eventName)?.size, 1, `${eventName} listener`)
  }
})
