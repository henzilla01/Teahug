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
const aboutBtn = document.getElementById("aboutBtn");
const messagePopup = document.getElementById("messagePopup");
const songTitleEl = document.getElementById("songTitle");
const userMsgInput = document.getElementById("userMessage");
const sendMsgBtn = document.getElementById("sendMsgBtn");

let allSongs = [];
let currentIndex = 0;
let songElements = [];
let audioPlayers = [];

// Intro popup auto-hide (5s)
setTimeout(() => introPopup.classList.add("hidden"), 5000);

// About popup
aboutBtn.addEventListener("click", () => aboutPopup.classList.toggle("hidden"));

// Load songs
async function loadSongs() {
  const snapshot = await getDocs(collection(db, "songs"));
  allSongs = snapshot.docs.map(doc => doc.data());
  buildFeed();
  playSong(0);
}

// Build feed
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

    // Play/pause overlay
    const overlay = card.querySelector(".play-overlay");
    card.addEventListener("click", () => {
      if (audio.paused) {
        audio.play();
        overlay.style.opacity = 0;
      } else {
        audio.pause();
        overlay.style.opacity = 1;
      }
    });

    // Send button
    card.querySelector(".sendBtn").addEventListener("click", () => openMessageForm(song));

    songFeed.appendChild(card);
  });

  enableSwipe();
}

// Swipe navigation
let startY = 0;
function enableSwipe() {
  songFeed.addEventListener("touchstart", e => startY = e.touches[0].clientY);
  songFeed.addEventListener("touchend", e => {
    const endY = e.changedTouches[0].clientY;
    if (startY - endY > 50) nextSong();
    if (endY - startY > 50) prevSong();
  });
}

function stopAll() {
  audioPlayers.forEach(a => { a.pause(); a.currentTime = 0; });
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

    // Call your worker endpoint here
    await fetch("https://teahug.workers.dev/send", {
      method: "POST",
      body: JSON.stringify({ title: song.title, message: msg })
    });

    messagePopup.classList.add("hidden");
    userMsgInput.value = "";
  };
}

window.closeMessageForm = () => messagePopup.classList.add("hidden");

// Start
loadSongs();
