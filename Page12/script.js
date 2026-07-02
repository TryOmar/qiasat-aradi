// Page 12 - Dallal Surveyor Map Builder script.js

// Graphics State
let shapes = [];
let borderLabels = [];
let splitLines = [];
let freeTexts = [];
let waterways = [];

let selectedElement = null; // { type: 'shape'|'borderLabel'|'splitLine'|'freeText'|'waterway', id: string }
let activeDrag = null; // { type: 'freeText'|'borderLabel'|'splitLineLabel'|'splitLineEnd'|'shapeText', id: string, index?: number, offset: {x, y} }

// Undo / Redo Stack State
let undoStack = [];
let redoStack = [];
let saveStateTimeout = null;

function saveState() {
  const state = {
    shapes: JSON.parse(JSON.stringify(shapes)),
    borderLabels: JSON.parse(JSON.stringify(borderLabels)),
    splitLines: JSON.parse(JSON.stringify(splitLines)),
    freeTexts: JSON.parse(JSON.stringify(freeTexts)),
    waterways: JSON.parse(JSON.stringify(waterways))
  };

  if (undoStack.length > 0) {
    const prevState = undoStack[undoStack.length - 1];
    if (JSON.stringify(prevState) === JSON.stringify(state)) {
      return;
    }
  }

  undoStack.push(state);
  redoStack = []; // Clear redo stack on new action
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
  if (undoBtn) {
    undoBtn.disabled = (undoStack.length <= 1);
  }
  if (redoBtn) {
    redoBtn.disabled = (redoStack.length === 0);
  }
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

  selectedElement = null;
  renderSVG();

  const editor = document.getElementById("element-editor");
  if (editor) {
    editor.innerHTML = `<p class="empty-editor-hint">اضغط على أي قطعة أرض أو نص أو ضلع لتعديل بياناته هنا.</p>`;
  }
  
  const editorTitle = document.getElementById("editor-title");
  if (editorTitle) {
    editorTitle.textContent = "محرر العنصر المحدد";
  }
}

const colorsList = [
  { name: "أبيض", value: "#ffffff" },
  { name: "أخضر خفيف", value: "#f1f8e9" },
  { name: "أزرق خفيف", value: "#e3f2fd" },
  { name: "أصفر خفيف", value: "#fffde7" },
  { name: "برتقالي خفيف", value: "#fff3e0" },
  { name: "أحمر خفيف", value: "#ffebee" }
];

document.addEventListener("DOMContentLoaded", function () {
  const svg = document.getElementById("dallalSvg");

  // Load default template
  loadTemplate('rectangle');

  // Mouse & Touch events on SVG for dragging
  svg.addEventListener("mousedown", onSvgMouseDown);
  svg.addEventListener("mousemove", onSvgMouseMove);
  svg.addEventListener("mouseup", onSvgMouseUp);
  svg.addEventListener("mouseleave", onSvgMouseUp);
  
  svg.addEventListener("touchstart", onSvgTouchStart, { passive: false });
  svg.addEventListener("touchmove", onSvgTouchMove, { passive: false });
  svg.addEventListener("touchend", onSvgTouchUp, { passive: false });

  // Double click on empty space to add custom free text annotation
  svg.addEventListener("dblclick", onSvgDoubleClick);

  // Close modals when clicking outside
  window.onclick = function (event) {
    const modal = document.getElementById("editModal");
    if (event.target === modal) {
      closeModal();
    }
  };

  // Keyboard support: delete selected element with "Delete" key
  window.addEventListener("keydown", function(e) {
    if (e.key === "Delete" || e.key === "Backspace") {
      // Only delete if not typing in an input
      if (document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
        deleteSelectedElement();
      }
    }
  });
});

