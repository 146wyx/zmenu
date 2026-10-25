/* Resizable desktop divider for the Minecraft item picker. */
(() => {
  "use strict";

  const STORAGE_KEY = "zmenu-items-panel-width-v3";
  const COLLAPSED_STORAGE_KEY = "zmenu-items-panel-collapsed";
  const DEFAULT_WIDTH = 260;
  const MIN_WIDTH = 180;
  const MAX_WIDTH = 450;

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

  const clampWidth = width => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width));

  const applyWidth = (panel, width) => {
    const nextWidth = clampWidth(width);
    panel.style.flexBasis = `${nextWidth}px`;
    panel.style.width = `${nextWidth}px`;
    return nextWidth;
  };

  const installHandle = () => {
    const panel = document.querySelector("#inventory-editor .workspace-pane.workspace-pane-left");
    if (!panel || panel.dataset.resizeReady === "true") return;

    panel.classList.add("workspace-pane", "workspace-pane-left");

    const container = panel.parentElement;
    const stage = panel.nextElementSibling;
    if (!container || !stage?.matches(".workspace-stage-area")) return;
    const collapseButton = stage.querySelector(":scope > .workspace-collapse-btn-left");
    if (!collapseButton) return;

    const handle = document.createElement("div");
    handle.className = "bv2-resize-handle";
    handle.setAttribute("role", "separator");
    handle.setAttribute("aria-label", "Resize item panel");
    handle.setAttribute("aria-orientation", "vertical");
    handle.tabIndex = 0;
    // Keep the resize handle over the panel edge so it does not consume a
    // separate flex column between the item picker and the editor stage.
    panel.append(handle);
    panel.dataset.resizeReady = "true";

    panel.id = "zmenu-items-panel";
    collapseButton.setAttribute("aria-controls", panel.id);

    const setCollapsed = (collapsed, persist = true) => {
      const isCollapsed = Boolean(collapsed);
      container.classList.toggle("bv2-items-panel-collapsed", isCollapsed);
      handle.hidden = isCollapsed;
      collapseButton.classList.toggle("is-collapsed", isCollapsed);
      collapseButton.setAttribute("aria-expanded", String(!isCollapsed));
      const label = isCollapsed ? "Open items panel" : "Close items panel";
      collapseButton.setAttribute("aria-label", label);
      collapseButton.title = label;
      collapseButton.querySelector("svg path")?.setAttribute("d",
        isCollapsed ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6");
      if (persist) saveCollapsed(isCollapsed);
    };

    applyWidth(panel, readSavedWidth() ?? DEFAULT_WIDTH);
    setCollapsed(readCollapsed(), false);

    let resizing = false;
    let startX = 0;
    let startWidth = 0;

    const moveDrag = event => {
      if (!resizing) return;
      applyWidth(panel, startWidth + event.clientX - startX);
    };

    const finishDrag = () => {
      if (!resizing) return;
      resizing = false;
      document.removeEventListener("mousemove", moveDrag);
      document.removeEventListener("mouseup", finishDrag);
      window.removeEventListener("blur", finishDrag);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      saveWidth(Math.round(panel.getBoundingClientRect().width));
    };

    handle.addEventListener("mousedown", event => {
      if (event.button !== 0) return;
      event.preventDefault();
      resizing = true;
      startX = event.clientX;
      startWidth = panel.getBoundingClientRect().width;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", moveDrag);
      document.addEventListener("mouseup", finishDrag);
      window.addEventListener("blur", finishDrag);
    });

    collapseButton.addEventListener("click", event => {
      event.stopPropagation();
      setCollapsed(!container.classList.contains("bv2-items-panel-collapsed"));
    });

    handle.addEventListener("keydown", event => {
      const step = event.shiftKey ? 36 : 18;
      const width = panel.getBoundingClientRect().width;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        saveWidth(applyWidth(panel, width - step));
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        saveWidth(applyWidth(panel, width + step));
      }
    });

    window.addEventListener("resize", () => {
      applyWidth(panel, panel.getBoundingClientRect().width);
    });
  };

  const observer = new MutationObserver(installHandle);
  observer.observe(document.getElementById("inventory-editor"), { childList: true, subtree: true });
  installHandle();
})();
