console.log("Trace: Start of script.js loading");

// --- Performance Optimizations & Caching (Phase 14) ---
window.DALLAL_PERF = window.DALLAL_PERF || {
  domCache: true,
  documentFragment: true,
  dirtyFlag: true,
  debounce: true
};

window.lastCroquisSignature = "";

const _domCache = {};
window.resetDallalCaches = function() {
  for (let key in _domCache) {
    delete _domCache[key];
  }
  window.lastCroquisSignature = "";
};
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



let currentInputMethod = "carats";
let croquisScale = 1;
let croquisTranslateX = 0;
let croquisTranslateY = 0;
let isDragging = false;
let startDragX = 0;
let startDragY = 0;
let showCroquisNames = true;
let showCroquisMeasurements = true;
let isPartitioned = false;
let isManualPartition = false;

/**
 * p11LastDirections - تتبع الاتجاهات السابقة لمنع التكرار والتبديل التلقائي
 * القيم الافتراضية المعتمدة: شرقي (العرض الأول أعلى)، غربي (العرض الثاني أسفل)، قبلي (الطول الأيمن)، بحري (الطول الأيسر)
 */
let p11LastDirections = {
  "p11-w2-dir": "شرقي",   // العرض الأول (أعلى C)
  "p11-w1-dir": "غربي",   // العرض الثاني (أسفل A)
  "p11-l1-dir": "قبلي",  // الطول الأيمن (D)
  "p11-l2-dir": "بحري"   // الطول الأيسر (B)
};


Object.defineProperty(window, 'isPartitioned', {
  get: () => isPartitioned,
  set: (v) => { isPartitioned = v; }
});
Object.defineProperty(window, 'isManualPartition', {
  get: () => isManualPartition,
  set: (v) => { isManualPartition = v; }
});

window.lastValidGeometry = null;

function ensureDimensionsAutofill() {
  // Autofill behavior removed to allow manual entry of all 4 dimensions.
}

let isEditing = false;
let isUpdatingRow = false;
let activeFieldBefore = null;
let autoCloseTimer = null;

// متغيرات Pinch-to-Zoom
let lastTouchDist = 0;
let lastTouchMidX = 0;
let lastTouchMidY = 0;
let isTwoFingerTouch = false;

document.addEventListener("DOMContentLoaded", function () {
  console.log("Trace: DOMContentLoaded fired");
  loadData();
  updateWidthModeDescription();
  
  // تهيئة الأكورديون للإعدادات
  initSettingsAccordion();
  const accordionContent = document.getElementById("settings-accordion-content");
  if (accordionContent) {
    accordionContent.addEventListener("transitionend", () => {
      if (accordionContent.classList.contains("open")) {
        accordionContent.style.maxHeight = "none";
      }
    });
  }
  
  // Set up event listeners
  const list = document.getElementById("partners-list");
  if (list.children.length === 0) {
    addNewPartnerRow("شريك 1");
  }
  renderHeaderAndFooter();
  calculateGeneral(!isPartitioned);
  if (isPartitioned) {
    runPartition(true);
  }
  
  // Setup SVG interactions
  setupSVGInteractions();
  renderHistory();

  // Setup inputs saveAndCalc listeners
  const inputs = ["length1", "length2", "width1", "width2", "other-carat-area"];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("blur", saveAndCalc);
      el.addEventListener("input", () => {
        const l1 = parseFloat(document.getElementById("length1").value) || 0;
        const l2 = parseFloat(document.getElementById("length2").value) || 0;
        const w1 = parseFloat(document.getElementById("width1").value) || 0;
        const w2 = parseFloat(document.getElementById("width2").value) || 0;
        if (l1 > 0 && l2 > 0 && w1 > 0 && w2 > 0) {
          saveAndCalc();
        }
      });
    }
  });

  // الاستماع لحدث تغيير اتجاه التقسيم لتحديث الواجهة بصرياً دون حسابات
  window.addEventListener("partition-direction-changed", function (e) {
    const dir = e.detail.direction;
    console.log("Trace: partition-direction-changed caught:", dir);
    
    // تحديث القائمة المنسدلة
    const select = document.getElementById("partition-direction-select");
    if (select) select.value = dir;

    // رندرة المكونات بصرياً بناءً على الاتجاه المختار
    updateTableRowsUI();
    renderCroquis();
    
    let remainingArea = 0;
    if (window.calcState) {
      remainingArea = window.calcState.remainingArea;
    }
    updateRemainderRowUI(remainingArea);
    updateTableTotals();
    updateCalculationSteps();
  });
});

function setupSVGInteractions() {
  const container = document.getElementById("croquis-container");
  if(!container) return;
  
  // تم إيقاف خاصية السحب والتكبير بناءً على طلب المستخدم
  
  // إلغاء تحديد القطع عند النقر على الفراغ
  const svg = document.getElementById("croquis-svg");
  if (svg) {
    svg.addEventListener("click", () => {
      window.selectedSegmentIndex = null;
      removeHighlight();
    });
  }
}

function getTouchDistance(t1, t2) {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getTouchMid(t1, t2) {
  return {
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2
  };
}

function handleTouchStart(e) {
  e.preventDefault();
  if (e.touches.length === 1) {
    // سحب بإصبع واحد - تم الإيقاف
    isTwoFingerTouch = false;
    isDragging = false;
  } else if (e.touches.length === 2) {
    // Pinch-to-Zoom
    isTwoFingerTouch = true;
    isDragging = false;
    lastTouchDist = getTouchDistance(e.touches[0], e.touches[1]);
    const mid = getTouchMid(e.touches[0], e.touches[1]);
    const container = document.getElementById("croquis-container");
    const rect = container.getBoundingClientRect();
    lastTouchMidX = mid.x - rect.left;
    lastTouchMidY = mid.y - rect.top;
  }
}

function handleTouchMove(e) {
  e.preventDefault();
  if (e.touches.length === 1 && isDragging && !isTwoFingerTouch) {
    // تم إيقاف السحب
  } else if (e.touches.length === 2) {
    const newDist = getTouchDistance(e.touches[0], e.touches[1]);
    if (lastTouchDist > 0) {
      const factor = newDist / lastTouchDist;
      if (factor > 0.1 && factor < 10) {
        const container = document.getElementById("croquis-container");
        const rect = container.getBoundingClientRect();
        const mid = getTouchMid(e.touches[0], e.touches[1]);
        const midX = mid.x - rect.left;
        const midY = mid.y - rect.top;
        zoomAroundPoint(factor, midX, midY);
      }
    }
    lastTouchDist = newDist;
    // تحريك أثناء Pinch
    const mid = getTouchMid(e.touches[0], e.touches[1]);
    const container = document.getElementById("croquis-container");
    const rect = container.getBoundingClientRect();
    const newMidX = mid.x - rect.left;
    const newMidY = mid.y - rect.top;
    croquisTranslateX += (newMidX - lastTouchMidX);
    croquisTranslateY += (newMidY - lastTouchMidY);
    lastTouchMidX = newMidX;
    lastTouchMidY = newMidY;
    updateCroquisTransform();
  }
}

function handleTouchEnd(e) {
  if (e.touches.length < 2) {
    isTwoFingerTouch = false;
    lastTouchDist = 0;
  }
  if (e.touches.length === 0) {
    isDragging = false;
  }
}

// تكبير/تصغير حول نقطة محددة
function zoomAroundPoint(factor, pivotX, pivotY) {
  const newScale = Math.max(0.2, Math.min(10, croquisScale * factor));
  if (newScale === croquisScale) return;
  
  // تحديث الإزاحة لتبقى النقطة المحورية ثابتة
  croquisTranslateX = pivotX - (pivotX - croquisTranslateX) * (newScale / croquisScale);
  croquisTranslateY = pivotY - (pivotY - croquisTranslateY) * (newScale / croquisScale);
  croquisScale = newScale;
  updateCroquisTransform();
}

function zoomCroquis(factor) {
  const container = document.getElementById("croquis-container");
  if (!container) return;
  const rect = container.getBoundingClientRect();
  zoomAroundPoint(factor, rect.width / 2, rect.height / 2);
}

function resetCroquis() {
  fitCroquis();
}

// ملاءمة الرسم تلقائياً في حدود الحاوية
function fitCroquis() {
  const container = document.getElementById("croquis-container");
  if (!container) return;
  
  const l1 = parseFloat(document.getElementById("length1").value) || 0;
  const l2 = parseFloat(document.getElementById("length2").value) || 0;
  const w1 = parseFloat(document.getElementById("width1").value) || 0;
  const w2 = parseFloat(document.getElementById("width2").value) || 0;
  
  if (l1 <= 0 || l2 <= 0 || w1 <= 0 || w2 <= 0) {
    // لا توجد بيانات - إعادة ضبط فقط
    resetCroquisView();
    return;
  }
  
  const cW = container.clientWidth;
  const cH = container.clientHeight;
  const padding = 30; // تقليل الحواف
  const w = (w1 + w2) / 2;
  const maxLen = Math.max(l1, l2);
  
  let scaleX = (cW - padding * 2) / w;
  let scaleY = (cH - padding * 2) / maxLen;
  if (scaleX <= 0) scaleX = 0.1;
  if (scaleY <= 0) scaleY = 0.1;
  croquisScale = Math.min(scaleX, scaleY);
  
  // توسيط
  const drawnW = w * croquisScale;
  const drawnH = maxLen * croquisScale;
  croquisTranslateX = (cW - drawnW) / 2;
  croquisTranslateY = (cH - drawnH) / 2;
  
  updateCroquisTransform();
}

function resetCroquisView() {
  croquisScale = 1;
  croquisTranslateX = 0;
  croquisTranslateY = 0;
  updateCroquisTransform();
}

function updateCroquisTransform() {
  const g = document.getElementById("croquis-transform");
  if (g) {
    g.setAttribute("transform", `translate(${croquisTranslateX}, ${croquisTranslateY}) scale(${croquisScale})`);
  }
  // تحديث عرض نسبة التكبير
  const display = document.getElementById("zoom-level-display");
  if (display) {
    display.innerText = Math.round(croquisScale * 100) + "%";
  }
}



function toggleCroquisNames() {
  const chk = document.getElementById("chk-toggle-names");
  if (chk) showCroquisNames = chk.checked;
  renderCroquis();
}

function refreshCroquisFromTable() {
  saveAndCalcImmediate();
  
  const btn = document.querySelector(".croquis-refresh-btn");
  if (btn) {
    const originalText = btn.innerHTML;
    btn.innerHTML = "✅ تم تحديث الخريطة";
    btn.style.borderColor = "#2e7d32";
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.borderColor = "";
    }, 1000);
  }
}


function saveData() {
  ensureDimensionsAutofill();
  const longPlotView = document.getElementById("long-plot-view");
  if (longPlotView) {
    localStorage.setItem("p11-long-plot-view", longPlotView.value);
  }
  localStorage.setItem("p11-length1", document.getElementById("length1").value);
  localStorage.setItem("p11-length2", document.getElementById("length2").value);
  localStorage.setItem("p11-width1", document.getElementById("width1").value);
  localStorage.setItem("p11-width2", document.getElementById("width2").value);
  const caratSelectVal = document.getElementById("input-carat-area").value;
  if (caratSelectVal === "0") {
    localStorage.setItem("dalal-carat-area", document.getElementById("other-carat-area").value || "168");
  } else {
    localStorage.setItem("dalal-carat-area", caratSelectVal);
  }
  localStorage.setItem("p11-other-carat-area", document.getElementById("other-carat-area").value);
  localStorage.setItem("p11-input-method", document.getElementById("share-input-method").value);
  localStorage.setItem("p11-is-partitioned", isPartitioned ? "true" : "false");
  localStorage.setItem("p11-is-manual-partition", isManualPartition ? "true" : "false");
  localStorage.setItem("p11-partition-direction", window.PartitionDirectionManager.getDirection());

  // حفظ الاتجاهات الأربعة
  const dirIds = ["p11-w2-dir", "p11-w1-dir", "p11-l1-dir", "p11-l2-dir"];
  dirIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) localStorage.setItem("p11-dir-" + id, el.value);
  });

  const modeKeepArea = document.getElementById("mode-keep-area");
  if (modeKeepArea) {
    localStorage.setItem("p11-manual-width-mode", modeKeepArea.checked ? "keep-area" : "free");
  }

  const stepValEl = document.getElementById("width-step-value");
  if (stepValEl) {
    localStorage.setItem("p11-width-step-value", stepValEl.value);
  }

  const partners = [];
  const rows = document.querySelectorAll("#partners-list .partner-row");
  rows.forEach(row => {
    const name = row.querySelector(".partner-name").value;
    const botW = row.querySelector(".partner-width-bottom") ? row.querySelector(".partner-width-bottom").value : "-";
    const topW = row.querySelector(".partner-width-top") ? row.querySelector(".partner-width-top").value : "-";
    
    if (currentInputMethod === "carats") {
      partners.push({
        name: name,
        feddans: row.querySelector(".partner-feddans") ? row.querySelector(".partner-feddans").value : "",
        carats: row.querySelector(".partner-carats") ? row.querySelector(".partner-carats").value : "",
        shares: row.querySelector(".partner-shares") ? row.querySelector(".partner-shares").value : "",
        fraction: "",
        botW: botW,
        topW: topW
      });
    } else {
      partners.push({
        name: name,
        feddans: "",
        carats: "",
        shares: "",
        fraction: row.querySelector(".partner-fraction") ? row.querySelector(".partner-fraction").value : "",
        botW: botW,
        topW: topW
      });
    }
  });
  localStorage.setItem("p11-partners", JSON.stringify(partners));
}

function loadData() {
  const longPlotView = document.getElementById("long-plot-view");
  if (longPlotView) {
    longPlotView.value = localStorage.getItem("p11-long-plot-view") || "agricultural";
  }
  document.getElementById("length1").value = localStorage.getItem("p11-length1") || "";
  document.getElementById("length2").value = localStorage.getItem("p11-length2") || "";
  document.getElementById("width1").value = localStorage.getItem("p11-width1") || "";
  document.getElementById("width2").value = localStorage.getItem("p11-width2") || "";
  const storedCarat = localStorage.getItem("dalal-carat-area") || "168";
  const selectElement = document.getElementById("input-carat-area");
  const otherInputField = document.getElementById("other-carat-area");
  
  const options = Array.from(selectElement.options).map(o => o.value.trim());
  const match = options.find(o => parseFloat(o) === parseFloat(storedCarat));
  if (match) {
    selectElement.value = match;
  } else {
    selectElement.value = "0";
    otherInputField.value = storedCarat;
  }
  
  const savedMethod = localStorage.getItem("p11-input-method") || "carats";
  document.getElementById("share-input-method").value = savedMethod;
  currentInputMethod = savedMethod;

  isPartitioned = (localStorage.getItem("p11-is-partitioned") === "true");
  isManualPartition = (localStorage.getItem("p11-is-manual-partition") === "true");

  const savedMode = localStorage.getItem("p11-manual-width-mode") || "keep-area";
  const modeKeepArea = document.getElementById("mode-keep-area");
  const modeFree = document.getElementById("mode-free");
  if (modeKeepArea && modeFree) {
    if (savedMode === "keep-area") {
      modeKeepArea.checked = true;
      modeFree.checked = false;
    } else {
      modeKeepArea.checked = false;
      modeFree.checked = true;
    }
  }

  const savedStepVal = localStorage.getItem("p11-width-step-value") || "0.05";
  const stepValEl = document.getElementById("width-step-value");
  if (stepValEl) {
    stepValEl.value = savedStepVal;
  }

  handleCaratAreaChange(false);

  const list = document.getElementById("partners-list");
  list.innerHTML = "";
  const savedPartners = localStorage.getItem("p11-partners");
  if (savedPartners) {
    try {
      const partners = JSON.parse(savedPartners);
      const isOptimized = window.DALLAL_PERF && window.DALLAL_PERF.documentFragment;
      const target = isOptimized ? document.createDocumentFragment() : list;
      partners.forEach(p => {
        addNewPartnerRow(p.name, p.feddans, p.carats, p.shares, p.fraction, p.botW || "-", p.topW || "-", false, target);
      });
      if (isOptimized) {
        list.appendChild(target);
      }
    } catch (e) {
      console.error("Error parsing saved partners", e);
    }
  } else {
    addNewPartnerRow("شريك 1");
  }

  isPartitioned = (localStorage.getItem("p11-is-partitioned") === "true");
  
  const savedDir = localStorage.getItem("p11-partition-direction") || "RTL";
  window.PartitionDirectionManager.setDirection(savedDir);

  // استرجاع وتطبيق الاتجاهات المحفوظة
  const defaultDirs = {
    "p11-w2-dir": "شرقي",
    "p11-w1-dir": "غربي",
    "p11-l1-dir": "قبلي",
    "p11-l2-dir": "بحري"
  };
  Object.keys(defaultDirs).forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const saved = localStorage.getItem("p11-dir-" + id);
      el.value = saved || defaultDirs[id];
      p11LastDirections[id] = el.value;
    }
  });
}

function handleCaratAreaChange(triggerCalculate = true) {
  const selectElement = document.getElementById("input-carat-area");
  const otherInputField = document.getElementById("other-carat-area");

  if (selectElement.value === "0") {
    otherInputField.style.display = "inline-block";
  } else {
    otherInputField.style.display = "none";
  }

  if (triggerCalculate) {
    saveAndCalc();
  }
}

function renderHeaderAndFooter() {
  const headerContainer = document.getElementById("table-header-container");
  const footerContainer = document.getElementById("total");
  const tableEl = document.querySelector(".table");
  if (tableEl) {
    tableEl.classList.remove("method-carats", "method-fractions");
    tableEl.classList.add("method-" + currentInputMethod);
  }
  
  if (currentInputMethod === "carats") {
    headerContainer.innerHTML = `
      <th>م</th>
      <th>الشريك</th>
      <th>سهم</th>
      <th>قيراط</th>
      <th>فدان</th>
      <th>المساحة (م²)</th>
      <th>النسبة (%)</th>
      <th>العرض الأول (أعلى)</th>
      <th>العرض الثاني (أسفل)</th>
      <th title="معدل العرض = (العرض الأول + العرض الثاني) ÷ 2" style="cursor: help;">معدل العرض (م)</th>
      <th title="معدل الطول = المساحة ÷ معدل العرض" style="cursor: help;">معدل الطول (م)</th>
      <th title="العلامة: المدى التراكمي لعرض القطعة من اليمين (نقطة الصفر) إلى اليسار" style="cursor: help;">العلامة (م)</th>
      <th>حذف</th>
    `;
    
    footerContainer.innerHTML = `
      <td class="index-group"><input type="text" readonly value="-" style="font-weight: bold; background: #222; color: white;"></td>
      <td class="name-group"><input type="text" readonly value="الإجمالي" style="font-weight: bold; background: #222; color: white;"></td>
      <td class="share-group"><input type="text" id="total-shares-entered" readonly value="0" style="font-weight: bold; background: #222; color: white;"></td>
      <td class="carat-group"><input type="text" id="total-carats-entered" readonly value="0" style="font-weight: bold; background: #222; color: white;"></td>
      <td class="feddan-group"><input type="text" id="total-feddans-entered" readonly value="0" style="font-weight: bold; background: #222; color: white;"></td>
      <td class="area-group"><input type="text" id="total-area-distributed" readonly value="0" style="font-weight: bold; background: #222; color: white;"></td>
      <td class="percent-group"><input type="text" id="total-percent-distributed" readonly value="0%" style="font-weight: bold; background: #222; color: white;"></td>
      <td class="width-top-group"><input type="text" id="total-width-top-calculated" readonly value="-" style="font-weight: bold; background: #222; color: white;"></td>
      <td class="width-bottom-group"><input type="text" id="total-width-bottom-calculated" readonly value="-" style="font-weight: bold; background: #222; color: white;"></td>
      <td class="width-avg-group"><input type="text" readonly value="-" style="font-weight: bold; background: #222; color: white;"></td>
      <td class="length-avg-group"><input type="text" readonly value="-" style="font-weight: bold; background: #222; color: white;"></td>
      <td class="cum-group"><input type="text" readonly value="-" style="font-weight: bold; background: #222; color: white;"></td>
      <td class="delete-group"><input type="text" readonly value="-" style="font-weight: bold; background: #222; color: white;"></td>
    `;
  } else {
    headerContainer.innerHTML = `
      <th>م</th>
      <th>الشريك</th>
      <th>النسبة / الكسر</th>
      <th>تعادل (س.ق.ف)</th>
      <th>المساحة (م²)</th>
      <th>النسبة (%)</th>
      <th>العرض الأول (أعلى)</th>
      <th>العرض الثاني (أسفل)</th>
      <th title="معدل العرض = (العرض الأول + العرض الثاني) ÷ 2" style="cursor: help;">معدل العرض (م)</th>
      <th title="معدل الطول = المساحة ÷ معدل العرض" style="cursor: help;">معدل الطول (م)</th>
      <th title="العلامة: المدى التراكمي لعرض القطعة من اليمين (نقطة الصفر) إلى اليسار" style="cursor: help;">العلامة (م)</th>
      <th>حذف</th>
    `;
    
    footerContainer.innerHTML = `
      <td class="index-group"><input type="text" readonly value="-" style="font-weight: bold; background: #222; color: white;"></td>
      <td class="name-group"><input type="text" readonly value="الإجمالي" style="font-weight: bold; background: #222; color: white;"></td>
      <td class="fraction-group"><input type="text" id="total-fraction-entered" readonly value="0%" style="font-weight: bold; background: #222; color: white;"></td>
      <td class="equiv-group"><input type="text" readonly value="-" style="font-weight: bold; background: #222; color: white;"></td>
      <td class="area-group"><input type="text" id="total-area-distributed" readonly value="0" style="font-weight: bold; background: #222; color: white;"></td>
      <td class="percent-group"><input type="text" id="total-percent-distributed" readonly value="0%" style="font-weight: bold; background: #222; color: white;"></td>
      <td class="width-top-group"><input type="text" id="total-width-top-calculated" readonly value="-" style="font-weight: bold; background: #222; color: white;"></td>
      <td class="width-bottom-group"><input type="text" id="total-width-bottom-calculated" readonly value="-" style="font-weight: bold; background: #222; color: white;"></td>
      <td class="width-avg-group"><input type="text" readonly value="-" style="font-weight: bold; background: #222; color: white;"></td>
      <td class="length-avg-group"><input type="text" readonly value="-" style="font-weight: bold; background: #222; color: white;"></td>
      <td class="cum-group"><input type="text" readonly value="-" style="font-weight: bold; background: #222; color: white;"></td>
      <td class="delete-group"><input type="text" readonly value="-" style="font-weight: bold; background: #222; color: white;"></td>
    `;
  }
}

function handleInputMethodChange() {
  currentInputMethod = document.getElementById("share-input-method").value;
  renderHeaderAndFooter();
  
  const list = document.getElementById("partners-list");
  const rows = list.querySelectorAll(".partner-row");
  const savedPartners = [];
  
  const l1 = parseFloat(document.getElementById("length1").value) || 0;
  const l2 = parseFloat(document.getElementById("length2").value) || 0;
  const w1 = parseFloat(document.getElementById("width1").value) || 0;
  const w2 = parseFloat(document.getElementById("width2").value) || 0;
  const w = (w1 + w2) / 2;
  const totalAreaM2 = ((l1 + l2) / 2) * w;
  
  let caratArea = parseFloat(document.getElementById("input-carat-area").value);
  if (caratArea === 0) {
    caratArea = parseFloat(document.getElementById("other-carat-area").value) || 0;
  }
  
  rows.forEach(row => {
    const name = row.querySelector(".partner-name").value;
    if (currentInputMethod === "carats") {
      const fractionInput = row.querySelector(".partner-fraction");
      const fractionStr = fractionInput ? fractionInput.value : "";
      const fracVal = parseFraction(fractionStr);
      
      let f = "";
      let c = "";
      let s = "";
      if (totalAreaM2 > 0 && caratArea > 0 && fracVal > 0) {
        const partnerCarats = fracVal * (totalAreaM2 / caratArea);
        f = Math.floor(partnerCarats / 24);
        c = Math.floor(partnerCarats % 24);
        s = Number(((partnerCarats - (f * 24 + c)) * 24).toFixed(2));
      }
      savedPartners.push({ name, feddans: f, carats: c, shares: s, fraction: "" });
    } else {
      const feddanInput = row.querySelector(".partner-feddans");
      const caratInput = row.querySelector(".partner-carats");
      const shareInput = row.querySelector(".partner-shares");
      const f = parseFloat(feddanInput ? feddanInput.value : 0) || 0;
      const c = parseFloat(caratInput ? caratInput.value : 0) || 0;
      const s = parseFloat(shareInput ? shareInput.value : 0) || 0;
      
      const partnerCarats = (f * 24) + c + (s / 24);
      
      let fracStr = "";
      if (totalAreaM2 > 0 && caratArea > 0 && partnerCarats > 0) {
        const totalCaratsAvailable = totalAreaM2 / caratArea;
        const fracVal = partnerCarats / totalCaratsAvailable;
        fracStr = fracVal.toFixed(4);
      }
      savedPartners.push({ name, feddans: "", carats: "", shares: "", fraction: fracStr });
    }
  });
  
  list.innerHTML = "";
  const isOptimized = window.DALLAL_PERF && window.DALLAL_PERF.documentFragment;
  const target = isOptimized ? document.createDocumentFragment() : list;
  savedPartners.forEach(p => {
    addNewPartnerRow(p.name, p.feddans, p.carats, p.shares, p.fraction, "-", "-", false, target);
  });
  if (isOptimized) {
    list.appendChild(target);
  }
  
  saveAndCalc();
}

function addNewPartnerRow(name = "", feddans = "", carats = "", shares = "", fraction = "", botW = "-", topW = "-", shouldFocus = false, appendTarget = null) {
  // If name is not provided, generate default name based on current rows count
  if (!name) {
    const list = document.getElementById("partners-list");
    const currentCount = list ? list.querySelectorAll(".partner-row").length : 0;
    name = `شريك ${currentCount + 1}`;
  }

  // تصفية وضع التعديل قبل إضافة صف جديد لضمان تحديث الحسابات فوراً
  if (!feddans && !carats && !shares && !fraction) {
  }

  const list = document.getElementById("partners-list");
  const row = document.createElement("tr");
  row.className = "partner-row";
  
  // تهيئة وتنسيق قيم العرض لمنع الكسور الطويلة
  let formattedFeddans = "";
  if (feddans !== "" && feddans !== null && feddans !== undefined) {
    const fVal = parseFloat(feddans);
    if (!isNaN(fVal)) formattedFeddans = Math.round(fVal);
  }
  
  let formattedCarats = "";
  if (carats !== "" && carats !== null && carats !== undefined) {
    const cVal = parseFloat(carats);
    if (!isNaN(cVal)) formattedCarats = Math.round(cVal);
  }
  
  let formattedShares = "";
  if (shares !== "" && shares !== null && shares !== undefined) {
    const sVal = parseFloat(shares);
    if (!isNaN(sVal)) formattedShares = Number(sVal.toFixed(2));
  }

  if (currentInputMethod === "carats") {
    row.innerHTML = `
      <td class="index-group">
        <input type="text" class="partner-index" readonly value="-">
      </td>
      <td class="name-group">
        <input type="text" class="partner-name" placeholder="اسم الشريك" value="${name}" oninput="onPartnerNameInput(this)" onblur="onPartnerNameBlur(this)" onkeydown="if(event.key==='Enter')this.blur()">
      </td>
      <td class="share-group">
        <input type="text" inputmode="decimal" class="partner-shares" placeholder="0" value="${formattedShares}" oninput="onShareInput(this)" onblur="normalizeInputFCS(this)" onkeydown="if(event.key==='Enter')this.blur()">
      </td>
      <td class="carat-group">
        <input type="text" inputmode="decimal" class="partner-carats" placeholder="0" value="${formattedCarats}" oninput="onShareInput(this)" onblur="normalizeInputFCS(this)" onkeydown="if(event.key==='Enter')this.blur()">
      </td>
      <td class="feddan-group">
        <input type="text" inputmode="decimal" class="partner-feddans" placeholder="0" value="${feddans}" oninput="onShareInput(this)" onblur="normalizeInputFCS(this)" onkeydown="if(event.key==='Enter')this.blur()">
      </td>
      <td class="area-group">
        <input type="text" inputmode="decimal" class="partner-area" value="-" oninput="onAreaInput(this)" onblur="onAreaInput(this)" onkeydown="if(event.key==='Enter')this.blur()">
      </td>
      <td class="percent-group">
        <input type="text" inputmode="decimal" class="partner-percent" value="-" oninput="onPercentInput(this)" onblur="onPercentInput(this)" onkeydown="if(event.key==='Enter')this.blur()">
      </td>
      <td class="width-top-group">
        <div class="width-input-container">
          <button type="button" class="width-step-btn" onclick="adjustWidthStep(this, 'top', -1)">-</button>
          <input type="text" inputmode="decimal" class="partner-width-top" oninput="onWidthChange(this, 'top')" onblur="onWidthChange(this, 'top')" onkeydown="if(event.key==='Enter')this.blur()" value="${topW}" data-last-val="${topW}">
          <button type="button" class="width-step-btn" onclick="adjustWidthStep(this, 'top', 1)">+</button>
        </div>
      </td>
      <td class="width-bottom-group">
        <div class="width-input-container">
          <button type="button" class="width-step-btn" onclick="adjustWidthStep(this, 'bottom', -1)">-</button>
          <input type="text" inputmode="decimal" class="partner-width-bottom" oninput="onWidthChange(this, 'bottom')" onblur="onWidthChange(this, 'bottom')" onkeydown="if(event.key==='Enter')this.blur()" value="${botW}" data-last-val="${botW}">
          <button type="button" class="width-step-btn" onclick="adjustWidthStep(this, 'bottom', 1)">+</button>
        </div>
      </td>
      <td class="width-avg-group">
        <input type="text" class="partner-width-avg" readonly value="-">
      </td>
      <td class="length-avg-group">
        <input type="text" class="partner-length-avg" readonly value="-">
      </td>
      <td class="cum-group">
        <textarea class="partner-cum-width" readonly>-</textarea>
      </td>
      <td>
        <button type="button" class="delete-row-btn" onclick="deletePartnerRow(this)">×</button>
      </td>
    `;
  } else {
    row.innerHTML = `
      <td class="index-group">
        <input type="text" class="partner-index" readonly value="-">
      </td>
      <td class="name-group">
        <input type="text" class="partner-name" placeholder="اسم الشريك" value="${name}" oninput="onPartnerNameInput(this)" onblur="onPartnerNameBlur(this)" onkeydown="if(event.key==='Enter')this.blur()">
      </td>
      <td class="fraction-group">
        <input type="text" class="partner-fraction" placeholder="مثال: 1/4" value="${fraction}" oninput="onShareInput()" onblur="onShareInput()" onkeydown="if(event.key==='Enter')this.blur()">
      </td>
      <td class="equiv-group">
        <input type="text" class="partner-equiv" readonly value="-">
      </td>
      <td class="area-group">
        <input type="text" inputmode="decimal" class="partner-area" value="-" oninput="onAreaInput(this)" onblur="onAreaInput(this)" onkeydown="if(event.key==='Enter')this.blur()">
      </td>
      <td class="percent-group">
        <input type="text" inputmode="decimal" class="partner-percent" value="-" oninput="onPercentInput(this)" onblur="onPercentInput(this)" onkeydown="if(event.key==='Enter')this.blur()">
      </td>
      <td class="width-top-group">
        <div class="width-input-container">
          <button type="button" class="width-step-btn" onclick="adjustWidthStep(this, 'top', -1)">-</button>
          <input type="text" inputmode="decimal" class="partner-width-top" oninput="onWidthChange(this, 'top')" onblur="onWidthChange(this, 'top')" onkeydown="if(event.key==='Enter')this.blur()" value="${topW}" data-last-val="${topW}">
          <button type="button" class="width-step-btn" onclick="adjustWidthStep(this, 'top', 1)">+</button>
        </div>
      </td>
      <td class="width-bottom-group">
        <div class="width-input-container">
          <button type="button" class="width-step-btn" onclick="adjustWidthStep(this, 'bottom', -1)">-</button>
          <input type="text" inputmode="decimal" class="partner-width-bottom" oninput="onWidthChange(this, 'bottom')" onblur="onWidthChange(this, 'bottom')" onkeydown="if(event.key==='Enter')this.blur()" value="${botW}" data-last-val="${botW}">
          <button type="button" class="width-step-btn" onclick="adjustWidthStep(this, 'bottom', 1)">+</button>
        </div>
      </td>
      <td class="width-avg-group">
        <input type="text" class="partner-width-avg" readonly value="-">
      </td>
      <td class="length-avg-group">
        <input type="text" class="partner-length-avg" readonly value="-">
      </td>
      <td class="cum-group">
        <textarea class="partner-cum-width" readonly>-</textarea>
      </td>
      <td>
        <button type="button" class="delete-row-btn" onclick="deletePartnerRow(this)">×</button>
      </td>
    `;
  }
  
  const target = appendTarget || document.getElementById("partners-list");
  if (target) {
    target.appendChild(row);
  }
  if (!name && !feddans && !carats && !shares && !fraction) {
    isManualPartition = false;
    saveAndCalcImmediate();
  }

  if (shouldFocus) {
    const nameInput = row.querySelector(".partner-name");
    if (nameInput) {
      nameInput.focus();
    }
  }
}

function deletePartnerRow(button) {
  // إلغاء وضع التعديل وتصفير مؤقت لوحة المفاتيح لتفادي تعارض الحسابات

  const row = button.parentElement;
  row.remove();
  isManualPartition = false;
  saveAndCalcImmediate();
}

function updateRowsReadOnlyStatus() {
  const rows = document.querySelectorAll("#partners-list .partner-row");
  rows.forEach((row, index) => {
    const isFirst = (index === 0);

  });
}

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
  saveData();
  
  const l1 = parseFloat(document.getElementById("length1").value) || 0;
  const l2 = parseFloat(document.getElementById("length2").value) || 0;
  const w1 = parseFloat(document.getElementById("width1").value) || 0;
  const w2 = parseFloat(document.getElementById("width2").value) || 0;
  
  const hasDimensions = (l1 > 0 && l2 > 0 && w1 > 0 && w2 > 0);
  
  calculateGeneral(!hasDimensions);
  
  if (hasDimensions) {
    runPartition(true);
  }
  // Refresh conversions table AFTER user leaves field (not during typing)
  updateConversionsTable();
}

