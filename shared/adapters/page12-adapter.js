/**
 * shared/adapters/page12-adapter.js — Adapter for Page12 Land Calculation & Partition
 * =====================================================================================
 * يحول بيانات الصفحة 12 (جميع الأشكال والشركاء، الأبعاد، المساحات، والتحويلات)
 * إلى الكائن الموحد الذي يتوقعه محرك طباعة التقرير (DallalReportTemplate).
 */
(function (global) {
  "use strict";

  const Page12Adapter = {
    buildReportData() {
      const now = new Date();
      const dateStr = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
      const timeStr = now.toLocaleTimeString('ar-EG');

      const caratSize = global.caratSize || 168;

      // 1. جلب عناصر الإدخال الرئيسية للأبعاد من واجهة الصفحة 12
      const w1Val = document.getElementById("start-w1")?.value || "-";
      const w2Val = document.getElementById("start-w2")?.value || "-";
      const l2Val = document.getElementById("start-l2")?.value || "-";
      const l1Val = document.getElementById("start-l1")?.value || "-";

      const w1Dir = document.getElementById("start-w1-dir")?.value || "بحري";
      const w2Dir = document.getElementById("start-w2-dir")?.value || "قبلي";
      const l2Dir = document.getElementById("start-l2-dir")?.value || "شرقي";
      const l1Dir = document.getElementById("start-l1-dir")?.value || "غربي";

      const w1Num = parseFloat(w1Val) || 0;
      const w2Num = parseFloat(w2Val) || 0;
      const l2Num = parseFloat(l2Val) || 0;
      const l1Num = parseFloat(l1Val) || 0;

      const avgWidth = (w1Num + w2Num) / 2;
      const avgLength = (l1Num + l2Num) / 2;

      // 2. استخراج الأشكال والشركاء من محرك الخريطة
      const shapes = (typeof global.getDallalShapes === "function" ? global.getDallalShapes() : global.shapes) || [];
      const partnerItems = [];
      let totalAreaM2 = 0;
      let actualPartnerCount = 0;

      shapes.forEach((s, idx) => {
        const isSub = s.isSubPiece;
        const ownerText = s.notes || s.owner || s.name || (isSub ? `الشريك ${idx + 1}` : `القطعة ${idx + 1}`);
        let sqmVal = 0;
        let feddanVal = 0, caratVal = 0, sahmVal = 0;

        if (s.area && typeof s.area.sqm === "number") {
          sqmVal = s.area.sqm;
          feddanVal = s.area.feddan || 0;
          caratVal = s.area.carat || 0;
          sahmVal = s.area.shares || 0;
        } else if (typeof s.area === "number") {
          sqmVal = s.area;
          if (global.AgriUnitsCompat) {
            const fcs = global.AgriUnitsCompat.sqmToFCS(sqmVal, caratSize);
            feddanVal = fcs.feddan;
            caratVal = fcs.carat;
            sahmVal = fcs.sahm;
          }
        }

        totalAreaM2 += sqmVal;
        actualPartnerCount++;

        // أطوال أضلاع القطعة إن وجدت
        let sideTop = 0, sideBottom = 0, sideRight = 0, sideLeft = 0;
        if (s.points && s.points.length >= 4 && typeof global.calcDist === "function") {
          sideTop = global.calcDist(s.points[0], s.points[1]);
          sideRight = global.calcDist(s.points[1], s.points[2]);
          sideBottom = global.calcDist(s.points[3], s.points[2]);
          sideLeft = global.calcDist(s.points[0], s.points[3]);
        }

        partnerItems.push({
          name: ownerText,
          sqmVal,
          feddanVal,
          caratVal,
          sahmVal,
          sideTop,
          sideBottom,
          sideRight,
          sideLeft,
          isWaterway: false
        });
      });

      // إدراج تفاصيل المجرى المائي إن وجد
      if (global.waterways && global.waterways.length > 0 && typeof global.getWaterwayStats === "function") {
        const ws = global.getWaterwayStats();
        if (ws && ws.area > 0) {
          partnerItems.push({
            name: "💧 المجرى المائي (قطعة خدمة)",
            sqmVal: ws.area,
            feddanVal: 0,
            caratVal: 0,
            sahmVal: 0,
            sideTop: ws.width || 0,
            sideBottom: ws.width || 0,
            sideRight: ws.length || 0,
            sideLeft: ws.length || 0,
            isWaterway: true
          });
        }
      }

      // إذا لم يجد أشكال، يحسب المساحة الإجمالية من المدخلات الأساسية
      if (totalAreaM2 === 0 && (avgWidth > 0 || avgLength > 0)) {
        totalAreaM2 = avgWidth * avgLength;
      }

      // 3. جدول بيان الأبعاد والمساحات للأرض الإجمالية
      const dimensions = [
        { label: `العرض الأول (${w1Dir})`, value: `${w1Val} م` },
        { label: `العرض الثاني (${w2Dir})`, value: `${w2Val} م` },
        { label: `الطول الأيمن (${l2Dir})`, value: `${l2Val} م` },
        { label: `الطول الأيسر (${l1Dir})`, value: `${l1Val} م` },
        { label: "معدل العرض", value: `${avgWidth.toFixed(4)} م` },
        { label: "متوسط الطول", value: `${avgLength.toFixed(4)} م` },
        { label: "جملة المساحة بالمتر المربع", value: `${totalAreaM2.toFixed(2)} م²`, isHighlight: true }
      ];

      // 4. بناء بطاقات الشركاء والقطع التفصيلية
      const partnerCardsHTML = partnerItems.map((item) => {
        const areaFormatted = global.formatArea ? global.formatArea(item.sqmVal) : item.sqmVal.toFixed(2);
        
        let fcsText = `(${item.feddanVal} فدان، ${item.caratVal} ق، ${typeof item.sahmVal === "number" ? item.sahmVal.toFixed(2) : item.sahmVal} س)`;
        let headerBg = "";
        let boxStyle = "";

        if (item.isWaterway) {
          fcsText = `(مساحة ممر مائي - قطعة خدمة غير محسوبة كشريك)`;
          headerBg = `style="background: #0288d1; color: white;"`;
          boxStyle = `style="background: #e1f5fe; border-color: #81d4fa;"`;
        }

        const topStr = item.sideTop > 0 ? `${item.sideTop.toFixed(2)} م` : `${w1Val} م`;
        const botStr = item.sideBottom > 0 ? `${item.sideBottom.toFixed(2)} م` : `${w2Val} م`;
        const rightStr = item.sideRight > 0 ? `${item.sideRight.toFixed(2)} م` : `${l2Val} م`;
        const leftStr = item.sideLeft > 0 ? `${item.sideLeft.toFixed(2)} م` : `${l1Val} م`;

        return `
          <div class="partner-print-card">
            <div class="partner-card-header" ${headerBg}>${item.name}</div>
            <table class="partner-card-table">
              <thead>
                <tr>
                  <th style="width: 50%;">البيان</th>
                  <th>القيمة</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style="text-align: right; padding-right: 8px;">العرض الأول (${w1Dir})</td><td style="font-weight:bold;color:#1b5e20;">${topStr}</td></tr>
                <tr><td style="text-align: right; padding-right: 8px;">العرض الثاني (${w2Dir})</td><td style="font-weight:bold;color:#1b5e20;">${botStr}</td></tr>
                <tr><td style="text-align: right; padding-right: 8px;">الطول الأيمن (${l2Dir})</td><td style="font-weight:bold;color:#1b5e20;">${rightStr}</td></tr>
                <tr><td style="text-align: right; padding-right: 8px;">الطول الأيسر (${l1Dir})</td><td style="font-weight:bold;color:#1b5e20;">${leftStr}</td></tr>
                <tr style="background:#e8f5e9;"><td style="text-align: right; padding-right: 8px;">مساحة القيراط المعتمدة</td><td style="font-weight:bold;color:#1b5e20;">${caratSize} م²</td></tr>
              </tbody>
            </table>
            <div class="partner-card-area-box" ${boxStyle}>
              <span class="partner-card-area-lbl">المساحة</span>
              <span class="partner-card-area-val">${areaFormatted} م²</span>
              <span class="partner-card-fcs-val">${fcsText}</span>
            </div>
          </div>
        `;
      }).join("");

      const numCards = partnerItems.length;
      let gridStyle = "grid-template-columns: repeat(3, 1fr);";
      if (numCards === 1) {
        gridStyle = "grid-template-columns: 1fr; max-width: 320px; margin: 0 auto;";
      } else if (numCards === 2) {
        gridStyle = "grid-template-columns: repeat(2, 1fr); max-width: 640px; margin: 0 auto;";
      }

      // 5. الإجماليات والملاحظات
      const fcsTotal = global.AgriUnitsCompat 
        ? global.AgriUnitsCompat.sqmToFCS(totalAreaM2, caratSize)
        : { feddan: 0, carat: 0, sahm: 0 };

      const totals = {
        totalArea: totalAreaM2.toFixed(2),
        totalFeddans: fcsTotal.feddan,
        totalCarats: fcsTotal.carat,
        totalShares: typeof fcsTotal.sahm === "number" ? fcsTotal.sahm.toFixed(2) : fcsTotal.sahm,
        caratArea: caratSize
      };

      const notes = [
        "1 - جميع أطوال ومساحات الشركاء مرتبة بدقة ومطابقة لموقع الخريطة الميدانية.",
        `2 - إجمالي عدد الشركاء المستفيدين بالتقرير: ${actualPartnerCount} شريك.`,
        `3 - مساحة القيراط المعتمدة في التحويل: ${caratSize} م².`
      ];

      return {
        reportTitle: "تقرير حساب وتقسيم الأراضي",
        reportSubtitle: "بيان مساحات الشركاء والقطع",
        dateStr,
        timeStr,
        dimensions,
        partnerCardsHTML,
        gridStyle,
        totals,
        notes
      };
    }
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Page12Adapter;
  } else {
    global.Page12Adapter = Page12Adapter;
  }
})(typeof window !== "undefined" ? window : global);
