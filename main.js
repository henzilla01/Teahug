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
let songElements = [];
let audioPlayers = [];
let currentIndex = 0;
let selectedEmoji = "";

// -----------------
// Popups
function showIntroPopup() {
  introPopup.classList.remove("hidden");
  setTimeout(() => introPopup.classList.add("hidden"), 10000); // auto close after 10s
}
window.closeMessageForm = () => messagePopup.classList.add("hidden");

// -----------------
// Load Songs
async function loadSongs() {
  const snapshot = await getDocs(collection(db, "songs"));
  allSongs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  buildFeed();
}

// -----------------
// Build Feed
function buildFeed() {
  songFeed.innerHTML = "";
  songElements = [];
  audioPlayers = [];

  const loopSongs = [allSongs[allSongs.length -1], ...allSongs, allSongs[0]];

  loopSongs.forEach((song, index) => {
    const card = document.createElement("div");
    card.classList.add("song-card");
    card.innerHTML = `<img src="${song.coverURL}" class="song-img">
                      <div class="play-overlay">▶</div>
                      <button class="sendBtn">Select</button>`;
    
    const audio = new Audio(song.songURL);
    audio.loop = true;
    audioPlayers.push(audio);
    songElements.push(card);

    // Send button
card.querySelector(".sendBtn").onclick = e => {
  e.stopPropagation();
  openMoodPicker(song.title); // <-- open Mood Picker instead of old form
};

    // Play overlay
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

  songFeed.scrollTop = window.innerHeight;
  enableInfiniteScroll();
}

function enableInfiniteScroll() {
  songFeed.addEventListener("scroll", () => {
    const scrollIndex = Math.round(songFeed.scrollTop / window.innerHeight);
    if (scrollIndex === 0) songFeed.scrollTop = allSongs.length * window.innerHeight;
    else if (scrollIndex === songElements.length -1) songFeed.scrollTop = window.innerHeight;
    stopAll();
    audioPlayers[scrollIndex]?.play();
  });
}

function stopAll() { 
  audioPlayers.forEach(a => { a.pause(); a.currentTime = 0; }); 
}

// -----------------
// Message Form




// -----------------
// Countdown Logic
function updateCountdown() {
  const now = new Date();
  const hour = now.getHours();

  // PRE-HUG: before 7 PM
  if (hour < 19) {
    preHugSection.style.display = "flex";
    hugHourTopCountdown.classList.add("hidden");
    songFeed.style.display = "none";
    introPopup.classList.add("hidden");

    let target = new Date();
    target.setHours(19,0,0,0);
    const diff = target - now;

    const h = String(Math.floor(diff / (1000*60*60))).padStart(2,"0");
    const m = String(Math.floor((diff / (1000*60)) % 60)).padStart(2,"0");
    const s = String(Math.floor((diff / 1000) % 60)).padStart(2,"0");

    preHugCountdown.textContent = `${h} : ${m} : ${s}`;
  }
  // HUG HOUR: 7 PM - 10 PM
  else if (hour >= 19 && hour < 22) {
    preHugSection.style.display = "none";
    hugHourTopCountdown.classList.remove("hidden");
    songFeed.style.display = "block";

    let target = new Date();
    target.setHours(22,0,0,0);
    const diff = target - now;

    const h = String(Math.floor(diff / (1000*60*60))).padStart(2,"0");
    const m = String(Math.floor((diff / (1000*60)) % 60)).padStart(2,"0");
    const s = String(Math.floor((diff / 1000) % 60)).padStart(2,"0");

    hugHourTimer.textContent = `${h} : ${m} : ${s}`;

    // Show intro popup once at start of Hug Hour
    if (h === "03" && m === "00" && s === "00") showIntroPopup();
  }
  // POST-HUG: after 10 PM
  else {
    preHugSection.style.display = "flex";
    hugHourTopCountdown.classList.add("hidden");
    songFeed.style.display = "none";

    let target = new Date();
    target.setDate(target.getDate() +1);
    target.setHours(19,0,0,0);
    const diff = target - now;

    const h = String(Math.floor(diff / (1000*60*60))).padStart(2,"0");
    const m = String(Math.floor((diff / (1000*60)) % 60)).padStart(2,"0");
    const s = String(Math.floor((diff / 1000) % 60)).padStart(2,"0");

    preHugCountdown.textContent = `${h} : ${m} : ${s}`;
  }
}

// -----------------
// Start Everything
loadSongs();
updateCountdown();
setInterval(updateCountdown, 1000);

// ===============================
// TEAHUG MOOD + MESSAGE FLOW
// ===============================

let selectedMood = "";
let selectedSongTitle = "";

// Call this when user taps SELECT on a song
function openMoodPicker(songTitle) {
  selectedSongTitle = songTitle;

  document.getElementById("selectedSongTitle").innerText = songTitle;
  document.getElementById("moodModal").classList.remove("hidden");
}

// When user picks Love or Popcorn
function selectMood(mood) {
  selectedMood = mood;

  document.getElementById("moodModal").classList.add("hidden");
  document.getElementById("formModal").classList.remove("hidden");

  const title = document.getElementById("formTitle");
  title.innerText =
    mood === "love"
      ? "You picked ❤️!\nWHO CAME TO MIND?"
      : "You picked 🍿!\nWHO CAME TO MIND?";
}

// Close form
function closeForm() {
  document.getElementById("formModal").classList.add("hidden");
  document.getElementById("userName").value = "";
  document.getElementById("userWhatsapp").value = "";
}

// Submit & redirect to WhatsApp
function submitTeahug() {
  const name = document.getElementById("userName").value.trim();
  const phone = document.getElementById("userWhatsapp").value.trim();

  if (!name || !phone) {
    alert("Please fill in all fields");
    return;
  }

  // Hug Hour restriction (same as before)
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

