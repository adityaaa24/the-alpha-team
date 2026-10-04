/**
 * The Alpha Team - Firebase Configuration & Initialization
 * Exports initialized Firebase App, Authentication, and Firestore
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZ3_zctiyctUjdPavK_cd8ZaRB4-DrLG4",
  authDomain: "alpha-team-website.firebaseapp.com",
  projectId: "alpha-team-website",
  storageBucket: "alpha-team-website.firebasestorage.app",
  messagingSenderId: "460395253407",
  appId: "1:460395253407:web:3cd0207ee17e3fc9989caa",
  measurementId: "G-58VEK2DFEF"
};

// Initialize Firebase services
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
