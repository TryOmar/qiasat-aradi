/**
 * ============================================================================
 * Qiasat-Aradi — Render Scheduler Engine (Commit 13.2)
 * High-Performance RAF, Debounce, Throttle & Render Queue Manager
 * ============================================================================
 * Prevents redundant re-renders, enforces 60 FPS smooth interactions,
 * and batches multi-input events into single frame updates.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.RenderScheduler = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var scheduledFrameId = null;
  var isRenderPending = false;
  var debounceTimers = {};
  var lastSignature = '';
  var renderMetrics = {
    totalCallsBlocked: 0,
    totalFramesRendered: 0,
    lastRenderDurationMs: 0
  };

  var RenderScheduler = {
    version: '1.0.0',

    /**
     * Request high-performance frame render (scheduled via requestAnimationFrame)
     * @param {Function} renderFn - Target render callback
     * @param {string} [signature] - State signature string to prevent unchanged re-renders
     */
    requestRender: function (renderFn, signature) {
      if (typeof renderFn !== 'function') return;

      // Signature bypass check: if data has not changed, skip render
      if (signature && signature === lastSignature) {
        renderMetrics.totalCallsBlocked++;
        return;
      }

      if (signature) {
        lastSignature = signature;
      }

      if (isRenderPending) {
        renderMetrics.totalCallsBlocked++;
        return;
      }

      isRenderPending = true;

      var raf = typeof requestAnimationFrame === 'function' 
        ? requestAnimationFrame 
        : function (cb) { setTimeout(cb, 16); };

      scheduledFrameId = raf(function () {
        isRenderPending = false;
        var start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        
        try {
          renderFn();
        } catch (err) {
          console.error('[RenderScheduler] Error executing render function:', err);
        }

        var end = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        renderMetrics.lastRenderDurationMs = end - start;
        renderMetrics.totalFramesRendered++;
      });
    },

    /**
     * Debounced render wrapper for rapid input events (e.g. keyup/typing)
     * @param {string} key - Unique timer identifier key
     * @param {Function} fn - Render function callback
     * @param {number} [delayMs] - Default 30ms delay
     */
    debounce: function (key, fn, delayMs) {
      var d = typeof delayMs === 'number' ? delayMs : 30;
      if (debounceTimers[key]) {
        clearTimeout(debounceTimers[key]);
      }
      debounceTimers[key] = setTimeout(function () {
        delete debounceTimers[key];
        RenderScheduler.requestRender(fn);
      }, d);
    },

    /**
     * Cancel pending animation frame or debounce timer
     */
    cancel: function () {
      if (scheduledFrameId && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(scheduledFrameId);
        scheduledFrameId = null;
      }
      isRenderPending = false;
    },

    /**
     * Reset state signature cache
     */
    resetSignature: function () {
      lastSignature = '';
    },

    /**
     * Get scheduler performance metrics
     */
    getMetrics: function () {
      return {
        totalCallsBlocked: renderMetrics.totalCallsBlocked,
        totalFramesRendered: renderMetrics.totalFramesRendered,
        lastRenderDurationMs: renderMetrics.lastRenderDurationMs
      };
    }
  };

  return RenderScheduler;
}));
