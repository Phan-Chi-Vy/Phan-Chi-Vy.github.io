const BIRTH_DATE = new Date("2006-06-23T00:00:00+07:00");
const SIGNAL_FALLBACK_URL = "https://data-fetcher-p8pv.onrender.com/api/users";
const YOZORA_USER_ID = "428375195573551114";
const SIGNAL_REFRESH_INTERVAL_MS = 3000;
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointerQuery = window.matchMedia("(pointer: fine)");
let signalRefreshHandle = null;
let signalFetchInFlight = false;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const lenticularAnimations = new WeakMap();

function motionAllowed() {
  return !reducedMotionQuery.matches && typeof Element.prototype.animate === "function";
}

function setLenticularReveal(card, reveal) {
  const value = Math.min(100, Math.max(0, reveal));
  card.style.setProperty("--reveal", value + "%");
  card.style.setProperty("--shine-x", value + "%");
  card.dataset.reveal = String(value);
  card.setAttribute("aria-valuenow", String(Math.round(value)));
  card.setAttribute("aria-valuetext", value === 50 ? (window.__getIdentityMode?.() || "me") : value > 50 ? "Alter Ego" : "Me");
}

function stopLenticularAnimation(card) {
  const frame = lenticularAnimations.get(card);
  if (frame) cancelAnimationFrame(frame);
  lenticularAnimations.delete(card);
}

function animateLenticularReveal(card, target, duration = 680) {
  stopLenticularAnimation(card);
  const start = Number(card.dataset.reveal ?? 0);
  const end = Math.min(100, Math.max(0, target));
  if (start === end || reducedMotionQuery.matches) {
    setLenticularReveal(card, end);
    return;
  }
  const startedAt = performance.now();
  const tick = (now) => {
    const progress = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    setLenticularReveal(card, start + (end - start) * eased);
    if (progress < 1) lenticularAnimations.set(card, requestAnimationFrame(tick));
    else lenticularAnimations.delete(card);
  };
  lenticularAnimations.set(card, requestAnimationFrame(tick));
}

function mountAgeCounters() {
  const now = new Date();
  let age = now.getFullYear() - BIRTH_DATE.getFullYear();
  if (now < new Date(now.getFullYear(), BIRTH_DATE.getMonth(), BIRTH_DATE.getDate())) age -= 1;
  $$("[data-age-counter], [data-age-integer]").forEach((element) => { element.textContent = String(age); });
  const year = $("[data-current-year]");
  if (year) year.textContent = String(now.getFullYear());
}

