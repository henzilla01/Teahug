import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Firebase config
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

// DOM Elements
const songFeed = document.getElementById("songFeed");
const introPopup = document.getElementById("introPopup");
const aboutPopup = document.getElementById("aboutPopup");
const messagePopup = document.getElementById("messagePopup");
const aboutBtn = document.getElementById("aboutBtn");
const countdownEl = document.getElementById("countdown");
const songTitleEl = document.getElementById("songTitle");
const userMsgInput = document.getElementById("userMessage");
const sendMsgBtn = document.getElementById("sendMsgBtn");

let allSongs = [];
let currentIndex = 0;
let audioPlayers = [];

// =====================
// Intro popup auto-hide
// =====================
setTimeout(() => introPopup.classList.add("hidden"), 5000);

// =====================
// About popup
// =====================
aboutBtn.addEventListener("click", () => {
  aboutPopup.classList.remove("hidden");
});

window.closeAbout = function () {
  aboutPopup.classList.add("hidden");
};

// =====================
// Message popup
// =====================
window.closeMessageForm = function () {
  messagePopup.classList.add("hidden");
};

// =====================
// Load songs from Firestore
// =====================
async function loadSongs() {
  const snapshot = await getDocs(collection(db, "songs"));
  allSongs = [];
  snapshot.forEach(doc => {
    allSongs.push({ id: doc.id, ...doc.data() });
  });

  shuffleSongs();
  buildFeed();
  showSong(0);
}

// Shuffle songs randomly
function shuffleSongs() {
  for (let i = allSongs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allSongs[i], allSongs[j]] = [allSongs[j], allSongs[i]];
  }
}

// =====================
// Build TikTok-style feed
// =====================
function buildFeed() {
  songFeed.innerHTML = "";
  audioPlayers = [];

  allSongs.forEach((song, i) => {
    const card = document.createElement("div");
    card.classList.add("song-card");
    card.style.height = "100vh"; // full viewport height

    card.innerHTML = `
      <img src="${song.coverURL}" class="song-img">
      <div class="play-overlay">▶</div>
      <button class="sendBtn">Send</button>
    `;

    const audio = new Audio(song.songURL);
    audio.loop = true;
    audioPlayers.push(audio);

    // Send button
    card.querySelector(".sendBtn").onclick = () => openMessageForm(song);

    // Tap to play/pause
    const playOverlay = card.querySelector(".play-overlay");
    card.addEventListener("click", (e) => {
      if (e.target !== card.querySelector(".sendBtn")) {
        if (audio.paused) {
          audio.play();
          playOverlay.style.display = "none";
        } else {
          audio.pause();
          playOverlay.style.display = "block";
        }
      }
    });

    songFeed.appendChild(card);
  });

  enableSwipe();
}

// =====================
// Swipe navigation
// =====================
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

// Show song at index
function showSong(i) {
  stopAll();
  currentIndex = i;
  songFeed.children[i].scrollIntoView({ behavior: "smooth" });
  audioPlayers[i].play();
}

// Stop all audio
function stopAll() {
  audioPlayers.forEach(a => {
    a.pause();
    a.currentTime = 0;
  });
}

// Next / Previous song
function nextSong() {
  currentIndex++;
  if (currentIndex >= allSongs.length) currentIndex = 0;
  showSong(currentIndex);
}

function prevSong() {
  currentIndex--;
  if (currentIndex < 0) currentIndex = allSongs.length - 1;
  showSong(currentIndex);
}

/* ===============================
   OPEN SEND MESSAGE POPUP ONLY WHEN "SEND" BUTTON IS PRESSED
   =============================== */
function openMessageForm(song) {
  songTitleEl.textContent = song.title || "(Untitled)";
  messagePopup.classList.remove("hidden");

  // Set click handler fresh each time
  sendMsgBtn.onclick = () => sendEmail(song);
}

/* ===============================
   CLOSE SEND POPUP
   =============================== */
window.closeMessageForm = function () {
  messagePopup.classList.add("hidden");
};

// =====================
// Send email (worker endpoint)
// =====================
async function sendEmail(song) {
  const message = userMsgInput.value.trim();
  if (!message) return alert("Please type a message.");

  const payload = {
    title: song.title,
    message
  };

  const res = await fetch("https://teahug.workers.dev/send", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    alert("Message sent ❤️");
    messagePopup.classList.add("hidden");
    userMsgInput.value = "";
  } else {
    alert("Failed to send message.");
  }
}

// =====================
// Hug Hour countdown (9PM–12AM)
// =====================
function updateCountdown() {
  const now = new Date();
  const currentHour = now.getHours();
  const target = new Date();
  target.setHours(21, 0, 0, 0);

  if (currentHour >= 21 && currentHour < 24) {
    countdownEl.textContent = "Hug Hour Active ❤️";
    return;
  }

  let diff = target - now;
  if (diff < 0) diff += 24 * 60 * 60 * 1000; // next day
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  countdownEl.textContent = `${h}h ${m}m to Hug Hour`;
}

setInterval(updateCountdown, 1000);

// =====================
// Start
// =====================
loadSongs();
updateCountdown();

