# Summary

## What this is
A **buildable** native shell for [arena.ai/agent](https://arena.ai/agent) branded as Arena **Agent Mode** (pillar mark, sand/leather palette, “the frontier”).

## Models
Arena Agent Mode already routes live frontier models on their site. This app does **not** ship `gpt-6-Astra` or other non-existent weights. Claude Code–style GitHub work happens **inside** Agent Mode after you click Connect GitHub on arena.ai.

## Device control (not malware)
Local, opt-in, confirm-each-action: screenshot, clipboard, files, notifications, open a file/app you pick. The remote page is **not** granted OS IPC. No silent remote control of other phones.

## Background
Desktop close → tray (Quit to stop). Wake Lock / Keep Awake. Session URL restored. Browser tabs may still freeze when the OS sleeps; use the native build for long jobs.

## Build
Source only. `npm install` then `npm run tauri:build` / Capacitor. See `BUILD.md`.
