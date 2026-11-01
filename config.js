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
  /* 2-ب) بديل Cloudinary (إن لم يتوفر في بلدك): Supabase Storage — انظر README. اتركه كما هو إن استخدمت Cloudinary */
  supabase: { url: 'YOUR_SUPABASE_URL', anonKey: 'YOUR_SUPABASE_ANON_KEY', bucket: 'attachments' },
  cloudinary: { cloudName: 'YOUR_CLOUD_NAME', uploadPreset: 'YOUR_UNSIGNED_PRESET' },

  /* 3) نطاق العناوين الداخلية: name@DOMAIN. يجب أن يطابق ما استخدمته عند البناء (build.py --domain) */
  domain: 'rimail.app',

  /* 4) جسر البريد الخارجي (اختياري): رابط Cloudflare Worker بعد نشره. اتركه فارغًا لتعطيله */
  bridgeUrl: '',

  /* رابط تنزيل ملف APK (اختياري، بعد بنائه) */
  apkUrl: '',

  /* 5) تسجيل الدخول بجوجل (يتطلب تفعيله في Firebase Authentication) */
  googleSignIn: true
};
