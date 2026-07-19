/**
 * tests/integration/page13.js
 * ===========================
 * اختبارات تكامل منطق رسم وتقسيم الأرض في الصفحة الثالثة عشرة (Page13)
 */

(function (global) {
  "use strict";

  global.DallalIntegrationSuite = global.DallalIntegrationSuite || {};

  global.DallalIntegrationSuite.page13 = {
    name: "Page13 (Smart Layout & Plural Mapping) Integration",
    run(assert) {
      assert("AgriUnitsCompat is loaded", typeof AgriUnitsCompat !== "undefined");
      if (typeof AgriUnitsCompat === "undefined") return;

      // 1. اختبار دالة التحويل بصيغة الجمع المستخدمة في Page13
      // sqmToFCSPlural ترجع { feddans, carats, shares } بدلاً من { feddan, carat, sahm }
      const caratSize = 168.0;
      const resPlural = AgriUnitsCompat.sqmToFCSPlural(1000, caratSize);
      
      assert("sqmToFCSPlural returns mapped feddans correctly", resPlural.feddans !== undefined);
      assert("sqmToFCSPlural returns mapped carats correctly", resPlural.carats !== undefined);
      assert("sqmToFCSPlural returns mapped shares correctly", resPlural.shares !== undefined);

      // التحقق من صحة القيمة الحسابية
      const resNormal = AgriUnitsCompat.sqmToFCS(1000, caratSize);
      assert("sqmToFCSPlural matches sqmToFCS calculations exactly",
        resPlural.feddans === resNormal.feddan &&
        resPlural.carats === resNormal.carat &&
        resPlural.shares === resNormal.sahm
      );

      // 2. اختبار تطبيع القصبات والقبضات الخاص بـ Page13 (normalizeQasabaQabda)
      // 24 قبضة = 1 قصبة. كسر القبضة مقرب لأقرب خانتين عشريتين (بين 0.00 و 0.99)
      const norm1 = AgriUnitsCompat.normalizeQasabaQabda(2, 25, 0.5); // 25 قبضة = 1 قصبة + 1 قبضة
      assert("normalizeQasabaQabda carried over excess qabda to qasaba", norm1.qasaba === 3 && norm1.qabda === 1);
      assert("normalizeQasabaQabda preserved fraction correctly", Math.abs(norm1.fraction - 0.5) < 0.001);
    }
  };

})(typeof window !== "undefined" ? window : global);
