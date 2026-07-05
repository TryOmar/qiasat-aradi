// DOM Elements
const shapeCards = document.querySelectorAll(".shape-card");
const inputsGroups = document.querySelectorAll(".inputs-group");
const caratSizeInput = document.getElementById("carat-size");
const caratPresetSelect = document.getElementById("carat-preset");
const caratPriceDisplay = document.getElementById("carat-price-display");
const caratPriceNumeric = document.getElementById("carat-price-numeric");
const stepsContent = document.getElementById("steps-content");

// Results Elements
const totalSqmResult = document.getElementById("total-sqm");
const totalPerimeterResult = document.getElementById("total-perimeter");
const totalPriceResult = document.getElementById("total-price");
const areaSharesResult = document.getElementById("area-shares");
const areaCaratsResult = document.getElementById("area-carats");
const areaFeddansResult = document.getElementById("area-feddans");
const conversionsTbody = document.getElementById("conversions-tbody");

// Division Elements
const divisionPanel = document.getElementById("division-panel");
const heirsCountInput = document.getElementById("heirs-count");
const heirsListTbody = document.getElementById("heirs-list");
const distributedAreaSpan = document.getElementById("distributed-area");
const totalLimitAreaSpan = document.getElementById("total-limit-area");
const distributionStatus = document.getElementById("distribution-status");
const btnToggleDivision = document.getElementById("btn-toggle-division");

// Canvas setup
const canvas = document.getElementById("landCanvas");
const ctx = canvas.getContext("2d");

// polyfill for roundRect on older browser engines
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (r === undefined) r = 0;
    if (typeof r === 'number') {
      r = { tl: r, tr: r, br: r, bl: r };
    } else if (Array.isArray(r)) {
      r = { tl: r[0] || 0, tr: r[1] || 0, br: r[2] || 0, bl: r[3] || 0 };
    }
    this.beginPath();
    this.moveTo(x + r.tl, y);
    this.lineTo(x + w - r.tr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r.tr);
    this.lineTo(x + w, y + h - r.br);
    this.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
    this.lineTo(x + r.bl, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r.bl);
    this.lineTo(x, y + r.tl);
    this.quadraticCurveTo(x, y, x + r.tl, y);
    this.closePath();
    return this;
  };
}

// State variables
let activeShape = "trapezoid";
let vertices = [];
let calculatedArea = 0;
let calculatedPerimeter = 0;
let heirsData = [];
let isDivisionActive = false;
let showActualDims = false; // متغير لإظهار الأبعاد الهندسية الفعلية (الأضلاع المائلة) في جدول التقسيم
let useTruncateRounding = false; // متغير للتحكم في قص الأرقام العشرية دون تقريب
let zoomFactor = 1.0;
let oldZoomFactor = 1.0;
let isPrinting = false;

// Interaction & division global variables
let isDraggingDivider = false;
let draggedDividerIdx = -1;
let dragStartX = 0;
let originalShares = [];
let dividerHandles = [];
let currentCanvasPoints = [];


// Aspect Ratio & Visual Stretch functions
function getVisualVertices(vertices) {
  if (!vertices || vertices.length < 3) return vertices;
  
  const viewType = document.getElementById("long-plot-view")?.value || "agricultural";
  if (viewType === "real") {
    return vertices;
  }
  
  const xs = vertices.map(v => v.x);
  const ys = vertices.map(v => v.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  const dx = maxX - minX || 1;
  const dy = maxY - minY || 1;
  
  const ratio = dx / dy;
  const invRatio = dy / dx;
  
  // If the shape is extremely narrow vertically (ratio > 8.0)
  if (ratio > 8.0) {
    const stretchFactor = ratio / 3.5; // Cap visual aspect ratio to about 3.5
    const centerY = (minY + maxY) / 2;
    return vertices.map(v => ({
      x: v.x,
      y: centerY + (v.y - centerY) * stretchFactor
    }));
  }
  
  // If the shape is extremely narrow horizontally (invRatio > 8.0)
  if (invRatio > 8.0) {
    const stretchFactor = invRatio / 3.5; // Cap visual aspect ratio to about 3.5
    const centerX = (minX + maxX) / 2;
    return vertices.map(v => ({
      x: centerX + (v.x - centerX) * stretchFactor,
      y: v.y
    }));
  }
  
  return vertices;
}

function resizeCanvasToFit() {
  calculateAll();
  return true;
}

function zoomIn() {
  zoomFactor = Math.min(3.0, zoomFactor + 0.15);
  calculateAll();
}

function zoomOut() {
  zoomFactor = Math.max(0.3, zoomFactor - 0.15);
  calculateAll();
}

let isCanvasFullscreen = false;
function fillScreen() {
  const container = document.getElementById("canvas-container");
  const btn = event.currentTarget || document.querySelector("button[onclick='fillScreen()']");
  if (!container) return;
  
  isCanvasFullscreen = !isCanvasFullscreen;
  
  if (isCanvasFullscreen) {
    container.classList.add("canvas-fullscreen-mode");
    if (btn) btn.innerText = "إنهاء ملء الشاشة";
    document.body.style.overflow = "hidden";
  } else {
    container.classList.remove("canvas-fullscreen-mode");
    if (btn) btn.innerText = "ملء الشاشة";
    document.body.style.overflow = "";
  }
  
  zoomFactor = 1.0;
  calculateAll();
}

window.addEventListener("resize", () => {
  calculateAll();
});

window.addEventListener("beforeprint", () => {
  isPrinting = true;
  oldZoomFactor = zoomFactor;
  zoomFactor = 1.0;
  ctx.resetTransform();
  
  const printDateEl = document.getElementById("print-date");
  if (printDateEl) {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    printDateEl.innerText = "تاريخ التقرير: " + today.toLocaleDateString('ar-EG', options);
  }

  calculateAll();
});

window.addEventListener("afterprint", () => {
  isPrinting = false;
  zoomFactor = oldZoomFactor;
  calculateAll();
});

// Page Load
document.addEventListener("DOMContentLoaded", function () {
  loadStateFromSession();
  setupEventListeners();
  resizeCanvasToFit();
  calculateAll();
});

function setupEventListeners() {
  // Shape card clicks
  shapeCards.forEach(card => {
    card.addEventListener("click", () => {
      shapeCards.forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      activeShape = card.getAttribute("data-shape");
      
      // Toggle inputs group
      inputsGroups.forEach(group => group.classList.remove("active"));
      document.getElementById(`inputs-${activeShape}`).classList.add("active");
      
      resetDivision();
      saveStateToSession();
      calculateAll();
    });
  });

  // Attach input listeners to all input fields to auto-calculate and save
  const allInputs = document.querySelectorAll("input, select");
  allInputs.forEach(input => {
    // Avoid double events on custom handlers
    if (input.id !== "carat-price-display" && input.id !== "heirs-count") {
      input.addEventListener("input", () => {
        if (input.closest(".inputs-group")) {
          resetDivision();
        }
        saveStateToSession();
        calculateAll();
      });
    }
  });

  caratSizeInput.addEventListener("input", () => {
    // If user types custom value, set select to custom
    const value = caratSizeInput.value;
    if (value !== "168" && value !== "171.388" && value !== "175" && value !== "175.035") {
      caratPresetSelect.value = "custom";
    } else {
      caratPresetSelect.value = value;
    }
    saveStateToSession();
    calculateAll();
  });

  // Canvas event listeners for dragging vertical dividers
  canvas.addEventListener('mousedown', handleCanvasPointerDown);
  canvas.addEventListener('mousemove', handleCanvasPointerMove);
  canvas.addEventListener('mouseup', handleCanvasPointerUp);
  canvas.addEventListener('mouseleave', handleCanvasPointerUp);

  canvas.addEventListener('touchstart', handleCanvasPointerDown, {passive: false});
  canvas.addEventListener('touchmove', handleCanvasPointerMove, {passive: false});
  canvas.addEventListener('touchend', handleCanvasPointerUp);
  canvas.addEventListener('touchcancel', handleCanvasPointerUp);

  // Visual connection between inputs and shape card SVG lines
  const highlightMapping = {
    // Rectangle
    'rect-width': { lines: ['#svg-card-rect-top', '#svg-card-rect-bottom'], texts: ['#svg-card-rect-label-w'] },
    'rect-length': { lines: ['#svg-card-rect-left', '#svg-card-rect-right'], texts: ['#svg-card-rect-label-l'] },
    
    // Square
    'square-side': { lines: ['#svg-card-square-outline'], texts: ['#svg-card-square-label'] },
    
    // Trapezoid
    'trap-base-minor': { lines: ['#svg-card-trap-top'], texts: ['#svg-card-trap-label-c'] },
    'trap-base-major': { lines: ['#svg-card-trap-bottom'], texts: ['#svg-card-trap-label-a'] },
    'trap-height': { lines: ['#svg-card-trap-height'], texts: ['#svg-card-trap-label-h'] },
    
    // Quadrilateral
    'quad-side-c': { lines: ['#svg-card-quad-c'], texts: ['#svg-card-quad-label-c'] },
    'quad-side-a': { lines: ['#svg-card-quad-a'], texts: ['#svg-card-quad-label-a'] },
    'quad-side-d': { lines: ['#svg-card-quad-d'], texts: ['#svg-card-quad-label-d'] },
    'quad-side-b': { lines: ['#svg-card-quad-b'], texts: ['#svg-card-quad-label-b'] },
    'quad-diag-ac': { lines: ['#svg-card-quad-ac'] },
    'quad-diag-bd': { lines: ['#svg-card-quad-bd'] }
  };

  Object.keys(highlightMapping).forEach(inputId => {
    const inputEl = document.getElementById(inputId);
    if (!inputEl) return;
    
    const target = highlightMapping[inputId];
    
    const highlight = () => {
      if (target.lines) {
        target.lines.forEach(selector => {
          const el = document.querySelector(selector);
          if (el) el.classList.add('svg-active-glow');
        });
      }
      if (target.texts) {
        target.texts.forEach(selector => {
          const el = document.querySelector(selector);
          if (el) el.classList.add('svg-active-text-glow');
        });
      }
    };
    
    const removeHighlight = () => {
      if (target.lines) {
        target.lines.forEach(selector => {
          const el = document.querySelector(selector);
          if (el) el.classList.remove('svg-active-glow');
        });
      }
      if (target.texts) {
        target.texts.forEach(selector => {
          const el = document.querySelector(selector);
          if (el) el.classList.remove('svg-active-text-glow');
        });
      }
    };
    
    // Events to trigger highlight
    inputEl.addEventListener('focus', highlight);
    inputEl.addEventListener('mouseenter', highlight);
    inputEl.addEventListener('input', highlight);
    
    inputEl.addEventListener('blur', removeHighlight);
    inputEl.addEventListener('mouseleave', removeHighlight);
  });

  // Handle "Enter" / "Next" key to jump to the next input field
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      const activeEl = document.activeElement;
      if (activeEl && activeEl.tagName === 'INPUT' && (activeEl.type === 'number' || activeEl.inputMode === 'decimal' || activeEl.inputMode === 'numeric')) {
        // Find all visible input elements
        const inputs = Array.from(document.querySelectorAll('input:not([readonly]):not([disabled]):not([type="hidden"])'))
          .filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0; // visible
          });
        
        const idx = inputs.indexOf(activeEl);
        if (idx > -1 && idx < inputs.length - 1) {
          e.preventDefault();
          inputs[idx + 1].focus();
        }
      }
    }
  });
}

// Canvas events for division dragging (returns coordinates in CSS pixels)
function getEventPos(e) {
  let rect = canvas.getBoundingClientRect();
  let clientX = e.clientX;
  let clientY = e.clientY;
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  }
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function handleCanvasPointerDown(e) {
  if (!isDivisionActive || heirsData.length <= 1) return;
  const pos = getEventPos(e);
  const scaleMultiplier = Math.max(0.7, canvas.clientWidth / 600);
  const hitBox = Math.max(15, 20 * scaleMultiplier);
  
  for (let i = 0; i < dividerHandles.length; i++) {
    const handle = dividerHandles[i];
    const dist = Math.hypot(pos.x - handle.x, pos.y - handle.y);
    if (dist < hitBox) { // Dynamic hitbox
      isDraggingDivider = true;
      draggedDividerIdx = handle.index;
      dragStartX = pos.x;
      originalShares = heirsData.map(h => h.share);
      e.preventDefault();
      return;
    }
  }
}

