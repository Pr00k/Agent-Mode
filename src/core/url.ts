/** Allowlisted Arena hosts. Prefix matching is unsafe (arena.ai.evil.com). */
const ARENA_HOSTS = new Set(["arena.ai", "www.arena.ai"]);

export type UrlCheck =
  | { ok: true; url: URL }
  | { ok: false; reason: "parse" | "scheme" | "userinfo" | "host" | "port" | "ip" };

function isIpHost(host: string): boolean {
  if (/^[\d.]+$/.test(host)) return true;
  if (host.includes(":")) return true;
  return false;
}

export function parseArenaUrl(raw: string): UrlCheck {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "parse" };
  }
  if (url.protocol !== "https:") return { ok: false, reason: "scheme" };
  if (url.username || url.password) return { ok: false, reason: "userinfo" };
  if (url.port && url.port !== "443") return { ok: false, reason: "port" };
  const host = url.hostname.toLowerCase();
  if (isIpHost(host)) return { ok: false, reason: "ip" };
  const allowed =
    ARENA_HOSTS.has(host) ||
    (host.endsWith(".arena.ai") && host !== ".arena.ai" && !host.includes(".."));
  if (!allowed) return { ok: false, reason: "host" };
  return { ok: true, url };
}

export function isArenaHttps(raw: string): boolean {
  return parseArenaUrl(raw).ok;
}

export function arenaHref(raw: string, fallback: string): string {
  const parsed = parseArenaUrl(raw);
  if (parsed.ok) return parsed.url.href;
  const fb = parseArenaUrl(fallback);
  return fb.ok ? fb.url.href : "https://arena.ai/agent";
}

const OTA_HOSTS = new Set([
  "raw.githubusercontent.com",
  "cdn.jsdelivr.net",
]);

export function isTrustedOtaEndpoint(raw: string): boolean {
  if (raw.startsWith("/ota/")) return true;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return false;
    if (u.username || u.password) return false;
    return OTA_HOSTS.has(u.hostname.toLowerCase());
  } catch {
    return false;
  }
}
