/**
 * shared/adapters/page11-adapter.js — Adapter for Page11 Land Partition
 * ======================================================================
 * يحول بيانات الصفحة 11 (أبعاد الأرض، بطاقات الشركاء، الإجماليات، والملاحظات)
 * إلى الكائن الموحد الذي يتوقعه محرك طباعة التقرير (DallalReportTemplate).
 */
(function (global) {
  "use strict";

  const Page11Adapter = {
    buildReportData() {
      const l1 = document.getElementById("length1")?.value || "-";
      const l2 = document.getElementById("length2")?.value || "-";
      const w1 = document.getElementById("width1")?.value || "-";
      const w2 = document.getElementById("width2")?.value || "-";

      const dirs = typeof global.getP11Directions === "function" 
        ? global.getP11Directions() 
        : { top: "أعلى", bottom: "أسفل", right: "يمين", left: "يسار" };

      const totalArea = document.getElementById("total-area-sqm-res") 
        ? document.getElementById("total-area-sqm-res").innerText.replace(" م²", "") 
        : "-";
      const totalShares = document.getElementById("total-area-shares-res")?.innerText || "0";
      const totalCarats = document.getElementById("total-area-carats-res")?.innerText || "0";
      const totalFeddans = document.getElementById("total-area-feddans-res")?.innerText || "0";
      const caratArea = document.getElementById("carat-area-res")?.innerText || "0";

      const numPartners = Array.from(document.querySelectorAll("#partners-list .partner-row"))
        .filter(r => typeof global.isPartnerRowExcluded === "function" ? !global.isPartnerRowExcluded(r) : true).length;

      const now = new Date();
      const dateStr = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
      const timeStr = now.toLocaleTimeString('ar-EG');

      const avgWidth = ((parseFloat(w1) || 0) + (parseFloat(w2) || 0)) / 2;
      const avgLength = ((parseFloat(l1) || 0) + (parseFloat(l2) || 0)) / 2;
      const isLTR = global.PartitionDirectionManager ? global.PartitionDirectionManager.isLTR() : true;

      const fmtMeter   = global.formatMeter || function(v) { return '<span class="measure-value"><bdi>' + v + '</bdi>&nbsp;م</span>'; };
      const fmtSqMeter = global.formatSquareMeter || function(v) { return '<span class="measure-value"><bdi>' + v + '</bdi>&nbsp;م²</span>'; };

      // 1. جدول الأبعاد والمساحة الإجمالية
      const dimensions = [
        { label: `العرض الأول (${dirs.top})`, value: fmtMeter(w2) },
        { label: `العرض الثاني (${dirs.bottom})`, value: fmtMeter(w1) },
        { label: `الطول الأيمن (${dirs.right})`, value: fmtMeter(l1) },
        { label: `الطول الأيسر (${dirs.left})`, value: fmtMeter(l2) },
        { label: "معدل العرض", value: fmtMeter(avgWidth.toFixed(4)) },
        { label: "متوسط الطول", value: fmtMeter(avgLength.toFixed(4)) },
        { label: "جملة المساحة بالمتر المربع", value: fmtSqMeter(totalArea), isHighlight: true }
      ];

      // 2. بطاقات الشركاء
      function formatArabicFCS(feddan, carat, sahm) {
        const parts = [];
        if (feddan > 0) {
          if (feddan === 1) parts.push("فدان واحد");
          else if (feddan === 2) parts.push("فدانان");
          else if (feddan >= 3 && feddan <= 10) parts.push(`${feddan} فدادين`);
          else parts.push(`${feddan} فدان`);
        }
        if (carat > 0) {
          if (carat === 1) parts.push("قيراط واحد");
          else if (carat === 2) parts.push("قيراطان");
          else if (carat >= 3 && carat <= 10) parts.push(`${carat} قراريط`);
          else parts.push(`${carat} قيراط`);
        }
        const sahmInt = Math.floor(sahm);
        const sahmDec = Math.round((sahm - sahmInt) * 100);
        if (sahmInt > 0 || sahmDec > 0) {
          let sahmText = "";
          if (sahmInt > 0) {
            if (sahmInt === 1) sahmText = "سهم واحد";
            else if (sahmInt === 2) sahmText = "سهمان";
            else if (sahmInt >= 3 && sahmInt <= 10) sahmText = `${sahmInt} أسهم`;
            else sahmText = `${sahmInt} سهماً`;
          }
          if (sahmDec > 0) {
            const decText = `${sahmDec} جزءاً من السهم`;
            sahmText = sahmText ? `${sahmText} و ${decText}` : decText;
          }
          parts.push(sahmText);
        }
        return parts.length === 0 ? "0 سهم" : parts.join(" و ");
      }

      const calculatedPieces = global.calculatedPieces || [];
      const partnerCardsHTML = calculatedPieces.map((piece, idx) => {
        const pieceDisplayArea = (piece.exactArea !== undefined && !isNaN(piece.exactArea))
          ? piece.exactArea
          : piece.area;
        const fcs = global.convertSquareMetersToFCS ? global.convertSquareMetersToFCS(pieceDisplayArea) : { feddan: 0, carat: 0, sahm: 0 };
        const fcsText = formatArabicFCS(fcs.feddan, fcs.carat, fcs.sahm);

        const w2_val = piece.topW.toFixed(4);
        const w1_val = piece.botW.toFixed(4);
        const rightL_val = piece.leftLine.toFixed(4);
        const leftL_val = piece.divLine.toFixed(4);
        const avgW_val = piece.width.toFixed(4);
        const avgL_val = piece.width > 0 ? (piece.area / piece.width).toFixed(4) : "-";

        const displayIndex = idx + 1;
        const cardTitle = piece.isRemainder ? "الجزء المتبقي من الأرض" : `الشريك ${displayIndex}: ${piece.name}`;
        const formattedArea = global.formatArea ? global.formatArea(pieceDisplayArea) : pieceDisplayArea.toFixed(2);

        return `
          <div class="pcard">
            <div class="pcard-hdr">${cardTitle}</div>
            <table class="pcard-table">
              <thead>
                <tr>
                  <th style="text-align:center;width:55%;">البيان</th>
                  <th style="text-align:center;">القيمة</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style="text-align:center;padding:3px 6px;">العرض الأول (${dirs.top})</td><td class="td-val" style="text-align:center;padding:3px 6px;">${fmtMeter(w2_val)}</td></tr>
                <tr><td style="text-align:center;padding:3px 6px;">العرض الثاني (${dirs.bottom})</td><td class="td-val" style="text-align:center;padding:3px 6px;">${fmtMeter(w1_val)}</td></tr>
                <tr><td style="text-align:center;padding:3px 6px;">الطول الأيمن (${dirs.right})</td><td class="td-val" style="text-align:center;padding:3px 6px;">${fmtMeter(rightL_val)}</td></tr>
                <tr><td style="text-align:center;padding:3px 6px;">الطول الأيسر (${dirs.left})</td><td class="td-val" style="text-align:center;padding:3px 6px;">${fmtMeter(leftL_val)}</td></tr>
                <tr style="background:#e8f5e9;"><td style="text-align:center;padding:3px 6px;">معدل العرض</td><td class="td-val" style="text-align:center;padding:3px 6px;background:#e8f5e9;">${fmtMeter(avgW_val)}</td></tr>
                <tr style="background:#e8f5e9;"><td style="text-align:center;padding:3px 6px;">متوسط الطول</td><td class="td-val" style="text-align:center;padding:3px 6px;background:#e8f5e9;">${fmtMeter(avgL_val)}</td></tr>
              </tbody>
            </table>
            <div class="pcard-foot">
              <span class="pcard-foot-lbl">جملة المساحة بالمتر المربع</span>
              <span class="pcard-foot-area">${fmtSqMeter(formattedArea)}</span>
              <span class="pcard-foot-fcs">(${fcsText})</span>
            </div>
          </div>
        `;
      }).join("");

      const numCards = calculatedPieces.length;
      let gridStyle = "grid-template-columns: repeat(3, 1fr);";
      if (numCards === 1) {
        gridStyle = "grid-template-columns: 1fr; max-width: 320px; margin: 0 auto;";
      } else if (numCards === 2) {
        gridStyle = "grid-template-columns: repeat(2, 1fr); max-width: 640px; margin: 0 auto;";
      }

      // 3. الإجماليات والملاحظات
      const totals = {
        totalArea,
        totalFeddans,
        totalCarats,
        totalShares,
        caratArea
      };

      const notes = [
        "1 - جميع الأطوال بالمتر.",
        `2 - تم تقسيم الغيط إلى ${numPartners} أجزاء تفصيلية بالطريقة الطولية.`,
        `3 - اتجاه التقسيم للتنفيذ الميداني: ${isLTR ? "➡️ من اليسار إلى اليمين" : "⬅️ من اليمين إلى اليسار"}.`
      ];

      return {
        reportTitle: "بيان المساحات",
        reportSubtitle: "جملة الغيط",
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
    module.exports = Page11Adapter;
  } else {
    global.Page11Adapter = Page11Adapter;
  }
})(typeof window !== "undefined" ? window : global);
