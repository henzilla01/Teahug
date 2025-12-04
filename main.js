import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// -----------------
// Firebase setup
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

// -----------------
// DOM Elements
const songFeed = document.getElementById("songFeed");
const introPopup = document.getElementById("introPopup");
const messagePopup = document.getElementById("messagePopup");
const songTitleEl = document.getElementById("songTitle");
const userMsgInput = document.getElementById("userMessage");
const sendMsgBtn = document.getElementById("sendMsgBtn");

const preHugSection = document.getElementById("preHugSection");
const preHugCountdown = document.getElementById("preHugCountdown");
const hugHourTopCountdown = document.getElementById("hugHourTopCountdown");
const hugHourTimer = document.getElementById("hugHourTimer");

let allSongs = [];
let songElements = [];
let audioPlayers = [];
let currentIndex = 0;
let introPopupShown = false; // ensures intro popup only shows once per Hug Hour

// -----------------
// Popups
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
                      <button class="sendBtn">Copy</button>`;
    
    const audio = new Audio(song.songURL);
    audio.loop = true;
    audioPlayers.push(audio);
    songElements.push(card);

    // Send button
    card.querySelector(".sendBtn").onclick = e => {
      e.stopPropagation();
      openMessageForm(song);
    };

    // Tap to play/pause
    card.addEventListener("click", () => {
      if (audio.paused) { 
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

function stopAll() { audioPlayers.forEach(a => { a.pause(); a.currentTime = 0; }); }

// -----------------
// Message Popup
function openMessageForm(song) {
  songTitleEl.textContent = song.title;
  messagePopup.classList.remove("hidden");
  sendMsgBtn.onclick = () => sendViaWhatsApp(song);
}

function sendViaWhatsApp(song) {
  const message = userMsgInput.value.trim();
  if (!message) return alert("Please type a message.");
  const fullMessage = `🎵 ${song.title}\n\n${message}\n\nSong link: ${window.location.origin}/?song=${song.id}`;
  navigator.clipboard.writeText(fullMessage)
    .then(() => {
      window.open("https://wa.me/message/WU7FM2NLOXI6P1", "_blank");
      alert("Message copied! Paste it in WhatsApp.");
      messagePopup.classList.add("hidden");
      userMsgInput.value = "";
    });
}

// -----------------
// Countdown Logic
function updateCountdown() {
  const now = new Date();
  const hour = now.getHours();
  const min = now.getMinutes();
  const sec = now.getSeconds();

  // PRE-HUG: Before 7 PM
  if (hour < 19) {
    preHugSection.style.display = "flex";
    hugHourTopCountdown.classList.add("hidden");

    let target = new Date();
    target.setHours(19,0,0,0);
    const diff = target - now;

    const h = String(Math.floor(diff / 3600000)).padStart(2,"0");
    const m = String(Math.floor((diff % 3600000)/60000)).padStart(2,"0");
    const s = String(Math.floor((diff % 60000)/1000)).padStart(2,"0");
    preHugCountdown.textContent = `${h} : ${m} : ${s}`;

    songFeed.style.display = "none";
    introPopup.classList.add("hidden"); // Hide popup during pre-hug
  }
  // HUG HOUR: 7PM - 10PM
  else if (hour >= 19 && hour < 22) {
    preHugSection.style.display = "none";
    hugHourTopCountdown.classList.remove("hidden");
    songFeed.style.display = "block";

    let target = new Date();
    target.setHours(22,0,0,0);
    const diff = target - now;

    const h = String(Math.floor(diff / 3600000)).padStart(2,"0");
    const m = String(Math.floor((diff % 3600000)/60000)).padStart(2,"0");
    const s = String(Math.floor((diff % 60000)/1000)).padStart(2,"0");
    hugHourTimer.textContent = `${h}:${m}:${s}`;

    // Show intro popup only once at start of Hug Hour
    if (!introPopupShown) {
      introPopup.classList.remove("hidden");
      setTimeout(() => introPopup.classList.add("hidden"), 10000); // auto close 10s
      introPopupShown = true;
    }
  }
  // POST HUG: after 10 PM
  else {
    preHugSection.style.display = "flex";
    hugHourTopCountdown.classList.add("hidden");
    songFeed.style.display = "none";
    introPopupShown = false; // reset for next day
  }
}

// -----------------
// Start Everything
loadSongs();
setInterval(updateCountdown, 1000);
updateCountdown();
