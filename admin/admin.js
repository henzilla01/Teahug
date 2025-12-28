// admin.js (robust version)
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
   CONFIG
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
const UPLOAD_PRESET = "Teahug"; // ensure unsigned preset exists

/* =========================
   DOM Elements
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
const songListContainer = document.getElementById("songList");
const countLabel = document.getElementById("countLabel");

/* =========================
   Utilities
   ========================= */
function setStatus(msg, color) {
  adminStatus.textContent = msg || "";
  adminStatus.style.color = color || "var(--muted)";
}

// Escape HTML for admin UI
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
   Upload helper with progress
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
          resolve(JSON.parse(xhr.responseText));
        } catch (err) {
          reject(new Error("Invalid JSON from Cloudinary"));
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
    setStatus("Fill all fields and select both files.", "var(--danger)");
    return;
  }

  try {
    setStatus("Preparing upload...", null);
    uploadProgress.style.display = "block";
    songProgressBar.style.width = "0%";
    coverProgressBar.style.width = "0%";

    // Upload song
    setStatus("Uploading song...", null);
    const songJson = await uploadToCloudinaryXHR(
      songFile,
      UPLOAD_PRESET,
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
      (p) => { songProgressBar.style.width = `${p}%`; }
    );

    // Upload cover
    setStatus("Uploading cover...", null);
    const coverJson = await uploadToCloudinaryXHR(
      coverFile,
      UPLOAD_PRESET,
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      (p) => { coverProgressBar.style.width = `${p}%`; }
    );

    // Save to Firestore
    setStatus("Saving metadata...", null);
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
    await loadSongs();
  } catch (err) {
    console.error(err);
    setStatus(`Upload failed: ${err.message}`, "var(--danger)");
    uploadProgress.style.display = "none";
  }
});

/* =========================
   Clear form
   ========================= */
clearBtn.addEventListener("click", () => {
  uploadForm.reset();
  uploadProgress.style.display = "none";
  setStatus("");
});

/* =========================
   Load songs from Firestore
   ========================= */
async function loadSongs() {
  setStatus("Loading songs...", null);
  try {
    const snapshot = await getDocs(collection(db, "songs"));
    const arr = [];
    snapshot.forEach(docSnap => arr.push({ id: docSnap.id, ...docSnap.data() }));
    arr.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));
    if (!arr.length) {
      songListContainer.innerHTML = "<p>No songs uploaded yet.</p>";
      countLabel.textContent = "0 songs";
      setStatus("");
      return;
    }
    allSongs = arr;
    renderList();
    setStatus("");
  } catch (err) {
    console.error(err);
    songListContainer.innerHTML = "<p>Failed to load songs.</p>";
    setStatus("Failed to load songs — check console.", "var(--danger)");
  }
}

/* =========================
   Render list
   ========================= */
function renderList() {
  songListContainer.innerHTML = "";
  allSongs.forEach(song => {
    const item = document.createElement("div");
    item.className = "song-item";
    item.innerHTML = `
      <img class="song-cover" src="${song.coverURL}" alt="${escapeHtml(song.title)}" />
      <div class="song-meta">
        <h4>${escapeHtml(song.title)}</h4>
        <p class="muted">${escapeHtml(song.artist)}</p>
        <audio controls src="${song.songURL}"></audio>
      </div>
    `;
    songListContainer.appendChild(item);
  });
  countLabel.textContent = `${allSongs.length} song${allSongs.length === 1 ? "" : "s"}`;
}

/* =========================
   Start
   ========================= */
loadSongs();
setStatus("");
