/**
 * @file layout-buffer.js
 * @description طبقة مستقلة (Helper/Wrapper) لتخزين أبعاد العناصر (Layout Buffering) ومنع الـ Layout Thrashing.
 * تقوم بتخزين نتيجة getBoundingClientRect وتحديثها فقط عند تغيير حجم الشاشة أو اتجاهها أو طباعتها.
 */
(function() {
  const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
  const cachedElements = new Map();

  /**
   * تهيئة التخزين المؤقت لعنصر محدد.
   * @param {Element} element العنصر المستهدف
   */
  function bufferElement(element) {
    if (!element || cachedElements.has(element)) return;

    let cachedRect = originalGetBoundingClientRect.call(element);

    // دالة تحديث الكاش
    function updateCache() {
      // إيقاف التخزين مؤقتاً للحصول على القيمة الفعلية من المتصفح
      element.getBoundingClientRect = originalGetBoundingClientRect;
      cachedRect = originalGetBoundingClientRect.call(element);
      element.getBoundingClientRect = getCachedRect;
    }

    function getCachedRect() {
      return cachedRect;
    }

    // استبدال الدالة على مستوى الـ Instance للعنصر
    element.getBoundingClientRect = getCachedRect;

    // تسجيل العنصر ودالة تحديثه
    cachedElements.set(element, updateCache);
  }

  // تحديث جميع العناصر المخزنة عند تغيير الأبعاد
  function updateAllCaches() {
    cachedElements.forEach((updateFn) => {
      try {
        updateFn();
      } catch (e) {
        console.error("[LayoutBuffer] Error updating cache:", e);
      }
    });
  }

  window.addEventListener("resize", updateAllCaches);
  window.addEventListener("orientationchange", updateAllCaches);
  window.addEventListener("beforeprint", updateAllCaches);
  window.addEventListener("afterprint", updateAllCaches);

  // تصدير واجهة برمجية بسيطة
  window.LayoutBuffer = {
    buffer: bufferElement,
    updateAll: updateAllCaches
  };

  // تهيئة تلقائية للعناصر الأساسية في الصفحة عند انتهاء التحميل
  document.addEventListener("DOMContentLoaded", function() {
    // 1. صفحة 11
    const p11Container = document.getElementById("croquis-container");
    if (p11Container) {
      bufferElement(p11Container);
    }
    const p11Wrapper = document.getElementById("croquis-wrapper");
    if (p11Wrapper) {
      bufferElement(p11Wrapper);
    }

    // 2. صفحة 13
    const p13Canvas = document.getElementById("landCanvas");
    if (p13Canvas) {
      bufferElement(p13Canvas);
      if (p13Canvas.parentElement) {
        bufferElement(p13Canvas.parentElement); // canvas-wrapper
      }
    }
  });
})();
