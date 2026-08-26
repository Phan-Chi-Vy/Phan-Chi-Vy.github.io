const BIRTH_DATE = new Date("2006-06-23T00:00:00+07:00");
const SIGNAL_FALLBACK_URL = "https://data-fetcher-p8pv.onrender.com/api/users";
const YOZORA_USER_ID = "428375195573551114";
const SIGNAL_REFRESH_INTERVAL_MS = 3000;
const revealAnimations = new WeakMap();
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointerQuery = window.matchMedia("(pointer: fine)");
let signalRefreshHandle = null;
let signalFetchInFlight = false;

const identityModes = {
  me: {
    label: "Swine Lord",
    icon: "👑",
    ariaLabel: "Switch to Alter Ego",
    line: "Chaotic developer / RLHF Bypass Specialist / degenerate gamer",
    caption: "Have you ever heard of a Schrödinger state? I'm one.",
    state: "Phan Chi Vy",
    reveal: 0
  },
  alter: {
    label: "Swine - Alter ego",
    icon: "🎀",
    ariaLabel: "Switch to Me",
    line: "Same mind / softer render / still dangerously curious",
    caption: "Observation changed the render, not the person.",
    state: "Hoshimiya Yozora",
    reveal: 100
  }
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function motionAllowed() {
  return !reducedMotionQuery.matches && typeof Element.prototype.animate === "function";
}

function playMotion(element, keyframes, options = {}) {
  if (!element || !motionAllowed()) return null;

  return element.animate(keyframes, {
    duration: 700,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    fill: "both",
    ...options
  });
}

function getIntegerAge() {
  const now = new Date();
  let age = now.getFullYear() - BIRTH_DATE.getFullYear();
  const birthdayThisYear = new Date(
    now.getFullYear(),
    BIRTH_DATE.getMonth(),
    BIRTH_DATE.getDate()
  );

  if (now < birthdayThisYear) age -= 1;
  return age;
}

function mountAgeCounters() {
  const update = () => {
    const age = getIntegerAge();
    $$("[data-age-counter], [data-age-integer]").forEach((element) => {
      element.textContent = age;
    });
  };

  update();
  window.setInterval(update, 60 * 60 * 1000);
}

function setLenticularReveal(card, reveal) {
  const value = Math.min(Math.max(reveal, 0), 100);
  card.style.setProperty("--reveal", `${value}%`);
  card.style.setProperty("--shine-x", `${value}%`);
  card.dataset.reveal = String(value);
}

function stopLenticularAnimation(card) {
  const animationFrame = revealAnimations.get(card);
  if (animationFrame) {
    window.cancelAnimationFrame(animationFrame);
    revealAnimations.delete(card);
  }
}

function animateLenticularReveal(card, target, duration = 680) {
  stopLenticularAnimation(card);

  const start = Number(card.dataset.reveal ?? 50);
  const end = Math.min(Math.max(target, 0), 100);

  if (start === end || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    setLenticularReveal(card, end);
    return;
  }

  const startedAt = performance.now();
  const tick = (now) => {
    const progress = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    setLenticularReveal(card, start + (end - start) * eased);

    if (progress < 1) {
      revealAnimations.set(card, window.requestAnimationFrame(tick));
    } else {
      revealAnimations.delete(card);
    }
  };

  revealAnimations.set(card, window.requestAnimationFrame(tick));
}

function animateIdentityFeedback(switchButton, modeIcon, modeLabel, statePill) {
  if (!motionAllowed()) return;

  playMotion(
    switchButton,
    [
      { transform: "scale(0.96)", boxShadow: "0 0 0 rgba(0, 0, 0, 0)" },
      { transform: "scale(1.03)", boxShadow: "0 0 28px rgba(var(--accent-rgb), 0.2)" },
      { transform: "scale(1)", boxShadow: "0 0 0 rgba(0, 0, 0, 0)" }
    ],
    { duration: 460 }
  );

  playMotion(
    modeIcon,
    [
      { opacity: 0, transform: "scale(0.35) rotate(-24deg)" },
      { opacity: 1, transform: "scale(1.18) rotate(8deg)", offset: 0.68 },
      { opacity: 1, transform: "scale(1) rotate(0deg)" }
    ],
    { duration: 520 }
  );

  playMotion(
    modeLabel,
    [
      { opacity: 0, transform: "translateX(-8px)" },
      { opacity: 1, transform: "translateX(0)" }
    ],
    { duration: 380, delay: 60 }
  );

  playMotion(
    statePill,
    [
      { opacity: 0, transform: "translateY(-6px)" },
      { opacity: 1, transform: "translateY(0)" }
    ],
    { duration: 420, delay: 110 }
  );
}

function mountCursorGlow() {
  if (!window.matchMedia("(pointer: fine)").matches) return;

  window.addEventListener(
    "pointermove",
    (event) => {
      document.documentElement.style.setProperty("--cursor-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--cursor-y", `${event.clientY}px`);
    },
    { passive: true }
  );
}

function mountLayoutDetection() {
  const mobileQuery = window.matchMedia(
    "(max-width: 800px), (pointer: coarse) and (max-width: 1100px)"
  );

  const applyLayout = () => {
    document.documentElement.dataset.layout = mobileQuery.matches
      ? "mobile"
      : "desktop";
  };

  applyLayout();
  mobileQuery.addEventListener("change", applyLayout);
}

function triggerHaptic(duration = 8) {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(duration);
    } catch {}
  }
}

