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

  // Wait until the cards are in DOM
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
   BUILD FEED
   =============================== */
function buildFeed() {
  songFeed.innerHTML = "";
  songElements = [];
  audioPlayers = [];

  // Clone last and first for seamless infinite scroll
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
      e.stopPropagation(); // Prevent pausing song
      openMessageForm(song);
    };

    // Tap to play/pause
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

  // Scroll to first real song
  songFeed.scrollTop = window.innerHeight;

  enableInfiniteScroll();
}

function enableInfiniteScroll() {
  songFeed.addEventListener("scroll", () => {
    const scrollIndex = Math.round(songFeed.scrollTop / window.innerHeight);

    // Infinite loop adjustment
    if (scrollIndex === 0) {
      songFeed.scrollTop = allSongs.length * window.innerHeight;
      currentIndex = allSongs.length - 1;
    } else if (scrollIndex === songElements.length - 1) {
      songFeed.scrollTop = window.innerHeight;
      currentIndex = 0;
    } else {
      currentIndex = scrollIndex - 1;
    }

    // Play the correct audio
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

/* ===============================
   OPEN MESSAGE FORM
   =============================== */
function openMessageForm(song) {
  songTitleEl.textContent = song.title;
  messagePopup.classList.remove("hidden");

  sendMsgBtn.onclick = () => sendViaWhatsApp(song);
}

/* ===============================
   SEND MESSAGE VIA WHATSAPP
   =============================== */
function sendViaWhatsApp(song) {
  const message = userMsgInput.value.trim();
  if (!message) return alert("Please type a message.");

  const fullMessage = `🎵 ${song.title}\n\n${message}\n\nSong link: ${window.location.origin}/?song=${song.id}`;

  // Copy to clipboard
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
function updateCountdown() {
  const now = new Date();
  const hour = now.getHours();

  const wrapper = document.getElementById("countdownWrapper");

  // Between 7 PM (19) and 10 PM (22) → hide countdown
  if (hour >= 19 && hour < 22) {
    wrapper.style.display = "none";
    return;
  }

  // Otherwise → show it
  wrapper.style.display = "block";

  let target = new Date();
  target.setHours(19, 0, 0, 0); // 7 PM start time

  // If it's already past 10 PM, countdown to next day's 7 PM
  if (hour >= 22) {
    target.setDate(target.getDate() + 1);
  }

  let diff = target - now;

  let h = String(Math.floor(diff / 3600000)).padStart(2, "0");
  let m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
  let s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");

  document.getElementById("countdownBig").textContent = `${h} : ${m} : ${s}`;
}

// Update every second
setInterval(updateCountdown, 1000);
/* ===============================
   START EVERYTHING
   =============================== */
loadSongs();
updateCountdown();

// ===============================
// HUG HOUR COUNTDOWN CONTROLLER
// ===============================
function updateHugHourCountdown() {
    const now = new Date();

    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentSeconds = now.getSeconds();

    const countdownContainer = document.getElementById("countdown-section");
    const countdownText = document.getElementById("countdown");

    // HUG HOURS are 19:00 → 22:00 (7pm–10pm)
    const hugStart = new Date();
    hugStart.setHours(19, 0, 0); // 7:00 PM

    const hugEnd = new Date();
    hugEnd.setHours(22, 0, 0); // 10:00 PM

    // If it's currently between 7pm and 10pm → hide the countdown
    if (now >= hugStart && now < hugEnd) {
        if (countdownContainer) countdownContainer.style.display = "none";
        return;
    }

    // Outside Hug Hours → SHOW countdown full-screen
    if (countdownContainer) countdownContainer.style.display = "flex";

    // Determine the next day's 7pm if time has passed already
    if (now > hugStart) {
        hugStart.setDate(hugStart.getDate() + 1);
    }

    const diff = hugStart - now;

    const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
    const minutes = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, "0");
    const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, "0");

    countdownText.textContent = `${hours} : ${minutes} : ${seconds}`;
}

// Update every second
setInterval(updateHugHourCountdown, 1000);

// Run immediately on page load
updateHugHourCountdown();


