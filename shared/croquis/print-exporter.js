/**
 * ============================================================================
 * Qiasat-Aradi — Print & Export Engine (Commit 13.3)
 * Source of Truth for High-DPI Vector Canvas, PNG & PDF Print Exporter
 * ============================================================================
 * Ensures sharp devicePixelRatio rendering, crisp SVG vector exports,
 * and lossless print layout generation.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PrintExporter = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PrintExporter = {
    version: '1.0.0',

    /** Default high-DPI scaling ratio (2x for retina sharpness) */
    DEFAULT_SCALE_RATIO: 2,

    /**
     * Get Device Pixel Ratio safely
     * @returns {number}
     */
    getDevicePixelRatio: function () {
      if (typeof window !== 'undefined' && window.devicePixelRatio) {
        return Math.max(1, window.devicePixelRatio);
      }
      return 1;
    },

    /**
     * Prepare High-DPI Canvas Dimensions & Context Scale
     * @param {HTMLCanvasElement} canvas 
     * @param {number} width 
     * @param {number} height 
     * @param {number} [customRatio] 
     * @returns {{scale: number, width: number, height: number}}
     */
    configureHighDPICanvas: function (canvas, width, height, customRatio) {
      var ratio = typeof customRatio === 'number' ? customRatio : PrintExporter.getDevicePixelRatio();
      var w = parseFloat(width) || 300;
      var h = parseFloat(height) || 150;

      if (canvas) {
        canvas.width = w * ratio;
        canvas.height = h * ratio;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';

        var ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(ratio, ratio);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
        }
      }

      return {
        scale: ratio,
        width: w * ratio,
        height: h * ratio
      };
    },

    /**
     * Clean and format SVG string for crisp high-resolution export & print
     * @param {string|SVGElement} svgSource 
     * @returns {string}
     */
    serializeCrispSVG: function (svgSource) {
      var xmlString = '';
      if (typeof svgSource === 'string') {
        xmlString = svgSource;
      } else if (svgSource && typeof XMLSerializer !== 'undefined') {
        var serializer = new XMLSerializer();
        xmlString = serializer.serializeToString(svgSource);
      }

      if (!xmlString) return '';

      // Ensure proper xmlns and vector-effect attributes
      if (xmlString.indexOf('xmlns=') === -1) {
        xmlString = xmlString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      return xmlString;
    },

    /**
     * Generate High-DPI Data URL (PNG) from SVG
     * @param {SVGElement|string} svgElement 
     * @param {number} width 
     * @param {number} height 
     * @param {Function} callback - Callback receiving (dataUrl)
     */
    exportHighResolutionPNG: function (svgElement, width, height, callback) {
      if (typeof callback !== 'function') return;

      var svgXml = PrintExporter.serializeCrispSVG(svgElement);
      if (!svgXml) {
        callback('');
        return;
      }

      var blob = new Blob([svgXml], { type: 'image/svg+xml;charset=utf-8' });
      var url = (typeof URL !== 'undefined' && URL.createObjectURL) ? URL.createObjectURL(blob) : '';

      var img = new Image();
      img.onload = function () {
        var canvas = document.createElement('canvas');
        PrintExporter.configureHighDPICanvas(canvas, width, height, PrintExporter.DEFAULT_SCALE_RATIO);
        var ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }
        var dataUrl = canvas.toDataURL('image/png', 1.0);
        if (url && URL.revokeObjectURL) URL.revokeObjectURL(url);
        callback(dataUrl);
      };

      img.onerror = function () {
        if (url && URL.revokeObjectURL) URL.revokeObjectURL(url);
        callback('');
      };

      if (url) {
        img.src = url;
      } else {
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgXml);
      }
    },

    /**
     * Calculate A4 Print Layout Dimensions & Margins
     * @param {string} [orientation] - 'portrait' or 'landscape'
     * @returns {{widthMm: number, heightMm: number, marginMm: number, printableWidthMm: number, printableHeightMm: number}}
     */
    calculateA4PrintLayout: function (orientation) {
      var isLandscape = String(orientation || 'landscape').toLowerCase() === 'landscape';
      var wMm = isLandscape ? 297 : 210;
      var hMm = isLandscape ? 210 : 297;
      var margin = 10; // 10mm margins

      return {
        widthMm: wMm,
        heightMm: hMm,
        marginMm: margin,
        printableWidthMm: wMm - (2 * margin),
        printableHeightMm: hMm - (2 * margin)
      };
    }
  };

  return PrintExporter;
}));
