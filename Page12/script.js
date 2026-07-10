// Arabic/Eastern digits converter and parser helper
function parseArabicFloat(str) {
  if (!str) return 0;
  const converted = str.toString()
                       .replace(/[٠-٩]/g, d => d.charCodeAt(0) - 1632)
                       .replace(/[۰-۹]/g, d => d.charCodeAt(0) - 1776);
  const clean = converted.replace(/٫/g, '.').replace(/,/g, '.').trim();
  return parseFloat(clean) || 0;
}

let lastActionTime = 0;
function preventDoubleTap() {
  const now = Date.now();
  if (now - lastActionTime < 300) {
    return true;
  }
  lastActionTime = now;
  return false;
}

// Graphics State
let shapes = [];
let borderLabels = [];
let splitLines = [];
let freeTexts = [];
let waterways = [];

// Selected & Panning State
let selectedElement = null; // { type: 'shape'|'borderLabel'|'splitLine'|'freeText'|'waterway', id: string }
let activeDrag = null; // { type: 'freeText'|'borderLabel'|'splitLineLabel'|'splitLineEnd'|'shapeText', id: string, index?: number, offset: {x, y} }

// SVG Viewport Pan/Zoom variables
let zoomScale = 1.0;
let panX = 0;
let panY = 0;
let isPanning = false;
let startPanPoint = { x: 0, y: 0 };
let lastTouchDist = 0; // For pinch to zoom
let isCroquiPinned = true;

// Active Template Tracker
let activeTemplateType = 'rectangle';

// Undo / Redo Stack State
let undoStack = [];
let redoStack = [];
let saveStateTimeout = null;

// Smart Area Tabs
let activeSmartAreaTab = 'sqm';
let showFeddanConversion = localStorage.getItem("dallal_show_feddan") === "true";
let caratSize = parseFloat(localStorage.getItem("dallal_carat_size")) || 168;

// Color Palette for Shapes
const colorsList = [
  { name: "أبيض", value: "#ffffff" },
  { name: "أخضر خفيف", value: "#f1f8e9" },
  { name: "أزرق خفيف", value: "#e3f2fd" },
  { name: "أصفر خفيف", value: "#fffde7" },
  { name: "برتقالي خفيف", value: "#fff3e0" },
  { name: "أحمر خفيف", value: "#ffebee" }
];

// Document Load Initializer
document.addEventListener("DOMContentLoaded", function () {
  const svg = document.getElementById("dallalSvg");

  const savedStateStr = localStorage.getItem("dallal_autosave");
  if (savedStateStr) {
    try {
      const state = JSON.parse(savedStateStr);
      shapes = state.shapes || [];
      borderLabels = state.borderLabels || [];
      splitLines = state.splitLines || [];
      freeTexts = state.freeTexts || [];
      waterways = state.waterways || [];
      zoomScale = state.zoomScale || 1.0;
      panX = state.panX || 0;
      panY = state.panY || 0;
      activeTemplateType = state.activeTemplateType || 'rectangle';
      
      if (state.inputs) {
        if (document.getElementById("start-w1")) document.getElementById("start-w1").value = state.inputs.w1;
        if (document.getElementById("start-w1-dir")) document.getElementById("start-w1-dir").value = state.inputs.w1Dir;
        if (document.getElementById("start-w2")) document.getElementById("start-w2").value = state.inputs.w2;
        if (document.getElementById("start-w2-dir")) document.getElementById("start-w2-dir").value = state.inputs.w2Dir;
        if (document.getElementById("start-l2")) document.getElementById("start-l2").value = state.inputs.l2;
        if (document.getElementById("start-l2-dir")) document.getElementById("start-l2-dir").value = state.inputs.l2Dir;
        if (document.getElementById("start-l1")) document.getElementById("start-l1").value = state.inputs.l1;
        if (document.getElementById("start-l1-dir")) document.getElementById("start-l1-dir").value = state.inputs.l1Dir;
        if (document.getElementById("start-d1")) document.getElementById("start-d1").value = state.inputs.d1;
        if (document.getElementById("start-d2")) document.getElementById("start-d2").value = state.inputs.d2;
        if (document.getElementById("start-partners")) document.getElementById("start-partners").value = state.inputs.partners;
      }

      applyViewportTransform();
      renderSVG();
      
      undoStack.push(JSON.parse(JSON.stringify(state)));
      updateUndoRedoButtons();

      const diagContainer = document.getElementById("diagonalsContainer");
      if (diagContainer && activeTemplateType === 'quad_diagonal') {
        diagContainer.style.display = 'block';
      }

      openStartModal(true);
    } catch (e) {
      console.error(e);
      openStartModal();
      loadDemoDataPreset(false);
    }
  } else {
    openStartModal();
    loadDemoDataPreset(false);
  }

  // Mouse & Touch events on SVG for panning and dragging
  svg.addEventListener("mousedown", onSvgMouseDown);
  svg.addEventListener("mousemove", onSvgMouseMove);
  window.addEventListener("mouseup", onSvgMouseUp);
  
  svg.addEventListener("touchstart", onSvgTouchStart, { passive: false });
  svg.addEventListener("touchmove", onSvgTouchMove, { passive: false });
  svg.addEventListener("touchend", onSvgTouchUp, { passive: false });

  // Double click on empty space to zoom in/out, or add text
  svg.addEventListener("dblclick", onSvgDoubleClick);
  
  // Wheel zoom support
  svg.addEventListener("wheel", onSvgWheel, { passive: false });

  // Close modals when clicking outside
  window.onclick = function (event) {
    const editModal = document.getElementById("editModal");
    const startModal = document.getElementById("startModal");
    const addDataModal = document.getElementById("addDataModal");
    const smartAreaModal = document.getElementById("smartAreaModal");
    if (event.target === editModal) closeModal();
    if (event.target === startModal) closeStartModal();
    if (event.target === addDataModal) closeAddDataModal();
    if (event.target === smartAreaModal) closeSmartAreaModal();
  };

  // Keyboard support: delete selected element with "Delete" key
  window.addEventListener("keydown", function(e) {
    if (e.key === "Delete" || e.key === "Backspace") {
      if (document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
        deleteSelectedElement();
      }
    }
  });

  updateUndoRedoButtons();
});

// ----------------------------------------------------
// State & Project Serialization
// ----------------------------------------------------
function saveState() {
  const state = {
    shapes: JSON.parse(JSON.stringify(shapes)),
    borderLabels: JSON.parse(JSON.stringify(borderLabels)),
    splitLines: JSON.parse(JSON.stringify(splitLines)),
    freeTexts: JSON.parse(JSON.stringify(freeTexts)),
    waterways: JSON.parse(JSON.stringify(waterways)),
    zoomScale: zoomScale,
    panX: panX,
    panY: panY,
    activeTemplateType: activeTemplateType,
    customPartnerWidths: customPartnerWidths ? JSON.parse(JSON.stringify(customPartnerWidths)) : null,
    customWaterwayData: customWaterwayData ? JSON.parse(JSON.stringify(customWaterwayData)) : null
  };

  if (undoStack.length > 0) {
    const prevState = undoStack[undoStack.length - 1];
    if (JSON.stringify(prevState) === JSON.stringify(state)) {
      return;
    }
  }

  undoStack.push(state);
  redoStack = []; // Clear redo
  updateUndoRedoButtons();
  if (typeof autoSaveCurrentState === "function") autoSaveCurrentState();
}

function saveStateDebounced() {
  if (saveStateTimeout) clearTimeout(saveStateTimeout);
  saveStateTimeout = setTimeout(() => {
    saveState();
  }, 400);
}

function updateUndoRedoButtons() {
  const undoBtn = document.getElementById("undoBtn");
  const redoBtn = document.getElementById("redoBtn");
  if (undoBtn) undoBtn.disabled = (undoStack.length <= 1);
  if (redoBtn) redoBtn.disabled = (redoStack.length === 0);
}

function undo() {
  if (undoStack.length <= 1) return;
  const currentState = undoStack.pop();
  redoStack.push(currentState);

  const prevState = undoStack[undoStack.length - 1];
  restoreState(prevState);
  updateUndoRedoButtons();
}

function redo() {
  if (redoStack.length === 0) return;
  const nextState = redoStack.pop();
  undoStack.push(nextState);

  restoreState(nextState);
  updateUndoRedoButtons();
}

function restoreState(state) {
  shapes = JSON.parse(JSON.stringify(state.shapes));
  borderLabels = JSON.parse(JSON.stringify(state.borderLabels));
  splitLines = JSON.parse(JSON.stringify(state.splitLines));
  freeTexts = JSON.parse(JSON.stringify(state.freeTexts));
  waterways = JSON.parse(JSON.stringify(state.waterways));
  zoomScale = state.zoomScale || 1.0;
  panX = state.panX || 0;
  panY = state.panY || 0;
  activeTemplateType = state.activeTemplateType || 'rectangle';
  customPartnerWidths = state.customPartnerWidths ? JSON.parse(JSON.stringify(state.customPartnerWidths)) : null;
  customWaterwayData = state.customWaterwayData ? JSON.parse(JSON.stringify(state.customWaterwayData)) : null;

  selectedElement = null;
  applyViewportTransform();
  renderSVG();

  const editor = document.getElementById("element-editor");
  if (editor) {
    editor.innerHTML = `<p class="empty-editor-hint">اضغط على أي قطعة أرض أو نص أو ضلع لتعديل بياناته هنا.</p>`;
  }
}

function autoSaveCurrentState() {
  const state = {
    shapes, borderLabels, splitLines, freeTexts, waterways,
    zoomScale, panX, panY, activeTemplateType,
    inputs: {
      w1: document.getElementById("start-w1")?.value || "",
      w1Dir: document.getElementById("start-w1-dir")?.value || "",
      w2: document.getElementById("start-w2")?.value || "",
      w2Dir: document.getElementById("start-w2-dir")?.value || "",
      l2: document.getElementById("start-l2")?.value || "",
      l2Dir: document.getElementById("start-l2-dir")?.value || "",
      l1: document.getElementById("start-l1")?.value || "",
      l1Dir: document.getElementById("start-l1-dir")?.value || "",
      d1: document.getElementById("start-d1")?.value || "",
      d2: document.getElementById("start-d2")?.value || "",
      partners: document.getElementById("start-partners")?.value || "1"
    },
    customPartnerWidths, customWaterwayData
  };
  localStorage.setItem("dallal_autosave", JSON.stringify(state));
}
window.addEventListener('beforeunload', autoSaveCurrentState);// ----------------------------------------------------
// SVG Coordinate Mapping & Viewport Transforms
// ----------------------------------------------------
function getSvgCoords(e) {
  const svg = document.getElementById("dallalSvg");
  const point = svg.createSVGPoint();
  if (e.touches && e.touches.length > 0) {
    point.x = e.touches[0].clientX;
    point.y = e.touches[0].clientY;
  } else {
    point.x = e.clientX;
    point.y = e.clientY;
  }
  const svgCoords = point.matrixTransform(svg.getScreenCTM().inverse());
  return { x: svgCoords.x, y: svgCoords.y };
}

function applyViewportTransform() {
  const viewportGroup = document.getElementById("viewportGroup");
  if (viewportGroup) {
    viewportGroup.setAttribute("transform", `translate(${panX}, ${panY}) scale(${zoomScale})`);
  }
}

// ----------------------------------------------------
// Smart Area Math Conversion Helpers
// ----------------------------------------------------
function sqmToFeddanCaratShares(sqm) {
  const cSize = caratSize;
  const fSize = cSize * 24;
  const sSize = cSize / 24;

  const feddan = Math.floor(sqm / fSize);
  const remSqm = sqm - (feddan * fSize);
  const carat = Math.floor(remSqm / cSize);
  let shares = Math.round((remSqm - (carat * cSize)) / sSize * 100) / 100;
  
  let finalCarat = carat;
  let finalFeddan = feddan;
  let finalShares = shares;

  if (finalShares >= 24) {
    finalShares -= 24;
    finalCarat += 1;
  }
  if (finalCarat >= 24) {
    finalCarat -= 24;
    finalFeddan += 1;
  }

  return { feddan: finalFeddan, carat: finalCarat, shares: Math.max(0, finalShares) };
}

// ----------------------------------------------------
// Quad Generation Algorithm (Handles all template styles dynamically)
// ----------------------------------------------------
let customPartnerWidths = null;
let customWaterwayData = null;

