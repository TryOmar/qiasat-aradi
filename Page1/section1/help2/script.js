// DOM Elements
const testerInput = document.getElementById("tester-input");
const resultFahm = document.getElementById("res-fahm");
const resultHuroof = document.getElementById("res-huroof");
const resultMeters = document.getElementById("res-meters");
const resultCms = document.getElementById("res-cms");
const resultFraction = document.getElementById("res-fraction");
const resultStatus = document.getElementById("res-status");

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
};

function handleLiveInput() {
  const val = testerInput.value.trim();
  if (!val) {
    clearResults();
    return;
  }
  
  const parsed = parseInputToDetails(val);
  if (!parsed.isValid) {
    showErrorStatus("القيمة المدخلة غير صحيحة");
    return;
  }
  
  // Update UI with parsed values
  resultFahm.innerText = parsed.meters + "." + parsed.cms.toString().padStart(2, "0") + " متر";
  resultHuroof.innerText = parsed.fullText;
  resultMeters.innerText = parsed.metersText || "0 متر";
  resultCms.innerText = parsed.cmsText || "0 سنتيمتر";
  resultFraction.innerText = parsed.fractionText || "لا يوجد كسر";
  
  // Validation for proper land decimal format
  const isFractionalError = checkFractionFormatError(val);
  if (isFractionalError) {
    showErrorStatus("❌ يبدو أن طريقة كتابة الكسر غير صحيحة.");
  } else {
    showSuccessStatus("✅ تمت قراءة القياس بنجاح.");
  }
}

function clearResults() {
  resultFahm.innerText = "—";
  resultHuroof.innerText = "—";
  resultMeters.innerText = "—";
  resultCms.innerText = "—";
  resultFraction.innerText = "—";
  resultStatus.className = "";
  resultStatus.style.display = "none";
}

function showSuccessStatus(msg) {
  resultStatus.innerText = msg;
  resultStatus.className = "status-badge success";
  resultStatus.style.display = "inline-flex";
}

function showErrorStatus(msg) {
  resultStatus.innerText = msg;
  resultStatus.className = "status-badge error";
  resultStatus.style.display = "inline-flex";
}

function checkFractionFormatError(valStr) {
  const parts = valStr.split(".");
  if (parts.length > 1) {
    const dec = parts[1];
    // Suffixes that are common typos (e.g. .83 instead of .833 for 1/3, or .85 instead of .850 for 1/2)
    if (dec === "83" || dec === "12" || dec === "16" || dec === "82" || dec === "87") {
      return true;
    }
  }
  return false;
}

// Arabic Translation Rules
function numberToArabicWords(num) {
  const units = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة"];
  const teens = ["أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
  const tens = ["", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
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
    "10.875": { m: 10, c: 80, f: "ثلاثة أربع سنتيمتر", t: "عشرة أمتار و80 سنتيمترًا وثلاثة أرباع سنتيمتر." },
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

  // Generic parser logic
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

// Example Card Handlers
function copyToTester(val) {
  testerInput.value = val;
  handleLiveInput();
  
  // Show Toast
  const toast = document.getElementById("toast");
  toast.innerText = `📋 تم نسخ القيمة ${val} إلى صندوق التجربة!`;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 2000);
}

// Quiz functionality
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
    // Custom error message for common typos
    if (userAns === "10.83" || userAns === "10.12" || userAns === "10.16" || userAns === "10.82" || userAns === "10.85" || userAns === "10.87") {
      quizFeedback.innerText = "❌ " + quizQuestions[currentQuizIndex].errorMsg;
    } else {
      quizFeedback.innerText = `❌ إجابة غير دقيقة. القيمة الصحيحة للكسر المطلوب هي: ${correctAns}`;
    }
    quizFeedback.className = "quiz-feedback error";
  }
}
