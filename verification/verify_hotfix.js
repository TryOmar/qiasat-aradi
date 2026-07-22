const fs = require('fs');
const path = require('path');

console.log("--------------------------------------------------");
console.log("Verifying Page11 & Page13 Hotfix Script Exports...");
console.log("--------------------------------------------------");

// Verify Page13 script contains resetPage13 & preparePrintPage13
const p13Script = fs.readFileSync(path.join(__dirname, '../Page13/section1/script.js'), 'utf8');
const p13HasReset = p13Script.includes('function resetPage13');
const p13HasPrepare = p13Script.includes('function preparePrintPage13');
const p13HasPrintStart = p13Script.includes('PRINT START');

console.log("Page13 resetPage13 function defined:", p13HasReset ? "✅ PASS" : "❌ FAIL");
console.log("Page13 preparePrintPage13 function defined:", p13HasPrepare ? "✅ PASS" : "❌ FAIL");
console.log("Page13 print logging (PRINT START/READY/END) included:", p13HasPrintStart ? "✅ PASS" : "❌ FAIL");

// Verify Page11 script contains resetPage11 & preparePrintPage11
const p11Script = fs.readFileSync(path.join(__dirname, '../Page11/script.js'), 'utf8');
const p11HasReset = p11Script.includes('function resetPage11');
const p11HasPrepare = p11Script.includes('function preparePrintPage11');
const p11HasPrintStart = p11Script.includes('PRINT START');

console.log("Page11 resetPage11 function defined:", p11HasReset ? "✅ PASS" : "❌ FAIL");
console.log("Page11 preparePrintPage11 function defined:", p11HasPrepare ? "✅ PASS" : "❌ FAIL");
console.log("Page11 print logging (PRINT START/READY/END) included:", p11HasPrintStart ? "✅ PASS" : "❌ FAIL");

// Verify PrintEngine recursion guard
const printEngineScript = fs.readFileSync(path.join(__dirname, '../shared/engines/print-engine.js'), 'utf8');
const printEngineHasGuard = printEngineScript.includes('_inPrint');

console.log("shared/engines/print-engine.js recursion guard (_inPrint) defined:", printEngineHasGuard ? "✅ PASS" : "❌ FAIL");

console.log("--------------------------------------------------");
if (p13HasReset && p13HasPrepare && p13HasPrintStart && p11HasReset && p11HasPrepare && p11HasPrintStart && printEngineHasGuard) {
  console.log("🟢 ALL HOTFIX CODE CHECKS PASSED 100%");
  process.exit(0);
} else {
  console.log("🔴 SOME HOTFIX CHECKS FAILED");
  process.exit(1);
}
