/**
 * تطبيق الدلال الذكي - محرر الحصص الذكي (Smart Share Editor - Core Helpers)
 * Commit 10.4: Safe Deletion of UI Layer
 * =========================================================================
 * تم إزالة طبقة الواجهة البصرية القديمة (Locks & Drag-Drop UI) واستبدالها بالجدول الموحد.
 * تم الاحتفاظ بالدوال الهيكلية ومحولات البيانات للحفاظ الكامل على سلامة الجلسة والتوافق.
 */

(function (global) {
  "use strict";

  let heirCounter = 1;

  // 1. توليد معرف فريد وثابت لكل شريك لضمان التفرد الكامل في مصفوفة heirsData
  function generateUniqueHeirId() {
    return `heir_${Date.now()}_${heirCounter++}_${Math.random().toString(36).substr(2, 4)}`;
  }

  // 2. دالة ترحيل البيانات القديمة لضمان عدم وجود أخطاء عند القراءة من الجلسة
  function migrateHeirData(heir) {
    if (!heir) return;
    if (!heir.locks || Array.isArray(heir.locks)) {
      heir.locks = { area: false, percent: false, order: false, full: false };
    }
    if (!heir.offsetDest) {
      heir.offsetDest = "all";
    }
  }

  // 3. تهيئة خصائص الشريك
  function initHeirProperties(heir, idx) {
    if (!heir) return;
    if (!heir.id) {
      heir.id = generateUniqueHeirId();
    }
    migrateHeirData(heir);
    if (heir.order === undefined) {
      heir.order = idx !== undefined ? idx : (global.heirsData ? global.heirsData.length : 0);
    }
    if (heir.topW === undefined) heir.topW = 0;
    if (heir.botW === undefined) heir.botW = 0;
  }

  // 4. محوّل الوحدات الأساسي للـ Data Model
  const ShareConverter = {
    toSqm: function (value, type, currentShare) {
      if (value === "" || value === null || value === undefined) return null;
      let num = parseFloat(value);
      if (isNaN(num) || !isFinite(num) || num < 0) return null;

      const caratSizeInput = document.getElementById("carat-size");
      const caratSize = parseFloat(caratSizeInput ? caratSizeInput.value : 168) || 168;
      const totalArea = parseFloat(global.calculatedArea) || 0;

      if (type === 'sqm') return num;
      if (type === 'pct') return (num / 100) * totalArea;
      
      if (type === 'split' || type === 'feddan' || type === 'carat' || type === 'sahm') {
        let currentConv = { feddans: 0, carats: 0, shares: 0 };
        if (typeof global.convertSqmToFeddans === "function") {
          currentConv = global.convertSqmToFeddans(currentShare || 0, caratSize);
        }

        const feddan = (type === 'feddan') ? num : currentConv.feddans;
        const carat = (type === 'carat') ? num : currentConv.carats;
        const sahm = (type === 'sahm') ? num : currentConv.shares;

        return (feddan * 24 * caratSize) + (carat * caratSize) + (sahm * caratSize / 24);
      }
      return null;
    },

    fromSqm: function (sqm) {
      const caratSizeInput = document.getElementById("carat-size");
      const caratSize = parseFloat(caratSizeInput ? caratSizeInput.value : 168) || 168;
      const totalArea = parseFloat(global.calculatedArea) || 0;
      const percentage = totalArea > 0 ? (sqm / totalArea) * 100 : 0;
      
      let conv = { feddans: 0, carats: 0, shares: 0 };
      if (typeof global.convertSqmToFeddans === "function") {
        conv = global.convertSqmToFeddans(sqm, caratSize);
      }
      return {
        sqm: sqm,
        pct: percentage,
        feddans: conv.feddans,
        carats: conv.carats,
        shares: conv.shares
      };
    }
  };

  // تصدير الأدوات الأساسية للنطاق العام
  global.generateUniqueHeirId = generateUniqueHeirId;
  global.migrateHeirData = migrateHeirData;
  global.initHeirProperties = initHeirProperties;
  global.ShareConverter = ShareConverter;

})(window);
