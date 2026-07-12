let width1 = document.querySelector(".input-s1 input");
let width2 = document.querySelector(".input-s2 input");
let height = document.querySelector(".input-s3 input");
let area1 = document.querySelector(".selector1");
let area2 = document.querySelector(".selector2");
let price = document.getElementById("numericValue");
let average_result = document.querySelector("#average-result");
let totalArea_result = document.querySelector("#totalArea-result");
let price_result = document.querySelector("#price-result");
let area_result1 = document.querySelector("#area-result1");
let area_result2 = document.querySelector("#area-result2");
let area_result3 = document.querySelector("#area-result3");
let width1_result = document.querySelectorAll(".width1_result");
let width2_result = document.querySelectorAll(".width2_result");
let height_result = document.querySelectorAll(".height_result");
let priceInput = document.querySelector(".s2 input[type='tel']");

// Load data from sessionStorage when the page loads
window.onload = function () {
  loadData();
  calculate();
};

document.addEventListener("DOMContentLoaded", function () {
  loadData();
  calculate();
});

// Function to save input field data to sessionStorage
function saveData() {
  sessionStorage.setItem("width1", width1.value);
  sessionStorage.setItem("width2", width2.value);
  sessionStorage.setItem("height", height.value);
  sessionStorage.setItem("area1", area1.value);
  sessionStorage.setItem("area2", area2.value);
  sessionStorage.setItem("price", price.value);
}

// Function to retrieve and set input field data from sessionStorage
function loadData() {
  width1.value = sessionStorage.getItem("width1") || "";
  width2.value = sessionStorage.getItem("width2") || "";
  height.value = sessionStorage.getItem("height") || "";
  area1.value = sessionStorage.getItem("area1") || "";
  area2.value = sessionStorage.getItem("area2") || "168";
  price.value = sessionStorage.getItem("price") || "";
  if (priceInput && price.value) {
    priceInput.value = price.value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    adjustPriceFontSize(priceInput);
  }
}

// Add event listeners to save data on input change
width1.addEventListener("input", saveData);
width2.addEventListener("input", saveData);
height.addEventListener("input", saveData);
area1.addEventListener("change", saveData);
area2.addEventListener("input", saveData);
price.addEventListener("input", saveData);

width1.addEventListener("input", calculate);
width2.addEventListener("input", calculate);
height.addEventListener("input", calculate);
area1.addEventListener("change", calculate);
area2.addEventListener("input", calculate);
price.addEventListener("input", calculate);

Number.prototype.toFixedNoRounding = function (n) {
  const reg = new RegExp("^-?\\d+(?:\\.\\d{0," + n + "})?", "g");
  const a = this.toString().match(reg)[0];
  const dot = a.indexOf(".");
  if (dot === -1) {
    // integer, insert decimal dot and pad up zeros
    return a + "." + "0".repeat(n);
  }
  const b = n - (a.length - dot) + 1;
  return b > 0 ? a + "0".repeat(b) : a;
};

function last(type, num) {
  let number = (type.value * 100) / 14.7916666667 / 24;
  let num1 = Math.floor(number);
  let num2 = Math.floor(getfloor(number) * 24);
  let num3 = getfloor(getfloor(number) * 24).toFixed(2);
  return num == "num3"
    ? num1 || 0
    : num == "num2"
    ? num2 || 0
    : num == "num1"
    ? num3 || 0
    : "";
}

function other() {
  if (area1.value !== "0" && area1.options[area1.selectedIndex].text !== "أخرى" && area1.options[area1.selectedIndex].text !== "اخر") {
    area2.value = area1.options[area1.selectedIndex].text;
  } else {
    area2.value = "";
  }
}

