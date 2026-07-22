/**
 * ============================================================================
 * Qiasat-Aradi — Smart Guidance Engine (Commit 14.1)
 * Central Decision & Actionable User Guidance Engine for All Pages
 * ============================================================================
 * Integrates directly with Validation Engine (shared/calculations/validation.js),
 * uses fixed message codes, suppresses duplicate alerts, and supports inline actions.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GuidanceEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var activeMessages = {};
  var lastContextSignature = '';

  /** Message Codes Dictionary */
  var MESSAGE_DICTIONARY = {
    AREA_ROUNDING: {
      type: 'HINT',
      code: 'AREA_ROUNDING',
      title: 'تنبيه التقريب العشري',
      text: function (p) {
        var diff = p && p.diff ? p.diff.toFixed(2) : '0.01';
        return 'يوجد فارق طفيف قدره ' + diff + ' م² بسبب التقريب العشري في الأرقام. يمكنك تعديل أحد الأنصبة لإزالته.';
      },
      duration: 5000
    },
    NEGATIVE_AREA: {
      type: 'ERROR',
      code: 'NEGATIVE_AREA',
      title: 'خطأ في المساحة',
      text: function () {
        return 'المساحة المدخلة غير صحيحة (يجب أن تكون أكبر من الصفر).';
      },
      duration: 6000
    },
    INVALID_TRIANGLE: {
      type: 'WARNING',
      code: 'INVALID_TRIANGLE',
      title: 'خطأ هندسي في المثلث',
      text: function () {
        return 'متباينة المثلث غير محققة: مجموع أي ضلعين يجب أن يكون أكبر من الضلع الثالث.';
      },
      duration: 6000
    },
    ZERO_LENGTH: {
      type: 'WARNING',
      code: 'ZERO_LENGTH',
      title: 'أبعاد غير مكتملة',
      text: function () {
        return 'يرجى إدخال طول وعرض الأرض لإكمال الحساب والتقسيم.';
      },
      duration: 4000
    },
    PARTITION_OVERFLOW: {
      type: 'WARNING',
      code: 'PARTITION_OVERFLOW',
      title: 'تجاوز المساحة الإجمالية',
      text: function (p) {
        var over = p && p.overflow ? p.overflow.toFixed(2) : '0.00';
        return 'مجموع مساحات الشركاء يتجاوز مساحة الأرض بمقدار ' + over + ' م².';
      },
      duration: 6000
    },
    SHARES_EXCEED_TOTAL: {
      type: 'ERROR',
      code: 'SHARES_EXCEED_TOTAL',
      title: 'خطأ في توزيع الأنصبة',
      text: function () {
        return 'مجموع أسهم الشركاء أكبر من المساحة الكلية المتاحة.';
      },
      duration: 6000
    },
    CALCULATION_SUCCESS: {
      type: 'SUCCESS',
      code: 'CALCULATION_SUCCESS',
      title: 'تم الحساب والتقسيم بنجاح',
      text: function (p) {
        var area = p && p.area ? p.area.toFixed(2) : '0.00';
        return 'تم حساب مساحة الأرض (' + area + ' م²) وتقسيم الأنصبة بدقة متناهية.';
      },
      duration: 3000
    }
  };

  var GuidanceEngine = {
    version: '1.0.0',

    /**
     * Analyze context or ValidationResult to determine appropriate guidance message
     * @param {Object} context 
     * @returns {Object|null} Formatted guidance message payload
     */
    analyze: function (context) {
      if (!context) return null;

      // Check validation result if passed directly
      if (context.validationResult && !context.validationResult.ok) {
        if (context.validationResult.message && context.validationResult.message.indexOf('مثلث') !== -1) {
          return GuidanceEngine.createMessage('INVALID_TRIANGLE');
        }
        return GuidanceEngine.createMessage('NEGATIVE_AREA');
      }

      // Check land dimensions
      if (context.w1 <= 0 || context.l1 <= 0) {
        return GuidanceEngine.createMessage('ZERO_LENGTH');
      }

      // Check shares vs total area
      if (typeof context.sumShares === 'number' && typeof context.totalArea === 'number') {
        var diff = context.sumShares - context.totalArea;
        if (diff > 0.05) {
          return GuidanceEngine.createMessage('PARTITION_OVERFLOW', { overflow: diff });
        }
        if (Math.abs(diff) > 0.0001 && Math.abs(diff) <= 0.05) {
          return GuidanceEngine.createMessage('AREA_ROUNDING', { diff: Math.abs(diff) });
        }
      }

      if (context.totalArea > 0) {
        return GuidanceEngine.createMessage('CALCULATION_SUCCESS', { area: context.totalArea });
      }

      return null;
    },

    /**
     * Create message object from fixed code dictionary
     * @param {string} code 
     * @param {Object} [params] 
     * @param {Object} [action] - Action button metadata {label: string, callback: Function}
     * @returns {Object|null}
     */
    createMessage: function (code, params, action) {
      var template = MESSAGE_DICTIONARY[code];
      if (!template) return null;

      return {
        code: template.code,
        type: template.type,
        title: template.title,
        text: typeof template.text === 'function' ? template.text(params || {}) : template.text,
        duration: template.duration,
        action: action || null
      };
    },

    /**
     * Show guidance message (with deduplication by message code & context)
     * @param {Object} msg 
     * @param {string} [contextSignature] 
     * @returns {boolean} True if message was displayed, false if suppressed as duplicate
     */
    show: function (msg, contextSignature) {
      if (!msg || !msg.code) return false;

      // Deduplication check: suppress identical active message code until context changes
      if (contextSignature && contextSignature === lastContextSignature && activeMessages[msg.code]) {
        return false;
      }

      if (contextSignature) {
        lastContextSignature = contextSignature;
      }

      activeMessages[msg.code] = true;

      // Delegate to toast system if available in window
      if (typeof window !== 'undefined' && window.showToast) {
        var toastType = (msg.type === 'ERROR') ? 'error' : 
                        (msg.type === 'SUCCESS') ? 'success' : 
                        (msg.type === 'WARNING') ? 'warning' : 'info';
        window.showToast(msg.text, toastType, msg.duration);
      }

      return true;
    },

    /**
     * Highlight problem input element in DOM (scroll into view & outline)
     * @param {string} targetId 
     * @returns {boolean}
     */
    highlight: function (targetId) {
      if (typeof document === 'undefined') return false;
      var el = document.getElementById(targetId);
      if (!el) return false;

      try {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        el.focus();
        el.style.outline = '2.5px solid #d32f2f';
        setTimeout(function () {
          el.style.outline = '';
        }, 3000);
      } catch (err) {}

      return true;
    },

    /**
     * Dismiss active message state for a given code
     * @param {string} code 
     */
    dismiss: function (code) {
      if (code && activeMessages[code]) {
        delete activeMessages[code];
      }
    },

    /**
     * Reset active message tracking state
     */
    resetState: function () {
      activeMessages = {};
      lastContextSignature = '';
    }
  };

  return GuidanceEngine;
}));
