/**
 * @file animation-engine.js
 * @description محرك السيناريو والبيانات لمحاكاة التنفيذ الميداني مع دعم كامل للترجمة واستقلالية البيانات.
 */

window.AnimationEngine = {
  /**
   * توليد سيناريو الخطوات تفصيلياً بناءً على بيانات الأرض والشركاء الممررة.
   * @param {Object} landData بيانات الأرض والأبعاد
   * @param {Array} pieces قائمة الشركاء المحسوبين
   * @param {string} lang رمز اللغة (الافتراضي 'ar')
   * @returns {Array} مصفوفة الخطوات
   */
  generateScenario: function (landData, pieces, lang) {
    const steps = [];
    if (!pieces || pieces.length === 0) return steps;

    const locale = lang || "ar";
    const str = window.AnimationStrings[locale];
    if (!str) {
      console.warn(`قوالب الترجمة للغة "${locale}" غير متوفرة، سيتم استخدام اللغة العربية كافتراضية.`);
      return this.generateScenario(landData, pieces, "ar");
    }

    const { w, w1, w2, l1, l2 } = landData;
    const k = (l1 - l2) / w; // معدل تغير الطول

    const isLTR = window.PartitionDirectionManager && window.PartitionDirectionManager.isLTR();

    // 1. مقدمة الأرض
    steps.push({
      type: "INTRO_LAND",
      title: str.titleIntro,
      caption: str.introLand(w1.toFixed(2), w2.toFixed(2), l1.toFixed(2), l2.toFixed(2)),
      state: {
        showLand: true,
        showDimensions: true,
        piecesDrawnCount: 0
      }
    });

    // 2. تحديد اتجاه الاستلام
    steps.push({
      type: "START_POINT",
      title: str.titleStart,
      caption: str.startPoint,
      state: {
        showLand: true,
        showStartFlag: true,
        piecesDrawnCount: 0
      }
    });

    // عكس ترتيب الشركاء للمحاكاة إذا كان الاتجاه LTR
    const scenarioPieces = isLTR ? [...pieces].reverse() : pieces;

    // 3. توليد الخطوات ديناميكياً لكل شريك
    scenarioPieces.forEach((piece, index) => {
      const isRem = !!piece.isRemainder;
      const pieceLabel = isRem ? "الجزء المتبقي" : piece.name;
      
      const prevStartX = isLTR ? (w - piece.endX) : piece.startX;
      const currEndX = isLTR ? (w - piece.startX) : piece.endX;
      
      const dividerLen = isLTR ? piece.leftLine : piece.divLine;

      // أ. قياس الحد السفلي
      steps.push({
        type: "MEASURE_BOTTOM",
        title: `${str.titleMeasureBottom} - ${pieceLabel}`,
        caption: isRem 
          ? str.measureBottomRemainder(piece.botW.toFixed(2))
          : str.measureBottom(piece.botW.toFixed(2), currEndX.toFixed(2)),
        partnerIndex: isLTR ? (pieces.length - 1 - index) : index,
        state: {
          showLand: true,
          showStartFlag: true,
          piecesDrawnCount: index,
          activeMeasure: {
            side: "bottom",
            startX: prevStartX,
            endX: currEndX
          },
          stakes: isLTR 
            ? scenarioPieces.slice(0, index).flatMap(p => [
                { x: w - p.startX, side: "bottom" },
                { x: w - p.startX, side: "top" }
              ])
            : pieces.slice(0, index).flatMap(p => [
                { x: p.endX, side: "bottom" },
                { x: p.endX, side: "top" }
              ])
        }
      });

      // ب. قياس الحد العلوي
      steps.push({
        type: "MEASURE_TOP",
        title: `${str.titleMeasureTop} - ${pieceLabel}`,
        caption: isRem
          ? str.measureTopRemainder(piece.topW.toFixed(2))
          : str.measureTop(piece.topW.toFixed(2), currEndX.toFixed(2)),
        partnerIndex: isLTR ? (pieces.length - 1 - index) : index,
        state: {
          showLand: true,
          showStartFlag: true,
          piecesDrawnCount: index,
          activeMeasure: {
            side: "top",
            startX: prevStartX,
            endX: currEndX
          },
          stakes: isLTR
            ? [
                ...scenarioPieces.slice(0, index).flatMap(p => [
                  { x: w - p.startX, side: "bottom" },
                  { x: w - p.startX, side: "top" }
                ]),
                { x: currEndX, side: "bottom" }
              ]
            : [
                ...pieces.slice(0, index).flatMap(p => [
                  { x: p.endX, side: "bottom" },
                  { x: p.endX, side: "top" }
                ]),
                { x: currEndX, side: "bottom" }
              ]
        }
      });

      // ج. شد الحبل الفاصل
      if (!isRem || index < scenarioPieces.length - 1) {
        steps.push({
          type: "CONNECT_ROPE",
          title: `${str.titleRope} - ${pieceLabel}`,
          caption: str.connectRope,
          partnerIndex: isLTR ? (pieces.length - 1 - index) : index,
          state: {
            showLand: true,
            showStartFlag: true,
            piecesDrawnCount: index,
            activeRope: currEndX,
            stakes: isLTR
              ? [
                  ...scenarioPieces.slice(0, index).flatMap(p => [
                    { x: w - p.startX, side: "bottom" },
                    { x: w - p.startX, side: "top" }
                  ]),
                  { x: currEndX, side: "bottom" },
                  { x: currEndX, side: "top" }
                ]
              : [
                  ...pieces.slice(0, index).flatMap(p => [
                    { x: p.endX, side: "bottom" },
                    { x: p.endX, side: "top" }
                  ]),
                  { x: currEndX, side: "bottom" },
                  { x: currEndX, side: "top" }
                ]
          }
        });

        // د. قياس طول الفاصل الفعلي
        steps.push({
          type: "SHOW_DIVIDER",
          title: `${str.titleDivider} - ${pieceLabel}`,
          caption: str.showDivider(dividerLen.toFixed(2)),
          partnerIndex: isLTR ? (pieces.length - 1 - index) : index,
          state: {
            showLand: true,
            showStartFlag: true,
            piecesDrawnCount: index,
            showDividerLength: currEndX,
            stakes: isLTR
              ? [
                  ...scenarioPieces.slice(0, index).flatMap(p => [
                    { x: w - p.startX, side: "bottom" },
                    { x: w - p.startX, side: "top" }
                  ]),
                  { x: currEndX, side: "bottom" },
                  { x: currEndX, side: "top" }
                ]
              : [
                  ...pieces.slice(0, index).flatMap(p => [
                    { x: p.endX, side: "bottom" },
                    { x: p.endX, side: "top" }
                  ]),
                  { x: currEndX, side: "bottom" },
                  { x: currEndX, side: "top" }
                ]
          }
        });
      }

      // هـ. تأكيد وتعبئة نصيب الشريك
      steps.push({
        type: "SHOW_SHARE",
        title: `${str.titleShare} - ${pieceLabel}`,
        caption: str.showShare(piece.name, piece.area.toFixed(2), piece.width.toFixed(2), (piece.area / piece.width).toFixed(2)),
        partnerIndex: isLTR ? (pieces.length - 1 - index) : index,
        state: {
          showLand: true,
          showStartFlag: true,
          piecesDrawnCount: index + 1,
          showCardDetails: isLTR ? (pieces.length - 1 - index) : index,
          stakes: isLTR
            ? scenarioPieces.slice(0, index + 1).flatMap(p => [
                { x: w - p.startX, side: "bottom" },
                { x: w - p.startX, side: "top" }
              ])
            : pieces.slice(0, index + 1).flatMap(p => [
                { x: p.endX, side: "bottom" },
                { x: p.endX, side: "top" }
              ])
        }
      });
    });

    // 4. الخلاصة النهائية للتقسيم المكتمل
    steps.push({
      type: "FINAL_SUMMARY",
      title: str.titleSummary,
      caption: str.finalSummary,
      state: {
        showLand: true,
        showStartFlag: true,
        showEndFlag: true,
        piecesDrawnCount: pieces.length,
        stakes: isLTR
          ? scenarioPieces.flatMap(p => [
              { x: w - p.startX, side: "bottom" },
              { x: w - p.startX, side: "top" }
            ])
          : pieces.flatMap(p => [
              { x: p.endX, side: "bottom" },
              { x: p.endX, side: "top" }
            ])
      }
    });

    return steps;
  }
};
