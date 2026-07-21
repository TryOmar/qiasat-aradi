/**
 * Page13 Partners Table Adapter (Commit 10.5 / Page11 Exact UI Layout Match)
 * =========================================================================
 * محوّل الواجهة البصرية لربط مصفوفة البيانات window.heirsData بجدول الشركاء القياسي
 * مع الالتزام الحرفي بتسلسل وترتيب أعمدة وصفوف Page11 المرجعية.
 */

(function (global) {
  "use strict";

  const Page13PartnersTableAdapter = {
    renderTable: function () {
      const listEl = document.getElementById("heirs-list");
      if (!listEl) return;

      listEl.innerHTML = "";

      if (!global.heirsData || !Array.isArray(global.heirsData)) {
        global.heirsData = [];
      }

      const caratSizeInput = document.getElementById("carat-size");
      const caratSize = parseFloat(caratSizeInput ? caratSizeInput.value : 168) || 168;
      const totalArea = parseFloat(global.calculatedArea) || 0;

      let cumulativeTop = 0;
      let cumulativeBot = 0;
      let totalSqmSum = 0;
      let totalFeddansSum = 0;
      let totalCaratsSum = 0;
      let totalSharesSum = 0;

      global.heirsData.forEach((heir, index) => {
        const tr = document.createElement("tr");
        tr.className = "table-input partner-row";
        tr.setAttribute("data-id", heir.id || `heir_${index}`);
        tr.setAttribute("data-index", index);

        let conv = { feddans: 0, carats: 0, shares: 0 };
        if (typeof global.convertSqmToFeddans === "function") {
          conv = global.convertSqmToFeddans(heir.share || 0, caratSize);
        }

        const pct = totalArea > 0 ? ((heir.share || 0) / totalArea) * 100 : 0;
        const topW = parseFloat(heir.topW) || 0;
        const botW = parseFloat(heir.botW) || 0;
        const avgW = (topW + botW) / 2;
        const avgL = avgW > 0 ? (heir.share || 0) / avgW : 0;

        const prevTop = cumulativeTop;
        const prevBot = cumulativeBot;
        cumulativeTop += topW;
        cumulativeBot += botW;

        totalSqmSum += (heir.share || 0);
        totalFeddansSum += conv.feddans;
        totalCaratsSum += conv.carats;
        totalSharesSum += conv.shares;

        // الترتيب الحرفي لـ Page11 (من اليمين للياسر):
        // 1. م | 2. الشريك | 3. سهم | 4. قيراط | 5. فدان | 6. المساحة (م²) | 7. النسبة (%) | 8. العرض الأول (أعلى) | 9. العرض الثاني (أسفل) | 10. معدل العرض | 11. معدل الطول | 12. العلامة | 13. حذف
        tr.innerHTML = `
          <td class="index-group" style="font-weight: bold; background: #e8f5e9; color: #1b5e20; width: 35px; text-align: center;">${index + 1}</td>
          <td class="name-group">
            <input type="text" class="partner-name-input heir-name" value="${heir.name || 'شريك ' + (index + 1)}" onchange="Page13PartnersTableAdapter.onNameChange('${heir.id}', this.value)" dir="auto" style="font-weight: bold; font-family: Cairo, Arial, sans-serif;" />
          </td>
          <td class="share-group"><input type="text" inputmode="decimal" value="${conv.shares.toFixed(2)}" class="heir-share-sahm" oninput="Page13PartnersTableAdapter.onUnitShareChange('${heir.id}', this, true)" onchange="Page13PartnersTableAdapter.onUnitShareChange('${heir.id}', this, false)" onblur="Page13PartnersTableAdapter.onUnitShareChange('${heir.id}', this, false)" style="text-align: center;" /></td>
          <td class="carat-group"><input type="text" inputmode="decimal" value="${Math.round(conv.carats)}" class="heir-share-carat" oninput="Page13PartnersTableAdapter.onUnitShareChange('${heir.id}', this, true)" onchange="Page13PartnersTableAdapter.onUnitShareChange('${heir.id}', this, false)" onblur="Page13PartnersTableAdapter.onUnitShareChange('${heir.id}', this, false)" style="text-align: center;" /></td>
          <td class="feddan-group"><input type="text" inputmode="decimal" value="${Math.round(conv.feddans)}" class="heir-share-feddan" oninput="Page13PartnersTableAdapter.onUnitShareChange('${heir.id}', this, true)" onchange="Page13PartnersTableAdapter.onUnitShareChange('${heir.id}', this, false)" onblur="Page13PartnersTableAdapter.onUnitShareChange('${heir.id}', this, false)" style="text-align: center;" /></td>
          <td class="area-group">
            <input type="text" inputmode="decimal" class="heir-share-sqm" value="${(heir.share || 0).toFixed(2)}" oninput="Page13PartnersTableAdapter.onShareChange('${heir.id}', this.value, true)" onchange="Page13PartnersTableAdapter.onShareChange('${heir.id}', this.value, false)" onblur="Page13PartnersTableAdapter.onShareChange('${heir.id}', this.value, false)" dir="auto" style="font-weight: bold; text-align: center; color: #1b5e20;" />
          </td>
          <td class="percent-group">
            <input type="text" inputmode="decimal" value="% ${pct.toFixed(2)}" class="heir-share-pct" oninput="Page13PartnersTableAdapter.onPercentChange('${heir.id}', this.value, true)" onchange="Page13PartnersTableAdapter.onPercentChange('${heir.id}', this.value, false)" onblur="Page13PartnersTableAdapter.onPercentChange('${heir.id}', this.value, false)" style="text-align: center; font-weight: bold;" />
          </td>
          <td class="width-top-group">
            <input type="text" inputmode="decimal" value="${topW.toFixed(4)}" class="heir-side-top" oninput="Page13PartnersTableAdapter.onWidthDirectChange('${heir.id}', 'top', this.value, true)" onchange="Page13PartnersTableAdapter.onWidthDirectChange('${heir.id}', 'top', this.value, false)" onblur="Page13PartnersTableAdapter.onWidthDirectChange('${heir.id}', 'top', this.value, false)" style="width: 75px; text-align: center; font-weight: bold; color: #1b5e20;" />
          </td>
          <td class="width-bottom-group">
            <input type="text" inputmode="decimal" value="${botW.toFixed(4)}" class="heir-side-bot" oninput="Page13PartnersTableAdapter.onWidthDirectChange('${heir.id}', 'bot', this.value, true)" onchange="Page13PartnersTableAdapter.onWidthDirectChange('${heir.id}', 'bot', this.value, false)" onblur="Page13PartnersTableAdapter.onWidthDirectChange('${heir.id}', 'bot', this.value, false)" style="width: 75px; text-align: center; font-weight: bold; color: #1b5e20;" />
          </td>
          <td class="width-avg-group">
            <input type="text" readonly value="${avgW.toFixed(4)}" style="text-align: center; font-weight: bold; color: #1b5e20; background: #e8f5e9;" />
          </td>
          <td class="length-avg-group">
            <input type="text" readonly value="${avgL.toFixed(4)}" style="text-align: center; font-weight: bold; color: #1b5e20; background: #e8f5e9;" />
          </td>
          <td class="no-print delete-group" style="text-align: center;">
            <button type="button" class="btn btn-delete-row" onclick="Page13PartnersTableAdapter.removePartner('${heir.id}')" title="حذف الشريك" style="background: #ffebee; color: #c62828; border: 1px solid #ffcdd2; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-weight: bold;">✕</button>
          </td>
        `;

        listEl.appendChild(tr);
      });

      if (global.remainderPiece && global.remainderPiece.share > 0.01) {
        const rem = global.remainderPiece;
        let remConv = { feddans: 0, carats: 0, shares: 0 };
        if (typeof global.convertSqmToFeddans === "function") {
          remConv = global.convertSqmToFeddans(rem.share, caratSize);
        }
        const remPct = totalArea > 0 ? (rem.share / totalArea) * 100 : 0;
        const remAvgW = (rem.topW + rem.botW) / 2;
        const remAvgL = remAvgW > 0 ? rem.share / remAvgW : 0;

        const remTr = document.createElement("tr");
        remTr.className = "table-input remainder-row-table";
        remTr.style.background = "#fffde7";
        remTr.style.borderTop = "1.5px dashed #ffa000";

        remTr.innerHTML = `
          <td class="index-group" style="font-weight: bold; color: #e65100; text-align: center; background: #fffde7;">-</td>
          <td class="name-group">
            <input type="text" readonly value="🟡 المتبقي" style="font-weight: bold; color: #e65100; background: #fffde7; text-align: center;" />
          </td>
          <td class="share-group"><input type="text" readonly value="${remConv.shares.toFixed(2)}" style="text-align: center; font-weight: bold; color: #e65100; background: #fffde7;" /></td>
          <td class="carat-group"><input type="text" readonly value="${Math.round(remConv.carats)}" style="text-align: center; font-weight: bold; color: #e65100; background: #fffde7;" /></td>
          <td class="feddan-group"><input type="text" readonly value="${Math.round(remConv.feddans)}" style="text-align: center; font-weight: bold; color: #e65100; background: #fffde7;" /></td>
          <td class="area-group"><input type="text" readonly value="${rem.share.toFixed(2)}" style="text-align: center; font-weight: bold; color: #e65100; background: #fffde7;" /></td>
          <td class="percent-group"><input type="text" readonly value="% ${remPct.toFixed(2)}" style="text-align: center; font-weight: bold; color: #e65100; background: #fffde7;" /></td>
          <td class="width-top-group"><input type="text" readonly value="${rem.topW.toFixed(4)}" style="text-align: center; font-weight: bold; color: #e65100; background: #fffde7;" /></td>
          <td class="width-bottom-group"><input type="text" readonly value="${rem.botW.toFixed(4)}" style="text-align: center; font-weight: bold; color: #e65100; background: #fffde7;" /></td>
          <td class="width-avg-group"><input type="text" readonly value="${remAvgW.toFixed(4)}" style="text-align: center; font-weight: bold; color: #e65100; background: #fffde7;" /></td>
          <td class="length-avg-group"><input type="text" readonly value="${remAvgL.toFixed(4)}" style="text-align: center; font-weight: bold; color: #e65100; background: #fffde7;" /></td>
          <td class="no-print delete-group" style="text-align: center; font-weight: bold; color: #e65100; background: #fffde7;">-</td>
        `;
        listEl.appendChild(remTr);
      }

      this.updateSummary(totalSqmSum, totalFeddansSum, totalCaratsSum, totalSharesSum, cumulativeTop, cumulativeBot);
    },

    adjustWidth: function(id, type, delta) {
      const heir = global.heirsData.find(h => h.id === id);
      if (heir) {
        if (type === 'top') heir.topW = Math.max(0, (heir.topW || 0) + delta);
        if (type === 'bot') heir.botW = Math.max(0, (heir.botW || 0) + delta);
        if (typeof global.calculateAll === "function") global.calculateAll();
        if (typeof global.saveStateToSession === "function") global.saveStateToSession();
      }
    },

    onNameChange: function (id, newName) {
      const heir = global.heirsData.find(h => h.id === id);
      if (heir) {
        heir.name = newName;
        if (typeof global.saveStateToSession === "function") global.saveStateToSession();
        if (typeof global.drawCroquis === "function") global.drawCroquis();
      }
    },

    onShareChange: function (id, newShareVal, isLiveInput) {
      const val = parseFloat(newShareVal);
      if (isNaN(val) || val < 0) return;
      const heir = global.heirsData.find(h => h.id === id);
      if (heir) {
        heir.share = val;
        
        // تحديث الخلايا المجاورة في نفس الصف دون المساس بهيكل الـ DOM
        const row = document.querySelector(`tr[data-id="${id}"]`);
        if (row) {
          const caratSizeInput = document.getElementById("carat-size");
          const caratSize = parseFloat(caratSizeInput ? caratSizeInput.value : 168) || 168;
          if (typeof global.convertSqmToFeddans === "function") {
            const conv = global.convertSqmToFeddans(val, caratSize);
            const sahmEl = row.querySelector(".heir-share-sahm");
            const caratEl = row.querySelector(".heir-share-carat");
            const feddanEl = row.querySelector(".heir-share-feddan");
            const pctEl = row.querySelector(".heir-share-pct");
            const totalArea = parseFloat(global.calculatedArea) || 0;
            const pct = totalArea > 0 ? (val / totalArea) * 100 : 0;
            
            if (sahmEl && document.activeElement !== sahmEl) sahmEl.value = conv.shares.toFixed(2);
            if (caratEl && document.activeElement !== caratEl) caratEl.value = Math.round(conv.carats);
            if (feddanEl && document.activeElement !== feddanEl) feddanEl.value = Math.round(conv.feddans);
            if (pctEl && document.activeElement !== pctEl) pctEl.value = `% ${pct.toFixed(2)}`;
          }
        }

        // مطابق لـ Page11: تحديث الأبعاد + رسم الكروكي أثناء الكتابة دون أي إعادة بناء DOM
        if (typeof global.recalculateHeirsDimensions === "function") {
          global.recalculateHeirsDimensions();
        }
        // تحديث قيم العروض والأطوال في صفوف الجدول القائمة (مثل updateTableRowsUI في Page11)
        if (typeof global.updateHeirsUI === "function") {
          global.updateHeirsUI();
        }
        // إعادة رسم الكروكي (مطابق لـ renderCroquis() في Page11/runPartition السطر 1974)
        if (typeof global.drawCroquis === "function") {
          global.drawCroquis();
        }
        // تحديث خطوات الحساب بالتفصيل اللحظي (مع حماية الحسابات)
        try {
          if (typeof global.updateCalculationSteps === "function") {
            global.updateCalculationSteps();
          }
        } catch (e) {
          console.error("Calculation Steps Error in adapter:", e);
        }

        if (!isLiveInput) {
          // بعد انتهاء الإدخال: إعادة الحساب الكامل وإعادة بناء الجدول والحفظ
          if (typeof global.calculateAll === "function") global.calculateAll();
          this.renderTable();
          if (typeof global.saveStateToSession === "function") global.saveStateToSession();
        }
      }
    },

    onUnitShareChange: function (id, inputEl, isLiveInput) {
      const row = inputEl.closest("tr");
      if (!row) return;
      const feddan = parseFloat(row.querySelector(".heir-share-feddan")?.value) || 0;
      const carat = parseFloat(row.querySelector(".heir-share-carat")?.value) || 0;
      const sahm = parseFloat(row.querySelector(".heir-share-sahm")?.value) || 0;
      
      const caratSizeInput = document.getElementById("carat-size");
      const caratSize = parseFloat(caratSizeInput ? caratSizeInput.value : 168) || 168;

      const totalSqm = (feddan * 24 + carat + sahm / 24) * caratSize;
      const heir = global.heirsData.find(h => h.id === id);
      if (heir) {
        heir.share = totalSqm;
        
        const sqmEl = row.querySelector(".heir-share-sqm");
        const pctEl = row.querySelector(".heir-share-pct");
        const totalArea = parseFloat(global.calculatedArea) || 0;
        const pct = totalArea > 0 ? (totalSqm / totalArea) * 100 : 0;
        
        if (sqmEl && document.activeElement !== sqmEl) sqmEl.value = totalSqm.toFixed(2);
        if (pctEl && document.activeElement !== pctEl) pctEl.value = `% ${pct.toFixed(2)}`;

        // مطابق لـ Page11: تحديث الأبعاد + رسم الكروكي أثناء الكتابة دون أي إعادة بناء DOM
        if (typeof global.recalculateHeirsDimensions === "function") {
          global.recalculateHeirsDimensions();
        }
        if (typeof global.updateHeirsUI === "function") {
          global.updateHeirsUI();
        }
        if (typeof global.drawCroquis === "function") {
          global.drawCroquis();
        }

        if (!isLiveInput) {
          // بعد انتهاء الإدخال: إعادة الحساب الكامل وإعادة بناء الجدول والحفظ
          if (typeof global.calculateAll === "function") global.calculateAll();
          this.renderTable();
          if (typeof global.saveStateToSession === "function") global.saveStateToSession();
        }
      }
    },

    onPercentChange: function (id, pctValStr, isLiveInput) {
      const cleanStr = String(pctValStr || '').replace(/[^0-9.]/g, '');
      const pct = parseFloat(cleanStr);
      if (isNaN(pct) || pct < 0) return;
      const totalArea = parseFloat(global.calculatedArea) || 0;
      const sqm = (pct / 100) * totalArea;
      this.onShareChange(id, sqm, isLiveInput);
    },

    onWidthDirectChange: function (id, type, widthValStr, isLiveInput) {
      const val = Math.max(0, parseFloat(widthValStr) || 0);
      const heir = global.heirsData.find(h => h.id === id);
      if (heir) {
        if (type === 'top') heir.topW = val;
        if (type === 'bot') heir.botW = val;

        const avgW = ((heir.topW || 0) + (heir.botW || 0)) / 2;
        if (avgW > 0 && (heir.leftL || heir.rightL)) {
          const avgL = (heir.leftL && heir.rightL) ? ((heir.leftL + heir.rightL) / 2) : (heir.leftL || heir.rightL || 1);
          heir.share = avgW * avgL;
        }

        if (typeof global.calculateAll === "function") global.calculateAll();
        if (!isLiveInput) {
          this.renderTable();
        }
        if (typeof global.saveStateToSession === "function") global.saveStateToSession();
        if (typeof global.drawCroquis === "function") global.drawCroquis();
      }
    },

    removePartner: function (id) {
      global.heirsData = global.heirsData.filter(h => h.id !== id);
      const countInput = document.getElementById("heirs-count");
      if (countInput) countInput.value = global.heirsData.length;
      
      if (typeof global.distributeEqually === "function") {
        global.distributeEqually();
      } else if (typeof global.generateHeirsTable === "function") {
        global.generateHeirsTable();
      } else {
        this.renderTable();
        if (typeof global.calculateAll === "function") global.calculateAll();
        if (typeof global.saveStateToSession === "function") global.saveStateToSession();
      }
    },

    removeAllPartners: function (skipConfirm = false) {
      if (skipConfirm || confirm("هل أنت متأكد من حذف جميع الشركاء؟")) {
        global.heirsData = [];
        if (typeof window !== "undefined") window.heirsData = [];
        const countInput = document.getElementById("heirs-count");
        if (countInput) countInput.value = 0;
        if (typeof global.generateHeirsTable === "function") global.generateHeirsTable();
      }
    },

    distributeRemainingAreaEqually: function () {
      const totalArea = parseFloat(global.calculatedArea) || 0;
      if (totalArea <= 0 || !global.heirsData || global.heirsData.length === 0) return;
      
      let currentSum = 0;
      global.heirsData.forEach(h => currentSum += (h.share || 0));
      const remaining = totalArea - currentSum;
      
      if (remaining > 0.01) {
        const addPerHeir = remaining / global.heirsData.length;
        global.heirsData.forEach(h => {
          h.share = (h.share || 0) + addPerHeir;
        });
        if (typeof global.calculateAll === "function") global.calculateAll();
        if (typeof global.saveStateToSession === "function") global.saveStateToSession();
      }
    },

    updateSummary: function (sqmSum, fSum, cSum, sSum, topSum, botSum) {
      const distEl = document.getElementById("distributed-area");
      const totEl = document.getElementById("total-limit-area");
      const statusEl = document.getElementById("distribution-status");
      const topAlertEl = document.getElementById("top-deficit-warning");

      const box = document.getElementById("table-remaining-box");
      const remAreaEl = document.getElementById("rem-area-m2");
      const remAcresEl = document.getElementById("rem-acres");
      const remCaratsEl = document.getElementById("rem-carats");
      const remSharesEl = document.getElementById("rem-shares");
      const remLabelEl = document.getElementById("rem-box-label");
      const remIconEl = document.getElementById("rem-box-icon");
      const redistBtn = document.getElementById("btn-redistribute-remainder");

      const totalSharesInput = document.getElementById("total-shares-entered");
      const totalCaratsInput = document.getElementById("total-carats-entered");
      const totalFeddansInput = document.getElementById("total-feddans-entered");
      const totalAreaInput = document.getElementById("total-area-distributed");
      const totalPercentInput = document.getElementById("total-percent-distributed");
      const totalTopWidthInput = document.getElementById("total-width-top-calculated");
      const totalBotWidthInput = document.getElementById("total-width-bottom-calculated");

      const caratSizeInput = document.getElementById("carat-size");
      const caratSize = parseFloat(caratSizeInput ? caratSizeInput.value : 168) || 168;
      const totalArea = parseFloat(global.calculatedArea) || 0;

      let totalConv = { feddans: 0, carats: 0, shares: 0 };
      if (typeof global.convertSqmToFeddans === "function") {
        totalConv = global.convertSqmToFeddans(sqmSum || 0, caratSize);
      }

      if (totalSharesInput) totalSharesInput.value = totalConv.shares.toFixed(2);
      if (totalCaratsInput) totalCaratsInput.value = Math.round(totalConv.carats);
      if (totalFeddansInput) totalFeddansInput.value = Math.round(totalConv.feddans);
      if (totalAreaInput) totalAreaInput.value = (sqmSum || 0).toFixed(2);
      if (totalPercentInput) {
        const totalPct = totalArea > 0 ? ((sqmSum || 0) / totalArea) * 100 : 0;
        totalPercentInput.value = `% ${totalPct.toFixed(2)}`;
      }
      
      if (totalTopWidthInput) totalTopWidthInput.value = (topSum || 0).toFixed(4);
      if (totalBotWidthInput) totalBotWidthInput.value = (botSum || 0).toFixed(4);

      if (distEl) distEl.textContent = (sqmSum || 0).toFixed(2);
      if (totEl) totEl.textContent = totalArea.toFixed(2);

      const remainingArea = Number((totalArea - (sqmSum || 0)).toFixed(4));
      const hasDeficit = remainingArea < -0.01;
      const deficitArea = hasDeficit ? Math.abs(remainingArea) : 0;

      global.calcState = {
        totalLandArea: totalArea,
        distributedArea: sqmSum || 0,
        remainingArea: remainingArea,
        deficitArea: deficitArea,
        hasDeficit: hasDeficit
      };

      let statusMsg = "";
      if (Math.abs(remainingArea) <= 0.01) {
        statusMsg = "<span>🟢</span> التوزيع متطابق ومكتمل بالكامل!";
        if (statusEl) {
          statusEl.innerHTML = statusMsg;
          statusEl.className = "status-ok";
          statusEl.style.color = "#2e7d32";
        }
        if (topAlertEl) {
          topAlertEl.style.display = "none";
        }
        if (box) {
          box.style.display = "none";
        }
      } else if (remainingArea > 0.01) {
        let remConv = { feddans: 0, carats: 0, shares: 0 };
        if (typeof global.convertSqmToFeddans === "function") {
          remConv = global.convertSqmToFeddans(remainingArea, caratSize);
        }
        statusMsg = `<span>🟢</span> <strong>المتبقي من الأرض:</strong> ${remainingArea.toFixed(2)} م² ` +
                    `(${remConv.feddans} فدان، ${Math.round(remConv.carats)} قيراط، ${remConv.shares.toFixed(2)} سهم)`;
        if (statusEl) {
          statusEl.innerHTML = statusMsg;
          statusEl.className = "status-info";
          statusEl.style.color = "#1565c0";
        }
        if (topAlertEl) {
          topAlertEl.style.display = "block";
          topAlertEl.style.background = "#e3f2fd";
          topAlertEl.style.border = "1px solid #90caf9";
          topAlertEl.style.color = "#0d47a1";
          topAlertEl.innerHTML = `🟢 <strong>تنبيه المتبقي:</strong> المتبقي من المساحة الكلية هو <strong>${remainingArea.toFixed(2)} م²</strong>. يمكنك توزيعها أو إبقائها كمتروك.`;
        }
        if (box) {
          box.style.display = "flex";
          box.style.backgroundColor = "#fff8e1";
          box.style.borderColor = "#ffe082";
          if (remIconEl) remIconEl.textContent = "🟡";
          if (remLabelEl) {
            remLabelEl.textContent = "يوجد جزء متبقٍ من الأرض يعادل:";
            remLabelEl.style.color = "#e65100";
          }
          if (remAreaEl) {
            remAreaEl.textContent = remainingArea.toFixed(2);
            remAreaEl.parentElement.style.color = "#e65100";
          }
          if (remAcresEl) remAcresEl.textContent = remConv.feddans;
          if (remCaratsEl) remCaratsEl.textContent = Math.round(remConv.carats);
          if (remSharesEl) remSharesEl.textContent = remConv.shares.toFixed(2);
          if (redistBtn) redistBtn.style.display = "inline-flex";
        }
      } else {
        let defConv = { feddans: 0, carats: 0, shares: 0 };
        if (typeof global.convertSqmToFeddans === "function") {
          defConv = global.convertSqmToFeddans(deficitArea, caratSize);
        }
        statusMsg = `<span>🔴</span> <strong>احترس! يوجد عجز في الأرض.</strong> قيمة العجز: <strong>${deficitArea.toFixed(2)} م²</strong> ` +
                    `(${defConv.feddans} فدان، ${Math.round(defConv.carats)} قيراط، ${defConv.shares.toFixed(2)} سهم)`;
        if (statusEl) {
          statusEl.innerHTML = statusMsg;
          statusEl.className = "status-warning";
          statusEl.style.color = "#c62828";
        }
        if (topAlertEl) {
          topAlertEl.style.display = "block";
          topAlertEl.style.background = "#ffebee";
          topAlertEl.style.border = "1.5px solid #ef5350";
          topAlertEl.style.color = "#c62828";
          topAlertEl.innerHTML = `🔴 <strong>احترس! يوجد عجز في الأرض.</strong> مجموع حقوق الشركاء يتجاوز مساحة الأرض الكلية بمقدار <strong>${deficitArea.toFixed(2)} م²</strong>. يرجى مراجعة الأنصبة قبل التوثيق.`;
        }
        if (box) {
          box.style.display = "flex";
          box.style.backgroundColor = "#ffebee";
          box.style.borderColor = "#ffcdd2";
          if (remIconEl) remIconEl.textContent = "🔴";
          if (remLabelEl) {
            remLabelEl.textContent = "يوجد عجز في الأرض يعادل:";
            remLabelEl.style.color = "#c62828";
          }
          if (remAreaEl) {
            remAreaEl.textContent = deficitArea.toFixed(2);
            remAreaEl.parentElement.style.color = "#c62828";
          }
          if (remAcresEl) remAcresEl.textContent = defConv.feddans;
          if (remCaratsEl) remCaratsEl.textContent = Math.round(defConv.carats);
          if (remSharesEl) remSharesEl.textContent = defConv.shares.toFixed(2);
          if (redistBtn) redistBtn.style.display = "none";
        }
      }
    }
  };

  global.Page13PartnersTableAdapter = Page13PartnersTableAdapter;
})(window);
