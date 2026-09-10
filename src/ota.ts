/** Last content baked into this binary. Server `contentVersion` above this shows the modal. */
export const BUNDLED_CONTENT = "1.2.0";

const APPLIED_KEY = "ota.applied";
const BRANCH = "arena/01a08b05-agent-mode";

export type Manifest = {
  contentVersion: string;
  releasedAt?: string;
  agentUrl?: string;
  historyUrl?: string;
  leaderboardUrl?: string;
  theme?: { bg?: string; sand?: string; paper?: string };
  notes?: { ar?: string; en?: string };
  css?: string;
};

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

function cmp(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

export function isNewer(remote: string, local: string): boolean {
  return cmp(remote, local) > 0;
}

export async function fetchManifest(): Promise<Manifest | null> {
  const bust = `t=${Date.now()}`;
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}${bust}`, {
        cache: "no-store",
      });
      if (!res.ok) continue;
      const data = (await res.json()) as Manifest;
      if (data && typeof data.contentVersion === "string") return data;
    } catch {
      /* try next */
    }
  }
  return null;
}

export function applyManifest(man: Manifest): void {
  const root = document.documentElement;
  if (man.theme?.bg) root.style.setProperty("--bg", man.theme.bg);
  if (man.theme?.sand) root.style.setProperty("--sand", man.theme.sand);
  if (man.theme?.paper) root.style.setProperty("--paper", man.theme.paper);
  if (man.css) {
    let tag = document.getElementById("ota-css");
    if (!tag) {
      tag = document.createElement("style");
      tag.id = "ota-css";
      document.head.appendChild(tag);
    }
    tag.textContent = man.css;
  }
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
  const sep = base.includes("?") ? "&" : "?";
  frame.src = `${base}${sep}ota=${encodeURIComponent(man.contentVersion)}`;
}

export async function checkForContentUpdate(): Promise<Manifest | null> {
  const man = await fetchManifest();
  if (!man) return null;
  if (isNewer(man.contentVersion, appliedVersion())) return man;
  return null;
}
