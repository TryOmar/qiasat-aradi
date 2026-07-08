// Page 12 - Dallal Professional Surveyor Map Builder script.js

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

// Active Template Tracker
let activeTemplateType = 'rectangle';

// Undo / Redo Stack State
let undoStack = [];
let redoStack = [];
let saveStateTimeout = null;

// Smart Area Tabs
let activeSmartAreaTab = 'sqm';

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

  // Load Saved Project from LocalStorage or Load Default
  if (localStorage.getItem("dallal_map_project")) {
    loadProjectFromLocalStorage();
  } else {
    // First load -> Show Start Screen Modal immediately
    openStartModal();
    // Load default mock/demo setup inside the canvas background just in case they cancel
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
    activeTemplateType: activeTemplateType
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

  selectedElement = null;
  applyViewportTransform();
  renderSVG();

  const editor = document.getElementById("element-editor");
  if (editor) {
    editor.innerHTML = `<p class="empty-editor-hint">اضغط على أي قطعة أرض أو نص أو ضلع لتعديل بياناته هنا.</p>`;
  }
}

// LocalStorage Project Save/Load
function saveProjectToLocalStorage() {
  const project = {
    shapes,
    borderLabels,
    splitLines,
    freeTexts,
    waterways,
    zoomScale,
    panX,
    panY,
    activeTemplateType
  };
  localStorage.setItem("dallal_map_project", JSON.stringify(project));
  alert("💾 تم حفظ مشروع الكروكي بنجاح في ذاكرة الهاتف المحفوظة!");
  toggleFabMenu();
}

function loadProjectFromLocalStorage() {
  try {
    const dataStr = localStorage.getItem("dallal_map_project");
    if (!dataStr) return;
    const project = JSON.parse(dataStr);
    shapes = project.shapes || [];
    borderLabels = project.borderLabels || [];
    splitLines = project.splitLines || [];
    freeTexts = project.freeTexts || [];
    waterways = project.waterways || [];
    zoomScale = project.zoomScale || 1.0;
    panX = project.panX || 0;
    panY = project.panY || 0;
    activeTemplateType = project.activeTemplateType || 'rectangle';

    applyViewportTransform();
    renderSVG();
    saveState();
  } catch (e) {
    console.error("Failed to load project from local storage", e);
  }
}

