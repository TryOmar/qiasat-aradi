/**
 * tests/integration/compatibility.js
 * ===================================
 * Compatibility Cleanup Test: Verifies that page-level legacy functions are deleted
 * and do not exist inside the page scripts anymore.
 */

(function (global) {
  "use strict";

  global.DallalIntegrationSuite = global.DallalIntegrationSuite || {};

  global.DallalIntegrationSuite.compatibility = {
    name: "Compatibility Cleanup & Legacy Deletion Verification",
    run(assert) {
      // 0. Verify the replacement AgriUnitsCompat exists and works
      assert("AgriUnitsCompat layer is defined", typeof AgriUnitsCompat !== "undefined");
      if (typeof AgriUnitsCompat !== "undefined") {
        assert("AgriUnitsCompat is an object", typeof AgriUnitsCompat === "object");
        const testFcs = AgriUnitsCompat.sqmToFCS(1000, 168);
        assert("AgriUnitsCompat.sqmToFCS runs and converts successfully", testFcs && typeof testFcs.feddan === "number");
      }

      // 1. list of functions that must be deleted
      const forbiddenPage11 = [
        "function legacyToQasabaAndQabda",
        "function legacyFromQasabaToMeters",
        "function legacyConvertSquareMetersToFCS",
        "function legacyNormalizeFCS"
      ];

      const forbiddenPage12 = [
        "function legacySqmToFeddanCaratShares"
      ];

      const forbiddenPage13 = [
        "function legacyConvertSqmToFeddans",
        "function legacyToQasabaAndQabda",
        "function legacyFromQasabaToMeters",
        "function legacyNormalizeQasabaQabda"
      ];

      // 2. Read file content depending on environment
      let isNode = typeof process !== "undefined" && process.versions && process.versions.node;
      
      function checkContent(fileContent, forbiddenList, label) {
        forbiddenList.forEach(fn => {
          const exists = fileContent.includes(fn);
          assert(`${label} does not contain legacy function: "${fn}"`, !exists);
        });
      }

      if (isNode) {
        try {
          const fs = require('fs');
          const path = require('path');
          
          const p11Content = fs.readFileSync(path.resolve(__dirname, '../../Page11/script.js'), 'utf8');
          const p12Content = fs.readFileSync(path.resolve(__dirname, '../../Page12/script.js'), 'utf8');
          const p13Content = fs.readFileSync(path.resolve(__dirname, '../../Page13/section1/script.js'), 'utf8');

          checkContent(p11Content, forbiddenPage11, "Page11/script.js");
          checkContent(p12Content, forbiddenPage12, "Page12/script.js");
          checkContent(p13Content, forbiddenPage13, "Page13/section1/script.js");

        } catch (e) {
          assert("Read file content on Node failed: " + e.message, false);
        }
      } else {
        // In the browser, we use synchronous XMLHttpRequest for local scripts
        function readFileSyncBrowser(url) {
          const xhr = new XMLHttpRequest();
          xhr.open("GET", url, false); // synchronous XHR
          xhr.send(null);
          if (xhr.status === 200 || xhr.status === 0) {
            return xhr.responseText;
          }
          throw new Error("XHR failed for " + url + " with status: " + xhr.status);
        }

        try {
          const p11Content = readFileSyncBrowser("../../Page11/script.js");
          const p12Content = readFileSyncBrowser("../../Page12/script.js");
          const p13Content = readFileSyncBrowser("../../Page13/section1/script.js");

          checkContent(p11Content, forbiddenPage11, "Page11/script.js");
          checkContent(p12Content, forbiddenPage12, "Page12/script.js");
          checkContent(p13Content, forbiddenPage13, "Page13/section1/script.js");
        } catch (e) {
          assert("Read file content in browser failed: " + e.message, false);
        }
      }
    }
  };

})(typeof window !== "undefined" ? window : global);
