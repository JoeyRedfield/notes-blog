import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { buildSync } from "esbuild"
import { h } from "preact"

const directory = path.dirname(fileURLToPath(import.meta.url))
const searchLazyCss = fs.readFileSync(path.join(directory, "search.css"), "utf8")
const searchLazyScript = buildSync({
  entryPoints: [path.join(directory, "search.inline.ts")],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2020",
  minify: true,
  write: false,
  logLevel: "silent",
}).outputFiles[0].text

export const SearchLazy = () => {
  const Component = ({ displayClass }) =>
    h("div", { class: [displayClass, "search"].filter(Boolean).join(" ") }, [
      h(
        "button",
        {
          class: "search-button",
          type: "button",
          "aria-label": "搜索",
          "aria-expanded": "false",
        },
        [
          h(
            "svg",
            {
              role: "img",
              xmlns: "http://www.w3.org/2000/svg",
              viewBox: "0 0 19.9 19.7",
              "aria-hidden": "true",
            },
            h("g", { class: "search-path", fill: "none" }, [
              h("path", { "stroke-linecap": "square", d: "M18.5 18.3l-5.4-5.4" }),
              h("circle", { cx: "8", cy: "8", r: "7" }),
            ]),
          ),
          h("p", null, "搜索"),
        ],
      ),
      h(
        "div",
        {
          class: "search-container",
          role: "dialog",
          "aria-label": "搜索",
          "aria-modal": "true",
          "aria-hidden": "true",
          hidden: true,
        },
        h("div", { class: "search-space" }, [
          h("input", {
            autocomplete: "off",
            class: "search-bar",
            name: "search",
            type: "search",
            "aria-label": "搜索笔记",
            "aria-autocomplete": "list",
            "aria-expanded": "false",
            placeholder: "搜索笔记",
            role: "combobox",
          }),
          h(
            "button",
            {
              class: "search-close",
              type: "button",
              "aria-label": "关闭搜索",
            },
            h("span", { "aria-hidden": "true" }, "×"),
          ),
          h("div", { class: "search-layout", "aria-busy": "false" }, [
            h("p", { class: "search-status", role: "status", "aria-live": "polite", hidden: true }),
            h("button", { class: "search-retry", type: "button", hidden: true }, "重试"),
            h("div", {
              class: "results-container",
              role: "listbox",
              "aria-label": "搜索结果",
            }),
          ]),
        ]),
      ),
    ])

  Component.css = searchLazyCss
  Component.afterDOMLoaded = searchLazyScript
  return Component
}

export { searchLazyCss, searchLazyScript }
