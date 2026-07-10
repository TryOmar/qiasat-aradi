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

// Visual Scaling & Stretch Variables - متغيرات التمدد البصري والـ Auto Fit
let scaleX = 1.0;
let scaleY = 1.0;
let centerRx = 0.0;
let centerRy = 0.0;
let visualCenterX = 450;
let visualCenterY = 325;
let scale = 1.0;
let partnerEditMode = 'keep_area'; // 'keep_area' or 'free_edit'

function getVisualX(rx) {
  return visualCenterX + (rx - centerRx) * scaleX;
}
function getVisualY(ry) {
  return visualCenterY + (ry - centerRy) * scaleY;
}
function getRealCoords(coords) {
  if (!coords) return { x: 0, y: 0 };
  return {
    x: centerRx + (coords.x - visualCenterX) / scaleX,
    y: centerRy + (coords.y - visualCenterY) / scaleY
  };
}

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
let mixedPiecesTree = null;

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
      customPartnerWidths = state.customPartnerWidths || null;
      customWaterwayData = state.customWaterwayData || null;
      mixedPiecesTree = state.mixedPiecesTree || null;
      
      
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
    customWaterwayData: customWaterwayData ? JSON.parse(JSON.stringify(customWaterwayData)) : null,
    mixedPiecesTree: mixedPiecesTree ? JSON.parse(JSON.stringify(mixedPiecesTree)) : null
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
  mixedPiecesTree = state.mixedPiecesTree ? JSON.parse(JSON.stringify(state.mixedPiecesTree)) : null;

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

  let centerX = 0;
  let centerY = 0;
  scale = 1;

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
  } else {
    // Landscape Mode
    svgElement.setAttribute("viewBox", "0 0 900 650");
    const bgImg = document.getElementById("agriBgImage");
    const agriPattern = document.getElementById("agriPattern");
    if (bgImg) { bgImg.setAttribute("width", "900"); bgImg.setAttribute("height", "650"); }
    if (agriPattern) { agriPattern.setAttribute("width", "900"); agriPattern.setAttribute("height", "650"); }
    if (wrapperElement) wrapperElement.style.aspectRatio = "900 / 650";
    setDynamicPrintPage("landscape");
  }

  function addDividerLengthsFreeTexts(p_tl, p_tr, p_br, p_bl, idx) {
    const leftLen = Math.sqrt(Math.pow(p_bl.x - p_tl.x, 2) + Math.pow(p_bl.y - p_tl.y, 2));
    freeTexts.push({
      id: "note_left_" + Date.now() + "_" + idx,
      text: leftLen.toFixed(2) + " م",
      x: p_tl.x + (p_bl.x - p_tl.x) * 0.75 + 1.8,
      y: p_tl.y + (p_bl.y - p_tl.y) * 0.75,
      fontSize: 12,
      isBold: true,
      angle: 0,
      color: "#555"
    });
    const rightLen = Math.sqrt(Math.pow(p_br.x - p_tr.x, 2) + Math.pow(p_br.y - p_tr.y, 2));
    freeTexts.push({
      id: "note_right_" + Date.now() + "_" + idx,
      text: rightLen.toFixed(2) + " م",
      x: p_tr.x + (p_br.x - p_tr.x) * 0.75 - 1.8,
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

    let boxCenterX = minX + shapeW / 2;
    let boxCenterY = minY + shapeH / 2;

    p1 = { x: tempP1.x - boxCenterX, y: tempP1.y - boxCenterY };
    p2 = { x: tempP2.x - boxCenterX, y: tempP2.y - boxCenterY };
    p3 = { x: tempP3.x - boxCenterX, y: tempP3.y - boxCenterY };
    p4 = { x: tempP4.x - boxCenterX, y: tempP4.y - boxCenterY };

  } else {
    const drawW1 = w1;
    const drawW2 = w2;
    const drawL1 = l1;
    const drawL2 = l2;
    const avgHeight = (drawL1 + drawL2) / 2;

    p1 = { x: -drawW1 / 2, y: -avgHeight / 2 };
    p2 = { x: drawW1 / 2, y: -avgHeight / 2 };
    p3 = { x: drawW2 / 2, y: avgHeight / 2 };
    p4 = { x: -drawW2 / 2, y: avgHeight / 2 };

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
      let A = Math.sqrt(Math.pow(p_tr.x - p_tl.x, 2) + Math.pow(p_tr.y - p_tl.y, 2));
      let B = Math.sqrt(Math.pow(p_bl.x - p_tl.x, 2) + Math.pow(p_bl.y - p_tl.y, 2));
      let C = Math.sqrt(Math.pow(p_br.x - p_bl.x, 2) + Math.pow(p_br.y - p_bl.y, 2));
      let D = Math.sqrt(Math.pow(p_br.x - p_tr.x, 2) + Math.pow(p_br.y - p_tr.y, 2));
      let diag = Math.sqrt(Math.pow(p_br.x - p_tl.x, 2) + Math.pow(p_br.y - p_tl.y, 2));
      
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
        y: (p_tl.y + p_tr.y) / 2 + 1.5,
        fontSize: 12,
        isBold: true,
        angle: 0,
        color: "#555"
      });

      freeTexts.push({
        id: "note_bot_" + Date.now() + "_" + i,
        text: partW2.toFixed(2) + " م",
        x: (p_bl.x + p_br.x) / 2,
        y: (p_bl.y + p_br.y) / 2 - 1.5,
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
          labelX: p_tl.x - 1.5,
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
      labelX: p_top_mid.x - 1.5,
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
      textX: (p1.x + p2.x) / 2,
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
      textX: (p_left_mid.x + p_right_mid.x) / 2,
      textY: (p_left_mid.y + p4.y) / 2
    });
    
    addDividerLengthsFreeTexts(p_left_mid, p_right_mid, p3, p4, 1);

    splitLines.push({
      id: "split_1",
      x1: p_left_mid.x, y1: p_left_mid.y,
      x2: p_right_mid.x, y2: p_right_mid.y,
      label: "",
      labelX: centerX,
      labelY: p_left_mid.y - 1.0,
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
      textY: centerY + 3.5
    });

    const lenAC = Math.sqrt(Math.pow(p3.x - p1.x, 2) + Math.pow(p3.y - p1.y, 2));
    const lenBD = Math.sqrt(Math.pow(p2.x - p4.x, 2) + Math.pow(p2.y - p4.y, 2));

    // Draw diagonal AC
    splitLines.push({
      id: "split_diag_1",
      x1: p1.x, y1: p1.y,
      x2: p3.x, y2: p3.y,
      label: `القطر الأول (AC) ${lenAC.toFixed(2)} م`,
      labelX: (p1.x + p3.x) / 2 + 2.5,
      labelY: (p1.y + p3.y) / 2 - 1.5,
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
      labelX: (p4.x + p2.x) / 2 - 2.5,
      labelY: (p4.y + p2.y) / 2 - 1.5,
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
    function calcDist(pa, pb) {
      return Math.sqrt(Math.pow(pb.x - pa.x, 2) + Math.pow(pb.y - pa.y, 2));
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

    if (!customWaterwayData) {
      customWaterwayData = {
        userWidthMeters: 7.20,        // العرض الموحد للمجرى - يتحكم فيه المستخدم
        positionType: 'middle',       // 'middle', 'start', 'quarter', 'third', 'two_thirds', 'three_quarters', 'end', 'custom_pct', 'area_third'
        positionPct: 50.0,            // النسبة المئوية الافتراضية
        leftTopMeters: (effL1 - 7.20) / 2,
        rightTopMeters: (effL2 - 7.20) / 2,
        leftWaterMeters: 7.20,
        rightWaterMeters: 7.20
      };
    } else {
      if (customWaterwayData.userWidthMeters === undefined) {
        customWaterwayData.userWidthMeters = (customWaterwayData.leftWaterMeters + customWaterwayData.rightWaterMeters) / 2;
      }
      if (customWaterwayData.positionType === undefined) {
        customWaterwayData.positionType = 'middle';
      }
      if (customWaterwayData.positionPct === undefined) {
        customWaterwayData.positionPct = 50.0;
      }
    }

    const uw = customWaterwayData.userWidthMeters;
    customWaterwayData.leftWaterMeters = uw;
    customWaterwayData.rightWaterMeters = uw;

    let r_pos = 0.5;
    const posType = customWaterwayData.positionType;

    if (posType === 'start') {
      r_pos = 0.0;
    } else if (posType === 'quarter') {
      r_pos = 0.25;
    } else if (posType === 'third') {
      r_pos = 1.0 / 3.0;
    } else if (posType === 'middle') {
      r_pos = 0.5;
    } else if (posType === 'two_thirds') {
      r_pos = 2.0 / 3.0;
    } else if (posType === 'three_quarters') {
      r_pos = 0.75;
    } else if (posType === 'end') {
      r_pos = 1.0;
    } else if (posType === 'custom_pct') {
      r_pos = (customWaterwayData.positionPct !== undefined ? customWaterwayData.positionPct : 50.0) / 100.0;
    } else if (posType === 'area_third') {
      // بحث ثنائي لإيجاد النسبة التي تجعل مساحة الجزء العلوي = ثلث إجمالي مساحة القطعتين (باستثناء المجرى)
      let low = 0.0;
      let high = 1.0;
      for (let iter = 0; iter < 30; iter++) {
        let mid = (low + high) / 2;
        let lt = (effL1 - uw) * mid;
        let rt = (effL2 - uw) * mid;
        let t_lt = Math.max(0, Math.min(1, lt / effL1));
        let t_rt = Math.max(0, Math.min(1, rt / effL2));
        let w_tl_temp = { x: p1.x + (p4.x - p1.x) * t_lt, y: p1.y + (p4.y - p1.y) * t_lt };
        let w_tr_temp = { x: p2.x + (p3.x - p2.x) * t_rt, y: p2.y + (p3.y - p2.y) * t_rt };
        let w_bl_temp = { x: p1.x + (p4.x - p1.x) * Math.min(1, (lt + uw) / effL1), y: p1.y + (p4.y - p1.y) * Math.min(1, (lt + uw) / effL1) };
        let w_br_temp = { x: p2.x + (p3.x - p2.x) * Math.min(1, (rt + uw) / effL2), y: p2.y + (p3.y - p2.y) * Math.min(1, (rt + uw) / effL2) };
        
        let areaA = calcQuadArea(p1, p2, w_tr_temp, w_tl_temp);
        let areaB = calcQuadArea(w_bl_temp, w_br_temp, p3, p4);
        if (areaA - (areaA + areaB) / 3 > 0) {
          high = mid;
        } else {
          low = mid;
        }
      }
      r_pos = (low + high) / 2;
    }

    r_pos = Math.max(0.0, Math.min(1.0, r_pos));

    customWaterwayData.leftTopMeters = (effL1 - uw) * r_pos;
    customWaterwayData.rightTopMeters = (effL2 - uw) * r_pos;

    // حساب العرض البصري للرسم فقط (إذا كان العرض الحقيقي 0 يظهر بعرض 4 أمتار بصرياً)
    const uw_visual = uw === 0 ? 4.00 : uw;
    const visual_left_top = (effL1 - uw_visual) * r_pos;
    const visual_right_top = (effL2 - uw_visual) * r_pos;

    // 1. حساب النسب الحقيقية للحسابات (تعتمد على uw الحقيقي)
    const t_left_top = Math.max(0, Math.min(1, customWaterwayData.leftTopMeters / effL1));
    const t_left_bot = Math.max(0, Math.min(1, (customWaterwayData.leftTopMeters + customWaterwayData.leftWaterMeters) / effL1));
    const t_right_top = Math.max(0, Math.min(1, customWaterwayData.rightTopMeters / effL2));
    const t_right_bot = Math.max(0, Math.min(1, (customWaterwayData.rightTopMeters + customWaterwayData.rightWaterMeters) / effL2));

    // 2. حساب النسب البصرية للرسم (تعتمد على uw_visual البصري)
    const t_left_top_vis = Math.max(0, Math.min(1, visual_left_top / effL1));
    const t_left_bot_vis = Math.max(0, Math.min(1, (visual_left_top + uw_visual) / effL1));
    const t_right_top_vis = Math.max(0, Math.min(1, visual_right_top / effL2));
    const t_right_bot_vis = Math.max(0, Math.min(1, (visual_right_top + uw_visual) / effL2));

    // إحداثيات الحدود الحقيقية (للحسابات والتقسيم)
    const x_water_top_left = p1.x + (p4.x - p1.x) * t_left_top;
    const y_water_top_left = p1.y + (p4.y - p1.y) * t_left_top;
    const x_water_bot_left = p1.x + (p4.x - p1.x) * t_left_bot;
    const y_water_bot_left = p1.y + (p4.y - p1.y) * t_left_bot;
    const x_water_top_right = p2.x + (p3.x - p2.x) * t_right_top;
    const y_water_top_right = p2.y + (p3.y - p2.y) * t_right_top;
    const x_water_bot_right = p2.x + (p3.x - p2.x) * t_right_bot;
    const y_water_bot_right = p2.y + (p3.y - p2.y) * t_right_bot;

    // إحداثيات الحدود البصرية (للرسم فقط)
    const x_water_top_left_vis = p1.x + (p4.x - p1.x) * t_left_top_vis;
    const y_water_top_left_vis = p1.y + (p4.y - p1.y) * t_left_top_vis;
    const x_water_bot_left_vis = p1.x + (p4.x - p1.x) * t_left_bot_vis;
    const y_water_bot_left_vis = p1.y + (p4.y - p1.y) * t_left_bot_vis;
    const x_water_top_right_vis = p2.x + (p3.x - p2.x) * t_right_top_vis;
    const y_water_top_right_vis = p2.y + (p3.y - p2.y) * t_right_top_vis;
    const x_water_bot_right_vis = p2.x + (p3.x - p2.x) * t_right_bot_vis;
    const y_water_bot_right_vis = p2.y + (p3.y - p2.y) * t_right_bot_vis;

    function calcDist(pa, pb) {
      return Math.sqrt(Math.pow(pb.x - pa.x, 2) + Math.pow(pb.y - pa.y, 2));
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

    // الحدود الحقيقية
    let w_tl = { x: x_water_top_left, y: y_water_top_left };
    let w_tr = { x: x_water_top_right, y: y_water_top_right };
    let w_br = { x: x_water_bot_right, y: y_water_bot_right };
    let w_bl = { x: x_water_bot_left, y: y_water_bot_left };

    // الحدود البصرية
    let w_tl_vis = { x: x_water_top_left_vis, y: y_water_top_left_vis };
    let w_tr_vis = { x: x_water_top_right_vis, y: y_water_top_right_vis };
    let w_br_vis = { x: x_water_bot_right_vis, y: y_water_bot_right_vis };
    let w_bl_vis = { x: x_water_bot_left_vis, y: y_water_bot_left_vis };

    // Initialize custom widths at waterway to original geometric widths if not present
    const orig_top_len = calcDist(w_tl, w_tr);
    const orig_bot_len = calcDist(w_bl, w_br);

    if (customWaterwayData.westWidthAtWaterway === undefined) {
      customWaterwayData.westWidthAtWaterway = orig_top_len;
    }
    if (customWaterwayData.eastWidthAtWaterway === undefined) {
      customWaterwayData.eastWidthAtWaterway = orig_bot_len;
    }

    const target_west_w = customWaterwayData.westWidthAtWaterway;
    const target_east_w = customWaterwayData.eastWidthAtWaterway;

    // Adjust real top segment (w_tl -> w_tr)
    const c_top = { x: (w_tl.x + w_tr.x) / 2, y: (w_tl.y + w_tr.y) / 2 };
    const dx_top = w_tr.x - w_tl.x;
    const dy_top = w_tr.y - w_tl.y;
    const len_top = Math.sqrt(dx_top * dx_top + dy_top * dy_top) || 1;
    const ux_top = dx_top / len_top;
    const uy_top = dy_top / len_top;
    w_tl = { x: c_top.x - ux_top * (target_west_w / 2), y: c_top.y - uy_top * (target_west_w / 2) };
    w_tr = { x: c_top.x + ux_top * (target_west_w / 2), y: c_top.y + uy_top * (target_west_w / 2) };

    // Adjust real bottom segment (w_bl -> w_br)
    const c_bot = { x: (w_bl.x + w_br.x) / 2, y: (w_bl.y + w_br.y) / 2 };
    const dx_bot = w_br.x - w_bl.x;
    const dy_bot = w_br.y - w_bl.y;
    const len_bot = Math.sqrt(dx_bot * dx_bot + dy_bot * dy_bot) || 1;
    const ux_bot = dx_bot / len_bot;
    const uy_bot = dy_bot / len_bot;
    w_bl = { x: c_bot.x - ux_bot * (target_east_w / 2), y: c_bot.y - uy_bot * (target_east_w / 2) };
    w_br = { x: c_bot.x + ux_bot * (target_east_w / 2), y: c_bot.y + uy_bot * (target_east_w / 2) };

    // Adjust visual top segment (w_tl_vis -> w_tr_vis)
    const c_top_vis = { x: (w_tl_vis.x + w_tr_vis.x) / 2, y: (w_tl_vis.y + w_tr_vis.y) / 2 };
    const dx_top_vis = w_tr_vis.x - w_tl_vis.x;
    const dy_top_vis = w_tr_vis.y - w_tl_vis.y;
    const len_top_vis = Math.sqrt(dx_top_vis * dx_top_vis + dy_top_vis * dy_top_vis) || 1;
    const ux_top_vis = dx_top_vis / len_top_vis;
    const uy_top_vis = dy_top_vis / len_top_vis;
    w_tl_vis = { x: c_top_vis.x - ux_top_vis * (target_west_w / 2), y: c_top_vis.y - uy_top_vis * (target_west_w / 2) };
    w_tr_vis = { x: c_top_vis.x + ux_top_vis * (target_west_w / 2), y: c_top_vis.y + uy_top_vis * (target_west_w / 2) };

    // Adjust visual bottom segment (w_bl_vis -> w_br_vis)
    const c_bot_vis = { x: (w_bl_vis.x + w_br_vis.x) / 2, y: (w_bl_vis.y + w_br_vis.y) / 2 };
    const dx_bot_vis = w_br_vis.x - w_bl_vis.x;
    const dy_bot_vis = w_br_vis.y - w_bl_vis.y;
    const len_bot_vis = Math.sqrt(dx_bot_vis * dx_bot_vis + dy_bot_vis * dy_bot_vis) || 1;
    const ux_bot_vis = dx_bot_vis / len_bot_vis;
    const uy_bot_vis = dy_bot_vis / len_bot_vis;
    w_bl_vis = { x: c_bot_vis.x - ux_bot_vis * (target_east_w / 2), y: c_bot_vis.y - uy_bot_vis * (target_east_w / 2) };
    w_br_vis = { x: c_bot_vis.x + ux_bot_vis * (target_east_w / 2), y: c_bot_vis.y + uy_bot_vis * (target_east_w / 2) };

    // Verify convexity of all three sections (West, Waterway, East)
    if (!isConvexQuad(p1, p2, w_tr, w_tl) || 
        !isConvexQuad(w_tl, w_tr, w_br, w_bl) || 
        !isConvexQuad(w_bl, w_br, p3, p4)) {
      return false;
    }

    waterways.push({
      id: "water_new",
      points: [w_tl_vis, w_tr_vis, w_br_vis, w_bl_vis],
      label: "مجرى مائي (ترعة)",
      labelX: centerX,
      labelY: (y_water_top_left_vis + y_water_bot_left_vis) / 2,
      angle: 0,
      stats: {
        area: uw === 0 ? 0 : calcQuadArea(w_tl_vis, w_tr_vis, w_br_vis, w_bl_vis),
        width: uw,
        length: calcDist(w_tl_vis, w_tr_vis)
      }
    });

    if (!mixedPiecesTree) {
      mixedPiecesTree = {
        west: { partners: 1, customWidths: [] },
        east: { partners: 1, customWidths: [] }
      };
    }

    function subdividePieceLongitudinally(parentCorners, N, customWidths, baseName, pieceIdPrefix, colorOffset) {
      // parentCorners: [tl, tr, br, bl]
      const [ptl, ptr, pbr, pbl] = parentCorners;
      const effTopW = calcDist(ptl, ptr);
      const effBotW = calcDist(pbl, pbr);

      if (!customWidths || customWidths.length !== N) {
        customWidths.length = 0;
        for (let i = 0; i < N; i++) {
          customWidths.push({
            top: effTopW / N,
            bot: effBotW / N
          });
        }
      } else {
        let sumTop = 0, sumBot = 0;
        for (let i = 0; i < N; i++) {
          sumTop += customWidths[i].top || 0;
          sumBot += customWidths[i].bot || 0;
        }
        if (sumTop <= 0) sumTop = 1;
        if (sumBot <= 0) sumBot = 1;
        
        for (let i = 0; i < N; i++) {
          customWidths[i].top = ((customWidths[i].top || 0) / sumTop) * effTopW;
          customWidths[i].bot = ((customWidths[i].bot || 0) / sumBot) * effBotW;
        }
      }

      for (let i = 0; i < N; i++) {
        let ratioTop1 = 0;
        for (let j = 0; j < i; j++) ratioTop1 += customWidths[j].top;
        ratioTop1 /= effTopW;

        let ratioTop2 = ratioTop1 + (customWidths[i].top / effTopW);

        let ratioBot1 = 0;
        for (let j = 0; j < i; j++) ratioBot1 += customWidths[j].bot;
        ratioBot1 /= effBotW;

        let ratioBot2 = ratioBot1 + (customWidths[i].bot / effBotW);

        if (ratioTop1 < 0) ratioTop1 = 0; if (ratioTop1 > 1) ratioTop1 = 1;
        if (ratioTop2 < 0) ratioTop2 = 0; if (ratioTop2 > 1) ratioTop2 = 1;
        if (ratioBot1 < 0) ratioBot1 = 0; if (ratioBot1 > 1) ratioBot1 = 1;
        if (ratioBot2 < 0) ratioBot2 = 0; if (ratioBot2 > 1) ratioBot2 = 1;

        const sub_tl = {
          x: ptl.x + (ptr.x - ptl.x) * ratioTop1,
          y: ptl.y + (ptr.y - ptl.y) * ratioTop1
        };
        const sub_tr = {
          x: ptl.x + (ptr.x - ptl.x) * ratioTop2,
          y: ptl.y + (ptr.y - ptl.y) * ratioTop2
        };
        const sub_br = {
          x: pbl.x + (pbr.x - pbl.x) * ratioBot2,
          y: pbl.y + (pbr.y - pbl.y) * ratioBot2
        };
        const sub_bl = {
          x: pbl.x + (pbr.x - pbl.x) * ratioBot1,
          y: pbl.y + (pbr.y - pbl.y) * ratioBot1
        };

        let partArea = calcQuadArea(sub_tl, sub_tr, sub_br, sub_bl);
        const partDetailed = sqmToFeddanCaratShares(partArea);

        const colorIndex = (colorOffset + i) % colorsList.length;
        let ownerName = N === 1 ? "اسم المالك" : "الشريك " + (i + 1) + " (" + baseName + ")";
        let notesName = N === 1 ? baseName : baseName + " - جـ" + (i + 1);

        shapes.push({
          id: pieceIdPrefix + "_" + i,
          groupId: pieceIdPrefix,
          isSubPiece: true,
          points: [sub_tl, sub_tr, sub_br, sub_bl],
          owner: ownerName,
          area: { feddan: partDetailed.feddan, carat: partDetailed.carat, shares: partDetailed.shares, sqm: partArea },
          notes: notesName,
          color: colorsList[colorIndex].value,
          textX: (sub_tl.x + sub_tr.x + sub_br.x + sub_bl.x) / 4,
          textY: (sub_tl.y + sub_tr.y) / 2 + ( (sub_bl.y + sub_br.y) / 2 - (sub_tl.y + sub_tr.y) / 2 ) * 0.25,
          parentShape: {
            name: baseName,
            points: parentCorners,
            area: calcQuadArea(ptl, ptr, pbr, pbl),
            topWidth: effTopW,
            botWidth: effBotW,
            leftLen: calcDist(ptl, pbl),
            rightLen: calcDist(ptr, pbr),
            perimeter: effTopW + effBotW + calcDist(ptl, pbl) + calcDist(ptr, pbr)
          }
        });

        addDividerLengthsFreeTexts(sub_tl, sub_tr, sub_br, sub_bl, i);

        const partW1 = customWidths[i].top;
        const partW2 = customWidths[i].bot;

        freeTexts.push({
          id: "note_top_" + pieceIdPrefix + "_" + i,
          text: partW1.toFixed(2) + " م",
          x: (sub_tl.x + sub_tr.x) / 2,
          y: (sub_tl.y + sub_tr.y) / 2 + (pieceIdPrefix === 'east' ? 1.5 : -1.5),
          fontSize: 12,
          isBold: true,
          angle: 0,
          color: "#555"
        });

        freeTexts.push({
          id: "note_bot_" + pieceIdPrefix + "_" + i,
          text: partW2.toFixed(2) + " م",
          x: (sub_bl.x + sub_br.x) / 2,
          y: (sub_bl.y + sub_br.y) / 2 + (pieceIdPrefix === 'west' ? -1.5 : 1.5),
          fontSize: 12,
          isBold: true,
          angle: 0,
          color: "#555"
        });

        if (i > 0) {
          splitLines.push({
            id: "split_" + pieceIdPrefix + "_" + i,
            x1: sub_tl.x, y1: sub_tl.y,
            x2: sub_bl.x, y2: sub_bl.y,
            label: "",
            labelX: sub_tl.x - 1.5,
            labelY: (sub_tl.y + sub_bl.y) / 2,
            angle: 90,
            isDashed: true
          });
        }
      }
    }

    subdividePieceLongitudinally([p1, p2, w_tr, w_tl], mixedPiecesTree.west.partners, mixedPiecesTree.west.customWidths, "القطعة الغربية", "west", 0);
    subdividePieceLongitudinally([w_bl, w_br, p3, p4], mixedPiecesTree.east.partners, mixedPiecesTree.east.customWidths, "القطعة الشرقية", "east", 3);


  } else if (activeTemplateType === 'mixed_split_image') {
    // Vertical waterway in the middle, splitting into Left/Right, then horizontally split.
    const water_w = 2.0; // Waterway width in meters
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

    splitLines.push({
      id: "split_left",
      x1: x_mid_left_outer, y1: y_mid_left,
      x2: x_water_left, y2: y_mid_left,
      label: "",
      labelX: p1.x - 6.5,
      labelY: y_mid_left,
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

    splitLines.push({
      id: "split_right",
      x1: x_water_right, y1: y_mid_right,
      x2: x_mid_right_outer, y2: y_mid_right,
      label: "",
      labelX: p2.x + 6.5,
      labelY: y_mid_right,
      angle: 0,
      isDashed: true
    });

    // Inner measurements height labels dynamically calculated
    const hValLeft = ((effL1 - 17.50) / 2).toFixed(1);
    const hValRight = ((effL2 - 17.50) / 2).toFixed(1);

    freeTexts.push({ id: "note_l_t", text: `${hValLeft} م`, x: p1.x + 1.2, y: (p1.y + y_mid_left) / 2, fontSize: 12, isBold: true, angle: -90 });
    freeTexts.push({ id: "note_l_b", text: `${hValLeft} م`, x: p4.x + 1.2, y: (p4.y + y_mid_left) / 2, fontSize: 12, isBold: true, angle: -90 });
    freeTexts.push({ id: "note_r_t", text: `${hValRight} م`, x: p2.x - 1.2, y: (p2.y + y_mid_right) / 2, fontSize: 12, isBold: true, angle: 90 });
    freeTexts.push({ id: "note_r_b", text: `${hValRight} م`, x: p3.x - 1.2, y: (y_mid_right + p3.y) / 2, fontSize: 12, isBold: true, angle: 90 });
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
// A map to store visual offsets for labels so they don't overlap, resolved dynamically at render time.
let resolvedVisualOffsets = {};

function updateDynamicTransform() {
  if (shapes.length === 0) {
    scaleX = 1.0;
    scaleY = 1.0;
    centerRx = 0.0;
    centerRy = 0.0;
    scale = 1.0;
    return;
  }

  // 1. Get real bounding box of all shapes in meters
  let minRx = Infinity, maxRx = -Infinity;
  let minRy = Infinity, maxRy = -Infinity;

  shapes.forEach(s => {
    s.points.forEach(p => {
      if (p.x < minRx) minRx = p.x;
      if (p.x > maxRx) maxRx = p.x;
      if (p.y < minRy) minRy = p.y;
      if (p.y > maxRy) maxRy = p.y;
    });
  });

  if (minRx === Infinity || minRy === Infinity) {
    minRx = -30; maxRx = 30;
    minRy = -15; maxRy = 15;
  }

  centerRx = (minRx + maxRx) / 2;
  centerRy = (minRy + maxRy) / 2;

  const rw = maxRx - minRx || 1;
  const rh = maxRy - minRy || 1;

  const margin = 50; // Safety margin in pixels
  let targetW, targetH;

  const avgW = rw;
  const avgL = rh;
  const isRotated = avgL > avgW;

  if (isRotated) {
    targetW = 650 - 2 * margin;
    targetH = 900 - 2 * margin;
    visualCenterX = 325;
    visualCenterY = 450;
  } else {
    targetW = 900 - 2 * margin;
    targetH = 650 - 2 * margin;
    visualCenterX = 450;
    visualCenterY = 325;
  }

  const uniformScale = Math.min(targetW / rw, targetH / rh);
  const aspectRatio = rw / rh;
  const screenRatio = targetW / targetH;

  scaleX = uniformScale;
  scaleY = uniformScale;

  if (aspectRatio > screenRatio) {
    // Wide land. Stretch Y axis.
    const ratioOfRatios = aspectRatio / screenRatio;
    let stretchY = Math.pow(ratioOfRatios, 0.45);

    if (activeTemplateType === 'mixed_waterway_new' || activeTemplateType === 'mixed_split_image') {
      stretchY *= 1.25;
    }
    if (shapes.length > 2) {
      stretchY *= (1.0 + (shapes.length - 1) * 0.08);
    }

    scaleX = targetW / rw;
    scaleY = Math.min(targetH / rh, scaleX * stretchY);
  } else {
    // Tall land. Stretch X axis.
    const ratioOfRatios = screenRatio / aspectRatio;
    let stretchX = Math.pow(ratioOfRatios, 0.45);

    if (activeTemplateType === 'mixed_waterway_new' || activeTemplateType === 'mixed_split_image') {
      stretchX *= 1.25;
    }
    if (shapes.length > 2) {
      stretchX *= (1.0 + (shapes.length - 1) * 0.08);
    }

    scaleY = targetH / rh;
    scaleX = Math.min(targetW / rw, scaleY * stretchX);
  }

  scale = Math.min(scaleX, scaleY);
}

function resolveVisualLabelOverlap() {
  resolvedVisualOffsets = {};
  let placed = [];
  let checkList = [];

  // 1. Waterways
  waterways.forEach(w => {
    if (w.label) {
      checkList.push({
        id: w.id,
        type: 'waterwayLabel',
        x: getVisualX(w.labelX),
        y: getVisualY(w.labelY),
        angle: w.angle || 0,
        text: w.label,
        fontSize: 14
      });
    }
  });

  // 2. Split lines
  splitLines.forEach(l => {
    if (l.label) {
      checkList.push({
        id: l.id,
        type: 'splitLineLabel',
        x: getVisualX(l.labelX),
        y: getVisualY(l.labelY),
        angle: l.angle || 0,
        text: l.label,
        fontSize: 12
      });
    }
  });

  // 3. Border labels
  borderLabels.forEach(b => {
    if (b.text) {
      checkList.push({
        id: b.id,
        type: 'borderLabel',
        x: getVisualX(b.x),
        y: getVisualY(b.y),
        angle: b.angle || 0,
        text: b.text,
        fontSize: parseFloat(b.fontSize || "13.5")
      });
    }
  });

  // 4. Free texts
  freeTexts.forEach(t => {
    if (t.text) {
      checkList.push({
        id: t.id,
        type: 'freeText',
        x: getVisualX(t.x),
        y: getVisualY(t.y),
        angle: t.angle || 0,
        text: t.text,
        fontSize: parseFloat(t.fontSize || "13")
      });
    }
  });

  checkList.forEach(item => {
    if (item.angle !== 0) {
      resolvedVisualOffsets[item.id] = { dx: 0, dy: 0 };
      return;
    }

    const fontSize = item.fontSize;
    let w = 0, h = 0;
    if (item.type === 'splitLineLabel') {
      w = item.text.length * 7 + 10;
      h = 20;
    } else {
      w = item.text.length * (fontSize * 0.6) + 12;
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
        if (Math.abs(cx - p.x) < (hw + p.hw + 6) &&
            Math.abs(testY - p.y) < (hh + p.hh + 6)) {
          hasCollision = true;
          break;
        }
      }
      if (hasCollision) {
        stepCount++;
        let sign = stepCount % 2 === 1 ? -1 : 1;
        let mult = Math.ceil(stepCount / 2);
        shiftY = sign * mult * 26;
      }
    }

    resolvedVisualOffsets[item.id] = { dx: 0, dy: shiftY };
    placed.push({ x: cx, y: cy + shiftY, hw: hw, hh: hh });
  });
  return true;
}

// ----------------------------------------------------
// Rendering Engine
// ----------------------------------------------------
function renderSVG() {
  updateDynamicTransform();
  resolveVisualLabelOverlap();

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
    const pointsStr = w.points.map(p => `${getVisualX(p.x)},${getVisualY(p.y)}`).join(" ");
    
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

    const offset = resolvedVisualOffsets[w.id] || { dx: 0, dy: 0 };
    const visualLabelX = getVisualX(w.labelX) + offset.dx;
    const visualLabelY = getVisualY(w.labelY) + offset.dy;

    if (offset.dy !== 0) {
      const guideLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      guideLine.setAttribute("x1", getVisualX(w.labelX));
      guideLine.setAttribute("y1", getVisualY(w.labelY));
      guideLine.setAttribute("x2", visualLabelX);
      guideLine.setAttribute("y2", visualLabelY);
      guideLine.setAttribute("stroke", "#006064");
      guideLine.setAttribute("stroke-width", "1");
      guideLine.setAttribute("stroke-dasharray", "3, 3");
      guideLine.style.opacity = "0.7";
      waterwaysGroup.appendChild(guideLine);
    }

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", visualLabelX);
    text.setAttribute("y", visualLabelY);
    text.setAttribute("fill", "#006064");
    text.setAttribute("font-size", "14");
    text.setAttribute("font-weight", "bold");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("class", "draggable-label");
    text.setAttribute("data-id", w.id);
    text.setAttribute("data-type", "waterwayLabel");
    if (w.angle) {
      text.setAttribute("transform", `rotate(${w.angle}, ${visualLabelX}, ${visualLabelY})`);
    }
    text.textContent = w.label;
    waterwaysGroup.appendChild(text);
  });

  // 2. Draw Land Slices (shapes)
  shapes.forEach(s => {
    const pointsStr = s.points.map(p => `${getVisualX(p.x)},${getVisualY(p.y)}`).join(" ");
    
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
    
    // Visual width and height on screen
    const visualShapeW = (maxX - minX) * scaleX;
    const visualShapeH = (maxY - minY) * scaleY;

    // 1. Draw standalone Area text (rotated -90) at 25% height
    if (s.area && s.area.sqm) {
      const areaGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      const areaX = getVisualX(s.textX);
      let areaY = minY + (maxY - minY) * 0.25;
      if (activeTemplateType === 'mixed_waterway_new') {
        areaY = minY + (maxY - minY) * 0.85; // Move to bottom to avoid waterway and text box
      }
      const visualAreaY = getVisualY(areaY);
      
      areaGroup.setAttribute("class", "draggable-label");
      areaGroup.setAttribute("data-type", "shapeAreaText");
      areaGroup.setAttribute("transform", `rotate(-90, ${areaX}, ${visualAreaY})`);
      
      const areaText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      areaText.setAttribute("x", areaX);
      areaText.setAttribute("y", visualAreaY);
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
      const hScaleX = (visualShapeW * 0.85) / unscaledBoxW;
      const hScaleY = (visualShapeH * 0.85) / unscaledBoxH;
      const hScale = Math.min(1.0, hScaleX, hScaleY);

      const vScaleX = (visualShapeH * 0.85) / unscaledBoxW;
      const vScaleY = (visualShapeW * 0.85) / unscaledBoxH;
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
      
      const visualTextX = getVisualX(s.textX);
      const visualTextY = getVisualY(s.textY);
      
      const boxX = visualTextX - boxW / 2;
      const boxY = visualTextY - boxH / 2;

      let transformStr = "";
      if (rotateAngle !== 0) {
        transformStr = `rotate(${rotateAngle}, ${visualTextX}, ${visualTextY})`;
      }
      textGroup.setAttribute("transform", transformStr);

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
        tSpan.setAttribute("x", visualTextX);
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
      const fieldX = visualTextX - fieldW / 2;
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
        const btnX = visualTextX;
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
          tSpan.setAttribute("x", visualTextX);
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
        const btnX = visualTextX;
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
        const subPts = sub.points.map(p => `${getVisualX(p.x)},${getVisualY(p.y)}`).join(" ");
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
    line.setAttribute("x1", getVisualX(l.x1));
    line.setAttribute("y1", getVisualY(l.y1));
    line.setAttribute("x2", getVisualX(l.x2));
    line.setAttribute("y2", getVisualY(l.y2));
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
      handle1.setAttribute("cx", getVisualX(l.x1));
      handle1.setAttribute("cy", getVisualY(l.y1));
      handle1.setAttribute("r", 7);
      handle1.setAttribute("fill", "#c62828");
      handle1.setAttribute("class", "draggable-label");
      handle1.setAttribute("data-type", "splitLineEnd");
      handle1.setAttribute("data-id", l.id);
      handle1.setAttribute("data-index", "1");
      splitLinesGroup.appendChild(handle1);

      const handle2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      handle2.setAttribute("cx", getVisualX(l.x2));
      handle2.setAttribute("cy", getVisualY(l.y2));
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
      const offset = resolvedVisualOffsets[l.id] || { dx: 0, dy: 0 };
      const visualLabelX = getVisualX(l.labelX) + offset.dx;
      const visualLabelY = getVisualY(l.labelY) + offset.dy;
      g.setAttribute("class", "draggable-label");
      g.setAttribute("data-id", l.id);
      g.setAttribute("data-type", "splitLineLabel");
      if (l.angle) {
        g.setAttribute("transform", `rotate(${l.angle}, ${visualLabelX}, ${visualLabelY})`);
      }

      const boxW = l.label.length * 7 + 10;
      const boxH = 20;
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", visualLabelX - boxW / 2);
      rect.setAttribute("y", visualLabelY - boxH / 1.5 + 1);
      rect.setAttribute("width", boxW);
      rect.setAttribute("height", boxH);
      rect.setAttribute("fill", "white");
      rect.setAttribute("stroke", "#b0bec5");
      rect.setAttribute("stroke-width", "1.5");
      rect.setAttribute("rx", "3");

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", visualLabelX);
      text.setAttribute("y", visualLabelY);
      text.setAttribute("fill", "#000000");
      text.setAttribute("font-size", "12");
      text.setAttribute("font-weight", "bold");
      text.setAttribute("text-anchor", "middle");
      text.textContent = l.label;

      if (offset.dy !== 0) {
        const guideLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        guideLine.setAttribute("x1", getVisualX(l.labelX));
        guideLine.setAttribute("y1", getVisualY(l.labelY));
        guideLine.setAttribute("x2", visualLabelX);
        guideLine.setAttribute("y2", visualLabelY);
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
    const offset = resolvedVisualOffsets[b.id] || { dx: 0, dy: 0 };
    const visualX = getVisualX(b.x) + offset.dx;
    const visualY = getVisualY(b.y) + offset.dy;
    g.setAttribute("class", "draggable-label");
    g.setAttribute("data-id", b.id);
    g.setAttribute("data-type", "borderLabel");
    if (b.angle) {
      g.setAttribute("transform", `rotate(${b.angle}, ${visualX}, ${visualY})`);
    }

    const fontSize = parseFloat(b.fontSize || "13.5");
    const boxW = b.text.length * (fontSize * 0.6) + 12;
    const boxH = fontSize * 1.6;

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", visualX - boxW / 2);
    rect.setAttribute("y", visualY - boxH / 1.5 + 2);
    rect.setAttribute("width", boxW);
    rect.setAttribute("height", boxH);
    rect.setAttribute("fill", "white");
    rect.setAttribute("stroke", "#b0bec5");
    rect.setAttribute("stroke-width", "1.5");
    rect.setAttribute("rx", "3");

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", visualX);
    text.setAttribute("y", visualY);
    text.setAttribute("fill", b.color || "#000000");
    text.setAttribute("font-size", b.fontSize || "13.5");
    text.setAttribute("font-weight", b.isBold !== false ? "bold" : "normal");
    text.setAttribute("text-anchor", "middle");
    text.textContent = b.text;

    if (offset.dy !== 0) {
      const guideLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      guideLine.setAttribute("x1", getVisualX(b.x));
      guideLine.setAttribute("y1", getVisualY(b.y));
      guideLine.setAttribute("x2", visualX);
      guideLine.setAttribute("y2", visualY);
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
    const offset = resolvedVisualOffsets[t.id] || { dx: 0, dy: 0 };
    const visualX = getVisualX(t.x) + offset.dx;
    const visualY = getVisualY(t.y) + offset.dy;
    g.setAttribute("class", "draggable-label");
    g.setAttribute("data-id", t.id);
    g.setAttribute("data-type", "freeText");
    if (t.angle) {
      g.setAttribute("transform", `rotate(${t.angle}, ${visualX}, ${visualY})`);
    }

    const fontSize = parseFloat(t.fontSize || "13");
    const boxW = t.text.length * (fontSize * 0.6) + 12;
    const boxH = fontSize * 1.6;

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", visualX - boxW / 2);
    rect.setAttribute("y", visualY - boxH / 1.5 + 2);
    rect.setAttribute("width", boxW);
    rect.setAttribute("height", boxH);
    rect.setAttribute("fill", "white");
    rect.setAttribute("stroke", "#b0bec5");
    rect.setAttribute("stroke-width", "1.5");
    rect.setAttribute("rx", "3");

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", visualX);
    text.setAttribute("y", visualY);
    text.setAttribute("fill", t.color || "#000000");
    text.setAttribute("font-size", t.fontSize || "13");
    text.setAttribute("font-weight", t.isBold ? "bold" : "normal");
    text.setAttribute("text-anchor", "middle");
    text.textContent = t.text;

    if (offset.dy !== 0) {
      const guideLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      guideLine.setAttribute("x1", getVisualX(t.x));
      guideLine.setAttribute("y1", getVisualY(t.y));
      guideLine.setAttribute("x2", visualX);
      guideLine.setAttribute("y2", visualY);
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

    const coords = getRealCoords(getSvgCoords(e));
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
    const coords = getRealCoords(getSvgCoords(e));
    const newX = Math.round((coords.x - activeDrag.offset.x) * 100) / 100;
    const newY = Math.round((coords.y - activeDrag.offset.y) * 100) / 100;

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
  const excludedTemplates = ['quad_diagonal'];
  
  if (activeTemplateType === 'quad_diagonal') {
    openStartModal();
    return;
  }

  if (numPartners === 1 && activeTemplateType !== 'mixed_waterway_new' && activeTemplateType !== 'mixed_split_image') {
    openStartModal();
    return;
  }

  if (activeTemplateType !== 'mixed_waterway_new' && activeTemplateType !== 'mixed_split_image') {
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
  
  if (activeTemplateType === 'mixed_waterway_new' || activeTemplateType === 'mixed_split_image') {
    if (!mixedPiecesTree) return;

    // West partners
    const westWidths = mixedPiecesTree.west.customWidths || [];
    westWidths.forEach((cw, i) => {
      const shape = shapes.find(s => s.id === "west_" + i);
      const areaStr = shape && shape.area ? shape.area.sqm.toFixed(2) : "-";
      
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">شريك ${i + 1} (الغربي)</td>
        <td style="padding: 10px; border: 1px solid #ddd;">
          <input type="number" step="0.01" class="free-edit-input" data-group="west" data-index="${i}" data-side="top" value="${cw.top.toFixed(4)}" style="width: 80px; text-align: center; padding: 5px;">
        </td>
        <td style="padding: 10px; border: 1px solid #ddd;">
          <input type="number" step="0.01" class="free-edit-input" data-group="west" data-index="${i}" data-side="bot" value="${cw.bot.toFixed(4)}" style="width: 80px; text-align: center; padding: 5px;">
        </td>
        <td style="padding: 10px; border: 1px solid #ddd; color: #1b5e20; font-weight: bold;">
          ${areaStr}
        </td>
      `;
      tbody.appendChild(tr);
    });

    // East partners
    const eastWidths = mixedPiecesTree.east.customWidths || [];
    eastWidths.forEach((cw, i) => {
      const shape = shapes.find(s => s.id === "east_" + i);
      const areaStr = shape && shape.area ? shape.area.sqm.toFixed(2) : "-";
      
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">شريك ${i + 1} (الشرقي)</td>
        <td style="padding: 10px; border: 1px solid #ddd;">
          <input type="number" step="0.01" class="free-edit-input" data-group="east" data-index="${i}" data-side="top" value="${cw.top.toFixed(4)}" style="width: 80px; text-align: center; padding: 5px;">
        </td>
        <td style="padding: 10px; border: 1px solid #ddd;">
          <input type="number" step="0.01" class="free-edit-input" data-group="east" data-index="${i}" data-side="bot" value="${cw.bot.toFixed(4)}" style="width: 80px; text-align: center; padding: 5px;">
        </td>
        <td style="padding: 10px; border: 1px solid #ddd; color: #1b5e20; font-weight: bold;">
          ${areaStr}
        </td>
      `;
      tbody.appendChild(tr);
    });

  } else {
    customPartnerWidths.forEach((cw, i) => {
      const shape = shapes.find(s => s.id === "shape_" + (i + 1));
      const areaStr = shape && shape.area ? shape.area.sqm.toFixed(2) : "-";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">شريك ${i + 1}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">
          <input type="number" step="0.01" class="free-edit-input" data-group="standard" data-index="${i}" data-side="top" value="${cw.top.toFixed(4)}" style="width: 80px; text-align: center; padding: 5px;">
        </td>
        <td style="padding: 10px; border: 1px solid #ddd;">
          <input type="number" step="0.01" class="free-edit-input" data-group="standard" data-index="${i}" data-side="bot" value="${cw.bot.toFixed(4)}" style="width: 80px; text-align: center; padding: 5px;">
        </td>
        <td style="padding: 10px; border: 1px solid #ddd; color: #1b5e20; font-weight: bold;">
          ${areaStr}
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  document.querySelectorAll(".free-edit-input").forEach(inp => {
    inp.addEventListener("change", (e) => {
      const group = e.target.getAttribute("data-group");
      const idx = parseInt(e.target.getAttribute("data-index"));
      const side = e.target.getAttribute("data-side");
      const newVal = parseArabicFloat(e.target.value);
      onFreeEditWidthChange(group, idx, side, newVal, e.target);
    });
  });
}

function onFreeEditWidthChange(group, idx, side, newVal, inputEl) {
  let widthsArray = [];
  if (group === 'west') {
    widthsArray = mixedPiecesTree.west.customWidths;
  } else if (group === 'east') {
    widthsArray = mixedPiecesTree.east.customWidths;
  } else {
    widthsArray = customPartnerWidths;
  }

  const oldVal = widthsArray[idx][side];
  const diff = newVal - oldVal;

  let targetIdx = idx + 1;
  if (idx === widthsArray.length - 1) {
    targetIdx = idx - 1;
  }

  if (targetIdx < 0 || targetIdx >= widthsArray.length) {
    alert("لا توجد قطعة مجاورة لتعديلها.");
    inputEl.value = oldVal.toFixed(4);
    return;
  }

  const neighborOldVal = widthsArray[targetIdx][side];
  const neighborNewVal = neighborOldVal - diff;

  if (newVal < 0 || neighborNewVal < 0) {
    alert("التعديل غير ممكن لأن العرض سيصبح أقل من الصفر للحفاظ على المساحة الكلية.");
    inputEl.value = oldVal.toFixed(4);
    return;
  }

  widthsArray[idx][side] = newVal;
  widthsArray[targetIdx][side] = neighborNewVal;
  
  renderFreeEditTable();
}

function applyFreeEdit() {
  closeFreeEditModal();
  generateCustomLand(true);
  renderSVG();
  saveState();
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

  let targetType = type;
  let targetId = id;

  // فحص ما إذا كان النقر على تسمية بعد أو طول ونقوم بتحويله للقطعة المناسبة
  if (activeTemplateType === 'mixed_waterway_new') {
    if (type === 'borderLabel') {
      if (id === 'border_3' || id === 'border_1') {
        targetType = 'shape';
        targetId = 'west_0';
      } else if (id === 'border_4' || id === 'border_2') {
        targetType = 'shape';
        targetId = 'east_0';
      }
    } else if (type === 'freeText' && id) {
      if (id === 'note_l_t' || id === 'note_r_t') {
        targetType = 'shape';
        targetId = 'west_0';
      } else if (id === 'note_l_b' || id === 'note_r_b') {
        targetType = 'shape';
        targetId = 'east_0';
      } else if (id.startsWith('note_top_west_') || id.startsWith('note_bot_west_')) {
        const idx = id.split('_').pop();
        targetType = 'shape';
        targetId = 'west_' + idx;
      } else if (id.startsWith('note_top_east_') || id.startsWith('note_bot_east_')) {
        const idx = id.split('_').pop();
        targetType = 'shape';
        targetId = 'east_' + idx;
      }
    }
  } else {
    // التقسيمات العادية
    if (type === 'freeText' && id) {
      if (id.startsWith('note_top_') || id.startsWith('note_bot_') || id.startsWith('note_left_') || id.startsWith('note_right_')) {
        const idx = parseInt(id.split('_').pop());
        if (!isNaN(idx)) {
          targetType = 'shape';
          targetId = 'shape_' + (idx + 1);
        }
      }
    } else if (type === 'borderLabel') {
      if (id === 'border_3') {
        targetType = 'shape';
        targetId = 'shape_1';
      } else if (id === 'border_4') {
        targetType = 'shape';
        targetId = 'shape_' + (customPartnerWidths ? customPartnerWidths.length : 1);
      }
    }
  }

  // إذا لم يتم تحويل العنصر لـ shape وظل عبارة عن تسمية حد أو خط تقسيم عام،
  // نقوم بفتح المودال الإدخال العام للأبعاد الكلية للأرض.
  if (targetType === 'borderLabel' || targetType === 'splitLine' || (targetType === 'freeText' && targetId && targetId.startsWith('note_'))) {
    openStartModal();
    return;
  }

  selectedElement = { type: targetType, id: targetId };
  renderSVG();
  populateSidebarEditor();
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
    
    let subPieceHtml = "";
    if (s.isSubPiece) {
      const sideLengths = getShapeSideLengths(s);
      const pIndex = parseInt(s.id.split('_').pop()) || 0;
      const customW = mixedPiecesTree[s.groupId] ? mixedPiecesTree[s.groupId].customWidths[pIndex] : null;
      const numPartners = mixedPiecesTree[s.groupId] ? mixedPiecesTree[s.groupId].partners : 1;
      
      let partnerWidthsHtml = "";
      if (numPartners > 1 && customW) {
        partnerWidthsHtml = `
          <hr style="border: none; border-top: 1px dashed #90caf9; margin: 10px 0;">
          <h4 style="margin: 0 0 10px 0; color: #1565c0; font-size: 13px;">⚙️ عروض هذا الشريك داخل القطعة</h4>
          <div class="editor-form-group">
            <label>العرض العلوي للشريك (متر):</label>
            <input type="number" step="0.01" value="${customW.top.toFixed(2)}" oninput="updateSubPieceWidth('${s.groupId}', ${pIndex}, 'top', this.value)">
          </div>
          <div class="editor-form-group">
            <label>العرض السفلي للشريك (متر):</label>
            <input type="number" step="0.01" value="${customW.bot.toFixed(2)}" oninput="updateSubPieceWidth('${s.groupId}', ${pIndex}, 'bot', this.value)">
          </div>
        `;
      }
      
      subPieceHtml = `
        <div style="background: #e3f2fd; padding: 10px; border-radius: 6px; border: 1px solid #90caf9; margin-bottom: 15px;">
          <h4 style="margin: 0 0 10px 0; color: #1565c0; font-size: 13px;">⚙️ أبعاد هذه القطعة (أطوال القطعة)</h4>
          <div class="editor-form-group">
            <label>طول القطعة (الجانب الأيسر) بالمتر:</label>
            <input type="number" step="0.01" value="${sideLengths.left.toFixed(2)}" oninput="updateMixedPieceLength('${s.groupId}', 'left', this.value)">
          </div>
          <div class="editor-form-group">
            <label>طول القطعة (الجانب الأيمن) بالمتر:</label>
            <input type="number" step="0.01" value="${sideLengths.right.toFixed(2)}" oninput="updateMixedPieceLength('${s.groupId}', 'right', this.value)">
          </div>
          
          ${partnerWidthsHtml}
          
          <hr style="border: none; border-top: 1px dashed #90caf9; margin: 10px 0;">
          <div class="editor-form-group" style="margin-bottom: 0;">
            <label>تقسيم هذه القطعة (عدد الشركاء الحالي: ${numPartners}):</label>
            <div style="display: flex; gap: 8px;">
              <input type="number" id="modal-subdivide-${s.groupId}" value="${numPartners}" min="1" style="flex: 1; text-align: center;">
              <button type="button" onclick="applySubdivision('${s.groupId}', true); closeModal();" style="background: #1976d2; color: white; border: none; border-radius: 4px; padding: 0 15px; cursor: pointer; font-weight: bold; font-size: 12px;">تطبيق التقسيم</button>
            </div>
          </div>
        </div>
      `;
    }

    modalForm.innerHTML = `
      ${subPieceHtml}
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
      const _l1 = parseFloat(document.getElementById('start-l1') ? document.getElementById('start-l1').value : 50) || 50;
      const _l2 = parseFloat(document.getElementById('start-l2') ? document.getElementById('start-l2').value : 50) || 50;
      customWaterwayData = { userWidthMeters: 7.20, leftTopMeters: (_l1/2)-3.6, rightTopMeters: (_l2/2)-3.6, leftWaterMeters: 7.20, rightWaterMeters: 7.20 };
    }
    if (customWaterwayData.userWidthMeters === undefined) {
      customWaterwayData.userWidthMeters = (customWaterwayData.leftWaterMeters + customWaterwayData.rightWaterMeters) / 2;
    }

    modalTitle.textContent = "💧 تعديل المجرى المائي";

    const wStats = getWaterwayStats();
    const statsHtml = wStats ? `
      <div style="background:#e3f2fd; border:1px solid #90caf9; border-radius:8px; padding:10px; margin-bottom:14px; font-size:13px;">
        <div style="font-weight:bold; color:#0d47a1; margin-bottom:6px;">📊 البيانات الحالية للمجرى</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px;">
          <span style="color:#555;">العرض الحالي:</span><span style="font-weight:bold;">${(wStats.width||0).toFixed(2)} م</span>
          <span style="color:#555;">الطول:</span><span style="font-weight:bold;">${(wStats.length||0).toFixed(2)} م</span>
          <span style="color:#555;">المساحة:</span><span style="font-weight:bold;">${(wStats.area||0).toFixed(2)} م²</span>
          <span style="color:#555;">النسبة من الإجمالي:</span><span style="font-weight:bold; color:#c62828;">${wStats.pct}%</span>
        </div>
      </div>` : '';

    modalForm.innerHTML = `
      ${statsHtml}
      <div class="editor-form-group">
        <label style="font-weight:bold; color:#1565c0;">⚙️ تعديل عرض المجرى (بالمتر):</label>
        <input type="text" inputmode="decimal" id="modal-water-width" value="${(customWaterwayData.userWidthMeters||7.20).toFixed(2)}" style="width:100%; box-sizing:border-box; font-size:15px; font-weight:bold; text-align:center; padding:8px; border-radius:6px; border:1.5px solid #ccc;">
      </div>
      
      <div class="editor-form-group">
        <label style="font-weight:bold; color:#1565c0;">📍 تحديد موقع المجرى المائي:</label>
        <select id="modal-water-pos-type" onchange="document.getElementById('modal-water-pos-pct-container').style.display = (this.value === 'custom_pct' ? 'block' : 'none')" style="width:100%; height:38px; border-radius:6px; border:1.5px solid #ccc; font-weight:bold; font-family:'Cairo'; padding:5px;">
          <option value="middle" ${(customWaterwayData && customWaterwayData.positionType === 'middle') ? 'selected' : ''}>في منتصف الأرض (50%)</option>
          <option value="start" ${(customWaterwayData && customWaterwayData.positionType === 'start') ? 'selected' : ''}>في بداية الأرض (0%)</option>
          <option value="quarter" ${(customWaterwayData && customWaterwayData.positionType === 'quarter') ? 'selected' : ''}>عند ربع الأرض (25%)</option>
          <option value="third" ${(customWaterwayData && customWaterwayData.positionType === 'third') ? 'selected' : ''}>عند ثلث الأرض (33.33%)</option>
          <option value="two_thirds" ${(customWaterwayData && customWaterwayData.positionType === 'two_thirds') ? 'selected' : ''}>عند ثلثي الأرض (66.67%)</option>
          <option value="three_quarters" ${(customWaterwayData && customWaterwayData.positionType === 'three_quarters') ? 'selected' : ''}>عند ثلاثة أرباع الأرض (75%)</option>
          <option value="end" ${(customWaterwayData && customWaterwayData.positionType === 'end') ? 'selected' : ''}>في نهاية الأرض (100%)</option>
          <option value="area_third" ${(customWaterwayData && customWaterwayData.positionType === 'area_third') ? 'selected' : ''}>📍 وضع المجرى عند ثلث المساحة</option>
          <option value="custom_pct" ${(customWaterwayData && customWaterwayData.positionType === 'custom_pct') ? 'selected' : ''}>تحديد يدوي بنسبة مئوية...</option>
        </select>
      </div>

      <div id="modal-water-pos-pct-container" class="editor-form-group" style="display: ${(customWaterwayData && customWaterwayData.positionType === 'custom_pct') ? 'block' : 'none'};">
        <label style="font-weight:bold; color:#1565c0;">النسبة المئوية للموقع (0 - 100):</label>
        <input type="text" inputmode="decimal" id="modal-water-pos-pct" value="${(customWaterwayData && customWaterwayData.positionPct !== undefined) ? customWaterwayData.positionPct : 50}" style="width:100%; box-sizing:border-box; padding:8px; border-radius:6px; border:1.5px solid #ccc; text-align:center; font-weight:bold;">
      </div>

      <div class="editor-form-group" style="border: 1px solid #c5e1a5; padding: 10px; border-radius: 6px; background: #f1f8e9; margin-top:10px;">
        <label style="font-weight:bold; color:#2e7d32; display:block; margin-bottom:6px;">📐 عروض القطع عند المجرى المائي:</label>
        <div class="editor-form-group">
          <label style="font-size:12px; color:#555;">عرض القطعة الغربية عند المجرى (متر):</label>
          <input type="text" inputmode="decimal" id="modal-west-width-at-waterway" value="${((customWaterwayData && customWaterwayData.westWidthAtWaterway !== undefined) ? customWaterwayData.westWidthAtWaterway : (wStats ? wStats.width : 150.00)).toFixed(2)}" style="width:100%; box-sizing:border-box; padding:6px; font-weight:bold; text-align:center; border-radius:6px; border:1.5px solid #ccc;">
        </div>
        <div class="editor-form-group" style="margin-top:6px;">
          <label style="font-size:12px; color:#555;">عرض القطعة الشرقية عند المجرى (متر):</label>
          <input type="text" inputmode="decimal" id="modal-east-width-at-waterway" value="${((customWaterwayData && customWaterwayData.eastWidthAtWaterway !== undefined) ? customWaterwayData.eastWidthAtWaterway : (wStats ? wStats.width : 150.00)).toFixed(2)}" style="width:100%; box-sizing:border-box; padding:6px; font-weight:bold; text-align:center; border-radius:6px; border:1.5px solid #ccc;">
        </div>
      </div>
      
      <div style="background:#f1f8e9; border:1px solid #c5e1a5; border-radius:6px; padding:8px; font-size:12px; color:#2e7d32; margin-top:10px;">
        ✅ بعد التطبيق سيتم إعادة توزيع مساحة وأطوال وعروض القطع تلقائياً
      </div>
    `;
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
  } else if (targetType === 'waterway' || targetType === 'waterway_west') {
    const widthInput = document.getElementById('modal-water-width');
    const posTypeSelect = document.getElementById('modal-water-pos-type');
    const posPctInput = document.getElementById('modal-water-pos-pct');

    if (widthInput) {
      const newWidth = parseArabicFloat(widthInput.value);
      customWaterwayData.userWidthMeters = newWidth >= 0 ? newWidth : 7.20;
    }
    if (posTypeSelect) {
      customWaterwayData.positionType = posTypeSelect.value;
    }
    if (posPctInput) {
      let pct = parseFloat(posPctInput.value);
      if (!isNaN(pct) && pct >= 0 && pct <= 100) {
        customWaterwayData.positionPct = pct;
      }
    }

    const westWidthInput = document.getElementById('modal-west-width-at-waterway');
    const eastWidthInput = document.getElementById('modal-east-width-at-waterway');

    const prevWest = customWaterwayData.westWidthAtWaterway;
    const prevEast = customWaterwayData.eastWidthAtWaterway;

    if (westWidthInput) {
      const w = parseArabicFloat(westWidthInput.value);
      if (!isNaN(w) && w >= 0) customWaterwayData.westWidthAtWaterway = w;
    }
    if (eastWidthInput) {
      const w = parseArabicFloat(eastWidthInput.value);
      if (!isNaN(w) && w >= 0) customWaterwayData.eastWidthAtWaterway = w;
    }

    const isValid = generateCustomLand(true);
    if (!isValid) {
      customWaterwayData.westWidthAtWaterway = prevWest;
      customWaterwayData.eastWidthAtWaterway = prevEast;
      generateCustomLand(true);
      alert("القيمة المدخلة غير ممكنة هندسياً. يرجى إدخال عرض يقع ضمن الحدود المسموح بها.");
      return; // Keep modal open
    }

    modalEditTarget = null;
    closeModal();
    renderSVG();
    saveState();
    selectedElement = { type: 'waterway', id: 'water_new' };
    populateSidebarEditor();
    return; // نخرج مبكراً لأننا أغلقنا المودال يدوياً
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

function getShapeSideLengths(s) {
  if (!s || !s.points || s.points.length < 4) {
    return { top: 0, bot: 0, left: 0, right: 0 };
  }
  const [p_tl, p_tr, p_br, p_bl] = s.points;
  const dist = (pa, pb) => {
    return Math.sqrt(Math.pow(pb.x - pa.x, 2) + Math.pow(pb.y - pa.y, 2));
  };
  return {
    top: dist(p_tl, p_tr),
    bot: dist(p_bl, p_br),
    left: dist(p_tl, p_bl),
    right: dist(p_tr, p_br)
  };
}

function updateTotalDimension(dimension, value) {
  let val = parseFloat(value);
  if (isNaN(val) || val <= 0) return;

  // تحديث القيمة في حقل الإدخال المقابل في مودال البداية
  const startInput = document.getElementById("start-" + dimension);
  if (startInput) {
    startInput.value = val;
  }

  // إعادة بناء ورسم الأرض
  generateCustomLand(true);
  renderSVG();
  saveStateDebounced();

  // تحديث الحقول في السايدبار مع الحفاظ على الـ focus لكي يستمر المستخدم في الكتابة
  const activeInput = document.activeElement;
  const activeInputId = activeInput ? activeInput.id : null;
  const selectionStart = activeInput ? activeInput.selectionStart : null;
  const selectionEnd = activeInput ? activeInput.selectionEnd : null;

  populateSidebarEditor();

  if (activeInputId) {
    const newInp = document.getElementById(activeInputId);
    if (newInp) {
      newInp.focus();
      if (selectionStart !== null && selectionEnd !== null) {
        try {
          newInp.setSelectionRange(selectionStart, selectionEnd);
        } catch(e) {}
      }
    }
  }
}

function setPartnerEditMode(mode) {
  partnerEditMode = mode;
  populateSidebarEditor();
}

function applyTotalDimensions() {
  const w1 = parseFloat(document.getElementById("sidebar-total-width-top").value) || 0;
  const w2 = parseFloat(document.getElementById("sidebar-total-width-bot").value) || 0;
  const l2 = parseFloat(document.getElementById("sidebar-total-len-right").value) || 0;
  const l1 = parseFloat(document.getElementById("sidebar-total-len-left").value) || 0;

  if (w1 <= 0 || w2 <= 0 || l1 <= 0 || l2 <= 0) {
    alert("الرجاء إدخال قيم صحيحة أكبر من الصفر لجميع الأضلاع الأربعة!");
    return;
  }

  // تحديث القيم في مدخلات البداية
  const inpW1 = document.getElementById("start-w1");
  const inpW2 = document.getElementById("start-w2");
  const inpL2 = document.getElementById("start-l2");
  const inpL1 = document.getElementById("start-l1");

  if (inpW1) inpW1.value = w1;
  if (inpW2) inpW2.value = w2;
  if (inpL2) inpL2.value = l2;
  if (inpL1) inpL1.value = l1;

  // إعادة بناء ورسم الأرض
  generateCustomLand(true);
  renderSVG();
  saveStateDebounced();
  populateSidebarEditor();
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
      let subPieceHtml = "";
      
      const isMixedSub = s.isSubPiece && activeTemplateType === 'mixed_waterway_new';
      const isRegularSub = !isMixedSub && (customPartnerWidths && customPartnerWidths.length > 1);

      if (isMixedSub || isRegularSub) {
        let pIndex = 0;
        let groupId = "";
        let customW = null;
        let numPartners = 1;

        if (isMixedSub) {
          pIndex = s.subIndex !== undefined ? s.subIndex : parseInt(s.id.split('_').pop()) || 0;
          groupId = s.groupId || "";
          if (mixedPiecesTree && mixedPiecesTree[groupId] && mixedPiecesTree[groupId].customWidths[pIndex]) {
            customW = mixedPiecesTree[groupId].customWidths[pIndex];
            numPartners = mixedPiecesTree[groupId].partners;
          }
        } else {
          pIndex = parseInt(s.id.split('_')[1]) - 1; // shape_1 => index 0
          if (isNaN(pIndex)) {
            pIndex = s.subIndex !== undefined ? s.subIndex : 0;
          }
          if (customPartnerWidths && customPartnerWidths[pIndex]) {
            customW = customPartnerWidths[pIndex];
            numPartners = customPartnerWidths.length;
          }
        }

        if (isMixedSub) {
          const sideLengths = getShapeSideLengths(s);
          subPieceHtml = `
            <div style="background: #e3f2fd; padding: 10px; border-radius: 6px; border: 1px solid #90caf9; margin-bottom: 15px;">
              <h4 style="margin: 0 0 10px 0; color: #1565c0; font-size: 13px;">⚙️ أبعاد هذه القطعة (أطوال وعروض القطعة)</h4>
              
              <div class="editor-form-group">
                <label>طول القطعة (الجانب الأيسر) بالمتر:</label>
                <input type="number" step="0.01" id="sidebar-mixed-piece-len-left" value="${sideLengths.left.toFixed(2)}">
              </div>
              <div class="editor-form-group">
                <label>طول القطعة (الجانب الأيمن) بالمتر:</label>
                <input type="number" step="0.01" id="sidebar-mixed-piece-len-right" value="${sideLengths.right.toFixed(2)}">
              </div>
              <div class="editor-form-group" style="margin-top: 10px; margin-bottom: 8px;">
                <button type="button" onclick="applyMixedPieceLengths('${groupId}')" style="width: 100%; padding: 8px; background: #1976d2; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-family: 'Cairo'; font-size: 13px;">⚙️ تطبيق الأطوال الجديدة</button>
              </div>
          `;
          
          if (numPartners > 1 && customW) {
            subPieceHtml += `
              <hr style="border: none; border-top: 1px dashed #90caf9; margin: 10px 0;">
              <h4 style="margin: 0 0 8px 0; color: #1565c0; font-size: 12.5px;">⚙️ أبعاد الشريك الحالي داخل القطعة</h4>
              <div style="display: flex; gap: 15px; margin-bottom: 12px; background: #fff; padding: 6px; border-radius: 4px; border: 1px solid #90caf9; justify-content: center;">
                <label style="font-size: 11px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                  <input type="radio" name="piece-edit-mode" value="keep_area" ${partnerEditMode === 'keep_area' ? 'checked' : ''} onchange="setPartnerEditMode('keep_area')">
                  🟢 حفظ المساحة
                </label>
                <label style="font-size: 11px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                  <input type="radio" name="piece-edit-mode" value="free_edit" ${partnerEditMode === 'free_edit' ? 'checked' : ''} onchange="setPartnerEditMode('free_edit')">
                  🟠 تعديل حر
                </label>
              </div>
              <div class="editor-form-group">
                <label>العرض العلوي للشريك (متر):</label>
                <input type="number" step="0.01" id="sidebar-piece-width-top" value="${customW.top.toFixed(2)}" oninput="updateSubPieceWidth('${groupId}', ${pIndex}, 'top', this.value)">
              </div>
              <div class="editor-form-group">
                <label>العرض السفلي للشريك (متر):</label>
                <input type="number" step="0.01" id="sidebar-piece-width-bot" value="${customW.bot.toFixed(2)}" oninput="updateSubPieceWidth('${groupId}', ${pIndex}, 'bot', this.value)">
              </div>
            `;
          } else if (customW) {
            subPieceHtml += `
              <div class="editor-form-group">
                <label>العرض العلوي (متر): <span style="font-size:10.5px; color:#777;">(تلقائي)</span></label>
                <input type="text" value="${customW.top.toFixed(2)}" readonly style="background: #f5f5f5; color: #666; cursor: not-allowed; text-align: center;">
              </div>
              <div class="editor-form-group">
                <label>العرض السفلي (متر): <span style="font-size:10.5px; color:#777;">(تلقائي)</span></label>
                <input type="text" value="${customW.bot.toFixed(2)}" readonly style="background: #f5f5f5; color: #666; cursor: not-allowed; text-align: center;">
              </div>
            `;
          }
          
          subPieceHtml += `
              <hr style="border: none; border-top: 1px dashed #90caf9; margin: 10px 0;">
              <div class="editor-form-group" style="margin-bottom: 0;">
                <label>تقسيم هذه القطعة (عدد الشركاء الحالي: ${numPartners}):</label>
                <div style="display: flex; gap: 8px;">
                  <input type="number" id="subdivide-${groupId}" value="${numPartners}" min="1" style="flex: 1; text-align: center;">
                  <button type="button" onclick="applySubdivision('${groupId}')" style="background: #1976d2; color: white; border: none; border-radius: 4px; padding: 0 15px; cursor: pointer; font-weight: bold; font-size: 12px;">تطبيق</button>
                </div>
              </div>
            </div>
          `;
        } else if (isRegularSub && customW) {
          const sideLengths = getShapeSideLengths(s);
          const isReadOnly = numPartners === 1;
          
          if (isReadOnly) {
            subPieceHtml = `
              <div style="background: #e3f2fd; padding: 10px; border-radius: 6px; border: 1px solid #90caf9; margin-bottom: 15px;">
                <h4 style="margin: 0 0 10px 0; color: #1565c0; font-size: 13px;">⚙️ أبعاد هذه القطعة (أبعاد الأرض الكلية)</h4>
                
                <div class="editor-form-group">
                  <label>العرض العلوي (متر):</label>
                  <input type="number" step="0.01" id="sidebar-total-width-top" value="${customW.top.toFixed(2)}">
                </div>
                <div class="editor-form-group">
                  <label>العرض السفلي (متر):</label>
                  <input type="number" step="0.01" id="sidebar-total-width-bot" value="${customW.bot.toFixed(2)}">
                </div>
                <div class="editor-form-group">
                  <label>الطول الأيمن (متر):</label>
                  <input type="number" step="0.01" id="sidebar-total-len-right" value="${sideLengths.right.toFixed(2)}">
                </div>
                <div class="editor-form-group">
                  <label>الطول الأيسر (متر):</label>
                  <input type="number" step="0.01" id="sidebar-total-len-left" value="${sideLengths.left.toFixed(2)}">
                </div>
                <div class="editor-form-group" style="margin-top: 10px; margin-bottom: 8px;">
                  <button type="button" onclick="applyTotalDimensions()" style="width: 100%; padding: 8px; background: #2e7d32; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-family: 'Cairo'; font-size: 13px;">⚙️ تطبيق الأبعاد ورسم الكروكي</button>
                </div>
                <p style="font-size: 11px; color: #555; margin: 4px 0; line-height: 1.4; font-weight: bold; background: #fff3e0; padding: 6px; border-radius: 4px; border: 1px dashed #ffe082;">
                  💡 قم بتعديل القيم ثم اضغط على زر التطبيق أعلاه لإعادة رسم الكروكي. لتقسيم الأرض وتعديل أبعاد الشركاء، زد عدد الشركاء بالأسفل.
                </p>
              </div>
            `;
          } else {
            subPieceHtml = `
              <div style="background: #e3f2fd; padding: 10px; border-radius: 6px; border: 1px solid #90caf9; margin-bottom: 15px;">
                <h4 style="margin: 0 0 10px 0; color: #1565c0; font-size: 13px;">⚙️ أبعاد هذه القطعة</h4>
                
                <div style="display: flex; gap: 15px; margin-bottom: 12px; background: #fff; padding: 6px; border-radius: 4px; border: 1px solid #90caf9; justify-content: center;">
                  <label style="font-size: 11px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                    <input type="radio" name="piece-edit-mode" value="keep_area" ${partnerEditMode === 'keep_area' ? 'checked' : ''} onchange="setPartnerEditMode('keep_area')">
                    🟢 حفظ المساحة
                  </label>
                  <label style="font-size: 11px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                    <input type="radio" name="piece-edit-mode" value="free_edit" ${partnerEditMode === 'free_edit' ? 'checked' : ''} onchange="setPartnerEditMode('free_edit')">
                    🟠 تعديل حر
                  </label>
                </div>

                <div class="editor-form-group">
                  <label>العرض العلوي (متر):</label>
                  <input type="number" step="0.01" id="sidebar-piece-width-top" value="${customW.top.toFixed(2)}" oninput="updateSubPieceWidth('${groupId}', ${pIndex}, 'top', this.value)">
                </div>
                <div class="editor-form-group">
                  <label>العرض السفلي (متر):</label>
                  <input type="number" step="0.01" id="sidebar-piece-width-bot" value="${customW.bot.toFixed(2)}" oninput="updateSubPieceWidth('${groupId}', ${pIndex}, 'bot', this.value)">
                </div>
                <div class="editor-form-group">
                  <label>الطول الأيمن الفعلي (متر): <span style="font-size: 10.5px; color: #777;">(يُحسب تلقائياً)</span></label>
                  <input type="text" value="${sideLengths.right.toFixed(2)}" readonly style="background: #f5f5f5; color: #666; cursor: not-allowed; text-align: center;">
                </div>
                <div class="editor-form-group">
                  <label>الطول الأيسر الفعلي (متر): <span style="font-size: 10.5px; color: #777;">(يُحسب تلقائياً)</span></label>
                  <input type="text" value="${sideLengths.left.toFixed(2)}" readonly style="background: #f5f5f5; color: #666; cursor: not-allowed; text-align: center;">
                </div>
              </div>
            `;
          }
        }
      }

      html = `
        ${subPieceHtml}
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
  } else if (selectedElement.type === 'waterway') {
    // بطاقة بيانات المجرى المائي في السايدبار
    const ws = getWaterwayStats();
    if (ws) {
      const curWidth = (customWaterwayData && customWaterwayData.userWidthMeters !== undefined && customWaterwayData.userWidthMeters !== null) ? customWaterwayData.userWidthMeters.toFixed(2) : ws.width.toFixed(2);
      html = `
        <div style="background:#e3f2fd; padding:12px; border-radius:8px; border:1px solid #90caf9; margin-bottom:14px;">
          <div style="font-weight:bold; color:#0d47a1; font-size:14px; margin-bottom:10px;">💧 بيانات المجرى المائي</div>
          <table style="width:100%; font-size:13px; border-collapse:collapse;">
            <tr><td style="padding:3px 0; color:#555;">العرض:</td><td style="font-weight:bold; color:#1565c0;">${ws.width.toFixed(2)} م</td></tr>
            <tr><td style="padding:3px 0; color:#555;">الطول:</td><td style="font-weight:bold;">${ws.length.toFixed(2)} م</td></tr>
            <tr><td style="padding:3px 0; color:#555;">المساحة:</td><td style="font-weight:bold;">${ws.area.toFixed(2)} م²</td></tr>
            <tr><td style="padding:3px 0; color:#555;">نسبة من الإجمالي:</td><td style="font-weight:bold; color:#c62828;">${ws.pct}%</td></tr>
            <tr style="border-top:1px dashed #90caf9;"><td style="padding:5px 0 3px; color:#555;">المساحة الكلية:</td><td style="font-weight:bold;">${ws.totalArea.toFixed(2)} م²</td></tr>
          </table>
        </div>

        <div style="background:#f9fbe7; padding:10px; border-radius:8px; border:1px solid #dce775; margin-bottom:10px;">
          <div style="font-weight:bold; color:#558b2f; font-size:13px; margin-bottom:8px;">⚡ تعديل عرض المجرى مباشرة</div>
          <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
            <input type="text" inputmode="decimal" id="sidebar-water-width"
              value="${curWidth}"
              style="flex:1; padding:8px; border:2px solid #aed581; border-radius:6px; font-size:15px; font-weight:bold; text-align:center; font-family:'Cairo';"
              placeholder="مثال: 3.50">
            <button type="button" onclick="applyWaterwayWidthChange('sidebar-water-width')"
              style="background:#558b2f; color:white; border:none; border-radius:6px; padding:8px 14px; font-weight:bold; cursor:pointer; font-family:'Cairo'; font-size:13px; white-space:nowrap;">
              ✔ تطبيق
            </button>
          </div>
          
          <div style="font-weight:bold; color:#558b2f; font-size:13px; margin-bottom:8px; margin-top:12px;">📍 تحديد موقع المجرى المائي</div>
          <select id="sidebar-water-pos-type" onchange="handleWaterwayPositionTypeChange(this.value)" style="width:100%; height:38px; border-radius:6px; border:2px solid #aed581; font-weight:bold; font-family:'Cairo'; padding:5px; margin-bottom:8px;">
            <option value="middle" ${(customWaterwayData && customWaterwayData.positionType === 'middle') ? 'selected' : ''}>في منتصف الأرض (50%)</option>
            <option value="start" ${(customWaterwayData && customWaterwayData.positionType === 'start') ? 'selected' : ''}>في بداية الأرض (0%)</option>
            <option value="quarter" ${(customWaterwayData && customWaterwayData.positionType === 'quarter') ? 'selected' : ''}>عند ربع الأرض (25%)</option>
            <option value="third" ${(customWaterwayData && customWaterwayData.positionType === 'third') ? 'selected' : ''}>عند ثلث الأرض (33.33%)</option>
            <option value="two_thirds" ${(customWaterwayData && customWaterwayData.positionType === 'two_thirds') ? 'selected' : ''}>عند ثلثي الأرض (66.67%)</option>
            <option value="three_quarters" ${(customWaterwayData && customWaterwayData.positionType === 'three_quarters') ? 'selected' : ''}>عند ثلاثة أرباع الأرض (75%)</option>
            <option value="end" ${(customWaterwayData && customWaterwayData.positionType === 'end') ? 'selected' : ''}>في نهاية الأرض (100%)</option>
            <option value="area_third" ${(customWaterwayData && customWaterwayData.positionType === 'area_third') ? 'selected' : ''}>📍 وضع المجرى عند ثلث المساحة</option>
            <option value="custom_pct" ${(customWaterwayData && customWaterwayData.positionType === 'custom_pct') ? 'selected' : ''}>تحديد يدوي بنسبة مئوية...</option>
          </select>
          
          <div id="sidebar-water-pos-pct-container" style="display: ${(customWaterwayData && customWaterwayData.positionType === 'custom_pct') ? 'block' : 'none'}; margin-top:8px;">
            <label style="font-size:11px; font-weight:bold; color:#555; display:block; margin-bottom:4px;">النسبة المئوية للموقع (0 - 100):</label>
            <div style="display:flex; gap:8px; align-items:center;">
              <input type="text" inputmode="decimal" id="sidebar-water-pos-pct" value="${(customWaterwayData && customWaterwayData.positionPct !== undefined) ? customWaterwayData.positionPct : 50}" style="flex:1; padding:8px; border:2px solid #aed581; border-radius:6px; font-size:15px; font-weight:bold; text-align:center; font-family:'Cairo';">
              <button type="button" onclick="applyWaterwayPositionPct('sidebar-water-pos-pct')" style="background:#558b2f; color:white; border:none; border-radius:6px; padding:8px 14px; font-weight:bold; cursor:pointer; font-family:'Cairo'; font-size:13px; white-space:nowrap;">تطبيق نسبة</button>
            </div>
          </div>
        </div>

        <div style="background:#e8f5e9; padding:10px; border-radius:8px; border:1px solid #a5d6a7; margin-bottom:10px;">
          <div style="font-weight:bold; color:#2e7d32; font-size:13px; margin-bottom:8px;">📐 تعديل عروض القطع عند المجرى</div>
          <div class="editor-form-group">
            <label>عرض القطعة الغربية عند المجرى (متر):</label>
            <input type="text" inputmode="decimal" id="sidebar-west-width-at-waterway" value="${((customWaterwayData && customWaterwayData.westWidthAtWaterway !== undefined) ? customWaterwayData.westWidthAtWaterway : ws.width).toFixed(2)}" style="width:100%; box-sizing:border-box; padding:6px; font-size:14px; font-weight:bold; text-align:center; font-family:'Cairo'; border:2px solid #a5d6a7; border-radius:6px;">
          </div>
          <div class="editor-form-group" style="margin-top:8px;">
            <label>عرض القطعة الشرقية عند المجرى (متر):</label>
            <input type="text" inputmode="decimal" id="sidebar-east-width-at-waterway" value="${((customWaterwayData && customWaterwayData.eastWidthAtWaterway !== undefined) ? customWaterwayData.eastWidthAtWaterway : ws.width).toFixed(2)}" style="width:100%; box-sizing:border-box; padding:6px; font-size:14px; font-weight:bold; text-align:center; font-family:'Cairo'; border:2px solid #a5d6a7; border-radius:6px;">
          </div>
          <div class="editor-form-group" style="margin-top:10px; margin-bottom:4px;">
            <button type="button" onclick="applyWidthsAtWaterway()" style="width:100%; padding:8px; background:#2e7d32; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-family:'Cairo'; font-size:13px;">⚙️ تطبيق العرض الجديد</button>
          </div>
        </div>

        <div style="background:#f1f8e9; border:1px solid #c5e1a5; border-radius:6px; padding:8px; font-size:12px; color:#2e7d32;">
          ✅ مساحة الإجمالي = غربية ${ws.westArea.toFixed(1)} م² + مجرى ${ws.area.toFixed(1)} م² + شرقية ${ws.eastArea.toFixed(1)} م²
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
    case 'waterway': return "مجرى مائي";
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

function updateSubPieceWidth(groupId, pIndex, field, value) {
  let val = parseFloat(value);
  if (isNaN(val) || val < 0) val = 0;

  let widthsArr = null;
  if (groupId && mixedPiecesTree && mixedPiecesTree[groupId]) {
    widthsArr = mixedPiecesTree[groupId].customWidths;
  } else {
    widthsArr = customPartnerWidths;
  }

  if (!widthsArr || !widthsArr[pIndex]) return;

  const oldVal = widthsArr[pIndex][field] || 0;
  const diff = val - oldVal;

  // تحديد القطعة المجاورة لامتصاص الفارق (التالية، وإذا كانت الأخيرة فالسابقة)
  let targetIdx = pIndex + 1;
  if (pIndex === widthsArr.length - 1) {
    targetIdx = pIndex - 1;
  }

  if (targetIdx >= 0 && targetIdx < widthsArr.length) {
    if (partnerEditMode === 'keep_area') {
      // وضع الحفاظ على المساحة: نعدل الحقل المقابل للقطعة والجار
      const oppField = field === 'top' ? 'bot' : 'top';
      const oppVal = (widthsArr[pIndex][oppField] || 0) - diff;
      
      const neighborFieldNew = (widthsArr[targetIdx][field] || 0) - diff;
      const neighborOppNew = (widthsArr[targetIdx][oppField] || 0) + diff;

      // نتحقق من صلاحية القيم الأربع
      if (val >= 0 && oppVal >= 0 && neighborFieldNew >= 0 && neighborOppNew >= 0) {
        widthsArr[pIndex][field] = val;
        widthsArr[pIndex][oppField] = oppVal;
        widthsArr[targetIdx][field] = neighborFieldNew;
        widthsArr[targetIdx][oppField] = neighborOppNew;
      }
    } else {
      // وضع التعديل الحر
      const neighborOldVal = widthsArr[targetIdx][field] || 0;
      const neighborNewVal = neighborOldVal - diff;

      if (val >= 0 && neighborNewVal >= 0) {
        widthsArr[pIndex][field] = val;
        widthsArr[targetIdx][field] = neighborNewVal;
      } else {
        if (neighborNewVal < 0) {
          const maxAllowedVal = oldVal + neighborOldVal;
          widthsArr[pIndex][field] = maxAllowedVal;
          widthsArr[targetIdx][field] = 0;
        }
      }
    }
  } else {
    // إذا لم يكن هناك جار، نقوم بالتحديث مباشرة
    widthsArr[pIndex][field] = val;
  }

  // إعادة بناء الكروكي وتحديث الرسم وحفظ الحالة
  generateCustomLand(true); 
  renderSVG();
  saveStateDebounced();

  // تحديث الحقول في السايدبار بعد إعادة الرسم لتظهر الأبعاد المجاورة المحدثة تلقائياً
  const activeInput = document.activeElement;
  const activeInputId = activeInput ? activeInput.id : null;
  const selectionStart = activeInput ? activeInput.selectionStart : null;
  const selectionEnd = activeInput ? activeInput.selectionEnd : null;

  populateSidebarEditor();

  if (activeInputId) {
    const newInp = document.getElementById(activeInputId);
    if (newInp) {
      newInp.focus();
      if (selectionStart !== null && selectionEnd !== null) {
        try {
          newInp.setSelectionRange(selectionStart, selectionEnd);
        } catch(e) {}
      }
    }
  }
}

function applyMixedPieceLengthSilent(groupId, side, val) {
  const l1Val = parseArabicFloat(document.getElementById("start-l1").value) || 50;
  const l2Val = parseArabicFloat(document.getElementById("start-l2").value) || 50;
  const uw = (customWaterwayData && customWaterwayData.userWidthMeters !== undefined) ? customWaterwayData.userWidthMeters : 7.20;
  const totalSideLen = side === 'left' ? l1Val : l2Val;
  const remainingSideLen = totalSideLen - uw;

  if (remainingSideLen <= 0) return;

  let r_pos = 0.5;
  if (groupId === 'west') {
    if (val > remainingSideLen) val = remainingSideLen;
    r_pos = val / remainingSideLen;
  } else {
    if (val > remainingSideLen) val = remainingSideLen;
    r_pos = (remainingSideLen - val) / remainingSideLen;
  }

  if (!customWaterwayData) {
    customWaterwayData = {
      userWidthMeters: uw,
      positionType: 'custom_pct',
      positionPct: r_pos * 100,
      leftTopMeters: (l1Val - uw) * r_pos,
      rightTopMeters: (l2Val - uw) * r_pos,
      leftWaterMeters: uw,
      rightWaterMeters: uw
    };
  } else {
    customWaterwayData.positionType = 'custom_pct';
    customWaterwayData.positionPct = r_pos * 100;
  }

  generateCustomLand(true);
}

function updateMixedPieceLength(groupId, side, value) {
  let val = parseFloat(value);
  if (isNaN(val) || val < 0) val = 0;

  applyMixedPieceLengthSilent(groupId, side, val);

  renderSVG();
  saveStateDebounced();

  const activeInput = document.activeElement;
  const activeInputId = activeInput ? activeInput.id : null;
  const selectionStart = activeInput ? activeInput.selectionStart : null;
  const selectionEnd = activeInput ? activeInput.selectionEnd : null;

  populateSidebarEditor();

  if (activeInputId) {
    const newInp = document.getElementById(activeInputId);
    if (newInp) {
      newInp.focus();
      if (selectionStart !== null && selectionEnd !== null) {
        try {
          newInp.setSelectionRange(selectionStart, selectionEnd);
        } catch(e) {}
      }
    }
  }
}

function applyMixedPieceLengths(groupId) {
  const leftInput = document.getElementById("sidebar-mixed-piece-len-left");
  const rightInput = document.getElementById("sidebar-mixed-piece-len-right");
  if (!leftInput || !rightInput) return;

  const s = shapes.find(x => x.isSubPiece && x.groupId === groupId);
  if (!s) return;

  const sideLengths = getShapeSideLengths(s);
  const newLeft = parseFloat(leftInput.value);
  const newRight = parseFloat(rightInput.value);

  if (isNaN(newLeft) || isNaN(newRight) || newLeft < 0 || newRight < 0) {
    alert("الرجاء إدخال قيم أطوال صحيحة أكبر من الصفر.");
    return;
  }

  const leftDiff = Math.abs(newLeft - sideLengths.left);
  const rightDiff = Math.abs(newRight - sideLengths.right);

  if (leftDiff > 0.001) {
    updateMixedPieceLength(groupId, 'left', newLeft);
  } else if (rightDiff > 0.001) {
    updateMixedPieceLength(groupId, 'right', newRight);
  }
}

function applyWidthsAtWaterway() {
  const westInput = document.getElementById("sidebar-west-width-at-waterway");
  const eastInput = document.getElementById("sidebar-east-width-at-waterway");
  if (!westInput || !eastInput) return;

  let westW = parseArabicFloat(westInput.value);
  let eastW = parseArabicFloat(eastInput.value);

  if (isNaN(westW) || isNaN(eastW) || westW <= 0 || eastW <= 0) {
    alert("الرجاء إدخال قيم عروض صحيحة أكبر من الصفر.");
    return;
  }

  if (!customWaterwayData) {
    customWaterwayData = {
      userWidthMeters: 7.20,
      positionType: 'middle',
      positionPct: 50.0,
      leftWaterMeters: 7.20,
      rightWaterMeters: 7.20
    };
  }

  const prevWest = customWaterwayData.westWidthAtWaterway;
  const prevEast = customWaterwayData.eastWidthAtWaterway;

  customWaterwayData.westWidthAtWaterway = westW;
  customWaterwayData.eastWidthAtWaterway = eastW;

  const isValid = generateCustomLand(true);
  if (!isValid) {
    // Revert
    customWaterwayData.westWidthAtWaterway = prevWest;
    customWaterwayData.eastWidthAtWaterway = prevEast;
    generateCustomLand(true);
    alert("القيمة المدخلة غير ممكنة هندسياً. يرجى إدخال عرض يقع ضمن الحدود المسموح بها.");
    populateSidebarEditor();
    return;
  }

  renderSVG();
  saveState();
  populateSidebarEditor();
}

// ----------------------------------------------------
// Waterway Width Control - تحكم عرض المجرى المائي
// ----------------------------------------------------
function applyWaterwayWidthChange(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  let newWidth = parseArabicFloat(input.value);
  if (newWidth < 0) {
    alert('الرجاء إدخال عرض صحيح أكبر من أو يساوي الصفر.');
    return;
  }

  // الحد الأقصى: لا يزيد عن 90% من أصغر طول
  const l1Val = parseArabicFloat(document.getElementById('start-l1') ? document.getElementById('start-l1').value : "9999");
  const l2Val = parseArabicFloat(document.getElementById('start-l2') ? document.getElementById('start-l2').value : "9999");
  const maxAllowed = Math.min(l1Val > 0 ? l1Val : 9999, l2Val > 0 ? l2Val : 9999) * 0.9;
  if (newWidth >= maxAllowed) {
    alert('عرض المجرى كبير جداً! الحد الأقصى المسموح به: ' + maxAllowed.toFixed(2) + ' م');
    return;
  }

  if (!customWaterwayData) customWaterwayData = {};
  customWaterwayData.userWidthMeters = newWidth;

  generateCustomLand(true);
  renderSVG();
  saveState();

  // تحديث السايدبار ليعكس البيانات الجديدة
  selectedElement = { type: 'waterway', id: 'water_new' };
  populateSidebarEditor();
}

function handleWaterwayPositionTypeChange(value) {
  if (!customWaterwayData) {
    const l1Val = parseArabicFloat(document.getElementById("start-l1").value) || 50;
    const l2Val = parseArabicFloat(document.getElementById("start-l2").value) || 50;
    customWaterwayData = {
      userWidthMeters: 7.20,
      positionType: 'middle',
      positionPct: 50.0,
      leftTopMeters: (l1Val - 7.20) / 2,
      rightTopMeters: (l2Val - 7.20) / 2,
      leftWaterMeters: 7.20,
      rightWaterMeters: 7.20
    };
  }
  customWaterwayData.positionType = value;
  if (value !== 'custom_pct') {
    generateCustomLand(true);
    renderSVG();
    saveStateDebounced();
    populateSidebarEditor();
  } else {
    const container = document.getElementById('sidebar-water-pos-pct-container');
    if (container) container.style.display = 'block';
  }
}

function applyWaterwayPositionPct(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  let pct = parseFloat(input.value);
  if (isNaN(pct) || pct < 0 || pct > 100) {
    alert('الرجاء إدخال نسبة مئوية صحيحة بين 0 و 100.');
    return;
  }
  customWaterwayData.positionPct = pct;
  generateCustomLand(true);
  renderSVG();
  saveState();
  populateSidebarEditor();
}

function getWaterwayStats() {
  if (!customWaterwayData || activeTemplateType !== 'mixed_waterway_new') return null;
  const w = waterways.find(function(x) { return x.id === 'water_new'; });
  if (!w || !w.stats) return null;

  const shapesArea = shapes.reduce(function(sum, s) { return sum + (s.area ? s.area.sqm : 0); }, 0);
  const totalArea = shapesArea + w.stats.area;
  const pct = totalArea > 0 ? ((w.stats.area / totalArea) * 100).toFixed(2) : '0.00';

  const westArea = shapes.filter(function(s) { return s.groupId === 'west'; })
                         .reduce(function(sum, s) { return sum + (s.area ? s.area.sqm : 0); }, 0);
  const eastArea = shapes.filter(function(s) { return s.groupId === 'east'; })
                         .reduce(function(sum, s) { return sum + (s.area ? s.area.sqm : 0); }, 0);

  return {
    width: (customWaterwayData.userWidthMeters !== undefined && customWaterwayData.userWidthMeters !== null) ? customWaterwayData.userWidthMeters : w.stats.width,
    length: w.stats.length,
    area: w.stats.area,
    pct: pct,
    totalArea: totalArea,
    westArea: westArea,
    eastArea: eastArea
  };
}

function applySubdivision(groupId, isModal = false) {
  const inputId = isModal ? `modal-subdivide-${groupId}` : `subdivide-${groupId}`;
  const input = document.getElementById(inputId);
  if (!input) return;
  let newPartners = parseInt(input.value);
  if (isNaN(newPartners) || newPartners < 1) newPartners = 1;
  
  if (!mixedPiecesTree) return;
  
  mixedPiecesTree[groupId].partners = newPartners;
  // Clear customWidths so they get regenerated evenly in generateCustomLand
  mixedPiecesTree[groupId].customWidths = [];
  
  generateCustomLand(true);
  renderSVG();
  saveState();
  
  // Clear selection since the old shape IDs might be gone
  selectedElement = null;
  populateSidebarEditor();
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
  
  const centerMeters = getRealCoords({ x: 450, y: 280 });
  const x = spawnX !== undefined ? spawnX : centerMeters.x;
  const y = spawnY !== undefined ? spawnY : centerMeters.y;

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
  const centerMeters = getRealCoords({ x: 450, y: 280 });
  const x = centerMeters.x;
  const y = centerMeters.y;

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
  const p_start = getRealCoords({ x: 250, y: 325 });
  const p_end = getRealCoords({ x: 650, y: 325 });
  const p_label = getRealCoords({ x: 450, y: 310 });

  splitLines.push({
    id: id,
    x1: p_start.x, y1: p_start.y,
    x2: p_end.x, y2: p_end.y,
    label: "حد فاصل جديد",
    labelX: p_label.x, labelY: p_label.y,
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
        x: t.x + 2,
        y: t.y + 2
      });
      selectedElement = { type: 'freeText', id: newId };
    }
  } else if (type === 'borderLabel') {
    const b = borderLabels.find(x => x.id === id);
    if (b) {
      borderLabels.push({
        ...JSON.parse(JSON.stringify(b)),
        id: newId,
        x: b.x + 2,
        y: b.y + 2
      });
      selectedElement = { type: 'borderLabel', id: newId };
    }
  } else if (type === 'splitLine') {
    const l = splitLines.find(x => x.id === id);
    if (l) {
      splitLines.push({
        ...JSON.parse(JSON.stringify(l)),
        id: newId,
        x1: l.x1 + 2, y1: l.y1 + 2,
        x2: l.x2 + 2, y2: l.y2 + 2,
        labelX: l.labelX + 2, labelY: l.labelY + 2
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
  const partnersGroup = document.getElementById("start-partners-group");
  if (partnersGroup) {
    if (activeTemplateType === 'mixed_waterway_new' || activeTemplateType === 'mixed_split_image') {
      partnersGroup.style.display = 'none';
    } else {
      partnersGroup.style.display = 'block';
    }
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

  const p1 = { x: -drawW / 2, y: -drawL / 2 };
  const p2 = { x: drawW / 2, y: -drawL / 2 };
  const p3 = { x: drawW / 2, y: drawL / 2 };
  const p4 = { x: -drawW / 2, y: drawL / 2 };

  const totalArea = 1800; // 30 * 60

  shapes = [{
    id: "shape_1",
    points: [p1, p2, p3, p4],
    owner: "اسم المالك",
    area: { feddan: 0, carat: 10, shares: 6.81, sqm: totalArea },
    notes: "خريطة ارض",
    color: "#ffffff",
    textX: 0,
    textY: 0
  }];

  borderLabels = [
    { id: "border_1", text: "غربي 60.00 م", x: 0, y: p1.y - 1.5, fontSize: 13, angle: 0 },
    { id: "border_2", text: "شرقي 60.00 م", x: 0, y: p4.y + 1.5, fontSize: 13, angle: 0 },
    { id: "border_3", text: "قبلي 30.00 م", x: p1.x - 1.5, y: 0, fontSize: 13, angle: -90 },
    { id: "border_4", text: "بحري 30.00 م", x: p2.x + 1.5, y: 0, fontSize: 13, angle: 90 }
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
    
    // Group shapes by parentShape.name
    const parentGroups = {};
    shapes.forEach(s => {
      if (s.isSubPiece && s.parentShape) {
        if (!parentGroups[s.parentShape.name]) {
          parentGroups[s.parentShape.name] = {
            parentData: s.parentShape,
            subPieces: []
          };
        }
        parentGroups[s.parentShape.name].subPieces.push(s);
      }
    });

    Object.values(parentGroups).forEach(group => {
      detailedReportHTML += `<div style="background: #f1f8e9; border: 1px solid #c5e1a5; border-radius: 8px; padding: 15px; margin-bottom: 20px; page-break-inside: avoid;">`;
      detailedReportHTML += `<h3 style="color: #2e7d32; margin-top: 0; margin-bottom: 10px;">👤 ${group.parentData.name}</h3>`;
      detailedReportHTML += `<p style="font-weight: bold; font-size: 14px; margin-bottom: 15px; color: #333; padding-right: 5px;">إجمالي مساحة القطعة: ${group.parentData.area.toFixed(2)} م²</p>`;
      
      if (group.subPieces && group.subPieces.length > 0) {
        detailedReportHTML += `<div style="display: flex; gap: 15px; flex-wrap: wrap;">`;
        group.subPieces.forEach(sub => {
          detailedReportHTML += `<div style="flex: 1; min-width: 250px; background: #fff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">`;
          detailedReportHTML += `<h4 style="color: #1565c0; margin-top: 0; margin-bottom: 10px; border-bottom: 1px dashed #bbdefb; padding-bottom: 5px;">📍 ${sub.notes || sub.owner}</h4>`;
          detailedReportHTML += `<table style="width: 100%; font-size: 13px; border-collapse: collapse;">`;
          const addRowStr = (label, valStr) => `<tr><td style="padding: 4px 0; color: #555;">${label}</td><td style="padding: 4px 0; font-weight: bold; text-align: left; color: #222;">${valStr}</td></tr>`;
          
          detailedReportHTML += addRowStr("المساحة:", `${sub.area.sqm.toFixed(2)} م²`);
          detailedReportHTML += addRowStr("نسبة الشريك:", `${sub.area.feddan} فدان، ${sub.area.carat} قيراط، ${sub.area.shares} سهم`);
          
          detailedReportHTML += `</table></div>`;
        });
        detailedReportHTML += `</div>`;
      }
      detailedReportHTML += `</div>`;
    });

    if (waterways && waterways.length > 0) {
       const ws = getWaterwayStats();
       if (ws) {
         const wUserWidth = (customWaterwayData && customWaterwayData.userWidthMeters !== undefined && customWaterwayData.userWidthMeters !== null)
           ? customWaterwayData.userWidthMeters.toFixed(2)
           : ws.width.toFixed(2);

         // ----- قسم المجرى المائي المستقل -----
         detailedReportHTML += `<div style="background: #e3f2fd; border: 2px solid #42a5f5; border-radius: 10px; padding: 18px; margin-bottom: 20px; page-break-inside: avoid;">`;
         detailedReportHTML += `<h3 style="color: #0d47a1; margin-top: 0; margin-bottom: 14px; display:flex; align-items:center; gap:8px;">💧 تفاصيل المجرى المائي</h3>`;
         detailedReportHTML += `<table style="width: 100%; font-size: 14px; border-collapse: collapse;">`;
         detailedReportHTML += `<tr style="background:#bbdefb;"><td style="padding:8px 10px; color:#0d47a1; font-weight:bold; border:1px solid #90caf9;">البيان</td><td style="padding:8px 10px; font-weight:bold; border:1px solid #90caf9; color:#0d47a1;">القيمة</td></tr>`;
         detailedReportHTML += `<tr><td style="padding:7px 10px; border:1px solid #e3f2fd; color:#555;">عرض المجرى</td><td style="padding:7px 10px; border:1px solid #e3f2fd; font-weight:bold;">${wUserWidth} م</td></tr>`;
         detailedReportHTML += `<tr style="background:#f8fbff;"><td style="padding:7px 10px; border:1px solid #e3f2fd; color:#555;">طول المجرى</td><td style="padding:7px 10px; border:1px solid #e3f2fd; font-weight:bold;">${ws.length.toFixed(2)} م</td></tr>`;
         detailedReportHTML += `<tr><td style="padding:7px 10px; border:1px solid #e3f2fd; color:#555;">مساحة المجرى</td><td style="padding:7px 10px; border:1px solid #e3f2fd; font-weight:bold;">${ws.area.toFixed(2)} م²</td></tr>`;
         detailedReportHTML += `<tr style="background:#f8fbff;"><td style="padding:7px 10px; border:1px solid #e3f2fd; color:#555;">نسبة المجرى من الإجمالي</td><td style="padding:7px 10px; border:1px solid #e3f2fd; font-weight:bold; color:#c62828;">${ws.pct}%</td></tr>`;
         detailedReportHTML += `</table></div>`;

         // ----- ملخص المساحات الإجمالي -----
         detailedReportHTML += `<div style="background:#e8f5e9; border:2px solid #66bb6a; border-radius:10px; padding:18px; margin-bottom:20px; page-break-inside:avoid;">`;
         detailedReportHTML += `<h3 style="color:#1b5e20; margin-top:0; margin-bottom:14px;">📊 ملخص المساحات الإجمالي</h3>`;
         detailedReportHTML += `<table style="width:100%; font-size:14px; border-collapse:collapse;">`;
         detailedReportHTML += `<tr style="background:#c8e6c9;"><td style="padding:8px 10px; font-weight:bold; border:1px solid #a5d6a7;">البيان</td><td style="padding:8px 10px; font-weight:bold; border:1px solid #a5d6a7;">المساحة (م²)</td><td style="padding:8px 10px; font-weight:bold; border:1px solid #a5d6a7;">النسبة %</td></tr>`;
         const wPct = parseFloat(ws.pct);
         const totalA = ws.totalArea;
         const westPct = totalA > 0 ? ((ws.westArea / totalA) * 100).toFixed(2) : '0.00';
         const eastPct = totalA > 0 ? ((ws.eastArea / totalA) * 100).toFixed(2) : '0.00';
         detailedReportHTML += `<tr><td style="padding:7px 10px; border:1px solid #e8f5e9; color:#1b5e20;">القطعة الغربية</td><td style="padding:7px 10px; border:1px solid #e8f5e9; font-weight:bold;">${ws.westArea.toFixed(2)}</td><td style="padding:7px 10px; border:1px solid #e8f5e9;">${westPct}%</td></tr>`;
         detailedReportHTML += `<tr style="background:#f1f8e9;"><td style="padding:7px 10px; border:1px solid #e8f5e9; color:#1565c0;">المجرى المائي</td><td style="padding:7px 10px; border:1px solid #e8f5e9; font-weight:bold;">${ws.area.toFixed(2)}</td><td style="padding:7px 10px; border:1px solid #e8f5e9; color:#c62828;">${ws.pct}%</td></tr>`;
         detailedReportHTML += `<tr><td style="padding:7px 10px; border:1px solid #e8f5e9; color:#1b5e20;">القطعة الشرقية</td><td style="padding:7px 10px; border:1px solid #e8f5e9; font-weight:bold;">${ws.eastArea.toFixed(2)}</td><td style="padding:7px 10px; border:1px solid #e8f5e9;">${eastPct}%</td></tr>`;
         detailedReportHTML += `<tr style="background:#c8e6c9; font-weight:bold;"><td style="padding:8px 10px; border:1px solid #a5d6a7;">الإجمالي</td><td style="padding:8px 10px; border:1px solid #a5d6a7;">${ws.totalArea.toFixed(2)}</td><td style="padding:8px 10px; border:1px solid #a5d6a7;">100%</td></tr>`;
         detailedReportHTML += `</table></div>`;
       }
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

function isConvexQuad(a, b, c, d) {
  if (!a || !b || !c || !d) return false;
  const cp1 = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
  const cp2 = (c.x - b.x) * (d.y - c.y) - (c.y - b.y) * (d.x - c.x);
  const cp3 = (d.x - c.x) * (a.y - d.y) - (d.y - c.y) * (a.x - d.x);
  const cp4 = (a.x - d.x) * (b.y - a.y) - (a.y - d.y) * (b.x - a.x);
  return (cp1 > 0 && cp2 > 0 && cp3 > 0 && cp4 > 0) || 
         (cp1 < 0 && cp2 < 0 && cp3 < 0 && cp4 < 0);
}
