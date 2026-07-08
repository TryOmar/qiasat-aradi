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
          <input type="text" inputmode="decimal" class="area-shares" data-index="${i}" placeholder="0" onchange="onAreaInput(${i})" value="${area.shares || ''}">
        </td>
        <td style="vertical-align: middle;">
          <input type="text" inputmode="decimal" class="area-carat" data-index="${i}" placeholder="0" onchange="onAreaInput(${i})" value="${area.carat || ''}">
        </td>
        <td style="vertical-align: middle;">
          <input type="text" inputmode="decimal" class="area-acre" data-index="${i}" placeholder="0" onchange="onAreaInput(${i})" value="${area.acre || ''}">
        </td>
        <td style="vertical-align: middle;">
          <input type="text" class="area-name-input" data-index="${i}" placeholder="مثال: الغيط الكبير" onchange="onAreaInput(${i})" value="${area.name || ''}">
        </td>
        <td class="no-print" style="vertical-align: middle; text-align: center;">
          ${areas.length > 1 ? `
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
      // Render to update delete buttons visibility (since length went from 1 to 2)
      if (areas.length === 2) {
        renderAreas();
        // Focus the input user was typing in
        const inputs = document.querySelectorAll(".area-name-input, .area-shares, .area-carat, .area-acre");
        // find corresponding element
      } else {
        appendAreaRow(areas.length - 1);
      }
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
      <input type="text" inputmode="decimal" class="area-shares" data-index="${i}" placeholder="0" onchange="onAreaInput(${i})" value="">
    </td>
    <td style="vertical-align: middle;">
      <input type="text" inputmode="decimal" class="area-carat" data-index="${i}" placeholder="0" onchange="onAreaInput(${i})" value="">
    </td>
    <td style="vertical-align: middle;">
      <input type="text" inputmode="decimal" class="area-acre" data-index="${i}" placeholder="0" onchange="onAreaInput(${i})" value="">
    </td>
    <td style="vertical-align: middle;">
      <input type="text" class="area-name-input" data-index="${i}" placeholder="مثال: الغيط الكبير" onchange="onAreaInput(${i})" value="">
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
  areas.splice(index, 1);
  if (areas.length === 0) {
    areas.push({ name: "", shares: "", carat: "", acre: "", sign: "plus" });
  } else {
    // Ensure the last row is empty
    const last = areas[areas.length - 1];
    if (last.name || last.shares || last.carat || last.acre) {
      areas.push({ name: "", shares: "", carat: "", acre: "", sign: "plus" });
    }
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
          <input type="text" inputmode="decimal" class="discount-shares" data-index="${i}" placeholder="0" onchange="onDiscountInput(${i})" value="${d.shares || ''}">
        </td>
        <td style="vertical-align: middle;">
          <input type="text" inputmode="decimal" class="discount-carat" data-index="${i}" placeholder="0" onchange="onDiscountInput(${i})" value="${d.carat || ''}">
        </td>
        <td style="vertical-align: middle;">
          <input type="text" inputmode="decimal" class="discount-acre" data-index="${i}" placeholder="0" onchange="onDiscountInput(${i})" value="${d.acre || ''}">
        </td>
        <td style="vertical-align: middle;">
          <input type="text" class="discount-name-input" data-index="${i}" placeholder="مثال: مشروع صرف" onchange="onDiscountInput(${i})" value="${d.name || ''}">
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
      if (discounts.length === 2) {
        renderDiscounts();
      } else {
        appendDiscountRow(discounts.length - 1);
      }
    }
  }
  calculate();
  saveData();
}

function appendDiscountRow(i) {
  const tbody = document.getElementById("discount-table-body");
  const tr = document.createElement("tr");
  tr.id = `discount-block-${i}`;
  tr.innerHTML = `
    <td style="vertical-align: middle; font-weight: bold; color: #666; font-size: 13px;">${i + 1}</td>
    <td style="vertical-align: middle;">
      <input type="text" inputmode="decimal" class="discount-shares" data-index="${i}" placeholder="0" onchange="onDiscountInput(${i})" value="">
    </td>
    <td style="vertical-align: middle;">
      <input type="text" inputmode="decimal" class="discount-carat" data-index="${i}" placeholder="0" onchange="onDiscountInput(${i})" value="">
    </td>
    <td style="vertical-align: middle;">
      <input type="text" inputmode="decimal" class="discount-acre" data-index="${i}" placeholder="0" onchange="onDiscountInput(${i})" value="">
    </td>
    <td style="vertical-align: middle;">
      <input type="text" class="discount-name-input" data-index="${i}" placeholder="مثال: مشروع صرف" onchange="onDiscountInput(${i})" value="">
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
  discounts.splice(index, 1);
  if (discounts.length === 0) {
    discounts.push({ name: "", shares: "", carat: "", acre: "" });
  } else {
    // Ensure the last row is empty
    const last = discounts[discounts.length - 1];
    if (last.name || last.shares || last.carat || last.acre) {
      discounts.push({ name: "", shares: "", carat: "", acre: "" });
    }
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

  // --- 4. Distribution ---
  const countInput = document.getElementById("individuals-count");
  const count = parseInt(countInput.value) || 0;
  const distSection = document.getElementById("distribution-section");
  const distBody = document.getElementById("distribution-table-body");

  if (count > 0) {
    distSection.style.display = "block";
    const sharePerPerson = remainingSahms / count;
    const perPersonUnits = sahmsToUnits(sharePerPerson);

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
        </tr>
      `;
    }
    distBody.innerHTML = html;
  } else {
    distSection.style.display = "none";
    distBody.innerHTML = "";
  }

  // --- 5. Update report ---
  updateReport(totalAreaSahms, totalDiscountSahms, remainingSahms, count);
}

// ==========================================
// REPORT
// ==========================================

function updateReport(totalAreaSahms, totalDiscountSahms, remainingSahms, individualsCount) {
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
        </tr>
      </thead>
      <tbody>`;

  let rowIdx = 0;
  areas.forEach((area, i) => {
    const name = area.name || getAreaTitle(i);
    const sh = parseFloat(area.shares) || 0;
    const ca = parseFloat(area.carat) || 0;
    const ac = parseFloat(area.acre) || 0;

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
        </tr>`;
    }
  });

  // Total row
  const totalUnits = sahmsToUnits(totalAreaSahms);
  html += `
        <tr style="background: linear-gradient(135deg, #e8f5e9, #c8e6c9); border-top: 2px solid #2e7d32;">
          <td colspan="2" style="padding: 8px 6px; text-align: right; font-weight: bold; color: #1b5e20; font-size: 13px;">الإجمالي</td>
          <td style="padding: 8px 6px; font-weight: bold; color: #1b5e20;">${totalUnits.shares}</td>
          <td style="padding: 8px 6px; font-weight: bold; color: #1b5e20;">${totalUnits.carat}</td>
          <td style="padding: 8px 6px; font-weight: bold; color: #1b5e20;">${totalUnits.prefix}${totalUnits.acre}</td>
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
        const name = d.name || `خصم ${discNum}`;
        const bgColor = discNum % 2 === 0 ? "#fff8f8" : "#ffffff";
        html += `
          <tr style="background-color: ${bgColor}; border-bottom: 1px solid #fce4ec;">
            <td style="padding: 7px 6px; color: #666; font-weight: bold;">${discNum}</td>
            <td style="padding: 7px 6px; text-align: right; color: #333;">${name}</td>
            <td style="padding: 7px 6px; color: #333;">${sh}</td>
            <td style="padding: 7px 6px; color: #333;">${ca}</td>
            <td style="padding: 7px 6px; color: #333;">${ac}</td>
          </tr>`;
      }
    });

    const discountUnits = sahmsToUnits(totalDiscountSahms);
    html += `
          <tr style="background: linear-gradient(135deg, #ffebee, #ffcdd2); border-top: 2px solid #c62828;">
            <td colspan="2" style="padding: 8px 6px; text-align: right; font-weight: bold; color: #c62828; font-size: 13px;">إجمالي الخصم</td>
            <td style="padding: 8px 6px; font-weight: bold; color: #c62828;">${discountUnits.shares}</td>
            <td style="padding: 8px 6px; font-weight: bold; color: #c62828;">${discountUnits.carat}</td>
            <td style="padding: 8px 6px; font-weight: bold; color: #c62828;">${discountUnits.acre}</td>
          </tr>
        </tbody>
      </table>
    </div>`;
  }

  // ===== Remaining Section =====
  const remainingUnits = sahmsToUnits(remainingSahms);

  html += `
  <div style="margin-bottom: 18px; background: linear-gradient(135deg, #e8f5e9, #f1f8e9); border: 2px solid #2e7d32; border-radius: 12px; padding: 15px; text-align: center;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 10px;">
      <span style="font-weight: bold; font-size: 15px; color: #1b5e20;">إجمالي الأراضي المتبقية</span>
    </div>
    <div style="display: flex; justify-content: center; gap: 10px;">
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
  </div>`;

  // ===== Distribution Section =====
  if (individualsCount > 0) {
    const sharePerPerson = remainingSahms / individualsCount;
    const perPersonUnits = sahmsToUnits(sharePerPerson);
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
          </tr>`;
    }
    html += `
        </tbody>
      </table>
    </div>`;
  }

  // ===== Footer =====
  html += `
  <div class="old-footer-to-hide" style="text-align: center; margin-top: 12px; padding: 10px 0 4px; border-top: 2px solid #e0e0e0;">
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
      text += `  - *(${i + 1}) ${name}*:\n`;
      text += `     - المساحة: ${ac} فدان، ${ca} قيراط، ${sh} سهم\n\n`;
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
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `*الإجمالي:*\n`;
  text += `   - المساحة: ${totalUnits.prefix}${totalUnits.acre} فدان، ${totalUnits.carat} قيراط، ${totalUnits.shares} سهم\n\n`;

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
        const name = d.name || `خصم ${discNum}`;
        text += `  - *(${discNum}) ${name}:*\n`;
        text += `     - المساحة: ${ac} فدان، ${ca} قيراط، ${sh} سهم\n\n`;
      }
    });
  }

  // Remaining
  const remainingSahms = totalAreaSahms - totalDiscountSahms;
  const remainingUnits = sahmsToUnits(remainingSahms);
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `*إجمالي الأراضي المتبقية:*\n`;
  text += `   - المساحة: ${remainingUnits.prefix}${remainingUnits.acre} فدان، ${remainingUnits.carat} قيراط، ${remainingUnits.shares} سهم\n\n`;

  // Distribution
  const count = parseInt(document.getElementById("individuals-count").value) || 0;
  if (count > 0) {
    const sharePerPerson = remainingSahms / count;
    const perPersonUnits = sahmsToUnits(sharePerPerson);
    const ordinals = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر"];

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*التوزيع بالتساوي (${count} أفراد):*\n`;
    text += `   نصيب كل فرد: ${perPersonUnits.prefix}${perPersonUnits.acre} فدان، ${perPersonUnits.carat} قيراط، ${perPersonUnits.shares} سهم\n\n`;

    for (let i = 0; i < count; i++) {
      const name = (individualNames[i] && individualNames[i].trim()) ||
        (i < ordinals.length ? `الفرد ${ordinals[i]}` : `الفرد ${i + 1}`);
      text += `  ${i + 1}. *${name}*: ${perPersonUnits.prefix}${perPersonUnits.acre} ف، ${perPersonUnits.carat} ط، ${perPersonUnits.shares} س\n`;
    }
    text += `\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
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
  const reportContent = document.getElementById("report-content");
  if (!reportContent) return;
  const reportHTML = reportContent.innerHTML;

  const now = new Date();
  const dateStr = now.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("ar-EG");
  const reportId = `DL-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const printContent = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تقرير جمع وطرح الأراضي - الدلال</title>
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
    
    .watermark-container { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-25deg); font-size: 26pt; font-weight: 800; color: #000000; opacity: 0.06; white-space: nowrap; pointer-events: none; z-index: -1000; font-family: 'Cairo', Arial, sans-serif; text-align: center; width: 100%; }
    .report-footer { position: fixed; bottom: 0; left: 0; width: 100%; display: flex; flex-direction: column; align-items: center; text-align: center; font-size: 8pt; color: #444; border-top: 1.5px solid #1b5e20; padding: 4px 10px 3px; background: white; gap: 1px; }
    .footer-main-text { font-size: 8.5pt; font-weight: 700; color: #222; }
    .footer-sub-text { font-size: 7.5pt; color: #888; }
    
    .page-break-inside-avoid { page-break-inside: avoid; }
    .no-print-btn { margin-top: 15px; padding: 10px 20px; background-color: #2e7d32; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; font-family: 'Cairo', sans-serif; }
    .old-footer-to-hide { display: none !important; }
    
    @media print {
      body { background: #fff !important; color: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .report-header { border-color: #000 !important; background: #fcfcfc !important; }
      th { background: #f2f2f2 !important; color: #000 !important; border-color: #000 !important; }
      td { border-color: #ccc !important; }
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
      <h2>تقرير حساب وجمع وطرح الأراضي الزراعية</h2>
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

  <!-- Content -->
  <div class="report-main-content">
    ${reportHTML}
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
}

// ==========================================
// SAVE / LOAD
// ==========================================

function saveData() {
  syncAreasFromDOM();
  syncDiscountsFromDOM();
  sessionStorage.setItem("areas", JSON.stringify(areas));
  sessionStorage.setItem("discounts", JSON.stringify(discounts));
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

  // Ensure trailing empty row for areas
  if (areas.length === 0) {
    areas.push({ name: "", shares: "", carat: "", acre: "", sign: "plus" });
  } else {
    const last = areas[areas.length - 1];
    if (last.name || last.shares || last.carat || last.acre) {
      areas.push({ name: "", shares: "", carat: "", acre: "", sign: "plus" });
    }
  }

  // Ensure trailing empty row for discounts
  if (discounts.length === 0) {
    discounts.push({ name: "", shares: "", carat: "", acre: "" });
  } else {
    const last = discounts[discounts.length - 1];
    if (last.name || last.shares || last.carat || last.acre) {
      discounts.push({ name: "", shares: "", carat: "", acre: "" });
    }
  }
}

// ==========================================
// CLEAR ALL
// ==========================================

function clearAll() {
  areas = [
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
