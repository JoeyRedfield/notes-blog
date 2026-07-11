import assert from "node:assert/strict"
import { describe, test } from "node:test"
import { VFile } from "vfile"
import { Root } from "hast"
import { ChangeEvent } from "./plugins/types"
import { ProcessedContent } from "./plugins/vfile"
import { FilePath, FullSlug } from "./util/path"
import {
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
  for (const transition of ["1600 to 600", "1600 to damaged", "600 to 1600"]) {
    test(`${transition} reparses and synthetically changes every current Markdown page`, () => {
      const contentMap = contentFixture()
      const imageChange: ChangeEvent = {
        type: "change",
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
          ["change", "assets/photo.PnG", undefined],
          ["change", "notes/a.md", "notes/a"],
          ["change", "notes/b.md", "notes/b"],
        ],
      )
    })
  }

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
