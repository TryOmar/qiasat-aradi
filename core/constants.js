/**
 * core/constants.js
 * =================
 * مكتبة الثوابت الزراعية المشتركة - مشروع الدَّلاَّل
 *
 * الإصدار: 1.0.0
 * تاريخ الإنشاء: 2026-07-19
 * المرحلة: Commit 9 — Phase 2
 *
 * الغرض:
 *   تجميع جميع الثوابت الزراعية المشتركة في مكان واحد،
 *   لضمان التوافق بين الصفحات ومنع تعارض القيم.
 *
 * القواعد:
 *   - هذا الملف لا يحتوي على أي دوال
 *   - هذا الملف لا يتعامل مع DOM
 *   - هذا الملف لا يتعامل مع localStorage
 *   - جميع الثوابت مجمّعة في كائن AgriConstants واحد
 *
 * ⚠️ ملاحظات التوافق بين الصفحات (مكتشفة أثناء التحليل):
 *   - Page11/script.js و Page13/section1/script.js يستخدمان:
 *       qabdaLength = 3.55 / 24  (أي 24 قبضة في القصبة)
 *   - Page13/section2/script.js يستخدم:
 *       QABDA_IN_METERS = 3.55 / 6  (أي 6 قبضات في القصبة)
 *   هذا تعارض حقيقي موثّق يحتاج مراجعة في مرحلة لاحقة.
 *   الحل المؤجّل: توثيق كلا الثابتَين هنا دون تغيير السلوك الحالي.
 *
 * CHANGELOG:
 *   1.0.0 — إنشاء المكتبة: جمع الثوابت من Page10، Page11، Page12، Page13/section1، Page13/section2
 */

