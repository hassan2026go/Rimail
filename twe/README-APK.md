# تحويل Rimail إلى تطبيق أندرويد (APK)

التطبيق الآن **PWA قابل للتثبيت** (أيقونة + ملء الشاشة + عمل دون اتصال للهيكل) وهذا يكفي لمعظم الحالات:
- **أندرويد/Chrome:** افتح الرابط ← قائمة ⋮ ← «تثبيت التطبيق» (أو زر «تثبيت التطبيق» داخل قائمة الحساب).
- **آيفون/Safari:** مشاركة ⬆︎ ← «إضافة إلى الشاشة الرئيسية».

إن أردت ملف **APK** حقيقيًا (لتوزيعه مباشرة على أجهزة العائلة) فالتطبيق يُغلَّف بتقنية TWA (Trusted Web Activity):

## الطريقة الأسهل — بدون برمجة (PWABuilder)
1. انشر التطبيق أولًا على رابط HTTPS (مثل Firebase Hosting: `https://PROJECT.web.app`).
2. افتح https://www.pwabuilder.com والصق الرابط ثم **Start**.
3. اختر **Package for stores ← Android** ثم **Generate**، ونزّل الملف المضغوط.
4. داخله: `app-release-signed.apk` (للتثبيت المباشر) و`app-release-bundle.aab` (لمتجر Play) وملف `signing.keystore` + `signing-key-info.txt` — **احتفظ بهم**، فبدونهم لا تستطيع تحديث التطبيق لاحقًا.
5. خذ بصمة SHA-256 من `signing-key-info.txt` وضعها في `.well-known/assetlinks.json` (انظر `assetlinks.template.json`) على نفس النطاق، حتى يختفي شريط العنوان ويعمل ملء الشاشة. (في Firebase Hosting احذف `"**/.*"` من `ignore` في firebase.json ليُنشر مجلد `.well-known`.)
6. انقل APK إلى الهاتف وثبّته (فعّل «التثبيت من مصادر غير معروفة»).

## الطريقة اليدوية (Bubblewrap CLI)
```
npm i -g @bubblewrap/cli
bubblewrap init --manifest=https://PROJECT.web.app/manifest.webmanifest
bubblewrap build
```
(أو عدّل `twa-manifest.json` المرفق ثم `bubblewrap build`). يحتاج JDK 17 وAndroid SDK، وسيعرض الأداة تنزيلهما تلقائيًا.

## ملاحظات
- لا يمكن بناء APK داخل بيئة التطوير هذه (لا اتصال بالشبكة ولا Android SDK)، لذا جُهّزت الإعدادات والخطوات لتنفيذها على جهازك.
- على استضافة **GitHub Pages** ضمن مسار فرعي (`user.github.io/repo`) لا يمكن التحقق من assetlinks (يتطلب جذر النطاق)، فيظهر شريط عنوان صغير. الحل: Firebase Hosting أو نطاق خاص.
- رفع التطبيق إلى Google Play يتطلب حساب مطوّر (25$ مرة واحدة). التوزيع المباشر بـAPK مجاني.