function handleCanvasPointerMove(e) {
  if (!isDivisionActive || heirsData.length <= 1) return;
  const pos = getEventPos(e);
  const scaleMultiplier = Math.max(0.7, canvas.clientWidth / 600);
  const hitBox = Math.max(15, 20 * scaleMultiplier);
  
  if (!isDraggingDivider) {
    let hover = false;
    for (let i = 0; i < dividerHandles.length; i++) {
      const handle = dividerHandles[i];
      const dist = Math.hypot(pos.x - handle.x, pos.y - handle.y);
      if (dist < hitBox) {
        hover = true;
        break;
      }
    }
    canvas.style.cursor = hover ? "ew-resize" : "default";
    return;
  }
  
  e.preventDefault();
  canvas.style.cursor = "ew-resize";
  
  if (currentCanvasPoints.length < 4) return;
  const cpA = currentCanvasPoints[0];
  const cpB = currentCanvasPoints[1];
  const cpC = currentCanvasPoints[2];
  const cpD = currentCanvasPoints[3];
  
  const y_m = pos.y;
  
  // Left side is cpD to cpA
  let xLeft = cpD.x;
  if (Math.abs(cpA.y - cpD.y) > 1) {
    xLeft = cpD.x + ((y_m - cpD.y) / (cpA.y - cpD.y)) * (cpA.x - cpD.x);
  }
  
  // Right side is cpC to cpB
  let xRight = cpC.x;
  if (Math.abs(cpB.y - cpC.y) > 1) {
    xRight = cpC.x + ((y_m - cpC.y) / (cpB.y - cpC.y)) * (cpB.x - cpC.x);
  }
  
  let t = 0.5;
  const widthCanvas = xRight - xLeft;
  if (widthCanvas > 1) {
    t = (pos.x - xLeft) / widthCanvas;
  }
  t = Math.max(0.001, Math.min(0.999, t));
  
  const newCumArea = getLeftArea(t);
  
  let cumAreaPrev = 0;
  for (let idx = 0; idx < draggedDividerIdx - 1; idx++) {
    cumAreaPrev += originalShares[idx]; // Use originalShares to prevent drift during continuous drag
  }
  
  let cumAreaNext = 0;
  for (let idx = 0; idx < draggedDividerIdx + 1; idx++) {
    cumAreaNext += originalShares[idx];
  }
  
  const minArea = cumAreaPrev + 1;
  const maxArea = cumAreaNext - 1;
  
  let targetCumArea = Math.max(minArea, Math.min(maxArea, newCumArea));
  
  heirsData[draggedDividerIdx - 1].share = targetCumArea - cumAreaPrev;
  heirsData[draggedDividerIdx].share = cumAreaNext - targetCumArea;
  
  // Re-calculate exact widths and side lengths for all heirs since shares changed
  recalculateHeirsDimensions();
  
  saveStateToSession();
  updateHeirsUI();
  calculateAll();
}

function handleCanvasPointerUp(e) {
  if (isDraggingDivider) {
    isDraggingDivider = false;
    draggedDividerIdx = -1;
    canvas.style.cursor = "default";
    saveStateToSession();
    calculateAll();
  }
}


function updateCaratPreset() {
  const preset = caratPresetSelect.value;
  if (preset !== "custom") {
    caratSizeInput.value = preset;
  } else {
    caratSizeInput.value = "";
    caratSizeInput.focus();
  }
  saveStateToSession();
  calculateAll();
}



// Formatting Price input with commas
function formatPrice(input) {
  const rawValue = input.value.replace(/\D/g, "");
  caratPriceNumeric.value = rawValue;
  input.value = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  saveStateToSession();
  calculateAll();
}

// Clear all inputs
function clearAllInputs() {
  const inputs = document.querySelectorAll(".inputs-group.active input");
  inputs.forEach(input => input.value = "");
  caratPriceDisplay.value = "";
  caratPriceNumeric.value = "";
  
  resetDivision();
  saveStateToSession();
  calculateAll();
}

// Show/Hide Division Panel
function toggleDivisionPanel() {
  isDivisionActive = !isDivisionActive;
  const sketchPanel = document.getElementById('division-sketch-panel');
  if (isDivisionActive) {
    divisionPanel.style.display = "block";
    if (sketchPanel) sketchPanel.style.display = "block";
    btnToggleDivision.classList.add("active-panel");
    generateHeirsTable();
  } else {
    divisionPanel.style.display = "none";
    if (sketchPanel) sketchPanel.style.display = "none";
    btnToggleDivision.classList.remove("active-panel");
  }
  calculateAll();
}

// Reset Smart Division panel
function resetDivision() {
  isDivisionActive = false;
  heirsData = [];
  const sketchPanel = document.getElementById('division-sketch-panel');
  if (divisionPanel) divisionPanel.style.display = "none";
  if (sketchPanel) sketchPanel.style.display = "none";
  if (btnToggleDivision) btnToggleDivision.classList.remove("active-panel");
  if (heirsListTbody) heirsListTbody.innerHTML = "";
  if (heirsCountInput) heirsCountInput.value = "3";
  saveStateToSession();
}

// إظهار/إخفاء خيار "الأبعاد الهندسية الفعلية" بناءً على الشكل المختار
function updateDivisionSettingsUI() {
  const toggleDiv = document.getElementById('actual-dims-toggle');
  const checkbox = document.getElementById('show-actual-dims');
  if (!toggleDiv || !checkbox) return;
  
  if (activeShape === 'trapezoid') {
    // للنموذج المبسط: أظهر خيار الأبعاد الهندسية
    toggleDiv.style.display = 'flex';
    checkbox.checked = showActualDims;
  } else {
    // للأشكال الأخرى: أخفِ الخيار وأعِد showActualDims إلى true (يعرض يمين/يسار كالمعتاد)
    toggleDiv.style.display = 'none';
    showActualDims = true;
    checkbox.checked = true;
  }
  
  updateTableHeaders();
}

// تحديث عناوين أعمدة جدول التقسيم ديناميكياً
function updateTableHeaders() {
  const thRight = document.getElementById('th-side-right');
  const thLeft  = document.getElementById('th-side-left');
  if (!thRight || !thLeft) return;
  
  if (activeShape === 'trapezoid' && !showActualDims) {
    // في النموذج المبسط بدون خيار الأبعاد الهندسية: أظهر عمود "الطول" واحد
    thRight.textContent = 'الطول (م)';
    thRight.setAttribute('colspan', '2');
    thLeft.style.display = 'none';
  } else {
    // في الأشكال الأخرى أو عند تفعيل الخيار: أظهر يمين ويسار
    thRight.textContent = 'يمين';
    thRight.removeAttribute('colspan');
    thLeft.style.display = '';
    thLeft.textContent = 'يسار';
  }
}

// معالج تفعيل/إيقاف الخيار المتقدم
function onToggleActualDims() {
  const checkbox = document.getElementById('show-actual-dims');
  if (!checkbox) return;
  showActualDims = checkbox.checked;
  sessionStorage.setItem('showActualDims', showActualDims ? 'true' : 'false');
  updateTableHeaders();
  renderHeirsRows();
  updateHeirsUI();
}



// Math conversions
const originalToFixed = Number.prototype.toFixed;

Number.prototype.toFixedNoRounding = function (n) {
  if (isNaN(this)) return "0." + "0".repeat(n);
  const val = parseFloat(this.toString());
  if (!isFinite(val)) return "0." + "0".repeat(n);

  let str = val.toString();
  // Handling scientific notation if present
  if (str.indexOf('e') !== -1) {
    str = originalToFixed.call(val, n + 4);
  }

  const parts = str.split('.');
  const integerPart = parts[0];
  let decimalPart = parts[1] || '';
  
  if (decimalPart.length > n) {
    decimalPart = decimalPart.substring(0, n);
  } else {
    decimalPart = decimalPart + '0'.repeat(n - decimalPart.length);
  }
  
  return n > 0 ? `${integerPart}.${decimalPart}` : integerPart;
};

// Global interceptor for all .toFixed calls in the application
Number.prototype.toFixed = function(digits) {
  if (useTruncateRounding) {
    return this.toFixedNoRounding(digits || 0);
  }
  return originalToFixed.call(this, digits || 0);
};

function toggleRoundingMode() {
  const roundingSelect = document.getElementById("number-rounding-mode");
  if (roundingSelect) {
    useTruncateRounding = (roundingSelect.value === "truncate");
  }
  saveStateToSession();
  calculateAll();
}


function convertSqmToFeddans(sqm, caratSize) {
  if (!sqm || sqm <= 0) return { feddans: 0, carats: 0, shares: 0 };
  const feddanSize = caratSize * 24;
  
  const feddans = Math.floor(sqm / feddanSize);
  const remainingForCarats = sqm - (feddans * feddanSize);
  const carats = Math.floor(remainingForCarats / caratSize);
  const remainingForShares = remainingForCarats - (carats * caratSize);
  const shares = (remainingForShares * 24) / caratSize;
  
  return {
    feddans: feddans,
    carats: carats,
    shares: parseFloat(shares.toFixed(2))
  };
}

// Qasaba and Qabda conversion
function toQasabaAndQabda(meters) {
  if (!meters || isNaN(meters) || meters <= 0) return { qasaba: 0, qabda: 0, fraction: 0 };
  const qasabaLength = 3.55;
  const qabdaLength = qasabaLength / 24; // ~0.1479167
  
  let qasaba = Math.floor(meters / qasabaLength);
  let rem = meters - (qasaba * qasabaLength);
  let qabda = Math.floor(rem / qabdaLength);
  let fraction = (rem - (qabda * qabdaLength)) / qabdaLength;
  return {
    qasaba: qasaba,
    qabda: qabda,
    fraction: parseFloat(fraction.toFixed(2))
  };
}

// Convert قصبة + قبضة + أقل من قبضة back to meters
function fromQasabaToMeters(qasaba, qabda, fraction) {
  const qasabaLength = 3.55;
  const qabdaLength = qasabaLength / 24;
  return (qasaba * qasabaLength) + (qabda * qabdaLength) + (fraction * qabdaLength);
}

// Normalize qabda overflow: if qabda >= 24, carry into qasaba
function normalizeQasabaInputs(rowIndex) {
  const qasabaEl  = document.getElementById('conv-qasaba-'  + rowIndex);
  const qabdaEl   = document.getElementById('conv-qabda-'   + rowIndex);
  const fracEl    = document.getElementById('conv-fraction-' + rowIndex);
  if (!qasabaEl || !qabdaEl || !fracEl) return;

  let fracRaw = fracEl.value;
  if (fracRaw && !fracRaw.includes('.')) {
    fracRaw = "0." + fracRaw;
    fracEl.value = fracRaw;
  }
  
  let qasaba  = Math.max(0, parseInt(qasabaEl.value)  || 0);
  let qabda   = Math.max(0, parseInt(qabdaEl.value)   || 0);
  let fraction = parseFloat(fracRaw) || 0;

  // Clamp fraction to [0, 0.99]
  fraction = Math.min(0.99, Math.max(0, parseFloat(fraction.toFixed(2))));

  // Carry: 24 قبضة = 1 قصبة
  if (qabda >= 24) {
    const carry = Math.floor(qabda / 24);
    qasaba += carry;
    qabda = qabda % 24;
  }

  // Write back normalized values
  qasabaEl.value  = qasaba;
  qabdaEl.value   = qabda;
  fracEl.value    = fraction;

  return { qasaba, qabda, fraction };
}

// تصدير الكروكي كصورة مقصوصة وبدون فراغات (PNG)
function exportCroquisAsImage() {
  window.isExportingAsImage = true;
  calculateAll(); // يُعيد الرسم بأبعاد متناسبة ومقصوصة بشكل مثالي
  
  const canvas = document.getElementById('landCanvas');
  const filename = "كروكي_الأرض_الدلال.png";
  
  canvas.toBlob(async function(blob) {
    if (!blob) {
      window.isExportingAsImage = false;
      calculateAll();
      return;
    }
    
    // محاولة استخدام Web Share API (ممتازة لتطبيقات الجوال)
    try {
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'كروكي الأرض',
          text: 'كروكي الأرض من تطبيق الدلال'
        });
        window.isExportingAsImage = false;
        calculateAll();
        return; // تمت المشاركة بنجاح
      }
    } catch (err) {
      console.log("Web Share API failed, falling back to blob download", err);
    }
    
    // الطريقة البديلة (تعمل بشكل أفضل من data: URL في متصفحات الجوال وتطبيقات الـ WebView)
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      window.isExportingAsImage = false;
      calculateAll();
    }, 150);
  }, "image/png");
}

let convBlurTimeout = null;

