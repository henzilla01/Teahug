import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// DOM Elements
const songFeed = document.getElementById("songFeed");
const introPopup = document.getElementById("introPopup");
const messagePopup = document.getElementById("messagePopup");
const songTitleEl = document.getElementById("songTitle");
const userMsgInput = document.getElementById("userMessage");
const sendMsgBtn = document.getElementById("sendMsgBtn");
const recipientName = document.getElementById("recipientName");
const recipientPhone = document.getElementById("recipientPhone");
const hugMojiBtns = document.querySelectorAll(".hugMojiBtn");
const preHugSection = document.getElementById("preHugSection");
const preHugCountdown = document.getElementById("preHugCountdown");
const hugHourTopCountdown = document.getElementById("hugHourTopCountdown");
const hugHourTimer = document.getElementById("hugHourTimer");

let selectedHugMoji = null;
let allSongs = [], songElements = [], audioPlayers = [], currentIndex = 0;

// -----------------
// Intro popup auto-close after 10s
introPopup.classList.remove("hidden");
setTimeout(() => introPopup.classList.add("hidden"), 10000);
window.closeMessageForm = () => messagePopup.classList.add("hidden");

// -----------------
// HugMoji selection
hugMojiBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    hugMojiBtns.forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedHugMoji = btn.dataset.emoji;
  });
});

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
  const loopSongs = [allSongs[allSongs.length-1], ...allSongs, allSongs[0]];

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

    card.querySelector(".sendBtn").onclick = e => { e.stopPropagation(); openMessageForm(song); };

    card.addEventListener("click", () => {
      if (audio.paused) { audio.play(); card.querySelector(".play-overlay").style.display = "none"; }
      else { audio.pause(); card.querySelector(".play-overlay").style.display = "block"; }
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

function stopAll() { audioPlayers.forEach(a => { a.pause(); a.currentTime=0; }); }

// -----------------
// Message Popup
function openMessageForm(song) {
  songTitleEl.textContent = song.title;
  messagePopup.classList.remove("hidden");
  sendMsgBtn.onclick = () => sendViaWhatsApp(song);
}

function sendViaWhatsApp(song) {
  const name = recipientName.value.trim();
  const phone = recipientPhone.value.trim();
  const message = userMsgInput.value.trim();
  if (!name || !phone) return alert("Please fill in recipient details.");
  const emoji = selectedHugMoji || "";

  const fullMessage = `🎵 ${song.title}\n\nMessage: ${message}\nTo: ${name} (${phone})\nFeeling: ${emoji}\n\nSong link: ${window.location.origin}/?song=${song.id}`;

  navigator.clipboard.writeText(fullMessage).then(() => {
    window.open("https://wa.me/message/WU7FM2NLOXI6P1", "_blank");
    alert("Message copied! Paste it in WhatsApp.");
    messagePopup.classList.add("hidden");
    userMsgInput.value = "";
    recipientName.value = "";
    recipientPhone.value = "";
    hugMojiBtns.forEach(b => b.classList.remove("selected"));
    selectedHugMoji = null;
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
    songFeed.style.display = "none";

    let target = new Date();
    target.setHours(19,0,0,0);
    const diff = target - now;
    const h = String(Math.floor(diff / 3600000)).padStart(2,"0");
    const m = String(Math.floor((diff % 3600000)/60000)).padStart(2,"0");
    const s = String(Math.floor((diff % 60000)/1000)).padStart(2,"0");
    preHugCountdown.textContent = `${h} : ${m} : ${s}`;
  }
  // HUG HOUR: 7PM - 10PM
  else if (hour >=19 && hour <22) {
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
  }
  // POST HUG: after 10 PM
  else {
    preHugSection.style.display = "flex";
    hugHourTopCountdown.classList.add("hidden");
    songFeed.style.display = "none";
  }
}

// -----------------
// Start Everything
loadSongs();
updateCountdown();
setInterval(updateCountdown,1000);
