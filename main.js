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
   INTRO POPUP AUTO-HIDE (5 sec)
   =============================== */
setTimeout(() => introPopup.classList.add("hidden"), 5000);

/* ===============================
   ABOUT POPUP
   =============================== */
aboutBtn.addEventListener("click", () => {
  aboutPopup.classList.remove("hidden");
});

window.closeAbout = function () {
  aboutPopup.classList.add("hidden");
};

/* ===============================
   MESSAGE POPUP OPEN/CLOSE
   =============================== */
window.closeMessageForm = function () {
  messagePopup.classList.add("hidden");
};

/* ===============================
   LOAD SONGS FROM FIRESTORE
   =============================== */
async function loadSongs() {
  const ref = collection(db, "songs");
  const snapshot = await getDocs(ref);

  snapshot.forEach(doc => {
    allSongs.push({ id: doc.id, ...doc.data() });
  });

  shuffleSongs();
  buildFeed();
  playSong(0);
}

/* ==== RANDOM SHUFFLE ON EVERY PAGE LOAD ==== */
function shuffleSongs() {
  for (let i = allSongs.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [allSongs[i], allSongs[j]] = [allSongs[j], allSongs[i]];
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
      <img src="${song.cover}" class="song-img">
      <div class="play-overlay">▶</div>
      <button class="sendBtn">Send</button>
    `;

    const audio = new Audio(song.url);
    audio.loop = true;

    audioPlayers.push(audio);
    songElements.push(card);

    /* SEND BUTTON */
    const sendBtn = card.querySelector(".sendBtn");
    sendBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent song pause
      openMessageForm(song);
    });

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

  if (currentIndex >= songElements.length) currentIndex = 0; // loop to first

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
   OPEN MESSAGE FORM
   =============================== */
function openMessageForm(song) {
  songTitleEl.textContent = song.title;
  messagePopup.classList.remove("hidden");

  sendMsgBtn.onclick = () => sendEmail(song);
}

/* ===============================
   SEND EMAIL THROUGH WORKER
   =============================== */
async function sendEmail(song) {
  const message = userMsgInput.value.trim();
  if (!message) return alert("Please type a message.");

  const now = new Date();
  const hour = now.getHours();

  // Block during Hug Hour
  if (hour >= 21 || hour < 0) {
    return alert("Messages cannot be sent during Hug Hour (9PM–12AM).");
  }

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
   HUG HOUR COUNTDOWN (9PM–12AM)
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
