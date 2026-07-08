function clearInputFields() {
  sessionStorage.setItem("acre", "");
  sessionStorage.setItem("carat", "");
  sessionStorage.setItem("share", "");
  sessionStorage.setItem("num_wives", "");
  sessionStorage.setItem("num_females", "");
  sessionStorage.setItem("num_males", "");
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
    tableWives += `
      <tr class="wife">
        <td><center><input type="input" id="txt_PercentWives${i}" style="width:100%" placeholder="0%" readonly></center></td>
        <td><center><input type="input" id="txt_Wivesacre${i}" style="width:100%" placeholder="0" readonly></center></td>
        <td><center><input type="input" id="txt_Wivescarat${i}" style="width:100%" placeholder="0" readonly></center></td>
        <td><center><input type="input" id="txt_Wivesshare${i}" style="width:100%" placeholder="0" readonly></center></td>
        <td><center><label style="font-weight:bold"> الزوجة ${
          i + 1
        } </label></center></td>
        <td><center><input type="checkbox" ${
          listOfCheckboxValues[i] ? "checked" : ""
        } onchange="calculateShares()"></center></td>
      </tr>
    `;
  }

  // Generating table rows for females
  let tableFemale = "";
  for (let i = 0; i < numFemalesValue; i++) {
    tableFemale += `
      <tr class="females">
        <td><center><input type="input" id="txt_FemalesPercent${i}" style="width:100%" placeholder="0%" readonly></center></td>
        <td><center><input type="input" id="txt_Femalesacre${i}" style="width:100%" placeholder="0" readonly></center></td>
        <td><center><input type="input" id="txt_Femalescarat${i}" style="width:100%" placeholder="0" readonly></center></td>
        <td><center><input type="input" id="txt_Femalesshare${i}" style="width:100%" placeholder="0" readonly></center></td>
        <td><center><label style="font-weight:bold"> البنت ${
          i + 1
        } </label></center></td>
        <td><center><input type="checkbox" ${
          listOfCheckboxValues[numWivesValue + i] ? "checked" : ""
        } onchange="calculateShares()"></center></td>
      </tr>
    `;
  }

  // Generating table rows for males
  let tableMale = "";
  for (let i = 0; i < numMalesValue; i++) {
    tableMale += `
      <tr class="sons">
        <td><center><input type="input" id="txt_malePercent${i}" style="width:100%" placeholder="0%" readonly></center></td>
        <td><center><input type="input" id="txt_malesacre${i}" style="width:100%" placeholder="0" readonly></center></td>
        <td><center><input type="input" id="txt_malescarat${i}" style="width:100%" placeholder="0" readonly></center></td>
        <td><center><input type="input" id="txt_malesshare${i}" style="width:100%" placeholder="0" readonly></center></td>
        <td><center><label style="font-weight:bold"> الأبن ${
          i + 1
        } </label></center></td>
        <td><center><input type="checkbox" ${
          listOfCheckboxValues[numWivesValue + numFemalesValue + i]
            ? "checked"
            : ""
        } onchange="calculateShares()"></center></td>
      </tr>
    `;
  }

  // Additional row if isSharesLeft is true
  let tableLeft = "";
  if (isSharesLeft) {
    tableLeft = `
      <tr>
        <td><center><input type="input" id="txt_leftPercent" style="width:100%" placeholder="0%" readonly></center></td>
        <td><center><input type="input" id="txt_leftacre" style="width:100%" placeholder="0" readonly></center></td>
        <td><center><input type="input" id="txt_leftscarat" style="width:100%" placeholder="0" readonly></center></td>
        <td><center><input type="input" id="txt_leftshare" style="width:100%" placeholder="0" readonly></center></td>
        <td><center><label style="font-weight:bold"> المتبقي </label></center></td>
        <td><center><input type="checkbox" ${
          listOfCheckboxValues[listOfCheckboxValues.length - 1] ? "checked" : ""
        } onchange="calculateShares()"></center></td>
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
  saveData();
}

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
        <td>${ac}</td>
        <td>${cr}</td>
        <td>${sh}</td>
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
        <td>${ac}</td>
        <td>${cr}</td>
        <td>${sh}</td>
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
        <td>${ac}</td>
        <td>${cr}</td>
        <td>${sh}</td>
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
        <td>${ac}</td>
        <td>${cr}</td>
        <td>${sh}</td>
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
    @page { size: A4 portrait; margin: 15mm 12mm 15mm 12mm; }
    body { font-family: 'Cairo', sans-serif; background: #ffffff; color: #222222; direction: rtl; font-size: 9.5pt; line-height: 1.4; padding-bottom: 45px; position: relative; }
    
    .report-header { border: 2px solid #1b5e20; border-radius: 10px; padding: 12px; margin-bottom: 12px; display: grid; grid-template-columns: 1.2fr 2fr 1.2fr; align-items: center; background: #f1f8e9; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .report-header-right { text-align: right; }
    .report-header-right h1 { font-size: 20pt; color: #1b5e20; font-weight: 800; margin: 0; }
    .report-header-right p { font-size: 9pt; color: #388e3c; margin: 2px 0 0; font-weight: 600; }
    .report-header-center { text-align: center; padding: 0 10px; }
    .report-header-center h2 { font-size: 12.5pt; color: #1b5e20; font-weight: 700; margin: 0; line-height: 1.4; }
    .report-header-left { text-align: left; font-size: 8pt; color: #333; line-height: 1.5; }
    
    .owner-info { margin-bottom: 15px; font-size: 10pt; border-bottom: 1px dashed #ccc; padding-bottom: 6px; display: flex; gap: 10px; }
    .placeholder-line { color: #aaa; letter-spacing: 1px; }
    
    .section { margin-bottom: 15px; }
    .section-title { background: #1b5e20; color: white; font-weight: 700; font-size: 10.5pt; padding: 5px 12px; border-right: 5px solid #2e7d32; margin-bottom: 8px; border-radius: 4px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    
    .summary-box { border: 2px solid #d97706; border-radius: 8px; background: #fffbeb; padding: 12px 15px; display: flex; flex-direction: column; gap: 6px; -webkit-print-color-adjust: exact; print-color-adjust: exact; margin-bottom: 15px; }
    .summary-box h3 { font-size: 11pt; font-weight: 800; color: #d97706; margin-bottom: 4px; }
    .summary-box p { font-size: 9.5pt; color: #222; }
    .summary-box strong { color: #b45309; }
    
    table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 8px; }
    th { background: #e8f5e9; color: #1b5e20; font-weight: 700; border: 1px solid #1b5e20; padding: 6px 4px; text-align: center; white-space: nowrap; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    td { border: 1px solid #a5d6a7; padding: 5px 4px; text-align: center; vertical-align: middle; }
    tr:nth-child(even) td { background: #f9fbe7; }
    
    .watermark-container { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-25deg); font-size: 26pt; font-weight: 800; color: #000000; opacity: 0.06; white-space: nowrap; pointer-events: none; z-index: -1000; font-family: 'Cairo', Arial, sans-serif; text-align: center; width: 100%; }
    .report-footer { position: fixed; bottom: 0; left: 0; width: 100%; display: flex; flex-direction: column; align-items: center; text-align: center; font-size: 8pt; color: #444; border-top: 1.5px solid #1b5e20; padding: 4px 10px 3px; background: white; gap: 1px; }
    .footer-main-text { font-size: 8.5pt; font-weight: 700; color: #222; }
    .footer-sub-text { font-size: 7.5pt; color: #888; }
    
    .page-break-inside-avoid { page-break-inside: avoid; }
    .no-print-btn { margin-top: 15px; padding: 10px 20px; background-color: #2e7d32; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; font-family: 'Cairo', sans-serif; }
    
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
          <th>فدان</th>
          <th>قيراط</th>
          <th>سهم</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-weight: bold; color: #1b5e20;">${totalAllShares} سهم</td>
          <td style="font-weight: bold;">${acreValue}</td>
          <td style="font-weight: bold;">${caratValue}</td>
          <td style="font-weight: bold;">${shareValue}</td>
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
          <th>فدان</th>
          <th>قيراط</th>
          <th>سهم</th>
          <th style="text-align: right; padding-right: 15px; width: 25%;">القرابة</th>
          <th>حالة الجمع</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>

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
