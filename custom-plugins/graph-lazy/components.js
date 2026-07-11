import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { buildSync } from "esbuild"
import { h } from "preact"

const directory = path.dirname(fileURLToPath(import.meta.url))
const graphLazyCss = fs.readFileSync(path.join(directory, "graph.css"), "utf8")
const graphLazyScript = buildSync({
  entryPoints: [path.join(directory, "graph.inline.ts")],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2020",
  minify: true,
  write: false,
  logLevel: "silent",
}).outputFiles[0].text

export const defaultGraphOptions = {
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
}

const globalGraphIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 55 55",
      fill: "currentColor",
      "aria-hidden": "true",
    },
    h("path", {
      d: "M49 0a6 6 0 0 0-5.27 8.86l-9.83 9.83A7.96 7.96 0 0 0 29 17a7.96 7.96 0 0 0-4.9 1.69l-7.67-7.67A4 4 0 1 0 13 13c.74 0 1.42-.22 2.02-.57l7.67 7.67A7.96 7.96 0 0 0 21 25c0 1.85.63 3.54 1.69 4.9L10.02 42.56A6 6 0 1 0 12 47c0-1.04-.26-2.01-.73-2.86L24.1 31.31A7.96 7.96 0 0 0 28 32.93v10.16A6 6 0 1 0 30 43.1V32.93a7.96 7.96 0 0 0 3.9-1.62l7.67 7.67A4 4 0 1 0 45 37c-.74 0-1.42.22-2.02.57L35.31 29.9A7.96 7.96 0 0 0 37 25c0-1.85-.63-3.54-1.69-4.9l9.67-9.66A6 6 0 1 0 49 0ZM29 31a6 6 0 1 1 0-12 6 6 0 0 1 0 12Z",
    }),
  )

export const GraphLazy = (userOptions = {}) => {
  const localGraph = { ...defaultGraphOptions.localGraph, ...userOptions.localGraph }
  const globalGraph = { ...defaultGraphOptions.globalGraph, ...userOptions.globalGraph }

  const Component = ({ displayClass, cfg }) => {
    const title = cfg?.locale === "zh-CN" ? "关系图谱" : "Graph View"

    return h("div", { class: [displayClass, "graph"].filter(Boolean).join(" ") }, [
      h("h3", null, title),
      h("div", { class: "graph-outer", "data-state": "idle" }, [
        h("div", {
          class: "graph-container",
          "data-cfg": JSON.stringify(localGraph),
          "aria-busy": "false",
        }),
        h("p", {
          class: "graph-load-status",
          role: "status",
          "aria-live": "polite",
        }),
        h(
          "button",
          {
            class: "graph-load-button",
            type: "button",
            "aria-label": "加载关系图",
            "data-state": "idle",
          },
          "加载关系图",
        ),
        h(
          "button",
          {
            class: "global-graph-icon",
            type: "button",
            "aria-label": "打开全局关系图",
            "aria-expanded": "false",
          },
          globalGraphIcon(),
        ),
      ]),
      h(
        "div",
        {
          class: "global-graph-outer",
          role: "dialog",
          "aria-label": "全局关系图",
          "aria-modal": "true",
          "aria-hidden": "true",
        },
        h("div", {
          class: "global-graph-container",
          "data-cfg": JSON.stringify(globalGraph),
          "aria-busy": "false",
        }),
      ),
    ])
  }

  Component.css = graphLazyCss
  Component.afterDOMLoaded = graphLazyScript
  return Component
}

export { graphLazyCss, graphLazyScript }
