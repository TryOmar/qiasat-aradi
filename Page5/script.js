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
  calculateShares();
  calculate();
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
}

// Function to retrieve and set input field data from sessionStorage
function loadData() {
  document.getElementById("txt_acre").value =
    sessionStorage.getItem("acre") || "";
  document.getElementById("txt_carat").value =
    sessionStorage.getItem("carat") || "";
  document.getElementById("txt_share").value =
    sessionStorage.getItem("share") || "";
  document.getElementById("txt_numwives").value =
    sessionStorage.getItem("num_wives") || "";
  document.getElementById("txt_numFemales").value =
    sessionStorage.getItem("num_females") || "";
  document.getElementById("txt_numMales").value =
    sessionStorage.getItem("num_males") || "";
}

// Add event listeners to save data on input change
document.getElementById("txt_acre").addEventListener("input", saveData);
document.getElementById("txt_carat").addEventListener("input", saveData);
document.getElementById("txt_share").addEventListener("input", saveData);
document.getElementById("txt_numwives").addEventListener("input", saveData);
document.getElementById("txt_numFemales").addEventListener("input", saveData);
document.getElementById("txt_numMales").addEventListener("input", saveData);

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
  isSharesLeft = false
) {
  let tableHead = `
      <tr>
        <th>
          <label>النسبة</label>
        </th>
        <th>
          <label>فدان</label>
        </th>
        <th>
          <label>قيراط</label>
        </th>
        <th>
          <label>سهم</label>
        </th>
        <th>
          <label>القرابة</label>
        </th>
      </tr>
    `;

  let tableWives = "";
  for (let i = 0; i < numWivesValue; i++) {
    tableWives = tableWives.concat(`
      <tr class="wife">
        <td>
          <center>
            <input type="input" id="txt_PercentWives${i}" style="width:100%" placeholder="0%" readonly>
          </center>
        </td>
        <td>
          <center>
            <input type="input" id="txt_Wivesacre${i}" style="width:100%" placeholder="0" readonly>
          </center>
        </td>
        <td>
          <center>
            <input type="input" id="txt_Wivescarat${i}" style="width:100%" placeholder="0" readonly>
          </center>
        </td>
        <td>
          <center>
            <input type="input" id="txt_Wivesshare${i}" style="width:100%" placeholder="0" readonly>
          </center>
        </td>
        <td>
          <center>
            <label style="font-weight:bold"> الزوجة ${i + 1} </label>
          </center>
        </td>
      </tr>
      `);
  }

  let tableFemale = "";
  for (let i = 0; i < numFemalesValue; i++) {
    tableFemale = tableFemale.concat(`
    <tr class="females">
        <td>
          <center>
            <input type="input" id="txt_FemalesPercent${i}" style="width:100%" placeholder="0%" readonly>
          </center>
        </td>
        <td>
          <center>
            <input type="input" id="txt_Femalesacre${i}" style="width:100%" placeholder="0" readonly>
          </center>
        </td>
        <td>
          <center>
            <input type="input" id="txt_Femalescarat${i}" style="width:100%" placeholder="0" readonly>
          </center>
        </td>
        <td>
          <center>
            <input type="input" id="txt_Femalesshare${i}" style="width:100%" placeholder="0" readonly>
          </center>
        </td>
        <td>
          <center>
            <label style="font-weight:bold"> البنت ${i + 1}<label>
          </center>
        </td>
      </tr>
      `);
  }

  let tableMale = "";
  for (let i = 0; i < numMalesValue; i++) {
    tableMale = tableMale.concat(`
      <tr class="sons">
        <td>
          <center>
            <input type="input" id="txt_malePercent${i}" style="width:100%" placeholder="0%" readonly>
          </center>
        </td>
        <td>
          <center>
            <input type="input" id="txt_malesacre${i}" style="width:100%" placeholder="0" readonly>
          </center>
        </td>
        <td>
          <center>
            <input type="input" id="txt_malescarat${i}" style="width:100%" placeholder="0" readonly>
          </center>
        </td>
        <td>
          <center>
            <input type="input" id="txt_malesshare${i}" style="width:100%" placeholder="0" readonly>
          </center>
        </td>
        <td>
          <center>
            <label style="font-weight:bold"> الأبن ${i + 1}<label>
          </center>
        </td>
      </tr>
      `);
  }

  let tableLeft = "";
  if (isSharesLeft) {
    tableLeft = `
      <tr>
        <td>
          <center>
            <input type="input" id="txt_leftPercent" style="width:100%" placeholder="0%" readonly>
          </center>
        </td>
        <td>
          <center>
            <input type="input" id="txt_leftacre" style="width:100%" placeholder="0" readonly>
          </center>
        </td>
        <td>
          <center>
            <input type="input" id="txt_leftscarat" style="width:100%" placeholder="0" readonly>
          </center>
        </td>
        <td>
          <center>
            <input type="input" id="txt_leftshare" style="width:100%" placeholder="0" readonly>
          </center>
        </td>

        <td>
          <center>
            <label style="font-weight:bold"> المتبقي <label>
          </center>
        </td>
      </tr>

      `;
  }

  let tableFoot = `
      <tr class = "tableFooterTotal">
        <td>
          <center>
            <input type="input" id="txt_TotalPercentVal" style="width:100%" placeholder="0%" readonly>
          </center>
        </td>
        <td>
          <center>
            <input type="input" id="txt_Totalsacre" style="width:100%" placeholder="0" readonly>
          </center>
        </td>
        <td>
          <center>
            <input type="input" id="txt_Totalcarat" style="width:100%" placeholder="0" readonly> 
          </center>
        </td>
        <td>
          <center>
            <input type="input" id="txt_Totalshare" style="width:100%" placeholder="0" readonly>
          </center>
        </td>

        <td>
          <center>
            <label style="font-weight:bold"> الاجمالى <label>
          </center>
        </td>
      </tr>

    `;

  document.getElementById("tbl_Results").innerHTML =
    tableHead + tableWives + tableFemale + tableMale + tableLeft + tableFoot;
  // calculateShares();
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

function calculateShares() {
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

  const familyShares =
    numWivesValue * nasebZwga +
    numFemalesValue * nasebBnat +
    numMalesValue * nasebAbn;
  // console.log("nasebAbn:", nasebAbn);

  // console.log("----------------------------------------------");
  let totalSharesleft = totalAllShares - familyShares;
  isSharesLeft = totalSharesleft > 0 ? true : false;

  updateTables(numWivesValue, numFemalesValue, numMalesValue, isSharesLeft);

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

  const [totalAcre, totalCarat, totalShare] =
    calculateScaresAndCarats(totalAllShares);
  const totalPercentVal = calculatePercentage(totalAllShares, totalAllShares); // 100% of the total is itself

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

  document.getElementById("txt_Totalsacre").value = totalAcre;
  document.getElementById("txt_Totalcarat").value = totalCarat;
  document.getElementById("txt_Totalshare").value = totalShare;
  document.getElementById("txt_TotalPercentVal").value = totalPercentVal + "%";
}
