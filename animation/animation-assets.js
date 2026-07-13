/**
 * @file animation-assets.js
 * @description مكتبة رسومات SVG المدمجة وسلاسل النصوص المترجمة للمحرك الموحد.
 */

window.AnimationAssets = {
  // المعرفات الرسومية للأيقونات لاستعمالها عبر <use>
  symbols: {
    worker: `
      <g id="fh-anim-sym-worker">
        <path d="M12,54 C12,42 20,38 32,38 C44,38 52,42 52,54" fill="#1565c0" />
        <path d="M22,38 L42,38 L46,54 L18,54 Z" fill="#ffd54f" />
        <path d="M28,38 L32,46 L36,38" fill="none" stroke="#e65100" stroke-width="2" />
        <circle cx="32" cy="24" r="10" fill="#ffcc80" />
        <path d="M20,22 C20,13 44,13 44,22" fill="#ffb300" />
        <path d="M16,22 L48,22" stroke="#ffb300" stroke-width="3" stroke-linecap="round" />
        <rect x="30" y="13" width="4" height="9" fill="#ffa000" />
      </g>
    `,
    stake: `
      <g id="fh-anim-sym-stake">
        <path d="M12,4 L20,4 L20,48 L16,60 L12,48 Z" fill="#d7ccc8" stroke="#8d6e63" stroke-width="1.5" />
        <rect x="10" y="2" width="12" height="6" rx="2" fill="#e53935" />
        <ellipse cx="16" cy="60" rx="6" ry="2" fill="rgba(0,0,0,0.15)" />
      </g>
    `,
    tape: `
      <g id="fh-anim-sym-tape">
        <rect x="6" y="6" width="36" height="36" rx="8" fill="#ffb300" stroke="#ffa000" stroke-width="2" />
        <rect x="10" y="10" width="28" height="28" rx="6" fill="#ffe082" />
        <path d="M42,34 L48,34 L48,38 L42,38 Z" fill="#ffd54f" />
        <circle cx="24" cy="24" r="8" fill="#37474f" />
        <circle cx="24" cy="24" r="4" fill="#cfd8dc" />
      </g>
    `,
    flagStart: `
      <g id="fh-anim-sym-flagStart">
        <line x1="8" y1="4" x2="8" y2="60" stroke="#78909c" stroke-width="3" stroke-linecap="round" />
        <path d="M8,8 L40,18 L8,28 Z" fill="#2e7d32" stroke="#1b5e20" stroke-width="1.5" stroke-linejoin="round" />
        <circle cx="8" cy="4" r="3" fill="#cfd8dc" />
      </g>
    `,
    flagEnd: `
      <g id="fh-anim-sym-flagEnd">
        <line x1="8" y1="4" x2="8" y2="60" stroke="#78909c" stroke-width="3" stroke-linecap="round" />
        <path d="M8,8 L40,18 L8,28 Z" fill="#c62828" stroke="#b71c1c" stroke-width="1.5" stroke-linejoin="round" />
        <circle cx="8" cy="4" r="3" fill="#cfd8dc" />
      </g>
    `
  }
};

// سلاسل النصوص للترجمة ودعم اللغات
window.AnimationStrings = {
  ar: {
    title: "🎬 شرح التنفيذ الميداني التفاعلي",
    step: "الخطوة",
    of: "من",
    speed: "سرعة الشرح:",
    speedSlow: "×0.5 (بطيء)",
    speedNormal: "1× (طبيعي)",
    speedFast: "2× (سريع)",
    speedVeryFast: "4× (سريع جداً)",
    play: "▶ تشغيل",
    pause: "⏸ إيقاف",
    prev: "⏮ السابق",
    next: "التالي ⏭",
    restart: "🔄 إعادة",
    alertNoData: "يرجى إدخال بيانات الأرض والشركاء أولاً لتوليد الشرح الميداني!",
    
    // سيناريوهات الشرح
    introLand: (w1, w2, l1, l2) => `هذه هي الأرض المطلوب تقسيمها. أبعادها الأربعة: الحد السفلي (${w1} م)، الحد العلوي (${w2} م)، الحد الأيمن (${l1} م)، الحد الأيسر (${l2} م).`,
    startPoint: "يبدأ القياس والاستلام الميداني من الحد الأيمن للأرض (يمين ➡️ يسار).",
    measureBottom: (w, curr) => `قس مسافة (${w} م) على الحد السفلي بدءاً من الوتد السابق (المسافة التراكمية من اليمين: ${curr} م)، وثبت وتداً 📌.`,
    measureBottomRemainder: (w) => `قس المسافة المتبقية على الحد السفلي وهي (${w} م) لتصل للحد الأيسر، وثبت وتداً 📌.`,
    measureTop: (w, curr) => `انتقل للحد العلوي وقس مسافة (${w} م) بدءاً من العلامة السابقة (المسافة التراكمية من اليمين: ${curr} م)، وثبت وتداً 📌.`,
    measureTopRemainder: (w) => `قس المسافة المتبقية على الحد العلوي وهي (${w} م) لتصل للحد الأيسر للأرض، وثبت وتداً 📌.`,
    connectRope: "شد حبلاً (خيط قياس) مستقيماً بين الوتد السفلي والوتد العلوي لتحديد فاصل القطعة.",
    showDivider: (len) => `قم بقياس طول الفاصل الفعلي بالكامل بالشريط للتأكد من مطابقته للحسابات الهندسية: (${len} م).`,
    showShare: (name, area, w, l) => `تم تحديد نصيب الشريك (${name}) بمساحة (${area} م²). متوسط العرض: (${w} م). متوسط الطول: (${l} م).`,
    finalSummary: "✅ <strong>تم تنفيذ التقسيم بنجاح ميدانياً!</strong><br>• تم وضع جميع الأوتاد في مواقعها الهندسية بدقة.<br>• تم تحديد جميع الفواصل وشد الحبال.<br>• أصبحت الأرض جاهزة للتسليم الفعلي للشركاء.",

    // العناوين الفرعية
    titleIntro: "محيط الأرض وأبعادها",
    titleStart: "نقطة انطلاق القياس",
    titleMeasureBottom: "قياس الحد السفلي",
    titleMeasureTop: "قياس الحد العلوي",
    titleRope: "تثبيت الفاصل",
    titleDivider: "طول الفاصل",
    titleShare: "تسليم القطعة",
    titleSummary: "اكتمال التنفيذ الميداني"
  }
};
