let mirasGroups = [];
const GROUP_COLORS = [
  { fill: "#DCEFD9", stroke: "#2E7D32" }, // Green
  { fill: "#D7E9FF", stroke: "#1565C0" }, // Blue
  { fill: "#FFF0C9", stroke: "#EF6C00" }, // Orange
  { fill: "#E9DDF8", stroke: "#6A1B9A" }, // Purple
  { fill: "#F8DDE8", stroke: "#C2185B" }, // Pink
  { fill: "#D8F3EF", stroke: "#00796B" }  // Teal
];

function clearInputFields() {
  sessionStorage.setItem("acre", "");
  sessionStorage.setItem("carat", "");
  sessionStorage.setItem("share", "");
  sessionStorage.setItem("num_wives", "");
  sessionStorage.setItem("num_females", "");
  sessionStorage.setItem("num_males", "");
  sessionStorage.setItem("mirasGroups", "");
  location.reload();
}
// Load data from sessionStorage when the page loads
window.onload = function () {
  loadData();
};

// Function to save input field data to sessionStorage
function saveData() {
  sessionStorage.setItem("acre", document.getElementById("txt_acre").value);
  sessionStorage.setItem("carat", document.getElementById("txt_carat").value);
  sessionStorage.setItem("share", document.getElementById("txt_share").value);
  sessionStorage.setItem(
    "num_wives",
    document.getElementById("txt_numwives").value
  );
  sessionStorage.setItem(
    "num_females",
    document.getElementById("txt_numFemales").value
  );
  sessionStorage.setItem(
    "num_males",
    document.getElementById("txt_numMales").value
  );
  // save checkbox values

  let listOfCheckboxValues = Array.from(
    document.querySelectorAll("#tbl_Results input[type=checkbox]")
  )
    .filter((checkbox) => !checkbox.disabled) // Only include enabled checkboxes
    .map((checkbox) => checkbox.checked); // Get checked state

  sessionStorage.setItem(
    "checkboxValues",
    JSON.stringify(listOfCheckboxValues)
  );
}

// Function to retrieve and set input field data from sessionStorage
function loadData() {
  // get values
  let savedGroups = sessionStorage.getItem("mirasGroups") || localStorage.getItem("mirasGroups");
  if (savedGroups) {
    try {
      mirasGroups = JSON.parse(savedGroups);
    } catch (e) {
      mirasGroups = [];
    }
  } else {
    mirasGroups = [];
  }
  let acreValue = sessionStorage.getItem("acre");
  let caratValue = sessionStorage.getItem("carat");
  let shareValue = sessionStorage.getItem("share");
  let num_wivesValue = Number(sessionStorage.getItem("num_wives"));
  let num_femalesValue = Number(sessionStorage.getItem("num_females"));
  let num_malesValue = Number(sessionStorage.getItem("num_males"));
  let isSharesLeft = sessionStorage.getItem("isSharesLeft") === "true";
  console.log(isSharesLeft);
  let listOfCheckboxValues = JSON.parse(
    sessionStorage.getItem("checkboxValues")
  );
  // constructu a new list has the same values

  // set valuesj
  document.getElementById("txt_acre").value = acreValue;
  document.getElementById("txt_carat").value = caratValue;
  document.getElementById("txt_share").value = shareValue;
  if (num_wivesValue > 0)
    document.getElementById("txt_numwives").value = num_wivesValue;
  if (num_femalesValue > 0)
    document.getElementById("txt_numFemales").value = num_femalesValue;
  if (num_malesValue > 0)
    document.getElementById("txt_numMales").value = num_malesValue;
  updateTables(
    num_wivesValue,
    num_femalesValue,
    num_malesValue,
    isSharesLeft,
    listOfCheckboxValues
  );
  calculateShares();

  // document.getElementById("txt_acre").value =
  //   sessionStorage.getItem("acre") || "";
  // document.getElementById("txt_carat").value =
  //   sessionStorage.getItem("carat") || "";
  // document.getElementById("txt_share").value =
  //   sessionStorage.getItem("share") || "";
  // document.getElementById("txt_numwives").value =
  //   sessionStorage.getItem("num_wives") || "";
  // document.getElementById("txt_numFemales").value =
  //   sessionStorage.getItem("num_females") || "";
  // document.getElementById("txt_numMales").value =
  //   sessionStorage.getItem("num_males") || "";
}

// Add event listeners to save data on input change
// document.getElementById("txt_acre").addEventListener("input", saveData);
// document.getElementById("txt_carat").addEventListener("input", saveData);
// document.getElementById("txt_share").addEventListener("input", saveData);
// document.getElementById("txt_numwives").addEventListener("input", saveData);
// document.getElementById("txt_numFemales").addEventListener("input", saveData);
// document.getElementById("txt_numMales").addEventListener("input", saveData);

function calculateScaresAndCarats(totalShares) {
  // Calculate the number of scares, carats, and remaining shares
  const scares = Math.floor(totalShares / (24 * 24));
  const carats = Math.floor((totalShares - scares * 24 * 24) / 24);
  const shares = (totalShares - scares * 24 * 24 - carats * 24).toFixed(3);
  // Return an array containing the results
  return [scares, carats, shares];
}

function calculatePercentage(part, total) {
  const percentage = (part / total) * 100;
  return percentage.toFixed(2);
}

function getHeirGroup(heirId) {
  return mirasGroups.find(g => g.members.includes(heirId)) || null;
}

