/* Rimail Bridge — Cloudflare Worker
   1) استقبال: Email Routing ← هذا الـWorker ← Firestore (REST بحساب خدمة)
   2) إرسال:  POST /send  (يتحقق من رمز Firebase ثم يرسل عبر Resend)
   الأسرار (wrangler secret put): SA_EMAIL, SA_KEY (المفتاح الخاص PEM), RESEND_KEY
   المتغيرات (wrangler.toml): PROJECT_ID, DOMAIN, ALLOWED_ORIGIN */
import PostalMime from 'postal-mime';

const enc = new TextEncoder();
const b64u = b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64uStr = s => b64u(enc.encode(s));
const fromB64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const json = (o, status = 200, cors = '') => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', ...(cors ? { 'Access-Control-Allow-Origin': cors, Vary: 'Origin' } : {}) } });

/* ── التحقق من رمز Firebase (RS256) ── */
let jwks = null, jwksAt = 0;
async function verifyIdToken(token, env) {
  const [h, p, s] = String(token).split('.'); if (!h || !p || !s) throw new Error('bad token');
  const head = JSON.parse(new TextDecoder().decode(fromB64u(h))), pay = JSON.parse(new TextDecoder().decode(fromB64u(p)));
  if (head.alg !== 'RS256') throw new Error('alg');
  if (!jwks || Date.now() - jwksAt > 36e5) { jwks = (await (await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')).json()).keys; jwksAt = Date.now(); }
  const jwk = jwks.find(k => k.kid === head.kid); if (!jwk) throw new Error('kid');
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  if (!(await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, fromB64u(s), enc.encode(h + '.' + p)))) throw new Error('sig');
  const now = Math.floor(Date.now() / 1000);
  if (pay.aud !== env.PROJECT_ID || pay.iss !== 'https://securetoken.google.com/' + env.PROJECT_ID || pay.exp < now || pay.iat > now + 60 || !pay.sub) throw new Error('claims');
  return pay;
}

/* ── Firestore REST ── */
const FS = env => `https://firestore.googleapis.com/v1/projects/${env.PROJECT_ID}/databases/(default)/documents`;
function toVal(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toVal) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, toVal(x)])) } };
}
const toFields = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, toVal(v)]));
let saTok = null, saExp = 0;
async function saToken(env) {
  if (saTok && Date.now() < saExp) return saTok;
  const now = Math.floor(Date.now() / 1000), claim = { iss: env.SA_EMAIL, scope: 'https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 };
  const body = b64uStr(JSON.stringify({ alg: 'RS256', typ: 'JWT' })) + '.' + b64uStr(JSON.stringify(claim));
  const pem = env.SA_KEY.replace(/\\n/g, '\n').replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pem), c => c.charCodeAt(0)), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = b64u(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(body)));
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + body + '.' + sig });
  const j = await r.json(); if (!j.access_token) throw new Error('sa token'); saTok = j.access_token; saExp = Date.now() + 50 * 60e3; return saTok;
}
const fsGet = async (env, path, tok) => { const r = await fetch(`${FS(env)}/${path}`, { headers: { Authorization: 'Bearer ' + tok } }); return r.ok ? r.json() : null; };

/* ── استقبال البريد الخارجي ── */
const htmlToText = h => h.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, '').replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\n{3,}/g, '\n\n').trim();
async function handleEmail(message, env) {
  const rcpt = message.to.toLowerCase(), user = rcpt.split('@')[0], tok = await saToken(env);
  const u = await fsGet(env, 'usernames/' + encodeURIComponent(user), tok);
  const uid = u?.fields?.uid?.stringValue;
  if (!uid) { message.setReject('550 5.1.1 no such user'); return; }
  const acc = await fsGet(env, 'accounts/' + uid, tok);
  if ((acc?.fields?.status?.stringValue || 'active') === 'banned') { message.setReject('550 5.7.1 mailbox disabled'); return; }
  const raw = await new Response(message.raw).arrayBuffer();
  if (raw.byteLength > 5 * 1024 * 1024) { message.setReject('552 5.3.4 message too large'); return; }
  const mail = await PostalMime.parse(raw);
  const from = (mail.from?.address || message.from || '').toLowerCase(), subject = (mail.subject || '').slice(0, 300);
  const text = (mail.text || htmlToText(mail.html || '')).slice(0, 20000), html = mail.html && mail.html.length <= 58000 ? mail.html : '';
  const spam = /^yes/i.test(message.headers.get('x-spam-status') || '') || /fail/i.test(message.headers.get('authentication-results') || '') && /dmarc=fail/i.test(message.headers.get('authentication-results') || '');
  const id = (crypto.randomUUID().replace(/-/g, '').slice(0, 20)) + '-r', ts = Date.now();
  const doc = { id, from, fromName: (mail.from?.name || '').slice(0, 80), to: [rcpt], cc: (mail.cc || []).map(a => a.address).filter(Boolean).slice(0, 20), bcc: [], subject, body: text, html, ts, folder: spam ? 'spam' : 'inbox',
    read: false, starred: false, starType: 'yellow', important: false, labels: [], archived: false, snoozeUntil: 0, category: 'primary', prevFolder: spam ? 'inbox' : '', trashedAt: spam ? ts : 0, threadId: id,
    atts: [], muted: false, expires: 0, noForward: false, receipt: false, receiptDone: false, filtered: false, sendAt: 0, auto: false, ext: true, invite: null };
  const r = await fetch(`${FS(env)}/mailboxes/${uid}/mails?documentId=${id}`, { method: 'POST', headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: toFields(doc) }) });
  if (!r.ok) throw new Error('firestore ' + r.status);
}

