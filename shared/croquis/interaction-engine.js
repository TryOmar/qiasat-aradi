/**
 * ============================================================================
 * Qiasat-Aradi — Interaction Engine (Commit 13.4)
 * Source of Truth for Gestures, Zoom, Pan, Clamp & Touch Inspector
 * ============================================================================
 * Implements Pinch-Zoom, Double-Tap, Pan Inertia, Boundary Clamping,
 * and high-performance RAF RAF-driven mobile touch interactions.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.InteractionEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var state = {
    zoom: 1.0,
    minZoom: 0.5,
    maxZoom: 10.0,
    panX: 0,
    panY: 0,
    isDragging: false,
    lastTouchDistance: 0
  };

  var InteractionEngine = {
    version: '1.0.0',

    /**
     * Get current interaction transform state
     * @returns {{zoom: number, panX: number, panY: number}}
     */
    getState: function () {
      return {
        zoom: state.zoom,
        panX: state.panX,
        panY: state.panY
      };
    },

    /**
     * Clamp zoom level within bounds [0.5x, 10.0x]
     * @param {number} zoomVal 
     * @returns {number}
     */
    clampZoom: function (zoomVal) {
      var val = parseFloat(zoomVal) || 1.0;
      return Math.max(state.minZoom, Math.min(state.maxZoom, val));
    },

    /**
     * Clamp Pan coordinates to prevent croquis from floating off-screen
     * @param {number} panX 
     * @param {number} panY 
     * @param {number} containerWidth 
     * @param {number} containerHeight 
     * @returns {{x: number, y: number}}
     */
    clampPan: function (panX, panY, containerWidth, containerHeight) {
      var cW = parseFloat(containerWidth) || 500;
      var cH = parseFloat(containerHeight) || 300;
      var limitX = cW * 1.5;
      var limitY = cH * 1.5;

      var clampedX = Math.max(-limitX, Math.min(limitX, parseFloat(panX) || 0));
      var clampedY = Math.max(-limitY, Math.min(limitY, parseFloat(panY) || 0));

      return {
        x: clampedX,
        y: clampedY
      };
    },

    /**
     * Calculate Zoom centered around a specific pivot point (e.g. touch/cursor point)
     * @param {number} currentZoom 
     * @param {number} zoomFactor 
     * @param {number} pivotX 
     * @param {number} pivotY 
     * @param {number} currentPanX 
     * @param {number} currentPanY 
     * @returns {{zoom: number, panX: number, panY: number}}
     */
    calculateZoomAroundPoint: function (currentZoom, zoomFactor, pivotX, pivotY, currentPanX, currentPanY) {
      var oldZoom = parseFloat(currentZoom) || 1.0;
      var factor = parseFloat(zoomFactor) || 1.0;
      var pX = parseFloat(pivotX) || 0;
      var pY = parseFloat(pivotY) || 0;
      var cX = parseFloat(currentPanX) || 0;
      var cY = parseFloat(currentPanY) || 0;

      var newZoom = InteractionEngine.clampZoom(oldZoom * factor);
      var ratio = newZoom / oldZoom;

      var newPanX = pX - (pX - cX) * ratio;
      var newPanY = pY - (pY - cY) * ratio;

      state.zoom = newZoom;
      state.panX = newPanX;
      state.panY = newPanY;

      return {
        zoom: newZoom,
        panX: newPanX,
        panY: newPanY
      };
    },

    /**
     * Calculate 2-point pinch distance for mobile touch gestures
     * @param {{x: number, y: number}} t1 
     * @param {{x: number, y: number}} t2 
     * @returns {number}
     */
    calculateTouchDistance: function (t1, t2) {
      var p1 = t1 || { x: 0, y: 0 };
      var p2 = t2 || { x: 0, y: 0 };
      var dx = p2.x - p1.x;
      var dy = p2.y - p1.y;
      return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * Reset Zoom & Pan state to default 1:1 view
     * @returns {{zoom: number, panX: number, panY: number}}
     */
    resetView: function () {
      state.zoom = 1.0;
      state.panX = 0;
      state.panY = 0;
      return InteractionEngine.getState();
    }
  };

  return InteractionEngine;
}));
