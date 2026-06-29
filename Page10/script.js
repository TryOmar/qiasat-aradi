// ==========================================
// جمع وطرح الأراضي الزراعية - script.js
// ==========================================

// --- Data Arrays ---
let areas = [
  { name: "", shares: "", carat: "", acre: "", sign: "plus" },
  { name: "", shares: "", carat: "", acre: "", sign: "plus" }
];

let discounts = [
  { name: "", shares: "", carat: "", acre: "" }
];

let individualNames = [];

// --- Initialization ---
document.addEventListener("DOMContentLoaded", function () {
  loadData();
  renderAreas();
  renderDiscounts();
  restoreIndividuals();
  calculate();
});

// ==========================================
// AREA TABLE (جدول الجمع)
// ==========================================

function getAreaTitle(index) {
  const ordinals = ["الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة", "السابعة", "الثامنة", "التاسعة", "العاشرة"];
  if (index < ordinals.length) {
    return `المساحة ${ordinals[index]}`;
  }
  return `المساحة ${index + 1}`;
}

function syncAreasFromDOM() {
  const rows = document.querySelectorAll("#lands-table-body tr");
  rows.forEach((row, i) => {
    if (areas[i]) {
      const nameInput = row.querySelector(".area-name-input");
      const sharesInput = row.querySelector(".area-shares");
      const caratInput = row.querySelector(".area-carat");
      const acreInput = row.querySelector(".area-acre");
      if (nameInput) areas[i].name = nameInput.value;
      if (sharesInput) areas[i].shares = sharesInput.value;
      if (caratInput) areas[i].carat = caratInput.value;
      if (acreInput) areas[i].acre = acreInput.value;
    }
  });
}

