// AUD-002A — 6 Mathematical Regression Categories
// Called via CDP Runtime.evaluate from PowerShell

(function() {
  var G = window.Geometry;
  var U = window.Units;
  var P = window.Partition;
  var V = window.Validation;
  var EPSILON = 1e-9;

  function approx(a, b, eps) { return Math.abs(a - b) < (eps || EPSILON); }
  function test(name, expected, got, eps) {
    var diff = (typeof expected === 'number' && typeof got === 'number') ? Math.abs(expected - got) : 0;
    var pass = (typeof expected === 'number') ? diff < (eps || EPSILON) : String(expected) === String(got);
    return { name: name, expected: expected, got: got, diff: parseFloat(diff.toFixed(12)), pass: pass };
  }

  // ---- Category 1: Geometry ----
  var geo = [];
  if (!G) {
    geo.push({ name: 'LOAD_CHECK', pass: false, error: 'Geometry not loaded' });
  } else {
    geo.push(test('Rectangle 30x50', 1500, G.calculateRectangleArea(30, 50)));
    geo.push(test('Rectangle 0.5x0.5', 0.25, G.calculateRectangleArea(0.5, 0.5)));
    geo.push(test('Square 40', 1600, G.calculateSquareArea(40)));
    geo.push(test('Square 0.001', 0.000001, G.calculateSquareArea(0.001)));
    geo.push(test('Trapezoid 40,60,30,30', 1500, G.calculateTrapezoidArea(40, 60, 30, 30)));
    geo.push(test('Trapezoid 100,200,50,50', 7500, G.calculateTrapezoidArea(100, 200, 50, 50))); // (100+200)/2 * (50+50)/2 = 150*50 = 7500
    geo.push(test('Heron 30,40,50', 600, G.calculateHeronArea(30, 40, 50)));
    geo.push(test('Heron 3,4,5', 6, G.calculateHeronArea(3, 4, 5)));
    geo.push(test('Shoelace rectangle', 1500, G.calculateShoelaceArea([{x:0,y:0},{x:50,y:0},{x:50,y:30},{x:0,y:30}])));
    geo.push(test('Shoelace irregular', 40, G.calculateShoelaceArea([{x:0,y:0},{x:10,y:0},{x:8,y:5},{x:2,y:5}])));
    geo.push(test('AvgWidth 45.5,55.5', 50.5, G.calculateAverageWidth(45.5, 55.5)));
    geo.push(test('AvgLength 32.25,28.75', 30.5, G.calculateAverageLength(32.25, 28.75)));
    geo.push(test('EdgeCase: zero width', 0, G.calculateRectangleArea(0, 50)));
    geo.push(test('EdgeCase: zero input shoelace', 0, G.calculateShoelaceArea([])));
    geo.push(test('Heron degenerate (0,0,0)', 0, G.calculateHeronArea(0, 0, 0)));
    geo.push(test('Heron invalid (1,2,10)', 0, G.calculateHeronArea(1, 2, 10)));
  }

  // ---- Category 2: Units Round-Trip ----
  var units = [];
  if (!U) {
    units.push({ name: 'LOAD_CHECK', pass: false, error: 'Units not loaded' });
  } else {
    var caratSize = 175.035;
    var r1 = U.convertSqmToFeddans(5251.05, caratSize);
    var tc = 5251.05 / caratSize;
    var f1 = Math.floor(tc / 24), c1 = Math.floor(tc - f1 * 24);
    units.push({ name: 'SqmToFeddans 5251.05', expected: f1 + ',' + c1, got: r1.feddans + ',' + r1.carats, diff: 0, pass: r1.feddans === f1 && r1.carats === c1 });

    var back = U.convertFeddansToSqm(1, 6, 0, caratSize);
    var exp2 = (1 * 24 + 6) * caratSize;
    units.push(test('FeddansToSqm 1f6c round-trip', exp2, back));

    var testSqm = 3500.7;
    var r2 = U.convertSqmToFeddans(testSqm, caratSize);
    var backSqm = U.convertFeddansToSqm(r2.feddans, r2.carats, r2.shares, caratSize);
    units.push(test('Round-trip 3500.7 sqm', testSqm, backSqm, 0.0001));

    units.push(test('parseFraction 1/4', 0.25, U.parseFraction('1/4')));
    units.push(test('parseFraction 3/8', 0.375, U.parseFraction('3/8')));
    units.push(test('parseFraction 0', 0, U.parseFraction('0')));
    units.push(test('Qasaba 10 to meters', 35.5, U.convertQasabaToMeters(10)));
    units.push(test('Meters 35.5 to Qasaba', 10, U.convertMetersToQasabas(35.5)));
    var pctVal = U.calculatePercentages(437.5875, 1750.35);
    var pctExp = (437.5875 / 1750.35) * 100;
    units.push(test('Percentage 437.5875/1750.35', pctExp, pctVal));
  }

  // ---- Category 3: Partition ----
  var part = [];
  if (!P) {
    part.push({ name: 'LOAD_CHECK', pass: false, error: 'Partition not loaded' });
  } else {
    var configs = [
      { name: 'Rect 1500 2p', totalArea: 1500, count: 2 },
      { name: 'Sq 1600 3p', totalArea: 1600, count: 3 },
      { name: 'Trap 1500 10p', totalArea: 1500, count: 10 },
      { name: 'Large 10000 50p', totalArea: 10000, count: 50 },
      { name: 'Huge 250000 100p', totalArea: 250000, count: 100 }
    ];
    configs.forEach(function(cfg) {
      var share = P.calculateEqualShare(cfg.totalArea, cfg.count);
      var sum = share * cfg.count;
      part.push(test('EqualShare sum ' + cfg.name, cfg.totalArea, sum, 1e-6));
    });
    var pw = P.calculatePieceWidths(100, 100, 500, 1000);
    part.push(test('PieceWidths ratio', 0.5, pw.ratio));
    part.push(test('PieceWidths topW', 50, pw.topW));
    part.push(test('InterpLength t=0', 30, P.calculateInterpolatedLength(30, 50, 0)));
    part.push(test('InterpLength t=1', 50, P.calculateInterpolatedLength(30, 50, 1)));
    part.push(test('InterpLength t=0.5', 40, P.calculateInterpolatedLength(30, 50, 0.5)));
    var rb = P.rebalanceShares([{share:500,isLocked:true},{share:0,isLocked:false},{share:0,isLocked:false}], 1500);
    part.push(test('Rebalance unlocked share', 500, rb[1], 1e-6));
    var rtl = P.orderPartitionDirection([1,2,3,4,5], 'rtl');
    var ltr = P.orderPartitionDirection([1,2,3,4,5], 'ltr');
    part.push({ name: 'OrderRTL preserves', expected: '1,2,3,4,5', got: rtl.join(','), diff: 0, pass: rtl.join(',') === '1,2,3,4,5' });
    part.push({ name: 'OrderLTR reverses', expected: '5,4,3,2,1', got: ltr.join(','), diff: 0, pass: ltr.join(',') === '5,4,3,2,1' });
  }

  // ---- Category 4 & 5 merged: Edge Cases + Numerical Stability ----
  var edge = [];
  if (G && P && V) {
    edge.push(test('EdgeCase Partition 1p', 1500, P.calculateEqualShare(1500, 1)));
    edge.push(test('EdgeCase Partition 0count guard (returns total/1)', 1500, P.calculateEqualShare(1500, 0))); // By design: 0 count treated as 1 to avoid div/0
    edge.push(test('EdgeCase Partition 0area', 0, P.calculateEqualShare(0, 5)));
    edge.push(test('LongDecimal 1000/3 6dp', 333.333333, parseFloat(P.calculateEqualShare(1000, 3).toFixed(6)), 0.000001));
    edge.push(test('Validation invalid area 0', false, V.validateArea(0)));
    edge.push(test('Validation invalid area -5', false, V.validateArea(-5)));
    edge.push(test('Geometry very large 999999^2', 999998000001, G.calculateSquareArea(999999), 1));
    // Numerical stability: 100 shares sum
    var s100 = P.calculateEqualShare(10000, 100);
    var cum = 0; for (var i = 0; i < 100; i++) cum += s100;
    edge.push(test('Stability: 100x share sum', 10000, cum, 1e-6));
    // Heron 1000x idempotent
    var h0 = G.calculateHeronArea(30, 40, 50);
    var hStable = true;
    for (var j = 0; j < 1000; j++) { if (Math.abs(G.calculateHeronArea(30, 40, 50) - h0) > 1e-9) { hStable = false; break; } }
    edge.push({ name: 'Stability: Heron 1000x', expected: true, got: hStable, diff: 0, pass: hStable });
    edge.push(test('6dp precision 33.333333x30', 33.333333 * 30, G.calculateRectangleArea(33.333333, 30), 1e-6));
  }

  // ---- Category 6: Golden Dataset Regression ----
  var golden = [];
  if (G && P) {
    var gd = [
      { name: 'G001 Rect 30x50 2p',   totalArea: 1500,   topW: 50,  botW: 50,  leftL: 30, rightL: 30, count: 2 },
      { name: 'G002 Sq 40x40 3p',     totalArea: 1600,   topW: 40,  botW: 40,  leftL: 40, rightL: 40, count: 3 },
      { name: 'G003 Trap 40-60 10p',  totalArea: 1500,   topW: 60,  botW: 40,  leftL: 30, rightL: 30, count: 10 },
      { name: 'G004 100x100 50p',     totalArea: 10000,  topW: 100, botW: 100, leftL: 100, rightL: 100, count: 50 },
      { name: 'G005 500x500 100p',    totalArea: 250000, topW: 500, botW: 500, leftL: 500, rightL: 500, count: 100 }
    ];
    gd.forEach(function(d) {
      var legacyArea = G.calculateTrapezoidArea(d.topW, d.botW, d.leftL, d.rightL);
      var legacyShare = legacyArea / d.count;
      var engineShare = P.calculateEqualShare(legacyArea, d.count);
      var diff = Math.abs(legacyShare - engineShare);
      golden.push(test(d.name + ' share diff', 0, diff, 1e-6));
      var sumShares = engineShare * d.count;
      golden.push(test(d.name + ' sum=area', legacyArea, sumShares, 1e-6));
    });
  }

  // ---- Aggregate ----
  function summarize(name, arr) {
    var passed = arr.filter(function(t) { return t.pass; }).length;
    return { category: name, total: arr.length, passed: passed, failed: arr.length - passed, results: arr };
  }

  var all = [
    summarize('Geometry', geo),
    summarize('Units', units),
    summarize('Partition', part),
    summarize('EdgeCases+Stability', edge),
    summarize('GoldenDatasetRegression', golden)
  ];

  var totalTests = 0, totalPassed = 0;
  all.forEach(function(c) { totalTests += c.total; totalPassed += c.passed; });

  return JSON.stringify({
    audId: 'AUD-002A',
    status: totalPassed === totalTests ? 'PASS' : 'FAIL',
    totalTests: totalTests,
    passedTests: totalPassed,
    failedTests: totalTests - totalPassed,
    timestamp: new Date().toISOString(),
    categories: all
  });
})();
