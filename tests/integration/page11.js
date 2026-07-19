/**
 * tests/integration/page11.js
 * ===========================
 * اختبارات تكامل منطق تحويل وقسمة الأرض في الصفحة الحادية عشرة (Page11)
 */

(function (global) {
  "use strict";

  global.DallalIntegrationSuite = global.DallalIntegrationSuite || {};

  global.DallalIntegrationSuite.page11 = {
    name: "Page11 (Land Partition) Calculations Integration",
    run(assert) {
      assert("AgriUnitsCompat is loaded", typeof AgriUnitsCompat !== "undefined");
      if (typeof AgriUnitsCompat === "undefined") return;

      // 1. اختبار مساحة شبه المنحرف وحسابات المساحة
      const area = AgriUnitsCompat.trapezoidArea(100, 100, 50, 50); // مسطيل 100 × 50 = 5000 م²
      assert("AgriUnitsCompat.trapezoidArea correct rectangle calc", Math.abs(area - 5000) < 0.001);

      // 2. التحقق من تحويل الأطوال المترية لقصبات وقبضات
      const lenDetails = AgriUnitsCompat.metersToQasabaQabda(3.55); // 1 قصبة
      assert("metersToQasabaQabda yields correct qasaba count", lenDetails.qasaba === 1 && lenDetails.qabda === 0);

      const lenDetails2 = AgriUnitsCompat.metersToQasabaQabda(1.775); // 12 قبضة
      assert("metersToQasabaQabda yields correct qabda count", lenDetails2.qasaba === 0 && lenDetails2.qabda === 12);

      // 3. التحقق من تحويل القصبة والمتر العكسي
      const meters = AgriUnitsCompat.qasabaQabdaToMeters(1, 12, 0); // 3.55 + 1.775 = 5.325 متر
      assert("qasabaQabdaToMeters yields correct length in meters", Math.abs(meters - 5.325) < 0.001);

      // 4. التحقق من تحويل مساحة القراريط والأسهم الموحدة (sqmToFCS)
      // فدان = 24 قيراط ، قيراط = 24 سهم. مساحة القيراط الافتراضية = 168 م².
      // مساحة 5000 م² = 5000 / 168 = 29.7619 قيراط = 1 فدان (24 قيراط) + 5 قراريط + 18.29 سهم
      const fcs = AgriUnitsCompat.sqmToFCS(5000, 168);
      assert("sqmToFCS feddan count calculation correct", fcs.feddan === 1);
      assert("sqmToFCS carat count calculation correct", fcs.carat === 5);
      assert("sqmToFCS sahm count calculation correct", Math.abs(fcs.sahm - 18.29) < 0.1);

      // 5. اختبار التطبيع والحدود المرتفعة للفدان والقيراط والسهم
      // 1 فدان و 23 قيراط و 24 سهم = 2 فدان و 0 قيراط و 0 سهم
      const norm = AgriUnitsCompat.normalizeFCS(1, 23, 24);
      assert("normalizeFCS correctly overflows shares into carats and feddans", norm.feddan === 2 && norm.carat === 0 && norm.sahm === 0);
    }
  };

})(typeof window !== "undefined" ? window : global);
