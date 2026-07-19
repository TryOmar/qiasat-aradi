/**
 * shared/toast.js
 * ===============
 * نظام التنبيهات الموحد (Toast Notification System) — مشروع الدَّلاَّل
 *
 * @version 1.0.0
 * @date 2026-07-19
 * @commit Commit 9 — Phase 4
 *
 * الغرض:
 *   توفير نظام تنبيهات مرن وجميل وسهل الاستخدام في جميع صفحات التطبيق،
 *   مع دعم كامل للغة العربية (RTL) وجماليات بصرية متميزة (Rich Aesthetics).
 *
 * المميزات:
 *   - تصميم عصري وبسيط بظلال غامرة وحواف دائرية (Glassmorphism inspired).
 *   - دعم 4 أنواع رئيسية: نجاح (success)، خطأ (error)، تحذير (warning)، ومعلومات (info).
 *   - يدعم التكديس والتنظيف الذكي لمنع تداخل الرسائل.
 *   - إدخال ديناميكي لملف التنسيقات (CSS Injection) عند تحميل المكتبة لتسهيل التكامل.
 *   - لا يتداخل مع الأكواد القديمة لـ showToast (يعمل بشكل مستقل تماماً باسم DallalToast).
 *
 * طريقة الاستخدام:
 *   DallalToast.success("تم حفظ البيانات بنجاح!");
 *   DallalToast.error("حدث خطأ أثناء الاتصال بالخادم");
 *   DallalToast.warning("يرجى التأكد من تعبئة الحقول المطلوبة");
 *   DallalToast.info("مسافة القيراط الافتراضية هي 168 متر مربع");
 *
 *   أو بشكل عام:
 *   DallalToast.show("الرسالة", "success" | "error" | "warning" | "info", { duration: 3000 });
 */