function parseFraction(str) {
  if (!str) return 0;
  str = str.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).trim();
  
  if (str === "نصف" || str === "النصف") return 0.5;
  if (str === "ربع" || str === "الربع") return 0.25;
  if (str === "ثمن" || str === "الثمن") return 0.125;
  if (str === "ثلث" || str === "الثلث") return 1/3;
  if (str === "ثلثين" || str === "الثلثين") return 2/3;
  if (str === "سدس" || str === "السدس") return 1/6;

  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 2) {
      const num = parseFloat(parts[0]);
      const den = parseFloat(parts[1]);
      if (!isNaN(num) && !isNaN(den) && den !== 0) {
        return num / den;
      }
    }
  }
  return parseFloat(str) || 0;
}

function updateWidths(changedField) {
  // Obsolete function
}

function onTotalWidthChange() {
  // Obsolete function
}

function formatNum(val) {
  return Number(val.toFixed(4));
}

window.calcState = {
  totalLandArea: 0,
  totalTargetArea: 0,
  distributedArea: 0,
  remainingArea: 0,
  deficitArea: 0,
  hasDeficit: false,
  activePartnersCount: 0
};

function recalculateState() {
  const l1 = parseFloat(document.getElementById("length1") ? document.getElementById("length1").value : 0) || 0;
  const l2 = parseFloat(document.getElementById("length2") ? document.getElementById("length2").value : 0) || 0;
  const w1 = parseFloat(document.getElementById("width1") ? document.getElementById("width1").value : 0) || 0;
  const w2 = parseFloat(document.getElementById("width2") ? document.getElementById("width2").value : 0) || 0;
  const totalAreaM2 = ((l1 + l2) / 2) * ((w1 + w2) / 2);

  const rows = document.querySelectorAll("#partners-list .partner-row");
  let totalTargetArea = 0;
  let totalDistributedArea = 0;
  let activeCount = 0;

  rows.forEach(row => {
    if (!isPartnerRowExcluded(row)) {
      activeCount++;
      totalTargetArea += getPartnerTargetArea(row);
      if (isManualPartition) {
        totalDistributedArea += parseFloat(row.querySelector(".partner-area") ? row.querySelector(".partner-area").value : "0") || 0;
      } else {
        totalDistributedArea += getPartnerTargetArea(row);
      }
    }
  });

  const remainingArea = Number((totalAreaM2 - (isManualPartition ? totalDistributedArea : totalTargetArea)).toFixed(9));
  const isKeepAreaMode = window.isManualPartition && document.getElementById("mode-keep-area") && document.getElementById("mode-keep-area").checked;

  window.calcState = {
    totalLandArea: totalAreaM2,
    totalTargetArea: totalTargetArea,
    distributedArea: isManualPartition ? totalDistributedArea : totalTargetArea,
    remainingArea: remainingArea,
    deficitArea: remainingArea < -0.05 ? Math.abs(remainingArea) : 0,
    hasDeficit: (remainingArea < -0.05 && !isKeepAreaMode),
    activePartnersCount: activeCount
  };
}

function isPartnerRowExcluded(row) {
  let area = 0;
  if (isManualPartition) {
    const w1 = parseFloat(row.querySelector(".partner-width-bottom") ? row.querySelector(".partner-width-bottom").value : 0) || 0;
    const w2 = parseFloat(row.querySelector(".partner-width-top") ? row.querySelector(".partner-width-top").value : 0) || 0;
    area = w1 + w2; // if both widths are 0, area is 0
  } else {
    area = getPartnerTargetArea(row);
  }
  return area < 0.05;
}

function syncExclusionUI() {
  const rows = document.querySelectorAll("#partners-list .partner-row");
  rows.forEach((row, index) => {
    const isExcluded = isPartnerRowExcluded(row);
    const delBtn = row.querySelector(".delete-row-btn");
    const nameInput = row.querySelector(".partner-name");
    
    const indexInput = row.querySelector(".partner-index");
    if (indexInput) indexInput.value = index + 1;
    
    row.setAttribute("data-index", index);
    
    if (nameInput) {
      const currentName = nameInput.value.trim();
      const defaultNameRegex = /^شريك \d+$/;
      if (!currentName || defaultNameRegex.test(currentName)) {
        nameInput.value = `شريك ${index + 1}`;
      }
    }
    
    if (isExcluded) {
      row.style.backgroundColor = "#eceff1";
      row.style.opacity = "0.75";
      if (delBtn) delBtn.style.display = "none";
      if (nameInput) nameInput.disabled = true;
      
      const areaInput = row.querySelector(".partner-area");
      if (areaInput) {
        areaInput.value = "⚠️ مستبعد";
        areaInput.disabled = true;
      }
      
      const percentInput = row.querySelector(".partner-percent");
      if (percentInput) {
        percentInput.value = "⚠️ مستبعد";
        percentInput.disabled = true;
      }
      
      const equivInput = row.querySelector(".partner-equiv");
      if (equivInput) equivInput.value = "⚠️ مستبعد";
      
      if (isManualPartition) {
        const w1 = row.querySelector(".partner-width-bottom");
        const w2 = row.querySelector(".partner-width-top");
        if (w1) w1.disabled = false;
        if (w2) w2.disabled = false;
        
        const f = row.querySelector(".partner-feddans");
        const c = row.querySelector(".partner-carats");
        const s = row.querySelector(".partner-shares");
        const frac = row.querySelector(".partner-fraction");
        if (f) f.disabled = true;
        if (c) c.disabled = true;
        if (s) s.disabled = true;
        if (frac) frac.disabled = true;
      } else {
        const f = row.querySelector(".partner-feddans");
        const c = row.querySelector(".partner-carats");
        const s = row.querySelector(".partner-shares");
        const frac = row.querySelector(".partner-fraction");
        if (f) f.disabled = false;
        if (c) c.disabled = false;
        if (s) s.disabled = false;
        if (frac) frac.disabled = false;
        
        const w1 = row.querySelector(".partner-width-bottom");
        const w2 = row.querySelector(".partner-width-top");
        if (w1) w1.disabled = true;
        if (w2) w2.disabled = true;
      }
    } else {
      row.style.backgroundColor = "";
      row.style.opacity = "";
      if (delBtn) delBtn.style.display = "inline-block";
      if (nameInput) nameInput.disabled = false;
      
      const areaInput = row.querySelector(".partner-area");
      if (areaInput) areaInput.disabled = false;
      
      const percentInput = row.querySelector(".partner-percent");
      if (percentInput) percentInput.disabled = false;
      
      const w1 = row.querySelector(".partner-width-bottom");
      const w2 = row.querySelector(".partner-width-top");
      const f = row.querySelector(".partner-feddans");
      const c = row.querySelector(".partner-carats");
      const s = row.querySelector(".partner-shares");
      const frac = row.querySelector(".partner-fraction");
      
      if (isManualPartition) {
        if (w1) w1.disabled = false;
        if (w2) w2.disabled = false;
        if (f) f.disabled = true;
        if (c) c.disabled = true;
        if (s) s.disabled = true;
        if (frac) frac.disabled = true;
      } else {
        if (w1) w1.disabled = true;
        if (w2) w2.disabled = true;
        if (f) f.disabled = false;
        if (c) c.disabled = false;
        if (s) s.disabled = false;
        if (frac) frac.disabled = false;
      }

      row.setAttribute("data-index", index);
      
      // إعداد التظليل التبادلي عند تمرير الماوس فوق الصف في الجدول
      row.onmouseenter = () => {
        if (isPartitioned) {
          highlightSegment(index);
        }
      };
      row.onmouseleave = () => {
        if (isPartitioned) {
          removeHighlight();
        }
      };
    }
  });
}

function calculateGeneral(shouldRender = true) {
  console.log("Trace: calculateGeneral start");
  try {
  if (!window.isNormalizing) {
    window.normalizedDiff = 0;
  }
  recalculateState();
  const l1 = parseFloat(document.getElementById("length1").value) || 0;
  const l2 = parseFloat(document.getElementById("length2").value) || 0;
  const w1 = parseFloat(document.getElementById("width1").value) || 0;
  const w2 = parseFloat(document.getElementById("width2").value) || 0;

  // Update readonly displays of inputs
  if (document.getElementById("disp-length1")) document.getElementById("disp-length1").value = l1;
  if (document.getElementById("disp-length2")) document.getElementById("disp-length2").value = l2;

  const w = (w1 + w2) / 2;
  const l = (l1 + l2) / 2;
  const totalAreaM2 = AgriUnitsCompat.trapezoidArea(l1, l2, w1, w2);
  const perimeter = l1 + l2 + w1 + w2;

  const areaM2Elements = document.querySelectorAll("#calc-area-m2");
  areaM2Elements.forEach(el => {
    el.innerText = Number(totalAreaM2.toFixed(2));
  });
  
  if (document.getElementById("calc-avg-width")) {
    document.getElementById("calc-avg-width").innerText = w.toFixed(4);
  }
  if (document.getElementById("calc-avg-length")) {
    document.getElementById("calc-avg-length").innerText = l.toFixed(4);
  }
  if (document.getElementById("calc-perimeter")) {
    document.getElementById("calc-perimeter").innerText = perimeter.toFixed(4);
  }

  // Update formula text:
  if (document.getElementById("formula-details")) {
    document.getElementById("formula-details").innerText = `${w2.toFixed(4)} + ${w1.toFixed(4)} = 2 × ${w.toFixed(4)}`;
  }

  let caratArea = parseFloat(document.getElementById("input-carat-area").value);
  if (caratArea === 0) {
    caratArea = parseFloat(document.getElementById("other-carat-area").value) || 0;
  }

  if (caratArea > 0) {
    const fcs = convertSquareMetersToFCS(totalAreaM2);
    if (document.getElementById("calc-area-acre")) document.getElementById("calc-area-acre").innerText = fcs.feddan;
    if (document.getElementById("calc-area-carat")) document.getElementById("calc-area-carat").innerText = fcs.carat;
    if (document.getElementById("calc-area-shares")) document.getElementById("calc-area-shares").innerText = fcs.sahm;

    if (document.getElementById("total-area-feddans-res")) document.getElementById("total-area-feddans-res").innerText = fcs.feddan;
    if (document.getElementById("total-area-carats-res")) document.getElementById("total-area-carats-res").innerText = fcs.carat;
    if (document.getElementById("total-area-shares-res")) document.getElementById("total-area-shares-res").innerText = fcs.sahm;
  }

  if (document.getElementById("total-area-sqm-res")) {
    document.getElementById("total-area-sqm-res").innerText = Number(totalAreaM2.toFixed(2)) + " م²";
  }
  if (document.getElementById("carat-area-res")) {
    document.getElementById("carat-area-res").innerText = caratArea;
  }
  if (document.getElementById("total-perimeter-res")) {
    document.getElementById("total-perimeter-res").innerText = perimeter.toFixed(2) + " م";
  }

  let rows = document.querySelectorAll("#partners-list .partner-row");

  let totalDistributedArea = 0;

  rows.forEach((row, index) => {
    // 1. Update Serial Number (م)
    const indexInput = row.querySelector(".partner-index");
    if (indexInput) {
      indexInput.value = index === 0 ? "1 🏁" : (index + 1);
    }

    if (isPartnerRowExcluded(row)) {
      return; // Skip area calculations for excluded row
    }

    // اسم الشريك لا يُعبّأ تلقائياً أثناء الكتابة — يتم ذلك فقط عند blur إذا كان الحقل فارغاً
    // (انظر دالة onPartnerNameBlur)

    let partnerAreaM2 = 0;
    let partnerCarats = 0;
    
    if (currentInputMethod === "carats") {
      const f = parseFloat(row.querySelector(".partner-feddans") ? row.querySelector(".partner-feddans").value : 0) || 0;
      const c = parseFloat(row.querySelector(".partner-carats") ? row.querySelector(".partner-carats").value : 0) || 0;
      const s = parseFloat(row.querySelector(".partner-shares") ? row.querySelector(".partner-shares").value : 0) || 0;
      partnerAreaM2 = AgriUnitsCompat.fcsToSqm(f, c, s, caratArea);
      partnerCarats = caratArea > 0 ? (partnerAreaM2 / caratArea) : 0;
    } else {
      const fracInput = row.querySelector(".partner-fraction");
      const fracVal = parseFraction(fracInput ? fracInput.value : "");
      partnerAreaM2 = fracVal * totalAreaM2;
      partnerCarats = caratArea > 0 ? (partnerAreaM2 / caratArea) : 0;
    }
    
    if (currentInputMethod === "fractions") {
      const equivInput = row.querySelector(".partner-equiv");
      if (equivInput) {
        if (partnerAreaM2 > 0) {
          const fcs = convertSquareMetersToFCS(partnerAreaM2);
          equivInput.value = `${fcs.sahm} س، ${fcs.carat} ق، ${fcs.feddan} ف`;
        } else {
          equivInput.value = "-";
        }
      }
    }
    
    // 2. Update Area (المساحة)
    if (!isManualPartition) {
      const areaInput = row.querySelector(".partner-area");
      if (areaInput && document.activeElement !== areaInput) {
        areaInput.value = Number(partnerAreaM2.toFixed(2));
      }

      // 3. Update Percentage (النسبة)
      const percentInput = row.querySelector(".partner-percent");
      if (percentInput && document.activeElement !== percentInput) {
        const pct = totalAreaM2 > 0 ? (partnerAreaM2 / totalAreaM2) * 100 : 0;
        percentInput.value = Number(pct.toFixed(2)) + " %";
      }
      
      totalDistributedArea += partnerAreaM2;

      const widthBotInput = row.querySelector(".partner-width-bottom");
      if (widthBotInput) widthBotInput.value = "-";

      const widthTopInput = row.querySelector(".partner-width-top");
      if (widthTopInput) widthTopInput.value = "-";

      const widthAvgInput = row.querySelector(".partner-width-avg");
      if (widthAvgInput) widthAvgInput.value = "-";

      const lengthAvgInput = row.querySelector(".partner-length-avg");
      if (lengthAvgInput) lengthAvgInput.value = "-";

      const cumWidthInput = row.querySelector(".partner-cum-width");
      if (cumWidthInput) cumWidthInput.value = "-";

      const divLineInput = row.querySelector(".partner-div-line");
      if (divLineInput) divLineInput.value = "-";
    }
  });

  syncExclusionUI();

  let remainingArea = window.calcState.remainingArea;
  
  // Update summaries
  if (document.getElementById("summary-total-area")) {
    document.getElementById("summary-total-area").innerText = Number(totalAreaM2.toFixed(2)) + " م²";
  }
  if (document.getElementById("summary-rem-area")) {
    // بند رابعاً: لا تظهر قيمة سالبة — عند العجز تُستبدل العبارة بالكامل
    const remEl = document.getElementById("summary-rem-area");
    const remLabel = document.getElementById("summary-rem-area-label");
    if (remainingArea < -0.05) {
      if (remLabel) remLabel.innerText = "الزيادة عن مساحة الأرض:";
      remEl.innerText = Number(Math.abs(remainingArea).toFixed(2)) + " م²";
      remEl.style.color = "#c62828";
    } else {
      if (remLabel) remLabel.innerText = "المساحة المتبقية:";
      remEl.innerText = Number(remainingArea.toFixed(2)) + " م²";
      remEl.style.color = "";
    }
  }

  if (document.getElementById("summary-status")) {
    const statusEl = document.getElementById("summary-status");
    if (totalAreaM2 <= 0) {
      statusEl.innerHTML = "ℹ️ يرجى إدخال أبعاد الأرض لبدء الحساب.";
      statusEl.style.color = "#666";
    } else {
      const tolerance = 0.05;
      const absRem = Math.abs(remainingArea);
      const fcs = convertSquareMetersToFCS(absRem);
      const isKeepAreaMode = window.isManualPartition && document.getElementById("mode-keep-area") && document.getElementById("mode-keep-area").checked;
      
      if (absRem <= tolerance) {
        statusEl.innerHTML = "🟢 تم التقسيم بالكامل، ولا يوجد عجز أو مساحة متبقية.";
        statusEl.style.color = "#2e7d32";
      } else if (remainingArea > 0) {
        statusEl.innerHTML = `🟡 يوجد جزء غير مقسم من الأرض<br>المساحة المتبقية: <strong>${absRem.toFixed(2)} م²</strong><br>وتعادل: ${fcs.feddan} فدان، ${fcs.carat} قيراط، ${fcs.sahm} سهم.`;
        statusEl.style.color = "#e65100";
      } else {
        // remainingArea < 0 (deficit)
        if (isKeepAreaMode) {
          statusEl.innerHTML = `🔴 خطأ داخلي في الحسابات.<br>يوجد عجز مقداره <strong>${absRem.toFixed(2)} م²</strong>، ويرجى مراجعة الحسابات.`;
          statusEl.style.color = "#c62828";
        } else {
          statusEl.innerHTML = `🔴 <strong>احترس! يوجد عجز في الأرض.</strong><br>قيمة العجز: <strong>${absRem.toFixed(2)} م²</strong><br>تعادل: ${fcs.feddan} فدان، ${fcs.carat} قيراط، ${fcs.sahm} سهم.<br><span style="font-size: 11.5px; font-weight: bold; display: block; margin-top: 4px;">يجب مراجعة الأنصبة قبل اعتماد أو طباعة التقسيم.</span>`;
          statusEl.style.color = "#c62828";
        }
      }
    }
  }
  if (document.getElementById("summary-total-width")) {
    document.getElementById("summary-total-width").innerText = "-";
  }

  if (document.getElementById("info-partners-count")) {
    document.getElementById("info-partners-count").innerText = window.calcState.activePartnersCount;
  }
  if (document.getElementById("info-distributed-area")) {
    document.getElementById("info-distributed-area").innerText = Number(totalDistributedArea.toFixed(2)) + " م²";
  }
  if (document.getElementById("info-distributed-percent")) {
    const distPct = totalAreaM2 > 0 ? (totalDistributedArea / totalAreaM2) * 100 : 0;
    document.getElementById("info-distributed-percent").innerText = Number(distPct.toFixed(2)) + " %";
  }
  if (document.getElementById("info-last-div-line")) {
    document.getElementById("info-last-div-line").innerText = "-";
  }

  if (document.getElementById("rem-area-m2")) {
    document.getElementById("rem-area-m2").innerText = Number(Math.abs(remainingArea).toFixed(2));
  }

  if (caratArea > 0) {
    const isNegative = remainingArea < -0.005;
    const absRemaining = Math.abs(remainingArea);
    const fcs = convertSquareMetersToFCS(absRemaining);

    document.getElementById("rem-acres").innerText = fcs.feddan;
    document.getElementById("rem-carats").innerText = fcs.carat;
    document.getElementById("rem-shares").innerText = fcs.sahm;

    const box = document.querySelector(".table-remaining-box");
    const redistBtn = document.getElementById("btn-redistribute-remainder");
    if (box) {
      const isZero = Math.abs(remainingArea) < 0.05;
      const isKeepAreaMode = window.isManualPartition && document.getElementById("mode-keep-area") && document.getElementById("mode-keep-area").checked;
      
      if (isZero) {
        box.style.display = "none";
        if (redistBtn) redistBtn.style.display = "none";
      } else if (remainingArea < 0 && isKeepAreaMode) {
        box.style.display = "flex";
        box.classList.add("deficit-mode");
        box.style.backgroundColor = "#ffebee";
        box.style.borderColor = "#ffcdd2";
        box.children[0].innerText = "🔴 خطأ داخلي (عجز):";
        box.children[0].style.color = "#c62828";
        box.children[1].style.color = "#c62828";
        if (redistBtn) redistBtn.style.display = "none";
      } else {
        box.style.display = "flex";
        if (remainingArea < 0) {
          box.classList.add("deficit-mode");
          box.style.backgroundColor = "#ffebee";
          box.style.borderColor = "#ffcdd2";
          box.children[0].innerText = "🔴 قيمة العجز:";
          box.children[0].style.color = "#c62828";
          box.children[1].style.color = "#c62828";
          if (redistBtn) redistBtn.style.display = "none";
        } else {
          box.classList.remove("deficit-mode");
          box.style.backgroundColor = "#fff8e1"; // Amber background
          box.style.borderColor = "#ffe082";     // Amber border
          box.children[0].innerText = "🟡 يوجد جزء متبقٍ من الأرض يعادل:";
          box.children[0].style.color = "#e65100"; // Amber text
          box.children[1].style.color = "#e65100";
          if (redistBtn) redistBtn.style.display = "inline-flex";
        }
      }
    }
  }
  
  updateTableRowsUI();
  updateRemainderRowUI(remainingArea);
  updateTableTotals();
  adjustNameColumnWidth();
  updateConversionsTable();
  if (shouldRender) {
    renderCroquis();
  }
  updateCalculationSteps();
  } catch (e) {
    console.error("Error in calculateGeneral:", e);
  }
}

function restoreLastValidGeometryValues() {
  if (!window.lastValidGeometry) return;
  
  // 1. Restore calculatedPieces
  window.calculatedPieces = JSON.parse(JSON.stringify(window.lastValidGeometry.pieces));
  
  // 2. Restore geometric values in the partner rows
  const rows = document.querySelectorAll("#partners-list .partner-row");
  rows.forEach((row, index) => {
    const backupRow = window.lastValidGeometry.rowValues[index];
    if (!backupRow) return;
    
    // Only restore width inputs in automatic mode, to avoid locking inputs when user edits manually
    if (!isManualPartition) {
      const widthBotInput = row.querySelector(".partner-width-bottom");
      if (widthBotInput) widthBotInput.value = backupRow.widthBottom;
      
      const widthTopInput = row.querySelector(".partner-width-top");
      if (widthTopInput) widthTopInput.value = backupRow.widthTop;
    }
    
    // Average Width and Length (Readonly)
    const widthAvgInput = row.querySelector(".partner-width-avg");
    if (widthAvgInput) widthAvgInput.value = backupRow.widthAvg;
    
    const lengthAvgInput = row.querySelector(".partner-length-avg");
    if (lengthAvgInput) lengthAvgInput.value = backupRow.lengthAvg;
    
    // Cumulative width (Readonly textarea)
    const cumWidthInput = row.querySelector(".partner-cum-width");
    if (cumWidthInput) cumWidthInput.value = backupRow.cumWidth;
    
    // Division line (Readonly)
    const divLineInput = row.querySelector(".partner-div-line");
    if (divLineInput) divLineInput.value = backupRow.divLine;
  });
  
  // 3. Restore Remainder row values
  const remRow = document.getElementById("remainder-row-table");
  if (remRow && window.lastValidGeometry.remainderRowValues) {
    const inputs = remRow.querySelectorAll("input, textarea");
    inputs.forEach((inp, idx) => {
      if (idx < window.lastValidGeometry.remainderRowValues.length) {
        inp.value = window.lastValidGeometry.remainderRowValues[idx];
      }
    });
  }
  
  // 4. Restore total widths in the footer (only in automatic mode)
  if (!isManualPartition) {
    if (document.getElementById("total-width-bottom-calculated")) {
      document.getElementById("total-width-bottom-calculated").value = window.lastValidGeometry.totals.bottom;
    }
    if (document.getElementById("total-width-top-calculated")) {
      document.getElementById("total-width-top-calculated").value = window.lastValidGeometry.totals.top;
    }
    if (document.getElementById("summary-total-width")) {
      document.getElementById("summary-total-width").innerText = window.lastValidGeometry.summaryTotalWidth;
    }
  }
  
  if (document.getElementById("info-last-div-line")) {
    document.getElementById("info-last-div-line").innerText = window.lastValidGeometry.infoLastDivLine;
  }
  
  // 5. Restore steps breakdown HTML
  const stepsContainer = document.getElementById("calculation-steps-container");
  if (stepsContainer) {
    stepsContainer.innerHTML = window.lastValidGeometry.calculationStepsHTML;
  }
}

