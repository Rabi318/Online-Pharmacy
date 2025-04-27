import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { auth, database } from "../firbase-config.js";
import {
  get,
  ref,
  query,
  orderByChild,
  startAt,
  endAt,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-right ul");
const loginLink = document.getElementById("loginLink");
const loginModal = document.getElementById("loginModal");
const closeModal = document.getElementById("closeModal");
const logoutBtn = document.getElementById("logoutBtn");
const userMenu = document.getElementById("userMenu");
const loginForm = document.getElementById("loginForm");
const productContainer = document.getElementById("product-container");
const cartLink = document.getElementById("cartLink");

cartLink.addEventListener("click", (e) => {
  e.preventDefault();
  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.location.href = "../user/cart.html";
    } else {
      showToast("Please Login to access Your Cart", "error");
    }
  });
});
hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("show");
});
document.addEventListener("DOMContentLoaded", () => {
  // console.log("Inside the script");
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

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    const userRef = ref(database, `users/${user.uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const userData = snapshot.val();
      const role = userData.role;
      loginForm.reset();
      showToast("Login successful", "success");
      setTimeout(() => {
        if (role === "admin") {
          window.location.href = "../admin/dashboard.html";
        } else {
          updateNavbarWithUser(userData.name);
        }
        closeLoginModal();
      }, 2000);
    } else {
      showToast("User not found", "error");
    }
  } catch (error) {
    showToast("Login failed", "error");
    console.log(error);
  }
});
function getInitials(name) {
  const parts = name.trim().split(" ");

  if (parts.length === 1) {
    // If single word, take first 2 letters
    return parts[0].slice(0, 2).toUpperCase();
  }

  // Otherwise, first letter of first 2 words
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function updateNavbarWithUser(name) {
  const initials = getInitials(name);
  loginLink.textContent = initials;
  loginLink.style.cursor = "pointer";

  loginLink.replaceWith(loginLink.cloneNode(true));
  const newLoginLink = document.getElementById("loginLink");
  newLoginLink.textContent = initials;
  newLoginLink.style.cursor = "pointer";
  newLoginLink.onclick = () => {
    userMenu.style.display =
      userMenu.style.display === "block" ? "none" : "block";
  };
}

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  loginLink.textContent = "Login";
  loginLink.onclick = null;
  loginLink.addEventListener("click", (e) => {
    e.preventDefault();
    loginModal.style.display = "block";
  });
  userMenu.style.display = "none";
  showToast("Logged out successfully", "success");
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userRef = ref(database, `users/${user.uid}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const userData = snapshot.val();
      updateNavbarWithUser(userData.name);
    }
  }
});

function closeLoginModal() {
  document.getElementById("loginModal").style.display = "none";
}
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.top = "20px";
  toast.style.right = "20px";
  toast.style.padding = "10px 20px";
  toast.style.backgroundColor = type === "success" ? "#28a745" : "#dc3545";
  toast.style.color = "#fff";
  toast.style.borderRadius = "4px";
  toast.style.zIndex = "10000";
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

//Fetch products
let medArray = [];
let categories = new Set();
let brands = new Set();
async function fetchMedices() {
  try {
    const productsRef = ref(database, "medicines/");
    const snapshot = await get(productsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();

      medArray = Object.entries(data).map(([id, value]) => ({
        id,
        ...value,
      }));
      medArray.forEach((med) => {
        categories.add(med.category);
        brands.add(med.brand);
      });
      populateFilters();
    }
    // console.log(medArray);
    displayMedicines(medArray);
  } catch (error) {
    console.error("Error fetching medicines:", error);
  }
}
function populateFilters() {
  const categorySelect = document.getElementById("category");
  categorySelect.innerHTML = `<option value="all">All</option>`;
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
  const brandSelect = document.getElementById("brand");
  brandSelect.innerHTML = `<option value="all">All</option>`;
  brands.forEach((brand) => {
    const option = document.createElement("option");
    option.value = brand;
    option.textContent = brand;
    brandSelect.appendChild(option);
  });
}

//Product card
function displayMedicines(medicines) {
  productContainer.innerHTML = ""; // Clear existing content
  medicines.forEach((med) => {
    const discountPercent = Math.round(((med.mrp - med.price) / med.mrp) * 100);
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${med.image}" alt="${med.name}" />
      <div class="product-title">${med.name}</div>
      <div>
        <span class="mrp">MRP ₹${med.mrp}</span>
        <span class="discount">${discountPercent}% OFF</span>
      </div>
      <div class="price">₹${med.price}</div>
    `;
    card.addEventListener("click", () => {
      window.location.href = `./productDetails.html?id=${med.id}`;
    });
    productContainer.appendChild(card);
  });
}
document.getElementById("filterForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const selectedCategory = document.getElementById("category").value;
  const selectedBrand = document.getElementById("brand").value;
  const sortBy = document.getElementById("sortBy").value;
  let filteredMedicines = medArray.filter((med) => {
    const matchesCategory =
      selectedCategory === "all" || med.category === selectedCategory;
    const matchesBrand = selectedBrand === "all" || med.brand === selectedBrand;
    return matchesCategory && matchesBrand;
  });
  if (sortBy === "priceAsc") {
    filteredMedicines.sort((a, b) => a.price - b.price);
  } else if (sortBy === "priceDesc") {
    filteredMedicines.sort((a, b) => b.price - a.price);
  } else if (sortBy === "nameAsc") {
    filteredMedicines.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === "nameDesc") {
    filteredMedicines.sort((a, b) => b.name.localeCompare(a.name));
  }
  displayMedicines(filteredMedicines);
});

//category wise click function

//update cart count
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userId = user.uid;
      const cartRef = ref(database, `carts/${userId}`);
      const cartSnap = await get(cartRef);
      const cartItems = cartSnap.exists()
        ? Object.entries(cartSnap.val()).map(([key, data]) => ({
            key,
            ...data,
            quantity: data.quantity || 1,
          }))
        : [];
      updateCartCount(cartItems);
    } catch {
      updateCartCount([]);
    }
  } else {
    updateCartCount([]);
  }
});
function updateCartCount(items) {
  const cartCountElement = document.getElementById("cart-count");
  cartCountElement.textContent = items.length;
}
fetchMedices();
