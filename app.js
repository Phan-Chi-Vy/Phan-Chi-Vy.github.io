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

  applyMode(currentMode, false);
}

function mountLenticular() {
  const card = $("[data-lenticular]");
  if (!card) return;

  let isDragging = false;

  const updateFromPointer = (clientX, clientY = null) => {
    stopLenticularAnimation(card);
    const bounds = card.getBoundingClientRect();
    const x = Math.min(Math.max((clientX - bounds.left) / bounds.width, 0), 1);
    const y =
      clientY === null
        ? 0.5
        : Math.min(Math.max((clientY - bounds.top) / bounds.height, 0), 1);

    setLenticularReveal(card, x * 100);
    card.style.setProperty("--tilt-x", `${(x - 0.5) * 8}deg`);
    card.style.setProperty("--tilt-y", `${(0.5 - y) * 6}deg`);
  };

  card.addEventListener("pointerdown", (event) => {
    isDragging = true;
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
  };

  card.addEventListener("pointerup", release);
  card.addEventListener("pointercancel", release);
  card.addEventListener("pointerleave", () => {
    if (!isDragging) release();
  });

  card.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    stopLenticularAnimation(card);
    const current = Number(card.dataset.reveal ?? 50);
    const next = event.key === "ArrowRight" ? current + 5 : current - 5;
    const reveal = Math.min(Math.max(next, 0), 100);
    setLenticularReveal(card, reveal);
  });
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

  if (showLoading) {
    status.className = "signal-status is-loading";
    status.innerHTML = "<i></i>Tuning in";
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
        lastUpdated: yozora.lastUpdated
      };
    }

    const presence = ["online", "idle", "dnd"].includes(data.status)
      ? data.status
      : "offline";

    status.className = `signal-status is-${presence}`;
    status.innerHTML = `<i></i>${presence === "dnd" ? "Do not disturb" : presence}`;
    statusDot.className = `is-${presence}`;
    name.textContent = data.username || "hoshimiya_yozora";
    nickname.textContent = data.nickname || "Yozora";
    message.textContent =
      data.customStatus ||
      "Ran out of tokens, respawning quota soon (i'm sleeping baka).";
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

  $$("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        feedback.textContent = `${button.dataset.copyLabel} copied: ${button.dataset.copy}`;
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
mountMotionSystem();
mountSignalAutoRefresh();
fetchSignal();