function mountIdentityMode() {
  const switchButton = $("[data-mode-switch]");
  const lenticular = $("[data-lenticular]");
  const modeIcon = $(".mode-icon", switchButton);
  const modeLabel = $(".mode-label", switchButton);
  const identityLine = $("[data-identity-line]");
  const profileCaption = $("[data-profile-caption]");
  const statePill = $("[data-state-pill]");
  let savedMode = null;

  try {
    savedMode = localStorage.getItem("yozora-mode");
  } catch {
    savedMode = null;
  }

  let currentMode = savedMode === "alter" ? "alter" : "me";

  const applyMode = (modeName, animate = true) => {
    const mode = identityModes[modeName];
    currentMode = modeName;
    document.body.classList.toggle("alter-mode", modeName === "alter");
    switchButton.setAttribute("aria-pressed", String(modeName === "alter"));
    switchButton.setAttribute("aria-label", mode.ariaLabel);
    modeIcon.textContent = mode.icon;
    modeLabel.textContent = mode.label;
    identityLine.textContent = mode.line;
    profileCaption.textContent = mode.caption;
    statePill.textContent = mode.state;

    if (animate) {
      triggerHaptic(10);
      animateLenticularReveal(lenticular, mode.reveal);
      animateIdentityFeedback(switchButton, modeIcon, modeLabel, statePill);
    } else {
      setLenticularReveal(lenticular, mode.reveal);
    }

    try {
      localStorage.setItem("yozora-mode", modeName);
    } catch {
      // Local file storage is not guaranteed across browsers.
    }
  };

  switchButton.addEventListener("click", () => {
    applyMode(currentMode === "me" ? "alter" : "me");
  });

  window.__setIdentityMode = applyMode;
  window.__getIdentityMode = () => currentMode;

  applyMode(currentMode, false);
}

