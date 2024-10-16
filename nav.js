// resize event listener to detect change in screen height
let input = document.querySelector("input");
let nav = document.querySelector(".nav");
// let deviceHeight = window.innerHeight;
// window.addEventListener("click", ()=>{
//   if(window.innerHeight != deviceHeight){
//     nav.style.display = "none"
//   }
// })


let mainViewPort;

window.onload = ()=>{
  mainViewPort = screen.height;
}
// window.visualViewport.addEventListener("resize", () =>{
//   if(mainViewPort - screen.height >= 20){
//     nav.style.display = "none";
//   }else{
//     nav.style.display = "flex";
//   }
// });