// Coordinate conversion helpers
function getSvgCoords(e) {
  const svg = document.getElementById("dallalSvg");
  const point = svg.createSVGPoint();
  // Handle touch or mouse client coordinates
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

// ----------------------------------------------------
// Templates Loader
// ----------------------------------------------------
function loadTemplate(type) {
  // Clear existing state
  shapes = [];
  borderLabels = [];
  splitLines = [];
  freeTexts = [];
  waterways = [];
  selectedElement = null;

  if (type === 'rectangle') {
    // Single rectangle parcel
    shapes.push({
      id: "shape_1",
      points: [{x: 200, y: 150}, {x: 700, y: 150}, {x: 700, y: 500}, {x: 200, y: 500}],
      owner: "محمد علي",
      area: { feddan: 2, carat: 12, shares: 14.5 },
      notes: "قطعة أرض زراعية مستطيلة الشكل",
      color: "#f1f8e9",
      textX: 450,
      textY: 325
    });

    // Outer border labels
    borderLabels.push({ id: "border_1", text: "الجنب الشرقي 436.95 م", x: 450, y: 110, angle: 0 });
    borderLabels.push({ id: "border_2", text: "الجنب الغربي 436.95 م", x: 450, y: 540, angle: 0 });
    borderLabels.push({ id: "border_3", text: "الجنب البحري 17.55 م الكل", x: 130, y: 325, angle: -90 });
    borderLabels.push({ id: "border_4", text: "الجنب القبلي 18.97 م الكل", x: 770, y: 325, angle: 90 });

  } else if (type === 'square') {
    shapes.push({
      id: "shape_1",
      points: [{x: 250, y: 150}, {x: 600, y: 150}, {x: 600, y: 500}, {x: 250, y: 500}],
      owner: "علي محمد",
      area: { feddan: 1, carat: 10, shares: 8 },
      notes: "قطعة أرض مربعة الشكل",
      color: "#e3f2fd",
      textX: 425,
      textY: 325
    });

    borderLabels.push({ id: "border_1", text: "الجنب الشرقي 100 م", x: 425, y: 110, angle: 0 });
    borderLabels.push({ id: "border_2", text: "الجنب الغربي 100 م", x: 425, y: 540, angle: 0 });
    borderLabels.push({ id: "border_3", text: "الجنب البحري 100 م الكل", x: 180, y: 325, angle: -90 });
    borderLabels.push({ id: "border_4", text: "الجنب القبلي 100 م الكل", x: 670, y: 325, angle: 90 });

  } else if (type === 'trapezoid') {
    shapes.push({
      id: "shape_1",
      points: [{x: 250, y: 150}, {x: 650, y: 150}, {x: 750, y: 500}, {x: 150, y: 500}],
      owner: "محمد أحمد",
      area: { feddan: 1, carat: 18, shares: 8 },
      notes: "شبه منحرف عادي",
      color: "#fffde7",
      textX: 450,
      textY: 325
    });

    borderLabels.push({ id: "border_1", text: "الجنب الشرقي 300 م", x: 450, y: 110, angle: 0 });
    borderLabels.push({ id: "border_2", text: "الجنب الغربي 500 م", x: 450, y: 540, angle: 0 });
    borderLabels.push({ id: "border_3", text: "الضلع المائل البحري 17.55 م", x: 140, y: 325, angle: -74 });
    borderLabels.push({ id: "border_4", text: "الضلع المائل القبلي 18.97 م", x: 760, y: 325, angle: 74 });

  } else if (type === 'quadrilateral') {
    shapes.push({
      id: "shape_1",
      points: [{x: 220, y: 170}, {x: 680, y: 140}, {x: 720, y: 520}, {x: 180, y: 480}],
      owner: "محمد",
      area: { feddan: 3, carat: 0, shares: 0 },
      notes: "رباعي غير منتظم الحدود",
      color: "#fff3e0",
      textX: 450,
      textY: 320
    });

    borderLabels.push({ id: "border_1", text: "الحد الشرقي 460 م", x: 450, y: 110, angle: -4 });
    borderLabels.push({ id: "border_2", text: "الحد الغربي 540 م", x: 450, y: 550, angle: 4 });
    borderLabels.push({ id: "border_3", text: "الحد البحري 18.00 م", x: 130, y: 325, angle: -80 });
    borderLabels.push({ id: "border_4", text: "الحد القبلي 19.50 م", x: 770, y: 325, angle: 80 });

  } else if (type === 'mixed_waterway_new') {
    // Horizontal waterway splitting the land into north and south parcels
    waterways.push({
      id: "water_new",
      points: [{x: 200, y: 280}, {x: 700, y: 280}, {x: 700, y: 340}, {x: 200, y: 340}],
      label: "مجرى مائي أفقي (ترعة)",
      labelX: 450,
      labelY: 315,
      angle: 0
    });

    shapes.push({
      id: "shape_1", // Top Shape
      points: [{x: 200, y: 120}, {x: 700, y: 120}, {x: 700, y: 280}, {x: 200, y: 280}],
      owner: "علي محمد",
      area: { feddan: 1, carat: 5, shares: 0 },
      notes: "القطعة البحرية",
      color: "#e8f5e9",
      textX: 450,
      textY: 200
    });

    shapes.push({
      id: "shape_2", // Bottom Shape
      points: [{x: 200, y: 340}, {x: 700, y: 340}, {x: 700, y: 500}, {x: 200, y: 500}],
      owner: "محمد أحمد",
      area: { feddan: 1, carat: 8, shares: 10 },
      notes: "القطعة القبلية",
      color: "#fffde7",
      textX: 450,
      textY: 420
    });

    // Outer Borders
    borderLabels.push({ id: "border_1", text: "الحد الشرقي 200 م", x: 720, y: 310, angle: 90 });
    borderLabels.push({ id: "border_2", text: "الحد الغربي 200 م", x: 180, y: 310, angle: -90 });
    borderLabels.push({ id: "border_3", text: "الحد البحري 150 م", x: 450, y: 100, angle: 0 });
    borderLabels.push({ id: "border_4", text: "الحد القبلي 150 م", x: 450, y: 520, angle: 0 });
    
    // Inner Measurements
    freeTexts.push({ id: "note_1", text: "عرض المجرى: 5 م", x: 450, y: 335, fontSize: 11, angle: 0 });
    freeTexts.push({ id: "note_inner_tr", text: "80 م", x: 685, y: 200, fontSize: 13, isBold: true, angle: 90 });
    freeTexts.push({ id: "note_inner_tl", text: "80 م", x: 215, y: 200, fontSize: 13, isBold: true, angle: -90 });
    freeTexts.push({ id: "note_inner_br", text: "115 م", x: 685, y: 420, fontSize: 13, isBold: true, angle: 90 });
    freeTexts.push({ id: "note_inner_bl", text: "115 م", x: 215, y: 420, fontSize: 13, isBold: true, angle: -90 });
  } else if (type === 'mixed_split_image') {
    // Top Titles
    freeTexts.push({ id: "note_top", text: "الجنب الشرقي", x: 450, y: 35, fontSize: 18, isBold: true, color: "#000" });
    freeTexts.push({ id: "note_top_val", text: "436.95 سم الكل", x: 450, y: 55, fontSize: 14, isBold: true, color: "#000" });

    freeTexts.push({ id: "note_tl_1", text: "الطول الجنب البحري 227.50 سم", x: 260, y: 80, fontSize: 13, isBold: true, color: "#000" });
    freeTexts.push({ id: "note_tl_2", text: "24.4 قيراط مساحة الجنب البحري", x: 260, y: 100, fontSize: 11, isBold: false, color: "#000" });

    freeTexts.push({ id: "note_tr_1", text: "الطول الجنب القبلي 209.45 سم", x: 640, y: 80, fontSize: 13, isBold: true, color: "#000" });
    freeTexts.push({ id: "note_tr_2", text: "23.3 قيراط وثلثين سهم مساحة الجنب القبلي", x: 640, y: 100, fontSize: 11, isBold: false, color: "#000" });

    // Waterway
    waterways.push({
      id: "water_1",
      points: [{x: 420, y: 120}, {x: 480, y: 120}, {x: 480, y: 510}, {x: 420, y: 510}],
      label: "مجرى مائي",
      labelX: 450,
      labelY: 315,
      angle: 90
    });
    freeTexts.push({ id: "note_w_l", text: "18.15 سم الكل", x: 432, y: 315, fontSize: 12, isBold: true, angle: 90 });
    freeTexts.push({ id: "note_w_r", text: "18.17 سم الكل", x: 468, y: 315, fontSize: 12, isBold: true, angle: 90 });

    // Outer Sides
    freeTexts.push({ id: "note_l_1", text: "الجنب البحري", x: 50, y: 315, fontSize: 16, isBold: true, angle: -90 });
    freeTexts.push({ id: "note_l_2", text: "17.55 سم الكل", x: 75, y: 315, fontSize: 15, isBold: true, angle: -90 });
    freeTexts.push({ id: "note_r_1", text: "الجنب القبلي", x: 850, y: 315, fontSize: 16, isBold: true, angle: 90 });
    freeTexts.push({ id: "note_r_2", text: "18.97 سم الكل", x: 825, y: 315, fontSize: 15, isBold: true, angle: 90 });

    // Shapes
    shapes.push({
      id: "shape_1",
      points: [{x: 120, y: 120}, {x: 420, y: 120}, {x: 420, y: 300}, {x: 120, y: 300}],
      owner: "", area: { feddan: 0, carat: 0, shares: 0 }, notes: "", color: "#ffffff", textX: 270, textY: 200
    });
    shapes.push({
      id: "shape_2",
      points: [{x: 120, y: 300}, {x: 420, y: 300}, {x: 420, y: 510}, {x: 120, y: 510}],
      owner: "", area: { feddan: 0, carat: 0, shares: 0 }, notes: "", color: "#ffffff", textX: 270, textY: 405
    });
    shapes.push({
      id: "shape_3",
      points: [{x: 480, y: 120}, {x: 780, y: 120}, {x: 780, y: 310}, {x: 480, y: 310}],
      owner: "", area: { feddan: 0, carat: 0, shares: 0 }, notes: "", color: "#ffffff", textX: 630, textY: 215
    });
    shapes.push({
      id: "shape_4",
      points: [{x: 480, y: 310}, {x: 780, y: 310}, {x: 780, y: 510}, {x: 480, y: 510}],
      owner: "", area: { feddan: 0, carat: 0, shares: 0 }, notes: "", color: "#ffffff", textX: 630, textY: 410
    });

    // Split Lines
    splitLines.push({ id: "split_1", x1: 120, y1: 300, x2: 420, y2: 300, label: "", labelX: 270, labelY: 300, angle: 0 });
    splitLines.push({ id: "split_2", x1: 480, y1: 310, x2: 780, y2: 310, label: "1.20 سم     1.12 المباعة من محمد      ", labelX: 630, labelY: 305, angle: 0 });

    // Inner texts Top-Left
    freeTexts.push({ id: "tl_t1", text: "الفرق 1 قيراط", x: 340, y: 150, fontSize: 16, isBold: true, color: "#b71c1c" });
    freeTexts.push({ id: "tl_t2", text: "20.18", x: 390, y: 150, fontSize: 16, isBold: true, color: "#000" });
    freeTexts.push({ id: "tl_t3", text: "المباع", x: 445, y: 150, fontSize: 16, isBold: true, color: "#000" });
    freeTexts.push({ id: "tl_t4", text: "10.6 قيراط مباعة من علي", x: 270, y: 220, fontSize: 13, isBold: false });
    freeTexts.push({ id: "tl_l1", text: "7.35", x: 140, y: 190, fontSize: 15, isBold: true, angle: -90 });
    freeTexts.push({ id: "tl_l2", text: "سم", x: 140, y: 230, fontSize: 15, isBold: true, angle: -90 });
    freeTexts.push({ id: "tl_r1", text: "7.80", x: 400, y: 190, fontSize: 15, isBold: true, angle: 90 });
    freeTexts.push({ id: "tl_r2", text: "سم", x: 400, y: 230, fontSize: 15, isBold: true, angle: 90 });

    // Inner texts Bottom-Left
    freeTexts.push({ id: "bl_t1", text: "13.22 قيراط الباقي لـ محمد بحري", x: 270, y: 400, fontSize: 13, isBold: false });
    freeTexts.push({ id: "bl_b1", text: "25.21 قيراط تم بيع 1.12 و الباقي", x: 270, y: 490, fontSize: 14, isBold: true });
    freeTexts.push({ id: "bl_l1", text: "10.20", x: 140, y: 400, fontSize: 15, isBold: true, angle: -90 });
    freeTexts.push({ id: "bl_l2", text: "سم", x: 140, y: 440, fontSize: 15, isBold: true, angle: -90 });
    freeTexts.push({ id: "bl_r1", text: "10.35", x: 400, y: 400, fontSize: 15, isBold: true, angle: 90 });
    freeTexts.push({ id: "bl_r2", text: "سم", x: 400, y: 440, fontSize: 15, isBold: true, angle: 90 });

    // Inner texts Top-Right
    freeTexts.push({ id: "tr_t1", text: "نصيب علي 19.18", x: 630, y: 150, fontSize: 16, isBold: true });
    freeTexts.push({ id: "tr_t2", text: "10.12 قيراط المباعة من علي", x: 630, y: 190, fontSize: 13, isBold: false });
    freeTexts.push({ id: "tr_t3", text: "12 قيراط", x: 630, y: 240, fontSize: 16, isBold: true });
    freeTexts.push({ id: "tr_l1", text: "9.62", x: 500, y: 215, fontSize: 15, isBold: true, angle: -90 });
    freeTexts.push({ id: "tr_l2", text: "سم", x: 500, y: 255, fontSize: 15, isBold: true, angle: -90 });
    freeTexts.push({ id: "tr_r1", text: "9.62", x: 760, y: 215, fontSize: 15, isBold: true, angle: 90 });
    freeTexts.push({ id: "tr_r2", text: "سم", x: 760, y: 255, fontSize: 15, isBold: true, angle: 90 });

    // Inner texts Bottom-Right
    freeTexts.push({ id: "br_t1", text: "11.3 قيراط الباقي لـ محمد قبلي", x: 630, y: 410, fontSize: 13, isBold: false });
    freeTexts.push({ id: "br_b1", text: "نصيب محمد 27.9", x: 630, y: 490, fontSize: 16, isBold: true });
    freeTexts.push({ id: "br_l1", text: "8.55", x: 500, y: 410, fontSize: 15, isBold: true, angle: -90 });
    freeTexts.push({ id: "br_l2", text: "سم", x: 500, y: 450, fontSize: 15, isBold: true, angle: -90 });
    freeTexts.push({ id: "br_r1", text: "9.35", x: 760, y: 410, fontSize: 15, isBold: true, angle: 90 });
    freeTexts.push({ id: "br_r2", text: "سم", x: 760, y: 450, fontSize: 15, isBold: true, angle: 90 });

    // Footer Texts
    freeTexts.push({ id: "note_f1", text: "الإجمالي لـ محمد 27.9 قيراط", x: 450, y: 550, fontSize: 16, isBold: true });
    freeTexts.push({ id: "note_f2", text: "توقيع المشتري", x: 260, y: 550, fontSize: 16, isBold: true });
    freeTexts.push({ id: "note_f3", text: "توقيع البائع", x: 640, y: 550, fontSize: 16, isBold: true });
    freeTexts.push({ id: "note_fb", text: "الجنب الغربي", x: 450, y: 610, fontSize: 18, isBold: true });
  } else if (type === 'v_split') {
    // Two vertical halves
    shapes.push({
      id: "shape_1",
      points: [{x: 200, y: 150}, {x: 450, y: 150}, {x: 450, y: 500}, {x: 200, y: 500}],
      owner: "محمد (بحري)",
      area: { feddan: 1, carat: 6, shares: 7 },
      notes: "نصيب بحري",
      color: "#f1f8e9",
      textX: 325,
      textY: 325
    });

    shapes.push({
      id: "shape_2",
      points: [{x: 450, y: 150}, {x: 700, y: 150}, {x: 700, y: 500}, {x: 450, y: 500}],
      owner: "علي (قبلي)",
      area: { feddan: 1, carat: 6, shares: 7 },
      notes: "نصيب قبلي",
      color: "#e3f2fd",
      textX: 575,
      textY: 325
    });

    splitLines.push({
      id: "split_1",
      x1: 450, y1: 150, x2: 450, y2: 500,
      label: "فاصل مشترك 18.15 م",
      labelX: 430, labelY: 325, angle: 90
    });

    borderLabels.push({ id: "border_1", text: "الجنب الشرقي 436.95 م", x: 450, y: 110, angle: 0 });
    borderLabels.push({ id: "border_2", text: "الجنب الغربي 436.95 م", x: 450, y: 540, angle: 0 });
    borderLabels.push({ id: "border_3", text: "الجنب البحري 17.55 م", x: 130, y: 325, angle: -90 });
    borderLabels.push({ id: "border_4", text: "الجنب القبلي 18.97 م", x: 770, y: 325, angle: 90 });

  } else if (type === 'h_split') {
    // Two horizontal halves
    shapes.push({
      id: "shape_1",
      points: [{x: 200, y: 150}, {x: 700, y: 150}, {x: 700, y: 325}, {x: 200, y: 325}],
      owner: "محمد (شرقي)",
      area: { feddan: 1, carat: 6, shares: 7 },
      notes: "نصيب شرقي",
      color: "#f1f8e9",
      textX: 450,
      textY: 230
    });

    shapes.push({
      id: "shape_2",
      points: [{x: 200, y: 325}, {x: 700, y: 325}, {x: 700, y: 500}, {x: 200, y: 500}],
      owner: "علي (غربي)",
      area: { feddan: 1, carat: 6, shares: 7 },
      notes: "نصيب غربي",
      color: "#fffde7",
      textX: 450,
      textY: 410
    });

    splitLines.push({
      id: "split_1",
      x1: 200, y1: 325, x2: 700, y2: 325,
      label: "حد فاصل 436.95 م",
      labelX: 450, labelY: 305, angle: 0
    });

    borderLabels.push({ id: "border_1", text: "الجنب الشرقي 436.95 م", x: 450, y: 110, angle: 0 });
    borderLabels.push({ id: "border_2", text: "الجنب الغربي 436.95 م", x: 450, y: 540, angle: 0 });
    borderLabels.push({ id: "border_3", text: "الجنب البحري 17.55 م", x: 130, y: 325, angle: -90 });
    borderLabels.push({ id: "border_4", text: "الجنب القبلي 18.97 م", x: 770, y: 325, angle: 90 });

  } else if (type === 'quad_diagonal') {
    shapes.push({
      id: "shape_1",
      points: [{x: 300, y: 150}, {x: 650, y: 200}, {x: 750, y: 500}, {x: 150, y: 480}],
      owner: "علي محمد",
      area: { feddan: 2, carat: 12, shares: 0 },
      notes: "رباعي غير منتظم بالقطر",
      color: "#f1f8e9",
      textX: 450,
      textY: 410
    });

    // Diagonals using splitLines
    splitLines.push({
      id: "split_diag_1",
      x1: 300, y1: 150, x2: 750, y2: 500,
      label: "القطر الأول (AC) 60 م",
      labelX: 540, labelY: 310, angle: 37,
      isDashed: true, color: "#0288d1"
    });
    
    splitLines.push({
      id: "split_diag_2",
      x1: 150, y1: 480, x2: 650, y2: 200,
      label: "القطر الثاني (BD) 55 م",
      labelX: 370, labelY: 330, angle: -29,
      isDashed: true, color: "#0288d1"
    });

    borderLabels.push({ id: "border_1", text: "الضلع الأيمن (D) 35 م", x: 720, y: 350, angle: 71 });
    borderLabels.push({ id: "border_2", text: "الضلع الأيسر (B) 40 م", x: 200, y: 310, angle: -65 });
    borderLabels.push({ id: "border_3", text: "الضلع العلوي (C) 45 م", x: 475, y: 155, angle: 5 });
    borderLabels.push({ id: "border_4", text: "الضلع السفلي (A) 50 م", x: 450, y: 510, angle: -2 });

    freeTexts.push({
      id: "note_diag_info",
      text: "* يجب إدخال أحد القطرين (AC) أو (BD) لإجراء الحساب والتقسيم الدقيق.",
      x: 450, y: 560, fontSize: 13, isBold: true, color: "#b71c1c", angle: 0
    });
  }

  renderSVG();
  saveState();
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
    
    // Waterway shape
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", pointsStr);
    polygon.setAttribute("class", "waterway");
    polygon.setAttribute("data-id", w.id);
    polygon.setAttribute("data-type", "waterway");
    polygon.onclick = (e) => onElementClick(e, 'waterway', w.id);
    waterwaysGroup.appendChild(polygon);

    // Waterway Label
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
    
    // Land parcel polygon
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", pointsStr);
    
    let activeClass = "clickable-shape";
    if (selectedElement && selectedElement.type === 'shape' && selectedElement.id === s.id) {
      activeClass += " active";
    }
    polygon.setAttribute("class", activeClass);
    polygon.setAttribute("fill", s.color || "#ffffff");
    polygon.onclick = (e) => onElementClick(e, 'shape', s.id);
    shapesGroup.appendChild(polygon);

    // Parcel inner Text (Owner and Area info)
    const textGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    textGroup.setAttribute("class", "draggable-label");
    textGroup.setAttribute("data-id", s.id);
    textGroup.setAttribute("data-type", "shapeText");
    textGroup.onclick = (e) => onElementClick(e, 'shape', s.id);

    // Owner text line
    const tSpanOwner = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tSpanOwner.setAttribute("x", s.textX);
    tSpanOwner.setAttribute("y", s.textY - 10);
    tSpanOwner.setAttribute("fill", "#004d40");
    tSpanOwner.setAttribute("font-size", "12.5");
    tSpanOwner.setAttribute("font-weight", "bold");
    tSpanOwner.setAttribute("text-anchor", "middle");
    tSpanOwner.textContent = s.owner || "";
    textGroup.appendChild(tSpanOwner);

    // Area text line
    const tSpanArea = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tSpanArea.setAttribute("x", s.textX);
    tSpanArea.setAttribute("y", s.textY + 8);
    tSpanArea.setAttribute("fill", "#b71c1c");
    tSpanArea.setAttribute("font-size", "12");
    tSpanArea.setAttribute("font-weight", "bold");
    tSpanArea.setAttribute("text-anchor", "middle");
    
    const fed = s.area.feddan ? `${s.area.feddan} فدان` : "";
    const car = s.area.carat ? `${s.area.carat} قيراط` : "";
    const sh = s.area.shares ? `${s.area.shares} سهم` : "";
    const areaParts = [fed, car, sh].filter(Boolean).join(" و");
    tSpanArea.textContent = areaParts ? `${areaParts}` : "";
    textGroup.appendChild(tSpanArea);

    // Notes line (if any)
    if (s.notes) {
      const lines = s.notes.split("\n");
      lines.forEach((lineText, idx) => {
        const tSpanNote = document.createElementNS("http://www.w3.org/2000/svg", "text");
        tSpanNote.setAttribute("x", s.textX);
        tSpanNote.setAttribute("y", s.textY + 24 + idx * 13);
        tSpanNote.setAttribute("fill", "#555");
        tSpanNote.setAttribute("font-size", "10.5");
        tSpanNote.setAttribute("text-anchor", "middle");
        tSpanNote.textContent = lineText.trim();
        textGroup.appendChild(tSpanNote);
      });
    }

    shapesGroup.appendChild(textGroup);
  });

  // 3. Draw Split Lines
  splitLines.forEach(l => {
    // Line path
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", l.x1);
    line.setAttribute("y1", l.y1);
    line.setAttribute("x2", l.x2);
    line.setAttribute("y2", l.y2);
    line.setAttribute("class", "split-line");
    line.setAttribute("data-id", l.id);
    if (l.isDashed) {
      line.setAttribute("stroke-dasharray", "5, 5");
    }
    if (l.color) {
      line.setAttribute("stroke", l.color);
    }
    line.onclick = (e) => onElementClick(e, 'splitLine', l.id);
    splitLinesGroup.appendChild(line);

    // Helper handles at endpoints (only shown when selected)
    if (selectedElement && selectedElement.type === 'splitLine' && selectedElement.id === l.id) {
      const handle1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      handle1.setAttribute("cx", l.x1);
      handle1.setAttribute("cy", l.y1);
      handle1.setAttribute("r", 6);
      handle1.setAttribute("fill", "#c62828");
      handle1.setAttribute("class", "draggable-label");
      handle1.setAttribute("data-type", "splitLineEnd");
      handle1.setAttribute("data-id", l.id);
      handle1.setAttribute("data-index", "1");
      splitLinesGroup.appendChild(handle1);

      const handle2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      handle2.setAttribute("cx", l.x2);
      handle2.setAttribute("cy", l.y2);
      handle2.setAttribute("r", 6);
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
      text.setAttribute("fill", "#1b5e20");
      text.setAttribute("font-size", "11.5");
      text.setAttribute("font-weight", "800");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("class", "draggable-label");
      text.setAttribute("data-id", l.id);
      text.setAttribute("data-type", "splitLineLabel");
      if (l.angle) {
        text.setAttribute("transform", `rotate(${l.angle}, ${l.labelX}, ${l.labelY})`);
      }
      text.textContent = l.label;
      text.onclick = (e) => onElementClick(e, 'splitLine', l.id);
      splitLinesGroup.appendChild(text);
    }
  });

  // 4. Draw Outer Border Labels
  borderLabels.forEach(b => {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", b.x);
    text.setAttribute("y", b.y);
    text.setAttribute("fill", "#1b5e20");
    text.setAttribute("font-size", b.fontSize || "13.5");
    text.setAttribute("font-weight", "bold");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("class", "draggable-label");
    text.setAttribute("data-id", b.id);
    text.setAttribute("data-type", "borderLabel");
    if (b.angle) {
      text.setAttribute("transform", `rotate(${b.angle}, ${b.x}, ${b.y})`);
    }
    text.textContent = b.text;
    text.onclick = (e) => onElementClick(e, 'borderLabel', b.id);
    borderLabelsGroup.appendChild(text);
  });

  // 5. Draw Free Custom Texts / Annotations
  freeTexts.forEach(t => {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", t.x);
    text.setAttribute("y", t.y);
    text.setAttribute("fill", t.color || "#000000");
    text.setAttribute("font-size", t.fontSize || "12");
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
    notesGroup.appendChild(text);
  });
}

