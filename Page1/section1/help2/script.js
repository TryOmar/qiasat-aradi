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
const whyDrawer = document.getElementById("why-drawer");
const whyText = document.getElementById("why-text");

// Quiz DOM Elements
const quizQuestionText = document.getElementById("quiz-question");
const quizOptionsList = document.getElementById("quiz-options-list");
const quizFeedback = document.getElementById("quiz-feedback");
const quizProgressBar = document.getElementById("quiz-progress-bar");
const quizScoreCount = document.getElementById("quiz-score-count");
const userLevelBadge = document.getElementById("user-level-badge");

// Quiz Data
const quizQuestions = [
  {
    type: "mcq",
    question: "ما القيمة الرقمية الصحيحة لتمثيل القياس التالي؟<br><strong>عشرة أمتار و80 سنتيمترًا وثلث سنتيمتر</strong>",
    options: ["10.83", "10.833", "10.803", "10.333"],
    answerIndex: 1,
    reason: "القيمة 10.833 تعني 80 سم + 1/3 سم (حيث 0.333 سم هو ثلث سم). بينما 10.83 تعني 83 سم بالتمام بدون كسر الثلث."
  },
  {
    type: "mcq",
    question: "ما القيمة الرقمية الصحيحة لتمثيل القياس التالي؟<br><strong>عشرة أمتار و12 سنتيمترًا ونصف سنتيمتر</strong>",
    options: ["10.12", "10.125", "10.102", "10.250"],
    answerIndex: 1,
    reason: "القيمة 10.125 متر هي 12.5 سم (12 سم ونصف). بينما 10.12 تعني 12 سم فقط بدون كسر النصف."
  },
  {
    type: "mcq",
    question: "ما القيمة الرقمية الصحيحة لتمثيل القياس التالي؟<br><strong>عشرة أمتار و80 سنتيمترًا ونصف سنتيمتر</strong>",
    options: ["10.85", "10.850", "10.805", "10.500"],
    answerIndex: 1,
    reason: "القيمة 10.850 تعني 80 سم ونصف سم (80.5 سم). بينما 10.85 تعني 85 سم بالتمام والكمال."
  },
  {
    type: "mcq",
    question: "ما القيمة الرقمية الصحيحة لتمثيل القياس التالي؟<br><strong>عشرة أمتار و80 سنتيمترًا وثلاثة أرباع سنتيمتر</strong>",
    options: ["10.87", "10.875", "10.807", "10.750"],
    answerIndex: 1,
    reason: "القيمة 10.875 تعني 80 سم وثلاثة أرباع سم (80.75 سم). بينما 10.87 تعني 87 سم بالتمام."
  },
  {
    type: "boolean",
    question: "هل القيمة <strong>155.83</strong> صحيحة لتمثيل طول قدره: <strong>155 متر و80 سم وثلث سنتيمتر</strong>؟",
    options: ["نعم (صحيحة)", "لا (خاطئة)"],
    answerIndex: 1,
    reason: "خاطئة! كتابة 155.83 تعني 155 متر و83 سم بالتمام (مما يضيف 3 سم زيادة ويضيع كسر الثلث). القيمة الصحيحة هي 155.833."
  },
  {
    type: "boolean",
    question: "هل القيمة <strong>12.125</strong> صحيحة لتمثيل طول قدره: <strong>اثنا عشر متراً واثنا عشر سنتيمترًا ونصف سنتيمتر</strong>؟",
    options: ["نعم (صحيحة)", "لا (خاطئة)"],
    answerIndex: 0,
    reason: "صحيحة! كسر نصف سنتيمتر بعد 12 سم يُكتب 125 بعد العلامة العشرية (12.125 متر)."
  },
  {
    type: "boolean",
    question: "هل القيمة <strong>50.705</strong> صحيحة لتمثيل طول قدره: <strong>خمسون متراً وسبعون سنتيمترًا ونصف سنتيمتر</strong>؟",
    options: ["نعم (صحيحة)", "لا (خاطئة)"],
    answerIndex: 0,
    reason: "صحيحة! نصف سنتيمتر بعد 70 سم يُكتب 705 بعد العلامة العشرية (أي 70 سم + 0.5 سم = 70.5 سم = 0.705 متر)."
  }
];

