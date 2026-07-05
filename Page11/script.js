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
let isEditing = false;
let activeFieldBefore = null;

// متغيرات Pinch-to-Zoom
let lastTouchDist = 0;
let lastTouchMidX = 0;
let lastTouchMidY = 0;
let isTwoFingerTouch = false;
let isFullscreen = false;

document.addEventListener("DOMContentLoaded", function () {
  loadData();
  
  // Set up event listeners
  const list = document.getElementById("partners-list");
  if (list.children.length === 0) {
    addNewPartnerRow();
  }
  renderHeaderAndFooter();
  calculateGeneral();
  if (isPartitioned) {
    runPartition();
  }
  
  // Setup SVG interactions
  setupSVGInteractions();

  // Setup inputs saveAndCalc listeners
  const inputs = ["length1", "length2", "width1", "width2", "other-carat-area"];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", saveAndCalc);
    }
  });
});

function setupSVGInteractions() {
  const container = document.getElementById("croquis-container");
  if(!container) return;
  
  // === Mouse Events (سطح المكتب) ===
  container.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    isDragging = true;
    startDragX = e.clientX - croquisTranslateX;
    startDragY = e.clientY - croquisTranslateY;
    container.style.cursor = "grabbing";
    e.preventDefault();
  });
  
  window.addEventListener("mouseup", () => {
    isDragging = false;
    const cont = document.getElementById("croquis-container");
    if (cont) cont.style.cursor = "grab";
  });
  
  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    croquisTranslateX = e.clientX - startDragX;
    croquisTranslateY = e.clientY - startDragY;
    updateCroquisTransform();
  });
  
  // تكبير/تصغير بعجلة الفأرة
  container.addEventListener("wheel", (e) => {
    e.preventDefault();
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.12 : 0.9;
    zoomAroundPoint(factor, mouseX, mouseY);
  }, { passive: false });
  
  // === Touch Events (الجوال) ===
  container.addEventListener("touchstart", handleTouchStart, { passive: false });
  container.addEventListener("touchmove", handleTouchMove, { passive: false });
  container.addEventListener("touchend", handleTouchEnd, { passive: false });
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
    // سحب بإصبع واحد
    isTwoFingerTouch = false;
    isDragging = true;
    startDragX = e.touches[0].clientX - croquisTranslateX;
    startDragY = e.touches[0].clientY - croquisTranslateY;
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
    croquisTranslateX = e.touches[0].clientX - startDragX;
    croquisTranslateY = e.touches[0].clientY - startDragY;
    updateCroquisTransform();
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
  const padding = 80;
  const w = (w1 + w2) / 2;
  const maxLen = Math.max(l1, l2);
  
  const scaleX = (cW - padding * 2) / w;
  const scaleY = (cH - padding * 2) / maxLen;
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
  
  setTimeout(fitCroquis, 100);
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

function toggleCroquisMeasurements() {
  const chk = document.getElementById("chk-toggle-meas");
  if (chk) showCroquisMeasurements = chk.checked;
  renderCroquis();
}

