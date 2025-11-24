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

// ▼ フォーム & テーブル
const form = document.getElementById("quote-form");
const listEl = document.getElementById("quotes-tbody");

// 送信ボタン（見つからない時は null のままでも落ちないようにする）
let submitBtn =
  document.getElementById("submit-button") ||
  (form ? form.querySelector('button[type="submit"]') : null);

let cachedQuotes = [];
let currentSort = { key: "createdAt", asc: false };
let editingId = null;

// ▼ フォームリセット
function resetForm() {
  if (!form) return;
  form.reset();
  editingId = null;
  if (submitBtn) submitBtn.textContent = "追加";
}

// ▼ 名言追加 / 更新
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value;
    const character = document.getElementById("character").value;
    const text = document.getElementById("text").value;

    try {
      if (editingId) {
        // 更新
        const ref = doc(db, "quotes", editingId);
        await updateDoc(ref, {
          title,
          character,
          text
          // createdAt はそのまま
        });
      } else {
        // 新規追加
        await addDoc(collection(db, "quotes"), {
          title,
          character,
          text,
          createdAt: serverTimestamp(),
        });
      }

      resetForm();
      await loadQuotes();
    } catch (err) {
      console.error("保存・更新に失敗しました:", err);
      alert("保存または更新に失敗しました。コンソールを確認してください。");
    }
  });
}

// ▼ 一覧取得
async function loadQuotes() {
  const q = query(collection(db, "quotes"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  cachedQuotes = snapshot.docs.map(docSnap => {
    return { id: docSnap.id, ...docSnap.data() };
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

// ▼ 行の編集・削除（イベント委譲）
if (listEl) {
  listEl.addEventListener("click", async (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    const id = target.dataset.id;
    if (!id) return;

    if (target.classList.contains("edit-btn")) {
      // 編集モードに切替
      const q = cachedQuotes.find(item => item.id === id);
      if (!q) return;

      document.getElementById("title").value = q.title ?? "";
      document.getElementById("character").value = q.character ?? "";
      document.getElementById("text").value = q.text ?? "";
      editingId = id;
      if (submitBtn) submitBtn.textContent = "更新";

    } else if (target.classList.contains("delete-btn")) {
      // 削除
      const ok = window.confirm("この名言を削除しますか？");
      if (!ok) return;

      try {
        await deleteDoc(doc(db, "quotes", id));
        if (editingId === id) {
          resetForm();
        }
        await loadQuotes();
      } catch (err) {
        console.error("削除に失敗しました:", err);
        alert("削除に失敗しました。コンソールを確認してください。");
      }
    }
  });
}

// ▼ ヘッダークリック → ソート切替
document.querySelectorAll("thead th").forEach((th, idx) => {
  const keys = ["title", "character", "text", "createdAt"]; // 5列目（操作）は除外
  const key = keys[idx];

  if (!key) return; // 操作列

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
