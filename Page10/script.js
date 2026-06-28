// Local Storage saving and loading
document.addEventListener("DOMContentLoaded", function () {
  loadData();
  calculate();
});

let areas = [
  { name: "", shares: "", carat: "", acre: "", sign: "plus" },
  { name: "", shares: "", carat: "", acre: "", sign: "plus" }
];

let currentOperation = "calc"; // 'calc' (add/subtract), 'multiply', 'divide'

function getAreaTitle(index) {
  const ordinals = ["الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة", "السابعة", "الثامنة", "التاسعة", "العاشرة"];
  if (index < ordinals.length) {
    return `المساحة ${ordinals[index]}`;
  }
  return `المساحة ${index + 1}`;
}

function syncInputsToMemory() {
  const nameInputs = document.querySelectorAll(".area-name-input");
  const shareInputs = document.querySelectorAll(".area-shares");
  const caratInputs = document.querySelectorAll(".area-carat");
  const acreInputs = document.querySelectorAll(".area-acre");
  
  nameInputs.forEach((input) => {
    const idx = parseInt(input.getAttribute("data-index"));
    if (areas[idx]) {
      areas[idx].name = input.value;
    }
  });
  shareInputs.forEach((input) => {
    const idx = parseInt(input.getAttribute("data-index"));
    if (areas[idx]) {
      areas[idx].shares = input.value;
    }
  });
  caratInputs.forEach((input) => {
    const idx = parseInt(input.getAttribute("data-index"));
    if (areas[idx]) {
      areas[idx].carat = input.value;
    }
  });
  acreInputs.forEach((input) => {
    const idx = parseInt(input.getAttribute("data-index"));
    if (areas[idx]) {
      areas[idx].acre = input.value;
    }
  });
}

