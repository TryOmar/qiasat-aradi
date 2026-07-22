/**
 * ============================================================================
 * Qiasat-Aradi — Unit Conversion Engine (Commit 12.2)
 * Source of Truth for Area, Agricultural Units & Fraction Conversions
 * ============================================================================
 * Pure functions ONLY: No DOM, no window/global state mutation, no Canvas.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Units = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var Units = {
    version: '1.0.0',

    /** Default carat size in square meters (standard 175.035 m² or custom 168/171.388) */
    DEFAULT_CARAT_SIZE: 175.035,

    /** Conversion Constants */
    METERS_PER_QASABA: 3.55,       // 1 qasaba = 3.55 meters
    QABDAS_PER_QASABA: 24,         // 1 qasaba = 24 qabdas

    /**
     * Format number with fixed decimal precision safely
     * @param {number|string} val 
     * @param {number} decimals 
     * @returns {string}
     */
    formatNum: function (val, decimals) {
      var num = parseFloat(val);
      if (isNaN(num)) return '0';
      var d = typeof decimals === 'number' ? decimals : 2;
      return num.toFixed(d);
    },

    /**
     * Format area in square meters
     * @param {number|string} value 
     * @returns {string}
     */
    formatArea: function (value) {
      var num = parseFloat(value);
      if (isNaN(num)) return '0.00 م²';
      return num.toFixed(2) + ' م²';
    },

    /**
     * Convert Square Meters (m²) to Feddans, Carats, and Shares
     * @param {number} sqm - Area in square meters
     * @param {number} [caratSize] - Carat area size (default: 175.035)
     * @returns {{feddans: number, carats: number, shares: number}}
     */
    convertSqmToFeddans: function (sqm, caratSize) {
      var area = parseFloat(sqm) || 0;
      var cSize = parseFloat(caratSize) || Units.DEFAULT_CARAT_SIZE;
      if (area <= 0 || cSize <= 0) {
        return { feddans: 0, carats: 0, shares: 0 };
      }

      var totalCarats = area / cSize;
      var feddans = Math.floor(totalCarats / 24);
      var remCarats = totalCarats - (feddans * 24);
      var carats = Math.floor(remCarats);
      var remShares = (remCarats - carats) * 24;
      var shares = Number(remShares.toFixed(4));

      return {
        feddans: feddans,
        carats: carats,
        shares: shares
      };
    },

    /**
     * Convert Feddans, Carats, Shares to Square Meters (m²)
     * @param {number} feddans 
     * @param {number} carats 
     * @param {number} shares 
     * @param {number} [caratSize] 
     * @returns {number}
     */
    convertFeddansToSqm: function (feddans, carats, shares, caratSize) {
      var f = parseFloat(feddans) || 0;
      var c = parseFloat(carats) || 0;
      var s = parseFloat(shares) || 0;
      var cSize = parseFloat(caratSize) || Units.DEFAULT_CARAT_SIZE;

      var totalCarats = (f * 24) + c + (s / 24);
      return totalCarats * cSize;
    },

    /**
     * Parse Fraction or Percentage string (e.g., "1/4", "1/2", "0.25", "25%")
     * @param {string|number} str 
     * @returns {number} Fraction value between 0 and 1
     */
    parseFraction: function (str) {
      if (typeof str === 'number') {
        return str > 1 ? str / 100 : Math.max(0, str);
      }
      var clean = String(str || '').trim().replace(/%/g, '');
      if (!clean) return 0;

      if (clean.indexOf('/') !== -1) {
        var parts = clean.split('/');
        var num = parseFloat(parts[0]);
        var den = parseFloat(parts[1]);
        if (!isNaN(num) && !isNaN(den) && den !== 0) {
          return Math.max(0, num / den);
        }
      }

      var val = parseFloat(clean);
      if (isNaN(val)) return 0;
      return val > 1 ? val / 100 : Math.max(0, val);
    },

    /**
     * Calculate percentage of part area relative to total area
     * @param {number} partArea 
     * @param {number} totalArea 
     * @returns {number}
     */
    calculatePercentages: function (partArea, totalArea) {
      var part = parseFloat(partArea) || 0;
      var total = parseFloat(totalArea) || 0;
      if (total <= 0) return 0;
      return (part / total) * 100;
    },

    /**
     * Convert Qasaba to Meters
     * @param {number} qasabas 
     * @returns {number}
     */
    convertQasabaToMeters: function (qasabas) {
      var q = parseFloat(qasabas) || 0;
      return q * Units.METERS_PER_QASABA;
    },

    /**
     * Convert Meters to Qasaba
     * @param {number} meters 
     * @returns {number}
     */
    convertMetersToQasabas: function (meters) {
      var m = parseFloat(meters) || 0;
      return m / Units.METERS_PER_QASABA;
    },

    /**
     * Convert Qabda to Meters
     * @param {number} qabdas 
     * @returns {number}
     */
    convertQabdaToMeters: function (qabdas) {
      var q = parseFloat(qabdas) || 0;
      var metersPerQabda = Units.METERS_PER_QASABA / Units.QABDAS_PER_QASABA;
      return q * metersPerQabda;
    },

    /**
     * Convert Meters to Qabda
     * @param {number} meters 
     * @returns {number}
     */
    convertMetersToQabdas: function (meters) {
      var m = parseFloat(meters) || 0;
      var metersPerQabda = Units.METERS_PER_QASABA / Units.QABDAS_PER_QASABA;
      return m / metersPerQabda;
    }
  };

  return Units;
}));
