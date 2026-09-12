/* Resizable desktop divider for the Minecraft item picker. */
(() => {
  "use strict";

  const STORAGE_KEY = "zmenu-items-panel-width-v2";
  const COLLAPSED_STORAGE_KEY = "zmenu-items-panel-collapsed";
  const DEFAULT_WIDTH = 450;
  const MIN_WIDTH = 180;
  const MAX_WIDTH = 450;
  const MIN_EDITOR_WIDTH = 470;
  const desktopMedia = window.matchMedia("(min-width: 721px)");

  const readSavedWidth = () => {
    try {
      const width = Number.parseInt(window.localStorage.getItem(STORAGE_KEY), 10);
      return Number.isFinite(width) ? width : null;
    } catch {
      return null;
    }
  };

  const saveWidth = width => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(width));
    } catch {
      // Resizing still works when storage is blocked by the browser.
    }
  };

  const readCollapsed = () => {
    try {
      return window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  };

  const saveCollapsed = collapsed => {
    try {
      window.localStorage.setItem(COLLAPSED_STORAGE_KEY, String(collapsed));
    } catch {
      // The collapse control still works when storage is unavailable.
    }
  };

  const clampWidth = (width, container) => {
    const available = container.getBoundingClientRect().width - MIN_EDITOR_WIDTH;
    return Math.round(Math.max(MIN_WIDTH, Math.min(width, MAX_WIDTH, available)));
  };

  const applyWidth = (panel, container, width) => {
    const nextWidth = clampWidth(width, container);
    panel.style.flexBasis = `${nextWidth}px`;
    panel.style.width = `${nextWidth}px`;
    return nextWidth;
  };

  const installHandle = () => {
    const panel = document.querySelector("#builder .sidebar.bv2-items-panel");
    if (!panel || panel.dataset.resizeReady === "true") return;

    const container = panel.parentElement;
    const editor = panel.nextElementSibling;
    if (!container || !editor) return;

    const handle = document.createElement("div");
    handle.className = "bv2-items-resize-handle";
    handle.setAttribute("role", "separator");
    handle.setAttribute("aria-label", "Resize item panel");
    handle.setAttribute("aria-orientation", "vertical");
    handle.tabIndex = 0;
    // Keep the resize handle over the panel edge so it does not consume a
    // separate flex column between the item picker and the editor stage.
    panel.append(handle);
    panel.dataset.resizeReady = "true";

    const collapseButton = document.createElement("button");
    collapseButton.type = "button";
    collapseButton.className = "workspace-collapse-btn workspace-collapse-btn-left";
    panel.id = "zmenu-items-panel";
    collapseButton.setAttribute("aria-controls", panel.id);
    editor.prepend(collapseButton);

    const setCollapsed = (collapsed, persist = true) => {
      const isCollapsed = Boolean(collapsed) && desktopMedia.matches;
      container.classList.toggle("bv2-items-panel-collapsed", isCollapsed);
      collapseButton.classList.toggle("is-collapsed", isCollapsed);
      collapseButton.setAttribute("aria-expanded", String(!isCollapsed));
      const label = isCollapsed ? "Open items panel" : "Close items panel";
      collapseButton.setAttribute("aria-label", label);
      collapseButton.title = label;
      collapseButton.innerHTML = isCollapsed
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      if (persist) saveCollapsed(isCollapsed);
    };

    if (desktopMedia.matches) {
      applyWidth(panel, container, readSavedWidth() ?? DEFAULT_WIDTH);
      // The editor is rendered dynamically. Re-apply after its flex layout
      // settles so the first measurement cannot clamp the panel to 180px.
      window.requestAnimationFrame(() => {
        if (desktopMedia.matches) {
          applyWidth(panel, container, readSavedWidth() ?? DEFAULT_WIDTH);
        }
      });
    }
    setCollapsed(readCollapsed(), false);

    let pointerId = null;
    let startX = 0;
    let startWidth = 0;

    const finishDrag = () => {
      if (pointerId === null) return;
      try {
        handle.releasePointerCapture(pointerId);
      } catch {
        // Pointer capture may already be released by the browser.
      }
      pointerId = null;
      document.body.classList.remove("bv2-items-resizing");
      saveWidth(Math.round(panel.getBoundingClientRect().width));
    };

    handle.addEventListener("pointerdown", event => {
      if (!desktopMedia.matches || event.button !== 0) return;
      event.preventDefault();
      pointerId = event.pointerId;
      startX = event.clientX;
      startWidth = panel.getBoundingClientRect().width;
      handle.setPointerCapture(pointerId);
      document.body.classList.add("bv2-items-resizing");
    });

    collapseButton.addEventListener("click", event => {
      event.stopPropagation();
      setCollapsed(!container.classList.contains("bv2-items-panel-collapsed"));
    });

    const moveDrag = event => {
      if (pointerId === null) return;
      if (event.type.startsWith("pointer") && event.pointerId !== pointerId) return;
      applyWidth(panel, container, startWidth + event.clientX - startX);
    };

    handle.addEventListener("pointermove", moveDrag);
    handle.addEventListener("pointerup", finishDrag);
    handle.addEventListener("pointercancel", finishDrag);
    window.addEventListener("pointermove", moveDrag);
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
    window.addEventListener("mousemove", moveDrag);
    window.addEventListener("mouseup", finishDrag);

    handle.addEventListener("keydown", event => {
      if (!desktopMedia.matches) return;
      const step = event.shiftKey ? 36 : 18;
      const width = panel.getBoundingClientRect().width;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        saveWidth(applyWidth(panel, container, width - step));
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        saveWidth(applyWidth(panel, container, width + step));
      }
    });

    desktopMedia.addEventListener("change", event => {
      if (event.matches) {
        applyWidth(panel, container, readSavedWidth() ?? DEFAULT_WIDTH);
        setCollapsed(readCollapsed(), false);
      } else {
        panel.style.removeProperty("flex-basis");
        panel.style.removeProperty("width");
        setCollapsed(false, false);
        finishDrag();
      }
    });

    window.addEventListener("resize", () => {
      if (desktopMedia.matches) {
        applyWidth(panel, container, panel.getBoundingClientRect().width);
      }
    });
  };

  const observer = new MutationObserver(installHandle);
  observer.observe(document.getElementById("builder"), { childList: true, subtree: true });
  installHandle();
})();
