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
  const reportId = `DL-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const printContent = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تقرير نزع وطرح الأراضي - الدلال</title>
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
    
    .summary-box { border: 2px solid #1b5e20; border-radius: 8px; background: #f1f8e9; padding: 10px 15px; display: flex; flex-direction: column; gap: 8px; -webkit-print-color-adjust: exact; print-color-adjust: exact; margin-bottom: 15px; }
    .summary-grid { display: flex; justify-content: space-between; gap: 20px; }
    .summary-item { flex: 1; font-size: 9.5pt; color: #222; }
    .summary-item strong { color: #1b5e20; }
    
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
      .summary-box { border-color: #000 !important; background: #fff !important; }
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
      <h2>تقرير نزع وطرح الأراضي الزراعية</h2>
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

  <div class="section page-break-inside-avoid">
    <div class="section-title">1. بيانات الأرض الأساسية</div>
    <div class="summary-box">
      <div class="summary-grid">
        <div class="summary-item">مساحة الأرض الكلية: <strong>${acreInput} فدان، ${caratInput} قيراط، ${sharesInput} سهم</strong></div>
        <div class="summary-item">معدل النزع لكل قيراط: <strong>${sharesToSubtract} سهم</strong></div>
      </div>
    </div>
  </div>

  <div class="section page-break-inside-avoid">
    <div class="section-title">2. تفاصيل حسابات النزع والبيع للأنصبة</div>
    <table>
      <thead>
        <tr>
          <th style="text-align: right; padding-right: 15px; width: 40%;">البيان الحسابي</th>
          <th>سهم</th>
          <th>قيراط</th>
          <th>فدان</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-weight: bold; text-align: right; padding-right: 15px;">مساحة الأرض الكلية</td>
          <td>${sharesInput}</td>
          <td>${caratInput}</td>
          <td>${acreInput}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; text-align: right; padding-right: 15px; color: #c62828;">إجمالي المساحة المنزوعة</td>
          <td style="color: #c62828; font-weight: bold;">${subtractedShares}</td>
          <td style="color: #c62828; font-weight: bold;">${subtractedCarat}</td>
          <td style="color: #c62828; font-weight: bold;">${subtractedAcre}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; text-align: right; padding-right: 15px; color: #2e7d32;">المساحة المتبقية بعد النزع</td>
          <td style="color: #2e7d32; font-weight: bold;">${remShares}</td>
          <td style="color: #2e7d32; font-weight: bold;">${remCarat}</td>
          <td style="color: #2e7d32; font-weight: bold;">${remAcre}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; text-align: right; padding-right: 15px; color: #e65100;">المساحة المباعة</td>
          <td style="color: #e65100;">${sharesSold}</td>
          <td style="color: #e65100;">${caratSold}</td>
          <td style="color: #e65100;">${acreSold}</td>
        </tr>
        <tr style="background-color: #f1f8e9; font-weight: bold;">
          <td style="font-weight: bold; text-align: right; padding-right: 15px; color: #1b5e20; font-size: 10pt;">الناتج النهائي (المتبقي الفعلي)</td>
          <td style="color: ${parseFloat(finalAcre) < 0 || parseFloat(finalCarat) < 0 || parseFloat(finalShares) < 0 ? '#d32f2f' : '#1b5e20'}; font-size: 10pt;">${finalShares}</td>
          <td style="color: ${parseFloat(finalAcre) < 0 || parseFloat(finalCarat) < 0 || parseFloat(finalShares) < 0 ? '#d32f2f' : '#1b5e20'}; font-size: 10pt;">${finalCarat}</td>
          <td style="color: ${parseFloat(finalAcre) < 0 || parseFloat(finalCarat) < 0 || parseFloat(finalShares) < 0 ? '#d32f2f' : '#1b5e20'}; font-size: 10pt;">${finalAcre}</td>
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
