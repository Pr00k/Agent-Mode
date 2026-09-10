/** Shell-level domain types. Arena's agent protocol is server-owned and is not reimplemented. */

export type ShellState =
  | "BOOTING"
  | "AGENT_LOADING"
  | "AGENT_READY"
  | "AGENT_BLOCKED"
  | "OFFLINE"
  | "OTA_AVAILABLE"
  | "BACKGROUND";

export type ConnectionState = "offline" | "connecting" | "online" | "degraded";

export type Capability =
  | "SCREENSHOT"
  | "CLIPBOARD_READ"
  | "CLIPBOARD_WRITE"
  | "FILE_READ"
  | "NOTIFICATION"
  | "MICROPHONE"
  | "SHARE"
  | "OPEN_URL"
  | "OPEN_FILE";

export type BridgeAction =
  | "screenshot"
  | "clipboard"
  | "files"
  | "voice"
  | "notify"
  | "share"
  | "open-app"
  | "run-cmd"
  | "github";

export type OtaManifest = {
  contentVersion: string;
  releasedAt?: string;
  agentUrl?: string;
  historyUrl?: string;
  leaderboardUrl?: string;
  theme?: { bg?: string; sand?: string; paper?: string };
  notes?: { ar?: string; en?: string };
};

export type AuditEvent = {
  eventId: string;
  timestamp: number;
  capability: Capability;
  allowed: boolean;
  source: "user";
};
