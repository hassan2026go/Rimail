/* ═══════════════════════════════════════════════════════════════
   Rimail — ملف الإعدادات (عدّله هو فقط عند النشر)
   لا يحتوي أسرارًا: مفاتيح Firebase للويب علنية بطبيعتها وتحميها قواعد Firestore.
   ═══════════════════════════════════════════════════════════════ */
window.RIMAIL_CONFIG = {
  /* 1) إعدادات Firebase (Project settings ← Your apps ← Web app) */
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT.firebaseapp.com',
    projectId: 'YOUR_PROJECT',
    appId: 'YOUR_APP_ID'
  },

  /* 2) رفع المرفقات المجاني (Cloudinary → Settings → Upload → Unsigned preset) */
  cloudinary: { cloudName: 'YOUR_CLOUD_NAME', uploadPreset: 'YOUR_UNSIGNED_PRESET' },

  /* 3) نطاق العناوين الداخلية: name@DOMAIN. يجب أن يطابق ما استخدمته عند البناء (build.py --domain) */
  domain: 'rimail.app',

  /* 4) جسر البريد الخارجي (اختياري): رابط Cloudflare Worker بعد نشره. اتركه فارغًا لتعطيله */
  bridgeUrl: '',

  /* رابط تنزيل ملف APK (اختياري، بعد بنائه) */
  apkUrl: '',

  /* 5) تسجيل الدخول بجوجل (يتطلب تفعيله في Firebase Authentication) */
  googleSignIn: true,

  /* 6) رسالة هدية تظهر في صندوق الوارد عند إنشاء كل حساب جديد (اتركها فارغة لتعطيلها) */
  giftNote: 'إلى ريم الغالية 💝\n\nهذا بريدك الخاص، صنعته لك بكل حب. اكتبي فيه وارسلي رسائلك ونظّمي مواعيدك وصورك.\nأحبك كثيرًا،\nبابا'
};