// ============================================================
//  الكائن الرئيسي: AgriConstants
// ============================================================
const AgriConstants = {

  // ----------------------------------------------------------
  // الإصدار والتوثيق
  // ----------------------------------------------------------
  VERSION: "1.0.0",
  CHANGELOG: {
    "1.0.0": "إنشاء المكتبة — جمع الثوابت الزراعية من جميع الصفحات (Phase 2, Commit 9)"
  },

  // ----------------------------------------------------------
  // ثوابت القصبة والقبضة (وحدات الطول)
  // ----------------------------------------------------------

  /**
   * QASABA_METERS
   * طول القصبة الواحدة بالمتر المربع
   * المصدر: Page11/script.js (السطر 4659)، Page13/section1/script.js (السطر 817)،
   *         Page13/section2/script.js (السطر 7)
   * القيمة المعتمدة: 3.55 في جميع الصفحات ✅ متطابقة
   */
  QASABA_METERS: 3.55,

  /**
   * QASABA_SQ_METERS
   * مساحة القصبة المربعة بالمتر المربع (3.55 × 3.55 = 12.6025)
   * المصدر: Page13/section2/script.js (السطر 10)، Page11/script.js (السطر 4817: يستخدم 12.60250 مباشرة)
   * القيمة المعتمدة: 12.6025
   */
  QASABA_SQ_METERS: 3.55 * 3.55, // = 12.602500

  /**
   * QABDA_PER_QASABA
   * عدد القبضات في القصبة الواحدة — الثابت المستخدم في Page11 و Page13/section1
   * المصدر: Page11/script.js (السطر 4660): qabdaLength = qasabaLength / 24
   *         Page13/section1/script.js (السطر 818): qabdaLength = qasabaLength / 24
   * ⚠️ تعارض مع section2: راجع QABDA_PER_QASABA_SECTION2
   */
  QABDA_PER_QASABA: 24,

  /**
   * QABDA_METERS
   * طول القبضة الواحدة بالمتر (مشتقة من QASABA_METERS / QABDA_PER_QASABA)
   * تُستخدم في Page11 و Page13/section1
   * = 3.55 / 24 ≈ 0.1479167 م
   */
  QABDA_METERS: 3.55 / 24,

  /**
   * QABDA_PER_QASABA_SECTION2
   * ⚠️ قيمة مختلفة مكتشفة في Page13/section2
   * المصدر: Page13/section2/script.js (السطر 8): QABDA_IN_METERS = 3.55 / 6
   * هذا يعني أن section2 تعتمد 6 قبضات في القصبة (وليس 24)
   * الفرق: 0.5917 م للقبضة في section2 مقابل 0.1479 م في Page11 وsection1
   * ⚠️ يحتاج توضيح من المستخدم في مرحلة لاحقة
   */
  QABDA_PER_QASABA_SECTION2: 6,

  /**
   * QABDA_METERS_SECTION2
   * طول القبضة بالمتر وفق section2
   * = 3.55 / 6 ≈ 0.5917 م
   */
  QABDA_METERS_SECTION2: 3.55 / 6,

  /**
   * CM_IN_METERS
   * طول السنتيمتر الواحد بالمتر
   * المصدر: Page13/section2/script.js (السطر 9)
   */
  CM_IN_METERS: 0.01,

  // ----------------------------------------------------------
  // ثوابت الفدان / القيراط / السهم (وحدات المساحة)
  // ----------------------------------------------------------

  /**
   * CARATS_PER_FEDDAN
   * عدد القراريط في الفدان الواحد
   * المصدر:
   *   - Page10/script.js (السطر 379): carat = Math.floor(remaining / 24)
   *   - Page11/script.js (السطور 597، 610، 1138، 5382، 5824): استخدام 24 باستمرار
   *   - Page12/script.js (السطران 629، 634): fSize = cSize * 24، carat = Math.floor(remSqm / cSize)
   *   - Page13/section2/script.js (السطور 186، 187): Math.floor(totalCarats / 24)
   */
  CARATS_PER_FEDDAN: 24,

  /**
   * SAHMS_PER_CARAT
   * عدد الأسهم في القيراط الواحد
   * المصدر:
   *   - Page10/script.js (السطران 379، 398): carat * 24 + shares
   *   - Page11/script.js (السطران 5863، 5869): استخدام 24 للتحويل
   *   - Page12/script.js (السطر 630): sSize = cSize / 24
   *   - Page13/section2/script.js (السطر 188): (totalCarats - (acres * 24 + carats)) * 24
   */
  SAHMS_PER_CARAT: 24,

  /**
   * SAHMS_PER_FEDDAN
   * عدد الأسهم في الفدان الواحد (= CARATS_PER_FEDDAN × SAHMS_PER_CARAT)
   * المصدر: Page10/script.js (السطور 398، 705، 727): ac * 576 + ca * 24 + sh
   */
  SAHMS_PER_FEDDAN: 576, // = 24 × 24

  // ----------------------------------------------------------
  // القيمة الافتراضية لمساحة القيراط
  // ----------------------------------------------------------

  /**
   * DEFAULT_CARAT_SQM
   * مساحة القيراط الافتراضية بالمتر المربع
   * المصدر:
   *   - Page11/script.js (السطر 397): || "168"
   *   - Page12/script.js (السطر 283): || 168
   *   - Page13/section1/script.js (السطور 963، 1773، 2104، 2153، 2204، 3610، 3996، 4072): || 168
   */
  DEFAULT_CARAT_SQM: 168,

  // ----------------------------------------------------------
  // قيم الضبط المسبق لمساحة القيراط (Preset Sizes)
  // ----------------------------------------------------------

  /**
   * PRESET_CARAT_SIZES_P11
   * قيم الضبط المسبق لمساحة القيراط في Page11
   * المصدر: Page11/index.html (القيم الموجودة في select#input-carat-area)
   * ملاحظة: تشمل قيم كسرية مثل 171.388
   */
  PRESET_CARAT_SIZES_P11: [168, 171.388, 175, 175.035],

  /**
   * PRESET_CARAT_SIZES_P12
   * قيم الضبط المسبق لمساحة القيراط في Page12
   * المصدر: Page12/script.js (السطر 6416): ["175.035", "175", "171.388", "168"]
   */
  PRESET_CARAT_SIZES_P12: [168, 171.388, 175, 175.035],

  /**
   * PRESET_CARAT_SIZES_P13S1
   * قيم الضبط المسبق لمساحة القيراط في Page13/section1
   * المصدر: Page13/section1/script.js (السطر 2734)
   * ملاحظة: نفس القيم في P12 تقريباً
   */
  PRESET_CARAT_SIZES_P13S1: [168, 171.388, 175, 175.035],

  // ----------------------------------------------------------
  // مفاتيح localStorage المستخدمة (توثيق لمنع التعارض)
  // ----------------------------------------------------------

  /**
   * STORAGE_KEYS
   * توثيق جميع مفاتيح localStorage المتعلقة بالثوابت
   * (القيم لم تُوحَّد بعد — توحيدها في مرحلة لاحقة مع shared/storage.js)
   *
   * ⚠️ تعارض في مفتاح مساحة القيراط:
   *   - Page11: "dalal-carat-area"
   *   - Page12: "dallal_carat_size"  (كتابة مختلفة: dallal بدلاً من dalal)
   *   - Page13/section1: "dalal-carat-area"
   * يعني Page11 وPage13/section1 يتشاركان نفس المفتاح ✅
   * لكن Page12 لها مفتاح مختلف ⚠️ — يحتاج توحيد في مرحلة لاحقة
   */
  STORAGE_KEYS: {
    CARAT_AREA_P11_P13S1: "dalal-carat-area",       // مشترك: Page11 + Page13/section1
    CARAT_SIZE_P12: "dallal_carat_size",             // ⚠️ مختلف: Page12 فقط (typo: dallal)
    SHOW_FEDDAN_P12: "dallal_show_feddan"            // Page12: إظهار/إخفاء تحويل الفدان
  }

};

// ----------------------------------------------------------
// تصدير للنطاق العام (window) — للتوافق مع البنية الحالية
// ----------------------------------------------------------
window.AgriConstants = AgriConstants;

// ----------------------------------------------------------
// تجميد الكائن لمنع التعديل العرضي (Object.freeze)
// ----------------------------------------------------------
Object.freeze(AgriConstants.STORAGE_KEYS);
Object.freeze(AgriConstants.PRESET_CARAT_SIZES_P11);
Object.freeze(AgriConstants.PRESET_CARAT_SIZES_P12);
Object.freeze(AgriConstants.PRESET_CARAT_SIZES_P13S1);
Object.freeze(AgriConstants.CHANGELOG);
Object.freeze(AgriConstants);