/* ── إرسال بريد خارجي ── */
const rl = new Map();
async function handleSend(req, env) {
  const origin = env.ALLOWED_ORIGIN || '', cors = origin;
  if (req.headers.get('Origin') && req.headers.get('Origin') !== origin) return json({ error: 'origin' }, 403);
  let pay; try { pay = await verifyIdToken((req.headers.get('Authorization') || '').replace(/^Bearer /, ''), env); } catch { return json({ error: 'auth' }, 401, cors); }
  const n = rl.get(pay.sub) || []; const t = Date.now(), recent = n.filter(x => t - x < 36e5); if (recent.length >= 30) return json({ error: 'rate' }, 429, cors); recent.push(t); rl.set(pay.sub, recent);
  const idTok = (req.headers.get('Authorization') || '').slice(7);
  const accR = await fetch(`${FS(env)}/accounts/${pay.sub}`, { headers: { Authorization: 'Bearer ' + idTok } });
  if (!accR.ok) return json({ error: 'account' }, 403, cors);
  const acc = (await accR.json()).fields, username = acc?.username?.stringValue, status = acc?.status?.stringValue || 'active';
  if (!username || status !== 'active') return json({ error: 'status' }, 403, cors);
  const nameDoc = await fsGet(env, 'usernames/' + username, idTok), name = nameDoc?.fields?.name?.stringValue || username;
  let b; try { b = await req.json(); } catch { return json({ error: 'json' }, 400, cors); }
  const em = /^[^\s@<>()\[\],;:"]{1,64}@[a-z0-9.-]+\.[a-z]{2,}$/i, list = a => (Array.isArray(a) ? a : []).filter(x => typeof x === 'string' && em.test(x)).slice(0, 20);
  const to = list(b.to), cc = list(b.cc), bcc = list(b.bcc); if (!to.length && !cc.length && !bcc.length) return json({ error: 'no recipients' }, 400, cors);
  const payload = { from: `${name.replace(/[<>"]/g, '')} <${username}@${env.DOMAIN}>`, to: to.length ? to : undefined, cc: cc.length ? cc : undefined, bcc: bcc.length ? bcc : undefined, reply_to: `${username}@${env.DOMAIN}`,
    subject: String(b.subject || '').slice(0, 300), text: String(b.text || '').slice(0, 20000), html: b.html ? String(b.html).slice(0, 60000) : undefined,
    attachments: (Array.isArray(b.attachments) ? b.attachments : []).filter(a => /^https:\/\/res\.cloudinary\.com\//.test(a.path)).slice(0, 10).map(a => ({ filename: String(a.filename || 'file').slice(0, 100), path: a.path })) };
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!r.ok) return json({ error: 'send', status: r.status }, 502, cors);
  return json({ ok: true }, 200, cors);
}

export default {
  async fetch(req, env) {
    const u = new URL(req.url), origin = env.ALLOWED_ORIGIN || '';
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Max-Age': '86400', Vary: 'Origin' } });
    if (u.pathname === '/send' && req.method === 'POST') return handleSend(req, env);
    if (u.pathname === '/health') return json({ ok: true });
    return json({ error: 'not found' }, 404);
  },
  async email(message, env) { await handleEmail(message, env); }
};
