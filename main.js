/* ===============================
   TEAHUG MAIN JAVASCRIPT
   =============================== */
// Get song ID from URL, e.g. https://teahug1.pages.dev/song/Xne9e9hinBRachvvvjAn
const pathParts = window.location.pathname.split("/");
const songIdFromURL = pathParts[1] === "song" ? pathParts[2] : null;

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

  // Clone first and last songs for seamless infinite scroll
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

  // Scroll to the "real" first song (index 1 because 0 is cloned last song)
  songFeed.scrollTop = window.innerHeight;

  enableInfiniteScroll();
}

function enableInfiniteScroll() {
  songFeed.addEventListener("scroll", () => {
    const scrollIndex = Math.round(songFeed.scrollTop / window.innerHeight);

    // Jump to correct position for infinite effect
    if (scrollIndex === 0) {
      // User scrolled to cloned last song
      songFeed.scrollTop = allSongs.length * window.innerHeight;
      currentIndex = allSongs.length - 1;
    } else if (scrollIndex === songElements.length - 1) {
      // User scrolled to cloned first song
      songFeed.scrollTop = window.innerHeight;
      currentIndex = 0;
    } else {
      currentIndex = scrollIndex - 1; // Adjust for cloned card
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

function sendViaWhatsApp(song) {
  const message = userMsgInput.value.trim();
  if (!message) return alert("Please type a message.");

  const fullMessage = `🎵 ${song.title}\n\n${message}\n\nSong link: https://teahug1.pages.dev/song/${song.id}`;
  // Copy to clipboard
  navigator.clipboard.writeText(fullMessage)
    .then(() => {
      // Open WhatsApp link in a new tab
      window.open("https://wa.me/message/WU7FM2NLOXI6P1", "_blank");
      
      // Notify user
      alert("Message copied! Paste it in WhatsApp to send.");
      
      // Close popup and reset input
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














