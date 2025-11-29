import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";

// 🔹 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAeOEO_5kOqqQU845sSKOsaeJzFmk-MauY",
  authDomain: "joinhugparty.firebaseapp.com",
  projectId: "joinhugparty",
  storageBucket: "joinhugparty.appspot.com",
  messagingSenderId: "540501854830",
  appId: "1:540501854830:web:7249bb97b50582fe97747f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// DOM Elements
const uploadForm = document.getElementById("uploadForm");
const adminStatus = document.getElementById("adminStatus");
const songList = document.getElementById("songList");

// Upload handler
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
    // Upload song
    const songRef = ref(storage, `songs/${songFile.name}`);
    await uploadBytes(songRef, songFile);
    const songURL = await getDownloadURL(songRef);

    // Upload cover
    const coverRef = ref(storage, `covers/${coverFile.name}`);
    await uploadBytes(coverRef, coverFile);
    const coverURL = await getDownloadURL(coverRef);

    // Save metadata in Firestore
    await addDoc(collection(db, "songs"), {
      title,
      artist,
      songURL,
      coverURL,
      timestamp: Date.now()
    });

    adminStatus.textContent = "Song added successfully!";
    uploadForm.reset();
    loadSongs();
  } catch (err) {
    console.error(err);
    adminStatus.textContent = "Upload failed! Check console for errors.";
  }
});

// Load all songs for admin view
async function loadSongs() {
  songList.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "songs"));

  querySnapshot.forEach(doc => {
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