function routeName(hash = window.location.hash) {
  if (!hash) return document.body.dataset.initialPage || "home";
  const requested = hash.replace(/^#/, "").toLowerCase();
  if (requested === "page-identity") return "identity";
  return requested === "top" || !["home", "work", "identity", "signal"].includes(requested) ? "home" : requested;
}

function mountNavigation() {
  const pages = $$("[data-page]");
  const links = $$("[data-route]");
  const marker = $(".dock-marker");
  const routeOrder = ["home", "work", "identity", "signal"];
  let currentPage = null;
  const positionMarker = (name) => {
    if (!marker || !links.length) return;
    const activeIndex = routeOrder.indexOf(name);
    const distance = links[activeIndex].getBoundingClientRect().left - links[0].getBoundingClientRect().left;
    marker.style.transform = "translateX(" + distance + "px)";
  };
  const activate = (name, options = {}) => {
    const selected = routeName("#" + name);
    if (currentPage === selected) {
      if (options.focus) $('[data-page="' + selected + '"] h1')?.focus({ preventScroll: true });
      return;
    }
    const previous = pages.find((page) => page.dataset.page === currentPage);
    const next = pages.find((page) => page.dataset.page === selected);
    if (!next) return;
    window.dispatchEvent(new CustomEvent("app:routechange", { detail: { from: currentPage, to: selected } }));
    pages.forEach((page) => page.classList.remove("is-leaving"));
    if (previous) {
      previous.classList.remove("is-active");
      previous.classList.toggle("is-leaving", options.animate !== false && motionAllowed());
      previous.setAttribute("aria-hidden", "true");
      previous.inert = true;
      window.setTimeout(() => previous.classList.remove("is-leaving"), 220);
    }
    currentPage = selected;
    next.classList.remove("is-leaving");
    next.classList.add("is-active");
    next.removeAttribute("aria-hidden");
    next.inert = false;
    links.forEach((link) => {
      const active = link.dataset.route === selected;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    positionMarker(selected);
    if (options.focus) $('[data-page="' + selected + '"] h1')?.focus({ preventScroll: true });
  };
  pages.forEach((page) => {
    const active = page.dataset.page === routeName();
    page.classList.toggle("is-active", active);
    page.classList.remove("is-leaving");
    page.querySelector("h1")?.setAttribute("tabindex", "-1");
    if (active) page.removeAttribute("aria-hidden");
    else page.setAttribute("aria-hidden", "true");
    page.inert = !active;
  });
  currentPage = routeName();
  links.forEach((link) => {
    const active = link.dataset.route === currentPage;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  positionMarker(currentPage);
  const syncFromLocation = () => {
    const normalized = routeName();
    if (window.location.hash && window.location.hash !== "#" + normalized && window.location.hash !== "#page-identity") window.history.replaceState(null, "", "#" + normalized);
    activate(normalized, { focus: true });
  };
  window.addEventListener("resize", () => positionMarker(currentPage));
  window.addEventListener("hashchange", syncFromLocation);
  window.addEventListener("popstate", syncFromLocation);
  links.forEach((link) => link.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === "_blank" || link.hasAttribute("download")) return;
    event.preventDefault();
    if (link.dataset.route === currentPage) {
      $('[data-page="' + currentPage + '"] h1')?.focus({ preventScroll: true });
      return;
    }
    const nextUrl = new URL(window.location.href);
    nextUrl.hash = link.dataset.route;
    window.history.pushState(null, "", nextUrl);
    activate(link.dataset.route, { focus: true });
  }));
  if (window.location.hash === "#top" || (!window.location.hash && (document.body.dataset.initialPage || "home") === "home")) window.history.replaceState(null, "", "#home");
  return activate;
}

function mountProjectPager() {
  const tabs = $$("[data-project-tab]");
  const slides = $$("[data-project-slide]");
  const counter = $("[data-project-current]");
  const dots = $$(".step-dots span");
  let current = 0;
  const show = (index, focusTab = false) => {
    current = (index + tabs.length) % tabs.length;
    tabs.forEach((tab, tabIndex) => {
      const selected = tabIndex === current;
      tab.classList.toggle("is-selected", selected);
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    slides.forEach((slide, slideIndex) => {
      const selected = slideIndex === current;
      slide.hidden = !selected;
      slide.classList.toggle("is-current", selected);
    });
    dots.forEach((dot, dotIndex) => dot.classList.toggle("is-current", dotIndex === current));
    if (counter) counter.textContent = String(current + 1).padStart(2, "0");
    if (focusTab) tabs[current]?.focus();
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => show(index));
    tab.addEventListener("keydown", (event) => {
      let target = null;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") target = current + 1;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") target = current - 1;
      if (event.key === "Home") target = 0;
      if (event.key === "End") target = tabs.length - 1;
      if (target !== null) { event.preventDefault(); show(target, true); }
    });
  });
  $("[data-project-prev]")?.addEventListener("click", () => show(current - 1));
  $("[data-project-next]")?.addEventListener("click", () => show(current + 1));
  show(0);
}

function mountIdentityTabs() {
  const tabs = $$("[data-identity-tab]");
  const panels = $$("[data-identity-panel]");
  const notes = $("[data-identity-note]");
  let selected = "about";
  const show = (name, focusTab = false) => {
    selected = name;
    if (notes) notes.hidden = true;
    tabs.forEach((tab) => {
      const active = tab.dataset.identityTab === name;
      tab.classList.toggle("is-selected", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel) => {
      const active = panel.dataset.identityPanel === name;
      panel.hidden = !active;
      panel.classList.toggle("is-current", active);
    });
    if (focusTab) tabs.find((tab) => tab.dataset.identityTab === name)?.focus();
  };
  tabs.forEach((tab) => tab.addEventListener("click", () => show(tab.dataset.identityTab)));
  tabs.forEach((tab, index) => tab.addEventListener("keydown", (event) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
    show(tabs[nextIndex].dataset.identityTab, true);
  }));
  $$("[data-identity-subpage]").forEach((button) => button.addEventListener("click", () => {
    const showNotes = button.dataset.identitySubpage === "notes";
    if (notes) notes.hidden = !showNotes;
    const aboutPanel = $("#identity-about");
    if (aboutPanel) aboutPanel.hidden = showNotes || selected !== "about";
    if (showNotes) $("[data-identity-note] .back-link")?.focus();
    else $("[data-identity-tab='about']")?.focus();
  }));
  show("about");
}

function mountSkillPager() {
  const groups = $$('[data-skill-group]');
  const counter = $('[data-skill-current]');
  let current = 0;
  const show = (index) => {
    current = (index + groups.length) % groups.length;
    groups.forEach((group, groupIndex) => { group.hidden = groupIndex !== current; });
    if (counter) counter.textContent = String(current + 1).padStart(2, "0");
  };
  $('[data-skill-prev]')?.addEventListener("click", () => show(current - 1));
  $('[data-skill-next]')?.addEventListener("click", () => show(current + 1));
  show(0);
}

function mountIdentityMode() {
  const button = $("[data-mode-switch]");
  const card = $("[data-lenticular]");
  if (!button || !card) return;
  const modes = {
    me: { label: "Swine Lord", icon: "◉", ariaLabel: "Switch to Alter Ego", line: "IC Design Student @ IUH / AI Jailbreak Specialist / Native Software Architect", caption: "Have you ever heard of a Schrödinger state? I'm one.", state: "Phan Chi Vy", reveal: 0 },
    alter: { label: "Swine - Alter ego", icon: "◌", ariaLabel: "Switch to Me", line: "Same mind / softer render / still dangerously curious", caption: "Observation changed the render, not the person.", state: "Hoshimiya Yozora", reveal: 100 }
  };
  let mode = "me";
  try { mode = localStorage.getItem("yozora-mode") === "alter" ? "alter" : "me"; }
  catch (error) { console.warn("Identity preference could not be read.", error); }
  const apply = (nextMode, animate = true) => {
    mode = nextMode;
    const value = modes[mode];
    document.body.classList.toggle("alter-mode", mode === "alter");
    card.dataset.mode = mode;
    button.setAttribute("aria-pressed", String(mode === "alter"));
    button.setAttribute("aria-label", value.ariaLabel);
    $(".mode-icon", button).textContent = value.icon;
    $(".mode-label", button).textContent = value.label;
    $$("[data-identity-line]").forEach((element) => { element.textContent = value.line; });
    $$("[data-profile-caption]").forEach((element) => { element.textContent = value.caption; });
    $$("[data-state-pill]").forEach((element) => { element.textContent = value.state; });
    if (animate) animateLenticularReveal(card, value.reveal);
    else { stopLenticularAnimation(card); setLenticularReveal(card, value.reveal); }
    try { localStorage.setItem("yozora-mode", mode); }
    catch (error) { console.warn("Identity preference could not be saved.", error); }
    window.dispatchEvent(new CustomEvent("app:identitymode", { detail: { mode, reveal: value.reveal } }));
  };
  window.__setIdentityMode = apply;
  window.__getIdentityMode = () => mode;
  button.addEventListener("click", () => apply(mode === "me" ? "alter" : "me"));
  apply(mode, false);
}

function mountLenticular() {
  const card = $("[data-lenticular]");
  if (!card) return;
  let pointerId = null;
  let idleHandle = 0;
  let pendingMode = window.__getIdentityMode?.() || "me";
  const clearIdle = () => { window.clearTimeout(idleHandle); idleHandle = 0; };
  const update = (event) => {
    const rect = card.getBoundingClientRect();
    const reveal = rect.width ? ((event.clientX - rect.left) / rect.width) * 100 : 0;
    pendingMode = null;
    clearIdle();
    stopLenticularAnimation(card);
    setLenticularReveal(card, reveal);
  };
  const settle = (followReveal = false) => {
    clearIdle();
    const reveal = Number(card.dataset.reveal || 0);
    const activeMode = window.__getIdentityMode?.() || "me";
    const targetMode = followReveal
      ? reveal === 50 ? activeMode : reveal > 50 ? "alter" : "me"
      : pendingMode || activeMode;
    if (window.__setIdentityMode) window.__setIdentityMode(targetMode, true);
    else animateLenticularReveal(card, targetMode === "alter" ? 100 : 0);
  };
  const scheduleHoverSettle = () => {
    clearIdle();
    idleHandle = window.setTimeout(() => { idleHandle = 0; if (pointerId === null) settle(true); }, 180);
  };
  card.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    clearIdle();
    pointerId = event.pointerId;
    card.setPointerCapture(event.pointerId);
    update(event);
  });
  card.addEventListener("pointermove", (event) => {
    if (pointerId === event.pointerId || (event.pointerType === "mouse" && finePointerQuery.matches)) {
      update(event);
      if (event.pointerType === "mouse" && pointerId === null) scheduleHoverSettle();
    }
  });
  const release = (event) => {
    if ((event?.type === "pointerup" || event?.type === "pointercancel") && event.pointerId !== pointerId) return;
    const followReveal = pointerId !== null || idleHandle !== 0 || pendingMode === null;
    pointerId = null;
    settle(followReveal);
  };
  card.addEventListener("pointerup", release);
  card.addEventListener("pointercancel", release);
  card.addEventListener("pointerleave", (event) => { if (event.pointerType === "mouse" && pointerId === null) release(event); });
  window.addEventListener("blur", release);
  document.addEventListener("visibilitychange", () => { if (document.hidden) release(); });
  window.addEventListener("app:routechange", (event) => { if (event.detail?.from === "home") release(); });
  reducedMotionQuery.addEventListener("change", (event) => { if (event.matches) release(); });
  window.addEventListener("app:identitymode", (event) => {
    clearIdle();
    pendingMode = event.detail?.mode || null;
  });
  card.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      clearIdle();
      pendingMode = null;
      const reveal = Number(card.dataset.reveal || 0);
      stopLenticularAnimation(card);
      setLenticularReveal(card, reveal + (event.key === "ArrowRight" ? 10 : -10));
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      clearIdle();
      pendingMode = null;
      stopLenticularAnimation(card);
      setLenticularReveal(card, event.key === "End" ? 100 : 0);
    }
  });
  card.addEventListener("keyup", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    settle(true);
  });
}

