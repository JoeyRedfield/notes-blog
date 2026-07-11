import { FilePath, joinSegments, slugifyFilePath } from "../../util/path"
import { QuartzEmitterPlugin, QuartzPageTypePluginInstance } from "../types"
import path from "path"
import fs from "fs"
import { glob } from "../../util/glob"
import { Argv, BuildCtx } from "../../util/ctx"
import { QuartzConfig } from "../../cfg"
import { ensureResponsiveVariants, responsivePath } from "./responsive-images.js"

export {
  imageMetadata,
  responsiveCachePath,
  responsivePath,
  responsiveWidths,
} from "./responsive-images.js"
export { ensureResponsiveVariants }

const RESPONSIVE_IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"])

function getPageTypeExtensions(ctx: BuildCtx): Set<string> {
  const extensions = new Set<string>()
  const pageTypes = (ctx.cfg.plugins.pageTypes ?? []) as unknown as QuartzPageTypePluginInstance[]
  for (const pt of pageTypes) {
    if (pt.fileExtensions) {
      for (const ext of pt.fileExtensions) {
        extensions.add(ext)
      }
    }
  }
  return extensions
}

const filesToCopy = async (argv: Argv, cfg: QuartzConfig, excludeExtensions: Set<string>) => {
  const excludePatterns = ["**/*.md", ...cfg.configuration.ignorePatterns]
  for (const ext of excludeExtensions) {
    excludePatterns.push(`**/*${ext}`)
  }
  return await glob("**", argv.directory, excludePatterns)
}

const copyFile = async (argv: Argv, fp: FilePath) => {
  const src = joinSegments(argv.directory, fp) as FilePath

  const name = slugifyFilePath(fp)
  const dest = joinSegments(argv.output, name) as FilePath

  const dir = path.dirname(dest) as FilePath
  await fs.promises.mkdir(dir, { recursive: true })

  await fs.promises.copyFile(src, dest)
  return dest
}

const copyResponsiveVariants = async function* (argv: Argv, fp: FilePath) {
  if (!RESPONSIVE_IMAGE_EXTENSIONS.has(path.extname(fp).toLowerCase())) return

  const src = joinSegments(argv.directory, fp) as FilePath
  const outputPath = slugifyFilePath(fp)
  const { variants } = await ensureResponsiveVariants({ sourcePath: src, outputPath })
  for (const variant of variants) {
    const dest = joinSegments(argv.output, variant.outputPath) as FilePath
    await fs.promises.mkdir(path.dirname(dest), { recursive: true })
    await fs.promises.copyFile(variant.cachePath, dest)
    yield dest
  }
}

const deleteResponsiveOutputs = async (argv: Argv, fp: FilePath) => {
  if (!RESPONSIVE_IMAGE_EXTENSIONS.has(path.extname(fp).toLowerCase())) return

  const outputPath = slugifyFilePath(fp)
  for (const width of [720, 1440]) {
    const dest = joinSegments(argv.output, responsivePath(outputPath, width)) as FilePath
    await fs.promises.unlink(dest).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error
    })
  }
}

export const Assets: QuartzEmitterPlugin = () => {
  return {
    name: "Assets",
    async *emit(ctx) {
      const excludeExtensions = getPageTypeExtensions(ctx)
      const fps = await filesToCopy(ctx.argv, ctx.cfg, excludeExtensions)
      for (const fp of fps) {
        yield copyFile(ctx.argv, fp)
        yield* copyResponsiveVariants(ctx.argv, fp)
      }
    },
    async *partialEmit(ctx, _content, _resources, changeEvents) {
      const excludeExtensions = getPageTypeExtensions(ctx)
      for (const changeEvent of changeEvents) {
        const ext = path.extname(changeEvent.path)
        if (ext === ".md" || excludeExtensions.has(ext)) continue

        if (changeEvent.type === "add" || changeEvent.type === "change") {
          await deleteResponsiveOutputs(ctx.argv, changeEvent.path)
          yield copyFile(ctx.argv, changeEvent.path)
          yield* copyResponsiveVariants(ctx.argv, changeEvent.path)
        } else if (changeEvent.type === "delete") {
          const name = slugifyFilePath(changeEvent.path)
          const dest = joinSegments(ctx.argv.output, name) as FilePath
          await fs.promises.unlink(dest)
          await deleteResponsiveOutputs(ctx.argv, changeEvent.path)
        }
      }
    },
  }
}
