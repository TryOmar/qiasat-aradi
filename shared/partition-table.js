/**
 * shared/partition-table.js — Dallal Partition Table Engine
 * ==========================================================
 * محرك موحد لإدارة جدول الشركاء في تقسيم الأراضي.
 *
 * المرجع: Page11 (النسخة المستقرة المعتمدة) — v2.1.0-stable
 *
 * القواعد المعمارية:
 *  - لا متغيرات عامة (Global Variables).
 *  - لا اعتماد على DOM خارج ما يُمرَّر كـ parameter.
 *  - جميع البيانات تأتي عبر معاملات صريحة.
 *  - النتائج تُعاد دون تعديل الحالة العامة للتطبيق.
 *  - تنسيق الأرقام يُفوَّض لـ DallalFormatters (shared/formatters.js).
 *
 * الاستخدام:
 *  const row = PartitionTable.buildPartnerRow({ mode, name, ... }, callbacks);
 *  PartitionTable.updateRowData(row, data);
 *  const totals = PartitionTable.calculateTotals(listEl, geometry, options);
 *  PartitionTable.updateSummaryStates(totals, summaryEls, geometry);
 *
 * @version 1.0.0
 * @since   Commit 9.1
 */
(function (global) {
  "use strict";

  // --- تبعية formatters ---
  function _fmt(value, decimals) {
    if (global.DallalFormatters && typeof global.DallalFormatters.formatArea === "function") {
      if (decimals === 2 || decimals === undefined) {
        return global.DallalFormatters.formatArea(value);
      }
    }
    const num = Number(value);
    if (isNaN(num)) return (0).toFixed(decimals || 2);
    return num.toFixed(decimals || 2);
  }

  function _fmtPct(value) {
    if (global.DallalFormatters && typeof global.DallalFormatters.formatPercent === "function") {
      return global.DallalFormatters.formatPercent(value);
    }
    const num = Number(value);
    return (isNaN(num) ? 0 : num).toFixed(2) + " %";
  }

  // ─── buildPartnerRow ──────────────────────────────────────────────────────
  /**
   * ينشئ صف شريك (<tr>) جاهزاً للإدراج في جدول الشركاء.
   * متوافق بالكامل مع هيكل Page11 المرجعي.
   *
   * @param {Object} opts
   * @param {string}  opts.mode       - "carats" | "fraction"
   * @param {string}  [opts.name]
   * @param {string}  [opts.feddans]
   * @param {string}  [opts.carats]
   * @param {string}  [opts.shares]
   * @param {string}  [opts.fraction]
   * @param {string}  [opts.botW]     - افتراضي: "-"
   * @param {string}  [opts.topW]     - افتراضي: "-"
   * @param {Object}  callbacks       - دوال ربط الأحداث (اسم الدالة كنص)
   * @returns {HTMLTableRowElement}
   */
  function buildPartnerRow(opts, callbacks) {
    opts      = opts      || {};
    callbacks = callbacks || {};

    const mode     = opts.mode     || "carats";
    const name     = opts.name     || "";
    const feddans  = opts.feddans  !== undefined ? opts.feddans  : "";
    const carats   = opts.carats   !== undefined ? opts.carats   : "";
    const shares   = opts.shares   !== undefined ? opts.shares   : "";
    const fraction = opts.fraction !== undefined ? opts.fraction : "";
    const botW     = opts.botW     !== undefined ? opts.botW     : "-";
    const topW     = opts.topW     !== undefined ? opts.topW     : "-";

    // تنسيق قيم FCS (مطابق لسلوك Page11)
    var formattedFeddans = "";
    if (feddans !== "" && feddans !== null && feddans !== undefined) {
      var fVal = parseFloat(feddans);
      if (!isNaN(fVal)) formattedFeddans = Math.round(fVal);
    }
    var formattedCarats = "";
    if (carats !== "" && carats !== null && carats !== undefined) {
      var cVal = parseFloat(carats);
      if (!isNaN(cVal)) formattedCarats = Math.round(cVal);
    }
    var formattedShares = "";
    if (shares !== "" && shares !== null && shares !== undefined) {
      var sVal = parseFloat(shares);
      if (!isNaN(sVal)) formattedShares = Number(sVal.toFixed(2));
    }

    // أسماء دوال الأحداث (قابلة للتخصيص)
    var cbNameInput    = callbacks.onNameInput    || "onPartnerNameInput(this)";
    var cbNameBlur     = callbacks.onNameBlur     || "onPartnerNameBlur(this)";
    var cbShareInput   = callbacks.onShareInput   || "onShareInput(this)";
    var cbNormalize    = callbacks.onNormalize    || "normalizeInputFCS(this)";
    var cbAreaInput    = callbacks.onAreaInput    || "onAreaInput(this)";
    var cbPercentInput = callbacks.onPercentInput || "onPercentInput(this)";
    var cbDeleteRow    = callbacks.onDeleteRow    || "deletePartnerRow(this)";

    // الأعمدة المشتركة بين الوضعين
    function widthGroupHTML(side) {
      var valW   = side === "top" ? topW : botW;
      var cls    = side === "top" ? "partner-width-top" : "partner-width-bottom";
      var cbCh   = callbacks.onWidthChange
        ? callbacks.onWidthChange.replace(/\{side\}/g, side)
        : "onWidthChange(this, '" + side + "')";
      var cbMin  = callbacks.onAdjustWidth
        ? callbacks.onAdjustWidth.replace(/\{side\}/g, side).replace(/\{dir\}/g, "-1")
        : "adjustWidthStep(this, '" + side + "', -1)";
      var cbPlus = callbacks.onAdjustWidth
        ? callbacks.onAdjustWidth.replace(/\{side\}/g, side).replace(/\{dir\}/g, "1")
        : "adjustWidthStep(this, '" + side + "', 1)";
      return '<div class="width-input-container">' +
        '<button type="button" class="width-step-btn" onclick="' + cbMin + '">-</button>' +
        '<input type="text" inputmode="decimal" enterkeyhint="next" class="' + cls + '"' +
          ' oninput="' + cbCh + '" onblur="' + cbCh + '"' +
          ' value="' + valW + '" data-last-val="' + valW + '">' +
        '<button type="button" class="width-step-btn" onclick="' + cbPlus + '">+</button>' +
        '</div>';
    }

    var commonCols =
      '<td class="width-top-group">'    + widthGroupHTML("top")    + '</td>' +
      '<td class="width-bottom-group">' + widthGroupHTML("bottom") + '</td>' +
      '<td class="width-avg-group">' +
        '<input type="text" class="partner-width-avg" readonly value="-">' +
      '</td>' +
      '<td class="length-avg-group">' +
        '<input type="text" class="partner-length-avg" readonly value="-">' +
      '</td>' +
      '<td class="cum-group">' +
        '<textarea class="partner-cum-width" readonly>-</textarea>' +
      '</td>' +
      '<td>' +
        '<button type="button" class="delete-row-btn" onclick="' + cbDeleteRow + '">&times;</button>' +
      '</td>';

    var row = document.createElement("tr");
    row.className = "partner-row";

    if (mode === "carats") {
      row.innerHTML =
        '<td class="index-group">' +
          '<input type="text" class="partner-index" readonly value="-">' +
        '</td>' +
        '<td class="name-group">' +
          '<input type="text" class="partner-name" placeholder="اسم الشريك" value="' + name + '"' +
            ' oninput="' + cbNameInput + '" onblur="' + cbNameBlur + '"' +
            ' onkeydown="if(event.key===\'Enter\')this.blur()">' +
        '</td>' +
        '<td class="share-group">' +
          '<input type="text" inputmode="decimal" class="partner-shares" placeholder="0"' +
            ' value="' + formattedShares + '" oninput="' + cbShareInput + '" onblur="' + cbNormalize + '"' +
            ' onkeydown="if(event.key===\'Enter\')this.blur()">' +
        '</td>' +
        '<td class="carat-group">' +
          '<input type="text" inputmode="decimal" class="partner-carats" placeholder="0"' +
            ' value="' + formattedCarats + '" oninput="' + cbShareInput + '" onblur="' + cbNormalize + '"' +
            ' onkeydown="if(event.key===\'Enter\')this.blur()">' +
        '</td>' +
        '<td class="feddan-group">' +
          '<input type="text" inputmode="decimal" class="partner-feddans" placeholder="0"' +
            ' value="' + formattedFeddans + '" oninput="' + cbShareInput + '" onblur="' + cbNormalize + '"' +
            ' onkeydown="if(event.key===\'Enter\')this.blur()">' +
        '</td>' +
        '<td class="area-group">' +
          '<input type="text" inputmode="decimal" class="partner-area" value="-"' +
            ' oninput="' + cbAreaInput + '" onblur="' + cbAreaInput + '"' +
            ' onkeydown="if(event.key===\'Enter\')this.blur()">' +
        '</td>' +
        '<td class="percent-group">' +
          '<input type="text" inputmode="decimal" class="partner-percent" value="-"' +
            ' oninput="' + cbPercentInput + '" onblur="' + cbPercentInput + '"' +
            ' onkeydown="if(event.key===\'Enter\')this.blur()">' +
        '</td>' +
        commonCols;
    } else {
      row.innerHTML =
        '<td class="index-group">' +
          '<input type="text" class="partner-index" readonly value="-">' +
        '</td>' +
        '<td class="name-group">' +
          '<input type="text" class="partner-name" placeholder="اسم الشريك" value="' + name + '"' +
            ' oninput="' + cbNameInput + '" onblur="' + cbNameBlur + '"' +
            ' onkeydown="if(event.key===\'Enter\')this.blur()">' +
        '</td>' +
        '<td class="fraction-group">' +
          '<input type="text" class="partner-fraction" placeholder="مثال: 1/4"' +
            ' value="' + fraction + '" oninput="' + cbShareInput + '" onblur="' + cbShareInput + '"' +
            ' onkeydown="if(event.key===\'Enter\')this.blur()">' +
        '</td>' +
        '<td class="equiv-group">' +
          '<input type="text" class="partner-equiv" readonly value="-">' +
        '</td>' +
        '<td class="area-group">' +
          '<input type="text" inputmode="decimal" class="partner-area" value="-"' +
            ' oninput="' + cbAreaInput + '" onblur="' + cbAreaInput + '"' +
            ' onkeydown="if(event.key===\'Enter\')this.blur()">' +
        '</td>' +
        '<td class="percent-group">' +
          '<input type="text" inputmode="decimal" class="partner-percent" value="-"' +
            ' oninput="' + cbPercentInput + '" onblur="' + cbPercentInput + '"' +
            ' onkeydown="if(event.key===\'Enter\')this.blur()">' +
        '</td>' +
        commonCols;
    }

    return row;
  }

  // ─── updateRowData ────────────────────────────────────────────────────────
  /**
   * يُحدِّث قيم صف شريك بعد الحساب، دون استبدال الصف كاملاً.
   * (يمنع فقدان التركيز — مطابق لسلوك Page11)
   *
   * @param {HTMLTableRowElement} row
   * @param {Object} data
   */
  function updateRowData(row, data) {
    if (!row || !data) return;

    function setVal(selector, value) {
      var el = row.querySelector(selector);
      if (el && value !== undefined && value !== null) {
        el.value = value;
      }
    }

    if (data.index      !== undefined) setVal(".partner-index",         data.index);
    if (data.area       !== undefined) setVal(".partner-area",          _fmt(data.area));
    if (data.percent    !== undefined) setVal(".partner-percent",       _fmtPct(data.percent));
    if (data.widthTop   !== undefined) setVal(".partner-width-top",     data.widthTop);
    if (data.widthBot   !== undefined) setVal(".partner-width-bottom",  data.widthBot);
    if (data.widthAvg   !== undefined) setVal(".partner-width-avg",     data.widthAvg);
    if (data.lengthAvg  !== undefined) setVal(".partner-length-avg",    data.lengthAvg);
    if (data.equiv      !== undefined) setVal(".partner-equiv",         data.equiv);

    if (data.cumWidth !== undefined) {
      var ta = row.querySelector(".partner-cum-width");
      if (ta) ta.value = data.cumWidth;
    }
  }

  // ─── calculateTotals ─────────────────────────────────────────────────────
  /**
   * يحسب إجماليات الجدول.
   *
   * @param {NodeList|Array} rows     - صفوف .partner-row
   * @param {Object}         geometry - { w1, w2, l1, l2 } بالمتر
   * @param {Object}         opts     - { mode, isManualPartition, remRow, convertSqmToFCS, parseFraction }
   * @returns {Object}                - { totalArea, totalAreaM2, totalPercent, sharesTotal, totalBotWidth, totalTopWidth }
   */
  function calculateTotals(rows, geometry, opts) {
    opts      = opts      || {};
    geometry  = geometry  || {};

    var mode              = opts.mode              || "carats";
    var isManualPartition = opts.isManualPartition || false;
    var remRow            = opts.remRow            || null;
    var convertSqmToFCS  = opts.convertSqmToFCS   || null;
    var parseFraction     = opts.parseFraction     || null;

    var w1 = parseFloat(geometry.w1) || 0;
    var w2 = parseFloat(geometry.w2) || 0;
    var l1 = parseFloat(geometry.l1) || 0;
    var l2 = parseFloat(geometry.l2) || 0;

    var totalAreaM2 = ((l1 + l2) / 2) * ((w1 + w2) / 2);

    var isRemVisible = remRow &&
      remRow.style.display !== "none" &&
      remRow.style.display !== "";

    // 1. مجموع المساحات
    var totalArea = 0;
    Array.from(rows).forEach(function(row) {
      var el = row.querySelector(".partner-area");
      if (el) totalArea += parseFloat(el.value) || 0;
    });
    if (isRemVisible) {
      var remInputs = remRow.querySelectorAll("input");
      if (remInputs.length >= 7) totalArea += parseFloat(remInputs[5].value) || 0;
    }

    // 2. النسبة المئوية الكلية
    var totalPercent = totalAreaM2 > 0 ? (totalArea / totalAreaM2) * 100 : 0;

    // 3. مجموع الحصص
    var sharesTotal = null;
    if (mode === "carats" && typeof convertSqmToFCS === "function") {
      sharesTotal = convertSqmToFCS(totalArea);
    } else if (mode === "fraction" && typeof parseFraction === "function") {
      var totalFraction = 0;
      Array.from(rows).forEach(function(row) {
        var fi = row.querySelector(".partner-fraction");
        totalFraction += parseFraction(fi ? fi.value : "");
      });
      if (isRemVisible) {
        var ri = remRow.querySelectorAll("input");
        if (ri.length >= 3) totalFraction += parseFloat(ri[2].value) || 0;
      }
      sharesTotal = { fraction: totalFraction };
    }

    // 4. مجموع العروض (يدوي فقط)
    var totalBotWidth = null;
    var totalTopWidth = null;
    if (isManualPartition) {
      totalBotWidth = 0;
      totalTopWidth = 0;
      Array.from(rows).forEach(function(row) {
        var botEl = row.querySelector(".partner-width-bottom");
        var topEl = row.querySelector(".partner-width-top");
        totalBotWidth += parseFloat(botEl ? botEl.value : 0) || 0;
        totalTopWidth += parseFloat(topEl ? topEl.value : 0) || 0;
      });
      if (isRemVisible) {
        var wi = remRow.querySelectorAll("input");
        if (wi.length >= 9) {
          totalBotWidth += parseFloat(wi[7].value) || 0;
          totalTopWidth += parseFloat(wi[8].value) || 0;
        }
      }
    }

    return {
      totalArea     : totalArea,
      totalAreaM2   : totalAreaM2,
      totalPercent  : totalPercent,
      sharesTotal   : sharesTotal,
      totalBotWidth : totalBotWidth,
      totalTopWidth : totalTopWidth
    };
  }

  // ─── updateSummaryStates ─────────────────────────────────────────────────
  /**
   * يُحدِّث عناصر الملخص في الواجهة.
   *
   * @param {Object} totals      - مخرجات calculateTotals
   * @param {Object} summaryEls  - عناصر DOM { totalAreaEl, totalPctEl, sharesEl, caratsEl, feddansEl, fractionEl, totalBotWidthEl, totalTopWidthEl }
   * @param {Object} [opts]      - { mode, isManualPartition }
   */
  function updateSummaryStates(totals, summaryEls, opts) {
    if (!totals || !summaryEls) return;
    opts = opts || {};
    var mode              = opts.mode              || "carats";
    var isManualPartition = opts.isManualPartition || false;

    if (summaryEls.totalAreaEl)
      summaryEls.totalAreaEl.value = _fmt(totals.totalArea);

    if (summaryEls.totalPctEl)
      summaryEls.totalPctEl.value = _fmtPct(totals.totalPercent);

    if (mode === "carats" && totals.sharesTotal) {
      if (summaryEls.sharesEl)  summaryEls.sharesEl.value  = totals.sharesTotal.sahm   || "";
      if (summaryEls.caratsEl)  summaryEls.caratsEl.value  = totals.sharesTotal.carat  || "";
      if (summaryEls.feddansEl) summaryEls.feddansEl.value = totals.sharesTotal.feddan || "";
    } else if (mode === "fraction" && totals.sharesTotal) {
      if (summaryEls.fractionEl)
        summaryEls.fractionEl.value = Number((totals.sharesTotal.fraction * 100).toFixed(2)) + "%";
    }

    if (isManualPartition && totals.totalBotWidth !== null) {
      if (summaryEls.totalBotWidthEl) summaryEls.totalBotWidthEl.value = totals.totalBotWidth.toFixed(4);
      if (summaryEls.totalTopWidthEl) summaryEls.totalTopWidthEl.value = totals.totalTopWidth.toFixed(4);
    } else {
      if (summaryEls.totalBotWidthEl) summaryEls.totalBotWidthEl.value = "-";
      if (summaryEls.totalTopWidthEl) summaryEls.totalTopWidthEl.value = "-";
    }
  }

  // ─── getTableDataArray ───────────────────────────────────────────────────
  /**
   * يُرجع بيانات الجدول كمصفوفة ثنائية الأبعاد.
   * رأس الجدول وترتيب الأعمدة مطابق لـ Page11 مرجعاً.
   *
   * @param {NodeList|Array} rows
   * @param {Object} opts  - { mode, pieces }
   * @returns {Array<Array<string>>}
   */
  function getTableDataArray(rows, opts) {
    opts = opts || {};
    var mode   = opts.mode   || "carats";
    var pieces = opts.pieces || [];
    var data   = [];

    // رأس الجدول — مطابق لـ Page11
    if (mode === "carats") {
      data.push(["م", "الشريك", "سهم", "قيراط", "فدان",
        "المساحة (م²)", "النسبة (%)",
        "العرض الأول (أعلى)", "العرض الثاني (أسفل)",
        "معدل العرض (م)", "معدل الطول (م)", "العلامة (م)", "الفاصل (م)"]);
    } else {
      data.push(["م", "الشريك", "النسبة/الكسر", "تعادل (س.ق.ف)",
        "المساحة (م²)", "النسبة (%)",
        "العرض الأول (أعلى)", "العرض الثاني (أسفل)",
        "معدل العرض (م)", "معدل الطول (م)", "العلامة (م)", "الفاصل (م)"]);
    }

    Array.from(rows).forEach(function(row, idx) {
      var rd = [];
      function q(sel) { var el = row.querySelector(sel); return el ? el.value : "-"; }

      rd.push(q(".partner-index"));
      rd.push(q(".partner-name"));

      if (mode === "carats") {
        rd.push(q(".partner-shares"));
        rd.push(q(".partner-carats"));
        rd.push(q(".partner-feddans"));
      } else {
        rd.push(q(".partner-fraction"));
        rd.push(q(".partner-equiv"));
      }

      rd.push(q(".partner-area"));
      rd.push(q(".partner-percent"));

      // العروض بدقة 4 منازل عشرية
      var w1_val = "-", w2_val = "-";
      if (pieces && pieces[idx]) {
        w1_val = pieces[idx].botW !== undefined ? parseFloat(pieces[idx].botW).toFixed(4) : "-";
        w2_val = pieces[idx].topW !== undefined ? parseFloat(pieces[idx].topW).toFixed(4) : "-";
      } else {
        w2_val = q(".partner-width-top");
        w1_val = q(".partner-width-bottom");
      }
      rd.push(w2_val);
      rd.push(w1_val);

      // معدل العرض ومعدل الطول
      var avgW_val = "-", avgL_val = "-";
      if (w1_val !== "-" && w2_val !== "-") {
        var wn1 = parseFloat(w1_val), wn2 = parseFloat(w2_val);
        if (!isNaN(wn1) && !isNaN(wn2)) {
          var avgW = (wn1 + wn2) / 2;
          avgW_val = avgW.toFixed(4);
          var areaV = parseFloat(q(".partner-area")) || 0;
          avgL_val = avgW > 0 ? (areaV / avgW).toFixed(4) : "-";
        }
      }
      rd.push(avgW_val);
      rd.push(avgL_val);

      rd.push(q(".partner-cum-width"));
      var dl = row.querySelector(".partner-div-line");
      rd.push(dl ? dl.value : "-");

      data.push(rd);
    });

    return data;
  }

  // ─── API ─────────────────────────────────────────────────────────────────
  var PartitionTable = {
    buildPartnerRow   : buildPartnerRow,
    updateRowData     : updateRowData,
    calculateTotals   : calculateTotals,
    updateSummaryStates: updateSummaryStates,
    getTableDataArray : getTableDataArray,
    version           : "1.0.0"
  };

  // تصدير
  if (typeof module !== "undefined" && module.exports) {
    module.exports = PartitionTable;
  } else {
    global.PartitionTable = PartitionTable;
    if (window.DALLAL_DEBUG !== false) {
      console.log("[PartitionTable] v" + PartitionTable.version + " loaded (Commit 9.1)");
    }
  }

})(typeof window !== "undefined" ? window : global);
