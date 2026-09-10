import type { AuditEvent, Capability } from "./model";

const MASTER = "arena.bridge";
const AUDIT_KEY = "arena.audit";
const AUDIT_MAX = 40;

const ACTION_CAP: Record<string, Capability> = {
  screenshot: "SCREENSHOT",
  clipboard: "CLIPBOARD_READ",
  files: "FILE_READ",
  voice: "MICROPHONE",
  notify: "NOTIFICATION",
  share: "SHARE",
  "open-app": "OPEN_FILE",
  "run-cmd": "OPEN_URL",
};

export function masterEnabled(): boolean {
  return localStorage.getItem(MASTER) === "1";
}

export function setMasterEnabled(on: boolean): void {
  localStorage.setItem(MASTER, on ? "1" : "0");
}

export function capabilityFor(action: string): Capability | null {
  return ACTION_CAP[action] ?? null;
}

export function authorize(action: string): { ok: true; capability: Capability } | { ok: false } {
  const cap = capabilityFor(action);
  if (!cap) {
    record({ capability: "OPEN_URL", allowed: false });
    return { ok: false };
  }
  if (!masterEnabled()) {
    record({ capability: cap, allowed: false });
    return { ok: false };
  }
  record({ capability: cap, allowed: true });
  return { ok: true, capability: cap };
}

function record(partial: Pick<AuditEvent, "capability" | "allowed">): void {
  const event: AuditEvent = {
    eventId: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    timestamp: Date.now(),
    source: "user",
    ...partial,
  };
  let list: AuditEvent[] = [];
  try {
    list = JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]") as AuditEvent[];
    if (!Array.isArray(list)) list = [];
  } catch {
    list = [];
  }
  list.push(event);
  if (list.length > AUDIT_MAX) list = list.slice(-AUDIT_MAX);
  try {
    localStorage.setItem(AUDIT_KEY, JSON.stringify(list));
  } catch {
    /* quota */
  }
}
