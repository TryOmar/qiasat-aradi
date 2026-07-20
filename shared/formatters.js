/**
 * shared/formatters.js — Dallal Unified Formatter Module
 * ========================================================
 * يوفر دوال موحدة لتنسيق المساحات، الأطوال، النسب المئوية، ومساحات الفدان والقيراط والسهم.
 * يُستخدم عبر جميع صفحات وتطبيقات مشروع "الدلال".
 */
(function (global) {
  "use strict";

  const DallalFormatters = {
    /**
     * تنسيق المساحة بمتر مربع مع تثبيت رقمين عشريين دائماً
     * مثال: 1447.5 → "1447.50" | 8685 → "8685.00"
     */
    formatArea(value) {
      if (value === null || value === undefined || value === "") return "0.00";
      const num = Number(value);
      if (isNaN(num)) return "0.00";
      return num.toFixed(2);
    },

    /**
     * تنسيق الأطوال بالمتر بالخيار العشري المحدد (افتراضياً 2 أرقام عشرية)
     * مثال: formatLength(10.5, 2) → "10.50" | formatLength(10.5, 4) → "10.5000"
     */
    formatLength(value, decimals = 2) {
      if (value === null || value === undefined || value === "") return (0).toFixed(decimals);
      const num = Number(value);
      if (isNaN(num)) return (0).toFixed(decimals);
      return num.toFixed(decimals);
    },

    /**
     * تنسيق النسب المئوية برقمين عشريين وثابت %
     * مثال: 50 → "50.00 %" | 33.3333 → "33.33 %"
     */
    formatPercent(value, decimals = 2) {
      if (value === null || value === undefined || value === "") return (0).toFixed(decimals) + " %";
      const num = Number(value);
      if (isNaN(num)) return (0).toFixed(decimals) + " %";
      return num.toFixed(decimals) + " %";
    },

    /**
     * تنسيق أسهم وقراريط وفدادين بنص عربي موحد
     * مثال: formatShares(1, 5, 18.29) → "1 فدان، 5 ق، 18.29 س"
     */
    formatShares(feddan, carat, sahm) {
      const f = parseInt(feddan, 10) || 0;
      const c = parseInt(carat, 10) || 0;
      const s = Number(sahm) || 0;
      const sStr = s % 1 === 0 ? s.toFixed(0) : s.toFixed(2);
      return `${f} فدان، ${c} ق، ${sStr} س`;
    }
  };

  // تصدير النمط الموحد للمتصفح والنود
  if (typeof module !== "undefined" && module.exports) {
    module.exports = DallalFormatters;
  } else {
    global.DallalFormatters = DallalFormatters;
    // إتاحة formatArea و formatPercent و formatLength على النطاق العام إذا لم تكن معرفة
    if (!global.formatArea) {
      global.formatArea = DallalFormatters.formatArea;
    }
    if (!global.formatPercent) {
      global.formatPercent = DallalFormatters.formatPercent;
    }
    if (!global.formatLength) {
      global.formatLength = DallalFormatters.formatLength;
    }
  }
})(typeof window !== "undefined" ? window : global);
