/**
 * @file animation-renderer.js
 * @description مسؤول الرسوم للمحرك الموحد - يقسم الرسم إلى طبقة ثابتة وطبقة متحركة لتقليل الـ Reflows والـ CPU load.
 */

window.AnimationRenderer = {
  svg: null,
  staticLayer: null,
  dynamicLayer: null,
  landData: null,
  pieces: null,
  PIECE_COLORS: [
    { fill: "rgba(76, 175, 80, 0.12)", stroke: "#4caf50" },
    { fill: "rgba(33, 150, 243, 0.12)", stroke: "#2196f3" },
    { fill: "rgba(156, 39, 176, 0.12)", stroke: "#9c27b0" },
    { fill: "rgba(255, 152, 0, 0.12)", stroke: "#ff9800" },
    { fill: "rgba(0, 150, 136, 0.12)", stroke: "#009688" },
    { fill: "rgba(233, 30, 99, 0.12)", stroke: "#e91e63" }
  ],

  // إعدادات المقاييس والتحويل
  offsetX: 0,
  offsetY: 0,
  drawScale: 1,
  stretchX: 1,
  stretchY: 1,
  k: 0,

  /**
   * تهيئة عناصر الرسم وحقن الأصول الرسومية في الـ <defs>.
   */
  init: function (svgElement, landData, pieces) {
    this.svg = svgElement;
    this.landData = landData;
    this.pieces = pieces;

    const { w, w1, w2, l1, l2 } = landData;
    this.k = (l1 - l2) / w;

    // 1. إعداد وحقن الـ Defs للأيقونات لمرة واحدة فقط لمنع التكرار في الذاكرة
    let defs = this.svg.querySelector("defs");
    if (!defs) {
      defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      this.svg.appendChild(defs);
    }
    defs.innerHTML = "";
    Object.keys(window.AnimationAssets.symbols).forEach(key => {
      defs.innerHTML += window.AnimationAssets.symbols[key];
    });

    // 2. إعداد المجموعات المستقلة للرسم لتقسيم العبء الرسومي
    this.svg.querySelectorAll(".anim-layer").forEach(layer => layer.remove());
    
    this.staticLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.staticLayer.setAttribute("class", "anim-layer static-layer");
    this.svg.appendChild(this.staticLayer);

    this.dynamicLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.dynamicLayer.setAttribute("class", "anim-layer dynamic-layer");
    this.svg.appendChild(this.dynamicLayer);

    // 3. احتساب مقياس التمدد البصري والتناسب مع الحاوية
    const containerW = 1000;
    const containerH = 600;
    const maxLen = Math.max(l1, l2);
    const shapeRatio = maxLen / w;
    
    if (shapeRatio > 3.0) {
      this.stretchX = 2.5;
      this.stretchY = 0.9;
    } else if (shapeRatio > 1.8) {
      this.stretchX = 1.8;
      this.stretchY = 0.9;
    } else if (shapeRatio < 0.3) {
      this.stretchX = 0.8;
      this.stretchY = 2.0;
    } else {
      this.stretchX = 1.25;
      this.stretchY = 1.0;
    }

    const w_virtual = w * this.stretchX;
    const maxLen_virtual = maxLen * this.stretchY;

    const scaleX = (containerW - 160) / w_virtual;
    const scaleY = (containerH - 160) / maxLen_virtual;
    this.drawScale = Math.min(scaleX, scaleY);

    const drawnW = w_virtual * this.drawScale;
    const drawnH = maxLen_virtual * this.drawScale;
    this.offsetX = (containerW - drawnW) / 2;
    this.offsetY = (containerH - drawnH) / 2;
  },

  mapX: function (x) {
    const isLTR = window.PartitionDirectionManager && window.PartitionDirectionManager.isLTR();
    const rx = isLTR ? x : (this.landData.w - x);
    return this.offsetX + (rx * this.stretchX) * this.drawScale;
  },

  mapY: function (y) {
    return this.offsetY + (y * this.stretchY) * this.drawScale;
  },

  getBottomY: function (x) {
    const isLTR = window.PartitionDirectionManager && window.PartitionDirectionManager.isLTR();
    const rx = isLTR ? x : (this.landData.w - x);
    return this.mapY(this.landData.l2 + this.k * rx);
  },

  getTopY: function (x) {
    return this.mapY(0);
  },

  /**
   * رسم العناصر الثابتة لمرة واحدة عند الانتقال بين الخطوات.
   */
  renderStatic: function (step) {
    if (!this.staticLayer) return;
    this.staticLayer.innerHTML = ""; // مسح الطبقة الثابتة فقط

    const { w, w1, w2, l1, l2 } = this.landData;
    const utils = window.AnimationUtils;

    // أ. رسم ظل الخلفية ومحيط الأرض
    const ptsShadow = `${this.mapX(0)},${this.getBottomY(0) + 4} ${this.mapX(w)},${this.getBottomY(w) + 4} ${this.mapX(w)},${this.getTopY(w) + 4} ${this.mapX(0)},${this.getTopY(0) + 4}`;
    this.staticLayer.appendChild(utils.svgPolygon(ptsShadow, "rgba(0,0,0,0.06)"));

    const ptsLand = `${this.mapX(0)},${this.getBottomY(0)} ${this.mapX(w)},${this.getBottomY(w)} ${this.mapX(w)},${this.getTopY(w)} ${this.mapX(0)},${this.getTopY(0)}`;
    this.staticLayer.appendChild(utils.svgPolygon(ptsLand, "#fdfdf6", "#2e7d32", 2.5));

    // ب. رسم أرقام الأبعاد الأربعة للأرض
    if (step.state.showDimensions) {
      this.staticLayer.appendChild(utils.svgText(this.mapX(0) + 38, (this.getBottomY(0) + this.getTopY(0)) / 2, `${l1.toFixed(2)} م`, 12, "#2e7d32", "start", "bold"));
      this.staticLayer.appendChild(utils.svgText(this.mapX(w) - 38, (this.getBottomY(w) + this.getTopY(w)) / 2, `${l2.toFixed(2)} م`, 12, "#2e7d32", "end", "bold"));
      this.staticLayer.appendChild(utils.svgText((this.mapX(0) + this.mapX(w)) / 2, this.getTopY(0) - 15, `${w2.toFixed(2)} م`, 12, "#2e7d32", "middle", "bold"));
      this.staticLayer.appendChild(utils.svgText((this.mapX(0) + this.mapX(w)) / 2, this.getBottomY(0) + 22, `${w1.toFixed(2)} م`, 12, "#2e7d32", "middle", "bold"));
    }

    // ج. رسم مضلعات ومساحات الشركاء المنجزين
    for (let i = 0; i < step.state.piecesDrawnCount; i++) {
      const piece = this.pieces[i];
      if (!piece) continue;

      const px1 = this.mapX(piece.startX);
      const px2 = this.mapX(piece.endX);
      const py1 = this.getTopY(piece.startX);
      const py2 = this.getTopY(piece.endX);
      const py3 = this.getBottomY(piece.endX);
      const py4 = this.getBottomY(piece.startX);

      const isRem = !!piece.isRemainder;
      const color = isRem 
        ? { fill: "rgba(255, 193, 7, 0.12)", stroke: "#ff8f00" }
        : this.PIECE_COLORS[i % this.PIECE_COLORS.length];

      const ptsPiece = `${px1},${py1} ${px2},${py2} ${px2},${py3} ${px1},${py4}`;
      this.staticLayer.appendChild(utils.svgPolygon(ptsPiece, color.fill));

      // خطوط الفواصل الجانبية للشركاء
      this.staticLayer.appendChild(utils.svgLine(px2, py2, px2, py3, color.stroke, 2, isRem ? "6,4" : null));

      // معلومات الشريك النصية في مركز القطعة
      const mx = (px1 + px2) / 2;
      const my = (py1 + py2 + py3 + py4) / 4;
      this.staticLayer.appendChild(utils.svgText(mx, my - 6, piece.name, 12, "#1b5e20", "middle", "bold"));
      this.staticLayer.appendChild(utils.svgText(mx, my + 8, `${piece.area.toFixed(1)} م²`, 10.5, "#37474f", "middle", "normal"));
    }

    // د. رسم حبال الفواصل المنتهية كخطوط فاصلة
    for (let i = 0; i < step.state.piecesDrawnCount; i++) {
      const piece = this.pieces[i];
      if (piece && !piece.isRemainder) {
        const px = this.mapX(piece.endX);
        const pyTop = this.getTopY(piece.endX);
        const pyBot = this.getBottomY(piece.endX);
        this.staticLayer.appendChild(utils.svgLine(px, pyTop, px, pyBot, "#ef6c00", 1.5, "4,2"));
      }
    }

    // هـ. رسم أوتاد الاستلام المستقرة
    if (step.state.stakes) {
      step.state.stakes.forEach(stake => {
        const sx = this.mapX(stake.x);
        const sy = stake.side === "bottom" ? this.getBottomY(stake.x) : this.getTopY(stake.x);
        this.staticLayer.appendChild(utils.svgAsset("stake", sx, sy, 0.75));
      });
    }

    // و. أعلام البداية والنهاية
    if (step.state.showStartFlag) {
      const fx = this.mapX(0);
      const fy = this.getBottomY(0);
      this.staticLayer.appendChild(utils.svgAsset("flagStart", fx - 10, fy - 18, 0.8));
      this.staticLayer.appendChild(utils.svgText(fx, fy - 22, "🏁 البداية", 10, "#2e7d32", "middle", "bold"));
    }

    if (step.state.showEndFlag) {
      const fx = this.mapX(w);
      const fy = this.getBottomY(w);
      this.staticLayer.appendChild(utils.svgAsset("flagEnd", fx + 10, fy - 18, 0.8));
      this.staticLayer.appendChild(utils.svgText(fx, fy - 22, "🛑 النهاية", 10, "#c62828", "middle", "bold"));
    }
  },

  /**
   * رسم الطبقة المتحركة وإعادة تحديثها فقط في كل إطار من حلقة requestAnimationFrame.
   */
  renderDynamic: function (step, progress) {
    if (!this.dynamicLayer) return;
    this.dynamicLayer.innerHTML = ""; // مسح الطبقة المتحركة فقط لمنع Layout Thrashing

    const utils = window.AnimationUtils;

    // أ. حركة شريط القياس للحد النشط
    if (step.state.activeMeasure) {
      const measure = step.state.activeMeasure;
      const startVal = measure.startX;
      const endVal = measure.startX + (measure.endX - measure.startX) * progress;

      const xStart = this.mapX(startVal);
      const xEnd = this.mapX(endVal);

      if (measure.side === "bottom") {
        const yStart = this.getBottomY(startVal);
        const yEnd = this.getBottomY(endVal);

        // شريط القياس المتمدد
        this.dynamicLayer.appendChild(utils.svgLine(xStart, yStart, xEnd, yEnd, "#ffd54f", 4.5));
        this.dynamicLayer.appendChild(utils.svgLine(xStart, yStart, xEnd, yEnd, "#37474f", 1, "3,2"));

        // وضع الأصول عند موضع النهاية المؤقت للحركة
        this.dynamicLayer.appendChild(utils.svgAsset("worker", xEnd, yEnd - 22, 0.75));
        this.dynamicLayer.appendChild(utils.svgAsset("tape", xEnd - 18, yEnd - 8, 0.7));

        const currentMeters = (endVal - startVal);
        this.dynamicLayer.appendChild(utils.svgText(xEnd, yEnd + 26, `${currentMeters.toFixed(2)} م`, 11, "#e65100", "middle", "bold"));
      } else {
        const yStart = this.getTopY(startVal);
        const yEnd = this.getTopY(endVal);

        this.dynamicLayer.appendChild(utils.svgLine(xStart, yStart, xEnd, yEnd, "#ffd54f", 4.5));
        this.dynamicLayer.appendChild(utils.svgLine(xStart, yStart, xEnd, yEnd, "#37474f", 1, "3,2"));

        this.dynamicLayer.appendChild(utils.svgAsset("worker", xEnd, yEnd - 22, 0.75));
        this.dynamicLayer.appendChild(utils.svgAsset("tape", xEnd - 18, yEnd - 8, 0.7));

        const currentMeters = (endVal - startVal);
        this.dynamicLayer.appendChild(utils.svgText(xEnd, yEnd - 16, `${currentMeters.toFixed(2)} م`, 11, "#e65100", "middle", "bold"));
      }

      // وتد وامض للتنبيه الميداني في نهاية الحركة
      if (progress >= 0.98) {
        this.dynamicLayer.appendChild(utils.svgAsset("stake", xEnd, measure.side === "bottom" ? this.getBottomY(endVal) : this.getTopY(endVal), 0.8));
      }
    }

    // ب. حركة خيط الفاصل (الشد)
    if (step.state.activeRope) {
      const ropeX = step.state.activeRope;
      const px = this.mapX(ropeX);
      const pyTop = this.getTopY(ropeX);
      const pyBot = this.getBottomY(ropeX);

      const currentY = pyBot + (pyTop - pyBot) * progress;

      this.dynamicLayer.appendChild(utils.svgLine(px, pyBot, px, currentY, "#ef6c00", 2.2));
      this.dynamicLayer.appendChild(utils.svgAsset("worker", px, pyBot - 20, 0.75));
    }

    // ج. قياس الحبل الفاصل بالكامل وتثبيته
    if (step.state.showDividerLength) {
      const ropeX = step.state.showDividerLength;
      const px = this.mapX(ropeX);
      const pyTop = this.getTopY(ropeX);
      const pyBot = this.getBottomY(ropeX);

      this.dynamicLayer.appendChild(utils.svgLine(px, pyBot, px, pyTop, "#ef6c00", 2.2));
      
      const my = (pyTop + pyBot) / 2;
      const divLen = this.pieces[step.partnerIndex].divLine;
      this.dynamicLayer.appendChild(utils.svgText(px + 12, my, `طول الخيط = ${divLen.toFixed(2)} م`, 11, "#ef6c00", "start", "bold"));
      this.dynamicLayer.appendChild(utils.svgAsset("worker", px, pyBot - 20, 0.75));
    }
  }
};
