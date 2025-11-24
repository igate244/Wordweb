// ▼ Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyCuAr6OulPDjQXV-Ylm5JYysT7uOHymOac",
  authDomain: "webword-2d1b2.firebaseapp.com",
  projectId: "webword-2d1b2",
  storageBucket: "webword-2d1b2.firebasestorage.app",
  messagingSenderId: "579573439202",
  appId: "1:579573439202:web:1c02ae30be842a68e7dcbb",
  measurementId: "G-SS2ZR9BY67"
};

// ▼ Firebase SDK 読み込み
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ▼ Firebase 初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ▼ フォーム & 一覧テーブル
const form = document.getElementById("quote-form");
const listEl = document.getElementById("quotes-tbody");

// 念のため存在チェック（デバッグ用）
if (!listEl) {
  console.error("quotes-tbody が見つかりません。index.html の tbody の id を確認してください。");
}

// ▼ 名言を追加
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const character = document.getElementById("character").value;
  const text = document.getElementById("text").value;

  try {
    await addDoc(collection(db, "quotes"), {
      title,
      character,
      text,
      createdAt: serverTimestamp(), // サーバー時刻で登録
    });

    form.reset();
    await loadQuotes();
  } catch (err) {
    console.error("保存に失敗しました:", err);
    alert("保存に失敗しました…コンソールを確認してください。");
  }
});

// ▼ 一覧表示
async function loadQuotes() {
  if (!listEl) return; // 安全策

  listEl.innerHTML = "";

  const q = query(collection(db, "quotes"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  snapshot.forEach((doc) => {
    const data = doc.data();
    const tr = document.createElement("tr");

    // 登録日時の整形
    let createdStr = "";
    if (data.createdAt && data.createdAt.toDate) {
      const d = data.createdAt.toDate();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const mi = String(d.getMinutes()).padStart(2, "0");
      createdStr = `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
    }

    tr.innerHTML = `
      <td>${data.title ?? ""}</td>
      <td>${data.character ?? ""}</td>
      <td>${data.text ?? ""}</td>
      <td>${createdStr}</td>
    `;

    listEl.appendChild(tr);
  });
}

// ▼ 初回読み込み
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadQuotes);
} else {
  loadQuotes();
}