function generateCustomLand(useCustomWidths = false) {
  if (useCustomWidths !== true) {
    customPartnerWidths = null;
    customWaterwayData = null;
  }
  try {
    if (typeof preventDoubleTap === "function" && preventDoubleTap()) return;
    const w1 = parseArabicFloat(document.getElementById("start-w1").value);
    const w1Dir = document.getElementById("start-w1-dir").value.trim() || "بحري";
    const w2 = parseArabicFloat(document.getElementById("start-w2").value);
    const w2Dir = document.getElementById("start-w2-dir").value.trim() || "قبلي";
    const l2 = parseArabicFloat(document.getElementById("start-l2").value);
    const l2Dir = document.getElementById("start-l2-dir").value.trim() || "شرقي";
    const l1 = parseArabicFloat(document.getElementById("start-l1").value);
    const l1Dir = document.getElementById("start-l1-dir").value.trim() || "غربي";
    const numPartners = parseInt(document.getElementById("start-partners")?.value) || 1;

  if (w1 <= 0 || w2 <= 0 || l1 <= 0 || l2 <= 0 || numPartners < 1) {
    alert("الرجاء إدخال أبعاد صحيحة أكبر من الصفر للأضلاع الأربعة!");
    return;
  }

  // Clear current drawing state
  shapes = [];
  borderLabels = [];
  splitLines = [];
  freeTexts = [];
  waterways = [];
  selectedElement = null;

  let centerX = 450;
  let centerY = 325;
  let scale = 1;

  let effW1 = w1, effW2 = w2, effL1 = l1, effL2 = l2;
  let effW1Dir = w1Dir, effW2Dir = w2Dir, effL1Dir = l1Dir, effL2Dir = l2Dir;

  const avgW = (w1 + w2) / 2;
  const avgL = (l1 + l2) / 2;
  const maxW = Math.max(w1, w2);
  const maxL = Math.max(l1, l2);
  const isRotated = avgL > avgW;

  const svgElement = document.getElementById("dallalSvg");
  const wrapperElement = document.querySelector(".canvas-wrapper");

  if (avgL > avgW) {
    // Portrait Mode
    svgElement.setAttribute("viewBox", "0 0 650 900");
    const bgImg = document.getElementById("agriBgImage");
    const agriPattern = document.getElementById("agriPattern");
    if (bgImg) { bgImg.setAttribute("width", "650"); bgImg.setAttribute("height", "900"); }
    if (agriPattern) { agriPattern.setAttribute("width", "650"); agriPattern.setAttribute("height", "900"); }
    if (wrapperElement) wrapperElement.style.aspectRatio = "650 / 900";
    setDynamicPrintPage("portrait");
    centerX = 325;
    centerY = 450;
    scale = Math.min(500 / maxW, 740 / maxL);
  } else {
    // Landscape Mode
    svgElement.setAttribute("viewBox", "0 0 900 650");
    const bgImg = document.getElementById("agriBgImage");
    const agriPattern = document.getElementById("agriPattern");
    if (bgImg) { bgImg.setAttribute("width", "900"); bgImg.setAttribute("height", "650"); }
    if (agriPattern) { agriPattern.setAttribute("width", "900"); agriPattern.setAttribute("height", "650"); }
    if (wrapperElement) wrapperElement.style.aspectRatio = "900 / 650";
    setDynamicPrintPage("landscape");
    centerX = 450;
    centerY = 325;
    scale = Math.min(740 / maxW, 500 / maxL);
  }

  function addDividerLengthsFreeTexts(p_tl, p_tr, p_br, p_bl, idx) {
    const leftLen = Math.sqrt(Math.pow(p_bl.x - p_tl.x, 2) + Math.pow(p_bl.y - p_tl.y, 2)) / scale;
    freeTexts.push({
      id: "note_left_" + Date.now() + "_" + idx,
      text: leftLen.toFixed(2) + " م",
      x: p_tl.x + (p_bl.x - p_tl.x) * 0.75 + 28,
      y: p_tl.y + (p_bl.y - p_tl.y) * 0.75,
      fontSize: 12,
      isBold: true,
      angle: 0,
      color: "#555"
    });
    const rightLen = Math.sqrt(Math.pow(p_br.x - p_tr.x, 2) + Math.pow(p_br.y - p_tr.y, 2)) / scale;
    freeTexts.push({
      id: "note_right_" + Date.now() + "_" + idx,
      text: rightLen.toFixed(2) + " م",
      x: p_tr.x + (p_br.x - p_tr.x) * 0.75 - 28,
      y: p_tr.y + (p_br.y - p_tr.y) * 0.75,
      fontSize: 12,
      isBold: true,
      angle: 0,
      color: "#555"
    });
  }

  const d1Input = document.getElementById("start-d1");
  const d2Input = document.getElementById("start-d2");
  const diag1 = d1Input && d1Input.value ? parseArabicFloat(d1Input.value) : 0;
  const diag2 = d2Input && d2Input.value ? parseArabicFloat(d2Input.value) : 0;

  let p1, p2, p3, p4;
  let totalArea = 0;

  if (diag1 > 0 || diag2 > 0) {
    let A = w2, B = l1, C = w1, D = l2;
    let tempP1, tempP2, tempP3, tempP4;
    tempP4 = { x: 0, y: 0 };
    tempP3 = { x: A, y: 0 };

    if (diag1 > 0) { // AC
      let cos_alpha = (B*B + A*A - diag1*diag1) / (2 * B * A);
      if(cos_alpha < -1 || cos_alpha > 1) { alert("القطر الأول غير منطقي مع أبعاد الأضلاع!"); return; }
      let alpha = Math.acos(cos_alpha);
      tempP1 = { x: B * Math.cos(alpha), y: -B * Math.sin(alpha) };

      let cos_beta1 = (A*A + diag1*diag1 - B*B) / (2 * A * diag1);
      let beta1 = Math.acos(cos_beta1);
      let cos_beta2 = (D*D + diag1*diag1 - C*C) / (2 * D * diag1);
      if(cos_beta2 < -1 || cos_beta2 > 1) { alert("القطر الأول غير منطقي مع أبعاد الأضلاع!"); return; }
      let beta2 = Math.acos(cos_beta2);
      let total_beta = beta1 + beta2;
      tempP2 = { x: A - D * Math.cos(total_beta), y: -D * Math.sin(total_beta) };
      
      let s1 = (A + B + diag1) / 2;
      let area1 = Math.sqrt(s1 * (s1 - A) * (s1 - B) * (s1 - diag1));
      let s2 = (C + D + diag1) / 2;
      let area2 = Math.sqrt(s2 * (s2 - C) * (s2 - D) * (s2 - diag1));
      totalArea = area1 + area2;
    } else { // BD
      let cos_beta = (A*A + D*D - diag2*diag2) / (2 * A * D);
      if(cos_beta < -1 || cos_beta > 1) { alert("القطر الثاني غير منطقي مع أبعاد الأضلاع!"); return; }
      let beta = Math.acos(cos_beta);
      tempP2 = { x: A - D * Math.cos(beta), y: -D * Math.sin(beta) };
      
      let cos_alpha1 = (A*A + diag2*diag2 - D*D) / (2 * A * diag2);
      let alpha1 = Math.acos(cos_alpha1);
      let cos_alpha2 = (B*B + diag2*diag2 - C*C) / (2 * B * diag2);
      if(cos_alpha2 < -1 || cos_alpha2 > 1) { alert("القطر الثاني غير منطقي مع أبعاد الأضلاع!"); return; }
      let alpha2 = Math.acos(cos_alpha2);
      let total_alpha = alpha1 + alpha2;
      tempP1 = { x: B * Math.cos(total_alpha), y: -B * Math.sin(total_alpha) };

      let s1 = (A + D + diag2) / 2;
      let area1 = Math.sqrt(s1 * (s1 - A) * (s1 - D) * (s1 - diag2));
      let s2 = (C + B + diag2) / 2;
      let area2 = Math.sqrt(s2 * (s2 - C) * (s2 - B) * (s2 - diag2));
      totalArea = area1 + area2;
    }

    let minX = Math.min(tempP1.x, tempP2.x, tempP3.x, tempP4.x);
    let maxX = Math.max(tempP1.x, tempP2.x, tempP3.x, tempP4.x);
    let minY = Math.min(tempP1.y, tempP2.y, tempP3.y, tempP4.y);
    let maxY = Math.max(tempP1.y, tempP2.y, tempP3.y, tempP4.y);
    let shapeW = maxX - minX;
    let shapeH = maxY - minY;

    let rawScale = Math.min(740 / shapeW, 500 / shapeH);
    if (avgL > avgW) {
       rawScale = Math.min(500 / shapeW, 740 / shapeH);
    }
    scale = rawScale;

    let boxCenterX = minX + shapeW / 2;
    let boxCenterY = minY + shapeH / 2;

    p1 = { x: centerX + (tempP1.x - boxCenterX) * scale, y: centerY + (tempP1.y - boxCenterY) * scale };
    p2 = { x: centerX + (tempP2.x - boxCenterX) * scale, y: centerY + (tempP2.y - boxCenterY) * scale };
    p3 = { x: centerX + (tempP3.x - boxCenterX) * scale, y: centerY + (tempP3.y - boxCenterY) * scale };
    p4 = { x: centerX + (tempP4.x - boxCenterX) * scale, y: centerY + (tempP4.y - boxCenterY) * scale };

  } else {
    const drawW1 = w1 * scale;
    const drawW2 = w2 * scale;
    const drawL1 = l1 * scale;
    const drawL2 = l2 * scale;
    const avgHeight = (drawL1 + drawL2) / 2;

    p1 = { x: centerX - drawW1 / 2, y: centerY - avgHeight / 2 };
    p2 = { x: centerX + drawW1 / 2, y: centerY - avgHeight / 2 };
    p3 = { x: centerX + drawW2 / 2, y: centerY + avgHeight / 2 };
    p4 = { x: centerX - drawW2 / 2, y: centerY + avgHeight / 2 };

    totalArea = ((w1 + w2) / 2) * ((l1 + l2) / 2);
  }
  const detailedArea = sqmToFeddanCaratShares(totalArea);

  const excludedTemplates = ['quad_diagonal', 'mixed_waterway_new', 'mixed_split_image'];
  if (numPartners > 1 && !excludedTemplates.includes(activeTemplateType)) {
    
    // Initialize customPartnerWidths if not set
    if (!customPartnerWidths || customPartnerWidths.length !== numPartners) {
      customPartnerWidths = [];
      for (let i = 0; i < numPartners; i++) {
        customPartnerWidths.push({
          top: effW1 / numPartners,
          bot: effW2 / numPartners
        });
      }
    }

    for (let i = 0; i < numPartners; i++) {
      let ratioTop1 = 0;
      for (let j = 0; j < i; j++) ratioTop1 += customPartnerWidths[j].top;
      ratioTop1 /= effW1;

      let ratioTop2 = ratioTop1 + (customPartnerWidths[i].top / effW1);

      let ratioBot1 = 0;
      for (let j = 0; j < i; j++) ratioBot1 += customPartnerWidths[j].bot;
      ratioBot1 /= effW2;

      let ratioBot2 = ratioBot1 + (customPartnerWidths[i].bot / effW2);

      // Handle precision issues
      if (ratioTop1 < 0) ratioTop1 = 0; if (ratioTop1 > 1) ratioTop1 = 1;
      if (ratioTop2 < 0) ratioTop2 = 0; if (ratioTop2 > 1) ratioTop2 = 1;
      if (ratioBot1 < 0) ratioBot1 = 0; if (ratioBot1 > 1) ratioBot1 = 1;
      if (ratioBot2 < 0) ratioBot2 = 0; if (ratioBot2 > 1) ratioBot2 = 1;

      const p_tl = {
        x: p1.x + (p2.x - p1.x) * ratioTop1,
        y: p1.y + (p2.y - p1.y) * ratioTop1
      };
      const p_tr = {
        x: p1.x + (p2.x - p1.x) * ratioTop2,
        y: p1.y + (p2.y - p1.y) * ratioTop2
      };
      const p_br = {
        x: p4.x + (p3.x - p4.x) * ratioBot2,
        y: p4.y + (p3.y - p4.y) * ratioBot2
      };
      const p_bl = {
        x: p4.x + (p3.x - p4.x) * ratioBot1,
        y: p4.y + (p3.y - p4.y) * ratioBot1
      };

      // Calculate area of this custom piece
      let A = Math.sqrt(Math.pow(p_tr.x - p_tl.x, 2) + Math.pow(p_tr.y - p_tl.y, 2)) / scale;
      let B = Math.sqrt(Math.pow(p_bl.x - p_tl.x, 2) + Math.pow(p_bl.y - p_tl.y, 2)) / scale;
      let C = Math.sqrt(Math.pow(p_br.x - p_bl.x, 2) + Math.pow(p_br.y - p_bl.y, 2)) / scale;
      let D = Math.sqrt(Math.pow(p_br.x - p_tr.x, 2) + Math.pow(p_br.y - p_tr.y, 2)) / scale;
      let diag = Math.sqrt(Math.pow(p_br.x - p_tl.x, 2) + Math.pow(p_br.y - p_tl.y, 2)) / scale;
      
      let s1 = (A + D + diag) / 2;
      let area1 = Math.sqrt(s1 * (s1 - A) * (s1 - D) * (s1 - diag)) || 0;
      let s2 = (C + B + diag) / 2;
      let area2 = Math.sqrt(s2 * (s2 - C) * (s2 - B) * (s2 - diag)) || 0;
      let partArea = area1 + area2;
      const partDetailed = sqmToFeddanCaratShares(partArea);


      const colorIndex = (i + 1) % colorsList.length;
      shapes.push({
        id: "shape_" + (i + 1),
        points: [p_tl, p_tr, p_br, p_bl],
        owner: "الشريك " + (i + 1),
        area: { feddan: partDetailed.feddan, carat: partDetailed.carat, shares: partDetailed.shares, sqm: partArea },
        notes: "نصيب الشريك " + (i + 1),
        color: colorsList[colorIndex].value,
        textX: (p_tl.x + p_tr.x + p_br.x + p_bl.x) / 4,
        textY: (p_tl.y + p_tr.y + p_br.y + p_bl.y) / 4
      });
      
      addDividerLengthsFreeTexts(p_tl, p_tr, p_br, p_bl, i);

      const partW1 = customPartnerWidths[i].top;
      const partW2 = customPartnerWidths[i].bot;

      freeTexts.push({
        id: "note_top_" + Date.now() + "_" + i,
        text: partW1.toFixed(2) + " م",
        x: (p_tl.x + p_tr.x) / 2,
        y: (p_tl.y + p_tr.y) / 2 + 20,
        fontSize: 12,
        isBold: true,
        angle: 0,
        color: "#555"
      });

      freeTexts.push({
        id: "note_bot_" + Date.now() + "_" + i,
        text: partW2.toFixed(2) + " م",
        x: (p_bl.x + p_br.x) / 2,
        y: (p_bl.y + p_br.y) / 2 - 20,
        fontSize: 12,
        isBold: true,
        angle: 0,
        color: "#555"
      });

      if (i > 0) {
        const splitLen = Math.sqrt(Math.pow(p_bl.x - p_tl.x, 2) + Math.pow(p_bl.y - p_tl.y, 2)) / scale;
        splitLines.push({
          id: "split_" + i,
          x1: p_tl.x, y1: p_tl.y,
          x2: p_bl.x, y2: p_bl.y,
          label: "",
          labelX: p_tl.x - 20,
          labelY: (p_tl.y + p_bl.y) / 2,
          angle: 90,
          isDashed: true
        });
      }
    }
  } else if (activeTemplateType === 'generic_shape' || activeTemplateType === 'rectangle' || activeTemplateType === 'square' || activeTemplateType === 'trapezoid' || activeTemplateType === 'quadrilateral') {
    // Single parcel shape
    shapes.push({
      id: "shape_1",
      points: [p1, p2, p3, p4],
      owner: "اسم المالك",
      area: { feddan: detailedArea.feddan, carat: detailedArea.carat, shares: detailedArea.shares, sqm: totalArea },
      notes: "خريطة ارض",
      color: "#f1f8e9",
      textX: centerX,
      textY: centerY
    });
    
    addDividerLengthsFreeTexts(p1, p2, p3, p4, 0);

  } else if (activeTemplateType === 'v_split') {
    // Vertical split
    const p_top_mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    const p_bot_mid = { x: (p4.x + p3.x) / 2, y: (p4.y + p3.y) / 2 };

    const halfArea = totalArea / 2;
    const halfDetailed = sqmToFeddanCaratShares(halfArea);

    shapes.push({
      id: "shape_1",
      points: [p1, p_top_mid, p_bot_mid, p4],
      owner: isRotated ? "الشريك الأول (غربي)" : "الشريك الأول (بحري)",
      area: { feddan: halfDetailed.feddan, carat: halfDetailed.carat, shares: halfDetailed.shares, sqm: halfArea },
      notes: isRotated ? "نصيب غربي" : "نصيب بحري",
      color: "#f1f8e9",
      textX: (p1.x + p_top_mid.x) / 2,
      textY: (p1.y + p_bot_mid.y) / 2
    });
    
    addDividerLengthsFreeTexts(p1, p_top_mid, p_bot_mid, p4, 0);

    shapes.push({
      id: "shape_2",
      points: [p_top_mid, p2, p3, p_bot_mid],
      owner: isRotated ? "الشريك الثاني (شرقي)" : "الشريك الثاني (قبلي)",
      area: { feddan: halfDetailed.feddan, carat: halfDetailed.carat, shares: halfDetailed.shares, sqm: halfArea },
      notes: isRotated ? "نصيب شرقي" : "نصيب قبلي",
      color: "#e3f2fd",
      textX: (p_top_mid.x + p2.x) / 2,
      textY: (p2.y + p3.y) / 2
    });
    
    addDividerLengthsFreeTexts(p_top_mid, p2, p3, p_bot_mid, 1);

    splitLines.push({
      id: "split_1",
      x1: p_top_mid.x, y1: p_top_mid.y,
      x2: p_bot_mid.x, y2: p_bot_mid.y,
      label: "",
      labelX: p_top_mid.x - 20,
      labelY: centerY,
      angle: 90,
      isDashed: true
    });

  } else if (activeTemplateType === 'h_split') {
    // Horizontal split
    const p_left_mid = { x: (p1.x + p4.x) / 2, y: (p1.y + p4.y) / 2 };
    const p_right_mid = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };

    const halfArea = totalArea / 2;
    const halfDetailed = sqmToFeddanCaratShares(halfArea);

    shapes.push({
      id: "shape_1",
      points: [p1, p2, p_right_mid, p_left_mid],
      owner: isRotated ? "الشريك الأول (بحري)" : "الشريك الأول (شرقي)",
      area: { feddan: halfDetailed.feddan, carat: halfDetailed.carat, shares: halfDetailed.shares, sqm: halfArea },
      notes: isRotated ? "نصيب بحري" : "نصيب شرقي",
      color: "#f1f8e9",
      textX: centerX,
      textY: (p1.y + p_left_mid.y) / 2
    });
    
    addDividerLengthsFreeTexts(p1, p2, p_right_mid, p_left_mid, 0);

    shapes.push({
      id: "shape_2",
      points: [p_left_mid, p_right_mid, p3, p4],
      owner: isRotated ? "الشريك الثاني (قبلي)" : "الشريك الثاني (غربي)",
      area: { feddan: halfDetailed.feddan, carat: halfDetailed.carat, shares: halfDetailed.shares, sqm: halfArea },
      notes: isRotated ? "نصيب قبلي" : "نصيب غربي",
      color: "#fffde7",
      textX: centerX,
      textY: (p_left_mid.y + p4.y) / 2
    });
    
    addDividerLengthsFreeTexts(p_left_mid, p_right_mid, p3, p4, 1);

    splitLines.push({
      id: "split_1",
      x1: p_left_mid.x, y1: p_left_mid.y,
      x2: p_right_mid.x, y2: p_right_mid.y,
      label: "",
      labelX: centerX,
      labelY: p_left_mid.y - 12,
      angle: 0,
      isDashed: true
    });

  } else if (activeTemplateType === 'quad_diagonal') {
    // Diagonal splits (both diagonals AC and BD)
    shapes.push({
      id: "shape_1",
      points: [p1, p2, p3, p4],
      owner: "اسم المالك",
      area: { feddan: detailedArea.feddan, carat: detailedArea.carat, shares: detailedArea.shares, sqm: totalArea },
      notes: "رباعي مقاس بالقطرين",
      color: "#f1f8e9",
      textX: centerX,
      textY: centerY + 55
    });

    const lenAC = Math.sqrt(Math.pow(p3.x - p1.x, 2) + Math.pow(p3.y - p1.y, 2)) / scale;
    const lenBD = Math.sqrt(Math.pow(p2.x - p4.x, 2) + Math.pow(p2.y - p4.y, 2)) / scale;

    // Draw diagonal AC
    splitLines.push({
      id: "split_diag_1",
      x1: p1.x, y1: p1.y,
      x2: p3.x, y2: p3.y,
      label: `القطر الأول (AC) ${lenAC.toFixed(2)} م`,
      labelX: (p1.x + p3.x) / 2 + 35,
      labelY: (p1.y + p3.y) / 2 - 20,
      angle: Math.round(Math.atan2(p3.y - p1.y, p3.x - p1.x) * 180 / Math.PI),
      isDashed: true,
      color: "#0288d1"
    });

    // Draw diagonal BD
    splitLines.push({
      id: "split_diag_2",
      x1: p4.x, y1: p4.y,
      x2: p2.x, y2: p2.y,
      label: `القطر الثاني (BD) ${lenBD.toFixed(2)} م`,
      labelX: (p4.x + p2.x) / 2 - 35,
      labelY: (p4.y + p2.y) / 2 - 20,
      angle: Math.round(Math.atan2(p2.y - p4.y, p2.x - p4.x) * 180 / Math.PI),
      isDashed: true,
      color: "#0288d1"
    });

    freeTexts.push({
      id: "note_diag_info",
      text: "* تم قياس القطرين هندسياً لتأكيد دقة كروكي الرسم.",
      x: centerX,
      y: p4.y + 45,
      fontSize: 13,
      isBold: true,
      color: "#b71c1c",
      angle: 0
    });

  } else if (activeTemplateType === 'mixed_waterway_new') {
    if (!customWaterwayData) {
      customWaterwayData = {
        leftTopMeters: (effL1 / 2) - 3.6,
        rightTopMeters: (effL2 / 2) - 3.6,
        leftWaterMeters: 7.20,
        rightWaterMeters: 7.20
      };
    }

    const t_left_top = Math.max(0, Math.min(1, customWaterwayData.leftTopMeters / effL1));
    const t_left_bot = Math.max(0, Math.min(1, (customWaterwayData.leftTopMeters + customWaterwayData.leftWaterMeters) / effL1));
    const t_right_top = Math.max(0, Math.min(1, customWaterwayData.rightTopMeters / effL2));
    const t_right_bot = Math.max(0, Math.min(1, (customWaterwayData.rightTopMeters + customWaterwayData.rightWaterMeters) / effL2));

    const x_water_top_left = p1.x + (p4.x - p1.x) * t_left_top;
    const y_water_top_left = p1.y + (p4.y - p1.y) * t_left_top;
    
    const x_water_bot_left = p1.x + (p4.x - p1.x) * t_left_bot;
    const y_water_bot_left = p1.y + (p4.y - p1.y) * t_left_bot;

    const x_water_top_right = p2.x + (p3.x - p2.x) * t_right_top;
    const y_water_top_right = p2.y + (p3.y - p2.y) * t_right_top;

    const x_water_bot_right = p2.x + (p3.x - p2.x) * t_right_bot;
    const y_water_bot_right = p2.y + (p3.y - p2.y) * t_right_bot;

    function calcDist(pa, pb) {
      return Math.sqrt(Math.pow(pb.x - pa.x, 2) + Math.pow(pb.y - pa.y, 2)) / scale;
    }
    function calcQuadArea(pa, pb, pc, pd) {
      let A = calcDist(pa, pb);
      let B = calcDist(pa, pd);
      let C = calcDist(pc, pd);
      let D = calcDist(pc, pb);
      let diag = calcDist(pa, pc);
      let s1 = (A + D + diag) / 2;
      let area1 = Math.sqrt(s1 * (s1 - A) * (s1 - D) * (s1 - diag)) || 0;
      let s2 = (C + B + diag) / 2;
      let area2 = Math.sqrt(s2 * (s2 - C) * (s2 - B) * (s2 - diag)) || 0;
      return area1 + area2;
    }

    const w_tl = { x: x_water_top_left, y: y_water_top_left };
    const w_tr = { x: x_water_top_right, y: y_water_top_right };
    const w_br = { x: x_water_bot_right, y: y_water_bot_right };
    const w_bl = { x: x_water_bot_left, y: y_water_bot_left };

    waterways.push({
      id: "water_new",
      points: [w_tl, w_tr, w_br, w_bl],
      label: "مجرى مائي (ترعة)",
      labelX: centerX,
      labelY: (y_water_top_left + y_water_bot_left) / 2 + 4,
      angle: 0,
      stats: {
        area: calcQuadArea(w_tl, w_tr, w_br, w_bl),
        width: calcDist(w_tl, w_bl), // average width would be better but this is fine
        length: calcDist(w_tl, w_tr)
      }
    });

    const N = numPartners;

    if (!customPartnerWidths || customPartnerWidths.length !== N) {
      customPartnerWidths = [];
      for (let i = 0; i < N; i++) {
        customPartnerWidths.push({
          top: effW1 / N,
          bot: effW2 / N
        });
      }
    }

    for (let i = 0; i < N; i++) {
      let ratioTop1 = 0;
      for (let j = 0; j < i; j++) ratioTop1 += customPartnerWidths[j].top;
      ratioTop1 /= effW1;

      let ratioTop2 = ratioTop1 + (customPartnerWidths[i].top / effW1);

      let ratioBot1 = 0;
      for (let j = 0; j < i; j++) ratioBot1 += customPartnerWidths[j].bot;
      ratioBot1 /= effW2;

      let ratioBot2 = ratioBot1 + (customPartnerWidths[i].bot / effW2);

      if (ratioTop1 < 0) ratioTop1 = 0; if (ratioTop1 > 1) ratioTop1 = 1;
      if (ratioTop2 < 0) ratioTop2 = 0; if (ratioTop2 > 1) ratioTop2 = 1;
      if (ratioBot1 < 0) ratioBot1 = 0; if (ratioBot1 > 1) ratioBot1 = 1;
      if (ratioBot2 < 0) ratioBot2 = 0; if (ratioBot2 > 1) ratioBot2 = 1;

      const p_tl = {
        x: p1.x + (p2.x - p1.x) * ratioTop1,
        y: p1.y + (p2.y - p1.y) * ratioTop1
      };
      const p_tr = {
        x: p1.x + (p2.x - p1.x) * ratioTop2,
        y: p1.y + (p2.y - p1.y) * ratioTop2
      };
      const p_br = {
        x: p4.x + (p3.x - p4.x) * ratioBot2,
        y: p4.y + (p3.y - p4.y) * ratioBot2
      };
      const p_bl = {
        x: p4.x + (p3.x - p4.x) * ratioBot1,
        y: p4.y + (p3.y - p4.y) * ratioBot1
      };

      let partAreaTotal = calcQuadArea(p_tl, p_tr, p_br, p_bl);
      let partArea = partAreaTotal * 0.9; // Subtract ~10% for waterway
      const partDetailed = sqmToFeddanCaratShares(partArea);

      const colorIndex = (i + 1) % colorsList.length;
      let ownerName = "الشريك " + (i + 1);
      let notesName = "نصيب الشريك " + (i + 1);
      
      if (N === 1) {
         ownerName = "اسم المالك";
         notesName = "القطعة كاملة";
      } else if (N === 2) {
         ownerName = i === 0 ? "الشريك الأول (غربي)" : "الشريك الثاني (شرقي)";
         notesName = i === 0 ? "القطعة الغربية" : "القطعة الشرقية";
      }

      let p_w_tl = { x: p_tl.x + (p_bl.x - p_tl.x) * t_left_top, y: p_tl.y + (p_bl.y - p_tl.y) * t_left_top };
      let p_w_tr = { x: p_tr.x + (p_br.x - p_tr.x) * t_right_top, y: p_tr.y + (p_br.y - p_tr.y) * t_right_top };

      let p_w_bl = { x: p_tl.x + (p_bl.x - p_tl.x) * t_left_bot, y: p_tl.y + (p_bl.y - p_tl.y) * t_left_bot };
      let p_w_br = { x: p_tr.x + (p_br.x - p_tr.x) * t_right_bot, y: p_tr.y + (p_br.y - p_tr.y) * t_right_bot };

      let upperArea = calcQuadArea(p_tl, p_tr, p_w_tr, p_w_tl);
      let lowerArea = calcQuadArea(p_w_bl, p_w_br, p_br, p_bl);

      shapes.push({
        id: "shape_" + (i + 1),
        points: [p_tl, p_tr, p_br, p_bl],
        owner: ownerName,
        area: { feddan: partDetailed.feddan, carat: partDetailed.carat, shares: partDetailed.shares, sqm: partArea },
        notes: notesName,
        color: colorsList[colorIndex].value,
        textX: (p_tl.x + p_tr.x + p_br.x + p_bl.x) / 4,
        textY: (p_tl.y + p_tr.y) / 2 + ( (p_bl.y + p_br.y) / 2 - (p_tl.y + p_tr.y) / 2 ) * 0.25,
        subShapes: [
          {
            name: "القطعة الغربية",
            points: [p_tl, p_tr, p_w_tr, p_w_tl],
            area: upperArea,
            topWidth: calcDist(p_tl, p_tr),
            botWidth: calcDist(p_w_tl, p_w_tr),
            leftLen: calcDist(p_tl, p_w_tl),
            rightLen: calcDist(p_tr, p_w_tr),
            perimeter: calcDist(p_tl, p_tr) + calcDist(p_w_tl, p_w_tr) + calcDist(p_tl, p_w_tl) + calcDist(p_tr, p_w_tr)
          },
          {
            name: "القطعة الشرقية",
            points: [p_w_bl, p_w_br, p_br, p_bl],
            area: lowerArea,
            topWidth: calcDist(p_w_bl, p_w_br),
            botWidth: calcDist(p_bl, p_br),
            leftLen: calcDist(p_w_bl, p_bl),
            rightLen: calcDist(p_w_br, p_br),
            perimeter: calcDist(p_w_bl, p_w_br) + calcDist(p_bl, p_br) + calcDist(p_w_bl, p_bl) + calcDist(p_w_br, p_br)
          }
        ]
      });
      
      addDividerLengthsFreeTexts(p_tl, p_tr, p_br, p_bl, i);

      const partW1 = customPartnerWidths[i].top;
      const partW2 = customPartnerWidths[i].bot;

      freeTexts.push({
        id: "note_top_" + Date.now() + "_" + i,
        text: partW1.toFixed(2) + " م",
        x: (p_tl.x + p_tr.x) / 2,
        y: (p_tl.y + p_tr.y) / 2 + 20,
        fontSize: 12,
        isBold: true,
        angle: 0,
        color: "#555"
      });

      freeTexts.push({
        id: "note_bot_" + Date.now() + "_" + i,
        text: partW2.toFixed(2) + " م",
        x: (p_bl.x + p_br.x) / 2,
        y: (p_bl.y + p_br.y) / 2 - 20,
        fontSize: 12,
        isBold: true,
        angle: 0,
        color: "#555"
      });

      if (i > 0) {
        splitLines.push({
          id: "split_" + i,
          x1: p_tl.x, y1: p_tl.y,
          x2: p_bl.x, y2: p_bl.y,
          label: "",
          labelX: p_tl.x - 20,
          labelY: (p_tl.y + p_bl.y) / 2,
          angle: 90,
          isDashed: true
        });
      }
    }

  } else if (activeTemplateType === 'mixed_split_image') {
    // Vertical waterway in the middle, splitting into Left/Right, then horizontally split.
    const water_w = 26; // Waterway width in pixels
    const x_water_left = centerX - water_w / 2;
    const x_water_right = centerX + water_w / 2;

    const y_water_top = p1.y;
    const y_water_bot = p4.y;

    waterways.push({
      id: "water_1",
      points: [
        { x: x_water_left, y: y_water_top },
        { x: x_water_right, y: y_water_top },
        { x: x_water_right, y: y_water_bot },
        { x: x_water_left, y: y_water_bot }
      ],
      label: "مجرى مائي (ترعة)",
      labelX: centerX,
      labelY: centerY,
      angle: 90
    });

    // Left Side Splits
    const y_mid_left = (p1.y + p4.y) / 2;
    const x_mid_left_outer = (p1.x + p4.x) / 2;

    const quarterArea = (totalArea * 0.9) / 4;
    const quarterDetailed = sqmToFeddanCaratShares(quarterArea);

    shapes.push({
      id: "shape_1", // Top-Left
      points: [p1, { x: x_water_left, y: y_water_top }, { x: x_water_left, y: y_mid_left }, { x: x_mid_left_outer, y: y_mid_left }],
      owner: "الشريك الأول (بحري غربي)",
      area: { feddan: quarterDetailed.feddan, carat: quarterDetailed.carat, shares: quarterDetailed.shares, sqm: quarterArea },
      notes: "القطعة البحرية الغربية",
      color: "#ffffff",
      textX: (p1.x + x_water_left) / 2,
      textY: (p1.y + y_mid_left) / 2
    });

    shapes.push({
      id: "shape_2", // Bottom-Left
      points: [{ x: x_mid_left_outer, y: y_mid_left }, { x: x_water_left, y: y_mid_left }, { x: x_water_left, y: y_water_bot }, p4],
      owner: "الشريك الثاني (قبلي غربي)",
      area: { feddan: quarterDetailed.feddan, carat: quarterDetailed.carat, shares: quarterDetailed.shares, sqm: quarterArea },
      notes: "القطعة القبلية الغربية",
      color: "#ffffff",
      textX: (p4.x + x_water_left) / 2,
      textY: (y_mid_left + p4.y) / 2
    });

    const splitLeftVal = (effW1 * 0.45).toFixed(1);
    splitLines.push({
      id: "split_left",
      x1: x_mid_left_outer, y1: y_mid_left,
      x2: x_water_left, y2: y_mid_left,
      label: "",
      labelX: p1.x - 130,
      labelY: y_mid_left + 4,
      angle: 0,
      isDashed: true
    });

    // Right Side Splits
    const y_mid_right = (p2.y + p3.y) / 2;
    const x_mid_right_outer = (p2.x + p3.x) / 2;

    shapes.push({
      id: "shape_3", // Top-Right
      points: [{ x: x_water_right, y: y_water_top }, p2, { x: x_mid_right_outer, y: y_mid_right }, { x: x_water_right, y: y_mid_right }],
      owner: "الشريك الثالث (بحري شرقي)",
      area: { feddan: quarterDetailed.feddan, carat: quarterDetailed.carat, shares: quarterDetailed.shares, sqm: quarterArea },
      notes: "القطعة البحرية الشرقية",
      color: "#ffffff",
      textX: (x_water_right + p2.x) / 2,
      textY: (p2.y + y_mid_right) / 2
    });

    shapes.push({
      id: "shape_4", // Bottom-Right
      points: [{ x: x_water_right, y: y_mid_right }, { x: x_mid_right_outer, y: y_mid_right }, p3, { x: x_water_right, y: y_water_bot }],
      owner: "الشريك الرابع (قبلي شرقي)",
      area: { feddan: quarterDetailed.feddan, carat: quarterDetailed.carat, shares: quarterDetailed.shares, sqm: quarterArea },
      notes: "القطعة القبلية الشرقية",
      color: "#ffffff",
      textX: (x_water_right + p3.x) / 2,
      textY: (y_mid_right + p3.y) / 2
    });

    const splitRightVal = (effW2 * 0.45).toFixed(1);
    splitLines.push({
      id: "split_right",
      x1: x_water_right, y1: y_mid_right,
      x2: x_mid_right_outer, y2: y_mid_right,
      label: "",
      labelX: p2.x + 130,
      labelY: y_mid_right + 4,
      angle: 0,
      isDashed: true
    });

    // Inner measurements height labels dynamically calculated
    const hValLeft = ((effL1 - 17.50) / 2).toFixed(1);
    const hValRight = ((effL2 - 17.50) / 2).toFixed(1);

    freeTexts.push({ id: "note_l_t", text: `${hValLeft} م`, x: p1.x + 18, y: (p1.y + y_mid_left) / 2, fontSize: 12, isBold: true, angle: -90 });
    freeTexts.push({ id: "note_l_b", text: `${hValLeft} م`, x: p4.x + 18, y: (p4.y + y_mid_left) / 2, fontSize: 12, isBold: true, angle: -90 });
    freeTexts.push({ id: "note_r_t", text: `${hValRight} م`, x: p2.x - 18, y: (p2.y + y_mid_right) / 2, fontSize: 12, isBold: true, angle: 90 });
    freeTexts.push({ id: "note_r_b", text: `${hValRight} م`, x: p3.x - 18, y: (y_mid_right + p3.y) / 2, fontSize: 12, isBold: true, angle: 90 });
  }

  // Draw external border labels
  borderLabels.push({
    id: "border_1",
    text: `${effW1Dir} ${effW1.toFixed(2)} م`,
    x: centerX,
    y: p1.y - 18,
    fontSize: 14,
    angle: 0
  });

  borderLabels.push({
    id: "border_2",
    text: `${effW2Dir} ${effW2.toFixed(2)} م`,
    x: centerX,
    y: p4.y + 22,
    fontSize: 14,
    angle: 0
  });

  borderLabels.push({
    id: "border_3",
    text: `${effL1Dir} ${effL1.toFixed(2)} م`,
    x: p1.x - 22,
    y: centerY,
    fontSize: 14,
    angle: -90
  });

  borderLabels.push({
    id: "border_4",
    text: `${effL2Dir} ${effL2.toFixed(2)} م`,
    x: p2.x + 22,
    y: centerY,
    fontSize: 14,
    angle: 90
  });

  // Reset viewport zoom & pan to ensure new drawing fits cleanly
  zoomScale = 1.0;
  panX = 0;
  panY = 0;
  applyViewportTransform();

  preventLabelOverlap(); // Auto layout to prevent overlapping text boxes

  closeStartModal();
  renderSVG();
  saveState();
  } catch (err) {
    alert("حدث خطأ أثناء رسم الأرض: " + err.message);
    console.error(err);
  }
}

