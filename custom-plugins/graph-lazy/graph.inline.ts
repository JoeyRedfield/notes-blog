// @ts-nocheck
import {
  getBasePath,
  getFullSlugFromUrl,
  resolveBasePath,
  simplifySlug,
} from "@quartz-community/utils"
import {
  createGraphMetadataLoader,
  createGraphTriggerController,
  ensureGraphLibraries,
  globalGraphButtonLabel,
  normalizeGraphMetadata,
} from "./graph-load.js"

declare const fetchData: Promise<unknown> | undefined

const metadataLoader = createGraphMetadataLoader(
  async () => {
    if (typeof fetchData === "undefined") throw new Error("Graph metadata is unavailable")
    return fetchData
  },
  (value) => normalizeGraphMetadata(value, (slug) => simplifySlug(slug)),
)

const graphStates = new Map()
let activeGlobalState = null

function currentSlug(event) {
  let slug = event?.detail?.url ?? getFullSlugFromUrl()
  const base = getBasePath()
  if (base && slug.startsWith(base.replace(/^\//u, ""))) {
    slug = slug.slice(base.replace(/^\//u, "").length).replace(/^\//u, "")
  }
  const simplified = simplifySlug(slug)
  return simplified || "index"
}

const localStorageKey = "graph-visited"

function getVisited() {
  try {
    return new Set(JSON.parse(localStorage.getItem(localStorageKey) || "[]"))
  } catch {
    return new Set()
  }
}

function addToVisited(slug) {
  try {
    const visited = getVisited()
    visited.add(simplifySlug(slug) || "index")
    localStorage.setItem(localStorageKey, JSON.stringify([...visited]))
  } catch {
    // Visited styling is optional when storage is unavailable.
  }
}

function resolveColor(value, fallback) {
  if (!value) return fallback
  const element = document.createElement("div")
  element.style.color = value
  element.style.position = "absolute"
  element.style.visibility = "hidden"
  document.body.appendChild(element)
  const resolved = getComputedStyle(element).color
  element.remove()
  return resolved || fallback
}

function clearGraph(graph) {
  while (graph.firstChild) graph.firstChild.remove()
}

async function renderGraph(graph, fullSlug, data, libraries, isCurrent) {
  if (!isCurrent()) return () => {}
  clearGraph(graph)

  const d3 = libraries.d3
  const PIXI = libraries.PIXI
  const slug = simplifySlug(fullSlug) || "index"
  const visited = getVisited()
  const config = JSON.parse(graph.dataset.cfg || "{}")
  const enableDrag = config.drag
  const enableZoom = config.zoom
  const depth = config.depth
  const scale = config.scale || 1
  const repelForce = config.repelForce || 0.5
  const centerForce = config.centerForce || 0.3
  const linkDistance = config.linkDistance || 30
  const fontSize = config.fontSize || 0.6
  const opacityScale = config.opacityScale || 1
  const removeTags = config.removeTags || []
  const showTags = config.showTags
  const focusOnHover = config.focusOnHover
  const enableRadial = config.enableRadial
  const width = Math.max(graph.offsetWidth, 1)
  const height = Math.max(graph.offsetHeight, 250)
  const links = []
  const allTags = []
  const validLinks = new Set(data.keys())

  data.forEach((details, source) => {
    for (const outgoing of details.links || []) {
      const destination = simplifySlug(outgoing)
      if (validLinks.has(destination)) links.push({ source, target: destination })
    }

    if (showTags) {
      for (const tag of details.tags || []) {
        if (removeTags.includes(tag)) continue
        const tagSlug = simplifySlug(`tags/${tag}`)
        if (!allTags.includes(tagSlug)) allTags.push(tagSlug)
        links.push({ source, target: tagSlug })
      }
    }
  })

  const neighbourhood = new Set()
  if (depth >= 0) {
    let queue = [slug]
    const seen = new Set(queue)
    for (let level = 0; level <= depth && queue.length > 0; level += 1) {
      const nextQueue = []
      for (const current of queue) {
        neighbourhood.add(current)
        for (const link of links) {
          if (link.source === current && !seen.has(link.target)) {
            seen.add(link.target)
            nextQueue.push(link.target)
          }
          if (link.target === current && !seen.has(link.source)) {
            seen.add(link.source)
            nextQueue.push(link.source)
          }
        }
      }
      queue = nextQueue
    }
  } else {
    validLinks.forEach((id) => neighbourhood.add(id))
    for (const tag of allTags) neighbourhood.add(tag)
  }

  const nodes = []
  const nodeMap = new Map()
  neighbourhood.forEach((id) => {
    const isTag = id.startsWith("tags/")
    const node = {
      id,
      text: isTag ? `#${id.slice(5)}` : (data.get(id)?.title ?? id),
      tags: isTag ? [] : (data.get(id)?.tags ?? []),
      x: Math.random() * width - width / 2,
      y: Math.random() * height - height / 2,
      vx: 0,
      vy: 0,
    }
    nodes.push(node)
    nodeMap.set(id, node)
  })

  const graphLinks = []
  for (const link of links) {
    if (!neighbourhood.has(link.source) || !neighbourhood.has(link.target)) continue
    const source = nodeMap.get(link.source)
    const target = nodeMap.get(link.target)
    if (source && target) graphLinks.push({ source, target })
  }

  const styles = getComputedStyle(document.documentElement)
  const secondary = resolveColor(styles.getPropertyValue("--secondary").trim(), "#c792ea")
  const tertiary = resolveColor(styles.getPropertyValue("--tertiary").trim(), "#82aaff")
  const gray = resolveColor(styles.getPropertyValue("--gray").trim(), "#6c6c6c")
  const lightgray = resolveColor(styles.getPropertyValue("--lightgray").trim(), "#d4d4d4")
  const dark = resolveColor(styles.getPropertyValue("--dark").trim(), "#1a1a1a")
  const light = resolveColor(styles.getPropertyValue("--light").trim(), "#f5f5f5")
  const bodyFont = styles.getPropertyValue("--bodyFont").trim() || "inherit"
  const app = new PIXI.Application()

  await app.init({
    width,
    height,
    antialias: true,
    backgroundAlpha: 0,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    eventMode: "static",
  })
  if (!isCurrent()) {
    app.destroy(true)
    return () => {}
  }
  graph.appendChild(app.canvas)

  const stage = new PIXI.Container()
  app.stage.addChild(stage)
  const simulation = d3
    .forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(-100 * repelForce))
    .force("center", d3.forceCenter().strength(centerForce))
    .force("link", d3.forceLink(graphLinks).distance(linkDistance))
    .force(
      "collide",
      d3
        .forceCollide()
        .radius((node) => {
          const count = graphLinks.filter(
            (link) => link.source.id === node.id || link.target.id === node.id,
          ).length
          return 2 + Math.sqrt(count)
        })
        .iterations(3),
    )

  if (enableRadial) {
    simulation.force("radial", d3.forceRadial(Math.min(width, height) * 0.4).strength(0.2))
  }

  const linkContainer = new PIXI.Container()
  const nodesContainer = new PIXI.Container()
  const labelsContainer = new PIXI.Container()
  stage.addChild(linkContainer)
  stage.addChild(nodesContainer)
  stage.addChild(labelsContainer)

  const nodeRenderData = []
  const linkRenderData = []
  let hoveredNodeId = null
  let hoveredNeighbours = new Set()
  let dragStartTime = 0
  let dragging = false
  let currentTransform = d3.zoomIdentity

  const nodeRadius = (node) => {
    const count = graphLinks.filter(
      (link) => link.source.id === node.id || link.target.id === node.id,
    ).length
    return 2 + Math.sqrt(count)
  }

  const nodeColor = (node) => {
    if (node.id === slug) return secondary
    if (visited.has(node.id) || node.id.startsWith("tags/")) return tertiary
    return gray
  }

  const updateHoverInfo = (nextId) => {
    hoveredNodeId = nextId
    hoveredNeighbours = new Set()
    for (const nodeData of nodeRenderData) nodeData.active = false
    for (const linkData of linkRenderData) linkData.active = false
    if (nextId === null) return

    for (const linkData of linkRenderData) {
      const link = linkData.simulationData
      if (link.source.id === nextId || link.target.id === nextId) {
        hoveredNeighbours.add(link.source.id)
        hoveredNeighbours.add(link.target.id)
        linkData.active = true
      }
    }
    hoveredNeighbours.add(nextId)
    for (const nodeData of nodeRenderData) {
      nodeData.active = hoveredNeighbours.has(nodeData.simulationData.id)
    }
  }

  const renderLinks = () => {
    for (const linkData of linkRenderData) {
      linkData.alpha = hoveredNodeId === null || linkData.active ? 1 : 0.2
      linkData.color = linkData.active ? gray : lightgray
    }
  }

  const renderLabels = () => {
    const defaultScale = 1 / scale
    for (const nodeData of nodeRenderData) {
      if (hoveredNodeId === nodeData.simulationData.id) {
        nodeData.label.alpha = 1
        nodeData.label.scale.set(defaultScale * 1.1)
      } else {
        nodeData.label.scale.set(defaultScale)
      }
    }
  }

  const renderNodes = () => {
    for (const nodeData of nodeRenderData) {
      nodeData.gfx.alpha = hoveredNodeId !== null && focusOnHover && !nodeData.active ? 0.2 : 1
    }
  }

  const renderPixiFromD3 = () => {
    renderNodes()
    renderLinks()
    renderLabels()
  }

  for (const node of nodes) {
    const isTagNode = node.id.startsWith("tags/")
    const label = new PIXI.Text({
      text: node.text,
      style: {
        fontSize: fontSize * 15,
        fill: dark,
        fontFamily: bodyFont,
      },
      resolution: (window.devicePixelRatio || 1) * 4,
    })
    label.anchor.set(0.5, 1.2)
    label.alpha = 0
    label.scale.set(1 / scale)
    labelsContainer.addChild(label)

    const gfx = new PIXI.Graphics()
    gfx.circle(0, 0, nodeRadius(node))
    gfx.fill({ color: isTagNode ? light : nodeColor(node) })
    if (isTagNode) gfx.stroke({ width: 2, color: tertiary })
    gfx.eventMode = "static"
    gfx.cursor = "pointer"
    gfx.label = node.id

    let oldLabelOpacity = 0
    gfx.on("pointerover", () => {
      updateHoverInfo(node.id)
      oldLabelOpacity = label.alpha
      if (!dragging) renderPixiFromD3()
    })
    gfx.on("pointerleave", () => {
      updateHoverInfo(null)
      label.alpha = oldLabelOpacity
      if (!dragging) renderPixiFromD3()
    })
    nodesContainer.addChild(gfx)
    nodeRenderData.push({
      simulationData: node,
      gfx,
      label,
      color: nodeColor(node),
      alpha: 1,
      active: false,
    })
  }

  for (const link of graphLinks) {
    const gfx = new PIXI.Graphics()
    gfx.eventMode = "none"
    linkContainer.addChild(gfx)
    linkRenderData.push({
      simulationData: link,
      gfx,
      color: lightgray,
      alpha: 1,
      active: false,
    })
  }

  if (enableDrag) {
    const dragSubject = (event) => {
      const mouseX = (event.x - currentTransform.x) / currentTransform.k
      const mouseY = (event.y - currentTransform.y) / currentTransform.k
      return (
        nodes.find((node) => {
          const dx = mouseX - node.x - width / 2
          const dy = mouseY - node.y - height / 2
          return Math.sqrt(dx * dx + dy * dy) < nodeRadius(node) + 5
        }) ?? null
      )
    }
    const drag = d3
      .drag()
      .container(app.canvas)
      .subject(dragSubject)
      .on("start", (event) => {
        if (!event.active) simulation.alphaTarget(1).restart()
        event.subject.fx = event.subject.x
        event.subject.fy = event.subject.y
        const mouseX = (event.x - currentTransform.x) / currentTransform.k - width / 2
        const mouseY = (event.y - currentTransform.y) / currentTransform.k - height / 2
        event.subject.__dragOffset = {
          x: mouseX - event.subject.x,
          y: mouseY - event.subject.y,
        }
        dragStartTime = Date.now()
        dragging = true
        hoveredNodeId = event.subject.id
      })
      .on("drag", (event) => {
        const mouseX = (event.x - currentTransform.x) / currentTransform.k - width / 2
        const mouseY = (event.y - currentTransform.y) / currentTransform.k - height / 2
        event.subject.fx = mouseX - event.subject.__dragOffset.x
        event.subject.fy = mouseY - event.subject.__dragOffset.y
      })
      .on("end", (event) => {
        if (!event.active) simulation.alphaTarget(0)
        event.subject.fx = null
        event.subject.fy = null
        dragging = false
        updateHoverInfo(null)
        renderPixiFromD3()
        if (Date.now() - dragStartTime < 500) {
          window.location.href = resolveBasePath(event.subject.id)
        }
      })
    d3.select(app.canvas).call(drag)
  } else {
    for (const nodeData of nodeRenderData) {
      nodeData.gfx.on("click", () => {
        window.location.href = resolveBasePath(nodeData.simulationData.id)
      })
    }
  }

  if (enableZoom) {
    const zoom = d3
      .zoom()
      .extent([
        [0, 0],
        [width, height],
      ])
      .scaleExtent([0.25, 4])
      .on("zoom", (event) => {
        currentTransform = event.transform
        stage.scale.set(currentTransform.k, currentTransform.k)
        stage.position.set(currentTransform.x, currentTransform.y)
        const scaleOpacity = Math.max((currentTransform.k * opacityScale - 1) / 3.75, 0)
        const activeLabels = nodeRenderData
          .filter((nodeData) => nodeData.active)
          .map((nodeData) => nodeData.label)
        for (const label of labelsContainer.children) {
          if (!activeLabels.includes(label)) label.alpha = scaleOpacity
        }
      })
    d3.select(app.canvas).call(zoom)
  }

  let animationFrame = 0
  let stopped = false
  const animate = () => {
    if (stopped) return
    for (const nodeData of nodeRenderData) {
      const { x, y } = nodeData.simulationData
      if (x == null || y == null) continue
      nodeData.gfx.position.set(x + width / 2, y + height / 2)
      nodeData.label.position.set(x + width / 2, y + height / 2)
    }
    for (const linkData of linkRenderData) {
      const { source, target } = linkData.simulationData
      if (source.x == null || source.y == null || target.x == null || target.y == null) continue
      linkData.gfx.clear()
      linkData.gfx.moveTo(source.x + width / 2, source.y + height / 2)
      linkData.gfx.lineTo(target.x + width / 2, target.y + height / 2)
      linkData.gfx.stroke({ alpha: linkData.alpha, width: 1, color: linkData.color })
    }
    animationFrame = requestAnimationFrame(animate)
  }

  simulation.on("tick", () => {})
  simulation.restart()
  renderPixiFromD3()
  animationFrame = requestAnimationFrame(animate)

  return () => {
    stopped = true
    cancelAnimationFrame(animationFrame)
    simulation.stop()
    try {
      d3.select(app.canvas).on(".drag", null).on(".zoom", null)
      app.destroy(true)
    } catch {
      // PixiJS may throw after a WebGL context loss.
    }
  }
}

function setLocalUi(state, status, message = "") {
  state.outer.dataset.state = status
  state.container.setAttribute("aria-busy", String(status === "loading"))
  state.button.dataset.state = status
  state.button.disabled = status === "loading"
  state.status.textContent = message
  if (status === "loaded") {
    state.button.hidden = true
  } else if (status === "error") {
    state.button.hidden = false
    state.button.textContent = "重试加载关系图"
    state.button.setAttribute("aria-label", "重试加载关系图")
  } else if (status === "loading") {
    state.button.hidden = false
    state.button.textContent = "正在加载关系图"
    state.button.setAttribute("aria-label", "正在加载关系图")
  } else {
    state.button.hidden = false
    state.button.textContent = "加载关系图"
    state.button.setAttribute("aria-label", "加载关系图")
  }
}

function setGlobalStatus(state, message = "") {
  state.globalStatus.textContent = message
  state.globalStatus.hidden = message === ""
}

async function renderLocal(state) {
  const generation = ++state.localGeneration
  state.localCleanup?.()
  state.localCleanup = undefined
  state.localFailed = false
  setLocalUi(state, "loading", "正在加载关系图")

  try {
    const [libraries, data] = await Promise.all([ensureGraphLibraries(), metadataLoader.load()])
    if (state.disposed || generation !== state.localGeneration) return
    const cleanup = await renderGraph(
      state.container,
      currentSlug(),
      data,
      libraries,
      () => !state.disposed && generation === state.localGeneration,
    )
    if (state.disposed || generation !== state.localGeneration) {
      cleanup()
      return
    }
    state.localCleanup = cleanup
    setLocalUi(state, "loaded")
  } catch (error) {
    if (!state.disposed && generation === state.localGeneration) {
      state.localFailed = true
      setLocalUi(state, "error", "关系图加载失败，请重试")
    }
    throw error
  }
}

function closeGlobal(state = activeGlobalState) {
  if (!state) return
  state.globalGeneration += 1
  state.globalCleanup?.()
  state.globalCleanup = undefined
  state.globalPending = undefined
  state.globalOuter.classList.remove("active")
  state.globalOuter.setAttribute("aria-hidden", "true")
  state.globalContainer.setAttribute("aria-busy", "false")
  state.globalIcon.setAttribute("aria-expanded", "false")
  state.globalIcon.setAttribute("aria-label", globalGraphButtonLabel(false))
  state.globalIcon.dataset.state = "idle"
  state.globalIcon.removeAttribute("aria-busy")
  setGlobalStatus(state)
  const sidebar = state.globalOuter.closest(".sidebar")
  if (sidebar) sidebar.style.zIndex = ""
  if (activeGlobalState === state) activeGlobalState = null
}

function openGlobal(state) {
  if (state.globalPending) return state.globalPending
  const generation = ++state.globalGeneration
  state.globalIcon.setAttribute("aria-busy", "true")
  state.globalIcon.dataset.state = "loading"
  setGlobalStatus(state)

  const attempt = Promise.all([ensureGraphLibraries(), metadataLoader.load()])
    .then(async ([libraries, data]) => {
      if (state.disposed || generation !== state.globalGeneration) return
      if (activeGlobalState && activeGlobalState !== state) closeGlobal(activeGlobalState)
      activeGlobalState = state
      state.globalOuter.classList.add("active")
      state.globalOuter.setAttribute("aria-hidden", "false")
      state.globalContainer.setAttribute("aria-busy", "true")
      state.globalIcon.setAttribute("aria-expanded", "true")
      const sidebar = state.globalOuter.closest(".sidebar")
      if (sidebar) sidebar.style.zIndex = "1"
      state.globalCleanup?.()
      const cleanup = await renderGraph(
        state.globalContainer,
        currentSlug(),
        data,
        libraries,
        () => !state.disposed && generation === state.globalGeneration,
      )
      if (state.disposed || generation !== state.globalGeneration) {
        cleanup()
        return
      }
      state.globalCleanup = cleanup
      state.globalContainer.setAttribute("aria-busy", "false")
      state.globalIcon.dataset.state = "loaded"
      state.globalIcon.setAttribute("aria-label", globalGraphButtonLabel(true))
    })
    .catch((error) => {
      if (!state.disposed && generation === state.globalGeneration) {
        closeGlobal(state)
        state.globalIcon.dataset.state = "error"
        state.globalIcon.setAttribute("aria-label", "全局关系图加载失败，重试")
        setGlobalStatus(state, "全局关系图加载失败，请重试")
      }
      throw error
    })
    .finally(() => {
      if (state.globalPending === attempt) {
        state.globalPending = undefined
        state.globalIcon.removeAttribute("aria-busy")
      }
    })
  state.globalPending = attempt
  return attempt
}

function disposeState(state) {
  state.disposed = true
  state.localGeneration += 1
  state.globalGeneration += 1
  state.triggerCleanup?.()
  state.mediaCleanup?.()
  state.localCleanup?.()
  state.globalCleanup?.()
  state.triggerCleanup = undefined
  state.mediaCleanup = undefined
  state.localCleanup = undefined
  state.globalCleanup = undefined
  if (activeGlobalState === state) closeGlobal(state)
  delete state.root.dataset.graphLazyBound
}

function startDesktopTrigger(state) {
  state.triggerCleanup?.()
  state.triggerCleanup = undefined
  if (state.mobile || state.localController.isLoaded()) return
  const trigger = () => {
    state.triggerCleanup?.()
    state.triggerCleanup = undefined
    void state.localController.intersect(true)?.catch(() => {})
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) trigger()
      },
      { rootMargin: "200px" },
    )
    observer.observe(state.outer)
    state.triggerCleanup = () => observer.disconnect()
    return
  }

  if ("requestIdleCallback" in window) {
    const idleId = window.requestIdleCallback(trigger)
    state.triggerCleanup = () => window.cancelIdleCallback?.(idleId)
    return
  }

  const timerId = window.setTimeout(trigger, 1000)
  state.triggerCleanup = () => window.clearTimeout(timerId)
}

