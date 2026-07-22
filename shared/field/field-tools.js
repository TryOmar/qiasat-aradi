/**
 * ============================================================================
 * Qiasat-Aradi — Advanced Field Tools (Commit 15.4)
 * Source of Truth for Field Operations: Piece Merging, Direct Distance Measurement,
 * Table-Croquis Highlight Sync, Piece Locking & Partner Drag Reordering
 * ============================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FieldTools = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var lockedPieces = {};
  var activeHighlightId = null;

  var FieldTools = {
    version: '1.0.0',

    /**
     * Merge 2 partner pieces into a single combined piece
     * @param {Object} p1 
     * @param {Object} p2 
     * @returns {Object|null}
     */
    mergePieces: function (p1, p2) {
      if (!p1 || !p2) return null;

      var name1 = p1.name || 'شريك 1';
      var name2 = p2.name || 'شريك 2';

      return {
        id: 'merged_' + Date.now(),
        name: name1 + ' + ' + name2,
        feddans: (p1.feddans || 0) + (p2.feddans || 0),
        carats: (p1.carats || 0) + (p2.carats || 0),
        shares: (p1.shares || 0) + (p2.shares || 0),
        area: (parseFloat(p1.area) || 0) + (parseFloat(p2.area) || 0),
        ratio: (parseFloat(p1.ratio) || 0) + (parseFloat(p2.ratio) || 0)
      };
    },

    /**
     * Lock or unlock piece from modification
     * @param {string} pieceId 
     * @param {boolean} [isLocked] 
     * @returns {boolean} Current lock state
     */
    lockPiece: function (pieceId, isLocked) {
      if (!pieceId) return false;
      if (typeof isLocked === 'boolean') {
        lockedPieces[pieceId] = isLocked;
      } else {
        lockedPieces[pieceId] = !lockedPieces[pieceId];
      }
      return !!lockedPieces[pieceId];
    },

    /**
     * Check if piece is locked
     * @param {string} pieceId 
     * @returns {boolean}
     */
    isPieceLocked: function (pieceId) {
      return !!lockedPieces[pieceId];
    },

    /**
     * Calculate direct distance between 2 points on croquis canvas
     * @param {{x: number, y: number}} pt1 
     * @param {{x: number, y: number}} pt2 
     * @param {number} [scaleMetersPerPx] 
     * @returns {number} Distance in meters
     */
    calculateDistanceBetweenPoints: function (pt1, pt2, scaleMetersPerPx) {
      var p1 = pt1 || { x: 0, y: 0 };
      var p2 = pt2 || { x: 0, y: 0 };
      var scale = parseFloat(scaleMetersPerPx) || 1.0;

      var dx = p2.x - p1.x;
      var dy = p2.y - p1.y;
      var distPx = Math.sqrt(dx * dx + dy * dy);

      return distPx * scale;
    },

    /**
     * Reorder partners list (Drag and Drop)
     * @param {Array<Object>} list 
     * @param {number} fromIndex 
     * @param {number} toIndex 
     * @returns {Array<Object>}
     */
    reorderPartnersList: function (list, fromIndex, toIndex) {
      if (!Array.isArray(list)) return [];
      var result = Array.from(list);
      if (fromIndex < 0 || fromIndex >= result.length || toIndex < 0 || toIndex >= result.length) {
        return result;
      }

      var item = result.splice(fromIndex, 1)[0];
      result.splice(toIndex, 0, item);
      return result;
    },

    /**
     * Synchronize visual highlight between table row and croquis polygon
     * @param {string} partnerId 
     * @returns {boolean}
     */
    syncHighlightTableCroquis: function (partnerId) {
      activeHighlightId = partnerId || null;

      if (typeof document !== 'undefined') {
        // Clear previous highlights
        var prevTableRows = document.querySelectorAll('.highlighted-partner-row');
        prevTableRows.forEach(function (tr) { tr.classList.remove('highlighted-partner-row'); });

        var prevPolygons = document.querySelectorAll('.highlighted-croquis-piece');
        prevPolygons.forEach(function (poly) { poly.classList.remove('highlighted-croquis-piece'); });

        if (partnerId) {
          var row = document.getElementById('partner-row-' + partnerId);
          if (row) row.classList.add('highlighted-partner-row');

          var poly = document.getElementById('croquis-piece-' + partnerId);
          if (poly) poly.classList.add('highlighted-croquis-piece');
        }
      }

      return !!activeHighlightId;
    }
  };

  return FieldTools;
}));
