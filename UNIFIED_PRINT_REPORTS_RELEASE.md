# 📄 UNIFIED_PRINT_REPORTS_RELEASE.md
## النسخة المرجعية المستقرة لنظام تقارير الطباعة الموحد (Unified Print Reports v1.0)

- **تاريخ الاعتماد الرسمي:** 20 يوليو 2026
- **حالة النسخة:** Baseline Release (مستقرة ومجربة 100%)
- **المرجع المرجعي الأحادي (Single Source of Truth):** تصميم تقرير الصفحة 11 (`Page11`).

---

## 📁 هيكلية الملفات المعتمدة

### 1. الملفات الجديدة (New Modules)
* [`shared/report-template.js`](file:///f:/برمجة%20تطبيق%20الدلال/qiasat-aradi-master/shared/report-template.js): محرك التقرير الموحد (العرض والطباعة فقط).
* [`shared/report-print.css`](file:///f:/برمجة%20تطبيق%20الدلال/qiasat-aradi-master/shared/report-print.css): أنماط الخطوط والتنسيقات للطباعة و PDF.
* [`shared/adapters/page11-adapter.js`](file:///f:/برمجة%20تطبيق%20الدلال/qiasat-aradi-master/shared/adapters/page11-adapter.js): محول بيانات برنامج تقسيم أرض باختلاف الأطوال.
* [`shared/adapters/page12-adapter.js`](file:///f:/برمجة%20تطبيق%20الدلال/qiasat-aradi-master/shared/adapters/page12-adapter.js): محول بيانات برنامج حساب وتقسيم الأراضي.
* [`shared/adapters/page13-adapter.js`](file:///f:/برمجة%20تطبيق%20الدلال/qiasat-aradi-master/shared/adapters/page13-adapter.js): محول بيانات برنامج رسم وتقسيم الأراضي.

### 2. الملفات المعدلة (Modified Pages)
* `Page11/index.html` & `Page11/script.js`
* `Page12/index.html` & `Page12/script.js`
* `Page13/section1/index.html` & `Page13/section1/script.js`

---

## 🔒 القواعد الحاكمة للمستقبل (Architecture Rules)

1. **حظر الاستثناءات الخاصة:**
   > **يحظر إجراء أي تعديل على `shared/report-template.js` لتلبية احتياجات برنامج واحد فقط.**
   > **في حال احتياج أي برنامج لبيانات إضافية، يتم تعديل محول البيانات (Adapter) الخاص بذلك البرنامج فقط.**

2. **التغييرات المستقبليـة:**
   أي تطوير عام على شكل التقرير يُنفذ أولاً في **Page11**، ثم يُحدث القالب الموحد لتستفيد منه باقي البرامج تلقائياً.

---

## 🧪 إجراءات اختبار وسير العمل التفتيشي (Testing Procedure)

1. **اختبار التقرير الموحد:**
   - فتح `Page11` والضغط على زر (🖨️ طباعة التقرير).
   - فتح `Page12` والضغط على زر (🖨️ طباعة).
   - فتح `Page13/section1` والضغط على زر (🖨️ طباعة).
2. **التحقق البصري:**
   - مطابقة الترويسة، جدول أبعاد الموقع، بطاقات الشركاء، الإجماليات، والملاحظات بالتقرير المطبوع.
   - التأكد من قراءة الأبعاد الحية واستخدام الرمز `—` للقيم غير المحددة.
   - التأكد من عدم قص البطاقات بين الصفحات بفضل `page-break-inside: avoid`.
