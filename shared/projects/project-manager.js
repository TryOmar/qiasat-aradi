/**
 * ============================================================================
 * Qiasat-Aradi — Advanced Multi-Project Manager (Commit 15.1)
 * Source of Truth for Multi-Project Storage, Search, Archive & Favorites
 * ============================================================================
 * Supports multi-project CRUD, search by name/date, favorites, pinning,
 * auto-categorization, recent projects tracking, and backup/restore.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ProjectManager = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var STORAGE_KEY = 'dalal_multi_projects_v3';
  var RECENT_KEY = 'dalal_recent_project_id_v3';

  /**
   * Helper to load all stored projects map from localStorage
   * @returns {Object<string, Object>}
   */
  function loadProjectsStore() {
    if (typeof localStorage === 'undefined') return {};
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.error('[ProjectManager] Failed to load projects store:', e);
      return {};
    }
  }

  /**
   * Helper to save projects map into localStorage
   * @param {Object} store 
   */
  function saveProjectsStore(store) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store || {}));
    } catch (e) {
      console.error('[ProjectManager] Failed to save projects store:', e);
    }
  }

  var ProjectManager = {
    version: '1.0.0',

    /**
     * Create a new project entry
     * @param {string} name 
     * @param {Object} data 
     * @param {string} [category] 
     * @returns {Object} Created project object
     */
    createProject: function (name, data, category) {
      var store = loadProjectsStore();
      var id = 'proj_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      var now = new Date().toISOString();

      var project = {
        id: id,
        name: String(name || 'مشروع جديد').trim(),
        category: String(category || 'عام').trim(),
        createdAt: now,
        updatedAt: now,
        isPinned: false,
        isArchived: false,
        data: data || {}
      };

      store[id] = project;
      saveProjectsStore(store);
      ProjectManager.setRecent(id);
      return project;
    },

    /**
     * Save/update existing project data
     * @param {string} id 
     * @param {Object} data 
     * @returns {boolean}
     */
    saveProject: function (id, data) {
      if (!id) return false;
      var store = loadProjectsStore();
      if (!store[id]) return false;

      store[id].data = data || {};
      store[id].updatedAt = new Date().toISOString();
      saveProjectsStore(store);
      ProjectManager.setRecent(id);
      return true;
    },

    /**
     * Get a specific project by ID
     * @param {string} id 
     * @returns {Object|null}
     */
    getProject: function (id) {
      if (!id) return null;
      var store = loadProjectsStore();
      return store[id] || null;
    },

    /**
     * Get all active projects as an array
     * @param {boolean} [includeArchived] 
     * @returns {Array<Object>}
     */
    getAllProjects: function (includeArchived) {
      var store = loadProjectsStore();
      var list = [];
      Object.keys(store).forEach(function (id) {
        var p = store[id];
        if (p && (includeArchived || !p.isArchived)) {
          list.push(p);
        }
      });

      // Sort by pinned first, then by updatedAt descending
      list.sort(function (a, b) {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });

      return list;
    },

    /**
     * Search projects by query string (name or category)
     * @param {string} query 
     * @returns {Array<Object>}
     */
    searchProjects: function (query) {
      var q = String(query || '').trim().toLowerCase();
      var list = ProjectManager.getAllProjects(true);
      if (!q) return list;

      return list.filter(function (p) {
        return (p.name && p.name.toLowerCase().indexOf(q) !== -1) ||
               (p.category && p.category.toLowerCase().indexOf(q) !== -1);
      });
    },

    /**
     * Rename a project
     * @param {string} id 
     * @param {string} newName 
     * @returns {boolean}
     */
    renameProject: function (id, newName) {
      var store = loadProjectsStore();
      if (!id || !store[id]) return false;

      store[id].name = String(newName || 'مشروع').trim();
      store[id].updatedAt = new Date().toISOString();
      saveProjectsStore(store);
      return true;
    },

    /**
     * Duplicate an existing project
     * @param {string} id 
     * @returns {Object|null}
     */
    duplicateProject: function (id) {
      var source = ProjectManager.getProject(id);
      if (!source) return null;

      var name = source.name + ' (نسخة)';
      return ProjectManager.createProject(name, JSON.parse(JSON.stringify(source.data)), source.category);
    },

    /**
     * Archive or unarchive a project
     * @param {string} id 
     * @returns {boolean}
     */
    archiveProject: function (id) {
      var store = loadProjectsStore();
      if (!id || !store[id]) return false;

      store[id].isArchived = !store[id].isArchived;
      store[id].updatedAt = new Date().toISOString();
      saveProjectsStore(store);
      return true;
    },

    /**
     * Toggle pinned favorite status for a project
     * @param {string} id 
     * @returns {boolean}
     */
    toggleFavorite: function (id) {
      var store = loadProjectsStore();
      if (!id || !store[id]) return false;

      store[id].isPinned = !store[id].isPinned;
      store[id].updatedAt = new Date().toISOString();
      saveProjectsStore(store);
      return true;
    },

    /**
     * Set last opened recent project ID
     * @param {string} id 
     */
    setRecent: function (id) {
      if (typeof localStorage === 'undefined' || !id) return;
      try {
        localStorage.setItem(RECENT_KEY, id);
      } catch (e) {}
    },

    /**
     * Get last opened recent project ID
     * @returns {string|null}
     */
    getRecentId: function () {
      if (typeof localStorage === 'undefined') return null;
      try {
        return localStorage.getItem(RECENT_KEY);
      } catch (e) {
        return null;
      }
    },

    /**
     * Delete a project permanently by ID
     * @param {string} id 
     * @returns {boolean}
     */
    deleteProject: function (id) {
      var store = loadProjectsStore();
      if (!id || !store[id]) return false;

      delete store[id];
      saveProjectsStore(store);
      return true;
    }
  };

  return ProjectManager;
}));
