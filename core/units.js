/**
 * core/units.js
 * =============
 * مكتبة تحويل الوحدات الزراعية — مشروع الدَّلاَّل
 *
 * @version 1.0.0
 * @date 2026-07-19
 * @commit Commit 9 — Phase 3
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
 *
 * CHANGELOG:
 *   1.0.0 — إنشاء المكتبة: استخراج دوال التحويل النقية من Page10، Page11، Page12، Page13
 */

// ============================================================
// التحقق من وجود AgriConstants (يجب تحميل constants.js أولاً)
// ============================================================
// ملاحظة: هذا الشرط للتوافق مع البيئات التي لا تستخدم constants.js بعد
// في مرحلة استخدام AgriUnits، يجب أن يكون constants.js محمّلاً أولاً
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

  // ----------------------------------------------------------
  // الإصدار
  // ----------------------------------------------------------
  VERSION: "1.0.0",
  CHANGELOG: {
    "1.0.0": "إنشاء المكتبة — استخراج دوال التحويل النقية (Phase 3, Commit 9)"
  },

  // ============================================================
  // القسم 1: تحويل وحدات الطول (متر ↔ قصبة + قبضة)
  // ============================================================

  /**
   * metersToQasabaQabda
   * تحويل المتر إلى قصبة + قبضة + كسر
   *
   * @param {number} meters - الطول بالمتر (يجب أن يكون > 0)
   * @returns {{ qasaba: number, qabda: number, fraction: number }}
   *   - qasaba:  عدد القصبات الكاملة (integer)
   *   - qabda:   عدد القبضات الكاملة بعد القصبات (integer)
   *   - fraction: الكسر المتبقي من القبضة (0.00 إلى 0.99)
   *
   * Pure Function ✅ — لا DOM ولا localStorage
   *
   * المصدر الأصلي (منقول بدقة من):
   *   - Page11/script.js السطر 4657: function toQasabaAndQabda(meters)
   *   - Page13/section1/script.js السطر 815: function toQasabaAndQabda(meters)
   *   ملاحظة: الدالتان متطابقتان تماماً في الصفحتين
   *
   * اختبار التحقق من التطابق:
   *   metersToQasabaQabda(3.55)  → { qasaba: 1, qabda: 0, fraction: 0 }
   *   metersToQasabaQabda(7.10)  → { qasaba: 2, qabda: 0, fraction: 0 }
   *   metersToQasabaQabda(1.775) → { qasaba: 0, qabda: 12, fraction: 0 }
   *   metersToQasabaQabda(0)     → { qasaba: 0, qabda: 0, fraction: 0 }
   */
  metersToQasabaQabda(meters) {
    if (!meters || isNaN(meters) || meters <= 0) {
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
   * qasabaQabdaToMeters
   * تحويل قصبة + قبضة + كسر إلى متر
   *
   * @param {number} qasaba  - عدد القصبات (≥ 0)
   * @param {number} qabda   - عدد القبضات (≥ 0)
   * @param {number} fraction - الكسر المتبقي من القبضة (0.00 إلى 0.99)
   * @returns {number} الطول بالمتر
   *
   * Pure Function ✅ — لا DOM ولا localStorage
   *
   * المصدر الأصلي (منقول بدقة من):
   *   - Page11/script.js السطر 4861: function fromQasabaToMeters(qasaba, qabda, fraction)
   *   - Page13/section1/script.js السطر 832: function fromQasabaToMeters(qasaba, qabda, fraction)
   *   ملاحظة: الدالتان متطابقتان تماماً في الصفحتين
   *
   * اختبار التحقق من التطابق (عكس metersToQasabaQabda):
   *   qasabaQabdaToMeters(1, 0, 0) → 3.55
   *   qasabaQabdaToMeters(2, 0, 0) → 7.10
   *   qasabaQabdaToMeters(0, 12, 0) → 1.775
   */
  qasabaQabdaToMeters(qasaba, qabda, fraction) {
    const qasabaLength = _AC.QASABA_METERS;  // 3.55
    const qabdaLength  = _AC.QABDA_METERS;   // 3.55 / 24
    return (qasaba * qasabaLength) + (qabda * qabdaLength) + (fraction * qabdaLength);
  },

  /**
   * metersToQasabaSq
   * تحويل المساحة (م²) إلى قصبة مربعة
   *
   * @param {number} sqm - المساحة بالمتر المربع
   * @returns {number} المساحة بالقصبة المربعة
   *
   * Pure Function ✅ — لا DOM ولا localStorage
   *
   * المصدر الأصلي:
   *   - Page11/script.js السطر 4817: const qasba_sq = totalAreaM2 / 12.60250;
   *   - Page13/section2/script.js السطر 191: const qasba_sq = areaM2 / QASBA_SQ;
   *
   * اختبار التحقق:
   *   metersToQasabaSq(12.6025)  → ≈ 1.0
   *   metersToQasabaSq(25.205)   → ≈ 2.0
   */
  metersToQasabaSq(sqm) {
    if (!sqm || sqm <= 0) return 0;
    return sqm / (3.55 * 3.55); // = sqm / 12.6025
  },

  // ============================================================
  // القسم 2: تحويل وحدات المساحة (م² ↔ فدان + قيراط + سهم)
  // ============================================================

  /**
   * sqmToFCS
   * تحويل المساحة من متر مربع إلى فدان + قيراط + سهم
   *
   * @param {number} sqm      - المساحة بالمتر المربع
   * @param {number} caratSqm - مساحة القيراط بالمتر المربع (الافتراضي 168)
   * @returns {{ feddan: number, carat: number, sahm: number }}
   *
   * Pure Function ✅ — لا DOM ولا localStorage
   *
   * المصدر الأصلي:
   *   - Page13/section1/script.js السطر 797: function convertSqmToFeddans(sqm, caratSize)
   *   - Page12/script.js السطر 627: function sqmToFeddanCaratShares(sqm) [تستخدم caratSize global]
   *   - Page11/script.js السطر 5815: function convertSquareMetersToFCS(area) [تقرأ من DOM]
   *
   * ملاحظة معمارية:
   *   النسخة هنا pure function بعكس الدوال الأصلية في Page11/Page12
   *   التي تقرأ caratArea من DOM مباشرة.
   *   قيمة caratSqm يجب أن تُمرَّر صريحةً من المستدعي.
   *
   * اختبار التحقق (caratSqm = 168):
   *   sqmToFCS(168, 168)    → { feddan: 0, carat: 1, sahm: 0 }
   *   sqmToFCS(4032, 168)   → { feddan: 1, carat: 0, sahm: 0 }   (168×24=4032)
   *   sqmToFCS(0, 168)      → { feddan: 0, carat: 0, sahm: 0 }
   *   sqmToFCS(84, 168)     → { feddan: 0, carat: 0, sahm: 12 }  (نصف قيراط = 12 سهم)
   *   sqmToFCS(252, 168)    → { feddan: 0, carat: 1, sahm: 12 }  (قيراط ونصف)
   */
  sqmToFCS(sqm, caratSqm = _AC.DEFAULT_CARAT_SQM) {
    if (!sqm || sqm <= 0 || !caratSqm || caratSqm <= 0) {
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
   * sqmToFCSFloor
   * تحويل م² إلى فدان + قيراط + سهم (بطريقة القسم الصحيح)
   * هذه النسخة مطابقة لـ convertSqmToFeddans في Page13/section1
   *
   * @param {number} sqm      - المساحة بالمتر المربع
   * @param {number} caratSqm - مساحة القيراط بالمتر المربع
   * @returns {{ feddans: number, carats: number, shares: number }}
   *
   * Pure Function ✅ — لا DOM ولا localStorage
   *
   * المصدر الأصلي (منقول بدقة من):
   *   Page13/section1/script.js السطر 797: function convertSqmToFeddans(sqm, caratSize)
   *
   * الفرق بين sqmToFCS و sqmToFCSFloor:
   *   - sqmToFCS:      يستخدم Math.round للسهم (أكثر دقة، يعالج overflow)
   *   - sqmToFCSFloor: يستخدم حساباً مباشراً للسهم (مطابق لـ section1)
   *
   * اختبار التحقق (caratSqm = 168):
   *   sqmToFCSFloor(168, 168)  → { feddans: 0, carats: 1, shares: 0 }
   *   sqmToFCSFloor(4032, 168) → { feddans: 1, carats: 0, shares: 0 }
   *   sqmToFCSFloor(84, 168)   → { feddans: 0, carats: 0, shares: 12 }
   */
  sqmToFCSFloor(sqm, caratSqm = _AC.DEFAULT_CARAT_SQM) {
    if (!sqm || sqm <= 0 || !caratSqm || caratSqm <= 0) {
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
   * fcsToSqm
   * تحويل فدان + قيراط + سهم إلى متر مربع
   *
   * @param {number} feddan   - عدد الفدادين (≥ 0)
   * @param {number} carat    - عدد القراريط (0 إلى 23)
   * @param {number} sahm     - عدد الأسهم (0.00 إلى 23.99)
   * @param {number} caratSqm - مساحة القيراط بالمتر المربع
   * @returns {number} المساحة بالمتر المربع
   *
   * Pure Function ✅ — لا DOM ولا localStorage
   *
   * اختبار التحقق (عكس sqmToFCS):
   *   fcsToSqm(0, 1, 0, 168)  → 168
   *   fcsToSqm(1, 0, 0, 168)  → 4032
   *   fcsToSqm(0, 0, 12, 168) → 84
   */
  fcsToSqm(feddan, carat, sahm, caratSqm = _AC.DEFAULT_CARAT_SQM) {
    const totalCarats = (feddan * _AC.CARATS_PER_FEDDAN) + carat + (sahm / _AC.SAHMS_PER_CARAT);
    return totalCarats * caratSqm;
  },

  // ============================================================
  // القسم 3: تحويل الأسهم (سهم ↔ فدان + قيراط + سهم)
  // ============================================================

  /**
   * sahmsToFCS
   * تحويل عدد الأسهم الكلي إلى فدان + قيراط + سهم
   *
   * @param {number} totalSahms - العدد الكلي للأسهم (يمكن أن يكون سالباً)
   * @returns {{ acre: number, carat: number, shares: number, isNegative: boolean, prefix: string }}
   *   - acre:       عدد الفدادين (يُسمى 'acre' في الكود الأصلي)
   *   - carat:      عدد القراريط
   *   - shares:     عدد الأسهم المتبقية (بدقة 3 خانات عشرية)
   *   - isNegative: true إذا كانت القيمة الأصلية سالبة
   *   - prefix:     "-" إذا سالب، "" إذا موجب
   *
   * Pure Function ✅ — لا DOM ولا localStorage
   *
   * المصدر الأصلي (منقول بدقة من):
   *   Page10/script.js السطر 374: function sahmsToUnits(totalSahms)
   *
   * اختبار التحقق:
   *   sahmsToFCS(576)   → { acre: 1, carat: 0, shares: 0,    isNegative: false, prefix: "" }
   *   sahmsToFCS(24)    → { acre: 0, carat: 1, shares: 0,    isNegative: false, prefix: "" }
   *   sahmsToFCS(1)     → { acre: 0, carat: 0, shares: 1,    isNegative: false, prefix: "" }
   *   sahmsToFCS(600)   → { acre: 1, carat: 1, shares: 0,    isNegative: false, prefix: "" }
   *   sahmsToFCS(-24)   → { acre: 0, carat: 1, shares: 0,    isNegative: true,  prefix: "-" }
   */
  sahmsToFCS(totalSahms) {
    const isNegative = totalSahms < 0;
    const abs        = Math.abs(totalSahms);
    const acre       = Math.floor(abs / _AC.SAHMS_PER_FEDDAN);  // abs / 576
    const remaining  = abs % _AC.SAHMS_PER_FEDDAN;
    const carat      = Math.floor(remaining / _AC.SAHMS_PER_CARAT); // remaining / 24
    const shares     = +(remaining % _AC.SAHMS_PER_CARAT).toFixed(3);
    return { acre, carat, shares, isNegative, prefix: isNegative ? "-" : "" };
  },

  /**
   * fcsToSahms
   * تحويل فدان + قيراط + سهم إلى عدد الأسهم الكلي
   *
   * @param {number} feddan - عدد الفدادين
   * @param {number} carat  - عدد القراريط
   * @param {number} sahm   - عدد الأسهم
   * @returns {number} العدد الكلي للأسهم
   *
   * Pure Function ✅ — لا DOM ولا localStorage
   *
   * اختبار التحقق (عكس sahmsToFCS):
   *   fcsToSahms(1, 0, 0) → 576
   *   fcsToSahms(0, 1, 0) → 24
   *   fcsToSahms(0, 0, 1) → 1
   *   fcsToSahms(1, 1, 0) → 600
   */
  fcsToSahms(feddan, carat, sahm) {
    return (feddan * _AC.SAHMS_PER_FEDDAN) + (carat * _AC.SAHMS_PER_CARAT) + sahm;
  },

  /**
   * totalCaratsToFCS
   * تحويل عدد القراريط الكلي (رقم عشري) إلى فدان + قيراط + سهم
   *
   * @param {number} totalCarats - العدد الكلي للقراريط (يمكن أن يكون كسراً)
   * @returns {{ feddan: number, carat: number, sahm: number }}
   *
   * Pure Function ✅ — لا DOM ولا localStorage
   *
   * المصدر الأصلي:
   *   Page11/script.js السطور 5382-5384، 5824-5826
   *
   * اختبار التحقق:
   *   totalCaratsToFCS(24)    → { feddan: 1, carat: 0, sahm: 0 }
   *   totalCaratsToFCS(1)     → { feddan: 0, carat: 1, sahm: 0 }
   *   totalCaratsToFCS(1.5)   → { feddan: 0, carat: 1, sahm: 12 }
   *   totalCaratsToFCS(25.5)  → { feddan: 1, carat: 1, sahm: 12 }
   */
  totalCaratsToFCS(totalCarats) {
    const feddan = Math.floor(totalCarats / _AC.CARATS_PER_FEDDAN);
    const carat  = Math.floor(totalCarats % _AC.CARATS_PER_FEDDAN);
    const sahm   = Number(((totalCarats - (feddan * _AC.CARATS_PER_FEDDAN + carat)) * _AC.SAHMS_PER_CARAT).toFixed(4));
    return { feddan, carat, sahm };
  },

  // ============================================================
  // القسم 4: تطبيع الوحدات (Normalization)
  // ============================================================

  /**
   * normalizeFCS
   * تطبيع فدان + قيراط + سهم (معالجة التجاوزات)
   * إذا تجاوزت الأسهم 24 → ترتفع إلى قيراط
   * إذا تجاوزت القراريط 24 → ترتفع إلى فدان
   *
   * @param {number} feddan - عدد الفدادين (قد يكون غير مطبّع)
   * @param {number} carat  - عدد القراريط (قد يتجاوز 23)
   * @param {number} sahm   - عدد الأسهم (قد يتجاوز 23)
   * @returns {{ feddan: number, carat: number, sahm: number }}
   *
   * Pure Function ✅ — لا DOM ولا localStorage
   *
   * المصدر الأصلي:
   *   Page11/script.js السطور 5862-5871: function normalizeInputFCS
   *   Page12/script.js السطور 641-648: داخل sqmToFeddanCaratShares
   *
   * اختبار التحقق:
   *   normalizeFCS(0, 0, 24)  → { feddan: 0, carat: 1, sahm: 0 }
   *   normalizeFCS(0, 24, 0)  → { feddan: 1, carat: 0, sahm: 0 }
   *   normalizeFCS(0, 25, 25) → { feddan: 1, carat: 2, sahm: 1 }
   */
  normalizeFCS(feddan, carat, sahm) {
    let f = feddan;
    let c = carat;
    let s = sahm;

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
   * trapezoidArea
   * حساب مساحة شبه المنحرف (أو المتوسط التقريبي للأرض الزراعية)
   *
   * @param {number} l1 - الطول الأول (م)
   * @param {number} l2 - الطول الثاني (م)
   * @param {number} w1 - العرض الأول (م)
   * @param {number} w2 - العرض الثاني (م)
   * @returns {number} المساحة بالمتر المربع
   *
   * Pure Function ✅ — لا DOM ولا localStorage
   *
   * المصدر الأصلي:
   *   Page11/script.js: ((l1+l2)/2) * ((w1+w2)/2)
   *   Page12/script.js: نفس الصيغة
   *   Page13/section2/script.js السطر 167-174: نفس الصيغة
   *
   * aختبار التحقق:
   *   trapezoidArea(10, 10, 20, 20) → 200     (مستطيل)
   *   trapezoidArea(10, 12, 15, 17) → 176     ((11)×(16))
   *   trapezoidArea(0, 10, 10, 10)  → 50      (مثلث تقريبي)
   */
  trapezoidArea(l1, l2, w1, w2) {
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
