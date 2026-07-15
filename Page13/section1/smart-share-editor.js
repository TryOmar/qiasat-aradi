/**
 * تطبيق الدلال الذكي - محرر الحصص الذكي (Smart Share Editor)
 * المرحلة الخامسة (Commit 5E-3): منطق موازنة وتوزيع فروق التقريب (Difference Distribution)
 */

(function () {
  let heirCounter = 1;
  const updateContext = { lock: false };
  let calcTimeout = null;

  // توليد معرف فريد وثابت لكل شريك يعتمد على الوقت وعداد متزايد ورقم عشوائي لضمان التفرد الكامل
  function generateUniqueHeirId() {
    return `heir_${Date.now()}_${heirCounter++}_${Math.random().toString(36).substr(2, 4)}`;
  }

  // دالة ترحيل البيانات القديمة (Migration) لضمان توافق الجلسات القديمة ومطابقة الهيكل الكائني الجديد
  function migrateHeirData(heir) {
    if (!heir.locks || Array.isArray(heir.locks)) {
      heir.locks = {
        area: false,
        percent: false,
        order: false,
        full: false
      };
    } else {
      // التأكد من تهيئة كل المفاتيح في حال نقصان أي منها
      if (heir.locks.area === undefined) heir.locks.area = false;
      if (heir.locks.percent === undefined) heir.locks.percent = false;
      if (heir.locks.order === undefined) heir.locks.order = false;
      if (heir.locks.full === undefined) heir.locks.full = false;
    }
    // تهيئة خيار الخصم المختار ليكون "all" افتراضياً
    if (!heir.offsetDest) {
      heir.offsetDest = "all";
    }
  }

  // تهيئة حقول هيكل البيانات للشريك لضمان ثبات الهيكل
  function initHeirProperties(heir, idx) {
    if (!heir.id) {
      heir.id = generateUniqueHeirId();
    }
    
    // ترحيل بنية الأقفال القديمة للبنية الكائنية الجديدة
    migrateHeirData(heir);

    if (heir.order === undefined) {
      heir.order = idx !== undefined ? idx : (heirsData ? heirsData.length : 0);
    }
    if (heir.topW === undefined) heir.topW = 0;
    if (heir.botW === undefined) heir.botW = 0;
  }

  // ==========================================
  // طبقة التحويل الموحدة (ShareConverter)
  // ==========================================
  const ShareConverter = {
    // تحويل القيمة المدخلة لأي وحدة إلى متر مربع (m²) كمصدر وحيد للحقيقة
    toSqm: function (value, type, currentShare) {
      if (value === "" || value === null || value === undefined) return null;
      let num = parseFloat(value);
      if (isNaN(num) || !isFinite(num) || num < 0) return null;

      const caratSize = parseFloat(caratSizeInput.value) || 168;

      if (type === 'sqm') {
        return num;
      }
      if (type === 'pct') {
        return (num / 100) * calculatedArea;
      }
      // دعم كافة مسميات الوحدات الشرعية المتعددة
      if (type === 'split' || type === 'feddan' || type === 'carat' || type === 'sahm') {
        const currentConv = convertSqmToFeddans(currentShare || 0, caratSize);

        const feddan = (type === 'feddan') ? num : currentConv.feddans;
        const carat = (type === 'carat') ? num : currentConv.carats;
        const sahm = (type === 'sahm') ? num : currentConv.shares;

        return (feddan * 24 * caratSize) + (carat * caratSize) + (sahm * caratSize / 24);
      }
      return null;
    },

    // تحويل القيمة من متر مربع (m²) إلى باقي الوحدات بالتساوي مع تطبيق التقريب
    fromSqm: function (sqm) {
      const caratSize = parseFloat(caratSizeInput.value) || 168;
      const percentage = calculatedArea > 0 ? (sqm / calculatedArea) * 100 : 0;
      
      const conv = convertSqmToFeddans(sqm, caratSize);
      return {
        sqm: sqm, // الاحتفاظ بدقة كاملة داخلياً
        pct: percentage,
        feddans: conv.feddans,
        carats: conv.carats,
        shares: conv.shares
      };
    }
  };

  // ==========================================
  // التحديث البصري للحقول وتأخير الحساب (Debounce)
  // ==========================================
  
  // تحديث القيم بصرياً لجميع أسطر الجدول مع استبعاد الحقل النشط حالياً لتجنب قطع مؤشر الكتابة
  function updateAllHeirsInputsVisuals(skipHeirId, skipField) {
    heirsData.forEach(heir => {
      const values = ShareConverter.fromSqm(heir.share);
      const row = document.querySelector(`tr[data-id="${heir.id}"]`);
      if (!row) return;

      const sqmInput = row.querySelector(".heir-share-sqm");
      const pctInput = row.querySelector(".heir-share-pct");
      const feddanInput = row.querySelector(".heir-share-feddan");
      const caratInput = row.querySelector(".heir-share-carat");
      const sahmInput = row.querySelector(".heir-share-sahm");
      const topInput = row.querySelector(".heir-side-top");
      const botInput = row.querySelector(".heir-side-bot");

      // تحديد هل يجب تخطي تحديث خلية معينة لعدم إزعاج كيرسر الكتابة
      const skipSqm = (heir.id === skipHeirId && skipField === 'sqm');
      const skipPct = (heir.id === skipHeirId && skipField === 'pct');
      const skipFeddan = (heir.id === skipHeirId && skipField === 'feddan');
      const skipCarat = (heir.id === skipHeirId && skipField === 'carat');
      const skipSahm = (heir.id === skipHeirId && skipField === 'sahm');
      const skipTop = (heir.id === skipHeirId && skipField === 'topW');
      const skipBot = (heir.id === skipHeirId && skipField === 'botW');

      if (sqmInput && !skipSqm && document.activeElement !== sqmInput) {
        sqmInput.value = values.sqm.toFixed(2);
      }
      if (pctInput && !skipPct && document.activeElement !== pctInput) {
        pctInput.value = values.pct.toFixed(2);
      }
      if (feddanInput && !skipFeddan && document.activeElement !== feddanInput) {
        feddanInput.value = values.feddans;
      }
      if (caratInput && !skipCarat && document.activeElement !== caratInput) {
        caratInput.value = values.carats;
      }
      if (sahmInput && !skipSahm && document.activeElement !== sahmInput) {
        sahmInput.value = values.shares.toFixed(2);
      }
      if (topInput && !skipTop && document.activeElement !== topInput) {
        topInput.value = (heir.topW || 0).toFixed(2);
      }
      if (botInput && !skipBot && document.activeElement !== botInput) {
        botInput.value = (heir.botW || 0).toFixed(2);
      }
    });
  }

  // تحديث الحقول البصرية لشريك واحد فقط أثناء الإدخال المستمر لمنع الوميض والتعارض
  function updateSingleHeirInputsVisuals(heirId, skipField, tempSqm) {
    const values = ShareConverter.fromSqm(tempSqm);
    const row = document.querySelector(`tr[data-id="${heirId}"]`);
    if (!row) return;

    const sqmInput = row.querySelector(".heir-share-sqm");
    const pctInput = row.querySelector(".heir-share-pct");
    const feddanInput = row.querySelector(".heir-share-feddan");
    const caratInput = row.querySelector(".heir-share-carat");
    const sahmInput = row.querySelector(".heir-share-sahm");

    const skipSqm = (skipField === 'sqm');
    const skipPct = (skipField === 'pct');
    const skipFeddan = (skipField === 'feddan');
    const skipCarat = (skipField === 'carat');
    const skipSahm = (skipField === 'sahm');

    if (sqmInput && !skipSqm && document.activeElement !== sqmInput) {
      sqmInput.value = tempSqm.toFixed(2);
    }
    if (pctInput && !skipPct && document.activeElement !== pctInput) {
      pctInput.value = values.pct.toFixed(2);
    }
    if (feddanInput && !skipFeddan && document.activeElement !== feddanInput) {
      feddanInput.value = values.feddans;
    }
    if (caratInput && !skipCarat && document.activeElement !== caratInput) {
      caratInput.value = values.carats;
    }
    if (sahmInput && !skipSahm && document.activeElement !== sahmInput) {
      sahmInput.value = values.shares.toFixed(2);
    }
  }

  // تحديث المساحة المتبقية الإجمالية محلياً أثناء الكتابة دون توزيع الفروق
  function updateRemainingAreaLocally(editedHeirId, tempSqm) {
    let distributedSum = 0;
    heirsData.forEach(h => {
      if (h.id === editedHeirId) {
        distributedSum += tempSqm;
      } else {
        distributedSum += h.share || 0;
      }
    });

    const remaining = calculatedArea - distributedSum;
    const tolerance = 0.01;

    const remainingAreaSpan = document.getElementById("remaining-area");
    if (remainingAreaSpan) {
      if (Math.abs(remaining) < tolerance) {
        remainingAreaSpan.innerText = "0.00";
        remainingAreaSpan.style.color = "green";
      } else {
        remainingAreaSpan.innerText = remaining.toFixed(2);
        if (remaining < 0) {
          remainingAreaSpan.style.color = "red";
        } else {
          remainingAreaSpan.style.color = "#e65100";
        }
      }
    }
  }

  // جدولة الحساب بعد خمول الكتابة بـ 250ms لتفادي الوميض والبطء
  function scheduleDelayedCalculate() {
    if (calcTimeout) {
      clearTimeout(calcTimeout);
    }
    calcTimeout = setTimeout(() => {
      commitCalculation();
    }, 250);
  }

  // تنفيذ العمليات الحسابية الشاملة وحفظ الجلسة فوراً
  function commitCalculation() {
    if (calcTimeout) {
      clearTimeout(calcTimeout);
      calcTimeout = null;
    }
    notifyDataChanged('edit');
  }

  // دالة حل وتوزيع فرق التقريب مجهر الصغر (resolveRoundingDifference) بطريقة مستقلة عن الترتيب البصري
  function resolveRoundingDifference(draftShares, destSelect, targetOthers) {
    let sum = 0;
    draftShares.forEach(s => sum += s);
    const remaining = calculatedArea - sum;
    
    // سد فرق تقريب يقل عن 0.05 م²
    if (Math.abs(remaining) < 0.05 && Math.abs(remaining) > 0) {
      if (destSelect !== "all") {
        const targetHeir = heirsData.find(h => h.id === destSelect);
        if (targetHeir) {
          const targetIdx = getHeirIndexById(targetHeir.id);
          if (targetIdx !== -1) {
            draftShares[targetIdx] += remaining;
          }
        }
      } else if (targetOthers.length > 0) {
        // حقن فرق التقريب في أول شريك مؤهل في قائمة البيانات الثابتة (Deterministic Order-independent)
        const firstEligible = targetOthers[0];
        const targetIdx = getHeirIndexById(firstEligible.id);
        if (targetIdx !== -1) {
          draftShares[targetIdx] += remaining;
        }
      }
    }
  }

  // دالة لتحديث الشريك الحالي فقط بصرياً وبيانياً أثناء الكتابة المستمرة دون توزيع الفروق
  window.updateHeirFieldsLocally = function (heirId, sourceField, rawValue) {
    const idx = getHeirIndexById(heirId);
    if (idx === -1) return;

    const heir = heirsData[idx];

    // الحماية البرمجية المزدوجة للأقفال
    const isAreaLocked = heir.locks.area || heir.locks.full;
    const isPctLocked = heir.locks.percent || heir.locks.full;

    if (sourceField !== 'topW' && sourceField !== 'botW') {
      if (isAreaLocked && sourceField !== 'pct') return;
      if (isPctLocked && sourceField === 'pct') return;
    } else {
      if (heir.locks.full) return;
    }

    if (rawValue === "" || rawValue === null || rawValue === undefined) return;
    const parsedVal = parseFloat(rawValue);
    if (isNaN(parsedVal) || !isFinite(parsedVal) || parsedVal < 0) return;

    // تطبيع السهم إذا كان 24 أو أكبر (التحويل التلقائي: كل 24 سهمًا = 1 قيراط)
    if (sourceField === 'sahm' && parsedVal >= 24) {
      const targetSqm = ShareConverter.toSqm(rawValue, sourceField, heir.share);
      if (targetSqm !== null) {
        const values = ShareConverter.fromSqm(targetSqm);
        const row = document.querySelector(`tr[data-id="${heirId}"]`);
        if (row) {
          const caratInput = row.querySelector(".heir-share-carat");
          const feddanInput = row.querySelector(".heir-share-feddan");
          if (caratInput) caratInput.value = values.carats;
          if (feddanInput) feddanInput.value = values.feddans;
        }
      }
    }

    if (sourceField === 'topW' || sourceField === 'botW') {
      const oldVal = heir[sourceField] || 0;
      const diff = parsedVal - oldVal;
      if (diff === 0) return;

      const otherSideStr = (sourceField === 'topW') ? 'botW' : 'topW';
      const oldOtherVal = heir[otherSideStr] || 0;

      let actualDiff = diff;
      if (diff > 0) {
        actualDiff = Math.min(diff, oldOtherVal);
      } else {
        actualDiff = -Math.min(-diff, oldVal);
      }

      if (actualDiff === 0) return;

      // تحديث الحقول البصرية للشريك النشط فقط
      const row = document.querySelector(`tr[data-id="${heirId}"]`);
      if (row) {
        const otherInput = row.querySelector(sourceField === 'topW' ? ".heir-side-bot" : ".heir-side-top");
        if (otherInput) {
          otherInput.value = (oldOtherVal - actualDiff).toFixed(2);
        }
      }
    } else {
      // حساب القيمة المستهدفة بالمتر المربع (يرجع null إذا كان الإدخال غير مكتمل أو غير صالح)
      const targetSqm = ShareConverter.toSqm(rawValue, sourceField, heir.share);
      if (targetSqm === null) {
        return; // إيقاف المعالجة مؤقتاً لتجنب تصفير بقية الشركاء
      }

      // تحديث الحقول البصرية متزامناً لنفس الشريك فقط
      updateSingleHeirInputsVisuals(heirId, sourceField, targetSqm);

      // تحديث المساحة المتبقية إجمالياً بصرياً بالـ DOM لتنبيه المستخدم بالفائض/العجز المؤقت
      updateRemainingAreaLocally(heirId, targetSqm);
    }
  };

  // الدالة المركزية لإجراء التحديث المتبادل وتوزيع الفروق ذرياً عند blur أو Enter
  window.updateHeirFields = function (heirId, sourceField, rawValue) {
    if (updateContext.lock) return;
    updateContext.lock = true;

    try {
      const idx = getHeirIndexById(heirId);
      if (idx === -1) return;

      const heir = heirsData[idx];

      // ==========================================
      // 1. الحماية البرمجية المزدوجة (Logical Early Return)
      // ==========================================
      const isAreaLocked = heir.locks.area || heir.locks.full;
      const isPctLocked = heir.locks.percent || heir.locks.full;

      if (sourceField !== 'topW' && sourceField !== 'botW') {
        if (isAreaLocked && sourceField !== 'pct') return;
        if (isPctLocked && sourceField === 'pct') return;
      } else {
        if (heir.locks.full) return;
      }

      // التحقق من المدخلات
      if (rawValue === "" || rawValue === null || rawValue === undefined) {
        updateAllHeirsInputsVisuals();
        return;
      }
      const parsedVal = parseFloat(rawValue);
      if (isNaN(parsedVal) || !isFinite(parsedVal) || parsedVal < 0) {
        updateAllHeirsInputsVisuals();
        return;
      }

      // تطبيع السهم إذا كان 24 أو أكبر (التحويل التلقائي: كل 24 سهمًا = 1 قيراط)
      if (sourceField === 'sahm' && parsedVal >= 24) {
        const targetSqm = ShareConverter.toSqm(rawValue, sourceField, heir.share);
        if (targetSqm !== null) {
          const values = ShareConverter.fromSqm(targetSqm);
          const row = document.querySelector(`tr[data-id="${heirId}"]`);
          if (row) {
            const caratInput = row.querySelector(".heir-share-carat");
            const feddanInput = row.querySelector(".heir-share-feddan");
            const sahmInput = row.querySelector(".heir-share-sahm");
            if (caratInput) caratInput.value = values.carats;
            if (feddanInput) feddanInput.value = values.feddans;
            if (sahmInput) sahmInput.value = values.shares.toFixed(2);
          }
          rawValue = values.shares.toFixed(2);
        }
      }

      if (sourceField === 'topW' || sourceField === 'botW') {
        const oldVal = heir[sourceField] || 0;
        const diff = parsedVal - oldVal;
        if (diff === 0) return;

        const otherSideStr = (sourceField === 'topW') ? 'botW' : 'topW';
        const oldOtherVal = heir[otherSideStr] || 0;

        let actualDiff = diff;
        if (diff > 0) {
          actualDiff = Math.min(diff, oldOtherVal);
        } else {
          actualDiff = -Math.min(-diff, oldVal);
        }

        if (actualDiff === 0) {
          updateAllHeirsInputsVisuals();
          return;
        }

        // تطبيق التحديث المحلي
        heir[sourceField] = oldVal + actualDiff;
        heir[otherSideStr] = oldOtherVal - actualDiff;

        // توزيع فرق العرض على الآخرين للحفاظ على إجمالي العرض للبلد
        const destSelect = heir.offsetDest || "all";
        if (destSelect === "all") {
          const otherHeirs = heirsData.filter((_, i) => i !== idx);
          if (otherHeirs.length > 0) {
            const shareDiff = actualDiff / otherHeirs.length;
            otherHeirs.forEach(h => {
              h[sourceField] = Math.max(0, (h[sourceField] || 0) - shareDiff);
              h[otherSideStr] = Math.max(0, (h[otherSideStr] || 0) + shareDiff);
            });
          }
        } else {
          const targetHeir = heirsData.find(h => h.id === destSelect);
          if (targetHeir) {
            const targetOldVal = targetHeir[sourceField] || 0;
            const targetActualDiff = Math.min(actualDiff, targetOldVal);
            
            targetHeir[sourceField] = targetOldVal - targetActualDiff;
            targetHeir[otherSideStr] = (targetHeir[otherSideStr] || 0) + targetActualDiff;
            
            if (targetActualDiff !== actualDiff) {
              heir[sourceField] = oldVal + targetActualDiff;
              heir[otherSideStr] = oldOtherVal - targetActualDiff;
            }
          }
        }

        // تحديث وعرض
        updateAllHeirsInputsVisuals();
        notifyDataChanged('edit');

      } else {
        // 2. حساب القيمة المستهدفة بالمتر المربع لغير العرض
        const targetSqm = ShareConverter.toSqm(rawValue, sourceField, heir.share);
        if (targetSqm === null) {
          updateAllHeirsInputsVisuals(); // إعادة كافة الحقول للقيم الفعلية المخزنة للتراجع البصري
          return;
        }

        const diff = targetSqm - heir.share;

        if (diff === 0) return;

        // 3. قراءة وجهة الخصم المحددة والتحقق من الأقفال
        const destSelect = heir.offsetDest || "all";
        const isPct = (sourceField === 'pct');
        let targetOthers = [];

        if (destSelect === "all") {
          targetOthers = heirsData.filter((h, oIdx) => {
            if (oIdx === idx) return false;
            return isPct ? !(h.locks.percent || h.locks.full) : !(h.locks.area || h.locks.full);
          });
        } else {
          const targetHeir = heirsData.find(h => h.id === destSelect);
          if (targetHeir) {
            const isLocked = isPct ? (targetHeir.locks.percent || targetHeir.locks.full) : (targetHeir.locks.area || targetHeir.locks.full);
            if (!isLocked) {
              targetOthers.push(targetHeir);
            }
          }
        }

        // ==========================================
        // 4. شرط الحماية ضد انعدام وجود شركاء مفتوحين (Eligible Check)
        // ==========================================
        if (targetOthers.length === 0) {
          alert("فشل التعديل: لا يوجد شريك مفتوح ومؤهل لخصم/إضافة فرق المساحة.");
          updateAllHeirsInputsVisuals(); // إعادة الواجهة للقيم الفعلية الصحيحة
          return;
        }

        // ==========================================
        // 5. بدء التحديث الذري للمعاملة (Transactional Draft Check)
        // ==========================================
        const originalShares = heirsData.map(h => h.share);
        const draftShares = [...originalShares];

        draftShares[idx] = targetSqm;

        if (destSelect === "all") {
          const shareAdjustment = -diff / targetOthers.length;
          
          // فحص منع الحصص السالبة
          const isValidTransaction = targetOthers.every(h => {
            const hIdx = getHeirIndexById(h.id);
            if (hIdx === -1) return false;
            draftShares[hIdx] += shareAdjustment;
            return draftShares[hIdx] >= 0;
          });

          if (!isValidTransaction) {
            alert("فشل التعديل: التعديل سيؤدي لحصة سالبة لأحد الشركاء. يرجى اختيار جهة خصم مخصصة أو تعديل الأقفال.");
            updateAllHeirsInputsVisuals(); // Rollback بصري
            return;
          }
        } else {
          // شريك مخصص للخصم
          const targetHeir = heirsData.find(h => h.id === destSelect);
          if (targetHeir) {
            const targetIdx = getHeirIndexById(targetHeir.id);
            if (targetIdx !== -1) {
              draftShares[targetIdx] -= diff;

              if (draftShares[targetIdx] < 0) {
                alert(`فشل التعديل: لا توجد مساحة كافية للخصم من ${targetHeir.name}.`);
                updateAllHeirsInputsVisuals(); // Rollback بصري
                return;
              }
            }
          }
        }

        // 6. سد فجوات فروق التقريب
        resolveRoundingDifference(draftShares, destSelect, targetOthers);

        // ==========================================
        // 7. اعتماد وتطبيق المعاملة بنجاح (Atomic Commit)
        // ==========================================
        heirsData.forEach((h, index) => {
          h.share = draftShares[index];
        });

        heir.lastEditedField = sourceField;

        // تحديث المدخلات البصرية متزامناً فوراً لكافة الشركاء
        updateAllHeirsInputsVisuals(heirId, sourceField);

        // تنبيه مركزي بتغيير البيانات لإجراء الحسابات وإعادة الرسم والحفظ
        notifyDataChanged('edit');
      }

    } finally {
      updateContext.lock = false;
    }
  };

  // ==========================================
  // تغليف دوال الإدخال الأصلية لـ script.js
  // ==========================================

  window.debouncedUpdateHeirShare = function (idx, type, value) {
    const heir = heirsData[idx];
    if (heir) {
      updateHeirFieldsLocally(heir.id, type, value);
    }
  };

  window.commitHeirShareImmediately = function (idx, type, value) {
    const heir = heirsData[idx];
    if (heir) {
      updateHeirFields(heir.id, type, value);
    }
  };

  window.debouncedUpdateHeirSplitShare = function (idx, unitType, value) {
    const heir = heirsData[idx];
    if (heir) {
      updateHeirFieldsLocally(heir.id, unitType, value);
    }
  };

  window.commitHeirSplitShareImmediately = function (idx, unitType, value) {
    const heir = heirsData[idx];
    if (heir) {
      updateHeirFields(heir.id, unitType, value);
    }
  };

  // معالجات النسبة المئوية المخصصة
  window.handleHeirPctInput = function (heirId, value) {
    updateHeirFieldsLocally(heirId, 'pct', value);
  };

  window.commitHeirPctImmediately = function (heirId, value) {
    updateHeirFields(heirId, 'pct', value);
  };

  // تغليف منطق العرض الأول والعرض الثاني لتوجيهه للمسار المركزي الموحد
  window.updateHeirSide = function (idx, sideStr, valStr) {
    const heir = heirsData[idx];
    if (heir) {
      updateHeirFieldsLocally(heir.id, sideStr, valStr);
    }
  };

  // ==========================================
  // إدارة وتغيير حالات الأقفال (Locks Logic)
  // ==========================================

  // الدالة المركزية لتبديل حالة القفل (تمنع التناقضات كلياً)
  window.toggleHeirLock = function (heirId, lockType) {
    const idx = getHeirIndexById(heirId);
    if (idx === -1) return;

    const heir = heirsData[idx];
    
    // التأكد من تهيئة بنية الأقفال الكائنية
    migrateHeirData(heir);

    if (lockType === 'full') {
      const targetState = !heir.locks.full;
      heir.locks.full = targetState;
      heir.locks.area = targetState;
      heir.locks.percent = targetState;
      heir.locks.order = targetState;
    } else {
      heir.locks[lockType] = !heir.locks[lockType];
      
      // مزامنة حالة القفل الكامل
      heir.locks.full = heir.locks.area && heir.locks.percent && heir.locks.order;
    }

    // إرسال التنبيه للمستهلكين لإعادة الرسم وحفظ الجلسة
    notifyLockChanged(heirId);
  };

  // طبقة أحداث الأقفال المستقلة لإعادة الرسم وحفظ الحالة
  window.notifyLockChanged = function (heirId) {
    if (typeof renderHeirsRows === 'function') {
      renderHeirsRows();
    }
    if (typeof saveStateToSession === 'function') {
      saveStateToSession();
    }
  };

  // ==========================================
  // منطق إعادة الترتيب بالسحب والإسقاط (Drag & Drop Logic)
  // ==========================================

  function reorderHeirsInArray(draggedId, targetId, isBelow) {
    const draggedIdx = getHeirIndexById(draggedId);
    const targetIdx = getHeirIndexById(targetId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    const draggedHeir = heirsData[draggedIdx];
    const targetHeir = heirsData[targetIdx];

    // فحص أقفال الترتيب للطرفين
    if ((draggedHeir.locks && draggedHeir.locks.order) || (targetHeir.locks && targetHeir.locks.order)) {
      return;
    }

    // إزالة العنصر المسحوب من موضعه الأصلي
    heirsData.splice(draggedIdx, 1);

    // حساب موضع الإسقاط الجديد بعد الإزالة
    let newIdx = getHeirIndexById(targetId);
    if (isBelow) {
      newIdx = newIdx + 1;
    }

    // إدراج العنصر المسحوب في موضعه الجديد
    heirsData.splice(newIdx, 0, draggedHeir);

    // تحديث ترتيب الشركاء الفعلي
    heirsData.forEach((h, index) => {
      h.order = index;
    });

    // إخطار بتحديث الترتيب فقط دون حسابات شاملة لإعادة رسم الكانفاس وحفظ الحالة لمرة واحدة
    notifyDataChanged('reorder');
  }

  // ==========================================
  // حساب وعرض المساحة المتبقية (Remaining Area)
  // ==========================================

  window.updateRemainingArea = function () {
    const divisionInfo = document.querySelector(".division-info");
    if (divisionInfo && !document.getElementById("remaining-area-wrapper")) {
      const p = document.createElement("p");
      p.id = "remaining-area-wrapper";
      p.innerHTML = `المساحة المتبقية: <span id="remaining-area" style="font-weight: bold;">0.00</span> م²`;
      
      const firstP = divisionInfo.querySelector("p");
      if (firstP) {
        firstP.insertAdjacentElement("afterend", p);
      } else {
        divisionInfo.appendChild(p);
      }
    }

    // حساب مجموع الأنصبة من مصفوفة البيانات (مصدر الحقيقة الوحيد)
    let distributedSum = 0;
    heirsData.forEach(h => {
      distributedSum += h.share || 0;
    });

    const remaining = calculatedArea - distributedSum;
    const tolerance = 0.01; // قيمة السماحية العشرية المعتمدة (±0.01 م²)

    const remainingAreaSpan = document.getElementById("remaining-area");
    if (remainingAreaSpan) {
      if (Math.abs(remaining) < tolerance) {
        remainingAreaSpan.innerText = "0.00";
        remainingAreaSpan.style.color = "green";
      } else {
        remainingAreaSpan.innerText = remaining.toFixed(2);
        if (remaining < 0) {
          remainingAreaSpan.style.color = "red";
        } else {
          remainingAreaSpan.style.color = "#e65100"; // اللون البرتقالي للحالة الموجبة
        }
      }
    }
  };

  // ==========================================
  // حماية الإدخال المركزية (Input Locks Applicator)
  // ==========================================
  
  // دالة تطبيق سمة القراءة فقط readonly بناءً على كائن البيانات heir.locks (مصدر الحقيقة الوحيد)
  function applyRowInputLocks(row, heir) {
    const sqmInput = row.querySelector(".heir-share-sqm");
    const pctInput = row.querySelector(".heir-share-pct");
    const feddanInput = row.querySelector(".heir-share-feddan");
    const caratInput = row.querySelector(".heir-share-carat");
    const sahmInput = row.querySelector(".heir-share-sahm");

    const isAreaLocked = heir.locks.area || heir.locks.full;
    const isPctLocked = heir.locks.percent || heir.locks.full;

    // تطبيق سمة القراءة فقط readonly على حقول المساحة والكسور
    [sqmInput, feddanInput, caratInput, sahmInput].forEach(inp => {
      if (inp) {
        if (isAreaLocked) {
          inp.setAttribute("readonly", "true");
          inp.classList.add("input-locked");
        } else {
          inp.removeAttribute("readonly");
          inp.classList.remove("input-locked");
        }
      }
    });

    // تطبيق سمة القراءة فقط readonly على حقل النسبة المئوية
    if (pctInput) {
      if (isPctLocked) {
        pctInput.setAttribute("readonly", "true");
        pctInput.classList.add("input-locked");
      } else {
        pctInput.removeAttribute("readonly");
        pctInput.classList.remove("input-locked");
      }
    }
  }

  // ==========================================
  // تغليف وتزيين الجدول (Decorators)
  // ==========================================

  // 1. تغليف دالة renderHeirsRows الأصلية لإضافة أزرار التحكم والترتيب وعمود النسبة مئوية (%) والأقفال
  if (window.renderHeirsRows && !window.renderHeirsRows.isWrapped) {
    const originalRenderHeirsRows = window.renderHeirsRows;
    window.renderHeirsRows = function () {
      // التأكد من أن كل عنصر في heirsData يمتلك معرفاً فريداً وحقولاً مستقبلية معالجة ترحيلياً
      heirsData.forEach((heir, idx) => {
        initHeirProperties(heir, idx);
      });

      // تشغيل دالة العرض الأصلية
      originalRenderHeirsRows.apply(this, arguments);

      // تزيين الأسطر وإلحاق أزرار التحكم والأقفال والنسبة المئوية
      decorateTableRows();
    };
    window.renderHeirsRows.isWrapped = true;
  }

  // 2. تغليف دالة generateHeirsTable للحفاظ على الـ IDs والخصائص عند إعادة توليد المصفوفة
  if (window.generateHeirsTable && !window.generateHeirsTable.isWrapped) {
    const originalGenerateHeirsTable = window.generateHeirsTable;
    window.generateHeirsTable = function () {
      const oldHeirsCopy = [...heirsData];

      // تشغيل الدالة الأصلية
      originalGenerateHeirsTable.apply(this, arguments);

      // استعادة المعرفات والخصائص للشركاء القدامى وتوليد معرفات جديدة للشركاء الجدد
      heirsData.forEach((heir, idx) => {
        const oldHeir = oldHeirsCopy[idx];
        if (oldHeir) {
          if (oldHeir.id) heir.id = oldHeir.id;
          if (oldHeir.locks) {
            heir.locks = oldHeir.locks;
            migrateHeirData(heir);
          } else {
            initHeirProperties(heir, idx);
          }
          if (oldHeir.order !== undefined) heir.order = oldHeir.order;
        } else {
          initHeirProperties(heir, idx);
        }
      });
    };
    window.generateHeirsTable.isWrapped = true;
  }

  // 3. تغليف دالة updateHeirsUI لمزامنة النسبة المئوية ديناميكياً مع تحديث الحقول الأخرى
  if (window.updateHeirsUI && !window.updateHeirsUI.isWrapped) {
    const originalUpdateHeirsUI = window.updateHeirsUI;
    window.updateHeirsUI = function () {
      originalUpdateHeirsUI.apply(this, arguments);

      heirsData.forEach((heir) => {
        const row = document.querySelector(`tr[data-id="${heir.id}"]`);
        if (!row) return;
        const pctInput = row.querySelector(".heir-share-pct");
        if (pctInput && document.activeElement !== pctInput) {
          const pct = calculatedArea > 0 ? ((heir.share / calculatedArea) * 100) : 0;
          pctInput.value = pct.toFixed(2);
        }
      });
    };
    window.updateHeirsUI.isWrapped = true;
  }

  // 4. تغليف دالة updateHeirsDistribution الشاملة لتحديث المساحة المتبقية كخطوة تابعة متتالية
  if (window.updateHeirsDistribution && !window.updateHeirsDistribution.isWrapped) {
    const originalUpdateHeirsDistribution = window.updateHeirsDistribution;
    window.updateHeirsDistribution = function () {
      originalUpdateHeirsDistribution.apply(this, arguments);
      updateRemainingArea();
    };
    window.updateHeirsDistribution.isWrapped = true;
  }

  // دالة تزيين أسطر جدول الشركاء ديناميكياً
  function decorateTableRows() {
    const heirsListTbody = document.getElementById("heirs-list");
    if (!heirsListTbody) return;

    const headerRow = document.getElementById("heirs-table-header-row");
    
    // أ. إضافة ترويسة عمود النسبة مئوية (%) بعد عمود النصيب م²
    if (headerRow && !headerRow.querySelector(".percentage-header")) {
      const th = document.createElement("th");
      th.className = "percentage-header";
      th.innerText = "النسبة (%)";
      const sqmHeader = headerRow.cells[5];
      if (sqmHeader) {
        sqmHeader.insertAdjacentElement("afterend", th);
      }
    }

    // b. إضافة ترويسة عمود الأقفال قبل ترويسة عمود التحكم
    if (headerRow && !headerRow.querySelector(".locks-header")) {
      const th = document.createElement("th");
      th.className = "locks-header no-print";
      th.innerText = "الأقفال";
      const actionsHeader = headerRow.querySelector(".actions-header");
      if (actionsHeader) {
        actionsHeader.insertAdjacentElement("beforebegin", th);
      }
    }

    // ج. إضافة ترويسة عمود التحكم للجدول
    if (headerRow) {
      let th = headerRow.querySelector(".actions-header");
      if (!th) {
        th = document.createElement("th");
        th.className = "actions-header no-print";
        th.innerText = "التحكم";
        headerRow.appendChild(th);
      }
    }

    const rows = heirsListTbody.querySelectorAll("tr");
    rows.forEach((row) => {
      const idx = parseInt(row.getAttribute("data-index"));
      if (isNaN(idx)) return;
      const heir = heirsData[idx];
      if (!heir) return;

      // تعيين معرف الشريك كسمة في السطر
      row.setAttribute("data-id", heir.id);

      // ربط أحداث العرض الأول والثاني بالمسار البرمجي الموحد
      const topInput = row.querySelector(".heir-side-top");
      const botInput = row.querySelector(".heir-side-bot");

      if (topInput && !topInput.dataset.hasEvents) {
        topInput.dataset.hasEvents = "true";
        topInput.addEventListener("blur", function () {
          updateHeirFields(heir.id, 'topW', this.value);
        });
        topInput.addEventListener("keydown", function (e) {
          if (e.key === 'Enter') {
            updateHeirFields(heir.id, 'topW', this.value);
            this.blur();
          }
        });
      }

      if (botInput && !botInput.dataset.hasEvents) {
        botInput.dataset.hasEvents = "true";
        botInput.addEventListener("blur", function () {
          updateHeirFields(heir.id, 'botW', this.value);
        });
        botInput.addEventListener("keydown", function (e) {
          if (e.key === 'Enter') {
            updateHeirFields(heir.id, 'botW', this.value);
            this.blur();
          }
        });
      }

      // د. إضافة خلية النسبة مئوية في السطر بعد خلية النصيب م²
      let pctCell = row.querySelector(".percentage-cell");
      if (!pctCell) {
        pctCell = document.createElement("td");
        pctCell.className = "percentage-cell";
        const sqmInput = row.querySelector(".heir-share-sqm");
        const sqmCell = sqmInput ? sqmInput.closest("td") : null;
        if (sqmCell) {
          sqmCell.insertAdjacentElement("afterend", pctCell);
        }
      }

      // حساب وعرض النسبة المئوية التقريبية بصرياً
      const pct = calculatedArea > 0 ? ((heir.share / calculatedArea) * 100) : 0;
      pctCell.innerHTML = `
        <input type="text" inputmode="decimal" class="heir-share heir-share-pct" style="width: 55px;" 
          value="${pct.toFixed(2)}" 
          oninput="handleHeirPctInput('${heir.id}', this.value)" 
          onblur="commitHeirPctImmediately('${heir.id}', this.value)" 
          onkeydown="if(event.key === 'Enter') { commitHeirPctImmediately('${heir.id}', this.value); this.blur(); }" />
      `;

      // هـ. إضافة خلية الأقفال قبل خلية التحكم
      let locksCell = row.querySelector(".locks-cell");
      if (!locksCell) {
        locksCell = document.createElement("td");
        locksCell.className = "locks-cell no-print";
        const actionsCell = row.querySelector(".actions-cell");
        if (actionsCell) {
          actionsCell.insertAdjacentElement("beforebegin", locksCell);
        }
      }

      // بناء وتلوين أزرار الأقفال وتعيين التلميحات
      const locks = heir.locks;
      locksCell.innerHTML = `
        <div class="heir-locks-wrapper">
          <button class="btn-lock-toggle ${locks.area ? 'locked' : 'unlocked'}" onclick="toggleHeirLock('${heir.id}', 'area')" title="قفل المساحة - ${locks.area ? 'نشط' : 'غير نشط'}">
            ${locks.area ? '🔒' : '🔓'}<span class="lock-label">م</span>
          </button>
          <button class="btn-lock-toggle ${locks.percent ? 'locked' : 'unlocked'}" onclick="toggleHeirLock('${heir.id}', 'percent')" title="قفل النسبة - ${locks.percent ? 'نشط' : 'غير نشط'}">
            ${locks.percent ? '🔒' : '🔓'}<span class="lock-label">%</span>
          </button>
          <button class="btn-lock-toggle ${locks.order ? 'locked' : 'unlocked'}" onclick="toggleHeirLock('${heir.id}', 'order')" title="قفل الترتيب - ${locks.order ? 'نشط' : 'غير نشط'}">
            ${locks.order ? '🔒' : '🔓'}<span class="lock-label">ت</span>
          </button>
          <button class="btn-lock-toggle ${locks.full ? 'locked' : 'unlocked'}" onclick="toggleHeirLock('${heir.id}', 'full')" title="قفل كامل - ${locks.full ? 'نشط' : 'غير نشط'}">
            ${locks.full ? '🔒' : '🔓'}<span class="lock-label">ك</span>
          </button>
        </div>
      `;

      // و. إضافة خلية التحكم والترتيب في نهاية السطر
      let actionsCell = row.querySelector(".actions-cell");
      if (!actionsCell) {
        actionsCell = document.createElement("td");
        actionsCell.className = "actions-cell no-print";
        row.appendChild(actionsCell);
      }

      // تحديد حالات التعطيل
      const isFirst = (idx === 0);
      const isLast = (idx === heirsData.length - 1);
      const isOnly = (heirsData.length <= 1);

      // تحديد تفعيل السحب فقط من مقبض السحب ⋮⋮
      const isOrderLocked = heir.locks && heir.locks.order;
      const dragHandleHtml = isOrderLocked 
        ? `<span class="drag-handle disabled no-print" style="opacity: 0.3; cursor: not-allowed;" title="قفل الترتيب نشط">🔒</span>`
        : `<span class="drag-handle no-print" title="اسحب لإعادة الترتيب">⋮⋮</span>`;

      actionsCell.innerHTML = `
        <div class="heir-actions-wrapper">
          ${dragHandleHtml}
          <button class="btn-action btn-move-up" onclick="moveHeirUp('${heir.id}')" ${isFirst ? 'disabled' : ''} title="نقل لأعلى">▲</button>
          <button class="btn-action btn-move-down" onclick="moveHeirDown('${heir.id}')" ${isLast ? 'disabled' : ''} title="نقل لأسفل">▼</button>
          <button class="btn-action btn-delete-heir" onclick="deleteHeir('${heir.id}')" ${isOnly ? 'disabled' : ''} title="حذف الشريك">🗑️</button>
        </div>
      `;

      // ز. ربط أحداث السحب والإفلات بصورة مقتصرة على المقبض للأسطر غير المقفلة
      if (!isOrderLocked && window.DataTransfer) {
        const handle = actionsCell.querySelector(".drag-handle");
        
        if (handle) {
          // السحب يبدأ فقط من مقبض السحب (⋮⋮) بتنشيط draggable عند الضغط
          handle.addEventListener("mousedown", () => {
            row.setAttribute("draggable", "true");
          });
          handle.addEventListener("mouseup", () => {
            row.removeAttribute("draggable");
          });
        }

        row.addEventListener("dragstart", (e) => {
          e.dataTransfer.setData("text/plain", heir.id);
          row.classList.add("dragging");
          e.dataTransfer.effectAllowed = "move";
        });

        row.addEventListener("dragend", () => {
          row.classList.remove("dragging");
          const allRows = heirsListTbody.querySelectorAll("tr");
          allRows.forEach(r => r.classList.remove("drag-over-above", "drag-over-below"));
        });

        row.addEventListener("dragover", (e) => {
          e.preventDefault();
          const targetRow = e.target.closest("tr");
          if (!targetRow || targetRow === row) return;

          const targetIdx = parseInt(targetRow.getAttribute("data-index"));
          const targetHeir = heirsData[targetIdx];
          
          // منع الإفلات إذا كان الشريك المستهدف مقفلاً ترتيبياً
          if (targetHeir && targetHeir.locks && targetHeir.locks.order) {
            e.dataTransfer.dropEffect = "none";
            return;
          }

          e.dataTransfer.dropEffect = "move";
          const rect = targetRow.getBoundingClientRect();
          const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;

          const allRows = heirsListTbody.querySelectorAll("tr");
          allRows.forEach(r => r.classList.remove("drag-over-above", "drag-over-below"));

          if (next) {
            targetRow.classList.add("drag-over-below");
          } else {
            targetRow.classList.add("drag-over-above");
          }
        });

        row.addEventListener("dragleave", (e) => {
          const targetRow = e.target.closest("tr");
          if (targetRow) {
            targetRow.classList.remove("drag-over-above", "drag-over-below");
          }
        });

        row.addEventListener("drop", (e) => {
          e.preventDefault();
          const draggedId = e.dataTransfer.getData("text/plain");
          const targetRow = e.target.closest("tr");
          if (!targetRow) return;

          const targetId = targetRow.getAttribute("data-id");
          if (draggedId === targetId) return;

          const isBelow = targetRow.classList.contains("drag-over-below");
          reorderHeirsInArray(draggedId, targetId, isBelow);
        });
      }

      // ح. حقن خيارات الخصم باستخدام المعرفات الفريدة (IDs) للحفاظ على الخيارات مستقلة عن الترتيب
      const select = row.querySelector(".heir-offset");
      if (select) {
        let optionsHtml = `<option value="all" ${heir.offsetDest === 'all' ? 'selected' : ''}>باقي الشركاء بالتساوي</option>`;
        heirsData.forEach((oth) => {
          if (oth.id !== heir.id) {
            optionsHtml += `<option value="${oth.id}" ${heir.offsetDest === oth.id ? 'selected' : ''}>${oth.name}</option>`;
          }
        });
        select.innerHTML = optionsHtml;

        // الاستماع الفوري لتعديل وجهة الخصم وحفظها في الشريك
        select.addEventListener("change", (e) => {
          heir.offsetDest = e.target.value;
          if (typeof saveStateToSession === 'function') {
            saveStateToSession();
          }
        });
      }

      // ==========================================
      // تطبيق حماية الأقفال البرمجية على عناصر الإدخال للسطر الحالي
      // ==========================================
      applyRowInputLocks(row, heir);
    });

    // تحديث المساحة المتبقية بصورة موازية بعد تزيين الجدول
    updateRemainingArea();
  }

  // طبقة إدارة الأحداث والبيانات الموحدة
  window.notifyDataChanged = function (type) {
    const heirsCountInput = document.getElementById("heirs-count");
    if (heirsCountInput) {
      heirsCountInput.value = heirsData.length;
    }

    // تحديث المساحة المتبقية إجمالياً
    if (typeof updateRemainingArea === 'function') {
      updateRemainingArea();
    }

    if (type === 'reorder') {
      // الترتيب: إعادة عرض الجدول ورسم الكانفاس وحفظ الجلسة فقط دون استدعاء calculateAll
      if (typeof renderHeirsRows === 'function') {
        renderHeirsRows();
      }
      if (typeof drawLandCanvas === 'function') {
        drawLandCanvas(vertices);
      }
      if (typeof saveStateToSession === 'function') {
        saveStateToSession();
      }
    } else if (type === 'edit') {
      // التعديل: نحتاج لإعادة الحساب وحفظ الجلسة فقط دون إعادة بناء الصفوف لمنع فقدان التركيز
      if (typeof calculateAll === 'function') {
        calculateAll();
      }
      if (typeof saveStateToSession === 'function') {
        saveStateToSession();
      }
    } else {
      // الإضافة والحذف: إعادة عرض الجدول أولاً ثم استدعاء إعادة الحساب الكلية لتعديل القياسات والأبعاد
      if (typeof renderHeirsRows === 'function') {
        renderHeirsRows();
      }
      if (typeof calculateAll === 'function') {
        calculateAll();
      }
      if (typeof saveStateToSession === 'function') {
        saveStateToSession();
      }
    }

    if (typeof window.updateFieldGuide === 'function') {
      window.updateFieldGuide();
    }
  };

  // دوال أفعال التحكم
  window.getHeirIndexById = function (id) {
    return heirsData.findIndex(h => h.id === id);
  };

  // إضافة شريك جديد بحصة فارغة وتأسيس بنية الأقفال التلقائية
  window.addNewHeir = function (event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const newId = generateUniqueHeirId();
    const newHeir = {
      id: newId,
      name: "شريك جديد",
      share: null, // لا يوجد أي حسابات تلقائية في Commit 5E-3
      topW: 0,
      botW: 0,
      locks: {
        area: false,
        percent: false,
        order: false,
        full: false
      },
      order: heirsData.length,
      offsetDest: "all"
    };
    heirsData.push(newHeir);
    notifyDataChanged('add');
  };

  // حذف شريك باستخدام معرفه الفريد
  window.deleteHeir = function (id) {
    const idx = getHeirIndexById(id);
    if (idx !== -1 && heirsData.length > 1) {
      heirsData.splice(idx, 1);
      notifyDataChanged('delete');
    }
  };

  // نقل الشريك للأعلى بتبديل العناصر في المصفوفة
  window.moveHeirUp = function (id) {
    const idx = getHeirIndexById(id);
    if (idx > 0) {
      const temp = heirsData[idx];
      heirsData[idx] = heirsData[idx - 1];
      heirsData[idx - 1] = temp;

      // تحديث خصائص الترتيب الداخلية
      heirsData[idx].order = idx;
      heirsData[idx - 1].order = idx - 1;

      notifyDataChanged('reorder');
    }
  };

  // نقل الشريك للأسفل بتبديل العناصر في المصفوفة
  window.moveHeirDown = function (id) {
    const idx = getHeirIndexById(id);
    if (idx !== -1 && idx < heirsData.length - 1) {
      const temp = heirsData[idx];
      heirsData[idx] = heirsData[idx + 1];
      heirsData[idx + 1] = temp;

      // تحديث خصائص الترتيب الداخلية
      heirsData[idx].order = idx;
      heirsData[idx + 1].order = idx + 1;

      notifyDataChanged('reorder');
    }
  };
})();
