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
  set,
  update,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-right ul");
const loginLink = document.getElementById("loginLink");
const loginModal = document.getElementById("loginModal");
const closeModal = document.getElementById("closeModal");
const logoutBtn = document.getElementById("logoutBtn");
const userMenu = document.getElementById("userMenu");
const loginForm = document.getElementById("loginForm");
const productDetatilsContainer = document.getElementById("productContainer");
const cartLink = document.getElementById("cartLink");
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

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

const productId = getProductIdFromUrl();

//! Load the product and add to cart
let med = null;
async function loadProduct() {
  const snapShot = await get(ref(database, `medicines/${productId}`));
  if (!snapShot.exists()) {
    productDetatilsContainer.innerHTML = `<p style="color:red;">Product not found.</p>`;
    return;
  }
  med = snapShot.val();
  const discountPercent = Math.round(((med.mrp - med.price) / med.mrp) * 100);
  productDetatilsContainer.innerHTML = `
    <img src="${med.image}" alt="${med.name}" class="product-image" />
    <div class="product-details">
      <h1 class="product-title">${med.name}</h1>
      <p class="product-brand">Visit ${med.brand.toUpperCase()} Store</p>

      <div class="product-price">
        ₹${med.price.toFixed(2)}
        <span class="original-price">₹${med.mrp}.00</span>
        <span class="discount">${discountPercent}% OFF</span>
      </div>

      <p class="delivery-info">Inclusive of all taxes</p>
      <p class="delivery-info">Delivery by <strong>Today, 6:00 pm - 11:00 pm</strong></p>

      <button class="add-to-cart">Add To Cart</button>

      <div class="offer-section">
        <h3>Offers Just for you</h3>
        <ul>
          <li>🎉 Get extra 10% Off on Everherb, Liveasy or PharmEasy products</li>
          <li>💳 Get Upto ₹100 cashback using CRED pay UPI</li>
        </ul>
      </div>
    </div>
  `;
  document
    .querySelector(".add-to-cart")
    .addEventListener("click", async (e) => {
      const button = e.target;
      const user = auth.currentUser;
      if (!user) {
        showToast("Please Login to add item to cart", "error");
        return;
      }
      if (!med.quantity || med.quantity <= 0) {
        showToast("Out of Stock!", "error");
        return;
      }
      button.disabled = true;
      const originalText = button.textContent;
      button.innerHTML = `<span class="spinner"></span> Adding...`;
      try {
        const cartRef = ref(database, `carts/${user.uid}/${productId}`);
        await set(cartRef, {
          id: productId,
          name: med.name,
          image: med.image,
          price: med.price,
          brand: med.brand,
          mrp: med.mrp,
          category: med.category,
          quantity: 1,
        });
        const newQuantity = (med.quantity || 0) - 1;
        const productRef = ref(database, `medicines/${productId}`);
        await update(productRef, { quantity: newQuantity });
        showToast("Product added to Cart!", "success");
      } catch (error) {
        console.log(error);
        showToast("Failed to add product", "error");
      } finally {
        button.disabled = false;
        button.textContent = originalText;
      }
    });
}

//! rating and comments
let selectedRating = 0;

function setupStaticReviewForm() {
  const stars = document.querySelectorAll("#starInput span");

  stars.forEach((star, idx) => {
    star.addEventListener("click", () => {
      selectedRating = idx + 1;
      updateStarUI();
    });
  });

  function updateStarUI() {
    stars.forEach((s, i) => {
      s.classList.toggle("selected", i < selectedRating);
    });
  }

  document.getElementById("submitReviewBtn").addEventListener("click", () => {
    const comment = document.getElementById("reviewComment").value.trim();
    if (selectedRating === 0 || comment === "") {
      showToast("Please give a rating and write a comment.", "error");
      return;
    }

    const newReview = document.createElement("div");
    newReview.classList.add("review");
    newReview.innerHTML = `
      <div class="stars">${"⭐".repeat(selectedRating)}</div>
      <p class="review-text">${comment}</p>
      <p class="review-author">- You</p>
    `;

    document.getElementById("reviewsList").prepend(newReview);
    document.getElementById("reviewComment").value = "";
    selectedRating = 0;
    updateStarUI();
  });
}
// redirect to cart
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
setupStaticReviewForm();

loadProduct();
