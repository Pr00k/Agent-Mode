import { detectLang, strings, type Key, type Lang } from "./i18n";
import { isBridgeOn, isTauri, runBridge, setBridgeOn } from "./bridge";
import {
  isAwakeOn,
  isBgOn,
  restoreSession,
  saveSession,
  setAwakeOn,
  setBgOn,
  startKeepAlive,
} from "./keepalive";
import { checkForContentUpdate, refreshInside, type Manifest } from "./ota";

const AGENT = "https://arena.ai/agent";
const ROUTES: Record<string, string> = {
  agent: AGENT,
  new: AGENT,
  history: "https://arena.ai/history/search",
  leaderboard: "https://arena.ai/leaderboard/agent",
  github: "https://arena.ai/agent",
};

const app = document.getElementById("app")!;
const frame = document.getElementById("agent-frame") as HTMLIFrameElement;
const loader = document.getElementById("loader")!;
const fallback = document.getElementById("fallback")!;
const tabsEl = document.getElementById("tabs")!;
const palette = document.getElementById("palette")!;
const paletteInput = document.getElementById("palette-input") as HTMLInputElement;
const paletteList = document.getElementById("palette-list")!;
const toast = document.getElementById("toast")!;
const bridgePanel = document.getElementById("bridge-panel")!;
const settingsPanel = document.getElementById("settings-panel")!;
const bridgeEnabled = document.getElementById("bridge-enabled") as HTMLInputElement;
const zoom = document.getElementById("zoom") as HTMLInputElement;
const compact = document.getElementById("compact") as HTMLInputElement;
const autohide = document.getElementById("autohide") as HTMLInputElement;
const bgRun = document.getElementById("bg-run") as HTMLInputElement;
const stayAwake = document.getElementById("stay-awake") as HTMLInputElement;
const otaEl = document.getElementById("ota")!;
const otaNotes = document.getElementById("ota-notes")!;

let lang: Lang = detectLang();
let pendingOta: Manifest | null = null;
let tabId = 1;

function t(key: Key): string {
  return strings[lang][key];
}

function applyI18n(): void {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n as Key);
  });
  document.querySelectorAll<HTMLElement>("[data-i18n-title]").forEach((el) => {
    el.title = t(el.dataset.i18nTitle as Key);
  });
  document.querySelectorAll<HTMLElement>("[data-i18n-placeholder]").forEach((el) => {
    (el as HTMLInputElement).placeholder = t(el.dataset.i18nPlaceholder as Key);
  });
  const lab = document.getElementById("lang-label");
  if (lab) lab.textContent = lang === "ar" ? "EN" : "ع";
  localStorage.setItem("arena.lang", lang);
}

function showToast(msg: string): void {
  toast.hidden = false;
  toast.textContent = msg;
  window.setTimeout(() => {
    toast.hidden = true;
  }, 2400);
}

function layout(): void {
  const compactOn = localStorage.getItem("arena.compact") === "1";
  const phone = window.matchMedia("(max-width: 840px)").matches;
  app.dataset.mode = phone ? "phone" : compactOn ? "compact" : "desktop";
  if (localStorage.getItem("arena.autohide") === "1" && !phone) {
    app.dataset.sidebar = "hidden";
  } else {
    app.dataset.sidebar = compactOn && !phone ? "compact" : "expanded";
  }
}

function setActiveNav(id: string): void {
  document.querySelectorAll("[data-nav]").forEach((el) => {
    el.classList.toggle("active", (el as HTMLElement).dataset.nav === id);
  });
}

function navigate(id: string): void {
  if (id === "bridge") {
    bridgePanel.hidden = false;
    settingsPanel.hidden = true;
    setActiveNav("bridge");
    return;
  }
  const url = ROUTES[id] ?? AGENT;
  loader.hidden = false;
  fallback.hidden = true;
  frame.src = url;
  saveSession(url);
  setActiveNav(id === "new" ? "agent" : id);
  if (id === "new") addTab(url);
}

