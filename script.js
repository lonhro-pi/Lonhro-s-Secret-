const screens = [...document.querySelectorAll(".screen")];
const tabs = [...document.querySelectorAll(".tab")];
const feedContainer = document.querySelector(".feed-container");
const body = document.body;
const composerModal = document.getElementById("composer-modal");
const composerForm = document.getElementById("composer-form");
const composerTitle = document.getElementById("composer-post-title");
const composerLocation = document.getElementById("composer-post-location");
const composerText = document.getElementById("composer-post-text");
const composerExpiry = document.getElementById("composer-post-expiry");
const profilePicture = document.querySelector(".profile-pic");
const swipeDeck = document.getElementById("swipe-deck");
const uploadInput = document.createElement("input");
const anonId = getOrCreateAnonId();
const placeholderFeed = [
  {
    title: "Hosting tonight",
    text: "Clean modern card styling now makes live posts easier to scan at a glance.",
    location: "Footscray",
    anonId: "anon-demo",
    expiresInHours: 6
  },
  {
    title: "Inner city meetup",
    text: "Layout now uses softer surfaces, clearer spacing, and much better metadata presentation.",
    location: "CBD",
    anonId: "anon-preview",
    expiresInHours: 18
  }
];

const swipeProfiles = [
  {
    name: "Late night host",
    location: "Richmond",
    note: "Polished card layout, stronger hierarchy, and quick actions below.",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Weekend meetup",
    location: "Southbank",
    note: "Swipe transitions remain, but the visuals now feel like a current mobile app.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Private spot nearby",
    location: "St Kilda",
    note: "Cleaner content blocks and improved CTA placement create a stronger flow.",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80"
  }
];

let activeScreen = "splash";
let feedListenerAttached = false;
let feedListenerStarting = false;
let firebaseServicesPromise = null;
let swipeIndex = 0;
let touchStartX = 0;

uploadInput.type = "file";
uploadInput.accept = "image/*,video/*";
uploadInput.multiple = true;
uploadInput.hidden = true;
document.body.appendChild(uploadInput);

function getOrCreateAnonId() {
  const existingId = window.localStorage.getItem("lonhroAnonId");
  if (existingId) {
    return existingId;
  }

  const createdId = `anon_${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem("lonhroAnonId", createdId);
  return createdId;
}

async function loadFirebaseServices() {
  if (firebaseServicesPromise) {
    return firebaseServicesPromise;
  }

  firebaseServicesPromise = (async () => {
    try {
      const [
        firebaseModule,
        firestoreModule,
        storageModule
      ] = await Promise.all([
        import("./firebase.js"),
        import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"),
        import("https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js")
      ]);

      return {
        db: firebaseModule.db,
        storage: firebaseModule.storage,
        Timestamp: firebaseModule.Timestamp,
        serverTimestamp: firebaseModule.serverTimestamp,
        addDoc: firestoreModule.addDoc,
        collection: firestoreModule.collection,
        onSnapshot: firestoreModule.onSnapshot,
        orderBy: firestoreModule.orderBy,
        query: firestoreModule.query,
        getDownloadURL: storageModule.getDownloadURL,
        ref: storageModule.ref,
        uploadBytesResumable: storageModule.uploadBytesResumable
      };
    } catch (error) {
      console.error("Firebase bootstrap failed", error);
      firebaseServicesPromise = null;
      return null;
    }
  })();

  return firebaseServicesPromise;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setActiveScreen(screenId) {
  activeScreen = screenId;

  screens.forEach(screen => {
    screen.classList.toggle("active", screen.id === screenId);
  });

  tabs.forEach(tab => {
    const isMatch = tab.dataset.screen === screenId;
    tab.classList.toggle("active", isMatch);
    tab.setAttribute("aria-current", isMatch ? "page" : "false");
  });

  body.dataset.activeScreen = screenId;
  body.classList.toggle("state-splash", screenId === "splash");
  body.classList.toggle("state-app", screenId !== "splash");

  if (screenId !== "splash") {
    void ensureFeedListener();
  }
}

function openComposer() {
  composerModal.hidden = false;
  body.classList.add("modal-open");
  window.requestAnimationFrame(() => composerTitle.focus());
}

function closeComposer() {
  composerModal.hidden = true;
  body.classList.remove("modal-open");
}

function formatTimeRemaining(expireAt) {
  if (!expireAt) {
    return "No expiry";
  }

  const expires = typeof expireAt.toMillis === "function" ? expireAt.toMillis() : expireAt;
  const remainingMs = expires - Date.now();
  if (remainingMs <= 0) {
    return "Expiring now";
  }

  const totalMinutes = Math.floor(remainingMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m left`;
  }

  if (minutes === 0) {
    return `${hours}h left`;
  }

  return `${hours}h ${minutes}m left`;
}