(function (global) {
  "use strict";

  // ----------------------------------------------------------
  // إدراج أنماط CSS الموحدة في رأس الصفحة تلقائياً
  // ----------------------------------------------------------
  function injectStyles() {
    if (document.getElementById("dallal-toast-styles")) return;

    const style = document.createElement("style");
    style.id = "dallal-toast-styles";
    style.textContent = `
      .dallal-toast-container {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 999999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
        width: 100%;
        max-width: 400px;
        padding: 0 20px;
        box-sizing: border-box;
      }

      .dallal-toast {
        background: rgba(255, 255, 255, 0.95);
        color: #333333;
        padding: 12px 20px;
        border-radius: 12px;
        font-family: Cairo, Arial, sans-serif;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15), 
                    0 3px 10px rgba(0, 0, 0, 0.08);
        direction: rtl;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        pointer-events: auto;
        opacity: 0;
        transform: scale(0.9) translateY(20px);
        transition: opacity 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), 
                    transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        border-right: 5px solid #1565c0;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }

      .dallal-toast.show {
        opacity: 1;
        transform: scale(1) translateY(0);
      }

      .dallal-toast-content {
        display: flex;
        align-items: center;
        gap: 10px;
        text-align: right;
        flex-grow: 1;
        line-height: 1.5;
      }

      .dallal-toast-icon {
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .dallal-toast-close {
        background: transparent;
        border: none;
        color: #999999;
        cursor: pointer;
        font-size: 16px;
        padding: 0 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s ease;
      }

      .dallal-toast-close:hover {
        color: #333333;
      }

      /* تنسيقات الأنواع المختلفة */
      .dallal-toast-success {
        border-right-color: #2e7d32;
        background: rgba(232, 245, 233, 0.96);
        color: #1b5e20;
      }

      .dallal-toast-error {
        border-right-color: #c62828;
        background: rgba(255, 235, 235, 0.96);
        color: #b71c1c;
      }

      .dallal-toast-warning {
        border-right-color: #f57c00;
        background: rgba(255, 243, 224, 0.96);
        color: #e65100;
      }

      .dallal-toast-info {
        border-right-color: #0277bd;
        background: rgba(225, 245, 254, 0.96);
        color: #01579b;
      }

      /* للتوافق مع شاشات الجوال */
      @media (max-width: 480px) {
        .dallal-toast-container {
          bottom: 16px;
          max-width: 100%;
        }
        .dallal-toast {
          font-size: 13px;
          padding: 10px 16px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ----------------------------------------------------------
  // الكائن الداخلي لإدارة الـ Toasts
  // ----------------------------------------------------------
  let container = null;

  function getContainer() {
    if (!container) {
      container = document.createElement("div");
      container.className = "dallal-toast-container";
      document.body.appendChild(container);
    }
    return container;
  }

  const defaultIcons = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️"
  };

  const DallalToast = {
    /**
     * تعرض تنبيهاً مؤقتاً للمستخدم.
     *
     * @param {string} message - نص التنبيه المراد عرضه.
     * @param {string} [type='info'] - نوع التنبيه ('success' | 'error' | 'warning' | 'info').
     * @param {object} [options={}] - خيارات إضافية للتخصيص:
     *   - duration: مدة العرض بالملي ثانية (الافتراضي 3500، مرر 0 لجعله دائماً).
     *   - closeButton: هل يجب إظهار زر إغلاق يدوي؟ (الافتراضي true).
     *   - icon: أيقونة مخصصة بديلة للأيقونة الافتراضية للنوع.
     */
    show(message, type = "info", options = {}) {
      // إعداد الأنماط إذا لم تكن موجودة
      injectStyles();

      const duration = typeof options.duration === "number" ? options.duration : 3500;
      const showClose = typeof options.closeButton === "boolean" ? options.closeButton : true;
      const icon = options.icon || defaultIcons[type] || "🔔";

      const toastContainer = getContainer();

      // إنشاء عنصر الـ Toast
      const toast = document.createElement("div");
      toast.className = `dallal-toast dallal-toast-${type}`;
      
      let htmlContent = `
        <div class="dallal-toast-content">
          <span class="dallal-toast-icon">${icon}</span>
          <span>${message}</span>
        </div>
      `;

      if (showClose) {
        htmlContent += `<button class="dallal-toast-close" title="إغلاق">&times;</button>`;
      }

      toast.innerHTML = htmlContent;

      // تفعيل زر الإغلاق اليدوي
      if (showClose) {
        const closeBtn = toast.querySelector(".dallal-toast-close");
        closeBtn.addEventListener("click", () => DallalToast.dismiss(toast));
      }

      // إضافة التنبيه للحاوية
      toastContainer.appendChild(toast);

      // تشغيل مؤثر الظهور (بعد لحظة لتسهيل عملية الـ Transition)
      setTimeout(() => {
        toast.classList.add("show");
      }, 50);

      // الإغلاق التلقائي بعد انتهاء المدة
      if (duration > 0) {
        setTimeout(() => {
          DallalToast.dismiss(toast);
        }, duration);
      }

      return toast;
    },

    /**
     * تزيل التنبيه المحدد بمؤثر إخفاء حركي ناعم.
     *
     * @param {HTMLElement} toast - عنصر الـ Toast المراد إزالته.
     */
    dismiss(toast) {
      if (!toast) return;
      toast.classList.remove("show");
      // الانتظار حتى اكتمال المؤثر الحركي قبل إزالته تماماً من الصفحة
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
        // إزالة الحاوية إذا أصبحت فارغة لتقليل استهلاك الذاكرة
        if (container && container.childNodes.length === 0) {
          container.remove();
          container = null;
        }
      }, 300);
    },

    /**
     * تعرض رسالة نجاح خضراء مع أيقونة صح.
     *
     * @param {string} message - الرسالة المراد عرضها.
     * @param {object} [options={}] - خيارات إضافية.
     */
    success(message, options = {}) {
      return DallalToast.show(message, "success", options);
    },

    /**
     * تعرض رسالة خطأ حمراء مع أيقونة خطأ.
     *
     * @param {string} message - الرسالة المراد عرضها.
     * @param {object} [options={}] - خيارات إضافية.
     */
    error(message, options = {}) {
      return DallalToast.show(message, "error", options);
    },

    /**
     * تعرض رسالة تحذير برتقالية مع أيقونة تحذير.
     *
     * @param {string} message - الرسالة المراد عرضها.
     * @param {object} [options={}] - خيارات إضافية.
     */
    warning(message, options = {}) {
      return DallalToast.show(message, "warning", options);
    },

    /**
     * تعرض رسالة معلومات زرقاء مع أيقونة معلومات.
     *
     * @param {string} message - الرسالة المراد عرضها.
     * @param {object} [options={}] - خيارات إضافية.
     */
    info(message, options = {}) {
      return DallalToast.show(message, "info", options);
    }
  };

  // تصدير للنطاق العام
  global.DallalToast = DallalToast;

  if (typeof window !== "undefined" && window.DALLAL_DEBUG !== false) {
    console.log("[DallalToast] v1.0.0 loaded successfully.");
  }

})(typeof window !== "undefined" ? window : global);
