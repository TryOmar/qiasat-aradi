/**
 * ============================================================================
 * Qiasat-Aradi — Focus & Keyboard Manager (Commit 14.2)
 * Source of Truth for Seamless Mobile Soft Keyboard & Next Key Navigation
 * ============================================================================
 * Manages virtual soft keyboard persistence (Gboard/iOS), Capture-phase event
 * traps, automatic text selection (.select()), and microtask focus locking.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FocusManager = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var FocusManager = {
    version: '1.0.0',

    /**
     * Safely focus and select text inside an input element with microtask locking
     * @param {HTMLInputElement} targetInput 
     */
    selectAndFocus: function (targetInput) {
      if (!targetInput || typeof targetInput.focus !== 'function') return;

      var doFocus = function () {
        try {
          targetInput.focus();
          if (typeof targetInput.scrollIntoView === 'function') {
            targetInput.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
          if (typeof targetInput.select === 'function') {
            targetInput.select();
          }
          if (typeof targetInput.setSelectionRange === 'function' && targetInput.value) {
            targetInput.setSelectionRange(0, targetInput.value.length);
          }
        } catch (e) {}
      };

      doFocus();
      setTimeout(doFocus, 30);
      setTimeout(doFocus, 120);
    },

    /**
     * Move focus to the next input in sequence without collapsing mobile soft keyboard
     * @param {HTMLInputElement} currentInput 
     * @param {Array<HTMLInputElement>} inputsList 
     * @returns {HTMLInputElement} The target input focused
     */
    focusNextInput: function (currentInput, inputsList) {
      if (!Array.isArray(inputsList) || inputsList.length === 0) return currentInput;

      // Trigger change and input events on current element
      if (currentInput) {
        try {
          currentInput.dispatchEvent(new Event('input', { bubbles: true }));
          currentInput.dispatchEvent(new Event('change', { bubbles: true }));
        } catch (e) {}
      }

      var idx = inputsList.indexOf(currentInput);
      var targetInput = (idx > -1 && idx < inputsList.length - 1) ? inputsList[idx + 1] : currentInput;

      FocusManager.selectAndFocus(targetInput);
      return targetInput;
    },

    /**
     * Set up capture-phase listener for Enter/Next mobile keyboard events
     * @param {Function} getInputsFn - Function returning ordered array of HTMLInputElements
     * @returns {Function} Detach listener function
     */
    setupDimensionInputsNavigation: function (getInputsFn) {
      if (typeof document === 'undefined') return function () {};

      var handleNextEvent = function (e) {
        var activeEl = document.activeElement;
        if (!activeEl || activeEl.tagName !== 'INPUT' || activeEl.readOnly || activeEl.disabled) return;

        var inputsList = typeof getInputsFn === 'function' ? getInputsFn() : [];
        if (!inputsList.includes(activeEl)) return;

        var isNextTrigger = false;
        if (e.type === 'keydown') {
          isNextTrigger = e.key === 'Enter' || e.key === 'Next' || e.key === 'Done' ||
                          e.keyCode === 13 || e.keyCode === 10 || e.code === 'Enter';
        } else if (e.type === 'beforeinput') {
          isNextTrigger = e.inputType === 'insertLineBreak' || e.data === '\n';
        }

        if (isNextTrigger) {
          e.preventDefault();
          if (e.stopPropagation) e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          FocusManager.focusNextInput(activeEl, inputsList);
        }
      };

      document.addEventListener('keydown', handleNextEvent, true);
      document.addEventListener('beforeinput', handleNextEvent, true);

      return function detach() {
        document.removeEventListener('keydown', handleNextEvent, true);
        document.removeEventListener('beforeinput', handleNextEvent, true);
      };
    },

    /**
     * Lock soft keyboard focus onto target element to prevent OS collapse
     * @param {HTMLInputElement} input 
     */
    lockSoftKeyboardFocus: function (input) {
      if (input) {
        input.setAttribute('enterkeyhint', 'next');
        input.removeAttribute('onkeydown'); // Remove any inline blur calls
      }
    }
  };

  return FocusManager;
}));
