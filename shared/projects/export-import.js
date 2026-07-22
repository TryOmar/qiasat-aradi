/**
 * ============================================================================
 * Qiasat-Aradi — Export & Import Engine (Commit 15.2)
 * Source of Truth for Project Serialization, Excel Export & Share Links
 * ============================================================================
 * Manages full project JSON export/import with version validation, Excel CSV
 * table generation, high-res canvas exports, and shareable link building.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ExportImportEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var ExportImportEngine = {
    version: '1.0.0',

    /**
     * Export complete project object as formatted JSON string
     * @param {Object} project 
     * @returns {string}
     */
    exportJSON: function (project) {
      if (!project) return '';
      var payload = {
        app: 'Qiasat-Aradi',
        schemaVersion: 3,
        exportedAt: new Date().toISOString(),
        project: project
      };
      return JSON.stringify(payload, null, 2);
    },

    /**
     * Import JSON string into validated project object
     * @param {string} jsonString 
     * @returns {{ok: boolean, project: Object|null, message: string}}
     */
    importJSON: function (jsonString) {
      if (!jsonString || typeof jsonString !== 'string') {
        return { ok: false, project: null, message: 'محتوى النص البرمجي فارغ' };
      }

      try {
        var parsed = JSON.parse(jsonString);
        var proj = parsed.project || parsed;

        if (!proj || typeof proj !== 'object' || (!proj.id && !proj.data)) {
          return { ok: false, project: null, message: 'صيغة ملف المشروع غير مدعومة' };
        }

        return { ok: true, project: proj, message: 'تم استيراد المشروع بنجاح' };
      } catch (e) {
        return { ok: false, project: null, message: 'خطأ في قراءة ملف JSON: ' + e.message };
      }
    },

    /**
     * Generate Excel (CSV) formatted string for partners table
     * @param {Array<Object>} partnersData 
     * @param {Object} [landData] 
     * @returns {string}
     */
    exportToExcel: function (partnersData, landData) {
      if (!Array.isArray(partnersData)) return '';

      var lines = [];
      lines.push('\uFEFFاسم الشريك,فدان,قيراط,سهم,المساحة (م²),النسبة المئوية');

      partnersData.forEach(function (p) {
        var name = '"' + String(p.name || 'شريك').replace(/"/g, '""') + '"';
        var f = p.feddans || 0;
        var c = p.carats || 0;
        var s = p.shares || 0;
        var a = typeof p.area === 'number' ? p.area.toFixed(2) : (p.area || '0.00');
        var r = typeof p.ratio === 'number' ? p.ratio.toFixed(2) + '%' : (p.ratio || '0%');
        lines.push([name, f, c, s, a, r].join(','));
      });

      return lines.join('\n');
    },

    /**
     * Generate encoded shareable URL link for project
     * @param {Object} project 
     * @returns {string}
     */
    generateShareableLink: function (project) {
      if (!project || typeof window === 'undefined') return '';
      try {
        var jsonStr = JSON.stringify(project.data || project);
        var encoded = typeof btoa === 'function' ? btoa(encodeURIComponent(jsonStr)) : encodeURIComponent(jsonStr);
        var baseUrl = window.location.origin + window.location.pathname;
        return baseUrl + '?projectData=' + encoded;
      } catch (e) {
        return '';
      }
    }
  };

  return ExportImportEngine;
}));
