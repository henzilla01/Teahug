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

/* ===== DOM ===== */
const songFeed = document.getElementById("songFeed");
const messagePopup = document.getElementById("messagePopup");
const songTitleEl = document.getElementById("songTitle");
const userMsgInput = document.getElementById("userMessage");
const sendMsgBtn = document.getElementById("sendMsgBtn");
const aboutPopup = document.getElementById("aboutPopup");
const aboutBtn = document.getElementById("aboutBtn");

let allSongs = [];
let currentIndex = 0;
let audioPlayers = [];

/* ===== LOAD SONGS ===== */
async function loadSongs() {
  const snapshot = await getDocs(collection(db, "songs"));
  snapshot.forEach(doc => allSongs.push({ id: doc.id, ...doc.data() }));
  buildFeed();
}
loadSongs();

/* ===== BUILD TIKTOK FEED ===== */
function buildFeed() {
  songFeed.innerHTML = "";
  audioPlayers = [];

  allSongs.forEach((song, index) => {
    const card = document.createElement("div");
    card.classList.add("song-card");

    card.innerHTML = `
      <img src="${song.coverURL}" class="song-img">
      <div class="overlay">
        <h3>${song.title}</h3>
        <p>${song.artist}</p>
        <button class="sendBtn">Send ❤️</button>
      </div>
    `;

    const audio = new Audio(song.songURL);
    audio.loop = true;
    audioPlayers.push(audio);

    card.querySelector(".sendBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      openMessageForm(song);
    });

    card.addEventListener("click", () => togglePlay(index));

    songFeed.appendChild(card);
  });

  enableFullPageScroll();
}

/* ===== PLAY/PAUSE AUDIO ===== */
function togglePlay(index) {
  audioPlayers.forEach((a, i) => {
    if (i === index) {
      a.paused ? a.play() : a.pause();
    } else {
      a.pause();
      a.currentTime = 0;
    }
  });
}

/* ===== FULL-PAGE VERTICAL SCROLL ===== */
function enableFullPageScroll() {
  let startY = 0;
  songFeed.addEventListener("touchstart", e => startY = e.touches[0].clientY);
  songFeed.addEventListener("touchend", e => {
    const endY = e.changedTouches[0].clientY;
    if (startY - endY > 50) scrollNext();
    if (endY - startY > 50) scrollPrev();
  });
}

function scrollNext() {
  if (currentIndex < allSongs.length - 1) currentIndex++;
  scrollToSong(currentIndex);
}

function scrollPrev() {
  if (currentIndex > 0) currentIndex--;
  scrollToSong(currentIndex);
}

function scrollToSong(index) {
  const cards = document.querySelectorAll(".song-card");
  cards[index].scrollIntoView({ behavior: "smooth" });
  audioPlayers.forEach((a, i) => { if (i !== index) { a.pause(); a.currentTime = 0; } });
}

/* ===== MESSAGE POPUP ===== */
function openMessageForm(song) {
  songTitleEl.textContent = song.title;
  messagePopup.classList.remove("hidden");

  sendMsgBtn.onclick = async () => {
    const message = userMsgInput.value.trim();
    if (!message) return alert("Type a message first!");

    try {
      await fetch("https://teahug.workers.dev/send", {
        method: "POST",
        body: JSON.stringify({ title: song.title, message }),
      });
      alert("Hug sent! ❤️");
      userMsgInput.value = "";
      messagePopup.classList.add("hidden");
    } catch {
      alert("Failed to send message.");
    }
  };
}

window.closeMessageForm = () => messagePopup.classList.add("hidden");

/* ===== ABOUT POPUP ===== */
aboutBtn.addEventListener("click", () => aboutPopup.classList.remove("hidden"));
window.closeAbout = () => aboutPopup.classList.add("hidden");
