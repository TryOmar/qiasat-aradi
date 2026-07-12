// DOM Elements
const testerInput = document.getElementById("tester-input");
const resultFahm = document.getElementById("res-fahm");
const resultHuroof = document.getElementById("res-huroof");
const resultMeters = document.getElementById("res-meters");
const resultCms = document.getElementById("res-cms");
const resultFraction = document.getElementById("res-fraction");
const resultStatus = document.getElementById("res-status");
const testResultsCard = document.getElementById("test-results-card");
const typoAlertContainer = document.getElementById("typo-alert-container");

// Quiz Elements
const quizQuestionText = document.getElementById("quiz-question");
const quizInput = document.getElementById("quiz-input");
const quizFeedback = document.getElementById("quiz-feedback");
const quizBtnCheck = document.getElementById("quiz-btn-check");

const quizQuestions = [
  { question: "عشرة أمتار و80 سنتيمترًا وثلث سنتيمتر.", answer: "10.833", errorMsg: "انتبه، القيمة 10.83 تعني 83 سنتيمترًا فقط، وليست 80 سنتيمترًا وثلث سنتيمتر." },
  { question: "عشرة أمتار و12 سنتيمترًا ونصف سنتيمتر.", answer: "10.125", errorMsg: "انتبه، القيمة 10.12 تعني 12 سنتيمترًا فقط، وليست 12 سنتيمترًا ونصف سنتيمتر." },
  { question: "عشرة أمتار و16 سنتيمترًا وثلثا سنتيمتر.", answer: "10.166", errorMsg: "انتبه، القيمة 10.16 تعني 16 سنتيمترًا فقط، وليست 16 سنتيمترًا وثلثا سنتيمتر." },
  { question: "عشرة أمتار و80 سنتيمترًا وربع سنتيمتر.", answer: "10.825", errorMsg: "انتبه، القيمة 10.82 تعني 82 سنتيمترًا فقط، وليست 80 سنتيمترًا وربع سنتيمتر." },
  { question: "عشرة أمتار و80 سنتيمترًا ونصف سنتيمتر.", answer: "10.850", errorMsg: "انتبه، القيمة 10.85 تعني 85 سنتيمترًا فقط، وليست 80 سنتيمترًا ونصف سنتيمتر." },
  { question: "عشرة أمتار و80 سنتيمترًا وثلاثة أرباع سنتيمتر.", answer: "10.875", errorMsg: "انتبه، القيمة 10.87 تعني 87 سنتيمترًا فقط، وليست 80 سنتيمترًا وثلاثة أرباع سنتيمتر." },
  { question: "عشرة أمتار وسنتيمتر واحد.", answer: "10.010", errorMsg: "انتبه، القيمة 10.1 تعني 10 أمتار و10 سنتيمترات وليس سنتيمتر واحد." },
  { question: "عشرة أمتار وخمسة سنتيمترات.", answer: "10.050", errorMsg: "انتبه، القيمة 10.5 تعني 10 أمتار و50 سنتيمترًا وليس 5 سنتيمترات." }
];

let currentQuizIndex = 0;

// Setup Event Listeners
window.onload = function() {
  testerInput.addEventListener("input", handleLiveInput);
  testerInput.focus();
  loadNewQuiz();
  drawVisualScale(null, "");
  
  // Set up resize handler for visual scale redrawing
  window.addEventListener("resize", () => {
    const val = testerInput.value.trim();
    if (val) handleLiveInput();
    else drawVisualScale(null, "");
  });
};

