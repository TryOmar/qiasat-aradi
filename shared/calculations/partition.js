/**
 * ============================================================================
 * Qiasat-Aradi — Partition Engine (Commit 12.4.1)
 * Source of Truth for Pure Partition, Share Distribution & Divider Math
 * ============================================================================
 * Pure functions ONLY: No DOM, no window/global state mutation, no Canvas.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Partition = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var Partition = {
    version: '1.0.0',

    /**
     * Calculate equal share for a given count of partners
     * @param {number} totalArea 
     * @param {number} count 
     * @returns {number}
     */
    calculateEqualShare: function (totalArea, count) {
      var area = parseFloat(totalArea) || 0;
      var n = parseInt(count, 10) || 1;
      if (area <= 0 || n <= 0) return 0;
      return area / n;
    },

    /**
     * Calculate partner piece top & bottom width from area fraction
     * @param {number} topTotalW 
     * @param {number} botTotalW 
     * @param {number} shareArea 
     * @param {number} totalArea 
     * @returns {{topW: number, botW: number, ratio: number}}
     */
    calculatePieceWidths: function (topTotalW, botTotalW, shareArea, totalArea) {
      var wTop = parseFloat(topTotalW) || 0;
      var wBot = parseFloat(botTotalW) || 0;
      var sArea = parseFloat(shareArea) || 0;
      var tArea = parseFloat(totalArea) || 0;

      if (tArea <= 0 || sArea <= 0) {
        return { topW: 0, botW: 0, ratio: 0 };
      }

      var ratio = sArea / tArea;
      var pieceTopW = wTop * ratio;
      var pieceBotW = wBot * ratio;

      return {
        topW: pieceTopW,
        botW: pieceBotW,
        ratio: ratio
      };
    },

    /**
     * Linear interpolation of divider length between left and right boundary lengths
     * @param {number} leftTotalL 
     * @param {number} rightTotalL 
     * @param {number} cumulativeRatio - Cumulative width fraction (0.0 to 1.0)
     * @returns {number}
     */
    calculateInterpolatedLength: function (leftTotalL, rightTotalL, cumulativeRatio) {
      var lLeft = parseFloat(leftTotalL) || 0;
      var lRight = parseFloat(rightTotalL) || 0;
      var t = Math.max(0, Math.min(1, parseFloat(cumulativeRatio) || 0));

      return lLeft + t * (lRight - lLeft);
    },

    /**
     * Calculate piece area from top width, bottom width, and average length
     * @param {number} topW 
     * @param {number} botW 
     * @param {number} avgL 
     * @returns {number}
     */
    calculatePieceAreaFromWidths: function (topW, botW, avgL) {
      var w1 = parseFloat(topW) || 0;
      var w2 = parseFloat(botW) || 0;
      var l = parseFloat(avgL) || 0;
      return ((w1 + w2) / 2) * l;
    },

    /**
     * Rebalance shares among unlocked partners
     * @param {Array<{share: number, isLocked?: boolean}>} heirs 
     * @param {number} totalArea 
     * @returns {Array<number>} Array of rebalanced share values
     */
    rebalanceShares: function (heirs, totalArea) {
      var tArea = parseFloat(totalArea) || 0;
      if (!Array.isArray(heirs) || heirs.length === 0 || tArea <= 0) return [];

      var lockedArea = 0;
      var unlockedCount = 0;

      heirs.forEach(function (h) {
        if (h && h.isLocked) {
          lockedArea += (parseFloat(h.share) || 0);
        } else {
          unlockedCount++;
        }
      });

      var remainingArea = Math.max(0, tArea - lockedArea);
      var equalUnlockedShare = unlockedCount > 0 ? remainingArea / unlockedCount : 0;

      return heirs.map(function (h) {
        if (h && h.isLocked) {
          return parseFloat(h.share) || 0;
        }
        return equalUnlockedShare;
      });
    },

    /**
     * Transform or reverse partition order based on direction (RTL vs LTR)
     * @param {Array<*>} items 
     * @param {string} direction - 'rtl' or 'ltr'
     * @returns {Array<*>}
     */
    orderPartitionDirection: function (items, direction) {
      if (!Array.isArray(items)) return [];
      var dir = String(direction || 'rtl').toLowerCase();
      if (dir === 'ltr') {
        return items.slice().reverse();
      }
      return items.slice();
    }
  };

  return Partition;
}));
