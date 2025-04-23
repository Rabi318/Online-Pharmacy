const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-right ul");

hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("show");
});

document.addEventListener("DOMContentLoaded", () => {
  const loginLink = document.getElementById("loginLink");
  const loginModal = document.getElementById("loginModal");
  const closeModal = document.getElementById("closeModal");

  loginLink.addEventListener("click", (e) => {
    e.preventDefault();
    loginModal.style.display = "block";
  });

  closeModal.addEventListener("click", (e) => {
    e.preventDefault();
    loginModal.style.display = "none";
  });
  window.addEventListener("click", (e) => {
    if (e.target === loginModal) {
      loginModal.style.display = "none";
    }
  });
});
