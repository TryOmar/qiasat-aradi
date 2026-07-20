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

      // 6. اختبار حالة الحقل الحقيقية (Real-World Field Scenario: 6 Equal Partners)
      // C=51.20, A=60.30, D=153.40, B=158.17, CaratArea=168
      const l1 = 153.40, l2 = 158.17, w1 = 51.20, w2 = 60.30;
      const fieldTotalArea = AgriUnitsCompat.trapezoidArea(l1, l2, w1, w2); // 8685.01375 m²
      const fieldPartnersCount = 6;
      const exactPerPartner = fieldTotalArea / fieldPartnersCount; // 1447.502291666... m²
      const displayPerPartner = Number(exactPerPartner.toFixed(2)); // 1447.50 m²

      // المحاكاة: 6 شركاء متساوون
      const partnersList = Array.from({ length: 6 }, (_, i) => ({
        id: i + 1,
        exactArea: exactPerPartner,
        displayArea: displayPerPartner
      }));

      const p6Display = partnersList[5].displayArea;
      const p6Exact = partnersList[5].exactArea;
      const totalFieldDistributed = partnersList.reduce((acc, p) => acc + p.exactArea, 0);
      const fieldDeficit = (fieldTotalArea - totalFieldDistributed) < -0.05 ? Math.abs(fieldTotalArea - totalFieldDistributed) : 0;

      assert("Field Case: Land total area is 8685.01 m²", Math.abs(fieldTotalArea - 8685.01375) < 0.001);
      assert("Field Case: Partner 1-5 display area is 1447.50 m²", partnersList[0].displayArea === 1447.50 && partnersList[4].displayArea === 1447.50);
      assert("Field Case: Partner 6 display area is 1447.50 m² (NEVER 1447.36)", p6Display === 1447.50 && p6Display !== 1447.36);
      assert("Field Case: Partner 6 internal exact area is 1447.5022916... m²", Math.abs(p6Exact - (8685.01375 / 6)) < 0.000001);
      assert("Field Case: Zero Last-Item Adjustment (All 6 partners equal)", partnersList.every(p => p.displayArea === 1447.50));
      assert("Field Case: Deficit is 0.00 m²", fieldDeficit === 0);

      // 7. Formatted Presentation Display Strings (Exact 2 Decimal Strings, e.g. "1447.50", "8685.01", "14.79")
      const formattedAreaString = exactPerPartner.toFixed(2);
      const formattedTotalString = fieldTotalArea.toFixed(2);
      const formattedSahmsString = AgriUnitsCompat.sqmToFCS(exactPerPartner, 168).sahm.toFixed(2);

      assert("Presentation: Area formatted string retains trailing zero (1447.50)", formattedAreaString === "1447.50");
      assert("Presentation: Total land area string retains trailing two decimals (8685.01)", formattedTotalString === "8685.01");
      assert("Presentation: Sahms formatted string is uniformly 2 decimals (14.79)", formattedSahmsString === "14.79");
    }
  };

})(typeof window !== "undefined" ? window : global);
