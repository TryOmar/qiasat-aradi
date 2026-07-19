/**
 * shared/storage.js
 * =================
 * نظام التخزين الموحد وآلية الترحيل (Unified Storage & Migration System) — مشروع الدَّلاَّل
 *
 * @version 1.0.0
 * @date 2026-07-19
 * @commit Commit 9 — Phase 5
 *
 * الغرض:
 *   توفير واجهة برمجة موحدة وآمنة للتعامل مع التخزين المحلي (localStorage)
 *   والتخزين المؤقت للمشروع (sessionStorage)، مع دعم آلية ترحيل البيانات
 *   القديمة (Migration Framework) والمزامنة الثنائية (Dual-Write) لضمان
 *   عدم فقدان أي بيانات وحفظ التوافقية الكاملة مع الصفحات غير المعدلة.
 *
 * ─────────────────────────────────────────────────────────────
 * ⚠️ تنبيه هام للتوافقية (Compatibility Layer Note) ⚠️
 * ─────────────────────────────────────────────────────────────
 * تصدير الكائن إلى النطاق العام (window.DallalStorage) يُعتبر
 * Compatibility Layer لتسهيل الانتقال التدريجي. يمنع تعديل أي
 * صفحة لاستخدامه حالياً وفقاً لقيود المرحلة الخامسة.
 * ─────────────────────────────────────────────────────────────
 *
 * المميزات:
 *   - الفصل بين التخزين المحلي (DallalStorage.local) والمؤقت (DallalStorage.session).
 *   - نطاق أسماء محمي (Namespace) افتراضياً ببادئة "dallal_".
 *   - ترحيل تلقائي للمفاتيح القديمة (Legacy Keys) مثل (dalal-carat-area) و (dallal_carat_size).
 *   - مزامنة خلفية عند الكتابة (Dual-Write) لتحديث المفاتيح القديمة تلقائياً
 *     حتى تقرأ الصفحات غير المعدلة نفس القيم المحدثة بدون كسر التوافق.
 *   - معالجة تلقائية وآمنة لتسلسل البيانات (JSON Serialization) مع دعم القيم الافتراضية.
 */

