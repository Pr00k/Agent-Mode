import type { OtaManifest } from "./model";
import { isArenaHttps } from "./url.ts";

const VERSION = /^\d{1,4}\.\d{1,4}\.\d{1,4}$/;
const COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const NOTE_MAX = 280;

function str(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  if (!s || s.length > max) return undefined;
  return s;
}

export function parseManifest(raw: unknown): OtaManifest | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const contentVersion = str(o.contentVersion, 32);
  if (!contentVersion || !VERSION.test(contentVersion)) return null;

  const man: OtaManifest = { contentVersion };

  const agentUrl = str(o.agentUrl, 200);
  if (agentUrl) {
    if (!isArenaHttps(agentUrl)) return null;
    man.agentUrl = agentUrl;
  }
  const historyUrl = str(o.historyUrl, 200);
  if (historyUrl) {
    if (!isArenaHttps(historyUrl)) return null;
    man.historyUrl = historyUrl;
  }
  const leaderboardUrl = str(o.leaderboardUrl, 200);
  if (leaderboardUrl) {
    if (!isArenaHttps(leaderboardUrl)) return null;
    man.leaderboardUrl = leaderboardUrl;
  }

  if (o.theme && typeof o.theme === "object") {
    const t = o.theme as Record<string, unknown>;
    const bg = str(t.bg, 16);
    const sand = str(t.sand, 16);
    const paper = str(t.paper, 16);
    if ((bg && !COLOR.test(bg)) || (sand && !COLOR.test(sand)) || (paper && !COLOR.test(paper))) {
      return null;
    }
    man.theme = { bg, sand, paper };
  }

  if (o.notes && typeof o.notes === "object") {
    const n = o.notes as Record<string, unknown>;
    man.notes = {
      ar: str(n.ar, NOTE_MAX),
      en: str(n.en, NOTE_MAX),
    };
  }

  if ("css" in o && o.css != null) {
    /* Untrusted CSS is rejected. Compromised OTA must not restyle privileged chrome. */
    return null;
  }

  return man;
}

export function cmpVersion(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
}
