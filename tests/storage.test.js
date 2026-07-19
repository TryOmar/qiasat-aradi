/**
 * tests/storage.test.js
 * =====================
 * اختبارات التحقق لمكتبة DallalStorage وآلية الترحيل (Migration)
 * Commit 9 — Phase 5
 *
 * الغرض:
 *   التحقق من صحة عمل آلية الترحيل التلقائي والمزامنة الثنائية
 *   وحفظ التوافقية للمفاتيح القديمة في DallalStorage.
 */

const DallalStorageTests = {

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

    console.log('🚀 DallalStorage API & Migration Tests — Phase 5, Commit 9');
    console.log('─'.repeat(50));

    // 1. التحقق من وجود الكائن
    this.assert('DallalStorage defined', typeof DallalStorage !== 'undefined');

    if (typeof DallalStorage !== 'undefined') {
      const storage = DallalStorage.local;
      const session = DallalStorage.session;

      // 2. التحقق من وجود الدوال الأساسية
      this.assert('DallalStorage.local defined', typeof storage === 'object');
      this.assert('DallalStorage.session defined', typeof session === 'object');
      this.assert('storage.getItem defined', typeof storage.getItem === 'function');
      this.assert('storage.setItem defined', typeof storage.setItem === 'function');
      this.assert('storage.removeItem defined', typeof storage.removeItem === 'function');
      this.assert('storage.hasItem defined', typeof storage.hasItem === 'function');

      // تهيئة للتأكد من عدم وجود بيانات ملوثة
      storage.removeItem("test_key");
      storage.removeItem("carat_area");

      // 3. اختبار الكتابة والقراءة الأساسية (القيم العادية والمصفوفات والكائنات)
      storage.setItem("test_key", "hello_dallal");
      this.assert('Basic string storage', storage.getItem("test_key") === "hello_dallal");

      storage.setItem("test_key", { value: 123 });
      const objVal = storage.getItem("test_key");
      this.assert('JSON auto serialization', typeof objVal === 'object' && objVal.value === 123);

      storage.removeItem("test_key");
      this.assert('Item removal', storage.getItem("test_key") === null);

      // 4. اختبار آلية الترحيل التلقائي من المفاتيح القديمة (Legacy Migration)
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem("dallal_carat_area"); // تأكد من خلو المفتاح الجديد
        
        // محاكاة وجود قيمة قديمة من Page11
        window.localStorage.setItem("dalal-carat-area", "175");
        
        // استدعاء المفتاح الجديد والتحقق من أنه يجلب القيمة القديمة ويرحلها تلقائياً
        const migratedVal = storage.getItem("carat_area");
        this.assert('Migration: Legacy key is read and returned', migratedVal === 175);
        this.assert('Migration: Value written to new namespaced key', window.localStorage.getItem("dallal_carat_area") === "175");

        // تنظيف
        window.localStorage.removeItem("dalal-carat-area");
        window.localStorage.removeItem("dallal_carat_area");
      }

      // 5. اختبار المزامنة الخلفية الثنائية (Dual-Write to legacy keys)
      if (typeof window !== "undefined" && window.localStorage) {
        // كتابة قيمة جديدة عبر الكائن الموحد
        storage.setItem("carat_area", 171.388);

        // التحقق من كتابتها للمفتاح الجديد ولجميع المفاتيح التاريخية القديمة
        const newVal = window.localStorage.getItem("dallal_carat_area");
        const legacyVal1 = window.localStorage.getItem("dalal-carat-area");
        const legacyVal2 = window.localStorage.getItem("dallal_carat_size");

        this.assert('Dual-Write: New namespaced key updated', newVal === "171.388");
        this.assert('Dual-Write: Legacy key 1 (Page11) updated', legacyVal1 === "171.388");
        this.assert('Dual-Write: Legacy key 2 (Page12) updated', legacyVal2 === "171.388");

        // تنظيف
        storage.removeItem("carat_area");
      }

      // 6. اختبار التخزين المؤقت للـ Session (sessionStorage)
      session.setItem("session_test", "session_value");
      this.assert('SessionStorage: Set and Get', session.getItem("session_test") === "session_value");
      
      if (typeof window !== "undefined" && window.sessionStorage) {
        this.assert('SessionStorage: Has correct prefix', window.sessionStorage.getItem("dallal_session_test") === "session_value");
      }

      session.removeItem("session_test");
      this.assert('SessionStorage: Remove', session.getItem("session_test") === null);
    }

    console.log('─'.repeat(50));
    console.log(`✅ Passed: ${this.passed} | ❌ Failed: ${this.failed} | Total: ${this.passed + this.failed}`);
    return this.failed === 0;
  }

};

window.DallalStorageTests = DallalStorageTests;
