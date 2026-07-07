// Load data from sessionStorage when the page loads
window.onload = function () {
  loadData();
};

// Function to save input field data to sessionStorage
function saveData() {
  sessionStorage.setItem(
    "shares",
    document.getElementById("input-shares").value
  );
  sessionStorage.setItem("carat", document.getElementById("input-carat").value);
  sessionStorage.setItem("acre", document.getElementById("input-acre").value);
  sessionStorage.setItem(
    "shares_subtract",
    document.getElementById("shares-subtract-each-carat").value
  );
  sessionStorage.setItem(
    "shares_sold",
    document.getElementById("input-shares-sold").value
  );
  sessionStorage.setItem(
    "carat_sold",
    document.getElementById("input-carat-sold").value
  );
  sessionStorage.setItem(
    "acre_sold",
    document.getElementById("input-acre-sold").value
  );
}

// Function to retrieve and set input field data from sessionStorage
function loadData() {
  document.getElementById("input-shares").value =
    sessionStorage.getItem("shares") || "";
  document.getElementById("input-carat").value =
    sessionStorage.getItem("carat") || "";
  document.getElementById("input-acre").value =
    sessionStorage.getItem("acre") || "";
  document.getElementById("shares-subtract-each-carat").value =
    sessionStorage.getItem("shares_subtract") || "";
  document.getElementById("input-shares-sold").value =
    sessionStorage.getItem("shares_sold") || "";
  document.getElementById("input-carat-sold").value =
    sessionStorage.getItem("carat_sold") || "";
  document.getElementById("input-acre-sold").value =
    sessionStorage.getItem("acre_sold") || "";

  calculateValues();
}

// Add event listeners to save data on input change
document.getElementById("input-shares").addEventListener("input", saveData);
document.getElementById("input-carat").addEventListener("input", saveData);
document.getElementById("input-acre").addEventListener("input", saveData);
document
  .getElementById("shares-subtract-each-carat")
  .addEventListener("input", saveData);
document
  .getElementById("input-shares-sold")
  .addEventListener("input", saveData);
document.getElementById("input-carat-sold").addEventListener("input", saveData);
document.getElementById("input-acre-sold").addEventListener("input", saveData);

function convertSharesToThree(shares) {
  // Check if the input value is negative
  let isNegative = shares < 0;
  if (isNegative) {
    // Convert shares to positive for calculation
    shares = Math.abs(shares);
  }

  let acre = Math.floor(shares / (24 * 24));
  shares -= acre * 24 * 24;

  let carat = Math.floor(shares / 24);
  shares -= carat * 24;

  // Convert acre, carat, and shares back to negative if the original input was negative
  if (isNegative) {
    acre = -acre;
    carat = -carat;
    shares = -shares;
  }

  return [acre, carat, shares.toFixed(2)];
}

function calculateValues() {
  // Get input values or set to 0 if empty
  let sharesInput =
    parseFloat(document.getElementById("input-shares").value) || 0;
  let caratInput =
    parseFloat(document.getElementById("input-carat").value) || 0;
  let acreInput = parseFloat(document.getElementById("input-acre").value) || 0;
  let totalShares = sharesInput + caratInput * 24 + acreInput * 24 * 24;
  console.log("totalShares:", totalShares);

  let inputSharesSold =
    parseFloat(document.getElementById("input-shares-sold").value) || 0;
  let inputCaratsSold =
    parseFloat(document.getElementById("input-carat-sold").value) || 0;
  let inputAcresSold =
    parseFloat(document.getElementById("input-acre-sold").value) || 0;
  let totalSharesSold =
    inputSharesSold + inputCaratsSold * 24 + inputAcresSold * 24 * 24;
  console.log("totalSharesSold:", totalSharesSold);

  // Convert input shares to total shares

  // Calculate total shares of subtract
  let sharesToSubtract =
    parseFloat(document.getElementById("shares-subtract-each-carat").value) ||
    0;
  let totalSharesOfSubtract = sharesToSubtract * (totalShares / 24);
  console.log("totalSharesOfSubtract:", totalSharesOfSubtract);

  let totalShareAfterSubtract = totalShares - totalSharesOfSubtract;
  console.log("totalShareAfterSubtract:", totalShareAfterSubtract);

  // Get elements by their IDs
  let [acre, carat, shares] = convertSharesToThree(totalSharesOfSubtract);
  document.getElementById("subtracted-acre").textContent = acre;
  document.getElementById("subtracted-shares").textContent = shares;
  document.getElementById("subtracted-carat").textContent = carat;

  [acre, carat, shares] = convertSharesToThree(totalShareAfterSubtract);
  document.getElementById("acre-after-subtract").textContent = acre;
  document.getElementById("shares-after-subtract").textContent = shares;
  document.getElementById("carat-after-subtract").textContent = carat;

  let sharesSoldMinusSharesAfter = totalShareAfterSubtract - totalSharesSold;
  console.log("sharesSoldMinusSharesAfter:", sharesSoldMinusSharesAfter);

  // Save the IDs in variables
  const acreSoldMinusAfterSubtractElement = document.getElementById(
    "acre-sold-minus-after-subtract"
  );
  const sharesSoldMinusAfterSubtractElement = document.getElementById(
    "shares-sold-minus-after-subtract"
  );
  const caratSoldMinusAfterSubtractElement = document.getElementById(
    "carat-sold-minus-after-subtract"
  );

  [acre, carat, shares] = convertSharesToThree(sharesSoldMinusSharesAfter);
  acreSoldMinusAfterSubtractElement.textContent = acre;
  sharesSoldMinusAfterSubtractElement.textContent = shares;
  caratSoldMinusAfterSubtractElement.textContent = carat;

  // Use ternary operator to set the color based on the value being negative or positive
  acreSoldMinusAfterSubtractElement.style.color =
    acreSoldMinusAfterSubtractElement.textContent < 0 ? "red" : "black";
  sharesSoldMinusAfterSubtractElement.style.color =
    sharesSoldMinusAfterSubtractElement.textContent < 0 ? "red" : "black";
  caratSoldMinusAfterSubtractElement.style.color =
    caratSoldMinusAfterSubtractElement.textContent < 0 ? "red" : "black";
}

