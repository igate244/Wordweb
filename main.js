// ▼ Firebase設定（ここを自分の設定で書き換える）
const firebaseConfig = {
  apiKey: "AIzaSyCuAr6OulPDjQXV-Ylm5JYysT7uOHymOac",
  authDomain: "webword-2d1b2.firebaseapp.com",
  projectId: "webword-2d1b2",
  storageBucket: "webword-2d1b2.firebasestorage.app",
  messagingSenderId: "579573439202",
  appId: "1:579573439202:web:1c02ae30be842a68e7dcbb",
  measurementId: "G-SS2ZR9BY67"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase 初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// フォーム
const form = document.getElementById("quote-form");
const listEl = document.getElementById("quotes-list");

// 送信
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const character = document.getElementById("character").value;
  const text = document.getElementById("text").value;

  await addDoc(collection(db, "quotes"), {
    title,
    character,
    text,
    createdAt: new Date()
  });

  form.reset();
  loadQuotes();
});

// 一覧表示
async function loadQuotes() {
  listEl.innerHTML = "";

  const q = query(collection(db, "quotes"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  snapshot.forEach((doc) => {
    const data = doc.data();
    const li = document.createElement("li");
    li.textContent = `【${data.title}】${data.character}：「${data.text}」`;
    listEl.appendChild(li);
  });
}

loadQuotes();
