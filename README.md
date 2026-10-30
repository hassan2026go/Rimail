# Rimail — دليل النشر الكامل (مجاني على Firebase Spark)

## 0) ما الموجود
`index.html` (التطبيق كاملًا) + `config.js` (إعداداتك) + `firestore.rules` + `firebase.json` + `manifest.webmanifest` + `sw.js` + الأيقونات.
مجلدات اختيارية: `bridge/` (جسر البريد الخارجي)، `twa/` (تحويل إلى APK)، `tools/` (استعادة كلمة مرور).

## 1) تجربة محلية فورًا
افتح `index.html` في المتصفح: يعمل **وضعًا تجريبيًا** (البيانات في متصفحك فقط، أول حساب = مشرف).

## 2) الإنتاج على Firebase (مجاني)
1. https://console.firebase.google.com ← Add project (بدون Analytics).
2. **Build ← Authentication ← Sign-in method**: فعّل **Email/Password** و**Google** (للدخول بضغطة واحدة).
   وفي **Settings ← Authorized domains** أضف نطاقك (`PROJECT.web.app` مضاف تلقائيًا).
3. **Build ← Firestore Database ← Create** (Production mode، أقرب منطقة).
4. **Project settings ← Your apps ← Web (</>)** وانسخ الإعدادات إلى `config.js` (`firebase:{...}`).
5. **Rules:** الصق محتوى `firestore.rules` في Firestore ← Rules ← Publish. (المبنى بـ `build.py --domain` يضع نطاقك فيها.)
6. **المرفقات (Cloudinary مجاني):** أنشئ حسابًا ← Settings ← Upload ← Add upload preset ← **Unsigned** ← ضع `cloudName` و`uploadPreset` في `config.js`.
7. **النشر:** `npm i -g firebase-tools` ثم `firebase login` و`firebase init hosting` (public = المجلد الحالي، SPA = no) و`firebase deploy`. (أو GitHub Pages: ارفع المجلد كما هو.)
8. **أنشئ حساب `rim` أولًا ثم حسابك:** سجّل حسابك أنت أولًا، ثم افتح Firestore وأنشئ يدويًا مستند `admins/{uid}` (uid من Authentication ← Users) بأي حقل (مثل `ok: true`) — بهذا تظهر «لوحة الإشراف».
9. لتغيير النطاق الداخلي (`name@rimail.app`): `python3 build.py --domain mydomain.com` ثم ضع نفس القيمة في `config.js` (`domain`).

## 3) التثبيت (PWA) والـAPK
- أندرويد: افتح الرابط في Chrome ← ⋮ ← «تثبيت التطبيق» (أو زر **تثبيت التطبيق** في شاشة الدخول/قائمة الحساب). آيفون: مشاركة ← «إضافة إلى الشاشة الرئيسية».
- APK: راجع `twa/README-APK.md` (PWABuilder بدون برمجة). ضع رابط التنزيل في `config.js` → `apkUrl: 'https://.../rimail.apk'` فيظهر خيار «تنزيل APK» في القائمة.

## 4) مراسلة Gmail وأي بريد خارجي (اختياري — يحتاج نطاقًا مملوكًا)
البريد الخارجي لا يعمل بلا نطاق حقيقي (~10$/سنة)؛ كل الباقي مجاني:
1. اشترِ نطاقًا وأضفه إلى **Cloudflare** (مجاني).
2. Cloudflare ← Email ← **Email Routing** ← فعّله ← Catch-all → **Send to a Worker** (بعد نشر الـWorker).
3. **Resend** (مجاني: 100 رسالة/يوم): أضف نطاقك وفعّل سجلات DNS (SPF/DKIM) وانسخ API key.
4. في `bridge/`: عدّل `wrangler.toml` (PROJECT_ID, DOMAIN, ALLOWED_ORIGIN) ثم:
   `npm i` ثم `npx wrangler secret put RESEND_KEY` و`SA_EMAIL` و`SA_KEY` (من مفتاح حساب خدمة Firebase: client_email و private_key) ثم `npx wrangler deploy`.
5. ضع رابط الـWorker في `config.js` → `bridgeUrl`، وأعد البناء بـ`python3 build.py --domain yourdomain.com --bridge https://rimail-bridge.xxx.workers.dev` (يضيفه إلى سياسة CSP).
6. عندها: الرسائل إلى `x@gmail.com` تُرسَل فعليًا، وما يصل إلى `rim@yourdomain.com` (بما فيه **رموز التحقق** من التطبيقات الخارجية) يظهر في صندوقها، مع وسم «خارجي».
> هذا الجزء لم يُختبر ضد خدمات حقيقية في بيئة التطوير (لا شبكة)، فاختبره برسالة تجريبية بعد النشر.

## 5) استعادة كلمة مرور حساب بلا بريد حقيقي
`tools/reset-password.mjs` (خطواته في أعلى الملف).

## 6) حدود صادقة (قيود الخطة المجانية)
- **التذكيرات، الجدولة، الرد التلقائي، الفلاتر** تعمل أثناء فتح Rimail على أحد الأجهزة (لا توجد Cloud Functions في Spark). عند الانتقال لخطة Blaze يمكن نقلها للخادم.
- **المرفقات** عبر Cloudinary المجاني (حد 10 م.ب للملف، وحصة شهرية). الروابط عامة غير قابلة للتخمين.
- **الأمان:** قواعد Firestore تمنع حتى المشرف من قراءة بريد الآخرين؛ CSP صارمة؛ تنقية HTML؛ حظر امتدادات تنفيذية. لا يوجد تشفير طرف-لطرف، ولا مصادقة ثنائية حقيقية (قفل التطبيق محلي لكل جهاز).
- حصة Spark: 50 ألف قراءة/20 ألف كتابة يوميًا — تكفي مئات المستخدمين النشطين.