function average() {
  return (+width1.value + +width2.value) / 2;
}
function totalArea() {
  return average() * height.value;
}
function result() {
  return totalArea() / area2.value;
}
function acre() {
  return result() / 24;
}
function getfloor(num) {
  let tostr = num.toString();
  if (tostr.includes(".")) {
    let result = tostr.slice(tostr.indexOf("."));
    return Number(result);
  } else {
    return 0;
  }
}
function carats() {
  return getfloor(acre()) * 24;
}
function shares() {
  return getfloor(carats()) * 24;
}
function getprice() {
  return price.value * result();
}
function isFull() {
  width1_num1 = last(width1, "num1");
  width1_num2 = last(width1, "num2");
  width1_num3 = last(width1, "num3");
  width2_num1 = last(width2, "num1");
  width2_num2 = last(width2, "num2");
  width2_num3 = last(width2, "num3");
  height_num1 = last(height, "num1");
  height_num2 = last(height, "num2");
  height_num3 = last(height, "num3");
  if (width1_num1 == 1) {
    width1_num3 += 1;
    width1_num2 = 0;
    width1_num1 = 0;
  }
  if (width2_num1 == 1) {
    width2_num3 += 1;
    width2_num2 = 0;
    width2_num1 = 0;
  }
  if (height_num1 == 1) {
    height_num3 += 1;
    height_num2 = 0;
    height_num1 = 0;
  }
  const w1_res = document.querySelectorAll(".width1_result");
  const w2_res = document.querySelectorAll(".width2_result");
  const h_res = document.querySelectorAll(".height_result");

  if (w1_res.length < 3 || w2_res.length < 3 || h_res.length < 3) return;

  const active = document.activeElement;
  
  if (active !== w1_res[0] && active !== w1_res[1] && active !== w1_res[2]) {
    w1_res[0].value = width1_num1;
    w1_res[1].value = width1_num2;
    w1_res[2].value = width1_num3;
  }
  
  if (active !== w2_res[0] && active !== w2_res[1] && active !== w2_res[2]) {
    w2_res[0].value = width2_num1;
    w2_res[1].value = width2_num2;
    w2_res[2].value = width2_num3;
  }
  
  if (active !== h_res[0] && active !== h_res[1] && active !== h_res[2]) {
    h_res[0].value = height_num1;
    h_res[1].value = height_num2;
    h_res[2].value = height_num3;
  }
}

function calculate() {
  const area = totalArea() || 0;
  totalArea_result.innerText = area.toFixed(2);
  price_result.innerText = Math.floor(getprice() || 0).toLocaleString();
  area_result1.innerText = Math.floor(acre() || 0);
  area_result2.innerText = Math.floor(carats() || 0);
  area_result3.innerText = (shares() || 0).toFixedNoRounding(2);

  // Calculate square qasba, square qabda, and less-than-fist
  const qasba_sq = area / 12.60250;
  const reedValue = Math.floor(qasba_sq);
  const fistValue = Math.floor((qasba_sq - reedValue) * 24);
  const lessThanFistValue = (qasba_sq - reedValue - (fistValue / 24)).toFixed(2);

  const area_qasba_res = document.querySelectorAll(".area_qasba_result");
  if (area_qasba_res.length >= 3) {
    area_qasba_res[0].value = lessThanFistValue;
    area_qasba_res[1].value = fistValue;
    area_qasba_res[2].value = reedValue;
  }

  // Update meter labels/badges
  document.getElementById("width1_meter_val").innerText = (Number(width1.value) || 0).toFixed(2) + " م";
  document.getElementById("width2_meter_val").innerText = (Number(width2.value) || 0).toFixed(2) + " م";
  document.getElementById("height_meter_val").innerText = (Number(height.value) || 0).toFixed(2) + " م";
  document.getElementById("area_meter_val").innerText = area.toFixed(2) + " م²";

  isFull();
}

function clearall() {
  let inputs = document.querySelectorAll("input");
  for (let i = 0; i < inputs.length; i++) {
    if (inputs[i].className == `selector2`) {
      continue;
    }
    inputs[i].value = "";
  }
  saveData();
  calculate();
}

