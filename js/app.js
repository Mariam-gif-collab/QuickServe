
import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { handleAuthNavigation } from "./auth.js";

let providers = [];

async function initHome() {
  handleAuthNavigation();
  const querySnapshot = await getDocs(collection(db, "providers"));
  providers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderProviders(providers);
}

function renderProviders(data) {
  const grid = document.getElementById("providers-grid");
  grid.innerHTML = "";

  if (!data.length) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text-muted);">
        No providers found for this category.
      </div>
    `;
    return;
  }

  data.forEach((p, idx) => {
    const card = document.createElement("div");
    card.className = "provider-card";
    card.setAttribute("data-aos", "fade-up");
    card.setAttribute("data-aos-delay", (idx * 50).toString());
    
    card.innerHTML = `
      <div class="card-header">
        <img src="${p.profilePicUrl}" alt="${p.name}">
        <span class="category-badge">${p.category}</span>
      </div>
      <div class="card-body">
        <h3>${p.name}</h3>
        <p style="color: var(--text-muted); font-size: 0.85rem;">📍 ${p.location} • ${p.experience} yrs exp</p>
        <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 800; color: var(--accent); font-size: 1.2rem;">$${p.hourlyRate}/hr</span>
          <a href="provider-detail.html?id=${p.id}" class="btn-primary">View & Book</a>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

document.getElementById("category-filter")?.addEventListener("change", (e) => {
  const selected = e.target.value.trim();
  const normalized = selected.toLowerCase();

  renderProviders(
    selected === "all"
      ? providers
      : providers.filter(p => (p.category || "").toLowerCase().includes(normalized))
  );
});

initHome();