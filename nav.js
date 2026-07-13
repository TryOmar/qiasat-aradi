// resize event listener to detect change in screen height
let input = document.querySelector("input");
let nav = document.querySelector(".nav");

let mainViewPort;

window.addEventListener("load", () => {
  mainViewPort = screen.height;
});

// توجيه زر "كسور" إلى صفحة التدريب المركزية الموحدة في Page1/section1/help2/index.html
function setupFractionsRedirect() {
  document.querySelectorAll(".nav-box").forEach(el => {
    const p = el.querySelector("p");
    if (p && (p.textContent.trim() === "كسور" || p.textContent.trim() === "الكسور")) {
      // حساب المسار النسبي بشكل ذكي للوصول إلى Page1/section1/help2/index.html
      const segments = window.location.pathname.split("/");
      // البحث عن المجلد الرئيسي للتطبيق qiasat-aradi-master (غير حساس لحالة الأحرف)
      const rootIdx = segments.findIndex(seg => seg.toLowerCase() === "qiasat-aradi-master");
      if (rootIdx !== -1) {
        const levelsUp = segments.length - 1 - rootIdx;
        let relPath = "";
        for (let i = 1; i < levelsUp; i++) {
          relPath += "../";
        }
        el.href = relPath + "Page1/section1/help2/index.html";
      } else {
        // إذا لم نجد المجلد بالاسم الافتراضي، نعتمد على كشف مجلدات PageX
        const pageIdx = segments.findIndex(seg => seg.toLowerCase().startsWith("page"));
        if (pageIdx !== -1) {
          const levelsUp = segments.length - 1 - pageIdx;
          let relPath = "../";
          for (let i = 1; i < levelsUp; i++) {
            relPath += "../";
          }
          el.href = relPath + "Page1/section1/help2/index.html";
        }
      }
    }
  });
}

// تشغيل التوجيه مباشرة وعند انتهاء التحميل لضمان الربط الكامل
setupFractionsRedirect();
window.addEventListener("DOMContentLoaded", setupFractionsRedirect);
window.addEventListener("load", setupFractionsRedirect);
