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

/* Modals */
let selectedMood = "";
let selectedSongTitle = "";
const moodModal = document.getElementById("moodModal");
const formModal = document.getElementById("formModal");

/* State */
let allSongs = [];
let currentAudio = null;
let currentIndex = 0;

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

  // Duplicate first and last for smooth infinite
  const loopSongs = [allSongs[allSongs.length-1], ...allSongs, allSongs[0]];

  loopSongs.forEach((song, idx) => {
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

    /* Play/Pause */
    playOverlay.addEventListener("click", () => {
      if (!currentAudio) currentAudio = new Audio(song.songURL);
      if (currentAudio.src !== song.songURL) { currentAudio.pause(); currentAudio = new Audio(song.songURL); }

      if (currentAudio.paused) { currentAudio.play(); playOverlay.style.display="none"; }
      else { currentAudio.pause(); playOverlay.style.display="block"; }
    });

    /* Select Button */
    selectBtn.addEventListener("click", () => {
      selectedSongTitle = song.title;
      document.getElementById("selectedSongTitle").innerText = selectedSongTitle;

      // Show fullscreen mood modal
      moodModal.classList.remove("hidden");
      moodModal.style.display = "flex";
      startMoodTimer();
    });
  });

  /* Intersection Observer for auto-play and infinite scroll */
  const cards = document.querySelectorAll(".song-card");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const index = Array.from(cards).indexOf(entry.target);
        let song = loopSongs[index];
        if (currentAudio) currentAudio.pause();
        currentAudio = new Audio(song.songURL);
        currentAudio.play();

        // Hide all overlays
        document.querySelectorAll(".play-overlay").forEach(p => p.style.display="block");
        entry.target.querySelector(".play-overlay").style.display="none";

        // Infinite scroll
        if (index === 0) songFeed.scrollTop = cards[cards.length-2].offsetTop;
        if (index === cards.length-1) songFeed.scrollTop = cards[1].offsetTop;
      }
    });
  }, { threshold: 0.7 });

  cards.forEach(card => observer.observe(card));
}

/* ----------------- Mood & Form ----------------- */
window.selectMood = (mood) => {
  selectedMood = mood;
  moodModal.classList.add("hidden");
  moodModal.style.display = "none";

  formModal.classList.remove("hidden");
  const title = document.getElementById("formTitle");
  title.innerText = mood === "love" ? "You picked ❤️!\nWHO CAME TO MIND?" : "You picked 🍿!\nWHO CAME TO MIND?";
};

window.closeMood = () => {
  moodModal.classList.add("hidden");
  moodModal.style.display = "none";
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

/* ----------------- Mood Timer ----------------- */
function startMoodTimer(){
  const el = document.getElementById("moodTimer");

  function update(){
    const now = new Date();
    const target = new Date();
    target.setHours(22,0,0,0);

    const diff = target - now;
    if(diff <= 0){
      el.textContent = "00:00";
      return;
    }

    const m = String(Math.floor((diff/(1000*60))%60)).padStart(2,"0");
    const s = String(Math.floor((diff/1000)%60)).padStart(2,"0");

    el.textContent = `${m}:${s}`;
  }

  update();
  setInterval(update,1000);
}

/* ----------------- Countdown ----------------- */
function updateCountdown() {
  const now = new Date();
  const hour = now.getHours();

  if (hour < 19) { // pre-hug
    preHugSection.style.display="flex";
    hugHourTopCountdown.classList.add("hidden");
    songFeed.style.display="none";

    let target = new Date(); target.setHours(19,0,0,0);
    const diff = target-now;
    const h = String(Math.floor(diff/(1000*60*60))).padStart(2,"0");
    const m = String(Math.floor((diff/(1000*60))%60)).padStart(2,"0");
    const s = String(Math.floor((diff/1000)%60)).padStart(2,"0");
    preHugCountdown.textContent = `${h} : ${m} : ${s}`;
  } else if (hour>=19 && hour<22) { // hug hour
    preHugSection.style.display="none";
    hugHourTopCountdown.classList.remove("hidden");
    songFeed.style.display="block";

    let target = new Date(); target.setHours(22,0,0,0);
    const diff = target-now;
    const h = String(Math.floor(diff/(1000*60*60))).padStart(2,"0");
    const m = String(Math.floor((diff/(1000*60))%60)).padStart(2,"0");
    const s = String(Math.floor((diff/1000)%60)).padStart(2,"0");
    hugHourTimer.textContent = `${h} : ${m} : ${s}`;

    if (h==="03" && m==="00" && s==="00") showIntroPopup();
  } else { // post-hug
    preHugSection.style.display="flex";
    hugHourTopCountdown.classList.add("hidden");
    songFeed.style.display="none";

    let target = new Date(); target.setDate(target.getDate()+1);
    target.setHours(19,0,0,0);
    const diff = target-now;
    const h = String(Math.floor(diff/(1000*60*60))).padStart(2,"0");
    const m = String(Math.floor((diff/(1000*60))%60)).padStart(2,"0");
    const s = String(Math.floor((diff/1000)%60)).padStart(2,"0");
    preHugCountdown.textContent = `${h} : ${m} : ${s}`;
  }
}

/* ----------------- Init ----------------- */
loadSongs();
updateCountdown();
setInterval(updateCountdown, 1000);