function addTab(url: string): void {
  const id = `t${tabId++}`;
  const btn = document.createElement("button");
  btn.className = "tab active";
  btn.dataset.tab = id;
  btn.role = "tab";
  btn.textContent = "Agent";
  tabsEl.querySelectorAll(".tab").forEach((t0) => t0.classList.remove("active"));
  tabsEl.appendChild(btn);
  btn.addEventListener("click", () => {
    tabsEl.querySelectorAll(".tab").forEach((t0) => t0.classList.remove("active"));
    btn.classList.add("active");
    frame.src = url;
  });
}

function openPalette(): void {
  palette.hidden = false;
  const items: { key: string; label: string; run: () => void }[] = [
    { key: "agent", label: t("agent"), run: () => navigate("agent") },
    { key: "new", label: t("newChat"), run: () => navigate("new") },
    { key: "history", label: t("history"), run: () => navigate("history") },
    { key: "board", label: t("leaderboard"), run: () => navigate("leaderboard") },
    { key: "bridge", label: t("bridge"), run: () => navigate("bridge") },
    { key: "settings", label: t("settings"), run: () => openSettings() },
  ];
  const render = (q: string): void => {
    const qn = q.trim().toLowerCase();
    paletteList.replaceChildren();
    items
      .filter((it) => !qn || it.label.toLowerCase().includes(qn) || it.key.includes(qn))
      .forEach((it, i) => {
        const li = document.createElement("li");
        li.textContent = it.label;
        li.tabIndex = 0;
        if (i === 0) li.setAttribute("aria-selected", "true");
        li.addEventListener("click", () => {
          palette.hidden = true;
          it.run();
        });
        paletteList.appendChild(li);
      });
  };
  render("");
  paletteInput.value = "";
  paletteInput.oninput = () => render(paletteInput.value);
  paletteInput.focus();
}

function openSettings(): void {
  settingsPanel.hidden = false;
  bridgePanel.hidden = true;
}

async function nativeWindow(action: string): Promise<void> {
  if (!isTauri()) return;
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  const w = getCurrentWindow();
  if (action === "win-close") {
    if (isBgOn()) {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("hide_to_tray");
      showToast(t("hiddenOk"));
      return;
    }
    await w.close();
  }
  if (action === "win-min") await w.minimize();
  if (action === "win-max") await w.toggleMaximize();
  if (action === "pin") {
    const on = !(await w.isAlwaysOnTop());
    await w.setAlwaysOnTop(on);
    showToast(on ? t("alwaysOnTop") : t("agent"));
  }
}

async function bootTauri(): Promise<void> {
  if (!isTauri()) return;
  app.dataset.tauri = "1";
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("show_main");
  } catch {
    /* command optional */
  }
}

