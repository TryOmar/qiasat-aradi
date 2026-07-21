/**
 * @file shared/engines/calculation-engine.js
 * @description محرك الحسابات الهندسي والمالي الموحد لتطبيق الدَّلاَّل (Calculation Engine)
 * @version 1.0.0
 * @see docs/ROADMAP_COMMIT13.md
 */

(function (global) {
  "use strict";

  const CalculationEngine = {
    /**
     * تحويل المساحة من متر مربع إلى (فدان - قيراط - سهم)
     * @param {number} sqm المساحة بالمتر المربع
     * @param {number} caratSize مساحة القيراط (افتراضي 175.034 م²)
     * @returns {Object} { feddans, carats, sahms, formattedStr }
     */
    convertSqmToFeddans: function (sqm, caratSize) {
      const area = parseFloat(sqm) || 0;
      const caratSqM = parseFloat(caratSize) || 175.034;
      const feddanSqM = caratSqM * 24;
      const sahmSqM = caratSqM / 24;

      if (area <= 0) {
        return { feddans: 0, carats: 0, sahms: 0, formattedStr: "٠ فدان و ٠ قيراط و ٠ سهم" };
      }

      const feddans = Math.floor(area / feddanSqM);
      const remAfterFeddan = area - (feddans * feddanSqM);
      const carats = Math.floor(remAfterFeddan / caratSqM);
      const remAfterCarat = remAfterFeddan - (carats * caratSqM);
      const sahms = Math.round((remAfterCarat / sahmSqM) * 100) / 100;

      return {
        feddans,
        carats,
        sahms,
        formattedStr: `${feddans} فدان و ${carats} قيراط و ${sahms} سهم`
      };
    },

    /**
     * حساب مساحة المثلث بواسطة معادلة هيرون (Heron's Formula)
     * @param {number} a ضلع 1
     * @param {number} b ضلع 2
     * @param {number} c ضلع 3
     * @returns {number} المساحة بالمتر المربع
     */
    heronArea: function (a, b, c) {
      const side1 = parseFloat(a) || 0;
      const side2 = parseFloat(b) || 0;
      const side3 = parseFloat(c) || 0;
      if (side1 <= 0 || side2 <= 0 || side3 <= 0) return 0;
      if (side1 + side2 <= side3 || side1 + side3 <= side2 || side2 + side3 <= side1) return 0;
      const s = (side1 + side2 + side3) / 2;
      return Math.sqrt(s * (s - side1) * (s - side2) * (s - side3));
    },

    /**
     * حساب مساحة المضلع الرباعي المقصوص عند نسبة الفاصل t باستخدام Shoelace Formula
     * @param {Array<Object>} vertices رؤوس الأرض [{x, y}, ...]
     * @param {number} t النسبة بين [0, 1]
     * @returns {number} المساحة بالمتر المربع
     */
    getLeftArea: function (vertices, t) {
      if (!vertices || vertices.length < 4) return 0;
      const pBottom = {
        x: vertices[0].x + t * (vertices[1].x - vertices[0].x),
        y: vertices[0].y + t * (vertices[1].y - vertices[0].y)
      };
      const pTop = {
        x: vertices[3].x + t * (vertices[2].x - vertices[3].x),
        y: vertices[3].y + t * (vertices[2].y - vertices[3].y)
      };

      const pts = [vertices[0], pBottom, pTop, vertices[3]];
      let area = 0;
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4;
        area += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
      }
      return Math.abs(area) * 0.5;
    },

    /**
     * البحث عن النسبة t المقابلة للمساحة المستهدفة بطريقة التناصف (Bisection Method)
     * @param {Array<Object>} vertices 
     * @param {number} targetArea 
     * @param {number} totalArea 
     * @returns {number} N نسبة t
     */
    findTForArea: function (vertices, targetArea, totalArea) {
      if (targetArea <= 0) return 0;
      if (targetArea >= totalArea) return 1;
      let low = 0, high = 1, t = 0.5;
      for (let iter = 0; iter < 30; iter++) {
        t = (low + high) / 2;
        const currentArea = this.getLeftArea(vertices, t);
        if (Math.abs(currentArea - targetArea) < 0.0001) break;
        if (currentArea < targetArea) low = t;
        else high = t;
      }
      return t;
    },

    /**
     * حساب حالة الأنصبة والمتبقي والعجز الموحدة
     * @param {number} totalLandArea 
     * @param {Array<Object>} partners 
     * @param {Object} options { isManualPartition, isKeepAreaMode }
     * @returns {Object} calcState { totalLandArea, totalTargetArea, distributedArea, remainingArea, deficitArea, hasDeficit, activePartnersCount }
     */
    calculateState: function (totalLandArea, partners, options) {
      options = options || {};
      const landArea = parseFloat(totalLandArea) || 0;
      const list = Array.isArray(partners) ? partners : [];
      
      let totalTargetArea = 0;
      let totalDistributedArea = 0;
      let activeCount = 0;

      list.forEach(p => {
        if (!p.isExcluded) {
          activeCount++;
          const share = parseFloat(p.share || p.targetArea) || 0;
          totalTargetArea += share;
          totalDistributedArea += (options.isManualPartition ? (parseFloat(p.manualArea || share) || 0) : share);
        }
      });

      const usedArea = options.isManualPartition ? totalDistributedArea : totalTargetArea;
      const remainingArea = Number((landArea - usedArea).toFixed(9));

      return {
        totalLandArea: landArea,
        totalTargetArea: totalTargetArea,
        distributedArea: usedArea,
        remainingArea: remainingArea,
        deficitArea: remainingArea < -0.05 ? Math.abs(remainingArea) : 0,
        hasDeficit: (remainingArea < -0.05 && !options.isKeepAreaMode),
        activePartnersCount: activeCount
      };
    }
  };

  // تصدير المحرك الموحد للنطاق العام
  global.CalculationEngine = CalculationEngine;

})(typeof window !== "undefined" ? window : global);