// ----------------------------------------------------
// Smart Label Overlap Prevention (Collision Detection)
// ----------------------------------------------------
function preventLabelOverlap() {
  let placed = [];
  
  // Combine all labels we want to process
  let checkList = [
      ...splitLines.map(l => ({ ref: l, type: 'splitLine', x: l.labelX, y: l.labelY, angle: l.angle || 0 })),
      ...borderLabels.map(b => ({ ref: b, type: 'borderLabel', x: b.x, y: b.y, angle: b.angle || 0 })),
      ...freeTexts.map(t => ({ ref: t, type: 'freeText', x: t.x, y: t.y, angle: t.angle || 0 }))
  ];
  
  checkList.forEach(item => {
      let text = item.ref.label || item.ref.text;
      if (!text) return; 
      
      // We only apply this to perfectly horizontal labels to simplify AABB and avoid messing up angled labels
      if (item.angle !== 0) return;
      
      let fontSize = parseFloat(item.ref.fontSize || "13");
      let w = 0, h = 0;
      if (item.type === 'splitLine') {
          w = text.length * 7 + 10;
          h = 20;
      } else {
          w = text.length * (fontSize * 0.6) + 12;
          h = fontSize * 1.6;
      }
      
      let cx = item.x;
      let cy = item.y;
      
      let hw = w / 2;
      let hh = h / 2;
      
      let shiftY = 0;
      let stepCount = 0;
      let hasCollision = true;
      
      while (hasCollision && stepCount < 20) {
          hasCollision = false;
          let testY = cy + shiftY;
          for (let p of placed) {
              // Add a small padding to prevent touching
              if (Math.abs(cx - p.x) < (hw + p.hw + 4) && 
                  Math.abs(testY - p.y) < (hh + p.hh + 4)) {
                  hasCollision = true;
                  break;
              }
          }
          if (hasCollision) {
              stepCount++;
              let sign = stepCount % 2 === 1 ? -1 : 1;
              let mult = Math.ceil(stepCount / 2);
              shiftY = sign * mult * 28; // 28px vertical steps
          }
      }
      
      if (shiftY !== 0) {
          if (item.type === 'splitLine') {
              item.ref.originalLabelY = item.ref.labelY;
              item.ref.originalLabelX = item.ref.labelX;
              item.ref.labelY += shiftY;
          } else {
              item.ref.originalY = item.ref.y;
              item.ref.originalX = item.ref.x;
              item.ref.y += shiftY;
          }
      }
      
      placed.push({ x: cx, y: cy + shiftY, hw: hw, hh: hh });
  });
}