// ----------------------------------------------------
// Mouse / Touch Event Handlers for Drag & Drop
// ----------------------------------------------------
function onSvgMouseDown(e) {
  const target = e.target;
  const parent = target.parentElement;
  
  // Verify if it is draggable
  let draggableEl = null;
  if (target.classList.contains("draggable-label")) draggableEl = target;
  else if (parent && parent.classList.contains("draggable-label")) draggableEl = parent;

  if (!draggableEl) return;

  const type = draggableEl.getAttribute("data-type");
  const id = draggableEl.getAttribute("data-id");
  const index = draggableEl.getAttribute("data-index"); // for splitLineEnd handles

  const coords = getSvgCoords(e);
  let offset = { x: 0, y: 0 };

  // Calculate drag offset based on element type
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
}

function onSvgMouseMove(e) {
  if (!activeDrag) return;

  const coords = getSvgCoords(e);
  const newX = coords.x - activeDrag.offset.x;
  const newY = coords.y - activeDrag.offset.y;

  // Round positions slightly for neatness
  const finalX = Math.round(newX);
  const finalY = Math.round(newY);

  if (activeDrag.type === 'freeText') {
    const t = freeTexts.find(x => x.id === activeDrag.id);
    if (t) { t.x = finalX; t.y = finalY; }
  } else if (activeDrag.type === 'borderLabel') {
    const b = borderLabels.find(x => x.id === activeDrag.id);
    if (b) { b.x = finalX; b.y = finalY; }
  } else if (activeDrag.type === 'shapeText') {
    const s = shapes.find(x => x.id === activeDrag.id);
    if (s) { s.textX = finalX; s.textY = finalY; }
  } else if (activeDrag.type === 'splitLineLabel') {
    const l = splitLines.find(x => x.id === activeDrag.id);
    if (l) { l.labelX = finalX; l.labelY = finalY; }
  } else if (activeDrag.type === 'waterwayLabel') {
    const w = waterways.find(x => x.id === activeDrag.id);
    if (w) { w.labelX = finalX; w.labelY = finalY; }
  } else if (activeDrag.type === 'splitLineEnd') {
    const l = splitLines.find(x => x.id === activeDrag.id);
    if (l) {
      if (activeDrag.index === 1) {
        l.x1 = finalX;
        l.y1 = finalY;
      } else {
        l.x2 = finalX;
        l.y2 = finalY;
      }
    }
  }

  renderSVG();
}

