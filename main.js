/* ===============================
   TEAHUG COMPLETE JAVASCRIPT
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
const messagePopup = document.getElementById("messagePopup");
const countdownSection = document.getElementById("countdown-section");
const countdownBig = document.getElementById("countdownBig");
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

  // Wait a moment for DOM
  await new Promise(resolve => setTimeout(resolve, 300));

  // Check for song URL parameter
  const params = new URLSearchParams(window.location.search);
  const songId = params.get("song");

  if (songId) {
    const index = allSongs.findIndex(s => s.id === songId);
    if (index !== -1) {
      const card = songElements[index + 1]; // +1 for cloned first card
      if (card) {
        card.scrollIntoView({ behavior: "auto" });
        playSong(index + 1);
      }
    }
  } else {
    playSong(0);
  }
}

/* ===============================
   BUILD SONG FEED
   =============================== */
function buildFeed() {
  songFeed.innerHTML = "";
  songElements = [];
  audioPlayers = [];

  // Clone last and first for seamless scroll
  const loopSongs = [allSongs[allSongs.length - 1], ...allSongs, allSongs[0]];

  loopSongs.forEach((song, index) => {
    const card = document.createElement("div");
    card.classList.add("song-card");

    card.innerHTML = `
      <img src="${song.coverURL}" class="song-img">
      <div class="play-overlay">▶</div>
      <button class="sendBtn">Send</button>
    `;

    const audio = new Audio(song.songURL);
    audio.loop = true;

    audioPlayers.push(audio);
    songElements.push(card);

    // Send button
    card.querySelector(".sendBtn").onclick = (e) => {
      e.stopPropagation();
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

  // Scroll to first real song
  songFeed.scrollTop = window.innerHeight;

  enableInfiniteScroll();
}

function enableInfiniteScroll() {
  songFeed.addEventListener("scroll", () => {
    const scrollIndex = Math.round(songFeed.scrollTop / window.innerHeight);

    if (scrollIndex === 0) {
      songFeed.scrollTop = allSongs.length * window.innerHeight;
      currentIndex = allSongs.length - 1;
    } else if (scrollIndex === songElements.length - 1) {
      songFeed.scrollTop = window.innerHeight;
      currentIndex = 0;
    } else {
      currentIndex = scrollIndex - 1;
    }

    stopAll();
    audioPlayers[scrollIndex]?.play();
  });
}

function stopAll() {
  audioPlayers.forEach(a => {
    a.pause();
    a.currentTime = 0;
  });
}

function playSong(index) {
  stopAll();
  audioPlayers[index + 1]?.play(); // +1 for cloned first card
}

/* ===============================
   MESSAGE POPUP
   =============================== */
function openMessageForm(song) {
  songTitleEl.textContent = song.title;
  messagePopup.classList.remove("hidden");

  sendMsgBtn.onclick = () => sendViaWhatsApp(song);
}

function sendViaWhatsApp(song) {
  const message = userMsgInput.value.trim();
  if (!message) return alert("Please type a message.");

  const fullMessage = `🎵 ${song.title}\n\n${message}\n\nSong link: ${window.location.origin}/?song=${song.id}`;

  navigator.clipboard.writeText(fullMessage)
    .then(() => {
      window.open("https://wa.me/message/WU7FM2NLOXI6P1", "_blank");
      alert("Message copied! Paste it in WhatsApp to send.");
      messagePopup.classList.add("hidden");
      userMsgInput.value = "";
    })
    .catch(err => {
      alert("Failed to copy message. Please try again.");
      console.error(err);
    });
}

/* ===============================
   HUG HOUR COUNTDOWN
   =============================== */
function updateHugHourCountdown() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const second = now.getSeconds();

  const hugStart = new Date();
  hugStart.setHours(19, 0, 0, 0);
  const hugEnd = new Date();
  hugEnd.setHours(22, 0, 0, 0);

  // During Hug Hours → hide countdown, show feed
  if (now >= hugStart && now < hugEnd) {
    countdownSection.style.display = "none";
    songFeed.style.display = "block";
    return;
  }

  // Outside Hug Hours → show countdown, hide feed
  countdownSection.style.display = "flex";
  songFeed.style.display = "none";

  if (now > hugStart) hugStart.setDate(hugStart.getDate() + 1);

  const diff = hugStart - now;
  const h = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
  const m = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, "0");
  const s = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, "0");

  countdownBig.textContent = `${h} : ${m} : ${s}`;
}

setInterval(updateHugHourCountdown, 1000);
updateHugHourCountdown();

/* ===============================
   START EVERYTHING
   =============================== */
loadSongs();