function saveData() {
  localStorage.setItem("p11-length1", document.getElementById("length1").value);
  localStorage.setItem("p11-length2", document.getElementById("length2").value);
  localStorage.setItem("p11-width1", document.getElementById("width1").value);
  localStorage.setItem("p11-width2", document.getElementById("width2").value);
  localStorage.setItem("p11-carat-area", document.getElementById("input-carat-area").value);
  localStorage.setItem("p11-other-carat-area", document.getElementById("other-carat-area").value);
  localStorage.setItem("p11-input-method", document.getElementById("share-input-method").value);
  localStorage.setItem("p11-is-partitioned", isPartitioned ? "true" : "false");
  localStorage.setItem("p11-is-manual-partition", isManualPartition ? "true" : "false");

  const modeKeepArea = document.getElementById("mode-keep-area");
  if (modeKeepArea) {
    localStorage.setItem("p11-manual-width-mode", modeKeepArea.checked ? "keep-area" : "free");
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
  document.getElementById("length1").value = localStorage.getItem("p11-length1") || "";
  document.getElementById("length2").value = localStorage.getItem("p11-length2") || "";
  document.getElementById("width1").value = localStorage.getItem("p11-width1") || "";
  document.getElementById("width2").value = localStorage.getItem("p11-width2") || "";
  document.getElementById("input-carat-area").value = localStorage.getItem("p11-carat-area") || "175.035";
  document.getElementById("other-carat-area").value = localStorage.getItem("p11-other-carat-area") || "";
  
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
  
  if (currentInputMethod === "carats") {
    headerContainer.innerHTML = `
      <p>م</p>
      <p>الشريك</p>
      <p>سهم</p>
      <p>قيراط</p>
      <p>فدان</p>
      <p>المساحة (م²)</p>
      <p>النسبة (%)</p>
      <p>العرض الأول (أسفل)</p>
      <p>العرض الثاني (أعلى)</p>
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
      <p>العرض الأول (أسفل)</p>
      <p>العرض الثاني (أعلى)</p>
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

function addNewPartnerRow(name = "", feddans = "", carats = "", shares = "", fraction = "", botW = "-", topW = "-") {
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
        <input type="text" class="partner-name" placeholder="اسم الشريك" value="${name}" oninput="saveAndCalc()">
      </div>
      <div class="col-group share-group">
        <span class="mobile-label">سهم</span>
        <input type="text" class="partner-shares" placeholder="0" value="${formattedShares}" oninput="onShareInput()" inputmode="none">
      </div>
      <div class="col-group carat-group">
        <span class="mobile-label">قيراط</span>
        <input type="text" class="partner-carats" placeholder="0" value="${formattedCarats}" oninput="onShareInput()" inputmode="none">
      </div>
      <div class="col-group feddan-group">
        <span class="mobile-label">فدان</span>
        <input type="text" class="partner-feddans" placeholder="0" value="${feddans}" oninput="onShareInput()" inputmode="none">
      </div>
      <div class="col-group area-group">
        <span class="mobile-label">المساحة (م²)</span>
        <input type="text" class="partner-area" readonly value="-">
      </div>
      <div class="col-group percent-group">
        <span class="mobile-label">نسبة (%)</span>
        <input type="text" class="partner-percent" readonly value="-">
      </div>
      <div class="col-group width-bottom-group">
        <span class="mobile-label">العرض الأول (أسفل)</span>
        <input type="text" class="partner-width-bottom" onchange="onWidthChange(this, 'bottom')" value="${botW}" inputmode="none">
      </div>
      <div class="col-group width-top-group">
        <span class="mobile-label">العرض الثاني (أعلى)</span>
        <input type="text" class="partner-width-top" onchange="onWidthChange(this, 'top')" value="${topW}" inputmode="none">
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
        <input type="text" class="partner-name" placeholder="اسم الشريك" value="${name}" oninput="saveAndCalc()">
      </div>
      <div class="col-group fraction-group">
        <span class="mobile-label">النسبة / الكسر</span>
        <input type="text" class="partner-fraction" placeholder="مثال: 1/4" value="${fraction}" oninput="onShareInput()" inputmode="none">
      </div>
      <div class="col-group equiv-group">
        <span class="mobile-label">تعادل (س.ق.ف)</span>
        <input type="text" class="partner-equiv" readonly value="-">
      </div>
      <div class="col-group" style="display:none;"><input type="hidden"></div>
      <div class="col-group area-group">
        <span class="mobile-label">المساحة (م²)</span>
        <input type="text" class="partner-area" readonly value="-">
      </div>
      <div class="col-group percent-group">
        <span class="mobile-label">نسبة (%)</span>
        <input type="text" class="partner-percent" readonly value="-">
      </div>
      <div class="col-group width-bottom-group">
        <span class="mobile-label">العرض الأول (أسفل)</span>
        <input type="text" class="partner-width-bottom" onchange="onWidthChange(this, 'bottom')" value="${botW}" inputmode="none">
      </div>
      <div class="col-group width-top-group">
        <span class="mobile-label">العرض الثاني (أعلى)</span>
        <input type="text" class="partner-width-top" onchange="onWidthChange(this, 'top')" value="${topW}" inputmode="none">
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
}

function deletePartnerRow(button) {
  const row = button.parentElement;
  row.remove();
  isManualPartition = false;
  saveAndCalcImmediate();
}

function updateRowsReadOnlyStatus() {
  const rows = document.querySelectorAll("#partners-list .partner-row");
  rows.forEach((row, index) => {
    const isFirst = (index === 0);
    const feddansInput = row.querySelector(".partner-feddans");
    const caratsInput = row.querySelector(".partner-carats");
    const sharesInput = row.querySelector(".partner-shares");
    const fractionInput = row.querySelector(".partner-fraction");
    const deleteBtn = row.querySelector(".delete-row-btn");
    
    if (isFirst) {
      if (feddansInput) {
        feddansInput.readOnly = true;
        feddansInput.style.backgroundColor = "#f5f5f5";
        feddansInput.style.color = "#777";
        feddansInput.style.cursor = "not-allowed";
        feddansInput.title = "يُحسب تلقائياً كباقي مساحة الأرض";
      }
      if (caratsInput) {
        caratsInput.readOnly = true;
        caratsInput.style.backgroundColor = "#f5f5f5";
        caratsInput.style.color = "#777";
        caratsInput.style.cursor = "not-allowed";
        caratsInput.title = "يُحسب تلقائياً كباقي مساحة الأرض";
      }
      if (sharesInput) {
        sharesInput.readOnly = true;
        sharesInput.style.backgroundColor = "#f5f5f5";
        sharesInput.style.color = "#777";
        sharesInput.style.cursor = "not-allowed";
        sharesInput.title = "يُحسب تلقائياً كباقي مساحة الأرض";
      }
      if (fractionInput) {
        fractionInput.readOnly = true;
        fractionInput.style.backgroundColor = "#f5f5f5";
        fractionInput.style.color = "#777";
        fractionInput.style.cursor = "not-allowed";
        fractionInput.title = "يُحسب تلقائياً كباقي مساحة الأرض";
      }
      if (deleteBtn) {
        deleteBtn.style.visibility = "hidden";
      }
    } else {
      if (feddansInput) {
        feddansInput.readOnly = false;
        feddansInput.style.backgroundColor = "";
        feddansInput.style.color = "";
        feddansInput.style.cursor = "";
        feddansInput.removeAttribute("title");
      }
      if (caratsInput) {
        caratsInput.readOnly = false;
        caratsInput.style.backgroundColor = "";
        caratsInput.style.color = "";
        caratsInput.style.cursor = "";
        caratsInput.removeAttribute("title");
      }
      if (sharesInput) {
        sharesInput.readOnly = false;
        sharesInput.style.backgroundColor = "";
        sharesInput.style.color = "";
        sharesInput.style.cursor = "";
        sharesInput.removeAttribute("title");
      }
      if (fractionInput) {
        fractionInput.readOnly = false;
        fractionInput.style.backgroundColor = "";
        fractionInput.style.color = "";
        fractionInput.style.cursor = "";
        fractionInput.removeAttribute("title");
      }
      if (deleteBtn) {
        deleteBtn.style.visibility = "visible";
      }
    }
  });
}

let debounceTimer = null;

function saveAndCalc() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    saveAndCalcImmediate();
  }, 250); // 250ms debounce
}

function saveAndCalcImmediate() {
  if (isEditing) return;
  saveData();
  calculateGeneral();
  
  const l1 = parseFloat(document.getElementById("length1").value) || 0;
  const l2 = parseFloat(document.getElementById("length2").value) || 0;
  const w1 = parseFloat(document.getElementById("width1").value) || 0;
  const w2 = parseFloat(document.getElementById("width2").value) || 0;
  if (l1 > 0 && l2 > 0 && w1 > 0 && w2 > 0) {
    runPartition();
  }
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

function calculateGeneral() {
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
    const totalCarats = totalAreaM2 / caratArea;
    const acres = Math.floor(totalCarats / 24);
    const carats = Math.floor(totalCarats % 24);
    const shares = ((totalCarats - (acres * 24 + carats)) * 24);
    
    if (document.getElementById("calc-area-acre")) document.getElementById("calc-area-acre").innerText = acres;
    if (document.getElementById("calc-area-carat")) document.getElementById("calc-area-carat").innerText = carats;
    if (document.getElementById("calc-area-shares")) document.getElementById("calc-area-shares").innerText = shares.toFixed(2);
  }

  let rows = document.querySelectorAll("#partners-list .partner-row");
  if (rows.length === 0) {
    addNewPartnerRow("شريك 1");
    // Re-select rows
    rows = document.querySelectorAll("#partners-list .partner-row");
  }
  
  updateRowsReadOnlyStatus();

  let otherCaratsSum = 0;
  let otherFractionsSum = 0;
  
  rows.forEach((row, index) => {
    if (index > 0) {
      if (currentInputMethod === "carats") {
        const f = parseFloat(row.querySelector(".partner-feddans") ? row.querySelector(".partner-feddans").value : 0) || 0;
        const c = parseFloat(row.querySelector(".partner-carats") ? row.querySelector(".partner-carats").value : 0) || 0;
        const s = parseFloat(row.querySelector(".partner-shares") ? row.querySelector(".partner-shares").value : 0) || 0;
        otherCaratsSum += (f * 24) + c + (s / 24);
      } else {
        const fracInput = row.querySelector(".partner-fraction");
        const fracVal = parseFraction(fracInput ? fracInput.value : "");
        otherFractionsSum += fracVal;
      }
    }
  });

  const firstRow = rows[0];
  if (currentInputMethod === "carats") {
    const totalCaratsOfLand = caratArea > 0 ? (totalAreaM2 / caratArea) : 0;
    const firstPartnerCarats = Math.max(0, totalCaratsOfLand - otherCaratsSum);
    
    const f = Math.floor(firstPartnerCarats / 24);
    const c = Math.floor(firstPartnerCarats % 24);
    const s = Number(((firstPartnerCarats - (f * 24 + c)) * 24).toFixed(2));
    
    if (firstRow.querySelector(".partner-feddans")) firstRow.querySelector(".partner-feddans").value = f;
    if (firstRow.querySelector(".partner-carats")) firstRow.querySelector(".partner-carats").value = c;
    if (firstRow.querySelector(".partner-shares")) firstRow.querySelector(".partner-shares").value = s;
  } else {
    const firstPartnerFraction = Math.max(0, 1 - otherFractionsSum);
    if (firstRow.querySelector(".partner-fraction")) {
      firstRow.querySelector(".partner-fraction").value = firstPartnerFraction === 0 ? "0" : Number(firstPartnerFraction.toFixed(4));
    }
  }

  let totalDistributedArea = 0;
  let totalFeddansEntered = 0;
  let totalCaratsEntered = 0;
  let totalSharesEntered = 0;
  let totalFractionsEntered = 0;
  
  if (currentInputMethod === "carats") {
    rows.forEach(row => {
      const f = parseFloat(row.querySelector(".partner-feddans") ? row.querySelector(".partner-feddans").value : 0) || 0;
      const c = parseFloat(row.querySelector(".partner-carats") ? row.querySelector(".partner-carats").value : 0) || 0;
      const s = parseFloat(row.querySelector(".partner-shares") ? row.querySelector(".partner-shares").value : 0) || 0;
      totalFeddansEntered += f;
      totalCaratsEntered += c;
      totalSharesEntered += s;
    });
    
    let displayTotalFeddans = totalFeddansEntered + Math.floor(totalCaratsEntered / 24);
    let displayTotalCarats = (totalCaratsEntered % 24) + Math.floor(totalSharesEntered / 24);
    let displayTotalShares = (totalSharesEntered % 24);
    
    if (displayTotalCarats >= 24) {
      displayTotalFeddans += Math.floor(displayTotalCarats / 24);
      displayTotalCarats = displayTotalCarats % 24;
    }
    
    if (document.getElementById("total-shares-entered")) document.getElementById("total-shares-entered").value = Number(displayTotalShares.toFixed(2));
    if (document.getElementById("total-carats-entered")) document.getElementById("total-carats-entered").value = displayTotalCarats;
    if (document.getElementById("total-feddans-entered")) document.getElementById("total-feddans-entered").value = displayTotalFeddans;
  } else {
    rows.forEach(row => {
      const fracInput = row.querySelector(".partner-fraction");
      const fracVal = parseFraction(fracInput ? fracInput.value : "");
      totalFractionsEntered += fracVal;
    });
    if (document.getElementById("total-fraction-entered")) {
      document.getElementById("total-fraction-entered").value = Number((totalFractionsEntered * 100).toFixed(2)) + "%";
    }
  }

  rows.forEach((row, index) => {
    // 1. Update Serial Number (م)
    const indexInput = row.querySelector(".partner-index");
    if (indexInput) indexInput.value = index + 1;

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
        if (partnerCarats > 0) {
          const f_eq = Math.floor(partnerCarats / 24);
          const c_eq = Math.floor(partnerCarats % 24);
          const s_eq = ((partnerCarats - (f_eq * 24 + c_eq)) * 24);
          equivInput.value = `${Number(s_eq.toFixed(2))} س، ${c_eq} ق، ${f_eq} ف`;
        } else {
          equivInput.value = "-";
        }
      }
    }
    
    // 2. Update Area (المساحة)
    if (!isManualPartition) {
      const areaInput = row.querySelector(".partner-area");
      if (areaInput) areaInput.value = Number(partnerAreaM2.toFixed(2));

      // 3. Update Percentage (النسبة)
      const percentInput = row.querySelector(".partner-percent");
      if (percentInput) {
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

  // Update Footer totals for area and percentage
  if (!isManualPartition) {
    if (document.getElementById("total-area-distributed")) {
      document.getElementById("total-area-distributed").value = Number(totalDistributedArea.toFixed(2));
    }
    if (document.getElementById("total-percent-distributed")) {
      const totalPct = totalAreaM2 > 0 ? (totalDistributedArea / totalAreaM2) * 100 : 0;
      document.getElementById("total-percent-distributed").value = Number(totalPct.toFixed(2)) + " %";
    }
    if (document.getElementById("total-width-bottom-calculated")) {
      document.getElementById("total-width-bottom-calculated").value = "-";
    }
    if (document.getElementById("total-width-top-calculated")) {
      document.getElementById("total-width-top-calculated").value = "-";
    }
  }

  const remainingArea = totalAreaM2 - totalDistributedArea;
  
  // Update summaries
  if (document.getElementById("summary-total-area")) {
    document.getElementById("summary-total-area").innerText = Number(totalAreaM2.toFixed(2)) + " م²";
  }
  if (document.getElementById("summary-rem-area")) {
    document.getElementById("summary-rem-area").innerText = Number(remainingArea.toFixed(2)) + " م²";
  }
  if (document.getElementById("summary-status")) {
    const statusEl = document.getElementById("summary-status");
    if (Math.abs(remainingArea) < 0.1) {
      statusEl.innerText = "مكتمل";
      statusEl.style.color = "#2e7d32";
    } else if (remainingArea > 0) {
      statusEl.innerText = "يوجد فرق (متبقي)";
      statusEl.style.color = "#c62828";
    } else {
      statusEl.innerText = "يوجد فرق (زيادة)";
      statusEl.style.color = "#c62828";
    }
  }
  if (document.getElementById("summary-total-width")) {
    document.getElementById("summary-total-width").innerText = "-";
  }

  if (document.getElementById("info-partners-count")) {
    document.getElementById("info-partners-count").innerText = rows.length;
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
    document.getElementById("rem-area-m2").innerText = Number(remainingArea.toFixed(2));
  }

  if (caratArea > 0) {
    let remainingCarats = remainingArea / caratArea;
    const isNegative = remainingCarats < 0;
    const absRemaining = Math.abs(remainingCarats);

    const remAcres = Math.floor(absRemaining / 24);
    const remCarats = Math.floor(absRemaining % 24);
    const remShares = ((absRemaining - (remAcres * 24 + remCarats)) * 24);

    const prefix = isNegative ? "-" : "";
    document.getElementById("rem-acres").innerText = prefix + remAcres;
    document.getElementById("rem-carats").innerText = remCarats;
    document.getElementById("rem-shares").innerText = Number(remShares.toFixed(2));

    const color = isNegative ? "red" : "black";
    document.getElementById("rem-acres").style.color = color;
    document.getElementById("rem-carats").style.color = color;
    document.getElementById("rem-shares").style.color = color;
  }
  
  adjustNameColumnWidth();
  renderCroquis();
  updateCalculationSteps();
}

function runPartition() {
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

      if (index === rows.length - 1) {
        tCurr_bot = 1.0;
        tCurr_top = 1.0;
        botWidth = w1 * (1.0 - lastT_bot);
        topWidth = w2 * (1.0 - lastT_top);
      }

      if (tCurr_bot > 1.0) tCurr_bot = 1.0;
      if (tCurr_top > 1.0) tCurr_top = 1.0;

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
      if (index === rows.length - 1) {
        t_next = 1.0;
      } else {
        if (Math.abs(diff) < 1e-9) {
          const dt = partnerAreaM2 / (w * l1);
          t_next = lastT_top + dt;
        } else {
          const valInsideRoot = L_right * L_right + (2 * diff * partnerAreaM2) / w;
          const dt = (-L_right + Math.sqrt(Math.max(0, valInsideRoot))) / diff;
          t_next = lastT_top + dt;
        }
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

    if (widthBotInput) {
      widthBotInput.value = botWidth.toFixed(4);
      widthBotInput.setAttribute("data-last-val", botWidth.toFixed(4));
    }
    if (widthTopInput) {
      widthTopInput.value = topWidth.toFixed(4);
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
    if (areaInput) areaInput.value = Number(calculatedGeoArea.toFixed(2));

    const percentInput = row.querySelector(".partner-percent");
    if (percentInput) {
      const pct = totalAreaM2 > 0 ? (calculatedGeoArea / totalAreaM2) * 100 : 0;
      percentInput.value = Number(pct.toFixed(2)) + " %";
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

  // Also update summary totals in the footer
  if (document.getElementById("total-area-distributed")) {
    document.getElementById("total-area-distributed").value = Number(totalDistributedArea.toFixed(2));
  }
  if (document.getElementById("total-percent-distributed")) {
    const totalPct = totalAreaM2 > 0 ? (totalDistributedArea / totalAreaM2) * 100 : 0;
    document.getElementById("total-percent-distributed").value = Number(totalPct.toFixed(2)) + " %";
  }

  // update the remaining area card
  const remainingArea = totalAreaM2 - totalDistributedArea;
  const remAcres = document.getElementById("rem-acres");
  if (remAcres) {
    const isNegative = remainingArea < -0.005;
    const absRem = Math.abs(remainingArea);
    
    let totalRemCarats = caratArea > 0 ? (absRem / caratArea) : 0;
    
    // round or fix
    const remFeddans = Math.floor(totalRemCarats / 24);
    const remCarats = Math.floor(totalRemCarats % 24);
    const remShares = ((totalRemCarats - (remFeddans * 24 + remCarats)) * 24);

    document.getElementById("rem-m2").innerText = (isNegative ? "-" : "") + absRem.toFixed(2);
    document.getElementById("rem-acres").innerText = (isNegative ? "-" : "") + remFeddans;
    document.getElementById("rem-carats").innerText = (isNegative ? "-" : "") + remCarats;
    document.getElementById("rem-shares").innerText = (isNegative ? "-" : "") + Number(remShares.toFixed(2));

    const color = isNegative ? "red" : "black";
    document.getElementById("rem-acres").style.color = color;
    document.getElementById("rem-carats").style.color = color;
    document.getElementById("rem-shares").style.color = color;
  }

  saveData();
  renderCroquis();
  updateCalculationSteps();
}

function clearAll() {
  document.getElementById("length1").value = "";
  document.getElementById("length2").value = "";
  document.getElementById("width1").value = "";
  document.getElementById("width2").value = "";
  
  const list = document.getElementById("partners-list");
  list.innerHTML = "";
  addNewPartnerRow();
  
  saveAndCalc();
}

function onCalculateBtnClick() {
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
    const f = Math.floor(partnerCarats / 24);
    const c = Math.floor(partnerCarats % 24);
    const s = Number(((partnerCarats - (f * 24 + c)) * 24).toFixed(2));
    
    rows.forEach((row, index) => {
      if (index > 0) {
        if (row.querySelector(".partner-feddans")) row.querySelector(".partner-feddans").value = f;
        if (row.querySelector(".partner-carats")) row.querySelector(".partner-carats").value = c;
        if (row.querySelector(".partner-shares")) row.querySelector(".partner-shares").value = s;
      }
    });
  } else {
    rows.forEach((row, index) => {
      if (index > 0) {
        if (row.querySelector(".partner-fraction")) {
          row.querySelector(".partner-fraction").value = `1/${numPartners}`;
        }
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
const PIECE_COLORS = [
  { fill: "#e8f5e9", stroke: "#2e7d32", text: "#1b5e20" },
  { fill: "#e3f2fd", stroke: "#1565c0", text: "#0d47a1" },
  { fill: "#fff3e0", stroke: "#e65100", text: "#bf360c" },
  { fill: "#fce4ec", stroke: "#880e4f", text: "#6a1b4d" },
  { fill: "#e8eaf6", stroke: "#283593", text: "#1a237e" },
  { fill: "#e0f2f1", stroke: "#00695c", text: "#004d40" },
  { fill: "#f3e5f5", stroke: "#6a1b9a", text: "#4a148c" },
  { fill: "#fbe9e7", stroke: "#bf360c", text: "#870000" },
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
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e65100" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <p style="font-weight: bold; color: #e65100; margin-top: 10px;">الرجاء الضغط على زر (أحسب / تقسيم)</p>
        <p style="font-size: 12px; color: #666; margin-top: 5px;">لبدء تقسيم الأرض ورسم الكروكي</p>
      `;
      placeholder.style.display = "flex";
    }
    return;
  }
  if (placeholder) placeholder.style.display = "none";

  const w = (w1 + w2) / 2;
  const container = document.getElementById("croquis-container");
  
  // استخدام حجم الحاوية الفعلي أو حجم التصدير العالي
  let containerW = 1600;
  let containerH = 1000;
  if (!window.isExporting) {
    containerW = container ? container.clientWidth || 700 : 700;
    containerH = container ? container.clientHeight || 500 : 500;
  }
  
  const textScale = window.isExporting ? 2.2 : 1;
  const paddingH = window.isExporting ? 75 * textScale : 35;  // هامش أفقي (مصغر للشاشة ومكبر للتصدير)
  const paddingV = window.isExporting ? 65 * textScale : 30;  // هامش رأسي (مصغر للشاشة ومكبر للتصدير)
  const maxLen = Math.max(l1, l2);

  const scaleX = (containerW - paddingH * 2) / w;
  const scaleY = (containerH - paddingV * 2) / maxLen;
  const drawScale = Math.min(scaleX, scaleY);

  const drawnW = w * drawScale;
  const drawnH = maxLen * drawScale;
  const offsetX = (containerW - drawnW) / 2;
  const offsetY = (containerH - drawnH) / 2;

  // دوال التحويل (الأرض موجهة أفقياً - العرض أفقي، الطول رأسي)
  // الطول الأيمن (l1) على اليمين البصري = mapX(w)
  // الطول الأيسر (l2) على اليسار البصري = mapX(0)
  const mapX = (x) => offsetX + x * drawScale;
  const mapY = (y) => containerH - (offsetY + y * drawScale);

  // k = معدل التغير في الطول بالنسبة للعرض
  // l2 (يسار) في mapX(0)، l1 (يمين) في mapX(w)
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
  mainPoly.setAttribute("fill", "#f8fdf8");
  mainPoly.setAttribute("stroke", "#1b5e20");
  mainPoly.setAttribute("stroke-width", 2.5 * textScale);
  mainPoly.setAttribute("stroke-linejoin", "round");
  g.appendChild(mainPoly);


  // === 3. رسم القطع ===
  if (window.calculatedPieces && window.calculatedPieces.length > 0) {
    window.calculatedPieces.forEach((piece, index) => {
      const color = PIECE_COLORS[index % PIECE_COLORS.length];
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
      poly.setAttribute("stroke-width", 1.5 * textScale);
      poly.setAttribute("stroke-linejoin", "round");
      g.appendChild(poly);

      // مركز القطعة
      const cx = (x1 + x2) / 2;
      const topY = (y1 + y2) / 2;
      const botY = (y3 + y4) / 2;
      const cy = (topY + botY) / 2;

      // === اسم الشريك ===
      if (showCroquisNames) {
        let nameY = cy;
        if (showCroquisMeasurements) {
          nameY = cy - 22 * textScale;
        }
        const nameText = svgText(cx, nameY, piece.name, {
          fill: color.text,
          size: "14",
          weight: "bold",
          bg: true,
        });
        g.appendChild(nameText);
      }

      // === المساحة ===
      if (showCroquisMeasurements) {
        let areaY = cy;
        if (showCroquisNames) {
          areaY = cy - 6 * textScale;
        }
        // مستطيل خلفية للمساحة
        const areaLabel = Number(piece.area.toFixed(2)) + " م²";
        const areaText = svgText(cx, areaY, areaLabel, {
          fill: "#333",
          size: "12",
          weight: "bold",
          bg: true,
        });
        g.appendChild(areaText);

        // عرض القطعة (أسفل)
        const botWLabel = "أسفل: " + piece.botW.toFixed(2) + " م";
        const botWText = svgText(cx, cy + 10 * textScale, botWLabel, {
          fill: color.stroke,
          size: "11",
          weight: "bold",
          bg: true,
        });
        g.appendChild(botWText);

        // عرض القطعة (أعلى)
        const topWLabel = "أعلى: " + piece.topW.toFixed(2) + " م";
        const topWText = svgText(cx, cy + 26 * textScale, topWLabel, {
          fill: color.stroke,
          size: "11",
          weight: "bold",
          bg: true,
        });
        g.appendChild(topWText);

        // خط الفاصل مع قيمته
        if (index > 0) {
          // خط الفاصل العمودي
          const divLine = svgEl("line");
          divLine.setAttribute("x1", x1);
          divLine.setAttribute("y1", y1);
          divLine.setAttribute("x2", x1);
          divLine.setAttribute("y2", y4);
          divLine.setAttribute("stroke", "#d84315");
          divLine.setAttribute("stroke-width", 2 * textScale);
          divLine.setAttribute("stroke-dasharray", window.isExporting ? "13,6" : "6,3");
          g.appendChild(divLine);

          // قيمة الفاصل
          const midFasil = (y1 + y4) / 2;
          const fasilText = svgText(x1, midFasil, piece.leftLine.toFixed(4) + " م", {
            fill: "#d84315",
            size: "11",
            weight: "bold",
            bg: true,
            transform: `rotate(-90, ${x1}, ${midFasil})`,
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
    g.appendChild(svgLine(lX - dimOffset, lY1, lX - dimOffset, lY2, { stroke: "#2e7d32", width: "1.5" }));
    
    // شُرط الحصر المتعامدة
    g.appendChild(svgLine(lX - dimOffset - 4 * textScale, lY1, lX - dimOffset + 4 * textScale, lY1, { stroke: "#2e7d32", width: "2" }));
    g.appendChild(svgLine(lX - dimOffset - 4 * textScale, lY2, lX - dimOffset + 4 * textScale, lY2, { stroke: "#2e7d32", width: "2" }));
    
    const lMidY = (lY1 + lY2) / 2;
    g.appendChild(svgText(lX - dimOffset - 4 * textScale, lMidY, "الطول الأيسر: " + l2 + " م", {
      anchor: "start",
      fill: "#2e7d32",
      size: "13",
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
    g.appendChild(svgLine(rX + dimOffset, rY1, rX + dimOffset, rY2, { stroke: "#2e7d32", width: "1.5" }));
    
    // شُرط الحصر المتعامدة
    g.appendChild(svgLine(rX + dimOffset - 4 * textScale, rY1, rX + dimOffset + 4 * textScale, rY1, { stroke: "#2e7d32", width: "2" }));
    g.appendChild(svgLine(rX + dimOffset - 4 * textScale, rY2, rX + dimOffset + 4 * textScale, rY2, { stroke: "#2e7d32", width: "2" }));
    
    const rMidY = (rY1 + rY2) / 2;
    g.appendChild(svgText(rX + dimOffset + 4 * textScale, rMidY, "الطول الأيمن: " + l1 + " م", {
      anchor: "start",
      fill: "#2e7d32",
      size: "13",
      weight: "bold",
      bg: true,
      transform: `rotate(-90, ${rX + dimOffset + 4 * textScale}, ${rMidY})`,
    }));

    // --- العرض الأول (أسفل) ---
    const bY = mapY(0) + dimOffset;
    const bX1 = mapX(0);
    const bX2 = mapX(w);
    
    // خطوط المساعدة المقطعة
    g.appendChild(svgLine(bX1, mapY(0), bX1, bY, { stroke: "rgba(46, 125, 50, 0.55)", width: "1.2", dash: "2,3" }));
    g.appendChild(svgLine(bX2, mapY(0), bX2, bY, { stroke: "rgba(46, 125, 50, 0.55)", width: "1.2", dash: "2,3" }));
    
    // خط الأبعاد
    g.appendChild(svgLine(bX1, bY, bX2, bY, { stroke: "#2e7d32", width: "1.5" }));
    
    // شُرط الحصر المتعامدة
    g.appendChild(svgLine(bX1, bY - 4 * textScale, bX1, bY + 4 * textScale, { stroke: "#2e7d32", width: "2" }));
    g.appendChild(svgLine(bX2, bY - 4 * textScale, bX2, bY + 4 * textScale, { stroke: "#2e7d32", width: "2" }));
    
    g.appendChild(svgText((bX1 + bX2) / 2, bY + 16 * textScale, "العرض الأول: " + w1 + " م", {
      fill: "#2e7d32",
      size: "13",
      weight: "bold",
      bg: true,
    }));

    // --- العرض الثاني (أعلى) ---
    // أعلى يسار = mapY(l2)، أعلى يمين = mapY(l1)
    const topEdgeY = mapY(Math.max(l1, l2)) - dimOffset;
    const topX1 = mapX(0);
    const topX2 = mapX(w);
    
    // خطوط مساعدة من كل سقف لأعلى
    g.appendChild(svgLine(topX1, mapY(l2), topX1, topEdgeY, { stroke: "rgba(46, 125, 50, 0.55)", width: "1.2", dash: "2,3" }));
    g.appendChild(svgLine(topX2, mapY(l1), topX2, topEdgeY, { stroke: "rgba(46, 125, 50, 0.55)", width: "1.2", dash: "2,3" }));
    
    // خط الأبعاد
    g.appendChild(svgLine(topX1, topEdgeY, topX2, topEdgeY, { stroke: "#2e7d32", width: "1.5" }));
    
    // شُرط الحصر
    g.appendChild(svgLine(topX1, topEdgeY - 4 * textScale, topX1, topEdgeY + 4 * textScale, { stroke: "#2e7d32", width: "2" }));
    g.appendChild(svgLine(topX2, topEdgeY - 4 * textScale, topX2, topEdgeY + 4 * textScale, { stroke: "#2e7d32", width: "2" }));
    
    g.appendChild(svgText((topX1 + topX2) / 2, topEdgeY - 8 * textScale, "العرض الثاني (أعلى): " + w2 + " م", {
      fill: "#2e7d32",
      size: "13",
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
  clonedSvg.setAttribute("width", "1600");
  clonedSvg.setAttribute("height", "1000");
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
      canvas.width = 1600; 
      canvas.height = 1000;
      const ctx = canvas.getContext("2d");
      
      // خلفية بيضاء
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // تنزيل كـ PNG
      const a = document.createElement("a");
      a.download = "تقسيم_الأرض_الدلال.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
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
    data.push(["م", "الشريك", "سهم", "قيراط", "فدان", "المساحة (م²)", "النسبة (%)", "العرض الأول (أسفل)", "العرض الثاني (أعلى)", "العلامة (م)", "الفاصل (م)"]);
  } else {
    data.push(["م", "الشريك", "النسبة/الكسر", "تعادل (س.ق.ف)", "المساحة (م²)", "النسبة (%)", "العرض الأول (أسفل)", "العرض الثاني (أعلى)", "العلامة (م)", "الفاصل (م)"]);
  }
  
  rows.forEach(row => {
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
    rowData.push(row.querySelector(".partner-width-bottom") ? row.querySelector(".partner-width-bottom").value : "-");
    rowData.push(row.querySelector(".partner-width-top") ? row.querySelector(".partner-width-top").value : "-");
    rowData.push(row.querySelector(".partner-cum-width") ? row.querySelector(".partner-cum-width").value : "-");
    rowData.push(row.querySelector(".partner-div-line") ? row.querySelector(".partner-div-line").value : "-");
    data.push(rowData);
  });
  
  return data;
}

function printReport() {
  const l1 = document.getElementById("length1").value || "-";
  const l2 = document.getElementById("length2").value || "-";
  const w1 = document.getElementById("width1").value || "-";
  const w2 = document.getElementById("width2").value || "-";
  const totalArea = document.getElementById("calc-area-m2") ? document.getElementById("calc-area-m2").innerText : "-";
  const data = getTableDataArray();
  
  const tableRows = data.slice(1).map((row, idx) => {
    const bg = idx % 2 === 0 ? "#f9f9f9" : "#fff";
    return `<tr style="background:${bg};">${row.map(cell => `<td style="padding:6px 10px;border:1px solid #ddd;text-align:center;">${cell}</td>`).join("")}</tr>`;
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
    <div class="info-box"><label>الطول الأيمن</label><strong>${l1} م</strong></div>
    <div class="info-box"><label>الطول الأيسر</label><strong>${l2} م</strong></div>
    <div class="info-box"><label>العرض الأول</label><strong>${w1} م</strong></div>
    <div class="info-box"><label>العرض الثاني</label><strong>${w2} م</strong></div>
  </div>
  <div class="info-grid" style="grid-template-columns: repeat(3,1fr);">
    <div class="info-box"><label>المساحة الإجمالية</label><strong>${totalArea} م²</strong></div>
    <div class="info-box"><label>عدد الشركاء</label><strong>${data.length - 1}</strong></div>
    <div class="info-box"><label>حالة التقسيم</label><strong style="color:#2e7d32;">${document.getElementById("summary-status") ? document.getElementById("summary-status").innerText : "-"}</strong></div>
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
    ["الطول الأيمن (م)", l1, "الطول الأيسر (م)", l2],
    ["العرض الأول (م)", w1, "العرض الثاني (م)", w2],
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
    <!-- الخطوة 1: حساب متوسط الطول -->
    <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px;">
      <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة 1: حساب متوسط الطول</strong>
      <code style="font-family: monospace; font-size: 14px; background: #f5f5f5; padding: 4px 8px; border-radius: 4px; display: inline-block; direction: ltr; margin-top: 4px;">
        (${l1} + ${l2}) ÷ 2<br>= ${l.toFixed(4)} م
      </code>
    </div>

    <!-- الخطوة 2: حساب متوسط العرض -->
    <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px;">
      <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة 2: حساب متوسط العرض</strong>
      <code style="font-family: monospace; font-size: 14px; background: #f5f5f5; padding: 4px 8px; border-radius: 4px; display: inline-block; direction: ltr; margin-top: 4px;">
        (${w1} + ${w2}) ÷ 2<br>= ${w.toFixed(4)} م
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
          const t = (piece.leftLine - l1) / (l2 - l1);
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

  stepsContainer.innerHTML = html;

  // إذا كانت اللوحة مفتوحة، نقوم بتحديث ارتفاعها المناسب لتفادي قص المحتوى
  if (isStepsOpen) {
    const container = document.getElementById("calculation-steps-container");
    if (container) {
      container.style.maxHeight = container.scrollHeight + "px";
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

let widthChangeTimer = null;

function onWidthChange(input, type) {
  if (widthChangeTimer) clearTimeout(widthChangeTimer);
  widthChangeTimer = setTimeout(() => {
    onWidthChangeActual(input, type);
  }, 250); // 250ms debounce
}

function onWidthChangeActual(input, type) {
  if (isEditing) return;
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

// ===================================================
// لوحة المفاتيح الرقمية المخصصة (Custom Virtual Numpad)
// ===================================================
let activeInput = null;

function isNumericInput(el) {
  if (!el || el.tagName !== "INPUT") return false;
  if (el.type === "number") return true;
  if (el.classList.contains("partner-shares") || 
      el.classList.contains("partner-carats") || 
      el.classList.contains("partner-feddans") || 
      el.classList.contains("partner-fraction") || 
      el.classList.contains("partner-width-bottom") || 
      el.classList.contains("partner-width-top")) {
    return true;
  }
  if (el.id === "length1" || el.id === "length2" || el.id === "width1" || el.id === "width2" || el.id === "other-carat-area") {
    return true;
  }
  return false;
}

function finishEditingField(field) {
  if (!field) return;
  if (!isEditing) return;
  
  isEditing = false;
  activeFieldBefore = null;
  
  if (field.classList.contains("partner-width-bottom")) {
    onWidthChangeActual(field, "bottom");
  } else if (field.classList.contains("partner-width-top")) {
    onWidthChangeActual(field, "top");
  } else {
    saveAndCalcImmediate();
  }
}

function showCustomNumpad() {
  const numpad = document.getElementById("custom-numpad");
  if (!numpad) return;

  numpad.classList.add("visible");
  document.body.style.paddingBottom = "270px"; // حجز مساحة لعدم تغطية الحقول
  
  // إخفاء شريط التنقل السفلي لتجنب التداخل مع لوحة المفاتيح
  const nav = document.querySelector(".nav");
  if (nav) {
    nav.style.setProperty("display", "none", "important");
  }
  
  if (activeInput) {
    setTimeout(() => {
      activeInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  }
}

function hideCustomNumpad() {
  const numpad = document.getElementById("custom-numpad");
  if (!numpad) return;

  numpad.classList.remove("visible");
  document.body.style.paddingBottom = "0px";
  
  // إعادة إظهار شريط التنقل السفلي
  const nav = document.querySelector(".nav");
  if (nav) {
    nav.style.setProperty("display", "flex", "important");
  }
}

function insertAtCursor(input, char) {
  if (!input) return;
  const start = input.selectionStart || 0;
  const end = input.selectionEnd || 0;
  const text = input.value;
  
  if (char === ",") char = ".";
  
  const newText = text.substring(0, start) + char + text.substring(end);
  input.value = newText;
  
  const newCursorPos = start + char.length;
  input.focus(); // إبقاء التركيز داخل الحقل
  input.setSelectionRange(newCursorPos, newCursorPos);
  
  // تحديث الحسابات تلقائياً
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function handleBackspace(input) {
  if (!input) return;
  const start = input.selectionStart || 0;
  const end = input.selectionEnd || 0;
  const text = input.value;
  
  let newText = "";
  let newCursorPos = 0;
  
  if (start === end) {
    if (start > 0) {
      newText = text.substring(0, start - 1) + text.substring(start);
      newCursorPos = start - 1;
    } else {
      return;
    }
  } else {
    newText = text.substring(0, start) + text.substring(end);
    newCursorPos = start;
  }
  
  input.value = newText;
  input.focus(); // إبقاء التركيز داخل الحقل
  input.setSelectionRange(newCursorPos, newCursorPos);
  
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function moveFocus(direction) {
  const inputs = Array.from(document.querySelectorAll("input")).filter(isNumericInput);
  if (inputs.length === 0) return;
  
  let index = inputs.indexOf(activeInput);
  if (index === -1) {
    inputs[0].focus();
    return;
  }
  
  if (direction === "next") {
    index = (index + 1) % inputs.length;
  } else {
    index = (index - 1 + inputs.length) % inputs.length;
  }
  
  inputs[index].focus();
  inputs[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// تهيئة مستمعي الأحداث للوحة المفاتيح الافتراضية المخصصة
document.addEventListener("DOMContentLoaded", function() {
  // مستمعي التركيز
  document.addEventListener("focusin", function(e) {
    const target = e.target;
    if (target && target.tagName === "INPUT") {
      // إذا كنا نعدل حقلاً آخر سابقاً، ننهي تعديله أولاً لتشغيل التحقق والحساب
      if (isEditing && activeFieldBefore && activeFieldBefore !== target) {
        finishEditingField(activeFieldBefore);
      }
      
      isEditing = true;
      activeFieldBefore = target;
      
      if (isNumericInput(target)) {
        if (target.getAttribute("inputmode") !== "none") {
          target.setAttribute("inputmode", "none");
        }
        activeInput = target;
        showCustomNumpad();
        
        // تحديد النص بالكامل عند التركيز (Select All)
        setTimeout(() => {
          if (target === activeInput) {
            target.select();
            target.setSelectionRange(0, target.value.length);
          }
        }, 50);
      }
    }
  });

  document.addEventListener("focusout", function(e) {
    setTimeout(() => {
      // إذا كان التركيز قد انتقل إلى حقل رقمي آخر أو لوحة المفاتيح المخصصة، لا نغلقها
      if (document.activeElement && (isNumericInput(document.activeElement) || document.activeElement.closest("#custom-numpad"))) {
        return;
      }
      
      // إذا كنا نخرج من جميع حقول الإدخال، ننهي وضع التحرير ونحسب
      if (isEditing && activeFieldBefore) {
        const nextActive = document.activeElement;
        const isNextInput = nextActive && nextActive.tagName === "INPUT";
        if (!isNextInput) {
          finishEditingField(activeFieldBefore);
        }
      }
      
      hideCustomNumpad();
    }, 100);
  });

  // منع إدخال الأحرف من لوحة المفاتيح الحقيقية (للكمبيوتر ولحماية الحقول)
  document.addEventListener("keydown", function(e) {
    const target = e.target;
    if (target && target.tagName === "INPUT") {
      if (e.key === "Enter") {
        target.blur();
        return;
      }
    }

    if (isNumericInput(e.target)) {
      const key = e.key;
      const allowedKeys = ["Backspace", "Delete", "Tab", "Enter", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Escape"];
      if (allowedKeys.includes(key)) {
        return; // السماح بالتحكم والحذف
      }
      // السماح بنسخ ولصق واختيار الكل
      if (e.ctrlKey || e.metaKey) {
        return;
      }
      // منع أي حرف ليس رقمًا أو علامة عشرية
      const isDigit = /^[0-9]$/.test(key);
      const isSeparator = key === "." || key === "," || key === "،";
      if (!isDigit && !isSeparator) {
        e.preventDefault();
        return;
      }
      // تحويل الفاصلة تلقائياً إلى نقطة
      if (key === "," || key === "،") {
        e.preventDefault();
        insertAtCursor(e.target, ".");
      }
    }
  });

  // منع لصق نصوص تحتوي على أحرف غير رقمية وتحويل الفواصل
  document.addEventListener("paste", function(e) {
    if (isNumericInput(e.target)) {
      const clipboardData = e.clipboardData || window.clipboardData;
      const pastedData = clipboardData.getData("Text");
      
      let cleanData = pastedData.replace(/，|،,/g, ".");
      cleanData = cleanData.replace(/[^0-9.]/g, "");
      
      e.preventDefault();
      insertAtCursor(e.target, cleanData);
    }
  });

  // نقرات أزرار لوحة المفاتيح
  const numpad = document.getElementById("custom-numpad");
  if (numpad) {
    numpad.querySelectorAll(".numpad-key").forEach(key => {
      let keyTriggered = false;
      const handleKeyPress = function(e) {
        e.preventDefault(); // يمنع blur على جميع المنصات والهواتف (بما فيها آيفون وأندرويد)
        
        if (keyTriggered) return;
        keyTriggered = true;
        setTimeout(() => { keyTriggered = false; }, 120);
        
        if (!activeInput) return;
        
        const val = key.getAttribute("data-val");
        if (val === "close") {
          const field = activeInput;
          if (activeInput) {
            activeInput.blur();
          }
          hideCustomNumpad();
          if (isEditing && field) {
            finishEditingField(field);
          }
        } else if (val === "backspace") {
          handleBackspace(activeInput);
        } else if (val === "next") {
          moveFocus("next");
        } else if (val === "prev") {
          moveFocus("prev");
        } else {
          insertAtCursor(activeInput, val);
        }
      };

      // ربط كافة الأحداث المسببة لسرقة التركيز لضمان التوافق المطلق
      ["pointerdown", "touchstart", "mousedown"].forEach(evtName => {
        key.addEventListener(evtName, handleKeyPress, { passive: false });
      });
    });
  }
});