function runPartition(shouldRender = true) {
  console.log("Trace: runPartition started");
  ensureDimensionsAutofill();
  const l1 = parseFloat(document.getElementById("length1").value) || 0;
  const l2 = parseFloat(document.getElementById("length2").value) || 0;
  const w1 = parseFloat(document.getElementById("width1").value) || 0;
  const w2 = parseFloat(document.getElementById("width2").value) || 0;

  if (l1 <= 0 || l2 <= 0 || w1 <= 0 || w2 <= 0) {
    console.warn("[runPartition] Early return: one of the dimensions is <= 0", {l1, l2, w1, w2});
    return;
  }

  const w = (w1 + w2) / 2;
  const totalAreaM2 = ((l1 + l2) / 2) * w;

  let caratArea = parseFloat(document.getElementById("input-carat-area").value);
  if (caratArea === 0) {
    caratArea = parseFloat(document.getElementById("other-carat-area").value) || 0;
  }

  isPartitioned = true;

  // بند ثالثاً وثامناً: تحقق من وجود عجز — إذا كانت الأنصبة تتجاوز مساحة الأرض، جمد جميع المخرجات الهندسية
  recalculateState();
  if (window.calcState.hasDeficit) {
    console.warn("[runPartition] Early return: deficit detected", window.calcState);
    // إظهار التنبيه بوجود عجز وتجميد الكروكي
    const warningBanner = document.getElementById("croquis-deficit-warning");
    if (warningBanner) warningBanner.style.display = "flex";
    
    // استعادة آخر حالة هندسية صحيحة (تجميد الكروكي وجميع المخرجات الهندسية)
    if (window.lastValidGeometry) {
      restoreLastValidGeometryValues();
    }
    
    // تحديث ملخص التقسيم لإظهار العجز
    const remainingArea = window.calcState.remainingArea;
    if (document.getElementById("summary-total-area")) {
      document.getElementById("summary-total-area").innerText = Number(totalAreaM2.toFixed(2)) + " م²";
    }
    if (document.getElementById("summary-rem-area")) {
      const remEl = document.getElementById("summary-rem-area");
      const remLabel = document.getElementById("summary-rem-area-label");
      if (remLabel) remLabel.innerText = "الزيادة عن مساحة الأرض:";
      remEl.innerText = Number(Math.abs(remainingArea).toFixed(2)) + " م²";
      remEl.style.color = "#c62828";
    }
    if (shouldRender) {
      renderCroquis(); // يعيد رسم الكروكي المجمد
    }
    return; // لا تُعيد حساب الأبعاد الهندسية
  } else {
    // إخفاء تنبيه العجز عند زوال العجز
    const warningBanner = document.getElementById("croquis-deficit-warning");
    if (warningBanner) warningBanner.style.display = "none";
  }

  const rows = document.querySelectorAll("#partners-list .partner-row");
  let lastT_bot = 0;
  let lastT_top = 0;
  let totalDistributedArea = 0;
  let totalBotWidthCalculated = 0;
  let totalTopWidthCalculated = 0;
  
  window.calculatedPieces = [];
  const diff = l2 - l1;


  rows.forEach((row, index) => {
    if (isPartnerRowExcluded(row)) {
      return; // Skip calculations for excluded row
    }
    let botWidth = 0;
    let topWidth = 0;
    let tCurr_bot = 0;
    let tCurr_top = 0;
    let rightLength = 0;
    let leftLength = 0;
    let calculatedGeoArea = 0;

    const widthBotInput = row.querySelector(".partner-width-bottom");
    const widthTopInput = row.querySelector(".partner-width-top");

    if (isManualPartition) {
      // Manual partition: read widths directly from inputs
      botWidth = parseFloat(widthBotInput ? widthBotInput.value : 0) || 0;
      topWidth = parseFloat(widthTopInput ? widthTopInput.value : 0) || 0;

      tCurr_bot = lastT_bot + (botWidth / w1);
      tCurr_top = lastT_top + (topWidth / w2);

      if (tCurr_bot > 1.0) tCurr_bot = 1.0;
      if (tCurr_top > 1.0) tCurr_top = 1.0;

      botWidth = w1 * (tCurr_bot - lastT_bot);
      topWidth = w2 * (tCurr_top - lastT_top);

      rightLength = l1 + lastT_top * diff;
      leftLength = l1 + tCurr_top * diff;
      calculatedGeoArea = ((rightLength + leftLength) / 2) * ((botWidth + topWidth) / 2);
    } else {
      // Automatic area partition: calculate widths to match shares
      let partnerAreaM2 = 0;
      let partnerCarats = 0;
      
      if (currentInputMethod === "carats") {
        const f = parseFloat(row.querySelector(".partner-feddans") ? row.querySelector(".partner-feddans").value : 0) || 0;
        const c = parseFloat(row.querySelector(".partner-carats") ? row.querySelector(".partner-carats").value : 0) || 0;
        const s = parseFloat(row.querySelector(".partner-shares") ? row.querySelector(".partner-shares").value : 0) || 0;
        partnerCarats = (f * 24) + c + s / 24;
        partnerAreaM2 = partnerCarats * caratArea;
      } else {
        const fracInput = row.querySelector(".partner-fraction");
        const fracVal = parseFraction(fracInput ? fracInput.value : "");
        partnerAreaM2 = fracVal * totalAreaM2;
        partnerCarats = caratArea > 0 ? (partnerAreaM2 / caratArea) : 0;
      }

      // Solves for tCurr_top and tCurr_bot to match partnerAreaM2 exactly
      const L_right = l1 + lastT_top * diff;
      let t_next = 0;
      if (Math.abs(diff) < 1e-9) {
        const dt = partnerAreaM2 / (w * l1);
        t_next = lastT_top + dt;
      } else {
        const valInsideRoot = L_right * L_right + (2 * diff * partnerAreaM2) / w;
        const dt = (-L_right + Math.sqrt(Math.max(0, valInsideRoot))) / diff;
        t_next = lastT_top + dt;
      }

      if (t_next > 1.0) t_next = 1.0;

      tCurr_bot = t_next;
      tCurr_top = t_next;

      botWidth = w1 * (tCurr_bot - lastT_bot);
      topWidth = w2 * (tCurr_top - lastT_top);

      rightLength = L_right;
      leftLength = l1 + tCurr_top * diff;
      calculatedGeoArea = ((rightLength + leftLength) / 2) * ((botWidth + topWidth) / 2);
    }

    const tPrev_bot = lastT_bot;
    const tPrev_top = lastT_top;

    const botStart = tPrev_bot * w1;
    const botEnd = tCurr_bot * w1;
    
    const topStart = tPrev_top * w2;
    const topEnd = tCurr_top * w2;

    totalBotWidthCalculated += botWidth;
    totalTopWidthCalculated += topWidth;
    totalDistributedArea += calculatedGeoArea;

    if (widthBotInput && document.activeElement !== widthBotInput) {
      widthBotInput.value = botWidth.toFixed(4);
      widthBotInput.setAttribute("data-last-val", botWidth.toFixed(4));
    } else if (widthBotInput) {
      widthBotInput.setAttribute("data-last-val", botWidth.toFixed(4));
    }
    if (widthTopInput && document.activeElement !== widthTopInput) {
      widthTopInput.value = topWidth.toFixed(4);
      widthTopInput.setAttribute("data-last-val", topWidth.toFixed(4));
    } else if (widthTopInput) {
      widthTopInput.setAttribute("data-last-val", topWidth.toFixed(4));
    }

    const widthAvgInput = row.querySelector(".partner-width-avg");
    if (widthAvgInput) {
      const avgW = (botWidth + topWidth) / 2;
      widthAvgInput.value = avgW > 0 ? avgW.toFixed(4) : "-";
    }

    const lengthAvgInput = row.querySelector(".partner-length-avg");
    if (lengthAvgInput) {
      const avgW = (botWidth + topWidth) / 2;
      const avgL = avgW > 0 ? (calculatedGeoArea / avgW) : 0;
      lengthAvgInput.value = avgL > 0 ? avgL.toFixed(4) : "-";
    }

    const cumWidthInput = row.querySelector(".partner-cum-width");
    if (cumWidthInput) {
      cumWidthInput.value = `من اليمين\nأعلى:\n${topStart.toFixed(4)} → ${topEnd.toFixed(4)} م\nأسفل:\n${botStart.toFixed(4)} → ${botEnd.toFixed(4)} م`;
    }

    const divLineInput = row.querySelector(".partner-div-line");
    if (divLineInput) {
      divLineInput.value = `يمين: ${rightLength.toFixed(4)} م | يسار: ${leftLength.toFixed(4)} م`;
    }
    
    const areaInput = row.querySelector(".partner-area");
    if (areaInput && document.activeElement !== areaInput) {
      areaInput.value = Number(calculatedGeoArea.toFixed(2));
    }

    const percentInput = row.querySelector(".partner-percent");
    if (percentInput && document.activeElement !== percentInput) {
      const pct = totalAreaM2 > 0 ? (calculatedGeoArea / totalAreaM2) * 100 : 0;
      percentInput.value = Number(pct.toFixed(2)) + " %";
    }
    
    // Update shares/fractions to match the calculated geometric area (only in manual partition mode)
    if (isManualPartition) {
      if (currentInputMethod === "carats") {
        const fcs = convertSquareMetersToFCS(calculatedGeoArea);
        const feddansInput = row.querySelector(".partner-feddans");
        const caratsInput = row.querySelector(".partner-carats");
        const sharesInput = row.querySelector(".partner-shares");
        if (feddansInput && document.activeElement !== feddansInput) feddansInput.value = fcs.feddan;
        if (caratsInput && document.activeElement !== caratsInput) caratsInput.value = fcs.carat;
        if (sharesInput && document.activeElement !== sharesInput) sharesInput.value = fcs.sahm;
      } else {
        const fracInput = row.querySelector(".partner-fraction");
        if (fracInput && document.activeElement !== fracInput) fracInput.value = (calculatedGeoArea / totalAreaM2).toFixed(4);
        
        const equivInput = row.querySelector(".partner-equiv");
        if (equivInput) {
          const fcs = convertSquareMetersToFCS(calculatedGeoArea);
          equivInput.value = `${fcs.sahm} س، ${fcs.carat} ق، ${fcs.feddan} ف`;
        }
      }
    }
    
    const partnerName = row.querySelector(".partner-name").value || `شريك ${index + 1}`;
    window.calculatedPieces.push({
        name: partnerName,
        startX: tPrev_top * w,
        endX: tCurr_top * w,
        tPrev_top: tPrev_top,
        tCurr_top: tCurr_top,
        tPrev_bot: tPrev_bot,
        tCurr_bot: tCurr_bot,
        botW: botWidth,
        topW: topWidth,
        width: (botWidth + topWidth) / 2,
        area: calculatedGeoArea,
        divLine: leftLength,
        leftLine: rightLength 
    });

    lastT_bot = tCurr_bot;
    lastT_top = tCurr_top;
  });

  // حساب وإضافة قطعة المتبقي إذا كانت المساحة الموزعة أقل من المساحة الكلية للأرض
  const remainingFraction = 1.0 - lastT_top;
  if (remainingFraction > 0.0005) {
    const remBotW = w1 * (1.0 - lastT_bot);
    const remTopW = w2 * (1.0 - lastT_top);
    const remRightLength = l1 + lastT_top * diff; // خط الفاصل الأخير للشركاء (الجانب الأيمن للمتبقي)
    const remLeftLength = l2; // الحد الأيسر للأرض الأصلية (الجانب الأيسر للمتبقي)
    const remArea = Math.max(0, totalAreaM2 - totalDistributedArea);

    window.calculatedPieces.push({
      name: "المتبقي",
      startX: lastT_top * w,
      endX: 1.0 * w,
      tPrev_top: lastT_top,
      tCurr_top: 1.0,
      tPrev_bot: lastT_bot,
      tCurr_bot: 1.0,
      botW: remBotW,
      topW: remTopW,
      width: (remBotW + remTopW) / 2,
      area: remArea,
      divLine: remLeftLength,
      leftLine: remRightLength,
      isRemainder: true
    });
  }

  if (document.getElementById("total-width-bottom-calculated")) {
    document.getElementById("total-width-bottom-calculated").value = totalBotWidthCalculated.toFixed(4);
  }
  if (document.getElementById("total-width-top-calculated")) {
    document.getElementById("total-width-top-calculated").value = totalTopWidthCalculated.toFixed(4);
  }
  if (document.getElementById("summary-total-width")) {
    document.getElementById("summary-total-width").innerText = `أسفل: ${totalBotWidthCalculated.toFixed(4)} م | أعلى: ${totalTopWidthCalculated.toFixed(4)} م`;
  }
  if (document.getElementById("info-last-div-line")) {
    let lastDivLine = l1;
    if (window.calculatedPieces.length > 0) {
      lastDivLine = window.calculatedPieces[window.calculatedPieces.length - 1].divLine;
    }
    document.getElementById("info-last-div-line").innerText = lastDivLine.toFixed(4) + " م";
  }

  // Central Final Normalization Phase
  const sumTargetAreas = Array.from(rows).filter(r => !isPartnerRowExcluded(r)).reduce((sum, r) => sum + getPartnerTargetArea(r), 0);
  const diffNorm = totalAreaM2 - sumTargetAreas;
  const toleranceNorm = 0.25;
  if (!window.isNormalizing && Math.abs(diffNorm) <= toleranceNorm && Math.abs(diffNorm) > 1e-7) {
    const activeRows = Array.from(rows).filter(r => !isPartnerRowExcluded(r));
    if (activeRows.length > 0) {
      const lastActiveRow = activeRows[activeRows.length - 1];
      
      const currentTargetArea = getPartnerTargetArea(lastActiveRow);
      const correctArea = currentTargetArea + diffNorm;
      
      window.isNormalizing = true;
      window.normalizedDiff = diffNorm;
      
      if (currentInputMethod === "carats") {
        const fcs = convertSquareMetersToFCS(correctArea);
        const feddansInput = lastActiveRow.querySelector(".partner-feddans");
        const caratsInput = lastActiveRow.querySelector(".partner-carats");
        const sharesInput = lastActiveRow.querySelector(".partner-shares");
        if (feddansInput && document.activeElement !== feddansInput) feddansInput.value = fcs.feddan > 0 ? fcs.feddan : "";
        if (caratsInput && document.activeElement !== caratsInput) caratsInput.value = fcs.carat > 0 ? fcs.carat : "";
        if (sharesInput && document.activeElement !== sharesInput) sharesInput.value = fcs.sahm > 0 ? fcs.sahm : "";
      } else {
        const fracInput = lastActiveRow.querySelector(".partner-fraction");
        if (fracInput && document.activeElement !== fracInput) {
          fracInput.value = (correctArea / totalAreaM2).toFixed(6);
        }
      }
      
      calculateGeneral(false);
      runPartition(false);
      window.isNormalizing = false;
      if (shouldRender) {
        renderCroquis();
      }
      return;
    }
  }

  // update the remaining area card
  recalculateState();
  let remainingArea = window.calcState.remainingArea;

  // Update summaries to match actual layout partition
  if (document.getElementById("summary-total-area")) {
    document.getElementById("summary-total-area").innerText = Number(totalAreaM2.toFixed(2)) + " م²";
  }
  if (document.getElementById("summary-rem-area")) {
    // بند رابعاً: لا تظهر قيمة سالبة — عند العجز تُستبدل العبارة بالكامل
    const remEl = document.getElementById("summary-rem-area");
    const remLabel = document.getElementById("summary-rem-area-label");
    if (remainingArea < -0.05) {
      if (remLabel) remLabel.innerText = "الزيادة عن مساحة الأرض:";
      remEl.innerText = Number(Math.abs(remainingArea).toFixed(2)) + " م²";
      remEl.style.color = "#c62828";
    } else {
      if (remLabel) remLabel.innerText = "المساحة المتبقية:";
      remEl.innerText = Number(remainingArea.toFixed(2)) + " م²";
      remEl.style.color = "";
    }
  }
  if (document.getElementById("rem-area-m2")) {
    document.getElementById("rem-area-m2").innerText = Number(Math.abs(remainingArea).toFixed(2));
  }
  if (document.getElementById("summary-status")) {
    const statusEl = document.getElementById("summary-status");
    const tolerance = 0.05;
    const absRem = Math.abs(remainingArea);
    const fcs = convertSquareMetersToFCS(absRem);
    const isKeepAreaMode = window.isManualPartition && document.getElementById("mode-keep-area") && document.getElementById("mode-keep-area").checked;
    
    if (absRem <= tolerance) {
      let normText = "";
      if (window.normalizedDiff) {
        normText = `<br><span style="font-size: 11.5px; font-weight: bold; color: #2e7d32;">(تمت معالجة فرق تقريب مقداره ${Math.abs(window.normalizedDiff).toFixed(3)} م²)</span>`;
      }
      statusEl.innerHTML = "🟢 تم التقسيم بالكامل، ولا يوجد عجز أو مساحة متبقية." + normText;
      statusEl.style.color = "#2e7d32";
    } else if (remainingArea > 0) {
      statusEl.innerHTML = `🟡 يوجد جزء غير مقسم من الأرض<br>المساحة المتبقية: <strong>${absRem.toFixed(2)} م²</strong><br>وتعادل: ${fcs.feddan} فدان، ${fcs.carat} قيراط، ${fcs.sahm} سهم.`;
      statusEl.style.color = "#e65100";
    } else {
      // remainingArea < 0 (deficit)
      if (isKeepAreaMode) {
        statusEl.innerHTML = `🔴 خطأ داخلي في الحسابات.<br>يوجد عجز مقداره <strong>${absRem.toFixed(2)} م²</strong>، ويرجى مراجعة الحسابات.`;
        statusEl.style.color = "#c62828";
      } else {
        const targetTotal = sumTargetAreas || (totalAreaM2 - remainingArea);
        const targetPct = totalAreaM2 > 0 ? (targetTotal / totalAreaM2) * 100 : 0;
        statusEl.innerHTML = `🔴 <strong>احترس! يوجد عجز في الأرض.</strong>
<br><br>مساحة الأرض الفعلية: <strong>${totalAreaM2.toFixed(2)} م²</strong>
<br>────────────────
<br>إجمالي الأنصبة المطلوبة: <strong>${targetTotal.toFixed(2)} م²</strong>
<br>────────────────
<br>نسبة الأنصبة المطلوبة: <strong>${targetPct.toFixed(2)} %</strong>
<br>────────────────
<br>العجز: <strong>${absRem.toFixed(2)} م²</strong>
<br>≈ ${fcs.feddan} فدان، ${fcs.carat} قيراط، ${fcs.sahm} سهم
<br><span style="font-size: 11.5px; font-weight: bold; display: block; margin-top: 4px;">يجب مراجعة الأنصبة قبل اعتماد أو طباعة التقسيم.</span>`;
        statusEl.style.color = "#c62828";
      }
    }
  }
  if (document.getElementById("info-distributed-area")) {
    document.getElementById("info-distributed-area").innerText = Number(totalDistributedArea.toFixed(2)) + " م²";
  }
  if (document.getElementById("info-distributed-percent")) {
    const distPct = totalAreaM2 > 0 ? (totalDistributedArea / totalAreaM2) * 100 : 0;
    document.getElementById("info-distributed-percent").innerText = Number(distPct.toFixed(2)) + " %";
  }

  // إظهار / إخفاء صفوف إجمالي الأنصبة المطلوبة والعجز
  {
    const isDeficit = remainingArea < -0.01;
    const targetTotal = sumTargetAreas || 0;
    const targetPct = totalAreaM2 > 0 ? (targetTotal / totalAreaM2) * 100 : 0;
    const deficitM2 = Math.abs(remainingArea);
    const rowTA = document.getElementById("row-target-area");
    const rowTP = document.getElementById("row-target-percent");
    const rowDN = document.getElementById("row-deficit-needed");
    const elTA = document.getElementById("info-target-area");
    const elTP = document.getElementById("info-target-percent");
    const elDN = document.getElementById("info-deficit-needed");
    if (rowTA) rowTA.style.display = isDeficit ? "flex" : "none";
    if (rowTP) rowTP.style.display = isDeficit ? "flex" : "none";
    if (rowDN) rowDN.style.display = isDeficit ? "flex" : "none";
    if (isDeficit) {
      if (elTA) elTA.innerText = targetTotal.toFixed(2) + " م²";
      if (elTP) elTP.innerText = targetPct.toFixed(2) + " %";
      if (elDN) elDN.innerText = deficitM2.toFixed(2) + " م²";
    }
  }

  const remAcres = document.getElementById("rem-acres");
  if (remAcres) {
    const isNegative = remainingArea < -0.05;
    const absRem = Math.abs(remainingArea);
    const fcs = convertSquareMetersToFCS(absRem);

    document.getElementById("rem-acres").innerText = fcs.feddan;
    document.getElementById("rem-carats").innerText = fcs.carat;
    document.getElementById("rem-shares").innerText = fcs.sahm;

    const box = document.querySelector(".table-remaining-box");
    const redistBtn = document.getElementById("btn-redistribute-remainder");
    if (box) {
      const isZero = Math.abs(remainingArea) < 0.05;
      const isKeepAreaMode = window.isManualPartition && document.getElementById("mode-keep-area") && document.getElementById("mode-keep-area").checked;
      
      if (isZero) {
        box.style.display = "none";
        if (redistBtn) redistBtn.style.display = "none";
      } else if (remainingArea < 0 && isKeepAreaMode) {
        box.style.display = "flex";
        box.classList.add("deficit-mode");
        box.style.backgroundColor = "#ffebee";
        box.style.borderColor = "#ffcdd2";
        box.children[0].innerText = "🔴 خطأ داخلي (عجز):";
        box.children[0].style.color = "#c62828";
        box.children[1].style.color = "#c62828";
        if (redistBtn) redistBtn.style.display = "none";
      } else {
        box.style.display = "flex";
        if (remainingArea < 0) {
          box.classList.add("deficit-mode");
          box.style.backgroundColor = "#ffebee";
          box.style.borderColor = "#ffcdd2";
          box.children[0].innerText = "🔴 قيمة العجز:";
          box.children[0].style.color = "#c62828";
          box.children[1].style.color = "#c62828";
          if (redistBtn) redistBtn.style.display = "none";
        } else {
          box.classList.remove("deficit-mode");
          box.style.backgroundColor = "#fff8e1"; // Amber background
          box.style.borderColor = "#ffe082";     // Amber border
          box.children[0].innerText = "🟡 يوجد جزء متبقٍ من الأرض يعادل:";
          box.children[0].style.color = "#e65100"; // Amber text
          box.children[1].style.color = "#e65100";
          if (redistBtn) redistBtn.style.display = "inline-flex";
        }
      }
    }
  }

  syncExclusionUI();
  if (document.getElementById("info-partners-count")) {
    document.getElementById("info-partners-count").innerText = window.calcState.activePartnersCount;
  }
  updateTableRowsUI();
  updateRemainderRowUI(remainingArea);
  updateTableTotals();
  saveData();
  if (shouldRender) {
    console.log("Trace: runPartition completed, drawing croquis...", {calculatedPieces: window.calculatedPieces});
    renderCroquis();
  }
  updateCalculationSteps();

  // بند أولاً وثامناً: حفظ آخر حالة هندسية صحيحة بالكامل
  if (window.calcState && !window.calcState.hasDeficit) {
    const piecesBackup = JSON.parse(JSON.stringify(window.calculatedPieces || []));
    const rows = document.querySelectorAll("#partners-list .partner-row");
    const rowValues = Array.from(rows).map(row => {
      return {
        widthBottom: row.querySelector(".partner-width-bottom")?.value || "",
        widthTop: row.querySelector(".partner-width-top")?.value || "",
        widthAvg: row.querySelector(".partner-width-avg")?.value || "",
        lengthAvg: row.querySelector(".partner-length-avg")?.value || "",
        cumWidth: row.querySelector(".partner-cum-width")?.value || "",
        divLine: row.querySelector(".partner-div-line")?.value || "",
        area: row.querySelector(".partner-area")?.value || "",
        percent: row.querySelector(".partner-percent")?.value || "",
        equiv: row.querySelector(".partner-equiv")?.value || "",
      };
    });
    
    let remainderRowValues = null;
    const remRow = document.getElementById("remainder-row-table");
    if (remRow) {
      const inputs = remRow.querySelectorAll("input, textarea");
      remainderRowValues = Array.from(inputs).map(inp => inp.value);
    }
    
    window.lastValidGeometry = {
      pieces: piecesBackup,
      rowValues: rowValues,
      remainderRowValues: remainderRowValues,
      totalAreaM2: totalAreaM2,
      totalBotWidthCalculated: totalBotWidthCalculated,
      totalTopWidthCalculated: totalTopWidthCalculated,
      summaryTotalWidth: document.getElementById("summary-total-width")?.innerText || "",
      infoLastDivLine: document.getElementById("info-last-div-line")?.innerText || "",
      infoDistributedArea: document.getElementById("info-distributed-area")?.innerText || "",
      infoDistributedPercent: document.getElementById("info-distributed-percent")?.innerText || "",
      totals: {
        bottom: document.getElementById("total-width-bottom-calculated")?.value || "",
        top: document.getElementById("total-width-top-calculated")?.value || "",
        area: document.getElementById("total-area-distributed")?.value || "",
        percent: document.getElementById("total-percent-distributed")?.value || ""
      },
      calculationStepsHTML: document.getElementById("calculation-steps-container")?.innerHTML || "",
      timestamp: Date.now()
    };
  }
}

function clearAll(confirmRequired = false) {
  if (confirmRequired) {
    if (!confirm("سيتم حذف جميع البيانات وإعادة الصفحة إلى البداية. هل تريد المتابعة؟")) {
      return;
    }
  }
  document.getElementById("length1").value = "";
  document.getElementById("length2").value = "";
  document.getElementById("width1").value = "";
  document.getElementById("width2").value = "";
  
  isPartitioned = false;
  isManualPartition = false;
  window.calculatedPieces = [];
  window.lastCroquisSignature = "";
  
  const list = document.getElementById("partners-list");
  if (list) list.innerHTML = "";
  
  // إعادة خطوة التعديل إلى القيمة الافتراضية عند مسح بيانات الأرض
  resetStepValue();

  renderHeaderAndFooter();
  saveData();
  calculateGeneral(true);
}

function clearPartners(confirmRequired = false) {
  if (confirmRequired) {
    if (!confirm("سيتم حذف جميع الشركاء فقط، ولن يتم حذف أبعاد الأرض. هل تريد المتابعة؟")) {
      return;
    }
  }
  
  isPartitioned = false;
  isManualPartition = false;
  window.calculatedPieces = [];
  window.lastCroquisSignature = "";
  
  const list = document.getElementById("partners-list");
  if (list) list.innerHTML = "";
  
  renderHeaderAndFooter();
  saveData();
  calculateGeneral(true);

  // Focus the "أضف شريك" button
  const btnAdd = document.getElementById("btn-add-partner");
  if (btnAdd) {
    btnAdd.focus();
  }
}

function onCalculateBtnClick() {
  ensureDimensionsAutofill();
  const l1 = parseFloat(document.getElementById("length1").value) || 0;
  const l2 = parseFloat(document.getElementById("length2").value) || 0;
  const w1 = parseFloat(document.getElementById("width1").value) || 0;
  const w2 = parseFloat(document.getElementById("width2").value) || 0;
  
  if (l1 <= 0 || l2 <= 0 || w1 <= 0 || w2 <= 0) {
    alert("الرجاء إدخال أبعاد الأرض الإجمالية أولاً.");
    return;
  }
  
  const rows = document.querySelectorAll("#partners-list .partner-row");
  if (rows.length === 0) {
    alert("الرجاء إضافة شريك واحد على الأقل.");
    return;
  }
  
  isManualPartition = false;
  runPartition();
}

/**
 * IMPORTANT ARCHITECTURAL RULE:
 * exactArea (m²) is the ONLY authoritative value (Single Source of Truth).
 * All Feddan/Qirat/Sahm (FCS) conversions are display-only.
 * Never perform internal calculations using displayed FCS values,
 * otherwise cumulative rounding errors will occur.
 */
function divideEqually() {
  ensureDimensionsAutofill();
  const l1 = parseFloat(document.getElementById("length1").value) || 0;
  const l2 = parseFloat(document.getElementById("length2").value) || 0;
  const w1 = parseFloat(document.getElementById("width1").value) || 0;
  const w2 = parseFloat(document.getElementById("width2").value) || 0;
  
  if (l1 <= 0 || l2 <= 0 || w1 <= 0 || w2 <= 0) {
    alert("الرجاء إدخال أبعاد الأرض الإجمالية أولاً.");
    return;
  }
  
  const rows = document.querySelectorAll("#partners-list .partner-row");
  const numPartners = rows.length;
  if (numPartners === 0) {
    alert("الرجاء إضافة شريك واحد على الأقل أولاً ليتم التقسيم بينهم بالتساوي.");
    return;
  }
  
  const totalAreaM2 = AgriUnitsCompat.trapezoidArea(l1, l2, w1, w2);
  
  let caratArea = parseFloat(document.getElementById("input-carat-area").value);
  if (caratArea === 0) {
    caratArea = parseFloat(document.getElementById("other-carat-area").value) || 0;
  }
  
  if (caratArea <= 0) {
    alert("الرجاء تحديد مساحة القيراط بالمتر المربع.");
    return;
  }
  
  const exactAreaPerPartner = totalAreaM2 / numPartners;

  if (currentInputMethod === "carats") {
    const totalCarats = totalAreaM2 / caratArea;
    const partnerCarats = totalCarats / numPartners;
    
    // حساب قيم الشريك مع تقريب الأسهم لرقمتين عشريتين للعرض الفعلي في الواجهة
    const f = Math.floor(partnerCarats / 24);
    const c = Math.floor(partnerCarats % 24);
    const s = Number(((partnerCarats - (f * 24 + c)) * 24).toFixed(2));

    rows.forEach((row, index) => {
      row.dataset.exactArea = exactAreaPerPartner;
      if (row.querySelector(".partner-feddans")) row.querySelector(".partner-feddans").value = f > 0 ? f : "";
      if (row.querySelector(".partner-carats")) row.querySelector(".partner-carats").value = c > 0 ? c : "";
      if (row.querySelector(".partner-shares")) row.querySelector(".partner-shares").value = s > 0 ? s : "";
    });
  } else {
    rows.forEach((row, index) => {
      row.dataset.exactArea = exactAreaPerPartner;
      if (row.querySelector(".partner-fraction")) {
        row.querySelector(".partner-fraction").value = `1/${numPartners}`;
      }
    });
  }
  
  isManualPartition = false;
  saveAndCalcImmediate();
}

// ===================================================
// رسم الكروكي التفاعلي - نسخة محسّنة
// ===================================================

// لوحة ألوان للقطع المختلفة
// لوحة ألوان للقطع المختلفة (ألوان باستيلية مشبعة ومتباينة للقراءة تحت أشعة الشمس)
const PIECE_COLORS = [
  { fill: "#DCEFD9", stroke: "#2E7D32", text: "#111111" }, // شريك 1: أخضر فاتح / أخضر غامق
  { fill: "#D7E9FF", stroke: "#1565C0", text: "#111111" }, // شريك 2: أزرق فاتح / أزرق غامق
  { fill: "#FFF0C9", stroke: "#EF6C00", text: "#111111" }, // شريك 3: أصفر فاتح / برتقالي غامق
  { fill: "#F8DDE8", stroke: "#C2185B", text: "#111111" }, // شريك 4: وردي فاتح / وردي داكن
  { fill: "#E9DDF8", stroke: "#6A1B9A", text: "#111111" }, // شريك 5: بنفسجي فاتح / بنفسجي غامق
  { fill: "#D8F3EF", stroke: "#00796B", text: "#111111" }, // شريك 6: تركواز فاتح / تركواز غامق
  { fill: "#FBE9E7", stroke: "#D84315", text: "#111111" }, // شريك 7: برتقالي خفيف / بني غامق
  { fill: "#F1F8E9", stroke: "#558B2F", text: "#111111" }  // شريك 8: ليموني خفيف / زيتي غامق
];