// ----------------------------------------------------
// Rendering Engine
// ----------------------------------------------------
function renderSVG() {
  const shapesGroup = document.getElementById("shapesGroup");
  const waterwaysGroup = document.getElementById("waterwaysGroup");
  const splitLinesGroup = document.getElementById("splitLinesGroup");
  const borderLabelsGroup = document.getElementById("borderLabelsGroup");
  const notesGroup = document.getElementById("notesGroup");

  shapesGroup.innerHTML = "";
  waterwaysGroup.innerHTML = "";
  splitLinesGroup.innerHTML = "";
  borderLabelsGroup.innerHTML = "";
  notesGroup.innerHTML = "";

  const bgRect = document.querySelector("#dallalSvg > rect");
  let showBg = true;
  const chk = document.getElementById("chkAgriBackground");
  if (chk) showBg = chk.checked;
  const printChk = document.getElementById("chkPrintAgriBackground");
  if (printChk && document.getElementById("printOverlay").style.display === "block") {
    showBg = printChk.checked;
  }

  const bgImg = document.getElementById("agriBgImage");
  if (bgImg) {
    if (typeof AGRI_BG_BASE64 !== "undefined" && showBg) {
      bgImg.setAttribute("href", AGRI_BG_BASE64);
      bgImg.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", AGRI_BG_BASE64);
    } else {
      bgImg.setAttribute("href", "");
      bgImg.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "");
    }
  }

  // 1. Draw Waterways
  waterways.forEach(w => {
    const pointsStr = w.points.map(p => `${p.x},${p.y}`).join(" ");
    
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", pointsStr);
    polygon.setAttribute("class", "waterway");
    polygon.setAttribute("vector-effect", "non-scaling-stroke");
    polygon.setAttribute("data-id", w.id);
    polygon.setAttribute("data-type", "waterway");
    
    if (w.stats) {
      polygon.onmousemove = (e) => {
        showInspectorTooltip(e, {
          name: "المجرى المائي (ترعة)",
          isWaterway: true,
          area: w.stats.area,
          width: w.stats.width,
          length: w.stats.length
        });
      };
      polygon.onmouseleave = hideInspectorTooltip;
    }

    polygon.onclick = (e) => onElementClick(e, 'waterway', w.id);
    polygon.addEventListener("touchstart", (e) => {
      e.stopPropagation();
      onElementClick(e, 'waterway', w.id);
    });
    waterwaysGroup.appendChild(polygon);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", w.labelX);
    text.setAttribute("y", w.labelY);
    text.setAttribute("fill", "#006064");
    text.setAttribute("font-size", "14");
    text.setAttribute("font-weight", "bold");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("class", "draggable-label");
    text.setAttribute("data-id", w.id);
    text.setAttribute("data-type", "waterwayLabel");
    if (w.angle) {
      text.setAttribute("transform", `rotate(${w.angle}, ${w.labelX}, ${w.labelY})`);
    }
    text.textContent = w.label;
    waterwaysGroup.appendChild(text);
  });

  // 2. Draw Land Slices (shapes)
  shapes.forEach(s => {
    const pointsStr = s.points.map(p => `${p.x},${p.y}`).join(" ");
    
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", pointsStr);
    polygon.setAttribute("data-id", s.id);
    polygon.setAttribute("data-color", s.color || "#ffffff");
    
    let activeClass = "clickable-shape";
    if (selectedElement && selectedElement.type === 'shape' && selectedElement.id === s.id) {
      activeClass += " active";
    }
    polygon.setAttribute("class", activeClass);
    
    let showBg = true;
    const chk = document.getElementById("chkAgriBackground");
    if (chk) showBg = chk.checked;
    
    // Check if we are inside print overlay and if it has its own toggle
    const printChk = document.getElementById("chkPrintAgriBackground");
    if (printChk && document.getElementById("printOverlay").style.display === "block") {
      showBg = printChk.checked;
    }

    if (showBg && (!s.color || s.color === "#ffffff" || s.color === "#f1f8e9" || s.color === "#e8f5e9")) {
      polygon.style.fill = "url(#agriPattern)";
      polygon.style.fillOpacity = "1";
    } else {
      polygon.style.fill = s.color || "#ffffff";
      polygon.style.fillOpacity = "1";
    }
    
    polygon.setAttribute("stroke", "#000000");
    polygon.setAttribute("stroke-width", "6");
    polygon.setAttribute("vector-effect", "non-scaling-stroke");
    polygon.onclick = (e) => onElementClick(e, 'shape', s.id);
    polygon.addEventListener("touchstart", (e) => {
      e.stopPropagation();
      onElementClick(e, 'shape', s.id);
    });
    shapesGroup.appendChild(polygon);

    // Parcel inner Text (Owner, Area and Notes)
    const textGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    textGroup.setAttribute("class", "draggable-label");
    textGroup.setAttribute("data-id", s.id);
    textGroup.setAttribute("data-type", "shapeText");
    textGroup.onclick = (e) => onElementClick(e, 'shape', s.id);
    textGroup.addEventListener("touchstart", (e) => {
      e.stopPropagation();
      onElementClick(e, 'shape', s.id);
    });

    // Calculate bounding box of the shape
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    s.points.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });
    const shapeW = maxX - minX;
    const shapeH = maxY - minY;

    // 1. Draw standalone Area text (rotated -90) at 25% height
    if (s.area && s.area.sqm) {
      const areaGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      const areaX = s.textX;
      let areaY = minY + shapeH * 0.25;
      if (activeTemplateType === 'mixed_waterway_new') {
        areaY = minY + shapeH * 0.85; // Move to bottom to avoid waterway and text box
      }
      
      areaGroup.setAttribute("class", "draggable-label");
      areaGroup.setAttribute("data-type", "shapeAreaText");
      areaGroup.setAttribute("transform", `rotate(-90, ${areaX}, ${areaY})`);
      
      const areaText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      areaText.setAttribute("x", areaX);
      areaText.setAttribute("y", areaY);
      areaText.setAttribute("fill", "#000000");
      areaText.setAttribute("font-size", "15");
      areaText.setAttribute("font-weight", "bold");
      areaText.setAttribute("text-anchor", "middle");
      
      const sqmFormatted = Number.isInteger(s.area.sqm) ? s.area.sqm : s.area.sqm.toFixed(2);
      areaText.textContent = `${sqmFormatted} م²`;
      
      areaGroup.appendChild(areaText);
      shapesGroup.appendChild(areaGroup);
    }

    // Background card for readability on top of image (for owner and notes)
    const mainLines = [];
    if (s.owner) {
      mainLines.push({ text: s.owner, isBold: true, fontSize: "14", color: "#000000" });
    }

    if (s.notes) {
      const noteLines = s.notes.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      noteLines.forEach(lineText => {
        mainLines.push({ text: lineText, isBold: false, fontSize: "11.5", color: "#555555" });
      });
    }

    const conversionLines = [];
    if (s.area && s.area.sqm && showFeddanConversion) {
      const detail = sqmToFeddanCaratShares(s.area.sqm);
      conversionLines.push({ text: `${detail.feddan} فدان`, isBold: true, fontSize: "12.5", color: "#1b5e20" });
      conversionLines.push({ text: `${detail.carat} قيراط`, isBold: true, fontSize: "12.5", color: "#1b5e20" });
      conversionLines.push({ text: `${detail.shares} سهم`, isBold: true, fontSize: "12.5", color: "#1b5e20" });
    }

    if (mainLines.length > 0 || conversionLines.length > 0 || showFeddanConversion === false) {
      let maxChars = 0;
      mainLines.forEach(l => { maxChars = Math.max(maxChars, l.text.length); });
      conversionLines.forEach(l => { maxChars = Math.max(maxChars, l.text.length); });

      // Unscaled box dimensions
      const baseCharWidth = 8.5;
      const baseLineHeight = 23;
      
      const bottomFieldPadding = 8;
      const bottomFieldH = showFeddanConversion ? (20 + 8 + 3 * baseLineHeight + bottomFieldPadding * 2) : (24 + bottomFieldPadding * 2);
      const bottomFieldW = showFeddanConversion ? 130 : 170;

      const unscaledBoxW = Math.max(bottomFieldW + 24, maxChars * baseCharWidth + 24);
      const unscaledBoxH = 12 + mainLines.length * baseLineHeight + 10 + bottomFieldH + 12;

      // Calculate scale factors
      const hScaleX = (shapeW * 0.85) / unscaledBoxW;
      const hScaleY = (shapeH * 0.85) / unscaledBoxH;
      const hScale = Math.min(1.0, hScaleX, hScaleY);

      const vScaleX = (shapeH * 0.85) / unscaledBoxW;
      const vScaleY = (shapeW * 0.85) / unscaledBoxH;
      const vScale = Math.min(1.0, vScaleX, vScaleY);

      let scaleFactor = hScale;
      let rotateAngle = 0;

      // If vertical orientation is significantly better, rotate the text
      if (vScale > hScale + 0.15) {
        scaleFactor = vScale;
        rotateAngle = -90;
      }

      // Limit scale factor to a minimum to keep text readable
      scaleFactor = Math.max(0.45, scaleFactor);

      // Scaled dimensions
      const boxW = unscaledBoxW * scaleFactor;
      const boxH = unscaledBoxH * scaleFactor;
      const boxX = s.textX - boxW / 2;
      const boxY = s.textY - boxH / 2;

      // Rotate group if needed
      if (rotateAngle !== 0) {
        textGroup.setAttribute("transform", `rotate(${rotateAngle}, ${s.textX}, ${s.textY})`);
      }

      if (showBg) {
        const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        bgRect.setAttribute("class", "text-bg-card");
        bgRect.setAttribute("x", boxX);
        bgRect.setAttribute("y", boxY);
        bgRect.setAttribute("width", boxW);
        bgRect.setAttribute("height", boxH);
        bgRect.setAttribute("fill", "#ffffff");
        bgRect.setAttribute("fill-opacity", "0.85");
        bgRect.setAttribute("stroke", "#1b5e20");
        bgRect.setAttribute("stroke-width", "1.5");
        bgRect.setAttribute("rx", "6");
        bgRect.setAttribute("ry", "6");
        bgRect.setAttribute("pointer-events", "none");
        textGroup.appendChild(bgRect);
      }

      // Draw all main text lines
      let currentY = boxY + 12 * scaleFactor;
      mainLines.forEach((line, idx) => {
        const tSpan = document.createElementNS("http://www.w3.org/2000/svg", "text");
        tSpan.setAttribute("x", s.textX);
        tSpan.setAttribute("y", currentY + 16 * scaleFactor);
        tSpan.setAttribute("fill", line.color);
        tSpan.setAttribute("font-size", parseFloat(line.fontSize) * scaleFactor);
        if (line.isBold) {
          tSpan.setAttribute("font-weight", "bold");
        }
        tSpan.setAttribute("text-anchor", "middle");
        tSpan.textContent = line.text;
        textGroup.appendChild(tSpan);
        currentY += baseLineHeight * scaleFactor;
      });

      // Spacer and bottom field container
      currentY += 6 * scaleFactor;

      const fieldW = boxW - 16 * scaleFactor;
      const fieldH = bottomFieldH * scaleFactor;
      const fieldX = s.textX - fieldW / 2;
      const fieldY = currentY;

      // Draw the bottom field container
      const fieldRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      fieldRect.setAttribute("x", fieldX);
      fieldRect.setAttribute("y", fieldY);
      fieldRect.setAttribute("width", fieldW);
      fieldRect.setAttribute("height", fieldH);
      fieldRect.setAttribute("fill", showFeddanConversion ? "#e8f5e9" : "#f1f8e9");
      fieldRect.setAttribute("stroke", showFeddanConversion ? "#c8e6c9" : "#d8eed8");
      fieldRect.setAttribute("stroke-width", "1");
      fieldRect.setAttribute("rx", 5 * scaleFactor);
      fieldRect.setAttribute("ry", 5 * scaleFactor);
      fieldRect.setAttribute("pointer-events", "none");
      textGroup.appendChild(fieldRect);

      if (showFeddanConversion) {
        // 1. Draw button at the top of the box
        const btnW = 100 * scaleFactor;
        const btnH = 20 * scaleFactor;
        const btnX = s.textX;
        const btnY = fieldY + bottomFieldPadding * scaleFactor;

        const btnGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        btnGroup.setAttribute("style", "cursor: pointer;");

        const btnRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        btnRect.setAttribute("x", btnX - btnW / 2);
        btnRect.setAttribute("y", btnY);
        btnRect.setAttribute("width", btnW);
        btnRect.setAttribute("height", btnH);
        btnRect.setAttribute("fill", "#2e7d32");
        btnRect.setAttribute("rx", 3 * scaleFactor);
        btnRect.setAttribute("ry", 3 * scaleFactor);
        btnGroup.appendChild(btnRect);

        const btnTxt = document.createElementNS("http://www.w3.org/2000/svg", "text");
        btnTxt.setAttribute("x", btnX);
        btnTxt.setAttribute("y", btnY + btnH / 2 + 3.5 * scaleFactor);
        btnTxt.setAttribute("fill", "#ffffff");
        btnTxt.setAttribute("font-size", 9.5 * scaleFactor);
        btnTxt.setAttribute("font-weight", "bold");
        btnTxt.setAttribute("text-anchor", "middle");
        btnTxt.textContent = "⚙️ خيارات التحويل";
        btnGroup.appendChild(btnTxt);

        btnGroup.onclick = (e) => {
          e.stopPropagation();
          showCaratConversionModal();
        };
        btnGroup.addEventListener("touchstart", (e) => {
          e.stopPropagation();
        });

        textGroup.appendChild(btnGroup);

        // 2. Draw conversion lines below the button
        let convY = btnY + btnH + 6 * scaleFactor;
        conversionLines.forEach((line, idx) => {
          const tSpan = document.createElementNS("http://www.w3.org/2000/svg", "text");
          tSpan.setAttribute("x", s.textX);
          tSpan.setAttribute("y", convY + 14 * scaleFactor);
          tSpan.setAttribute("fill", line.color);
          tSpan.setAttribute("font-size", parseFloat(line.fontSize) * scaleFactor);
          if (line.isBold) {
            tSpan.setAttribute("font-weight", "bold");
          }
          tSpan.setAttribute("text-anchor", "middle");
          tSpan.textContent = line.text;
          textGroup.appendChild(tSpan);
          convY += baseLineHeight * scaleFactor;
        });
      } else {
        // Draw big button inside the box
        const btnW = 150 * scaleFactor;
        const btnH = 24 * scaleFactor;
        const btnX = s.textX;
        const btnY = fieldY + bottomFieldPadding * scaleFactor;

        const btnGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        btnGroup.setAttribute("style", "cursor: pointer;");

        const btnRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        btnRect.setAttribute("x", btnX - btnW / 2);
        btnRect.setAttribute("y", btnY);
        btnRect.setAttribute("width", btnW);
        btnRect.setAttribute("height", btnH);
        btnRect.setAttribute("fill", "#2e7d32");
        btnRect.setAttribute("rx", 4 * scaleFactor);
        btnRect.setAttribute("ry", 4 * scaleFactor);
        btnGroup.appendChild(btnRect);

        const btnTxt = document.createElementNS("http://www.w3.org/2000/svg", "text");
        btnTxt.setAttribute("x", btnX);
        btnTxt.setAttribute("y", btnY + btnH / 2 + 4 * scaleFactor);
        btnTxt.setAttribute("fill", "#ffffff");
        btnTxt.setAttribute("font-size", 10.5 * scaleFactor);
        btnTxt.setAttribute("font-weight", "bold");
        btnTxt.setAttribute("text-anchor", "middle");
        btnTxt.textContent = "⚖️ تحويل لفدان/قيراط/سهم";
        btnGroup.appendChild(btnTxt);

        btnGroup.onclick = (e) => {
          e.stopPropagation();
          showCaratConversionModal();
        };
        btnGroup.addEventListener("touchstart", (e) => {
          e.stopPropagation();
        });

        textGroup.appendChild(btnGroup);
      }
    }

    shapesGroup.appendChild(textGroup);

    // Render interactive subShapes (invisible overlays)
    if (s.subShapes) {
      s.subShapes.forEach(sub => {
        const subPts = sub.points.map(p => `${p.x},${p.y}`).join(" ");
        const subPoly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        subPoly.setAttribute("points", subPts);
        subPoly.setAttribute("fill", "transparent");
        subPoly.setAttribute("stroke", "none");
        subPoly.style.pointerEvents = "all";
        
        subPoly.onmousemove = (e) => {
          showInspectorTooltip(e, {
            name: sub.name,
            isWaterway: false,
            area: sub.area,
            topWidth: sub.topWidth,
            botWidth: sub.botWidth,
            leftLen: sub.leftLen,
            rightLen: sub.rightLen
          });
        };
        subPoly.onmouseleave = hideInspectorTooltip;
        if (sub.name === "القطعة الغربية") {
          subPoly.onclick = (e) => onElementClick(e, 'waterway_west', s.id);
        } else {
          subPoly.onclick = (e) => onElementClick(e, 'shape', s.id);
        }
        
        shapesGroup.appendChild(subPoly);
      });
    }
  });

  // 3. Draw Split Lines
  splitLines.forEach(l => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", l.x1);
    line.setAttribute("y1", l.y1);
    line.setAttribute("x2", l.x2);
    line.setAttribute("y2", l.y2);
    line.setAttribute("class", "split-line");
    line.setAttribute("data-id", l.id);
    if (l.isDashed) {
      line.setAttribute("stroke-dasharray", "6, 4");
    }
    line.setAttribute("stroke", l.color || "#000000");
    line.setAttribute("stroke-width", "4");
    line.setAttribute("vector-effect", "non-scaling-stroke");
    line.onclick = (e) => onElementClick(e, 'splitLine', l.id);
    line.addEventListener("touchstart", (e) => {
      e.stopPropagation();
      onElementClick(e, 'splitLine', l.id);
    });
    splitLinesGroup.appendChild(line);

    // Helper handles for endpoints (only when selected)
    if (selectedElement && selectedElement.type === 'splitLine' && selectedElement.id === l.id) {
      const handle1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      handle1.setAttribute("cx", l.x1);
      handle1.setAttribute("cy", l.y1);
      handle1.setAttribute("r", 7);
      handle1.setAttribute("fill", "#c62828");
      handle1.setAttribute("class", "draggable-label");
      handle1.setAttribute("data-type", "splitLineEnd");
      handle1.setAttribute("data-id", l.id);
      handle1.setAttribute("data-index", "1");
      splitLinesGroup.appendChild(handle1);

      const handle2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      handle2.setAttribute("cx", l.x2);
      handle2.setAttribute("cy", l.y2);
      handle2.setAttribute("r", 7);
      handle2.setAttribute("fill", "#c62828");
      handle2.setAttribute("class", "draggable-label");
      handle2.setAttribute("data-type", "splitLineEnd");
      handle2.setAttribute("data-id", l.id);
      handle2.setAttribute("data-index", "2");
      splitLinesGroup.appendChild(handle2);
    }

    // Split Line Label
    if (l.label) {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "draggable-label");
      g.setAttribute("data-id", l.id);
      g.setAttribute("data-type", "splitLineLabel");
      if (l.angle) {
        g.setAttribute("transform", `rotate(${l.angle}, ${l.labelX}, ${l.labelY})`);
      }

      const boxW = l.label.length * 7 + 10;
      const boxH = 20;
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", l.labelX - boxW / 2);
      rect.setAttribute("y", l.labelY - boxH / 1.5 + 1);
      rect.setAttribute("width", boxW);
      rect.setAttribute("height", boxH);
      rect.setAttribute("fill", "white");
      rect.setAttribute("stroke", "#b0bec5");
      rect.setAttribute("stroke-width", "1.5");
      rect.setAttribute("rx", "3");

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", l.labelX);
      text.setAttribute("y", l.labelY);
      text.setAttribute("fill", "#000000");
      text.setAttribute("font-size", "12");
      text.setAttribute("font-weight", "bold");
      text.setAttribute("text-anchor", "middle");
      text.textContent = l.label;

      if (l.originalLabelX !== undefined && l.originalLabelY !== undefined) {
        const guideLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        guideLine.setAttribute("x1", l.originalLabelX);
        guideLine.setAttribute("y1", l.originalLabelY);
        guideLine.setAttribute("x2", l.labelX);
        guideLine.setAttribute("y2", l.labelY);
        guideLine.setAttribute("stroke", "#999999");
        guideLine.setAttribute("stroke-width", "1.2");
        guideLine.setAttribute("stroke-dasharray", "4, 4");
        g.appendChild(guideLine);
      }

      g.appendChild(rect);
      g.appendChild(text);

      g.onclick = (e) => onElementClick(e, 'splitLine', l.id);
      g.addEventListener("touchstart", (e) => {
        e.stopPropagation();
        onElementClick(e, 'splitLine', l.id);
      });
      splitLinesGroup.appendChild(g);
    }
  });

  // 4. Draw Outer Border Labels
  borderLabels.forEach(b => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "draggable-label");
    g.setAttribute("data-id", b.id);
    g.setAttribute("data-type", "borderLabel");
    if (b.angle) {
      g.setAttribute("transform", `rotate(${b.angle}, ${b.x}, ${b.y})`);
    }

    const fontSize = parseFloat(b.fontSize || "13.5");
    const boxW = b.text.length * (fontSize * 0.6) + 12;
    const boxH = fontSize * 1.6;

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", b.x - boxW / 2);
    rect.setAttribute("y", b.y - boxH / 1.5 + 2);
    rect.setAttribute("width", boxW);
    rect.setAttribute("height", boxH);
    rect.setAttribute("fill", "white");
    rect.setAttribute("stroke", "#b0bec5");
    rect.setAttribute("stroke-width", "1.5");
    rect.setAttribute("rx", "3");

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", b.x);
    text.setAttribute("y", b.y);
    text.setAttribute("fill", b.color || "#000000");
    text.setAttribute("font-size", b.fontSize || "13.5");
    text.setAttribute("font-weight", b.isBold !== false ? "bold" : "normal");
    text.setAttribute("text-anchor", "middle");
    text.textContent = b.text;

    if (b.originalX !== undefined && b.originalY !== undefined) {
      const guideLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      guideLine.setAttribute("x1", b.originalX);
      guideLine.setAttribute("y1", b.originalY);
      guideLine.setAttribute("x2", b.x);
      guideLine.setAttribute("y2", b.y);
      guideLine.setAttribute("stroke", "#999999");
      guideLine.setAttribute("stroke-width", "1.2");
      guideLine.setAttribute("stroke-dasharray", "4, 4");
      g.appendChild(guideLine);
    }

    g.appendChild(rect);
    g.appendChild(text);

    g.onclick = (e) => onElementClick(e, 'borderLabel', b.id);
    g.addEventListener("touchstart", (e) => {
      e.stopPropagation();
      onElementClick(e, 'borderLabel', b.id);
    });
    borderLabelsGroup.appendChild(g);
  });

  // 5. Draw Free Custom Texts
  freeTexts.forEach(t => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "draggable-label");
    g.setAttribute("data-id", t.id);
    g.setAttribute("data-type", "freeText");
    if (t.angle) {
      g.setAttribute("transform", `rotate(${t.angle}, ${t.x}, ${t.y})`);
    }

    const fontSize = parseFloat(t.fontSize || "13");
    const boxW = t.text.length * (fontSize * 0.6) + 12;
    const boxH = fontSize * 1.6;

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", t.x - boxW / 2);
    rect.setAttribute("y", t.y - boxH / 1.5 + 2);
    rect.setAttribute("width", boxW);
    rect.setAttribute("height", boxH);
    rect.setAttribute("fill", "white");
    rect.setAttribute("stroke", "#b0bec5");
    rect.setAttribute("stroke-width", "1.5");
    rect.setAttribute("rx", "3");

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", t.x);
    text.setAttribute("y", t.y);
    text.setAttribute("fill", t.color || "#000000");
    text.setAttribute("font-size", t.fontSize || "13");
    text.setAttribute("font-weight", t.isBold ? "bold" : "normal");
    text.setAttribute("text-anchor", "middle");
    text.textContent = t.text;

    if (t.originalX !== undefined && t.originalY !== undefined) {
      const guideLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      guideLine.setAttribute("x1", t.originalX);
      guideLine.setAttribute("y1", t.originalY);
      guideLine.setAttribute("x2", t.x);
      guideLine.setAttribute("y2", t.y);
      guideLine.setAttribute("stroke", "#999999");
      guideLine.setAttribute("stroke-width", "1.2");
      guideLine.setAttribute("stroke-dasharray", "4, 4");
      g.appendChild(guideLine);
    }

    g.appendChild(rect);
    g.appendChild(text);

    g.onclick = (e) => onElementClick(e, 'freeText', t.id);
    g.addEventListener("touchstart", (e) => {
      e.stopPropagation();
      onElementClick(e, 'freeText', t.id);
    });
    notesGroup.appendChild(g);
  });
}

