import assert from "node:assert/strict"
import test, { describe } from "node:test"
import { render } from "preact-render-to-string"

function page(
  slug: string,
  title: string,
  tags: string[],
  modified: string,
  extra: Record<string, unknown> = {},
) {
  return {
    slug,
    relativePath: `${slug}.md`,
    filePath: `${slug}.md`,
    frontmatter: { title, tags },
    dates: { modified: new Date(modified) },
    defaultDateType: "modified",
    ...extra,
  }
}

async function loadPlugin() {
  return import("./index.js")
}

function renderTagPage(
  plugin: Awaited<ReturnType<typeof loadPlugin>>,
  slug: string,
  allFiles: ReturnType<typeof page>[],
) {
  const instance = plugin.default()
  const Component = instance.body()
  return render(
    Component({
      cfg: { locale: "zh-CN" },
      fileData: { slug, frontmatter: { title: slug, tags: [] } },
      tree: { type: "root", children: [] },
      allFiles,
    } as never),
  )
}

describe("tag-page-lite", () => {
  test("generates the existing tags/<tag> URLs without using unlisted pages", async () => {
    const plugin = await loadPlugin()
    const instance = plugin.default()
    const content = [
      [{ type: "root", children: [] }, { data: page("notes/a", "A", ["alpha"], "2024-01-01") }],
      [
        { type: "root", children: [] },
        { data: page("notes/hidden", "Hidden", ["secret"], "2024-01-01", { unlisted: true }) },
      ],
    ] as never

    const generated = instance.generate({ content, cfg: { locale: "zh-CN" }, ctx: {} })
    const slugs = generated.map(({ slug }: { slug: string }) => slug)

    assert.deepStrictEqual(slugs.sort(), ["tags/alpha", "tags/index"])
  })

  test("renders one compact grouped link per tag with its name and article count", async () => {
    const plugin = await loadPlugin()
    const html = renderTagPage(plugin, "tags/index", [
      page("notes/a", "Alpha older", ["alpha"], "2024-01-01"),
      page("notes/b", "Alpha newer", ["alpha"], "2024-02-01"),
      page("notes/c", "Beta", ["beta"], "2024-03-01"),
    ])

    assert.match(html, /class="tag-group-heading"[^>]*>A</)
    assert.match(html, /class="tag-group-heading"[^>]*>B</)
    assert.match(html, /href="\.\.\/tags\/alpha"[^>]*>alpha</)
    assert.match(html, /href="\.\.\/tags\/beta"[^>]*>beta</)
    assert.match(html, /class="tag-count"[^>]*>2</)
    assert.match(html, /class="tag-count"[^>]*>1</)
    assert.equal((html.match(/>alpha<\/a>/g) ?? []).length, 1)
    assert.equal((html.match(/>beta<\/a>/g) ?? []).length, 1)
    assert.doesNotMatch(html, /article-preview|section-ul/)
    assert.doesNotMatch(html, /Alpha older|Alpha newer|>Beta</)
  })

  test("lists every article on a single-tag page by date and title", async () => {
    const plugin = await loadPlugin()
    const html = renderTagPage(plugin, "tags/alpha", [
      page("notes/older", "Older title", ["alpha"], "2024-01-02"),
      page("notes/newer-b", "Zulu title", ["alpha"], "2024-03-04"),
      page("notes/newer-a", "Alpha title", ["alpha"], "2024-03-04"),
      page("notes/other", "Other tag", ["beta"], "2024-04-01"),
    ])

    assert.match(html, /datetime="2024-03-04T00:00:00\.000Z"/)
    assert.match(html, /datetime="2024-01-02T00:00:00\.000Z"/)
    assert.match(html, /href="\.\.\/notes\/newer-a"[^>]*>Alpha title</)
    assert.match(html, /href="\.\.\/notes\/newer-b"[^>]*>Zulu title</)
    assert.match(html, /href="\.\.\/notes\/older"[^>]*>Older title</)
    assert.ok(html.indexOf("Alpha title") < html.indexOf("Zulu title"))
    assert.ok(html.indexOf("Zulu title") < html.indexOf("Older title"))
    assert.doesNotMatch(html, /Other tag|article-preview|section-ul/)
  })
})
