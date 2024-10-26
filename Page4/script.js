// Load data from sessionStorage when the page loads
window.onload = function () {
  loadData();
};

// Function to save input field data to sessionStorage
function saveData() {
  sessionStorage.setItem(
    "shares",
    document.getElementById("input-shares").value
  );
  sessionStorage.setItem("carat", document.getElementById("input-carat").value);
  sessionStorage.setItem("acre", document.getElementById("input-acre").value);
  sessionStorage.setItem(
    "shares_subtract",
    document.getElementById("shares-subtract-each-carat").value
  );
  sessionStorage.setItem(
    "shares_sold",
    document.getElementById("input-shares-sold").value
  );
  sessionStorage.setItem(
    "carat_sold",
    document.getElementById("input-carat-sold").value
  );
  sessionStorage.setItem(
    "acre_sold",
    document.getElementById("input-acre-sold").value
  );
}

// Function to retrieve and set input field data from sessionStorage
function loadData() {
  document.getElementById("input-shares").value =
    sessionStorage.getItem("shares") || "";
  document.getElementById("input-carat").value =
    sessionStorage.getItem("carat") || "";
  document.getElementById("input-acre").value =
    sessionStorage.getItem("acre") || "";
  document.getElementById("shares-subtract-each-carat").value =
    sessionStorage.getItem("shares_subtract") || "";
  document.getElementById("input-shares-sold").value =
    sessionStorage.getItem("shares_sold") || "";
  document.getElementById("input-carat-sold").value =
    sessionStorage.getItem("carat_sold") || "";
  document.getElementById("input-acre-sold").value =
    sessionStorage.getItem("acre_sold") || "";

  calculateValues();
}

// Add event listeners to save data on input change
document.getElementById("input-shares").addEventListener("input", saveData);
document.getElementById("input-carat").addEventListener("input", saveData);
document.getElementById("input-acre").addEventListener("input", saveData);
document
  .getElementById("shares-subtract-each-carat")
  .addEventListener("input", saveData);
document
  .getElementById("input-shares-sold")
  .addEventListener("input", saveData);
document.getElementById("input-carat-sold").addEventListener("input", saveData);
document.getElementById("input-acre-sold").addEventListener("input", saveData);

function convertSharesToThree(shares) {
  // Check if the input value is negative
  let isNegative = shares < 0;
  if (isNegative) {
    // Convert shares to positive for calculation
    shares = Math.abs(shares);
  }

  let acre = Math.floor(shares / (24 * 24));
  shares -= acre * 24 * 24;

  let carat = Math.floor(shares / 24);
  shares -= carat * 24;

  // Convert acre, carat, and shares back to negative if the original input was negative
  if (isNegative) {
    acre = -acre;
    carat = -carat;
    shares = -shares;
  }

  return [acre, carat, shares.toFixed(2)];
}

function calculateValues() {
  // Get input values or set to 0 if empty
  let sharesInput =
    parseFloat(document.getElementById("input-shares").value) || 0;
  let caratInput =
    parseFloat(document.getElementById("input-carat").value) || 0;
  let acreInput = parseFloat(document.getElementById("input-acre").value) || 0;
  let totalShares = sharesInput + caratInput * 24 + acreInput * 24 * 24;
  console.log("totalShares:", totalShares);

  let inputSharesSold =
    parseFloat(document.getElementById("input-shares-sold").value) || 0;
  let inputCaratsSold =
    parseFloat(document.getElementById("input-carat-sold").value) || 0;
  let inputAcresSold =
    parseFloat(document.getElementById("input-acre-sold").value) || 0;
  let totalSharesSold =
    inputSharesSold + inputCaratsSold * 24 + inputAcresSold * 24 * 24;
  console.log("totalSharesSold:", totalSharesSold);

  // Convert input shares to total shares

  // Calculate total shares of subtract
  let sharesToSubtract =
    parseFloat(document.getElementById("shares-subtract-each-carat").value) ||
    0;
  let totalSharesOfSubtract = sharesToSubtract * (totalShares / 24);
  console.log("totalSharesOfSubtract:", totalSharesOfSubtract);

  let totalShareAfterSubtract = totalShares - totalSharesOfSubtract;
  console.log("totalShareAfterSubtract:", totalShareAfterSubtract);

  // Get elements by their IDs
  let [acre, carat, shares] = convertSharesToThree(totalSharesOfSubtract);
  document.getElementById("subtracted-acre").textContent = acre;
  document.getElementById("subtracted-shares").textContent = shares;
  document.getElementById("subtracted-carat").textContent = carat;

  [acre, carat, shares] = convertSharesToThree(totalShareAfterSubtract);
  document.getElementById("acre-after-subtract").textContent = acre;
  document.getElementById("shares-after-subtract").textContent = shares;
  document.getElementById("carat-after-subtract").textContent = carat;

  let sharesSoldMinusSharesAfter = totalShareAfterSubtract - totalSharesSold;
  console.log("sharesSoldMinusSharesAfter:", sharesSoldMinusSharesAfter);

  // Save the IDs in variables
  const acreSoldMinusAfterSubtractElement = document.getElementById(
    "acre-sold-minus-after-subtract"
  );
  const sharesSoldMinusAfterSubtractElement = document.getElementById(
    "shares-sold-minus-after-subtract"
  );
  const caratSoldMinusAfterSubtractElement = document.getElementById(
    "carat-sold-minus-after-subtract"
  );

  [acre, carat, shares] = convertSharesToThree(sharesSoldMinusSharesAfter);
  acreSoldMinusAfterSubtractElement.textContent = acre;
  sharesSoldMinusAfterSubtractElement.textContent = shares;
  caratSoldMinusAfterSubtractElement.textContent = carat;

  // Use ternary operator to set the color based on the value being negative or positive
  acreSoldMinusAfterSubtractElement.style.color =
    acreSoldMinusAfterSubtractElement.textContent < 0 ? "red" : "black";
  sharesSoldMinusAfterSubtractElement.style.color =
    sharesSoldMinusAfterSubtractElement.textContent < 0 ? "red" : "black";
  caratSoldMinusAfterSubtractElement.style.color =
    caratSoldMinusAfterSubtractElement.textContent < 0 ? "red" : "black";
}

function clearAll() {
  // Store the IDs of input and output fields
  const inputFieldIDs = [
    "input-shares",
    "input-carat",
    "input-acre",
    "input-shares-sold",
    "input-carat-sold",
    "input-acre-sold",
    "shares-subtract-each-carat",
  ];

  const outputFieldIDs = [
    "subtracted-acre",
    "subtracted-shares",
    "subtracted-carat",
    "acre-after-subtract",
    "shares-after-subtract",
    "carat-after-subtract",
    "acre-sold-minus-after-subtract",
    "shares-sold-minus-after-subtract",
    "carat-sold-minus-after-subtract",
  ];
  // Clear input fields
  inputFieldIDs.forEach((id) => {
    document.getElementById(id).value = "";
  });

  // Clear output fields
  outputFieldIDs.forEach((id) => {
    document.getElementById(id).textContent = "0";
  });

  saveData();
}
