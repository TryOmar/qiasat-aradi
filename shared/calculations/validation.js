/**
 * ============================================================================
 * Qiasat-Aradi — Validation Engine (Commit 12.3)
 * Source of Truth for Input, Geometric & Numerical Stability Validation
 * ============================================================================
 * Pure functions ONLY: No DOM, no window/global state mutation, no Canvas.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Validation = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var Validation = {
    version: '1.0.0',

    /** Default numerical stability tolerance epsilon in m² */
    DEFAULT_EPSILON: 0.001,

    /**
     * Check if two floating point numbers are nearly equal within epsilon tolerance
     * @param {number} a 
     * @param {number} b 
     * @param {number} [epsilon] 
     * @returns {boolean}
     */
    nearlyEqual: function (a, b, epsilon) {
      var n1 = parseFloat(a) || 0;
      var n2 = parseFloat(b) || 0;
      var eps = typeof epsilon === 'number' ? epsilon : Validation.DEFAULT_EPSILON;
      return Math.abs(n1 - n2) <= eps;
    },

    /**
     * Validate if value is a positive finite number
     * @param {*} val 
     * @returns {boolean}
     */
    validatePositiveNumber: function (val) {
      var num = parseFloat(val);
      return !isNaN(num) && isFinite(num) && num > 0;
    },

    /**
     * Validate if value is a finite number (>= 0)
     * @param {*} val 
     * @returns {boolean}
     */
    validateFiniteNumber: function (val) {
      var num = parseFloat(val);
      return !isNaN(num) && isFinite(num) && num >= 0;
    },

    /**
     * Validate standard land dimensions (w1, w2, l1, l2)
     * @param {number} w1 
     * @param {number} w2 
     * @param {number} l1 
     * @param {number} l2 
     * @returns {{ok: boolean, message: string}}
     */
    validateDimensions: function (w1, w2, l1, l2) {
      var topW = parseFloat(w1) || 0;
      var botW = parseFloat(w2) || 0;
      var leftL = parseFloat(l1) || 0;
      var rightL = parseFloat(l2) || 0;

      if (topW <= 0 && botW <= 0) {
        return { ok: false, message: 'العرض يجب أن يكون أكبر من الصفر' };
      }
      if (leftL <= 0 && rightL <= 0) {
        return { ok: false, message: 'الطول يجب أن يكون أكبر من الصفر' };
      }
      return { ok: true, message: 'الأبعاد صحيحة' };
    },

    /**
     * Validate Triangle inequality theorem (a + b > c, a + c > b, b + c > a)
     * @param {number} a 
     * @param {number} b 
     * @param {number} c 
     * @returns {{ok: boolean, message: string}}
     */
    validateTriangle: function (a, b, c) {
      var s1 = parseFloat(a) || 0;
      var s2 = parseFloat(b) || 0;
      var s3 = parseFloat(c) || 0;

      if (s1 <= 0 || s2 <= 0 || s3 <= 0) {
        return { ok: false, message: 'أضلاع المثلث يجب أن تكون أكبر من الصفر' };
      }

      if ((s1 + s2 <= s3) || (s1 + s3 <= s2) || (s2 + s3 <= s1)) {
        return { ok: false, message: 'متباينة المثلث غير محققة (مجموع أي ضلعين يجب أن يكون أكبر من الضلع الثالث)' };
      }

      return { ok: true, message: 'أضلاع المثلث صحيحة هندسياً' };
    },

    /**
     * Validate Heron Triangle area calculation feasibility
     * @param {number} a 
     * @param {number} b 
     * @param {number} c 
     * @returns {boolean}
     */
    validateHeronTriangle: function (a, b, c) {
      return Validation.validateTriangle(a, b, c).ok;
    },

    /**
     * Validate Quadrilateral side lengths feasibility
     * @param {number} a 
     * @param {number} b 
     * @param {number} c 
     * @param {number} d 
     * @returns {{ok: boolean, message: string}}
     */
    validateQuadrilateral: function (a, b, c, d) {
      var s1 = parseFloat(a) || 0;
      var s2 = parseFloat(b) || 0;
      var s3 = parseFloat(c) || 0;
      var s4 = parseFloat(d) || 0;

      if (s1 <= 0 || s2 <= 0 || s3 <= 0 || s4 <= 0) {
        return { ok: false, message: 'جميع أضلاع الشكل الرباعي يجب أن تكون أكبر من الصفر' };
      }

      var maxSide = Math.max(s1, s2, s3, s4);
      var sumOthers = (s1 + s2 + s3 + s4) - maxSide;

      if (sumOthers <= maxSide) {
        return { ok: false, message: 'الضلع الأطول يتجاوز مجموع الأضلاع الثلاثة الأخرى' };
      }

      return { ok: true, message: 'أضلاع الشكل الرباعي صحيحة' };
    },

    /**
     * Validate Quadrilateral Diagonals (AC and BD)
     * @param {number} a - Side AB
     * @param {number} b - Side BC
     * @param {number} c - Side CD
     * @param {number} d - Side DA
     * @param {number} ac - Diagonal AC
     * @param {number} bd - Diagonal BD
     * @returns {{ok: boolean, message: string}}
     */
    validateQuadrilateralDiagonals: function (a, b, c, d, ac, bd) {
      var diagAC = parseFloat(ac) || 0;
      var diagBD = parseFloat(bd) || 0;

      if (diagAC > 0) {
        // Triangle ABC (a, b, ac) and Triangle ADC (d, c, ac)
        var t1 = Validation.validateTriangle(a, b, diagAC);
        var t2 = Validation.validateTriangle(d, c, diagAC);
        if (!t1.ok || !t2.ok) {
          return { ok: false, message: 'القطر AC غير متوافق هندسياً مع أضلاع الأرض' };
        }
      }

      if (diagBD > 0) {
        // Triangle ABD (a, d, bd) and Triangle BCD (b, c, bd)
        var t3 = Validation.validateTriangle(a, d, diagBD);
        var t4 = Validation.validateTriangle(b, c, diagBD);
        if (!t3.ok || !t4.ok) {
          return { ok: false, message: 'القطر BD غير متوافق هندسياً مع أضلاع الأرض' };
        }
      }

      return { ok: true, message: 'الأقطار متوافقة هندسياً' };
    },

    /**
     * Validate Numerical Stability of shares sum against total area
     * @param {number} sumShares 
     * @param {number} totalArea 
     * @param {number} [epsilon] 
     * @returns {{ok: boolean, diff: number, message: string}}
     */
    validateNumericalStability: function (sumShares, totalArea, epsilon) {
      var sum = parseFloat(sumShares) || 0;
      var total = parseFloat(totalArea) || 0;
      var eps = typeof epsilon === 'number' ? epsilon : Validation.DEFAULT_EPSILON;
      var diff = Math.abs(sum - total);

      if (diff <= eps) {
        return { ok: true, diff: diff, message: 'استقرار عددي ممتاز' };
      }
      return { ok: false, diff: diff, message: 'تفاوت عددي يجاوز هامش السماح' };
    },

    /**
     * Validate Area non-negativity
     * @param {number} area 
     * @returns {boolean}
     */
    validateArea: function (area) {
      return Validation.validateFiniteNumber(area) && parseFloat(area) > 0;
    },

    /**
     * Validate Total Area
     * @param {number} area 
     * @returns {boolean}
     */
    validateTotalArea: function (area) {
      return Validation.validatePositiveNumber(area);
    },

    /**
     * Validate Remaining Area non-negativity
     * @param {number} remArea 
     * @param {number} totalArea 
     * @returns {boolean}
     */
    validateRemainingArea: function (remArea, totalArea) {
      var rem = parseFloat(remArea) || 0;
      var tot = parseFloat(totalArea) || 0;
      return rem >= -Validation.DEFAULT_EPSILON && rem <= (tot + Validation.DEFAULT_EPSILON);
    },

    /**
     * Validate Shares Sum against Total Area
     * @param {number} sharesSum 
     * @param {number} totalArea 
     * @returns {boolean}
     */
    validateShares: function (sharesSum, totalArea) {
      return Validation.nearlyEqual(sharesSum, totalArea);
    },

    /**
     * Validate Percentages sum equal to 100%
     * @param {number} pctSum 
     * @returns {boolean}
     */
    validatePercentages: function (pctSum) {
      return Validation.nearlyEqual(pctSum, 100, 0.05);
    }
  };

  return Validation;
}));
