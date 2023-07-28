// resize event listener to detect change in screen height
let input = document.querySelector("input");
let nav = document.querySelector(".nav");
// let deviceHeight = window.innerHeight;
// window.addEventListener("click", ()=>{
//   if(window.innerHeight != deviceHeight){
//     nav.style.display = "none"
//   }
// })
window.visualViewport.addEventListener("resize", () =>
  window.getComputedStyle(nav).display == "none"
    ? (nav.style.display = "flex")
    : window.getComputedStyle(nav).display == "flex"
    ? (nav.style.display = "none")
    : ""
);
