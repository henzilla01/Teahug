import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// DOM Elements
const uploadForm = document.getElementById("uploadForm");
const adminStatus = document.getElementById("adminStatus");
const songList = document.getElementById("songList");

// Cloudinary
const CLOUD_NAME = "dmi3n8io4";
const UPLOAD_PRESET = "unsigned_preset";

// Firebase
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

// Upload Form
uploadForm.addEventListener("submit", async e => {
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
    const songData = new FormData();
    songData.append("file", songFile);
    songData.append("upload_preset", UPLOAD_PRESET);

    const coverData = new FormData();
    coverData.append("file", coverFile);
    coverData.append("upload_preset", UPLOAD_PRESET);

    const [songRes, coverRes] = await Promise.all([
      fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, { method: "POST", body: songData }),
      fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: coverData })
    ]);

    const songJson = await songRes.json();
    const coverJson = await coverRes.json();

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

// Load admin songs
async function loadAdminSongs() {
  songList.innerHTML = "";
  const snapshot = await getDocs(collection(db, "songs"));

  if (snapshot.empty) {
    songList.innerHTML = "<p style='opacity:0.7;text-align:center'>No songs yet.</p>";
    return;
  }

  snapshot.forEach(doc => {
    const s = doc.data();
    const div = document.createElement("div");
    div.innerHTML = `
      <img src="${s.coverURL}" class="admin-cover"/>
      <div>
        <h3>${s.title}</h3>
        <p>${s.artist}</p>
        <audio controls src="${s.songURL}"></audio>
      </div>
    `;
    songList.appendChild(div);
  });
}

// Initial load
loadAdminSongs();
