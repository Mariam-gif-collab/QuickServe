 import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
 import { getAuth } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
 import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyCTQ-0pbkG25xWSS3AwyQophnb0sS8z3AY",
    authDomain: "testing-52de8.firebaseapp.com",
    projectId: "testing-52de8",
    storageBucket: "testing-52de8.firebasestorage.app",
    messagingSenderId: "1025901443268",
    appId: "1:1025901443268:web:e76f98761aa53d40ddb191"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  export const auth = getAuth(app);
export const db = getFirestore(app);