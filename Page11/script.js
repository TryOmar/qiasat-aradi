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

Object.defineProperty(window, 'isPartitioned', {
  get: () => isPartitioned,
  set: (v) => { isPartitioned = v; }
});
Object.defineProperty(window, 'isManualPartition', {
  get: () => isManualPartition,
  set: (v) => { isManualPartition = v; }
});

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
let isFullscreen = false;

document.addEventListener("DOMContentLoaded", function () {
  loadData();
  updateWidthModeDescription();
  
  // Set up event listeners
  const list = document.getElementById("partners-list");
  if (list.children.length === 0) {
    addNewPartnerRow("شريك 1");
  }
  renderHeaderAndFooter();
  calculateGeneral();
  if (isPartitioned) {
    runPartition();
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

// تبديل وضع ملء الشاشة
function toggleFullscreenCroquis() {
  const card = document.getElementById("canvas-container");
  const btnText = document.getElementById("btn-fullscreen-text");
  if (!card) return;
  
  isFullscreen = !isFullscreen;
  
  if (isFullscreen) {
    card.classList.add("croquis-fullscreen-mode");
    if (btnText) btnText.innerText = "إنهاء ملء الشاشة";
    document.body.style.overflow = "hidden";
  } else {
    card.classList.remove("croquis-fullscreen-mode");
    if (btnText) btnText.innerText = "ملء الشاشة";
    document.body.style.overflow = "";
  }
  
  setTimeout(fitCroquis, 300);
}

// خروج من الشاشة الكاملة بالضغط على Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && isFullscreen) {
    toggleFullscreenCroquis();
  }
});



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
      partners.forEach(p => {
        addNewPartnerRow(p.name, p.feddans, p.carats, p.shares, p.fraction, p.botW || "-", p.topW || "-");
      });
    } catch (e) {
      console.error("Error parsing saved partners", e);
    }
  } else {
    addNewPartnerRow("شريك 1");
  }

  isPartitioned = (localStorage.getItem("p11-is-partitioned") === "true");
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
      <p>م</p>
      <p>الشريك</p>
      <p>سهم</p>
      <p>قيراط</p>
      <p>فدان</p>
      <p>المساحة (م²)</p>
      <p>النسبة (%)</p>
      <p>العرض الأول (أعلى)</p>
      <p>العرض الثاني (أسفل)</p>
      <p>العلامة (م)</p>
      <p>الفاصل (م)</p>
      <p></p>
    `;
    
    footerContainer.innerHTML = `
      <input type="text" readonly value="-" style="font-weight: bold; background: #222; color: white;">
      <input type="text" readonly value="الإجمالي" style="font-weight: bold; background: #222; color: white;">
      <input type="text" id="total-shares-entered" readonly value="0" style="font-weight: bold; background: #222; color: white;">
      <input type="text" id="total-carats-entered" readonly value="0" style="font-weight: bold; background: #222; color: white;">
      <input type="text" id="total-feddans-entered" readonly value="0" style="font-weight: bold; background: #222; color: white;">
      <input type="text" id="total-area-distributed" readonly value="0" style="font-weight: bold; background: #222; color: white;">
      <input type="text" id="total-percent-distributed" readonly value="0%" style="font-weight: bold; background: #222; color: white;">
      <input type="text" id="total-width-bottom-calculated" readonly value="0" style="font-weight: bold; background: #222; color: white;">
      <input type="text" id="total-width-top-calculated" readonly value="0" style="font-weight: bold; background: #222; color: white;">
      <input type="text" readonly value="-" style="font-weight: bold; background: #222; color: white;">
      <input type="text" readonly value="-" style="font-weight: bold; background: #222; color: white;">
      <input type="text" readonly value="-" style="font-weight: bold; background: #222; color: white;">
    `;
  } else {
    headerContainer.innerHTML = `
      <p>م</p>
      <p>الشريك</p>
      <p>النسبة / الكسر</p>
      <p>تعادل (س.ق.ف)</p>
      <p style="display:none;"></p>
      <p>المساحة (م²)</p>
      <p>النسبة (%)</p>
      <p>العرض الأول (أعلى)</p>
      <p>العرض الثاني (أسفل)</p>
      <p>العلامة (م)</p>
      <p>الفاصل (م)</p>
      <p></p>
    `;
    
    footerContainer.innerHTML = `
      <input type="text" readonly value="-" style="font-weight: bold; background: #222; color: white;">
      <input type="text" readonly value="الإجمالي" style="font-weight: bold; background: #222; color: white;">
      <input type="text" id="total-fraction-entered" readonly value="0%" style="font-weight: bold; background: #222; color: white;">
      <input type="text" readonly value="-" style="font-weight: bold; background: #222; color: white;">
      <input type="text" style="display:none;" readonly value="-">
      <input type="text" id="total-area-distributed" readonly value="0" style="font-weight: bold; background: #222; color: white;">
      <input type="text" id="total-percent-distributed" readonly value="0%" style="font-weight: bold; background: #222; color: white;">
      <input type="text" id="total-width-bottom-calculated" readonly value="0" style="font-weight: bold; background: #222; color: white;">
      <input type="text" id="total-width-top-calculated" readonly value="0" style="font-weight: bold; background: #222; color: white;">
      <input type="text" readonly value="-" style="font-weight: bold; background: #222; color: white;">
      <input type="text" readonly value="-" style="font-weight: bold; background: #222; color: white;">
      <input type="text" readonly value="-" style="font-weight: bold; background: #222; color: white;">
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
  savedPartners.forEach(p => {
    addNewPartnerRow(p.name, p.feddans, p.carats, p.shares, p.fraction);
  });
  
  saveAndCalc();
}