function handleLiveInput() {
  const val = testerInput.value.trim();
  if (!val) {
    clearResults();
    drawVisualScale(null, "");
    return;
  }
  
  const parsed = parseInputToDetails(val);
  if (!parsed.isValid) {
    showErrorStatus("القيمة المدخلة غير صحيحة");
    drawVisualScale(null, "");
    return;
  }
  
  // Update UI with parsed values
  resultFahm.innerText = parsed.meters + "." + parsed.cms.toString().padStart(2, "0") + " متر";
  resultHuroof.innerText = parsed.fullText;
  resultMeters.innerText = parsed.metersText || "0 متر";
  resultCms.innerText = parsed.cmsText || "0 سنتيمتر";
  resultFraction.innerText = parsed.fractionText || "لا يوجد كسر";
  
  // Check for common typos and display warning + correct alternative
  const typoInfo = getTypoDetails(val);
  if (typoInfo.isTypo) {
    testResultsCard.className = "test-results typo-error";
    showErrorStatus("❌ انتبه! قد تكون هذه القيمة غير مطابقة لما تقصده.");
    
    typoAlertContainer.innerHTML = `
      <div class="typo-alert">
        ⚠️ <strong>تنبيه للأخطاء الشائعة:</strong><br>
        أنت كتبت: <strong>${typoInfo.written}</strong><br>
        وغالباً كنت تقصد: <strong>${typoInfo.intended}</strong><br>
        القيمة الصحيحة التي يجب إدخالها هي: <strong style="text-decoration: underline; font-size: 15px;">${typoInfo.correctVal}</strong>
      </div>
    `;
    typoAlertContainer.style.display = "block";
  } else {
    typoAlertContainer.style.display = "none";
    
    // Classify correct inputs (Standard Fraction vs Other valid decimal)
    if (parsed.fractionText) {
      testResultsCard.className = "test-results correct-fraction";
      showSuccessStatus("🟢 كسر شائع: تمت قراءة الكسر والقياس بدقة.");
    } else {
      testResultsCard.className = "test-results other-correct";
      showSuccessStatus("🟡 قيمة صحيحة: قياس عشري عادي (خالٍ من الكسور الشائعة).");
    }
  }
  
  // Draw the visual scale
  const fractionNum = getFractionNumber(parsed.fractionText);
  const scaleLabel = parsed.fractionText ? parsed.fractionText.replace(" سنتيمتر", "") : "";
  drawVisualScale(fractionNum, scaleLabel);
}

function clearResults() {
  resultFahm.innerText = "—";
  resultHuroof.innerText = "—";
  resultMeters.innerText = "—";
  resultCms.innerText = "—";
  resultFraction.innerText = "—";
  resultStatus.className = "";
  resultStatus.style.display = "none";
  testResultsCard.className = "test-results";
  typoAlertContainer.style.display = "none";
}

function showSuccessStatus(msg) {
  resultStatus.innerText = msg;
  resultStatus.style.display = "block";
}

function showErrorStatus(msg) {
  resultStatus.innerText = msg;
  resultStatus.style.display = "block";
}

// Typo analyzer for warning system
function getTypoDetails(valStr) {
  const parts = valStr.split(".");
  if (parts.length > 1) {
    const m = parseInt(parts[0]) || 0;
    const dec = parts[1];
    
    const mText = formatMetersArabic(m);
    
    if (dec === "83") {
      return {
        isTypo: true,
        written: `${mText} و 83 سنتيمترًا.`,
        intended: `${mText} و 80 سنتيمترًا وثلث سنتيمتر.`,
        correctVal: `${m}.833`
      };
    }
    if (dec === "12") {
      return {
        isTypo: true,
        written: `${mText} و 12 سنتيمترًا.`,
        intended: `${mText} و 12 سنتيمترًا ونصف سنتيمتر.`,
        correctVal: `${m}.125`
      };
    }
    if (dec === "37") {
      return {
        isTypo: true,
        written: `${mText} و 37 سنتيمترًا.`,
        intended: `${mText} و 37 سنتيمترًا ونصف سنتيمتر (أو 3 أثمان سنتيمتر).`,
        correctVal: `${m}.375`
      };
    }
    if (dec === "87") {
      return {
        isTypo: true,
        written: `${mText} و 87 سنتيمترًا.`,
        intended: `${mText} و 80 سنتيمترًا وثلاثة أرباع سنتيمتر (أو 87.5 سم).`,
        correctVal: `${m}.875`
      };
    }
  }
  return { isTypo: false };
}

