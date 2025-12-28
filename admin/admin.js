// admin.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

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

const uploadForm = document.getElementById("uploadForm");
const adminStatus = document.getElementById("adminStatus");
const CLOUD_NAME = "dmi3n8io4";
const UPLOAD_PRESET = "Teahug";

function setStatus(msg, color) {
  adminStatus.textContent = msg || "";
  adminStatus.style.color = color || "var(--muted)";
}

uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("songTitle").value.trim();
  const artist = document.getElementById("songArtist").value.trim();
  const songFile = document.getElementById("songFile").files[0];
  const coverFile = document.getElementById("coverFile").files[0];
  if (!title || !artist || !songFile || !coverFile) return setStatus("Please fill all fields", "red");

  try {
    setStatus("Uploading...");
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
      title, artist,
      songURL: songJson.secure_url,
      coverURL: coverJson.secure_url,
      timestamp: Date.now()
    });

    setStatus("Upload successful ✅", "green");
    uploadForm.reset();
  } catch (err) {
    console.error(err);
    setStatus("Upload failed — check console", "red");
  }
});

// Initial load of songs (for admin display)
async function loadSongs() {
  try {
    const snapshot = await getDocs(collection(db, "songs"));
    const songList = document.getElementById("songList");
    songList.innerHTML = "";
    snapshot.forEach(doc => {
      const s = doc.data();
      const div = document.createElement("div");
      div.innerHTML = `<img src="${s.coverURL}" width="50" /> ${s.title} - ${s.artist}`;
      songList.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    setStatus("Failed to load songs", "red");
  }
}

loadSongs();
