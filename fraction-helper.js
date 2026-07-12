/**
 * fraction-helper.js
 * المكوّن المشترك لمعالجة وتوضيح الكسور وكشف الأخطاء الشائعة لتطبيق الدَّلاَّل.
 * يدعم العمل بالكامل دون اتصال بالإنترنت (Offline First) والتوافقية مع الهواتف المحمولة.
 */

(function () {
  let tooltip = null;
  let activeInput = null;
  let hideTimeout = null;
  let currentSelector = 'input[inputmode="decimal"]:not(#carat-size):not(#carat-price-display), [data-fraction-input], .fraction-input';

  // ----------------------------------------------------
  // 1. خوارزميات الترجمة الفورية للعربية (Logic Core)
  // ----------------------------------------------------

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
  }

  // ----------------------------------------------------
  // 2. كاشف الأخطاء الشائعة (Typo Detector Core)
  // ----------------------------------------------------

  function getTypoDetails(valStr) {
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
    return { isTypo: false };
  }

  // ----------------------------------------------------
  // 3. إدارة التموضع وعرض الواجهة (UI Management)
  // ----------------------------------------------------

  function createTooltipElement() {
    if (document.getElementById("fraction-helper-tooltip")) {
      tooltip = document.getElementById("fraction-helper-tooltip");
      return;
    }

    tooltip = document.createElement("div");
    tooltip.id = "fraction-helper-tooltip";
    tooltip.className = "fraction-helper-tooltip";
    
    // منع حدوث blur للحقل عند النقر داخل التوليب
    tooltip.addEventListener("mousedown", function (e) {
      e.preventDefault();
    });

    // إدارة التفاعلات داخل التوليب
    tooltip.addEventListener("click", function (e) {
      const pill = e.target.closest(".fraction-pill");
      const fixBtn = e.target.closest(".typo-fix-btn");

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
  }

  function repositionTooltip(input) {
    if (!tooltip || !input) return;
    
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
    
    // إذا كانت هناك مساحة ضيقة بالأسفل، يظهر المكوّن أعلى الحقل
    const tooltipHeight = tooltip.offsetHeight || 180;
    if (rect.bottom + tooltipHeight > window.innerHeight && rect.top - tooltipHeight > 0) {
      top = rect.top + scrollY - tooltipHeight - 6;
    }
    
    tooltip.style.top = top + "px";
    tooltip.style.left = left + "px";
  }

  function updateTooltip(input) {
    if (!tooltip) return;
    const val = input.value.trim();
    if (!val) {
      // إظهار تعليمات الإدخال الأساسية بدلاً من الاختفاء
      tooltip.innerHTML = `
        <div class="tooltip-header">💡 طريقة إدخال الكسور زراعياً:</div>
        <div style="font-size:12.5px; line-height:1.5; color:#475569;">
          اكتب الرقم الصحيح، متبوعاً بالفاصلة العشرية ثم الكسور.
          مثال: <code>10.833</code> تعني 10 أمتار و 80 سم وثلث سم.
        </div>
        <div class="pills-header">📌 كسور سريعة لإضافتها للرقم:</div>
        <div class="fraction-pills">
          <button type="button" class="fraction-pill" data-value="125">⅛ (ثمن)</button>
          <button type="button" class="fraction-pill" data-value="25">¼ (ربع)</button>
          <button type="button" class="fraction-pill" data-value="333">⅓ (ثلث)</button>
          <button type="button" class="fraction-pill" data-value="5">½ (نصف)</button>
          <button type="button" class="fraction-pill" data-value="666">⅔ (ثلثين)</button>
          <button type="button" class="fraction-pill" data-value="75">¾ (ثلاث أرباع)</button>
          <button type="button" class="fraction-pill" data-value="833">⅚ (ثلث سنتيمتر)</button>
        </div>
      `;
      repositionTooltip(input);
      return;
    }

    const details = parseInputToDetails(val);
    const typo = getTypoDetails(val);

    let html = `<div class="tooltip-header">🗣️ قراءة القياس باللغة العربية:</div>`;
    if (details.isValid) {
      html += `<div class="tooltip-translation">${details.fullText}</div>`;
    } else {
      html += `<div class="tooltip-translation" style="color:#b91c1c; border-right-color:#ef4444;">قيمة غير صالحة</div>`;
    }

    if (typo.isTypo) {
      html += `
        <div class="typo-alert">
          <div class="typo-alert-header">⚠️ تنبيه خطأ إدخال كسر شائع</div>
          أنت كتبت: <strong>${typo.written}</strong><br>
          وغالباً كنت تقصد: <strong>${typo.intended}</strong>
          
          <div class="typo-visual-compare">
            <div class="compare-item wrong">
              <span class="compare-val">${val}</span>
              <span class="compare-label">${typo.wrongLabel}</span>
            </div>
            <div class="compare-sign">≠</div>
            <div class="compare-item correct">
              <span class="compare-val">${typo.correctVal}</span>
              <span class="compare-label">${typo.correctLabel}</span>
            </div>
          </div>
          
          <div class="typo-explanation">
            💡 <strong>الفرق الحسابي:</strong> ${typo.explanation}
          </div>
          
          <button type="button" class="typo-fix-btn" data-value="${typo.correctVal}">
            ✅ تصحيح تلقائي إلى ${typo.correctVal}
          </button>
        </div>
      `;
    }

    // إدراج الكسور السريعة دائماً كمرجع للمستخدم
    html += `
      <div class="pills-header">📌 كسور سريعة لإضافتها للرقم:</div>
      <div class="fraction-pills">
        <button type="button" class="fraction-pill" data-value="125">⅛ (ثمن)</button>
        <button type="button" class="fraction-pill" data-value="25">¼ (ربع)</button>
        <button type="button" class="fraction-pill" data-value="333">⅓ (ثلث)</button>
        <button type="button" class="fraction-pill" data-value="5">½ (نصف)</button>
        <button type="button" class="fraction-pill" data-value="666">⅔ (ثلثين)</button>
        <button type="button" class="fraction-pill" data-value="75">¾ (ثلاث أرباع)</button>
        <button type="button" class="fraction-pill" data-value="833">⅚ (ثلث سنتيمتر)</button>
      </div>
    `;

    tooltip.innerHTML = html;
    repositionTooltip(input);
  }

  function insertFraction(fractionDecimal) {
    if (!activeInput) return;
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
  }

  function triggerInputEvents(input) {
    // إرسال الأحداث الرياضية لتقوم الصفحة الأصلية بإعادة الحساب والرسم فوراً
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // ----------------------------------------------------
  // 4. تهيئة أحداث التفويض الموحدة (Event Delegation)
  // ----------------------------------------------------

  window.initFractionHelper = function (options) {
    if (options && options.selector) {
      currentSelector = options.selector;
    }

    createTooltipElement();

    // تفويض Focusin (يعمل فور التركيز على الحقل المستهدف حتى لو أضيف ديناميكياً)
    document.addEventListener("focusin", function (e) {
      if (e.target && e.target.matches(currentSelector)) {
        if (hideTimeout) clearTimeout(hideTimeout);
        activeInput = e.target;
        
        // إظهار التوليب
        updateTooltip(activeInput);
        tooltip.classList.add("active");
      }
    });

    // تفويض Focusout
    document.addEventListener("focusout", function (e) {
      if (e.target && e.target.matches(currentSelector)) {
        // تأخير الإغلاق حتى نتمكن من النقر على الأزرار الداخلية للتوليب
        hideTimeout = setTimeout(function () {
          if (tooltip) tooltip.classList.remove("active");
          activeInput = null;
        }, 220);
      }
    });

    // تفويض Input لتعديل واجهة المساعدة فورياً أثناء الكتابة
    document.addEventListener("input", function (e) {
      if (e.target && e.target === activeInput) {
        updateTooltip(activeInput);
      }
    });

    // إعادة التموضع عند التمرير وتعديل مقاس النافذة لضمان ثبات الواجهة
    window.addEventListener("resize", function () {
      if (activeInput && tooltip.classList.contains("active")) {
        repositionTooltip(activeInput);
      }
    });

    window.addEventListener("scroll", function () {
      if (activeInput && tooltip.classList.contains("active")) {
        repositionTooltip(activeInput);
      }
    }, true);
  };
})();
