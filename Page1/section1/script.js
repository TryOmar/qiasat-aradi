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
  if (area1.options[area1.selectedIndex].text != "اخر") {
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
  totalArea_result.innerText = (totalArea() || 0).toFixed(2);
  price_result.innerText = Math.floor(getprice() || 0).toLocaleString();
  area_result1.innerText = Math.floor(acre() || 0);
  area_result2.innerText = Math.floor(carats() || 0);
  area_result3.innerText = (shares() || 0).toFixedNoRounding(2);
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
  canvas.height = 600;
  const ctx = canvas.getContext("2d");

  // Fill white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const w1 = Number(width1.value) || 0;
  const w2 = Number(width2.value) || 0;
  const h = Number(height.value) || 0;

  const maxW = Math.max(w1, w2);
  const scaleX = 400 / maxW;
  const scaleY = 400 / h;
  const scale = Math.min(scaleX, scaleY);

  const drawW1 = w1 * scale;
  const drawW2 = w2 * scale;
  const drawH = h * scale;

  const centerX = 300;
  const centerY = 300;

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

  ctx.fillStyle = "#e8f5e9";
  ctx.fill();
  ctx.strokeStyle = "#2e7d32";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Draw dashed line for height in the center
  ctx.beginPath();
  ctx.setLineDash([5, 5]);
  ctx.moveTo(centerX, p1.y);
  ctx.lineTo(centerX, p4.y);
  ctx.strokeStyle = "#388e3c";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw labels
  ctx.fillStyle = "#222222";
  ctx.font = "bold 13px Cairo, Arial, sans-serif";
  ctx.textAlign = "center";

  // Top side label
  ctx.fillText(`العرض الأول: ${w1} م`, centerX, p1.y - 12);
  
  // Bottom side label
  ctx.fillText(`العرض الآخر: ${w2} م`, centerX, p4.y + 22);

  // Height side label
  ctx.textAlign = "right";
  ctx.fillText(`الطول: ${h} م`, centerX - 10, centerY);

  // Details inside the shape
  ctx.fillStyle = "#1b5e20";
  ctx.font = "bold 13px Cairo, Arial, sans-serif";
  ctx.textAlign = "center";

  const totalArea = totalArea_result.innerText;
  const feddan = area_result1.innerText;
  const carat = area_result2.innerText;
  const shares_val = area_result3.innerText;
  const priceVal = price_result.innerText;

  let startY = centerY - 25;
  ctx.fillText("المساحة الكلية", centerX, startY);
  ctx.font = "bold 15px Cairo, Arial, sans-serif";
  ctx.fillText(`${totalArea} م²`, centerX, startY + 20);
  ctx.font = "bold 12px Cairo, Arial, sans-serif";
  ctx.fillText(`${feddan} فدان ، ${carat} قيراط ، ${shares_val} سهم`, centerX, startY + 40);

  if (priceVal && priceVal !== "0") {
    ctx.font = "bold 12px Cairo, Arial, sans-serif";
    ctx.fillText(`إجمالي السعر: ${priceVal} جنيه`, centerX, startY + 60);
  }

  const imgURL = canvas.toDataURL("image/png");

  const now = new Date();
  const dateStr = now.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("ar-EG");

  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>كروكي الأرض والنتائج - الدلال</title>
      <style>
        body {
          font-family: 'Cairo', Arial, sans-serif;
          margin: 20px;
          color: #333;
          direction: rtl;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #2e7d32;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          color: #1b5e20;
          font-size: 24px;
        }
        .header p {
          margin: 5px 0 0;
          color: #666;
          font-size: 14px;
        }
        .container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .sketch {
          border: 2px solid #2e7d32;
          border-radius: 10px;
          padding: 10px;
          background: #f9f9f9;
          max-width: 500px;
          width: 100%;
        }
        .sketch img {
          width: 100%;
          height: auto;
          display: block;
        }
        .results-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .results-table th, .results-table td {
          border: 1px solid #ddd;
          padding: 10px;
          text-align: center;
          font-size: 14px;
        }
        .results-table th {
          background-color: #e8f5e9;
          color: #2e7d32;
          font-weight: bold;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #888;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
        @media print {
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>تقرير كروكي الأرض الزراعية</h1>
        <p>تاريخ الطباعة: ${dateStr} - الساعة: ${timeStr}</p>
      </div>

      <div class="container">
        <div class="sketch">
          <img src="${imgURL}" alt="كروكي الأرض">
        </div>

        <table class="results-table">
          <thead>
            <tr>
              <th>البيان</th>
              <th>القياس / الناتج</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>العرض الأول</td>
              <td>${w1} متر</td>
            </tr>
            <tr>
              <td>العرض الآخر</td>
              <td>${w2} متر</td>
            </tr>
            <tr>
              <td>الطول</td>
              <td>${h} متر</td>
            </tr>
            <tr>
              <td>المساحة الإجمالية</td>
              <td><strong>${totalArea} متر مربع</strong></td>
            </tr>
            <tr>
              <td>المساحة بالفدان والقيراط والسهم</td>
              <td>${feddan} فدان و ${carat} قيراط و ${shares_val} سهم</td>
            </tr>
            ${priceVal && priceVal !== "0" ? '<tr><td>إجمالي السعر</td><td><strong>' + priceVal + ' جنيه</strong></td></tr>' : ""}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>تطبيق الدلال لحساب ورسم وتقسيم الأراضي الزراعية © ${now.getFullYear()}</p>
        <button class="no-print" onclick="window.print()" style="margin-top: 15px; padding: 10px 20px; background-color: #2e7d32; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">بدء الطباعة</button>
      </div>
    </body>
    </html>
  \`);
  printWindow.document.close();
}
