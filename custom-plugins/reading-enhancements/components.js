import { h } from "preact"

export const readingEnhancementsScript = `
const setupReadingEnhancements = () => {
  const root = document.documentElement;
  if (root.dataset.readingEnhancementsBound === "true") return;
  root.dataset.readingEnhancementsBound = "true";
  window.addCleanup(() => {
    delete root.dataset.readingEnhancementsBound;
  });

  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const skipLinks = Array.from(document.querySelectorAll(".skip-to-content"));
  const skipLink = skipLinks[0];
  if (skipLink instanceof HTMLAnchorElement) {
    if (document.body.firstElementChild !== skipLink) {
      document.body.insertBefore(skipLink, document.body.firstElementChild);
    }

    for (const duplicate of skipLinks.slice(1)) {
      duplicate.remove();
    }

    const onSkipClick = () => {
      const target = document.getElementById("quartz-body");
      if (!(target instanceof HTMLElement)) return;

      target.setAttribute("tabindex", "-1");
      window.requestAnimationFrame(() => target.focus({ preventScroll: true }));
    };

    skipLink.addEventListener("click", onSkipClick);
    window.addCleanup(() => skipLink.removeEventListener("click", onSkipClick));
  }

  const removeInvalidExplorerAria = () => {
    for (const explorer of document.querySelectorAll(".explorer[aria-expanded]")) {
      explorer.removeAttribute("aria-expanded");
    }
  };

  removeInvalidExplorerAria();

  const explorerAriaObserver = new MutationObserver(removeInvalidExplorerAria);
  explorerAriaObserver.observe(document.body, {
    subtree: true,
    attributes: true,
    attributeFilter: ["aria-expanded"],
  });
  window.addCleanup(() => explorerAriaObserver.disconnect());

  const backToTopButtons = Array.from(document.getElementsByClassName("back-to-top"));
  const setBackToTopVisible = (isVisible) => {
    for (const button of backToTopButtons) {
      button.classList.toggle("is-visible", isVisible);
      button.setAttribute("aria-hidden", isVisible ? "false" : "true");
      button.tabIndex = isVisible ? 0 : -1;
    }
  };

  for (const button of backToTopButtons) {
    button.dataset.readingEnhancementsBound = "true";
    const onClick = () =>
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    button.addEventListener("click", onClick);
    window.addCleanup(() => {
      button.removeEventListener("click", onClick);
      delete button.dataset.readingEnhancementsBound;
    });
  }

  if (backToTopButtons.length > 0 && "IntersectionObserver" in window) {
    const backToTopThreshold = Math.max(480, window.innerHeight * 0.65);
    const backToTopSentinel = document.createElement("span");
    backToTopSentinel.className = "back-to-top-sentinel";
    backToTopSentinel.setAttribute("aria-hidden", "true");
    backToTopSentinel.style.cssText = \`position:absolute;top:\${backToTopThreshold}px;width:1px;height:1px;pointer-events:none;\`;
    document.body.appendChild(backToTopSentinel);

    const backToTopObserver = new IntersectionObserver(([entry]) => {
      setBackToTopVisible(!entry.isIntersecting);
    });
    backToTopObserver.observe(backToTopSentinel);
    window.addCleanup(() => {
      backToTopObserver.disconnect();
      backToTopSentinel.remove();
    });
  } else {
    setBackToTopVisible(false);
  }

  const tocLinks = Array.from(document.querySelectorAll(".toc a[data-for]"));
  const headings = Array.from(
    document.querySelectorAll("article h1[id], article h2[id], article h3[id], article h4[id], article h5[id], article h6[id]")
  );
  const setActiveToc = (activeId) => {
    for (const link of tocLinks) {
      link.classList.toggle("is-active", link.getAttribute("data-for") === activeId);
    }
  };

  if (tocLinks.length > 0 && headings.length > 0 && "IntersectionObserver" in window) {
    let activeTocFrame = 0;

    const updateActiveToc = () => {
      const activeOffset = window.scrollY + 128;
      let activeHeadingId = headings[0].id;

      for (const heading of headings) {
        if (heading.offsetTop <= activeOffset) {
          activeHeadingId = heading.id;
        } else {
          break;
        }
      }

      setActiveToc(activeHeadingId);
    };

    const queueActiveTocUpdate = () => {
      if (activeTocFrame !== 0) return;

      activeTocFrame = window.requestAnimationFrame(() => {
        activeTocFrame = 0;
        updateActiveToc();
      });
    };

    const tocObserver = new IntersectionObserver(queueActiveTocUpdate, {
      rootMargin: "0px 0px -80% 0px",
    });

    for (const heading of headings) {
      tocObserver.observe(heading);
    }

    updateActiveToc();
    window.addCleanup(() => {
      tocObserver.disconnect();
      if (activeTocFrame !== 0) window.cancelAnimationFrame(activeTocFrame);
    });
  }

  const dialog = document.querySelector(".image-lightbox");
  if (!(dialog instanceof HTMLDialogElement)) return;

  const image = dialog.querySelector("img");
  const caption = dialog.querySelector(".image-lightbox-caption");
  const closeButton = dialog.querySelector(".image-lightbox-close");
  if (!(image instanceof HTMLImageElement) || !caption || !closeButton) return;

  let lastLightboxTrigger = null;

  const restoreLightboxFocus = () => {
    const trigger = lastLightboxTrigger;
    lastLightboxTrigger = null;
    if (!(trigger instanceof HTMLElement) || !document.contains(trigger)) return;

    window.requestAnimationFrame(() => trigger.focus());
  };

  const resetLightbox = () => {
    image.removeAttribute("src");
    image.removeAttribute("alt");
    caption.textContent = "";
    restoreLightboxFocus();
  };

  const closeLightbox = () => {
    if (dialog.open) dialog.close();
    else resetLightbox();
  };

  const onDialogClick = (event) => {
    if (event.target === dialog) closeLightbox();
  };

  const onCloseClick = () => closeLightbox();
  const onDialogClose = () => resetLightbox();

  dialog.dataset.readingEnhancementsBound = "true";
  closeButton.dataset.readingEnhancementsBound = "true";
  dialog.addEventListener("click", onDialogClick);
  dialog.addEventListener("close", onDialogClose);
  closeButton.addEventListener("click", onCloseClick);
  window.addCleanup(() => {
    dialog.removeEventListener("click", onDialogClick);
    dialog.removeEventListener("close", onDialogClose);
    closeButton.removeEventListener("click", onCloseClick);
    delete dialog.dataset.readingEnhancementsBound;
    delete closeButton.dataset.readingEnhancementsBound;
  });

  const articleImages = Array.from(document.querySelectorAll("article img"))
    .filter((img) => !img.closest("a") && !img.closest(".image-lightbox"));

  for (const img of articleImages) {
    if (img.dataset.readingEnhancementsBound === "true") continue;
    img.dataset.readingEnhancementsBound = "true";
    img.classList.add("is-lightboxable");
    img.setAttribute("tabindex", "0");
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", img.alt ? \`放大图片：\${img.alt}\` : "放大图片");

    const openLightbox = () => {
      lastLightboxTrigger = img;
      image.src = img.currentSrc || img.src;
      image.alt = img.alt || "";
      caption.textContent = img.alt || img.getAttribute("title") || "";
      if (!dialog.open) dialog.showModal();
    };

    const onKeydown = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox();
      }
    };

    img.addEventListener("click", openLightbox);
    img.addEventListener("keydown", onKeydown);
    window.addCleanup(() => {
      img.removeEventListener("click", openLightbox);
      img.removeEventListener("keydown", onKeydown);
      delete img.dataset.readingEnhancementsBound;
      img.removeAttribute("aria-label");
    });
  }
};

document.addEventListener("nav", setupReadingEnhancements);
document.addEventListener("render", setupReadingEnhancements);
`

