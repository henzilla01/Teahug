import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// 🔹 Firebase config from .env or directly
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

// 🔹 DOM Elements
const uploadForm = document.getElementById("uploadForm");
const adminStatus = document.getElementById("adminStatus");
const songList = document.getElementById("songList");

// 🔹 Cloudinary config
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/dmi3n8io4/upload`;
const CLOUDINARY_UPLOAD_PRESET = "Teahug";

// Upload listener
uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  adminStatus.textContent = "Uploading... Please wait.";

  const title = document.getElementById("songTitle").value.trim();
  const artist = document.getElementById("songArtist").value.trim();
  const songFile = document.getElementById("songFile").files[0];
  const coverFile = document.getElementById("coverFile").files[0];

  if (!songFile || !coverFile) {
    adminStatus.textContent = "Please select both song and cover files.";
    return;
  }

  try {
    // Upload song to Cloudinary
    const songData = new FormData();
    songData.append("file", songFile);
    songData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const songRes = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: songData,
    });
    const songResult = await songRes.json();

    // Upload cover to Cloudinary
    const coverData = new FormData();
    coverData.append("file", coverFile);
    coverData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const coverRes = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: coverData,
    });
    const coverResult = await coverRes.json();

    // Save metadata to Firestore
    await addDoc(collection(db, "songs"), {
      title,
      artist,
      songURL: songResult.secure_url,
      coverURL: coverResult.secure_url,
      timestamp: Date.now(),
    });

    adminStatus.textContent = "Song added successfully!";
    uploadForm.reset();
    loadSongs();
  } catch (err) {
    console.error(err);
    adminStatus.textContent = "Upload failed! Check console.";
  }
});

// Load all songs for admin view
async function loadSongs() {
  songList.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "songs"));
  querySnapshot.forEach((doc) => {
    const s = doc.data();
    const item = document.createElement("div");
    item.classList.add("admin-song-item");

    item.innerHTML = `
      <img src="${s.coverURL}" class="admin-cover"/>
      <div>
        <h3>${s.title}</h3>
        <p>${s.artist}</p>
        <audio controls src="${s.songURL}"></audio>
      </div>
    `;

    songList.appendChild(item);
  });
}

// Load songs on page load
loadSongs();
