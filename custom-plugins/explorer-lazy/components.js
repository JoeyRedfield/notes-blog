import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { buildSync } from "esbuild"
import { h } from "preact"

const directory = path.dirname(fileURLToPath(import.meta.url))
const explorerLazyCss = fs.readFileSync(path.join(directory, "explorer.css"), "utf8")
const explorerLazyScript = buildSync({
  entryPoints: [path.join(directory, "explorer.inline.ts")],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2020",
  minify: true,
  write: false,
  logLevel: "silent",
}).outputFiles[0].text

const defaultOptions = {
  folderDefaultState: "collapsed",
  folderClickBehavior: "link",
  useSavedState: true,
  mapFn: (node) => node,
  sortFn: (a, b) => {
    if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1
    return (a.displayName || "").localeCompare(b.displayName || "", undefined, {
      numeric: true,
      sensitivity: "base",
    })
  },
  filterFn: (node) => node.slugSegment !== "tags",
  order: ["filter", "map", "sort"],
}

let explorerInstance = 0

const chevron = (className, width = 14, height = 14) =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width,
      height,
      viewBox: "5 8 14 8",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      class: className,
      "aria-hidden": "true",
    },
    h("polyline", { points: "6 9 12 15 18 9" }),
  )

const menuIcon = () =>
  h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      class: "lucide-menu",
      "aria-hidden": "true",
    },
    [
      h("line", { x1: "4", x2: "20", y1: "12", y2: "12" }),
      h("line", { x1: "4", x2: "20", y1: "6", y2: "6" }),
      h("line", { x1: "4", x2: "20", y1: "18", y2: "18" }),
    ],
  )

function defaultTitle(locale) {
  return locale === "zh-CN" ? "探索" : "Explorer"
}

export const ExplorerLazy = (userOptions = {}) => {
  const options = { ...defaultOptions, ...userOptions }
  const dataFns = JSON.stringify({
    order: options.order,
    sortFn: options.sortFn?.toString(),
    filterFn: options.filterFn?.toString(),
    mapFn: options.mapFn?.toString(),
  })
  const config = JSON.stringify({
    folderDefaultState: options.folderDefaultState,
    folderClickBehavior: options.folderClickBehavior,
    useSavedState: options.useSavedState,
  })

  const Component = ({ cfg, displayClass }) => {
    const id = `explorer-lazy-${++explorerInstance}`
    const title = options.title ?? defaultTitle(cfg?.locale)

    return h(
      "div",
      {
        class: [displayClass, "explorer", "nav-files-container"].filter(Boolean).join(" "),
        "data-behavior": options.folderClickBehavior,
        "data-collapsed": options.folderDefaultState,
        "data-savestate": String(options.useSavedState),
        "data-data-fns": dataFns,
        "data-config": config,
      },
      [
        h(
          "button",
          {
            type: "button",
            class: "explorer-toggle mobile-explorer hide-until-loaded",
            "data-mobile": "true",
            "aria-controls": id,
            "aria-expanded": "false",
            "aria-label": title,
          },
          menuIcon(),
        ),
        h(
          "button",
          {
            type: "button",
            class: "title-button explorer-toggle desktop-explorer",
            "data-mobile": "false",
            "aria-controls": id,
            "aria-expanded": "true",
          },
          [h("h2", null, title), chevron("fold")],
        ),
        h(
          "div",
          { id, class: "explorer-content", role: "group" },
          h(
            "ul",
            { class: "explorer-ul overflow", "aria-busy": "false" },
            h("li", { class: "overflow-end", "aria-hidden": "true" }),
          ),
        ),
        h(
          "template",
          { class: "explorer-file-template" },
          h("li", null, h("a", { href: "#", class: "nav-file-title tree-item-self internal" })),
        ),
        h(
          "template",
          { class: "explorer-folder-template" },
          h("li", null, [
            h("div", { class: "folder-container nav-folder-title tree-item-self" }, [
              h(
                "button",
                {
                  type: "button",
                  class: "folder-icon nav-folder-collapse-indicator collapse-icon",
                  "aria-expanded": "false",
                  "aria-label": "Toggle folder",
                },
                chevron("folder-chevron", 12, 12),
              ),
              h(
                "div",
                null,
                h(
                  "button",
                  { type: "button", class: "folder-button", "aria-expanded": "false" },
                  h("span", { class: "folder-title" }),
                ),
              ),
            ]),
            h(
              "div",
              { class: "folder-outer" },
              h("ul", {
                class: "content tree-item-children",
                "data-generated": "false",
              }),
            ),
          ]),
        ),
      ],
    )
  }

  Component.css = explorerLazyCss
  Component.afterDOMLoaded = explorerLazyScript
  return Component
}

export { explorerLazyCss, explorerLazyScript }
