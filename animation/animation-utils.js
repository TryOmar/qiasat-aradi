/**
 * @file animation-utils.js
 * @description الأدوات الهندسية ووظائف إنشاء عناصر SVG المستقرة بالاعتماد على ميزة <use>.
 */

window.AnimationUtils = {
  /**
   * إنشاء عنصر SVG بنطاق الأسماء الصحيح.
   */
  svgEl: function (tagName) {
    return document.createElementNS("http://www.w3.org/2000/svg", tagName);
  },

  /**
   * رسم خط مستقيم.
   */
  svgLine: function (x1, y1, x2, y2, stroke, strokeWidth, dashArray) {
    const line = this.svgEl("line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", stroke || "#000");
    line.setAttribute("stroke-width", strokeWidth || 1);
    if (dashArray) {
      line.setAttribute("stroke-dasharray", dashArray);
    }
    return line;
  },

  /**
   * رسم مضلع مغلق.
   */
  svgPolygon: function (pointsStr, fill, stroke, strokeWidth) {
    const poly = this.svgEl("polygon");
    poly.setAttribute("points", pointsStr);
    poly.setAttribute("fill", fill || "none");
    poly.setAttribute("stroke", stroke || "none");
    poly.setAttribute("stroke-width", strokeWidth || 0);
    return poly;
  },

  /**
   * رسم نص.
   */
  svgText: function (x, y, text, size, color, align, weight) {
    const el = this.svgEl("text");
    el.setAttribute("x", x);
    el.setAttribute("y", y);
    el.setAttribute("fill", color || "#000");
    el.setAttribute("font-size", (size || 12) + "px");
    el.setAttribute("font-family", "Cairo, Arial, sans-serif");
    el.setAttribute("text-anchor", align || "middle");
    if (weight) {
      el.setAttribute("font-weight", weight);
    }
    el.textContent = text;
    return el;
  },

  /**
   * إدراج أصل رسومي بالاعتماد على عنصر <use> لتقليل استهلاك الذاكرة وتسريع الرسم.
   */
  svgAsset: function (assetId, cx, cy, scale) {
    const useEl = this.svgEl("use");
    useEl.setAttribute("href", `#fh-anim-sym-${assetId}`);
    
    // تحديد أبعاد الأصول للمساعدة في عملية المحاذاة للمركز (cx, cy)
    let w = 64, h = 64;
    if (assetId === "stake") { w = 32; h = 64; }
    if (assetId === "tape") { w = 48; h = 48; }

    const tx = cx - (w / 2) * (scale || 1);
    const ty = cy - (h / 2) * (scale || 1);

    const g = this.svgEl("g");
    g.appendChild(useEl);
    g.setAttribute("transform", `translate(${tx}, ${ty}) scale(${scale || 1})`);
    return g;
  },

  /**
   * حساب الإحداثي على امتداد قطعة مستقيمة بناءً على النسبة (t من 0 إلى 1).
   */
  getPointOnSegment: function (p1, p2, ratio) {
    return {
      x: p1.x + (p2.x - p1.x) * ratio,
      y: p1.y + (p2.y - p1.y) * ratio
    };
  },

  /**
   * حساب المسافة الهندسية بين نقطتين.
   */
  getDistance: function (p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
};
