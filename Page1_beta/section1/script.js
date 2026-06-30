// DOM Elements
const shapeCards = document.querySelectorAll(".shape-card");
const inputsGroups = document.querySelectorAll(".inputs-group");
const caratSizeInput = document.getElementById("carat-size");
const caratPresetSelect = document.getElementById("carat-preset");
const caratPriceDisplay = document.getElementById("carat-price-display");
const caratPriceNumeric = document.getElementById("carat-price-numeric");
const stepsContent = document.getElementById("steps-content");

// Results Elements
const totalSqmResult = document.getElementById("total-sqm");
const totalPerimeterResult = document.getElementById("total-perimeter");
const totalPriceResult = document.getElementById("total-price");
const areaSharesResult = document.getElementById("area-shares");
const areaCaratsResult = document.getElementById("area-carats");
const areaFeddansResult = document.getElementById("area-feddans");
const conversionsTbody = document.getElementById("conversions-tbody");

// Division Elements
const divisionPanel = document.getElementById("division-panel");
const heirsCountInput = document.getElementById("heirs-count");
const heirsListTbody = document.getElementById("heirs-list");
const distributedAreaSpan = document.getElementById("distributed-area");
const totalLimitAreaSpan = document.getElementById("total-limit-area");
const distributionStatus = document.getElementById("distribution-status");
const btnToggleDivision = document.getElementById("btn-toggle-division");

// Canvas setup
const canvas = document.getElementById("landCanvas");
const ctx = canvas.getContext("2d");

// polyfill for roundRect on older browser engines
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (r === undefined) r = 0;
    if (typeof r === 'number') {
      r = { tl: r, tr: r, br: r, bl: r };
    } else if (Array.isArray(r)) {
      r = { tl: r[0] || 0, tr: r[1] || 0, br: r[2] || 0, bl: r[3] || 0 };
    }
    this.beginPath();
    this.moveTo(x + r.tl, y);
    this.lineTo(x + w - r.tr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r.tr);
    this.lineTo(x + w, y + h - r.br);
    this.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
    this.lineTo(x + r.bl, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r.bl);
    this.lineTo(x, y + r.tl);
    this.quadraticCurveTo(x, y, x + r.tl, y);
    this.closePath();
    return this;
  };
}

// State variables
let activeShape = "rectangle";
let calculatedArea = 0;
let calculatedPerimeter = 0;
let heirsData = [];
let isDivisionActive = false;

// Page Load
document.addEventListener("DOMContentLoaded", function () {
  loadStateFromSession();
  setupEventListeners();
  calculateAll();
});

function setupEventListeners() {
  // Shape card clicks
  shapeCards.forEach(card => {
    card.addEventListener("click", () => {
      shapeCards.forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      activeShape = card.getAttribute("data-shape");
      
      // Toggle inputs group
      inputsGroups.forEach(group => group.classList.remove("active"));
      document.getElementById(`inputs-${activeShape}`).classList.add("active");
      
      resetDivision();
      saveStateToSession();
      calculateAll();
    });
  });

  // Attach input listeners to all input fields to auto-calculate and save
  const allInputs = document.querySelectorAll("input, select");
  allInputs.forEach(input => {
    // Avoid double events on custom handlers
    if (input.id !== "carat-price-display" && input.id !== "heirs-count") {
      input.addEventListener("input", () => {
        if (input.closest(".inputs-group")) {
          resetDivision();
        }
        saveStateToSession();
        calculateAll();
      });
    }
  });

  caratSizeInput.addEventListener("input", () => {
    // If user types custom value, set select to custom
    const value = caratSizeInput.value;
    if (value !== "168" && value !== "171.388" && value !== "175" && value !== "175.035") {
      caratPresetSelect.value = "custom";
    } else {
      caratPresetSelect.value = value;
    }
    saveStateToSession();
    calculateAll();
  });
}

function updateCaratPreset() {
  const preset = caratPresetSelect.value;
  if (preset !== "custom") {
    caratSizeInput.value = preset;
  } else {
    caratSizeInput.value = "";
    caratSizeInput.focus();
  }
  saveStateToSession();
  calculateAll();
}

function toggleQuadWarning() {
  const method = document.getElementById("quad-method").value;
  const warning = document.getElementById("brahma-warning");
  if (method === "brahma") {
    warning.style.display = "block";
  } else {
    warning.style.display = "none";
  }
}

// Formatting Price input with commas
function formatPrice(input) {
  const rawValue = input.value.replace(/\D/g, "");
  caratPriceNumeric.value = rawValue;
  input.value = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  saveStateToSession();
  calculateAll();
}

// Clear all inputs
function clearAllInputs() {
  const inputs = document.querySelectorAll(".inputs-group.active input");
  inputs.forEach(input => input.value = "");
  caratPriceDisplay.value = "";
  caratPriceNumeric.value = "";
  
  resetDivision();
  saveStateToSession();
  calculateAll();
}

// Show/Hide Division Panel
function toggleDivisionPanel() {
  isDivisionActive = !isDivisionActive;
  if (isDivisionActive) {
    divisionPanel.style.display = "block";
    btnToggleDivision.classList.add("active-panel");
    generateHeirsTable();
  } else {
    divisionPanel.style.display = "none";
    btnToggleDivision.classList.remove("active-panel");
  }
  calculateAll();
}

// Reset Smart Division panel
function resetDivision() {
  isDivisionActive = false;
  heirsData = [];
  if (divisionPanel) divisionPanel.style.display = "none";
  if (btnToggleDivision) btnToggleDivision.classList.remove("active-panel");
  if (heirsListTbody) heirsListTbody.innerHTML = "";
  if (heirsCountInput) heirsCountInput.value = "3";
  saveStateToSession();
}

// Math conversions
Number.prototype.toFixedNoRounding = function (n) {
  const reg = new RegExp("^-?\\d+(?:\\.\\d{0," + n + "})?", "g");
  const a = this.toString().match(reg)[0];
  const dot = a.indexOf(".");
  if (dot === -1) {
    return a + "." + "0".repeat(n);
  }
  const b = n - (a.length - dot) + 1;
  return b > 0 ? a + "0".repeat(b) : a;
};

