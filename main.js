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

// ▼ フォーム & テーブル
const form = document.getElementById("quote-form");
const listEl = document.getElementById("quotes-tbody");

let cachedQuotes = [];
let currentSort = { key: "createdAt", asc: false };

// ▼ 名言追加
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
      createdAt: serverTimestamp(),
    });

    form.reset();
    await loadQuotes();
  } catch (err) {
    console.error("保存失敗:", err);
    alert("保存に失敗しました");
  }
});

// ▼ 一覧取得
async function loadQuotes() {
  const q = query(collection(db, "quotes"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  cachedQuotes = snapshot.docs.map(doc => {
    return { id: doc.id, ...doc.data() };
  });

  applySort();
}

// ▼ 並び替え適用
function applySort() {
  let arr = [...cachedQuotes];

  arr.sort((a, b) => {
    const k = currentSort.key;
    const dir = currentSort.asc ? 1 : -1;

    let av = a[k];
    let bv = b[k];

    if (av?.toDate) av = av.toDate();
    if (bv?.toDate) bv = bv.toDate();

    if (typeof av === "string") av = av.toLowerCase();
    if (typeof bv === "string") bv = bv.toLowerCase();

    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });

  renderTable(arr);
}

// ▼ テーブル描画
function renderTable(arr) {
  listEl.innerHTML = "";

  arr.forEach((data) => {
    const tr = document.createElement("tr");

    let createdStr = "";
    if (data.createdAt?.toDate) {
      const d = data.createdAt.toDate();
      createdStr =
        `${d.getFullYear()}` +
        "/" +
        String(d.getMonth() + 1).padStart(2, "0") +
        "/" +
        String(d.getDate()).padStart(2, "0") +
        " " +
        String(d.getHours()).padStart(2, "0") +
        ":" +
        String(d.getMinutes()).padStart(2, "0");
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


// ▼ ヘッダークリック → ソート切替
document.querySelectorAll("th").forEach((th, idx) => {
  const keys = ["title", "character", "text", "createdAt"];

  th.style.cursor = "pointer";

  th.addEventListener("click", () => {
    const k = keys[idx];

    if (currentSort.key === k) {
      currentSort.asc = !currentSort.asc;
    } else {
      currentSort.key = k;
      currentSort.asc = true;
    }
    applySort();
  });
});

// ▼ 初回実行
loadQuotes();
