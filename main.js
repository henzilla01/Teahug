import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

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

// DOM Elements
const songFeed = document.getElementById("songFeed");
const introPopup = document.getElementById("introPopup");
const aboutPopup = document.getElementById("aboutPopup");
const messagePopup = document.getElementById("messagePopup");
const songTitleEl = document.getElementById("songTitle");
const userMsgInput = document.getElementById("userMessage");
const sendMsgBtn = document.getElementById("sendMsgBtn");

let allSongs = [];
let currentIndex = 0;
let songElements = [];
let audioPlayers = [];

// Intro popup auto-hide
setTimeout(() => introPopup.classList.add("hidden"), 5000);

// Load songs from Firestore
async function loadSongs() {
  const querySnapshot = await getDocs(collection(db, "songs"));
  allSongs = [];

  querySnapshot.forEach(doc => {
    allSongs.push(doc.data());
  });

  buildFeed();
  playSong(0);
}

// Build TikTok-style feed
function buildFeed() {
  songFeed.innerHTML = "";
  songElements = [];
  audioPlayers = [];

  allSongs.forEach((song, index) => {
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

    // Play/pause toggle
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

    // Send button
    const sendBtn = card.querySelector(".sendBtn");
    sendBtn.addEventListener("click", () => openMessageForm(song));

    songFeed.appendChild(card);
  });

  enableSwipe();
}

// Swipe navigation
let startY = 0;
let endY = 0;

function enableSwipe() {
  songFeed.addEventListener("touchstart", e => startY = e.touches[0].clientY);
  songFeed.addEventListener("touchend", e => {
    endY = e.changedTouches[0].clientY;
    if (startY - endY > 50) nextSong();
    if (endY - startY > 50) prevSong();
  });
}

function stopAll() {
  audioPlayers.forEach(a => {
    a.pause();
    a.currentTime = 0;
  });
}

function playSong(i) {
  stopAll();
  audioPlayers[i].play();
}

function scrollToSong(i) {
  songElements[i].scrollIntoView({ behavior: "smooth" });
}

function nextSong() {
  currentIndex = (currentIndex + 1) % songElements.length;
  scrollToSong(currentIndex);
  playSong(currentIndex);
}

function prevSong() {
  currentIndex = (currentIndex - 1 + songElements.length) % songElements.length;
  scrollToSong(currentIndex);
  playSong(currentIndex);
}

// Message popup
function openMessageForm(song) {
  songTitleEl.textContent = song.title;
  messagePopup.classList.remove("hidden");

  sendMsgBtn.onclick = async () => {
    const msg = userMsgInput.value.trim();
    if (!msg) return alert("Please type a message");

    // Call worker endpoint here
    await fetch("https://teahug.workers.dev/send", {
      method: "POST",
      body: JSON.stringify({ title: song.title, message: msg })
    });

    messagePopup.classList.add("hidden");
    userMsgInput.value = "";
  };
}

window.closeMessageForm = function () {
  messagePopup.classList.add("hidden");
};

// Start
loadSongs();
