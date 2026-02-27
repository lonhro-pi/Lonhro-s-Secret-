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
  ctx.fillStyle = '#00FF41';
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

// Enter app
function enterApp(melbourne = false) {
  document.getElementById('splash').classList.remove('active');
  document.getElementById('feed').classList.add('active');
  document.querySelector('.tab[data-screen="feed"]').classList.add('active');
  // could set localStorage 'location' = 'Melbourne' if melbourne=true
}

// Fake swipe deck init
function initSwipeDeck() {
  const deck = document.getElementById('swipe-deck');
  deck.innerHTML = `
    <div class="swipe-card">
      <video autoplay loop muted playsinline style="width:100%;height:72%;object-fit:cover;">
        <source src="https://via.placeholder.com/400x500.mp4" type="video/mp4">
      </video>
      <div style="padding:20px;">
        <div style="color:var(--cerise);font-size:1.6rem;">Down to get rooted raw</div>
        <div style="color:#ccc;font-size:1.3rem;">carpark / motel / public – tweaked and dripping</div>
      </div>
    </div>`;
}
setTimeout(initSwipeDeck, 600);

// Basic swipe detection (touch only)
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
        // respawn next card
        setTimeout(initSwipeDeck, 300);
      }, 700);
    }
  }
});