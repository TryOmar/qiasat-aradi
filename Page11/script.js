// Page 11 - Land Division with Different Lengths (Fractions & Carats)

let currentInputMethod = "carats";

document.addEventListener("DOMContentLoaded", function () {
  loadData();
  
  // Set up event listeners
  const list = document.getElementById("partners-list");
  if (list.children.length === 0) {
    addNewPartnerRow();
  }
  renderHeaderAndFooter();
  calculate();
});

function saveData() {
  sessionStorage.setItem("p11-length1", document.getElementById("length1").value);
  sessionStorage.setItem("p11-length2", document.getElementById("length2").value);
  sessionStorage.setItem("p11-width", document.getElementById("total-width").value);
  sessionStorage.setItem("p11-carat-area", document.getElementById("input-carat-area").value);
  sessionStorage.setItem("p11-other-carat-area", document.getElementById("other-carat-area").value);
  sessionStorage.setItem("p11-input-method", document.getElementById("share-input-method").value);

  // Save partners list
  const partners = [];
  const rows = document.querySelectorAll("#partners-list .partner-row");
  rows.forEach(row => {
    if (currentInputMethod === "carats") {
      partners.push({
        name: row.querySelector(".partner-name").value,
        carats: row.querySelector(".partner-carats") ? row.querySelector(".partner-carats").value : "",
        shares: row.querySelector(".partner-shares") ? row.querySelector(".partner-shares").value : "",
        fraction: ""
      });
    } else {
      partners.push({
        name: row.querySelector(".partner-name").value,
        carats: "",
        shares: "",
        fraction: row.querySelector(".partner-fraction") ? row.querySelector(".partner-fraction").value : ""
      });
    }
  });
  sessionStorage.setItem("p11-partners", JSON.stringify(partners));
}

