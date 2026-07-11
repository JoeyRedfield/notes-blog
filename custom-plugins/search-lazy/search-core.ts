export type SearchIndexEntry = {
  slug?: unknown
  title?: unknown
  tags?: unknown
  content?: unknown
}

export type SearchIndex = Record<string, SearchIndexEntry | unknown>

export type SearchRecord = {
  slug: string
  title: string
  tags: string[]
  content: string
  normalizedTitle: string
  normalizedTags: string[]
  normalizedContent: string
}

export type SearchResult = SearchRecord & {
  snippet: string
}

const DEFAULT_RESULT_LIMIT = 8
const SNIPPET_LENGTH = 150

function cleanText(value: unknown): string {
  if (typeof value !== "string") return ""
  return value.normalize("NFKC").replace(/\s+/gu, " ").trim()
}

export function normalizeSearchText(value: unknown): string {
  return cleanText(value).toLocaleLowerCase()
}

function cleanTags(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((tag) => {
    const cleaned = cleanText(tag)
    return cleaned ? [cleaned] : []
  })
}

function recordFromEntry(
  slug: string,
  entry: SearchIndexEntry,
  previous?: SearchRecord,
): SearchRecord {
  const title = typeof entry.title === "string" ? cleanText(entry.title) : (previous?.title ?? "")
  const tags = Array.isArray(entry.tags) ? cleanTags(entry.tags) : (previous?.tags ?? [])
  const content =
    typeof entry.content === "string" ? cleanText(entry.content) : (previous?.content ?? "")

  return {
    slug,
    title,
    tags,
    content,
    normalizedTitle: normalizeSearchText(title),
    normalizedTags: tags.map(normalizeSearchText),
    normalizedContent: normalizeSearchText(content),
  }
}

export function extractSearchIndex(value: unknown): SearchIndex {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  const root = value as Record<string, unknown>
  if (root.content && typeof root.content === "object" && !Array.isArray(root.content)) {
    return root.content as SearchIndex
  }
  return root
}

export function buildSearchRecords(index: SearchIndex): SearchRecord[] {
  const records: SearchRecord[] = []
  for (const [slug, value] of Object.entries(index)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue
    records.push(recordFromEntry(slug, value as SearchIndexEntry))
  }
  return records
}

function parseQuery(input: string): { query: string; tags: string[] } {
  const terms = cleanText(input).split(" ").filter(Boolean)
  const tags: string[] = []
  const query: string[] = []

  for (const term of terms) {
    if (term.startsWith("#") && term.length > 1) {
      tags.push(normalizeSearchText(term.slice(1)))
    } else if (term !== "#") {
      query.push(term)
    }
  }

  return { query: normalizeSearchText(query.join(" ")), tags }
}

function stripMarkup(value: string): string {
  return cleanText(value.replace(/<[^>]*>/gu, " "))
}

export function createSnippet(content: string, query: string): string {
  const text = stripMarkup(content)
  if (!text) return ""

  const normalizedQuery = normalizeSearchText(query)
  const match = normalizedQuery ? normalizeSearchText(text).indexOf(normalizedQuery) : -1
  const start = match > 60 ? match - 60 : 0
  const end = Math.min(text.length, start + SNIPPET_LENGTH)
  const prefix = start > 0 ? "..." : ""
  const suffix = end < text.length ? "..." : ""
  return `${prefix}${text.slice(start, end).trim()}${suffix}`
}

function matchRank(record: SearchRecord, query: string): number | null {
  if (!query) return 2
  if (record.normalizedTitle.startsWith(query)) return 0
  if (record.normalizedTitle.includes(query)) return 1
  if (record.normalizedTags.some((tag) => tag.includes(query))) return 2
  if (record.normalizedContent.includes(query)) return 3
  return null
}

export function searchRecords(
  records: readonly SearchRecord[],
  input: string,
  limit = DEFAULT_RESULT_LIMIT,
): SearchResult[] {
  const { query, tags } = parseQuery(input)
  if (!query && tags.length === 0) return []

  return records
    .map((record, index) => ({ record, index, rank: matchRank(record, query) }))
    .filter(
      (candidate): candidate is { record: SearchRecord; index: number; rank: number } =>
        candidate.rank !== null &&
        tags.every((tag) => candidate.record.normalizedTags.includes(tag)),
    )
    .sort((left, right) => left.rank - right.rank || left.index - right.index)
    .slice(0, Math.max(0, limit))
    .map(({ record }) => ({
      ...record,
      snippet: createSnippet(record.content, query),
    }))
}

export function createLazySearchLoader<T = SearchRecord[]>(
  fetcher: () => Promise<unknown>,
  build: (index: SearchIndex) => T = buildSearchRecords as (index: SearchIndex) => T,
): () => Promise<T> {
  let pending: Promise<T> | undefined

  return () => {
    if (pending) return pending

    const attempt = Promise.resolve()
      .then(fetcher)
      .then((value) => build(extractSearchIndex(value)))
    pending = attempt
    void attempt.catch(() => {
      if (pending === attempt) pending = undefined
    })
    return attempt
  }
}

export function createSearchRecordMerger() {
  let initialized = false
  let records: SearchRecord[] = []
  const recordsBySlug = new Map<string, SearchRecord>()
  const queuedSlugs = new Set<string>()

  const uniqueSlugs = (slugs: readonly unknown[]) => [
    ...new Set(slugs.filter((slug): slug is string => typeof slug === "string" && slug !== "")),
  ]

  return {
    initialize(initialRecords: SearchRecord[]) {
      initialized = true
      records = initialRecords
      recordsBySlug.clear()
      for (const record of records) recordsBySlug.set(record.slug, record)
    },

    isInitialized() {
      return initialized
    },

    getRecords() {
      return records
    },

    queue(slugs: readonly unknown[]) {
      const unique = uniqueSlugs(slugs)
      if (initialized) return unique
      for (const slug of unique) queuedSlugs.add(slug)
      return []
    },

    takeQueuedSlugs() {
      const slugs = [...queuedSlugs]
      queuedSlugs.clear()
      return slugs
    },

    merge(value: unknown, requestedSlugs?: readonly unknown[]) {
      const index = extractSearchIndex(value)
      const slugs = uniqueSlugs(requestedSlugs ?? Object.keys(index))
      if (!initialized) {
        for (const slug of slugs) queuedSlugs.add(slug)
        return []
      }

      const merged: SearchRecord[] = []
      for (const slug of slugs) {
        const entry = index[slug]
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue

        const previous = recordsBySlug.get(slug)
        const next = recordFromEntry(slug, entry as SearchIndexEntry, previous)
        if (previous) {
          const position = records.indexOf(previous)
          if (position !== -1) records[position] = next
        } else {
          records.push(next)
        }
        recordsBySlug.set(slug, next)
        merged.push(next)
      }
      return merged
    },
  }
}