function bindGraph(root) {
  if (graphStates.has(root) || root.dataset.graphLazyBound === "true") return
  const outer = root.querySelector(".graph-outer")
  const container = root.querySelector(".graph-container")
  const button = root.querySelector(".graph-load-button")
  const status = root.querySelector(".graph-load-status")
  const globalIcon = root.querySelector(".global-graph-icon")
  const globalStatus = root.querySelector(".global-graph-status")
  const globalOuter = root.querySelector(".global-graph-outer")
  const globalContainer = root.querySelector(".global-graph-container")
  if (
    !outer ||
    !container ||
    !button ||
    !status ||
    !globalIcon ||
    !globalStatus ||
    !globalOuter ||
    !globalContainer
  ) {
    return
  }

  const mediaQuery = window.matchMedia("(max-width: 800px)")
  const state = {
    root,
    outer,
    container,
    button,
    status,
    globalIcon,
    globalStatus,
    globalOuter,
    globalContainer,
    mobile: mediaQuery.matches,
    disposed: false,
    localFailed: false,
    localGeneration: 0,
    globalGeneration: 0,
    localCleanup: undefined,
    globalCleanup: undefined,
    globalPending: undefined,
    triggerCleanup: undefined,
    mediaCleanup: undefined,
    localController: undefined,
  }
  state.localController = createGraphTriggerController({
    mobile: state.mobile,
    load: () => renderLocal(state),
  })
  const onMediaChange = (event) => {
    state.mobile = event.matches
    state.localController.setMobile(state.mobile)
    state.triggerCleanup?.()
    state.triggerCleanup = undefined
    if (!state.mobile) startDesktopTrigger(state)
  }
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", onMediaChange)
    state.mediaCleanup = () => mediaQuery.removeEventListener("change", onMediaChange)
  } else {
    mediaQuery.addListener?.(onMediaChange)
    state.mediaCleanup = () => mediaQuery.removeListener?.(onMediaChange)
  }
  root.dataset.graphLazyBound = "true"
  graphStates.set(root, state)
  startDesktopTrigger(state)
}

