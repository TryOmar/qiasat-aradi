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
const userLevelBadge = document.getElementById("user-level-badge");
const textProgressBlocks = document.getElementById("text-progress-blocks");
const quizScoreCount = document.getElementById("quiz-score-count");
const lastVisitRow = document.getElementById("last-visit-row");
const lastVisitText = document.getElementById("last-visit-text");
const bestScoreText = document.getElementById("best-score-text");

// Timer DOM Elements
const timerSelect = document.getElementById("timer-select");
const timerDisplayWrapper = document.getElementById("timer-display-wrapper");
const timerCountdown = document.getElementById("timer-countdown");
const timerBar = document.getElementById("timer-bar");

// Mode & Containers DOM Elements
const quizActiveContainer = document.getElementById("quiz-active-container");
const quizResultContainer = document.getElementById("quiz-result-container");
const tabTraining = document.getElementById("tab-training");
const tabExam = document.getElementById("tab-exam");

// Achievement Stats DOM Elements
const achSuccessRate = document.getElementById("ach-success-rate");
const achTotalExercises = document.getElementById("ach-total-exercises");
const achAvgSpeed = document.getElementById("ach-avg-speed");
const achBestScore = document.getElementById("ach-best-score");
const achievementTitle = document.getElementById("achievement-title");

// Quiz State Variables
let quizMode = "training"; // "training" or "exam"
let currentLevel = 1; // 1 to 4
let answeredQuestionsInLevel = 0; // correct answers count in current level (target 5)
let trainingScoreCorrect = 0;
let trainingTotalCount = 0;

let examQuestions = [];
let examCurrentIndex = 0;
let examScoreCorrect = 0;
let examTimes = [];

// Timer & Answer State
let questionStartTime = null;
let timerInterval = null;
let timeLeft = 0;
let totalTimeAllocated = 0;
let timerSelectedValue = 0; // 0 means no timer

let currentQuizQuestion = null;
let selectedOptionIndex = null;
let isAnswered = false;
let recentQuestionIds = []; // Prevent immediate repetition in training

// Setup Event Listeners
window.onload = function() {
  testerInput.addEventListener("input", handleLiveInput);
  testerInput.focus();
  
  // Load stats and progress from localStorage
  loadProgress();
  
  // Load first quiz question
  loadNewQuiz();
  
  drawVisualScale(null, "");
  
  window.addEventListener("resize", () => {
    const val = testerInput.value.trim();
    if (val) handleLiveInput();
    else drawVisualScale(null, "");
  });
};

// --- Part 1: Live Tester Box Logic ---

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
        <div class="typo-alert-header">❌ تنبيه للأخطاء الشائعة في كتابة الكسور</div>
        <div class="typo-alert-body">
          أنت كتبت: <strong>${typoInfo.written}</strong><br>
          وغالباً كنت تقصد: <strong>${typoInfo.intended}</strong>
        </div>
        <div class="typo-visual-compare">
          <div class="compare-item wrong">
            <span class="compare-val">${val}</span>
            <span class="compare-label">${typoInfo.wrongLabel}</span>
          </div>
          <div class="compare-sign">≠</div>
          <div class="compare-item correct">
            <span class="compare-val">${typoInfo.correctVal}</span>
            <span class="compare-label">${typoInfo.correctLabel}</span>
          </div>
        </div>
        <div class="typo-explanation">
          💡 <strong>الفرق العملي:</strong> ${typoInfo.explanation}
        </div>
        <div class="typo-correct-action">
          القيمة الصحيحة التي يجب إدخالها هي: <strong class="correct-val-highlight">${typoInfo.correctVal}</strong>
        </div>
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
  whyDrawer.style.display = whyDrawer.style.display === "block" ? "none" : "block";
}

