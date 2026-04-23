// firebase.js – zero auth edition
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  databaseURL: "YOUR_DATABASE_URL"
};

export const firebaseEnabled = Object.values(firebaseConfig).every(
  value => typeof value === "string" && value !== "" && !value.startsWith("YOUR_")
);

const app = firebaseEnabled ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
export const rtdb = app ? getDatabase(app) : null;
export { serverTimestamp, Timestamp };

export let anonId = localStorage.getItem("lonhroAnonId") || "anon_" + Math.random().toString(36).slice(2, 10);
localStorage.setItem("lonhroAnonId", anonId);