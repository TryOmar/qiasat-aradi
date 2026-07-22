/**
 * ============================================================================
 * Qiasat-Aradi — Geometry Engine (Commit 12.1)
 * Source of Truth for Pure Geometric & Area Calculations
 * ============================================================================
 * Pure functions ONLY: No DOM, no window/global state mutation, no Canvas.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Geometry = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var Geometry = {
    version: '1.0.0',

    /**
     * Calculate Rectangle Area
     * @param {number} width 
     * @param {number} length 
     * @returns {number}
     */
    calculateRectangleArea: function (width, length) {
      var w = parseFloat(width) || 0;
      var l = parseFloat(length) || 0;
      return w * l;
    },

    /**
     * Calculate Square Area
     * @param {number} side 
     * @returns {number}
     */
    calculateSquareArea: function (side) {
      var s = parseFloat(side) || 0;
      return s * s;
    },

    /**
     * Calculate Trapezoid Average Width Area
     * @param {number} topW - Top width (C)
     * @param {number} botW - Bottom width (A)
     * @param {number} leftL - Left length (B)
     * @param {number} rightL - Right length (D)
     * @returns {number}
     */
    calculateTrapezoidArea: function (topW, botW, leftL, rightL) {
      var w1 = parseFloat(topW) || 0;
      var w2 = parseFloat(botW) || 0;
      var l1 = parseFloat(leftL) || 0;
      var l2 = parseFloat(rightL) || 0;
      var avgW = (w1 + w2) / 2;
      var avgL = (l1 + l2) / 2;
      return avgW * avgL;
    },

    /**
     * Calculate Heron's Formula Area for a Triangle with sides a, b, c
     * @param {number} a 
     * @param {number} b 
     * @param {number} c 
     * @returns {number}
     */
    calculateHeronArea: function (a, b, c) {
      var s1 = parseFloat(a) || 0;
      var s2 = parseFloat(b) || 0;
      var s3 = parseFloat(c) || 0;
      if (s1 <= 0 || s2 <= 0 || s3 <= 0) return 0;
      if ((s1 + s2 <= s3) || (s1 + s3 <= s2) || (s2 + s3 <= s1)) return 0;
      var sem = (s1 + s2 + s3) / 2;
      var rad = sem * (sem - s1) * (sem - s2) * (sem - s3);
      return rad > 0 ? Math.sqrt(rad) : 0;
    },

    /**
     * Calculate Polygon / Quadrilateral Area using Shoelace Formula
     * @param {Array<{x: number, y: number}>} points 
     * @returns {number}
     */
    calculateShoelaceArea: function (points) {
      if (!Array.isArray(points) || points.length < 3) return 0;
      var area = 0;
      var j = points.length - 1;
      for (var i = 0; i < points.length; i++) {
        area += (points[j].x + points[i].x) * (points[j].y - points[i].y);
        j = i;
      }
      return Math.abs(area / 2);
    },

    /**
     * Calculate Average Width between top and bottom width
     * @param {number} topW 
     * @param {number} botW 
     * @returns {number}
     */
    calculateAverageWidth: function (topW, botW) {
      var w1 = parseFloat(topW) || 0;
      var w2 = parseFloat(botW) || 0;
      return (w1 + w2) / 2;
    },

    /**
     * Calculate Average Length between left and right length
     * @param {number} leftL 
     * @param {number} rightL 
     * @returns {number}
     */
    calculateAverageLength: function (leftL, rightL) {
      var l1 = parseFloat(leftL) || 0;
      var l2 = parseFloat(rightL) || 0;
      return (l1 + l2) / 2;
    }
  };

  return Geometry;
}));
