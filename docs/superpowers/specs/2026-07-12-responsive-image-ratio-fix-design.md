# Responsive Image Ratio Fix Design

## Problem

The responsive image enhancement writes natural `width` and `height` attributes to article images to reserve layout space. The global image rule limits width with `max-width: 100%` but does not reset height. When the container is narrower than the natural width, the browser clamps only the width and retains the attribute-derived height, stretching the image vertically.

The generated source and WebP files retain the correct aspect ratio, so image conversion must not change.

## Design

Add `height: auto` to images rendered inside article content. Keep natural `width` and `height`, `srcset`, and `sizes` unchanged. Scope the rule to article images so unrelated UI imagery is unaffected.

## Verification

- Add a style regression test that requires article images to combine `max-width: 100%` with `height: auto`.
- Confirm the test fails before the style change and passes afterward.
- Run the complete test suite, TypeScript checking, scoped Prettier, and `git diff --check`.
