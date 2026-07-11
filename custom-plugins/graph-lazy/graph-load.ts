export type GraphLoadAction = "load" | "wait"

export type GraphLoadConditions = {
  mobile: boolean
  intersecting: boolean
  explicit: boolean
}

export type GraphMetadataEntry = {
  slug: string
  title: string
  links: string[]
  tags: string[]
  [key: string]: unknown
}

export type GraphMetadata = Map<string, GraphMetadataEntry>

export const D3_CDN_URL = "https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"
export const PIXI_CDN_URL = "https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.js"

type GraphLibraryWindow = {
  d3?: unknown
  PIXI?: unknown
}

type GraphScript = {
  crossOrigin?: string
  dataset?: Record<string, string>
  onerror?: (() => void) | null
  onload?: (() => void) | null
  readyState?: string
  remove: () => void
  src: string
}

type GraphLibraryEnvironment = {
  window: GraphLibraryWindow
  document: {
    createElement: (tagName: string) => GraphScript
    head: { appendChild: (script: GraphScript) => unknown }
    querySelector: (selector: string) => GraphScript | null
  }
}

export function graphLoadAction({
  mobile,
  intersecting,
  explicit,
}: GraphLoadConditions): GraphLoadAction {
  return explicit || (!mobile && intersecting) ? "load" : "wait"
}

export function globalGraphButtonLabel(open: boolean): string {
  return open ? "关闭全局关系图" : "打开全局关系图"
}

export function createRetryableLoader<T>(load: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | undefined

  return () => {
    if (pending) return pending

    const attempt = Promise.resolve().then(load)
    pending = attempt
    void attempt.catch(() => {
      if (pending === attempt) pending = undefined
    })
    return attempt
  }
}

function scriptPromise(
  environment: GraphLibraryEnvironment,
  src: string,
  ready: () => boolean,
): Promise<GraphScript | undefined> {
  if (ready()) return Promise.resolve(undefined)

  let script = environment.document.querySelector(`script[src="${src}"]`)
  if (script) {
    script.remove()
    script = null
  }

  const shouldAppend = script === null
  script ??= environment.document.createElement("script")
  script.src = src
  script.crossOrigin = "anonymous"
  script.dataset ??= {}
  script.dataset.graphLazyLoader = "true"

  return new Promise<GraphScript>((resolve, reject) => {
    const previousLoad = script?.onload
    const previousError = script?.onerror
    script!.onload = () => {
      previousLoad?.()
      script!.dataset ??= {}
      script!.dataset.graphLazyLoaded = "true"
      resolve(script!)
    }
    script!.onerror = () => {
      previousError?.()
      reject(new Error(`Failed to load graph library: ${src}`))
    }
    if (shouldAppend) environment.document.head.appendChild(script!)
  }).catch((error) => {
    script?.remove()
    throw error
  })
}

export function createGraphLibraryLoader(environment: GraphLibraryEnvironment) {
  return createRetryableLoader(async () => {
    const scripts = await Promise.all([
      scriptPromise(environment, D3_CDN_URL, () => Boolean(environment.window.d3)),
      scriptPromise(environment, PIXI_CDN_URL, () => Boolean(environment.window.PIXI)),
    ])

    if (!environment.window.d3 || !environment.window.PIXI) {
      for (const script of scripts) script?.remove()
      throw new Error("Graph library scripts loaded, but required globals were unavailable")
    }

    return { d3: environment.window.d3, PIXI: environment.window.PIXI }
  })
}

let browserLibraryLoader: ReturnType<typeof createGraphLibraryLoader> | undefined

export function ensureGraphLibraries() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("Graph libraries require a browser environment"))
  }
  browserLibraryLoader ??= createGraphLibraryLoader({
    window: window as unknown as GraphLibraryWindow,
    document: document as unknown as GraphLibraryEnvironment["document"],
  })
  return browserLibraryLoader()
}

export function createGraphTriggerController({
  mobile,
  load,
}: {
  mobile: boolean
  load: () => Promise<void>
}) {
  let currentMobile = mobile
  let loaded = false
  let pending: Promise<void> | undefined

  const request = (intersecting: boolean, explicit: boolean) => {
    if (graphLoadAction({ mobile: currentMobile, intersecting, explicit }) === "wait") {
      return undefined
    }
    if (pending) return pending

    const attempt = Promise.resolve()
      .then(load)
      .then(() => {
        loaded = true
      })
    pending = attempt
    void attempt.catch(() => {
      if (pending === attempt) pending = undefined
    })
    return attempt
  }

  return {
    explicit: () => request(false, true),
    intersect: (intersecting: boolean) => request(intersecting, false),
    isLoaded: () => loaded,
    setMobile: (nextMobile: boolean) => {
      currentMobile = nextMobile
    },
  }
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
}

export function normalizeGraphMetadata(
  value: unknown,
  normalizeSlug: (slug: string) => string = (slug) => slug,
): GraphMetadata {
  const metadata: GraphMetadata = new Map()
  if (!value || typeof value !== "object" || Array.isArray(value)) return metadata

  for (const [rawSlug, rawDetails] of Object.entries(value)) {
    if (!rawDetails || typeof rawDetails !== "object" || Array.isArray(rawDetails)) continue

    const slug = normalizeSlug(rawSlug)
    const details = rawDetails as Record<string, unknown>
    metadata.set(slug, {
      ...details,
      slug: typeof details.slug === "string" ? details.slug : rawSlug,
      title: typeof details.title === "string" ? details.title : rawSlug,
      links: stringArray(details.links),
      tags: stringArray(details.tags),
    })
  }

  return metadata
}

export function createGraphMetadataLoader(
  fetcher: () => Promise<unknown>,
  normalize: (value: unknown) => GraphMetadata = normalizeGraphMetadata,
) {
  let pending: Promise<GraphMetadata> | undefined
  let revision = 0

  const load = (): Promise<GraphMetadata> => {
    if (pending) return pending

    const loadRevision = revision
    const attempt = Promise.resolve()
      .then(fetcher)
      .then((value) => {
        if (loadRevision !== revision) {
          if (pending === attempt) pending = undefined
          return load()
        }
        return normalize(value)
      })
    pending = attempt
    void attempt.catch(() => {
      if (pending === attempt) pending = undefined
    })
    return attempt
  }

  return {
    load,

    invalidate() {
      revision += 1
      pending = undefined
    },
  }
}
