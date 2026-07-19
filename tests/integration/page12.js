/**
 * tests/integration/page12.js
 * ===========================
 * اختبارات تكامل منطق رسم وتقسيم الأرض في الصفحة الثانية عشرة (Page12)
 */

(function (global) {
  "use strict";

  global.DallalIntegrationSuite = global.DallalIntegrationSuite || {};

  global.DallalIntegrationSuite.page12 = {
    name: "Page12 (Land Drawing & Carat Size) Integration",
    run(assert) {
      assert("AgriUnitsCompat is loaded", typeof AgriUnitsCompat !== "undefined");
      if (typeof AgriUnitsCompat === "undefined") return;

      // 1. اختبار مساحة القيراط المخصصة (Custom Carat Size)
      // المساحة الافتراضية في صفحة 12 قد تكون 175.0347 م² (بدلاً من 168 م² القياسية).
      const caratSize = 175.0347;

      // تحويل مساحة بالمتر المربع بناءً على القيراط المخصص
      // مساحة 4200.833 م² = 4200.833 / 175.0347 = 24 قيراط = 1 فدان
      const fcs = AgriUnitsCompat.sqmToFCS(4200.833, caratSize);
      assert("Custom caratSize sqmToFCS yields exactly 1 feddan", fcs.feddan === 1 && fcs.carat === 0 && Math.abs(fcs.sahm) < 0.05);

      // 2. التحويل العكسي: من فدان/قيراط/سهم إلى متر مربع باستخدام قيراط مخصص
      // 1 فدان و 2 قيراط و 12 سهم
      // 1 فدان = 24 قيراط. المجموع = 26.5 قيراط.
      // المساحة بالمتر المربع = 26.5 × 175.0347 = 4638.41955 م²
      const sqm = AgriUnitsCompat.fcsToSqm(1, 2, 12, caratSize);
      assert("Custom caratSize fcsToSqm converts back accurately", Math.abs(sqm - 4638.419) < 0.05);

      // 3. التحقق من تطابق سلوك الدالة مع كائن النواة الأساسي
      if (global.AgriUnits) {
        const coreRes = global.AgriUnits.sqmToFCS(500, caratSize);
        const compatRes = AgriUnitsCompat.sqmToFCS(500, caratSize);
        assert("Integration matches Core AgriUnits calculations exactly", 
          coreRes.feddan === compatRes.feddan &&
          coreRes.carat === compatRes.carat &&
          Math.abs(coreRes.sahm - compatRes.sahm) < 0.0001
        );
      }
    }
  };

})(typeof window !== "undefined" ? window : global);
