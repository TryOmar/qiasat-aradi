

// --- Performance Optimizations & Caching (Phase 14) ---
window.DALLAL_PERF = window.DALLAL_PERF || {
  domCache: true,
  documentFragment: true,
  dirtyFlag: true,
  debounce: true
};

const _domCache = {};
const _originalGetElementById = document.getElementById;
document.getElementById = function(id) {
  if (window.DALLAL_PERF && window.DALLAL_PERF.domCache) {
    const cached = _domCache[id];
    if (cached && cached.isConnected) {
      return cached;
    }
    const el = _originalGetElementById.call(document, id);
    if (el) {
      _domCache[id] = el;
    } else {
      delete _domCache[id];
    }
    return el;
  }
  return _originalGetElementById.call(document, id);
};

// DOM Elements
const shapeCards = document.querySelectorAll(".shape-card");
const inputsGroups = document.querySelectorAll(".inputs-group");
const caratSizeInput = document.getElementById("carat-size");
const caratPresetSelect = document.getElementById("carat-preset");
const caratPriceDisplay = document.getElementById("carat-price-display");
const caratPriceNumeric = document.getElementById("carat-price-numeric");
const stepsContent = document.getElementById("calculation-steps-content") || document.getElementById("steps-content");

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
var calculatedArea = 0;
window.calculatedArea = calculatedArea;
try {
  Object.defineProperty(window, "calculatedArea", {
    get: function() { return calculatedArea; },
    set: function(val) { calculatedArea = val; },
    configurable: true
  });
} catch(e) {
  window.calculatedArea = calculatedArea;
}
let calculatedPerimeter = 0;
var heirsData = [];
window.heirsData = heirsData;
try {
  Object.defineProperty(window, "heirsData", {
    get: function() { return heirsData; },
    set: function(val) { heirsData = val; },
    configurable: true
  });
} catch(e) {
  window.heirsData = heirsData;
}
window.getDallalHeirsData = function() { return heirsData; };
window.getDallalCalculatedArea = function() { return calculatedArea; };
let isDivisionActive = true;
let showActualDims = true; // متغير لإظهار الأبعاد الهندسية الفعلية (الأضلاع المائلة) في جدول التقسيم
let useTruncateRounding = false; // متغير للتحكم في قص الأرقام العشرية دون تقريب
let zoomFactor = 1.0;
let showCroquisNames = true;
let showCroquisDimensions = true;
let showCroquisDividers = true;
let showCroquisAreas = true;
let showCroquisNumbers = true;
let showCroquisBadges = true;
let croquisFontSize = 13;
let croquisMeasurementSize = 12;
const PIECE_COLORS = [
  { fill: "#DCEFD9", stroke: "#2E7D32" }, // شريك 1: أخضر فاتح / أخضر غامق
  { fill: "#D7E9FF", stroke: "#1565C0" }, // شريك 2: أزرق فاتح / أزرق غامق
  { fill: "#FFF0C9", stroke: "#EF6C00" }, // شريك 3: أصفر فاتح / برتقالي غامق
  { fill: "#F8DDE8", stroke: "#C2185B" }, // شريك 4: وردي فاتح / وردي داكن
  { fill: "#E9DDF8", stroke: "#6A1B9A" }, // شريك 5: بنفسجي فاتح / بنفسجي غامق
  { fill: "#D8F3EF", stroke: "#00796B" }, // شريك 6: تركواز فاتح / تركواز غامق
  { fill: "#FBE9E7", stroke: "#D84315" }, // شريك 7: برتقالي خفيف / بني غامق
  { fill: "#F1F8E9", stroke: "#558B2F" }  // شريك 8: ليموني خفيف / زيتي غامق
];
window.hoveredPieceIndex = null;
window.selectedPieceIndex = null;
window.canvasPiecesGeometry = [];
let oldZoomFactor = 1.0;
let isPrinting = false;

if (window.DallalStorage) {
  window.partitionOrderDirection = DallalStorage.local.getItem('partition_order_direction') || 'rtl';
} else {
  window.partitionOrderDirection = localStorage.getItem('partitionOrderDirection') || 'rtl';
}

function updatePartitionDirectionButtonUI() {
  const btn = document.getElementById('btn-partition-direction');
  if (!btn) return;
  if (window.partitionOrderDirection === 'rtl') {
    btn.innerHTML = '⬅️ اتجاه التقسيم: من اليمين إلى اليسار';
    btn.style.backgroundColor = '#ef6c00';
  } else {
    btn.innerHTML = '➡️ اتجاه التقسيم: من اليسار إلى اليمين';
    btn.style.backgroundColor = '#2e7d32';
  }
}

function updatePartitionDirectionIndicatorUI() {
  const indicatorText = document.getElementById('partition-direction-indicator-text');
  const indicatorBox = document.getElementById('partition-direction-indicator');
  if (!indicatorText || !indicatorBox) return;
  if (window.partitionOrderDirection === 'rtl') {
    indicatorText.innerHTML = '⬅️ من اليمين إلى اليسار';
    indicatorBox.style.color = '#ef6c00';
    indicatorBox.style.background = '#fff3e0';
    indicatorBox.style.borderColor = '#ffe0b2';
  } else {
    indicatorText.innerHTML = '➡️ من اليسار إلى اليمين';
    indicatorBox.style.color = '#2e7d32';
    indicatorBox.style.background = '#e8f5e9';
    indicatorBox.style.borderColor = '#c8e6c9';
  }
}

function togglePartitionOrderDirection() {
  window.partitionOrderDirection = window.partitionOrderDirection === 'ltr' ? 'rtl' : 'ltr';
  if (window.DallalStorage) {
    DallalStorage.local.setItem('partition_order_direction', window.partitionOrderDirection);
  } else {
    localStorage.setItem('partitionOrderDirection', window.partitionOrderDirection);
  }
  updatePartitionDirectionButtonUI();
  updatePartitionDirectionIndicatorUI();
  
  // Recalculate and re-render
  calculateAll();
  renderHeirsRows();
  updateHeirsUI();
}

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

function toggleFullscreenCroquis() {
  const container = document.getElementById("canvas-container");
  const btnText = document.getElementById("btn-fullscreen-text");
  if (!container) return;
  
  isCanvasFullscreen = !isCanvasFullscreen;
  
  if (isCanvasFullscreen) {
    container.classList.add("canvas-fullscreen-mode");
    if (btnText) btnText.innerText = "إنهاء ملء الشاشة";
    document.body.style.overflow = "hidden";
  } else {
    container.classList.remove("canvas-fullscreen-mode");
    if (btnText) btnText.innerText = "ملء الشاشة";
    document.body.style.overflow = "";
  }
  
  zoomFactor = 1.0;
  calculateAll();
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && isCanvasFullscreen) {
    toggleFullscreenCroquis();
  }
});

function toggleCroquisNames() {
  const chk = document.getElementById("chk-toggle-names");
  if (chk) showCroquisNames = chk.checked;
  calculateAll();
}

function saveCroquisSettings() {
  localStorage.setItem("p13-show-dimensions", showCroquisDimensions ? "true" : "false");
  localStorage.setItem("p13-show-dividers", showCroquisDividers ? "true" : "false");
  localStorage.setItem("p13-show-names", showCroquisNames ? "true" : "false");
  localStorage.setItem("p13-show-areas", showCroquisAreas ? "true" : "false");
  localStorage.setItem("p13-show-numbers", showCroquisNumbers ? "true" : "false");
  localStorage.setItem("p13-show-badges", showCroquisBadges ? "true" : "false");
  localStorage.setItem("p13-font-size", croquisFontSize.toString());
  localStorage.setItem("p13-measurement-size", croquisMeasurementSize.toString());
}

function loadCroquisSettings() {
  showCroquisDimensions = (localStorage.getItem("p13-show-dimensions") !== "false");
  showCroquisDividers = (localStorage.getItem("p13-show-dividers") !== "false");
  showCroquisNames = (localStorage.getItem("p13-show-names") !== "false");
  showCroquisAreas = (localStorage.getItem("p13-show-areas") !== "false");
  showCroquisNumbers = (localStorage.getItem("p13-show-numbers") !== "false");
  showCroquisBadges = (localStorage.getItem("p13-show-badges") !== "false");
  croquisFontSize = parseInt(localStorage.getItem("p13-font-size")) || 13;
  croquisMeasurementSize = parseInt(localStorage.getItem("p13-measurement-size")) || 12;

  // Sync to DOM inputs
  const chkDimensions = document.getElementById("settings-show-dimensions");
  const chkDividers = document.getElementById("settings-show-dividers");
  const chkNames = document.getElementById("settings-show-names");
  const chkAreas = document.getElementById("settings-show-areas");
  const chkNumbers = document.getElementById("settings-show-numbers");
  const chkBadges = document.getElementById("settings-show-badges");
  const inputFontSize = document.getElementById("settings-font-size");
  const inputMeasurementSize = document.getElementById("settings-measurement-size");

  if (chkDimensions) chkDimensions.checked = showCroquisDimensions;
  if (chkDividers) chkDividers.checked = showCroquisDividers;
  if (chkNames) chkNames.checked = showCroquisNames;
  if (chkAreas) chkAreas.checked = showCroquisAreas;
  if (chkNumbers) chkNumbers.checked = showCroquisNumbers;
  if (chkBadges) chkBadges.checked = showCroquisBadges;
  if (inputFontSize) inputFontSize.value = croquisFontSize;
  if (inputMeasurementSize) inputMeasurementSize.value = croquisMeasurementSize;

  // Restore settings panel collapsible state
  const isExpanded = localStorage.getItem("p13-settings-expanded") === "true";
  const content = document.getElementById("croquis-settings-content");
  const arrow = document.getElementById("croquis-settings-arrow");
  if (content && arrow) {
    if (isExpanded) {
      content.style.display = "block";
      arrow.textContent = "▼";
    } else {
      content.style.display = "none";
      arrow.textContent = "▶";
    }
  }
}

function updateCroquisSettings() {
  const chkDimensions = document.getElementById("settings-show-dimensions");
  const chkDividers = document.getElementById("settings-show-dividers");
  const chkNames = document.getElementById("settings-show-names");
  const chkAreas = document.getElementById("settings-show-areas");
  const chkNumbers = document.getElementById("settings-show-numbers");
  const chkBadges = document.getElementById("settings-show-badges");
  const inputFontSize = document.getElementById("settings-font-size");
  const inputMeasurementSize = document.getElementById("settings-measurement-size");

  if (chkDimensions) showCroquisDimensions = chkDimensions.checked;
  if (chkDividers) showCroquisDividers = chkDividers.checked;
  if (chkNames) showCroquisNames = chkNames.checked;
  if (chkAreas) showCroquisAreas = chkAreas.checked;
  if (chkNumbers) showCroquisNumbers = chkNumbers.checked;
  if (chkBadges) showCroquisBadges = chkBadges.checked;
  if (inputFontSize) croquisFontSize = parseInt(inputFontSize.value) || 13;
  if (inputMeasurementSize) croquisMeasurementSize = parseInt(inputMeasurementSize.value) || 12;

  saveCroquisSettings();
  calculateAll();
}

function resetCroquisSettings() {
  showCroquisDimensions = true;
  showCroquisDividers = true;
  showCroquisNames = true;
  showCroquisAreas = true;
  showCroquisNumbers = true;
  showCroquisBadges = true;
  croquisFontSize = 13;
  croquisMeasurementSize = 12;

  saveCroquisSettings();
  loadCroquisSettings();
  calculateAll();
}

function toggleCroquisSettingsPanel() {
  const content = document.getElementById("croquis-settings-content");
  const arrow = document.getElementById("croquis-settings-arrow");
  if (content && arrow) {
    const isHidden = content.style.display === "none";
    if (isHidden) {
      content.style.display = "block";
      arrow.textContent = "▼";
      localStorage.setItem("p13-settings-expanded", "true");
    } else {
      content.style.display = "none";
      arrow.textContent = "▶";
      localStorage.setItem("p13-settings-expanded", "false");
    }
  }
}

window.addEventListener("resize", () => {
  // [Commit 2 – Smart Layout] تحديث كاش LayoutBuffer عند تغيير الحجم
  if (typeof SmartLayout !== "undefined" && SmartLayout.onResize) {
    SmartLayout.onResize();
  }
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
  if (typeof updatePartitionDirectionButtonUI === "function") {
    updatePartitionDirectionButtonUI();
  }
  if (typeof updatePartitionDirectionIndicatorUI === "function") {
    updatePartitionDirectionIndicatorUI();
  }
  if (typeof window.updateFieldGuide === "function") {
    window.updateFieldGuide();
  }
});

let debounceTimer = null;

function saveAndCalc() {
  if (window.__RUNNING_TESTS__) {
    saveAndCalcImmediate();
    return;
  }
  if (debounceTimer) clearTimeout(debounceTimer);
  
  const isOptimized = window.DALLAL_PERF && window.DALLAL_PERF.debounce;
  const delay = isOptimized ? 120 : 0;
  
  if (delay === 0) {
    saveAndCalcImmediate();
  } else {
    debounceTimer = setTimeout(() => {
      saveAndCalcImmediate();
    }, delay);
  }
}

function saveAndCalcImmediate() {
  saveStateToSession();
  calculateAll();
  if (typeof drawCroquis === "function") {
    drawCroquis();
  }
}

window.saveAndCalc = saveAndCalc;
window.saveAndCalcImmediate = saveAndCalcImmediate;