function mountLenticular() {
  const card = $("[data-lenticular]");
  if (!card) return;

  let isDragging = false;
  let lastSide = null;

  const updateFromPointer = (clientX, clientY = null) => {
    stopLenticularAnimation(card);
    const bounds = card.getBoundingClientRect();
    const x = Math.min(Math.max((clientX - bounds.left) / bounds.width, 0), 1);
    const y =
      clientY === null
        ? 0.5
        : Math.min(Math.max((clientY - bounds.top) / bounds.height, 0), 1);

    const revealVal = x * 100;
    setLenticularReveal(card, revealVal);
    card.style.setProperty("--tilt-x", `${(x - 0.5) * 8}deg`);
    card.style.setProperty("--tilt-y", `${(0.5 - y) * 6}deg`);

    // Crossing midpoint haptic click
    const currentSide = revealVal > 50 ? "alter" : "me";
    if (lastSide && lastSide !== currentSide && isDragging) {
      triggerHaptic(6);
    }
    lastSide = currentSide;

    // Dynamically glow pink when revealing female side, cyan when male
    if (revealVal > 50) {
      card.style.setProperty("--dynamic-accent", "#ff9bd8");
      card.style.setProperty("--dynamic-glow", "rgba(255, 155, 216, 0.8)");
    } else {
      card.style.setProperty("--dynamic-accent", "#8ce3ff");
      card.style.setProperty("--dynamic-glow", "rgba(140, 227, 255, 0.8)");
    }
  };

  card.addEventListener("pointerdown", (event) => {
    isDragging = true;
    lastSide = Number(card.dataset.reveal ?? 0) > 50 ? "alter" : "me";
    card.setPointerCapture(event.pointerId);
    updateFromPointer(event.clientX, event.clientY);
  });

  card.addEventListener("pointermove", (event) => {
    if (event.pointerType === "mouse" || isDragging) {
      updateFromPointer(event.clientX, event.clientY);
    }
  });

  const release = () => {
    isDragging = false;
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");

    const currentReveal = Number(card.dataset.reveal ?? 0);
    const activeMode = window.__getIdentityMode ? window.__getIdentityMode() : "me";

    // Auto-slide to whichever side holds the majority percentage (> 50%)
    const targetMode = currentReveal > 50 ? "alter" : "me";
    const targetReveal = targetMode === "alter" ? 100 : 0;

    if (window.__setIdentityMode && targetMode !== activeMode) {
      window.__setIdentityMode(targetMode, true);
    } else {
      animateLenticularReveal(card, targetReveal, 520);
    }
  };

  card.addEventListener("pointerup", release);
  card.addEventListener("pointercancel", release);
  card.addEventListener("pointerleave", release);
  window.addEventListener("blur", release);

  card.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    stopLenticularAnimation(card);
    const current = Number(card.dataset.reveal ?? 50);
    const next = event.key === "ArrowRight" ? current + 10 : current - 10;
    const reveal = Math.min(Math.max(next, 0), 100);
    setLenticularReveal(card, reveal);
  });

  card.addEventListener("keyup", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    const currentReveal = Number(card.dataset.reveal ?? 0);
    const targetMode = currentReveal > 50 ? "alter" : "me";
    if (window.__setIdentityMode) {
      window.__setIdentityMode(targetMode, true);
    }
  });
}

function formatDiscordActivity(activities, customStatusFallback) {
  if (!Array.isArray(activities) || activities.length === 0) {
    return customStatusFallback
      ? `“${customStatusFallback}”`
      : "“Guided by the wind, bound by no star, I claim only the horizon I forged.”";
  }

  // 1. Spotify / Music (type 2)
  const spotify = activities.find(
    (a) => a.type === 2 || a.name?.toLowerCase() === "spotify"
  );
  if (spotify) {
    const song = spotify.details || spotify.state;
    const artist = spotify.details && spotify.state ? ` · ${spotify.state}` : "";
    return `🎧 Listening to “${song}${artist}”`;
  }

  // 2. Gaming / Playing (type 0)
  const game = activities.find(
    (a) => a.type === 0 && a.name !== "Custom Status"
  );
  if (game) {
    const details = game.details ? ` (${game.details})` : "";
    return `🎮 Playing ${game.name}${details}`;
  }

  // 3. Streaming / Watching (type 1 or 3)
  const streamOrWatch = activities.find((a) => a.type === 1 || a.type === 3);
  if (streamOrWatch) {
    const verb = streamOrWatch.type === 1 ? "Streaming" : "Watching";
    const details = streamOrWatch.details ? `: ${streamOrWatch.details}` : "";
    return `📺 ${verb} ${streamOrWatch.name}${details}`;
  }

  // 4. Custom Status (type 4)
  const custom = activities.find(
    (a) => a.type === 4 || a.name === "Custom Status"
  );
  if (custom?.state || customStatusFallback) {
    return `“${custom?.state || customStatusFallback}”`;
  }

  return "“Guided by the wind, bound by no star, I claim only the horizon I forged.”";
}

