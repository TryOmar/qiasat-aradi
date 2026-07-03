let currentInputMethod = "carats";
let croquisScale = 1;
let croquisTranslateX = 0;
let croquisTranslateY = 0;
let isDragging = false;
let startDragX = 0;
let startDragY = 0;
let showCroquisNames = true;
let showCroquisMeasurements = true;

document.addEventListener("DOMContentLoaded", function () {
  loadData();
  
  // Set up event listeners
  const list = document.getElementById("partners-list");
  if (list.children.length === 0) {
    addNewPartnerRow();
  }
  renderHeaderAndFooter();
  calculate();
  
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
  
  container.addEventListener("mousedown", (e) => {
    isDragging = true;
    startDragX = e.clientX - croquisTranslateX;
    startDragY = e.clientY - croquisTranslateY;
    container.style.cursor = "grabbing";
  });
  
  window.addEventListener("mouseup", () => {
    isDragging = false;
    container.style.cursor = "grab";
  });
  
  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    croquisTranslateX = e.clientX - startDragX;
    croquisTranslateY = e.clientY - startDragY;
    updateCroquisTransform();
  });
  
  container.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomCroquis(1.1);
    } else {
      zoomCroquis(0.9);
    }
  });
}

function zoomCroquis(factor) {
  croquisScale *= factor;
  updateCroquisTransform();
}

function resetCroquis() {
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
}

function toggleCroquisNames() {
  const chk = document.getElementById("chk-toggle-names");
  if (chk) {
    showCroquisNames = chk.checked;
  }
  renderCroquis();
}

