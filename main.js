/* ===============================
   TEAHUG MAIN JAVASCRIPT
   =============================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔹 Firebase config
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

// DOM elements
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
let songElements = [];
let audioPlayers = [];

/* ===============================
   POPUP HANDLING
   =============================== */
setTimeout(() => introPopup.classList.add("hidden"), 5000); // intro popup auto-close 5 sec

aboutBtn.addEventListener("click", () => {
  aboutPopup.classList.remove("hidden");
});

window.closeAbout = function () {
  aboutPopup.classList.add("hidden");
};

window.closeMessageForm = function () {
  messagePopup.classList.add("hidden");
};

/* ===============================
   LOAD SONGS
   =============================== */
async function loadSongs() {
  const snapshot = await getDocs(collection(db, "songs"));
  allSongs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  buildFeed();
  playSong(0);
}

/* ===============================
   BUILD FEED
   =============================== */
function buildFeed() {
  songFeed.innerHTML = "";
  songElements = [];
  audioPlayers = [];

  allSongs.forEach((song, index) => {
    const card = document.createElement("div");
    card.classList.add("song-card");

    card.innerHTML = `
      <img src="${song.coverURL}" class="song-img"/>
      <div class="play-overlay">▶</div>
      <button class="sendBtn">Send</button>
    `;

    const audio = new Audio(song.songURL);
    audio.loop = true;
    audioPlayers.push(audio);
    songElements.push(card);

    // Send button click
    card.querySelector(".sendBtn").onclick = (e) => {
      e.stopPropagation(); // prevent pause/play
      openMessageForm(song);
    };

    // Tap to play/pause
    const playOverlay = card.querySelector(".play-overlay");
    card.addEventListener("click", () => {
      if (audio.paused) {
        stopAll();
        audio.play();
        playOverlay.style.display = "none";
      } else {
        audio.pause();
        playOverlay.style.display = "block";
      }
    });

    songFeed.appendChild(card);
  });

  enableScrollSnap();
}

/* ===============================
   SCROLL SNAP
   =============================== */
function enableScrollSnap() {
  songFeed.addEventListener("scroll", () => {
    const index = Math.round(songFeed.scrollTop / window.innerHeight);
    if (index !== currentIndex) {
      stopAll();
      currentIndex = index;
      audioPlayers[currentIndex]?.play();
    }
  });
}

/* ===============================
   PLAY/STOP SONGS
   =============================== */
function playSong(i) {
  stopAll();
  audioPlayers[i]?.play();
}

function stopAll() {
  audioPlayers.forEach(a => {
    a.pause();
    a.currentTime = 0;
  });
}

/* ===============================
   OPEN MESSAGE FORM
   =============================== */
function openMessageForm(song) {
  songTitleEl.textContent = song.title;
  messagePopup.classList.remove("hidden");

  sendMsgBtn.onclick = () => sendEmail(song);
}

/* ===============================
   SEND MESSAGE (via Worker)
   =============================== */
async function sendEmail(song) {
  const message = userMsgInput.value.trim();
  if (!message) return alert("Please type a message.");

  const payload = {
    title: song.title,
    message: message,
  };

  const res = await fetch("https://teahug.workers.dev/send", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    alert("Message sent ❤️");
    messagePopup.classList.add("hidden");
    userMsgInput.value = "";
  } else {
    alert("Failed to send message.");
  }
}

/* ===============================
   HUG HOUR COUNTDOWN
   =============================== */
function updateCountdown() {
  const now = new Date();
  const current = now.getHours();

  let target = new Date();
  target.setHours(21, 0, 0, 0);

  if (current >= 21) {
    countdownEl.textContent = "Hug Hour Active ❤️";
    return;
  }

  let diff = target - now;
  let h = Math.floor(diff / 3600000);
  let m = Math.floor((diff % 3600000) / 60000);
  countdownEl.textContent = `${h}h ${m}m to Hug Hour`;
}

setInterval(updateCountdown, 1000);

/* ===============================
   START EVERYTHING
   =============================== */
loadSongs();
updateCountdown();
