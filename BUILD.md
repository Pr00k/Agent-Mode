# بناء Agent Mode — مصدر قابل للبناء

```bash
npm install
npm run dev
npm run tauri:build
npx cap add android && npx cap sync
npx cap add ios && npx cap sync
```

Vite 8.3 · TypeScript 7 · Tauri 2.11 · Capacitor 8.5 · Node 22+

لا يتضمن الأرشيف `node_modules` ولا ثنائيات مبنية.

## التحديثات (بدون حذف التطبيق)

بعد البناء، التطبيق يقرأ `ota/manifest.json` من GitHub.
ارفع `contentVersion` هناك فيظهر وسط الشاشة **يتوفر تحديث**.
زر **تحديث** يحدّث المحتوى والجلسة فقط — التطبيق يبقى مثبتاً.