function updateTables(
  numWivesValue = 0,
  numFemalesValue = 0,
  numMalesValue = 0,
  isSharesLeft = false,
  listOfCheckboxValues = []
) {
  console.log("Before: ", listOfCheckboxValues);
  // Initialize and validate listOfCheckboxValues length
  const expectedLength = numWivesValue + numFemalesValue + numMalesValue + (isSharesLeft ? 1 : 0);
  if (!listOfCheckboxValues || listOfCheckboxValues.length !== expectedLength) {
    listOfCheckboxValues = Array(expectedLength).fill(true);
  }
  console.log("Num: ", numWivesValue, numFemalesValue, numMalesValue);
  console.log("After: ", listOfCheckboxValues);

  let tableHead = `
    <tr>
      <th><label>النسبة</label></th>
      <th><label>فدان</label></th>
      <th><label>قيراط</label></th>
      <th><label>سهم</label></th>
      <th><label>القرابة</label></th>
      <th><label>اختيار</label></th>
    </tr>
  `;

  // Generating table rows for wives
  let tableWives = "";
  for (let i = 0; i < numWivesValue; i++) {
    let heirId = `wife_${i}`;
    let group = getHeirGroup(heirId);
    let lockBadge = group ? ` <span class="group-badge-lock" style="background: ${group.color.stroke}">🔒 ${group.name}</span>` : "";
    let checkboxHtml = group 
      ? `<input type="checkbox" checked onclick="return false;" style="opacity: 0.6; cursor: not-allowed;">`
      : `<input type="checkbox" ${listOfCheckboxValues[i] ? "checked" : ""} onchange="calculateShares()">`;

    tableWives += `
      <tr class="wife">
        <td><center><input type="input" id="txt_PercentWives${i}" style="width:100%" placeholder="0%" readonly></center></td>
        <td><center><input type="input" id="txt_Wivesacre${i}" style="width:100%" placeholder="0" readonly></center></td>
        <td><center><input type="input" id="txt_Wivescarat${i}" style="width:100%" placeholder="0" readonly></center></td>
        <td><center><input type="input" id="txt_Wivesshare${i}" style="width:100%" placeholder="0" readonly></center></td>
        <td><center><label style="font-weight:bold"> الزوجة ${
          i + 1
        } ${lockBadge}</label></center></td>
        <td><center>${checkboxHtml}</center></td>
      </tr>
    `;
  }

  // Generating table rows for females
  let tableFemale = "";
  for (let i = 0; i < numFemalesValue; i++) {
    let heirId = `female_${i}`;
    let group = getHeirGroup(heirId);
    let lockBadge = group ? ` <span class="group-badge-lock" style="background: ${group.color.stroke}">🔒 ${group.name}</span>` : "";
    let checkboxHtml = group 
      ? `<input type="checkbox" checked onclick="return false;" style="opacity: 0.6; cursor: not-allowed;">`
      : `<input type="checkbox" ${listOfCheckboxValues[numWivesValue + i] ? "checked" : ""} onchange="calculateShares()">`;

    tableFemale += `
      <tr class="females">
        <td><center><input type="input" id="txt_FemalesPercent${i}" style="width:100%" placeholder="0%" readonly></center></td>
        <td><center><input type="input" id="txt_Femalesacre${i}" style="width:100%" placeholder="0" readonly></center></td>
        <td><center><input type="input" id="txt_Femalescarat${i}" style="width:100%" placeholder="0" readonly></center></td>
        <td><center><input type="input" id="txt_Femalesshare${i}" style="width:100%" placeholder="0" readonly></center></td>
        <td><center><label style="font-weight:bold"> البنت ${
          i + 1
        } ${lockBadge}</label></center></td>
        <td><center>${checkboxHtml}</center></td>
      </tr>
    `;
  }

  // Generating table rows for males
  let tableMale = "";
  for (let i = 0; i < numMalesValue; i++) {
    let heirId = `male_${i}`;
    let group = getHeirGroup(heirId);
    let lockBadge = group ? ` <span class="group-badge-lock" style="background: ${group.color.stroke}">🔒 ${group.name}</span>` : "";
    let checkboxHtml = group 
      ? `<input type="checkbox" checked onclick="return false;" style="opacity: 0.6; cursor: not-allowed;">`
      : `<input type="checkbox" ${listOfCheckboxValues[numWivesValue + numFemalesValue + i] ? "checked" : ""} onchange="calculateShares()">`;

    tableMale += `
      <tr class="sons">
        <td><center><input type="input" id="txt_malePercent${i}" style="width:100%" placeholder="0%" readonly></center></td>
        <td><center><input type="input" id="txt_malesacre${i}" style="width:100%" placeholder="0" readonly></center></td>
        <td><center><input type="input" id="txt_malescarat${i}" style="width:100%" placeholder="0" readonly></center></td>
        <td><center><input type="input" id="txt_malesshare${i}" style="width:100%" placeholder="0" readonly></center></td>
        <td><center><label style="font-weight:bold"> الأبن ${
          i + 1
        } ${lockBadge}</label></center></td>
        <td><center>${checkboxHtml}</center></td>
      </tr>
    `;
  }

  // Additional row if isSharesLeft is true
  let tableLeft = "";
  if (isSharesLeft) {
    let heirId = `leftover_0`;
    let group = getHeirGroup(heirId);
    let lockBadge = group ? ` <span class="group-badge-lock" style="background: ${group.color.stroke}">🔒 ${group.name}</span>` : "";
    let checkboxHtml = group 
      ? `<input type="checkbox" checked onclick="return false;" style="opacity: 0.6; cursor: not-allowed;">`
      : `<input type="checkbox" ${listOfCheckboxValues[listOfCheckboxValues.length - 1] ? "checked" : ""} onchange="calculateShares()">`;

    tableLeft = `
      <tr>
        <td><center><input type="input" id="txt_leftPercent" style="width:100%" placeholder="0%" readonly></center></td>
        <td><center><input type="input" id="txt_leftacre" style="width:100%" placeholder="0" readonly></center></td>
        <td><center><input type="input" id="txt_leftscarat" style="width:100%" placeholder="0" readonly></center></td>
        <td><center><input type="input" id="txt_leftshare" style="width:100%" placeholder="0" readonly></center></td>
        <td><center><label style="font-weight:bold"> المتبقي ${lockBadge}</label></center></td>
        <td><center>${checkboxHtml}</center></td>
      </tr>
    `;
  }

  // Footer row
  let tableFoot = `
    <tr class="tableFooterTotal">
      <td><center><input type="input" id="txt_TotalPercentVal" style="width:100%" placeholder="0%" readonly></center></td>
      <td><center><input type="input" id="txt_Totalsacre" style="width:100%" placeholder="0" readonly></center></td>
      <td><center><input type="input" id="txt_Totalcarat" style="width:100%" placeholder="0" readonly></center></td>
      <td><center><input type="input" id="txt_Totalshare" style="width:100%" placeholder="0" readonly></center></td>
      <td><center><label style="font-weight:bold"> الاجمالى </label></center></td>
      <td id="checkboxCount">${
        numWivesValue + numFemalesValue + numMalesValue
      }</td>
    </tr>
  `;

  // Updating the table with all the generated rows
  document.getElementById("tbl_Results").innerHTML =
    tableHead + tableWives + tableFemale + tableMale + tableLeft + tableFoot;
}

function IntegerWithoutDecimal(inputElement) {
  let numValue = Number(inputElement.value);

  if (inputElement.value == "" || isNaN(numValue) || !isFinite(numValue)) {
    return 0;
  } else {
    inputElement.value = Math.floor(numValue);
    return +inputElement.value;
  }
}

function ZeroToFourValidate(inputElement) {
  let numValue = Number(inputElement.value);

  if (numValue < 0) {
    inputElement.value = 0;
  } else if (numValue > 4) {
    inputElement.value = 4;
  }
  return inputElement.value;
}

function getUncheckedCounts(
  numWives,
  numFemales,
  numMales,
  listOfCheckboxValues
) {
  let uncheckedWives = listOfCheckboxValues
    .slice(0, numWives)
    .filter((val) => !val).length;
  let uncheckedFemales = listOfCheckboxValues
    .slice(numWives, numWives + numFemales)
    .filter((val) => !val).length;
  let uncheckedMales = listOfCheckboxValues
    .slice(numWives + numFemales, numWives + numFemales + numMales)
    .filter((val) => !val).length;

  return [uncheckedWives, uncheckedFemales, uncheckedMales];
}

