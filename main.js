import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// -------------------
// Firebase setup
// -------------------
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

// -------------------
// DOM Elements
// -------------------
const songFeed = document.getElementById("songFeed");
const introPopup = document.getElementById("introPopup");
const messagePopup = document.getElementById("messagePopup");
const songTitleEl = document.getElementById("songTitle");
const userNameInput = document.getElementById("userName");
const userNumberInput = document.getElementById("userNumber");
const sendMsgBtn = document.getElementById("sendMsgBtn");
const hugLoveBtn = document.getElementById("hugLove");
const hugPopcornBtn = document.getElementById("hugPopcorn");

const preHugSection = document.getElementById("preHugSection");
const preHugCountdown = document.getElementById("preHugCountdown");
const hugHourTopCountdown = document.getElementById("hugHourTopCountdown");
const hugHourTimer = document.getElementById("hugHourTimer");

let allSongs = [];
let songElements = [];
let audioPlayers = [];
let currentIndex = 0;
let selectedHugEmoji = "";

// -------------------
// Popups
// -------------------
function showIntroPopup() {
  introPopup.classList.remove("hidden");
  setTimeout(() => introPopup.classList.add("hidden"), 10000); // auto-close after 10s
}
window.closeMessageForm = () => messagePopup.classList.add("hidden");

// -------------------
// Load Songs
// -------------------
async function loadSongs() {
  const snapshot = await getDocs(collection(db, "songs"));
  allSongs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  buildFeed();
}

// -------------------
// Build Feed
// -------------------
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

    // Send/Select button
    card.querySelector(".sendBtn").onclick = e => {
      e.stopPropagation();
      openMessageForm(song);
    };

    // Play overlay click
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

// -------------------
// Message Popup
// -------------------
function openMessageForm(song) {
  songTitleEl.textContent = song.title;
  messagePopup.classList.remove("hidden");
  selectedHugEmoji = ""; // reset selection

  hugLoveBtn.onclick = () => { selectedHugEmoji = "❤️"; hugLoveBtn.classList.add("selected"); hugPopcornBtn.classList.remove("selected"); };
  hugPopcornBtn.onclick = () => { selectedHugEmoji = "🍿"; hugPopcornBtn.classList.add("selected"); hugLoveBtn.classList.remove("selected"); };

  sendMsgBtn.onclick = () => sendViaWhatsApp(song);
}

function sendViaWhatsApp(song) {
  const name = userNameInput.value.trim();
  const number = userNumberInput.value.trim();
  if (!name || !number) return alert("Please fill in both name and number.");
  if (!selectedHugEmoji) return alert("Please select a HugMoji!");

  const fullMessage = `🎵 ${song.title}\nTo: ${name}\nNumber: ${number}\nFeeling: ${selectedHugEmoji}\n\nSong link: ${window.location.origin}/?song=${song.id}`;

  navigator.clipboard.writeText(fullMessage)
    .then(() => {
      window.open("https://wa.me/message/WU7FM2NLOXI6P1", "_blank");
      alert("Message copied! Paste it in WhatsApp to send.");
      messagePopup.classList.add("hidden");
      userNameInput.value = "";
      userNumberInput.value = "";
      selectedHugEmoji = "";
      hugLoveBtn.classList.remove("selected");
      hugPopcornBtn.classList.remove("selected");
    });
}

// -------------------
// Countdown Logic
// -------------------
function updateCountdown() {
  const now = new Date();

  // PRE-HUG: Before 7 PM
  if (now.getHours() < 19) {
    preHugSection.style.display = "flex";
    hugHourTopCountdown.classList.add("hidden");
    songFeed.style.display = "none";
    introPopup.classList.add("hidden");

    let target = new Date();
    target.setHours(19,0,0,0);
    const diff = target - now;

    const h = String(Math.floor(diff / 3600000)).padStart(2,"0");
    const m = String(Math.floor((diff % 3600000)/60000)).padStart(2,"0");
    const s = String(Math.floor((diff % 60000)/1000)).padStart(2,"0");

    if(preHugCountdown) preHugCountdown.textContent = `${h} : ${m} : ${s}`;
  } 
  // HUG HOUR: 7 PM – 10 PM
  else if (now.getHours() >= 19 && now.getHours() < 22) {
    preHugSection.style.display = "none";
    hugHourTopCountdown.classList.remove("hidden");
    songFeed.style.display = "block";

    let target = new Date();
    target.setHours(22,0,0,0);
    const diff = target - now;

    const h = String(Math.floor(diff / 3600000)).padStart(2,"0");
    const m = String(Math.floor((diff % 3600000)/60000)).padStart(2,"0");
    const s = String(Math.floor((diff % 60000)/1000)).padStart(2,"0");

    if(hugHourTimer) hugHourTimer.textContent = `${h} : ${m} : ${s}`;

    if(!introPopup.classList.contains("shown")) {
      introPopup.classList.add("shown");
      showIntroPopup();
    }
  } 
  // POST-HUG: after 10 PM
  else {
    preHugSection.style.display = "flex";
    hugHourTopCountdown.classList.add("hidden");
    songFeed.style.display = "none";
    introPopup.classList.add("hidden");
  }
}

// -------------------
// Start Everything
// -------------------
loadSongs();
setInterval(updateCountdown, 1000);
updateCountdown();
