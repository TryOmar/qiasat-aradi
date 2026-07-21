/**
 * @file shared/engines/report-engine.js
 * @description محرك التقارير الموحد لتطبيق الدَّلاَّل (Report Engine)
 * @version 1.0.0
 * @see docs/ROADMAP_COMMIT13.md
 */

(function (global) {
  "use strict";

  const ReportEngine = {
    /**
     * توليد نص HTML الكامل لتقرير الطباعة الموحد
     * @param {Object} data 
     * @returns {string}
     */
    generateHTML: function (data) {
      if (global.DallalReportTemplate && typeof global.DallalReportTemplate.renderHTML === "function") {
        return global.DallalReportTemplate.renderHTML(data);
      }
      console.warn("[ReportEngine] DallalReportTemplate.renderHTML not found, using basic fallback");
      return `<html><head><title>تقرير طباعة الدلال</title></head><body><h1>تقرير الدلال</h1></body></html>`;
    },

    /**
     * طباعة التقرير في نافذة منفصلة أو النافذة الحالية
     * @param {Object} data 
     */
    print: function (data) {
      if (!data && typeof global.Page13Adapter !== "undefined" && typeof global.Page13Adapter.extractData === "function") {
        data = global.Page13Adapter.extractData();
      } else if (!data && typeof global.Page11Adapter !== "undefined" && typeof global.Page11Adapter.extractData === "function") {
        data = global.Page11Adapter.extractData();
      }

      if (global.DallalReportTemplate && typeof global.DallalReportTemplate.print === "function") {
        global.DallalReportTemplate.print(data);
        return;
      }

      // Fallback للطباعة المباشرة في حال غياب DallalReportTemplate
      const htmlContent = this.generateHTML(data);
      const printWin = window.open("", "_blank");
      if (printWin) {
        printWin.document.write(htmlContent);
        printWin.document.close();
        printWin.focus();
        setTimeout(function () {
          printWin.print();
        }, 300);
      }
    },

    /**
     * معاينة التقرير في نافذة منبثقة دون طباعة فورية
     * @param {Object} data 
     */
    preview: function (data) {
      const htmlContent = this.generateHTML(data);
      const previewWin = window.open("", "_blank");
      if (previewWin) {
        previewWin.document.write(htmlContent);
        previewWin.document.close();
        previewWin.focus();
      }
    }
  };

  // تصدير المحرك الموحد إلى النطاق العام
  global.ReportEngine = ReportEngine;

})(typeof window !== "undefined" ? window : global);
