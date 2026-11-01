/* ═══════════════════════════════════════════════════════════════
   Rimail — ملف الإعدادات (عدّله هو فقط عند النشر)
   لا يحتوي أسرارًا: مفاتيح Firebase للويب علنية بطبيعتها وتحميها قواعد Firestore.
   ═══════════════════════════════════════════════════════════════ */
window.RIMAIL_CONFIG = {
  /* 1) إعدادات Firebase (Project settings ← Your apps ← Web app) */
  firebase: {
  apiKey: "AIzaSyBtHPRnuQSjFS31agzQib1xO1PFBb0b9Cs",
  authDomain: "rimail-app.firebaseapp.com",
  projectId: "rimail-app",
  storageBucket: "rimail-app.firebasestorage.app",
  messagingSenderId: "279304734492",
  appId: "1:279304734492:web:4067f29c42195a870b5cd9",
  measurementId: "G-MRFSMFNZVC"
  },

  /* 2) رفع المرفقات المجاني (Cloudinary → Settings → Upload → Unsigned preset) */
  /* 2-ب) بديل Cloudinary (إن لم يتوفر في بلدك): Supabase Storage — انظر README. اتركه كما هو إن استخدمت Cloudinary */
  supabase: { url: 'https://nhfuzjeoqyqgcxwjsnlw.supabase.co', anonKey: 'sb_publishable_LOh8__PmQlPg9MlNkzrYag_ZoOaWysC', bucket: 'attachments' },
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
