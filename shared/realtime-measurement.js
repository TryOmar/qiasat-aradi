/**
 * @file shared/realtime-measurement.js
 * @description المكوّن المشترك العام للقراءة الفورية للقياسات بالمتر باللغة العربية أسفل حقول الإدخال.
 * 
 * الميثاق المعماري الرسمي للمشروع (Single Source of Truth):
 * "قراءة القياس باللغة العربية هي مكوّن مشترك (Shared Component) داخل مشروع HTML،
 * ويُمنع إنشاء أي نسخة محلية منها داخل الصفحات. جميع الصفحات تعتمد على ملف `shared/realtime-measurement.js`
 * باعتباره المرجع الوحيد."
 * 
 * Public API Documentation:
 * -------------------------------------------------------------
 * - RealtimeMeasurement.bind()                : ربط الأحداث للحقول المعرفة بالواسمة
 * - RealtimeMeasurement.refresh()             : إعادة فحص الـ DOM وربط الحقول والنوافذ الديناميكية
 * - RealtimeMeasurement.update(input, helper) : تحديث القراءة العربية لحقل محدد يدوياً
 * - RealtimeMeasurement.runRegressionTest()    : تشغيل اختبار التراجع السلوكي القياسي
 * -------------------------------------------------------------
 * @version 3.0.0
 */

