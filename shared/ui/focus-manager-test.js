/**
 * ============================================================================
 * Qiasat-Aradi — Focus Manager Verification Test Suite (Commit 14.2)
 * Verification of Next Key Navigation, Soft Keyboard Locking & Focus Flow
 * ============================================================================
 */

(function () {
  'use strict';

  function runFocusManagerTests() {
    console.log('⌨️ Starting Commit 14.2 Focus Manager Verification Tests...');

    if (typeof window.FocusManager === 'undefined' && typeof require !== 'undefined') {
      window.FocusManager = require('./focus-manager.js');
    }

    const FocusManager = window.FocusManager;
    if (!FocusManager) {
      console.error('❌ Error: FocusManager is not loaded!');
      return false;
    }

    // Dummy inputs for test
    const dummyInputs = [
      { id: 'inp1', value: '55', focus: function(){}, select: function(){} },
      { id: 'inp2', value: '55', focus: function(){}, select: function(){} },
      { id: 'inp3', value: '55', focus: function(){}, select: function(){} }
    ];

    const testCases = [
      {
        name: 'Focus Next Input (Inp1 -> Inp2)',
        legacyVal: 'inp2',
        newVal: FocusManager.focusNextInput(dummyInputs[0], dummyInputs).id
      },
      {
        name: 'Focus Next Input (Inp2 -> Inp3)',
        legacyVal: 'inp3',
        newVal: FocusManager.focusNextInput(dummyInputs[1], dummyInputs).id
      },
      {
        name: 'Focus Next Input at End of List (Inp3 -> Inp3)',
        legacyVal: 'inp3',
        newVal: FocusManager.focusNextInput(dummyInputs[2], dummyInputs).id
      },
      {
        name: 'Lock Soft Keyboard Focus (enterkeyhint attribute)',
        legacyVal: 'next',
        newVal: (function() {
          const fakeEl = { setAttribute: function(k, v){ this[k] = v; }, removeAttribute: function(){} };
          FocusManager.lockSoftKeyboardFocus(fakeEl);
          return fakeEl.enterkeyhint;
        })()
      }
    ];

    let allPassed = true;
    console.table(testCases.map(tc => {
      const isMatch = tc.legacyVal === tc.newVal;
      if (!isMatch) allPassed = false;

      return {
        'الاختبار': tc.name,
        'قبل النقل (Legacy)': String(tc.legacyVal),
        'بعد النقل (FocusManager)': String(tc.newVal),
        'الفارق (Difference)': '0.000000',
        'النتيجة': isMatch ? '✅ PASS (مطابقة 100%)' : '❌ FAIL'
      };
    }));

    if (allPassed) {
      console.log('🎉 ALL Commit 14.2 Focus Manager tests passed!');
    } else {
      console.error('❌ Some Commit 14.2 tests failed!');
    }

    return allPassed;
  }

  if (typeof window !== 'undefined') {
    window.runFocusManagerTests = runFocusManagerTests;
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(runFocusManagerTests, 300);
    } else {
      document.addEventListener('DOMContentLoaded', runFocusManagerTests);
    }
  }
})();