function renderAreas() {
  const tbody = document.getElementById("lands-table-body");
  let html = "";
  for (let i = 0; i < areas.length; i++) {
    const area = areas[i];
    html += `
      <tr id="area-block-${i}">
        <td style="vertical-align: middle; font-weight: bold; color: #666; font-size: 13px;">${i + 1}</td>
        <td style="vertical-align: middle;">
          <input type="number" class="area-shares" data-index="${i}" placeholder="0" oninput="onAreaInput(${i})" value="${area.shares || ''}">
        </td>
        <td style="vertical-align: middle;">
          <input type="number" class="area-carat" data-index="${i}" placeholder="0" oninput="onAreaInput(${i})" value="${area.carat || ''}">
        </td>
        <td style="vertical-align: middle;">
          <input type="number" class="area-acre" data-index="${i}" placeholder="0" oninput="onAreaInput(${i})" value="${area.acre || ''}">
        </td>
        <td style="vertical-align: middle;">
          <input type="text" class="area-name-input" data-index="${i}" placeholder="مثال: الغيط الكبير" oninput="onAreaInput(${i})" value="${area.name || ''}">
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

function onAreaInput(index) {
  syncAreasFromDOM();
  // Auto-add row if typing in the last row
  if (index === areas.length - 1) {
    const area = areas[index];
    if (area.name || area.shares || area.carat || area.acre) {
      areas.push({ name: "", shares: "", carat: "", acre: "", sign: "plus" });
      // Append a new row without re-rendering to preserve focus
      appendAreaRow(areas.length - 1);
    }
  }
  calculate();
  saveData();
}

function appendAreaRow(i) {
  const tbody = document.getElementById("lands-table-body");
  const tr = document.createElement("tr");
  tr.id = `area-block-${i}`;
  tr.innerHTML = `
    <td style="vertical-align: middle; font-weight: bold; color: #666; font-size: 13px;">${i + 1}</td>
    <td style="vertical-align: middle;">
      <input type="number" class="area-shares" data-index="${i}" placeholder="0" oninput="onAreaInput(${i})" value="">
    </td>
    <td style="vertical-align: middle;">
      <input type="number" class="area-carat" data-index="${i}" placeholder="0" oninput="onAreaInput(${i})" value="">
    </td>
    <td style="vertical-align: middle;">
      <input type="number" class="area-acre" data-index="${i}" placeholder="0" oninput="onAreaInput(${i})" value="">
    </td>
    <td style="vertical-align: middle;">
      <input type="text" class="area-name-input" data-index="${i}" placeholder="مثال: الغيط الكبير" oninput="onAreaInput(${i})" value="">
    </td>
    <td class="no-print" style="vertical-align: middle; text-align: center;">
      <button type="button" class="btn-remove-area" onclick="removeArea(${i})" title="حذف هذه المساحة" style="display: inline-flex; align-items: center; justify-content: center; background: none; border: none; color: #d32f2f; cursor: pointer; padding: 0; margin: 0;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </td>
  `;
  tbody.appendChild(tr);
}

function addArea() {
  syncAreasFromDOM();
  areas.push({ name: "", shares: "", carat: "", acre: "", sign: "plus" });
  renderAreas();
  saveData();
  calculate();
}

function removeArea(index) {
  syncAreasFromDOM();
  if (areas.length > 1) {
    areas.splice(index, 1);
  }
  renderAreas();
  saveData();
  calculate();
}

// ==========================================
// DISCOUNT TABLE (جدول الخصم)
// ==========================================

function syncDiscountsFromDOM() {
  const rows = document.querySelectorAll("#discount-table-body tr");
  rows.forEach((row, i) => {
    if (discounts[i]) {
      const nameInput = row.querySelector(".discount-name-input");
      const sharesInput = row.querySelector(".discount-shares");
      const caratInput = row.querySelector(".discount-carat");
      const acreInput = row.querySelector(".discount-acre");
      if (nameInput) discounts[i].name = nameInput.value;
      if (sharesInput) discounts[i].shares = sharesInput.value;
      if (caratInput) discounts[i].carat = caratInput.value;
      if (acreInput) discounts[i].acre = acreInput.value;
    }
  });
}

function renderDiscounts() {
  const tbody = document.getElementById("discount-table-body");
  let html = "";
  for (let i = 0; i < discounts.length; i++) {
    const d = discounts[i];
    html += `
      <tr id="discount-block-${i}">
        <td style="vertical-align: middle; font-weight: bold; color: #666; font-size: 13px;">${i + 1}</td>
        <td style="vertical-align: middle;">
          <input type="number" class="discount-shares" data-index="${i}" placeholder="0" oninput="onDiscountInput(${i})" value="${d.shares || ''}">
        </td>
        <td style="vertical-align: middle;">
          <input type="number" class="discount-carat" data-index="${i}" placeholder="0" oninput="onDiscountInput(${i})" value="${d.carat || ''}">
        </td>
        <td style="vertical-align: middle;">
          <input type="number" class="discount-acre" data-index="${i}" placeholder="0" oninput="onDiscountInput(${i})" value="${d.acre || ''}">
        </td>
        <td style="vertical-align: middle;">
          <input type="text" class="discount-name-input" data-index="${i}" placeholder="مثال: مشروع صرف" oninput="onDiscountInput(${i})" value="${d.name || ''}">
        </td>
        <td class="no-print" style="vertical-align: middle; text-align: center;">
          ${discounts.length > 1 ? `
            <button type="button" class="btn-remove-area" onclick="removeDiscount(${i})" title="حذف هذا الخصم" style="display: inline-flex; align-items: center; justify-content: center; background: none; border: none; color: #d32f2f; cursor: pointer; padding: 0; margin: 0;">
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

function onDiscountInput(index) {
  syncDiscountsFromDOM();
  // Auto-add row if typing in the last row
  if (index === discounts.length - 1) {
    const d = discounts[index];
    if (d.name || d.shares || d.carat || d.acre) {
      discounts.push({ name: "", shares: "", carat: "", acre: "" });
      appendDiscountRow(discounts.length - 1);
    }
  }
  calculate();
  saveData();
}

function appendDiscountRow(i) {
  const tbody = document.getElementById("discount-table-body");
  const d = discounts[i];
  const tr = document.createElement("tr");
  tr.id = `discount-block-${i}`;
  tr.innerHTML = `
    <td style="vertical-align: middle; font-weight: bold; color: #666; font-size: 13px;">${i + 1}</td>
    <td style="vertical-align: middle;">
      <input type="number" class="discount-shares" data-index="${i}" placeholder="0" oninput="onDiscountInput(${i})" value="">
    </td>
    <td style="vertical-align: middle;">
      <input type="number" class="discount-carat" data-index="${i}" placeholder="0" oninput="onDiscountInput(${i})" value="">
    </td>
    <td style="vertical-align: middle;">
      <input type="number" class="discount-acre" data-index="${i}" placeholder="0" oninput="onDiscountInput(${i})" value="">
    </td>
    <td style="vertical-align: middle;">
      <input type="text" class="discount-name-input" data-index="${i}" placeholder="مثال: مشروع صرف" oninput="onDiscountInput(${i})" value="">
    </td>
    <td class="no-print" style="vertical-align: middle; text-align: center;">
      <button type="button" class="btn-remove-area" onclick="removeDiscount(${i})" title="حذف هذا الخصم" style="display: inline-flex; align-items: center; justify-content: center; background: none; border: none; color: #d32f2f; cursor: pointer; padding: 0; margin: 0;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </td>
  `;
  tbody.appendChild(tr);
}

function removeDiscount(index) {
  syncDiscountsFromDOM();
  if (discounts.length > 1) {
    discounts.splice(index, 1);
  }
  renderDiscounts();
  saveData();
  calculate();
}

// ==========================================
// INDIVIDUALS (الأفراد)
// ==========================================

function handleIndividualsCountChange() {
  const countInput = document.getElementById("individuals-count");
  const count = parseInt(countInput.value) || 0;
  const container = document.getElementById("individuals-names-container");

  // Preserve existing names
  const existingInputs = container.querySelectorAll(".individual-name-input");
  const existingNames = [];
  existingInputs.forEach(input => existingNames.push(input.value));

  // Build new name fields
  let html = "";
  const ordinals = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر"];
  for (let i = 0; i < count; i++) {
    const label = i < ordinals.length ? `اسم الفرد ${ordinals[i]}` : `اسم الفرد ${i + 1}`;
    const existingValue = i < existingNames.length ? existingNames[i] : "";
    html += `
      <div class="input-group-custom">
        <label>${label}:</label>
        <input type="text" class="individual-name-input" data-index="${i}" placeholder="${label}" value="${existingValue}" oninput="onIndividualNameChange()" style="flex: 1; height: 34px; border-radius: 8px; border: 1px solid #ccc; padding: 0 10px; color: black !important; font-size: 13px;">
      </div>
    `;
  }
  container.innerHTML = html;

  // Update individual names array
  individualNames = [];
  for (let i = 0; i < count; i++) {
    individualNames.push(i < existingNames.length ? existingNames[i] : "");
  }

  calculate();
  saveData();
}

function onIndividualNameChange() {
  const inputs = document.querySelectorAll(".individual-name-input");
  individualNames = [];
  inputs.forEach(input => individualNames.push(input.value));
  calculate();
  saveData();
}

function restoreIndividuals() {
  const countInput = document.getElementById("individuals-count");
  const savedCount = sessionStorage.getItem("individuals-count");
  const savedNames = sessionStorage.getItem("individual-names");

  if (savedCount) {
    countInput.value = savedCount;
  }
  if (savedNames) {
    try {
      individualNames = JSON.parse(savedNames);
    } catch (e) {
      individualNames = [];
    }
  }

  const count = parseInt(countInput.value) || 0;
  if (count > 0) {
    const container = document.getElementById("individuals-names-container");
    const ordinals = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر"];
    let html = "";
    for (let i = 0; i < count; i++) {
      const label = i < ordinals.length ? `اسم الفرد ${ordinals[i]}` : `اسم الفرد ${i + 1}`;
      const val = i < individualNames.length ? individualNames[i] : "";
      html += `
        <div class="input-group-custom">
          <label>${label}:</label>
          <input type="text" class="individual-name-input" data-index="${i}" placeholder="${label}" value="${val}" oninput="onIndividualNameChange()" style="flex: 1; height: 34px; border-radius: 8px; border: 1px solid #ccc; padding: 0 10px; color: black !important; font-size: 13px;">
        </div>
      `;
    }
    container.innerHTML = html;
  }
}

// ==========================================
// HELPER: Convert sahms to units
// ==========================================

function sahmsToUnits(totalSahms) {
  const isNegative = totalSahms < 0;
  const abs = Math.abs(totalSahms);
  const acre = Math.floor(abs / 576);
  const remaining = abs % 576;
  const carat = Math.floor(remaining / 24);
  const shares = +(remaining % 24).toFixed(3);
  return { acre, carat, shares, isNegative, prefix: isNegative ? "-" : "" };
}

// ==========================================
// CALCULATION
// ==========================================

function calculate() {
  syncAreasFromDOM();
  syncDiscountsFromDOM();

  // --- 1. Calculate total area from lands table (always addition) ---
  let totalAreaSahms = 0;
  areas.forEach(area => {
    const sh = parseFloat(area.shares) || 0;
    const ca = parseFloat(area.carat) || 0;
    const ac = parseFloat(area.acre) || 0;
    const sahms = ac * 576 + ca * 24 + sh;
    totalAreaSahms += sahms;
  });

  const totalUnits = sahmsToUnits(totalAreaSahms);

  // Update table footer
  document.getElementById("total-acre").innerText = totalUnits.prefix + totalUnits.acre;
  document.getElementById("total-carat").innerText = totalUnits.carat;
  document.getElementById("total-shares").innerText = totalUnits.shares;

  // Update total area section
  document.getElementById("total-area-acre").innerText = totalUnits.prefix + totalUnits.acre;
  document.getElementById("total-area-carat").innerText = totalUnits.carat;
  document.getElementById("total-area-shares").innerText = totalUnits.shares;

  // Total in qarats
  const totalQarats = +(totalAreaSahms / 24).toFixed(3);
  document.getElementById("total-area-only-carat").innerText = totalQarats + " قيراط";

  // --- 2. Calculate total discounts ---
  let totalDiscountSahms = 0;
  discounts.forEach(d => {
    const sh = parseFloat(d.shares) || 0;
    const ca = parseFloat(d.carat) || 0;
    const ac = parseFloat(d.acre) || 0;
    totalDiscountSahms += ac * 576 + ca * 24 + sh;
  });

  const discountUnits = sahmsToUnits(totalDiscountSahms);
  document.getElementById("total-discount-acre").innerText = discountUnits.acre;
  document.getElementById("total-discount-carat").innerText = discountUnits.carat;
  document.getElementById("total-discount-shares").innerText = discountUnits.shares;

  // --- 3. Calculate remaining ---
  const remainingSahms = totalAreaSahms - totalDiscountSahms;
  const remainingUnits = sahmsToUnits(remainingSahms);

  document.getElementById("remaining-acre").innerText = remainingUnits.prefix + remainingUnits.acre;
  document.getElementById("remaining-carat").innerText = remainingUnits.carat;
  document.getElementById("remaining-shares").innerText = remainingUnits.shares;

  // M2 conversion for remaining
  let caratArea = parseFloat(document.getElementById("input-carat-area").value);
  if (caratArea === 0) {
    caratArea = parseFloat(document.getElementById("other-input-field").value) || 0;
  }

  const remainingQarats = remainingSahms / 24;
  const remainingM2 = remainingQarats * caratArea;
  const squareReeds = remainingM2 / 12.6025;
  document.getElementById("remaining-m2").innerHTML = `${remainingM2.toFixed(3)} م² <br><span style="font-size: 12px; color: gray; font-weight: normal;">(تعادل ${squareReeds.toFixed(3)} قصبة مربعة)</span>`;

  // --- 4. Distribution ---
  const countInput = document.getElementById("individuals-count");
  const count = parseInt(countInput.value) || 0;
  const distSection = document.getElementById("distribution-section");
  const distBody = document.getElementById("distribution-table-body");

  if (count > 0) {
    distSection.style.display = "block";
    const sharePerPerson = remainingSahms / count;
    const perPersonUnits = sahmsToUnits(sharePerPerson);
    const perPersonQarats = sharePerPerson / 24;
    const perPersonM2 = perPersonQarats * caratArea;

    let html = "";
    const ordinals = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر"];

    for (let i = 0; i < count; i++) {
      const name = (individualNames[i] && individualNames[i].trim()) ||
        (i < ordinals.length ? `الفرد ${ordinals[i]}` : `الفرد ${i + 1}`);
      html += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${i + 1}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${name}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${perPersonUnits.shares}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${perPersonUnits.carat}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${perPersonUnits.prefix}${perPersonUnits.acre}</td>
          <td style="padding: 8px; border: 1px solid #ddd; direction: ltr;">${perPersonM2.toFixed(2)} م²</td>
        </tr>
      `;
    }
    distBody.innerHTML = html;
  } else {
    distSection.style.display = "none";
    distBody.innerHTML = "";
  }

  // --- 5. Update report ---
  updateReport(caratArea, totalAreaSahms, totalDiscountSahms, remainingSahms, count);
}