function formatDiscordActivity(activities, customFallback) {
  if (!Array.isArray(activities) || activities.length === 0) return customFallback || "Guided by the wind, bound by no star, I claim only the horizon I forged.";
  const spotify = activities.find((activity) => activity.name === "Spotify");
  if (spotify) return "Listening to " + (spotify.details || "music") + (spotify.state ? " — " + spotify.state : "");
  const game = activities.find((activity) => activity.type === 0 && activity.name !== "Custom Status");
  if (game) return "Playing " + game.name + (game.details ? " — " + game.details : "");
  const stream = activities.find((activity) => activity.type === 1 || activity.type === 3);
  if (stream) return (stream.type === 1 ? "Streaming " : "Watching ") + (stream.name || "something");
  const custom = activities.find((activity) => activity.type === 4 || activity.name === "Custom Status");
  return custom?.state || customFallback || "Guided by the wind, bound by no star, I claim only the horizon I forged.";
}

function relativeTime(dateValue) {
  if (!dateValue) return "Updated recently";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Updated recently";
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const units = [["day", 86400], ["hour", 3600], ["minute", 60]];
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, size] of units) if (Math.abs(seconds) >= size) return "Updated " + formatter.format(Math.round(seconds / size), unit);
  return "Updated just now";
}

function usersFromPayload(payload) {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.data) ? payload.data : [];
}

