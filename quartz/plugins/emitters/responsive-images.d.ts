import type { Metadata } from "sharp"

export const defaultResponsiveCacheDir: string

export interface ResponsiveVariant {
  width: number
  cachePath: string
  outputPath: string
}

export interface ResponsiveImageResult {
  metadata: Metadata | undefined
  variants: ResponsiveVariant[]
}

export interface EnsureResponsiveVariantsOptions {
  sourcePath: string
  outputPath: string
  cacheDir?: string
  warn?: (message: string) => void
}

export function responsiveWidths(sourceWidth: number): number[]
export function responsivePath(fp: string, width: number): string
export function responsiveCachePath(sourceHash: string, width: number, cacheDir?: string): string
export function imageMetadata(sourcePath: string): Promise<Metadata>
export function ensureResponsiveVariants(
  options: EnsureResponsiveVariantsOptions,
): Promise<ResponsiveImageResult>
