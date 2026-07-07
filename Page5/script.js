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
  let printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>تقرير تقسيم ميراث الأرض</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
        body {
          font-family: 'Cairo', sans-serif;
          margin: 40px 20px;
          color: #000;
          background: #fff;
          position: relative;
        }
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-25deg);
          font-size: 26px;
          font-weight: 800;
          color: rgba(0, 0, 0, 0.05);
          width: 80%;
          text-align: center;
          pointer-events: none;
          z-index: -1;
          line-height: 1.6;
          direction: rtl;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px double #1b5e20;
          padding-bottom: 15px;
        }
        .header h1 {
          font-size: 24px;
          color: rgb(149, 11, 36);
          margin: 0 0 10px 0;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 16px;
          font-weight: 800;
          color: #1b5e20;
          border-right: 4px solid #1b5e20;
          padding-right: 8px;
          margin-bottom: 15px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px;
          text-align: center;
          font-size: 14px;
        }
        th {
          background-color: #f2f2f2;
          font-weight: 800;
        }
        .result-box {
          background-color: #fffbeb;
          border: 2px solid #d97706;
          border-radius: 8px;
          padding: 15px;
          margin-top: 20px;
        }
        .result-box h3 {
          margin: 0 0 10px 0;
          color: #d97706;
          font-size: 16px;
          font-weight: 800;
        }
        .result-box p {
          margin: 5px 0;
          font-size: 15px;
          font-weight: 700;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          border-top: 1px solid #ccc;
          padding-top: 15px;
          color: #333;
        }
        @media print {
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="watermark">
        تم تنفيذ هذا التقرير باستخدام تطبيق الدَّلاَّل لقياسات الأراضي، والمتوفر على Google Play.<br>
        تقسيم ميراث الأراضي الزراعية
      </div>
      
      <div class="header">
        <h1>تقرير تقسيم ميراث الأرض الزراعية</h1>
        <p>تطبيق الدَّلاَّل لقياسات الأراضي</p>
      </div>

      <div class="section">
        <div class="section-title">بيانات الأرض الإجمالية</div>
        <table>
          <thead>
            <tr>
              <th>فدان</th>
              <th>قيراط</th>
              <th>سهم</th>
              <th>إجمالي المساحة بالأسهم</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${acreValue}</td>
              <td>${caratValue}</td>
              <td>${shareValue}</td>
              <td><strong>${totalAllShares} سهم</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">الورثة المسجلون</div>
        <p>عدد الزوجات: ${numWivesValue} | عدد البنات: ${numFemalesValue} | عدد الذكور: ${numMalesValue}</p>
      </div>

      <div class="section">
        <div class="section-title">جدول توزيع الميراث</div>
        <table>
          <thead>
            <tr>
              <th>النسبة</th>
              <th>فدان</th>
              <th>قيراط</th>
              <th>سهم</th>
              <th>القرابة</th>
              <th>حالة التحديد</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>

      <div class="result-box">
        <h3>خلاصة الورثة الذين تم جمع أنصبتهم معاً</h3>
        <p><strong>الورثة المشمولون بالجمع:</strong> ${checkedHeirsNames.length > 0 ? checkedHeirsNames.join(" ، ") : "لا يوجد"}</p>
        <p><strong>عدد الورثة المحددين:</strong> ${checkedCount}</p>
        <p><strong>النسبة المئوية الإجمالية المجمعة:</strong> ${totalCheckedPercent}</p>
        <p><strong>نصيبهم المجمع الكلي:</strong> ${totalCheckedAcre} فدان و ${totalCheckedCarat} قيراط و ${totalCheckedShare} سهم</p>
      </div>

      <div class="footer">
        تم تنفيذ هذا التقرير باستخدام تطبيق الدَّلاَّل لقياسات الأراضي، والمتوفر على Google Play.
      </div>
      
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
