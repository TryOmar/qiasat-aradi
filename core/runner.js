/**
 * runner.js — Node.js test runner for AgriUnits
 * يحاكي بيئة المتصفح ويشغّل الاختبارات
 */

// محاكاة window للبيئة Node.js
global.window = {};

// تحميل constants.js
eval(require('fs').readFileSync('./constants.js', 'utf8'));

// تحميل units.js
eval(require('fs').readFileSync('./units.js', 'utf8'));

// تحميل ملف الاختبارات
eval(require('fs').readFileSync('./units.test.js', 'utf8'));

// تشغيل الاختبارات
const allPassed = AgriUnitsTests.runAll();
process.exit(allPassed ? 0 : 1);
