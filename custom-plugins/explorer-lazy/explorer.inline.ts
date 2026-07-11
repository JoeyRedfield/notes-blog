import { resolveBasePath, simplifySlug } from "@quartz-community/utils/path"
import {
  buildTrie,
  createTrieCache,
  materializeChildrenOnce,
  serializeTrieCacheKey,
  type FileTrieNode,
} from "./explorer-core.js"

declare const fetchData: Promise<unknown> | undefined

type ExplorerConfig = {
  folderDefaultState: "collapsed" | "open"
  folderClickBehavior: "collapse" | "link"
  useSavedState: boolean
}

type SavedEntry = {
  path: string
  collapsed: boolean
}

type RenderContext = {
  activeSlug: string
  config: ExplorerConfig
  root: HTMLElement
  savedState: Map<string, boolean>
}

const trieCache = createTrieCache<FileTrieNode>()
const renderGenerations = new WeakMap<HTMLElement, number>()
const renderContexts = new WeakMap<HTMLElement, RenderContext>()
const folderNodes = new WeakMap<HTMLElement, FileTrieNode>()
let folderId = 0

function parseConfig(root: HTMLElement): ExplorerConfig {
  const fallback: ExplorerConfig = {
    folderDefaultState: root.dataset.collapsed === "open" ? "open" : "collapsed",
    folderClickBehavior: root.dataset.behavior === "collapse" ? "collapse" : "link",
    useSavedState: root.dataset.savestate !== "false",
  }
  try {
    const value = JSON.parse(root.dataset.config ?? "") as Partial<ExplorerConfig>
    return {
      folderDefaultState: value.folderDefaultState === "open" ? "open" : "collapsed",
      folderClickBehavior: value.folderClickBehavior === "collapse" ? "collapse" : "link",
      useSavedState: value.useSavedState !== false,
    }
  } catch {
    return fallback
  }
}

function simpleSlug(value: string): string {
  const slug = value.replace(/^\/+|\/+$/gu, "")
  const simplified = String(simplifySlug(slug))
  return simplified === "/" ? "" : simplified.replace(/^\/+|\/+$/gu, "")
}

function currentSlug(event?: Event): string {
  const detail = (event as CustomEvent<{ url?: unknown }> | undefined)?.detail
  return typeof detail?.url === "string" ? detail.url : (document.body.dataset.slug ?? "")
}

function readSavedEntries(): SavedEntry[] {
  try {
    const value = JSON.parse(localStorage.getItem("fileTree") ?? "[]")
    if (!Array.isArray(value)) return []
    return value.flatMap((entry): SavedEntry[] => {
      if (
        entry &&
        typeof entry === "object" &&
        typeof entry.path === "string" &&
        typeof entry.collapsed === "boolean"
      ) {
        return [{ path: entry.path, collapsed: entry.collapsed }]
      }
      return []
    })
  } catch {
    return []
  }
}

function savedState(config: ExplorerConfig): Map<string, boolean> {
  return config.useSavedState
    ? new Map(readSavedEntries().map(({ path, collapsed }) => [path, collapsed]))
    : new Map()
}

function folderStatePath(node: FileTrieNode): string {
  return `${node.slug}/index`
}

function savedCollapsed(node: FileTrieNode, state: Map<string, boolean>): boolean | undefined {
  return state.get(folderStatePath(node)) ?? state.get(node.slug)
}

function hasActiveDescendant(node: FileTrieNode, activeSlug: string): boolean {
  const active = simpleSlug(activeSlug)
  return node.slug !== "" && active.startsWith(`${node.slug}/`)
}

function explicitlyOpen(node: FileTrieNode, context: RenderContext): boolean {
  const saved = savedCollapsed(node, context.savedState)
  return saved === undefined ? context.config.folderDefaultState === "open" : !saved
}

function setExpanded(folderContainer: HTMLElement, open: boolean): void {
  const outer = folderContainer.nextElementSibling
  if (!(outer instanceof HTMLElement)) return
  outer.classList.toggle("open", open)
  for (const control of folderContainer.querySelectorAll<HTMLElement>(
    ".folder-icon, .folder-button[aria-expanded]",
  )) {
    control.setAttribute("aria-expanded", String(open))
  }
}

function insertClone(container: HTMLElement, clone: DocumentFragment): void {
  const end = container.classList.contains("explorer-ul")
    ? container.querySelector(":scope > .overflow-end")
    : null
  container.insertBefore(clone, end)
}

function renderFile(node: FileTrieNode, container: HTMLElement, context: RenderContext): void {
  if (!node.data) return
  const template = context.root.querySelector<HTMLTemplateElement>(".explorer-file-template")
  if (!template) return
  const clone = template.content.cloneNode(true) as DocumentFragment
  const link = clone.querySelector<HTMLAnchorElement>("a")
  if (!link) return

  const entrySlug = typeof node.data.slug === "string" ? node.data.slug : node.slug
  link.href = resolveBasePath(entrySlug)
  link.textContent = node.displayName || node.slugSegment
  if (simpleSlug(entrySlug) === simpleSlug(context.activeSlug)) {
    link.classList.add("active", "is-active")
    link.setAttribute("aria-current", "page")
  }
  insertClone(container, clone)
}