// Called when user edits a cell in the conversions table
function updateSideFromQasaba(sideId, rowIndex) {
  const vals = normalizeQasabaInputs(rowIndex);
  if (!vals) return;
  const { qasaba, qabda, fraction } = vals;

  const meters = fromQasabaToMeters(qasaba, qabda, fraction);

  // Update the meter display label in the row
  const meterSpan = document.getElementById('conv-meter-' + rowIndex);
  if (meterSpan) {
    meterSpan.textContent = parseFloat(meters.toFixed(4));
    // Flash the badge for visual feedback
    const badge = meterSpan.closest('.conv-meter-badge');
    if (badge) {
      badge.classList.add('updated');
      setTimeout(() => badge.classList.remove('updated'), 600);
    }
  }

  // Update the main dimension input
  const sideInput = document.getElementById(sideId);
  if (sideInput) {
    sideInput.value = parseFloat(meters.toFixed(4));
  }
  calculateAll();

  // Manage keyboard auto-blur after 3 seconds of inactivity
  if (convBlurTimeout) clearTimeout(convBlurTimeout);
  convBlurTimeout = setTimeout(() => {
    const activeEl = document.activeElement;
    if (activeEl && activeEl.id && activeEl.id.startsWith('conv-')) {
      activeEl.blur();
    }
  }, 3000);
}

// Main calculations controller
function calculateAll() {
  const caratSize = parseFloat(caratSizeInput.value) || 168;
  const pricePerCarat = parseFloat(caratPriceNumeric.value) || 0;
  
  let area = 0;
  let perimeter = 0;
  let stepsText = "";
  vertices = []; // Global coordinates for plotting
  let errorMsg = "";
  let dimensionInputs = []; // For the Qasaba table

  if (activeShape === "rectangle") {
    const length = parseFloat(document.getElementById("rect-length").value) || 0;
    const width = parseFloat(document.getElementById("rect-width").value) || 0;
    
    dimensionInputs = [
      { name: "العرض", value: width },
      { name: "الطول", value: length }
    ];

    if (length > 0 && width > 0) {
      area = length * width;
      perimeter = 2 * (length + width);
      stepsText = `الشكل المختار: مستطيل\n` +
                  `المعادلة: المساحة = الطول × العرض\n` +
                  `الحساب: ${length} × ${width} = ${area.toFixed(2)} متر مربع\n` +
                  `المحيط = 2 × (الطول + العرض) = 2 × (${length} + ${width}) = ${perimeter.toFixed(2)} متر`;
      
      // Coordinates
      vertices = [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: length },
        { x: 0, y: length }
      ];
    }

  } else if (activeShape === "square") {
    const side = parseFloat(document.getElementById("square-side").value) || 0;

    dimensionInputs = [
      { name: "طول الضلع", value: side }
    ];

    if (side > 0) {
      area = side * side;
      perimeter = 4 * side;
      stepsText = `الشكل المختار: مربع\n` +
                  `المعادلة: المساحة = الضلع × الضلع\n` +
                  `الحساب: ${side} × ${side} = ${area.toFixed(2)} متر مربع\n` +
                  `المحيط = 4 × الضلع = 4 × ${side} = ${perimeter.toFixed(2)} متر`;
      
      // Coordinates (square)
      vertices = [
        { x: 0, y: 0 },
        { x: side, y: 0 },
        { x: side, y: side },
        { x: 0, y: side }
      ];
    }

  } else if (activeShape === "trapezoid") {
    const a = parseFloat(document.getElementById("trap-base-major").value) || 0; // major base (القاعدة السفلية)
    const c = parseFloat(document.getElementById("trap-base-minor").value) || 0; // minor base (القاعدة العلوية)
    const h = parseFloat(document.getElementById("trap-height").value) || 0; // height (الطول)

    dimensionInputs = [
      { name: "القاعدة العلوية", value: c },
      { name: "القاعدة السفلية", value: a },
      { name: "الطول (أو الارتفاع)", value: h }
    ];

    if (a > 0 && c > 0 && h > 0) {
      area = 0.5 * (a + c) * h;
      
      // Calculate missing sides assuming symmetric isosceles trapezoid
      const dxHalf = Math.abs(a - c) / 2;
      const calculatedSide = Math.sqrt(h * h + dxHalf * dxHalf);
      
      perimeter = a + c + 2 * calculatedSide;

      stepsText = `الشكل المختار: شبه منحرف زراعي (مبسط)\n` +
                  `المعادلة: المساحة = 0.5 × (القاعدة السفلية + القاعدة العلوية) × الطول\n` +
                  `الحساب: 0.5 × (${a} + ${c}) × ${h} = ${area.toFixed(2)} متر مربع\n` +
                  `المحيط (تقريبي) = مجموع الأضلاع الأربعة = ${a} + ${c} + ${calculatedSide.toFixed(2)} (جانب أيسر) + ${calculatedSide.toFixed(2)} (جانب أيمن) = ${perimeter.toFixed(2)} متر`;

      // Coordinates (Centered top base)
      const dxLeft = (a - c) / 2;
      vertices = [
        { x: 0, y: 0 },
        { x: a, y: 0 },
        { x: a - dxLeft, y: h },
        { x: dxLeft, y: h }
      ];
    }

  } else if (activeShape === "quadrilateral") {
    const a = parseFloat(document.getElementById("quad-side-a").value) || 0;
    const b = parseFloat(document.getElementById("quad-side-b").value) || 0;
    const c = parseFloat(document.getElementById("quad-side-c").value) || 0;
    const d = parseFloat(document.getElementById("quad-side-d").value) || 0;
    const d_ac = parseFloat(document.getElementById("quad-diag-ac").value) || 0;
    const d_bd = parseFloat(document.getElementById("quad-diag-bd").value) || 0;

    dimensionInputs = [
      { name: "الضلع العلوي (C)", value: c },
      { name: "الضلع السفلي (A)", value: a },
      { name: "الضلع الأيمن (D)", value: d },
      { name: "الضلع الأيسر (B)", value: b }
    ];
    if (d_ac > 0) dimensionInputs.push({ name: "القطر (AC)", value: d_ac });
    if (d_bd > 0) dimensionInputs.push({ name: "القطر (BD)", value: d_bd });

    if (a > 0 && b > 0 && c > 0 && d > 0) {
      if (d_ac <= 0 && d_bd <= 0) {
        errorMsg = "خطأ: يجب إدخال أحد القطرين (AC) أو (BD) لإجراء الحساب والتقسيم الدقيق.";
      } else if (d_ac > 0) {
        // Prioritize AC if entered
        const cosAlpha1 = (a * a + d_ac * d_ac - d * d) / (2 * a * d_ac);
        const cosAlpha2 = (b * b + d_ac * d_ac - c * c) / (2 * b * d_ac);
        
        if (cosAlpha1 < -1.0001 || cosAlpha1 > 1.0001 || cosAlpha2 < -1.0001 || cosAlpha2 > 1.0001) {
          errorMsg = "خطأ هندسي: أطوال الأضلاع والقطر AC لا يمكن أن تشكل رباعي أضلاع حقيقي (أطوال الأضلاع لا تلبي متباينة المثلث مع القطر).";
        } else {
          const area1 = heronArea(a, d, d_ac);
          const area2 = heronArea(b, c, d_ac);
          
          if (area1 <= 0 || area2 <= 0) {
            errorMsg = "خطأ هندسي: تعذر تكوين مثلثات صحيحة باستخدام القطر AC.";
          } else {
            area = area1 + area2;
            perimeter = a + b + c + d;
            stepsText = `الشكل المختار: رباعي غير منتظم (التقسيم الدقيق باستخدام القطر AC = ${d_ac} م)\n` +
                        `تم تقسيم الشكل إلى مثلثين بالقطر AC:\n` +
                        `- المثلث الأول ABC بأطوال أضلاع: ${a} م، ${d} م، ${d_ac} م\n` +
                        `  مساحة المثلث الأول (بقانون هيرون) = ${area1.toFixed(4)} م²\n` +
                        `- المثلث الثاني ADC بأطوال أضلاع: ${b} م، ${c} م، ${d_ac} م\n` +
                        `  مساحة المثلث الثاني (بقانون هيرون) = ${area2.toFixed(4)} م²\n` +
                        `المساحة الكلية = مساحة المثلث الأول + مساحة المثلث الثاني\n` +
                        `الحساب: ${area1.toFixed(4)} + ${area2.toFixed(4)} = ${area.toFixed(4)} متر مربع\n` +
                        `المحيط = ${perimeter.toFixed(2)} متر`;

            // Calculate coordinates
            const alpha1 = Math.acos(Math.max(-1, Math.min(1, cosAlpha1)));
            const alpha2 = Math.acos(Math.max(-1, Math.min(1, cosAlpha2)));
            const x_c = d_ac * Math.cos(alpha1);
            const y_c = d_ac * Math.sin(alpha1);
            const x_d = b * Math.cos(alpha1 + alpha2);
            const y_d = b * Math.sin(alpha1 + alpha2);

            vertices = [
              { x: 0, y: 0 },
              { x: a, y: 0 },
              { x: x_c, y: y_c },
              { x: x_d, y: y_d }
            ];
          }
        }
      } else {
        // Use BD
        const cosBeta1 = (a * a + b * b - d_bd * d_bd) / (2 * a * b);
        const cosBeta2 = (d_bd * d_bd + d * d - c * c) / (2 * d_bd * d);

        if (cosBeta1 < -1.0001 || cosBeta1 > 1.0001 || cosBeta2 < -1.0001 || cosBeta2 > 1.0001) {
          errorMsg = "خطأ هندسي: أطوال الأضلاع والقطر BD لا يمكن أن تشكل رباعي أضلاع حقيقي (أطوال الأضلاع لا تلبي متباينة المثلث مع القطر).";
        } else {
          const area1 = heronArea(a, b, d_bd);
          const area2 = heronArea(d, c, d_bd);

          if (area1 <= 0 || area2 <= 0) {
            errorMsg = "خطأ هندسي: تعذر تكوين مثلثات صحيحة باستخدام القطر BD.";
          } else {
            area = area1 + area2;
            perimeter = a + b + c + d;
            stepsText = `الشكل المختار: رباعي غير منتظم (التقسيم الدقيق باستخدام القطر BD = ${d_bd} م)\n` +
                        `تم تقسيم الشكل إلى مثلثين بالقطر BD:\n` +
                        `- المثلث الأول ABD بأطوال أضلاع: ${a} م، ${b} م، ${d_bd} م\n` +
                        `  مساحة المثلث الأول (بقانون هيرون) = ${area1.toFixed(4)} م²\n` +
                        `- المثلث الثاني BCD بأطوال أضلاع: ${d} م، ${c} م، ${d_bd} م\n` +
                        `  مساحة المثلث الثاني (بقانون هيرون) = ${area2.toFixed(4)} م²\n` +
                        `المساحة الكلية = مساحة المثلث الأول + مساحة المثلث الثاني\n` +
                        `الحساب: ${area1.toFixed(4)} + ${area2.toFixed(4)} = ${area.toFixed(4)} متر مربع\n` +
                        `المحيط = ${perimeter.toFixed(2)} متر`;

            // Calculate coordinates
            const beta1 = Math.acos(Math.max(-1, Math.min(1, cosBeta1)));
            const beta2 = Math.acos(Math.max(-1, Math.min(1, cosBeta2)));
            const x_d = b * Math.cos(beta1);
            const y_d = b * Math.sin(beta1);
            const phi = Math.atan2(y_d, x_d - a);
            const x_c = a + d * Math.cos(phi - beta2);
            const y_c = d * Math.sin(phi - beta2);

            vertices = [
              { x: 0, y: 0 },
              { x: a, y: 0 },
              { x: x_c, y: y_c },
              { x: x_d, y: y_d }
            ];
          }
        }
      }
    }
  }

  // Handle errors
  if (errorMsg) {
    stepsText = errorMsg;
    area = 0;
    perimeter = 0;
    vertices = [];
  }

  calculatedArea = area;
  calculatedPerimeter = perimeter;

  if (isDivisionActive && area > 0) {
    recalculateHeirsDimensions();
  }

  // Display results
  totalSqmResult.innerText = area > 0 ? area.toFixed(2) : "0";
  totalPerimeterResult.innerText = perimeter > 0 ? perimeter.toFixed(2) : "0";
  
  const conversions = convertSqmToFeddans(area, caratSize);
  areaSharesResult.innerText = area > 0 ? conversions.shares.toFixedNoRounding(2) : "0";
  areaCaratsResult.innerText = area > 0 ? conversions.carats : "0";
  areaFeddansResult.innerText = area > 0 ? conversions.feddans : "0";

  // Calculate Price
  const totalCarats = area / caratSize;
  const totalPrice = totalCarats * pricePerCarat;
  totalPriceResult.innerText = area > 0 && totalPrice > 0 ? Math.floor(totalPrice).toLocaleString() : "0";

  // Steps
  stepsContent.innerText = stepsText || "لم يتم إدخال بيانات كافية لإجراء الحسابات.";

  // Map dimensionInputs index to the corresponding side input ID
  const sideIds = ["quad-side-a", "quad-side-b", "quad-side-c", "quad-side-d",
                   "rect-length", "rect-width",
                   "trap-base-major", "trap-base-minor", "trap-height"];
  // Build a lookup from dim.name to sideId using the order they come in
  const activeSideIds = (() => {
    if (activeShape === "quadrilateral") return ["quad-side-c", "quad-side-a", "quad-side-d", "quad-side-b"];
    if (activeShape === "rectangle") return ["rect-width", "rect-length"];
    if (activeShape === "trapezoid") return ["trap-base-minor", "trap-base-major", "trap-height"];
    return [];
  })();

  const activeEl = document.activeElement;
  const isEditingConversion = activeEl && activeEl.id && activeEl.id.startsWith('conv-');

  if (!isEditingConversion) {
    conversionsTbody.innerHTML = "";
    if (dimensionInputs.length > 0) {
      dimensionInputs.forEach((dim, i) => {
        const qConv = toQasabaAndQabda(dim.value);
        const sid = activeSideIds[i] || "";
        conversionsTbody.innerHTML += `
          <tr class="conv-row">
            <td class="conv-label-cell">
              <span class="conv-dim-name">${dim.name}</span>
              <span class="conv-meter-badge">
                <span id="conv-meter-${i}">${dim.value || 0}</span> م
              </span>
            </td>
            <td class="conv-input-cell">
              <input type="number" inputmode="decimal" class="conv-input conv-fraction"
                id="conv-fraction-${i}" value="${qConv.fraction}"
                min="0" max="0.99" step="0.01"
                title="جزء أقل من القبضة (0 - 0.99)"
                oninput="updateSideFromQasaba('${sid}', ${i})"
                onchange="updateSideFromQasaba('${sid}', ${i})">
            </td>
            <td class="conv-input-cell">
              <input type="number" inputmode="decimal" class="conv-input conv-qabda"
                id="conv-qabda-${i}" value="${qConv.qabda}"
                min="0" step="1"
                title="عدد القبضات (24 قبضة = 1 قصبة تلقائياً)"
                oninput="updateSideFromQasaba('${sid}', ${i})"
                onchange="updateSideFromQasaba('${sid}', ${i})">
            </td>
            <td class="conv-input-cell">
              <input type="number" inputmode="decimal" class="conv-input conv-qasaba"
                id="conv-qasaba-${i}" value="${qConv.qasaba}"
                min="0" step="1"
                title="عدد القصبات"
                oninput="updateSideFromQasaba('${sid}', ${i})"
                onchange="updateSideFromQasaba('${sid}', ${i})">
            </td>
          </tr>
        `;
      });

      // Add square qasba row
      const qasba_sq = area / 12.60250;
      const reedValue = Math.floor(qasba_sq);
      const fistValue = Math.floor((qasba_sq - reedValue) * 24);
      const lessThanFistValue = (qasba_sq - reedValue - (fistValue / 24)).toFixed(2);

      conversionsTbody.innerHTML += `
        <tr class="conv-row" style="background-color: #fcfcfc;">
          <td class="conv-label-cell" style="font-weight: bold;">
            <span class="conv-dim-name">النتيجة بالقصبة المربعة</span>
            <span class="conv-meter-badge" style="background-color: #e8f5e9; color: #2e7d32;">
              <span>${area.toFixed(2)}</span> م²
            </span>
          </td>
          <td class="conv-input-cell">
            <input type="number" class="conv-input conv-fraction" value="${lessThanFistValue}" readonly style="background-color: #f5f5f5; color: #555;">
          </td>
          <td class="conv-input-cell">
            <input type="number" class="conv-input conv-qabda" value="${fistValue}" readonly style="background-color: #f5f5f5; color: #555;">
          </td>
          <td class="conv-input-cell">
            <input type="number" class="conv-input conv-qasaba" value="${reedValue}" readonly style="background-color: #f5f5f5; color: #555;">
          </td>
        </tr>
      `;
    } else {
      conversionsTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #888; padding:12px;">أدخل الأبعاد أعلاه لعرض التحويلات</td></tr>`;
    }
  }

  // Manage Heirs Division Limit
  totalLimitAreaSpan.innerText = area.toFixed(2);
  
  // Draw on Canvas
  drawLandCanvas(vertices);

  // تحديث واجهة إعدادات التقسيم (يمين/يسار مقابل الطول)
  updateDivisionSettingsUI();

  if (isDivisionActive && area > 0) {
    updateHeirsDistribution();
    updateHeirsUI();
  }
}