function relativeTime(dateValue) {
  if (!dateValue) return "Updated recently";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Updated recently";

  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const intervals = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60]
  ];

  for (const [unit, size] of intervals) {
    if (Math.abs(seconds) >= size) {
      return `Updated ${formatter.format(Math.round(seconds / size), unit)}`;
    }
  }

  return "Updated just now";
}

async function fetchSignal(options = {}) {
  const { showLoading = true } = options;
  if (signalFetchInFlight) return;

  signalFetchInFlight = true;
  const status = $("[data-signal-status]");
  const statusDot = $("[data-signal-dot]");
  const avatar = $("[data-signal-avatar]");
  const name = $("[data-signal-name]");
  const nickname = $("[data-signal-nickname]");
  const message = $("[data-signal-message]");
  const updated = $("[data-signal-updated]");
  const refreshBtn = $("[data-refresh-signal]");

  if (showLoading) {
    status.className = "signal-status is-loading";
    status.innerHTML = "<i></i>Tuning in";
    if (refreshBtn) refreshBtn.classList.add("is-refreshing");
  }

  try {
    let response = null;
    let data;

    if (window.location.protocol !== "file:") {
      response = await fetch("./api/yozora", { cache: "no-store" });
    }

    if (
      response?.ok &&
      response.headers.get("content-type")?.includes("json")
    ) {
      data = await response.json();
    } else {
      response = await fetch(SIGNAL_FALLBACK_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(`Signal failed: ${response.status}`);

      const payload = await response.json();
      const users = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];
      const yozora = Array.isArray(users)
        ? users.find((user) => user.userId === YOZORA_USER_ID)
        : null;

      if (!yozora) throw new Error("Yozora was not found in the signal.");

      const customStatus = yozora.activities?.find(
        (activity) =>
          activity.type === 4 || activity.name === "Custom Status"
      );

      data = {
        avatarURL: yozora.avatarURL,
        username: yozora.username,
        nickname: yozora.nickname,
        status: yozora.status,
        customStatus: customStatus?.state || null,
        activities: yozora.activities || [],
        lastUpdated: yozora.lastUpdated
      };
    }

    const presence = ["online", "idle", "dnd"].includes(data.status)
      ? data.status
      : "offline";

    status.className = `signal-status is-${presence}`;
    status.innerHTML = `<i></i>${presence === "dnd" ? "Do not disturb" : presence}`;
    statusDot.className = `is-${presence}`;
    name.textContent = data.username || "kei_akashi.";

    // Show nickname and custom status if available
    const displayNick = data.nickname || "Yozora";
    nickname.textContent = displayNick;

    // Display rich activity (Spotify, Gaming, Streaming, Custom Status, or motto)
    message.textContent = formatDiscordActivity(data.activities, data.customStatus);
    updated.textContent = relativeTime(data.lastUpdated);

    if (data.avatarURL) {
      avatar.src = data.avatarURL;
    }
  } catch (error) {
    status.className = "signal-status";
    status.innerHTML = "<i></i>Signal lost";
    statusDot.className = "";
    nickname.textContent = "Local fallback active";
    message.textContent =
      "Probably gaming, coding, or committing crimes against CSS.";
    updated.textContent = "Discord presence unavailable";
  } finally {
    signalFetchInFlight = false;
    if (refreshBtn) refreshBtn.classList.remove("is-refreshing");
  }
}

function mountSignalAutoRefresh() {
  const stopSignalPolling = () => {
    if (!signalRefreshHandle) return;

    window.clearInterval(signalRefreshHandle);
    signalRefreshHandle = null;
  };

  const startSignalPolling = () => {
    if (signalRefreshHandle || document.visibilityState !== "visible") return;

    signalRefreshHandle = window.setInterval(() => {
      fetchSignal({ showLoading: false });
    }, SIGNAL_REFRESH_INTERVAL_MS);
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      stopSignalPolling();
      return;
    }

    fetchSignal({ showLoading: false });
    startSignalPolling();
  });

  startSignalPolling();
}

