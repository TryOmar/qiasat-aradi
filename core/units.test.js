/**
 * core/units.test.js
 * ==================
 * اختبارات التحقق لمكتبة AgriUnits
 * Commit 9 — Phase 3
 *
 * كيفية التشغيل:
 *   افتح أي صفحة HTML تحتوي على constants.js + units.js
 *   ثم أضف هذا الملف، واستدع AgriUnitsTests.runAll()
 *   أو شغّل في Console المتصفح بعد تحميل الصفحتين.
 *
 * مصدر قيم الاختبار:
 *   جميع القيم مستمدة من نتائج الدوال الأصلية في الصفحات الحالية،
 *   وهي تمثل "العقد" (Contract) الذي يجب ألا يتغير.
 */

const AgriUnitsTests = {

  passed: 0,
  failed: 0,
  results: [],

  // ─── أداة المقارنة ──────────────────────────────────────────
  assert(testName, actual, expected, tolerance = 0.001) {
    let pass = false;

    if (typeof expected === 'object' && expected !== null) {
      // مقارنة كائنات
      pass = Object.keys(expected).every(k => {
        const a = Number(actual[k]);
        const e = Number(expected[k]);
        return Math.abs(a - e) <= tolerance;
      });
    } else {
      pass = Math.abs(Number(actual) - Number(expected)) <= tolerance;
    }

    if (pass) {
      this.passed++;
      this.results.push({ status: '✅', name: testName, actual, expected });
    } else {
      this.failed++;
      this.results.push({ status: '❌', name: testName, actual, expected });
    }
  },

  // ─── تقرير النتائج ──────────────────────────────────────────
  report() {
    console.group('📊 AgriUnits Test Report — Phase 3, Commit 9');
    this.results.forEach(r => {
      if (r.status === '✅') {
        console.log(`${r.status} ${r.name}`);
      } else {
        console.warn(`${r.status} ${r.name}`);
        console.warn('   Expected:', r.expected);
        console.warn('   Actual:  ', r.actual);
      }
    });
    console.log('─'.repeat(50));
    console.log(`✅ Passed: ${this.passed} | ❌ Failed: ${this.failed} | Total: ${this.passed + this.failed}`);
    console.log(`📈 Coverage: ${Math.round(this.passed / (this.passed + this.failed) * 100)}%`);
    console.groupEnd();
    return this.failed === 0;
  },

  // ============================================================
  // اختبارات metersToQasabaQabda
  // ============================================================
  testMetersToQasabaQabda() {
    const fn = AgriUnits.metersToQasabaQabda.bind(AgriUnits);

    // حالات الحافة
    this.assert('metersToQasabaQabda(0)',     fn(0),     { qasaba: 0, qabda: 0, fraction: 0 });
    this.assert('metersToQasabaQabda(null)',  fn(null),  { qasaba: 0, qabda: 0, fraction: 0 });
    this.assert('metersToQasabaQabda(-1)',    fn(-1),    { qasaba: 0, qabda: 0, fraction: 0 });

    // قصبة واحدة بالضبط
    this.assert('metersToQasabaQabda(3.55)',  fn(3.55),  { qasaba: 1, qabda: 0, fraction: 0 });

    // قصبتان
    this.assert('metersToQasabaQabda(7.10)',  fn(7.10),  { qasaba: 2, qabda: 0, fraction: 0 });

    // نصف قصبة = 12 قبضة (3.55/2 = 1.775)
    // qabda = floor(1.775 / (3.55/24)) = floor(1.775 / 0.14791...) = floor(12.0) = 12
    this.assert('metersToQasabaQabda(1.775)', fn(1.775), { qasaba: 0, qabda: 12, fraction: 0 });

    // قصبة + 6 قبضات
    // 3.55 + 6 × (3.55/24) = 3.55 + 0.8875 = 4.4375
    this.assert('metersToQasabaQabda(4.4375)', fn(4.4375), { qasaba: 1, qabda: 6, fraction: 0 });

    // عدد صحيح كبير
    this.assert('metersToQasabaQabda(35.5)',  fn(35.5),  { qasaba: 10, qabda: 0, fraction: 0 });
  },

  // ============================================================
  // اختبارات qasabaQabdaToMeters (عكس metersToQasabaQabda)
  // ============================================================
  testQasabaQabdaToMeters() {
    const fn = AgriUnits.qasabaQabdaToMeters.bind(AgriUnits);

    this.assert('qasabaQabdaToMeters(0, 0, 0)',   fn(0, 0, 0),   0);
    this.assert('qasabaQabdaToMeters(1, 0, 0)',   fn(1, 0, 0),   3.55);
    this.assert('qasabaQabdaToMeters(2, 0, 0)',   fn(2, 0, 0),   7.10);
    this.assert('qasabaQabdaToMeters(0, 12, 0)',  fn(0, 12, 0),  1.775);
    this.assert('qasabaQabdaToMeters(1, 6, 0)',   fn(1, 6, 0),   4.4375);
    this.assert('qasabaQabdaToMeters(10, 0, 0)',  fn(10, 0, 0),  35.5);

    // اختبار الدائرة الكاملة: m → q → m
    const input = 7.89;
    const conv  = AgriUnits.metersToQasabaQabda(input);
    const back  = AgriUnits.qasabaQabdaToMeters(conv.qasaba, conv.qabda, conv.fraction);
    this.assert(`roundtrip(${input})`, back, input, 0.01);
  },

  // ============================================================
  // اختبارات metersToQasabaSq
  // ============================================================
  testMetersToQasabaSq() {
    const fn = AgriUnits.metersToQasabaSq.bind(AgriUnits);

    this.assert('metersToQasabaSq(0)',       fn(0),       0);
    this.assert('metersToQasabaSq(12.6025)', fn(12.6025), 1.0);
    this.assert('metersToQasabaSq(25.205)',  fn(25.205),  2.0);
    this.assert('metersToQasabaSq(6.30125)', fn(6.30125), 0.5);
    // مقارنة مع القيمة الحرفية في Page11 (12.60250)
    this.assert('metersToQasabaSq(12.60250) matches Page11', fn(12.60250), 1.0);
  },

  // ============================================================
  // اختبارات sqmToFCS
  // مقارنة النتائج مع المنطق الأصلي في Page11 و Page12 و Page13
  // ============================================================
  testSqmToFCS() {
    const fn = AgriUnits.sqmToFCS.bind(AgriUnits);

    // ─── حالات الحافة ───
    this.assert('sqmToFCS(0, 168)',     fn(0, 168),     { feddan: 0, carat: 0, sahm: 0 });
    this.assert('sqmToFCS(null, 168)',  fn(null, 168),  { feddan: 0, carat: 0, sahm: 0 });

    // ─── حالات موثقة من الدوال الأصلية (caratSqm = 168) ───
    // قيراط واحد = 168 م²
    this.assert('sqmToFCS(168, 168) = 1 قيراط',
      fn(168, 168), { feddan: 0, carat: 1, sahm: 0 });

    // فدان واحد = 168 × 24 = 4032 م²
    this.assert('sqmToFCS(4032, 168) = 1 فدان',
      fn(4032, 168), { feddan: 1, carat: 0, sahm: 0 });

    // نصف قيراط = 84 م² = 12 سهم
    this.assert('sqmToFCS(84, 168) = 12 سهم',
      fn(84, 168), { feddan: 0, carat: 0, sahm: 12 });

    // قيراط ونصف = 252 م²
    this.assert('sqmToFCS(252, 168) = 1ق + 12س',
      fn(252, 168), { feddan: 0, carat: 1, sahm: 12 });

    // فدان وقيراط ونصف = 4032 + 252 = 4284 م²
    this.assert('sqmToFCS(4284, 168) = 1ف + 1ق + 12س',
      fn(4284, 168), { feddan: 1, carat: 1, sahm: 12 });

    // ─── caratSqm = 175 ───
    // فدان بـ 175: 175 × 24 = 4200 م²
    this.assert('sqmToFCS(4200, 175) = 1 فدان',
      fn(4200, 175), { feddan: 1, carat: 0, sahm: 0 });

    this.assert('sqmToFCS(175, 175) = 1 قيراط',
      fn(175, 175), { feddan: 0, carat: 1, sahm: 0 });

    // ─── مقارنة مع sqmToFeddanCaratShares من Page12 ───
    // الدالة الأصلية في Page12 تستخدم نفس المنطق: floor + round
    // نتحقق من أن النتائج متطابقة
    // sqmToFeddanCaratShares(1000, caratSize=168):
    // fSize = 168×24 = 4032, sSize = 168/24 = 7
    // feddan = floor(1000/4032) = 0
    // remSqm = 1000
    // carat = floor(1000/168) = 5
    // shares = round((1000 - 5×168)/7 × 100)/100 = round((1000-840)/7×100)/100
    //        = round(160/7×100)/100 = round(2285.71)/100 = 22.86
    this.assert('sqmToFCS(1000, 168) matches Page12 original',
      fn(1000, 168), { feddan: 0, carat: 5, sahm: 22.86 });
  },

  // ============================================================
  // اختبارات sqmToFCSFloor (مطابقة Page13/section1)
  // ============================================================
  testSqmToFCSFloor() {
    const fn = AgriUnits.sqmToFCSFloor.bind(AgriUnits);

    this.assert('sqmToFCSFloor(0, 168)',    fn(0, 168),    { feddans: 0, carats: 0, shares: 0 });
    this.assert('sqmToFCSFloor(168, 168) = 1 قيراط',
      fn(168, 168), { feddans: 0, carats: 1, shares: 0 });
    this.assert('sqmToFCSFloor(4032, 168) = 1 فدان',
      fn(4032, 168), { feddans: 1, carats: 0, shares: 0 });
    this.assert('sqmToFCSFloor(84, 168) = 12 سهم',
      fn(84, 168), { feddans: 0, carats: 0, shares: 12 });

    // مقارنة مع convertSqmToFeddans الأصلية في section1:
    // convertSqmToFeddans(1000, 168):
    //   feddanSize = 168×24 = 4032
    //   feddans = floor(1000/4032) = 0
    //   remainingForCarats = 1000
    //   carats = floor(1000/168) = 5
    //   remainingForShares = 1000 - 5×168 = 1000 - 840 = 160
    //   shares = (160 × 24) / 168 = 3840/168 = 22.857... → 22.86
    this.assert('sqmToFCSFloor(1000, 168) matches section1 original',
      fn(1000, 168), { feddans: 0, carats: 5, shares: 22.86 });
  },

  // ============================================================
  // اختبارات fcsToSqm (عكس sqmToFCS)
  // ============================================================
  testFCSToSqm() {
    const fn = AgriUnits.fcsToSqm.bind(AgriUnits);

    this.assert('fcsToSqm(0, 0, 0, 168)',  fn(0, 0, 0, 168),  0);
    this.assert('fcsToSqm(0, 1, 0, 168)',  fn(0, 1, 0, 168),  168);
    this.assert('fcsToSqm(1, 0, 0, 168)',  fn(1, 0, 0, 168),  4032);
    this.assert('fcsToSqm(0, 0, 12, 168)', fn(0, 0, 12, 168), 84);
    this.assert('fcsToSqm(0, 1, 12, 168)', fn(0, 1, 12, 168), 252);
    this.assert('fcsToSqm(1, 1, 12, 168)', fn(1, 1, 12, 168), 4284);

    // اختبار الدائرة الكاملة: sqm → FCS → sqm
    const inputs = [168, 4032, 1000, 2500, 7777];
    inputs.forEach(sqm => {
      const fcs  = AgriUnits.sqmToFCS(sqm, 168);
      const back = AgriUnits.fcsToSqm(fcs.feddan, fcs.carat, fcs.sahm, 168);
      this.assert(`roundtrip sqm→FCS→sqm(${sqm})`, back, sqm, 0.1);
    });
  },

  // ============================================================
  // اختبارات sahmsToFCS (مطابقة Page10)
  // ============================================================
  testSahmsToFCS() {
    const fn = AgriUnits.sahmsToFCS.bind(AgriUnits);

    // من Page10: { acre, carat, shares, isNegative, prefix }
    this.assert('sahmsToFCS(0)',
      fn(0), { acre: 0, carat: 0, shares: 0, isNegative: false, prefix: '' });
    this.assert('sahmsToFCS(576) = 1 فدان',
      fn(576), { acre: 1, carat: 0, shares: 0, isNegative: false, prefix: '' });
    this.assert('sahmsToFCS(24) = 1 قيراط',
      fn(24),  { acre: 0, carat: 1, shares: 0, isNegative: false, prefix: '' });
    this.assert('sahmsToFCS(1) = 1 سهم',
      fn(1),   { acre: 0, carat: 0, shares: 1, isNegative: false, prefix: '' });
    this.assert('sahmsToFCS(600) = 1ف + 1ق',
      fn(600), { acre: 1, carat: 1, shares: 0, isNegative: false, prefix: '' });
    this.assert('sahmsToFCS(-24) = -1 قيراط',
      fn(-24), { acre: 0, carat: 1, shares: 0, isNegative: true, prefix: '-' });

    // مقارنة مع sahmsToUnits الأصلية في Page10:
    // sahmsToUnits(601):
    //   abs = 601, acre = floor(601/576) = 1
    //   remaining = 601 % 576 = 25
    //   carat = floor(25/24) = 1
    //   shares = 25 % 24 = 1
    this.assert('sahmsToFCS(601) matches Page10 original',
      fn(601), { acre: 1, carat: 1, shares: 1, isNegative: false, prefix: '' });
  },

  // ============================================================
  // اختبارات fcsToSahms (عكس sahmsToFCS)
  // ============================================================
  testFCSToSahms() {
    const fn = AgriUnits.fcsToSahms.bind(AgriUnits);

    this.assert('fcsToSahms(0, 0, 0)', fn(0, 0, 0), 0);
    this.assert('fcsToSahms(1, 0, 0)', fn(1, 0, 0), 576);
    this.assert('fcsToSahms(0, 1, 0)', fn(0, 1, 0), 24);
    this.assert('fcsToSahms(0, 0, 1)', fn(0, 0, 1), 1);
    this.assert('fcsToSahms(1, 1, 1)', fn(1, 1, 1), 601);

    // اختبار الدائرة الكاملة
    [0, 1, 24, 576, 601, 1000].forEach(sahms => {
      const fcs  = AgriUnits.sahmsToFCS(sahms);
      const back = AgriUnits.fcsToSahms(fcs.acre, fcs.carat, fcs.shares);
      this.assert(`roundtrip sahms→FCS→sahms(${sahms})`, back, sahms, 0.001);
    });
  },

  // ============================================================
  // اختبارات totalCaratsToFCS
  // ============================================================
  testTotalCaratsToFCS() {
    const fn = AgriUnits.totalCaratsToFCS.bind(AgriUnits);

    this.assert('totalCaratsToFCS(0)',   fn(0),   { feddan: 0, carat: 0, sahm: 0 });
    this.assert('totalCaratsToFCS(1)',   fn(1),   { feddan: 0, carat: 1, sahm: 0 });
    this.assert('totalCaratsToFCS(24)',  fn(24),  { feddan: 1, carat: 0, sahm: 0 });
    this.assert('totalCaratsToFCS(1.5)',  fn(1.5),  { feddan: 0, carat: 1, sahm: 12 });
    this.assert('totalCaratsToFCS(25.5)', fn(25.5), { feddan: 1, carat: 1, sahm: 12 });

    // مقارنة مع الكود الأصلي في Page11 (السطر 5382-5384):
    // const totalCarats = areaVal / caratArea = 1000/168 = 5.952...
    // feddan = floor(5.952/24) = 0
    // carat = floor(5.952%24) = 5
    // sahm = ((5.952 - (0×24+5))×24).toFixed(4) = (0.952×24).toFixed(4) = 22.8571
    const tc = 1000 / 168; // ≈ 5.9523...
    const res = fn(tc);
    this.assert('totalCaratsToFCS(1000/168) matches Page11',
      res, { feddan: 0, carat: 5, sahm: 22.857 }, 0.01);
  },

  // ============================================================
  // اختبارات normalizeFCS
  // ============================================================
  testNormalizeFCS() {
    const fn = AgriUnits.normalizeFCS.bind(AgriUnits);

    this.assert('normalizeFCS(0,0,0)',   fn(0,0,0),   { feddan: 0, carat: 0, sahm: 0 });
    this.assert('normalizeFCS(0,0,24) → carry to carat',
      fn(0, 0, 24), { feddan: 0, carat: 1, sahm: 0 });
    this.assert('normalizeFCS(0,24,0) → carry to feddan',
      fn(0, 24, 0), { feddan: 1, carat: 0, sahm: 0 });
    this.assert('normalizeFCS(0,25,25) → carry both',
      fn(0, 25, 25), { feddan: 1, carat: 2, sahm: 1 });
    this.assert('normalizeFCS already normalized',
      fn(2, 10, 5), { feddan: 2, carat: 10, sahm: 5 });
  },

  // ============================================================
  // اختبارات trapezoidArea
  // ============================================================
  testTrapezoidArea() {
    const fn = AgriUnits.trapezoidArea.bind(AgriUnits);

    this.assert('trapezoidArea(10,10,20,20) = 200', fn(10,10,20,20), 200);
    this.assert('trapezoidArea(10,12,15,17) = 176', fn(10,12,15,17), 176);
    this.assert('trapezoidArea(0,0,0,0) = 0',       fn(0,0,0,0),   0);
    this.assert('trapezoidArea(5,5,10,10) = 50',    fn(5,5,10,10), 50);

    // مثال حقيقي من Page11:
    // l1=20, l2=18, w1=12, w2=14: avgL=19, avgW=13, area=247
    this.assert('trapezoidArea(20,18,12,14) = 247', fn(20,18,12,14), 247);
  },

  // ============================================================
  // تشغيل جميع الاختبارات
  // ============================================================
  runAll() {
    this.passed = 0;
    this.failed = 0;
    this.results = [];

    console.log('🚀 AgriUnits Tests — Phase 3, Commit 9');
    console.log('─'.repeat(50));

    this.testMetersToQasabaQabda();
    this.testQasabaQabdaToMeters();
    this.testMetersToQasabaSq();
    this.testSqmToFCS();
    this.testSqmToFCSFloor();
    this.testFCSToSqm();
    this.testSahmsToFCS();
    this.testFCSToSahms();
    this.testTotalCaratsToFCS();
    this.testNormalizeFCS();
    this.testTrapezoidArea();

    return this.report();
  }

};

// تصدير للنطاق العام
window.AgriUnitsTests = AgriUnitsTests;

// تشغيل تلقائي إذا كانت الوحدات محمّلة
if (typeof AgriUnits !== 'undefined') {
  console.log('[AgriUnits Tests] Ready — call AgriUnitsTests.runAll() to run');
}
