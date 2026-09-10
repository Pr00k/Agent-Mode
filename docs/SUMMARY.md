# Summary — what was built, what was not, what those requests actually mean

## What this project is

**Arena Agent** is a native-feeling shell that opens [https://arena.ai/agent](https://arena.ai/agent) as an **application**, not as a Chrome/Safari tab.

- Web / PWA: this folder, `npm run dev` or install the site as an app
- Desktop: Tauri 2 (Windows, macOS, Linux) — `npm run tauri:build`
- Phone: Tauri mobile **or** Capacitor 7 (`npx cap add android|ios`)
- One zip of the source: `npm run zip` → `Arena-Agent.zip`

The live UI is the local chrome (titlebar, sidebar, command palette, device bridge). The model itself stays on Arena’s servers. This app does not replace GPT, and it does not re-host the model.

## Things you named that do not exist (or cannot exist)

| You asked | Reality |
|---|---|
| `gpt-6-Astra`, `Fable 5.1` | There are no public models with these names. Arena Agent routes to whatever models Arena exposes on `/agent`. This shell cannot swap in fictional weights. |
| Response time `−0` | Negative latency is not a physical quantity. We optimize *perceived* start: no heavy UI framework, system fonts, GPU compositing, `content-visibility`, one JS chunk, show chrome before the remote frame paints. Network RTT to `arena.ai` is still the floor. |
| Faster than every browser | The engine **is** the system WebView (Chromium WebView2 / WKWebView / WebKitGTK) — the same engine Chrome/Safari use. We win on *chrome weight* (no tab process, no extensions) via Tauri, not by inventing a faster HTML engine. |
| Automatic control of the phone/computer | Interpreted as: (1) layout adapts to phone vs desktop by itself, (2) an **opt-in Device Bridge** (screenshot, clipboard, files, voice, notifications, share) that **you** trigger. The remote page is **not** given OS control. A silent remote-control implant would be malware and is not included. |

## Best stack actually used (latest that is real)

- **Rust + Tauri 2.11** — smallest native host, all OS webviews
- **Vite 8.2** + **TypeScript 5.9** — no React/Vue runtime on the chrome path
- **Capacitor 7** — store wrappers if you do not want Tauri mobile
- **PWA manifest + SW** — install from the browser
- **GitHub Actions matrix** — Ubuntu / macOS / Windows bundles

## Device bridge (important)

Enabled only by the switch in the sidebar. Then local buttons can:

- capture the screen (browser `getDisplayMedia` — the OS picker always appears)
- read/write clipboard
- pick files (you still drop them on Agent yourself; a cross-origin frame cannot receive files by script)
- dictate to clipboard
- fire a system notification
- share the Agent URL

Arena.ai JavaScript cannot call these.

## What you must run on your machine

This sandbox cannot compile Windows `.msi`, macOS `.dmg`, or Play/App Store binaries (no Xcode, no MSVC, no Android NDK, no Rust/webkit here). The source and the web preview **do** run. On your PC:

```bash
npm install
npm run dev          # web
npm run tauri:dev    # native window (needs Rust + WebView)
npm run tauri:build  # installers
npm run zip          # Arena-Agent.zip
```

## Background work (screen off / window closed)

- **Desktop (Tauri):** close hides to the tray. The Agent webview keeps running until **Quit**.
- **Phone (Capacitor / Tauri mobile):** Keep Awake + background fetch/processing. Also disable battery optimization on Android.
- **Browser tab:** the OS may freeze JS after locking the screen. Use the native build for jobs that must not stop.
- The Agent iframe is **not** reloaded on hide/show. Last URL is restored.

## Global window sizes

- Default desktop: **1440×900** (16:10)
- Minimum: **390×640** (phone)
- Compact sidebar: 64px icon rail
- HUD / compact: settings toggle

## If the Agent pane is empty in a browser

The site likely sent `X-Frame-Options`. Use **فتح Agent**, or build Tauri so the site loads as a top-level WebView (not an iframe).
