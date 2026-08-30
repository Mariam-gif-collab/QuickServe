import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

export async function registerUser(email, password, fullName, role, providerData = null) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  await setDoc(doc(db, "users", uid), { uid, email, fullName, role, createdAt: new Date().toISOString() });

  if (role === "provider" && providerData) {
    await setDoc(doc(db, "providers", uid), {
      name: fullName,
      category: providerData.category,
      location: providerData.location,
      experience: Number(providerData.experience),
      hourlyRate: Number(providerData.hourlyRate),
      profilePicUrl: providerData.imageUrl || "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400",
      rating: 5.0,
      totalReviews: 1
    });
  }
}

export async function loginUser(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const userSnap = await getDoc(doc(db, "users", cred.user.uid));
  return userSnap.data();
}

export function handleAuthNavigation() {
  onAuthStateChanged(auth, async (user) => {
    const navRight = document.getElementById("nav-right");
    const heroActions = document.querySelector(".hero-actions");

    if (user) {
      const snap = await getDoc(doc(db, "users", user.uid));
      const role = snap.data()?.role;
      const dashUrl = role === "provider" ? "provider-dashboard.html" : "customer-dashboard.html";
      const email = user.email || "Account";
      if (navRight) {
        navRight.innerHTML = `
          <span class="user-badge">${email}</span>
          <a href="${dashUrl}" class="btn-secondary">Dashboard</a>
          <button id="btn-logout" class="btn-primary">Logout</button>
        `;
        document.getElementById("btn-logout")?.addEventListener("click", () => signOut(auth).then(() => location.href = "login.html"));
      }
      if (heroActions) {
        heroActions.style.display = "none";
      }
    } else {
      if (navRight) {
        navRight.innerHTML = `
          <a href="login.html?mode=login" class="btn-secondary">Login</a>
          <a href="login.html?mode=register" class="btn-primary">Sign Up</a>
        `;
      }
      if (heroActions) {
        heroActions.style.display = "flex";
      }
    }
  });
}