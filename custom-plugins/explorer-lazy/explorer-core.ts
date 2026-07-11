export type ExplorerEntry = Record<string, unknown>

export type ExplorerIndex = Record<string, ExplorerEntry | unknown>

export type ExplorerOrderOperation = "filter" | "map" | "sort"

export type ExplorerProcessOptions = {
  sortFn?: (a: FileTrieNode, b: FileTrieNode) => number
  filterFn?: (node: FileTrieNode) => boolean
  mapFn?: (node: FileTrieNode) => unknown
  order?: ExplorerOrderOperation[]
}

const DEFAULT_ORDER: ExplorerOrderOperation[] = ["filter", "map", "sort"]

function isRecord(value: unknown): value is ExplorerEntry {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function normalizedSlug(value: string): string {
  const withoutQuery = value.split(/[?#]/u, 1)[0] ?? ""
  const slug = withoutQuery.replace(/^\/+|\/+$/gu, "")
  if (slug === "index") return ""
  return slug.endsWith("/index") ? slug.slice(0, -"/index".length) : slug
}

export class FileTrieNode {
  readonly slug: string
  readonly slugSegment: string
  readonly slugSegments: string[]
  children: FileTrieNode[] = []
  data: ExplorerEntry | null
  isFolder: boolean
  private displayNameOverride: string | undefined

  constructor(slugSegments: string[], data: ExplorerEntry | null = null, isFolder = false) {
    this.slugSegments = slugSegments
    this.slug = slugSegments.join("/")
    this.slugSegment = slugSegments.at(-1) ?? ""
    this.data = data
    this.isFolder = isFolder
  }

  get displayName(): string {
    if (this.displayNameOverride !== undefined) return this.displayNameOverride
    const title = typeof this.data?.title === "string" ? this.data.title.trim() : ""
    return title && title !== "index" ? title : this.slugSegment
  }

  set displayName(value: string) {
    this.displayNameOverride = String(value)
  }
}

export const defaultSortFn = (a: FileTrieNode, b: FileTrieNode): number => {
  if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1
  const byName = a.displayName.localeCompare(b.displayName, undefined, {
    numeric: true,
    sensitivity: "base",
  })
  return byName || a.slug.localeCompare(b.slug, undefined, { numeric: true, sensitivity: "base" })
}

export const defaultFilterFn = (node: FileTrieNode): boolean => node.slugSegment !== "tags"

const defaultMapFn = (_node: FileTrieNode): void => {}

function compileFunction<T extends (...args: never[]) => unknown>(source: unknown, fallback: T): T {
  if (typeof source !== "string" || source.trim() === "") return fallback
  try {
    const compiled = Function(`"use strict"; return (${source})`)()
    return typeof compiled === "function" ? (compiled as T) : fallback
  } catch {
    return fallback
  }
}

export function parseDataFns(
  value?: string | ExplorerProcessOptions,
): Required<ExplorerProcessOptions> {
  let parsed: ExplorerProcessOptions = {}
  if (typeof value === "string" && value.trim() !== "") {
    try {
      const candidate = JSON.parse(value)
      if (isRecord(candidate)) parsed = candidate as ExplorerProcessOptions
    } catch {
      parsed = {}
    }
  } else if (value && typeof value === "object") {
    parsed = value
  }

  const order = Array.isArray(parsed.order)
    ? parsed.order.filter(
        (operation): operation is ExplorerOrderOperation =>
          operation === "filter" || operation === "map" || operation === "sort",
      )
    : DEFAULT_ORDER

  return {
    sortFn:
      typeof parsed.sortFn === "function"
        ? parsed.sortFn
        : compileFunction(parsed.sortFn, defaultSortFn),
    filterFn:
      typeof parsed.filterFn === "function"
        ? parsed.filterFn
        : compileFunction(parsed.filterFn, defaultFilterFn),
    mapFn:
      typeof parsed.mapFn === "function"
        ? parsed.mapFn
        : compileFunction(parsed.mapFn, defaultMapFn),
    order,
  }
}

function filterTrie(node: FileTrieNode, filterFn: (node: FileTrieNode) => boolean): void {
  node.children = node.children.filter(filterFn)
  for (const child of node.children) filterTrie(child, filterFn)
}

function mapTrie(node: FileTrieNode, mapFn: (node: FileTrieNode) => unknown): void {
  mapFn(node)
  for (const child of node.children) mapTrie(child, mapFn)
}

function sortTrie(node: FileTrieNode, sortFn: (a: FileTrieNode, b: FileTrieNode) => number): void {
  node.children.sort(sortFn)
  for (const child of node.children) sortTrie(child, sortFn)
}

export function processTrie(
  trie: FileTrieNode,
  options?: string | ExplorerProcessOptions,
): FileTrieNode {
  const { filterFn, mapFn, order, sortFn } = parseDataFns(options)
  for (const operation of order) {
    if (operation === "filter") filterTrie(trie, filterFn)
    else if (operation === "map") mapTrie(trie, mapFn)
    else sortTrie(trie, sortFn)
  }
  return trie
}

export function buildTrie(value: unknown, options?: string | ExplorerProcessOptions): FileTrieNode {
  const root = new FileTrieNode([], null, true)
  if (!isRecord(value)) return processTrie(root, options)

  const childMaps = new WeakMap<FileTrieNode, Map<string, FileTrieNode>>()
  const childrenFor = (node: FileTrieNode) => {
    let children = childMaps.get(node)
    if (!children) {
      children = new Map(node.children.map((child) => [child.slugSegment, child]))
      childMaps.set(node, children)
    }
    return children
  }

  for (const [rawSlug, rawEntry] of Object.entries(value as ExplorerIndex)) {
    if (!isRecord(rawEntry)) continue
    const slug = rawSlug.replace(/^\/+|\/+$/gu, "")
    const segments = slug.split("/").filter(Boolean)
    if (segments.length === 0) continue

    const isIndex = segments.at(-1) === "index"
    const nodeSegments = isIndex ? segments.slice(0, -1) : segments
    let node = root

    for (const [index, segment] of nodeSegments.entries()) {
      const children = childrenFor(node)
      let child = children.get(segment)
      if (!child) {
        child = new FileTrieNode([...node.slugSegments, segment])
        node.children.push(child)
        children.set(segment, child)
      }
      if (index < nodeSegments.length - 1 || isIndex) child.isFolder = true
      node.isFolder = true
      node = child
    }

    node.data = rawEntry
    if (isIndex) node.isFolder = true
  }

  return processTrie(root, options)
}

function normalizedOpenFolders(openFolders: ReadonlySet<string>): Set<string> {
  return new Set([...openFolders].map(normalizedSlug))
}

export function visibleNodes(
  trie: FileTrieNode,
  openFolders: ReadonlySet<string>,
  activeSlug: string,
): FileTrieNode[] {
  const visible: FileTrieNode[] = []
  const open = normalizedOpenFolders(openFolders)
  const active = normalizedSlug(activeSlug)

  const visit = (node: FileTrieNode) => {
    visible.push(node)
    const isActiveAncestor = node.slug !== "" && active.startsWith(`${node.slug}/`)
    if (!node.isFolder) return

    if (open.has(node.slug)) {
      for (const child of node.children) visit(child)
    } else if (isActiveAncestor) {
      const activeChild = node.children.find(
        (child) => active === child.slug || active.startsWith(`${child.slug}/`),
      )
      if (activeChild) visit(activeChild)
    }
  }

  for (const child of trie.children) visit(child)
  return visible
}

export function visibleSlugs(
  trie: FileTrieNode,
  openFolders: ReadonlySet<string>,
  activeSlug: string,
): string[] {
  return visibleNodes(trie, openFolders, activeSlug).map(({ slug }) => slug)
}

export function materializeChildrenOnce(
  node: FileTrieNode,
  marker: { generated?: string },
  renderChild: (child: FileTrieNode) => void,
): boolean {
  if (marker.generated === "true" || marker.generated === "pending") return false

  marker.generated = "pending"
  try {
    for (const child of node.children) renderChild(child)
    marker.generated = "true"
    return true
  } catch (error) {
    delete marker.generated
    throw error
  }
}

export function serializeTrieCacheKey(dataFns = "", config = ""): string {
  return JSON.stringify({ dataFns, config })
}

export function createTrieCache<T = FileTrieNode>() {
  const entries = new Map<string, Promise<T>>()

  return {
    get(key: string, loader: () => Promise<T> | T): Promise<T> {
      const cached = entries.get(key)
      if (cached) return cached

      const pending = Promise.resolve().then(loader)
      entries.set(key, pending)
      void pending.catch(() => {
        if (entries.get(key) === pending) entries.delete(key)
      })
      return pending
    },

    invalidate(key?: string): void {
      if (key === undefined) entries.clear()
      else entries.delete(key)
    },
  }
}
