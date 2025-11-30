/* ===============================
   TEAHUG MAIN JAVASCRIPT
   TikTok-style audio feed + email message
   =============================== */

/* ==== FIREBASE SETUP ==== */
// Make sure you included Firebase scripts in HTML:
// <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"></script>
// <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"></script>

const firebaseConfig = {
  apiKey: "AIzaSyAeOEO_5kOqqQU845sSKOsaeJzFmk-MauY",
  authDomain: "joinhugparty.firebaseapp.com",
  projectId: "joinhugparty",
  storageBucket: "joinhugparty.firebasestorage.app",
  messagingSenderId: "540501854830",
  appId: "1:540501854830:web:7249bb97b50582fe97747f"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

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
  const snapshot = await db.collection("songs").get();
  snapshot.forEach(doc => {
    allSongs.push({ id: doc.id, ...doc.data() });
  });
  shuffleSongs();
  buildFeed();
  playSong(0);
}

/* ==== RANDOM SHUFFLE ==== */
function shuffleSongs() {
  for (let i = allSongs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
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

  allSongs.forEach(song => {
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

    // Send button click
    card.querySelector(".sendBtn").addEventListener("click", e => {
      e.stopPropagation(); // Prevent pausing
      openMessageForm(song);
    });

    // Tap to play/pause
    card.addEventListener("click", () => {
      if (audio.paused) {
        stopAll();
        audio.play();
        card.querySelector(".play-overlay").style.display = "none";
      } else {
        audio.pause();
        card.querySelector(".play-overlay").style.display = "block";
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
  let startY = 0;
  let endY = 0;

  songFeed.addEventListener("touchstart", e => startY = e.touches[0].clientY);
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
  audioPlayers.forEach(a => { a.pause(); a.currentTime = 0; });
}

/* ===============================
   MESSAGE FORM
   =============================== */
function openMessageForm(song) {
  songTitleEl.textContent = song.title;
  messagePopup.classList.remove("hidden");
  sendMsgBtn.onclick = () => sendEmail(song);
}

async function sendEmail(song) {
  const message = userMsgInput.value.trim();
  if (!message) return alert("Please type a message.");

  const payload = { title: song.title, message };
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

/* ===============================
   HUG HOUR COUNTDOWN
   =============================== */
function updateCountdown() {
  const now = new Date();
  let target = new Date();
  target.setHours(21, 0, 0, 0);

  if (now >= target) {
    countdownEl.textContent = "Hug Hour Active ❤️";
    return;
  }

  const diff = target - now;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  countdownEl.textContent = `${h}h ${m}m to Hug Hour`;
}

setInterval(updateCountdown, 1000);

/* ===============================
   START EVERYTHING
   =============================== */
loadSongs();
updateCountdown();