function getMediaMarkup(mediaUrl, title) {
  const imageUrl = mediaUrl || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80";
  const safeTitle = escapeHtml(title);
  return `
    <div class="media-shell">
      <div class="media-placeholder" style="background-image:url('${imageUrl}')"></div>
      <div class="media-overlay">
        <span class="status-pill">Live post</span>
        <span>${safeTitle}</span>
      </div>
    </div>
  `;
}

function renderFeedCard(data = {}) {
  const title = data.title || "Anonymous post";
  const description = data.text || "No description added yet.";
  const location = data.location || "Melbourne";
  const author = data.anonId || "anon";
  const expiryText = formatTimeRemaining(data.expireAt);

  return `
    <article class="card">
      ${getMediaMarkup(data.mediaUrl, title)}
      <div class="card-info">
        <div class="card-meta">
          <span class="status-pill">${escapeHtml(location)}</span>
          <span class="countdown">${escapeHtml(expiryText)}</span>
        </div>
        <h3 class="card-title">${escapeHtml(title)}</h3>
        <p class="card-desc">${escapeHtml(description)}</p>
        <div class="card-footer">
          <span class="card-author">${escapeHtml(author)}</span>
          <button class="ghost-button ghost-button--small" type="button" data-screen-target="chat">Message</button>
        </div>
      </div>
    </article>
  `;
}

function renderPlaceholderFeed() {
  if (!feedContainer) {
    return;
  }

  feedContainer.innerHTML = placeholderFeed
    .map(item => {
      const expireAt = Date.now() + item.expiresInHours * 60 * 60 * 1000;
      return renderFeedCard({ ...item, expireAt });
    })
    .join("");
}

async function ensureFeedListener() {
  if (feedListenerAttached || feedListenerStarting) {
    return;
  }

  feedListenerStarting = true;
  const api = await loadFirebaseServices();

  if (!api || !feedContainer) {
    renderPlaceholderFeed();
    feedListenerStarting = false;
    return;
  }

  try {
    const q = api.query(api.collection(api.db, "publicRoots"), api.orderBy("createdAt", "desc"));

    api.onSnapshot(
      q,
      snap => {
        if (!snap.size) {
          renderPlaceholderFeed();
          return;
        }

        feedContainer.innerHTML = "";
        snap.forEach(docSnapshot => {
          const card = document.createElement("div");
          card.innerHTML = renderFeedCard(docSnapshot.data());
          feedContainer.appendChild(card.firstElementChild);
        });
      },
      error => {
        console.error("Feed listener failed", error);
        renderPlaceholderFeed();
        feedListenerAttached = false;
        feedListenerStarting = false;
      }
    );

    feedListenerAttached = true;
  } catch (error) {
    console.error("Feed boot failed", error);
    renderPlaceholderFeed();
  } finally {
    feedListenerStarting = false;
  }
}

async function publishQuickPost() {
  const title = composerTitle.value.trim() || "Anonymous post";
  const location = composerLocation.value.trim() || "Melbourne";
  const text = composerText.value.trim() || "Fresh post from anonymous mode.";
  const lifetimeHours = Math.min(Math.max(parseInt(composerExpiry.value, 10) || 24, 1), 72);
  const api = await loadFirebaseServices();
  const expireAt = api
    ? api.Timestamp.fromMillis(Date.now() + lifetimeHours * 60 * 60 * 1000)
    : Date.now() + lifetimeHours * 60 * 60 * 1000;

  try {
    if (!api) {
      throw new Error("Firebase unavailable");
    }

    await api.addDoc(api.collection(api.db, "publicRoots"), {
      title,
      location,
      text,
      anonId,
      createdAt: api.serverTimestamp(),
      expireAt,
      mediaUrl: ""
    });
  } catch (error) {
    console.error("Post failed", error);

    const fallbackCard = document.createElement("div");
    fallbackCard.innerHTML = renderFeedCard({
      title,
      location,
      text,
      anonId,
      expireAt
    });

    if (feedContainer) {
      feedContainer.prepend(fallbackCard.firstElementChild);
    }
  }
}

