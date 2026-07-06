// Automatically load outdoor-mode.js dynamically from root
(function() {
  let root = "./";
  const scripts = document.querySelectorAll('script[src]');
  for (const s of scripts) {
    const m = s.src.match(/^(.*\/)nav\.js$/);
    if (m) {
      root = m[1];
      break;
    }
  }
  if (!document.getElementById("outdoor-mode-script-dynamic")) {
    const script = document.createElement("script");
    script.id = "outdoor-mode-script-dynamic";
    script.src = root + "outdoor-mode.js";
    document.head.appendChild(script);
  }
})();

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

window.addEventListener("load", () => {
  mainViewPort = screen.height;
});
// window.visualViewport.addEventListener("resize", () =>{
//   if(mainViewPort - screen.height >= 20){
//     nav.style.display = "none";
//   }else{
//     nav.style.display = "flex";
//   }
// });
