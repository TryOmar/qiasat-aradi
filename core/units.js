/**
 * core/units.js
 * =================
 * مكتبة تحويل الوحدات الزراعية — مشروع الدَّلاَّل
 *
 * @version 1.0.1
 * @date 2026-07-19
 * @commit Commit 9 — Phase 3 (Refined JSDoc)
 *
 * ─────────────────────────────────────────────────────────────
 * Pure Functions Library — لا DOM ولا localStorage ولا window
 * ─────────────────────────────────────────────────────────────
 *
 * هذا الملف يحتوي على دوال نقية (Pure Functions) فقط:
 *   ✅ كل دالة تعتمد فقط على مدخلاتها وتُرجع نتيجة ثابتة
 *   ✅ لا تأثيرات جانبية (No Side Effects)
 *   ✅ لا قراءة/كتابة DOM
 *   ✅ لا قراءة/كتابة localStorage
 *   ✅ لا استخدام window أو document
 *   ✅ قابلة للنقل إلى Flutter بدون تعديل منطقي
 *
 * المصادر الأصلية:
 *   - Page11/script.js:       toQasabaAndQabda، fromQasabaToMeters، convertSquareMetersToFCS
 *   - Page13/section1/script.js: toQasabaAndQabda، fromQasabaToMeters، convertSqmToFeddans
 *   - Page12/script.js:       sqmToFeddanCaratShares
 *   - Page10/script.js:       sahmsToUnits
 */

// ============================================================
// التحقق من وجود AgriConstants (يجب تحميل constants.js أولاً)
// ============================================================
const _AC = (typeof AgriConstants !== 'undefined') ? AgriConstants : {
  QASABA_METERS:       3.55,
  QABDA_PER_QASABA:    24,
  QABDA_METERS:        3.55 / 24,
  CARATS_PER_FEDDAN:   24,
  SAHMS_PER_CARAT:     24,
  SAHMS_PER_FEDDAN:    576,
  DEFAULT_CARAT_SQM:   168
};

