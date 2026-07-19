/**
 * tests/toast.test.js
 * ===================
 * اختبارات التحقق لمكتبة DallalToast
 * Commit 9 — Phase 4
 *
 * الغرض:
 *   التحقق من صحة هيكلية ومخرجات واجهة البرمجة (API) الخاصة بـ DallalToast.
 */

const DallalToastTests = {

  passed: 0,
  failed: 0,
  results: [],

  assert(testName, condition) {
    if (condition) {
      this.passed++;
      this.results.push({ status: '✅', name: testName });
      console.log(`✅ ${testName}`);
    } else {
      this.failed++;
      this.results.push({ status: '❌', name: testName });
      console.warn(`❌ ${testName}`);
    }
  },

  runAll() {
    this.passed = 0;
    this.failed = 0;
    this.results = [];

    console.log('🚀 DallalToast API Tests — Phase 4, Commit 9');
    console.log('─'.repeat(50));

    // 1. التحقق من وجود الكائن
    this.assert('DallalToast defined', typeof DallalToast !== 'undefined');

    if (typeof DallalToast !== 'undefined') {
      // 2. التحقق من وجود الدوال الأساسية
      this.assert('DallalToast.show defined', typeof DallalToast.show === 'function');
      this.assert('DallalToast.success defined', typeof DallalToast.success === 'function');
      this.assert('DallalToast.error defined', typeof DallalToast.error === 'function');
      this.assert('DallalToast.warning defined', typeof DallalToast.warning === 'function');
      this.assert('DallalToast.info defined', typeof DallalToast.info === 'function');
      this.assert('DallalToast.dismiss defined', typeof DallalToast.dismiss === 'function');

      // 3. اختبار السلوك في المتصفح (إذا كان يعمل في بيئة متصفح حقيقية)
      if (typeof document !== 'undefined' && document.body) {
        try {
          // اختبار إنشاء toast بنجاح
          const toast = DallalToast.success("رسالة اختبار نجاح", { duration: 0 });
          this.assert('Toast DOM element created', toast !== null && typeof toast === 'object');
          this.assert('Toast has class dallal-toast', toast.classList.contains('dallal-toast'));
          this.assert('Toast has class dallal-toast-success', toast.classList.contains('dallal-toast-success'));
          
          // اختبار المحتوى
          this.assert('Toast contains message', toast.innerHTML.indexOf("رسالة اختبار نجاح") !== -1);

          // اختبار الإغلاق
          DallalToast.dismiss(toast);
          this.assert('Toast class show removed on dismiss', !toast.classList.contains('show'));
        } catch (e) {
          console.error("Browser DOM test error:", e);
          this.assert('Browser DOM test executed without error', false);
        }
      } else {
        console.log('⚠️ skipped Browser DOM tests (non-browser environment)');
      }
    }

    console.log('─'.repeat(50));
    console.log(`✅ Passed: ${this.passed} | ❌ Failed: ${this.failed} | Total: ${this.passed + this.failed}`);
    return this.failed === 0;
  }

};

window.DallalToastTests = DallalToastTests;
