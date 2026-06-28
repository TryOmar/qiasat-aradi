// Local Storage saving and loading
document.addEventListener("DOMContentLoaded", function () {
  loadData();
  calculate();
});

function saveData() {
  sessionStorage.setItem("op1-shares", document.getElementById("op1-shares").value);
  sessionStorage.setItem("op1-carat", document.getElementById("op1-carat").value);
  sessionStorage.setItem("op1-acre", document.getElementById("op1-acre").value);
  sessionStorage.setItem("op2-shares", document.getElementById("op2-shares").value);
  sessionStorage.setItem("op2-carat", document.getElementById("op2-carat").value);
  sessionStorage.setItem("op2-acre", document.getElementById("op2-acre").value);
  sessionStorage.setItem("op2-number", document.getElementById("op2-number").value);
  sessionStorage.setItem("carat-area-calc", document.getElementById("input-carat-area").value);
  sessionStorage.setItem("other-carat-area-calc", document.getElementById("other-input-field").value);
  sessionStorage.setItem("operation", currentOperation);
}

function loadData() {
  document.getElementById("op1-shares").value = sessionStorage.getItem("op1-shares") || "";
  document.getElementById("op1-carat").value = sessionStorage.getItem("op1-carat") || "";
  document.getElementById("op1-acre").value = sessionStorage.getItem("op1-acre") || "";
  document.getElementById("op2-shares").value = sessionStorage.getItem("op2-shares") || "";
  document.getElementById("op2-carat").value = sessionStorage.getItem("op2-carat") || "";
  document.getElementById("op2-acre").value = sessionStorage.getItem("op2-acre") || "";
  document.getElementById("op2-number").value = sessionStorage.getItem("op2-number") || "";
  document.getElementById("input-carat-area").value = sessionStorage.getItem("carat-area-calc") || "175.035";
  document.getElementById("other-input-field").value = sessionStorage.getItem("other-carat-area-calc") || "";
  
  const savedOp = sessionStorage.getItem("operation") || "add";
  setOperation(savedOp);
}

let currentOperation = "add";

function setOperation(op) {
  currentOperation = op;
  
  // Update button active states
  const buttons = document.querySelectorAll(".operation-btn");
  buttons.forEach(btn => {
    if (btn.getAttribute("onclick").includes(op)) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
  
  // Show/hide operand divs
  const landDiv = document.getElementById("operand2-land-div");
  const numberDiv = document.getElementById("operand2-number-div");
  const numTitle = document.getElementById("op2-number-title");
  
  if (op === "add" || op === "subtract") {
    landDiv.style.display = "flex";
    numberDiv.style.display = "none";
  } else {
    landDiv.style.display = "none";
    numberDiv.style.display = "flex";
    if (op === "multiply") {
      numTitle.innerText = "الرقم المضروب فيه (المضاعف)";
    } else {
      numTitle.innerText = "الرقم المقسوم عليه (عدد الأجزاء)";
    }
  }
  
  saveData();
  calculate();
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
  const op1_shares = parseFloat(document.getElementById("op1-shares").value) || 0;
  const op1_carat = parseFloat(document.getElementById("op1-carat").value) || 0;
  const op1_acre = parseFloat(document.getElementById("op1-acre").value) || 0;

  // Convert operand 1 to total shares
  const s1 = op1_acre * 24 * 24 + op1_carat * 24 + op1_shares;

  let s_res = 0;

  if (currentOperation === "add" || currentOperation === "subtract") {
    const op2_shares = parseFloat(document.getElementById("op2-shares").value) || 0;
    const op2_carat = parseFloat(document.getElementById("op2-carat").value) || 0;
    const op2_acre = parseFloat(document.getElementById("op2-acre").value) || 0;
    const s2 = op2_acre * 24 * 24 + op2_carat * 24 + op2_shares;

    if (currentOperation === "add") {
      s_res = s1 + s2;
    } else {
      s_res = s1 - s2;
    }
  } else if (currentOperation === "multiply") {
    const factor = parseFloat(document.getElementById("op2-number").value) || 1;
    s_res = s1 * factor;
  } else if (currentOperation === "divide") {
    const divisor = parseFloat(document.getElementById("op2-number").value) || 1;
    s_res = divisor !== 0 ? s1 / divisor : 0;
  }

  // Convert result back to Feddan, Qirat, Sahm
  const isNegative = s_res < 0;
  const absS = Math.abs(s_res);

  const res_acre = Math.floor(absS / 576);
  const remainingSahms = absS % 576;
  const res_carat = Math.floor(remainingSahms / 24);
  const res_shares = (remainingSahms % 24).toFixed(3);

  // Update DOM
  const prefix = isNegative ? "-" : "";
  document.getElementById("res-acre").innerText = prefix + res_acre;
  document.getElementById("res-carat").innerText = res_carat;
  document.getElementById("res-shares").innerText = res_shares;

  // Get carat area
  let caratArea = parseFloat(document.getElementById("input-carat-area").value);
  if (caratArea === 0) {
    caratArea = parseFloat(document.getElementById("other-input-field").value) || 0;
  }

  // Result in square meters
  const totalCarats = s_res / 24;
  const areaM2 = totalCarats * caratArea;
  
  // Result in Square Reeds
  const squareReeds = areaM2 / 12.6025;
  
  document.getElementById("res-m2").innerHTML = `${areaM2.toFixed(3)} م² <br><span style="font-size: 13px; color: gray; font-weight: normal;">(تعادل ${squareReeds.toFixed(3)} قصبة مربعة)</span>`;

  // Result in Reeds & Fists (linear conversion of square root of area)
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

  saveData();
}

function clearAll() {
  document.getElementById("op1-shares").value = "";
  document.getElementById("op1-carat").value = "";
  document.getElementById("op1-acre").value = "";
  document.getElementById("op2-shares").value = "";
  document.getElementById("op2-carat").value = "";
  document.getElementById("op2-acre").value = "";
  document.getElementById("op2-number").value = "";
  
  calculate();
}