async function fetchSignal(options = {}) {
  if (signalFetchInFlight) return;
  signalFetchInFlight = true;
  const status = $("[data-signal-status]");
  const statusDot = $("[data-signal-dot]");
  const avatar = $("[data-signal-avatar]");
  const name = $("[data-signal-name]");
  const nickname = $("[data-signal-nickname]");
  const message = $("[data-signal-message]");
  const updated = $("[data-signal-updated]");
  const refresh = $("[data-refresh-signal]");
  if (options.showLoading !== false && status) {
    status.className = "signal-status is-loading";
    status.innerHTML = "<i></i>Tuning in";
    refresh?.classList.add("is-refreshing");
  }
  try {
    let response = null;
    if (window.location.protocol !== "file:") response = await fetch("./api/yozora", { cache: "no-store" });
    let data;
    if (response?.ok && response.headers.get("content-type")?.includes("json")) {
      data = await response.json();
    } else {
      response = await fetch(SIGNAL_FALLBACK_URL, { cache: "no-store" });
      if (!response.ok) throw new Error("Signal service returned " + response.status);
      const user = usersFromPayload(await response.json()).find((entry) => entry.userId === YOZORA_USER_ID);
      if (!user) throw new Error("Discord user was not present in the signal payload.");
      const custom = user.activities?.find((activity) => activity.type === 4 || activity.name === "Custom Status");
      data = { avatarURL: user.avatarURL, username: user.username, nickname: user.nickname, status: user.status, customStatus: custom?.state || null, activities: user.activities || [], lastUpdated: user.lastUpdated };
    }
    const presence = ["online", "idle", "dnd"].includes(data.status) ? data.status : "offline";
    if (status) {
      status.className = "signal-status is-" + presence;
      status.innerHTML = "<i></i>" + (presence === "dnd" ? "Do not disturb" : presence);
    }
    if (statusDot) statusDot.className = "is-" + presence;
    if (name) name.textContent = data.username || "kei_akashi.";
    if (nickname) nickname.textContent = data.nickname || "Yozora";
    if (message) message.textContent = formatDiscordActivity(data.activities, data.customStatus);
    if (updated) updated.textContent = relativeTime(data.lastUpdated);
    if (avatar && data.avatarURL) avatar.src = data.avatarURL;
  } catch (error) {
    if (status) { status.className = "signal-status"; status.innerHTML = "<i></i>Signal unavailable"; }
    if (statusDot) statusDot.className = "";
    if (nickname) nickname.textContent = "Live Discord presence could not be reached.";
    if (message) message.textContent = "Refresh to try the live signal again.";
    if (updated) updated.textContent = "Discord presence unavailable";
    console.info("Discord presence is unavailable.", error.message);
  } finally {
    signalFetchInFlight = false;
    refresh?.classList.remove("is-refreshing");
  }
}