function svgEl(tag) {
  return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

function svgText(x, y, content, opts = {}) {
  const t = svgEl("text");
  // تقريب الإحداثيات لمنع اهتزاز أو ضبابية النصوص على بعض الشاشات
  const rx = Math.round(parseFloat(x) * 100) / 100;
  const ry = Math.round(parseFloat(y) * 100) / 100;
  t.setAttribute("x", rx);
  t.setAttribute("y", ry);
  t.setAttribute("text-anchor", opts.anchor || "middle");
  
  // تحديد خطوط عربية واضحة وبدائلها (بدون علامات تنصيص مزدوجة داخل SVG attribute)
  t.setAttribute("font-family", "Tajawal, Cairo, 'Noto Sans Arabic', Arial, sans-serif");
  
  // تحسين جودة وحدة الخط للتكبير والطباعة
  t.setAttribute("text-rendering", "geometricPrecision");
  
  const textScale = window.isExporting ? 2.2 : 1;
  const baseSize = parseFloat(opts.size || "13");
  t.setAttribute("font-size", (baseSize * textScale));
  t.setAttribute("font-weight", opts.weight || "bold");
  t.setAttribute("fill", opts.fill || "#222");
  if (opts.transform) t.setAttribute("transform", opts.transform);
  if (opts.opacity) t.setAttribute("opacity", opts.opacity);

  t.textContent = content;
  
  // إضافة خلفية بيضاء للنص إذا طُلب
  if (opts.bg) {
    t.setAttribute("stroke", "white");
    t.setAttribute("stroke-width", (3 * textScale));
    t.setAttribute("paint-order", "stroke");
  }
  return t;
}

function svgLine(x1, y1, x2, y2, opts = {}) {
  const l = svgEl("line");
  // تقريب الإحداثيات لتفادي تشوش الحواف
  const rx1 = parseFloat(x1).toFixed(2);
  const ry1 = parseFloat(y1).toFixed(2);
  const rx2 = parseFloat(x2).toFixed(2);
  const ry2 = parseFloat(y2).toFixed(2);
  l.setAttribute("x1", rx1);
  l.setAttribute("y1", ry1);
  l.setAttribute("x2", rx2);
  l.setAttribute("y2", ry2);
  l.setAttribute("stroke", opts.stroke || "#666");
  
  // دقة رسم الأشكال والخطوط
  l.setAttribute("shape-rendering", "geometricPrecision");
  
  const textScale = window.isExporting ? 2.2 : 1;
  const baseWidth = parseFloat(opts.width || "1");
  l.setAttribute("stroke-width", (baseWidth * textScale));
  
  if (opts.dash) {
    const dashes = opts.dash.split(",").map(d => parseFloat(d) * textScale).join(",");
    l.setAttribute("stroke-dasharray", dashes);
  }
  if (opts.opacity) l.setAttribute("opacity", opts.opacity);
  return l;
}

function renderCroquis() {
  console.log("Trace: renderCroquis start");
  try {
    // State Signature / Dirty Flag Optimization
    if (window.DALLAL_PERF && window.DALLAL_PERF.dirtyFlag) {
      const l1 = document.getElementById("length1")?.value || "";
      const l2 = document.getElementById("length2")?.value || "";
      const w1 = document.getElementById("width1")?.value || "";
      const w2 = document.getElementById("width2")?.value || "";
      const viewType = document.getElementById("long-plot-view")?.value || "";
      const scaleEl = document.getElementById("scaleRange");
      const zoomVal = scaleEl ? scaleEl.value : "";
      
      // Hash of partner rows
      const rows = document.querySelectorAll("#partners-list .partner-row");
      let partnersHash = "";
      rows.forEach(row => {
        const name = row.querySelector(".partner-name")?.value || "";
        const feddans = row.querySelector(".partner-feddans")?.value || "";
        const carats = row.querySelector(".partner-carats")?.value || "";
        const shares = row.querySelector(".partner-shares")?.value || "";
        const fraction = row.querySelector(".partner-fraction")?.value || "";
        const botW = row.querySelector(".partner-width-bottom")?.value || "";
        const topW = row.querySelector(".partner-width-top")?.value || "";
        partnersHash += `|${name}_${feddans}_${carats}_${shares}_${fraction}_${botW}_${topW}`;
      });

      const currentSignature = `${l1}_${l2}_${w1}_${w2}_${viewType}_${zoomVal}_${isPartitioned}_${isManualPartition}_${partnersHash}`;
      if (currentSignature === window.lastCroquisSignature) {
        console.log("[Performance Optimization] renderCroquis skipped (Dirty flag matching)");
        return;
      }
      window.lastCroquisSignature = currentSignature;
    }

    const g = document.getElementById("croquis-content");
  if (!g) return;
  g.innerHTML = "";

  const l1 = parseFloat(document.getElementById("length1").value) || 0;
  const l2 = parseFloat(document.getElementById("length2").value) || 0;
  const w1 = parseFloat(document.getElementById("width1").value) || 0;
  const w2 = parseFloat(document.getElementById("width2").value) || 0;

  // إظهار/إخفاء placeholder
  const placeholder = document.getElementById("croquis-placeholder");
  if (l1 <= 0 || l2 <= 0 || w1 <= 0 || w2 <= 0) {
    if (placeholder) {
      placeholder.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a5d6a7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>
        <p>أدخل أبعاد الأرض الإجمالية</p>
        <p>لرؤية الكروكي التفاعلي</p>
      `;
      placeholder.style.display = "flex";
    }
    return;
  }

  if (!isPartitioned) {
    if (placeholder) {
      placeholder.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef6c00" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 12px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <p style="font-weight: bold; color: #e65100; font-size: 15px; margin: 0 0 10px 0; font-family: Cairo, sans-serif; text-align: center;">لا توجد بيانات تقسيم لعرضها.</p>
        <div style="text-align: right; display: inline-block; font-size: 13px; color: #555; line-height: 1.8; font-family: Cairo, sans-serif; direction: rtl;">
          <div style="margin-bottom: 4px;"><strong>1.</strong> أضف الشركاء.</div>
          <div style="margin-bottom: 4px;"><strong>2.</strong> أدخل أنصبة كل شريك.</div>
          <div><strong>3.</strong> اضغط <strong style="color: #2e7d32; background-color: #e8f5e9; padding: 2px 8px; border-radius: 4px; border: 1px solid #c8e6c9; white-space: nowrap; font-weight: bold;">«تحديث الخريطة»</strong> لإنشاء الكروكي وعرض التقسيم.</div>
        </div>
      `;
      placeholder.style.display = "flex";
    }
    return;
  }
  if (placeholder) placeholder.style.display = "none";

  const w = (w1 + w2) / 2;
  const maxLen = Math.max(l1, l2);

  // حساب معامل التمدد البصري للأراضي الطويلة جداً أو العريضة جداً
  let stretchX = 1.0;
  let stretchY = 1.0;

  const longPlotViewEl = document.getElementById("long-plot-view");
  const viewType = (longPlotViewEl ? longPlotViewEl.value : null) || "agricultural";
  if (viewType === "agricultural" && w > 0 && maxLen > 0) {
    const ratio = w / maxLen;
    const invRatio = maxLen / w;
    // إذا كانت الأرض طويلة ونحيفة جداً رأسياً (الارتفاع أكبر من العرض بـ 3.5 أضعاف)
    if (invRatio > 3.5) {
      stretchX = invRatio / 3.5; // نمدد العرض أفقياً لتملأ الشاشة بمعدل 3.5:1 كحد أقصى
    }
    // إذا كانت الأرض عريضة ونحيفة جداً أفقياً (العرض أكبر من الارتفاع بـ 3.5 أضعاف)
    else if (ratio > 3.5) {
      stretchY = ratio / 3.5; // نمدد الطول رأسياً لتملأ الشاشة بمعدل 3.5:1 كحد أقصى
    }
  }

  const w_virtual = w * stretchX;
  const maxLen_virtual = maxLen * stretchY;

  // تغيير ارتفاع الحاوية ديناميكياً بناءً على نسبة أبعاد الكروكي (مثل صفحة 13)
  const wrapper = document.getElementById("croquis-wrapper");
  if (wrapper && !window.isExporting) {
    const parentWidth = wrapper.parentElement.clientWidth || 700;
    const targetWidth = parentWidth - 24; // مسافة الهوامش
    
    // نسبة الأبعاد (shapeRatio)
    const shapeRatio = w_virtual / (maxLen_virtual || 1);
    let targetRatio = Math.max(0.45, Math.min(2.2, shapeRatio));
    
    let targetHeight = targetWidth / targetRatio;
    const maxHeight = 650;
    if (targetHeight > maxHeight) {
      targetHeight = maxHeight;
    }
    targetHeight = Math.max(280, targetHeight);
    
    // تطبيق الارتفاع على الـ wrapper
    wrapper.style.setProperty("height", targetHeight + "px", "important");
  }

  const container = document.getElementById("croquis-container");
  
  let containerW = 1600;
  let containerH = 1000;

  const textScale = window.isExporting ? 2.2 : 1;
  const paddingH = window.isExporting ? 75 * textScale : 65;  // هامش أفقي لتفادي قص النصوص
  const paddingV = window.isExporting ? 65 * textScale : 60;  // هامش رأسي لتفادي قص النصوص

  if (!window.isExporting) {
    containerW = container ? container.clientWidth || 700 : 700;
    containerH = container ? container.clientHeight || 500 : 500;
  } else {
    // حساب الأبعاد بناءً على نسبة شكل الأرض لإزالة الفراغات البيضاء
    const shapeRatio = maxLen_virtual / (w_virtual || 1);
    if (shapeRatio >= 1) {
      containerH = 1600;
      containerW = 1600 / shapeRatio;
    } else {
      containerW = 1600;
      containerH = 1600 * shapeRatio;
    }
    // إضافة حواف إضافية لتكوين هامش أبيض كبير ومريح للطباعة
    containerW += paddingH * 2 + 250;
    containerH += paddingV * 2 + 250;
    
    window.exportWidth = containerW;
    window.exportHeight = containerH;
  }

  const scaleX = (containerW - paddingH * 2) / w_virtual;
  const scaleY = (containerH - paddingV * 2) / maxLen_virtual;
  const drawScale = Math.min(scaleX, scaleY);

  const drawnW = w_virtual * drawScale;
  const drawnH = maxLen_virtual * drawScale;
  const offsetX = (containerW - drawnW) / 2;
  const offsetY = (containerH - drawnH) / 2;

  // دوال التحويل مع تطبيق معامل التمدد البصري
  const mapX = (x) => offsetX + (x * stretchX) * drawScale;
  const mapY = (y) => offsetY + (y * stretchY) * drawScale;

  const totalAreaM2 = ((l1 + l2) / 2) * w;

  // k = معدل التغير في الطول بالنسبة للعرض
  const k = (l1 - l2) / w;

  // === 1. الظل تحت الأرض ===
  const shadowPoly = svgEl("polygon");
  const sOff = 4 * textScale;
  shadowPoly.setAttribute("points",
    `${mapX(0)+sOff},${mapY(0)+sOff} ${mapX(w)+sOff},${mapY(0)+sOff} ${mapX(w)+sOff},${mapY(l1)+sOff} ${mapX(0)+sOff},${mapY(l2)+sOff}`
  );
  shadowPoly.setAttribute("fill", "#f0f0f0");
  shadowPoly.setAttribute("rx", "4");
  shadowPoly.setAttribute("shape-rendering", "geometricPrecision");
  g.appendChild(shadowPoly);

  // === 2. الإطار الخارجي الكامل ===
  // أسفل-يسار → أسفل-يمين → أعلى-يمين (l1=الطول الأيمن) → أعلى-يسار (l2=الطول الأيسر)
  const mainPoly = svgEl("polygon");
  mainPoly.setAttribute("points",
    `${mapX(0)},${mapY(0)} ${mapX(w)},${mapY(0)} ${mapX(w)},${mapY(l1)} ${mapX(0)},${mapY(l2)}`
  );
  mainPoly.setAttribute("fill", "#FDFBF2");
  mainPoly.setAttribute("stroke", "#1b5e20");
  mainPoly.setAttribute("stroke-width", (2.5 * textScale));
  mainPoly.setAttribute("stroke-linejoin", "round");
  mainPoly.setAttribute("shape-rendering", "geometricPrecision");
  g.appendChild(mainPoly);


  // === 3. رسم القطع ===
  if (window.calculatedPieces && window.calculatedPieces.length > 0) {
    window.calculatedPieces.forEach((piece, index) => {
      const isRem = piece.isRemainder;
      const color = isRem 
        ? { fill: "#fff8e1", stroke: "#ff8f00" }
        : PIECE_COLORS[index % PIECE_COLORS.length];

      // Mirror coordinates to draw from Right to Left visually
      const x1 = mapX(w - piece.startX); // right boundary of piece visually
      const x2 = mapX(w - piece.endX);   // left boundary of piece visually
      const y1 = mapY(0);
      const y2 = mapY(0);
      // height at left boundary (x2): h(w - endX) = l2 + k * (w - endX)
      const y3 = mapY(l2 + k * (w - piece.endX));
      // height at right boundary (x1): h(w - startX) = l2 + k * (w - startX)
      const y4 = mapY(l2 + k * (w - piece.startX));

      const pieceWidth = Math.abs(x2 - x1);

      // تعبئة القطعة
      const poly = svgEl("polygon");
      poly.setAttribute("points", `${x1},${y1} ${x2},${y2} ${x2},${y3} ${x1},${y4}`);
      poly.setAttribute("fill", color.fill);
      poly.setAttribute("stroke", "none"); // بدون حدود مدمجة بالمضلع لتمكين تحكم كامل بالسمك واللون
      poly.setAttribute("class", "polygon-segment");
      poly.setAttribute("id", `croquis-poly-${index}`);
      poly.setAttribute("shape-rendering", "geometricPrecision");
      poly.style.pointerEvents = "auto";
      poly.style.cursor = "pointer";
      
      // ربط أحداث التفاعل ثنائي الاتجاه
      poly.addEventListener("mouseenter", () => highlightSegment(index));
      poly.addEventListener("mouseleave", () => removeHighlight());
      poly.addEventListener("click", (e) => selectSegment(index, e));
      
      g.appendChild(poly);

      // رسم حدود القطعة يدوياً للحصول على سمك مختلف بين الحدود الخارجية والداخلية
      const dash = isRem ? (window.isExporting ? "13,6" : "6,3") : null;

      // 1. الحد العلوي (سميك)
      const topBorder = svgEl("line");
      topBorder.setAttribute("x1", x1);
      topBorder.setAttribute("y1", y1);
      topBorder.setAttribute("x2", x2);
      topBorder.setAttribute("y2", y2);
      topBorder.setAttribute("stroke", color.stroke);
      topBorder.setAttribute("stroke-width", (3.5 * textScale));
      topBorder.setAttribute("stroke-linejoin", "round");
      topBorder.setAttribute("style", "pointer-events: none;");
      if (dash) topBorder.setAttribute("stroke-dasharray", dash);
      g.appendChild(topBorder);

      // 2. الحد السفلي (سميك)
      const botBorder = svgEl("line");
      botBorder.setAttribute("x1", x1);
      botBorder.setAttribute("y1", y4);
      botBorder.setAttribute("x2", x2);
      botBorder.setAttribute("y2", y3);
      botBorder.setAttribute("stroke", color.stroke);
      botBorder.setAttribute("stroke-width", (3.5 * textScale));
      botBorder.setAttribute("stroke-linejoin", "round");
      botBorder.setAttribute("style", "pointer-events: none;");
      if (dash) botBorder.setAttribute("stroke-dasharray", dash);
      g.appendChild(botBorder);

      // 3. الحد الأيمن الخارجي (لأول شريك فقط، سميك)
      if (index === 0) {
        const rightBorder = svgEl("line");
        rightBorder.setAttribute("x1", x1);
        rightBorder.setAttribute("y1", y1);
        rightBorder.setAttribute("x2", x1);
        rightBorder.setAttribute("y2", y4);
        rightBorder.setAttribute("stroke", color.stroke);
        rightBorder.setAttribute("stroke-width", (3.5 * textScale));
        rightBorder.setAttribute("stroke-linejoin", "round");
        rightBorder.setAttribute("style", "pointer-events: none;");
        if (dash) rightBorder.setAttribute("stroke-dasharray", dash);
        g.appendChild(rightBorder);
      }

      // 4. الحد الأيسر الخارجي (لآخر شريك فقط، سميك)
      if (index === window.calculatedPieces.length - 1) {
        const leftBorder = svgEl("line");
        leftBorder.setAttribute("x1", x2);
        leftBorder.setAttribute("y1", y2);
        leftBorder.setAttribute("x2", x2);
        leftBorder.setAttribute("y2", y3);
        leftBorder.setAttribute("stroke", color.stroke);
        leftBorder.setAttribute("stroke-width", (3.5 * textScale));
        leftBorder.setAttribute("stroke-linejoin", "round");
        leftBorder.setAttribute("style", "pointer-events: none;");
        if (dash) leftBorder.setAttribute("stroke-dasharray", dash);
        g.appendChild(leftBorder);
      }

      // 5. الفواصل الداخلية (تكون أقل سماكة)
      if (index > 0) {
        const dividerLine = svgEl("line");
        dividerLine.setAttribute("x1", x1);
        dividerLine.setAttribute("y1", y1);
        dividerLine.setAttribute("x2", x1);
        dividerLine.setAttribute("y2", y4);
        dividerLine.setAttribute("stroke", color.stroke); // لون الشريك الحالي
        dividerLine.setAttribute("stroke-width", (2.5 * textScale));
        dividerLine.setAttribute("stroke-linejoin", "round");
        dividerLine.setAttribute("style", "pointer-events: none;");
        if (dash) dividerLine.setAttribute("stroke-dasharray", dash);
        g.appendChild(dividerLine);
      }

      // مركز القطعة
      const cx = (x1 + x2) / 2;
      const topY = (y1 + y2) / 2;
      const botY = (y3 + y4) / 2;
      const cy = (topY + botY) / 2;

      // 1. رسم النصوص داخل القطعة (الاسم، المساحة، والارتفاع كلها رأسية بالتوالي لتطابق المرفق)
      if (showCroquisNames || showCroquisMeasurements) {
        const labelGroup = svgEl("g");
        labelGroup.setAttribute("style", "pointer-events: none;"); // حتى لا تعيق التفاعل مع المضلع
        
        const nameToShow = piece.name || `شريك ${index + 1}`;
        const pieceH = botY - topY;
        const pieceMidLength = l2 + k * (w - (piece.startX + piece.endX) / 2);
        
        if (pieceWidth < 12 && !window.isExporting) {
          // إذا كانت الأرض ضيقة جداً، نعرض رقم القطعة فقط لتفادي التداخل
          const tIdx = svgText(cx, cy + 4 * textScale, (index + 1).toString(), {
            fill: isRem ? "#e65100" : "#000000",
            size: "12.5",
            weight: "bold"
          });
          labelGroup.appendChild(tIdx);
        } else {
          // توزيع النصوص رأسياً وتدويرها 90 درجة عكس عقارب الساعة
          const yLeftLen   = topY + pieceH * 0.16;
          const yArea      = topY + pieceH * 0.36;
          const yName      = topY + pieceH * 0.56;
          const yRightLen  = topY + pieceH * 0.76;
          const yDirection = topY + pieceH * 0.86;
          
          // إزاحة أفقية لوضع النص بجانب الفاصل المقابل له (الحد الأيسر X2 والحد الأيمن X1)
          const padX = Math.min(16 * textScale, pieceWidth * 0.22);
          const xLeft = x2 + padX;
          const xRight = x1 - padX;
          
          // حجم خط ديناميكي يناسب عرض العمود
          const fontSize = Math.min(13.5, Math.max(7.5, pieceWidth * 0.30)) * textScale;
          
          // 1. عرض طول الحد الأيسر رأسي (دوران -90 درجة) بجانب الفاصل الأيسر
          if (showCroquisMeasurements) {
            const lenGroup = svgEl("g");
            lenGroup.setAttribute("transform", `rotate(-90, ${xLeft}, ${yLeftLen})`);
            
            const tLenVal = svgText(xLeft, yLeftLen + 4 * textScale, piece.divLine.toFixed(2) + " م", {
              fill: "#000000",
              size: (fontSize / textScale).toString(),
              weight: "bold"
            });
            lenGroup.appendChild(tLenVal);
            labelGroup.appendChild(lenGroup);
          }
          
          // 2. عرض المساحة رأسي (دوران -90 درجة) تحت طول الحد الأيسر في المنتصف
          if (showCroquisMeasurements) {
            const areaVal = Number(piece.area.toFixed(2));
            const areaGroup = svgEl("g");
            areaGroup.setAttribute("transform", `rotate(-90, ${cx}, ${yArea})`);
            
            const tAreaVal = svgText(cx, yArea + 4 * textScale, areaVal + " م²", {
              fill: "#000000",
              size: (fontSize / textScale).toString(),
              weight: "bold"
            });
            areaGroup.appendChild(tAreaVal);
            labelGroup.appendChild(areaGroup);
          }
          
          // 3. عرض الاسم رأسي (دوران -90 درجة) في المنتصف
          if (showCroquisNames) {
            const nameGroup = svgEl("g");
            nameGroup.setAttribute("transform", `rotate(-90, ${cx}, ${yName})`);
            
            const tName = svgText(cx, yName + 4 * textScale, nameToShow, {
              fill: isRem ? "#e65100" : "#000000",
              size: ((fontSize + 0.5) / textScale).toString(),
              weight: "bold"
            });
            nameGroup.appendChild(tName);
            labelGroup.appendChild(nameGroup);
          }
          
          // 4. عرض طول الحد الأيمن رأسي (دوران -90 درجة) بجانب الفاصل الأيمن
          if (showCroquisMeasurements) {
            const lenGroup = svgEl("g");
            lenGroup.setAttribute("transform", `rotate(-90, ${xRight}, ${yRightLen})`);
            
            const tLenVal = svgText(xRight, yRightLen + 4 * textScale, piece.leftLine.toFixed(2) + " م", {
              fill: "#000000",
              size: (fontSize / textScale).toString(),
              weight: "bold"
            });
            lenGroup.appendChild(tLenVal);
            labelGroup.appendChild(lenGroup);
          }

          // 5. مؤشر بداية/نهاية التقسيم داخل القطعة (دوران -90 درجة) مع خلفية ملونة
          const isLTR = window.PartitionDirectionManager.isLTR();
          const activePieces = window.calculatedPieces.filter(p => !p.isRemainder);
          const isStart = isLTR 
            ? (piece === activePieces[activePieces.length - 1])
            : (piece === activePieces[0]);
          const isEnd = isLTR
            ? (piece === activePieces[0])
            : (piece === activePieces[activePieces.length - 1]);
          let badgeEmoji = "";
          let badgeLabel = "";
          let badgeFill = "";
          let badgeBorder = "";
          let badgeBg = "";
          if (isStart) {
            badgeEmoji = "🏁";
            badgeLabel = "البداية";
            badgeFill = "#1b5e20";
            badgeBorder = "#2e7d32";
            badgeBg = "#e8f5e9";
          } else if (isEnd) {
            badgeEmoji = "🚩";
            badgeLabel = "النهاية";
            badgeFill = "#b71c1c";
            badgeBorder = "#c62828";
            badgeBg = "#ffebee";
          }

          if (badgeLabel) {
            // حساب الأبعاد للمقارنة والتحقق من التداخل
            const badgeFontSize = Math.max(6.5, fontSize - 3.5);
            const emojiFontSize = badgeFontSize + 5;
            const badgePadX = 2.5 * textScale;
            const badgePadY = 2.5 * textScale;
            
            const emojiHeight = emojiFontSize * textScale;
            const labelHeight = badgeFontSize * textScale;
            
            const badgeW = 52 * textScale;
            const badgeH = emojiHeight + labelHeight + badgePadY * 2;

            // تحديد ما إذا كان هناك مساحة داخلية كافية خالية من التصادم
            let drawInside = false;
            let finalYDirection = yDirection;

            if (pieceH > 260 && pieceWidth > 45) {
              // التحقق من المسافة السفلية لمنع تداخل الأبعاد
              const maxAllowedY = botY - badgeW / 2 - 14 * textScale;
              const minAllowedY = yRightLen + badgeW / 2 + 12 * textScale;
              if (maxAllowedY > minAllowedY) {
                drawInside = true;
                // ضبط الموضع لتجنب تداخل الأبعاد السفلية تماماً
                finalYDirection = Math.min(yDirection, maxAllowedY);
              }
            }

            if (drawInside) {
              // 1. رسم الشارة داخل القطعة (تدوير -90 درجة)
              const dirGroup = svgEl("g");
              dirGroup.setAttribute("transform", `rotate(-90, ${cx}, ${finalYDirection})`);

              const rect = svgEl("rect");
              rect.setAttribute("x", cx - badgeW / 2);
              rect.setAttribute("y", finalYDirection - badgeH / 2);
              rect.setAttribute("width", badgeW);
              rect.setAttribute("height", badgeH);
              rect.setAttribute("rx", 4 * textScale);
              rect.setAttribute("ry", 4 * textScale);
              rect.setAttribute("fill", badgeBg);
              rect.setAttribute("stroke", badgeBorder);
              rect.setAttribute("stroke-width", (1 * textScale));
              dirGroup.appendChild(rect);

              const tEmoji = svgText(cx, finalYDirection - badgeH / 2 + emojiHeight + badgePadY / 2, badgeEmoji, {
                fill: badgeFill,
                size: (emojiFontSize / textScale).toString(),
                weight: "bold"
              });
              dirGroup.appendChild(tEmoji);

              const tLabel = svgText(cx, finalYDirection - badgeH / 2 + emojiHeight + badgePadY + labelHeight - 1 * textScale, badgeLabel, {
                fill: badgeFill,
                size: (badgeFontSize / textScale).toString(),
                weight: "bold"
              });
              dirGroup.appendChild(tLabel);

              labelGroup.appendChild(dirGroup);
            } else {
              // 2. تموضع ذكي خارج حدود الأرض لتفادي التداخل نهائياً (رسم أفقي مع خط إشارة)
              const anchorX = isStart ? x1 : x2;
              const anchorY = isStart ? y1 : y2;
              
              // إزاحة الشارة للأعلى والخارج (10-15 بكسل هامش أمان إضافي)
              const offsetX = isStart ? 26 * textScale : -26 * textScale;
              const offsetY = -30 * textScale;
              
              const badgeCX = anchorX + offsetX;
              const badgeCY = anchorY + offsetY;

              // خط إشارة مقطع
              const leader = svgLine(anchorX, anchorY, badgeCX, badgeCY + badgeH / 2, {
                stroke: badgeBorder,
                width: 1.2 * textScale,
                dash: "2,2"
              });
              labelGroup.appendChild(leader);

              // نقطة تثبيت على الزاوية
              const dot = svgEl("circle");
              dot.setAttribute("cx", anchorX);
              dot.setAttribute("cy", anchorY);
              dot.setAttribute("r", 3.5 * textScale);
              dot.setAttribute("fill", badgeBorder);
              labelGroup.appendChild(dot);

              // الشارة الأفقية
              const dirGroup = svgEl("g");
              
              const rect = svgEl("rect");
              rect.setAttribute("x", badgeCX - badgeW / 2);
              rect.setAttribute("y", badgeCY - badgeH / 2);
              rect.setAttribute("width", badgeW);
              rect.setAttribute("height", badgeH);
              rect.setAttribute("rx", 4 * textScale);
              rect.setAttribute("ry", 4 * textScale);
              rect.setAttribute("fill", badgeBg);
              rect.setAttribute("stroke", badgeBorder);
              rect.setAttribute("stroke-width", (1 * textScale));
              dirGroup.appendChild(rect);

              const tEmoji = svgText(badgeCX, badgeCY - badgeH / 2 + emojiHeight + badgePadY / 2, badgeEmoji, {
                fill: badgeFill,
                size: (emojiFontSize / textScale).toString(),
                weight: "bold"
              });
              dirGroup.appendChild(tEmoji);

              const tLabel = svgText(badgeCX, badgeCY - badgeH / 2 + emojiHeight + badgePadY + labelHeight - 1 * textScale, badgeLabel, {
                fill: badgeFill,
                size: (badgeFontSize / textScale).toString(),
                weight: "bold"
              });
              dirGroup.appendChild(tLabel);

              labelGroup.appendChild(dirGroup);
            }
          }
        }
        g.appendChild(labelGroup);
      }

      // 2. عرض عروض القطع باللون الأسود مباشرة على الحدود العليا والسفلى لكل قطعة مع وحدة القياس (م)
      if (showCroquisMeasurements) {
        const dynamicWSize = Math.min(11, Math.max(7.5, pieceWidth * 0.25));

        // العرض العلوي للقطعة (أعلى الحدود العليا)
        const topWText = svgText(cx, mapY(0) - 8 * textScale, piece.topW.toFixed(2) + " م", {
          fill: "#000000", // أسود
          size: dynamicWSize.toString(),
          weight: "bold",
          bg: false,
        });
        g.appendChild(topWText);

        // العرض السفلي للقطعة (أسفل الحدود السفلى)
        const y_top_mid = (y3 + y4) / 2;
        const botWText = svgText(cx, y_top_mid + 14 * textScale, piece.botW.toFixed(2) + " م", {
          fill: "#000000", // أسود
          size: dynamicWSize.toString(),
          weight: "bold",
          bg: false,
        });
        g.appendChild(botWText);
      }

      // 3. تم إزالة الصناديق البيضاء التي كانت تظهر على خطوط الفواصل والحدود لتطابق مظهر المرفق النظيف تماماً
    });
  }

  // === 4. أبعاد الأرض الخارجية ===
  if (showCroquisMeasurements) {
    const dimOffset = 20 * textScale; // مسافة خطوط الأبعاد عن الأرض

    // --- الطول الأيسر (يسار بصرياً) - mapX(0) ---
    const lX = mapX(0);
    const lY1 = mapY(0);
    const lY2 = mapY(l2);  // l2 = الطول الأيسر هو ارتفاع الجانب الأيسر
    
    // خطوط المساعدة المقطعة
    g.appendChild(svgLine(lX, lY1, lX - dimOffset, lY1, { stroke: "#4CAF50", width: "1.2", dash: "2,3" }));
    g.appendChild(svgLine(lX, lY2, lX - dimOffset, lY2, { stroke: "#4CAF50", width: "1.2", dash: "2,3" }));
    
    // خط الأبعاد
    g.appendChild(svgLine(lX - dimOffset, lY1, lX - dimOffset, lY2, { stroke: "#1b5e20", width: "2" }));
    
    // شُرط الحصر المتعامدة
    g.appendChild(svgLine(lX - dimOffset - 4 * textScale, lY1, lX - dimOffset + 4 * textScale, lY1, { stroke: "#1b5e20", width: "2" }));
    g.appendChild(svgLine(lX - dimOffset - 4 * textScale, lY2, lX - dimOffset + 4 * textScale, lY2, { stroke: "#1b5e20", width: "2" }));
    
    const lMidY = (lY1 + lY2) / 2;
    g.appendChild(svgText(lX - dimOffset - 4 * textScale, lMidY, l2.toFixed(2) + " م", {
      anchor: "start",
      fill: "#111111", // أسود داكن للقراءة تحت الشمس
      size: "13.5",
      weight: "bold",
      bg: true,
      transform: `rotate(-90, ${lX - dimOffset - 4 * textScale}, ${lMidY})`,
    }));

    // --- الطول الأيمن (يمين بصرياً) - mapX(w) ---
    const rX = mapX(w);
    const rY1 = mapY(0);
    const rY2 = mapY(l1);  // l1 = الطول الأيمن هو ارتفاع الجانب الأيمن
    
    // خطوط المساعدة المقطعة
    g.appendChild(svgLine(rX, rY1, rX + dimOffset, rY1, { stroke: "#4CAF50", width: "1.2", dash: "2,3" }));
    g.appendChild(svgLine(rX, rY2, rX + dimOffset, rY2, { stroke: "#4CAF50", width: "1.2", dash: "2,3" }));
    
    // خط الأبعاد
    g.appendChild(svgLine(rX + dimOffset, rY1, rX + dimOffset, rY2, { stroke: "#1b5e20", width: "2" }));
    
    // شُرط الحصر المتعامدة
    g.appendChild(svgLine(rX + dimOffset - 4 * textScale, rY1, rX + dimOffset + 4 * textScale, rY1, { stroke: "#1b5e20", width: "2" }));
    g.appendChild(svgLine(rX + dimOffset - 4 * textScale, rY2, rX + dimOffset + 4 * textScale, rY2, { stroke: "#1b5e20", width: "2" }));
    
    const rMidY = (rY1 + rY2) / 2;
    g.appendChild(svgText(rX + dimOffset + 4 * textScale, rMidY, l1.toFixed(2) + " م", {
      anchor: "start",
      fill: "#111111", // أسود داكن لقراءة عالية التباين
      size: "13.5",
      weight: "bold",
      bg: true,
      transform: `rotate(-90, ${rX + dimOffset + 4 * textScale}, ${rMidY})`,
    }));

    // --- العرض الأول (أعلى) ---
    const bY = mapY(0) - dimOffset;
    const bX1 = mapX(0);
    const bX2 = mapX(w);
    
    // خطوط المساعدة المقطعة
    g.appendChild(svgLine(bX1, mapY(0), bX1, bY, { stroke: "#4CAF50", width: "1.2", dash: "2,3" }));
    g.appendChild(svgLine(bX2, mapY(0), bX2, bY, { stroke: "#4CAF50", width: "1.2", dash: "2,3" }));
    
    // خط الأبعاد
    g.appendChild(svgLine(bX1, bY, bX2, bY, { stroke: "#1b5e20", width: "2" }));
    
    // شُرط الحصر المتعامدة
    g.appendChild(svgLine(bX1, bY - 4 * textScale, bX1, bY + 4 * textScale, { stroke: "#1b5e20", width: "2" }));
    g.appendChild(svgLine(bX2, bY - 4 * textScale, bX2, bY + 4 * textScale, { stroke: "#1b5e20", width: "2" }));
    
    g.appendChild(svgText((bX1 + bX2) / 2, bY - 6 * textScale, w2.toFixed(2) + " م", {
      fill: "#111111", // أسود داكن
      size: "13.5",
      weight: "bold",
      bg: true,
    }));

    // --- العرض الثاني (أسفل) ---
    // أعلى يسار = mapY(l2)، أعلى يمين = mapY(l1)
    const topEdgeY = mapY(Math.max(l1, l2)) + dimOffset;
    const topX1 = mapX(0);
    const topX2 = mapX(w);
    
    // خطوط مساعدة من كل سقف لأعلى
    g.appendChild(svgLine(topX1, mapY(l2), topX1, topEdgeY, { stroke: "#4CAF50", width: "1.2", dash: "2,3" }));
    g.appendChild(svgLine(topX2, mapY(l1), topX2, topEdgeY, { stroke: "#4CAF50", width: "1.2", dash: "2,3" }));
    
    // خط الأبعاد
    g.appendChild(svgLine(topX1, topEdgeY, topX2, topEdgeY, { stroke: "#1b5e20", width: "2" }));
    
    // شُرط الحصر
    g.appendChild(svgLine(topX1, topEdgeY - 4 * textScale, topX1, topEdgeY + 4 * textScale, { stroke: "#1b5e20", width: "2" }));
    g.appendChild(svgLine(topX2, topEdgeY - 4 * textScale, topX2, topEdgeY + 4 * textScale, { stroke: "#1b5e20", width: "2" }));
    
    g.appendChild(svgText((topX1 + topX2) / 2, topEdgeY + 16 * textScale, w1.toFixed(2) + " م", {
      fill: "#111111", // أسود داكن
      size: "13.5",
      weight: "bold",
      bg: true,
    }));

    // 5. اتجاه التقسيم (سهم مع كتابة أعلى الرسم)
    const arrowY = mapY(0) - 78 * textScale;
    const isLTR = window.PartitionDirectionManager.isLTR();
    
    const arrowStartX = isLTR ? (mapX(0) + 40 * textScale) : (mapX(w) - 40 * textScale);
    const arrowEndX = isLTR ? (mapX(w) - 40 * textScale) : (mapX(0) + 40 * textScale);
    
    g.appendChild(svgLine(arrowStartX, arrowY, arrowEndX, arrowY, { 
      stroke: "#ef6c00", 
      width: 2.5 * textScale 
    }));
    
    // رسم رأس السهم
    const headSize = 6 * textScale;
    const arrowHead = svgEl("polygon");
    if (isLTR) {
      // pointing right
      arrowHead.setAttribute("points", 
        `${arrowEndX},${arrowY} ${arrowEndX - headSize},${arrowY - headSize/1.5} ${arrowEndX - headSize},${arrowY + headSize/1.5}`
      );
    } else {
      // pointing left
      arrowHead.setAttribute("points", 
        `${arrowEndX},${arrowY} ${arrowEndX + headSize},${arrowY - headSize/1.5} ${arrowEndX + headSize},${arrowY + headSize/1.5}`
      );
    }
    arrowHead.setAttribute("fill", "#ef6c00");
    g.appendChild(arrowHead);

    // كتابة النص فوق السهم - سطرين
    const arrowMidX = (arrowStartX + arrowEndX) / 2;
    const arrowText1 = svgText(arrowMidX, arrowY - 18 * textScale, "اتجاه التقسيم", {
      fill: "#ef6c00",
      size: "12",
      weight: "bold",
      bg: true
    });
    g.appendChild(arrowText1);
    const arrowText2 = svgText(arrowMidX, arrowY - 6 * textScale, isLTR ? "من اليسار الى اليمين" : "من اليمين الى اليسار", {
      fill: "#f57c00",
      size: "10",
      weight: "normal",
      bg: true
    });
    g.appendChild(arrowText2);

    // --- رؤوس مضلع الأرض الخارجية ---
    // أسفل-يسار، أسفل-يمين، أعلى-يمين (l1=الطول الأيمن)، أعلى-يسار (l2=الطول الأيسر)
    const corners = [
      { x: mapX(0), y: mapY(0) },
      { x: mapX(w), y: mapY(0) },
      { x: mapX(w), y: mapY(l1) },
      { x: mapX(0), y: mapY(l2) }
    ];
    corners.forEach(p => {
      const c = svgEl("circle");
      c.setAttribute("cx", p.x);
      c.setAttribute("cy", p.y);
      c.setAttribute("r", 5 * textScale);
      c.setAttribute("fill", "#1b5e20");
      g.appendChild(c);
    });

    // --- عرض أسماء الاتجاهات على جوانب الكروكي ---
    const dirs = getP11Directions();
    const dirFontSize = Math.max(10, 12 * textScale);
    const dirColor = "#1565c0";
    const dirOffset = 52 * textScale;

    // الاتجاه العلوي (أعلى الرسم - العرض الأول C)
    g.appendChild(svgText(
      (mapX(0) + mapX(w)) / 2,
      mapY(0) - dirOffset,
      dirs.top,
      { fill: dirColor, size: dirFontSize.toString(), weight: "bold", bg: true }
    ));

    // الاتجاه السفلي (أسفل الرسم - العرض الثاني A)
    const botEdgeY2 = mapY(Math.max(l1, l2)) + dirOffset + 10 * textScale;
    g.appendChild(svgText(
      (mapX(0) + mapX(w)) / 2,
      botEdgeY2,
      dirs.bottom,
      { fill: dirColor, size: dirFontSize.toString(), weight: "bold", bg: true }
    ));

    // الاتجاه الأيمن (يمين الرسم - الطول الأيمن D)
    const rDirGroup = svgEl("g");
    const rDirX = mapX(w) + dirOffset + 10 * textScale;
    const rDirY = (mapY(0) + mapY(l1)) / 2;
    rDirGroup.setAttribute("transform", `rotate(-90, ${rDirX}, ${rDirY})`);
    const tRDir = svgText(rDirX, rDirY, dirs.right, {
      fill: dirColor, size: dirFontSize.toString(), weight: "bold", bg: true
    });
    rDirGroup.appendChild(tRDir);
    g.appendChild(rDirGroup);

    // الاتجاه الأيسر (يسار الرسم - الطول الأيسر B)
    const lDirGroup = svgEl("g");
    const lDirX = mapX(0) - dirOffset - 10 * textScale;
    const lDirY = (mapY(0) + mapY(l2)) / 2;
    lDirGroup.setAttribute("transform", `rotate(-90, ${lDirX}, ${lDirY})`);
    const tLDir = svgText(lDirX, lDirY, dirs.left, {
      fill: dirColor, size: dirFontSize.toString(), weight: "bold", bg: true
    });
    lDirGroup.appendChild(tLDir);
    g.appendChild(lDirGroup);
  }

  // === ضبط viewBox على عنصر SVG لعرض كامل المحتوى على جميع الشاشات (الموبايل والكمبيوتر) ===
  // الأبعاد الإضافية تأخذ بعين الاعتبار نصوص الأبعاد الخارجية والاتجاهات التي تتجاوز حدود الشكل
  if (!window.isExporting) {
    const svgEl2 = document.getElementById("croquis-svg");
    if (svgEl2) {
      const extraLeft = 100;   // مساحة لنصوص الطول الأيسر + الاتجاه + خطوط الأبعاد
      const extraRight = 100;  // مساحة لنصوص الطول الأيمن + الاتجاه + خطوط الأبعاد
      const extraTop = 130;     // مساحة لنصوص العرض العلوي + الاتجاه + سهم الاتجاه
      const extraBottom = 95;  // مساحة لنصوص العرض السفلي + الاتجاه
      const vbX = -extraLeft;
      const vbY = -extraTop;
      const vbW = containerW + extraLeft + extraRight;
      const vbH = containerH + extraTop + extraBottom;
      svgEl2.setAttribute("viewBox", vbX + " " + vbY + " " + vbW + " " + vbH);
      svgEl2.setAttribute("preserveAspectRatio", "xMidYMid meet");
    }
  }


  // تحديث قائمة مساحات الشركاء أعلى الخريطة
  const legendDiv = document.getElementById("croquis-legend");
  if (legendDiv) {
    if (window.calculatedPieces && window.calculatedPieces.length > 0 && !window.isExporting) {
      legendDiv.innerHTML = "";
      window.calculatedPieces.forEach((piece, index) => {
        const isRem = piece.isRemainder;
        const color = isRem 
          ? { fill: "#fffde7", stroke: "#ff8f00" }
          : PIECE_COLORS[index % PIECE_COLORS.length];
        
        const chip = document.createElement("div");
        chip.className = "legend-chip";
        chip.setAttribute("title", `انقر لتحديد قطعة الشريك: ${piece.name || "مجهول"}`);
        chip.addEventListener("mouseenter", () => highlightSegment(index));
        chip.addEventListener("mouseleave", () => removeHighlight());
        chip.addEventListener("click", (e) => selectSegment(index, e));

        const dot = document.createElement("span");
        dot.className = "legend-color-dot";
        dot.style.backgroundColor = color.stroke;
        
        const text = document.createElement("span");
        text.innerText = `${piece.name || `شريك ${index + 1}`}: ${Number(piece.area.toFixed(2))} م²`;
        
        chip.appendChild(dot);
        chip.appendChild(text);
        legendDiv.appendChild(chip);
      });
      legendDiv.style.display = "flex";
    }
  }

  if (typeof applySmartLayout === "function" && !window.isExporting) {
    applySmartLayout();
  }
  } catch (e) {
    console.error("Error in renderCroquis:", e);
  }
}

function exportCroquis() {
  if (hasDeficit()) {
    alert("🔴 لا يمكن اعتماد أو طباعة التقرير أو تصديره لوجود عجز في الأنصبة. يرجى تعديل الأنصبة أولاً.");
    return;
  }
  const svgNode = document.getElementById("croquis-svg");
  if (!svgNode) return;
  
  // 1. حفظ حالة التحويل الأصلية للشاشة
  const transformG = document.getElementById("croquis-transform");
  let originalTransform = "";
  if (transformG) {
    originalTransform = transformG.getAttribute("transform");
    // تعيين تحويل محايد مؤقتًا للتصدير
    transformG.setAttribute("transform", "translate(0, 0) scale(1)");
  }
  
  // 2. تفعيل وضع التصدير مؤقتًا وإعادة الرسم بالأبعاد العالية (1600 × 1000)
  window.isExporting = true;
  renderCroquis();
  
  // 3. استنساخ عنصر الـ SVG بدقته الكاملة
  const clonedSvg = svgNode.cloneNode(true);
  
  // حساب Bounding Box الحقيقي وتحديث الـ viewBox للنسخة المصدرة فقط لملء الصورة بالكامل (هامش 5%)
  const contentEl = document.getElementById("croquis-content");
  if (contentEl) {
    const bbox = contentEl.getBBox();
    if (bbox.width > 0 && bbox.height > 0) {
      const maxDim = Math.max(bbox.width, bbox.height);
      const margin = Math.max(25, maxDim * 0.05); // هامش 5%
      const vbX = Math.round(bbox.x - margin);
      const vbY = Math.round(bbox.y - margin);
      const vbW = Math.round(bbox.width + margin * 2);
      const vbH = Math.round(bbox.height + margin * 2);
      clonedSvg.setAttribute("viewBox", `${vbX} ${vbY} ${vbW} ${vbH}`);
      clonedSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      console.log(`croquis-layout: Export viewBox adjusted to [${vbX} ${vbY} ${vbW} ${vbH}]`);
    }
  }

  const expW = window.exportWidth || 1600;
  const expH = window.exportHeight || 1000;
  clonedSvg.setAttribute("width", expW.toString());
  clonedSvg.setAttribute("height", expH.toString());
  clonedSvg.style.backgroundColor = "white";
  
  // 4. استعادة الحالة الأصلية للشاشة وإعادة الرسم فورًا
  window.isExporting = false;
  if (transformG && originalTransform) {
    transformG.setAttribute("transform", originalTransform);
  } else if (transformG) {
    transformG.removeAttribute("transform");
  }
  renderCroquis(); // إعادة الرسم بحجم الشاشة والزوم الحالي
  
  // 5. معالجة وتصدير الـ SVG المستنسخ
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clonedSvg);
  
  const img = new Image();
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  img.onload = function() {
    try {
      const canvas = document.createElement("canvas");
      const expW = window.exportWidth || 1600;
      const expH = window.exportHeight || 1000;
      canvas.width = expW; 
      canvas.height = expH;
      const ctx = canvas.getContext("2d");
      
      // خلفية بيضاء
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // تنزيل كـ PNG بطريقة متوافقة مع تطبيقات الجوال
      canvas.toBlob(async function(blob) {
        if (!blob) return;
        const filename = "تقسيم_الأرض_الدلال.png";
        
        try {
          const file = new File([blob], filename, { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'كروكي تقسيم الأرض',
              text: 'كروكي تقسيم الأرض من تطبيق الدلال'
            });
            return;
          }
        } catch (err) {
          console.log("Web Share API failed, falling back to blob download", err);
        }
        
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        }, 150);
      }, "image/png");
    } catch (err) {
      console.error("Canvas PNG export failed, downloading SVG directly:", err);
      // بديل مباشر
      const a = document.createElement("a");
      a.download = "تقسيم_الأرض_الدلال.svg";
      a.href = url;
      a.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  };
  
  img.onerror = function(err) {
    console.error("Image loading failed, downloading SVG directly:", err);
    const a = document.createElement("a");
    a.download = "تقسيم_الأرض_الدلال.svg";
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  img.src = url;
}

// ===================================================
// دوال التصدير والطباعة والنسخ
// ===================================================

