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
const paymentModal = document.getElementById("paymentModal");
const closePayment = document.getElementById("closePayment");
const payNowBtn = document.querySelector(".pay-btn");
const paymentForm = document.getElementById("paymentForm");
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

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userId = user.uid;
    const cartRef = ref(database, `carts/${userId}`);
    try {
      const snapShot = await get(cartRef);
      if (snapShot.exists()) {
        // const cartItems = Object.values(snapShot.val());
        const cartItems = Object.entries(snapShot.val()).map(([key, data]) => ({
          key,
          ...data,
          quantity: data.quantity || 1,
        }));
        // console.log(cartItems);
        displayCartItmes(cartItems);
        updateCartCount(cartItems);
      } else {
        document.querySelector(".left-section").innerHTML =
          "<p>Your cart is empty.</p>";
        updateCartCount([]);
      }
    } catch (error) {
      console.log(error);
    }
  } else {
    showToast("Please Login to view your cart");
  }
});
function updateCartCount(items) {
  const cartCountElement = document.getElementById("cart-count");
  cartCountElement.textContent = items.length;
}

function displayCartItmes(items) {
  const container = document.querySelector(".left-section");
  container.innerHTML = `
    <div class="offer-box">
      EXTRA 15%* OFF unlocked ✨ <br />
      Apply Coupon SALE27 & get maximum discount
    </div>
  `;
  items.forEach((item, i) => {
    const qty = item.quantity;
    const discount = Math.round(((item.mrp - item.price) / item.mrp) * 100);
    container.innerHTML += `
      <div class="cart-item" data-index ="${i}">
        <img src="${item.image}" alt="${item.name}" />
        <div class="cart-details">
          <h4>${item.name}</h4>
          <small>From ${item.brand}</small>
          <div class="price">₹${item.price} × ${qty}
            <span class="original-price">₹${item.mrp} × ${qty}</span>
            <span class="discount">${discount}% OFF</span>
          </div>
          <div class="delivery">Delivery by <b>Tomorrow, before 10:00 pm</b></div>
           <div class="cart-actions">
        <div class="quantity-control">
          <button class="decrease-qty">-</button>
          <span class="quantity">${qty}</span>
          <button class="increase-qty">+</button>
        </div>
        <button class="delete-btn">🗑️Remove</button>
      </div>
        </div>
      </div>
    `;
  });
  // Calculate summary
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  );
  const originalTotal = items.reduce(
    (sum, item) => sum + Number(item.mrp) * (item.quantity || 1),
    0
  );
  const discount = originalTotal - totalPrice;

  document.getElementById("total-price").textContent = totalPrice.toFixed(2);
  document.getElementById("mrp").textContent = `₹${originalTotal.toFixed(2)}`;
  document.getElementById("discount").textContent = `- ₹${discount.toFixed(2)}`;
  document.getElementById("final-value").textContent = `₹${totalPrice.toFixed(
    2
  )}`;

  document.querySelectorAll(".increase-qty").forEach((btn, i) => {
    btn.addEventListener("click", async () => {
      const cartItem = items[i];
      const userId = auth.currentUser.uid;
      const cartRef = ref(database, `carts/${userId}/${cartItem.key}`);
      const medRef = ref(database, `medicines/${cartItem.id}/quantity`);

      // 1) update cart quantity
      cartItem.quantity = (cartItem.quantity || 1) + 1;
      await update(cartRef, { quantity: cartItem.quantity });

      // 2) decrement medicine stock
      await runTransaction(medRef, (currentStock) => {
        if (currentStock === null) return 0;
        return currentStock - 1;
      });

      displayCartItmes(items);
      updateCartCount(items);
    });
  });
  document.querySelectorAll(".decrease-qty").forEach((btn, i) => {
    btn.addEventListener("click", async () => {
      const cartItem = items[i];
      if ((cartItem.quantity || 1) <= 1) return; // don’t go below 1

      const userId = auth.currentUser.uid;
      const cartRef = ref(database, `carts/${userId}/${cartItem.key}`);
      const medRef = ref(database, `medicines/${cartItem.id}/quantity`);

      // 1) update cart quantity
      cartItem.quantity--;
      await update(cartRef, { quantity: cartItem.quantity });

      // 2) increment medicine stock
      await runTransaction(medRef, (currentStock) => {
        if (currentStock === null) return 1;
        return currentStock + 1;
      });

      displayCartItmes(items);
      updateCartCount(items);
    });
  });
  document.querySelectorAll(".delete-btn").forEach((btn, idx) => {
    btn.addEventListener("click", async () => {
      const cartItem = items[i];
      const userId = auth.currentUser.uid;
      const itemKey = items[idx].key;
      const medRef = ref(database, `medicines/${cartItem.id}/quantity`);
      try {
        // 1) Remove from Firebase
        await remove(ref(database, `carts/${userId}/${itemKey}`));
        await runTransaction(medRef, (currentStock) => {
          if (currentStock === null) return 1;
          return currentStock + 1;
        });
        // 2) Remove locally & re-render
        items.splice(idx, 1);
        displayCartItmes(items);
        updateCartCount(items);
      } catch (err) {
        console.error("Failed to delete item:", err);
      }
    });
  });
}

// Payment
payNowBtn.addEventListener("click", () => {
  paymentModal.style.display = "block";
});
closePayment.addEventListener(
  "click",
  () => (paymentModal.style.display = "none")
);
window.addEventListener("click", (e) => {
  if (e.target === paymentModal) paymentModal.style.display = "none";
});

paymentForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const method = paymentForm.method.value;
  paymentModal.style.display = "none";
  showToast("Processing Payment.....", "info");
  setTimeout(async () => {
    try {
      const userId = auth.currentUser.uid;
      const userCart = await get(ref(database, `carts/${userId}`));
      if (!userCart.exists()) {
        showToast("Your cart is empty!", "error");
        return;
      }
      const items = Object.entries(userCart.val()).map(([key, data]) => ({
        productId: data.id,
        name: data.name,
        brand: data.brand,
        image: data.image,
        price: data.price,
        mrp: data.mrp,
        quantity: data.quantity || 1,
      }));
      const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
      const newOrderRef = push(ref(database, `orders/${userId}`));
      const now = Date.now();
      const orderData = {
        items,
        total,
        payMethod: method,
        status: {
          confirmed: true,
          shipped: false,
          outForDelivery: false,
          delivered: false,
        },
        timestamps: {
          confirmedAt: now,
          shippedAt: null,
          outForDeliveryAt: null,
          deliveredAt: null,
        },
      };
      await set(newOrderRef, orderData);
      await remove(ref(database, `carts/${userId}`));
      showToast("Payment successful! Order confirmed.", "success");
      setTimeout(() => {
        window.location.href = "../user/orders.html";
      }, 1200);
    } catch (error) {
      console.error(error);
      showToast("Payment failed. Please try again.", "error");
    }
  }, 800);
});
