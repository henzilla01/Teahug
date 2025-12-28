import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ---------------- FIREBASE CONFIG ----------------
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

// ---------------- DOM ELEMENTS ----------------
const preHugSection = document.getElementById("preHugSection");
const preHugCountdown = document.getElementById("preHugCountdown");
const hugHourTopCountdown = document.getElementById("hugHourTopCountdown");
const hugHourTimer = document.getElementById("hugHourTimer");
const songFeed = document.getElementById("songFeed");
const introPopup = document.getElementById("introPopup");

// Mood & form
const moodModal = document.getElementById("moodModal");
const formModal = document.getElementById("formModal");
const selectedSongTitleEl = document.getElementById("selectedSongTitle");
const formTitleEl = document.getElementById("formTitle");
const userNameEl = document.getElementById("userName");
const userWhatsappEl = document.getElementById("userWhatsapp");

let allSongs = [];
let selectedMood = "";
let selectedSongTitle = "";

// ---------------- HELPER FUNCTIONS ----------------
window.closeForm = () => formModal.classList.add("hidden");

function showIntroPopup() {
  introPopup.classList.remove("hidden");
  setTimeout(() => introPopup.classList.add("hidden"), 10000);
}

// ---------------- LOAD SONGS ----------------
async function loadSongs() {
  try {
    const snapshot = await getDocs(collection(db, "songs"));
    allSongs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    buildFeed();
  } catch (err) {
    console.error("Failed to load songs", err);
    songFeed.innerHTML = "<p style='color:red;'>Failed to load songs</p>";
  }
}

// ---------------- BUILD SONG FEED ----------------
function buildFeed() {
  songFeed.innerHTML = "";
  allSongs.forEach(song => {
    const card = document.createElement("div");
    card.className = "song-card";
    card.innerHTML = `
      <img src="${song.coverURL}" class="song-img">
      <div class="song-info">
        <h3>${song.title}</h3>
        <p>${song.artist}</p>
        <button class="selectBtn">Select</button>
      </div>
    `;

    card.querySelector(".selectBtn").onclick = () => openMoodPicker(song.title);

    songFeed.appendChild(card);
  });
}

// ---------------- MOOD PICKER ----------------
function openMoodPicker(title) {
  selectedSongTitle = title;
  selectedSongTitleEl.innerText = title;
  moodModal.classList.remove("hidden");
}

window.selectMood = (mood) => {
  selectedMood = mood;
  moodModal.classList.add("hidden");

  // Show form modal
  formModal.classList.remove("hidden");
  formTitleEl.innerText = mood === "love" ? "You picked ❤️! WHO CAME TO MIND?" : "You picked 🍿! WHO CAME TO MIND?";
};

// ---------------- SUBMIT FORM ----------------
window.submitTeahug = () => {
  const name = userNameEl.value.trim();
  const phone = userWhatsappEl.value.trim();

  if (!name || !phone) return alert("Please fill in all fields.");
  if (!selectedMood) return alert("Select a mood first.");

  const moodText = selectedMood === "love" ? "❤️ Love" : "🍿 Popcorn";

  const message = `
Teahug Surprise 💛

Song: ${selectedSongTitle}
Mood: ${moodText}
For: ${name}

(Paste this in WhatsApp)
  `;

  navigator.clipboard.writeText(message)
    .then(() => {
      window.open("https://wa.me/message/WU7FM2NLOXI6P1", "_blank");
      alert("Message copied! Paste it in WhatsApp.");
      formModal.classList.add("hidden");
      userNameEl.value = "";
      userWhatsappEl.value = "";
      selectedMood = "";
    });
};

// ---------------- COUNTDOWN ----------------
function updateCountdown() {
  const now = new Date();
  const hour = now.getHours();

  // PRE-HUG: before 7 PM
  if (hour < 19) {
    preHugSection.style.display = "flex";
    hugHourTopCountdown.classList.add("hidden");
    songFeed.style.display = "none";
    introPopup.classList.add("hidden");

    const target = new Date();
    target.setHours(19,0,0,0);
    const diff = target - now;
    const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
    const m = String(Math.floor(diff / 60000 % 60)).padStart(2, "0");
    const s = String(Math.floor(diff / 1000 % 60)).padStart(2, "0");
    preHugCountdown.textContent = `${h} : ${m} : ${s}`;
  }
  // HUG HOUR: 7 PM - 10 PM
  else if (hour >= 19 && hour < 22) {
    preHugSection.style.display = "none";
    hugHourTopCountdown.classList.remove("hidden");
    songFeed.style.display = "flex";

    const target = new Date();
    target.setHours(22,0,0,0);
    const diff = target - now;
    const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
    const m = String(Math.floor(diff / 60000 % 60)).padStart(2, "0");
    const s = String(Math.floor(diff / 1000 % 60)).padStart(2, "0");
    hugHourTimer.textContent = `${h} : ${m} : ${s}`;

    if (h === "03" && m === "00" && s === "00") showIntroPopup();
  }
  // POST-HUG: after 10 PM
  else {
    preHugSection.style.display = "flex";
    hugHourTopCountdown.classList.add("hidden");
    songFeed.style.display = "none";

    const target = new Date();
    target.setDate(target.getDate()+1);
    target.setHours(19,0,0,0);
    const diff = target - now;
    const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
    const m = String(Math.floor(diff / 60000 % 60)).padStart(2, "0");
    const s = String(Math.floor(diff / 1000 % 60)).padStart(2, "0");
    preHugCountdown.textContent = `${h} : ${m} : ${s}`;
  }
}

// ---------------- START ----------------
loadSongs();
updateCountdown();
setInterval(updateCountdown, 1000);
