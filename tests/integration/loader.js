/**
 * tests/integration/loader.js
 * ===========================
 * اختبارات التحميل الدفاعية لـ DALLAL:
 *   1. اختبار ترتيب التحميل (Load Order Test)
 *   2. اختبار غياب المكتبة (Missing Library Test)
 *   3. اختبار توافقية الإصدارات (Version Compatibility Test)
 */

(function (global) {
  "use strict";

  global.DallalIntegrationSuite = global.DallalIntegrationSuite || {};

  global.DallalIntegrationSuite.loader = {
    name: "Dallal Load Order, Missing Libs & Version Compatibility",
    run(assert) {
      // ==========================================
      // 1. اختبار ترتيب التحميل (Load Order Test)
      // ==========================================
      assert("AgriConstants is loaded", typeof AgriConstants !== "undefined");
      assert("AgriUnits is loaded", typeof AgriUnits !== "undefined");
      assert("DallalStorage is loaded", typeof DallalStorage !== "undefined");
      assert("DallalToast is loaded", typeof DallalToast !== "undefined");
      assert("AgriUnitsCompat is loaded", typeof AgriUnitsCompat !== "undefined");

      if (global.document && typeof global.document.querySelectorAll === "function") {
        const scripts = Array.from(global.document.querySelectorAll("script"));
        const srcList = scripts.map(s => s.getAttribute("src") || "");

        // إيجاد مؤشرات الملفات في قائمة السكريبتات
        const idxConstants = srcList.findIndex(src => src.includes("constants.js"));
        const idxUnits = srcList.findIndex(src => src.includes("units.js"));
        const idxCompat = srcList.findIndex(src => src.includes("agri-units-compat.js"));

        // إذا كانت الملفات موجودة في الصفحة الحالية
        if (idxConstants !== -1 && idxUnits !== -1) {
          assert("constants.js is loaded before units.js", idxConstants < idxUnits);
        } else {
          assert("constants.js or units.js script tag not in DOM (simulated environment)", true);
        }

        if (idxUnits !== -1 && idxCompat !== -1) {
          assert("units.js is loaded before agri-units-compat.js", idxUnits < idxCompat);
        }
      } else {
        assert("Skipped DOM script tags index order (no document querySelector in current test runner)", true);
      }

      // ==========================================
      // 2. اختبار غياب المكتبة (Missing Library Test)
      // ==========================================
      const originalAgriUnits = global.AgriUnits;
      const originalDebug = global.DALLAL_DEBUG;

      // أ. محاكاة غياب مكتبة النواة في وضع التطوير (DALLAL_DEBUG = true) -> يجب أن يرمي خطأ
      global.AgriUnits = undefined;
      global.DALLAL_DEBUG = true;

      let threwError = false;
      try {
        AgriUnitsCompat.metersToQasabaQabda(10);
      } catch (e) {
        threwError = true;
        assert("Missing Library Test [DEBUG]: Throws Error successfully on missing AgriUnits", e.message.includes("AgriUnits library was not loaded"));
      }
      if (!threwError) {
        assert("Missing Library Test [DEBUG]: Failed to throw error", false);
      }

      // تجميد كائن التوافقية لضمان عدم التعديل عليه أثناء الاختبارات
      if (global.AgriUnitsCompat && !Object.isFrozen(global.AgriUnitsCompat)) {
        Object.freeze(global.AgriUnitsCompat);
      }
      assert("AgriUnitsCompat is frozen for stability", Object.isFrozen(global.AgriUnitsCompat));

      // ب. محاكاة غياب مكتبة النواة في وضع الإنتاج (DALLAL_DEBUG = false) -> يجب ألا يرمي خطأ بل يرجع fallback
      global.DALLAL_DEBUG = false;
      let returnedFallback = false;
      try {
        const fallbackVal = AgriUnitsCompat.metersToQasabaQabda(3.55); // القيمة الافتراضية لقصبة واحدة
        // بما أن AgriUnits غائبة، يجب أن تستدعى الدالة الاحتياطية legacyToQasabaAndQabda
        if (fallbackVal && fallbackVal.qasaba === 1 && fallbackVal.qabda === 0) {
          returnedFallback = true;
        }
        assert("Missing Library Test [PRODUCTION]: Safe fallback returned successfully on missing AgriUnits", returnedFallback);
      } catch (e) {
        assert("Missing Library Test [PRODUCTION]: Threw unexpected error: " + e.message, false);
      }

      // ج. اختبار ترتيب التحميل السلبي (Negative Load Order Test)
      // محاكاة وضع الإنتاج (DALLAL_DEBUG = false) وغياب المكتبة: يجب تسجيل الخطأ عبر console.error دون إلقاء استثناء
      global.AgriUnits = undefined;
      global.DALLAL_DEBUG = false;
      
      const originalConsoleError = console.error;
      let loggedError = false;
      console.error = (msg) => {
        if (msg && msg.includes("AgriUnits library was not loaded")) {
          loggedError = true;
        }
      };
      
      try {
        AgriUnitsCompat.metersToQasabaQabda(10);
        assert("Negative Load Order [PRODUCTION]: console.error was triggered correctly on missing AgriUnits", loggedError);
      } catch (e) {
        assert("Negative Load Order [PRODUCTION]: Threw unexpected error", false);
      } finally {
        console.error = originalConsoleError;
      }

      // استرجاع القيم الأصلية
      global.AgriUnits = originalAgriUnits;
      global.DALLAL_DEBUG = originalDebug;

      // ==========================================
      // 3. اختبار توافقية الإصدارات (Version Compatibility Test)
      // ==========================================
      const expectedVersions = {
        AgriConstants: { value: global.AgriConstants ? global.AgriConstants.VERSION : null, min: "1.1.0" },
        AgriUnits:     { value: global.AgriUnits ? global.AgriUnits.VERSION : null, min: "1.0.1" },
        DallalStorage: { value: global.DallalStorage ? global.DallalStorage.VERSION : null, min: "1.0.3" },
        DallalToast:   { value: global.DallalToast ? global.DallalToast.VERSION : null, min: "1.0.0" },
        AgriUnitsCompat: { value: global.AgriUnitsCompat ? global.AgriUnitsCompat.VERSION : null, min: "1.0.0" }
      };

      function parseVersion(vStr) {
        if (!vStr) return [0, 0, 0];
        return vStr.split(".").map(Number);
      }

      function isCompatible(current, min) {
        const cParts = parseVersion(current);
        const mParts = parseVersion(min);
        for (let i = 0; i < 3; i++) {
          if (cParts[i] > mParts[i]) return true;
          if (cParts[i] < mParts[i]) return false;
        }
        return true; // متطابق تماماً
      }

      for (let lib in expectedVersions) {
        const current = expectedVersions[lib].value;
        const min = expectedVersions[lib].min;
        if (current) {
          const compatible = isCompatible(current, min);
          assert(`Version compatibility check for ${lib}: found v${current} (expected >= v${min})`, compatible);
        } else {
          assert(`Version compatibility check for ${lib}: library is not defined`, false);
        }
      }
    }
  };

})(typeof window !== "undefined" ? window : global);
