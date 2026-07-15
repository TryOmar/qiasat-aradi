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
  activeMode: "training", // 'training' (التدريب التفصيلي)، 'fast' (التنفيذ السريع) أو 'practice' (التدريب العملي التفاعلي)

  // مراجع عناصر DOM
  modal: null,
  svg: null,
  captionText: null,
  stepIndicator: null,
  playBtn: null,
  speedSelect: null,
  modeSelect: null,
  checkpointCard: null,
  progressBarFill: null,

  /**
   * تشغيل المحاكاة وإدخال البيانات كـ Parameter مستقل لمنع الاعتماد على متغيرات الصفحة.
   * @param {Object} landData أبعاد الأرض
   * @param {Array} pieces قائمة الشركاء
   * @param {string} lang رمز اللغة
   */
  start: function (landData, pieces, lang) {
    try {
      this.landData = landData;
      this.pieces = pieces;
      this.locale = lang || "ar";
      const str = window.AnimationStrings[this.locale];

      this.modal = document.getElementById("animation-modal");
      this.svg = document.getElementById("animation-svg");
      this.captionText = document.getElementById("animation-text");
      this.stepIndicator = document.getElementById("animation-step-indicator");
      this.playBtn = document.getElementById("btn-anim-play");
      this.speedSelect = document.getElementById("anim-speed");
      this.modeSelect = document.getElementById("anim-mode");
      this.checkpointCard = document.getElementById("anim-checkpoint-card");
      this.progressBarFill = document.getElementById("anim-progress-bar-fill");

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
      
      // استرجاع الجلسة السابقة (البند 8: حفظ حالة التنفيذ)
      let startStepIdx = 0;
      const savedStep = sessionStorage.getItem("ld_anim_last_step");
      if (savedStep !== null) {
        const parsed = parseInt(savedStep);
        if (parsed >= 0 && parsed < this.steps.length) {
          startStepIdx = parsed;
        }
      }
      
      this.currentStepIndex = startStepIdx;
      this.progress = 0;
      this.isPlaying = false;

      if (this.playBtn && str) {
        this.playBtn.innerHTML = str.play;
      }
      
      // مزامنة الوضع الحالي
      if (this.modeSelect) {
        this.activeMode = this.modeSelect.value || "training";
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
    // حفظ الخطوة الحالية في الجلسة
    sessionStorage.setItem("ld_anim_last_step", index);

    const step = this.steps[index];
    const str = window.AnimationStrings[this.locale];

    // إخفاء كارت التحقق عند الانتقال
    if (this.checkpointCard) {
      this.checkpointCard.style.display = "none";
    }

    // تحديث المحتوى النصي بناءً على الوضع الميداني النشط
    if (this.captionText) {
      if (this.activeMode === "fast") {
        this.captionText.innerHTML = this.getShortCaption(step);
      } else if (this.activeMode === "practice") {
        this.captionText.innerHTML = this.getPracticeCaption(step);
      } else {
        this.captionText.innerHTML = step.caption;
      }
    }

    // تحديث مؤشر الخطوات و شريط التقدم الجرافيكي
    if (this.stepIndicator && str) {
      this.stepIndicator.innerText = `${str.step} ${index + 1} ${str.of} ${this.steps.length}`;
    }
    if (this.progressBarFill) {
      const pct = Math.round(((index + 1) / this.steps.length) * 100);
      this.progressBarFill.style.width = `${pct}%`;
    }

    const hasAnimation = step.type === "MEASURE_BOTTOM" || step.type === "MEASURE_TOP" || step.type === "CONNECT_ROPE";
    this.progress = hasAnimation ? 0 : 1;

    // رسم الطبقة الثابتة لمرة واحدة فقط لمنع Reflow
    window.AnimationRenderer.renderStatic(step);
    // رسم الطبقة المتحركة
    window.AnimationRenderer.renderDynamic(step, this.progress);

    if (this.isPlaying) {
      this.runStepAnimation();
    } else if (hasAnimation) {
      // إذا كان متوقفاً، نبدأ الرسوم لإظهار الانسيابية
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
      const elapsed = timestamp - self.lastTime;
      self.lastTime = timestamp;

      // حساب التقدم بالسرعة المختارة
      self.progress += elapsed / self.speedMs;
      
      if (self.progress >= 1) {
        self.progress = 1;
        window.AnimationRenderer.renderDynamic(self.steps[self.currentStepIndex], 1);
        
        // إيقاف مؤقت لعرض بطاقة التحقق بعد كل خطوة قياس/وتد
        const step = self.steps[self.currentStepIndex];
        const needsCheck = step.type === "MEASURE_BOTTOM" || step.type === "MEASURE_TOP" || step.type === "CONNECT_ROPE";
        
        if (needsCheck && self.checkpointCard) {
          self.pause();
          
          // تعديل صيغة السؤال في وضع التدريب العملي (البند 2)
          const checkpointLabel = self.checkpointCard.querySelector("span");
          if (checkpointLabel) {
            if (self.activeMode === "practice") {
              checkpointLabel.innerHTML = "❓ هل وضعت الوتد في المكان الصحيح؟";
            } else {
              checkpointLabel.innerHTML = "❓ هل تم الانتهاء من تنفيذ ووتد هذه الخطوة ميدانياً؟";
            }
          }
          self.checkpointCard.style.display = "flex";
        } else if (self.isPlaying) {
          // انتظار ثانية كاملة بين المشاهد تلقائياً في السيناريوهات العامة
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

  /**
   * تأكيد وضع الوتد والانتقال للخطوة التالية (البند 6)
   */
  confirmStep: function () {
    if (this.checkpointCard) {
      this.checkpointCard.style.display = "none";
    }
    this.play(); // استئناف الحركة والانتقال
  },

  /**
   * إعادة تشغيل الخطوة الحالية فقط (البند 4)
   */
  replayCurrentStep: function () {
    this.pause();
    if (this.checkpointCard) {
      this.checkpointCard.style.display = "none";
    }
    this.progress = 0;
    this.showStep(this.currentStepIndex);
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
      this.showFinalSummaryToast();
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
   * تغيير وضع الشرح: التدريب أو السريع أو التدريب العملي التفاعلي
   */
  changeMode: function () {
    if (this.modeSelect) {
      this.activeMode = this.modeSelect.value || "training";
      
      // تكييف السرعة تلقائياً حسب الوضع المحدد
      if (this.activeMode === "fast" && this.speedSelect) {
        this.speedSelect.value = "800"; 
        this.speedMs = 800;
      } else if (this.activeMode === "training" && this.speedSelect) {
        this.speedSelect.value = "1500"; 
        this.speedMs = 1500;
      } else if (this.activeMode === "practice" && this.speedSelect) {
        this.speedSelect.value = "2500"; // سرعة هادئة جداً لوضع التدريب العملي
        this.speedMs = 2500;
      }
      
      // تحديث النصوص المعروضة حالياً
      this.showStep(this.currentStepIndex);
    }
  },

  /**
   * توليد صيغ نصية مختصرة ومباشرة للوضع السريع (البند 9)
   */
  getShortCaption: function (step) {
    switch (step.type) {
      case "INTRO_LAND":
        return `محيط وأبعاد الأرض الإجمالية المطلوبة.`;
      case "START_POINT":
        return `نقطة الصفر 🏁: ابدأ القياس من الحد الأيمن للأرض.`;
      case "MEASURE_BOTTOM":
        {
          const match = step.caption.match(/(\d+\.\d+|\d+) م/);
          const val = (match && match[0]) || "";
          return `قس مسافة ${val} أسفل وثبّت وتداً 📌.`;
        }
      case "MEASURE_TOP":
        {
          const match = step.caption.match(/(\d+\.\d+|\d+) م/);
          const val = (match && match[0]) || "";
          return `قس مسافة ${val} أعلى وثبّت وتداً 📌.`;
        }
      case "CONNECT_ROPE":
        return `شد حبلاً مستقيماً ومشدوداً بين الوتدين لتحديد الفاصل.`;
      case "SHOW_DIVIDER":
        return `قس طول خيط الفاصل الفعلي للتأكيد والمطابقة.`;
      case "SHOW_SHARE":
        return `تم تسليم قطعة الشريك الحالية وتحديد مساحتها.`;
      case "FINAL_SUMMARY":
        return `✅ تم تنفيذ التقسيم بالكامل بنجاح. الأوتاد مثبتة.`;
      default:
        return step.caption;
    }
  },

  /**
   * توليد صيغ تدريبية عمل تفاعلية تطلب من المستخدم القياس بملء الفراغات (البند 1)
   */
  getPracticeCaption: function (step) {
    let raw = step.caption;
    // استبدال الأرقام المحصورة بين أقواس في الكابشن بعلامة فراغات لتحدي المستخدم
    const regex = /\((\d+\.\d+|\d+)\s*م\)/g;
    if (regex.test(raw)) {
      raw = raw.replace(regex, "(........ م)");
      // زر الكشف
      raw += ` <a href="#" onclick="event.preventDefault(); AnimationController.revealPracticeNumber('${step.caption.replace(/'/g, "\\'")}')" style="color: #0d47a1; font-weight: bold; text-decoration: underline; margin-right: 12px; font-size: 13px;">🔍 كشف الرقم الصحيح</a>`;
    }
    return raw;
  },

  /**
   * كشف الرقم الصحيح داخل وضع التدريب التفاعلي
   */
  revealPracticeNumber: function (originalCaption) {
    if (this.captionText) {
      this.captionText.innerHTML = originalCaption + ` <span style="color:#2e7d32; font-weight:bold; margin-right:10px;">✅ تم الكشف!</span>`;
    }
  },

  /**
   * عرض رسالة النجاح الختامية بشكل بارز (البند 7)
   */
  showFinalSummaryToast: function () {
    const totalArea = document.getElementById("calc-area-m2") ? document.getElementById("calc-area-m2").innerText : "-";
    const pegsCount = 2 * (window.calculatedPieces.length + 1);
    
    if (this.activeMode === "practice") {
      // تسجيل عدد مرات النجاح في الـ localStorage (البند 4)
      const completions = parseInt(localStorage.getItem("ld_practice_completions") || "0") + 1;
      localStorage.setItem("ld_practice_completions", completions);
      
      alert(`🎓 أحسنت! لقد أكملت تدريب تنفيذ تقسيم الأرض بنجاح.
---------------------------------------------------------
📋 قائمة المراجعة النهائية للتنفيذ:
[✓] تم قياس الحد العلوي بالكامل.
[✓] تم قياس الحد السفلي بالكامل.
[✓] تم وضع جميع الأوتاد لتحديد الفواصل.
[✓] تم شد جميع الحبال (خيوط العلام).
[✓] تم مراجعة الفواصل الهندسية وتطابقها.

الأرض جاهزة للتسليم للشركاء. (عدد مرات إتمام التدريب: ${completions})

⚠️ تنبيه هام للتحقق من الواقع:
إذا وجدت اختلافاً بين القياسات الفعلية على الطبيعة والقياسات الموجودة في البرنامج، فيجب مراجعة قياسات الأرض الأربعة الأساسية أولاً قبل تثبيت الأوتاد والتسليم.`);
    } else {
      alert(`🎉 تم اكتمال تنفيذ التقسيم بنجاح!
-------------------------------------
• عدد الشركاء: ${window.calculatedPieces.length} شركاء
• عدد الفواصل المحددة: ${window.calculatedPieces.length - 1} فواصل
• إجمالي الأوتاد الموضوعة: ${pegsCount} أوتاد 📌
• مساحة الأرض الإجمالية: ${totalArea} م²

الأرض جاهزة تماماً للتسليم الفعلي للشركاء.`);
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
    this.modeSelect = null;
    this.checkpointCard = null;
    this.progressBarFill = null;
  }
};

// الاستماع لتغييرات اتجاه التقسيم لتحديث المحاكاة الحية دون تصفيرها
window.addEventListener("partition-direction-changed", function (e) {
  const controller = window.AnimationController;
  if (controller.modal && controller.modal.style.display === "flex") {
    console.log("Trace: updating animation controller due to direction change:", e.detail.direction);
    
    // 1. الاحتفاظ بمعلومات الخطوة الحالية (الشريك ونوع الخطوة)
    const currentStep = controller.steps[controller.currentStepIndex];
    const partnerIndex = currentStep ? currentStep.partnerIndex : undefined;
    const type = currentStep ? currentStep.type : undefined;
    
    const wasPlaying = controller.isPlaying;
    controller.pause(); // إيقاف مؤقت للمحاكاة
    
    // 2. إعادة توليد خطوات السيناريو بالاتجاه الجديد
    const landData = controller.landData;
    const pieces = controller.pieces;
    controller.steps = window.AnimationEngine.generateScenario(landData, pieces, controller.locale);
    
    // 3. إعادة تهيئة الرسام
    window.AnimationRenderer.init(controller.svg, landData, pieces);
    
    // 4. البحث عن الخطوة المقابلة للشريك ونوع المهمة
    let targetStepIndex = 0;
    if (type !== undefined) {
      const found = controller.steps.findIndex(s => s.type === type && s.partnerIndex === partnerIndex);
      if (found !== -1) {
        targetStepIndex = found;
      }
    }
    
    // 5. الانتقال للخطوة الجديدة
    controller.showStep(targetStepIndex);
    
    // 6. استئناف التشغيل إذا كانت تعمل سابقاً
    if (wasPlaying) {
      controller.play();
    }
  }
});
