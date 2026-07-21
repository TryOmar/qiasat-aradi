/**
 * @file shared/engines/steps-engine.js
 * @description محرك خطوات الحساب التفصيلية الموحد لتطبيق الدَّلاَّل (Steps Engine)
 * @version 1.0.0
 * @see docs/ROADMAP_COMMIT13.md
 */

(function (global) {
  "use strict";

  const StepsEngine = {
    /**
     * تحويل الأرقام الإنجليزية إلى أرقام عربية شرق-أوسطية
     * @param {string|number} numStr 
     * @returns {string}
     */
    toArabicNumerals: function (numStr) {
      if (numStr === null || numStr === undefined) return "";
      const str = String(numStr);
      const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
      return str.replace(/[0-9]/g, function (w) {
        return arabicDigits[+w];
      });
    },

    /**
     * توليد نص HTML خطوات الحساب التفصيلية بناءً على المدخلات والشركاء
     * @param {Object} options 
     * @returns {string}
     */
    generateHTML: function (options) {
      options = options || {};
      const shape = options.shape || "rectangle";
      const dimensions = options.dimensions || {};
      const totalAreaM2 = parseFloat(options.calculatedArea || options.totalAreaM2) || 0;
      const heirs = options.heirsData || options.heirs || [];

      if (!totalAreaM2 || totalAreaM2 <= 0) {
        return `<p style="text-align: center; color: #777; font-style: italic;">أدخل الأبعاد والشركاء لعرض تفاصيل الخطوات الحسابية</p>`;
      }

      let html = "";
      const toAr = this.toArabicNumerals;

      // 1. حساب المساحة الإجمالية للأرض
      html += `
        <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px; direction: rtl; text-align: right;">
          <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة (١): حساب المساحة الإجمالية للأرض</strong>
          <div style="font-size: 13px; color: #555;">
      `;

      if (shape === "rectangle") {
        const l = parseFloat(dimensions.rectLength) || 0;
        const w = parseFloat(dimensions.rectWidth) || 0;
        html += `
            قانون المساحة (مستطيل): الطول × العرض<br>
            المساحة = ${toAr(l)} م × ${toAr(w)} م = <strong style="color: #1b5e20;">${toAr(totalAreaM2.toFixed(2))} م²</strong>
        `;
      } else if (shape === "square") {
        const s = parseFloat(dimensions.squareSide) || 0;
        html += `
            قانون المساحة (مربع): الضلع × الضلع<br>
            المساحة = ${toAr(s)} م × ${toAr(s)} م = <strong style="color: #1b5e20;">${toAr(totalAreaM2.toFixed(2))} م²</strong>
        `;
      } else if (shape === "trapezoid") {
        const minor = parseFloat(dimensions.trapBaseMinor) || 0;
        const major = parseFloat(dimensions.trapBaseMajor) || 0;
        const rightL = parseFloat(dimensions.trapLengthRight) || 0;
        const leftL = parseFloat(dimensions.trapLengthLeft) || 0;
        const avgW = (minor + major) / 2;
        const avgL = (rightL + leftL) / 2;
        html += `
            قانون شبه المنحرف: (مجموع القاعدة الصغرى + الكبرى) ÷ 2 × متوسط الضلعين<br>
            متوسط العرض = (${toAr(minor)} + ${toAr(major)}) ÷ 2 = ${toAr(avgW.toFixed(2))} م<br>
            متوسط الطول = (${toAr(rightL)} + ${toAr(leftL)}) ÷ 2 = ${toAr(avgL.toFixed(2))} م<br>
            المساحة الإجمالية = ${toAr(avgW.toFixed(2))} × ${toAr(avgL.toFixed(2))} = <strong style="color: #1b5e20;">${toAr(totalAreaM2.toFixed(2))} م²</strong>
        `;
      } else if (shape === "quadrilateral") {
        const a = parseFloat(dimensions.quadSideA) || 0;
        const b = parseFloat(dimensions.quadSideB) || 0;
        const c = parseFloat(dimensions.quadSideC) || 0;
        const d = parseFloat(dimensions.quadSideD) || 0;
        const d_ac = parseFloat(dimensions.quadDiagAC) || 0;
        const d_bd = parseFloat(dimensions.quadDiagBD) || 0;

        function heron(s1, s2, s3) {
          if (s1 <= 0 || s2 <= 0 || s3 <= 0) return 0;
          const s = (s1 + s2 + s3) / 2;
          const val = s * (s - s1) * (s - s2) * (s - s3);
          return val > 0 ? Math.sqrt(val) : 0;
        }

        if (d_ac > 0) {
          const area1 = heron(a, d, d_ac);
          const area2 = heron(b, c, d_ac);
          const s1 = (a + d + d_ac) / 2;
          const s2 = (b + c + d_ac) / 2;
          html += `
            <strong>طريقة الحساب: تقسيم الأرض الرباعية إلى مثلثين باستخدام القطر المختار (AC = ${toAr(d_ac)} م) وحساب مساحة كل مثلث بقانون هيرون (Heron's Formula):</strong><br><br>
            • <strong>المثلث الأول ABC (أضلاعه: A=${toAr(a)} م، D=${toAr(d)} م، القطر AC=${toAr(d_ac)} م):</strong><br>
            &nbsp;&nbsp; نصف المحيط (s₁) = (${toAr(a)} + ${toAr(d)} + ${toAr(d_ac)}) ÷ 2 = <strong>${toAr(s1.toFixed(2))} م</strong><br>
            &nbsp;&nbsp; المساحة₁ = √[s₁ × (s₁ - A) × (s₁ - D) × (s₁ - AC)]<br>
            &nbsp;&nbsp; المساحة₁ = <strong style="color: #1b5e20;">${toAr(area1.toFixed(2))} م²</strong><br><br>
            • <strong>المثلث الثاني ADC (أضلاعه: B=${toAr(b)} م، C=${toAr(c)} م، القطر AC=${toAr(d_ac)} م):</strong><br>
            &nbsp;&nbsp; نصف المحيط (s₂) = (${toAr(b)} + ${toAr(c)} + ${toAr(d_ac)}) ÷ 2 = <strong>${toAr(s2.toFixed(2))} م</strong><br>
            &nbsp;&nbsp; المساحة₂ = √[s₂ × (s₂ - B) × (s₂ - C) × (s₂ - AC)]<br>
            &nbsp;&nbsp; المساحة₂ = <strong style="color: #1b5e20;">${toAr(area2.toFixed(2))} م²</strong><br><br>
            • <strong>المساحة الكلية للأرض = مساحة المثلث الأول + مساحة المثلث الثاني:</strong><br>
            &nbsp;&nbsp; المساحة الإجمالية = ${toAr(area1.toFixed(2))} م² + ${toAr(area2.toFixed(2))} م² = <strong style="color: #1b5e20; font-size: 15px;">${toAr(totalAreaM2.toFixed(2))} م²</strong>
          `;
        } else if (d_bd > 0) {
          const area1 = heron(a, b, d_bd);
          const area2 = heron(c, d, d_bd);
          const s1 = (a + b + d_bd) / 2;
          const s2 = (c + d + d_bd) / 2;
          html += `
            <strong>طريقة الحساب: تقسيم الأرض الرباعية إلى مثلثين باستخدام القطر المختار (BD = ${toAr(d_bd)} م) وحساب مساحة كل مثلث بقانون هيرون (Heron's Formula):</strong><br><br>
            • <strong>المثلث الأول ABD (أضلاعه: A=${toAr(a)} م، B=${toAr(b)} م، القطر BD=${toAr(d_bd)} م):</strong><br>
            &nbsp;&nbsp; نصف المحيط (s₁) = (${toAr(a)} + ${toAr(b)} + ${toAr(d_bd)}) ÷ 2 = <strong>${toAr(s1.toFixed(2))} م</strong><br>
            &nbsp;&nbsp; المساحة₁ = √[s₁ × (s₁ - A) × (s₁ - B) × (s₁ - BD)]<br>
            &nbsp;&nbsp; المساحة₁ = <strong style="color: #1b5e20;">${toAr(area1.toFixed(2))} م²</strong><br><br>
            • <strong>المثلث الثاني BCD (أضلاعه: C=${toAr(c)} م، D=${toAr(d)} م، القطر BD=${toAr(d_bd)} م):</strong><br>
            &nbsp;&nbsp; نصف المحيط (s₂) = (${toAr(c)} + ${toAr(d)} + ${toAr(d_bd)}) ÷ 2 = <strong>${toAr(s2.toFixed(2))} م</strong><br>
            &nbsp;&nbsp; المساحة₂ = √[s₂ × (s₂ - C) × (s₂ - D) × (s₂ - BD)]<br>
            &nbsp;&nbsp; المساحة₂ = <strong style="color: #1b5e20;">${toAr(area2.toFixed(2))} م²</strong><br><br>
            • <strong>المساحة الكلية للأرض = مساحة المثلث الأول + مساحة المثلث الثاني:</strong><br>
            &nbsp;&nbsp; المساحة الإجمالية = ${toAr(area1.toFixed(2))} م² + ${toAr(area2.toFixed(2))} م² = <strong style="color: #1b5e20; font-size: 15px;">${toAr(totalAreaM2.toFixed(2))} م²</strong>
          `;
        } else {
          const avgW = (a + c) / 2;
          const avgL = (b + d) / 2;
          html += `
              قانون الشكل الرباعي العام: متوسط الضلعين المتقابلين الأولين × متوسط الضلعين المتقابلين الآخرين<br>
              متوسط العرض = (${toAr(a)} + ${toAr(c)}) ÷ 2 = ${toAr(avgW.toFixed(2))} م<br>
              متوسط الطول = (${toAr(b)} + ${toAr(d)}) ÷ 2 = ${toAr(avgL.toFixed(2))} م<br>
              المساحة الإجمالية = ${toAr(avgW.toFixed(2))} × ${toAr(avgL.toFixed(2))} = <strong style="color: #1b5e20;">${toAr(totalAreaM2.toFixed(2))} م²</strong>
          `;
        }
      } else {
        html += `المساحة الإجمالية المحسوبة = <strong style="color: #1b5e20;">${toAr(totalAreaM2.toFixed(2))} م²</strong>`;
      }

      html += `
          </div>
        </div>
      `;

      // 2. تحويل المساحة إلى الوحدات الزراعية المصرية
      let feddan = 0, carat = 0, sahm = 0;
      if (typeof global.convertSqmToFeddans === "function") {
        const conv = global.convertSqmToFeddans(totalAreaM2, 168);
        feddan = conv.feddans || 0;
        carat = conv.carats || 0;
        sahm = conv.shares || 0;
      } else {
        feddan = Math.floor(totalAreaM2 / 4200.83);
        const remF = totalAreaM2 - (feddan * 4200.83);
        carat = Math.floor(remF / 175.034);
        const remC = remF - (carat * 175.034);
        sahm = remC / 7.293;
      }

      html += `
        <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px; direction: rtl; text-align: right;">
          <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة (٢): تحويل المساحة الكلية للوحدات الزراعية (فدان / قيراط / سهم)</strong>
          <div style="font-size: 13px; color: #555;">
            تساوي المساحة بالتفصيل: 
            <strong style="color: #2e7d32;">
              ${toAr(feddan)} فدان و ${toAr(carat)} قيراط و ${toAr(sahm.toFixed(2))} سهم
            </strong>
          </div>
        </div>
      `;

      // 3. تفاصيل تقسيم الشركاء
      if (heirs && heirs.length > 0) {
        html += `
          <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px; direction: rtl; text-align: right;">
            <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة (٣): أنصبة الشركاء الحالية</strong>
            <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px;">
        `;
        heirs.forEach((h, idx) => {
          const name = h.name || `شريك ${idx + 1}`;
          const shareM2 = parseFloat(h.share) || 0;
          const pct = totalAreaM2 > 0 ? (shareM2 / totalAreaM2) * 100 : 0;
          html += `
            <div style="border-right: 3px solid #2e7d32; padding-right: 8px;">
              <span style="font-weight: bold; color: #333;">${toAr(name)}:</span>
              <span style="color: #1b5e20; font-family: monospace; font-weight: bold;">${toAr(shareM2.toFixed(2))} م²</span>
              (${toAr(pct.toFixed(2))}%)
            </div>
          `;
        });
        html += `
            </div>
          </div>
        `;

        // 4. عرض متوسط أطوال وعروض الشركاء (أعلى وأسفل)
        html += `
          <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px; direction: rtl; text-align: right;">
            <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة (٤): العرض السفلي لكل قطعة (أرض)</strong>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
        `;
        heirs.forEach((h, idx) => {
          const name = h.name || `شريك ${idx + 1}`;
          const botW = parseFloat(h.botW) || 0;
          html += `
            <div style="border-right: 3px solid #0288d1; padding-right: 8px;">
              <span style="font-weight: bold; color: #333;">${toAr(name)}:</span><br>
              <div style="font-family: Cairo, Arial, sans-serif; font-size: 13px; font-weight: bold; background: #f5f5f5; padding: 4px 8px; border-radius: 3px; display: inline-block; margin-top: 2px; border: 1px solid #b3e5fc; color: #01579b;">
                العرض السفلي = ${toAr(botW.toFixed(4))} م
              </div>
            </div>
          `;
        });
        html += `
            </div>
          </div>

          <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px; direction: rtl; text-align: right;">
            <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة (٥): العرض العلوي لكل قطعة (أعلى)</strong>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
        `;
        heirs.forEach((h, idx) => {
          const name = h.name || `شريك ${idx + 1}`;
          const topW = parseFloat(h.topW) || 0;
          html += `
            <div style="border-right: 3px solid #ab47bc; padding-right: 8px;">
              <span style="font-weight: bold; color: #333;">${toAr(name)}:</span><br>
              <div style="font-family: Cairo, Arial, sans-serif; font-size: 13px; font-weight: bold; background: #f5f5f5; padding: 4px 8px; border-radius: 3px; display: inline-block; margin-top: 2px; border: 1px solid #e1bee7; color: #4a148c;">
                العرض العلوي = ${toAr(topW.toFixed(4))} م
              </div>
            </div>
          `;
        });
        html += `
            </div>
          </div>
        `;

        // 5. الفواصل الأطوال الداخلية
        if (heirs.length > 1) {
          html += `
            <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px; direction: rtl; text-align: right;">
              <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة (٦): أطوال خطوط الفواصل الداخلية</strong>
              <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
          `;
          heirs.forEach((h, idx) => {
            if (idx > 0) {
              const lineL = parseFloat(h.leftL || h.rightL) || 0;
              html += `
                <div style="border-right: 3px solid #ffa726; padding-right: 8px;">
                  <span style="font-weight: bold; color: #333;">الفاصل بين قطعة ${toAr(idx)} وقطعة ${toAr(idx + 1)}:</span><br>
                  <div style="font-family: Cairo, Arial, sans-serif; font-size: 13px; font-weight: bold; background: #f5f5f5; padding: 4px 8px; border-radius: 3px; display: inline-block; margin-top: 2px; border: 1px solid #ffe082; color: #e65100;">
                    طول الفاصل = ${toAr(lineL.toFixed(4))} م
                  </div>
                </div>
              `;
            }
          });
          html += `
              </div>
            </div>
          `;
        }

        // 6. التحقق والمطابقة لتقسيم الأنصبة
        let totalDistributed = 0;
        heirs.forEach(h => { totalDistributed += (parseFloat(h.share) || 0); });
        const diff = totalAreaM2 - totalDistributed;
        const isMatched = Math.abs(diff) < 0.01;
        const diffIcon = isMatched ? "✔" : "❌";

        let diffText = "";
        if (isMatched) {
          diffText = `التوزيع متطابق بالكامل مع مساحة الأرض ${diffIcon}`;
        } else if (diff > 0) {
          diffText = `المساحة المتبقية = ${toAr(diff.toFixed(2))} م² 🟡`;
        } else {
          diffText = `يوجد عجز مقداره ${toAr(Math.abs(diff).toFixed(2))} م² 🔴`;
        }

        html += `
          <div style="background: #fdfdfd; padding: 10px; border: 1px dashed #e0e0e0; border-radius: 6px; direction: rtl; text-align: right;">
            <strong style="color: #2e7d32; display: block; margin-bottom: 4px;">الخطوة (٧): التحقق النهائي ومطابقة المساحات</strong>
            <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px; line-height: 1.4;">
              <div>مجموع مساحات الشركاء الموزعة = <strong style="color: #2e7d32; font-family: monospace;">${toAr(totalDistributed.toFixed(4))} م²</strong></div>
              <div>المساحة الإجمالية للأرض = <strong style="color: #2e7d32; font-family: monospace;">${toAr(totalAreaM2.toFixed(4))} م²</strong></div>
              <div style="margin-top: 4px; border-top: 1px solid #eee; padding-top: 4px; font-weight: bold; font-size: 13px;">
                حالة المطابقة: 
                <span style="color: ${isMatched ? "#2e7d32" : (diff > 0 ? "#e65100" : "#c62828")}; font-family: Cairo, Arial, sans-serif;">
                  ${diffText}
                </span>
              </div>
            </div>
          </div>
        `;
      }

      // إضافة زر نسخ الخطوات بالتفصيل
      html += `
        <div style="display: flex; justify-content: flex-end; margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px;">
          <button type="button" class="action-btn" onclick="StepsEngine.copyText('calculation-steps-content')" style="padding: 10px 20px; font-size: 13.5px; background-color: #134614; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-family: 'Cairo', Arial, sans-serif; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: background-color 0.2s;">
            📋 نسخ خطوات الحساب
          </button>
        </div>
      `;

      return html;
    },

    /**
     * تحديث محتوى خطوات الحساب وإعادة ضبط طول الحاوية إذا كانت مفتوحة
     * @param {string} containerContentId 
     * @param {string} containerBoxId 
     * @param {Object} options 
     */
    updateUI: function (containerContentId, containerBoxId, options) {
      const contentEl = document.getElementById(containerContentId || "calculation-steps-content");
      if (!contentEl) return;

      const html = this.generateHTML(options);
      contentEl.innerHTML = html;

      const boxEl = document.getElementById(containerBoxId || "calculation-steps-container");
      if (boxEl && (boxEl.style.maxHeight !== "0px" && boxEl.style.maxHeight !== "")) {
        setTimeout(function () {
          const targetHeight = boxEl.scrollHeight > 50 ? (boxEl.scrollHeight + 300) : 3000;
          boxEl.style.maxHeight = targetHeight + "px";
        }, 0);
      }
    },

    /**
     * التحكم في فتح وإغلاق الأكورديون (Accordion Toggle)
     * @param {string} containerId 
     * @param {string} arrowId 
     */
    toggleAccordion: function (containerId, arrowId) {
      const container = document.getElementById(containerId || "calculation-steps-container");
      if (!container) return;
      const arrow = document.getElementById(arrowId || "steps-arrow-icon");

      const isCurrentlyClosed = (container.style.maxHeight === "0px" || container.style.opacity === "0" || !container.style.maxHeight);

      if (isCurrentlyClosed) {
        if (typeof global.updateCalculationSteps === "function") {
          global.updateCalculationSteps();
        }
        const targetHeight = container.scrollHeight > 50 ? (container.scrollHeight + 300) : 3000;
        container.style.maxHeight = targetHeight + "px";
        container.style.opacity = "1";
        container.style.display = "block";
        if (arrow) arrow.style.transform = "rotate(-90deg)";
      } else {
        container.style.maxHeight = "0px";
        container.style.opacity = "0";
        if (arrow) arrow.style.transform = "rotate(0deg)";
      }
    },

    /**
     * نسخ النص النظيف لخطوات الحساب إلى الحافظة
     * @param {string} contentId 
     */
    copyText: function (contentId) {
      try {
        const stepsContent = document.getElementById(contentId || "calculation-steps-content");
        if (!stepsContent) return;

        const steps = Array.from(stepsContent.children).filter(el => {
          return el.tagName === "DIV" && !el.querySelector("button");
        });

        let textParts = [];
        steps.forEach(step => {
          const stepText = step.innerText.trim();
          if (stepText) {
            textParts.push(stepText);
          }
        });

        const textToCopy = textParts.join("\n\n");
        if (!textToCopy) return;

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(textToCopy).then(() => {
            if (global.DallalToast) {
              global.DallalToast.success("تم نسخ خطوات الحساب بنجاح.");
            } else {
              alert("✅ تم نسخ خطوات الحساب بنجاح.");
            }
          }).catch(() => {
            this._fallbackCopyText(textToCopy);
          });
        } else {
          this._fallbackCopyText(textToCopy);
        }
      } catch (e) {
        console.error("StepsEngine.copyText Error:", e);
      }
    },

    /**
     * دالة نسخ احتياطية للمتصفحات القديمة
     * @private
     */
    _fallbackCopyText: function (text) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.padding = "0";
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.boxShadow = "none";
      textArea.style.background = "transparent";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        if (global.DallalToast) {
          global.DallalToast.success("تم نسخ خطوات الحساب بنجاح.");
        } else {
          alert("✅ تم نسخ خطوات الحساب بنجاح.");
        }
      } catch (err) {
        console.error("Fallback copy failed", err);
      }
      document.body.removeChild(textArea);
    }
  };

  // تصدير المحرك الموحد إلى النطاق العام
  global.StepsEngine = StepsEngine;

})(typeof window !== "undefined" ? window : global);