(function (global) {
  "use strict";

  // بادئة التخزين الافتراضية لجميع المفاتيح الجديدة لمنع التداخل مع تطبيقات أخرى
  const NAMESPACE_PREFIX = "dallal_";

  /**
   * تعريف قواعد ترحيل ومزامنة المفاتيح القديمة (Legacy Keys Map).
   * المفتاح الرئيسي (Key) يمثل المفتاح الموحد الجديد بدون البادئة.
   */
  const MIGRATION_RULES = {
    "carat_area": {
      // المفاتيح التاريخية المستخدمة في الصفحات المختلفة
      legacyKeys: ["dalal-carat-area", "dallal_carat_size"],
      storageType: "local",
      // الحفاظ على الكتابة في المفاتيح القديمة لتظل الصفحات القديمة تعمل بنجاح
      syncLegacyOnWrite: true
    },
    "show_feddan": {
      legacyKeys: ["dallal_show_feddan"],
      storageType: "local",
      syncLegacyOnWrite: true
    },
    "p11_history": {
      legacyKeys: ["p11-history"],
      storageType: "local",
      syncLegacyOnWrite: true
    }
  };

  /**
   * فئة محرك التخزين الأساسي (Storage Engine Class)
   */
  class StorageEngine {
    /**
     * @param {Storage} storageInstance - مثيل التخزين (localStorage أو sessionStorage)
     * @param {string} type - نوع التخزين كـ نص ('local' أو 'session')
     */
    constructor(storageInstance, type) {
      this.storage = storageInstance;
      this.type = type;
    }

    /**
     * بناء المفتاح مع البادئة (Namespacing)
     * @param {string} key - المفتاح المراد تحويله
     * @returns {string} المفتاح بالبادئة
     */
    _buildKey(key) {
      return key.startsWith(NAMESPACE_PREFIX) ? key : `${NAMESPACE_PREFIX}${key}`;
    }

    /**
     * فحص ما إذا كان هناك ترحيل مطلوب للمفتاح الحالي
     * @param {string} key - المفتاح بدون بادئة
     * @returns {object|null} قاعدة الترحيل إن وجدت
     */
    _getMigrationRule(key) {
      const cleanKey = key.startsWith(NAMESPACE_PREFIX) 
        ? key.substring(NAMESPACE_PREFIX.length) 
        : key;
      const rule = MIGRATION_RULES[cleanKey];
      return (rule && rule.storageType === this.type) ? rule : null;
    }

    /**
     * جلب قيمة من التخزين مع فحص الترحيل التلقائي
     *
     * @param {string} key - المفتاح المطلوب
     * @param {*} [defaultValue=null] - القيمة الافتراضية في حال عدم وجود المفتاح
     * @returns {*} القيمة المسترجعة (تلقائياً يتم فك تسلسل JSON إن أمكن)
     */
    getItem(key, defaultValue = null) {
      if (!this.storage) return defaultValue;

      const targetKey = this._buildKey(key);
      let rawValue = this.storage.getItem(targetKey);

      // إذا لم توجد القيمة بالاسم الجديد، نفحص قواعد الترحيل القديمة
      if (rawValue === null) {
        const rule = this._getMigrationRule(key);
        if (rule) {
          for (const legacyKey of rule.legacyKeys) {
            const legacyValue = this.storage.getItem(legacyKey);
            if (legacyValue !== null) {
              // وجدنا قيمة قديمة! نقوم بترحيلها فوراً للمفتاح الجديد
              this.storage.setItem(targetKey, legacyValue);
              rawValue = legacyValue;
              break;
            }
          }
        }
      }

      if (rawValue === null) {
        return defaultValue;
      }

      // محاولة فك تسلسل JSON تلقائياً
      try {
        return JSON.parse(rawValue);
      } catch (e) {
        // إذا فشل الفك (مثال: نصوص عادية)، تُرجع القيمة كما هي
        return rawValue;
      }
    }

    /**
     * حفظ قيمة في التخزين مع إمكانية المزامنة الثنائية (Dual-Write)
     *
     * @param {string} key - المفتاح المطلوب
     * @param {*} value - القيمة المراد حفظها (يتم تحويل الكائنات والمصفوفات تلقائياً لنصوص JSON)
     * @returns {boolean} true إذا تمت العملية بنجاح
     */
    setItem(key, value) {
      if (!this.storage) return false;

      const targetKey = this._buildKey(key);
      const serializedValue = typeof value === "object" ? JSON.stringify(value) : String(value);

      try {
        this.storage.setItem(targetKey, serializedValue);

        // فحص ومزامنة المفاتيح القديمة لضمان عدم حدوث تشتت بالبيانات (Backward Sync)
        const rule = this._getMigrationRule(key);
        if (rule && rule.syncLegacyOnWrite) {
          for (const legacyKey of rule.legacyKeys) {
            this.storage.setItem(legacyKey, serializedValue);
          }
        }
        return true;
      } catch (e) {
        console.error(`[DallalStorage] Failed to set item "${key}":`, e);
        return false;
      }
    }

    /**
     * حذف مفتاح محدد من التخزين
     *
     * @param {string} key - المفتاح المطلوب حذفه
     * @returns {boolean}
     */
    removeItem(key) {
      if (!this.storage) return false;
      const targetKey = this._buildKey(key);
      this.storage.removeItem(targetKey);

      // في حال الحذف، نحذف أيضاً المفاتيح القديمة المرتبطة به إن وجدت
      const rule = this._getMigrationRule(key);
      if (rule) {
        for (const legacyKey of rule.legacyKeys) {
          this.storage.removeItem(legacyKey);
        }
      }
      return true;
    }

    /**
     * التحقق من وجود مفتاح معين بالتخزين
     *
     * @param {string} key - المفتاح المراد فحصه
     * @returns {boolean}
     */
    hasItem(key) {
      if (!this.storage) return false;
      const targetKey = this._buildKey(key);
      if (this.storage.getItem(targetKey) !== null) return true;

      // فحص المفاتيح القديمة كبديل احتياطي
      const rule = this._getMigrationRule(key);
      if (rule) {
        for (const legacyKey of rule.legacyKeys) {
          if (this.storage.getItem(legacyKey) !== null) return true;
        }
      }
      return false;
    }

    /**
     * مسح جميع المفاتيح التي تبدأ بالبادئة المخصصة (Namespace Clear)
     * دون لمس البيانات الأخرى المخزنة في المتصفح.
     */
    clear() {
      if (!this.storage) return;
      const keysToRemove = [];

      for (let i = 0; i < this.storage.length; i++) {
        const k = this.storage.key(i);
        if (k && k.startsWith(NAMESPACE_PREFIX)) {
          keysToRemove.push(k);
        }
      }

      keysToRemove.forEach(k => this.storage.removeItem(k));
    }
  }

  // ----------------------------------------------------------
  // الكائن الرئيسي المصدر للنطاق العام
  // ----------------------------------------------------------
  const DallalStorage = {
    /** واجهة التعامل مع التخزين المحلي الدائم (localStorage) */
    local: new StorageEngine(typeof window !== "undefined" ? window.localStorage : null, "local"),

    /** واجهة التعامل مع التخزين المؤقت للجلسة (sessionStorage) */
    session: new StorageEngine(typeof window !== "undefined" ? window.sessionStorage : null, "session"),

    /** معرّف الإصدار وقواعد الترحيل الحالية للتوثيق */
    VERSION: "1.0.0",
    MIGRATION_RULES: Object.freeze(MIGRATION_RULES)
  };

  // تصدير للـ window كـ Compatibility Layer
  global.DallalStorage = DallalStorage;

})(typeof window !== "undefined" ? window : global);
