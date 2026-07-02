# Quartz Frontend Follow-Up Design

## Goal

Tighten the deployed frontend optimization by reducing first-load font cost, making the custom reading-enhancement script idempotent across Quartz SPA events, and applying small mobile reading polish without increasing upstream merge risk.

## Scope

- Generate and commit a subset WOFF2 for `LXGWWenKai-Regular.ttf` from the current published Markdown corpus plus common Chinese and Latin punctuation.
- Keep the full WOFF2 and TTF files as fallback assets. Do not delete files.
- Update `quartz/styles/custom.scss` so the subset font is preferred and the full font is only a fallback.
- Make `custom-plugins/reading-enhancements` safe when both `nav` and `render` events run on the same page.
- Add focused tests for font subset presence/size and reading-enhancement idempotency markers.
- Run local verification and deploy through the existing `v5` GitHub Pages workflow.

## Non-Goals

- No large visual redesign.
- No changes to Quartz core unless a bug cannot be fixed in the custom plugin or custom styles.
- No automatic notes sync in this pass.
- No deletion of existing font files.

## Risks

- The subset font is corpus-based, so future notes may use glyphs outside the subset. The full font remains in the CSS fallback stack for that case.
- The optional subset generation script depends on local Python `fontTools`; CI does not need it because the generated WOFF2 is committed.
- Reading-enhancement event cleanup must follow Quartz's `window.addCleanup` lifecycle and avoid duplicate listeners on first render.

## Verification

- `node scripts/font-subset.test.mjs`
- `node scripts/reading-enhancements.test.mjs`
- `npx prettier ... --check`
- `npx tsc --noEmit`
- `npx quartz build`
- GitHub Actions deploy workflow on `v5`