function calculateShares(newCalculation = false) {
  // Get input values
  let acreValue = IntegerWithoutDecimal(document.getElementById("txt_acre"));
  let caratValue = IntegerWithoutDecimal(document.getElementById("txt_carat"));
  let shareValue = parseFloat(document.getElementById("txt_share").value) || 0;
  let numWivesValue =
    ZeroToFourValidate(document.getElementById("txt_numwives")) || 0;
  let numFemalesValue = IntegerWithoutDecimal(
    document.getElementById("txt_numFemales")
  );
  let numMalesValue = IntegerWithoutDecimal(
    document.getElementById("txt_numMales")
  );

  let listOfCheckboxValues = Array.from(
    document.querySelectorAll("#tbl_Results input[type=checkbox]")
  )
    .filter((checkbox) => !checkbox.disabled) // Only include enabled checkboxes
    .map((checkbox) => checkbox.checked); // Get checked state

  // Perform the operations
  // Perform the operations
  let totalAllShares = acreValue * 24 * 24 + caratValue * 24 + shareValue;

  let nasebZwga = 0;
  if (numWivesValue == 0) {
    nasebZwga = 0;
  } else if (numFemalesValue + numMalesValue == 0) {
    nasebZwga = 0.25 * totalAllShares;
  } else if (numFemalesValue + numMalesValue > 0) {
    nasebZwga = 0.125 * totalAllShares;
  }

  let nasebBnat = 0;
  if (numFemalesValue == 0) {
    nasebBnat = 0;
  } else if (numMalesValue) {
    nasebBnat =
      (totalAllShares - nasebZwga) / (2.0 * numMalesValue + numFemalesValue);
    // console.log("HI0: ", nasebBnat);
  } else if (numFemalesValue == 1) {
    nasebBnat = 0.5 * (totalAllShares - nasebZwga);
    // console.log("HI: ", nasebBnat);
  } else if (numFemalesValue > 1) {
    nasebBnat = (2.0 * (totalAllShares - nasebZwga)) / 3.0;
    nasebBnat = nasebBnat / numFemalesValue;
    // console.log("HI2: ", nasebBnat);
  }

  let nasebAbn = 0;
  if (numMalesValue == 0) {
    nasebAbn = 0;
  } else if (numFemalesValue) {
    nasebAbn = 2 * nasebBnat;
  } else if (numMalesValue) {
    nasebAbn = (totalAllShares - nasebZwga) / numMalesValue;
  }

  if (numWivesValue != 0) {
    nasebZwga = nasebZwga / numWivesValue;
  }

  // Print the values of each variable for debugging
  // console.log("acreValue:", acreValue);
  // console.log("caratValue:", caratValue);
  // console.log("shareValue:", shareValue);
  // console.log("numWivesValue:", numWivesValue);
  // console.log("numFemalesValue:", numFemalesValue);
  // console.log("numMalesValue:", numMalesValue);

  // console.log("totalAllShares:", totalAllShares);
  // console.log("nasebZwga:", nasebZwga);
  // console.log("nasebBnat:", nasebBnat);
  // console.log("nasebAbn:", nasebAbn);

  numWivesValue = Number(numWivesValue);
  numFemalesValue = Number(numFemalesValue);
  numMalesValue = Number(numMalesValue);

  const familyShares =
    numWivesValue * nasebZwga +
    numFemalesValue * nasebBnat +
    numMalesValue * nasebAbn;

  let totalSharesleft = totalAllShares - familyShares;
  isSharesLeft = totalSharesleft > 0 ? true : false;

  const expectedLength = numWivesValue + numFemalesValue + numMalesValue + (isSharesLeft ? 1 : 0);
  if (newCalculation || listOfCheckboxValues.length !== expectedLength) {
    listOfCheckboxValues = Array(expectedLength).fill(true);
  }

  updateTables(
    numWivesValue,
    numFemalesValue,
    numMalesValue,
    isSharesLeft,
    listOfCheckboxValues
  );

  // Calculate the values using the helper function
  const [wivesAcre, wivesCarat, wivesShare] =
    calculateScaresAndCarats(nasebZwga);
  const percentWives = calculatePercentage(nasebZwga, totalAllShares);

  const [femalesAcre, femalesCarat, femalesShare] =
    calculateScaresAndCarats(nasebBnat);
  const femalesPercent = calculatePercentage(nasebBnat, totalAllShares);

  const [malesAcre, malesCarat, malesShare] =
    calculateScaresAndCarats(nasebAbn);
  const malePercent = calculatePercentage(nasebAbn, totalAllShares);

  const [sharesLeftAcre, sharesLeftCarat, sharesLeftShare] =
    calculateScaresAndCarats(totalSharesleft);
  const sharesLeftPercent = calculatePercentage(
    totalSharesleft,
    totalAllShares
  ); // 100% of the total is itself

  // Write the values back into the input boxes
  document.getElementById("txt_TotalAllshare").value = totalAllShares;

  for (let i = 0; i < numWivesValue; i++) {
    document.getElementById(`txt_Wivesacre${i}`).value = wivesAcre;
    document.getElementById(`txt_Wivescarat${i}`).value = wivesCarat;
    document.getElementById(`txt_Wivesshare${i}`).value = wivesShare;
    document.getElementById(`txt_PercentWives${i}`).value = percentWives + "%";
  }

  for (let i = 0; i < numFemalesValue; i++) {
    document.getElementById(`txt_Femalesacre${i}`).value = femalesAcre;
    document.getElementById(`txt_Femalescarat${i}`).value = femalesCarat;
    document.getElementById(`txt_Femalesshare${i}`).value = femalesShare;
    document.getElementById(`txt_FemalesPercent${i}`).value =
      femalesPercent + "%";
  }

  for (let i = 0; i < numMalesValue; i++) {
    document.getElementById(`txt_malesacre${i}`).value = malesAcre;
    document.getElementById(`txt_malescarat${i}`).value = malesCarat;
    document.getElementById(`txt_malesshare${i}`).value = malesShare;
    document.getElementById(`txt_malePercent${i}`).value = malePercent + "%";
  }

  if (isSharesLeft) {
    sessionStorage.setItem("isSharesLeft", true);
    document.getElementById("txt_leftacre").value = sharesLeftAcre;
    document.getElementById("txt_leftscarat").value = sharesLeftCarat;
    document.getElementById("txt_leftshare").value = sharesLeftShare;
    document.getElementById("txt_leftPercent").value = sharesLeftPercent + "%";
    document.getElementById(
      "leftSharesMessage"
    ).innerHTML = ` ملاحظة : فى حالة عدم و جود
      ابن للمتوفى فبعد
      توريث الزوجة أو البنت,<br> فالمتبقى من المراث الاراضي يذهب للفروع الوارثة 
      `;
  } else {
    document.getElementById("leftSharesMessage").innerHTML = "";
  }

  const totalChecked = listOfCheckboxValues.filter((val) => val).length;
  const [uncheckedWives, uncheckedFemales, uncheckedMales] = getUncheckedCounts(
    numWivesValue,
    numFemalesValue,
    numMalesValue,
    listOfCheckboxValues
  );

  console.log("uncheckedWives:", listOfCheckboxValues);
  const unCheckedSharesLeft =
    isSharesLeft & !listOfCheckboxValues[listOfCheckboxValues.length - 1];
  const unCheckedShares =
    uncheckedWives * nasebZwga +
      uncheckedFemales * nasebBnat +
      uncheckedMales * nasebAbn +
      unCheckedSharesLeft * totalSharesleft || 0;

  console.log("unCheckedShares:", unCheckedShares);
  const [totalAcre, totalCarat, totalShare] = calculateScaresAndCarats(
    totalAllShares - unCheckedShares
  );
  const totalPercentVal = calculatePercentage(
    totalAllShares - unCheckedShares,
    totalAllShares
  ); // 100% of the total is itself
  document.getElementById("checkboxCount").innerHTML = totalChecked;
  document.getElementById("txt_Totalsacre").value = totalAcre;
  document.getElementById("txt_Totalcarat").value = totalCarat;
  document.getElementById("txt_Totalshare").value = totalShare;
  document.getElementById("txt_TotalPercentVal").value = totalPercentVal + "%";

  sessionStorage.setItem("nasebZwga", nasebZwga.toString());
  sessionStorage.setItem("nasebBnat", nasebBnat.toString());
  sessionStorage.setItem("nasebAbn", nasebAbn.toString());
  sessionStorage.setItem("totalSharesleft", totalSharesleft.toString());
  sessionStorage.setItem("isSharesLeft", isSharesLeft ? "true" : "false");

  // Recalculate and render groups panel
  let totalHeirsCount = numWivesValue + numFemalesValue + numMalesValue;
  let panel = document.getElementById("groups-panel");
  if (panel) {
    if (totalHeirsCount > 0) {
      panel.style.display = "block";
      renderGroups();
      let selectedToGroup = getCheckedNonGroupedHeirs();
      let btnCreate = document.getElementById("btn-create-group");
      if (btnCreate) {
        btnCreate.style.display = selectedToGroup.length >= 2 ? "block" : "none";
      }
    } else {
      panel.style.display = "none";
    }
  }

  // Verification check: sum of groups + ungrouped heirs = total checked shares
  let verifiedSum = 0;
  mirasGroups.forEach(g => verifiedSum += g.totalShare);
  let heirsList = getHeirsList();
  let checkboxes = Array.from(document.querySelectorAll("#tbl_Results input[type=checkbox]"));
  heirsList.forEach((heir, idx) => {
    let cb = checkboxes[idx];
    if (cb && cb.checked && !getHeirGroup(heir.id)) {
      verifiedSum += heir.share;
    }
  });
  let expectedSum = totalAllShares - unCheckedShares;
  if (Math.abs(verifiedSum - expectedSum) > 0.001) {
    console.warn("Verification warning: group sum mismatch!", verifiedSum, expectedSum);
  } else {
    console.log("Verification success: group sum matches checked total exactly.");
  }

  saveData();
}

function getHeirsList() {
  let numWivesValue = parseInt(document.getElementById("txt_numwives").value) || 0;
  let numFemalesValue = parseInt(document.getElementById("txt_numFemales").value) || 0;
  let numMalesValue = parseInt(document.getElementById("txt_numMales").value) || 0;
  
  let heirs = [];
  
  let zwgaVal = parseFloat(sessionStorage.getItem("nasebZwga")) || 0;
  let bnatVal = parseFloat(sessionStorage.getItem("nasebBnat")) || 0;
  let abnVal = parseFloat(sessionStorage.getItem("nasebAbn")) || 0;
  let leftVal = parseFloat(sessionStorage.getItem("totalSharesleft")) || 0;

  for (let i = 0; i < numWivesValue; i++) {
    heirs.push({
      id: `wife_${i}`,
      type: "wife",
      name: `الزوجة ${i + 1}`,
      share: zwgaVal
    });
  }
  for (let i = 0; i < numFemalesValue; i++) {
    heirs.push({
      id: `female_${i}`,
      type: "female",
      name: `البنت ${i + 1}`,
      share: bnatVal
    });
  }
  for (let i = 0; i < numMalesValue; i++) {
    heirs.push({
      id: `male_${i}`,
      type: "male",
      name: `الأبن ${i + 1}`,
      share: abnVal
    });
  }
  let isSharesLeft = sessionStorage.getItem("isSharesLeft") === "true";
  if (isSharesLeft) {
    heirs.push({
      id: `leftover_0`,
      type: "leftover",
      name: `المتبقي`,
      share: leftVal
    });
  }
  return heirs;
}

function recalculateGroups() {
  let acreValue = IntegerWithoutDecimal(document.getElementById("txt_acre"));
  let caratValue = IntegerWithoutDecimal(document.getElementById("txt_carat"));
  let shareValue = parseFloat(document.getElementById("txt_share").value) || 0;
  let totalAllShares = acreValue * 24 * 24 + caratValue * 24 + shareValue;

  let heirs = getHeirsList();
  
  // Smart update: remove members that no longer exist in the active heirs list
  let groupsChanged = false;
  mirasGroups.forEach(group => {
    let originalCount = group.members.length;
    group.members = group.members.filter(memberId => heirs.some(h => h.id === memberId));
    if (group.members.length !== originalCount) {
      groupsChanged = true;
    }
  });
  
  // Prune groups that have become empty
  let originalGroupCount = mirasGroups.length;
  mirasGroups = mirasGroups.filter(group => group.members.length > 0);
  if (mirasGroups.length !== originalGroupCount) {
    groupsChanged = true;
  }
  
  mirasGroups.forEach(group => {
    let groupShares = 0;
    group.members.forEach(memberId => {
      let heir = heirs.find(h => h.id === memberId);
      if (heir) {
        groupShares += heir.share;
      }
    });
    group.totalShare = groupShares;
    const [scares, carats, shares] = calculateScaresAndCarats(groupShares);
    group.totalArea = { acre: scares, carat: carats, share: parseFloat(shares) };
    group.totalPercent = parseFloat(calculatePercentage(groupShares, totalAllShares)) || 0;
    
    // Set default status if missing
    if (!group.status) {
      group.status = "pending";
    }
  });
  
  if (groupsChanged) {
    saveGroupingData();
  }
}

