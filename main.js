import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ===== FIREBASE CONFIG ===== */
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

/* ===== DOM ELEMENTS ===== */
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

/* ===== POPUPS ===== */
setTimeout(() => introPopup.classList.add("hidden"), 5000); // Intro popup 5s

aboutBtn.addEventListener("click", () => {
  aboutPopup.classList.remove("hidden");
});

window.closeAbout = () => aboutPopup.classList.add("hidden");
window.closeMessageForm = () => messagePopup.classList.add("hidden");

/* ===== LOAD SONGS ===== */
async function loadSongs() {
  const snapshot = await getDocs(collection(db, "songs"));
  snapshot.forEach(doc => allSongs.push({ id: doc.id, ...doc.data() }));
  shuffleSongs();
  buildFeed();
  playSong(0);
}

/* ===== SHUFFLE ===== */
function shuffleSongs() {
  for (let i = allSongs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allSongs[i], allSongs[j]] = [allSongs[j], allSongs[i]];
  }
}

/* ===== BUILD FEED ===== */
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

    card.querySelector(".sendBtn").onclick = () => openMessageForm(song);

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

function enableSwipe() {
  let startY = 0;
  let endY = 0;

  songFeed.addEventListener("touchstart", (e) => {
    startY = e.touches[0].clientY;
  });

  songFeed.addEventListener("touchend", (e) => {
    endY = e.changedTouches[0].clientY;

    const threshold = 50; // minimal swipe distance

    if (startY - endY > threshold) swipeNext();
    if (endY - startY > threshold) swipePrev();
  });
}

function swipeNext() {
  stopAll();
  currentIndex = (currentIndex + 1) % songElements.length; // loops to first
  scrollToSong(currentIndex);
  playSong(currentIndex);
}

function swipePrev() {
  stopAll();
  currentIndex = (currentIndex - 1 + songElements.length) % songElements.length; // loops to last
  scrollToSong(currentIndex);
  playSong(currentIndex);
}

function scrollToSong(i) {
  songElements[i].scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}
/* ===== SONG NAV ===== */
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

/* ===== MESSAGE POPUP ===== */
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

/* ===== HUG HOUR COUNTDOWN ===== */
function updateCountdown() {
  const now = new Date();
  const hour = now.getHours();
  let target = new Date();
  target.setHours(21, 0, 0, 0);

  if (hour >= 21) {
    countdownEl.textContent = "Hug Hour Active ❤️";
    return;
  }

  let diff = target - now;
  let h = Math.floor(diff / 3600000);
  let m = Math.floor((diff % 3600000) / 60000);
  countdownEl.textContent = `${h}h ${m}m to Hug Hour`;
}

setInterval(updateCountdown, 1000);

/* ===== START ===== */
loadSongs();
updateCountdown();

