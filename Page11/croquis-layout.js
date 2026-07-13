/**
 * croquis-layout.js - Smart Adaptive Layout Layer for Page11
 * Enforces dynamic margins, centers the croquis, and ensures maximum space usage.
 * Directly called from the end of renderCroquis().
 */
function applySmartLayout() {
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

  // Calculate dynamic margins as a percentage of the largest dimension:
  // margin = max(25px, 3.5% of the largest dimension)
  // This guarantees the croquis fills 90-95% of the viewport and protects labels.
  const maxDim = Math.max(bbox.width, bbox.height);
  const margin = Math.max(25, maxDim * 0.035);

  const vbX = Math.round(bbox.x - margin);
  const vbY = Math.round(bbox.y - margin);
  const vbW = Math.round(bbox.width + margin * 2);
  const vbH = Math.round(bbox.height + margin * 2);

  // Update viewBox and preserveAspectRatio on the SVG element
  svgEl.setAttribute("viewBox", `${vbX} ${vbY} ${vbW} ${vbH}`);
  svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
  
  console.log(`croquis-layout: viewBox adjusted via applySmartLayout to [${vbX} ${vbY} ${vbW} ${vbH}]`);
}
