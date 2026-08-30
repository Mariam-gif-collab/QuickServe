
import { db, auth } from "./firebase-config.js";
import { collection, query, where, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (!user) return window.location.href = "login.html";

  const q = query(collection(db, "bookings"), where("providerId", "==", user.uid));
  onSnapshot(q, (snapshot) => {
    const tbody = document.getElementById("provider-bookings-body");
    tbody.innerHTML = "";

    snapshot.docs.forEach(docSnap => {
      const b = docSnap.data();
      const docId = docSnap.id;
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td><strong>${b.bookingId}</strong></td>
        <td>${b.customerName}</td>
        <td>${b.bookingDate} (${b.bookingTime})</td>
        <td><span class="status-badge status-${b.status}">${b.status.replace('_', ' ')}</span></td>
        <td>${renderControls(docId, b.status)}</td>
      `;
      tbody.appendChild(tr);
    });

    attachStatusHandlers();
  });
});

function renderControls(id, status) {
  if (status === 'pending') {
    return `<button class="btn-primary btn-status" data-id="${id}" data-status="accepted">Accept</button>
            <button class="btn-secondary btn-status" data-id="${id}" data-status="rejected">Reject</button>`;
  } else if (status === 'accepted') {
    return `<button class="btn-primary btn-status" data-id="${id}" data-status="in_progress">Start Work</button>`;
  } else if (status === 'in_progress') {
    return `<button class="btn-primary btn-status" data-id="${id}" data-status="completed" style="background:var(--success);">Complete</button>`;
  }
  return 'Locked';
}

function attachStatusHandlers() {
  document.querySelectorAll(".btn-status").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const { id, status } = e.currentTarget.dataset;
      await updateDoc(doc(db, "bookings", id), { status });
    });
  });
}