// ----------------------------------------------------
// Mouse & Touch Dragging and Panning Handlers
// ----------------------------------------------------
function onSvgMouseDown(e) {
  const target = e.target;
  const parent = target.parentElement;
  
  let draggableEl = null;
  if (target.classList.contains("draggable-label")) draggableEl = target;
  else if (parent && parent.classList.contains("draggable-label")) draggableEl = parent;

  if (draggableEl) {
    // DRAG LABEL MODE
    const type = draggableEl.getAttribute("data-type");
    const id = draggableEl.getAttribute("data-id");
    const index = draggableEl.getAttribute("data-index");

    const coords = getSvgCoords(e);
    let offset = { x: 0, y: 0 };

    if (type === 'freeText') {
      const t = freeTexts.find(x => x.id === id);
      if (t) offset = { x: coords.x - t.x, y: coords.y - t.y };
    } else if (type === 'borderLabel') {
      const b = borderLabels.find(x => x.id === id);
      if (b) offset = { x: coords.x - b.x, y: coords.y - b.y };
    } else if (type === 'shapeText') {
      const s = shapes.find(x => x.id === id);
      if (s) offset = { x: coords.x - s.textX, y: coords.y - s.textY };
    } else if (type === 'splitLineLabel') {
      const l = splitLines.find(x => x.id === id);
      if (l) offset = { x: coords.x - l.labelX, y: coords.y - l.labelY };
    } else if (type === 'waterwayLabel') {
      const w = waterways.find(x => x.id === id);
      if (w) offset = { x: coords.x - w.labelX, y: coords.y - w.labelY };
    } else if (type === 'splitLineEnd') {
      const l = splitLines.find(x => x.id === id);
      if (l) {
        if (index === "1") offset = { x: coords.x - l.x1, y: coords.y - l.y1 };
        else offset = { x: coords.x - l.x2, y: coords.y - l.y2 };
      }
    }

    activeDrag = { type, id, index: index ? parseInt(index) : null, offset };
    e.stopPropagation();
  } else {
    // PAN CANVAS MODE
    if (!isCroquiPinned) {
      isPanning = true;
      document.querySelector(".canvas-wrapper").classList.add("panning");
      if (e.touches && e.touches.length === 1) {
        startPanPoint = { x: e.touches[0].clientX - panX, y: e.touches[0].clientY - panY };
      } else {
        startPanPoint = { x: e.clientX - panX, y: e.clientY - panY };
      }
    }
  }
}

function onSvgMouseMove(e) {
  if (activeDrag) {
    const coords = getSvgCoords(e);
    const newX = Math.round(coords.x - activeDrag.offset.x);
    const newY = Math.round(coords.y - activeDrag.offset.y);

    if (activeDrag.type === 'freeText') {
      const t = freeTexts.find(x => x.id === activeDrag.id);
      if (t) { t.x = newX; t.y = newY; }
    } else if (activeDrag.type === 'borderLabel') {
      const b = borderLabels.find(x => x.id === activeDrag.id);
      if (b) { b.x = newX; b.y = newY; }
    } else if (activeDrag.type === 'shapeText') {
      const s = shapes.find(x => x.id === activeDrag.id);
      if (s) { s.textX = newX; s.textY = newY; }
    } else if (activeDrag.type === 'splitLineLabel') {
      const l = splitLines.find(x => x.id === activeDrag.id);
      if (l) { l.labelX = newX; l.labelY = newY; }
    } else if (activeDrag.type === 'waterwayLabel') {
      const w = waterways.find(x => x.id === activeDrag.id);
      if (w) { w.labelX = newX; w.labelY = newY; }
    } else if (activeDrag.type === 'splitLineEnd') {
      const l = splitLines.find(x => x.id === activeDrag.id);
      if (l) {
        if (activeDrag.index === 1) {
          l.x1 = newX; l.y1 = newY;
        } else {
          l.x2 = newX; l.y2 = newY;
        }
      }
    }
    renderSVG();
  } else if (isPanning) {
    let clientX, clientY;
    if (e.touches && e.touches.length === 1) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    panX = clientX - startPanPoint.x;
    panY = clientY - startPanPoint.y;
    applyViewportTransform();
  }
}

function onSvgMouseUp() {
  if (activeDrag) {
    activeDrag = null;
    saveState();
  }
  if (isPanning) {
    isPanning = false;
    document.querySelector(".canvas-wrapper").classList.remove("panning");
    saveState();
  }
}

// Touch event bindings
function onSvgTouchStart(e) {
  if (e.touches.length === 1) {
    onSvgMouseDown(e);
  } else if (e.touches.length === 2) {
    // Pinch starting distance
    lastTouchDist = getTouchDistance(e);
  }
}

function onSvgTouchMove(e) {
  if (e.touches.length === 1) {
    onSvgMouseMove(e);
    if (activeDrag || isPanning) e.preventDefault();
  } else if (e.touches.length === 2) {
    // Pinch to Zoom gesture
    e.preventDefault();
    if (!isCroquiPinned) {
      const dist = getTouchDistance(e);
      const factor = dist / lastTouchDist;
      if (Math.abs(1 - factor) > 0.01) {
        zoomScale = Math.min(Math.max(0.4, zoomScale * factor), 4.0);
        lastTouchDist = dist;
        applyViewportTransform();
      }
    }
  }
}

function onSvgTouchUp(e) {
  onSvgMouseUp();
}