function setupGraphs(event) {
  addToVisited(currentSlug(event))
  for (const [root, state] of graphStates) {
    if (!root.isConnected) {
      disposeState(state)
      graphStates.delete(root)
    }
  }
  for (const root of document.querySelectorAll(".graph")) bindGraph(root)
}

function refreshLoadedGraphs() {
  for (const state of graphStates.values()) {
    if (state.localController.isLoaded()) void renderLocal(state).catch(() => {})
    if (state === activeGlobalState && state.globalOuter.classList.contains("active")) {
      closeGlobal(state)
      void openGlobal(state).catch(() => {})
    }
  }
}

document.addEventListener("click", (event) => {
  const target = event.target
  const loadButton = target?.closest?.(".graph-load-button")
  if (loadButton) {
    const state = graphStates.get(loadButton.closest(".graph"))
    if (state) {
      if (state.localController.isLoaded() && state.localFailed) {
        void renderLocal(state).catch(() => {})
      } else {
        void state.localController.explicit()?.catch(() => {})
      }
    }
    return
  }

  const globalIcon = target?.closest?.(".global-graph-icon")
  if (globalIcon) {
    const state = graphStates.get(globalIcon.closest(".graph"))
    if (state) {
      if (state.globalPending || state === activeGlobalState) closeGlobal(state)
      else void openGlobal(state).catch(() => {})
    }
    return
  }

  if (
    activeGlobalState &&
    !target?.closest?.(".global-graph-container") &&
    !target?.closest?.(".global-graph-icon")
  ) {
    closeGlobal(activeGlobalState)
  }
})

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    const pendingGlobalState = [...graphStates.values()].find((state) => state.globalPending)
    const state = activeGlobalState ?? pendingGlobalState
    if (state) {
      closeGlobal(state)
      return
    }
  }
  if (
    event.key.toLocaleLowerCase() === "g" &&
    (event.metaKey || event.ctrlKey) &&
    !event.shiftKey
  ) {
    event.preventDefault()
    if (activeGlobalState) {
      closeGlobal(activeGlobalState)
      return
    }
    const state = [...graphStates.values()].find(({ root }) => root.isConnected)
    if (state) void openGlobal(state).catch(() => {})
  }
})

document.addEventListener("content-index-updated", () => {
  metadataLoader.invalidate()
  refreshLoadedGraphs()
})

document.addEventListener("prenav", () => {
  for (const state of graphStates.values()) disposeState(state)
  graphStates.clear()
  activeGlobalState = null
})

document.addEventListener("nav", setupGraphs)
document.addEventListener("render", setupGraphs)
document.addEventListener("themechange", refreshLoadedGraphs)