function activeChild(node: FileTrieNode, activeSlug: string): FileTrieNode | undefined {
  const active = simpleSlug(activeSlug)
  return node.children.find((child) => active === child.slug || active.startsWith(`${child.slug}/`))
}

function renderAllChildren(node: FileTrieNode, content: HTMLElement, context: RenderContext): void {
  if (content.dataset.generated === "active") {
    content.replaceChildren()
    delete content.dataset.generated
  }
  materializeChildrenOnce(node, content.dataset, (child) => renderNode(child, content, context))
}

function renderActiveChild(node: FileTrieNode, content: HTMLElement, context: RenderContext): void {
  if (content.dataset.generated === "true" || content.dataset.generated === "active") return
  const child = activeChild(node, context.activeSlug)
  if (child) renderNode(child, content, context)
  content.dataset.generated = "active"
}

function renderFolder(node: FileTrieNode, container: HTMLElement, context: RenderContext): void {
  const template = context.root.querySelector<HTMLTemplateElement>(".explorer-folder-template")
  if (!template) return
  const clone = template.content.cloneNode(true) as DocumentFragment
  const folderContainer = clone.querySelector<HTMLElement>(".folder-container")
  const icon = clone.querySelector<HTMLButtonElement>(".folder-icon")
  const titleControl = clone.querySelector<HTMLElement>(".folder-button")
  const title = clone.querySelector<HTMLElement>(".folder-title")
  const content = clone.querySelector<HTMLElement>(".tree-item-children")
  if (!folderContainer || !icon || !titleControl || !title || !content) return

  const statePath = folderStatePath(node)
  const controlsId = `explorer-lazy-folder-${++folderId}`
  folderContainer.dataset.folderpath = statePath
  folderContainer.dataset.nodeSlug = node.slug
  folderNodes.set(folderContainer, node)
  content.id = controlsId
  icon.setAttribute("aria-controls", controlsId)
  title.textContent = node.displayName || node.slugSegment

  if (context.config.folderClickBehavior === "link") {
    const link = document.createElement("a")
    link.className = "folder-button internal"
    link.href = resolveBasePath(String(simplifySlug(statePath)))
    link.appendChild(title)
    if (simpleSlug(statePath) === simpleSlug(context.activeSlug)) {
      link.classList.add("active", "is-active")
      link.setAttribute("aria-current", "page")
    }
    titleControl.replaceWith(link)
  } else {
    titleControl.setAttribute("aria-controls", controlsId)
  }

  const savedOpen = explicitlyOpen(node, context)
  const activeOpen = hasActiveDescendant(node, context.activeSlug)
  setExpanded(folderContainer, savedOpen || activeOpen)
  if (savedOpen) renderAllChildren(node, content, context)
  else if (activeOpen) renderActiveChild(node, content, context)

  insertClone(container, clone)
}

function renderNode(node: FileTrieNode, container: HTMLElement, context: RenderContext): void {
  if (node.isFolder) renderFolder(node, container, context)
  else renderFile(node, container, context)
}

function treeContainer(root: HTMLElement): HTMLElement | null {
  return root.querySelector<HTMLElement>(".explorer-ul")
}

function clearTree(container: HTMLElement): void {
  let end = container.querySelector<HTMLElement>(":scope > .overflow-end")
  if (!end) {
    end = document.createElement("li")
    end.className = "overflow-end"
    end.setAttribute("aria-hidden", "true")
  }
  for (const child of Array.from(container.children)) {
    if (child !== end) child.remove()
  }
  container.appendChild(end)
}

function restoreScroll(container: HTMLElement): void {
  const stored = sessionStorage.getItem("explorerScrollTop")
  if (stored !== null) {
    const scrollTop = Number.parseInt(stored, 10)
    if (Number.isFinite(scrollTop)) container.scrollTop = scrollTop
    return
  }
  container.querySelector<HTMLElement>(".active")?.scrollIntoView({ block: "nearest" })
}

async function loadTrie(root: HTMLElement): Promise<FileTrieNode> {
  const dataFns = root.dataset.dataFns ?? ""
  const config = root.dataset.config ?? ""
  const key = serializeTrieCacheKey(dataFns, config)
  return trieCache.get(key, async () => {
    if (typeof fetchData === "undefined") throw new Error("Explorer content index is unavailable")
    return buildTrie(await fetchData, dataFns)
  })
}

async function renderExplorer(root: HTMLElement, activeSlug: string): Promise<void> {
  const container = treeContainer(root)
  if (!container) return
  const generation = (renderGenerations.get(root) ?? 0) + 1
  renderGenerations.set(root, generation)
  container.setAttribute("aria-busy", "true")

  try {
    const trie = await loadTrie(root)
    if (renderGenerations.get(root) !== generation || !root.isConnected) return

    const config = parseConfig(root)
    const context: RenderContext = {
      activeSlug,
      config,
      root,
      savedState: savedState(config),
    }
    renderContexts.set(root, context)
    clearTree(container)
    for (const child of trie.children) renderNode(child, container, context)
    delete root.dataset.explorerError
    restoreScroll(container)
  } catch (error) {
    if (renderGenerations.get(root) === generation) {
      root.dataset.explorerError = "true"
      console.error("Explorer tree failed to load", error)
    }
  } finally {
    if (renderGenerations.get(root) === generation) container.setAttribute("aria-busy", "false")
  }
}

