const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const navigationAnchors = [...document.querySelectorAll('.nav-links a[href^="#"]')];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const heroSection = document.querySelector("#top");
const flowerFrame = document.querySelector(".flower-backdrop__frame");
const ticker = document.querySelector(".ticker");
const flowerBackdrop = document.querySelector("#flower-backdrop");
const flowerLayers = [...flowerBackdrop.querySelectorAll("[data-bloom-layer]")];
const bloomStages = Array.from(
  { length: 12 },
  (_, index) => `assets/bloom-stage-${String(index + 1).padStart(2, "0")}.webp`,
);
const ambientTones = [
  [16, 16, 15],
  [25, 23, 20],
  [23, 30, 23],
  [25, 23, 20],
  [16, 16, 15],
];
let bloomReady = false;
let bloomStagesLoaded = false;
let bloomLoadPromise = null;
let scrollUpdateFrame = null;

function ambientToneAt(progress) {
  const position = progress * (ambientTones.length - 1);
  const startIndex = Math.floor(position);
  const endIndex = Math.min(startIndex + 1, ambientTones.length - 1);
  const blend = position - startIndex;
  const channels = ambientTones[startIndex].map((channel, index) =>
    Math.round(channel + (ambientTones[endIndex][index] - channel) * blend),
  );
  return `rgb(${channels.join(" ")})`;
}

function clampProgress(value) {
  return Math.max(0, Math.min(1, value));
}

function pointOnBezier(progress, start, control1, control2, end) {
  const inverse = 1 - progress;
  const startWeight = inverse ** 3;
  const control1Weight = 3 * inverse ** 2 * progress;
  const control2Weight = 3 * inverse * progress ** 2;
  const endWeight = progress ** 3;
  return {
    x: start.x * startWeight + control1.x * control1Weight + control2.x * control2Weight + end.x * endWeight,
    y: start.y * startWeight + control1.y * control1Weight + control2.y * control2Weight + end.y * endWeight,
  };
}

function updateFlowerTravel(progress) {
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight;
  const frame = flowerFrame.getBoundingClientRect();
  const isMobile = viewportWidth <= 760;
  const headerHeight = document.querySelector(".site-header").getBoundingClientRect().height;
  const startArtworkCenterY = Math.max(headerHeight + 100, viewportHeight * 0.24);
  const start = {
    x: viewportWidth * 0.28,
    y: startArtworkCenterY - frame.height * 0.07,
  };
  const end = {
    x: Math.min(
      viewportWidth * (isMobile ? 0.56 : 0.88),
      viewportWidth - frame.width / 2 - 12,
    ),
    y: viewportHeight - frame.height / 2 - 20,
  };
  const verticalDistance = Math.max(1, end.y - start.y);
  const point = pointOnBezier(progress, start, {
    x: viewportWidth * (isMobile ? 0.82 : 0.88),
    y: start.y + verticalDistance * 0.25,
  }, {
    x: viewportWidth * (isMobile ? 0.18 : 0.12),
    y: start.y + verticalDistance * 0.75,
  }, end);

  flowerFrame.style.transform = `translate3d(${point.x - frame.width / 2}px, ${point.y - frame.height / 2}px, 0)`;
}

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Open navigation menu" : "Close navigation menu");
  navLinks.classList.toggle("is-open", !isOpen);
});

function closeNavigation() {
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
  navLinks.classList.remove("is-open");
}

navigationAnchors.forEach((anchor) => anchor.addEventListener("click", closeNavigation));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeNavigation();
});

const sections = [...document.querySelectorAll("main section[id]")];
if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navigationAnchors.forEach((anchor) => {
        if (anchor.getAttribute("href") === `#${entry.target.id}`) {
          anchor.setAttribute("aria-current", "location");
        } else {
          anchor.removeAttribute("aria-current");
        }
      });
    });
  }, { rootMargin: "-35% 0px -55% 0px" });
  sections.forEach((section) => sectionObserver.observe(section));
  const tickerObserver = new IntersectionObserver(([entry]) => {
    ticker.classList.toggle("is-visible", entry.isIntersecting);
  });
  tickerObserver.observe(ticker);
} else {
  ticker.classList.add("is-visible");
}

document.addEventListener("visibilitychange", () => {
  ticker.classList.toggle("is-paused", document.hidden);
});