// Helper for Heron's Formula Area
function heronArea(side1, side2, side3) {
  if (side1 <= 0 || side2 <= 0 || side3 <= 0) return 0;
  if (side1 + side2 <= side3 || side1 + side3 <= side2 || side2 + side3 <= side1) return 0;
  const s = (side1 + side2 + side3) / 2;
  return Math.sqrt(s * (s - side1) * (s - side2) * (s - side3));
}

// Calculate the area to the left of the division line at fraction t
function getLeftArea(t) {
  if (!vertices || vertices.length < 4) return 0;
  // P_bottom(t) = A + t * (B - A)
  const pBottom = {
    x: vertices[0].x + t * (vertices[1].x - vertices[0].x),
    y: vertices[0].y + t * (vertices[1].y - vertices[0].y)
  };
  // P_top(t) = D + t * (C - D)
  const pTop = {
    x: vertices[3].x + t * (vertices[2].x - vertices[3].x),
    y: vertices[3].y + t * (vertices[2].y - vertices[3].y)
  };
  
  // Shoelace formula for vertices: A, pBottom, pTop, D
  const pts = [vertices[0], pBottom, pTop, vertices[3]];
  let area = 0;
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    area += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return Math.abs(area) * 0.5;
}

// Bisection method to find the fraction t corresponding to a target cumulative area
function findTForArea(targetArea, totalArea) {
  if (targetArea <= 0) return 0;
  if (targetArea >= totalArea) return 1.0;
  
  let low = 0;
  let high = 1.0;
  let mid = 0.5;
  for (let iter = 0; iter < 40; iter++) {
    mid = (low + high) / 2;
    const currentArea = getLeftArea(mid);
    if (Math.abs(currentArea - targetArea) < 0.00001) {
      break;
    }
    if (currentArea < targetArea) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return mid;
}

// Get the actual physical side lengths of the heir's slice in meters
function getPieceRealSides(tPrev, tCurr) {
  if (!vertices || vertices.length < 4) return { top: 0, bottom: 0, left: 0, right: 0 };
  const pBotPrev = {
    x: vertices[0].x + tPrev * (vertices[1].x - vertices[0].x),
    y: vertices[0].y + tPrev * (vertices[1].y - vertices[0].y)
  };
  const pBotCurr = {
    x: vertices[0].x + tCurr * (vertices[1].x - vertices[0].x),
    y: vertices[0].y + tCurr * (vertices[1].y - vertices[0].y)
  };
  const pTopPrev = {
    x: vertices[3].x + tPrev * (vertices[2].x - vertices[3].x),
    y: vertices[3].y + tPrev * (vertices[2].y - vertices[3].y)
  };
  const pTopCurr = {
    x: vertices[3].x + tCurr * (vertices[2].x - vertices[3].x),
    y: vertices[3].y + tCurr * (vertices[2].y - vertices[3].y)
  };
  
  return {
    top: Math.hypot(pTopCurr.x - pTopPrev.x, pTopCurr.y - pTopPrev.y),
    bottom: Math.hypot(pBotCurr.x - pBotPrev.x, pBotCurr.y - pBotPrev.y),
    left: Math.hypot(pTopPrev.x - pBotPrev.x, pTopPrev.y - pBotPrev.y),
    right: Math.hypot(pTopCurr.x - pBotCurr.x, pTopCurr.y - pBotCurr.y)
  };
}

// Re-calculate all slice dimensions using exact area-based coordinates
function recalculateHeirsDimensions() {
  if (calculatedArea <= 0 || heirsData.length === 0) return;
  const exactTs = [0];
  let tempCumArea = 0;
  for (let i = 0; i < heirsData.length - 1; i++) {
    tempCumArea += heirsData[i].share;
    exactTs.push(findTForArea(tempCumArea, calculatedArea));
  }
  exactTs.push(1.0);
  
  heirsData.forEach((h, idx) => {
    const tPrev = exactTs[idx];
    const tCurr = exactTs[idx + 1];
    const realSides = getPieceRealSides(tPrev, tCurr);
    h.topW = realSides.top;
    h.botW = realSides.bottom;
    h.leftL = realSides.left;
    h.rightL = realSides.right;
  });
}

// Circle intersection helper
function intersectCircles(x1, y1, r1, x2, y2, r2) {
  const d = Math.hypot(x2 - x1, y2 - y1);
  if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) return null;
  
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
  
  const x_p = x1 + (a * (x2 - x1)) / d;
  const y_p = y1 + (a * (y2 - y1)) / d;
  
  return [
    {
      x: x_p + (h * (y2 - y1)) / d,
      y: y_p - (h * (x2 - x1)) / d
    },
    {
      x: x_p - (h * (y2 - y1)) / d,
      y: y_p + (h * (x2 - x1)) / d
    }
  ];
}

// Geometry Engine for Division
function solveDepthForArea(S, Top, Bottom, H) {
  if (H <= 0) return 0;
  let b = Top;
  let c = (Bottom - Top) / (2 * H);
  
  if (Math.abs(c) < 0.0001) {
    return S / b;
  } else {
    let discriminant = b * b + 4 * c * S;
    if (discriminant < 0) return 0;
    let y1 = (-b + Math.sqrt(discriminant)) / (2 * c);
    let y2 = (-b - Math.sqrt(discriminant)) / (2 * c);
    return (y1 >= 0 && y1 <= H + 0.1) ? y1 : y2;
  }
}

