
import { db, auth } from "./firebase-config.js";
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

function attachCustomerDashboardListener() {
  const tbody = document.getElementById("customer-bookings-body");
  if (!tbody) return;

  onAuthStateChanged(auth, (user) => {
    if (!user) return window.location.href = "login.html";

    const q = query(collection(db, "bookings"), where("customerId", "==", user.uid));
    onSnapshot(q, (snapshot) => {
      tbody.innerHTML = "";

      snapshot.docs.forEach(docSnap => {
        const b = docSnap.data();
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong>${b.bookingId}</strong></td>
          <td>${b.serviceCategory}</td>
          <td>${b.bookingDate} at ${b.bookingTime}</td>
          <td><span class="status-badge status-${b.status}">${b.status.replace('_', ' ')}</span></td>
          <td>${b.status === 'completed' && !b.isReviewed 
            ? `<button class="btn-primary btn-review" data-id="${docSnap.id}" data-provider="${b.providerId}">Leave Review</button>` 
            : 'None'}</td>
        `;
        tbody.appendChild(tr);
      });

      attachReviewHandlers();
    });
  });
}

function attachReviewHandlers() {
  document.querySelectorAll(".btn-review").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const { id, provider } = e.currentTarget.dataset;
      const rating = prompt("Rate service from 1 to 5 stars:", "5");
      if (rating && Number(rating) >= 1 && Number(rating) <= 5) {
        await addDoc(collection(db, "reviews"), {
          bookingId: id,
          providerId: provider,
          customerId: auth.currentUser.uid,
          rating: Number(rating),
          createdAt: new Date().toISOString()
        });
        await updateDoc(doc(db, "bookings", id), { isReviewed: true });
        alert("Review submitted successfully!");
      }
    });
  });
}

function generateBookingId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "BK-";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function loadProviderDetails() {
  const providerInfo = document.getElementById("provider-info");
  const bookingForm = document.getElementById("booking-form");
  if (!providerInfo || !bookingForm) return;

  const params = new URLSearchParams(window.location.search);
  const providerId = params.get("id");

  if (!providerId) {
    providerInfo.innerHTML = "<p>No provider selected.</p>";
    return;
  }

  const providerSnap = await getDoc(doc(db, "providers", providerId));
  if (!providerSnap.exists()) {
    providerInfo.innerHTML = "<p>Provider not found.</p>";
    return;
  }

  const provider = { id: providerSnap.id, ...providerSnap.data() };
  providerInfo.innerHTML = `
    <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow);">
      <img src="${provider.profilePicUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400'}" alt="${provider.name}" style="width: 100%; height: 260px; object-fit: cover;">
      <div style="padding: 1.5rem;">
        <h2>${provider.name}</h2>
        <p style="color: var(--text-muted); margin: 0.5rem 0;">${provider.category} • ${provider.location}</p>
        <p>⭐ ${provider.rating || 5.0} (${provider.totalReviews || 0} reviews)</p>
        <p style="font-size: 1.3rem; font-weight: 800; color: var(--accent); margin-top: 1rem;">$${provider.hourlyRate}/hr</p>
      </div>
    </div>
  `;

  const bookingCategory = document.getElementById("booking-category");
  if (bookingCategory) bookingCategory.value = provider.category || "";

  bookingForm.dataset.providerId = providerId;
  bookingForm.dataset.providerName = provider.name;
}

async function handleBookingSubmit(event) {
  event.preventDefault();

  const user = auth.currentUser;
  if (!user) {
    alert("Please log in to book a service.");
    window.location.href = "login.html";
    return;
  }

  const bookingForm = event.currentTarget;
  const providerId = bookingForm.dataset.providerId;
  const providerName = bookingForm.dataset.providerName;

  if (!providerId || !providerName) {
    alert("Please select a valid provider before booking.");
    return;
  }

  const userSnap = await getDoc(doc(db, "users", user.uid));
  const userData = userSnap.exists() ? userSnap.data() : {};

  const bookingData = {
    bookingId: generateBookingId(),
    customerId: user.uid,
    customerName: userData.fullName || user.displayName || "Customer",
    providerId: String(providerId),
    providerName: String(providerName),
    serviceCategory: String(document.getElementById("booking-category").value).trim(),
    bookingDate: String(document.getElementById("booking-date").value).trim(),
    bookingTime: String(document.getElementById("booking-time").value).trim(),
    location: String(document.getElementById("booking-location").value).trim(),
    description: String(document.getElementById("booking-desc").value).trim(),
    status: "pending",
    isReviewed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const requiredFields = [bookingData.serviceCategory, bookingData.bookingDate, bookingData.bookingTime, bookingData.location, bookingData.description];
  if (requiredFields.some(field => !field)) {
    alert("Please fill in all booking details.");
    return;
  }

  await addDoc(collection(db, "bookings"), bookingData);
  alert(`Booking submitted! Your Booking ID is: ${bookingData.bookingId}`);
  window.location.href = "customer-dashboard.html";
}

const bookingForm = document.getElementById("booking-form");
if (bookingForm) {
  bookingForm.addEventListener("submit", handleBookingSubmit);
}

attachCustomerDashboardListener();
loadProviderDetails();