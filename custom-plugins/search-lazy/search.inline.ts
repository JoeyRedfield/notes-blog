import {
  createLazySearchLoader,
  createSearchRecordMerger,
  searchRecords,
  type SearchResult,
} from "./search-core.js"

declare const fetchData: Promise<unknown> | undefined

type SearchController = {
  root: HTMLElement
  close: () => void
  isOpen: () => boolean
  open: () => Promise<void>
  refresh: () => void
}

const merger = createSearchRecordMerger()
const controllers = new Set<SearchController>()

function basePath(): string {
  return (document.body.dataset.basepath ?? "").replace(/^\/+|\/+$/gu, "")
}

function sitePath(path: string): string {
  const prefix = basePath()
  return `/${prefix ? `${prefix}/` : ""}${path.replace(/^\/+/, "")}`
}

async function fetchSearchIndex(): Promise<unknown> {
  const response = await fetch(new URL(sitePath("static/searchIndex.json"), window.location.origin))
  if (!response.ok) throw new Error(`search index HTTP ${response.status}`)
  return response.json()
}

const loadSearchRecords = createLazySearchLoader(fetchSearchIndex)

async function mergeContentIndexEntries(slugs: string[]) {
  if (slugs.length === 0 || typeof fetchData === "undefined") return
  try {
    const value = await fetchData
    merger.merge(value, slugs)
    for (const controller of controllers) controller.refresh()
  } catch {
    // Search remains usable when an optional unlocked-entry patch is unavailable.
  }
}

async function ensureSearchRecords() {
  if (merger.isInitialized()) return merger.getRecords()

  const records = await loadSearchRecords()
  if (!merger.isInitialized()) {
    merger.initialize(records)
    await mergeContentIndexEntries(merger.takeQueuedSlugs())
  }
  return merger.getRecords()
}

function removeRenderedResults(container: HTMLElement) {
  for (const child of Array.from(container.children)) child.remove()
}

function appendResult(container: HTMLElement, result: SearchResult) {
  const link = document.createElement("a")
  link.className = "result-card internal"
  link.href = sitePath(result.slug)
  link.setAttribute("role", "option")
  link.setAttribute("aria-selected", "false")

  const title = document.createElement("p")
  title.className = "card-title"
  title.textContent = result.title || result.slug
  link.appendChild(title)

  if (result.snippet) {
    const snippet = document.createElement("p")
    snippet.className = "card-description"
    snippet.textContent = result.snippet
    link.appendChild(snippet)
  }

  if (result.tags.length > 0) {
    const tags = document.createElement("ul")
    for (const tag of result.tags.slice(0, 4)) {
      const item = document.createElement("li")
      const label = document.createElement("span")
      label.className = "match-tag"
      label.textContent = `#${tag}`
      item.appendChild(label)
      tags.appendChild(item)
    }
    link.appendChild(tags)
  }

  container.appendChild(link)
}