function setupEventListeners() {
  const btnAddPartner = document.getElementById("addPartnerBtn") || document.querySelector(".btn-add-heir");
  if (btnAddPartner) {
    btnAddPartner.addEventListener("click", addNewHeir);
  }

  // Shape card clicks
  shapeCards.forEach(card => {
    card.addEventListener("click", () => {
      shapeCards.forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      activeShape = card.getAttribute("data-shape");
      window.activeShape = activeShape;
      
      // Toggle inputs group
      inputsGroups.forEach(group => group.classList.remove("active"));
      document.getElementById(`inputs-${activeShape}`).classList.add("active");
      
      resetDivision();
      saveAndCalcImmediate();
    });
  });

  // Attach input listeners to all input fields to auto-calculate and save
  const allInputs = document.querySelectorAll("input, select");
  allInputs.forEach(input => {
    // Avoid double events on custom handlers
    const isExcluded = 
      input.id === "carat-price-display" || 
      input.id === "heirs-count" || 
      input.id === "show-actual-dims" || 
      input.id.startsWith("settings-") || 
      input.id === "long-plot-view";

    if (!isExcluded) {
      const handleEvent = () => {
        if (input.closest(".inputs-group")) {
          resetDivision();
        }
        saveAndCalc();
      };
      input.addEventListener("input", handleEvent);
      input.addEventListener("change", handleEvent);
      input.addEventListener("blur", handleEvent);
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
    'trap-length-right': { lines: ['#svg-card-trap-right'] },
    'trap-length-left': { lines: ['#svg-card-trap-left'] },
    
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
  // Dragging vertical dividers has been disabled to prevent accidental modifications to shares/areas.
  return;
}

function handleCanvasPointerMove(e) {
  // Dragging vertical dividers has been disabled to prevent accidental modifications to shares/areas.
  canvas.style.cursor = "default";
  return;
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
  adjustPriceFontSize(input);
  saveStateToSession();
  calculateAll();
}

function adjustPriceFontSize(input) {
  if (!input) return;
  const len = input.value.length;
  if (len <= 8) {
    input.style.fontSize = "16px";
  } else if (len === 9) {
    input.style.fontSize = "15px";
  } else if (len === 10) {
    input.style.fontSize = "14px";
  } else if (len === 11) {
    input.style.fontSize = "13px";
  } else if (len === 12) {
    input.style.fontSize = "12px";
  } else {
    input.style.fontSize = "11px";
  }
}

// Clear all inputs (Page 11 Parity)
function clearAllInputs(confirmRequired = false) {
  if (confirmRequired) {
    if (!confirm("سيتم حذف جميع البيانات وإعادة الصفحة إلى البداية. هل تريد المتابعة؟")) {
      return;
    }
  }

  // 1. Clear shape inputs across all groups
  const inputs = document.querySelectorAll(".inputs-group input");
  inputs.forEach(input => input.value = "");

  // 2. Clear carat price & reset carat size
  if (typeof caratPriceDisplay !== "undefined" && caratPriceDisplay) caratPriceDisplay.value = "";
  if (typeof caratPriceNumeric !== "undefined" && caratPriceNumeric) caratPriceNumeric.value = "";
  if (typeof caratSizeInput !== "undefined" && caratSizeInput) caratSizeInput.value = "168";
  if (typeof caratPresetSelect !== "undefined" && caratPresetSelect) caratPresetSelect.value = "168";

  // 3. Reset Single Source of Truth calculation & geometry state BEFORE resetting division
  calculatedArea = 0;
  calculatedPerimeter = 0;
  area = 0;
  vertices = [];
  window.vertices = [];
  heirsData = [];
  window.heirsData = [];

  // 4. Clear sessionStorage keys
  try {
    sessionStorage.setItem("heirsData", "[]");
    sessionStorage.setItem("heirsCount", "0");
    sessionStorage.removeItem("divisionInput");
    sessionStorage.removeItem("priceDisplay");
    sessionStorage.removeItem("priceNumeric");
    sessionStorage.removeItem("rectLength");
    sessionStorage.removeItem("rectWidth");
    sessionStorage.removeItem("squareSide");
    sessionStorage.removeItem("trapBaseMajor");
    sessionStorage.removeItem("trapBaseMinor");
    sessionStorage.removeItem("trapLengthRight");
    sessionStorage.removeItem("trapLengthLeft");
    sessionStorage.removeItem("quadSideA");
    sessionStorage.removeItem("quadSideB");
    sessionStorage.removeItem("quadSideC");
    sessionStorage.removeItem("quadSideD");
    sessionStorage.removeItem("quadDiagAC");
    sessionStorage.removeItem("quadDiagBD");
  } catch (e) {
    console.warn("sessionStorage cleanup warning:", e);
  }

  // 5. Hide overlays & tooltips
  if (typeof closeInspector === "function") {
    closeInspector();
  }

  const topDeficit = document.getElementById("top-deficit-warning");
  if (topDeficit) topDeficit.style.display = "none";

  const remBox = document.getElementById("table-remaining-box");
  if (remBox) remBox.style.display = "none";

  const legend = document.getElementById("croquis-legend");
  if (legend) {
    legend.innerHTML = "";
    legend.style.display = "none";
  }

  // 6. Reset Division (Page 11 Golden Reference Parity: clears all partners, count = 0, no default rows created)
  if (heirsCountInput) heirsCountInput.value = "0";
  if (window.Page13PartnersTableAdapter && typeof window.Page13PartnersTableAdapter.removeAllPartners === "function") {
    window.Page13PartnersTableAdapter.removeAllPartners(true);
  } else {
    heirsData = [];
    window.heirsData = [];
    generateHeirsTable();
  }
  saveStateToSession();
  calculateAll();
}

// Opposite direction mapping (Page 11 Golden Reference Parity)
const P13_OPPOSITE = {
  "بحري": "قبلي",
  "قبلي": "بحري",
  "شرقي": "غربي",
  "غربي": "شرقي"
};

const P13_PAIRED = {
  "p13-trap-c-dir": "p13-trap-a-dir",
  "p13-trap-a-dir": "p13-trap-c-dir",
  "p13-trap-d-dir": "p13-trap-b-dir",
  "p13-trap-b-dir": "p13-trap-d-dir",

  "p13-quad-c-dir": "p13-quad-a-dir",
  "p13-quad-a-dir": "p13-quad-c-dir",
  "p13-quad-d-dir": "p13-quad-b-dir",
  "p13-quad-b-dir": "p13-quad-d-dir"
};

function handleP13DirectionChange(changedId) {
  const selectEl = document.getElementById(changedId);
  if (!selectEl) return;

  const newVal = selectEl.value.trim();
  const pairedId = P13_PAIRED[changedId];

  if (pairedId) {
    const pairedEl = document.getElementById(pairedId);
    if (pairedEl) {
      const oppositeVal = P13_OPPOSITE[newVal];
      if (oppositeVal && pairedEl.value !== oppositeVal) {
        pairedEl.value = oppositeVal;
      }
    }
  }

  if (typeof saveStateToSession === "function") saveStateToSession();
  if (typeof calculateAll === "function") calculateAll();
}
window.handleP13DirectionChange = handleP13DirectionChange;

// Reset direction selects to Page 11 Golden Reference defaults
function resetP13DirectionsToDefault() {
  const ids = [
    { id: "p13-trap-c-dir", def: "شرقي" },
    { id: "p13-trap-a-dir", def: "غربي" },
    { id: "p13-trap-d-dir", def: "قبلي" },
    { id: "p13-trap-b-dir", def: "بحري" },
    { id: "p13-quad-c-dir", def: "شرقي" },
    { id: "p13-quad-a-dir", def: "غربي" },
    { id: "p13-quad-d-dir", def: "قبلي" },
    { id: "p13-quad-b-dir", def: "بحري" }
  ];
  ids.forEach(item => {
    const el = document.getElementById(item.id);
    if (el) el.value = item.def;
  });
  if (typeof saveStateToSession === "function") saveStateToSession();
  if (typeof calculateAll === "function") calculateAll();
}
window.resetP13DirectionsToDefault = resetP13DirectionsToDefault;

// Show/Hide Division Panel
function toggleDivisionPanel() {
  isDivisionActive = true;
  const sketchPanel = document.getElementById('division-sketch-panel');
  if (divisionPanel) divisionPanel.style.display = "block";
  if (sketchPanel) sketchPanel.style.display = "block";
  if (btnToggleDivision) btnToggleDivision.classList.add("active-panel");
  const targetCount = parseInt(heirsCountInput ? heirsCountInput.value : 3) || 3;
  if (!heirsData || !Array.isArray(heirsData) || heirsData.length === 0 || heirsData.length !== targetCount) {
    generateHeirsTable();
  } else {
    renderHeirsRows();
  }
  // [Commit 4 – Division Direction] إظهار زر تبديل الاتجاه
  if (typeof DivisionDirection !== "undefined" && DivisionDirection.init) {
    DivisionDirection.init();
  }
  calculateAll();
  if (typeof window.updateFieldGuide === "function") {
    window.updateFieldGuide();
  }
}

// Reset Smart Division panel
function resetDivision() {
  isDivisionActive = true;
  const sketchPanel = document.getElementById('division-sketch-panel');
  if (divisionPanel) divisionPanel.style.display = "block";
  if (sketchPanel) sketchPanel.style.display = "block";
  if (btnToggleDivision) btnToggleDivision.classList.add("active-panel");
  if (heirsCountInput) heirsCountInput.value = "3";
  heirsData = [];
  generateHeirsTable();
  saveStateToSession();
  if (typeof window.updateFieldGuide === "function") {
    window.updateFieldGuide();
  }
}

// إظهار/إخفاء خيار "الأبعاد الهندسية الفعلية" بناءً على الشكل المختار
function updateDivisionSettingsUI() {
  const toggleDiv = document.getElementById('actual-dims-toggle');
  if (toggleDiv) toggleDiv.style.display = 'none';
  showActualDims = true;
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
    thRight.textContent = 'الطول الأيمن';
    thRight.removeAttribute('colspan');
    thLeft.style.display = '';
    thLeft.textContent = 'الطول الأيسر';
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
  calculateAll();
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
  return AgriUnitsCompat.sqmToFCSPlural(sqm, caratSize);
}


// Qasaba and Qabda conversion
function toQasabaAndQabda(meters) {
  return AgriUnitsCompat.metersToQasabaQabda(meters);
}


// Convert قصبة + قبضة + أقل من قبضة back to meters
function fromQasabaToMeters(qasaba, qabda, fraction) {
  return AgriUnitsCompat.qasabaQabdaToMeters(qasaba, qabda, fraction);
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

  let normalized = AgriUnitsCompat.normalizeQasabaQabda(qasaba, qabda, fraction);
  qasaba = normalized.qasaba;
  qabda = normalized.qabda;
  fraction = normalized.fraction;

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
  console.log("Trace: calculateAll started");
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
      stepsText = `الشكل المختار: أرض مستطيلة\n` +
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
      stepsText = `الشكل المختار: أرض مربعة\n` +
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
    const l1 = parseFloat(document.getElementById("trap-length-right")?.value) || 0; // right height (الطول الأيمن)
    const l2 = parseFloat(document.getElementById("trap-length-left")?.value) || 0; // left height (الطول الأيسر)

    dimensionInputs = [
      { name: "العرض العلوي (C)", value: c },
      { name: "العرض السفلي (A)", value: a },
      { name: "الطول الأيمن (D)", value: l1 },
      { name: "الطول الأيسر (B)", value: l2 }
    ];

    if (a > 0 && c > 0 && l1 > 0 && l2 > 0) {
      area = AgriUnitsCompat.trapezoidArea(l1, l2, a, c);
      
      const w_coord = 0.5 * (a + c);
      const calculatedSide = Math.hypot(w_coord, l1 - l2); // الضلع المائل العلوي
      perimeter = a + c + l1 + l2;
      
      stepsText = `الشكل المختار: أرض شبه منحرفة زراعية\n` +
                  `المعادلة: المساحة = متوسط العرض × متوسط الطول\n` +
                  `المعادلة: المساحة = 0.5 × (العرض العلوي + العرض السفلي) × 0.5 × (الطول الأيمن + الطول الأيسر)\n` +
                  `الحساب: 0.5 × (${c} + ${a}) × 0.5 × (${l2} + ${l1}) = ${area.toFixed(2)} متر مربع\n` +
                  `المحيط = مجموع الأبعاد الأربعة = ${a} (عرض سفلي) + ${c} (عرض علوي) + ${l1} (طول أيمن) + ${l2} (طول أيسر) = ${perimeter.toFixed(2)} متر`;

      // Coordinates (Flat bottom base A, centered top base C)
      vertices = [
        { x: 0, y: 0 },
        { x: a, y: 0 },
        { x: a - (a - c) / 2, y: l1 },
        { x: (a - c) / 2, y: l2 }
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
      { name: "العرض الأول (أعلى) (C)", value: c },
      { name: "العرض الثاني (أسفل) (A)", value: a },
      { name: "الطول الأيمن (D)", value: d },
      { name: "الطول الأيسر (B)", value: b }
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
            stepsText = `الشكل المختار: أرض رباعية غير منتظمة (التقسيم الدقيق باستخدام القطر AC = ${d_ac} م)\n` +
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
            stepsText = `الشكل المختار: أرض رباعية غير منتظمة (التقسيم الدقيق باستخدام القطر BD = ${d_bd} م)\n` +
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
  window.vertices = vertices;
  console.log("Area =", calculatedArea);

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

  // Steps handled via updateCalculationSteps() below to maintain rich HTML parity

  // Map dimensionInputs index to the corresponding side input ID
  const sideIds = ["quad-side-a", "quad-side-b", "quad-side-c", "quad-side-d",
                   "rect-length", "rect-width",
                   "trap-base-major", "trap-base-minor", "trap-length-right", "trap-length-left"];
  // Build a lookup from dim.name to sideId using the order they come in
  const activeSideIds = (() => {
    if (activeShape === "quadrilateral") return ["quad-side-c", "quad-side-a", "quad-side-d", "quad-side-b"];
    if (activeShape === "rectangle") return ["rect-width", "rect-length"];
    if (activeShape === "trapezoid") return ["trap-base-minor", "trap-base-major", "trap-length-right", "trap-length-left"];
    return [];
  })();

  const activeEl = document.activeElement;
  const isEditingConversion = activeEl && activeEl.id && activeEl.id.startsWith('conv-');

  if (!isEditingConversion) {
    conversionsTbody.innerHTML = "";
    if (dimensionInputs.length > 0) {

      // دالة لبناء بطاقة تحويل واحدة
      function buildConvCard(label, meterValue, qConv, sideId, index, isEditable) {
        const meterLabel = `${parseFloat(meterValue || 0).toFixed(2)} م`;

        const qasabaInput = isEditable
          ? `<input type="text" inputmode="decimal" class="conv-input conv-qasaba"
               id="conv-qasaba-${index}" value="${qConv.qasaba}"
               min="0" step="1" title="عدد القصبات"
               oninput="updateSideFromQasaba('${sideId}', ${index})"
               onchange="updateSideFromQasaba('${sideId}', ${index})">`
          : `<input type="text" inputmode="decimal" class="conv-input conv-qasaba" value="${qConv.qasaba}" readonly>`;

        const qabdaInput = isEditable
          ? `<input type="text" inputmode="decimal" class="conv-input conv-qabda"
               id="conv-qabda-${index}" value="${qConv.qabda}"
               min="0" step="1" title="عدد القبضات"
               oninput="updateSideFromQasaba('${sideId}', ${index})"
               onchange="updateSideFromQasaba('${sideId}', ${index})">`
          : `<input type="text" inputmode="decimal" class="conv-input conv-qabda" value="${qConv.qabda}" readonly>`;

        const fracInput = isEditable
          ? `<input type="text" inputmode="decimal" class="conv-input conv-fraction"
               id="conv-fraction-${index}" value="${qConv.fraction}"
               min="0" max="0.99" step="0.01" title="جزء أقل من القبضة (0 - 0.99)"
               oninput="updateSideFromQasaba('${sideId}', ${index})"
               onchange="updateSideFromQasaba('${sideId}', ${index})">`
          : `<input type="text" inputmode="decimal" class="conv-input conv-fraction" value="${qConv.fraction}" readonly>`;

        return `
          <div class="conv-card">
            <div class="conv-card-title">${label}</div>
            <div class="conv-card-main-val">${meterLabel}</div>
            <div class="conv-card-row-header">
              <span>أقل من القبضة</span>
              <span>قبضة</span>
              <span>قصبة</span>
            </div>
            <div class="conv-card-row-values">
              <div>${fracInput}</div>
              <div>${qabdaInput}</div>
              <div>${qasabaInput}</div>
            </div>
          </div>`;
      }

      dimensionInputs.forEach((dim, i) => {
        const qConv = toQasabaAndQabda(dim.value);
        const sid = activeSideIds[i] || "";
        conversionsTbody.innerHTML += buildConvCard(dim.name, dim.value, qConv, sid, i, true);
      });

      // Add square qasba card
      const qasba_sq = area / 12.60250;
      const reedValue = Math.floor(qasba_sq);
      const fistValue = Math.floor((qasba_sq - reedValue) * 24);
      const lessThanFistValue = parseFloat((qasba_sq - reedValue - (fistValue / 24)).toFixed(2));

      const areaCardHtml = `
        <div class="conv-card">
          <div class="conv-card-title">النتيجة بالقصبة المربعة</div>
          <div class="conv-card-main-val">${area.toFixed(2)} م²</div>
          <div class="conv-card-row-header">
            <span>أقل من القبضة</span>
            <span>قبضة</span>
            <span>قصبة</span>
          </div>
          <div class="conv-card-row-values">
            <div><input type="text" class="conv-input conv-fraction" value="${lessThanFistValue}" readonly></div>
            <div><input type="text" class="conv-input conv-qabda" value="${fistValue}" readonly></div>
            <div><input type="text" class="conv-input conv-qasaba" value="${reedValue}" readonly></div>
          </div>
        </div>`;
      conversionsTbody.innerHTML += areaCardHtml;

    } else {
      conversionsTbody.innerHTML = `<p style="text-align:center;color:#888;padding:12px;font-family:Cairo,Arial,sans-serif;">أدخل الأبعاد أعلاه لعرض التحويلات</p>`;
    }
  }

  // Manage Heirs Division Limit
  totalLimitAreaSpan.innerText = area.toFixed(2);
  
  // Draw on Canvas
  // [Commit 2 – Smart Layout] تهيئة أبعاد الكانفاس الذكية قبل الرسم
  if (typeof SmartLayout !== "undefined" && SmartLayout.prepare) {
    SmartLayout.prepare(canvas, vertices);
  }
  console.log("Calling drawLandCanvas");
  drawLandCanvas(vertices);

  // تحديث واجهة إعدادات التقسيم (يمين/يسار مقابل الطول)
  updateDivisionSettingsUI();

  if (isDivisionActive && area > 0) {
    updateHeirsDistribution();
    updateHeirsUI();
  }

  // تحديث خطوات الحساب بالتفصيل الموحدة (Single Source of Truth مع الحماية التامة)
  try {
    if (typeof updateCalculationSteps === "function") {
      updateCalculationSteps();
    }
  } catch (e) {
    console.error("Calculation Steps Error:", e);
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
  
  if (activeShape === 'trapezoid') {
    const l1Val = parseFloat(document.getElementById("trap-length-right")?.value) || 0;
    const l2Val = parseFloat(document.getElementById("trap-length-left")?.value) || 0;
    return {
      top: Math.hypot(pTopCurr.x - pTopPrev.x, pTopCurr.y - pTopPrev.y),
      bottom: Math.hypot(pBotCurr.x - pBotPrev.x, pBotCurr.y - pBotPrev.y),
      left: l2Val + tPrev * (l1Val - l2Val),
      right: l2Val + tCurr * (l1Val - l2Val)
    };
  }

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
  
  let sumDistributed = 0;
  heirsData.forEach(h => sumDistributed += (h.share || 0));

  const remainingArea = Number((calculatedArea - sumDistributed).toFixed(4));
  const hasRemainder = remainingArea > 0.01;

  const rawShares = heirsData.map(h => h.share || 0);
  const shares = (window.partitionOrderDirection === 'rtl')
    ? rawShares.slice().reverse()
    : rawShares.slice();

  const sliceShares = shares.slice();
  if (hasRemainder) {
    if (window.partitionOrderDirection === 'rtl') {
      sliceShares.unshift(remainingArea);
    } else {
      sliceShares.push(remainingArea);
    }
  }

  const piecesCount = sliceShares.length;
  const exactTs = [0];
  let tempCumArea = 0;
  for (let i = 0; i < piecesCount - 1; i++) {
    tempCumArea += sliceShares[i];
    exactTs.push(findTForArea(tempCumArea, calculatedArea));
  }
  exactTs.push(1.0);
  
  const slicesDims = [];
  for (let i = 0; i < piecesCount; i++) {
    const tPrev = exactTs[i];
    const tCurr = exactTs[i + 1];
    const realSides = getPieceRealSides(tPrev, tCurr);
    slicesDims.push({
      top: realSides.top,
      bottom: realSides.bottom,
      left: realSides.left,
      right: realSides.right
    });
  }

  heirsData.forEach((h, idx) => {
    const sliceIdx = (window.partitionOrderDirection === 'rtl')
      ? (hasRemainder ? piecesCount - 1 - idx : heirsData.length - 1 - idx)
      : idx;
    const dims = slicesDims[sliceIdx];
    if (dims) {
      h.topW = dims.top;
      h.botW = dims.bottom;
      h.leftL = dims.left;
      h.rightL = dims.right;
    }
  });

  if (hasRemainder) {
    const remSliceIdx = (window.partitionOrderDirection === 'rtl') ? 0 : piecesCount - 1;
    const remDims = slicesDims[remSliceIdx];
    window.remainderPiece = {
      isRemainder: true,
      name: "المتبقي",
      share: remainingArea,
      topW: remDims.top,
      botW: remDims.bottom,
      leftL: remDims.left,
      rightL: remDims.right,
      color: { fill: "#FFFDF0", stroke: "#ff8f00" }
    };
  } else {
    window.remainderPiece = null;
  }
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
function drawLandCanvas(verticesInput) {
  const vertices = (verticesInput && Array.isArray(verticesInput))
    ? verticesInput
    : (window.vertices && Array.isArray(window.vertices) ? window.vertices : (typeof vertices !== "undefined" && Array.isArray(vertices) ? vertices : []));
  console.log("drawLandCanvas started", { vertices: vertices });
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
  // [Commit 2 – Smart Layout] يستخدم window.smartMarginHint إن توفَّر، وإلا يرجع للحساب الأصلي
  const margin = isPrinting ? 110
    : (typeof window.smartMarginHint === "number" && window.smartMarginHint > 0
        ? window.smartMarginHint
        : Math.max(50, Math.min(60 * scaleMultiplier, 80)));
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
  ctx.fillStyle = "#FDFBF2"; // كريمي فاتح جداً لتسهيل القراءة تحت الشمس
  ctx.strokeStyle = "#1b5e20";
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
    if (activeShape === 'trapezoid') {
      if (i === 0) {
        len = parseFloat(document.getElementById('trap-base-major')?.value) || 0;
      } else if (i === 1) {
        len = parseFloat(document.getElementById('trap-length-right')?.value) || 0;
      } else if (i === 2) {
        len = parseFloat(document.getElementById('trap-base-minor')?.value) || 0;
      } else if (i === 3) {
        len = parseFloat(document.getElementById('trap-length-left')?.value) || 0;
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
    ctx.strokeStyle = "#1b5e20";
    ctx.lineWidth = Math.max(2, 2 * scaleMultiplier);
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
    ctx.fillStyle = "#111111"; // أسود داكن عالي التباين
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(labelText, 0, 1);
    ctx.restore();
  }

  // 6. Draw Division lines, piece info, and side dimensions
  if (isDivisionActive && heirsData.length > 0 && calculatedArea > 0 && canvasPoints.length >= 4) {
    const caratSize = parseFloat(caratSizeInput.value) || 168;
    const showCroquisMeasurements = true;
    
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
      landLeft = parseFloat(document.getElementById('trap-length-left')?.value) || 0;
      landRight = parseFloat(document.getElementById('trap-length-right')?.value) || 0;
    } else if (activeShape === 'quadrilateral') {
      landBottom = parseFloat(document.getElementById('quad-side-a')?.value) || 0;
      landLeft = parseFloat(document.getElementById('quad-side-b')?.value) || 0;
      landTop = parseFloat(document.getElementById('quad-side-c')?.value) || 0;
      landRight = parseFloat(document.getElementById('quad-side-d')?.value) || 0;
    }
    
    const W = (landTop + landBottom) / 2;

    // Canvas corners (from visual canvas points)
    let cpA = canvasPoints[0]; // bottom-left
    let cpB = canvasPoints[1]; // bottom-right
    let cpC = canvasPoints[2]; // top-right
    let cpD = canvasPoints[3]; // top-left

    // [Commit 4 – Division Direction] تحويل الإحداثيات بصرياّ للاتجاه الرأسي (canvas coords فقط)
    if (typeof DivisionDirection !== "undefined" && DivisionDirection.getTransformedPoints
        && window.divisionDirection === "vertical") {
      const transformed = DivisionDirection.getTransformedPoints(canvasPoints, cssW, cssH);
      cpA = transformed[0];
      cpB = transformed[1];
      cpC = transformed[2];
      cpD = transformed[3];
    }

    // Always compute exact area-based widths for all heirs to guarantee 100% geometric sync with updated shares
    recalculateHeirsDimensions();

    // Calculate cumulative t values for top and bottom sides separately.
    // slices are always accumulated left→right on the canvas.
    // Under RTL, slice i from the left is owned by heir[N-1-i], so we reverse the order of widths.
    const piecesToDraw = heirsData.slice();
    if (window.remainderPiece && window.remainderPiece.share > 0.01) {
      piecesToDraw.push(window.remainderPiece);
    }

    const N_pre = piecesToDraw.length;
    const topWOrder = (window.partitionOrderDirection === 'rtl')
      ? piecesToDraw.map(p => p.topW || 0).reverse()
      : piecesToDraw.map(p => p.topW || 0);
    const botWOrder = (window.partitionOrderDirection === 'rtl')
      ? piecesToDraw.map(p => p.botW || 0).reverse()
      : piecesToDraw.map(p => p.botW || 0);

    let cumTop = 0;
    const splitTsTop = [0];
    topWOrder.forEach((topW, idx) => {
      cumTop += topW;
      let t = landTop > 0 ? cumTop / landTop : (idx + 1) / N_pre;
      t = Math.max(0, Math.min(1, t));
      splitTsTop.push(t);
    });
    splitTsTop[splitTsTop.length - 1] = 1.0;

    let cumBot = 0;
    const splitTsBot = [0];
    botWOrder.forEach((botW, idx) => {
      cumBot += botW;
      let t = landBottom > 0 ? cumBot / landBottom : (idx + 1) / N_pre;
      t = Math.max(0, Math.min(1, t));
      splitTsBot.push(t);
    });
    splitTsBot[splitTsBot.length - 1] = 1.0;

    // Reset geometry check array
    window.canvasPiecesGeometry = [];

    const N = piecesToDraw.length;

    // Draw each physical slice left-to-right (i=0 is leftmost slice on canvas).
    // Under LTR heir[i] owns slice i; under RTL heir[N-1-i] owns slice i.
    for (let i = 0; i < piecesToDraw.length; i++) {
      const tPrevTop = splitTsTop[i];
      const tCurrTop = splitTsTop[i + 1];
      const tPrevBot = splitTsBot[i];
      const tCurrBot = splitTsBot[i + 1];

      // Resolve which heir owns this physical slice
      const heirIdx = (window.partitionOrderDirection === 'rtl') ? (N - 1 - i) : i;
      const heir = piecesToDraw[heirIdx];
      if (!heir) continue;

      // Canvas coordinates for vertical slice (interpolated separately along the top and bottom sides)
      const cpTopPrev    = { x: cpD.x + tPrevTop * (cpC.x - cpD.x), y: cpD.y + tPrevTop * (cpC.y - cpD.y) };
      const cpBottomPrev = { x: cpA.x + tPrevBot * (cpB.x - cpA.x), y: cpA.y + tPrevBot * (cpB.y - cpA.y) };
      const cpTopCurr    = { x: cpD.x + tCurrTop * (cpC.x - cpD.x), y: cpD.y + tCurrTop * (cpC.y - cpD.y) };
      const cpBottomCurr = { x: cpA.x + tCurrBot * (cpB.x - cpA.x), y: cpA.y + tCurrBot * (cpB.y - cpA.y) };

      // Save geometry: geometry[heirIdx] = the canvas polygon for that heir
      if (!window.canvasPiecesGeometry[heirIdx]) {
        window.canvasPiecesGeometry[heirIdx] = [cpTopPrev, cpTopCurr, cpBottomCurr, cpBottomPrev];
      }

      // Use exact physical side lengths
      const pieceTopW   = heir.topW   || 0;
      const pieceBotW   = heir.botW   || 0;
      const pieceLeftL  = heir.leftL  || 0;
      const pieceRightL = heir.rightL || 0;

      // Draw slice background fill
      const color = heir.color || (heir.isRemainder ? { fill: "#FFFDF0", stroke: "#ff8f00" } : PIECE_COLORS[heirIdx % PIECE_COLORS.length]);
      ctx.fillStyle = color.fill;
      ctx.beginPath();
      ctx.moveTo(cpTopPrev.x, cpTopPrev.y);
      ctx.lineTo(cpTopCurr.x, cpTopCurr.y);
      ctx.lineTo(cpBottomCurr.x, cpBottomCurr.y);
      ctx.lineTo(cpBottomPrev.x, cpBottomPrev.y);
      ctx.closePath();
      ctx.fill();

      // Draw matching outer border of segment or AutoCAD blue glow highlight
      if (heirIdx === window.hoveredPieceIndex || heirIdx === window.selectedPieceIndex) {
        ctx.save();
        ctx.strokeStyle = "#00b0ff"; // أزرق ساطع
        ctx.lineWidth = Math.max(3.5, 4.5 * scaleMultiplier);
        ctx.shadowColor = "rgba(0, 176, 255, 0.8)";
        ctx.shadowBlur = 10;
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(cpTopPrev.x, cpTopPrev.y);
        ctx.lineTo(cpTopCurr.x, cpTopCurr.y);
        ctx.lineTo(cpBottomCurr.x, cpBottomCurr.y);
        ctx.lineTo(cpBottomPrev.x, cpBottomPrev.y);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      } else {
        // رسم حدود القطعة يدوياً للحصول على سمك مختلف بين الحدود الخارجية والداخلية
        ctx.save();
        ctx.strokeStyle = color.stroke;
        ctx.lineJoin = "round";

        if (heir.isRemainder) {
          ctx.setLineDash([4, 4]);
        }

        // 1. الحد العلوي (سميك)
        ctx.lineWidth = Math.max(3.5, 4.5 * scaleMultiplier);
        ctx.beginPath();
        ctx.moveTo(cpTopPrev.x, cpTopPrev.y);
        ctx.lineTo(cpTopCurr.x, cpTopCurr.y);
        ctx.stroke();

        // 2. الحد السفلي (سميك)
        ctx.beginPath();
        ctx.moveTo(cpBottomPrev.x, cpBottomPrev.y);
        ctx.lineTo(cpBottomCurr.x, cpBottomCurr.y);
        ctx.stroke();

        // 3. الحد الأيسر الخارجي (لأول شريك فقط، سميك)
        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(cpTopPrev.x, cpTopPrev.y);
          ctx.lineTo(cpBottomPrev.x, cpBottomPrev.y);
          ctx.stroke();
        }

        // 4. الحد الأيمن الخارجي (لآخر شريك فقط، سميك)
        if (i === piecesToDraw.length - 1) {
          ctx.beginPath();
          ctx.moveTo(cpTopCurr.x, cpTopCurr.y);
          ctx.lineTo(cpBottomCurr.x, cpBottomCurr.y);
          ctx.stroke();
        }

        // 5. الفواصل الداخلية (تكون أقل سماكة)
        if (i > 0 && showCroquisDividers) {
          ctx.lineWidth = Math.max(2, 2.5 * scaleMultiplier);
          ctx.beginPath();
          ctx.moveTo(cpTopPrev.x, cpTopPrev.y);
          ctx.lineTo(cpBottomPrev.x, cpBottomPrev.y);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Slice Centroid for info badge
      const centroidX = (cpTopPrev.x + cpTopCurr.x + cpBottomPrev.x + cpBottomCurr.x) / 4;
      const centroidY = (cpTopPrev.y + cpTopCurr.y + cpBottomPrev.y + cpBottomCurr.y) / 4;

      const heirConv = convertSqmToFeddans(heir.share, caratSize);
      
      // Draw label text horizontally (no rotation) with high contrast black color
      const pieceWidth = Math.abs(cpTopCurr.x - cpTopPrev.x);
      const nameToShow = heir.name || `شريك ${heirIdx + 1}`;
      const pieceMidLength = (pieceLeftL + pieceRightL) / 2;
      
      if (showCroquisNames || showCroquisDimensions || showCroquisAreas || showCroquisNumbers) {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (pieceWidth < Math.max(28, 28 * scaleMultiplier) && !window.isExporting) {
          // Narrow piece: just draw index number if enabled
          if (showCroquisNumbers) {
            const fontSize = Math.round(Math.max(12, 14 * scaleMultiplier) * (croquisFontSize / 13));
            ctx.font = `bold ${fontSize}px Cairo`;
            ctx.fillStyle = "#000000";
            ctx.fillText((heirIdx + 1).toString(), centroidX, centroidY);
          }
        } else {
          // Center line points (top center and bottom center)
          const topCX = (cpTopPrev.x + cpTopCurr.x) / 2;
          const topCY = (cpTopPrev.y + cpTopCurr.y) / 2;
          const botCX = (cpBottomPrev.x + cpBottomCurr.x) / 2;
          const botCY = (cpBottomPrev.y + cpBottomCurr.y) / 2;

          // Interpolation along the boundaries and center line
          const padX = Math.min(16 * scaleMultiplier, pieceWidth * 0.22);
          
          // Left length is close to the left divider (cpTopPrev to cpBottomPrev)
          const leftLenX  = (cpTopPrev.x + 0.16 * (cpBottomPrev.x - cpTopPrev.x)) + padX;
          const leftLenY  = (cpTopPrev.y + 0.16 * (cpBottomPrev.y - cpTopPrev.y));
          
          // Area and Name remain on the center line
          const areaX = topCX + 0.36 * (botCX - topCX);
          const areaY = topCY + 0.36 * (botCY - topCY);
          const nameX = topCX + 0.56 * (botCX - topCX);
          const nameY = topCY + 0.56 * (botCY - topCY);
          
          // Right length is close to the right divider (cpTopCurr to cpBottomCurr)
          const rightLenX  = (cpTopCurr.x + 0.76 * (cpBottomCurr.x - cpTopCurr.x)) - padX;
          const rightLenY  = (cpTopCurr.y + 0.76 * (cpBottomCurr.y - cpTopCurr.y));

          // Dynamic font size based on piece width
          const baseFontSize = Math.min(13.5, Math.max(9.5, pieceWidth * 0.28)) * scaleMultiplier;

          // 1. طول الحد الأيسر رأسي (دوران -90 درجة) في الجزء العلوي
          if (showCroquisDimensions) {
            ctx.save();
            ctx.translate(leftLenX, leftLenY);
            ctx.rotate(-Math.PI / 2);
            ctx.font = `bold ${baseFontSize * (croquisMeasurementSize / 12)}px Cairo`;
            ctx.fillStyle = "#000000";
            ctx.fillText(`${pieceLeftL.toFixed(2)} م`, 0, 0);
            ctx.restore();
          }

          // 2. المساحة رأسي (دوران -90 درجة) تحت طول الحد الأيسر
          if (showCroquisAreas) {
            ctx.save();
            ctx.translate(areaX, areaY);
            ctx.rotate(-Math.PI / 2);
            ctx.font = `bold ${baseFontSize * (croquisFontSize / 13)}px Cairo`;
            ctx.fillStyle = "#000000";
            ctx.fillText(`${(heir.share || 0).toFixed(2)} م²`, 0, 0);
            ctx.restore();
          }

          // 3. الاسم أو الرقم رأسي (دوران -90 درجة) في المنتصف
          if (showCroquisNames) {
            ctx.save();
            ctx.translate(nameX, nameY);
            ctx.rotate(-Math.PI / 2);
            const dispName = nameToShow;
            ctx.font = `bold ${(baseFontSize + 0.5) * (croquisFontSize / 13)}px Cairo`;
            ctx.fillStyle = "#000000";
            ctx.fillText(dispName, 0, 0);
            ctx.restore();
          } else if (showCroquisNumbers) {
            ctx.save();
            ctx.translate(nameX, nameY);
            ctx.rotate(-Math.PI / 2);
            ctx.font = `bold ${(baseFontSize + 0.5) * (croquisFontSize / 13)}px Cairo`;
            ctx.fillStyle = "#000000";
            ctx.fillText((heirIdx + 1).toString(), 0, 0);
            ctx.restore();
          }

          // 4. طول الحد الأيمن رأسي (دوران -90 درجة) في الجزء السفلي
          if (showCroquisDimensions) {
            ctx.save();
            ctx.translate(rightLenX, rightLenY);
            ctx.rotate(-Math.PI / 2);
            ctx.font = `bold ${baseFontSize * (croquisMeasurementSize / 12)}px Cairo`;
            ctx.fillStyle = "#000000";
            ctx.fillText(`${pieceRightL.toFixed(2)} م`, 0, 0);
            ctx.restore();
          }
        }

        // Draw side length labels on the edges
        if (showCroquisDimensions) {
          ctx.font = "bold " + Math.round(Math.max(9, 12 * scaleMultiplier) * (croquisMeasurementSize / 12)) + "px Cairo";
          
          // Top width of piece (Black color for sun readability) with 'م' unit
          ctx.fillStyle = "#000000";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`${pieceTopW.toFixed(2)} م`, (cpTopPrev.x + cpTopCurr.x) / 2, (cpTopPrev.y + cpTopCurr.y) / 2 - 8 * scaleMultiplier);
          
          // Bottom width with 'م' unit
          ctx.fillText(`${pieceBotW.toFixed(2)} م`, (cpBottomPrev.x + cpBottomCurr.x) / 2, (cpBottomPrev.y + cpBottomCurr.y) / 2 + 12 * scaleMultiplier);
          
          // تم إزالة الصناديق البيضاء التي كانت تظهر على خطوط الفواصل والحدود لتطابق مظهر المرفق النظيف تماماً
        }
      }
        // Draw handle for dragging vertical dividers (between slices) - Visually removed as requested
        if (i > 0) {
          const hX = (cpTopPrev.x + cpBottomPrev.x) / 2;
          const hY = (cpTopPrev.y + cpBottomPrev.y) / 2;
          
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

  // --- Render Direction Labels matching Page 11 Golden Reference ---
  if (canvasPoints && canvasPoints.length >= 4 && (activeShape === "trapezoid" || activeShape === "quadrilateral")) {
    const dirs = getP13Directions();
    const dirFontSize = Math.round(Math.max(11, 13 * scaleMultiplier));
    const dirColor = "#1565c0";
    const dirOffset = Math.max(38, 48 * scaleMultiplier);

    const topPts = canvasPoints.filter((_, idx) => idx === 2 || idx === 3);
    const botPts = canvasPoints.filter((_, idx) => idx === 0 || idx === 1);
    const rightPts = canvasPoints.filter((_, idx) => idx === 1 || idx === 2);
    const leftPts = canvasPoints.filter((_, idx) => idx === 0 || idx === 3);

    const topMidX = topPts.reduce((s, p) => s + p.x, 0) / (topPts.length || 1);
    const topMinY = Math.min(...topPts.map(p => p.y));

    const botMidX = botPts.reduce((s, p) => s + p.x, 0) / (botPts.length || 1);
    const botMaxY = Math.max(...botPts.map(p => p.y));

    const rightMaxX = Math.max(...rightPts.map(p => p.x));
    const rightMidY = rightPts.reduce((s, p) => s + p.y, 0) / (rightPts.length || 1);

    const leftMinX = Math.min(...leftPts.map(p => p.x));
    const leftMidY = leftPts.reduce((s, p) => s + p.y, 0) / (leftPts.length || 1);

    function drawDirText(text, x, y, rotateAngle) {
      if (!text) return;
      ctx.save();
      ctx.translate(x, y);
      if (rotateAngle) ctx.rotate(rotateAngle);
      ctx.font = `bold ${dirFontSize}px Cairo`;
      const tw = ctx.measureText(text).width;
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.fillRect(-tw / 2 - 5, -dirFontSize / 2 - 2, tw + 10, dirFontSize + 4);
      ctx.strokeStyle = "#90caf9";
      ctx.lineWidth = 1;
      ctx.strokeRect(-tw / 2 - 5, -dirFontSize / 2 - 2, tw + 10, dirFontSize + 4);
      ctx.fillStyle = dirColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 0, 1);
      ctx.restore();
    }

    drawDirText(dirs.top, topMidX, topMinY - dirOffset, 0);
    drawDirText(dirs.bottom, botMidX, botMaxY + dirOffset, 0);
    drawDirText(dirs.right, rightMaxX + dirOffset, rightMidY, -Math.PI / 2);
    drawDirText(dirs.left, leftMinX - dirOffset, leftMidY, -Math.PI / 2);
  }

  console.log("drawLandCanvas finished");
}

function getP13Directions() {
  const isTrap = (activeShape === "trapezoid");
  const isQuad = (activeShape === "quadrilateral");
  return {
    top: isTrap ? (document.getElementById("p13-trap-c-dir") || {}).value || "شرقي"
                : (isQuad ? (document.getElementById("p13-quad-c-dir") || {}).value || "شرقي" : "أعلى"),
    bottom: isTrap ? (document.getElementById("p13-trap-a-dir") || {}).value || "غربي"
                   : (isQuad ? (document.getElementById("p13-quad-a-dir") || {}).value || "غربي" : "أسفل"),
    right: isTrap ? (document.getElementById("p13-trap-d-dir") || {}).value || "قبلي"
                  : (isQuad ? (document.getElementById("p13-quad-d-dir") || {}).value || "قبلي" : "يمين"),
    left: isTrap ? (document.getElementById("p13-trap-b-dir") || {}).value || "بحري"
                 : (isQuad ? (document.getElementById("p13-quad-b-dir") || {}).value || "بحري" : "يسار")
  };
}
window.getP13Directions = getP13Directions;

// Add partner function for "أضف شريك" button
function addNewHeir(e) {
  if (e && e.preventDefault) e.preventDefault();
  const countInput = document.getElementById("heirs-count");
  let currentCount = parseInt(countInput ? countInput.value : (heirsData ? heirsData.length : 0));
  if (isNaN(currentCount) || currentCount < 0) currentCount = heirsData ? heirsData.length : 0;
  if (currentCount >= 50) {
    if (window.DallalToast) window.DallalToast.show("الحد الأقصى لعدد الشركاء هو 50", "warning");
    return;
  }
  currentCount++;
  if (countInput) countInput.value = currentCount;
  generateHeirsTable();
  saveStateToSession();
}
window.addNewHeir = addNewHeir;

function deleteHeir(id) {
  if (window.Page13PartnersTableAdapter && typeof window.Page13PartnersTableAdapter.removePartner === "function") {
    window.Page13PartnersTableAdapter.removePartner(id);
  }
}
window.deleteHeir = deleteHeir;

// Generate heirs input rows
function generateHeirsTable() {
  const countInput = document.getElementById("heirs-count");
  let count = parseInt(countInput ? countInput.value : 0);
  if (isNaN(count) || count < 0) count = 0;
  
  if (heirsListTbody) heirsListTbody.innerHTML = "";

  if (count === 0) {
    heirsData = [];
    renderHeirsRows();
    updateHeirsDistribution();
    calculateAll();
    return;
  }

  // Re-build heirsData array keeping names if possible
  const oldHeirs = Array.isArray(heirsData) ? [...heirsData] : [];
  heirsData = [];
  
  const equalShare = (calculatedArea > 0 && count > 0) ? (calculatedArea / count) : 0;
  const dims = getLandDimensions();

  for (let i = 0; i < count; i++) {
    const defaultName = `شريك ${i + 1}`;
    const name = (calculatedArea > 0 && oldHeirs[i] && oldHeirs[i].name) ? oldHeirs[i].name : defaultName;
    const share = (calculatedArea > 0 && oldHeirs[i] && typeof oldHeirs[i].share === "number" && oldHeirs[i].share > 0 && oldHeirs.length === count) ? oldHeirs[i].share : equalShare;
    
    const heirObj = {
      id: (oldHeirs[i] && oldHeirs[i].id) ? oldHeirs[i].id : (typeof window.generateUniqueHeirId === "function" ? window.generateUniqueHeirId() : `heir_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`),
      name: name,
      share: (calculatedArea > 0) ? share : 0,
      topW: (calculatedArea > 0) ? (share / calculatedArea) * dims.landTop : 0,
      botW: (calculatedArea > 0) ? (share / calculatedArea) * dims.landBottom : 0
    };
    if (typeof window.initHeirProperties === "function") {
      window.initHeirProperties(heirObj, i);
    }
    heirsData.push(heirObj);
  }

  window.heirsData = heirsData;
  renderHeirsRows();
  updateHeirsDistribution();
  calculateAll();
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
    longPlotView = document.getElementById('long-plot-view'); // keep longPlotView binding if needed
    landTop = parseFloat(document.getElementById('trap-base-minor')?.value) || 0;
  } else if (activeShape === 'quadrilateral') {
    landBottom = parseFloat(document.getElementById('quad-side-a')?.value) || 0;
    landTop = parseFloat(document.getElementById('quad-side-c')?.value) || 0;
  }
  return { landTop, landBottom };
}

function updateHeirsUI() {
  const caratSize = parseFloat(caratSizeInput.value) || 168;
  const showHeightOnly = (activeShape === 'trapezoid' && !showActualDims);
  const trapHeight = showHeightOnly
    ? (parseFloat(document.getElementById('trap-length-right')?.value) || 0)
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
      inputSqm.value = (heir.share || 0).toFixed(2);
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
  if (window.Page13PartnersTableAdapter && typeof window.Page13PartnersTableAdapter.renderTable === "function") {
    window.Page13PartnersTableAdapter.renderTable();
  }
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

// Helper to get exact t split ratios for each partner
function getExactTs() {
  const exactTs = [0];
  let tempCumArea = 0;
  for (let i = 0; i < heirsData.length - 1; i++) {
    tempCumArea += heirsData[i].share;
    exactTs.push(findTForArea(tempCumArea, calculatedArea));
  }
  exactTs.push(1.0);
  return exactTs;
}

// Helper to get physical coordinates of the 4 corners of a piece
function getPieceVertices(tPrev, tCurr) {
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
  return [pBotPrev, pBotCurr, pTopCurr, pTopPrev];
}

// Helper for signed area of a polygon using Shoelace Formula
function getSignedArea(pts) {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return area * 0.5;
}

// [Commit 8 – Land Validation Engine] محرك التحقق الهندسي والطوبولوجي (Plugin Architecture)
window.LandValidationEngine = {
  validators: [],
  
  register: function(name, runFn, isAdvanced) {
    this.validators.push({ name, runFn, isAdvanced: !!isAdvanced });
  },
  
  run: function(runAdvanced) {
    const startTime = performance.now();
    const results = [];
    let passedCount = 0;
    let totalEligible = 0;
    
    const metrics = {
      maxShoelaceError: 0,
      maxBoundaryError: 0,
      unionError: 0,
      totalTimeMs: 0
    };
    
    this.validators.forEach(val => {
      if (val.isAdvanced && !runAdvanced) {
        return; // skip advanced if not requested
      }
      totalEligible++;
      
      const vStart = performance.now();
      let res;
      try {
        res = val.runFn(metrics);
      } catch (e) {
        res = { ok: false, detail: e.message };
      }
      const duration = performance.now() - vStart;
      
      if (res.ok) passedCount++;
      results.push({
        name: val.name,
        ok: res.ok,
        isAdvanced: val.isAdvanced,
        detail: res.detail || "",
        timeMs: duration
      });
    });
    
    metrics.totalTimeMs = performance.now() - startTime;
    const score = totalEligible > 0 ? Math.round((passedCount / totalEligible) * 100) : 0;
    
    let rating = "Weak";
    if (score >= 90) rating = "Excellent";
    else if (score >= 75) rating = "Good";
    else if (score >= 50) rating = "Acceptable";
    
    return {
      ok: passedCount === totalEligible,
      score: score,
      rating: rating,
      results: results,
      metrics: metrics
    };
  }
};

// 1. Orientation Validator
LandValidationEngine.register("Orientation", function(metrics) {
  if (!vertices || vertices.length < 4 || !heirsData || heirsData.length === 0) {
    return { ok: false, detail: "البيانات غير مكتملة" };
  }
  const exactTs = getExactTs();
  let corrected = 0;
  for (let idx = 0; idx < heirsData.length; idx++) {
    const pts = getPieceVertices(exactTs[idx], exactTs[idx + 1]);
    const sArea = getSignedArea(pts);
    if (sArea < 0) {
      pts.reverse(); // Auto-correct to counterclockwise
      corrected++;
    }
  }
  return { ok: true, detail: corrected > 0 ? `تمت إعادة توجيه ${corrected} مضلعات` : "جميع المضلعات موجهة بشكل صحيح" };
});

// 2. Shoelace Validator
LandValidationEngine.register("Shoelace", function(metrics) {
  const exactTs = getExactTs();
  let maxErr = 0;
  let failed = 0;
  for (let idx = 0; idx < heirsData.length; idx++) {
    const pts = getPieceVertices(exactTs[idx], exactTs[idx + 1]);
    let sArea = getSignedArea(pts);
    if (sArea < 0) {
      pts.reverse();
      sArea = getSignedArea(pts);
    }
    const area = Math.abs(sArea);
    const requested = heirsData[idx].share;
    const err = Math.abs(area - requested);
    if (err > maxErr) maxErr = err;
    if (err > 0.001) failed++;
  }
  metrics.maxShoelaceError = maxErr;
  if (failed > 0) {
    return { ok: false, detail: `فشلت ${failed} قطعة. أقصى خطأ: ${maxErr.toFixed(6)} م²` };
  }
  return { ok: true, detail: `مساحات دقيقة تماماً. أقصى خطأ: ${maxErr.toFixed(6)} م²` };
});

// 3. Union Validator
LandValidationEngine.register("Union", function(metrics) {
  const exactTs = getExactTs();
  let sumArea = 0;
  for (let idx = 0; idx < heirsData.length; idx++) {
    const pts = getPieceVertices(exactTs[idx], exactTs[idx + 1]);
    sumArea += Math.abs(getSignedArea(pts));
  }
  const err = Math.abs(sumArea - calculatedArea);
  metrics.unionError = err;
  if (err > 0.001) {
    return { ok: false, detail: `فارق مساحة الاتحاد: ${err.toFixed(6)} م²` };
  }
  return { ok: true, detail: `مجموع المساحات يطابق الأصل تماماً. الفارق: ${err.toFixed(6)} م²` };
});

// 4. No Gaps Validator
LandValidationEngine.register("No Gaps", function(metrics) {
  const exactTs = getExactTs();
  let maxBoundErr = 0;
  for (let idx = 0; idx < heirsData.length - 1; idx++) {
    const ptsCurr = getPieceVertices(exactTs[idx], exactTs[idx + 1]);
    const ptsNext = getPieceVertices(exactTs[idx + 1], exactTs[idx + 2]);
    
    // Check match of current piece right side with next piece left side
    const errBot = Math.hypot(ptsCurr[1].x - ptsNext[0].x, ptsCurr[1].y - ptsNext[0].y);
    const errTop = Math.hypot(ptsCurr[2].x - ptsNext[3].x, ptsCurr[2].y - ptsNext[3].y);
    
    if (errBot > maxBoundErr) maxBoundErr = errBot;
    if (errTop > maxBoundErr) maxBoundErr = errTop;
  }
  metrics.maxBoundaryError = maxBoundErr;
  if (maxBoundErr > 0.001) {
    return { ok: false, detail: `الحدود المشتركة غير متطابقة. أقصى فارق: ${maxBoundErr.toFixed(6)} م` };
  }
  return { ok: true, detail: `تطابق طوبولوجي تام للحدود المشتركة. أقصى انحراف: ${maxBoundErr.toFixed(6)} م` };
});

// 5. Structural Validator
LandValidationEngine.register("Structural", function(metrics) {
  const exactTs = getExactTs();
  for (let i = 0; i < exactTs.length - 1; i++) {
    if (exactTs[i] >= exactTs[i + 1]) {
      return { ok: false, detail: `فشل الترتيب البنيوي: t[${i}] (${exactTs[i]}) >= t[${i+1}] (${exactTs[i+1]})` };
    }
  }
  return { ok: true, detail: "ترتيب خطوط ونسب التقسيم متسق وصارم" };
});

// 6. Numerical Stability Validator
LandValidationEngine.register("Numerical Stability", function(metrics) {
  const exactTs = getExactTs();
  for (let t of exactTs) {
    if (isNaN(t) || !isFinite(t)) {
      return { ok: false, detail: "تولدت قيم غير عددية NaN/Infinity في نسب التقسيم" };
    }
  }
  for (let idx = 0; idx < heirsData.length; idx++) {
    const pts = getPieceVertices(exactTs[idx], exactTs[idx + 1]);
    for (let p of pts) {
      if (isNaN(p.x) || isNaN(p.y) || !isFinite(p.x) || !isFinite(p.y)) {
        return { ok: false, detail: "تولدت قيم غير عددية NaN/Infinity في إحداثيات الرؤوس" };
      }
    }
  }
  return { ok: true, detail: "جميع المتغيرات الحسابية مستقرة تماماً ولا تحتوي NaN/Infinity" };
});

// 7. Separating Line Validator (Advanced - isAdvanced = true)
LandValidationEngine.register("Separating Line", function(metrics) {
  const exactTs = getExactTs();
  
  function sideSign(p, l1, l2) {
    const val = (p.x - l1.x) * (l2.y - l1.y) - (p.y - l1.y) * (l2.x - l1.x);
    return val > 1e-9 ? 1 : (val < -1e-9 ? -1 : 0);
  }
  
  for (let k = 1; k < heirsData.length; k++) {
    const tk = exactTs[k];
    const pBotLine = {
      x: vertices[0].x + tk * (vertices[1].x - vertices[0].x),
      y: vertices[0].y + tk * (vertices[1].y - vertices[0].y)
    };
    const pTopLine = {
      x: vertices[3].x + tk * (vertices[2].x - vertices[3].x),
      y: vertices[3].y + tk * (vertices[2].y - vertices[3].y)
    };
    
    let expectedLeftSign = 0;
    let expectedRightSign = 0;
    
    // Verify pieces left of the line
    for (let i = 0; i < k; i++) {
      const pts = getPieceVertices(exactTs[i], exactTs[i + 1]);
      for (let p of pts) {
        const sign = sideSign(p, pBotLine, pTopLine);
        if (sign !== 0) {
          if (expectedLeftSign === 0) expectedLeftSign = sign;
          else if (expectedLeftSign !== sign) {
            return { ok: false, detail: `تداخل هندسي: نقطة بالقطعة اليسرى ${i+1} تقع خارج الحد الفاصل ${k}` };
          }
        }
      }
    }
    
    // Verify pieces right of the line
    for (let i = k; i < heirsData.length; i++) {
      const pts = getPieceVertices(exactTs[i], exactTs[i + 1]);
      for (let p of pts) {
        const sign = sideSign(p, pBotLine, pTopLine);
        if (sign !== 0) {
          if (expectedRightSign === 0) expectedRightSign = sign;
          else if (expectedRightSign !== sign) {
            return { ok: false, detail: `تداخل هندسي: نقطة بالقطعة اليمنى ${i+1} تقع خارج الحد الفاصل ${k}` };
          }
        }
      }
    }
    
    if (expectedLeftSign !== 0 && expectedRightSign !== 0 && expectedLeftSign === expectedRightSign) {
      return { ok: false, detail: `فشل التباعد الطوبولوجي عند الخط الفاصل رقم ${k}` };
    }
  }
  return { ok: true, detail: "لا يوجد أي تداخل هندسي بين القطع غير المتجاورة" };
}, true);

// Backward-compatibility wrapper for test suites
window.validatePartitionAreasShoelace = function(runAdvanced) {
  const report = LandValidationEngine.run(!!runAdvanced);
  return {
    ok: report.ok,
    sumGeomArea: report.metrics.sumGeomArea || 0,
    totalDiff: report.metrics.unionError,
    report: report // full data
  };
};

function updateHeirsDistribution() {
  let distributedSum = 0;
  let topSum = 0;
  let botSum = 0;
  let fSum = 0, cSum = 0, sSum = 0;

  const caratSize = parseFloat(document.getElementById("carat-size")?.value) || 168;

  if (Array.isArray(heirsData)) {
    heirsData.forEach(h => {
      distributedSum += (h.share || 0);
      topSum += (h.topW || 0);
      botSum += (h.botW || 0);
      if (typeof convertSqmToFeddans === "function") {
        const conv = convertSqmToFeddans(h.share || 0, caratSize);
        fSum += conv.feddans;
        cSum += conv.carats;
        sSum += conv.shares;
      }
    });
  }

  if (window.Page13PartnersTableAdapter && typeof window.Page13PartnersTableAdapter.updateSummary === "function") {
    window.Page13PartnersTableAdapter.updateSummary(distributedSum, fSum, cSum, sSum, topSum, botSum);
  }
}

// Session state storage
function saveStateToSession() {
  sessionStorage.setItem("activeShape", activeShape);
  if (window.DallalStorage) {
    DallalStorage.local.setItem("carat_area", caratSizeInput.value);
  } else {
    localStorage.setItem("dalal-carat-area", caratSizeInput.value);
  }
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
  sessionStorage.setItem("trapLengthRight", document.getElementById("trap-length-right").value);
  sessionStorage.setItem("trapLengthLeft", document.getElementById("trap-length-left").value);

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

  // حفظ اتجاه التقسيم في localStorage
  if (window.DallalStorage) {
    DallalStorage.local.setItem('partition_order_direction', window.partitionOrderDirection || 'rtl');
  } else {
    localStorage.setItem('partitionOrderDirection', window.partitionOrderDirection || 'rtl');
  }
}

function loadStateFromSession() {
  const transferJson = sessionStorage.getItem("divisionInput");
  if (transferJson) {
    try {
      const input = JSON.parse(transferJson);
      if (input && input.source === "Page5") {
        const mappedHeirs = [];
        input.groups.forEach(g => {
          mappedHeirs.push({
            id: g.id,
            name: g.name,
            share: g.totalShare * (168 / 24), // Convert to square meters (1 share = 168/24 sqm)
            color: g.color
          });
        });
        input.individualHeirs.forEach(h => {
          mappedHeirs.push({
            id: h.id,
            name: h.name,
            share: h.share * (168 / 24), // Convert to square meters
            color: null
          });
        });
        
        sessionStorage.setItem("heirsData", JSON.stringify(mappedHeirs));
        sessionStorage.setItem("isDivisionActive", "true");
        sessionStorage.setItem("heirsCount", mappedHeirs.length.toString());
      }
    } catch (err) {
      console.error("Failed to parse divisionInput:", err);
    } finally {
      sessionStorage.removeItem("divisionInput");
    }
  }

  loadCroquisSettings();
  activeShape = sessionStorage.getItem("activeShape") || "trapezoid";
  if (window.DallalStorage) {
    caratSizeInput.value = DallalStorage.local.getItem("carat_area") || "168";
  } else {
    caratSizeInput.value = localStorage.getItem("dalal-carat-area") || "168";
  }
  caratPresetSelect.value = (["168", "171.388", "175", "175.035"].includes(caratSizeInput.value)) ? caratSizeInput.value : "custom";
  
  caratPriceDisplay.value = sessionStorage.getItem("priceDisplay") || "";
  caratPriceNumeric.value = sessionStorage.getItem("priceNumeric") || "";
  adjustPriceFontSize(caratPriceDisplay);

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
  document.getElementById("trap-length-right").value = sessionStorage.getItem("trapLengthRight") || "";
  document.getElementById("trap-length-left").value = sessionStorage.getItem("trapLengthLeft") || "";

  document.getElementById("quad-side-a").value = sessionStorage.getItem("quadSideA") || "";
  document.getElementById("quad-side-b").value = sessionStorage.getItem("quadSideB") || "";
  document.getElementById("quad-side-c").value = sessionStorage.getItem("quadSideC") || "";
  document.getElementById("quad-side-d").value = sessionStorage.getItem("quadSideD") || "";
  document.getElementById("quad-diag-ac").value = sessionStorage.getItem("quadDiagAC") || "";
  document.getElementById("quad-diag-bd").value = sessionStorage.getItem("quadDiagBD") || "";

  // Division panel state
  const savedCount = sessionStorage.getItem("heirsCount");
  const savedHeirs = sessionStorage.getItem("heirsData");
  
  if (savedCount !== null) {
    heirsCountInput.value = savedCount;
    try {
      heirsData = savedHeirs ? JSON.parse(savedHeirs) : [];
    } catch (e) {
      heirsData = [];
    }
  } else {
    heirsCountInput.value = "0";
    heirsData = [];
  }
  
  isDivisionActive = true;
  sessionStorage.setItem("isDivisionActive", "true");
  
  if (divisionPanel) divisionPanel.style.display = "block";
  if (btnToggleDivision) btnToggleDivision.classList.add("active-panel");
  
  const targetCount = parseInt(heirsCountInput.value) || 0;
  if (!heirsData || !Array.isArray(heirsData) || heirsData.length !== targetCount) {
    generateHeirsTable();
  } else {
    renderHeirsRows();
  }

  document.getElementById("long-plot-view").value = sessionStorage.getItem("longPlotView") || "agricultural";
  
  showActualDims = true;

  // استرجاع خيار طريقة عرض الأرقام العشرية
  const savedRounding = sessionStorage.getItem("numberRoundingMode") || "round";
  useTruncateRounding = (savedRounding === "truncate");
  const roundingSelect = document.getElementById("number-rounding-mode");
  if (roundingSelect) {
    roundingSelect.value = savedRounding;
  }

  // استرجاع اتجاه التقسيم من localStorage
  if (window.DallalStorage) {
    window.partitionOrderDirection = DallalStorage.local.getItem('partition_order_direction') || 'rtl';
  } else {
    window.partitionOrderDirection = localStorage.getItem('partitionOrderDirection') || 'rtl';
  }
}

// Print trigger
function printCroquis() {
  if (window.ReportEngine && typeof window.ReportEngine.print === "function") {
    const reportData = (window.Page13Adapter && typeof window.Page13Adapter.buildReportData === "function") 
      ? window.Page13Adapter.buildReportData() 
      : null;
    window.ReportEngine.print(reportData);
    return;
  }
  if (window.Page13Adapter && window.DallalReportTemplate) {
    const reportData = window.Page13Adapter.buildReportData();
    window.DallalReportTemplate.print(reportData);
    return;
  }
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

  // Gather conversions table
  let convRowsHTML = '';
  const convBody = document.getElementById('conversions-tbody');
  if (convBody) {
    const cards = convBody.querySelectorAll('.conv-card');
    cards.forEach(card => {
      const title = card.querySelector('.conv-card-title')?.innerText || '';
      const meterVal = card.querySelector('.conv-card-main-val')?.innerText || '';
      
      const valLess = card.querySelector('.conv-fraction')?.value || '';
      const valFist = card.querySelector('.conv-qabda')?.value || '';
      const valReed = card.querySelector('.conv-qasaba')?.value || '';
      
      convRowsHTML += `
        <tr>
          <td style="font-weight: bold; text-align: right; background-color: #fcfcfc;">${title} (${meterVal})</td>
          <td style="font-weight: bold;">${valLess || '0'}</td>
          <td style="font-weight: bold;">${valFist || '0'}</td>
          <td style="font-weight: bold;">${valReed || '0'}</td>
        </tr>
      `;
    });
  }

  // Summary values
  const totalSqm = document.getElementById('total-sqm')?.innerText || '0';
  const totalPerimeter = document.getElementById('total-perimeter')?.innerText || '0';
  const totalPrice = document.getElementById('total-price')?.innerText || '0';
  const areaShares = document.getElementById('area-shares')?.innerText || '0';
  const areaCarats = document.getElementById('area-carats')?.innerText || '0';
  const areaFeddans = document.getElementById('area-feddans')?.innerText || '0';

  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('ar-EG');
  const reportId = `DL-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  // 1. بيانات الأرض الأساسية
  let shapeNameAr = '';
  let paramsList = [];
  
  if (activeShape === 'rectangle') {
    shapeNameAr = 'أرض مستطيلة';
    paramsList = [
      { label: 'الطول (م)', value: document.getElementById('rect-length').value || '0' },
      { label: 'العرض (م)', value: document.getElementById('rect-width').value || '0' }
    ];
  } else if (activeShape === 'square') {
    shapeNameAr = 'أرض مربعة';
    paramsList = [
      { label: 'طول الضلع (م)', value: document.getElementById('square-side').value || '0' }
    ];
  } else if (activeShape === 'trapezoid') {
    shapeNameAr = 'أرض شبه منحرفة زراعية';
    paramsList = [
      { label: 'القاعدة الكبرى - العرض السفلي A (م)', value: document.getElementById('trap-base-major').value || '0' },
      { label: 'القاعدة الصغرى - العرض العلوي C (م)', value: document.getElementById('trap-base-minor').value || '0' },
      { label: 'الطول الأيمن D (م)', value: document.getElementById('trap-length-right').value || '0' },
      { label: 'الطول الأيسر B (م)', value: document.getElementById('trap-length-left').value || '0' }
    ];
  } else if (activeShape === 'quadrilateral') {
    shapeNameAr = 'أرض رباعية غير منتظمة';
    paramsList = [
      { label: 'الضلع أ - العرض السفلي (م)', value: document.getElementById('quad-side-a').value || '0' },
      { label: 'الضلع ب - الطول الأيسر (م)', value: document.getElementById('quad-side-b').value || '0' },
      { label: 'الضلع ج - العرض العلوي (م)', value: document.getElementById('quad-side-c').value || '0' },
      { label: 'الضلع د - الطول الأيمن (م)', value: document.getElementById('quad-side-d').value || '0' },
      { label: 'الوتر أ-ج (AC) (م)', value: document.getElementById('quad-diag-ac').value || '0' },
      { label: 'الوتر ب-د (BD) (م)', value: document.getElementById('quad-diag-bd').value || '0' }
    ];
  }

  const landParamsHTML = `
    <div class="section page-break-inside-avoid">
      <div class="section-title">1. بيانات الأرض الأساسية</div>
      <table class="report-table">
        <thead>
          <tr>
            <th style="width: 35%;">نوع الشكل</th>
            <th>البيان</th>
            <th style="width: 35%;">القيمة المقاسة</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td rowspan="${paramsList.length + 1}" style="font-weight: bold; font-size: 11pt; background-color: #f9fbe7; color: #1b5e20; vertical-align: middle;">${shapeNameAr}</td>
          </tr>
          ${paramsList.map(p => `
            <tr>
              <td style="text-align: right; padding-right: 15px;">${p.label}</td>
              <td style="font-weight: bold; color: #1b5e20;">${p.value} م</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  // 2. النتائج الإجمالية للمساحة
  const areaResultsHTML = `
    <div class="section page-break-inside-avoid">
      <div class="section-title">2. النتائج الإجمالية للمساحة</div>
      <table class="report-table" style="margin-bottom: 15px;">
        <thead>
          <tr>
            <th>سهم</th>
            <th>قيراط</th>
            <th>فدان</th>
          </tr>
        </thead>
        <tbody>
          <tr style="font-size: 11pt; font-weight: bold; background-color: #f1f8e9;">
            <td>${areaShares}</td>
            <td>${areaCarats}</td>
            <td>${areaFeddans}</td>
          </tr>
        </tbody>
      </table>
      <div class="summary-grid">
        <div class="summary-card">
          <span class="label">إجمالي الأمتار المربعة</span>
          <span class="value">${totalSqm} م²</span>
        </div>
        <div class="summary-card">
          <span class="label">المحيط الإجمالي للأرض</span>
          <span class="value">${totalPerimeter} م</span>
        </div>
        <div class="summary-card">
          <span class="label">إجمالي سعر قطعة الأرض</span>
          <span class="value">${totalPrice} ج</span>
        </div>
      </div>
    </div>
  `;

  // 3. بيانات العرض المحسوبة
  let avgWidth = 0;
  let avgLength = 0;
  if (activeShape === 'rectangle') {
    avgWidth = parseFloat(document.getElementById("rect-width").value) || 0;
    avgLength = parseFloat(document.getElementById("rect-length").value) || 0;
  } else if (activeShape === 'square') {
    avgWidth = parseFloat(document.getElementById("square-side").value) || 0;
    avgLength = avgWidth;
  } else if (activeShape === 'trapezoid') {
    const a = parseFloat(document.getElementById("trap-base-major").value) || 0;
    const c = parseFloat(document.getElementById("trap-base-minor").value) || 0;
    const l1 = parseFloat(document.getElementById("trap-length-right")?.value) || 0;
    const l2 = parseFloat(document.getElementById("trap-length-left")?.value) || 0;
    avgWidth = 0.5 * (a + c);
    avgLength = 0.5 * (l1 + l2);
  } else if (activeShape === 'quadrilateral') {
    const aVal = parseFloat(document.getElementById("quad-side-a").value) || 0;
    const bVal = parseFloat(document.getElementById("quad-side-b").value) || 0;
    const cVal = parseFloat(document.getElementById("quad-side-c").value) || 0;
    const dVal = parseFloat(document.getElementById("quad-side-d").value) || 0;
    avgWidth = 0.5 * (aVal + cVal);
    avgLength = 0.5 * (bVal + dVal);
  }

  const calculatedWidthsHTML = `
    <div class="section page-break-inside-avoid">
      <div class="section-title">3. بيانات العرض والارتفاع المحسوبة</div>
      <table class="report-table">
        <thead>
          <tr>
            <th>البيان المحسوب</th>
            <th>القيمة بالمتـر</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align: right; padding-right: 15px;">معدل العرض (متوسط القواعد الأفقي)</td>
            <td style="font-weight: bold; color: #1b5e20;">${avgWidth.toFixed(4)} م</td>
          </tr>
          <tr>
            <td style="text-align: right; padding-right: 15px;">متوسط الطول (متوسط الارتفاعات الرأسي)</td>
            <td style="font-weight: bold; color: #1b5e20;">${avgLength.toFixed(4)} م</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  // 4. الكروكي التفاعلي
  const croquisHTML = `
    <div class="section page-break-inside-avoid" style="text-align: center;">
      <div class="section-title">4. الكروكي التفاعلي ومخطط الأرض</div>
      <div class="croquis-box">
        <img src="${canvasDataURL}" alt="كروكي الأرض"/>
      </div>
    </div>
  `;

  // 5. جدول توزيع الشركاء
  const hasPartners = heirsRows.trim() !== '';
  const partnersTableHTML = hasPartners ? `
    <div class="section">
      <div class="section-title">5. جدول توزيع الأنصبة على الشركاء</div>
      <table class="report-table">
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
        <tbody>
          ${heirsRows}
        </tbody>
      </table>
    </div>
  ` : '';

  // 6. ملخص التقسيم
  const totalAreaVal = parseFloat(totalLimitArea.replace(/,/g, '')) || parseFloat(totalSqm.replace(/,/g, '')) || 0;
  const distAreaVal = parseFloat(distributedArea.replace(/,/g, '')) || 0;
  const remAreaVal = Math.max(0, totalAreaVal - distAreaVal);
  const distPercent = totalAreaVal > 0 ? ((distAreaVal / totalAreaVal) * 100).toFixed(2) : '0.00';
  const heirsListRows = heirsBody ? heirsBody.querySelectorAll('.heir-row') : [];
  const numPartners = heirsListRows.length || heirsData.length || 0;
  const statusEl = document.getElementById('distribution-status');
  const divisionStatusText = statusEl ? statusEl.innerText.trim() : (totalAreaVal === distAreaVal ? 'التوزيع متطابق 100%' : 'توجد مساحة غير موزعة');

  const summaryBoxHTML = `
    <div class="section page-break-inside-avoid">
      <div class="section-title">6. ملخص نهائي لعملية التقسيم</div>
      <div class="summary-box">
        <div class="summary-box-row">
          <div class="summary-box-cell"><strong>المساحة الإجمالية للأرض:</strong> <span>${totalAreaVal.toFixed(2)} م²</span></div>
          <div class="summary-box-cell"><strong>عدد الشركاء:</strong> <span>${numPartners} شركاء</span></div>
        </div>
        <div class="summary-box-row">
          <div class="summary-box-cell"><strong>مجموع المساحات الموزعة:</strong> <span>${distAreaVal.toFixed(2)} م²</span></div>
          <div class="summary-box-cell"><strong>نسبة التوزيع:</strong> <span>${distPercent}%</span></div>
        </div>
        <div class="summary-box-row">
          <div class="summary-box-cell"><strong>حالة التقسيم:</strong> <span class="status-badge">${divisionStatusText}</span></div>
          <div class="summary-box-cell"><strong>المساحة المتبقية (إن وجدت):</strong> <span>${remAreaVal.toFixed(2)} م²</span></div>
        </div>
      </div>
    </div>
  `;

  // 7. التحويل من متر طولي ومربع إلى القصبة والقبضة
  const conversionsSectionHTML = convRowsHTML ? `
    <div class="section page-break-inside-avoid">
      <div class="section-title">7. التحويل من متر طولي ومربع إلى القصبة والقبضة</div>
      <table class="report-table">
        <thead>
          <tr>
            <th>البعد / المساحة المحولة</th>
            <th>أقل من القبضة</th>
            <th>قبضة</th>
            <th>قصبة</th>
          </tr>
        </thead>
        <tbody>
          ${convRowsHTML}
        </tbody>
      </table>
    </div>
  ` : '';

  const printHTML = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <title>تقرير تقسيم الأرض - الدلال</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page {
      size: A4 portrait;
      margin: 15mm 12mm 15mm 12mm;
    }
    body {
      font-family: 'Cairo', sans-serif;
      background: #fff;
      color: #222;
      font-size: 9.5pt;
      direction: rtl;
      padding-bottom: 35px;
      position: relative;
    }
    
    /* ── رأس التقرير ──────────────────────────── */
    .report-header {
      border: 2px solid #1b5e20;
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 12px;
      display: grid;
      grid-template-columns: 1.2fr 2fr 1.2fr;
      align-items: center;
      background: #f1f8e9;
    }
    .report-header-right {
      text-align: right;
    }
    .report-header-right h1 {
      font-size: 20pt;
      color: #1b5e20;
      font-weight: 800;
      margin: 0;
    }
    .report-header-right p {
      font-size: 9pt;
      color: #388e3c;
      margin: 2px 0 0;
      font-weight: 600;
    }
    .report-header-center {
      text-align: center;
      padding: 0 10px;
    }
    .report-header-center h2 {
      font-size: 12.5pt;
      color: #1b5e20;
      font-weight: 700;
      margin: 0;
      line-height: 1.4;
    }
    .report-header-left {
      text-align: left;
      font-size: 8pt;
      color: #333;
      line-height: 1.5;
    }
    .owner-info {
      margin-bottom: 15px;
      font-size: 10pt;
      border-bottom: 1px dashed #ccc;
      padding-bottom: 6px;
      display: flex;
      gap: 10px;
    }
    .placeholder-line {
      color: #aaa;
      letter-spacing: 1px;
    }

    /* ── الأقسام والعناصر ─────────────────────── */
    .section {
      margin-bottom: 15px;
    }
    .section-title {
      background: #1b5e20;
      color: white;
      font-weight: 700;
      font-size: 10.5pt;
      padding: 5px 12px;
      border-right: 5px solid #2e7d32;
      margin-bottom: 8px;
      border-radius: 4px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    /* ── الجداول ────────────────────────────── */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin-bottom: 8px;
    }
    th {
      background: #e8f5e9;
      color: #1b5e20;
      font-weight: 700;
      border: 1px solid #1b5e20;
      padding: 6px 4px;
      text-align: center;
      white-space: nowrap;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    td {
      border: 1px solid #a5d6a7;
      padding: 5px 4px;
      text-align: center;
      vertical-align: middle;
    }
    tr:nth-child(even) td {
      background: #f9fbe7;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    /* إزالة حدود حقول الإدخال لتظهر كنصوص عادية */
    td input {
      border: none !important;
      background: transparent !important;
      text-align: center !important;
      font-family: 'Cairo', sans-serif !important;
      font-size: 9pt !important;
      font-weight: bold !important;
      width: 100% !important;
      color: #000000 !important;
      pointer-events: none !important;
    }
    td select {
      display: none !important;
    }

    /* ── الكروكي ────────────────────────────── */
    .croquis-box {
      border: 2px solid #1b5e20;
      border-radius: 8px;
      padding: 8px;
      background: #ffffff;
      display: inline-block;
      margin: 0 auto;
    }
    .croquis-box img {
      max-width: 100%;
      max-height: 250px;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }

    /* ── خلاصة المساحة ───────────────────────── */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 8px;
    }
    .summary-card {
      border: 1.5px solid #1b5e20;
      border-radius: 6px;
      padding: 6px 8px;
      text-align: center;
      background: #f1f8e9;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .summary-card .label {
      font-size: 8pt;
      color: #555;
      display: block;
      margin-bottom: 2px;
    }
    .summary-card .value {
      font-size: 11pt;
      font-weight: 700;
      color: #1b5e20;
    }

    /* ── ملخص التقسيم ───────────────────────── */
    .summary-box {
      border: 2px solid #1b5e20;
      border-radius: 8px;
      background: #f1f8e9;
      padding: 10px 15px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .summary-box-row {
      display: flex;
      justify-content: space-between;
      gap: 20px;
    }
    .summary-box-cell {
      flex: 1;
      font-size: 9.5pt;
      color: #222;
    }
    .summary-box-cell strong {
      color: #1b5e20;
    }
    .status-badge {
      display: inline-block;
      padding: 1px 8px;
      background-color: #c8e6c9;
      color: #2e7d32;
      border-radius: 4px;
      font-weight: bold;
      font-size: 9pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── العلامة المائية ──────────────────────── */
    .watermark-container {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-25deg);
      font-size: 26pt;
      font-weight: 800;
      color: #000000;
      opacity: 0.06;
      white-space: nowrap;
      pointer-events: none;
      z-index: -1000;
      font-family: 'Cairo', Arial, sans-serif;
      text-align: center;
      width: 100%;
    }

    /* ── تذييل الصفحة ────────────────────────── */
    .report-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      font-size: 8pt;
      color: #444;
      border-top: 1.5px solid #1b5e20;
      padding: 4px 10px 3px;
      background: white;
      gap: 1px;
    }
    .footer-main-text {
      font-size: 8.5pt;
      font-weight: 700;
      color: #222;
    }
    .footer-sub-text {
      font-size: 7.5pt;
      color: #888;
    }

    /* ── تحسينات الطباعة والصفحات ─────────────── */
    .page-break-inside-avoid {
      page-break-inside: avoid;
    }
    @media print {
      body {
        background: #fff !important;
        color: #000 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .no-print {
        display: none !important;
      }
      .report-header {
        border-color: #000 !important;
        background: #fcfcfc !important;
      }
      .section-title {
        background: #000 !important;
        color: #fff !important;
        border-right-color: #333 !important;
      }
      th {
        background: #f2f2f2 !important;
        color: #000 !important;
        border-color: #000 !important;
      }
      td {
        border-color: #ccc !important;
      }
      .summary-card {
        border-color: #000 !important;
        background: #fff !important;
      }
      .summary-box {
        border-color: #000 !important;
        background: #fff !important;
      }
      .report-footer {
        border-top-color: #000 !important;
      }
      .croquis-box {
        border-color: #000 !important;
      }
      .status-badge {
        background: #eee !important;
        color: #000 !important;
        border: 1px solid #aaa !important;
      }
      .watermark-container {
        opacity: 0.05 !important;
      }
    }
  </style>
</head>
<body>

  <!-- Watermark -->
  <div class="watermark-container">
    تم تنفيذ هذا التقرير باستخدام تطبيق الدَّلاَّل لقياسات الأراضي، والمتوفر على Google Play.
  </div>

  <!-- Header -->
  <div class="report-header">
    <div class="report-header-right">
      <h1>الدَّلاَّل</h1>
      <p>تطبيق قياس وتقسيم الأراضي</p>
    </div>
    <div class="report-header-center">
      <h2>تقرير حساب وتقسيم الأراضي الزراعية</h2>
    </div>
    <div class="report-header-left">
      <div><strong>تاريخ التقرير:</strong> ${dateStr}</div>
      <div><strong>وقت الطباعة:</strong> ${timeStr}</div>
      <div><strong>رقم التقرير:</strong> ${reportId}</div>
    </div>
  </div>

  <!-- Owner Info -->
  <div class="owner-info">
    <strong>اسم المالك / المستخدم:</strong>
    <span class="placeholder-line">................................................................................................</span>
  </div>

  <!-- Sections ordered according to requirements -->
  
  <!-- 1. بيانات الأرض -->
  ${landParamsHTML}

  <!-- 2. النتائج الإجمالية للمساحة -->
  ${areaResultsHTML}

  <!-- 3. بيانات العرض المحسوبة -->
  ${calculatedWidthsHTML}

  <!-- 4. الكروكي التفاعلي -->
  ${croquisHTML}

  <!-- 5. جدول توزيع الشركاء -->
  ${partnersTableHTML}

  <!-- 6. ملخص التقسيم -->
  ${summaryBoxHTML}

  <!-- 7. التحويل من متر طولي ومربع إلى القصبة والقبضة -->
  ${conversionsSectionHTML}

  <!-- Fixed Footer -->
  <div class="report-footer">
    <div class="footer-main-text">تم تنفيذ هذا التقرير باستخدام تطبيق الدَّلاَّل لقياسات الأراضي، والمتوفر على Google Play.</div>
    <div class="footer-sub-text">
      <span>تطبيق الدَّلاَّل لقياسات الأراضي الزراعية © ${now.getFullYear()}</span>
      <span> | تاريخ الطباعة: ${dateStr} - ${timeStr}</span>
      <span> | إصدار التطبيق: v2.4</span>
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

// ============================================================
// INTERACTIVE CAD INSPECTOR & BI-DIRECTIONAL HIGHLIGHTS HELPERS
// ============================================================

function isPointInPolygon(px, py, polygon) {
  let isInside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > py) !== (yj > py))
        && (px < (xj - xi) * (py - yi) / (yj - yi || 1) + xi);
    if (intersect) isInside = !isInside;
  }
  return isInside;
}

function closeInspector(event) {
  if (event) event.stopPropagation();
  window.selectedPieceIndex = null;
  window.hoveredPieceIndex = null;
  drawLandCanvas(vertices);
  document.querySelectorAll("#heirs-list tr").forEach(row => {
    row.classList.remove("partner-row-highlighted");
  });
  const inspector = document.getElementById("croquis-inspector");
  if (inspector) inspector.style.display = "none";
}

function updateInspector(index) {
  if (!heirsData || !heirsData[index]) return;
  const heir = heirsData[index];
  
  const inspector = document.getElementById("croquis-inspector");
  const partnerNameEl = document.getElementById("inspector-partner-name");
  const insAreaEl = document.getElementById("ins-area");
  const insPercentEl = document.getElementById("ins-percent");
  const insWBottomEl = document.getElementById("ins-w-bottom");
  const insWTopEl = document.getElementById("ins-w-top");
  const insLengthRightEl = document.getElementById("ins-length-right");
  const insLengthLeftEl = document.getElementById("ins-length-left");
  const insLblRightEl = document.getElementById("ins-lbl-right");
  const insLblLeftEl = document.getElementById("ins-lbl-left");
  const insDividerRow = document.getElementById("ins-divider-row");
  const insDividerEl = document.getElementById("ins-divider");
  
  if (!inspector) return;

  if (insLblRightEl) {
    insLblRightEl.innerText = "الطول الأيمن:";
  }
  if (insLblLeftEl) {
    insLblLeftEl.innerText = "الطول الأيسر:";
  }
  
  // Set partner/heir name
  if (partnerNameEl) {
    partnerNameEl.innerText = `قطعة الشريك: ${heir.name}`;
    partnerNameEl.style.color = "#ffffff";
  }
  
  // Area and conversion to feddan/carat/sahm
  const caratSize = parseFloat(caratSizeInput.value) || 168;
  const pct = calculatedArea > 0 ? ((heir.share || 0) / calculatedArea) * 100 : 0;
  const conv = convertSqmToFeddans(heir.share || 0, caratSize);
  
  if (insAreaEl) {
    insAreaEl.innerHTML = `${Number((heir.share || 0).toFixed(2))} م² <br><span style="font-size: 10.5px; color: #1565c0; font-weight: normal;">(${conv.feddans} فدان، ${conv.carats} ق، ${conv.shares.toFixed(2)} س)</span>`;
  }
  
  if (insPercentEl) {
    insPercentEl.innerText = `${pct.toFixed(2)} %`;
  }
  
  if (insWBottomEl) {
    insWBottomEl.innerText = `${(heir.botW || 0).toFixed(2)} م`;
  }
  
  if (insWTopEl) {
    insWTopEl.innerText = `${(heir.topW || 0).toFixed(2)} م`;
  }
  
  // In division geometry: heir.rightL represents left bound line of piece, heir.leftL represents right divider line of piece
  if (insLengthRightEl) {
    insLengthRightEl.innerText = `${(heir.rightL || 0).toFixed(2)} م`;
  }
  
  if (insLengthLeftEl) {
    insLengthLeftEl.innerText = `${(heir.leftL || 0).toFixed(2)} م`;
  }
  
  // Divider row is permanently hidden per the new UI design
  if (insDividerRow) insDividerRow.style.setProperty('display', 'none', 'important');
  if (insDividerEl) insDividerEl.innerText = `${(heir.rightL || 0).toFixed(2)} م`;
  
  inspector.style.display = "block";
}

function selectPiece(index) {
  if (window.selectedPieceIndex === index) {
    // Unselect on second click
    window.selectedPieceIndex = null;
    window.hoveredPieceIndex = null;
    drawLandCanvas(vertices);
    document.querySelectorAll("#heirs-list tr").forEach(row => {
      row.classList.remove("partner-row-highlighted");
    });
    const inspector = document.getElementById("croquis-inspector");
    if (inspector) inspector.style.display = "none";
    return;
  }

  window.selectedPieceIndex = index;
  drawLandCanvas(vertices);

  // Sync table scroll
  document.querySelectorAll("#heirs-list tr").forEach(row => {
    row.classList.remove("partner-row-highlighted");
  });
  const row = document.querySelector(`#heirs-list tr[data-index="${index}"]`);
  if (row) {
    row.classList.add("partner-row-highlighted");
    row.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  updateInspector(index);
}

function setupCanvasInteractions() {
  const canvas = document.getElementById("landCanvas");
  if (!canvas) return;

  canvas.addEventListener("mousemove", (e) => {
    if (!isDivisionActive || heirsData.length === 0 || !window.canvasPiecesGeometry) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let foundIndex = null;
    for (let i = 0; i < window.canvasPiecesGeometry.length; i++) {
      if (isPointInPolygon(x, y, window.canvasPiecesGeometry[i])) {
        foundIndex = i;
        break;
      }
    }

    if (window.hoveredPieceIndex !== foundIndex) {
      window.hoveredPieceIndex = foundIndex;
      drawLandCanvas(vertices);

      // Highlight corresponding row in heirs table
      document.querySelectorAll("#heirs-list tr").forEach(row => {
        row.classList.remove("partner-row-highlighted");
      });
      if (foundIndex !== null) {
        const row = document.querySelector(`#heirs-list tr[data-index="${foundIndex}"]`);
        if (row) row.classList.add("partner-row-highlighted");
        updateInspector(foundIndex);
      } else if (window.selectedPieceIndex !== null) {
        updateInspector(window.selectedPieceIndex);
        const row = document.querySelector(`#heirs-list tr[data-index="${window.selectedPieceIndex}"]`);
        if (row) row.classList.add("partner-row-highlighted");
      } else {
        const inspector = document.getElementById("croquis-inspector");
        if (inspector) inspector.style.display = "none";
      }
    }
  });

  canvas.addEventListener("mouseleave", () => {
    window.hoveredPieceIndex = null;
    drawLandCanvas(vertices);
    document.querySelectorAll("#heirs-list tr").forEach(row => {
      row.classList.remove("partner-row-highlighted");
    });
    if (window.selectedPieceIndex !== null) {
      const row = document.querySelector(`#heirs-list tr[data-index="${window.selectedPieceIndex}"]`);
      if (row) row.classList.add("partner-row-highlighted");
      updateInspector(window.selectedPieceIndex);
    } else {
      const inspector = document.getElementById("croquis-inspector");
      if (inspector) inspector.style.display = "none";
    }
  });

  canvas.addEventListener("click", (e) => {
    if (!isDivisionActive || heirsData.length === 0 || !window.canvasPiecesGeometry) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let foundIndex = null;
    for (let i = 0; i < window.canvasPiecesGeometry.length; i++) {
      if (isPointInPolygon(x, y, window.canvasPiecesGeometry[i])) {
        foundIndex = i;
        break;
      }
    }

    if (foundIndex !== null) {
      selectPiece(foundIndex);
    } else {
      window.selectedPieceIndex = null;
      window.hoveredPieceIndex = null;
      drawLandCanvas(vertices);
      document.querySelectorAll("#heirs-list tr").forEach(row => {
        row.classList.remove("partner-row-highlighted");
      });
      const inspector = document.getElementById("croquis-inspector");
      if (inspector) inspector.style.display = "none";
    }
  });
}

// Bind delegates for heirs list table rows
document.addEventListener("DOMContentLoaded", () => {
  setupCanvasInteractions();
  
  const heirsList = document.getElementById("heirs-list");
  if (heirsList) {
    heirsList.addEventListener("mouseenter", (e) => {
      const row = e.target.closest("tr");
      if (row && row.hasAttribute("data-index")) {
        const idx = parseInt(row.getAttribute("data-index"));
        window.hoveredPieceIndex = idx;
        drawLandCanvas(vertices);
        row.classList.add("partner-row-highlighted");
      }
    }, true);
    
    heirsList.addEventListener("mouseleave", (e) => {
      const row = e.target.closest("tr");
      if (row && row.hasAttribute("data-index")) {
        window.hoveredPieceIndex = null;
        drawLandCanvas(vertices);
        row.classList.remove("partner-row-highlighted");
        
        // Re-apply select highlight if any
        if (window.selectedPieceIndex !== null) {
          const selRow = document.querySelector(`#heirs-list tr[data-index="${window.selectedPieceIndex}"]`);
          if (selRow) selRow.classList.add("partner-row-highlighted");
        }
      }
    }, true);
    
    heirsList.addEventListener("click", (e) => {
      const row = e.target.closest("tr");
      if (row && row.hasAttribute("data-index")) {
        if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
        const idx = parseInt(row.getAttribute("data-index"));
        selectPiece(idx);
      }
    }, true);
  }
});

// --- دليل التنفيذ الحقلي الذكي للمهندسين والمساحين ---
function buildFieldGuideData() {
  if (typeof isDivisionActive === "undefined" || !isDivisionActive) return null;
  if (!heirsData || heirsData.length <= 1) return null;
  if (!vertices || vertices.length < 4) return null;
  if (!window.canvasPiecesGeometry || window.canvasPiecesGeometry.length === 0) return null;

  const pA = vertices[0];
  const pB = vertices[1];
  const pC = vertices[2];
  const pD = vertices[3];

  if (!pA || !pB || !pC || !pD) return null;

  const L_top    = Math.hypot(pC.x - pD.x, pC.y - pD.y);
  const L_bottom = Math.hypot(pB.x - pA.x, pB.y - pA.y);
  const L_left   = Math.hypot(pD.x - pA.x, pD.y - pA.y);
  const L_right  = Math.hypot(pC.x - pB.x, pC.y - pB.y);

  const isRTL = (window.partitionOrderDirection === 'rtl');

  // Build exactTs using shares ordered as they appear on the land (L→R)
  const orderedShares = isRTL
    ? heirsData.map(h => h.share || 0).reverse()
    : heirsData.map(h => h.share || 0);

  const exactTs = [0];
  let tempCumArea = 0;
  for (let i = 0; i < heirsData.length - 1; i++) {
    if (typeof calculatedArea !== "number" || calculatedArea <= 0) return null;
    tempCumArea += orderedShares[i];
    exactTs.push(findTForArea(tempCumArea, calculatedArea));
  }
  exactTs.push(1.0);

  const stakes = [];
  const boundaryRopes = [];
  const dividerRopes = [];
  const steps = [];

  if (isRTL) {
    // RTL: starting corner is C (top-right) and B (bottom-right)
    stakes.push({ id: "C", name: "الركن العلوي الأيمن (C)", coords: pC, desc: "نقطة الركن الأساسية لبداية القياس العلوي (بداية التقسيم من اليمين)." });
    stakes.push({ id: "D", name: "الركن العلوي الأيسر (D)", coords: pD, desc: `يقع على بعد ${L_top.toFixed(2)} م من الركن العلوي الأيمن (C) على طول الضلع العلوي.` });
    stakes.push({ id: "B", name: "الركن السفلي الأيمن (B)", coords: pB, desc: `يقع على بعد ${L_right.toFixed(2)} م من الركن العلوي الأيمن (C) على طول الضلع الأيمن.` });
    stakes.push({ id: "A", name: "الركن السفلي الأيسر (A)", coords: pA, desc: `يقع على بعد ${L_left.toFixed(2)} م من الركن العلوي الأيسر (D) على طول الضلع الأيسر.` });
  } else {
    // LTR: starting corner is D (top-left) and A (bottom-left)
    stakes.push({ id: "D", name: "الركن العلوي الأيسر (D)", coords: pD, desc: "نقطة الركن الأساسية لبداية القياس العلوي." });
    stakes.push({ id: "C", name: "الركن العلوي الأيمن (C)", coords: pC, desc: `يقع على بعد ${L_top.toFixed(2)} م من الركن العلوي الأيسر (D) على طول الضلع العلوي.` });
    stakes.push({ id: "B", name: "الركن السفلي الأيمن (B)", coords: pB, desc: `يقع على بعد ${L_right.toFixed(2)} م من الركن العلوي الأيمن (C) على طول الضلع الأيمن.` });
    stakes.push({ id: "A", name: "الركن السفلي الأيسر (A)", coords: pA, desc: `يقع على بعد ${L_left.toFixed(2)} م من الركن العلوي الأيسر (D) على طول الضلع الأيسر.` });
  }

  boundaryRopes.push({ name: "الحد العلوي (D ↔ C)", length: L_top, from: "D", to: "C" });
  boundaryRopes.push({ name: "الحد السفلي (A ↔ B)", length: L_bottom, from: "A", to: "B" });
  boundaryRopes.push({ name: "الحد الأيسر (D ↔ A)", length: L_left, from: "D", to: "A" });
  boundaryRopes.push({ name: "الحد الأيمن (C ↔ B)", length: L_right, from: "C", to: "B" });

  // Divider stakes and ropes
  // For RTL, cumulative measurement runs from right edge (t=1) towards left (t=0)
  let cumTop = 0;
  let cumBot = 0;

  for (let i = 0; i < heirsData.length - 1; i++) {
    // orderedShares[i] is the i-th slice from the starting edge
    const heirForSlice = isRTL ? heirsData[heirsData.length - 1 - i] : heirsData[i];
    cumTop += heirForSlice.topW || 0;
    cumBot += heirForSlice.botW || 0;

    // t value from left (geometry):
    const t = exactTs[i + 1];
    const pT = { x: pD.x + t * (pC.x - pD.x), y: pD.y + t * (pC.y - pD.y) };
    const pBg = { x: pA.x + t * (pB.x - pA.x), y: pA.y + t * (pB.y - pA.y) };

    const tId = `T${i + 1}`;
    const bId = `B${i + 1}`;

    const nextHeir = isRTL ? heirsData[heirsData.length - 2 - i] : heirsData[i + 1];

    if (isRTL) {
      // Distance measured from the right edge: L_top - cumTop for top, L_bottom - cumBot for bottom
      stakes.push({ id: tId, name: `وتد الفصل العلوي رقم ${i + 1} (${tId})`, coords: pT, desc: `قس مسافة ${cumTop.toFixed(2)} م من الركن العلوي الأيمن (C) باتجاه الركن العلوي الأيسر (D).` });
      stakes.push({ id: bId, name: `وتد الفصل السفلي رقم ${i + 1} (${bId})`, coords: pBg, desc: `قس مسافة ${cumBot.toFixed(2)} م من الركن السفلي الأيمن (B) باتجاه الركن السفلي الأيسر (A).` });
    } else {
      stakes.push({ id: tId, name: `وتد الفصل العلوي رقم ${i + 1} (${tId})`, coords: pT, desc: `قس مسافة ${cumTop.toFixed(2)} م من الركن العلوي الأيسر (D) باتجاه الركن العلوي الأيمن (C).` });
      stakes.push({ id: bId, name: `وتد الفصل السفلي رقم ${i + 1} (${bId})`, coords: pBg, desc: `قس مسافة ${cumBot.toFixed(2)} م من الركن السفلي الأيسر (A) باتجاه الركن السفلي الأيمن (B).` });
    }

    const dividerLength = Math.hypot(pT.x - pBg.x, pT.y - pBg.y);
    dividerRopes.push({
      name: `الحبل الفاصل رقم ${i + 1} بين ${heirForSlice.name || `الشريك ${i + 1}`} و ${(nextHeir && nextHeir.name) || `الشريك ${i + 2}`}`,
      length: dividerLength,
      from: tId,
      to: bId
    });
  }

  if (isRTL) {
    steps.push("دق الأوتاد الأربعة الأساسية عند أركان الأرض الخارجية: الركن السفلي الأيمن (B)، العلوي الأيمن (C)، العلوي الأيسر (D)، والسفلي الأيسر (A).");
    steps.push(`شد الحبال الأربعة الخارجية لتأكيد الحدود: الحد العلوي (${L_top.toFixed(2)} م)، السفلي (${L_bottom.toFixed(2)} م)، الأيسر (${L_left.toFixed(2)} م)، والأيمن (${L_right.toFixed(2)} م).`);
    if (heirsData.length > 1) {
      steps.push("ابدأ بالقياس على الضلع العلوي من الركن العلوي الأيمن (C) باتجاه الضلع الأيسر، ودق أوتاد الفصل العلوية بالتتابع حسب المسافات الموضحة.");
      steps.push("انتقل إلى الضلع السفلي وابدأ بالقياس من الركن السفلي الأيمن (B) باتجاه الضلع الأيسر، ودق أوتاد الفصل السفلية بالتتابع.");
      steps.push("شد الحبال الفاصلة المستقيمة بين كل وتد علوي ووتد سفلي مقابل له (T1 مع B1، T2 مع B2، وهكذا).");
      steps.push("لضمان دقة العمل، قس الأطوال الفعلية للحبال الفاصلة في الطبيعة وقارنها بالأطوال المحسوبة في الجدول.");
    }
  } else {
    steps.push("دق الأوتاد الأربعة الأساسية عند أركان الأرض الخارجية: الركن السفلي الأيسر (A)، السفلي الأيمن (B)، العلوي الأيمن (C)، والعلوي الأيسر (D).");
    steps.push(`شد الحبال الأربعة الخارجية لتأكيد الحدود ومطابقة القياسات مع المدخلات الفعلية: الحد العلوي (${L_top.toFixed(2)} م)، السفلي (${L_bottom.toFixed(2)} م)، الأيسر (${L_left.toFixed(2)} م)، والأيمن (${L_right.toFixed(2)} م).`);
    if (heirsData.length > 1) {
      steps.push("ابدأ بالقياس على الضلع العلوي من الركن العلوي الأيسر (D) باتجاه الضلع الأيمن، ودق أوتاد الفصل العلوية بالتتابع حسب المسافات الموضحة.");
      steps.push("انتقل إلى الضلع السفلي والافتتاح بالقياس من الركن السفلي الأيسر (A) باتجاه الضلع الأيمن، ودق أوتاد الفصل السفلية بالتتابع حسب المسافات الموضحة.");
      steps.push("شد الحبال الفاصلة المستقيمة بين كل وتد علوي ووتد سفلي مقابل له (T1 مع B1، T2 مع B2، وهكذا).");
      steps.push("لضمان دقة العمل وتفادي الأخطاء، قس الأطوال الفعلية للحبال الفاصلة الممدودة في الطبيعة وقارنها بالأطوال المحسوبة في الجدول للتأكد من مطابقتها.");
    }
  }

  const totalStakes = stakes.length;
  const totalRopes = boundaryRopes.length + dividerRopes.length;
  const estimatedTime = 30 + 10 * totalStakes;

  return {
    statistics: { stakes: totalStakes, ropes: totalRopes, estimatedTime },
    boundaryRopes,
    dividerRopes,
    stakes,
    steps,
    direction: isRTL ? 'rtl' : 'ltr'
  };
}

function openFieldGuideModal() {
  const guideData = buildFieldGuideData();
  if (!guideData) {
    if (window.DallalToast) {
      DallalToast.warning("يرجى إجراء التقسيم أولاً قبل عرض الدليل الحقلي.");
    } else {
      alert("⚠ يرجى إجراء التقسيم أولاً قبل عرض الدليل الحقلي.");
    }
    return;
  }
  
  const totalArea = calculatedArea ? calculatedArea.toFixed(2) : "-";
  const summaryHTML = `
    <!-- بطاقة الملخص الإحصائي -->
    <div style="margin-bottom: 20px;">
      <div class="fh-guide-summary-item">
        <span>اتجاه التقسيم:</span>
        <span>⬅️ من اليسار إلى اليمين</span>
      </div>
      <div class="fh-guide-summary-item">
        <span>نقطة البداية:</span>
        <span>الحد الأيسر (الصفر) 🏁</span>
      </div>
      <div class="fh-guide-summary-item">
        <span>عدد الشركاء:</span>
        <span>${heirsData.length} شركاء</span>
      </div>
      <div class="fh-guide-summary-item">
        <span>عدد الفواصل:</span>
        <span>${guideData.dividerRopes.length} فواصل</span>
      </div>
      <div class="fh-guide-summary-item">
        <span>الأوتاد المطلوبة:</span>
        <span>${guideData.statistics.stakes} أوتاد 📌</span>
      </div>
      <div class="fh-guide-summary-item">
        <span>أطوال الفواصل الإجمالية:</span>
        <span>${guideData.statistics.ropes} حبال</span>
      </div>
      <div class="fh-guide-summary-item">
        <span>زمن التنفيذ المتوقع:</span>
        <span>${guideData.statistics.estimatedTime} دقيقة ⏱️</span>
      </div>
      <div class="fh-guide-summary-item" style="border-top: 1px dashed #c8e6c9; padding-top: 8px; margin-top: 8px;">
        <span>المساحة الإجمالية:</span>
        <span style="color: #1b5e20;">${totalArea} م²</span>
      </div>
    </div>
  `;
  
  const summaryCard = document.getElementById("guide-summary-content");
  if (summaryCard) summaryCard.innerHTML = summaryHTML;

  const dividersList = document.getElementById("guide-dividers-list");
  if (dividersList) {
    let listHTML = "";
    
    listHTML += `
      <div class="fh-guide-divider-row">
        <div class="fh-guide-divider-title">🏁 نقطة البداية الأساسية</div>
        <div style="color:#666;">ابدأ القياس من الركن الأيسر للأرض (الركن D للضلع العلوي والركن A للضلع السفلي)</div>
      </div>
    `;
    
    const caratSize = caratSizeInput ? (parseFloat(caratSizeInput.value) || 168) : 168;
    let cumTop = 0;
    let cumBot = 0;
    
    heirsData.forEach((heir, idx) => {
      const isLast = idx === heirsData.length - 1;
      const conv = convertSqmToFeddans(heir.share, caratSize);
      const label = heir.name || `الشريك ${idx + 1}`;
      
      listHTML += `
        <div class="fh-guide-divider-row" style="background:#f9f9f9; border: 1px solid #ccc; cursor:pointer;" onclick="highlightPartnerRow('${heir.id}')">
          <div class="fh-guide-divider-title" style="color:#1b5e20; display:flex; justify-content:space-between;">
            <span>👤 ${label}</span>
            <span style="font-size:11px; font-weight:normal; color:#666;">الترتيب: ${idx + 1}</span>
          </div>
          <div style="font-size:12px; margin-bottom:4px;">
            المساحة: <strong>${(heir.share || 0).toFixed(2)} م²</strong> (${conv.feddans} فدان، ${conv.carats} ق، ${conv.shares.toFixed(2)} س)
          </div>
          <div style="font-size:12px; color:#555;">
            العرض العلوي: ${heir.topW.toFixed(2)} م | العرض السفلي: ${heir.botW.toFixed(2)} م
          </div>
        </div>
      `;
      
      if (!isLast) {
        cumTop += heir.topW;
        cumBot += heir.botW;
        const dividerLen = guideData.dividerRopes[idx]?.length || 0;
        listHTML += `
          <div class="fh-guide-divider-row" style="background:#fff8e1; border-color:#ffe082;">
            <div class="fh-guide-divider-title" style="color:#e65100;">🚧 الخط الفاصل رقم ${idx + 1}</div>
            <div style="font-size:12px; line-height:1.5;">
              - <strong>الوتد العلوي (T${idx + 1}):</strong> قس <strong>${cumTop.toFixed(2)} م</strong> من الركن العلوي الأيسر (D).<br>
              - <strong>الوتد السفلي (B${idx + 1}):</strong> قس <strong>${cumBot.toFixed(2)} م</strong> من الركن السفلي الأيسر (A).<br>
              - <strong>طول الحبل الفاصل:</strong> شد حبلاً مستقيماً بطول <strong>${dividerLen.toFixed(2)} م</strong> بين الوتدين.
            </div>
          </div>
        `;
      }
    });

    listHTML += `
      <div class="fh-guide-divider-row" style="background:#ffebee; border-color:#ffcdd2;">
        <div class="fh-guide-divider-title" style="color:#c62828;">🛑 نقطة النهاية</div>
        <div style="color:#666;">الحد الأيمن للأرض (الركن C علوياً والركن B سفلياً)</div>
      </div>
    `;
    
    dividersList.innerHTML = listHTML;
  }

  const modal = document.getElementById("field-guide-modal");
  if (modal) modal.style.display = "flex";
}

function closeFieldGuideModal() {
  const modal = document.getElementById("field-guide-modal");
  if (modal) modal.style.display = "none";
}

function printFieldGuideDirect() {
  closeFieldGuideModal();
  
  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const totalArea = calculatedArea ? calculatedArea.toFixed(2) : "-";

  let stepsHTML = `
    <div class="step start-step">
      <div class="step-icon">🏁</div>
      <div class="step-content">
        <div class="step-title">بداية القياس</div>
        <div class="step-sub">ابدأ من الحد الأيسر للأرض (الركن D علوياً والركن A سفلياً)</div>
      </div>
    </div>`;

  const caratSize = caratSizeInput ? (parseFloat(caratSizeInput.value) || 168) : 168;
  const guideData = buildFieldGuideData();
  let cumTop = 0;
  let cumBot = 0;

  heirsData.forEach((heir, idx) => {
    const isLast = idx === heirsData.length - 1;
    const conv = convertSqmToFeddans(heir.share, caratSize);
    const label = heir.name || `الشريك ${idx + 1}`;
    
    stepsHTML += `
    <div class="step-arrow">↓</div>
    <div class="step piece-step">
      <div class="step-num">${idx + 1}</div>
      <div class="step-content">
        <div class="step-title">${label}</div>
        <div class="step-area">${(heir.share || 0).toFixed(2)} م² &nbsp;(${conv.feddans} فدان ${conv.carats} ق ${conv.shares.toFixed(2)} س)</div>
        <div class="step-widths">علوياً: ${heir.topW.toFixed(2)} م | سفلياً: ${heir.botW.toFixed(2)} م</div>
        ${!isLast ? `
          <div class="step-divider">
            الفاصل رقم ${idx + 1}: علوياً قس <strong>${(cumTop + heir.topW).toFixed(2)} م</strong> من البداية | سفلياً قس <strong>${(cumBot + heir.botW).toFixed(2)} م</strong> من البداية<br>
            طول الفاصل الفعلي: <strong>${(guideData.dividerRopes[idx]?.length || 0).toFixed(2)} م</strong>
          </div>` : ""}
      </div>
    </div>`;
    
    cumTop += heir.topW;
    cumBot += heir.botW;
  });

  stepsHTML += `
    <div class="step-arrow">↓</div>
    <div class="step end-step">
      <div class="step-icon">🛑</div>
      <div class="step-content">
        <div class="step-title">نهاية التقسيم</div>
        <div class="step-sub">الحد الأيمن للأرض — المساحة الإجمالية: ${totalArea} م²</div>
      </div>
    </div>`;

  const guideHTML = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>دليل التنفيذ الحقلي الذكي - الدلال</title>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=Cairo:wght@400;600;700;800&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4 portrait; margin: 15mm 12mm; }
    body { font-family: 'Tajawal', 'Cairo', 'Noto Sans Arabic', sans-serif; direction: rtl; background: #fff; color: #111; font-size: 12pt; }
    .header { border: 2.5px solid #1b5e20; border-radius: 10px; padding: 12px 18px; margin-bottom: 18px; background: #f1f8e9; display: flex; justify-content: space-between; align-items: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .header h1 { font-size: 22pt; color: #1b5e20; font-weight: 800; }
    .header h2 { font-size: 13pt; color: #2e7d32; font-weight: 700; text-align: center; }
    .header .meta { font-size: 9pt; color: #444; text-align: left; line-height: 1.6; }
    .direction-bar { background: #fff8e1; border: 1.5px solid #ffe082; border-radius: 8px; padding: 8px 14px; margin-bottom: 18px; font-size: 11pt; font-weight: bold; color: #e65100; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .steps { display: flex; flex-direction: column; align-items: stretch; }
    .step { display: flex; align-items: flex-start; gap: 14px; padding: 12px 16px; border-radius: 10px; margin-bottom: 4px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .start-step { background: #e8f5e9; border: 2px solid #2e7d32; }
    .end-step { background: #ffebee; border: 2px solid #c62828; }
    .piece-step { background: #f9f9f9; border: 1.5px solid #bdbdbd; }
    .step-arrow { text-align: center; font-size: 18pt; color: #37474f; line-height: 1.2; margin: 2px 0; }
    .step-icon { font-size: 22pt; line-height: 1; }
    .step-num { min-width: 32px; height: 32px; border-radius: 50%; background: #1b5e20; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13pt; font-weight: 800; flex-shrink: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .step-content { flex: 1; }
    .step-title { font-size: 12.5pt; font-weight: 700; color: #1b5e20; margin-bottom: 2px; }
    .start-step .step-title { color: #1b5e20; }
    .end-step .step-title { color: #c62828; }
    .step-sub { font-size: 10pt; color: #555; }
    .step-area { font-size: 10pt; color: #333; margin-top: 2px; }
    .step-widths { font-size: 9.5pt; color: #666; }
    .step-divider { font-size: 11pt; color: #ef6c00; font-weight: bold; background: #fff3e0; border: 1.5px solid #ffe0b2; border-radius: 6px; padding: 4px 10px; margin-top: 6px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .footer { margin-top: 24px; text-align: center; font-size: 8.5pt; color: #888; border-top: 1px solid #ccc; padding-top: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <div><h1>الدَّلاَّل</h1><p style="font-size:9pt;color:#388e3c;font-family:Cairo,sans-serif;">دليل التنفيذ الحقلي</p></div>
    <h2>خطوات تقسيم الأرض على الطبيعة</h2>
    <div class="meta"><div><strong>التاريخ:</strong> ${dateStr}</div><div><strong>المساحة:</strong> ${totalArea} م²</div><div><strong>عدد الشركاء:</strong> ${heirsData.length}</div></div>
  </div>
  <div class="direction-bar">➡️ اتجاه التقسيم: من اليسار إلى اليمين — ابدأ القياس من الحد الأيسر للأرض (النقطة صفر)</div>
  <div class="steps">${stepsHTML}</div>
  <div class="footer">تطبيق الدَّلاَّل لقياسات الأراضي الزراعية | الإصدار v3.0</div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) { alert("⚠ تعذر فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة."); return; }
  win.document.write(guideHTML);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 600);
}

function printFieldGuide() {
  openFieldGuideModal();
}

function highlightPartnerRow(heirId) {
  const row = document.querySelector(`#heirs-table tr[data-id="${heirId}"]`);
  if (row) {
    document.querySelectorAll("#heirs-table tr").forEach(r => r.classList.remove("partner-row-highlighted"));
    row.classList.add("partner-row-highlighted");
    row.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function openAnimationSimulationFromGuide() {
  closeFieldGuideModal();
  openAnimationSimulation();
}

window.buildFieldGuideData = buildFieldGuideData;
window.openFieldGuideModal = openFieldGuideModal;
window.closeFieldGuideModal = closeFieldGuideModal;
window.printFieldGuideDirect = printFieldGuideDirect;
window.printFieldGuide = printFieldGuide;
window.highlightPartnerRow = highlightPartnerRow;
window.openAnimationSimulationFromGuide = openAnimationSimulationFromGuide;

// --- New UI Unification Functions ---
let isAnimScriptsLoaded = false;
let isAnimScriptsLoading = false;

function openAnimationSimulation() {
  if (!heirsData || heirsData.length === 0) {
    if (window.DallalToast) {
      DallalToast.warning("يرجى حساب وتقسيم الأرض أولاً قبل تشغيل شرح التنفيذ.");
    } else {
      alert("يرجى حساب وتقسيم الأرض أولاً قبل تشغيل شرح التنفيذ.");
    }
    return;
  }
  
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
    landLeft = parseFloat(document.getElementById('trap-length-left')?.value) || 0;
    landRight = parseFloat(document.getElementById('trap-length-right')?.value) || 0;
  } else if (activeShape === 'quadrilateral') {
    landBottom = parseFloat(document.getElementById('quad-side-a')?.value) || 0;
    landLeft = parseFloat(document.getElementById('quad-side-b')?.value) || 0;
    landTop = parseFloat(document.getElementById('quad-side-c')?.value) || 0;
    landRight = parseFloat(document.getElementById('quad-side-d')?.value) || 0;
  }

  if (landTop <= 0 || landBottom <= 0 || landLeft <= 0 || landRight <= 0) {
    if (window.DallalToast) {
      DallalToast.warning("يرجى إدخال أبعاد الأرض الأربعة بشكل صحيح أولاً!");
    } else {
      alert("يرجى إدخال أبعاد الأرض الأربعة بشكل صحيح أولاً!");
    }
    return;
  }

  const landData = {
    w: (landTop + landBottom) / 2,
    w1: landTop,
    w2: landBottom,
    l1: landLeft,
    l2: landRight
  };

  let cumWidth = 0;
  const pieces = heirsData.map((h, idx) => {
    const pieceAvgW = ((h.topW || 0) + (h.botW || 0)) / 2;
    const startX = cumWidth;
    const endX = cumWidth + pieceAvgW;
    cumWidth = endX;
    
    return {
      area: h.share,
      topW: h.topW || 0,
      botW: h.botW || 0,
      leftL: h.leftL || 0,
      rightL: h.rightL || 0,
      name: h.name || `الشريك ${idx + 1}`,
      startX: startX,
      endX: endX,
      divLine: h.rightL || 0,
      width: pieceAvgW
    };
  });

  window.calculatedPieces = pieces;

  if (isAnimScriptsLoaded) {
    window.AnimationController.start(landData, pieces);
    return;
  }

  if (isAnimScriptsLoading) return;
  isAnimScriptsLoading = true;

  const btns = document.querySelectorAll("button[onclick='openAnimationSimulation()']");
  btns.forEach(btn => {
    btn.setAttribute("data-orig-text", btn.innerHTML);
    btn.innerHTML = "⏳ جاري تحميل المحاكاة...";
    btn.disabled = true;
  });

  const scripts = [
    "../../animation/animation-assets.js",
    "../../animation/animation-utils.js",
    "../../animation/animation-engine.js",
    "../../animation/animation-renderer.js",
    "../../animation/animation-controller.js"
  ];

  function loadNextScript(index) {
    if (index >= scripts.length) {
      isAnimScriptsLoaded = true;
      isAnimScriptsLoading = false;
      
      btns.forEach(btn => {
        btn.innerHTML = btn.getAttribute("data-orig-text") || "🎬 شرح التنفيذ";
        btn.disabled = false;
      });
      
      window.AnimationController.start(landData, pieces);
      return;
    }
    
    const script = document.createElement("script");
    script.src = scripts[index];
    script.onload = () => loadNextScript(index + 1);
    script.onerror = () => {
      alert("فشل تحميل ملفات المحاكاة. يرجى التحقق من اتصالك بالشبكة.");
      isAnimScriptsLoading = false;
      btns.forEach(btn => {
        btn.innerHTML = btn.getAttribute("data-orig-text") || "🎬 شرح التنفيذ";
        btn.disabled = false;
      });
    };
    document.body.appendChild(script);
  }

  loadNextScript(0);
}

window.openAnimationSimulation = openAnimationSimulation;
window.addNewHeir = addNewHeir;
window.deleteHeir = deleteHeir;
window.generateHeirsTable = generateHeirsTable;
window.distributeEqually = distributeEqually;
window.toggleDivisionPanel = toggleDivisionPanel;
window.resetDivision = resetDivision;
window.calculateAll = calculateAll;
window.recalculateHeirsDimensions = recalculateHeirsDimensions;
window.renderHeirsRows = renderHeirsRows;
window.saveStateToSession = saveStateToSession;
window.loadStateFromSession = loadStateFromSession;
function drawCroquis() {
  const currentVertices = window.vertices || (typeof vertices !== "undefined" ? vertices : []);
  if (window.CroquisEngine && typeof window.CroquisEngine.render === "function") {
    window.CroquisEngine.render("landCanvas", { vertices: currentVertices });
    return;
  }
  if (typeof drawLandCanvas === "function") {
    drawLandCanvas(currentVertices);
  }
}
window.drawCroquis = drawCroquis;

// ==========================================================
// قسم خطوات الحساب بالتفصيل - 100% Page11 Parity
// ==========================================================

let isStepsOpen = false;

function toArabicNumerals(numStr) {
  if (numStr === undefined || numStr === null) return "";
  try {
    const str = String(numStr);
    const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    return str.replace(/[0-9]/g, (w) => arabicDigits[+w]).replace(/\./g, "٫");
  } catch (e) {
    return String(numStr || "");
  }
}

function toggleStepsAccordion() {
  console.log("toggleStepsAccordion called");
  var container = document.getElementById("calculation-steps-container");
  if (!container) {
    console.error("toggleStepsAccordion: #calculation-steps-container NOT FOUND");
    return;
  }
  var arrow = document.getElementById("steps-arrow-icon");
  // data-open هو مصدر الحقيقة للحالة - موثوق 100% ولا يتأثر بـ CSS
  var isCurrentlyOpen = (container.getAttribute("data-open") === "1");
  console.log("toggleStepsAccordion: isCurrentlyOpen =", isCurrentlyOpen);

  if (!isCurrentlyOpen) {
    // الفتح
    container.setAttribute("data-open", "1");
    isStepsOpen = true;
    if (typeof updateCalculationSteps === "function") {
      updateCalculationSteps();
    }
    container.style.maxHeight = "6000px";
    container.style.opacity = "1";
    if (arrow) arrow.style.transform = "rotate(-90deg)";
    console.log("toggleStepsAccordion: OPENED");
  } else {
    // الإغلاق
    container.setAttribute("data-open", "0");
    isStepsOpen = false;
    container.style.maxHeight = "0px";
    container.style.opacity = "0";
    if (arrow) arrow.style.transform = "rotate(0deg)";
    console.log("toggleStepsAccordion: CLOSED");
  }
}
window.toggleStepsAccordion = toggleStepsAccordion;

// NOTE: The steps-header accordion is handled by onclick="toggleStepsAccordion()" directly in HTML.
// No additional DOMContentLoaded listener is needed here (it was causing double-call and breaking the accordion).
// This matches Page11 behavior exactly.

function updatePrintStepsClass() {
  try {
    const card = document.querySelector(".steps-card");
    const checkbox = document.getElementById("print-steps-checkbox");
    if (!card || !checkbox) return;
    if (checkbox.checked) {
      card.classList.remove("print-steps-hidden");
      card.classList.add("print-visible");
    } else {
      card.classList.remove("print-visible");
      card.classList.add("print-steps-hidden");
    }
  } catch (e) {
    console.error("updatePrintStepsClass Error:", e);
  }
}

function updateCalculationSteps() {
  try {
    console.log("updateCalculationSteps called");
    if (window.StepsEngine && (typeof window.StepsEngine.generateHTML === "function" || typeof window.StepsEngine.updateUI === "function")) {
      const currentShape = (typeof activeShape !== "undefined" && activeShape) ? activeShape : (window.activeShape || "trapezoid");
      window.activeShape = currentShape;
      const totalAreaM2 = (typeof calculatedArea === "number" && calculatedArea > 0)
        ? calculatedArea
        : (parseFloat(window.calculatedArea) || parseFloat(document.getElementById("total-sqm")?.innerText) || 0);

      const dims = {
        rectLength: document.getElementById("rect-length")?.value,
        rectWidth: document.getElementById("rect-width")?.value,
        squareSide: document.getElementById("square-side")?.value,
        trapBaseMinor: document.getElementById("trap-base-minor")?.value,
        trapBaseMajor: document.getElementById("trap-base-major")?.value,
        trapLengthRight: document.getElementById("trap-length-right")?.value,
        trapLengthLeft: document.getElementById("trap-length-left")?.value,
        quadSideA: document.getElementById("quad-side-a")?.value,
        quadSideB: document.getElementById("quad-side-b")?.value,
        quadSideC: document.getElementById("quad-side-c")?.value,
        quadSideD: document.getElementById("quad-side-d")?.value,
        quadDiagAC: document.getElementById("quad-diag-ac")?.value,
        quadDiagBD: document.getElementById("quad-diag-bd")?.value
      };

      if (typeof window.StepsEngine.updateUI === "function") {
        window.StepsEngine.updateUI("calculation-steps-content", "calculation-steps-container", {
          shape: currentShape,
          dimensions: dims,
          calculatedArea: totalAreaM2,
          heirsData: window.heirsData || []
        });
      } else {
        const stepsContainer = document.getElementById("calculation-steps-content");
        if (stepsContainer) {
          stepsContainer.innerHTML = window.StepsEngine.generateHTML({
            shape: currentShape,
            dimensions: dims,
            calculatedArea: totalAreaM2,
            heirsData: window.heirsData || []
          });
        }
      }
      return;
    }
    const stepsContainer = document.getElementById("calculation-steps-content");
    if (!stepsContainer) return;

    const totalAreaM2 = (typeof calculatedArea === "number" && calculatedArea > 0)
      ? calculatedArea
      : (parseFloat(window.calculatedArea) || parseFloat(document.getElementById("total-sqm")?.innerText) || 0);

    const dims = (typeof getLandDimensions === "function") ? getLandDimensions() : { landTop: 0, landBottom: 0 };
    const w1 = dims.landBottom;
    const w2 = dims.landTop;

  if (totalAreaM2 <= 0) {
    stepsContainer.innerHTML = `<p style="text-align: center; color: #777; font-style: italic;">أدخل الأبعاد والشركاء لعرض تفاصيل الخطوات الحسابية</p>`;
    return;
  }

  const wAvg = (w1 > 0 && w2 > 0) ? (w1 + w2) / 2 : (w1 || w2 || Math.sqrt(totalAreaM2));
  const lAvg = wAvg > 0 ? (totalAreaM2 / wAvg) : 0;

  let html = `
    <!-- الخطوة (١): حساب متوسط العرض -->
    <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px; direction: rtl; text-align: right;">
      <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة (١): حساب متوسط العرض</strong>
      <div style="font-family: Cairo, Arial, sans-serif; font-size: 14px; font-weight: bold; background: #f5f5f5; padding: 6px 10px; border-radius: 4px; display: inline-block; margin-top: 4px; border: 1px solid #c8e6c9; color: #1b5e20;">
        (${toArabicNumerals(w1.toFixed(4))} + ${toArabicNumerals(w2.toFixed(4))}) ÷ ${toArabicNumerals(2)}<br>
        = ${toArabicNumerals(wAvg.toFixed(4))} م
      </div>
    </div>

    <!-- الخطوة (٢): حساب متوسط الطول -->
    <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px; direction: rtl; text-align: right;">
      <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة (٢): حساب متوسط الطول</strong>
      <div style="font-family: Cairo, Arial, sans-serif; font-size: 14px; font-weight: bold; background: #f5f5f5; padding: 6px 10px; border-radius: 4px; display: inline-block; margin-top: 4px; border: 1px solid #c8e6c9; color: #1b5e20;">
        ${toArabicNumerals(totalAreaM2.toFixed(4))} ÷ ${toArabicNumerals(wAvg.toFixed(4))}<br>
        = ${toArabicNumerals(lAvg.toFixed(4))} م
      </div>
    </div>

    <!-- الخطوة (٣): حساب المساحة الإجمالية -->
    <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px; direction: rtl; text-align: right;">
      <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة (٣): حساب المساحة الإجمالية للأرض</strong>
      <div style="font-family: Cairo, Arial, sans-serif; font-size: 14px; font-weight: bold; background: #f5f5f5; padding: 6px 10px; border-radius: 4px; display: inline-block; margin-top: 4px; border: 1px solid #c8e6c9; color: #1b5e20;">
        ${toArabicNumerals(lAvg.toFixed(4))} × ${toArabicNumerals(wAvg.toFixed(4))}<br>
        = ${toArabicNumerals(totalAreaM2.toFixed(4))} م²
      </div>
    </div>
  `;

  // الخطوة (٤) والخطوة (٥): الشركاء والأنصبة والنسب
  const heirs = (Array.isArray(window.heirsData) && window.heirsData.length > 0)
    ? window.heirsData
    : ((typeof heirsData !== "undefined" && Array.isArray(heirsData)) ? heirsData : []);
  if (heirs.length > 0) {
    // 4. مساحة كل شريك
    html += `
      <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px; direction: rtl; text-align: right;">
        <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة (٤): حساب مساحة كل شريك</strong>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
    `;
    heirs.forEach((h, index) => {
      const partnerName = h.name || `شريك ${index + 1}`;
      const shareVal = parseFloat(h.share) || 0;
      html += `
        <div style="border-right: 3px solid #66bb6a; padding-right: 8px;">
          <span style="font-weight: bold; color: #333;">${toArabicNumerals(partnerName)}:</span>
          <span style="font-size: 13px; color: #1b5e20; font-weight: bold; margin-right: 6px;">${toArabicNumerals(shareVal.toFixed(2))} م²</span>
        </div>
      `;
    });
    html += `
        </div>
      </div>
    `;

    // 5. نسبة كل شريك
    html += `
      <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px; direction: rtl; text-align: right;">
        <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة (٥): حساب نسبة كل شريك</strong>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
    `;
    heirs.forEach((h, index) => {
      const partnerName = h.name || `شريك ${index + 1}`;
      const shareVal = parseFloat(h.share) || 0;
      const pctVal = totalAreaM2 > 0 ? (shareVal / totalAreaM2) * 100 : 0;
      html += `
        <div style="border-right: 3px solid #42a5f5; padding-right: 8px;">
          <span style="font-weight: bold; color: #333;">${toArabicNumerals(partnerName)}:</span><br>
          <div style="font-family: Cairo, Arial, sans-serif; font-size: 13px; font-weight: bold; background: #f5f5f5; padding: 4px 8px; border-radius: 3px; display: inline-block; margin-top: 2px; border: 1px solid #bbdefb; color: #0d47a1;">
            ${toArabicNumerals(shareVal.toFixed(2))} ÷ ${toArabicNumerals(totalAreaM2.toFixed(2))} × ${toArabicNumerals(100)}<br>
            = ${toArabicNumerals(pctVal.toFixed(2))}٪
          </div>
        </div>
      `;
    });

    const remPiece = window.remainderPiece;
    if (remPiece && remPiece.share > 0.01) {
      const remPct = totalAreaM2 > 0 ? (remPiece.share / totalAreaM2) * 100 : 0;
      html += `
        <div style="border-right: 3px solid #ffa726; padding-right: 8px;">
          <span style="font-weight: bold; color: #e65100;">🟡 المتبقي:</span><br>
          <div style="font-family: Cairo, Arial, sans-serif; font-size: 13px; font-weight: bold; background: #fffde7; padding: 4px 8px; border-radius: 3px; display: inline-block; margin-top: 2px; border: 1px solid #ffe082; color: #e65100;">
            ${toArabicNumerals(remPiece.share.toFixed(2))} ÷ ${toArabicNumerals(totalAreaM2.toFixed(2))} × ${toArabicNumerals(100)}<br>
            = ${toArabicNumerals(remPct.toFixed(2))}٪
          </div>
        </div>
      `;
    }

    html += `
        </div>
      </div>
    `;
  }

  // الخطوات 6، 7، 8، 9: هندسية التقسيم
  if (heirs.length > 0) {
    // 6. العرض الأول (أسفل)
    html += `
      <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px; direction: rtl; text-align: right;">
        <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة (٦): حساب العرض الأول لكل قطعة (أسفل)</strong>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
    `;
    heirs.forEach((h, index) => {
      const partnerName = h.name || `شريك ${index + 1}`;
      const botW = parseFloat(h.botW) || 0;
      html += `
        <div style="border-right: 3px solid #ab47bc; padding-right: 8px;">
          <span style="font-weight: bold; color: #333;">${toArabicNumerals(partnerName)}:</span><br>
          <div style="font-family: Cairo, Arial, sans-serif; font-size: 13px; font-weight: bold; background: #f5f5f5; padding: 4px 8px; border-radius: 3px; display: inline-block; margin-top: 2px; border: 1px solid #e1bee7; color: #4a148c;">
            العرض السفلي = ${toArabicNumerals(botW.toFixed(4))} م
          </div>
        </div>
      `;
    });
    html += `
        </div>
      </div>
    `;

    // 7. العرض الثاني (أعلى)
    html += `
      <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px; direction: rtl; text-align: right;">
        <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة (٧): حساب العرض الثاني لكل قطعة (أعلى)</strong>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
    `;
    heirs.forEach((h, index) => {
      const partnerName = h.name || `شريك ${index + 1}`;
      const topW = parseFloat(h.topW) || 0;
      html += `
        <div style="border-right: 3px solid #ab47bc; padding-right: 8px;">
          <span style="font-weight: bold; color: #333;">${toArabicNumerals(partnerName)}:</span><br>
          <div style="font-family: Cairo, Arial, sans-serif; font-size: 13px; font-weight: bold; background: #f5f5f5; padding: 4px 8px; border-radius: 3px; display: inline-block; margin-top: 2px; border: 1px solid #e1bee7; color: #4a148c;">
            العرض العلوي = ${toArabicNumerals(topW.toFixed(4))} م
          </div>
        </div>
      `;
    });
    html += `
        </div>
      </div>
    `;

    // 8. أطوال الفواصل الداخلية
    if (heirs.length > 1) {
      html += `
        <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px; direction: rtl; text-align: right;">
          <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة (٨): حساب طول الفاصل (خطوط القسمة الداخلية)</strong>
          <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
      `;
      heirs.forEach((h, index) => {
        if (index > 0) {
          const rightL = parseFloat(h.leftL || h.rightL) || 0;
          html += `
            <div style="border-right: 3px solid #ffa726; padding-right: 8px;">
              <span style="font-weight: bold; color: #333;">الفاصل بين قطعة ${toArabicNumerals(index)} وقطعة ${toArabicNumerals(index + 1)}:</span><br>
              <div style="font-family: Cairo, Arial, sans-serif; font-size: 13px; font-weight: bold; background: #f5f5f5; padding: 4px 8px; border-radius: 3px; display: inline-block; margin-top: 2px; border: 1px solid #ffe082; color: #e65100;">
                طول الفاصل = ${toArabicNumerals(rightL.toFixed(4))} م
              </div>
            </div>
          `;
        }
      });
      html += `
          </div>
        </div>
      `;
    }

    // 9. التحقق النهائي
    let totalDistributed = 0;
    heirs.forEach(h => { totalDistributed += (parseFloat(h.share) || 0); });
    const diff = totalAreaM2 - totalDistributed;
    const isMatched = Math.abs(diff) < 0.01;
    const diffIcon = isMatched ? "✔" : "❌";

    let diffText = "";
    if (isMatched) {
      diffText = `التوزيع متطابق بالكامل مع مساحة الأرض ${diffIcon}`;
    } else if (diff > 0) {
      diffText = `المساحة المتبقية = ${toArabicNumerals(diff.toFixed(2))} م² 🟡`;
    } else {
      diffText = `يوجد عجز مقداره ${toArabicNumerals(Math.abs(diff).toFixed(2))} م² 🔴`;
    }

    html += `
      <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px; direction: rtl; text-align: right;">
        <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة (٩): التحقق النهائي ومطابقة المساحات</strong>
        <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px; line-height: 1.4;">
          <div>مجموع مساحات الشركاء الموزعة = <strong style="color: #2e7d32; font-family: monospace;">${toArabicNumerals(totalDistributed.toFixed(4))} م²</strong></div>
          <div>المساحة الإجمالية للأرض = <strong style="color: #2e7d32; font-family: monospace;">${toArabicNumerals(totalAreaM2.toFixed(4))} م²</strong></div>
          <div style="margin-top: 4px; border-top: 1px solid #eee; padding-top: 4px; font-weight: bold; font-size: 13px;">
            حالة المطابقة: 
            <span style="color: ${isMatched ? "#2e7d32" : (diff > 0 ? "#e65100" : "#c62828")}; font-family: Cairo, Arial, sans-serif;">
              ${diffText}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  if (html && !html.includes("أدخل الأبعاد والشركاء")) {
    html += `
      <div style="display: flex; justify-content: flex-end; margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px;">
        <button type="button" class="action-btn" onclick="copyCalculationSteps()" style="padding: 10px 20px; font-size: 13.5px; background-color: #134614; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-family: 'Cairo', Arial, sans-serif; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: background-color 0.2s;">
          📋 نسخ خطوات الحساب
        </button>
      </div>
    `;
  }

  stepsContainer.innerHTML = html;

  // Update container height if accordion is open (e.g., user recalculated after opening)
  if (isStepsOpen) {
    setTimeout(function() {
      const container = document.getElementById("calculation-steps-container");
      if (container) {
        const targetHeight = container.scrollHeight > 50 ? (container.scrollHeight + 300) : 3000;
        container.style.maxHeight = targetHeight + "px";
      }
    }, 0);
  }
  } catch (e) {
    console.error("updateCalculationSteps Error:", e);
  }
}

function copyCalculationSteps() {
  try {
    if (window.StepsEngine && typeof window.StepsEngine.copyText === "function") {
      window.StepsEngine.copyText("calculation-steps-content");
      return;
    }
    const stepsContent = document.getElementById("calculation-steps-content");
    if (!stepsContent) return;

    const steps = Array.from(stepsContent.children).filter(el => {
      return el.tagName === "DIV" && !el.querySelector("button");
    });

    let textParts = [];
    steps.forEach(step => {
      const stepText = step.innerText.trim();
      if (stepText) {
        textParts.push(stepText);
      }
    });

    const textToCopy = textParts.join("\n\n");
    if (!textToCopy) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        if (window.DallalToast) {
          DallalToast.success("تم نسخ خطوات الحساب بنجاح.");
        } else {
          alert("✅ تم نسخ خطوات الحساب بنجاح.");
        }
      }).catch(() => {
        fallbackCopyText(textToCopy);
      });
    } else {
      fallbackCopyText(textToCopy);
    }
  } catch (e) {
    console.error("copyCalculationSteps Error:", e);
  }
}

function fallbackCopyText(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.width = "2em";
  textArea.style.height = "2em";
  textArea.style.padding = "0";
  textArea.style.border = "none";
  textArea.style.outline = "none";
  textArea.style.boxShadow = "none";
  textArea.style.background = "transparent";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand("copy");
    if (window.DallalToast) {
      DallalToast.success("تم نسخ خطوات الحساب بنجاح.");
    } else {
      alert("✅ تم نسخ خطوات الحساب بنجاح.");
    }
  } catch (err) {
    console.error("Fallback copy failed", err);
  }
  document.body.removeChild(textArea);
}

window.toArabicNumerals = toArabicNumerals;
window.toggleStepsAccordion = toggleStepsAccordion;
window.updatePrintStepsClass = updatePrintStepsClass;
window.updateCalculationSteps = updateCalculationSteps;
window.copyCalculationSteps = copyCalculationSteps;
window.clearAllInputs = clearAllInputs;

console.log("Page13 section1 script loaded successfully");
console.log("addNewHeir function status:", typeof window.addNewHeir);
console.log("heirsData initial status:", window.heirsData);