function mountSignalRefresh() {
  const stop = () => {
    if (!signalRefreshHandle) return;
    window.clearInterval(signalRefreshHandle);
    signalRefreshHandle = null;
  };
  const start = () => {
    if (signalRefreshHandle || document.visibilityState !== "visible") return;
    signalRefreshHandle = window.setInterval(() => { fetchSignal({ showLoading: false }); }, SIGNAL_REFRESH_INTERVAL_MS);
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") { fetchSignal({ showLoading: false }); start(); }
    else stop();
  });
  $("[data-refresh-signal]")?.addEventListener("click", () => fetchSignal());
  start();
}

function mountContactDialog() {
  const dialog = $("[data-contact-modal]");
  const closeButton = $("[data-close-contact]");
  const feedback = $("[data-copy-feedback]");
  if (!dialog) return;
  let opener = null;
  $$("[data-open-contact]").forEach((button) => button.addEventListener("click", () => {
    opener = button;
    if (!dialog.open) dialog.showModal();
    closeButton?.focus();
  }));
  const close = () => { if (dialog.open) dialog.close(); };
  closeButton?.addEventListener("click", close);
  dialog.addEventListener("click", (event) => {
    const bounds = dialog.getBoundingClientRect();
    const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
    if (outside) close();
  });
  dialog.addEventListener("close", () => { opener?.focus({ preventScroll: true }); opener = null; });
  $$("[data-copy]").forEach((button) => button.addEventListener("click", async () => {
    const value = button.dataset.copy;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
      else {
        const temporary = document.createElement("textarea");
        temporary.value = value;
        temporary.setAttribute("readonly", "");
        temporary.style.position = "fixed";
        temporary.style.opacity = "0";
        document.body.append(temporary);
        temporary.select();
        const copied = document.execCommand("copy");
        temporary.remove();
        if (!copied) throw new Error("Clipboard access is unavailable.");
      }
      if (feedback) feedback.textContent = (button.dataset.copyLabel || "Value") + " copied.";
    } catch (error) {
      if (feedback) feedback.textContent = "Clipboard unavailable. Username: kei_akashi.";
      console.info("Clipboard copy is unavailable.", error.message);
    }
  }));
}

