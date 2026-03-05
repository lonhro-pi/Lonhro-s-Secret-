// script.js
import { db, storage, rtdb, anonId, serverTimestamp, Timestamp } from './firebase.js';
import { collection, addDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";
import { ref as dbRef, push, onValue } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

// Matrix rain
const canvas = document.getElementById('matrix');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン★☆†‡§¶∆∇∑∫∏∞■□◆◇○◎●★'.split('');
const fontSize = 16;
const columns = canvas.width / fontSize;
let drops = Array(Math.floor(columns)).fill(1);

function drawMatrix() {
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#00CC66';
  ctx.font = fontSize + 'px monospace';

  drops.forEach((y, i) => {
    const text = chars[Math.floor(Math.random() * chars.length)];
    const x = i * fontSize;
    ctx.fillText(text, x, y * fontSize);
    if (y * fontSize > canvas.height && Math.random() > 0.97) drops[i] = 0;
    drops[i]++;
  });
}
setInterval(drawMatrix, 35);

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drops = Array(Math.floor(canvas.width / fontSize)).fill(1);
});

// Screen navigation
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const screenId = tab.dataset.screen;
    document.getElementById(screenId).classList.add('active');
    tab.classList.add('active');
  });
});

// Enter app anon
function enterAppAnon() {
  document.getElementById('splash').classList.remove('active');
  document.getElementById('feed').classList.add('active');
  document.querySelector('.tab[data-screen="feed"]').classList.add('active');
  listenToPublicFeed();
  listenToPNP(); // if implemented
}

// Media upload – public porn
const uploadInput = document.createElement('input');
uploadInput.type = 'file';
uploadInput.accept = 'image/*,video/*';
uploadInput.multiple = true;
uploadInput.style.display = 'none';
document.body.appendChild(uploadInput);

document.querySelector('.profile-pic').addEventListener('click', () => {
  uploadInput.click();
});

uploadInput.addEventListener('change', async e => {
  const files = e.target.files;
  if (!files.length) return;

  for (const file of files) {
    const storageRef = ref(storage, `publicPorn/${anonId}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      snapshot => {},
      error => console.error(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        console.log("Public porn uploaded:", url);
        // Optionally post to feed with mediaUrl: url
      }
    );
  }
});

// Public feed listener
function listenToPublicFeed() {
  const q = query(collection(db, "publicRoots"), orderBy("createdAt", "desc"));
  onSnapshot(q, snap => {
    const container = document.querySelector('.feed-container');
    container.innerHTML = '';
    snap.forEach(d => {
      const data = d.data();
      const card = document.createElement('div');
      card.className = 'card';

      let countdown = "";
      if (data.expireAt) {
        const expires = data.expireAt.toMillis();
        const remainingMs = expires - Date.now();
        if (remainingMs > 0) {
          const hoursLeft = Math.floor(remainingMs / (1000 * 60 * 60));
          const minsLeft = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
          countdown = `<div style="color:#B22222; font-size:1.1rem; margin-top:8px;">Expires in ${hoursLeft}h ${minsLeft}m</div>`;
        } else {
          countdown = `<div style="color:#B22222;">Already self-destructing...</div>`;
        }
      }

      card.innerHTML = `
        <div class="media-placeholder" style="background-image:url(${data.mediaUrl || 'https://via.placeholder.com/400x320/000/C71585?text=RAW+PORN'})"></div>
        <div class="card-info">
          <div class="card-title">${data.title || 'Anonymous wants root NOW'}</div>
          <div class="card-desc">${data.text || 'slammed cunt open, come pump & dump – CBD'}</div>
          <div style="color:var(--accent-cyan); font-size:1.1rem; margin-top:8px;">${data.anonId || 'anon'}</div>
          ${countdown}
        </div>`;
      container.appendChild(card);
    });
  });
}

// Anon quick-post with auto-destruct
document.getElementById('anon-post-btn').addEventListener('click', async () => {
  const text = prompt("Drop your filth (what you're offering, location, kinks):") || "";
  const title = prompt("Quick title (e.g. 'tweaker bottom slammed & open – CBD')") || "Anonymous root offer";
  
  const hours = prompt("How many hours until this post self-destructs? (default 24, min 1, max 72)", "24");
  const lifetimeHours = Math.min(Math.max(parseInt(hours) || 24, 1), 72);
  
  const expireAt = Timestamp.fromMillis(Date.now() + lifetimeHours * 60 * 60 * 1000);

  try {
    await addDoc(collection(db, "publicRoots"), {
      title,
      text,
      anonId,
      createdAt: serverTimestamp(),
      expireAt,
      mediaUrl: ""
    });
    alert(`Post live — self-destructs in ~${lifetimeHours} hours`);
  } catch (err) {
    console.error("Post failed", err);
  }
});

// Fake swipe deck init
function initSwipeDeck() {
  const deck = document.getElementById('swipe-deck');
  deck.innerHTML = `
    <div class="swipe-card">
      <video autoplay loop muted playsinline style="width:100%;height:72%;object-fit:cover;">
        <source src="https://via.placeholder.com/400x500.mp4" type="video/mp4">
      </video>
      <div style="padding:20px;">
        <div style="color:var(--deeppink);font-size:1.6rem;">Down to get rooted raw</div>
        <div style="color:#ccc;font-size:1.3rem;">carpark / motel / public – tweaked and dripping</div>
      </div>
    </div>`;
}
setTimeout(initSwipeDeck, 600);

// Basic swipe detection
let touchStartX = 0;
document.getElementById('swipe-deck').addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
});
document.getElementById('swipe-deck').addEventListener('touchend', e => {
  const diff = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(diff) > 100) {
    const card = document.querySelector('.swipe-card');
    if (card) {
      card.style.transition = 'transform 0.7s ease-out';
      card.style.transform = `translateX(${diff > 0 ? '150%' : '-150%'}) rotate(${diff > 0 ? 25 : -25}deg)`;
      setTimeout(() => {
        card.remove();
        if (diff > 0) {
          // Match → open chat
          document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
          document.getElementById('chat').classList.add('active');
        }
        setTimeout(initSwipeDeck, 300);
      }, 700);
    }
  }
});