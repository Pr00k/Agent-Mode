import { isTauri } from "./bridge";
import { isArenaHttps } from "./core/url";

const BG = "arena.bg";
const AWAKE = "arena.awake";

let wake: WakeLockSentinel | null = null;
let beat = 0;

export function isBgOn(): boolean {
  return localStorage.getItem(BG) !== "0";
}

export function isAwakeOn(): boolean {
  return localStorage.getItem(AWAKE) !== "0";
}

export function setBgOn(on: boolean): void {
  localStorage.setItem(BG, on ? "1" : "0");
}

export function setAwakeOn(on: boolean): void {
  localStorage.setItem(AWAKE, on ? "1" : "0");
}

export function saveSession(url: string): void {
  if (!isArenaHttps(url)) return;
  try {
    sessionStorage.setItem("arena.url", url);
    localStorage.setItem("arena.url", url);
    localStorage.setItem("arena.beat", String(Date.now()));
  } catch {
    /* quota */
  }
}

export function restoreSession(): string | null {
  const raw = sessionStorage.getItem("arena.url") || localStorage.getItem("arena.url");
  if (!raw || !isArenaHttps(raw)) return null;
  return raw;
}

export async function startKeepAlive(): Promise<void> {
  stopKeepAlive();
  if (!isBgOn()) return;
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("pageshow", onVisible);
  if (isStandalone()) {
    window.addEventListener("beforeunload", onBeforeUnload);
  }
  await holdLocks();
  beat = window.setInterval(() => {
    try {
      localStorage.setItem("arena.beat", String(Date.now()));
    } catch {
      /* ignore */
    }
    if (document.visibilityState === "visible") void holdLocks();
  }, 20000);
}

export function stopKeepAlive(): void {
  document.removeEventListener("visibilitychange", onVisible);
  window.removeEventListener("pageshow", onVisible);
  window.removeEventListener("beforeunload", onBeforeUnload);
  if (beat) window.clearInterval(beat);
  beat = 0;
  void releaseLocks();
}

function isStandalone(): boolean {
  return (
    isTauri() ||
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function onVisible(): void {
  if (document.visibilityState === "visible") void holdLocks();
}

function onBeforeUnload(ev: BeforeUnloadEvent): void {
  if (!isBgOn()) return;
  ev.preventDefault();
  ev.returnValue = "";
}

async function holdLocks(): Promise<void> {
  if (!isAwakeOn()) return;
  try {
    if ("wakeLock" in navigator) {
      wake = await navigator.wakeLock.request("screen");
      wake.addEventListener("release", () => {
        if (isBgOn() && document.visibilityState === "visible") void holdLocks();
      });
    }
  } catch {
    /* unsupported or denied */
  }
  try {
    const mod = await import("@capacitor-community/keep-awake");
    await mod.KeepAwake.keepAwake();
  } catch {
    /* plugin absent until cap sync */
  }
}

async function releaseLocks(): Promise<void> {
  try {
    await wake?.release();
  } catch {
    /* already released */
  }
  wake = null;
  try {
    const mod = await import("@capacitor-community/keep-awake");
    await mod.KeepAwake.allowSleep();
  } catch {
    /* ignore */
  }
}
