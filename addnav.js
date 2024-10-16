document.body.style="margin:0px;"
let newNav = document.createElement("div");
newNav.style = "position: fixed; width: 100%; height: 60px; background-color: rgb(168,255,146); bottom: 0px; display: flex; flex-flow: row-reverse; justify-content: space-around; align-items: center; box-sizing: border-box;margin:0px;"
newNav.className = "nav";
newNav.setAttribute("dir", "rtl");
let url_nav = location.pathname.split("Ard");
let path_nav = url_nav[url_nav.length - 1];
let result_nav = "";
for(let i = 1;i < countCharOccurrences(path_nav, "/"); i++){
    result_nav+= "../"
}
console.log(result_nav)
let a_style = `height: 90%; text-decoration: none; display: flex; flex-direction: column; justify-content: space-around; align-items: center; color:black;`
let img_style = ` width: 28px; height: 25px; box-sizing: border-box;`
let p_style = ` margin: 0px; padding: 0px;`
newNav.innerHTML = ` 
    <a href="help2/index.html" class="nav-box" style="${a_style}">
      <img src="${result_nav}imgs/nav1.png" alt="nav1" style="${img_style}" />
      <p style="${p_style}">كسور</p>
    </a>
    <a class="nav-box" onclick="history.back()" style="${a_style}">
      <img src="${result_nav}imgs/nav2.png" alt="nav1" style="${img_style}" />
      <p style="${p_style}">رجوع</p>
    </a>
    <a href="help/index.html" class="nav-box" style="${a_style}">
      <img src="${result_nav}imgs/nav3.png" alt="nav1" style="${img_style}" />
      <p style="${p_style}">مساعدة</p>
    </a>
    <a href="../index.html" class="nav-box" style="${a_style}">
      <img src="${result_nav}imgs/nav4.png" alt="nav1" style="${img_style}" />
      <p style="${p_style}">الرئسية</p>
    </a> `


document.body.appendChild(newNav)


function countCharOccurrences(string, char) {
    let count = 0;
    for (let i = 0; i < string.length; i++) {
    if (string[i] === char) {
        count++;
    }
}
return count;
}


let input = document.querySelector("input");
let nav = document.querySelector(".nav");

// window.visualViewport.addEventListener("resize", () =>
//   window.getComputedStyle(nav).display == "none"
//     ? (nav.style.display = "flex")
//     : window.getComputedStyle(nav).display == "flex"
//     ? (nav.style.display = "none")
//     : ""
// );