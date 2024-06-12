// JavaScript
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
    "carat_area",
    document.getElementById("input-carat-area").value
  );
  sessionStorage.setItem(
    "carat_price",
    document.getElementById("input-carat-price").value
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
  document.getElementById("input-carat-area").value =
    sessionStorage.getItem("carat_area") || "168";
  document.getElementById("input-carat-price").value =
    sessionStorage.getItem("carat_price") || "";
}

// Add event listeners to save data on input change
document.getElementById("input-shares").addEventListener("input", saveData);
document.getElementById("input-carat").addEventListener("input", saveData);
document.getElementById("input-acre").addEventListener("input", saveData);
document
  .getElementById("input-carat-area")
  .addEventListener("change", saveData);
document
  .getElementById("input-carat-price")
  .addEventListener("input", saveData);

// JavaScript
// JavaScript
function calculate() {
  // Get all the input values or set them to 0 if empty
  var shares = parseFloat(document.getElementById("input-shares").value) || 0;
  var carat = parseFloat(document.getElementById("input-carat").value) || 0;
  var acre = parseFloat(document.getElementById("input-acre").value) || 0;

  // Convert them to total shares
  var totalAllShares = acre * 24 * 24 + carat * 24 + shares;

  // Convert back to carats
  var caratValue = totalAllShares / 24;

  // Get the carat price
  var caratPrice =
    parseFloat(document.getElementById("input-carat-price").value) || 0;

  // Get the meter unit from the selection
  var meterUnit =
    parseFloat(document.getElementById("input-carat-area").value) ||
    parseFloat(document.getElementById("other-input-field").value) ||
    0;

  // Calculate result in square meters
  var resultInSquareMeter = (totalAllShares * meterUnit) / 24;

  // Calculate total price
  var totalPrice = resultInSquareMeter / caratPrice;
  console.log("totalPrice : ", totalPrice);

  // Update the result display
  document.getElementById("output-result-total-price").innerText =
    totalPrice.toFixed(2);
  document.getElementById("output-result-with-meter-squares").innerText =
    resultInSquareMeter.toFixed(3);

  let centimeters = caratPrice * 100;

  // Calculate and update output-reed, output-fist, and output-less-than-fist

  const reed = Math.floor(centimeters / 355);
  const remainingCentimetersAfterReed = centimeters % 355;
  const fist = Math.floor(remainingCentimetersAfterReed / 14.7916666667);
  const remainingInFist = remainingCentimetersAfterReed % 14.7916666667;
  const remainingInFistConverted = (
    remainingInFist *
    (1 / 14.7916666667)
  ).toFixed(2);

  document.getElementById("output-reed").innerText = reed;
  document.getElementById("output-fist").innerText = fist;
  document.getElementById("output-less-than-fist").innerText =
    remainingInFistConverted;

  let centimeters2 = totalPrice * 100;

  const reed2 = Math.floor(centimeters2 / 355);
  const remainingCentimetersAfterReed2 = centimeters2 % 355;
  const fist2 = Math.floor(remainingCentimetersAfterReed2 / 14.7916666667);
  const remainingInFist2 = remainingCentimetersAfterReed2 % 14.7916666667;
  const remainingInFistConverted2 = (
    remainingInFist2 *
    (1 / 14.7916666667)
  ).toFixed(2);

  document.getElementById("output-reed2").innerText = reed2;
  document.getElementById("output-fist2").innerText = fist2;
  document.getElementById("output-less-than-fist2").innerText =
    remainingInFistConverted2;
}
// JavaScript
function clearAll() {
  // Clear all the input fields used in the calculate function
  document.getElementById("input-shares").value = "";
  document.getElementById("input-carat").value = "";
  document.getElementById("input-acre").value = "";
  document.getElementById("input-carat-price").value = "";
  // document.getElementById("input-carat-area").value = "";

  // Clear the result displays
  document.getElementById("output-result-total-price").innerText = "0";
  document.getElementById("output-result-with-meter-squares").innerText = "0";
  document.getElementById("output-reed").innerText = "0";
  document.getElementById("output-fist").innerText = "0";
  document.getElementById("output-less-than-fist").innerText = "0.0";

  document.getElementById("output-less-than-fist2").innerText = "0.0";
  document.getElementById("output-fist2").innerText = "0.0";
  document.getElementById("output-reed2").innerText = "0.0";
  saveData();
}

function handleSelection() {
  var selectElement = document.getElementById("input-carat-area");
  var otherInputField = document.getElementById("other-input-field");

  if (selectElement.value === "0") {
    otherInputField.style.display = "block"; // Show the other input field
    otherInputField.focus();
  } else {
    otherInputField.style.display = "none"; // Hide the other input field
  }

  calculate();
}
