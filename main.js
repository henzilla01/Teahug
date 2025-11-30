import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

/* ===== FIREBASE CONFIG - use your project values ===== */
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

/* ===== DOM ===== */
const songFeed = document.getElementById("songFeed");
const introPopup = document.getElementById("introPopup");
const aboutPopup = document.getElementById("aboutPopup");
const aboutBtn = document.getElementById("aboutBtn");
const messagePopup = document.getElementById("messagePopup");
const songTitleEl = document.getElementById("songTitle");
const userMsgInput = document.getElementById("userMessage");
const sendMsgBtn = document.getElementById("sendMsgBtn");
const countdownEl = document.getElementById("countdown");

/* ===== Worker endpoint for messages - replace if different ===== */
const MESSAGE_WORKER = "https://teahug.workers.dev/send";

/* ===== State ===== */
let allSongs = [];
let audioPlayers = [];
let currentIndex = 0;

/* ===== Intro popup show/hide ===== */
introPopup.classList.remove("hidden");
setTimeout(() => introPopup.classList.add("hidden"), 5000);

/* ===== About popup logic ===== */
aboutBtn.addEventListener("click", () => aboutPopup.classList.remove("hidden"));
window.closeAbout = () => aboutPopup.classList.add("hidden");

/* ===== Message popup logic ===== */
window.closeMessageForm = () => messagePopup.classList.add("hidden");

/* ===== Load songs from Firestore ===== */
async function loadSongs() {
  // order by timestamp desc (newest first)
  const q = query(collection(db, "songs"), orderBy("timestamp", "desc"));
  const snap = await getDocs(q);
  allSongs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  buildFeed();
  if (audioPlayers.length) playSong(0);
}

function buildFeed() {
  songFeed.innerHTML = "";
  audioPlayers = [];

  allSongs.forEach((s, i) => {
    const card = document.createElement("div");
    card.className = "song-card";

    // cover image element
    const img = document.createElement("img");
    img.className = "cover";
    img.src = s.coverURL || "";
    img.alt = s.title || "cover";

    // content overlay
    const content = document.createElement("div");
    content.className = "card-content";
    content.innerHTML = `
      <div class="meta">
        <div style="font-weight:800; font-size:18px;">${s.title || "Untitled"}</div>
        <div style="opacity:0.9; margin-top:6px;">${s.artist || ""}</div>
      </div>
    `;

    // play overlay + send button
    const playOverlay = document.createElement("div");
    playOverlay.className = "play-overlay";
    playOverlay.textContent = "▶";

    const sendBtn = document.createElement("button");
    sendBtn.className = "send-btn";
    sendBtn.textContent = "Send";

    // audio player (not attached to DOM)
    const audio = new Audio(s.songURL);
    audio.loop = true;
    audioPlayers.push(audio);

    // card assembly
    card.appendChild(img);
    card.appendChild(content);
    card.appendChild(playOverlay);
    card.appendChild(sendBtn);
    songFeed.appendChild(card);

    // Tap card to toggle play/pause
    card.addEventListener("click", (ev) => {
      // if user clicked the "Send" button, we ignore toggle here
      if (ev.target === sendBtn) return;
      if (audio.paused) {
        stopAll();
        audio.play();
        playOverlay.style.display = "none";
      } else {
        audio.pause();
        playOverlay.style.display = "block";
      }
    });

    // Send button opens message popup ONLY
    sendBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      openMessageForm(s);
    });
  });

  enableSwipe();
}

/* ===== Swipe navigation for mobile ===== */
function enableSwipe() {
  let startY = 0;
  songFeed.addEventListener("touchstart", (e) => startY = e.touches[0].clientY);
  songFeed.addEventListener("touchend", (e) => {
    const endY = e.changedTouches[0].clientY;
    if (startY - endY > 80) nextSong();
    if (endY - startY > 80) prevSong();
  });

  // handle desktop scroll snap -> update playing item
  songFeed.addEventListener("scroll", throttle(() => {
    const idx = Math.round(songFeed.scrollTop / window.innerHeight);
    if (idx !== currentIndex) {
      currentIndex = idx;
      stopAll();
      if (audioPlayers[currentIndex]) audioPlayers[currentIndex].play();
    }
  }, 120));
}

/* throttle helper */
function throttle(fn, wait) {
  let t = null;
  return (...args) => {
    if (t) return;
    t = setTimeout(() => { fn(...args); t = null; }, wait);
  };
}

/* navigation */
function nextSong() {
  currentIndex = Math.min(audioPlayers.length - 1, currentIndex + 1);
  scrollTo(currentIndex);
  stopAll();
  if (audioPlayers[currentIndex]) audioPlayers[currentIndex].play();
}
function prevSong() {
  currentIndex = Math.max(0, currentIndex - 1);
  scrollTo(currentIndex);
  stopAll();
  if (audioPlayers[currentIndex]) audioPlayers[currentIndex].play();
}
function scrollTo(i) {
  const child = songFeed.children[i];
  if (child) child.scrollIntoView({ behavior: "smooth" });
}

/* stop all audio */
function stopAll() {
  audioPlayers.forEach(a => { try { a.pause(); a.currentTime = 0; } catch(e){} });
}

/* open message popup for a specific song */
function openMessageForm(song) {
  songTitleEl.textContent = song.title || "Untitled";
  messagePopup.classList.remove("hidden");

  // set fresh handler
  sendMsgBtn.onclick = () => sendMessage(song);
}

/* send message to your worker endpoint (blocks during Hug Hour) */
async function sendMessage(song) {
  const message = (userMsgInput.value || "").trim();
  if (!message) return alert("Please type a message.");

  const now = new Date();
  const hour = now.getHours();
  // Hug Hour is 21:00 - 23:59 (9PM-12AM)
  if (hour >= 21 && hour < 24) {
    return alert("Messages cannot be sent during Hug Hour (9PM–12AM).");
  }

  // POST to worker
  try {
    const payload = { title: song.title || "Untitled", message };
    const res = await fetch(MESSAGE_WORKER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert("Message sent ❤️");
      userMsgInput.value = "";
      messagePopup.classList.add("hidden");
    } else {
      alert("Failed to send message.");
    }
  } catch (err) {
    console.error(err);
    alert("Failed to send message.");
  }
}

/* ===== Hug Hour countdown ===== */
function updateCountdown() {
  const now = new Date();
  const currentHour = now.getHours();
  if (currentHour >= 21 && currentHour < 24) {
    countdownEl.textContent = "Hug Hour Active ❤️";
    return;
  }
  const next = new Date();
  next.setHours(21,0,0,0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const diff = next - now;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  countdownEl.textContent = `${h}h ${m}m ${s}s to Hug Hour`;
}
setInterval(updateCountdown, 1000);

/* start */
loadSongs();
updateCountdown();
