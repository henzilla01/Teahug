/* ===============================
   TEAHUG MAIN JAVASCRIPT - TikTok-style + Auto-Refresh
   =============================== */

/* ==== FIREBASE SETUP ==== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

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

/* ==== DOM ELEMENTS ==== */
const songFeed = document.getElementById("songFeed");

let allSongs = [];
let songElements = [];
let audioPlayers = [];
let currentIndex = 0;

/* ===============================
   LOAD SONGS FROM FIRESTORE
   =============================== */
async function loadSongs() {
  try {
    const ref = collection(db, "songs");
    const snapshot = await getDocs(ref);

    const newSongs = [];
    snapshot.forEach(doc => {
      const s = doc.data();
      newSongs.push({
        title: s.title,
        artist: s.artist,
        songURL: s.songURL,
        coverURL: s.coverURL
      });
    });

    // Only rebuild feed if there are new songs or changes
    if (JSON.stringify(newSongs) !== JSON.stringify(allSongs)) {
      allSongs = newSongs;
      buildFeed();
      playSong(0);
    }
  } catch (err) {
    console.error("Error fetching songs:", err);
  }
}

/* ===============================
   BUILD TIKTOK-STYLE FEED
   =============================== */
function buildFeed() {
  songFeed.innerHTML = "";
  songElements = [];
  audioPlayers = [];

  allSongs.forEach((song, index) => {
    const card = document.createElement("div");
    card.classList.add("song-card");

    card.innerHTML = `
      <img src="${song.coverURL}" class="song-img" alt="${song.title}">
      <div class="song-info">
        <h3>${song.title}</h3>
        <p>${song.artist}</p>
      </div>
      <div class="play-overlay">▶</div>
    `;

    const audio = new Audio(song.songURL);
    audio.loop = true;

    audioPlayers.push(audio);
    songElements.push(card);

    /* TAP TO PLAY/PAUSE */
    const playOverlay = card.querySelector(".play-overlay");
    card.addEventListener("click", () => {
      if (audio.paused) {
        audio.play();
        playOverlay.style.display = "none";
      } else {
        audio.pause();
        playOverlay.style.display = "block";
      }
    });

    songFeed.appendChild(card);
  });

  enableSwipe();
}

/* ===============================
   SWIPE UP / DOWN NAVIGATION
   =============================== */
function enableSwipe() {
  let startY = 0;
  let endY = 0;

  songFeed.addEventListener("touchstart", (e) => {
    startY = e.touches[0].clientY;
  });

  songFeed.addEventListener("touchend", (e) => {
    endY = e.changedTouches[0].clientY;

    if (startY - endY > 80) nextSong();
    if (endY - startY > 80) prevSong();
  });
}

/* ==== MOVE TO NEXT SONG ==== */
function nextSong() {
  stopAll();
  currentIndex++;
  if (currentIndex >= songElements.length) currentIndex = 0;
  scrollToSong(currentIndex);
  playSong(currentIndex);
}

/* ==== MOVE TO PREVIOUS SONG ==== */
function prevSong() {
  stopAll();
  currentIndex--;
  if (currentIndex < 0) currentIndex = songElements.length - 1;
  scrollToSong(currentIndex);
  playSong(currentIndex);
}

/* ==== SCROLL TO SONG ==== */
function scrollToSong(i) {
  songElements[i].scrollIntoView({ behavior: "smooth" });
}

/* ==== PLAY SONG ==== */
function playSong(i) {
  stopAll();
  audioPlayers[i].play();
}

/* ==== STOP ALL SONGS ==== */
function stopAll() {
  audioPlayers.forEach(a => {
    a.pause();
    a.currentTime = 0;
  });
}

/* ===============================
   AUTO-REFRESH FEED EVERY 10 SECONDS
   =============================== */
loadSongs(); // initial load
setInterval(loadSongs, 10000); // refresh every 10 sec
