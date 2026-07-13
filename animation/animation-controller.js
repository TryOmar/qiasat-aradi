/**
 * @file animation-controller.js
 * @description منسق التحكم والمزامنة لمحرك المحاكاة - يدعم اللغات، التجاوب، تفادي Memory Leak والـ Render Layering.
 */

window.AnimationController = {
  currentStepIndex: 0,
  steps: [],
  isPlaying: false,
  progress: 0,
  animationFrameId: null,
  timeoutId: null,
  lastTime: 0,
  speedMs: 1500,
  locale: "ar",

  // مراجع عناصر DOM
  modal: null,
  svg: null,
  captionText: null,
  stepIndicator: null,
  playBtn: null,
  speedSelect: null,

  /**
   * تشغيل المحاكاة وإدخال البيانات كـ Parameter مستقل لمنع الاعتماد على متغيرات الصفحة.
   * @param {Object} landData أبعاد الأرض
   * @param {Array} pieces قائمة الشركاء
   * @param {string} lang رمز اللغة
   */
  start: function (landData, pieces, lang) {
    try {
      this.locale = lang || "ar";
      const str = window.AnimationStrings[this.locale];

      this.modal = document.getElementById("animation-modal");
      this.svg = document.getElementById("animation-svg");
      this.captionText = document.getElementById("animation-text");
      this.stepIndicator = document.getElementById("animation-step-indicator");
      this.playBtn = document.getElementById("btn-anim-play");
      this.speedSelect = document.getElementById("anim-speed");

      if (!this.modal || !this.svg) {
        console.error("عناصر DOM لمودال المحاكاة غير متوفرة!");
        return;
      }

      // تنظيف كامل قبل تشغيل جديد لضمان ذاكرة نظيفة
      this.cleanup();

      // توليد مشاهد السيناريو
      this.steps = window.AnimationEngine.generateScenario(landData, pieces, this.locale);
      if (this.steps.length === 0) {
        alert(str ? str.alertNoData : "لا توجد بيانات للتقسيم!");
        return;
      }

      // تهيئة الرسام
      window.AnimationRenderer.init(this.svg, landData, pieces);

      // فتح الشاشة الافتراضية
      this.modal.style.display = "flex";
      this.currentStepIndex = 0;
      this.progress = 0;
      this.isPlaying = false;

      if (this.playBtn && str) {
        this.playBtn.innerHTML = str.play;
      }
      if (this.speedSelect) {
        this.speedMs = parseInt(this.speedSelect.value) || 1500;
      }

      this.showStep(this.currentStepIndex);
    } catch (err) {
      console.error("خطأ أثناء تشغيل محرك المحاكاة:", err);
    }
  },

  /**
   * عرض خطوة معينة بالكامل بالتقسيم الطبقي الموفر للأداء.
   */
  showStep: function (index) {
    if (index < 0 || index >= this.steps.length) return;
    
    this.currentStepIndex = index;
    const step = this.steps[index];
    const str = window.AnimationStrings[this.locale];

    // تحديث المحتوى النصي
    if (this.captionText) {
      this.captionText.innerHTML = step.caption;
    }
    if (this.stepIndicator && str) {
      this.stepIndicator.innerText = `${str.step} ${index + 1} ${str.of} ${this.steps.length} | ${step.title}`;
    }

    const hasAnimation = step.type === "MEASURE_BOTTOM" || step.type === "MEASURE_TOP" || step.type === "CONNECT_ROPE";
    this.progress = hasAnimation ? 0 : 1;

    // رسم الطبقة الثابتة لمرة واحدة فقط لمنع Reflow
    window.AnimationRenderer.renderStatic(step);
    // رسم الطبقة المتحركة
    window.AnimationRenderer.renderDynamic(step, this.progress);

    if (this.isPlaying) {
      this.runStepAnimation();
    }
  },

  /**
   * حلقة الحركة باستخدام requestAnimationFrame على الطبقة المتحركة فقط.
   */
  runStepAnimation: function () {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.lastTime = performance.now();
    const self = this;

    function animLoop(timestamp) {
      if (!self.isPlaying) return;

      const elapsed = timestamp - self.lastTime;
      self.lastTime = timestamp;

      self.progress += elapsed / self.speedMs;
      if (self.progress >= 1) {
        self.progress = 1;
        window.AnimationRenderer.renderDynamic(self.steps[self.currentStepIndex], 1);

        // انتظار ثانية كاملة بين المشاهد تلقائياً
        if (self.isPlaying) {
          self.timeoutId = setTimeout(() => {
            self.nextStep();
          }, 1000);
        }
      } else {
        // تحديث الطبقة المتحركة فقط 60 إطاراً بالثانية
        window.AnimationRenderer.renderDynamic(self.steps[self.currentStepIndex], self.progress);
        self.animationFrameId = requestAnimationFrame(animLoop);
      }
    }

    this.animationFrameId = requestAnimationFrame(animLoop);
  },

  nextStep: function () {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    if (this.currentStepIndex < this.steps.length - 1) {
      this.showStep(this.currentStepIndex + 1);
    } else {
      this.pause();
    }
  },

  prevStep: function () {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    if (this.currentStepIndex > 0) {
      this.showStep(this.currentStepIndex - 1);
    }
  },

  togglePlay: function () {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  },

  play: function () {
    this.isPlaying = true;
    const str = window.AnimationStrings[this.locale];
    if (this.playBtn && str) {
      this.playBtn.innerHTML = str.pause;
    }

    if (this.progress >= 1) {
      this.nextStep();
    } else {
      this.runStepAnimation();
    }
  },

  pause: function () {
    this.isPlaying = false;
    const str = window.AnimationStrings[this.locale];
    if (this.playBtn && str) {
      this.playBtn.innerHTML = str.play;
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  },

  restart: function () {
    this.pause();
    this.showStep(0);
  },

  changeSpeed: function () {
    if (this.speedSelect) {
      this.speedMs = parseInt(this.speedSelect.value) || 1500;
    }
  },

  /**
   * تنظيف الذاكرة كلياً لضمان عدم وجود تسريب (Memory Leak).
   */
  cleanup: function () {
    this.isPlaying = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  },

  /**
   * إغلاق المودال وتحرير كافة الكائنات والمراجع بالكامل.
   */
  stop: function () {
    this.cleanup();
    if (this.modal) {
      this.modal.style.display = "none";
    }
    // تصفير المراجع لتحرير الذاكرة
    this.steps = [];
    this.svg = null;
    this.staticLayer = null;
    this.dynamicLayer = null;
    this.captionText = null;
    this.stepIndicator = null;
    this.playBtn = null;
    this.speedSelect = null;
  }
};
