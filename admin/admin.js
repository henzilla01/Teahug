// admin.js (upgraded)
// keep this file named admin.js — it expects the HTML above

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* =========================
   CONFIG - keep yours here
   ========================= */
const firebaseConfig = {
  apiKey: "AIzaSyAeOEO_5kOqqQU845sSKOsaeJzFmk-MauY",
  authDomain: "joinhugparty.firebaseapp.com",
  projectId: "joinhugparty",
  storageBucket: "joinhugparty.firebasestorage.app",
  messagingSenderId: "540501854830",
  appId: "1:540501854830:web:7249bb97b50582fe97747f"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* CLOUDINARY */
const CLOUD_NAME = "dmi3n8io4";
const UPLOAD_PRESET = "Teahug"; // unsigned preset name (ensure exists)

/* =========================
   DOM
   ========================= */
const uploadForm = document.getElementById("uploadForm");
const songTitleEl = document.getElementById("songTitle");
const songArtistEl = document.getElementById("songArtist");
const songFileEl = document.getElementById("songFile");
const coverFileEl = document.getElementById("coverFile");
const uploadBtn = document.getElementById("uploadBtn");
const clearBtn = document.getElementById("clearBtn");
const adminStatus = document.getElementById("adminStatus");

const uploadProgress = document.getElementById("uploadProgress");
const songProgressBar = document.getElementById("songProgressBar");
const coverProgressBar = document.getElementById("coverProgressBar");

const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const refreshBtn = document.getElementById("refreshBtn");
const darkToggle = document.getElementById("darkToggle");

const songListContainer = document.getElementById("songList");
const countLabel = document.getElementById("countLabel");

/* State */
let allSongs = []; // cached
let currentSort = "new";
let currentSearch = "";
let isDark = false;

/* Utilities */
function setStatus(msg, color) {
  adminStatus.textContent = msg || "";
  adminStatus.style.color = color || "var(--muted)";
}

/* Persist dark mode */
function applyDarkMode(v) {
  isDark = !!v;
  if (isDark) document.documentElement.classList.add("dark"), localStorage.setItem("admin_dark", "1");
  else document.documentElement.classList.remove("dark"), localStorage.removeItem("admin_dark");
}

/* init dark from storage */
if (localStorage.getItem("admin_dark")) {
  applyDarkMode(true);
  darkToggle.checked = true;
}

/* =========================
   Upload helper (XHR for progress)
   Returns JSON object from Cloudinary
   progressCallback(percent) -> called with 0-100
   url: upload endpoint (auto vs image)
   ========================= */
function uploadToCloudinaryXHR(file, preset, url, progressCallback) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", preset);

    xhr.open("POST", url, true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && typeof progressCallback === "function") {
        const percent = Math.round((e.loaded / e.total) * 100);
        progressCallback(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          resolve(json);
        } catch (err) {
          reject(err);
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(fd);
  });
}

/* =========================
   Upload form handler
   ========================= */
uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = songTitleEl.value.trim();
  const artist = songArtistEl.value.trim();
  const songFile = songFileEl.files[0];
  const coverFile = coverFileEl.files[0];

  if (!title || !artist || !songFile || !coverFile) {
    setStatus("Please fill all fields and select both files.", "var(--danger)");
    return;
  }

  try {
    setStatus("Preparing upload...", null);
    uploadProgress.style.display = "block";
    songProgressBar.style.width = "0%";
    coverProgressBar.style.width = "0%";

    // 1) song
    setStatus("Uploading song...", null);
    const songUrlEndpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
    const songJson = await uploadToCloudinaryXHR(songFile, UPLOAD_PRESET, songUrlEndpoint, (p) => {
      songProgressBar.style.width = `${p}%`;
    });

    // 2) cover
    setStatus("Uploading cover image...", null);
    const coverUrlEndpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
    const coverJson = await uploadToCloudinaryXHR(coverFile, UPLOAD_PRESET, coverUrlEndpoint, (p) => {
      coverProgressBar.style.width = `${p}%`;
    });

    // 3) save to Firestore
    setStatus("Saving metadata to Firestore...", null);
    await addDoc(collection(db, "songs"), {
      title,
      artist,
      songURL: songJson.secure_url,
      coverURL: coverJson.secure_url,
      timestamp: Date.now()
    });

    setStatus("Uploaded successfully ✅", "green");
    uploadForm.reset();
    uploadProgress.style.display = "none";
    songProgressBar.style.width = "0%";
    coverProgressBar.style.width = "0%";

    await loadSongs(); // refresh
  } catch (err) {
    console.error(err);
    setStatus("Upload failed — check console.", "var(--danger)");
    uploadProgress.style.display = "none";
  }
});

/* Clear form */
clearBtn.addEventListener("click", () => {
  uploadForm.reset();
  uploadProgress.style.display = "none";
  setStatus("");
});

/* Refresh & search/sort handlers */
refreshBtn.addEventListener("click", () => loadSongs());
searchInput.addEventListener("input", (e) => {
  currentSearch = e.target.value.trim().toLowerCase();
  renderList();
});
sortSelect.addEventListener("change", (e) => {
  currentSort = e.target.value;
  renderList();
});
darkToggle.addEventListener("change", (e) => {
  applyDarkMode(e.target.checked);
});

/* =========================
   Load songs from Firestore
   ========================= */
