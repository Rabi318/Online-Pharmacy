import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  ref,
  get,
  push,
  update,
  remove,
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

// New: View Users elements
const viewUsersLink = document.getElementById("viewUsersLink");
const viewUsersSection = document.getElementById("viewUsersSection");
const usersTableBody = document.querySelector("#usersTable tbody");
const ordersLink = document.getElementById("ordersLink");
const ordersSection = document.getElementById("viewOrdersSection");
const ordersTableBody = document.querySelector("#ordersTable tbody");

const viewProductsLink = document.getElementById("viewProductsLink");
const viewProductsSection = document.getElementById("viewProductsSection");
const productsTableBody = document.querySelector("#productsTable tbody");

const modal = document.getElementById("editProductModal");
const closeModal = document.getElementById("closeModal");
const editProductForm = document.getElementById("editProductForm");
const updateBtn = document.getElementById("updateBtn");

const dashboardLink = document.getElementById("dashboardLink");
dashboardLink.addEventListener("click", async () => {
  viewUsersSection.style.display = "none";
  ordersSection.style.display = "none";
  viewProductsSection.style.display = "none";

  addProductFormSection.style.display = "none";
  content.style.display = "block";
  const dashboardStats = document.getElementById("dashboardStats");
  dashboardStats.style.display = "flex";
  // Count users
  try {
    const userSnap = await get(ref(database, `users`));
    const userCount = userSnap.exists()
      ? Object.keys(userSnap.val()).length
      : 0;
    document.getElementById("userCount").textContent = userCount;
  } catch (err) {
    document.getElementById("userCount").textContent = "Error";
    console.error("Error counting users:", err);
  }
  // Count products
  try {
    const productSnap = await get(ref(database, `medicines`));
    const productCount = productSnap.exists()
      ? Object.keys(productSnap.val()).length
      : 0;
    document.getElementById("productCount").textContent = productCount;
  } catch (err) {
    document.getElementById("productCount").textContent = "Error";
    console.error("Error counting products:", err);
  }
});

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
  viewUsersSection.style.display = "none";
  ordersSection.style.display = "none";
  viewProductsSection.style.display = "none";
  addProductFormSection.style.display =
    addProductFormSection.style.display === "none" ? "block" : "none";
});

// View Users
viewUsersLink.addEventListener("click", async (e) => {
  e.preventDefault();
  addProductFormSection.style.display = "none";
  content.style.display = "none";
  viewUsersSection.style.display = "block";
  ordersSection.style.display = "none";
  viewProductsSection.style.display = "none";
  usersTableBody.innerHTML = "";
  try {
    const userSnap = await get(ref(database, `users`));
    if (!userSnap.exists()) {
      usersTableBody.innerHTML = `<tr><td colspan=6>No Users Found.</td></tr>`;
      return;
    }
    const users = userSnap.val();
    Object.values(users).forEach((u) => {
      // console.log("User record:", u);
      const tr = document.createElement("tr");
      tr.innerHTML = `
      <td>${u.name || ""}</td>
      <td>${u.email || ""}</td>
      <td>${u.gender || ""}</td>
      <td>${u.role || ""}</td>
      <td><span class="status-pill Active">Active</span></td>
    `;
      usersTableBody.appendChild(tr);
    });
  } catch (error) {
    console.error("Error fetching users:", err);
    usersTableBody.innerHTML = `<tr><td colspan=6 style='color:red;'>Failed to load users.</td></tr>`;
  }
});

// View Orders

