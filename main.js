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

// MESSAGE FORM ELEMENTS
const messagePopup = document.getElementById("messagePopup");
const songTitleEl = document.getElementById("songTitle");
const recipientNameInput = document.getElementById("recipientName");
const recipientNumberInput = document.getElementById("recipientNumber");
const sendMsgBtn = document.getElementById("sendMsgBtn");
const hugEmojis = document.querySelectorAll(".hug-emoji");

// MOOD PICKER ELEMENTS
const moodModal = document.getElementById("moodModal");
const formModal = document.getElementById("formModal");
const selectedSongTitleEl = document.getElementById("selectedSongTitle");
const formTitleEl = document.getElementById("formTitle");
const userNameInput = document.getElementById("userName");
const userWhatsappInput = document.getElementById("userWhatsapp");

// COUNTDOWN ELEMENTS
const preHugSection = document.getElementById("preHugSection");
const preHugCountdown = document.getElementById("preHugCountdown");
const hugHourTopCountdown = document.getElementById("hugHourTopCountdown");
const hugHourTimer = document.getElementById("hugHourTimer");

let allSongs = [];
let songElements = [];
let audioPlayers = [];
let currentIndex = 0;
let selectedEmoji = "";
let selectedMood = "";
let selectedSongTitle = "";

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

    if (allSongs.length === 0) {
      songFeed.innerHTML = "<p style='text-align:center; color: #888;'>No songs uploaded yet.</p>";
      return;
    }

    buildFeed();
  } catch (err) {
    console.error(err);
    songFeed.innerHTML = "<p style='text-align:center; color: red;'>Failed to load songs. Check console.</p>";
  }
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

    card.querySelector(".sendBtn").onclick = e => {
      e.stopPropagation();
      openMoodPicker(song.title);
    };

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
// Mood Picker
function openMoodPicker(songTitle) {
  selectedSongTitle = songTitle;
  selectedSongTitleEl.innerText = songTitle;
  moodModal.classList.remove("hidden");
}

function selectMood(mood) {
  selectedMood = mood;
  moodModal.classList.add("hidden");
  formModal.classList.remove("hidden");

  formTitleEl.innerText = mood === "love" ? "You picked ❤️!\nWHO CAME TO MIND?" : "You picked 🍿!\nWHO CAME TO MIND?";
}

// -----------------
// Form Submit
function closeForm() {
  formModal.classList.add("hidden");
  userNameInput.value = "";
  userWhatsappInput.value = "";
}

function submitTeahug() {
  const name = userNameInput.value.trim();
  const phone = userWhatsappInput.value.trim();

  if (!name || !phone) {
    alert("Please fill in all fields");
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
// Countdown Logic
function updateCountdown() {
  const now = new Date();
  const hour = now.getHours();

  if (hour < 19) { // PRE-HUG
    preHugSection.style.display = "flex";
    hugHourTopCountdown.classList.add("hidden");
    songFeed.style.display = "none";
    introPopup.classList.add("hidden");

    const target = new Date();
    target.setHours(19,0,0,0);
    const diff = target - now;

    const h = String(Math.floor(diff / (1000*60*60))).padStart(2,"0");
    const m = String(Math.floor((diff / (1000*60)) % 60)).padStart(2,"0");
    const s = String(Math.floor((diff / 1000) % 60)).padStart(2,"0");
    preHugCountdown.textContent = `${h} : ${m} : ${s}`;
  } else if (hour >= 19 && hour < 22) { // HUG HOUR
    preHugSection.style.display = "none";
    hugHourTopCountdown.classList.remove("hidden");
    songFeed.style.display = "block";

    const target = new Date();
    target.setHours(22,0,0,0);
    const diff = target - now;

    const h = String(Math.floor(diff / (1000*60*60))).padStart(2,"0");
    const m = String(Math.floor((diff / (1000*60)) % 60)).padStart(2,"0");
    const s = String(Math.floor((diff / 1000) % 60)).padStart(2,"0");
    hugHourTimer.textContent = `${h} : ${m} : ${s}`;

    if (h === "03" && m === "00" && s === "00") showIntroPopup();
  } else { // POST-HUG
    preHugSection.style.display = "flex";
    hugHourTopCountdown.classList.add("hidden");
    songFeed.style.display = "none";

    const target = new Date();
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
