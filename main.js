import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

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

setTimeout(() => introPopup.style.display = "none", 5000);

aboutBtn.addEventListener("click", () => { aboutPopup.style.display = "block"; });
window.closeAbout = () => { aboutPopup.style.display = "none"; };
window.closeMessageForm = () => { messagePopup.style.display = "none"; };

async function loadSongs() {
  const snapshot = await getDocs(collection(db, "songs"));
  snapshot.forEach(doc => { allSongs.push({ id: doc.id, ...doc.data() }); });
  shuffleSongs();
  buildFeed();
  playSong(0);
}

function shuffleSongs() {
  for (let i = allSongs.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [allSongs[i], allSongs[j]] = [allSongs[j], allSongs[i]];
  }
}

function buildFeed() {
  songFeed.innerHTML = "";
  songElements = [];
  audioPlayers = [];

  allSongs.forEach((song, index) => {
    const card = document.createElement("div");
    card.classList.add("song-card");
    card.innerHTML = `
      <img src="${song.coverURL}" class="song-img">
      <div class="play-overlay">▶</div>
      <button class="sendBtn">Send</button>
    `;
    const audio = new Audio(song.songURL);
    audio.loop = true;

    audioPlayers.push(audio);
    songElements.push(card);

    card.querySelector(".sendBtn").onclick = () => openMessageForm(song);

    const playOverlay = card.querySelector(".play-overlay");
    card.addEventListener("click", () => {
      if (audio.paused) { audio.play(); playOverlay.style.display = "none"; } 
      else { audio.pause(); playOverlay.style.display = "block"; }
    });

    songFeed.appendChild(card);
  });

  enableSwipe();
}

function enableSwipe() {
  let startY = 0;
  let endY = 0;

  songFeed.addEventListener("touchstart", (e) => { startY = e.touches[0].clientY; });
  songFeed.addEventListener("touchend", (e) => {
    endY = e.changedTouches[0].clientY;
    if (startY - endY > 80) nextSong();
    if (endY - startY > 80) prevSong();
  });
}

function nextSong() { stopAll(); currentIndex++; if(currentIndex>=songElements.length) currentIndex=0; scrollToSong(currentIndex); playSong(currentIndex);}
function prevSong() { stopAll(); currentIndex--; if(currentIndex<0) currentIndex=songElements.length-1; scrollToSong(currentIndex); playSong(currentIndex);}
function scrollToSong(i) { songElements[i].scrollIntoView({ behavior: "smooth" }); }
function playSong(i) { stopAll(); audioPlayers[i].play(); }
function stopAll() { audioPlayers.forEach(a=>{ a.pause(); a.currentTime=0; }); }

function openMessageForm(song) {
  songTitleEl.textContent = song.title;
  messagePopup.style.display = "block";
  sendMsgBtn.onclick = () => sendEmail(song);
}

async function sendEmail(song) {
  const message = userMsgInput.value.trim();
  if (!message) return alert("Please type a message.");
  const payload = { title: song.title, message: message };
  const res = await fetch("https://teahug.workers.dev/send", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (res.ok) { alert("Message sent ❤️"); messagePopup.style.display="none"; userMsgInput.value=""; }
  else { alert("Failed to send message."); }
}

function updateCountdown() {
  const now = new Date();
  const current = now.getHours();
  let target = new Date(); target.setHours(21,0,0,0);
  if(current>=21){ countdownEl.textContent="Hug Hour Active ❤️"; return; }
  let diff = target - now;
  let h = Math.floor(diff/3600000);
  let m = Math.floor((diff%3600000)/60000);
  countdownEl.textContent=`${h}h ${m}m to Hug Hour`;
}

setInterval(updateCountdown,1000);
loadSongs(); updateCountdown();
