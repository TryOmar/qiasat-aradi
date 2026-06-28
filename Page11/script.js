// Page 11 - Land Division with Different Lengths
document.addEventListener("DOMContentLoaded", function () {
  loadData();
  // If no partners exist, add one default row
  const list = document.getElementById("partners-list");
  if (list.children.length === 0) {
    addNewPartnerRow();
  }
  calculate();
});

function saveData() {
  sessionStorage.setItem("p11-length1", document.getElementById("length1").value);
  sessionStorage.setItem("p11-length2", document.getElementById("length2").value);
  sessionStorage.setItem("p11-width", document.getElementById("total-width").value);
  sessionStorage.setItem("p11-carat-area", document.getElementById("input-carat-area").value);
  sessionStorage.setItem("p11-other-carat-area", document.getElementById("other-carat-area").value);

  // Save partners list
  const partners = [];
  const rows = document.querySelectorAll("#partners-list .partner-row");
  rows.forEach(row => {
    partners.push({
      name: row.querySelector(".partner-name").value,
      carats: row.querySelector(".partner-carats").value,
      shares: row.querySelector(".partner-shares").value
    });
  });
  sessionStorage.setItem("p11-partners", JSON.stringify(partners));
}

function loadData() {
  document.getElementById("length1").value = sessionStorage.getItem("p11-length1") || "";
  document.getElementById("length2").value = sessionStorage.getItem("p11-length2") || "";
  document.getElementById("total-width").value = sessionStorage.getItem("p11-width") || "";
  document.getElementById("input-carat-area").value = sessionStorage.getItem("p11-carat-area") || "175.035";
  document.getElementById("other-carat-area").value = sessionStorage.getItem("p11-other-carat-area") || "";

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
        addNewPartnerRow(p.name, p.carats, p.shares);
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

function addNewPartnerRow(name = "", carats = "", shares = "") {
  const list = document.getElementById("partners-list");
  const row = document.createElement("div");
  row.className = "partner-row";
  
  row.innerHTML = `
    <input type="text" class="partner-name" placeholder="اسم الشريك" value="${name}" oninput="saveAndCalc()">
    <input type="number" class="partner-carats" placeholder="0" value="${carats}" oninput="saveAndCalc()">
    <input type="number" class="partner-shares" placeholder="0" value="${shares}" oninput="saveAndCalc()">
    <input type="text" class="partner-width" readonly value="-">
    <input type="text" class="partner-cum-width" readonly value="-">
    <input type="text" class="partner-div-line" readonly value="-">
    <button type="button" class="delete-row-btn" onclick="deletePartnerRow(this)">×</button>
  `;
  
  list.appendChild(row);
  if (name || carats || shares) {
    // Loaded from storage, don't trigger calculation inside loop
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

function calculate() {
  const l1 = parseFloat(document.getElementById("length1").value) || 0;
  const l2 = parseFloat(document.getElementById("length2").value) || 0;
  const w = parseFloat(document.getElementById("total-width").value) || 0;

  if (l1 <= 0 || l2 <= 0 || w <= 0) {
    // Reset all outputs if dimensions are not fully provided
    document.getElementById("calc-area-m2").innerText = "0.0";
    document.getElementById("calc-area-acre").innerText = "0";
    document.getElementById("calc-area-carat").innerText = "0";
    document.getElementById("calc-area-shares").innerText = "0.00";
    
    document.getElementById("total-carats-entered").value = "0";
    document.getElementById("total-shares-entered").value = "0";
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
  
  // Calculate total input shares of partners to display in the footer
  rows.forEach(row => {
    const c = parseFloat(row.querySelector(".partner-carats").value) || 0;
    const s = parseFloat(row.querySelector(".partner-shares").value) || 0;
    totalCaratsEntered += c;
    totalSharesEntered += s;
  });

  // Normalize total entered values
  let displayTotalCarats = totalCaratsEntered + Math.floor(totalSharesEntered / 24);
  let displayTotalShares = (totalSharesEntered % 24).toFixed(3);
  document.getElementById("total-carats-entered").value = displayTotalCarats;
  document.getElementById("total-shares-entered").value = displayTotalShares;

  const k = (l2 - l1) / w; // rate of change of length along width
  let lastX = 0;

  rows.forEach((row, index) => {
    const c = parseFloat(row.querySelector(".partner-carats").value) || 0;
    const s = parseFloat(row.querySelector(".partner-shares").value) || 0;
    
    const partnerCarats = c + s / 24;
    const partnerAreaM2 = partnerCarats * caratArea;
    
    cumulativeArea += partnerAreaM2;

    let x_i = 0;
    if (Math.abs(k) < 1e-9) {
      // Rectangular land (constant length)
      x_i = cumulativeArea / l1;
    } else {
      // Trapezoidal land (varying length)
      // Solve: 0.5 * k * x_i^2 + l1 * x_i - cumulativeArea = 0
      // x_i = (-l1 + sqrt(l1^2 + 2 * k * cumulativeArea)) / k
      const termInsideSqrt = Math.max(0, l1 * l1 + 2 * k * cumulativeArea);
      x_i = (Math.sqrt(termInsideSqrt) - l1) / k;
    }

    // Cap x_i to total width if it exceeds due to user entering larger shares
    if (x_i > w) {
      x_i = w;
    }

    const partnerWidth = x_i - lastX;
    const dividingLineLength = l1 + k * x_i;

    // Update row inputs
    row.querySelector(".partner-width").value = partnerWidth.toFixed(3);
    row.querySelector(".partner-cum-width").value = `${lastX.toFixed(2)} م إلى ${x_i.toFixed(2)} م`;
    row.querySelector(".partner-div-line").value = dividingLineLength.toFixed(3);

    lastX = x_i;
  });

  document.getElementById("total-width-calculated").value = lastX.toFixed(3);

  // Remaining area calculation
  if (caratArea > 0) {
    const totalCaratsDistributed = totalCaratsEntered + totalSharesEntered / 24;
    const totalCaratsAvailable = totalAreaM2 / caratArea;
    let remainingCarats = totalCaratsAvailable - totalCaratsDistributed;

    const isNegative = remainingCarats < 0;
    const absRemaining = Math.abs(remainingCarats);

    const remAcres = Math.floor(absRemaining / 24);
    const remCarats = Math.floor(absRemaining % 24);
    const remShares = ((absRemaining % 1) * 24).toFixed(3);

    const prefix = isNegative ? "-" : "";
    document.getElementById("rem-acres").innerText = prefix + remAcres;
    document.getElementById("rem-carats").innerText = remCarats;
    document.getElementById("rem-shares").innerText = remShares;

    // Set colors
    const color = isNegative ? "red" : "black";
    document.getElementById("rem-acres").style.color = color;
    document.getElementById("rem-carats").style.color = color;
    document.getElementById("rem-shares").style.color = color;
  }
}

function clearAll() {
  // Clear dimensions
  document.getElementById("length1").value = "";
  document.getElementById("length2").value = "";
  document.getElementById("total-width").value = "";
  
  // Clear partners
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
  
  // Calculate total area of the trapezoid
  const totalAreaM2 = ((l1 + l2) / 2) * w;
  
  // Get carat area
  let caratArea = parseFloat(document.getElementById("input-carat-area").value);
  if (caratArea === 0) {
    caratArea = parseFloat(document.getElementById("other-carat-area").value) || 0;
  }
  
  if (caratArea <= 0) {
    alert("الرجاء تحديد مساحة القيراط بالمتر المربع.");
    return;
  }
  
  // Total carats
  const totalCarats = totalAreaM2 / caratArea;
  const partnerCarats = totalCarats / numPartners;
  
  // Convert partner carats to carat and sahm
  const c = Math.floor(partnerCarats);
  const s = parseFloat(((partnerCarats - c) * 24).toFixed(4));
  
  // Clear existing partners
  const list = document.getElementById("partners-list");
  list.innerHTML = "";
  
  // Add new partner rows
  for (let i = 0; i < numPartners; i++) {
    addNewPartnerRow(`شريك ${i + 1}`, c, s);
  }
  
  saveAndCalc();
}