function mountContactModal() {
  const modal = $("[data-contact-modal]");
  const closeButton = $("[data-close-contact]");
  const feedback = $("[data-copy-feedback]");

  const open = () => {
    modal.showModal();
    document.body.classList.add("modal-open");

    if (motionAllowed()) {
      const modalItems = $$(
        ".section-kicker, h2, .modal-intro, .contact-link, .modal-more",
        modal
      );

      modalItems.forEach((element, index) => {
        playMotion(
          element,
          [
            { opacity: 0, transform: "translateY(12px)" },
            { opacity: 1, transform: "translateY(0)" }
          ],
          { duration: 480, delay: 70 + index * 48 }
        );
      });
    }
  };

  const close = () => {
    modal.close();
    document.body.classList.remove("modal-open");
    feedback.textContent = "";
  };

  $$("[data-open-contact]").forEach((button) => {
    button.addEventListener("click", open);
  });

  closeButton.addEventListener("click", close);
  modal.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
  });
  modal.addEventListener("click", (event) => {
    const bounds = modal.getBoundingClientRect();
    const outside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;
    if (outside) close();
  });

  let copyTimeout = null;
  $$("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        button.classList.add("is-copied");
        feedback.textContent = `✓ ${button.dataset.copyLabel} copied: ${button.dataset.copy}`;
        if (typeof navigator.vibrate === "function") navigator.vibrate(10);
        if (copyTimeout) clearTimeout(copyTimeout);
        copyTimeout = setTimeout(() => {
          button.classList.remove("is-copied");
          feedback.textContent = "";
        }, 3200);
      } catch {
        feedback.textContent = `Discord: ${button.dataset.copy}`;
      }
    });
  });
}

function mountPageMeta() {
  $$("[data-current-year]").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  $("[data-refresh-signal]")?.addEventListener("click", fetchSignal);
}

function mountHeroEntrance() {
  if (!motionAllowed()) return;

  const topbar = $(".topbar");
  const hero = $(".hero");
  const heroItems = $$(
    ".eyebrow, h1, .identity-line, .tagline, .age-line, .hero-actions",
    $(".hero-copy")
  );
  const profilePanel = $(".profile-panel");

  playMotion(
    topbar,
    [
      { opacity: 0, transform: "translateY(-18px)", filter: "blur(8px)" },
      { opacity: 1, transform: "translateY(0)", filter: "blur(0)" }
    ],
    { duration: 720 }
  );

  playMotion(
    hero,
    [
      { opacity: 0, transform: "translateY(22px) scale(0.985)" },
      { opacity: 1, transform: "translateY(0) scale(1)" }
    ],
    { duration: 920, delay: 90 }
  );

  heroItems.forEach((element, index) => {
    playMotion(
      element,
      [
        { opacity: 0, transform: "translateY(18px)", filter: "blur(5px)" },
        { opacity: 1, transform: "translateY(0)", filter: "blur(0)" }
      ],
      { duration: 680, delay: 250 + index * 85 }
    );
  });

  playMotion(
    profilePanel,
    [
      { opacity: 0, transform: "translateX(28px) rotateY(-4deg)" },
      { opacity: 1, transform: "translateX(0) rotateY(0)" }
    ],
    { duration: 900, delay: 390 }
  );

  playMotion(
    $(".brand-mark img"),
    [
      { opacity: 0, transform: "scale(0.35) rotate(-18deg)" },
      { opacity: 1, transform: "scale(1.14) rotate(6deg)", offset: 0.72 },
      { opacity: 1, transform: "scale(1) rotate(0)" }
    ],
    { duration: 760, delay: 130 }
  );
}