function convertSqmToFeddans(sqm, caratSize) {
  if (!sqm || sqm <= 0) return { feddans: 0, carats: 0, shares: 0 };
  const feddanSize = caratSize * 24;
  
  const feddans = Math.floor(sqm / feddanSize);
  const remainingForCarats = sqm - (feddans * feddanSize);
  const carats = Math.floor(remainingForCarats / caratSize);
  const remainingForShares = remainingForCarats - (carats * caratSize);
  const shares = (remainingForShares * 24) / caratSize;
  
  return {
    feddans: feddans,
    carats: carats,
    shares: parseFloat(shares.toFixed(2))
  };
}

// Qasaba and Qabda conversion
function toQasabaAndQabda(meters) {
  if (!meters || isNaN(meters) || meters <= 0) return { qasaba: 0, qabda: 0, fraction: 0 };
  const qasabaLength = 3.55;
  const qabdaLength = qasabaLength / 24; // ~0.1479167
  
  let qasaba = Math.floor(meters / qasabaLength);
  let rem = meters - (qasaba * qasabaLength);
  let qabda = Math.floor(rem / qabdaLength);
  let fraction = (rem - (qabda * qabdaLength)) / qabdaLength;
  return {
    qasaba: qasaba,
    qabda: qabda,
    fraction: parseFloat(fraction.toFixed(2))
  };
}

// Convert قصبة + قبضة + أقل من قبضة back to meters
function fromQasabaToMeters(qasaba, qabda, fraction) {
  const qasabaLength = 3.55;
  const qabdaLength = qasabaLength / 24;
  return (qasaba * qasabaLength) + (qabda * qabdaLength) + (fraction * qabdaLength);
}

// Normalize qabda overflow: if qabda >= 24, carry into qasaba
function normalizeQasabaInputs(rowIndex) {
  const qasabaEl  = document.getElementById('conv-qasaba-'  + rowIndex);
  const qabdaEl   = document.getElementById('conv-qabda-'   + rowIndex);
  const fracEl    = document.getElementById('conv-fraction-' + rowIndex);
  if (!qasabaEl || !qabdaEl || !fracEl) return;

  let qasaba  = Math.max(0, parseInt(qasabaEl.value)  || 0);
  let qabda   = Math.max(0, parseInt(qabdaEl.value)   || 0);
  let fraction = parseFloat(fracEl.value) || 0;

  // Clamp fraction to [0, 0.99]
  fraction = Math.min(0.99, Math.max(0, parseFloat(fraction.toFixed(2))));

  // Carry: 24 قبضة = 1 قصبة
  if (qabda >= 24) {
    const carry = Math.floor(qabda / 24);
    qasaba += carry;
    qabda = qabda % 24;
  }

  // Write back normalized values
  qasabaEl.value  = qasaba;
  qabdaEl.value   = qabda;
  fracEl.value    = fraction;

  return { qasaba, qabda, fraction };
}

let convBlurTimeout = null;

// Called when user edits a cell in the conversions table
function updateSideFromQasaba(sideId, rowIndex) {
  const vals = normalizeQasabaInputs(rowIndex);
  if (!vals) return;
  const { qasaba, qabda, fraction } = vals;

  const meters = fromQasabaToMeters(qasaba, qabda, fraction);

  // Update the meter display label in the row
  const meterSpan = document.getElementById('conv-meter-' + rowIndex);
  if (meterSpan) {
    meterSpan.textContent = parseFloat(meters.toFixed(4));
    // Flash the badge for visual feedback
    const badge = meterSpan.closest('.conv-meter-badge');
    if (badge) {
      badge.classList.add('updated');
      setTimeout(() => badge.classList.remove('updated'), 600);
    }
  }

  // Update the main dimension input
  const sideInput = document.getElementById(sideId);
  if (sideInput) {
    sideInput.value = parseFloat(meters.toFixed(4));
  }
  calculateAll();

  // Manage keyboard auto-blur after 3 seconds of inactivity
  if (convBlurTimeout) clearTimeout(convBlurTimeout);
  convBlurTimeout = setTimeout(() => {
    const activeEl = document.activeElement;
    if (activeEl && activeEl.id && activeEl.id.startsWith('conv-')) {
      activeEl.blur();
    }
  }, 3000);
}