// Canvas Drawer
function drawLandCanvas(vertices) {
  // 1. Calculate shape aspect ratio
  let shapeRatio = 1.5; // Default ratio
  if (vertices && vertices.length >= 3) {
    const xs = vertices.map(v => v.x);
    const ys = vertices.map(v => v.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const dx = maxX - minX || 1;
    const dy = maxY - minY || 1;
    shapeRatio = dx / dy;
  }
  
  // 2. Resolve CSS dimensions based on shape aspect ratio (clamp between 0.45 and 2.2)
  let targetWidth = 800; // Safe default for printing/fallback
  
  let targetRatio = shapeRatio;
  let targetHeight;

  if (window.isExportingAsImage) {
    if (shapeRatio >= 1) {
       targetHeight = 1600;
       targetWidth = 1600 * shapeRatio;
    } else {
       targetWidth = 1600;
       targetHeight = 1600 / shapeRatio;
    }
    // Set ratio exactly to shapeRatio so it fills perfectly
    targetRatio = shapeRatio;
    // Add generous padding to avoid cutoffs and leave a nice white margin for printing
    targetWidth += 400;
    targetHeight += 400;
  } else {
    const wrapper = canvas.parentElement;
    if (wrapper) {
      const rect = wrapper.getBoundingClientRect();
      const availableWidth = rect.width - 24;
      if (availableWidth > 100) {
        targetWidth = availableWidth;
      }
    }
    
    targetRatio = Math.max(0.45, Math.min(2.2, shapeRatio));
    targetHeight = targetWidth / targetRatio;
    
    // Limit height to keep it on a single printed page, and visually pleasant on screen
    const maxHeight = isPrinting ? 800 : 650;
    if (targetHeight > maxHeight) {
      targetHeight = maxHeight;
      targetWidth = targetHeight * targetRatio;
    }
    targetHeight = Math.max(280, targetHeight);
  }
  
  const dpr = isPrinting || window.isExportingAsImage ? 2.0 : (window.devicePixelRatio || 1);
  const newWidth = Math.round(targetWidth);
  const newHeight = Math.round(targetHeight);
  
  if (canvas.width !== newWidth * dpr || canvas.height !== newHeight * dpr) {
    canvas.width = newWidth * dpr;
    canvas.height = newHeight * dpr;
    canvas.style.width = newWidth + "px";
    canvas.style.height = newHeight + "px";
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
  }

  const cssW = canvas.width / dpr;
  const cssH = canvas.height / dpr;

  // Clear canvas physical dimensions
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Dynamic scale multiplier based on canvas CSS width (stable and doesn't scale with zoomFactor)
  const scaleMultiplier = Math.max(0.7, cssW / 600);
  
  // الشبكة الخلفية تم إزالتها بناءً على طلب المستخدم

  if (!vertices || vertices.length < 3) {
    // Draw placeholder message
    ctx.fillStyle = "#888888";
    ctx.font = "bold " + Math.round(15 * scaleMultiplier) + "px Cairo";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("أدخل أبعاد الأرض الصحيحة لرسم الكروكي", cssW / 2, cssH / 2);
    return;
  }

  // Get visually stretched vertices if aspect ratio is extreme
  const visualVertices = getVisualVertices(vertices);

  // 2. Scale and Fit visual vertices inside Canvas bounding box (85% to 90% footprint, with extra space for printing)
  const margin = isPrinting ? 110 : Math.max(50, Math.min(60 * scaleMultiplier, 80));
  const drawW = cssW - 2 * margin;
  const drawH = cssH - 2 * margin;

  const xs = visualVertices.map(v => v.x);
  const ys = visualVertices.map(v => v.y);
  
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const dx = maxX - minX || 1;
  const dy = maxY - minY || 1;

  const scale = Math.min(drawW / dx, drawH / dy) * zoomFactor;

  // Transform coordinates to canvas space
  const canvasPoints = visualVertices.map(v => {
    return {
      x: margin + (v.x - minX) * scale + (drawW - dx * scale) / 2,
      // Invert Y because canvas goes down, math coordinates go up
      y: cssH - (margin + (v.y - minY) * scale + (drawH - dy * scale) / 2)
    };
  });

  currentCanvasPoints = canvasPoints;

  // 3. Draw Polygon shape
  ctx.fillStyle = "rgba(46, 125, 50, 0.06)";
  ctx.strokeStyle = "#2e7d32";
  ctx.lineWidth = Math.max(3, 4.5 * scaleMultiplier);
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
  for (let i = 1; i < canvasPoints.length; i++) {
    ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 4. Draw vertices/corners circles
  ctx.fillStyle = "#1b5e20";
  canvasPoints.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(3.5, 5.5 * scaleMultiplier), 0, 2 * Math.PI);
    ctx.fill();
  });

  // 5. Draw side dimension labels with measurement lines
  const numVertices = vertices.length;
  for (let i = 0; i < numVertices; i++) {
    const p1 = vertices[i];
    const p2 = vertices[(i + 1) % numVertices];

    const cp1 = canvasPoints[i];
    const cp2 = canvasPoints[(i + 1) % numVertices];

    // Compute real side length in meters
    let len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    if (activeShape === 'trapezoid' && !showActualDims) {
      if (i === 1 || i === 3) {
        len = parseFloat(document.getElementById('trap-height')?.value) || 0;
      }
    }

    // Edge vector and length in canvas space
    const vx = cp2.x - cp1.x;
    const vy = cp2.y - cp1.y;
    const edgeLen = Math.hypot(vx, vy) || 1;

    // Unit edge vector
    const ux = vx / edgeLen;
    const uy = vy / edgeLen;

    // Outward normal (perpendicular to edge)
    const nx = -uy;
    const ny = ux;

    // Check which side is outward by testing against centroid
    const centX = canvasPoints.reduce((s, p) => s + p.x, 0) / numVertices;
    const centY = canvasPoints.reduce((s, p) => s + p.y, 0) / numVertices;
    const midX = (cp1.x + cp2.x) / 2;
    const midY = (cp1.y + cp2.y) / 2;

    // Dot product of normal with vector from mid to centroid
    const toCentX = centX - midX;
    const toCentY = centY - midY;
    const dot = nx * toCentX + ny * toCentY;
    // If dot > 0, normal points inward; flip it
    const outNx = dot > 0 ? -nx : nx;
    const outNy = dot > 0 ? -ny : ny;

    // Dynamic offset distance from edge to label line
    const offset = Math.max(18, 25 * scaleMultiplier);

    // Dimension line endpoints (offset from edge)
    const dlX1 = cp1.x + outNx * offset;
    const dlY1 = cp1.y + outNy * offset;
    const dlX2 = cp2.x + outNx * offset;
    const dlY2 = cp2.y + outNy * offset;

    // Draw extension lines (from vertex to dimension line)
    ctx.strokeStyle = "rgba(46, 125, 50, 0.55)";
    ctx.lineWidth = Math.max(1, 1.2 * scaleMultiplier);
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(cp1.x + outNx * 5, cp1.y + outNy * 5);
    ctx.lineTo(dlX1, dlY1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cp2.x + outNx * 5, cp2.y + outNy * 5);
    ctx.lineTo(dlX2, dlY2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw the dimension line itself
    ctx.strokeStyle = "#2e7d32";
    ctx.lineWidth = Math.max(1.2, 1.6 * scaleMultiplier);
    ctx.beginPath();
    ctx.moveTo(dlX1, dlY1);
    ctx.lineTo(dlX2, dlY2);
    ctx.stroke();

    // Tick marks at both ends
    const tickLen = Math.max(4, 6 * scaleMultiplier);
    const perpX = outNx;
    const perpY = outNy;
    ctx.lineWidth = Math.max(1.5, 2 * scaleMultiplier);
    ctx.beginPath();
    ctx.moveTo(dlX1 - perpX * tickLen / 2, dlY1 - perpY * tickLen / 2);
    ctx.lineTo(dlX1 + perpX * tickLen / 2, dlY1 + perpY * tickLen / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(dlX2 - perpX * tickLen / 2, dlY2 - perpY * tickLen / 2);
    ctx.lineTo(dlX2 + perpX * tickLen / 2, dlY2 + perpY * tickLen / 2);
    ctx.stroke();

    // Label position: middle of the dimension line, pushed out a bit more
    const labelX = (dlX1 + dlX2) / 2 + outNx * Math.max(8, 12 * scaleMultiplier);
    const labelY = (dlY1 + dlY2) / 2 + outNy * Math.max(8, 12 * scaleMultiplier);

    // Compute text rotation angle
    let angle = Math.atan2(vy, vx);
    // Keep text readable (flip if upside down)
    if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
      angle += Math.PI;
    }

    const labelText = `${len.toFixed(2)} م`;

    ctx.save();
    ctx.translate(labelX, labelY);
    ctx.rotate(angle);

    // White background for readability
    const fontSize = Math.round(Math.max(10, 13 * scaleMultiplier));
    ctx.font = `bold ${fontSize}px Cairo`;
    const tw = ctx.measureText(labelText).width;
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.fillRect(-tw / 2 - 4 * scaleMultiplier, -fontSize / 2 - 2, tw + 8 * scaleMultiplier, fontSize + 4);

    // Draw text
    ctx.fillStyle = "#1b5e20";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(labelText, 0, 1);
    ctx.restore();
  }

  // 6. Draw Division lines, piece info, and side dimensions
  if (isDivisionActive && heirsData.length > 0 && calculatedArea > 0 && canvasPoints.length >= 4) {
    const caratSize = parseFloat(caratSizeInput.value) || 168;
    
    // Reset divider handles array
    dividerHandles = [];

    // Get land side lengths for geometry engine
    let landTop = 0, landBottom = 0, landLeft = 0, landRight = 0;
    if (activeShape === 'rectangle') {
      landLeft = parseFloat(document.getElementById('rect-length')?.value) || 0;
      landTop = parseFloat(document.getElementById('rect-width')?.value) || 0;
      landBottom = landTop; landRight = landLeft;
    } else if (activeShape === 'square') {
      let s = parseFloat(document.getElementById('square-side')?.value) || 0;
      landTop = s; landBottom = s; landLeft = s; landRight = s;
    } else if (activeShape === 'trapezoid') {
      landBottom = parseFloat(document.getElementById('trap-base-major')?.value) || 0;
      landTop = parseFloat(document.getElementById('trap-base-minor')?.value) || 0;
      let h = parseFloat(document.getElementById('trap-height')?.value) || 0;
      landLeft = h; landRight = h;
    } else if (activeShape === 'quadrilateral') {
      landBottom = parseFloat(document.getElementById('quad-side-a')?.value) || 0;
      landLeft = parseFloat(document.getElementById('quad-side-b')?.value) || 0;
      landTop = parseFloat(document.getElementById('quad-side-c')?.value) || 0;
      landRight = parseFloat(document.getElementById('quad-side-d')?.value) || 0;
    }
    
    const W = (landTop + landBottom) / 2;

    // Canvas corners (from visual canvas points)
    const cpA = canvasPoints[0]; // bottom-left
    const cpB = canvasPoints[1]; // bottom-right
    const cpC = canvasPoints[2]; // top-right
    const cpD = canvasPoints[3]; // top-left

    // Ensure all heirs have their exact area-based widths computed
    if (heirsData.some(h => h.topW === undefined || h.botW === undefined || isNaN(h.topW) || isNaN(h.botW))) {
      recalculateHeirsDimensions();
    }

    // Calculate cumulative t values for top and bottom sides separately
    let cumTop = 0;
    const splitTsTop = [0];
    heirsData.forEach((h, idx) => {
      cumTop += h.topW || 0;
      let t = landTop > 0 ? cumTop / landTop : (idx + 1) / heirsData.length;
      t = Math.max(0, Math.min(1, t));
      splitTsTop.push(t);
    });
    splitTsTop[splitTsTop.length - 1] = 1.0;

    let cumBot = 0;
    const splitTsBot = [0];
    heirsData.forEach((h, idx) => {
      cumBot += h.botW || 0;
      let t = landBottom > 0 ? cumBot / landBottom : (idx + 1) / heirsData.length;
      t = Math.max(0, Math.min(1, t));
      splitTsBot.push(t);
    });
    splitTsBot[splitTsBot.length - 1] = 1.0;

    // Draw each piece
    for (let i = 0; i < heirsData.length; i++) {
      const tPrevTop = splitTsTop[i];
      const tCurrTop = splitTsTop[i + 1];
      const tPrevBot = splitTsBot[i];
      const tCurrBot = splitTsBot[i + 1];
      
      const heir = heirsData[i];
      if (!heir) continue;

      // Canvas coordinates for vertical slice (interpolated separately along the top and bottom sides)
      const cpTopPrev    = { x: cpD.x + tPrevTop * (cpC.x - cpD.x), y: cpD.y + tPrevTop * (cpC.y - cpD.y) };
      const cpBottomPrev = { x: cpA.x + tPrevBot * (cpB.x - cpA.x), y: cpA.y + tPrevBot * (cpB.y - cpA.y) };
      const cpTopCurr    = { x: cpD.x + tCurrTop * (cpC.x - cpD.x), y: cpD.y + tCurrTop * (cpC.y - cpD.y) };
      const cpBottomCurr = { x: cpA.x + tCurrBot * (cpB.x - cpA.x), y: cpA.y + tCurrBot * (cpB.y - cpA.y) };

      // Use exact physical side lengths
      const pieceTopW = heir.topW || 0;
      const pieceBotW = heir.botW || 0;
      const pieceLeftL = heir.leftL || 0;
      const pieceRightL = heir.rightL || 0;

      // Save to heirsData for table display
      heir.leftL = pieceLeftL;
      heir.rightL = pieceRightL;

      // Draw slice background fill
      ctx.fillStyle = (i % 2 === 0) ? "rgba(46, 125, 50, 0.08)" : "rgba(46, 125, 50, 0.02)";
      ctx.beginPath();
      ctx.moveTo(cpTopPrev.x, cpTopPrev.y);
      ctx.lineTo(cpTopCurr.x, cpTopCurr.y);
      ctx.lineTo(cpBottomCurr.x, cpBottomCurr.y);
      ctx.lineTo(cpBottomPrev.x, cpBottomPrev.y);
      ctx.closePath();
      ctx.fill();

      // Draw dashed divider line (between pieces, not at start/end)
      if (i > 0) {
        ctx.strokeStyle = "#0288d1";
        ctx.lineWidth = Math.max(2, 3.5 * scaleMultiplier);
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(cpTopPrev.x, cpTopPrev.y);
        ctx.lineTo(cpBottomPrev.x, cpBottomPrev.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Slice Centroid for info badge
      const centroidX = (cpTopPrev.x + cpTopCurr.x + cpBottomPrev.x + cpBottomCurr.x) / 4;
      const centroidY = (cpTopPrev.y + cpTopCurr.y + cpBottomPrev.y + cpBottomCurr.y) / 4;

      const heirConv = convertSqmToFeddans(heir.share, caratSize);
      
      ctx.save();
      ctx.translate(centroidX, centroidY);
      ctx.rotate(-Math.PI / 2);

      const badgeFontSize = Math.round(Math.max(10, 13 * scaleMultiplier));
      ctx.font = `bold ${badgeFontSize}px Cairo`;

      const labelName = `${i + 1}- ${heir.name}`;
      const labelArea = `${heir.share.toFixed(2)} م²`;
      
      const nameW = ctx.measureText(labelName).width;
      const areaW = ctx.measureText(labelArea).width;
      const maxW = Math.max(nameW, areaW);
      
      const boxW = maxW + 12 * scaleMultiplier;
      const boxH = Math.max(36, 42 * scaleMultiplier);

      // White background box for readability
      ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
      ctx.strokeStyle = "rgba(46, 125, 50, 0.25)";
      ctx.lineWidth = Math.max(1, 1.5 * scaleMultiplier);
      
      ctx.beginPath();
      ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 4 * scaleMultiplier);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Line 1: Piece name
      ctx.fillStyle = "#333";
      ctx.fillText(labelName, 0, -9 * scaleMultiplier);
      
      // Line 2: Area
      ctx.fillStyle = "#01579b";
      ctx.fillText(labelArea, 0, 9 * scaleMultiplier);

      ctx.restore();

      // Draw side length labels on the edges
      ctx.font = "bold " + Math.round(Math.max(9, 12 * scaleMultiplier)) + "px Cairo";
      
      // Top width of piece
      ctx.fillStyle = "#d32f2f";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${pieceTopW.toFixed(2)}`, (cpTopPrev.x + cpTopCurr.x) / 2, (cpTopPrev.y + cpTopCurr.y) / 2 - 8 * scaleMultiplier);
      
      // Bottom width
      ctx.fillText(`${pieceBotW.toFixed(2)}`, (cpBottomPrev.x + cpBottomCurr.x) / 2, (cpBottomPrev.y + cpBottomCurr.y) / 2 + 12 * scaleMultiplier);
      
      // Left side length (only first piece shows left edge label, drawn at 0.25 from top with white bg and left alignment)
      if (i === 0) {
        const lx = cpTopPrev.x + 0.25 * (cpBottomPrev.x - cpTopPrev.x);
        const ly = cpTopPrev.y + 0.25 * (cpBottomPrev.y - cpTopPrev.y);
        // إذا كان شبه منحرف مبسط بدون خيار الأبعاد الهندسية: أظهر الطول الثابت
        const leftLabelVal = (activeShape === 'trapezoid' && !showActualDims)
          ? landLeft  // الطول الثابت (الارتفاع) الذي أدخله المستخدم
          : pieceLeftL;
        const labelTextLeft = `${leftLabelVal.toFixed(2)} م`;
        ctx.font = "bold " + Math.round(Math.max(9, 11 * scaleMultiplier)) + "px Cairo";
        const twLeft = ctx.measureText(labelTextLeft).width;
        
        ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
        ctx.fillRect(lx + 4 * scaleMultiplier, ly - 8 * scaleMultiplier, twLeft + 6 * scaleMultiplier, 16 * scaleMultiplier);
        
        ctx.fillStyle = "#1b5e20";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(labelTextLeft, lx + 7 * scaleMultiplier, ly);
      }
      
      // Right side length (drawn at 0.25 from top with white bg and right alignment next to divider)
      {
        const rx = cpTopCurr.x + 0.25 * (cpBottomCurr.x - cpTopCurr.x);
        const ry = cpTopCurr.y + 0.25 * (cpBottomCurr.y - cpTopCurr.y);
        // إذا كان شبه منحرف مبسط بدون خيار الأبعاد الهندسية: أظهر الطول الثابت
        const rightLabelVal = (activeShape === 'trapezoid' && !showActualDims)
          ? landRight  // الطول الثابت (الارتفاع) الذي أدخله المستخدم
          : pieceRightL;
        const labelTextRight = `${rightLabelVal.toFixed(2)} م`;
        ctx.font = "bold " + Math.round(Math.max(9, 11 * scaleMultiplier)) + "px Cairo";
        const twRight = ctx.measureText(labelTextRight).width;
        
        ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
        ctx.fillRect(rx - 4 * scaleMultiplier - twRight - 6 * scaleMultiplier, ry - 8 * scaleMultiplier, twRight + 6 * scaleMultiplier, 16 * scaleMultiplier);
        
        ctx.fillStyle = "#1b5e20";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(labelTextRight, rx - 7 * scaleMultiplier, ry);
      }


      // Draw handle for dragging vertical dividers (between slices)
      if (i > 0) {
        const hX = (cpTopPrev.x + cpBottomPrev.x) / 2;
        const hY = (cpTopPrev.y + cpBottomPrev.y) / 2;
        
        ctx.beginPath();
        ctx.arc(hX, hY, Math.max(5, 7.5 * scaleMultiplier), 0, Math.PI * 2);
        ctx.fillStyle = '#388e3c';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = Math.max(1.5, 2 * scaleMultiplier);
        ctx.stroke();
        
        dividerHandles.push({
          index: i,
          x: hX,
          y: hY,
          topX: cpTopPrev.x,
          topY: cpTopPrev.y,
          botX: cpBottomPrev.x,
          botY: cpBottomPrev.y
        });
      }
    }
  }
}

// Generate heirs input rows
function generateHeirsTable() {
  const count = parseInt(heirsCountInput.value) || 1;
  const caratSize = parseFloat(caratSizeInput.value) || 168;
  heirsListTbody.innerHTML = "";
  
  // Re-build heirsData array keeping names if possible
  const oldHeirs = [...heirsData];
  heirsData = [];
  
  const equalShare = calculatedArea / count;
  const dims = getLandDimensions();

  for (let i = 0; i < count; i++) {
    const defaultName = `الوارث ${i + 1}`;
    const name = (oldHeirs[i] && oldHeirs[i].name) ? oldHeirs[i].name : defaultName;
    const share = (oldHeirs[i] && oldHeirs[i].share > 0 && oldHeirs.length === count) ? oldHeirs[i].share : equalShare;
    
    heirsData.push({
      name: name,
      share: share,
      topW: (share / (calculatedArea || 1)) * dims.landTop,
      botW: (share / (calculatedArea || 1)) * dims.landBottom
    });
  }

  renderHeirsRows();
  updateHeirsDistribution();
  calculateAll();
}

// Called on every keystroke in heirs inputs - updates instantly
function debouncedUpdateHeirShare(idx, type, newValString) {
  const newVal = parseFloat(newValString) || 0;
  updateHeirShare(idx, type, newVal);
}

function commitHeirShareImmediately(idx, type, newValString) {
  const newVal = parseFloat(newValString) || 0;
  updateHeirShare(idx, type, newVal);
}

// Helper to get total land dimensions based on shape
function getLandDimensions() {
  let landTop = 0, landBottom = 0;
  if (activeShape === 'rectangle') {
    landTop = parseFloat(document.getElementById('rect-width')?.value) || 0;
    landBottom = landTop;
  } else if (activeShape === 'square') {
    let s = parseFloat(document.getElementById('square-side')?.value) || 0;
    landTop = s; landBottom = s;
  } else if (activeShape === 'trapezoid') {
    landBottom = parseFloat(document.getElementById('trap-base-major')?.value) || 0;
    landTop = parseFloat(document.getElementById('trap-base-minor')?.value) || 0;
  } else if (activeShape === 'quadrilateral') {
    landBottom = parseFloat(document.getElementById('quad-side-a')?.value) || 0;
    landTop = parseFloat(document.getElementById('quad-side-c')?.value) || 0;
  }
  return { landTop, landBottom };
}

// Update side widths manually with constant area conservation
function updateHeirSide(idx, sideStr, valStr) {
  const newVal = parseFloat(valStr) || 0;
  if (!heirsData[idx]) return;
  
  if (sideStr === 'topW' || sideStr === 'botW') {
    const oldVal = heirsData[idx][sideStr] || 0;
    const diff = newVal - oldVal;
    if (diff === 0) return;
    
    const otherSideStr = (sideStr === 'topW') ? 'botW' : 'topW';
    const oldOtherVal = heirsData[idx][otherSideStr] || 0;
    const sum = oldVal + oldOtherVal;
    
    let actualDiff = diff;
    if (diff > 0) {
      actualDiff = Math.min(diff, oldOtherVal);
    } else {
      actualDiff = -Math.min(-diff, oldVal);
    }
    
    if (actualDiff === 0) {
      renderHeirsRows();
      return;
    }
    
    heirsData[idx][sideStr] = oldVal + actualDiff;
    heirsData[idx][otherSideStr] = oldOtherVal - actualDiff;
    
    // Distribute opposite change to target to maintain total widths
    const targetSelect = document.getElementById(`offset-dest-${idx}`);
    const targetVal = targetSelect ? targetSelect.value : 'all';
    
    if (targetVal === 'all') {
      const otherHeirs = heirsData.filter((_, i) => i !== idx);
      if (otherHeirs.length > 0) {
        const shareDiff = actualDiff / otherHeirs.length;
        otherHeirs.forEach(h => {
          h[sideStr] = Math.max(0, (h[sideStr] || 0) - shareDiff);
          h[otherSideStr] = Math.max(0, (h[otherSideStr] || 0) + shareDiff);
        });
      }
    } else {
      const tIdx = parseInt(targetVal);
      if (heirsData[tIdx]) {
        const targetOldVal = heirsData[tIdx][sideStr] || 0;
        const targetActualDiff = Math.min(actualDiff, targetOldVal);
        
        heirsData[tIdx][sideStr] = targetOldVal - targetActualDiff;
        heirsData[tIdx][otherSideStr] = (heirsData[tIdx][otherSideStr] || 0) + targetActualDiff;
        
        if (targetActualDiff !== actualDiff) {
          heirsData[idx][sideStr] = oldVal + targetActualDiff;
          heirsData[idx][otherSideStr] = oldOtherVal - targetActualDiff;
        }
      }
    }
    
    saveStateToSession();
    calculateAll();
  }
}

function debouncedUpdateHeirSplitShare(idx, unitType, newValString) {
  let newVal = parseFloat(newValString) || 0;
  if (unitType === 'carat' || unitType === 'feddan') {
    newVal = parseInt(newValString) || 0;
  }
  updateHeirSplitShare(idx, unitType, newVal);
}

function commitHeirSplitShareImmediately(idx, unitType, newValString) {
  let newVal = parseFloat(newValString) || 0;
  if (unitType === 'carat' || unitType === 'feddan') {
    newVal = parseInt(newValString) || 0;
  }
  updateHeirSplitShare(idx, unitType, newVal);
}

function updateHeirsUI() {
  const caratSize = parseFloat(caratSizeInput.value) || 168;
  const showHeightOnly = (activeShape === 'trapezoid' && !showActualDims);
  const trapHeight = showHeightOnly
    ? (parseFloat(document.getElementById('trap-height')?.value) || 0)
    : 0;
  
  heirsData.forEach((heir, idx) => {
    const row = heirsListTbody.querySelector(`tr[data-index="${idx}"]`);
    if (!row) return;
    
    const conv = convertSqmToFeddans(heir.share, caratSize);
    
    const inputName = row.querySelector('.heir-name');
    const inputSqm = row.querySelector('.heir-share-sqm');
    const inputSahm = row.querySelector('.heir-share-sahm');
    const inputCarat = row.querySelector('.heir-share-carat');
    const inputFeddan = row.querySelector('.heir-share-feddan');

    const inputTop = row.querySelector('.heir-side-top');
    const inputBot = row.querySelector('.heir-side-bot');
    const inputRight = row.querySelector('.heir-side-right');
    const inputLeft = row.querySelector('.heir-side-left');
    const inputHeight = row.querySelector('.heir-side-height');

    if (inputName && document.activeElement !== inputName) {
      inputName.value = heir.name;
    }
    if (inputSqm && document.activeElement !== inputSqm) {
      inputSqm.value = heir.share.toFixed(2);
    }
    if (inputSahm && document.activeElement !== inputSahm) {
      inputSahm.value = conv.shares.toFixed(2);
    }
    if (inputCarat && document.activeElement !== inputCarat) {
      inputCarat.value = conv.carats;
    }
    if (inputFeddan && document.activeElement !== inputFeddan) {
      inputFeddan.value = conv.feddans;
    }
    
    // Update sides if they exist
    if (inputTop && document.activeElement !== inputTop) inputTop.value = (heir.topW || 0).toFixed(2);
    if (inputBot && document.activeElement !== inputBot) inputBot.value = (heir.botW || 0).toFixed(2);
    if (inputRight && document.activeElement !== inputRight) inputRight.value = (heir.rightL || 0).toFixed(2);
    if (inputLeft && document.activeElement !== inputLeft) inputLeft.value = (heir.leftL || 0).toFixed(2);
    // تحديث عمود الطول الثابت (في وضع المبسط)
    if (inputHeight && document.activeElement !== inputHeight) inputHeight.value = trapHeight.toFixed(2);
  });
}

function renderHeirsRows() {
  const caratSize = parseFloat(caratSizeInput.value) || 168;
  
  // Sides are calculated inside drawLandCanvas which is called by calculateAll
  
  // هل نعرض عمود الطول الثابت (للمبسط) أم عمودي يمين/يسار؟
  const showHeightOnly = (activeShape === 'trapezoid' && !showActualDims);
  // الطول الثابت الذي أدخله المستخدم
  const trapHeight = showHeightOnly
    ? (parseFloat(document.getElementById('trap-height')?.value) || 0)
    : 0;

  heirsListTbody.innerHTML = "";

  heirsData.forEach((heir, idx) => {
    const conv = convertSqmToFeddans(heir.share, caratSize);
    
    // Build select dropdown option for other heirs
    let optionsHtml = `<option value="all">باقي الورثة بالتساوي</option>`;
    heirsData.forEach((oth, oIdx) => {
      if (oIdx !== idx) {
        optionsHtml += `<option value="${oIdx}">${oth.name}</option>`;
      }
    });

    // عمودا يمين/يسار: إما عمود "الطول" الواحد (colspan=2) أو عمودين مستقلين
    let sidesCells = '';
    if (showHeightOnly) {
      // عمود واحد: الطول الثابت (colspan=2 ليتوافق مع رأس الجدول)
      sidesCells = `
        <td colspan="2" style="text-align:center;">
          <input type="number" step="any" inputmode="decimal" class="heir-side-height" style="width:75px; background-color: #f1f3f4; cursor: default;" value="${trapHeight.toFixed(2)}" readonly />
        </td>`;
    } else {
      // عمودان: يمين ويسار (الأضلاع المائلة الهندسية)
      sidesCells = `
        <td>
          <input type="number" step="any" inputmode="decimal" class="heir-side-right" style="width:60px; background-color: #f1f3f4; cursor: default;" value="${(heir.rightL || 0).toFixed(2)}" readonly />
        </td>
        <td>
          <input type="number" step="any" inputmode="decimal" class="heir-side-left" style="width:60px; background-color: #f1f3f4; cursor: default;" value="${(heir.leftL || 0).toFixed(2)}" readonly />
        </td>`;
    }

    heirsListTbody.innerHTML += `
      <tr data-index="${idx}">
        <td>
          <input type="text" class="heir-name" value="${heir.name}" onchange="updateHeirName(${idx}, this.value)" />
        </td>
        <td>
          <input type="number" step="any" inputmode="decimal" class="heir-side-top" style="width:65px;" value="${(heir.topW || 0).toFixed(2)}" 
            oninput="updateHeirSide(${idx}, 'topW', this.value)" />
        </td>
        <td>
          <input type="number" step="any" inputmode="decimal" class="heir-side-bot" style="width:65px;" value="${(heir.botW || 0).toFixed(2)}" 
            oninput="updateHeirSide(${idx}, 'botW', this.value)" />
        </td>
        ${sidesCells}
        <td>
          <input type="number" step="any" inputmode="decimal" class="heir-share heir-share-sqm" value="${heir.share.toFixed(2)}" 
            oninput="debouncedUpdateHeirShare(${idx}, 'sqm', this.value)" 
            onblur="commitHeirShareImmediately(${idx}, 'sqm', this.value)" 
            onkeydown="if(event.key === 'Enter') { commitHeirShareImmediately(${idx}, 'sqm', this.value); this.blur(); }" />
        </td>
        <td>
          <input type="number" step="any" inputmode="decimal" class="heir-share heir-share-sahm" value="${conv.shares.toFixed(2)}" 
            oninput="debouncedUpdateHeirSplitShare(${idx}, 'sahm', this.value)" 
            onblur="commitHeirSplitShareImmediately(${idx}, 'sahm', this.value)" 
            onkeydown="if(event.key === 'Enter') { commitHeirSplitShareImmediately(${idx}, 'sahm', this.value); this.blur(); }" />
        </td>
        <td>
          <input type="number" inputmode="decimal" class="heir-share heir-share-carat" value="${conv.carats}" 
            oninput="debouncedUpdateHeirSplitShare(${idx}, 'carat', this.value)" 
            onblur="commitHeirSplitShareImmediately(${idx}, 'carat', this.value)" 
            onkeydown="if(event.key === 'Enter') { commitHeirSplitShareImmediately(${idx}, 'carat', this.value); this.blur(); }" />
        </td>
        <td>
          <input type="number" inputmode="decimal" class="heir-share heir-share-feddan" value="${conv.feddans}" 
            oninput="debouncedUpdateHeirSplitShare(${idx}, 'feddan', this.value)" 
            onblur="commitHeirSplitShareImmediately(${idx}, 'feddan', this.value)" 
            onkeydown="if(event.key === 'Enter') { commitHeirSplitShareImmediately(${idx}, 'feddan', this.value); this.blur(); }" />
        </td>
        <td>
          <select class="heir-offset" id="offset-dest-${idx}">
            ${optionsHtml}
          </select>
        </td>
      </tr>
    `;
  });
}


function updateHeirName(idx, value) {
  if (heirsData[idx]) {
    heirsData[idx].name = value;
    saveStateToSession();
    // Re-render only to update options dropdowns
    renderHeirsRows();
    calculateAll();
  }
}

// Triggered when a user types in a share directly
function updateHeirShare(idx, type, newVal) {
  if (calculatedArea <= 0) return;
  if (heirsData.length === 1) {
    alert("عند وجود شريك واحد فقط، يجب أن تكون حصته مساوية لمساحة الأرض الكلية.");
    renderHeirsRows();
    return;
  }
  const oldVal = heirsData[idx].share;
  const diff = newVal - oldVal;
  
  if (newVal < 0 || newVal > calculatedArea) {
    alert("الحصة المدخلة غير مسموح بها (يجب أن تكون بين 0 ومساحة الأرض الكلية).");
    renderHeirsRows();
    return;
  }

  applyShareDiff(idx, diff);
}

// Triggered when editing split shares (Feddan, Carat, Sahm)
function updateHeirSplitShare(idx, unitType, newVal) {
  if (calculatedArea <= 0) return;
  if (heirsData.length === 1) {
    alert("عند وجود شريك واحد فقط، يجب أن تكون حصته مساوية لمساحة الأرض الكلية.");
    renderHeirsRows();
    return;
  }
  const caratSize = parseFloat(caratSizeInput.value) || 168;
  const currentConv = convertSqmToFeddans(heirsData[idx].share, caratSize);
  
  // Calculate new target sqm for this heir
  let newFeddans = currentConv.feddans;
  let newCarats = currentConv.carats;
  let newShares = currentConv.shares;

  if (unitType === 'feddan') newFeddans = newVal;
  if (unitType === 'carat') newCarats = newVal;
  if (unitType === 'sahm') newShares = newVal;

  const targetSqm = (newFeddans * 24 * caratSize) + (newCarats * caratSize) + (newShares * caratSize / 24);
  const diff = targetSqm - heirsData[idx].share;

  if (targetSqm < 0 || targetSqm > calculatedArea) {
    alert("الحصة المدخلة غير مسموح بها (يجب أن تكون بين 0 ومساحة الأرض الكلية).");
    renderHeirsRows();
    return;
  }

  applyShareDiff(idx, diff);
}

// Math redistribution logic for sharing differences
function applyShareDiff(idx, diff) {
  const destSelect = document.getElementById(`offset-dest-${idx}`).value;
  
  if (destSelect === "all") {
    // Distribute among all other heirs equally
    const othersCount = heirsData.length - 1;
    if (othersCount > 0) {
      const shareAdjustment = -diff / othersCount;
      
      // Safety validation first
      let valid = true;
      heirsData.forEach((h, oIdx) => {
        if (oIdx !== idx && (h.share + shareAdjustment < 0)) {
          valid = false;
        }
      });

      if (!valid) {
        alert("فشل التعديل: التعديل سيؤدي لحصة سالبة لأحد الورثة. يرجى اختيار جهة خصم مخصصة.");
        renderHeirsRows();
        return;
      }

      heirsData[idx].share += diff;
      heirsData.forEach((h, oIdx) => {
        if (oIdx !== idx) {
          h.share += shareAdjustment;
        }
      });
    }
  } else {
    // Offset from a specific heir
    const targetIdx = parseInt(destSelect);
    if (heirsData[targetIdx]) {
      const targetOldShare = heirsData[targetIdx].share;
      if (targetOldShare - diff < 0) {
        alert(`فشل التعديل: لا توجد مساحة كافية للخصم من ${heirsData[targetIdx].name}.`);
        renderHeirsRows();
        return;
      }
      heirsData[idx].share += diff;
      heirsData[targetIdx].share -= diff;
    }
  }

  // Recalculate topW and botW proportionally
  const dims = getLandDimensions();
  heirsData.forEach(h => {
    h.topW = (h.share / (calculatedArea || 1)) * dims.landTop;
    h.botW = (h.share / (calculatedArea || 1)) * dims.landBottom;
  });

  saveStateToSession();
  updateHeirsUI();
  calculateAll();
}

function distributeEqually() {
  if (calculatedArea <= 0) return;
  const equalShare = calculatedArea / heirsData.length;
  const dims = getLandDimensions();
  heirsData.forEach(h => {
    h.share = equalShare;
    h.topW = (equalShare / calculatedArea) * dims.landTop;
    h.botW = (equalShare / calculatedArea) * dims.landBottom;
  });
  
  saveStateToSession();
  renderHeirsRows();
  calculateAll();
}

function updateHeirsDistribution() {
  let distributedSum = 0;
  heirsData.forEach(h => distributedSum += h.share);

  distributedAreaSpan.innerText = distributedSum.toFixed(2);
  
  const diff = Math.abs(distributedSum - calculatedArea);
  if (diff < 0.05) {
    distributionStatus.className = "status-ok";
    distributionStatus.innerText = "التوزيع متطابق 100%";
  } else {
    distributionStatus.className = "status-err";
    distributionStatus.innerText = `تنبيه: التوزيع غير متطابق! فارق المساحة: ${(calculatedArea - distributedSum).toFixed(2)} م²`;
  }
}

// Session state storage
function saveStateToSession() {
  sessionStorage.setItem("activeShape", activeShape);
  sessionStorage.setItem("caratSize", caratSizeInput.value);
  sessionStorage.setItem("priceDisplay", caratPriceDisplay.value);
  sessionStorage.setItem("priceNumeric", caratPriceNumeric.value);
  
  // Rect
  sessionStorage.setItem("rectLength", document.getElementById("rect-length").value);
  sessionStorage.setItem("rectWidth", document.getElementById("rect-width").value);
  
  // Square
  sessionStorage.setItem("squareSide", document.getElementById("square-side").value);

  // Trap
  sessionStorage.setItem("trapBaseMajor", document.getElementById("trap-base-major").value);
  sessionStorage.setItem("trapBaseMinor", document.getElementById("trap-base-minor").value);
  sessionStorage.setItem("trapHeight", document.getElementById("trap-height").value);

  // Quad
  sessionStorage.setItem("quadSideA", document.getElementById("quad-side-a").value);
  sessionStorage.setItem("quadSideB", document.getElementById("quad-side-b").value);
  sessionStorage.setItem("quadSideC", document.getElementById("quad-side-c").value);
  sessionStorage.setItem("quadSideD", document.getElementById("quad-side-d").value);
  sessionStorage.setItem("quadDiagAC", document.getElementById("quad-diag-ac").value);
  sessionStorage.setItem("quadDiagBD", document.getElementById("quad-diag-bd").value);

  // Heirs
  sessionStorage.setItem("heirsCount", heirsCountInput.value);
  sessionStorage.setItem("heirsData", JSON.stringify(heirsData));
  sessionStorage.setItem("isDivisionActive", isDivisionActive ? "true" : "false");
  sessionStorage.setItem("longPlotView", document.getElementById("long-plot-view").value);
  sessionStorage.setItem("showActualDims", showActualDims ? "true" : "false");
  
  const roundingSelect = document.getElementById("number-rounding-mode");
  if (roundingSelect) {
    sessionStorage.setItem("numberRoundingMode", roundingSelect.value);
  }
}

function loadStateFromSession() {
  activeShape = sessionStorage.getItem("activeShape") || "trapezoid";
  caratSizeInput.value = sessionStorage.getItem("caratSize") || "168";
  caratPresetSelect.value = (["168", "171.388", "175", "175.035"].includes(caratSizeInput.value)) ? caratSizeInput.value : "custom";
  
  caratPriceDisplay.value = sessionStorage.getItem("priceDisplay") || "";
  caratPriceNumeric.value = sessionStorage.getItem("priceNumeric") || "";

  // Set active card UI
  shapeCards.forEach(card => {
    if (card.getAttribute("data-shape") === activeShape) {
      card.classList.add("active");
    } else {
      card.classList.remove("active");
    }
  });

  // Set inputs group UI
  inputsGroups.forEach(group => {
    if (group.id === `inputs-${activeShape}`) {
      group.classList.add("active");
    } else {
      group.classList.remove("active");
    }
  });

  // Restore fields
  document.getElementById("rect-length").value = sessionStorage.getItem("rectLength") || "";
  document.getElementById("rect-width").value = sessionStorage.getItem("rectWidth") || "";

  document.getElementById("square-side").value = sessionStorage.getItem("squareSide") || "";

  document.getElementById("trap-base-major").value = sessionStorage.getItem("trapBaseMajor") || "";
  document.getElementById("trap-base-minor").value = sessionStorage.getItem("trapBaseMinor") || "";
  document.getElementById("trap-height").value = sessionStorage.getItem("trapHeight") || "";

  document.getElementById("quad-side-a").value = sessionStorage.getItem("quadSideA") || "";
  document.getElementById("quad-side-b").value = sessionStorage.getItem("quadSideB") || "";
  document.getElementById("quad-side-c").value = sessionStorage.getItem("quadSideC") || "";
  document.getElementById("quad-side-d").value = sessionStorage.getItem("quadSideD") || "";
  document.getElementById("quad-diag-ac").value = sessionStorage.getItem("quadDiagAC") || "";
  document.getElementById("quad-diag-bd").value = sessionStorage.getItem("quadDiagBD") || "";

  // Division panel state
  heirsCountInput.value = sessionStorage.getItem("heirsCount") || "3";
  isDivisionActive = sessionStorage.getItem("isDivisionActive") === "true";
  
  if (isDivisionActive) {
    divisionPanel.style.display = "block";
    btnToggleDivision.classList.add("active-panel");
    const savedHeirs = sessionStorage.getItem("heirsData");
    if (savedHeirs) {
      heirsData = JSON.parse(savedHeirs);
      renderHeirsRows();
    } else {
      generateHeirsTable();
    }
  } else {
    divisionPanel.style.display = "none";
    btnToggleDivision.classList.remove("active-panel");
  }

  document.getElementById("long-plot-view").value = sessionStorage.getItem("longPlotView") || "agricultural";
  
  // استرجاع خيار الأبعاد الهندسية الفعلية
  showActualDims = sessionStorage.getItem("showActualDims") === "true";
  const checkbox = document.getElementById('show-actual-dims');
  if (checkbox) checkbox.checked = showActualDims;

  // استرجاع خيار طريقة عرض الأرقام العشرية
  const savedRounding = sessionStorage.getItem("numberRoundingMode") || "round";
  useTruncateRounding = (savedRounding === "truncate");
  const roundingSelect = document.getElementById("number-rounding-mode");
  if (roundingSelect) {
    roundingSelect.value = savedRounding;
  }
}

// Print trigger
function printCroquis() {
  // Capture canvas as image
  const canvas = document.getElementById('landCanvas');
  const canvasDataURL = canvas.toDataURL('image/png');

  // Helper to sync current input/select values into their HTML attributes before serializing
  function syncInputValues(container) {
    if (!container) return;
    container.querySelectorAll('input').forEach(input => {
      input.setAttribute('value', input.value);
    });
    container.querySelectorAll('select').forEach(select => {
      select.querySelectorAll('option').forEach(opt => {
        if (opt.value === select.value) {
          opt.setAttribute('selected', 'selected');
        } else {
          opt.removeAttribute('selected');
        }
      });
    });
  }

  // Gather heirs table
  const heirsBody = document.getElementById('heirs-list');
  syncInputValues(heirsBody);
  const heirsRows = heirsBody ? heirsBody.innerHTML : '';
  const distributedArea = document.getElementById('distributed-area')?.innerText || '0';
  const totalLimitArea = document.getElementById('total-limit-area')?.innerText || '0';

  // Gather conversions table if exists
  const convBody = document.getElementById('conversions-tbody');
  syncInputValues(convBody);
  const convRows = convBody ? convBody.innerHTML : '';

  // Summary values
  const totalSqm = document.getElementById('total-sqm')?.innerText || '';
  const totalPerimeter = document.getElementById('total-perimeter')?.innerText || '';
  const totalPrice = document.getElementById('total-price')?.innerText || '';
  const areaShares = document.getElementById('area-shares')?.innerText || '0';
  const areaCarats = document.getElementById('area-carats')?.innerText || '0';
  const areaFeddans = document.getElementById('area-feddans')?.innerText || '0';

  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('ar-EG');

  const summarySection = (totalSqm || totalPerimeter || totalPrice) ? `
    <div class="section">
      <div class="section-title">ملخص نتائج المساحة</div>
      <div class="summary-grid">
        ${totalSqm ? `<div class="summary-card"><span class="label">إجمالي الأمتار المربعة</span><span class="value">${totalSqm} م²</span></div>` : ''}
        ${totalPerimeter ? `<div class="summary-card"><span class="label">المحيط الإجمالي</span><span class="value">${totalPerimeter} م</span></div>` : ''}
        ${totalPrice ? `<div class="summary-card"><span class="label">إجمالي سعر الأرض</span><span class="value">${totalPrice} ج</span></div>` : ''}
      </div>
    </div>` : '';

  const areaSection = (areaFeddans !== '0' || areaCarats !== '0') ? `
    <div class="section">
      <div class="section-title">المساحة بالوحدات الزراعية</div>
      <table>
        <thead><tr><th>سهم</th><th>قيراط</th><th>فدان</th></tr></thead>
        <tbody><tr>
          <td><strong>${areaShares}</strong></td>
          <td><strong>${areaCarats}</strong></td>
          <td><strong>${areaFeddans}</strong></td>
        </tr></tbody>
      </table>
    </div>` : '';

  const convSection = convRows ? `
    <div class="section">
      <div class="section-title">تحويل من متر طولي ومربع إلى القصبة والقبضة</div>
      <table>
        <thead><tr><th>البعد</th><th>أقل من القبضة</th><th>قبضة</th><th>قصبة</th></tr></thead>
        <tbody>${convRows}</tbody>
      </table>
    </div>` : '';

  const printHTML = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <title>تقرير تقسيم الأرض - الدلال</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4 portrait; margin: 10mm 8mm 10mm 8mm; }
    body { font-family: 'Cairo', sans-serif; background: #fff; color: #222; font-size: 10pt; direction: rtl; position: relative; min-height: 96vh; }
    @media print {
      body {
        background: #fff !important;
        color: #000 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      h1, h2, .header h1, .header h2, .date-line, .box-title, .section-title, .summary-card .label, .summary-card .value, th, td, td input, .footer {
        color: #000 !important;
      }
      .header {
        border-bottom: 2px solid #000 !important;
      }
      .croquis-box {
        border: 1.5px solid #000 !important;
        background: #fff !important;
      }
      .croquis-box img {
        filter: grayscale(100%) contrast(110%) !important;
      }
      .section-title {
        background: #f2f2f2 !important;
        color: #000 !important;
        border-right: 4px solid #000 !important;
      }
      .summary-card {
        border: 1px solid #000 !important;
        background: #fff !important;
      }
      th {
        background: #f2f2f2 !important;
        color: #000 !important;
        border: 1px solid #000 !important;
      }
      td {
        border: 1px solid #000 !important;
      }
      tr:nth-child(even) td {
        background: #fff !important;
      }
      .summary-bar {
        background: #f2f2f2 !important;
        border: 1px solid #000 !important;
        color: #000 !important;
      }
      .watermark {
        color: #000 !important;
        opacity: 0.08 !important;
      }
      .footer {
        border-top: 1px solid #000 !important;
      }
    }
    .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-25deg); font-size: 19px; color: #2e7d32; opacity: 0.14; font-weight: bold; white-space: nowrap; pointer-events: none; z-index: 9999; font-family: 'Cairo', Arial, sans-serif; user-select: none; text-align: center; width: 100%; }
    .page { width: 100%; }
    .header { text-align: center; padding: 6px 0 4px; border-bottom: 3px solid #2e7d32; margin-bottom: 6px; }
    .header h1 { font-size: 18pt; color: #1b5e20; font-weight: 800; margin-bottom: 1px; }
    .header h2 { font-size: 11pt; color: #388e3c; font-weight: 600; margin-bottom: 2px; }
    .header .date-line { font-size: 8pt; color: #666; }
    .croquis-box { text-align: center; margin: 4px 0; border: 1.5px solid #c8e6c9; border-radius: 6px; padding: 4px; background: #f9fbe7; page-break-inside: avoid; }
    .croquis-box .box-title { font-size: 10pt; color: #2e7d32; font-weight: 700; margin-bottom: 3px; text-align: right; padding: 0 4px; }
    .croquis-box img { max-width: 100%; max-height: 230px; object-fit: contain; display: block; margin: 0 auto; }
    .section { margin-bottom: 6px; page-break-inside: avoid; }
    .section-title { background: #e8f5e9; color: #1b5e20; font-weight: 700; font-size: 9.5pt; padding: 3px 8px; border-right: 4px solid #2e7d32; margin-bottom: 4px; border-radius: 2px; }
    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-bottom: 6px; }
    .summary-card { border: 1px solid #c8e6c9; border-radius: 4px; padding: 4px 6px; text-align: center; background: #f1f8e9; }
    .summary-card .label { font-size: 7.5pt; color: #555; display: block; margin-bottom: 1px; }
    .summary-card .value { font-size: 10pt; font-weight: 700; color: #1b5e20; }
    table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
    th { background: #e8f5e9; color: #1b5e20; font-weight: 700; border: 1px solid #c8e6c9; padding: 3px 5px; text-align: center; }
    td { border: 1px solid #e0e0e0; padding: 3px 5px; text-align: center; }
    tr:nth-child(even) td { background: #f9fbe7; }
    .summary-bar { background: #f1f8e9; border: 1px solid #c8e6c9; border-radius: 3px; padding: 3px 8px; margin-top: 4px; font-size: 8.5pt; color: #333; }
    .footer { text-align: center; margin-top: 6px; padding-top: 4px; border-top: 1px solid #ccc; font-size: 7.5pt; color: #888; }
    td select { display: none; }
    td input { border: none; background: transparent; text-align: center; font-family: 'Cairo', sans-serif; font-size: 8.5pt; font-weight: 600; width: 100%; }
  </style>
</head>
<body>
<!-- Watermark Overlay -->
<div class="watermark">تم تنفيذ هذا التقرير باستخدام تطبيق الدَّلاَّل لقياسات الأراضي، والمتوفر على Google Play.</div>
<div class="page">
  <div class="header">
    <h1>الدَّلاَّل</h1>
    <h2>تقرير تقسيم الأرض على الورثة</h2>
    <div class="date-line">تاريخ الطباعة: ${dateStr} — ${timeStr}</div>
  </div>

  <div class="croquis-box">
    <div class="box-title">الرسم الكروكي للأرض مع التقسيم</div>
    <img src="${canvasDataURL}" alt="كروكي الأرض"/>
  </div>

  ${summarySection}
  ${areaSection}

  <div class="section">
    <div class="section-title">توزيع الأنصبة على الورثة أو الشركاء</div>
    <table>
      <thead>
        <tr>
          <th>الاسم</th>
          <th>العرض العلوي (م)</th>
          <th>العرض السفلي (م)</th>
          ${(activeShape === 'trapezoid' && !showActualDims)
            ? '<th colspan="2">الطول (م)</th>'
            : '<th>الطول الأيمن (م)</th><th>الطول الأيسر (م)</th>'
          }
          <th>النصيب (م²)</th>
          <th>سهم</th>
          <th>قيراط</th>
          <th>فدان</th>
        </tr>
      </thead>
      <tbody>${heirsRows}</tbody>
    </table>
    <div class="summary-bar">
      المساحة الموزعة: <strong>${distributedArea}</strong> م² من إجمالي <strong>${totalLimitArea}</strong> م²
    </div>
  </div>


  ${convSection}

  <div class="footer">
    <p style="margin: 3px 0; font-size: 13px; color: #333; font-weight: bold;">تم تنفيذ هذا التقرير باستخدام تطبيق الدَّلاَّل لقياسات الأراضي، والمتوفر على Google Play.</p>
    <p style="margin: 3px 0; font-size: 11px; color: #777;">تطبيق الدلال لحساب ورسم وتقسيم الأراضي الزراعية © ${now.getFullYear()}</p>
  </div>
</div>
<script>
  window.onload = function() {
    const imgs = document.getElementsByTagName('img');
    let loadedCount = 0;
    function triggerPrint() {
      setTimeout(function() { window.print(); window.close(); }, 350);
    }
    if (imgs.length === 0) {
      triggerPrint();
    } else {
      for (let i = 0; i < imgs.length; i++) {
        if (imgs[i].complete) {
          loadedCount++;
          if (loadedCount === imgs.length) {
            triggerPrint();
          }
        } else {
          imgs[i].onload = function() {
            loadedCount++;
            if (loadedCount === imgs.length) {
              triggerPrint();
            }
          };
          imgs[i].onerror = function() {
            loadedCount++;
            if (loadedCount === imgs.length) {
              triggerPrint();
            }
          };
        }
      }
    }
  }
</script>
</body>
</html>`;

  const printWin = window.open('', '_blank', 'width=800,height=650,scrollbars=yes');
  if (!printWin) {
    alert('يرجى السماح بالنوافذ المنبثقة للطباعة');
    return;
  }
  printWin.document.open();
  printWin.document.write(printHTML);
  printWin.document.close();
}
