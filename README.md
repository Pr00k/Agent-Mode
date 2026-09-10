# Agent Mode

غلاف أصلي لـ [Agent Mode](https://arena.ai/agent) من [Arena](https://arena.ai) — ليس تبويب متصفح.

Official native shell for Arena **Agent Mode**.

## تشغيل المصدر (قابل للبناء — غير مبني مسبقاً)

```bash
npm install
npm run dev              # ويب
npm run tauri:build      # ويندوز / ماك / لينكس
```

انظر `BUILD.md`.

## الهوية

- الاسم: **Agent Mode** — Arena
- الشعار: العمود (The Pillar)
- الشعار النصي: *the frontier*
- الألوان: رمل / جلد داكن حسب هوية Arena (harena)

النماذج تعمل على خوادم Arena داخل `/agent` (بما فيها ما تعرضه المنصة من Claude وGPT وGemini وغيرها). هذا الغلاف لا يستضيف أوزاناً محلية ولا نماذج بأسماء غير موجودة مثل gpt-6-Astra.

## التحكم بالجهاز

لوحة **التحكم بالجهاز** اختيارية وموافقة صريحة لكل إجراء:

- لقطة شاشة، حافظة، ملفات، صوت، إشعارات
- فتح تطبيق/ملف تختاره
- GitHub داخل Agent Mode
- لا تحكم صامت، ولا تحكم بهاتف شخص آخر، ولا حقن في صفحة arena.ai

إغلاق النافذة يخفي للتري ولا يوقف الجلسة.

التدقيق الهندسي: `docs/ENGINEERING-REPORT.md`
