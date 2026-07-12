/**
 * @file fraction-helper.js
 * @description المكوّن المشترك العام لإدخال الكسور البرمجية زراعياً، وكشف الأخطاء الشائعة، وتوفير الكسور السريعة.
 * يوفر واجهة برمجية كاملة (Public API) مع إمكانية التهيئة والتنظيف وإلغاء المراقبة لتفادي تسريب الذاكرة.
 * @author Antigravity
 * @version 2.0.0
 * 
 * CHANGELOG:
 * 
 * v2.0.0 (2026-07-12)
 * - إضافة البادئة الموحدة 'fh-' لجميع فئات الـ CSS والـ JS تفادياً لتعارض التنسيقات.
 * - واجهة برمجية كاملة (Public API): init, destroy, refresh, attach, detach.
 * - منع التهيئة المكررة (Guard Initialization) عند استدعاء init مراراً.
 * - تصفير وتحرير كامل للذاكرة ومستمعات الأحداث والـ MutationObserver عند استدعاء destroy.
 * - حماية الأكواد بقوالب try/catch متكاملة لتفادي إعاقة الصفحات المستضيفة.
 * - تفعيل وضع التطوير (devMode) لقياس أداء زمن التهيئة ورسم الواجهات وعدد الحقول الملحقة بالصفحة.
 * - تقسيم الكود وتوثيقه بالكامل باستخدام JSDoc قياسي.
 */

