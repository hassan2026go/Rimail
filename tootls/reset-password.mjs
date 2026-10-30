/* إعادة تعيين كلمة مرور حساب أُنشئ بدون بريد حقيقي (مثل حساب ريم).
   الاستخدام:
     1) Firebase Console ← Project settings ← Service accounts ← Generate new private key ← احفظ الملف باسم serviceAccount.json بجانب هذا الملف
     2) npm i firebase-admin
     3) node reset-password.mjs rim "كلمة-المرور-الجديدة"      (لا ترفع serviceAccount.json إلى أي مكان عام!) */
import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
const [user, pass] = process.argv.slice(2);
if (!user || !pass || pass.length < 8) { console.error('الاستخدام: node reset-password.mjs <username> <password (8+)>'); process.exit(1); }
initializeApp({ credential: cert(JSON.parse(readFileSync(new URL('./serviceAccount.json', import.meta.url)))) });
const u = await getFirestore().doc('usernames/' + user.toLowerCase()).get();
if (!u.exists) { console.error('المستخدم غير موجود'); process.exit(1); }
await getAuth().updateUser(u.data().uid, { password: pass });
console.log('تم تغيير كلمة مرور', user);
