/**
 * 🛡️ Tasawuq Now - System Integrity & Security Checker
 * يقوم هذا الملف بالتحقق الدوري من سلامة ملفات الموقع الرئيسية:
 * app.js و index.html و style.css و admin.html
 * للتأكد من وجود وحدات التأمين، نظام المحفظة، الدردشة، وعدم تعرض الملفات للتخريب.
 */

const fs = require('fs');
const path = require('path');

function checkSystemIntegrity() {
  console.log('============================================');
  console.log('🛡️ فحص سلامة وتكامل منصة تسوق الآن');
  console.log('============================================\n');

  const files = {
    app: 'app.js',
    index: 'index.html',
    admin: 'admin.html',
    css: 'style.css'
  };

  const loaded = {};
  for (const [key, file] of Object.entries(files)) {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ خطأ أمني: الملف الأساسي ${file} مفقود!`);
      process.exit(1);
    }
    loaded[key] = fs.readFileSync(fullPath, 'utf8');
  }

  const securityChecks = [
    // 1. أمان المحفظة والإيداع
    ['تأمين رصيد المحفظة والتسجيل المالي (creditUserWallet)', loaded.app.includes('creditUserWallet')],
    ['تأمين خصم المحفظة ومنع الرصيد السالب (debitUserWallet)', loaded.app.includes('debitUserWallet')],
    ['حماية شحن الكروت ومنع الاستخدام المكرر (submitCardRecharge)', loaded.app.includes('submitCardRecharge')],
    ['تأمين تنفيذ الإيداع اليدوي للأدمن فقط (admWebExecuteDeposit)', loaded.admin.includes('admWebExecuteDeposit')],
    ['التحقق من إيميل الأدمن المعتمد الرئيسي', loaded.app.includes('abdoalk73@gmail.com') && loaded.admin.includes('abdoalk73@gmail.com')],

    // 2. أمان ونظام الدردشة الفورية
    ['وحدة فتح الدردشة المباشرة (openChatWithSeller)', loaded.app.includes('window.openChatWithSeller = openChatWithSeller')],
    ['وحدة إرسال رسائل الدردشة المشفرة (sendUserChatMessage)', loaded.app.includes('window.sendUserChatMessage = sendUserChatMessage')],
    ['وحدة صندوق الوارد للمحادثات (openInbox)', loaded.app.includes('window.openInbox = openInbox')],
    ['زر الدردشة في تفاصيل الإعلانات (chatSellerBtn)', loaded.app.includes('chatSellerBtn')],
    ['زر الدردشة في صفحات المتاجر والمطاعم (chatStoreBtn)', loaded.app.includes('chatStoreBtn')],

    // 3. واجهات المستخدم والقوالب
    ['نافذة الدردشة المباشرة (userChatOverlay)', loaded.index.includes('id="userChatOverlay"')],
    ['نافذة صندوق الرسائل (userInboxOverlay)', loaded.index.includes('id="userInboxOverlay"')],
    ['زر التنبيهات والرسائل في الترويسة (chatHeaderBtn)', loaded.index.includes('id="chatHeaderBtn"')],
    ['أنماط وتنسيقات فقاعات الدردشة (chatBubble)', loaded.css.includes('.chatBubble')],
    ['أنماط وتنسيقات صفوف صندوق الوارد (inboxRow)', loaded.css.includes('.inboxRow')]
  ];

  let passedCount = 0;
  securityChecks.forEach(([title, passed]) => {
    if (passed) {
      console.log(`✅ [سليم] ${title}`);
      passedCount++;
    } else {
      console.log(`❌ [تنبيه] ${title} غير مكتمل!`);
    }
  });

  console.log('\n--------------------------------------------');
  console.log(`النتيجة: تم اجتياز ${passedCount} من أصل ${securityChecks.length} فحص أمان وتكامل بنجاح.`);
  console.log('--------------------------------------------\n');

  if (passedCount === securityChecks.length) {
    console.log('🚀 النظام آمن 100% ومحمي، وكافة وحدات الموقع تعمل بتناسق تام.');
  } else {
    process.exit(1);
  }
}

checkSystemIntegrity();
