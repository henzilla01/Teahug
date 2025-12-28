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

// DOM
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

// State
let allSongs = [];
let audioPlayers = [];
let currentIndex = 0;
let selectedEmoji = "";
let isScrolling = false;

// -----------------
// Popups
function showIntroPopup() {
  introPopup.classList.remove("hidden");
  setTimeout(() => introPopup.classList.add("hidden"), 10000);
}
window.closeMessageForm = () => messagePopup.classList.add("hidden");

// -----------------
// Load songs
async function loadSongs() {
  try {
    const snapshot = await getDocs(collection(db, "songs"));
    allSongs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    buildFeed();
  } catch (err) {
    console.error(err);
    alert("Failed to load songs");
  }
}

// -----------------
// Build feed
function buildFeed() {
  songFeed.innerHTML = "";
  audioPlayers = [];

  allSongs.forEach((song, index) => {
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

    // Send button
    card.querySelector(".sendBtn").onclick = (e) => {
      e.stopPropagation();
      openMoodPicker(song.title);
    };

    songFeed.appendChild(card);
  });

  // Start observing scroll
  observeScroll();
}

// -----------------
// Scroll observer for smooth autoplay
function observeScroll() {
  const cards = document.querySelectorAll(".song-card");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const index = Array.from(cards).indexOf(entry.target);
      if (entry.isIntersecting) {
        // Pause previous
        audioPlayers.forEach((a, i) => {
          if (i !== index) a.pause();
        });
        // Play current
        audioPlayers[index].play().catch(() => {});
        currentIndex = index;
      } else {
        audioPlayers[index].pause();
      }
    });
  }, { threshold: 0.6 });

  cards.forEach(card => observer.observe(card));
}

// -----------------
// Message & Mood Picker
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

  if (!name || !phone) { alert("Fill all fields"); return; }

  const moodText = selectedMood === "love" ? "❤️ Love" : "🍿 Popcorn";
  const message = `Teahug Surprise 💛\nSong: ${selectedSongTitle}\nMood: ${moodText}\nFor: ${name}`;
  const encoded = encodeURIComponent(message);
  const whatsappNumber = "2348056882601";
  window.location.href = `https://wa.me/${whatsappNumber}?text=${encoded}`;
}

// -----------------
// Countdown logic
function updateCountdown() {
  const now = new Date();
  const hour = now.getHours();

  if (hour < 19) { // Pre-Hug
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
  else if (hour >=19 && hour < 22) { // Hug Hour
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

    if (h==="03" && m==="00" && s==="00") showIntroPopup();
  }
  else { // Post-Hug
    preHugSection.style.display = "flex";
    hugHourTopCountdown.classList.add("hidden");
    songFeed.style.display = "none";

    let target = new Date();
    target.setDate(target.getDate()+1);
    target.setHours(19,0,0,0);
    const diff = target - now;

    const h = String(Math.floor(diff / (1000*60*60))).padStart(2,"0");
    const m = String(Math.floor((diff / (1000*60)) % 60)).padStart(2,"0");
    const s = String(Math.floor((diff / 1000) % 60)).padStart(2,"0");

    preHugCountdown.textContent = `${h} : ${m} : ${s}`;
  }
}

// -----------------
// Init
loadSongs();
updateCountdown();
setInterval(updateCountdown,1000);
