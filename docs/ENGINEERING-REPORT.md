# Agent Mode — engineering report

Date: 2026-09-10  
Repository: `Pr00k/Agent-Mode` branch `arena/01a08b05-agent-mode`  
Product: native shell for Arena Agent Mode (`https://arena.ai/agent`)

This document is the Phase-1 audit plus the Phase-3/10/12 changes that were **proven** from the existing tree. It does **not** claim the client is faster than browsers, has zero bugs, or owns Arena’s model runtime.

---

## 1. Repository audit

| Path | Role |
|---|---|
| `index.html` + `src/main.ts` | UI / chrome entry |
| `src/bridge.ts` | user-gated device tools |
| `src/ota.ts` | content-version check against GitHub raw |
| `src/keepalive.ts` | wake lock, session URL |
| `src-tauri/src/lib.rs` | Tauri host: tray, hide-on-close, two commands |
| iframe `https://arena.ai/agent` | **Agent, auth, search, streaming, GitHub connector** (server) |
| Capacitor config | unused until `cap add`; keep-awake is dynamic import |
| `.github/workflows/release.yml` | tag → Tauri bundle (historically failed without extra Linux deps on some runs) |

No Android/iOS generated trees (`android/`, `src-tauri/gen/`) exist. No Kotlin/Swift sources exist. No Cargo.lock.

## 2. Existing architecture

```
User
 └─ Native window (Tauri) or browser/PWA
     └─ Local chrome (Vite/TS)
         ├─ IPC: show_main, hide_to_tray (local origin only)
         ├─ Device bridge (opt-in, user click)
         └─ iframe https://arena.ai/agent
              ├─ Arena auth / recaptcha / GitHub OAuth
              ├─ model inference (server)
              ├─ streaming / search / diffs (server)
              └─ no Tauri IPC (remote origin not in capabilities)
```

**Decision:** keep this hybrid. Replacing it with Kotlin-first Compose, a client search orchestrator, or HTTP/3 to Arena would invent APIs and Agent capabilities this repo does not own.

## 3. Identified problems (evidence)

| ID | Evidence | Severity |
|---|---|---|
| P1 | `restoreSession` used `startsWith("https://arena.ai")` → `https://arena.ai.evil.com` matches | high |
| P2 | OTA `applyManifest` would inject remote `css` | high |
| P3 | `run-cmd` opened any `http(s)` URL in the Agent iframe | high |
| P4 | clipboard read echoed payload into a toast | medium (privacy) |
| P5 | Tauri `csp: null`; `fs:default` + `process:default` granted though unused | medium |
| P6 | OTA fetch: no timeout, no size cap, no schema | medium |
| P7 | version drift 1.2.0 vs 1.3.0 | low |
| P8 | no tests / CI quality gates on push | medium |
| P9 | `^8.0.0` floating keep-awake | low |
| P10 | screenshot `getVideoTracks()[0]` unchecked | low |

Not problems for this product: “no HTTP/3 client”, “no Room”, “no Kotlin modules”. The Agent transport is the system WebView talking to Arena.

## 4. Security threat model

Assets: OS window, clipboard, notifications, local chrome, user files picked via `<input>`.  
Attackers: malicious iframe content, compromised OTA JSON, open-redirect URLs, prefix-confused hosts.

Trust boundary: **Arena origin is untrusted for native IPC** (already true: no `remote.urls` for arena.ai).  
New rule: Arena URLs used by the chrome must parse as `https` + host `arena.ai` / `*.arena.ai`.

## 5. Final architecture

Unchanged runtime topology. Added:

- `src/core/url.ts` allowlist
- `src/core/ota-schema.ts` fail-closed parser
- `src/core/capabilities.ts` authorize-then-execute
- `src/core/metrics.ts` opt-in diagnostics (`localStorage arena.diag=1`)
- `src/core/platform.ts` capability detection
- `src/core/errors.ts` typed errors
- `tests/*` + `.github/workflows/ci.yml`

## 6. Platform matrix