function getTouchDistance(e) {
  const dx = e.touches[0].clientX - e.touches[1].clientX;
  const dy = e.touches[0].clientY - e.touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// Wheel zoom handling
function onSvgWheel(e) {
  if (isCroquiPinned) return;
  e.preventDefault();
  const factor = e.deltaY > 0 ? 0.9 : 1.1;
  zoomScale = Math.min(Math.max(0.4, zoomScale * factor), 4.0);
  applyViewportTransform();
}

function togglePinCroqui() {
  isCroquiPinned = !isCroquiPinned;
  const btn = document.getElementById("pinCroquiBtn");
  if (isCroquiPinned) {
    btn.innerHTML = "📌 إلغاء تثبيت الكروكي";
    btn.style.backgroundColor = "#4caf50";
  } else {
    btn.innerHTML = "📌 تثبيت الكروكي";
    btn.style.backgroundColor = "#ff9800";
  }
}


// ----------------------------------------------------
// Free Edit Modal Logic
// ----------------------------------------------------
function openFreeEditModal() {
  const numPartners = parseInt(document.getElementById("start-partners")?.value || "1");
  const excludedTemplates = ['quad_diagonal', 'mixed_waterway_new', 'mixed_split_image'];
  
  if (numPartners === 1 || excludedTemplates.includes(activeTemplateType)) {
    // Single shape or non-applicable template => open startModal to edit main dims
    openStartModal();
    return;
  }

  // Ensure customPartnerWidths is initialized
  if (!customPartnerWidths || customPartnerWidths.length !== numPartners) {
    const w1 = parseArabicFloat(document.getElementById("start-w1").value);
    const w2 = parseArabicFloat(document.getElementById("start-w2").value);
    customPartnerWidths = [];
    for (let i = 0; i < numPartners; i++) {
      customPartnerWidths.push({
        top: w1 / numPartners,
        bot: w2 / numPartners
      });
    }
  }

  renderFreeEditTable();
  document.getElementById("freeEditModal").style.display = "block";
}

function closeFreeEditModal() {
  document.getElementById("freeEditModal").style.display = "none";
}

function renderFreeEditTable() {
  const tbody = document.getElementById("freeEditTableBody");
  tbody.innerHTML = "";
  
  customPartnerWidths.forEach((cw, i) => {
    const shape = shapes.find(s => s.id === "shape_" + (i + 1));
    const areaStr = shape && shape.area ? shape.area.sqm.toFixed(2) : "-";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">شريك ${i + 1}</td>
      <td style="padding: 10px; border: 1px solid #ddd;">
        <input type="number" step="0.01" class="free-edit-input" data-index="${i}" data-side="top" value="${cw.top.toFixed(4)}" style="width: 80px; text-align: center; padding: 5px;">
      </td>
      <td style="padding: 10px; border: 1px solid #ddd;">
        <input type="number" step="0.01" class="free-edit-input" data-index="${i}" data-side="bot" value="${cw.bot.toFixed(4)}" style="width: 80px; text-align: center; padding: 5px;">
      </td>
      <td style="padding: 10px; border: 1px solid #ddd; color: #1b5e20; font-weight: bold;">
        ${areaStr}
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll(".free-edit-input").forEach(inp => {
    inp.addEventListener("change", (e) => {
      const idx = parseInt(e.target.getAttribute("data-index"));
      const side = e.target.getAttribute("data-side");
      const newVal = parseArabicFloat(e.target.value);
      onFreeEditWidthChange(idx, side, newVal, e.target);
    });
  });
}

function onFreeEditWidthChange(idx, side, newVal, inputEl) {
  const oldVal = customPartnerWidths[idx][side];
  const diff = newVal - oldVal;

  // Determine neighbor to absorb the difference (try next, else previous)
  let targetIdx = idx + 1;
  if (idx === customPartnerWidths.length - 1) {
    targetIdx = idx - 1;
  }

  if (targetIdx < 0 || targetIdx >= customPartnerWidths.length) {
    alert("لا توجد قطعة مجاورة لتعديلها.");
    inputEl.value = oldVal.toFixed(4);
    return;
  }

  const neighborOldVal = customPartnerWidths[targetIdx][side];
  const neighborNewVal = neighborOldVal - diff;

  if (newVal < 0 || neighborNewVal < 0) {
    alert("التعديل غير ممكن لأن العرض سيصبح أقل من الصفر للحفاظ على المساحة الكلية.");
    inputEl.value = oldVal.toFixed(4);
    return;
  }

  customPartnerWidths[idx][side] = newVal;
  customPartnerWidths[targetIdx][side] = neighborNewVal;
  
  // Re-render table to reflect neighbor changes (areas will update upon applying)
  renderFreeEditTable();
}

function applyFreeEdit() {
  closeFreeEditModal();
  generateCustomLand(true); // Pass true to use the customWidths!
}

// ----------------------------------------------------
// UI Click & Editing Popups
// ----------------------------------------------------
let modalEditTarget = null; // { type, id }

function onSvgDoubleClick(e) {
  const target = e.target;
  const parent = target.parentElement;
  
  let matchEl = null;
  let type = null;
  let id = null;

  if (target.classList.contains("draggable-label") || target.classList.contains("clickable-shape") || target.classList.contains("split-line") || target.tagName === "line") {
    matchEl = target;
  } else if (parent && (parent.classList.contains("draggable-label") || parent.classList.contains("clickable-shape"))) {
    matchEl = parent;
  }

  if (matchEl) {
    type = matchEl.getAttribute("data-type");
    id = matchEl.getAttribute("data-id");
    if (!type && (matchEl.classList.contains("split-line") || matchEl.tagName === "line")) {
      type = "splitLine";
      id = matchEl.getAttribute("data-id");
    }
  }

  if (type && id) {
    openModalForElement(type, id);
  } else {
    // Double click zoom toggle on empty space
    if (zoomScale > 1.0) {
      zoomScale = 1.0;
      panX = 0;
      panY = 0;
    } else {
      zoomScale = 1.6;
      const coords = getSvgCoords(e);
      panX = 450 - coords.x * 1.6;
      panY = 280 - coords.y * 1.6;
    }
    applyViewportTransform();
    saveState();
  }
}

// ----------------------------------------------------
// Interactive Inspector (Tooltip)
// ----------------------------------------------------
function showInspectorTooltip(e, data) {
  const tooltip = document.getElementById("inspectorTooltip");
  if (!tooltip) return;
  
  const pct = totalAreaSqm > 0 ? ((data.area / totalAreaSqm) * 100).toFixed(2) : 0;
  
  let html = `<h4>${data.name}</h4>`;
  if (data.isWaterway) {
    html += `<p><span class="label">المساحة:</span> <span class="value">${data.area.toFixed(2)} م²</span></p>`;
    html += `<p><span class="label">الطول:</span> <span class="value">${data.length.toFixed(2)} م</span></p>`;
    html += `<p><span class="label">العرض:</span> <span class="value">${data.width.toFixed(2)} م</span></p>`;
  } else {
    html += `<p><span class="label">المساحة:</span> <span class="value">${data.area.toFixed(2)} م²</span></p>`;
    html += `<p><span class="label">العرض العلوي:</span> <span class="value">${data.topWidth.toFixed(2)} م</span></p>`;
    html += `<p><span class="label">العرض السفلي:</span> <span class="value">${data.botWidth.toFixed(2)} م</span></p>`;
    html += `<p><span class="label">الطول الأيمن:</span> <span class="value">${data.rightLen.toFixed(2)} م</span></p>`;
    html += `<p><span class="label">الطول الأيسر:</span> <span class="value">${data.leftLen.toFixed(2)} م</span></p>`;
    html += `<p><span class="label">المحيط:</span> <span class="value">${data.perimeter.toFixed(2)} م</span></p>`;
  }
  html += `<p><span class="label">النسبة من الإجمالي:</span> <span class="value" style="color: #64b5f6;">%${pct}</span></p>`;
  
  tooltip.innerHTML = html;
  tooltip.style.display = "block";
  
  // Position tooltip
  let left = e.clientX + 15;
  let top = e.clientY + 15;
  
  const rect = tooltip.getBoundingClientRect();
  if (left + rect.width > window.innerWidth) {
    left = e.clientX - rect.width - 15;
  }
  if (top + rect.height > window.innerHeight) {
    top = e.clientY - rect.height - 15;
  }
  
  tooltip.style.left = left + "px";
  tooltip.style.top = top + "px";
}

function hideInspectorTooltip() {
  const tooltip = document.getElementById("inspectorTooltip");
  if (tooltip) {
    tooltip.style.display = "none";
  }
}

function onElementClick(e, type, id) {
  if (e) e.stopPropagation();
  if (type === 'borderLabel' || type === 'splitLine' || (type === 'freeText' && id && id.startsWith('note_'))) {
    openStartModal();
    return;
  }
  selectedElement = { type, id };
  renderSVG();
  populateSidebarEditor();
  openModalForElement(type, id);
}

function openModalForElement(type, id) {
  selectedElement = { type, id };
  modalEditTarget = { type, id };

  const modal = document.getElementById("editModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalForm = document.getElementById("modalForm");
  const utilsPanel = document.getElementById("text-edit-utilities");
  const quickActions = document.getElementById("element-quick-actions");

  // Reset display
  utilsPanel.style.display = "none";
  quickActions.style.display = "none";

  const targetType = type === 'shapeText' ? 'shape' : type;

  if (targetType === 'shape') {
    const s = shapes.find(x => x.id === id);
    if (!s) return;
    modalTitle.textContent = "تعديل بيانات قطعة الأرض";
    modalForm.innerHTML = `
      <div class="editor-form-group">
        <label>اسم المالك:</label>
        <input type="text" id="modal-owner" value="${s.owner || ''}">
      </div>
      <div class="editor-form-group">
        <label>المساحة (بالمتر المربع):</label>
        <input type="text" inputmode="decimal" id="modal-sqm" value="${s.area.sqm || 0}">
      </div>
      <div class="editor-form-group">
        <label>اكتب ما تريد:</label>
        <textarea id="modal-notes" rows="3" style="width:100%; box-sizing:border-box; font-family:'Cairo'; font-size:12px;">${s.notes || ''}</textarea>
      </div>
      <div class="editor-form-group">
        <label>لون قطعة الأرض:</label>
        <select id="modal-color">
          ${colorsList.map(c => `<option value="${c.value}" ${s.color === c.value ? 'selected' : ''}>${c.name}</option>`).join("")}
        </select>
      </div>
    `;
  } else if (targetType === 'borderLabel') {
    const b = borderLabels.find(x => x.id === id);
    if (!b) return;
    modalTitle.textContent = "تعديل نص الحد / البعد";
    modalForm.innerHTML = `
      <div class="editor-form-group">
        <label>نص البعد أو الجار:</label>
        <input type="text" id="modal-border-text" value="${b.text || ''}">
      </div>
    `;
    // Show text styling utilities
    utilsPanel.style.display = "block";
    quickActions.style.display = "flex";
    document.getElementById("util-font-size").value = b.fontSize || 14;
    document.getElementById("util-angle").value = b.angle || 0;
    document.getElementById("util-bold").checked = b.isBold !== false;
    document.getElementById("util-color").value = b.color || "#000000";
  } else if (targetType === 'splitLine') {
    const l = splitLines.find(x => x.id === id);
    if (!l) return;
    modalTitle.textContent = "تعديل خط التقسيم";
    modalForm.innerHTML = `
      <div class="editor-form-group">
        <label>نص المسمى أو البعد:</label>
        <input type="text" id="modal-split-label" value="${l.label || ''}">
      </div>
      <div class="editor-form-group">
        <label style="display:flex; align-items:center; gap:5px; cursor:pointer;">
          <input type="checkbox" id="modal-split-dashed" ${l.isDashed ? 'checked' : ''}> خط متقطع
        </label>
      </div>
    `;
    utilsPanel.style.display = "block";
    quickActions.style.display = "flex";
    document.getElementById("util-font-size").value = 12;
    document.getElementById("util-angle").value = l.angle || 0;
    document.getElementById("util-bold").checked = true;
    document.getElementById("util-color").value = l.color || "#000000";
  } else if (targetType === 'freeText') {
    const t = freeTexts.find(x => x.id === id);
    if (!t) return;
    modalTitle.textContent = "تعديل النص المكتوب";
    modalForm.innerHTML = `
      <div class="editor-form-group">
        <label>محتوى النص:</label>
        <input type="text" id="modal-free-text" value="${t.text || ''}">
      </div>
    `;
    utilsPanel.style.display = "block";
    quickActions.style.display = "flex";
    document.getElementById("util-font-size").value = t.fontSize || 13;
    document.getElementById("util-angle").value = t.angle || 0;
    document.getElementById("util-bold").checked = t.isBold !== false;
    document.getElementById("util-color").value = t.color || "#000000";
  } else if (targetType === 'waterway_west' || targetType === 'waterway') {
    if (!customWaterwayData) {
      customWaterwayData = {
        leftTopMeters: (effL1 / 2) - 3.6,
        rightTopMeters: (effL2 / 2) - 3.6,
        leftWaterMeters: 7.20,
        rightWaterMeters: 7.20
      };
    }
    modalTitle.textContent = targetType === 'waterway' ? "أبعاد المجرى المائي" : "أبعاد القطعة الغربية";
    
    if (targetType === 'waterway') {
      modalForm.innerHTML = `
        <div class="editor-form-group">
          <label>عرض المجرى الأيسر (بالمتر):</label>
          <input type="text" inputmode="decimal" id="modal-water-left" value="${customWaterwayData.leftWaterMeters.toFixed(2)}">
        </div>
        <div class="editor-form-group">
          <label>عرض المجرى الأيمن (بالمتر):</label>
          <input type="text" inputmode="decimal" id="modal-water-right" value="${customWaterwayData.rightWaterMeters.toFixed(2)}">
        </div>
      `;
    } else {
      modalForm.innerHTML = `
        <div class="editor-form-group">
          <label>الطول الأيسر للقطعة الغربية (بالمتر):</label>
          <input type="text" inputmode="decimal" id="modal-west-left" value="${customWaterwayData.leftTopMeters.toFixed(2)}">
        </div>
        <div class="editor-form-group">
          <label>الطول الأيمن للقطعة الغربية (بالمتر):</label>
          <input type="text" inputmode="decimal" id="modal-west-right" value="${customWaterwayData.rightTopMeters.toFixed(2)}">
        </div>
      `;
    }
  }

  modal.style.display = "flex";
}

function updateUtilityField(field, value) {
  if (!modalEditTarget) return;
  const { type, id } = modalEditTarget;
  const targetType = type === 'shapeText' ? 'shape' : type;

  if (targetType === 'borderLabel') {
    const b = borderLabels.find(x => x.id === id);
    if (b) {
      if (field === 'fontSize' || field === 'angle') b[field] = parseFloat(value) || 0;
      else b[field] = value;
    }
  } else if (targetType === 'freeText') {
    const t = freeTexts.find(x => x.id === id);
    if (t) {
      if (field === 'fontSize' || field === 'angle') t[field] = parseFloat(value) || 0;
      else t[field] = value;
    }
  } else if (targetType === 'splitLine') {
    const l = splitLines.find(x => x.id === id);
    if (l) {
      if (field === 'angle') l.angle = parseFloat(value) || 0;
      if (field === 'color') l.color = value;
    }
  }

  renderSVG();
  saveStateDebounced();
}

function saveModalData() {
  if (!modalEditTarget) return;
  const { type, id } = modalEditTarget;
  const targetType = type === 'shapeText' ? 'shape' : type;

  if (targetType === 'shape') {
    const s = shapes.find(x => x.id === id);
    if (s) {
      s.owner = document.getElementById("modal-owner").value;
      s.area.sqm = parseFloat(document.getElementById("modal-sqm").value) || 0;
      s.notes = document.getElementById("modal-notes").value;
      s.color = document.getElementById("modal-color").value;
    }
  } else if (targetType === 'borderLabel') {
    const b = borderLabels.find(x => x.id === id);
    if (b) {
      b.text = document.getElementById("modal-border-text").value;
      b.fontSize = parseFloat(document.getElementById("util-font-size").value) || 14;
      b.angle = parseFloat(document.getElementById("util-angle").value) || 0;
      b.isBold = document.getElementById("util-bold").checked;
      b.color = document.getElementById("util-color").value;
    }
  } else if (targetType === 'splitLine') {
    const l = splitLines.find(x => x.id === id);
    if (l) {
      l.label = document.getElementById("modal-split-label").value;
      l.isDashed = document.getElementById("modal-split-dashed").checked;
      l.angle = parseFloat(document.getElementById("util-angle").value) || 0;
      l.color = document.getElementById("util-color").value;
    }
  } else if (targetType === 'freeText') {
    const t = freeTexts.find(x => x.id === id);
    if (t) {
      t.text = document.getElementById("modal-free-text").value;
      t.fontSize = parseFloat(document.getElementById("util-font-size").value) || 13;
      t.angle = parseFloat(document.getElementById("util-angle").value) || 0;
      t.isBold = document.getElementById("util-bold").checked;
      t.color = document.getElementById("util-color").value;
    }
  } else if (targetType === 'waterway') {
    if (customWaterwayData) {
      customWaterwayData.leftWaterMeters = parseFloat(document.getElementById("modal-water-left").value) || 7.20;
      customWaterwayData.rightWaterMeters = parseFloat(document.getElementById("modal-water-right").value) || 7.20;
      generateShapes();
    }
  } else if (targetType === 'waterway_west') {
    if (customWaterwayData) {
      customWaterwayData.leftTopMeters = parseFloat(document.getElementById("modal-west-left").value) || ((effL1 / 2) - 3.6);
      customWaterwayData.rightTopMeters = parseFloat(document.getElementById("modal-west-right").value) || ((effL2 / 2) - 3.6);
      generateShapes();
    }
  }

  modalEditTarget = null;
  closeModal();
  renderSVG();
  populateSidebarEditor();
  saveState();
}

function closeModal() {
  document.getElementById("editModal").style.display = "none";
}

// ----------------------------------------------------
// Sidebar Properties Editor Panel
// ----------------------------------------------------
function populateSidebarEditor() {
  const editorPanel = document.getElementById("element-editor");
  if (!selectedElement) {
    editorPanel.innerHTML = `<p class="empty-editor-hint">اضغط على أي قطعة أرض أو نص أو ضلع لتعديل بياناته هنا.</p>`;
    document.getElementById("editor-title").textContent = "محرر العنصر المحدد";
    return;
  }

  document.getElementById("editor-title").textContent = `محرر (${getElementTypeName()})`;

  let html = "";
  if (selectedElement.type === 'shape') {
    const s = shapes.find(x => x.id === selectedElement.id);
    if (s) {
      html = `
        <div class="editor-form-group">
          <label>اسم المالك:</label>
          <input type="text" value="${s.owner || ''}" oninput="updateSelectedShapeField('owner', this.value)">
        </div>
        <div class="editor-form-group">
          <label>المساحة (بالمتر المربع):</label>
          <input type="text" inputmode="decimal" value="${s.area.sqm || 0}" oninput="updateSelectedShapeArea('sqm', this.value)">
        </div>

        <div class="editor-form-group">
          <label>اكتب ما تريد:</label>
          <textarea rows="3" oninput="updateSelectedShapeField('notes', this.value)">${s.notes || ''}</textarea>
        </div>
        <div class="editor-form-group">
          <label>لون قطعة الأرض:</label>
          <select onchange="updateSelectedShapeField('color', this.value)">
            ${colorsList.map(c => `<option value="${c.value}" ${s.color === c.value ? 'selected' : ''}>${c.name}</option>`).join("")}
          </select>
        </div>
      `;
    }
  } else if (selectedElement.type === 'borderLabel') {
    const b = borderLabels.find(x => x.id === selectedElement.id);
    if (b) {
      html = `
        <div class="editor-form-group">
          <label>نص الحد / البعد:</label>
          <input type="text" value="${b.text || ''}" oninput="updateSelectedBorderField('text', this.value)">
        </div>
        <div class="editor-form-group">
          <label>زاوية الدوران (درجة):</label>
          <input type="text" inputmode="decimal" value="${b.angle || 0}" oninput="updateSelectedBorderField('angle', this.value)">
        </div>
        <div class="editor-form-group">
          <label>حجم الخط (بكسل):</label>
          <input type="text" inputmode="decimal" value="${b.fontSize || 14}" oninput="updateSelectedBorderField('fontSize', this.value)">
        </div>
      `;
    }
  } else if (selectedElement.type === 'splitLine') {
    const l = splitLines.find(x => x.id === selectedElement.id);
    if (l) {
      html = `
        <div class="editor-form-group">
          <label>مسمى خط التقسيم:</label>
          <input type="text" value="${l.label || ''}" oninput="updateSelectedSplitField('label', this.value)">
        </div>
        <div class="editor-form-group">
          <label>زاوية دوران النص:</label>
          <input type="text" inputmode="decimal" value="${l.angle || 0}" oninput="updateSelectedSplitField('angle', this.value)">
        </div>
      `;
    }
  } else if (selectedElement.type === 'freeText') {
    const t = freeTexts.find(x => x.id === selectedElement.id);
    if (t) {
      html = `
        <div class="editor-form-group">
          <label>النص:</label>
          <input type="text" value="${t.text || ''}" oninput="updateSelectedFreeTextField('text', this.value)">
        </div>
        <div class="editor-form-group">
          <label>حجم الخط (بكسل):</label>
          <input type="text" inputmode="decimal" value="${t.fontSize || 13}" oninput="updateSelectedFreeTextField('fontSize', this.value)">
        </div>
        <div class="editor-form-group">
          <label>زاوية الدوران:</label>
          <input type="text" inputmode="decimal" value="${t.angle || 0}" oninput="updateSelectedFreeTextField('angle', this.value)">
        </div>
        <div style="display:flex; gap:10px; margin-top:8px;">
          <label style="display:flex; align-items:center; gap:4px; font-weight:bold; cursor:pointer;">
            <input type="checkbox" ${t.isBold ? 'checked' : ''} onchange="updateSelectedFreeTextField('isBold', this.checked)"> عريض
          </label>
          <label style="display:flex; align-items:center; gap:4px; font-weight:bold; cursor:pointer;">
            <input type="color" value="${t.color || '#000000'}" onchange="updateSelectedFreeTextField('color', this.value)" style="width:25px; height:20px; border:none;"> اللون
          </label>
        </div>
      `;
    }
  }

  html += `
    <div style="display: flex; gap: 8px; margin-top: 15px;">
      <button type="button" onclick="copySelectedElement()" style="flex: 1; height: 32px; border: 1.5px solid #80cbc4; border-radius: 6px; background: #e0f2f1; color: #00796b; font-weight: bold; cursor: pointer; font-size: 11px;">📋 نسخ العنصر</button>
      <button type="button" onclick="deleteSelectedElement()" style="flex: 1; height: 32px; border: 1.5px solid #ffb7b2; border-radius: 6px; background: #ffebee; color: #c62828; font-weight: bold; cursor: pointer; font-size: 11px;">🗑️ حذف العنصر</button>
    </div>
  `;

  editorPanel.innerHTML = html;
}

function getElementTypeName() {
  if (!selectedElement) return "";
  switch(selectedElement.type) {
    case 'shape': return "قطعة أرض";
    case 'borderLabel': return "تسمية الحد";
    case 'splitLine': return "خط تقسيم";
    case 'freeText': return "نص حر";
    default: return "";
  }
}

// Realtime inputs from Sidebar
function updateSelectedShapeField(field, value) {
  if (!selectedElement || selectedElement.type !== 'shape') return;
  const s = shapes.find(x => x.id === selectedElement.id);
  if (s) {
    s[field] = value;
    renderSVG();
    saveStateDebounced();
  }
}

function updateSelectedShapeArea(part, value) {
  if (!selectedElement || selectedElement.type !== 'shape') return;
  const s = shapes.find(x => x.id === selectedElement.id);
  if (s) {
    s.area[part] = parseFloat(value) || 0;
    renderSVG();
    saveStateDebounced();
  }
}

function updateSelectedBorderField(field, value) {
  if (!selectedElement || selectedElement.type !== 'borderLabel') return;
  const b = borderLabels.find(x => x.id === selectedElement.id);
  if (b) {
    if (field === 'angle' || field === 'fontSize') b[field] = parseFloat(value) || 0;
    else b[field] = value;
    renderSVG();
    saveStateDebounced();
  }
}

function updateSelectedSplitField(field, value) {
  if (!selectedElement || selectedElement.type !== 'splitLine') return;
  const l = splitLines.find(x => x.id === selectedElement.id);
  if (l) {
    if (field === 'angle') l.angle = parseFloat(value) || 0;
    else l[field] = value;
    renderSVG();
    saveStateDebounced();
  }
}

// Smart Area inputs from Modal or FreeText insertion
function saveModalDataFreeText() {
  const inputEl = document.getElementById("new-free-text");
  if (inputEl) {
    const textVal = inputEl.value.trim();
    if (!textVal) {
      closeModal();
      return;
    }
    const sizeVal = parseFloat(document.getElementById("new-free-text-size").value) || 14;
    const x = parseFloat(document.getElementById("new-free-text-x").value);
    const y = parseFloat(document.getElementById("new-free-text-y").value);

    const id = "free_" + Date.now();
    freeTexts.push({
      id: id,
      text: textVal,
      x: x,
      y: y,
      fontSize: sizeVal,
      isBold: true,
      color: "#000000",
      angle: 0
    });

    closeModal();
    renderSVG();
    selectedElement = { type: 'freeText', id: id };
    populateSidebarEditor();
    saveState();
  }
}

// Override saving modal data
const originalSaveModalData = saveModalData;
saveModalData = function() {
  if (modalEditTarget) {
    originalSaveModalData();
  } else {
    saveModalDataFreeText();
  }
};

function updateSelectedFreeTextField(field, value) {
  if (!selectedElement || selectedElement.type !== 'freeText') return;
  const t = freeTexts.find(x => x.id === selectedElement.id);
  if (t) {
    if (field === 'fontSize' || field === 'angle') t[field] = parseFloat(value) || 0;
    else t[field] = value;
    renderSVG();
    saveStateDebounced();
  }
}

// ----------------------------------------------------
// Insertion Tools
// ----------------------------------------------------
function promptAddFreeText(spawnX, spawnY) {
  const modal = document.getElementById("editModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalForm = document.getElementById("modalForm");
  const utilsPanel = document.getElementById("text-edit-utilities");
  const quickActions = document.getElementById("element-quick-actions");

  utilsPanel.style.display = "none";
  quickActions.style.display = "none";
  modalTitle.textContent = "إضافة ملاحظة أو نص حر جديد";
  
  const x = spawnX !== undefined ? spawnX : 450 - panX;
  const y = spawnY !== undefined ? spawnY : 280 - panY;

  modalForm.innerHTML = `
    <div class="editor-form-group">
      <label>محتوى النص:</label>
      <input type="text" id="new-free-text" placeholder="مثال: مباع" style="width:100%; padding:6px; box-sizing:border-box;">
    </div>
    <div class="editor-form-group">
      <label>حجم الخط (بكسل):</label>
      <input type="text" inputmode="decimal" id="new-free-text-size" value="14" style="width:100%; padding:6px; box-sizing:border-box;">
    </div>
    <input type="hidden" id="new-free-text-x" value="${x}">
    <input type="hidden" id="new-free-text-y" value="${y}">
  `;

  modalEditTarget = null; // Mark as new insertion
  modal.style.display = "flex";
  
  setTimeout(() => {
    const input = document.getElementById("new-free-text");
    if (input) input.focus();
  }, 100);
}

function addMapLabel(text) {
  const id = "free_" + Date.now() + "_" + Math.floor(Math.random() * 100);
  const x = 450 - panX;
  const y = 280 - panY;

  freeTexts.push({
    id: id,
    text: text,
    x: x,
    y: y,
    fontSize: 14,
    isBold: true,
    color: "#000000",
    angle: 0
  });

  selectedElement = { type: 'freeText', id: id };
  renderSVG();
  populateSidebarEditor();
  saveState();
  closeAddDataModal();
  
  // Directly open edit modal for custom edits
  openModalForElement('freeText', id);
}

function addNewSplitLine() {
  const id = "split_" + Date.now();
  splitLines.push({
    id: id,
    x1: 250, y1: 325,
    x2: 650, y2: 325,
    label: "حد فاصل جديد",
    labelX: 450, labelY: 310,
    angle: 0,
    isDashed: false
  });

  selectedElement = { type: 'splitLine', id: id };
  renderSVG();
  populateSidebarEditor();
  saveState();
}

function copySelectedElement() {
  if (!selectedElement) return;
  const { type, id } = selectedElement;
  const newId = "copy_" + Date.now();

  if (type === 'freeText') {
    const t = freeTexts.find(x => x.id === id);
    if (t) {
      freeTexts.push({
        ...JSON.parse(JSON.stringify(t)),
        id: newId,
        x: t.x + 25,
        y: t.y + 25
      });
      selectedElement = { type: 'freeText', id: newId };
    }
  } else if (type === 'borderLabel') {
    const b = borderLabels.find(x => x.id === id);
    if (b) {
      borderLabels.push({
        ...JSON.parse(JSON.stringify(b)),
        id: newId,
        x: b.x + 25,
        y: b.y + 25
      });
      selectedElement = { type: 'borderLabel', id: newId };
    }
  } else if (type === 'splitLine') {
    const l = splitLines.find(x => x.id === id);
    if (l) {
      splitLines.push({
        ...JSON.parse(JSON.stringify(l)),
        id: newId,
        x1: l.x1 + 25, y1: l.y1 + 25,
        x2: l.x2 + 25, y2: l.y2 + 25,
        labelX: l.labelX + 25, labelY: l.labelY + 25
      });
      selectedElement = { type: 'splitLine', id: newId };
    }
  }

  closeModal();
  renderSVG();
  populateSidebarEditor();
  saveState();
}

function deleteSelectedElement() {
  if (!selectedElement) return;
  const { type, id } = selectedElement;

  if (type === 'shape') {
    shapes = shapes.filter(x => x.id !== id);
  } else if (type === 'borderLabel') {
    borderLabels = borderLabels.filter(x => x.id !== id);
  } else if (type === 'splitLine') {
    splitLines = splitLines.filter(x => x.id !== id);
  } else if (type === 'freeText') {
    freeTexts = freeTexts.filter(x => x.id !== id);
  } else if (type === 'waterway') {
    waterways = waterways.filter(x => x.id !== id);
  }

  selectedElement = null;
  closeModal();
  renderSVG();
  populateSidebarEditor();
  saveState();
}

function resetCanvasToDefault() {
  if (confirm("هل أنت متأكد من مسح اللوحة الحالية والبدء من جديد؟")) {
    shapes = [];
    borderLabels = [];
    splitLines = [];
    freeTexts = [];
    waterways = [];
    selectedElement = null;
    zoomScale = 1.0;
    panX = 0;
    panY = 0;
    applyViewportTransform();
    renderSVG();
    populateSidebarEditor();
    saveState();
    
    // Open start screen modal again
    openStartModal();
    
    // Close FAB menu if open
    const fab = document.getElementById("fabContainer");
    if (fab) fab.classList.remove("open");
  }
}

// Templates wrapper for Sidebar Card
function loadTemplate(type) {
  try {
    if (typeof preventDoubleTap === "function" && preventDoubleTap()) return;
    activeTemplateType = type;

    // Pre-populate input fields based on the selected template style
    const w1Input = document.getElementById("start-w1");
    const w2Input = document.getElementById("start-w2");
    const l2Input = document.getElementById("start-l2");
    const l1Input = document.getElementById("start-l1");
    const d1Input = document.getElementById("start-d1");
    const d2Input = document.getElementById("start-d2");
    const diagContainer = document.getElementById("diagonalsContainer");

    if (d1Input) d1Input.value = "";
    if (d2Input) d2Input.value = "";

    if (diagContainer) {
      if (type === 'quad_diagonal') {
        diagContainer.style.display = 'block';
      } else {
        diagContainer.style.display = 'none';
      }
    }

    if (type === 'generic_shape' || type === 'rectangle') {
      w1Input.value = "30";
      w2Input.value = "30";
      l2Input.value = "60";
      l1Input.value = "60";
    } else if (type === 'square') {
      w1Input.value = "30";
      w2Input.value = "30";
      l2Input.value = "30";
      l1Input.value = "30";
    } else if (type === 'trapezoid') {
      w1Input.value = "30";
      w2Input.value = "45";
      l2Input.value = "40";
      l1Input.value = "35";
    } else if (type === 'quadrilateral') {
      w1Input.value = "30";
      w2Input.value = "32.5";
      l2Input.value = "60";
      l1Input.value = "58";
    } else if (type === 'quad_diagonal') {
      w1Input.value = "45";
      w2Input.value = "50";
      l2Input.value = "35";
      l1Input.value = "40";
      if (d1Input) d1Input.value = "60";
      if (d2Input) d2Input.value = "55";
    } else if (type === 'mixed_waterway_new') {
      w1Input.value = "150";
      w2Input.value = "150";
      l2Input.value = "200";
      l1Input.value = "200";
    } else if (type === 'mixed_split_image') {
      w1Input.value = "227.5";
      w2Input.value = "209.45";
      l2Input.value = "436.95";
      l1Input.value = "436.95";
    } else if (type === 'v_split' || type === 'h_split') {
      w1Input.value = "30";
      w2Input.value = "30";
      l2Input.value = "60";
      l1Input.value = "60";
    }

    // Open the Start Screen modal to confirm or modify values
    openStartModal(true);
  } catch (err) {
    alert("حدث خطأ أثناء تحميل القالب: " + err.message);
  }
}

// ----------------------------------------------------
// Start Modal Trigger Actions
// ----------------------------------------------------
function populateStartModalFromCurrentBorders() {
  const b1 = borderLabels.find(b => b.id === "border_1");
  const b2 = borderLabels.find(b => b.id === "border_2");
  const b3 = borderLabels.find(b => b.id === "border_3");
  const b4 = borderLabels.find(b => b.id === "border_4");

  if (b1) {
    const parts = b1.text.split(" ");
    if (parts.length >= 2) {
      const val = parseFloat(parts[1]);
      if (!isNaN(val)) {
        document.getElementById("start-w1").value = val;
        document.getElementById("start-w1-dir").value = parts[0];
      }
    }
  }
  if (b2) {
    const parts = b2.text.split(" ");
    if (parts.length >= 2) {
      const val = parseFloat(parts[1]);
      if (!isNaN(val)) {
        document.getElementById("start-w2").value = val;
        document.getElementById("start-w2-dir").value = parts[0];
      }
    }
  }
  if (b3) {
    const parts = b3.text.split(" ");
    if (parts.length >= 2) {
      const val = parseFloat(parts[1]);
      if (!isNaN(val)) {
        document.getElementById("start-l1").value = val;
        document.getElementById("start-l1-dir").value = parts[0];
      }
    }
  }
  if (b4) {
    const parts = b4.text.split(" ");
    if (parts.length >= 2) {
      const val = parseFloat(parts[1]);
      if (!isNaN(val)) {
        document.getElementById("start-l2").value = val;
        document.getElementById("start-l2-dir").value = parts[0];
      }
    }
  }

  const numPartnersInput = document.getElementById("start-partners");
  if (numPartnersInput) {
    numPartnersInput.value = shapes.length || 1;
  }
}

function openStartModal(skipPopulate = false) {
  if (!skipPopulate) {
    populateStartModalFromCurrentBorders();
  }
  document.getElementById("startModal").style.display = "flex";
}

// Load default mock values if they click "رسم الأرض" with empty values
document.getElementById("start-w1").value = "30";
document.getElementById("start-w2").value = "28.5";
document.getElementById("start-l2").value = "60";
document.getElementById("start-l1").value = "59.8";

function closeStartModal() {
  document.getElementById("startModal").style.display = "none";
}

// Add Data Modals triggers
function openAddDataModal() {
  document.getElementById("addDataModal").style.display = "flex";
}

function closeAddDataModal() {
  document.getElementById("addDataModal").style.display = "none";
}

// Smart Area Modal triggers
function openSmartAreaModal() {
  document.getElementById("smartAreaModal").style.display = "flex";
  closeAddDataModal();
  calcSmartArea(activeSmartAreaTab);
}

function closeSmartAreaModal() {
  document.getElementById("smartAreaModal").style.display = "none";
}

function switchSmartAreaTab(tab) {
  activeSmartAreaTab = tab;
  const tabSqm = document.getElementById("tab-sqm-btn");
  const tabFed = document.getElementById("tab-fed-btn");
  const contentSqm = document.getElementById("tab-sqm-content");
  const contentFed = document.getElementById("tab-fed-content");

  if (tab === 'sqm') {
    tabSqm.style.borderBottom = "3px solid #2e7d32";
    tabSqm.style.color = "#2e7d32";
    tabFed.style.borderBottom = "none";
    tabFed.style.color = "#000";
    contentSqm.style.display = "block";
    contentFed.style.display = "none";
  } else {
    tabFed.style.borderBottom = "3px solid #2e7d32";
    tabFed.style.color = "#2e7d32";
    tabSqm.style.borderBottom = "none";
    tabSqm.style.color = "#000";
    contentSqm.style.display = "none";
    contentFed.style.display = "block";
  }
}

function calcSmartArea(mode) {
  let sqm = 0;
  let feddan = 0;
  let carat = 0;
  let shares = 0;

  if (mode === 'sqm') {
    sqm = parseFloat(document.getElementById("smart-sqm-input").value) || 0;
    const detail = sqmToFeddanCaratShares(sqm);
    feddan = detail.feddan;
    carat = detail.carat;
    shares = detail.shares;
  } else {
    feddan = parseInt(document.getElementById("smart-fed").value) || 0;
    carat = parseInt(document.getElementById("smart-car").value) || 0;
    shares = parseFloat(document.getElementById("smart-shares") ? document.getElementById("smart-shares").value : document.getElementById("smart-sahm").value) || 0;
    sqm = (feddan * 4200.833) + (carat * 175.0347) + (shares * 7.293);
  }

  // Display outputs
  document.getElementById("smart-res-sqm").textContent = sqm.toFixed(2);
  
  const fedStr = feddan ? `${feddan} فدان` : "";
  const carStr = carat ? `${carat} قيراط` : "";
  const shStr = shares ? `${shares} سهم` : "";
  const detailStr = [fedStr, carStr, shStr].filter(Boolean).join(" و ");
  document.getElementById("smart-res-detailed").textContent = detailStr || "0 فدان و 0 قيراط و 0 سهم";

  const totalCarats = sqm / 175.0347;
  const totalShares = sqm / 7.293;

  document.getElementById("smart-res-carats").textContent = totalCarats.toFixed(2);
  document.getElementById("smart-res-shares").textContent = totalShares.toFixed(2);
}

function insertSmartAreaToMap() {
  const sqm = document.getElementById("smart-res-sqm").textContent;
  const detailed = document.getElementById("smart-res-detailed").textContent;
  const carats = document.getElementById("smart-res-carats").textContent;

  const text = `المساحة: ${detailed} (مساوية لـ ${sqm} م² / ${carats} قيراط)`;
  addMapLabel(text);
  closeSmartAreaModal();
}

// ----------------------------------------------------
// Demo & Mock Data Presets
// ----------------------------------------------------
function restoreDemoDataPreset() {
  loadDemoDataPreset(true);
}

function loadDemoDataPreset(promptConfirm = true) {
  if (promptConfirm && !confirm("هل أنت متأكد من استعادة وتحميل البيانات التجريبية على اللوحة؟")) {
    return;
  }

  const drawW = 60.00;
  const drawL = 30.00;

  const centerX = 450;
  const centerY = 325;
  const scale = 12.33; // fit factor

  const scaledW = drawW * scale;
  const scaledL = drawL * scale;

  const p1 = { x: centerX - scaledW / 2, y: centerY - scaledL / 2 };
  const p2 = { x: centerX + scaledW / 2, y: centerY - scaledL / 2 };
  const p3 = { x: centerX + scaledW / 2, y: centerY + scaledL / 2 };
  const p4 = { x: centerX - scaledW / 2, y: centerY + scaledL / 2 };

  const totalArea = 1800; // 30 * 60

  shapes = [{
    id: "shape_1",
    points: [p1, p2, p3, p4],
    owner: "اسم المالك",
    area: { feddan: 0, carat: 10, shares: 6.81, sqm: totalArea },
    notes: "خريطة ارض",
    color: "#ffffff",
    textX: centerX,
    textY: centerY
  }];

  borderLabels = [
    { id: "border_1", text: "غربي 60.00 م", x: centerX, y: p1.y - 18, fontSize: 13, angle: 0 },
    { id: "border_2", text: "شرقي 60.00 م", x: centerX, y: p4.y + 22, fontSize: 13, angle: 0 },
    { id: "border_3", text: "قبلي 30.00 م", x: p1.x - 22, y: centerY, fontSize: 13, angle: -90 },
    { id: "border_4", text: "بحري 30.00 م", x: p2.x + 22, y: centerY, fontSize: 13, angle: 90 }
  ];

  freeTexts = [];

  splitLines = [];
  waterways = [];

  // Center view
  zoomScale = 1.0;
  panX = 0;
  panY = 0;
  applyViewportTransform();

  selectedElement = null;
  renderSVG();
  saveState();

  const fab = document.getElementById("fabContainer");
  if (fab) fab.classList.remove("open");
}

// Mobile FAB triggers
function toggleFabMenu() {
  const fab = document.getElementById("fabContainer");
  if (fab) {
    fab.classList.toggle("open");
  }
}

// ----------------------------------------------------
// Image Export Functionality
// ----------------------------------------------------
function exportMapImage() {
  selectedElement = null;
  renderSVG();

  const svgEl = document.getElementById("dallalSvg");
  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svgEl);

  if(!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)){
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if(!source.match(/^<svg[^>]+xmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink"/)){
    source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }

  source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
  const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = "dallal_croquis_" + Date.now() + ".svg";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  const fab = document.getElementById("fabContainer");
  if (fab) fab.classList.remove("open");
}

// ----------------------------------------------------
// PDF & Print View Rendering
// ----------------------------------------------------
function printDallalMap() {
  selectedElement = null;
  renderSVG();
  populateSidebarEditor();

  const svgElement = document.getElementById("dallalSvg");
  const svgHTML = svgElement.outerHTML;

  const now = new Date();
  const dateStr = now.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("ar-EG");
  const reportId = `DL-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  let detailedReportHTML = "";
  if (activeTemplateType === 'mixed_waterway_new') {
    detailedReportHTML += `<div class="mixed-report-container" style="padding: 20px; font-family: 'Cairo', sans-serif; direction: rtl; width: 100%; max-width: 900px; margin: 20px auto; page-break-inside: auto;">`;
    detailedReportHTML += `<h2 style="color: #1b5e20; text-align: center; border-bottom: 2px solid #1b5e20; padding-bottom: 10px; margin-bottom: 20px; page-break-after: avoid;">التقرير التفصيلي لقطع الأراضي</h2>`;
    
    shapes.forEach(s => {
      detailedReportHTML += `<div style="background: #f1f8e9; border: 1px solid #c5e1a5; border-radius: 8px; padding: 15px; margin-bottom: 20px; page-break-inside: avoid;">`;
      detailedReportHTML += `<h3 style="color: #2e7d32; margin-top: 0; margin-bottom: 10px;">👤 ${s.owner || s.notes || 'شريك'}</h3>`;
      detailedReportHTML += `<p style="font-weight: bold; font-size: 14px; margin-bottom: 15px; color: #333; padding-right: 5px;">إجمالي المساحة: ${s.area.sqm.toFixed(2)} م² (${s.area.feddan} فدان، ${s.area.carat} قيراط، ${s.area.shares} سهم)</p>`;
      
      if (s.subShapes && s.subShapes.length > 0) {
        detailedReportHTML += `<div style="display: flex; gap: 15px; flex-wrap: wrap;">`;
        s.subShapes.forEach(sub => {
          detailedReportHTML += `<div style="flex: 1; min-width: 250px; background: #fff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">`;
          detailedReportHTML += `<h4 style="color: #1565c0; margin-top: 0; margin-bottom: 10px; border-bottom: 1px dashed #bbdefb; padding-bottom: 5px;">📍 ${sub.name}</h4>`;
          detailedReportHTML += `<table style="width: 100%; font-size: 13px; border-collapse: collapse;">`;
          const addRowStr = (label, valStr) => `<tr><td style="padding: 4px 0; color: #555;">${label}</td><td style="padding: 4px 0; font-weight: bold; text-align: left; color: #222;">${valStr}</td></tr>`;
          
          detailedReportHTML += addRowStr("المساحة:", `${sub.area.toFixed(2)} م²`);
          detailedReportHTML += addRowStr("العرض العلوي:", `${sub.topWidth.toFixed(2)} م`);
          detailedReportHTML += addRowStr("العرض السفلي:", `${sub.botWidth.toFixed(2)} م`);
          detailedReportHTML += addRowStr("الطول الأيمن:", `${sub.rightLen.toFixed(2)} م`);
          detailedReportHTML += addRowStr("الطول الأيسر:", `${sub.leftLen.toFixed(2)} م`);
          detailedReportHTML += addRowStr("المحيط الكلي:", `${sub.perimeter.toFixed(2)} م`);
          
          detailedReportHTML += `</table></div>`;
        });
        detailedReportHTML += `</div>`;
      }
      detailedReportHTML += `</div>`;
    });

    if (waterways && waterways.length > 0) {
       detailedReportHTML += `<div style="background: #e3f2fd; border: 1px solid #90caf9; border-radius: 8px; padding: 15px; margin-bottom: 20px; page-break-inside: avoid;">`;
       detailedReportHTML += `<h3 style="color: #0d47a1; margin-top: 0; margin-bottom: 10px;">💧 تفاصيل المجرى المائي</h3>`;
       waterways.forEach(w => {
         if (w.stats) {
            detailedReportHTML += `<table style="width: 100%; font-size: 13px; border-collapse: collapse; max-width: 400px; margin-right: 10px;">`;
            detailedReportHTML += `<tr><td style="padding: 4px 0; color: #555;">المساحة الإجمالية:</td><td style="padding: 4px 0; font-weight: bold; text-align: left; color: #222;">${w.stats.area.toFixed(2)} م²</td></tr>`;
            detailedReportHTML += `<tr><td style="padding: 4px 0; color: #555;">الطول الإجمالي:</td><td style="padding: 4px 0; font-weight: bold; text-align: left; color: #222;">${w.stats.length.toFixed(2)} م</td></tr>`;
            detailedReportHTML += `<tr><td style="padding: 4px 0; color: #555;">العرض التقريبي:</td><td style="padding: 4px 0; font-weight: bold; text-align: left; color: #222;">${w.stats.width.toFixed(2)} م</td></tr>`;
            detailedReportHTML += `</table>`;
         }
       });
       detailedReportHTML += `</div>`;
    }
    detailedReportHTML += `</div>`;
  }

  const printOverlay = document.getElementById("printOverlay");
  printOverlay.innerHTML = `
      <style>
        .watermark-container-print {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-25deg);
          font-size: 24pt;
          font-weight: 800;
          color: #000000;
          opacity: 0.05;
          white-space: nowrap;
          pointer-events: none;
          z-index: -100;
          font-family: 'Cairo', Arial, sans-serif;
          text-align: center;
          width: 100%;
          display: none;
        }
        .report-footer-print {
          display: none;
          width: 100%;
          flex-direction: column;
          align-items: center;
          text-align: center;
          font-size: 8pt;
          color: #444;
          border-top: 1.5px solid #1b5e20;
          padding: 4px 10px 3px;
          background: white;
          gap: 1px;
          margin-top: auto;
          font-family: 'Cairo', sans-serif;
        }
        .footer-main-text { font-size: 8.5pt; font-weight: 700; color: #222; }
        .footer-sub-text { font-size: 7.5pt; color: #888; }
        
        @media print {
          .watermark-container-print { display: block !important; }
          .report-footer-print { display: flex !important; position: fixed; bottom: 0; left: 0; }
          .print-overlay-content { padding-bottom: 50px !important; }
        }
      </style>

      <div class="watermark-container-print">تم تنفيذ هذا التقرير باستخدام تطبيق الدَّلاَّل لقياسات الأراضي، والمتوفر على Google Play.</div>

      <div class="print-overlay-content" style="background: white; min-height: 100vh; display: flex; flex-direction: column; position: relative;">
        
        <!-- Header removed per user request -->

        <div class="canvas-container" style="flex: 1; width: 100%; max-width: 100%; margin: 5px auto; box-sizing: border-box; display: flex; justify-content: center; align-items: center; padding: 5px; overflow: hidden;">
          ${svgHTML}
        </div>

        ${detailedReportHTML}

        <!-- Controls (No Print) -->
        <div class="no-print" style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; width: 100%; padding: 15px; background: #f9f9f9; border-top: 1px solid #eee; font-family: 'Cairo', sans-serif;">
          <button onclick="let svg=document.querySelector('#printOverlay .canvas-container svg'); let curr=parseFloat(svg.style.width||100); svg.style.width=(curr*1.25)+'%'; svg.style.height='auto';" style="font-weight: bold; font-size: 16px; padding: 4px 15px; background: #eceff1; border: 1.5px solid #b0bec5; border-radius: 6px; cursor: pointer; color: #37474f; transition: background 0.2s;">+</button>
          
          <button onclick="let svg=document.querySelector('#printOverlay .canvas-container svg'); let curr=parseFloat(svg.style.width||100); svg.style.width=(curr*0.8)+'%'; svg.style.height='auto';" style="font-weight: bold; font-size: 16px; padding: 4px 15px; background: #eceff1; border: 1.5px solid #b0bec5; border-radius: 6px; cursor: pointer; color: #37474f; transition: background 0.2s;">-</button>
          
          <button onclick="let el=document.getElementById('printOverlay'); if(!document.fullscreenElement){ if(el.requestFullscreen) el.requestFullscreen(); else if(el.webkitRequestFullscreen) el.webkitRequestFullscreen(); } else { if(document.exitFullscreen) document.exitFullscreen(); else if(document.webkitExitFullscreen) document.webkitExitFullscreen(); }" style="display: flex; align-items: center; gap: 5px; font-weight: bold; font-size: 13px; padding: 4px 12px; height: 35px; background: #eceff1; border: 1.5px solid #b0bec5; border-radius: 6px; cursor: pointer; color: #37474f;" title="ملء الشاشة">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
            <span>ملء الشاشة</span>
          </button>
          
          <button onclick="exportMapImage()" style="display: flex; align-items: center; gap: 5px; font-weight: bold; font-size: 14px; padding: 4px 12px; height: 35px; background: #eceff1; border: 1.5px solid #b0bec5; border-radius: 6px; cursor: pointer; color: #37474f;" title="تحميل صورة الكروكي">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            تحميل الصورة
          </button>
        </div>
        
        <div class="no-print" style="display: flex; justify-content: center; width: 100%; padding: 5px 15px; background: #f9f9f9; font-family: 'Cairo', sans-serif;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; font-weight: bold; color: #1b5e20;">
            <input type="checkbox" id="chkPrintAgriBackground" checked onchange="togglePrintAgriBackground()" style="accent-color: #2e7d32; width: 14px; height: 14px;">
            تضمين الخلفية في الطباعة
          </label>
        </div>

        <div class="footer no-print" style="text-align: center; font-size: 11px; color: #777; border-top: 1px dashed #eee; padding-top: 15px; margin: 10px 15px 50px 15px; font-family: 'Cairo';">
          <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <button onclick="window.print()" style="padding: 12px 25px; background: linear-gradient(135deg, #1b5e20, #2e7d32); color: white; border: none; border-radius: 8px; font-family: 'Cairo'; font-weight: bold; font-size: 16px; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">🖨️ طباعة عبر النظام</button>
            <button onclick="document.getElementById('printOverlay').style.display='none'" style="padding: 12px 25px; background: #c62828; color: white; border: none; border-radius: 8px; font-family: 'Cairo'; font-weight: bold; font-size: 16px; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">❌ إغلاق / العودة</button>
          </div>
          <p style="margin: 15px 0 5px; font-weight: bold; color: #1b5e20; font-size: 13px;">يمكنك التقاط لقطة شاشة (Screenshot) بدقة عالية أو الحفظ كـ PDF!</p>
          <p style="margin: 5px 0; font-weight: bold; color: #1b5e20; font-size: 12px;">جميع الحقوق محفوظة © تطبيق الدلال لقياسات الأراضي</p>
        </div>

        <!-- Professional Footer for print -->
        <div class="report-footer-print">
          <div class="footer-main-text">تم تنفيذ هذا التقرير باستخدام تطبيق الدَّلاَّل لقياسات الأراضي، والمتوفر على Google Play.</div>
          <div class="footer-sub-text">
            <span>تطبيق الدَّلاَّل لقياسات الأراضي الزراعية © ${now.getFullYear()}</span>
            <span> | تاريخ الاستخراج: ${dateStr} - ${timeStr}</span>
            <span> | إصدار التطبيق: v2.4</span>
          </div>
        </div>

      </div>
  `;
  
  const overlaySvg = printOverlay.querySelector("svg");
  if(overlaySvg) {
      overlaySvg.style.width = "100%";
      overlaySvg.style.height = "auto";
      overlaySvg.style.maxHeight = "90vh";
      overlaySvg.style.backgroundColor = "white";
  }
  
  printOverlay.style.display = "block";
  window.scrollTo(0, 0);

  const fab = document.getElementById("fabContainer");
  if (fab) fab.classList.remove("open");
}

// Function to dynamically set print page orientation based on land dimensions
function setDynamicPrintPage(orientation) {
  let styleTag = document.getElementById("dynamic-print-style");
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = "dynamic-print-style";
    document.head.appendChild(styleTag);
  }
  
  if (orientation === "portrait") {
    styleTag.innerHTML = `
      @media print {
        @page { size: A4 portrait !important; margin: 5mm; }
      }
    `;
  } else {
    styleTag.innerHTML = `
      @media print {
        @page { size: A4 landscape !important; margin: 5mm; }
      }
    `;
  }
}

// Global functions for agricultural background toggles
function toggleAgriBackground() {
  renderSVG();
}

function togglePrintAgriBackground() {
  // Checkbox in print overlay toggled, update the SVG in the overlay directly
  const showBg = document.getElementById("chkPrintAgriBackground").checked;
  const overlaySvg = document.querySelector("#printOverlay .canvas-container svg");
  
  if (overlaySvg) {
    const bgImg = overlaySvg.querySelector("#agriBgImage");
    if (bgImg) {
      if (typeof AGRI_BG_BASE64 !== "undefined" && showBg) {
        bgImg.setAttribute("href", AGRI_BG_BASE64);
        bgImg.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", AGRI_BG_BASE64);
      } else {
        bgImg.setAttribute("href", "");
        bgImg.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "");
      }
    }
    
    const polygons = overlaySvg.querySelectorAll("polygon.clickable-shape");
    polygons.forEach(p => {
      const origColor = p.getAttribute("data-color") || "#ffffff";
      if (origColor === "#ffffff" || origColor === "#f1f8e9" || origColor === "#e8f5e9") {
        p.style.fill = showBg ? "url(#agriPattern)" : origColor;
        p.style.fillOpacity = "1";
      }
    });

    const textBgs = overlaySvg.querySelectorAll(".text-bg-card");
    textBgs.forEach(r => {
      r.style.display = showBg ? "block" : "none";
    });
  }
}

// ----------------------------------------------------
// Carat Conversion Dialog Functions
// ----------------------------------------------------
function showCaratConversionModal() {
  const modal = document.getElementById("caratConversionModal");
  if (!modal) return;
  modal.style.display = "block";

  // Pre-fill selection based on current caratSize
  const select = document.getElementById("modal-carat-select");
  const customInput = document.getElementById("modal-carat-custom");

  const valStr = caratSize.toString();
  if (["175.035", "175", "171.388", "168"].includes(valStr)) {
    select.value = valStr;
    customInput.style.display = "none";
  } else {
    select.value = "custom";
    customInput.value = caratSize;
    customInput.style.display = "inline-block";
  }
}

function closeCaratConversionModal() {
  const modal = document.getElementById("caratConversionModal");
  if (modal) modal.style.display = "none";
}

function handleModalCaratSelectChange() {
  const select = document.getElementById("modal-carat-select");
  const customInput = document.getElementById("modal-carat-custom");
  if (select.value === "custom") {
    customInput.style.display = "inline-block";
    customInput.focus();
  } else {
    customInput.style.display = "none";
  }
}

function applyCaratConversion() {
  const select = document.getElementById("modal-carat-select");
  const customInput = document.getElementById("modal-carat-custom");
  
  let selectedVal = 168;
  if (select.value === "custom") {
    const customVal = parseFloat(customInput.value);
    if (isNaN(customVal) || customVal <= 0) {
      alert("الرجاء إدخال مساحة صحيحة للقيراط");
      return;
    }
    selectedVal = customVal;
  } else {
    selectedVal = parseFloat(select.value);
  }

  caratSize = selectedVal;
  showFeddanConversion = true;

  localStorage.setItem("dallal_carat_size", caratSize);
  localStorage.setItem("dallal_show_feddan", "true");

  // Re-render
  renderSVG();
  
  // Re-populate editor panel if an element is selected
  if (selectedElement && selectedElement.type === 'shape') {
    populateSidebarEditor();
  }

  closeCaratConversionModal();
}

function disableCaratConversion() {
  showFeddanConversion = false;
  localStorage.setItem("dallal_show_feddan", "false");

  // Re-render
  renderSVG();

  // Re-populate editor panel if an element is selected
  if (selectedElement && selectedElement.type === 'shape') {
    populateSidebarEditor();
  }

  closeCaratConversionModal();
}