function wire(): void {
  document.addEventListener("click", async (ev) => {
    const el = (ev.target as HTMLElement).closest<HTMLElement>("[data-action],[data-nav],[data-bridge]");
    if (!el) {
      if (!palette.hidden && !palette.contains(ev.target as Node)) palette.hidden = true;
      return;
    }
    const action = el.dataset.action;
    const nav = el.dataset.nav;
    const bridge = el.dataset.bridge;
    if (nav) navigate(nav);
    if (action === "new-tab") navigate("new");
    if (action === "palette") openPalette();
    if (action === "reload") {
      loader.hidden = false;
      frame.src = frame.src;
    }
    if (action === "retry") {
      fallback.hidden = true;
      loader.hidden = false;
      frame.src = AGENT;
    }
    if (action === "settings") openSettings();
    if (action === "close-panel") {
      bridgePanel.hidden = true;
      settingsPanel.hidden = true;
    }
    if (action === "lang") {
      lang = lang === "ar" ? "en" : "ar";
      applyI18n();
    }
    if (action === "ota-apply") {
      if (!pendingOta) return;
      otaEl.hidden = true;
      loader.hidden = false;
      await refreshInside(frame, pendingOta);
      pendingOta = null;
      showToast(t("otaDone"));
      return;
    }
    if (action === "ota-check") {
      showToast(t("otaChecking"));
      await pollOta();
      if (otaEl.hidden) showToast(t("otaNone"));
      return;
    }
    if (action === "win-close" || action === "win-min" || action === "win-max" || action === "pin") {
      await nativeWindow(action);
    }
    if (bridge === "github") {
      navigate("github");
    } else if (bridge) {
      try {
        showToast(await runBridge(bridge, t));
      } catch {
        showToast(t("needPerm"));
      }
    }
  });

  window.addEventListener("keydown", (ev) => {
    const meta = ev.metaKey || ev.ctrlKey;
    if (meta && ev.key.toLowerCase() === "k") {
      ev.preventDefault();
      openPalette();
    }
    if (meta && ev.key.toLowerCase() === "n") {
      ev.preventDefault();
      navigate("new");
    }
    if (meta && ev.key.toLowerCase() === "r") {
      ev.preventDefault();
      frame.src = frame.src;
    }
    if (meta && ev.key === "1") navigate("agent");
    if (ev.key === "Escape") {
      palette.hidden = true;
      bridgePanel.hidden = true;
      settingsPanel.hidden = true;
    }
    if (!palette.hidden && ev.key === "Enter") {
      const sel = paletteList.querySelector<HTMLElement>("[aria-selected='true']");
      sel?.click();
    }
  });

  frame.addEventListener("load", () => {
    loader.hidden = true;
  });
  window.setTimeout(() => {
    if (!loader.hidden) loader.hidden = true;
  }, 8000);

  bridgeEnabled.checked = isBridgeOn();
  const cuEnabled = document.getElementById("cu-enabled") as HTMLInputElement | null;
  if (cuEnabled) cuEnabled.checked = isBridgeOn();
  const syncCu = (on: boolean): void => {
    setBridgeOn(on);
    bridgeEnabled.checked = on;
    if (cuEnabled) cuEnabled.checked = on;
    showToast(on ? t("enabled") : t("disabled"));
  };
  bridgeEnabled.addEventListener("change", () => syncCu(bridgeEnabled.checked));
  cuEnabled?.addEventListener("change", () => syncCu(cuEnabled.checked));

  zoom.value = localStorage.getItem("arena.zoom") ?? "100";
  const applyZoom = (): void => {
    const z = Number(zoom.value) / 100;
    frame.style.transformOrigin = "0 0";
    frame.style.transform = z === 1 ? "" : `scale(${z})`;
    frame.style.width = z === 1 ? "100%" : `${100 / z}%`;
    frame.style.height = z === 1 ? "100%" : `${100 / z}%`;
  };
  applyZoom();
  zoom.addEventListener("input", () => {
    localStorage.setItem("arena.zoom", zoom.value);
    applyZoom();
  });

  compact.checked = localStorage.getItem("arena.compact") === "1";
  compact.addEventListener("change", () => {
    localStorage.setItem("arena.compact", compact.checked ? "1" : "0");
    layout();
  });
  autohide.checked = localStorage.getItem("arena.autohide") === "1";
  autohide.addEventListener("change", () => {
    localStorage.setItem("arena.autohide", autohide.checked ? "1" : "0");
    layout();
  });

  bgRun.checked = isBgOn();
  bgRun.addEventListener("change", () => {
    setBgOn(bgRun.checked);
    void startKeepAlive();
    showToast(bgRun.checked ? t("hiddenOk") : t("settings"));
  });
  stayAwake.checked = isAwakeOn();
  stayAwake.addEventListener("change", () => {
    setAwakeOn(stayAwake.checked);
    void startKeepAlive();
  });

  window.addEventListener("resize", layout);
  window.addEventListener("online", () => {
    showToast(t("connecting"));
    void pollOta();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && isBgOn()) {
      saveSession(frame.src || AGENT);
    }
    if (document.visibilityState === "visible") void pollOta();
  });
}

async function registerSw(): Promise<void> {
  if (isTauri() || !("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw.js");
  } catch {
    /* optional */
  }
}

applyI18n();
layout();
addTab(AGENT);
wire();
const restored = restoreSession();
if (restored && restored.startsWith("https://arena.ai")) {
  frame.src = restored;
}
void bootTauri();
void registerSw();
void startKeepAlive();
void pollOta();
window.setInterval(() => void pollOta(), 5 * 60 * 1000);

async function pollOta(): Promise<void> {
  const man = await checkForContentUpdate();
  if (!man) return;
  pendingOta = man;
  const note = lang === "ar" ? man.notes?.ar : man.notes?.en;
  otaNotes.textContent = note || t("otaTitle");
  otaEl.hidden = false;
}