| Target | Path | Min | Notes |
|---|---|---|---|
| Web / PWA | Vite 8.3.0 | modern Chromium/WebKit/Firefox | iframe may be blocked by X-Frame-Options |
| Desktop | Tauri 2.11 | Win 10 + WebView2; macOS 10.15; Linux WebKitGTK 4.1 | hide-to-tray |
| Android | `tauri android` or Capacitor 8.5.1 | API 24 | not generated in-tree |
| iOS | `tauri ios` / Capacitor | iOS 15 | macOS host required |

## 7. Exact JS versions (resolved)

- Node 22.22.3 (CI: 22)
- vite 8.3.0
- typescript 7.0.2
- @tauri-apps/cli 2.11.4
- @tauri-apps/api 2.11.1
- @tauri-apps/plugin-clipboard-manager 2.3.3
- @tauri-apps/plugin-notification 2.4.0
- @capacitor/core 8.5.1
- @capacitor-community/keep-awake **8.0.1** (pinned; was `^8.0.0`)

## 8. Compatibility

Vite 8.3 + TS 7 + Node 22 is the set already building in this repo (`tsc` + `vite build` green). Capacitor 8 is optional and not required for desktop. Do not mix Capacitor 7 plugins.

## 9. Network protocol matrix

Chrome/WebView to `arena.ai`: whatever the system WebView negotiates (typically HTTP/2 or HTTP/1.1 over TLS). **Not implemented in-process.**  
OTA: HTTPS GET, 8s timeout, 64 KiB cap, GitHub raw / jsDelivr / local `/ota/`.

## 10. Agent state machine

Server-side on Arena. Client shell states only: `BOOTING → AGENT_LOADING → AGENT_READY | AGENT_BLOCKED | OFFLINE`, plus `OTA_AVAILABLE`, `BACKGROUND`.

## 11. Tool capability model

User click → `authorize(action)` → platform API. Master switch `arena.bridge`. No model-to-syscall path. No shell execution.

## 12. WebView bridge security

Tauri commands: `show_main`, `hide_to_tray` on window `main`, `local: true`. Arena origin is not in `remote.urls`. Iframe is not sandboxed because OAuth/recaptcha require it; navigation from chrome uses allowlisted URLs instead.

## 13–16. Storage / cache / search / streaming

Preferences: `localStorage` (non-secrets). Session URL allowlisted. SW caches **same-origin shell only**. Search and streaming remain Arena’s.

## 17. Rust usage

Tauri host only (window/tray). No extra crates for search/index — no local corpus.

## 18. Build matrix

```
npm ci
npm run typecheck
npm test
npm run build
npm run tauri:build   # desktop, needs Rust + WebView
```

## 19–21. Performance / memory / battery

Measured in this environment (not a device lab):

| Check | Result |
|---|---|
| `tsc --noEmit` | pass |
| `vite build` | ~100ms compile historically in this sandbox |
| JS+CSS production | tens of KB for chrome; Agent UI is remote |
| `npm audit --omit=dev` | 0 vulnerabilities |

Client cannot reduce Arena inference latency. Wake Lock is opt-out in settings.

## 22. Security tests added

Prefix-confusion, OTA CSS rejection, non-Arena agentUrl rejection, OTA host allowlist, semver order. Not a full XSS/WebView lab.

## 23–24. Remaining risks / limitations

- Arena X-Frame-Options may blank the iframe in browsers; Tauri child webview is the robust path and is not fully wired as `WebviewBuilder` yet.
- `icon.icns` is not a real ICNS container (ImageMagick fallback).
- No signed release pipeline, no SBOM, no device Macrobenchmark.
- Capacitor `ios.backgroundMode` may be ignored by schema.
- Deep link `arena-agent://` is registered without a handler.
- Cannot build iOS/Android/Windows installers in this Linux sandbox.

## 25. Migration summary

Phase 1 audit → Phase 3 harden allowlists/CSP/capabilities → Phase 10 authorize() → Phase 12 CI + pins.  
**Not done (and not justified here):** Kotlin rewrite, HTTP/3 engine, client search mesh, Room/DataStore.

## 26. Build commands

See `BUILD.md`.