function addNewPartnerRow(name = "", feddans = "", carats = "", shares = "", fraction = "", botW = "-", topW = "-", shouldFocus = false) {
  // تصفية وضع التعديل قبل إضافة صف جديد لضمان تحديث الحسابات فوراً
  if (!name && !feddans && !carats && !shares && !fraction) {
  }

  const list = document.getElementById("partners-list");
  const row = document.createElement("div");
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
      <div class="col-group index-group">
        <span class="mobile-label">م</span>
        <input type="text" class="partner-index" readonly value="-">
      </div>
      <div class="col-group name-group">
        <span class="mobile-label">الشريك</span>
        <input type="text" class="partner-name" placeholder="اسم الشريك" value="${name}" oninput="saveAndCalc()" onblur="saveAndCalc()" onkeydown="if(event.key==='Enter')this.blur()">
      </div>
      <div class="col-group share-group">
        <span class="mobile-label">سهم</span>
        <input type="text" inputmode="decimal" class="partner-shares" placeholder="0" value="${formattedShares}" oninput="onShareInput()" onblur="onShareInput()" onkeydown="if(event.key==='Enter')this.blur()">
      </div>
      <div class="col-group carat-group">
        <span class="mobile-label">قيراط</span>
        <input type="text" inputmode="decimal" class="partner-carats" placeholder="0" value="${formattedCarats}" oninput="onShareInput()" onblur="onShareInput()" onkeydown="if(event.key==='Enter')this.blur()">
      </div>
      <div class="col-group feddan-group">
        <span class="mobile-label">فدان</span>
        <input type="text" inputmode="decimal" class="partner-feddans" placeholder="0" value="${feddans}" oninput="onShareInput()" onblur="onShareInput()" onkeydown="if(event.key==='Enter')this.blur()">
      </div>
      <div class="col-group area-group">
        <span class="mobile-label">المساحة (م²)</span>
        <input type="text" inputmode="decimal" class="partner-area" value="-" oninput="onAreaInput(this)" onblur="onAreaInput(this)" onkeydown="if(event.key==='Enter')this.blur()">
      </div>
      <div class="col-group percent-group">
        <span class="mobile-label">نسبة (%)</span>
        <input type="text" inputmode="decimal" class="partner-percent" value="-" oninput="onPercentInput(this)" onblur="onPercentInput(this)" onkeydown="if(event.key==='Enter')this.blur()">
      </div>
      <div class="col-group width-bottom-group">
        <span class="mobile-label">العرض الأول (أعلى)</span>
        <div class="width-input-container">
          <button type="button" class="width-step-btn" onclick="adjustWidthStep(this, 'bottom', -1)">-</button>
          <input type="text" inputmode="decimal" class="partner-width-bottom" oninput="onWidthChange(this, 'bottom')" onblur="onWidthChange(this, 'bottom')" onkeydown="if(event.key==='Enter')this.blur()" value="${botW}">
          <button type="button" class="width-step-btn" onclick="adjustWidthStep(this, 'bottom', 1)">+</button>
        </div>
      </div>
      <div class="col-group width-top-group">
        <span class="mobile-label">العرض الثاني (أسفل)</span>
        <div class="width-input-container">
          <button type="button" class="width-step-btn" onclick="adjustWidthStep(this, 'top', -1)">-</button>
          <input type="text" inputmode="decimal" class="partner-width-top" oninput="onWidthChange(this, 'top')" onblur="onWidthChange(this, 'top')" onkeydown="if(event.key==='Enter')this.blur()" value="${topW}">
          <button type="button" class="width-step-btn" onclick="adjustWidthStep(this, 'top', 1)">+</button>
        </div>
      </div>
      <div class="col-group cum-group">
        <span class="mobile-label">العلامة (م)</span>
        <input type="text" class="partner-cum-width" readonly value="-">
      </div>
      <div class="col-group border-group">
        <span class="mobile-label">الفاصل (م)</span>
        <input type="text" class="partner-div-line" readonly value="-">
      </div>
      <button type="button" class="delete-row-btn" onclick="deletePartnerRow(this)">×</button>
    `;
  } else {
    row.innerHTML = `
      <div class="col-group index-group">
        <span class="mobile-label">م</span>
        <input type="text" class="partner-index" readonly value="-">
      </div>
      <div class="col-group name-group">
        <span class="mobile-label">الشريك</span>
        <input type="text" class="partner-name" placeholder="اسم الشريك" value="${name}" oninput="saveAndCalc()" onblur="saveAndCalc()" onkeydown="if(event.key==='Enter')this.blur()">
      </div>
      <div class="col-group fraction-group">
        <span class="mobile-label">النسبة / الكسر</span>
        <input type="text" class="partner-fraction" placeholder="مثال: 1/4" value="${fraction}" oninput="onShareInput()" onblur="onShareInput()" onkeydown="if(event.key==='Enter')this.blur()">
      </div>
      <div class="col-group equiv-group">
        <span class="mobile-label">تعادل (س.ق.ف)</span>
        <input type="text" class="partner-equiv" readonly value="-">
      </div>
      <div class="col-group" style="display:none;"><input type="hidden"></div>
      <div class="col-group area-group">
        <span class="mobile-label">المساحة (م²)</span>
        <input type="text" inputmode="decimal" class="partner-area" value="-" oninput="onAreaInput(this)" onblur="onAreaInput(this)" onkeydown="if(event.key==='Enter')this.blur()">
      </div>
      <div class="col-group percent-group">
        <span class="mobile-label">نسبة (%)</span>
        <input type="text" inputmode="decimal" class="partner-percent" value="-" oninput="onPercentInput(this)" onblur="onPercentInput(this)" onkeydown="if(event.key==='Enter')this.blur()">
      </div>
      <div class="col-group width-bottom-group">
        <span class="mobile-label">العرض الأول (أعلى)</span>
        <div class="width-input-container">
          <button type="button" class="width-step-btn" onclick="adjustWidthStep(this, 'bottom', -1)">-</button>
          <input type="text" inputmode="decimal" class="partner-width-bottom" oninput="onWidthChange(this, 'bottom')" onblur="onWidthChange(this, 'bottom')" onkeydown="if(event.key==='Enter')this.blur()" value="${botW}">
          <button type="button" class="width-step-btn" onclick="adjustWidthStep(this, 'bottom', 1)">+</button>
        </div>
      </div>
      <div class="col-group width-top-group">
        <span class="mobile-label">العرض الثاني (أسفل)</span>
        <div class="width-input-container">
          <button type="button" class="width-step-btn" onclick="adjustWidthStep(this, 'top', -1)">-</button>
          <input type="text" inputmode="decimal" class="partner-width-top" oninput="onWidthChange(this, 'top')" onblur="onWidthChange(this, 'top')" onkeydown="if(event.key==='Enter')this.blur()" value="${topW}">
          <button type="button" class="width-step-btn" onclick="adjustWidthStep(this, 'top', 1)">+</button>
        </div>
      </div>
      <div class="col-group cum-group">
        <span class="mobile-label">العلامة (م)</span>
        <input type="text" class="partner-cum-width" readonly value="-">
      </div>
      <div class="col-group border-group">
        <span class="mobile-label">الفاصل (م)</span>
        <input type="text" class="partner-div-line" readonly value="-">
      </div>
      <button type="button" class="delete-row-btn" onclick="deletePartnerRow(this)">×</button>
    `;
  }
  
  list.appendChild(row);
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
  debounceTimer = setTimeout(() => {
    saveAndCalcImmediate();
  }, 250); // 250ms debounce
}


function saveAndCalcImmediate() {
  saveData();
  calculateGeneral();
  
  const l1 = parseFloat(document.getElementById("length1").value) || 0;
  const l2 = parseFloat(document.getElementById("length2").value) || 0;
  const w1 = parseFloat(document.getElementById("width1").value) || 0;
  const w2 = parseFloat(document.getElementById("width2").value) || 0;
  if (l1 > 0 && l2 > 0 && w1 > 0 && w2 > 0) {
    runPartition();
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

  const remainingArea = totalAreaM2 - (isManualPartition ? totalDistributedArea : totalTargetArea);
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

function calculateGeneral() {
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
  const totalAreaM2 = l * w;
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
    document.getElementById("formula-details").innerText = `${w1.toFixed(4)} + ${w2.toFixed(4)} = 2 × ${w.toFixed(4)}`;
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
    if (indexInput) indexInput.value = index + 1;

    if (isPartnerRowExcluded(row)) {
      return; // Skip area calculations for excluded row
    }

    // تعبئة اسم الشريك تلقائياً إذا كان فارغاً عند الحساب
    const nameInput = row.querySelector(".partner-name");
    if (nameInput && !nameInput.value.trim()) {
      nameInput.value = `شريك ${index + 1}`;
    }

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
    document.getElementById("summary-rem-area").innerText = Number(remainingArea.toFixed(2)) + " م²";
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
  
  updateRemainderRowUI(remainingArea);
  updateTableTotals();
  adjustNameColumnWidth();
  updateConversionsTable();
  renderCroquis();
  updateCalculationSteps();
}

function runPartition() {
  ensureDimensionsAutofill();
  const l1 = parseFloat(document.getElementById("length1").value) || 0;
  const l2 = parseFloat(document.getElementById("length2").value) || 0;
  const w1 = parseFloat(document.getElementById("width1").value) || 0;
  const w2 = parseFloat(document.getElementById("width2").value) || 0;

  if (l1 <= 0 || l2 <= 0 || w1 <= 0 || w2 <= 0) return;

  const w = (w1 + w2) / 2;
  const totalAreaM2 = ((l1 + l2) / 2) * w;

  let caratArea = parseFloat(document.getElementById("input-carat-area").value);
  if (caratArea === 0) {
    caratArea = parseFloat(document.getElementById("other-carat-area").value) || 0;
  }

  isPartitioned = true;

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
      widthBotInput.value = botWidth.toFixed(2);
      widthBotInput.setAttribute("data-last-val", botWidth.toFixed(4));
    } else if (widthBotInput) {
      widthBotInput.setAttribute("data-last-val", botWidth.toFixed(4));
    }
    if (widthTopInput && document.activeElement !== widthTopInput) {
      widthTopInput.value = topWidth.toFixed(2);
      widthTopInput.setAttribute("data-last-val", topWidth.toFixed(4));
    } else if (widthTopInput) {
      widthTopInput.setAttribute("data-last-val", topWidth.toFixed(4));
    }

    const cumWidthInput = row.querySelector(".partner-cum-width");
    if (cumWidthInput) {
      cumWidthInput.value = `أسفل: ${botStart.toFixed(4)} إلى ${botEnd.toFixed(4)} م | أعلى: ${topStart.toFixed(4)} إلى ${topEnd.toFixed(4)} م`;
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
      
      calculateGeneral();
      runPartition();
      window.isNormalizing = false;
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
    document.getElementById("summary-rem-area").innerText = Number(remainingArea.toFixed(2)) + " م²";
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
        statusEl.innerHTML = `🔴 <strong>احترس! يوجد عجز في الأرض.</strong><br>قيمة العجز: <strong>${absRem.toFixed(2)} م²</strong><br>تعادل: ${fcs.feddan} فدان، ${fcs.carat} قيراط، ${fcs.sahm} سهم.<br><span style="font-size: 11.5px; font-weight: bold; display: block; margin-top: 4px;">يجب مراجعة الأنصبة قبل اعتماد أو طباعة التقسيم.</span>`;
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
  updateRemainderRowUI(remainingArea);
  updateTableTotals();
  saveData();
  renderCroquis();
  updateCalculationSteps();
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
  
  const list = document.getElementById("partners-list");
  if (list) list.innerHTML = "";
  
  // إعادة خطوة التعديل إلى القيمة الافتراضية عند مسح بيانات الأرض
  resetStepValue();

  renderHeaderAndFooter();
  saveData();
  calculateGeneral();
  renderCroquis();
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
  
  const list = document.getElementById("partners-list");
  if (list) list.innerHTML = "";
  
  renderHeaderAndFooter();
  saveData();
  calculateGeneral();
  renderCroquis();

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
  
  const w = (w1 + w2) / 2;
  const totalAreaM2 = ((l1 + l2) / 2) * w;
  
  let caratArea = parseFloat(document.getElementById("input-carat-area").value);
  if (caratArea === 0) {
    caratArea = parseFloat(document.getElementById("other-carat-area").value) || 0;
  }
  
  if (caratArea <= 0) {
    alert("الرجاء تحديد مساحة القيراط بالمتر المربع.");
    return;
  }
  
  if (currentInputMethod === "carats") {
    const totalCarats = totalAreaM2 / caratArea;
    const partnerCarats = totalCarats / numPartners;
    
    // حساب قيم الشريك مع تقريب الأسهم لرقمتين عشريتين
    const f = Math.floor(partnerCarats / 24);
    const c = Math.floor(partnerCarats % 24);
    const s = Number(((partnerCarats - (f * 24 + c)) * 24).toFixed(2));

    rows.forEach((row, index) => {
      if (row.querySelector(".partner-feddans")) row.querySelector(".partner-feddans").value = f > 0 ? f : "";
      if (row.querySelector(".partner-carats")) row.querySelector(".partner-carats").value = c > 0 ? c : "";
      if (row.querySelector(".partner-shares")) row.querySelector(".partner-shares").value = s > 0 ? s : "";
    });
  } else {
    rows.forEach((row, index) => {
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
  t.setAttribute("x", x);
  t.setAttribute("y", y);
  t.setAttribute("text-anchor", opts.anchor || "middle");
  t.setAttribute("font-family", "Cairo, Arial, sans-serif");
  
  const textScale = window.isExporting ? 2.2 : 1;
  const baseSize = parseFloat(opts.size || "13");
  t.setAttribute("font-size", baseSize * textScale);
  t.setAttribute("font-weight", opts.weight || "bold");
  t.setAttribute("fill", opts.fill || "#222");
  if (opts.transform) t.setAttribute("transform", opts.transform);
  if (opts.opacity) t.setAttribute("opacity", opts.opacity);
  t.textContent = content;
  
  // إضافة خلفية بيضاء للنص إذا طُلب
  if (opts.bg) {
    t.setAttribute("stroke", "white");
    t.setAttribute("stroke-width", 3 * textScale);
    t.setAttribute("paint-order", "stroke");
  }
  return t;
}

function svgLine(x1, y1, x2, y2, opts = {}) {
  const l = svgEl("line");
  l.setAttribute("x1", x1);
  l.setAttribute("y1", y1);
  l.setAttribute("x2", x2);
  l.setAttribute("y2", y2);
  l.setAttribute("stroke", opts.stroke || "#666");
  
  const textScale = window.isExporting ? 2.2 : 1;
  const baseWidth = parseFloat(opts.width || "1");
  l.setAttribute("stroke-width", baseWidth * textScale);
  
  if (opts.dash) {
    const dashes = opts.dash.split(",").map(d => parseFloat(d) * textScale).join(",");
    l.setAttribute("stroke-dasharray", dashes);
  }
  if (opts.opacity) l.setAttribute("opacity", opts.opacity);
  return l;
}

function renderCroquis() {
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

  const viewType = document.getElementById("long-plot-view")?.value || "agricultural";
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
  shadowPoly.setAttribute("fill", "rgba(0,0,0,0.08)");
  shadowPoly.setAttribute("rx", "4");
  g.appendChild(shadowPoly);

  // === 2. الإطار الخارجي الكامل ===
  // أسفل-يسار → أسفل-يمين → أعلى-يمين (l1=الطول الأيمن) → أعلى-يسار (l2=الطول الأيسر)
  const mainPoly = svgEl("polygon");
  mainPoly.setAttribute("points",
    `${mapX(0)},${mapY(0)} ${mapX(w)},${mapY(0)} ${mapX(w)},${mapY(l1)} ${mapX(0)},${mapY(l2)}`
  );
  mainPoly.setAttribute("fill", "#FDFBF2");
  mainPoly.setAttribute("stroke", "#1b5e20");
  mainPoly.setAttribute("stroke-width", 2.5 * textScale);
  mainPoly.setAttribute("stroke-linejoin", "round");
  g.appendChild(mainPoly);


  // === 3. رسم القطع ===
  if (window.calculatedPieces && window.calculatedPieces.length > 0) {
    window.calculatedPieces.forEach((piece, index) => {
      const isRem = piece.isRemainder;
      const color = isRem 
        ? { fill: "rgba(255, 193, 7, 0.11)", stroke: "#ff8f00" }
        : PIECE_COLORS[index % PIECE_COLORS.length];

      const x1 = mapX(piece.startX);
      const x2 = mapX(piece.endX);
      const y1 = mapY(0);
      const y2 = mapY(0);
      // ارتفاع الحافة العليا: h(x) = l2 + k*x  (l2=يسار، l1=يمين، k=(l1-l2)/w)
      const y3 = mapY(l2 + k * piece.endX);
      const y4 = mapY(l2 + k * piece.startX);

      // تعبئة القطعة
      const poly = svgEl("polygon");
      poly.setAttribute("points", `${x1},${y1} ${x2},${y2} ${x2},${y3} ${x1},${y4}`);
      poly.setAttribute("fill", color.fill);
      poly.setAttribute("stroke", color.stroke);
      poly.setAttribute("stroke-width", (isRem ? 3 : 2.5) * textScale); // حدود سميكة واضحة تحت الشمس
      if (isRem) {
        poly.setAttribute("stroke-dasharray", window.isExporting ? "13,6" : "6,3");
      }
      poly.setAttribute("stroke-linejoin", "round");
      poly.setAttribute("class", "polygon-segment");
      poly.setAttribute("id", `croquis-poly-${index}`);
      poly.style.pointerEvents = "auto";
      poly.style.cursor = "pointer";
      
      // ربط أحداث التفاعل ثنائي الاتجاه
      poly.addEventListener("mouseenter", () => highlightSegment(index));
      poly.addEventListener("mouseleave", () => removeHighlight());
      poly.addEventListener("click", (e) => selectSegment(index, e));
      
      g.appendChild(poly);

      // مركز القطعة
      const cx = (x1 + x2) / 2;
      const topY = (y1 + y2) / 2;
      const botY = (y3 + y4) / 2;
      const cy = (topY + botY) / 2;

      // 1. رسم النصوص الأفقية المبسطة داخل القطعة باللون الأسود وحجم خط واضح جداً
      if (showCroquisNames || showCroquisMeasurements) {
        const labelGroup = svgEl("g");
        labelGroup.setAttribute("style", "pointer-events: none;"); // حتى لا تعيق التفاعل مع المضلع
        
        const pieceWidth = Math.abs(x2 - x1);
        const nameToShow = piece.name || `شريك ${index + 1}`;
        
        if (pieceWidth < 50 && !window.isExporting) {
          // إذا كانت الأرض ضيقة جداً، نعرض رقم القطعة فقط لتفادي التداخل
          const tIdx = svgEl("text");
          tIdx.setAttribute("x", cx);
          tIdx.setAttribute("y", cy + 4 * textScale);
          tIdx.setAttribute("fill", isRem ? "#e65100" : "#111111"); // لون داكن عالي التباين
          tIdx.setAttribute("font-size", (12.5 * textScale) + "px"); // خط أكبر
          tIdx.setAttribute("font-family", "Cairo, Arial, sans-serif");
          tIdx.setAttribute("text-anchor", "middle");
          tIdx.setAttribute("font-weight", "bold");
          tIdx.textContent = (index + 1).toString();
          labelGroup.appendChild(tIdx);
        } else {
          // نصوص أفقية متباينة
          if (showCroquisNames && showCroquisMeasurements && pieceWidth >= 90) {
            // عرض الاسم والمساحة مكدسين رأسياً
            const tName = svgEl("text");
            tName.setAttribute("x", cx);
            tName.setAttribute("y", cy - 5 * textScale);
            tName.setAttribute("fill", isRem ? "#e65100" : "#111111"); // أسود داكن
            tName.setAttribute("font-size", (12 * textScale) + "px"); // خط 12
            tName.setAttribute("font-family", "Cairo, Arial, sans-serif");
            tName.setAttribute("text-anchor", "middle");
            tName.setAttribute("font-weight", "bold");
            tName.textContent = nameToShow;
            labelGroup.appendChild(tName);
            
            const tArea = svgEl("text");
            tArea.setAttribute("x", cx);
            tArea.setAttribute("y", cy + 11 * textScale);
            tArea.setAttribute("fill", "#111111"); // أسود داكن
            tArea.setAttribute("font-size", (11 * textScale) + "px"); // خط 11
            tArea.setAttribute("font-family", "Cairo, Arial, sans-serif");
            tArea.setAttribute("text-anchor", "middle");
            tArea.setAttribute("font-weight", "bold");
            tArea.textContent = Number(piece.area.toFixed(2)) + " م²";
            labelGroup.appendChild(tArea);
          } else if (showCroquisNames) {
            // عرض الاسم فقط
            const tName = svgEl("text");
            tName.setAttribute("x", cx);
            tName.setAttribute("y", cy + 4 * textScale);
            tName.setAttribute("fill", isRem ? "#e65100" : "#111111");
            tName.setAttribute("font-size", (12.5 * textScale) + "px"); // خط أكبر
            tName.setAttribute("font-family", "Cairo, Arial, sans-serif");
            tName.setAttribute("text-anchor", "middle");
            tName.setAttribute("font-weight", "bold");
            tName.textContent = nameToShow;
            labelGroup.appendChild(tName);
          } else if (showCroquisMeasurements) {
            // عرض المساحة فقط
            const tArea = svgEl("text");
            tArea.setAttribute("x", cx);
            tArea.setAttribute("y", cy + 4 * textScale);
            tArea.setAttribute("fill", "#111111");
            tArea.setAttribute("font-size", (11.5 * textScale) + "px");
            tArea.setAttribute("font-family", "Cairo, Arial, sans-serif");
            tArea.setAttribute("text-anchor", "middle");
            tArea.setAttribute("font-weight", "bold");
            tArea.textContent = Number(piece.area.toFixed(2)) + " م²";
            labelGroup.appendChild(tArea);
          }
        }
        g.appendChild(labelGroup);
      }

      // 2. عرض عروض القطع باللون الأحمر مباشرة على الحدود العليا والسفلى لكل قطعة
      if (showCroquisMeasurements) {
        // العرض السفلي للقطعة (أعلى الحدود السفلية)
        const botWText = svgText(cx, mapY(0) - 8 * textScale, piece.botW.toFixed(2), {
          fill: "#c62828", // أحمر
          size: "11",
          weight: "bold",
          bg: true,
        });
        g.appendChild(botWText);

        // العرض العلوي للقطعة (أسفل الحدود العليا)
        const y_top_mid = (y3 + y4) / 2;
        const topWText = svgText(cx, y_top_mid + 14 * textScale, piece.topW.toFixed(2), {
          fill: "#c62828", // أحمر
          size: "11",
          weight: "bold",
          bg: true,
        });
        g.appendChild(topWText);
      }

      // 3. خطوط القسمة والفواصل الداخلية مع القيم والنقاط الخضراء
      if (index > 0) {
        // خط الفاصل العمودي (بالأزرق المقطع)
        const divLine = svgEl("line");
        divLine.setAttribute("x1", x1);
        divLine.setAttribute("y1", y1);
        divLine.setAttribute("x2", x1);
        divLine.setAttribute("y2", y4);
        divLine.setAttribute("stroke", "#1976d2"); // أزرق
        divLine.setAttribute("stroke-width", 2 * textScale);
        divLine.setAttribute("stroke-dasharray", window.isExporting ? "13,6" : "6,3");
        g.appendChild(divLine);

        if (showCroquisMeasurements) {
          const midFasil = (y1 + y4) / 2;

          // مقبض الفاصل الأخضر ذو الحدود البيضاء (مثل صفحة 13)
          const cDot = svgEl("circle");
          cDot.setAttribute("cx", x1);
          cDot.setAttribute("cy", midFasil);
          cDot.setAttribute("r", 6 * textScale);
          cDot.setAttribute("fill", "#388e3c");
          cDot.setAttribute("stroke", "#ffffff");
          cDot.setAttribute("stroke-width", 1.5 * textScale);
          g.appendChild(cDot);

          // موضع طول الفاصل في الثلث العلوي عند 0.25 من الأعلى (مثل صفحة 13)
          const y_fasil_pos = y4 + 0.25 * (y1 - y4);
          const fasilText = svgText(x1 - 10 * textScale, y_fasil_pos, piece.leftLine.toFixed(2) + " م", {
            fill: "#1b5e20", // أخضر داكن مثل صفحة 13
            size: "10.5",
            weight: "bold",
            bg: true,
            transform: `rotate(-90, ${x1 - 10 * textScale}, ${y_fasil_pos})`,
          });
          g.appendChild(fasilText);
        }
      }
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
    g.appendChild(svgLine(lX, lY1, lX - dimOffset, lY1, { stroke: "rgba(46, 125, 50, 0.55)", width: "1.2", dash: "2,3" }));
    g.appendChild(svgLine(lX, lY2, lX - dimOffset, lY2, { stroke: "rgba(46, 125, 50, 0.55)", width: "1.2", dash: "2,3" }));
    
    // خط الأبعاد
    g.appendChild(svgLine(lX - dimOffset, lY1, lX - dimOffset, lY2, { stroke: "#1b5e20", width: "2" }));
    
    // شُرط الحصر المتعامدة
    g.appendChild(svgLine(lX - dimOffset - 4 * textScale, lY1, lX - dimOffset + 4 * textScale, lY1, { stroke: "#1b5e20", width: "2" }));
    g.appendChild(svgLine(lX - dimOffset - 4 * textScale, lY2, lX - dimOffset + 4 * textScale, lY2, { stroke: "#1b5e20", width: "2" }));
    
    const lMidY = (lY1 + lY2) / 2;
    g.appendChild(svgText(lX - dimOffset - 4 * textScale, lMidY, l2 + " م", {
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
    g.appendChild(svgLine(rX, rY1, rX + dimOffset, rY1, { stroke: "rgba(46, 125, 50, 0.55)", width: "1.2", dash: "2,3" }));
    g.appendChild(svgLine(rX, rY2, rX + dimOffset, rY2, { stroke: "rgba(46, 125, 50, 0.55)", width: "1.2", dash: "2,3" }));
    
    // خط الأبعاد
    g.appendChild(svgLine(rX + dimOffset, rY1, rX + dimOffset, rY2, { stroke: "#1b5e20", width: "2" }));
    
    // شُرط الحصر المتعامدة
    g.appendChild(svgLine(rX + dimOffset - 4 * textScale, rY1, rX + dimOffset + 4 * textScale, rY1, { stroke: "#1b5e20", width: "2" }));
    g.appendChild(svgLine(rX + dimOffset - 4 * textScale, rY2, rX + dimOffset + 4 * textScale, rY2, { stroke: "#1b5e20", width: "2" }));
    
    const rMidY = (rY1 + rY2) / 2;
    g.appendChild(svgText(rX + dimOffset + 4 * textScale, rMidY, l1 + " م", {
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
    g.appendChild(svgLine(bX1, mapY(0), bX1, bY, { stroke: "rgba(46, 125, 50, 0.55)", width: "1.2", dash: "2,3" }));
    g.appendChild(svgLine(bX2, mapY(0), bX2, bY, { stroke: "rgba(46, 125, 50, 0.55)", width: "1.2", dash: "2,3" }));
    
    // خط الأبعاد
    g.appendChild(svgLine(bX1, bY, bX2, bY, { stroke: "#1b5e20", width: "2" }));
    
    // شُرط الحصر المتعامدة
    g.appendChild(svgLine(bX1, bY - 4 * textScale, bX1, bY + 4 * textScale, { stroke: "#1b5e20", width: "2" }));
    g.appendChild(svgLine(bX2, bY - 4 * textScale, bX2, bY + 4 * textScale, { stroke: "#1b5e20", width: "2" }));
    
    g.appendChild(svgText((bX1 + bX2) / 2, bY - 6 * textScale, w1 + " م", {
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
    g.appendChild(svgLine(topX1, mapY(l2), topX1, topEdgeY, { stroke: "rgba(46, 125, 50, 0.55)", width: "1.2", dash: "2,3" }));
    g.appendChild(svgLine(topX2, mapY(l1), topX2, topEdgeY, { stroke: "rgba(46, 125, 50, 0.55)", width: "1.2", dash: "2,3" }));
    
    // خط الأبعاد
    g.appendChild(svgLine(topX1, topEdgeY, topX2, topEdgeY, { stroke: "#1b5e20", width: "2" }));
    
    // شُرط الحصر
    g.appendChild(svgLine(topX1, topEdgeY - 4 * textScale, topX1, topEdgeY + 4 * textScale, { stroke: "#1b5e20", width: "2" }));
    g.appendChild(svgLine(topX2, topEdgeY - 4 * textScale, topX2, topEdgeY + 4 * textScale, { stroke: "#1b5e20", width: "2" }));
    
    g.appendChild(svgText((topX1 + topX2) / 2, topEdgeY + 16 * textScale, w2 + " م", {
      fill: "#111111", // أسود داكن
      size: "13.5",
      weight: "bold",
      bg: true,
    }));

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
    data.push(["م", "الشريك", "سهم", "قيراط", "فدان", "المساحة (م²)", "النسبة (%)", "العرض الأول (أعلى)", "العرض الثاني (أسفل)", "العلامة (م)", "الفاصل (م)"]);
  } else {
    data.push(["م", "الشريك", "النسبة/الكسر", "تعادل (س.ق.ف)", "المساحة (م²)", "النسبة (%)", "العرض الأول (أعلى)", "العرض الثاني (أسفل)", "العلامة (م)", "الفاصل (م)"]);
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
    rowData.push(w1_val);
    rowData.push(w2_val);
    
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
      remData.push(inputs[0].value);
      remData.push(inputs[1].value);
      if (currentInputMethod === "carats") {
        remData.push(inputs[2].value);
        remData.push(inputs[3].value);
        remData.push(inputs[4].value);
        remData.push(inputs[5].value);
        remData.push(inputs[6].value);
        
        let remW1 = inputs[7].value;
        let remW2 = inputs[8].value;
        if (window.calculatedPieces) {
          const remPiece = window.calculatedPieces.find(p => p.isRemainder);
          if (remPiece) {
            remW1 = remPiece.botW.toFixed(4);
            remW2 = remPiece.topW.toFixed(4);
          }
        }
        remData.push(remW1);
        remData.push(remW2);
        remData.push(inputs[9].value);
        remData.push(inputs[10].value);
      } else {
        remData.push(inputs[2].value);
        remData.push(inputs[3].value);
        remData.push(inputs[5].value);
        remData.push(inputs[6].value);
        
        let remW1 = inputs[7].value;
        let remW2 = inputs[8].value;
        if (window.calculatedPieces) {
          const remPiece = window.calculatedPieces.find(p => p.isRemainder);
          if (remPiece) {
            remW1 = remPiece.botW.toFixed(4);
            remW2 = remPiece.topW.toFixed(4);
          }
        }
        remData.push(remW1);
        remData.push(remW2);
        remData.push(inputs[9].value);
        remData.push(inputs[10].value);
      }
      data.push(remData);
    }
  }

  // إضافة صف الإجمالي
  const totalRow = document.getElementById("total");
  if (totalRow) {
    const totData = [];
    const inputs = totalRow.querySelectorAll("input");
    if (inputs.length >= 11) {
      totData.push(inputs[0].value);
      totData.push(inputs[1].value);
      if (currentInputMethod === "carats") {
        totData.push(inputs[2].value);
        totData.push(inputs[3].value);
        totData.push(inputs[4].value);
        totData.push(inputs[5].value);
        totData.push(inputs[6].value);
        totData.push(inputs[7].value);
        totData.push(inputs[8].value);
        totData.push(inputs[9].value);
        totData.push(inputs[10].value);
      } else {
        totData.push(inputs[2].value);
        totData.push(inputs[3].value);
        totData.push(inputs[5].value);
        totData.push(inputs[6].value);
        totData.push(inputs[7].value);
        totData.push(inputs[8].value);
        totData.push(inputs[9].value);
        totData.push(inputs[10].value);
      }
      data.push(totData);
    }
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
  const totalArea = document.getElementById("calc-area-m2") ? document.getElementById("calc-area-m2").innerText : "-";
  const data = getTableDataArray();
  const numPartners = Array.from(document.querySelectorAll("#partners-list .partner-row")).filter(r => !isPartnerRowExcluded(r)).length;
  
  const tableRows = data.slice(1).map((row, idx) => {
    const isTotal = row[1] === "الإجمالي";
    const isRem = row[1] && row[1].includes("المتبقي");
    let bg = idx % 2 === 0 ? "#f9f9f9" : "#fff";
    let style = "";
    if (isTotal) {
      bg = "#333";
      style = "color: white; font-weight: bold;";
    } else if (isRem) {
      bg = "#fffde7";
      style = "color: #e65100; font-weight: bold;";
    }
    return `<tr style="background:${bg};${style}">${row.map(cell => `<td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">${cell}</td>`).join("")}</tr>`;
  }).join("");
  
  const headerRow = `<tr>${data[0].map(h => `<th style="padding:8px 10px;background:#1b5e20;color:white;border:1px solid #ddd;text-align:center;">${h}</th>`).join("")}</tr>`;
  
  const printContent = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تقرير تقسيم الأراضي - الدلال</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    * { font-family: 'Cairo', Arial, sans-serif; }
    body { margin: 20px; color: #222; }
    .header { text-align: center; border-bottom: 3px solid #1b5e20; padding-bottom: 10px; margin-bottom: 20px; }
    .header h1 { color: #1b5e20; margin: 0; font-size: 22px; }
    .header p { color: #666; margin: 5px 0 0; font-size: 13px; }
    .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
    .info-box { background: #f1f8e9; border: 1px solid #a5d6a7; border-radius: 8px; padding: 10px; text-align: center; }
    .info-box label { font-size: 11px; color: #666; display: block; margin-bottom: 4px; }
    .info-box strong { font-size: 16px; color: #1b5e20; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
    .croquis-section { text-align: center; margin-top: 20px; }
    .croquis-section h3 { color: #1b5e20; font-size: 16px; margin-bottom: 10px; }
    .footer { text-align: center; color: #888; font-size: 11px; border-top: 1px solid #eee; padding-top: 10px; margin-top: 20px; }
    @media print { body { margin: 10px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🌿 تقرير القسمة في حال اختلاف الأطوال - الدَّلاَّل</h1>
    <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
  <div class="info-grid">
    <div class="info-box"><label>العرض الأول</label><strong>${w1} م</strong></div>
    <div class="info-box"><label>العرض الثاني</label><strong>${w2} م</strong></div>
    <div class="info-box"><label>الطول الأيمن</label><strong>${l1} م</strong></div>
    <div class="info-box"><label>الطول الأيسر</label><strong>${l2} م</strong></div>
  </div>
  <div class="info-grid" style="grid-template-columns: repeat(3,1fr);">
    <div class="info-box"><label>المساحة الإجمالية</label><strong>${totalArea} م²</strong></div>
    <div class="info-box"><label>عدد الشركاء</label><strong>${numPartners}</strong></div>
    <div class="info-box"><label>حالة التقسيم</label><strong style="color:#2e7d32;">${document.getElementById("summary-status") ? document.getElementById("summary-status").innerText.replace(/\n/g, ' ') : "-"}</strong></div>
  </div>
  <h3 style="color:#1b5e20; margin: 15px 0 8px 0; font-size:15px;">جدول تفاصيل التقسيم</h3>
  <table>
    ${headerRow}
    ${tableRows}
  </table>
  <div class="footer">تم إنشاء هذا التقرير بواسطة تطبيق الدَّلاَّل - حسابات المزارع والفلاح</div>
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
  
  // ترويسة المعلومات
  const infoRows = [
    ["تقرير القسمة في حال اختلاف الأطوال - الدلال"],
    ["تاريخ التقرير", new Date().toLocaleDateString('ar-EG')],
    [],
    ["أبعاد الأرض الإجمالية"],
    ["العرض الأول (م)", w1, "العرض الثاني (م)", w2],
    ["الطول الأيمن (م)", l1, "الطول الأيسر (م)", l2],
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
    <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px;">
      <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة 1: حساب متوسط العرض</strong>
      <code style="font-family: monospace; font-size: 14px; background: #f5f5f5; padding: 4px 8px; border-radius: 4px; display: inline-block; direction: ltr; margin-top: 4px;">
        (${w1} + ${w2}) ÷ 2<br>= ${w.toFixed(4)} م
      </code>
    </div>

    <!-- الخطوة 2: حساب متوسط الطول -->
    <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px;">
      <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة 2: حساب متوسط الطول</strong>
      <code style="font-family: monospace; font-size: 14px; background: #f5f5f5; padding: 4px 8px; border-radius: 4px; display: inline-block; direction: ltr; margin-top: 4px;">
        (${l1} + ${l2}) ÷ 2<br>= ${l.toFixed(4)} م
      </code>
    </div>

    <!-- الخطوة 3: حساب المساحة -->
    <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px;">
      <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة 3: حساب المساحة الإجمالية</strong>
      <code style="font-family: monospace; font-size: 14px; background: #f5f5f5; padding: 4px 8px; border-radius: 4px; display: inline-block; direction: ltr; margin-top: 4px;">
        ${l.toFixed(4)} × ${w.toFixed(4)}<br>= ${totalAreaM2.toFixed(4)} م²
      </code>
    </div>
  `;

  // الخطوة 4 والخطوة 5: الشركاء والأنصبة والنسب
  const rows = document.querySelectorAll("#partners-list .partner-row");
  if (rows.length > 0) {
    // 4. حساب مساحة كل شريك
    html += `
      <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px;">
        <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة 4: حساب مساحة كل شريك</strong>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
    `;
    rows.forEach((row, index) => {
      const partnerName = row.querySelector(".partner-name").value || `شريك ${index + 1}`;
      const partnerAreaValue = parseFloat(row.querySelector(".partner-area").value) || 0;
      html += `
        <div style="border-right: 3px solid #66bb6a; padding-right: 8px;">
          <span style="font-weight: bold; color: #333;">${partnerName}:</span>
          <span style="font-size: 13px; color: #1b5e20; font-weight: bold; margin-right: 6px;">${partnerAreaValue.toFixed(2)} م²</span>
        </div>
      `;
    });
    html += `
        </div>
      </div>
    `;

    // 5. حساب نسبة كل شريك
    html += `
      <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px;">
        <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة 5: حساب نسبة كل شريك</strong>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
    `;
    rows.forEach((row, index) => {
      const partnerName = row.querySelector(".partner-name").value || `شريك ${index + 1}`;
      const partnerAreaValue = parseFloat(row.querySelector(".partner-area").value) || 0;
      const partnerPct = totalAreaM2 > 0 ? (partnerAreaValue / totalAreaM2) * 100 : 0;
      html += `
        <div style="border-right: 3px solid #42a5f5; padding-right: 8px;">
          <span style="font-weight: bold; color: #333;">${partnerName}:</span><br>
          <code style="font-family: monospace; font-size: 12px; background: #f5f5f5; padding: 2px 4px; border-radius: 3px; direction: ltr; display: inline-block; margin-top: 2px;">
            ${partnerAreaValue.toFixed(2)} ÷ ${totalAreaM2.toFixed(2)} × 100<br>= ${partnerPct.toFixed(2)}%
          </code>
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
          <code style="font-family: monospace; font-size: 12px; background: #fffde7; padding: 2px 4px; border-radius: 3px; direction: ltr; display: inline-block; margin-top: 2px;">
            ${remAreaVal.toFixed(2)} ÷ ${totalAreaM2.toFixed(2)} × 100<br>= ${remPct.toFixed(2)}%
          </code>
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
      <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px;">
        <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة 6: حساب العرض الأول لكل قطعة (أسفل)</strong>
        <p style="font-size: 11px; color: #666; margin-bottom: 4px; line-height: 1.3;">
          المعادلة: العرض السفلي الإجمالي (w1) مضروباً في نسبة شريحة الشريك الأفقي (dt):
        </p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
    `;
    window.calculatedPieces.forEach((piece, index) => {
      const dt = piece.botW / w1;
      html += `
        <div style="border-right: 3px solid #ab47bc; padding-right: 8px;">
          <span style="font-weight: bold; color: #333;">${piece.name}:</span><br>
          <code style="font-family: monospace; font-size: 12px; background: #f5f5f5; padding: 2px 4px; border-radius: 3px; direction: ltr; display: inline-block; margin-top: 2px;">
            ${w1} × ${dt.toFixed(6)}<br>= ${piece.botW.toFixed(4)} م
          </code>
        </div>
      `;
    });
    html += `
        </div>
      </div>
    `;

    // 7. حساب العرض الثاني لكل قطعة (أعلى)
    html += `
      <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px;">
        <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة 7: حساب العرض الثاني لكل قطعة (أعلى)</strong>
        <p style="font-size: 11px; color: #666; margin-bottom: 4px; line-height: 1.3;">
          المعادلة: العرض العلوي الإجمالي (w2) مضروباً في نسبة شريحة الشريك الأفقي (dt):
        </p>
        <div style="display: flex; flex-direction: column; gap: 8px;">
    `;
    window.calculatedPieces.forEach((piece, index) => {
      const dt = piece.topW / w2;
      html += `
        <div style="border-right: 3px solid #ab47bc; padding-right: 8px;">
          <span style="font-weight: bold; color: #333;">${piece.name}:</span><br>
          <code style="font-family: monospace; font-size: 12px; background: #f5f5f5; padding: 2px 4px; border-radius: 3px; direction: ltr; display: inline-block; margin-top: 2px;">
            ${w2} × ${dt.toFixed(6)}<br>= ${piece.topW.toFixed(4)} م
          </code>
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
        <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px;">
          <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة 8: حساب طول الفاصل (خطوط القسمة الداخلية)</strong>
          <p style="font-size: 11px; color: #666; margin-bottom: 6px; line-height: 1.3;">
            المعادلة المستخدمة: التناسب الخطي المباشر للأطوال: <code style="font-family: monospace; direction: ltr; background: #eee; padding: 0 3px; border-radius: 2px;">L(t) = l1 + t &times; (l2 - l1)</code>
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
              <span style="font-weight: bold; color: #333;">الفاصل بين قطعة ${index} وقطعة ${index + 1}:</span><br>
              <code style="font-family: monospace; font-size: 12px; background: #f5f5f5; padding: 2px 4px; border-radius: 3px; direction: ltr; display: inline-block; margin-top: 2px;">
                ${l1} + ${t.toFixed(4)} × (${l2} - ${l1})<br>= ${piece.leftLine.toFixed(4)} م
              </code>
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
      <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px;">
        <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة 9: التحقق النهائي ومطابقة المساحات</strong>
        <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px; line-height: 1.4;">
          <div>مجموع مساحات الشركاء الفعلية = <strong style="color: #2e7d32; font-family: monospace;">${totalPiecesArea.toFixed(4)} م²</strong></div>
          <div>المساحة الإجمالية للأرض = <strong style="color: #2e7d32; font-family: monospace;">${totalAreaM2.toFixed(4)} م²</strong></div>
          <div style="margin-top: 4px; border-top: 1px solid #eee; padding-top: 4px; font-weight: bold; font-size: 13px;">
            الفرق المتبقي = 
            <span style="color: ${Math.abs(difference) < 0.01 ? "#2e7d32" : "#c62828"}; font-family: monospace;">
              ${difference.toFixed(4)} م² ${diffIcon}
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
          <div style="flex: 1; background: #2c2c2e; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; border: 1px solid #444; color: #eee; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; font-size: 13px; color: #aaa; margin-bottom: 6px; font-weight: bold;">عند الحد العلوي</div>
            <div style="text-align: center; font-size: 20px; color: #42a5f5; font-weight: bold; direction: ltr; margin-bottom: 12px;">${topQiratWidth.toFixed(4)} م</div>
            
            <div style="border-top: 1px solid #444; margin-bottom: 8px;"></div>
            
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
              <span style="font-weight: bold; color: #ddd;">العرض العلوي</span>
              <span style="font-weight: bold; direction: ltr; color: #fff;">${w2} م</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <span style="font-weight: bold; color: #ddd;">عدد القراريط</span>
              <span style="font-weight: bold; direction: ltr; color: #fff;">${totalQirats.toFixed(4)} قيراط</span>
            </div>
          </div>

          <!-- Bottom Border Card -->
          <div style="flex: 1; background: #2c2c2e; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; border: 1px solid #444; color: #eee; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; font-size: 13px; color: #aaa; margin-bottom: 6px; font-weight: bold;">عند الحد السفلي</div>
            <div style="text-align: center; font-size: 20px; color: #42a5f5; font-weight: bold; direction: ltr; margin-bottom: 12px;">${botQiratWidth.toFixed(4)} م</div>
            
            <div style="border-top: 1px solid #444; margin-bottom: 8px;"></div>
            
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
              <span style="font-weight: bold; color: #ddd;">العرض السفلي</span>
              <span style="font-weight: bold; direction: ltr; color: #fff;">${w1} م</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <span style="font-weight: bold; color: #ddd;">عدد القراريط</span>
              <span style="font-weight: bold; direction: ltr; color: #fff;">${totalQirats.toFixed(4)} قيراط</span>
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

  stepsContainer.innerHTML = html;

  // إذا كانت اللوحة مفتوحة، نقوم بتحديث ارتفاعها المناسب لتفادي قص المحتوى
  if (isStepsOpen) {
    const container = document.getElementById("calculation-steps-container");
    if (container) {
      container.style.maxHeight = container.scrollHeight + "px";
    }
  }
}

// ============================================================
//   دوال التحويل للقصبة والقبضة (مأخوذة من صفحة 13)
// ============================================================
function toQasabaAndQabda(meters) {
  if (!meters || isNaN(meters) || meters <= 0) return { qasaba: 0, qabda: 0, fraction: 0 };
  const qasabaLength = 3.55;
  const qabdaLength = qasabaLength / 24;
  
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
  // هذا يمنع فقدان التركيز، تكرار الأرقام، وتعطل الكتابة/المسح
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

  // helper: render one field-group (label + value chip)
  function convFieldHTML(id, value, title, chipClass, min, max, step) {
    const minAttr  = min  !== undefined ? `min="${min}"`   : '';
    const maxAttr  = max  !== undefined ? `max="${max}"`   : '';
    const stepAttr = step !== undefined ? `step="${step}"` : '';
    // استخدام القيمة المحفوظة للحقل النشط حتى لا تُفقد أثناء إعادة البناء
    const displayValue = (id === savedFocusId && savedValue !== null) ? savedValue : value;
    return `
      <div class="conv-field-group">
        <div class="conv-field-label">${title}</div>
        <div class="conv-field-chip ${chipClass}">
          <input type="text" inputmode="decimal"
            id="${id}" value="${displayValue}"
            class="conv-chip-input"
            title="${title}"
            ${minAttr} ${maxAttr} ${stepAttr}
            oninput="updateSideFromQasaba(this.dataset.idx)"
            onchange="updateSideFromQasaba(this.dataset.idx)"
            data-idx="${id.split('-').pop()}">
        </div>
      </div>`;
  }

  function readonlyFieldHTML(value, title, chipClass) {
    return `
      <div class="conv-field-group">
        <div class="conv-field-label">${title}</div>
        <div class="conv-field-chip ${chipClass}">
          <input type="text" inputmode="decimal" value="${value}" class="conv-chip-input" readonly tabindex="-1">
        </div>
      </div>`;
  }

  function buildCard({ id, label, meterValue, meterColor, isEditable, isArea, chipBase }) {
    const qConv = toQasabaAndQabda(meterValue);
    const meterLabel = isArea ? `${meterValue.toFixed(2)} م²` : `${meterValue} م`;
    const meterBadgeStyle = `background:${meterColor.bg}; color:${meterColor.fg};`;
    const cardClass = isArea ? 'conv-card conv-card-area' : 'conv-card';

    const fracHTML = isEditable
      ? convFieldHTML(`conv-fraction-${id}`, qConv.fraction, 'أقل من القبضة', `${chipBase}-frac`, 0, 0.99, 0.01)
      : readonlyFieldHTML(qConv.fraction, 'أقل من القبضة', `${chipBase}-frac readonly`);

    const qabdaHTML = isEditable
      ? convFieldHTML(`conv-qabda-${id}`, qConv.qabda, 'قبضة', `${chipBase}-qabda`, 0, undefined, 1)
      : readonlyFieldHTML(qConv.qabda, 'قبضة', `${chipBase}-qabda readonly`);

    const qasabaHTML = isEditable
      ? convFieldHTML(`conv-qasaba-${id}`, qConv.qasaba, 'قصبة', `${chipBase}-qasaba`, 0, undefined, 1)
      : readonlyFieldHTML(qConv.qasaba, 'قصبة', `${chipBase}-qasaba readonly`);

    return `
      <div class="${cardClass}">
        <div class="conv-card-header">
          <span class="conv-card-label">${label}</span>
          <span class="conv-meter-badge" style="${meterBadgeStyle}">${meterLabel}</span>
        </div>
        <div class="conv-card-fields">
          ${fracHTML}${qabdaHTML}${qasabaHTML}
        </div>
      </div>`;
  }


  let html = '<div class="conv-grid">';

  // الأبعاد الأربعة القابلة للتعديل
  const dims = [
    { id: 0, field: 'width1', label: 'العرض الأول (أعلى) (C)' },
    { id: 1, field: 'width2', label: 'العرض الثاني (أسفل) (A)' },
    { id: 2, field: 'length1', label: 'الطول الأيمن (D)' },
    { id: 3, field: 'length2', label: 'الطول الأيسر (B)' },
  ];

  dims.forEach(dim => {
    const val = parseFloat(document.getElementById(dim.field)?.value) || 0;
    html += buildCard({
      id: dim.id,
      label: dim.label,
      meterValue: val,
      meterColor: { bg: '#e8f5e9', fg: '#1b5e20' },
      isEditable: true,
      isArea: false,
      chipBase: 'green'
    });
  });

  html += '</div>'; // end conv-grid

  // عروض القيراط والمساحة المربعة في صف مستقل
  let caratArea = parseFloat(document.getElementById("input-carat-area").value) || 0;
  if (caratArea === 0) caratArea = parseFloat(document.getElementById("other-carat-area").value) || 0;

  let botQiratWidth = 0, topQiratWidth = 0;
  if (caratArea > 0 && totalAreaM2 > 0) {
    const totalQirats = totalAreaM2 / caratArea;
    topQiratWidth = w1 / totalQirats;
    botQiratWidth = w2 / totalQirats;
  }

  const qasba_sq = totalAreaM2 / 12.60250;
  const reedValue = Math.floor(qasba_sq);
  const fistValue = Math.floor((qasba_sq - reedValue) * 24);
  const lessThanFistValue = parseFloat(((qasba_sq - reedValue - fistValue / 24)).toFixed(2));

  html += '<div class="conv-extra-row">';

  if (caratArea > 0 && totalAreaM2 > 0) {
    html += buildCard({
      id: 'topq',
      label: 'عرض القيراط العلوي',
      meterValue: topQiratWidth,
      meterColor: { bg: '#e3f2fd', fg: '#0d47a1' },
      isEditable: false,
      isArea: false,
      chipBase: 'blue'
    });
    html += buildCard({
      id: 'botq',
      label: 'عرض القيراط السفلي',
      meterValue: botQiratWidth,
      meterColor: { bg: '#e3f2fd', fg: '#0d47a1' },
      isEditable: false,
      isArea: false,
      chipBase: 'blue'
    });
  }

  // النتيجة بالقصبة المربعة - نبنيها مباشرة بقيم صحيحة
  const areaFracHTML   = readonlyFieldHTML(lessThanFistValue, 'أقل من القبضة', 'purple-frac readonly');
  const areaQabdaHTML  = readonlyFieldHTML(fistValue, 'قبضة', 'purple-qabda readonly');
  const areaQasabaHTML = readonlyFieldHTML(reedValue, 'قصبة', 'purple-qasaba readonly');

  html += `
    <div class="conv-card conv-card-area">
      <div class="conv-card-header">
        <span class="conv-card-label">النتيجة بالقصبة المربعة</span>
        <span class="conv-meter-badge" style="background:#f3e5f5; color:#6a1b9a;">${totalAreaM2.toFixed(2)} م²</span>
      </div>
      <div class="conv-card-fields">
        ${areaFracHTML}${areaQabdaHTML}${areaQasabaHTML}
      </div>
    </div>`;

  html += '</div>'; // end conv-extra-row

  // ── إعادة بناء DOM ─────────────────────────────────────────────────────────
  container.innerHTML = html;

  // ── استعادة التركيز والقيمة والموضع للحقل الذي كان نشطاً ─────────────────
  if (savedFocusId) {
    const restoredEl = document.getElementById(savedFocusId);
    if (restoredEl) {
      // القيمة موجودة بالفعل في HTML (displayValue في convFieldHTML)
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
  const qasabaLength = 3.55;
  const qabdaLength = qasabaLength / 24;
  return (qasaba * qasabaLength) + (qabda * qabdaLength) + (fraction * qabdaLength);
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
  const w = (w1 + w2) / 2;
  const totalAreaM2 = ((l1 + l2) / 2) * w;

  let caratArea = parseFloat(document.getElementById("input-carat-area").value);
  if (caratArea === 0) {
    caratArea = parseFloat(document.getElementById("other-carat-area").value) || 0;
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
  const landW1 = parseFloat(document.getElementById("width1")?.value) || 0;
  const landW2 = parseFloat(document.getElementById("width2")?.value) || 0;
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

document.addEventListener("touchstart", (e) => {
  const btn = e.target.closest(".width-step-btn");
  if (!btn) return;
  e.preventDefault();
  const onclick = btn.getAttribute("onclick") || "";
  const m = onclick.match(/adjustWidthStep\(this,\s*'(\w+)',\s*(-?1)\)/);
  if (!m) return;
  _lpStart(btn, m[1], parseInt(m[2]), true); // نستدعيها فوراً لمنع التباطؤ على اللمس
}, { passive: false });
document.addEventListener("touchend", _lpStop);
document.addEventListener("touchcancel", _lpStop);

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

function onShareInput() {
  isManualPartition = false;
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

      remCumWidth = `أسفل: ${partnersBotW.toFixed(2)} إلى ${w1.toFixed(2)} | أعلى: ${partnersTopW.toFixed(2)} إلى ${w2.toFixed(2)}`;
      remLengths = `يمين: ${remRightL.toFixed(2)} | يسار: ${remLeftL.toFixed(2)}`;
    }
  }

  if (currentInputMethod === "carats") {
    row.innerHTML = `
      <input type="text" readonly value="-" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" readonly value="🟡 المتبقي" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" readonly value="${fcs.sahm}" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" readonly value="${fcs.carat}" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" readonly value="${fcs.feddan}" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" readonly value="${absRem.toFixed(2)}" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" readonly value="${remPct.toFixed(2)}%" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" readonly value="${remBotW > 0 ? remBotW.toFixed(2) : '-'}" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" readonly value="${remTopW > 0 ? remTopW.toFixed(2) : '-'}" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" readonly value="${remCumWidth}" style="font-weight: bold; background: #fffde7; color: #e65100; font-size: 11px; text-align: center;">
      <input type="text" readonly value="${remLengths}" style="font-weight: bold; background: #fffde7; color: #e65100; font-size: 11px; text-align: center;">
      <input type="text" readonly value="-" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
    `;
  } else {
    const fractionVal = totalAreaM2 > 0 ? (absRem / totalAreaM2) : 0;
    row.innerHTML = `
      <input type="text" readonly value="-" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" readonly value="🟡 المتبقي" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" readonly value="${fractionVal.toFixed(4)}" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" readonly value="${fcs.sahm}س، ${fcs.carat}ق، ${fcs.feddan}ف" style="font-weight: bold; background: #fffde7; color: #e65100; font-size: 11px; text-align: center;">
      <input type="text" style="display:none;" readonly value="-">
      <input type="text" readonly value="${absRem.toFixed(2)}" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" readonly value="${remPct.toFixed(2)}%" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" readonly value="${remBotW > 0 ? remBotW.toFixed(2) : '-'}" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" readonly value="${remTopW > 0 ? remTopW.toFixed(2) : '-'}" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
      <input type="text" readonly value="${remCumWidth}" style="font-weight: bold; background: #fffde7; color: #e65100; font-size: 11px; text-align: center;">
      <input type="text" readonly value="${remLengths}" style="font-weight: bold; background: #fffde7; color: #e65100; font-size: 11px; text-align: center;">
      <input type="text" readonly value="-" style="font-weight: bold; background: #fffde7; color: #e65100; text-align: center;">
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
  const totalCarats = area / caratArea;
  const feddan = Math.floor(totalCarats / 24);
  const carat = Math.floor(totalCarats % 24);
  const sahm = Number(((totalCarats - (feddan * 24 + carat)) * 24).toFixed(2));
  return { feddan, carat, sahm };
}

function updateTableTotals() {
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
      totalBotWidth += parseFloat(row.querySelector(".partner-width-bottom")?.value) || 0;
      totalTopWidth += parseFloat(row.querySelector(".partner-width-top")?.value) || 0;
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
  
  // 3. إذا كان هناك شريك محدد مسبقاً بالنقر، نعيد تحديث المفتش لعرض بياناته
  if (window.selectedSegmentIndex !== null) {
    updateInspector(window.selectedSegmentIndex);
    
    // إعادة التوهج للقطعة المحددة والصف المحدد
    const poly = document.getElementById(`croquis-poly-${window.selectedSegmentIndex}`);
    if (poly) poly.classList.add("polygon-highlight");
    
    const row = document.querySelector(`#partners-list .partner-row[data-index="${window.selectedSegmentIndex}"]`);
    if (row) row.classList.add("partner-row-highlighted");
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
  
  if (insPercentEl) {
    insPercentEl.innerText = `${pct.toFixed(2)} %`;
  }
  
  // العرض الأول يمثل botW والعلوي يمثل topW
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