(function () {
  if (window.RealtimeMeasurement) return;

  /**
   * القراءة الفورية للقياس باللغة العربية وتحديث العنصر المساعد في الـ DOM
   * @param {string|HTMLElement} inputRef معرف أو عنصر حقل الإدخال
   * @param {string|HTMLElement} [helperRef] معرف أو عنصر النص المساعد
   */
  function updateRealtimeMeasurementHelper(inputRef, helperRef) {
    const inputEl = typeof inputRef === "string" ? document.getElementById(inputRef) : inputRef;
    if (!inputEl) return;

    let helperEl = null;
    if (helperRef) {
      helperEl = typeof helperRef === "string" ? document.getElementById(helperRef) : helperRef;
    } else if (inputEl.dataset && inputEl.dataset.measurementHelper && inputEl.dataset.measurementHelper !== "true") {
      helperEl = document.getElementById(inputEl.dataset.measurementHelper);
    } else if (inputEl.id) {
      helperEl = document.getElementById(inputEl.id + "-helper");
    }

    if (!helperEl) return;

    const rawStr = inputEl.value ? inputEl.value.trim() : "";

    // 1. معالجة الإدخالات الفارغة أو القيم السالبة أو النصوص غير الرقمية (مثل abc, ..., --, -10)
    if (!rawStr || /^[-]/.test(rawStr) || isNaN(Number(rawStr))) {
      if (helperEl.style.display !== "none") helperEl.style.display = "none";
      if (helperEl.textContent !== "") helperEl.textContent = "";
      return;
    }

    const num = parseFloat(rawStr);
    if (isNaN(num) || num <= 0) {
      if (helperEl.style.display !== "none") helperEl.style.display = "none";
      if (helperEl.textContent !== "") helperEl.textContent = "";
      return;
    }

    // 2. تحويل الرقم للكلمات العربية باستخدام FractionHelper المعياري
    let text = "";
    if (window.FractionHelper && typeof window.FractionHelper.parseInputToDetails === "function") {
      try {
        const details = window.FractionHelper.parseInputToDetails(rawStr);
        if (details && details.fullText) {
          text = details.fullText;
        }
      } catch (e) {
        console.warn("[RealtimeMeasurement] FractionHelper parse error:", e);
      }
    }

    // 3. الخوارزمية الاحتياطية للأرقام والمتر/السنتيمتر
    if (!text && num > 0) {
      const parts = rawStr.split(".");
      const m = parseInt(parts[0]) || 0;
      let cms = 0;
      if (parts.length > 1 && parts[1]) {
        let decStr = parts[1];
        if (decStr.length === 1) cms = parseInt(decStr) * 10;
        else cms = parseInt(decStr.slice(0, 2));
      }
      if (m > 0 && cms > 0) text = m + " مترًا و" + cms + " سنتيمترًا.";
      else if (m > 0) text = m + " مترًا.";
      else if (cms > 0) text = cms + " سنتيمترًا.";
    }

    // 4. إظهار/إخفاء النص المقروء واستخدام textContent للسرعة والأمان ومنع Repaint الزائد
    if (text) {
      if (helperEl.textContent !== text) {
        helperEl.textContent = text;
      }
      if (helperEl.style.display !== "block") {
        helperEl.style.display = "block";
      }
    } else {
      if (helperEl.style.display !== "none") {
        helperEl.style.display = "none";
      }
      if (helperEl.textContent !== "") {
        helperEl.textContent = "";
      }
    }
  }

  /**
   * ربط أحداث الإدخال تلقائياً لجميع الحقول التي تحمل الواسمة data-measurement-helper
   * مع حماية الحقول المرتبطة سابقاً (Guard Flag: dataset.measurementBound)
   */
  function bindMeasurementHelpers() {
    const inputs = document.querySelectorAll("[data-measurement-helper]");
    inputs.forEach((inputEl) => {
      if (inputEl.dataset.measurementBound === "1") return;

      inputEl.addEventListener("input", function () {
        updateRealtimeMeasurementHelper(inputEl);
      });

      inputEl.dataset.measurementBound = "1";
      // تحديث فوري للقيمة الابتدائية للحقل عند التفعيل
      updateRealtimeMeasurementHelper(inputEl);
    });
  }

  /**
   * إعادة فحص المستند والنوافذ الحوارية الديناميكية لربط أي حقول جديدة
   */
  function refreshMeasurementHelpers() {
    bindMeasurementHelpers();
  }

  /**
   * اختبار التراجع السلوكي القياسي (Regression Test)
   * يضمن مطابقة مخرجات القراءة العربية بين جميع الصفحات
   */
  function runRegressionTest() {
    console.log("%c[RealtimeMeasurement] Running Regression Tests...", "color: #2e7d32; font-weight: bold;");
    const testCases = [
      { input: "10.833", expected: "عشرة أمتار و80 سنتيمترًا وثلث سنتيمتر." },
      { input: "10.25", expected: "عشرة أمتار و25 سنتيمترًا." },
      { input: "1234.875", expected: "ألف ومائتان وأربعة وثلاثون متراً و80 سنتيمترًا وثلاثة أرباع سنتيمتر." },
      { input: "-10", expected: "" },
      { input: "abc", expected: "" },
      { input: "...", expected: "" }
    ];

    let passed = 0;
    testCases.forEach((tc, idx) => {
      let result = "";
      if (tc.input && !/^[-]/.test(tc.input) && !isNaN(Number(tc.input))) {
        if (window.FractionHelper && window.FractionHelper.parseInputToDetails) {
          const details = window.FractionHelper.parseInputToDetails(tc.input);
          result = details.fullText || "";
        }
      }

      const ok = result.trim() === tc.expected.trim();
      if (ok) {
        passed++;
        console.log(`  ✓ Test #${idx + 1} Passed: "${tc.input}" -> "${result}"`);
      } else {
        console.error(`  ✗ Test #${idx + 1} Failed: "${tc.input}" | Expected: "${tc.expected}" | Got: "${result}"`);
      }
    });

    console.log(`%c[RealtimeMeasurement] Tests summary: ${passed}/${testCases.length} passed.`, "color: #1b5e20; font-weight: bold;");
    return passed === testCases.length;
  }

  // التنفيذ الذاتي التلقائي عند جاهزية مستند الـ DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindMeasurementHelpers);
  } else {
    bindMeasurementHelpers();
  }

  // الواجهة البرمجية الموحدة المشتركة (Public API Documentation)
  window.RealtimeMeasurement = {
    bind: bindMeasurementHelpers,
    refresh: refreshMeasurementHelpers,
    update: updateRealtimeMeasurementHelper,
    runRegressionTest: runRegressionTest
  };

  // دعم التوافقية والتسميات القديمة
  window.updateRealtimeMeasurementHelper = updateRealtimeMeasurementHelper;
  window.initAllRealtimeHelpers = function () {
    refreshMeasurementHelpers();
  };
})();