function getTableDataArray() {
  const rows = document.querySelectorAll("#partners-list .partner-row");
  const data = [];
  
  // رأس الجدول
  if (currentInputMethod === "carats") {
    data.push(["م", "الشريك", "سهم", "قيراط", "فدان", "المساحة (م²)", "النسبة (%)", "العرض الأول (أعلى)", "العرض الثاني (أسفل)", "معدل العرض (م)", "معدل الطول (م)", "العلامة (م)", "الفاصل (م)"]);
  } else {
    data.push(["م", "الشريك", "النسبة/الكسر", "تعادل (س.ق.ف)", "المساحة (م²)", "النسبة (%)", "العرض الأول (أعلى)", "العرض الثاني (أسفل)", "معدل العرض (م)", "معدل الطول (م)", "العلامة (م)", "الفاصل (م)"]);
  }
  
  rows.forEach((row, idx) => {
    const rowData = [];
    rowData.push(row.querySelector(".partner-index") ? row.querySelector(".partner-index").value : "-");
    rowData.push(row.querySelector(".partner-name") ? row.querySelector(".partner-name").value : "-");
    
    if (currentInputMethod === "carats") {
      rowData.push(row.querySelector(".partner-shares") ? row.querySelector(".partner-shares").value : "0");
      rowData.push(row.querySelector(".partner-carats") ? row.querySelector(".partner-carats").value : "0");
      rowData.push(row.querySelector(".partner-feddans") ? row.querySelector(".partner-feddans").value : "0");
    } else {
      rowData.push(row.querySelector(".partner-fraction") ? row.querySelector(".partner-fraction").value : "-");
      rowData.push(row.querySelector(".partner-equiv") ? row.querySelector(".partner-equiv").value : "-");
    }
    
    rowData.push(row.querySelector(".partner-area") ? row.querySelector(".partner-area").value : "-");
    rowData.push(row.querySelector(".partner-percent") ? row.querySelector(".partner-percent").value : "-");
    
    // دقة 4 منازل عشرية للتقرير والطباعة
    let w1_val = "-";
    let w2_val = "-";
    if (window.calculatedPieces && window.calculatedPieces[idx]) {
      w1_val = window.calculatedPieces[idx].botW.toFixed(4);
      w2_val = window.calculatedPieces[idx].topW.toFixed(4);
    } else {
      w1_val = row.querySelector(".partner-width-bottom") ? row.querySelector(".partner-width-bottom").value : "-";
      w2_val = row.querySelector(".partner-width-top") ? row.querySelector(".partner-width-top").value : "-";
    }
    rowData.push(w2_val); // top width (العرض الأول (أعلى))
    rowData.push(w1_val); // bottom width (العرض الثاني (أسفل))
    
    // معدل العرض ومعدل الطول
    let avgW_val = "-";
    let avgL_val = "-";
    if (w1_val !== "-" && w2_val !== "-") {
      const w1_num = parseFloat(w1_val);
      const w2_num = parseFloat(w2_val);
      if (!isNaN(w1_num) && !isNaN(w2_num)) {
        const avgW = (w1_num + w2_num) / 2;
        avgW_val = avgW.toFixed(4);
        const area_val = parseFloat(row.querySelector(".partner-area") ? row.querySelector(".partner-area").value : 0) || 0;
        avgL_val = avgW > 0 ? (area_val / avgW).toFixed(4) : "-";
      }
    }
    rowData.push(avgW_val);
    rowData.push(avgL_val);
    
    rowData.push(row.querySelector(".partner-cum-width") ? row.querySelector(".partner-cum-width").value : "-");
    rowData.push(row.querySelector(".partner-div-line") ? row.querySelector(".partner-div-line").value : "-");
    data.push(rowData);
  });

  // إضافة صف المتبقي إذا كان ظاهراً
  const remRow = document.getElementById("remainder-row-table");
  if (remRow && remRow.style.display !== "none") {
    const remData = [];
    const inputs = remRow.querySelectorAll("input");
    if (inputs.length >= 11) {
      remData.push(inputs[0].value); // م
      remData.push(inputs[1].value); // الشريك
      if (currentInputMethod === "carats") {
        remData.push(inputs[2].value); // سهم
        remData.push(inputs[3].value); // قيراط
        remData.push(inputs[4].value); // فدان
        remData.push(inputs[5].value); // المساحة
        remData.push(inputs[6].value); // النسبة
        
        let remW1 = inputs[7].value; // top (العرض الأول)
        let remW2 = inputs[8].value; // bottom (العرض الثاني)
        if (window.calculatedPieces) {
          const remPiece = window.calculatedPieces.find(p => p.isRemainder);
          if (remPiece) {
            remW1 = remPiece.topW.toFixed(4); // top
            remW2 = remPiece.botW.toFixed(4); // bottom
          }
        }
        remData.push(remW1);
        remData.push(remW2);
        remData.push(inputs[9].value);  // معدل العرض
        remData.push(inputs[10].value); // معدل الطول
        
        const cumTextarea = remRow.querySelector("textarea");
        remData.push(cumTextarea ? cumTextarea.value : "-"); // العلامة (م)
        remData.push(inputs[11].value); // التحكم
      } else {
        remData.push(inputs[2].value); // النسبة/الكسر
        remData.push(inputs[3].value); // تعادل
        remData.push(inputs[4].value); // المساحة
        remData.push(inputs[5].value); // النسبة
        
        let remW1 = inputs[6].value; // top (العرض الأول)
        let remW2 = inputs[7].value; // bottom (العرض الثاني)
        if (window.calculatedPieces) {
          const remPiece = window.calculatedPieces.find(p => p.isRemainder);
          if (remPiece) {
            remW1 = remPiece.topW.toFixed(4); // top
            remW2 = remPiece.botW.toFixed(4); // bottom
          }
        }
        remData.push(remW1);
        remData.push(remW2);
        remData.push(inputs[8].value);  // معدل العرض
        remData.push(inputs[9].value);  // معدل الطول
        
        const cumTextarea = remRow.querySelector("textarea");
        remData.push(cumTextarea ? cumTextarea.value : "-"); // العلامة (م)
        remData.push(inputs[10].value); // التحكم
      }
      data.push(remData);
    }
  }

  // إضافة صف الإجمالي
  const totalRow = document.getElementById("total");
  if (totalRow) {
    const totData = [];
    const inputs = totalRow.querySelectorAll("input");
    if (inputs.length >= 12) {
      for (let i = 0; i < inputs.length; i++) {
        totData.push(inputs[i].value);
      }
      data.push(totData);
    }
  }
  
  if (window.PartitionDirectionManager.isLTR()) {
    const header = data[0];
    const partners = data.slice(1).filter(r => r[1] !== "المتبقي" && r[1] !== "الإجمالي");
    const remainder = data.slice(1).find(r => r[1] === "المتبقي");
    const total = data.slice(1).find(r => r[1] === "الإجمالي");
    
    partners.reverse();
    
    const newData = [header, ...partners];
    if (remainder) newData.push(remainder);
    if (total) newData.push(total);
    return newData;
  }
  
  return data;
}

function hasDeficit() {
  recalculateState();
  return window.calcState.hasDeficit;
}

