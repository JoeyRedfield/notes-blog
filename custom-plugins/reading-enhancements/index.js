export { ReadingEnhancements, readingEnhancementsScript } from "./components.js"

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
    htmlPlugins() {
      return [
        () => {
          return (tree) => addLazyLoadingToImages(tree)
        },
      ]
    },
  }
}
