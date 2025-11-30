import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Firebase config
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
const countdownEl = document.getElementById("countdown");
const messagePopup = document.getElementById("messagePopup");
const songTitleEl = document.getElementById("songTitle");
const userMsgInput = document.getElementById("userMessage");
const sendMsgBtn = document.getElementById("sendMsgBtn");

let songs = [];
let currentIndex = 0;
let audioPlayers = [];

// Load songs from Firestore
async function loadSongs() {
  const snapshot = await getDocs(collection(db, "songs"));
  songs = snapshot.docs.map(doc => doc.data());

  if (songs.length === 0) return;

  buildFeed();
  playSong(0);
}

// Build TikTok-style feed
function buildFeed() {
  songFeed.innerHTML = "";
  audioPlayers = [];

  songs.forEach((song, index) => {
    const card = document.createElement("div");
    card.className = "song-card";

    card.innerHTML = `
      <img class="song-img" src="${song.coverURL}">
      <div class="play-overlay">▶</div>
      <button class="sendBtn">Send</button>
    `;

    const audio = new Audio(song.songURL);
    audio.loop = true;
    audioPlayers.push(audio);

    // Play/Pause on tap
    card.addEventListener("click", e => {
      if (e.target.classList.contains("sendBtn")) return;
      if (audio.paused) { audio.play(); } else { audio.pause(); }
    });

    // Send button
    card.querySelector(".sendBtn").onclick = e => {
      e.stopPropagation();
      openMessageForm(song);
    };

    songFeed.appendChild(card);
  });

  enableSwipe();
}

// Swipe navigation
function enableSwipe() {
  let startY = 0;
  songFeed.addEventListener("touchstart", e => startY = e.touches[0].clientY);
  songFeed.addEventListener("touchend", e => {
    let endY = e.changedTouches[0].clientY;
    if (startY - endY > 50) nextSong();
    if (endY - startY > 50) prevSong();
  });
}

function playSong(i) {
  stopAll();
  audioPlayers[i].play();
}

function stopAll() {
  audioPlayers.forEach(a => { a.pause(); a.currentTime = 0; });
}

function nextSong() {
  currentIndex = (currentIndex + 1) % songs.length;
  scrollToSong(currentIndex);
  playSong(currentIndex);
}

function prevSong() {
  currentIndex = (currentIndex - 1 + songs.length) % songs.length;
  scrollToSong(currentIndex);
  playSong(currentIndex);
}

function scrollToSong(i) {
  songFeed.children[i].scrollIntoView({behavior:"smooth"});
}

// Message popup
function openMessageForm(song) {
  songTitleEl.textContent = song.title;
  messagePopup.classList.remove("hidden");

  sendMsgBtn.onclick = async () => {
    const message = userMsgInput.value.trim();
    if (!message) return alert("Please type a message");

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

window.closeMessageForm = () => messagePopup.classList.add("hidden");

// Countdown
function updateCountdown() {
  const now = new Date();
  let target = new Date();
  target.setHours(21,0,0,0);
  if (now.getHours() >= 21) {
    countdownEl.textContent = "Hug Hour Active ❤️";
    return;
  }
  let diff = target - now;
  let h = Math.floor(diff / 3600000);
  let m = Math.floor((diff % 3600000)/60000);
  countdownEl.textContent = `${h}h ${m}m to Hug Hour`;
}
setInterval(updateCountdown, 1000);

// Initialize
loadSongs();
updateCountdown();
