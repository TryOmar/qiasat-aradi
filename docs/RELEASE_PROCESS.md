# سياسة ودورة إدارة الإصدارات (RELEASE_PROCESS) 🚀

**Document:** RELEASE_PROCESS.md
**Version:** 1.0
**Status:** Approved ✅
**Applies From:** Commit 13.0
**Last Updated:** 2026-07-21

---

## 🔄 مخطط دورة حياة التطوير والإنتاج (Release Lifecycle Pipeline)

```text
Feature Development
        │
        ▼
Architecture Review
        │
        ▼
Code Review
        │
        ▼
Smoke Test
        │
        ▼
Regression Test
        │
        ▼
User Acceptance Test (UAT)
        │
        ▼
Release Candidate (RC)
        │
        ▼
Git Tag
        │
        ▼
GitHub Release
        │
        ▼
Production
```

---

## 🔖 1. سياسة إدارة ترقيم الإصدارات (Semantic Versioning)

```text
v2.2.x   ──►   Maintenance & Fixes (إصدارات الصيانة واستقرار Commit 12.0)
v2.3.x   ──►   Architecture Refactoring (إصدارات البنية المعمارية والمحركات - Commit 13.x)
v2.4.x   ──►   New Features (إصدارات الميزات والتحسينات الجديدة)
v3.0.0   ──►   Major Rewrite (إعادة الهيكلة الشاملة للنظام بأكمله)
```

---

## 🌿 2. هيكل الفروع وقواعد الدمج (Git Flow Pipeline)

```text
feature/* ──► develop ──► release/v2.3.0 ──► master
```

### 🛑 قواعد الفروع الصارمة:
1. **حظر الدمج المباشر إلى `master`:** يُمنع تماماً الرفع أو الدمج المباشر إلى الفرع الرئيسي `master` إلا بعد خروج الكود من فرع `release/*` معتمد.
2. **مركزية `develop`:** جميع أعمال التطوير وإعادة الهيكلة تمر عبر أفرع الميزات `feature/*` وتدمج إلى `develop`.
3. **أفرع الإصدارات `release/*`:** يُنشأ فرع إصدار مخصص لكل قفزة معمارية، وتُجرى عليه اختبارات UAT النهائية.
4. **ربط الـ Tags بـ `master`:** لا يُنشأ أي وسم Tag رسمي (مثل `v2.3.0`) إلا بعد الدمج النهائي في `master` واجتياز كافة الفحوص.

---

## 🚦 3. بوابات الاعتماد للنشر (Release Gate)

لا يُسمح بتنفيذ `git push origin master` أو نشر إصدار إلا بعد:
1. اجتياز كافة مراحلPipeline المنظمة أعلاه.
2. نجاح اختبارات **UAT**.
3. صدور موافقة صريحة من المستخدم المرجعي.
4. التثبت من خلو الكود من أخطاء الـ Console والأخطاء الحرجة.
5. تحديث مستند `CHANGELOG.md`.
