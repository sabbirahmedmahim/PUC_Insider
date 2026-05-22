import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAInkx3PZugoMUAG1CmMaqXtUJ-BffpTzk",
  authDomain: "puc-insider.firebaseapp.com",
  projectId: "puc-insider",
  storageBucket: "puc-insider.appspot.com",
  messagingSenderId: "730819202755",
  appId: "1:730819202755:web:5fc6f02b5a744279421c76"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.getElementById('signupBtn').addEventListener('click', () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) return alert("Please enter both email and password");
  if (!email.endsWith("@bscse.puc.ac.bd")) return alert("Use university email only (@bscse.puc.ac.bd)");

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => window.location.href = "dashboard.html")
    .catch(err => alert(err.message));
});

document.getElementById('loginBtn').addEventListener('click', () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) return alert("Please enter both email and password");

  signInWithEmailAndPassword(auth, email, password)
    .then(() => window.location.href = "dashboard.html")
    .catch(err => alert(err.message));
});