function formatNumber(input) {
  // Remove non-digit characters for the hidden value
  const rawValue = input.value.replace(/\D/g, "");
  // Set the hidden input with the numeric value
  document.getElementById("numericValue").value = rawValue;
  // Format the displayed value with commas
  input.value = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

function convertInputsToMeters(inputs) {
  // index 0: fraction (less than qabda)
  // index 1: qabda
  // index 2: qasaba
  const fraction = Number(inputs[0].value) || 0;
  const qabda = Number(inputs[1].value) || 0;
  const qasaba = Number(inputs[2].value) || 0;
  const fists = (qasaba * 24) + qabda + fraction;
  const meters = (fists * 14.7916666667) / 100;
  return meters;
}

width1_result.forEach((input) => {
  input.addEventListener("input", () => {
    const meters = convertInputsToMeters(width1_result);
    width1.value = meters.toFixed(3);
    saveData();
    calculate();
  });
});

width2_result.forEach((input) => {
  input.addEventListener("input", () => {
    const meters = convertInputsToMeters(width2_result);
    width2.value = meters.toFixed(3);
    saveData();
    calculate();
  });
});

height_result.forEach((input) => {
  input.addEventListener("input", () => {
    const meters = convertInputsToMeters(height_result);
    height.value = meters.toFixed(3);
    saveData();
    calculate();
  });
});

function printCroquis() {
  if (!width1.value || !width2.value || !height.value) {
    alert("يرجى إدخال المقاسات أولاً (العرض الأول، العرض الآخر، الطول) لرسم الكروكي.");
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 450;
  const ctx = canvas.getContext("2d");

  // Fill white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw Grid Background (شبكة مربعات هندسية احترافية)
  const gridSize = 20;
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    // Draw major lines thicker and minor lines thinner
    ctx.strokeStyle = (x % (gridSize * 5) === 0) ? "#e2ebe7" : "#f1f6f3"; 
    ctx.lineWidth = (x % (gridSize * 5) === 0) ? 1.2 : 0.6;
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.strokeStyle = (y % (gridSize * 5) === 0) ? "#e2ebe7" : "#f1f6f3"; 
    ctx.lineWidth = (y % (gridSize * 5) === 0) ? 1.2 : 0.6;
    ctx.stroke();
  }

  const w1 = Number(width1.value) || 0;
  const w2 = Number(width2.value) || 0;
  const h = Number(height.value) || 0;

  // Calculate slant lengths
  const dx = Math.abs(w2 - w1) / 2;
  const slant = Math.sqrt(dx * dx + h * h);

  // Scaling
  const maxW = Math.max(w1, w2);
  const scaleX = 480 / maxW;
  const scaleY = 320 / h;
  const scale = Math.min(scaleX, scaleY);

  // Calculate scaled dimensions with minimum constraints for extreme aspect ratios
  let drawW1 = w1 * scale;
  let drawW2 = w2 * scale;
  let drawH = h * scale;

  // Safeguard for narrow vertical shapes (longitudinal land, e.g., 400m length by 7m width)
  const minDrawW = 120;
  const maxDrawW = Math.max(drawW1, drawW2);
  if (maxDrawW < minDrawW) {
    const boost = maxDrawW > 0 ? (minDrawW / maxDrawW) : 1;
    drawW1 = drawW1 * boost || minDrawW;
    drawW2 = drawW2 * boost || minDrawW;
  }

  // Safeguard for narrow horizontal shapes (very wide/short land)
  const minDrawH = 120;
  if (drawH < minDrawH) {
    drawH = minDrawH;
  }

  const centerX = 300;
  const centerY = 225;

  const p1 = { x: centerX - drawW1 / 2, y: centerY - drawH / 2 };
  const p2 = { x: centerX + drawW1 / 2, y: centerY - drawH / 2 };
  const p3 = { x: centerX + drawW2 / 2, y: centerY + drawH / 2 };
  const p4 = { x: centerX - drawW2 / 2, y: centerY + drawH / 2 };

  // Draw Shape (Agricultural Land)
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.lineTo(p4.x, p4.y);
  ctx.closePath();

  // Fill with Agricultural Green Gradient
  const grad = ctx.createLinearGradient(centerX, p1.y, centerX, p4.y);
  grad.addColorStop(0, "rgba(224, 242, 225, 0.75)"); // light organic green
  grad.addColorStop(1, "rgba(165, 214, 167, 0.75)"); // richer farm green
  ctx.fillStyle = grad;
  ctx.fill();

  // Draw Strong Green Boundary Border
  ctx.strokeStyle = "#2e7d32"; 
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Draw Inner Dashed Boundary Line (Survey Map Style)
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.0;
  ctx.setLineDash([4, 3]);
  ctx.stroke();
  ctx.restore();

  // Helper function to draw dimension lines
  function drawDimensionLine(pStart, pEnd, label, offsetVal) {
    const segmentDx = pEnd.x - pStart.x;
    const segmentDy = pEnd.y - pStart.y;
    const len = Math.sqrt(segmentDx * segmentDx + segmentDy * segmentDy);
    if (len === 0) return;
    
    const ux = segmentDx / len;
    const uy = segmentDy / len;
    
    const mX = (pStart.x + pEnd.x) / 2;
    const mY = (pStart.y + pEnd.y) / 2;
    
    let nx = -uy;
    let ny = ux;
    const vx = mX - 300;
    const vy = mY - 225;
    if (nx * vx + ny * vy < 0) {
      nx = -nx;
      ny = -ny;
    }
    
    const pStartOffset = { x: pStart.x + nx * offsetVal, y: pStart.y + ny * offsetVal };
    const pEndOffset = { x: pEnd.x + nx * offsetVal, y: pEnd.y + ny * offsetVal };
    
    // Draw dashed extension lines
    ctx.beginPath();
    ctx.setLineDash([3, 3]);
    ctx.moveTo(pStart.x, pStart.y);
    ctx.lineTo(pStartOffset.x, pStartOffset.y);
    ctx.moveTo(pEnd.x, pEnd.y);
    ctx.lineTo(pEndOffset.x, pEndOffset.y);
    ctx.strokeStyle = "#999999";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw main dimension line
    ctx.beginPath();
    ctx.moveTo(pStartOffset.x, pStartOffset.y);
    ctx.lineTo(pEndOffset.x, pEndOffset.y);
    ctx.strokeStyle = "#2e7d32";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    
    // Draw endpoint dots
    ctx.beginPath();
    ctx.arc(pStartOffset.x, pStartOffset.y, 3, 0, 2 * Math.PI);
    ctx.arc(pEndOffset.x, pEndOffset.y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = "#2e7d32";
    ctx.fill();
    
    // Draw text label
    let angle = Math.atan2(segmentDy, segmentDx);
    if (angle > Math.PI / 2) angle -= Math.PI;
    if (angle < -Math.PI / 2) angle += Math.PI;
    
    ctx.save();
    ctx.translate(mX + nx * offsetVal, mY + ny * offsetVal);
    ctx.rotate(angle);
    ctx.fillStyle = "#1b5e20";
    ctx.font = "bold 11px Cairo, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(label, 0, -3);
    ctx.restore();
  }

  // Draw 4 dimension lines with dynamic side offsets to avoid collision with center details card
  const sideOffset = Math.max(30, 115 - Math.max(drawW1, drawW2) / 2);
  drawDimensionLine(p1, p2, `${w1.toFixed(2)} م`, 30); 
  drawDimensionLine(p2, p3, `${slant.toFixed(2)} م`, sideOffset); 
  drawDimensionLine(p3, p4, `${w2.toFixed(2)} م`, 30); 
  drawDimensionLine(p4, p1, `${slant.toFixed(2)} م`, sideOffset);  

  // Draw dashed line for height in the center
  ctx.beginPath();
  ctx.setLineDash([4, 4]);
  ctx.moveTo(centerX, p1.y);
  ctx.lineTo(centerX, p4.y);
  ctx.strokeStyle = "#388e3c";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw a white background card in the center to hold the text cleanly
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.strokeStyle = "rgba(46, 117, 89, 0.35)";
  ctx.lineWidth = 1.2;
  const cardW = 190;
  const cardH = 75;
  const cardX = centerX - cardW / 2;
  const cardY = centerY - cardH / 2 - 10;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(cardX, cardY, cardW, cardH, 8);
  } else {
    ctx.rect(cardX, cardY, cardW, cardH);
  }
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Draw height label inside a white background pill below the card
  const heightText = `الطول: ${h.toFixed(2)} م`;
  ctx.font = "bold 11px Cairo, Arial, sans-serif";
  const hTextWidth = ctx.measureText(heightText).width;
  
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(centerX - hTextWidth / 2 - 6, centerY + drawH / 3 - 9, hTextWidth + 12, 16, 4);
  } else {
    ctx.rect(centerX - hTextWidth / 2 - 6, centerY + drawH / 3 - 9, hTextWidth + 12, 16);
  }
  ctx.fill();
  ctx.strokeStyle = "#2e7d32";
  ctx.lineWidth = 0.8;
  ctx.stroke();
  
  ctx.fillStyle = "#1b5e20";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(heightText, centerX, centerY + drawH / 3 - 1);

  // Draw corner vertices
  [p1, p2, p3, p4].forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "#1b5e20";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  // Details inside the shape card
  ctx.fillStyle = "#1b5e20";
  ctx.font = "bold 11px Cairo, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const totalArea = totalArea_result.innerText;
  const feddan = area_result1.innerText;
  const carat = area_result2.innerText;
  const shares_val = area_result3.innerText;
  const priceVal = price_result.innerText;

  // Calculate square qasba, square qabda, and less-than-fist
  const qasba_sq = (Number(totalArea.replace(/,/g, "")) || 0) / 12.60250;
  const q_reed = Math.floor(qasba_sq);
  const q_fist = Math.floor((qasba_sq - q_reed) * 24);
  const q_less = (qasba_sq - q_reed - (q_fist / 24)).toFixed(2);

  let startY = centerY - 32;
  ctx.fillText("المساحة الكلية", centerX, startY);
  ctx.font = "bold 14px Cairo, Arial, sans-serif";
  ctx.fillText(`${totalArea} م²`, centerX, startY + 18);
  ctx.font = "bold 10px Cairo, Arial, sans-serif";
  ctx.fillText(`${feddan} فدان ، ${carat} قيراط ، ${shares_val} سهم`, centerX, startY + 34);

  if (priceVal && priceVal !== "0") {
    ctx.font = "bold 10px Cairo, Arial, sans-serif";
    ctx.fillText(`إجمالي السعر: ${priceVal} جنيه`, centerX, startY + 50);
  }

  // Draw North Arrow (سهم اتجاه الشمال المساحي) in the top-right corner
  ctx.save();
  const arrowX = 550;
  const arrowY = 60;
  ctx.translate(arrowX, arrowY);
  
  // Draw N text (شمال)
  ctx.fillStyle = "#1b5e20";
  ctx.font = "bold 11px Cairo, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ش", 0, -18);
  
  // Right half (darker)
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(4, 8);
  ctx.lineTo(0, 3);
  ctx.closePath();
  ctx.fillStyle = "#1b5e20";
  ctx.fill();

  // Left half (lighter)
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(-4, 8);
  ctx.lineTo(0, 3);
  ctx.closePath();
  ctx.fillStyle = "#388e3c";
  ctx.fill();
  ctx.restore();

  const imgURL = canvas.toDataURL("image/png");

  // Get conversion inputs
  const w1_results = document.querySelectorAll(".width1_result");
  const w1_less = w1_results[0]?.value || "0";
  const w1_fist = w1_results[1]?.value || "0";
  const w1_reed = w1_results[2]?.value || "0";

  const w2_results = document.querySelectorAll(".width2_result");
  const w2_less = w2_results[0]?.value || "0";
  const w2_fist = w2_results[1]?.value || "0";
  const w2_reed = w2_results[2]?.value || "0";

  const h_results = document.querySelectorAll(".height_result");
  const h_less = h_results[0]?.value || "0";
  const h_fist = h_results[1]?.value || "0";
  const h_reed = h_results[2]?.value || "0";

  const a_results = document.querySelectorAll(".area_qasba_result");
  const a_less = a_results[0]?.value || "0";
  const a_fist = a_results[1]?.value || "0";
  const a_reed = a_results[2]?.value || "0";

  const now = new Date();
  const dateStr = now.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("ar-EG");
  const reportId = `DL-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const printContent = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>كروكي الأرض والنتائج - الدلال</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4 portrait; margin: 15mm 12mm 15mm 12mm; }
    body { font-family: 'Cairo', sans-serif; background: #ffffff; color: #222222; direction: rtl; font-size: 9.5pt; line-height: 1.4; padding-bottom: 45px; position: relative; }
    
    .report-header { border: 2px solid #1b5e20; border-radius: 10px; padding: 12px; margin-bottom: 12px; display: grid; grid-template-columns: 1.2fr 2fr 1.2fr; align-items: center; background: #f1f8e9; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .report-header-right { text-align: right; }
    .report-header-right h1 { font-size: 20pt; color: #1b5e20; font-weight: 800; margin: 0; }
    .report-header-right p { font-size: 9pt; color: #388e3c; margin: 2px 0 0; font-weight: 600; }
    .report-header-center { text-align: center; padding: 0 10px; }
    .report-header-center h2 { font-size: 12.5pt; color: #1b5e20; font-weight: 700; margin: 0; line-height: 1.4; }
    .report-header-left { text-align: left; font-size: 8pt; color: #333; line-height: 1.5; }
    
    .owner-info { margin-bottom: 15px; font-size: 10pt; border-bottom: 1px dashed #ccc; padding-bottom: 6px; display: flex; gap: 10px; }
    .placeholder-line { color: #aaa; letter-spacing: 1px; }
    
    .section { margin-bottom: 15px; }
    .section-title { background: #1b5e20; color: white; font-weight: 700; font-size: 10.5pt; padding: 5px 12px; border-right: 5px solid #2e7d32; margin-bottom: 8px; border-radius: 4px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    
    .sketch-box { text-align: center; border: 2px solid #1b5e20; border-radius: 8px; padding: 8px; background: #ffffff; display: block; margin: 0 auto 12px; max-width: 480px; page-break-inside: avoid; }
    .sketch-box img { max-width: 100%; max-height: 240px; object-fit: contain; display: block; margin: 0 auto; }
    
    table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 8px; }
    th { background: #e8f5e9; color: #1b5e20; font-weight: 700; border: 1px solid #1b5e20; padding: 6px 4px; text-align: center; white-space: nowrap; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    td { border: 1px solid #a5d6a7; padding: 5px 4px; text-align: center; vertical-align: middle; }
    tr:nth-child(even) td { background: #f9fbe7; }
    
    .watermark-container { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-25deg); font-size: 26pt; font-weight: 800; color: #000000; opacity: 0.06; white-space: nowrap; pointer-events: none; z-index: -1000; font-family: 'Cairo', Arial, sans-serif; text-align: center; width: 100%; }
    .report-footer { position: fixed; bottom: 0; left: 0; width: 100%; display: flex; flex-direction: column; align-items: center; text-align: center; font-size: 8pt; color: #444; border-top: 1.5px solid #1b5e20; padding: 4px 10px 3px; background: white; gap: 1px; }
    .footer-main-text { font-size: 8.5pt; font-weight: 700; color: #222; }
    .footer-sub-text { font-size: 7.5pt; color: #888; }
    
    .page-break-inside-avoid { page-break-inside: avoid; }
    .no-print-btn { margin-top: 15px; padding: 10px 20px; background-color: #2e7d32; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; font-family: 'Cairo', sans-serif; }
    
    @media print {
      body { background: #fff !important; color: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .report-header { border-color: #000 !important; background: #fcfcfc !important; }
      .section-title { background: #000 !important; color: #fff !important; border-right-color: #333 !important; }
      th { background: #f2f2f2 !important; color: #000 !important; border-color: #000 !important; }
      td { border-color: #ccc !important; }
      .sketch-box { border-color: #000 !important; }
      .report-footer { border-top-color: #000 !important; }
      .watermark-container { opacity: 0.05 !important; }
    }
  </style>
</head>
<body>

  <!-- Watermark -->
  <div class="watermark-container">تم تنفيذ هذا التقرير باستخدام تطبيق الدَّلاَّل لقياسات الأراضي، والمتوفر على Google Play.</div>

  <!-- Header -->
  <div class="report-header">
    <div class="report-header-right">
      <h1>الدَّلاَّل</h1>
      <p>تطبيق قياس وتقسيم الأراضي</p>
    </div>
    <div class="report-header-center">
      <h2>تقرير كروكي الأرض والنتائج العامة</h2>
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

  <!-- 1. الرسم الكروكي -->
  <div class="section page-break-inside-avoid">
    <div class="section-title">1. الرسم الكروكي للأرض الزراعية</div>
    <div class="sketch-box">
      <img src="${imgURL}" alt="كروكي الأرض">
    </div>
  </div>

  <!-- 2. النتائج الإجمالية بالامتار -->
  <div class="section page-break-inside-avoid">
    <div class="section-title">2. نتائج قياس ومساحة الأرض بالامتار</div>
    <table>
      <thead>
        <tr>
          <th style="width: 40%; text-align: right; padding-right: 15px;">البيان المقاس</th>
          <th>القيمة والوحدة</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: right; padding-right: 15px;">العرض الأول (أعلى)</td>
          <td style="font-weight: bold; color: #1b5e20;">${w1} متر</td>
        </tr>
        <tr>
          <td style="text-align: right; padding-right: 15px;">العرض الآخر (أسفل)</td>
          <td style="font-weight: bold; color: #1b5e20;">${w2} متر</td>
        </tr>
        <tr>
          <td style="text-align: right; padding-right: 15px;">الطول (الارتفاع)</td>
          <td style="font-weight: bold; color: #1b5e20;">${h} متر</td>
        </tr>
        <tr>
          <td style="text-align: right; padding-right: 15px;">المساحة الإجمالية بالمتـر المربع</td>
          <td style="font-weight: bold; color: #1b5e20; font-size: 11pt;">${totalArea} م²</td>
        </tr>
        <tr>
          <td style="text-align: right; padding-right: 15px;">المساحة بالفدان والقيراط والسهم</td>
          <td style="font-weight: bold; color: #1b5e20;">${feddan} فدان و ${carat} قيراط و ${shares_val} سهم</td>
        </tr>
        ${priceVal && priceVal !== "0" ? `
        <tr>
          <td style="text-align: right; padding-right: 15px; color: #b71c1c;">إجمالي سعر قطعة الأرض</td>
          <td style="font-weight: bold; color: #b71c1c; font-size: 11pt;">${priceVal} جنيه</td>
        </tr>` : ""}
      </tbody>
    </table>
  </div>

  <!-- 3. تحويل الأبعاد والمساحة إلى القصبة والقبضة -->
  <div class="section page-break-inside-avoid">
    <div class="section-title">3. تحويل الأبعاد والمساحة إلى القصبة والقبضة</div>
    <table>
      <thead>
        <tr>
          <th style="width: 40%; text-align: right; padding-right: 15px;">البعد / المساحة المحولة</th>
          <th>أقل من القبضة</th>
          <th>قبضة</th>
          <th>قصبة</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-weight: bold; text-align: right; padding-right: 15px;">ناتج العرض الأول (${w1} م)</td>
          <td style="font-weight: bold; color: #1b5e20;">${w1_less}</td>
          <td style="font-weight: bold; color: #1b5e20;">${w1_fist}</td>
          <td style="font-weight: bold; color: #1b5e20;">${w1_reed}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; text-align: right; padding-right: 15px;">ناتج العرض الآخر (${w2} م)</td>
          <td style="font-weight: bold; color: #1b5e20;">${w2_less}</td>
          <td style="font-weight: bold; color: #1b5e20;">${w2_fist}</td>
          <td style="font-weight: bold; color: #1b5e20;">${w2_reed}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; text-align: right; padding-right: 15px;">ناتج الطول (${h} م)</td>
          <td style="font-weight: bold; color: #1b5e20;">${h_less}</td>
          <td style="font-weight: bold; color: #1b5e20;">${h_fist}</td>
          <td style="font-weight: bold; color: #1b5e20;">${h_reed}</td>
        </tr>
        <tr style="background-color: #f1f8e9;">
          <td style="font-weight: bold; text-align: right; padding-right: 15px;">النتيجة بالقصبة المربعة (${totalArea} م²)</td>
          <td style="font-weight: bold; color: #1b5e20;">${a_less}</td>
          <td style="font-weight: bold; color: #1b5e20;">${a_fist}</td>
          <td style="font-weight: bold; color: #1b5e20;">${a_reed}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="no-print" style="text-align: center; margin-top: 20px;">
    <button class="no-print-btn" onclick="window.print()">بدء طباعة التقرير</button>
  </div>

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
      if (imgs.length === 0) {
        window.print();
      } else {
        for (let i = 0; i < imgs.length; i++) {
          if (imgs[i].complete) {
            loadedCount++;
            if (loadedCount === imgs.length) {
              window.print();
            }
          } else {
            imgs[i].onload = function() {
              loadedCount++;
              if (loadedCount === imgs.length) {
                window.print();
              }
            };
            imgs[i].onerror = function() {
              loadedCount++;
              if (loadedCount === imgs.length) {
                window.print();
              }
            };
          }
        }
      }
    }
  </script>

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
  setTimeout(() => {
    try {
      printWindow.print();
    } catch (e) {
      console.log("Auto print failed, user can print manually.");
    }
  }, 1000);
}
