import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// ⚠️ Firebase config reads from environment variables now
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const uploadForm = document.getElementById("uploadForm");
const adminStatus = document.getElementById("adminStatus");
const songList = document.getElementById("songList");

// Replace this with your Cloudflare Worker URL
const R2_UPLOAD_URL = https://pub-bf38f9589fd44fdc8fd0388dcd8eeba5.r2.dev/upload;

uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  adminStatus.textContent = "Uploading... Please wait.";

  const title = document.getElementById("songTitle").value.trim();
  const artist = document.getElementById("songArtist").value.trim();
  const songFile = document.getElementById("songFile").files[0];
  const coverFile = document.getElementById("coverFile").files[0];

  const formData = new FormData();
  formData.append("song", songFile);
  formData.append("cover", coverFile);

  const uploadResponse = await fetch(R2_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  const uploaded = await uploadResponse.json();
  if (!uploaded.success) {
    adminStatus.textContent = "Upload failed!";
    return;
  }

  const songURL = uploaded.songUrl;
  const coverURL = uploaded.coverUrl;

  // Save metadata to Firestore
  await addDoc(collection(db, "songs"), {
    title,
    artist,
    songURL,
    coverURL,
    timestamp: Date.now(),
  });

  adminStatus.textContent = "Song added successfully!";
  uploadForm.reset();
  loadSongs();
});

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

loadSongs();
