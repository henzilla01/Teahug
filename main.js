import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// Intro popup auto-hide (5 sec)
setTimeout(() => introPopup.classList.add("hidden"), 5000);

// Show About popup only when About button is clicked
aboutBtn.addEventListener("click", () => {
  aboutPopup.classList.remove("hidden");
});

// Function to close About popup
window.closeAbout = () => aboutPopup.classList.add("hidden");
// Message popup
window.closeMessageForm = () => messagePopup.classList.add("hidden");

// Load songs
async function loadSongs() {
  const snapshot = await getDocs(collection(db, "songs"));
  snapshot.forEach(doc => allSongs.push({ id: doc.id, ...doc.data() }));

  shuffleSongs();
  buildFeed();
  playSong(0);
}

// Shuffle
function shuffleSongs() {
  for (let i = allSongs.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [allSongs[i], allSongs[j]] = [allSongs[j], allSongs[i]];
  }
}

// Build feed
function buildFeed() {
  songFeed.innerHTML = "";
  songElements = [];
  audioPlayers = [];

  allSongs.forEach((song, index) => {
    const card = document.createElement("div");
    card.classList.add("song-card");
    card.style.backgroundImage = `url(${song.coverURL})`;

    const audio = new Audio(song.songURL);
    audio.loop = true;

    audioPlayers.push(audio);
    songElements.push(card);

    const playOverlay = document.createElement("div");
    playOverlay.classList.add("play-overlay");
    playOverlay.textContent = "▶";
    card.appendChild(playOverlay);

    const sendBtn = document.createElement("button");
    sendBtn.classList.add("sendBtn");
    sendBtn.textContent = "Send";
    sendBtn.onclick = () => openMessageForm(song);
    card.appendChild(sendBtn);

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

// Swipe navigation
function enableSwipe() {
  let startY = 0, endY = 0;
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

function scrollToSong(i) { songElements[i].scrollIntoView({ behavior: "smooth" }); }
function playSong(i) { stopAll(); audioPlayers[i].play(); }
function stopAll() { audioPlayers.forEach(a => { a.pause(); a.currentTime = 0; }); }

// Message form
function openMessageForm(song) {
  songTitleEl.textContent = song.title;
  messagePopup.classList.remove("hidden");
  sendMsgBtn.onclick = () => sendEmail(song);
}

// Dummy sendEmail function (replace with actual endpoint)
async function sendEmail(song) {
  const message = userMsgInput.value.trim();
  if (!message) return alert("Please type a message.");

  const res = await fetch("/send", { method: "POST", body: JSON.stringify({ title: song.title, message }) });
  if (res.ok) {
    alert("Message sent ❤️");
    messagePopup.classList.add("hidden");
    userMsgInput.value = "";
  } else alert("Failed to send message.");
}

// Hug hour countdown
function updateCountdown() {
  const now = new Date();
  const hour = now.getHours();
  if (hour >= 21) { countdownEl.textContent = "Hug Hour Active ❤️"; return; }

  const target = new Date(); target.setHours(21,0,0,0);
  const diff = target - now;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000)/60000);
  countdownEl.textContent = `${h}h ${m}m to Hug Hour`;
}

setInterval(updateCountdown, 1000);

// Start everything
loadSongs();
updateCountdown();

