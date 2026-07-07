/**
 * outdoor-mode.js (Disabled / Deactivated)
 * تم تعطيل زر الشمس وإلغاء هذا الوضع بناءً على طلب المستخدم،
 * مع الحفاظ على كافة التنسيقات الافتراضية المحسنة والتحسينات الميدانية للموبايل.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'dalal_outdoor_mode';

  // إعادة ضبط حالة التخزين المحلي فوراً إلى وضع الإيقاف
  localStorage.setItem(STORAGE_KEY, '0');

  // إزالة فئة وضع الشمس وإخفاء أي أزرار عند تحميل الصفحة
  function disableOutdoorMode() {
    document.body.classList.remove('outdoor-mode');
    
    // إزالة الزر إذا تم إنشاؤه مسبقاً
    const btn = document.getElementById('outdoor-toggle-btn');
    if (btn) {
      btn.remove();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', disableOutdoorMode);
  } else {
    disableOutdoorMode();
  }

})();