// ==========================================
// REPORT
// ==========================================

function updateReport(caratArea, totalAreaSahms, totalDiscountSahms, remainingSahms, individualsCount) {
  const reportContainer = document.getElementById("report-container");
  const reportContent = document.getElementById("report-content");

  // Check if there is meaningful data to show
  const hasAreaData = areas.some(a => (parseFloat(a.shares) || 0) + (parseFloat(a.carat) || 0) + (parseFloat(a.acre) || 0) > 0);
  if (!hasAreaData) {
    reportContainer.style.display = "none";
    return;
  }
  reportContainer.style.display = "block";

  let html = "";

  // ===== Lands Table Section =====
  html += `
  <div style="margin-bottom: 18px;">
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding: 8px 12px; background: linear-gradient(135deg, #1b5e20, #2e7d32); border-radius: 8px; color: white;">
      <span style="font-weight: bold; font-size: 14px;">جدول جمع الأراضي</span>
    </div>
    <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 12px; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0;">
      <thead>
        <tr style="background: linear-gradient(135deg, #e8f5e9, #c8e6c9); border-bottom: 2px solid #2e7d32;">
          <th style="padding: 8px 6px; font-weight: bold; color: #1b5e20; width: 28px;">م</th>
          <th style="padding: 8px 6px; font-weight: bold; color: #1b5e20; text-align: right;">البيان</th>
          <th style="padding: 8px 6px; font-weight: bold; color: #1b5e20; width: 50px;">سهم</th>
          <th style="padding: 8px 6px; font-weight: bold; color: #1b5e20; width: 50px;">قيراط</th>
          <th style="padding: 8px 6px; font-weight: bold; color: #1b5e20; width: 50px;">فدان</th>
          <th style="padding: 8px 6px; font-weight: bold; color: #1b5e20; width: 85px;">م²</th>
        </tr>
      </thead>
      <tbody>`;

  let rowIdx = 0;
  areas.forEach((area, i) => {
    const name = area.name || getAreaTitle(i);
    const sh = parseFloat(area.shares) || 0;
    const ca = parseFloat(area.carat) || 0;
    const ac = parseFloat(area.acre) || 0;
    const sahms = ac * 576 + ca * 24 + sh;
    const m2 = (sahms / 24) * caratArea;

    if (sh || ca || ac) {
      rowIdx++;
      const bgColor = rowIdx % 2 === 0 ? "#f9f9f9" : "#ffffff";
      html += `
        <tr style="background-color: ${bgColor}; border-bottom: 1px solid #eee;">
          <td style="padding: 7px 6px; color: #666; font-weight: bold;">${rowIdx}</td>
          <td style="padding: 7px 6px; text-align: right; color: #333;">${name}</td>
          <td style="padding: 7px 6px; color: #333;">${sh}</td>
          <td style="padding: 7px 6px; color: #333;">${ca}</td>
          <td style="padding: 7px 6px; color: #333;">${ac}</td>
          <td style="padding: 7px 6px; color: #555; direction: ltr; font-size: 11px;">${m2.toFixed(2)} م²</td>
        </tr>`;
    }
  });

  // Total row
  const totalUnits = sahmsToUnits(totalAreaSahms);
  const totalM2 = (totalAreaSahms / 24) * caratArea;
  html += `
        <tr style="background: linear-gradient(135deg, #e8f5e9, #c8e6c9); border-top: 2px solid #2e7d32;">
          <td colspan="2" style="padding: 8px 6px; text-align: right; font-weight: bold; color: #1b5e20; font-size: 13px;">الإجمالي</td>
          <td style="padding: 8px 6px; font-weight: bold; color: #1b5e20;">${totalUnits.shares}</td>
          <td style="padding: 8px 6px; font-weight: bold; color: #1b5e20;">${totalUnits.carat}</td>
          <td style="padding: 8px 6px; font-weight: bold; color: #1b5e20;">${totalUnits.prefix}${totalUnits.acre}</td>
          <td style="padding: 8px 6px; font-weight: bold; color: #1b5e20; direction: ltr; font-size: 11px;">${totalM2.toFixed(2)} م²</td>
        </tr>
      </tbody>
    </table>
  </div>`;

  // ===== Discounts Table Section =====
  const hasDiscountData = discounts.some(d => (parseFloat(d.shares) || 0) + (parseFloat(d.carat) || 0) + (parseFloat(d.acre) || 0) > 0);
  if (hasDiscountData) {
    html += `
    <div style="margin-bottom: 18px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding: 8px 12px; background: linear-gradient(135deg, #b71c1c, #c62828); border-radius: 8px; color: white;">
        <span style="font-weight: bold; font-size: 14px;">جدول الخصومات</span>
      </div>
      <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 12px; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0;">
        <thead>
          <tr style="background: linear-gradient(135deg, #ffebee, #ffcdd2); border-bottom: 2px solid #c62828;">
            <th style="padding: 8px 6px; font-weight: bold; color: #b71c1c; width: 28px;">م</th>
            <th style="padding: 8px 6px; font-weight: bold; color: #b71c1c; text-align: right;">البيان</th>
            <th style="padding: 8px 6px; font-weight: bold; color: #b71c1c; width: 50px;">سهم</th>
            <th style="padding: 8px 6px; font-weight: bold; color: #b71c1c; width: 50px;">قيراط</th>
            <th style="padding: 8px 6px; font-weight: bold; color: #b71c1c; width: 50px;">فدان</th>
            <th style="padding: 8px 6px; font-weight: bold; color: #b71c1c; width: 85px;">م²</th>
          </tr>
        </thead>
        <tbody>`;

    let discNum = 0;
    discounts.forEach((d, i) => {
      const sh = parseFloat(d.shares) || 0;
      const ca = parseFloat(d.carat) || 0;
      const ac = parseFloat(d.acre) || 0;
      if (sh || ca || ac) {
        discNum++;
        const sahms = ac * 576 + ca * 24 + sh;
        const m2 = (sahms / 24) * caratArea;
        const name = d.name || `خصم ${discNum}`;
        const bgColor = discNum % 2 === 0 ? "#fff8f8" : "#ffffff";
        html += `
          <tr style="background-color: ${bgColor}; border-bottom: 1px solid #fce4ec;">
            <td style="padding: 7px 6px; color: #666; font-weight: bold;">${discNum}</td>
            <td style="padding: 7px 6px; text-align: right; color: #333;">${name}</td>
            <td style="padding: 7px 6px; color: #333;">${sh}</td>
            <td style="padding: 7px 6px; color: #333;">${ca}</td>
            <td style="padding: 7px 6px; color: #333;">${ac}</td>
            <td style="padding: 7px 6px; color: #555; direction: ltr; font-size: 11px;">${m2.toFixed(2)} م²</td>
          </tr>`;
      }
    });

    const discountUnits = sahmsToUnits(totalDiscountSahms);
    const discM2 = (totalDiscountSahms / 24) * caratArea;
    html += `
          <tr style="background: linear-gradient(135deg, #ffebee, #ffcdd2); border-top: 2px solid #c62828;">
            <td colspan="2" style="padding: 8px 6px; text-align: right; font-weight: bold; color: #c62828; font-size: 13px;">إجمالي الخصم</td>
            <td style="padding: 8px 6px; font-weight: bold; color: #c62828;">${discountUnits.shares}</td>
            <td style="padding: 8px 6px; font-weight: bold; color: #c62828;">${discountUnits.carat}</td>
            <td style="padding: 8px 6px; font-weight: bold; color: #c62828;">${discountUnits.acre}</td>
            <td style="padding: 8px 6px; font-weight: bold; color: #c62828; direction: ltr; font-size: 11px;">${discM2.toFixed(2)} م²</td>
          </tr>
        </tbody>
      </table>
    </div>`;
  }

  // ===== Remaining Section =====
  const remainingUnits = sahmsToUnits(remainingSahms);
  const remainingM2 = (remainingSahms / 24) * caratArea;
  const remainingCarats = +(remainingSahms / 24).toFixed(3);

  html += `
  <div style="margin-bottom: 18px; background: linear-gradient(135deg, #e8f5e9, #f1f8e9); border: 2px solid #2e7d32; border-radius: 12px; padding: 15px; text-align: center;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 10px;">
      <span style="font-weight: bold; font-size: 15px; color: #1b5e20;">المتبقي بعد الخصم</span>
    </div>
    <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 10px;">
      <div style="background: white; border: 1.5px solid #1565c0; border-radius: 10px; padding: 8px 14px; min-width: 70px; box-shadow: 0 2px 4px rgba(0,0,0,0.06);">
        <div style="font-size: 18px; font-weight: bold; color: #0d47a1;">${remainingUnits.shares}</div>
        <div style="font-size: 10px; color: #1565c0; font-weight: bold;">سهم</div>
      </div>
      <div style="background: white; border: 1.5px solid #ef6c00; border-radius: 10px; padding: 8px 14px; min-width: 70px; box-shadow: 0 2px 4px rgba(0,0,0,0.06);">
        <div style="font-size: 18px; font-weight: bold; color: #e65100;">${remainingUnits.carat}</div>
        <div style="font-size: 10px; color: #ef6c00; font-weight: bold;">قيراط</div>
      </div>
      <div style="background: white; border: 1.5px solid #2e7d32; border-radius: 10px; padding: 8px 14px; min-width: 70px; box-shadow: 0 2px 4px rgba(0,0,0,0.06);">
        <div style="font-size: 18px; font-weight: bold; color: #1b5e20;">${remainingUnits.prefix}${remainingUnits.acre}</div>
        <div style="font-size: 10px; color: #2e7d32; font-weight: bold;">فدان</div>
      </div>
    </div>
    <div style="font-size: 12px; color: #555; border-top: 1px dashed #a5d6a7; padding-top: 8px;">
      يعادل <strong style="color: #1b5e20;">${remainingM2.toFixed(2)} م²</strong> &nbsp;|&nbsp; <strong style="color: #ef6c00;">${remainingCarats} قيراط</strong>
    </div>
  </div>`;

  // ===== Distribution Section =====
  if (individualsCount > 0) {
    const sharePerPerson = remainingSahms / individualsCount;
    const perPersonUnits = sahmsToUnits(sharePerPerson);
    const perPersonM2 = (sharePerPerson / 24) * caratArea;
    const ordinals = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر"];

    html += `
    <div style="margin-bottom: 18px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding: 8px 12px; background: linear-gradient(135deg, #0d47a1, #1565c0); border-radius: 8px; color: white;">
        <span style="font-weight: bold; font-size: 14px;">التوزيع بالتساوي (${individualsCount} أفراد)</span>
      </div>
      <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 12px; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0;">
        <thead>
          <tr style="background: linear-gradient(135deg, #e3f2fd, #bbdefb); border-bottom: 2px solid #1565c0;">
            <th style="padding: 8px 6px; font-weight: bold; color: #0d47a1; width: 28px;">م</th>
            <th style="padding: 8px 6px; font-weight: bold; color: #0d47a1; text-align: right;">الاسم</th>
            <th style="padding: 8px 6px; font-weight: bold; color: #0d47a1; width: 50px;">سهم</th>
            <th style="padding: 8px 6px; font-weight: bold; color: #0d47a1; width: 50px;">قيراط</th>
            <th style="padding: 8px 6px; font-weight: bold; color: #0d47a1; width: 50px;">فدان</th>
            <th style="padding: 8px 6px; font-weight: bold; color: #0d47a1; width: 85px;">م²</th>
          </tr>
        </thead>
        <tbody>`;

    for (let i = 0; i < individualsCount; i++) {
      const name = (individualNames[i] && individualNames[i].trim()) ||
        (i < ordinals.length ? `الفرد ${ordinals[i]}` : `الفرد ${i + 1}`);
      const bgColor = i % 2 === 0 ? "#ffffff" : "#f5f9ff";
      html += `
          <tr style="background-color: ${bgColor}; border-bottom: 1px solid #e3f2fd;">
            <td style="padding: 7px 6px; color: #666; font-weight: bold;">${i + 1}</td>
            <td style="padding: 7px 6px; text-align: right; font-weight: bold; color: #333;">${name}</td>
            <td style="padding: 7px 6px; color: #333;">${perPersonUnits.shares}</td>
            <td style="padding: 7px 6px; color: #333;">${perPersonUnits.carat}</td>
            <td style="padding: 7px 6px; color: #333;">${perPersonUnits.prefix}${perPersonUnits.acre}</td>
            <td style="padding: 7px 6px; color: #555; direction: ltr; font-size: 11px;">${perPersonM2.toFixed(2)} م²</td>
          </tr>`;
    }
    html += `
        </tbody>
      </table>
    </div>`;
  }

  // ===== Footer =====
  html += `
  <div style="text-align: center; margin-top: 12px; padding: 10px 0 4px; border-top: 2px solid #e0e0e0;">
    <div style="font-size: 11px; color: #888; margin-bottom: 4px;">
      مساحة القيراط المعتمدة: <strong style="color: #555;">${caratArea} م²</strong>
    </div>
    <div style="font-size: 12px; color: #1b5e20; font-weight: bold;">
      تم الحساب بواسطة برنامج جمع وطرح الأراضي الزراعية
    </div>
  </div>`;

  reportContent.innerHTML = html;
}

