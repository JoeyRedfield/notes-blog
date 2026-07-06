import { copyFile, mkdir, readFile, readdir, rmdir, stat, unlink, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".pdf",
  ".mp4",
  ".mov",
])

function toPosix(filePath) {
  return filePath.split(path.sep).join("/")
}

function splitPath(relativePath) {
  return toPosix(relativePath)
    .split("/")
    .filter((part) => part.length > 0)
}

export function isExcludedPath(relativePath, exclude) {
  const parts = splitPath(relativePath)
  return exclude.some((blocked) => parts.includes(blocked))
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)))
    } else if (entry.isFile()) {
      files.push(fullPath)
    }
  }

  return files
}

export async function findMarkdownFiles(sourceVault, include, exclude, excludeFiles = []) {
  const results = []
  const excludedFiles = new Set(excludeFiles.map(toPosix))

  for (const includePath of include) {
    const fullIncludePath = path.join(sourceVault, includePath)
    let includeStat
    try {
      includeStat = await stat(fullIncludePath)
    } catch {
      continue
    }

    const candidates = includeStat.isDirectory() ? await walk(fullIncludePath) : [fullIncludePath]
    for (const file of candidates) {
      const relative = path.relative(sourceVault, file)
      if (path.extname(file).toLowerCase() !== ".md") continue
      if (excludedFiles.has(toPosix(relative))) continue
      if (isExcludedPath(relative, exclude)) continue
      results.push(file)
    }
  }

  return results.sort((a, b) => toPosix(a).localeCompare(toPosix(b), "zh-Hans-CN"))
}

export function getReferencedAttachments(markdown) {
  const attachments = []
  const obsidianEmbed = /!\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g
  const markdownImage = /!\[[^\]]*\]\((?!https?:\/\/|#)([^)]+)\)/g

  for (const match of markdown.matchAll(obsidianEmbed)) {
    attachments.push(decodeURI(match[1]).trim())
  }

  for (const match of markdown.matchAll(markdownImage)) {
    attachments.push(decodeURI(match[1]).trim())
  }

  return [...new Set(attachments)].filter((reference) => !isPlaceholderAttachment(reference))
}

function isPlaceholderAttachment(reference) {
  const trimmed = reference.trim()
  return trimmed === "..." || trimmed.includes("*")
}

export function scanSensitiveTerms(markdown, sensitiveTerms) {
  const warnings = []
  const terms = sensitiveTerms.map((term) => term.toLowerCase())

  markdown.split(/\r?\n/).forEach((line, index) => {
    const lowerLine = line.toLowerCase()
    for (const term of terms) {
      if (lowerLine.includes(term)) {
        warnings.push({
          line: index + 1,
          term,
          text: line.trim().slice(0, 180),
        })
      }
    }
  })

  return warnings
}

async function findAttachment(sourceVault, markdownFile, reference) {
  const cleanedReference = reference.replace(/^<|>$/g, "")
  const markdownDir = path.dirname(markdownFile)
  const markdownBaseName = path.basename(markdownFile, path.extname(markdownFile))
  const candidates = [
    path.resolve(markdownDir, cleanedReference),
    path.resolve(markdownDir, "assets", markdownBaseName, cleanedReference),
    path.resolve(sourceVault, cleanedReference),
    path.resolve(sourceVault, "assets", cleanedReference),
    path.resolve(sourceVault, path.basename(cleanedReference)),
  ]

  for (const candidate of candidates) {
    try {
      const candidateStat = await stat(candidate)
      if (candidateStat.isFile() && IMAGE_EXTENSIONS.has(path.extname(candidate).toLowerCase())) {
        return candidate
      }
    } catch {
      // Keep trying the next likely Obsidian attachment location.
    }
  }

  try {
    const assetFiles = await walk(path.join(sourceVault, "assets"))
    return (
      assetFiles.find(
        (file) =>
          path.basename(file) === path.basename(cleanedReference) &&
          IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()),
      ) ?? null
    )
  } catch {
    return null
  }

  return null
}

function makeReport({ copiedMarkdown, copiedAttachments, missingAttachments, sensitiveWarnings, skipped, removed }) {
  const lines = [
    "# Public Notes Sync Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- Markdown copied: ${copiedMarkdown.length}`,
    `- Attachments copied: ${copiedAttachments.length}`,
    `- Missing attachments: ${missingAttachments.length}`,
    `- Sensitive warnings: ${sensitiveWarnings.length}`,
    `- Skipped inputs: ${skipped.length}`,
    `- Stale files removed: ${removed.length}`,
    "",
    "## Copied Markdown",
    "",
    ...copiedMarkdown.map((file) => `- ${file}`),
    "",
    "## Copied Attachments",
    "",
    ...(copiedAttachments.length ? copiedAttachments.map((file) => `- ${file}`) : ["- None"]),
    "",
    "## Missing Attachments",
    "",
    ...(missingAttachments.length
      ? missingAttachments.map((item) => `- ${item.markdown}: ${item.reference}`)
      : ["- None"]),
    "",
    "## Sensitive Warnings",
    "",
    ...(sensitiveWarnings.length
      ? sensitiveWarnings.map(
          (item) => `- ${item.markdown}:${item.line} [${item.term}] ${item.text}`,
        )
      : ["- None"]),
    "",
    "## Stale Files Removed",
    "",
    ...(removed.length ? removed.map((file) => `- ${file}`) : ["- None"]),
    "",
    "## Skipped",
    "",
    ...(skipped.length ? skipped.map((item) => `- ${item}`) : ["- None"]),
    "",
  ]

  return `${lines.join("\n")}\n`
}

