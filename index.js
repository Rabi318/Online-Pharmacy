const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-right ul");

hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("show");
});