const readingEnhancementsCss = `
.reading-enhancements {
  display: contents;
}

.skip-to-content {
  position: fixed;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 1000;
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  background: var(--paper-raised);
  color: var(--accent);
  box-shadow: var(--shadow-near);
  font-weight: 600;
  text-decoration: none;
  transform: translateY(-200%);
  transition: transform 0.18s ease, background 0.18s ease;
}

.skip-to-content:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  transform: translateY(0);
}

.back-to-top {
  position: fixed;
  right: max(1rem, calc((100vw - var(--page-max)) / 2 + 1rem));
  bottom: 1rem;
  z-index: 20;
  width: 2.55rem;
  height: 2.55rem;
  display: inline-grid;
  place-items: center;
  border: 1px solid var(--hairline);
  border-radius: 999px;
  background: color-mix(in srgb, var(--paper-raised) 92%, transparent);
  color: var(--ink);
  box-shadow: var(--shadow-near);
  opacity: 0;
  transform: translateY(0.5rem);
  pointer-events: none;
  transition: opacity 0.18s ease, transform 0.18s ease, background 0.18s ease;
}

.back-to-top.is-visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.back-to-top:hover,
.back-to-top:focus-visible {
  background: color-mix(in srgb, var(--accent) 12%, var(--paper-raised));
  color: var(--accent);
}

.back-to-top svg {
  width: 1.15rem;
  height: 1.15rem;
}

article img.is-lightboxable {
  cursor: zoom-in;
}

article img.is-lightboxable:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
}

.image-lightbox {
  width: min(94vw, 1120px);
  max-width: 94vw;
  max-height: 92vh;
  padding: 0;
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  background: var(--paper-raised);
  color: var(--ink);
  box-shadow: var(--shadow-far);
}

.image-lightbox::backdrop {
  background: color-mix(in srgb, black 64%, transparent);
  backdrop-filter: blur(5px);
}

.image-lightbox-inner {
  position: relative;
  display: grid;
  gap: 0.65rem;
  padding: 0.85rem;
}

.image-lightbox img {
  display: block;
  max-width: 100%;
  max-height: calc(92vh - 5rem);
  margin: 0 auto;
  border-radius: calc(var(--radius-md) - 2px);
  box-shadow: none;
}

.image-lightbox-caption {
  margin: 0;
  min-height: 1.2em;
  color: var(--gray);
  font-size: 0.86rem;
  text-align: center;
}

.image-lightbox-close {
  position: absolute;
  top: 0.7rem;
  right: 0.7rem;
  width: 2rem;
  height: 2rem;
  display: inline-grid;
  place-items: center;
  border: 1px solid var(--hairline);
  border-radius: 999px;
  background: color-mix(in srgb, var(--paper-raised) 88%, transparent);
  color: var(--ink);
  cursor: pointer;
}

.image-lightbox-close:hover,
.image-lightbox-close:focus-visible {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, var(--paper-raised));
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .skip-to-content,
  .back-to-top {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}

@media (max-width: 800px) {
  .back-to-top {
    right: 0.85rem;
    bottom: calc(env(safe-area-inset-bottom, 0px) + 1.15rem);
  }

  .image-lightbox {
    width: calc(100vw - 1.25rem);
    max-width: calc(100vw - 1.25rem);
    max-height: calc(100dvh - 1.25rem);
  }

  .image-lightbox-inner {
    padding: 0.7rem;
  }

  .image-lightbox img {
    max-height: calc(100dvh - 5.5rem);
  }
}
`

export function ReadingEnhancements() {
  const Component = () => {
    return h("div", { class: "reading-enhancements" }, [
      h("a", { class: "skip-to-content", href: "#quartz-body" }, "跳转到正文"),
      h(
        "button",
        {
          class: "back-to-top",
          type: "button",
          "aria-label": "返回顶部",
          "aria-hidden": "true",
          tabindex: "-1",
        },
        h(
          "svg",
          {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            "stroke-width": "2",
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "aria-hidden": "true",
          },
          [h("path", { d: "m18 15-6-6-6 6" })],
        ),
      ),
      h("dialog", { class: "image-lightbox", "aria-label": "图片预览" }, [
        h("div", { class: "image-lightbox-inner" }, [
          h(
            "button",
            { class: "image-lightbox-close", type: "button", "aria-label": "关闭图片预览" },
            "×",
          ),
          h("img", { alt: "" }),
          h("p", { class: "image-lightbox-caption" }),
        ]),
      ]),
    ])
  }

  Component.css = readingEnhancementsCss
  Component.afterDOMLoaded = readingEnhancementsScript

  return Component
}