function setProfileImage(url) {
  profilePicture.style.backgroundImage = `linear-gradient(180deg, rgba(5, 10, 22, 0.1), rgba(5, 10, 22, 0.3)), url('${url}')`;
}

function initSwipeDeck() {
  if (!swipeDeck) {
    return;
  }

  const profile = swipeProfiles[swipeIndex % swipeProfiles.length];
  swipeDeck.innerHTML = `
    <article class="swipe-card">
      <div class="swipe-card-media" style="background-image:url('${profile.image}')">
        <span class="status-pill">Nearby</span>
      </div>
      <div class="swipe-card-content">
        <div class="swipe-card-title-row">
          <h3>${escapeHtml(profile.name)}</h3>
          <span class="chip is-active">${escapeHtml(profile.location)}</span>
        </div>
        <p class="swipe-card-copy">${escapeHtml(profile.note)}</p>
        <div class="swipe-tag-row">
          <span class="chip">Updated now</span>
          <span class="chip">Clean layout</span>
          <span class="chip">Fast actions</span>
        </div>
      </div>
    </article>
  `;
}

function handleSwipe(direction) {
  const card = swipeDeck?.querySelector(".swipe-card");
  if (!card) {
    return;
  }

  card.classList.add(direction === "right" ? "is-leaving-right" : "is-leaving-left");

  window.setTimeout(() => {
    swipeIndex += 1;
    initSwipeDeck();
    if (direction === "right") {
      setActiveScreen("chat");
    }
  }, 280);
}

document.getElementById("enter-app-btn").addEventListener("click", () => {
  setActiveScreen("feed");
});

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    setActiveScreen(tab.dataset.screen);
  });
});

document.addEventListener("click", event => {
  const screenTarget = event.target.closest("[data-screen-target]");
  if (screenTarget) {
    setActiveScreen(screenTarget.dataset.screenTarget);
  }

  if (event.target.closest("[data-close-modal]")) {
    closeComposer();
  }
});

document.getElementById("anon-post-btn").addEventListener("click", openComposer);
document.getElementById("composer-close-btn").addEventListener("click", closeComposer);

composerForm.addEventListener("submit", async event => {
  event.preventDefault();
  await publishQuickPost();
  composerForm.reset();
  composerExpiry.value = "24";
  closeComposer();
  setActiveScreen("feed");
});

profilePicture.addEventListener("click", () => {
  uploadInput.click();
});

uploadInput.addEventListener("change", async event => {
  const files = event.target.files;
  if (!files?.length) {
    return;
  }

  for (const file of files) {
    const localPreviewUrl = window.URL.createObjectURL(file);
    setProfileImage(localPreviewUrl);

    const api = await loadFirebaseServices();
    if (!api) {
      continue;
    }

    try {
      const storageRef = api.ref(api.storage, `publicPorn/${anonId}/${Date.now()}_${file.name}`);
      const uploadTask = api.uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        () => {},
        error => console.error("Upload failed", error),
        async () => {
          const url = await api.getDownloadURL(uploadTask.snapshot.ref);
          setProfileImage(url);
        }
      );
    } catch (error) {
      console.error("Storage boot failed", error);
    }
  }

  uploadInput.value = "";
});

swipeDeck.addEventListener("touchstart", event => {
  touchStartX = event.touches[0].clientX;
});

swipeDeck.addEventListener("touchend", event => {
  const diff = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(diff) > 80) {
    handleSwipe(diff > 0 ? "right" : "left");
  }
});

document.getElementById("swipe-pass-btn").addEventListener("click", () => handleSwipe("left"));
document.getElementById("swipe-like-btn").addEventListener("click", () => handleSwipe("right"));

window.addEventListener("keydown", event => {
  if (event.key === "Escape" && !composerModal.hidden) {
    closeComposer();
  }
});

renderPlaceholderFeed();
initSwipeDeck();
setActiveScreen("splash");