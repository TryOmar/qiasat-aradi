/**
 * shared/agri-units-compat.js
 * ===========================
 * طبقة التوافقية الحسابية الموحدة (AgriUnits Compatibility Layer) — مشروع الدَّلاَّل
 * 
 * الغرض:
 *   توفير كائن وسيط موحد (AgriUnitsCompat) لتفادي تكرار فحص وجود AgriUnits
 *   في كل استدعاء بالصفحات، وتجميع كود التراجع والاحتياط القديم (Legacy Fallbacks)
 *   في مكان مركزي واحد بدلاً من تكراره في الصفحات المختلفة.
 */

(function (global) {
  "use strict";

  function handleError(message, fallbackValue) {
    if (typeof window !== "undefined" && window.DALLAL_DEBUG) {
      throw new Error(message);
    } else {
      console.error(message);
      return fallbackValue;
    }
  }

  // ── LEGACY FALLBACK CODE ─────────────────────────────────
  // كود قديم للتراجع والاحتياط، لا يُعدَّل إلا عند إزالة التوافقية الخلفية.
  // ─────────────────────────────────────────────────────────
  
  // @deprecated
  // سيتم حذف هذه الدالة بعد التأكد من نجاح جميع اختبارات التكامل.
  function legacyToQasabaAndQabda(meters) {
    if (!meters || isNaN(meters) || meters <= 0) return { qasaba: 0, qabda: 0, fraction: 0 };
    const qasabaLength = 3.55;
    const qabdaLength = qasabaLength / 24;
    let qasaba = Math.floor(meters / qasabaLength);
    let rem = meters - (qasaba * qasabaLength);
    let qabda = Math.floor(rem / qabdaLength);
    let fraction = (rem - (qabda * qabdaLength)) / qabdaLength;
    return {
      qasaba: qasaba,
      qabda: qabda,
      fraction: parseFloat(fraction.toFixed(2))
    };
  }

  // @deprecated
  // سيتم حذف هذه الدالة بعد التأكد من نجاح جميع اختبارات التكامل.
  function legacyFromQasabaToMeters(qasaba, qabda, fraction) {
    const qasabaLength = 3.55;
    const qabdaLength = qasabaLength / 24;
    return (qasaba * qasabaLength) + (qabda * qabdaLength) + (fraction * qabdaLength);
  }

  // @deprecated
  // سيتم حذف هذه الدالة بعد التأكد من نجاح جميع اختبارات التكامل.
  function legacyConvertSquareMetersToFCS(area, caratArea) {
    const totalCarats = area / caratArea;
    let feddan = Math.floor(totalCarats / 24);
    let carat = Math.floor(totalCarats % 24);
    let sahm = Number(((totalCarats - (feddan * 24 + carat)) * 24).toFixed(2));

    if (sahm >= 24 - 0.015) {
      sahm = 0;
      carat += 1;
    }
    if (carat >= 24) {
      const extraFeddans = Math.floor(carat / 24);
      carat = carat % 24;
      feddan += extraFeddans;
    }
    return { feddan, carat, sahm };
  }

  // @deprecated
  // سيتم حذف هذه الدالة بعد التأكد من نجاح جميع اختبارات التكامل.
  function legacyNormalizeFCS(feddan, carat, sahm) {
    let f = feddan;
    let c = carat;
    let s = sahm;
    if (s >= 24) {
      const extraC = Math.floor(s / 24);
      c += extraC;
      s = Number((s % 24).toFixed(2));
    }
    if (c >= 24) {
      const extraF = Math.floor(c / 24);
      f += extraF;
      c = c % 24;
    }
    return { feddan: f, carat: c, sahm: s };
  }

  // @deprecated
  // سيتم حذف هذه الدالة بعد التأكد من نجاح جميع اختبارات التكامل.
  function legacyConvertSqmToFeddans(sqm, caratSize) {
    const feddanSize = caratSize * 24;
    const feddans = Math.floor(sqm / feddanSize);
    const remainingForCarats = sqm - (feddans * feddanSize);
    const carats = Math.floor(remainingForCarats / caratSize);
    const remainingForShares = remainingForCarats - (carats * caratSize);
    const shares = (remainingForShares * 24) / caratSize;
    return {
      feddans: feddans,
      carats: carats,
      shares: parseFloat(shares.toFixed(2))
    };
  }

  // @deprecated
  // سيتم حذف هذه الدالة بعد التأكد من نجاح جميع اختبارات التكامل.
  function legacyNormalizeQasabaQabda(qasaba, qabda, fraction) {
    let qas = qasaba;
    let qab = qabda;
    let frac = Math.min(0.99, Math.max(0, parseFloat(fraction.toFixed(2))));
    if (qab >= 24) {
      const carry = Math.floor(qab / 24);
      qas += carry;
      qab = qab % 24;
    }
    return { qasaba: qas, qabda: qab, fraction: frac };
  }

  // ── COMPATIBILITY LAYER DEFINITION ───────────────────────
  const AgriUnitsCompat = {
    VERSION: "1.0.0",

    metersToQasabaQabda(meters) {
      if (global.AgriUnits) return global.AgriUnits.metersToQasabaQabda(meters);
      handleError("[AgriUnitsCompat] AgriUnits library was not loaded.", null);
      return legacyToQasabaAndQabda(meters);
    },
    qasabaQabdaToMeters(qasaba, qabda, fraction) {
      if (global.AgriUnits) return global.AgriUnits.qasabaQabdaToMeters(qasaba, qabda, fraction);
      handleError("[AgriUnitsCompat] AgriUnits library was not loaded.", null);
      return legacyFromQasabaToMeters(qasaba, qabda, fraction);
    },
    sqmToFCS(area, caratArea) {
      if (global.AgriUnits) return global.AgriUnits.sqmToFCS(area, caratArea);
      handleError("[AgriUnitsCompat] AgriUnits library was not loaded.", null);
      return legacyConvertSquareMetersToFCS(area, caratArea);
    },
    sqmToFCSPlural(area, caratSize) {
      if (global.AgriUnits) {
        const res = global.AgriUnits.sqmToFCS(area, caratSize);
        return {
          feddans: res.feddan,
          carats: res.carat,
          shares: res.sahm
        };
      }
      handleError("[AgriUnitsCompat] AgriUnits library was not loaded.", null);
      return legacyConvertSqmToFeddans(area, caratSize);
    },
    normalizeFCS(feddan, carat, sahm) {
      if (global.AgriUnits) return global.AgriUnits.normalizeFCS(feddan, carat, sahm);
      handleError("[AgriUnitsCompat] AgriUnits library was not loaded.", null);
      return legacyNormalizeFCS(feddan, carat, sahm);
    },
    normalizeQasabaQabda(qasaba, qabda, fraction) {
      if (global.AgriUnits) return global.AgriUnits.normalizeQasabaQabda(qasaba, qabda, fraction);
      handleError("[AgriUnitsCompat] AgriUnits library was not loaded.", null);
      return legacyNormalizeQasabaQabda(qasaba, qabda, fraction);
    },
    trapezoidArea(l1, l2, w1, w2) {
      if (global.AgriUnits) return global.AgriUnits.trapezoidArea(l1, l2, w1, w2);
      handleError("[AgriUnitsCompat] AgriUnits library was not loaded.", null);
      return 0.5 * (w1 + w2) * 0.5 * (l1 + l2);
    },
    fcsToSqm(feddan, carat, sahm, caratArea) {
      if (global.AgriUnits) return global.AgriUnits.fcsToSqm(feddan, carat, sahm, caratArea);
      handleError("[AgriUnitsCompat] AgriUnits library was not loaded.", null);
      return ((feddan * 24) + carat + sahm / 24) * caratArea;
    }
  };

  // تصدير الكائن للنطاق العالمي
  global.AgriUnitsCompat = AgriUnitsCompat;

  if (typeof window !== "undefined" && window.DALLAL_DEBUG !== false) {
    console.log("[AgriUnitsCompat] loaded successfully.");
  }

})(typeof window !== "undefined" ? window : global);
