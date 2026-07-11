import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { VFile } from "vfile"
import { Root } from "hast"
import { ChangeEvent } from "./plugins/types"
import { ProcessedContent } from "./plugins/vfile"
import { FilePath, FullSlug } from "./util/path"
import {
  beginWatchChangeBatch,
  planResponsiveImageWatchBatch,
  withSyntheticResponsiveMarkdownChanges,
} from "./util/responsiveImageWatch"

type ContentEntry = { type: "markdown"; content: ProcessedContent } | { type: "other" }

function markdownEntry(relativePath: string, slug: string): ContentEntry {
  const tree: Root = { type: "root", children: [] }
  const file = new VFile("")
  file.data.relativePath = relativePath as FilePath
  file.data.slug = slug as FullSlug
  return { type: "markdown", content: [tree, file] }
}

function contentFixture() {
  return new Map<FilePath, ContentEntry>([
    ["notes/a.md" as FilePath, markdownEntry("notes/a.md", "notes/a")],
    ["notes/b.md" as FilePath, markdownEntry("notes/b.md", "notes/b")],
    ["assets/photo.png" as FilePath, { type: "other" }],
  ])
}

describe("responsive image watch batches", () => {
  test("every responsive image event reparses all current Markdown pages", () => {
    for (const type of ["add", "change", "delete"] as const) {
      const contentMap = contentFixture()
      const imageChange: ChangeEvent = {
        type,
        path: "assets/photo.PnG" as FilePath,
      }
      const plan = planResponsiveImageWatchBatch([imageChange], contentMap)

      assert.equal(plan.refreshMarkdown, true)
      assert.deepEqual(plan.markdownPaths, ["notes/a.md", "notes/b.md"])

      const aEntry = contentMap.get("notes/a.md" as FilePath)
      assert.equal(aEntry?.type, "markdown")
      const aFile = aEntry.type === "markdown" ? aEntry.content[1] : undefined
      const effective = withSyntheticResponsiveMarkdownChanges(
        [imageChange, { type: "change", path: "notes/a.md" as FilePath, file: aFile }],
        contentMap,
        plan.refreshMarkdown,
      )

      assert.deepEqual(
        effective.map((event) => [event.type, event.path, event.file?.data.slug]),
        [
          [type, "assets/photo.PnG", undefined],
          ["change", "notes/a.md", "notes/a"],
          ["change", "notes/b.md", "notes/b"],
        ],
      )
    }
  })

  test("captures and consumes only the queue state visible after the previous batch commits", () => {
    const imageChange: ChangeEvent = {
      type: "change",
      path: "assets/photo.png" as FilePath,
    }
    const markdownChange: ChangeEvent = {
      type: "change",
      path: "notes/a.md" as FilePath,
    }
    const jsonChange: ChangeEvent = {
      type: "change",
      path: "assets/data.json" as FilePath,
    }
    const queue = [imageChange]

    const imageBatch = beginWatchChangeBatch(queue)
    queue.push(markdownChange)
    imageBatch.commit()

    const markdownBatch = beginWatchChangeBatch(queue)
    assert.deepEqual(markdownBatch.changes, [markdownChange])
    assert.equal(
      planResponsiveImageWatchBatch(markdownBatch.changes, contentFixture()).refreshMarkdown,
      false,
    )

    queue.push(jsonChange)
    markdownBatch.commit()
    assert.deepEqual(queue, [jsonChange])
  })

  test("image add and delete expose ordered non-Markdown membership updates before parsing", () => {
    const contentMap = contentFixture()
    const plan = planResponsiveImageWatchBatch(
      [
        { type: "delete", path: "assets/photo.png" as FilePath },
        { type: "add", path: "assets/新 图.WebP" as FilePath },
        { type: "add", path: "assets/diagram.pdf" as FilePath },
      ],
      contentMap,
    )

    assert.equal(plan.refreshMarkdown, true)
    assert.deepEqual(plan.nonMarkdownMembershipChanges, [
      { type: "delete", path: "assets/photo.png" },
      { type: "add", path: "assets/新 图.WebP" },
      { type: "add", path: "assets/diagram.pdf" },
    ])
    assert.deepEqual(plan.markdownPaths, ["notes/a.md", "notes/b.md"])
  })

  test("does not parse a Markdown file deleted in the same responsive image batch", () => {
    const contentMap = contentFixture()
    const plan = planResponsiveImageWatchBatch(
      [
        { type: "change", path: "assets/photo.jpeg" as FilePath },
        { type: "delete", path: "notes/b.md" as FilePath },
      ],
      contentMap,
    )

    assert.equal(plan.refreshMarkdown, true)
    assert.deepEqual(plan.markdownPaths, ["notes/a.md"])
  })

  test("non-image changes do not trigger a full Markdown refresh", () => {
    const contentMap = contentFixture()
    const change: ChangeEvent = { type: "change", path: "assets/data.json" as FilePath }
    const plan = planResponsiveImageWatchBatch([change], contentMap)
    const effective = withSyntheticResponsiveMarkdownChanges(
      [change],
      contentMap,
      plan.refreshMarkdown,
    )

    assert.equal(plan.refreshMarkdown, false)
    assert.deepEqual(plan.markdownPaths, [])
    assert.deepEqual(plan.nonMarkdownMembershipChanges, [])
    assert.deepEqual(effective, [change])
  })
})
