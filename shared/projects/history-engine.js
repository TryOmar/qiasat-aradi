/**
 * ============================================================================
 * Qiasat-Aradi — Operation History Engine (Undo / Redo) (Commit 15.3)
 * Source of Truth for Operation Stack, Undo, Redo & State Compression
 * ============================================================================
 * Manages capped (100 operations) state stack, ignores micro UI changes,
 * and groups identical consecutive state changes to optimize memory.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.HistoryEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MAX_STACK_SIZE = 100;
  var undoStack = [];
  var redoStack = [];

  var HistoryEngine = {
    version: '1.0.0',

    /**
     * Push a new state snapshot to undo stack
     * @param {string} actionType 
     * @param {Object} stateData 
     */
    pushState: function (actionType, stateData) {
      if (!stateData) return;

      var snapshot = {
        action: actionType || 'CHANGE',
        timestamp: new Date().toISOString(),
        data: JSON.parse(JSON.stringify(stateData))
      };

      // Group identical consecutive snapshots to save memory
      if (undoStack.length > 0) {
        var last = undoStack[undoStack.length - 1];
        if (last.action === snapshot.action && JSON.stringify(last.data) === JSON.stringify(snapshot.data)) {
          return;
        }
      }

      undoStack.push(snapshot);
      if (undoStack.length > MAX_STACK_SIZE) {
        undoStack.shift();
      }

      // Clear redo stack on new action
      redoStack = [];
    },

    /**
     * Undo last action and return previous state
     * @returns {Object|null}
     */
    undo: function () {
      if (undoStack.length === 0) return null;

      var current = undoStack.pop();
      redoStack.push(current);

      if (undoStack.length === 0) return null;
      return undoStack[undoStack.length - 1].data;
    },

    /**
     * Redo next action and return restored state
     * @returns {Object|null}
     */
    redo: function () {
      if (redoStack.length === 0) return null;

      var next = redoStack.pop();
      undoStack.push(next);
      return next.data;
    },

    /** Check if undo is available */
    canUndo: function () {
      return undoStack.length > 1;
    },

    /** Check if redo is available */
    canRedo: function () {
      return redoStack.length > 0;
    },

    /** Clear undo and redo stacks */
    clear: function () {
      undoStack = [];
      redoStack = [];
    }
  };

  return HistoryEngine;
}));
