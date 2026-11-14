/**
 * 🤖 بوت واتساب للتحقق وإرسال كود OTP لتطبيق "تسوق الآن"
 * يعمل بمكتبة Baileys المفتوحة المصدر (مجانية 100% بدون أي رسوم)
 * 🔒 محمي بمفتاح سري (Secret Key) ونظام منع السبام وحظر الأرقام (Rate Limiting)
 * ⚡ مزود بنظام Keep-Alive 24/7 لمنع خادم Render من النوم
 * 💾 مزود بنظام حفظ واسترجاع الجلسة سحابياً عبر Supabase لمنع تسجيل الخروج نهائياً
 * 🟢 يدعم فحص الصحة Health Check على المسار الرئيسي لمنع خطأ Deploy Failed في Render
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require('@whiskeysockets/baileys');
const pino = require('pino');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BOT_SECRET_KEY = process.env.BOT_SECRET_KEY || "Tasawuq#Bot2026_SecLock";
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || "https://tasawuq-now-2.onrender.com";

const SUPABASE_KEY = "sb_publishable_6N_kXZ3e5fB4XM7xKKfT-g_7AHN25Tp";
const SUPABASE_HOST = "jtpfpqalibbwdbirzdnk.supabase.co";
const AUTH_DIR = path.join(__dirname, 'auth_info');

let sock = null;
let latestQrData = null;
let isConnected = false;
let isReconnecting = false;

// 🔒 حماية الذاكرة: جلسات التحقق ومعدل التكرار لكل رقم
const otpSessions = new Map();         // phone -> { code, expiresAt, attempts }
const lastSentTimestamps = new Map();  // phone -> timestamp

// تنظيف دوري للجلسات المنتهية كل دقيقة
setInterval(() => {
  const now = Date.now();
  for (const [phone, sess] of otpSessions.entries()) {
    if (sess.expiresAt < now) {
      otpSessions.delete(phone);
    }
  }
}, 60 * 1000);

// ============================================================
// 💾 دوال حفظ واسترجاع جلسة الواتساب من Supabase
// ============================================================
function saveSessionToSupabase(sessionObj) {
  return new Promise((resolve) => {
    try {
      const payload = JSON.stringify({
        id: "wa_bot_session_auth",
        type: "wa_bot_session",
        message: JSON.stringify(sessionObj),
        created_at: Date.now()
      });

      const req = https.request({
        hostname: SUPABASE_HOST,
        path: '/rest/v1/feedback?on_conflict=id',
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=minimal'
        }
      }, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 300);
      });
      req.on('error', () => resolve(false));
      req.write(payload);
      req.end();
    } catch (e) {
      resolve(false);
    }
  });
}

function fetchSessionFromSupabase() {
  return new Promise((resolve) => {
    try {
      https.get({
        hostname: SUPABASE_HOST,
        path: '/rest/v1/feedback?id=eq.wa_bot_session_auth&select=message',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY
        }
      }, (res) => {
        let data = '';
        res.on('data', (c) => data += c);
        res.on('end', () => {
          try {
            const rows = JSON.parse(data);
            if (rows && rows.length > 0 && rows[0].message) {
              resolve(JSON.parse(rows[0].message));
            } else {
              resolve(null);
            }
          } catch(e) {
            resolve(null);
          }
        });
      }).on('error', () => resolve(null));
    } catch(e) {
      resolve(null);
    }
  });
}

async function backupAuthToSupabase() {
  try {
    if (!fs.existsSync(AUTH_DIR)) return;
    const files = fs.readdirSync(AUTH_DIR);
    const backup = {};
    for (const f of files) {
      if (f.endsWith('.json')) {
        backup[f] = fs.readFileSync(path.join(AUTH_DIR, f), 'utf8');
      }
    }
    if (Object.keys(backup).length === 0) return;
    await saveSessionToSupabase(backup);
    console.log('☁️ تم حفظ نسخة احتياطية من جلسة الواتساب في Supabase بنجاح');
  } catch (e) {
    console.warn('Backup error:', e.message);
  }
}

async function restoreAuthFromSupabase() {
  try {
    const credsPath = path.join(AUTH_DIR, 'creds.json');
    if (fs.existsSync(credsPath)) {
      console.log('📁 بيانات الجلسة موجودة مسبقاً على القرص المحلي.');
      return true;
    }
    console.log('⏳ جاري جلب جلسة الواتساب المحفوظة من Supabase...');
    const backup = await fetchSessionFromSupabase();
    if (backup && typeof backup === 'object' && Object.keys(backup).length > 0) {
      if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });
      for (const [filename, content] of Object.entries(backup)) {
        fs.writeFileSync(path.join(AUTH_DIR, filename), content, 'utf8');
      }
      console.log('✅ تم استرجاع جلسة الواتساب بنجاح من Supabase بدون الحاجة لمسح الـ QR!');
      return true;
    }
  } catch (e) {
    console.warn('Restore error:', e.message);
  }
  return false;
}

// ============================================================
// 🤖 تشغيل اتصال الواتساب عبر مكتبة Baileys
// ============================================================
async function connectToWhatsApp() {
  if (isReconnecting) return;
  isReconnecting = true;

  try {
    // محاولة استرجاع الجلسة من سوبابيز أولاً إن لم تكن متوفرة محلياً
    await restoreAuthFromSupabase();

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    if (sock && sock.ev) {
      try { sock.ev.removeAllListeners(); } catch (e) {}
    }

    sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
      browser: ['تسوق الآن', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', async () => {
      await saveCreds();
      await backupAuthToSupabase();
    });

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        latestQrData = qr;
        isConnected = false;
        console.log('📌 كود QR جديد تم توليده. امسحه عبر واتساب لربط البوت: ' + RENDER_EXTERNAL_URL + '/qr');
      }

      if (connection === 'close') {
        isConnected = false;
        const statusCode = (lastDisconnect?.error)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`⚠️ تم إغلاق اتصال الواتساب (رمز: ${statusCode}). جاري إعادة الاتصال:`, shouldReconnect);
        
        if (shouldReconnect) {
          setTimeout(() => {
            isReconnecting = false;
            connectToWhatsApp();
          }, 3000);
        } else {
          console.log('❌ تم تسجيل الخروج من جلسة الواتساب. يلزم مسح QR جديد.');
          isReconnecting = false;
        }
      } else if (connection === 'open') {
        isConnected = true;
        latestQrData = null;
        isReconnecting = false;
        console.log('✅ تم اتصال بوت الواتساب بنجاح وهو متصل وجاهز لإرسال الأكواد!');
        backupAuthToSupabase();
      }
    });
  } catch (err) {
    console.error('❌ خطأ في تشغيل Baileys:', err);
    setTimeout(() => {
      isReconnecting = false;
      connectToWhatsApp();
    }, 5000);
  }
}

// 🛡️ ميدلوير التحقق من المفتاح السري لخدمة البوت
function verifySecret(req, res, next) {
  const clientSecret = req.headers['x-bot-secret'] || req.query.secret;
  if (!clientSecret || clientSecret !== BOT_SECRET_KEY) {
    return res.status(401).json({ ok: false, error: 'غير مصرح: المفتاح السري للبوت غير صحيح' });
  }
  next();
}

// 📌 المسار الرئيسي 200 OK لفحص صحة السيرفر من Render ومنع خطأ Deploy Failed
app.get('/', (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="utf-8">
      <title>بوت واتساب - تسوق الآن</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px 20px; background: #0f172a; color: #f8fafc; }
        .card { max-width: 480px; margin: auto; background: #1e293b; padding: 30px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
        .btn { display: inline-block; padding: 12px 24px; background: #0284c7; color: #fff; text-decoration: none; border-radius: 12px; font-weight: 800; margin-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2 style="color:#38bdf8">🤖 خادم بوت واتساب - تسوق الآن</h2>
        <p style="color:#94a3b8">الحالة: <b style="color:${isConnected ? '#4ade80' : '#fbbf24'}">${isConnected ? '🟢 متصل وجاهز 24/7' : '🟡 بانتظار مسح كود الـ QR'}</b></p>
        <p style="font-size:13px;color:#cbd5e1">الخادم يعمل بنجاح على Render (Health Check 200 OK)</p>
        <a href="/qr" class="btn">📲 مسح كود QR وربط الجهاز</a>
      </div>
    </body>
    </html>
  `);
});

// 📌 مسار Health Check القياسي لـ Render
app.get('/healthz', (req, res) => {
  res.status(200).json({ ok: true, status: 'healthy', uptime: process.uptime() });
});

// 📌 صفحة عرض كود الـ QR لمسحه بكاميرا الهاتف (ربط جهاز)
app.get('/qr', async (req, res) => {
  if (isConnected) {
    return res.send(`
      <div style="font-family:sans-serif;text-align:center;padding:40px;direction:rtl">
        <h2 style="color:#059669">✅ بوت الواتساب متصل بنجاح!</h2>
        <p style="font-size:15px;color:#334155">البوت جاهز حالياً ومحمي بالكامل لإرسال أكواد التحقق لجميع مستخدمي تطبيق تسوق الآن.</p>
        <div style="margin-top:20px;padding:12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;display:inline-block">
          🟢 الجلسة محفوظة سحابياً في Supabase ولن تنفصل عند إعادة تشغيل السيرفر.
        </div>
      </div>
    `);
  }

  if (!latestQrData) {
    return res.send(`
      <div style="font-family:sans-serif;text-align:center;padding:40px;direction:rtl">
        <h3>⏳ جاري توليد كود الـ QR...</h3>
        <p>قم بتحديث الصفحة بعد ثوانٍ.</p>
        <script>setTimeout(() => location.reload(), 3000);</script>
      </div>
    `);
  }

  try {
    const qrImage = await QRCode.toDataURL(latestQrData);
    res.send(`
      <div style="font-family:sans-serif;text-align:center;padding:30px;direction:rtl;max-width:500px;margin:auto">
        <h2 style="color:#0f766e">📲 ربط بوت واتساب لتطبيق "تسوق الآن"</h2>
        <p style="color:#64748b;font-size:14px">افتح تطبيق واتساب على هاتفك > الإعدادات > الأجهزة المرتبطة > ربط جهاز، وامسح الكود التالي:</p>
        <div style="margin:20px 0;padding:15px;background:#fff;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.1);display:inline-block">
          <img src="${qrImage}" style="width:260px;height:260px" alt="WhatsApp QR Code">
        </div>
        <p style="font-size:12px;color:#94a3b8">يتم تحديث الكود تلقائياً كل 20 ثانية لحمايتك.</p>
        <script>setTimeout(() => location.reload(), 20000);</script>
      </div>
    `);
  } catch (err) {
    res.status(500).send('خطأ في توليد QR');
  }
});

// 📌 مسار فحص حالة البوت
app.get('/status', (req, res) => {
  res.json({
    ok: true,
    version: '2.1.0',
    connected: isConnected,
    hasQr: !!latestQrData
  });
});

// 📌 إرسال كود OTP إلى رقم هاتف المستلم عبر واتساب (محمي بالمفتاح والـ Rate Limiting)
app.post('/send-otp', verifySecret, async (req, res) => {
  try {
    const { phone, code, message } = req.body;

    if (!phone) {
      return res.status(400).json({ ok: false, msg: 'رقم الهاتف مطلوب' });
    }

    if (!isConnected || !sock) {
      return res.status(503).json({
        ok: false,
        msg: 'بوت الواتساب غير متصل حالياً. يرجى مسح كود QR أولاً من الرابط /qr'
      });
    }

    // تنسيق الرقم بصيغة واتساب الدولية: 21891XXXXXXX
    let clean = String(phone).replace(/[^0-9]/g, '');
    if (clean.startsWith('00218')) clean = clean.slice(2);
    else if (clean.startsWith('0')) clean = '218' + clean.slice(1);
    else if (!clean.startsWith('218')) clean = '218' + clean;

    // 🔒 حماية من السبام وحظر واتساب: منع إرسال كود لنفس الرقم قبل مرور 60 ثانية
    const now = Date.now();
    const lastSent = lastSentTimestamps.get(clean) || 0;
    const diff = Math.floor((now - lastSent) / 1000);
    if (diff < 60) {
      return res.status(429).json({
        ok: false,
        msg: `يرجى الانتظار ${60 - diff} ثانية قبل طلب كود جديد لهذا الرقم.`
      });
    }

    // توليد كود عشوائي مؤمّن من 4 أرقام إذا لم يُمرر
    const finalCode = (code && String(code).length === 4) 
      ? String(code) 
      : Math.floor(1000 + Math.random() * 9000).toString();

    const jid = `${clean}@s.whatsapp.net`;
    const textMsg = message || `رمز التحقق لتسجيل الدخول في تطبيق تسوق الآن هو: [ ${finalCode} ] - صالح لمدة 5 دقائق.`;

    await sock.sendMessage(jid, { text: textMsg });

    // تسجيل آخر إرسال وحفظ الجلسة بالسيرفر للتحقق لاحقاً
    lastSentTimestamps.set(clean, now);
    otpSessions.set(clean, {
      code: finalCode,
      expiresAt: now + 5 * 60 * 1000,
      attempts: 0
    });

    console.log(`✅ تم بنجاح إرسال كود التحقق إلى الرقم: ${clean}`);

    // 🔒 حماية قصوى: لا نرجع الكود في الاستجابة نهائياً لمنع أي تلاعب من المتصفح
    return res.json({ 
      ok: true, 
      phone: clean, 
      msg: 'تم إرسال كود التحقق بنجاح عبر تطبيق واتساب' 
    });
  } catch (err) {
    console.error('❌ خطأ أثناء إرسال رسالة واتساب:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// 📌 مسار فحص صحة الكود على السيرفر (Server-side OTP Verification)
app.post('/verify-otp', verifySecret, (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ ok: false, msg: 'رقم الهاتف والكود مطلوبان' });
    }

    let clean = String(phone).replace(/[^0-9]/g, '');
    if (clean.startsWith('00218')) clean = clean.slice(2);
    else if (clean.startsWith('0')) clean = '218' + clean.slice(1);
    else if (!clean.startsWith('218')) clean = '218' + clean;

    const session = otpSessions.get(clean);
    if (!session) {
      return res.status(400).json({ ok: false, msg: 'انتهت صلاحية الكود أو لم يتم إرساله، أعد المحاولة' });
    }

    if (Date.now() > session.expiresAt) {
      otpSessions.delete(clean);
      return res.status(400).json({ ok: false, msg: 'انتهت صلاحية كود التحقق، يرجى طلب كود جديد' });
    }

    if (session.attempts >= 5) {
      otpSessions.delete(clean);
      return res.status(429).json({ ok: false, msg: 'تجاوزت الحد الأقصى للمحاولات الخاطئة. اطلب كوداً جديداً' });
    }

    if (session.code !== String(code).trim()) {
      session.attempts++;
      return res.status(400).json({ ok: false, msg: 'كود التحقق غير صحيح، تأكد من رسالة الواتساب' });
    }

    // الكود صحيح 100% -> نمسحه لمنع إعادة استخدامه
    otpSessions.delete(clean);
    return res.json({ ok: true, verified: true, msg: 'تم التحقق بنجاح' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ⚡ نظام الحفاظ على استمرار عمل البوت 24/7 على Render ومنع الدخول في وضع السكون (Sleep)
setInterval(() => {
  try {
    const pingUrl = `${RENDER_EXTERNAL_URL}/status`;
    const protocol = pingUrl.startsWith('https') ? require('https') : require('http');
    protocol.get(pingUrl, () => {}).on('error', () => {});
  } catch (e) {}
}, 5 * 60 * 1000); // كل 5 دقائق

// الاستماع على 0.0.0.0 ليتمكن Render من الوصول إليه بدون أي عوائق
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 خادم بوت واتساب المحمي يعمل بنجاح على المنفذ: ${PORT}`);
  connectToWhatsApp();
});