function loadData() {
  document.getElementById("length1").value = sessionStorage.getItem("p11-length1") || "";
  document.getElementById("length2").value = sessionStorage.getItem("p11-length2") || "";
  document.getElementById("total-width").value = sessionStorage.getItem("p11-width") || "";
  document.getElementById("input-carat-area").value = sessionStorage.getItem("p11-carat-area") || "175.035";
  document.getElementById("other-carat-area").value = sessionStorage.getItem("p11-other-carat-area") || "";
  
  const savedMethod = sessionStorage.getItem("p11-input-method") || "carats";
  document.getElementById("share-input-method").value = savedMethod;
  currentInputMethod = savedMethod;

  // Show/hide other carat area field
  handleCaratAreaChange(false);

  // Load partners list
  const list = document.getElementById("partners-list");
  list.innerHTML = "";
  const savedPartners = sessionStorage.getItem("p11-partners");
  if (savedPartners) {
    try {
      const partners = JSON.parse(savedPartners);
      partners.forEach(p => {
        addNewPartnerRow(p.name, p.carats, p.shares, p.fraction);
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
      <p>الشريك</p>
      <p>قيراط</p>
      <p>سهم</p>
      <p>العرض (م)</p>
      <p>العلامة (م)</p>
      <p>الفاصل (م)</p>
      <p></p>
    `;
    
    footerContainer.innerHTML = `
      <input type="text" readonly value="الإجمالي" style="font-weight: bold; background: #222; color: white;">
      <input type="text" id="total-carats-entered" readonly value="0" style="font-weight: bold; background: #222; color: white;">
      <input type="text" id="total-shares-entered" readonly value="0" style="font-weight: bold; background: #222; color: white;">
      <input type="text" id="total-width-calculated" readonly value="0.00" style="font-weight: bold; background: #222; color: white;">
      <input type="text" readonly value="-" style="font-weight: bold; background: #222; color: white;">
      <input type="text" readonly value="-" style="font-weight: bold; background: #222; color: white;">
      <input type="text" readonly value="-" style="font-weight: bold; background: #222; color: white;">
    `;
  } else {
    headerContainer.innerHTML = `
      <p>الشريك</p>
      <p>النسبة / الكسر</p>
      <p>تعادل (ق.س)</p>
      <p>العرض (م)</p>
      <p>العلامة (م)</p>
      <p>الفاصل (م)</p>
      <p></p>
    `;
    
    footerContainer.innerHTML = `
      <input type="text" readonly value="الإجمالي" style="font-weight: bold; background: #222; color: white;">
      <input type="text" id="total-fraction-entered" readonly value="0.0%" style="font-weight: bold; background: #222; color: white;">
      <input type="text" readonly value="-" style="font-weight: bold; background: #222; color: white;">
      <input type="text" id="total-width-calculated" readonly value="0.00" style="font-weight: bold; background: #222; color: white;">
      <input type="text" readonly value="-" style="font-weight: bold; background: #222; color: white;">
      <input type="text" readonly value="-" style="font-weight: bold; background: #222; color: white;">
      <input type="text" readonly value="-" style="font-weight: bold; background: #222; color: white;">
    `;
  }
}

function handleInputMethodChange() {
  currentInputMethod = document.getElementById("share-input-method").value;
  renderHeaderAndFooter();
  
  // Re-render all rows to match the new input method and convert values if possible
  const list = document.getElementById("partners-list");
  const rows = list.querySelectorAll(".partner-row");
  const savedPartners = [];
  
  const l1 = parseFloat(document.getElementById("length1").value) || 0;
  const l2 = parseFloat(document.getElementById("length2").value) || 0;
  const w = parseFloat(document.getElementById("total-width").value) || 0;
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
      
      let c = "";
      let s = "";
      if (totalAreaM2 > 0 && caratArea > 0 && fracVal > 0) {
        const partnerCarats = fracVal * (totalAreaM2 / caratArea);
        c = Math.floor(partnerCarats);
        s = parseFloat(((partnerCarats - c) * 24).toFixed(3));
      }
      savedPartners.push({ name, carats: c, shares: s, fraction: "" });
    } else {
      const caratInput = row.querySelector(".partner-carats");
      const shareInput = row.querySelector(".partner-shares");
      const c = parseFloat(caratInput ? caratInput.value : 0) || 0;
      const s = parseFloat(shareInput ? shareInput.value : 0) || 0;
      
      const partnerCarats = c + s / 24;
      
      let fracStr = "";
      if (totalAreaM2 > 0 && caratArea > 0 && partnerCarats > 0) {
        const totalCaratsAvailable = totalAreaM2 / caratArea;
        const fracVal = partnerCarats / totalCaratsAvailable;
        fracStr = fracVal.toFixed(4);
      }
      savedPartners.push({ name, carats: "", shares: "", fraction: fracStr });
    }
  });
  
  list.innerHTML = "";
  savedPartners.forEach(p => {
    addNewPartnerRow(p.name, p.carats, p.shares, p.fraction);
  });
  
  saveAndCalc();
}

function addNewPartnerRow(name = "", carats = "", shares = "", fraction = "") {
  const list = document.getElementById("partners-list");
  const row = document.createElement("div");
  row.className = "partner-row";
  
  if (currentInputMethod === "carats") {
    row.innerHTML = `
      <div class="col-group name-group">
        <span class="mobile-label">الشريك</span>
        <input type="text" class="partner-name" placeholder="اسم الشريك" value="${name}" oninput="saveAndCalc()">
      </div>
      <div class="col-group carat-group">
        <span class="mobile-label">قيراط</span>
        <input type="number" class="partner-carats" placeholder="0" value="${carats}" oninput="saveAndCalc()">
      </div>
      <div class="col-group share-group">
        <span class="mobile-label">سهم</span>
        <input type="number" class="partner-shares" placeholder="0" value="${shares}" oninput="saveAndCalc()">
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
      <div class="col-group name-group">
        <span class="mobile-label">الشريك</span>
        <input type="text" class="partner-name" placeholder="اسم الشريك" value="${name}" oninput="saveAndCalc()">
      </div>
      <div class="col-group fraction-group">
        <span class="mobile-label">النسبة / الكسر</span>
        <input type="text" class="partner-fraction" placeholder="مثال: 1/4" value="${fraction}" oninput="saveAndCalc()">
      </div>
      <div class="col-group equiv-group">
        <span class="mobile-label">تعادل (ق.س)</span>
        <input type="text" class="partner-equiv" readonly value="-">
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
  if (name || carats || shares || fraction) {
    // Loaded from storage
  } else {
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
  // Convert Arabic numerals to English
  str = str.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).trim();
  
  // Handle text terms commonly used by farmers
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

function calculate() {
  const l1 = parseFloat(document.getElementById("length1").value) || 0;
  const l2 = parseFloat(document.getElementById("length2").value) || 0;
  const w = parseFloat(document.getElementById("total-width").value) || 0;

  if (l1 <= 0 || l2 <= 0 || w <= 0) {
    document.getElementById("calc-area-m2").innerText = "0.0";
    document.getElementById("calc-area-acre").innerText = "0";
    document.getElementById("calc-area-carat").innerText = "0";
    document.getElementById("calc-area-shares").innerText = "0.00";
    
    const totalCaratsEnt = document.getElementById("total-carats-entered");
    const totalSharesEnt = document.getElementById("total-shares-entered");
    const totalFracEnt = document.getElementById("total-fraction-entered");
    
    if (totalCaratsEnt) totalCaratsEnt.value = "0";
    if (totalSharesEnt) totalSharesEnt.value = "0";
    if (totalFracEnt) totalFracEnt.value = "0.0%";
    
    document.getElementById("total-width-calculated").value = "0.00";
    
    document.getElementById("rem-shares").innerText = "0";
    document.getElementById("rem-carats").innerText = "0";
    document.getElementById("rem-acres").innerText = "0";
    document.getElementById("calc-total-width-val").innerText = "0";
    
    const rows = document.querySelectorAll("#partners-list .partner-row");
    rows.forEach(row => {
      row.querySelector(".partner-width").value = "-";
      row.querySelector(".partner-cum-width").value = "-";
      row.querySelector(".partner-div-line").value = "-";
    });
    return;
  }

  // Calculate total area of the trapezoid
  const totalAreaM2 = ((l1 + l2) / 2) * w;
  document.getElementById("calc-area-m2").innerText = totalAreaM2.toFixed(3);
  document.getElementById("calc-total-width-val").innerText = w.toFixed(2);

  // Get carat area
  let caratArea = parseFloat(document.getElementById("input-carat-area").value);
  if (caratArea === 0) {
    caratArea = parseFloat(document.getElementById("other-carat-area").value) || 0;
  }

  // Convert total area to Feddans, Qirats, Sahms
  if (caratArea > 0) {
    const totalCarats = totalAreaM2 / caratArea;
    const acres = Math.floor(totalCarats / 24);
    const carats = Math.floor(totalCarats % 24);
    const shares = ((totalCarats % 1) * 24).toFixed(3);
    
    document.getElementById("calc-area-acre").innerText = acres;
    document.getElementById("calc-area-carat").innerText = carats;
    document.getElementById("calc-area-shares").innerText = shares;
  }

  // Now, calculate each partner's share
  const rows = document.querySelectorAll("#partners-list .partner-row");
  let cumulativeArea = 0;
  let totalCaratsEntered = 0;
  let totalSharesEntered = 0;
  let totalFractionsEntered = 0;
  
  if (currentInputMethod === "carats") {
    rows.forEach(row => {
      const caratInput = row.querySelector(".partner-carats");
      const shareInput = row.querySelector(".partner-shares");
      const c = parseFloat(caratInput ? caratInput.value : 0) || 0;
      const s = parseFloat(shareInput ? shareInput.value : 0) || 0;
      totalCaratsEntered += c;
      totalSharesEntered += s;
    });
    
    let displayTotalCarats = totalCaratsEntered + Math.floor(totalSharesEntered / 24);
    let displayTotalShares = (totalSharesEntered % 24).toFixed(3);
    
    const totalCaratsEnt = document.getElementById("total-carats-entered");
    const totalSharesEnt = document.getElementById("total-shares-entered");
    if (totalCaratsEnt) totalCaratsEnt.value = displayTotalCarats;
    if (totalSharesEnt) totalSharesEnt.value = displayTotalShares;
  } else {
    rows.forEach(row => {
      const fracInput = row.querySelector(".partner-fraction");
      const fracVal = parseFraction(fracInput ? fracInput.value : "");
      totalFractionsEntered += fracVal;
    });
    const totalFracEnt = document.getElementById("total-fraction-entered");
    if (totalFracEnt) totalFracEnt.value = (totalFractionsEntered * 100).toFixed(1) + "%";
  }

  const k = (l2 - l1) / w; // rate of change of length along width
  let lastX = 0;

  rows.forEach((row, index) => {
    let partnerAreaM2 = 0;
    let partnerCarats = 0;
    
    if (currentInputMethod === "carats") {
      const caratInput = row.querySelector(".partner-carats");
      const shareInput = row.querySelector(".partner-shares");
      const c = parseFloat(caratInput ? caratInput.value : 0) || 0;
      const s = parseFloat(shareInput ? shareInput.value : 0) || 0;
      partnerCarats = c + s / 24;
      partnerAreaM2 = partnerCarats * caratArea;
    } else {
      const fracInput = row.querySelector(".partner-fraction");
      const fracVal = parseFraction(fracInput ? fracInput.value : "");
      partnerAreaM2 = fracVal * totalAreaM2;
      partnerCarats = partnerAreaM2 / caratArea;
    }
    
    // Update the equivalent carats and sahms for fraction method
    if (currentInputMethod === "fractions") {
      const equivInput = row.querySelector(".partner-equiv");
      if (equivInput) {
        if (partnerCarats > 0) {
          const c_eq = Math.floor(partnerCarats);
          const s_eq = ((partnerCarats - c_eq) * 24).toFixed(1);
          equivInput.value = `${c_eq} ق، ${s_eq} س`;
        } else {
          equivInput.value = "-";
        }
      }
    }
    
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

    row.querySelector(".partner-width").value = partnerWidth.toFixed(3);
    row.querySelector(".partner-cum-width").value = `${lastX.toFixed(2)} م إلى ${x_i.toFixed(2)} م`;
    row.querySelector(".partner-div-line").value = dividingLineLength.toFixed(3);

    lastX = x_i;
  });

  document.getElementById("total-width-calculated").value = lastX.toFixed(3);

  // Remaining area calculation
  if (caratArea > 0) {
    let remainingCarats = 0;
    if (currentInputMethod === "carats") {
      const totalCaratsDistributed = totalCaratsEntered + totalSharesEntered / 24;
      const totalCaratsAvailable = totalAreaM2 / caratArea;
      remainingCarats = totalCaratsAvailable - totalCaratsDistributed;
    } else {
      const totalCaratsAvailable = totalAreaM2 / caratArea;
      remainingCarats = (1 - totalFractionsEntered) * totalCaratsAvailable;
    }

    const isNegative = remainingCarats < 0;
    const absRemaining = Math.abs(remainingCarats);

    const remAcres = Math.floor(absRemaining / 24);
    const remCarats = Math.floor(absRemaining % 24);
    const remShares = ((absRemaining % 1) * 24).toFixed(3);

    const prefix = isNegative ? "-" : "";
    document.getElementById("rem-acres").innerText = prefix + remAcres;
    document.getElementById("rem-carats").innerText = remCarats;
    document.getElementById("rem-shares").innerText = remShares;

    const color = isNegative ? "red" : "black";
    document.getElementById("rem-acres").style.color = color;
    document.getElementById("rem-carats").style.color = color;
    document.getElementById("rem-shares").style.color = color;
  }
}

function clearAll() {
  document.getElementById("length1").value = "";
  document.getElementById("length2").value = "";
  document.getElementById("total-width").value = "";
  
  const list = document.getElementById("partners-list");
  list.innerHTML = "";
  addNewPartnerRow();
  
  saveAndCalc();
}

function promptDivideEqually() {
  const l1 = parseFloat(document.getElementById("length1").value) || 0;
  const l2 = parseFloat(document.getElementById("length2").value) || 0;
  const w = parseFloat(document.getElementById("total-width").value) || 0;
  
  if (l1 <= 0 || l2 <= 0 || w <= 0) {
    alert("الرجاء إدخال أبعاد الأرض الإجمالية أولاً (الحد الأيمن، الحد الأيسر، والعرض الكلي).");
    return;
  }
  
  const numPartnersStr = prompt("أدخل عدد الشركاء لتوزيع الأرض بينهم بالتساوي:");
  if (!numPartnersStr) return;
  
  const numPartners = parseInt(numPartnersStr);
  if (isNaN(numPartners) || numPartners <= 0) {
    alert("الرجاء إدخال عدد شركاء صحيح (أكبر من 0).");
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
    const c = Math.floor(partnerCarats);
    const s = parseFloat(((partnerCarats - c) * 24).toFixed(4));
    
    for (let i = 0; i < numPartners; i++) {
      addNewPartnerRow(`شريك ${i + 1}`, c, s, "");
    }
  } else {
    for (let i = 0; i < numPartners; i++) {
      addNewPartnerRow(`شريك ${i + 1}`, "", "", `1/${numPartners}`);
    }
  }
  
  saveAndCalc();
}
