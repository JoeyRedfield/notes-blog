import path from "node:path"
import { ChangeEvent } from "../plugins/types"
import { ProcessedContent } from "../plugins/vfile"
import { FilePath } from "./path"

type WatchContentEntry = { type: "markdown"; content: ProcessedContent } | { type: "other" }

const responsiveImageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"])

export interface ResponsiveImageWatchBatchPlan {
  refreshMarkdown: boolean
  markdownPaths: FilePath[]
  nonMarkdownMembershipChanges: Array<Pick<ChangeEvent, "type" | "path">>
}

export function planResponsiveImageWatchBatch(
  currentChanges: ChangeEvent[],
  contentMap: ReadonlyMap<FilePath, WatchContentEntry>,
): ResponsiveImageWatchBatchPlan {
  const refreshMarkdown = currentChanges.some((change) =>
    responsiveImageExtensions.has(path.extname(change.path).toLowerCase()),
  )
  if (!refreshMarkdown) {
    return { refreshMarkdown: false, markdownPaths: [], nonMarkdownMembershipChanges: [] }
  }

  const deletedMarkdown = new Set(
    currentChanges
      .filter(
        (change) => change.type === "delete" && path.extname(change.path).toLowerCase() === ".md",
      )
      .map((change) => change.path),
  )
  const markdownPaths = Array.from(contentMap.entries())
    .filter(([fp, entry]) => entry.type === "markdown" && !deletedMarkdown.has(fp))
    .map(([fp]) => fp)
  const nonMarkdownMembershipChanges = currentChanges
    .filter(
      (change) =>
        path.extname(change.path).toLowerCase() !== ".md" &&
        (change.type === "add" || change.type === "delete"),
    )
    .map(({ type, path }) => ({ type, path }))

  return { refreshMarkdown, markdownPaths, nonMarkdownMembershipChanges }
}

export function withSyntheticResponsiveMarkdownChanges(
  changeEvents: ChangeEvent[],
  contentMap: ReadonlyMap<FilePath, WatchContentEntry>,
  refreshMarkdown: boolean,
): ChangeEvent[] {
  if (!refreshMarkdown) return changeEvents

  const effective = [...changeEvents]
  const changedPaths = new Set(changeEvents.map((event) => event.path))
  for (const [fp, entry] of contentMap) {
    if (entry.type !== "markdown" || changedPaths.has(fp)) continue
    effective.push({ type: "change", path: fp, file: entry.content[1] })
  }
  return effective
}
