import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  ref,
  set,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
import { auth, database } from "../firbase-config.js";

const registerForm = document.getElementById("register-form");
const spinner = document.getElementById("spinner");
const registerBtn = document.getElementById("registerBtn");

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.className = `toast show ${type}`;
  toast.textContent = message;

  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const gender = document.querySelector('input[name="gender"]:checked')?.value;
  if (!name || !email || !password || !gender) {
    showToast("Please fill in all the fields", "error");
    return;
  }
  try {
    spinner.style.display = "inline-block";
    registerBtn.disabled = true;
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    await set(ref(database, `users/${user.uid}`), {
      name,
      email,
      gender,
      role: "user",
    });
    registerForm.reset();
    showToast("Registration successful", "success");
    setTimeout(() => {
      window.location.href = "../index.html";
    }, 2000);
  } catch (error) {
    showToast("Registration failed", "error");
    console.log(error);
  } finally {
    spinner.style.display = "none";
    registerBtn.disabled = false;
  }
});