function mountScrollReveals() {
  if (!motionAllowed() || typeof IntersectionObserver !== "function") return;

  const groups = [
    { selector: ".section-heading", y: 28, stagger: 0 },
    { selector: ".project-card", y: 34, stagger: 90 },
    { selector: ".identity-grid .panel", y: 36, stagger: 120 },
    { selector: ".skills-copy", y: 28, stagger: 0 },
    { selector: ".skill-cloud span", y: 18, stagger: 42 },
    { selector: ".contact-banner", y: 34, stagger: 0 },
    { selector: ".footer > *", y: 18, stagger: 80 }
  ];

  const settings = new Map();
  const elements = [];

  groups.forEach((group) => {
    $$(group.selector).forEach((element, index) => {
      element.style.opacity = "0";
      element.style.transform = `translate3d(0, ${group.y}px, 0)`;
      element.style.willChange = "opacity, transform";
      settings.set(element, {
        delay: Math.min(index * group.stagger, 360),
        y: group.y
      });
      elements.push(element);
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const element = entry.target;
        const { delay, y } = settings.get(element);
        const animation = playMotion(
          element,
          [
            { opacity: 0, transform: `translate3d(0, ${y}px, 0)` },
            { opacity: 1, transform: "translate3d(0, 0, 0)" }
          ],
          { duration: 720, delay }
        );

        if (animation) {
          animation.addEventListener(
            "finish",
            () => {
              element.style.opacity = "";
              element.style.transform = "";
              element.style.willChange = "";
              animation.cancel();
            },
            { once: true }
          );
        }

        observer.unobserve(element);
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -7% 0px" }
  );

  elements.forEach((element) => observer.observe(element));
}

function mountHeroParallax() {
  if (!motionAllowed() || !finePointerQuery.matches) return;

  const hero = $(".hero");
  const heroArt = $(".hero-art");
  if (!hero || !heroArt) return;

  let frame = null;
  let pointerX = 0;
  let pointerY = 0;
  let scrollY = 0;

  const render = () => {
    heroArt.style.setProperty("--hero-pan-x", `${pointerX}px`);
    heroArt.style.setProperty("--hero-pan-y", `${pointerY}px`);
    heroArt.style.setProperty("--hero-scroll-y", `${scrollY}px`);
    frame = null;
  };

  const requestRender = () => {
    if (!frame) frame = window.requestAnimationFrame(render);
  };

  hero.addEventListener("pointermove", (event) => {
    const bounds = hero.getBoundingClientRect();
    pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * -13;
    pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * -9;
    requestRender();
  });

  hero.addEventListener("pointerleave", () => {
    pointerX = 0;
    pointerY = 0;
    requestRender();
  });

  window.addEventListener(
    "scroll",
    () => {
      const bounds = hero.getBoundingClientRect();
      if (bounds.bottom < 0 || bounds.top > window.innerHeight) return;
      scrollY = clamp(-bounds.top * 0.035, -8, 20);
      requestRender();
    },
    { passive: true }
  );
}

function mountProjectTilt() {
  if (!motionAllowed() || !finePointerQuery.matches) return;

  $$(".project-card").forEach((card) => {
    let frame = null;
    let latestEvent = null;

    const render = () => {
      if (!latestEvent) return;
      const bounds = card.getBoundingClientRect();
      const x = clamp((latestEvent.clientX - bounds.left) / bounds.width, 0, 1);
      const y = clamp((latestEvent.clientY - bounds.top) / bounds.height, 0, 1);

      card.style.setProperty("--card-tilt-x", `${(x - 0.5) * 7}deg`);
      card.style.setProperty("--card-tilt-y", `${(0.5 - y) * 7}deg`);
      card.style.setProperty("--card-glare-x", `${x * 100}%`);
      card.style.setProperty("--card-glare-y", `${y * 100}%`);
      card.style.setProperty("--card-glare-opacity", "1");
      frame = null;
    };

    const reset = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = null;
      latestEvent = null;
      card.style.setProperty("--card-tilt-x", "0deg");
      card.style.setProperty("--card-tilt-y", "0deg");
      card.style.setProperty("--card-glare-opacity", "0");
    };

    card.addEventListener("pointermove", (event) => {
      latestEvent = event;
      if (!frame) frame = window.requestAnimationFrame(render);
    });

    card.addEventListener("pointerleave", reset);
    card.addEventListener("pointercancel", reset);
    card.addEventListener("mouseleave", reset);
    window.addEventListener("blur", reset);
  });
}

function mountScrollProgress() {
  if (reducedMotionQuery.matches) return;

  const progress = document.createElement("div");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.prepend(progress);

  let frame = null;
  const update = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? clamp(window.scrollY / scrollable, 0, 1) : 0;
    progress.style.transform = `scaleX(${ratio})`;
    frame = null;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    },
    { passive: true }
  );

  update();
}