// Main calculations controller
function calculateAll() {
  const caratSize = parseFloat(caratSizeInput.value) || 168;
  const pricePerCarat = parseFloat(caratPriceNumeric.value) || 0;
  
  let area = 0;
  let perimeter = 0;
  let stepsText = "";
  let vertices = []; // Local coordinates for plotting
  let errorMsg = "";
  let dimensionInputs = []; // For the Qasaba table

  if (activeShape === "rectangle") {
    const length = parseFloat(document.getElementById("rect-length").value) || 0;
    const width = parseFloat(document.getElementById("rect-width").value) || 0;
    
    dimensionInputs = [
      { name: "الطول (أ)", value: length },
      { name: "العرض (ب)", value: width }
    ];

    if (length > 0 && width > 0) {
      area = length * width;
      perimeter = 2 * (length + width);
      stepsText = `الشكل المختار: مستطيل\n` +
                  `المعادلة: المساحة = الطول × العرض\n` +
                  `الحساب: ${length} × ${width} = ${area.toFixed(2)} متر مربع\n` +
                  `المحيط = 2 × (الطول + العرض) = 2 × (${length} + ${width}) = ${perimeter.toFixed(2)} متر`;
      
      // Coordinates
      vertices = [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: length },
        { x: 0, y: length }
      ];
    }

  } else if (activeShape === "square") {
    const side = parseFloat(document.getElementById("square-side").value) || 0;

    dimensionInputs = [
      { name: "طول الضلع (أ)", value: side }
    ];

    if (side > 0) {
      area = side * side;
      perimeter = 4 * side;
      stepsText = `الشكل المختار: مربع\n` +
                  `المعادلة: المساحة = الضلع × الضلع\n` +
                  `الحساب: ${side} × ${side} = ${area.toFixed(2)} متر مربع\n` +
                  `المحيط = 4 × الضلع = 4 × ${side} = ${perimeter.toFixed(2)} متر`;
      
      // Coordinates (square)
      vertices = [
        { x: 0, y: 0 },
        { x: side, y: 0 },
        { x: side, y: side },
        { x: 0, y: side }
      ];
    }

  } else if (activeShape === "trapezoid") {
    const a = parseFloat(document.getElementById("trap-base-major").value) || 0; // major base (القاعدة السفلية)
    const c = parseFloat(document.getElementById("trap-base-minor").value) || 0; // minor base (القاعدة العلوية)
    const h = parseFloat(document.getElementById("trap-height").value) || 0; // height (الطول)

    dimensionInputs = [
      { name: "القاعدة السفلية", value: a },
      { name: "القاعدة العلوية", value: c },
      { name: "الطول (أو الارتفاع)", value: h }
    ];

    if (a > 0 && c > 0 && h > 0) {
      area = 0.5 * (a + c) * h;
      
      // Calculate missing sides assuming symmetric isosceles trapezoid
      const dxHalf = Math.abs(a - c) / 2;
      const calculatedSide = Math.sqrt(h * h + dxHalf * dxHalf);
      
      perimeter = a + c + 2 * calculatedSide;

      stepsText = `الشكل المختار: شبه منحرف زراعي (مبسط)\n` +
                  `المعادلة: المساحة = 0.5 × (القاعدة السفلية + القاعدة العلوية) × الطول\n` +
                  `الحساب: 0.5 × (${a} + ${c}) × ${h} = ${area.toFixed(2)} متر مربع\n` +
                  `المحيط (تقريبي) = مجموع الأضلاع الأربعة = ${a} + ${c} + ${calculatedSide.toFixed(2)} (جانب أيسر) + ${calculatedSide.toFixed(2)} (جانب أيمن) = ${perimeter.toFixed(2)} متر`;

      // Coordinates (Centered top base)
      const dxLeft = (a - c) / 2;
      vertices = [
        { x: 0, y: 0 },
        { x: a, y: 0 },
        { x: a - dxLeft, y: h },
        { x: dxLeft, y: h }
      ];
    }

  } else if (activeShape === "quadrilateral") {
    const a = parseFloat(document.getElementById("quad-side-a").value) || 0;
    const b = parseFloat(document.getElementById("quad-side-b").value) || 0;
    const c = parseFloat(document.getElementById("quad-side-c").value) || 0;
    const d = parseFloat(document.getElementById("quad-side-d").value) || 0;
    const method = document.getElementById("quad-method").value;

    dimensionInputs = [
      { name: "الضلع 1 السفلي (أ)", value: a },
      { name: "الضلع 2 الأيسر (ب)", value: b },
      { name: "الضلع 3 العلوي (ج)", value: c },
      { name: "الضلع 4 الأيمن (د)", value: d }
    ];

    if (a > 0 && b > 0 && c > 0 && d > 0) {
      // Validate quadrilateral inequality
      const maxSide = Math.max(a, b, c, d);
      const sumOthers = (a + b + c + d) - maxSide;
      
      if (sumOthers <= maxSide) {
        errorMsg = "خطأ: القياسات المدخلة مستحيلة هندسياً (مجموع أي ثلاثة أضلاع يجب أن يكون أكبر من الضلع الرابع).";
      } else {
        perimeter = a + b + c + d;
        
        if (method === "approx") {
          area = 0.5 * (a + c) * 0.5 * (b + d);
          stepsText = `الشكل المختار: رباعي غير منتظم (الطريقة التقريبية للدلالين)\n` +
                      `المعادلة: المساحة ≈ متوسط الطولين × متوسط العرضين\n` +
                      `الحساب: ((${a} + ${c}) / 2) × ((${b} + ${d}) / 2) = ${area.toFixed(2)} متر مربع\n` +
                      `المحيط = ${a} + ${b} + ${c} + ${d} = ${perimeter.toFixed(2)} متر`;
        } else {
          // Brahmagupta
          const s = 0.5 * (a + b + c + d);
          const term = (s - a) * (s - b) * (s - c) * (s - d);
          if (term <= 0) {
            errorMsg = "خطأ في حساب براهماجوبتا: القياسات المدخلة لا تسمح بتكوين شكل رباعي دائري.";
          } else {
            area = Math.sqrt(term);
            stepsText = `الشكل المختار: رباعي غير منتظم (معادلة براهماجوبتا للرباعي الدائري)\n` +
                        `المعادلة: المساحة = جذر( (s-a)(s-b)(s-c)(s-d) ) حيث s هو نصف المحيط\n` +
                        `نصف المحيط (s) = ${s.toFixed(2)}\n` +
                        `الحساب = جذر( (${(s-a).toFixed(2)}) × (${(s-b).toFixed(2)}) × (${(s-c).toFixed(2)}) × (${(s-d).toFixed(2)}) ) = ${area.toFixed(2)} متر مربع\n` +
                        `المحيط = ${perimeter.toFixed(2)} متر`;
          }
        }

        // Coordinates solver assuming cyclic quadrilateral for visual sketch
        if (!errorMsg) {
          try {
            // Diagonal d1 (B to D) for cyclic quadrilateral
            const d1 = Math.sqrt(((a * c + b * d) * (a * d + b * c)) / (a * b + c * d));
            
            // D point (x_d, y_d) relative to A(0,0) and B(a,0)
            const x_d = (a * a + b * b - d1 * d1) / (2 * a);
            const y_d = Math.sqrt(Math.max(0, b * b - x_d * x_d));
            
            // C point (x_c, y_c) by intersection of Circle(B, d) and Circle(D, c)
            // Let's compute coordinate values using circle intersections
            const cPoints = intersectCircles(a, 0, d, x_d, y_d, c);
            if (cPoints && cPoints.length > 0) {
              // We select the point C that keeps the winding direction correct (y_c > 0)
              const chosenC = cPoints.find(p => p.y > 0) || cPoints[0];
              vertices = [
                { x: 0, y: 0 },
                { x: a, y: 0 },
                { x: chosenC.x, y: chosenC.y },
                { x: x_d, y: y_d }
              ];
            } else {
              // Fallback layout if solver fails
              vertices = [
                { x: 0, y: 0 },
                { x: a, y: 0 },
                { x: a - (a - c) / 2, y: b },
                { x: (a - c) / 2, y: b }
              ];
            }
          } catch (e) {
            // Fallback sketch layout
            vertices = [
              { x: 0, y: 0 },
              { x: a, y: 0 },
              { x: a - (a - c) / 2, y: b },
              { x: (a - c) / 2, y: b }
            ];
          }
        }
      }
    }
  }

  // Handle errors
  if (errorMsg) {
    stepsText = errorMsg;
    area = 0;
    perimeter = 0;
    vertices = [];
  }

  calculatedArea = area;
  calculatedPerimeter = perimeter;

  // Display results
  totalSqmResult.innerText = area > 0 ? area.toFixed(2) : "0";
  totalPerimeterResult.innerText = perimeter > 0 ? perimeter.toFixed(2) : "0";
  
  const conversions = convertSqmToFeddans(area, caratSize);
  areaSharesResult.innerText = area > 0 ? conversions.shares.toFixedNoRounding(2) : "0";
  areaCaratsResult.innerText = area > 0 ? conversions.carats : "0";
  areaFeddansResult.innerText = area > 0 ? conversions.feddans : "0";

  // Calculate Price
  const totalCarats = area / caratSize;
  const totalPrice = totalCarats * pricePerCarat;
  totalPriceResult.innerText = area > 0 && totalPrice > 0 ? Math.floor(totalPrice).toLocaleString() : "0";

  // Steps
  stepsContent.innerText = stepsText || "لم يتم إدخال بيانات كافية لإجراء الحسابات.";

  // Populate Qasaba Table
  // Map dimensionInputs index to the corresponding side input ID
  const sideIds = ["quad-side-a", "quad-side-b", "quad-side-c", "quad-side-d",
                   "rect-length", "rect-width",
                   "trap-a", "trap-b", "trap-h"];
  // Build a lookup from dim.name to sideId using the order they come in
  const activeSideIds = (() => {
    if (activeShape === "quadrilateral") return ["quad-side-a", "quad-side-b", "quad-side-c", "quad-side-d"];
    if (activeShape === "rectangle") return ["rect-length", "rect-width"];
    if (activeShape === "trapezoid") return ["trap-a", "trap-b", "trap-h"];
    return [];
  })();

  const activeEl = document.activeElement;
  const isEditingConversion = activeEl && activeEl.id && activeEl.id.startsWith('conv-');

  if (!isEditingConversion) {
    conversionsTbody.innerHTML = "";
    if (dimensionInputs.length > 0) {
      dimensionInputs.forEach((dim, i) => {
        const qConv = toQasabaAndQabda(dim.value);
        const sid = activeSideIds[i] || "";
        conversionsTbody.innerHTML += `
          <tr class="conv-row">
            <td class="conv-label-cell">
              <span class="conv-dim-name">${dim.name}</span>
              <span class="conv-meter-badge">
                <span id="conv-meter-${i}">${dim.value || 0}</span> م
              </span>
            </td>
            <td class="conv-input-cell">
              <input type="number" class="conv-input conv-fraction"
                id="conv-fraction-${i}" value="${qConv.fraction}"
                min="0" max="0.99" step="0.01"
                title="جزء أقل من القبضة (0 - 0.99)"
                oninput="updateSideFromQasaba('${sid}', ${i})"
                onchange="updateSideFromQasaba('${sid}', ${i})">
            </td>
            <td class="conv-input-cell">
              <input type="number" class="conv-input conv-qabda"
                id="conv-qabda-${i}" value="${qConv.qabda}"
                min="0" step="1"
                title="عدد القبضات (24 قبضة = 1 قصبة تلقائياً)"
                oninput="updateSideFromQasaba('${sid}', ${i})"
                onchange="updateSideFromQasaba('${sid}', ${i})">
            </td>
            <td class="conv-input-cell">
              <input type="number" class="conv-input conv-qasaba"
                id="conv-qasaba-${i}" value="${qConv.qasaba}"
                min="0" step="1"
                title="عدد القصبات"
                oninput="updateSideFromQasaba('${sid}', ${i})"
                onchange="updateSideFromQasaba('${sid}', ${i})">
            </td>
          </tr>
        `;
      });
    } else {
      conversionsTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #888; padding:12px;">أدخل الأبعاد أعلاه لعرض التحويلات</td></tr>`;
    }
  }

  // Manage Heirs Division Limit
  totalLimitAreaSpan.innerText = area.toFixed(2);
  
  if (isDivisionActive && area > 0) {
    updateHeirsDistribution();
  }

  // Draw on Canvas
  drawLandCanvas(vertices);
}

