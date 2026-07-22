/**
 * ============================================================================
 * Qiasat-Aradi — Project Reliability & Auto-Save Engine (Commit 15.4.5)
 * Source of Truth for Auto-Save, Crash Recovery & Data Integrity Validation
 * ============================================================================
 * Guarantees automatic data preservation, crash recovery snapshots, and
 * backwards-compatible version migration before export/import operations.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ReliabilityEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SNAPSHOT_KEY = 'dalal_crash_recovery_snapshot_v3';
  var autoSaveTimer = null;

  var ReliabilityEngine = {
    version: '1.0.0',

    /**
     * Validate project data integrity & structure
     * @param {Object} data 
     * @returns {{ok: boolean, message: string}}
     */
    validateDataIntegrity: function (data) {
      if (!data || typeof data !== 'object') {
        return { ok: false, message: 'بيانات المشروع غير متاحة أو تالفة' };
      }

      if (typeof data.totalArea !== 'undefined' && (isNaN(parseFloat(data.totalArea)) || parseFloat(data.totalArea) < 0)) {
        return { ok: false, message: 'قيمة المساحة الكلية غير صحيحة' };
      }

      return { ok: true, message: 'بيانات المشروع خالية من الأخطاء' };
    },

    /**
     * Migrate old version data to current v3 structure
     * @param {Object} oldData 
     * @returns {Object} Migrated data
     */
    migrateVersionData: function (oldData) {
      if (!oldData || typeof oldData !== 'object') return {};

      var migrated = JSON.parse(JSON.stringify(oldData));
      migrated.schemaVersion = 3;

      if (!migrated.caratSize) {
        migrated.caratSize = 175.035;
      }

      if (!Array.isArray(migrated.heirsData)) {
        migrated.heirsData = [];
      }

      return migrated;
    },

    /**
     * Create immediate crash recovery snapshot in localStorage
     * @param {Object} data 
     * @returns {boolean}
     */
    createCrashRecoverySnapshot: function (data) {
      if (typeof localStorage === 'undefined' || !data) return false;
      try {
        var payload = {
          timestamp: new Date().toISOString(),
          data: data
        };
        localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(payload));
        return true;
      } catch (e) {
        console.error('[ReliabilityEngine] Failed to create crash snapshot:', e);
        return false;
      }
    },

    /**
     * Get crash recovery snapshot if available
     * @returns {Object|null}
     */
    getCrashRecoverySnapshot: function () {
      if (typeof localStorage === 'undefined') return null;
      try {
        var raw = localStorage.getItem(SNAPSHOT_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    /**
     * Clear crash recovery snapshot after successful save or recovery
     */
    clearCrashRecoverySnapshot: function () {
      if (typeof localStorage === 'undefined') return;
      try {
        localStorage.removeItem(SNAPSHOT_KEY);
      } catch (e) {}
    },

    /**
     * Enable continuous Auto-Save interval
     * @param {Function} getDataFn - Function returning current project data
     * @param {Function} saveCallback - Function receiving (data) to persist
     * @param {number} [intervalMs] - Default 5000ms (5 seconds)
     */
    enableAutoSave: function (getDataFn, saveCallback, intervalMs) {
      if (typeof getDataFn !== 'function' || typeof saveCallback !== 'function') return;

      var ms = typeof intervalMs === 'number' ? intervalMs : 5000;
      ReliabilityEngine.disableAutoSave();

      autoSaveTimer = setInterval(function () {
        try {
          var data = getDataFn();
          if (data && ReliabilityEngine.validateDataIntegrity(data).ok) {
            saveCallback(data);
            ReliabilityEngine.createCrashRecoverySnapshot(data);
          }
        } catch (e) {
          console.error('[ReliabilityEngine] Auto-Save error:', e);
        }
      }, ms);
    },

    /**
     * Disable Auto-Save interval
     */
    disableAutoSave: function () {
      if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
        autoSaveTimer = null;
      }
    }
  };

  return ReliabilityEngine;
}));
