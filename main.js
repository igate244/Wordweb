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
  serverTimestamp,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ▼ Firebase 初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ▼ DOM取得
const formSection = document.getElementById("form-section");
const toggleFormBtn = document.getElementById("toggle-form-button");
const form = document.getElementById("quote-form");
const listEl = document.getElementById("quotes-tbody");
const submitBtn = document.getElementById("submit-button");

let cachedQuotes = [];
let currentSort = { key: "createdAt", asc: false };
let editingId = null;

// ========== フォームの開閉関連 ==========

// 新規追加用にフォームを開く
function openFormForNew() {
  editingId = null;
  if (form) form.reset();
  if (submitBtn) submitBtn.textContent = "追加";
  if (formSection) formSection.style.display = "block";
  if (toggleFormBtn) toggleFormBtn.textContent = "フォームを閉じる";
}

// 編集用にフォームを開く
function openFormForEdit(q) {
  if (!form) return;
  document.getElementById("title").value = q.title ?? "";
  document.getElementById("character").value = q.character ?? "";
  document.getElementById("text").value = q.text ?? "";
  editingId = q.id;
  if (submitBtn) submitBtn.textContent = "更新";
  if (formSection) formSection.style.display = "block";
  if (toggleFormBtn) toggleFormBtn.textContent = "フォームを閉じる";
}

// フォームを閉じる
function hideForm() {
  editingId = null;
  if (form) form.reset();
  if (submitBtn) submitBtn.textContent = "追加";
  if (formSection) formSection.style.display = "none";
  if (toggleFormBtn) toggleFormBtn.textContent = "＋ 名言を追加";
}

// 「＋ 名言を追加」ボタンのイベント
if (toggleFormBtn) {
  toggleFormBtn.addEventListener("click", () => {
    if (!formSection) return;
    const visible = formSection.style.display === "block";
    if (visible) {
      hideForm();
    } else {
      openFormForNew();
    }
  });
}

// ========== 追加・更新 ==========

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value;
    const character = document.getElementById("character").value;
    const text = document.getElementById("text").value;

    try {
      if (editingId) {
        const ref = doc(db, "quotes", editingId);
        await updateDoc(ref, {
          title,
          character,
          text
        });
      } else {
        await addDoc(collection(db, "quotes"), {
          title,
          character,
          text,
          createdAt: serverTimestamp(),
        });
      }

      hideForm();        // 送信後は閉じる
      await loadQuotes();
    } catch (err) {
      console.error("保存・更新に失敗しました:", err);
      alert("保存または更新に失敗しました。コンソールを確認してください。");
    }
  });
}

// ========== Firestoreから取得 & ソート & 描画 ==========

async function loadQuotes() {
  const q = query(collection(db, "quotes"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  cachedQuotes = snapshot.docs.map(docSnap => {
    return { id: docSnap.id, ...docSnap.data() };
  });

  applySort();
}

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

function renderTable(arr) {
  if (!listEl) return;
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
      <td class="actions">
        <button type="button" class="edit-btn" data-id="${data.id}">編集</button>
        <button type="button" class="delete-btn" data-id="${data.id}">削除</button>
      </td>
    `;

    listEl.appendChild(tr);
  });
}

// ========== 行の編集・削除 ==========

if (listEl) {
  listEl.addEventListener("click", async (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    const id = target.dataset.id;
    if (!id) return;

    if (target.classList.contains("edit-btn")) {
      const q = cachedQuotes.find(item => item.id === id);
      if (!q) return;
      openFormForEdit(q);

    } else if (target.classList.contains("delete-btn")) {
      const ok = window.confirm("この名言を削除しますか？");
      if (!ok) return;

      try {
        await deleteDoc(doc(db, "quotes", id));
        if (editingId === id) {
          hideForm();
        }
        await loadQuotes();
      } catch (err) {
        console.error("削除に失敗しました:", err);
        alert("削除に失敗しました。コンソールを確認してください。");
      }
    }
  });
}

// ========== ヘッダークリックでソート ==========

document.querySelectorAll("thead th").forEach((th, idx) => {
  const keys = ["title", "character", "text", "createdAt"]; // 操作列は除外
  const key = keys[idx];
  if (!key) return;

  th.classList.add("sortable");
  th.addEventListener("click", () => {
    if (currentSort.key === key) {
      currentSort.asc = !currentSort.asc;
    } else {
      currentSort.key = key;
      currentSort.asc = true;
    }
    applySort();
  });
});

// ▼ 初回実行
loadQuotes();