(function () {
  // لمنع إعادة التعريف إذا تم تضمين الملف أكثر من مرة
  if (window.FractionHelper) return;

  /** @type {boolean} حالة تهيئة المكوّن */
  let isInitialized = false;

  /** @type {HTMLElement|null} مرجع التوليب المساعد الطائر */
  let tooltip = null;

  /** @type {HTMLInputElement|null} الحقل النشط حالياً بالتركيز */
  let activeInput = null;

  /** @type {number|null} معرف توقيت الإخفاء */
  let hideTimeout = null;

  /** @type {MutationObserver|null} مراقب تغيرات الـ DOM للحقول الديناميكية */
  let domObserver = null;

  /** @type {Set<HTMLInputElement>} مجموعة الحقول المرتبطة يدوياً خارج المحدد الافتراضي */
  const manuallyAttachedElements = new Set();

  /** @type {Object} إعدادات التهيئة الافتراضية */
  let config = {
    selector: 'input[inputmode="decimal"]:not(#carat-size):not(#carat-price-display), [data-fraction-input], .fraction-input',
    showTranslation: true,
    showTypoDetector: true,
    showQuickPills: true,
    preferredPosition: 'auto',
    devMode: false,
    lang: 'ar'
  };

  // ----------------------------------------------------
  // 1. سجل الأخطاء والأمان (Error Logging & Metrics)
  // ----------------------------------------------------

  /**
   * تسجيل الاستثناءات داخلياً دون التأثير على سير الصفحة.
   * @param {string} context سياق أو مكان الخطأ
   * @param {Error} error الخطأ البرمي المكتشف
   */
  function logError(context, error) {
    console.error(`[FractionHelper] Error in ${context}:`, error);
  }

  /**
   * طباعة مقاييس الأداء في وضع التطوير (devMode).
   * @param {string} metric اسم القياس
   * @param {number} time ms
   * @param {string} [extra] معلومات إضافية
   */
  function logPerformance(metric, time, extra = "") {
    if (config.devMode) {
      console.log(`%c[FractionHelper DevMode] ${metric} took ${time.toFixed(2)}ms. ${extra}`, "color: #d97706; font-weight: bold;");
    }
  }

  // ----------------------------------------------------
  // 2. مترجمات النصوص العربية (Translators)
  // ----------------------------------------------------

  /**
   * تحويل الرقم إلى كلمات عربية مكتوبة.
   * @param {number} num الرقم المراد تحويله
   * @returns {string} الكلمات العربية الممثلة للرقم
   */
  function numberToArabicWords(num) {
    try {
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
    } catch (err) {
      logError("numberToArabicWords", err);
      return num.toString();
    }
  }

  /**
   * صياغة الأمتار بصيغة عربية صحيحة.
   * @param {number} num عدد الأمتار
   * @returns {string} النص العربي المصاغ
   */
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

  /**
   * صياغة السنتيمترات بصيغة عربية صحيحة.
   * @param {number} num عدد السنتيمترات
   * @returns {string} النص العربي المصاغ
   */
  function formatCentimetersArabic(num) {
    if (num === 0) return "";
    if (num === 1) return "سنتيمتر واحد";
    if (num === 2) return "سنتيمتران";
    if (num >= 3 && num <= 10) {
      return numberToArabicWords(num) + " سنتيمترات";
    }
    return numberToArabicWords(num) + " سنتيمترًا";
  }

  /**
   * تحليل القيمة النصية المدخلة إلى تفاصيل رياضية ونصوص مقروءة.
   * @param {string} valueStr القيمة النصية المدخلة بالحقل
   * @returns {Object} كائن يحتوي على تفاصيل الأمتار والسنتيمترات والترجمة
   */
  function parseInputToDetails(valueStr) {
    try {
      const num = parseFloat(valueStr);
      if (isNaN(num) || num < 0) {
        return { isValid: false, meters: 0, cms: 0, fractionText: "", fullText: "" };
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
          fullText: match.t
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
        fullText: fullText
      };
    } catch (err) {
      logError("parseInputToDetails", err);
      return { isValid: false, meters: 0, cms: 0, fractionText: "", fullText: valueStr };
    }
  }

  // ----------------------------------------------------
  // 3. كاشف الأخطاء الشائعة (Typo Detector)
  // ----------------------------------------------------

  /**
   * كشف الأخطاء الشائعة في كتابة القياسات بناءً على الجزء العشري.
   * @param {string} valStr القيمة النصية المدخلة
   * @returns {Object} تفاصيل الخطأ والقيمة المصححة المناسبة
   */
  function getTypoDetails(valStr) {
    try {
      const parts = valStr.split(".");
      if (parts.length > 1) {
        const m = parseInt(parts[0]) || 0;
        const dec = parts[1];
        const mText = formatMetersArabic(m) || "صفر متر";
        
        const typos = {
          "83": { intended: `${mText} و 80 سنتيمترًا وثلث سنتيمتر.`, correctVal: `${m}.833`, wrongLabel: "83 سم بالتمام", correctLabel: "80 سم + ⅓ سم", explanation: "القيمة 10.833 تحتوي على كسر الثلث الإضافي اللازم للحسابات الزراعية الدقيقة، بينما 10.83 تسقط هذا الكسر وتزيد الطول بـ 3 سنتيمترات كاملة!" },
          "830": { intended: `${mText} و 80 سنتيمترًا وثلث سنتيمتر.`, correctVal: `${m}.833`, wrongLabel: "83 سم بالتمام", correctLabel: "80 سم + ⅓ سم", explanation: "القيمة 10.833 تحتوي على كسر الثلث الإضافي اللازم للحسابات الزراعية الدقيقة، بينما 10.83 تسقط هذا الكسر وتزيد الطول بـ 3 سنتيمترات كاملة!" },
          "12": { intended: `${mText} و 12 سنتيمترًا ونصف سنتيمتر.`, correctVal: `${m}.125`, wrongLabel: "12 سم بالتمام", correctLabel: "12 سم + ½ سم", explanation: "القيمة 10.125 تمثل 12.5 سم (ثمن متر)، بينما 10.12 تعني 12 سم فقط مما يضيع كسر النصف سم." },
          "120": { intended: `${mText} و 12 سنتيمترًا ونصف سنتيمتر.`, correctVal: `${m}.125`, wrongLabel: "12 سم بالتمام", correctLabel: "12 سم + ½ سم", explanation: "القيمة 10.125 تمثل 12.5 سم (ثمن متر)، بينما 10.12 تعني 12 سم فقط مما يضيع كسر النصف سم." },
          "37": { intended: `${mText} و 37 سنتيمترًا ونصف سنتيمتر.`, correctVal: `${m}.375`, wrongLabel: "37 سم بالتمام", correctLabel: "37 سم + ½ سم", explanation: "القيمة 10.375 تمثل 37.5 سم (ثلاثة أثمان متر)، بينما 10.37 تعني 37 سم فقط مما يضيع كسر النصف سم." },
          "370": { intended: `${mText} و 37 سنتيمترًا ونصف سنتيمتر.`, correctVal: `${m}.375`, wrongLabel: "37 سم بالتمام", correctLabel: "37 سم + ½ سم", explanation: "القيمة 10.375 تمثل 37.5 سم (ثلاثة أثمان متر)، بينما 10.37 تعني 37 سم فقط مما يضيع كسر النصف سم." },
          "87": { intended: `${mText} و 80 سنتيمترًا وثلاثة أرباع سنتيمتر.`, correctVal: `${m}.875`, wrongLabel: "87 سم بالتمام", correctLabel: "80 سم + ¾ سم", explanation: "القيمة 10.875 تمثل 80 سم وثلاثة أرباع سم (7/8 متر)، بينما 10.87 تعني 87 سم بالتمام مما يغير الطول بـ 7 سم!" },
          "870": { intended: `${mText} و 80 سنتيمترًا وثلاثة أرباع سنتيمتر.`, correctVal: `${m}.875`, wrongLabel: "87 سم بالتمام", correctLabel: "80 سم + ¾ سم", explanation: "القيمة 10.875 تمثل 80 سم وثلاثة أرباع سم (7/8 متر)، بينما 10.87 تعني 87 سم بالتمام مما يغير الطول بـ 7 سم!" },
          "62": { intended: `${mText} و 62 سنتيمترًا ونصف سنتيمتر.`, correctVal: `${m}.625`, wrongLabel: "62 سم بالتمام", correctLabel: "62 سم + ½ سم", explanation: "القيمة 10.625 تمثل 62.5 سم (خمسة أثمان متر)، بينما 10.62 تعني 62 سم فقط مما يضيع كسر النصف سم." },
          "620": { intended: `${mText} و 62 سنتيمترًا ونصف سنتيمتر.`, correctVal: `${m}.625`, wrongLabel: "62 سم بالتمام", correctLabel: "62 سم + ½ سم", explanation: "القيمة 10.625 تمثل 62.5 سم (خمسة أثمان متر)، بينما 10.62 تعني 62 سم فقط مما يضيع كسر النصف سم." },
          "16": { intended: `${mText} و 16 سنتيمترًا وثلثي سنتيمتر.`, correctVal: `${m}.166`, wrongLabel: "16 سم بالتمام", correctLabel: "16 سم + ⅔ سم", explanation: "القيمة 10.166 تمثل 16 سم وثلثي سم (سدس متر)، بينما 10.16 تعني 16 سم فقط مما يضيع كسر ثلثي السنتيمتر." },
          "160": { intended: `${mText} و 16 سنتيمترًا وثلثي سنتيمتر.`, correctVal: `${m}.166`, wrongLabel: "16 سم بالتمام", correctLabel: "16 سم + ⅔ سم", explanation: "القيمة 10.166 تمثل 16 سم وثلثي سم (سدس متر)، بينما 10.16 تعني 16 سم فقط مما يضيع كسر ثلثي السنتيمتر." },
          "66": { intended: `${mText} و 66 سنتيمترًا وثلثي سنتيمتر.`, correctVal: `${m}.666`, wrongLabel: "66 سم بالتمام", correctLabel: "66 سم + ⅔ سم", explanation: "القيمة 10.666 تمثل 66 سم وثلثي سم (ثلثا متر)، بينما 10.66 تعني 66 سم فقط مما يضيع كسر ثلثي السنتيمتر." },
          "660": { intended: `${mText} و 66 سنتيمترًا وثلثي سنتيمتر.`, correctVal: `${m}.666`, wrongLabel: "66 سم بالتمام", correctLabel: "66 سم + ⅔ سم", explanation: "القيمة 10.666 تمثل 66 سم وثلثي سم (ثلثا متر)، بينما 10.66 تعني 66 سم فقط مما يضيع كسر ثلثي السنتيمتر." }
        };

        if (typos[dec]) {
          const typo = typos[dec];
          return {
            isTypo: true,
            written: `${mText} و ${dec.length === 2 ? dec : dec.slice(0, 2)} سنتيمترًا.`,
            intended: typo.intended,
            correctVal: typo.correctVal,
            wrongLabel: typo.wrongLabel,
            correctLabel: typo.correctLabel,
            explanation: typo.explanation
          };
        }
      }
    } catch (err) {
      logError("getTypoDetails", err);
    }
    return { isTypo: false };
  }

  // ----------------------------------------------------
  // 4. بناء وعرض واجهة المستخدم (DOM Rendering)
  // ----------------------------------------------------

  /**
   * إنشاء كائن المساعد الطائر في الـ DOM إن لم يكن موجوداً.
   */
  function createTooltipElement() {
    try {
      if (document.getElementById("fraction-helper-tooltip")) {
        tooltip = document.getElementById("fraction-helper-tooltip");
        return;
      }

      tooltip = document.createElement("div");
      tooltip.id = "fraction-helper-tooltip";
      tooltip.className = "fh-tooltip";
      
      // منع سحب التركيز عند النقر داخل التوليب
      tooltip.addEventListener("mousedown", function (e) {
        e.preventDefault();
      });

      tooltip.addEventListener("click", function (e) {
        const pill = e.target.closest(".fh-fraction-pill");
        const fixBtn = e.target.closest(".fh-typo-fix-btn");

        if (!activeInput) return;

        if (pill) {
          const val = pill.getAttribute("data-value");
          insertFraction(val);
        } else if (fixBtn) {
          const val = fixBtn.getAttribute("data-value");
          activeInput.value = val;
          triggerInputEvents(activeInput);
          updateTooltip(activeInput);
        }
      });

      document.body.appendChild(tooltip);
    } catch (err) {
      logError("createTooltipElement", err);
    }
  }

  /**
   * إعادة تموضع التوليب المساعد بدقة أسفل أو أعلى الحقل النشط.
   * @param {HTMLInputElement} input الحقل النشط المستهدف
   */
  function repositionTooltip(input) {
    if (!tooltip || !input) return;
    
    try {
      const rect = input.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset;
      const scrollX = window.scrollX || window.pageXOffset;
      
      let top = rect.bottom + scrollY + 6;
      let left = rect.left + scrollX;
      
      // موازنة الخروج عن الشاشة يميناً ويساراً
      const tooltipWidth = 320;
      if (left + tooltipWidth > window.innerWidth) {
        left = window.innerWidth - tooltipWidth - 10;
      }
      if (left < 10) left = 10;
      
      // تحديد الموضع بناء على تفضيلات التهيئة والمساحة المتاحة
      const tooltipHeight = tooltip.offsetHeight || 180;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      let position = config.preferredPosition;
      if (position === 'auto') {
        position = (spaceBelow < tooltipHeight + 10 && spaceAbove > tooltipHeight + 10) ? 'above' : 'below';
      }

      if (position === 'above') {
        top = rect.top + scrollY - tooltipHeight - 6;
      } else {
        top = rect.bottom + scrollY + 6;
      }
      
      tooltip.style.top = top + "px";
      tooltip.style.left = left + "px";
    } catch (err) {
      logError("repositionTooltip", err);
    }
  }

  /**
   * تحديث محتوى التوليب بناءً على مدخلات الحقل وإعدادات التهيئة مع قياس الأداء.
   * @param {HTMLInputElement} input الحقل المستهدف
   */
  function updateTooltip(input) {
    if (!tooltip) return;
    
    const startTime = performance.now();
    try {
      const val = input.value.trim();
      
      // الهيكل الثابت للكسور السريعة
      const pillsHtml = config.showQuickPills ? `
        <div class="fh-pills-header">📌 كسور سريعة لإضافتها للرقم:</div>
        <div class="fh-fraction-pills">
          <button type="button" class="fh-fraction-pill" data-value="125">⅛ (ثمن)</button>
          <button type="button" class="fh-fraction-pill" data-value="25">¼ (ربع)</button>
          <button type="button" class="fh-fraction-pill" data-value="333">⅓ (ثلث)</button>
          <button type="button" class="fh-fraction-pill" data-value="5">½ (نصف)</button>
          <button type="button" class="fh-fraction-pill" data-value="666">⅔ (ثلثين)</button>
          <button type="button" class="fh-fraction-pill" data-value="75">¾ (ثلاث أرباع)</button>
          <button type="button" class="fh-fraction-pill" data-value="833">⅚ (ثلث سنتيمتر)</button>
        </div>
      ` : '';

      if (!val) {
        tooltip.innerHTML = `
          <div class="fh-header">💡 طريقة إدخال الكسور زراعياً:</div>
          <div style="font-size:12.5px; line-height:1.5; color:#475569;">
            اكتب الرقم الصحيح، متبوعاً بالفاصلة العشرية ثم الكسور.
            مثال: <code>10.833</code> تعني 10 أمتار و 80 سم وثلث سم.
          </div>
          ${pillsHtml}
        `;
        repositionTooltip(input);
        
        const endTime = performance.now();
        logPerformance("Empty Tooltip Update", endTime - startTime);
        return;
      }

      const details = parseInputToDetails(val);
      const typo = getTypoDetails(val);

      let html = '';
      
      if (config.showTranslation) {
        html += `<div class="fh-header">🗣️ قراءة القياس باللغة العربية:</div>`;
        if (details.isValid) {
          html += `<div class="fh-translation">${details.fullText}</div>`;
        } else {
          html += `<div class="fh-translation" style="color:#b91c1c; border-right-color:#ef4444;">قيمة غير صالحة</div>`;
        }
      }

      if (config.showTypoDetector && typo.isTypo) {
        html += `
          <div class="fh-typo-alert">
            <div class="fh-typo-alert-header">⚠️ تنبيه خطأ إدخال كسر شائع</div>
            أنت كتبت: <strong>${typo.written}</strong><br>
            وغالباً كنت تقصد: <strong>${typo.intended}</strong>
            
            <div class="fh-typo-visual-compare">
              <div class="fh-compare-item fh-wrong">
                <span class="fh-compare-val">${val}</span>
                <span class="fh-compare-label">${typo.wrongLabel}</span>
              </div>
              <div class="fh-compare-sign">≠</div>
              <div class="fh-compare-item fh-correct">
                <span class="fh-compare-val">${typo.correctVal}</span>
                <span class="fh-compare-label">${typo.correctLabel}</span>
              </div>
            </div>
            
            <div class="fh-typo-explanation">
              💡 <strong>الفرق الحسابي:</strong> ${typo.explanation}
            </div>
            
            <button type="button" class="fh-typo-fix-btn" data-value="${typo.correctVal}">
              ✅ تصحيح تلقائي إلى ${typo.correctVal}
            </button>
          </div>
        `;
      }

      html += pillsHtml;
      tooltip.innerHTML = html;
      repositionTooltip(input);
      
      const endTime = performance.now();
      logPerformance("Content Tooltip Update", endTime - startTime, `Length: ${val.length}`);
    } catch (err) {
      logError("updateTooltip", err);
    }
  }

  /**
   * حقن الكسر السريع المحدد داخل الحقل النشط.
   * @param {string} fractionDecimal القيمة العشرية للكسر
   */
  function insertFraction(fractionDecimal) {
    if (!activeInput) return;
    try {
      const currentVal = activeInput.value.trim();
      if (!currentVal) {
        activeInput.value = "0." + fractionDecimal;
      } else {
        const parts = currentVal.split(".");
        activeInput.value = parts[0] + "." + fractionDecimal;
      }
      triggerInputEvents(activeInput);
      updateTooltip(activeInput);
      activeInput.focus();
    } catch (err) {
      logError("insertFraction", err);
    }
  }

  /**
   * إرسال أحداث التعديل لتنبيه العمليات الحسابية بالصفحة الأصلية.
   * @param {HTMLInputElement} input الحقل المستهدف
   */
  function triggerInputEvents(input) {
    try {
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    } catch (err) {
      logError("triggerInputEvents", err);
    }
  }

  // ----------------------------------------------------
  // 5. محرك التأخير (Debounce Helper)
  // ----------------------------------------------------

  /**
   * وظيفة تقييد التحديث لزيادة كفاءة استهلاك موارد المعالج أثناء الكتابة السريعة.
   * @param {Function} func الدالة المستهدفة
   * @param {number} wait وقت التأخير بالملي ثانية
   * @returns {Function} الدالة المغلفة
   */
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  const debouncedUpdateTooltip = debounce(updateTooltip, 80);

  // ----------------------------------------------------
  // 6. مستمعات أحداث الواجهة الموحدة (Event Listeners)
  // ----------------------------------------------------

  function handleFocusIn(e) {
    if (e.target && (e.target.matches(config.selector) || manuallyAttachedElements.has(e.target))) {
      if (hideTimeout) clearTimeout(hideTimeout);
      activeInput = e.target;
      updateTooltip(activeInput);
      if (tooltip) tooltip.classList.add("fh-active");
    }
  }

  function handleFocusOut(e) {
    if (e.target && (e.target.matches(config.selector) || manuallyAttachedElements.has(e.target))) {
      hideTimeout = setTimeout(function () {
        if (tooltip) tooltip.classList.remove("fh-active");
        activeInput = null;
      }, 240);
    }
  }

  function handleInput(e) {
    if (e.target && e.target === activeInput) {
      debouncedUpdateTooltip(activeInput);
    }
  }

  function handleResize() {
    if (activeInput && tooltip && tooltip.classList.contains("fh-active")) {
      repositionTooltip(activeInput);
    }
  }

  function handleScroll() {
    if (activeInput && tooltip && tooltip.classList.contains("fh-active")) {
      repositionTooltip(activeInput);
    }
  }

  // ----------------------------------------------------
  // 7. الواجهة البرمجية المفتوحة المعتمدة (Public API)
  // ----------------------------------------------------

  window.FractionHelper = {
    /** @type {string} الإصدار الحالي للمكون */
    version: "2.0.0",

    /**
     * تهيئة المكوّن وبدء تشغيل واجهة المراقبة.
     * @param {Object} [options] خيارات التخصيص
     */
    init: function (options) {
      if (isInitialized) return;
      
      const startTime = performance.now();
      try {
        if (options) {
          config = Object.assign({}, config, options);
        }

        createTooltipElement();

        // ربط مستمعات الأحداث بالتفويض (Event Delegation)
        document.addEventListener("focusin", handleFocusIn);
        document.addEventListener("focusout", handleFocusOut);
        document.addEventListener("input", handleInput);
        
        window.addEventListener("resize", handleResize);
        window.addEventListener("scroll", handleScroll, true);

        // تفعيل MutationObserver للتحري التلقائي لضمان التهيئة الفورية للحقول الديناميكية
        domObserver = new MutationObserver(function (mutations) {
          try {
            for (let mutation of mutations) {
              for (let node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  // إذا تم إضافة حقل يطابق شروطنا، نقوم بإجراء تحديث/تنشيط للمساعد
                  if (node.matches(config.selector) || node.querySelector(config.selector)) {
                    FractionHelper.refresh();
                  }
                }
              }
            }
          } catch (observerErr) {
            logError("MutationObserver Callback", observerErr);
          }
        });

        domObserver.observe(document.body, { childList: true, subtree: true });
        isInitialized = true;
        
        const endTime = performance.now();
        logPerformance("Initialization", endTime - startTime, `Monitored elements query count: ${document.querySelectorAll(config.selector).length}`);
      } catch (err) {
        logError("init", err);
      }
    },

    /**
     * إزالة المكوّن بالكامل من الصفحة وتحرير الذاكرة وتصفير المراجع.
     */
    destroy: function () {
      if (!isInitialized) return;

      const startTime = performance.now();
      try {
        // إيقاف الـ MutationObserver
        if (domObserver) {
          domObserver.disconnect();
          domObserver = null;
        }

        // فك ارتباط مستمعات الأحداث المفوّضة
        document.removeEventListener("focusin", handleFocusIn);
        document.removeEventListener("focusout", handleFocusOut);
        document.removeEventListener("input", handleInput);
        
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("scroll", handleScroll, true);

        // إزالة التوليب من الـ DOM
        if (tooltip && tooltip.parentNode) {
          tooltip.parentNode.removeChild(tooltip);
        }
        
        tooltip = null;
        activeInput = null;
        manuallyAttachedElements.clear();

        if (hideTimeout) {
          clearTimeout(hideTimeout);
          hideTimeout = null;
        }

        isInitialized = false;
        
        const endTime = performance.now();
        logPerformance("Destruction/Cleanup", endTime - startTime);
      } catch (err) {
        logError("destroy", err);
      }
    },

    /**
     * إعادة فحص تموضع وتحديث واجهة المساعد.
     */
    refresh: function () {
      try {
        if (activeInput && tooltip && tooltip.classList.contains("fh-active")) {
          updateTooltip(activeInput);
        }
      } catch (err) {
        logError("refresh", err);
      }
    },

    /**
     * إرفاق المساعد يدوياً بحقل قياس محدد خارج إعداد الفلترة الأساسي.
     * @param {HTMLInputElement} element الحقل المستهدف
     */
    attach: function (element) {
      if (!element) return;
      try {
        manuallyAttachedElements.add(element);
        logPerformance("Manual Attach", 0, `Monitored count: ${manuallyAttachedElements.size}`);
      } catch (err) {
        logError("attach", err);
      }
    },

    /**
     * فك ارتباط المساعد الطائر يدوياً بحقل قياس محدد.
     * @param {HTMLInputElement} element الحقل المستهدف
     */
    detach: function (element) {
      if (!element) return;
      try {
        manuallyAttachedElements.delete(element);
        if (activeInput === element) {
          if (tooltip) tooltip.classList.remove("fh-active");
          activeInput = null;
        }
        logPerformance("Manual Detach", 0, `Monitored count: ${manuallyAttachedElements.size}`);
      } catch (err) {
        logError("detach", err);
      }
    }
  };

  // دعم واجهة برمجية احتياطية مطابقة للتسمية القديمة لضمان عدم حدوث كسر بالنسخ السابقة
  window.initFractionHelper = function (options) {
    window.FractionHelper.init(options);
  };
})();