// Dynamic Fraction injection logic
function applyQuickFraction(fractionKey) {
  let val = testerInput.value.trim();
  
  const fractionMapping = {
    "1/2": { standard: "500", surveyor: "50" },
    "1/3": { standard: "333", surveyor: "33" },
    "2/3": { standard: "666", surveyor: "66" },
    "1/4": { standard: "250", surveyor: "25" },
    "3/4": { standard: "750", surveyor: "75" },
    "1/8": { standard: "125", surveyor: "01" },
    "3/8": { standard: "375", surveyor: "38" },
    "5/8": { standard: "625", surveyor: "63" },
    "7/8": { standard: "875", surveyor: "88" },
    "1/6": { standard: "166", surveyor: "06" },
    "5/6": { standard: "833", surveyor: "83" },
    "1/5": { standard: "200", surveyor: "20" }
  };
  
  const map = fractionMapping[fractionKey];
  if (!map) return;
  
  if (!val) {
    testerInput.value = "0." + map.standard;
  } else if (!val.includes(".")) {
    testerInput.value = val + "." + map.standard;
  } else {
    const parts = val.split(".");
    const integerPart = parts[0];
    let decPart = parts[1] || "";
    
    // Take the tenths digit if present
    const firstDigit = decPart.length > 0 ? decPart[0] : "0";
    testerInput.value = integerPart + "." + firstDigit + map.surveyor;
  }
  
  handleLiveInput();
}

// Copy Action handler
function copyCorrectVal() {
  const val = testerInput.value.trim();
  if (!val) return;
  
  // Determine if it matches a typo, in which case copy the correct one
  const typoInfo = getTypoDetails(val);
  const valToCopy = typoInfo.isTypo ? typoInfo.correctVal : val;
  
  navigator.clipboard.writeText(valToCopy).then(() => {
    showToast(`📋 تم نسخ القيمة الصحيحة ${valToCopy} إلى الحافظة!`);
  }).catch(() => {
    showToast(`❌ فشل نسخ القيمة.`);
  });
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.innerText = msg;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 2500);
}

