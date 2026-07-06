import { h } from "preact"
import { joinSegments, pathToRoot } from "@quartz-community/utils"

export { ReadingEnhancements, readingEnhancementsScript } from "./components.js"

export const fontSubsetPath = "static/fonts/LXGWWenKai-Regular.subset.woff2"

export function fontPreloadHref(pageData = {}, basePath = "") {
  const slug = pageData.slug

  if (!slug || slug === "404") {
    return joinSegments(basePath, fontSubsetPath)
  }

  return joinSegments(pathToRoot(slug), fontSubsetPath)
}

function walkElements(node, visitor) {
  if (!node || typeof node !== "object") return

  if (node.type === "element") {
    visitor(node)
  }

  if (!Array.isArray(node.children)) return

  for (const child of node.children) {
    walkElements(child, visitor)
  }
}

export function addLazyLoadingToImages(tree) {
  walkElements(tree, (node) => {
    if (node.tagName !== "img") return

    node.properties = node.properties ?? {}

    if (!node.properties.loading) {
      node.properties.loading = "lazy"
    }

    if (!node.properties.decoding) {
      node.properties.decoding = "async"
    }
  })
}

export default function ReadingEnhancementsTransformer() {
  return {
    name: "ReadingEnhancements",
    externalResources(ctx = {}) {
      const baseUrl = ctx.cfg?.configuration?.baseUrl
      const basePath = new URL(`https://${baseUrl ?? "example.com"}`).pathname

      return {
        additionalHead: [
          (pageData) =>
            h("link", {
              rel: "preload",
              href: fontPreloadHref(pageData, basePath),
              as: "font",
              type: "font/woff2",
              crossOrigin: "anonymous",
            }),
        ],
      }
    },
    htmlPlugins() {
      return [
        () => {
          return (tree) => addLazyLoadingToImages(tree)
        },
      ]
    },
  }
}