async function fetchLiveGitHubStats() {
  const repos = ["Kyokkei/Zora.AI", "Kyokkei/ProjectBeta", "Kyokkei/fukidashi-mcp", "Kyokkei/RamNuker"];
  const key = "yozora_github_stats_v2";
  const apply = (data) => {
    if (!data || typeof data !== "object") return;
    Object.entries(data).forEach(([repo, stats]) => {
      if (stats.stars !== undefined) $$('[data-live-stars="' + repo + '"]').forEach((element) => { element.textContent = String(stats.stars); });
      if (stats.downloads > 0) $$('[data-live-dl="' + repo + '"]').forEach((element) => { element.textContent = stats.downloads + "+"; });
    });
  };
  try {
    const cached = JSON.parse(sessionStorage.getItem(key) || "null");
    if (cached?.savedAt && Date.now() - cached.savedAt < 15 * 60 * 1000) { apply(cached.data); return; }
  } catch (error) { console.info("Cached GitHub stats could not be read.", error.message); }
  const results = {};
  await Promise.allSettled(repos.map(async (repo) => {
    const responses = await Promise.all([
      fetch("https://api.github.com/repos/" + repo).then((response) => response.ok ? response.json() : null),
      fetch("https://api.github.com/repos/" + repo + "/releases").then((response) => response.ok ? response.json() : null)
    ]);
    let downloads = 0;
    if (Array.isArray(responses[1])) responses[1].forEach((release) => {
      if (Array.isArray(release.assets)) release.assets.forEach((asset) => { downloads += asset.download_count || 0; });
    });
    results[repo] = { stars: responses[0]?.stargazers_count, downloads: downloads > 0 ? downloads : undefined };
  }));
  apply(results);
  try { sessionStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data: results })); }
  catch (error) { console.info("GitHub stats could not be cached.", error.message); }
}

function mountCursorGlow() {
  if (!finePointerQuery.matches) return;
  const glow = $(".cursor-glow");
  if (!glow) return;
  window.addEventListener("pointermove", (event) => {
    glow.style.setProperty("--cursor-x", event.clientX + "px");
    glow.style.setProperty("--cursor-y", event.clientY + "px");
  }, { passive: true });
}

function mountGlobalKeys() {
  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" && document.activeElement?.closest(".app-dock")) {
      event.preventDefault();
      const routes = ["home", "work", "identity", "signal"];
      window.location.hash = "#" + routes[(routes.indexOf(routeName()) + 1) % routes.length];
    }
  });
}

document.documentElement.dataset.motion = motionAllowed() ? "full" : "reduced";
reducedMotionQuery.addEventListener("change", () => {
  document.documentElement.dataset.motion = motionAllowed() ? "full" : "reduced";
  if (reducedMotionQuery.matches) $$(".app-page.is-leaving").forEach((page) => page.classList.remove("is-leaving"));
});

mountAgeCounters();
mountNavigation();
mountProjectPager();
mountIdentityTabs();
mountSkillPager();
mountIdentityMode();
mountLenticular();
mountContactDialog();
mountSignalRefresh();
mountCursorGlow();
mountGlobalKeys();
fetchSignal();
fetchLiveGitHubStats();
