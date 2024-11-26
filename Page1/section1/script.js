let width1 = document.querySelector(".input-s1 input");
let width2 = document.querySelector(".input-s2 input");
let height = document.querySelector(".input-s3 input");
let area1 = document.querySelector(".selector1");
let area2 = document.querySelector(".selector2");
let price = document.getElementById("numericValue");
let average_result = document.querySelector("#average-result");
let totalArea_result = document.querySelector("#totalArea-result");
let price_result = document.querySelector("#price-result");
let area_result1 = document.querySelector("#area-result1");
let area_result2 = document.querySelector("#area-result2");
let area_result3 = document.querySelector("#area-result3");
let width1_result = document.querySelectorAll(".width1_result");
let width2_result = document.querySelectorAll(".width2_result");
let height_result = document.querySelectorAll(".height_result");

// Load data from sessionStorage when the page loads
window.onload = function () {
  loadData();
  calculate();
};

document.addEventListener("DOMContentLoaded", function () {
  loadData();
  calculate();
});

// Function to save input field data to sessionStorage
function saveData() {
  sessionStorage.setItem("width1", width1.value);
  sessionStorage.setItem("width2", width2.value);
  sessionStorage.setItem("height", height.value);
  sessionStorage.setItem("area1", area1.value);
  sessionStorage.setItem("area2", area2.value);
  sessionStorage.setItem("price", price.value);
}

// Function to retrieve and set input field data from sessionStorage
function loadData() {
  width1.value = sessionStorage.getItem("width1") || "";
  width2.value = sessionStorage.getItem("width2") || "";
  height.value = sessionStorage.getItem("height") || "";
  area1.value = sessionStorage.getItem("area1") || "";
  area2.value = sessionStorage.getItem("area2") || "168";
  price.value = sessionStorage.getItem("price") || "";
}

// Add event listeners to save data on input change
width1.addEventListener("input", saveData);
width2.addEventListener("input", saveData);
height.addEventListener("input", saveData);
area1.addEventListener("change", saveData);
area2.addEventListener("input", saveData);
price.addEventListener("input", saveData);

width1.addEventListener("input", calculate);
width2.addEventListener("input", calculate);
height.addEventListener("input", calculate);
area1.addEventListener("change", calculate);
area2.addEventListener("input", calculate);
price.addEventListener("input", calculate);

Number.prototype.toFixedNoRounding = function (n) {
  const reg = new RegExp("^-?\\d+(?:\\.\\d{0," + n + "})?", "g");
  const a = this.toString().match(reg)[0];
  const dot = a.indexOf(".");
  if (dot === -1) {
    // integer, insert decimal dot and pad up zeros
    return a + "." + "0".repeat(n);
  }
  const b = n - (a.length - dot) + 1;
  return b > 0 ? a + "0".repeat(b) : a;
};

function last(type, num) {
  let number = (type.value * 100) / 14.7916666667 / 24;
  let num1 = Math.floor(number);
  let num2 = Math.floor(getfloor(number) * 24);
  let num3 = getfloor(getfloor(number) * 24).toFixed(2);
  return num == "num3"
    ? num1 || 0
    : num == "num2"
    ? num2 || 0
    : num == "num1"
    ? num3 || 0
    : "";
}

function other() {
  if (area1.options[area1.selectedIndex].text != "اخر") {
    area2.value = area1.options[area1.selectedIndex].text;
  } else {
    area2.value = "";
  }
}

function average() {
  return (+width1.value + +width2.value) / 2;
}
function totalArea() {
  return average() * height.value;
}
function result() {
  return totalArea() / area2.value;
}
function acre() {
  return result() / 24;
}
function getfloor(num) {
  let tostr = num.toString();
  if (tostr.includes(".")) {
    let result = tostr.slice(tostr.indexOf("."));
    return Number(result);
  } else {
    return 0;
  }
}
function carats() {
  return getfloor(acre()) * 24;
}
function shares() {
  return getfloor(carats()) * 24;
}
function getprice() {
  return price.value * result();
}
function isFull() {
  width1_num1 = last(width1, "num1");
  width1_num2 = last(width1, "num2");
  width1_num3 = last(width1, "num3");
  width2_num1 = last(width2, "num1");
  width2_num2 = last(width2, "num2");
  width2_num3 = last(width2, "num3");
  height_num1 = last(height, "num1");
  height_num2 = last(height, "num2");
  height_num3 = last(height, "num3");
  if (width1_num1 == 1) {
    width1_num3 += 1;
    width1_num2 = 0;
    width1_num1 = 0;
  }
  if (width2_num1 == 1) {
    width2_num3 += 1;
    width2_num2 = 0;
    width2_num1 = 0;
  }
  if (height_num1 == 1) {
    height_num3 += 1;
    height_num2 = 0;
    height_num1 = 0;
  }
  width1_result[0].innerText = width1_num1;
  width1_result[1].innerText = width1_num2;
  width1_result[2].innerText = width1_num3;
  width2_result[0].innerText = width2_num1;
  width2_result[1].innerText = width2_num2;
  width2_result[2].innerText = width2_num3;
  height_result[0].innerText = height_num1;
  height_result[1].innerText = height_num2;
  height_result[2].innerText = height_num3;
}

function calculate() {
  totalArea_result.innerText = (totalArea() || 0).toFixed(2);
  price_result.innerText = Math.floor(getprice() || 0).toLocaleString();
  area_result1.innerText = Math.floor(acre() || 0);
  area_result2.innerText = Math.floor(carats() || 0);
  area_result3.innerText = (shares() || 0).toFixedNoRounding(2);
  isFull();
}

function clearall() {
  let inputs = document.querySelectorAll("input");
  for (let i = 0; i < inputs.length; i++) {
    if (inputs[i].className == `selector2`) {
      continue;
    }
    inputs[i].value = "";
  }
  saveData();
  calculate();
}

function formatNumber(input) {
  // Remove non-digit characters for the hidden value
  const rawValue = input.value.replace(/\D/g, "");
  // Set the hidden input with the numeric value
  document.getElementById("numericValue").value = rawValue;
  // Format the displayed value with commas
  input.value = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