function prepareBloomSequence() {
  if (bloomLoadPromise) return bloomLoadPromise;

  bloomLoadPromise = Promise.all(bloomStages.map((src) => new Promise((resolve, reject) => {
    const frame = new Image();
    frame.onload = () => resolve(frame);
    frame.onerror = () => reject(new Error(`Unable to load flower bloom frame: ${src}`));
    frame.src = src;
  }))).then(() => {
    bloomStagesLoaded = true;
    if (reducedMotion.matches) {
      showFullBloom();
      return;
    }
    bloomReady = true;
    scheduleBloomUpdate();
  }).catch((error) => {
    console.error("Flower bloom sequence could not be loaded; keeping the full-bloom image.", error);
    showFullBloom();
  });
  return bloomLoadPromise;
}

function showFullBloom() {
  const [primaryLayer, secondaryLayer] = flowerLayers;
  primaryLayer.src = "assets/flower-bloom.webp";
  primaryLayer.dataset.stage = "full";
  primaryLayer.classList.add("is-current");
  primaryLayer.style.opacity = "";
  secondaryLayer.removeAttribute("src");
  secondaryLayer.removeAttribute("data-stage");
  secondaryLayer.classList.remove("is-current");
  secondaryLayer.style.opacity = "0";
  bloomReady = false;
}

function setLayerStage(layer, stageIndex) {
  layer.src = bloomStages[stageIndex];
  layer.dataset.stage = String(stageIndex);
  layer.classList.remove("is-current");
}

function renderBloomAtScroll() {
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const heroBottom = heroSection.getBoundingClientRect().bottom + window.scrollY;
  const bloomStart = Math.min(heroBottom, maxScroll);
  const distanceAfterHero = Math.max(0, window.scrollY - bloomStart);
  const bloomRange = Math.max(0, maxScroll - bloomStart);
  const progress = bloomRange === 0 ? 0 : Math.min(1, distanceAfterHero / bloomRange);
  const travelProgress = reducedMotion.matches || maxScroll === 0
    ? 0
    : clampProgress(window.scrollY / maxScroll);
  const ambientProgress = reducedMotion.matches ? 0 : progress;
  document.documentElement.style.setProperty("--ambient-tone", ambientToneAt(ambientProgress));
  flowerBackdrop.style.opacity = String(reducedMotion.matches ? 0.42 : 0.52 - progress * 0.1);
  flowerBackdrop.style.filter = `brightness(${reducedMotion.matches ? 2.1 : 2.8 - progress * 0.7})`;
  updateFlowerTravel(travelProgress);

  if (!bloomReady || reducedMotion.matches) return;

  const stagePosition = progress * (bloomStages.length - 1);
  const currentStage = Math.min(Math.floor(stagePosition), bloomStages.length - 1);
  const nextStage = Math.min(currentStage + 1, bloomStages.length - 1);
  const blend = currentStage === nextStage ? 0 : stagePosition - currentStage;

  let currentLayer = flowerLayers.find((layer) => Number(layer.dataset.stage) === currentStage);
  let nextLayer = flowerLayers.find((layer) => Number(layer.dataset.stage) === nextStage);

  if (!currentLayer && !nextLayer) {
    setLayerStage(flowerLayers[0], currentStage);
    if (nextStage !== currentStage) setLayerStage(flowerLayers[1], nextStage);
  } else {
    if (!currentLayer) {
      currentLayer = flowerLayers.find((layer) => layer !== nextLayer);
      setLayerStage(currentLayer, currentStage);
    }
    if (nextStage !== currentStage && !nextLayer) {
      nextLayer = flowerLayers.find((layer) => layer !== currentLayer);
      setLayerStage(nextLayer, nextStage);
    }
  }

  flowerLayers.forEach((layer) => {
    const layerStage = Number(layer.dataset.stage);
    if (layerStage === currentStage) {
      layer.style.opacity = currentStage === nextStage ? "1" : String(1 - blend);
    } else {
      layer.style.opacity = layerStage === nextStage ? String(blend) : "0";
    }
  });
}

function scheduleBloomUpdate() {
  if (scrollUpdateFrame !== null) return;
  scrollUpdateFrame = window.requestAnimationFrame(() => {
    scrollUpdateFrame = null;
    renderBloomAtScroll();
  });
}

function handleMotionPreferenceChange(event) {
  if (event.matches) {
    showFullBloom();
    scheduleBloomUpdate();
    return;
  }
  prepareBloomSequence().then(() => {
    if (!reducedMotion.matches && bloomStagesLoaded) {
      bloomReady = true;
      scheduleBloomUpdate();
    }
  });
}

