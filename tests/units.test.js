/**
 * tests/units.test.js
 * ===================
 * اختبارات التحقق لمكتبة AgriUnits
 * Commit 9 — Phase 3 (Refined for Edge Cases)
 *
 * كيفية التشغيل:
 *   افتح أي صفحة HTML تحتوي على constants.js + units.js
 *   ثم أضف هذا الملف، واستدع AgriUnitsTests.runAll()
 *   أو شغّل في Console المتصفح بعد تحميل الصفحتين.
 *
 * يحتوي هذا الملف على اختبارات للقيم العادية والقيم الحدية (Edge Cases):
 *   - الصفر (0)
 *   - الأعداد السالبة
 *   - القيم غير المحدودة (Infinity / -Infinity)
 *   - القيمة غير الرقمية (NaN)
 *   - الأرقام الكبيرة جداً والصغيرة جداً
 *   - الكسور العشرية الطويلة جداً
 */

const AgriUnitsTests = {

  passed: 0,
  failed: 0,
  results: [],

  // ─── أداة المقارنة ──────────────────────────────────────────
  assert(testName, actual, expected, tolerance = 0.001) {
    let pass = false;

    if (expected === null || expected === undefined) {
      pass = (actual === expected);
    } else if (typeof expected === 'object') {
      // مقارنة كائنات
      pass = Object.keys(expected).every(k => {
        const a = actual[k];
        const e = expected[k];
        if (isNaN(a) && isNaN(e)) return true;
        if (!isFinite(a) && !isFinite(e)) return a === e;
        return Math.abs(Number(a) - Number(e)) <= tolerance;
      });
    } else {
      if (isNaN(actual) && isNaN(expected)) {
        pass = true;
      } else if (!isFinite(actual) && !isFinite(expected)) {
        pass = (actual === expected);
      } else {
        pass = Math.abs(Number(actual) - Number(expected)) <= tolerance;
      }
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
    console.group('📊 AgriUnits Test Report — Phase 3, Commit 9 (Edge Cases Added)');
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

    // ─── حالات الحافة ───
    this.assert('metersToQasabaQabda(0)',     fn(0),     { qasaba: 0, qabda: 0, fraction: 0 });
    this.assert('metersToQasabaQabda(null)',  fn(null),  { qasaba: 0, qabda: 0, fraction: 0 });
    this.assert('metersToQasabaQabda(-1)',    fn(-1),    { qasaba: 0, qabda: 0, fraction: 0 });
    this.assert('metersToQasabaQabda(NaN)',   fn(NaN),   { qasaba: 0, qabda: 0, fraction: 0 });
    this.assert('metersToQasabaQabda(Infinity)', fn(Infinity), { qasaba: 0, qabda: 0, fraction: 0 });
    this.assert('metersToQasabaQabda(-Infinity)', fn(-Infinity), { qasaba: 0, qabda: 0, fraction: 0 });

    // قواسم عادية
    this.assert('metersToQasabaQabda(3.55)',  fn(3.55),  { qasaba: 1, qabda: 0, fraction: 0 });
    this.assert('metersToQasabaQabda(7.10)',  fn(7.10),  { qasaba: 2, qabda: 0, fraction: 0 });
    this.assert('metersToQasabaQabda(1.775)', fn(1.775), { qasaba: 0, qabda: 12, fraction: 0 });
    this.assert('metersToQasabaQabda(4.4375)', fn(4.4375), { qasaba: 1, qabda: 6, fraction: 0 });

    // أرقام صغيرة جداً وكبيرة جداً
    this.assert('metersToQasabaQabda(0.00001)', fn(0.00001), { qasaba: 0, qabda: 0, fraction: 0.07 });
    this.assert('metersToQasabaQabda(355000)', fn(355000), { qasaba: 100000, qabda: 0, fraction: 0 });

    // كسور عشرية طويلة جداً
    this.assert('metersToQasabaQabda(3.550000000001)', fn(3.550000000001), { qasaba: 1, qabda: 0, fraction: 0 });
  },

  // ============================================================
  // اختبارات qasabaQabdaToMeters
  // ============================================================
  testQasabaQabdaToMeters() {
    const fn = AgriUnits.qasabaQabdaToMeters.bind(AgriUnits);

    // ─── حالات الحافة ───
    this.assert('qasabaQabdaToMeters(0, 0, 0)',   fn(0, 0, 0),   0);
    this.assert('qasabaQabdaToMeters(-1, -2, -0.5)', fn(-1, -2, -0.5), 0);
    this.assert('qasabaQabdaToMeters(NaN, 1, 0)', fn(NaN, 1, 0), 3.55/24);
    this.assert('qasabaQabdaToMeters(Infinity, 0, 0)', fn(Infinity, 0, 0), 0);

    // قيم عادية
    this.assert('qasabaQabdaToMeters(1, 0, 0)',   fn(1, 0, 0),   3.55);
    this.assert('qasabaQabdaToMeters(0, 12, 0)',  fn(0, 12, 0),  1.775);
    this.assert('qasabaQabdaToMeters(1, 6, 0)',   fn(1, 6, 0),   4.4375);

    // كسور طويلة
    this.assert('qasabaQabdaToMeters(0, 0, 0.3333333333333)', fn(0, 0, 0.3333333333333), (0.3333333333333 * (3.55/24)));
  },

  // ============================================================
  // اختبارات metersToQasabaSq
  // ============================================================
  testMetersToQasabaSq() {
    const fn = AgriUnits.metersToQasabaSq.bind(AgriUnits);

    // ─── حالات الحافة ───
    this.assert('metersToQasabaSq(0)',       fn(0),       0);
    this.assert('metersToQasabaSq(-5)',      fn(-5),      0);
    this.assert('metersToQasabaSq(NaN)',     fn(NaN),     0);
    this.assert('metersToQasabaSq(Infinity)', fn(Infinity), 0);

    // قيم عادية
    this.assert('metersToQasabaSq(12.6025)', fn(12.6025), 1.0);
    this.assert('metersToQasabaSq(25.205)',  fn(25.205),  2.0);
  },

  // ============================================================
  // اختبارات sqmToFCS
  // ============================================================
  testSqmToFCS() {
    const fn = AgriUnits.sqmToFCS.bind(AgriUnits);

    // ─── حالات الحافة ───
    this.assert('sqmToFCS(0, 168)',     fn(0, 168),     { feddan: 0, carat: 0, sahm: 0 });
    this.assert('sqmToFCS(-100, 168)',  fn(-100, 168),  { feddan: 0, carat: 0, sahm: 0 });
    this.assert('sqmToFCS(NaN, 168)',   fn(NaN, 168),   { feddan: 0, carat: 0, sahm: 0 });
    this.assert('sqmToFCS(100, NaN)',   fn(100, NaN),   { feddan: 0, carat: 0, sahm: 0 });
    this.assert('sqmToFCS(Infinity, 168)', fn(Infinity, 168), { feddan: 0, carat: 0, sahm: 0 });
    this.assert('sqmToFCS(100, Infinity)', fn(100, Infinity), { feddan: 0, carat: 0, sahm: 0 });

    // قيم عادية
    this.assert('sqmToFCS(168, 168) = 1ق', fn(168, 168), { feddan: 0, carat: 1, sahm: 0 });
    this.assert('sqmToFCS(4032, 168) = 1ف', fn(4032, 168), { feddan: 1, carat: 0, sahm: 0 });
    this.assert('sqmToFCS(84, 168) = 12س', fn(84, 168), { feddan: 0, carat: 0, sahm: 12 });
  },

  // ============================================================
  // اختبارات sahmsToFCS
  // ============================================================
  testSahmsToFCS() {
    const fn = AgriUnits.sahmsToFCS.bind(AgriUnits);

    // ─── حالات الحافة ───
    this.assert('sahmsToFCS(NaN)', fn(NaN), { acre: 0, carat: 0, shares: 0, isNegative: false, prefix: '' });
    this.assert('sahmsToFCS(Infinity)', fn(Infinity), { acre: 0, carat: 0, shares: 0, isNegative: false, prefix: '' });

    // قيم عادية
    this.assert('sahmsToFCS(576)', fn(576), { acre: 1, carat: 0, shares: 0, isNegative: false, prefix: '' });
    this.assert('sahmsToFCS(-24)', fn(-24), { acre: 0, carat: 1, shares: 0, isNegative: true, prefix: '-' });
  },

  // ============================================================
  // اختبارات trapezoidArea
  // ============================================================
  testTrapezoidArea() {
    const fn = AgriUnits.trapezoidArea.bind(AgriUnits);

    // ─── حالات الحافة ───
    this.assert('trapezoidArea(NaN, 10, 10, 10)', fn(NaN, 10, 10, 10), 0);
    this.assert('trapezoidArea(-5, 10, 10, 10)', fn(-5, 10, 10, 10), 0);

    // قيم عادية
    this.assert('trapezoidArea(10,10,20,20)', fn(10,10,20,20), 200);
  },

  // ============================================================
  // تشغيل جميع الاختبارات
  // ============================================================
  runAll() {
    this.passed = 0;
    this.failed = 0;
    this.results = [];

    console.log('🚀 AgriUnits Tests — Phase 3, Commit 9 (Edge Cases Added)');
    console.log('─'.repeat(50));

    this.testMetersToQasabaQabda();
    this.testQasabaQabdaToMeters();
    this.testMetersToQasabaSq();
    this.testSqmToFCS();
    this.testSahmsToFCS();
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