// Circle intersection helper
function intersectCircles(x1, y1, r1, x2, y2, r2) {
  const d = Math.hypot(x2 - x1, y2 - y1);
  if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) return null;
  
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
  
  const x_p = x1 + (a * (x2 - x1)) / d;
  const y_p = y1 + (a * (y2 - y1)) / d;
  
  return [
    {
      x: x_p + (h * (y2 - y1)) / d,
      y: y_p - (h * (x2 - x1)) / d
    },
    {
      x: x_p - (h * (y2 - y1)) / d,
      y: y_p + (h * (x2 - x1)) / d
    }
  ];
}

// Canvas Drawer
function drawLandCanvas(vertices) {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 1. Draw professional Blueprint grid
  ctx.strokeStyle = "#eaf2f8";
  ctx.lineWidth = 1;
  const gridSpacing = 20;
  for (let x = 0; x < canvas.width; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  if (!vertices || vertices.length < 3) {
    // Draw placeholder message
    ctx.fillStyle = "#888888";
    ctx.font = "bold 15px Cairo";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("أدخل أبعاد الأرض الصحيحة لرسم الكروكي", canvas.width / 2, canvas.height / 2);
    return;
  }

  // 2. Scale and Fit vertices inside Canvas bounding box
  const margin = 80;
  const drawW = canvas.width - 2 * margin;
  const drawH = canvas.height - 2 * margin;

  const xs = vertices.map(v => v.x);
  const ys = vertices.map(v => v.y);
  
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const dx = maxX - minX || 1;
  const dy = maxY - minY || 1;

  const scale = Math.min(drawW / dx, drawH / dy);

  // Transform coordinates to canvas space
  const canvasPoints = vertices.map(v => {
    return {
      x: margin + (v.x - minX) * scale + (drawW - dx * scale) / 2,
      // Invert Y because canvas goes down, math coordinates go up
      y: canvas.height - (margin + (v.y - minY) * scale + (drawH - dy * scale) / 2)
    };
  });

  // 3. Draw Polygon shape
  ctx.fillStyle = "rgba(46, 125, 50, 0.06)";
  ctx.strokeStyle = "#2e7d32";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
  for (let i = 1; i < canvasPoints.length; i++) {
    ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 4. Draw vertices/corners circles
  ctx.fillStyle = "#1b5e20";
  canvasPoints.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
    ctx.fill();
  });

  // 5. Draw side dimension labels with measurement lines
  const numVertices = vertices.length;
  for (let i = 0; i < numVertices; i++) {
    const p1 = vertices[i];
    const p2 = vertices[(i + 1) % numVertices];

    const cp1 = canvasPoints[i];
    const cp2 = canvasPoints[(i + 1) % numVertices];

    // Compute real side length in meters
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);

    // Edge vector and length in canvas space
    const vx = cp2.x - cp1.x;
    const vy = cp2.y - cp1.y;
    const edgeLen = Math.hypot(vx, vy) || 1;

    // Unit edge vector
    const ux = vx / edgeLen;
    const uy = vy / edgeLen;

    // Outward normal (perpendicular to edge)
    const nx = -uy;
    const ny = ux;

    // Check which side is outward by testing against centroid
    const centX = canvasPoints.reduce((s, p) => s + p.x, 0) / numVertices;
    const centY = canvasPoints.reduce((s, p) => s + p.y, 0) / numVertices;
    const midX = (cp1.x + cp2.x) / 2;
    const midY = (cp1.y + cp2.y) / 2;

    // Dot product of normal with vector from mid to centroid
    const toCentX = centX - midX;
    const toCentY = centY - midY;
    const dot = nx * toCentX + ny * toCentY;
    // If dot > 0, normal points inward; flip it
    const outNx = dot > 0 ? -nx : nx;
    const outNy = dot > 0 ? -ny : ny;

    const offset = 22; // distance from edge to label line

    // Dimension line endpoints (offset from edge)
    const dlX1 = cp1.x + outNx * offset;
    const dlY1 = cp1.y + outNy * offset;
    const dlX2 = cp2.x + outNx * offset;
    const dlY2 = cp2.y + outNy * offset;

    // Draw extension lines (from vertex to dimension line)
    ctx.strokeStyle = "rgba(46, 125, 50, 0.55)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(cp1.x + outNx * 5, cp1.y + outNy * 5);
    ctx.lineTo(dlX1, dlY1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cp2.x + outNx * 5, cp2.y + outNy * 5);
    ctx.lineTo(dlX2, dlY2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw the dimension line itself
    ctx.strokeStyle = "#2e7d32";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(dlX1, dlY1);
    ctx.lineTo(dlX2, dlY2);
    ctx.stroke();

    // Tick marks at both ends
    const tickLen = 5;
    const perpX = outNx;
    const perpY = outNy;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(dlX1 - perpX * tickLen / 2, dlY1 - perpY * tickLen / 2);
    ctx.lineTo(dlX1 + perpX * tickLen / 2, dlY1 + perpY * tickLen / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(dlX2 - perpX * tickLen / 2, dlY2 - perpY * tickLen / 2);
    ctx.lineTo(dlX2 + perpX * tickLen / 2, dlY2 + perpY * tickLen / 2);
    ctx.stroke();

    // Label position: middle of the dimension line, pushed out a bit more
    const labelX = (dlX1 + dlX2) / 2 + outNx * 10;
    const labelY = (dlY1 + dlY2) / 2 + outNy * 10;

    // Compute text rotation angle
    let angle = Math.atan2(vy, vx);
    // Keep text readable (flip if upside down)
    if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
      angle += Math.PI;
    }

    const labelText = `${len.toFixed(2)} م`;

    ctx.save();
    ctx.translate(labelX, labelY);
    ctx.rotate(angle);

    // White background for readability
    ctx.font = "bold 11px Cairo";
    const tw = ctx.measureText(labelText).width;
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.fillRect(-tw / 2 - 4, -9, tw + 8, 17);

    // Draw text
    ctx.fillStyle = "#1b5e20";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(labelText, 0, 1);
    ctx.restore();
  }

  // 6. Draw Division lines and piece text badges
  if (isDivisionActive && heirsData.length > 0 && calculatedArea > 0) {
    const caratSize = parseFloat(caratSizeInput.value) || 168;
    
    // Bottom points interpolated along base AB (V0 to V1)
    const A = vertices[0];
    const B = vertices[1];
    // Top points interpolated along base DC (V3 to V2)
    const D = vertices[3];
    const C = vertices[2];

    const cpA = canvasPoints[0];
    const cpB = canvasPoints[1];
    const cpD = canvasPoints[3];
    const cpC = canvasPoints[2];

    // Total area coefficients for quadratic partition
    const a = B.x - A.x;
    const y_d = D.y - A.y;
    const dx_cd = C.x - D.x;
    const dy_cd = C.y - D.y;

    // Calculate A_coef & B_coef
    let A_coef = 0.5 * (a * y_d + dx_cd * y_d - dy_cd * D.x);
    let B_coef = 0.5 * (a * dy_cd);
    
    // Adjust signs if necessary
    const totalCheck = A_coef + B_coef;
    let signFactor = 1;
    if (totalCheck < 0) {
      A_coef = -A_coef;
      B_coef = -B_coef;
      signFactor = -1;
    }

    // Cumulative shares to find split boundaries t_i
    let cumArea = 0;
    const splitTs = [0];

    for (let i = 0; i < heirsData.length - 1; i++) {
      cumArea += heirsData[i].share;
      let t = 0;
      if (Math.abs(B_coef) < 0.0001) {
        // Linear equation
        t = cumArea / A_coef;
      } else {
        // Quadratic equation: B_coef * t^2 + A_coef * t - cumArea = 0
        const disc = A_coef * A_coef + 4 * B_coef * cumArea;
        if (disc >= 0) {
          t = (-A_coef + Math.sqrt(disc)) / (2 * B_coef);
        } else {
          t = cumArea / (A_coef + B_coef); // fallback
        }
      }
      
      // Clamp t to [0, 1]
      t = Math.max(0, Math.min(1, t));
      splitTs.push(t);
    }
    splitTs.push(1); // last boundary

    // Draw division lines and labels for each slice
    for (let i = 1; i < splitTs.length; i++) {
      const tPrev = splitTs[i - 1];
      const tCurr = splitTs[i];

      // Left split boundary line
      if (i > 1 && i < splitTs.length) {
        const t = tPrev;
        
        // Canvas coordinates of split line
        const bottomCanvasPt = {
          x: cpA.x + t * (cpB.x - cpA.x),
          y: cpA.y + t * (cpB.y - cpA.y)
        };
        const topCanvasPt = {
          x: cpD.x + t * (cpC.x - cpD.x),
          y: cpD.y + t * (cpC.y - cpD.y)
        };

        // Draw dashed blue boundary line
        ctx.strokeStyle = "#0288d1";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(bottomCanvasPt.x, bottomCanvasPt.y);
        ctx.lineTo(topCanvasPt.x, topCanvasPt.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 7. Render information badge for each partitioned piece
      // Vertices of this slice
      const cpBottomPrev = { x: cpA.x + tPrev * (cpB.x - cpA.x), y: cpA.y + tPrev * (cpB.y - cpA.y) };
      const cpBottomCurr = { x: cpA.x + tCurr * (cpB.x - cpA.x), y: cpA.y + tCurr * (cpB.y - cpA.y) };
      const cpTopCurr = { x: cpD.x + tCurr * (cpC.x - cpD.x), y: cpD.y + tCurr * (cpC.y - cpD.y) };
      const cpTopPrev = { x: cpD.x + tPrev * (cpC.x - cpD.x), y: cpD.y + tPrev * (cpC.y - cpD.y) };

      // Slice Centroid for text writing
      const centroidX = (cpBottomPrev.x + cpBottomCurr.x + cpTopCurr.x + cpTopPrev.x) / 4;
      const centroidY = (cpBottomPrev.y + cpBottomCurr.y + cpTopCurr.y + cpTopPrev.y) / 4;

      const heir = heirsData[i - 1];
      if (heir) {
        const heirConv = convertSqmToFeddans(heir.share, caratSize);
        
        // Piece Box drawing
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.strokeStyle = "#0288d1";
        ctx.lineWidth = 1;
        const boxW = 85;
        const boxH = 50;
        
        ctx.beginPath();
        ctx.roundRect(centroidX - boxW / 2, centroidY - boxH / 2, boxW, boxH, 6);
        ctx.fill();
        ctx.stroke();

        // text lines
        ctx.fillStyle = "#333";
        ctx.font = "bold 9px Cairo";
        ctx.textAlign = "center";
        
        // Line 1: Piece ID & Name
        ctx.fillText(`${i}- ${heir.name}`, centroidX, centroidY - 14);
        
        // Line 2: Area in sqm
        ctx.fillStyle = "#01579b";
        ctx.fillText(`${heir.share.toFixed(1)} م²`, centroidX, centroidY - 2);

        // Line 3: Feddan, carat, sahm
        ctx.fillStyle = "#2e7d32";
        ctx.font = "8px Cairo";
        let parts = [];
        if (heirConv.feddans > 0) parts.push(`${heirConv.feddans}ف`);
        if (heirConv.carats > 0) parts.push(`${heirConv.carats}ط`);
        if (heirConv.shares > 0) parts.push(`${heirConv.shares.toFixed(1)}س`);
        if (parts.length === 0) parts.push("0س");
        
        ctx.fillText(parts.join(" ، "), centroidX, centroidY + 12);
      }
    }
  }
}

// Generate heirs input rows
function generateHeirsTable() {
  const count = parseInt(heirsCountInput.value) || 1;
  const caratSize = parseFloat(caratSizeInput.value) || 168;
  heirsListTbody.innerHTML = "";
  
  // Re-build heirsData array keeping names if possible
  const oldHeirs = [...heirsData];
  heirsData = [];
  
  const equalShare = calculatedArea / count;

  for (let i = 0; i < count; i++) {
    const defaultName = `الوارث ${i + 1}`;
    const name = (oldHeirs[i] && oldHeirs[i].name) ? oldHeirs[i].name : defaultName;
    const share = (oldHeirs[i] && oldHeirs[i].share > 0 && oldHeirs.length === count) ? oldHeirs[i].share : equalShare;
    
    heirsData.push({
      name: name,
      share: share
    });
  }

  renderHeirsRows();
  updateHeirsDistribution();
}

let heirsUpdateTimeout = null;

function debouncedUpdateHeirShare(idx, type, newValString) {
  if (heirsUpdateTimeout) clearTimeout(heirsUpdateTimeout);
  heirsUpdateTimeout = setTimeout(() => {
    const newVal = parseFloat(newValString) || 0;
    updateHeirShare(idx, type, newVal);
  }, 500);
}

function commitHeirShareImmediately(idx, type, newValString) {
  if (heirsUpdateTimeout) clearTimeout(heirsUpdateTimeout);
  const newVal = parseFloat(newValString) || 0;
  updateHeirShare(idx, type, newVal);
}

function debouncedUpdateHeirSplitShare(idx, unitType, newValString) {
  if (heirsUpdateTimeout) clearTimeout(heirsUpdateTimeout);
  heirsUpdateTimeout = setTimeout(() => {
    let newVal = parseFloat(newValString) || 0;
    if (unitType === 'carat' || unitType === 'feddan') {
      newVal = parseInt(newValString) || 0;
    }
    updateHeirSplitShare(idx, unitType, newVal);
  }, 500);
}

function commitHeirSplitShareImmediately(idx, unitType, newValString) {
  if (heirsUpdateTimeout) clearTimeout(heirsUpdateTimeout);
  let newVal = parseFloat(newValString) || 0;
  if (unitType === 'carat' || unitType === 'feddan') {
    newVal = parseInt(newValString) || 0;
  }
  updateHeirSplitShare(idx, unitType, newVal);
}

function updateHeirsUI() {
  const caratSize = parseFloat(caratSizeInput.value) || 168;
  heirsData.forEach((heir, idx) => {
    const row = heirsListTbody.querySelector(`tr[data-index="${idx}"]`);
    if (!row) return;
    
    const conv = convertSqmToFeddans(heir.share, caratSize);
    
    const inputName = row.querySelector('.heir-name');
    const inputSqm = row.querySelector('.heir-share-sqm');
    const inputSahm = row.querySelector('.heir-share-sahm');
    const inputCarat = row.querySelector('.heir-share-carat');
    const inputFeddan = row.querySelector('.heir-share-feddan');

    if (inputName && document.activeElement !== inputName) {
      inputName.value = heir.name;
    }
    if (inputSqm && document.activeElement !== inputSqm) {
      inputSqm.value = heir.share.toFixed(2);
    }
    if (inputSahm && document.activeElement !== inputSahm) {
      inputSahm.value = conv.shares.toFixed(2);
    }
    if (inputCarat && document.activeElement !== inputCarat) {
      inputCarat.value = conv.carats;
    }
    if (inputFeddan && document.activeElement !== inputFeddan) {
      inputFeddan.value = conv.feddans;
    }
  });
}

function renderHeirsRows() {
  const caratSize = parseFloat(caratSizeInput.value) || 168;
  heirsListTbody.innerHTML = "";

  heirsData.forEach((heir, idx) => {
    const conv = convertSqmToFeddans(heir.share, caratSize);
    
    // Build select dropdown option for other heirs
    let optionsHtml = `<option value="all">باقي الورثة بالتساوي</option>`;
    heirsData.forEach((oth, oIdx) => {
      if (oIdx !== idx) {
        optionsHtml += `<option value="${oIdx}">${oth.name}</option>`;
      }
    });

    heirsListTbody.innerHTML += `
      <tr data-index="${idx}">
        <td>
          <input type="text" class="heir-name" value="${heir.name}" onchange="updateHeirName(${idx}, this.value)" />
        </td>
        <td>
          <input type="number" step="any" class="heir-share heir-share-sqm" value="${heir.share.toFixed(2)}" 
            oninput="debouncedUpdateHeirShare(${idx}, 'sqm', this.value)" 
            onblur="commitHeirShareImmediately(${idx}, 'sqm', this.value)" 
            onkeydown="if(event.key === 'Enter') { commitHeirShareImmediately(${idx}, 'sqm', this.value); this.blur(); }" />
        </td>
        <td>
          <input type="number" step="any" class="heir-share heir-share-sahm" value="${conv.shares.toFixed(2)}" 
            oninput="debouncedUpdateHeirSplitShare(${idx}, 'sahm', this.value)" 
            onblur="commitHeirSplitShareImmediately(${idx}, 'sahm', this.value)" 
            onkeydown="if(event.key === 'Enter') { commitHeirSplitShareImmediately(${idx}, 'sahm', this.value); this.blur(); }" />
        </td>
        <td>
          <input type="number" class="heir-share heir-share-carat" value="${conv.carats}" 
            oninput="debouncedUpdateHeirSplitShare(${idx}, 'carat', this.value)" 
            onblur="commitHeirSplitShareImmediately(${idx}, 'carat', this.value)" 
            onkeydown="if(event.key === 'Enter') { commitHeirSplitShareImmediately(${idx}, 'carat', this.value); this.blur(); }" />
        </td>
        <td>
          <input type="number" class="heir-share heir-share-feddan" value="${conv.feddans}" 
            oninput="debouncedUpdateHeirSplitShare(${idx}, 'feddan', this.value)" 
            onblur="commitHeirSplitShareImmediately(${idx}, 'feddan', this.value)" 
            onkeydown="if(event.key === 'Enter') { commitHeirSplitShareImmediately(${idx}, 'feddan', this.value); this.blur(); }" />
        </td>
        <td>
          <select class="heir-offset" id="offset-dest-${idx}">
            ${optionsHtml}
          </select>
        </td>
      </tr>
    `;
  });
}

function updateHeirName(idx, value) {
  if (heirsData[idx]) {
    heirsData[idx].name = value;
    saveStateToSession();
    // Re-render only to update options dropdowns
    renderHeirsRows();
    calculateAll();
  }
}

// Triggered when a user types in a share directly
function updateHeirShare(idx, type, newVal) {
  if (calculatedArea <= 0) return;
  const oldVal = heirsData[idx].share;
  const diff = newVal - oldVal;
  
  if (newVal < 0 || newVal > calculatedArea) {
    alert("الحصة المدخلة غير مسموح بها (يجب أن تكون بين 0 ومساحة الأرض الكلية).");
    renderHeirsRows();
    return;
  }

  applyShareDiff(idx, diff);
}

// Triggered when editing split shares (Feddan, Carat, Sahm)
function updateHeirSplitShare(idx, unitType, newVal) {
  if (calculatedArea <= 0) return;
  const caratSize = parseFloat(caratSizeInput.value) || 168;
  const currentConv = convertSqmToFeddans(heirsData[idx].share, caratSize);
  
  // Calculate new target sqm for this heir
  let newFeddans = currentConv.feddans;
  let newCarats = currentConv.carats;
  let newShares = currentConv.shares;

  if (unitType === 'feddan') newFeddans = newVal;
  if (unitType === 'carat') newCarats = newVal;
  if (unitType === 'sahm') newShares = newVal;

  const targetSqm = (newFeddans * 24 * caratSize) + (newCarats * caratSize) + (newShares * caratSize / 24);
  const diff = targetSqm - heirsData[idx].share;

  if (targetSqm < 0 || targetSqm > calculatedArea) {
    alert("الحصة المدخلة غير مسموح بها (يجب أن تكون بين 0 ومساحة الأرض الكلية).");
    renderHeirsRows();
    return;
  }

  applyShareDiff(idx, diff);
}

// Math redistribution logic for sharing differences
function applyShareDiff(idx, diff) {
  const destSelect = document.getElementById(`offset-dest-${idx}`).value;
  
  if (destSelect === "all") {
    // Distribute among all other heirs equally
    const othersCount = heirsData.length - 1;
    if (othersCount > 0) {
      const shareAdjustment = -diff / othersCount;
      
      // Safety validation first
      let valid = true;
      heirsData.forEach((h, oIdx) => {
        if (oIdx !== idx && (h.share + shareAdjustment < 0)) {
          valid = false;
        }
      });

      if (!valid) {
        alert("فشل التعديل: التعديل سيؤدي لحصة سالبة لأحد الورثة. يرجى اختيار جهة خصم مخصصة.");
        renderHeirsRows();
        return;
      }

      heirsData[idx].share += diff;
      heirsData.forEach((h, oIdx) => {
        if (oIdx !== idx) {
          h.share += shareAdjustment;
        }
      });
    }
  } else {
    // Offset from a specific heir
    const targetIdx = parseInt(destSelect);
    if (heirsData[targetIdx]) {
      const targetOldShare = heirsData[targetIdx].share;
      if (targetOldShare - diff < 0) {
        alert(`فشل التعديل: لا توجد مساحة كافية للخصم من ${heirsData[targetIdx].name}.`);
        renderHeirsRows();
        return;
      }
      heirsData[idx].share += diff;
      heirsData[targetIdx].share -= diff;
    }
  }

  saveStateToSession();
  updateHeirsUI();
  calculateAll();
}

function distributeEqually() {
  if (calculatedArea <= 0) return;
  const equalShare = calculatedArea / heirsData.length;
  heirsData.forEach(h => h.share = equalShare);
  
  saveStateToSession();
  renderHeirsRows();
  calculateAll();
}

function updateHeirsDistribution() {
  let distributedSum = 0;
  heirsData.forEach(h => distributedSum += h.share);

  distributedAreaSpan.innerText = distributedSum.toFixed(2);
  
  const diff = Math.abs(distributedSum - calculatedArea);
  if (diff < 0.05) {
    distributionStatus.className = "status-ok";
    distributionStatus.innerText = "التوزيع متطابق 100%";
  } else {
    distributionStatus.className = "status-err";
    distributionStatus.innerText = `تنبيه: التوزيع غير متطابق! فارق المساحة: ${(calculatedArea - distributedSum).toFixed(2)} م²`;
  }
}

// Session state storage
function saveStateToSession() {
  sessionStorage.setItem("activeShape", activeShape);
  sessionStorage.setItem("caratSize", caratSizeInput.value);
  sessionStorage.setItem("priceDisplay", caratPriceDisplay.value);
  sessionStorage.setItem("priceNumeric", caratPriceNumeric.value);
  
  // Rect
  sessionStorage.setItem("rectLength", document.getElementById("rect-length").value);
  sessionStorage.setItem("rectWidth", document.getElementById("rect-width").value);
  
  // Square
  sessionStorage.setItem("squareSide", document.getElementById("square-side").value);

  // Trap
  sessionStorage.setItem("trapBaseMajor", document.getElementById("trap-base-major").value);
  sessionStorage.setItem("trapBaseMinor", document.getElementById("trap-base-minor").value);
  sessionStorage.setItem("trapHeight", document.getElementById("trap-height").value);

  // Quad
  sessionStorage.setItem("quadSideA", document.getElementById("quad-side-a").value);
  sessionStorage.setItem("quadSideB", document.getElementById("quad-side-b").value);
  sessionStorage.setItem("quadSideC", document.getElementById("quad-side-c").value);
  sessionStorage.setItem("quadSideD", document.getElementById("quad-side-d").value);
  sessionStorage.setItem("quadMethod", document.getElementById("quad-method").value);

  // Heirs
  sessionStorage.setItem("heirsCount", heirsCountInput.value);
  sessionStorage.setItem("heirsData", JSON.stringify(heirsData));
  sessionStorage.setItem("isDivisionActive", isDivisionActive ? "true" : "false");
}

function loadStateFromSession() {
  activeShape = sessionStorage.getItem("activeShape") || "quadrilateral";
  caratSizeInput.value = sessionStorage.getItem("caratSize") || "168";
  caratPresetSelect.value = (["168", "171.388", "175", "175.035"].includes(caratSizeInput.value)) ? caratSizeInput.value : "custom";
  
  caratPriceDisplay.value = sessionStorage.getItem("priceDisplay") || "";
  caratPriceNumeric.value = sessionStorage.getItem("priceNumeric") || "";

  // Set active card UI
  shapeCards.forEach(card => {
    if (card.getAttribute("data-shape") === activeShape) {
      card.classList.add("active");
    } else {
      card.classList.remove("active");
    }
  });

  // Set inputs group UI
  inputsGroups.forEach(group => {
    if (group.id === `inputs-${activeShape}`) {
      group.classList.add("active");
    } else {
      group.classList.remove("active");
    }
  });

  // Restore fields
  document.getElementById("rect-length").value = sessionStorage.getItem("rectLength") || "";
  document.getElementById("rect-width").value = sessionStorage.getItem("rectWidth") || "";

  document.getElementById("square-side").value = sessionStorage.getItem("squareSide") || "";

  document.getElementById("trap-base-major").value = sessionStorage.getItem("trapBaseMajor") || "";
  document.getElementById("trap-base-minor").value = sessionStorage.getItem("trapBaseMinor") || "";
  document.getElementById("trap-height").value = sessionStorage.getItem("trapHeight") || "";

  document.getElementById("quad-side-a").value = sessionStorage.getItem("quadSideA") || "";
  document.getElementById("quad-side-b").value = sessionStorage.getItem("quadSideB") || "";
  document.getElementById("quad-side-c").value = sessionStorage.getItem("quadSideC") || "";
  document.getElementById("quad-side-d").value = sessionStorage.getItem("quadSideD") || "";
  
  const savedMethod = sessionStorage.getItem("quadMethod") || "approx";
  document.getElementById("quad-method").value = savedMethod;
  toggleQuadWarning();

  // Division panel state
  heirsCountInput.value = sessionStorage.getItem("heirsCount") || "3";
  isDivisionActive = sessionStorage.getItem("isDivisionActive") === "true";
  
  if (isDivisionActive) {
    divisionPanel.style.display = "block";
    btnToggleDivision.classList.add("active-panel");
    const savedHeirs = sessionStorage.getItem("heirsData");
    if (savedHeirs) {
      heirsData = JSON.parse(savedHeirs);
      renderHeirsRows();
    } else {
      generateHeirsTable();
    }
  } else {
    divisionPanel.style.display = "none";
    btnToggleDivision.classList.remove("active-panel");
  }
}

// Print trigger
function printCroquis() {
  window.print();
}
