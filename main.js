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
const preHugSection = document.getElementById("preHugSection");
const preHugCountdown = document.getElementById("preHugCountdown");
const hugHourTopCountdown = document.getElementById("hugHourTopCountdown");
const hugHourTimer = document.getElementById("hugHourTimer");
const songFeed = document.getElementById("songFeed");
const introPopup = document.getElementById("introPopup");
const messagePopup = document.getElementById("messagePopup");
const songTitleEl = document.getElementById("songTitle");
const recipientNameInput = document.getElementById("recipientName");
const recipientNumberInput = document.getElementById("recipientNumber");
const sendMsgBtn = document.getElementById("sendMsgBtn");
const hugEmojis = document.querySelectorAll(".hug-emoji");

let allSongs = [];
let audioPlayers = [];
let selectedSong = null;
let selectedEmoji = "";

// -----------------
// Load Songs
async function loadSongs() {
  songFeed.innerHTML = "";
  audioPlayers = [];
  try {
    const snapshot = await getDocs(collection(db, "songs"));
    allSongs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Prepare looped array for infinite scroll
    const loopSongs = [...allSongs];
    if (allSongs.length > 1) {
      loopSongs.unshift(allSongs[allSongs.length - 1]); // prepend last song
      loopSongs.push(allSongs[0]); // append first song
    }

    loopSongs.forEach((song, index) => {
      const card = document.createElement("div");
      card.className = "song-card";
      card.dataset.index = index;

      card.innerHTML = `
        <img class="song-img" src="${song.coverURL}">
        <div class="play-overlay">▶</div>
        <button class="sendBtn">Select</button>
      `;

      const audio = new Audio(song.songURL);
      audio.loop = true;
      audioPlayers.push(audio);

      const overlay = card.querySelector(".play-overlay");
      const selectBtn = card.querySelector(".sendBtn");

      overlay.addEventListener("click", () => {
        if (audio.paused) { stopAll(); audio.play(); overlay.style.display = "none"; }
        else { audio.pause(); overlay.style.display = "block"; }
      });

      selectBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openMessageForm(song);
      });

      songFeed.appendChild(card);
    });

    // Set initial scroll to first real song (index 1)
    if (allSongs.length > 1) {
      songFeed.scrollTop = window.innerHeight;
    }

    observeCards();

  } catch (err) {
    console.error(err);
    alert("Failed to load songs. Check console.");
  }
}

function stopAll() {
  audioPlayers.forEach(a => { a.pause(); a.currentTime = 0; });
}

// -----------------
// Auto play with IntersectionObserver
function observeCards() {
  const cards = document.querySelectorAll(".song-card");
  const options = { root: songFeed, threshold: 0.6 };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const idx = Number(entry.target.dataset.index);
      if (entry.isIntersecting) {
        stopAll();
        audioPlayers[idx].play();
        const overlay = entry.target.querySelector(".play-overlay");
        if (overlay) overlay.style.display = "none";

        // Infinite scroll handling
        if (allSongs.length > 1) {
          if (idx === 0) { // first dummy card
            songFeed.scrollTop = window.innerHeight * allSongs.length;
          } else if (idx === allSongs.length + 1) { // last dummy card
            songFeed.scrollTop = window.innerHeight;
          }
        }

      } else {
        audioPlayers[idx].pause();
        const overlay = entry.target.querySelector(".play-overlay");
        if (overlay) overlay.style.display = "block";
      }
    });
  }, options);

  cards.forEach(card => observer.observe(card));
}

// -----------------
// Message Form
function openMessageForm(song) {
  selectedSong = song;
  songTitleEl.textContent = song.title;
  messagePopup.classList.remove("hidden");

  hugEmojis.forEach(btn => {
    btn.onclick = () => {
      hugEmojis.forEach(e => e.classList.remove("selected"));
      btn.classList.add("selected");
      selectedEmoji = btn.dataset.emoji;
    };
  });
}

sendMsgBtn.onclick = () => {
  if (!selectedSong) return;
  const name = recipientNameInput.value.trim();
  const number = recipientNumberInput.value.trim();
  if (!name || !number) return alert("Enter name and number.");
  if (!selectedEmoji) return alert("Select a HugMoji.");

  const msg = `🎵 ${selectedSong.title}\nFrom: ${name}\nPhone: ${number}\nFeeling: ${selectedEmoji}\n\nSong link: ${window.location.origin}/?song=${selectedSong.id}`;
  navigator.clipboard.writeText(msg).then(() => {
    alert("Message copied! Paste in WhatsApp.");
    messagePopup.classList.add("hidden");
    recipientNameInput.value = "";
    recipientNumberInput.value = "";
    hugEmojis.forEach(e => e.classList.remove("selected"));
    selectedEmoji = "";
  });
};

window.closeMessageForm = () => messagePopup.classList.add("hidden");

// -----------------
// Countdown
function updateCountdown() {
  const now = new Date();
  const hour = now.getHours();

  if (hour < 19) {
    preHugSection.style.display = "flex";
    hugHourTopCountdown.classList.add("hidden");
    songFeed.style.display = "none";
    let target = new Date(); target.setHours(19,0,0,0);
    const diff = target - now;
    const h = String(Math.floor(diff/(1000*60*60))).padStart(2,"0");
    const m = String(Math.floor((diff/(1000*60))%60)).padStart(2,"0");
    const s = String(Math.floor((diff/1000)%60)).padStart(2,"0");
    preHugCountdown.textContent = `${h} : ${m} : ${s}`;
  } else if (hour >= 19 && hour < 22) {
    preHugSection.style.display = "none";
    hugHourTopCountdown.classList.remove("hidden");
    songFeed.style.display = "block";
    let target = new Date(); target.setHours(22,0,0,0);
    const diff = target - now;
    const h = String(Math.floor(diff/(1000*60*60))).padStart(2,"0");
    const m = String(Math.floor((diff/(1000*60))%60)).padStart(2,"0");
    const s = String(Math.floor((diff/1000)%60)).padStart(2,"0");
    hugHourTimer.textContent = `${h} : ${m} : ${s}`;
  } else {
    preHugSection.style.display = "flex";
    hugHourTopCountdown.classList.add("hidden");
    songFeed.style.display = "none";
    let target = new Date(); target.setDate(target.getDate()+1); target.setHours(19,0,0,0);
    const diff = target - now;
    const h = String(Math.floor(diff/(1000*60*60))).padStart(2,"0");
    const m = String(Math.floor((diff/(1000*60))%60)).padStart(2,"0");
    const s = String(Math.floor((diff/1000)%60)).padStart(2,"0");
    preHugCountdown.textContent = `${h} : ${m} : ${s}`;
  }
}

// -----------------
// Start
loadSongs();
updateCountdown();
setInterval(updateCountdown,1000);
