import { FilePath, joinSegments, slugifyFilePath } from "../../util/path"
import { QuartzEmitterPlugin, QuartzPageTypePluginInstance } from "../types"
import path from "path"
import fs from "fs"
import { glob } from "../../util/glob"
import { Argv, BuildCtx } from "../../util/ctx"
import { QuartzConfig } from "../../cfg"
import {
  createResponsivePathResolver,
  ensureResponsiveVariants,
  isResponsiveImagePath,
} from "./responsive-images.js"

export {
  imageMetadata,
  createResponsivePathResolver,
  isResponsiveImagePath,
  responsiveCachePath,
  responsivePath,
  responsiveWidths,
} from "./responsive-images.js"
export { ensureResponsiveVariants }

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

function assetSourcePaths(files: Iterable<FilePath>, excludeExtensions: Set<string>): FilePath[] {
  return [...new Set(files)].filter((fp) => {
    const ext = path.extname(fp)
    return ext !== ".md" && !excludeExtensions.has(ext)
  })
}

function assertUniqueAssetOutputPaths(files: Iterable<FilePath>) {
  const sourcesByOutput = new Map<string, FilePath[]>()
  for (const fp of [...new Set(files)].sort()) {
    const outputPath = slugifyFilePath(fp).toLowerCase()
    const sources = sourcesByOutput.get(outputPath) ?? []
    sources.push(fp)
    sourcesByOutput.set(outputPath, sources)
  }

  const collisions = [...sourcesByOutput.entries()]
    .filter(([, sources]) => sources.length > 1)
    .sort(([first], [second]) => first.localeCompare(second))
  if (collisions.length === 0) return

  const details = collisions
    .map(([outputPath, sources]) => `  ${outputPath}: ${sources.join(", ")}`)
    .join("\n")
  throw new Error(
    `Asset output path collision detected. Rename the conflicting source files:\n${details}`,
  )
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

type ResponsivePathResolver = (fp: string, width: number) => string

const copyResponsiveVariants = async function* (
  argv: Argv,
  fp: FilePath,
  resolveOutputPath: ResponsivePathResolver,
) {
  if (!isResponsiveImagePath(fp)) return

  const src = joinSegments(argv.directory, fp) as FilePath
  const outputPath = slugifyFilePath(fp)
  const { variants } = await ensureResponsiveVariants({
    sourcePath: src,
    outputPath,
    resolveOutputPath,
  })
  for (const variant of variants) {
    const dest = joinSegments(argv.output, variant.outputPath) as FilePath
    await fs.promises.mkdir(path.dirname(dest), { recursive: true })
    await fs.promises.copyFile(variant.cachePath, dest)
    yield dest
  }
}

const deleteResponsiveOutputs = async (
  argv: Argv,
  fp: FilePath,
  resolveOutputPath: ResponsivePathResolver,
) => {
  if (!isResponsiveImagePath(fp)) return

  const outputPath = slugifyFilePath(fp)
  for (const width of [720, 1440]) {
    const dest = joinSegments(argv.output, resolveOutputPath(outputPath, width)) as FilePath
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
      assertUniqueAssetOutputPaths(fps)
      const occupiedPaths = new Set(
        [...(ctx.allFiles ?? []), ...fps].map((fp) => slugifyFilePath(fp)),
      )
      const resolveOutputPath = createResponsivePathResolver(occupiedPaths)
      for (const fp of fps) {
        yield copyFile(ctx.argv, fp)
        yield* copyResponsiveVariants(ctx.argv, fp, resolveOutputPath)
      }
    },
    async *partialEmit(ctx, _content, _resources, changeEvents) {
      const excludeExtensions = getPageTypeExtensions(ctx)
      const currentFiles = new Set(ctx.allFiles ?? [])
      for (const event of changeEvents) {
        if (event.type === "delete") currentFiles.delete(event.path)
        else currentFiles.add(event.path)
      }
      assertUniqueAssetOutputPaths(assetSourcePaths(currentFiles, excludeExtensions))

      const previousFiles = new Set(currentFiles)
      for (const event of changeEvents) {
        if (event.type === "add") previousFiles.delete(event.path)
        else if (event.type === "delete") previousFiles.add(event.path)
      }

      const currentResolver = createResponsivePathResolver(
        [...currentFiles].map((fp) => slugifyFilePath(fp)),
      )
      const previousResolver = createResponsivePathResolver(
        [...previousFiles].map((fp) => slugifyFilePath(fp)),
      )
      const directlyChanged = new Set(changeEvents.map((event) => event.path))
      const affectedImages = new Set<FilePath>()
      const allImagePaths = new Set(
        [...previousFiles, ...currentFiles].filter(isResponsiveImagePath),
      )
      for (const fp of allImagePaths) {
        const outputPath = slugifyFilePath(fp)
        const mappingChanged = [720, 1440].some(
          (width) => previousResolver(outputPath, width) !== currentResolver(outputPath, width),
        )
        if (directlyChanged.has(fp) || mappingChanged) affectedImages.add(fp as FilePath)
      }

      for (const fp of [...affectedImages].sort()) {
        if (previousFiles.has(fp)) {
          await deleteResponsiveOutputs(ctx.argv, fp, previousResolver)
        }
      }

      const regeneratedImages = new Set<FilePath>()
      const orderedChangeEvents = [
        ...changeEvents.filter((event) => event.type === "delete"),
        ...changeEvents.filter((event) => event.type !== "delete"),
      ]
      for (const changeEvent of orderedChangeEvents) {
        const ext = path.extname(changeEvent.path)
        if (ext === ".md" || excludeExtensions.has(ext)) continue
        if (isResponsiveImagePath(changeEvent.path)) {
          if (changeEvent.type === "delete") {
            const name = slugifyFilePath(changeEvent.path)
            const dest = joinSegments(ctx.argv.output, name) as FilePath
            await fs.promises.unlink(dest)
          } else {
            yield copyFile(ctx.argv, changeEvent.path)
            yield* copyResponsiveVariants(ctx.argv, changeEvent.path, currentResolver)
            regeneratedImages.add(changeEvent.path)
          }
          continue
        }

        if (changeEvent.type === "add" || changeEvent.type === "change") {
          yield copyFile(ctx.argv, changeEvent.path)
        } else if (changeEvent.type === "delete") {
          const name = slugifyFilePath(changeEvent.path)
          const dest = joinSegments(ctx.argv.output, name) as FilePath
          await fs.promises.unlink(dest)
        }
      }

      for (const fp of [...affectedImages].sort()) {
        if (currentFiles.has(fp) && !regeneratedImages.has(fp)) {
          yield* copyResponsiveVariants(ctx.argv, fp, currentResolver)
        }
      }
    },
  }
}
