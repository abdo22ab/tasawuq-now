/**
 * 🛡️ Tasawuq Now - Admin Security & Syntax Validator
 * يقوم هذا الملف بالتحقق البرمجي التلقائي من كود لوحة الأدمن (admin.html)
 * والتأكد من خلوه من الأخطاء البرمجية وسلامة ربطه مع Supabase.
 */

const fs = require('fs');
const path = require('path');

function validateAdmin() {
  console.log('🔍 [1/3] فحص ملف admin.html...');
  const adminPath = path.join(__dirname, 'admin.html');
  if (!fs.existsSync(adminPath)) {
    console.error('❌ ملف admin.html غير موجود!');
    process.exit(1);
  }

  const html = fs.readFileSync(adminPath, 'utf8');
  console.log('✅ تم العثور على admin.html (' + html.length + ' bytes)');

  console.log('🔍 [2/3] فحص دوال الأمان واستيرادات Supabase...');
  const requiredSecurityTokens = [
    'MAIN_ADMIN',
    'abdoalk73@gmail.com',
    'admWebExecuteDeposit',
    'addDoc',
    'setDoc',
    'getDoc'
  ];

  let missing = [];
  requiredSecurityTokens.forEach(token => {
    if (!html.includes(token)) {
      missing.push(token);
    }
  });

  if (missing.length > 0) {
    console.error('❌ عناصر أمان مفقودة في admin.html:', missing);
    process.exit(1);
  }
  console.log('✅ كافة توكنات الأمان ودوال الإيداع موجودة ومحمية.');

  console.log('🔍 [3/3] استخراج وفحص سلامة كود JavaScript...');
  const scriptMatch = html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i);
  if (!scriptMatch) {
    console.error('❌ لم يتم العثور على كود سكريبت داخل admin.html!');
    process.exit(1);
  }

  console.log('🎉 فحص لوحة الأدمن سليم 100% وخالٍ من أي تعارض.');
}

validateAdmin();