function toggleCroquisMeasurements() {
  const chk = document.getElementById("chk-toggle-meas");
  if (chk) {
    showCroquisMeasurements = chk.checked;
  }
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

  const partners = [];
  const rows = document.querySelectorAll("#partners-list .partner-row");
  rows.forEach(row => {
    if (currentInputMethod === "carats") {
      partners.push({
        name: row.querySelector(".partner-name").value,
        feddans: row.querySelector(".partner-feddans") ? row.querySelector(".partner-feddans").value : "",
        carats: row.querySelector(".partner-carats") ? row.querySelector(".partner-carats").value : "",
        shares: row.querySelector(".partner-shares") ? row.querySelector(".partner-shares").value : "",
        fraction: ""
      });
    } else {
      partners.push({
        name: row.querySelector(".partner-name").value,
        feddans: "",
        carats: "",
        shares: "",
        fraction: row.querySelector(".partner-fraction") ? row.querySelector(".partner-fraction").value : ""
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

  handleCaratAreaChange(false);

  const list = document.getElementById("partners-list");
  list.innerHTML = "";
  const savedPartners = localStorage.getItem("p11-partners");
  if (savedPartners) {
    try {
      const partners = JSON.parse(savedPartners);
      partners.forEach(p => {
        addNewPartnerRow(p.name, p.feddans, p.carats, p.shares, p.fraction);
      });
    } catch (e) {
      console.error("Error parsing saved partners", e);
    }
  }
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
    saveData();
    calculate();
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
      <p>العرض (م)</p>
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
      <input type="text" id="total-width-calculated" readonly value="0" style="font-weight: bold; background: #222; color: white;">
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
      <p>العرض (م)</p>
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
      <input type="text" id="total-width-calculated" readonly value="0" style="font-weight: bold; background: #222; color: white;">
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
        s = ((partnerCarats - (f * 24 + c)) * 24);
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

function addNewPartnerRow(name = "", feddans = "", carats = "", shares = "", fraction = "") {
  const list = document.getElementById("partners-list");
  const row = document.createElement("div");
  row.className = "partner-row";
  
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
        <input type="number" class="partner-shares" placeholder="0" step="any" value="${shares}" oninput="saveAndCalc()">
      </div>
      <div class="col-group carat-group">
        <span class="mobile-label">قيراط</span>
        <input type="number" class="partner-carats" placeholder="0" value="${carats}" oninput="saveAndCalc()">
      </div>
      <div class="col-group feddan-group">
        <span class="mobile-label">فدان</span>
        <input type="number" class="partner-feddans" placeholder="0" value="${feddans}" oninput="saveAndCalc()">
      </div>
      <div class="col-group area-group">
        <span class="mobile-label">المساحة (م²)</span>
        <input type="text" class="partner-area" readonly value="-">
      </div>
      <div class="col-group percent-group">
        <span class="mobile-label">نسبة (%)</span>
        <input type="text" class="partner-percent" readonly value="-">
      </div>
      <div class="col-group width-group">
        <span class="mobile-label">العرض (م)</span>
        <input type="text" class="partner-width" readonly value="-">
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
        <input type="text" class="partner-fraction" placeholder="مثال: 1/4" value="${fraction}" oninput="saveAndCalc()">
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
      <div class="col-group width-group">
        <span class="mobile-label">العرض (م)</span>
        <input type="text" class="partner-width" readonly value="-">
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
    saveAndCalc();
  }
}

function deletePartnerRow(button) {
  const row = button.parentElement;
  row.remove();
  saveAndCalc();
}

function saveAndCalc() {
  saveData();
  calculate();
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

function calculate() {
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
    el.innerText = formatNum(totalAreaM2);
  });
  
  if (document.getElementById("calc-avg-width")) {
    document.getElementById("calc-avg-width").innerText = formatNum(w);
  }
  if (document.getElementById("calc-avg-length")) {
    document.getElementById("calc-avg-length").innerText = formatNum(l);
  }
  if (document.getElementById("calc-perimeter")) {
    document.getElementById("calc-perimeter").innerText = formatNum(perimeter);
  }

  // Update formula text:
  if (document.getElementById("formula-details")) {
    document.getElementById("formula-details").innerText = `${formatNum(w1)} + ${formatNum(w2)} = 2 × ${formatNum(w)}`;
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

  const rows = document.querySelectorAll("#partners-list .partner-row");
  let cumulativeArea = 0;
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
    
    if (document.getElementById("total-shares-entered")) document.getElementById("total-shares-entered").value = formatNum(displayTotalShares);
    if (document.getElementById("total-carats-entered")) document.getElementById("total-carats-entered").value = displayTotalCarats;
    if (document.getElementById("total-feddans-entered")) document.getElementById("total-feddans-entered").value = displayTotalFeddans;
  } else {
    rows.forEach(row => {
      const fracInput = row.querySelector(".partner-fraction");
      const fracVal = parseFraction(fracInput ? fracInput.value : "");
      totalFractionsEntered += fracVal;
    });
    if (document.getElementById("total-fraction-entered")) {
      document.getElementById("total-fraction-entered").value = formatNum(totalFractionsEntered * 100) + "%";
    }
  }

  const k = (l2 - l1) / w; 
  let lastX = 0;
  let totalDistributedArea = 0;
  
  window.calculatedPieces = [];

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
      partnerCarats = partnerAreaM2 / caratArea;
    }
    
    if (currentInputMethod === "fractions") {
      const equivInput = row.querySelector(".partner-equiv");
      if (equivInput) {
        if (partnerCarats > 0) {
          const f_eq = Math.floor(partnerCarats / 24);
          const c_eq = Math.floor(partnerCarats % 24);
          const s_eq = ((partnerCarats - (f_eq * 24 + c_eq)) * 24);
          equivInput.value = `${formatNum(s_eq)} س، ${c_eq} ق، ${f_eq} ف`;
        } else {
          equivInput.value = "-";
        }
      }
    }
    
    // 2. Update Area (المساحة)
    const areaInput = row.querySelector(".partner-area");
    if (areaInput) areaInput.value = formatNum(partnerAreaM2);

    // 3. Update Percentage (النسبة)
    const percentInput = row.querySelector(".partner-percent");
    if (percentInput) {
      const pct = totalAreaM2 > 0 ? (partnerAreaM2 / totalAreaM2) * 100 : 0;
      percentInput.value = formatNum(pct) + " %";
    }
    
    totalDistributedArea += partnerAreaM2;
    cumulativeArea += partnerAreaM2;

    let x_i = 0;
    if (Math.abs(k) < 1e-9) {
      x_i = cumulativeArea / l1;
    } else {
      const termInsideSqrt = Math.max(0, l1 * l1 + 2 * k * cumulativeArea);
      x_i = (Math.sqrt(termInsideSqrt) - l1) / k;
    }

    if (x_i > w) {
      x_i = w;
    }

    const partnerWidth = x_i - lastX;
    const dividingLineLength = l1 + k * x_i;

    row.querySelector(".partner-width").value = formatNum(partnerWidth);
    row.querySelector(".partner-cum-width").value = `${formatNum(lastX)} م إلى ${formatNum(x_i)} م`;
    row.querySelector(".partner-div-line").value = formatNum(dividingLineLength);
    
    const partnerName = row.querySelector(".partner-name").value || `شريك ${index + 1}`;
    window.calculatedPieces.push({
        name: partnerName,
        startX: lastX,
        endX: x_i,
        width: partnerWidth,
        area: partnerAreaM2,
        divLine: dividingLineLength,
        leftLine: l1 + k * lastX 
    });

    lastX = x_i;
  });

  // Update Footer totals for area and percentage
  if (document.getElementById("total-area-distributed")) {
    document.getElementById("total-area-distributed").value = formatNum(totalDistributedArea);
  }
  if (document.getElementById("total-percent-distributed")) {
    const totalPct = totalAreaM2 > 0 ? (totalDistributedArea / totalAreaM2) * 100 : 0;
    document.getElementById("total-percent-distributed").value = formatNum(totalPct) + " %";
  }
  if (document.getElementById("total-width-calculated")) {
    document.getElementById("total-width-calculated").value = formatNum(lastX);
  }

  const remainingArea = totalAreaM2 - totalDistributedArea;
  
  // Update summaries
  if (document.getElementById("summary-total-area")) {
    document.getElementById("summary-total-area").innerText = formatNum(totalAreaM2) + " م²";
  }
  if (document.getElementById("summary-rem-area")) {
    document.getElementById("summary-rem-area").innerText = formatNum(remainingArea) + " م²";
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
    document.getElementById("summary-total-width").innerText = formatNum(lastX) + " م";
  }

  if (document.getElementById("info-partners-count")) {
    document.getElementById("info-partners-count").innerText = rows.length;
  }
  if (document.getElementById("info-distributed-area")) {
    document.getElementById("info-distributed-area").innerText = formatNum(totalDistributedArea) + " م²";
  }
  if (document.getElementById("info-distributed-percent")) {
    const distPct = totalAreaM2 > 0 ? (totalDistributedArea / totalAreaM2) * 100 : 0;
    document.getElementById("info-distributed-percent").innerText = formatNum(distPct) + " %";
  }
  if (document.getElementById("info-last-div-line")) {
    let lastDivLine = l1;
    if (window.calculatedPieces.length > 0) {
      lastDivLine = window.calculatedPieces[window.calculatedPieces.length - 1].divLine;
    }
    document.getElementById("info-last-div-line").innerText = formatNum(lastDivLine) + " م";
  }

  if (document.getElementById("rem-area-m2")) {
    document.getElementById("rem-area-m2").innerText = formatNum(remainingArea);
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
    document.getElementById("rem-shares").innerText = formatNum(remShares);

    const color = isNegative ? "red" : "black";
    document.getElementById("rem-acres").style.color = color;
    document.getElementById("rem-carats").style.color = color;
    document.getElementById("rem-shares").style.color = color;
  }
  
  renderCroquis();
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

function promptDivideEqually() {
  const l1 = parseFloat(document.getElementById("length1").value) || 0;
  const l2 = parseFloat(document.getElementById("length2").value) || 0;
  const w1 = parseFloat(document.getElementById("width1").value) || 0;
  const w2 = parseFloat(document.getElementById("width2").value) || 0;
  
  if (l1 <= 0 || l2 <= 0 || w1 <= 0 || w2 <= 0) {
    alert("الرجاء إدخال أبعاد الأرض الإجمالية أولاً.");
    return;
  }
  
  const w = (w1 + w2) / 2;
  
  const numPartnersStr = prompt("أدخل عدد الشركاء لتوزيع الأرض بينهم بالتساوي:");
  if (!numPartnersStr) return;
  
  const numPartners = parseInt(numPartnersStr);
  if (isNaN(numPartners) || numPartners <= 0) {
    alert("الرجاء إدخال عدد شركاء صحيح.");
    return;
  }
  
  const totalAreaM2 = ((l1 + l2) / 2) * w;
  
  let caratArea = parseFloat(document.getElementById("input-carat-area").value);
  if (caratArea === 0) {
    caratArea = parseFloat(document.getElementById("other-carat-area").value) || 0;
  }
  
  if (caratArea <= 0) {
    alert("الرجاء تحديد مساحة القيراط بالمتر المربع.");
    return;
  }
  
  const list = document.getElementById("partners-list");
  list.innerHTML = "";
  
  if (currentInputMethod === "carats") {
    const totalCarats = totalAreaM2 / caratArea;
    const partnerCarats = totalCarats / numPartners;
    const f = Math.floor(partnerCarats / 24);
    const c = Math.floor(partnerCarats % 24);
    const s = ((partnerCarats - (f * 24 + c)) * 24);
    
    for (let i = 0; i < numPartners; i++) {
      addNewPartnerRow(`شريك ${i + 1}`, f, c, s, "");
    }
  } else {
    for (let i = 0; i < numPartners; i++) {
      addNewPartnerRow(`شريك ${i + 1}`, "", "", "", `1/${numPartners}`);
    }
  }
  
  saveAndCalc();
}

// SVG Croquis Rendering Logic
function renderCroquis() {
  const g = document.getElementById("croquis-content");
  if (!g) return;
  g.innerHTML = ""; 

  const l1 = parseFloat(document.getElementById("length1").value) || 0;
  const l2 = parseFloat(document.getElementById("length2").value) || 0;
  const w1 = parseFloat(document.getElementById("width1").value) || 0;
  const w2 = parseFloat(document.getElementById("width2").value) || 0;
  
  if (l1 <= 0 || l2 <= 0 || w1 <= 0 || w2 <= 0) return;
  
  const w = (w1 + w2) / 2;

  const padding = 60;
  const containerW = 800;
  const containerH = 500;
  const maxLen = Math.max(l1, l2);
  
  const scaleX = (containerW - padding * 2) / w;
  const scaleY = (containerH - padding * 2) / maxLen;
  const drawScale = Math.min(scaleX, scaleY);
  
  const drawnW = w * drawScale;
  const drawnH = maxLen * drawScale;
  const offsetX = (containerW - drawnW) / 2;
  const offsetY = (containerH - drawnH) / 2;

  const mapX = (x) => containerW - (offsetX + x * drawScale); 
  const mapY = (y) => containerH - (offsetY + y * drawScale); 
  
  const k = (l2 - l1) / w;
  
  // Draw the main outer land polygon
  const mainX1 = mapX(0);
  const mainX2 = mapX(w);
  const mainY1 = mapY(0);
  const mainY2 = mapY(0);
  const mainY3 = mapY(l2);
  const mainY4 = mapY(l1);
  
  const mainPoly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  mainPoly.setAttribute("points", `${mainX1},${mainY1} ${mainX2},${mainY2} ${mainX2},${mainY3} ${mainX1},${mainY4}`);
  mainPoly.setAttribute("fill", "#f1f8e9");
  mainPoly.setAttribute("stroke", "#2e7d32");
  mainPoly.setAttribute("stroke-width", "2");
  g.appendChild(mainPoly);
  
  if (window.calculatedPieces && window.calculatedPieces.length > 0) {
      window.calculatedPieces.forEach((piece, index) => {
          const x1 = mapX(piece.startX);
          const x2 = mapX(piece.endX);
          const y1 = mapY(0);
          const y2 = mapY(0);
          const y3 = mapY(l1 + k * piece.endX);
          const y4 = mapY(l1 + k * piece.startX);
          
          const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
          poly.setAttribute("points", `${x1},${y1} ${x2},${y2} ${x2},${y3} ${x1},${y4}`);
          poly.setAttribute("fill", index % 2 === 0 ? "#e8f5e9" : "#c8e6c9");
          poly.setAttribute("stroke", "#2e7d32");
          poly.setAttribute("stroke-width", "1.5");
          g.appendChild(poly);
          
          const cx = (x1 + x2) / 2;
          const cy = mapY((l1 + k * (piece.startX + piece.endX) / 2) / 2); 
          
          if (showCroquisNames) {
              const textName = document.createElementNS("http://www.w3.org/2000/svg", "text");
              textName.setAttribute("x", cx);
              textName.setAttribute("y", cy - 10);
              textName.setAttribute("text-anchor", "middle");
              textName.setAttribute("font-family", "Cairo, sans-serif");
              textName.setAttribute("font-size", "14");
              textName.setAttribute("font-weight", "bold");
              textName.setAttribute("fill", "#1b5e20");
              textName.textContent = piece.name;
              g.appendChild(textName);
          }
          
          if (showCroquisMeasurements) {
              const textArea = document.createElementNS("http://www.w3.org/2000/svg", "text");
              textArea.setAttribute("x", cx);
              textArea.setAttribute("y", cy + 10);
              textArea.setAttribute("text-anchor", "middle");
              textArea.setAttribute("font-family", "Cairo, sans-serif");
              textArea.setAttribute("font-size", "12");
              textArea.setAttribute("fill", "#333");
              textArea.textContent = formatNum(piece.area) + " م²";
              g.appendChild(textArea);
              
              const textWidth = document.createElementNS("http://www.w3.org/2000/svg", "text");
              textWidth.setAttribute("x", cx);
              textWidth.setAttribute("y", mapY(0) + 15);
              textWidth.setAttribute("text-anchor", "middle");
              textWidth.setAttribute("font-family", "Cairo, sans-serif");
              textWidth.setAttribute("font-size", "11");
              textWidth.setAttribute("fill", "#c62828");
              textWidth.textContent = "ع: " + formatNum(piece.width);
              g.appendChild(textWidth);
          }
          
          if (index > 0 && showCroquisMeasurements) {
              const textDiv = document.createElementNS("http://www.w3.org/2000/svg", "text");
              textDiv.setAttribute("x", x1 + 5);
              textDiv.setAttribute("y", mapY(piece.leftLine / 2));
              textDiv.setAttribute("text-anchor", "start");
              textDiv.setAttribute("font-family", "Cairo, sans-serif");
              textDiv.setAttribute("font-size", "11");
              textDiv.setAttribute("fill", "#d84315");
              textDiv.textContent = formatNum(piece.leftLine);
              textDiv.setAttribute("transform", `rotate(90, ${x1+5}, ${mapY(piece.leftLine / 2)})`);
              g.appendChild(textDiv);
          }
      });
  }

  if (showCroquisMeasurements) {
      const xRight = mapX(0);
      const textRight = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textRight.setAttribute("x", xRight - 10);
      textRight.setAttribute("y", mapY(l1 / 2));
      textRight.setAttribute("text-anchor", "end");
      textRight.setAttribute("font-family", "Cairo, sans-serif");
      textRight.setAttribute("font-size", "14");
      textRight.setAttribute("font-weight", "bold");
      textRight.setAttribute("fill", "#000");
      textRight.textContent = "الطول الأيمن: " + l1;
      textRight.setAttribute("transform", `rotate(-90, ${xRight-10}, ${mapY(l1 / 2)})`);
      g.appendChild(textRight);

      const xLeft = mapX(w);
      const textLeft = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textLeft.setAttribute("x", xLeft + 10);
      textLeft.setAttribute("y", mapY(l2 / 2));
      textLeft.setAttribute("text-anchor", "start");
      textLeft.setAttribute("font-family", "Cairo, sans-serif");
      textLeft.setAttribute("font-size", "14");
      textLeft.setAttribute("font-weight", "bold");
      textLeft.setAttribute("fill", "#000");
      textLeft.textContent = "الطول الأيسر: " + l2;
      textLeft.setAttribute("transform", `rotate(-90, ${xLeft+10}, ${mapY(l2 / 2)})`);
      g.appendChild(textLeft);

      const cxTop = mapX(w/2);
      const textTop = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textTop.setAttribute("x", cxTop);
      textTop.setAttribute("y", mapY((l1+l2)/2) - 15); 
      textTop.setAttribute("text-anchor", "middle");
      textTop.setAttribute("font-family", "Cairo, sans-serif");
      textTop.setAttribute("font-size", "14");
      textTop.setAttribute("font-weight", "bold");
      textTop.setAttribute("fill", "#000");
      textTop.textContent = "العرض الثاني: " + w2;
      g.appendChild(textTop);
      
      const cxBot = mapX(w/2);
      const cyBot = mapY(0) + 30;
      const textBot = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textBot.setAttribute("x", cxBot);
      textBot.setAttribute("y", cyBot);
      textBot.setAttribute("text-anchor", "middle");
      textBot.setAttribute("font-family", "Cairo, sans-serif");
      textBot.setAttribute("font-size", "14");
      textBot.setAttribute("font-weight", "bold");
      textBot.setAttribute("fill", "#000");
      textBot.textContent = "العرض الأول: " + w1;
      g.appendChild(textBot);
  }
}

function exportCroquis() {
  const svgNode = document.getElementById("croquis-svg");
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(svgNode);
  
  svgString = svgString.replace('<svg ', '<svg style="background-color: white;" ');
  
  const img = new Image();
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  img.onload = function() {
    const canvas = document.createElement("canvas");
    canvas.width = 1600; 
    canvas.height = 1000;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const a = document.createElement("a");
    a.download = "تقسيم_الأرض_الدلال.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
    URL.revokeObjectURL(url);
  };
  
  img.src = url;
}
