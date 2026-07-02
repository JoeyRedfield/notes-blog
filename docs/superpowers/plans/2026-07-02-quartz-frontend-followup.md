# Quartz Frontend Follow-Up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce font load cost and harden the custom reading enhancements without broad Quartz core changes.

**Architecture:** Add one optional Node helper script that shells out to local `python3 -m fontTools.subset` to generate a committed WOFF2 subset. Keep runtime changes in `quartz/styles/custom.scss` and `custom-plugins/reading-enhancements`, with focused Node tests in `scripts/`.

**Tech Stack:** Quartz v5, Preact component plugin, SCSS, Node test runner, local Python fontTools for subset generation.

---

### Task 1: Font Subset Generation

**Files:**

- Create: `scripts/subset-lxgw-font.mjs`
- Create: `scripts/font-subset.test.mjs`
- Create generated asset: `quartz/static/fonts/LXGWWenKai-Regular.subset.woff2`
- Modify: `quartz/styles/custom.scss`

- [ ] Add a script that collects characters from `content/**/*.md`, `content/**/*.mdx`, and a fixed fallback character set.
- [ ] Generate `LXGWWenKai-Regular.subset.woff2` with local `python3 -m fontTools.subset`.
- [ ] Update CSS so `"LXGW WenKai Subset"` is first in the Chinese font stack.
- [ ] Add a test that verifies the subset file exists and is smaller than the full WOFF2.

### Task 2: Reading Enhancement Idempotency

**Files:**

- Modify: `custom-plugins/reading-enhancements/components.js`
- Modify: `scripts/reading-enhancements.test.mjs`

- [ ] Mark initialized controls and images with `data-reading-enhancements-bound`.
- [ ] Avoid adding duplicate event listeners when both `nav` and `render` fire for the same DOM.
- [ ] Add tests that assert the script contains the idempotency marker and cleanup usage.

### Task 3: Mobile Reading Polish

**Files:**

- Modify: `custom-plugins/reading-enhancements/components.js`
- Modify: `quartz/styles/custom.scss`

- [ ] Give the lightbox safer mobile padding and dimensions.
- [ ] Move the back-to-top button slightly above the browser bottom edge on mobile.
- [ ] Add bottom padding to the center column so the fixed button does not cover final content.

### Task 4: Verify, Commit, Push, Deploy

**Files:**

- All changed files.

- [ ] Run formatting checks.
- [ ] Run TypeScript checks.
- [ ] Run both focused Node tests.
- [ ] Run `npx quartz build`.
- [ ] Commit with a Chinese message.
- [ ] Push `v5`.
- [ ] Wait for the GitHub Pages workflow and confirm the live site serves the subset font.
