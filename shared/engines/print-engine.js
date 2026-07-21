/**
 * @file shared/engines/print-engine.js
 * @description محرك الطباعة والتصدير الموحد لتطبيق الدَّلاَّل (Print Engine)
 * @version 1.0.0
 * @see docs/ROADMAP_COMMIT13.md
 */

(function (global) {
  "use strict";

  const PRINT_MARGIN_HINT_DEFAULT = 110;

  const PrintEngine = {
    /**
     * تطبيق هوامش الطباعة الآمنة لمنع قص المحتوى
     * @param {number} marginPx 
     */
    applyPrintMargins: function (marginPx) {
      const margin = marginPx || PRINT_MARGIN_HINT_DEFAULT;
      global.smartMarginHint = margin;
      if (global.LayoutBuffer && typeof global.LayoutBuffer.updateAll === "function") {
        global.LayoutBuffer.updateAll();
      }
    },

    /**
     * استعادة الهوامش الطبيعية للشاشة
     */
    restoreMargins: function () {
      global.smartMarginHint = null;
    },

    /**
     * عرض تنبيه توست تفاعلي أثناء الطباعة/التصدير
     * @param {string} message 
     * @param {string} type 'success' | 'error' | 'info'
     */
    showToast: function (message, type) {
      if (global.SmartExport && typeof global.SmartExport.showToast === "function") {
        global.SmartExport.showToast(message, type);
        return;
      }
      console.log(`[PrintEngine Toast - ${type || 'info'}]: ${message}`);
    },

    /**
     * محرك الطباعة المركزي الموحد
     * @param {Object} data بيانات التقرير (اختياري)
     * @param {Object} options خيارات إضافية
     */
    print: function (data, options) {
      options = options || {};
      this.applyPrintMargins(options.margin);

      if (global.SmartExport && typeof global.SmartExport.printReport === "function") {
        global.SmartExport.printReport();
        return;
      }

      if (global.ReportEngine && typeof global.ReportEngine.print === "function") {
        global.ReportEngine.print(data);
        return;
      }

      if (global.DallalReportTemplate && typeof global.DallalReportTemplate.print === "function") {
        global.DallalReportTemplate.print(data);
        return;
      }

      // Direct fallback
      window.print();
      this.restoreMargins();
    },

    /**
     * تصدير التقرير كملف PDF بواسطة حوار الطباعة التفاعلي
     * @param {Object} data 
     * @param {Object} options 
     */
    exportPDF: function (data, options) {
      this.showToast("💡 اختر 'حفظ كـ PDF' من قائمة الطابعات للتصدير.", "info");
      this.print(data, options);
    },

    /**
     * تصدير الكروكي كصورة بدقة عالية
     * @param {string} canvasId 
     * @param {string} filename 
     */
    exportImage: function (canvasId, filename) {
      if (global.SmartExport && typeof global.SmartExport.exportImage === "function") {
        global.SmartExport.exportImage();
        return;
      }
      const canvas = document.getElementById(canvasId || "landCanvas");
      if (!canvas) {
        this.showToast("لم يتم العثور على الكروكي للتصدير.", "error");
        return;
      }
      try {
        const link = document.createElement("a");
        link.download = filename || "croquis-dallal.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
        this.showToast("تم تحميل صورة الكروكي بنجاح!", "success");
      } catch (e) {
        console.error("[PrintEngine] exportImage error:", e);
        this.showToast("حدث خطأ أثناء تصدير الصورة.", "error");
      }
    }
  };

  // تصدير المحرك الموحد للنطاق العام
  global.PrintEngine = PrintEngine;

})(typeof window !== "undefined" ? window : global);
