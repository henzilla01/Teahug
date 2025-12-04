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
const userMsgInput = document.getElementById("userMessage");
const sendMsgBtn = document.getElementById("sendMsgBtn");

let allSongs = [];
let currentIndex = 0;
let songElements = [];
let audioPlayers = [];

// Close message popup
window.closeMessageForm = function() {
    messagePopup.classList.add("hidden");
};

// Load songs
async function loadSongs() {
    const snapshot = await getDocs(collection(db, "songs"));
    allSongs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    buildFeed();
}

// Build feed
function buildFeed() {
    songFeed.innerHTML = "";
    songElements = [];
    audioPlayers = [];

    const loopSongs = [allSongs[allSongs.length-1], ...allSongs, allSongs[0]];

    loopSongs.forEach((song, index) => {
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

        // Send button
        card.querySelector(".sendBtn").onclick = e => {
            e.stopPropagation();
            openMessageForm(song);
        };

        // Tap to play/pause
        const playOverlay = card.querySelector(".play-overlay");
        card.addEventListener("click", () => {
            if(audio.paused) { audio.play(); playOverlay.style.display="none"; }
            else { audio.pause(); playOverlay.style.display="block"; }
        });

        songFeed.appendChild(card);
    });

    songFeed.scrollTop = window.innerHeight;
    enableInfiniteScroll();
}

function enableInfiniteScroll() {
    songFeed.addEventListener("scroll", () => {
        const scrollIndex = Math.round(songFeed.scrollTop / window.innerHeight);
        if(scrollIndex===0) songFeed.scrollTop = allSongs.length*window.innerHeight;
        else if(scrollIndex===songElements.length-1) songFeed.scrollTop = window.innerHeight;
        currentIndex = scrollIndex-1;
        stopAll();
        audioPlayers[scrollIndex]?.play();
    });
}

function stopAll() { audioPlayers.forEach(a=>{a.pause();a.currentTime=0;}); }

function openMessageForm(song) {
    songTitleEl.textContent = song.title;
    messagePopup.classList.remove("hidden");
    sendMsgBtn.onclick = () => sendViaWhatsApp(song);
}

function sendViaWhatsApp(song) {
    const message = userMsgInput.value.trim();
    if(!message) return alert("Please type a message.");
    const fullMessage = `🎵 ${song.title}\n\n${message}\n\nSong link: ${window.location.origin}/?song=${song.id}`;
    navigator.clipboard.writeText(fullMessage).then(()=>{
        window.open("https://wa.me/message/WU7FM2NLOXI6P1","_blank");
        alert("Message copied! Paste it in WhatsApp to send.");
        messagePopup.classList.add("hidden");
        userMsgInput.value="";
    }).catch(err=>{alert("Failed to copy message."); console.error(err);});
}

// ======================
// Hug Hour Countdown
// ======================
// ======================
// Hug Hour Timer Controller
// ======================
function updateTimers() {
    const now = new Date();

    const hugStart = new Date();
    hugStart.setHours(19, 0, 0, 0); // 7 PM
    const hugEnd = new Date();
    hugEnd.setHours(22, 0, 0, 0);   // 10 PM

    const preHugSection = document.getElementById("preHugSection");
    const preHugCountdown = document.getElementById("preHugCountdown");
    const hugTop = document.getElementById("hugHourTopCountdown");
    const hugTopTimer = document.getElementById("hugCountdownTop");

    if (now >= hugStart && now < hugEnd) {
        // During Hug Hour → show top timer only
        preHugSection.classList.add("hidden");
        hugTop.classList.remove("hidden");

        const diff = hugEnd - now;
        const h = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
        const m = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, "0");
        const s = String(Math.floor((diff / 1000) % 60)).padStart(2, "0");
        hugTopTimer.textContent = `${h} : ${m} : ${s}`;
    } else {
        // Before Hug Hour → show fullscreen timer only
        hugTop.classList.add("hidden");
        preHugSection.classList.remove("hidden");

        // If past today's Hug End, countdown to next day
        if (now >= hugEnd) hugStart.setDate(hugStart.getDate() + 1);

        const diff = hugStart - now;
        const h = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
        const m = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, "0");
        const s = String(Math.floor((diff / 1000) % 60)).padStart(2, "0");
        preHugCountdown.textContent = `${h} : ${m} : ${s}`;
    }
}

// Update every second
setInterval(updateTimers, 1000);
updateTimers(); // run immediately
// Update every second
setInterval(hugHourCountdown,1000);
hugHourCountdown();

// Start everything
loadSongs();

