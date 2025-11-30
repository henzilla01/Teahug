import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ===== Firebase Config ===== */
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

/* ===== DOM Elements ===== */
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

/* ===== Intro Popup (5 sec) ===== */
setTimeout(() => introPopup.classList.add("hidden"), 5000);

/* ===== About Popup ===== */
aboutBtn.addEventListener("click", () => aboutPopup.classList.remove("hidden"));
window.closeAbout = () => aboutPopup.classList.add("hidden");

/* ===== Message Popup ===== */
window.closeMessageForm = () => messagePopup.classList.add("hidden");

/* ===== Load Songs ===== */
async function loadSongs() {
  const snapshot = await getDocs(collection(db, "songs"));
  snapshot.forEach(doc => {
    allSongs.push({ id: doc.id, ...doc.data() });
  });

  shuffleSongs();
  buildFeed();
  playSong(0);
}

function shuffleSongs() {
  for (let i = allSongs.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [allSongs[i], allSongs[j]] = [allSongs[j], allSongs[i]];
  }
}

/* ===== Build TikTok Feed ===== */
function buildFeed() {
  songFeed.innerHTML = "";
  songElements = [];
  audioPlayers = [];

  allSongs.forEach((song, index) => {
    const card = document.createElement("div");
    card.classList.add("song-card");
    card.style.backgroundImage = `url(${song.coverURL})`;

    card.innerHTML = `
      <div class="play-overlay">▶</div>
      <button class="sendBtn">Send</button>
    `;

    const audio = new Audio(song.songURL);
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

/* ===== Swipe Navigation ===== */
function enableSwipe() {
  let startY = 0;
  songFeed.addEventListener("touchstart", e => startY = e.touches[0].clientY);
  songFeed.addEventListener("touchend", e => {
    const endY = e.changedTouches[0].clientY;
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

function scrollToSong(i) { songElements[i].scrollIntoView({ behavior: "smooth" }); }
function playSong(i) { stopAll(); audioPlayers[i].play(); }
function stopAll() { audioPlayers.forEach(a => { a.pause(); a.currentTime = 0; }); }

/* ===== Open Message Form ===== */
function openMessageForm(song) {
  songTitleEl.textContent = song.title;
  messagePopup.classList.remove("hidden");

  sendMsgBtn.onclick = async () => {
    const message = userMsgInput.value.trim();
    if (!message) return alert("Please type a message.");
    try {
      await fetch("https://teahug.workers.dev/send", {
        method: "POST",
        body: JSON.stringify({ title: song.title, message })
      });
      alert("Message sent ❤️");
      messagePopup.classList.add("hidden");
      userMsgInput.value = "";
    } catch {
      alert("Failed to send message.");
    }
  };
}

/* ===== Hug Hour Countdown ===== */
function updateCountdown() {
  const now = new Date();
  const hour = now.getHours();
  if (hour >= 21) { countdownEl.textContent = "Hug Hour Active ❤️"; return; }

  const target = new Date();
  target.setHours(21, 0, 0, 0);
  const diff = target - now;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);

  countdownEl.textContent = `${h}h ${m}m to Hug Hour`;
}

setInterval(updateCountdown, 1000);

/* ===== Start App ===== */
loadSongs();
updateCountdown();
