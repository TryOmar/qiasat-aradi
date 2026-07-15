/**
 * @file partition-direction.js
 * @description مدير اتجاه التقسيم الموحد (RTL / LTR) لتطبيق الدلال.
 * يعمل كمصدر موحد للحقيقة (Single Source of Truth) ويصدر حدثاً عاماً عند التغيير.
 */

(function () {
  const STORAGE_KEY = "p11-partition-direction";
  let currentDirection = "RTL";
  const listeners = new Set();

  // استعادة الاتجاه الافتراضي المخزن
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "RTL" || saved === "LTR") {
      currentDirection = saved;
    }
  } catch (e) {
    console.warn("Failed to load partition direction from localStorage:", e);
  }

  window.PartitionDirectionManager = {
    /**
     * الحصول على الاتجاه الحالي
     * @returns {"RTL" | "LTR"}
     */
    getDirection: function () {
      return currentDirection;
    },

    /**
     * تعيين اتجاه جديد للتقسيم
     * @param {"RTL" | "LTR"} dir 
     */
    setDirection: function (dir) {
      if (dir !== "RTL" && dir !== "LTR") return;
      if (currentDirection === dir) return;

      currentDirection = dir;

      try {
        localStorage.setItem(STORAGE_KEY, dir);
      } catch (e) {
        console.warn("Failed to save partition direction to localStorage:", e);
      }

      // إرسال الحدث المخصص العام
      const event = new CustomEvent("partition-direction-changed", {
        detail: { direction: dir }
      });
      window.dispatchEvent(event);

      // استدعاء المستمعين المشتركين
      listeners.forEach(listener => {
        try {
          listener(dir);
        } catch (e) {
          console.error("Error in partition direction listener callback:", e);
        }
      });
    },

    /**
     * هل الاتجاه الحالي من اليمين إلى اليسار؟
     * @returns {boolean}
     */
    isRTL: function () {
      return currentDirection === "RTL";
    },

    /**
     * هل الاتجاه الحالي من اليسار إلى اليمين؟
     * @returns {boolean}
     */
    isLTR: function () {
      return currentDirection === "LTR";
    },

    /**
     * الاشتراك في تغييرات الاتجاه
     * @param {Function} listener 
     */
    subscribe: function (listener) {
      if (typeof listener === "function") {
        listeners.add(listener);
      }
    },

    /**
     * إلغاء الاشتراك
     * @param {Function} listener 
     */
    unsubscribe: function (listener) {
      listeners.delete(listener);
    },

    /**
     * بديل متوافق للـ subscribe
     */
    addListener: function (listener) {
      this.subscribe(listener);
    },

    /**
     * بديل متوافق للـ unsubscribe
     */
    removeListener: function (listener) {
      this.unsubscribe(listener);
    }
  };
})();