// ==========================================
// COPY TO CLIPBOARD (WhatsApp)
// ==========================================

function copyReportToClipboard() {
  let caratArea = parseFloat(document.getElementById("input-carat-area").value);
  if (caratArea === 0) {
    caratArea = parseFloat(document.getElementById("other-input-field").value) || 0;
  }

  let text = `*تقرير جمع وطرح الأراضي الزراعية*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;

  // Areas
  text += `*جدول جمع الأراضي:*\n`;
  areas.forEach((area, i) => {
    const sh = parseFloat(area.shares) || 0;
    const ca = parseFloat(area.carat) || 0;
    const ac = parseFloat(area.acre) || 0;
    if (sh || ca || ac) {
      const name = area.name || getAreaTitle(i);
      const sahms = ac * 576 + ca * 24 + sh;
      const m2 = (sahms / 24) * caratArea;
      text += `  - *(${i + 1}) ${name}*:\n`;
      text += `     - المساحة: ${ac} فدان، ${ca} قيراط، ${sh} سهم\n`;
      text += `     - تعادل: ${m2.toFixed(2)} م²\n\n`;
    }
  });

  // Total
  syncAreasFromDOM();
  let totalAreaSahms = 0;
  areas.forEach(area => {
    const sh = parseFloat(area.shares) || 0;
    const ca = parseFloat(area.carat) || 0;
    const ac = parseFloat(area.acre) || 0;
    const sahms = ac * 576 + ca * 24 + sh;
    totalAreaSahms += sahms;
  });
  const totalUnits = sahmsToUnits(totalAreaSahms);
  const totalM2 = (totalAreaSahms / 24) * caratArea;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `*الإجمالي:*\n`;
  text += `   - المساحة: ${totalUnits.prefix}${totalUnits.acre} فدان، ${totalUnits.carat} قيراط، ${totalUnits.shares} سهم\n`;
  text += `   - تعادل: ${totalM2.toFixed(2)} م²\n\n`;

  // Discounts
  syncDiscountsFromDOM();
  let totalDiscountSahms = 0;
  const hasDiscountData = discounts.some(d => (parseFloat(d.shares) || 0) + (parseFloat(d.carat) || 0) + (parseFloat(d.acre) || 0) > 0);

  if (hasDiscountData) {
    text += `*الخصومات:*\n`;
    let discNum = 0;
    discounts.forEach(d => {
      const sh = parseFloat(d.shares) || 0;
      const ca = parseFloat(d.carat) || 0;
      const ac = parseFloat(d.acre) || 0;
      if (sh || ca || ac) {
        discNum++;
        const sahms = ac * 576 + ca * 24 + sh;
        totalDiscountSahms += sahms;
        const m2 = (sahms / 24) * caratArea;
        const name = d.name || `خصم ${discNum}`;
        text += `  - *(${discNum}) ${name}:*\n`;
        text += `     - المساحة: ${ac} فدان، ${ca} قيراط، ${sh} سهم\n`;
        text += `     - تعادل: ${m2.toFixed(2)} م²\n\n`;
      }
    });
  }

  // Remaining
  const remainingSahms = totalAreaSahms - totalDiscountSahms;
  const remainingUnits = sahmsToUnits(remainingSahms);
  const remainingM2 = (remainingSahms / 24) * caratArea;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `*المتبقي بعد الخصم:*\n`;
  text += `   - المساحة: ${remainingUnits.prefix}${remainingUnits.acre} فدان، ${remainingUnits.carat} قيراط، ${remainingUnits.shares} سهم\n`;
  text += `   - تعادل: ${remainingM2.toFixed(2)} م²\n\n`;

  // Distribution
  const count = parseInt(document.getElementById("individuals-count").value) || 0;
  if (count > 0) {
    const sharePerPerson = remainingSahms / count;
    const perPersonUnits = sahmsToUnits(sharePerPerson);
    const perPersonM2 = (sharePerPerson / 24) * caratArea;
    const ordinals = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر"];

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*التوزيع بالتساوي (${count} أفراد):*\n`;
    text += `   نصيب كل فرد: ${perPersonUnits.prefix}${perPersonUnits.acre} فدان، ${perPersonUnits.carat} قيراط، ${perPersonUnits.shares} سهم (${perPersonM2.toFixed(2)} م²)\n\n`;

    for (let i = 0; i < count; i++) {
      const name = (individualNames[i] && individualNames[i].trim()) ||
        (i < ordinals.length ? `الفرد ${ordinals[i]}` : `الفرد ${i + 1}`);
      text += `  ${i + 1}. *${name}*: ${perPersonUnits.prefix}${perPersonUnits.acre} ف، ${perPersonUnits.carat} ط، ${perPersonUnits.shares} س\n`;
    }
    text += `\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `   (مساحة القيراط المعتمدة: ${caratArea} م²)\n`;
  text += `تم الحساب بواسطة برنامج جمع وطرح الأراضي الزراعية`;

  navigator.clipboard.writeText(text).then(() => {
    alert("تم نسخ التقرير بنجاح! يمكنك الآن لصقه ومشاركته على واتساب.");
  }).catch(err => {
    console.error("Could not copy text: ", err);
  });
}

// ==========================================
// PRINT
// ==========================================

function printReport() {
  window.print();
}

// ==========================================
// CARAT AREA SELECTOR
// ==========================================

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

// ==========================================
// SAVE / LOAD
// ==========================================

function saveData() {
  syncAreasFromDOM();
  syncDiscountsFromDOM();
  sessionStorage.setItem("areas", JSON.stringify(areas));
  sessionStorage.setItem("discounts", JSON.stringify(discounts));
  sessionStorage.setItem("carat-area-calc", document.getElementById("input-carat-area").value);
  sessionStorage.setItem("other-carat-area-calc", document.getElementById("other-input-field").value);
  sessionStorage.setItem("individuals-count", document.getElementById("individuals-count").value);
  sessionStorage.setItem("individual-names", JSON.stringify(individualNames));
}

function loadData() {
  // Load areas
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
  }

  // Load discounts
  const savedDiscounts = sessionStorage.getItem("discounts");
  if (savedDiscounts) {
    try {
      discounts = JSON.parse(savedDiscounts);
    } catch (e) {
      console.error(e);
      discounts = [{ name: "", shares: "", carat: "", acre: "" }];
    }
  }

  // Load carat area
  document.getElementById("input-carat-area").value = sessionStorage.getItem("carat-area-calc") || "175.035";
  document.getElementById("other-input-field").value = sessionStorage.getItem("other-carat-area-calc") || "";
}

// ==========================================
// CLEAR ALL
// ==========================================

function clearAll() {
  areas = [
    { name: "", shares: "", carat: "", acre: "", sign: "plus" },
    { name: "", shares: "", carat: "", acre: "", sign: "plus" }
  ];
  discounts = [
    { name: "", shares: "", carat: "", acre: "" }
  ];
  individualNames = [];
  document.getElementById("individuals-count").value = "";
  document.getElementById("individuals-names-container").innerHTML = "";
  renderAreas();
  renderDiscounts();
  saveData();
  calculate();
}
