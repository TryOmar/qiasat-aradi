/**
 * tests/integration/toast.js
 * ==========================
 * اختبارات تكامل نظام التنبيهات وإظهار الرسائل الملونة في الـ DOM
 */

(function (global) {
  "use strict";

  global.DallalIntegrationSuite = global.DallalIntegrationSuite || {};

  global.DallalIntegrationSuite.toast = {
    name: "DallalToast System & DOM Integration",
    run(assert) {
      assert("DallalToast API is defined", typeof DallalToast !== "undefined");
      if (typeof DallalToast === "undefined") return;

      // 1. التحقق من وجود الدوال المخصصة
      assert("DallalToast.success is a function", typeof DallalToast.success === "function");
      assert("DallalToast.error is a function", typeof DallalToast.error === "function");
      assert("DallalToast.warning is a function", typeof DallalToast.warning === "function");
      assert("DallalToast.info is a function", typeof DallalToast.info === "function");

      // 2. محاكاة عرض تنبيه والتحقق من إضافته إلى بنية الصفحة (DOM)
      const testMsg = "اختبار رسالة تكامل الدلال";
      DallalToast.success(testMsg);

      if (global.document) {
        // التحقق من وجود الحاوية
        const container = global.document.querySelector(".dallal-toast-container");
        assert("Toast container successfully created in DOM", container !== null);

        // التحقق من ظهور نص الرسالة المحددة
        const html = container ? container.innerHTML : "";
        assert("Toast HTML contains the generated message text", html.includes(testMsg));

        // اختبار الإغلاق اليدوي والبرمجي
        const toastEl = container ? container.querySelector(".dallal-toast") : null;
        assert("Toast element successfully rendered in the container", toastEl !== null);
        
        if (toastEl) {
          const closeBtn = toastEl.querySelector(".dallal-toast-close");
          if (closeBtn && closeBtn.listeners && closeBtn.listeners.click) {
            // محاكاة النقر للإغلاق في البيئة الوهمية
            closeBtn.listeners.click.forEach(cb => cb());
            assert("Manual close listener successfully invoked", true);
          }
          // إزالة مباشرة للتنظيف
          toastEl.remove();
        }
      }
    }
  };

})(typeof window !== "undefined" ? window : global);
