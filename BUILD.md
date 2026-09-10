# بناء Arena Agent — كل المنصات

أحدث حزم مستقرة في هذا الأرشيف:

| الطبقة | النسخة |
|---|---|
| Node | 22+ |
| Vite | 8.3.0 |
| TypeScript | 7.0.2 |
| Tauri | 2.11.4 / crate 2.11 |
| Capacitor | 8.5.1 |
| Keep Awake | 8.x |

## 1) ويب / PWA (الأسرع)

```bash
npm install
npm run dev
```

تثبيت من المتصفح: قائمة → تثبيت التطبيق.

## 2) سطح المكتب (ويندوز / ماك / لينكس)

يحتاج [Rust](https://rustup.rs) + WebView النظام.

```bash
npm install
npm run tauri:build
```

الملف الناتج تحت `src-tauri/target/release/bundle/`.

إغلاق النافذة **يخفي إلى شريط النظام** ولا يوقف Agent. الإيقاف من قائمة الأيقونة → Quit.

## 3) أندرويد

```bash
npm install
npm run build
npx cap add android
npx cap sync
npx cap open android
```

في Android Studio: Build APK / AAB.  
فعّل «عدم تحسين البطارية» للتطبيق حتى لا يقتل النظام العمل بعد إغلاق الشاشة.

## 4) iOS (ماك + Xcode)

```bash
npm install
npm run build
npx cap add ios
npx cap sync
npx cap open ios
```

## الخلفية

- سطح المكتب: العملية تبقى حيّة في الـ tray
- شاشة مقفلة: Wake Lock + Keep Awake (بعد بناء Capacitor/Tauri)
- المتصفح العادي: نظام التشغيل قد يجمّد الصفحة بعد قفل الشاشة — استخدم النسخة الأصلية للعمل المستمر

لا تُعد تحميل إطار Agent إلا إذا ضغطت تحديث. الجلسة تُحفظ وتُستعاد.