function clearAll() {
  // Store the IDs of input and output fields
  const inputFieldIDs = [
    "input-shares",
    "input-carat",
    "input-acre",
    "input-shares-sold",
    "input-carat-sold",
    "input-acre-sold",
    "shares-subtract-each-carat",
  ];

  const outputFieldIDs = [
    "subtracted-acre",
    "subtracted-shares",
    "subtracted-carat",
    "acre-after-subtract",
    "shares-after-subtract",
    "carat-after-subtract",
    "acre-sold-minus-after-subtract",
    "shares-sold-minus-after-subtract",
    "carat-sold-minus-after-subtract",
  ];
  // Clear input fields
  inputFieldIDs.forEach((id) => {
    document.getElementById(id).value = "";
  });

  // Clear output fields
  outputFieldIDs.forEach((id) => {
    document.getElementById(id).textContent = "0";
  });

  saveData();
}

function validateShareInput(input) {
  const maxAllowed = 24;
  if (input.value > maxAllowed) {
    input.value = maxAllowed; // تصحيح القيمة المدخلة
    // alert("القيمة المدخلة أكبر من الحد المسموح به لكل قيراط (24 سهمًا كحد أقصى).");
  }
}

function printReport() {
  const acreInput = document.getElementById("input-acre").value || 0;
  const caratInput = document.getElementById("input-carat").value || 0;
  const sharesInput = document.getElementById("input-shares").value || 0;

  const sharesToSubtract = document.getElementById("shares-subtract-each-carat").value || 0;

  const subtractedAcre = document.getElementById("subtracted-acre").textContent || 0;
  const subtractedCarat = document.getElementById("subtracted-carat").textContent || 0;
  const subtractedShares = document.getElementById("subtracted-shares").textContent || 0;

  const remAcre = document.getElementById("acre-after-subtract").textContent || 0;
  const remCarat = document.getElementById("carat-after-subtract").textContent || 0;
  const remShares = document.getElementById("shares-after-subtract").textContent || 0;

  const acreSold = document.getElementById("input-acre-sold").value || 0;
  const caratSold = document.getElementById("input-carat-sold").value || 0;
  const sharesSold = document.getElementById("input-shares-sold").value || 0;

  const finalAcre = document.getElementById("acre-sold-minus-after-subtract").textContent || 0;
  const finalCarat = document.getElementById("carat-sold-minus-after-subtract").textContent || 0;
  const finalShares = document.getElementById("shares-sold-minus-after-subtract").textContent || 0;

  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('ar-EG');

  const printContent = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تقرير نزع وطرح الأراضي - الدلال</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    body { font-family: 'Cairo', Arial, sans-serif; direction: rtl; padding: 20px; background: #fff; color: #333; position: relative; min-height: 96vh; }
    .header { text-align: center; border-bottom: 2px solid #2e7d32; padding-bottom: 15px; margin-bottom: 25px; }
    .header h1 { color: #2e7d32; margin: 0; font-size: 24px; }
    .header p { margin: 5px 0 0 0; color: #666; font-size: 13px; }
    .section-title { font-size: 16px; font-weight: bold; color: #1b5e20; margin-bottom: 15px; border-right: 4px solid #2e7d32; padding-right: 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: center; }
    th { background-color: #f5f5f5; color: #1b5e20; font-weight: bold; }
    .summary-box { background: #f1f8e9; border: 1px solid #a5d6a7; border-radius: 8px; padding: 15px; margin-bottom: 25px; }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .summary-item { font-size: 14px; }
    .summary-item strong { color: #1b5e20; font-size: 16px; }
    .footer { text-align: center; color: #888; font-size: 11px; border-top: 1px solid #eee; padding-top: 10px; margin-top: 30px; }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-25deg);
      font-size: 19px;
      color: #2e7d32;
      opacity: 0.14;
      font-weight: bold;
      white-space: nowrap;
      pointer-events: none;
      z-index: 9999;
      font-family: 'Cairo', Arial, sans-serif;
      user-select: none;
      text-align: center;
      width: 100%;
    }
    @media print {
      body { padding: 10px; }
      .watermark {
        color: #000 !important;
        opacity: 0.08 !important;
      }
    }
  </style>
</head>
<body>
  <!-- Watermark Overlay -->
  <div class="watermark">تم تنفيذ هذا التقرير باستخدام تطبيق الدَّلاَّل لقياسات الأراضي، والمتوفر على Google Play.</div>

  <div class="header">
    <h1>🌿 تقرير نزع وطرح الأراضي - تطبيق الدَّلاَّل</h1>
    <p>تاريخ التقرير: ${dateStr} — ${timeStr}</p>
  </div>

  <div class="summary-box">
    <div class="section-title">بيانات الأرض الأساسية</div>
    <div class="summary-grid">
      <div class="summary-item">مساحة الأرض الكلية: <strong>${acreInput} فدان، ${caratInput} قيراط، ${sharesInput} سهم</strong></div>
      <div class="summary-item">معدل النزع لكل قيراط: <strong>${sharesToSubtract} سهم</strong></div>
    </div>
  </div>

  <div class="section-title">تفاصيل حسابات النزع والبيع</div>
  <table>
    <thead>
      <tr>
        <th style="text-align:right;">البيان</th>
        <th>سهم</th>
        <th>قيراط</th>
        <th>فدان</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="font-weight:bold; text-align:right;">مساحة الأرض الكلية</td>
        <td>${sharesInput}</td>
        <td>${caratInput}</td>
        <td>${acreInput}</td>
      </tr>
      <tr>
        <td style="font-weight:bold; text-align:right; color:#c62828;">إجمالي المساحة المنزوعة</td>
        <td style="color:#c62828; font-weight:bold;">${subtractedShares}</td>
        <td style="color:#c62828; font-weight:bold;">${subtractedCarat}</td>
        <td style="color:#c62828; font-weight:bold;">${subtractedAcre}</td>
      </tr>
      <tr style="background-color:#f9f9f9;">
        <td style="font-weight:bold; text-align:right; color:#2e7d32;">المساحة المتبقية بعد النزع</td>
        <td style="color:#2e7d32; font-weight:bold;">${remShares}</td>
        <td style="color:#2e7d32; font-weight:bold;">${remCarat}</td>
        <td style="color:#2e7d32; font-weight:bold;">${remAcre}</td>
      </tr>
      <tr>
        <td style="font-weight:bold; text-align:right; color:#e65100;">المساحة المباعة</td>
        <td style="color:#e65100;">${sharesSold}</td>
        <td style="color:#e65100;">${caratSold}</td>
        <td style="color:#e65100;">${acreSold}</td>
      </tr>
      <tr style="background-color:#fff8e1; font-weight:bold;">
        <td style="font-weight:bold; text-align:right; color:#1b5e20;">الناتج النهائي (المتبقي الفعلي)</td>
        <td style="color:${parseFloat(finalAcre) < 0 || parseFloat(finalCarat) < 0 || parseFloat(finalShares) < 0 ? '#d32f2f' : '#1b5e20'};">${finalShares}</td>
        <td style="color:${parseFloat(finalAcre) < 0 || parseFloat(finalCarat) < 0 || parseFloat(finalShares) < 0 ? '#d32f2f' : '#1b5e20'};">${finalCarat}</td>
        <td style="color:${parseFloat(finalAcre) < 0 || parseFloat(finalCarat) < 0 || parseFloat(finalShares) < 0 ? '#d32f2f' : '#1b5e20'};">${finalAcre}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">تم تنفيذ هذا التقرير باستخدام تطبيق الدَّلاَّل لقياسات الأراضي، والمتوفر على Google Play.</div>
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
