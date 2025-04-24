import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  ref,
  get,
  push,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
import { auth, database } from "../firbase-config.js";

const sidebar = document.getElementById("sidebar");
const hamburger = document.getElementById("hambuger");
const adminName = document.getElementById("adminName");
const logoutBtn = document.getElementById("adminLogoutBtn");
const addProductLink = document.getElementById("addProductLink");
const addProductFormSection = document.getElementById("addProductForm");
const content = document.getElementById("content");
const addProductForm = document.getElementById("productForm");
const submitBtn = document.getElementById("submitBtn");
const loader = submitBtn.querySelector(".loader");
const btnText = submitBtn.querySelector(".btn-text");

// Auth check and welcome
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userRef = ref(database, `users/${user.uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const userData = snapshot.val();
      if (userData.role !== "admin") {
        window.location.href = "../index.html";
      } else {
        // Set the admin's name
        adminName.textContent = userData.name || "Admin";
      }
    } else {
      window.location.href = "../index.html";
    }
  } else {
    window.location.href = "../index.html";
  }
});

// Logout
logoutBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  await signOut(auth);
  window.location.href = "../index.html";
});
// Sidebar toggle
hamburger.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

addProductLink.addEventListener("click", (e) => {
  e.preventDefault();
  content.style.display = "none";
  addProductFormSection.style.display =
    addProductFormSection.style.display === "none" ? "block" : "none";
});

//add product
addProductForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loader.style.display = "inline-block";
  btnText.textContent = "Adding...";
  const name = addProductForm.name.value.trim();
  const category = addProductForm.category.value.trim();
  const brand = addProductForm.brand.value.trim();
  const price = parseFloat(addProductForm.price.value);
  const quantity = parseInt(addProductForm.quantity.value);
  const availability = addProductForm.availability.value;
  const mrp = addProductForm.mrp.value;
  const image = addProductForm.imageUrl.value;
  if (
    !name ||
    !category ||
    !brand ||
    !price ||
    !quantity ||
    !availability ||
    !image ||
    !mrp
  ) {
    showToast("Please fill in all the fields", "error");
    stopLoading();
    return;
  }

  try {
    await push(ref(database, "medicines"), {
      name,
      category,
      brand,
      price,
      quantity,
      image,
      availability,
      mrp,
    });
    showToast("Product Added successfully", "success");
    addProductForm.reset();
  } catch (error) {
    showToast("Error adding product", "error");
    console.log(error);
  }
  stopLoading();
});
function stopLoading() {
  loader.style.display = "none";
  btnText.textContent = "Add Product";
}

function showToast(message, type = "error") {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.className = `toast ${type}`;
  const container = document.getElementById("toast-container");
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2000);
}
