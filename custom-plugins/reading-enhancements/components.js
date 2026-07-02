import { h } from "preact"

export const readingEnhancementsScript = `
const setupReadingEnhancements = () => {
  const root = document.documentElement;
  if (root.dataset.readingEnhancementsBound === "true") return;
  root.dataset.readingEnhancementsBound = "true";
  window.addCleanup(() => {
    delete root.dataset.readingEnhancementsBound;
  });

  const backToTopButtons = Array.from(document.getElementsByClassName("back-to-top"));
  const updateBackToTop = () => {
    const isVisible = window.scrollY > Math.max(480, window.innerHeight * 0.65);
    for (const button of backToTopButtons) {
      button.classList.toggle("is-visible", isVisible);
      button.setAttribute("aria-hidden", isVisible ? "false" : "true");
    }
  };

  for (const button of backToTopButtons) {
    button.dataset.readingEnhancementsBound = "true";
    const onClick = () => window.scrollTo({ top: 0, behavior: "smooth" });
    button.addEventListener("click", onClick);
    window.addCleanup(() => {
      button.removeEventListener("click", onClick);
      delete button.dataset.readingEnhancementsBound;
    });
  }

  window.addEventListener("scroll", updateBackToTop, { passive: true });
  window.addCleanup(() => window.removeEventListener("scroll", updateBackToTop));
  updateBackToTop();

  const tocLinks = Array.from(document.querySelectorAll(".toc a[data-for]"));
  const headings = Array.from(
    document.querySelectorAll("article h1[id], article h2[id], article h3[id], article h4[id], article h5[id], article h6[id]")
  );
  const updateActiveToc = () => {
    if (tocLinks.length === 0 || headings.length === 0) return;

    let activeHeading = headings[0];
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top <= 128) {
        activeHeading = heading;
      } else {
        break;
      }
    }

    const activeId = activeHeading?.id ?? "";
    for (const link of tocLinks) {
      link.classList.toggle("is-active", link.getAttribute("data-for") === activeId);
    }
  };

  window.addEventListener("scroll", updateActiveToc, { passive: true });
  window.addCleanup(() => window.removeEventListener("scroll", updateActiveToc));
  updateActiveToc();

  const dialog = document.querySelector(".image-lightbox");
  if (!(dialog instanceof HTMLDialogElement)) return;

  const image = dialog.querySelector("img");
  const caption = dialog.querySelector(".image-lightbox-caption");
  const closeButton = dialog.querySelector(".image-lightbox-close");
  if (!(image instanceof HTMLImageElement) || !caption || !closeButton) return;

  const closeLightbox = () => {
    if (dialog.open) dialog.close();
    image.removeAttribute("src");
    image.removeAttribute("alt");
    caption.textContent = "";
  };

  const onDialogClick = (event) => {
    if (event.target === dialog) closeLightbox();
  };

  const onCloseClick = () => closeLightbox();

  dialog.dataset.readingEnhancementsBound = "true";
  closeButton.dataset.readingEnhancementsBound = "true";
  dialog.addEventListener("click", onDialogClick);
  closeButton.addEventListener("click", onCloseClick);
  window.addCleanup(() => {
    dialog.removeEventListener("click", onDialogClick);
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

    const openLightbox = () => {
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
      h(
        "button",
        {
          class: "back-to-top",
          type: "button",
          "aria-label": "返回顶部",
          "aria-hidden": "true",
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