function writeSavedState(context: RenderContext, node: FileTrieNode, collapsed: boolean): void {
  const path = folderStatePath(node)
  context.savedState.set(path, collapsed)
  if (!context.config.useSavedState) return

  const entries = readSavedEntries()
  const existing = entries.find(({ path: entryPath }) => entryPath === path)
  if (existing) existing.collapsed = collapsed
  else entries.push({ path, collapsed })
  try {
    localStorage.setItem("fileTree", JSON.stringify(entries))
  } catch {
    // The in-memory state still keeps the current interaction usable.
  }
}

function toggleFolder(root: HTMLElement, folderContainer: HTMLElement): void {
  const context = renderContexts.get(root)
  const node = folderNodes.get(folderContainer)
  const outer = folderContainer.nextElementSibling
  const content = outer?.querySelector<HTMLElement>(".tree-item-children")
  if (!context || !node || !(outer instanceof HTMLElement) || !content) return

  const open = !outer.classList.contains("open")
  if (open) renderAllChildren(node, content, context)
  setExpanded(folderContainer, open)
  writeSavedState(context, node, !open)
}

function setExplorerExpanded(root: HTMLElement, expanded: boolean, mobile: boolean): void {
  root.classList.toggle("collapsed", !expanded)
  for (const button of root.querySelectorAll<HTMLElement>(".explorer-toggle")) {
    button.setAttribute("aria-expanded", String(expanded))
  }
  if (mobile) document.documentElement.classList.toggle("mobile-no-scroll", expanded)
}

function bindExplorer(root: HTMLElement): void {
  if (root.dataset.explorerLazyBound === "true") return
  root.dataset.explorerLazyBound = "true"

  const onClick = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return
    const explorerToggle = event.target.closest<HTMLElement>(".explorer-toggle")
    if (explorerToggle && root.contains(explorerToggle)) {
      const expanded = root.classList.contains("collapsed")
      setExplorerExpanded(root, expanded, explorerToggle.dataset.mobile === "true")
      return
    }

    const folderIcon = event.target.closest<HTMLElement>(".folder-icon")
    if (folderIcon && root.contains(folderIcon)) {
      event.preventDefault()
      event.stopPropagation()
      const folderContainer = folderIcon.closest<HTMLElement>(".folder-container")
      if (folderContainer) toggleFolder(root, folderContainer)
      return
    }

    const folderButton = event.target.closest<HTMLElement>(".folder-button")
    if (!folderButton || !root.contains(folderButton)) return
    const context = renderContexts.get(root)
    if (!context || context.config.folderClickBehavior === "link") return
    event.preventDefault()
    event.stopPropagation()
    const folderContainer = folderButton.closest<HTMLElement>(".folder-container")
    if (folderContainer) toggleFolder(root, folderContainer)
  }

  root.addEventListener("click", onClick)
  const mobileToggle = root.querySelector<HTMLElement>(".mobile-explorer")
  mobileToggle?.classList.remove("hide-until-loaded")
  const isMobile =
    mobileToggle?.checkVisibility?.() ?? window.matchMedia?.("(max-width: 800px)").matches ?? false
  if (isMobile) setExplorerExpanded(root, false, true)

  const end = root.querySelector<HTMLElement>(".overflow-end")
  const scrollContainer = root.querySelector<HTMLElement>(".explorer-content")
  const observer =
    end && "IntersectionObserver" in window
      ? new IntersectionObserver(
          ([entry]) =>
            root
              .querySelector(".explorer-ul")
              ?.classList.toggle("gradient-active", !entry.isIntersecting),
          scrollContainer ? { root: scrollContainer } : undefined,
        )
      : undefined
  if (end && observer) observer.observe(end)

  window.addCleanup(() => {
    root.removeEventListener("click", onClick)
    observer?.disconnect()
    document.documentElement.classList.remove("mobile-no-scroll")
    delete root.dataset.explorerLazyBound
    renderContexts.delete(root)
  })
}

function setupExplorers(event?: Event): void {
  const activeSlug = currentSlug(event)
  for (const root of document.querySelectorAll<HTMLElement>(".explorer")) {
    bindExplorer(root)
    void renderExplorer(root, activeSlug)
  }
}

document.addEventListener("prenav", () => {
  const container = document.querySelector<HTMLElement>(".explorer-ul")
  if (container) sessionStorage.setItem("explorerScrollTop", String(container.scrollTop))
})

document.addEventListener("content-index-updated", () => {
  trieCache.invalidate()
  setupExplorers()
})
document.addEventListener("nav", setupExplorers)
document.addEventListener("render", setupExplorers)
