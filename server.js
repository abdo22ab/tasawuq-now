/**
 * 🤖 بوت واتساب للتحقق وإرسال كود OTP لتطبيق "تسوق الآن"
 * يعمل بمكتبة Baileys المفتوحة المصدر (مجانية 100% بدون أي رسوم)
 */

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

let sock = null;
let latestQrData = null;
let isConnected = false;

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

  sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      latestQrData = qr;
      isConnected = false;
      console.log('📌 كود QR جديد تم توليده. امسحه عبر واتساب لربط البوت: http://localhost:' + PORT + '/qr');
    }

    if (connection === 'close') {
      isConnected = false;
      const shouldReconnect =
        (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('⚠️ تم إغلاق اتصال الواتساب. جاري إعادة المحاولة:', shouldReconnect);
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === 'open') {
      isConnected = true;
      latestQrData = null;
      console.log('✅ تم اتصال بوت الواتساب بنجاح وجاهز لاستقبال وإرسال أكواد التحقق!');
    }
  });
}

// 📌 صفحة عرض كود الـ QR لمسحه بكاميرا الهاتف (ربط جهاز)
app.get('/qr', async (req, res) => {
  if (isConnected) {
    return res.send(`
      <div style="font-family:sans-serif;text-align:center;padding:40px;direction:rtl">
        <h2 style="color:#059669">✅ بوت الواتساب متصل بنجاح!</h2>
        <p>البوت جاهز حالياً لإرسال أكواد التحقق لكافة مستخدمي تطبيق تسوق الآن.</p>
      </div>
    `);
  }

  if (!latestQrData) {
    return res.send(`
      <div style="font-family:sans-serif;text-align:center;padding:40px;direction:rtl">
        <h3>⏳ جاري توليد كود الـ QR...</h3>
        <p>قم بتحديث الصفحة بعد 3 ثوانٍ.</p>
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
    connected: isConnected,
    hasQr: !!latestQrData
  });
});

// 📌 إرسال كود OTP إلى رقم هاتف المستلم عبر واتساب
app.post('/send-otp', async (req, res) => {
  try {
    const { phone, code, message } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ ok: false, msg: 'رقم الهاتف والكود مطلوبان' });
    }

    if (!isConnected || !sock) {
      return res.status(503).json({
        ok: false,
        msg: 'بوت الواتساب غير متصل حالياً. يرجى مسح كود QR أولاً من الرابط /qr'
      });
    }

    // تنسيق الرقم بصيغة واتساب الدولية: 21891XXXXXXX@s.whatsapp.net
    let clean = String(phone).replace(/[^0-9]/g, '');
    if (clean.startsWith('00218')) clean = clean.slice(2);
    else if (clean.startsWith('0')) clean = '218' + clean.slice(1);
    else if (!clean.startsWith('218')) clean = '218' + clean;

    const jid = `${clean}@s.whatsapp.net`;
    const textMsg = message || `رمز التحقق لتسجيل الدخول في تطبيق تسوق الآن هو: [ ${code} ] - صالح لمدة 5 دقائق.`;

    await sock.sendMessage(jid, { text: textMsg });

    console.log(`✅ تم بنجاح إرسال كود التحقق [${code}] إلى الرقم: ${clean}`);

    return res.json({ ok: true, phone: clean, code: code });
  } catch (err) {
    console.error('❌ خطأ أثناء إرسال رسالة واتساب:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 خادم بوت واتساب يعمل على المنفذ: ${PORT}`);
  connectToWhatsApp();
});