function mountActiveNavigation() {
  if (typeof IntersectionObserver !== "function") return;

  const links = new Map(
    $$(".desktop-nav a[href^='#']").map((link) => [
      link.getAttribute("href").slice(1),
      link
    ])
  );

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;
      links.forEach((link, id) => {
        link.classList.toggle("is-active", id === visible.target.id);
      });
    },
    { threshold: [0.25, 0.5, 0.75], rootMargin: "-20% 0px -55% 0px" }
  );

  links.forEach((link, id) => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
}

function mountProjectFilters() {
  const filterButtons = $$(".filter-btn");
  const projectCards = $$(".project-card");
  if (!filterButtons.length || !projectCards.length) return;

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      filterButtons.forEach((btn) => btn.classList.toggle("is-active", btn === button));

      projectCards.forEach((card, index) => {
        const category = card.dataset.category || "";
        const matches = filter === "all" || category.includes(filter);

        if (matches) {
          card.classList.remove("is-hidden");
          if (motionAllowed()) {
            playMotion(
              card,
              [
                { opacity: 0, transform: "scale(0.96) translateY(14px)" },
                { opacity: 1, transform: "scale(1) translateY(0)" }
              ],
              { duration: 420, delay: index * 35 }
            );
          }
        } else {
          card.classList.add("is-hidden");
        }
      });
    });
  });
}

async function fetchLiveGitHubStats() {
  const repos = [
    "Z0ra-AI/Zora.AI",
    "ChiVy2306/ProjectBeta",
    "ChiVy2306/RamNuker",
    "ChiVy2306/AI-evaluation-report-2026"
  ];

  const CACHE_KEY = "yozora_github_stats_v1";
  let cached = null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) cached = JSON.parse(raw);
  } catch {}

  const applyStats = (data) => {
    if (!data) return;
    Object.entries(data).forEach(([repo, stats]) => {
      if (stats.stars !== undefined) {
        $$(`[data-live-stars="${repo}"]`).forEach((el) => {
          el.textContent = stats.stars;
        });
      }
      if (stats.downloads !== undefined && stats.downloads > 0) {
        $$(`[data-live-dl="${repo}"]`).forEach((el) => {
          el.textContent = `${stats.downloads}+`;
        });
      }
    });
  };

  if (cached) {
    applyStats(cached);
    return;
  }

  const results = {};

  await Promise.allSettled(
    repos.map(async (repo) => {
      try {
        const [repoRes, relRes] = await Promise.all([
          fetch(`https://api.github.com/repos/${repo}`).then((r) => (r.ok ? r.json() : null)),
          fetch(`https://api.github.com/repos/${repo}/releases`).then((r) => (r.ok ? r.json() : null))
        ]);

        let stars = repoRes?.stargazers_count;
        let downloads = 0;

        if (Array.isArray(relRes)) {
          relRes.forEach((rel) => {
            if (Array.isArray(rel.assets)) {
              rel.assets.forEach((asset) => {
                downloads += asset.download_count || 0;
              });
            }
          });
        }

        results[repo] = {
          stars: stars !== undefined ? stars : undefined,
          downloads: downloads > 0 ? downloads : undefined
        };
      } catch {}
    })
  );

  applyStats(results);
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(results));
  } catch {}
}

function mountMotionSystem() {
  document.documentElement.dataset.motion = motionAllowed() ? "full" : "reduced";
  mountHeroEntrance();
  mountScrollReveals();
  mountHeroParallax();
  mountProjectTilt();
  mountScrollProgress();
  mountActiveNavigation();
}

mountAgeCounters();
mountCursorGlow();
mountLayoutDetection();
mountIdentityMode();
mountLenticular();
mountContactModal();
mountPageMeta();
mountProjectFilters();
mountMotionSystem();
mountSignalAutoRefresh();
fetchSignal();
fetchLiveGitHubStats();