async function cleanupStaleContent(contentDir, expectedFiles) {
  const removed = []

  async function collectExisting(dir, base) {
    const results = []
    try {
      const entries = await readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        const relative = path.relative(base, fullPath)
        if (entry.isDirectory()) {
          results.push(...(await collectExisting(fullPath, base)))
        } else if (entry.isFile()) {
          results.push(relative)
        }
      }
    } catch {
      // contentDir doesn't exist yet — nothing to clean
    }
    return results
  }

  const existing = await collectExisting(contentDir, contentDir)
  const expected = new Set(expectedFiles.map(toPosix))

  for (const file of existing) {
    if (!expected.has(toPosix(file))) {
      await unlink(path.join(contentDir, file))
      removed.push(toPosix(file))
    }
  }

  // Clean up empty directories (bottom-up by depth)
  for (const file of removed) {
    let dir = path.dirname(path.join(contentDir, file))
    while (dir !== contentDir) {
      try {
        const entries = await readdir(dir)
        if (entries.length === 0) {
          await rmdir(dir)
        } else {
          break
        }
      } catch {
        break
      }
      dir = path.dirname(dir)
    }
  }

  return removed
}

async function writeIndex(config, copiedMarkdown) {
  const title = config.siteTitle ?? "HenryWu's Blog"
  const description = config.siteDescription ?? "公开技术笔记试水站。"
  const intro = typeof config.siteIntro === "string" ? config.siteIntro.trim() : ""
  const outro = typeof config.siteFooter === "string" ? config.siteFooter.trim() : ""
  const groups = new Map()

  for (const file of copiedMarkdown) {
    const [group] = file.split("/")
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group).push(file)
  }

  const lines = [
    "---",
    `title: ${JSON.stringify(title)}`,
    "---",
    "",
    `# ${title}`,
    "",
    description,
    "",
  ]

  if (intro) {
    lines.push(intro, "")
  }

  for (const [group, files] of [...groups.entries()].sort()) {
    lines.push(`## ${group}`, "")
    for (const file of files.filter((item) => !item.toLowerCase().endsWith("/readme.md"))) {
      const label = path.basename(file, ".md")
      lines.push(`- [[${file.replace(/\.md$/, "")}|${label}]]`)
    }
    lines.push("")
  }

  if (outro) {
    lines.push(outro, "")
  }

  while (lines.at(-1) === "") {
    lines.pop()
  }

  await writeFile(path.join(config.contentDir, "index.md"), `${lines.join("\n")}\n`)
}

export async function syncPublicNotes(config) {
  const markdownFiles = await findMarkdownFiles(
    config.sourceVault,
    config.include,
    config.exclude,
    config.excludeFiles ?? [],
  )
  const copiedMarkdown = []
  const copiedAttachments = []
  const missingAttachments = []
  const sensitiveWarnings = []
  const skipped = []

  await mkdir(config.contentDir, { recursive: true })

  for (const markdownFile of markdownFiles) {
    const relative = path.relative(config.sourceVault, markdownFile)
    const outputPath = path.join(config.contentDir, relative)
    const markdown = await readFile(markdownFile, "utf8")

    const warnings = scanSensitiveTerms(markdown, config.sensitiveTerms ?? [])
    sensitiveWarnings.push(
      ...warnings.map((warning) => ({
        markdown: toPosix(relative),
        ...warning,
      })),
    )

    await mkdir(path.dirname(outputPath), { recursive: true })
    await writeFile(outputPath, markdown)
    copiedMarkdown.push(toPosix(relative))

    for (const reference of getReferencedAttachments(markdown)) {
      const attachment = await findAttachment(config.sourceVault, markdownFile, reference)
      if (!attachment) {
        missingAttachments.push({ markdown: toPosix(relative), reference })
        continue
      }

      const attachmentRelative = path.relative(config.sourceVault, attachment)
      const attachmentOutput = path.join(config.contentDir, attachmentRelative)
      await mkdir(path.dirname(attachmentOutput), { recursive: true })
      await copyFile(attachment, attachmentOutput)
      copiedAttachments.push(toPosix(attachmentRelative))
    }
  }

  const uniqueAttachments = [...new Set(copiedAttachments)]
  const removed = await cleanupStaleContent(config.contentDir, [
    ...copiedMarkdown,
    ...uniqueAttachments,
    "index.md",
  ])

  const report = makeReport({
    copiedMarkdown,
    copiedAttachments: [...new Set(copiedAttachments)].sort(),
    missingAttachments,
    sensitiveWarnings,
    skipped,
    removed,
  })

  await mkdir(path.dirname(config.reportPath), { recursive: true })
  await writeFile(config.reportPath, report)
  await writeIndex(config, copiedMarkdown)

  return {
    copiedMarkdown,
    copiedAttachments,
    missingAttachments,
    sensitiveWarnings,
    skipped,
    removed,
  }
}

function resolveConfigPaths(config, configPath) {
  const baseDir = path.dirname(path.resolve(configPath))
  return {
    ...config,
    sourceVault: path.resolve(baseDir, config.sourceVault),
    contentDir: path.resolve(baseDir, config.contentDir),
    reportPath: path.resolve(baseDir, config.reportPath),
  }
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const configPath = process.argv[2] ?? path.join(root, "publish.config.json")
  const config = resolveConfigPaths(JSON.parse(await readFile(configPath, "utf8")), configPath)
  const result = await syncPublicNotes(config)

  console.log(`Copied ${result.copiedMarkdown.length} Markdown files.`)
  console.log(`Copied ${result.copiedAttachments.length} attachments.`)
  console.log(`Missing attachments: ${result.missingAttachments.length}.`)
  console.log(`Sensitive warnings: ${result.sensitiveWarnings.length}.`)
  console.log(`Removed ${result.removed.length} stale files.`)
  console.log(`Report: ${config.reportPath}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main()
}
