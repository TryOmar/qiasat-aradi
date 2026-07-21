/**
 * @file shared/engines/croquis-engine.js
 * @description محرك الرسم والكروكي الهندسي الموحد لتطبيق الدَّلاَّل (Croquis Engine)
 * @version 1.0.0
 * @see docs/ROADMAP_COMMIT13.md
 */

(function (global) {
  "use strict";

  const CroquisEngine = {
    /**
     * حساب الهوامش والمساحة المثالية للـ ViewBox بناءً على حدود الرسم
     * @param {Object} bbox { x, y, width, height }
     * @returns {Object} { vbX, vbY, vbW, vbH, margin }
     */
    calculateViewportMargins: function (bbox) {
      if (!bbox || bbox.width <= 0 || bbox.height <= 0) {
        return { vbX: 0, vbY: 0, vbW: 600, vbH: 400, margin: 25 };
      }
      const maxDim = Math.max(bbox.width, bbox.height);
      const margin = Math.max(25, maxDim * 0.035);

      const vbX = Math.round(bbox.x - margin);
      const vbY = Math.round(bbox.y - margin);
      const vbW = Math.round(bbox.width + margin * 2);
      const vbH = Math.round(bbox.height + margin * 2);

      return { vbX, vbY, vbW, vbH, margin };
    },

    /**
     * رسم وتلوين قطعة المتبقي/العجز ككيان مستقل
     * @param {Object} target SVGElement أو CanvasRenderingContext2D
     * @param {Object} pieceData بيانات القطعة { isRemainder, isDeficit, area, points }
     */
    drawRemainderPiece: function (target, pieceData) {
      if (!pieceData || !target) return;
      const isDeficit = pieceData.isDeficit || (pieceData.area < 0);
      const fillColor = isDeficit ? "rgba(239, 83, 80, 0.25)" : "rgba(255, 213, 79, 0.35)";
      const strokeColor = isDeficit ? "#d32f2f" : "#f57f17";

      if (target instanceof SVGElement || (target.ownerDocument && target.tagName)) {
        // SVG Implementation
        let pathEl = target.querySelector(".remainder-piece-path");
        if (!pathEl) {
          pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
          pathEl.setAttribute("class", "remainder-piece-path");
          target.appendChild(pathEl);
        }
        if (pieceData.d) {
          pathEl.setAttribute("d", pieceData.d);
          pathEl.setAttribute("fill", fillColor);
          pathEl.setAttribute("stroke", strokeColor);
          pathEl.setAttribute("stroke-width", "2");
          pathEl.setAttribute("stroke-dasharray", "4,4");
        }
      } else if (typeof target.beginPath === "function") {
        // Canvas Implementation
        if (pieceData.points && pieceData.points.length > 0) {
          target.save();
          target.beginPath();
          target.moveTo(pieceData.points[0].x, pieceData.points[0].y);
          for (let i = 1; i < pieceData.points.length; i++) {
            target.lineTo(pieceData.points[i].x, pieceData.points[i].y);
          }
          target.closePath();
          target.fillStyle = fillColor;
          target.fill();
          target.strokeStyle = strokeColor;
          target.lineWidth = 2;
          target.setLineDash([4, 4]);
          target.stroke();
          target.restore();
        }
      }
    },

    /**
     * محرك الرسم الرئيسي على عناصر SVG (مثل Page11)
     * @param {SVGElement} svg 
     * @param {Object} data 
     * @param {Object} options 
     */
    renderSVG: function (svg, data, options) {
      if (!svg) return;
      options = options || {};

      // استدعاء الدالة المرجعية الذهبية لـ Page11 إذا كانت متاحة
      if (typeof global.renderCroquis === "function" && options.useLegacy !== false) {
        global.renderCroquis();
        return;
      }
    },

    /**
     * محرك الرسم الرئيسي على عناصر Canvas (مثل Page13)
     * @param {HTMLCanvasElement} canvas 
     * @param {Object} data 
     * @param {Object} options 
     */
    renderCanvas: function (canvas, data, options) {
      if (!canvas) return;
      options = options || {};

      // استدعاء دالة الرسم الحرة لـ Page13 إذا كانت متاحة
      if (typeof global.drawLandCanvas === "function" && options.useLegacy !== false) {
        const vertices = (data && data.vertices && data.vertices.length >= 3) ? data.vertices : global.vertices;
        global.drawLandCanvas(vertices);
        return;
      }
    },

    /**
     * الواجهة العامة الموحدة لرسم الكروكي (SVG أو Canvas)
     * @param {HTMLElement|string} target العنصر الإرشادي أو معرّفه
     * @param {Object} data البيانات المدخلة
     * @param {Object} options خيارات إضافية
     */
    render: function (target, data, options) {
      options = options || {};
      let el = target;
      if (typeof target === "string") {
        el = document.getElementById(target);
      }

      if (!el) {
        el = document.getElementById("croquis-svg") || document.getElementById("landCanvas");
      }

      if (!el) {
        console.warn("[CroquisEngine] No valid target SVG or Canvas found");
        return;
      }

      if (el.tagName && el.tagName.toLowerCase() === "svg") {
        this.renderSVG(el, data, options);
      } else if (el.tagName && el.tagName.toLowerCase() === "canvas") {
        this.renderCanvas(el, data, options);
      } else {
        // فحص وجود SVG/Canvas داخل العنصر الوالد
        const childSvg = el.querySelector("svg");
        const childCanvas = el.querySelector("canvas");
        if (childSvg) {
          this.renderSVG(childSvg, data, options);
        } else if (childCanvas) {
          this.renderCanvas(childCanvas, data, options);
        }
      }
    }
  };

  // تصدير المحرك الموحد للنطاق العام
  global.CroquisEngine = CroquisEngine;

})(typeof window !== "undefined" ? window : global);
