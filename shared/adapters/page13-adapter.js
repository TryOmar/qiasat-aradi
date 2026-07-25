/**
 * shared/adapters/page13-adapter.js — Adapter for Page13/section1 Drawing & Partition
 * =====================================================================================
 * يحول بيانات الصفحة 13 (أبعاد القطعة، قائمة الورثة والأنصبة، التحويلات الكسرية، والرسم)
 * إلى الكائن الموحد الذي يتوقعه محرك طباعة التقرير (DallalReportTemplate).
 * 
 * الميزات والضوابط المحققة:
 *  1. القراءة الحية والمباشرة لمعرفات عناصر Page13 (trap-base-minor, trap-base-major, trap-length-right, trap-length-left).
 *  2. عرض الأبعاد الأربعة الفريدة والخاصة بكل شريك/وارث على حدة دون تكرار الأبعاد الأولى.
 *  3. التحديث التلقائي الفوري للقيم عند إعادة الحساب أو تغيير اتجاه التقسيم.
 *  4. التناول الآمن للبيانات الناقصة أو غير المحددة باستبدالها بـ "—" دون انهيار الجدول.
 */
(function (global) {
  "use strict";

  const Page13Adapter = {
    buildReportData() {
      const now = new Date();
      const dateStr = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
      const timeStr = now.toLocaleTimeString('ar-EG');

      // 1. قراءة أبعاد الأرض الإجمالية بناءً على الشكل الهندسي النشط
      let activeShape = "trapezoid";
      if (document.getElementById("inputs-rectangle")?.classList.contains("active")) {
        activeShape = "rectangle";
      } else if (document.getElementById("inputs-square")?.classList.contains("active")) {
        activeShape = "square";
      } else if (document.getElementById("inputs-trapezoid")?.classList.contains("active")) {
        activeShape = "trapezoid";
      } else if (document.getElementById("inputs-quadrilateral")?.classList.contains("active")) {
        activeShape = "quadrilateral";
      } else {
        activeShape = sessionStorage.getItem("activeShape") || global.activeShape || "trapezoid";
      }

      let w2Raw = "", w1Raw = "", l1Raw = "", l2Raw = "";

      if (activeShape === "rectangle") {
        const w = document.getElementById("rect-width")?.value || "";
        const l = document.getElementById("rect-length")?.value || "";
        w2Raw = w;
        w1Raw = w;
        l1Raw = l;
        l2Raw = l;
      } else if (activeShape === "square") {
        const s = document.getElementById("square-side")?.value || "";
        w2Raw = s;
        w1Raw = s;
        l1Raw = s;
      } else if (activeShape === "trapezoid") {
        w2Raw = document.getElementById("trap-base-minor")?.value || "";
        w1Raw = document.getElementById("trap-base-major")?.value || "";
        l1Raw = document.getElementById("trap-length-right")?.value || "";
        l2Raw = document.getElementById("trap-length-left")?.value || "";
      } else if (activeShape === "quadrilateral") {
        w2Raw = document.getElementById("quad-side-c")?.value || "";
        w1Raw = document.getElementById("quad-side-a")?.value || "";
        l1Raw = document.getElementById("quad-side-d")?.value || "";
        l2Raw = document.getElementById("quad-side-b")?.value || "";
      }

      const w2Val = w2Raw ? `م ${w2Raw}` : "—";
      const w1Val = w1Raw ? `م ${w1Raw}` : "—";
      const l1Val = l1Raw ? `م ${l1Raw}` : "—";
      const l2Val = l2Raw ? `م ${l2Raw}` : "—";

      const w1Num = parseFloat(w1Raw) || 0;
      const w2Num = parseFloat(w2Raw) || 0;
      const l1Num = parseFloat(l1Raw) || 0;
      const l2Num = parseFloat(l2Raw) || 0;

      const avgWidth = (w1Num + w2Num) / 2;
      const avgLength = (l1Num + l2Num) / 2;

      // 2. جلب قائمة الورثة والشركاء المحدثة فورياً من محرك الحسابات أو عناصر الجدول DOM
      let heirs = [];
      if (typeof global.getDallalHeirsData === "function") {
        heirs = global.getDallalHeirsData() || [];
      } else if (Array.isArray(global.heirsData)) {
        heirs = global.heirsData;
      }

      // قراءة عناصر الجدول DOM لقراءة أطوال الأضلع الحالية بدقة لكل سطر
      const domRows = document.querySelectorAll("#heirs-list tr");
      if (!heirs || heirs.length === 0) {
        heirs = [];
        domRows.forEach((row, idx) => {
          const nameInput = row.querySelector(".heir-name");
          const sqmInput = row.querySelector(".heir-share-sqm");
          const topInput = row.querySelector(".heir-side-top");
          const botInput = row.querySelector(".heir-side-bot");
          const rightInput = row.querySelector(".heir-side-right");
          const leftInput = row.querySelector(".heir-side-left");

          if (nameInput || sqmInput) {
            heirs.push({
              name: nameInput?.value || `الوارث ${idx + 1}`,
              share: parseFloat(sqmInput?.value) || 0,
              topW: parseFloat(topInput?.value) || 0,
              botW: parseFloat(botInput?.value) || 0,
              leftLine: parseFloat(rightInput?.value) || 0,
              divLine: parseFloat(leftInput?.value) || 0
            });
          }
        });
      }

      // 3. حساب وتجميع المساحات والإجماليات الفتية
      let totalAreaNum = 0;
      if (typeof global.getDallalCalculatedArea === "function") {
        totalAreaNum = global.getDallalCalculatedArea() || 0;
      }
      if (totalAreaNum === 0) {
        const areaElText = document.getElementById("calc-area-m2")?.innerText || 
                           document.getElementById("total-limit-area")?.innerText;
        if (areaElText) totalAreaNum = parseFloat(areaElText) || 0;
      }

      let distributedSum = 0;
      heirs.forEach(h => {
        distributedSum += (typeof h.share === "number" ? h.share : parseFloat(h.share) || 0);
      });

      if (totalAreaNum === 0 && distributedSum > 0) {
        totalAreaNum = distributedSum;
      }

      const totalAreaStr = totalAreaNum > 0 ? totalAreaNum.toFixed(2) : (distributedSum > 0 ? distributedSum.toFixed(2) : "—");
      const distributedAreaStr = distributedSum > 0 ? distributedSum.toFixed(2) : totalAreaStr;

      const dirs = typeof global.getP13Directions === "function"
        ? global.getP13Directions()
        : (typeof global.getP11Directions === "function" ? global.getP11Directions() : { top: "شرقي", bottom: "غربي", right: "قبلي", left: "بحري" });

      // 4. الأبعاد والمواصفات الهندسيـة للأرض (تضمين الاتجاهات الأربعة للطباعة كما في الصفحة 11)
      const dimensions = [
        { label: `العرض الأول (${dirs.top || "أعلى"})`, value: w2Val },
        { label: `العرض الثاني (${dirs.bottom || "أسفل"})`, value: w1Val },
        { label: `الطول الأيمن (${dirs.right || "يمين"})`, value: l1Val },
        { label: `الطول الأيسر (${dirs.left || "يسار"})`, value: l2Val },
        { label: "معدل العرض", value: avgWidth > 0 ? `م ${avgWidth.toFixed(4)}` : "—" },
        { label: "متوسط الطول", value: avgLength > 0 ? `م ${avgLength.toFixed(4)}` : "—" },
        { label: "جملة المساحة بالمتر المربع", value: totalAreaStr !== "—" ? `2 م ${totalAreaStr}` : "—", isHighlight: true }
      ];

      // 5. بناء بطاقات الشركاء والورثة مع الأبعاد الأربعة الخاصة بكل بطاقة
      const partnerCardsHTML = heirs.map((h, idx) => {
        const nameText = h.name || `الوارث / الشريك ${idx + 1}`;
        const areaVal = typeof h.share === "number" ? h.share : parseFloat(h.share) || 0;
        const formattedArea = global.formatArea ? global.formatArea(areaVal) : areaVal.toFixed(2);

        // قراءة الأضلاع المباشرة الخاصة بالسهم المعني
        const domRow = domRows[idx];
        const domTop = domRow ? parseFloat(domRow.querySelector(".heir-side-top")?.value) : 0;
        const domBot = domRow ? parseFloat(domRow.querySelector(".heir-side-bot")?.value) : 0;
        const domRight = domRow ? parseFloat(domRow.querySelector(".heir-side-right")?.value) : 0;
        const domLeft = domRow ? parseFloat(domRow.querySelector(".heir-side-left")?.value) : 0;

        const topVal = (h.topW && !isNaN(h.topW) && h.topW > 0) ? h.topW : domTop;
        const botVal = (h.botW && !isNaN(h.botW) && h.botW > 0) ? h.botW : domBot;
        const rightVal = (h.leftLine && !isNaN(h.leftLine) && h.leftLine > 0) ? h.leftLine : ((h.rightL && !isNaN(h.rightL)) ? h.rightL : domRight);
        const leftVal = (h.divLine && !isNaN(h.divLine) && h.divLine > 0) ? h.divLine : ((h.leftL && !isNaN(h.leftL)) ? h.leftL : domLeft);

        const topStr = (topVal > 0 && !isNaN(topVal)) ? `م ${topVal.toFixed(2)}` : "—";
        const botStr = (botVal > 0 && !isNaN(botVal)) ? `م ${botVal.toFixed(2)}` : "—";
        const rightStr = (rightVal > 0 && !isNaN(rightVal)) ? `م ${rightVal.toFixed(2)}` : "—";
        const leftStr = (leftVal > 0 && !isNaN(leftVal)) ? `م ${leftVal.toFixed(2)}` : "—";

        let fcsText = "0 سهم";
        if (global.convertSquareMetersToFCS) {
          const fcs = global.convertSquareMetersToFCS(areaVal);
          fcsText = `(${fcs.feddan} فدان، ${fcs.carat} ق، ${fcs.sahm.toFixed(2)} س)`;
        } else if (global.AgriUnitsCompat) {
          const fcs = global.AgriUnitsCompat.sqmToFCS(areaVal, caratSize);
          fcsText = `(${fcs.feddan} فدان، ${fcs.carat} ق، ${fcs.sahm.toFixed(2)} س)`;
        }

        const avgW = (topVal + botVal) / 2;
        const avgL = (rightVal + leftVal) / 2;


        return `
          <div class="pcard">
            <div class="pcard-hdr">${nameText}</div>
            <table class="pcard-table">
              <thead>
                <tr>
                  <th style="text-align:center;width:55%;">البيان</th>
                  <th style="text-align:center;">القيمة</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style="text-align:center;padding:3px 6px;">العرض الأول (${dirs.top || "أعلى"})</td><td class="td-val" style="text-align:center;padding:3px 6px;">${topStr}</td></tr>
                <tr><td style="text-align:center;padding:3px 6px;">العرض الثاني (${dirs.bottom || "أسفل"})</td><td class="td-val" style="text-align:center;padding:3px 6px;">${botStr}</td></tr>
                <tr><td style="text-align:center;padding:3px 6px;">الطول الأيمن (${dirs.right || "يمين"})</td><td class="td-val" style="text-align:center;padding:3px 6px;">${rightStr}</td></tr>
                <tr><td style="text-align:center;padding:3px 6px;">الطول الأيسر (${dirs.left || "يسار"})</td><td class="td-val" style="text-align:center;padding:3px 6px;">${leftStr}</td></tr>
                <tr><td style="text-align:center;padding:3px 6px;">معدل العرض</td><td class="td-val" style="text-align:center;padding:3px 6px;">${avgW > 0 ? "م " + avgW.toFixed(4) : "—"}</td></tr>
                <tr><td style="text-align:center;padding:3px 6px;">متوسط الطول</td><td class="td-val" style="text-align:center;padding:3px 6px;">${avgL > 0 ? "م " + avgL.toFixed(4) : "—"}</td></tr>
              </tbody>
            </table>
            <div class="pcard-foot">
              <span class="pcard-foot-lbl">جملة المساحة بالمتر المربع</span>
              <span class="pcard-foot-area">2 م ${formattedArea}</span>
              <span class="pcard-foot-fcs">${fcsText}</span>
            </div>
          </div>
        `;
      }).join("");

      const numCards = heirs.length;
      let gridStyle = "grid-template-columns: repeat(3, 1fr);";
      if (numCards === 1) {
        gridStyle = "grid-template-columns: 1fr; max-width: 320px; margin: 0 auto;";
      } else if (numCards === 2) {
        gridStyle = "grid-template-columns: repeat(2, 1fr); max-width: 640px; margin: 0 auto;";
      }

      // 6. الإجماليات والملاحظات
      let fcsTotal = { feddan: 0, carat: 0, sahm: 0 };
      if (global.convertSquareMetersToFCS) {
        fcsTotal = global.convertSquareMetersToFCS(totalAreaNum);
      } else if (global.AgriUnitsCompat) {
        fcsTotal = global.AgriUnitsCompat.sqmToFCS(totalAreaNum, caratSize);
      }

      const totals = {
        totalArea: totalAreaStr,
        totalFeddans: fcsTotal.feddan,
        totalCarats: fcsTotal.carat,
        totalShares: typeof fcsTotal.sahm === "number" ? fcsTotal.sahm.toFixed(2) : fcsTotal.sahm,
        caratArea: caratSize
      };

      const notes = [
        "1 - تم إجراء التوزيع والمساحة وفقاً لدقة الرسم الهندسي وشوليس الموحد.",
        `2 - إجمالي المساحة الموزعة: ${distributedAreaStr} م² من أصل ${totalAreaStr} م².`,
        `3 - عدد الورثة والشركاء المستفيدين: ${heirs.length} شريك.`
      ];

      return {
        reportTitle: "تقرير رسم وتقسيم الأراضي",
        reportSubtitle: "قسمة الورثة والشركاء",
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
    module.exports = Page13Adapter;
  } else {
    global.Page13Adapter = Page13Adapter;
  }
})(typeof window !== "undefined" ? window : global);
