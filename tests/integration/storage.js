/**
 * tests/integration/storage.js
 * =============================
 * اختبارات تكامل نظام التخزين الموحد وآليات الحفظ والترحيل المشترك
 */

(function (global) {
  "use strict";

  global.DallalIntegrationSuite = global.DallalIntegrationSuite || {};

  global.DallalIntegrationSuite.storage = {
    name: "DallalStorage Integration & Auto-Save",
    run(assert) {
      assert("DallalStorage API is defined", typeof DallalStorage !== "undefined");
      if (typeof DallalStorage === "undefined") return;

      const storage = DallalStorage.local;
      const session = DallalStorage.session;

      // 1. اختبار الحفظ والاسترجاع الأساسي ببادئة النطاق المخصصة
      storage.removeItem("test_integration_key");
      storage.setItem("test_integration_key", { data: "integration_value" });
      
      const retrieved = storage.getItem("test_integration_key");
      assert("JSON Object automatic serialization & prefix check", retrieved && retrieved.data === "integration_value");
      
      if (typeof window !== "undefined" && window.localStorage) {
        assert("Verified namespaced prefix in raw localStorage", window.localStorage.getItem("dallal_test_integration_key") !== null);
      }
      storage.removeItem("test_integration_key");

      // 2. اختبار المزامنة والترحيل لـ carat_area من المفاتيح القديمة
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem("dallal_carat_area");
        window.localStorage.setItem("dalal-carat-area", "175.5"); // قيمة تاريخية
        
        // جلب القيمة وترحيلها التلقائي
        const val = storage.getItem("carat_area");
        assert("Successfully migrated legacy 'dalal-carat-area' to 'carat_area'", val === 175.5);
        assert("Namespaced key 'dallal_carat_area' has the migrated value", window.localStorage.getItem("dallal_carat_area") === "175.5");
        
        // اختبار الكتابة المزدوجة (Dual-Write)
        storage.setItem("carat_area", 168.0);
        assert("Dual-write: New key updated", window.localStorage.getItem("dallal_carat_area") === "168");
        assert("Dual-write: Legacy key 1 updated", window.localStorage.getItem("dalal-carat-area") === "168");
        assert("Dual-write: Legacy key 2 updated", window.localStorage.getItem("dallal_carat_size") === "168");

        // تنظيف
        storage.removeItem("carat_area");
      }

      // 3. اختبار التخزين المؤقت الموحد (sessionStorage) والحفظ التلقائي
      session.removeItem("autosave_state");
      session.setItem("autosave_state", { page: 12, enabled: true, fields: { width: 10 } });
      const autosave = session.getItem("autosave_state");
      assert("SessionStorage auto-save JSON preservation", autosave && autosave.page === 12 && autosave.fields.width === 10);
      session.removeItem("autosave_state");
    }
  };

})(typeof window !== "undefined" ? window : global);