// ----------------------------------------------------
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
  const feddan = Math.floor(sqm / 4200.833);
  const remSqm = sqm - (feddan * 4200.833);
  const carat = Math.floor(remSqm / 175.0347);
  let shares = Math.round((remSqm - (carat * 175.0347)) / 7.293 * 100) / 100;
  
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
function generateCustomLand() {
  try {
    const w1 = parseFloat(document.getElementById("start-w1").value) || 0;
  const w1Dir = document.getElementById("start-w1-dir").value.trim() || "بحري";
  const w2 = parseFloat(document.getElementById("start-w2").value) || 0;
  const w2Dir = document.getElementById("start-w2-dir").value.trim() || "قبلي";
  const l2 = parseFloat(document.getElementById("start-l2").value) || 0;
  const l2Dir = document.getElementById("start-l2-dir").value.trim() || "شرقي";
  const l1 = parseFloat(document.getElementById("start-l1").value) || 0;
  const l1Dir = document.getElementById("start-l1-dir").value.trim() || "غربي";

  if (w1 <= 0 || w2 <= 0 || l1 <= 0 || l2 <= 0) {
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

  const centerX = 450;
  const centerY = 325;

  // Let's check if the height is greater than width, so we swap them (rotate 90 degrees) to fit landscape A4 perfectly!
  let isRotated = false;
  let effW1 = w1, effW2 = w2, effL1 = l1, effL2 = l2;
  let effW1Dir = w1Dir, effW2Dir = w2Dir, effL1Dir = l1Dir, effL2Dir = l2Dir;

  const avgW = (w1 + w2) / 2;
  const avgL = (l1 + l2) / 2;

  if (avgL > avgW) {
    isRotated = true;
    effW1 = l1;
    effW2 = l2;
    effL1 = w2;
    effL2 = w1;

    effW1Dir = l1Dir; // West (غربي) -> Top
    effW2Dir = l2Dir; // East (شرقي) -> Bottom
    effL1Dir = w2Dir; // South (قبلي) -> Left
    effL2Dir = w1Dir; // North (بحري) -> Right
  }

  // Scale calculations to fit a max boundary of 740 pixels horizontally or 500 pixels vertically
  const maxW = Math.max(effW1, effW2);
  const maxL = Math.max(effL1, effL2);
  const scale = Math.min(740 / maxW, 500 / maxL);

  const drawW1 = effW1 * scale;
  const drawW2 = effW2 * scale;
  const drawL1 = effL1 * scale;
  const drawL2 = effL2 * scale;
  const avgHeight = (drawL1 + drawL2) / 2;

  // Vertices of the main quadrilateral shape
  const p1 = { x: centerX - drawW1 / 2, y: centerY - avgHeight / 2 }; // Top-Left
  const p2 = { x: centerX + drawW1 / 2, y: centerY - avgHeight / 2 }; // Top-Right
  const p3 = { x: centerX + drawW2 / 2, y: centerY + avgHeight / 2 }; // Bottom-Right
  const p4 = { x: centerX - drawW2 / 2, y: centerY + avgHeight / 2 }; // Bottom-Left

  // Smart Area Calculations
  const totalArea = ((w1 + w2) / 2) * ((l1 + l2) / 2);
  const detailedArea = sqmToFeddanCaratShares(totalArea);

  if (activeTemplateType === 'rectangle' || activeTemplateType === 'square' || activeTemplateType === 'trapezoid' || activeTemplateType === 'quadrilateral') {
    // Single parcel shape
    shapes.push({
      id: "shape_1",
      points: [p1, p2, p3, p4],
      owner: "اسم المالك: ................",
      area: { feddan: detailedArea.feddan, carat: detailedArea.carat, shares: detailedArea.shares, sqm: totalArea },
      notes: "كروكي زراعي",
      color: "#f1f8e9",
      textX: centerX,
      textY: centerY
    });

  } else if (activeTemplateType === 'v_split') {
    // Vertical split
    const p_top_mid = { x: (p1.x + p2.x) / 2, y: p1.y };
    const p_bot_mid = { x: (p4.x + p3.x) / 2, y: p4.y };

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
      textY: centerY
    });

    shapes.push({
      id: "shape_2",
      points: [p_top_mid, p2, p3, p_bot_mid],
      owner: isRotated ? "الشريك الثاني (شرقي)" : "الشريك الثاني (قبلي)",
      area: { feddan: halfDetailed.feddan, carat: halfDetailed.carat, shares: halfDetailed.shares, sqm: halfArea },
      notes: isRotated ? "نصيب شرقي" : "نصيب قبلي",
      color: "#e3f2fd",
      textX: (p_top_mid.x + p2.x) / 2,
      textY: centerY
    });

    splitLines.push({
      id: "split_1",
      x1: p_top_mid.x, y1: p_top_mid.y,
      x2: p_bot_mid.x, y2: p_bot_mid.y,
      label: `حد مشترك ${( (effL1 + effL2) / 2 ).toFixed(2)} م`,
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

    splitLines.push({
      id: "split_1",
      x1: p_left_mid.x, y1: p_left_mid.y,
      x2: p_right_mid.x, y2: p_right_mid.y,
      label: `حد فاصل مشترك ${( (effW1 + effW2) / 2 ).toFixed(2)} م`,
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
      owner: "اسم المالك: ................",
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
    // Horizontally split waterway in the middle
    const h_total = p4.y - p1.y;
    const y_mid = (p1.y + p4.y) / 2;
    const water_h = 24; // Waterway height in pixels
    const y_water_top = y_mid - water_h / 2;
    const y_water_bot = y_mid + water_h / 2;

    const x_water_top_left = p1.x + (p4.x - p1.x) * ((y_water_top - p1.y) / h_total);
    const x_water_bot_left = p1.x + (p4.x - p1.x) * ((y_water_bot - p1.y) / h_total);
    const x_water_top_right = p2.x + (p3.x - p2.x) * ((y_water_top - p2.y) / h_total);
    const x_water_bot_right = p2.x + (p3.x - p2.x) * ((y_water_bot - p2.y) / h_total);

    waterways.push({
      id: "water_new",
      points: [
        { x: x_water_top_left, y: y_water_top },
        { x: x_water_top_right, y: y_water_top },
        { x: x_water_bot_right, y: y_water_bot },
        { x: x_water_bot_left, y: y_water_bot }
      ],
      label: "مجرى مائي (ترعة)",
      labelX: centerX,
      labelY: y_mid + 4,
      angle: 0
    });

    const halfArea = (totalArea * 0.9) / 2; // Subtracting ~10% waterway area
    const halfDetailed = sqmToFeddanCaratShares(halfArea);

    shapes.push({
      id: "shape_1", // Top Shape
      points: [p1, p2, { x: x_water_top_right, y: y_water_top }, { x: x_water_top_left, y: y_water_top }],
      owner: isRotated ? "الشريك الأول (غربي)" : "الشريك الأول (بحري)",
      area: { feddan: halfDetailed.feddan, carat: halfDetailed.carat, shares: halfDetailed.shares, sqm: halfArea },
      notes: isRotated ? "القطعة الغربية" : "القطعة البحرية",
      color: "#e8f5e9",
      textX: centerX,
      textY: (p1.y + y_water_top) / 2
    });

    shapes.push({
      id: "shape_2", // Bottom Shape
      points: [{ x: x_water_bot_left, y: y_water_bot }, { x: x_water_bot_right, y: y_water_bot }, p3, p4],
      owner: isRotated ? "الشريك الثاني (شرقي)" : "الشريك الثاني (قبلي)",
      area: { feddan: halfDetailed.feddan, carat: halfDetailed.carat, shares: halfDetailed.shares, sqm: halfArea },
      notes: isRotated ? "القطعة الشرقية" : "القطعة القبلية",
      color: "#fffde7",
      textX: centerX,
      textY: (y_water_bot + p4.y) / 2
    });

    freeTexts.push({ id: "note_inner_tr", text: `${((effL2 * 0.45)).toFixed(1)} م`, x: p2.x - 20, y: (p2.y + y_water_top) / 2, fontSize: 12, isBold: true, angle: 90 });
    freeTexts.push({ id: "note_inner_tl", text: `${((effL1 * 0.45)).toFixed(1)} م`, x: p1.x + 20, y: (p1.y + y_water_top) / 2, fontSize: 12, isBold: true, angle: -90 });
    freeTexts.push({ id: "note_inner_br", text: `${((effL2 * 0.45)).toFixed(1)} م`, x: p3.x - 20, y: (y_water_bot + p3.y) / 2, fontSize: 12, isBold: true, angle: 90 });
    freeTexts.push({ id: "note_inner_bl", text: `${((effL1 * 0.45)).toFixed(1)} م`, x: p4.x + 20, y: (y_water_bot + p4.y) / 2, fontSize: 12, isBold: true, angle: -90 });

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
      color: "#e8f5e9",
      textX: p1.x - 130,
      textY: (p1.y + y_mid_left) / 2 - 10
    });

    shapes.push({
      id: "shape_2", // Bottom-Left
      points: [{ x: x_mid_left_outer, y: y_mid_left }, { x: x_water_left, y: y_mid_left }, { x: x_water_left, y: y_water_bot }, p4],
      owner: "الشريك الثاني (قبلي غربي)",
      area: { feddan: quarterDetailed.feddan, carat: quarterDetailed.carat, shares: quarterDetailed.shares, sqm: quarterArea },
      notes: "القطعة القبلية الغربية",
      color: "#f1f8e9",
      textX: p4.x - 130,
      textY: (y_mid_left + p4.y) / 2 + 20
    });

    const splitLeftVal = (effW1 * 0.45).toFixed(1);
    splitLines.push({
      id: "split_left",
      x1: x_mid_left_outer, y1: y_mid_left,
      x2: x_water_left, y2: y_mid_left,
      label: `حد مشترك ${splitLeftVal} م`,
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
      color: "#e8f5e9",
      textX: p2.x + 130,
      textY: (p2.y + y_mid_right) / 2 - 10
    });

    shapes.push({
      id: "shape_4", // Bottom-Right
      points: [{ x: x_water_right, y: y_mid_right }, { x: x_mid_right_outer, y: y_mid_right }, p3, { x: x_water_right, y: y_water_bot }],
      owner: "الشريك الرابع (قبلي شرقي)",
      area: { feddan: quarterDetailed.feddan, carat: quarterDetailed.carat, shares: quarterDetailed.shares, sqm: quarterArea },
      notes: "القطعة القبلية الشرقية",
      color: "#f1f8e9",
      textX: p3.x + 130,
      textY: (y_mid_right + p3.y) / 2 + 20
    });

    const splitRightVal = (effW2 * 0.45).toFixed(1);
    splitLines.push({
      id: "split_right",
      x1: x_water_right, y1: y_mid_right,
      x2: x_mid_right_outer, y2: y_mid_right,
      label: `حد مشترك ${splitRightVal} م`,
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

  closeStartModal();
  renderSVG();
  saveState();
  } catch (err) {
    alert("حدث خطأ أثناء رسم الأرض: " + err.message);
    console.error(err);
  }
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

  // 1. Draw Waterways
  waterways.forEach(w => {
    const pointsStr = w.points.map(p => `${p.x},${p.y}`).join(" ");
    
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", pointsStr);
    polygon.setAttribute("class", "waterway");
    polygon.setAttribute("vector-effect", "non-scaling-stroke");
    polygon.setAttribute("data-id", w.id);
    polygon.setAttribute("data-type", "waterway");
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
    
    let activeClass = "clickable-shape";
    if (selectedElement && selectedElement.type === 'shape' && selectedElement.id === s.id) {
      activeClass += " active";
    }
    polygon.setAttribute("class", activeClass);
    polygon.setAttribute("fill", s.color || "#ffffff");
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

    // Owner text line
    const tSpanOwner = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tSpanOwner.setAttribute("x", s.textX);
    tSpanOwner.setAttribute("y", s.textY - 14);
    tSpanOwner.setAttribute("fill", "#000000");
    tSpanOwner.setAttribute("font-size", "14");
    tSpanOwner.setAttribute("font-weight", "bold");
    tSpanOwner.setAttribute("text-anchor", "middle");
    tSpanOwner.textContent = s.owner || "";
    textGroup.appendChild(tSpanOwner);

    // Area text line
    const tSpanArea = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tSpanArea.setAttribute("x", s.textX);
    tSpanArea.setAttribute("y", s.textY + 6);
    tSpanArea.setAttribute("fill", "#1b5e20");
    tSpanArea.setAttribute("font-size", "13");
    tSpanArea.setAttribute("font-weight", "bold");
    tSpanArea.setAttribute("text-anchor", "middle");
    
    const fed = s.area.feddan ? `${s.area.feddan} فدان` : "";
    const car = s.area.carat ? `${s.area.carat} قيراط` : "";
    const sh = s.area.shares ? `${s.area.shares} سهم` : "";
    const areaParts = [fed, car, sh].filter(Boolean).join(" و");
    tSpanArea.textContent = areaParts ? `المساحة: ${areaParts}` : "";
    textGroup.appendChild(tSpanArea);

    // Notes line
    if (s.notes) {
      const lines = s.notes.split("\n");
      lines.forEach((lineText, idx) => {
        const tSpanNote = document.createElementNS("http://www.w3.org/2000/svg", "text");
        tSpanNote.setAttribute("x", s.textX);
        tSpanNote.setAttribute("y", s.textY + 24 + (idx * 15));
        tSpanNote.setAttribute("fill", "#555555");
        tSpanNote.setAttribute("font-size", "11.5");
        tSpanNote.setAttribute("text-anchor", "middle");
        tSpanNote.textContent = lineText.trim();
        textGroup.appendChild(tSpanNote);
      });
    }

    shapesGroup.appendChild(textGroup);
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
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", l.labelX);
      text.setAttribute("y", l.labelY);
      text.setAttribute("fill", "#000000");
      text.setAttribute("font-size", "12");
      text.setAttribute("font-weight", "bold");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("class", "draggable-label");
      text.setAttribute("data-id", l.id);
      text.setAttribute("data-type", "splitLineLabel");
      if (l.angle) {
        text.setAttribute("transform", `rotate(${l.angle}, ${l.labelX}, ${l.labelY})`);
      }
      text.textContent = l.label;
      text.onclick = (e) => onElementClick(e, 'splitLine', l.id);
      text.addEventListener("touchstart", (e) => {
        e.stopPropagation();
        onElementClick(e, 'splitLine', l.id);
      });
      splitLinesGroup.appendChild(text);
    }
  });

  // 4. Draw Outer Border Labels
  borderLabels.forEach(b => {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", b.x);
    text.setAttribute("y", b.y);
    text.setAttribute("fill", b.color || "#000000");
    text.setAttribute("font-size", b.fontSize || "13.5");
    text.setAttribute("font-weight", b.isBold !== false ? "bold" : "normal");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("class", "draggable-label");
    text.setAttribute("data-id", b.id);
    text.setAttribute("data-type", "borderLabel");
    if (b.angle) {
      text.setAttribute("transform", `rotate(${b.angle}, ${b.x}, ${b.y})`);
    }
    text.textContent = b.text;
    text.onclick = (e) => onElementClick(e, 'borderLabel', b.id);
    text.addEventListener("touchstart", (e) => {
      e.stopPropagation();
      onElementClick(e, 'borderLabel', b.id);
    });
    borderLabelsGroup.appendChild(text);
  });

  // 5. Draw Free Custom Texts
  freeTexts.forEach(t => {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", t.x);
    text.setAttribute("y", t.y);
    text.setAttribute("fill", t.color || "#000000");
    text.setAttribute("font-size", t.fontSize || "13");
    text.setAttribute("font-weight", t.isBold ? "bold" : "normal");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("class", "draggable-label");
    text.setAttribute("data-id", t.id);
    text.setAttribute("data-type", "freeText");
    if (t.angle) {
      text.setAttribute("transform", `rotate(${t.angle}, ${t.x}, ${t.y})`);
    }
    text.textContent = t.text;
    text.onclick = (e) => onElementClick(e, 'freeText', t.id);
    text.addEventListener("touchstart", (e) => {
      e.stopPropagation();
      onElementClick(e, 'freeText', t.id);
    });
    notesGroup.appendChild(text);
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
    isPanning = true;
    document.querySelector(".canvas-wrapper").classList.add("panning");
    if (e.touches && e.touches.length === 1) {
      startPanPoint = { x: e.touches[0].clientX - panX, y: e.touches[0].clientY - panY };
    } else {
      startPanPoint = { x: e.clientX - panX, y: e.clientY - panY };
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
    const dist = getTouchDistance(e);
    const factor = dist / lastTouchDist;
    if (Math.abs(1 - factor) > 0.01) {
      zoomScale = Math.min(Math.max(0.4, zoomScale * factor), 4.0);
      lastTouchDist = dist;
      applyViewportTransform();
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
  e.preventDefault();
  const factor = e.deltaY > 0 ? 0.9 : 1.1;
  zoomScale = Math.min(Math.max(0.4, zoomScale * factor), 4.0);
  applyViewportTransform();
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

function onElementClick(e, type, id) {
  if (e) e.stopPropagation();
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
      <div class="editor-form-group" style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;">
        <div>
          <label>فدان:</label>
          <input type="text" inputmode="decimal" id="modal-feddan" value="${s.area.feddan || 0}">
        </div>
        <div>
          <label>قيراط:</label>
          <input type="text" inputmode="decimal" id="modal-carat" value="${s.area.carat || 0}">
        </div>
        <div>
          <label>سهم:</label>
          <input type="text" inputmode="decimal" id="modal-shares" value="${s.area.shares || 0}">
        </div>
      </div>
      <div class="editor-form-group">
        <label>ملاحظات القطعة:</label>
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
      s.area.feddan = parseInt(document.getElementById("modal-feddan").value) || 0;
      s.area.carat = parseInt(document.getElementById("modal-carat").value) || 0;
      s.area.shares = parseFloat(document.getElementById("modal-shares").value) || 0;
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
        <div class="editor-form-group" style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:5px;">
          <div>
            <label>فدان:</label>
            <input type="text" inputmode="decimal" value="${s.area.feddan || 0}" oninput="updateSelectedShapeArea('feddan', this.value)">
          </div>
          <div>
            <label>قيراط:</label>
            <input type="text" inputmode="decimal" value="${s.area.carat || 0}" oninput="updateSelectedShapeArea('carat', this.value)">
          </div>
          <div>
            <label>سهم:</label>
            <input type="text" inputmode="decimal" value="${s.area.shares || 0}" oninput="updateSelectedShapeArea('shares', this.value)">
          </div>
        </div>
        <div class="editor-form-group">
          <label>ملاحظات القطعة:</label>
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
  activeTemplateType = type;

  // Pre-populate input fields based on the selected template style
  const w1Input = document.getElementById("start-w1");
  const w2Input = document.getElementById("start-w2");
  const l2Input = document.getElementById("start-l2");
  const l1Input = document.getElementById("start-l1");

  if (type === 'rectangle') {
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
  openStartModal();
}

// ----------------------------------------------------
// Start Modal Trigger Actions
// ----------------------------------------------------
function openStartModal() {
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

  // Dimension values: 30, 28.5, 60, 59.8
  const w1 = 30.00;
  const w2 = 28.50;
  const l1 = 59.80;
  const l2 = 60.00;

  const centerX = 450;
  const centerY = 325;
  const scale = 6.5; // fit factor

  const drawW1 = w1 * scale;
  const drawW2 = w2 * scale;
  const drawL1 = l1 * scale;
  const drawL2 = l2 * scale;
  const avgHeight = (drawL1 + drawL2) / 2;

  const p1 = { x: centerX - drawW1 / 2, y: centerY - avgHeight / 2 };
  const p2 = { x: centerX + drawW1 / 2, y: centerY - avgHeight / 2 };
  const p3 = { x: centerX + drawW2 / 2, y: centerY + avgHeight / 2 };
  const p4 = { x: centerX - drawW2 / 2, y: centerY + avgHeight / 2 };

  const totalArea = 1779.35; // calculation average

  shapes = [{
    id: "shape_1",
    points: [p1, p2, p3, p4],
    owner: "اسم المالك: ورثة أحمد عبد اللطيف",
    area: { feddan: 0, carat: 10, shares: 4, sqm: totalArea },
    notes: "كروكي تقسيم الميراث الزراعي",
    color: "#f1f8e9",
    textX: centerX,
    textY: centerY
  }];

  borderLabels = [
    { id: "border_1", text: "بحري 30.00 م", x: centerX, y: p1.y - 18, fontSize: 13, angle: 0 },
    { id: "border_2", text: "قبلي 28.50 م", x: centerX, y: p4.y + 22, fontSize: 13, angle: 0 },
    { id: "border_3", text: "غربي 59.80 م", x: p1.x - 22, y: centerY, fontSize: 13, angle: -90 },
    { id: "border_4", text: "شرقي 60.00 م", x: p2.x + 22, y: centerY, fontSize: 13, angle: 90 }
  ];

  freeTexts = [
    { id: "demo_1", text: "جار بحري: طريق زراعي ترابي", x: centerX, y: p1.y - 42, fontSize: 13, isBold: true, color: "#1b5e20" },
    { id: "demo_2", text: "جار قبلي: ورثة حسن العشري", x: centerX, y: p4.y + 46, fontSize: 13, isBold: true, color: "#1b5e20" },
    { id: "demo_3", text: "جار شرقي: ملك محمد فوزي", x: p2.x + 55, y: centerY, fontSize: 13, isBold: true, angle: 90, color: "#1b5e20" },
    { id: "demo_4", text: "جار غربي: مصرف ري خاص", x: p1.x - 55, y: centerY, fontSize: 13, isBold: true, angle: -90, color: "#1b5e20" },
    { id: "demo_5", text: "رقم الحوض: 12 (حوض الرز)", x: 340, y: 220, fontSize: 12, isBold: false, color: "#333333" },
    { id: "demo_6", text: "رقم القطعة: 95 مكرر", x: 560, y: 220, fontSize: 12, isBold: false, color: "#333333" }
  ];

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
        
        <!-- Professional Header -->
        <div class="report-header" style="border: 2px solid #1b5e20; border-radius: 10px; padding: 12px; margin: 10px 15px; display: grid; grid-template-columns: 1.2fr 2fr 1.2fr; align-items: center; background: #f1f8e9; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
          <div style="text-align: right;">
            <h1 style="font-size: 18pt; color: #1b5e20; font-weight: 800; margin: 0; font-family: 'Cairo';">الدَّلاَّل</h1>
            <p style="font-size: 9pt; color: #388e3c; margin: 2px 0 0; font-weight: 600; font-family: 'Cairo';">تطبيق قياس وتقسيم الأراضي</p>
          </div>
          <div style="text-align: center;">
            <h2 style="font-size: 12.5pt; color: #1b5e20; font-weight: 700; margin: 0; line-height: 1.4; font-family: 'Cairo';">تقرير رسم كروكي الأراضي الزراعية والمنازل</h2>
          </div>
          <div style="text-align: left; font-size: 8pt; color: #333; line-height: 1.5; font-family: 'Cairo';">
            <div><strong>تاريخ التقرير:</strong> ${dateStr}</div>
            <div><strong>وقت الطباعة:</strong> ${timeStr}</div>
            <div><strong>رقم التقرير:</strong> ${reportId}</div>
          </div>
        </div>

        <!-- Owner Info -->
        <div class="owner-info" style="margin: 5px 15px 15px; font-size: 10pt; border-bottom: 1px dashed #ccc; padding-bottom: 6px; display: flex; gap: 10px; font-family: 'Cairo';">
          <strong>اسم المالك / العميل:</strong>
          <span class="placeholder-line" style="color: #aaa; letter-spacing: 1px;">................................................................................................</span>
        </div>

        <div class="canvas-container" style="flex: 1; width: 100%; max-width: 100%; margin: 5px auto; box-sizing: border-box; display: flex; justify-content: center; align-items: center; padding: 5px;">
          ${svgHTML}
        </div>

        <div class="footer no-print" style="text-align: center; font-size: 11px; color: #777; border-top: 1px dashed #eee; padding-top: 15px; margin: 20px 15px 50px 15px; font-family: 'Cairo';">
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