// Extended Typo Detector
function getTypoDetails(valStr) {
  const parts = valStr.split(".");
  if (parts.length > 1) {
    const m = parseInt(parts[0]) || 0;
    const dec = parts[1];
    const mText = formatMetersArabic(m);
    
    if (dec === "83" || dec === "830") {
      return {
        isTypo: true,
        written: `${mText} و 83 سنتيمترًا.`,
        intended: `${mText} و 80 سنتيمترًا وثلث سنتيمتر.`,
        correctVal: `${m}.833`,
        wrongLabel: "83 سم بالتمام",
        correctLabel: "80 سم + ⅓ سم",
        explanation: "القيمة 10.833 تحتوي على كسر الثلث الإضافي اللازم للحسابات الزراعية الدقيقة، بينما 10.83 تسقط هذا الكسر وتزيد الطول بـ 3 سنتيمترات كاملة!",
        errorClass: "نسيت كسر ثلث السنتيمتر"
      };
    }
    if (dec === "12" || dec === "120") {
      return {
        isTypo: true,
        written: `${mText} و 12 سنتيمترًا.`,
        intended: `${mText} و 12 سنتيمترًا ونصف سنتيمتر.`,
        correctVal: `${m}.125`,
        wrongLabel: "12 سم بالتمام",
        correctLabel: "12 سم + ½ سم",
        explanation: "القيمة 10.125 تمثل 12.5 سم (ثمن متر)، بينما 10.12 تعني 12 سم فقط مما يضيع كسر النصف سم.",
        errorClass: "نسيت كسر نصف السنتيمتر"
      };
    }
    if (dec === "37" || dec === "370") {
      return {
        isTypo: true,
        written: `${mText} و 37 سنتيمترًا.`,
        intended: `${mText} و 37 سنتيمترًا ونصف سنتيمتر.`,
        correctVal: `${m}.375`,
        wrongLabel: "37 سم بالتمام",
        correctLabel: "37 سم + ½ سم",
        explanation: "القيمة 10.375 تمثل 37.5 سم (ثلاثة أثمان متر)، بينما 10.37 تعني 37 سم فقط مما يضيع كسر النصف سم.",
        errorClass: "نسيت كسر نصف السنتيمتر"
      };
    }
    if (dec === "87" || dec === "870") {
      return {
        isTypo: true,
        written: `${mText} و 87 سنتيمترًا.`,
        intended: `${mText} و 80 سنتيمترًا وثلاثة أرباع سنتيمتر.`,
        correctVal: `${m}.875`,
        wrongLabel: "87 سم بالتمام",
        correctLabel: "80 سم + ¾ سم",
        explanation: "القيمة 10.875 تمثل 80 سم وثلاثة أرباع سم (7/8 متر)، بينما 10.87 تعني 87 سم بالتمام مما يغير الطول بـ 7 سم!",
        errorClass: "نسيت كسر ثلاثة أرباع السنتيمتر"
      };
    }
    if (dec === "62" || dec === "620") {
      return {
        isTypo: true,
        written: `${mText} و 62 سنتيمترًا.`,
        intended: `${mText} و 62 سنتيمترًا ونصف سنتيمتر.`,
        correctVal: `${m}.625`,
        wrongLabel: "62 سم بالتمام",
        correctLabel: "62 سم + ½ سم",
        explanation: "القيمة 10.625 تمثل 62.5 سم (خمسة أثمان متر)، بينما 10.62 تعني 62 سم فقط مما يضيع كسر النصف سم.",
        errorClass: "نسيت كسر نصف السنتيمتر"
      };
    }
    if (dec === "16" || dec === "160") {
      return {
        isTypo: true,
        written: `${mText} و 16 سنتيمترًا.`,
        intended: `${mText} و 16 سنتيمترًا وثلثي سنتيمتر.`,
        correctVal: `${m}.166`,
        wrongLabel: "16 سم بالتمام",
        correctLabel: "16 سم + ⅔ سم",
        explanation: "القيمة 10.166 تمثل 16 سم وثلثي سم (سدس متر)، بينما 10.16 تعني 16 سم فقط مما يضيع كسر ثلثي السنتيمتر.",
        errorClass: "نسيت كسر ثلثي السنتيمتر"
      };
    }
    if (dec === "66" || dec === "660") {
      return {
        isTypo: true,
        written: `${mText} و 66 سنتيمترًا.`,
        intended: `${mText} و 66 سنتيمترًا وثلثي سنتيمتر.`,
        correctVal: `${m}.666`,
        wrongLabel: "66 سم بالتمام",
        correctLabel: "66 سم + ⅔ سم",
        explanation: "القيمة 10.666 تمثل 66 سم وثلثي سم (ثلثا متر)، بينما 10.66 تعني 66 سم فقط مما يضيع كسر ثلثي السنتيمتر.",
        errorClass: "نسيت كسر ثلثي السنتيمتر"
      };
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

// Visual scale canvas drawer (supports High-DPI / Retina screens)
function drawVisualScale(fractionVal, labelText) {
  const canvas = document.getElementById("ruler-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  
  const dpr = window.devicePixelRatio || 1;
  const displayWidth = canvas.offsetWidth;
  const displayHeight = 70;
  
  canvas.width = displayWidth * dpr;
  canvas.height = displayHeight * dpr;
  
  ctx.scale(dpr, dpr);
  
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, displayWidth, displayHeight);
  
  const startX = 25;
  const endX = displayWidth - 25;
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

// --- Part 2: Progressive Learning & MCQ Quiz logic ---

function switchQuizMode(mode) {
  if (timerInterval) clearInterval(timerInterval);
  timerDisplayWrapper.style.display = "none";
  timerSelect.value = "0";
  timerSelectedValue = 0;
  
  quizMode = mode;
  
  // Update Tabs style
  if (mode === "training") {
    tabTraining.className = "tab-btn active";
    tabExam.className = "tab-btn";
  } else {
    tabTraining.className = "tab-btn";
    tabExam.className = "tab-btn active";
    
    // Generate 20 random questions from all levels
    generateExamQuestions();
  }
  
  quizActiveContainer.style.display = "block";
  quizResultContainer.style.display = "none";
  
  loadNewQuiz();
  updateUserProgressUI();
}

function generateExamQuestions() {
  examCurrentIndex = 0;
  examScoreCorrect = 0;
  examTimes = [];
  
  // Shuffle all questions and pick 20
  const shuffled = [...quizQuestions].sort(() => 0.5 - Math.random());
  examQuestions = shuffled.slice(0, 20);
}

function loadNewQuiz() {
  selectedOptionIndex = null;
  isAnswered = false;
  quizFeedback.style.display = "none";
  quizFeedback.className = "quiz-feedback";
  
  if (quizMode === "training") {
    // Pick questions matching currentLevel
    const levelQuestions = quizQuestions.filter(q => q.level === currentLevel);
    
    if (levelQuestions.length === 0) {
      quizQuestionText.innerText = "لا توجد أسئلة متوفرة لهذا المستوى.";
      return;
    }
    
    // Filter out recently shown questions to avoid immediate duplication
    let available = levelQuestions.filter(q => !recentQuestionIds.includes(q.id));
    if (available.length === 0) {
      available = levelQuestions;
      recentQuestionIds = [];
    }
    
    const randQ = available[Math.floor(Math.random() * available.length)];
    currentQuizQuestion = randQ;
    
    // Add to history
    recentQuestionIds.push(randQ.id);
    if (recentQuestionIds.length > 4) {
      recentQuestionIds.shift();
    }
  } else {
    // Exam mode
    if (examCurrentIndex >= examQuestions.length) {
      showExamResults();
      return;
    }
    currentQuizQuestion = examQuestions[examCurrentIndex];
  }
  
  // Render question text
  quizQuestionText.innerHTML = currentQuizQuestion.question;
  
  // Render options list
  quizOptionsList.innerHTML = "";
  currentQuizQuestion.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-option-btn";
    btn.innerHTML = opt;
    btn.onclick = () => selectOption(idx);
    quizOptionsList.appendChild(btn);
  });
  
  // Record start time
  questionStartTime = Date.now();
  
  // Start timer if activated
  if (timerSelectedValue > 0) {
    startQuestionTimer(timerSelectedValue);
  } else {
    if (timerInterval) clearInterval(timerInterval);
    timerDisplayWrapper.style.display = "none";
  }
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
  
  // Stop timer
  if (timerInterval) clearInterval(timerInterval);
  
  isAnswered = true;
  const timeSpent = (Date.now() - questionStartTime) / 1000;
  
  const q = currentQuizQuestion;
  const btns = quizOptionsList.querySelectorAll(".quiz-option-btn");
  
  quizFeedback.style.display = "block";
  const isCorrect = (selectedOptionIndex === q.answerIndex);
  
  // Update state and UI based on correctness
  if (isCorrect) {
    btns[selectedOptionIndex].className = "quiz-option-btn correct-ans";
    btns[selectedOptionIndex].innerHTML += " ✅";
    quizFeedback.className = "quiz-feedback success";
    quizFeedback.innerHTML = `✅ <strong>إجابة صحيحة وممتازة!</strong><br>${q.reason}`;
    
    if (quizMode === "training") {
      trainingScoreCorrect++;
      answeredQuestionsInLevel++;
      trainingTotalCount++;
      
      // Level progression check
      if (answeredQuestionsInLevel >= 5) {
        if (currentLevel < 4) {
          currentLevel++;
          answeredQuestionsInLevel = 0;
          setTimeout(() => {
            showToast(`🎉 أحسنت! تغلبت على الأسئلة وتأهلت للمستوى ${currentLevel}`);
          }, 1000);
        } else {
          // Finished all levels
          answeredQuestionsInLevel = 0;
          saveProgress();
          updateUserProgressUI();
          setTimeout(() => {
            showToast("🏆 رائع! لقد أنهيت كافة مستويات التدريب بنجاح! انتقل للاختبار النهائي لتتوج كـ دلاّل خبير.");
            switchQuizMode("exam");
          }, 1000);
          return;
        }
      }
    } else {
      examScoreCorrect++;
      examTimes.push(timeSpent);
    }
  } else {
    // Incorrect answer
    btns[selectedOptionIndex].className = "quiz-option-btn wrong-ans";
    btns[selectedOptionIndex].innerHTML += " ❌";
    btns[q.answerIndex].className = "quiz-option-btn correct-ans";
    btns[q.answerIndex].innerHTML += " ✅";
    
    const classification = q.errorType ? `<br><span style="color:#b91c1c;">⚠️ تصنيف الخطأ: ${q.errorType}</span>` : "";
    quizFeedback.className = "quiz-feedback error";
    quizFeedback.innerHTML = `❌ <strong>إجابة غير صحيحة.</strong>${classification}<br>${q.reason}`;
    
    if (quizMode === "training") {
      trainingTotalCount++;
      // Decrease progress in current level but not below 0 to make it challenging
      if (answeredQuestionsInLevel > 0) {
        answeredQuestionsInLevel--;
      }
    } else {
      examTimes.push(timeSpent);
    }
  }
  
  // Increment stats
  let totalEx = parseInt(localStorage.getItem("qiasat_total_exercises") || "0");
  localStorage.setItem("qiasat_total_exercises", (totalEx + 1).toString());
  
  if (quizMode === "training") {
    saveProgress();
  } else {
    // Move to next question in exam
    examCurrentIndex++;
  }
  
  updateUserProgressUI();
}

function handleTimeOut() {
  isAnswered = true;
  if (timerInterval) clearInterval(timerInterval);
  
  const q = currentQuizQuestion;
  const btns = quizOptionsList.querySelectorAll(".quiz-option-btn");
  
  // Mark correct option and display timeout feedback
  btns[q.answerIndex].className = "quiz-option-btn correct-ans";
  btns[q.answerIndex].innerHTML += " ✅";
  
  quizFeedback.className = "quiz-feedback error";
  quizFeedback.innerHTML = `⌛ <strong>انتهى الوقت المخصص للإجابة!</strong><br>تم احتساب إجابة خاطئة لانتهاء الوقت المحدد.<br>${q.reason}`;
  quizFeedback.style.display = "block";
  
  let totalEx = parseInt(localStorage.getItem("qiasat_total_exercises") || "0");
  localStorage.setItem("qiasat_total_exercises", (totalEx + 1).toString());
  
  if (quizMode === "training") {
    trainingTotalCount++;
    if (answeredQuestionsInLevel > 0) {
      answeredQuestionsInLevel--;
    }
    saveProgress();
  } else {
    examTimes.push(totalTimeAllocated);
    examCurrentIndex++;
  }
  
  updateUserProgressUI();
}

// Timer Engine
function startQuestionTimer(seconds) {
  if (timerInterval) clearInterval(timerInterval);
  
  timeLeft = seconds;
  totalTimeAllocated = seconds;
  timerDisplayWrapper.style.display = "flex";
  
  updateTimerUI();
  
  timerInterval = setInterval(() => {
    timeLeft -= 0.1;
    if (timeLeft <= 0) {
      timeLeft = 0;
      updateTimerUI();
      handleTimeOut();
    } else {
      updateTimerUI();
    }
  }, 100);
}

function updateTimerUI() {
  const mins = Math.floor(timeLeft / 60);
  const secs = Math.floor(timeLeft % 60);
  timerCountdown.innerText = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  
  const pct = (timeLeft / totalTimeAllocated) * 100;
  timerBar.style.width = pct + "%";
  
  if (timeLeft <= 5) {
    timerBar.style.backgroundColor = "#ef4444"; // turns red when <= 5s
    timerCountdown.style.color = "#ef4444";
  } else {
    timerBar.style.backgroundColor = "#fbbf24";
    timerCountdown.style.color = "#78350f";
  }
}

function changeTimerOption() {
  const val = parseInt(timerSelect.value);
  timerSelectedValue = val;
  if (val > 0) {
    timerDisplayWrapper.style.display = "flex";
    // restart question with new timer
    loadNewQuiz();
  } else {
    if (timerInterval) clearInterval(timerInterval);
    timerDisplayWrapper.style.display = "none";
  }
}

// Progress and LocalStorage manager
function saveProgress() {
  localStorage.setItem("qiasat_level", currentLevel);
  localStorage.setItem("qiasat_answered_in_level", answeredQuestionsInLevel);
  localStorage.setItem("qiasat_training_correct", trainingScoreCorrect);
  localStorage.setItem("qiasat_training_total", trainingTotalCount);
}

function loadProgress() {
  currentLevel = parseInt(localStorage.getItem("qiasat_level")) || 1;
  answeredQuestionsInLevel = parseInt(localStorage.getItem("qiasat_answered_in_level")) || 0;
  trainingScoreCorrect = parseInt(localStorage.getItem("qiasat_training_correct")) || 0;
  trainingTotalCount = parseInt(localStorage.getItem("qiasat_training_total")) || 0;
  
  const lastVisit = localStorage.getItem("qiasat_last_visit");
  if (lastVisit) {
    lastVisitRow.style.display = "flex";
    lastVisitText.innerText = new Date(parseInt(lastVisit)).toLocaleString("ar-EG", {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }
  
  const bestExam = localStorage.getItem("qiasat_best_exam");
  bestScoreText.innerText = bestExam ? bestExam + " صحيحة" : "لا يوجد";
  
  localStorage.setItem("qiasat_last_visit", Date.now().toString());
}

function updateUserProgressUI() {
  if (quizMode === "training") {
    // Training Mode UI
    let levelName = "🟢 المستوى الأول (البسيطة)";
    let levelClass = "level-badge lvl-beginner";
    if (currentLevel === 2) {
      levelName = "🔵 المستوى الثاني (الأثمان)";
      levelClass = "level-badge lvl-good";
    } else if (currentLevel === 3) {
      levelName = "🟣 المستوى الثالث (الزراعية)";
      levelClass = "level-badge lvl-pro";
    } else if (currentLevel === 4) {
      levelName = "🔴 المستوى الرابع (اكتشف الخطأ)";
      levelClass = "level-badge lvl-expert";
    }
    
    userLevelBadge.innerText = levelName;
    userLevelBadge.className = levelClass;
    
    // Progress Block render
    const pct = Math.round((answeredQuestionsInLevel / 5) * 100);
    textProgressBlocks.innerText = renderProgressBlocks(pct);
    
    quizScoreCount.innerText = `${answeredQuestionsInLevel} / 5 صحيحة لتخطي المستوى`;
  } else {
    // Exam Mode UI
    userLevelBadge.innerText = "🏆 الاختبار النهائي";
    userLevelBadge.className = "level-badge lvl-expert";
    
    const pct = Math.round((examCurrentIndex / 20) * 100);
    textProgressBlocks.innerText = renderProgressBlocks(pct);
    
    quizScoreCount.innerText = `السؤال ${Math.min(20, examCurrentIndex + 1)} من 20 سؤال`;
  }
}

function renderProgressBlocks(pct) {
  const totalBlocks = 10;
  const filledBlocks = Math.round((pct / 100) * totalBlocks);
  const emptyBlocks = totalBlocks - filledBlocks;
  const blocksStr = "█".repeat(filledBlocks) + "░".repeat(emptyBlocks);
  return `${blocksStr} ${pct}%`;
}

// Show final exam results on achievement page
function showExamResults() {
  if (timerInterval) clearInterval(timerInterval);
  
  quizActiveContainer.style.display = "none";
  quizResultContainer.style.display = "block";
  
  const successPct = Math.round((examScoreCorrect / 20) * 100);
  
  // Calculate average response speed
  let avgSpeed = 0;
  if (examTimes.length > 0) {
    const sum = examTimes.reduce((a, b) => a + b, 0);
    avgSpeed = Math.round(sum / examTimes.length);
  }
  
  // Title / Rank award
  let rank = "مبتدئ في الأبعاد";
  if (successPct >= 90) rank = "دَّلاَّل خبير 🏆";
  else if (successPct >= 75) rank = "مهندس مساحة محترف 🚜";
  else if (successPct >= 50) rank = "مساعد دَّلاَّل جيد 📐";
  
  achievementTitle.innerText = `تهانينا! لقد حصلت على لقب: ${rank}`;
  achSuccessRate.innerText = `${successPct}%`;
  
  const totalEx = localStorage.getItem("qiasat_total_exercises") || "20";
  achTotalExercises.innerText = totalEx;
  achAvgSpeed.innerText = `${avgSpeed} ثوانٍ`;
  
  // Compare and save best exam score
  let savedBestStr = localStorage.getItem("qiasat_best_exam");
  let savedBestVal = savedBestStr ? parseInt(savedBestStr.split("/")[0]) : 0;
  
  if (examScoreCorrect > savedBestVal) {
    localStorage.setItem("qiasat_best_exam", `${examScoreCorrect}/20`);
    achBestScore.innerText = `${examScoreCorrect}/20 (جديد! ⭐)`;
    bestScoreText.innerText = `${examScoreCorrect}/20 صحيحة`;
  } else {
    achBestScore.innerText = savedBestStr ? `${savedBestStr} صحيحة` : `${examScoreCorrect}/20`;
  }
}

function resetTrainingProgress() {
  if (confirm("هل أنت متأكد من تصفير وإعادة التقدم من المستوى الأول؟")) {
    currentLevel = 1;
    answeredQuestionsInLevel = 0;
    trainingScoreCorrect = 0;
    trainingTotalCount = 0;
    
    saveProgress();
    loadProgress();
    switchQuizMode("training");
  }
}
