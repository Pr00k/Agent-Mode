# Arena Agent

تطبيق أصلي يفتح [Arena Agent](https://arena.ai/agent) **كبرنامج** بدل تبويب متصفح.

A native shell for [arena.ai/agent](https://arena.ai/agent) — not a browser tab.

![icon](public/icons/icon-192.png)

## تشغيل فوري / Run

```bash
npm install
npm run dev
```

يفتح على `http://0.0.0.0:1420` — يعمل على الهاتف والحاسوب تلقائياً.

## بناء أصلي / Native

| المنصة | الأمر |
|---|---|
| ويندوز / ماك / لينكس | `npm run tauri:build` |
| أندرويد / iOS (Tauri) | `npm run tauri android init` ثم `npm run tauri android build` |
| أندرويد / iOS (Capacitor) | `npm run build && npx cap add android` |
| PWA | افتح الموقع → تثبيت التطبيق |
| Zip | `npm run zip` → `Arena-Agent.zip` |

متطلبات Tauri: Rust 1.77+ و WebView النظام ([دليل Tauri](https://v2.tauri.app/start/prerequisites/)).

## مميزات

- شريط عنوان أصلي، قائمة جانبية، تبويبات، لوحة أوامر `⌘K`
- اختصارات: `⌘N` محادثة جديدة · `⌘R` تحديث · `⌘1` Agent
- جسر جهاز اختياري (لقطة، حافظة، ملفات، صوت، إشعارات) — لا يُفعّل إلا بموافقتك
- عربي / English
- أحجام عالمية: 1440×900، حد أدنى 390×640
- Tray + deep link `arena-agent://` في النسخة الأصلية
- العمل في الخلفية: إغلاق النافذة يُخفي للتري، الشاشة لا تُوقف المشروع (Wake Lock + Keep Awake)
- البناء: انظر `BUILD.md` — Vite 8.3 · TypeScript 7 · Tauri 2.11 · Capacitor 8.5

## مجلدات

```
src/                 واجهة TypeScript
src-tauri/           محرك Rust / Tauri 2.11
public/              أيقونات + PWA + service worker
docs/SCHEMAS.md      مخططات الإعدادات وتفادي الأخطاء
docs/SUMMARY.md      ما الذي بُني وما الذي لا يمكن بناؤه
```

## رخصة

MIT — انظر `LICENSE`.
