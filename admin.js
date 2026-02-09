import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ======================
// DOM Elements
// ======================
const uploadForm = document.getElementById("uploadForm");
const adminStatus = document.getElementById("adminStatus");
const songList = document.getElementById("songList");

// ======================
// Cloudinary Config
// ======================
const CLOUD_NAME = "dmi3n8io4";
const UPLOAD_PRESET = "unsigned_preset";

// ======================
// Firebase Config
// ======================
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

// ======================
// Upload Song
// ======================
uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  adminStatus.textContent = "Uploading...";

  const title = document.getElementById("songTitle").value.trim();
  const artist = document.getElementById("songArtist").value.trim();
  const songFile = document.getElementById("songFile").files[0];
  const coverFile = document.getElementById("coverFile").files[0];

  if (!songFile || !coverFile) {
    adminStatus.textContent = "Select both song and cover!";
    return;
  }

  try {
    // Upload song
    const songData = new FormData();
    songData.append("file", songFile);
    songData.append("upload_preset", UPLOAD_PRESET);

    // Upload cover
    const coverData = new FormData();
    coverData.append("file", coverFile);
    coverData.append("upload_preset", UPLOAD_PRESET);

    const [songRes, coverRes] = await Promise.all([
      fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
        method: "POST",
        body: songData
      }),
      fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: coverData
      })
    ]);

    const songJson = await songRes.json();
    const coverJson = await coverRes.json();

    // Save to Firestore
    await addDoc(collection(db, "songs"), {
      title,
      artist,
      songURL: songJson.secure_url,
      coverURL: coverJson.secure_url,
      timestamp: Date.now()
    });

    adminStatus.textContent = "Song uploaded successfully!";
    uploadForm.reset();
    loadAdminSongs();

  } catch (err) {
    console.error(err);
    adminStatus.textContent = "Upload failed! Check console.";
  }
});

// ======================
// Load Songs + Delete
// ======================
async function loadAdminSongs() {
  songList.innerHTML = "";
  const snapshot = await getDocs(collection(db, "songs"));

  if (snapshot.empty) {
    songList.innerHTML = "<p style='opacity:0.7;text-align:center'>No songs yet.</p>";
    return;
  }

  snapshot.forEach(songDoc => {
    const s = songDoc.data();

    const div = document.createElement("div");
    div.classList.add("song-item");

    div.innerHTML = `
      <img src="${s.coverURL}" class="song-cover"/>

      <div class="song-meta">
        <h4>${s.title}</h4>
        <p>${s.artist}</p>
        <audio controls src="${s.songURL}"></audio>

        <div class="song-actions">
          <button 
            class="btn small deleteBtn" 
            data-id="${songDoc.id}" 
            style="background:var(--danger);">
            Delete
          </button>
        </div>
      </div>
    `;

    songList.appendChild(div);
  });

  // Attach delete events
  document.querySelectorAll(".deleteBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");

      const confirmDelete = confirm("Delete this song permanently?");
      if (!confirmDelete) return;

      try {
        await deleteDoc(doc(db, "songs", id));
        loadAdminSongs();
      } catch (err) {
        console.error(err);
        alert("Failed to delete");
      }
    });
  });
}

// ======================
// Initial Load
// ======================
loadAdminSongs();
