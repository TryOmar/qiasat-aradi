/**
 * croquis-layout.js - Smart Adaptive Layout Layer for Page11
 * Enforces dynamic margins, centers the croquis, and ensures maximum space usage.
 * Intercepts window.renderCroquis() to keep the original logic unchanged.
 */
(function() {
  const originalRenderCroquis = window.renderCroquis;
  if (typeof originalRenderCroquis !== 'function') {
    console.warn("croquis-layout: original renderCroquis not found.");
    return;
  }

  // Intercept renderCroquis
  window.renderCroquis = function() {
    // 1. Run the original renderer to draw all SVG elements
    originalRenderCroquis();

    // 2. Perform the Smart Adaptive Layout adjustments
    try {
      adjustSmartLayout();
    } catch (e) {
      console.error("Error in Smart Adaptive Layout:", e);
    }
  };

  function adjustSmartLayout() {
    // Only run if not exporting
    if (window.isExporting) {
      return;
    }

    const svgEl = document.getElementById("croquis-svg");
    const contentEl = document.getElementById("croquis-content");
    if (!svgEl || !contentEl) {
      return;
    }

    // Check if we have calculated pieces
    if (!window.calculatedPieces || window.calculatedPieces.length === 0) {
      return;
    }

    // Get bounding box of all drawn contents (segments, labels, badges, external lines)
    const bbox = contentEl.getBBox();
    if (bbox.width <= 0 || bbox.height <= 0) {
      return;
    }

    // Determine parent container width to adapt margins
    const container = document.getElementById("croquis-container");
    const parentW = container ? container.clientWidth || 700 : 700;

    // Dynamic padding: smaller on mobile (< 480px), comfortable on tablet/desktop
    const isMobile = parentW < 480;
    let paddingX = isMobile ? Math.max(18, bbox.width * 0.04) : Math.max(35, bbox.width * 0.06);
    let paddingY = isMobile ? Math.max(18, bbox.height * 0.04) : Math.max(35, bbox.height * 0.06);

    // Apply ceil and round to avoid subpixel rendering blur
    paddingX = Math.ceil(paddingX);
    paddingY = Math.ceil(paddingY);

    const vbX = Math.round(bbox.x - paddingX);
    const vbY = Math.round(bbox.y - paddingY);
    const vbW = Math.round(bbox.width + paddingX * 2);
    const vbH = Math.round(bbox.height + paddingY * 2);

    // Update viewBox and preserveAspectRatio on the SVG element
    svgEl.setAttribute("viewBox", `${vbX} ${vbY} ${vbW} ${vbH}`);
    svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
    
    console.log(`croquis-layout: viewBox updated dynamically to [${vbX} ${vbY} ${vbW} ${vbH}]`);
  }
})();