ordersLink.addEventListener("click", async (e) => {
  e.preventDefault();
  addProductFormSection.style.display = "none";
  viewUsersSection.style.display = "none";
  content.style.display = "none";
  ordersSection.style.display = "block";
  viewProductsSection.style.display = "none";
  ordersTableBody.innerHTML = "";
  try {
    const ordersSnap = await get(ref(database, `orders`));
    if (!ordersSnap.exists()) {
      ordersTableBody.innerHTML = `<tr><td colspan='5'>No Orders Found.</td></tr>`;
      return;
    }
    const all = ordersSnap.val();
    Object.entries(all).forEach(([uid, userOrders]) => {
      Object.entries(userOrders).forEach(([oid, order]) => {
        const date = new Date(order.timestamps.confirmedAt || Date.now());
        const statusOrder =
          ["confirmed", "shipped", "outForDelivery", "delivered"].find(
            (s) => order.status[s]
          ) || "confirmed";
        const labelMap = {
          confirmed: "Confirmed",
          shipped: "Shipped",
          outForDelivery: "Out for Delivery",
          delivered: "Delivered",
        };
        // build dropdown
        const tdStatus = document.createElement("td");
        const sel = document.createElement("select");
        sel.className = "status-dropdown";
        ["confirmed", "shipped", "outForDelivery", "delivered"].forEach(
          (step) => {
            const opt = document.createElement("option");
            opt.value = step;
            opt.textContent = labelMap[step];
            opt.style.color = order.status[step] ? "green" : "red";
            if (step === statusOrder) {
              opt.selected = true;
              sel.style.color = "green";
            }
            sel.appendChild(opt);
          }
        );
        tdStatus.appendChild(sel);

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${uid}</td>
          <td>${oid}</td>
          <td>₹${order.total.toFixed(2)}</td>
          <td>${order.payMethod}</td>
          <td>${date.toLocaleDateString()} ${date.toLocaleTimeString()}</td>
        `;
        tr.appendChild(tdStatus);
        ordersTableBody.appendChild(tr);
        sel.addEventListener("change", async () => {
          const newStatus = sel.value;
          await update(ref(database, `orders/${uid}/${oid}/status`), {
            [newStatus]: true,
          });
          await update(ref(database, `orders/${uid}/${oid}/timestamps`), {
            [`${newStatus}At`]: Date.now(),
          });
          // Reflect UI
          Array.from(sel.options).forEach(
            (o) => (o.style.color = o.value === newStatus ? "green" : "red")
          );
          sel.style.color = "green";
        });
      });
    });
    // const allOrders = ordersSnap.val();
    // Object.entries(allOrders).forEach(([uid, userOrders]) => {
    //   Object.entries(userOrders).forEach(([oid, order]) => {
    //     const tr = document.createElement("tr");
    //     const date = new Date(order.timestamps.confirmedAt || Date.now());
    //     // determine current status
    //     const statusSteps = [
    //       "confirmed",
    //       "shipped",
    //       "outForDelivery",
    //       "delivered",
    //     ];
    //     const currentStatus =
    //       statusSteps.find((step) => order.status[step]) || "confirmed";
    //     const statusLabels = {
    //       confirmed: "Confirmed",
    //       shipped: "Shipped",
    //       outForDelivery: "Out for Delivery",
    //       delivered: "Delivered",
    //     };
    //     const label = statusLabels[currentStatus];

    //     tr.innerHTML = `
    //       <td>${uid}</td>
    //       <td>${oid}</td>
    //       <td>₹${order.total.toFixed(2)}</td>
    //       <td>${order.payMethod}</td>
    //       <td>${date.toLocaleDateString()} ${date.toLocaleTimeString()}</td>
    //       <td><span class="status-pill ${currentStatus}">${label}</span></td>
    //     `;
    //     ordersTableBody.appendChild(tr);
    //   });
    // });
  } catch (error) {
    console.error("Error fetching orders:", error);
    ordersTableBody.innerHTML = `<tr><td colspan='5' style='color:red;'>Failed to load orders.</td></tr>`;
  }
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

//show products
viewProductsLink.addEventListener("click", async (e) => {
  e.preventDefault();
  addProductFormSection.style.display = "none";
  viewUsersSection.style.display = "none";
  ordersSection.style.display = "none";
  content.style.display = "none";
  viewProductsSection.style.display = "block";
  productsTableBody.innerHTML = "";
  try {
    const snapShot = await get(ref(database, `medicines`));
    if (!snapShot.exists()) {
      productsTableBody.innerHTML = `<tr><td colspan="8">No Products Found.</td></tr>`;
      return;
    }
    const products = snapShot.val();
    Object.entries(products).forEach(([id, product]) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${product.name}</td>
        <td>${product.category}</td>
        <td>${product.brand}</td>
        <td>₹${parseFloat(product.price).toFixed(2)}</td>
        <td>${product.quantity}</td>
        <td>₹${parseFloat(product.mrp).toFixed(2)}</td>
        <td>${product.availability}</td>
        <td><img src="${product.image}" width="50" height="50"/></td>
        <td>
          <button class="edit-btn" data-product-id="${id}">Edit</button>
          <button class="delete-btn" data-product-id="${id}">Delete</button>
        </td>
      `;
      productsTableBody.appendChild(tr);

      //Edit functionality
      const editBtn = tr.querySelector(".edit-btn");
      editBtn.addEventListener("click", () => {
        document.getElementById("name").value = product.name;
        document.getElementById("category").value = product.category;
        document.getElementById("brand").value = product.brand;
        document.getElementById("price").value = product.price;
        document.getElementById("quantity").value = product.quantity;
        document.getElementById("availability").value = product.availability;
        document.getElementById("mrp").value = product.mrp;
        document.getElementById("imageUrl").value = product.image;
        modal.style.display = "block";

        editProductForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const updatedName = document.getElementById("name").value.trim();
          const updatedCategory = document
            .getElementById("category")
            .value.trim();
          const updatedBrand = document.getElementById("brand").value.trim();
          const updatedPrice = parseFloat(
            document.getElementById("price").value
          );
          const updatedQuantity = parseInt(
            document.getElementById("quantity").value
          );
          const updatedAvailability =
            document.getElementById("availability").value;
          const updatedMrp = document.getElementById("mrp").value;
          const updatedImage = document.getElementById("imageUrl").value;
          if (
            !updatedName ||
            !updatedCategory ||
            !updatedBrand ||
            !updatedPrice ||
            !updatedQuantity ||
            !updatedAvailability ||
            !updatedImage ||
            !updatedMrp
          ) {
            showToast("Please fill in all the fields", "error");
            return;
          }
          try {
            await update(ref(database, `medicines/${id}`), {
              name: updatedName,
              category: updatedCategory,
              brand: updatedBrand,
              price: updatedPrice,
              quantity: updatedQuantity,
              availability: updatedAvailability,
              mrp: updatedMrp,
              image: updatedImage,
            });
            showToast("Product updated successfully", "success");
            modal.style.display = "none";
          } catch (error) {
            showToast("Error updating product");
            console.log(error);
          }
        });
      });

      //delete functionality
      const deleteBtn = tr.querySelector(".delete-btn");
      deleteBtn.addEventListener("click", async () => {
        if (confirm("Are you sure you want to delete this product?")) {
          try {
            await remove(ref(database, `medicines/${id}`));
            alert("Product deleted successfully");
            tr.remove(); // Remove the row from the table
          } catch (error) {
            alert("Error deleting product");
            console.log(error);
          }
        }
      });
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    productsTableBody.innerHTML = `<tr><td colspan="8" style="color:red;">Failed to load products.</td></tr>`;
  }
});
closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});