function renderGroups() {
  const container = document.getElementById("groups-container");
  const panel = document.getElementById("groups-panel");
  const exportBtn = document.getElementById("btn-export-groups");
  
  if (!container) return;
  
  recalculateGroups();
  
  if (mirasGroups.length === 0) {
    container.innerHTML = `<div class="conv-empty-state">لا توجد مجموعات حالياً. حدد وريثين أو أكثر لإنشاء مجموعة.</div>`;
    if (exportBtn) exportBtn.style.display = "none";
  } else {
    if (exportBtn) exportBtn.style.display = "block";
    
    let html = "";
    mirasGroups.forEach(g => {
      let heirs = getHeirsList();
      let memberNames = g.members.map(memberId => {
        let heir = heirs.find(h => h.id === memberId);
        return heir ? heir.name : memberId;
      });
      
      // Status styling
      let statusHtml = "";
      if (g.status === "exported") {
        statusHtml = `<span style="color: #2e7d32; font-weight: bold; font-size: 12.5px;">🟢 تم إرسالها إلى برنامج التقسيم</span>`;
      } else if (g.status === "completed") {
        statusHtml = `<span style="color: #1565c0; font-weight: bold; font-size: 12.5px;">🔵 تم تقسيمها بالكامل</span>`;
      } else {
        statusHtml = `<span style="color: #64748b; font-size: 12.5px;">○ لم يتم التقسيم</span>`;
      }
      
      html += `
        <div class="group-card" style="border-color: ${g.color.stroke};">
          <div class="group-card-header" style="border-bottom-color: ${g.color.stroke};">
            <div class="group-card-title" style="color: ${g.color.stroke};">
              <span>📁 ${g.name}</span>
            </div>
            <div style="display: flex; gap: 4px;">
              <button class="btn-group-action" onclick="renameGroup('${g.id}')" style="color: ${g.color.stroke}; border-color: ${g.color.stroke};">✏️ تعديل الاسم</button>
              <button class="btn-group-action" onclick="deleteGroup('${g.id}')" style="color: #ef4444; border-color: #ef4444;">🗑️ حذف</button>
            </div>
          </div>
          <div class="group-card-body">
            <div style="margin-bottom: 5px;">
              <span style="font-weight: bold; color: #475569; font-size: 12.5px;">الأعضاء:</span><br>
              ${memberNames.map(name => `<span class="group-member-tag">${name}</span>`).join("")}
            </div>
            
            <div class="group-stat-row">
              <label>عدد الأعضاء:</label>
              <span>${g.members.length}</span>
            </div>
            <div class="group-stat-row">
              <label>إجمالي المساحة:</label>
              <span>${g.totalArea.acre} فدان ، ${g.totalArea.carat} قيراط ، ${g.totalArea.share} سهم</span>
            </div>
            <div class="group-stat-row">
              <label>النسبة من التركة:</label>
              <span>${g.totalPercent}%</span>
            </div>
            <div class="group-stat-row">
              <label>الحالة:</label>
              <span>${statusHtml}</span>
            </div>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  }
}

function getCheckedNonGroupedHeirs() {
  let checkboxes = Array.from(document.querySelectorAll("#tbl_Results input[type=checkbox]"));
  let heirs = getHeirsList();
  
  let checkedHeirs = [];
  heirs.forEach((heir, idx) => {
    let cb = checkboxes[idx];
    if (cb && cb.checked) {
      if (!getHeirGroup(heir.id)) {
        checkedHeirs.push(heir);
      }
    }
  });
  return checkedHeirs;
}

function createGroupFromSelected() {
  let selected = getCheckedNonGroupedHeirs();
  if (selected.length < 2) {
    alert("يرجى تحديد وارثين أو أكثر لإنشاء مجموعة.");
    return;
  }
  
  let uuid = "grp_" + Math.random().toString(36).substr(2, 9);
  let colorIndex = mirasGroups.length % GROUP_COLORS.length;
  let color = GROUP_COLORS[colorIndex];
  let name = `المجموعة ${mirasGroups.length + 1}`;
  
  let newGroup = {
    id: uuid,
    name: name,
    color: color,
    members: selected.map(h => h.id),
    totalShare: 0,
    totalArea: { acre: 0, carat: 0, share: 0 },
    exportId: "exp_" + uuid,
    notes: "",
    status: "pending"
  };
  
  mirasGroups.push(newGroup);
  saveGroupingData();
  calculateShares();
}

function saveGroupingData() {
  sessionStorage.setItem("mirasGroups", JSON.stringify(mirasGroups));
  localStorage.setItem("mirasGroups", JSON.stringify(mirasGroups));
}

function deleteGroup(groupId) {
  mirasGroups = mirasGroups.filter(g => g.id !== groupId);
  saveGroupingData();
  calculateShares();
}

function renameGroup(groupId) {
  let group = mirasGroups.find(g => g.id === groupId);
  if (!group) return;
  let newName = prompt("أدخل اسم المجموعة الجديد:", group.name);
  if (newName && newName.trim() !== "") {
    group.name = newName.trim();
    saveGroupingData();
    calculateShares();
  }
}

function exportGroupsToDivision() {
  recalculateGroups();
  let heirs = getHeirsList();
  let checkboxes = Array.from(document.querySelectorAll("#tbl_Results input[type=checkbox]"));
  
  let individualHeirs = [];
  heirs.forEach((heir, idx) => {
    let cb = checkboxes[idx];
    if (cb && cb.checked) {
      if (!getHeirGroup(heir.id)) {
        individualHeirs.push(heir);
      }
    }
  });
  
  // Set status of all exported groups to exported
  mirasGroups.forEach(g => {
    g.status = "exported";
  });
  saveGroupingData();
  
  let divisionInput = {
    projectVersion: 1,
    source: "Page5",
    groups: mirasGroups.map(g => ({
      id: g.id,
      name: g.name,
      color: g.color,
      totalShare: g.totalShare,
      exportId: g.exportId,
      notes: g.notes
    })),
    individualHeirs: individualHeirs.map(h => ({
      id: h.id,
      name: h.name,
      share: h.share
    })),
    settings: {
      timestamp: Date.now()
    }
  };
  
  sessionStorage.setItem("divisionInput", JSON.stringify(divisionInput));
  window.location.href = "../Page13/section1/index.html";
}

// Data model split, merge, and transfer helpers for future extensibility
window.moveHeirToGroup = function(heirId, targetGroupId) {
  mirasGroups.forEach(g => {
    g.members = g.members.filter(m => m !== heirId);
  });
  let target = mirasGroups.find(g => g.id === targetGroupId);
  if (target && !target.members.includes(heirId)) {
    target.members.push(heirId);
  }
  saveGroupingData();
  calculateShares();
};

window.removeHeirFromGroup = function(heirId) {
  mirasGroups.forEach(g => {
    g.members = g.members.filter(m => m !== heirId);
  });
  mirasGroups = mirasGroups.filter(g => g.members.length > 0);
  saveGroupingData();
  calculateShares();
};

window.mergeGroups = function(sourceGroupId, targetGroupId) {
  let source = mirasGroups.find(g => g.id === sourceGroupId);
  let target = mirasGroups.find(g => g.id === targetGroupId);
  if (source && target) {
    source.members.forEach(m => {
      if (!target.members.includes(m)) {
        target.members.push(m);
      }
    });
    mirasGroups = mirasGroups.filter(g => g.id !== sourceGroupId);
    saveGroupingData();
    calculateShares();
  }
};

function printReport() {
  // Get primary land values
  let acreValue = parseInt(document.getElementById("txt_acre").value) || 0;
  let caratValue = parseInt(document.getElementById("txt_carat").value) || 0;
  let shareValue = parseFloat(document.getElementById("txt_share").value) || 0;
  let totalAllShares = document.getElementById("txt_TotalAllshare").value || 0;

  // Family details
  let numWivesValue = parseInt(document.getElementById("txt_numwives").value) || 0;
  let numFemalesValue = parseInt(document.getElementById("txt_numFemales").value) || 0;
  let numMalesValue = parseInt(document.getElementById("txt_numMales").value) || 0;

  // Let's build the heirs table rows
  let rowsHtml = "";
  let checkedHeirsNames = [];

  // For wives
  let wivesCheckboxes = document.querySelectorAll("#tbl_Results tr.wife input[type=checkbox]");
  for (let i = 0; i < numWivesValue; i++) {
    let checked = wivesCheckboxes[i] ? wivesCheckboxes[i].checked : false;
    let name = `الزوجة ${i + 1}`;
    if (checked) checkedHeirsNames.push(name);
    let pct = document.getElementById(`txt_PercentWives${i}`) ? document.getElementById(`txt_PercentWives${i}`).value : "0%";
    let ac = document.getElementById(`txt_Wivesacre${i}`) ? document.getElementById(`txt_Wivesacre${i}`).value : "0";
    let cr = document.getElementById(`txt_Wivescarat${i}`) ? document.getElementById(`txt_Wivescarat${i}`).value : "0";
    let sh = document.getElementById(`txt_Wivesshare${i}`) ? document.getElementById(`txt_Wivesshare${i}`).value : "0";
    rowsHtml += `
      <tr>
        <td>${pct}</td>
        <td>${sh}</td>
        <td>${cr}</td>
        <td>${ac}</td>
        <td>${name}</td>
        <td>${checked ? "مشمول بالجمع" : "غير مشمول"}</td>
      </tr>
    `;
  }

  // For females
  let femalesCheckboxes = document.querySelectorAll("#tbl_Results tr.females input[type=checkbox]");
  for (let i = 0; i < numFemalesValue; i++) {
    let checked = femalesCheckboxes[i] ? femalesCheckboxes[i].checked : false;
    let name = `البنت ${i + 1}`;
    if (checked) checkedHeirsNames.push(name);
    let pct = document.getElementById(`txt_FemalesPercent${i}`) ? document.getElementById(`txt_FemalesPercent${i}`).value : "0%";
    let ac = document.getElementById(`txt_Femalesacre${i}`) ? document.getElementById(`txt_Femalesacre${i}`).value : "0";
    let cr = document.getElementById(`txt_Femalescarat${i}`) ? document.getElementById(`txt_Femalescarat${i}`).value : "0";
    let sh = document.getElementById(`txt_Femalesshare${i}`) ? document.getElementById(`txt_Femalesshare${i}`).value : "0";
    rowsHtml += `
      <tr>
        <td>${pct}</td>
        <td>${sh}</td>
        <td>${cr}</td>
        <td>${ac}</td>
        <td>${name}</td>
        <td>${checked ? "مشمول بالجمع" : "غير مشمول"}</td>
      </tr>
    `;
  }

  // For males
  let malesCheckboxes = document.querySelectorAll("#tbl_Results tr.sons input[type=checkbox]");
  for (let i = 0; i < numMalesValue; i++) {
    let checked = malesCheckboxes[i] ? malesCheckboxes[i].checked : false;
    let name = `الأبن ${i + 1}`;
    if (checked) checkedHeirsNames.push(name);
    let pct = document.getElementById(`txt_malePercent${i}`) ? document.getElementById(`txt_malePercent${i}`).value : "0%";
    let ac = document.getElementById(`txt_malesacre${i}`) ? document.getElementById(`txt_malesacre${i}`).value : "0";
    let cr = document.getElementById(`txt_malescarat${i}`) ? document.getElementById(`txt_malescarat${i}`).value : "0";
    let sh = document.getElementById(`txt_malesshare${i}`) ? document.getElementById(`txt_malesshare${i}`).value : "0";
    rowsHtml += `
      <tr>
        <td>${pct}</td>
        <td>${sh}</td>
        <td>${cr}</td>
        <td>${ac}</td>
        <td>${name}</td>
        <td>${checked ? "مشمول بالجمع" : "غير مشمول"}</td>
      </tr>
    `;
  }

  // Left shares if any
  let isSharesLeft = sessionStorage.getItem("isSharesLeft") === "true";
  if (isSharesLeft && document.getElementById("txt_leftacre")) {
    let allCheckboxes = document.querySelectorAll("#tbl_Results tr input[type=checkbox]");
    let lastChecked = allCheckboxes[allCheckboxes.length - 1] ? allCheckboxes[allCheckboxes.length - 1].checked : false;
    let name = "المتبقي";
    if (lastChecked) checkedHeirsNames.push(name);
    let pct = document.getElementById("txt_leftPercent") ? document.getElementById("txt_leftPercent").value : "0%";
    let ac = document.getElementById("txt_leftacre") ? document.getElementById("txt_leftacre").value : "0";
    let cr = document.getElementById("txt_leftscarat") ? document.getElementById("txt_leftscarat").value : "0";
    let sh = document.getElementById("txt_leftshare") ? document.getElementById("txt_leftshare").value : "0";
    rowsHtml += `
      <tr>
        <td>${pct}</td>
        <td>${sh}</td>
        <td>${cr}</td>
        <td>${ac}</td>
        <td>${name}</td>
        <td>${lastChecked ? "مشمول بالجمع" : "غير مشمول"}</td>
      </tr>
    `;
  }

  // Total Checked Heirs Share
  let totalCheckedAcre = document.getElementById("txt_Totalsacre") ? document.getElementById("txt_Totalsacre").value : "0";
  let totalCheckedCarat = document.getElementById("txt_Totalcarat") ? document.getElementById("txt_Totalcarat").value : "0";
  let totalCheckedShare = document.getElementById("txt_Totalshare") ? document.getElementById("txt_Totalshare").value : "0";
  let totalCheckedPercent = document.getElementById("txt_TotalPercentVal") ? document.getElementById("txt_TotalPercentVal").value : "0%";
  let checkedCount = document.getElementById("checkboxCount") ? document.getElementById("checkboxCount").innerHTML : "0";

  // Let's create the print window content
  const now = new Date();
  const dateStr = now.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("ar-EG");
  const reportId = `DL-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Build groups section if there are any
  let groupsHtml = "";
  if (mirasGroups && mirasGroups.length > 0) {
    groupsHtml += `
      <div class="section page-break-inside-avoid">
        <div class="section-title">📁 المجموعات المختارة</div>
        <div style="display: flex; flex-direction: row; flex-wrap: wrap; gap: 8px; width: 100%;">
    `;
    
    mirasGroups.forEach(g => {
      let heirs = getHeirsList();
      let memberNames = g.members.map(memberId => {
        let heir = heirs.find(h => h.id === memberId);
        return heir ? heir.name : memberId;
      });
      
      let membersBullets = memberNames.map(name => `<li style="margin-right: 15px; list-style-type: circle;">${name}</li>`).join("");
      
      groupsHtml += `
        <div style="flex: 1 1 200px; min-width: 200px; border: 1px solid #ccc; border-radius: 6px; padding: 8px 12px; background: #fafafa; page-break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
          <h4 style="font-size: 9.5pt; margin-bottom: 4px; font-weight: bold; color: #1b5e20;">📁 ${g.name}</h4>
          <ul style="list-style-type: disc; padding-right: 15px; font-size: 8.5pt; line-height: 1.35; font-family: Cairo;">
            <li style="margin-bottom: 3px;"><strong>الأعضاء:</strong>
              <ul style="margin-top: 1px;">
                ${membersBullets}
              </ul>
            </li>
            <li style="margin-bottom: 3px;"><strong>عدد الأعضاء:</strong> ${g.members.length}</li>
            <li style="margin-bottom: 3px;"><strong>إجمالي المساحة:</strong>
              <ul style="margin-top: 1px;">
                <li style="margin-right: 15px; list-style-type: circle;">${g.totalArea.acre} فدان</li>
                <li style="margin-right: 15px; list-style-type: circle;">${g.totalArea.carat} قيراط</li>
                <li style="margin-right: 15px; list-style-type: circle;">${g.totalArea.share} سهم</li>
              </ul>
            </li>
            <li style="margin-bottom: 0;"><strong>النسبة من التركة:</strong>
              <ul style="margin-top: 1px;">
                <li style="margin-right: 15px; list-style-type: circle;">${g.totalPercent}%</li>
              </ul>
            </li>
          </ul>
        </div>
      `;
    });
    
    groupsHtml += `
        </div>
      </div>
    `;
  }

  let printWindow = window.open("", "_blank");
  if (!printWindow) {
    window.print();
    return;
  }

  const printContent = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تقرير تقسيم ميراث الأرض - الدلال</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4 portrait; margin: 8mm 10mm 8mm 10mm; }
    body { font-family: 'Cairo', sans-serif; background: #ffffff; color: #222222; direction: rtl; font-size: 8.5pt; line-height: 1.3; padding-bottom: 15px; position: relative; }
    
    .report-header { border: 1.5px solid #1b5e20; border-radius: 8px; padding: 6px 12px; margin-bottom: 8px; display: grid; grid-template-columns: 1.2fr 2fr 1.2fr; align-items: center; background: #f1f8e9; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .report-header-right { text-align: right; }
    .report-header-right h1 { font-size: 15pt; color: #1b5e20; font-weight: 800; margin: 0; }
    .report-header-right p { font-size: 8.5pt; color: #388e3c; margin: 1px 0 0; font-weight: 600; }
    .report-header-center { text-align: center; padding: 0 10px; }
    .report-header-center h2 { font-size: 11pt; color: #1b5e20; font-weight: 700; margin: 0; line-height: 1.3; }
    .report-header-left { text-align: left; font-size: 8pt; color: #333; line-height: 1.4; }
    
    .owner-info { margin-bottom: 8px; font-size: 9pt; border-bottom: 1px dashed #ccc; padding-bottom: 3px; display: flex; gap: 8px; }
    .placeholder-line { color: #aaa; letter-spacing: 1px; }
    
    .section { margin-bottom: 8px; }
    .section-title { background: #1b5e20; color: white; font-weight: 700; font-size: 9pt; padding: 3px 10px; border-right: 5px solid #2e7d32; margin-bottom: 4px; border-radius: 4px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    
    .summary-box { border: 1.5px solid #d97706; border-radius: 6px; background: #fffbeb; padding: 8px 12px; display: flex; flex-direction: column; gap: 4px; -webkit-print-color-adjust: exact; print-color-adjust: exact; margin-bottom: 8px; }
    .summary-box h3 { font-size: 9.5pt; font-weight: 800; color: #d97706; margin-bottom: 2px; }
    .summary-box p { font-size: 8.5pt; color: #222; }
    .summary-box strong { color: #b45309; }
    
    table { width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 4px; }
    th { background: #e8f5e9; color: #1b5e20; font-weight: 700; border: 1px solid #1b5e20; padding: 4px 3px; text-align: center; white-space: nowrap; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    td { border: 1px solid #a5d6a7; padding: 3px; text-align: center; vertical-align: middle; }
    tr:nth-child(even) td { background: #f9fbe7; }
    
    .watermark-container { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-25deg); font-size: 26pt; font-weight: 800; color: #000000; opacity: 0.06; white-space: nowrap; pointer-events: none; z-index: -1000; font-family: 'Cairo', Arial, sans-serif; text-align: center; width: 100%; }
    .report-footer { margin-top: 15px; width: 100%; display: flex; flex-direction: column; align-items: center; text-align: center; font-size: 8pt; color: #64748b; border-top: 1.5px solid #cbd5e1; padding: 8px 10px 3px; background: white; gap: 2px; }
    .footer-main-text { font-size: 8pt; font-weight: bold; color: #64748b; }
    .footer-sub-text { font-size: 7.5pt; color: #94a3b8; }
    
    .page-break-inside-avoid { page-break-inside: avoid; }
    .no-print-btn { margin-top: 8px; padding: 6px 12px; background-color: #2e7d32; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; font-family: 'Cairo', sans-serif; }
    
    @media print {
      body { background: #fff !important; color: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .report-header { border-color: #000 !important; background: #fcfcfc !important; }
      .section-title { background: #000 !important; color: #fff !important; border-right-color: #333 !important; }
      th { background: #f2f2f2 !important; color: #000 !important; border-color: #000 !important; }
      td { border-color: #ccc !important; }
      .summary-box { border-color: #000 !important; background: #fff !important; }
      .report-footer { border-top-color: #000 !important; }
      .watermark-container { opacity: 0.05 !important; }
    }
  </style>
</head>
<body>

  <!-- Watermark -->
  <div class="watermark-container">تم تنفيذ هذا التقرير باستخدام تطبيق الدَّلاَّل لقياسات الأراضي، والمتوفر على Google Play.</div>

  <!-- Header -->
  <div class="report-header">
    <div class="report-header-right">
      <h1>الدَّلاَّل</h1>
      <p>تطبيق قياس وتقسيم الأراضي</p>
    </div>
    <div class="report-header-center">
      <h2>تقرير تقسيم ميراث الأرض الزراعية</h2>
    </div>
    <div class="report-header-left">
      <div><strong>تاريخ التقرير:</strong> ${dateStr}</div>
      <div><strong>وقت الطباعة:</strong> ${timeStr}</div>
      <div><strong>رقم التقرير:</strong> ${reportId}</div>
    </div>
  </div>

  <!-- Owner Info -->
  <div class="owner-info">
    <strong>اسم المورث / المالك:</strong>
    <span class="placeholder-line">................................................................................................</span>
  </div>

  <!-- 1. بيانات الأرض الإجمالية -->
  <div class="section page-break-inside-avoid">
    <div class="section-title">1. مساحة تركة الأرض الإجمالية</div>
    <table>
      <thead>
        <tr>
          <th>إجمالي المساحة بالأسهم</th>
          <th>سهم</th>
          <th>قيراط</th>
          <th>فدان</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-weight: bold; color: #1b5e20;">${totalAllShares} سهم</td>
          <td style="font-weight: bold;">${shareValue}</td>
          <td style="font-weight: bold;">${caratValue}</td>
          <td style="font-weight: bold;">${acreValue}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 2. الورثة المسجلون -->
  <div class="section page-break-inside-avoid" style="background: #fcfcfc; border: 1.5px solid #a5d6a7; border-radius: 6px; padding: 8px 12px; margin-bottom: 15px;">
    <div style="font-weight: bold; color: #1b5e20; font-size: 9.5pt; margin-bottom: 4px;">الورثة المسجلون وتفاصيلهم:</div>
    <div style="font-size: 9pt; color: #333;">
      عدد الزوجات: <strong>${numWivesValue}</strong> | عدد البنات: <strong>${numFemalesValue}</strong> | عدد الذكور (الأبناء): <strong>${numMalesValue}</strong>
    </div>
  </div>

  <!-- 3. جدول توزيع الميراث -->
  <div class="section">
    <div class="section-title">2. جدول توزيع أنصبة الورثة الشرعيين</div>
    <table>
      <thead>
        <tr>
          <th style="width: 15%;">النسبة الشرعية</th>
          <th>سهم</th>
          <th>قيراط</th>
          <th>فدان</th>
          <th style="text-align: right; padding-right: 15px; width: 25%;">القرابة</th>
          <th>حالة الجمع</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>

  ${groupsHtml}

  <!-- 4. خلاصة المجمع -->
  <div class="section page-break-inside-avoid">
    <div class="summary-box">
      <h3>خلاصة الورثة الذين تم جمع أنصبتهم معاً</h3>
      <p>الورثة المشمولون بالجمع: <strong>${checkedHeirsNames.length > 0 ? checkedHeirsNames.join(" ، ") : "لا يوجد"}</strong></p>
      <p>عدد الورثة المحددين: <strong>${checkedCount}</strong></p>
      <p>النسبة المئوية الإجمالية المجمعة: <strong>${totalCheckedPercent}</strong></p>
      <p>نصيبهم المجمع الكلي: <strong>${totalCheckedAcre} فدان و ${totalCheckedCarat} قيراط و ${totalCheckedShare} سهم</strong></p>
    </div>
  </div>

  <div class="no-print" style="text-align: center; margin-top: 20px;">
    <button class="no-print-btn" onclick="window.print()">بدء طباعة التقرير</button>
  </div>

  <!-- Fixed Footer -->
  <div class="report-footer">
    <div class="footer-main-text">تم تنفيذ هذا التقرير باستخدام تطبيق الدَّلاَّل لقياسات الأراضي، والمتوفر على Google Play.</div>
    <div class="footer-sub-text">
      <span>تطبيق الدَّلاَّل لقياسات الأراضي الزراعية © ${now.getFullYear()}</span>
      <span> | تاريخ الطباعة: ${dateStr} - ${timeStr}</span>
      <span> | إصدار التطبيق: v2.4</span>
    </div>
  </div>

</body>
</html>`;

  printWindow.document.write(printContent);
  printWindow.document.close();
}

function clearAllGroups() {
  if (mirasGroups.length === 0) {
    alert("لا توجد مجموعات لحذفها.");
    return;
  }
  if (confirm("هل تريد حذف جميع المجموعات والبدء من جديد؟")) {
    mirasGroups = [];
    saveGroupingData();
    calculateShares();
  }
}

window.toggleHelpModal = function(show) {
  let modal = document.getElementById("help-modal");
  if (modal) {
    modal.style.display = show ? "flex" : "none";
  }
};

window.downloadReportImage = function() {
  // Get all data from inputs
  let acreValue = parseInt(document.getElementById("txt_acre").value) || 0;
  let caratValue = parseInt(document.getElementById("txt_carat").value) || 0;
  let shareValue = parseFloat(document.getElementById("txt_share").value) || 0;
  let totalAllShares = document.getElementById("txt_TotalAllshare").value || 0;

  let numWivesValue = parseInt(document.getElementById("txt_numwives").value) || 0;
  let numFemalesValue = parseInt(document.getElementById("txt_numFemales").value) || 0;
  let numMalesValue = parseInt(document.getElementById("txt_numMales").value) || 0;

  // Retrieve heirs list
  let heirs = getHeirsList();
  let checkboxes = Array.from(document.querySelectorAll("#tbl_Results input[type=checkbox]"));
  
  let checkedHeirsNames = [];
  let tableRows = [];
  
  heirs.forEach((heir, idx) => {
    let cb = checkboxes[idx];
    let checked = cb ? cb.checked : false;
    let relationship = heir.name;
    if (checked) checkedHeirsNames.push(relationship);
    
    // Get row outputs
    let pct = "0%";
    let ac = "0", cr = "0", sh = "0";
    
    if (heir.id.startsWith("wife_")) {
      let i = parseInt(heir.id.split("_")[1]);
      pct = document.getElementById(`txt_PercentWives${i}`) ? document.getElementById(`txt_PercentWives${i}`).value : "0%";
      ac = document.getElementById(`txt_Wivesacre${i}`) ? document.getElementById(`txt_Wivesacre${i}`).value : "0";
      cr = document.getElementById(`txt_Wivescarat${i}`) ? document.getElementById(`txt_Wivescarat${i}`).value : "0";
      sh = document.getElementById(`txt_Wivesshare${i}`) ? document.getElementById(`txt_Wivesshare${i}`).value : "0";
    } else if (heir.id.startsWith("female_")) {
      let i = parseInt(heir.id.split("_")[1]);
      pct = document.getElementById(`txt_FemalesPercent${i}`) ? document.getElementById(`txt_FemalesPercent${i}`).value : "0%";
      ac = document.getElementById(`txt_Femalesacre${i}`) ? document.getElementById(`txt_Femalesacre${i}`).value : "0";
      cr = document.getElementById(`txt_Femalescarat${i}`) ? document.getElementById(`txt_Femalescarat${i}`).value : "0";
      sh = document.getElementById(`txt_Femalesshare${i}`) ? document.getElementById(`txt_Femalesshare${i}`).value : "0";
    } else if (heir.id.startsWith("male_")) {
      let i = parseInt(heir.id.split("_")[1]);
      pct = document.getElementById(`txt_malePercent${i}`) ? document.getElementById(`txt_malePercent${i}`).value : "0%";
      ac = document.getElementById(`txt_malesacre${i}`) ? document.getElementById(`txt_malesacre${i}`).value : "0";
      cr = document.getElementById(`txt_malescarat${i}`) ? document.getElementById(`txt_malescarat${i}`).value : "0";
      sh = document.getElementById(`txt_malesshare${i}`) ? document.getElementById(`txt_malesshare${i}`).value : "0";
    } else if (heir.id === "leftover_0") {
      pct = document.getElementById("txt_leftPercent") ? document.getElementById("txt_leftPercent").value : "0%";
      ac = document.getElementById("txt_leftacre") ? document.getElementById("txt_leftacre").value : "0";
      cr = document.getElementById("txt_leftscarat") ? document.getElementById("txt_leftscarat").value : "0";
      sh = document.getElementById("txt_leftshare") ? document.getElementById("txt_leftshare").value : "0";
    }
    
    tableRows.push({
      pct: pct,
      sh: sh,
      cr: cr,
      ac: ac,
      relationship: relationship,
      status: checked ? "مشمول بالجمع" : "غير مشمول"
    });
  });

  let totalCheckedAcre = document.getElementById("txt_Totalsacre") ? document.getElementById("txt_Totalsacre").value : "0";
  let totalCheckedCarat = document.getElementById("txt_Totalcarat") ? document.getElementById("txt_Totalcarat").value : "0";
  let totalCheckedShare = document.getElementById("txt_Totalshare") ? document.getElementById("txt_Totalshare").value : "0";
  let totalCheckedPercent = document.getElementById("txt_TotalPercentVal") ? document.getElementById("txt_TotalPercentVal").value : "0%";
  let checkedCount = document.getElementById("checkboxCount") ? document.getElementById("checkboxCount").innerHTML : "0";

  // Create offscreen canvas
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  
  // Calculate dynamic canvas height
  let currentY = 20;
  
  let headerHeight = 130;
  let ownerInfoHeight = 60;
  let sec1Height = 150;
  let secHeirsDetailHeight = 60;
  let sec2Height = 45 + (tableRows.length * 35) + 30; // headers + rows + spacing
  
  let secGroupsHeight = 0;
  if (mirasGroups && mirasGroups.length > 0) {
    let rowsCount = Math.ceil(mirasGroups.length / 2);
    secGroupsHeight = 45 + (rowsCount * 170) + 30;
  }
  
  let sec3Height = 140 + 30; // summary + margin
  let footerHeight = 100;
  
  canvas.height = currentY + headerHeight + ownerInfoHeight + sec1Height + secHeirsDetailHeight + sec2Height + secGroupsHeight + sec3Height + footerHeight + 40;

  const ctx = canvas.getContext("2d");
  
  // Draw clean white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw green main border
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#1b5e20";
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  
  // Setup standard fonts and configurations
  const fontCairo = (weight, size) => `${weight} ${size}px Cairo, Arial, sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  
  // 1. Draw header card
  let hY = 25;
  ctx.fillStyle = "#f1f8e9";
  ctx.fillRect(25, hY, canvas.width - 50, 110);
  ctx.strokeStyle = "#1b5e20";
  ctx.lineWidth = 2;
  ctx.strokeRect(25, hY, canvas.width - 50, 110);
  
  // Header text
  ctx.fillStyle = "#1b5e20";
  ctx.font = fontCairo("800", 28);
  ctx.fillText("الدَّلاَّل لقياس وتقسيم الأراضي", canvas.width - 50, hY + 40);
  ctx.font = fontCairo("bold", 18);
  ctx.fillText("تقرير تقسيم ميراث الأرض الزراعية", canvas.width - 50, hY + 75);
  
  // Date and report info on the left
  const now = new Date();
  const dateStr = now.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  ctx.textAlign = "left";
  ctx.fillStyle = "#333333";
  ctx.font = fontCairo("600", 12);
  ctx.fillText(`تاريخ التقرير: ${dateStr}`, 50, hY + 30);
  ctx.fillText(`رقم التقرير: DL-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`, 50, hY + 55);
  ctx.fillText("إصدار التطبيق: v2.4", 50, hY + 80);
  
  currentY = hY + 110 + 20;
  
  // 2. Owner name block
  ctx.textAlign = "right";
  ctx.fillStyle = "#222222";
  ctx.font = fontCairo("bold", 15);
  ctx.fillText("اسم المورث / المالك: ..................................................................................................", canvas.width - 25, currentY + 20);
  currentY += 50;

  // Helper function to draw sections titles
  function drawSectionTitle(title, y) {
    ctx.fillStyle = "#1b5e20";
    ctx.fillRect(25, y, canvas.width - 50, 30);
    ctx.fillStyle = "#ffcc80";
    ctx.fillRect(canvas.width - 32, y, 7, 30);
    
    ctx.fillStyle = "#ffffff";
    ctx.font = fontCairo("bold", 14);
    ctx.fillText(title, canvas.width - 45, y + 15);
  }
  
  // 3. Section 1: Total land area
  drawSectionTitle("1. مساحة تركة الأرض الإجمالية", currentY);
  currentY += 40;
  
  let tbl1X = 25;
  let tbl1W = canvas.width - 50;
  ctx.fillStyle = "#e8f5e9";
  ctx.fillRect(tbl1X, currentY, tbl1W, 35);
  ctx.strokeStyle = "#1b5e20";
  ctx.lineWidth = 1;
  ctx.strokeRect(tbl1X, currentY, tbl1W, 35);
  
  // Headers
  ctx.fillStyle = "#1b5e20";
  ctx.font = fontCairo("bold", 12);
  let colWidth = tbl1W / 4;
  ctx.textAlign = "center";
  ctx.fillText("إجمالي المساحة بالأسهم", tbl1X + colWidth * 3 + colWidth/2, currentY + 17);
  ctx.fillText("سهم", tbl1X + colWidth * 2 + colWidth/2, currentY + 17);
  ctx.fillText("قيراط", tbl1X + colWidth * 1 + colWidth/2, currentY + 17);
  ctx.fillText("فدان", tbl1X + colWidth * 0 + colWidth/2, currentY + 17);
  
  // Values row
  currentY += 35;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(tbl1X, currentY, tbl1W, 35);
  ctx.strokeRect(tbl1X, currentY, tbl1W, 35);
  for(let i=1; i<4; i++){
    ctx.beginPath();
    ctx.moveTo(tbl1X + colWidth*i, currentY - 35);
    ctx.lineTo(tbl1X + colWidth*i, currentY + 35);
    ctx.stroke();
  }
  ctx.fillStyle = "#1b5e20";
  ctx.font = fontCairo("bold", 13);
  ctx.fillText(`${totalAllShares} سهم`, tbl1X + colWidth * 3 + colWidth/2, currentY + 17);
  ctx.fillStyle = "#222222";
  ctx.font = fontCairo("600", 13);
  ctx.fillText(shareValue, tbl1X + colWidth * 2 + colWidth/2, currentY + 17);
  ctx.fillText(caratValue, tbl1X + colWidth * 1 + colWidth/2, currentY + 17);
  ctx.fillText(acreValue, tbl1X + colWidth * 0 + colWidth/2, currentY + 17);
  
  currentY += 35 + 20;
  
  // 4. Family stats tag
  ctx.fillStyle = "#fcfcfc";
  ctx.fillRect(25, currentY, canvas.width - 50, 40);
  ctx.strokeStyle = "#a5d6a7";
  ctx.strokeRect(25, currentY, canvas.width - 50, 40);
  ctx.fillStyle = "#1b5e20";
  ctx.font = fontCairo("bold", 12);
  ctx.textAlign = "right";
  ctx.fillText(`الورثة المسجلون وتفاصيلهم:   عدد الزوجات: ${numWivesValue}   |   عدد البنات: ${numFemalesValue}   |   عدد الذكور (الأبناء): ${numMalesValue}`, canvas.width - 45, currentY + 20);
  
  currentY += 40 + 20;
  
  // 5. Section 2: Heirs detailed shares
  drawSectionTitle("2. جدول توزيع أنصبة الورثة الشرعيين", currentY);
  currentY += 40;
  
  let colWidths = [120, 100, 100, 100, 200, 130];
  let totalTblW = colWidths.reduce((a, b) => a + b, 0);
  let startTblX = (canvas.width - totalTblW) / 2;
  
  ctx.fillStyle = "#e8f5e9";
  ctx.fillRect(startTblX, currentY, totalTblW, 35);
  ctx.strokeStyle = "#1b5e20";
  ctx.strokeRect(startTblX, currentY, totalTblW, 35);
  
  let headerTexts = ["النسبة الشرعية", "سهم", "قيراط", "فدان", "القرابة", "حالة الجمع"];
  let curX = startTblX;
  ctx.font = fontCairo("bold", 11);
  ctx.fillStyle = "#1b5e20";
  ctx.textAlign = "center";
  
  for(let i=0; i<6; i++) {
    ctx.fillText(headerTexts[i], curX + colWidths[i]/2, currentY + 17);
    curX += colWidths[i];
  }
  
  // Populate rows
  tableRows.forEach((row, rIdx) => {
    currentY += 35;
    ctx.fillStyle = (rIdx % 2 === 0) ? "#ffffff" : "#f9fbe7";
    ctx.fillRect(startTblX, currentY, totalTblW, 35);
    ctx.strokeStyle = "#a5d6a7";
    ctx.strokeRect(startTblX, currentY, totalTblW, 35);
    
    let vals = [row.pct, row.sh, row.cr, row.ac, row.relationship, row.status];
    let rowX = startTblX;
    
    for(let i=0; i<6; i++) {
      if (i > 0) {
        ctx.beginPath();
        ctx.moveTo(rowX, currentY);
        ctx.lineTo(rowX, currentY + 35);
        ctx.stroke();
      }
      ctx.fillStyle = (i === 0 || i === 4) ? "#1b5e20" : "#222222";
      ctx.font = (i === 0 || i === 4) ? fontCairo("bold", 12) : fontCairo("600", 12);
      ctx.fillText(vals[i], rowX + colWidths[i]/2, currentY + 17);
      rowX += colWidths[i];
    }
  });
  
  currentY += 35 + 25;
  
  // 6. Section 3: Selected Groups (if any)
  if (mirasGroups && mirasGroups.length > 0) {
    drawSectionTitle("📁 المجموعات المختارة", currentY);
    currentY += 40;
    
    let cardW = (canvas.width - 50 - 10) / 2;
    
    mirasGroups.forEach((g, gIdx) => {
      let row = Math.floor(gIdx / 2);
      let col = gIdx % 2;
      let cX = 25 + col * (cardW + 10);
      let cY = currentY + row * 170;
      
      ctx.fillStyle = "#fafafa";
      ctx.fillRect(cX, cY, cardW, 160);
      ctx.strokeStyle = "#ccc";
      ctx.lineWidth = 1;
      ctx.strokeRect(cX, cY, cardW, 160);
      
      ctx.fillStyle = "#e8f5e9";
      ctx.fillRect(cX, cY, cardW, 30);
      ctx.strokeStyle = "#a5d6a7";
      ctx.strokeRect(cX, cY, cardW, 30);
      
      ctx.fillStyle = "#1b5e20";
      ctx.font = fontCairo("bold", 12);
      ctx.textAlign = "right";
      ctx.fillText(`📁 ${g.name}`, cX + cardW - 10, cY + 15);
      
      let memberNames = g.members.map(memberId => {
        let heir = heirs.find(h => h.id === memberId);
        return heir ? heir.name : memberId;
      });
      
      ctx.fillStyle = "#333333";
      ctx.font = fontCairo("600", 11);
      ctx.fillText(`الأعضاء: ${memberNames.join(" ، ")}`, cX + cardW - 15, cY + 47);
      ctx.fillText(`عدد الأعضاء: ${g.members.length}`, cX + cardW - 15, cY + 74);
      ctx.fillText(`إجمالي المساحة: ${g.totalArea.acre} فدان ، ${g.totalArea.carat} قيراط ، ${g.totalArea.share} سهم`, cX + cardW - 15, cY + 101);
      ctx.fillText(`النسبة من التركة: ${g.totalPercent}%`, cX + cardW - 15, cY + 128);
    });
    
    let rowsCount = Math.ceil(mirasGroups.length / 2);
    currentY += (rowsCount * 170) + 15;
  }
  
  // 7. Section 4: Summary Box
  ctx.fillStyle = "#fffbeb";
  ctx.fillRect(25, currentY, canvas.width - 50, 110);
  ctx.strokeStyle = "#d97706";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(25, currentY, canvas.width - 50, 110);
  
  ctx.fillStyle = "#d97706";
  ctx.font = fontCairo("bold", 14);
  ctx.textAlign = "right";
  ctx.fillText("خلاصة الورثة الذين تم جمع أنصبتهم معاً", canvas.width - 45, currentY + 22);
  
  ctx.fillStyle = "#222222";
  ctx.font = fontCairo("600", 12);
  ctx.fillText(`الورثة المشمولون بالجمع:  ${checkedHeirsNames.length > 0 ? checkedHeirsNames.join(" ، ") : "لا يوجد"}`, canvas.width - 45, currentY + 48);
  ctx.fillText(`عدد الورثة المحددين:  ${checkedCount}  |  النسبة المئوية الإجمالية المجمعة:  ${totalCheckedPercent}`, canvas.width - 45, currentY + 73);
  ctx.fillText(`نصيبهم المجمع الكلي:  ${totalCheckedAcre} فدان و ${totalCheckedCarat} قيراط و ${totalCheckedShare} سهم`, canvas.width - 45, currentY + 95);
  
  currentY += 110 + 25;
  
  // 8. Footer watermark
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(25, currentY);
  ctx.lineTo(canvas.width - 25, currentY);
  ctx.stroke();
  
  ctx.textAlign = "center";
  ctx.fillStyle = "#64748b";
  ctx.font = fontCairo("bold", 11);
  ctx.fillText("تم تنفيذ هذا التقرير باستخدام تطبيق الدَّلاَّل لقياسات الأراضي، والمتوفر على Google Play.", canvas.width / 2, currentY + 20);
  ctx.font = fontCairo("500", 10);
  ctx.fillText(`تطبيق الدَّلاَّل لقياسات الأراضي الزراعية © ${now.getFullYear()} | رقم التقرير: DL-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`, canvas.width / 2, currentY + 40);

  // Export blob and trigger download/share
  canvas.toBlob(function(blob) {
    if (!blob) {
      alert("فشل إنشاء صورة التقرير.");
      return;
    }
    const filename = `تقرير_ميراث_الدلال_${Date.now()}.png`;
    
    if (navigator.canShare && navigator.canShare({ files: [new File([blob], filename, { type: 'image/png' })] })) {
      navigator.share({
        files: [new File([blob], filename, { type: 'image/png' })],
        title: 'تقرير ميراث الأرض الزراعية',
        text: 'تقرير توزيع الميراث وتجميع الورثة من تطبيق الدلال'
      }).catch(() => {
        triggerBlobDownload(blob, filename);
      });
    } else {
      triggerBlobDownload(blob, filename);
    }
  }, "image/png");
};

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