// Visual scale drawer (Canvas-based)
function drawVisualScale(fractionVal, labelText) {
  const canvas = document.getElementById("ruler-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  
  const w = canvas.width = canvas.offsetWidth;
  const h = canvas.height = 70;
  
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  
  const startX = 25;
  const endX = w - 25;
  const rulerW = endX - startX;
  const lineY = 25;
  
  // Draw base line
  ctx.beginPath();
  ctx.moveTo(startX, lineY);
  ctx.lineTo(endX, lineY);
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 3;
  ctx.stroke();
  
  const ticks = [
    { val: 0.0, label: "0" },
    { val: 0.125, label: "⅛" },
    { val: 0.166, label: "⅙" },
    { val: 0.200, label: "⅕" },
    { val: 0.250, label: "¼" },
    { val: 0.333, label: "⅓" },
    { val: 0.375, label: "⅜" },
    { val: 0.500, label: "½" },
    { val: 0.625, label: "⅝" },
    { val: 0.666, label: "⅔" },
    { val: 0.750, label: "¾" },
    { val: 0.833, label: "⅚" },
    { val: 0.875, label: "⅞" },
    { val: 1.0, label: "1" }
  ];
  
  // Draw tick marks
  ticks.forEach(tick => {
    const x = startX + tick.val * rulerW;
    ctx.beginPath();
    ctx.moveTo(x, lineY - 6);
    ctx.lineTo(x, lineY + 6);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    
    ctx.fillStyle = "#475569";
    ctx.font = "bold 11px Cairo, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(tick.label, x, lineY + 10);
  });
  
  // Draw active pointer
  if (fractionVal !== null && fractionVal >= 0 && fractionVal <= 1) {
    const pointerX = startX + fractionVal * rulerW;
    
    ctx.beginPath();
    ctx.moveTo(pointerX, lineY - 14);
    ctx.lineTo(pointerX, lineY + 14);
    ctx.strokeStyle = "#16a34a"; // green arrow
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    // Triangle arrow
    ctx.beginPath();
    ctx.moveTo(pointerX, lineY - 4);
    ctx.lineTo(pointerX - 6, lineY - 11);
    ctx.lineTo(pointerX + 6, lineY - 11);
    ctx.closePath();
    ctx.fillStyle = "#16a34a";
    ctx.fill();
    
    ctx.fillStyle = "#16a34a";
    ctx.font = "bold 11px Cairo, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(labelText || fractionVal.toFixed(3), pointerX, lineY - 14);
  }
}

// Arabic Translation Rules
function numberToArabicWords(num) {
  const units = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة"];
  const teens = ["أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
  const tens = ["", "ععر", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  const hundreds = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];

  if (num === 0) return "صفر";
  
  let parts = [];
  
  if (num >= 100) {
    let h = Math.floor(num / 100);
    parts.push(hundreds[h]);
    num %= 100;
  }
  
  if (num > 0) {
    if (num <= 10) {
      parts.push(units[num]);
    } else if (num < 20) {
      parts.push(teens[num - 11]);
    } else {
      let u = num % 10;
      let t = Math.floor(num / 10);
      if (u > 0) {
        parts.push(units[u] + " و" + tens[t]);
      } else {
        parts.push(tens[t]);
      }
    }
  }
  
  return parts.join(" و");
}

function formatMetersArabic(num) {
  if (num === 0) return "";
  if (num === 1) return "متر واحد";
  if (num === 2) return "متران";
  if (num >= 3 && num <= 10) {
    return numberToArabicWords(num) + " أمتار";
  }
  if (num >= 11 && num <= 99) {
    return numberToArabicWords(num) + " متراً";
  }
  return numberToArabicWords(num) + " متر";
}

function formatCentimetersArabic(num) {
  if (num === 0) return "";
  if (num === 1) return "سنتيمتر واحد";
  if (num === 2) return "سنتيمتران";
  if (num >= 3 && num <= 10) {
    return numberToArabicWords(num) + " سنتيمترات";
  }
  return numberToArabicWords(num) + " سنتيمترًا";
}

function parseInputToDetails(valueStr) {
  const num = parseFloat(valueStr);
  if (isNaN(num) || num < 0) {
    return { isValid: false, meters: 0, cms: 0, fractionText: "", fullText: "", metersText: "", cmsText: "" };
  }

  const exactMatches = {
    "10.01": { m: 10, c: 1, f: "", t: "عشرة أمتار وسنتيمتر واحد." },
    "10.010": { m: 10, c: 1, f: "", t: "عشرة أمتار وسنتيمتر واحد." },
    "10.02": { m: 10, c: 2, f: "", t: "عشرة أمتار وسنتيمتران." },
    "10.020": { m: 10, c: 2, f: "", t: "عشرة أمتار وسنتيمتران." },
    "10.05": { m: 10, c: 5, f: "", t: "عشرة أمتار و5 سنتيمترات." },
    "10.050": { m: 10, c: 5, f: "", t: "عشرة أمتار و5 سنتيمترات." },
    "10.125": { m: 10, c: 12, f: "نصف سنتيمتر", t: "عشرة أمتار و12 سنتيمترًا ونصف سنتيمتر." },
    "10.166": { m: 10, c: 16, f: "ثلثا سنتيمتر", t: "عشرة أمتار و16 سنتيمترًا وثلثا سنتيمتر." },
    "10.25": { m: 10, c: 25, f: "", t: "عشرة أمتار و25 سنتيمترًا." },
    "10.250": { m: 10, c: 25, f: "", t: "عشرة أمتار و25 سنتيمترًا." },
    "10.333": { m: 10, c: 33, f: "ثلث سنتيمتر", t: "عشرة أمتار و33 سنتيمترًا وثلث سنتيمتر." },
    "10.5": { m: 10, c: 50, f: "", t: "عشرة أمتار و50 سنتيمترًا." },
    "10.500": { m: 10, c: 50, f: "", t: "عشرة أمتار و50 سنتيمترًا." },
    "10.75": { m: 10, c: 75, f: "", t: "عشرة أمتار و75 سنتيمترًا." },
    "10.750": { m: 10, c: 75, f: "", t: "عشرة أمتار و75 سنتيمترًا." },
    "10.99": { m: 10, c: 99, f: "", t: "عشرة أمتار و99 سنتيمترًا." },
    "10.990": { m: 10, c: 99, f: "", t: "عشرة أمتار و99 سنتيمترًا." },
    "10.801": { m: 10, c: 80, f: "ثمن سنتيمتر", t: "عشرة أمتار و80 سنتيمترًا وثمن سنتيمتر." },
    "10.806": { m: 10, c: 80, f: "سدس سنتيمتر", t: "عشرة أمتار و80 سنتيمترًا وسدس سنتيمتر." },
    "10.820": { m: 10, c: 80, f: "خمس سنتيمتر", t: "عشرة أمتار و80 سنتيمترًا وخمس سنتيمتر." },
    "10.825": { m: 10, c: 80, f: "ربع سنتيمتر", t: "عشرة أمتار و80 سنتيمترًا وربع سنتيمتر." },
    "10.833": { m: 10, c: 80, f: "ثلث سنتيمتر", t: "عشرة أمتار و80 سنتيمترًا وثلث سنتيمتر." },
    "10.838": { m: 10, c: 80, f: "ثلاثة أثمان سنتيمتر", t: "عشرة أمتار و80 سنتيمترًا وثلاثة أثمان سنتيمتر." },
    "10.850": { m: 10, c: 80, f: "نصف سنتيمتر", t: "عشرة أمتار و80 سنتيمترًا ونصف سنتيمتر." },
    "10.863": { m: 10, c: 80, f: "خمسة أثمان سنتيمتر", t: "عشرة أمتار و80 سنتيمترًا وخمسة أثمان سنتيمتر." },
    "10.866": { m: 10, c: 80, f: "ثلثا سنتيمتر", t: "عشرة أمتار و80 سنتيمترًا وثلثا سنتيمتر." },
    "10.875": { m: 10, c: 80, f: "ثلاثة أرباع سنتيمتر", t: "عشرة أمتار و80 سنتيمترًا وثلاثة أرباع سنتيمتر." },
    "10.883": { m: 10, c: 80, f: "خمسة أسداس سنتيمتر", t: "عشرة أمتار و80 سنتيمترًا وخمسة أسداس سنتيمتر." },
    "10.888": { m: 10, c: 80, f: "سبعة أثمان سنتيمتر", t: "عشرة أمتار و80 سنتيمترًا وسبعة أثمان سنتيمتر." }
  };

  const trimVal = valueStr.trim();
  if (exactMatches[trimVal]) {
    const match = exactMatches[trimVal];
    return {
      isValid: true,
      meters: match.m,
      cms: match.c,
      fractionText: match.f,
      fullText: match.t,
      metersText: formatMetersArabic(match.m),
      cmsText: formatCentimetersArabic(match.c)
    };
  }

  const parts = trimVal.split(".");
  const m = parseInt(parts[0]) || 0;
  let c = 0;
  let fText = "";

  if (parts.length > 1) {
    let decStr = parts[1];
    
    if (decStr.length === 3) {
      const firstDigit = decStr[0];
      const suffix = decStr.slice(1);
      
      const fractionMap = {
        "01": "ثمن سنتيمتر",
        "06": "سدس سنتيمتر",
        "20": "خمس سنتيمتر",
        "25": "ربع سنتيمتر",
        "33": "ثلث سنتيمتر",
        "38": "ثلاثة أثمان سنتيمتر",
        "50": "نصف سنتيمتر",
        "63": "خمسة أثمان سنتيمتر",
        "66": "ثلثا سنتيمتر",
        "75": "ثلاثة أرباع سنتيمتر",
        "83": "خمسة أسداس سنتيمتر",
        "88": "سبعة أثمان سنتيمتر"
      };

      if (fractionMap[suffix]) {
        c = parseInt(firstDigit) * 10;
        fText = fractionMap[suffix];
      } else {
        c = Math.floor(parseFloat("0." + decStr) * 100);
        const mm = Math.round((parseFloat("0." + decStr) * 100 - c) * 10);
        if (mm === 5) fText = "نصف سنتيمتر";
        else if (mm === 3) fText = "ثلث سنتيمتر";
        else if (mm === 7 || mm === 6) fText = "ثلثا سنتيمتر";
      }
    } else if (decStr.length === 2) {
      c = parseInt(decStr);
    } else if (decStr.length === 1) {
      c = parseInt(decStr) * 10;
    } else {
      c = Math.floor(parseFloat("0." + decStr) * 100);
    }
  }

  let txtM = formatMetersArabic(m);
  let txtC = formatCentimetersArabic(c);
  
  let fullText = "";
  if (txtM) fullText += txtM;
  if (txtC) {
    if (fullText) fullText += " و" + txtC;
    else fullText += txtC;
  }
  if (fText) {
    if (fullText) fullText += " و" + fText;
    else fullText += fText;
  }
  if (fullText) fullText += ".";
  else fullText = "صفر متر.";

  return {
    isValid: true,
    meters: m,
    cms: c,
    fractionText: fText,
    fullText: fullText,
    metersText: txtM,
    cmsText: txtC
  };
}

function getFractionNumber(fractionText) {
  const map = {
    "ثمن سنتيمتر": 0.125,
    "سدس سنتيمتر": 0.166,
    "خمس سنتيمتر": 0.200,
    "ربع سنتيمتر": 0.250,
    "ثلث سنتيمتر": 0.333,
    "ثلاثة أثمان سنتيمتر": 0.375,
    "نصف سنتيمتر": 0.500,
    "خمسة أثمان سنتيمتر": 0.625,
    "ثلثا سنتيمتر": 0.666,
    "ثلاثة أرباع سنتيمتر": 0.750,
    "خمسة أسداس سنتيمتر": 0.833,
    "سبعة أثمان سنتيمتر": 0.875
  };
  return map[fractionText] || 0;
}

function copyToTester(val) {
  testerInput.value = val;
  handleLiveInput();
  showToast(`📋 تم نسخ القيمة ${val} إلى صندوق التجربة!`);
}

// Quiz Handlers
function loadNewQuiz() {
  const randIndex = Math.floor(Math.random() * quizQuestions.length);
  currentQuizIndex = randIndex;
  
  quizQuestionText.innerText = quizQuestions[randIndex].question;
  quizInput.value = "";
  quizFeedback.style.display = "none";
  quizFeedback.className = "quiz-feedback";
}

function checkQuizAnswer() {
  const userAns = quizInput.value.trim();
  const correctAns = quizQuestions[currentQuizIndex].answer;
  
  quizFeedback.style.display = "block";
  
  if (userAns === correctAns) {
    quizFeedback.innerText = "✅ ممتاز! إجابة صحيحة وكاملة.";
    quizFeedback.className = "quiz-feedback success";
  } else {
    if (userAns === "10.83" || userAns === "10.12" || userAns === "10.37" || userAns === "10.87" || userAns === "10.16" || userAns === "10.82" || userAns === "10.85" || userAns === "10.87") {
      quizFeedback.innerText = "❌ " + quizQuestions[currentQuizIndex].errorMsg;
    } else {
      quizFeedback.innerText = `❌ إجابة غير دقيقة. القيمة الصحيحة للكسر المطلوب هي: ${correctAns}`;
    }
    quizFeedback.className = "quiz-feedback error";
  }
}
