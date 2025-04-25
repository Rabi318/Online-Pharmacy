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
  remove,
  runTransaction,
  push,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-right ul");
const loginLink = document.getElementById("loginLink");
const loginModal = document.getElementById("loginModal");
const closeModal = document.getElementById("closeModal");
const logoutBtn = document.getElementById("logoutBtn");
const userMenu = document.getElementById("userMenu");
const loginForm = document.getElementById("loginForm");
const ordersContainer = document.getElementById("orders-container");
const orderTemplate = document.getElementById("order-template");
const logo = document.getElementById("logo");
logo.addEventListener("click", () => {
  window.location.href = "../index.html";
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
  document.getElementById("cart-count").textContent = "0";

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

function updateCartCount(items) {
  const cartCountElement = document.getElementById("cart-count");
  cartCountElement.textContent = items.length;
}
// onAuthStateChanged(auth, async (user) => {
//   if (user) {
//     const userId = user.uid;
//     const cartRef = ref(database, `carts/${userId}`);
//     try {
//       const snapShot = await get(cartRef);
//       const cartItems = Object.entries(snapShot.val()).map(([key, data]) => ({
//         key,
//         ...data,
//         quantity: data.quantity || 1,
//       }));
//       updateCartCount(cartItems);
//     } catch (error) {
//       updateCartCount([]);
//     }
//   }
// });

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
  if (!user) {
    ordersContainer.innerHTML = `<p>Please log in to view your orders.</p>`;
    return;
  }
  const ordersRef = ref(database, `orders/${user.uid}`);
  try {
    const snapshot = await get(ordersRef);
    if (!snapshot.exists()) {
      ordersContainer.innerHTML = `<p>You have no orders yet.</p>`;
      return;
    }
    ordersContainer.innerHTML = "";
    snapshot.forEach((orderSnap) => {
      const orderData = orderSnap.val();
      const clone = orderTemplate.content.cloneNode(true);
      const card = clone.querySelector(".order-card");

      // Render products
      const productsEl = clone.querySelector(".products");
      const productTplEl = productsEl.querySelector(".product-line");
      productsEl.innerHTML = "";
      orderData.items.forEach((item) => {
        const line = productTplEl.cloneNode(true);
        line.querySelector("img").src = item.image;
        line.querySelector(".name").textContent = item.name;
        line.querySelector(
          ".price"
        ).textContent = `₹${item.price} × ${item.quantity}`;
        productsEl.appendChild(line);
      });
      // Show order total
      const totalDiv = document.createElement("div");
      totalDiv.className = "order-total";
      totalDiv.textContent = `Total: ₹${orderData.total.toFixed(2)}`;
      card.insertBefore(totalDiv, card.querySelector(".progress-bar"));
      // Render progress
      const statusSteps = [
        "confirmed",
        "shipped",
        "outForDelivery",
        "delivered",
      ];
      const timestamps = orderData.timestamps || {};
      const lis = clone.querySelectorAll(".progress-bar li");
      lis.forEach((li) => {
        const step = li.dataset.step;
        if (orderData.status[step]) {
          li.classList.add("completed");
          const tsKey = `${step}At`;
          if (timestamps[tsKey]) {
            const d = new Date(timestamps[tsKey]);
            li.querySelector(".timestamp").textContent =
              d.toLocaleDateString() + " " + d.toLocaleTimeString();
          }
        }
      });
      ordersContainer.appendChild(clone);
    });
  } catch (error) {
    console.error("Error fetching orders:", err);
    ordersContainer.innerHTML = `<p>Error loading orders. Try again later.</p>`;
  }
});