window.addEventListener("scroll", scheduleBloomUpdate, { passive: true });
window.addEventListener("resize", scheduleBloomUpdate);
window.addEventListener("load", scheduleBloomUpdate, { once: true });
window.addEventListener("pageshow", scheduleBloomUpdate);
reducedMotion.addEventListener("change", handleMotionPreferenceChange);
scheduleBloomUpdate();
if (reducedMotion.matches) showFullBloom();
else prepareBloomSequence();

const toolStories = {
  Claude: "Claude: AI-assisted research, planning, and prototyping.",
  GPT: "GPT: a copilot for exploring ideas and building useful work.",
  Codex: "Codex: an AI coding partner for working prototypes.",
  DeepSeek: "DeepSeek: another model in a practical, multi-model workflow.",
  n8n: "n8n: visual workflows that connect everyday tools.",
  Zapier: "Zapier: no-code automations for repetitive tasks.",
  "Apps Script": "Apps Script: custom automation in Google Workspace.",
  Python: "Python: a flexible tool for data handling and scripts.",
  ESP32: "ESP32: the board used in an aquaculture-monitoring project.",
  MATLAB: "MATLAB: engineering analysis and technical problem-solving.",
};

const toolCaption = document.querySelector("#tool-caption");
const toolBadges = [...document.querySelectorAll(".tool-badge")];
toolBadges.forEach((button) => {
  button.addEventListener("click", () => {
    toolBadges.forEach((badge) => badge.setAttribute("aria-pressed", String(badge === button)));
    toolCaption.textContent = toolStories[button.dataset.tool];
    toolCaption.classList.add("is-selected");
  });
});

document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    document.querySelectorAll(".filter-button").forEach((item) => {
      const selected = item === button;
      item.classList.toggle("is-active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    document.querySelectorAll(".project-card").forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.category !== filter;
    });
    scheduleBloomUpdate();
  });
});

document.querySelector("#contact-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const subject = encodeURIComponent(String(data.get("subject")).trim());
  const body = encodeURIComponent(
    `Name: ${String(data.get("name")).trim()}\nEmail: ${String(data.get("email")).trim()}\n\n${String(data.get("message")).trim()}`,
  );
  window.location.href = `mailto:narianhylekenneth@gmail.com?subject=${subject}&body=${body}`;
});

const localTime = document.querySelector("#local-time");
function updateLocalTime() {
  const time = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
  localTime.textContent = `BULACAN, PH · ${time} PHT`;
}
updateLocalTime();
window.setInterval(updateLocalTime, 60_000);

const isparkVideo = document.querySelector("#ispark-video");
const isparkVideoPlay = document.querySelector("#ispark-video-play");
const isparkVideoStatus = document.querySelector("#ispark-video-status");

isparkVideoPlay.addEventListener("click", () => {
  isparkVideoPlay.disabled = true;
  isparkVideoStatus.textContent = "Loading the prototype video.";
  if (!isparkVideo.getAttribute("src")) {
    isparkVideo.src = isparkVideo.dataset.src;
    isparkVideo.load();
  }
  isparkVideo.play().catch((error) => {
    console.error("The iSPARK prototype video could not be played.", error);
    isparkVideoStatus.textContent = "Playback could not start. Use the player controls to try again.";
    isparkVideoPlay.disabled = false;
  });
});

isparkVideo.addEventListener("playing", () => {
  isparkVideoStatus.textContent = "";
  isparkVideoPlay.hidden = true;
  isparkVideoPlay.disabled = false;
});

isparkVideo.addEventListener("ended", () => {
  isparkVideoPlay.hidden = false;
  isparkVideoPlay.disabled = false;
  isparkVideoPlay.setAttribute("aria-label", "Replay the supplied feeder assembly prototype video");
  isparkVideoPlay.querySelector("span").textContent = "Replay prototype";
});

isparkVideo.addEventListener("error", () => {
  isparkVideoStatus.textContent = "The prototype video could not be loaded. Check the media file and try again.";
  isparkVideoPlay.hidden = false;
  isparkVideoPlay.disabled = false;
});

const isparkImageOpen = document.querySelector("#ispark-image-open");
const isparkLightbox = document.querySelector("#ispark-lightbox");
const isparkLightboxClose = document.querySelector("#ispark-lightbox-close");

isparkImageOpen.addEventListener("click", () => {
  isparkLightbox.showModal();
});

isparkLightboxClose.addEventListener("click", () => {
  isparkLightbox.close();
});

isparkLightbox.addEventListener("click", (event) => {
  if (event.target === isparkLightbox) isparkLightbox.close();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isparkLightbox.open) {
    isparkLightbox.close();
  }
});
