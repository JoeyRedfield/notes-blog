# Responsive Image Ratio Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent article images with natural width and height attributes from stretching when constrained by the article width.

**Architecture:** Keep the responsive image metadata and generated WebP files unchanged. Add a narrowly scoped article-image CSS rule and protect it with an existing style regression test.

**Tech Stack:** SCSS, Node test runner.

---

### Task 1: Preserve Article Image Aspect Ratio

**Files:**

- Modify: `scripts/reading-enhancements.test.mjs`
- Modify: `quartz/styles/custom.scss`

- [x] **Step 1: Write the failing style regression test**

Extend the existing custom-style test to require the article image rule:

```js
assert.match(customStyles, /article\s+img\s*\{[^}]*height:\s*auto/s)
```

- [x] **Step 2: Run the test and verify RED**

Run: `npx tsx --test scripts/reading-enhancements.test.mjs`

Expected: FAIL because no article image rule sets `height: auto`.

- [x] **Step 3: Add the minimal style rule**

Add to `quartz/styles/custom.scss`:

```scss
article img {
  height: auto;
}
```

- [x] **Step 4: Run GREEN and regressions**

Run:

```bash
npx tsx --test scripts/reading-enhancements.test.mjs
npm test
npx tsc --noEmit
npx prettier scripts/reading-enhancements.test.mjs docs/superpowers/specs/2026-07-12-responsive-image-ratio-fix-design.md docs/superpowers/plans/2026-07-12-responsive-image-ratio-fix.md --check
git diff --check
```

Expected: all commands exit 0 and the full test suite reports no failures. `quartz/styles/custom.scss` retains pre-existing whole-file Prettier debt and is not bulk-formatted by this fix.

- [x] **Step 5: Commit**

```bash
git add scripts/reading-enhancements.test.mjs quartz/styles/custom.scss docs/superpowers/plans/2026-07-12-responsive-image-ratio-fix.md
git commit -m "fix: preserve responsive image aspect ratios"
```
