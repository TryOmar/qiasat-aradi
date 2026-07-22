/**
 * ============================================================================
 * Qiasat-Aradi — Accessibility Engine (Commit 14.3.5)
 * Source of Truth for ARIA Attributes, Keyboard Traps & Touch Target Helpers
 * ============================================================================
 * Enhances usability and screen-reader accessibility without changing visual design.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Accessibility = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var Accessibility = {
    version: '1.0.0',

    /**
     * Enhance modal dialog elements with proper ARIA attributes & role
     * @param {HTMLElement} modalEl 
     * @param {string} [title] 
     */
    enhanceModalARIA: function (modalEl, title) {
      if (!modalEl) return;
      modalEl.setAttribute('role', 'dialog');
      modalEl.setAttribute('aria-modal', 'true');
      if (title) {
        modalEl.setAttribute('aria-label', title);
      }
    },

    /**
     * Ensure touch targets meet recommended minimum 44px x 44px bounds for mobile accessibility
     * @param {HTMLElement} buttonEl 
     * @returns {boolean}
     */
    ensureTouchTargetSize: function (buttonEl) {
      if (!buttonEl || typeof buttonEl.getBoundingClientRect !== 'function') return false;
      var rect = buttonEl.getBoundingClientRect();
      var minSize = 44;
      return rect.width >= minSize && rect.height >= minSize;
    },

    /**
     * Trap Tab keyboard focus within container
     * @param {KeyboardEvent} event 
     * @param {HTMLElement} container 
     */
    handleTabFocusTrap: function (event, container) {
      if (!event || !container || event.key !== 'Tab') return;
      var focusables = Array.from(container.querySelectorAll('button, input, select, textarea, [tabindex="0"]'))
        .filter(function (el) { return !el.disabled && el.offsetHeight > 0; });

      if (focusables.length === 0) return;

      var first = focusables[0];
      var last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  return Accessibility;
}));