async function loadSongs() {
  setStatus("Loading songs...", null);
  try {
    const snapshot = await getDocs(collection(db, "songs"));
    const arr = [];
    snapshot.forEach(docSnap => {
      arr.push({ id: docSnap.id, ...docSnap.data() });
    });

    // client-side sort by timestamp
    arr.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    allSongs = arr;
    renderList();
    setStatus("");
  } catch (err) {
    console.error(err);
    setStatus("Failed to load songs.", "var(--danger)");
  }
}

/* =========================
   Render list with search + sort
   ========================= */
function renderList() {
  // clone and filter
  let list = allSongs.slice();

  // search
  if (currentSearch) {
    list = list.filter(s => {
      const t = (s.title || "").toLowerCase();
      const a = (s.artist || "").toLowerCase();
      return t.includes(currentSearch) || a.includes(currentSearch);
    });
  }

  // sort
  if (currentSort === "new") {
    list.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));
  } else {
    list.sort((a,b) => (a.timestamp || 0) - (b.timestamp || 0));
  }

  // update count
  countLabel.textContent = `${list.length} song${list.length === 1 ? "" : "s"}`;

  // render
  songListContainer.innerHTML = "";
  list.forEach(song => {
    const item = document.createElement("div");
    item.className = "song-item";
    item.innerHTML = `
      <img class="song-cover" src="${song.coverURL}" alt="${escapeHtml(song.title)}" />
      <div class="song-meta">
        <h4>${escapeHtml(song.title)}</h4>
        <p class="muted">${escapeHtml(song.artist)}</p>
        <audio controls src="${song.songURL}"></audio>
        <div class="edit-row" style="margin-top:8px;">
          <input type="text" class="edit-title" value="${escapeHtml(song.title)}" placeholder="Title" />
          <input type="text" class="edit-artist" value="${escapeHtml(song.artist)}" placeholder="Artist" />
        </div>
        <div style="margin-top:8px; display:flex; gap:8px;">
          <input type="file" class="replace-song small" accept=".mp3,audio/*" />
          <input type="file" class="replace-cover small" accept="image/*" />
        </div>
        <div class="progress" style="display:none; margin-top:8px;">
          <i style="width:0%"></i>
        </div>
      </div>
      <div class="song-actions">
        <button class="small btn saveBtn">Save</button>
        <button class="small ghost deleteBtn">Delete</button>
      </div>
    `;

    // attach events
    const saveBtn = item.querySelector(".saveBtn");
    const deleteBtn = item.querySelector(".deleteBtn");
    const editTitle = item.querySelector(".edit-title");
    const editArtist = item.querySelector(".edit-artist");
    const replaceSongInput = item.querySelector(".replace-song");
    const replaceCoverInput = item.querySelector(".replace-cover");
    const progressContainer = item.querySelector(".progress");
    const progressBarInner = progressContainer.querySelector("i");

    saveBtn.addEventListener("click", async () => {
      const newTitle = editTitle.value.trim();
      const newArtist = editArtist.value.trim();

      // quick validation
      if (!newTitle || !newArtist) {
        alert("Please enter title and artist.");
        return;
      }

      try {
        setStatus("Saving changes...", null);
        // if either file selected, upload first and then update doc
        let songUrl = song.songURL;
        let coverUrl = song.coverURL;

        // show progress bar if files exist
        progressContainer.style.display = "none";
        progressBarInner.style.width = "0%";

        // If replacing song
        if (replaceSongInput.files && replaceSongInput.files[0]) {
          progressContainer.style.display = "block";
          setStatus("Uploading new song...", null);
          const json = await uploadToCloudinaryXHR(replaceSongInput.files[0], UPLOAD_PRESET, `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, (p) => {
            progressBarInner.style.width = `${p}%`;
          });
          songUrl = json.secure_url;
          progressBarInner.style.width = "0%";
        }

        // If replacing cover
        if (replaceCoverInput.files && replaceCoverInput.files[0]) {
          progressContainer.style.display = "block";
          setStatus("Uploading new cover...", null);
          const json2 = await uploadToCloudinaryXHR(replaceCoverInput.files[0], UPLOAD_PRESET, `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, (p) => {
            progressBarInner.style.width = `${p}%`;
          });
          coverUrl = json2.secure_url;
          progressBarInner.style.width = "0%";
        }

        // update Firestore doc
        const dref = doc(db, "songs", song.id);
        await updateDoc(dref, {
          title: newTitle,
          artist: newArtist,
          songURL: songUrl,
          coverURL: coverUrl,
          // keep timestamp unchanged (or update if you want)
        });
        setStatus("Saved successfully", "green");
        await loadSongs();
      } catch (err) {
        console.error(err);
        setStatus("Save failed — check console", "var(--danger)");
      } finally {
        progressContainer.style.display = "none";
      }
    });

    deleteBtn.addEventListener("click", async () => {
      const ok = confirm(`Delete "${song.title}" by ${song.artist}?`);
      if (!ok) return;
      try {
        setStatus("Deleting...", null);
        await deleteDoc(doc(db, "songs", song.id));
        setStatus("Deleted", "green");
        await loadSongs();
      } catch (err) {
        console.error(err);
        setStatus("Delete failed — check console", "var(--danger)");
      }
    });

    songListContainer.appendChild(item);
  });
}

/* Helper: escape Html to prevent XSS in admin UI */
function escapeHtml(s) {
  if (!s && s !== 0) return "";
  return String(s).replace(/[&<>"'`=\/]/g, function (c) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
      "/": "&#x2F;",
      "`": "&#x60;",
      "=": "&#x3D;"
    }[c];
  });
}

/* =========================
   Start
   ========================= */
loadSongs();
setStatus("");