function printReport() {
  if (hasDeficit()) {
    alert("🔴 لا يمكن اعتماد أو طباعة التقرير لوجود عجز في الأنصبة. يرجى تعديل الأنصبة أولاً.");
    return;
  }
  const l1 = document.getElementById("length1").value || "-";
  const l2 = document.getElementById("length2").value || "-";
  const w1 = document.getElementById("width1").value || "-";
  const w2 = document.getElementById("width2").value || "-";
  
  // جلب الاتجاهات الأربعة المختارة من الصفحة أو القيم الافتراضية
  const dirs = getP11Directions();
  
  // جلب البيانات الإجمالية المحدثة مباشرة من نتائج البرنامج لتوحيد القيم
  const totalArea = document.getElementById("total-area-sqm-res") ? document.getElementById("total-area-sqm-res").innerText.replace(" م²", "") : "-";
  const totalShares = document.getElementById("total-area-shares-res") ? document.getElementById("total-area-shares-res").innerText : "0";
  const totalCarats = document.getElementById("total-area-carats-res") ? document.getElementById("total-area-carats-res").innerText : "0";
  const totalFeddans = document.getElementById("total-area-feddans-res") ? document.getElementById("total-area-feddans-res").innerText : "0";
  const caratArea = document.getElementById("carat-area-res") ? document.getElementById("carat-area-res").innerText : "0";
  
  const numPartners = Array.from(document.querySelectorAll("#partners-list .partner-row")).filter(r => !isPartnerRowExcluded(r)).length;
  
  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('ar-EG');

  // حساب متوسط العرض ومتوسط الطول للمساحة الإجمالية
  const avgWidth = ((parseFloat(w1) || 0) + (parseFloat(w2) || 0)) / 2;
  const avgLength = ((parseFloat(l1) || 0) + (parseFloat(l2) || 0)) / 2;

  const isLTR = window.PartitionDirectionManager.isLTR();

  // دالة لتنسيق نصاب الشريك إلى جملة عربية فصحى مقروءة بدقة عالية
  function formatArabicFCS(feddan, carat, sahm) {
    const parts = [];
    if (feddan > 0) {
      if (feddan === 1) parts.push("فدان واحد");
      else if (feddan === 2) parts.push("فدانان");
      else if (feddan >= 3 && feddan <= 10) parts.push(`${feddan} فدادين`);
      else parts.push(`${feddan} فدان`);
    }
    
    if (carat > 0) {
      if (carat === 1) parts.push("قيراط واحد");
      else if (carat === 2) parts.push("قيراطان");
      else if (carat >= 3 && carat <= 10) parts.push(`${carat} قراريط`);
      else parts.push(`${carat} قيراط`);
    }
    
    const sahmInt = Math.floor(sahm);
    const sahmDec = Math.round((sahm - sahmInt) * 100);
    
    if (sahmInt > 0 || sahmDec > 0) {
      let sahmText = "";
      if (sahmInt > 0) {
        if (sahmInt === 1) sahmText = "سهم واحد";
        else if (sahmInt === 2) sahmText = "سهمان";
        else if (sahmInt >= 3 && sahmInt <= 10) sahmText = `${sahmInt} أسهم`;
        else sahmText = `${sahmInt} سهماً`;
      }
      
      if (sahmDec > 0) {
        const decText = `${sahmDec} جزءاً من السهم`;
        if (sahmText) {
          sahmText += ` و ${decText}`;
        } else {
          sahmText = decText;
        }
      }
      
      parts.push(sahmText);
    }
    
    if (parts.length === 0) return "0 سهم";
    return parts.join(" و ");
  }

  // بناء بطاقات الشركاء مع كافة البيانات التفصيلية الهندسية
  const partnerCardsHTML = window.calculatedPieces.map((piece, idx) => {
    const fcs = convertSquareMetersToFCS(piece.area);
    const fcsText = formatArabicFCS(fcs.feddan, fcs.carat, fcs.sahm);
    
    const w2_val = piece.topW.toFixed(4); // العرض الأول (أعلى)
    const w1_val = piece.botW.toFixed(4); // العرض الثاني (أسفل)
    const rightL_val = piece.leftLine.toFixed(4); // الطول الأيمن
    const leftL_val = piece.divLine.toFixed(4); // الطول الأيسر
    const avgW_val = piece.width.toFixed(4);
    const avgL_val = piece.width > 0 ? (piece.area / piece.width).toFixed(4) : "-";
    
    const displayIndex = idx + 1;
    const cardTitle = piece.isRemainder ? "الجزء المتبقي من الأرض" : `الشريك ${displayIndex}: ${piece.name}`;
    
    return `
      <div class="partner-print-card">
        <div class="partner-card-header">${cardTitle}</div>
        <table class="partner-card-table">
          <thead>
            <tr>
              <th style="width: 50%;">البيان</th>
              <th>القيمة</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style="text-align: right; padding-right: 8px;">العرض الأول (${dirs.top})</td><td style="font-weight:bold;color:#1b5e20;">${w2_val} م</td></tr>
            <tr><td style="text-align: right; padding-right: 8px;">العرض الثاني (${dirs.bottom})</td><td style="font-weight:bold;color:#1b5e20;">${w1_val} م</td></tr>
            <tr><td style="text-align: right; padding-right: 8px;">الطول الأيمن (${dirs.right})</td><td style="font-weight:bold;color:#1b5e20;">${rightL_val} م</td></tr>
            <tr><td style="text-align: right; padding-right: 8px;">الطول الأيسر (${dirs.left})</td><td style="font-weight:bold;color:#1b5e20;">${leftL_val} م</td></tr>
            <tr style="background:#e8f5e9;"><td style="text-align: right; padding-right: 8px;">معدل العرض</td><td style="font-weight:bold;color:#1b5e20;">${avgW_val} م</td></tr>
            <tr style="background:#e8f5e9;"><td style="text-align: right; padding-right: 8px;">متوسط الطول</td><td style="font-weight:bold;color:#1b5e20;">${avgL_val} م</td></tr>
          </tbody>
        </table>
        <div class="partner-card-area-box">
          <span class="partner-card-area-lbl">المساحة</span>
          <span class="partner-card-area-val">${piece.area.toFixed(2)} م²</span>
          <span class="partner-card-fcs-val">(${fcsText})</span>
        </div>
      </div>
    `;
  }).join("");

  // تحديد توزيع الأعمدة ديناميكياً لتفادي التشوه
  const numCards = window.calculatedPieces.length;
  let gridStyle = "grid-template-columns: repeat(3, 1fr);";
  if (numCards === 1) {
    gridStyle = "grid-template-columns: 1fr; max-width: 320px; margin: 0 auto;";
  } else if (numCards === 2) {
    gridStyle = "grid-template-columns: repeat(2, 1fr); max-width: 640px; margin: 0 auto;";
  }

  const printContent = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تقرير تقسيم الأراضي - الدلال</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { 
      size: A4 portrait; 
      margin: 6mm 8mm 6mm 8mm; 
    }
    body { 
      font-family: 'Cairo', sans-serif; 
      background: #fff; 
      color: #222; 
      font-size: 9pt; 
      direction: rtl; 
      padding-bottom: 20px; 
      position: relative; 
      line-height: 1.3;
    }
    .watermark-container { 
      position: fixed; 
      top: 50%; 
      left: 50%; 
      transform: translate(-50%, -50%) rotate(-25deg); 
      font-size: 20pt; 
      font-weight: 800; 
      color: #000000; 
      opacity: 0.04; 
      white-space: nowrap; 
      pointer-events: none; 
      z-index: -1000; 
      text-align: center; 
      width: 100%; 
    }
    .report-title-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 8px;
      border-bottom: 2px double #1b5e20;
      padding-bottom: 4px;
    }
    .report-title-container h1 {
      font-size: 16pt;
      color: #1b5e20;
      font-weight: 800;
      margin: 0;
    }
    .report-title-container p {
      font-size: 9.5pt;
      color: #c62828;
      font-weight: 700;
      margin: 2px 0 0;
    }
    
    .section {
      margin-bottom: 8px;
    }
    .section-title { 
      background: #1b5e20; 
      color: white; 
      font-weight: 700; 
      font-size: 9pt; 
      padding: 3px 8px; 
      border-right: 4px solid #2e7d32; 
      margin-bottom: 4px; 
      border-radius: 4px; 
      -webkit-print-color-adjust: exact; 
      print-color-adjust: exact; 
    }
    
    table { 
      width: 100%; 
      border-collapse: collapse; 
      font-size: 8.5pt; 
      margin-bottom: 6px; 
    }
    th { 
      background: #e8f5e9; 
      color: #1b5e20; 
      font-weight: 700; 
      border: 1px solid #1b5e20; 
      padding: 4px; 
      text-align: center; 
      -webkit-print-color-adjust: exact; 
      print-color-adjust: exact; 
    }
    td { 
      border: 1px solid #a5d6a7; 
      padding: 3px; 
      text-align: center; 
      vertical-align: middle; 
    }
    
    .partners-grid {
      display: grid;
      ${gridStyle}
      gap: 8px;
      margin-bottom: 6px;
    }
    .partner-print-card {
      border: 1.5px solid #1b5e20;
      border-radius: 6px;
      background: #ffffff;
      padding: 5px 6px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      page-break-inside: avoid;
    }
    .partner-card-header {
      background: #1b5e20;
      color: white;
      font-weight: 700;
      font-size: 8.5pt;
      padding: 2px 4px;
      border-radius: 4px;
      text-align: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .partner-card-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.5pt;
      margin-bottom: 2px;
    }
    .partner-card-table th {
      background: #e8f5e9;
      color: #1b5e20;
      font-weight: 700;
      border: 1px solid #a5d6a7;
      padding: 1.5px 2px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .partner-card-table td {
      border: 1px solid #a5d6a7;
      padding: 1.5px 2px;
    }
    .partner-card-area-box {
      background: #f1f8e9;
      border: 1px solid #a5d6a7;
      border-radius: 4px;
      padding: 2px 4px;
      text-align: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .partner-card-area-lbl {
      font-size: 6.5pt;
      color: #555;
      display: block;
      line-height: 1.1;
    }
    .partner-card-area-val {
      font-size: 9pt;
      color: #c62828;
      font-weight: 700;
      display: block;
      line-height: 1.2;
    }
    .partner-card-fcs-val {
      font-size: 7pt;
      color: #1b5e20;
      font-weight: bold;
      display: block;
      line-height: 1.1;
    }
    
    .totals-and-notes {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 8px;
      margin-top: 6px;
      page-break-inside: avoid;
    }
    .totals-box {
      border: 1.5px solid #1b5e20;
      border-radius: 6px;
      background: #f9fbe7;
      padding: 5px 6px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .totals-box table {
      margin: 0;
    }
    .totals-box td {
      padding: 2px 4px;
      font-size: 7.5pt;
    }
    .notes-box {
      border: 1.5px solid #dcdcdc;
      border-radius: 6px;
      background: #fafafa;
      padding: 5px 6px;
    }
    .notes-box h3 {
      font-size: 8.5pt;
      color: #444;
      margin-bottom: 2px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 1px;
    }
    .notes-box ul {
      list-style-type: none;
      padding-right: 5px;
    }
    .notes-box li {
      font-size: 7.5pt;
      color: #555;
      margin-bottom: 2px;
    }
    
    .report-footer { 
      position: fixed; 
      bottom: 0; 
      left: 0; 
      width: 100%; 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      text-align: center; 
      font-size: 7.5pt; 
      color: #555; 
      border-top: 1px solid #1b5e20; 
      padding: 3px 10px; 
      background: white; 
    }
    .footer-main-text { 
      font-size: 8pt; 
      font-weight: bold; 
      color: #555; 
    }
    
    .page-break-inside-avoid {
      page-break-inside: avoid;
    }
    
    @media print {
      body { background: #fff !important; color: #000 !important; }
      .report-title-container { border-bottom-color: #000 !important; }
      .section-title { background: #000 !important; color: #fff !important; border-right-color: #333 !important; }
      th { background: #f2f2f2 !important; color: #000 !important; border-color: #000 !important; }
      td { border-color: #ccc !important; }
      .partner-print-card { border-color: #000 !important; }
      .partner-card-header { background: #000 !important; color: #fff !important; }
      .partner-card-table th { background: #f2f2f2 !important; color: #000 !important; border-color: #ccc !important; }
      .partner-card-table td { border-color: #ccc !important; }
      .partner-card-area-box { background: #fff !important; border-color: #ccc !important; }
      .totals-box { border-color: #000 !important; background: #fff !important; }
      .totals-box td { border-color: #ccc !important; }
      .report-footer { border-top-color: #000 !important; }
    }
  </style>
</head>
<body>

  <div class="watermark-container">الدَّلاَّل – قياسات الأراضي • متوفر على جوجل بلاي</div>

  <div class="report-title-container">
    <div>
      <h1>بيان المساحات</h1>
      <p>جملة الغيط</p>
    </div>
    <div style="font-size: 8.5pt; color: #555; font-weight: bold;">
      تاريخ الطباعة: ${dateStr} - ${timeStr}
    </div>
  </div>

  <div class="section page-break-inside-avoid">
    <div class="section-title">أولاً: جدول بيان المساحات</div>
    <table>
      <thead>
        <tr>
          <th style="width: 50%;">البيان</th>
          <th>القيمة</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="text-align:right;padding-right:15px;font-weight:bold;">العرض الأول (${dirs.top})</td><td style="font-weight:bold;color:#1b5e20;">${w2} م</td></tr>
        <tr><td style="text-align:right;padding-right:15px;font-weight:bold;">العرض الثاني (${dirs.bottom})</td><td style="font-weight:bold;color:#1b5e20;">${w1} م</td></tr>
        <tr><td style="text-align:right;padding-right:15px;font-weight:bold;">الطول الأيمن (${dirs.right})</td><td style="font-weight:bold;color:#1b5e20;">${l1} م</td></tr>
        <tr><td style="text-align:right;padding-right:15px;font-weight:bold;">الطول الأيسر (${dirs.left})</td><td style="font-weight:bold;color:#1b5e20;">${l2} م</td></tr>
        <tr><td style="text-align:right;padding-right:15px;font-weight:bold;">معدل العرض</td><td style="font-weight:bold;color:#1b5e20;">${avgWidth.toFixed(4)} م</td></tr>
        <tr><td style="text-align:right;padding-right:15px;font-weight:bold;">متوسط الطول</td><td style="font-weight:bold;color:#1b5e20;">${avgLength.toFixed(4)} م</td></tr>
        <tr style="background:#e8f5e9;"><td style="text-align:right;padding-right:15px;font-weight:bold;color:#1b5e20;">جملة المساحة بالمتر المربع</td><td style="font-weight:bold;color:#c62828;font-size:11pt;">${totalArea} م²</td></tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">ثانياً: بطاقات الشركاء وتفاصيل تقسيم الأنصبة</div>
    <div class="partners-grid">
      ${partnerCardsHTML}
    </div>
  </div>

  <div class="totals-and-notes">
    <div class="totals-box">
      <table style="width: 100%; border: none;">
        <thead>
          <tr style="background: #e8f5e9;">
            <th style="border: 1px solid #1b5e20; padding: 4px; font-weight: bold; color: #1b5e20; font-size: 8.5pt;">البيان</th>
            <th style="border: 1px solid #1b5e20; padding: 4px; font-weight: bold; color: #1b5e20; font-size: 8.5pt;">القيمة</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #a5d6a7; text-align: right; padding-right: 8px; font-weight: bold;">إجمالي المساحة</td>
            <td style="border: 1px solid #a5d6a7; font-weight: bold; color: #c62828;">${totalArea} م²</td>
          </tr>
          <tr>
            <td style="border: 1px solid #a5d6a7; text-align: right; padding-right: 8px; font-weight: bold;">إجمالي الفدادين</td>
            <td style="border: 1px solid #a5d6a7; font-weight: bold; color: #1b5e20;">${totalFeddans}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #a5d6a7; text-align: right; padding-right: 8px; font-weight: bold;">إجمالي القراريط</td>
            <td style="border: 1px solid #a5d6a7; font-weight: bold; color: #1b5e20;">${totalCarats}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #a5d6a7; text-align: right; padding-right: 8px; font-weight: bold;">إجمالي الأسهم</td>
            <td style="border: 1px solid #a5d6a7; font-weight: bold; color: #1b5e20;">${totalShares}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #a5d6a7; text-align: right; padding-right: 8px; font-weight: bold;">مساحة القيراط بالمتر المربع</td>
            <td style="border: 1px solid #a5d6a7; font-weight: bold; color: #1b5e20;">${caratArea} م²</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="notes-box">
      <h3>ملاحظات:</h3>
      <ul>
        <li>1 - جميع الأطوال بالمتر.</li>
        <li>2 - تم تقسيم الغيط إلى ${numPartners} أجزاء تفصيلية بالطريقة الطولية.</li>
        <li>3 - اتجاه التقسيم للتنفيذ الميداني: ${isLTR ? "➡️ من اليسار إلى اليمين" : "⬅️ من اليمين إلى اليسار"}.</li>
      </ul>
    </div>
  </div>

  <div class="report-footer">
    <div class="footer-main-text">الدَّلاَّل – قياسات الأراضي • متوفر على جوجل بلاي</div>
  </div>

</body>
</html>`;
  
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    window.print();
    return;
  }
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => { printWindow.print(); }, 800);
}

function exportPDF() {
  // نستخدم طباعة المتصفح للـ PDF - هي الطريقة الأكثر موثوقية بدون مكتبات خارجية
  printReport();
  // نعرض رسالة توجيهية بعد فتح نافذة الطباعة
  setTimeout(() => {
    alert('💡 في نافذة الطباعة، اختر "حفظ كـ PDF" من قائمة الطابعات لتصدير الملف كـ PDF.');
  }, 1000);
}

function printFieldGuide() {
  openFieldGuideModal();
}

function highlightAndKeepSegment(idx) {
  window.selectedSegmentIndex = idx;
  highlightSegment(idx);
}

function openFieldGuideModal() {
  if (!window.calculatedPieces || window.calculatedPieces.length === 0) {
    alert("⚠ يرجى إجراء التقسيم أولاً قبل عرض الدليل الحقلي.");
    return;
  }
  if (hasDeficit()) {
    alert("🔴 لا يمكن عرض الدليل الحقلي لوجود عجز في الأنصبة. يرجى مراجعة الأنصبة أولاً.");
    return;
  }

  const totalArea = document.getElementById("calc-area-m2") ? document.getElementById("calc-area-m2").innerText : "-";
  
  // 1. حساب المتغيرات ديناميكياً
  const dividersCount = window.calculatedPieces.length - 1;
  const pegsCount = 2 * (window.calculatedPieces.length + 1);
  const estimatedTime = Math.max(10, 5 * window.calculatedPieces.length);
  
  // شريط القياس المناسب
  let maxDim = 50;
  if (window.calculatedPieces.length > 0) {
    let maxEndX = 0;
    window.calculatedPieces.forEach(p => {
      if (p.endX > maxEndX) maxEndX = p.endX;
      if (p.divLine > maxEndX) maxEndX = p.divLine;
    });
    maxDim = maxEndX;
  }
  let tapeLength = 50;
  if (maxDim < 20) tapeLength = 20;
  else if (maxDim < 30) tapeLength = 30;
  else if (maxDim < 50) tapeLength = 50;
  else tapeLength = 100;

  const isLTR = window.PartitionDirectionManager.isLTR();
  // 2. تحديث الكارت الأيمن (الملخص + الأدوات المطلوبة + الزمن)
  const summaryHTML = `
    <!-- بطاقة الملخص الإحصائي -->
    <div style="margin-bottom: 20px;">
      <div class="fh-guide-summary-item">
        <span>اتجاه التقسيم:</span>
        <span>${isLTR ? "➡️ من اليسار إلى اليمين" : "⬅️ من اليمين إلى اليسار"}</span>
      </div>
      <div class="fh-guide-summary-item">
        <span>نقطة البداية:</span>
        <span>${isLTR ? "الحد الأيسر (الصفر) 🏁" : "الحد الأيمن (الصفر) 🏁"}</span>
      </div>
      <div class="fh-guide-summary-item">
        <span>عدد الشركاء:</span>
        <span>${window.calculatedPieces.length} شركاء</span>
      </div>
      <div class="fh-guide-summary-item">
        <span>عدد الفواصل:</span>
        <span>${dividersCount} فواصل</span>
      </div>
      <div class="fh-guide-summary-item">
        <span>الأوتاد المطلوبة:</span>
        <span>${pegsCount} أوتاد 📌</span>
      </div>
      <div class="fh-guide-summary-item">
        <span>شريط القياس المناسب:</span>
        <span>${tapeLength} متر</span>
      </div>
      <div class="fh-guide-summary-item">
        <span>زمن التنفيذ المتوقع:</span>
        <span>${estimatedTime} دقيقة ⏱️</span>
      </div>
      <div class="fh-guide-summary-item" style="border-top: 1px dashed #c8e6c9; padding-top: 8px; margin-top: 8px;">
        <span>المساحة الإجمالية:</span>
        <span style="color: #1b5e20;">${totalArea} م²</span>
      </div>
    </div>
    
    <!-- بطاقة الأدوات المطلوبة -->
    <div style="border-top: 1.5px solid #c8e6c9; padding-top: 15px; margin-top: 15px;">
      <h4 style="color: #0d47a1 !important; border-bottom: 1px solid #90caf9 !important; padding-bottom: 6px !important; margin: 0 0 12px 0 !important; font-size: 15px !important; font-weight: bold !important;">🛠️ الأدوات الميدانية المطلوبة</h4>
      <div class="fh-guide-summary-item">📏 شريط قياس ${tapeLength} م</div>
      <div class="fh-guide-summary-item">🔨 شاكوش أو مرزبة حديدية</div>
      <div class="fh-guide-summary-item">📍 ${pegsCount} أوتاد خشبية / حديدية</div>
      <div class="fh-guide-summary-item">🧵 خيط شد متين للعلام</div>
      <div class="fh-guide-summary-item">✏️ قلم تعليم أو علام ملون</div>
    </div>
  `;
  document.getElementById("guide-summary-content").innerHTML = summaryHTML;

  // 3. تحديث الكارت الأيسر (الفواصل والقياسات ومؤشرات الخطوات المزدوجة)
  let dividersHTML = "";
  
  const dividerIndices = [];
  for (let i = 0; i < dividersCount; i++) {
    dividerIndices.push(i);
  }
  if (isLTR) {
    dividerIndices.reverse();
  }

  const w1 = parseFloat(document.getElementById("width1").value) || 0;
  const w2 = parseFloat(document.getElementById("width2").value) || 0;

  dividerIndices.forEach((idx, stepNum) => {
    const piece = window.calculatedPieces[idx];
    const nextPiece = window.calculatedPieces[idx + 1];
    const p1Name = isLTR ? nextPiece.name : piece.name;
    const p2Name = isLTR ? piece.name : nextPiece.name;
    const stepTitle = `الخطوة ${stepNum + 1} من ${dividersCount} | الآن يتم تحديد الحد الفاصل بين (${p1Name || 'شريك ' + (idx + 2)}) و (${p2Name || 'شريك ' + (idx + 1)})`;
    const pegIndex1 = isLTR ? (2 * (dividersCount - idx) + 1) : (2 * idx + 3);
    const pegIndex2 = isLTR ? (2 * (dividersCount - idx) + 2) : (2 * idx + 4);
    
    const topVal = isLTR ? ((1.0 - piece.tCurr_top) * w2) : (piece.tCurr_top * w2);
    const botVal = isLTR ? ((1.0 - piece.tCurr_bot) * w1) : (piece.tCurr_bot * w1);
    
    dividersHTML += `
      <div class="fh-guide-divider-row" data-partner-index="${idx}" style="cursor: pointer; position: relative; padding-right: 42px !important;"
           onmouseenter="highlightSegment(${idx})"
           onmouseleave="removeHighlight()"
           onclick="highlightAndKeepSegment(${idx})">
        <div style="position: absolute; right: 12px; top: 12px; font-size: 18px; color: #1b5e20;">📌</div>
        <div class="fh-guide-divider-title">${stepTitle}</div>
        <div style="font-size: 12px; color: #666; margin-bottom: 6px; font-weight: bold;">
          (تم وضع الأوتاد رقم ${pegIndex1} و ${pegIndex2} من إجمالي ${pegsCount} أوتاد)
        </div>
        <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px;">
          <span>القياس على الحد العلوي: <strong>${topVal.toFixed(2)} م</strong></span>
          <span>القياس على الحد السفلي: <strong>${botVal.toFixed(2)} م</strong></span>
          <span>طول الفاصل الفعلي: <strong>${piece.divLine.toFixed(2)} م</strong></span>
        </div>
      </div>
    `;
  });
  if (dividersHTML === "") {
    dividersHTML = `<div class="fh-guide-divider-row" style="text-align:center; color:#555;">لا توجد فواصل مطلوبة (شريك واحد فقط).</div>`;
  }
  
  // إضافة بطاقة النجاح والتعليمات الختامية
  dividersHTML += `
    <div style="border: 2px solid #81c784; background: #e8f5e9; padding: 16px; border-radius: 12px; margin-top: 20px;">
      <div class="fh-guide-section-title" style="color: #1b5e20; margin-bottom: 6px !important;">🎉 تم تنفيذ التقسيم بنجاح!</div>
      <ul class="fh-guide-text-list" style="color: #2e7d32; font-weight: bold; margin-bottom: 0;">
        <li>✔ تم وضع جميع الأوتاد لتحديد الفواصل.</li>
        <li>✔ أصبحت الأرض جاهزة للتسليم الفعلي للشركاء.</li>
        <li>✔ يرجى مراجعة وتأكيد القياسات التراكمية على الطبيعة.</li>
        <li>✔ تأكد من ثبات الأوتاد 📌 في التربة جيداً لئلا تُفقد.</li>
        <li>✔ مطابقة التنفيذ الميداني مع الكروكي والجدول الورقي.</li>
      </ul>
    </div>
  `;
  document.getElementById("guide-dividers-list").innerHTML = dividersHTML;

  // فتح المودال
  document.getElementById("field-guide-modal").style.display = "flex";
}

function closeFieldGuideModal() {
  document.getElementById("field-guide-modal").style.display = "none";
}

function openAnimationSimulationFromGuide() {
  closeFieldGuideModal();
  openAnimationSimulation();
}

function printFieldGuideDirect() {
  closeFieldGuideModal();
  
  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const totalArea = document.getElementById("calc-area-m2") ? document.getElementById("calc-area-m2").innerText : "-";

  const isLTR = window.PartitionDirectionManager.isLTR();
  const w1 = parseFloat(document.getElementById("width1").value) || 0;
  const w2 = parseFloat(document.getElementById("width2").value) || 0;

  let stepsHTML = `
    <div class="step start-step">
      <div class="step-icon">🏁</div>
      <div class="step-content">
        <div class="step-title">بداية القياس</div>
        <div class="step-sub">${isLTR ? "ابدأ من الحد الأيسر للأرض (النقطة صفر)" : "ابدأ من الحد الأيمن للأرض (النقطة صفر)"}</div>
      </div>
    </div>`;

  const scenarioPieces = isLTR ? [...window.calculatedPieces].reverse() : window.calculatedPieces;

  scenarioPieces.forEach((piece, loopIdx) => {
    const idx = window.calculatedPieces.indexOf(piece);
    const isLast = loopIdx === scenarioPieces.length - 1;
    const fcs = convertSquareMetersToFCS(piece.area);
    const label = piece.isRemainder ? "الجزء المتبقي" : (piece.name || 'شريك ' + (idx + 1));
    
    let dividerHTML = "";
    if (!isLast) {
      const divPiece = isLTR ? window.calculatedPieces[idx - 1] : piece;
      const topVal = isLTR ? ((1.0 - divPiece.tCurr_top) * w2) : (divPiece.tCurr_top * w2);
      const botVal = isLTR ? ((1.0 - divPiece.tCurr_bot) * w1) : (divPiece.tCurr_bot * w1);
      const divLineVal = divPiece.divLine;
      dividerHTML = `<div class="step-divider">الفاصل ${loopIdx + 1}: أعلى <strong>${topVal.toFixed(2)} م</strong> | أسفل <strong>${botVal.toFixed(2)} م</strong> (طول الفاصل: ${divLineVal.toFixed(2)} م)</div>`;
    }
    
    stepsHTML += `
    <div class="step-arrow">↓</div>
    <div class="step piece-step">
      <div class="step-num">${loopIdx + 1}</div>
      <div class="step-content">
        <div class="step-title">${label}</div>
        <div class="step-area">${piece.area.toFixed(2)} م² &nbsp;(${fcs.feddan} فدان ${fcs.carat} ق ${fcs.sahm} س)</div>
        <div class="step-widths">أعلى: ${piece.topW.toFixed(2)} م | أسفل: ${piece.botW.toFixed(2)} م</div>
        ${dividerHTML}
      </div>
    </div>`;
  });

  stepsHTML += `
    <div class="step-arrow">↓</div>
    <div class="step end-step">
      <div class="step-icon">🛑</div>
      <div class="step-content">
        <div class="step-title">نهاية التقسيم</div>
        <div class="step-sub">${isLTR ? "الحد الأيمن للأرض" : "الحد الأيسر للأرض"} — المساحة الإجمالية: ${totalArea} م²</div>
      </div>
    </div>`;

  const dirBarText = isLTR 
    ? `➡️ اتجاه التقسيم: من اليسار إلى اليمين — ابدأ القياس من الحد الأيسر للأرض (النقطة صفر)`
    : `➡️ اتجاه التقسيم: من اليمين إلى اليسار — ابدأ القياس من الحد الأيمن للأرض (النقطة صفر)`;

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
    <div class="meta"><div><strong>التاريخ:</strong> ${dateStr}</div><div><strong>المساحة:</strong> ${totalArea} م²</div><div><strong>عدد الشركاء:</strong> ${window.calculatedPieces.length}</div></div>
  </div>
  <div class="direction-bar">${dirBarText}</div>
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

function exportExcel() {
  if (hasDeficit()) {
    alert("🔴 لا يمكن اعتماد أو طباعة التقرير لوجود عجز في الأنصبة. يرجى تعديل الأنصبة أولاً.");
    return;
  }
  const data = getTableDataArray();
  const l1 = document.getElementById("length1").value || "";
  const l2 = document.getElementById("length2").value || "";
  const w1 = document.getElementById("width1").value || "";
  const w2 = document.getElementById("width2").value || "";
  const totalArea = document.getElementById("calc-area-m2") ? document.getElementById("calc-area-m2").innerText : "";
  
  const dirs = getP11Directions();
  
  // ترويسة المعلومات
  const infoRows = [
    ["تقرير تقسيم أرض باختلاف الأطوال - الدلال"],
    ["تاريخ التقرير", new Date().toLocaleDateString('ar-EG')],
    [],
    ["أبعاد الأرض الإجمالية"],
    [`العرض الأول (${dirs.top}) (م)`, w1, `العرض الثاني (${dirs.bottom}) (م)`, w2],
    [`الطول الأيمن (${dirs.right}) (م)`, l1, `الطول الأيسر (${dirs.left}) (م)`, l2],
    ["المساحة الإجمالية (م²)", totalArea],
    [],
    ["جدول التقسيم"]
  ];
  
  const allRows = [...infoRows, ...data];
  
  // تحويل إلى CSV
  const csvContent = allRows.map(row => {
    if (!Array.isArray(row)) return "";
    return row.map(cell => {
      const cellStr = String(cell || "").replace(/"/g, '""');
      return `"${cellStr}"`;
    }).join(",");
  }).join("\n");
  
  // إضافة BOM لدعم العربية في Excel
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = `تقسيم_الأراضي_الدلال_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  // إشعار نجاح
  const btn = event.currentTarget;
  const originalText = btn.innerHTML;
  btn.innerHTML = "✅ تم التصدير!";
  btn.style.background = "#2e7d32";
  btn.style.color = "white";
  setTimeout(() => { btn.innerHTML = originalText; btn.style.background = ""; btn.style.color = ""; }, 2500);
}

function copyTableToClipboard() {
  if (hasDeficit()) {
    alert("🔴 لا يمكن اعتماد أو طباعة التقرير لوجود عجز في الأنصبة. يرجى تعديل الأنصبة أولاً.");
    return;
  }
  const data = getTableDataArray();
  
  // تحويل إلى نص جدول محاذى
  const textTable = data.map(row => row.join("\t")).join("\n");
  
  navigator.clipboard.writeText(textTable).then(() => {
    const btn = event.currentTarget;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> تم النسخ!`;
    btn.style.background = "#2e7d32";
    btn.style.color = "white";
    setTimeout(() => { btn.innerHTML = originalHTML; btn.style.background = ""; btn.style.color = ""; }, 2500);
  }).catch(() => {
    // fallback للمتصفحات القديمة
    const textArea = document.createElement("textarea");
    textArea.value = textTable;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      alert("✅ تم نسخ الجدول إلى الحافظة! يمكنك لصقه في Excel أو Word.");
    } catch (e) {
      alert("❌ تعذر النسخ التلقائي. يُرجى تحديد الجدول ونسخه يدوياً.");
    }
    document.body.removeChild(textArea);
  });
}

function adjustNameColumnWidth() {
  const nameInputs = document.querySelectorAll(".partner-name");
  let maxChars = 10; // الحد الأدنى الافتراضي لعدد الحروف
  
  nameInputs.forEach(input => {
    if (input.value.length > maxChars) {
      maxChars = input.value.length;
    }
  });
  
  // حساب العرض بالبكسل (حوالي 9 بكسل لكل حرف + هامش)
  const calculatedWidth = Math.max(120, Math.min(350, maxChars * 9 + 25));
  
  const table = document.querySelector(".table");
  if (table) {
    table.style.setProperty("--name-column-width", `${calculatedWidth}px`);
  }
}

let isStepsOpen = false;

function toggleStepsAccordion() {
  const container = document.getElementById("calculation-steps-container");
  const arrow = document.getElementById("steps-arrow-icon");
  if (!container || !arrow) return;

  isStepsOpen = !isStepsOpen;
  if (isStepsOpen) {
    container.style.maxHeight = container.scrollHeight + "px";
    container.style.opacity = "1";
    arrow.style.transform = "rotate(-90deg)"; // تدور لتشير للأسفل
  } else {
    container.style.maxHeight = "0px";
    container.style.opacity = "0";
    arrow.style.transform = "rotate(0deg)"; // تعود لليمين
  }
}

function updatePrintStepsClass() {
  const card = document.querySelector(".steps-card");
  const checkbox = document.getElementById("print-steps-checkbox");
  if (card && checkbox) {
    if (checkbox.checked) {
      card.classList.add("print-visible");
    } else {
      card.classList.remove("print-visible");
    }
  }
}

// دالة مساعدة لتحويل الأرقام الإنجليزية إلى أرقام عربية فصحى (شرقية) مع الحفاظ على الفاصلة العشرية العربية
function toArabicNumerals(numStr) {
  if (numStr === undefined || numStr === null) return "";
  const str = String(numStr);
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return str.replace(/[0-9]/g, (w) => arabicDigits[+w]).replace(/\./g, "٫");
}

function updateCalculationSteps() {
  const stepsContainer = document.getElementById("calculation-steps-content");
  if (!stepsContainer) return;

  const l1 = parseFloat(document.getElementById("length1").value) || 0;
  const l2 = parseFloat(document.getElementById("length2").value) || 0;
  const w1 = parseFloat(document.getElementById("width1").value) || 0;
  const w2 = parseFloat(document.getElementById("width2").value) || 0;

  if (l1 <= 0 || l2 <= 0 || w1 <= 0 || w2 <= 0) {
    stepsContainer.innerHTML = `<p style="text-align: center; color: #777; font-style: italic;">أدخل الأبعاد والشركاء لعرض تفاصيل الخطوات الحسابية</p>`;
    return;
  }

  const w = (w1 + w2) / 2;
  const l = (l1 + l2) / 2;
  const totalAreaM2 = l * w;

  let html = `
    <!-- الخطوة 1: حساب متوسط العرض -->
    <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px; direction: rtl; text-align: right;">
      <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة ١: حساب متوسط العرض</strong>
      <div style="font-family: Cairo, Arial, sans-serif; font-size: 14px; font-weight: bold; background: #f5f5f5; padding: 6px 10px; border-radius: 4px; display: inline-block; margin-top: 4px; border: 1px solid #c8e6c9; color: #1b5e20;">
        (${toArabicNumerals(w1.toFixed(4))} + ${toArabicNumerals(w2.toFixed(4))}) ÷ ${toArabicNumerals(2)}<br>
        = ${toArabicNumerals(w.toFixed(4))} م
      </div>
    </div>

    <!-- الخطوة 2: حساب متوسط الطول -->
    <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px; direction: rtl; text-align: right;">
      <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة ٢: حساب متوسط الطول</strong>
      <div style="font-family: Cairo, Arial, sans-serif; font-size: 14px; font-weight: bold; background: #f5f5f5; padding: 6px 10px; border-radius: 4px; display: inline-block; margin-top: 4px; border: 1px solid #c8e6c9; color: #1b5e20;">
        (${toArabicNumerals(l1.toFixed(4))} + ${toArabicNumerals(l2.toFixed(4))}) ÷ ${toArabicNumerals(2)}<br>
        = ${toArabicNumerals(l.toFixed(4))} م
      </div>
    </div>

    <!-- الخطوة 3: حساب المساحة -->
    <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px; direction: rtl; text-align: right;">
      <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة ٣: حساب المساحة الإجمالية</strong>
      <div style="font-family: Cairo, Arial, sans-serif; font-size: 14px; font-weight: bold; background: #f5f5f5; padding: 6px 10px; border-radius: 4px; display: inline-block; margin-top: 4px; border: 1px solid #c8e6c9; color: #1b5e20;">
        ${toArabicNumerals(l.toFixed(4))} × ${toArabicNumerals(w.toFixed(4))}<br>
        = ${toArabicNumerals(totalAreaM2.toFixed(4))} م²
      </div>
    </div>
  `;

  // الخطوة 4 والخطوة 5: الشركاء والأنصبة والنسب
  const rows = document.querySelectorAll("#partners-list .partner-row");
  if (rows.length > 0) {
    // 4. حساب مساحة كل شريك
    html += `
      <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px; direction: rtl; text-align: right;">
        <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة ٤: حساب مساحة كل شريك</strong>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
    `;
    rows.forEach((row, index) => {
      const partnerName = row.querySelector(".partner-name").value || `شريك ${index + 1}`;
      const partnerAreaValue = parseFloat(row.querySelector(".partner-area").value) || 0;
      html += `
        <div style="border-right: 3px solid #66bb6a; padding-right: 8px;">
          <span style="font-weight: bold; color: #333;">${toArabicNumerals(partnerName)}:</span>
          <span style="font-size: 13px; color: #1b5e20; font-weight: bold; margin-right: 6px;">${toArabicNumerals(partnerAreaValue.toFixed(2))} م²</span>
        </div>
      `;
    });
    html += `
        </div>
      </div>
    `;

    // 5. حساب نسبة كل شريك
    html += `
      <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px; direction: rtl; text-align: right;">
        <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة ٥: حساب نسبة كل شريك</strong>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
    `;
    rows.forEach((row, index) => {
      const partnerName = row.querySelector(".partner-name").value || `شريك ${index + 1}`;
      const partnerAreaValue = parseFloat(row.querySelector(".partner-area").value) || 0;
      const partnerPct = totalAreaM2 > 0 ? (partnerAreaValue / totalAreaM2) * 100 : 0;
      html += `
        <div style="border-right: 3px solid #42a5f5; padding-right: 8px;">
          <span style="font-weight: bold; color: #333;">${toArabicNumerals(partnerName)}:</span><br>
          <div style="font-family: Cairo, Arial, sans-serif; font-size: 13px; font-weight: bold; background: #f5f5f5; padding: 4px 8px; border-radius: 3px; display: inline-block; margin-top: 2px; border: 1px solid #bbdefb; color: #0d47a1;">
            ${toArabicNumerals(partnerAreaValue.toFixed(2))} ÷ ${toArabicNumerals(totalAreaM2.toFixed(2))} × ${toArabicNumerals(100)}<br>
            = ${toArabicNumerals(partnerPct.toFixed(2))}٪
          </div>
        </div>
      `;
    });

    let totalDistributed = 0;
    rows.forEach(row => {
      totalDistributed += parseFloat(row.querySelector(".partner-area").value) || 0;
    });
    const remAreaVal = totalAreaM2 - totalDistributed;
    if (remAreaVal > 0.05) {
      const remPct = totalAreaM2 > 0 ? (remAreaVal / totalAreaM2) * 100 : 0;
      html += `
        <div style="border-right: 3px solid #ffa726; padding-right: 8px;">
          <span style="font-weight: bold; color: #e65100;">🟡 المتبقي:</span><br>
          <div style="font-family: Cairo, Arial, sans-serif; font-size: 13px; font-weight: bold; background: #fffde7; padding: 4px 8px; border-radius: 3px; display: inline-block; margin-top: 2px; border: 1px solid #ffe082; color: #e65100;">
            ${toArabicNumerals(remAreaVal.toFixed(2))} ÷ ${toArabicNumerals(totalAreaM2.toFixed(2))} × ${toArabicNumerals(100)}<br>
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

  // الخطوات 6، 7، 8، 9: هندسية التقسيم والتحقق
  if (isPartitioned && window.calculatedPieces && window.calculatedPieces.length > 0) {
    // 6. حساب العرض الأول لكل قطعة (أسفل)
    html += `
      <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px; direction: rtl; text-align: right;">
        <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة ٦: حساب العرض الأول لكل قطعة (أسفل)</strong>
        <p style="font-size: 11.5px; color: #666; margin-bottom: 4px; line-height: 1.3;">
          المعادلة: العرض السفلي الإجمالي (w1) مضروباً في نسبة شريحة الشريك الأفقي (dt):
        </p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
    `;
    window.calculatedPieces.forEach((piece, index) => {
      const dt = piece.botW / w1;
      html += `
        <div style="border-right: 3px solid #ab47bc; padding-right: 8px;">
          <span style="font-weight: bold; color: #333;">${toArabicNumerals(piece.name)}:</span><br>
          <div style="font-family: Cairo, Arial, sans-serif; font-size: 13px; font-weight: bold; background: #f5f5f5; padding: 4px 8px; border-radius: 3px; display: inline-block; margin-top: 2px; border: 1px solid #e1bee7; color: #4a148c;">
            ${toArabicNumerals(w1.toFixed(4))} × ${toArabicNumerals(dt.toFixed(6))}<br>
            = ${toArabicNumerals(piece.botW.toFixed(4))} م
          </div>
        </div>
      `;
    });
    html += `
        </div>
      </div>
    `;

    // 7. حساب العرض الثاني لكل قطعة (أعلى)
    html += `
      <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px; direction: rtl; text-align: right;">
        <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة ٧: حساب العرض الثاني لكل قطعة (أعلى)</strong>
        <p style="font-size: 11.5px; color: #666; margin-bottom: 4px; line-height: 1.3;">
          المعادلة: العرض العلوي الإجمالي (w2) مضروباً في نسبة شريحة الشريك الأفقي (dt):
        </p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
    `;
    window.calculatedPieces.forEach((piece, index) => {
      const dt = piece.topW / w2;
      html += `
        <div style="border-right: 3px solid #ab47bc; padding-right: 8px;">
          <span style="font-weight: bold; color: #333;">${toArabicNumerals(piece.name)}:</span><br>
          <div style="font-family: Cairo, Arial, sans-serif; font-size: 13px; font-weight: bold; background: #f5f5f5; padding: 4px 8px; border-radius: 3px; display: inline-block; margin-top: 2px; border: 1px solid #e1bee7; color: #4a148c;">
            ${toArabicNumerals(w2.toFixed(4))} × ${toArabicNumerals(dt.toFixed(6))}<br>
            = ${toArabicNumerals(piece.topW.toFixed(4))} م
          </div>
        </div>
      `;
    });
    html += `
        </div>
      </div>
    `;

    // 8. حساب طول الفاصل
    if (window.calculatedPieces.length > 1) {
      html += `
        <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px; direction: rtl; text-align: right;">
          <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة ٨: حساب طول الفاصل (خطوط القسمة الداخلية)</strong>
          <p style="font-size: 11.5px; color: #666; margin-bottom: 6px; line-height: 1.3;">
            المعادلة المستخدمة: التناسب الخطي المباشر للأطوال: <span style="font-family: monospace; direction: ltr; background: #eee; padding: 2px 4px; border-radius: 2px; display: inline-block;">L(t) = l1 + t &times; (l2 - l1)</span>
          </p>
          <div style="display: flex; flex-direction: column; gap: 8px;">
      `;
      window.calculatedPieces.forEach((piece, index) => {
        if (index > 0) {
          let t = 0;
          if (Math.abs(l2 - l1) > 1e-9) {
            t = (piece.leftLine - l1) / (l2 - l1);
          } else {
            const avgW = (w1 + w2) / 2;
            t = avgW > 0 ? (piece.startX / avgW) : 0;
          }
          html += `
            <div style="border-right: 3px solid #ffa726; padding-right: 8px;">
              <span style="font-weight: bold; color: #333;">الفاصل بين قطعة ${toArabicNumerals(index)} وقطعة ${toArabicNumerals(index + 1)}:</span><br>
              <div style="font-family: Cairo, Arial, sans-serif; font-size: 13px; font-weight: bold; background: #f5f5f5; padding: 4px 8px; border-radius: 3px; display: inline-block; margin-top: 2px; border: 1px solid #ffe082; color: #e65100;">
                ${toArabicNumerals(l1.toFixed(4))} + ${toArabicNumerals(t.toFixed(4))} × (${toArabicNumerals(l2.toFixed(4))} - ${toArabicNumerals(l1.toFixed(4))})<br>
                = ${toArabicNumerals(piece.leftLine.toFixed(4))} م
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
    let totalPiecesArea = 0;
    window.calculatedPieces.forEach(p => {
      totalPiecesArea += p.area;
    });
    const difference = totalAreaM2 - totalPiecesArea;
    const diffIcon = Math.abs(difference) < 0.01 ? "✔" : "❌";

    html += `
      <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px; direction: rtl; text-align: right;">
        <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة ٩: التحقق النهائي ومطابقة المساحات</strong>
        <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px; line-height: 1.4;">
          <div>مجموع مساحات الشركاء الفعلية = <strong style="color: #2e7d32; font-family: monospace;">${toArabicNumerals(totalPiecesArea.toFixed(4))} م²</strong></div>
          <div>المساحة الإجمالية للأرض = <strong style="color: #2e7d32; font-family: monospace;">${toArabicNumerals(totalAreaM2.toFixed(4))} م²</strong></div>
          <div style="margin-top: 4px; border-top: 1px solid #eee; padding-top: 4px; font-weight: bold; font-size: 13px;">
            الفرق المتبقي = 
            <span style="color: ${Math.abs(difference) < 0.01 ? "#2e7d32" : "#c62828"}; font-family: monospace;">
              ${toArabicNumerals(difference.toFixed(4))} م² ${diffIcon}
            </span>
          </div>
        </div>
      </div>
    `;
  } else {
    html += `
      <div style="text-align: center; padding: 12px; background: #fff8e1; border: 1px solid #ffe082; border-radius: 6px; color: #b76e00; font-weight: bold;">
        يرجى إكمال التقسيم (الضغط على أحسب أو تقسيم بالتساوي) لعرض خطوات ومسار التقسيم الهندسي بالتفصيل.
      </div>
    `;
  }

  let caratArea = parseFloat(document.getElementById("input-carat-area").value) || 0;
  if (caratArea === 0) {
    caratArea = parseFloat(document.getElementById("other-carat-area").value) || 0;
  }
  
  if (caratArea > 0 && isPartitioned) {
    const totalQirats = totalAreaM2 / caratArea;
    const botQiratWidth = w1 / totalQirats;
    const topQiratWidth = w2 / totalQirats;

    let qiratHtml = "";
    if (Math.abs(w1 - w2) < 0.001) {
      qiratHtml = `
        <strong style="color: #2e7d32; display: block; margin-bottom: 4px; font-size: 14px;">عرض القيراط الواحد من المساحة</strong>
        <div style="font-size: 13px; color: #1b5e20; font-weight: bold; margin-bottom: 6px;">
          عرض القيراط الواحد: <span style="background: #c8e6c9; padding: 2px 6px; border-radius: 4px;">${botQiratWidth.toFixed(4)} متر</span>
        </div>
        <p style="font-size: 11.5px; color: #388e3c; margin: 0; line-height: 1.5; border-right: 3px solid #66bb6a; padding-right: 8px;">
          بما أن عرض الأرض متساوٍ عند الحدين، فإن عرض القيراط يكون ثابتًا على امتداد الأرض.
        </p>
      `;
    } else {
      qiratHtml = `
        <p style="font-size: 11.5px; color: #555; margin-bottom: 12px; line-height: 1.6;">
          تُحسب واجهة القيراط اعتماداً على المساحة الفعلية للأرض مقسومة على مساحة القيراط المحددة.<br>
          <strong style="color:#d32f2f;">ملاحظة هامة:</strong> اختلاف واجهة القيراط بين الحد السفلي والحد العلوي أمر رياضي طبيعي في الأراضي غير المنتظمة، ولا يدل على وجود أي خطأ في الحساب أو في عملية التقسيم.
        </p>
        
        <div style="display: flex; gap: 10px; width: 100%;">
          
          <!-- Top Border Card -->
          <div style="flex: 1; background: #ffffff; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; border: 1.5px solid #a5d6a7; color: #000000; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div style="text-align: center; font-size: 13px; color: #1b5e20; margin-bottom: 6px; font-weight: bold;">عند الحد العلوي</div>
            <div style="text-align: center; font-size: 20px; color: #2e7d32; font-weight: bold; direction: ltr; margin-bottom: 12px;">${topQiratWidth.toFixed(4)} م</div>
            
            <div style="border-top: 1px solid #e0e0e0; margin-bottom: 8px;"></div>
            
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
              <span style="font-weight: bold; color: #333333;">العرض العلوي</span>
              <span style="font-weight: bold; direction: ltr; color: #1b5e20;">${w2} م</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <span style="font-weight: bold; color: #333333;">عدد القراريط</span>
              <span style="font-weight: bold; direction: ltr; color: #1b5e20;">${totalQirats.toFixed(4)} قيراط</span>
            </div>
          </div>

          <!-- Bottom Border Card -->
          <div style="flex: 1; background: #ffffff; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; border: 1.5px solid #a5d6a7; color: #000000; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div style="text-align: center; font-size: 13px; color: #1b5e20; margin-bottom: 6px; font-weight: bold;">عند الحد السفلي</div>
            <div style="text-align: center; font-size: 20px; color: #2e7d32; font-weight: bold; direction: ltr; margin-bottom: 12px;">${botQiratWidth.toFixed(4)} م</div>
            
            <div style="border-top: 1px solid #e0e0e0; margin-bottom: 8px;"></div>
            
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
              <span style="font-weight: bold; color: #333333;">العرض السفلي</span>
              <span style="font-weight: bold; direction: ltr; color: #1b5e20;">${w1} م</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <span style="font-weight: bold; color: #333333;">عدد القراريط</span>
              <span style="font-weight: bold; direction: ltr; color: #1b5e20;">${totalQirats.toFixed(4)} قيراط</span>
            </div>
          </div>

        </div>
      `;
    }
    const qiratContent = document.getElementById("qirat-info-content");
    if (qiratContent) {
      qiratContent.innerHTML = qiratHtml;
      if (isQiratInfoOpen) {
        const qContainer = document.getElementById("qirat-info-container");
        if (qContainer) qContainer.style.maxHeight = qContainer.scrollHeight + "px";
      }
    }
  } else {
    const qiratContent = document.getElementById("qirat-info-content");
    if (qiratContent) qiratContent.innerHTML = '<p style="text-align: center; color: #777; font-style: italic;">يرجى إكمال التقسيم لعرض واجهة القيراط</p>';
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

  // إذا كانت اللوحة مفتوحة، نقوم بتحديث ارتفاعها المناسب لتفادي قص المحتوى
  if (isStepsOpen) {
    const container = document.getElementById("calculation-steps-container");
    if (container) {
      container.style.maxHeight = container.scrollHeight + "px";
    }
  }
}

// دالة لنسخ خطوات الحساب بالتفصيل كنص نظيف خالٍ من التنسيقات
function copyCalculationSteps() {
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
        showToast("✅ تم نسخ خطوات الحساب بنجاح.");
      }
    }).catch(err => {
      fallbackCopyText(textToCopy);
    });
  } else {
    fallbackCopyText(textToCopy);
  }
}

// طريقة بديلة للنسخ في البيئات القديمة أو غير الآمنة
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
      showToast("✅ تم نسخ خطوات الحساب بنجاح.");
    }
  } catch (err) {
    console.error("Fallback copy failed", err);
  }
  document.body.removeChild(textArea);
}

// دالة لعرض إشعار مؤقت (Toast) جذاب
function showToast(message) {
  const existing = document.getElementById("page11-copy-toast");
  if (existing) {
    existing.remove();
  }
  
  const toast = document.createElement("div");
  toast.id = "page11-copy-toast";
  toast.className = "outdoor-mode-exempt";
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #134614;
    color: #ffffff !important;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: bold;
    font-family: Cairo, Arial, sans-serif;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    direction: rtl;
    text-align: center;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;
  toast.innerText = message;
  document.body.appendChild(toast);
  
  toast.offsetHeight; // trigger reflow
  toast.style.opacity = "1";
  
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 300);
  }, 2500);
}

// ============================================================
//   دوال التحويل للقصبة والقبضة (مأخوذة من صفحة 13)
// ============================================================
function toQasabaAndQabda(meters) {
  return AgriUnitsCompat.metersToQasabaQabda(meters);
}


const dimMap = [
  { id: 'width1', name: 'العرض الأول (أعلى) (C)' },
  { id: 'width2', name: 'العرض الثاني (أسفل) (A)' },
  { id: 'length1', name: 'الطول الأيمن (D)' },
  { id: 'length2', name: 'الطول الأيسر (B)' }
];

function updateConversionsTable() {
  const container = document.getElementById("conversions-tbody");
  if (!container) return;

  // ── حفظ حالة العنصر النشط قبل إعادة البناء ──────────────────────────────
  const activeEl = document.activeElement;
  const isInsideContainer = activeEl && container.contains(activeEl);

  let savedFocusId   = null;
  let savedValue     = null;
  let savedCursorStart = null;
  let savedCursorEnd   = null;

  if (isInsideContainer && activeEl.id) {
    savedFocusId = activeEl.id;
    savedValue   = activeEl.value;
    try {
      savedCursorStart = activeEl.selectionStart;
      savedCursorEnd   = activeEl.selectionEnd;
    } catch (e) { /* inputs that don't support selection */ }
  }
  // ──────────────────────────────────────────────────────────────────────────

  const l1 = parseFloat(document.getElementById("length1").value) || 0;
  const l2 = parseFloat(document.getElementById("length2").value) || 0;
  const w1 = parseFloat(document.getElementById("width1").value) || 0;
  const w2 = parseFloat(document.getElementById("width2").value) || 0;
  const totalAreaM2 = ((l1 + l2) / 2) * ((w1 + w2) / 2);

  // helper: render one field input
  function convFieldHTML(id, value, title, min, max, step) {
    const minAttr  = min  !== undefined ? `min="${min}"`   : '';
    const maxAttr  = max  !== undefined ? `max="${max}"`   : '';
    const stepAttr = step !== undefined ? `step="${step}"` : '';
    const displayValue = (id === savedFocusId && savedValue !== null) ? savedValue : value;
    return `
      <input type="text" inputmode="decimal"
        id="${id}" value="${displayValue}"
        class="conv-chip-input"
        title="${title}"
        ${minAttr} ${maxAttr} ${stepAttr}
        oninput="updateSideFromQasaba(this.dataset.idx)"
        onchange="updateSideFromQasaba(this.dataset.idx)"
        data-idx="${id.split('-').pop()}">`;
  }

  function readonlyFieldHTML(value, title) {
    return `
      <input type="text" inputmode="decimal" value="${value}" class="conv-chip-input" readonly tabindex="-1">`;
  }

  function buildCard({ id, label, meterValue, isEditable, isArea }) {
    const qConv = toQasabaAndQabda(meterValue);
    const meterLabel = isArea ? `${meterValue.toFixed(2)} م²` : `${meterValue.toFixed(2)} م`;

    const fracHTML = isEditable
      ? convFieldHTML(`conv-fraction-${id}`, qConv.fraction, 'أقل من القبضة', 0, 0.99, 0.01)
      : readonlyFieldHTML(qConv.fraction, 'أقل من القبضة');

    const qabdaHTML = isEditable
      ? convFieldHTML(`conv-qabda-${id}`, qConv.qabda, 'قبضة', 0, undefined, 1)
      : readonlyFieldHTML(qConv.qabda, 'قبضة');

    const qasabaHTML = isEditable
      ? convFieldHTML(`conv-qasaba-${id}`, qConv.qasaba, 'قصبة', 0, undefined, 1)
      : readonlyFieldHTML(qConv.qasaba, 'قصبة');

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
          <div>${fracHTML}</div>
          <div>${qabdaHTML}</div>
          <div>${qasabaHTML}</div>
        </div>
      </div>`;
  }

  let html = '';

  const dirs = getP11Directions();

  // الأبعاد الأربعة القابلة للتعديل
  const dims = [
    { id: 0, field: 'width2', label: `العرض الأول (${dirs.top})` },
    { id: 1, field: 'width1', label: `العرض الثاني (${dirs.bottom})` },
    { id: 2, field: 'length1', label: `الطول الأيمن (${dirs.right})` },
    { id: 3, field: 'length2', label: `الطول الأيسر (${dirs.left})` },
  ];

  dims.forEach(dim => {
    const dimEl = document.getElementById(dim.field);
    const val = parseFloat(dimEl ? dimEl.value : 0) || 0;
    html += buildCard({
      id: dim.id,
      label: dim.label,
      meterValue: val,
      isEditable: true,
      isArea: false
    });
  });

  // عروض القيراط والمساحة المربعة في صف مستقل
  let caratArea = parseFloat(document.getElementById("input-carat-area").value) || 0;
  if (caratArea === 0) caratArea = parseFloat(document.getElementById("other-carat-area").value) || 0;

  let botQiratWidth = 0, topQiratWidth = 0;
  if (caratArea > 0 && totalAreaM2 > 0) {
    const totalQirats = totalAreaM2 / caratArea;
    topQiratWidth = w2 / totalQirats;
    botQiratWidth = w1 / totalQirats;
  }

  if (caratArea > 0 && totalAreaM2 > 0) {
    html += buildCard({
      id: 'topq',
      label: `عرض القيراط العلوي (${dirs.top})`,
      meterValue: topQiratWidth,
      isEditable: false,
      isArea: false
    });
    html += buildCard({
      id: 'botq',
      label: `عرض القيراط السفلي (${dirs.bottom})`,
      meterValue: botQiratWidth,
      isEditable: false,
      isArea: false
    });
  }

  // النتيجة بالقصبة المربعة - نبنيها مباشرة بقيم صحيحة
  const qasba_sq = totalAreaM2 / 12.60250;
  const reedValue = Math.floor(qasba_sq);
  const fistValue = Math.floor((qasba_sq - reedValue) * 24);
  const lessThanFistValue = parseFloat(((qasba_sq - reedValue - fistValue / 24)).toFixed(2));

  const areaFracHTML   = readonlyFieldHTML(lessThanFistValue, 'أقل من القبضة');
  const areaQabdaHTML  = readonlyFieldHTML(fistValue, 'قبضة');
  const areaQasabaHTML = readonlyFieldHTML(reedValue, 'قصبة');

  html += `
    <div class="conv-card">
      <div class="conv-card-title">النتيجة بالقصبة المربعة</div>
      <div class="conv-card-main-val">${totalAreaM2.toFixed(2)} م²</div>
      <div class="conv-card-row-header">
        <span>أقل من القبضة</span>
        <span>قبضة</span>
        <span>قصبة</span>
      </div>
      <div class="conv-card-row-values">
        <div>${areaFracHTML}</div>
        <div>${areaQabdaHTML}</div>
        <div>${areaQasabaHTML}</div>
      </div>
    </div>`;

  // ── إعادة بناء DOM ─────────────────────────────────────────────────────────
  container.innerHTML = html;

  // ── استعادة التركيز والقيمة والموضع للحقل الذي كان نشطاً ─────────────────
  if (savedFocusId) {
    const restoredEl = document.getElementById(savedFocusId);
    if (restoredEl) {
      restoredEl.focus();
      try {
        if (savedCursorStart !== null) {
          restoredEl.setSelectionRange(savedCursorStart, savedCursorEnd);
        }
      } catch (e) { /* non-text inputs */ }
    }
  }
  // ──────────────────────────────────────────────────────────────────────────
}


function fromQasabaToMeters(qasaba, qabda, fraction) {
  return AgriUnitsCompat.qasabaQabdaToMeters(qasaba, qabda, fraction);
}



function updateSideFromQasaba(index) {
  const qasabaEl = document.getElementById('conv-qasaba-' + index);
  const qabdaEl = document.getElementById('conv-qabda-' + index);
  const fracEl = document.getElementById('conv-fraction-' + index);
  if (!qasabaEl || !qabdaEl || !fracEl) return;

  let fracRaw = fracEl.value;
  if (fracRaw && !fracRaw.includes('.')) {
    fracRaw = "0." + fracRaw;
    fracEl.value = fracRaw;
  }
  
  let qasaba = Math.max(0, parseInt(qasabaEl.value) || 0);
  let qabda = Math.max(0, parseInt(qabdaEl.value) || 0);
  let fraction = parseFloat(fracRaw) || 0;

  fraction = Math.min(0.99, Math.max(0, parseFloat(fraction.toFixed(2))));

  if (qabda >= 24) {
    const carry = Math.floor(qabda / 24);
    qasaba += carry;
    qabda = qabda % 24;
  }

  qasabaEl.value = qasaba;
  qabdaEl.value = qabda;
  fracEl.value = fraction;

  const meters = fromQasabaToMeters(qasaba, qabda, fraction);
  
  const dimId = dimMap[index].id;
  const inputEl = document.getElementById(dimId);
  if (inputEl) {
    inputEl.value = parseFloat(meters.toFixed(4));
    
    // Update badge in table
    const badge = document.getElementById('conv-meter-' + index);
    if (badge) badge.innerText = parseFloat(meters.toFixed(4));
    
    // Visual feedback
    const badgeContainer = document.getElementById('conv-meter-badge-' + index);
    if (badgeContainer) {
      badgeContainer.classList.add('updated');
      setTimeout(() => badgeContainer.classList.remove('updated'), 600);
    }
    
    // Trigger calculation
    saveAndCalc();
  }
}

let isQiratInfoOpen = false;
function toggleQiratInfoAccordion() {
  isQiratInfoOpen = !isQiratInfoOpen;
  const container = document.getElementById("qirat-info-container");
  const arrow = document.getElementById("qirat-info-arrow-icon");
  if (!container || !arrow) return;
  
  if (isQiratInfoOpen) {
    container.style.opacity = "1";
    container.style.padding = "16px 16px";
    container.style.maxHeight = container.scrollHeight + 32 + "px";
    arrow.style.transform = "rotate(-90deg)";
  } else {
    container.style.opacity = "0";
    container.style.padding = "0 16px";
    container.style.maxHeight = "0px";
    arrow.style.transform = "rotate(0deg)";
  }
}

function updatePrintQiratClass() {
  const card = document.querySelector(".qirat-info-card");
  const chk = document.getElementById("print-qirat-checkbox");
  if (card && chk) {
    if (chk.checked) {
      card.classList.add("print-visible");
    } else {
      card.classList.remove("print-visible");
    }
  }
}

function getPartnerTargetArea(row) {
  const l1 = parseFloat(document.getElementById("length1").value) || 0;
  const l2 = parseFloat(document.getElementById("length2").value) || 0;
  const w1 = parseFloat(document.getElementById("width1").value) || 0;
  const w2 = parseFloat(document.getElementById("width2").value) || 0;
  const totalAreaM2 = AgriUnitsCompat.trapezoidArea(l1, l2, w1, w2);

  let caratArea = parseFloat(document.getElementById("input-carat-area").value);
  if (caratArea === 0) {
    caratArea = parseFloat(document.getElementById("other-carat-area").value) || 0;
  }

  // المصدر الوحيد للحقيقة (Single Source of Truth): في حال وجود مساحة دقيقة محددة برمجياً للقطعة
  if (row.dataset.exactArea && !isNaN(parseFloat(row.dataset.exactArea))) {
    const exact = parseFloat(row.dataset.exactArea);
    const f = parseFloat(row.querySelector(".partner-feddans") ? row.querySelector(".partner-feddans").value : 0) || 0;
    const c = parseFloat(row.querySelector(".partner-carats") ? row.querySelector(".partner-carats").value : 0) || 0;
    const s = parseFloat(row.querySelector(".partner-shares") ? row.querySelector(".partner-shares").value : 0) || 0;
    const fcsArea = (f * 24 + c + s / 24) * (caratArea || 168);
    if (Math.abs(fcsArea - exact) < 0.25) {
      return exact;
    }
  }

  if (currentInputMethod === "carats") {
    const f = parseFloat(row.querySelector(".partner-feddans") ? row.querySelector(".partner-feddans").value : 0) || 0;
    const c = parseFloat(row.querySelector(".partner-carats") ? row.querySelector(".partner-carats").value : 0) || 0;
    const s = parseFloat(row.querySelector(".partner-shares") ? row.querySelector(".partner-shares").value : 0) || 0;
    const partnerCarats = (f * 24) + c + s / 24;
    return partnerCarats * caratArea;
  } else {
    const fracInput = row.querySelector(".partner-fraction");
    const fracVal = parseFraction(fracInput ? fracInput.value : "");
    return fracVal * totalAreaM2;
  }
}

function adjustWidthStep(btn, type, direction) {
  const container = btn.closest(".width-input-container");
  if (!container) return;
  const input = container.querySelector(type === "bottom" ? ".partner-width-bottom" : ".partner-width-top");
  if (!input) return;

  const stepEl = document.getElementById("width-step-value");
  const step = stepEl ? (parseFloat(stepEl.value) || 0.10) : 0.10;

  let currentVal = parseFloat(input.value);
  if (isNaN(currentVal)) {
    currentVal = parseFloat(input.getAttribute("data-last-val")) || 0;
  }

  let newVal = currentVal + direction * step;

  // منع القيم السالبة أو الصفرية
  if (newVal < 0) {
    newVal = 0;
    btn.classList.add("step-btn-limit");
    setTimeout(() => btn.classList.remove("step-btn-limit"), 600);
    return;
  }

  // منع تجاوز عرض الأرض
  const w1El = document.getElementById("width1");
  const w2El = document.getElementById("width2");
  const landW1 = parseFloat(w1El ? w1El.value : 0) || 0;
  const landW2 = parseFloat(w2El ? w2El.value : 0) || 0;
  const maxWidth = type === "bottom" ? landW1 : landW2;
  if (maxWidth > 0 && newVal > maxWidth) {
    btn.classList.add("step-btn-limit");
    setTimeout(() => btn.classList.remove("step-btn-limit"), 600);
    return;
  }

  const currentWidth = currentVal;
  const newWidth = newVal;
  console.log("Step =", step);
  console.log("Before =", currentWidth);
  console.log("After =", newWidth);

  input.value = newVal.toFixed(4);
  onWidthChangeActual(input, type);
}

// ---------------------------------------------------------
// نظام الضغط المطول على أزرار +/- (Long Press Engine)
// ---------------------------------------------------------
let _lpTimer = null;
let _lpInterval = null;

function _lpStart(btn, type, direction, immediate = true) {
  if (immediate) {
    adjustWidthStep(btn, type, direction);
  }
  // ابدأ التكرار بعد 400ms تأخير أولي
  _lpTimer = setTimeout(() => {
    _lpInterval = setInterval(() => {
      adjustWidthStep(btn, type, direction);
    }, 150);
  }, 400);
}

function _lpStop() {
  if (_lpTimer) { clearTimeout(_lpTimer); _lpTimer = null; }
  if (_lpInterval) { clearInterval(_lpInterval); _lpInterval = null; }
}

// ربط الضغط المطول بكل أزرار +/- عبر التفويض
document.addEventListener("mousedown", (e) => {
  const btn = e.target.closest(".width-step-btn");
  if (!btn) return;
  e.preventDefault();
  const onclick = btn.getAttribute("onclick") || "";
  const m = onclick.match(/adjustWidthStep\(this,\s*'(\w+)',\s*(-?1)\)/);
  if (!m) return;
  _lpStart(btn, m[1], parseInt(m[2]), false); // لا نستدعيها فوراً لأن الـ onclick سيستدعيها
});
document.addEventListener("mouseup", _lpStop);
document.addEventListener("mouseleave", _lpStop);

// متغيرات لتسجيل حالة اللمس والتمييز بين السحب والنقر
let touchStartX = 0;
let touchStartY = 0;
let touchActiveBtn = null;
let touchScrollCancelled = false;
let longPressTriggered = false;
let touchStartTimer = null;

document.addEventListener("touchstart", (e) => {
  const btn = e.target.closest(".width-step-btn");
  if (!btn) return;
  
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  touchActiveBtn = btn;
  touchScrollCancelled = false;
  longPressTriggered = false;
  
  if (touchStartTimer) clearTimeout(touchStartTimer);
  touchStartTimer = setTimeout(() => {
    if (!touchScrollCancelled && touchActiveBtn) {
      longPressTriggered = true;
      const onclick = touchActiveBtn.getAttribute("onclick") || "";
      const m = onclick.match(/adjustWidthStep\(this,\s*'(\w+)',\s*(-?1)\)/);
      if (m) {
        _lpStart(touchActiveBtn, m[1], parseInt(m[2]), true);
      }
    }
  }, 350);
}, { passive: true });

document.addEventListener("touchmove", (e) => {
  if (!touchActiveBtn || touchScrollCancelled) return;
  
  const dx = e.touches[0].clientX - touchStartX;
  const dy = e.touches[0].clientY - touchStartY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance > 8) {
    touchScrollCancelled = true;
    if (touchStartTimer) {
      clearTimeout(touchStartTimer);
      touchStartTimer = null;
    }
    _lpStop();
    touchActiveBtn = null;
  }
});

document.addEventListener("touchend", (e) => {
  if (touchStartTimer) {
    clearTimeout(touchStartTimer);
    touchStartTimer = null;
  }
  
  if (!touchActiveBtn) return;
  
  e.preventDefault(); // منع النقرة الافتراضية لمنع التكرار والتأخير
  
  if (!touchScrollCancelled && !longPressTriggered) {
    const onclick = touchActiveBtn.getAttribute("onclick") || "";
    const m = onclick.match(/adjustWidthStep\(this,\s*'(\w+)',\s*(-?1)\)/);
    if (m) {
      adjustWidthStep(touchActiveBtn, m[1], parseInt(m[2]));
    }
  }
  
  _lpStop();
  touchActiveBtn = null;
}, { passive: false });

document.addEventListener("touchcancel", (e) => {
  if (touchStartTimer) {
    clearTimeout(touchStartTimer);
    touchStartTimer = null;
  }
  _lpStop();
  touchActiveBtn = null;
});

let widthChangeTimer = null;

function onWidthChange(input, type) {
  if (window.__RUNNING_TESTS__) {
    onWidthChangeActual(input, type);
    return;
  }
  if (widthChangeTimer) clearTimeout(widthChangeTimer);
  widthChangeTimer = setTimeout(() => {
    onWidthChangeActual(input, type);
  }, 250); // 250ms debounce
}


function onWidthChangeActual(input, type) {
  if (isEditing) return;
  ensureDimensionsAutofill();
  const row = input.closest(".partner-row");
  const rows = Array.from(document.querySelectorAll("#partners-list .partner-row"));
  const rowIndex = rows.indexOf(row);
  if (rowIndex === -1) return;

  const l1 = parseFloat(document.getElementById("length1").value) || 0;
  const l2 = parseFloat(document.getElementById("length2").value) || 0;
  const w1 = parseFloat(document.getElementById("width1").value) || 0;
  const w2 = parseFloat(document.getElementById("width2").value) || 0;

  if (l1 <= 0 || l2 <= 0 || w1 <= 0 || w2 <= 0) {
    alert("الرجاء إدخال أبعاد الأرض الإجمالية أولاً.");
    input.value = input.getAttribute("data-last-val") || "-";
    return;
  }

  const widthBotInput = row.querySelector(".partner-width-bottom");
  const widthTopInput = row.querySelector(".partner-width-top");
  if (!widthBotInput || !widthTopInput) return;

  const lastVal_bot = parseFloat(widthBotInput.getAttribute("data-last-val")) || 0;
  const lastVal_top = parseFloat(widthTopInput.getAttribute("data-last-val")) || 0;

  if (input.value.trim() === "") {
    input.value = (type === "bottom" ? lastVal_bot : lastVal_top).toFixed(4);
  }

  const isKeepArea = document.getElementById("mode-keep-area") && document.getElementById("mode-keep-area").checked;

  const val = parseFloat(input.value);
  if (isNaN(val) || val < 0) {
    alert("يمنع إدخال قيمة سالبة أو غير صحيحة.");
    input.value = (type === "bottom" ? lastVal_bot : lastVal_top).toFixed(4);
    return;
  }

  let newBotW = 0;
  let newTopW = 0;
  const diff_L = l2 - l1;

  if (isKeepArea) {
    // ----------------------------------------------------
    // وضع الحفاظ على مساحة الشريك (Keep Partner Area Mode)
    // ----------------------------------------------------
    const targetArea = getPartnerTargetArea(row);
    if (targetArea <= 0) {
      alert("الرجاء تحديد حصة أو مساحة مستهدفة للشريك أولاً للتمكن من الحفاظ عليها.");
      input.value = (type === "bottom" ? lastVal_bot : lastVal_top).toFixed(4);
      return;
    }

    // حساب إحداثيات البداية التراكمية للعلوي
    let lastT_top = 0;
    for (let i = 0; i < rowIndex; i++) {
      const wTop = parseFloat(rows[i].querySelector(".partner-width-top").value) || 0;
      lastT_top += wTop / w2;
    }
    const L_right = l1 + lastT_top * diff_L;

    if (type === "bottom") {
      newBotW = val;
      
      // حل لحساب newTopW للحفاظ على المساحة
      if (Math.abs(diff_L) < 1e-9) {
        newTopW = (2 * targetArea / L_right) - newBotW;
      } else {
        const a_quad = diff_L / (2 * w2);
        const b_quad = L_right + (diff_L / (2 * w2)) * newBotW;
        const c_quad = L_right * newBotW - 2 * targetArea;
        const valInsideRoot = b_quad * b_quad - 4 * a_quad * c_quad;
        if (valInsideRoot < 0) {
          alert("القيمة المدخلة تؤدي إلى شكل هندسي مستحيل. التعديل غير ممكن.");
          input.value = lastVal_bot.toFixed(4);
          return;
        }
        newTopW = (-b_quad + Math.sqrt(valInsideRoot)) / (2 * a_quad);
      }
    } else {
      newTopW = val;

      // حل لحساب newBotW للحفاظ على المساحة
      const tCurr_top = lastT_top + (newTopW / w2);
      const L_left = l1 + tCurr_top * diff_L;
      const avgL = (L_right + L_left) / 2;
      newBotW = (2 * targetArea / avgL) - newTopW;
    }

    if (newBotW < 0 || newTopW < 0) {
      alert("التعديل غير ممكن لأن العرض المقابل للشريك سيصبح سالباً للحفاظ على المساحة.");
      input.value = (type === "bottom" ? lastVal_bot : lastVal_top).toFixed(4);
      return;
    }
  } else {
    // ----------------------------------------------------
    // وضع التعديل الحر (Free Editing Mode)
    // ----------------------------------------------------
    if (type === "bottom") {
      newBotW = val;
      newTopW = lastVal_top;
    } else {
      newBotW = lastVal_bot;
      newTopW = val;
    }
  }

  // تحديد القطعة المجاورة لتعديلها
  let targetIndex = rowIndex + 1;
  if (rowIndex === rows.length - 1) {
    targetIndex = rowIndex - 1;
  }

  if (targetIndex < 0 || targetIndex >= rows.length) {
    alert("لا توجد قطعة مجاورة لتعديلها.");
    input.value = (type === "bottom" ? lastVal_bot : lastVal_top).toFixed(4);
    return;
  }

  const targetRow = rows[targetIndex];
  const targetWidthBotInput = targetRow.querySelector(".partner-width-bottom");
  const targetWidthTopInput = targetRow.querySelector(".partner-width-top");
  if (!targetWidthBotInput || !targetWidthTopInput) return;

  const targetOldBotW = parseFloat(targetWidthBotInput.value) || 0;
  const targetOldTopW = parseFloat(targetWidthTopInput.value) || 0;

  // فرق التعديل للعلوي والسفلي
  const diff_bot = newBotW - lastVal_bot;
  const diff_top = newTopW - lastVal_top;

  const targetNewBotW = targetOldBotW - diff_bot;
  const targetNewTopW = targetOldTopW - diff_top;

  if (targetNewBotW < 0 || targetNewTopW < 0) {
    alert("يمنع أن يصبح عرض أي قطعة أقل من الصفر. التعديل غير ممكن.");
    input.value = (type === "bottom" ? lastVal_bot : lastVal_top).toFixed(4);
    return;
  }

  // تطبيق التعديلات للقطعة الحالية والقطعة المجاورة
  widthBotInput.value = newBotW.toFixed(4);
  widthBotInput.setAttribute("data-last-val", newBotW.toFixed(4));

  widthTopInput.value = newTopW.toFixed(4);
  widthTopInput.setAttribute("data-last-val", newTopW.toFixed(4));
  
  targetWidthBotInput.value = targetNewBotW.toFixed(4);
  targetWidthBotInput.setAttribute("data-last-val", targetNewBotW.toFixed(4));

  targetWidthTopInput.value = targetNewTopW.toFixed(4);
  targetWidthTopInput.setAttribute("data-last-val", targetNewTopW.toFixed(4));

  // الانتقال إلى نمط التقسيم اليدوي وحساب المساحات هندسياً
  isManualPartition = true;

  // إعادة الحساب ورسم الكروكي والخطوات
  runPartition();
}

function onShareInput(input) {
  if (input) {
    const row = input.closest('.partner-row');
    if (row) delete row.dataset.exactArea;
  }
  isManualPartition = false;
  saveAndCalc();
}

/**
 * \u0628\u0646\u062f \u0633\u0627\u0628\u0639\u0627\u064b: \u062a\u062d\u0633\u064a\u0646 \u062a\u062d\u0631\u064a\u0631 \u0627\u0633\u0645 \u0627\u0644\u0634\u0631\u064a\u0643
 * \u0639\u0646\u062f \u0627\u0644\u0643\u062a\u0627\u0628\u0629 \u0641\u0642\u0637 \u0646\u062d\u0641\u0638 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u062f\u0648\u0646 \u0625\u0639\u0627\u062f\u0629 \u062d\u0633\u0627\u0628 \u0643\u0627\u0645\u0644\u0629 (\u062d\u062a\u0649 \u0644\u0627 \u064a\u064f\u0639\u064a\u062f \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062c \u0643\u062a\u0627\u0628\u0629 \u0627\u0644\u0627\u0633\u0645 \u0623\u062b\u0646\u0627\u0621 \u0627\u0644\u062a\u062d\u0631\u064a\u0631)
 */
function onPartnerNameInput(input) {
  // \u0646\u062d\u0641\u0638 \u0641\u0642\u0637 — \u0644\u0627 \u0646\u064f\u0639\u064a\u062f \u0627\u0644\u062d\u0633\u0627\u0628 \u062d\u062a\u0649 \u0644\u0627 \u064a\u0638\u0647\u0631 \u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0627\u0641\u062a\u0631\u0627\u0636\u064a \u0641\u0648\u0631 \u0645\u0633\u062d \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645
  saveData();
}

/**
 * \u0639\u0646\u062f \u0645\u063a\u0627\u062f\u0631\u0629 \u062d\u0642\u0644 \u0627\u0644\u0627\u0633\u0645:
 * - \u0625\u0630\u0627 \u0643\u0627\u0646 \u0641\u0627\u0631\u063a\u0627\u064b \u2192 \u064a\u064f\u0639\u064a\u062f \u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0627\u0641\u062a\u0631\u0627\u0636\u064a ("\u0634\u0631\u064a\u0643 N")
 * - \u0625\u0630\u0627 \u0643\u0627\u0646 \u063a\u064a\u0631 \u0641\u0627\u0631\u063a \u2192 \u064a\u062d\u0641\u0638 \u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u062c\u062f\u064a\u062f \u0643\u0645\u0627 \u0647\u0648
 */
function onPartnerNameBlur(input) {
  if (!input.value.trim()) {
    const row = input.closest('.partner-row');
    const index = parseInt(row.getAttribute("data-index")) || 0;
    input.value = `\u0634\u0631\u064a\u0643 ${index + 1}`;
  }
  saveAndCalc();
}

function updatePartnerFromInput(type, value, row) {
  if (window.isUpdatingRow) return;
  window.isUpdatingRow = true;

  try {
    ensureDimensionsAutofill();
    const l1 = parseFloat(document.getElementById("length1").value) || 0;
    const l2 = parseFloat(document.getElementById("length2").value) || 0;
    const w1 = parseFloat(document.getElementById("width1").value) || 0;
    const w2 = parseFloat(document.getElementById("width2").value) || 0;
    const w = (w1 + w2) / 2;
    const totalAreaM2 = ((l1 + l2) / 2) * w;

    if (totalAreaM2 <= 0) {
      alert("الرجاء إدخال أبعاد الأرض الإجمالية أولاً.");
      saveAndCalcImmediate();
      return;
    }

    let caratArea = parseFloat(document.getElementById("input-carat-area").value);
    if (caratArea === 0) {
      caratArea = parseFloat(document.getElementById("other-carat-area").value) || 0;
    }

    let areaVal = 0;

    if (type === "area") {
      const cleanVal = String(value).replace(/[^\d.]/g, '');
      areaVal = parseFloat(cleanVal) || 0;
    } else if (type === "percent") {
      const cleanVal = String(value).replace(/[^\d.]/g, '');
      const pctVal = parseFloat(cleanVal) || 0;
      areaVal = (pctVal / 100) * totalAreaM2;
    }

    if (areaVal < 0) areaVal = 0;

    // تحديث المصادر الأساسية للحساب (FCS أو الكسر)
    if (currentInputMethod === "carats") {
      if (caratArea > 0) {
        const totalCarats = areaVal / caratArea;
        const feddan = Math.floor(totalCarats / 24);
        const carat = Math.floor(totalCarats % 24);
        const sahm = Number(((totalCarats - (feddan * 24 + carat)) * 24).toFixed(4));
        
        const feddansInput = row.querySelector(".partner-feddans");
        const caratsInput = row.querySelector(".partner-carats");
        const sharesInput = row.querySelector(".partner-shares");
        
        if (feddansInput && document.activeElement !== feddansInput) feddansInput.value = feddan;
        if (caratsInput && document.activeElement !== caratsInput) caratsInput.value = carat;
        if (sharesInput && document.activeElement !== sharesInput) sharesInput.value = sahm;
      }
    } else {
      const fracVal = areaVal / totalAreaM2;
      const fractionInput = row.querySelector(".partner-fraction");
      if (fractionInput && document.activeElement !== fractionInput) {
        fractionInput.value = Number(fracVal.toFixed(6));
      }
    }

    // إعادة الحساب ورسم الكروكي والخطوات عبر المسار الموحد
    isManualPartition = false;
    saveAndCalc();
  } finally {
    window.isUpdatingRow = false;
  }
}

function onAreaInput(input) {
  const row = input.closest(".partner-row");
  if (!row) return;
  updatePartnerFromInput("area", input.value, row);
}

function onPercentInput(input) {
  const row = input.closest(".partner-row");
  if (!row) return;
  updatePartnerFromInput("percent", input.value, row);
}

// مستمع لتغيير حجم الشاشة لإعادة رسم وتجاوب الكروكي (مثل صفحة 13)
window.addEventListener("resize", function() {
  renderCroquis();
});

function updateRemainderRowUI(remainingArea) {
  const row = document.getElementById("remainder-row-table");
  if (!row) return;

  const isZero = Math.abs(remainingArea) < 0.15;
  const isNegative = remainingArea < -0.15;

  if (isZero || isNegative) {
    row.style.display = "none";
    // Clear inputs inside the remainder row to prevent stale values
    const inputs = row.querySelectorAll("input");
    inputs.forEach(input => {
      input.value = "-";
    });
    // Remove remainder piece from calculatedPieces in memory
    if (window.calculatedPieces) {
      window.calculatedPieces = window.calculatedPieces.filter(p => !p.isRemainder);
    }
    return;
  }

  // Show it as grid
  row.style.display = "grid";

  // Calculate inputs
  const l1 = parseFloat(document.getElementById("length1").value) || 0;
  const l2 = parseFloat(document.getElementById("length2").value) || 0;
  const w1 = parseFloat(document.getElementById("width1").value) || 0;
  const w2 = parseFloat(document.getElementById("width2").value) || 0;
  const w = (w1 + w2) / 2;
  const totalAreaM2 = ((l1 + l2) / 2) * w;

  let caratArea = parseFloat(document.getElementById("input-carat-area").value);
  if (caratArea === 0) {
    caratArea = parseFloat(document.getElementById("other-carat-area").value) || 0;
  }

  const absRem = Math.abs(remainingArea);
  const fcs = convertSquareMetersToFCS(absRem);
  const remPct = totalAreaM2 > 0 ? (absRem / totalAreaM2) * 100 : 0;

  // Try to find remainder piece in window.calculatedPieces
  let remTopW = 0, remBotW = 0, remRightL = 0, remLeftL = 0;
  let remCumWidth = "-";
  let remLengths = "-";

  if (window.calculatedPieces && window.calculatedPieces.length > 0) {
    const remPiece = window.calculatedPieces.find(p => p.isRemainder);
    if (remPiece) {
      remTopW = remPiece.topW;
      remBotW = remPiece.botW;
      remRightL = remPiece.leftLine;
      remLeftL = remPiece.divLine;
      
      // Calculate start widths (total widths of partners list)
      let partnersBotW = 0;
      let partnersTopW = 0;
      window.calculatedPieces.forEach(p => {
        if (!p.isRemainder) {
          partnersBotW += p.botW;
          partnersTopW += p.topW;
        }
      });

      remCumWidth = `من اليمين\nأعلى:\n${partnersTopW.toFixed(4)} ← ${w2.toFixed(4)} م\nأسفل:\n${partnersBotW.toFixed(4)} ← ${w1.toFixed(4)} م`;
      remLengths = `يمين: ${remRightL.toFixed(2)} | يسار: ${remLeftL.toFixed(2)}`;
    }
  }

  const remAvgW = (remTopW + remBotW) / 2;
  const remAvgL = remAvgW > 0 ? (absRem / remAvgW) : 0;
  
  const remAvgW_str = remAvgW > 0 ? remAvgW.toFixed(4) : "-";
  const remAvgL_str = remAvgL > 0 ? remAvgL.toFixed(4) : "-";

  if (currentInputMethod === "carats") {
    row.innerHTML = `
      <input type="text" class="index-group" readonly value="-" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" class="name-group" readonly value="🟡 المتبقي" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" class="share-group" readonly value="${fcs.sahm}" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" class="carat-group" readonly value="${fcs.carat}" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" class="feddan-group" readonly value="${fcs.feddan}" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" class="area-group" readonly value="${absRem.toFixed(2)}" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" class="percent-group" readonly value="${remPct.toFixed(2)}%" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" class="width-top-group" readonly value="${remTopW > 0 ? remTopW.toFixed(2) : '-'}" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" class="width-bottom-group" readonly value="${remBotW > 0 ? remBotW.toFixed(2) : '-'}" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" class="width-avg-group" readonly value="${remAvgW_str}" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" class="length-avg-group" readonly value="${remAvgL_str}" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <textarea class="cum-group partner-cum-width" readonly>${remCumWidth}</textarea>
      <input type="text" class="delete-group" readonly value="-" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
    `;
  } else {
    const fractionVal = totalAreaM2 > 0 ? (absRem / totalAreaM2) : 0;
    row.innerHTML = `
      <input type="text" class="index-group" readonly value="-" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" class="name-group" readonly value="🟡 المتبقي" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" class="fraction-group" readonly value="${fractionVal.toFixed(4)}" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" class="equiv-group" readonly value="${fcs.sahm}س، ${fcs.carat}ق، ${fcs.feddan}ف" style="font-weight: bold; background: #fffde7; color: #e65100; font-size: 11px; text-align: center;">
      <input type="text" class="area-group" readonly value="${absRem.toFixed(2)}" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" class="percent-group" readonly value="${remPct.toFixed(2)}%" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" class="width-top-group" readonly value="${remTopW > 0 ? remTopW.toFixed(2) : '-'}" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" class="width-bottom-group" readonly value="${remBotW > 0 ? remBotW.toFixed(2) : '-'}" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" class="width-avg-group" readonly value="${remAvgW_str}" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" class="length-avg-group" readonly value="${remAvgL_str}" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <textarea class="cum-group partner-cum-width" readonly>${remCumWidth}</textarea>
      <input type="text" class="delete-group" readonly value="-" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
    `;
  }

}

/* ================================================================
   ═══ دوال إعادة تقسيم الجزء المتبقي ═════════════════════════════
   ================================================================ */
function showRedistributeModal() {
  const modal = document.getElementById("redistribute-direction-modal");
  if (modal) modal.style.display = "flex";
}

function closeRedistributeModal() {
  const modal = document.getElementById("redistribute-direction-modal");
  if (modal) modal.style.display = "none";
}

function redistributeRemainder(direction) {
  if (!window.calculatedPieces) return;
  const remPiece = window.calculatedPieces.find(p => p.isRemainder);
  if (!remPiece) {
    alert("لم يتم العثور على قطعة متبقية لإعادة تقسيمها.");
    closeRedistributeModal();
    return;
  }

  let w1 = 0, w2 = 0, l1 = 0, l2 = 0;

  if (direction === "longitudinal") {
    // تقسيم طولي: الأبعاد تبقى كما هي
    w1 = remPiece.topW;    // العرض الأول (أعلى)
    w2 = remPiece.botW;    // العرض الثاني (أسفل)
    l1 = remPiece.leftLine; // الطول الأيمن
    l2 = remPiece.divLine;  // الطول الأيسر
  } else {
    // تقسيم عرضي: قلب الأبعاد (العرض يصبح طولاً والعكس)
    w1 = remPiece.leftLine; // العرض الأول (أعلى)
    w2 = remPiece.divLine;  // العرض الثاني (أسفل)
    l1 = remPiece.topW;     // الطول الأيمن
    l2 = remPiece.botW;     // الطول الأيسر
  }

  // حفظ المرحلة الحالية في السجل تلقائياً قبل الانتقال
  try {
    const l1_old = parseFloat(document.getElementById("length1").value) || 0;
    const w1_old = parseFloat(document.getElementById("width1").value) || 0;
    const w = (w1_old + (parseFloat(document.getElementById("width2").value) || 0)) / 2;
    const area = w * ((l1_old + (parseFloat(document.getElementById("length2").value) || 0)) / 2);
    
    let stageName = `مرحلة أساسية - مساحة ${area.toFixed(1)} م² (قبل تقسيم المتبقي)`;
    saveCurrentStateToHistory(stageName);
  } catch(e) {
    console.error("Auto-history save failed:", e);
  }

  // تحديث حقول الإدخال للأرض الإجمالية بالدقة الكاملة لمنع تراكم أخطاء التقريب
  document.getElementById("width1").value = w1;
  document.getElementById("width2").value = w2;
  document.getElementById("length1").value = l1;
  document.getElementById("length2").value = l2;

  // تفريغ جدول الشركاء وبدء مشروع جديد بالكامل
  const list = document.getElementById("partners-list");
  if (list) list.innerHTML = "";
  window.calculatedPieces = [];
  isPartitioned = false;
  isManualPartition = false;

  // إضافة شريك أول فارغ للمطالبة بإدخال الشركاء
  addNewPartnerRow("شريك 1");

  closeRedistributeModal();
  saveAndCalcImmediate();
}

/* ================================================================
   ═══ سجل مراحل عمليات التقسيم التاريخي ═════════════════════════
   ================================================================ */
function saveCurrentStateToHistory(description = "") {
  const l1 = parseFloat(document.getElementById("length1").value) || 0;
  const l2 = parseFloat(document.getElementById("length2").value) || 0;
  const w1 = parseFloat(document.getElementById("width1").value) || 0;
  const w2 = parseFloat(document.getElementById("width2").value) || 0;
  
  if (l1 <= 0 || l2 <= 0 || w1 <= 0 || w2 <= 0) {
    alert("لا يمكن حفظ حالة فارغة. الرجاء إدخال أبعاد الأرض أولاً.");
    return;
  }

  // Get current partners
  const partners = [];
  const rows = document.querySelectorAll("#partners-list .partner-row");
  rows.forEach(row => {
    const name = row.querySelector(".partner-name").value;
    const botW = row.querySelector(".partner-width-bottom") ? row.querySelector(".partner-width-bottom").value : "-";
    const topW = row.querySelector(".partner-width-top") ? row.querySelector(".partner-width-top").value : "-";
    
    if (currentInputMethod === "carats") {
      partners.push({
        name: name,
        feddans: row.querySelector(".partner-feddans") ? row.querySelector(".partner-feddans").value : "",
        carats: row.querySelector(".partner-carats") ? row.querySelector(".partner-carats").value : "",
        shares: row.querySelector(".partner-shares") ? row.querySelector(".partner-shares").value : "",
        fraction: "",
        botW: botW,
        topW: topW
      });
    } else {
      partners.push({
        name: name,
        feddans: "",
        carats: "",
        shares: "",
        fraction: row.querySelector(".partner-fraction") ? row.querySelector(".partner-fraction").value : "",
        botW: botW,
        topW: topW
      });
    }
  });

  const w = (w1 + w2) / 2;
  const area = ((l1 + l2) / 2) * w;

  if (!description) {
    description = prompt("أدخل اسماً أو وصفاً لهذه المرحلة (مثال: تقسيم الورثة، تقسيم المتبقي طولي...):", `مرحلة تقسيم - ${area.toFixed(1)} م²`);
    if (description === null) return; // cancel
    if (!description.trim()) {
      description = `مرحلة تقسيم - ${area.toFixed(1)} م²`;
    }
  }

  const state = {
    description: description,
    timestamp: new Date().toLocaleString("ar-EG"),
    width1: w1,
    width2: w2,
    length1: l1,
    length2: l2,
    caratArea: document.getElementById("input-carat-area").value,
    otherCaratArea: document.getElementById("other-carat-area").value,
    inputMethod: currentInputMethod,
    isPartitioned: isPartitioned,
    isManualPartition: isManualPartition,
    partitionDirection: window.PartitionDirectionManager.getDirection(),
    partners: partners
  };

  let history = [];
  try {
    const saved = localStorage.getItem("p11-history");
    if (saved) history = JSON.parse(saved);
  } catch (e) {
    history = [];
  }

  history.push(state);
  localStorage.setItem("p11-history", JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const container = document.getElementById("history-stages-list");
  if (!container) return;

  let history = [];
  try {
    const saved = localStorage.getItem("p11-history");
    if (saved) history = JSON.parse(saved);
  } catch (e) {
    history = [];
  }

  const cardContainer = document.getElementById("history-card-container");
  if (history.length === 0) {
    if (cardContainer) cardContainer.style.display = "none";
    container.innerHTML = `<p style="text-align: center; color: #888; font-style: italic; font-size: 12px; margin: 10px 0;">لا توجد مراحل مسجلة حالياً في السجل</p>`;
    return;
  }
  if (cardContainer) cardContainer.style.display = "block";

  let html = "";
  history.forEach((state, index) => {
    const totalW = (parseFloat(state.width1) + parseFloat(state.width2)) / 2;
    const totalL = (parseFloat(state.length1) + parseFloat(state.length2)) / 2;
    const area = totalW * totalL;
    
    html += `
      <div class="history-item" style="display: flex; justify-content: space-between; align-items: center; background: #f9f9f9; padding: 10px 12px; border: 1.5px solid #e0e0e0; border-radius: 8px; gap: 10px; font-size: 13px; margin-bottom: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
        <div style="display: flex; flex-direction: column; gap: 3px; flex: 1; text-align: right;">
          <strong style="color: #2e7d32;">${state.description}</strong>
          <span style="font-size: 11px; color: #666;">
            📅 ${state.timestamp} | 📐 الأبعاد: ${Number(parseFloat(state.width1).toFixed(2))} × ${Number(parseFloat(state.width2).toFixed(2))} × ${Number(parseFloat(state.length1).toFixed(2))} × ${Number(parseFloat(state.length2).toFixed(2))}
          </span>
          <span style="font-size: 11px; color: #1565c0; font-weight: bold;">
            المساحة الإجمالية: ${area.toFixed(2)} م² | عدد الشركاء: ${state.partners.length}
          </span>
        </div>
        <div style="display: flex; gap: 6px;">
          <button type="button" onclick="restoreHistoryState(${index})" style="background: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 4px; padding: 5px 10px; color: #2e7d32; cursor: pointer; font-family: Cairo, Arial, sans-serif; font-size: 11px; font-weight: bold; transition: all 0.2s;">
            استعادة ↩️
          </button>
          <button type="button" onclick="deleteHistoryState(${index})" style="background: #ffebee; border: 1px solid #ffcdd2; border-radius: 4px; padding: 5px 8px; color: #c62828; cursor: pointer; transition: all 0.2s; font-weight: bold;">
            حذف 🗑️
          </button>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

function restoreHistoryState(index) {
  let history = [];
  try {
    const saved = localStorage.getItem("p11-history");
    if (saved) history = JSON.parse(saved);
  } catch (e) {
    return;
  }

  const state = history[index];
  if (!state) return;

  if (!confirm(`هل أنت متأكد من استعادة هذه المرحلة؟ (سيتم استبدال البيانات الحالية بـ: ${state.description})`)) {
    return;
  }

  // Restore main inputs
  document.getElementById("length1").value = state.length1;
  document.getElementById("length2").value = state.length2;
  document.getElementById("width1").value = state.width1;
  document.getElementById("width2").value = state.width2;
  document.getElementById("input-carat-area").value = state.caratArea;
  document.getElementById("other-carat-area").value = state.otherCaratArea;
  document.getElementById("share-input-method").value = state.inputMethod;

  if (state.partitionDirection) {
    window.PartitionDirectionManager.setDirection(state.partitionDirection);
  } else {
    window.PartitionDirectionManager.setDirection("RTL");
  }

  currentInputMethod = state.inputMethod;
  isPartitioned = state.isPartitioned;
  isManualPartition = state.isManualPartition;

  // Restore partners
  renderHeaderAndFooter();
  const list = document.getElementById("partners-list");
  list.innerHTML = "";
  
  state.partners.forEach(p => {
    addNewPartnerRow(p.name, p.feddans, p.carats, p.shares, p.fraction, p.botW, p.topW);
  });

  saveAndCalcImmediate();
}

function deleteHistoryState(index) {
  let history = [];
  try {
    const saved = localStorage.getItem("p11-history");
    if (saved) history = JSON.parse(saved);
  } catch (e) {
    return;
  }

  if (confirm("هل تريد حذف هذه المرحلة من السجل؟")) {
    history.splice(index, 1);
    localStorage.setItem("p11-history", JSON.stringify(history));
    renderHistory();
  }
}

function clearHistory() {
  if (confirm("🚨 هل أنت متأكد من مسح السجل بالكامل؟ لا يمكن التراجع عن هذا الإجراء.")) {
    localStorage.removeItem("p11-history");
    renderHistory();
  }
}

function convertSquareMetersToFCS(area) {
  let caratArea = parseFloat(document.getElementById("input-carat-area").value);
  if (caratArea === 0) {
    caratArea = parseFloat(document.getElementById("other-carat-area").value) || 0;
  }
  if (caratArea <= 0) {
    return { feddan: 0, carat: 0, sahm: 0 };
  }
  return AgriUnitsCompat.sqmToFCS(area, caratArea);
}


/**
 * بند خامساً: تطبيع وحدات الفدان والقيراط والسهم عند إدخال المستخدم
 * 24 سهم = 1 قيراط | 24 قيراط = 1 فدان
 * تُستدعى عند blur من حقول السهم/القيراط/الفدان
 */
function normalizeInputFCS(input) {
  const row = input.closest('.partner-row');
  if (!row) return;
  
  const sInput = row.querySelector(".partner-shares");
  const cInput = row.querySelector(".partner-carats");
  const fInput = row.querySelector(".partner-feddans");
  
  let s = parseFloat(sInput?.value) || 0;
  let c = parseFloat(cInput?.value) || 0;
  let f = parseFloat(fInput?.value) || 0;
  
  let normalized = AgriUnitsCompat.normalizeFCS(f, c, s);
  
  f = normalized.feddan;
  c = normalized.carat;
  s = normalized.sahm;
  
  // تحديث الحقول فقط إذا تغيرت القيم
  if (sInput && document.activeElement !== sInput) sInput.value = s > 0 ? s : (s === 0 && sInput.value ? "0" : "");
  if (cInput && document.activeElement !== cInput) cInput.value = c > 0 ? c : (c === 0 && cInput.value ? "0" : "");
  if (fInput && document.activeElement !== fInput) fInput.value = f > 0 ? f : (f === 0 && fInput.value ? "0" : "");
  
  // إعادة الحساب بعد التطبيع
  saveAndCalc();
}


function updateTableTotals() {
  console.log("Trace: updateTableTotals start");
  try {
    const rows = document.querySelectorAll("#partners-list .partner-row");
  const remRow = document.getElementById("remainder-row-table");
  const isRemVisible = remRow && remRow.style.display !== "none" && remRow.style.display !== "";
  
  let totalArea = 0;
  
  // 1. Calculate Area Sum
  rows.forEach(row => {
    const areaInput = row.querySelector(".partner-area");
    if (areaInput) {
      totalArea += parseFloat(areaInput.value) || 0;
    }
  });
  
  if (isRemVisible) {
    const inputs = remRow.querySelectorAll("input");
    if (inputs.length >= 7) {
      totalArea += parseFloat(inputs[5].value) || 0;
    }
  }
  
  // Update Area Total
  const totalAreaEl = document.getElementById("total-area-distributed");
  if (totalAreaEl) {
    totalAreaEl.value = Number(totalArea.toFixed(2));
  }
  
  // Calculate totalAreaM2
  const l1 = parseFloat(document.getElementById("length1").value) || 0;
  const l2 = parseFloat(document.getElementById("length2").value) || 0;
  const w1 = parseFloat(document.getElementById("width1").value) || 0;
  const w2 = parseFloat(document.getElementById("width2").value) || 0;
  const w = (w1 + w2) / 2;
  const totalAreaM2 = ((l1 + l2) / 2) * w;
  
  // Update Percentage Total
  const totalPctEl = document.getElementById("total-percent-distributed");
  if (totalPctEl) {
    const totalPct = totalAreaM2 > 0 ? (totalArea / totalAreaM2) * 100 : 0;
    totalPctEl.value = Number(totalPct.toFixed(2)) + " %";
  }
  
  // 2. Calculate Shares or Fraction Sum
  if (currentInputMethod === "carats") {
    const fcs = convertSquareMetersToFCS(totalArea);
    
    const sharesEl = document.getElementById("total-shares-entered");
    const caratsEl = document.getElementById("total-carats-entered");
    const feddansEl = document.getElementById("total-feddans-entered");
    
    if (sharesEl) sharesEl.value = fcs.sahm;
    if (caratsEl) caratsEl.value = fcs.carat;
    if (feddansEl) feddansEl.value = fcs.feddan;
  } else {
    let totalFraction = 0;
    rows.forEach(row => {
      const fracInput = row.querySelector(".partner-fraction");
      totalFraction += parseFraction(fracInput ? fracInput.value : "");
    });
    
    if (isRemVisible) {
      const inputs = remRow.querySelectorAll("input");
      if (inputs.length >= 3) {
        totalFraction += parseFloat(inputs[2].value) || 0;
      }
    }
    
    const fractionEl = document.getElementById("total-fraction-entered");
    if (fractionEl) {
      fractionEl.value = Number((totalFraction * 100).toFixed(2)) + "%";
    }
  }
  
  // 3. Width Totals (Bottom & Top calculated)
  let totalBotWidth = 0;
  let totalTopWidth = 0;
  
  if (isManualPartition) {
    rows.forEach(row => {
      const botEl = row.querySelector(".partner-width-bottom");
      const topEl = row.querySelector(".partner-width-top");
      totalBotWidth += parseFloat(botEl ? botEl.value : 0) || 0;
      totalTopWidth += parseFloat(topEl ? topEl.value : 0) || 0;
    });
    
    if (isRemVisible) {
      const inputs = remRow.querySelectorAll("input");
      if (inputs.length >= 9) {
        totalBotWidth += parseFloat(inputs[7].value) || 0;
        totalTopWidth += parseFloat(inputs[8].value) || 0;
      }
    }
    
    const botWidthEl = document.getElementById("total-width-bottom-calculated");
    const topWidthEl = document.getElementById("total-width-top-calculated");
    
    if (botWidthEl) botWidthEl.value = totalBotWidth.toFixed(4);
    if (topWidthEl) topWidthEl.value = totalTopWidth.toFixed(4);
  } else {
    const botWidthEl = document.getElementById("total-width-bottom-calculated");
    const topWidthEl = document.getElementById("total-width-top-calculated");
    
    if (botWidthEl) botWidthEl.value = "-";
    if (topWidthEl) topWidthEl.value = "-";
  }
  } catch (e) {
    console.error("Error in updateTableTotals:", e);
  }
}

function updateTableRowsUI() {
  console.log("Trace: updateTableRowsUI start");
  try {
    const isLTR = window.PartitionDirectionManager.isLTR();
    const rows = Array.from(document.querySelectorAll("#partners-list .partner-row"));
    const activeRows = rows.filter(row => !isPartnerRowExcluded(row));
    const totalActive = activeRows.length;

    const w1 = parseFloat(document.getElementById("width1").value) || 0;
    const w2 = parseFloat(document.getElementById("width2").value) || 0;

    rows.forEach((row, index) => {
      // 1. CSS order
      row.style.order = isLTR ? (rows.length - index) : index;

      // 2. Display Index ("م")
      const indexInput = row.querySelector(".partner-index");
      if (indexInput) {
        if (isPartnerRowExcluded(row)) {
          indexInput.value = "-";
        } else {
          const activeIndex = activeRows.indexOf(row);
          const displayIdx = isLTR ? (totalActive - activeIndex) : (activeIndex + 1);
          indexInput.value = ((isLTR && activeIndex === totalActive - 1) || (!isLTR && activeIndex === 0))
            ? "1 🏁"
            : displayIdx;
        }
      }

      if (isPartnerRowExcluded(row)) return;

      const activeIndex = activeRows.indexOf(row);
      const piece = window.calculatedPieces ? window.calculatedPieces[activeIndex] : null;
      if (piece) {
        // 3. Cumulative Width
        const cumWidthInput = row.querySelector(".partner-cum-width");
        if (cumWidthInput) {
          const tPrevTop = parseFloat(piece.tPrev_top) || 0;
          const tCurrTop = parseFloat(piece.tCurr_top) || 0;
          const tPrevBot = parseFloat(piece.tPrev_bot) || 0;
          const tCurrBot = parseFloat(piece.tCurr_bot) || 0;

          if (isLTR) {
            const topStart = (1.0 - tCurrTop) * w2;
            const topEnd = (1.0 - tPrevTop) * w2;
            const botStart = (1.0 - tCurrBot) * w1;
            const botEnd = (1.0 - tPrevBot) * w1;
            cumWidthInput.value = `من اليسار\nأعلى:\n${topStart.toFixed(4)} → ${topEnd.toFixed(4)} م\nأسفل:\n${botStart.toFixed(4)} → ${botEnd.toFixed(4)} م`;
          } else {
            const topStart = tPrevTop * w2;
            const topEnd = tCurrTop * w2;
            const botStart = tPrevBot * w1;
            const botEnd = tCurrBot * w1;
            cumWidthInput.value = `من اليمين\nأعلى:\n${topStart.toFixed(4)} → ${topEnd.toFixed(4)} م\nأسفل:\n${botStart.toFixed(4)} → ${botEnd.toFixed(4)} م`;
          }
        }

        // 4. Divider Line
        const divLineInput = row.querySelector(".partner-div-line");
        if (divLineInput) {
          const leftLine = parseFloat(piece.leftLine) || 0;
          const divLine = parseFloat(piece.divLine) || 0;
          if (isLTR) {
            divLineInput.value = `يسار: ${divLine.toFixed(4)} م | يمين: ${leftLine.toFixed(4)} م`;
          } else {
            divLineInput.value = `يمين: ${leftLine.toFixed(4)} م | يسار: ${divLine.toFixed(4)} م`;
          }
        }
      }
    });

    // Also update remainder row cumulative fields
    const remRow = document.getElementById("remainder-row-table");
    if (remRow && remRow.style.display !== "none") {
      const remPiece = window.calculatedPieces ? window.calculatedPieces.find(p => p.isRemainder) : null;
      if (remPiece) {
        const inputs = remRow.querySelectorAll("input, textarea");
        if (inputs.length >= 11) {
          const tPrevTop = parseFloat(remPiece.tPrev_top) || 0;
          const tCurrTop = parseFloat(remPiece.tCurr_top) || 0;
          const tPrevBot = parseFloat(remPiece.tPrev_bot) || 0;
          const tCurrBot = parseFloat(remPiece.tCurr_bot) || 0;

          if (isLTR) {
            const topStart = (1.0 - tCurrTop) * w2;
            const topEnd = (1.0 - tPrevTop) * w2;
            const botStart = (1.0 - tCurrBot) * w1;
            const botEnd = (1.0 - tPrevBot) * w1;
            inputs[9].value = `من اليسار\nأعلى:\n${topStart.toFixed(4)} → ${topEnd.toFixed(4)} م\nأسفل:\n${botStart.toFixed(4)} → ${botEnd.toFixed(4)} م`;
            inputs[10].value = `يسار: ${remPiece.divLine.toFixed(4)} م | يمين: ${remPiece.leftLine.toFixed(4)} م`;
          } else {
            const topStart = tPrevTop * w2;
            const topEnd = tCurrTop * w2;
            const botStart = tPrevBot * w1;
            const botEnd = tCurrBot * w1;
            inputs[9].value = `من اليمين\nأعلى:\n${topStart.toFixed(4)} → ${topEnd.toFixed(4)} م\nأسفل:\n${botStart.toFixed(4)} → ${botEnd.toFixed(4)} م`;
            inputs[10].value = `يمين: ${remPiece.leftLine.toFixed(4)} م | يسار: ${remPiece.divLine.toFixed(4)} م`;
          }
        }
      }
    }
  } catch (e) {
    console.error("Error in updateTableRowsUI:", e);
  }
}

function openWidthModeHelpModal() {
  const modal = document.getElementById("width-mode-help-modal");
  if (modal) modal.style.display = "flex";
}

function closeWidthModeHelpModal() {
  const modal = document.getElementById("width-mode-help-modal");
  if (modal) modal.style.display = "none";
}

function updateWidthModeDescription() {
  const descEl = document.getElementById("manual-width-mode-desc");
  if (!descEl) return;
  const isKeepArea = document.getElementById("mode-keep-area") && document.getElementById("mode-keep-area").checked;
  if (isKeepArea) {
    descEl.innerHTML = `<span style="color: #2e7d32;">🟢 الحفاظ على مساحة الشريك:</span> سيحسب البرنامج العرض الآخر تلقائياً مع الحفاظ على نفس المساحة.`;
  } else {
    descEl.innerHTML = `<span style="color: #e65100;">🟠 التعديل الحر:</span> سيتم تعديل مساحة الشريك ونسبته وإعادة حساب التقسيم.`;
  }
}

function openStepSizeHelpModal() {
  const modal = document.getElementById("step-size-help-modal");
  if (modal) modal.style.display = "flex";
}

function closeStepSizeHelpModal() {
  const modal = document.getElementById("step-size-help-modal");
  if (modal) modal.style.display = "none";
}

function onStepValueChange(input) {
  const val = parseFloat(input.value);
  if (isNaN(val) || val <= 0) {
    input.value = "0.05";
  } else if (val > 5) {
    alert("⚠️ خطوة التعديل كبيرة جداً (أكثر من 5 م) وقد تؤدي إلى نتائج غير متوقعة.\nتم تصحيح القيمة إلى 5.00 م.");
    input.value = "5.00";
  }
  saveData();
}

function resetStepValue() {
  const input = document.getElementById("width-step-value");
  if (input) {
    input.value = "0.05";
    saveData();
    // تأثير بصري مرتد
    input.style.borderColor = "#2e7d32";
    input.style.boxShadow = "0 0 0 2px rgba(46,125,50,0.25)";
    setTimeout(() => {
      input.style.borderColor = "";
      input.style.boxShadow = "";
    }, 800);
  }
}

// ============================================================
// INTERACTIVE CAD INSPECTOR & BI-DIRECTIONAL HIGHLIGHTS HELPERS
// ============================================================

window.selectedSegmentIndex = null;

function highlightSegment(index) {
  // 1. تسليط الضوء على المضلع في SVG
  const poly = document.getElementById(`croquis-poly-${index}`);
  if (poly) {
    poly.classList.add("polygon-highlight");
  }
  
  // 2. تسليط الضوء على صف الشريك المقابل في الجدول
  const row = document.querySelector(`#partners-list .partner-row[data-index="${index}"]`);
  if (row) {
    row.classList.add("partner-row-highlighted");
  }
  
  // 3. تحديث المفتش التفاعلي بالبيانات الكاملة للقطعة
  updateInspector(index);

  // 4. تسليط الضوء على صف الفاصل في الدليل الحقلي الذكي (إذا كان مفتوحاً)
  const guideRow = document.querySelector(`.fh-guide-divider-row[data-partner-index="${index}"]`);
  if (guideRow) {
    document.querySelectorAll(".fh-guide-divider-row").forEach(r => r.classList.remove("fh-guide-divider-row-highlighted"));
    guideRow.classList.add("fh-guide-divider-row-highlighted");
    guideRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function removeHighlight() {
  // 1. إزالة التوهج من جميع المضلعات
  document.querySelectorAll(".polygon-segment").forEach(p => {
    p.classList.remove("polygon-highlight");
  });
  
  // 2. إزالة الإضاءة من جميع صفوف الجدول
  document.querySelectorAll("#partners-list .partner-row").forEach(r => {
    r.classList.remove("partner-row-highlighted");
  });

  // 3. إزالة الإضاءة من صفوف الدليل الحقلي الذكي
  document.querySelectorAll(".fh-guide-divider-row").forEach(r => {
    r.classList.remove("fh-guide-divider-row-highlighted");
  });
  
  // 4. إذا كان هناك شريك محدد مسبقاً بالنقر، نعيد تحديث المفتش لعرض بياناته
  if (window.selectedSegmentIndex !== null) {
    updateInspector(window.selectedSegmentIndex);
    
    // إعادة التوهج للقطعة المحددة والصف المحدد
    const poly = document.getElementById(`croquis-poly-${window.selectedSegmentIndex}`);
    if (poly) poly.classList.add("polygon-highlight");
    
    const row = document.querySelector(`#partners-list .partner-row[data-index="${window.selectedSegmentIndex}"]`);
    if (row) row.classList.add("partner-row-highlighted");

    const guideRow = document.querySelector(`.fh-guide-divider-row[data-partner-index="${window.selectedSegmentIndex}"]`);
    if (guideRow) {
      guideRow.classList.add("fh-guide-divider-row-highlighted");
    }
  } else {
    // إذا لم يكن هناك تحديد، نخفي المفتش
    const inspector = document.getElementById("croquis-inspector");
    if (inspector) inspector.style.display = "none";
  }
}

function selectSegment(index, event) {
  if (event) {
    event.stopPropagation();
  }
  
  // إذا كان القطعة المحددة هي نفسها، نقوم بإلغاء التحديد عند النقر الثاني
  if (window.selectedSegmentIndex === index) {
    window.selectedSegmentIndex = null;
    removeHighlight();
    return;
  }
  
  window.selectedSegmentIndex = index;
  highlightSegment(index);
  
  // تمرير صف الجدول ليكون مرئياً للمستخدم
  const row = document.querySelector(`#partners-list .partner-row[data-index="${index}"]`);
  if (row) {
    row.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function closeInspector(event) {
  if (event) {
    event.stopPropagation();
  }
  window.selectedSegmentIndex = null;
  removeHighlight();
}

function updateInspector(index) {
  if (!window.calculatedPieces || !window.calculatedPieces[index]) return;
  
  const piece = window.calculatedPieces[index];
  const isRem = piece.isRemainder;
  
  const inspector = document.getElementById("croquis-inspector");
  const partnerNameEl = document.getElementById("inspector-partner-name");
  const insAreaEl = document.getElementById("ins-area");
  const insDimensionsFormulaEl = document.getElementById("ins-dimensions-formula");
  const insRoundingDiffEl = document.getElementById("ins-rounding-diff");
  const insPercentEl = document.getElementById("ins-percent");
  const insWBottomEl = document.getElementById("ins-w-bottom");
  const insWTopEl = document.getElementById("ins-w-top");
  const insLengthRightEl = document.getElementById("ins-length-right");
  const insLengthLeftEl = document.getElementById("ins-length-left");
  const insDividerRow = document.getElementById("ins-divider-row");
  const insDividerEl = document.getElementById("ins-divider");
  
  if (!inspector) return;
  
  // تعبئة البيانات
  if (partnerNameEl) {
    partnerNameEl.innerText = isRem ? "القطعة المتبقية" : `قطعة الشريك: ${piece.name}`;
    partnerNameEl.style.color = isRem ? "#ffb300" : "#ffffff";
  }
  
  // المساحة الكلية للأرض
  const l1 = parseFloat(document.getElementById("length1").value) || 0;
  const l2 = parseFloat(document.getElementById("length2").value) || 0;
  const w1 = parseFloat(document.getElementById("width1").value) || 0;
  const w2 = parseFloat(document.getElementById("width2").value) || 0;
  const totalAreaM2 = ((l1 + l2) / 2) * ((w1 + w2) / 2);
  const pct = totalAreaM2 > 0 ? (piece.area / totalAreaM2) * 100 : 0;
  
  const fcs = convertSquareMetersToFCS(piece.area);
  
  if (insAreaEl) {
    insAreaEl.innerHTML = `${Number(piece.area.toFixed(2))} م² <br><span style="font-size: 10.5px; color: #1565c0; font-weight: normal;">(${fcs.feddan} فدان، ${fcs.carat} ق، ${fcs.sahm} س)</span>`;
  }
  
  // حساب متوسط العرض ومتوسط الطول بدقة كاملة وعرض المعادلة وفرق التقريب
  // avgW مخزن مباشرة في piece.width كمتوسط حقيقي لعرض القطعة
  // avgL = المساحة الحقيقية / متوسط العرض (يعطي متوسط الطول الدقيق)
  const avgW = piece.width; // (piece.botW + piece.topW) / 2
  const avgL = piece.width > 0 ? piece.area / piece.width : 0;
  const areaUnrounded = avgW * avgL; // = piece.area بالضبط
  const roundingDiff = piece.area - Number(piece.area.toFixed(2));

  if (insDimensionsFormulaEl) {
    insDimensionsFormulaEl.innerHTML = `${avgW.toFixed(4)} م × ${avgL.toFixed(4)} م = ${areaUnrounded.toFixed(4)} م²`;
  }
  
  if (insRoundingDiffEl) {
    const absDiff = Math.abs(roundingDiff);
    const isAccurate = absDiff < 0.01;
    insRoundingDiffEl.innerHTML = `${absDiff.toFixed(4)} م² ${isAccurate ? '<span style="color:#2e7d32;font-weight:bold;">✔ العلاقة الهندسية صحيحة</span>' : '<span style="color:#c62828;">⚠ فرق ملحوظ</span>'}`;
  }
  
  if (insPercentEl) {
    insPercentEl.innerText = `${pct.toFixed(2)} %`;
  }
  
  // العرض الأول (أعلى) يمثل topW والعرض الثاني (أسفل) يمثل botW
  if (insWBottomEl) {
    insWBottomEl.innerText = `${piece.botW.toFixed(2)} م`;
  }
  
  if (insWTopEl) {
    insWTopEl.innerText = `${piece.topW.toFixed(2)} م`;
  }
  
  if (insLengthRightEl) {
    insLengthRightEl.innerText = `${piece.leftLine.toFixed(2)} م`; // leftLine in data represents right border length of piece
  }
  
  if (insLengthLeftEl) {
    insLengthLeftEl.innerText = `${piece.divLine.toFixed(2)} م`; // divLine represents left border length of piece
  }
  
  // طول الفاصل (إذا لم تكن القطعة الأخيرة)
  if (index < window.calculatedPieces.length - 1 && !isRem) {
    if (insDividerRow) insDividerRow.style.display = "flex";
    if (insDividerEl) insDividerEl.innerText = `${piece.divLine.toFixed(2)} م`;
  } else {
    if (insDividerRow) insDividerRow.style.display = "none";
  }
  
  // إظهار المفتش
  inspector.style.display = "block";
}

let isAnimScriptsLoaded = false;
let isAnimScriptsLoading = false;

function openAnimationSimulation() {
  if (!window.calculatedPieces || window.calculatedPieces.length === 0) {
    alert("يرجى حساب وتقسيم الأرض أولاً قبل تشغيل شرح التنفيذ.");
    return;
  }
  
  const w1Val = parseFloat(document.getElementById("width1").value) || 0;
  const w2Val = parseFloat(document.getElementById("width2").value) || 0;
  const l1Val = parseFloat(document.getElementById("length1").value) || 0;
  const l2Val = parseFloat(document.getElementById("length2").value) || 0;
  
  if (w1Val <= 0 || w2Val <= 0 || l1Val <= 0 || l2Val <= 0) {
    alert("يرجى إدخال أبعاد الأرض الأربعة بشكل صحيح أولاً!");
    return;
  }
  
  const landData = {
    w: (w1Val + w2Val) / 2,
    w1: w1Val,
    w2: w2Val,
    l1: l1Val,
    l2: l2Val
  };
  
  if (isAnimScriptsLoaded) {
    window.AnimationController.start(landData, window.calculatedPieces);
    return;
  }
  
  if (isAnimScriptsLoading) return;
  isAnimScriptsLoading = true;
  
  // تحديث نص الأزرار مؤقتاً لتوفير تجربة مستخدم ممتازة
  const btns = document.querySelectorAll("button[onclick='openAnimationSimulation()'], button[onclick='openAnimationSimulationFromGuide()']");
  btns.forEach(btn => {
    btn.setAttribute("data-orig-text", btn.innerHTML);
    btn.innerHTML = "⏳ جاري تحميل المحاكاة...";
    btn.disabled = true;
  });
  
  const scripts = [
    "../animation/animation-assets.js",
    "../animation/animation-utils.js",
    "../animation/animation-engine.js",
    "../animation/animation-renderer.js",
    "../animation/animation-controller.js"
  ];
  
  function loadNextScript(index) {
    if (index >= scripts.length) {
      isAnimScriptsLoaded = true;
      isAnimScriptsLoading = false;
      
      btns.forEach(btn => {
        btn.innerHTML = btn.getAttribute("data-orig-text") || "🎬 شرح التنفيذ";
        btn.disabled = false;
      });
      
      window.AnimationController.start(landData, window.calculatedPieces);
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

// ربط الدالة بـ window لضمان وصول أحداث الـ HTML إليها في كافة ظروف التحميل
window.openAnimationSimulation = openAnimationSimulation;


// ---------------------------------------------------------
// نظام القسم المنسدل للإعدادات (Settings Accordion)
// ---------------------------------------------------------
function toggleSettingsAccordion() {
  const content = document.getElementById("settings-accordion-content");
  const arrow = document.getElementById("accordion-arrow");
  const trigger = document.getElementById("settings-accordion-trigger");
  if (!content || !arrow || !trigger) return;

  const isOpen = content.classList.contains("open");
  
  if (isOpen) {
    // إغلاق القسم المنسدل
    content.style.maxHeight = content.scrollHeight + "px";
    content.offsetHeight; // إعادة الحساب الموقعي
    content.style.maxHeight = "0px";
    content.style.opacity = "0";
    arrow.style.transform = "rotate(0deg)";
    trigger.style.borderRadius = "8px";
    content.classList.remove("open");
    
    // حفظ التفضيلات باستخدام طبقة التخزين الموحدة (التي تتكفل تلقائياً بالتوافق المزدوج)
    if (window.DallalStorage) {
      DallalStorage.local.setItem("settings_accordion_open", "false");
    } else {
      localStorage.setItem("settings-accordion-open", "false");
    }
  } else {
    // فتح القسم المنسدل
    content.style.maxHeight = content.scrollHeight + "px";
    content.style.opacity = "1";
    arrow.style.transform = "rotate(180deg)";
    trigger.style.borderRadius = "8px 8px 0 0";
    content.classList.add("open");
    
    if (window.DallalStorage) {
      DallalStorage.local.setItem("settings_accordion_open", "true");
    } else {
      localStorage.setItem("settings-accordion-open", "true");
    }
  }
}

function initSettingsAccordion() {
  const content = document.getElementById("settings-accordion-content");
  const arrow = document.getElementById("accordion-arrow");
  const trigger = document.getElementById("settings-accordion-trigger");
  if (!content || !arrow || !trigger) return;

  let isOpen = false;
  if (window.DallalStorage) {
    // مكتبة التخزين تتكفل بالبحث في المفاتيح القديمة والترحيل تلقائياً
    const stored = DallalStorage.local.getItem("settings_accordion_open");
    isOpen = (stored === "true" || stored === true);
  } else {
    isOpen = (localStorage.getItem("settings-accordion-open") === "true");
  }
  if (isOpen) {
    content.style.maxHeight = "none";
    content.style.opacity = "1";
    arrow.style.transform = "rotate(180deg)";
    trigger.style.borderRadius = "8px 8px 0 0";
    content.classList.add("open");
  } else {
    content.style.maxHeight = "0px";
    content.style.opacity = "0";
    arrow.style.transform = "rotate(0deg)";
    trigger.style.borderRadius = "8px";
    content.classList.remove("open");
  }
}

window.toggleSettingsAccordion = toggleSettingsAccordion;
window.initSettingsAccordion = initSettingsAccordion;


/* ================================================================
   إدارة اتجاهات الحدود (بحري / قبلي / شرقي / غربي)
   مطابقة للمنطق الموجود في صفحة رسم وتقسيم الأراضي (Page12)
   ================================================================ */

/**
 * الأزواج المتقابلة: كل اتجاه وله اتجاهه المقابل
 */
const P11_OPPOSITE = {
  "بحري": "قبلي",
  "قبلي": "بحري",
  "شرقي": "غربي",
  "غربي": "شرقي"
};

/**
 * قوائم الاتجاهات المنسدلة: العروض متقابلة فيما بينها، والأطوال متقابلة فيما بينها
 * - العروض: p11-w2-dir (أعلى C) ↔ p11-w1-dir (أسفل A)
 * - الأطوال: p11-l1-dir (أيمن D) ↔ p11-l2-dir (أيسر B)
 */
const P11_PAIRED = {
  "p11-w2-dir": "p11-w1-dir",
  "p11-w1-dir": "p11-w2-dir",
  "p11-l1-dir": "p11-l2-dir",
  "p11-l2-dir": "p11-l1-dir"
};

/**
 * handleP11DirectionChange - معالجة تغيير اتجاه الضلع مع التبديل التلقائي للضلع المقابل
 *
 * @description يضمن أن الاتجاهات دائمًا متقابلة ومنطقية:
 *              - شرقي ↔ غربي (للأطوال)
 *              - بحري ↔ قبلي (للعروض)
 *              عند تغيير أي اتجاه يُحدَّث الاتجاه المقابل تلقائياً.
 *
 * @param {string} changedId - معرف القائمة المنسدلة التي تم تغييرها
 */
function handleP11DirectionChange(changedId) {
  const selectEl = document.getElementById(changedId);
  if (!selectEl) return;

  const newVal = selectEl.value.trim();

  // تحديد القائمة المقابلة وتحديثها تلقائياً بالاتجاه المعاكس
  const pairedId = P11_PAIRED[changedId];
  if (pairedId) {
    const pairedEl = document.getElementById(pairedId);
    if (pairedEl) {
      const oppositeVal = P11_OPPOSITE[newVal];
      if (oppositeVal && pairedEl.value !== oppositeVal) {
        pairedEl.value = oppositeVal;
        p11LastDirections[pairedId] = oppositeVal;
      }
    }
  }

  p11LastDirections[changedId] = newVal;

  // حفظ الاتجاهات الجديدة
  const dirIds = ["p11-w2-dir", "p11-w1-dir", "p11-l1-dir", "p11-l2-dir"];
  dirIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) localStorage.setItem("p11-dir-" + id, el.value);
  });

  // تحديث الكروكي وجدول التحويلات إن وُجدت بيانات
  if (typeof renderCroquis === "function") {
    renderCroquis();
  }
  if (typeof updateConversionsTable === "function") {
    updateConversionsTable();
  }
}

/**
 * resetP11DirectionsToDefault - إعادة جميع الاتجاهات للوضع الافتراضي
 * الافتراضي: شرقي (أعلى)، غربي (أسفل)، قبلي (أيمن)، بحري (أيسر)
 */
function resetP11DirectionsToDefault() {
  const defaults = {
    "p11-w2-dir": "شرقي",
    "p11-w1-dir": "غربي",
    "p11-l1-dir": "قبلي",
    "p11-l2-dir": "بحري"
  };

  Object.keys(defaults).forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.value = defaults[id];
      p11LastDirections[id] = defaults[id];
      localStorage.setItem("p11-dir-" + id, defaults[id]);
    }
  });

  if (typeof renderCroquis === "function") {
    renderCroquis();
  }
  if (typeof updateConversionsTable === "function") {
    updateConversionsTable();
  }
}

/**
 * getP11Directions - الحصول على قيم الاتجاهات الحالية كـ object
 * يُستخدم داخل renderCroquis لعرض الاتجاهات على الكروكي
 */
function getP11Directions() {
  return {
    top:    (document.getElementById("p11-w2-dir") || {}).value || "بحري",   // العرض الأول (أعلى C)
    bottom: (document.getElementById("p11-w1-dir") || {}).value || "قبلي",  // العرض الثاني (أسفل A)
    right:  (document.getElementById("p11-l1-dir") || {}).value || "شرقي",  // الطول الأيمن (D)
    left:   (document.getElementById("p11-l2-dir") || {}).value || "غربي"   // الطول الأيسر (B)
  };
}

// تصدير الدوال للنطاق العالمي
window.handleP11DirectionChange = handleP11DirectionChange;
window.resetP11DirectionsToDefault = resetP11DirectionsToDefault;
window.getP11Directions = getP11Directions;

