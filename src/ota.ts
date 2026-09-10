import type { OtaManifest } from "./core/model";
import { cmpVersion, parseManifest } from "./core/ota-schema";
import { AppError } from "./core/errors";
import { isTrustedOtaEndpoint } from "./core/url";
import { mark, measure } from "./core/metrics";

export const BUNDLED_CONTENT = "1.3.0";

const APPLIED_KEY = "ota.applied";
const BRANCH = "arena/01a08b05-agent-mode";
const FETCH_MS = 8000;
const MAX_BYTES = 64 * 1024;

export type Manifest = OtaManifest;

const ENDPOINTS = [
  `https://raw.githubusercontent.com/Pr00k/Agent-Mode/${BRANCH}/ota/manifest.json`,
  `https://cdn.jsdelivr.net/gh/Pr00k/Agent-Mode@${BRANCH}/ota/manifest.json`,
  "/ota/manifest.json",
];

export function appliedVersion(): string {
  return localStorage.getItem(APPLIED_KEY) || BUNDLED_CONTENT;
}

export function markApplied(version: string): void {
  localStorage.setItem(APPLIED_KEY, version);
}

export function isNewer(remote: string, local: string): boolean {
  return cmpVersion(remote, local) > 0;
}

async function fetchLimited(url: string): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), FETCH_MS);
  try {
    const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`, {
      cache: "no-store",
      signal: ctrl.signal,
    });
    if (!res.ok) throw new AppError("NetworkError", String(res.status), true);
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) throw new AppError("ProtocolError", "oversized");
    return JSON.parse(new TextDecoder().decode(buf)) as unknown;
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new AppError("TimeoutError", "ota timeout", true);
    }
    throw new AppError("ParseError", "ota parse");
  } finally {
    window.clearTimeout(timer);
  }
}

export async function fetchManifest(): Promise<Manifest | null> {
  mark("ota-start");
  for (const url of ENDPOINTS) {
    if (!isTrustedOtaEndpoint(url)) continue;
    try {
      const parsed = parseManifest(await fetchLimited(url));
      if (parsed) {
        measure("ota-fetch", "ota-start");
        return parsed;
      }
    } catch {
      /* next endpoint */
    }
  }
  measure("ota-fetch", "ota-start");
  return null;
}

export function applyManifest(man: Manifest): void {
  const root = document.documentElement;
  if (man.theme?.bg) root.style.setProperty("--bg", man.theme.bg);
  if (man.theme?.sand) root.style.setProperty("--sand", man.theme.sand);
  if (man.theme?.paper) root.style.setProperty("--paper", man.theme.paper);
  markApplied(man.contentVersion);
}

export async function refreshInside(frame: HTMLIFrameElement, man: Manifest): Promise<void> {
  applyManifest(man);
  if ("serviceWorker" in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.update().catch(() => undefined)));
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
  const base = man.agentUrl || "https://arena.ai/agent";
  frame.src = base;
}

export async function checkForContentUpdate(): Promise<Manifest | null> {
  const man = await fetchManifest();
  if (!man) return null;
  if (isNewer(man.contentVersion, appliedVersion())) return man;
  return null;
}
