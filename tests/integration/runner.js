/**
 * tests/integration/runner.js
 * ===========================
 * Node.js test runner for Dallal Integration & Regression Suite
 * يحاكي بيئة المتصفح ويشغل كافة اختبارات التكامل برمجياً.
 */

// 1. محاكاة بيئة المتصفح (Mocks)
class StorageMock {
  constructor() { this.store = {}; }
  get length() { return Object.keys(this.store).length; }
  key(index) { return Object.keys(this.store)[index] || null; }
  getItem(key) { return this.store[key] === undefined ? null : this.store[key]; }
  setItem(key, value) { this.store[key] = String(value); }
  removeItem(key) { delete this.store[key]; }
  clear() { this.store = {}; }
}

const mockElement = () => ({
  style: {},
  classList: {
    classes: new Set(),
    add(cls) { this.classes.add(cls); },
    remove(cls) { this.classes.delete(cls); },
    contains(cls) { return this.classes.has(cls); }
  },
  appendChild(child) {
    this.childNodes.push(child);
    child.parentElement = this;
    return child;
  },
  removeChild(child) {
    this.childNodes = this.childNodes.filter(c => c !== child);
    child.parentElement = null;
    return child;
  },
  remove() {
    if (this.parentElement) {
      this.parentElement.removeChild(this);
    }
  },
  addEventListener(event, callback) {
    this.listeners[event] = this.listeners[event] || [];
    this.listeners[event].push(callback);
  },
  querySelector(selector) {
    if (selector === ".dallal-toast-close") {
      return this.closeBtn;
    }
    return null;
  },
  childNodes: [],
  listeners: {},
  closeBtn: {
    addEventListener(event, callback) {
      this.listeners[event] = this.listeners[event] || [];
      this.listeners[event].push(callback);
    },
    listeners: {}
  }
});

global.window = {
  localStorage: new StorageMock(),
  sessionStorage: new StorageMock(),
  DALLAL_DEBUG: true // تمكين وضع الديباغ لتفعيل خطأ غياب المكتبات
};

global.document = {
  head: {
    appendChild(child) { this.childNodes.push(child); return child; },
    childNodes: []
  },
  body: {
    appendChild(child) {
      this.childNodes.push(child);
      child.parentElement = this;
      return child;
    },
    removeChild(child) {
      this.childNodes = this.childNodes.filter(c => c !== child);
      child.parentElement = null;
      return child;
    },
    childNodes: []
  },
  getElementById(id) {
    if (id === "dallal-toast-styles") return null;
    return null;
  },
  createElement(tag) {
    const el = mockElement();
    el.tagName = tag.toUpperCase();
    return el;
  }
};

global.window.document = global.document;

// 2. تحميل ملفات المشروع
const fs = require('fs');
const path = require('path');

// دوال مساعدة لحل المسارات
const loadRelativeFile = (relPath) => {
  const absolutePath = path.resolve(__dirname, relPath);
  const content = fs.readFileSync(absolutePath, 'utf8');
  eval(content);
};

// تحميل النواة والخدمات والتوافقية
loadRelativeFile('../../core/constants.js');
loadRelativeFile('../../core/units.js');
loadRelativeFile('../../shared/toast.js');
loadRelativeFile('../../shared/storage.js');
loadRelativeFile('../../shared/agri-units-compat.js');

// تحميل سكريبتات اختبارات التكامل
global.DallalIntegrationSuite = {};
loadRelativeFile('./storage.js');
loadRelativeFile('./toast.js');
loadRelativeFile('./page11.js');
loadRelativeFile('./page12.js');
loadRelativeFile('./page13.js');
loadRelativeFile('./loader.js');
loadRelativeFile('./compatibility.js');

// 3. تشغيل لوحة الاختبارات
console.log('==================================================');
console.log('🤖 Running Dallal Integration Regression Suite (Node)');
console.log('==================================================\n');

let totalPassed = 0;
let totalFailed = 0;
let totalCount = 0;

const suites = global.DallalIntegrationSuite;
const suiteKeys = Object.keys(suites);

suiteKeys.forEach(key => {
  const suite = suites[key];
  console.log(`\n📦 Executing: ${suite.name}`);
  console.log('─'.repeat(40));

  const assertFn = (name, condition, details = "") => {
    totalCount++;
    if (condition) {
      totalPassed++;
      console.log(`  ✅ [PASS] ${name}`);
    } else {
      totalFailed++;
      console.error(`  ❌ [FAIL] ${name} ${details ? `(${details})` : ''}`);
    }
  };

  try {
    suite.run(assertFn);
  } catch (err) {
    totalCount++;
    totalFailed++;
    console.error(`  💥 Suite exploded with error: ${err.message}\n${err.stack}`);
  }
});

console.log('\n==================================================');
console.log(`🏁 Done! Passed: ${totalPassed} | Failed: ${totalFailed} | Total: ${totalCount}`);
console.log('==================================================');

if (totalFailed === 0) {
  console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
} else {
  console.error('❌ SOME INTEGRATION TESTS FAILED.');
  process.exit(1);
}
