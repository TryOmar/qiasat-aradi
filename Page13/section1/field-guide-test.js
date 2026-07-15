window.runFieldGuideTests = function() {
  const results = [];
  function assert(condition, message) {
    results.push({
      label: message,
      status: condition ? "PASS" : "FAIL"
    });
  }

  console.log("\n%c--- اختبارات دليل التنفيذ الميداني الحقلي (Field Guide Tests) ---", "font-weight: bold; color: #2e7d32; font-size: 14px;");

  const originalActive = isDivisionActive;
  const originalHeirs = heirsData;

  isDivisionActive = true;
  heirsData = [
    { id: "1", name: "شريك 1", share: 100, topW: 10, botW: 10, leftL: 10, rightL: 10 },
    { id: "2", name: "شريك 2", share: 100, topW: 10, botW: 10, leftL: 10, rightL: 10 }
  ];

  const data = buildFieldGuideData();
  assert(data !== null, "توليد بيانات الدليل الحقلي عند وجود شركاء وتقسيم نشط");
  if (data) {
    assert(data.statistics.stakes === 6, "حساب عدد الأوتاد الإجمالي (4 أركان + 2 أوتاد فصل)");
    assert(data.boundaryRopes.length === 4, "حساب عدد حبال الحدود الخارجية (4 حبال)");
    assert(data.dividerRopes.length === 1, "حساب عدد حبال الفواصل الداخلية (حبل واحد لشريكين)");
  }

  isDivisionActive = originalActive;
  heirsData = originalHeirs;

  return {
    passed: results.every(r => r.status === "PASS"),
    summary: {
      totalTests: results.length,
      passedTests: results.filter(r => r.status === "PASS").length,
      failedTests: results.filter(r => r.status === "FAIL").length,
      execTimeMs: 0
    },
    results: results
  };
};
