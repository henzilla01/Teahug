// main.js
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

// DOM Elements
const songFeed = document.getElementById("songFeed");
const introPopup = document.getElementById("introPopup");
const messagePopup = document.getElementById("messagePopup");
const songTitleEl = document.getElementById("songTitle");
const recipientNameInput = document.getElementById("recipientName");
const recipientNumberInput = document.getElementById("recipientNumber");
const sendMsgBtn = document.getElementById("sendMsgBtn");
const hugEmojis = document.querySelectorAll(".hug-emoji");
const preHugSection = document.getElementById("preHugSection");
const preHugCountdown = document.getElementById("preHugCountdown");
const hugHourTopCountdown = document.getElementById("hugHourTopCountdown");
const hugHourTimer = document.getElementById("hugHourTimer");

let allSongs = [];
let audioPlayers = [];
let selectedEmoji = "";

// -----------------
// Popups
function showIntroPopup() {
  introPopup.classList.remove("hidden");
  setTimeout(() => introPopup.classList.add("hidden"), 10000);
}
window.closeMessageForm = () => messagePopup.classList.add("hidden");

// -----------------
// Load Songs
async function loadSongs() {
  try {
    const snapshot = await getDocs(collection(db, "songs"));
    allSongs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    buildFeed();
  } catch (err) {
    console.error(err);
    songFeed.innerHTML = `<p style="color:red; text-align:center;">Failed to load songs</p>`;
  }
}

// -----------------
// Build Feed
function buildFeed() {
  songFeed.innerHTML = "";
  audioPlayers = [];

  if (!allSongs.length) {
    songFeed.innerHTML = "<p>No songs available. Upload some via admin page.</p>";
    return;
  }

  // Add extra first and last for infinite scroll illusion
  const loopSongs = [allSongs[allSongs.length -1], ...allSongs, allSongs[0]];

  loopSongs.forEach((song, index) => {
    const card = document.createElement("div");
    card.classList.add("song-card");
    card.innerHTML = `
      <img src="${song.coverURL}" class="song-img">
      <div class="play-overlay">▶</div>
      <button class="sendBtn">Select</button>
    `;

    const audio = new Audio(song.songURL);
    audio.loop = true;
    audioPlayers.push(audio);

    // Play overlay click
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

    // Select button → Mood Picker
    card.querySelector(".sendBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      openMoodPicker(song.title);
    });

    songFeed.appendChild(card);
  });

  songFeed.scrollTop = window.innerHeight;
  enableInfiniteScroll();
}

function enableInfiniteScroll() {
  songFeed.addEventListener("scroll", () => {
    const scrollIndex = Math.round(songFeed.scrollTop / window.innerHeight);
    if (scrollIndex === 0) songFeed.scrollTop = allSongs.length * window.innerHeight;
    else if (scrollIndex === audioPlayers.length -1) songFeed.scrollTop = window.innerHeight;
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

// -----------------
// Mood Picker & Message
let selectedMood = "";
let selectedSongTitle = "";

function openMoodPicker(songTitle) {
  selectedSongTitle = songTitle;
  document.getElementById("selectedSongTitle").innerText = songTitle;
  document.getElementById("moodModal").classList.remove("hidden");
}

function selectMood(mood) {
  selectedMood = mood;
  document.getElementById("moodModal").classList.add("hidden");
  document.getElementById("formModal").classList.remove("hidden");
  const title = document.getElementById("formTitle");
  title.innerText = mood === "love" ? "You picked ❤️!\nWHO CAME TO MIND?" : "You picked 🍿!\nWHO CAME TO MIND?";
}

function closeForm() {
  document.getElementById("formModal").classList.add("hidden");
  document.getElementById("userName").value = "";
  document.getElementById("userWhatsapp").value = "";
}

function submitTeahug() {
  const name = document.getElementById("userName").value.trim();
  const phone = document.getElementById("userWhatsapp").value.trim();
  if (!name || !phone) return alert("Please fill all fields");

  const hour = new Date().getHours();
  if (hour >= 21 && hour < 24) {
    alert("Hug Hour is active. Please come back after 12AM 💛");
    return;
  }

  const moodText = selectedMood === "love" ? "❤️ Love" : "🍿 Popcorn";

  const message = `
Teahug Surprise 💛
Song: ${selectedSongTitle}
Mood: ${moodText}
For: ${name}

(Please paste this message if needed)
  `;
  const encoded = encodeURIComponent(message);
  const whatsappNumber = "2348056882601";
  window.location.href = `https://wa.me/${whatsappNumber}?text=${encoded}`;
}

// -----------------
// Start
loadSongs();
