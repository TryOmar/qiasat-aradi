/**
 * ============================================================================
 * Qiasat-Aradi — Croquis Core (Commit 13.1)
 * Source of Truth for Pure Rendering Geometry & Math Calculations
 * ============================================================================
 * Pure functions ONLY: No DOM, no SVG elements, no Canvas context, no events.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CroquisCore = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var CroquisCore = {
    version: '1.0.0',

    /**
     * Calculate 4-point polygon vertices for a partner slice
     * @param {number} topW 
     * @param {number} botW 
     * @param {number} leftL 
     * @param {number} rightL 
     * @param {number} cumTopRatio 
     * @param {number} cumBotRatio 
     * @returns {Array<{x: number, y: number}>}
     */
    calculatePiecePolygon: function (topW, botW, leftL, rightL, cumTopRatio, cumBotRatio) {
      var wTop = parseFloat(topW) || 0;
      var wBot = parseFloat(botW) || 0;
      var lLeft = parseFloat(leftL) || 0;
      var lRight = parseFloat(rightL) || 0;
      var rTop = Math.max(0, Math.min(1, parseFloat(cumTopRatio) || 0));
      var rBot = Math.max(0, Math.min(1, parseFloat(cumBotRatio) || 0));

      // Top-Left (p1), Top-Right (p2), Bottom-Right (p3), Bottom-Left (p4)
      var x1 = wTop * rTop;
      var y1 = 0;

      var x2 = wTop;
      var y2 = 0;

      var x3 = wBot;
      var y3 = lRight;

      var x4 = wBot * rBot;
      var y4 = lLeft;

      return [
        { x: x1, y: y1 },
        { x: x2, y: y2 },
        { x: x3, y: y3 },
        { x: x4, y: y4 }
      ];
    },

    /**
     * Calculate Centroid (center point) for a polygon to position labels & text
     * @param {Array<{x: number, y: number}>} vertices 
     * @returns {{x: number, y: number}}
     */
    calculateTextCentroid: function (vertices) {
      if (!Array.isArray(vertices) || vertices.length === 0) {
        return { x: 0, y: 0 };
      }

      var sumX = 0;
      var sumY = 0;
      var count = vertices.length;

      for (var i = 0; i < count; i++) {
        sumX += (parseFloat(vertices[i].x) || 0);
        sumY += (parseFloat(vertices[i].y) || 0);
      }

      return {
        x: sumX / count,
        y: sumY / count
      };
    },

    /**
     * Calculate divider line segment between top and bottom boundary points
     * @param {{x: number, y: number}} topPt 
     * @param {{x: number, y: number}} botPt 
     * @returns {{x1: number, y1: number, x2: number, y2: number, length: number}}
     */
    calculateDividerLine: function (topPt, botPt) {
      var pt1 = topPt || { x: 0, y: 0 };
      var pt2 = botPt || { x: 0, y: 0 };
      var dx = (parseFloat(pt2.x) || 0) - (parseFloat(pt1.x) || 0);
      var dy = (parseFloat(pt2.y) || 0) - (parseFloat(pt1.y) || 0);
      var len = Math.sqrt(dx * dx + dy * dy);

      return {
        x1: parseFloat(pt1.x) || 0,
        y1: parseFloat(pt1.y) || 0,
        x2: parseFloat(pt2.x) || 0,
        y2: parseFloat(pt2.y) || 0,
        length: len
      };
    },

    /**
     * Calculate rotation angle in degrees for text label alignment along a side
     * @param {{x: number, y: number}} p1 
     * @param {{x: number, y: number}} p2 
     * @returns {number} Angle in degrees (-180 to 180)
     */
    calculateLabelAngle: function (p1, p2) {
      var pt1 = p1 || { x: 0, y: 0 };
      var pt2 = p2 || { x: 0, y: 0 };
      var dx = (parseFloat(pt2.x) || 0) - (parseFloat(pt1.x) || 0);
      var dy = (parseFloat(pt2.y) || 0) - (parseFloat(pt1.y) || 0);
      var rad = Math.atan2(dy, dx);
      var deg = rad * (180 / Math.PI);
      return deg;
    },

    /**
     * Calculate bounding box (minX, minY, maxX, maxY, width, height) of polygon vertices
     * @param {Array<{x: number, y: number}>} points 
     * @returns {{minX: number, minY: number, maxX: number, maxY: number, width: number, height: number}}
     */
    calculatePolygonBounds: function (points) {
      if (!Array.isArray(points) || points.length === 0) {
        return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
      }

      var minX = Infinity;
      var minY = Infinity;
      var maxX = -Infinity;
      var maxY = -Infinity;

      points.forEach(function (pt) {
        var x = parseFloat(pt.x) || 0;
        var y = parseFloat(pt.y) || 0;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      });

      return {
        minX: minX,
        minY: minY,
        maxX: maxX,
        maxY: maxY,
        width: Math.max(0, maxX - minX),
        height: Math.max(0, maxY - minY)
      };
    },

    /**
     * Calculate optimal scale factor to fit croquis inside viewport dimensions
     * @param {number} boundingWidth 
     * @param {number} boundingHeight 
     * @param {number} viewportWidth 
     * @param {number} viewportHeight 
     * @param {number} [marginPercentage] - Default: 0.10 (10% padding)
     * @returns {number}
     */
    calculateScale: function (boundingWidth, boundingHeight, viewportWidth, viewportHeight, marginPercentage) {
      var bW = parseFloat(boundingWidth) || 1;
      var bH = parseFloat(boundingHeight) || 1;
      var vW = parseFloat(viewportWidth) || 1;
      var vH = parseFloat(viewportHeight) || 1;
      var margin = typeof marginPercentage === 'number' ? marginPercentage : 0.10;

      var availW = vW * (1 - 2 * margin);
      var availH = vH * (1 - 2 * margin);

      var scaleX = availW / bW;
      var scaleY = availH / bH;

      return Math.min(scaleX, scaleY);
    },

    /**
     * Calculate centered translation offset (x, y) for rendering croquis in canvas/viewport
     * @param {number} boundingWidth 
     * @param {number} boundingHeight 
     * @param {number} scale 
     * @param {number} viewportWidth 
     * @param {number} viewportHeight 
     * @returns {{offsetX: number, offsetY: number}}
     */
    calculateOffset: function (boundingWidth, boundingHeight, scale, viewportWidth, viewportHeight) {
      var bW = parseFloat(boundingWidth) || 0;
      var bH = parseFloat(boundingHeight) || 0;
      var s = parseFloat(scale) || 1;
      var vW = parseFloat(viewportWidth) || 0;
      var vH = parseFloat(viewportHeight) || 0;

      var scaledW = bW * s;
      var scaledH = bH * s;

      var offX = (vW - scaledW) / 2;
      var offY = (vH - scaledH) / 2;

      return {
        offsetX: offX,
        offsetY: offY
      };
    }
  };

  return CroquisCore;
}));