let currentQuizIndex = 0;
let scoreCorrect = 0;
let totalExercises = 10;
let quizCount = 0;
let selectedOptionIndex = null;
let isAnswered = false;

// Setup Event Listeners
window.onload = function() {
  testerInput.addEventListener("input", handleLiveInput);
  testerInput.focus();
  loadNewQuiz();
  updateUserProgressUI();
  drawVisualScale(null, "");
  
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
  
  // Update UI
  resultFahm.innerText = parsed.meters + "." + parsed.cms.toString().padStart(2, "0") + " متر";
  resultHuroof.innerText = parsed.fullText;
  resultMeters.innerText = parsed.metersText || "0 متر";
  resultCms.innerText = parsed.cmsText || "0 سنتيمتر";
  resultFraction.innerText = parsed.fractionText || "لا يوجد كسر";
  
  // Update Why math drawer text
  let decPart = val.split(".")[1] || "0";
  let decVal = parseFloat("0." + decPart);
  let cmVal = decVal * 100;
  let cmInt = Math.floor(cmVal);
  let mmRem = (cmVal - cmInt).toFixed(3);
  
  whyText.innerHTML = `
    <strong>طريقة التحويل الحسابية:</strong><br>
    • الجزء العشري المكتوب هو: <code>0.${decPart}</code> من المتر.<br>
    • بالضرب في 100 لتحويله إلى سنتيمترات: <code>${cmVal.toFixed(3)} سم</code>.<br>
    • السنتيمترات الصحيحة المقروءة: <code>${cmInt} سم</code>.<br>
    • الكسر المتبقي من السنتيمتر: <code>${mmRem} سم</code> 
    ${parsed.fractionText ? `(وهو ما يعادل <strong>${parsed.fractionText}</strong> في القياس الزراعي).` : '(لا يمثل كسر زراعي شائع).'}
  `;

  // Check for common typos
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
    
    if (parsed.fractionText) {
      testResultsCard.className = "test-results correct-fraction";
      showSuccessStatus("🟢 كسر شائع: تمت قراءة الكسر والقياس بدقة.");
    } else {
      testResultsCard.className = "test-results other-correct";
      showSuccessStatus("🟡 قيمة صحيحة: قياس عشري عادي (خالٍ من الكسور الشائعة).");
    }
  }
  
  // Draw scale
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
  resultStatus.innerText = "";
  testResultsCard.className = "test-results";
  typoAlertContainer.style.display = "none";
  whyDrawer.style.display = "none";
}

function showSuccessStatus(msg) {
  resultStatus.innerText = msg;
}

function showErrorStatus(msg) {
  resultStatus.innerText = msg;
}

function toggleWhyDrawer() {
  if (whyDrawer.style.display === "block") {
    whyDrawer.style.display = "none";
  } else {
    whyDrawer.style.display = "block";
  }
}

// Typo detector
function getTypoDetails(valStr) {
  const parts = valStr.split(".");
  if (parts.length > 1) {
    const m = parseInt(parts[0]) || 0;
    const dec = parts[1];
    const mText = formatMetersArabic(m);
    
    if (dec === "83") {
      return { isTypo: true, written: `${mText} و 83 سنتيمترًا.`, intended: `${mText} و 80 سنتيمترًا وثلث سنتيمتر.`, correctVal: `${m}.833` };
    }
    if (dec === "12") {
      return { isTypo: true, written: `${mText} و 12 سنتيمترًا.`, intended: `${mText} و 12 سنتيمترًا ونصف سنتيمتر (1/8 متر).`, correctVal: `${m}.125` };
    }
    if (dec === "37") {
      return { isTypo: true, written: `${mText} و 37 سنتيمترًا.`, intended: `${mText} و 37 سنتيمترًا ونصف سنتيمتر (3/8 متر).`, correctVal: `${m}.375` };
    }
    if (dec === "87") {
      return { isTypo: true, written: `${mText} و 87 سنتيمترًا.`, intended: `${mText} و 80 سنتيمترًا وثلاثة أرباع سنتيمتر (7/8 متر).`, correctVal: `${m}.875` };
    }
  }
  return { isTypo: false };
}