function bindSearch(root: HTMLElement) {
  if (root.dataset.searchLazyBound === "true") return

  const button = root.querySelector<HTMLElement>(".search-button")
  const overlay = root.querySelector<HTMLElement>(".search-container")
  const input = root.querySelector<HTMLInputElement>(".search-bar")
  const layout = root.querySelector<HTMLElement>(".search-layout")
  const resultsContainer = root.querySelector<HTMLElement>(".results-container")
  const status = root.querySelector<HTMLElement>(".search-status")
  const retry = root.querySelector<HTMLButtonElement>(".search-retry")
  if (!button || !overlay || !input || !layout || !resultsContainer || !status || !retry) return

  root.dataset.searchLazyBound = "true"
  let activeIndex = -1
  let debounceTimer: number | undefined

  const resultLinks = () =>
    Array.from(resultsContainer.querySelectorAll<HTMLAnchorElement>(".result-card"))

  const setStatus = (message: string, showRetry = false) => {
    status.textContent = message
    status.hidden = message === ""
    retry.hidden = !showRetry
    layout.classList.toggle("display-results", message !== "" || input.value.trim() !== "")
  }

  const setActive = (nextIndex: number) => {
    const links = resultLinks()
    if (links.length === 0) {
      activeIndex = -1
      return
    }
    activeIndex = (nextIndex + links.length) % links.length
    links.forEach((link, index) => {
      const active = index === activeIndex
      link.classList.toggle("focus", active)
      link.setAttribute("aria-selected", String(active))
    })
    links[activeIndex]?.scrollIntoView({ block: "nearest" })
  }

  const renderResults = () => {
    removeRenderedResults(resultsContainer)
    const query = input.value
    if (!query.trim()) {
      activeIndex = -1
      setStatus("")
      layout.classList.remove("display-results")
      return
    }
    if (!merger.isInitialized()) return

    const matches = searchRecords(merger.getRecords(), query)
    for (const result of matches) appendResult(resultsContainer, result)
    if (matches.length === 0) {
      setStatus("没有找到结果")
      activeIndex = -1
    } else {
      setStatus("")
      layout.classList.add("display-results")
      setActive(0)
    }
  }

  const close = () => {
    overlay.classList.remove("active")
    overlay.hidden = true
    overlay.setAttribute("aria-hidden", "true")
    button.setAttribute("aria-expanded", "false")
    layout.setAttribute("aria-busy", "false")
    button.focus()
  }

  const open = async () => {
    overlay.hidden = false
    overlay.classList.add("active")
    overlay.setAttribute("aria-hidden", "false")
    button.setAttribute("aria-expanded", "true")
    input.focus()

    if (merger.isInitialized()) {
      renderResults()
      return
    }

    layout.setAttribute("aria-busy", "true")
    setStatus("正在加载搜索索引")
    try {
      await ensureSearchRecords()
      layout.setAttribute("aria-busy", "false")
      setStatus("")
      renderResults()
    } catch {
      layout.setAttribute("aria-busy", "false")
      setStatus("搜索索引加载失败", true)
    }
  }

  const controller: SearchController = {
    root,
    close,
    isOpen: () => overlay.classList.contains("active"),
    open,
    refresh: renderResults,
  }
  controllers.add(controller)

  const onButtonClick = () => {
    if (overlay.classList.contains("active")) close()
    else void open()
  }
  const onOverlayClick = (event: MouseEvent) => {
    if (event.target === overlay) close()
  }
  const onInput = () => {
    if (debounceTimer !== undefined) window.clearTimeout(debounceTimer)
    debounceTimer = window.setTimeout(renderResults, 120)
  }
  const onInputKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault()
      close()
    } else if (event.key === "ArrowDown") {
      event.preventDefault()
      setActive(activeIndex + 1)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActive(activeIndex - 1)
    } else if (event.key === "Enter" && !event.isComposing) {
      const selected = resultLinks()[activeIndex]
      if (selected) {
        event.preventDefault()
        close()
        selected.click()
      }
    }
  }
  const onResultClick = (event: MouseEvent) => {
    if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) close()
  }
  const onRetry = () => void open()

  button.addEventListener("click", onButtonClick)
  overlay.addEventListener("click", onOverlayClick)
  input.addEventListener("input", onInput)
  input.addEventListener("keydown", onInputKeyDown)
  resultsContainer.addEventListener("click", onResultClick)
  retry.addEventListener("click", onRetry)

  window.addCleanup(() => {
    if (debounceTimer !== undefined) window.clearTimeout(debounceTimer)
    button.removeEventListener("click", onButtonClick)
    overlay.removeEventListener("click", onOverlayClick)
    input.removeEventListener("input", onInput)
    input.removeEventListener("keydown", onInputKeyDown)
    resultsContainer.removeEventListener("click", onResultClick)
    retry.removeEventListener("click", onRetry)
    controllers.delete(controller)
    delete root.dataset.searchLazyBound
  })
}

function setupSearch() {
  for (const root of document.querySelectorAll<HTMLElement>(".search")) bindSearch(root)
}

document.addEventListener("keydown", (event) => {
  const controller = [...controllers].find(({ root }) => root.isConnected)
  if (!controller) return

  if (event.key.toLocaleLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
    event.preventDefault()
    void controller.open()
  } else if (event.key === "Escape" && controller.isOpen()) {
    controller.close()
  }
})

document.addEventListener("content-index-updated", (event) => {
  const detail = (event as CustomEvent<{ slugs?: unknown }>).detail
  const slugs = Array.isArray(detail?.slugs) ? detail.slugs : []
  const readySlugs = merger.queue(slugs)
  if (readySlugs.length > 0) void mergeContentIndexEntries(readySlugs)
})

document.addEventListener("nav", setupSearch)
document.addEventListener("render", setupSearch)
setupSearch()
