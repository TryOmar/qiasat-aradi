/**
 * ============================================================================
 * Qiasat-Aradi — Modal & Inspector Manager (Commit 14.3)
 * Source of Truth for Dialogs, Modals, Bottom Sheets & Partner Inspector
 * ============================================================================
 * Unifies popup management, backdrop click handling, Escape key listener,
 * and inspector overlay updates without changing existing CSS styles.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    var res = factory();
    root.ModalManager = res.ModalManager;
    root.InspectorManager = res.InspectorManager;
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var activeModals = {};
  var currentInspectorData = null;

  var ModalManager = {
    version: '1.0.0',

    /**
     * Open modal dialog or bottom sheet by ID
     * @param {string} modalId 
     * @param {Object} [options] 
     * @returns {boolean}
     */
    open: function (modalId, options) {
      if (typeof document === 'undefined') return false;
      var modalEl = document.getElementById(modalId);
      if (!modalEl) return false;

      modalEl.style.display = 'block';
      modalEl.setAttribute('aria-hidden', 'false');
      activeModals[modalId] = true;

      // Focus first input or close button inside modal
      try {
        var focusable = modalEl.querySelector('input, button, select, [tabindex="0"]');
        if (focusable && typeof focusable.focus === 'function') {
          focusable.focus();
        }
      } catch (e) {}

      return true;
    },

    /**
     * Close modal dialog or bottom sheet by ID
     * @param {string} modalId 
     * @returns {boolean}
     */
    close: function (modalId) {
      if (typeof document === 'undefined') return false;
      var modalEl = document.getElementById(modalId);
      if (!modalEl) return false;

      modalEl.style.display = 'none';
      modalEl.setAttribute('aria-hidden', 'true');
      delete activeModals[modalId];
      return true;
    },

    /**
     * Close all active modals
     */
    closeAll: function () {
      Object.keys(activeModals).forEach(function (id) {
        ModalManager.close(id);
      });
      activeModals = {};
    },

    /**
     * Toggle modal open/close state
     * @param {string} modalId 
     * @returns {boolean}
     */
    toggle: function (modalId) {
      if (activeModals[modalId]) {
        return !ModalManager.close(modalId);
      }
      return ModalManager.open(modalId);
    }
  };

  var InspectorManager = {
    version: '1.0.0',

    /**
     * Show Partner Inspector Overlay
     * @param {Object} data - Partner details {name, feddans, carats, shares, area, ratio}
     * @param {string} [inspectorId] - Default 'croquis-inspector'
     * @returns {boolean}
     */
    show: function (data, inspectorId) {
      if (typeof document === 'undefined' || !data) return false;
      var id = inspectorId || 'croquis-inspector';
      var el = document.getElementById(id);
      if (!el) return false;

      currentInspectorData = data;
      el.style.display = 'block';

      // Update inner content safely
      var nameEl = el.querySelector('.inspector-name') || document.getElementById('inspector-partner-name');
      var areaEl = el.querySelector('.inspector-area') || document.getElementById('inspector-partner-area');

      if (nameEl && data.name) nameEl.textContent = data.name;
      if (areaEl && data.area) areaEl.textContent = typeof data.area === 'number' ? data.area.toFixed(2) + ' م²' : data.area;

      return true;
    },

    /**
     * Update active inspector data
     * @param {Object} data 
     * @returns {boolean}
     */
    update: function (data) {
      if (!data) return false;
      return InspectorManager.show(data);
    },

    /**
     * Hide active partner inspector overlay
     * @param {string} [inspectorId] 
     * @returns {boolean}
     */
    hide: function (inspectorId) {
      if (typeof document === 'undefined') return false;
      var id = inspectorId || 'croquis-inspector';
      var el = document.getElementById(id);
      if (!el) return false;

      el.style.display = 'none';
      currentInspectorData = null;
      return true;
    },

    /**
     * Get current inspector data
     * @returns {Object|null}
     */
    getData: function () {
      return currentInspectorData;
    }
  };

  // Setup Global Keyboard Listener (Escape key closes modals & inspector)
  if (typeof document !== 'undefined') {
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        ModalManager.closeAll();
        InspectorManager.hide();
      }
    });
  }

  return {
    ModalManager: ModalManager,
    InspectorManager: InspectorManager
  };
}));
