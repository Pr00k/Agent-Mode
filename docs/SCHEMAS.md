# Schemas, settings, and errors this project learned from

## Tauri 2 (`tauri.conf.json` + capabilities)

Source of truth: [Tauri configuration schema](https://v2.tauri.app/reference/config/) and [capabilities](https://v2.tauri.app/security/capabilities/).

### Settings we applied
| Field | Value | Why |
|---|---|---|
| `identifier` | `ai.arena.agent` | Reverse-DNS, alphanumeric / `.` / `-` only. `com.tauri.dev` is rejected by `tauri build`. |
| `productName` | `Arena Agent` | Must not contain `/ \ : * ? " < > \|` |
| `version` | semver `1.0.0` | Prefer config over Cargo for bundlers |
| `build.devUrl` | `http://localhost:1420` | Must match Vite `strictPort` or the window is blank |
| `build.frontendDist` | `../dist` | Production assets. Never hardcode `localhost:5173` in app code |
| `app.windows[0].label` | `main` | Capabilities `windows` must match this label |
| `width/height` | `1440×900` | 16:10 desktop default |
| `minWidth/minHeight` | `390×640` | Phone floor |
| `decorations` | `false` | Custom titlebar. Drag via `data-tauri-drag-region` |
| `visible` | `false` | Show after setup to avoid white flash |
| `csp` | `null` | Strict CSP blanks Vite HMR and remote frames. Null avoids that class of errors |
| `bundle.targets` | `all` | Windows / macOS / Linux / plus mobile init |
| `bundle.android.minSdkVersion` | `24` | Schema default, Play-compatible |
| `bundle.iOS.minimumSystemVersion` | `15.0` | Schema default |
| capabilities in `src-tauri/capabilities/` | auto-loaded | Do **not** also list them in `tauri.conf.json` unless you want to *exclude* the others |

### Capability schema (errors we avoid)
- **v1 `allowlist` is invalid** in v2 → `unknown field allowlist`.
- Every plugin used from JS needs `plugin:default` (or a specific `allow-*`) in the capability that matches the window label.
- `core:default` is required or IPC dies.
- Remote pages (`https://arena.ai`) are **not** given `remote.urls` on purpose. Giving the remote site IPC would let it call disk / window APIs. Device bridge stays in the local chrome only.
- Platform-scoped files: `desktop.json` (`linux`/`macOS`/`windows`) vs `mobile.json` (`iOS`/`android`). Desktop plugins on mobile = compile or runtime errors.
- `$schema` points at `gen/schemas/desktop-schema.json` which appears after the first `tauri build`. Missing file is OK until then.

### Webview / iframe errors
- `X-Frame-Options: SAMEORIGIN/DENY` blocks `<iframe>` even inside Tauri. Symptom: empty stage. Native child `Webview` (top-level navigation) is the real fix; the web shell keeps a fallback CTA.
- Do not inject `__TAURI__` into `arena.ai`. Site CSP blocks `ipc.localhost` ([tauri#8476](https://github.com/tauri-apps/tauri/issues/8476)).
- On Linux/Android Tauri cannot distinguish iframe JS from the parent. Another reason the remote origin gets zero capabilities.

## Vite 8

| Setting | Value | Error avoided |
|---|---|---|
| `server.host` | `0.0.0.0` | Preview proxies cannot reach `127.0.0.1` |
| `server.allowedHosts` | `true` | Host-header rejection on `*.e2b.app` |
| `strictPort` | `true` | Port drift vs Tauri `devUrl` |
| `preview.*` | mirrors `server` | `vite preview` would otherwise bind localhost / 4173 |
| no `frame-ancestors 'none'` | — | This shell itself must be embeddable in a preview iframe |
| no proxy of `arena.ai` | — | Breaks recaptcha, GitHub OAuth, cookies |

## PWA (`manifest.webmanifest`)

Required or install fails: `name`, `short_name`, `start_url`, `display`, icons **192** and **512**, served as `application/manifest+json` (`.webmanifest` extension).

Service worker **must not** intercept `https://arena.ai` (opaque / credentialed requests, 401 on manifest-like fetches, stale auth).

## Capacitor 7

- `appId` = same reverse-DNS as Tauri identifier
- `webDir` = `dist`
- Do not set `server.url` in production (that forces live-reload and a blank store build)

## TypeScript / package schema

- `"type": "module"` required for `vite.config.ts` and `scripts/zip.mjs`
- `moduleResolution: bundler` with Vite
- `noEmit: true` — Vite emits, `tsc` only typechecks

## Error cookbook

| Symptom | Cause | Fix in this repo |
|---|---|---|
| Blank Tauri window | `devUrl` ≠ Vite port / CSP / absolute localhost URLs | `1420` + `strictPort` + relative paths + `csp: null` |
| `Command X not allowed by ACL` | missing capability permission | `core:default` + plugin defaults on `windows: ["main"]` |
| `unknown field allowlist` | Tauri v1 config | v2 capabilities only |
| iframe empty | `X-Frame-Options` | fallback UI + native WebView |
| PWA not installable | missing 192/512 icons or wrong MIME | `public/icons/icon-192.png` + `.webmanifest` |
| Host rejected | Vite 5+ `allowedHosts` | `allowedHosts: true` |
| Recaptcha / GitHub login fail | proxy or wrong origin | load `https://arena.ai/agent` as-is |
| Mobile build missing NDK | Android toolchains | documented, not bundled |
