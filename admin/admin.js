import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* FIREBASE */
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

/* DOM */
const uploadForm = document.getElementById("uploadForm");
const adminStatus = document.getElementById("adminStatus");
const songList = document.getElementById("songList");

/* CLOUDINARY CONFIG */
const CLOUD_NAME = "dmi3n8io4";
const UPLOAD_PRESET = "Teahug"; // unsigned preset

uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  adminStatus.textContent = "Uploading...";

  const title = document.getElementById("songTitle").value.trim();
  const artist = document.getElementById("songArtist").value.trim();
  const songFile = document.getElementById("songFile").files[0];
  const coverFile = document.getElementById("coverFile").files[0];

  if(!songFile || !coverFile){ adminStatus.textContent="Select song & cover."; return; }

  try {
    const songData = new FormData();
    songData.append("file", songFile);
    songData.append("upload_preset", UPLOAD_PRESET);

    const songRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, { method:"POST", body:songData });
    const songJson = await songRes.json();

    const coverData = new FormData();
    coverData.append("file", coverFile);
    coverData.append("upload_preset", UPLOAD_PRESET);

    const coverRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method:"POST", body:coverData });
    const coverJson = await coverRes.json();

    await addDoc(collection(db,"songs"),{
      title,
      artist,
      songURL: songJson.secure_url,
      coverURL: coverJson.secure_url,
      timestamp: Date.now()
    });

    adminStatus.textContent = "Uploaded successfully!";
    uploadForm.reset();
    loadSongs();
  } catch(err){
    console.error(err);
    adminStatus.textContent="Upload failed! Check console.";
  }
});

async function loadSongs(){
  songList.innerHTML="";
  const snapshot = await getDocs(collection(db,"songs"));
  snapshot.forEach(doc=>{
    const s=doc.data();
    const item=document.createElement("div");
    item.classList.add("admin-song-item");
    item.innerHTML=`<img src="${s.coverURL}" class="admin-cover"/>
    <div>
      <h3>${s.title}</h3>
      <p>${s.artist}</p>
      <audio controls src="${s.songURL}"></audio>
    </div>`;
    songList.appendChild(item);
  });
}

loadSongs();