function renderAreas() {
  const tbody = document.getElementById("lands-table-body");
  
  let html = "";
  for (let i = 0; i < areas.length; i++) {
    const area = areas[i];
    const isPlus = area.sign !== "minus";
    
    html += `
      <tr id="area-block-${i}">
        <td style="vertical-align: middle; font-weight: bold; color: #666; font-size: 13px;">${i + 1}</td>
        <td style="vertical-align: middle; text-align: center;">
          <button type="button" class="sign-toggle-btn ${isPlus ? 'plus' : 'minus'}" onclick="toggleSign(${i})">
            ${isPlus ? '+' : '-'}
          </button>
        </td>
        <td style="vertical-align: middle;">
          <input type="number" class="area-shares" data-index="${i}" placeholder="0" oninput="calculate()" value="${area.shares || ''}">
        </td>
        <td style="vertical-align: middle;">
          <input type="number" class="area-carat" data-index="${i}" placeholder="0" oninput="calculate()" value="${area.carat || ''}">
        </td>
        <td style="vertical-align: middle;">
          <input type="number" class="area-acre" data-index="${i}" placeholder="0" oninput="calculate()" value="${area.acre || ''}">
        </td>
        <td style="vertical-align: middle;">
          <input type="text" class="area-name-input" data-index="${i}" placeholder="مثال: الغيط الكبير" oninput="calculate()" value="${area.name || ''}">
        </td>
        <td class="no-print" style="vertical-align: middle; text-align: center;">
          ${i > 0 ? `
            <button type="button" class="btn-remove-area" onclick="removeArea(${i})" title="حذف هذه المساحة" style="display: inline-flex; align-items: center; justify-content: center; background: none; border: none; color: #d32f2f; cursor: pointer; padding: 0; margin: 0;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          ` : ''}
        </td>
      </tr>
    `;
  }
  
  tbody.innerHTML = html;
}

function toggleSign(index) {
  syncInputsToMemory();
  if (areas[index]) {
    areas[index].sign = areas[index].sign === "plus" ? "minus" : "plus";
    renderAreas();
    saveData();
    calculate();
  }
}

function addArea() {
  syncInputsToMemory();
  areas.push({ name: "", shares: "", carat: "", acre: "", sign: "plus" });
  renderAreas();
  saveData();
  calculate();
  
  // Smoothly scroll to the newly added row and focus on the name input
  setTimeout(() => {
    const newRow = document.getElementById(`area-block-${areas.length - 1}`);
    if (newRow) {
      newRow.scrollIntoView({ behavior: "smooth", block: "center" });
      const nameInput = newRow.querySelector(".area-name-input");
      if (nameInput) {
        nameInput.focus();
      }
    }
  }, 100);
}

function removeArea(index) {
  syncInputsToMemory();
  if (areas.length > 1) {
    areas.splice(index, 1);
  }
  renderAreas();
  saveData();
  calculate();
}

function saveData() {
  syncInputsToMemory();
  sessionStorage.setItem("areas", JSON.stringify(areas));
  sessionStorage.setItem("op2-number", document.getElementById("op2-number").value);
  sessionStorage.setItem("carat-area-calc", document.getElementById("input-carat-area").value);
  sessionStorage.setItem("other-carat-area-calc", document.getElementById("other-input-field").value);
  sessionStorage.setItem("operation", currentOperation);
}

function loadData() {
  const savedAreas = sessionStorage.getItem("areas");
  if (savedAreas) {
    try {
      areas = JSON.parse(savedAreas);
    } catch (e) {
      console.error(e);
      areas = [
        { name: "", shares: "", carat: "", acre: "", sign: "plus" },
        { name: "", shares: "", carat: "", acre: "", sign: "plus" }
      ];
    }
  } else {
    areas = [
      { name: "", shares: "", carat: "", acre: "", sign: "plus" },
      { name: "", shares: "", carat: "", acre: "", sign: "plus" }
    ];
  }
  
  document.getElementById("op2-number").value = sessionStorage.getItem("op2-number") || "";
  document.getElementById("input-carat-area").value = sessionStorage.getItem("carat-area-calc") || "175.035";
  document.getElementById("other-input-field").value = sessionStorage.getItem("other-carat-area-calc") || "";
  
  currentOperation = sessionStorage.getItem("operation") || "calc";
  updateOperationUI();
}

function setOperation(op) {
  currentOperation = op;
  updateOperationUI();
  calculate();
}

function updateOperationUI() {
  const buttons = document.querySelectorAll(".operation-btn");
  buttons.forEach(btn => {
    if (btn.getAttribute("onclick").includes(currentOperation)) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
  
  const numberDiv = document.getElementById("operand2-number-div");
  const numTitle = document.getElementById("op2-number-title");
  
  if (currentOperation === "calc") {
    numberDiv.style.display = "none";
  } else {
    numberDiv.style.display = "flex";
    if (currentOperation === "multiply") {
      numTitle.innerText = "الرقم المضروب فيه (المضاعف)";
    } else {
      numTitle.innerText = "الرقم المقسوم عليه (عدد الأجزاء)";
    }
  }
  
  renderAreas();
}

function handleSelection() {
  const selectElement = document.getElementById("input-carat-area");
  const otherInputField = document.getElementById("other-input-field");

  if (selectElement.value === "0") {
    otherInputField.style.display = "inline-block";
    otherInputField.focus();
  } else {
    otherInputField.style.display = "none";
  }
  saveData();
  calculate();
}

function calculate() {
  syncInputsToMemory();

  let s_res = 0;

  // Calculate the net total of the table (adding 'plus' rows, subtracting 'minus' rows)
  let totalShares = 0;
  areas.forEach((area, i) => {
    const sh = parseFloat(area.shares) || 0;
    const ca = parseFloat(area.carat) || 0;
    const ac = parseFloat(area.acre) || 0;
    const s_i = ac * 24 * 24 + ca * 24 + sh;
    
    if (area.sign === "minus") {
      totalShares -= s_i;
    } else {
      totalShares += s_i;
    }
  });

  if (currentOperation === "calc") {
    s_res = totalShares;
  } else if (currentOperation === "multiply") {
    const factor = parseFloat(document.getElementById("op2-number").value) || 1;
    s_res = totalShares * factor;
  } else if (currentOperation === "divide") {
    const divisor = parseFloat(document.getElementById("op2-number").value) || 1;
    s_res = divisor !== 0 ? totalShares / divisor : 0;
  }

  const isNegative = s_res < 0;
  const absS = Math.abs(s_res);

  const res_acre = Math.floor(absS / 576);
  const remainingSahms = absS % 576;
  const res_carat = Math.floor(remainingSahms / 24);
  const res_shares = (remainingSahms % 24).toFixed(3);

  const prefix = isNegative ? "-" : "";
  document.getElementById("res-acre").innerText = prefix + res_acre;
  document.getElementById("res-carat").innerText = res_carat;
  document.getElementById("res-shares").innerText = res_shares;

  // Also update table footer totals
  document.getElementById("total-acre").innerText = prefix + res_acre;
  document.getElementById("total-carat").innerText = res_carat;
  document.getElementById("total-shares").innerText = res_shares;

  // Update the new visual badges
  document.getElementById("res-badge-acre").innerText = prefix + res_acre;
  document.getElementById("res-badge-carat").innerText = res_carat;
  document.getElementById("res-badge-shares").innerText = res_shares;

  let caratArea = parseFloat(document.getElementById("input-carat-area").value);
  if (caratArea === 0) {
    caratArea = parseFloat(document.getElementById("other-input-field").value) || 0;
  }



  const totalCarats = s_res / 24;
  const areaM2 = totalCarats * caratArea;
  const squareReeds = areaM2 / 12.6025;
  
  document.getElementById("res-m2").innerHTML = `${areaM2.toFixed(3)} م² <br><span style="font-size: 13px; color: gray; font-weight: normal;">(تعادل ${squareReeds.toFixed(3)} قصبة مربعة)</span>`;

  const sideLengthM = Math.sqrt(Math.abs(areaM2));
  const centimeters = sideLengthM * 100;
  const reed = Math.floor(centimeters / 355);
  const remainingCentimetersAfterReed = centimeters % 355;
  const fist = Math.floor(remainingCentimetersAfterReed / 14.7916666667);
  const remainingInFist = remainingCentimetersAfterReed % 14.7916666667;
  const remainingInFistConverted = (remainingInFist * (1 / 14.7916666667)).toFixed(2);

  document.getElementById("res-reed").innerText = (isNegative ? "-" : "") + reed;
  document.getElementById("res-fist").innerText = fist;
  document.getElementById("res-less-than-fist").innerText = remainingInFistConverted;

  // Update Report Table
  updateReport(caratArea, areaM2, res_acre, res_carat, res_shares);

  sessionStorage.setItem("areas", JSON.stringify(areas));
  sessionStorage.setItem("op2-number", document.getElementById("op2-number").value);
  sessionStorage.setItem("carat-area-calc", document.getElementById("input-carat-area").value);
  sessionStorage.setItem("other-carat-area-calc", document.getElementById("other-input-field").value);
  sessionStorage.setItem("operation", currentOperation);
}

function updateReport(caratArea, totalM2, resAcre, resCarat, resShares) {
  const reportContainer = document.getElementById("report-container");
  
  // Show report for all operations
  reportContainer.style.display = "block";
  const tbody = document.getElementById("report-table-body");
  let html = "";
  
  areas.forEach((area, i) => {
    const name = area.name || getAreaTitle(i);
    const sh = parseFloat(area.shares) || 0;
    const ca = parseFloat(area.carat) || 0;
    const ac = parseFloat(area.acre) || 0;
    const areaShares = ac * 24 * 24 + ca * 24 + sh;
    const areaM2 = (areaShares / 24) * caratArea;
    const signChar = area.sign === "minus" ? "-" : "+";
    
    html += `
      <tr>
        <td>${i + 1}</td>
        <td style="text-align: right; font-weight: normal;">(${signChar}) ${name}</td>
        <td>${sh}</td>
        <td>${ca}</td>
        <td>${ac}</td>
        <td style="direction: ltr;">${area.sign === 'minus' ? '-' : ''}${areaM2.toFixed(2)} م²</td>
      </tr>
    `;
  });
  
  let totalLabel = "النتيجة الكلية:";
  if (currentOperation === "multiply") {
    totalLabel = "النتيجة الكلية بعد الضرب:";
  } else if (currentOperation === "divide") {
    totalLabel = "النتيجة الكلية بعد القسمة:";
  }
  
  const prefix = totalM2 < 0 ? "-" : "";
  const absTotalM2 = Math.abs(totalM2);
  
  html += `
    <tr style="background-color: #e8f5e9; font-weight: bold; border-top: 2px solid #2e7d32; color: #1b5e20;">
      <td colspan="2" style="text-align: right;">${totalLabel}</td>
      <td>${resShares}</td>
      <td>${resCarat}</td>
      <td>${prefix}${resAcre}</td>
      <td style="direction: ltr;">${prefix}${absTotalM2.toFixed(2)} م²</td>
    </tr>
  `;
  
  tbody.innerHTML = html;
}

function printReport() {
  window.print();
}

function copyReportToClipboard() {
  let text = `📝 *تقرير حساب مساحات الأراضي* 📝\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  
  let caratArea = parseFloat(document.getElementById("input-carat-area").value);
  if (caratArea === 0) {
    caratArea = parseFloat(document.getElementById("other-input-field").value) || 0;
  }
  
  areas.forEach((area, i) => {
    const name = area.name || getAreaTitle(i);
    const sh = parseFloat(area.shares) || 0;
    const ca = parseFloat(area.carat) || 0;
    const ac = parseFloat(area.acre) || 0;
    const areaShares = ac * 24 * 24 + ca * 24 + sh;
    const areaM2 = (areaShares / 24) * caratArea;
    const signChar = area.sign === "minus" ? "(-) طرح" : "(+) جمع";
    
    text += `🔹 *(${i + 1}) ${name}* [${signChar}]:\n`;
    text += `   📍 المساحة: ${ac} فدان، ${ca} قيراط، ${sh} سهم\n`;
    text += `   📐 تعادل: ${area.sign === 'minus' ? '-' : ''}${areaM2.toFixed(2)} م²\n\n`;
  });
  
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  
  const resAcre = document.getElementById("res-acre").innerText;
  const resCarat = document.getElementById("res-carat").innerText;
  const resShares = document.getElementById("res-shares").innerText;
  
  // Get m2 text
  let totalM2Text = document.getElementById("res-m2").innerHTML.split(" ")[0] || "0";
  
  let totalLabel = "النتيجة الكلية";
  if (currentOperation === "multiply") {
    totalLabel = "النتيجة بعد الضرب";
  } else if (currentOperation === "divide") {
    totalLabel = "النتيجة بعد القسمة";
  }
  
  text += `🏆 *${totalLabel}*:\n`;
  text += `   📍 ${resAcre} فدان، ${resCarat} قيراط، ${resShares} سهم\n`;
  text += `   📐 تعادل: ${totalM2Text} م²\n`;
  text += `   (مساحة القيراط المعتمدة: ${caratArea} م²)\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `تم الحساب بواسطة حاسبة القراريط والأراضي 🌾`;
  
  navigator.clipboard.writeText(text).then(() => {
    alert("تم نسخ التقرير بنجاح! يمكنك الآن لصقه ومشاركته على واتساب.");
  }).catch(err => {
    console.error("Could not copy text: ", err);
  });
}

function clearAll() {
  areas = [
    { name: "", shares: "", carat: "", acre: "", sign: "plus" },
    { name: "", shares: "", carat: "", acre: "", sign: "plus" }
  ];
  document.getElementById("op2-number").value = "";
  renderAreas();
  saveData();
  calculate();
}
