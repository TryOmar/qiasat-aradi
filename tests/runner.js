/**
 * tests/runner.js — Node.js test runner for AgriUnits, DallalToast & DallalStorage
 * يحاكي بيئة المتصفح (DOM & Storage & Window) ويشغّل الاختبارات برمجياً.
 */

// ----------------------------------------------------------
// محاكاة بيئة المتصفح (DOM & Storage Mocking)
// ----------------------------------------------------------
class StorageMock {
  constructor() {
    this.store = {};
  }
  get length() {
    return Object.keys(this.store).length;
  }
  key(index) {
    return Object.keys(this.store)[index] || null;
  }
  getItem(key) {
    return this.store[key] === undefined ? null : this.store[key];
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
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
  sessionStorage: new StorageMock()
};

global.document = {
  head: {
    appendChild(child) {
      this.childNodes.push(child);
      return child;
    },
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
    if (id === "smart-export-css" || id === "dallal-toast-styles") {
      return null;
    }
    const foundInBody = this.body.childNodes.find(c => c.id === id);
    if (foundInBody) return foundInBody;
    return null;
  },
  createElement(tag) {
    const el = mockElement();
    el.tagName = tag.toUpperCase();
    return el;
  }
};

// ربط النطاق العالمي لـ global بـ window
global.window.document = global.document;

// ----------------------------------------------------------
// تحميل ملفات المشروع
// ----------------------------------------------------------
const fs = require('fs');

// تحميل الثوابت والوحدات والتنبيهات والتخزين
eval(fs.readFileSync('../core/constants.js', 'utf8'));
eval(fs.readFileSync('../core/units.js', 'utf8'));
eval(fs.readFileSync('../shared/toast.js', 'utf8'));
eval(fs.readFileSync('../shared/storage.js', 'utf8'));

// تحميل ملفات الاختبارات
eval(fs.readFileSync('./units.test.js', 'utf8'));
eval(fs.readFileSync('./toast.test.js', 'utf8'));
eval(fs.readFileSync('./storage.test.js', 'utf8'));

// ----------------------------------------------------------
// تشغيل الاختبارات
// ----------------------------------------------------------
console.log('==================================================');
console.log('🤖 Starting automated test suite via Node.js Mock');
console.log('==================================================\n');

const unitsPassed = global.window.AgriUnitsTests.runAll();
console.log('\n' + '='.repeat(50) + '\n');
const toastPassed = global.window.DallalToastTests.runAll();
console.log('\n' + '='.repeat(50) + '\n');
const storagePassed = global.window.DallalStorageTests.runAll();

console.log('\n==================================================');
const allPassed = unitsPassed && toastPassed && storagePassed;
if (allPassed) {
  console.log('🎉 ALL TEST SUITES PASSED SUCCESSFULLY!');
  process.exit(0);
} else {
  console.error('❌ SOME TEST SUITES FAILED. PLEASE CHECK DETAILS ABOVE.');
  process.exit(1);
}
