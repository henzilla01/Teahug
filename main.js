/* ===============================
   TEAHUG MAIN JAVASCRIPT
   TikTok-style audio feed + email message
   =============================== */

/* ==== FIREBASE SETUP ==== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
   POPUPS BEHAVIOR
   =============================== */
window.addEventListener("DOMContentLoaded", () => {
  introPopup.classList.add("visible");
  setTimeout(() => introPopup.classList.remove("visible"), 5000);
});

aboutBtn.addEventListener("click", () => {
  aboutPopup.classList.add("visible");
});

window.closeAbout = function () {
  aboutPopup.classList.remove("visible");
};

window.closeMessageForm = function () {
  messagePopup.classList.remove("visible");
};

function openMessageForm(song) {
  songTitleEl.textContent = song.title;
  messagePopup.classList.add("visible");
  sendMsgBtn.onclick = () => sendEmail(song);
}

/* ===============================
   LOAD SONGS FROM FIRESTORE
   =============================== */
async function loadSongs() {
  const snapshot = await getDocs(collection(db, "songs"));
  allSongs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  shuffleSongs();
  buildFeed();
  playSong(0);
}

function shuffleSongs() {
  for (let i = allSongs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allSongs[i], allSongs[j]] = [allSongs[j], allSongs[i]];
  }
}

/* ===============================
   BUILD SONG FEED
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

    // Send button
    card.querySelector(".sendBtn").onclick = () => openMessageForm(song);

    // Tap to play/pause
    const overlay = card.querySelector(".play-overlay");
    card.addEventListener("click", () => {
      if (audio.paused) {
        audio.play();
        overlay.style.display = "none";
      } else {
        audio.pause();
        overlay.style.display = "block";
      }
    });

    songFeed.appendChild(card);
  });

  enableSwipe();
}

/* ===============================
   SWIPE NAVIGATION
   =============================== */
function enableSwipe() {
  let startY = 0, endY = 0;

  songFeed.addEventListener("touchstart", e => {
    startY = e.touches[0].clientY;
  });

  songFeed.addEventListener("touchend", e => {
    endY = e.changedTouches[0].clientY;
    if (startY - endY > 80) nextSong();
    if (endY - startY > 80) prevSong();
  });
}

function nextSong() {
  stopAll();
  currentIndex = (currentIndex + 1) % songElements.length;
  scrollToSong(currentIndex);
  playSong(currentIndex);
}

function prevSong() {
  stopAll();
  currentIndex = (currentIndex - 1 + songElements.length) % songElements.length;
  scrollToSong(currentIndex);
  playSong(currentIndex);
}

function scrollToSong(i) {
  songElements[i].scrollIntoView({ behavior: "smooth" });
}

function playSong(i) {
  stopAll();
  audioPlayers[i].play();
}

function stopAll() {
  audioPlayers.forEach(a => {
    a.pause();
    a.currentTime = 0;
  });
}

/* ===============================
   SEND MESSAGE VIA WORKER
   =============================== */
async function sendEmail(song) {
  const message = userMsgInput.value.trim();
  if (!message) return alert("Please type a message.");

  const now = new Date();
  const hour = now.getHours();

  // Block during Hug Hour (9PM–12AM)
  if (hour >= 21 || hour < 0) {
    return alert("Messages cannot be sent during Hug Hour (9PM–12AM).");
  }

  const payload = { title: song.title, message };
  const res = await fetch("https://teahug.workers.dev/send", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    alert("Message sent ❤️");
    messagePopup.classList.remove("visible");
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
  const currentHour = now.getHours();
  let target = new Date();
  target.setHours(21, 0, 0, 0);

  if (currentHour >= 21) {
    countdownEl.textContent = "Hug Hour Active ❤️";
    return;
  }

  let diff = target - now;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  countdownEl.textContent = `${h}h ${m}m to Hug Hour`;
}

/* ===============================
   INIT
   =============================== */
loadSongs();
setInterval(updateCountdown, 1000);
