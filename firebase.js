// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { 
  getAuth, 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import { 
  getFirestore, 
  doc, setDoc, getDoc, collection, addDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import { 
  getStorage, 
  ref, uploadBytesResumable, getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

import { getDatabase, ref as dbRef, push, onValue, set, serverTimestamp as rtdbServerTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "lonhros-secret.firebaseapp.com",
  projectId: "lonhros-secret",
  storageBucket: "lonhros-secret.appspot.com",
  messagingSenderId: "XXXXXXXXXXXX",
  appId: "1:XXXXXXXXXXXX:web:XXXXXXXXXXXXXXXX",
  databaseURL: "https://lonhros-secret-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app);

// Listen for auth changes
onAuthStateChanged(auth, user => {
  currentUser = user;
  if (user) {
    console.log("Logged in as:", user.uid);
    loadUserProfile();
    listenToFeed();
    listenToPNP();
  } else {
    console.log("No user – showing splash");
    document.getElementById('splash').classList.add('active');
  }
});

let currentUser = null;