function onSvgMouseUp() {
  if (activeDrag) {
    activeDrag = null;
    saveState();
  }
}

// Touch event wrappers
function onSvgTouchStart(e) {
  if (e.touches.length === 1) {
    onSvgMouseDown(e);
  }
}

function onSvgTouchMove(e) {
  if (e.touches.length === 1 && activeDrag) {
    e.preventDefault();
    onSvgMouseMove(e);
  }
}

function onSvgTouchUp() {
  onSvgMouseUp();
}

let modalEditTarget = null; // { type, id }

// Double click to edit existing elements or add custom free text notes
function onSvgDoubleClick(e) {
  const target = e.target;
  const parent = target.parentElement;
  
  let matchEl = null;
  let type = null;
  let id = null;

  // Detect if clicked on shapes, borders, or lines
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
    // Open modal to edit existing element
    openModalForElement(type, id);
  } else {
    // Add new free text note at empty space
    const coords = getSvgCoords(e);
    promptAddFreeText(coords.x, coords.y);
  }
}

function openModalForElement(type, id) {
  selectedElement = { type, id };
  renderSVG();
  populateSidebarEditor();

  const modal = document.getElementById("editModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalForm = document.getElementById("modalForm");

  modalEditTarget = { type, id };

  // Normalize shapeText drag type to shape
  const targetType = type === 'shapeText' ? 'shape' : type;
  const targetId = id;

  if (targetType === 'shape') {
    const s = shapes.find(x => x.id === targetId);
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
          <input type="number" id="modal-feddan" value="${s.area.feddan || 0}">
        </div>
        <div>
          <label>قيراط:</label>
          <input type="number" id="modal-carat" value="${s.area.carat || 0}">
        </div>
        <div>
          <label>سهم:</label>
          <input type="number" step="any" id="modal-shares" value="${s.area.shares || 0}">
        </div>
      </div>
      <div class="editor-form-group">
        <label>ملاحظات القطعة:</label>
        <textarea id="modal-notes" rows="3" style="width:100%; box-sizing:border-box; font-family:'Cairo'; font-size:12px;">${s.notes || ''}</textarea>
      </div>
    `;
  } else if (targetType === 'borderLabel') {
    const b = borderLabels.find(x => x.id === targetId);
    if (!b) return;
    modalTitle.textContent = "تعديل نص الحد / البعد";
    modalForm.innerHTML = `
      <div class="editor-form-group">
        <label>نص الحد الخارجي والأبعاد:</label>
        <input type="text" id="modal-border-text" value="${b.text || ''}" style="width:100%; box-sizing:border-box;">
      </div>
      <div class="editor-form-group">
        <label>زاوية الدوران (بالدرجات):</label>
        <input type="number" id="modal-border-angle" value="${b.angle || 0}" style="width:100%; box-sizing:border-box;">
      </div>
    `;
  } else if (targetType === 'splitLine' || targetType === 'splitLineLabel') {
    const l = splitLines.find(x => x.id === targetId);
    if (!l) return;
    modalTitle.textContent = "تعديل طول خط التقسيم";
    modalForm.innerHTML = `
      <div class="editor-form-group">
        <label>طول الخط / المسمى:</label>
        <input type="text" id="modal-split-label" value="${l.label || ''}" style="width:100%; box-sizing:border-box;">
      </div>
      <div class="editor-form-group">
        <label>زاوية دوران النص:</label>
        <input type="number" id="modal-split-angle" value="${l.angle || 0}" style="width:100%; box-sizing:border-box;">
      </div>
    `;
  } else if (targetType === 'freeText') {
    const t = freeTexts.find(x => x.id === targetId);
    if (!t) return;
    modalTitle.textContent = "تعديل النص الحر / الملاحظة";
    modalForm.innerHTML = `
      <div class="editor-form-group">
        <label>النص المكتوب:</label>
        <input type="text" id="modal-free-text" value="${t.text || ''}" style="width:100%; box-sizing:border-box;">
      </div>
      <div class="editor-form-group">
        <label>حجم الخط (بكسل):</label>
        <input type="number" id="modal-free-size" value="${t.fontSize || 12}" style="width:100%; box-sizing:border-box;">
      </div>
      <div class="editor-form-group">
        <label>زاوية الدوران:</label>
        <input type="number" id="modal-free-angle" value="${t.angle || 0}" style="width:100%; box-sizing:border-box;">
      </div>
    `;
  }

  modal.style.display = "flex";
  
  // Autofocus the first input
  setTimeout(() => {
    const firstInput = modalForm.querySelector("input, textarea");
    if (firstInput) firstInput.focus();
  }, 100);
}

// ----------------------------------------------------
// UI Element Interaction
// ----------------------------------------------------
function onElementClick(e, type, id) {
  e.stopPropagation();
  selectedElement = { type, id };
  
  // Highlight shape border
  renderSVG();

  // Populate sidebar editor panel
  populateSidebarEditor();
  
  // Also open the modal for quick editing, as requested
  openModalForElement(type, id);
}

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
      // Options of colors
      const colorOptions = colorsList.map(c => 
        `<option value="${c.value}" ${s.color === c.value ? 'selected' : ''}>${c.name}</option>`
      ).join("");

      html = `
        <div class="editor-form-group">
          <label>اسم المالك:</label>
          <input type="text" value="${s.owner || ''}" oninput="updateSelectedShapeField('owner', this.value)">
        </div>
        <div class="editor-form-group" style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:5px;">
          <div>
            <label>فدان:</label>
            <input type="number" value="${s.area.feddan || 0}" oninput="updateSelectedShapeArea('feddan', this.value)">
          </div>
          <div>
            <label>قيراط:</label>
            <input type="number" value="${s.area.carat || 0}" oninput="updateSelectedShapeArea('carat', this.value)">
          </div>
          <div>
            <label>سهم:</label>
            <input type="number" step="any" value="${s.area.shares || 0}" oninput="updateSelectedShapeArea('shares', this.value)">
          </div>
        </div>
        <div class="editor-form-group">
          <label>ملاحظات القطعة:</label>
          <textarea rows="3" oninput="updateSelectedShapeField('notes', this.value)">${s.notes || ''}</textarea>
        </div>
        <div class="editor-form-group">
          <label>لون تعبئة القطعة:</label>
          <select onchange="updateSelectedShapeField('color', this.value)">
            ${colorOptions}
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
          <label>زاوية الدوران (بالدرجات):</label>
          <input type="number" value="${b.angle || 0}" oninput="updateSelectedBorderField('angle', this.value)">
        </div>
        <div class="editor-form-group">
          <label>حجم الخط:</label>
          <input type="number" value="${b.fontSize || 13}" oninput="updateSelectedBorderField('fontSize', this.value)">
        </div>
      `;
    }
  } else if (selectedElement.type === 'splitLine') {
    const l = splitLines.find(x => x.id === selectedElement.id);
    if (l) {
      html = `
        <div class="editor-form-group">
          <label>طول خط التقسيم / المسمى:</label>
          <input type="text" value="${l.label || ''}" oninput="updateSelectedSplitField('label', this.value)">
        </div>
        <div class="editor-form-group">
          <label>زاوية دوران النص (درجة):</label>
          <input type="number" value="${l.angle || 0}" oninput="updateSelectedSplitField('angle', this.value)">
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
          <input type="number" value="${t.fontSize || 12}" oninput="updateSelectedFreeTextField('fontSize', this.value)">
        </div>
        <div class="editor-form-group">
          <label>زاوية الدوران:</label>
          <input type="number" value="${t.angle || 0}" oninput="updateSelectedFreeTextField('angle', this.value)">
        </div>
        <div style="display:flex; gap:10px; margin-top:8px;">
          <label style="display:flex; align-items:center; gap:4px; font-weight:bold; cursor:pointer;">
            <input type="checkbox" ${t.isBold ? 'checked' : ''} onchange="updateSelectedFreeTextField('isBold', this.checked)"> عريض
          </label>
          <label style="display:flex; align-items:center; gap:4px; font-weight:bold; cursor:pointer;">
            <input type="color" value="${t.color || '#000000'}" onchange="updateSelectedFreeTextField('color', this.value)" style="width:25px; height:20px; border:none; padding:0; cursor:pointer;"> لون النص
          </label>
        </div>
      `;
    }
  }

  // Delete button helper at bottom of selected elements
  html += `
    <button type="button" onclick="deleteSelectedElement()" style="width:100%; height:30px; border:none; border-radius:6px; background-color:#ffebee; color:#c62828; font-weight:bold; font-size:11px; cursor:pointer; margin-top:12px; transition: background 0.2s;" onmouseover="this.style.backgroundColor='#ffcdd2'" onmouseout="this.style.backgroundColor='#ffebee'">
      🗑️ حذف هذا العنصر
    </button>
  `;

  editorPanel.innerHTML = html;
}

function getElementTypeName() {
  if (!selectedElement) return "";
  switch(selectedElement.type) {
    case 'shape': return "قطعة أرض";
    case 'borderLabel': return "تسمية الحد الخارجي";
    case 'splitLine': return "خط تقسيم";
    case 'freeText': return "نص حر / ملاحظة";
    default: return "";
  }
}

// State updates from sidebar editor
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
    if (field === 'angle' || field === 'fontSize') {
      b[field] = parseFloat(value) || 0;
    } else {
      b[field] = value;
    }
    renderSVG();
    saveStateDebounced();
  }
}

function updateSelectedSplitField(field, value) {
  if (!selectedElement || selectedElement.type !== 'splitLine') return;
  const l = splitLines.find(x => x.id === selectedElement.id);
  if (l) {
    if (field === 'angle') l[field] = parseFloat(value) || 0;
    else l[field] = value;
    renderSVG();
    saveStateDebounced();
  }
}

function updateSelectedFreeTextField(field, value) {
  if (!selectedElement || selectedElement.type !== 'freeText') return;
  const t = freeTexts.find(x => x.id === selectedElement.id);
  if (t) {
    if (field === 'fontSize' || field === 'angle') {
      t[field] = parseFloat(value) || 0;
    } else {
      t[field] = value;
    }
    renderSVG();
    saveStateDebounced();
  }
}

// ----------------------------------------------------
// Insertion / Creation Tools
// ----------------------------------------------------
function promptAddFreeText(spawnX, spawnY) {
  const modal = document.getElementById("editModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalForm = document.getElementById("modalForm");

  modalTitle.textContent = "إضافة ملاحظة أو نص حر جديد";
  
  // Set default coordinates if not provided
  const x = spawnX !== undefined ? spawnX : 450;
  const y = spawnY !== undefined ? spawnY : 325;

  modalForm.innerHTML = `
    <div class="editor-form-group">
      <label>اكتب النص (مثل: مباع، باقي، نصيب فلان):</label>
      <input type="text" id="new-free-text" placeholder="مباع" style="width:100%; padding:6px; box-sizing:border-box;">
    </div>
    <div class="editor-form-group">
      <label>حجم الخط (بكسل):</label>
      <input type="number" id="new-free-text-size" value="14" style="width:100%; padding:6px; box-sizing:border-box;">
    </div>
    <input type="hidden" id="new-free-text-x" value="${x}">
    <input type="hidden" id="new-free-text-y" value="${y}">
  `;

  modal.style.display = "flex";
  
  // Autofocus the input field
  setTimeout(() => {
    document.getElementById("new-free-text").focus();
  }, 100);
}

function addNewSplitLine() {
  // Add a horizontal division line at the center of the screen
  const id = "split_" + (splitLines.length + 1);
  splitLines.push({
    id: id,
    x1: 250, y1: 325,
    x2: 650, y2: 325,
    label: "خط تقسيم جديد",
    labelX: 450, labelY: 310,
    angle: 0
  });

  selectedElement = { type: 'splitLine', id: id };
  renderSVG();
  populateSidebarEditor();
  saveState();
}

function saveModalData() {
  if (modalEditTarget) {
    const { type, id } = modalEditTarget;
    // Normalize type
    const targetType = type === 'shapeText' ? 'shape' : type;

    if (targetType === 'shape') {
      const s = shapes.find(x => x.id === id);
      if (s) {
        s.owner = document.getElementById("modal-owner").value;
        s.area.feddan = parseInt(document.getElementById("modal-feddan").value) || 0;
        s.area.carat = parseInt(document.getElementById("modal-carat").value) || 0;
        s.area.shares = parseFloat(document.getElementById("modal-shares").value) || 0;
        s.notes = document.getElementById("modal-notes").value;
      }
    } else if (targetType === 'borderLabel') {
      const b = borderLabels.find(x => x.id === id);
      if (b) {
        b.text = document.getElementById("modal-border-text").value;
        b.angle = parseFloat(document.getElementById("modal-border-angle").value) || 0;
      }
    } else if (targetType === 'splitLine' || targetType === 'splitLineLabel') {
      const l = splitLines.find(x => x.id === id);
      if (l) {
        l.label = document.getElementById("modal-split-label").value;
        l.angle = parseFloat(document.getElementById("modal-split-angle").value) || 0;
      }
    } else if (targetType === 'freeText') {
      const t = freeTexts.find(x => x.id === id);
      if (t) {
        t.text = document.getElementById("modal-free-text").value;
        t.fontSize = parseFloat(document.getElementById("modal-free-size").value) || 12;
        t.angle = parseFloat(document.getElementById("modal-free-angle").value) || 0;
      }
    }

    modalEditTarget = null;
    closeModal();
    renderSVG();
    populateSidebarEditor();
    saveState();
    return;
  }

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

    const id = "free_" + (freeTexts.length + 1);
    freeTexts.push({
      id: id,
      text: textVal,
      x: x,
      y: y,
      fontSize: sizeVal,
      isBold: true,
      color: "#000000"
    });

    closeModal();
    renderSVG();
    
    // Auto-select the newly added text
    selectedElement = { type: 'freeText', id: id };
    populateSidebarEditor();
    saveState();
  }
}

function closeModal() {
  const modal = document.getElementById("editModal");
  modal.style.display = "none";
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
    renderSVG();
    populateSidebarEditor();
    saveState();
  }
}

// ----------------------------------------------------
// PDF & Export Function
// ----------------------------------------------------
function printDallalMap() {
  // Deselect before printing to hide helper handles and selection borders
  selectedElement = null;
  renderSVG();
  populateSidebarEditor();

  const svgElement = document.getElementById("dallalSvg");
  const svgHTML = svgElement.outerHTML;

  const now = new Date();
  const dateStr = now.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("ar-EG");

  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>خريطة وكروكي تقسيم الأراضي - الدلال</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
        
        body, html {
          margin: 0;
          padding: 0;
          height: 100%;
          font-family: 'Cairo', Arial, sans-serif;
          color: #111;
          background: white;
          direction: rtl;
        }
        .header {
          text-align: center;
          border-bottom: 2px dashed #004d40;
          padding-bottom: 5px;
          margin: 10px 15px;
        }
        .header h1 {
          margin: 0;
          color: #004d40;
          font-size: 20px;
          font-weight: bold;
        }
        .header p {
          margin: 2px 0 0;
          color: #666;
          font-size: 11px;
        }
        .canvas-container {
          width: 100%;
          height: calc(100vh - 120px);
          margin: 0 auto;
          box-sizing: border-box;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        svg {
          width: 100%;
          height: 100%;
          max-height: 100%;
          max-width: 100%;
          display: block;
          background-color: white;
          border: 1px solid #000;
        }
        .footer {
          text-align: center;
          font-size: 11px;
          color: #777;
          border-top: 1px dashed #eee;
          padding-top: 5px;
          margin: 0 15px;
        }
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body, html {
            height: 100vh;
            width: 100vw;
            margin: 0;
            padding: 0;
          }
          .header, .footer {
            display: none !important;
          }
          .canvas-container {
            height: 100vh !important;
            width: 100vw !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          svg {
            border: none !important;
            width: 100% !important;
            height: 100% !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>كروكي الأراضي الهندسية - الدَّلاَّل</h1>
        <p>تاريخ الاستخراج: ${dateStr} | الساعة: ${timeStr}</p>
      </div>

      <div class="canvas-container">
        ${svgHTML}
      </div>

      <div class="footer">
        <p style="margin: 3px 0; font-weight: bold; color: #1b5e20;">جميع الحقوق محفوظة © تطبيق الدلال لقياسات الأراضي</p>
        <button class="no-print" onclick="window.print()" style="margin-top: 10px; padding: 8px 18px; background-color: #004d40; color: white; border: none; border-radius: 5px; font-family:'Cairo'; font-weight: bold; cursor: pointer; font-size:12px;">🖨️ طباعة الخريطة الآن</button>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
}
