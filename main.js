import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

/* DOM */
const songFeed = document.getElementById("songFeed");
const introPopup = document.getElementById("introPopup");
const preHugSection = document.getElementById("preHugSection");
const preHugCountdown = document.getElementById("preHugCountdown");
const hugHourTopCountdown = document.getElementById("hugHourTopCountdown");
const hugHourTimer = document.getElementById("hugHourTimer");

const moodModal = document.getElementById("moodModal");
const formModal = document.getElementById("formModal");
let selectedMood = "";
let selectedSongTitle = "";

let allSongs = [];
let currentAudio = null;

/* ----------------- Popups ----------------- */
function showIntroPopup() {
  introPopup.classList.remove("hidden");
  setTimeout(() => introPopup.classList.add("hidden"), 10000);
}

/* ----------------- Load Songs ----------------- */
async function loadSongs() {
  try {
    const snapshot = await getDocs(collection(db, "songs"));
    allSongs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (!allSongs.length) throw new Error("No songs found");
    buildFeed();
  } catch (err) {
    console.error(err);
    songFeed.innerHTML = "<p style='text-align:center; margin-top:20px;'>Failed to load songs</p>";
  }
}

/* ----------------- Build Feed ----------------- */
function buildFeed() {
  songFeed.innerHTML = "";

  allSongs.forEach((song) => {
    const card = document.createElement("div");
    card.classList.add("song-card");
    card.innerHTML = `
      <img src="${song.coverURL}" class="song-img">
      <div class="play-overlay">▶</div>
      <button class="sendBtn">Select</button>
    `;
    songFeed.appendChild(card);

    const playOverlay = card.querySelector(".play-overlay");
    const selectBtn = card.querySelector(".sendBtn");

    // Play/Pause song
    playOverlay.addEventListener("click", () => {
      if (!currentAudio) currentAudio = new Audio(song.songURL);
      if (currentAudio.src !== song.songURL) {
        currentAudio.pause();
        currentAudio = new Audio(song.songURL);
      }
      if (currentAudio.paused) {
        currentAudio.play();
        playOverlay.style.display = "none";
      } else {
        currentAudio.pause();
        playOverlay.style.display = "block";
      }
    });

    // Select button - show mood modal
    selectBtn.addEventListener("click", () => {
      selectedSongTitle = song.title;
      document.getElementById("selectedSongTitle").innerText = selectedSongTitle;
      moodModal.classList.remove("hidden");
    });
  });

  // Auto-play and infinite scroll
  const cards = document.querySelectorAll(".song-card");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const index = Array.from(cards).indexOf(entry.target);
        const song = allSongs[index % allSongs.length]; // wrap around
        if (currentAudio) currentAudio.pause();
        currentAudio = new Audio(song.songURL);
        currentAudio.play();

        // hide all overlays
        document.querySelectorAll(".play-overlay").forEach(p => p.style.display = "block");
        entry.target.querySelector(".play-overlay").style.display = "none";
      }
    });
  }, { threshold: 0.7 });

  cards.forEach(card => observer.observe(card));
}

/* ----------------- Mood & Form ----------------- */
window.selectMood = (mood) => {
  selectedMood = mood;
  moodModal.classList.add("hidden");
  formModal.classList.remove("hidden");

  const title = document.getElementById("formTitle");
  title.innerText = mood === "love" ? "You picked ❤️!\nWHO CAME TO MIND?" : "You picked 🍿!\nWHO CAME TO MIND?";
};

window.closeForm = () => formModal.classList.add("hidden");

window.submitTeahug = () => {
  const name = document.getElementById("userName").value.trim();
  const phone = document.getElementById("userWhatsapp").value.trim();
  if (!name || !phone) return alert("Fill all fields");

  const moodText = selectedMood === "love" ? "❤️ Love" : "🍿 Popcorn";
  const message = `Teahug Surprise 💛\nSong: ${selectedSongTitle}\nMood: ${moodText}\nFor: ${name}`;

  const encoded = encodeURIComponent(message);
  const whatsappNumber = "2348056882601";
  window.location.href = `https://wa.me/${whatsappNumber}?text=${encoded}`;
  formModal.classList.add("hidden");
};

/* ----------------- Countdown ----------------- */
function updateCountdown() {
  const now = new Date();
  const hour = now.getHours();

  if (hour < 19) { // pre-hug
    preHugSection.style.display = "flex";
    hugHourTopCountdown.classList.add("hidden");
    songFeed.style.display = "none";
    const target = new Date();
    target.setHours(19,0,0,0);
    const diff = target-now;
    const h = String(Math.floor(diff/(1000*60*60))).padStart(2,"0");
    const m = String(Math.floor((diff/(1000*60))%60)).padStart(2,"0");
    const s = String(Math.floor((diff/1000)%60)).padStart(2,"0");
    preHugCountdown.textContent = `${h} : ${m} : ${s}`;
  } else if (hour >= 19 && hour < 22) { // hug hour
    preHugSection.style.display = "none";
    hugHourTopCountdown.classList.remove("hidden");
    songFeed.style.display = "block";
    const target = new Date();
    target.setHours(22,0,0,0);
    const diff = target-now;
    const h = String(Math.floor(diff/(1000*60*60))).padStart(2,"0");
    const m = String(Math.floor((diff/(1000*60))%60)).padStart(2,"0");
    const s = String(Math.floor((diff/1000)%60)).padStart(2,"0");
    hugHourTimer.textContent = `${h} : ${m} : ${s}`;
  } else { // post-hug
    preHugSection.style.display = "flex";
    hugHourTopCountdown.classList.add("hidden");
    songFeed.style.display = "none";
  }
}

/* ----------------- Init ----------------- */
loadSongs();
updateCountdown();
setInterval(updateCountdown, 1000);
