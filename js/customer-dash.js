import { db, auth } from "./firebase-config.js";
import { doc, updateDoc, addDoc, collection, getDoc, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

function openReviewModal(bookingId, providerId) {
  const existing = document.getElementById("review-modal-backdrop");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "review-modal-backdrop";
  modal.className = "modal-backdrop";
  modal.innerHTML = `
    <div class="review-modal">
      <h3>Leave a Review</h3>
      <form id="review-form">
        <div class="form-group">
          <label for="review-rating">Rating</label>
          <select id="review-rating" class="form-control" required>
            <option value="">Select rating</option>
            <option value="5">5 - Excellent</option>
            <option value="4">4 - Very Good</option>
            <option value="3">3 - Good</option>
            <option value="2">2 - Fair</option>
            <option value="1">1 - Poor</option>
          </select>
        </div>
        <div class="form-group">
          <label for="review-message">Message</label>
          <textarea id="review-message" class="form-control" placeholder="Tell us how the service went..." required></textarea>
        </div>
        <div class="review-actions">
          <button type="button" class="btn-muted" id="cancel-review">Cancel</button>
          <button type="submit" class="btn-primary">Submit Review</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("cancel-review").addEventListener("click", () => modal.remove());
  document.getElementById("review-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const rating = Number(document.getElementById("review-rating").value);
    const comment = document.getElementById("review-message").value.trim();

    if (!rating || !comment) {
      alert("Please select a rating and enter a message.");
      return;
    }

    await submitReview(bookingId, providerId, auth.currentUser.uid, auth.currentUser.displayName || "Customer", rating, comment);
    modal.remove();
  });
}

function attachReviewHandlers() {
  document.querySelectorAll(".btn-review").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const { id, provider } = e.currentTarget.dataset;
      if (!id || !provider) return;
      openReviewModal(id, provider);
    });
  });
}

function renderBookings(snapshot) {
  const tbody = document.getElementById("customer-bookings-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!snapshot || snapshot.empty) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          No booking requests yet.
        </td>
      </tr>
    `;
    return;
  }

  snapshot.forEach((docSnap) => {
    const b = docSnap.data();
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><strong>${b.bookingId || "-"}</strong></td>
      <td>${b.serviceCategory || "Service"}</td>
      <td>${b.bookingDate || "-"} at ${b.bookingTime || "-"}</td>
      <td><span class="status-badge status-${b.status || "pending"}">${(b.status || "pending").replace("_", " ")}</span></td>
      <td>${b.status === "completed" && !b.isReviewed
        ? `<button class="btn-primary btn-review" data-id="${docSnap.id}" data-provider="${b.providerId}">Leave Review</button>`
        : "None"}</td>
    `;

    tbody.appendChild(tr);
  });

  attachReviewHandlers();
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const q = query(collection(db, "bookings"), where("customerId", "==", user.uid));
  onSnapshot(q, (snapshot) => {
    renderBookings(snapshot);
  });
});

export async function submitReview(bookingDocId, providerId, customerId, customerName, rating, comment) {
  const bookingRef = doc(db, "bookings", bookingDocId);
  const bookingSnap = await getDoc(bookingRef);
  const bookingData = bookingSnap.data();

  if (!bookingData) {
    alert("Booking not found.");
    return;
  }

  if (bookingData.status !== "completed") {
    alert("You can only review completed services.");
    return;
  }

  if (bookingData.isReviewed) {
    alert("You have already submitted a review for this booking.");
    return;
  }

  await addDoc(collection(db, "reviews"), {
    bookingId: bookingDocId,
    providerId,
    customerId,
    customerName,
    rating: Number(rating),
    comment,
    createdAt: new Date().toISOString()
  });

  await updateDoc(bookingRef, { isReviewed: true });

  const providerRef = doc(db, "providers", providerId);
  const providerSnap = await getDoc(providerRef);
  const providerData = providerSnap.data();

  if (!providerData) {
    alert("Thank you! Your review has been recorded.");
    return;
  }

  const oldTotal = providerData.totalReviews || 0;
  const oldRating = providerData.rating || 0;
  const newTotal = oldTotal + 1;
  const newRating = ((oldRating * oldTotal) + Number(rating)) / newTotal;

  await updateDoc(providerRef, {
    rating: newRating,
    totalReviews: newTotal
  });

  alert("Thank you! Your review has been recorded.");
}