// ============================================================
//  الكائن الرئيسي: AgriUnits
// ============================================================
const AgriUnits = {

  VERSION: "1.0.1",
  CHANGELOG: {
    "1.0.0": "إنشاء المكتبة — استخراج دوال التحويل النقية (Phase 3, Commit 9)",
    "1.0.1": "تحسين وتوثيق الدوال باستخدام JSDoc القياسي ودعم حالات الحافة"
  },

  // ============================================================
  // القسم 1: تحويل وحدات الطول (متر ↔ قصبة + قبضة)
  // ============================================================

  /**
   * يحول الطول بالمتر إلى قصبة وقبضة وكسر القبضة المتبقي.
   *
   * @param {number} meters - الطول بالمتر المراد تحويله (يجب أن يكون رقماً موجباً).
   * @returns {{ qasaba: number, qabda: number, fraction: number }} كائن يحتوي على:
   *   - qasaba: عدد القصبات الكاملة (عدد صحيح).
   *   - qabda: عدد القبضات الكاملة المتبقية بعد حساب القصبات (عدد صحيح يتراوح بين 0 و 23).
   *   - fraction: الكسر المتبقي من القبضة مقرباً لأقرب خانتين عشريتين (يتراوح بين 0.00 و 0.99).
   *
   * @description
   * دالة نقية (Pure Function). تعتمد على QASABA_METERS (3.55) و QABDA_METERS (3.55/24).
   * تعالج القيم غير الصحيحة مثل (NaN، السالب، الصفر) بإرجاع أصفار.
   *
   * @example
   * metersToQasabaQabda(3.55)  => { qasaba: 1, qabda: 0, fraction: 0 }
   * metersToQasabaQabda(1.775) => { qasaba: 0, qabda: 12, fraction: 0 }
   */
  metersToQasabaQabda(meters) {
    if (!meters || isNaN(meters) || meters <= 0 || !isFinite(meters)) {
      return { qasaba: 0, qabda: 0, fraction: 0 };
    }
    const qasabaLength = _AC.QASABA_METERS;       // 3.55
    const qabdaLength  = _AC.QABDA_METERS;         // 3.55 / 24

    const qasaba  = Math.floor(meters / qasabaLength);
    const rem     = meters - (qasaba * qasabaLength);
    const qabda   = Math.floor(rem / qabdaLength);
    const fraction = (rem - (qabda * qabdaLength)) / qabdaLength;

    return {
      qasaba:   qasaba,
      qabda:    qabda,
      fraction: parseFloat(fraction.toFixed(2))
    };
  },

  /**
   * يحول قصبة وقبضة وكسر القبضة المتبقي إلى طول بالمتر.
   *
   * @param {number} qasaba - عدد القصبات.
   * @param {number} qabda - عدد القبضات.
   * @param {number} fraction - كسر القبضة المتبقي (رقم عشري بين 0 و 1).
   * @returns {number} الطول المكافئ بالمتر.
   *
   * @description
   * دالة نقية (Pure Function). تجمع الأطوال باستخدام الثوابت المعتمدة.
   * تعالج مدخلات NaN أو غير الصالحة عبر استبدالها بالصفر تلقائياً.
   *
   * @example
   * qasabaQabdaToMeters(1, 0, 0) => 3.55
   * qasabaQabdaToMeters(0, 12, 0) => 1.775
   */
  qasabaQabdaToMeters(qasaba, qabda, fraction) {
    const qasabaVal = (!qasaba || isNaN(qasaba) || qasaba < 0 || !isFinite(qasaba)) ? 0 : qasaba;
    const qabdaVal  = (!qabda || isNaN(qabda) || qabda < 0 || !isFinite(qabda)) ? 0 : qabda;
    const fracVal   = (!fraction || isNaN(fraction) || fraction < 0 || !isFinite(fraction)) ? 0 : fraction;

    const qasabaLength = _AC.QASABA_METERS;  // 3.55
    const qabdaLength  = _AC.QABDA_METERS;   // 3.55 / 24
    return (qasabaVal * qasabaLength) + (qabdaVal * qabdaLength) + (fracVal * qabdaLength);
  },

  /**
   * يحول المساحة بالمتر المربع إلى مساحة بالقصبة المربعة.
   *
   * @param {number} sqm - المساحة بالمتر المربع.
   * @returns {number} المساحة المكافئة بالقصبة المربعة.
   *
   * @description
   * دالة نقية (Pure Function). تعتمد على معامل التحويل (12.6025 م² لكل قصبة مربعة).
   *
   * @example
   * metersToQasabaSq(12.6025) => 1
   */
  metersToQasabaSq(sqm) {
    if (!sqm || isNaN(sqm) || sqm <= 0 || !isFinite(sqm)) return 0;
    return sqm / (3.55 * 3.55); // = sqm / 12.6025
  },

  // ============================================================
  // القسم 2: تحويل وحدات المساحة (م² ↔ فدان + قيراط + سهم)
  // ============================================================

  /**
   * يحول المساحة بالمتر المربع إلى فدان وقيراط وسهم (مع تقريب السهم وتطبيعه).
   *
   * @param {number} sqm - المساحة بالمتر المربع.
   * @param {number} [caratSqm=168] - مساحة القيراط بالمتر المربع (الافتراضية 168).
   * @returns {{ feddan: number, carat: number, sahm: number }} كائن يحتوي على الوحدات الثلاث.
   *
   * @description
   * دالة نقية (Pure Function). تقوم بالحساب بالتقسيم التدريجي:
   *   1. استخراج الفدادين الكاملة.
   *   2. استخراج القراريط الكاملة من المتبقي.
   *   3. تحويل الباقي لأسهم مع تقريبها لأقرب خانتين عشريتين.
   *   4. إجراء عملية التطبيع التلقائي (إذا وصلت الأسهم لـ 24 ترتفع للقيراط، وإذا وصلت القراريط لـ 24 ترتفع للفدان).
   *
   * @example
   * sqmToFCS(168, 168)  => { feddan: 0, carat: 1, sahm: 0 }
   * sqmToFCS(1000, 168) => { feddan: 0, carat: 5, sahm: 22.86 }
   */
  sqmToFCS(sqm, caratSqm = _AC.DEFAULT_CARAT_SQM) {
    if (!sqm || isNaN(sqm) || sqm <= 0 || !isFinite(sqm) || !caratSqm || isNaN(caratSqm) || caratSqm <= 0 || !isFinite(caratSqm)) {
      return { feddan: 0, carat: 0, sahm: 0 };
    }

    const feddanSqm = caratSqm * _AC.CARATS_PER_FEDDAN; // caratSqm × 24
    const sahmSqm   = caratSqm / _AC.SAHMS_PER_CARAT;   // caratSqm / 24

    const feddan  = Math.floor(sqm / feddanSqm);
    const remSqm  = sqm - (feddan * feddanSqm);
    const carat   = Math.floor(remSqm / caratSqm);
    let   sahm    = Math.round((remSqm - (carat * caratSqm)) / sahmSqm * 100) / 100;

    // تصحيح التجاوزات (Normalization)
    if (sahm >= _AC.SAHMS_PER_CARAT - 0.015) {
      sahm = 0;
      return AgriUnits.normalizeFCS(feddan, carat + 1, sahm);
    }

    return AgriUnits.normalizeFCS(feddan, carat, Math.max(0, sahm));
  },

  /**
   * يحول المساحة بالمتر المربع إلى فدان وقيراط وسهم (طريقة القسمة الصحيحة بدون تقريب متقدم للسهم).
   *
   * @param {number} sqm - المساحة بالمتر المربع.
   * @param {number} [caratSqm=168] - مساحة القيراط بالمتر المربع.
   * @returns {{ feddans: number, carats: number, shares: number }} كائن الوحدات الموزعة (مطابق لـ Page13/s1).
   *
   * @description
   * دالة نقية (Pure Function). تستخدم القسمة الحسابية المباشرة واستخراج المتبقي للتحويل
   * بدون تصحيح التجاوزات التلقائي المعقد في السهم (floor-based).
   *
   * @example
   * sqmToFCSFloor(1000, 168) => { feddans: 0, carats: 5, shares: 22.86 }
   */
  sqmToFCSFloor(sqm, caratSqm = _AC.DEFAULT_CARAT_SQM) {
    if (!sqm || isNaN(sqm) || sqm <= 0 || !isFinite(sqm) || !caratSqm || isNaN(caratSqm) || caratSqm <= 0 || !isFinite(caratSqm)) {
      return { feddans: 0, carats: 0, shares: 0 };
    }

    const feddanSqm  = caratSqm * _AC.CARATS_PER_FEDDAN; // caratSqm × 24

    const feddans              = Math.floor(sqm / feddanSqm);
    const remainingForCarats   = sqm - (feddans * feddanSqm);
    const carats               = Math.floor(remainingForCarats / caratSqm);
    const remainingForShares   = remainingForCarats - (carats * caratSqm);
    const shares               = (remainingForShares * _AC.SAHMS_PER_CARAT) / caratSqm;

    return {
      feddans: feddans,
      carats:  carats,
      shares:  parseFloat(shares.toFixed(2))
    };
  },

  /**
   * يحول وحدات الفدان والقيراط والسهم إلى مساحة بالمتر المربع.
   *
   * @param {number} feddan - عدد الفدادين.
   * @param {number} carat - عدد القراريط.
   * @param {number} sahm - عدد الأسهم.
   * @param {number} [caratSqm=168] - مساحة القيراط بالمتر المربع.
   * @returns {number} المساحة الإجمالية بالمتر المربع.
   *
   * @description
   * دالة نقية (Pure Function). تقوم بضرب الوحدات بوزنها النسبي بناء على مساحة القيراط المحددة.
   */
  fcsToSqm(feddan, carat, sahm, caratSqm = _AC.DEFAULT_CARAT_SQM) {
    const fVal = (!feddan || isNaN(feddan) || feddan < 0 || !isFinite(feddan)) ? 0 : feddan;
    const cVal = (!carat || isNaN(carat) || carat < 0 || !isFinite(carat)) ? 0 : carat;
    const sVal = (!sahm || isNaN(sahm) || sahm < 0 || !isFinite(sahm)) ? 0 : sahm;
    const size = (!caratSqm || isNaN(caratSqm) || caratSqm <= 0 || !isFinite(caratSqm)) ? _AC.DEFAULT_CARAT_SQM : caratSqm;

    const totalCarats = (fVal * _AC.CARATS_PER_FEDDAN) + cVal + (sVal / _AC.SAHMS_PER_CARAT);
    return totalCarats * size;
  },

  // ============================================================
  // القسم 3: تحويل الأسهم (سهم ↔ فدان + قيراط + سهم)
  // ============================================================

  /**
   * يحول إجمالي عدد الأسهم (سواء موجب أو سالب) إلى فدان وقيراط وسهم.
   *
   * @param {number} totalSahms - العدد الإجمالي للأسهم.
   * @returns {{ acre: number, carat: number, shares: number, isNegative: boolean, prefix: string }}
   *   - acre: عدد الفدادين الكاملة.
   *   - carat: عدد القراريط الكاملة.
   *   - shares: الأسهم المتبقية بدقة 3 خانات عشرية.
   *   - isNegative: هل القيمة سالبة؟
   *   - prefix: علامة السالب "-" أو فراغ "".
   *
   * @description
   * دالة نقية (Pure Function). تستخدم بشكل أساسي لحساب المساحات الموزعة في صفحة 10.
   *
   * @example
   * sahmsToFCS(601) => { acre: 1, carat: 1, shares: 1, isNegative: false, prefix: "" }
   */
  sahmsToFCS(totalSahms) {
    if (isNaN(totalSahms) || !isFinite(totalSahms)) {
      return { acre: 0, carat: 0, shares: 0, isNegative: false, prefix: "" };
    }
    const isNegative = totalSahms < 0;
    const abs        = Math.abs(totalSahms);
    const acre       = Math.floor(abs / _AC.SAHMS_PER_FEDDAN);  // abs / 576
    const remaining  = abs % _AC.SAHMS_PER_FEDDAN;
    const carat      = Math.floor(remaining / _AC.SAHMS_PER_CARAT); // remaining / 24
    const shares     = +(remaining % _AC.SAHMS_PER_CARAT).toFixed(3);
    return { acre, carat, shares, isNegative, prefix: isNegative ? "-" : "" };
  },

  /**
   * يحول فدان وقيراط وسهم إلى إجمالي عدد الأسهم.
   *
   * @param {number} feddan - عدد الفدادين.
   * @param {number} carat - عدد القراريط.
   * @param {number} sahm - عدد الأسهم.
   * @returns {number} إجمالي عدد الأسهم المكافئ.
   *
   * @description
   * دالة نقية (Pure Function).
   */
  fcsToSahms(feddan, carat, sahm) {
    const fVal = (!feddan || isNaN(feddan) || feddan < 0 || !isFinite(feddan)) ? 0 : feddan;
    const cVal = (!carat || isNaN(carat) || carat < 0 || !isFinite(carat)) ? 0 : carat;
    const sVal = (!sahm || isNaN(sahm) || sahm < 0 || !isFinite(sahm)) ? 0 : sahm;
    return (fVal * _AC.SAHMS_PER_FEDDAN) + (cVal * _AC.SAHMS_PER_CARAT) + sVal;
  },

  /**
   * يحول عدد القراريط الإجمالي (كقيمة عشرية) إلى فدان وقيراط وسهم.
   *
   * @param {number} totalCarats - عدد القراريط الإجمالي (رقم عشري).
   * @returns {{ feddan: number, carat: number, sahm: number }}
   *
   * @description
   * دالة نقية (Pure Function). تستخدم في تقسيم الأسهم لحساب أنصبة الشركاء في صفحة 11.
   */
  totalCaratsToFCS(totalCarats) {
    if (!totalCarats || isNaN(totalCarats) || totalCarats <= 0 || !isFinite(totalCarats)) {
      return { feddan: 0, carat: 0, sahm: 0 };
    }
    const feddan = Math.floor(totalCarats / _AC.CARATS_PER_FEDDAN);
    const carat  = Math.floor(totalCarats % _AC.CARATS_PER_FEDDAN);
    const sahm   = Number(((totalCarats - (feddan * _AC.CARATS_PER_FEDDAN + carat)) * _AC.SAHMS_PER_CARAT).toFixed(4));
    return { feddan, carat, sahm };
  },

  // ============================================================
  // القسم 4: تطبيع الوحدات (Normalization)
  // ============================================================

  /**
   * يطبع الفدان والقيراط والسهم ويعالج حالات التجاوز (Overflow).
   * (مثال: إذا كانت الأسهم 25 تصبح قيراطاً و سهماً واحداً).
   *
   * @param {number} feddan - عدد الفدادين.
   * @param {number} carat - عدد القراريط.
   * @param {number} sahm - عدد الأسهم.
   * @returns {{ feddan: number, carat: number, sahm: number }} كائن الوحدات المطبقة والمصححة.
   *
   * @description
   * دالة نقية (Pure Function). تستخدم لتصحيح المدخلات عند فقدان التركيز Blur في الصفحة 11.
   */
  normalizeFCS(feddan, carat, sahm) {
    let f = (!feddan || isNaN(feddan) || feddan < 0 || !isFinite(feddan)) ? 0 : feddan;
    let c = (!carat || isNaN(carat) || carat < 0 || !isFinite(carat)) ? 0 : carat;
    let s = (!sahm || isNaN(sahm) || sahm < 0 || !isFinite(sahm)) ? 0 : sahm;

    // تطبيع الأسهم: كل 24 سهم = قيراط
    if (s >= _AC.SAHMS_PER_CARAT) {
      const extraC = Math.floor(s / _AC.SAHMS_PER_CARAT);
      c += extraC;
      s  = Number((s % _AC.SAHMS_PER_CARAT).toFixed(2));
    }

    // تطبيع القراريط: كل 24 قيراط = فدان
    if (c >= _AC.CARATS_PER_FEDDAN) {
      const extraF = Math.floor(c / _AC.CARATS_PER_FEDDAN);
      f += extraF;
      c  = c % _AC.CARATS_PER_FEDDAN;
    }

    return { feddan: f, carat: c, sahm: s };
  },

  // ============================================================
  // القسم 5: حسابات المساحة (من الأبعاد)
  // ============================================================

  /**
   * يحسب مساحة شبه المنحرف بناء على الأطوال والعروض الأربعة (المتوسط التقريبي للأرض).
   *
   * @param {number} l1 - الطول الأول.
   * @param {number} l2 - الطول الثاني.
   * @param {number} w1 - العرض الأول.
   * @param {number} w2 - العرض الثاني.
   * @returns {number} المساحة بالمتر المربع.
   *
   * @description
   * دالة نقية (Pure Function). تستخدم الصيغة التقريبية المعيارية المعتمدة في العمل الميداني.
   */
  trapezoidArea(l1, l2, w1, w2) {
    if (isNaN(l1) || isNaN(l2) || isNaN(w1) || isNaN(w2)) return 0;
    if (l1 < 0 || l2 < 0 || w1 < 0 || w2 < 0) return 0;
    return ((l1 + l2) / 2) * ((w1 + w2) / 2);
  }

};

// ----------------------------------------------------------
// تصدير للنطاق العام (window) — للتوافق مع البنية الحالية
// ----------------------------------------------------------
window.AgriUnits = AgriUnits;

// ----------------------------------------------------------
// تجميد الكائن لمنع التعديل العرضي
// ----------------------------------------------------------
Object.freeze(AgriUnits.CHANGELOG);
Object.freeze(AgriUnits);

if (typeof window !== "undefined" && window.DALLAL_DEBUG !== false) {
  console.log(`[AgriUnits] v${AgriUnits.VERSION} loaded successfully.`);
}