// Fraction pills context injector
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
    
    const firstDigit = decPart.length > 0 ? decPart[0] : "0";
    testerInput.value = integerPart + "." + firstDigit + map.surveyor;
  }
  
  handleLiveInput();
}

function copyCorrectVal() {
  const val = testerInput.value.trim();
  if (!val) return;
  
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

// Visual scale canvas drawer
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
  
  if (fractionVal !== null && fractionVal >= 0 && fractionVal <= 1) {
    const pointerX = startX + fractionVal * rulerW;
    
    ctx.beginPath();
    ctx.moveTo(pointerX, lineY - 14);
    ctx.lineTo(pointerX, lineY + 14);
    ctx.strokeStyle = "#16a34a";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
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
  const tens = ["", "عشر", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
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

// MCQ Quiz system with progression level
function loadNewQuiz() {
  const randIndex = Math.floor(Math.random() * quizQuestions.length);
  currentQuizIndex = randIndex;
  selectedOptionIndex = null;
  isAnswered = false;
  
  const q = quizQuestions[randIndex];
  quizQuestionText.innerHTML = q.question;
  quizFeedback.style.display = "none";
  quizFeedback.className = "quiz-feedback";
  
  // Render options list
  quizOptionsList.innerHTML = "";
  q.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-option-btn";
    btn.innerHTML = opt;
    btn.onclick = () => selectOption(idx);
    quizOptionsList.appendChild(btn);
  });
}

function selectOption(index) {
  if (isAnswered) return;
  selectedOptionIndex = index;
  
  const btns = quizOptionsList.querySelectorAll(".quiz-option-btn");
  btns.forEach((btn, idx) => {
    if (idx === index) {
      btn.className = "quiz-option-btn selected";
    } else {
      btn.className = "quiz-option-btn";
    }
  });
}

function checkQuizAnswer() {
  if (isAnswered) return;
  if (selectedOptionIndex === null) {
    alert("الرجاء اختيار إجابة أولاً!");
    return;
  }
  
  isAnswered = true;
  quizCount++;
  
  const q = quizQuestions[currentQuizIndex];
  const btns = quizOptionsList.querySelectorAll(".quiz-option-btn");
  
  quizFeedback.style.display = "block";
  
  if (selectedOptionIndex === q.answerIndex) {
    scoreCorrect++;
    btns[selectedOptionIndex].className = "quiz-option-btn correct-ans";
    quizFeedback.innerHTML = `✅ <strong>إجابة ممتازة وصحيحة!</strong><br>${q.reason}`;
    quizFeedback.className = "quiz-feedback success";
  } else {
    btns[selectedOptionIndex].className = "quiz-option-btn wrong-ans";
    btns[q.answerIndex].className = "quiz-option-btn correct-ans";
    quizFeedback.innerHTML = `❌ <strong>إجابة غير صحيحة.</strong><br>${q.reason}`;
    quizFeedback.className = "quiz-feedback error";
  }
  
  updateUserProgressUI();
}

function updateUserProgressUI() {
  // Update progress percentage
  const pct = Math.min(100, Math.round((scoreCorrect / 10) * 100));
  quizProgressBar.style.width = pct + "%";
  quizScoreCount.innerText = `${scoreCorrect} / 10 تمارين صحيحة`;
  
  // Update User Level Badge
  let lvlText = "🟢 مبتدئ";
  let lvlClass = "lvl-beginner";
  
  if (scoreCorrect >= 10) {
    lvlText = "🟡 دَّلاَّل خبير";
    lvlClass = "lvl-expert";
  } else if (scoreCorrect >= 7) {
    lvlText = "🟣 محترف";
    lvlClass = "lvl-pro";
  } else if (scoreCorrect >= 4) {
    lvlText = "🔵 جيد";
    lvlClass = "lvl-good";
  }
  
  userLevelBadge.innerText = lvlText;
  userLevelBadge.className = "level-badge " + lvlClass;
}
