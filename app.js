import {
  supabase,
  auth,
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  increment,
  runTransaction,
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  objectFromDb,
  ai,
  getGenerativeModel
} from "./supabase-adapter.js?v=6";

// التقاط رابط الإحالة من الرابط عند الدخول
try {
  const prms = new URLSearchParams(window.location.search);
  const refCode = prms.get('ref');
  if (refCode) {
    sessionStorage.setItem('tasawuq_pending_ref', refCode);
  }
} catch(e){}

console.log('🚀 تسوق الآن يعمل بالكامل عبر Supabase');

const IMGBB_API_KEY="114eae2e3072c10adec45b174bd7e67a";
const ADMIN_EMAIL="abdoalk73@gmail.com";
const ADMIN_WHATSAPP="218928476784";
const POST_DURATION_DAYS=30;
const POST_DURATION_MS=POST_DURATION_DAYS*24*60*60*1000;
const EXPIRED_GRACE_DAYS=7;
const RESTAURANT_CATEGORY="المطاعم والمأكولات";
const RESTAURANT_CATEGORY_LEGACY="مطاعم ومأكولات";
const RESTAURANT_CATEGORY_LEGACY2="مطعم مأكولات";
const RESTAURANT_CATEGORY_LEGACY3="مطاعم وغداء";
function isRestaurantCategory(cat){return cat===RESTAURANT_CATEGORY || cat===RESTAURANT_CATEGORY_LEGACY || cat===RESTAURANT_CATEGORY_LEGACY2 || cat===RESTAURANT_CATEGORY_LEGACY3;}
window.isRestaurantCategory=isRestaurantCategory;
const CART_ALLOWED_CATEGORIES=["دراجات هوائية","الخدمات","عقارات للبيع","عقارات للإيجار","موبايل وتابلت","لابتوب وكمبيوتر","ألعاب وألعاب الفيديو","أجهزة منزلية","ملابس رجالية","ملابس نسائية","ملابس أطفال","جمال وصحة","مكياج","المطاعم والمأكولات","مطعم مأكولات","مطاعم ومأكولات","مطاعم وغداء","إلكترونيات","الحيوانات والطيور","العطور"];
const CAR_BRANDS=["تويوتا","هيونداي","كيا","نيسان","هوندا","مازدا","ميتسوبيشي","شيفروليه","فورد","فولكس واجن","أودي","BMW","مرسيدس","لكزس","رينو","بيجو","سيتروين","جيب","لاند روفر","رينج روفر","كاديلاك","فيات","سكودا","سوزوكي","إيسوزو","ديهاتسو","إنفينيتي","أكيورا","BYD","شيري","جيلي","MG","هفال","شانجان","فوتون","جاك","بورش","فيراري","لامبورجيني","مازيراتي","بنتلي","جاكوار","سايبا","تاتا","سوبارو","أوبل","سيات","أخرى"];
const MOTORCYCLE_BRANDS=["هوندا","ياماها","سوزوكي","كاوازاكي","BMW","دوكاتي","KTM","هارلي ديفيدسون","تريومف","أبريليا","بياجيو","فيسبا","بولاريس","رويال إنفيلد","بينيللي","هوسكفارنا","CF Moto","بينجو","هوجان","دايون","أخرى"];
const PHONE_BRANDS=["Apple / آيفون","Samsung / سامسونج","Huawei / هواوي","Xiaomi / شاومي","Oppo / أوبو","Vivo / فيفو","Realme / ريلمي","Nokia / نوكيا","Infinix / إنفينكس","Tecno / تكنو","Honor / هونر","OnePlus / ون بلس","Google Pixel","Sony / سوني","LG / إل جي","Motorola","HTC","Lenovo","Asus","ZTE","itel","Wiko","Alcatel","TCL","Blackberry","آيباد","تابلت سامسونج","تابلت هواوي","تابلت لينوفو","أخرى"];
const COMPUTER_BRANDS=["HP / إتش بي","Dell / ديل","Lenovo / لينوفو","Asus / أسوس","Acer / إيسر","Toshiba / توشيبا","Apple MacBook","MSI","Samsung","Microsoft Surface","Sony Vaio","Fujitsu","Razer","Alienware","LG Gram","Huawei MateBook","Xiaomi Mi Notebook","Gigabyte","Panasonic","Compaq","IBM","ThinkPad","Chromebook","PC تجميع","أخرى"];
const ANIMAL_TYPES=["كلاب","قطط","طيور","أغنام ومواشي","أرانب وقوارض","أسماك وزينة","خيول ودواب","زواحف","أخرى"];
const PERFUME_TYPES=["عطور رجالية","عطور نسائية","عطور عربية","بخور وعود","مسك","ماركات عالمية","معطرات جسم","أخرى"];

const SUB_CATEGORIES={
  "سيارات ومركبات":{title:"🚗 اختر الماركة:",items:CAR_BRANDS},
  "دراجات نارية":{title:"🏍️ اختر الماركة:",items:MOTORCYCLE_BRANDS},
  "موبايل وتابلت":{title:"📱 النوع والماركة:",items:["📱 هواتف ذكية","📟 أجهزة تابلت وآيباد","⌚ ساعات وإكسسوارات",...PHONE_BRANDS]},
  "لابتوب وكمبيوتر":{title:"💻 النوع والماركة:",items:["💻 لابتوب محمول","🖥️ كمبيوتر مكتبي (PC)","🎮 تجميعات ألعاب",...COMPUTER_BRANDS]},
  "عقارات للبيع":{title:"🏠 نوع العقار:",items:["شقق للبيع","فلل ومنازل","أراضي للبيع","محلات ومعارض","مكاتب إدارية","استراحات ومزارع","عمارات كاملة"]},
  "عقارات للإيجار":{title:"🔑 نوع العقار:",items:["شقق للإيجار","فلل للإيجار","محلات تجارية","مكاتب إدارية","استراحات للإيجار"]},
  "أجهزة منزلية":{title:"🧊 نوع الجهاز:",items:["ثلاجات ومجمدات","غسالات ونشافات","أفران وميكروويف","شاشات وتلفزيونات","مكيفات وتدفئة","أجهزة ومطابخ"]},
  "ألعاب وألعاب الفيديو":{title:"🎮 المنصة والنوع:",items:["PlayStation 5","PlayStation 4","Xbox Series X/S","Nintendo Switch","أشرطة وألعاب","إكسسوارات ودراعات"]},
  "الحيوانات والطيور":{title:"🐾 اختر النوع:",items:ANIMAL_TYPES},
  "العطور":{title:"🌸 اختر النوع:",items:PERFUME_TYPES}
};

const CATEGORIES=[
{name:"الشركات والمتاجر",icon:"",isStore:true,iconName:"store",color:"#f59e0b"},
{name:"المطاعم والمأكولات",icon:"🍽️",isRestaurantDirectory:true,iconName:"utensils-crossed",color:"#dc2626",image:"restaurant.png"},
{name:"سيارات ومركبات",icon:"🚗",iconName:"car",color:"#3b82f6",image:"car.png"},
{name:"دراجات نارية",icon:"🏍️",iconName:"bike",color:"#ef4444",image:"motorcycle.png"},
{name:"دراجات هوائية",icon:"🚲",iconName:"bike",color:"#22c55e",image:"bicycle.png"},
{name:"موبايل وتابلت",icon:"📱",iconName:"smartphone",color:"#a855f7",image:"phone.png"},
{name:"لابتوب وكمبيوتر",icon:"💻",iconName:"laptop",color:"#0284c7",image:"laptop.png"},
{name:"الخدمات",icon:"🛠️",iconName:"wrench",color:"#ea580c",image:"services.png"},
{name:"عقارات للبيع",icon:"🏠",iconName:"home",color:"#10b981",image:"house.png"},
{name:"عقارات للإيجار",icon:"🔑",iconName:"key",color:"#059669",image:"house.png"},
{name:"ألعاب وألعاب الفيديو",icon:"🎮",iconName:"gamepad-2",color:"#8b5cf6",image:"games.png"},
{name:"أجهزة منزلية",icon:"🧊",iconName:"refrigerator",color:"#0891b2",image:"appliances.png"},
{name:"ملابس رجالية",icon:"👔",iconName:"shirt",color:"#0f766e",image:"men-clothes.png"},
{name:"ملابس نسائية",icon:"👗",iconName:"shirt",color:"#db2777",image:"women-clothes.png"},
{name:"ملابس أطفال",icon:"👶",iconName:"baby",color:"#f59e0b",image:"kids-clothes.png"},
{name:"جمال وصحة",icon:"💆",iconName:"sparkles",color:"#ec4899",image:"beauty.png"},
{name:"مكياج",icon:"💄",iconName:"palette",color:"#e11d48",image:"makeup.png"},
{name:"إلكترونيات",icon:"🔌",iconName:"plug",color:"#0ea5e9",image:"electronics.png"},
{name:"الحيوانات والطيور",icon:"🐾",iconName:"paw-print",color:"#8b5cf6",image:"animals.png"},
{name:"العطور",icon:"🌸",iconName:"spray-can",color:"#ec4899",image:"perfume.png"},
{name:"الكل",icon:"✨",iconName:"layout-grid",color:"#38bdf8"}
];

const FORBIDDEN_WORDS=["إباحي","اباحي","جنس","جنسي","سكس","عارية","عاري","عريان","عريانة","ملط","دعارة","عاهر","عاهرة","شرموط","شرموطة","قحبة","زانية","زاني","للتعارف","شات جنسي","فتاة ليل","حشيش","كوكايين","هيروين","بانجو","ماريجوانا","ترامادول","كبتاجون","استروكس","مخدر","بندقية للبيع","كلاشنكوف","سلاح للبيع","مسدس للبيع","خرطوش","رصاص للبيع","تهريب","نصب","غش","وهمي","مزيف","porn","sex","nude","xxx","adult","escort","prostitute","whore","fuck","weed","cocaine","heroin","drugs","scam"];
function detectForbidden(t){if(!t)return null;const s=String(t).toLowerCase();for(const w of FORBIDDEN_WORDS){if(s.includes(w.toLowerCase()))return w;}return null;}
function checkContent(t,d){const a=detectForbidden(t);if(a)return{word:a,field:"العنوان"};const b=detectForbidden(d);if(b)return{word:b,field:"الوصف"};return null;}

const RESERVED_USERNAMES=["admin","administrator","root","support","help","tasawuq","tasawuqnow","owner","moderator","mod","official","system","api","www","mail","email"];
function validateUsername(u){if(!u)return{ok:false,msg:"اكتب اسم المستخدم"};const s=String(u).trim().toLowerCase();if(s.length<3)return{ok:false,msg:"الاسم قصير جدًا (3 أحرف على الأقل)"};if(s.length>20)return{ok:false,msg:"الاسم طويل جدًا (20 حرف كحد أقصى)"};if(!/^[a-z][a-z0-9_]*$/.test(s))return{ok:false,msg:"لازم يبدأ بحرف إنجليزي، ويحتوي فقط a-z / 0-9 / _"};if(RESERVED_USERNAMES.includes(s))return{ok:false,msg:"هذا الاسم محجوز للنظام"};return{ok:true,value:s};}

/* ✅ دالات تنسيق والتحقق من رقم الهاتف */
function normalizePhone(p){
  let s = String(p || "").replace(/[^0-9]/g, "");
  if (!s) return "";
  if (s.startsWith("00218")) s = s.slice(5);
  else if (s.startsWith("218")) s = s.slice(3);
  while (s.startsWith("0")) s = s.slice(1);
  if (!s || s.length < 8) return "";
  return "218" + s;
}
window.normalizePhone = normalizePhone;

function formatCallPhone(p){
  const norm = normalizePhone(p);
  if (!norm) return "";
  return "0" + norm.slice(3);
}
window.formatCallPhone = formatCallPhone;

function validatePhone(p){
  if (!p) return {ok: false, msg: "اكتب رقم الواتساب"};
  const digits = String(p).replace(/[^0-9]/g, "");
  if (!digits) return {ok: false, msg: "اكتب رقم الواتساب"};
  const normalized = normalizePhone(digits);
  const rest = normalized.slice(3);
  if (rest.length < 8) return {ok: false, msg: "الرقم قصير جدًا (أدخل رقم هاتف صحيح)"};
  if (rest.length > 12) return {ok: false, msg: "الرقم طويل جدًا، تأكد من الرقم"};
  return {ok: true, value: normalized};
}
window.validatePhone = validatePhone;

// نافذة تأكيد عصرية بديلة لـ window.confirm لمنع حجب المتصفح للرسائل المتتالية
function showConfirmModal(message, options = {}){
  return new Promise((resolve) => {
    let overlay = document.getElementById('appConfirmModalOverlay');
    if(!overlay){
      overlay = document.createElement('div');
      overlay.id = 'appConfirmModalOverlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
      document.body.appendChild(overlay);
    }
    const title = options.title || 'تأكيد الإجراء';
    const confirmText = options.confirmText || 'نعم، تأكيد';
    const cancelText = options.cancelText || 'إلغاء';
    const isDanger = options.danger !== false;

    overlay.innerHTML = `
      <div style="background:#fff;border-radius:18px;max-width:380px;width:100%;padding:22px 20px;text-align:center;box-shadow:0 12px 36px rgba(0,0,0,0.25);font-family:'Cairo',sans-serif;animation:popIn .2s ease-out">
        <div style="font-size:38px;margin-bottom:8px">${options.icon || (isDanger ? '⚠️' : '❓')}</div>
        <div style="font-weight:900;font-size:16px;color:#0f172a;margin-bottom:8px">${title}</div>
        <div style="font-size:13.5px;color:#475569;line-height:1.6;margin-bottom:20px;white-space:pre-line">${escapeHtml(message)}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <button id="appConfirmCancelBtn" style="padding:11px;border:1px solid #cbd5e1;background:#f8fafc;color:#475569;border-radius:10px;font-weight:800;font-family:inherit;font-size:13.5px;cursor:pointer">${cancelText}</button>
          <button id="appConfirmOkBtn" style="padding:11px;border:none;background:${isDanger ? '#e5484d' : '#0284c7'};color:#fff;border-radius:10px;font-weight:800;font-family:inherit;font-size:13.5px;cursor:pointer">${confirmText}</button>
        </div>
      </div>
    `;
    overlay.style.display = 'flex';

    function cleanUp(result){
      overlay.style.display = 'none';
      resolve(result);
    }

    const okBtn = overlay.querySelector('#appConfirmOkBtn');
    const cancelBtn = overlay.querySelector('#appConfirmCancelBtn');
    if(okBtn) okBtn.onclick = () => cleanUp(true);
    if(cancelBtn) cancelBtn.onclick = () => cleanUp(false);
  });
}
window.showConfirmModal = showConfirmModal;

// نافذة إدخال عصرية بديلة لـ window.prompt لمنع تجميد الشاشة أو الحظر في PWA
function showPromptModal(message, defaultValue = '', options = {}){
  return new Promise((resolve) => {
    let overlay = document.getElementById('appPromptModalOverlay');
    if(!overlay){
      overlay = document.createElement('div');
      overlay.id = 'appPromptModalOverlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
      document.body.appendChild(overlay);
    }
    const title = options.title || 'إدخال بيانات';
    const confirmText = options.confirmText || 'تأكيد';
    const cancelText = options.cancelText || 'إلغاء';
    const placeholder = options.placeholder || '';
    const inputType = options.inputType || 'text';

    overlay.innerHTML = `
      <div style="background:#fff;border-radius:18px;max-width:380px;width:100%;padding:22px 20px;text-align:center;box-shadow:0 12px 36px rgba(0,0,0,0.25);font-family:'Cairo',sans-serif;animation:popIn .2s ease-out">
        <div style="font-size:38px;margin-bottom:8px">${options.icon || '✏️'}</div>
        <div style="font-weight:900;font-size:16px;color:#0f172a;margin-bottom:8px">${title}</div>
        <div style="font-size:13.5px;color:#475569;line-height:1.6;margin-bottom:14px;white-space:pre-line">${escapeHtml(message)}</div>
        <input id="appPromptModalInput" type="${inputType}" value="${escapeHtml(defaultValue || '')}" placeholder="${escapeHtml(placeholder)}" style="width:100%;box-sizing:border-box;padding:10px 12px;border:1.5px solid #cbd5e1;border-radius:10px;font-family:inherit;font-size:14px;margin-bottom:16px;outline:none" />
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <button id="appPromptCancelBtn" style="padding:11px;border:1px solid #cbd5e1;background:#f8fafc;color:#475569;border-radius:10px;font-weight:800;font-family:inherit;font-size:13.5px;cursor:pointer">${cancelText}</button>
          <button id="appPromptOkBtn" style="padding:11px;border:none;background:#0284c7;color:#fff;border-radius:10px;font-weight:800;font-family:inherit;font-size:13.5px;cursor:pointer">${confirmText}</button>
        </div>
      </div>
    `;
    overlay.style.display = 'flex';

    const input = overlay.querySelector('#appPromptModalInput');
    const okBtn = overlay.querySelector('#appPromptOkBtn');
    const cancelBtn = overlay.querySelector('#appPromptCancelBtn');

    function cleanUp(val){
      overlay.style.display = 'none';
      resolve(val);
    }

    if(input){
      setTimeout(() => {
        try { input.focus(); input.select(); } catch(e){}
      }, 50);
      input.onkeydown = (e) => {
        if(e.key === 'Enter') cleanUp(input.value);
        if(e.key === 'Escape') cleanUp(null);
      };
    }
    if(okBtn) okBtn.onclick = () => cleanUp(input ? input.value : '');
    if(cancelBtn) cancelBtn.onclick = () => cleanUp(null);
  });
}
window.showPromptModal = showPromptModal;

window.normalizeUsernameInput=()=>{const i=document.getElementById("myUsername");if(!i)return;i.value=i.value.toLowerCase().replace(/[^a-z0-9_]/g,"").slice(0,20);};
window.normalizePhoneInput=()=>{
  const i=document.getElementById("myPhone");
  if(!i)return;
  let v=i.value.replace(/[^0-9+]/g,"");
  if(v.indexOf("+")>0) v=v[0]+v.slice(1).replace(/\+/g,"");
  i.value=v.slice(0,16);
};

const userLimitsCache={};
const DEFAULT_LIMIT=3;
const STORE_DEFAULT_LIMIT=20;
async function getUserLimit(uid){if(!uid)return DEFAULT_LIMIT;if(userLimitsCache[uid]!==undefined)return userLimitsCache[uid];try{const snap=await getDoc(doc(db,"userLimits",uid));if(snap.exists()){const l=snap.data().limit||DEFAULT_LIMIT;userLimitsCache[uid]=l;return l;}}catch(e){}userLimitsCache[uid]=DEFAULT_LIMIT;return DEFAULT_LIMIT;}
async function getUserStoreLimit(uid){if(!uid)return STORE_DEFAULT_LIMIT;try{const snap=await getDoc(doc(db,"userLimits",uid));if(snap.exists()){return snap.data().storeLimit||STORE_DEFAULT_LIMIT;}}catch(e){}return STORE_DEFAULT_LIMIT;}
async function setUserLimit(uid,limit,extra={}){try{const data={limit:Number(limit),email:extra.email||"",name:extra.name||"",username:extra.username||"",memberNo:extra.memberNo||null,updatedAt:Date.now()};if(extra.storeLimit!==undefined)data.storeLimit=Number(extra.storeLimit);await setDoc(doc(db,"userLimits",uid),data,{merge:true});userLimitsCache[uid]=Number(limit);return true;}catch(e){return false;}}

let isAdmin=false,showOnlyMine=false,showOnlyFavorites=false,currentCategory="الكل",currentSubCategory="الكل";
let currentSort="newest",currentPriceMin=null,currentPriceMax=null,currentAdTypeFilter="all";
const LIBYA_CITIES={"الغرب":["طرابلس","جنزور","تاجوراء","القره بوللي","سوق الجمعة","أبوسليم","عين زارة","قصر بن غشير","العزيزية","الماية","الزاوية","صرمان","صبراتة","العجيلات","زوارة","الجميل","رقدالين","زلطن","الرياينة","الخمس","زليتن","مسلاتة","مصراتة","ترهونة","بني وليد","غريان","مزدة","يفرن","جادو","نالوت","غدامس","الزنتان","الرجبان","الرحيبات","القلعة","ككلة","تيجي","الشقيقة","الأصابعة","ورشفانة","القواليش"],"الشرق":["بنغازي","البيضاء","درنة","طبرق","المرج","شحات","سوسة","الأبرق","القبة","الأبيار","سلوق","توكرة","قمينس","إجدابيا","البريقة","رأس لانوف","العقيلة","أمساعد","بنينة"],"الوسط":["سرت","مرادة","بن جواد","النوفلية","أبوقرين","الوشكة","هون","ودان","سوكنة","زلة","الجفرة","أوجلة","جالو"],"الجنوب":["سبها","أوباري","مرزق","غات","الشاطئ","براك الشاطئ","تمنهنت","القطرون","تراغن","أدري","الكفرة","ربيانة","تازربو","الغريفة"]};
function saveCachedProfile(prof){
  if(!prof) return;
  try {
    localStorage.setItem("tasawuq_cached_profile", JSON.stringify(prof));
  } catch(e){}
}
window.saveCachedProfile = saveCachedProfile;

let currentCity="الكل",allPosts=[],allStores=[],currentStoreFilter=null,pendingAction=null,editingPostId=null;
let myProfile = (() => {
  try {
    const cp = localStorage.getItem("tasawuq_cached_profile");
    return cp ? JSON.parse(cp) : null;
  } catch(e) { return null; }
})();
window.myProfile = myProfile;
let myStore=null,unsubProfile=null,unsubStore=null,profileCreateTried=false,sellerPanelUid=null,selectedStars=0,selectedImages=[],storeLogoImage=null,storeCoverImage=null,pendingAutoUpgrade=null,allReports=[],reportsListenerStarted=false,allLimits=[],limitsListenerStarted=false,storesListenerStarted=false,unsubStores=null,storesModTab="all";
let cart={storeId:null,storeName:"",storePhone:"",items:[]};
let myFollowing=[];
let unsubFollowing=null;
let allStoreRatings={};
let currentStoreSort="newest";
let currentStoreSearch="";
let currentStoreItems=[];
let editStoreLogoImage=null;
let editStoreCurrentId=null;
let _tempStoreData=null;
let currentStoreHelpers=[];
window._globalChatPollerTimer = null;
window._globalOrdersPollerTimer = null;
window._chatRealtimeChannel = null;
window._globalLastChatCheckTs = Date.now() - (120 * 1000);
window._globalSeenMsgIds = new Set();
window._globalLastSeenOrderNo = 0;
let compareList=[];
try{compareList=JSON.parse(localStorage.getItem('compareList')||'[]');}catch(e){compareList=[];}
function saveCompare(){try{localStorage.setItem('compareList',JSON.stringify(compareList));}catch(e){}}

function isRestaurantStore(store){return !!(store && isRestaurantCategory(store.category));}

let _toastTimer=null;
function showToast(text,type="info",duration=2200,onClick=null){
  let t=document.getElementById("globalToast");
  if(!t){
    t=document.createElement("div");
    t.id="globalToast";
    t.className="toast";
    document.body.appendChild(t);
  }
  t.textContent=text;
  t.className="toast "+type;
  if(typeof onClick === "function"){
    t.style.cursor = "pointer";
    t.onclick = (e) => {
      e.stopPropagation();
      t.classList.remove("show");
      onClick();
    };
  } else {
    t.style.cursor = "default";
    t.onclick = null;
  }
  void t.offsetWidth;
  t.classList.add("show");
  if(_toastTimer)clearTimeout(_toastTimer);
  _toastTimer=setTimeout(()=>{t.classList.remove("show");},duration);
}
window.showToast=showToast;

function showFloatingButtons(){
  const btn1 = document.getElementById('luckyWheelBtn');
  const btn2 = document.getElementById('aiChatBtn');
  const status = typeof getWheelStatus === 'function' ? getWheelStatus() : { canSpin: true };
  if(btn1) btn1.style.display = status.canSpin ? 'flex' : 'none';
  if(btn2) btn2.style.display = 'flex';
}
function hideFloatingButtons(){
  const btn1 = document.getElementById('luckyWheelBtn');
  const btn2 = document.getElementById('aiChatBtn');
  if(btn1) btn1.style.display = 'none';
  if(btn2) btn2.style.display = 'none';
  const chatWin = document.getElementById('aiChatWindow');
  if(chatWin) chatWin.style.display = 'none';
}
window.showFloatingButtons = showFloatingButtons;
window.hideFloatingButtons = hideFloatingButtons;

function refreshNavIcons(){
  if(window.lucide && typeof lucide.createIcons === 'function'){
    try{ lucide.createIcons(); }catch(e){ console.warn('Lucide error:', e); }
  }
}
window.refreshNavIcons = refreshNavIcons;
refreshNavIcons();
setTimeout(refreshNavIcons, 300);
setTimeout(refreshNavIcons, 1500);

/* ============================================
   🏆 نظام النقاط الكامل
   ============================================ */
const POINTS_TIERS = [
  { name: 'برونزي',  icon: '🥉', min: 0,    max: 499,   color: '#f59e0b', discount: 0 },
  { name: 'فضي',     icon: '🥈', min: 500,  max: 1999,  color: '#94a3b8', discount: 5 },
  { name: 'ذهبي',    icon: '🥇', min: 2000, max: 4999,  color: '#eab308', discount: 10 },
  { name: 'ماسي',    icon: '💎', min: 5000, max: 999999, color: '#6366f1', discount: 20 }
];

const POINTS_REWARDS = [
  { id: 'featured_1',  icon: '⭐', category: 'featured', title: 'إعلان مميز — يوم واحد',  cost: 250,   desc: 'إعلانك في الأعلى لمدة 24 ساعة' },
  { id: 'featured_3',  icon: '⭐', category: 'featured', title: 'إعلان مميز — 3 أيام',    cost: 400,   desc: 'إعلانك في الأعلى 3 أيام كاملة' },
  { id: 'featured_7',  icon: '⭐', category: 'featured', title: 'إعلان مميز — 7 أيام',    cost: 500,   desc: 'إعلانك في الأعلى أسبوع كامل 🔥' },
  { id: 'featured_30', icon: '⭐', category: 'featured', title: 'إعلان مميز — 30 يوم',    cost: 1500,  desc: 'إعلانك في الأعلى شهر كامل — أفضل قيمة!' },
  { id: 'card_libyana_5', icon: '📱', category: 'cards', title: 'كرت شحن ليبيانا 5 د.ل', cost: 600, desc: 'كرت تعبئة رصيد ليبيانا 5 دينار فوري' },
  { id: 'card_madar_5',   icon: '📱', category: 'cards', title: 'كرت شحن المدار 5 د.ل',   cost: 600, desc: 'كرت تعبئة رصيد المدار 5 دينار فوري' },
  { id: 'card_libyana_10',icon: '🎁', category: 'cards', title: 'كرت شحن ليبيانا 10 د.ل',cost: 1000, desc: 'كرت تعبئة رصيد ليبيانا 10 دينار' },
  { id: 'card_madar_10',  icon: '🎁', category: 'cards', title: 'كرت شحن المدار 10 د.ل',  cost: 1000, desc: 'كرت تعبئة رصيد المدار 10 دينار' },
  { id: 'discount_50', icon: '🎟️', category: 'extra', title: 'خصم 50% على أي ترقية',     cost: 300,   desc: 'كود خصم لاستخدامه عند الترقية' },
  { id: 'extra_post',  icon: '💎', category: 'extra', title: 'إعلان إضافي (تجاوز الحد)',  cost: 250,   desc: 'انشر إعلان فوق الحد المسموح' },
  { id: 'custom_logo',   icon: '🎨', category: 'vip', title: 'شعار مخصص للمتجر',       cost: 3000,  desc: 'يصمم لك الأدمن شعار خاص لمتجرك' },
  { id: 'pin_post',      icon: '📌', category: 'vip', title: 'تثبيت إعلان أعلى قسم',    cost: 2000,  desc: 'إعلانك أول في القسم 3 أيام' },
  { id: 'home_banner',   icon: '🌟', category: 'vip', title: 'شريط إعلان في الرئيسية',  cost: 10000, desc: 'إعلانك في بانر الرئيسية أسبوع' },
  { id: 'premium_badge', icon: '🏅', category: 'vip', title: 'شارة "بائع مميز"',       cost: 8000,  desc: 'شارة ذهبية تظهر جنب اسمك شهر' }
];

let myPoints = 0;
let myTier = POINTS_TIERS[0];
let myHistory = [];
let unsubPoints = null;

window.openPoints = function(){
  if(!auth.currentUser){
    showToast('⚠️ سجّل دخولك لعرض نقاطك', 'warn');
    authOverlay.classList.remove('hidden');
    return;
  }
  document.getElementById('pointsOverlay').classList.remove('hidden');
  accountOverlay.classList.add('hidden');
  startPointsListener(auth.currentUser.uid);
  renderPoints();
};

function startPointsListener(uid){
  if(unsubPoints){ unsubPoints(); unsubPoints = null; }
  unsubPoints = onSnapshot(doc(db, 'userPoints', uid), snap => {
    if(snap.exists()){
      const data = snap.data();
      myPoints = data.points || 0;
      myHistory = Array.isArray(data.history) ? data.history : [];
    } else {
      myPoints = 0;
      myHistory = [];
    }
    updateTier();
    renderPoints();
  }, err => {
    console.warn('خطأ في تحميل النقاط:', err);
    myPoints = 0;
    myHistory = [];
    updateTier();
    renderPoints();
  });
}

function updateTier(){
  for(const t of POINTS_TIERS){
    if(myPoints >= t.min && myPoints <= t.max){
      myTier = t;
      return;
    }
  }
  myTier = POINTS_TIERS[0];
}

function renderPoints(){
  const balEl = document.getElementById('pointsBalance');
  if(balEl) balEl.textContent = myPoints.toLocaleString();
  const tierEl = document.getElementById('pointsTier');
  if(tierEl) tierEl.textContent = `${myTier.icon} ${myTier.name}`;
  const idx = POINTS_TIERS.indexOf(myTier);
  const next = POINTS_TIERS[idx + 1];
  const progressText = document.getElementById('pointsProgressText');
  const progressBar = document.getElementById('pointsProgressBar');
  if(next){
    const needed = next.min - myTier.min;
    const current = myPoints - myTier.min;
    const percent = Math.min(100, (current / needed) * 100);
    if(progressText) progressText.textContent = `${myPoints.toLocaleString()} / ${next.min.toLocaleString()} لـ ${next.icon} ${next.name}`;
    if(progressBar) progressBar.style.width = percent + '%';
  } else {
    if(progressText) progressText.textContent = '🎉 وصلت لأعلى مستوى!';
    if(progressBar) progressBar.style.width = '100%';
  }
  updatePointsBadge();
  renderRewards();
  renderHistory();
}

function updatePointsBadge(){
  const badge = document.getElementById('pointsBadge');
  if(!badge) return;
  if(myPoints > 0){
    badge.textContent = myPoints >= 1000 ? (Math.floor(myPoints/1000) + 'K') : myPoints;
    badge.style.display = 'block';
  } else {
    badge.style.display = 'none';
  }
}

function renderRewards(){
  const list = document.getElementById('rewardsList');
  if(!list) return;
  const categories = {
    cards: { title: '📱 كروت الشحن (ليبيانا والمدار)', desc: 'استبدل نقاطك برصيد تعبئة فوري' },
    featured: { title: '⭐ التمييز', desc: 'خلّي إعلانك في الأعلى' },
    extra: { title: '🎁 مكافآت إضافية', desc: 'خصومات وعروض' },
    vip: { title: '🏆 مكافآت VIP', desc: 'ميزات خاصة للمميزين' }
  };
  let html = '';
  Object.keys(categories).forEach(cat => {
    const rewards = POINTS_REWARDS.filter(r => r.category === cat);
    if(rewards.length === 0) return;
    html += `
      <div style="margin-bottom:18px">
        <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:10px">
          <div style="font-weight:800;font-size:14px">${categories[cat].title}</div>
          <div style="font-size:11px;color:var(--muted)">— ${categories[cat].desc}</div>
        </div>
        ${rewards.map(r => {
          const canAfford = myPoints >= r.cost;
          const discountedCost = Math.round(r.cost * (100 - myTier.discount) / 100);
          const hasDiscount = myTier.discount > 0 && discountedCost < r.cost;
          return `
            <div style="background:var(--card);border:2px solid ${canAfford ? '#16a34a' : 'var(--border)'};border-radius:12px;padding:12px;margin-bottom:8px;display:flex;gap:10px;align-items:center">
              <div style="font-size:28px;flex:0 0 auto">${r.icon}</div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:800;font-size:13.5px;margin-bottom:2px">${r.title}</div>
                <div style="font-size:11px;color:var(--muted);margin-bottom:5px;line-height:1.4">${r.desc}</div>
                <div style="font-size:12.5px;font-weight:800;color:#f59e0b">
                  ${hasDiscount ? `<span style="text-decoration:line-through;color:var(--muted);font-weight:600;margin-left:6px">${r.cost}</span>${discountedCost}` : r.cost} نقطة
                  ${hasDiscount ? `<span style="background:#dcfce7;color:#166534;font-size:10px;padding:2px 6px;border-radius:5px;margin-right:6px">-${myTier.discount}%</span>` : ''}
                </div>
              </div>
              <button onclick="redeemReward('${r.id}')" ${!canAfford ? 'disabled' : ''} style="padding:9px 12px;border:none;border-radius:10px;background:${canAfford ? '#16a34a' : '#e5e7eb'};color:${canAfford ? '#fff' : '#9ca3af'};font-family:inherit;font-size:12px;font-weight:800;cursor:${canAfford ? 'pointer' : 'not-allowed'};flex:0 0 auto">
                ${canAfford ? 'استبدل' : 'غير كافٍ'}
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  });
  list.innerHTML = html;
}

function renderHistory(){
  const list = document.getElementById('pointsHistoryList');
  if(!list) return;
  if(myHistory.length === 0){
    list.innerHTML = '<div style="text-align:center;padding:30px 20px;color:var(--muted);font-size:13px">📭 لا يوجد سجل بعد<br><small>ابدأ بفتح عجلة الحظ أو انشر إعلان!</small></div>';
    return;
  }
  list.innerHTML = myHistory.slice(0, 30).map(h => {
    const sign = h.value >= 0 ? '+' : '';
    const color = h.value >= 0 ? '#16a34a' : '#e5484d';
    const date = new Date(h.timestamp).toLocaleDateString('ar-LY');
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--bg);border-radius:10px;margin-bottom:6px">
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:13px;margin-bottom:2px">${h.title || 'نشاط'}</div>
          <div style="font-size:10.5px;color:var(--muted)">${date}</div>
        </div>
        <div style="font-weight:800;font-size:15px;color:${color};direction:ltr">${sign}${h.value}</div>
      </div>
    `;
  }).join('');
}

window.switchPointsTab = function(tab){
  const rewardsTab = document.getElementById('pointsRewardsTab');
  const historyTab = document.getElementById('pointsHistoryTab');
  const rewardsBtn = document.getElementById('tabRewards');
  const historyBtn = document.getElementById('tabHistory');
  if(tab === 'rewards'){
    rewardsTab.style.display = 'block';
    historyTab.style.display = 'none';
    rewardsBtn.style.background = '#8b5cf6';
    rewardsBtn.style.color = '#fff';
    historyBtn.style.background = '#e5e7eb';
    historyBtn.style.color = '#4b5563';
  } else {
    rewardsTab.style.display = 'none';
    historyTab.style.display = 'block';
    rewardsBtn.style.background = '#e5e7eb';
    rewardsBtn.style.color = '#4b5563';
    historyBtn.style.background = '#8b5cf6';
    historyBtn.style.color = '#fff';
  }
};

async function addPoints(uid, amount, title, activity){
  if(!uid || !amount) return;
  // حماية ضد التلاعب: أقصى إضافة مسموحة في العملية الواحدة 100 نقطة
  if(amount > 100) {
    console.warn("محاولة غير مصرح بها لإضافة نقاط.");
    return;
  }
  try{
    const userRef = doc(db, 'userPoints', uid);
    const snap = await getDoc(userRef);
    let currentData = snap.exists() ? snap.data() : { points: 0, history: [] };
    const newPoints = Math.max(0, (currentData.points || 0) + amount);
    const history = Array.isArray(currentData.history) ? currentData.history : [];
    history.unshift({
      value: amount,
      title: title,
      activity: activity || 'general',
      timestamp: Date.now()
    });
    if(history.length > 100) history.splice(100);
    await setDoc(userRef, {
      points: newPoints,
      history: history,
      updatedAt: Date.now()
    }, { merge: true });
    if(uid === (auth.currentUser && auth.currentUser.uid)){
      showToast(`🏆 ${amount > 0 ? '+' : ''}${amount} نقطة — ${title}`, 'success', 2500);
    }
  } catch(e){
    console.warn('خطأ في إضافة النقاط:', e.message);
  }
}
window.addPoints = addPoints;

let _isRedeemingReward = false;
window.redeemReward = async function(rewardId){
  if(_isRedeemingReward) return;
  if(!auth.currentUser){
    showToast('⚠️ سجّل دخولك أولاً', 'warn');
    return;
  }
  const reward = POINTS_REWARDS.find(r => r.id === rewardId);
  if(!reward) return;
  const discountedCost = Math.round(reward.cost * (100 - myTier.discount) / 100);
  if(myPoints < discountedCost){
    showToast(`⚠️ تحتاج ${discountedCost - myPoints} نقطة إضافية`, 'warn');
    return;
  }
  const confirmed = await showConfirmModal(`استبدال ${discountedCost} نقطة بـ "${reward.title}"؟`, { confirmText: "نعم، استبدال" });
  if(!confirmed) return;
  _isRedeemingReward = true;
  try{
    // فحص رصيد النقاط الفعلي من قاعدة البيانات لمنع التكرار بالتزامن
    const userRef = doc(db, 'userPoints', auth.currentUser.uid);
    const snap = await getDoc(userRef);
    const actualPoints = (snap.exists() && snap.data().points) || 0;
    if(actualPoints < discountedCost){
      showToast('⚠️ رصيدك الفعلي من النقاط غير كافٍ لإتمام الاستبدال', 'warn');
      return;
    }
    await addPoints(auth.currentUser.uid, -discountedCost, `استبدال: ${reward.title}`, 'redeem');
    await addDoc(collection(db, 'userRedemptions'), {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email || '',
      rewardId: reward.id,
      rewardTitle: reward.title,
      cost: discountedCost,
      status: 'pending',
      createdAt: Date.now()
    });
    showToast(`✅ تم! تواصل مع الإدارة لاستلام "${reward.title}"`, 'success', 4000);
    const adminMsg = `🏆 طلب استبدال نقاط\n\n👤 المستخدم: ${auth.currentUser.email}\n🎁 المكافأة: ${reward.title}\n💰 التكلفة: ${discountedCost} نقطة`;
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(adminMsg)}`, '_blank');
  } catch(e){
    showToast('❌ خطأ: ' + e.message, 'error');
  } finally {
    _isRedeemingReward = false;
  }
};

async function rewardReferrer(refCode, newUid) {
  try {
    const found = await findUserByAny(refCode);
    if (found && found.uid && found.uid !== newUid) {
      await addPoints(found.uid, 40, '🎁 هدية دعوة صديق جديد للموقع', 'referral_bonus');
    }
  } catch(e) {
    console.warn('Reward referrer error:', e);
  }
}

async function giveWelcomePoints(uid){
  try{
    const userRef = doc(db, 'userPoints', uid);
    const snap = await getDoc(userRef);
    if(!snap.exists()){
      let welcomePts = 20;
      let history = [{ value: 20, title: '🎉 مكافأة الترحيب', activity: 'welcome', timestamp: Date.now() }];
      
      const refCode = sessionStorage.getItem('tasawuq_pending_ref');
      if (refCode) {
        welcomePts += 20;
        history.push({ value: 20, title: '🎁 مكافأة التسجيل عبر رابط دعوة', activity: 'referral_bonus', timestamp: Date.now() });
        rewardReferrer(refCode, uid);
        sessionStorage.removeItem('tasawuq_pending_ref');
      }

      await setDoc(userRef, {
        points: welcomePts,
        history: history,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
  }catch(e){}
}

async function syncPendingPoints(){
  if(!auth.currentUser) return;
  try{
    const pending = JSON.parse(localStorage.getItem('pendingPoints') || '[]');
    if(pending.length === 0) return;
    const myPending = pending.filter(p => p.uid === auth.currentUser.uid);
    if(myPending.length === 0) return;
    const userRef = doc(db, 'userPoints', auth.currentUser.uid);
    const snap = await getDoc(userRef);
    const currentData = snap.exists() ? snap.data() : { points: 0, history: [] };
    let newPoints = currentData.points || 0;
    const history = Array.isArray(currentData.history) ? currentData.history : [];
    for(const p of myPending){
      newPoints += p.value;
      history.unshift({
        value: p.value,
        title: p.title,
        activity: 'lucky_wheel_synced',
        timestamp: p.timestamp
      });
    }
    if(history.length > 100) history.splice(100);
    await setDoc(userRef, { points: newPoints, history, updatedAt: Date.now() }, { merge: true });
    const remaining = pending.filter(p => p.uid !== auth.currentUser.uid);
    localStorage.setItem('pendingPoints', JSON.stringify(remaining));
    console.log('✅ تمت مزامنة', myPending.length, 'عملية معلقة');
    showToast(`✅ تم استرجاع ${myPending.length} مكافأة معلقة`, 'success', 3000);
  }catch(e){
    console.warn('فشلت مزامنة النقاط المعلقة:', e);
  }
}
window.syncPendingPoints = syncPendingPoints;

/* ============================================
   🎡 نظام عجلة الحظ
   ============================================ */
const WHEEL_REWARDS = [
  { type: 'points', value: 5,     icon: '💎', title: '5 نقاط',       desc: 'أضفنا 5 نقاط لرصيدك',      weight: 30 },
  { type: 'points', value: 20,    icon: '💎', title: '20 نقطة',      desc: 'أضفنا 20 نقطة لرصيدك',     weight: 15 },
  { type: 'points', value: 10,    icon: '💰', title: '10 نقاط',      desc: 'أضفنا 10 نقاط لرصيدك',      weight: 25 },
  { type: 'featured', value: 1,   icon: '⭐', title: 'إعلان مميز',   desc: 'إعلان مميز لمدة يوم مجاناً!',  weight: 2 },
  { type: 'points', value: 15,    icon: '💰', title: '15 نقطة',      desc: 'أضفنا 15 نقطة لرصيدك',      weight: 20 },
  { type: 'points', value: 50,    icon: '🥈', title: '50 نقطة',      desc: 'مكافأة نادرة! 50 نقطة',      weight: 2 },
  { type: 'points', value: 25,    icon: '🥉', title: '25 نقطة',      desc: 'أضفنا 25 نقطة لرصيدك',      weight: 10 },
  { type: 'points', value: 100,   icon: '🥇', title: '100 نقطة',     desc: 'مكافأة أسطورية! 100 نقطة',  weight: 1 }
];

const WHEEL_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const WHEEL_STORAGE_KEY = 'luckyWheelLast';
let wheelSpinning = false;
let wheelRotation = 0;

function getWheelStatus(){
  try{
    const data = JSON.parse(localStorage.getItem(WHEEL_STORAGE_KEY) || 'null');
    if(!data || !data.timestamp) return { canSpin: true, lastSpin: 0 };
    if(data.timestamp > Date.now() + 60000){
      localStorage.removeItem(WHEEL_STORAGE_KEY);
      return { canSpin: true, lastSpin: 0 };
    }
    const elapsed = Date.now() - data.timestamp;
    return {
      canSpin: elapsed >= WHEEL_COOLDOWN_MS,
      lastSpin: data.timestamp,
      remaining: Math.max(0, WHEEL_COOLDOWN_MS - elapsed)
    };
  }catch(e){ return { canSpin: true, lastSpin: 0 }; }
}

function saveWheelSpin(){
  try{ localStorage.setItem(WHEEL_STORAGE_KEY, JSON.stringify({ timestamp: Date.now() })); }catch(e){}
}

function pickWheelReward(){
  const total = WHEEL_REWARDS.reduce((s, r) => s + r.weight, 0);
  let rand = Math.random() * total;
  for(let i = 0; i < WHEEL_REWARDS.length; i++){
    rand -= WHEEL_REWARDS[i].weight;
    if(rand <= 0) return { reward: WHEEL_REWARDS[i], index: i };
  }
  return { reward: WHEEL_REWARDS[0], index: 0 };
}

window.openLuckyWheel = function(){
  const overlay = document.getElementById('luckyWheelOverlay');
  const activeState = document.getElementById('wheelActiveState');
  const resultState = document.getElementById('wheelResultState');
  const cooldownState = document.getElementById('wheelCooldownState');
  activeState.style.display = 'none';
  resultState.style.display = 'none';
  cooldownState.style.display = 'none';
  const status = getWheelStatus();
  if(status.canSpin){
    activeState.style.display = 'block';
    const disc = document.getElementById('wheelDisc');
    disc.style.transition = 'none';
    disc.style.transform = 'rotate(0deg)';
    wheelRotation = 0;
    const btn = document.getElementById('wheelCenterBtn');
    btn.disabled = false;
    btn.textContent = '🎯';
  } else {
    cooldownState.style.display = 'block';
    startWheelCooldown();
  }
  overlay.classList.remove('hidden');
};

window.closeLuckyWheel = function(){
  document.getElementById('luckyWheelOverlay').classList.add('hidden');
  if(window._wheelCooldownInterval){
    clearInterval(window._wheelCooldownInterval);
    window._wheelCooldownInterval = null;
  }
  updateWheelBadge();
};

function startWheelCooldown(){
  const el = document.getElementById('wheelCooldownText');
  if(!el) return;
  function update(){
    const status = getWheelStatus();
    if(status.canSpin){
      clearInterval(window._wheelCooldownInterval);
      document.getElementById('wheelCooldownState').style.display = 'none';
      document.getElementById('wheelActiveState').style.display = 'block';
      return;
    }
    const h = Math.floor(status.remaining / 3600000);
    const m = Math.floor((status.remaining % 3600000) / 60000);
    const s = Math.floor((status.remaining % 60000) / 1000);
    el.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  update();
  if(window._wheelCooldownInterval) clearInterval(window._wheelCooldownInterval);
  window._wheelCooldownInterval = setInterval(update, 1000);
}

window.spinLuckyWheel = async function(){
  if(wheelSpinning) return;
  if(!auth.currentUser){
    showToast('⚠️ يرجى تسجيل الدخول أولاً لتدوير العجلة وحفظ جوائزك', 'warn');
    if(typeof openAuthModal === 'function') openAuthModal();
    return;
  }
  const status = getWheelStatus();
  if(!status.canSpin){
    showToast('⏰ العجلة مغلقة، تعال بعد', 'warn');
    return;
  }
  wheelSpinning = true;
  const btn = document.getElementById('wheelCenterBtn');
  const disc = document.getElementById('wheelDisc');
  btn.disabled = true;
  btn.textContent = '...';
  const { reward, index } = pickWheelReward();
  const targetAngle = 360 - (index * 45 + 22.5);
  const fullSpins = 360 * 5;
  const totalRotation = wheelRotation + fullSpins + targetAngle;
  disc.style.transition = 'transform 4s cubic-bezier(.17,.67,.2,1)';
  disc.style.transform = `rotate(${totalRotation}deg)`;
  wheelRotation = totalRotation;
  await new Promise(r => setTimeout(r, 4200));
  saveWheelSpin();
  if(auth.currentUser){
    try{ await giveWheelReward(auth.currentUser.uid, reward); }catch(e){ console.warn(e); }
  }
  document.getElementById('wheelActiveState').style.display = 'none';
  document.getElementById('wheelResultState').style.display = 'block';
  document.getElementById('wheelRewardIcon').textContent = reward.icon;
  document.getElementById('wheelRewardText').textContent = reward.title;
  document.getElementById('wheelRewardDesc').textContent = reward.desc;
  showToast(`🎉 ربحت: ${reward.title}!`, 'success', 3500);
  wheelSpinning = false;
  updateWheelBadge();
};

async function giveWheelReward(uid, reward){
  const pointsToAdd = reward.type === 'points' ? reward.value : 0;
  try{
    const userRef = doc(db, 'userPoints', uid);
    const snap = await getDoc(userRef);
    const currentData = snap.exists() ? snap.data() : { points: 0, history: [] };
    const newPoints = (currentData.points || 0) + pointsToAdd;
    const history = Array.isArray(currentData.history) ? currentData.history : [];
    history.unshift({
      value: pointsToAdd,
      title: `🎡 عجلة الحظ: ${reward.title}`,
      activity: 'lucky_wheel',
      timestamp: Date.now()
    });
    if(history.length > 100) history.splice(100);
    const updates = { points: newPoints, history, updatedAt: Date.now() };
    if(reward.type === 'featured'){
      updates.freeFeaturedTokens = (currentData.freeFeaturedTokens || 0) + 1;
    }
    await setDoc(userRef, updates, { merge: true });

    myPoints = newPoints;
    myHistory = history;
    const balEl = document.getElementById('pointsBalance');
    if(balEl) balEl.textContent = newPoints.toLocaleString();
    updatePointsBadge();
    updateTier();
    renderPoints();

    console.log('✅ تم إضافة', pointsToAdd, 'نقطة | الرصيد الجديد:', newPoints);
  }catch(e){
    console.error('❌ فشل حفظ النقاط في Firestore:', e);
    showToast('⚠️ تم الفوز لكن تعذر حفظ النقاط — تحقق من اتصالك', 'warn', 4000);
    try{
      const pending = JSON.parse(localStorage.getItem('pendingPoints') || '[]');
      pending.push({
        value: pointsToAdd,
        title: `🎡 عجلة الحظ: ${reward.title}`,
        uid: uid,
        timestamp: Date.now()
      });
      localStorage.setItem('pendingPoints', JSON.stringify(pending));
    }catch(err){}
  }
}

function updateWheelBadge(){
  const badge = document.getElementById('luckyWheelBadge');
  const btn = document.getElementById('luckyWheelBtn');
  if(!badge || !btn) return;
  const status = getWheelStatus();
  if(status.canSpin){
    btn.style.display = 'flex';
    badge.style.display = 'flex';
  } else {
    btn.style.display = 'none';
    badge.style.display = 'none';
  }
}
updateWheelBadge();
setTimeout(updateWheelBadge, 500);
setTimeout(updateWheelBadge, 2000);
setInterval(updateWheelBadge, 30000);

/* ============================================
   🤖 المساعد الذكي
   ============================================ */
const AI_MODELS_LIST = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash"
];
let _workingModel = null;
try{ _workingModel = localStorage.getItem('aiWorkingModel') || null; }catch(e){}

let aiModel = null;
function createAIModel(modelName){
  if (ai && typeof getGenerativeModel === 'function') {
    try {
      return getGenerativeModel(ai, { model: modelName });
    } catch(e) {
      return null;
    }
  }
  return null;
}

if(_workingModel){
  try{ aiModel = createAIModel(_workingModel); console.log('✅ موديل محفوظ:', _workingModel); }catch(e){ aiModel = null; }
}

async function generateAIContent(prompt){
  if(aiModel){
    try{
      const result = await aiModel.generateContent(prompt);
      console.log('✅ الموديل المحفوظ شغال:', _workingModel);
      return result.response.text();
    }catch(e){
      console.warn('⚠️ الموديل المحفوظ فشل:', e.message);
      aiModel = null;
      try{ localStorage.removeItem('aiWorkingModel'); }catch(err){}
    }
  }
  let lastError = null;
  for(const modelName of AI_MODELS_LIST){
    try{
      console.log('🔄 نجرب:', modelName);
      const testModel = createAIModel(modelName);
      const result = await testModel.generateContent(prompt);
      const text = result.response.text();
      aiModel = testModel;
      _workingModel = modelName;
      try{ localStorage.setItem('aiWorkingModel', modelName); }catch(err){}
      console.log('🎉 نجح الموديل:', modelName);
      return text;
    }catch(e){
      console.warn('❌ فشل:', modelName, '—', e.message);
      lastError = e;
      continue;
    }
  }
  throw lastError || new Error('كل الموديلات فشلت');
}

const AI_SYSTEM_PROMPT = `أنت مساعد موقع "تسوق الآن" الليبي 🇱🇾 (منصة إعلانات مجانية).

🎯 مهمتك: مساعد المستخدمين في استخدام الموقع فقط.

📚 المعلومات:
- التسجيل: زر "حسابي" في الأسفل → Google
- النشر: زر ➕ الأصفر → إعلان فردي أو متجر
- الإعلان الفردي: 5 صور، حد 3 إعلانات، 30 يوم
- المتجر: مجاني، موافقة الأدمن، حد 20 منتج
- تعديل الرقم: "حسابي" → فرصة واحدة فقط
- التواصل: واتساب الإدارة 218928476784
- الترقية: 7 أيام 15 د.ل، 15 يوم 30 د.ل، 30 يوم 40 د.ل
- 🎡 عجلة الحظ: كل 24 ساعة → نقاط مجانية
- 🏆 نظام النقاط: انشر إعلان (10 نقاط)، قيّم بائع (3 نقاط)، ادعُ صديق (50 نقطة)

⚠️ قواعد صارمة:
1. أجب بالعربية الليبية البسيطة
2. الرد بحد أقصى 4 أسطر
3. لا تخرج عن موضوع الموقع
4. ارفض بلطف: السياسة، الدين، الجنس، العنف
5. لا تطلب أرقام/إيميلات/كلمات سر
6. لو ما تعرف: "تواصل مع الإدارة على واتساب 218928476784"
7. استخدم إيموجي بسيط

سؤال المستخدم: `;

const AI_BLOCKED = ['سياسة','سياسي','رئيس','حكومة','انتخابات','حرب','دين','ديني','إسلام','مسيحي','يهودي','صلاة','جنس','جنسي','سكس','عاري','عنف','قتل','سلاح','بندقية','هاك','اختراق','فيروس','هاكر','كلمة سر','باسورد','مخدر','حشيش','كحول','احتيال','نصب عليك','سرقة بيانات'];
const AI_DAILY_LIMIT = 30;

function getAICount(){ try{ return parseInt(localStorage.getItem('aiCount_'+new Date().toDateString())||'0'); }catch(e){ return 0; } }
function incAICount(){ try{ localStorage.setItem('aiCount_'+new Date().toDateString(), String(getAICount()+1)); }catch(e){} }

window.toggleAIChat = () => {
  const win = document.getElementById('aiChatWindow');
  const isOpen = win.style.display === 'flex';
  win.style.display = isOpen ? 'none' : 'flex';
  if(!isOpen) setTimeout(()=>document.getElementById('aiChatInput').focus(),100);
};

window.aiQuickAsk = (question) => {
  document.getElementById('aiChatInput').value = question;
  window.sendAIChat();
};

window.sendAIChat = async () => {
  const input = document.getElementById('aiChatInput');
  const box = document.getElementById('aiChatMessages');
  const btn = document.getElementById('aiChatSendBtn');
  const quickOpts = document.getElementById('aiQuickOptions');
  const msg = input.value.trim();
  if(!msg) return;
  if(quickOpts) quickOpts.style.display = 'none';
  if(getAICount() >= AI_DAILY_LIMIT){
    box.innerHTML += `<div style="text-align:right;"><span style="background:#fdeceb;color:#b91c1c;padding:12px 14px;border-radius:14px 14px 0 14px;display:inline-block;max-width:88%;font-size:13.5px;line-height:1.7;">🚫 وصلت للحد اليومي (${AI_DAILY_LIMIT} رسالة).<br>جرب غداً 🙏<br><br>للاستفسار:<br>واتساب <b>218928476784</b></span></div>`;
    box.scrollTop = box.scrollHeight;
    input.value='';
    return;
  }
  const lower = msg.toLowerCase();
  const foundBlocked = AI_BLOCKED.find(w => lower.includes(w));
  if(foundBlocked){
    box.innerHTML += `<div style="text-align:left;"><span style="background:#8b5cf6;color:#fff;padding:10px 14px;border-radius:14px 14px 14px 0;display:inline-block;max-width:88%;font-size:13.5px;line-height:1.7;">${escapeHtml(msg)}</span></div>`;
    box.innerHTML += `<div style="text-align:right;"><span style="background:#fef3c7;color:#92400e;padding:12px 14px;border-radius:14px 14px 0 14px;display:inline-block;max-width:88%;font-size:13.5px;line-height:1.7;">🌸 آسف، أنا مساعد التسوق فقط.<br><br>اسألني عن:<br>• كيف أنشر إعلان<br>• كيف أفتح متجر<br>• 🎡 عجلة الحظ<br>• 🏆 نظام النقاط</span></div>`;
    box.scrollTop = box.scrollHeight;
    input.value='';
    return;
  }
  box.innerHTML += `<div style="text-align:left;"><span style="background:#8b5cf6;color:#fff;padding:10px 14px;border-radius:14px 14px 14px 0;display:inline-block;max-width:88%;font-size:13.5px;line-height:1.7;">${escapeHtml(msg)}</span></div>`;
  input.value='';
  box.scrollTop = box.scrollHeight;
  btn.disabled = true;
  btn.textContent = '...';
  btn.style.opacity = '0.6';
  const loadingId = 'aiLoading_'+Date.now();
  box.innerHTML += `<div id="${loadingId}" style="text-align:right;"><span style="background:#e6f6fe;color:#0284c7;padding:10px 14px;border-radius:14px 14px 0 14px;display:inline-block;font-size:13.5px;">✍️ يكتب...</span></div>`;
  box.scrollTop = box.scrollHeight;
  try{
    const response = await generateAIContent(AI_SYSTEM_PROMPT + msg);
    document.getElementById(loadingId)?.remove();
    box.innerHTML += `<div style="text-align:right;"><span style="background:#e6f6fe;color:#0284c7;padding:12px 14px;border-radius:14px 14px 0 14px;display:inline-block;max-width:88%;font-size:13.5px;line-height:1.8;">${escapeHtml(response).replace(/\n/g,'<br>')}</span></div>`;
    incAICount();
  }catch(e){
    document.getElementById(loadingId)?.remove();
    box.innerHTML += `<div style="text-align:right;"><span style="background:#fdeceb;color:#b91c1c;padding:12px 14px;border-radius:14px 14px 0 14px;display:inline-block;max-width:88%;font-size:13.5px;line-height:1.7;">❌ صار خطأ، جرب مرة ثانية.<br><br>للاستفسار:<br>واتساب <b>218928476784</b></span></div>`;
    console.error('AI Error:', e);
  }finally{
    btn.disabled = false;
    btn.textContent = 'إرسال';
    btn.style.opacity = '1';
    box.scrollTop = box.scrollHeight;
  }
};

/* 🎯 زر عائم متحرك */
(function(){
  const btn = document.getElementById('aiChatBtn');
  if(!btn) return;
  let isDragging = false;
  let startX, startY, startLeft, startTop;
  let offsetX = 0, offsetY = 0;
  let moved = false;
  function initializePosition(){
    const rect = btn.getBoundingClientRect();
    btn.style.right = 'auto';
    btn.style.bottom = 'auto';
    btn.style.left = rect.left + 'px';
    btn.style.top = rect.top + 'px';
    btn.style.transform = 'translate(0,0)';
  }
  btn.addEventListener('pointerdown', (e) => {
    window._aiDraggingNow = false;
    moved = false;
    initializePosition();
    const rect = btn.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left;
    startTop = rect.top;
    isDragging = true;
    btn.style.cursor = 'grabbing';
    btn.style.transition = 'none';
    btn.style.opacity = '1';
    try{ btn.setPointerCapture(e.pointerId); }catch(err){}
  });
  btn.addEventListener('pointermove', (e) => {
    if(!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if(Math.abs(dx) > 5 || Math.abs(dy) > 5){ moved = true; window._aiDraggingNow = true; }
    offsetX = startLeft + dx;
    offsetY = startTop + dy;
    const maxX = window.innerWidth - btn.offsetWidth - 5;
    const maxY = window.innerHeight - btn.offsetHeight - 5;
    offsetX = Math.max(5, Math.min(maxX, offsetX));
    offsetY = Math.max(5, Math.min(maxY, offsetY));
    btn.style.left = offsetX + 'px';
    btn.style.top = offsetY + 'px';
  });
  btn.addEventListener('pointerup', (e) => {
    if(!isDragging) return;
    isDragging = false;
    btn.style.cursor = 'grab';
    btn.style.transition = 'transform .15s, opacity .3s';
    btn.style.opacity = '0.7';
    if(moved){
      try{ localStorage.setItem('aiBtnPos', JSON.stringify({ x: offsetX, y: offsetY })); }catch(err){}
      setTimeout(()=>{ window._aiDraggingNow = false; }, 100);
    } else {
      window._aiDraggingNow = false;
      if(typeof window.toggleAIChat === 'function') window.toggleAIChat();
    }
  });
  btn.addEventListener('pointercancel', () => {
    isDragging = false;
    window._aiDraggingNow = false;
    btn.style.cursor = 'grab';
    btn.style.opacity = '0.7';
  });
  btn.addEventListener('mouseenter', () => { if(!isDragging) btn.style.opacity = '1'; });
  btn.addEventListener('mouseleave', () => { if(!isDragging) btn.style.opacity = '0.7'; });
  try{
    const saved = JSON.parse(localStorage.getItem('aiBtnPos') || 'null');
    if(saved && typeof saved.x === 'number' && typeof saved.y === 'number'){
      btn.style.right = 'auto';
      btn.style.bottom = 'auto';
      btn.style.left = saved.x + 'px';
      btn.style.top = saved.y + 'px';
    }
  }catch(err){}
})();

/* أساسيات أخرى */
(function initDarkMode(){
  try{
    const saved=localStorage.getItem('theme');
    const prefersDark=window.matchMedia && window.matchMedia('(prefers-color-scheme:dark)').matches;
    const useDark=saved==='dark' || (saved===null && prefersDark);
    if(useDark)document.documentElement.classList.add('dark-mode');
    setTimeout(()=>{const icon=document.getElementById('darkModeIcon');if(icon){icon.setAttribute('data-lucide',useDark?'sun':'moon');if(window.lucide)lucide.createIcons();}},200);
  }catch(e){}
})();
window.toggleDarkMode=function(){
  const html=document.documentElement;
  const isDark=html.classList.toggle('dark-mode');
  try{localStorage.setItem('theme',isDark?'dark':'light');}catch(e){}
  const icon=document.getElementById('darkModeIcon');
if(icon){icon.setAttribute('data-lucide',isDark?'sun':'moon');if(window.lucide)lucide.createIcons();}
  const metaTheme=document.getElementById('themeColorMeta');
  if(metaTheme)metaTheme.setAttribute('content',isDark?'#0c2942':'#38bdf8');
};

function loadCart(){try{const saved=localStorage.getItem('tasawuqCart');if(saved){const parsed=JSON.parse(saved);if(parsed && typeof parsed==="object" && Array.isArray(parsed.items)){cart=parsed;}}}catch(e){}}
function saveCart(){try{localStorage.setItem('tasawuqCart',JSON.stringify(cart));}catch(e){}}
function cartTotalCount(){return cart.items.reduce((s,i)=>s+(i.qty||1),0);}
function cartTotalPrice(){return cart.items.reduce((s,i)=>s+((i.price||0)*(i.qty||1)),0);}
function cartTotalItemsCount(){return cart.items.reduce((s,i)=>s+(i.qty||1),0);}

/* ✅ تعديل: السلة والمقارنة بأنيميشن ناعم */
function updateCartUI(){
  const cnt=cartTotalCount();
  const hc=document.getElementById("cartHeaderCount");
  if(hc)hc.textContent=cnt;
  if(hc)hc.style.display=cnt>0?"flex":"none";
  const fab=document.getElementById("cartFAB");
  const cartOverlayOpen=document.getElementById("cartOverlay") && !document.getElementById("cartOverlay").classList.contains("hidden");
  if(fab){
    if(cart.storeId && cnt>0 && !cartOverlayOpen){
      fab.classList.remove("fabOff");
      const total=cartTotalPrice();
      fab.innerHTML=`<span>🛒 عرض السلة</span><span class="cartFABcount">${cnt}</span><span class="cartFABtotal">${formatPrice(total)} د.ل</span>`;
    }else{
      fab.classList.add("fabOff");
    }
  }
  document.querySelectorAll(".cartAddBtn").forEach(btn=>{
    const id=btn.dataset.id;
    const inCartItem=cart.items.find(i=>i.postId===id);
    if(inCartItem){
      btn.classList.add("added");
      btn.innerHTML=`✅ في السلة (${inCartItem.qty||1})`;
    }else{
      btn.classList.remove("added");
      btn.innerHTML="🛒 أضف للسلة";
    }
  });
}
loadCart();
window.addEventListener('load',()=>{setTimeout(updateCartUI,500);});
updateCartUI();

const home=document.getElementById("home"),form=document.getElementById("form"),postsBox=document.getElementById("posts"),homeTitle=document.getElementById("homeTitle");
const categoriesScreen=document.getElementById("categoriesScreen");
const mainTopbar=document.getElementById("mainTopbar");
const authOverlay=document.getElementById("authOverlay"),accountOverlay=document.getElementById("accountOverlay"),reportsOverlay=document.getElementById("reportsOverlay"),reportsBtn=document.getElementById("reportsBtn");
const moderationBtn=document.getElementById("moderationBtn"),moderationOverlay=document.getElementById("moderationOverlay"),limitsOverlay=document.getElementById("limitsOverlay");
const sellerOverlay=document.getElementById("sellerOverlay"),postOverlay=document.getElementById("postOverlay"),warnOverlay=document.getElementById("warnOverlay"),upgradeOverlay=document.getElementById("upgradeOverlay");
const adminChip=document.getElementById("adminChip"),navHome=document.getElementById("navHome"),navMine=document.getElementById("navMine"),navFav=document.getElementById("navFav");
const navAccountLabel=document.getElementById("navAccountLabel"),subCatsRow=document.getElementById("subCatsRow");
const postTypeOverlay=document.getElementById("postTypeOverlay"),openStoreOverlay=document.getElementById("openStoreOverlay"),storesModerationOverlay=document.getElementById("storesModerationOverlay");
const expiredOverlay=document.getElementById("expiredOverlay");
const cartOverlay=document.getElementById("cartOverlay");
const termsOverlay=document.getElementById("termsOverlay"),privacyOverlay=document.getElementById("privacyOverlay");
const editStoreOverlay=document.getElementById("editStoreOverlay");
const feedbackOverlay=document.getElementById("feedbackOverlay");

export function openAuthModal(){
  const overlay = document.getElementById("authOverlay");
  if(overlay) overlay.classList.remove("hidden");
}
window.openAuthModal = openAuthModal;

window.openTerms=()=>{termsOverlay.classList.remove("hidden");};
window.openPrivacy=()=>{privacyOverlay.classList.remove("hidden");};

/* ===== Store Helpers ===== */
window.loadStoreHelpers=(storeId)=>{
  const store=allStores.find(s=>s.id===storeId);
  if(!store){currentStoreHelpers=[];renderStoreHelpersList();return;}
  currentStoreHelpers=Array.isArray(store.helpers)?[...store.helpers]:[];
  renderStoreHelpersList();
};
function renderStoreHelpersList(){
  const box=document.getElementById("storeHelpersList");
  if(!box)return;
  if(currentStoreHelpers.length===0){
    box.innerHTML='<div style="font-size:12px;color:var(--muted);text-align:center;padding:8px">لا يوجد مساعدين بعد</div>';
    return;
  }
  box.innerHTML=currentStoreHelpers.map((email,i)=>`
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:#fff;border-radius:8px;margin-bottom:6px;border:1px solid var(--border)">
      <span style="font-size:12.5px;direction:ltr;word-break:break-all;flex:1">${escapeHtml(email)}</span>
      <button onclick="removeStoreHelper(${i})" style="background:#fdeceb;color:#e5484d;border:none;padding:6px 10px;border-radius:8px;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer">🗑️</button>
    </div>
  `).join("");
}
window.addStoreHelper=()=>{
  const input=document.getElementById("newHelperEmail");
  const email=(input.value||"").trim().toLowerCase();
  if(!email){showToast("⚠️ اكتب الإيميل","warn");return;}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){showToast("❌ إيميل غير صحيح","error");return;}
  if(currentStoreHelpers.includes(email)){showToast("⚠️ موجود مسبقاً","warn");return;}
  if(currentStoreHelpers.length>=10){showToast("⚠️ الحد الأقصى 10 مساعدين","warn");return;}
  currentStoreHelpers.push(email);
  input.value="";
  renderStoreHelpersList();
  showToast("✅ تم الإضافة — لا تنسى حفظ التعديلات","success",3000);
};
window.removeStoreHelper=async(index)=>{
  const ok = await showConfirmModal("هل تريد إزالة هذا المساعد من المتجر؟", { isDanger: true, confirmText: "إزالة" });
  if(!ok) return;
  currentStoreHelpers.splice(index,1);
  renderStoreHelpersList();
  showToast("✅ تم الحذف — لا تنسى حفظ التعديلات","success",3000);
};
window.isStoreHelper=(storeId,userEmail)=>{
  if(!userEmail)return false;
  const store=allStores.find(s=>s.id===storeId);
  if(!store||!Array.isArray(store.helpers))return false;
  return store.helpers.includes(userEmail.toLowerCase());
};

/* ===== Feedback ===== */
window.openFeedback=()=>{
  const t=document.getElementById("fbType");
  const m=document.getElementById("fbMessage");
  const c=document.getElementById("fbContact");
  if(t)t.value="bug";
  if(m)m.value="";
  if(c)c.value="";
  feedbackOverlay.classList.remove("hidden");
};
window.submitFeedback=async()=>{
  const type=document.getElementById("fbType").value;
  const message=(document.getElementById("fbMessage").value||"").trim();
  const contact=(document.getElementById("fbContact").value||"").trim();
  if(message.length<10){showToast("⚠️ اكتب رسالة (10 أحرف على الأقل)","warn");return;}
  const btn=document.getElementById("fbSendBtn");
  btn.disabled=true;btn.textContent="⏳ جاري الإرسال...";
  try{
    await addDoc(collection(db,"feedback"),{
      type:type,
      message:message.slice(0,1000),
      contact:contact.slice(0,100),
      userEmail:(auth.currentUser&&auth.currentUser.email)||"",
      userUid:(auth.currentUser&&auth.currentUser.uid)||"",
      pageUrl:window.location.href.slice(0,500),
      userAgent:navigator.userAgent.slice(0,300),
      createdAt:Date.now(),
      status:"new"
    });
    showToast("✅ وصلتنا رسالتك، شكراً لك!","success",3000);
    closeOverlay();
  }catch(e){showToast("❌ خطأ: "+e.message,"error");}
  finally{btn.disabled=false;btn.textContent="📤 إرسال الرسالة";}
};

/* ===== التعديلات الجديدة على السعر ===== */
window.onPriceTypeChange=()=>{
  const contact=document.getElementById("contactPrice");
  const priceInput=document.getElementById("price");
  const label=document.getElementById("contactPriceLabel");
  const discField=document.getElementById("discountField");
  if(!contact||!priceInput)return;
  if(contact.checked){
    priceInput.disabled=true;
    priceInput.value="";
    priceInput.placeholder="— تواصل لمعرفة السعر —";
    priceInput.style.background="#f3f4f6";
    if(label){label.style.borderColor="var(--teal)";label.style.background="var(--teal-light)";}
    if(discField)discField.style.display="none";
  }else{
    priceInput.disabled=false;
    priceInput.placeholder="0";
    priceInput.style.background="";
    if(label){label.style.borderColor="var(--border)";label.style.background="var(--card)";}
    if(discField)discField.style.display="block";
  }
  updateDiscountPreview();
};

window.toggleReceiptPhoneField=()=>{
  const cat=document.getElementById("storeCategory")?.value;
  const isRest=isRestaurantCategory(cat);
  const rField=document.getElementById("storeReceiptPhoneField");
  if(rField)rField.style.display="none";
  const cField=document.getElementById("storeCallPhoneField");
  if(cField)cField.style.display=isRest?"block":"none";
  const pLbl=document.getElementById("storePhoneLabel");
  if(pLbl)pLbl.textContent=isRest?"🧾 رقم واتساب (لاستلام واصل التحويل المصرفي فقط)":"📱 رقم الهاتف والواتساب (الاتصال والواتساب واحد)";
  const pHelp=document.getElementById("storePhoneHelp");
  if(pHelp)pHelp.textContent=isRest?"💡 طلب الأوردر يكون بالاتصال الهاتفي فقط. هذا الرقم مخصص لإرسال واصل التحويل إذا رغب الزبون بالدفع عبر تحويل مصرفي.":"💡 في المتاجر والشركات، رقم الواتساب والاتصال موحّد";
  const nLbl=document.getElementById("storeNameLabel");
  if(nLbl)nLbl.textContent=isRest?"اسم المطعم":"اسم المتجر / الشركة";
};
window.toggleEditReceiptPhoneField=()=>{
  const cat=document.getElementById("editStoreCategory")?.value;
  const isRest=isRestaurantCategory(cat);
  const rField=document.getElementById("editStoreReceiptPhoneField");
  if(rField)rField.style.display="none";
  const cField=document.getElementById("editStoreCallPhoneField");
  if(cField)cField.style.display=isRest?"block":"none";
  const pLbl=document.getElementById("editStorePhoneLabel");
  if(pLbl)pLbl.textContent=isRest?"🧾 رقم واتساب (لاستلام واصل التحويل المصرفي فقط)":"📱 رقم الهاتف والواتساب (الاتصال والواتساب واحد)";
  const pHelp=document.getElementById("editStorePhoneHelp");
  if(pHelp)pHelp.textContent=isRest?"💡 طلب الأوردر يكون بالاتصال الهاتفي فقط. هذا الرقم مخصص لإرسال واصل التحويل في حال الدفع المصرفي.":"💡 في المتاجر والشركات، رقم الواتساب والاتصال موحّد";
};
  /* ============================================
   ✅ أدوات مساعدة (formatPrice + buildEmptyState)
   ============================================ */
function escapeHtml(str){return String(str).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
window.escapeHtml=escapeHtml;
function formatPrice(n){if(n==null||n===""||isNaN(n))return"";return Number(n).toLocaleString('en-US');}
window.formatPrice=formatPrice;

/* ✅ دالة الصفحة الفارغة الآمنة — string concatenation فقط، بدون تداخل */
function buildEmptyState(icon, title, desc, btnLabel, btnOnclick, btnSecondary){
  var cls = btnSecondary ? 'esBtn esBtnSecondary' : 'esBtn';
  var btnHtml = btnLabel ? '<button class="' + cls + '" onclick="' + btnOnclick + '">' + btnLabel + '</button>' : '';
  return '<div class="emptyState">' +
    '<div class="esIcon">' + icon + '</div>' +
    '<div class="esTitle">' + title + '</div>' +
    '<div class="esDesc">' + desc + '</div>' +
    btnHtml +
  '</div>';
}

/* ============================================
   الأقسام + الشاشات + التنقل
   ============================================ */
function catIconHtml(c){
  const color=c.color||"#38bdf8";
  if(c.image){
    return `<div class="catIconWrap catIconImg"><img src="${c.image}" alt="${c.name}" loading="lazy"></div>`;
  }
  return `<div class="catIconWrap" style="background:${color}"><i data-lucide="${c.iconName||'circle'}"></i></div>`;
}
function buildCategoriesGrid(){
  const grid=document.getElementById("categoriesGrid");
  if(!grid)return;
  grid.innerHTML=CATEGORIES.map(c=>{
    if(c.isStore)return `<div class="catBox storeBox" onclick="openStores('stores')">${catIconHtml(c)}<div class="catName">الشركات والمتاجر</div></div>`;
    if(c.isRestaurantDirectory || isRestaurantCategory(c.name))return `<div class="catBox restaurantBox" onclick="openRestaurants()">${catIconHtml(c)}<div class="catName">المطاعم والمأكولات</div></div>`;
    if(c.name==="الكل")return `<div class="catBox allBox" onclick="openCategory('الكل')">${catIconHtml(c)}<div class="catName">الكل</div></div>`;
    return `<div class="catBox" onclick="openCategory('${c.name.replace(/'/g,"\\'")}')">${catIconHtml(c)}<div class="catName">${c.name}</div></div>`;
  }).join("");
  if(window.lucide) lucide.createIcons();
}
buildCategoriesGrid();

function setTopbarMode(mode){if(!mainTopbar)return;if(mode==="scroll"){mainTopbar.classList.add("scrollAway");}else{mainTopbar.classList.remove("scrollAway");}}

/* ============================================
   📱 إدارة زر الرجوع للهاتف والمتصفح (Phone & Browser Back Navigation)
   ============================================ */
let _isHistoryNavigating = false;

function pushNavState(stateObj, hash) {
  if (_isHistoryNavigating) return;
  const newHash = hash || (stateObj && stateObj.screen ? '#' + stateObj.screen : '');
  const url = window.location.pathname + window.location.search + newHash;
  try {
    history.pushState(stateObj, '', url);
  } catch(e) {}
}
window.pushNavState = pushNavState;

function getActiveTopView() {
  const sv = document.getElementById("storyViewerOverlay");
  if (sv && !sv.classList.contains("hidden")) return { type: 'storyViewer' };

  const lb = document.getElementById("lightbox");
  if (lb && !lb.classList.contains("hidden")) return { type: 'lightbox' };

  const sm = document.getElementById("storyModalOverlay");
  if (sm && !sm.classList.contains("hidden")) return { type: 'storyModal' };

  const tp = document.getElementById("transferPostsOverlay");
  if (tp) return { type: 'customOverlay', el: tp };

  const openOverlay = document.querySelector(".overlay:not(.hidden)");
  if (openOverlay) return { type: 'overlay', el: openOverlay };

  const cashSc = document.getElementById("restaurantCashierScreen");
  if (cashSc && !cashSc.classList.contains("hidden")) return { type: 'cashier' };

  const chatSc = document.getElementById("userChatOverlay");
  if (chatSc && !chatSc.classList.contains("hidden")) return { type: 'chat' };

  const inboxSc = document.getElementById("inboxScreen");
  if (inboxSc && !inboxSc.classList.contains("hidden")) return { type: 'inbox' };

  const accSc = document.getElementById("accountScreen");
  if (accSc && !accSc.classList.contains("hidden")) return { type: 'account' };

  if (typeof postOverlay !== 'undefined' && postOverlay && !postOverlay.classList.contains("hidden")) return { type: 'post' };

  const sc = document.getElementById("storeScreen");
  if (sc && !sc.classList.contains("hidden")) return { type: 'store' };

  const formEl = document.getElementById("form");
  if (formEl && !formEl.classList.contains("hidden")) return { type: 'form' };

  const ss = document.getElementById("storesScreen");
  if (ss && !ss.classList.contains("hidden")) return { type: 'stores' };

  const homeEl = document.getElementById("home");
  const catScEl = document.getElementById("categoriesScreen");
  if (homeEl && !homeEl.classList.contains("hidden") && catScEl && catScEl.classList.contains("hidden")) {
    return { type: 'home' };
  }

  return null;
}
window.getActiveTopView = getActiveTopView;

function performBackAction() {
  const top = getActiveTopView();
  if (!top) return false;

  if (top.type === 'storyViewer') {
    closeStoryViewerDirect();
    return true;
  }
  if (top.type === 'lightbox') {
    if (typeof closeLightboxDirect === 'function') closeLightboxDirect();
    else { const lb = document.getElementById("lightbox"); if (lb) lb.classList.add("hidden"); }
    return true;
  }
  if (top.type === 'storyModal') {
    if (typeof closeStoryModalDirect === 'function') closeStoryModalDirect();
    else { const sm = document.getElementById("storyModalOverlay"); if (sm) sm.classList.add("hidden"); }
    return true;
  }
  if (top.type === 'customOverlay') {
    if (top.el && top.el.remove) top.el.remove();
    return true;
  }
  if (top.type === 'overlay') {
    closeOverlayDirect();
    return true;
  }
  if (top.type === 'cashier') {
    if (typeof closeRestaurantCashierDirect === 'function') closeRestaurantCashierDirect();
    else closeRestaurantCashier();
    return true;
  }
  if (top.type === 'chat') {
    if (typeof closeUserChatDirect === 'function') closeUserChatDirect();
    else closeUserChat();
    return true;
  }
  if (top.type === 'inbox') {
    if (typeof backFromInboxDirect === 'function') backFromInboxDirect();
    else { const is = document.getElementById("inboxScreen"); if (is) is.classList.add("hidden"); showCategoriesScreenDirect(); }
    return true;
  }
  if (top.type === 'account') {
    if (typeof backFromAccountDirect === 'function') backFromAccountDirect();
    else { const as = document.getElementById("accountScreen"); if (as) as.classList.add("hidden"); showCategoriesScreenDirect(); }
    return true;
  }
  if (top.type === 'post') {
    closeOverlayDirect();
    return true;
  }
  if (top.type === 'overlay') {
    closeOverlayDirect();
    return true;
  }
  if (top.type === 'store') {
    if (typeof backFromStoreDirect === 'function') backFromStoreDirect();
    else { const sc = document.getElementById("storeScreen"); if (sc) sc.classList.add("hidden"); showCategoriesScreenDirect(); }
    return true;
  }
  if (top.type === 'form') {
    if (typeof backFromFormDirect === 'function') backFromFormDirect();
    else showCategoriesScreenDirect();
    return true;
  }
  if (top.type === 'stores') {
    showCategoriesScreenDirect();
    return true;
  }
  if (top.type === 'home') {
    showCategoriesScreenDirect();
    return true;
  }
  return false;
}
window.performBackAction = performBackAction;

window.addEventListener('popstate', (e) => {
  _isHistoryNavigating = true;
  try {
    performBackAction();
  } catch(err) {
    console.error("Back navigation error:", err);
  } finally {
    setTimeout(() => { _isHistoryNavigating = false; }, 60);
  }
});

if (typeof window !== 'undefined') {
  try {
    if (!window.history.state) {
      window.history.replaceState({ screen: 'root' }, '', window.location.href);
    }
  } catch(e) {}
}

function showCategoriesScreenDirect(){
  showOnlyMine=false;showOnlyFavorites=false;currentSubCategory="الكل";currentStoreFilter=null;
  const cr=document.getElementById("catsRow");
  if(cr) cr.classList.remove("hidden");
  categoriesScreen.classList.remove("hidden");home.classList.add("hidden");form.classList.add("hidden");
  const ss=document.getElementById("storesScreen");if(ss)ss.classList.add("hidden");
  const sc=document.getElementById("storeScreen");if(sc)sc.classList.add("hidden");
  const as=document.getElementById("accountScreen");if(as)as.classList.add("hidden");
  const inSc=document.getElementById("inboxScreen");if(inSc)inSc.classList.add("hidden");
  closeOverlayDirect();setActiveNav("home");setTopbarMode("sticky");
  renderRecentlyViewed();if(typeof renderHomeStoriesBar==="function")renderHomeStoriesBar();updateCartUI();updateCompareUI();window.scrollTo(0,0);
  showFloatingButtons();
}
window.showCategoriesScreenDirect=showCategoriesScreenDirect;
window.showCategoriesScreen=()=>{
  if(!_isHistoryNavigating && window.history.state && (window.history.state.screen === 'stores' || window.history.state.screen === 'category' || window.history.state.screen === 'mine' || window.history.state.screen === 'fav')){
    window.history.back();
    return;
  }
  showCategoriesScreenDirect();
};

function openCategoryDirect(cat){
  currentCategory=cat;currentSubCategory="الكل";currentStoreFilter=null;showOnlyMine=false;showOnlyFavorites=false;
  const titleEl=document.getElementById("categoryTitle");
  if(titleEl)titleEl.textContent=cat==="الكل"?"كل الإعلانات":cat;
  categoriesScreen.classList.add("hidden");home.classList.remove("hidden");form.classList.add("hidden");
  const ss=document.getElementById("storesScreen");if(ss)ss.classList.add("hidden");
  const sc=document.getElementById("storeScreen");if(sc)sc.classList.add("hidden");
  const as=document.getElementById("accountScreen");if(as)as.classList.add("hidden");
  const inSc=document.getElementById("inboxScreen");if(inSc)inSc.classList.add("hidden");
  closeOverlayDirect();setActiveNav("home");setTopbarMode("scroll");
  const cr=document.getElementById("catsRow");
  if(cr) cr.classList.toggle("hidden", cat!=="الكل");
  const carBar = document.getElementById("carBrandsQuickBar");
  if(carBar) carBar.style.display = (cat === "سيارات ومركبات") ? "flex" : "none";
  document.querySelectorAll(".catChip").forEach(b=>b.classList.toggle("active",b.dataset.cat===cat && !b.classList.contains("storeChip")));
  renderSubCats();renderPosts();updateCartUI();window.scrollTo(0,0);
  hideFloatingButtons();
}
window.openCategoryDirect=openCategoryDirect;
window.openCategory=(cat,skipHistory)=>{
  openCategoryDirect(cat);
  if(!skipHistory) pushNavState({ screen: 'category', cat: cat }, '#cat-' + encodeURIComponent(cat || 'all'));
};

window.pickCarBrandFilter = function(brand){
  document.querySelectorAll(".carBrandPill").forEach(p => {
    p.classList.toggle("active", p.textContent.includes(brand));
  });
  if(brand === "الكل"){
    currentSubCategory = "الكل";
  } else {
    currentSubCategory = brand;
  }
  renderPosts();
};

window.submitCatSearch = function(){
  const catInput = document.getElementById("searchInputCat");
  const homeInput = document.getElementById("searchInput");
  const query = (catInput ? catInput.value : "").trim();
  if(homeInput) homeInput.value = query;
  
  const carBrandsLower = CAR_BRANDS.map(b => b.toLowerCase());
  const isCarSearch = query && (query.includes("سيار") || carBrandsLower.some(b => query.toLowerCase().includes(b)));
  
  if(isCarSearch){
    openCategory("سيارات ومركبات");
  } else {
    openCategory("الكل");
  }
  
  if(query && typeof searchServerPosts === "function") searchServerPosts(query);
  renderPosts();
};

function backFromFormDirect(){
  if(showOnlyMine){if(typeof showMyPostsDirect === 'function') showMyPostsDirect(); else showMyPosts();}
  else if(showOnlyFavorites){if(typeof showFavoritesDirect === 'function') showFavoritesDirect(); else showFavorites();}
  else if(currentCategory && currentCategory!=="الكل"){openCategoryDirect(currentCategory);}
  else{showCategoriesScreenDirect();}
}
window.backFromFormDirect=backFromFormDirect;
window.backFromForm=()=>{
  if(!_isHistoryNavigating && window.history.state && window.history.state.screen === 'form'){
    window.history.back();
    return;
  }
  backFromFormDirect();
};
window.focusSearchInHome=()=>{openCategory("الكل");setTimeout(()=>{const i=document.getElementById("searchInput");if(i)i.focus();},200);};
window.filterCityCat=()=>{const v=document.getElementById("cityFilterCat").value;document.getElementById("cityFilter").value=v;currentCity=v;openCategory("الكل");setTimeout(()=>{document.getElementById("cityFilter").value=v;currentCity=v;renderPosts();},100);};

window.setSort=(type)=>{
  currentSort=type;
  document.querySelectorAll(".filterBar .filterBtn").forEach(b=>{if(b.id && b.id.startsWith("sort"))b.classList.remove("active");});
  const el=document.getElementById(type==="newest"?"sortNewest":type==="cheapest"?"sortCheapest":type==="expensive"?"sortExpensive":"sortViews");
  if(el)el.classList.add("active");
  renderPosts();
};
window.togglePriceFilter=()=>{const row=document.getElementById("priceFilterRow");const btn=document.getElementById("priceFilterToggle");if(!row)return;row.classList.toggle("open");if(btn)btn.classList.toggle("active",row.classList.contains("open"));};
window.applyPriceFilter=()=>{const mn=parseInt(document.getElementById("priceMin").value,10);const mx=parseInt(document.getElementById("priceMax").value,10);currentPriceMin=isNaN(mn)?null:mn;currentPriceMax=isNaN(mx)?null:mx;renderPosts();};
window.clearPriceFilter=()=>{document.getElementById("priceMin").value="";document.getElementById("priceMax").value="";currentPriceMin=null;currentPriceMax=null;renderPosts();};

window.toggleAdTypeFilter=()=>{
  const btn=document.getElementById("adTypeFilter");
  if(currentAdTypeFilter==="all"){currentAdTypeFilter="wanted";if(btn){btn.classList.add("wantedActive");btn.innerHTML="🎯 مطلوب فقط";}}
  else if(currentAdTypeFilter==="wanted"){currentAdTypeFilter="offer";if(btn){btn.classList.remove("wantedActive");btn.innerHTML="🛒 معروض فقط";}}
  else{currentAdTypeFilter="all";if(btn){btn.classList.remove("wantedActive");btn.innerHTML="🎯 مطلوب";}}
  renderPosts();
};

/* ============================================
   تصفحتها حديثاً
   ============================================ */
function getRecentViews(){try{return JSON.parse(localStorage.getItem('recentViews')||'[]');}catch(e){return[];}}
function addRecentView(id){try{let v=getRecentViews().filter(x=>x!==id);v.unshift(id);if(v.length>10)v=v.slice(0,10);localStorage.setItem('recentViews',JSON.stringify(v));}catch(e){}}
function renderRecentlyViewed(){
  const section=document.getElementById("recentSection");
  const box=document.getElementById("recentScroll");
  if(!section||!box)return;
  const ids=getRecentViews();
  const items=ids.map(id=>allPosts.find(p=>p.id===id)).filter(p=>p && getStatus(p)==="approved" && !isExpired(p) && !p.sold);
  if(items.length===0){section.classList.remove("hasItems");box.innerHTML="";return;}
  section.classList.add("hasItems");
  box.innerHTML=items.map(p=>{
    const imgs=getImages(p);const th=imgs[0]||"";
    const priceTxt=p.priceType==="contact"?"📞 تواصل":(p.price!=null?formatPrice(p.price)+" د.ل":"");
    return `<div class="recentItem" onclick="openPost('${p.id}')"><div style="width:100%;aspect-ratio:1/1;background:var(--teal-light);overflow:hidden">${th?`<img src="${escapeHtml(th)}" class="recentThumb">`:`<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:24px;opacity:.5">🖼️</div>`}</div><div class="recentInfo"><div class="recentName">${escapeHtml(p.title||"بدون عنوان")}</div><div class="recentPrice">${priceTxt}</div></div></div>`;
  }).join("");
}

/* ============================================
   البحث
   ============================================ */
const searchInputEl=document.getElementById("searchInput");
const clearSearchBtnEl=document.getElementById("clearSearchBtn");
try{const saved=localStorage.getItem('lastSearch');if(saved && searchInputEl){searchInputEl.value=saved;if(clearSearchBtnEl)clearSearchBtnEl.style.display='flex';if(saved.trim().length>=2)setTimeout(()=>searchServerPosts(saved.trim()),800);}}catch(e){}
let _searchDebounceTimer=null;
let _serverSearchCache={};
let _isSearchingServer=false;

async function searchServerPosts(term){
  if(!term || term.trim().length < 2) return;
  const cleanTerm = term.trim().toLowerCase();
  if(_serverSearchCache[cleanTerm]) return;

  try {
    const seenIds = new Set(allPosts.map(p => p.id));
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'approved')
      .or(`title.ilike.%${cleanTerm}%,description.ilike.%${cleanTerm}%,brand.ilike.%${cleanTerm}%,category.ilike.%${cleanTerm}%,city.ilike.%${cleanTerm}%`)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      delete _serverSearchCache[cleanTerm];
      console.warn("Supabase search error:", error);
      return;
    }

    _serverSearchCache[cleanTerm] = true;
    let addedCount = 0;
    if (data) {
      data.forEach(item => {
        const p = objectFromDb(item);
        if(!seenIds.has(p.id)){
          seenIds.add(p.id);
          allPosts.push(p);
          addedCount++;
        }
      });
    }

    if(addedCount > 0){
      allPosts = sortPosts(allPosts);
      renderPosts();
    }
  } catch(err){
    delete _serverSearchCache[cleanTerm];
    console.warn("Server search error:", err);
  }
}
window.searchServerPosts = searchServerPosts;

if(searchInputEl){
  searchInputEl.addEventListener('input',function(){
    const v=this.value||"";
    try{localStorage.setItem('lastSearch',v);}catch(e){}
    if(clearSearchBtnEl)clearSearchBtnEl.style.display=v.length>0?'flex':'none';
    if(typeof showSearchDropdown==='function')showSearchDropdown();
    if(_searchDebounceTimer)clearTimeout(_searchDebounceTimer);
    _searchDebounceTimer=setTimeout(()=>{
      if(v.trim().length>=2){searchServerPosts(v.trim());}
      if(typeof renderPosts==='function')renderPosts();
    },400);
  });
  searchInputEl.addEventListener('focus',function(){if(typeof showSearchDropdown==='function')showSearchDropdown();});
}
if(clearSearchBtnEl){clearSearchBtnEl.addEventListener('click',function(e){e.preventDefault();if(searchInputEl)searchInputEl.value="";try{localStorage.removeItem('lastSearch');}catch(e){}this.style.display='none';if(typeof hideSearchDropdown==='function')hideSearchDropdown();if(typeof renderPosts==='function')renderPosts();});}

function getSearchHistory(){try{return JSON.parse(localStorage.getItem('searchHistory')||'[]');}catch(e){return[];}}
function addToSearchHistory(term){if(!term||term.trim().length<2)return;const t=term.trim();let h=getSearchHistory().filter(x=>x!==t);h.unshift(t);if(h.length>10)h=h.slice(0,10);try{localStorage.setItem('searchHistory',JSON.stringify(h));}catch(e){}}
function removeFromHistory(term,event){if(event)event.stopPropagation();let h=getSearchHistory().filter(x=>x!==term);try{localStorage.setItem('searchHistory',JSON.stringify(h));}catch(e){}showSearchDropdown();}
async function clearSearchHistory(event){
  if(event)event.stopPropagation();
  const confirmed = await showConfirmModal("مسح كل سجل البحث السابق؟", { confirmText: "مسح السجل" });
  if(!confirmed) return;
  try{localStorage.removeItem('searchHistory');}catch(e){}
  showSearchDropdown();
}
function getSuggestions(term){const t=(term||"").trim().toLowerCase();const seen=new Set();const results=[];allPosts.forEach(p=>{if(getStatus(p)!=="approved")return;if(isExpired(p))return;if(p.sold)return;const title=(p.title||"").trim();if(!title)return;const lower=title.toLowerCase();if(t && !lower.includes(t))return;const key=lower.slice(0,30);if(seen.has(key))return;seen.add(key);results.push({title,price:p.price,priceType:p.priceType,thumb:(p.images&&p.images[0])||p.imageUrl||""});});if(t){const allBrands=[...CAR_BRANDS,...MOTORCYCLE_BRANDS,...PHONE_BRANDS,...COMPUTER_BRANDS,...ANIMAL_TYPES,...PERFUME_TYPES];allBrands.forEach(b=>{if(b.toLowerCase().includes(t) && !seen.has(b.toLowerCase())){seen.add(b.toLowerCase());results.push({title:b,price:null,thumb:"",isBrand:true});}});}return results.slice(0,6);}

window.showSearchDropdown=function(){
  const box=document.getElementById("searchDropdown"),input=document.getElementById("searchInput");
  if(!box||!input)return;
  const term=(input.value||"").trim();
  const history=getSearchHistory();
  const suggestions=getSuggestions(term);
  let html="";
  if(!term && history.length>0){
    html+=`<div class="sdSection">🕐 آخر ما بحثت عنه</div>`;
    html+=history.map(h=>{
      const safeH=escapeHtml(h).replace(/'/g,"&#39;");
      return `<div class="sdItem" onclick="pickSearch('${safeH}')"><span class="sdIcon">🕐</span><span class="sdText">${escapeHtml(h)}</span><button class="sdRemove" onclick="removeFromHistory('${safeH}',event)">✕</button></div>`;
    }).join("");
    html+=`<div class="sdClearAll" onclick="clearSearchHistory(event)">🗑️ مسح كل السجل</div>`;
  }
  if(suggestions.length>0){
    const label=term?"💡 مقترحات":"🔥 إعلانات مقترحة";
    html+=`<div class="sdSection">${label}</div>`;
    html+=suggestions.map(s=>{
      const safeTitle=escapeHtml(s.title).replace(/'/g,"&#39;");
      const priceTxt=s.priceType==="contact"?"📞 تواصل":(s.price!=null?formatPrice(s.price)+" د.ل":"");
      return `<div class="sdItem" onclick="pickSearch('${safeTitle}')"><span class="sdIcon">${s.isBrand?"🏷️":(s.thumb?"📦":"🔎")}</span><span class="sdText">${escapeHtml(s.title)}</span>${priceTxt?`<span style="font-size:11.5px;color:var(--teal-dark);font-weight:700">${priceTxt}</span>`:""}</div>`;
    }).join("");
  }
  if(!html)html=`<div class="sdSection" style="text-align:center;padding:20px;color:var(--muted)">اكتب للبحث...</div>`;
  box.innerHTML=html;
  box.classList.remove("hidden");
};
window.hideSearchDropdown=function(){const box=document.getElementById("searchDropdown");if(box)box.classList.add("hidden");};
window.pickSearch=function(term){const input=document.getElementById("searchInput");if(!input)return;input.value=term;addToSearchHistory(term);try{localStorage.setItem('lastSearch',term);}catch(e){}updateClearBtn();hideSearchDropdown();input.blur();if(term&&term.trim().length>=2){searchServerPosts(term.trim());}renderPosts();};
window.updateClearBtn=function(){const i=document.getElementById("searchInput");const b=document.getElementById("clearSearchBtn");if(!i||!b)return;b.style.display=(i.value&&i.value.length>0)?"flex":"none";};
window.clearSearch=function(){const i=document.getElementById("searchInput");if(i){i.value="";i.focus();}try{localStorage.removeItem('lastSearch');}catch(e){}updateClearBtn();hideSearchDropdown();renderPosts();};
document.addEventListener('click',(e)=>{const box=document.querySelector('.searchBox');if(box && !box.contains(e.target)){hideSearchDropdown();}});

/* ============================================
   أدوات الإعلانات
   ============================================ */
function isPostFeatured(p){return !!(p&&p.featured&&p.featuredUntil&&p.featuredUntil>Date.now());}
function featuredDaysLeft(p){if(!isPostFeatured(p))return 0;return Math.ceil((p.featuredUntil-Date.now())/(24*60*60*1000));}
function getStatus(p){return p.status||"approved";}
function getExpiresAt(p){if(p && p.expiresAt) return p.expiresAt;if(p && p.createdAt) return p.createdAt + POST_DURATION_MS;return null;}
function isExpired(p){const e=getExpiresAt(p);if(!e)return false;return e < Date.now();}
function daysLeft(p){const e=getExpiresAt(p);if(!e)return null;return Math.ceil((e-Date.now())/(24*60*60*1000));}
function expiredGracePassed(p){const e=getExpiresAt(p);if(!e)return false;const graceEnd=e+EXPIRED_GRACE_DAYS*24*60*60*1000;return Date.now()>graceEnd;}
function isWanted(p){return p && p.adType==="wanted";}

function sortPosts(arr){
  const featuredFirst=(a,b)=>{const af=isPostFeatured(a)?1:0;const bf=isPostFeatured(b)?1:0;return bf-af;};
  return arr.slice().sort((a,b)=>{
    const ff=featuredFirst(a,b);
    if(ff!==0)return ff;
    switch(currentSort){
      case "cheapest":return (Number(a.price)||0)-(Number(b.price)||0);
      case "expensive":return (Number(b.price)||0)-(Number(a.price)||0);
      case "views":return (b.views||0)-(a.views||0);
      default:return (b.createdAt||0)-(a.createdAt||0);
    }
  });
}

/* ============================================
   المفضلة + المشاهدات
   ============================================ */
function getFavorites(){try{return JSON.parse(localStorage.getItem('favorites')||'[]');}catch(e){return[];}}
function saveFavorites(arr){try{localStorage.setItem('favorites',JSON.stringify(arr));}catch(e){}}
function isFavorite(id){return getFavorites().includes(id);}
window.toggleFavorite=(id,event)=>{if(event)event.stopPropagation();let favs=getFavorites();if(favs.includes(id)){favs=favs.filter(x=>x!==id);incrementFavoritesCount(id,-1);}else{favs.push(id);incrementFavoritesCount(id,1);}saveFavorites(favs);renderPosts();};
function hasViewedOnDevice(id){try{const v=JSON.parse(localStorage.getItem('viewedPosts')||'[]');return v.includes(id);}catch(e){return false;}}
function markViewedOnDevice(id){try{let v=JSON.parse(localStorage.getItem('viewedPosts')||'[]');if(!v.includes(id)){v.push(id);if(v.length>300)v=v.slice(-300);localStorage.setItem('viewedPosts',JSON.stringify(v));}}catch(e){}}
async function incrementViews(id){try{if(hasViewedOnDevice(id))return;markViewedOnDevice(id);await updateDoc(doc(db,"posts",id),{views:increment(1)});}catch(e){}}
async function incrementWhatsappClick(id,type){
  if(!id)return;
  type=type||'post';
  try{
    const coll=(type==='store')?'stores':'posts';
    await updateDoc(doc(db,coll,id),{whatsappClicks:increment(1)});
  }catch(e){}
}
async function incrementFavoritesCount(postId,delta){if(!postId)return;try{await updateDoc(doc(db,"posts",postId),{favoritesCount:increment(delta)});}catch(e){}}

/* ============================================
   إعلان Popup
   ============================================ */
const AD_IMAGE_URL="https://placehold.co/600x800/38bdf8/ffffff?text=اعلان+هنا";
const AD_INTERVAL_DAYS=30;
function showAdIfDue(){try{const last=localStorage.getItem('adLastShownAt');const now=Date.now();const interval=AD_INTERVAL_DAYS*24*60*60*1000;if(!last||(now-parseInt(last,10))>=interval){const img=document.getElementById('adImage');if(img)img.src=AD_IMAGE_URL;const popup=document.getElementById('adPopup');if(popup)popup.classList.remove('hidden');localStorage.setItem('adLastShownAt',String(now));}}catch(e){}}
window.closeAd=function(){const p=document.getElementById('adPopup');if(p)p.classList.add('hidden');};
setTimeout(showAdIfDue,2600);

/* ============================================
   المتاجر — ساعات + تقييم + شارات
   ============================================ */
function isStoreOpen(store){
  if(!store || !store.workingHours) return null;
  const wh=store.workingHours;
  if(wh.alwaysOpen) return true;
  const now=new Date();
  const [oh,om]=(wh.openTime||"09:00").split(":").map(Number);
  const [ch,cm]=(wh.closeTime||"23:00").split(":").map(Number);
  const current=now.getHours()*60+now.getMinutes();
  const open=oh*60+om;
  const close=ch*60+cm;
  if(close>open){ return current>=open && current<close; }
  return current>=open || current<close;
}
function formatStoreHours(store){
  if(!store || !store.workingHours) return "";
  const wh=store.workingHours;
  if(wh.alwaysOpen) return "24 ساعة";
  return `${wh.openTime} - ${wh.closeTime}`;
}
function openBadgeHTML(store){
  const open=isStoreOpen(store);
  if(open===null) return "";
  if(open) return `<span class="openBadgeGreen">🟢 مفتوح الآن</span>`;
  return `<span class="openBadgeRed">🔴 مغلق حالياً</span>`;
}
function getSellerTier(postCount){
  if(postCount>=50)return{tier:"diamond",label:"💎 ماسي"};
  if(postCount>=21)return{tier:"gold",label:"🥇 ذهبي"};
  if(postCount>=6)return{tier:"silver",label:"🥈 فضي"};
  if(postCount>=1)return{tier:"bronze",label:"🥉 برونزي"};
  return null;
}
function renderSellerTierBadge(uid,postCount){
  const t=getSellerTier(postCount);
  if(!t)return "";
  return `<span class="sellerTier ${t.tier}">${t.label}</span>`;
}

async function loadStoreRatings(storeId){
  if(allStoreRatings[storeId]) return allStoreRatings[storeId];
  try{
    const snap=await getDocs(query(collection(db,"storeRatings"),where("storeId","==",storeId)));
    const ratings=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    allStoreRatings[storeId]=ratings;
    return ratings;
  }catch(e){allStoreRatings[storeId]=[];return [];}
}
window.openStoreRating=async(storeId)=>{
  const me=auth.currentUser;
  if(!me){pendingAction={type:"storeRating",storeId};authOverlay.classList.remove("hidden");return;}
  const ratings=await loadStoreRatings(storeId);
  const mine=ratings.find(r=>r.raterUid===me.uid);
  const stars = await showPromptModal(`⭐ قيّم المتجر (من 1 إلى 5 نجوم):\n${mine?"تقييمك الحالي: "+mine.stars:"لم تقيّم بعد"}`, mine ? String(mine.stars) : "5", { title: "تقييم المتجر", icon: "⭐", inputType: "number", confirmText: "التالي" });
  if(stars===null) return;
  const s=parseInt(stars,10);
  if(isNaN(s)||s<1||s>5){showToast("⚠️ اختر من 1 إلى 5","warn");return;}
  const comment = await showPromptModal("💬 أضف تعليقاً على تجربتك (اختياري):", mine ? (mine.comment || "") : "", { title: "تعليق على المتجر", icon: "💬", confirmText: "حفظ التقييم", placeholder: "أخبرنا عن جودة الخدمة والمنتجات..." });
  if(comment===null) return;
  try{
    await setDoc(doc(db,"storeRatings",storeId+"_"+me.uid),{
      storeId,raterUid:me.uid,
      raterName:(myProfile&&myProfile.name)||me.displayName||"مستخدم",
      stars:s,comment:(comment||"").trim().slice(0,300),createdAt:Date.now()
    });
    delete allStoreRatings[storeId];
    await loadStoreRatings(storeId);
    showToast("✅ تم حفظ تقييمك","success");
    if(window._currentStoreId===storeId) openStore(storeId,true);
  }catch(e){showToast("خطأ: "+e.message,"error");}
};

/* ============================================
   الخصم + معاينة
   ============================================ */
function getDiscountPercent(post){
  if(!post || !post.originalPrice || !post.price) return 0;
  const orig=Number(post.originalPrice);
  const curr=Number(post.price);
  if(!orig || orig<=curr) return 0;
  return Math.round(((orig-curr)/orig)*100);
}
window.updateDiscountPreview=()=>{
  const orig=parseFloat(document.getElementById("originalPrice")?.value)||0;
  const curr=parseFloat(document.getElementById("price")?.value)||0;
  const box=document.getElementById("discountPreview");
  if(!box) return;
  if(orig>curr && curr>0){
    const pct=Math.round(((orig-curr)/orig)*100);
    box.textContent=`🔥 خصم ${pct}% — سيظهر شارة على المنتج`;
  } else { box.textContent=""; }
};

/* ============================================
   منتجات المتجر (مع الصفحة الفارغة الآمنة)
   ============================================ */
window.setStoreSort=(sort)=>{
  currentStoreSort=sort;
  ["ssortNewest","ssortCheapest","ssortExpensive","ssortViews"].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.classList.remove("active");
  });
  const map={newest:"ssortNewest",cheapest:"ssortCheapest",expensive:"ssortExpensive",views:"ssortViews"};
  const active=document.getElementById(map[sort]);
  if(active) active.classList.add("active");
  renderStoreProducts();
};
/* ============================================
   🍔 بريستو - محرك تصنيفات المتاجر وقوائم المطاعم (Presto Engine)
   ============================================ */
let currentStoreSubCategory = "all";

const STORE_CATEGORY_PRESETS = {
  restaurant: [
    { name: 'برجر', icon: '🍔', keywords: ['برجر', 'burger'] },
    { name: 'ساندوتشات مشاوي', icon: '🥪', keywords: ['ساندوتش', 'سندوتش', 'مشاوي', 'شاورما', 'دجاج', 'لحم', 'بانيني', 'فخد', 'شيز'] },
    { name: 'وجبات سريعة', icon: '🍗', keywords: ['وجبة', 'وجبات', 'كومبو', 'بوكس', 'كرسبي', 'بروستد', 'زنجر', 'ستربس'] },
    { name: 'بيتزا', icon: '🍕', keywords: ['بيتزا', 'pizza'] },
    { name: 'مقبلات ساخنة', icon: '🍟', keywords: ['مقبلات', 'بطاطا', 'اصابع', 'حلقات', 'شيبس', 'صلصة', 'صوص', 'تومية'] },
    { name: 'مشروبات', icon: '🥤', keywords: ['مشروب', 'عصير', 'غازي', 'بيبسي', 'كولا', 'ماء', 'مياه', 'موهيتو', 'قهوة', 'شاي'] },
    { name: 'حلويات وكريب', icon: '🍰', keywords: ['حلو', 'حلويات', 'كريب', 'وافل', 'بان كيك', 'ايسكريم', 'كعك'] }
  ],
  general: [
    { name: 'Apple / آيفون', icon: '🍏', keywords: ['ايفون', 'آيفون', 'iphone', 'apple', 'ابل'] },
    { name: 'Samsung / سامسونج', icon: '📱', keywords: ['سامسونج', 'samsung', 'جالكسي', 'galaxy'] },
    { name: 'Xiaomi / شاومي', icon: '📱', keywords: ['شاومي', 'xiaomi', 'ريدمي', 'redmi', 'بوكو', 'poco'] },
    { name: 'Huawei / هواوي', icon: '📱', keywords: ['هواوي', 'huawei'] },
    { name: 'Honor / هونر', icon: '📱', keywords: ['هونر', 'honor'] },
    { name: 'هواتف نقالة', icon: '📱', keywords: ['هاتف', 'تلفون', 'موبايل', 'نقال', 'جوال', 'نوكيا', 'انفينكس', 'تكنو'] },
    { name: 'كفر', icon: '🛡️', keywords: ['كفر', 'جراب', 'كفرات', 'case', 'cover', 'غطاء', 'حماية ظهر'] },
    { name: 'شواحن', icon: '🔌', keywords: ['شاحن', 'شواحن', 'شاحنة', 'راس', 'رأس', 'charger', 'adapter', 'محول'] },
    { name: 'كابل شحن', icon: '⚡', keywords: ['كابل', 'سلك', 'وصلة', 'كيبل', 'cable', 'type-c', 'lightning', 'شحن سريع', 'مايكرو'] },
    { name: 'سماعات', icon: '🎧', keywords: ['سماعة', 'سماعات', 'ايربودز', 'airpod', 'earphone', 'headphone', 'بودز', 'بلوتوث'] },
    { name: 'سبيكر و ميكروفون', icon: '🔊', keywords: ['سبيكر', 'مكبر', 'مايك', 'ميكروفون', 'speaker', 'mic', 'صوتيات'] },
    { name: 'حاملة هاتف', icon: '🤳', keywords: ['حامل', 'حاملة', 'ستاند', 'stand', 'holder', 'مسكة', 'قاعدة'] },
    { name: 'ساعات ذكية', icon: '⌚', keywords: ['ساعة', 'ساعات', 'سمارت', 'watch', 'smartwatch', 'باند', 'اسوارة'] },
    { name: 'باور بانك', icon: '🔋', keywords: ['باور', 'بنك', 'بطارية', 'خازن', 'powerbank', 'شاحن متنقل'] },
    { name: 'حماية شاشة وكاميرا', icon: '🛡️', keywords: ['حماية', 'شاشة', 'لاصقة', 'زجاج', 'اسكرين', 'screen', 'كاميرا', 'نانو'] },
    { name: 'كابل اوكس', icon: '🎵', keywords: ['اوكس', 'aux'] },
    { name: 'فلاش', icon: '💾', keywords: ['فلاش', 'ذاكرة', 'ميموري', 'flash', 'usb', 'sd', 'فلاشة'] },
    { name: 'ايباد', icon: '📲', keywords: ['ايباد', 'ipad', 'تابلت', 'لوحي', 'tablet'] },
    { name: 'اكسسوارات الهاتف', icon: '✨', keywords: ['اكسسوار', 'إكسسوارات', 'ميدالية', 'ملحقات', 'منوعات'] }
  ]
};

function getProductSubCategory(p, isRestaurant){
  if(p && p.subCategory && p.subCategory.trim()) return p.subCategory.trim();
  const presets = isRestaurant ? STORE_CATEGORY_PRESETS.restaurant : STORE_CATEGORY_PRESETS.general;
  const text = `${p.title || ''} ${p.description || ''} ${p.brand || ''}`.toLowerCase();
  for(const preset of presets){
    for(const kw of preset.keywords){
      if(text.includes(kw.toLowerCase())){
        return preset.name;
      }
    }
  }
  return isRestaurant ? 'وجبات أخرى' : 'أصناف متنوعة';
}

function getCategoryIcon(catName, isRestaurant){
  const presets = isRestaurant ? STORE_CATEGORY_PRESETS.restaurant : STORE_CATEGORY_PRESETS.general;
  const found = presets.find(p => p.name === catName);
  return found ? found.icon : '📦';
}

window.setStoreSubCategory = function(catName){
  currentStoreSubCategory = catName;
  document.querySelectorAll('.restaurantTabItem').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-cat') === catName);
  });
  document.querySelectorAll('.storeCatTile').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-cat') === catName);
  });
  document.querySelectorAll('.storeCatName').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-cat') === catName);
  });
  renderStoreProducts();
};

function renderRestaurantPopular(items){
  if(!items || items.length < 2) return '';
  const popular = items.slice(0, 6);
  return `
    <div class="popularSection">
      <div class="popularTitle">الأكثر طلباً 🔥</div>
      <div class="popularScroll">
        ${popular.map(p => {
          const imgs = getImages(p); const th = imgs[0] || '';
          const isSold = !!p.sold;
          const canCart = !isSold && canHaveCart(p);
          const inCart = cart.items.some(i => i.postId === p.id);
          const cartBtn = canCart ? `<button class="foodAddBtn${inCart ? ' inCart' : ''}" title="${inCart ? 'في السلة' : 'أضف للسلة'}" onclick="event.stopPropagation();addToCart('${p.id}',event)">${inCart ? '✓' : '+'}</button>` : '';
          return `
            <div class="popularCard" onclick="closeOverlay();setTimeout(()=>openPost('${p.id}'),200)">
              <div class="popularImgWrap">
                ${th ? `<img src="${escapeHtml(th)}" alt="${escapeHtml(p.title||'')}">` : `<div class="foodImgPlaceholder">🍔</div>`}
                ${cartBtn}
              </div>
              <div class="popularName">${escapeHtml(p.title||'بدون عنوان')}</div>
              <div class="popularPrice">${p.price != null ? formatPrice(p.price) + ' د.ل' : '📞 للتواصل'}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderRestaurantTabs(items, categories){
  if(!categories || categories.length === 0) return '';
  return `
    <div class="restaurantTabsBar">
      <button class="restaurantTabItem ${currentStoreSubCategory === 'all' ? 'active' : ''}" data-cat="all" onclick="setStoreSubCategory('all')">الكل</button>
      ${categories.map(cat => `
        <button class="restaurantTabItem ${currentStoreSubCategory === cat ? 'active' : ''}" data-cat="${escapeHtml(cat)}" onclick="setStoreSubCategory('${escapeHtml(cat)}')">${escapeHtml(cat)}</button>
      `).join('')}
    </div>
  `;
}

function renderStoreCategoryTiles(items, categories){
  if(!categories || categories.length === 0) return '';
  return `
    <div class="storeSectionTitle">تصفح حسب الفئة</div>
    <div class="storeCatGrid">
      ${categories.map(cat => {
        const icon = getCategoryIcon(cat, false);
        const isActive = currentStoreSubCategory === cat;
        return `
          <div class="storeCatTileWrap" onclick="setStoreSubCategory('${isActive ? 'all' : escapeHtml(cat)}')">
            <div class="storeCatTile ${isActive ? 'active' : ''}" data-cat="${escapeHtml(cat)}">${icon}</div>
            <div class="storeCatName ${isActive ? 'active' : ''}" data-cat="${escapeHtml(cat)}">${escapeHtml(cat)}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

window._currentKshOrder = {};
window.addKshOrder = function(id, title, price){
  window._currentKshOrder[id] = window._currentKshOrder[id] || { title, price: Number(price)||0, count: 0 };
  window._currentKshOrder[id].count++;
  updateKshBar();
  showToast(`أضيف: ${title} (اضغط اتصال بالأسفل للطلب)`, "success", 1600);
};

window.updateKshBar = function(){
  const barTot = document.getElementById("kshBarTot");
  if(!barTot) return;
  let total = 0, count = 0;
  for(const k in window._currentKshOrder){
    total += window._currentKshOrder[k].price * window._currentKshOrder[k].count;
    count += window._currentKshOrder[k].count;
  }
  if(count > 0){
    barTot.textContent = `${formatPrice(total)} د.ل (${count} وجبة)`;
  } else {
    barTot.textContent = "اتصال مباشر";
  }
};

function renderKshFoodItemHtml(p, canManage){
  const imgs = getImages(p); const th = imgs[0] || '';
  const isSold = !!p.sold;
  const actionsHtml = canManage ? `<div style="display:flex;gap:4px;margin-top:6px"><button onclick="event.stopPropagation();closeOverlay();setTimeout(()=>editPost('${p.id}'),200)" style="padding:4px 8px;border:none;border-radius:6px;background:#eef2ff;color:#0284c7;font-size:11px;font-weight:800;cursor:pointer">✏️ تعديل</button><button onclick="event.stopPropagation();deleteStoreProduct('${p.id}')" style="padding:4px 8px;border:none;border-radius:6px;background:#fdeceb;color:#e5484d;font-size:11px;font-weight:800;cursor:pointer">🗑️ حذف</button></div>` : '';
  const priceText = p.priceType === "contact" ? "📞 تواصل" : (p.price != null ? formatPrice(p.price) + " د.ل" : "—");
  const optsHtml = p.brand ? `<div class="opts"><span>${escapeHtml(p.brand)}</span></div>` : '';
  const inCartItem = cart.items.find(i=>i.postId===p.id);
  const inCartQty = inCartItem ? (inCartItem.qty || 1) : 0;
  const addBtnHtml = !isSold ? `
    <button class="kshAdd${inCartQty > 0 ? ' hasCount' : ''}" onclick="event.stopPropagation();addToCart('${p.id}',event)" aria-label="أضف ${escapeHtml(p.title||'')}">
      +
      ${inCartQty > 0 ? `<span class="kshAddBadge">${inCartQty}</span>` : ''}
    </button>
  ` : '';

  return `
    <div class="kshItem" onclick="closeOverlay();setTimeout(()=>openPost('${p.id}'),200)">
      <div class="kshTxt">
        <h3>${escapeHtml(p.title || 'وجبة')}</h3>
        ${p.description ? `<p class="kshDesc">${escapeHtml(p.description)}</p>` : ''}
        ${optsHtml}
        <div class="kshPrice">${priceText}</div>
        ${actionsHtml}
      </div>
      <div class="kshPic">
        ${th ? `<img src="${escapeHtml(th)}" alt="${escapeHtml(p.title||'')}" onerror="this.onerror=null;this.outerHTML='<div class=\\'kshPicEmoji\\'>🍔</div>'">` : '<div class="kshPicEmoji">🍔</div>'}
        ${addBtnHtml}
      </div>
    </div>
  `;
}

function renderPrestoFoodItemHtml(p, canManage){
  return renderKshFoodItemHtml(p, canManage);
}

window.applyStoreProductFilter=()=>{
  const input=document.getElementById("storeProductSearch");
  currentStoreSearch=(input?.value||"").toLowerCase();
  renderStoreProducts();
};

function renderStoreProducts(){
  const box=document.getElementById("storeProductsBox");
  if(!box) return;
  const store = allStores.find(s => s.id === window._currentStoreId);
  const isRestaurant = isRestaurantStore(store);

  let items = currentStoreItems.slice();
  if(currentStoreSearch){
    items = items.filter(p => (p.title||"").toLowerCase().includes(currentStoreSearch));
  }
  if(currentStoreSubCategory && currentStoreSubCategory !== "all"){
    items = items.filter(p => getProductSubCategory(p, isRestaurant) === currentStoreSubCategory);
  }

  items.sort((a,b)=>{
    switch(currentStoreSort){
      case "cheapest":return (Number(a.price)||0)-(Number(b.price)||0);
      case "expensive":return (Number(b.price)||0)-(Number(a.price)||0);
      case "views":return (b.views||0)-(a.views||0);
      default:return (b.createdAt||0)-(a.createdAt||0);
    }
  });

  if(items.length===0){
    const isFiltered = currentStoreSearch.length > 0 || currentStoreSubCategory !== "all";
    const canManage=window._canManageStoreItems;
    const storeId=window._currentStoreId||"";
    if(isFiltered){
      box.innerHTML=buildEmptyState('📦','لا توجد منتجات مطابقة','جرّب فئة أخرى أو امسح البحث', '🔄 عرض كل المنتجات', 'setStoreSubCategory("all");applyStoreProductFilterClear();', true);
    } else if(canManage){
      box.innerHTML=buildEmptyState('📦','لا توجد منتجات بعد','أضف أول منتج لمتجرك الآن','➕ أضف منتج جديد',"goAddStorePost('"+storeId+"')");
    } else {
      box.innerHTML=buildEmptyState('📦','لا توجد منتجات بعد','هذا المتجر لم ينشر منتجات بعد','', '', false);
    }
    return;
  }
  const canManage=window._canManageStoreItems;

  let filterBanner = '';
  if(currentStoreSubCategory !== 'all'){
    filterBanner = `
      <div style="display:flex;align-items:center;justify-content:space-between;background:#fff7ed;border:1px solid #fdba74;padding:8px 14px;border-radius:12px;margin-bottom:12px">
        <div style="font-size:13px;font-weight:800;color:#c2410c">
          الفئة: <b>${escapeHtml(currentStoreSubCategory)}</b> (${items.length})
        </div>
        <button onclick="setStoreSubCategory('all')" style="border:none;background:none;color:#ea580c;font-weight:800;cursor:pointer;font-size:12.5px">
          عرض الكل ✖️
        </button>
      </div>
    `;
  }

  // إذا كان مطعماً: عرض بنمط KSH
  if(isRestaurant){
    if(currentStoreSubCategory === 'all' && !currentStoreSearch){
      const groups = {};
      items.forEach(p => {
        const cat = getProductSubCategory(p, true);
        if(!groups[cat]) groups[cat] = [];
        groups[cat].push(p);
      });

      let html = filterBanner;
      Object.keys(groups).forEach(catName => {
        const groupItems = groups[catName];
        html += `<h2 style="font-size:17px;font-weight:800;margin:18px 0 10px;border-inline-start:4px solid #dc2626;padding-inline-start:8px;color:var(--text)">${escapeHtml(catName)}</h2>`;
        html += groupItems.map(p => renderKshFoodItemHtml(p, canManage)).join('');
      });
      box.innerHTML = html;
    } else {
      let html = filterBanner;
      html += items.map(p => renderKshFoodItemHtml(p, canManage)).join('');
      box.innerHTML = html;
    }
    return;
  }

  // إذا كان متجراً عاماً أو إلكترونيات: عرض شبكة الكروت
  box.innerHTML=filterBanner + `<div class="grid" style="padding:0;grid-template-columns:1fr 1fr;gap:10px">${items.map(p=>{
    const imgs=getImages(p);const th=imgs[0]||"";
    const expired=isExpired(p);const isSold=!!p.sold;
    const canCart=!isSold && canHaveCart(p);
    const inCartItem=cart.items.find(i=>i.postId===p.id);
    const inCart=!!inCartItem;
    const inCartQty=inCartItem?(inCartItem.qty||1):0;
    const cartBtnHtml=canCart?`<button class="cartAddBtn${inCart?' added':''}" data-id="${p.id}" onclick="event.stopPropagation();addToCart('${p.id}',event)">${inCart?`✅ في السلة (${inCartQty})`:'🛒 أضف للسلة'}</button>`:"";
    const actionsHtml=canManage?`<div style="display:flex;gap:4px;margin-top:6px"><button onclick="event.stopPropagation();closeOverlay();setTimeout(()=>editPost('${p.id}'),200)" style="flex:1;padding:8px;border:none;border-radius:8px;background:#eef2ff;color:#0284c7;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer">✏️</button><button onclick="event.stopPropagation();deleteStoreProduct('${p.id}')" style="flex:1;padding:8px;border:none;border-radius:8px;background:#fdeceb;color:#e5484d;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer">🗑️</button></div>`:"";
    let cls="card";if(isSold)cls+=" sold";else if(expired)cls+=" expired";
    const discPct=getDiscountPercent(p);
    const discBadge=discPct>0?`<span class="discountBadge">🔥 ${discPct}%</span>`:"";
    const negotiableBadge=p.negotiable?`<span style="background:#dcfce7;color:#166534;font-weight:800;padding:3px 9px;border-radius:7px;font-size:11px;border:1px solid #16a34a;margin-right:6px">🤝 قابل للنقاش</span>`:"";
    let priceHTML="";
    if(p.priceType==="contact"){
      priceHTML=`<div class="price" style="color:var(--teal-dark);font-size:13.5px">📞 تواصل لمعرفة السعر</div>`;
    }else if(discPct>0){
      priceHTML=`<div class="price"><span class="originalPrice">${formatPrice(p.originalPrice)} د.ل</span><span class="discountPrice">${formatPrice(p.price)} د.ل</span>${negotiableBadge}</div>`;
    }else{
      priceHTML=`<div class="price">${p.price!=null?formatPrice(p.price)+" د.ل":""}${negotiableBadge}</div>`;
    }
    const cartRow=cartBtnHtml?`<div style="display:flex;gap:6px;margin-top:6px;align-items:center">${cartBtnHtml}</div>`:"";
    const viewsLine=canManage?`<div class="cardViews">👁️ ${p.views||0} مشاهدة</div>`:"";
    return `<div class="${cls}" data-title="${escapeHtml(p.title||"")}"><div class="imgWrap" onclick="closeOverlay();setTimeout(()=>openPost('${p.id}'),200)" style="cursor:pointer">${th?`<img src="${escapeHtml(th)}" onerror="this.onerror=null;this.parentElement.innerHTML='<div style=\\'display:flex;align-items:center;justify-content:center;height:100%;font-size:24px;opacity:.5\\'>🖼️</div>'"/>`:`<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:24px;opacity:.5">🖼️</div>`}${discBadge}</div><div class="body"><h4 style="cursor:pointer" onclick="closeOverlay();setTimeout(()=>openPost('${p.id}'),200)">${escapeHtml(p.title||"بدون عنوان")}</h4>${priceHTML}${viewsLine}${cartRow}${actionsHtml}</div></div>`;
  }).join("")}</div>`;
}

window.applyStoreProductFilterClear=()=>{
  const input=document.getElementById("storeProductSearch");
  if(input)input.value="";
  currentStoreSearch="";
  renderStoreProducts();
};

/* ============================================
   QR + نسخ + إيصال
   ============================================ */
window.generateStoreQR=async(storeId)=>{
  const box=document.getElementById("storeQRBox");
  if(!box) return;
  const url=`${window.location.origin}${window.location.pathname}#store-${storeId}`;
  const qrImageUrl=`https://quickchart.io/qr?text=${encodeURIComponent(url)}&size=300&margin=1&ecLevel=M`;
  box.innerHTML=`<img src="${qrImageUrl}" alt="QR Code" style="max-width:220px;margin:8px auto;display:block;border-radius:8px" onerror="this.parentElement.innerHTML='<div style=color:#e5484d;padding:20px>تعذر تحميل QR</div>'"><div style="font-size:11.5px;color:var(--muted);margin-top:8px;word-break:break-all;direction:ltr">${url}</div><a download="store-qr-${storeId}.png" href="${qrImageUrl}" target="_blank" rel="noopener" class="storeQRBtn" style="margin-top:10px;text-decoration:none;display:inline-block">⬇️ تحميل QR</a>`;
};
window.toggleStoreQR=()=>{
  const box=document.getElementById("storeQRBox");
  if(!box) return;
  if(box.style.display==="none"||!box.style.display){
    box.style.display="block";
    if(window._currentStoreId) generateStoreQR(window._currentStoreId);
  } else { box.style.display="none"; }
};

window.copyToClipboard=async(text,label)=>{
  try{
    await navigator.clipboard.writeText(text);
    showToast(`✅ تم نسخ ${label}`,"success",1500);
  }catch(e){
    const ta=document.createElement("textarea");
    ta.value=text;ta.style.position="fixed";ta.style.opacity="0";
    document.body.appendChild(ta);ta.select();
    try{document.execCommand("copy");showToast(`✅ تم نسخ ${label}`,"success",1500);}
    catch(err){showToast("❌ فشل النسخ","error");}
    document.body.removeChild(ta);
  }
};

window.sendReceiptToSeller=(phone,storeName)=>{
  const cleanPhone=String(phone||"").replace(/[^0-9]/g,"");
  if(!cleanPhone){showToast("⚠️ رقم المتجر غير متوفر","warn");return;}
  const msg=`السلام عليكم 👋\n\nحولت مبلغ لـ "${storeName}" على موقع تسوق الآن.\n\n📎 هذا إيصال التحويل 👇\n\n(أرفق صورة الإيصال هنا)`;
  const url=`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  window.open(url,"_blank");
};

/* ============================================
   Lightbox + SEO
   ============================================ */
function closeLightboxDirect(){
  const lb=document.getElementById("lightbox");
  if(lb)lb.classList.add("hidden");
  document.body.style.overflow="";
}
window.closeLightboxDirect=closeLightboxDirect;
window.closeLightbox=(e)=>{
  if(e)e.stopPropagation();
  if(!_isHistoryNavigating && window.history.state && window.history.state.screen === 'lightbox'){
    window.history.back();
    return;
  }
  closeLightboxDirect();
};
window.openLightbox=(url,skipHistory)=>{
  if(!url)return;
  const lb=document.getElementById("lightbox");
  const img=document.getElementById("lightboxImg");
  if(!lb||!img)return;
  img.src=url;
  lb.classList.remove("hidden");
  document.body.style.overflow="hidden";
  if(!skipHistory) pushNavState({ screen: 'lightbox' });
};
window.scrollToPostImage=(postId,idx)=>{
  const carousel=document.querySelector("#postContent .carousel");
  if(!carousel)return;
  const slideW=carousel.clientWidth||1;
  carousel.scrollTo({left:idx*slideW,behavior:"smooth"});
  document.querySelectorAll(".thumbItem").forEach((t,i)=>t.classList.toggle("active",i===idx));
};

function updateSEOMeta(post){
  if(!post){document.title="تسوق الآن — منصة إعلانات ليبية مجانية";return;}
  const title=post.title||"إعلان";
  const price=post.priceType==="contact"?"تواصل لمعرفة السعر":(post.price!=null?formatPrice(post.price)+" د.ل":"");
  const city=post.city||"";
  document.title=`${title}${price?" — "+price:""}${city?" — "+city:""} | تسوق الآن`;
  const setMeta=(attr,val,content)=>{
    let el=document.querySelector(`meta[${attr}="${val}"]`);
    if(!el){el=document.createElement("meta");el.setAttribute(attr,val);document.head.appendChild(el);}
    el.setAttribute("content",content);
  };
  const desc=(post.description||"").slice(0,160)||title;
  setMeta("name","description",desc);
  setMeta("property","og:title",title);
  setMeta("property","og:description",desc);
  setMeta("property","og:type","product");
  setMeta("property","og:url",`${window.location.origin}${window.location.pathname}#post-${post.id}`);
  const imgs=getImages(post);
  if(imgs[0]){setMeta("property","og:image",imgs[0]);setMeta("name","twitter:image",imgs[0]);}
  setMeta("name","twitter:card","summary_large_image");
  setMeta("name","twitter:title",title);
  setMeta("name","twitter:description",desc);
  let schema=document.getElementById("postSchema");
  if(schema)schema.remove();
  schema=document.createElement("script");
  schema.id="postSchema";
  schema.type="application/ld+json";
  schema.textContent=JSON.stringify({
    "@context":"https://schema.org",
    "@type":"Product",
    "name":title,
    "description":desc,
    "image":imgs[0]||"",
    "offers":{"@type":"Offer","price":post.price||0,"priceCurrency":"LYD","availability":"https://schema.org/InStock"},
    "address":{"@type":"PostalAddress","addressLocality":city,"addressCountry":"LY"}
  });
  document.head.appendChild(schema);
}

/* ============================================
   المقارنة
   ============================================ */
window.toggleCompare=(postId,event)=>{
  if(event){event.stopPropagation();event.preventDefault();}
  if(allPosts && allPosts.length > 0){
    const validIds = new Set(allPosts.map(p => p.id));
    compareList = compareList.filter(id => validIds.has(id));
  }
  const idx=compareList.indexOf(postId);
  if(idx>=0){compareList.splice(idx,1);}
  else{
    if(compareList.length>=3){showToast("⚠️ الحد الأقصى 3 إعلانات","warn");return;}
    compareList.push(postId);
  }
  saveCompare();updateCompareUI();renderPosts();
};
function updateCompareUI(){
  const fab=document.getElementById("compareFAB");
  if(!fab)return;
  if(allPosts && allPosts.length > 0){
    const validIds = new Set(allPosts.map(p => p.id));
    compareList = compareList.filter(id => validIds.has(id));
  }
  if(compareList.length>0){
    fab.classList.remove("fabOff");
    fab.innerHTML=`⚖️ قارن (${compareList.length})`;
  }else{fab.classList.add("fabOff");}
}
window.openCompare=()=>{
  const items=compareList.map(id=>allPosts.find(p=>p.id===id)).filter(Boolean);
  if(items.length<2){showToast("⚠️ اختر إعلانين على الأقل","warn");return;}
  const box=document.getElementById("compareContent");
  box.innerHTML=`<div style="display:grid;grid-template-columns:repeat(${items.length},1fr);gap:8px">${items.map(p=>{
    const imgs=getImages(p);const th=imgs[0]||"";
    const priceTxt=p.priceType==="contact"?"📞 تواصل":(p.price!=null?formatPrice(p.price)+" د.ل":"—");
    return `<div class="compareCol">
      ${th?`<img src="${escapeHtml(th)}">`:`<div style="aspect-ratio:1/1;background:var(--teal-light);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:30px;opacity:.5;margin-bottom:8px">🖼️</div>`}
      <h4>${escapeHtml(p.title||"بدون عنوان")}</h4>
      <div class="comparePrice">${priceTxt}</div>
      <div class="compareRow"><b>القسم:</b> ${escapeHtml(p.category||"—")}</div>
      <div class="compareRow"><b>المدينة:</b> ${escapeHtml(p.city||"—")}</div>
      ${p.brand?`<div class="compareRow"><b>الماركة:</b> ${escapeHtml(p.brand)}</div>`:""}
      <div class="compareRow"><b>المشاهدات:</b> ${p.views||0}</div>
      <div class="compareRow"><b>التاريخ:</b> ${timeAgo(p.createdAt)}</div>
      <button class="btnGhost" style="margin-top:8px;font-size:12px;padding:8px" onclick="closeOverlay();setTimeout(()=>openPost('${p.id}'),200)">👁️ عرض</button>
      <button class="btnGhost" style="background:#fdeceb;color:var(--danger);font-size:12px;padding:8px" onclick="toggleCompare('${p.id}');closeOverlay();setTimeout(openCompare,200)">✕ إزالة</button>
    </div>`;
  }).join("")}</div>`;
  document.getElementById("compareOverlay").classList.remove("hidden");
};
window.clearCompare=()=>{compareList=[];saveCompare();updateCompareUI();renderPosts();showToast("✅ تم مسح المقارنة","success");};

/* ============================================
   Skeletons + Listener
   ============================================ */
function renderSkeletons(){
  const box=document.getElementById("posts");
  if(!box)return;
  const count=window.innerWidth>=1000?8:window.innerWidth>=700?6:4;
  box.innerHTML=Array(count).fill(0).map(()=>`
    <div class="skeleton-card">
      <div class="skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton-line medium"></div>
        <div class="skeleton-line short"></div>
        <div class="skeleton-line" style="width:40%"></div>
      </div>
    </div>
  `).join("");
}

let _postsLoadedOnce=false;
let lastVisiblePostDoc = null;
let hasMorePosts = true;
let isLoadingPostsBatch = false;
const POSTS_BATCH_SIZE = 24;

async function loadPostsBatch(isInitial = false) {
  if (isLoadingPostsBatch) return;
  if (!isInitial && !hasMorePosts) return;

  isLoadingPostsBatch = true;
  const btn = document.getElementById("loadMorePostsBtn");
  if (btn) {
    btn.textContent = "⏳ جاري تحميل الإعلانات...";
    btn.disabled = true;
  }

  try {
    const from = isInitial ? 0 : allPosts.length;
    const to = from + POSTS_BATCH_SIZE - 1;
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    const fetchedPosts = (data || []).map(objectFromDb);

    if (fetchedPosts.length < POSTS_BATCH_SIZE) {
      hasMorePosts = false;
    } else {
      hasMorePosts = true;
    }

    if (isInitial) {
      allPosts = fetchedPosts;
    } else {
      const existingIds = new Set(allPosts.map(p => p.id));
      fetchedPosts.forEach(p => {
        if (!existingIds.has(p.id)) {
          allPosts.push(p);
        }
      });
    }

    allPosts = sortPosts(allPosts);
    _postsLoadedOnce = true;
    renderPosts();
    updateLoadMoreButton();
    updateModBadge();
    renderRecentlyViewed();
    if(typeof renderHomeStoriesBar==="function")renderHomeStoriesBar();
    updateCartUI();
    updateCompareUI();
  } catch (err) {
    console.warn("Error loading posts batch:", err);
    if (isInitial && allPosts.length === 0) {
      postsBox.innerHTML = `<div class='empty' style='padding:30px 16px;text-align:center'>
        <div style='font-size:32px;margin-bottom:8px'>📡</div>
        <div style='font-weight:800;font-size:15px;margin-bottom:6px'>تعذر تحميل الإعلانات حالياً</div>
        <div style='color:var(--muted);font-size:13px;margin-bottom:14px'>تأكد من اتصالك بالإنترنت واضغط زر إعادة المحاولة</div>
        <button class='btnMain' onclick='window.loadPostsBatch && window.loadPostsBatch(true)' style='max-width:200px;margin:0 auto;padding:10px 18px;font-size:14px'>🔄 إعادة المحاولة</button>
      </div>`;
    }
  } finally {
    isLoadingPostsBatch = false;
    if (btn) btn.disabled = false;
  }
}
window.loadPostsBatch = loadPostsBatch;

function updateLoadMoreButton() {
  let btn = document.getElementById("loadMorePostsBtn");
  if (!btn && postsBox) {
    btn = document.createElement("button");
    btn.id = "loadMorePostsBtn";
    btn.className = "btnMain";
    btn.style.cssText = "display:block;width:calc(100% - 24px);margin:20px auto;background:linear-gradient(135deg,#0284c7,#38bdf8);color:#fff;font-weight:800;font-size:15px;padding:12px;border-radius:12px;border:none;cursor:pointer;font-family:'Cairo',sans-serif;";
    btn.onclick = () => loadPostsBatch(false);
    postsBox.parentNode.insertBefore(btn, postsBox.nextSibling);
  }

  if (btn) {
    if (hasMorePosts && allPosts.length >= POSTS_BATCH_SIZE) {
      btn.style.display = "block";
      btn.textContent = "📥 عرض المزيد من الإعلانات";
    } else {
      btn.style.display = "none";
    }
  }
}

// التحميل التلقائي عند التمرير لأسفل الصفحة (Infinite Scroll)
window.addEventListener("scroll", () => {
  if (!hasMorePosts || isLoadingPostsBatch) return;
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 400) {
    loadPostsBatch(false);
  }
}, { passive: true });

function startPostsListener(){
  loadPostsBatch(true);
}
function timeAgo(ts){if(!ts)return"";const d=Math.floor((Date.now()-ts)/1000);if(d<60)return"الآن";if(d<3600)return Math.floor(d/60)+" د";if(d<86400)return Math.floor(d/3600)+" س";return Math.floor(d/86400)+" يوم";}

/* ============================================
   حركات ومواصفات السوق المفتوح الذكية (OpenSooq Smart Specs)
   ============================================ */

let currentFormSpecsState = {};
window.currentFormSpecsState = currentFormSpecsState;

window.selectSpecChip = (field, val, btn) => {
  const group = btn.closest('.specChipsRow');
  if (!group) return;
  const isAlreadyActive = btn.classList.contains('active');
  group.querySelectorAll('.specFormChip').forEach(c => c.classList.remove('active'));
  if (!isAlreadyActive) {
    btn.classList.add('active');
    currentFormSpecsState[field] = val;
  } else {
    delete currentFormSpecsState[field];
  }
};

window.switchSpecsSubType = (subType) => {
  currentFormSpecsState.subType = subType;
  renderDynamicSpecsForm("موبايل وتابلت", currentFormSpecsState);
};

function renderSpecChipGroup(field, label, options, selectedVal) {
  return `
    <div class="specFormGroup">
      <label>${label}</label>
      <div class="specChipsRow" data-field="${field}">
        ${options.map(opt => {
          const isActive = (selectedVal === opt);
          return `<button type="button" class="specFormChip ${isActive ? 'active' : ''}" onclick="selectSpecChip('${field}', '${opt.replace(/'/g, "\\'")}', this)">${opt}</button>`;
        }).join('')}
      </div>
    </div>
  `;
}

function renderYearSelect(selectedYear) {
  const years = [];
  for (let y = 2026; y >= 1995; y--) years.push(String(y));
  years.push("قبل 1995");
  return `
    <div class="specFormGroup">
      <label>📅 سنة الصنع (الموديل)</label>
      <div class="specInputWrap">
        <select id="spec_year" onchange="currentFormSpecsState.year = this.value">
          <option value="">اختر سنة الموديل</option>
          ${years.map(y => `<option value="${y}" ${selectedYear === y ? 'selected' : ''}>${y}</option>`).join('')}
        </select>
      </div>
    </div>
  `;
}

function renderDynamicSpecsForm(category, existingSpecs) {
  const container = document.getElementById("dynamicSpecsContainer");
  if (!container) return;
  
  if (existingSpecs) {
    currentFormSpecsState = { ...existingSpecs, _category: category };
  } else if (!currentFormSpecsState || currentFormSpecsState._category !== category) {
    currentFormSpecsState = { _category: category };
  }
  
  const s = currentFormSpecsState;
  
  // 1. موبايل وتابلت
  if (category === "موبايل وتابلت") {
    container.classList.remove("hidden");
    const subType = s.subType || "هاتف";
    s.subType = subType;
    
    let subHtml = "";
    if (subType === "هاتف") {
      subHtml = `
        ${renderSpecChipGroup("storage", "💾 المساحة التخزينية", ["32 جيجا", "64 جيجا", "128 جيجا", "256 جيجا", "512 جيجا", "1 تيرابايت"], s.storage)}
        ${renderSpecChipGroup("condition", "✨ حالة الجهاز", ["جديد بالعلبة", "كسر زيرو (كالجديد)", "مستعمل ممتاز", "مستعمل جيد", "يحتاج صيانة"], s.condition)}
        ${renderSpecChipGroup("battery", "🔋 نسبة صحة البطارية", ["100%", "95-99%", "90-94%", "85-89%", "80-84%", "أقل من 80%"], s.battery)}
        ${renderSpecChipGroup("ram", "🧠 الرام (RAM)", ["4 جيجا", "6 جيجا", "8 جيجا", "12 جيجا", "16 جيجا"], s.ram)}
        ${renderSpecChipGroup("sim", "📶 شريحة الاتصال (SIM)", ["شريحة واحدة", "شريحتين (Dual SIM)", "شريحة إلكترونية eSIM"], s.sim)}
        ${renderSpecChipGroup("accessories", "📦 الملحقات المرفقة", ["العلبة كاملة مع الشاحن", "العلبة فقط", "شاحن فقط", "الجهاز فقط"], s.accessories)}
      `;
    } else if (subType === "تابلت") {
      subHtml = `
        ${renderSpecChipGroup("conn", "📶 نوع الاتصال والشبكة", ["واي فاي فقط (Wi-Fi)", "شريحة + واي فاي (Cellular + Wi-Fi)"], s.conn)}
        ${renderSpecChipGroup("storage", "💾 المساحة التخزينية", ["32 جيجا", "64 جيجا", "128 جيجا", "256 جيجا", "512 جيجا", "1 تيرابايت"], s.storage)}
        ${renderSpecChipGroup("condition", "✨ حالة التابلت", ["جديد بالعلبة", "كسر زيرو (كالجديد)", "مستعمل ممتاز", "مستعمل جيد"], s.condition)}
        ${renderSpecChipGroup("screenSize", "📺 مقاس الشاشة", ["8 بوصة وأقل", "10 إلى 11 بوصة", "12 بوصة وأكثر"], s.screenSize)}
        ${renderSpecChipGroup("accessories", "📦 الملحقات", ["مع قلم أصلي (Stylus)", "مع كيبورد أصلي", "العلبة كاملة والشاحن", "الجهاز فقط"], s.accessories)}
      `;
    } else {
      subHtml = `
        ${renderSpecChipGroup("itemType", "⌚ نوع الملحق أو الإكسسوار", ["ساعة ذكية", "سماعات لاسلكية", "شاحن وبطارية باور بنك", "كفر وحماية شاشة", "أخرى"], s.itemType)}
        ${renderSpecChipGroup("condition", "✨ الحالة", ["جديد بالعلبة", "كسر زيرو", "مستعمل ممتاز"], s.condition)}
      `;
    }
    
    container.innerHTML = `
      <div class="specsHeader">
        <span class="specsHeaderTitle">📱 مواصفات وتفاصيل الجهاز</span>
      </div>
      <div class="specsSegmented">
        <button type="button" class="specSegBtn ${subType === 'هاتف' ? 'active' : ''}" onclick="switchSpecsSubType('هاتف')">📱 هواتف ذكية (موبايل)</button>
        <button type="button" class="specSegBtn ${subType === 'تابلت' ? 'active' : ''}" onclick="switchSpecsSubType('تابلت')">📟 أجهزة تابلت وآيباد</button>
        <button type="button" class="specSegBtn ${subType === 'إكسسوارات' ? 'active' : ''}" onclick="switchSpecsSubType('إكسسوارات')">⌚ ساعات وإكسسوارات</button>
      </div>
      <div id="subTypeFieldsContainer">
        ${subHtml}
      </div>
    `;
    return;
  }
  
  // 2. سيارات ومركبات
  if (category === "سيارات ومركبات") {
    container.classList.remove("hidden");
    container.innerHTML = `
      <div class="specsHeader">
        <span class="specsHeaderTitle">🚗 مواصفات وبيانات السيارة</span>
      </div>
      ${renderYearSelect(s.year)}
      <div class="specFormGroup">
        <label>🛣️ العداد / المسافة المقطوعة (كم)</label>
        <div class="specInputWrap" style="margin-bottom:6px">
          <input type="text" id="spec_odometer_input" placeholder="مثال: 75,000 كم" value="${s.odometer || ''}" oninput="currentFormSpecsState.odometer = this.value">
        </div>
        <div class="specChipsRow" data-field="odometer">
          ${["أصفار (زيرو)", "أقل من 30,000 كم", "30,000 - 60,000 كم", "60,000 - 100,000 كم", "100,000 - 150,000 كم", "150,000 - 200,000 كم", "أكثر من 200,000 كم"].map(opt => `
            <button type="button" class="specFormChip ${s.odometer === opt ? 'active' : ''}" onclick="document.getElementById('spec_odometer_input').value='${opt}'; selectSpecChip('odometer', '${opt}', this)">${opt}</button>
          `).join('')}
        </div>
      </div>
      ${renderSpecChipGroup("transmission", "⚙️ ناقل الحركة (الكمبيو / الجير)", ["⚙️ أوتوماتيك", "🕹️ عادي / مانيوال"], s.transmission)}
      ${renderSpecChipGroup("fuel", "⛽ نوع الوقود", ["⛽ بنزين", "🛢️ ديزل / نافطة", "🔋 هايبرد (هجين)", "⚡ كهرباء بالكامل"], s.fuel)}
      ${renderSpecChipGroup("bodyCondition", "🎨 حالة الهيكل والطلاء", ["✨ فابريكا خالي من الحوادث", "🎨 طلاء جزئي نظافة", "🔨 به صدمات خفيفة", "⚠️ يحتاج صيانة"], s.bodyCondition)}
      ${renderSpecChipGroup("origin", "🌐 المواصفات الإقليمية / الوارد", ["كندا / أمريكا", "أوروبا / ألمانيا", "الخليج", "وكالة محلي (ليبيا)", "كوري"], s.origin)}
    `;
    return;
  }
  
  // 3. دراجات نارية
  if (category === "دراجات نارية") {
    container.classList.remove("hidden");
    container.innerHTML = `
      <div class="specsHeader">
        <span class="specsHeaderTitle">🏍️ مواصفات الدراجة النارية</span>
      </div>
      ${renderYearSelect(s.year)}
      ${renderSpecChipGroup("cc", "⚡ سعة المحرك (CC)", ["50cc وأقل", "125-150cc", "200-250cc", "400-500cc", "600-750cc", "1000cc فأكثر"], s.cc)}
      ${renderSpecChipGroup("odometer", "🛣️ العداد (كم)", ["أصفار (زيرو)", "أقل من 10,000 كم", "10,000 - 30,000 كم", "أكثر من 30,000 كم"], s.odometer)}
      ${renderSpecChipGroup("condition", "✨ الحالة", ["جديد زيرو", "كسر زيرو", "مستعمل ممتاز", "مستعمل"], s.condition)}
    `;
    return;
  }
  
  // 4. عقارات للبيع & عقارات للإيجار
  if (category === "عقارات للبيع" || category === "عقارات للإيجار") {
    container.classList.remove("hidden");
    container.innerHTML = `
      <div class="specsHeader">
        <span class="specsHeaderTitle">🏠 مواصفات وتفاصيل العقار</span>
      </div>
      ${renderSpecChipGroup("propertyType", "🏢 نوع العقار", ["شقة", "فيلا / منزل مستقل", "أرض", "محل / معرض تجاري", "مكتب إداري", "استراحة / مزرعة", "عمارة كاملة"], s.propertyType)}
      <div class="specFormGroup">
        <label>📐 المساحة الإجمالية (م²)</label>
        <div class="specInputWrap">
          <input type="number" id="spec_area" placeholder="مثال: 150" value="${s.area || ''}" oninput="currentFormSpecsState.area = this.value">
        </div>
      </div>
      ${renderSpecChipGroup("rooms", "🛏️ عدد الغرف", ["1", "2", "3", "4", "5", "6+ غرف"], s.rooms)}
      ${renderSpecChipGroup("baths", "🚿 دورات المياه", ["1", "2", "3", "4+"], s.baths)}
      ${renderSpecChipGroup("floor", "🏢 الطابق / الدور", ["أرضي", "طابق أول", "طابق ثاني", "طابق ثالث", "طابق 4 فأعلى", "روف / سطح"], s.floor)}
      ${renderSpecChipGroup("furnished", "🛋️ حالة الفرش", ["مفروش بالكامل", "نصف مفروش", "غير مفروش (فارغ)"], s.furnished)}
      ${renderSpecChipGroup("finishing", "💎 التشطيب", ["سوبر ديلوكس / VIP", "تشطيب ممتاز", "عادي", "عظم / غير مشطب"], s.finishing)}
    `;
    return;
  }
  
  // 5. لابتوب وكمبيوتر
  if (category === "لابتوب وكمبيوتر") {
    container.classList.remove("hidden");
    container.innerHTML = `
      <div class="specsHeader">
        <span class="specsHeaderTitle">💻 مواصفات الحاسوب والجهاز</span>
      </div>
      ${renderSpecChipGroup("deviceType", "💻 نوع الجهاز", ["لابتوب محمول", "كمبيوتر مكتبي (PC)", "تجميعة ألعاب (Gaming)", "شاشة وملحقات"], s.deviceType)}
      ${renderSpecChipGroup("cpu", "⚡ المعالج (CPU)", ["Core i9", "Core i7", "Core i5", "Core i3", "AMD Ryzen 7/9", "AMD Ryzen 5", "Apple M1/M2/M3/M4"], s.cpu)}
      ${renderSpecChipGroup("ram", "🧠 الرام (RAM)", ["8 جيجا", "16 جيجا", "32 جيجا", "64 جيجا"], s.ram)}
      ${renderSpecChipGroup("storage", "⚡ سعة ونوع التخزين", ["256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD", "HDD عادي"], s.storage)}
      ${renderSpecChipGroup("gpu", "🎮 كرت الشاشة", ["مدمج (Internal)", "NVIDIA RTX", "NVIDIA GTX", "AMD Radeon"], s.gpu)}
      ${renderSpecChipGroup("condition", "✨ الحالة", ["جديد بالعلبة", "كسر زيرو (كالجديد)", "مستعمل ممتاز", "مستعمل جيد"], s.condition)}
    `;
    return;
  }
  
  // 6. أجهزة منزلية
  if (category === "أجهزة منزلية") {
    container.classList.remove("hidden");
    container.innerHTML = `
      <div class="specsHeader">
        <span class="specsHeaderTitle">🧊 نوع وحالة الجهاز</span>
      </div>
      ${renderSpecChipGroup("applianceType", "🧊 نوع الجهاز", ["ثلاجات ومجمدات", "غسالات ونشافات", "أفران وغاز وميكروويف", "شاشات وتلفزيونات", "مكيفات وتدفئة", "أجهزة ومطابخ"], s.applianceType)}
      ${renderSpecChipGroup("condition", "✨ الحالة", ["جديد بالكرتونة", "مستعمل كالجديد", "مستعمل شغال", "يحتاج صيانة"], s.condition)}
    `;
    return;
  }
  
  // 7. ألعاب وألعاب الفيديو
  if (category === "ألعاب وألعاب الفيديو") {
    container.classList.remove("hidden");
    container.innerHTML = `
      <div class="specsHeader">
        <span class="specsHeaderTitle">🎮 المنصة وحالة الجهاز</span>
      </div>
      ${renderSpecChipGroup("console", "🎮 المنصة / الجهاز", ["PlayStation 5 (PS5)", "PlayStation 4 (PS4)", "Xbox Series X/S", "Nintendo Switch", "أشرطة وأسطوانات ألعاب", "دراعات وملحقات"], s.console)}
      ${renderSpecChipGroup("condition", "✨ الحالة", ["جديد بالعلبة", "كسر زيرو", "مستعمل ممتاز"], s.condition)}
    `;
    return;
  }
  
  // أي تصنيف آخر
  container.classList.add("hidden");
  container.innerHTML = "";
}

function collectDynamicSpecs(category) {
  const container = document.getElementById("dynamicSpecsContainer");
  if (!container || container.classList.contains("hidden")) return {};
  
  const result = { ...currentFormSpecsState };
  delete result._category;
  
  const odoInput = document.getElementById("spec_odometer_input");
  if (odoInput && odoInput.value.trim()) result.odometer = odoInput.value.trim();
  
  const areaInput = document.getElementById("spec_area");
  if (areaInput && areaInput.value.trim()) result.area = areaInput.value.trim();
  
  const yearSelect = document.getElementById("spec_year");
  if (yearSelect && yearSelect.value) result.year = yearSelect.value;
  
  return result;
}

function renderCardSpecs(p) {
  if (!p.specs || typeof p.specs !== "object") return "";
  const s = p.specs;
  const pills = [];
  
  if (s.subType === "هاتف") {
    if (s.storage) pills.push(`💾 ${escapeHtml(s.storage)}`);
    if (s.battery) pills.push(`🔋 ${escapeHtml(s.battery)}`);
    if (s.condition && !s.condition.includes("يحتاج")) pills.push(`✨ ${escapeHtml(s.condition.split(' ')[0])}`);
    if (s.ram) pills.push(`🧠 ${escapeHtml(s.ram)}`);
  } else if (s.subType === "تابلت") {
    pills.push(`📟 تابلت`);
    if (s.conn) pills.push(`📶 ${escapeHtml(s.conn.split(' ')[0])}`);
    if (s.storage) pills.push(`💾 ${escapeHtml(s.storage)}`);
    if (s.screenSize) pills.push(`📺 ${escapeHtml(s.screenSize)}`);
  } else if (s.subType === "إكسسوارات") {
    if (s.itemType) pills.push(`⌚ ${escapeHtml(s.itemType)}`);
    if (s.condition) pills.push(`✨ ${escapeHtml(s.condition)}`);
  }
  
  if (p.category === "سيارات ومركبات") {
    if (s.year) pills.push(`📅 ${escapeHtml(s.year)}`);
    if (s.odometer) pills.push(`🛣️ ${escapeHtml(s.odometer.replace(/أصفار \(زيرو\)/, 'زيرو'))}`);
    if (s.transmission) pills.push(`${escapeHtml(s.transmission.split(' ')[0])}`);
    if (s.fuel) pills.push(`${escapeHtml(s.fuel.split(' ')[0])}`);
  }
  
  if (p.category === "دراجات نارية") {
    if (s.cc) pills.push(`🏍️ ${escapeHtml(s.cc)}`);
    if (s.year) pills.push(`📅 ${escapeHtml(s.year)}`);
    if (s.odometer) pills.push(`🛣️ ${escapeHtml(s.odometer)}`);
  }
  
  if (p.category === "عقارات للبيع" || p.category === "عقارات للإيجار") {
    if (s.propertyType) pills.push(`${escapeHtml(s.propertyType)}`);
    if (s.area) pills.push(`📐 ${escapeHtml(s.area)} م²`);
    if (s.rooms) pills.push(`🛏️ ${escapeHtml(s.rooms)} غرف`);
    if (s.furnished) pills.push(`${escapeHtml(s.furnished.split(' ')[0])}`);
  }
  
  if (p.category === "لابتوب وكمبيوتر") {
    if (s.cpu) pills.push(`💻 ${escapeHtml(s.cpu)}`);
    if (s.ram) pills.push(`🧠 ${escapeHtml(s.ram)}`);
    if (s.storage) pills.push(`⚡ ${escapeHtml(s.storage)}`);
  }
  
  if (p.category === "أجهزة منزلية") {
    if (s.applianceType) pills.push(`🧊 ${escapeHtml(s.applianceType)}`);
    if (s.condition) pills.push(`✨ ${escapeHtml(s.condition)}`);
  }
  
  if (p.category === "ألعاب وألعاب الفيديو") {
    if (s.console) pills.push(`🎮 ${escapeHtml(s.console)}`);
    if (s.condition) pills.push(`✨ ${escapeHtml(s.condition)}`);
  }
  
  if (pills.length === 0) return "";
  return `<div class="specsRow">${pills.slice(0, 4).map(pill => `<span class="specPill">${pill}</span>`).join('')}</div>`;
}

function renderDetailsSpecs(p) {
  if (!p.specs || typeof p.specs !== "object" || Object.keys(p.specs).length === 0) return "";
  const s = p.specs;
  const items = [];
  
  const labelsMap = {
    subType: "القسم الفرعي",
    storage: "المساحة التخزينية",
    condition: "الحالة العامة",
    battery: "صحة البطارية",
    ram: "الرام (RAM)",
    sim: "شريحة الاتصال",
    accessories: "الملحقات المرفقة",
    conn: "نوع الاتصال والشبكة",
    screenSize: "حجم الشاشة",
    itemType: "نوع الملحق",
    year: "سنة الصنع (الموديل)",
    odometer: "العداد / الممشى",
    transmission: "ناقل الحركة",
    fuel: "نوع الوقود",
    bodyCondition: "حالة الهيكل والطلاء",
    origin: "المواصفات الإقليمية",
    cc: "سعة المحرك (CC)",
    propertyType: "نوع العقار",
    area: "المساحة الإجمالية",
    rooms: "عدد الغرف",
    baths: "دورات المياه",
    floor: "الطابق / الدور",
    furnished: "الفرش والأثاث",
    finishing: "نوع التشطيب",
    deviceType: "نوع الجهاز",
    cpu: "المعالج (CPU)",
    gpu: "كرت الشاشة",
    applianceType: "نوع الجهاز",
    console: "المنصة / الجهاز"
  };
  
  for (const [key, val] of Object.entries(s)) {
    if (!val || key === "subCategory" || key === "_category") continue;
    const label = labelsMap[key] || key;
    let displayVal = String(val);
    if (key === "area") displayVal += " م²";
    items.push(`
      <div class="specGridItem">
        <span class="specLabel">${escapeHtml(label)}</span>
        <span class="specValue">${escapeHtml(displayVal)}</span>
      </div>
    `);
  }
  
  if (items.length === 0) return "";
  return `
    <div class="specsDetailsBox">
      <div class="specsDetailsTitle"><i data-lucide="layers" style="width:16px;height:16px"></i> المواصفات والتفاصيل</div>
      <div class="specsGrid">
        ${items.join('')}
      </div>
    </div>
  `;
}

/* ============================================
   عرض الإعلانات (renderPosts) — مع الصفحة الفارغة الآمنة
   ============================================ */
function renderPosts(){
if(allPosts.length===0 && !showOnlyFavorites && !_postsLoadedOnce){renderSkeletons();}
const term=(document.getElementById("searchInput")?.value||"").trim().toLowerCase();
const favs=getFavorites();
const me=auth.currentUser;

// خريطة سريعة للمتاجر وعدد إعلانات البائع لتسريع الرسم من O(n²) إلى O(n) الفوري
const storesMap = new Map();
(allStores || []).forEach(s => storesMap.set(s.id, s));

const sellerApprovedCountMap = new Map();
allPosts.forEach(x => {
  if(!x.storeId && x.uid && getStatus(x) === "approved"){
    sellerApprovedCountMap.set(x.uid, (sellerApprovedCountMap.get(x.uid) || 0) + 1);
  }
});

// إذا تم اختيار تصنيف المطاعم: عرض المطاعم كدليل وهيكل (غلاف + شعار + اسم)
if(isRestaurantCategory(currentCategory)){
  const _hrb=document.getElementById("homeRestaurantsBox");if(_hrb){_hrb.innerHTML="";_hrb.classList.add("hidden");}
  let approvedRests=allStores.filter(s=>s.status==="approved" && isRestaurantStore(s));
  if(term){
    approvedRests=approvedRests.filter(s=>(s.name||"").toLowerCase().includes(term)||(s.city||"").toLowerCase().includes(term));
  }
  if(currentCity!=="الكل"){
    approvedRests=approvedRests.filter(s=>s.city===currentCity);
  }
  if(approvedRests.length===0){
    postsBox.innerHTML=buildEmptyState('🍽️','لا توجد مطاعم مطابقة','تصفح باقي الأقسام أو امسح البحث','🏠 كل الأقسام','showCategoriesScreen()',true);
    return;
  }
  postsBox.innerHTML=`
    <div style="grid-column:1/-1;font-size:15px;font-weight:900;color:var(--text);margin-bottom:12px">🍽️ دليل المطاعم والمأكولات (${approvedRests.length})</div>
    ${approvedRests.map(s=>renderRestaurantStructureCard(s,'home')).join("")}
  `;
  return;
}

let list=allPosts.filter(p=>{
  const status=getStatus(p);
  const isOwner=me&&p.uid===me.uid;
  const isMyStorePost=myStore&&p.storeId===myStore.id;
  const expired=isExpired(p);
  if(expired && !isOwner && !isAdmin && !isMyStorePost)return false;
  if(status!=="approved" && !isOwner && !isAdmin && !isMyStorePost)return false;
  if(currentStoreFilter && p.storeId!==currentStoreFilter)return false;

  // استبعاد وجبات المطاعم الفردية من قسم الكل عشان ما تتبعثرش وسط الإعلانات
  const postStore=p.storeId?storesMap.get(p.storeId):null;
  const isRestaurantPost=postStore?isRestaurantStore(postStore):isRestaurantCategory(p.category);
  if(!currentStoreFilter && isRestaurantPost && (currentCategory==="الكل" || !isRestaurantCategory(currentCategory))){
    return false;
  }

  if(!currentStoreFilter && currentCategory!=="الكل"){
    if(p.category!==currentCategory)return false;
  }
  if(currentSubCategory!=="الكل"){
    const sc = currentSubCategory.toLowerCase();
    const matchBrand = (p.brand||"").toLowerCase() === sc;
    const matchSubCat = (p.subCategory||"").toLowerCase().includes(sc) || sc.includes((p.subCategory||"").toLowerCase());
    const s = p.specs || {};
    const matchSpecs = (
      (s.subType && (s.subType.toLowerCase().includes(sc) || sc.includes(s.subType.toLowerCase()))) ||
      (s.propertyType && (s.propertyType.toLowerCase().includes(sc) || sc.includes(s.propertyType.toLowerCase()))) ||
      (s.deviceType && (s.deviceType.toLowerCase().includes(sc) || sc.includes(s.deviceType.toLowerCase()))) ||
      (s.applianceType && (s.applianceType.toLowerCase().includes(sc) || sc.includes(s.applianceType.toLowerCase()))) ||
      (s.console && (s.console.toLowerCase().includes(sc) || sc.includes(s.console.toLowerCase())))
    );
    const matchSemantic = 
      (sc.includes("هواتف") && (s.subType === "هاتف" || (p.title||"").toLowerCase().includes("ايفون") || (p.title||"").toLowerCase().includes("سامسونج") || (p.title||"").toLowerCase().includes("شاومي") || (p.title||"").toLowerCase().includes("تلفون") || (p.title||"").toLowerCase().includes("هاتف"))) ||
      (sc.includes("تابلت") && (s.subType === "تابلت" || (p.title||"").toLowerCase().includes("تابلت") || (p.title||"").toLowerCase().includes("ايباد") || (p.title||"").toLowerCase().includes("آيباد") || (p.title||"").toLowerCase().includes("لوحي"))) ||
      (sc.includes("ساعات") && (s.subType === "إكسسوارات" || (p.title||"").toLowerCase().includes("ساعة") || (p.title||"").toLowerCase().includes("سماعة"))) ||
      (sc.includes("شقق") && (s.propertyType?.includes("شقة") || (p.title||"").toLowerCase().includes("شقة") || (p.title||"").toLowerCase().includes("شقق"))) ||
      (sc.includes("فلل") && (s.propertyType?.includes("فيلا") || (p.title||"").toLowerCase().includes("فيلا") || (p.title||"").toLowerCase().includes("منزل"))) ||
      (sc.includes("أراضي") && (s.propertyType?.includes("أرض") || (p.title||"").toLowerCase().includes("أرض")));
    if(!matchBrand && !matchSubCat && !matchSpecs && !matchSemantic) return false;
  }
  if(currentCity!=="الكل" && p.city!==currentCity)return false;
  if(showOnlyMine && p.uid!==me?.uid)return false;
  if(showOnlyFavorites && !favs.includes(p.id))return false;
  if(term && !(p.title||"").toLowerCase().includes(term))return false;
  if(currentPriceMin!=null && (Number(p.price)||0)<currentPriceMin)return false;
  if(currentPriceMax!=null && (Number(p.price)||0)>currentPriceMax)return false;
  if(currentAdTypeFilter==="wanted" && !isWanted(p))return false;
  if(currentAdTypeFilter==="offer" && isWanted(p))return false;
  return true;
});

// في قسم الكل: دمج المطاعم كعناصر ضمن الخط الزمني للإعلانات (تنزل لأسفل مع نزول أي إعلان جديد)
const homeRestsBox=document.getElementById("homeRestaurantsBox");
if(homeRestsBox){
  homeRestsBox.innerHTML="";
  homeRestsBox.classList.add("hidden");
}

if(currentCategory==="الكل" && !currentStoreFilter && !showOnlyFavorites && !showOnlyMine && currentAdTypeFilter==="all" && currentPriceMin==null && currentPriceMax==null){
  let approvedRests=allStores.filter(s=>s.status==="approved" && isRestaurantStore(s));
  if(term){
    approvedRests=approvedRests.filter(s=>(s.name||"").toLowerCase().includes(term)||(s.city||"").toLowerCase().includes(term)||(s.description||"").toLowerCase().includes(term));
  }
  if(currentCity!=="الكل"){
    approvedRests=approvedRests.filter(s=>s.city===currentCity);
  }
  const storePostsMap = new Map();
  allPosts.forEach(p => {
    if(p.storeId && getStatus(p) === "approved"){
      const pt = Number(p.createdAt) || 0;
      const prev = storePostsMap.get(p.storeId) || 0;
      if(pt > prev) storePostsMap.set(p.storeId, pt);
    }
  });

  approvedRests.forEach(s=>{
    let restTime=Number(s.createdAt)||Number(s.approvedAt)||0;
    const latestPostTime = storePostsMap.get(s.id) || 0;
    if(latestPostTime > restTime) restTime = latestPostTime;
    list.push({
      isRestaurantStructure:true,
      storeData:s,
      id:'store_'+s.id,
      createdAt:restTime,
      city:s.city||"",
      title:s.name||"",
      description:s.description||"",
      price:0,
      views:0
    });
  });
}
list=sortPosts(list);

if(list.length===0){
  /* ✅ المنطق الآمن للصفحة الفارغة */
  if(showOnlyFavorites){
    postsBox.innerHTML=buildEmptyState('❤️','المفضلة فاضية','اضغط على القلب 🤍 في أي إعلان<br>عشان تحفظه هنا','🏠 تصفح الإعلانات','showCategoriesScreen()',true);
  }else if(showOnlyMine){
    postsBox.innerHTML=buildEmptyState('📝','لسه ما نشرت إعلانات','ابدأ بنشر أول إعلان لك الآن<br>مجاناً وفي دقيقة','➕ أنشر إعلانك الأول','startAddPost()');
  }else if(term){
    postsBox.innerHTML=buildEmptyState('🔍','لا توجد نتائج','لم نجد إعلانات تطابق "'+escapeHtml(term)+'"<br>جرّب كلمة بحث أخرى','🔄 مسح البحث','clearSearch()',true);
  }else if(currentCity!=="الكل"){
    postsBox.innerHTML=buildEmptyState('📍','لا توجد إعلانات في '+escapeHtml(currentCity),'كن أول من ينشر إعلاناً<br>في هذه المدينة','➕ أنشر إعلان هنا','startAddPost()');
  }else{
    postsBox.innerHTML=buildEmptyState('📭','لا توجد إعلانات هنا حالياً','كن أول من ينشر إعلاناً في هذا القسم<br>مجاناً وفي ثوانٍ!','➕ كن أول من ينشر إعلاناً','startAddPost()');
  }
  return;
}
postsBox.innerHTML=list.map(p=>{
if(p.isRestaurantStructure){
  return renderRestaurantStructureCard(p.storeData, 'home');
}
const status=getStatus(p);const me=auth.currentUser;const isOwner=me&&p.uid===me.uid;const isMyStorePost=myStore&&p.storeId===myStore.id;const canDelete=isAdmin||isOwner||isMyStorePost;
const expired=isExpired(p);const days=daysLeft(p);const isSold=!!p.sold;
const wanted=isWanted(p);
const images=getImages(p);const dots=dotsHtml(images);
const postStore=p.storeId?storesMap.get(p.storeId):null;
const isRestaurantPost=postStore?isRestaurantStore(postStore):isRestaurantCategory(p.category);
const cleanPhone=String(p.phone||'').replace(/[^0-9+]/g,'');
const contactBtn=(p.phone && !isSold)
  ? (isRestaurantPost
      ? `<a href="tel:${formatCallPhone(p.phone)}" class="callBtn" style="background:var(--call);text-decoration:none;display:inline-flex;align-items:center;justify-content:center" onclick="event.stopPropagation();incrementWhatsappClick('${escapeHtml(p.id)}','post')">📞 اتصل</a>`
      : `<button class="waBtn" onclick="event.stopPropagation();contactSeller('${escapeHtml(p.id)}')">واتساب</button>
         <a href="tel:${formatCallPhone(p.phone)}" class="callBtn" style="background:var(--call);text-decoration:none;display:inline-flex;align-items:center;justify-content:center" onclick="event.stopPropagation();incrementWhatsappClick('${escapeHtml(p.id)}','post')">اتصال</a>`)
  : "";
const edit=canDelete?`<button class="iconBtn2 editBtn" onclick="editPost('${p.id}')">✏️</button>`:"";
const del=canDelete?`<button class="iconBtn2 delBtn" onclick="deletePost('${p.id}')">🗑️</button>`:"";
const renewBtn=canDelete && !isSold?`<button class="iconBtn2 renewBtn" onclick="renewPost('${p.id}',event)" title="تجديد 30 يوم">🔄</button>`:"";
const soldToggle=canDelete?`<button class="iconBtn2 soldBtn" onclick="toggleSold('${p.id}',event)" title="${isSold?'إلغاء البيع':'تم البيع'}">${isSold?'↩️':'✅'}</button>`:"";
const storyBtn=(isOwner||isAdmin)&&status==="approved"&&!isSold?`<button class="iconBtn2 storyBtn" onclick="publishPostToStory('${p.id}',event)" title="نشر كستوري في قصتك 📸" style="background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;font-weight:900;border:none">📸 قصتك</button>`:"";
const feat=isAdmin?`<button class="iconBtn2 featBtn ${isPostFeatured(p)?'on':''}" onclick="toggleFeatured('${p.id}',event)">${isPostFeatured(p)?'⭐':'☆'}</button>`:"";
const fav=isFavorite(p.id);
const inCompare=compareList.includes(p.id);
const viewsLine=(isOwner||isAdmin||isMyStorePost)?`<div class="cardViews">👁️ ${p.views||0} مشاهدة</div>`:"";
let cardClass="";
if(isSold)cardClass="sold";
else if(wanted)cardClass="wanted";
else if(expired && (isOwner||isAdmin||isMyStorePost))cardClass="expired";
else if(status==="approved" && isPostFeatured(p))cardClass="featured";
else if(status==="pending")cardClass="pending";
else if(status==="rejected")cardClass="rejected";
const displayCategory=(p.category==="مطاعم وغداء")?"المطاعم والمأكولات":(p.category||"");
const brandTag=p.brand?`<span class="brandTag">${escapeHtml(p.brand)}</span>`:`<span class="catTag">${escapeHtml(displayCategory)}</span>`;
const memberTag=p.sellerMemberNo?`<span class="memberNoBadge" style="margin-left:6px">#${p.sellerMemberNo}</span>`:"";
const userTag=p.sellerUsername?`<span class="usernameBadge" style="margin-left:6px">@${escapeHtml(p.sellerUsername)}</span>`:"";
const storeTag=p.storeId?`<span class="storeBadge" style="margin-left:6px">🏪 ${escapeHtml(p.storeName||"متجر")}</span>`:"";
const sellerPostsCount=(!p.storeId && p.uid) ? (sellerApprovedCountMap.get(p.uid) || 0) : 0;
const tierTag=!p.storeId && sellerPostsCount>0 ? renderSellerTierBadge(p.uid,sellerPostsCount) : "";
const sellerLineHtml=p.storeId?`<div class="sellerLine" onclick="event.stopPropagation();openStore('${p.storeId}',false,'home')">${storeTag} ›</div>`:(p.uid?`<div class="sellerLine" onclick="openSeller('${escapeHtml(p.uid)}')">👤 ${escapeHtml(p.sellerName||"البائع")} ${memberTag} ${userTag}${tierTag} ›</div>`:"");
let expiryLine="";
if(!isSold && (isOwner||isAdmin||isMyStorePost)&&days!=null){
  if(days<=0)expiryLine=`<div class="expiryLine expiryEnded">⏰ منتهي — يحتاج تجديد</div>`;
  else if(days<=5)expiryLine=`<div class="expiryLine expirySoon">⏳ باقي ${days} يوم فقط!</div>`;
  else expiryLine=`<div class="expiryLine expiryOk">⏳ باقي ${days} يوم</div>`;
}
const discPct=getDiscountPercent(p);
const discBadge=discPct>0?`<span class="discountBadge">🔥 ${discPct}%</span>`:"";
const negotiableBadge=p.negotiable?`<span style="background:#dcfce7;color:#166534;font-weight:800;padding:3px 9px;border-radius:7px;font-size:11px;border:1px solid #16a34a;margin-right:6px">🤝 قابل للنقاش</span>`:"";
let priceHTML="";
if(p.priceType==="contact"){
  priceHTML=`<div class="price" style="color:var(--teal-dark);font-size:13.5px">📞 تواصل لمعرفة السعر</div>`;
}else if(discPct>0){
  priceHTML=`<div class="price"><span class="originalPrice">${formatPrice(p.originalPrice)} د.ل</span><span class="discountPrice">${formatPrice(p.price)} د.ل</span>${negotiableBadge}</div>`;
}else{
  priceHTML=`<div class="price">${p.price!=null?formatPrice(p.price)+" د.ل":""}${negotiableBadge}</div>`;
}
return `<div class="card ${cardClass}" data-title="${escapeHtml(p.title||"")}"><div class="imgWrap" onclick="openPost('${p.id}')">${carouselHtml(images)}${dots}${discBadge}<button class="compareCheckbox ${inCompare?'active':''}" onclick="toggleCompare('${p.id}',event)">${inCompare?'✓':'⚖'}</button><button class="favBtn ${fav?'active':''}" onclick="toggleFavorite('${p.id}',event)">${fav?'❤️':'🤍'}</button></div><div class="body"><h4 style="cursor:pointer" onclick="openPost('${p.id}')">${escapeHtml(p.title||"بدون عنوان")}</h4>${priceHTML}${renderCardSpecs(p)}${p.city?`<div class="cityLine">📍 ${escapeHtml(p.city)}</div>`:""}${sellerLineHtml}<div class="meta">${brandTag}<span class="time">${timeAgo(p.createdAt)}</span></div>${viewsLine}${expiryLine}<div class="actions">${contactBtn}${feat}${soldToggle}${storyBtn}${edit}${del}${renewBtn}</div></div></div>`;
}).join("");
}

/* ============================================
   تفاصيل الإعلان (openPost)
   ============================================ */
window.openPost=(id,skipHistory)=>{
const p=allPosts.find(x=>x.id===id);if(!p)return;
const status=getStatus(p);const me=auth.currentUser;const isOwner=me&&me.uid===p.uid;const isMyStorePost=myStore&&p.storeId===myStore.id;
const expired=isExpired(p);const isSold=!!p.sold;
const wanted=isWanted(p);
if(expired && !isOwner && !isAdmin && !isMyStorePost){showToast("⏰ هذا الإعلان منتهي.","warn");return;}
if(status!=="approved" && !isOwner && !isAdmin && !isMyStorePost){showToast("هذا الإعلان غير متاح حالياً.","warn");return;}
if(!isOwner && !isMyStorePost){incrementViews(id);addRecentView(id);}
const days=daysLeft(p);
const images=getImages(p);const dots=dotsHtml(images);
const thumbsHtml=images.length>1?`<div class="thumbsRow" id="postThumbs">${images.map((u,i)=>`<div class="thumbItem${i===0?' active':''}" onclick="event.stopPropagation();scrollToPostImage('${p.id}',${i})"><img src="${escapeHtml(u)}" loading="lazy"></div>`).join("")}</div>`:"";
const desc=p.description?`<div class="pDesc">${escapeHtml(p.description)}</div>`:`<div class="pDesc" style="color:var(--muted)">لا يوجد وصف.</div>`;
const postStore=p.storeId?allStores.find(s=>s.id===p.storeId):null;
const isRestaurantPost=postStore?isRestaurantStore(postStore):isRestaurantCategory(p.category);
let sellerTags="";
if(p.storeId){sellerTags+=` <span class="storeBadge">🏪 ${escapeHtml(p.storeName||"متجر")}</span>`;}
else{if(p.sellerMemberNo)sellerTags+=` <span class="memberNoBadge">#${p.sellerMemberNo}</span>`;
if(p.sellerUsername)sellerTags+=` <span class="usernameBadge">@${escapeHtml(p.sellerUsername)}</span>`;}
const sellerHtml=p.storeId?`<div class="sellerLine" style="font-size:13px;margin:6px 0" onclick="closeOverlay();setTimeout(()=>openStore('${p.storeId}',false,'categories'),200)">${escapeHtml(p.storeName||"المتجر")}${sellerTags} ›</div>`:(p.uid?`<div class="sellerLine" style="font-size:13px;margin:6px 0" onclick="closeOverlay();setTimeout(()=>openSeller('${escapeHtml(p.uid)}'),200)">👤 ${escapeHtml(p.sellerName||"البائع")}${sellerTags} ›</div>`:"");

const cleanPPhone=String(p.phone||'').replace(/[^0-9+]/g,'');
const postCallPhone = (isRestaurantPost && (p.callPhone || (postStore && postStore.callPhone))) || p.phone;
const receiptWaPhone = (postStore && (postStore.receiptPhone || postStore.phone)) || p.phone;
const chatSellerBtn=(!isSold && p.uid && !isOwner)
  ? `<button class="btnMain" style="background:linear-gradient(135deg,#0d9488,#059669);color:#fff;margin-bottom:8px;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:800;font-size:15px;box-shadow:0 4px 12px rgba(13,148,136,.3)" onclick="event.stopPropagation();openChatWithSeller('${escapeHtml(p.uid)}','${escapeHtml(p.id)}')">💬 دردشة فورية مع البائع</button>`
  : "";

const contactBtn=(p.phone && !isSold)
  ? (isRestaurantPost
      ? `${postCallPhone ? `<a href="tel:${formatCallPhone(postCallPhone)}" class="btnMain" style="background:var(--call);margin-bottom:8px;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:8px;font-size:15px;font-weight:800;padding:13px" onclick="event.stopPropagation();incrementWhatsappClick('${escapeHtml(p.id)}','post')">📞 اتصال هاتفي لطلب الأوردر (${formatCallPhone(postCallPhone)})</a>` : ''}
         ${receiptWaPhone ? `<button class="btnGhost" style="width:100%;font-size:12px;color:#0369a1;background:#f0f9ff;border:1px dashed #0ea5e9;padding:9px;border-radius:10px;margin-bottom:8px;cursor:pointer;font-weight:700" onclick="event.stopPropagation();sendReceiptToSeller('${escapeHtml(receiptWaPhone)}','${escapeHtml(p.storeName||'المطعم')}')">🧾 دفع مصرفي؟ إرسال واصل التحويل عبر واتساب</button>` : ''}`
      : `<div style="display:flex;gap:8px;margin-bottom:8px">
          <button class="btnMain" style="flex:1;background:var(--wa);margin-bottom:0;display:flex;align-items:center;justify-content:center;gap:6px" onclick="event.stopPropagation();contactSeller('${escapeHtml(p.id)}')">💬 تواصل عبر واتساب</button>
          <a href="tel:${formatCallPhone(p.phone)}" class="btnMain" style="flex:1;background:var(--call);margin-bottom:0;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px" onclick="event.stopPropagation();incrementWhatsappClick('${escapeHtml(p.id)}','post')">📞 اتصال هاتفي</a>
        </div>`)
  : "";

const cartBtn=(!isSold && canHaveCart(p))?`<button class="btnMain" style="background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#3a2500;margin-bottom:8px" onclick="addToCart('${p.id}',event);setTimeout(()=>openCart(),300)">🛒 أضف للسلة</button>`:"";
const shareBtn=(status==="approved" && !expired)?`<div style="display:flex;gap:8px;margin-bottom:8px"><button class="btnMain" style="flex:1;background:var(--teal-dark);margin-bottom:0" onclick="sharePost('${p.id}')">📤 مشاركة الرابط</button><button class="btnMain" style="flex:1;background:linear-gradient(135deg,#ec4899,#8b5cf6);color:#fff;margin-bottom:0;font-weight:700" onclick="openStoryModal('${p.id}')">📸 صورة للستوري</button></div>`:"";
const viewsBadge=(isOwner||isAdmin||isMyStorePost)?`<div class="pViewsBadge">👁️ ${p.views||0} مشاهدة</div>`:"";
let statusBadge="";
if(isOwner||isAdmin||isMyStorePost){if(status==="pending")statusBadge=`<span class="statusBadge pending">⏳ قيد المراجعة</span>`;else if(status==="rejected")statusBadge=`<span class="statusBadge rejected">❌ مرفوض${p.rejectReason?' — '+escapeHtml(p.rejectReason):''}</span>`;}
let soldBadge=isSold?`<span class="soldBadge">✅ تم البيع</span>`:"";
let wantedBadge=wanted?`<span class="soldBadge" style="background:#fff7ed;color:#9a3412;border-color:#f97316">🎯 إعلان مطلوب</span>`:"";
let expiryBadge="";
if(!isSold && (isOwner||isAdmin||isMyStorePost)&&days!=null){
  if(days<=0)expiryBadge=`<span class="expiryBadge" style="background:#fdeceb;color:#b91c1c;border:1px solid #e5484d">⏰ منتهي</span>`;
  else if(days<=5)expiryBadge=`<span class="expiryBadge" style="background:#fef3c7;color:#92400e;border:1px solid #f59e0b">⏳ باقي ${days} يوم</span>`;
  else expiryBadge=`<span class="expiryBadge" style="background:#dcfce7;color:#166534;border:1px solid #16a34a">⏳ باقي ${days} يوم</span>`;
}
let brandBadge=p.brand?`<span class="brandBadge">🏷️ ${escapeHtml(p.brand)}</span>`:"";
let featBadge="";
if(status==="approved" && !expired && !isSold && isPostFeatured(p)){const daysF=featuredDaysLeft(p);if(isOwner)featBadge=`<span class="featBadgeOwner">⭐ مميز — ${daysF} ${daysF===1?'يوم':'أيام'} متبقية</span>`;else if(isAdmin)featBadge=`<span class="featBadge">⭐ مميز — ${daysF} ${daysF===1?'يوم':'أيام'}</span>`;else featBadge=`<span class="featBadge">⭐ إعلان مميز</span>`;}
const renewBtnBig=(isOwner||isAdmin||isMyStorePost) && !isSold?`<button class="renewBtnBig" onclick="renewPost('${p.id}')">🔄 تجديد 30 يوم إضافية</button>`:"";
const soldBtnBig=(isOwner||isAdmin||isMyStorePost)?(isSold?`<button class="unsoldBtnBig" onclick="toggleSold('${p.id}')">↩️ إلغاء (تم البيع)</button>`:`<button class="soldBtnBig" onclick="toggleSold('${p.id}')">✅ تم البيع</button>`):"";
let upgradeBtn="";
if(isOwner && status==="approved" && !expired && !isSold){if(isPostFeatured(p))upgradeBtn=`<button class="upgradeBtn" onclick="openUpgrade('${p.id}')">🔄 تجديد / تمديد الترقية</button>`;else upgradeBtn=`<button class="upgradeBtn" onclick="openUpgrade('${p.id}')">⭐ ترقية إعلاني</button>`;}
const storyBtnBig=(isOwner||isAdmin||isMyStorePost)&&status==="approved"&&!isSold?`<button type="button" class="upgradeBtn" onclick="publishPostToStory('${p.id}')" style="background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;margin-top:8px">📸 نشر في قصتك (ستوري مميز)</button>`:"";
let adminPanel="";
if(isAdmin){
if(status==="pending")adminPanel=`<div class="reviewBox"><div class="rbTitle">⏳ بانتظار المراجعة</div><div class="rbBtns"><button class="approve" onclick="approvePost('${p.id}')">✅ موافقة</button><button class="reject" onclick="rejectPost('${p.id}')">❌ رفض</button></div></div>`;
else if(status==="rejected")adminPanel=`<div class="reviewBox" style="background:#fdeceb;border-color:#e5484d"><div class="rbTitle" style="color:#b91c1c">❌ إعلان مرفوض</div><div class="rbBtns"><button class="approve" onclick="approvePost('${p.id}')">✅ قبول الإعلان</button></div></div>`;
adminPanel+=`<div style="background:#fff8e1;border:1px solid #f59e0b;border-radius:12px;padding:12px;margin-top:8px"><div style="font-weight:800;color:#92400e;margin-bottom:8px;font-size:13px">⭐ التحكم بالتمييز (أدمن)</div><div class="adminPlans"><button onclick="adminFeature('${p.id}',7)">7 أيام</button><button onclick="adminFeature('${p.id}',15)">15 يوم</button><button onclick="adminFeature('${p.id}',30)">30 يوم</button>${isPostFeatured(p)?`<button class="cancel" onclick="adminFeature('${p.id}',0)">❌ إلغاء التمييز</button>`:""}</div></div>`;
}
let analyticsHtml="";
if(isOwner||isAdmin||isMyStorePost){
  const favsCount=p.favoritesCount||0;
  const waClicks=p.whatsappClicks||0;
  const views=p.views||0;
  analyticsHtml=`<div class="analyticsBox">
    <div class="analyticsTitle">📊 إحصائيات هذا الإعلان</div>
    <div class="analyticsGrid">
      <div class="analyticsCard"><div class="anVal">${views}</div><div class="anLbl">👁️ مشاهدة</div></div>
      <div class="analyticsCard"><div class="anVal">${waClicks}</div><div class="anLbl">📱 ضغطات واتساب</div></div>
      <div class="analyticsCard"><div class="anVal">${favsCount}</div><div class="anLbl">❤️ مفضلة</div></div>
    </div>
  </div>`;
}
const similar=allPosts.filter(x=>x.id!==p.id && x.category===p.category && getStatus(x)==="approved" && !isExpired(x) && !x.sold).slice(0,4);
const similarHtml=similar.length?`<div style="margin-top:24px;padding-top:16px;border-top:2px dashed #edeff2"><div style="font-weight:800;font-size:15px;margin-bottom:12px">🔄 إعلانات مشابهة</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${similar.map(s=>{const imgs=getImages(s);const th=imgs[0]||"";const simPrice=s.priceType==="contact"?"📞 تواصل":(s.price!=null?formatPrice(s.price)+" د.ل":"");return `<div onclick="closeOverlay();setTimeout(()=>openPost('${s.id}'),200)" style="background:#fff;border:1px solid var(--border);border-radius:12px;overflow:hidden;cursor:pointer"><div style="width:100%;aspect-ratio:1/1;background:var(--teal-light);overflow:hidden">${th?`<img src="${escapeHtml(th)}" style="width:100%;height:100%;object-fit:cover">`:`<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:24px;opacity:.5">🖼️</div>`}</div><div style="padding:8px 10px"><div style="font-size:12.5px;font-weight:700;line-height:1.4;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.4em">${escapeHtml(s.title||"بدون عنوان")}</div><div style="font-size:13px;font-weight:800;color:var(--teal-dark)">${simPrice}</div></div></div>`;}).join("")}</div></div>`:"";
const discPct=getDiscountPercent(p);
const negotiableBadgeBig=p.negotiable?`<span style="background:#dcfce7;color:#166534;font-weight:800;padding:5px 12px;border-radius:9px;font-size:12.5px;border:1px solid #16a34a;margin-right:8px;display:inline-block;margin-top:6px">🤝 قابل للنقاش</span>`:"";
let priceHtml="";
if(p.priceType==="contact"){
  priceHtml=`<div style="margin:8px 0;background:var(--teal-light);border:2px solid var(--teal);border-radius:12px;padding:14px;text-align:center"><div style="font-size:22px;font-weight:900;color:var(--teal-dark)">📞 تواصل لمعرفة السعر</div><div style="font-size:12px;color:var(--muted);margin-top:4px">السعر متاح عند التواصل مع البائع</div>${negotiableBadgeBig}</div>`;
}else if(discPct>0){
  priceHtml=`<div style="margin:6px 0"><span class="originalPrice" style="font-size:15px">${formatPrice(p.originalPrice)} د.ل</span><span class="discountPrice" style="font-size:24px">${formatPrice(p.price)} د.ل</span><span style="background:#e5484d;color:#fff;font-weight:800;padding:4px 10px;border-radius:8px;font-size:12px;margin-right:8px">🔥 خصم ${discPct}%</span>${negotiableBadgeBig}</div>`;
}else{
  priceHtml=`<div class="price" style="font-size:20px">${p.price!=null?formatPrice(p.price)+" د.ل":""}${negotiableBadgeBig}</div>`;
}
updateSEOMeta(p);
document.getElementById("postContent").innerHTML=`<div class="pImg"><button class="reportOnImg right" onclick="reportPost('${p.id}')">🚩</button>${carouselHtml(images,true)}${dots}</div>${thumbsHtml}<div class="pTitle">${escapeHtml(p.title||"بدون عنوان")}</div>${priceHtml}<div class="pMeta">${p.city?"📍 "+escapeHtml(p.city)+" · ":""}${escapeHtml(p.category||"")} · ${timeAgo(p.createdAt)}</div><div>${soldBadge}${wantedBadge}${featBadge}${brandBadge}${statusBadge}${viewsBadge}${expiryBadge}</div>${sellerHtml}${analyticsHtml}${renderDetailsSpecs(p)}<div style="font-weight:800;margin:14px 0 4px">الوصف</div>${desc}<div style="height:14px"></div>${soldBtnBig}${cartBtn}${renewBtnBig}${upgradeBtn}${storyBtnBig}${chatSellerBtn}${contactBtn}${shareBtn}${similarHtml}${adminPanel}`;
postOverlay.classList.remove("hidden");
if(window.lucide) lucide.createIcons();
window.scrollTo(0,0);
if(!skipHistory) pushNavState({ screen: 'post', id: id }, '#post-' + id);
setTimeout(()=>{
  const carousel=document.querySelector("#postContent .carousel");
  if(carousel){
    carousel.addEventListener("scroll",()=>{
      const idx=Math.round(carousel.scrollLeft/(carousel.clientWidth||1));
      document.querySelectorAll(".thumbItem").forEach((t,i)=>t.classList.toggle("active",i===idx));
    },{passive:true});
  }
},50);
};
  /* ============================================
   حفظ الإعلان (savePost) — مع priceType + negotiable
   ============================================ */
function generateKeywords(title, description, brand, category, city, specs){
  let specsText = "";
  if(specs && typeof specs === "object") {
    specsText = Object.values(specs).filter(v => v && typeof v === "string").join(" ");
  }
  const text = `${title||""} ${description||""} ${brand||""} ${category||""} ${city||""} ${specsText}`.toLowerCase();
  const words = text.replace(/[^a-z0-9\u0621-\u064A\s]/g, " ").split(/\s+/).filter(w => w.length >= 2);
  return Array.from(new Set(words)).slice(0, 45);
}

window.savePost=async()=>{
if(!auth.currentUser){pendingAction="form";authOverlay.classList.remove("hidden");return;}
const isStore=!!window._isStorePost;
const title=document.getElementById("title").value.trim();
const price=document.getElementById("price").value;
const priceType=document.getElementById("contactPrice")?.checked?"contact":"fixed";
const negotiable=!!document.getElementById("negotiablePrice")?.checked;
const category=document.getElementById("category").value;
const brand=document.getElementById("brand").value||"";
const city=document.getElementById("city").value;
const description=document.getElementById("description").value.trim().slice(0,1000);
const saveBtn=document.getElementById("saveBtn");
const wasEditing=!!editingPostId;
const userPhone=(myProfile&&myProfile.phone)||"";
const isStorePostFlag=!!window._isStorePost;
const storeForPhone=isStorePostFlag && _tempStoreData ? _tempStoreData : myStore;
const rawInputPhone = (document.getElementById("phone")?.value || "").replace(/[^0-9+]/g, "");
const phone=(isStorePostFlag && storeForPhone && storeForPhone.phone) ? storeForPhone.phone : (userPhone || rawInputPhone);
const adType=document.querySelector('input[name="adType"]:checked')?.value||"offer";
const originalPrice=parseFloat(document.getElementById("originalPrice")?.value)||0;
if(!phone || phone === "218"){showToast("❌ يجب تسجيل أو كتابة رقم الواتساب أولاً.","error");return;}
const sellerName=(myProfile&&myProfile.name)||defaultName(auth.currentUser);
const sellerMemberNo=(myProfile&&myProfile.memberNo)||null;
const sellerUsername=(myProfile&&myProfile.username)||"";
if(!title){showToast("الرجاء إدخال العنوان","warn");return;}
if(priceType==="fixed" && (!price || isNaN(Number(price)))){showToast("الرجاء إدخال السعر أو اختيار (تواصل لمعرفة السعر)","warn");return;}
if(!city){showToast("الرجاء اختيار المدينة","warn");return;}
if(!wasEditing && !document.getElementById("termsCheck").checked){showToast("⚠️ يجب الموافقة على الشروط والتعهد القانوني قبل النشر","warn");return;}
const bad=checkContent(title,description);
if(bad){showToast(`❌ لا يمكن نشر الإعلان — يحتوي على كلمة ممنوعة (${bad.word})`,"error");return;}

if(isStore && !_tempStoreData){
  try{
    const saved=sessionStorage.getItem('_tempStoreData');
    if(saved) _tempStoreData=JSON.parse(saved);
  }catch(e){}
}

const storeToUse=isStore && _tempStoreData ? _tempStoreData : myStore;
if(!wasEditing){
  if(isStore){
    if(!storeToUse||storeToUse.status!=="approved"){showToast("❌ المتجر غير معتمد","error");return;}
    const stCount=allPosts.filter(p=>p.storeId===storeToUse.id).length;
    const storeLimit=await getUserStoreLimit(auth.currentUser.uid);
    if(stCount>=storeLimit && !isAdmin){showToast(`⚠️ وصلت للحد الأقصى للمتجر (${storeLimit})`,"warn");return;}
  }else{
    const myCount=allPosts.filter(p=>p.uid===auth.currentUser.uid && !p.storeId).length;
    const limit=await getUserLimit(auth.currentUser.uid);
    if(myCount>=limit && !isAdmin){showToast(`وصلت للحد الأقصى (${limit})`,"warn");return;}
  }
}
saveBtn.disabled=true;saveBtn.textContent=wasEditing?"جاري الحفظ...":"جاري النشر...";
try{
const images=[];
for(const item of selectedImages){if(item.type==="existing")images.push(item.url);else{saveBtn.textContent="جاري رفع الصور...";images.push(await uploadToImgBB(item.file));}}
const finalOriginalPrice=(priceType==="fixed" && originalPrice>Number(price))?originalPrice:0;
const specs=collectDynamicSpecs(category);
let subCategory=(document.getElementById("storeSubCategory")?.value||"").trim();
if(!subCategory){
  if(specs.subType) subCategory=specs.subType;
  else if(specs.propertyType) subCategory=specs.propertyType;
  else if(specs.applianceType) subCategory=specs.applianceType;
  else if(specs.console) subCategory=specs.console;
}
const postKeywords=generateKeywords(title, description, brand, category, city, specs);
if(wasEditing){
  const oldPost=allPosts.find(p=>p.id===editingPostId);
  if(!oldPost){
    showToast("❌ هذا الإعلان غير موجود أو تم حذفه مسبقاً","error");
    return;
  }
  const isMyStorePost = (myStore && oldPost.storeId === myStore.id) || (storeToUse && oldPost.storeId === storeToUse.id);
  const isOwner = auth.currentUser && (auth.currentUser.uid === oldPost.uid || isMyStorePost);
  if(!isOwner && !isAdmin){
    showToast("❌ ليس لديك صلاحية تعديل هذا الإعلان","error");
    return;
  }
  const originalData={title:oldPost.title,price:oldPost.price,category:oldPost.category,brand:oldPost.brand||"",city:oldPost.city,description:oldPost.description||"",phone:oldPost.phone};
  const newExpires=oldPost.expiresAt ? oldPost.expiresAt : (Date.now()+POST_DURATION_MS);
  const newStatus = isAdmin ? "approved" : "pending";
  const upd={title,price:priceType==="contact"?null:Number(price),priceType:priceType,negotiable:negotiable,originalPrice:finalOriginalPrice,category,brand,city,description,phone,images,adType,subCategory,specs,keywords:postKeywords,status:newStatus,approvedAt:newStatus==="approved"?(oldPost.approvedAt||Date.now()):null,rejectReason:null,wasEdited:true,originalData:{...originalData,specs},editedAt:Date.now(),expiresAt:newExpires,sold:false,soldAt:null};
  if(!oldPost.storeId){upd.sellerName=sellerName;upd.sellerMemberNo=sellerMemberNo;upd.sellerUsername=sellerUsername;}
  await updateDoc(doc(db,"posts",editingPostId),upd);
  Object.assign(oldPost, upd);
  renderPosts();
  showToast(isAdmin ? "✅ تم حفظ تعديلات الإعلان بنجاح" : "✅ تم حفظ التعديل، وبانتظار مراجعة الإدارة", "success");
}
else{
  const now=Date.now();
  const base={title,price:priceType==="contact"?null:Number(price),priceType:priceType,negotiable:negotiable,originalPrice:finalOriginalPrice,category,brand,city,description,phone,images,adType,subCategory,specs,originalData:{specs},keywords:postKeywords,status:"pending",createdAt:now,expiresAt:now+POST_DURATION_MS,views:0,whatsappClicks:0,favoritesCount:0,featured:false,featuredUntil:0,featuredPlan:null,termsAcceptedAt:now,sold:false,soldAt:null};
  if(isStore){
    base.storeId=storeToUse.id;
    base.storeName=storeToUse.name;
    base.storeCategory=storeToUse.category;
    base.storePhone=storeToUse.phone||"";
    base.phone=storeToUse.phone||"";
    base.callPhone=storeToUse.callPhone||storeToUse.phone||"";
    base.uid=storeToUse.ownerUid||auth.currentUser.uid;
    // base.email=storeToUse.ownerEmail||auth.currentUser.email||""; // تم إيقافها لحماية خصوصية المستخدم ومنع تسريب الإيميل
    base.addedBy=auth.currentUser.uid;
    if(isAdmin){
      base.status="approved";
      base.approvedAt=now;
    }
  }
  else{
    base.uid=auth.currentUser.uid;
    // base.email=auth.currentUser.email||""; // تم إيقافها لحماية خصوصية المستخدم ومنع تسريب الإيميل
    base.sellerName=sellerName;
    base.sellerMemberNo=sellerMemberNo;
    base.sellerUsername=sellerUsername;
  }
  const newDocRef = await addDoc(collection(db,"posts"),base);
  const newPostObj = { id: newDocRef.id, ...base };
  allPosts.unshift(newPostObj);
  if(base.status === "pending"){
    allPendingPosts = allPendingPosts.filter(p => p.id !== newPostObj.id);
    allPendingPosts.unshift(newPostObj);
    updateModBadge();
  }
  renderPosts();
  showToast(isStore?"✅ تم إضافة ونشر المنتج بالمتجر بنجاح":"✅ تم إرسال إعلانك بنجاح","success");
  addPoints(auth.currentUser.uid, 10, '📝 نشر إعلان جديد', 'post_create');
  if(isStore && window._currentStoreId){
    setTimeout(()=>openStore(window._currentStoreId, true), 300);
  }
}
  document.getElementById("title").value="";document.getElementById("price").value="";document.getElementById("phone").value="";
  if(document.getElementById("originalPrice"))document.getElementById("originalPrice").value="";
  if(document.getElementById("discountPreview"))document.getElementById("discountPreview").textContent="";
  const _cCb2=document.getElementById("contactPrice");if(_cCb2)_cCb2.checked=false;
  const _nCb2=document.getElementById("negotiablePrice");if(_nCb2)_nCb2.checked=false;
  onPriceTypeChange();
  selectedImages=[];renderImagePicker();
  currentFormSpecsState={};
  const _dynC=document.getElementById("dynamicSpecsContainer");
  if(_dynC){_dynC.classList.add("hidden");_dynC.innerHTML="";}
  editingPostId=null;
  _tempStoreData=null;
  try{sessionStorage.removeItem('_tempStoreData');}catch(e){}
  if(showOnlyMine){showMyPosts();}else if(currentCategory && currentCategory!=="الكل"){openCategory(currentCategory);}else{showCategoriesScreen();}
}catch(e){showToast("خطأ أثناء الحفظ: "+e.message,"error");}
finally{
  saveBtn.disabled=false;
  saveBtn.textContent=editingPostId ? "حفظ التعديلات" : (isStore ? "إضافة المنتج للمتجر" : "نشر الإعلان");
}
};

window.onAdTypeChange=()=>{
  const val=document.querySelector('input[name="adType"]:checked')?.value||"offer";
  const offerL=document.getElementById("adTypeOfferLabel");
  const wantedL=document.getElementById("adTypeWantedLabel");
  if(offerL)offerL.style.borderColor=val==="offer"?"var(--teal)":"var(--border)";
  if(offerL)offerL.style.background=val==="offer"?"var(--teal-light)":"var(--card)";
  if(wantedL)wantedL.style.borderColor=val==="wanted"?"var(--wanted)":"var(--border)";
  if(wantedL)wantedL.style.background=val==="wanted"?"#fff7ed":"var(--card)";
};

window.renewPost=async(id,event)=>{
  if(event)event.stopPropagation();
  const p=allPosts.find(x=>x.id===id);
  if(!p)return;
  const me=auth.currentUser;
  if(!me)return;
  const isMyStorePost=myStore&&p.storeId===myStore.id;
  const isOwner=me.uid===p.uid||isMyStorePost;
  if(!isOwner && !isAdmin){showToast("❌ هذا الإعلان ليس لك","error");return;}
  const expired=isExpired(p);
  const msg=expired?"هذا الإعلان منتهي. هل تريد تجديده 30 يوماً إضافية؟":"هل تريد تمديد صلاحية الإعلان 30 يوماً إضافية؟";
  if(!(await showConfirmModal(msg, { icon: "🔄", danger: false, confirmText: "تجديد الآن" }))) return;
  try{
    const now=Date.now();
    const currentExpires=getExpiresAt(p)||now;
    const base=currentExpires>now?currentExpires:now;
    const newExpires=base+POST_DURATION_MS;
    await updateDoc(doc(db,"posts",id),{expiresAt:newExpires,status:"pending",rejectReason:null});
    p.expiresAt = newExpires;
    p.status = "pending";
    p.rejectReason = null;
    renderPosts();
    showToast("✅ تم التجديد 30 يوم إضافية","success");
  }catch(e){showToast("خطأ: "+e.message,"error");}
};
window.approvePost=async(id)=>{
  if(!isAdmin)return;
  try{
    const post=allPosts.find(p=>p.id===id);
    await updateDoc(doc(db,"posts",id),{status:"approved",approvedAt:Date.now(),rejectReason:null,originalData:null,wasEdited:false});
    if(post){
      post.status = "approved";
      post.approvedAt = Date.now();
      post.rejectReason = null;
      post.originalData = null;
      post.wasEdited = false;
      if(post.uid){ addPoints(post.uid, 5, '✅ تمت الموافقة على إعلانك', 'post_approved'); }
      sendPostToTelegram(post);
    }
    renderPosts();
    allPendingPosts = allPendingPosts.filter(p => p.id !== id);
    updateModBadge();
    renderModeration();
    showToast("✅ تم قبول الإعلان","success");
    closeOverlay();
  }catch(e){showToast("خطأ: "+e.message,"error");}
};
window.rejectPost=async(id)=>{
  if(!isAdmin)return;
  const reason = await showPromptModal("سبب الرفض:", "محتوى غير مناسب", { title: "رفض الإعلان", icon: "🚫", confirmText: "رفض الإعلان" });
  if(reason===null)return;
  try{
    await updateDoc(doc(db,"posts",id),{status:"rejected",rejectReason:reason||"محتوى غير مناسب",rejectedAt:Date.now()});
    const post=allPosts.find(p=>p.id===id);
    if(post){
      post.status = "rejected";
      post.rejectReason = reason || "محتوى غير مناسب";
      post.rejectedAt = Date.now();
    }
    renderPosts();
    allPendingPosts = allPendingPosts.filter(p => p.id !== id);
    updateModBadge();
    renderModeration();
    showToast("✅ تم رفض الإعلان","success");
    closeOverlay();
  }catch(e){showToast("خطأ: "+e.message,"error");}
};
window.toggleFeatured=async(id,event)=>{
  if(event)event.stopPropagation();
  if(!isAdmin)return;
  const p=allPosts.find(x=>x.id===id);
  if(!p)return;
  const isFeat=isPostFeatured(p);
  const ok = await showConfirmModal(isFeat?"إلغاء تمييز هذا الإعلان؟":"تمييز هذا الإعلان لمدة 7 أيام مجاناً؟", { confirmText: isFeat ? "إلغاء التمييز" : "تمييز الإعلان" });
  if(!ok) return;
  try{
    if(isFeat){
      await updateDoc(doc(db,"posts",id),{featured:false,featuredUntil:0,featuredPlan:null});
      p.featured = false;
      p.featuredUntil = 0;
      p.featuredPlan = null;
    }else{
      const until = Date.now()+7*24*60*60*1000;
      await updateDoc(doc(db,"posts",id),{featured:true,featuredUntil:until,featuredPlan:"admin"});
      p.featured = true;
      p.featuredUntil = until;
      p.featuredPlan = "admin";
    }
    renderPosts();
    showToast("✅ تم","success");
  }catch(e){showToast("خطأ: "+e.message,"error");}
};
window.adminFeature=async(id,days)=>{
  if(!isAdmin)return;
  const p=allPosts.find(x=>x.id===id);
  try{
    if(days===0){
      await updateDoc(doc(db,"posts",id),{featured:false,featuredUntil:0,featuredPlan:null});
      if(p){ p.featured = false; p.featuredUntil = 0; p.featuredPlan = null; }
    }else{
      const until = Date.now()+days*24*60*60*1000;
      await updateDoc(doc(db,"posts",id),{featured:true,featuredUntil:until,featuredPlan:"admin",featuredBy:"admin"});
      if(p){ p.featured = true; p.featuredUntil = until; p.featuredPlan = "admin"; p.featuredBy = "admin"; }
    }
    renderPosts();
    showToast("✅ تم تفعيل التمييز","success");
    closeOverlay();
  }catch(e){showToast("خطأ: "+e.message,"error");}
};

/* ============================================
   الإدارة - المراجعة
   ============================================ */
let allPendingPosts = [];
let pendingPostsListenerStarted = false;
let unsubPendingPosts = null;

async function refreshPendingPosts(){
  try {
    let list = [];
    if(window.supabase){
      const { data, error } = await window.supabase
        .from("posts")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if(!error && Array.isArray(data)){
        list = data.map(item => typeof objectFromDb === 'function' ? objectFromDb(item) : item);
      }
    }
    if(!list.length){
      try {
        const snap = await getDocs(query(collection(db, "posts"), where("status", "==", "pending")));
        list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch(e){}
    }
    allPendingPosts = list;
    allPendingPosts.sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
    updateModBadge();
    return allPendingPosts;
  } catch(e){
    console.warn("refreshPendingPosts error:", e);
    return [];
  }
}
window.refreshPendingPosts = refreshPendingPosts;

function startPendingPostsListener(){
  if(unsubPendingPosts) return;
  pendingPostsListenerStarted = true;
  refreshPendingPosts();
  try {
    const q = query(collection(db, "posts"), where("status", "==", "pending"));
    unsubPendingPosts = onSnapshot(q, snap => {
      allPendingPosts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      allPendingPosts.sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
      updateModBadge();
      const modOverlay = document.getElementById("moderationOverlay");
      if(modOverlay && !modOverlay.classList.contains("hidden")){
        renderModeration();
      }
    }, err => {
      console.warn("Pending posts listener error:", err);
    });
  } catch(e){}
}

function stopPendingPostsListener(){
  if(unsubPendingPosts){ unsubPendingPosts(); unsubPendingPosts = null; }
  pendingPostsListenerStarted = false;
  allPendingPosts = [];
}

function renderModeration(){
  const list=document.getElementById("moderationList");if(!list)return;
  const pending=allPendingPosts;
  if(pending.length===0){list.innerHTML="<div class='reportsEmpty'>🎉 لا توجد إعلانات قيد المراجعة</div>";return;}
  const toolbar=`<div style="background:#eff6ff;border:1px solid #3b82f6;border-radius:12px;padding:12px;margin-bottom:12px"><div style="font-weight:800;color:#1e40af;margin-bottom:10px;font-size:14px">📊 يوجد ${pending.length} إعلان بانتظار المراجعة</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button onclick="approveAllPending()" style="padding:11px;border:none;border-radius:10px;background:#16a34a;color:#fff;font-family:inherit;font-size:13.5px;font-weight:800;cursor:pointer">✅ موافقة على الكل</button><button onclick="deleteAllPending()" style="padding:11px;border:none;border-radius:10px;background:#e5484d;color:#fff;font-family:inherit;font-size:13.5px;font-weight:800;cursor:pointer">❌ رفض الكل</button></div></div>`;
  const items=pending.map(p=>{
    const imgs=getImages(p);
    const imgsHtml=imgs.length?`<div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px">${imgs.map(u=>`<img src="${escapeHtml(u)}" style="width:130px;height:130px;border-radius:10px;object-fit:cover;flex:0 0 auto;border:1px solid var(--border)">`).join("")}</div>`:`<div style="padding:20px;text-align:center;color:var(--muted);background:#e6f6fe;border-radius:10px;font-size:13px">🖼️ لا توجد صور</div>`;
    const days=daysLeft(p);
    const expiryInfo=days!=null?`<div style="font-size:11.5px;font-weight:800;margin-top:8px;color:${days<=0?'#b91c1c':days<=5?'#92400e':'#166534'}">${days<=0?'⏰ منتهي':('⏳ باقي '+days+' يوم')}</div>`:"";
    const tags=(p.storeId?("🏪 "+escapeHtml(p.storeName||"متجر")):((p.sellerMemberNo?"· #"+p.sellerMemberNo:"")+(p.sellerUsername?" · @"+escapeHtml(p.sellerUsername):"")));
    const adTypeBadge=isWanted(p)?`<span style="background:#fff7ed;color:#9a3412;font-weight:800;padding:3px 9px;border-radius:7px;font-size:11.5px">🎯 مطلوب</span>`:`<span style="background:#e6f6fe;color:#0284c7;font-weight:800;padding:3px 9px;border-radius:7px;font-size:11.5px">🛒 معروض</span>`;
    const priceTxt=p.priceType==="contact"?"📞 تواصل لمعرفة السعر":(p.price!=null?formatPrice(p.price)+" د.ل":"");
    return `<div style="border:2px dashed #f59e0b;border-radius:14px;padding:12px;margin-bottom:14px;background:#fffbf0">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">${adTypeBadge}<span style="font-size:11.5px;color:var(--muted)">${timeAgo(p.createdAt)}</span></div>
<div style="font-weight:800;font-size:16px;margin-bottom:6px;line-height:1.4">${escapeHtml(p.title||"بدون عنوان")}</div>
<div style="font-weight:800;font-size:18px;color:var(--teal-dark);margin-bottom:10px">${priceTxt}</div>
${imgsHtml}
<div style="background:#fff;padding:12px;border-radius:10px;margin-top:10px;font-size:13.5px;line-height:1.9;white-space:pre-wrap;word-break:break-word;border:1px solid var(--border)">${escapeHtml(p.description||"لا يوجد وصف")}</div>
<div style="font-size:12px;color:var(--muted);margin-top:10px;line-height:1.8;background:#fff;padding:8px 10px;border-radius:8px;border:1px solid var(--border)">📁 ${escapeHtml(p.category||"")} ${p.brand?"· 🏷️ "+escapeHtml(p.brand):""}<br>📍 ${escapeHtml(p.city||"")}<br>${p.storeId?"🏪":""} ${p.storeId?escapeHtml(p.storeName||"متجر"):escapeHtml(p.sellerName||"البائع")} ${tags} · ☎️ ${escapeHtml(p.phone||"")}</div>
${expiryInfo}
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:12px">
<button onclick="approvePost('${p.id}');setTimeout(renderModeration,400)" style="padding:12px 4px;border:none;border-radius:9px;background:#16a34a;color:#fff;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer">✅ موافقة</button>
<button onclick="rejectPost('${p.id}');setTimeout(renderModeration,400)" style="padding:12px 4px;border:none;border-radius:9px;background:#e5484d;color:#fff;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer">❌ رفض</button>
<button onclick="closeOverlay();setTimeout(()=>openPost('${p.id}'),300)" style="padding:12px 4px;border:none;border-radius:9px;background:#0284c7;color:#fff;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer">👁️ عرض</button>
</div></div>`;
  }).join("");
  list.innerHTML=toolbar+items;
}

window.approveAllPending=async()=>{
  if(!isAdmin)return;
  const pending=allPendingPosts.slice();
  if(pending.length===0){showToast("لا توجد إعلانات","info");return;}
  const okConfirm = await showConfirmModal(`هل أنت متأكد من الموافقة على ${pending.length} إعلان قيد المراجعة؟`, { confirmText: "نعم، موافقة للكل" });
  if(!okConfirm) return;
  let ok=0,fail=0;
  for(const p of pending){
    try{
      await updateDoc(doc(db,"posts",p.id),{status:"approved",approvedAt:Date.now(),rejectReason:null,originalData:null,wasEdited:false});
      const inAll = allPosts.find(x => x.id === p.id);
      if(inAll){ inAll.status = "approved"; inAll.approvedAt = Date.now(); }
      ok++;
    }catch(e){fail++;}
  }
  renderPosts();
  showToast(`✅ تم قبول ${ok}`,"success");
  renderModeration();
};

window.deleteAllPending=async()=>{
  if(!isAdmin)return;
  const pending=allPendingPosts.slice();
  if(pending.length===0){showToast("لا توجد","info");return;}
  const okConfirm = await showConfirmModal(`هل أنت متأكد من رفض كافة الإعلانات المعلقة (${pending.length})؟`, { isDanger: true, confirmText: "رفض الكل" });
  if(!okConfirm) return;
  const reason = await showPromptModal("سبب الرفض للجميع:", "محتوى غير مناسب", { title: "سبب رفض كافة الإعلانات", icon: "🚫", confirmText: "رفض الكل" });
  if(reason===null)return;
  let ok=0;
  for(const p of pending){
    try{
      await updateDoc(doc(db,"posts",p.id),{status:"rejected",rejectReason:reason||"محتوى غير مناسب",rejectedAt:Date.now()});
      const inAll = allPosts.find(x => x.id === p.id);
      if(inAll){ inAll.status = "rejected"; }
      ok++;
    }catch(e){}
  }
  renderPosts();
  showToast(`✅ تم رفض ${ok}`,"success");
  renderModeration();
};

function updateModBadge(){
  if(!isAdmin||!moderationBtn)return;
  const c=allPendingPosts.length;
  moderationBtn.textContent=c>0?`⏳ الإعلانات قيد المراجعة (${c})`:"⏳ الإعلانات قيد المراجعة";
}

/* ============================================
   الإبلاغات
   ============================================ */
window.reportPost=async(id)=>{
  if(!auth.currentUser){pendingAction={type:"report",postId:id};authOverlay.classList.remove("hidden");return;}
  const reason = await showPromptModal("سبب الإبلاغ (اختياري):", "", { title: "إبلاغ عن إعلان مخالف", icon: "🚩", confirmText: "إرسال الإبلاغ", placeholder: "مثال: إعلان احتيالي، سلعة مخالفة..." });
  if(reason===null)return;
  try{
    const post=allPosts.find(p=>p.id===id);
    await addDoc(collection(db,"reports"),{postId:id,postTitle:post?post.title:"",reason:reason||"",reporterEmail:auth.currentUser.email||"",reporterUid:auth.currentUser.uid,createdAt:Date.now()});
    showToast("تم إرسال الإبلاغ، شكراً لك","success");
  }catch(e){showToast("تعذر إرسال الإبلاغ: "+e.message,"error");}
};
function startReportsListener(){onSnapshot(collection(db,"reports"),snap=>{allReports=snap.docs.map(d=>({id:d.id,...d.data()}));allReports.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));renderReports();reportsBtn.textContent=allReports.length?`🚩 الإبلاغات (${allReports.length})`:"🚩 الإبلاغات";});}
function renderReports(){
const list=document.getElementById("reportsList");if(!list)return;
if(allReports.length===0){list.innerHTML="<div class='reportsEmpty'>✅ لا توجد إبلاغات</div>";return;}
const toolbar=`<div style="background:#fdeceb;border:1px solid #e5484d;border-radius:12px;padding:12px;margin-bottom:12px"><div style="font-weight:800;color:#b91c1c;margin-bottom:10px;font-size:14px">🚩 يوجد ${allReports.length} إبلاغ</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button onclick="dismissAllReports()" style="padding:11px 4px;border:none;border-radius:10px;background:#8a93a3;color:#fff;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer">🗑️ تجاهل الكل</button><button onclick="deleteAllReportedPosts()" style="padding:11px 4px;border:none;border-radius:10px;background:#e5484d;color:#fff;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer">❌ حذف الكل</button></div></div>`;
const items=allReports.map(r=>{
const p=allPosts.find(x=>x.id===r.postId);
const imgs=p?getImages(p):[];
const imgsHtml=imgs.length?`<div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px">${imgs.map(u=>`<img src="${escapeHtml(u)}" style="width:130px;height:130px;border-radius:10px;object-fit:cover;flex:0 0 auto;border:1px solid var(--border)">`).join("")}</div>`:"";
const postInfo=p?`<div style="font-weight:800;font-size:16px;margin-bottom:6px">${escapeHtml(p.title||"بدون عنوان")}</div>${imgsHtml}`:`<div style="text-align:center;padding:20px;color:var(--muted);background:#fdeceb;border-radius:10px">⚠️ الإعلان محذوف</div>`;
const safePid=escapeHtml(r.postId||"");
const safeRid=escapeHtml(r.id||"");
return `<div style="border:2px solid #e5484d;border-radius:14px;padding:12px;margin-bottom:14px;background:#fff"><div style="background:#fdeceb;color:#b91c1c;padding:8px 12px;border-radius:10px;font-size:12.5px;font-weight:800;margin-bottom:12px">🚩 <b>سبب:</b> ${escapeHtml(r.reason||"بدون سبب")}<br><b>من:</b> ${escapeHtml(r.reporterEmail||"زائر")} · ${timeAgo(r.createdAt)}</div>${postInfo}<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:12px"><button style="padding:12px 4px;border:none;border-radius:9px;background:#fdeceb;color:var(--danger);font-family:inherit;font-size:13px;font-weight:800;cursor:pointer" onclick="deleteReportedPost('${safePid}','${safeRid}')">🗑️ حذف</button><button style="padding:12px 4px;border:none;border-radius:9px;background:var(--bg);color:var(--muted);font-family:inherit;font-size:13px;font-weight:800;cursor:pointer" onclick="dismissReport('${safeRid}')">👁️ تجاهل</button><button style="padding:12px 4px;border:none;border-radius:9px;background:#e0f2fe;color:#0369a1;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer" onclick="closeOverlay();setTimeout(()=>openPost('${safePid}'),300)">📄 عرض</button></div></div>`;
}).join("");
list.innerHTML=toolbar+items;
}
window.dismissAllReports=async()=>{if(!isAdmin)return;if(allReports.length===0){showToast("لا توجد","info");return;}const ok=await showConfirmModal(`تجاهل وحذف ${allReports.length} إبلاغ؟`,{confirmText:"تجاهل الكل"});if(!ok)return;let okC=0;for(const r of allReports){try{await deleteDoc(doc(db,"reports",r.id));okC++;}catch(e){}}showToast(`✅ تم تجاهل ${okC}`,"success");renderReports();};
window.deleteAllReportedPosts=async()=>{if(!isAdmin)return;if(allReports.length===0){showToast("لا توجد","info");return;}const ids=[...new Set(allReports.map(r=>r.postId).filter(x=>x))];const ok=await showConfirmModal(`هل أنت متأكد من حذف ${ids.length} إعلان مبلغ عنه نهائياً؟`,{isDanger:true,confirmText:"نعم، حذف الكل"});if(!ok)return;let okP=0,okR=0;for(const pid of ids){try{await deleteDoc(doc(db,"posts",pid));allPosts=allPosts.filter(x=>x.id!==pid);okP++;}catch(e){}}for(const r of allReports){try{await deleteDoc(doc(db,"reports",r.id));okR++;}catch(e){}}renderPosts();showToast(`✅ حذف ${okP} إعلان + ${okR} إبلاغ`,"success");renderReports();};
window.dismissReport=async(id)=>{try{await deleteDoc(doc(db,"reports",id));}catch(e){showToast("خطأ: "+e.message,"error");}};
window.deleteReportedPost=async(pid,rid)=>{const ok=await showConfirmModal("حذف هذا الإعلان المبلغ عنه نهائياً؟",{isDanger:true,confirmText:"حذف الإعلان"});if(!ok)return;try{await deleteDoc(doc(db,"posts",pid));await deleteDoc(doc(db,"reports",rid));allPosts=allPosts.filter(x=>x.id!==pid);renderPosts();renderReports();showToast("✅ تم الحذف بنجاح","success");}catch(e){showToast("خطأ: "+e.message,"error");}};
window.deletePost=async(id)=>{
  if(!(await showConfirmModal("هل أنت متأكد من رغبتك في حذف هذا الإعلان نهائياً؟", { danger: true, confirmText: "نعم، حذف" }))) return;
  try{
    if(cart.items.some(i=>i.postId===id)){
      cart.items=cart.items.filter(i=>i.postId!==id);
      if(cart.items.length===0){cart.storeId=null;cart.storeName="";cart.storePhone="";}
      saveCart();updateCartUI();
    }
    await deleteDoc(doc(db,"posts",id));
    allPosts=allPosts.filter(x=>x.id!==id);
    renderPosts();
    closeOverlay();
    showToast("✅ تم حذف الإعلان بنجاح","success");
  }catch(e){showToast("خطأ: "+e.message,"error");}
};

/* ============================================
   Admin: Limits
   ============================================ */
window.openLimits=()=>{if(!isAdmin)return;renderLimits();if(!limitsListenerStarted){limitsListenerStarted=true;onSnapshot(collection(db,"userLimits"),snap=>{allLimits=snap.docs.map(d=>({uid:d.id,...d.data()}));allLimits.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));renderLimits();});}limitsOverlay.classList.remove("hidden");accountOverlay.classList.add("hidden");};
function renderLimits(){
  const list=document.getElementById("limitsList");if(!list)return;
  if(allLimits.length===0){list.innerHTML="<div class='reportsEmpty'>لا توجد حدود مخصصة بعد<br><span style='font-size:12px'>الحد الافتراضي: 3 إعلانات فردية · 20 إعلان متجر</span></div>";return;}
  list.innerHTML=allLimits.map(l=>{
    const storeLimit=l.storeLimit||20;
    return `<div class="reportItem" style="background:#f0f9ff;border-color:#0ea5e9"><div class="rTitle">👤 ${escapeHtml(l.name||"مستخدم")} ${l.username?`<span class="usernameBadge" style="margin-right:6px">@${escapeHtml(l.username)}</span>`:""} ${l.memberNo?`<span class="memberNoBadge" style="margin-right:6px">#${l.memberNo}</span>`:""}</div><div class="rMeta"><b>📋 فردي:</b> <span style="color:#0284c7;font-weight:800;font-size:15px">${l.limit}</span> إعلان<br><b>🏪 متجر:</b> <span style="color:#92400e;font-weight:800;font-size:15px">${storeLimit}</span> منتج</div><div class="rActions" style="grid-template-columns:1fr 1fr"><button class="rDismiss" style="background:#e0f2fe;color:#0369a1" onclick="editLimit('${escapeHtml(l.uid)}')">✏️ تعديل</button><button class="rDelete" onclick="removeLimit('${escapeHtml(l.uid)}')">🗑️ إلغاء</button></div></div>`;
  }).join("");
}
window.editLimit=(uid)=>{const l=allLimits.find(x=>x.uid===uid);if(!l)return;document.getElementById("limitSearch").value=l.username?l.username:(l.memberNo?String(l.memberNo):(l.email||""));document.getElementById("limitNumber").value=l.limit||3;document.getElementById("storeLimitNumber").value=l.storeLimit||20;};
window.removeLimit=async(uid)=>{
  const ok=await showConfirmModal("هل تريد إلغاء الحد المخصص لهذا المستخدم وإعادته للحد الافتراضي العام؟", { confirmText: "إلغاء الحد" });
  if(!ok) return;
  try{
    await deleteDoc(doc(db,"userLimits",uid));
    delete userLimitsCache[uid];
    showToast("✅ تم الإلغاء بنجاح","success");
  }catch(e){showToast("خطأ: "+e.message,"error");}
};
async function findUserByAny(search){const s=String(search||"").trim();if(!s)return null;const clean=s.replace(/^@/,"").toLowerCase();try{const u=await getDoc(doc(db,"usernames",clean));if(u.exists())return{uid:u.data().uid};}catch(e){}const num=parseInt(s,10);if(!isNaN(num)){try{const q=query(collection(db,"profiles"),where("memberNo","==",num));const snap=await getDocs(q);if(!snap.empty)return{uid:snap.docs[0].id};}catch(e){}}return null;}
window.applyUserLimit=async()=>{
  if(!isAdmin)return;
  const search=document.getElementById("limitSearch").value.trim();
  const limitNum=parseInt(document.getElementById("limitNumber").value,10);
  const storeLimitNum=parseInt(document.getElementById("storeLimitNumber").value,10);
  if(!search){showToast("❌ اكتب اسم المستخدم أو الرقم","error");return;}
  if(!limitNum||limitNum<1||limitNum>999){showToast("❌ الحد الفردي غير صحيح","error");return;}
  if(!storeLimitNum||storeLimitNum<1||storeLimitNum>999){showToast("❌ حد المتجر غير صحيح","error");return;}
  const found=await findUserByAny(search);
  if(!found){showToast("❌ لم يتم العثور على المستخدم","error");return;}
  let prof=null;try{const p=await getDoc(doc(db,"profiles",found.uid));if(p.exists())prof=p.data();}catch(e){}
  const ok=await setUserLimit(found.uid,limitNum,{email:"",name:(prof&&prof.name)||"",username:(prof&&prof.username)||"",memberNo:(prof&&prof.memberNo)||null,storeLimit:storeLimitNum});
  if(ok){showToast(`✅ تم تحديد الحد: فردي ${limitNum} · متجر ${storeLimitNum}`,"success");document.getElementById("limitSearch").value="";document.getElementById("limitNumber").value="";document.getElementById("storeLimitNumber").value="";}else showToast("❌ فشل الحفظ","error");
};

/* ============================================
   Admin: Expired
   ============================================ */
window.openExpired=()=>{if(!isAdmin)return;accountOverlay.classList.add("hidden");expiredOverlay.classList.remove("hidden");renderExpiredList();};
async function autoDeleteOldExpired(){if(!isAdmin)return;try{const toDelete=allPosts.filter(p=>expiredGracePassed(p));if(toDelete.length===0)return;let ok=0;for(const p of toDelete){try{await deleteDoc(doc(db,"posts",p.id));allPosts=allPosts.filter(x=>x.id!==p.id);ok++;}catch(e){}}if(ok>0)renderPosts();}catch(e){}}
function renderExpiredList(){
  const list=document.getElementById("expiredList");if(!list)return;
  const expired=allPosts.filter(p=>isExpired(p));
  if(expired.length===0){list.innerHTML="<div class='reportsEmpty'>✅ لا توجد إعلانات منتهية</div>";return;}
  expired.sort((a,b)=>(getExpiresAt(a)||0)-(getExpiresAt(b)||0));
  const toolbar=`<div style="background:#fdeceb;border:1px solid #e5484d;border-radius:12px;padding:12px;margin-bottom:12px"><div style="font-weight:800;color:#b91c1c;margin-bottom:10px;font-size:14px">⏰ يوجد ${expired.length} إعلان منتهي</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button onclick="deleteAllExpired()" style="padding:11px;border:none;border-radius:10px;background:#e5484d;color:#fff;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer">🗑️ حذف الكل</button><button onclick="deleteAutoReadyExpired()" style="padding:11px;border:none;border-radius:10px;background:#8a93a3;color:#fff;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer">⏰ حذف 7+ أيام</button></div></div>`;
  const items=expired.map(p=>{
    const days=daysLeft(p);const sinceExpired=Math.abs(days);const autoReady=expiredGracePassed(p);
    const imgs=getImages(p);const th=imgs[0]||"";
    const owner=p.storeId?(p.storeName||"متجر"):(p.sellerName||"بائع");
    return `<div style="border:2px solid ${autoReady?'#e5484d':'#f59e0b'};border-radius:12px;padding:10px;margin-bottom:10px;background:${autoReady?'#fdeceb':'#fffbf0'};display:flex;gap:10px;align-items:center"><div style="width:60px;height:60px;border-radius:10px;overflow:hidden;background:var(--teal-light);flex:0 0 auto">${th?`<img src="${escapeHtml(th)}" style="width:100%;height:100%;object-fit:cover">`:""}</div><div style="flex:1;min-width:0"><div style="font-weight:800;font-size:13.5px;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(p.title||"بدون عنوان")}</div><div style="font-size:11px;color:var(--muted);line-height:1.6">👤 ${escapeHtml(owner)}<br>⏰ ${sinceExpired} يوم مضى</div></div><button onclick="deleteExpiredPost('${p.id}')" style="padding:8px 10px;border:none;border-radius:8px;background:#e5484d;color:#fff;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer">🗑️</button></div>`;
  }).join("");
  list.innerHTML=toolbar+items;
}
window.deleteExpiredPost=async(id)=>{
  if(!isAdmin)return;
  const ok=await showConfirmModal("حذف هذا الإعلان المنتهي نهائياً؟", { isDanger: true, confirmText: "نعم، حذف" });
  if(!ok) return;
  try{
    await deleteDoc(doc(db,"posts",id));
    allPosts=allPosts.filter(x=>x.id!==id);
    renderPosts();
    renderExpiredList();
    showToast("✅ تم الحذف بنجاح","success");
  }catch(e){showToast("خطأ: "+e.message,"error");}
};
window.deleteAllExpired=async()=>{
  if(!isAdmin)return;
  const expired=allPosts.filter(p=>isExpired(p));
  if(expired.length===0){showToast("لا توجد إعلانات منتهية","info");return;}
  const ok=await showConfirmModal(`هل أنت متأكد من حذف كافة الإعلانات المنتهية (${expired.length}) نهائياً؟`, { isDanger: true, confirmText: "حذف الكل" });
  if(!ok) return;
  let okP=0;
  for(const p of expired){
    try{
      await deleteDoc(doc(db,"posts",p.id));
      allPosts=allPosts.filter(x=>x.id!==p.id);
      okP++;
    }catch(e){}
  }
  renderPosts();
  showToast(`✅ تم حذف ${okP} إعلان منتهي`,"success");
  renderExpiredList();
};
window.deleteAutoReadyExpired=async()=>{
  if(!isAdmin)return;
  const ready=allPosts.filter(p=>expiredGracePassed(p));
  if(ready.length===0){showToast("لا توجد إعلانات مؤهلة للحذف التلقائي","info");return;}
  const ok=await showConfirmModal(`حذف ${ready.length} إعلان منتهي تجاوزت فترة السماح (7+ أيام)؟`, { isDanger: true, confirmText: "حذف" });
  if(!ok) return;
  let okP=0;
  for(const p of ready){
    try{
      await deleteDoc(doc(db,"posts",p.id));
      allPosts=allPosts.filter(x=>x.id!==p.id);
      okP++;
    }catch(e){}
  }
  renderPosts();
  showToast(`✅ تم حذف ${okP} إعلان`,"success");
  renderExpiredList();
};

/* ============================================
   Upgrade + Dashboard
   ============================================ */
window.openUpgrade=(id)=>{if(!auth.currentUser)return;postOverlay.classList.add("hidden");upgradeOverlay.classList.remove("hidden");window._upgradePostId=id;};
window.selectPlan=(days,label,price)=>{const id=window._upgradePostId;const p=allPosts.find(x=>x.id===id);if(!p)return;const link=`${window.location.origin}${window.location.pathname}#post-${id}?plan=${days}&price=${price}`;const msg=`🛒 طلب ترقية إعلان\n\n📌 الإعلان: ${p.title||'بدون عنوان'}\n📦 الباقة: ${label}\n💵 المبلغ: ${price} د.ل\n🔗 الرابط: ${link}`;const waUrl=`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`;window.open(waUrl,'_blank');setTimeout(()=>{closeOverlay();showToast("✅ بعد الدفع، اضغط الرابط","info");},400);};
function tryApplyPendingUpgrade(){
  if(!pendingAutoUpgrade)return;
  if(!isAdmin)return;
  const d=pendingAutoUpgrade;
  pendingAutoUpgrade=null;
  setTimeout(async()=>{
    const p=allPosts.find(x=>x.id===d.postId);
    if(!p){
      showToast("⚠️ الإعلان غير موجود","warn");
      history.replaceState(null,'',window.location.pathname);
      return;
    }
    const cm=`⭐ تفعيل ترقية الإعلان\n\n📌 ${p.title}\n📦 ${d.days} يوم\n💵 ${d.price} د.ل\n\nهل تأكدت من استلام المبلغ؟`;
    const ok = await showConfirmModal(cm, { confirmText: "نعم، تفعيل الترقية" });
    if(ok){
      adminFeature(d.postId,d.days);
    }
    history.replaceState(null,'',window.location.pathname);
  },1200);
}

window.openSendNotification=()=>{
  if(!isAdmin)return;
  document.getElementById("notifTitle").value="";
  document.getElementById("notifMessage").value="";
  document.getElementById("notifLink").value="";
  document.getElementById("sendNotifOverlay").classList.remove("hidden");
  accountOverlay.classList.add("hidden");
};

window.submitNotification=async()=>{
  if(!isAdmin)return;
  const title=document.getElementById("notifTitle").value.trim();
  const message=document.getElementById("notifMessage").value.trim();
  const link=document.getElementById("notifLink").value.trim();
  if(!title||!message){showToast("⚠️ اكتب العنوان والرسالة","warn");return;}
  const btn=document.getElementById("notifSendBtn");
  btn.disabled=true;btn.textContent="⏳ جاري الإرسال...";
  try{
    await addDoc(collection(db,"app_notifications"),{
      title:title,
      message:message,
      link:link,
      createdAt:Date.now(),
      createdBy:auth.currentUser.email
    });
    showToast("✅ تم إرسال الإشعار للمستخدمين بنجاح","success");
    closeOverlay();
  }catch(e){showToast("❌ خطأ: "+e.message,"error");}
  finally{btn.disabled=false;btn.textContent="📤 إرسال الإشعار الآن";}
};

  window.openDashboard=async()=>{
  if(!isAdmin)return;
  const box=document.getElementById("dashboardContent");
  box.innerHTML='<div class="reportsEmpty">جاري التحميل...</div>';
  document.getElementById("dashboardOverlay").classList.remove("hidden");
  accountOverlay.classList.add("hidden");
  try{
    const totalPosts=allPosts.length;
    const approved=allPosts.filter(p=>getStatus(p)==="approved").length;
    const pending=allPosts.filter(p=>getStatus(p)==="pending").length;
    const rejected=allPosts.filter(p=>getStatus(p)==="rejected").length;
    const soldCount=allPosts.filter(p=>p.sold).length;
    const expiredCount=allPosts.filter(p=>isExpired(p)).length;
    const featuredCount=allPosts.filter(p=>isPostFeatured(p)).length;
    const totalViews=allPosts.reduce((s,p)=>s+(p.views||0),0);
    const totalWa=allPosts.reduce((s,p)=>s+(p.whatsappClicks||0),0);
    const totalFavs=allPosts.reduce((s,p)=>s+(p.favoritesCount||0),0);
    const totalStores=allStores.length;
    const approvedStores=allStores.filter(s=>s.status==="approved").length;
    const pendingStores=allStores.filter(s=>s.status==="pending").length;
    const verifiedStores=allStores.filter(s=>s.verified).length;
    const totalReports=allReports.length;
    const cityCount={};
    allPosts.filter(p=>getStatus(p)==="approved").forEach(p=>{if(p.city)cityCount[p.city]=(cityCount[p.city]||0)+1;});
    const topCities=Object.entries(cityCount).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const catCount={};
    allPosts.filter(p=>getStatus(p)==="approved").forEach(p=>{if(p.category)catCount[p.category]=(catCount[p.category]||0)+1;});
    const topCats=Object.entries(catCount).sort((a,b)=>b[1]-a[1]).slice(0,5);
    box.innerHTML=`
      <div class="dashboardGrid">
        <div class="dashboardCard"><div class="dVal">${totalPosts}</div><div class="dLbl">📋 إجمالي الإعلانات</div></div>
        <div class="dashboardCard"><div class="dVal">${approved}</div><div class="dLbl">✅ معتمدة</div></div>
        <div class="dashboardCard"><div class="dVal">${pending}</div><div class="dLbl">⏳ قيد المراجعة</div></div>
        <div class="dashboardCard"><div class="dVal">${rejected}</div><div class="dLbl">❌ مرفوضة</div></div>
        <div class="dashboardCard"><div class="dVal">${soldCount}</div><div class="dLbl">💰 تم البيع</div></div>
        <div class="dashboardCard"><div class="dVal">${expiredCount}</div><div class="dLbl">⏰ منتهية</div></div>
        <div class="dashboardCard"><div class="dVal">${featuredCount}</div><div class="dLbl">⭐ مميزة</div></div>
        <div class="dashboardCard"><div class="dVal">${totalStores}</div><div class="dLbl">🏪 المتاجر</div></div>
        <div class="dashboardCard"><div class="dVal">${approvedStores}</div><div class="dLbl">✅ متاجر معتمدة</div></div>
        <div class="dashboardCard"><div class="dVal">${pendingStores}</div><div class="dLbl">⏳ متاجر معلقة</div></div>
        <div class="dashboardCard"><div class="dVal">${verifiedStores}</div><div class="dLbl">✓ متاجر موثقة</div></div>
        <div class="dashboardCard"><div class="dVal">${totalReports}</div><div class="dLbl">🚩 الإبلاغات</div></div>
        <div class="dashboardCard"><div class="dVal">${totalViews.toLocaleString()}</div><div class="dLbl">👁️ إجمالي المشاهدات</div></div>
        <div class="dashboardCard"><div class="dVal">${totalWa.toLocaleString()}</div><div class="dLbl">📱 ضغطات واتساب</div></div>
        <div class="dashboardCard"><div class="dVal">${totalFavs.toLocaleString()}</div><div class="dLbl">❤️ إجمالي المفضلة</div></div>
      </div>
      <div style="font-weight:800;margin:16px 0 8px;font-size:14px">📍 أكثر المدن نشاطاً</div>
      ${topCities.length?topCities.map(([c,n])=>`<div class="dashList"><span>${escapeHtml(c)}</span><b>${n} إعلان</b></div>`).join(""):'<div class="dashList"><span>لا توجد بيانات</span></div>'}
      <div style="font-weight:800;margin:16px 0 8px;font-size:14px">📁 أكثر الأقسام</div>
      ${topCats.length?topCats.map(([c,n])=>`<div class="dashList"><span>${escapeHtml(c)}</span><b>${n} إعلان</b></div>`).join(""):'<div class="dashList"><span>لا توجد بيانات</span></div>'}
    `;
  }catch(e){
    box.innerHTML=`<div class="reportsEmpty">❌ خطأ: ${escapeHtml(e.message)}</div>`;
  }
};

/* ============================================
   السلة الكاملة
   ============================================ */
function canHaveCart(post){if(!post)return false;if(!post.storeId)return false;if(post.category==="سيارات ومركبات")return false;if(post.category==="دراجات نارية")return false;return CART_ALLOWED_CATEGORIES.includes(post.category);}
window.openCart=(skipHistory)=>{
  const fab=document.getElementById("cartFAB");
  if(fab)fab.classList.add("fabOff");
  renderCartUI();
  cartOverlay.classList.remove("hidden");
  if(!skipHistory) pushNavState({ screen: 'cart' }, '#cart');
};
function renderCartUI(){
  const box=document.getElementById("cartItemsBox");
  const storeLine=document.getElementById("cartStoreLine");
  const storeNameEl=document.getElementById("cartStoreName");
  const totalBox=document.getElementById("cartTotalBox");
  const totalEl=document.getElementById("cartTotal");
  const itemsCountEl=document.getElementById("cartItemsCount");
  const sendBtn=document.getElementById("cartSendBtn");
  const callBtn=document.getElementById("cartCallBtn");
  const sendRestBtn=document.getElementById("cartSendRestBtn");
  const restOptionsBox=document.getElementById("cartRestaurantOptions");
  const clearBtn=document.getElementById("cartClearBtn");
  if(!box)return;
  if(cart.items.length===0){
    if(storeLine)storeLine.style.display="none";
    box.innerHTML=`<div class="cartEmptyBox"><div class="icon">🛒</div><div style="font-weight:700;font-size:15px">سلتك فاضية</div><div style="font-size:12.5px;margin-top:6px">أضف منتجات من أي متجر لتظهر هنا</div></div>`;
    if(totalBox)totalBox.style.display="none";
    if(sendBtn)sendBtn.classList.add("hidden");
    if(callBtn)callBtn.classList.add("hidden");
    if(sendRestBtn)sendRestBtn.classList.add("hidden");
    if(restOptionsBox)restOptionsBox.style.display="none";
    if(clearBtn)clearBtn.classList.add("hidden");
    return;
  }
  const store=allStores.find(s=>s.id===cart.storeId);
  const isRestaurant=isRestaurantStore(store)||Boolean(store&&isRestaurantCategory(store.category));
  if(storeLine){storeLine.style.display="flex";storeLine.classList.toggle("restaurant",isRestaurant);}
  if(storeNameEl)storeNameEl.textContent=(isRestaurant?"🍽️ ":"🏪 ")+(cart.storeName||"");
  box.innerHTML=cart.items.map(item=>{
    const qty=item.qty||1;
    return `<div class="cartItemRow"><img class="cImg" src="${escapeHtml(item.image||"")}" onerror="this.style.background='#e6f6fe';this.src=''"><div class="cInfo"><div class="cTitle">${escapeHtml(item.title||"منتج")}</div><div class="cPrice">${formatPrice(item.price||0)} د.ل</div><div class="cartQtyRow"><button class="qtyBtn" onclick="changeQty('${item.postId}',-1)" ${qty<=1?"disabled":""}>−</button><span class="qtyVal">${qty}</span><button class="qtyBtn" onclick="changeQty('${item.postId}',1)">+</button></div></div><button class="cRemove" onclick="removeFromCart('${item.postId}')">🗑️</button></div>`;
  }).join("");
  const total=cartTotalPrice();const cnt=cartTotalCount();
  if(totalBox)totalBox.style.display="flex";
  if(totalEl)totalEl.textContent=formatPrice(total)+" د.ل";
  if(itemsCountEl)itemsCountEl.textContent=`(${cnt} ${isRestaurant?'وجبة':'قطعة'})`;
  if(isRestaurant){
    if(restOptionsBox)restOptionsBox.style.display="block";
    const nameInput=document.getElementById("restCustName");
    if(nameInput && !nameInput.value){nameInput.value=(myProfile&&myProfile.name)||auth.currentUser?.displayName||"";}
    const phoneInput=document.getElementById("restCustPhone");
    if(phoneInput && !phoneInput.value){phoneInput.value=(myProfile&&myProfile.phone)?formatCallPhone(myProfile.phone):"";}
    if(sendRestBtn)sendRestBtn.classList.remove("hidden");
    if(callBtn)callBtn.classList.remove("hidden");
    if(sendBtn)sendBtn.classList.add("hidden");
    if(typeof updateCartWalletBalance === "function") updateCartWalletBalance();
  }else{
    if(restOptionsBox)restOptionsBox.style.display="none";
    if(sendRestBtn)sendRestBtn.classList.add("hidden");
    if(sendBtn)sendBtn.classList.remove("hidden");
    if(callBtn)callBtn.classList.add("hidden");
  }
  if(clearBtn)clearBtn.classList.remove("hidden");
}
window.addToCart=async(postId,event)=>{
  if(event)event.stopPropagation();
  const p=allPosts.find(x=>x.id===postId);
  if(!p)return;
  if(!p.storeId){showToast("⚠️ السلة متاحة فقط لمنتجات المتاجر والمطاعم","warn");return;}
  if(p.category==="سيارات ومركبات" || p.category==="دراجات نارية"){showToast("⚠️ السيارات والدراجات النارية لا تدخل السلة","warn");return;}
  if(p.sold){showToast("⚠️ هذا الصنف تم بيعه أو غير متوفر","warn");return;}
  const store=allStores.find(s=>s.id===p.storeId);
  const isRestaurant=isRestaurantStore(store)||isRestaurantCategory(p.category);
  const storeName=p.storeName||(store?store.name:(isRestaurant?"مطعم":"متجر"));
  if(cart.storeId && cart.storeId!==p.storeId && cart.items.length>0){
    const confirmed = await showConfirmModal(`⚠️ سلتك تحتوي على أصناف من "${cart.storeName}".\n\nلإضافة صنف من متجر آخر، يجب إفراغ السلة أولاً. هل تريد إفراغها والبدء من جديد؟`, { isDanger: true, confirmText: "إفراغ والبدء" });
    if(!confirmed) return;
    cart.items=[];
  }
  cart.storeId=p.storeId;
  cart.storeName=storeName;
  cart.storePhone=(store?(store.phone||store.storePhone):p.phone)||p.phone||"";
  const existing=cart.items.find(i=>i.postId===postId);
  if(existing){
    if((existing.qty || 1) >= 50){
      showToast("⚠️ الحد الأقصى للطلب هو 50 قطعة","warn");
      return;
    }
    existing.qty=(existing.qty||1)+1;
  }
  else{const imgs=getImages(p);cart.items.push({postId:p.id,title:p.title||"",price:Number(p.price)||0,image:imgs[0]||"",qty:1});}
  saveCart();updateCartUI();renderCartUI();
  if(typeof renderStoreProducts==='function') renderStoreProducts();
  showToast(`🛒 أُضيف: ${p.title||"الصنف"}`,"success",1400);
};
window.removeFromCart=(postId)=>{
  cart.items=cart.items.filter(i=>i.postId!==postId);
  if(cart.items.length===0){cart.storeId=null;cart.storeName="";cart.storePhone="";}
  saveCart();updateCartUI();renderCartUI();
  if(typeof renderStoreProducts==='function') renderStoreProducts();
};
window.changeQty=(postId,delta)=>{
  const item=cart.items.find(i=>i.postId===postId);
  if(!item)return;
  const newQty=(item.qty||1)+delta;
  if(newQty<1)return;
  if(newQty>50){
    showToast("⚠️ الحد الأقصى للطلب هو 50 قطعة","warn");
    return;
  }
  item.qty=newQty;
  saveCart();updateCartUI();renderCartUI();
  if(typeof renderStoreProducts==='function') renderStoreProducts();
};
window.clearCart=async()=>{
  if(cart.items.length===0)return;
  const confirmed = await showConfirmModal("هل أنت متأكد من إفراغ السلة بالكامل؟", { isDanger: true, confirmText: "إفراغ السلة" });
  if(!confirmed) return;
  cart={storeId:null,storeName:"",storePhone:"",items:[]};
  saveCart();updateCartUI();renderCartUI();
  if(typeof renderStoreProducts==='function') renderStoreProducts();
};
window.sendCartToWhats=()=>{
  if(cart.items.length===0){showToast("السلة فاضية!","warn");return;}
  if(!cart.storePhone){showToast("⚠️ لا يوجد رقم هاتف للمتجر","warn");return;}
  const store=allStores.find(s=>s.id===cart.storeId);
  const isRestaurant=isRestaurantStore(store);
  const phone=cart.storePhone.replace(/[^0-9]/g,"");
  const total=cartTotalPrice();
  const cnt=cartTotalItemsCount();
  if(isRestaurant){
    let lines=cart.items.map((item,i)=>{const qty=item.qty||1;const sub=(item.price||0)*qty;return `${i+1}. ${item.title} × ${qty} = ${formatPrice(sub)} د.ل`;}).join("\n");
    alert(`📞 اتصل بالمطعم واطلب:\n\n${lines}\n\n━━━━━━━━━━━━━\n💰 المجموع: ${formatPrice(total)} د.ل\n📦 ${cnt} قطعة\n\nسيتم فتح الاتصال الآن...`);
    window.location.href=`tel:${formatCallPhone(phone)}`;
    return;
  }
  let lines=cart.items.map((item,i)=>{const qty=item.qty||1;const sub=(item.price||0)*qty;return `${i+1}. ${item.title}\n   💰 ${formatPrice(item.price)} د.ل × ${qty} = ${formatPrice(sub)} د.ل`;}).join("\n\n");
  const msg=`السلام عليكم 👋\n\nشفت منتجاتك على موقع "تسوق الآن" وأنا مهتم بـ:\n\n${lines}\n\n━━━━━━━━━━━━━\n💰 المجموع: ${formatPrice(total)} د.ل\n📦 عدد القطع: ${cnt}\n\nهل ممكن نتفق؟`;
  const url=`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  window.open(url,"_blank");
};
window.sendCartToCall=()=>{
  if(cart.items.length===0){showToast("السلة فاضية!","warn");return;}
  if(!cart.storePhone){showToast("⚠️ لا يوجد رقم هاتف للمطعم","warn");return;}
  const phone=cart.storePhone.replace(/[^0-9]/g,"");
  const total=cartTotalPrice();
  const cnt=cartTotalItemsCount();
  let lines=cart.items.map((item,i)=>{const qty=item.qty||1;const sub=(item.price||0)*qty;return `${i+1}. ${item.title} × ${qty} = ${formatPrice(sub)} د.ل`;}).join("\n");
  alert(`📞 اتصل بالمطعم واطلب:\n\n${lines}\n\n━━━━━━━━━━━━━\n💰 المجموع: ${formatPrice(total)} د.ل\n📦 ${cnt} قطعة\n\nسيتم فتح الاتصال الآن...`);
  window.location.href=`tel:${formatCallPhone(phone)}`;
};

/* =====================================================
   منظومة طلبات المطاعم الحية (لوحة الكاشير + تتبع الزبون بالعداد الآلي)
   ===================================================== */

// نغمة رنين المطعم والزبون باستخدام Web Audio الأصلي (Singleton Context لمنع استنزاف الموارد)
let _sharedAudioCtx = null;
function getSharedAudioCtx(){
  try{
    if(!_sharedAudioCtx){
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if(AudioCtxClass) _sharedAudioCtx = new AudioCtxClass();
    }
    if(_sharedAudioCtx && _sharedAudioCtx.state === 'suspended'){
      _sharedAudioCtx.resume().catch(()=>{});
    }
    return _sharedAudioCtx;
  }catch(e){
    return null;
  }
}

function playRestaurantBell(type='new_order'){
  try{
    const ctx = getSharedAudioCtx();
    if(!ctx) return;
    const now=ctx.currentTime;
    if(type==='new_order'){
      const osc1=ctx.createOscillator();const gain1=ctx.createGain();
      osc1.type='sine';osc1.frequency.setValueAtTime(587.33,now);
      osc1.frequency.exponentialRampToValueAtTime(880,now+0.15);
      gain1.gain.setValueAtTime(0.4,now);gain1.gain.exponentialRampToValueAtTime(0.01,now+0.8);
      osc1.connect(gain1);gain1.connect(ctx.destination);
      osc1.start(now);osc1.stop(now+0.8);
      const osc2=ctx.createOscillator();const gain2=ctx.createGain();
      osc2.type='triangle';osc2.frequency.setValueAtTime(1046.50,now+0.2);
      gain2.gain.setValueAtTime(0.35,now+0.2);gain2.gain.exponentialRampToValueAtTime(0.01,now+1.1);
      osc2.connect(gain2);gain2.connect(ctx.destination);
      osc2.start(now+0.2);osc2.stop(now+1.1);
    }else if(type==='ready'){
      [523.25,659.25,783.99,1046.50].forEach((freq,i)=>{
        const osc=ctx.createOscillator();const gain=ctx.createGain();
        osc.type='sine';osc.frequency.setValueAtTime(freq,now+i*0.1);
        gain.gain.setValueAtTime(0.3,now+i*0.1);gain.gain.exponentialRampToValueAtTime(0.01,now+i*0.1+0.5);
        osc.connect(gain);gain.connect(ctx.destination);
        osc.start(now+i*0.1);osc.stop(now+i*0.1+0.5);
      });
    }
  }catch(e){console.warn("Audio bell error:",e);}
}
window.playRestaurantBell=playRestaurantBell;

window.toggleRestDeliveryFields=()=>{
  const val=document.querySelector('input[name="restDeliveryType"]:checked')?.value||"pickup";
  const box=document.getElementById("restDeliveryAddressBox");
  const pLbl=document.getElementById("lblPickup");
  const dLbl=document.getElementById("lblDelivery");
  if(val==="delivery"){
    if(box)box.style.display="block";
    if(dLbl){dLbl.style.borderColor="var(--teal)";dLbl.style.borderWidth="2px";}
    if(pLbl){pLbl.style.borderColor="var(--border)";pLbl.style.borderWidth="1px";}
  }else{
    if(box)box.style.display="none";
    if(pLbl){pLbl.style.borderColor="var(--teal)";pLbl.style.borderWidth="2px";}
    if(dLbl){dLbl.style.borderColor="var(--border)";dLbl.style.borderWidth="1px";}
  }
};

// إرسال الطلبية للكاشير مباشرة
window.submitRestaurantDirectOrder=async()=>{
  if(cart.items.length===0){showToast("السلة فاضية!","warn");return;}
  const custName=(document.getElementById("restCustName")?.value||"").trim();
  const custPhone=(document.getElementById("restCustPhone")?.value||"").trim();
  const deliveryType=document.querySelector('input[name="restDeliveryType"]:checked')?.value||"pickup";
  const address=(document.getElementById("restCustAddress")?.value||"").trim();
  const notes=(document.getElementById("restCustNotes")?.value||"").trim();
  const paymentMethod=document.querySelector('input[name="restPaymentMethod"]:checked')?.value||"cash";

  if(!custName){showToast("⚠️ يرجى كتابة اسمك الكريم","warn");return;}
  if(!custPhone || custPhone.replace(/[^0-9]/g,"").length < 9){showToast("⚠️ يرجى كتابة رقم هاتف صحيح للتواصل","warn");return;}
  if(deliveryType==="delivery" && !address){showToast("⚠️ يرجى كتابة عنوان التوصيل والحي","warn");return;}

  const btn=document.getElementById("cartSendRestBtn");
  if(btn){btn.disabled=true;btn.textContent="⏳ جاري إرسال الطلبية للكاشير...";}

  try{
    // التحقق من الأسعار ومطابقتها مع قاعدة بيانات المنتجات لمنع أي تلاعب محلي
    let computedTotal = 0;
    const sanitizedItems = cart.items.map(i => {
      const realPost = allPosts.find(p => p.id === i.postId);
      const realPrice = (realPost && typeof realPost.price === 'number') ? realPost.price : (Number(i.price) || 0);
      const safeQty = Math.max(1, parseInt(i.qty, 10) || 1);
      computedTotal += realPrice * safeQty;
      return {
        postId: i.postId,
        title: realPost ? realPost.title : i.title,
        price: realPrice,
        qty: safeQty
      };
    });
    const totalToPay = computedTotal > 0 ? computedTotal : cartTotalPrice();
    let walletDebitRes = null;

    if(paymentMethod === "wallet"){
      if(!auth.currentUser){
        showToast("⚠️ يرجى تسجيل الدخول أولاً للدفع من المحفظة الإلكترونية", "warn");
        if(btn){btn.disabled=false;btn.textContent="🚀 إرسال الطلبية للكاشير مباشرة";}
        authOverlay.classList.remove("hidden");
        return;
      }
      const myWal = await getUserWallet(auth.currentUser.uid);
      if(myWal.balance < totalToPay){
        showToast(`⚠️ رصيدك (${myWal.balance.toFixed(2)} د.ل) لا يكفي لإتمام الطلب (${totalToPay} د.ل). يرجى شحن الرصيد أولاً أو اختيار الدفع كاش`, "warn", 5000);
        if(btn){btn.disabled=false;btn.textContent="🚀 إرسال الطلبية للكاشير مباشرة";}
        return;
      }
      walletDebitRes = await debitUserWallet(
        auth.currentUser.uid,
        totalToPay,
        `دفع قيمة طلبية مطعم (${cart.storeName || "المطعم"})`,
        { storeId: cart.storeId, storeName: cart.storeName || "المطعم", txType: "order_payment" }
      );
      if(!walletDebitRes || !walletDebitRes.ok){
        showToast("❌ تعذر الخصم من المحفظة: " + (walletDebitRes?.error || "خطأ غير متوقع"), "error");
        if(btn){btn.disabled=false;btn.textContent="🚀 إرسال الطلبية للكاشير مباشرة";}
        return;
      }
    }

    const orderNum=Math.floor(100+Math.random()*900);
    const orderId='order_'+Date.now()+'_'+orderNum;
    const store=allStores.find(s=>s.id===cart.storeId);
    const orderData={
      orderId:orderId,
      orderNo:orderNum,
      storeId:cart.storeId,
      storeName:cart.storeName||(store?.name||"المطعم"),
      storePhone:cart.storePhone||store?.callPhone||store?.phone||"",
      customerUid:auth.currentUser?auth.currentUser.uid:("guest_"+Date.now()),
      customerName:custName,
      customerPhone:custPhone,
      deliveryType:deliveryType,
      deliveryAddress:address,
      notes:notes,
      items:sanitizedItems,
      totalPrice:totalToPay,
      totalCount:cartTotalCount(),
      paymentMethod:paymentMethod,
      isPaid:paymentMethod === "wallet",
      paidAmount:paymentMethod === "wallet" ? totalToPay : 0,
      walletTxId:walletDebitRes?.txId || null,
      isRefunded:false,
      status:'pending',
      prepMinutes:0,
      createdAt:Date.now(),
      acceptedAt:null,
      readyAt:null
    };

    const nowTs = Date.now();
    orderData.createdAt = nowTs;

    let orderSaved = false;
    if(window.supabase){
      try {
        const { error: sbErr } = await window.supabase.from("feedback").insert({
          id: orderId,
          type: "restaurant_order",
          uid: cart.storeId,
          user_name: orderData.customerName,
          user_phone: orderData.customerPhone,
          message: JSON.stringify(orderData),
          created_at: nowTs
        });
        if(!sbErr) orderSaved = true;
      } catch(e){
        console.warn("Supabase insert restaurant order error:", e);
      }
    }

    try {
      await setDoc(doc(db, "feedback", orderId), {
        id: orderId,
        type: "restaurant_order",
        uid: cart.storeId,
        user_name: orderData.customerName,
        user_phone: orderData.customerPhone,
        message: JSON.stringify(orderData),
        createdAt: nowTs
      });
      orderSaved = true;
    } catch(e){}

    if(!orderSaved && paymentMethod === "wallet" && auth.currentUser){
      await creditUserWallet(auth.currentUser.uid, totalToPay, "استرجاع تلقائي - تعذر إرسال الطلب");
      showToast("❌ تعذر إرسال الطلب للنظام، تم استرجاع الرصيد لمحفظتك فوراً", "error", 6000);
      if(btn){btn.disabled=false;btn.textContent="🚀 إرسال الطلبية للكاشير مباشرة";}
      return;
    }

    try{localStorage.setItem('tasawuq_active_order_id',orderId);}catch(e){}

    const sentStoreId = cart.storeId;
    if(restBroadcast){
      try {
        restBroadcast.postMessage({
          type: 'NEW_ORDER',
          storeId: sentStoreId,
          orderId: orderId,
          order: orderData
        });
      } catch(e){}
    }
    if(_rloStoreId && _rloStoreId === sentStoreId){
      refreshCashierOrders(false);
    }

    cart={storeId:null,storeName:"",storePhone:"",items:[]};
    saveCart();updateCartUI();renderCartUI();
    closeOverlayDirect();

    showToast("🎉 تم إرسال طلبيتك إلى كاشير المطعم بنجاح!","success",4000);
    openOrderTracker(orderId);
  }catch(e){
    // التراجع عن خصم المحفظة إذا فشل إنشاء الطلب في قاعدة البيانات لضمان عدم ضياع الأموال
    if(walletDebitRes && walletDebitRes.ok && auth.currentUser){
      try{
        await creditUserWallet(
          auth.currentUser.uid,
          totalToPay,
          `استرجاع تلقائي: تعذر إرسال الطلبية للكاشير`,
          { txType: "order_create_failed_refund" }
        );
      }catch(rollErr){ console.error("Wallet refund rollback error:", rollErr); }
    }
    showToast("خطأ أثناء إرسال الطلب: "+e.message,"error");
  }finally{
    if(btn){btn.disabled=false;btn.textContent="🚀 إرسال الطلبية للكاشير مباشرة";}
  }
};

// ============================================
// مزامنة فورية فائقة بين التبويبات والشاشات (Realtime Sync)
// ============================================
const restBroadcast = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('tasawuq_restaurant_live') : null;
if(restBroadcast){
  restBroadcast.onmessage = (ev) => {
    const data = ev.data;
    if(!data) return;
    if(data.type === 'NEW_ORDER'){
      if(_rloStoreId && _rloStoreId === data.storeId){
        refreshCashierOrders(false);
      }
    } else if(data.type === 'ORDER_UPDATED'){
      if(data.status === 'completed'){
        hideActiveOrderFloatingPill();
        try{ localStorage.removeItem('tasawuq_active_order_id'); }catch(e){}
        if(_orderCountdownTimer){ clearInterval(_orderCountdownTimer); _orderCountdownTimer = null; }
        if(_orderTrackerPollTimer){ clearInterval(_orderTrackerPollTimer); _orderTrackerPollTimer = null; }
      }
      if(_currentTrackingOrderId && _currentTrackingOrderId === data.orderId){
        refreshTrackingOrder(data.orderId);
      }
      if(_rloStoreId){
        refreshCashierOrders(false);
      }
    }
  };
}

if(typeof document !== 'undefined'){
  document.addEventListener("visibilitychange", () => {
    if(!document.hidden){
      if(_rloStoreId){
        const overlay = document.getElementById("restaurantCashierScreen") || document.getElementById("restaurantLiveOrdersOverlay");
        if(overlay && !overlay.classList.contains("hidden")) refreshCashierOrders(false);
      }
      if(_currentTrackingOrderId){
        refreshTrackingOrder(_currentTrackingOrderId);
      }
      if(window._activeChat){
        const chat = document.getElementById("userChatOverlay");
        if(chat && !chat.classList.contains("hidden")) loadChatMessages(window._activeChat.convId, true);
      }
      if(typeof updateGlobalUnreadChatCount === 'function') updateGlobalUnreadChatCount();
    }
  });
  window.addEventListener("focus", () => {
    if(_rloStoreId){
      const overlay = document.getElementById("restaurantCashierScreen") || document.getElementById("restaurantLiveOrdersOverlay");
      if(overlay && !overlay.classList.contains("hidden")) refreshCashierOrders(false);
    }
    if(_currentTrackingOrderId){
      refreshTrackingOrder(_currentTrackingOrderId);
    }
    if(window._activeChat){
      const chat = document.getElementById("userChatOverlay");
      if(chat && !chat.classList.contains("hidden")) loadChatMessages(window._activeChat.convId, true);
    }
  });
}

// شاشة تتبع الطلب للزبون (عداد تنازلي آلي وتحديث حي)
let _orderTrackerUnsub=null;
let _orderCountdownTimer=null;
let _orderTrackerPollTimer=null;
let _currentTrackingOrderId=null;
let _hasPlayedReadyBell=false;
let _lastTrackingStatus=null;

window.openActiveOrderTracker=()=>{
  let id=_currentTrackingOrderId;
  if(!id){try{id=localStorage.getItem('tasawuq_active_order_id');}catch(e){}}
  if(id)openOrderTracker(id);
};

window.openOrderTracker=(orderId)=>{
  _currentTrackingOrderId=orderId;
  _hasPlayedReadyBell=false;
  _lastTrackingStatus=null;
  const overlay=document.getElementById("orderTrackerOverlay");
  if(!overlay)return;
  closeOverlayDirect();
  overlay.classList.remove("hidden");

  if(_orderTrackerUnsub){_orderTrackerUnsub();_orderTrackerUnsub=null;}
  if(_orderCountdownTimer){clearInterval(_orderCountdownTimer);_orderCountdownTimer=null;}
  if(_orderTrackerPollTimer){clearInterval(_orderTrackerPollTimer);_orderTrackerPollTimer=null;}

  // جلب فوري لبيانات الطلبية
  refreshTrackingOrder(orderId);

  // تحديث دوري تلقائي كل 2.5 ثانية بدون الحاجة لتحديث الصفحة
  _orderTrackerPollTimer = setInterval(() => {
    if(!_currentTrackingOrderId){
      clearInterval(_orderTrackerPollTimer);
      _orderTrackerPollTimer = null;
      return;
    }
    refreshTrackingOrder(_currentTrackingOrderId);
  }, 2500);

  // مستمع احتياطي
  try{
    _orderTrackerUnsub=onSnapshot(doc(db,"feedback",orderId),(snap)=>{
      refreshTrackingOrder(orderId);
    },err=>{
      console.warn("Tracker listener error:",err);
    });
  }catch(e){}
};

window.refreshTrackingOrder=async(orderId)=>{
  if(!orderId) return;
  const refreshBtn = document.getElementById("trackerRefreshBtn");
  if(refreshBtn){
    refreshBtn.disabled = true;
    refreshBtn.textContent = "⏳...";
  }

  try {
    let row = null;
    if(window.supabase){
      const { data, error } = await window.supabase
        .from("feedback")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();
      if(!error && data) row = data;
    }
    if(!row){
      try {
        const snap = await getDoc(doc(db, "feedback", orderId));
        if(snap.exists()) row = { id: snap.id, ...snap.data() };
      } catch(e){}
    }

    if(!row){
      renderOrderTrackerUI(null, "❌ لم يتم العثور على الطلبية أو تم مسحها");
      return;
    }

    let order = null;
    try { order = JSON.parse(row.message || "{}"); } catch(e){}
    if(!order){
      renderOrderTrackerUI(null, "⚠️ خطأ في قراءة بيانات الطلبية");
      return;
    }

    if(_lastTrackingStatus === 'pending' && order.status === 'accepted'){
      showToast("🎉 قبل الكاشير طلبيتك! وجاري التحضير الآن", "success", 4000);
    }
    _lastTrackingStatus = order.status;

    if(order.status === 'completed'){
      hideActiveOrderFloatingPill();
      try { localStorage.removeItem('tasawuq_active_order_id'); } catch(e){}
      if(_orderCountdownTimer){ clearInterval(_orderCountdownTimer); _orderCountdownTimer = null; }
      if(_orderTrackerPollTimer){ clearInterval(_orderTrackerPollTimer); _orderTrackerPollTimer = null; }
    } else if(order.status === 'rejected'){
      hideActiveOrderFloatingPill();
      try { localStorage.removeItem('tasawuq_active_order_id'); } catch(e){}
      if(_orderTrackerPollTimer){ clearInterval(_orderTrackerPollTimer); _orderTrackerPollTimer = null; }
    }

    renderOrderTrackerUI(order);
  } catch(e){
    console.warn("Tracker refresh error:", e);
  } finally {
    if(refreshBtn){
      refreshBtn.disabled = false;
      refreshBtn.textContent = "🔄 تحديث";
    }
  }
};

function renderOrderTrackerUI(order,errorMsg){
  const box=document.getElementById("orderTrackerContent");
  if(!box)return;
  if(errorMsg){
    box.innerHTML=`<div class="reportsEmpty">${escapeHtml(errorMsg)}</div>`;
    return;
  }
  if(!order){
    box.innerHTML=`<div class="reportsEmpty">⏳ جاري تحميل بيانات الطلبية...</div>`;
    return;
  }

  const itemsHtml=order.items?.map(it=>`
    <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:13px;border-bottom:1px dashed var(--border)">
      <span>${escapeHtml(it.title)} × ${it.qty||1}</span>
      <b>${formatPrice((it.price||0)*(it.qty||1))} د.ل</b>
    </div>
  `).join("")||"";

  const isDelivery=order.deliveryType==="delivery";
  const deliveryBadge=isDelivery
    ? `<span style="background:#f0fdf4;color:#166534;padding:3px 9px;border-radius:8px;font-size:12px;font-weight:700;border:1px solid #bbf7d0">🛵 توصيل: ${escapeHtml(order.deliveryAddress||"")}</span>`
    : `<span style="background:#e0f2fe;color:#0369a1;padding:3px 9px;border-radius:8px;font-size:12px;font-weight:700;border:1px solid #bae6fd">🚗 سفري (استلام من الفرع)</span>`;

  let statusCardHtml='';

  if(order.status==='pending'){
    statusCardHtml=`
      <div style="background:#fef3c7;border:1.5px solid #f59e0b;border-radius:16px;padding:18px;text-align:center;margin-bottom:14px">
        <div style="font-size:36px;margin-bottom:6px">⏳</div>
        <div style="font-size:16px;font-weight:900;color:#92400e;margin-bottom:4px">بانتظار موافقة كاشير المطعم...</div>
        <div style="font-size:12.5px;color:#78350f;line-height:1.5">تم إرسال طلبيتك للكاشير بنجاح، ويقوم الآن بمراجعة المطبخ وتحديد وقت التجهيز.</div>
      </div>
    `;
    updateActiveOrderFloatingPill(order,'⏳ بانتظار الكاشير');
  }else if(order.status==='accepted'){
    statusCardHtml=`
      <div style="background:#f0fdf4;border:1.5px solid #22c55e;border-radius:16px;padding:18px;text-align:center;margin-bottom:14px">
        <div style="font-size:32px;margin-bottom:4px">🍳</div>
        <div style="font-size:16px;font-weight:900;color:#166534;margin-bottom:2px">تم قبول طلبيتك! قيد التحضير في المطبخ</div>
        <div style="font-size:12px;color:#15803d;margin-bottom:8px">الوقت المتبقي حتى تكون وجبتك جاهزة وساخنة:</div>
        <div class="rloCountdownBig" id="trackerCountdownDisplay">--:--</div>
        <div style="font-size:11.5px;color:var(--muted)">تتحول الشاشة تلقائياً بمجرد انتهاء الوقت</div>
      </div>
    `;
    startOrderCountdown(order.readyAt,order);
  }else if(order.status==='ready'){
    statusCardHtml=`
      <div style="background:#dcfce7;border:2px solid #16a34a;border-radius:16px;padding:20px;text-align:center;margin-bottom:14px;box-shadow:0 4px 14px rgba(22,163,74,0.15)">
        <div style="font-size:42px;margin-bottom:4px">🎉</div>
        <div style="font-size:18px;font-weight:900;color:#15803d;margin-bottom:6px">وجبتك جاهزة وساخنة الآن!</div>
        <div style="font-size:13.5px;color:#166534;line-height:1.6;font-weight:700;margin-bottom:12px">
          ${isDelivery ? '🛵 الوجبة تم تجهيزها وخرجت الآن مع سائق التوصيل إلى عنوانك!' : '🚗 تفضل بالتوجه لكاشير المطعم بالرقم <b>#'+order.orderNo+'</b> لاستلام وجبتك مباشرة.'}
        </div>
        <button class="btnMain" onclick="finishAndDismissActiveOrder(true)" style="padding:9px 16px;font-size:13px;font-weight:800;background:#15803d;margin-bottom:0">✔️ استلمت الوجبة (إنهاء التتبع وإغلاق العداد)</button>
      </div>
    `;
    if(!_hasPlayedReadyBell){
      playRestaurantBell('ready');
      _hasPlayedReadyBell=true;
    }
    updateActiveOrderFloatingPill(order,'🎉 وجبتك جاهزة الآن!');
  }else if(order.status==='completed'){
    statusCardHtml=`
      <div style="background:#f0fdf4;border:2px solid #22c55e;border-radius:16px;padding:22px;text-align:center;margin-bottom:14px;box-shadow:0 4px 14px rgba(34,197,94,0.15)">
        <div style="font-size:46px;margin-bottom:6px">✅</div>
        <div style="font-size:18px;font-weight:900;color:#15803d;margin-bottom:4px">تم استلام واكتمال الطلبية بنجاح</div>
        <div style="font-size:13px;color:#166534;margin-bottom:14px;font-weight:700">صحتين وهنا وعافية! نتمنى أن تكون الوجبة نالت إعجابك 😋</div>
        <button class="btnMain" onclick="finishAndDismissActiveOrder(false)" style="padding:10px 18px;font-weight:800;background:#16a34a;margin-bottom:0">إغلاق التتبع والعودة للموقع ✨</button>
      </div>
    `;
    hideActiveOrderFloatingPill();
    try { localStorage.removeItem('tasawuq_active_order_id'); } catch(e){}
    if(_orderCountdownTimer){ clearInterval(_orderCountdownTimer); _orderCountdownTimer=null; }
    if(_orderTrackerPollTimer){ clearInterval(_orderTrackerPollTimer); _orderTrackerPollTimer=null; }
  }else if(order.status==='rejected'){
    const refundNote = (order.paymentMethod==='wallet' && order.isRefunded)
      ? `<div style="margin-top:8px;font-size:12px;background:#f0fdf4;color:#166534;padding:6px 10px;border-radius:8px;font-weight:800;border:1px solid #bbf7d0">✅ تم استرجاع المبلغ (${formatPrice(order.totalPrice||0)} د.ل) تلقائياً إلى محفظتك الإلكترونية!</div>`
      : '';
    statusCardHtml=`
      <div style="background:#fef2f2;border:1.5px solid #ef4444;border-radius:16px;padding:18px;text-align:center;margin-bottom:14px">
        <div style="font-size:36px;margin-bottom:6px">❌</div>
        <div style="font-size:16px;font-weight:900;color:#991b1b;margin-bottom:4px">نعتذر منك، المطعم اعتذر عن الطلبية</div>
        <div style="font-size:12.5px;color:#b91c1c;line-height:1.5">نعتذر منك، المطعم حالياً مزدحم جداً أو الوجبة غير متوفرة.</div>
        ${refundNote}
      </div>
    `;
    hideActiveOrderFloatingPill();
    try { localStorage.removeItem('tasawuq_active_order_id'); } catch(e){}
  }

  const callBtn=order.storePhone?`<a href="tel:${formatCallPhone(order.storePhone)}" class="btnMain" style="background:#16a34a;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px;font-size:13.5px;font-weight:800;padding:11px;margin-top:10px">📞 اتصال بالمطعم للاستفسار (${escapeHtml(order.storePhone)})</a>`:'';

  const paymentMethodBadge = (order.paymentMethod === 'wallet')
    ? `<span style="color:#16a34a;font-weight:800">🟢 مدفوع مسبقاً بالمحفظة (خالص)</span>`
    : `<span style="color:#f59e0b;font-weight:800">💵 كاش عند الاستلام</span>`;

  box.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <div>
        <div style="font-size:16.5px;font-weight:900;color:var(--text)">${escapeHtml(order.storeName||"المطعم")}</div>
        <div style="font-size:12px;color:var(--muted)">رقم الطلب: <b style="color:var(--teal-dark)">#${order.orderNo}</b></div>
      </div>
      <div>${deliveryBadge}</div>
    </div>
    ${statusCardHtml}
    <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:12px;margin-bottom:10px">
      <div style="font-size:12.5px;font-weight:800;color:var(--muted);margin-bottom:6px">تفاصيل الوجبات:</div>
      ${itemsHtml}
      <div style="display:flex;justify-content:space-between;padding-top:8px;font-size:15px;font-weight:900;color:var(--text);margin-top:4px">
        <span>المجموع:</span>
        <span style="color:var(--teal-dark)">${formatPrice(order.totalPrice||0)} د.ل</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px;font-size:12px;font-weight:700;color:var(--muted);border-top:1px dashed var(--border);margin-top:6px">
        <span>طريقة الدفع:</span>
        ${paymentMethodBadge}
      </div>
      ${order.notes ? `<div style="font-size:12px;color:#92400e;background:#fef3c7;padding:6px 10px;border-radius:8px;margin-top:8px">📝 ملاحظاتك: ${escapeHtml(order.notes)}</div>` : ''}
    </div>
    ${callBtn}
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">
      ${(order.status==='pending'||order.status==='accepted') ? `
        <button type="button" class="btnMain" onclick="customerCancelOrder('${escapeHtml(order.orderId || _currentTrackingOrderId || '')}')" style="background:#fee2e2;color:#dc2626;border:1.5px solid #fca5a5;padding:11px;font-size:13.5px;font-weight:900;border-radius:12px;cursor:pointer;margin:0">
          ❌ إلغاء الطلبية وتصكيرها ${order.paymentMethod==='wallet' ? '(واسترجاع الرصيد للمحفظة فوراً)' : ''}
        </button>
      ` : ''}
      <div style="display:flex;gap:8px">
        <button type="button" class="btnGhost" onclick="closeOrderTracker()" style="flex:1;background:var(--bg);color:var(--text);border:1px solid var(--border);padding:10px;font-size:12.5px;font-weight:700;border-radius:10px;cursor:pointer">
          🔽 تصغير الشاشة
        </button>
        <button type="button" class="btnGhost" onclick="finishAndDismissActiveOrder(false)" style="flex:1;background:#f1f5f9;color:#475569;border:1px solid #cbd5e1;padding:10px;font-size:12.5px;font-weight:700;border-radius:10px;cursor:pointer">
          ✕ تصكير وإنهاء التتبع
        </button>
      </div>
    </div>
  `;
}

function startOrderCountdown(readyAt,order){
  if(_orderCountdownTimer) clearInterval(_orderCountdownTimer);
  const targetTime = Number(readyAt) || (Date.now() + 20 * 60 * 1000);

  function tick(){
    const now = Date.now();
    const diff = Math.max(0, Math.floor((targetTime - now) / 1000));
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    const str = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;

    const el = document.getElementById("trackerCountdownDisplay");
    if(el) el.textContent = str;

    updateActiveOrderFloatingPill(order, `🍳 متبقي: ${str}`);

    if(diff <= 0){
      clearInterval(_orderCountdownTimer);
      _orderCountdownTimer = null;
      order.status = 'ready';
      renderOrderTrackerUI(order);
    }
  }

  tick();
  _orderCountdownTimer = setInterval(tick, 1000);
}

window.finishAndDismissActiveOrder=async(markInDb=false)=>{
  const orderId = _currentTrackingOrderId || (function(){try{return localStorage.getItem('tasawuq_active_order_id');}catch(e){return null;}})();
  const overlay=document.getElementById("orderTrackerOverlay");
  if(overlay) overlay.classList.add("hidden");
  hideActiveOrderFloatingPill();

  try{ localStorage.removeItem('tasawuq_active_order_id'); }catch(e){}
  _currentTrackingOrderId=null;
  if(_orderCountdownTimer){ clearInterval(_orderCountdownTimer); _orderCountdownTimer=null; }
  if(_orderTrackerPollTimer){ clearInterval(_orderTrackerPollTimer); _orderTrackerPollTimer=null; }
  if(_orderTrackerUnsub){ _orderTrackerUnsub(); _orderTrackerUnsub=null; }

  if(markInDb && orderId){
    try{
      const snap=await getDoc(doc(db,"feedback",orderId));
      if(snap.exists()){
        const data=snap.data();
        let ord=JSON.parse(data.message||"{}");
        ord.status='completed';
        ord.completedAt=Date.now();
        await updateDoc(doc(db,"feedback",orderId),{message:JSON.stringify(ord)});
        if(restBroadcast){
          try{ restBroadcast.postMessage({ type: 'ORDER_UPDATED', orderId: orderId, status: 'completed' }); }catch(e){}
        }
      }
    }catch(e){}
  }
  showToast("تم إنهاء التتبع بنجاح ✅","info",2000);
};

window.customerCancelOrder = async (orderId) => {
  if(!orderId) orderId = _currentTrackingOrderId || (function(){try{return localStorage.getItem('tasawuq_active_order_id');}catch(e){return null;}})();
  if(!orderId) return;

  const ok = await showConfirmModal("هل أنت متأكد من رغبتك في إلغاء وتصكير هذه الطلبية؟", {
    icon: "⚠️",
    danger: true,
    confirmText: "نعم، إلغاء الطلبية",
    cancelText: "تراجع"
  });
  if(!ok) return;

  try {
    const order = await getRestaurantOrderFromDb(orderId);
    if(!order || order.status === 'completed'){
      showToast("⚠️ هذه الطلبية مكتملة بالفعل ولا يمكن إلغاؤها", "warn");
      return;
    }

    order.status = 'rejected';
    order.cancelReason = 'تم الإلغاء بواسطة الزبون';
    order.cancelledAt = Date.now();

    let refunded = false;
    if(order.paymentMethod === 'wallet' && order.isPaid && !order.isRefunded && auth.currentUser){
      try{
        if(typeof refundOrderToWallet === 'function'){
          const refRes = await refundOrderToWallet(auth.currentUser.uid, order.totalPrice, order.orderNo, order.storeName);
          if(refRes && refRes.ok){
            order.isRefunded = true;
            order.refundedAt = Date.now();
            refunded = true;
          }
        }
      }catch(err){ console.error("Refund on cancel error:", err); }
    }

    const docId = order._docId || orderId;
    await updateRestaurantOrderInDb(docId, order);

    if(restBroadcast){
      try{ restBroadcast.postMessage({ type: 'ORDER_UPDATED', orderId: docId, status: 'rejected' }); }catch(e){}
    }

    await finishAndDismissActiveOrder(false);
    showToast(`✅ تم إلغاء وتصكير الطلبية بنجاح${refunded ? ' وتم استرجاع المبلغ لمحفظتك' : ''}`, "success", 4000);
  } catch(e){
    showToast("خطأ أثناء إلغاء الطلبية: " + e.message, "error");
  }
};

window.checkActiveOrderSilently=async(orderId)=>{
  if(!orderId) return;
  try{
    let row=null;
    if(window.supabase){
      const { data } = await window.supabase.from("feedback").select("*").eq("id", orderId).maybeSingle();
      if(data) row=data;
    }
    if(!row){
      const snap=await getDoc(doc(db,"feedback",orderId));
      if(snap.exists()) row={ id: snap.id, ...snap.data() };
    }
    if(!row){
      try{ localStorage.removeItem('tasawuq_active_order_id'); }catch(e){}
      hideActiveOrderFloatingPill();
      return;
    }
    let order=null;
    try{ order=JSON.parse(row.message||"{}"); }catch(e){}
    if(!order || order.status==='completed' || order.status==='rejected'){
      try{ localStorage.removeItem('tasawuq_active_order_id'); }catch(e){}
      hideActiveOrderFloatingPill();
      return;
    }
    _currentTrackingOrderId = orderId;
    if(order.status==='pending'){
      updateActiveOrderFloatingPill(order,'⏳ بانتظار الكاشير');
    }else if(order.status==='accepted'){
      const minsLeft = Math.max(0, Math.ceil(((order.readyAt||0) - Date.now()) / 60000));
      updateActiveOrderFloatingPill(order, `🍳 متبقي ~${minsLeft} د`);
    }else if(order.status==='ready'){
      updateActiveOrderFloatingPill(order,'🎉 وجبتك جاهزة الآن!');
    }
  }catch(e){}
};

window.closeOrderTracker=()=>{
  const overlay=document.getElementById("orderTrackerOverlay");
  if(overlay) overlay.classList.add("hidden");
  // تحديث هادئ بالخلفية لضمان بقاء الزر العائم محدّثاً طالما أن الطلب قيد التحضير
  if(_orderTrackerPollTimer){
    clearInterval(_orderTrackerPollTimer);
    _orderTrackerPollTimer = setInterval(() => {
      if(!_currentTrackingOrderId || _lastTrackingStatus === 'completed' || _lastTrackingStatus === 'rejected'){
        clearInterval(_orderTrackerPollTimer);
        _orderTrackerPollTimer = null;
        hideActiveOrderFloatingPill();
        try{ localStorage.removeItem('tasawuq_active_order_id'); }catch(e){}
        return;
      }
      refreshTrackingOrder(_currentTrackingOrderId);
    }, 3500);
  }
};

function updateActiveOrderFloatingPill(order, statusText){
  const pill=document.getElementById("activeOrderFloatingPill");
  if(!pill)return;
  pill.innerHTML=`<span>🍽️</span><span>طلب #${order.orderNo}: ${statusText}</span><span style="font-size:15px">›</span>`;
  pill.classList.remove("hidden");
}

function hideActiveOrderFloatingPill(){
  const pill=document.getElementById("activeOrderFloatingPill");
  if(pill) pill.classList.add("hidden");
}

// ============================================
// لوحة كاشير المطعم المباشرة (Restaurant Live Orders)
// ============================================
let _rloStoreId=null;
let _rloUnsub=null;
let _rloPollTimer=null;
let _rloOrders=[];
let _rloActiveTab='pending';
let _cashierSoundEnabled=true;
let _lastPendingCount=0;
let _seenOrderIds=new Set();

window.toggleCashierSound=()=>{
  _cashierSoundEnabled=!_cashierSoundEnabled;
  const btn=document.getElementById("rloSoundToggle");
  if(btn) btn.textContent = _cashierSoundEnabled ? "🔔 رنين: مفعّل" : "🔕 رنين: صامت";
  if(_cashierSoundEnabled) playRestaurantBell('new_order');
};

let _cashierPreviousScreen = 'home';

window.openRestaurantLiveOrders=(storeId, skipHistory)=>{
  if(!storeId) storeId = 'doc_1792952590082_5d3t8gw';
  const store=allStores.find(s=>s.id===storeId) || { id: storeId, name: 'مطعم KSH' };
  const me=auth.currentUser;
  const isAdminUser=me && (me.email===ADMIN_EMAIL || isAdmin);
  const isOwnerStore=me && store && (me.uid===store.ownerUid || (isAdminUser && store.ownerUid?.startsWith('admin_client_')));
  const isHelper=me && isStoreHelper(storeId, me.email);

  if(!isOwnerStore && !isAdminUser && !isHelper){
    showToast("❌ لوحة الكاشير خاصة بصاحب المطعم أو عماله فقط","error");
    return;
  }

  // تسجيل الشاشة السابقة للرجوع إليها بسلاسة
  const accSc = document.getElementById("accountScreen");
  const stSc = document.getElementById("storeScreen");
  const stsSc = document.getElementById("storesScreen");
  if(accSc && !accSc.classList.contains("hidden")) _cashierPreviousScreen = 'account';
  else if(stSc && !stSc.classList.contains("hidden")) _cashierPreviousScreen = 'store';
  else if(stsSc && !stsSc.classList.contains("hidden")) _cashierPreviousScreen = 'stores';
  else _cashierPreviousScreen = 'home';

  _rloStoreId=storeId;
  _lastPendingCount=0;
  _seenOrderIds.clear();

  // إغلاق أي نوافذ منبثقة
  closeOverlayDirect();

  // إخفاء كافة الشاشات الأخرى لفتح صفحة الكاشير كاملة
  if(typeof categoriesScreen !== 'undefined' && categoriesScreen) categoriesScreen.classList.add("hidden");
  if(typeof home !== 'undefined' && home) home.classList.add("hidden");
  if(typeof form !== 'undefined' && form) form.classList.add("hidden");
  if(stsSc) stsSc.classList.add("hidden");
  if(stSc) stSc.classList.add("hidden");
  if(accSc) accSc.classList.add("hidden");
  const inSc = document.getElementById("inboxScreen"); if(inSc) inSc.classList.add("hidden");

  const screenEl=document.getElementById("restaurantCashierScreen") || document.getElementById("restaurantLiveOrdersOverlay");
  if(screenEl) screenEl.classList.remove("hidden");

  const titleEl=document.getElementById("rloStoreTitle");
  if(titleEl) titleEl.textContent = "طلبات: " + (store?.name || "المطعم");

  if(typeof hideFloatingButtons === 'function') hideFloatingButtons();
  window.scrollTo(0, 0);

  if(!skipHistory) pushNavState({ screen: 'cashier', storeId }, '#cashier-' + storeId);

  startRestaurantOrdersListener(storeId);
  switchRloTab('pending');
};

function closeRestaurantCashierDirect(){
  const screenEl=document.getElementById("restaurantCashierScreen") || document.getElementById("restaurantLiveOrdersOverlay");
  if(screenEl) screenEl.classList.add("hidden");
  if(_rloUnsub){_rloUnsub();_rloUnsub=null;}
  if(_rloPollTimer){clearInterval(_rloPollTimer);_rloPollTimer=null;}

  // العودة التلقائية للشاشة السابقة التي فُتح منها الكاشير
  if(_cashierPreviousScreen === 'account'){
    openAccount(true);
  } else if(_cashierPreviousScreen === 'store' && window._currentStoreId){
    openStore(window._currentStoreId, null, true);
  } else if(_cashierPreviousScreen === 'stores'){
    openStores(window._storesFilterMode || 'all', true);
  } else {
    showCategoriesScreenDirect();
  }
}
window.closeRestaurantCashierDirect = closeRestaurantCashierDirect;

window.closeRestaurantCashier = () => {
  if(!_isHistoryNavigating && window.history.state && window.history.state.screen === 'cashier'){
    window.history.back();
    return;
  }
  closeRestaurantCashierDirect();
};
window.closeRestaurantLiveOrders = window.closeRestaurantCashier;
window.backFromCashier = window.closeRestaurantCashier;

window.switchRloTab=(tab)=>{
  _rloActiveTab=tab;
  ['pending','active','done'].forEach(t=>{
    const b=document.getElementById('rloTab'+t.charAt(0).toUpperCase()+t.slice(1));
    if(b) b.classList.toggle('active', t===tab);
  });
  renderCashierOrdersList();
};

window.refreshCashierOrders=async(manual=false)=>{
  if(!_rloStoreId) return;
  const refreshBtn=document.getElementById("rloRefreshBtn");
  if(manual && refreshBtn){
    refreshBtn.disabled=true;
    refreshBtn.textContent="⏳...";
  }
  const statusEl=document.getElementById("rloLiveStatus");

  try{
    let rawList=[];
    if(window.supabase){
      try {
        const { data: dStore, error: eStore } = await window.supabase
          .from("feedback")
          .select("*")
          .eq("type", "restaurant_order")
          .eq("uid", _rloStoreId)
          .order("created_at", { ascending: false })
          .limit(100);
        if(!eStore && Array.isArray(dStore) && dStore.length > 0){
          rawList = dStore;
        } else {
          const { data: dAll, error: eAll } = await window.supabase
            .from("feedback")
            .select("*")
            .eq("type", "restaurant_order")
            .order("created_at", { ascending: false })
            .limit(200);
          if(!eAll && Array.isArray(dAll)) rawList = dAll;
        }
      } catch(sbErr){
        console.warn("Supabase cashier order query error:", sbErr);
      }
    }
    if(!rawList.length){
      try{
        const snap = await getDocs(query(collection(db, "feedback"), where("type", "==", "restaurant_order")));
        rawList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }catch(e){}
    }

    const matched=[];
    rawList.forEach(row=>{
      if(row.type === "restaurant_order"){
        let ord=null;
        try{ ord = typeof row.message === "object" ? row.message : JSON.parse(row.message || "{}"); }catch(e){}
        const matchesStore = (row.uid === _rloStoreId) || (ord && ord.storeId === _rloStoreId) || (typeof row.message === "string" && row.message.includes(`"storeId":"${_rloStoreId}"`));
        if(matchesStore && ord){
          ord._docId=row.id;
          matched.push(ord);
        }
      }
    });

    matched.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    _rloOrders = matched;

    const pendingList = _rloOrders.filter(o=>o.status==='pending');
    let hasBrandNewOrder=false;
    pendingList.forEach(o=>{
      const oid = o.orderId || o._docId;
      if(!_seenOrderIds.has(oid)){
        if(_seenOrderIds.size > 0){
          hasBrandNewOrder = true;
        }
        _seenOrderIds.add(oid);
      }
    });

    if(hasBrandNewOrder || (_lastPendingCount > 0 && pendingList.length > _lastPendingCount)){
      if(_cashierSoundEnabled) playRestaurantBell('new_order');
      showToast("🔔 طلبية جديدة وصلت للكاشير الآن!", "info", 4000);
    }
    _lastPendingCount = pendingList.length;

    updateCashierBadges();
    renderCashierOrdersList();

    if(statusEl){
      const nowStr = new Date().toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      statusEl.innerHTML = `<span class="liveDotIndicator"></span>متصل ومحدّث تلقائياً (${nowStr})`;
    }
    if(manual) showToast("تم تحديث قائمة الطلبات ✅","success",1500);
  }catch(e){
    console.warn("Cashier fetch error:", e);
    if(manual) showToast("تعذر التحديث: "+e.message,"error");
  }finally{
    if(manual && refreshBtn){
      refreshBtn.disabled=false;
      refreshBtn.textContent="🔄 تحديث";
    }
  }
};

function startRestaurantOrdersListener(storeId){
  if(_rloUnsub){_rloUnsub();_rloUnsub=null;}
  if(_rloPollTimer){clearInterval(_rloPollTimer);_rloPollTimer=null;}

  // جلب فوري
  refreshCashierOrders(false);

  // تحديث دوري مستمر فائق السرعة كل 2.5 ثانية بدون الحاجة لتحديث الصفحة
  _rloPollTimer = setInterval(() => {
    const overlay = document.getElementById("restaurantCashierScreen") || document.getElementById("restaurantLiveOrdersOverlay");
    if(overlay && !overlay.classList.contains("hidden")){
      refreshCashierOrders(false);
    } else {
      clearInterval(_rloPollTimer);
      _rloPollTimer = null;
    }
  }, 2500);

  // مستمع احتياطي
  try{
    _rloUnsub = onSnapshot(collection(db, "feedback"), () => {
      refreshCashierOrders(false);
    }, err => {
      console.warn("Cashier orders listener error:", err);
    });
  }catch(e){}
}

function updateCashierBadges(){
  const pending = _rloOrders.filter(o=>o.status==='pending');
  const active = _rloOrders.filter(o=>o.status==='accepted');

  const pBadge = document.getElementById("rloPendingBadge");
  if(pBadge){
    pBadge.textContent = pending.length;
    pBadge.style.display = pending.length > 0 ? "inline-block" : "none";
  }

  const aBadge = document.getElementById("rloActiveBadge");
  if(aBadge){
    aBadge.textContent = active.length;
    aBadge.style.display = active.length > 0 ? "inline-block" : "none";
  }
}

function renderCashierOrdersList(){
  const listEl=document.getElementById("rloOrdersList");
  if(!listEl)return;

  let filtered=[];
  if(_rloActiveTab==='pending') filtered=_rloOrders.filter(o=>o.status==='pending');
  else if(_rloActiveTab==='active') filtered=_rloOrders.filter(o=>o.status==='accepted');
  else filtered=_rloOrders.filter(o=>o.status==='ready'||o.status==='completed'||o.status==='rejected');

  if(filtered.length===0){
    const msg = _rloActiveTab==='pending' ? "لا توجد طلبات جديدة بانتظار القبول حالياً 🔔" : (_rloActiveTab==='active' ? "لا توجد طلبات قيد التحضير حالياً 🍳" : "لا توجد طلبات مكتملة بعد ✅");
    listEl.innerHTML=`<div class="reportsEmpty">${msg}</div>`;
    return;
  }

  listEl.innerHTML=filtered.map(order=>{
    const itemsHtml=order.items?.map(it=>`
      <div class="rloItemRow">
        <span style="font-weight:700">${escapeHtml(it.title)} × ${it.qty||1}</span>
        <b>${formatPrice((it.price||0)*(it.qty||1))} د.ل</b>
      </div>
    `).join("")||"";

    const isDelivery=order.deliveryType==="delivery";
    const deliveryTag=isDelivery
      ? `<span style="background:#f0fdf4;color:#166534;padding:3px 9px;border-radius:8px;font-size:12px;font-weight:800;border:1px solid #bbf7d0">🛵 توصيل: ${escapeHtml(order.deliveryAddress||"")}</span>`
      : `<span style="background:#e0f2fe;color:#0369a1;padding:3px 9px;border-radius:8px;font-size:12px;font-weight:800;border:1px solid #bae6fd">🚗 سفري (استلام من المحل)</span>`;

    let actionsHtml='';
    if(order.status==='pending'){
      actionsHtml=`
        <div style="margin-top:12px">
          <div style="font-size:12px;font-weight:800;color:var(--text);margin-bottom:6px">⏱️ حدد وقت التحضير لقبول الطلب:</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1.1fr 1fr;gap:6px">
            <button class="rloBtnTime" onclick="cashierAcceptOrder('${order._docId}', 15)">✅ 15 د</button>
            <button class="rloBtnTime" onclick="cashierAcceptOrder('${order._docId}', 25)">✅ 25 د</button>
            <button class="rloBtnTime" onclick="cashierAcceptOrder('${order._docId}', 40)">✅ 40 د</button>
            <button class="rloBtnTime" style="background:#0284c7" onclick="cashierCustomTimeOrder('${order._docId}')">⏱️ مخصص</button>
            <button class="rloBtnReject" onclick="cashierRejectOrder('${order._docId}')">❌ اعتذار</button>
          </div>
        </div>
      `;
    }else if(order.status==='accepted'){
      const minsLeft = Math.max(0, Math.ceil(((order.readyAt||0) - Date.now()) / 60000));
      actionsHtml=`
        <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;background:#f0fdf4;padding:10px 12px;border-radius:12px;border:1px solid #bbf7d0">
          <div>
            <div style="font-size:12px;color:#15803d;font-weight:700">قيد التحضير (متبقي ~${minsLeft} دقيقة)</div>
            <div style="font-size:11px;color:var(--muted)">تتحول تلقائياً إلى جاهزة عند انتهاء الوقت</div>
          </div>
          <button class="btnMain" style="background:#16a34a;padding:8px 14px;font-size:12.5px;margin-bottom:0" onclick="cashierMarkReady('${order._docId}')">وجبة جاهزة الآن ✅</button>
        </div>
      `;
    }else if(order.status==='ready'){
      actionsHtml=`
        <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center">
          <span style="color:#16a34a;font-weight:800;font-size:13px">🎉 الوجبة جاهزة وتم إشعار الزبون</span>
          <button class="btnGhost" style="padding:6px 10px;font-size:12px;color:var(--text);border:1px solid var(--border)" onclick="cashierCompleteOrder('${order._docId}')">تسليم وإغلاق الطلب ✔️</button>
        </div>
      `;
    }

    const paymentBadge = (order.paymentMethod === 'wallet' && order.isPaid)
      ? `<span style="background:#16a34a;color:#fff;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:800;margin-right:6px">🟢 مدفوع بالمحفظة (خالص)</span>`
      : `<span style="background:#f59e0b;color:#fff;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:800;margin-right:6px">💵 كاش عند الاستلام</span>`;

    return `
      <div class="restaurantOrderCard ${order.status==='pending'?'pending':''}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div>
            <span style="font-size:16px;font-weight:900;color:var(--text)">طلب #${order.orderNo}</span>
            ${paymentBadge}
            <span style="font-size:11.5px;color:var(--muted);margin-right:6px">🕒 ${timeAgo(order.createdAt)}</span>
          </div>
          <div>${deliveryTag}</div>
        </div>
        <div style="font-size:13.5px;font-weight:700;margin-bottom:8px;color:var(--text)">
          👤 الزبون: ${escapeHtml(order.customerName)} — <a href="tel:${formatCallPhone(order.customerPhone)}" style="color:#16a34a;text-decoration:none;font-weight:800">📞 ${escapeHtml(order.customerPhone)}</a>
        </div>
        <div style="background:var(--bg);padding:8px 12px;border-radius:10px;margin-bottom:8px">
          ${itemsHtml}
          <div style="display:flex;justify-content:space-between;padding-top:6px;font-size:14.5px;font-weight:900;margin-top:4px">
            <span>المجموع:</span>
            <span style="color:#16a34a">${formatPrice(order.totalPrice||0)} د.ل</span>
          </div>
        </div>
        ${order.notes ? `<div style="font-size:12px;color:#92400e;background:#fef3c7;padding:6px 10px;border-radius:8px;margin-bottom:8px">📝 ملاحظة: ${escapeHtml(order.notes)}</div>` : ''}
        ${actionsHtml}
      </div>
    `;
  }).join("");
}

async function getRestaurantOrderFromDb(docId){
  const cached = _rloOrders.find(o => o._docId === docId || o.orderId === docId);
  if(cached) return { ...cached };

  if(window.supabase){
    try {
      const { data } = await window.supabase.from("feedback").select("*").eq("id", docId).maybeSingle();
      if(data && data.message) {
        const ord = JSON.parse(data.message);
        ord._docId = data.id;
        return ord;
      }
    } catch(e){}
  }
  try {
    const snap = await getDoc(doc(db,"feedback",docId));
    if(snap.exists()){
      const ord = JSON.parse(snap.data().message || "{}");
      ord._docId = snap.id;
      return ord;
    }
  } catch(e){}
  return null;
}

async function updateRestaurantOrderInDb(docId, updatedOrder){
  const msgStr = JSON.stringify(updatedOrder);
  if(window.supabase){
    try {
      await window.supabase.from("feedback").update({ message: msgStr }).eq("id", docId);
    } catch(e){
      console.warn("Supabase order update err:", e);
    }
  }
  try {
    await setDoc(doc(db, "feedback", docId), {
      message: msgStr
    }, { merge: true });
  } catch(e){}
}

window.cashierAcceptOrder=async(docId, minutes)=>{
  try{
    const order = await getRestaurantOrderFromDb(docId);
    if(!order) return;
    if(_rloStoreId && order.storeId && order.storeId !== _rloStoreId && !isAdmin){
      showToast("❌ هذا الطلب يتبع متجراً آخر","error");
      return;
    }
    if(order.status === 'completed' || order.status === 'rejected'){
      showToast("⚠️ هذا الطلب مغلق بالفعل ولا يمكن قبوله مجدداً","warn");
      return;
    }
    const now=Date.now();
    order.status='accepted';
    order.prepMinutes=minutes;
    order.acceptedAt=now;
    order.readyAt=now + (minutes * 60 * 1000);
    await updateRestaurantOrderInDb(docId, order);

    // تحديث محلي فوري
    const ordIdx=_rloOrders.findIndex(o=>o._docId===docId||o.orderId===docId);
    if(ordIdx!==-1){
      _rloOrders[ordIdx]={..._rloOrders[ordIdx],...order};
      updateCashierBadges();
      renderCashierOrdersList();
    }
    if(restBroadcast){
      try{ restBroadcast.postMessage({ type: 'ORDER_UPDATED', orderId: docId }); }catch(e){}
    }
    showToast(`✅ تم قبول الطلب #${order.orderNo} بوقت تحضير ${minutes} دقيقة`,"success");
    playRestaurantBell('ready');
  }catch(e){showToast("خطأ: "+e.message,"error");}
};

window.cashierCustomTimeOrder=async(docId)=>{
  const m = await showPromptModal("أدخل وقت التحضير بالدقائق (مثلاً 10 أو 30 أو 50):", "20", { title: "تحديد وقت التحضير", icon: "⏱️", inputType: "number", confirmText: "تأكيد الوقت" });
  if(!m)return;
  const mins=parseInt(m,10);
  if(isNaN(mins)||mins<=0){showToast("⚠️ وقت غير صحيح","warn");return;}
  cashierAcceptOrder(docId,mins);
};

window.cashierRejectOrder=async(docId)=>{
  const ok = await showConfirmModal("هل أنت متأكد من الاعتذار عن قبول هذا الطلب؟", { isDanger: true, confirmText: "نعم، اعتذار" });
  if(!ok) return;
  try{
    const order = await getRestaurantOrderFromDb(docId);
    if(!order) return;
    if(_rloStoreId && order.storeId && order.storeId !== _rloStoreId && !isAdmin){
      showToast("❌ هذا الطلب يتبع متجراً آخر","error");
      return;
    }
    if(order.status === 'completed' || order.status === 'rejected'){
      showToast("⚠️ هذا الطلب مغلق بالفعل","warn");
      return;
    }
    order.status='rejected';

    let didRefund = false;
    if(order.paymentMethod === 'wallet' && order.isPaid && !order.isRefunded && order.customerUid && !order.customerUid.startsWith('guest_')){
      try{
        if(typeof refundOrderToWallet === 'function'){
          const refRes = await refundOrderToWallet(order.customerUid, order.totalPrice, order.orderNo, order.storeName);
          if(refRes && refRes.ok){
            order.isRefunded = true;
            order.refundedAt = Date.now();
            didRefund = true;
          }
        }
      }catch(err){
        console.error("Auto refund error:", err);
      }
    }

    await updateRestaurantOrderInDb(docId, order);
    const ordIdx=_rloOrders.findIndex(o=>o._docId===docId||o.orderId===docId);
    if(ordIdx!==-1){
      _rloOrders[ordIdx]={..._rloOrders[ordIdx],...order};
      updateCashierBadges();
      renderCashierOrdersList();
    }
    if(restBroadcast){
      try{ restBroadcast.postMessage({ type: 'ORDER_UPDATED', orderId: docId }); }catch(e){}
    }
    showToast(`تم الاعتذار عن الطلب #${order.orderNo}${didRefund ? ' واسترجاع المبلغ تلقائياً لمحفظة الزبون' : ''}`,"info");
  }catch(e){showToast("خطأ: "+e.message,"error");}
};

window.cashierMarkReady=async(docId)=>{
  try{
    const order = await getRestaurantOrderFromDb(docId);
    if(!order) return;
    order.status='ready';
    await updateRestaurantOrderInDb(docId, order);
    const ordIdx=_rloOrders.findIndex(o=>o._docId===docId||o.orderId===docId);
    if(ordIdx!==-1){
      _rloOrders[ordIdx]={..._rloOrders[ordIdx],...order};
      updateCashierBadges();
      renderCashierOrdersList();
    }
    if(restBroadcast){
      try{ restBroadcast.postMessage({ type: 'ORDER_UPDATED', orderId: docId }); }catch(e){}
    }
    showToast(`🎉 تم إشعار الزبون بأن وجبة #${order.orderNo} جاهزة للاستلام!`,"success");
  }catch(e){showToast("خطأ: "+e.message,"error");}
};

window.cashierCompleteOrder=async(docId)=>{
  try{
    const order = await getRestaurantOrderFromDb(docId);
    if(!order) return;
    order.status='completed';
    order.completedAt=Date.now();
    await updateRestaurantOrderInDb(docId, order);
    const ordIdx=_rloOrders.findIndex(o=>o._docId===docId||o.orderId===docId);
    if(ordIdx!==-1){
      _rloOrders[ordIdx]={..._rloOrders[ordIdx],...order};
      updateCashierBadges();
      renderCashierOrdersList();
    }
    if(restBroadcast){
      try{ restBroadcast.postMessage({ type: 'ORDER_UPDATED', orderId: docId, status: 'completed' }); }catch(e){}
    }
    showToast(`✔️ تم تسليم وإغلاق الطلب #${order.orderNo}`,"success");
  }catch(e){showToast("خطأ: "+e.message,"error");}
};


window.toggleSold=async(id,event)=>{
  if(event)event.stopPropagation();
  const p=allPosts.find(x=>x.id===id);
  if(!p)return;
  const me=auth.currentUser;
  if(!me)return;
  const isMyStorePost=myStore&&p.storeId===myStore.id;
  const isOwner=me.uid===p.uid||isMyStorePost;
  if(!isOwner && !isAdmin){showToast("❌ هذا الإعلان ليس لك","error");return;}
  const newSold=!p.sold;
  const msg=newSold?"هل تم بيع هذا المنتج وتريد وضع علامة (تم البيع)؟":"هل تريد إلغاء حالة (تم البيع) وإعادة إتاحة الإعلان؟";
  if(!(await showConfirmModal(msg, { icon: newSold ? "✅" : "↩️", danger: false, confirmText: newSold ? "نعم، تم البيع" : "إلغاء البيع" }))) return;
  try{
    const soldAt = newSold ? Date.now() : null;
    await updateDoc(doc(db,"posts",id),{sold:newSold,soldAt:soldAt});
    p.sold = newSold;
    p.soldAt = soldAt;
    if(newSold && cart.items.some(i=>i.postId===id)){
      cart.items=cart.items.filter(i=>i.postId!==id);
      if(cart.items.length===0){cart.storeId=null;cart.storeName="";cart.storePhone="";}
      saveCart();updateCartUI();
    }
    renderPosts();
    const ov=document.getElementById("postOverlay");
    if(ov && !ov.classList.contains("hidden")){
      openPost(id);
    }
    showToast(newSold?"✅ تم وضع علامة (تم البيع)":"✅ تم إلغاء العلامة","success");
  }catch(e){showToast("خطأ: "+e.message,"error");}
};

/* ============================================
   الصور + الضغط + الرفع
   ============================================ */
function getImages(p){return (p.images&&p.images.length)?p.images:(p.imageUrl?[p.imageUrl]:[]);}
function carouselHtml(images,lightbox){
  if(!images.length)return `<div class="carousel"><div class="slide"><span style="font-size:34px;opacity:.5">🖼️</span></div></div>`;
  return `<div class="carousel">${images.map(u=>`<div class="slide"${lightbox?` onclick="event.stopPropagation();openLightbox('${escapeHtml(u)}')" style="cursor:zoom-in"`:""}><img src="${escapeHtml(u)}" loading="lazy" onerror="this.parentElement.innerHTML='<span style=font-size:34px;opacity:.5>🖼️</span>'"></div>`).join("")}</div>`;
}
function dotsHtml(images){if(images.length<=1)return"";return `<div class="dots">${images.map((_,i)=>`<span class="dot${i===0?" active":""}"></span>`).join("")}</div>`;}
document.addEventListener("scroll",e=>{const el=e.target;if(!el||!el.classList||!el.classList.contains("carousel"))return;const d=el.parentElement&&el.parentElement.querySelector(".dots");if(!d)return;const i=Math.round(el.scrollLeft/(el.clientWidth||1));Array.from(d.children).forEach((x,idx)=>x.classList.toggle("active",idx===i));},true);
window.updateDescCount=()=>{const d=document.getElementById("description");document.getElementById("descCount").textContent=d?d.value.length:0;};

async function compressImage(file,maxSize=1200,quality=0.82){
  try{
    if(file && (file.type === 'image/heic' || file.type === 'image/heif' || /\.hei[cf]$/i.test(file.name || ''))){
      showToast("⚠️ صور آيفون بصيغة HEIC غير مدعومة مباشرة، يرجى اختيار صور JPG أو PNG", "warn", 6000);
      return file;
    }
    const bmp=await createImageBitmap(file);
    const scale=Math.min(1,maxSize/Math.max(bmp.width,bmp.height));
    const w=Math.round(bmp.width*scale),h=Math.round(bmp.height*scale);
    const c=document.createElement("canvas");c.width=w;c.height=h;
    const ctx=c.getContext("2d");
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality="high";
    ctx.drawImage(bmp,0,0,w,h);
    const b=await new Promise(r=>c.toBlob(r,"image/jpeg",quality));
    return b||file;
  }catch(e){
    return file;
  }
}
async function uploadToImgBB(file){const fd=new FormData();const toSend=await compressImage(file);fd.append("image",toSend,"photo.jpg");const res=await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,{method:"POST",body:fd});const data=await res.json();if(!data.success)throw new Error("فشل رفع الصورة");return data.data.url;}
function renderImagePicker(){const box=document.getElementById("imgThumbs");box.innerHTML=selectedImages.map((item,i)=>{const src=item.type==="existing"?item.url:item.previewUrl;return `<div class="imgThumb"><img src="${escapeHtml(src)}"><button class="rm" onclick="removeImage(${i})">×</button></div>`;}).join("");document.getElementById("imgAddTile").classList.toggle("hidden",selectedImages.length>=10);}
window.removeImage=(i)=>{selectedImages.splice(i,1);renderImagePicker();};
window.handleFilesSelected=()=>{
  const input=document.getElementById("imageFile");
  const files=Array.from(input.files);
  const remaining=10-selectedImages.length;
  let hasHeic = false;
  files.slice(0,remaining).forEach(file=>{
    const isHeic = file && (file.type === 'image/heic' || file.type === 'image/heif' || /\.hei[cf]$/i.test(file.name || ''));
    if(isHeic){
      hasHeic = true;
      return;
    }
    selectedImages.push({type:"new",file,previewUrl:URL.createObjectURL(file)});
  });
  if(hasHeic){
    showToast("⚠️ تم تجاهل بعض صور الآيفون (HEIC). يرجى تحويل كاميرا الآيفون لـ (الأكثر توافقاً) من الإعدادات أو اختيار صور JPG/PNG", "warn", 7000);
  }
  input.value="";
  renderImagePicker();
};

/* ============================================
   المتاجر — القائمة + الصفحة
   ============================================ */
let storesLoadedInitially = false;
function startStoresListener(){
  if(unsubStores)return;
  unsubStores=onSnapshot(collection(db,"stores"),snap=>{
    storesLoadedInitially=true;
    allStores=snap.docs.map(d=>({id:d.id,...d.data()}));
    renderStoresList();
    if(home && !home.classList.contains("hidden")) renderPosts();
    if(storesModerationOverlay && !storesModerationOverlay.classList.contains("hidden"))renderStoresModeration();
    const sc=document.getElementById("storeScreen");
    if(sc && !sc.classList.contains("hidden")){const openStoreId=window._currentStoreId;if(openStoreId)setTimeout(()=>refreshOpenStore(openStoreId),300);}
  },err=>{
    console.error("Stores listener failed:", err);
    storesLoadedInitially=true;
    renderStoresList();
    if(home && !home.classList.contains("hidden")) renderPosts();
  });
}
window._storesFilterMode = 'stores';
window.openStores=(mode='stores',skipHistory)=>{
  window._storesFilterMode = (mode === 'restaurants') ? 'restaurants' : 'stores';
  document.querySelectorAll(".catChip").forEach(b=>b.classList.remove("active"));
  categoriesScreen.classList.add("hidden");home.classList.add("hidden");form.classList.add("hidden");
  const sc=document.getElementById("storeScreen");if(sc)sc.classList.add("hidden");
  const as=document.getElementById("accountScreen");if(as)as.classList.add("hidden");
  const inSc=document.getElementById("inboxScreen");if(inSc)inSc.classList.add("hidden");
  const ss=document.getElementById("storesScreen");
  if(ss)ss.classList.remove("hidden");
  const titleEl=document.getElementById("storesScreenTitle");
  if(titleEl){
    titleEl.textContent = window._storesFilterMode === 'restaurants' ? '🍽️ دليل المطاعم والمأكولات' : '🏢 الشركات والمتاجر';
  }
  const searchInput=document.getElementById("storeSearch");
  if(searchInput){
    searchInput.placeholder = window._storesFilterMode === 'restaurants' ? '🔍 ابحث في المطاعم والمأكولات...' : '🔍 ابحث عن متجر أو شركة...';
  }
  if(!unsubStores) startStoresListener();
  renderStoresList();
  window.scrollTo(0,0);
  hideFloatingButtons();
  if(!skipHistory) pushNavState({ screen: 'stores', mode: window._storesFilterMode }, '#stores' + (window._storesFilterMode ? '-' + window._storesFilterMode : ''));
};
window.openRestaurants=(skipHistory)=>openStores('restaurants',skipHistory);

function renderRestaurantStructureCard(s, backTo='home'){
  const coverHtml=s.cover?`<img src="${escapeHtml(s.cover)}" onerror="this.parentElement.innerHTML='🍽️'">`:"🍔🍗🍕";
  const logoHtml=s.logo?`<img src="${escapeHtml(s.logo)}" onerror="this.parentElement.innerHTML='🍽️'">`:"🍽️";
  const verifiedBadge=s.verified?`<span class="verifiedBadge" title="مطعم موثق"></span>`:"";
  const hoursText=formatStoreHours(s);
  const openBadge=openBadgeHTML(s);
  const restCallNumber=s.callPhone||s.phone;
  const callBtn=restCallNumber?`<a href="tel:${formatCallPhone(restCallNumber)}" class="rscCallBtn" onclick="event.stopPropagation();incrementWhatsappClick('${escapeHtml(s.id)}','store')">📞 اتصال هاتفي للطلب</a>`:"";
  return `
    <div class="restaurantStructureCard" onclick="openStore('${s.id}',false,'${backTo}')">
      <div class="rscCover">${coverHtml}</div>
      <div class="rscBody">
        <div class="rscLogo">${logoHtml}</div>
        <div class="rscTitleRow">
          <div class="rscName">${escapeHtml(s.name||"مطعم")} ${verifiedBadge}</div>
          ${openBadge}
        </div>
        <div class="rscMeta">
          <span>📁 ${escapeHtml(s.category||"المطاعم والمأكولات")}</span>
          ${s.city ? `<span>📍 ${escapeHtml(s.city)}</span>` : ''}
          ${hoursText ? `<span>🕐 ${hoursText}</span>` : ''}
        </div>
        ${s.description ? `<div style="font-size:12px;color:var(--muted);margin-top:6px;line-height:1.4">${escapeHtml(s.description)}</div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
          ${callBtn}
          <span style="font-size:12.5px;font-weight:800;color:var(--teal-dark)">عرض المنيو والوجبات ›</span>
        </div>
      </div>
    </div>
  `;
}

function renderStoresList(){
  const list=document.getElementById("storesList");if(!list)return;
  const term=(document.getElementById("storeSearch")?.value||"").trim().toLowerCase();
  const mode=window._storesFilterMode||'stores';
  let approved=allStores.filter(s=>s.status==="approved");
  if(mode==='restaurants'){
    approved=approved.filter(s=>isRestaurantStore(s));
  } else if(mode==='stores'){
    approved=approved.filter(s=>!isRestaurantStore(s));
  }
  approved=approved.filter(s=>!term || (s.name||"").toLowerCase().includes(term) || (s.category||"").toLowerCase().includes(term) || (s.city||"").toLowerCase().includes(term));
  if(approved.length===0){
    if(!storesLoadedInitially && allStores.length===0){
      list.innerHTML="<div class='reportsEmpty'>⏳ جاري تحميل المتاجر...</div>";
      return;
    }
    const emptyMsg=mode==='restaurants'?"لا توجد مطاعم ومأكولات معتمدة بعد":"لا توجد متاجر معتمدة بعد";
    list.innerHTML=`<div class='reportsEmpty'>${emptyMsg}</div>`;
    return;
  }
  if(mode==='restaurants'){
    list.innerHTML=approved.map(s=>renderRestaurantStructureCard(s,'stores')).join("");
    return;
  }
  list.innerHTML=approved.map(s=>{
    if(isRestaurantStore(s)){
      return renderRestaurantStructureCard(s,'stores');
    }
    const logo=s.logo?`<img src="${escapeHtml(s.logo)}" onerror="this.parentElement.innerHTML='🏪'">`:"🏪";
    const count=allPosts.filter(p=>p.storeId===s.id && getStatus(p)==="approved" && !isExpired(p) && !p.sold).length;
    const openBadge=openBadgeHTML(s);
    const hoursText=formatStoreHours(s);
    const verifiedBadge=s.verified?`<span class="verifiedBadge" title="متجر موثق"></span>`:"";
    const badgeHTML=`<span class="storeBadge">🏢 شركة/متجر</span>`;
    const storePostsCount=allPosts.filter(p=>p.storeId===s.id && getStatus(p)==="approved").length;
    const storeTier=typeof renderSellerTierBadge === 'function' ? renderSellerTierBadge(s.ownerUid,storePostsCount) : "";
    return `<div class="storeCard" onclick="openStore('${s.id}',false,'stores')"><div class="storeLogo">${logo}</div><div class="storeInfo"><div class="storeName">${escapeHtml(s.name||"متجر")} ${verifiedBadge} ${badgeHTML} ${openBadge} ${storeTier}</div><div class="storeMeta">📁 ${escapeHtml(s.category||"")}${s.city?" · 📍 "+escapeHtml(s.city):""}${hoursText?" · 🕐 "+hoursText:""}</div><div class="storeStats">📦 ${count} منتج · 👤 ${escapeHtml(s.ownerUsername?('@'+s.ownerUsername):(s.ownerMemberNo?('#'+s.ownerMemberNo):'بائع'))}</div></div></div>`;
  }).join("");
}
window.refreshOpenStore=async(storeId)=>{
  const formScreen=document.getElementById("form");
  if(formScreen && !formScreen.classList.contains("hidden")) return;
  const sc=document.getElementById("storeScreen");
  if(!sc || sc.classList.contains("hidden"))return;
  if(window._currentStoreId!==storeId)return;
  await openStore(storeId,true);
};
window.openStore=async(storeId,keepScroll,backTo,skipHistory)=>{
  const savedScrollY = keepScroll ? (window.scrollY || document.documentElement.scrollTop || 0) : 0;
  try{
    if(!keepScroll){window._currentStoreId=storeId;}
    window._storeBackTo=backTo||"categories";
    closeOverlayDirect();
    const ss=document.getElementById("storesScreen");if(ss)ss.classList.add("hidden");
    const as=document.getElementById("accountScreen");if(as)as.classList.add("hidden");
    const inSc=document.getElementById("inboxScreen");if(inSc)inSc.classList.add("hidden");
    categoriesScreen.classList.add("hidden");home.classList.add("hidden");form.classList.add("hidden");
    const sc=document.getElementById("storeScreen");if(sc)sc.classList.remove("hidden");
    const box=document.getElementById("storeContent");
    if(!box)return;
    if(!keepScroll)box.innerHTML="<div class='reportsEmpty'>⏳ جاري التحميل...</div>";
    if(!keepScroll && !skipHistory) pushNavState({ screen: 'store', id: storeId, backTo: backTo || 'categories' }, '#store-' + storeId);
    
    let store=allStores.find(s=>s.id===storeId);
    if(!store){
      try{
        const snap=await Promise.race([
          getDoc(doc(db,"stores",storeId)),
          new Promise((_,reject)=>setTimeout(()=>reject(new Error("مهلة التحميل انتهت")),20000))
        ]);
        if(snap && snap.exists()) store={id:snap.id,...snap.data()};
      }catch(e){
        console.warn("Could not fetch store doc:",e);
      }
    }
    if(!store){
      box.innerHTML=`<div class='reportsEmpty'>❌ تعذر تحميل المتجر حالياً (قد يكون هناك بطء في الشبكة أو المتجر غير متاح)<br><br><div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class='btnMain' style='max-width:180px' onclick="openStore('${escapeHtml(storeId)}')">🔄 إعادة المحاولة</button><button class='btnGhost' style='max-width:180px' onclick='openStores()'>العودة لدليل المتاجر</button></div></div>`;
      return;
    }
    window._currentStoreId=storeId;
    const titleEl=document.getElementById("storeScreenTitle");
    if(titleEl)titleEl.textContent=store.name||"🏪 المتجر";

    const isOwnerStore=auth.currentUser && auth.currentUser.uid===store.ownerUid;
    const isAdminUser=auth.currentUser && auth.currentUser.email===ADMIN_EMAIL;
    const isStoreHelperNow=auth.currentUser && isStoreHelper(storeId,auth.currentUser.email);
    if(store.status!=="approved" && !isOwnerStore && !isAdminUser){
      box.innerHTML="<div class='reportsEmpty'>❌ المتجر غير متاح حالياً<br><br><button class='btnMain' style='max-width:200px;margin:auto' onclick='openStores()'>العودة لدليل المتاجر</button></div>";
      return;
    }
    const items=allPosts.filter(p=>p.storeId===storeId && (getStatus(p)==="approved" || (auth.currentUser && (auth.currentUser.uid===store.ownerUid||isAdminUser||isStoreHelperNow))) && (!isExpired(p) || isOwnerStore || isAdminUser || isStoreHelperNow));
    currentStoreItems=items.slice();
    window._canManageStoreItems=isAdminUser||isOwnerStore||isStoreHelperNow;
    const isRestaurant=isRestaurantStore(store);
    const coverHtml=store.cover?`<img src="${escapeHtml(store.cover)}" onerror="this.parentElement.innerHTML='🏪'">`:"🏪";
    const logoHtml=store.logo?`<img src="${escapeHtml(store.logo)}">`:"<div class='placeholder'>🏪</div>";

    const cleanStorePhone=String(store.phone||'').replace(/[^0-9+]/g,'');
    const storeCallNumber=store.callPhone||store.phone;
    const receiptWaNumber=store.receiptPhone||store.phone;
    const contactStoreBtn=store.phone
      ? (isRestaurant
          ? `${storeCallNumber ? `<a href="tel:${formatCallPhone(storeCallNumber)}" class="btnMain" style="background:var(--call);margin-bottom:8px;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:8px;font-size:15px;font-weight:800;padding:13px" onclick="event.stopPropagation();incrementWhatsappClick('${escapeHtml(store.id)}','store')">📞 اتصال هاتفي لطلب الأوردر (${escapeHtml(storeCallNumber)})</a>` : ''}
             ${receiptWaNumber ? `<button class="btnGhost" style="width:100%;font-size:12px;color:#0369a1;background:#f0f9ff;border:1px dashed #0ea5e9;padding:9px;border-radius:10px;margin-bottom:8px;cursor:pointer;font-weight:700" onclick="event.stopPropagation();sendReceiptToSeller('${escapeHtml(receiptWaNumber)}','${escapeHtml(store.name||'المطعم')}')">🧾 دفع مصرفي؟ إرسال واصل التحويل عبر واتساب</button>` : ''}`
          : `<div style="display:flex;gap:8px;margin-bottom:8px">
              <button class="btnMain" style="flex:1;background:var(--wa);margin-bottom:0;display:flex;align-items:center;justify-content:center;gap:6px" onclick="event.stopPropagation();openStoreWhatsapp('${escapeHtml(cleanStorePhone)}')">💬 تواصل عبر واتساب</button>
              <a href="tel:${formatCallPhone(store.phone)}" class="btnMain" style="flex:1;background:var(--call);margin-bottom:0;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px" onclick="event.stopPropagation();incrementWhatsappClick('${escapeHtml(store.id)}','store')">📞 اتصال هاتفي بالمتجر</a>
            </div>`)
      : "";

    const chatStoreBtn=(!isOwnerStore && store.ownerUid) ? `
      <button class="btnMain" style="background:linear-gradient(135deg,#0d9488,#059669);color:#fff;margin-bottom:8px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:15px;font-weight:800;padding:12px;border-radius:12px;box-shadow:0 4px 12px rgba(13,148,136,.3)" onclick="event.stopPropagation();openChatWithSeller('${escapeHtml(store.ownerUid)}',null,'${escapeHtml(store.id)}')">
        💬 دردشة فورية مع المتجر
      </button>
    ` : '';

    const bi=store.bankInfo || {};
    const hasIban=bi.iban && bi.iban.trim();
    const hasAccount=bi.accountNumber && bi.accountNumber.trim();
    const hasBankInfo=hasIban || hasAccount;
    let bankInfoHtml="";
    if(hasBankInfo){
      const copyBtn=(val,label)=>`<button onclick="copyToClipboard('${escapeHtml(val)}','${label}')" style="background:#0284c7;color:#fff;border:none;padding:6px 12px;border-radius:8px;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;margin-right:6px;white-space:nowrap">📋 نسخ</button>`;
      bankInfoHtml=`<div style="background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border:2px solid #0ea5e9;border-radius:14px;padding:14px;margin:12px 0">
        <div style="font-weight:800;color:#0369a1;font-size:14px;margin-bottom:10px">💳 معلومات الدفع</div>
        <div style="font-size:12px;color:#0369a1;margin-bottom:12px;line-height:1.7">💡 حوّل المبلغ على أي من هذه الحسابات، ثم أرسل صورة الإيصال للبائع على واتساب.</div>
        ${bi.accountOwner?`<div style="background:#fff;border-radius:10px;padding:10px;margin-bottom:8px"><div style="font-size:11.5px;font-weight:700;color:var(--muted);margin-bottom:4px">👤 اسم صاحب الحساب</div><div style="font-weight:800;font-size:14px">${escapeHtml(bi.accountOwner)}</div></div>`:""}
        ${bi.bankName?`<div style="background:#fff;border-radius:10px;padding:10px;margin-bottom:8px"><div style="font-size:11.5px;font-weight:700;color:var(--muted);margin-bottom:4px">🏛️ اسم المصرف</div><div style="font-weight:800;font-size:14px">${escapeHtml(bi.bankName)}</div></div>`:""}
        ${hasIban?`<div style="background:#fff;border-radius:10px;padding:10px;margin-bottom:8px"><div style="font-size:11.5px;font-weight:700;color:var(--muted);margin-bottom:4px">🏦 رقم الآيبان (IBAN)</div><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span style="font-family:monospace;font-size:13px;direction:ltr;word-break:break-all;flex:1;min-width:150px">${escapeHtml(bi.iban)}</span>${copyBtn(bi.iban,'IBAN')}</div></div>`:""}
        ${hasAccount?`<div style="background:#fff;border-radius:10px;padding:10px;margin-bottom:8px"><div style="font-size:11.5px;font-weight:700;color:var(--muted);margin-bottom:4px">💳 رقم الحساب</div><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span style="font-family:monospace;font-size:13px;direction:ltr;flex:1;min-width:150px">${escapeHtml(bi.accountNumber)}</span>${copyBtn(bi.accountNumber,'رقم الحساب')}</div></div>`:""}
        ${store.phone?`<button class="btnMain" style="background:var(--wa);margin-top:10px;margin-bottom:0" onclick="sendReceiptToSeller('${escapeHtml(String(store.receiptPhone||store.phone||'').replace(/[^0-9]/g,''))}','${escapeHtml(store.name||'المتجر')}')">📤 أرسل الإيصال للبائع على واتساب</button>`:""}
      </div>`;
    }

    /* ✅ زر نقل الإعلانات الفردية */
    const myIndividualCount=(auth.currentUser && (isOwnerStore||isAdminUser)) ? allPosts.filter(p=>p.uid===store.ownerUid && !p.storeId).length : 0;
    const transferBtn=myIndividualCount>0?`<button class="storeQRBtn" onclick="transferMyPostsToStore('${store.id}')" style="background:#0284c7;color:#fff">📥 نقل إعلاناتي (${myIndividualCount})</button>`:"";

    const storeCartCount=cart.storeId===storeId?cartTotalCount():0;
    const showCartBtn=storeCartCount>0?`<button class="btnMain" style="background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#3a2500;margin-bottom:8px" onclick="openCart()">🛒 عرض سلتك (${storeCartCount})</button>`:"";
    const storeFilterBar=`<div style="display:flex;gap:6px;margin:10px 0;flex-wrap:wrap"><input type="text" id="storeProductSearch" placeholder="🔍 ابحث في المنتجات..." oninput="applyStoreProductFilter()" style="flex:1;min-width:150px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;font-family:inherit;font-size:14px;background:var(--card);color:var(--text)"><button class="filterBtn active" onclick="setStoreSort('newest')" id="ssortNewest" style="font-size:12px">🆕 الأحدث</button><button class="filterBtn" onclick="setStoreSort('cheapest')" id="ssortCheapest" style="font-size:12px">💰 الأرخص</button><button class="filterBtn" onclick="setStoreSort('expensive')" id="ssortExpensive" style="font-size:12px">💎 الأغلى</button><button class="filterBtn" onclick="setStoreSort('views')" id="ssortViews" style="font-size:12px">👁️ الأكثر مشاهدة</button></div>`;
    const statusNote=store.status==="pending"?`<div style="background:#fef3c7;color:#92400e;padding:8px;border-radius:10px;text-align:center;font-weight:800;margin-bottom:10px">⏳ متجرك قيد المراجعة</div>`:"";
    const statusNote2=store.status==="rejected"?`<div style="background:#fdeceb;color:#b91c1c;padding:8px;border-radius:10px;text-align:center;font-weight:800;margin-bottom:10px">❌ متجرك مرفوض${store.rejectReason?" — "+escapeHtml(store.rejectReason):""}</div>`:"";
    const verifiedBadgeLg=store.verified?`<span class="verifiedBadge verifiedBadgeLg" title="متجر موثق"></span>`:"";
    const deliveryBadge=store.deliveryCompany?`<span style="font-size:12px;color:#166534;padding:3px 9px;background:#f0fdf4;border-radius:7px;font-weight:700;border:1px solid #bbf7d0">🛵 التوصيل: ${escapeHtml(store.deliveryCompany)}</span>`:"";
    const restaurantBadge=isRestaurant?`<span class="restaurantBadge">🍽️ مطعم</span>`:`<span class="storeBadge">🏢 شركة/متجر</span>`;

    const storePostsCount=allPosts.filter(p=>p.storeId===store.id && getStatus(p)==="approved").length;
    const storeTierBadge=typeof renderSellerTierBadge === 'function' ? renderSellerTierBadge(store.ownerUid, storePostsCount) : "";

    currentStoreSubCategory = "all";
    currentStoreSearch = "";
    const availableSubCategories = [];
    items.forEach(p => {
      const cat = getProductSubCategory(p, isRestaurant);
      if(cat && !availableSubCategories.includes(cat)) availableSubCategories.push(cat);
    });
    if(isRestaurant){
      window._currentKshOrder = {};
      const canEditBranding = isOwnerStore || isAdminUser;
      const logoClickAttr = canEditBranding ? `onclick="triggerStoreLogoDirectChange('${store.id}')" style="cursor:pointer;position:relative" title="اضغط لتغيير الشعار"` : '';
      const coverClickBadge = canEditBranding ? `<button class="coverEditBadge" onclick="triggerStoreCoverDirectChange('${store.id}')">📷 تغيير الغلاف</button>` : '';
      const logoBadge = canEditBranding ? `<div class="logoEditBadge" title="تغيير الشعار">📷</div>` : '';

      const kshCoverHtml = store.cover
        ? `<img src="${escapeHtml(store.cover)}" alt="غلاف المطعم">`
        : `<div class="kshCoverEmojis">🍔🍗🍕</div>`;
      const kshLogoHtml = store.logo
        ? `<img src="${escapeHtml(store.logo)}" alt="شعار">`
        : `<div style="font-weight:800;font-size:18px">${escapeHtml((store.name||'KSH').slice(0,3))}</div>`;
      const hoursFormatted = formatStoreHours(store) || "12:00 – 02:00";
      const deliveryFormatted = store.deliveryCompany ? escapeHtml(store.deliveryCompany) : "داخلي / شركات";

      const navButtonsHtml = `
        <button class="${currentStoreSubCategory==='all'?'on':''}" onclick="setStoreSubCategory('all')">الكل</button>
        ${availableSubCategories.map(cat => `
          <button class="${currentStoreSubCategory===cat?'on':''}" onclick="setStoreSubCategory('${escapeHtml(cat)}')">${escapeHtml(cat)}</button>
        `).join('')}
      `;

      box.innerHTML = `
        ${statusNote}${statusNote2}
        <div class="kshCover">${kshCoverHtml}${coverClickBadge}</div>
        <div class="kshInfo">
          <div class="kshHead">
            <div class="kshLogo" ${logoClickAttr}>${kshLogoHtml}${logoBadge}</div>
            <div class="kshHeadText">
              <h1>${escapeHtml(store.name||"مطعم")} ${verifiedBadgeLg}</h1>
              <p>${escapeHtml(store.description || store.category || "المطاعم والمأكولات")}</p>
            </div>
          </div>
          <div class="kshStats">
            <div><small>الحد الأدنى</small><b>بدون حد</b></div>
            <div><small>ساعات العمل</small><b>${hoursFormatted}</b></div>
            <div><small>التوصيل</small><b>${deliveryFormatted}</b></div>
          </div>
          <div style="margin-top:12px">
            ${(!isOwnerStore && store.ownerUid) ? `
              <button class="btnMain" style="background:linear-gradient(135deg,#0d9488,#059669);color:#fff;margin-bottom:8px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:15px;font-weight:800;padding:12px;border-radius:12px;box-shadow:0 4px 12px rgba(13,148,136,.3)" onclick="event.stopPropagation();openChatWithSeller('${escapeHtml(store.ownerUid)}',null,'${escapeHtml(store.id)}')">
                💬 دردشة فورية مع إدارة المطعم
              </button>
            ` : ''}
            ${storeCallNumber ? `
              <a href="tel:${formatCallPhone(storeCallNumber)}" class="btnMain" style="background:#16a34a;margin-bottom:0;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:8px;font-size:15px;font-weight:800;padding:14px" onclick="incrementWhatsappClick('${escapeHtml(store.id)}','store')">
                📞 اتصال هاتفي مباشر لطلب الأوردر (${escapeHtml(storeCallNumber)})
              </a>
            ` : ''}
            ${receiptWaNumber ? `
              <div style="margin-top:8px">
                <button class="btnGhost" style="width:100%;font-size:12px;color:#0369a1;background:#f0f9ff;border:1px dashed #0ea5e9;padding:9px;border-radius:10px;cursor:pointer;font-weight:700" onclick="sendReceiptToSeller('${escapeHtml(receiptWaNumber)}','${escapeHtml(store.name||'المطعم')}')">
                  🧾 دفعت بالتحويل المصرفي؟ اضغط هنا لإرسال واصل التحويل عبر واتساب
                </button>
              </div>
            ` : ''}
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
            ${transferBtn}
            <button class="storeQRBtn" onclick="openStoreRating('${store.id}')">⭐ تقييم</button>
            <button class="storeQRBtn" onclick="toggleStoreQR()" style="background:#0284c7">📱 QR</button>
            ${isOwnerStore||isAdminUser?`<button class="storeQRBtn" onclick="openEditStore('${store.id}')" style="background:#8b5cf6">⚙️ تعديل المطعم</button>`:""}
            ${(isOwnerStore||isAdminUser||isStoreHelperNow)&&store.status==="approved"?`<button class="storeQRBtn" onclick="goAddStorePost('${store.id}')" style="background:#f59e0b;color:#3a2500">➕ إضافة وجبة</button>`:""}
            ${(isOwnerStore||isAdminUser||isStoreHelperNow)&&store.status==="approved"?`<button class="storeQRBtn" onclick="openRestaurantLiveOrders('${store.id}')" style="background:#dc2626;color:#fff;font-weight:800">🔔 طلبات المطعم الحية</button>`:""}
          </div>
          <div class="storeQRBox" id="storeQRBox" style="display:none"></div>
          <div class="storeRatingSection" id="storeRatingSection"></div>
        </div>
        <div class="kshNav" id="kshNav">${navButtonsHtml}</div>
        <div style="padding:10px 14px 85px">
          ${storeFilterBar}
          <div id="storeProductsBox"></div>
        </div>
      `;
      renderStoreProducts();
      updateCartUI();
      loadStoreRatings(storeId).then(()=>{
        const sec=document.getElementById("storeRatingSection");
        const inline=document.getElementById("storeRatingInline");
        const ratings=allStoreRatings[storeId]||[];
        if(!sec) return;
        if(ratings.length===0){ sec.innerHTML='<h4>⭐ التقييمات</h4><div style="color:var(--muted);font-size:13px">لا توجد تقييمات بعد</div>'; return; }
        const avg=ratings.reduce((s,r)=>s+(r.stars||0),0)/ratings.length;
        sec.innerHTML=`<h4>⭐ التقييمات (${ratings.length}) — متوسط ${avg.toFixed(1)}/5</h4>`+ratings.map(r=>`<div style="padding:10px 0;border-bottom:1px solid var(--border)"><div style="display:flex;justify-content:space-between;font-size:12.5px"><b>${escapeHtml(r.raterName||"مستخدم")}</b><span style="color:#f5a623">${"★".repeat(r.stars||0)}${"☆".repeat(5-(r.stars||0))}</span></div>${r.comment?`<div style="font-size:13px;margin-top:4px">${escapeHtml(r.comment)}</div>`:""}</div>`).join("");
      }).catch(e=>console.warn("Ratings error:",e));
      hideFloatingButtons();
      return;
    }

    const prestoCategoriesHtml = renderStoreCategoryTiles(items, availableSubCategories);
    const canEditBrandingStd = isOwnerStore || isAdminUser;
    const stdLogoAttr = canEditBrandingStd ? `onclick="triggerStoreLogoDirectChange('${store.id}')" style="cursor:pointer;position:relative" title="اضغط لتغيير الشعار"` : '';
    const stdCoverBadge = canEditBrandingStd ? `<button class="coverEditBadge" onclick="triggerStoreCoverDirectChange('${store.id}')">📷 تغيير الغلاف</button>` : '';
    const stdLogoBadge = canEditBrandingStd ? `<div class="logoEditBadge" title="تغيير الشعار">📷</div>` : '';

    box.innerHTML=`${statusNote}${statusNote2}<div class="storeHeader"><div class="cover">${coverHtml}${stdCoverBadge}</div><div class="logoWrap" ${stdLogoAttr}>${logoHtml}${stdLogoBadge}</div></div><div class="storeTitle">${escapeHtml(store.name||"متجر")} ${verifiedBadgeLg} ${restaurantBadge} ${storeTierBadge}</div><div class="storeMetaLine">📁 ${escapeHtml(store.category||"")}${store.city?" · 📍 "+escapeHtml(store.city):""}${store.ownerUsername?" · 👤 @"+escapeHtml(store.ownerUsername):""}${store.ownerMemberNo?" · #"+store.ownerMemberNo:""}</div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0">${openBadgeHTML(store)}${formatStoreHours(store)?`<span style="font-size:12px;color:var(--muted);padding:3px 9px;background:#f0f9ff;border-radius:7px">🕐 ${formatStoreHours(store)}</span>`:""}${deliveryBadge}<span id="storeRatingInline"></span></div>${store.description?`<div class="storeDesc">${escapeHtml(store.description)}</div>`:""}${chatStoreBtn}${contactStoreBtn}${bankInfoHtml}${showCartBtn}<div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0">${transferBtn}<button class="storeQRBtn" onclick="openStoreRating('${store.id}')">⭐ قيّم المتجر</button><button class="storeQRBtn" onclick="toggleStoreQR()" style="background:#16a34a">📱 QR Code</button>${isOwnerStore||isAdminUser?`<button class="storeQRBtn" onclick="openEditStore('${store.id}')" style="background:#8b5cf6">⚙️ تعديل المتجر</button>`:""}${(isOwnerStore||isAdminUser||isStoreHelperNow)&&store.status==="approved"?`<button class="storeQRBtn" onclick="goAddStorePost('${store.id}')" style="background:#f59e0b;color:#3a2500">➕ إضافة منتج</button>`:""}</div><div class="storeQRBox" id="storeQRBox" style="display:none"></div><div class="storeRatingSection" id="storeRatingSection"></div><div style="font-weight:800;font-size:16px;margin:16px 0 8px">📦 المنتجات (${items.length})</div>${prestoCategoriesHtml}${storeFilterBar}<div id="storeProductsBox"></div>`;
    renderStoreProducts();
    updateCartUI();
    loadStoreRatings(storeId).then(()=>{
      const sec=document.getElementById("storeRatingSection");
      const inline=document.getElementById("storeRatingInline");
      const ratings=allStoreRatings[storeId]||[];
      if(inline && ratings.length>0){
        const avg=ratings.reduce((s,r)=>s+(r.stars||0),0)/ratings.length;
        inline.innerHTML=`<span class="storeRatingBadge">⭐ ${avg.toFixed(1)} (${ratings.length})</span>`;
      }
      if(!sec) return;
      if(ratings.length===0){ sec.innerHTML='<h4>⭐ التقييمات</h4><div style="color:var(--muted);font-size:13px">لا توجد تقييمات بعد</div>'; return; }
      const avg=ratings.reduce((s,r)=>s+(r.stars||0),0)/ratings.length;
      sec.innerHTML=`<h4>⭐ التقييمات (${ratings.length}) — متوسط ${avg.toFixed(1)}/5</h4>`+ratings.map(r=>`<div style="padding:10px 0;border-bottom:1px solid var(--border)"><div style="display:flex;justify-content:space-between;font-size:12.5px"><b>${escapeHtml(r.raterName||"مستخدم")}</b><span style="color:#f5a623">${"★".repeat(r.stars||0)}${"☆".repeat(5-(r.stars||0))}</span></div>${r.comment?`<div style="font-size:13px;margin-top:4px">${escapeHtml(r.comment)}</div>`:""}</div>`).join("");
    }).catch(e=>console.warn("Ratings error:",e));
    if(keepScroll && savedScrollY > 0){
      requestAnimationFrame(()=>{ window.scrollTo({ top: savedScrollY, behavior: 'instant' }); });
    }
    hideFloatingButtons();
  }catch(err){
    console.error("Critical error in openStore:",err);
    const box=document.getElementById("storeContent");
    if(box){
      box.innerHTML=`<div class='reportsEmpty'>❌ حدث خطأ غير متوقع أثناء عرض المتجر<br><small style="color:var(--muted);font-size:12px;display:block;margin-top:6px">${escapeHtml(err.message||String(err))}</small><br><button class="btnMain" style="max-width:200px;margin:auto" onclick="openStores()">العودة لدليل المتاجر</button></div>`;
    }
  }
};
function backFromStoreDirect(){
  const sc=document.getElementById("storeScreen");
  if(sc)sc.classList.add("hidden");
  window._currentKshOrder = {};
  if(window._storeBackTo==="stores"){const ss=document.getElementById("storesScreen");if(ss)ss.classList.remove("hidden");}
  else if(window._storeBackTo==="home"){home.classList.remove("hidden");showFloatingButtons();}
  else if(window._storeBackTo==="post"){postOverlay.classList.remove("hidden");}
  else{showCategoriesScreenDirect();}
}
window.backFromStoreDirect=backFromStoreDirect;
window.backFromStore=()=>{
  if(!_isHistoryNavigating && window.history.state && window.history.state.screen === 'store'){
    window.history.back();
    return;
  }
  backFromStoreDirect();
};
window.openStoreWhatsapp=(phone)=>{const url="https://wa.me/"+encodeURIComponent(String(phone||'').replace(/[^0-9]/g,""));document.getElementById("warnGo").href=url;warnOverlay.classList.remove("hidden");};
window.goAddStorePost=(storeId)=>{
  const store=allStores.find(s=>s.id===storeId);
  if(!store){showToast("❌ المتجر غير موجود","error");return;}
  const me=auth.currentUser;
  if(!me){authOverlay.classList.remove("hidden");return;}
  const isOwner=me.uid===store.ownerUid;
  const isAdminUser=me.email===ADMIN_EMAIL || isAdmin;
  const isHelper=me.email && isStoreHelper(storeId,me.email);
  if(!isOwner && !isAdminUser && !isHelper){showToast("❌ ليس لديك صلاحية لهذا المتجر","error");return;}
  if(store.status!=="approved"){showToast("❌ المتجر غير معتمد","error");return;}
  closeOverlay();
  const data={id:store.id,name:store.name||"",category:store.category||"سيارات ومركبات",city:store.city||"",phone:store.phone||store.storePhone||"",callPhone:store.callPhone||store.phone||"",status:store.status,ownerUid:store.ownerUid,ownerEmail:store.ownerEmail||""};
  _tempStoreData=data;
  try{sessionStorage.setItem('_tempStoreData',JSON.stringify(data));}catch(e){}
  setTimeout(()=>showForm(true),200);
};
window.openMyStore=()=>{if(!myStore){showToast("لا يوجد متجر","info");return;}openStore(myStore.id);};
window.deleteStoreProduct=async(id)=>{
  const confirmed = await showConfirmModal("هل أنت متأكد من حذف هذا المنتج من المتجر؟", { isDanger: true, confirmText: "نعم، حذف" });
  if(!confirmed) return;
  try{
    if(cart.items.some(i=>i.postId===id)){
      cart.items=cart.items.filter(i=>i.postId!==id);
      if(cart.items.length===0){cart.storeId=null;cart.storeName="";cart.storePhone="";}
      saveCart();updateCartUI();
    }
    await deleteDoc(doc(db,"posts",id));
    allPosts=allPosts.filter(x=>x.id!==id);
    renderPosts();
    showToast("✅ تم حذف المنتج بنجاح","success");
    setTimeout(()=>{if(window._currentStoreId)openStore(window._currentStoreId,true);},300);
  }catch(e){showToast("خطأ: "+e.message,"error");}
};

/* ✅ دالة نقل الإعلانات الفردية للمتجر (يدوياً بضغطة زر) */
window.transferMyPostsToStore=async(storeId)=>{
  if(!auth.currentUser){showToast("⚠️ سجّل دخولك أولاً","warn");return;}
  const store=allStores.find(s=>s.id===storeId);
  if(!store){showToast("❌ المتجر غير موجود","error");return;}
  const isOwner=auth.currentUser.uid===store.ownerUid;
  if(!isOwner && !isAdmin){showToast("❌ ليس لديك صلاحية","error");return;}
  const myPosts=allPosts.filter(p=>p.uid===store.ownerUid && !p.storeId);
  if(myPosts.length===0){showToast("ℹ️ مفيش إعلانات فردية للنقل","info");return;}

  const overlay=document.createElement('div');
  overlay.id='transferPostsOverlay';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(15,23,42,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s ease-out;overflow-y:auto';

  let listHtml='';
  for(const p of myPosts){
    const imgArr=getImages(p);
    const thumb=imgArr[0]||'';
    const priceTxt=p.priceType==='contact'?'📞 تواصل':(p.price!=null?formatPrice(p.price)+' د.ل':'');
    const safeTitle=escapeHtml(p.title||'بدون عنوان');
    const thumbHtml=thumb
      ?'<img src="'+escapeHtml(thumb)+'" style="width:100%;height:100%;object-fit:cover">'
      :'<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:20px;opacity:.5">🖼️</div>';
    listHtml+=
      '<label style="display:flex;gap:10px;align-items:center;padding:10px;border:1px solid var(--border);border-radius:10px;background:#fff;margin-bottom:8px;cursor:pointer">'+
        '<input type="checkbox" class="transferChk" data-post-id="'+p.id+'" checked style="width:20px;height:20px;flex:0 0 auto;accent-color:#0284c7">'+
        '<div style="width:50px;height:50px;border-radius:8px;overflow:hidden;background:var(--teal-light);flex:0 0 auto">'+thumbHtml+'</div>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-weight:700;font-size:13px;line-height:1.4;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+safeTitle+'</div>'+
          '<div style="font-size:12px;color:var(--teal-dark);font-weight:800">'+priceTxt+'</div>'+
        '</div>'+
      '</label>';
  }

  overlay.innerHTML=
    '<div style="background:#fff;border-radius:20px;padding:22px 18px;max-width:480px;width:100%;max-height:90vh;display:flex;flex-direction:column">'+
      '<div style="text-align:center;margin-bottom:14px">'+
        '<div style="font-size:44px;margin-bottom:6px">📥</div>'+
        '<div style="font-size:17px;font-weight:800;color:#1f2937;margin-bottom:4px">اختر الإعلانات لنقلها</div>'+
        '<div style="font-size:12.5px;color:#6b7280">اختر الإعلانات اللي تحب تنقلها لمتجر "<b>'+escapeHtml(store.name)+'</b>"</div>'+
      '</div>'+
      '<div style="display:flex;gap:8px;margin-bottom:12px">'+
        '<button id="transferSelectAll" style="flex:1;padding:9px;border:none;border-radius:9px;background:#e0f2fe;color:#0369a1;font-family:inherit;font-size:12.5px;font-weight:800;cursor:pointer">✅ تحديد الكل</button>'+
        '<button id="transferSelectNone" style="flex:1;padding:9px;border:none;border-radius:9px;background:#f3f4f6;color:#4b5563;font-family:inherit;font-size:12.5px;font-weight:800;cursor:pointer">✕ إلغاء الكل</button>'+
      '</div>'+
      '<div id="transferPostsList" style="flex:1;overflow-y:auto;max-height:45vh;margin-bottom:14px">'+listHtml+'</div>'+
      '<div style="display:flex;gap:8px">'+
        '<button id="transferConfirmBtn" style="flex:1;padding:13px;border:none;border-radius:12px;background:linear-gradient(135deg,#0284c7,#38bdf8);color:#fff;font-family:inherit;font-size:14.5px;font-weight:800;cursor:pointer">📥 نقل المحدد</button>'+
        '<button id="transferCancelBtn" style="padding:13px 20px;border:none;border-radius:12px;background:#f3f4f6;color:#4b5563;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer">إلغاء</button>'+
      '</div>'+
    '</div>';

  document.body.appendChild(overlay);

  const updateBtn=function(){
    const checked=overlay.querySelectorAll('.transferChk:checked').length;
    const btn=overlay.querySelector('#transferConfirmBtn');
    if(!btn)return;
    if(checked===0){
      btn.disabled=true;
      btn.style.opacity='0.5';
      btn.textContent='📥 اختر إعلانات';
    }else{
      btn.disabled=false;
      btn.style.opacity='1';
      btn.textContent='📥 نقل المحدد ('+checked+')';
    }
  };

  overlay.querySelector('#transferCancelBtn').onclick=()=>overlay.remove();
  overlay.querySelector('#transferSelectAll').onclick=()=>{
    overlay.querySelectorAll('.transferChk').forEach(c=>c.checked=true);
    updateBtn();
  };
  overlay.querySelector('#transferSelectNone').onclick=()=>{
    overlay.querySelectorAll('.transferChk').forEach(c=>c.checked=false);
    updateBtn();
  };
  overlay.querySelectorAll('.transferChk').forEach(c=>{c.onchange=updateBtn;});
  overlay.addEventListener('click',(e)=>{if(e.target===overlay)overlay.remove();});

  overlay.querySelector('#transferConfirmBtn').onclick=async()=>{
    const checked=overlay.querySelectorAll('.transferChk:checked');
    if(checked.length===0){showToast('⚠️ اختر إعلان واحد على الأقل','warn');return;}
    const ids=Array.from(checked).map(c=>c.getAttribute('data-post-id'));
    const btn=overlay.querySelector('#transferConfirmBtn');
    
    // فحص حد المتجر قبل إتمام النقل لمنع تجاوزه بصمت
    const currentStorePostsCount = allPosts.filter(p => p.storeId === store.id).length;
    const storeLimit = await getUserStoreLimit(store.ownerUid);
    if (!isAdmin && (currentStorePostsCount + ids.length) > storeLimit) {
      const allowed = Math.max(0, storeLimit - currentStorePostsCount);
      showToast(`⚠️ لا يمكن النقل: يتجاوز الحد الأقصى للمتجر (${storeLimit} منتج). المتبقي المتاح: ${allowed}`, "warn", 6000);
      return;
    }

    btn.disabled=true;
    btn.textContent='⏳ جاري النقل...';
    let ok=0,fail=0;
    for(const pid of ids){
      try{
        const p=myPosts.find(x=>x.id===pid);
        const upd = {
          storeId:store.id,
          storeName:store.name,
          storeCategory:store.category,
          storePhone:store.phone||'',
          phone:store.phone||(p&&p.phone)||''
        };
        await updateDoc(doc(db,'posts',pid), upd);
        const inMem = allPosts.find(x => x.id === pid);
        if(inMem){
          Object.assign(inMem, upd);
        }
        ok++;
      }catch(e){fail++;}
    }
    renderPosts();
    overlay.remove();
    showToast('✅ تم نقل '+ok+' إعلان للمتجر'+(fail>0?' (فشل '+fail+')':''),'success',3500);
    if(window._currentStoreId===store.id){setTimeout(()=>openStore(store.id,true),500);}
  };

  updateBtn();
};

/* ============================================
   تعديل المتجر وتغيير الشعار والغلاف
   ============================================ */
let editStoreCoverImage=null;
let _directUploadStoreId = null;

window.triggerStoreLogoDirectChange = (storeId) => {
  _directUploadStoreId = storeId;
  const input = document.getElementById("directLogoFileInput");
  if(input) input.click();
};

window.handleDirectLogoUpload = async (event) => {
  const file = event.target.files && event.target.files[0];
  if(!file || !_directUploadStoreId) return;
  const storeId = _directUploadStoreId;
  event.target.value = "";
  showToast("⏳ جاري رفع وتحديث الشعار...", "info", 3000);
  try {
    const url = await uploadToImgBB(file);
    await updateDoc(doc(db, "stores", storeId), { logo: url });
    const store = allStores.find(s => s.id === storeId);
    if(store) store.logo = url;
    showToast("✅ تم تغيير الشعار بنجاح!", "success");
    if(window._currentStoreId === storeId){
      openStore(storeId, true);
    }
  } catch(e) {
    showToast("❌ فشل تحديث الشعار: " + e.message, "error");
  }
};

window.triggerStoreCoverDirectChange = (storeId) => {
  _directUploadStoreId = storeId;
  const input = document.getElementById("directCoverFileInput");
  if(input) input.click();
};

window.handleDirectCoverUpload = async (event) => {
  const file = event.target.files && event.target.files[0];
  if(!file || !_directUploadStoreId) return;
  const storeId = _directUploadStoreId;
  event.target.value = "";
  showToast("⏳ جاري رفع وتحديث الغلاف...", "info", 3000);
  try {
    const url = await uploadToImgBB(file);
    await updateDoc(doc(db, "stores", storeId), { cover: url });
    const store = allStores.find(s => s.id === storeId);
    if(store) store.cover = url;
    showToast("✅ تم تغيير الغلاف بنجاح!", "success");
    if(window._currentStoreId === storeId){
      openStore(storeId, true);
    }
  } catch(e) {
    showToast("❌ فشل تحديث الغلاف: " + e.message, "error");
  }
};

window.openEditStore=(storeId)=>{
  const me=auth.currentUser;
  if(!me){authOverlay.classList.remove("hidden");return;}
  const store=allStores.find(s=>s.id===storeId);
  if(!store){showToast("❌ المتجر غير موجود","error");return;}
  const isOwnerStore=me.uid===store.ownerUid || (me.email && store.ownerEmail && me.email===store.ownerEmail);
  const isAdminUser=me.email===ADMIN_EMAIL || isAdmin;
  if(!isOwnerStore && !isAdminUser){showToast("❌ هذا المتجر ليس لك","error");return;}
  editStoreCurrentId=storeId;
  editStoreLogoImage=null;
  editStoreCoverImage=null;
  document.getElementById("editStoreName").value=store.name||"";
  document.getElementById("editStoreCategory").value=store.category||"المطاعم والمأكولات";
  document.getElementById("editStoreCity").value=store.city||"";
  document.getElementById("editStoreDescription").value=store.description||"";
  const _erp=document.getElementById("editStoreReceiptPhone");if(_erp)_erp.value=store.receiptPhone||"";
  const _ecp=document.getElementById("editStoreCallPhone");if(_ecp)_ecp.value=store.callPhone||store.phone||"";
  const _ep=document.getElementById("editStorePhone");if(_ep)_ep.value=store.phone||"";
  const _eoe=document.getElementById("editStoreOwnerEmail");if(_eoe)_eoe.value=store.ownerEmail||"";
  toggleEditReceiptPhoneField();
  const wh=store.workingHours||{openTime:"09:00",closeTime:"23:00",alwaysOpen:false};
  document.getElementById("editStoreOpenTime").value=wh.openTime||"09:00";
  document.getElementById("editStoreCloseTime").value=wh.closeTime||"23:00";
  document.getElementById("editStoreAlwaysOpen").checked=!!wh.alwaysOpen;
  const bi=store.bankInfo||{};
  document.getElementById("editStoreBankOwner").value=bi.accountOwner||"";
  document.getElementById("editStoreBankName").value=bi.bankName||"";
  document.getElementById("editStoreBankIban").value=bi.iban||"";
  document.getElementById("editStoreBankAccount").value=bi.accountNumber||"";
  loadStoreHelpers(storeId);
  renderEditStoreLogo(store.logo);
  renderEditStoreCover(store.cover);
  closeOverlay();
  editStoreOverlay.classList.remove("hidden");
};

window.handleEditStoreLogo=()=>{
  const input=document.getElementById("editStoreLogoFile");
  const f=input.files[0];
  if(!f)return;
  editStoreLogoImage={file:f,previewUrl:URL.createObjectURL(f)};
  input.value="";
  renderEditStoreLogo();
};

function renderEditStoreLogo(existingUrl){
  const box=document.getElementById("editStoreLogoThumbs");
  if(!box)return;
  if(editStoreLogoImage){
    box.innerHTML=`<div class="imgThumb"><img src="${editStoreLogoImage.previewUrl}"><button class="rm" onclick="editStoreLogoImage=null;renderEditStoreLogo()">×</button></div><div style="font-size:11px;color:#16a34a;font-weight:700;margin-top:4px">شعار جديد جاهز للحفظ</div>`;
  } else if(existingUrl){
    box.innerHTML=`<div class="imgThumb"><img src="${escapeHtml(existingUrl)}"></div><div style="font-size:11px;color:var(--muted);margin-top:4px">الشعار الحالي</div>`;
  } else {
    box.innerHTML="";
  }
}

window.handleEditStoreCover=()=>{
  const input=document.getElementById("editStoreCoverFile");
  const f=input.files[0];
  if(!f)return;
  editStoreCoverImage={file:f,previewUrl:URL.createObjectURL(f)};
  input.value="";
  renderEditStoreCover();
};

function renderEditStoreCover(existingUrl){
  const box=document.getElementById("editStoreCoverThumbs");
  if(!box)return;
  if(editStoreCoverImage){
    box.innerHTML=`<div class="imgThumb"><img src="${editStoreCoverImage.previewUrl}"><button class="rm" onclick="editStoreCoverImage=null;renderEditStoreCover()">×</button></div><div style="font-size:11px;color:#16a34a;font-weight:700;margin-top:4px">غلاف جديد جاهز للحفظ</div>`;
  } else if(existingUrl){
    box.innerHTML=`<div class="imgThumb"><img src="${escapeHtml(existingUrl)}"></div><div style="font-size:11px;color:var(--muted);margin-top:4px">الغلاف الحالي</div>`;
  } else {
    box.innerHTML="";
  }
}

window.saveStoreEdits=async()=>{
  if(!editStoreCurrentId){showToast("خطأ","error");return;}
  const store=allStores.find(s=>s.id===editStoreCurrentId);
  if(!store){showToast("❌ المتجر غير موجود","error");return;}
  const me=auth.currentUser;
  if(!me){authOverlay.classList.remove("hidden");return;}
  const isOwnerStore=me.uid===store.ownerUid || (me.email && store.ownerEmail && me.email===store.ownerEmail);
  const isAdminUser=me.email===ADMIN_EMAIL || isAdmin;
  if(!isOwnerStore && !isAdminUser){showToast("❌ غير مصرح","error");return;}
  const newName=document.getElementById("editStoreName").value.trim();
  const newCategory=document.getElementById("editStoreCategory").value;
  const newCity=document.getElementById("editStoreCity").value;
  const newDescription=document.getElementById("editStoreDescription").value.trim().slice(0,500);
  const newReceiptPhone=(document.getElementById("editStoreReceiptPhone")?.value||"").trim();
  const openTime=document.getElementById("editStoreOpenTime").value||"09:00";
  const closeTime=document.getElementById("editStoreCloseTime").value||"23:00";
  const alwaysOpen=document.getElementById("editStoreAlwaysOpen").checked;
  if(newName.length<2||newName.length>40){showToast("اسم المتجر بين 2 و40 حرف","warn");return;}
  if(!newCity){showToast("اختر المدينة","warn");return;}
  if(isRestaurantCategory(newCategory) && newReceiptPhone && newReceiptPhone.length<9){showToast("⚠️ رقم استلام الإيصالات قصير جداً","warn");return;}
  const bad=checkContent(newName,newDescription);
  if(bad){showToast("❌ كلمة ممنوعة: "+bad.word,"error");return;}
  const btn=document.getElementById("editStoreSubmitBtn");
  btn.disabled=true;btn.textContent="⏳ جاري الحفظ...";
  try{
    const newPhone=(document.getElementById("editStorePhone")?.value||"").trim();
    const newCallPhone=(document.getElementById("editStoreCallPhone")?.value||"").trim();
    const newOwnerEmail=(document.getElementById("editStoreOwnerEmail")?.value||"").trim();
    const finalCallPhone = isRestaurantCategory(newCategory) ? (newCallPhone || newPhone || store.callPhone || store.phone) : (newPhone || store.phone);
    const updates={name:newName,category:newCategory,city:newCity,receiptPhone:(isRestaurantCategory(newCategory)?newReceiptPhone:""),description:newDescription,workingHours:{openTime,closeTime,alwaysOpen},helpers:currentStoreHelpers,bankInfo:{
      accountOwner:(document.getElementById("editStoreBankOwner")?.value||"").trim().slice(0,60),
      bankName:(document.getElementById("editStoreBankName")?.value||"").trim().slice(0,50),
      iban:(document.getElementById("editStoreBankIban")?.value||"").trim().slice(0,34),
      accountNumber:(document.getElementById("editStoreBankAccount")?.value||"").trim().slice(0,30)
    }};
    if(newPhone) updates.phone = newPhone;
    updates.callPhone = finalCallPhone;
    updates.ownerEmail = newOwnerEmail;
    if(editStoreLogoImage){
      btn.textContent="⏳ جاري رفع الشعار الجديد...";
      updates.logo=await uploadToImgBB(editStoreLogoImage.file);
      store.logo=updates.logo;
    }
    if(editStoreCoverImage){
      btn.textContent="⏳ جاري رفع الغلاف الجديد...";
      updates.cover=await uploadToImgBB(editStoreCoverImage.file);
      store.cover=updates.cover;
    }
    btn.textContent="⏳ جاري الحفظ...";
    await updateDoc(doc(db,"stores",editStoreCurrentId),updates);
    Object.assign(store, updates);
    if(store.name!==newName || updates.category || updates.phone){
      try{
        const storePosts=allPosts.filter(p=>p.storeId===editStoreCurrentId);
        for(const p of storePosts){
          try{await updateDoc(doc(db,"posts",p.id),{storeName:newName,storeCategory:newCategory,storePhone:updates.phone||store.phone});}catch(e){}
        }
      }catch(e){}
    }
    // تحديث الإعلانات والمتجر في الذاكرة الحية فورياً
    allPosts.filter(p => p.storeId === editStoreCurrentId).forEach(p => {
      p.storeName = newName;
      if(updates.category) p.storeCategory = updates.category;
      if(updates.phone) p.storePhone = updates.phone;
    });
    if(myStore && myStore.id === editStoreCurrentId){
      Object.assign(myStore, updates);
    }
    renderPosts();
    renderStoresList();
    showToast("✅ تم حفظ التعديلات والشعار بنجاح","success");
    const savedId = editStoreCurrentId;
    closeOverlay();
    editStoreCurrentId = null;
    editStoreLogoImage = null;
    editStoreCoverImage = null;
    if(window._currentStoreId===savedId){setTimeout(()=>openStore(savedId,true),300);}
  }catch(e){showToast("❌ خطأ: "+e.message,"error");}
  finally{btn.disabled=false;btn.textContent="💾 حفظ التعديلات";}
};

/* ============================================
   فتح متجر جديد — بدون حذف الإعلانات الفردية
   ============================================ */
window.startOpenStore=async(asAdminClient)=>{
  if(!auth.currentUser){authOverlay.classList.remove("hidden");return;}
  const isAdminUser = isAdmin || (auth.currentUser && auth.currentUser.email === ADMIN_EMAIL);
  const isCreatingAsAdmin = isAdminUser && (asAdminClient || myStore);
  if(myStore && !isCreatingAsAdmin){showToast("⚠️ لديك متجر بالفعل","warn");return;}
  const userPhone=(myProfile&&myProfile.phone)||"";
  if(!userPhone && !isCreatingAsAdmin){showToast("❌ يجب تسجيل رقم الواتساب في حسابك أولاً.","error");return;}
  const myCount=allPosts.filter(p=>p.uid===auth.currentUser.uid && !p.storeId).length;
  if(myCount>0 && !isCreatingAsAdmin){
    showToast(`ℹ️ عندك ${myCount} إعلان فردي — تقدر تنقلهم لمتجرك بضغطة زر من صفحة المتجر بعد الموافقة`,"info",5000);
  }
  accountOverlay.classList.add("hidden");
  openStoreOverlay.classList.remove("hidden");
  storeLogoImage=null;storeCoverImage=null;
  document.getElementById("storeName").value="";
  document.getElementById("storeCategory").value="المطاعم والمأكولات";
  const _srp=document.getElementById("storeReceiptPhone");if(_srp)_srp.value="";
  const _scp=document.getElementById("storeCallPhone");if(_scp)_scp.value="";
  const _soe=document.getElementById("storeOwnerEmail");if(_soe)_soe.value="";
  toggleReceiptPhoneField();
  document.getElementById("storeCity").value="";

  const adminNotice=document.getElementById("adminStoreCreationNotice");
  const regularNotice=document.getElementById("openStoreRegularNotice");
  const emailField=document.getElementById("storeOwnerEmailField");
  const modalTitle=document.getElementById("openStoreModalTitle");
  const submitBtn=document.getElementById("storeSubmitBtn");
  const phoneInput=document.getElementById("storePhone");

  if(isCreatingAsAdmin){
    if(adminNotice)adminNotice.classList.remove("hidden");
    if(regularNotice)regularNotice.classList.add("hidden");
    if(emailField)emailField.style.display="block";
    if(modalTitle)modalTitle.textContent="👑 إنشاء صفحة متجر أو مطعم (كأدمن)";
    if(submitBtn)submitBtn.textContent="🚀 إنشاء واعتماد المتجر الآن";
    if(phoneInput){
      phoneInput.removeAttribute("readonly");
      phoneInput.placeholder="مثال: 0923456789";
      phoneInput.value="";
    }
  } else {
    if(adminNotice)adminNotice.classList.add("hidden");
    if(regularNotice)regularNotice.classList.remove("hidden");
    if(emailField)emailField.style.display="none";
    if(modalTitle)modalTitle.textContent="🏪 فتح متجر جديد";
    if(submitBtn)submitBtn.textContent="📤 إرسال طلب الفتح";
    if(phoneInput){
      phoneInput.setAttribute("readonly","readonly");
      phoneInput.value=userPhone;
    }
  }

  document.getElementById("storeDescription").value="";
  document.getElementById("storeOpenTime").value="09:00";
  document.getElementById("storeCloseTime").value="23:00";
  document.getElementById("storeAlwaysOpen").checked=false;
  document.getElementById("storeBankOwner").value="";
  document.getElementById("storeBankName").value="";
  document.getElementById("storeBankIban").value="";
  document.getElementById("storeBankAccount").value="";
  const delivEl=document.getElementById("storeDelivery");if(delivEl)delivEl.value="";
  renderStoreLogo();renderStoreCover();
};

window.handleStoreLogoSelected=()=>{const input=document.getElementById("storeLogoFile");const f=input.files[0];if(!f)return;storeLogoImage={file:f,previewUrl:URL.createObjectURL(f)};input.value="";renderStoreLogo();};
window.handleStoreCoverSelected=()=>{const input=document.getElementById("storeCoverFile");const f=input.files[0];if(!f)return;storeCoverImage={file:f,previewUrl:URL.createObjectURL(f)};input.value="";renderStoreCover();};
function renderStoreLogo(){const box=document.getElementById("storeLogoThumbs");box.innerHTML=storeLogoImage?`<div class="imgThumb"><img src="${storeLogoImage.previewUrl}"><button class="rm" onclick="storeLogoImage=null;renderStoreLogo()">×</button></div>`:"";document.getElementById("storeLogoAddTile").classList.toggle("hidden",!!storeLogoImage);}
function renderStoreCover(){const box=document.getElementById("storeCoverThumbs");box.innerHTML=storeCoverImage?`<div class="imgThumb"><img src="${storeCoverImage.previewUrl}"><button class="rm" onclick="storeCoverImage=null;renderStoreCover()">×</button></div>`:"";document.getElementById("storeCoverAddTile").classList.toggle("hidden",!!storeCoverImage);}

window.submitStore=async()=>{
  if(!auth.currentUser)return;
  const isAdminUser=isAdmin || (auth.currentUser && auth.currentUser.email === ADMIN_EMAIL);
  const isCreatingAsAdmin=isAdminUser && !document.getElementById("adminStoreCreationNotice")?.classList.contains("hidden");
  const name=document.getElementById("storeName").value.trim();
  const category=document.getElementById("storeCategory").value;
  const isRest=isRestaurantCategory(category);
  const city=document.getElementById("storeCity").value;
  const description=document.getElementById("storeDescription").value.trim().slice(0,500);
  const ownerEmail=(document.getElementById("storeOwnerEmail")?.value||"").trim();
  const callPhone=(document.getElementById("storeCallPhone")?.value||"").trim();
  const inputPhone=(document.getElementById("storePhone")?.value||"").trim();
  const userPhone=(myProfile&&myProfile.phone)||"";
  const phone=isCreatingAsAdmin ? inputPhone : userPhone;
  const receiptPhone=document.getElementById("storeReceiptPhone")?.value.trim()||"";

  if(!phone){
    showToast(isRest?"❌ يرجى إدخال رقم الواتساب للمطعم":"❌ يرجى إدخال رقم الهاتف والواتساب للمتجر","error");
    return;
  }
  if(isRest && receiptPhone && receiptPhone.length<9){showToast("⚠️ رقم استلام الإيصالات قصير جداً","warn");return;}
  if(name.length<2||name.length>40){showToast("اسم المتجر بين 2 و40 حرف","warn");return;}
  if(!city){showToast("اختر المدينة","warn");return;}
  if(!storeLogoImage){showToast("أضف شعار المتجر / المطعم","warn");return;}
  const bad=checkContent(name,description);
  if(bad){showToast("❌ يحتوي على كلمة ممنوعة: "+bad.word,"error");return;}
  const openTime=document.getElementById("storeOpenTime")?.value||"09:00";
  const closeTime=document.getElementById("storeCloseTime")?.value||"23:00";
  const alwaysOpen=document.getElementById("storeAlwaysOpen")?.checked||false;
  const deliveryCompany=document.getElementById("storeDelivery")?.value||"";
  const btn=document.getElementById("storeSubmitBtn");btn.disabled=true;btn.textContent="جاري الحفظ...";
  try{
    const logoUrl=await uploadToImgBB(storeLogoImage.file);
    let coverUrl="";
    if(storeCoverImage)coverUrl=await uploadToImgBB(storeCoverImage.file);
    const bankInfo={
      accountOwner:(document.getElementById("storeBankOwner")?.value||"").trim().slice(0,60),
      bankName:(document.getElementById("storeBankName")?.value||"").trim().slice(0,50),
      iban:(document.getElementById("storeBankIban")?.value||"").trim().slice(0,34),
      accountNumber:(document.getElementById("storeBankAccount")?.value||"").trim().slice(0,30)
    };
    const finalCallPhone = isRest ? (callPhone || phone) : phone;
    const storeData={
      ownerUid: isCreatingAsAdmin ? ("admin_client_" + Date.now()) : auth.currentUser.uid,
      ownerUsername: isCreatingAsAdmin ? "" : ((myProfile&&myProfile.username)||""),
      ownerMemberNo: isCreatingAsAdmin ? null : ((myProfile&&myProfile.memberNo)||null),
      ownerEmail: ownerEmail || "", // Email is completely optional!
      createdByAdmin: isCreatingAsAdmin,
      name,
      category,
      city,
      phone,
      callPhone: finalCallPhone,
      receiptPhone: isRest ? receiptPhone : "",
      description,
      logo: logoUrl,
      cover: coverUrl,
      workingHours:{openTime,closeTime,alwaysOpen},
      deliveryCompany,
      bankInfo,
      helpers:[],
      status: isCreatingAsAdmin ? "approved" : "pending",
      rejectReason:"",
      createdAt:Date.now(),
      approvedAt: isCreatingAsAdmin ? Date.now() : null,
      verified: isCreatingAsAdmin ? true : false
    };
    const ref=await addDoc(collection(db,"stores"),storeData);
    if(!isCreatingAsAdmin){
      try{await updateDoc(doc(db,"profiles",auth.currentUser.uid),{storeId:ref.id});}catch(e){}
      showToast("✅ تم إرسال طلب فتح المتجر — سيظهر بعد موافقة الإدارة","success");
      closeOverlay();
    } else {
      showToast("✅ تم إنشاء واعتماد المتجر بنجاح! يمكنك إضافة الوجبات والمنتجات له الآن","success", 5000);
      closeOverlay();
      setTimeout(()=>openStore(ref.id, false, "stores"), 300);
    }
  }catch(e){showToast("خطأ: "+e.message,"error");}
  finally{btn.disabled=false;btn.textContent=isCreatingAsAdmin?"🚀 إنشاء واعتماد المتجر الآن":"📤 إرسال طلب الفتح";}
};

/* ============================================
   إدارة المتاجر (أدمن)
   ============================================ */
window.switchStoresTab=(tab)=>{storesModTab=tab;renderStoresModeration();};

window.toggleStoreVerify=async(id)=>{
  if(!isAdmin)return;
  const store=allStores.find(s=>s.id===id);
  if(!store){showToast("❌ المتجر غير موجود","error");return;}
  const isVerified=!!store.verified;
  const msg=isVerified ? `هل أنت متأكد من إلغاء توثيق المتجر: "${store.name}"؟` : `هل ترغب في توثيق المتجر: "${store.name}"؟\n\nستظهر شارة التوثيق الزرقاء (✓) على المتجر وإعلاناته.`;
  const ok = await showConfirmModal(msg, { icon: isVerified ? "❌" : "🛡️", isDanger: isVerified, confirmText: isVerified ? "نعم، إلغاء التوثيق" : "نعم، توثيق المتجر" });
  if(!ok) return;
  try{
    await updateDoc(doc(db,"stores",id),{
      verified:!isVerified,
      verifiedAt:!isVerified?Date.now():null,
      verifiedBy:!isVerified?(auth.currentUser&&auth.currentUser.email)||"admin":null
    });
    showToast(isVerified?"✅ تم إلغاء التوثيق":"✅ تم توثيق المتجر بنجاح","success");
    renderStoresModeration();
  }catch(e){showToast("خطأ: "+e.message,"error");}
};

function renderStoresModeration(){
  const list=document.getElementById("storesModerationList");if(!list)return;
  const tabs={all:"smTabAll",pending:"smTabPending",approved:"smTabApproved",rejected:"smTabRejected"};
  Object.entries(tabs).forEach(([k,id])=>{const b=document.getElementById(id);if(!b)return;const active=storesModTab===k;b.style.border=active?"3px solid #0284c7":"2px solid transparent";b.style.transform=active?"scale(1.05)":"scale(1)";});
  let filtered=allStores;
  if(storesModTab==="pending")filtered=allStores.filter(s=>s.status==="pending");
  else if(storesModTab==="approved")filtered=allStores.filter(s=>s.status==="approved");
  else if(storesModTab==="rejected")filtered=allStores.filter(s=>s.status==="rejected");
  filtered=filtered.slice().sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  if(filtered.length===0){list.innerHTML="<div class='reportsEmpty'>لا توجد متاجر في هذا القسم</div>";return;}
  list.innerHTML=filtered.map(s=>{
    const logo=s.logo?`<img src="${escapeHtml(s.logo)}" style="width:70px;height:70px;border-radius:12px;object-fit:cover;border:1px solid var(--border)">`:`<div style="width:70px;height:70px;border-radius:12px;background:#e6f6fe;display:flex;align-items:center;justify-content:center;font-size:30px">🏪</div>`;
    let border="2px dashed #f59e0b",bg="#fffbf0",label="⏳ قيد المراجعة";
    if(s.status==="approved"){border="2px solid #16a34a";bg="#f0fdf4";label="✅ معتمد";}
    else if(s.status==="rejected"){border="2px solid #e5484d";bg="#fdeceb";label="❌ مرفوض";}
    const count=allPosts.filter(p=>p.storeId===s.id).length;
    const verifiedBadge=s.verified?`<span class="verifiedBadge" title="موثق"></span>`:"";
    const isRest=isRestaurantStore(s);
    const badgeHTML=isRest?`<span class="restaurantBadge">🍽️ مطعم</span>`:`<span class="storeBadge">🏢 شركة/متجر</span>`;
    return `<div style="border:${border};border-radius:14px;padding:12px;margin-bottom:14px;background:${bg}"><div style="font-size:12px;font-weight:800;margin-bottom:8px">${label} · 📦 ${count} منتج · ${badgeHTML} ${s.verified?'· <span style="color:#1877F2">✓ موثق</span>':''}</div><div style="display:flex;gap:12px;align-items:center">${logo}<div style="flex:1"><div style="font-weight:800;font-size:16px">${escapeHtml(s.name)} ${verifiedBadge}</div><div style="font-size:12px;color:var(--muted);margin-top:4px">📁 ${escapeHtml(s.category)} · 📍 ${escapeHtml(s.city)}</div></div></div><div style="background:#fff;padding:10px;border-radius:10px;margin-top:10px;font-size:13px;line-height:1.8;border:1px solid var(--border)">${escapeHtml(s.description||"لا يوجد وصف")}</div><div style="font-size:12px;color:var(--muted);margin-top:8px;line-height:1.7">👤 ${escapeHtml(s.ownerUsername?"@"+s.ownerUsername:(s.ownerMemberNo?"#"+s.ownerMemberNo:"—"))} · 💬 واتساب: ${escapeHtml(s.phone||"")}${s.callPhone?" · 📞 هاتف: "+escapeHtml(s.callPhone):""}${s.ownerEmail?" · 📧 "+escapeHtml(s.ownerEmail):" · 📧 الإيميل: <i>فارغ</i>"} · ⏰ ${timeAgo(s.createdAt)}${s.deliveryCompany?"<br>🛵 التوصيل: "+escapeHtml(s.deliveryCompany):""}${s.rejectReason?"<br>📝 <b>سبب الرفض:</b> "+escapeHtml(s.rejectReason):""}${s.receiptPhone?"<br>🧾 واتساب الإيصالات: "+escapeHtml(s.receiptPhone):""}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:12px">${s.status!=="approved"?`<button onclick="approveStore('${s.id}')" style="padding:10px;border:none;border-radius:9px;background:#16a34a;color:#fff;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer">✅ موافقة</button>`:""}${s.status!=="rejected"?`<button onclick="rejectStore('${s.id}')" style="padding:10px;border:none;border-radius:9px;background:#f59e0b;color:#3a2500;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer">🚫 رفض</button>`:""}<button onclick="openStore('${s.id}',false,'categories')" style="padding:10px;border:none;border-radius:9px;background:#0284c7;color:#fff;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer">👁️ عرض المتجر</button><button onclick="openStore('${s.id}',false,'categories');setTimeout(()=>goAddStorePost('${s.id}'),300)" style="padding:10px;border:none;border-radius:9px;background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#3a2500;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer">➕ إضافة منتج/وجبة</button><button onclick="toggleStoreVerify('${s.id}')" style="padding:10px;border:none;border-radius:9px;background:${s.verified?'#8a93a3':'#1877F2'};color:#fff;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer">${s.verified?'✕ إلغاء توثيق':'✓ توثيق'}</button><button onclick="deleteStore('${s.id}')" style="padding:10px;border:none;border-radius:9px;background:#e5484d;color:#fff;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer">🗑️ حذف</button></div></div>`;
  }).join("");
}
window.approveStore=async(id)=>{if(!isAdmin)return;try{await updateDoc(doc(db,"stores",id),{status:"approved",approvedAt:Date.now(),rejectReason:""});showToast("✅ تم قبول المتجر","success");renderStoresModeration();}catch(e){showToast("خطأ: "+e.message,"error");}};
window.rejectStore=async(id)=>{if(!isAdmin)return;const reason=await showPromptModal("سبب رفض المتجر:","معلومات غير كافية",{title:"رفض المتجر",icon:"🚫",confirmText:"رفض المتجر"});if(reason===null)return;try{await updateDoc(doc(db,"stores",id),{status:"rejected",rejectReason:reason||"مرفوض",rejectedAt:Date.now()});showToast("✅ تم رفض المتجر","success");renderStoresModeration();}catch(e){showToast("خطأ: "+e.message,"error");}};
window.deleteStore=async(id)=>{
  if(!isAdmin)return;
  const store=allStores.find(s=>s.id===id);
  if(!store)return;
  const count=allPosts.filter(p=>p.storeId===id).length;
  const confirmed = await showConfirmModal(`⚠️ تأكيد الحذف النهائي لمتجر "${store.name}" وكافة المنتجات التابعة له؟`, {
    isDanger: true,
    confirmText: "نعم، حذف نهائي"
  });
  if(!confirmed) return;
  try{
    let okP=0;
    // جلب وحذف كافة منتجات المتجر من قاعدة البيانات حتى لو لم تكن محملة في الذاكرة
    let storePostDocs = [];
    try {
      const qSnap = await getDocs(query(collection(db, "posts"), where("storeId", "==", id)));
      qSnap.forEach(d => storePostDocs.push({ id: d.id }));
    } catch(e) {
      storePostDocs = allPosts.filter(p => p.storeId === id);
    }
    for(const p of storePostDocs){
      try{
        await deleteDoc(doc(db,"posts",p.id));
        okP++;
      }catch(e){}
    }
    await deleteDoc(doc(db,"stores",id));
    if(store.ownerUid){
      try{
        await setDoc(doc(db,"profiles",store.ownerUid),{storeId:null},{merge:true});
      }catch(e){}
    }
    allPosts = allPosts.filter(p => p.storeId !== id);
    allStores = allStores.filter(s => s.id !== id);
    if(cart.storeId===id){
      cart={storeId:null,storeName:"",storePhone:"",items:[]};
      saveCart();
      updateCartUI();
    }
    renderPosts();
    renderStoresList();
    showToast(`✅ تم حذف المتجر مع ${okP} منتج بنجاح`,"success");
    renderStoresModeration();
  }catch(e){showToast("خطأ: "+e.message,"error");}
};

window.transferStoreOwnership = async(storeId, newOwnerUid) => {
  if(!isAdmin){ showToast("صلاحية للأدمن فقط", "warn"); return; }
  if(!storeId || !newOwnerUid){ showToast("يرجى إدخال معرف المتجر ومعرف المالك الجديد", "warn"); return; }
  try {
    const store = allStores.find(s => s.id === storeId);
    if(!store){ showToast("المتجر غير موجود", "error"); return; }
    await updateDoc(doc(db, "stores", storeId), {
      ownerUid: newOwnerUid,
      createdByAdmin: false
    });
    try {
      await setDoc(doc(db, "profiles", newOwnerUid), { storeId: storeId }, { merge: true });
    } catch(e){}
    store.ownerUid = newOwnerUid;
    store.createdByAdmin = false;
    showToast(`✅ تم نقل ملكية متجر "${store.name}" بنجاح للمستخدم الجديد`, "success");
    renderStoresModeration();
  } catch(e) {
    showToast("خطأ أثناء نقل الملكية: " + e.message, "error");
  }
};
  /* ============================================
   تعديل الإعلان (editPost) — مع خيارات السعر
   ============================================ */
window.editPost=(id)=>{
if(!auth.currentUser)return;
const post=allPosts.find(p=>p.id===id);if(!post)return;
editingPostId=id;
window._isStorePost=!!post.storeId;
if(post.storeId){const data={id:post.storeId,name:post.storeName||"",category:post.storeCategory||post.category||"سيارات ومركبات",city:post.city||"",phone:post.storePhone||post.phone||"",status:"approved"};_tempStoreData=data;try{sessionStorage.setItem('_tempStoreData',JSON.stringify(data));}catch(e){}}
document.getElementById("formHeaderTitle").textContent=post.storeId?"تعديل إعلان المتجر":"تعديل الإعلان";
document.getElementById("saveBtn").textContent="حفظ التعديلات";
document.getElementById("title").value=post.title||"";
document.getElementById("price").value=(post.priceType==="contact"?"":(post.price||""));
const _cCbE=document.getElementById("contactPrice");if(_cCbE)_cCbE.checked=(post.priceType==="contact");
const _nCbE=document.getElementById("negotiablePrice");if(_nCbE)_nCbE.checked=!!post.negotiable;
document.getElementById("originalPrice").value=post.originalPrice||"";
document.getElementById("discountField").style.display="block";
setTimeout(()=>{if(typeof updateDiscountPreview==="function")updateDiscountPreview();},100);
document.getElementById("category").value=post.category||"سيارات ومركبات";
document.getElementById("city").value=post.city||"";
const userPhone=(myProfile&&myProfile.phone)||post.phone||"";
document.getElementById("phone").value=userPhone||"⚠️ لم تسجل رقمك بعد";
document.getElementById("phone").setAttribute("readonly","readonly");
document.getElementById("description").value=post.description||"";
updateDescCount();document.getElementById("termsBox").classList.add("hidden");
const adTypeVal=post.adType||"offer";
const radio=document.querySelector(`input[name="adType"][value="${adTypeVal}"]`);
if(radio)radio.checked=true;
onAdTypeChange();
onCategoryChange();if(post.brand)document.getElementById("brand").value=post.brand;
renderDynamicSpecsForm(post.category, post.specs);
const subCatField=document.getElementById("storeSubCategoryField");
const subCatInput=document.getElementById("storeSubCategory");
const subCatTags=document.getElementById("storeSubCategoryTags");
if(subCatField && subCatInput){
  if(post.storeId){
    subCatField.classList.remove("hidden");
    subCatInput.value=post.subCategory||"";
    const isRest=isRestaurantCategory(post.storeCategory||post.category);
    const tagList=isRest
      ? ['برجر', 'ساندوتشات مشاوي', 'وجبات سريعة', 'بيتزا', 'مقبلات ساخنة', 'مشروبات', 'حلويات وكريب']
      : ['Apple / آيفون', 'Samsung / سامسونج', 'Xiaomi / شاومي', 'Huawei / هواوي', 'Honor / هونر', 'كفر', 'شواحن', 'كابل شحن', 'سماعات', 'حاملة هاتف', 'ساعات ذكية', 'باور بانك', 'حماية شاشة'];
    if(subCatTags) subCatTags.innerHTML=tagList.map(tag=>`
      <button type="button" onclick="document.getElementById('storeSubCategory').value='${tag}'" style="border:1px solid var(--border);background:var(--card);color:var(--text);border-radius:8px;padding:4px 8px;font-size:11px;font-weight:700;cursor:pointer">${tag}</button>
    `).join('');
  } else {
    subCatField.classList.add("hidden");
    subCatInput.value="";
  }
}
const existing=(post.images&&post.images.length)?post.images:(post.imageUrl?[post.imageUrl]:[]);
selectedImages=existing.map(url=>({type:"existing",url}));
renderImagePicker();onPriceTypeChange();openFormScreen();
window.scrollTo(0,0);
};

/* ============================================
   فتح نموذج إضافة إعلان (showForm)
   ============================================ */
window.showForm=async(isStorePost)=>{
if(!auth.currentUser){pendingAction="form";authOverlay.classList.remove("hidden");return;}
const isStore=!!isStorePost;
if(isStore && !_tempStoreData){
  try{
    const saved=sessionStorage.getItem('_tempStoreData');
    if(saved) _tempStoreData=JSON.parse(saved);
  }catch(e){}
}
const storeForPost=isStore && _tempStoreData ? _tempStoreData : myStore;
if(isStore && (!storeForPost || storeForPost.status!=="approved")){showToast("⚠️ لا يمكنك النشر كمتجر — المتجر غير معتمد","warn");return;}
if(!isStore && !isAdmin){
  const myCount=allPosts.filter(p=>p.uid===auth.currentUser.uid && !p.storeId).length;
  const limit=await getUserLimit(auth.currentUser.uid);
  if(myCount>=limit){
    const msg=`🛒 طلب إعلانات إضافية\n\n👤 ${(myProfile&&myProfile.name)||'مستخدم'}\n📊 ${myCount}\n⚙️ ${limit}`;
    const waUrl=`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`;
    const ok = await showConfirmModal(`⚠️ وصلت للحد الأقصى للإعلانات المسموح بها (${limit}).\n\nهل ترغب في التواصل مع الإدارة لطلب زيادة الحد؟`, { title: "الحد الأقصى للإعلانات", icon: "⚠️", danger: false, confirmText: "📱 مراسلة عبر واتساب", cancelText: "إلغاء" });
    if(ok) window.open(waUrl,'_blank');
    return;
  }
}else if(isStore && !isAdmin){
  const stCount=allPosts.filter(p=>p.storeId===storeForPost.id).length;
  const storeLimit=await getUserStoreLimit(auth.currentUser.uid);
  if(stCount>=storeLimit){
    const msg=`🛒 طلب إعلانات المتجر\n\n🏪 ${storeForPost.name}\n📊 ${stCount}\n⚙️ ${storeLimit}`;
    const waUrl=`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`;
    const ok = await showConfirmModal(`⚠️ وصلت للحد الأقصى لمنتجات المتجر (${storeLimit}).\n\nهل ترغب في التواصل مع الإدارة لطلب زيادة حد المتجر؟`, { title: "حد منتجات المتجر", icon: "🏪", danger: false, confirmText: "📱 مراسلة عبر واتساب", cancelText: "إلغاء" });
    if(ok) window.open(waUrl,'_blank');
    return;
  }
}
editingPostId=null;
window._isStorePost=isStore;
const activeStore=isStore ? storeForPost : null;
document.getElementById("formHeaderTitle").textContent=isStore?("🏪 إعلان جديد لـ "+activeStore.name):"إضافة إعلان";
document.getElementById("saveBtn").textContent="نشر الإعلان";
document.getElementById("title").value="";document.getElementById("price").value="";
document.getElementById("originalPrice").value="";
document.getElementById("discountPreview").textContent="";
document.getElementById("discountField").style.display="block";
const userPhone=(myProfile&&myProfile.phone)||"";
const displayPhone = (isStore && activeStore && (activeStore.phone || activeStore.callPhone)) ? (activeStore.phone || activeStore.callPhone) : userPhone;
document.getElementById("phone").value=displayPhone?formatCallPhone(displayPhone):"⚠️ لم تسجل رقمك بعد";
document.getElementById("phone").setAttribute("readonly","readonly");
document.getElementById("city").value=(isStore?activeStore.city:"");
document.getElementById("description").value="";
document.getElementById("category").value=(isStore?activeStore.category:"سيارات ومركبات");document.getElementById("brand").value="";
const subCatField=document.getElementById("storeSubCategoryField");
const subCatInput=document.getElementById("storeSubCategory");
const subCatTags=document.getElementById("storeSubCategoryTags");
if(subCatField && subCatInput){
  if(isStore && activeStore){
    subCatField.classList.remove("hidden");
    subCatInput.value="";
    const isRest=isRestaurantStore(activeStore);
    const tagList=isRest
      ? ['برجر', 'ساندوتشات مشاوي', 'وجبات سريعة', 'بيتزا', 'مقبلات ساخنة', 'مشروبات', 'حلويات وكريب']
      : ['Apple / آيفون', 'Samsung / سامسونج', 'Xiaomi / شاومي', 'Huawei / هواوي', 'Honor / هونر', 'كفر', 'شواحن', 'كابل شحن', 'سماعات', 'حاملة هاتف', 'ساعات ذكية', 'باور بانك', 'حماية شاشة'];
    if(subCatTags) subCatTags.innerHTML=tagList.map(tag=>`
      <button type="button" onclick="document.getElementById('storeSubCategory').value='${tag}'" style="border:1px solid var(--border);background:var(--card);color:var(--text);border-radius:8px;padding:4px 8px;font-size:11px;font-weight:700;cursor:pointer">${tag}</button>
    `).join('');
  } else {
    subCatField.classList.add("hidden");
    subCatInput.value="";
  }
}
updateDescCount();document.getElementById("termsCheck").checked=false;
document.getElementById("termsBox").classList.remove("hidden");
const offerRadio=document.querySelector('input[name="adType"][value="offer"]');
if(offerRadio)offerRadio.checked=true;
onAdTypeChange();
const _cCbS=document.getElementById("contactPrice");if(_cCbS)_cCbS.checked=false;
const _nCbS=document.getElementById("negotiablePrice");if(_nCbS)_nCbS.checked=false;
onPriceTypeChange();
selectedImages=[];renderImagePicker();
currentFormSpecsState={};
const _dynC=document.getElementById("dynamicSpecsContainer");
if(_dynC){_dynC.classList.add("hidden");_dynC.innerHTML="";}onCategoryChange();openFormScreen();
window.scrollTo(0,0);
};

/* ============================================
   شاشات: إعلاناتي + المفضلة + متابَعين
   ============================================ */
function showMyPostsDirect(){if(!auth.currentUser){pendingAction="mine";authOverlay.classList.remove("hidden");return;}showOnlyMine=true;showOnlyFavorites=false;currentSubCategory="الكل";currentStoreFilter=null;const cr=document.getElementById("catsRow");if(cr)cr.classList.add("hidden");renderSubCats();hideSearchDropdown();const titleEl=document.getElementById("categoryTitle");if(titleEl)titleEl.textContent="إعلاناتي";categoriesScreen.classList.add("hidden");home.classList.remove("hidden");form.classList.add("hidden");const ss=document.getElementById("storesScreen");if(ss)ss.classList.add("hidden");const sc=document.getElementById("storeScreen");if(sc)sc.classList.add("hidden");closeOverlayDirect();setActiveNav("mine");setTopbarMode("scroll");renderPosts();updateCartUI();window.scrollTo(0,0);hideFloatingButtons();}
window.showMyPostsDirect=showMyPostsDirect;
window.showMyPosts=(skipHistory)=>{showMyPostsDirect();if(!skipHistory&&auth.currentUser)pushNavState({screen:'mine'},'#my-posts');};

function showFavoritesDirect(){if(showOnlyFavorites && !showOnlyMine){showCategoriesScreen();return;}showOnlyFavorites=true;showOnlyMine=false;currentSubCategory="الكل";currentStoreFilter=null;const cr=document.getElementById("catsRow");if(cr)cr.classList.add("hidden");renderSubCats();hideSearchDropdown();const titleEl=document.getElementById("categoryTitle");if(titleEl)titleEl.textContent="❤️ المفضلة";categoriesScreen.classList.add("hidden");home.classList.remove("hidden");form.classList.add("hidden");const ss=document.getElementById("storesScreen");if(ss)ss.classList.add("hidden");const sc=document.getElementById("storeScreen");if(sc)sc.classList.add("hidden");closeOverlayDirect();setActiveNav("fav");setTopbarMode("scroll");renderPosts();updateCartUI();window.scrollTo(0,0);hideFloatingButtons();}
window.showFavoritesDirect=showFavoritesDirect;
window.showFavorites=(skipHistory)=>{showFavoritesDirect();if(!skipHistory)pushNavState({screen:'fav'},'#favorites');};

function setActiveNav(w){
  if(navHome) navHome.classList.toggle("active",w==="home");
  if(navMine) navMine.classList.toggle("active",w==="mine");
  if(navFav) navFav.classList.toggle("active",w==="fav");
  const na = document.getElementById("navAccount");
  if(na) na.classList.toggle("active",w==="account");
}
window.showHome=()=>{showCategoriesScreen();};

window.showFollowingPosts=()=>{
  const me=auth.currentUser;
  if(!me){pendingAction="following";authOverlay.classList.remove("hidden");return;}
  if(myFollowing.length===0){showToast("👥 لم تتابع أي بائع بعد","info");return;}
  const ids=myFollowing.map(f=>f.uid);
  showOnlyMine=false;showOnlyFavorites=false;currentSubCategory="الكل";currentStoreFilter=null;
  const titleEl=document.getElementById("categoryTitle");
  if(titleEl)titleEl.textContent="👥 إعلانات متابَعينك";
  categoriesScreen.classList.add("hidden");home.classList.remove("hidden");form.classList.add("hidden");
  closeOverlayDirect();setActiveNav("home");setTopbarMode("scroll");
  renderSubCats();
  const originalList=allPosts;
  const posts=allPosts.filter(p=>ids.includes(p.uid) && getStatus(p)==="approved" && !isExpired(p) && !p.sold);
  if(posts.length===0){postsBox.innerHTML="<div class='empty'>لا توجد إعلانات من متابَعيك</div>";}
  else{allPosts=sortPosts(posts);renderPosts();allPosts=originalList;}
  updateCartUI();window.scrollTo(0,0);hideFloatingButtons();
};

/* ============================================
   إضافة إعلان (زر ➕)
   ============================================ */
function openFormScreen(skipHistory){
  const _preserved=_tempStoreData;
  home.classList.add("hidden");
  form.classList.remove("hidden");
  categoriesScreen.classList.add("hidden");
  closeOverlayDirect();
  _tempStoreData=_preserved;
  hideFloatingButtons();
  if(!skipHistory) pushNavState({ screen: 'form' }, '#add');
}
window.startAddPost=async()=>{
  if(!auth.currentUser){pendingAction="postType";authOverlay.classList.remove("hidden");return;}
  const hasApprovedStore=myStore && myStore.status==="approved";
  const storeBtn=document.getElementById("storePostBtn");
  const openStoreBtn=document.getElementById("openStoreFromPlusBtn");
  if(storeBtn)storeBtn.style.display=hasApprovedStore?"flex":"none";
  if(openStoreBtn)openStoreBtn.style.display=(!myStore)?"flex":"none";
  postTypeOverlay.classList.remove("hidden");
};
window.chooseOpenStoreFromPlus=()=>{closeOverlay();setTimeout(()=>startOpenStore(),300);};
window.chooseIndividualPost=async()=>{
  if(myStore && myStore.status==="approved"){
    const ok = await showConfirmModal("⚠️ لديك متجر معتمد في المنصة.\n\nعند النشر كإعلان فردي:\n• لن يظهر في صفحة متجرك\n• سيُحسب من حدك الشخصي للإعلانات الفردية\n\nهل ترغب في المتابعة ونشره كإعلان فردي؟", { confirmText: "نعم، إعلان فردي", cancelText: "الرجوع" });
    if(!ok) return;
  }
  closeOverlay();
  _tempStoreData=null;
  try{sessionStorage.removeItem('_tempStoreData');}catch(e){}
  showForm();
};
window.chooseStorePost=()=>{closeOverlay();if(myStore && myStore.status==="approved"){const data={id:myStore.id,name:myStore.name,category:myStore.category,city:myStore.city,phone:myStore.phone||"",status:myStore.status};_tempStoreData=data;try{sessionStorage.setItem('_tempStoreData',JSON.stringify(data));}catch(e){}}showForm(true);};

/* ============================================
   مدينة/قسم/ماركة
   ============================================ */
function populateCitySelects(){
  const g=Object.entries(LIBYA_CITIES).map(([r,c])=>`<optgroup label="${r}">${c.map(x=>`<option value="${x}">${x}</option>`).join("")}</optgroup>`).join("");
  const cf=document.getElementById("cityFilter");if(cf)cf.innerHTML=`<option value="الكل">📍 كل المدن</option>${g}`;
  const cfc=document.getElementById("cityFilterCat");if(cfc)cfc.innerHTML=`<option value="الكل">📍 كل المدن</option>${g}`;
  document.getElementById("city").innerHTML=`<option value="">اختر المدينة</option>${g}`;
  const sc=document.getElementById("storeCity");if(sc)sc.innerHTML=`<option value="">اختر المدينة</option>${g}`;
  const esc=document.getElementById("editStoreCity");if(esc)esc.innerHTML=`<option value="">اختر المدينة</option>${g}`;
}
populateCitySelects();

function populateCategorySelects(){
  const list = CATEGORIES.filter(c => !c.isStore && c.name !== "الكل").map(c => c.name);
  const opts = list.map(n => `<option>${n}</option>`).join("");
  ["category","storeCategory","editStoreCategory"].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.innerHTML = opts;
  });
}
populateCategorySelects();

function populateBrandSelect(cat){
  const sel=document.getElementById("brand");if(!sel)return;
  let brands=[];
  if(cat==="سيارات ومركبات")brands=CAR_BRANDS;
  else if(cat==="دراجات نارية")brands=MOTORCYCLE_BRANDS;
  else if(cat==="موبايل وتابلت")brands=PHONE_BRANDS;
  else if(cat==="لابتوب وكمبيوتر")brands=COMPUTER_BRANDS;
  else if(cat==="الحيوانات والطيور")brands=ANIMAL_TYPES;
  else if(cat==="العطور")brands=PERFUME_TYPES;
  if(brands.length===0){sel.innerHTML='<option value="">اختر (اختياري)</option>';return;}
  sel.innerHTML=`<option value="">اختر (اختياري)</option>`+brands.map(b=>`<option value="${b}">${b}</option>`).join("");
}
populateBrandSelect("سيارات ومركبات");
window.onCategoryChange=()=>{
  const cat=document.getElementById("category").value;
  const bf=document.getElementById("brandField");
  const bl=document.getElementById("brandLabel");
  if(cat==="سيارات ومركبات"||cat==="دراجات نارية"||cat==="موبايل وتابلت"||cat==="لابتوب وكمبيوتر"){
    bf.classList.remove("hidden");bl.textContent="الماركة";populateBrandSelect(cat);
  }else if(cat==="الحيوانات والطيور"||cat==="العطور"){
    bf.classList.remove("hidden");bl.textContent="النوع";populateBrandSelect(cat);
  }else{
    bf.classList.add("hidden");document.getElementById("brand").value="";
  }
  renderDynamicSpecsForm(cat, currentFormSpecsState && currentFormSpecsState._category === cat ? currentFormSpecsState : null);
};

(function(){
  const cr=document.getElementById("catsRow");
  if(!cr)return;
  cr.innerHTML=CATEGORIES.map((c,i)=>{
    if(c.isStore)return `<button class="catChip storeChip" onclick="openStores('stores')">🏢 الشركات والمتاجر</button>`;
    if(c.isRestaurantDirectory || isRestaurantCategory(c.name))return `<button class="catChip restaurantChip" onclick="openRestaurants()">🍽️ المطاعم والمأكولات</button>`;
    const isActive = c.name === "الكل";
    return `<button class="catChip${isActive?" active":""}" data-cat="${c.name}" onclick="filterCategory('${c.name.replace(/'/g,"\\'")}')"><span style="display:inline-flex;width:16px;height:16px;border-radius:50%;background:${c.color||'#38bdf8'};align-items:center;justify-content:center;margin-left:4px;flex:0 0 auto"><i data-lucide="${c.iconName||'circle'}" style="width:10px;height:10px;color:#fff"></i></span>${c.name}</button>`;
  }).join("");
  if(window.lucide) lucide.createIcons();
})();
setTimeout(updateClearBtn,500);
setTimeout(updateCompareUI,300);
window.filterCity=()=>{currentCity=document.getElementById("cityFilter").value;renderPosts();};
window.filterCategory=(cat)=>{
  currentCategory=cat;currentSubCategory="الكل";currentStoreFilter=null;showOnlyMine=false;showOnlyFavorites=false;
  const titleEl=document.getElementById("categoryTitle");
  if(titleEl)titleEl.textContent=cat==="الكل"?"كل الإعلانات":cat;
  const cr=document.getElementById("catsRow");
  if(cr) cr.classList.toggle("hidden", cat!=="الكل");
  document.querySelectorAll(".catChip").forEach(b=>b.classList.toggle("active",b.dataset.cat===cat&&!b.classList.contains("storeChip")&&!b.classList.contains("restaurantChip")));
  renderSubCats();renderPosts();
};
function renderSubCats(){
  if(!subCatsRow)return;
  const subs=SUB_CATEGORIES[currentCategory];
  if(!subs){subCatsRow.classList.add("hidden");subCatsRow.innerHTML="";return;}
  subCatsRow.classList.remove("hidden");
  subCatsRow.innerHTML=`<span class="subCatTitle">${subs.title}</span><button class="subCatChip ${currentSubCategory==="الكل"?"active":""}" onclick="filterSubCategory('الكل')">الكل</button>${subs.items.map(b=>`<button class="subCatChip ${currentSubCategory===b?"active":""}" onclick="filterSubCategory('${b.replace(/'/g,"\\'")}')">${b}</button>`).join("")}`;
}
window.filterSubCategory=(sub)=>{currentSubCategory=sub;renderSubCats();renderPosts();};

/* ============================================
   حسابي (صفحة كاملة Full Screen)
   ============================================ */
async function syncFullUserProfile(uid){
  if(!uid) return;
  try {
    // 1. جلب مباشر لسجل البروفايل
    const profSnap = await getDoc(doc(db, "profiles", uid));
    let profData = (profSnap && profSnap.exists()) ? (profSnap.data() || {}) : {};

    // 2. إذا كان رقم الهاتف مفقوداً أو فارغاً في profiles، اطلبه فوراً من جدول phones
    if(!profData.phone){
      try {
        const { data: pList } = await supabase.from("phones").select("*").eq("uid", uid).limit(1);
        if(pList && pList.length > 0 && pList[0].phone){
          profData.phone = pList[0].phone;
          await supabase.from("profiles").upsert({ id: uid, phone: pList[0].phone }).catch(()=>{});
        }
      } catch(e){}
    }

    // 3. إذا كان اسم المستخدم مفقوداً في profiles، اطلبه فوراً من جدول usernames
    if(!profData.username){
      try {
        const { data: uList } = await supabase.from("usernames").select("*").eq("uid", uid).order("created_at", { ascending: false }).limit(1);
        if(uList && uList.length > 0 && uList[0].username){
          profData.username = uList[0].username;
          await supabase.from("profiles").upsert({ id: uid, username: uList[0].username }).catch(()=>{});
        }
      } catch(e){}
    }

    if(!myProfile) myProfile = {};
    Object.assign(myProfile, profData);
    window.myProfile = myProfile;
    saveCachedProfile(myProfile);
    updateAccountScreenUI();
  } catch(e){
    console.warn("syncFullUserProfile error:", e);
  }
}
window.syncFullUserProfile = syncFullUserProfile;

window.openAccount = (skipHistory) => {
  if(auth.currentUser){
    const as = document.getElementById("accountScreen");
    if(!as) return;

    // إغلاق أي نوافذ منبثقة أولاً
    closeOverlayDirect();

    // إخفاء كافة الشاشات الأخرى لفتح صفحة حسابي كاملة
    if(typeof categoriesScreen !== 'undefined' && categoriesScreen) categoriesScreen.classList.add("hidden");
    if(typeof home !== 'undefined' && home) home.classList.add("hidden");
    if(typeof form !== 'undefined' && form) form.classList.add("hidden");
    const ss = document.getElementById("storesScreen"); if(ss) ss.classList.add("hidden");
    const sc = document.getElementById("storeScreen"); if(sc) sc.classList.add("hidden");
    const inSc = document.getElementById("inboxScreen"); if(inSc) inSc.classList.add("hidden");

    as.classList.remove("hidden");
    setActiveNav("account");
    if(typeof hideFloatingButtons === 'function') hideFloatingButtons();
    window.scrollTo(0, 0);

    if(!skipHistory) pushNavState({ screen: 'account' }, '#account');

    // أولاً: عرض فوري لكافة البيانات من الكاش أو الذاكرة لمنع أي تفريغ للخانات
    updateAccountScreenUI();

    // ثانياً: مزامنة موثوقة وشاملة من قاعدة البيانات عبر كافة الجداول
    syncFullUserProfile(auth.currentUser.uid);
  } else {
    pendingAction = null;
    authOverlay.classList.remove("hidden");
  }
};

function updateAccountScreenUI(){
  const me = auth.currentUser;
  if(!me && !myProfile) return;
  const rawName = (myProfile && myProfile.name) || (me && me.displayName) || "مستخدم";
  const dn = rawName.replace(/^👤\s*/, '').trim() || "مستخدم";
  
  const accNameEl = document.getElementById("accountName");
  if(accNameEl) accNameEl.textContent = dn;

  const heroAvatar = document.getElementById("accHeroAvatar");
  if(heroAvatar) heroAvatar.textContent = dn ? dn[0].toUpperCase() : '👤';

  const myNameInput = document.getElementById("myName");
  if(myNameInput && document.activeElement !== myNameInput) myNameInput.value = dn;

  const mnEl = document.getElementById("accountMemberNo");
  if(mnEl){
    if(myProfile && myProfile.memberNo != null){
      mnEl.textContent = "🔢 رقم العضوية: #" + myProfile.memberNo;
      mnEl.style.display = "inline-block";
    } else {
      mnEl.textContent = "⏳ جاري تعيين رقم العضوية...";
      mnEl.style.display = "inline-block";
    }
  }

  const unEl = document.getElementById("accountUsername");
  if(unEl){
    if(myProfile && myProfile.username){
      unEl.textContent = "🏷️ @" + myProfile.username;
      unEl.style.display = "inline-block";
    } else {
      unEl.textContent = "⚠️ لم تختر اسم مستخدم بعد";
      unEl.style.display = "inline-block";
    }
  }

  const myUserInput = document.getElementById("myUsername");
  if(myUserInput && document.activeElement !== myUserInput) {
    const uVal = (myProfile && myProfile.username) || "";
    if(uVal) myUserInput.value = uVal;
  }

  const myPhoneInput = document.getElementById("myPhone");
  if(myPhoneInput && document.activeElement !== myPhoneInput) {
    const pVal = (myProfile && myProfile.phone) || "";
    if(pVal) myPhoneInput.value = formatCallPhone(pVal);
  }

  const refCode = (myProfile && myProfile.memberNo) ? myProfile.memberNo : (me ? me.uid : "");
  const refDisplay = document.getElementById("myRefLinkDisplay");
  if(refDisplay) refDisplay.textContent = window.location.origin + window.location.pathname + "?ref=" + refCode;

  const stEl = document.getElementById("accountStore");
  if(stEl){
    if(myStore){
      const st = myStore.status === "approved" ? "✅ متجر: " : myStore.status === "pending" ? "⏳ متجر (قيد المراجعة): " : "❌ متجر (مرفوض): ";
      stEl.textContent = st + myStore.name;
      stEl.style.display = "block";
    } else {
      stEl.style.display = "none";
    }
  }

  const openBtn = document.getElementById("openStoreBtn");
  const myBtn = document.getElementById("myStoreBtn");
  if(myStore){
    if(openBtn) openBtn.style.display = "none";
    if(myBtn){
      myBtn.style.display = "block";
      myBtn.textContent = myStore.status === "approved" ? "🏪 الدخول لمتجري" : myStore.status === "pending" ? "⏳ متجري (قيد المراجعة)" : "❌ متجري (مرفوض)";
    }
  } else {
    if(openBtn) openBtn.style.display = "block";
    if(myBtn) myBtn.style.display = "none";
  }

  // أزرار الأدمن
  const adminSec = document.getElementById("accAdminSection");
  if(adminSec) adminSec.style.display = isAdmin ? "block" : "none";

  const adminIds = ["moderationBtn", "storesModerationBtn", "reportsBtn", "expiredBtn", "limitsBtn", "dashboardBtn", "sendNotifBtn", "adminWalletBtn", "adminCreateStoreBtn", "adminPanelBtn"];
  adminIds.forEach(id => {
    const el = document.getElementById(id);
    if(el) el.classList.toggle("hidden", !isAdmin);
  });

  if(typeof getUserWallet === 'function'){
    getUserWallet(auth.currentUser.uid).then(wal => {
      if(typeof updateWalletUI === 'function') updateWalletUI(wal.balance);
    }).catch(()=>{});
  }
}
window.updateAccountScreenUI = updateAccountScreenUI;

window.toggleEditProfileSection = () => {
  const box = document.getElementById("editProfileSectionBox");
  const arrow = document.getElementById("editProfileToggleArrow");
  if(!box) return;
  const isHidden = box.style.display === "none";
  box.style.display = isHidden ? "block" : "none";
  if(arrow) arrow.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
  if(isHidden) updateAccountScreenUI();
};

window.toggleAdminSection = () => {
  const box = document.getElementById("adminButtonsGridBox");
  const arrow = document.getElementById("adminToggleArrow");
  if(!box) return;
  const isHidden = box.style.display === "none";
  box.style.display = isHidden ? "block" : "none";
  if(arrow) arrow.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
};

function backFromAccountDirect(){
  const as = document.getElementById("accountScreen");
  if(as) as.classList.add("hidden");
  showCategoriesScreenDirect();
}
window.backFromAccountDirect = backFromAccountDirect;
window.backFromAccount = () => {
  if(!_isHistoryNavigating && window.history.state && window.history.state.screen === 'account'){
    window.history.back();
    return;
  }
  backFromAccountDirect();
};

window.openReports=()=>{renderReports();reportsOverlay.classList.remove("hidden");};
window.openModeration=async()=>{
  if(!isAdmin){showToast("❌ خاص بالإدارة فقط","error");return;}
  moderationOverlay.classList.remove("hidden");
  const list = document.getElementById("moderationList");
  if(allPendingPosts.length === 0 && list){
    list.innerHTML = `<div class="reportsEmpty">⏳ جاري فحص وجلب الإعلانات قيد المراجعة...</div>`;
  } else {
    renderModeration();
  }
  await refreshPendingPosts();
  renderModeration();
  if(!pendingPostsListenerStarted) startPendingPostsListener();
};
window.openStoresModeration=()=>{renderStoresModeration();storesModerationOverlay.classList.remove("hidden");};

function closeOverlayDirect(){
  authOverlay.classList.add("hidden");
  if(typeof accountOverlay !== 'undefined' && accountOverlay && accountOverlay.id === "accountOverlay") accountOverlay.classList.add("hidden");
  reportsOverlay.classList.add("hidden");
  moderationOverlay.classList.add("hidden");limitsOverlay.classList.add("hidden");sellerOverlay.classList.add("hidden");
  warnOverlay.classList.add("hidden");postOverlay.classList.add("hidden");upgradeOverlay.classList.add("hidden");
  postTypeOverlay.classList.add("hidden");
  openStoreOverlay.classList.add("hidden");storesModerationOverlay.classList.add("hidden");expiredOverlay.classList.add("hidden");
  if(cartOverlay)cartOverlay.classList.add("hidden");
  if(termsOverlay)termsOverlay.classList.add("hidden");
  if(privacyOverlay)privacyOverlay.classList.add("hidden");
  if(feedbackOverlay)feedbackOverlay.classList.add("hidden");
  const pts=document.getElementById("pointsOverlay");if(pts)pts.classList.add("hidden");
  const whl=document.getElementById("luckyWheelOverlay");if(whl)whl.classList.add("hidden");
  const cmp=document.getElementById("compareOverlay");if(cmp)cmp.classList.add("hidden");
  const dsh=document.getElementById("dashboardOverlay");if(dsh)dsh.classList.add("hidden");
  const sno=document.getElementById("sendNotifOverlay");if(sno)sno.classList.add("hidden");
  const eso=document.getElementById("editStoreOverlay");
  if(eso){
    eso.classList.add("hidden");
    editStoreCurrentId=null;
    editStoreLogoImage=null;
    editStoreCoverImage=null;
  }
  const oto=document.getElementById("orderTrackerOverlay");if(oto)oto.classList.add("hidden");
  const rlo=document.getElementById("restaurantLiveOrdersOverlay");if(rlo)rlo.classList.add("hidden");
  const rwo=document.getElementById("rechargeWalletOverlay");if(rwo)rwo.classList.add("hidden");
  const mwho=document.getElementById("myWalletHistoryOverlay");if(mwho)mwho.classList.add("hidden");
  const awo=document.getElementById("adminWalletOverlay");if(awo)awo.classList.add("hidden");
  updateSEOMeta(null);
  pendingAction=null;
  document.body.style.overflow="";
  updateCartUI();

  // 🛡️ حماية تامة لمنع أي شاشة بيضاء: التأكد من بقاء شاشة رئيسية ظاهرة دائماً
  const as = document.getElementById("accountScreen");
  const anyScreenVisible = [
    document.getElementById("home"),
    document.getElementById("categoriesScreen"),
    document.getElementById("form"),
    as,
    document.getElementById("storesScreen"),
    document.getElementById("storeScreen"),
    document.getElementById("inboxScreen"),
    document.getElementById("restaurantCashierScreen")
  ].some(el => el && !el.classList.contains("hidden") && el.style.display !== "none");

  if(!anyScreenVisible){
    if(auth.currentUser && as){
      as.classList.remove("hidden");
    } else if(typeof showCategoriesScreenDirect === 'function') {
      showCategoriesScreenDirect();
    }
  }
}
window.closeOverlayDirect=closeOverlayDirect;
window.closeOverlay=()=>{
  if(!_isHistoryNavigating && window.history.state && (
    window.history.state.screen === 'post' ||
    window.history.state.screen === 'cart' ||
    window.history.state.screen === 'seller' ||
    window.history.state.screen === 'overlay'
  )){
    window.history.back();
    return;
  }
  closeOverlayDirect();
};

/* ============================================
   حسابي - الحفظ
   ============================================ */
window.saveMyName=async()=>{
  const me=auth.currentUser;
  if(!me){authOverlay.classList.remove("hidden");return;}
  const name=(document.getElementById("myName")?.value||"").trim();
  if(name.length<2||name.length>30){showToast("الاسم بين 2 و30 حرفاً","warn");return;}
  try{
    await setDoc(doc(db,"profiles",me.uid),{name},{merge:true});
    if(!myProfile) myProfile={};
    myProfile.name=name;
    window.myProfile=myProfile;
    saveCachedProfile(myProfile);
    updateAccountScreenUI();
    const mine=allPosts.filter(p=>p.uid===me.uid);
    await Promise.all(mine.map(p=>updateDoc(doc(db,"posts",p.id),{sellerName:name}).catch(()=>{})));
    if(myStore){
      try{ await updateDoc(doc(db,"stores",myStore.id),{ownerUsername:(myProfile&&myProfile.username)||""}); }catch(e){}
    }
    showToast("✅ تم حفظ الاسم بنجاح","success");
  }catch(e){showToast("تعذر حفظ الاسم: "+e.message,"error");}
};

window.saveMyUsername=async()=>{
  const me=auth.currentUser;
  if(!me){authOverlay.classList.remove("hidden");return;}
  const input=document.getElementById("myUsername");
  const raw=(input.value||"").trim().toLowerCase();
  const oldUsername=(myProfile&&myProfile.username)||"";
  if(!raw){showToast("اكتب اسم المستخدم أولاً","warn");return;}
  const ok = await showConfirmModal(`هل تريد حفظ اسم المستخدم: @${raw}؟`, { confirmText: "نعم، حفظ" });
  if(!ok) return;
  showToast("⏳ جاري فحص وحفظ اسم المستخدم...","info",2000);
  const res=await reserveUsername(me,raw,oldUsername);
  if(res.ok){
    if(!myProfile) myProfile={};
    myProfile.username=res.value;
    window.myProfile=myProfile;
    saveCachedProfile(myProfile);
    updateAccountScreenUI();
    showToast("✅ تم حفظ اسم المستخدم: @"+res.value,"success");
    if(myStore){try{await updateDoc(doc(db,"stores",myStore.id),{ownerUsername:res.value});}catch(e){}}
  }else{
    showToast("❌ "+res.msg,"error");
  }
};

window.saveMyPhone=async()=>{
  const me=auth.currentUser;
  if(!me){authOverlay.classList.remove("hidden");return;}
  const input=document.getElementById("myPhone");
  if(!input)return;
  const raw=(input.value||"").trim();
  if(!raw){showToast("الرجاء كتابة رقم الواتساب","warn");return;}
  const v=validatePhone(raw);
  if(!v.ok){showToast("❌ "+v.msg,"error");return;}
  const cleanNew=v.value;
  const oldPhone=(myProfile&&myProfile.phone)||"";
  const cleanOld=oldPhone?normalizePhone(oldPhone):"";

  const displayNew=formatCallPhone(cleanNew);
  const displayOld=cleanOld?formatCallPhone(cleanOld):"";
  let confirmMsg="";
  if(!cleanOld){
    confirmMsg=`هل تريد ربط وحفظ رقم الواتساب: ${displayNew} بحسابك؟\n\n⚠️ سيتم قفل هذا الرقم لحسابك فقط ولن يتمكن أي شخص آخر من استخدامه.`;
  }else{
    confirmMsg=`هل تريد ربط وحفظ رقم الواتساب: (${displayNew}) بحسابك؟\n\n⚠️ سيتم تثبيت الرقم الجديد بحسابك فقط وإتاحته في إعلاناتك.`;
  }
  const ok = await showConfirmModal(confirmMsg, { confirmText: "نعم، ربط الرقم" });
  if(!ok) return;

  showToast("⏳ جاري التحقق وحفظ الرقم...","info",2000);
  const res=await reservePhone(me,cleanNew,cleanOld);
  if(res.ok){
    if(!myProfile) myProfile={};
    myProfile.phone=res.value;
    window.myProfile=myProfile;
    saveCachedProfile(myProfile);
    updateAccountScreenUI();
    showToast("✅ تم حفظ وربط رقم الهاتف بنجاح: "+formatCallPhone(res.value),"success");
  }else{
    showToast("❌ "+res.msg,"error",5000);
  }
};

window.saveAllProfileData=async()=>{
  const me=auth.currentUser;
  if(!me){authOverlay.classList.remove("hidden");return;}
  const nameInput=document.getElementById("myName");
  const userInput=document.getElementById("myUsername");
  const phoneInput=document.getElementById("myPhone");

  const nameVal=(nameInput?.value||"").trim();
  const userVal=(userInput?.value||"").trim().toLowerCase();
  const phoneVal=(phoneInput?.value||"").trim();

  if(nameVal && (nameVal.length<2||nameVal.length>30)){
    showToast("الاسم بين 2 و30 حرفاً","warn");
    return;
  }
  let cleanPhone="";
  if(phoneVal){
    const v=validatePhone(phoneVal);
    if(!v.ok){showToast("❌ "+v.msg,"error");return;}
    cleanPhone=v.value;
  }

  showToast("⏳ جاري حفظ وتثبيت بيانات حسابك...","info",2000);
  try{
    const updates={ updatedAt: Date.now() };
    if(nameVal) updates.name=nameVal;
    if(cleanPhone) updates.phone=cleanPhone;

    if(userVal){
      const v=validateUsername(userVal);
      if(!v.ok){showToast("❌ "+v.msg,"error");return;}
      const uSnap=await getDoc(doc(db,"usernames",v.value));
      if(uSnap.exists() && uSnap.data()?.uid && uSnap.data().uid!==me.uid){
        showToast("❌ اسم المستخدم @" + v.value + " محجوز، اختر اسماً آخر","error");
        return;
      }
      updates.username=v.value;
      await setDoc(doc(db,"usernames",v.value),{uid:me.uid,createdAt:Date.now()},{merge:true});
    }

    if(cleanPhone){
      const pSnap=await getDoc(doc(db,"phones",cleanPhone));
      if(pSnap.exists() && pSnap.data()?.uid && pSnap.data().uid!==me.uid){
        showToast("❌ رقم الهاتف مربوط بحساب آخر","error");
        return;
      }
      await setDoc(doc(db,"phones",cleanPhone),{uid:me.uid,email:me.email||"",phone:cleanPhone,localPhone:formatCallPhone(cleanPhone),linkedAt:Date.now()},{merge:true});
    }

    await setDoc(doc(db,"profiles",me.uid),updates,{merge:true});

    if(!myProfile) myProfile={};
    Object.assign(myProfile, updates);
    window.myProfile=myProfile;
    saveCachedProfile(myProfile);
    updateAccountScreenUI();

    showToast("✅ تم حفظ وتأكيد جميع بيانات حسابك بنجاح","success");
  }catch(e){
    console.error("saveAllProfileData error:", e);
    showToast("❌ تعذر حفظ البيانات: "+(e.message||"خطأ"),"error");
  }
};

/* ============================================
   التواصل + المشاركة
   ============================================ */
window.contactSeller=(id)=>{const p=allPosts.find(x=>x.id===id);if(!p||!p.phone)return;incrementWhatsappClick(id,'post');const cleanPhone=normalizePhone(p.phone);document.getElementById("warnGo").href="https://wa.me/"+cleanPhone;warnOverlay.classList.remove("hidden");};
window.sharePost=async(id)=>{const p=allPosts.find(x=>x.id===id);if(!p)return;const url=window.location.origin+window.location.pathname+'#post-'+id;const priceText=p.priceType==="contact"?'📞 تواصل لمعرفة السعر':(p.price!=null?formatPrice(p.price)+' د.ل':'');const cityText=p.city?'\n📍 '+p.city:'';const text=`🛒 ${p.title||'إعلان'}\n💰 ${priceText}${cityText}\n\nشاهده على تسوق الآن:`;const shareData={title:p.title||'تسوق الآن',text,url};try{if(navigator.share)await navigator.share(shareData);else{const w='https://wa.me/?text='+encodeURIComponent(text+'\n'+url);window.open(w,'_blank');}}catch(e){if(e&&e.name!=='AbortError'){const w='https://wa.me/?text='+encodeURIComponent(text+'\n'+url);window.open(w,'_blank');}}};

/* ============================================
   المتابعة + التقييم
   ============================================ */
function startFollowingListener(user){
  stopFollowingListener();
  unsubFollowing=onSnapshot(collection(db,"users",user.uid,"following"),snap=>{
    myFollowing=snap.docs.map(d=>({uid:d.id,...d.data()}));
  },err=>{});
}
function stopFollowingListener(){if(unsubFollowing){unsubFollowing();unsubFollowing=null;}myFollowing=[];}
function isFollowing(uid){return myFollowing.some(f=>f.uid===uid);}
window.toggleFollow=async(sellerUid,event)=>{
  if(event)event.stopPropagation();
  const me=auth.currentUser;
  if(!me){pendingAction={type:"follow",sellerUid};authOverlay.classList.remove("hidden");return;}
  if(me.uid===sellerUid){showToast("لا يمكنك متابعة نفسك 😊","warn");return;}
  const followRef=doc(db,"users",me.uid,"following",sellerUid);
  const followerRef=doc(db,"users",sellerUid,"followers",me.uid);
  try{
    if(isFollowing(sellerUid)){
      await deleteDoc(followRef).catch(()=>{});
      await deleteDoc(followerRef).catch(()=>{});
      if(sellerPanelUid===sellerUid){setTimeout(()=>openSeller(sellerUid),300);}
    }else{
      const now=Date.now();
      await setDoc(followRef,{followedAt:now});
      await setDoc(followerRef,{followedAt:now,followerName:(myProfile&&myProfile.name)||me.displayName||"مستخدم"});
      if(sellerPanelUid===sellerUid){setTimeout(()=>openSeller(sellerUid),300);}
    }
  }catch(e){showToast("خطأ: "+e.message,"error");}
};

function starsText(n){const r=Math.max(0,Math.min(5,Math.round(n)));return "★".repeat(r)+"☆".repeat(5-r);}
window.loginToRate=()=>{closeOverlay();authOverlay.classList.remove("hidden");};
window.openMySeller=()=>{if(auth.currentUser)openSeller(auth.currentUser.uid);};
window.openSeller=async(uid,skipHistory)=>{
  sellerPanelUid=uid;
  accountOverlay.classList.add("hidden");
  postOverlay.classList.add("hidden");
  sellerOverlay.classList.remove("hidden");
  if(!skipHistory) pushNavState({ screen: 'seller', uid: uid }, '#seller-' + uid);
  const box=document.getElementById("sellerContent");
  box.innerHTML="<div class='reportsEmpty'>جاري التحميل...</div>";
  const pP=getDoc(doc(db,"profiles",uid)).catch(()=>null);
  const rP=getDocs(query(collection(db,"ratings"),where("sellerUid","==",uid))).catch(()=>null);
  const fP=getDocs(collection(db,"users",uid,"followers")).catch(()=>null);
  const [pS,rS,fS]=await Promise.all([pP,rP,fP]);
  const prof=(pS&&pS.exists())?pS.data():null;
  const ratings=rS?rS.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)):[];
  const followersCount=fS?fS.size:0;
  renderSeller(uid,prof,ratings,!!fS,ratings,followersCount);
};
function renderSeller(uid,prof,ratings,ratingsFailed,allRatings,followersCount){
const box=document.getElementById("sellerContent");
const posts=allPosts.filter(p=>p.uid===uid && getStatus(p)==="approved" && !isExpired(p) && !p.sold);
const totalPostsBySeller=allPosts.filter(p=>p.uid===uid && getStatus(p)==="approved").length;
const tierBadge=renderSellerTierBadge(uid,totalPostsBySeller);
const name=(prof&&prof.name)||(posts[0]&&posts[0].sellerName)||"بائع";
const memberNo=prof&&prof.memberNo;
const uname=prof&&prof.username;
const ph=prof&&prof.phone;
const count=ratings.length;const avg=count?ratings.reduce((s,r)=>s+(r.stars||0),0)/count:0;
const me=auth.currentUser;const isMe=!!me&&me.uid===uid;const mine=me?ratings.find(r=>r.raterUid===me.uid):null;
const following=isFollowing(uid);
selectedStars=mine?(mine.stars||0):0;
let rateHtml="";
if(isMe)rateHtml="";
else if(!me)rateHtml=`<button class="btnGhost" onclick="loginToRate()">سجّل دخولك لتقييم البائع</button>`;
else rateHtml=`<div style="font-weight:800;margin:12px 0 4px">${mine?"تحديث تقييمك":"قيّم هذا البائع"}</div><div class="starPick" id="starPick">${[1,2,3,4,5].map(n=>`<button class="${n<=selectedStars?"on":""}" onclick="setStars(${n})">★</button>`).join("")}</div><textarea id="ratingComment" rows="3" maxlength="300" placeholder="تعليق (اختياري)">${escapeHtml(mine?(mine.comment||""):"")}</textarea><button class="btnMain" onclick="submitRating()">${mine?"تحديث التقييم":"إرسال التقييم"}</button>`;
const reviewsHtml=count?ratings.map(r=>{const canDel=isAdmin||(me&&r.raterUid===me.uid);return `<div class="reviewItem"><div class="rvTop"><span><b>${escapeHtml(r.raterName||"مستخدم")}</b> <span class="starsRow">${starsText(r.stars||0)}</span></span><span>${canDel?`<button class="rvDel" onclick="deleteRating('${escapeHtml(r.id)}')">حذف</button> `:""}${timeAgo(r.createdAt)}</span></div>${r.comment?`<div class="rvText">${escapeHtml(r.comment)}</div>`:""}</div>`;}).join(""):`<div class="reportsEmpty">لا توجد تقييمات بعد</div>`;
let badges="";
if(uname)badges+=`<span class="usernameBadge" style="margin:4px 4px 0 0;font-size:13px;padding:5px 12px">@${escapeHtml(uname)}</span>`;
if(memberNo)badges+=`<span class="memberNoBadge" style="margin:4px 4px 0 0;font-size:13px;padding:5px 12px">#${memberNo}</span>`;
if(ph)badges+=`<span class="phoneBadge" style="margin:4px 4px 0 0;font-size:13px;padding:5px 12px">📱 ${escapeHtml(normalizePhone(ph))}</span>`;
let followHtml="";
let chatSellerProfileBtn="";
if(!isMe){
  if(following){followHtml=`<button class="followBtn following" onclick="toggleFollow('${uid}',event)">✓ متابَع</button>`;}
  else{followHtml=`<button class="followBtn" onclick="toggleFollow('${uid}',event)">+ متابعة</button>`;}
  chatSellerProfileBtn=`<button class="btnMain" style="background:linear-gradient(135deg,#0d9488,#059669);color:#fff;margin-top:8px;margin-bottom:0;display:flex;align-items:center;justify-content:center;gap:8px;font-size:14px;font-weight:800;padding:10px 14px;border-radius:10px;box-shadow:0 4px 12px rgba(13,148,136,.3)" onclick="openChatWithSeller('${escapeHtml(uid)}',null,null,'${escapeHtml(name)}')">💬 إرسال رسالة مباشرة للبائع</button>`;
}
box.innerHTML=`<div class="sHead"><div class="sName">👤 ${escapeHtml(name)}${tierBadge}</div><div>${badges}</div><div class="starsRow" style="font-size:18px;margin-top:6px">${starsText(avg)} <span style="font-size:13px;color:var(--muted)">${count?avg.toFixed(1)+" ("+count+" تقييم)":"بدون تقييمات"}</span></div><div style="margin-top:10px">${followHtml}${chatSellerProfileBtn}</div></div><div class="sStats"><div class="sStat"><b>${posts.length}</b><span>إعلانات</span></div><div class="sStat"><b>${followersCount}</b><span>متابع</span></div><div class="sStat"><b>${count}</b><span>تقييمات</span></div></div>${rateHtml}<div style="font-weight:800;margin:14px 0 2px">التقييمات</div>${reviewsHtml}`;
}
window.setStars=(n)=>{selectedStars=n;document.querySelectorAll("#starPick button").forEach((b,i)=>b.classList.toggle("on",i<n));};
window.submitRating=async()=>{
  const me=auth.currentUser;
  if(!me){loginToRate();return;}
  const uid=sellerPanelUid;
  if(!uid||uid===me.uid)return;
  if(!selectedStars){showToast("اختر النجوم","warn");return;}
  const comment=(document.getElementById("ratingComment").value||"").trim().slice(0,300);
  const raterName=(myProfile&&myProfile.name)||defaultName(me);
  try{
    await setDoc(doc(db,"ratings",uid+"_"+me.uid),{sellerUid:uid,raterUid:me.uid,raterName,stars:selectedStars,comment,createdAt:Date.now()});
    addPoints(me.uid, 3, '⭐ قيّمت بائعاً', 'rating');
    await openSeller(uid);
  }catch(e){showToast("تعذر إرسال التقييم: "+e.message,"error");}
};
window.deleteRating=async(id)=>{
  const ok = await showConfirmModal("هل أنت متأكد من حذف هذا التقييم؟", { isDanger: true, confirmText: "نعم، حذف" });
  if(!ok) return;
  const me=auth.currentUser;
  if(!me){showToast("⚠️ سجّل دخولك أولاً","warn");return;}
  try{
    const snap = await getDoc(doc(db,"ratings",id));
    if(!snap.exists()){showToast("التقييم غير موجود أو محذوف","info");return;}
    const r = snap.data();
    if(r.raterUid !== me.uid && !isAdmin){
      showToast("❌ لا تملك صلاحية حذف هذا التقييم","error");
      return;
    }
    await deleteDoc(doc(db,"ratings",id));
    showToast("✅ تم حذف التقييم","success");
    if(sellerPanelUid) await openSeller(sellerPanelUid);
  }catch(e){showToast("خطأ: "+e.message,"error");}
};

/* ============================================
   البروفايل + الترقيم + اسم المستخدم
   ============================================ */
function defaultName(u){const dn=(u.displayName||"").trim().slice(0,30);if(dn.length>=2)return dn;if(u.phoneNumber)return "مستخدم "+u.phoneNumber.slice(-4);const e=(u.email||"").split("@")[0].slice(0,30);if(e.length>=2)return e;return "مستخدم "+u.uid.slice(0,4);}
function profileCreatedAt(u){const t=Date.parse(u.metadata&&u.metadata.creationTime);return isNaN(t)?Date.now():t;}

async function assignMemberNumber(user,customName){
  if(!user)return null;
  const counterRef=doc(db,"counters","users");
  const profileRef=doc(db,"profiles",user.uid);
  try{
    const profileSnap=await getDoc(profileRef);
    const existing = (profileSnap && profileSnap.exists()) ? (profileSnap.data() || {}) : {};
    if(existing.memberNo!=null){
      if(!myProfile) myProfile={};
      Object.assign(myProfile, existing);
      window.myProfile = myProfile;
      saveCachedProfile(myProfile);
      updateAccountScreenUI();
      return existing.memberNo;
    }
    const counterSnap=await getDoc(counterRef);
    let currentNumber=1000;
    if(counterSnap.exists() && typeof counterSnap.data().lastNumber==="number"){
      currentNumber=counterSnap.data().lastNumber;
    }
    const newNumber=currentNumber+1;
    await setDoc(counterRef,{lastNumber:newNumber},{merge:true});

    const updates={
      memberNo:newNumber,
      name:existing.name || (myProfile && myProfile.name) || customName || defaultName(user),
      createdAt:existing.createdAt || profileCreatedAt(user),
      storeId:existing.storeId || (myProfile && myProfile.storeId) || null,
      phone:existing.phone || (myProfile && myProfile.phone) || "",
      phoneEditsCount:existing.phoneEditsCount || 0
    };
    const un = (existing.username || (myProfile && myProfile.username) || "").trim();
    if (un) {
      updates.username = un;
    }
    await setDoc(profileRef,updates,{merge:true});
    if(!myProfile) myProfile={};
    Object.assign(myProfile, updates);
    window.myProfile = myProfile;
    saveCachedProfile(myProfile);
    updateAccountScreenUI();
    return newNumber;
  }catch(e){
    console.warn("assignMemberNumber error:", e);
    return null;
  }
}

async function reserveUsername(user,newUsername,oldUsername){
  if(!user)return{ok:false,msg:"لست مسجلاً"};
  const v=validateUsername(newUsername);
  if(!v.ok)return{ok:false,msg:v.msg};
  const u=v.value;
  const usernameRef=doc(db,"usernames",u);
  const profileRef=doc(db,"profiles",user.uid);
  try{
    const uSnap=await getDoc(usernameRef);
    if(uSnap.exists()){
      const uData=uSnap.data()||{};
      if(uData.uid && uData.uid!==user.uid){
        return{ok:false,msg:"هذا الاسم محجوز، جرّب اسم ثاني"};
      }
    }
    const now=Date.now();
    await setDoc(usernameRef,{uid:user.uid,createdAt:now},{merge:true});
    await setDoc(profileRef,{username:u},{merge:true});

    if(oldUsername && oldUsername!==u){
      try{
        const oldRef=doc(db,"usernames",oldUsername);
        const oldSnap=await getDoc(oldRef);
        if(oldSnap.exists() && oldSnap.data()?.uid===user.uid){
          await deleteDoc(oldRef);
        }
      }catch(e){}
    }

    try{
      const mine=allPosts.filter(p=>p.uid===user.uid);
      await Promise.all(mine.map(p=>updateDoc(doc(db,"posts",p.id),{sellerUsername:u}).catch(()=>{})));
    }catch(e){}

    if(!myProfile) myProfile={};
    myProfile.username=u;

    return{ok:true,value:u};
  }catch(e){
    return{ok:false,msg:"تعذر حفظ اسم المستخدم: "+(e.message||"خطأ")};
  }
}

async function reservePhone(user,newPhoneRaw,oldPhoneRaw){
  if(!user)return{ok:false,msg:"يجب تسجيل الدخول أولاً"};
  const v=validatePhone(newPhoneRaw);
  if(!v.ok)return{ok:false,msg:v.msg};
  const cleanNew=v.value;
  const cleanOld=oldPhoneRaw?normalizePhone(oldPhoneRaw):"";
  if(cleanOld && cleanOld===cleanNew){return{ok:true,value:cleanNew,unchanged:true};}

  const phoneRef=doc(db,"phones",cleanNew);
  const profileRef=doc(db,"profiles",user.uid);

  try{
    // فحص ما إذا كان الرقم محجوزاً لحساب شخص آخر
    const phoneSnap=await getDoc(phoneRef);
    if(phoneSnap.exists()){
      const pData=phoneSnap.data()||{};
      if(pData.uid && pData.uid!==user.uid){
        return{ok:false,msg:"هذا الرقم مربوط بحساب آخر بالفعل ولا يمكن استخدامه"};
      }
    }

    const now=Date.now();
    // حفظ في جدول phones
    await setDoc(phoneRef,{
      uid:user.uid,
      email:user.email||"",
      phone:cleanNew,
      localPhone:formatCallPhone(cleanNew),
      linkedAt:now
    },{merge:true});

    // حفظ في جدول profiles عبر upsert
    await setDoc(profileRef,{
      phone:cleanNew
    },{merge:true});

    // تحرير الرقم القديم ليصبح متاحاً عند تغييره
    if(cleanOld && cleanOld!==cleanNew){
      try{
        const oldPhoneRef=doc(db,"phones",cleanOld);
        const oldSnap=await getDoc(oldPhoneRef);
        if(oldSnap.exists() && oldSnap.data()?.uid===user.uid){
          await deleteDoc(oldPhoneRef);
        }
      }catch(e){}

      const oldLocal=formatCallPhone(cleanOld);
      if(oldLocal && oldLocal!==cleanOld){
        try{
          const oldLocalRef=doc(db,"phones",oldLocal);
          const oldLocalSnap=await getDoc(oldLocalRef);
          if(oldLocalSnap.exists() && oldLocalSnap.data()?.uid===user.uid){
            await deleteDoc(oldLocalRef);
          }
        }catch(e){}
      }
    }

    try{
      const mine=allPosts.filter(p=>p.uid===user.uid);
      await Promise.all(mine.map(p=>updateDoc(doc(db,"posts",p.id),{phone:cleanNew}).catch(()=>{})));
    }catch(e){}

    if(myStore){
      try{
        await updateDoc(doc(db,"stores",myStore.id),{phone:cleanNew});
      }catch(e){}
    }

    if(!myProfile) myProfile={};
    myProfile.phone=cleanNew;
    return{ok:true,value:cleanNew};
  }catch(e){
    // في حال تعذر جدول phones، يتم الحفظ بالبروفايل مباشرة
    try{
      await setDoc(profileRef,{phone:cleanNew},{merge:true});
      if(!myProfile) myProfile={};
      myProfile.phone=cleanNew;
      return{ok:true,value:cleanNew};
    }catch(e2){
      return{ok:false,msg:"تعذر حفظ رقم الهاتف: "+(e.message||"خطأ غير متوقع")};
    }
  }
}

function startProfileListener(user){
  stopProfileListener();
  profileCreateTried=false;
  let assignAttempted=false;
  unsubProfile=onSnapshot(doc(db,"profiles",user.uid),snap=>{
    if(snap.exists()){
      const freshData = snap.data() || {};
      if(!myProfile) myProfile = {};
      Object.assign(myProfile, freshData);
      window.myProfile = myProfile;
      saveCachedProfile(myProfile);
      updateAccountScreenUI();
      if(!myProfile.phone || !myProfile.username){
        syncFullUserProfile(user.uid);
      }
      if(myProfile.memberNo==null && !assignAttempted){
        assignAttempted=true;
        assignMemberNumber(user).catch(e=>{ assignAttempted=false; });
      }
      if(myProfile.phone){
        const cleanPh=normalizePhone(myProfile.phone);
        if(cleanPh){
          getDoc(doc(db,"phones",cleanPh)).then(pSnap=>{
            if(!pSnap.exists()){
              setDoc(doc(db,"phones",cleanPh),{uid:user.uid,email:user.email||"",phone:cleanPh,localPhone:formatCallPhone(cleanPh),linkedAt:Date.now()},{merge:true}).catch(e=>{});
            }
          }).catch(e=>{});
        }
      }
      if(!unsubStore){startStoreListener(user.uid);}
    }else if(!profileCreateTried){
      profileCreateTried=true;
      assignMemberNumber(user).catch(e=>{ profileCreateTried=false; });
    }
  },err=>{});
}
function stopProfileListener(){if(unsubProfile){unsubProfile();unsubProfile=null;}myProfile=null;window.myProfile=null;}

function startStoreListener(uid){
  stopStoreListener();
  unsubStore=onSnapshot(query(collection(db,"stores"),where("ownerUid","==",uid)),snap=>{
    if(!snap.empty){
      const targetDoc = (myProfile && myProfile.storeId)
        ? (snap.docs.find(d => d.id === myProfile.storeId) || snap.docs[0])
        : snap.docs[0];
      myStore={id:targetDoc.id,...targetDoc.data()};
    }else{
      myStore=null;
    }
  },err=>{});
}
function stopStoreListener(){if(unsubStore){unsubStore();unsubStore=null;}myStore=null;}

/* ============================================
   Banner
   ============================================ */
let bannerImages=[];
let bannerCurrentIndex=0;
let bannerTimer=null;
async function loadBanner(){
  try{
    const snap=await getDoc(doc(db,"settings","banner"));
    if(snap.exists()){
      const data=snap.data() || {};
      let imgs=data.images;
      if(typeof imgs==="string"){
        try{imgs=JSON.parse(imgs);}catch(e){}
      }
      if(Array.isArray(imgs)){
        bannerImages=imgs;
      }else if(imgs && typeof imgs==="object" && imgs.url){
        bannerImages=[imgs];
      }else if(data.url){
        bannerImages=[{url:data.url,link:data.link||""}];
      }else{
        bannerImages=[];
      }
    }else{
      bannerImages=[];
    }
  }catch(e){
    bannerImages=[];
  }
  renderBanner();
}
function renderBanner(){
  const carousel=document.getElementById("bannerCarousel");
  const empty=document.getElementById("bannerEmpty");
  const slidesBox=document.getElementById("bannerSlides");
  const dotsBox=document.getElementById("bannerDots");
  if(!carousel||!empty||!slidesBox||!dotsBox)return;
  const validImgs=bannerImages.filter(x=>x && x.url);
  if(validImgs.length===0){
    carousel.classList.add("hidden");
    if(typeof isAdmin!=="undefined" && isAdmin) empty.classList.remove("hidden");
    else empty.classList.add("hidden");
    return;
  }
  carousel.classList.remove("hidden");
  empty.classList.add("hidden");
  slidesBox.innerHTML=validImgs.map(img=>{
    const imgTag=`<img src="${escapeHtml(img.url)}" onerror="this.parentElement.style.display='none'" loading="lazy">`;
    if(img.link && img.link.trim()){return `<div class="bSlide" onclick="window.open('${escapeHtml(img.link)}','_blank')">${imgTag}</div>`;}
    return `<div class="bSlide">${imgTag}</div>`;
  }).join("");
  if(validImgs.length>1){
    dotsBox.innerHTML=validImgs.map((_,i)=>`<span class="bDot${i===0?' active':''}" onclick="goToBannerSlide(${i})"></span>`).join("");
    dotsBox.style.display="flex";
    startBannerAuto();
    slidesBox.onscroll=()=>{const idx=Math.round(slidesBox.scrollLeft/(slidesBox.clientWidth||1));updateBannerDots(idx);};
  }else{
    dotsBox.innerHTML="";dotsBox.style.display="none";
    if(bannerTimer){clearInterval(bannerTimer);bannerTimer=null;}
  }
}
window.goToBannerSlide=(i)=>{const slidesBox=document.getElementById("bannerSlides");if(!slidesBox)return;slidesBox.scrollTo({left:i*slidesBox.clientWidth,behavior:"smooth"});bannerCurrentIndex=i;updateBannerDots(i);};
function updateBannerDots(i){bannerCurrentIndex=i;document.querySelectorAll("#bannerDots .bDot").forEach((d,idx)=>d.classList.toggle("active",idx===i));}
function startBannerAuto(){
  if(bannerTimer)clearInterval(bannerTimer);
  const validCount=bannerImages.filter(x=>x&&x.url).length;
  if(validCount<=1)return;
  bannerTimer=setInterval(()=>{
    const slidesBox=document.getElementById("bannerSlides");
    if(!slidesBox)return;
    const next=(bannerCurrentIndex+1)%validCount;
    slidesBox.scrollTo({left:next*slidesBox.clientWidth,behavior:"smooth"});
    updateBannerDots(next);
  },4500);
}

/* ============================================
   GPS + إشعارات
   ============================================ */
window.detectCity=async(evt)=>{
  const btn=(evt && evt.target) || (typeof event !== 'undefined' && event?.target) || document.querySelector('.detectCityBtn') || document.getElementById('detectCityBtn');
  if(!btn)return;
  const oldText=btn.textContent;
  if(!navigator.geolocation){showToast("❌ المتصفح لا يدعم تحديد الموقع","error");return;}
  btn.disabled=true;btn.textContent="⏳ جاري تحديد موقعك...";
  navigator.geolocation.getCurrentPosition(async(pos)=>{
    try{
      const {latitude,longitude}=pos.coords;
      const res=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`);
      const data=await res.json();
      const cityName=data.address?.city||data.address?.town||data.address?.village||data.address?.state||"";
      const allCities=Object.values(LIBYA_CITIES).flat();
      let match=allCities.find(c=>cityName && (cityName.includes(c)||c.includes(cityName)));
      if(match){
        const citySelect = document.getElementById("city");
        if(citySelect) citySelect.value = match;
        showToast(`✅ تم تحديد موقعك: ${match}`,"success");
      }else{
        showToast("⚠️ لم نتعرف على المدينة بدقة — يرجى اختيارها من القائمة","info");
      }
    }catch(e){showToast("⚠️ فشل تحديد الموقع","error");}
    finally{btn.disabled=false;btn.textContent=oldText;}
  },(err)=>{
    btn.disabled=false;btn.textContent=oldText;
    if(err.code===1)showToast("❌ رفضت إذن الموقع","error");
    else showToast("⚠️ تعذر تحديد الموقع","warn");
  },{timeout:10000});
};

window.enableNotifications=async()=>{
  try{
    let tries=0;
    while(!window.OneSignal && tries<25){await new Promise(r=>setTimeout(r,200));tries++;}
    if(!window.OneSignal){showToast("⚠️ خدمة الإشعارات لم تُحمّل بعد.","warn");return;}
    const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone=window.matchMedia('(display-mode:standalone)').matches || window.navigator.standalone===true;
    if(isIOS && !isStandalone){
      alert("📱 على iPhone:\n\n1. افتح Safari\n2. اضغط زر المشاركة\n3. اختر: إضافة إلى الشاشة الرئيسية\n4. افتح من الأيقونة الجديدة\n5. اضغط 🔔 مرة ثانية");
      return;
    }
    await window.OneSignal.Notifications.requestPermission();
    if(window.OneSignal.Notifications.permission){showToast("✅ تم تفعيل الإشعارات بنجاح","success");}
    else{showToast("⚠️ لم يتم منح إذن الإشعارات","warn");}
  }catch(e){showToast("تعذر تفعيل الإشعارات: "+e.message,"error");}
};

/* ============================================
   Auth
   ============================================ */
onAuthStateChanged(auth,user=>{
if(user){
isAdmin=user.email===ADMIN_EMAIL;
adminChip.classList.toggle("hidden",!isAdmin);
navAccountLabel.textContent="حسابي";
startProfileListener(user);
syncFullUserProfile(user.uid);
startFollowingListener(user);
giveWelcomePoints(user.uid);
startPointsListener(user.uid);
if(typeof setupUserWalletListener === 'function') setupUserWalletListener(user.uid);
if(typeof updateGlobalUnreadChatCount === 'function') updateGlobalUnreadChatCount();
if(typeof startGlobalChatPoller === 'function') startGlobalChatPoller();
if(typeof startGlobalRestaurantOrdersPoller === 'function') startGlobalRestaurantOrdersPoller();
setTimeout(()=>syncPendingPoints(),2000);
if(isAdmin && !reportsListenerStarted){reportsListenerStarted=true;startReportsListener();}
if(isAdmin && !pendingPostsListenerStarted){startPendingPostsListener();}
if(moderationBtn)moderationBtn.classList.toggle("hidden",!isAdmin);
const smb=document.getElementById("storesModerationBtn");if(smb)smb.classList.toggle("hidden",!isAdmin);
const acsb=document.getElementById("adminCreateStoreBtn");if(acsb)acsb.classList.toggle("hidden",!isAdmin);
const eb=document.getElementById("expiredBtn");if(eb)eb.classList.toggle("hidden",!isAdmin);
const limitsBtn=document.getElementById("limitsBtn");
if(limitsBtn)limitsBtn.classList.toggle("hidden",!isAdmin);
const dashBtn=document.getElementById("dashboardBtn");
if(dashBtn)dashBtn.classList.toggle("hidden",!isAdmin);
updateModBadge();
closeOverlay();
if(isAdmin && pendingAutoUpgrade){
  const checkUpgrade=()=>{if(allPosts.length>0){tryApplyPendingUpgrade();}else{setTimeout(checkUpgrade,500);}};
  setTimeout(checkUpgrade,1500);
}
if(isAdmin){
  const checkAutoDelete=()=>{if(allPosts.length>0){autoDeleteOldExpired();}else{setTimeout(checkAutoDelete,1000);}};
  setTimeout(checkAutoDelete,3000);
}
if(pendingAction==="form"){pendingAction=null;showForm();}
else if(pendingAction==="postType"){pendingAction=null;setTimeout(()=>startAddPost(),300);}
else if(pendingAction==="mine"){pendingAction=null;showMyPosts();}
else if(pendingAction==="favorites"){pendingAction=null;showFavorites();}
else if(pendingAction==="following"){pendingAction=null;showFollowingPosts();}
else if(pendingAction && typeof pendingAction==="object" && pendingAction.type==="report"){const pid=pendingAction.postId;pendingAction=null;setTimeout(()=>{reportPost(pid);},500);}
else if(pendingAction && typeof pendingAction==="object" && pendingAction.type==="follow"){const suid=pendingAction.sellerUid;pendingAction=null;setTimeout(()=>{toggleFollow(suid);},500);}
else if(pendingAction && typeof pendingAction==="object" && pendingAction.type==="storeRating"){const sid=pendingAction.storeId;pendingAction=null;setTimeout(()=>{openStoreRating(sid);},500);}
else if(window.location.hash === '#account'){
  setTimeout(()=>openAccount(true), 150);
}else{renderPosts();}
updateAccountScreenUI();
updateCartUI();
}else{
isAdmin=false;
if(window._globalChatPollerTimer){ clearInterval(window._globalChatPollerTimer); window._globalChatPollerTimer = null; }
if(window._globalOrdersPollerTimer){ clearInterval(window._globalOrdersPollerTimer); window._globalOrdersPollerTimer = null; }
adminChip.classList.add("hidden");
navAccountLabel.textContent="دخول";
stopProfileListener();
stopStoreListener();
stopFollowingListener();
stopPendingPostsListener();
if(typeof _walletUnsub === 'function'){ try{ _walletUnsub(); }catch(e){} _walletUnsub = null; }
if(typeof updateWalletUI === 'function') updateWalletUI(0);
const chatHb = document.getElementById("chatHeaderBadge"); if(chatHb) chatHb.style.display="none";
const chatAb = document.getElementById("accountChatBadge"); if(chatAb) chatAb.style.display="none";
if(showOnlyMine)showHome();
renderPosts();
}
});

window.logout=async()=>{
  if(window._globalChatPollerTimer){ clearInterval(window._globalChatPollerTimer); window._globalChatPollerTimer = null; }
  if(window._globalOrdersPollerTimer){ clearInterval(window._globalOrdersPollerTimer); window._globalOrdersPollerTimer = null; }
  Object.keys(userLimitsCache).forEach(k=>delete userLimitsCache[k]);
  try{sessionStorage.removeItem('_tempStoreData');}catch(e){}
  try{localStorage.removeItem('tasawuq_cached_profile');}catch(e){}
  allReports = [];
  allLimits = [];
  allPendingPosts = [];
  myProfile = null;
  window.myProfile = null;
  myStore = null;
  compareList = [];
  saveCompare();
  cart = {storeId:null, storeName:"", storePhone:"", items:[]};
  saveCart();
  await signOut(auth);
};

const googleProvider=new GoogleAuthProvider();
googleProvider.setCustomParameters({prompt:'select_account'});
window.loginWithGoogle=async()=>{
  try{
    await signInWithPopup(auth,googleProvider);
  }catch(e){
    if(e.code==="auth/popup-closed-by-user"){}
    else if(e.code==="auth/popup-blocked")showToast("الرجاء السماح بالنوافذ المنبثقة","warn");
    else if(e.code==="auth/unauthorized-domain")showToast("هذا النطاق غير مصرح به","error");
    else showToast("تعذر تسجيل الدخول: "+(e.message||e.code||"خطأ"),"error");
  }
};

window.loginWithEmail=async()=>{
  const input=document.getElementById("magicEmailInput");
  const email=(input?.value||"").trim();
  if(!email || !email.includes("@")){
    showToast("الرجاء إدخال بريد إلكتروني صحيح","warn");
    return;
  }
  try{
    showToast("⏳ جاري إرسال رابط الدخول...","info");
    const { error }=await supabase.auth.signInWithOtp({
      email,
      options:{ emailRedirectTo: window.location.origin + window.location.pathname }
    });
    if(error) throw error;
    showToast("✅ تم إرسال رابط الدخول إلى بريدك الإلكتروني! تفقد صندوق الوارد أو البريد غير الهام.","success",7000);
    closeOverlay();
  }catch(err){
    showToast("تعذر الإرسال: "+(err.message||err),"error");
  }
};

/* ============================================
   📢 إشعارات داخل التطبيق (In-App)
   ============================================ */
let _appNotificationsCache = [];

function listenToAppNotifications(){
  onSnapshot(collection(db,"app_notifications"), snap => {
    if(snap.empty) return;
    _appNotificationsCache = snap.docs.map(d=>({id:d.id, ...d.data()})).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    checkAndShowNextInAppBanner();
  });
}

function checkAndShowNextInAppBanner(){
  if(!_appNotificationsCache || _appNotificationsCache.length === 0) return;
  const seen = JSON.parse(localStorage.getItem("seenAppNotifs") || "[]");
  const nextUnseen = _appNotificationsCache.find(n => !seen.includes(n.id));
  if(!nextUnseen) return;
  showInAppBanner(nextUnseen);
}

function showInAppBanner(notif){
  const oldBanner = document.getElementById("inAppNotifBanner");
  if(oldBanner) oldBanner.remove();

  const banner = document.createElement("div");
  banner.id = "inAppNotifBanner";
  banner.style.cssText = "position:fixed;top:70px;right:12px;left:12px;z-index:99998;background:linear-gradient(135deg,#0284c7,#38bdf8);color:#fff;padding:14px 16px;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.25);display:flex;gap:12px;align-items:flex-start;animation:slideDown .3s ease-out;max-width:480px;margin:0 auto;font-family:'Cairo',sans-serif;";
  
  const linkHtml = notif.link ? '<a href="'+escapeHtml(notif.link)+'" target="_blank" style="display:inline-block;margin-top:8px;background:rgba(255,255,255,.25);color:#fff;padding:6px 14px;border-radius:8px;font-size:12px;font-weight:800;text-decoration:none">👉 اضغط هنا</a>' : "";

  banner.innerHTML = 
    '<div style="font-size:24px;flex:0 0 auto;line-height:1">🔔</div>' +
    '<div style="flex:1;min-width:0">' +
      '<div style="font-weight:800;font-size:14.5px;margin-bottom:3px;line-height:1.4">'+escapeHtml(notif.title)+'</div>' +
      '<div style="font-size:12.5px;line-height:1.6;opacity:.95">'+escapeHtml(notif.message)+'</div>' +
      linkHtml +
    '</div>' +
    '<button onclick="dismissInAppBanner(\''+notif.id+'\')" style="background:rgba(255,255,255,.25);border:none;color:#fff;width:30px;height:30px;border-radius:50%;font-size:16px;font-weight:800;cursor:pointer;flex:0 0 auto;display:flex;align-items:center;justify-content:center;line-height:1;padding:0">×</button>';
  
  document.body.appendChild(banner);
  
  setTimeout(() => {
    if(document.getElementById("inAppNotifBanner")) dismissInAppBanner(notif.id);
  }, 15000);
}

window.dismissInAppBanner = (id) => {
  const banner = document.getElementById("inAppNotifBanner");
  if(banner) banner.remove();
  try{
    const seen = JSON.parse(localStorage.getItem("seenAppNotifs") || "[]");
    if(!seen.includes(id)){
      seen.push(id);
      if(seen.length > 30) seen.shift();
      localStorage.setItem("seenAppNotifs", JSON.stringify(seen));
    }
  }catch(e){}
  setTimeout(checkAndShowNextInAppBanner, 1500);
};

/* ============================================
   Start Listeners
   ============================================ */  
startPostsListener();
startStoresListener();
loadBanner();
listenToAppNotifications();

setTimeout(()=>{
  if(!categoriesScreen.classList.contains('hidden')){
    showFloatingButtons();
  } else {
    hideFloatingButtons();
  }
}, 800);

function handleHashRouting(hash){
  if(!hash) return;
  if(hash.startsWith('#store-')){
    const sid=hash.substring(7);
    let t=0;
    const iv=setInterval(()=>{
      t++;
      if(allStores.find(s=>s.id===sid) || t>25){
        clearInterval(iv);
        if(allStores.find(s=>s.id===sid)) openStore(sid,false,'categories');
      }
    },400);
  } else if(hash.startsWith('#post-')){
    const [pp,qp]=hash.split('?');
    const id=pp.substring(6);
    const params=new URLSearchParams(qp||'');
    const pd=parseInt(params.get('plan')||'0',10);
    const pr=parseInt(params.get('price')||'0',10);
    if(pd>0){pendingAutoUpgrade={postId:id,days:pd,price:pr};}
    let t=0;
    const iv=setInterval(()=>{
      t++;
      if(allPosts.find(p=>p.id===id)){clearInterval(iv);openPost(id);setTimeout(tryApplyPendingUpgrade,1500);}
      else if(t>25){clearInterval(iv);setTimeout(tryApplyPendingUpgrade,500);}
    },400);
  } else if(hash.startsWith('#cat-')){
    const cat = decodeURIComponent(hash.substring(5));
    setTimeout(()=>{ if(typeof openCategory === 'function') openCategory(cat); }, 400);
  } else if(hash === '#cart'){
    setTimeout(()=>{ if(typeof openCart === 'function') openCart(); }, 400);
  } else if(hash === '#form'){
    setTimeout(()=>{ if(typeof openFormScreen === 'function') openFormScreen(); }, 400);
  } else if(hash === '#account'){
    let t = 0;
    const iv = setInterval(() => {
      t++;
      if (auth.currentUser || t > 12) {
        clearInterval(iv);
        if (typeof openAccount === 'function') openAccount(true);
      }
    }, 150);
  } else if(hash === '#inbox'){
    setTimeout(()=>{ if(typeof openInbox === 'function') openInbox(); }, 500);
  } else if(hash.startsWith('#seller-')){
    const sellerUid = hash.substring(8);
    setTimeout(()=>{ if(typeof openSeller === 'function') openSeller(sellerUid); }, 400);
  } else if(hash === '#stores'){
    setTimeout(()=>{ if(typeof openStores === 'function') openStores('stores'); }, 400);
  } else if(hash === '#restaurants'){
    setTimeout(()=>{ if(typeof openStores === 'function') openStores('restaurants'); }, 400);
  } else if(hash.startsWith('#restaurant-orders')){
    const parts = hash.split('-');
    const sid = parts.length >= 3 ? parts[2] : (myStore ? myStore.id : '');
    if(sid){
      setTimeout(()=>openRestaurantLiveOrders(sid), 1000);
    }
  }
}
window.handleHashRouting = handleHashRouting;

window.addEventListener('load',()=>{
  if(myProfile) updateAccountScreenUI();
  handleHashRouting(window.location.hash);
  try {
    const activeOrdId = localStorage.getItem('tasawuq_active_order_id');
    if(activeOrdId){
      setTimeout(()=>{
        if(typeof checkActiveOrderSilently === 'function') checkActiveOrderSilently(activeOrdId);
      }, 1500);
    }
  }catch(e){}
});

window.addEventListener('hashchange', ()=>{
  if(typeof _isHistoryNavigating !== 'undefined' && !_isHistoryNavigating){
    handleHashRouting(window.location.hash);
  }
});

setTimeout(refreshNavIcons, 500);
setTimeout(refreshNavIcons, 1500);
setTimeout(refreshNavIcons, 3000);

// ============================================
// ربط كافة دوال ووظائف التطبيق بـ window لضمان عمل كافة أحداث الـ HTML (onclick, oninput, onchange)

// ============================================
// نشر الإعلان تلقائياً في قناة التليجرام @tasawuqnow
// ============================================
async function sendPostToTelegram(post){
  if(!post) return;
  const token = "8476996485:AAH_06mzTH3V8f-0e-GXEVC2a46hSlz3Yl4";
  const chatId = "@tasawuqnow";
  
  const priceText = post.priceType === "contact" 
    ? "📞 عند الاتصال" 
    : (post.price != null ? Number(post.price).toLocaleString() + " د.ل" : "للتواصل");
  
  const cityText = post.city ? "\n📍 المدينة: " + post.city : "";
  const catText = post.category ? "\n🏷️ التصنيف: " + post.category : "";
  const brandText = post.brand ? " (" + post.brand + ")" : "";
  const postUrl = "https://tasawuqnow.com/#post-" + post.id;
  
  const caption = "🔥 إعلان جديد على تسوق الآن!\n\n📌 " + (post.title || "إعلان") + "\n💰 السعر: " + priceText + cityText + catText + brandText + "\n\n🔗 شاهد باقي الصور وتواصل مع البائع:\n" + postUrl + "\n\n📢 تابعنا لأحدث العروض: @tasawuqnow";

  const images = (post.images && post.images.length > 0) ? post.images : (post.image ? [post.image] : []);

  try {
    if (images.length > 0) {
      await fetch("https://api.telegram.org/bot" + token + "/sendPhoto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, photo: images[0], caption: caption })
      });
    } else {
      await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: caption })
      });
    }
  } catch (err) {
    console.warn("Telegram broadcast error:", err);
  }
}
window.sendPostToTelegram = sendPostToTelegram;

// ============================================
// أداة توليد صورة الستوري (Story Card Generator)
// ============================================
let currentStoryDataUrl = null;
let currentStoryPost = null;

async function generateStoryImage(post) {
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch(e){}
  }
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if ('direction' in ctx) {
    ctx.direction = 'rtl';
  }

  // خلفية تدرج لوني فخم
  const grad = ctx.createLinearGradient(0, 0, 0, 1920);
  grad.addColorStop(0, "#0b1329");
  grad.addColorStop(0.5, "#111827");
  grad.addColorStop(1, "#0f172a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1920);

  // دوائر زخرفية
  ctx.fillStyle = "rgba(56, 189, 248, 0.08)";
  ctx.beginPath();
  ctx.arc(100, 200, 320, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(236, 72, 153, 0.07)";
  ctx.beginPath();
  ctx.arc(980, 1680, 420, 0, Math.PI * 2);
  ctx.fill();

  // رأس البطاقة - اسم الموقع
  ctx.textAlign = "center";
  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 46px 'Cairo', sans-serif";
  ctx.fillText("🛒 تـسـوق الآن | TasawuqNow.com", 540, 140);

  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.font = "26px 'Cairo', sans-serif";
  ctx.fillText("منصة الإعلانات المبوبة في ليبيا", 540, 195);

  // خط فاصل
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(140, 240);
  ctx.lineTo(940, 240);
  ctx.stroke();

  // صورة السلعة الرئيسية
  const imgX = 100, imgY = 280, imgW = 880, imgH = 880, radius = 36;
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(imgX, imgY, imgW, imgH, radius);
  else ctx.rect(imgX, imgY, imgW, imgH);
  ctx.clip();

  const images = (post.images && post.images.length > 0) ? post.images : (post.image ? [post.image] : []);
  let imageLoaded = false;

  if (images.length > 0) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve) => {
        img.onload = () => { imageLoaded = true; resolve(); };
        img.onerror = () => { resolve(); };
        setTimeout(resolve, 3500);
        img.src = images[0];
      });
      if (imageLoaded) {
        const hRatio = imgW / img.width;
        const vRatio = imgH / img.height;
        const ratio = Math.max(hRatio, vRatio);
        const shiftX = (imgW - img.width * ratio) / 2;
        const shiftY = (imgH - img.height * ratio) / 2;
        ctx.drawImage(img, 0, 0, img.width, img.height, imgX + shiftX, imgY + shiftY, img.width * ratio, img.height * ratio);
      }
    } catch(e) {}
  }

  if (!imageLoaded) {
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(imgX, imgY, imgW, imgH);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 80px 'Cairo', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("📸 تسوق الآن", imgX + imgW / 2, imgY + imgH / 2);
  }
  ctx.restore();

  // إطار الصورة
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(imgX, imgY, imgW, imgH, radius);
  else ctx.rect(imgX, imgY, imgW, imgH);
  ctx.stroke();

  // وسم التصنيف فوق الصورة
  if (post.category) {
    ctx.fillStyle = "rgba(2, 132, 199, 0.92)";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(140, 320, 240, 60, 16);
    else ctx.fillRect(140, 320, 240, 60);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 26px 'Cairo', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(post.category, 260, 360);
  }

  // عنوان الإعلان
  ctx.textAlign = "right";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 50px 'Cairo', sans-serif";
  const title = post.title || "إعلان مميز";
  if (title.length > 32) {
    ctx.fillText(title.slice(0, 32), 980, 1240);
    ctx.fillText(title.slice(32, 64) + "...", 980, 1300);
  } else {
    ctx.fillText(title, 980, 1260);
  }

  // شريط السعر والمدينة
  const priceY = 1360;
  ctx.fillStyle = "#f59e0b";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(100, priceY, 460, 110, 24);
  else ctx.fillRect(100, priceY, 460, 110);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "bold 44px 'Cairo', sans-serif";
  const priceStr = post.priceType === "contact" ? "📞 عند الاتصال" : (post.price != null ? Number(post.price).toLocaleString() + " د.ل" : "للتواصل");
  ctx.fillText(priceStr, 330, priceY + 70);

  // شارة المدينة
  if (post.city) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(590, priceY, 390, 110, 24);
    else ctx.fillRect(590, priceY, 390, 110);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 36px 'Cairo', sans-serif";
    ctx.fillText("📍 " + post.city, 785, priceY + 70);
  }

  // بطاقة أسفل الإعلان (دعوة للتواصل)
  const ctaY = 1520;
  ctx.fillStyle = "rgba(2, 132, 199, 0.2)";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(100, ctaY, 880, 260, 28);
  else ctx.fillRect(100, ctaY, 880, 260);
  ctx.fill();
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 38px 'Cairo', sans-serif";
  ctx.fillText("💬 تواصل مباشرة مع المعلن عبر واتساب", 540, ctaY + 75);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px 'Cairo', sans-serif";
  ctx.fillText("ابحث عن الإعلان في موقعنا الآن:", 540, ctaY + 140);

  ctx.fillStyle = "#fde047";
  ctx.font = "bold 42px 'Cairo', sans-serif";
  ctx.fillText("tasawuqnow.com", 540, ctaY + 215);

  try {
    return canvas.toDataURL("image/jpeg", 0.92);
  } catch(err) {
    console.warn("Story canvas export fallback:", err);
    const cleanCanvas = document.createElement("canvas");
    cleanCanvas.width = 1080;
    cleanCanvas.height = 1920;
    const cctx = cleanCanvas.getContext("2d");
    const g = cctx.createLinearGradient(0, 0, 0, 1920);
    g.addColorStop(0, "#0b1329");
    g.addColorStop(0.5, "#111827");
    g.addColorStop(1, "#0f172a");
    cctx.fillStyle = g;
    cctx.fillRect(0, 0, 1080, 1920);
    cctx.textAlign = "center";
    cctx.fillStyle = "#38bdf8";
    cctx.font = "bold 52px 'Cairo', sans-serif";
    cctx.fillText("🛒 تـسـوق الآن | TasawuqNow.com", 540, 200);
    cctx.fillStyle = "#ffffff";
    cctx.font = "bold 54px 'Cairo', sans-serif";
    cctx.fillText(post.title || "إعلان مميز", 540, 680);
    cctx.fillStyle = "#f59e0b";
    cctx.font = "bold 64px 'Cairo', sans-serif";
    const pText = post.priceType === "contact" ? "📞 تواصل لمعرفة السعر" : (post.price != null ? post.price + " د.ل" : "");
    cctx.fillText(pText, 540, 820);
    if(post.city){
      cctx.fillStyle = "#94a3b8";
      cctx.font = "bold 44px 'Cairo', sans-serif";
      cctx.fillText("📍 " + post.city, 540, 940);
    }
    cctx.fillStyle = "#38bdf8";
    cctx.font = "bold 44px 'Cairo', sans-serif";
    cctx.fillText("شاهد الإعلان وتواصل مع البائع:", 540, 1500);
    cctx.fillStyle = "#fde047";
    cctx.font = "bold 52px 'Cairo', sans-serif";
    cctx.fillText("tasawuqnow.com", 540, 1600);
    return cleanCanvas.toDataURL("image/jpeg", 0.9);
  }
}

window.openStoryModal = async function(id, skipHistory) {
  const p = allPosts.find(x => x.id === id);
  if (!p) return;
  currentStoryPost = p;
  const overlay = document.getElementById("storyModalOverlay");
  const loader = document.getElementById("storyLoading");
  const img = document.getElementById("storyPreviewImg");
  const actions = document.getElementById("storyActionsBox");
  if (!overlay) return;

  overlay.classList.remove("hidden");
  if(!skipHistory) pushNavState({ screen: 'storyModal', id: id });
  loader.style.display = "block";
  img.style.display = "none";
  actions.style.display = "none";

  try {
    currentStoryDataUrl = await generateStoryImage(p);
    img.src = currentStoryDataUrl;
    loader.style.display = "none";
    img.style.display = "block";
    actions.style.display = "flex";
  } catch (err) {
    loader.textContent = "تعذر توليد الصورة: " + err.message;
  }
};

function closeStoryModalDirect(){
  const overlay = document.getElementById("storyModalOverlay");
  if (overlay) overlay.classList.add("hidden");
}
window.closeStoryModalDirect = closeStoryModalDirect;
window.closeStoryModal = function() {
  if (!_isHistoryNavigating && window.history.state && window.history.state.screen === 'storyModal') {
    window.history.back();
    return;
  }
  closeStoryModalDirect();
};

window.downloadStoryImage = function() {
  if (!currentStoryDataUrl) return;
  const a = document.createElement("a");
  a.href = currentStoryDataUrl;
  const title = (currentStoryPost && currentStoryPost.title) ? currentStoryPost.title.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_').slice(0, 20) : "story";
  a.download = "tasawuq-" + title + ".png";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast("📥 تم حفظ صورة الستوري بجهازك!", "success");
};

window.shareStoryDirectly = async function() {
  if (!currentStoryDataUrl) return;
  try {
    const res = await fetch(currentStoryDataUrl);
    const blob = await res.blob();
    const file = new File([blob], "tasawuq-story.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: currentStoryPost ? currentStoryPost.title : "إعلان على تسوق الآن",
        text: "شاهد هذا الإعلان على تسوق الآن: https://tasawuqnow.com/#post-" + (currentStoryPost ? currentStoryPost.id : "")
      });
      return;
    }
  } catch(e) {}
  downloadStoryImage();
  setTimeout(() => {
    showToast("تم تنزيل الصورة، يمكنك نشرها الآن في ستوري واتساب أو فيسبوك!", "info", 4000);
  }, 1000);
};

// ============================================
// دوال برنامج الإحالة والمكافآت (Referrals)
// ============================================
window.copyRefLink = function() {
  const refCode = (myProfile && myProfile.memberNo) ? myProfile.memberNo : (auth.currentUser ? auth.currentUser.uid : "");
  const link = window.location.origin + window.location.pathname + "?ref=" + refCode;
  navigator.clipboard.writeText(link).then(() => {
    showToast("📋 تم نسخ رابط الدعوة بنجاح!", "success");
  }).catch(() => {
    prompt("انسخ رابط الدعوة الخاص بك:", link);
  });
};

window.shareRefOnWhatsapp = function() {
  const refCode = (myProfile && myProfile.memberNo) ? myProfile.memberNo : (auth.currentUser ? auth.currentUser.uid : "");
  const link = window.location.origin + window.location.pathname + "?ref=" + refCode;
  const msg = "🔥 تطبيق وموقع تسوق الآن في ليبيا — لبيع وشراء السيارات، العقارات، والأجهزة مجاناً!\n\nسجّل بحساب Google من هذا الرابط واكسب نقاط ترحيبية فورية:\n" + link;
  window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
};


// ============================================
if (typeof addPoints === 'function' && typeof window.addPoints === 'undefined') window.addPoints = addPoints;
if (typeof addRecentView === 'function' && typeof window.addRecentView === 'undefined') window.addRecentView = addRecentView;
if (typeof addToSearchHistory === 'function' && typeof window.addToSearchHistory === 'undefined') window.addToSearchHistory = addToSearchHistory;
if (typeof assignMemberNumber === 'function' && typeof window.assignMemberNumber === 'undefined') window.assignMemberNumber = assignMemberNumber;
if (typeof autoDeleteOldExpired === 'function' && typeof window.autoDeleteOldExpired === 'undefined') window.autoDeleteOldExpired = autoDeleteOldExpired;
if (typeof buildCategoriesGrid === 'function' && typeof window.buildCategoriesGrid === 'undefined') window.buildCategoriesGrid = buildCategoriesGrid;
if (typeof buildEmptyState === 'function' && typeof window.buildEmptyState === 'undefined') window.buildEmptyState = buildEmptyState;
if (typeof canHaveCart === 'function' && typeof window.canHaveCart === 'undefined') window.canHaveCart = canHaveCart;
if (typeof carouselHtml === 'function' && typeof window.carouselHtml === 'undefined') window.carouselHtml = carouselHtml;
if (typeof cartTotalCount === 'function' && typeof window.cartTotalCount === 'undefined') window.cartTotalCount = cartTotalCount;
if (typeof cartTotalItemsCount === 'function' && typeof window.cartTotalItemsCount === 'undefined') window.cartTotalItemsCount = cartTotalItemsCount;
if (typeof cartTotalPrice === 'function' && typeof window.cartTotalPrice === 'undefined') window.cartTotalPrice = cartTotalPrice;
if (typeof catIconHtml === 'function' && typeof window.catIconHtml === 'undefined') window.catIconHtml = catIconHtml;
if (typeof checkContent === 'function' && typeof window.checkContent === 'undefined') window.checkContent = checkContent;
if (typeof clearSearchHistory === 'function' && typeof window.clearSearchHistory === 'undefined') window.clearSearchHistory = clearSearchHistory;
if (typeof compressImage === 'function' && typeof window.compressImage === 'undefined') window.compressImage = compressImage;
if (typeof createAIModel === 'function' && typeof window.createAIModel === 'undefined') window.createAIModel = createAIModel;
if (typeof daysLeft === 'function' && typeof window.daysLeft === 'undefined') window.daysLeft = daysLeft;
if (typeof defaultName === 'function' && typeof window.defaultName === 'undefined') window.defaultName = defaultName;
if (typeof detectForbidden === 'function' && typeof window.detectForbidden === 'undefined') window.detectForbidden = detectForbidden;
if (typeof dotsHtml === 'function' && typeof window.dotsHtml === 'undefined') window.dotsHtml = dotsHtml;
if (typeof escapeHtml === 'function' && typeof window.escapeHtml === 'undefined') window.escapeHtml = escapeHtml;
if (typeof expiredGracePassed === 'function' && typeof window.expiredGracePassed === 'undefined') window.expiredGracePassed = expiredGracePassed;
if (typeof featuredDaysLeft === 'function' && typeof window.featuredDaysLeft === 'undefined') window.featuredDaysLeft = featuredDaysLeft;
if (typeof findUserByAny === 'function' && typeof window.findUserByAny === 'undefined') window.findUserByAny = findUserByAny;
if (typeof formatPrice === 'function' && typeof window.formatPrice === 'undefined') window.formatPrice = formatPrice;
if (typeof formatStoreHours === 'function' && typeof window.formatStoreHours === 'undefined') window.formatStoreHours = formatStoreHours;
if (typeof generateAIContent === 'function' && typeof window.generateAIContent === 'undefined') window.generateAIContent = generateAIContent;
if (typeof getAICount === 'function' && typeof window.getAICount === 'undefined') window.getAICount = getAICount;
if (typeof getDiscountPercent === 'function' && typeof window.getDiscountPercent === 'undefined') window.getDiscountPercent = getDiscountPercent;
if (typeof getExpiresAt === 'function' && typeof window.getExpiresAt === 'undefined') window.getExpiresAt = getExpiresAt;
if (typeof getFavorites === 'function' && typeof window.getFavorites === 'undefined') window.getFavorites = getFavorites;
if (typeof getImages === 'function' && typeof window.getImages === 'undefined') window.getImages = getImages;
if (typeof getRecentViews === 'function' && typeof window.getRecentViews === 'undefined') window.getRecentViews = getRecentViews;
if (typeof getSearchHistory === 'function' && typeof window.getSearchHistory === 'undefined') window.getSearchHistory = getSearchHistory;
if (typeof getSellerTier === 'function' && typeof window.getSellerTier === 'undefined') window.getSellerTier = getSellerTier;
if (typeof getStatus === 'function' && typeof window.getStatus === 'undefined') window.getStatus = getStatus;
if (typeof getSuggestions === 'function' && typeof window.getSuggestions === 'undefined') window.getSuggestions = getSuggestions;
if (typeof getUserLimit === 'function' && typeof window.getUserLimit === 'undefined') window.getUserLimit = getUserLimit;
if (typeof getUserStoreLimit === 'function' && typeof window.getUserStoreLimit === 'undefined') window.getUserStoreLimit = getUserStoreLimit;
if (typeof getWheelStatus === 'function' && typeof window.getWheelStatus === 'undefined') window.getWheelStatus = getWheelStatus;
if (typeof giveWelcomePoints === 'function' && typeof window.giveWelcomePoints === 'undefined') window.giveWelcomePoints = giveWelcomePoints;
if (typeof giveWheelReward === 'function' && typeof window.giveWheelReward === 'undefined') window.giveWheelReward = giveWheelReward;
if (typeof hasViewedOnDevice === 'function' && typeof window.hasViewedOnDevice === 'undefined') window.hasViewedOnDevice = hasViewedOnDevice;
if (typeof hideFloatingButtons === 'function' && typeof window.hideFloatingButtons === 'undefined') window.hideFloatingButtons = hideFloatingButtons;
if (typeof incAICount === 'function' && typeof window.incAICount === 'undefined') window.incAICount = incAICount;
if (typeof incrementFavoritesCount === 'function' && typeof window.incrementFavoritesCount === 'undefined') window.incrementFavoritesCount = incrementFavoritesCount;
if (typeof incrementViews === 'function' && typeof window.incrementViews === 'undefined') window.incrementViews = incrementViews;
if (typeof incrementWhatsappClick === 'function' && typeof window.incrementWhatsappClick === 'undefined') window.incrementWhatsappClick = incrementWhatsappClick;
if (typeof initDarkMode === 'function' && typeof window.initDarkMode === 'undefined') window.initDarkMode = initDarkMode;
if (typeof initializePosition === 'function' && typeof window.initializePosition === 'undefined') window.initializePosition = initializePosition;
if (typeof isExpired === 'function' && typeof window.isExpired === 'undefined') window.isExpired = isExpired;
if (typeof isFavorite === 'function' && typeof window.isFavorite === 'undefined') window.isFavorite = isFavorite;
if (typeof isFollowing === 'function' && typeof window.isFollowing === 'undefined') window.isFollowing = isFollowing;
if (typeof isPostFeatured === 'function' && typeof window.isPostFeatured === 'undefined') window.isPostFeatured = isPostFeatured;
if (typeof isRestaurantCategory === 'function' && typeof window.isRestaurantCategory === 'undefined') window.isRestaurantCategory = isRestaurantCategory;
if (typeof isRestaurantStore === 'function' && typeof window.isRestaurantStore === 'undefined') window.isRestaurantStore = isRestaurantStore;
if (typeof isStoreOpen === 'function' && typeof window.isStoreOpen === 'undefined') window.isStoreOpen = isStoreOpen;
if (typeof isWanted === 'function' && typeof window.isWanted === 'undefined') window.isWanted = isWanted;
if (typeof listenToAppNotifications === 'function' && typeof window.listenToAppNotifications === 'undefined') window.listenToAppNotifications = listenToAppNotifications;
if (typeof loadBanner === 'function' && typeof window.loadBanner === 'undefined') window.loadBanner = loadBanner;
if (typeof loadCart === 'function' && typeof window.loadCart === 'undefined') window.loadCart = loadCart;
if (typeof loadStoreRatings === 'function' && typeof window.loadStoreRatings === 'undefined') window.loadStoreRatings = loadStoreRatings;
if (typeof markViewedOnDevice === 'function' && typeof window.markViewedOnDevice === 'undefined') window.markViewedOnDevice = markViewedOnDevice;
if (typeof normalizePhone === 'function' && typeof window.normalizePhone === 'undefined') window.normalizePhone = normalizePhone;
if (typeof openBadgeHTML === 'function' && typeof window.openBadgeHTML === 'undefined') window.openBadgeHTML = openBadgeHTML;
if (typeof openFormScreen === 'function' && typeof window.openFormScreen === 'undefined') window.openFormScreen = openFormScreen;
if (typeof pickWheelReward === 'function' && typeof window.pickWheelReward === 'undefined') window.pickWheelReward = pickWheelReward;
if (typeof populateBrandSelect === 'function' && typeof window.populateBrandSelect === 'undefined') window.populateBrandSelect = populateBrandSelect;
if (typeof populateCategorySelects === 'function' && typeof window.populateCategorySelects === 'undefined') window.populateCategorySelects = populateCategorySelects;
if (typeof populateCitySelects === 'function' && typeof window.populateCitySelects === 'undefined') window.populateCitySelects = populateCitySelects;
if (typeof profileCreatedAt === 'function' && typeof window.profileCreatedAt === 'undefined') window.profileCreatedAt = profileCreatedAt;
if (typeof refreshNavIcons === 'function' && typeof window.refreshNavIcons === 'undefined') window.refreshNavIcons = refreshNavIcons;
if (typeof removeFromHistory === 'function' && typeof window.removeFromHistory === 'undefined') window.removeFromHistory = removeFromHistory;
if (typeof renderBanner === 'function' && typeof window.renderBanner === 'undefined') window.renderBanner = renderBanner;
if (typeof renderCartUI === 'function' && typeof window.renderCartUI === 'undefined') window.renderCartUI = renderCartUI;
if (typeof renderEditStoreLogo === 'function' && typeof window.renderEditStoreLogo === 'undefined') window.renderEditStoreLogo = renderEditStoreLogo;
if (typeof renderExpiredList === 'function' && typeof window.renderExpiredList === 'undefined') window.renderExpiredList = renderExpiredList;
if (typeof renderHistory === 'function' && typeof window.renderHistory === 'undefined') window.renderHistory = renderHistory;
if (typeof renderImagePicker === 'function' && typeof window.renderImagePicker === 'undefined') window.renderImagePicker = renderImagePicker;
if (typeof renderLimits === 'function' && typeof window.renderLimits === 'undefined') window.renderLimits = renderLimits;
if (typeof renderModeration === 'function' && typeof window.renderModeration === 'undefined') window.renderModeration = renderModeration;
if (typeof renderPoints === 'function' && typeof window.renderPoints === 'undefined') window.renderPoints = renderPoints;
if (typeof renderPosts === 'function' && typeof window.renderPosts === 'undefined') window.renderPosts = renderPosts;
if (typeof renderRecentlyViewed === 'function' && typeof window.renderRecentlyViewed === 'undefined') window.renderRecentlyViewed = renderRecentlyViewed;
if (typeof renderReports === 'function' && typeof window.renderReports === 'undefined') window.renderReports = renderReports;
if (typeof renderRewards === 'function' && typeof window.renderRewards === 'undefined') window.renderRewards = renderRewards;
if (typeof renderSeller === 'function' && typeof window.renderSeller === 'undefined') window.renderSeller = renderSeller;
if (typeof renderSellerTierBadge === 'function' && typeof window.renderSellerTierBadge === 'undefined') window.renderSellerTierBadge = renderSellerTierBadge;
if (typeof renderSkeletons === 'function' && typeof window.renderSkeletons === 'undefined') window.renderSkeletons = renderSkeletons;
if (typeof renderStoreCover === 'function' && typeof window.renderStoreCover === 'undefined') window.renderStoreCover = renderStoreCover;
if (typeof renderStoreHelpersList === 'function' && typeof window.renderStoreHelpersList === 'undefined') window.renderStoreHelpersList = renderStoreHelpersList;
if (typeof renderStoreLogo === 'function' && typeof window.renderStoreLogo === 'undefined') window.renderStoreLogo = renderStoreLogo;
if (typeof renderStoreProducts === 'function' && typeof window.renderStoreProducts === 'undefined') window.renderStoreProducts = renderStoreProducts;
if (typeof renderStoresList === 'function' && typeof window.renderStoresList === 'undefined') window.renderStoresList = renderStoresList;
if (typeof renderStoresModeration === 'function' && typeof window.renderStoresModeration === 'undefined') window.renderStoresModeration = renderStoresModeration;
if (typeof renderSubCats === 'function' && typeof window.renderSubCats === 'undefined') window.renderSubCats = renderSubCats;
if (typeof reservePhone === 'function' && typeof window.reservePhone === 'undefined') window.reservePhone = reservePhone;
if (typeof reserveUsername === 'function' && typeof window.reserveUsername === 'undefined') window.reserveUsername = reserveUsername;
if (typeof saveCart === 'function' && typeof window.saveCart === 'undefined') window.saveCart = saveCart;
if (typeof saveCompare === 'function' && typeof window.saveCompare === 'undefined') window.saveCompare = saveCompare;
if (typeof saveFavorites === 'function' && typeof window.saveFavorites === 'undefined') window.saveFavorites = saveFavorites;
if (typeof saveWheelSpin === 'function' && typeof window.saveWheelSpin === 'undefined') window.saveWheelSpin = saveWheelSpin;
if (typeof setActiveNav === 'function' && typeof window.setActiveNav === 'undefined') window.setActiveNav = setActiveNav;
if (typeof setTopbarMode === 'function' && typeof window.setTopbarMode === 'undefined') window.setTopbarMode = setTopbarMode;
if (typeof setUserLimit === 'function' && typeof window.setUserLimit === 'undefined') window.setUserLimit = setUserLimit;
if (typeof showAdIfDue === 'function' && typeof window.showAdIfDue === 'undefined') window.showAdIfDue = showAdIfDue;
if (typeof showFloatingButtons === 'function' && typeof window.showFloatingButtons === 'undefined') window.showFloatingButtons = showFloatingButtons;
if (typeof showInAppBanner === 'function' && typeof window.showInAppBanner === 'undefined') window.showInAppBanner = showInAppBanner;
if (typeof showToast === 'function' && typeof window.showToast === 'undefined') window.showToast = showToast;
if (typeof sortPosts === 'function' && typeof window.sortPosts === 'undefined') window.sortPosts = sortPosts;
if (typeof starsText === 'function' && typeof window.starsText === 'undefined') window.starsText = starsText;
if (typeof startBannerAuto === 'function' && typeof window.startBannerAuto === 'undefined') window.startBannerAuto = startBannerAuto;
if (typeof startFollowingListener === 'function' && typeof window.startFollowingListener === 'undefined') window.startFollowingListener = startFollowingListener;
if (typeof startPointsListener === 'function' && typeof window.startPointsListener === 'undefined') window.startPointsListener = startPointsListener;
if (typeof searchServerPosts === 'function' && typeof window.searchServerPosts === 'undefined') window.searchServerPosts = searchServerPosts;
if (typeof startPendingPostsListener === 'function' && typeof window.startPendingPostsListener === 'undefined') window.startPendingPostsListener = startPendingPostsListener;
if (typeof startPostsListener === 'function' && typeof window.startPostsListener === 'undefined') window.startPostsListener = startPostsListener;
if (typeof startProfileListener === 'function' && typeof window.startProfileListener === 'undefined') window.startProfileListener = startProfileListener;
if (typeof startReportsListener === 'function' && typeof window.startReportsListener === 'undefined') window.startReportsListener = startReportsListener;
if (typeof startStoreListener === 'function' && typeof window.startStoreListener === 'undefined') window.startStoreListener = startStoreListener;
if (typeof startStoresListener === 'function' && typeof window.startStoresListener === 'undefined') window.startStoresListener = startStoresListener;
if (typeof startWheelCooldown === 'function' && typeof window.startWheelCooldown === 'undefined') window.startWheelCooldown = startWheelCooldown;
if (typeof stopFollowingListener === 'function' && typeof window.stopFollowingListener === 'undefined') window.stopFollowingListener = stopFollowingListener;
if (typeof stopProfileListener === 'function' && typeof window.stopProfileListener === 'undefined') window.stopProfileListener = stopProfileListener;
if (typeof stopStoreListener === 'function' && typeof window.stopStoreListener === 'undefined') window.stopStoreListener = stopStoreListener;
if (typeof syncPendingPoints === 'function' && typeof window.syncPendingPoints === 'undefined') window.syncPendingPoints = syncPendingPoints;
if (typeof timeAgo === 'function' && typeof window.timeAgo === 'undefined') window.timeAgo = timeAgo;
if (typeof tryApplyPendingUpgrade === 'function' && typeof window.tryApplyPendingUpgrade === 'undefined') window.tryApplyPendingUpgrade = tryApplyPendingUpgrade;
if (typeof update === 'function' && typeof window.update === 'undefined') window.update = update;
if (typeof updateBannerDots === 'function' && typeof window.updateBannerDots === 'undefined') window.updateBannerDots = updateBannerDots;
if (typeof updateCartUI === 'function' && typeof window.updateCartUI === 'undefined') window.updateCartUI = updateCartUI;
if (typeof updateCompareUI === 'function' && typeof window.updateCompareUI === 'undefined') window.updateCompareUI = updateCompareUI;
if (typeof updateModBadge === 'function' && typeof window.updateModBadge === 'undefined') window.updateModBadge = updateModBadge;
if (typeof updatePointsBadge === 'function' && typeof window.updatePointsBadge === 'undefined') window.updatePointsBadge = updatePointsBadge;
if (typeof updateSEOMeta === 'function' && typeof window.updateSEOMeta === 'undefined') window.updateSEOMeta = updateSEOMeta;
if (typeof updateTier === 'function' && typeof window.updateTier === 'undefined') window.updateTier = updateTier;
if (typeof updateWheelBadge === 'function' && typeof window.updateWheelBadge === 'undefined') window.updateWheelBadge = updateWheelBadge;
if (typeof uploadToImgBB === 'function' && typeof window.uploadToImgBB === 'undefined') window.uploadToImgBB = uploadToImgBB;
if (typeof validatePhone === 'function' && typeof window.validatePhone === 'undefined') window.validatePhone = validatePhone;
if (typeof validateUsername === 'function' && typeof window.validateUsername === 'undefined') window.validateUsername = validateUsername;

try {
  Object.defineProperty(window, 'storeLogoImage', { get: () => storeLogoImage, set: (v) => { storeLogoImage = v; }, configurable: true });
  Object.defineProperty(window, 'storeCoverImage', { get: () => storeCoverImage, set: (v) => { storeCoverImage = v; }, configurable: true });
  Object.defineProperty(window, 'editStoreLogoImage', { get: () => editStoreLogoImage, set: (v) => { editStoreLogoImage = v; }, configurable: true });
} catch(e) {}

// ============================================
// 💳 نظام المحفظة الإلكترونية وكروت الشحن والسجل المالي للأدمن
// ============================================
let _userWalletBalance = 0;
let _walletUnsub = null;
const WALLET_THROTTLE_KEY = "tasawuq_wallet_throttle";
let _cachedWalletsMap = new Map();

// 1. استرجاع بيانات محفظة المستخدم مع كاش خفيف لمدة 5 ثوانٍ لمنع تكرار طلبات DB
export async function getUserWallet(uid, forceRefresh = false){
  if(!uid) return { balance: 0.00, updatedAt: Date.now() };
  const now = Date.now();
  if(!forceRefresh && _cachedWalletsMap.has(uid)){
    const cached = _cachedWalletsMap.get(uid);
    if(now - cached.cachedAt < 5000){
      return cached.data;
    }
  }
  try{
    const snap = await getDoc(doc(db, "feedback", "wallet_" + uid));
    if(snap && snap.exists()){
      const raw = snap.data();
      const parsed = raw.message ? JSON.parse(raw.message) : {};
      const bal = Math.max(0, Number(parsed.balance || 0));
      const result = { balance: Math.round(bal * 100) / 100, updatedAt: parsed.updatedAt || Date.now() };
      _cachedWalletsMap.set(uid, { cachedAt: now, data: result });
      return result;
    }
  }catch(e){
    console.warn("getUserWallet error:", e);
  }
  const fallback = { balance: 0.00, updatedAt: Date.now() };
  _cachedWalletsMap.set(uid, { cachedAt: now, data: fallback });
  return fallback;
}
window.getUserWallet = getUserWallet;

// 2. تسجيل حركة في السجل المالي العام (Audit Ledger) — حفظ ثنائي Supabase + Firebase + LocalStorage
export async function recordWalletTx(uid, txType, amount, balanceBefore, balanceAfter, reason, meta = {}){
  const txId = "TX" + Date.now().toString(36).toUpperCase() + Math.floor(100 + Math.random() * 900);
  const txDocId = "tx_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
  const uName = meta.userName || (myProfile && myProfile.name) || auth.currentUser?.displayName || "مستخدم";
  const uPhone = meta.userPhone || (myProfile && myProfile.phone) || "";
  const amountVal = Math.round(Number(amount) * 100) / 100;
  const beforeVal = Math.round(Number(balanceBefore) * 100) / 100;
  const afterVal = Math.round(Number(balanceAfter) * 100) / 100;
  
  const txData = {
    txId,
    uid,
    userName: uName,
    userPhone: uPhone,
    txType,
    amount: amountVal,
    balanceBefore: beforeVal,
    balanceAfter: afterVal,
    reason: String(reason || ""),
    meta: meta || {},
    timestamp: Date.now()
  };
  
  let saved = false;
  
  // المحاولة 1: Supabase
  if(window.supabase){
    try {
      const { error } = await window.supabase.from("feedback").insert({
        id: txDocId,
        type: "wallet_transaction",
        uid: uid,
        user_name: uName,
        user_phone: uPhone,
        message: JSON.stringify(txData),
        created_at: Date.now()
      });
      if(error) throw error;
      saved = true;
      console.log("✅ Wallet tx saved to Supabase:", txId);
    } catch(e){
      console.warn("⚠️ Supabase wallet tx failed, trying Firebase:", e);
    }
  }
  
  // المحاولة 2: Firebase (في حال فشل Supabase)
  if(!saved){
    try {
      await setDoc(doc(db, "feedback", txDocId), {
        id: txDocId,
        type: "wallet_transaction",
        uid: uid,
        userName: uName,
        userPhone: uPhone,
        message: JSON.stringify(txData),
        createdAt: Date.now()
      });
      saved = true;
      console.log("✅ Wallet tx saved to Firebase:", txId);
    } catch(e){
      console.error("🚨 CRITICAL: Wallet tx FAILED to save to both:", txData, e);
    }
  }
  
  if(!saved){
    // على الأقل حفظ محلي مؤقت للعرض لاحقاً
    try {
      const pending = JSON.parse(localStorage.getItem("pendingWalletTxs") || "[]");
      pending.unshift(txData);
      localStorage.setItem("pendingWalletTxs", JSON.stringify(pending.slice(0, 50)));
    } catch(e){}
  }
  
  return saved ? txId : null;
}
window.recordWalletTx = recordWalletTx;

// 3. إضافة رصيد للمحفظة (Credit)
export async function creditUserWallet(uid, amount, reason, meta = {}){
  amount = Math.max(0, Number(amount) || 0);
  if(amount <= 0) return { ok: false, error: "المبلغ غير صحيح" };
  try{
    const current = await getUserWallet(uid);
    const oldBalance = current.balance;
    const newBalance = Math.round((oldBalance + amount) * 100) / 100;
    const uName = meta.userName || (myProfile && myProfile.name) || auth.currentUser?.displayName || "مستخدم";
    const uPhone = meta.userPhone || (myProfile && myProfile.phone) || "";

    await setDoc(doc(db, "feedback", "wallet_" + uid), {
      id: "wallet_" + uid,
      type: "user_wallet",
      uid: uid,
      userName: uName,
      userPhone: uPhone,
      message: JSON.stringify({ balance: newBalance, updatedAt: Date.now() }),
      updatedAt: Date.now()
    }, { merge: true });

    _cachedWalletsMap.delete(uid);
    const txId = await recordWalletTx(uid, meta.txType || "card_recharge", amount, oldBalance, newBalance, reason, meta);
    if(!txId){
      console.warn("⚠️ تحذير: الرصيد تم تحديثه لكن السجل لم يُحفظ في الخادم مباشرة. تم تسجيله محلياً في pending.");
    }
    if(auth.currentUser && auth.currentUser.uid === uid){
      updateWalletUI(newBalance);
    }
    return { ok: true, balance: newBalance, oldBalance, txId };
  }catch(e){
    console.error("creditUserWallet error:", e);
    return { ok: false, error: e.message };
  }
}
window.creditUserWallet = creditUserWallet;

// 4. خصم رصيد من المحفظة (Debit)
export async function debitUserWallet(uid, amount, reason, meta = {}){
  amount = Math.max(0, Number(amount) || 0);
  if(amount <= 0) return { ok: false, error: "المبلغ غير صحيح" };
  try{
    const current = await getUserWallet(uid);
    const oldBalance = current.balance;
    if(oldBalance < amount){
      return { ok: false, error: "الرصيد غير كافٍ لإتمام العملية", balance: oldBalance };
    }
    const newBalance = Math.round((oldBalance - amount) * 100) / 100;
    const uName = meta.userName || (myProfile && myProfile.name) || auth.currentUser?.displayName || "مستخدم";
    const uPhone = meta.userPhone || (myProfile && myProfile.phone) || "";

    await setDoc(doc(db, "feedback", "wallet_" + uid), {
      id: "wallet_" + uid,
      type: "user_wallet",
      uid: uid,
      userName: uName,
      userPhone: uPhone,
      message: JSON.stringify({ balance: newBalance, updatedAt: Date.now() }),
      updatedAt: Date.now()
    }, { merge: true });

    _cachedWalletsMap.delete(uid);
    const txId = await recordWalletTx(uid, meta.txType || "order_payment", -amount, oldBalance, newBalance, reason, meta);
    if(!txId){
      console.warn("⚠️ تحذير: الرصيد تم تحديثه لكن السجل لم يُحفظ في الخادم مباشرة. تم تسجيله محلياً في pending.");
    }
    if(auth.currentUser && auth.currentUser.uid === uid){
      updateWalletUI(newBalance);
    }
    return { ok: true, balance: newBalance, oldBalance, txId };
  }catch(e){
    console.error("debitUserWallet error:", e);
    return { ok: false, error: e.message };
  }
}
window.debitUserWallet = debitUserWallet;

// 5. استرجاع قيمة طلبية ملغاة (Refund)
export async function refundOrderToWallet(uid, amount, orderNo, storeName){
  return creditUserWallet(
    uid,
    amount,
    `استرجاع قيمة طلبية ملغاة رقم #${orderNo} (${storeName})`,
    { txType: "order_refund", orderNo, storeName }
  );
}
window.refundOrderToWallet = refundOrderToWallet;

// 6. حماية الشحن من المحاولات العشوائية والتخمين (Brute-Force Throttle)
function checkWalletThrottle(){
  try{
    const raw = localStorage.getItem(WALLET_THROTTLE_KEY);
    if(!raw) return { allowed: true, attempts: 0, waitMinutes: 0 };
    const data = JSON.parse(raw);
    const now = Date.now();
    if(data.lockedUntil && now < data.lockedUntil){
      const waitMinutes = Math.ceil((data.lockedUntil - now) / 60000);
      return { allowed: false, attempts: data.attempts || 0, waitMinutes };
    }
    if(data.lockedUntil && now >= data.lockedUntil){
      localStorage.removeItem(WALLET_THROTTLE_KEY);
      return { allowed: true, attempts: 0, waitMinutes: 0 };
    }
    return { allowed: true, attempts: data.attempts || 0, waitMinutes: 0 };
  }catch(e){
    return { allowed: true, attempts: 0, waitMinutes: 0 };
  }
}

function registerWalletFail(){
  try{
    const current = checkWalletThrottle();
    const attempts = (current.attempts || 0) + 1;
    let lockedUntil = null;
    if(attempts >= 3){
      lockedUntil = Date.now() + 30 * 60 * 1000; // قفل 30 دقيقة
    }
    localStorage.setItem(WALLET_THROTTLE_KEY, JSON.stringify({ attempts, lockedUntil, lastAttempt: Date.now() }));
    return { attempts, lockedUntil };
  }catch(e){
    return { attempts: 1, lockedUntil: null };
  }
}

function resetWalletThrottle(){
  try{ localStorage.removeItem(WALLET_THROTTLE_KEY); }catch(e){}
}

// 7. تحديث واجهات المحفظة محلياً
function updateWalletUI(balance){
  _userWalletBalance = Math.max(0, Number(balance) || 0);
  const balText = _userWalletBalance.toFixed(2);
  const headerBadge = document.getElementById("walletHeaderBadge");
  if(headerBadge) headerBadge.textContent = balText + " د.ل";
  const cardBal = document.getElementById("userWalletBalanceText");
  if(cardBal) cardBal.textContent = balText;
  const histBal = document.getElementById("myHistoryCurrentBalance");
  if(histBal) histBal.textContent = balText;
  const cartBal = document.getElementById("cartWalletCurrentBalanceBadge");
  if(cartBal) cartBal.textContent = "رصيدك: " + balText + " د.ل";
}
window.updateWalletUI = updateWalletUI;

// 8. الاستماع المباشر الفوري للرصيد عبر Supabase
export function setupUserWalletListener(uid){
  if(_walletUnsub){
    try{ _walletUnsub(); }catch(e){}
    _walletUnsub = null;
  }
  if(!uid) return;
  try{
    _walletUnsub = onSnapshot(doc(db, "feedback", "wallet_" + uid), snap=>{
      if(snap && snap.exists()){
        const data = snap.data();
        let bal = 0;
        try{ bal = JSON.parse(data.message || "{}").balance || 0; }catch(e){}
        updateWalletUI(bal);
      }else{
        updateWalletUI(0);
      }
    });
  }catch(e){
    console.warn("setupUserWalletListener error:", e);
    getUserWallet(uid).then(w => updateWalletUI(w.balance)).catch(()=>{});
  }
}
window.setupUserWalletListener = setupUserWalletListener;

// 9. فتح نافذة المحفظة
window.openWalletModal = ()=>{
  if(!auth.currentUser){
    showToast("⚠️ يرجى تسجيل الدخول للوصول إلى المحفظة", "warn");
    openAccount();
    return;
  }
  openAccount();
  const c = document.getElementById("accountWalletCard");
  if(c) c.scrollIntoView({ behavior: 'smooth' });
};

// 10. فتح وإغلاق نافذة شحن الرصيد
window.openRechargeModal = ()=>{
  if(!auth.currentUser){
    showToast("⚠️ يرجى تسجيل الدخول أولاً لشحن المحفظة", "warn");
    openAccount();
    return;
  }
  const ov = document.getElementById("rechargeWalletOverlay");
  if(ov){
    ov.classList.remove("hidden");
    switchRechargeTab("card");
    const st = document.getElementById("rechargeStatusBox");
    if(st) st.style.display = "none";
    const inp = document.getElementById("walletCardCodeInput");
    if(inp){ inp.value = ""; setTimeout(()=>inp.focus(), 200); }
  }
};
window.closeRechargeModal = ()=>{
  const ov = document.getElementById("rechargeWalletOverlay");
  if(ov) ov.classList.add("hidden");
};

window.switchRechargeTab = (tab)=>{
  const btnCard = document.getElementById("tabBtnRechargeCard");
  const btnTr = document.getElementById("tabBtnRechargeTransfer");
  const secCard = document.getElementById("rechargeTabCardBox");
  const secTr = document.getElementById("rechargeTabTransferBox");
  if(tab === 'transfer'){
    if(btnTr) btnTr.classList.add("active");
    if(btnCard) btnCard.classList.remove("active");
    if(secTr) secTr.style.display = "block";
    if(secCard) secCard.style.display = "none";
  }else{
    if(btnCard) btnCard.classList.add("active");
    if(btnTr) btnTr.classList.remove("active");
    if(secCard) secCard.style.display = "block";
    if(secTr) secTr.style.display = "none";
  }
};

window.copyTransferNumber = (num)=>{
  try{
    navigator.clipboard.writeText(num);
    showToast(`📋 تم نسخ الرقم (${num}) بنجاح`, "success");
  }catch(e){
    prompt("انسخ رقم التحويل:", num);
  }
};

// 11. شحن الرصيد بكارت رقمي (Redeem Card)
window.submitCardRecharge = async()=>{
  if(!auth.currentUser){
    showToast("⚠️ يجب تسجيل الدخول لشحن الرصيد", "warn");
    return;
  }
  const throttle = checkWalletThrottle();
  if(!throttle.allowed){
    showToast(`⚠️ تم قفل محاولات الشحن مؤقتاً لحماية الحساب. يرجى الانتظار ${throttle.waitMinutes} دقيقة قبل المحاولة مجدداً`, "error", 6000);
    return;
  }

  const inputEl = document.getElementById("walletCardCodeInput");
  const statusBox = document.getElementById("rechargeStatusBox");
  const btn = document.getElementById("btnSubmitCardRecharge");
  const rawCode = (inputEl ? inputEl.value : "").trim();

  let cleanCode = rawCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if(cleanCode.startsWith("TK")) cleanCode = cleanCode.substring(2);
  if(cleanCode.length === 12){
    cleanCode = `TK-${cleanCode.substring(0,4)}-${cleanCode.substring(4,8)}-${cleanCode.substring(8,12)}`;
  }else{
    cleanCode = rawCode.toUpperCase();
  }

  if(!cleanCode || cleanCode.length < 8){
    if(statusBox){
      statusBox.style.display = "block";
      statusBox.style.background = "#fef2f2";
      statusBox.style.color = "#991b1b";
      statusBox.style.border = "1px solid #fecaca";
      statusBox.textContent = "⚠️ يرجى إدخال رمز كارت صحيح مكون من 12 رقم";
    }
    return;
  }

  if(btn){ btn.disabled = true; btn.textContent = "⏳ جاري التحقق وشحن الكارت..."; }
  if(statusBox) statusBox.style.display = "none";

  try{
    const cardDocId = "card_" + cleanCode;
    const snap = await getDoc(doc(db, "feedback", cardDocId));

    if(!snap || !snap.exists()){
      const failInfo = registerWalletFail();
      if(statusBox){
        statusBox.style.display = "block";
        statusBox.style.background = "#fef2f2";
        statusBox.style.color = "#991b1b";
        statusBox.style.border = "1px solid #fecaca";
        if(failInfo.attempts >= 3){
          statusBox.textContent = "❌ رمز الكارت غير صحيح! تم قفل المحاولات لمدة 30 دقيقة لحماية الحساب.";
        }else{
          statusBox.textContent = `❌ رمز الكارت غير موجود أو خاطئ! (المحاولة ${failInfo.attempts} من 3).`;
        }
      }
      return;
    }

    const cardRow = snap.data();
    let cardData = {};
    try{ cardData = JSON.parse(cardRow.message || "{}"); }catch(e){}

    if(cardData.isUsed){
      const usedDate = cardData.usedAt ? new Date(cardData.usedAt).toLocaleDateString('ar-LY') : "";
      if(statusBox){
        statusBox.style.display = "block";
        statusBox.style.background = "#fffbeb";
        statusBox.style.color = "#92400e";
        statusBox.style.border = "1px solid #fde68a";
        statusBox.textContent = `⚠️ هذا الكارت تم شحنه مسبقاً ${usedDate ? 'بتاريخ ' + usedDate : ''} ولا يمكن استخدامه مرة أخرى.`;
      }
      return;
    }

    // الكارت صالح وغير مستخدم -> حرقه فوراً وإضافة الرصيد للمحفظة
    const cardAmount = Number(cardData.amount || 0);
    if(cardAmount <= 0){
      showToast("خطأ: قيمة الكارت غير صالحة", "error");
      return;
    }

    resetWalletThrottle();

    // حرق الكارت مع آلية التراجع التلقائي لمنع ضياع الكارت
    cardData.isUsed = true;
    cardData.usedByUid = auth.currentUser.uid;
    cardData.usedByName = (myProfile && myProfile.name) || auth.currentUser.displayName || "مستخدم";
    cardData.usedByPhone = (myProfile && myProfile.phone) || "";
    cardData.usedAt = Date.now();

    await updateDoc(doc(db, "feedback", cardDocId), {
      message: JSON.stringify(cardData),
      userName: cardData.usedByName,
      userPhone: cardData.usedByPhone,
      updatedAt: Date.now()
    });

    // إضافة الرصيد لحساب الزبون
    let creditRes;
    try {
      creditRes = await creditUserWallet(
        auth.currentUser.uid,
        cardAmount,
        `شحن رصيد بواسطة كارت رقمي #${cleanCode}`,
        { txType: "card_recharge", cardCode: cleanCode }
      );
      if(!creditRes || !creditRes.ok){
        throw new Error(creditRes?.error || "فشل تسجيل الرصيد");
      }
    } catch(creditErr){
      // التراجع عن حرق الكارت عند فشل شحن الرصيد
      cardData.isUsed = false;
      delete cardData.usedByUid;
      delete cardData.usedByName;
      delete cardData.usedByPhone;
      delete cardData.usedAt;
      await updateDoc(doc(db, "feedback", cardDocId), {
        message: JSON.stringify(cardData),
        updatedAt: Date.now()
      }).catch(()=>{});
      throw creditErr;
    }

    if(inputEl) inputEl.value = "";
    if(statusBox){
      statusBox.style.display = "block";
      statusBox.style.background = "#f0fdf4";
      statusBox.style.color = "#166534";
      statusBox.style.border = "1.5px solid #22c55e";
      statusBox.innerHTML = `🎉 <b>ألف مبروك!</b> تم شحن محفظتك بنجاح بمبلغ <b>${cardAmount} د.ل</b>.<br>رصيدك الجديد: <b>${creditRes.balance.toFixed(2)} د.ل</b>`;
    }
    showToast(`🎉 تم شحن ${cardAmount} د.ل في محفظتك بنجاح!`, "success", 4000);
    playRestaurantBell('ready');
  }catch(e){
    console.error("submitCardRecharge error:", e);
    if(statusBox){
      statusBox.style.display = "block";
      statusBox.style.background = "#fef2f2";
      statusBox.style.color = "#991b1b";
      statusBox.textContent = "حدث خطأ: " + e.message;
    }
  }finally{
    if(btn){ btn.disabled = false; btn.textContent = "⚡ شحن الرصيد الآن"; }
  }
};

// 12. كشف حساب المستخدم وسجل عملياته الشخصية (استعلام مرن + فلترة محلية + LocalStorage Pending)
window.openMyWalletHistory = async () => {
  if(!auth.currentUser){
    showToast("⚠️ يرجى تسجيل الدخول أولاً", "warn");
    return;
  }
  const ov = document.getElementById("myWalletHistoryOverlay");
  const listEl = document.getElementById("myWalletTxList");
  if(ov) ov.classList.remove("hidden");
  if(listEl) listEl.innerHTML = `<div class="reportsEmpty">⏳ جاري جلب سجل المعاملات...</div>`;
  
  const myUid = auth.currentUser.uid;
  const cur = await getUserWallet(myUid);
  updateWalletUI(cur.balance);
  
  try {
    let rows = [];
    
    // المحاولة 1: جلب كل الحركات من Supabase بدون فلتر uid (ثم نفلتر محلياً)
    if(window.supabase){
      try {
        const { data, error } = await window.supabase
          .from("feedback")
          .select("*")
          .eq("type", "wallet_transaction")
          .order("created_at", { ascending: false })
          .limit(300);
        if(!error && Array.isArray(data)) rows = data;
      } catch(e){ console.warn("Supabase history fetch err:", e); }
    }
    
    // المحاولة 2: Firebase
    if(rows.length === 0){
      try {
        const snap = await getDocs(query(
          collection(db, "feedback"),
          where("type", "==", "wallet_transaction")
        ));
        rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch(e){ console.warn("Firebase history fetch err:", e); }
    }
    
    // فلترة العمليات الخاصة بالمستخدم فقط (client-side — يغطي كل الحالات)
    const txs = [];
    rows.forEach(row => {
      try {
        let parsed = {};
        try { parsed = JSON.parse(row.message || "{}"); } catch(e){}
        
        const belongsToMe = (parsed.uid === myUid) || (row.uid === myUid);
        if(!belongsToMe) return;
        
        txs.push({
          ...parsed,
          _rowId: row.id,
          _ts: parsed.timestamp || new Date(row.created_at || row.createdAt || 0).getTime()
        });
      } catch(e){}
    });
    
    // دمج أي حركات معلقة في localStorage (لم تُحفظ في DB)
    try {
      const pending = JSON.parse(localStorage.getItem("pendingWalletTxs") || "[]");
      pending.forEach(p => {
        if(p.uid === myUid && !txs.some(t => t.txId === p.txId)){
          txs.push({ ...p, _ts: p.timestamp, _isPendingLocal: true });
        }
      });
    } catch(e){}
    
    // ترتيب حسب الأحدث
    txs.sort((a, b) => (b._ts || 0) - (a._ts || 0));
    
    // حالة فارغة
    if(txs.length === 0){
      if(listEl) listEl.innerHTML = `
        <div class="cartEmptyBox" style="padding:30px 20px">
          <div class="icon">💳</div>
          <div style="font-weight:800;font-size:15px;margin-bottom:6px">لا توجد حركات مالية بعد</div>
          <div style="font-size:12.5px;line-height:1.6;color:var(--muted)">اشحن محفظتك بكارت الشحن أو اطلب من المطاعم<br>وستظهر جميع عملياتك هنا بشكل مفصل وواضح</div>
        </div>
      `;
      return;
    }
    
    // عرض الحركات
    const typeLabels = {
      'card_recharge': { icon: '💳', label: 'شحن كارت', color: '#16a34a' },
      'order_payment': { icon: '🍽️', label: 'دفع طلب', color: '#dc2626' },
      'order_refund': { icon: '🔄', label: 'استرجاع طلب', color: '#0284c7' },
      'admin_credit': { icon: '➕', label: 'إيداع إداري', color: '#16a34a' },
      'admin_debit': { icon: '➖', label: 'خصم إداري', color: '#dc2626' },
      'order_create_failed_refund': { icon: '🔄', label: 'استرجاع (فشل طلب)', color: '#0284c7' }
    };
    
    if(listEl) listEl.innerHTML = txs.map(tx => {
      const amount = Number(tx.amount) || 0;
      const isIncome = amount >= 0;
      const sign = isIncome ? '+' : '';
      const cls = isIncome ? 'in' : 'out';
      const typeInfo = typeLabels[tx.txType] || { icon: '💱', label: 'حركة مالية', color: '#6b7280' };
      
      const txDate = tx._ts ? new Date(tx._ts).toLocaleString('ar-LY', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : '—';
      
      const pendingBadge = tx._isPendingLocal
        ? '<span style="font-size:9.5px;background:#fef3c7;color:#92400e;padding:1px 6px;border-radius:5px;font-weight:800;margin-right:4px">⏳ لم تُزامن بعد</span>'
        : '';
      
      const reasonText = tx.reason || typeInfo.label;
      
      return `
        <div class="walletTxCard" style="border-right:3px solid ${typeInfo.color}">
          <div class="txLeft">
            <div class="txIcon ${cls}" style="background:${isIncome ? '#f0fdf4' : '#fef2f2'};border-color:${isIncome ? '#bbf7d0' : '#fecaca'}">${typeInfo.icon}</div>
            <div class="txDetails">
              <div class="txTitle">${escapeHtml(reasonText)} ${pendingBadge}</div>
              <div class="txTime" style="font-size:10.5px">
                <span style="color:${typeInfo.color};font-weight:800">${typeInfo.label}</span>
                <span style="color:var(--muted)"> • 🕒 ${txDate}</span>
              </div>
            </div>
          </div>
          <div class="txRight">
            <div class="txAmount ${cls}" style="font-size:15px">${sign}${Math.abs(amount).toFixed(2)} د.ل</div>
            <div class="txBalanceAfter">${tx.balanceAfter != null ? `الرصيد: ${Number(tx.balanceAfter).toFixed(2)} د.ل` : ''}</div>
          </div>
        </div>
      `;
    }).join("");
    
  } catch(e){
    console.error("openMyWalletHistory error:", e);
    if(listEl) listEl.innerHTML = `<div class="reportsEmpty">❌ خطأ في جلب البيانات: ${escapeHtml(e.message)}</div>`;
  }
};
window.closeMyWalletHistory = ()=>{
  const ov = document.getElementById("myWalletHistoryOverlay");
  if(ov) ov.classList.add("hidden");
};

// 13. لوحة الإدارة المالية للأدمن
let _admWalActiveTab = "cards";
let _admAllCards = [];
let _admAllLedger = [];

window.openAdminWallet = ()=>{
  if(!isAdmin){
    showToast("❌ غير مصرح لك", "error");
    return;
  }
  const ov = document.getElementById("adminWalletOverlay");
  if(ov){
    ov.classList.remove("hidden");
    switchAdmWalTab("cards");
  }
};
window.closeAdminWallet = ()=>{
  const ov = document.getElementById("adminWalletOverlay");
  if(ov) ov.classList.add("hidden");
  const as = document.getElementById("accountScreen");
  if(as && auth.currentUser) as.classList.remove("hidden");
};

window.switchAdmWalTab = (tab)=>{
  _admWalActiveTab = tab;
  ['Cards', 'Ledger', 'Deposit', 'Stores'].forEach(t=>{
    const btn = document.getElementById("btnAdmWalTab" + t);
    const sec = document.getElementById("admWalSec" + t);
    const active = (t.toLowerCase() === tab.toLowerCase());
    if(btn) btn.classList.toggle("active", active);
    if(sec) sec.style.display = active ? "block" : "none";
  });
  if(tab === 'cards') loadAdminCardsList();
  else if(tab === 'ledger') loadAdminLedger();
  else if(tab === 'stores') loadAdminStoresPayouts();
};

// إظهار أو إخفاء الفئة المخصصة لكروت الشحن للأدمن
window.toggleAdmCustomDenom = ()=>{
  const sel = document.getElementById("admCardDenom");
  const cust = document.getElementById("admCardCustomDenom");
  if(sel && cust){
    cust.style.display = (sel.value === 'custom') ? 'block' : 'none';
    if(sel.value === 'custom') cust.focus();
  }
};

// توليد كروت الشحن للأدمن (عدد مفتوح وفئات مرنة)
window.adminGenerateCardsBatch = async()=>{
  if(!isAdmin) return;
  const selDenom = document.getElementById("admCardDenom")?.value || "20";
  let denom = 20;
  if(selDenom === 'custom'){
    denom = parseInt(document.getElementById("admCardCustomDenom")?.value || "0", 10);
    if(isNaN(denom) || denom < 1 || denom > 5000){
      showToast("⚠️ يرجى إدخال قيمة فئة مخصصة صحيحة (من 1 إلى 5000 د.ل)", "warn");
      return;
    }
  }else{
    denom = parseInt(selDenom, 10);
  }

  const countInput = document.getElementById("admCardCount");
  const count = parseInt(countInput?.value || "10", 10);
  if(isNaN(count) || count < 1 || count > 500){
    showToast("⚠️ يرجى إدخال عدد كروت صحيح بين 1 و 500 كارت في الدفعة الواحدة", "warn");
    return;
  }

  const btn = document.getElementById("btnAdmGenCards");
  const outBox = document.getElementById("admGeneratedCardsOutput");
  const outText = document.getElementById("admGeneratedCardsText");

  const okConfirm = await showConfirmModal(`هل تريد توليد وحفظ ${count} كارت من فئة ${denom} د.ل في المنظومة؟`, { confirmText: "نعم، توليد الكروت" });
  if(!okConfirm) return;

  if(btn){ btn.disabled = true; btn.textContent = "⏳ جاري توليد وحفظ الكروت..."; }

  try{
    const generated = [];
    const batchId = "batch_" + Date.now();
    for(let i=0; i<count; i++){
      const part1 = Math.floor(1000 + Math.random() * 9000);
      const part2 = Math.floor(1000 + Math.random() * 9000);
      const part3 = Math.floor(1000 + Math.random() * 9000);
      const code = `TK-${part1}-${part2}-${part3}`;
      const cardDocId = "card_" + code;
      const cardPayload = {
        code,
        amount: denom,
        batchId,
        isUsed: false,
        usedByUid: null,
        usedByName: null,
        usedByPhone: null,
        usedAt: null,
        createdAt: Date.now()
      };
      await setDoc(doc(db, "feedback", cardDocId), {
        id: cardDocId,
        type: "wallet_card",
        uid: "system",
        message: JSON.stringify(cardPayload),
        createdAt: Date.now()
      });
      generated.push(code);
    }

    if(outBox) outBox.style.display = "block";
    if(outText){
      outText.value = `🌟 كروت شحن تسوق الآن (فئة ${denom} د.ل - إجمالي ${count} كارت):\n` + generated.map((c, idx) => `${idx+1}. ${c} (${denom} د.ل)`).join("\n");
    }
    showToast(`✅ تم بنجاح توليد وحفظ ${count} كارت في قاعدة البيانات!`, "success", 4000);
    loadAdminCardsList();
  }catch(e){
    showToast("خطأ: " + e.message, "error");
  }finally{
    if(btn){ btn.disabled = false; btn.textContent = "⚡ توليد وحفظ الكروت في قاعدة البيانات"; }
  }
};

window.copyAllGeneratedCards = ()=>{
  const t = document.getElementById("admGeneratedCardsText");
  if(!t || !t.value) return;
  try{
    navigator.clipboard.writeText(t.value);
    showToast("📋 تم نسخ قائمة الكروت بنجاح!", "success");
  }catch(e){
    t.select();
    document.execCommand('copy');
    showToast("📋 تم النسخ!", "success");
  }
};

let _admCardsFilter = "all";
window.filterAdminCardsList = (filter)=>{
  _admCardsFilter = filter;
  ['all', 'unused', 'used'].forEach(f=>{
    const b = document.getElementById("btnFilterCard" + f.charAt(0).toUpperCase() + f.slice(1));
    if(b) b.classList.toggle("active", f === filter);
  });
  renderAdminCardsTable();
};

async function loadAdminCardsList(){
  const box = document.getElementById("admCardsListTable");
  if(!box) return;
  box.innerHTML = `<div class="reportsEmpty">⏳ جاري تحميل الكروت...</div>`;
  try{
    if(window.supabase){
      const { data, error } = await window.supabase
        .from("feedback")
        .select("*")
        .eq("type", "wallet_card")
        .order("created_at", { ascending: false })
        .limit(100);
      if(!error && data){
        _admAllCards = data.map(r=>{
          let parsed = {};
          try{ parsed = JSON.parse(r.message || "{}"); }catch(e){}
          return { ...parsed, _rowId: r.id, _created: r.created_at };
        });
      }
    }
    renderAdminCardsTable();
  }catch(e){
    box.innerHTML = `<div class="reportsEmpty">خطأ: ${e.message}</div>`;
  }
}

function renderAdminCardsTable(){
  const box = document.getElementById("admCardsListTable");
  if(!box) return;
  let filtered = _admAllCards;
  if(_admCardsFilter === 'unused') filtered = _admAllCards.filter(c => !c.isUsed);
  else if(_admCardsFilter === 'used') filtered = _admAllCards.filter(c => c.isUsed);

  if(filtered.length === 0){
    box.innerHTML = `<div class="reportsEmpty">لا توجد كروت مطابقة لهذا الفلتر</div>`;
    return;
  }

  box.innerHTML = filtered.map(c=>{
    const isUsed = c.isUsed;
    const badge = isUsed
      ? `<span style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;padding:2px 8px;border-radius:6px;font-weight:800;font-size:11px">🔴 استُخدم بواسطة: ${escapeHtml(c.usedByName||"زبون")} (${escapeHtml(c.usedByPhone||"")})</span>`
      : `<span style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;padding:2px 8px;border-radius:6px;font-weight:800;font-size:11px">🟢 صالحة للاستخدام</span>`;
    return `
      <div class="admCardRow">
        <div>
          <div class="admCardCode">${escapeHtml(c.code)} — <b>${c.amount} د.ل</b></div>
          <div style="font-size:11px;color:var(--muted);margin-top:3px">${badge}</div>
        </div>
        <button type="button" class="btnGhost" onclick="copyTransferNumber('${escapeHtml(c.code)}')" style="padding:4px 8px;font-size:11px;border:1px solid var(--border)">📋 نسخ</button>
      </div>
    `;
  }).join("");
}

// السجل المالي العام (Audit Ledger) للأدمن
window.onAdmLedgerSearchChange = ()=>{
  renderAdminLedgerTable();
};

async function loadAdminLedger(){
  const box = document.getElementById("admLedgerListTable");
  if(!box) return;
  box.innerHTML = `<div class="reportsEmpty">⏳ جاري تحميل السجل المالي...</div>`;
  try{
    if(window.supabase){
      const { data, error } = await window.supabase
        .from("feedback")
        .select("*")
        .eq("type", "wallet_transaction")
        .order("created_at", { ascending: false })
        .limit(250);
      if(!error && data){
        _admAllLedger = data.map(r=>{
          let parsed = {};
          try{ parsed = JSON.parse(r.message || "{}"); }catch(e){}
          return {
            ...parsed,
            _rowId: r.id,
            _created: r.created_at,
            _uName: r.user_name || parsed.userName,
            _uPhone: r.user_phone || parsed.userPhone,
            _storeId: parsed.meta?.storeId || parsed.storeId || null,
            _storeName: parsed.meta?.storeName || parsed.storeName || null
          };
        });
      }
    }
    updateAdminLedgerStats();
    populateLedgerStoreFilter();
    renderAdminLedgerTable();
  }catch(e){
    box.innerHTML = `<div class="reportsEmpty">خطأ في جلب السجل: ${e.message}</div>`;
  }
}

function updateAdminLedgerStats(){
  let totalRecharges = 0;
  let totalOrders = 0;
  let totalRefunds = 0;

  _admAllLedger.forEach(tx=>{
    const amt = Number(tx.amount || 0);
    if(tx.txType === 'card_recharge' || tx.txType === 'admin_credit') totalRecharges += Math.abs(amt);
    else if(tx.txType === 'order_payment') totalOrders += Math.abs(amt);
    else if(tx.txType === 'order_refund') totalRefunds += Math.abs(amt);
  });

  const elR = document.getElementById("admStatRecharges");
  if(elR) elR.textContent = totalRecharges.toFixed(2) + " د.ل";
  const elO = document.getElementById("admStatOrders");
  if(elO) elO.textContent = totalOrders.toFixed(2) + " د.ل";
  const elF = document.getElementById("admStatRefunds");
  if(elF) elF.textContent = totalRefunds.toFixed(2) + " د.ل";
}

function populateLedgerStoreFilter(storesList = null){
  const sel = document.getElementById("admLedgerStoreFilter");
  if(!sel) return;
  const currentVal = sel.value || "all";
  const stores = {};

  if(storesList && storesList.length){
    storesList.forEach(s => {
      if(s.storeId) stores[s.storeId] = s.storeName || "مطعم";
    });
  }

  if(Array.isArray(_admAllLedger)){
    _admAllLedger.forEach(tx => {
      const sId = tx._storeId || tx.meta?.storeId;
      const sName = tx._storeName || tx.meta?.storeName;
      if(sId && sName && !stores[sId]){
        stores[sId] = sName;
      }
    });
  }

  let html = `<option value="all">🍽️ كل المطاعم</option>`;
  Object.keys(stores).forEach(sId => {
    html += `<option value="${escapeHtml(sId)}">🍽️ ${escapeHtml(stores[sId])}</option>`;
  });
  sel.innerHTML = html;
  if(stores[currentVal] || currentVal === 'all') sel.value = currentVal;
}

function renderAdminLedgerTable(){
  const box = document.getElementById("admLedgerListTable");
  if(!box) return;
  const q = (document.getElementById("admLedgerSearchInput")?.value || "").trim().toLowerCase();
  const typeFilter = document.getElementById("admLedgerTypeFilter")?.value || "all";
  const storeFilter = document.getElementById("admLedgerStoreFilter")?.value || "all";

  let filtered = _admAllLedger;
  if(typeFilter !== 'all'){
    filtered = filtered.filter(tx => tx.txType === typeFilter);
  }
  if(storeFilter !== 'all'){
    filtered = filtered.filter(tx => {
      const txStore = tx._storeId || tx.meta?.storeId;
      return txStore === storeFilter;
    });
  }
  if(q){
    filtered = filtered.filter(tx => {
      const u = (tx._uName || "").toLowerCase();
      const p = (tx._uPhone || "").toLowerCase();
      const r = (tx.reason || "").toLowerCase();
      const id = (tx.txId || "").toLowerCase();
      const sn = (tx._storeName || tx.meta?.storeName || "").toLowerCase();
      return u.includes(q) || p.includes(q) || r.includes(q) || id.includes(q) || sn.includes(q);
    });
  }

  if(filtered.length === 0){
    box.innerHTML = `<div class="reportsEmpty">لا توجد حركات مالية مطابقة للبحث والفلترة</div>`;
    return;
  }

  box.innerHTML = filtered.map(tx=>{
    const amt = Number(tx.amount || 0);
    const isIncome = amt >= 0;
    const sign = isIncome ? '+' : '';
    const color = isIncome ? '#16a34a' : '#dc2626';
    const txDate = tx._created ? new Date(tx._created).toLocaleString('ar-LY', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    const storeBadge = (tx._storeName || tx.meta?.storeName)
      ? `<span style="background:#fef3c7;color:#92400e;border:1px solid #fde68a;padding:1px 6px;border-radius:4px;font-size:10.5px;font-weight:800;margin-left:4px">🍽️ ${escapeHtml(tx._storeName || tx.meta?.storeName)}</span>`
      : '';

    return `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:10px 12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <div style="font-weight:800;font-size:13px;color:var(--text)">
            ${storeBadge}
            ${escapeHtml(tx.reason || "معاملة مالية")}
          </div>
          <div style="font-weight:900;font-size:14px;color:${color};direction:ltr">${sign}${amt} د.ل</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:11.5px;color:var(--muted)">
          <div>👤 ${escapeHtml(tx._uName || "مستخدم")} ${tx._uPhone ? `— <a href="tel:${formatCallPhone(tx._uPhone)}" style="color:#0284c7;text-decoration:none;font-weight:700">📞 ${escapeHtml(tx._uPhone)}</a>` : ''}</div>
          <div>🕒 ${txDate}</div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:4px;padding-top:4px;border-top:1px dashed var(--border);font-size:11px;color:var(--muted)">
          <span>كود الحركة: <b style="direction:ltr;display:inline-block">${escapeHtml(tx.txId || "")}</b></span>
          <span>الرصيد: ${tx.balanceBefore != null ? tx.balanceBefore + ' ➔ ' : ''}<b>${tx.balanceAfter != null ? tx.balanceAfter + ' د.ل' : ''}</b></span>
        </div>
      </div>
    `;
  }).join("");
}

// فحص وإيداع يدوي لأي مستخدم
let _admDepTargetUser = null;

window.onAdmDepPhoneInputChanged = ()=>{
  const rawQuery = (document.getElementById("admDepPhone")?.value || "").trim();
  if(!rawQuery){
    _admDepTargetUser = null;
    const box = document.getElementById("admDepUserInfoBox");
    if(box){
      box.style.display = "none";
      box.innerHTML = "";
    }
  }
};

window.admLookupUserByPhone = async()=>{
  _admDepTargetUser = null;
  const rawQuery = (document.getElementById("admDepPhone")?.value || "").trim();
  const box = document.getElementById("admDepUserInfoBox");
  const btn = document.getElementById("btnAdmLookupPhone");
  if(!box) return;

  if(!rawQuery || rawQuery.length < 2){
    box.style.display = "block";
    box.style.background = "#fef2f2";
    box.style.color = "#991b1b";
    box.style.border = "1.5px solid #fecaca";
    box.style.borderRadius = "10px";
    box.style.padding = "10px 14px";
    box.style.fontSize = "13px";
    box.style.fontWeight = "700";
    box.textContent = "⚠️ يرجى كتابة رقم هاتف أو اسم مستخدم صحيح للبحث";
    return;
  }

  if(btn){
    btn.disabled = true;
    btn.textContent = "⏳...";
  }

  box.style.display = "block";
  box.style.background = "#f8fafc";
  box.style.color = "var(--text)";
  box.style.border = "1.5px solid var(--border)";
  box.style.borderRadius = "10px";
  box.style.padding = "12px 14px";
  box.style.fontSize = "13px";
  box.textContent = "⏳ جاري البحث عن صاحب الحساب في قاعدة البيانات...";

  try{
    let target = null;
    const cleanDigits = rawQuery.replace(/[^0-9]/g, "");
    const cleanUsername = rawQuery.replace(/^@/, "").toLowerCase();

    // 1. البحث برقم الهاتف
    if(cleanDigits.length >= 8 && window.supabase){
      const last8 = cleanDigits.slice(-8);
      const { data: pData } = await window.supabase
        .from("profiles")
        .select("*")
        .ilike("phone", `%${last8}%`)
        .limit(1)
        .maybeSingle();
      if(pData) target = pData;

      if(!target){
        const { data: phData } = await window.supabase
          .from("phones")
          .select("*")
          .ilike("phone", `%${last8}%`)
          .limit(1)
          .maybeSingle();
        if(phData && phData.uid){
          const { data: profData } = await window.supabase
            .from("profiles")
            .select("*")
            .eq("id", phData.uid)
            .limit(1)
            .maybeSingle();
          if(profData) target = profData;
        }
      }
    }

    // 2. البحث برقم العضوية (1 إلى 6 أرقام)
    if(!target && cleanDigits.length >= 1 && cleanDigits.length <= 6 && !isNaN(parseInt(rawQuery, 10)) && window.supabase){
      const memNo = parseInt(rawQuery, 10);
      const { data: mData } = await window.supabase
        .from("profiles")
        .select("*")
        .eq("member_no", memNo)
        .limit(1)
        .maybeSingle();
      if(mData) target = mData;
    }

    // 3. البحث باسم المستخدم
    if(!target && cleanUsername.length >= 2 && window.supabase){
      const { data: uData } = await window.supabase
        .from("profiles")
        .select("*")
        .ilike("username", cleanUsername)
        .limit(1)
        .maybeSingle();
      if(uData) target = uData;

      if(!target){
        const { data: unData } = await window.supabase
          .from("usernames")
          .select("*")
          .ilike("username", cleanUsername)
          .limit(1)
          .maybeSingle();
        if(unData && unData.uid){
          const { data: profData } = await window.supabase
            .from("profiles")
            .select("*")
            .eq("id", unData.uid)
            .limit(1)
            .maybeSingle();
          if(profData) target = profData;
        }
      }
    }

    // 4. البحث بـ UID أو الاسم
    if(!target && rawQuery.length >= 4 && window.supabase){
      const { data: anyData } = await window.supabase
        .from("profiles")
        .select("*")
        .or(`id.eq.${rawQuery},name.ilike.%${rawQuery}%`)
        .limit(1)
        .maybeSingle();
      if(anyData) target = anyData;
    }

    if(!target){
      box.style.background = "#fffbeb";
      box.style.color = "#92400e";
      box.style.border = "1.5px solid #fde68a";
      box.innerHTML = `⚠️ لم يتم العثور على أي حساب مسجل بـ "<b>${escapeHtml(rawQuery)}</b>". تأكد من رقم الهاتف أو اسم المستخدم.`;
      _admDepTargetUser = null;
      return;
    }

    _admDepTargetUser = target;
    const wal = await getUserWallet(target.id);

    box.style.background = "#f0fdf4";
    box.style.color = "#166534";
    box.style.border = "1.5px solid #86efac";
    box.style.padding = "12px";
    box.innerHTML = `
      <div style="font-weight:900;font-size:13px;color:#15803d;margin-bottom:8px;display:flex;align-items:center;gap:6px">
        ✅ تم العثور على حساب العضو بنجاح:
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div style="background:#fff;border:1px solid #bbf7d0;border-radius:10px;padding:8px 12px">
          <div style="font-size:11px;color:var(--muted);font-weight:700">👤 الاسم الكامل:</div>
          <div style="font-size:13.5px;font-weight:900;color:var(--text);margin-top:2px">${escapeHtml(target.name || "مستخدم")}</div>
        </div>
        <div style="background:#fff;border:1px solid #bbf7d0;border-radius:10px;padding:8px 12px">
          <div style="font-size:11px;color:var(--muted);font-weight:700">🏷️ اسم المستخدم:</div>
          <div style="font-size:13.5px;font-weight:900;color:var(--text);margin-top:2px">@${escapeHtml(target.username || "—")}</div>
        </div>
        <div style="background:#fff;border:1px solid #bbf7d0;border-radius:10px;padding:8px 12px">
          <div style="font-size:11px;color:var(--muted);font-weight:700">📞 رقم الهاتف:</div>
          <div style="font-size:13.5px;font-weight:900;color:#0284c7;margin-top:2px;direction:ltr;text-align:right">${escapeHtml(target.phone || "—")}</div>
        </div>
        <div style="background:linear-gradient(135deg,#dcfce7,#bbf7d0);border:1.5px solid #22c55e;border-radius:10px;padding:8px 12px">
          <div style="font-size:11px;color:#15803d;font-weight:800">💳 الرصيد الحالي:</div>
          <div style="font-size:15px;font-weight:900;color:#166534;margin-top:2px">${wal.balance.toFixed(2)} د.ل</div>
        </div>
      </div>
    `;
  }catch(e){
    box.style.background = "#fef2f2";
    box.style.color = "#991b1b";
    box.style.border = "1.5px solid #fecaca";
    box.textContent = "خطأ في البحث: " + e.message;
    _admDepTargetUser = null;
  }finally{
    if(btn){
      btn.disabled = false;
      btn.textContent = "🔍 فحص";
    }
  }
};

window.adminExecuteDeposit = async()=>{
  const canAdmin = isAdmin || (auth.currentUser && auth.currentUser.email === ADMIN_EMAIL);
  if(!canAdmin){
    showToast("❌ ليس لديك صلاحية أدمن", "error");
    return;
  }
  const amt = parseFloat(document.getElementById("admDepAmount")?.value || "0");
  const type = document.getElementById("admDepType")?.value || "credit";
  const note = (document.getElementById("admDepNote")?.value || "").trim();
  const btn = document.getElementById("btnAdmExecuteDeposit");

  if(isNaN(amt) || amt <= 0){
    showToast("⚠️ يرجى إدخال مبلغ صحيح أكبر من 0", "warn");
    return;
  }
  if(!_admDepTargetUser){
    showToast("⚠️ يرجى الضغط على 'فحص' للتأكد من حساب الزبون أولاً", "warn");
    return;
  }

  const targetUid = _admDepTargetUser.id || _admDepTargetUser.uid;
  if(!targetUid){
    showToast("⚠️ تعذر تحديد معرف المستخدم، أعد فحصه بالرقم أو اليوزر", "warn");
    return;
  }

  const opLabel = type === 'credit' ? `إيداع مبلغ +${amt} د.ل` : `خصم مبلغ -${amt} د.ل`;
  const okConfirm = await showConfirmModal(`هل أنت متأكد من ${opLabel} لحساب الزبون (${_admDepTargetUser.name || _admDepTargetUser.phone})؟`, {
    isDanger: type === 'debit',
    confirmText: type === 'credit' ? "نعم، إيداع" : "نعم، خصم"
  });
  if(!okConfirm) return;

  if(btn){ btn.disabled = true; btn.textContent = "⏳ جاري تنفيذ العملية وتحديث الرصيد..."; }

  try{
    const finalNote = note || (type === 'credit' ? "إيداع يدوي من الإدارة" : "خصم يدوي من الإدارة");
    let res = null;

    if(type === 'credit'){
      res = await creditUserWallet(targetUid, amt, finalNote, {
        txType: "admin_credit",
        userName: _admDepTargetUser.name,
        userPhone: _admDepTargetUser.phone,
        adminNote: finalNote
      });
    }else{
      res = await debitUserWallet(targetUid, amt, finalNote, {
        txType: "admin_debit",
        userName: _admDepTargetUser.name,
        userPhone: _admDepTargetUser.phone,
        adminNote: finalNote
      });
    }

    if(!res.ok){
      showToast("❌ فشلت العملية: " + (res.error || "خطأ غير متوقع"), "error");
      return;
    }

    showToast(`✅ تمت العملية بنجاح! الرصيد الجديد: ${res.balance.toFixed(2)} د.ل`, "success", 4000);
    document.getElementById("admDepAmount").value = "";
    document.getElementById("admDepNote").value = "";
    admLookupUserByPhone();
  }catch(e){
    showToast("خطأ: " + e.message, "error");
  }finally{
    if(btn){ btn.disabled = false; btn.textContent = "💾 تنفيذ العملية وتحديث الرصيد فوراً"; }
  }
};

// مستحقات المطاعم (Restaurant Payouts & Ledger Breakdown)
window.filterLedgerByStore = (storeId, storeName)=>{
  switchAdmWalTab('ledger');
  const sel = document.getElementById("admLedgerStoreFilter");
  if(sel){
    let opt = Array.from(sel.options).find(o => o.value === storeId);
    if(!opt){
      opt = document.createElement("option");
      opt.value = storeId;
      opt.textContent = `🍽️ ${storeName}`;
      sel.appendChild(opt);
    }
    sel.value = storeId;
  }
  renderAdminLedgerTable();
};

async function loadAdminStoresPayouts(){
  const box = document.getElementById("admStoresPayoutsList");
  if(!box) return;
  box.innerHTML = `<div class="reportsEmpty">⏳ جاري حساب مبيعات ومستحقات المطاعم (أسبوعياً وشهرياً)...</div>`;

  try{
    let orders = [];
    if(window.supabase){
      const { data, error } = await window.supabase
        .from("feedback")
        .select("*")
        .eq("type", "restaurant_order")
        .order("created_at", { ascending: false })
        .limit(500);
      if(!error && data) orders = data;
    }

    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
    const storesMap = {};

    orders.forEach(r=>{
      let ord = {};
      try{ ord = JSON.parse(r.message || "{}"); }catch(e){}
      if(ord.paymentMethod === 'wallet' && ord.isPaid && ord.status !== 'rejected'){
        const sId = ord.storeId || "unknown";
        if(!storesMap[sId]){
          storesMap[sId] = {
            storeId: sId,
            storeName: ord.storeName || "مطعم",
            storePhone: ord.storePhone || "",
            countAll: 0,
            revenueAll: 0,
            countWeek: 0,
            revenueWeek: 0,
            countMonth: 0,
            revenueMonth: 0
          };
        }
        const amt = Number(ord.totalPrice || 0);
        const orderTime = Number(ord.createdAt || (r.created_at ? new Date(r.created_at).getTime() : now));

        storesMap[sId].countAll += 1;
        storesMap[sId].revenueAll += amt;

        if(orderTime >= oneWeekAgo){
          storesMap[sId].countWeek += 1;
          storesMap[sId].revenueWeek += amt;
        }
        if(orderTime >= oneMonthAgo){
          storesMap[sId].countMonth += 1;
          storesMap[sId].revenueMonth += amt;
        }
      }
    });

    const list = Object.values(storesMap);
    populateLedgerStoreFilter(list);

    if(list.length === 0){
      box.innerHTML = `<div class="reportsEmpty">لا توجد طلبيات مطاعم مدفوعة بالمحفظة حتى الآن</div>`;
      return;
    }

    box.innerHTML = list.map(st=>`
      <div style="background:var(--card);border:1.5px solid var(--border);border-radius:12px;padding:12px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
          <div>
            <div style="font-weight:900;font-size:15px;color:var(--text)">🍽️ ${escapeHtml(st.storeName)}</div>
            <div style="font-size:11.5px;color:var(--muted);margin-top:2px">
              ${st.storePhone ? `📞 <a href="tel:${formatCallPhone(st.storePhone)}" style="color:#0284c7;text-decoration:none;font-weight:700">${escapeHtml(st.storePhone)}</a> — ` : ''}
              إجمالي الطلبات المدفوعة بالمحفظة: <b>${st.countAll}</b> طلب
            </div>
          </div>
          <button type="button" class="btnGhost" onclick="filterLedgerByStore('${escapeHtml(st.storeId)}', '${escapeHtml(st.storeName)}')" style="padding:6px 12px;font-size:11.5px;font-weight:800;border:1.5px solid var(--teal);color:var(--teal-dark);background:var(--teal-light);border-radius:8px;cursor:pointer">
            📜 كشف الحساب
          </button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:8px;text-align:center">
            <div style="font-size:10.5px;color:#166534;font-weight:700">مبيعات هذا الأسبوع</div>
            <div style="font-size:14px;font-weight:900;color:#15803d;margin-top:2px">${st.revenueWeek.toFixed(2)} د.ل</div>
            <div style="font-size:10px;color:#15803d">(${st.countWeek} طلب)</div>
          </div>

          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:8px;text-align:center">
            <div style="font-size:10.5px;color:#1e40af;font-weight:700">مبيعات هذا الشهر</div>
            <div style="font-size:14px;font-weight:900;color:#1d4ed8;margin-top:2px">${st.revenueMonth.toFixed(2)} د.ل</div>
            <div style="font-size:10px;color:#1d4ed8">(${st.countMonth} طلب)</div>
          </div>

          <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:8px;text-align:center">
            <div style="font-size:10.5px;color:#6b21a8;font-weight:700">الإجمالي الكلي</div>
            <div style="font-size:14px;font-weight:900;color:#7e22ce;margin-top:2px">${st.revenueAll.toFixed(2)} د.ل</div>
            <div style="font-size:10px;color:#7e22ce">(${st.countAll} طلب)</div>
          </div>
        </div>
      </div>
    `).join("");
  }catch(e){
    box.innerHTML = `<div class="reportsEmpty">خطأ: ${e.message}</div>`;
  }
}

// 14. دوال التحكم بالدفع من السلة
window.toggleRestPaymentMethod = ()=>{
  const pMethod = document.querySelector('input[name="restPaymentMethod"]:checked')?.value || "cash";
  const lblCash = document.getElementById("lblPayCash");
  const lblWallet = document.getElementById("lblPayWallet");
  if(lblCash){
    lblCash.style.borderColor = (pMethod === 'cash') ? 'var(--teal)' : 'var(--border)';
    lblCash.style.borderWidth = (pMethod === 'cash') ? '2px' : '1px';
  }
  if(lblWallet){
    lblWallet.style.borderColor = (pMethod === 'wallet') ? 'var(--teal)' : 'var(--border)';
    lblWallet.style.borderWidth = (pMethod === 'wallet') ? '2px' : '1px';
  }
  updateCartWalletBalance();
};

export async function updateCartWalletBalance(){
  const noticeBox = document.getElementById("cartWalletNotice");
  const pMethod = document.querySelector('input[name="restPaymentMethod"]:checked')?.value || "cash";
  const total = cartTotalPrice();

  if(!auth.currentUser){
    const cartBal = document.getElementById("cartWalletCurrentBalanceBadge");
    if(cartBal) cartBal.textContent = "سجّل دخولك للدفع بالمحفظة";
    if(pMethod === 'wallet' && noticeBox){
      noticeBox.style.display = "block";
      noticeBox.style.background = "#fffbeb";
      noticeBox.style.color = "#92400e";
      noticeBox.style.border = "1px solid #fde68a";
      noticeBox.innerHTML = `⚠️ يرجى تسجيل الدخول أولاً لتتمكن من الدفع الفوري من محفظتك الإلكترونية.`;
    }else if(noticeBox){
      noticeBox.style.display = "none";
    }
    return;
  }

  const wal = await getUserWallet(auth.currentUser.uid);
  updateWalletUI(wal.balance);

  if(!noticeBox) return;

  if(pMethod === 'wallet'){
    noticeBox.style.display = "block";
    if(wal.balance < total){
      noticeBox.style.background = "#fef2f2";
      noticeBox.style.color = "#991b1b";
      noticeBox.style.border = "1px solid #fecaca";
      noticeBox.innerHTML = `
        <div style="font-weight:800;margin-bottom:4px">⚠️ رصيدك (${wal.balance.toFixed(2)} د.ل) لا يكفي لدفع قيمة الطلب (${total} د.ل).</div>
        <button type="button" class="btnMain" onclick="openRechargeModal()" style="padding:6px 12px;font-size:12px;background:#0284c7;color:#fff;margin-top:4px;margin-bottom:0">⚡ اشحن محفظتك الآن بكارت أو تحويل</button>
      `;
    }else{
      noticeBox.style.background = "#f0fdf4";
      noticeBox.style.color = "#166534";
      noticeBox.style.border = "1px solid #bbf7d0";
      noticeBox.innerHTML = `🟢 <b>رصيدك كافٍ!</b> سيتم خصم <b>${total} د.ل</b> من محفظتك فوراً، وستصل طلبيتك للكاشير كطلبية مدفوعة مسبقاً وخالصة.`;
    }
  }else{
    noticeBox.style.display = "none";
  }
}
window.updateCartWalletBalance = updateCartWalletBalance;

/* ============================================
   💬 15. نظام الدردشة المباشرة وصندوق المحادثات بين الشاري والبائع
   ============================================ */
window._activeChat = null;

export async function openChatWithSeller(sellerUid, postId, storeId, targetCustomName){
  if(!auth.currentUser){
    showToast("يرجى تسجيل الدخول أولاً للدردشة مع البائع 💬", "warn");
    if(typeof openAuthModal === "function") openAuthModal();
    return;
  }
  const myUid = auth.currentUser.uid;
  if(myUid === sellerUid){
    showToast("هذا إعلانك أو متجرك، لا يمكنك مراسلة نفسك!", "info");
    return;
  }

  // تحديد اسم البائع
  let targetName = targetCustomName || "";
  if(!targetName && postId){
    const p = allPosts.find(x => x.id === postId);
    if(p) targetName = p.storeName || p.sellerName || "";
  }
  if(!targetName && storeId){
    const s = allStores.find(x => x.id === storeId);
    if(s) targetName = s.name || "";
  }
  if(!targetName){
    const sOwner = allStores.find(x => x.ownerUid === sellerUid);
    if(sOwner) targetName = sOwner.name || "";
    else {
      const pOwner = allPosts.find(x => x.uid === sellerUid);
      if(pOwner) targetName = pOwner.storeName || pOwner.sellerName || "";
    }
  }
  if(!targetName) targetName = "البائع";

  const convId = [myUid, sellerUid].sort().join("_");

  window._activeChat = {
    convId,
    targetUid: sellerUid,
    targetName,
    postId: postId || null,
    storeId: storeId || null,
    pollTimer: null,
    lastMsgCount: 0
  };

  const elName = document.getElementById("chatTargetName");
  const elAvatar = document.getElementById("chatTargetAvatar");
  if(elName) elName.textContent = targetName;
  if(elAvatar) elAvatar.textContent = targetName ? targetName.trim()[0].toUpperCase() : "👤";

  // إعداد كرت السياق (Context Banner)
  const ctxBar = document.getElementById("chatPostContextBar");
  const ctxImg = document.getElementById("chatContextImg");
  const ctxTitle = document.getElementById("chatContextTitle");
  const ctxPrice = document.getElementById("chatContextPrice");
  const ctxBtn = document.getElementById("chatContextViewBtn");

  if(ctxBar){
    if(postId){
      const p = allPosts.find(x => x.id === postId);
      if(p){
        ctxBar.style.display = "flex";
        const imgs = getImages(p);
        if(ctxImg) ctxImg.src = imgs[0] || "icon-192.png";
        if(ctxTitle) ctxTitle.textContent = p.title || "إعلان";
        if(ctxPrice) ctxPrice.textContent = p.priceType === "contact" ? "تواصل للسعر" : (p.price != null ? formatPrice(p.price) + " د.ل" : "");
        if(ctxBtn) ctxBtn.onclick = () => { closeUserChat(); openPost(p.id); };
      }else{
        ctxBar.style.display = "none";
      }
    }else if(storeId){
      const s = allStores.find(x => x.id === storeId);
      if(s){
        ctxBar.style.display = "flex";
        if(ctxImg) ctxImg.src = s.logo || "icon-192.png";
        if(ctxTitle) ctxTitle.textContent = s.name || "متجر";
        if(ctxPrice) ctxPrice.textContent = s.category || "";
        if(ctxBtn) ctxBtn.onclick = () => { closeUserChat(); openStore(s.id); };
      }else{
        ctxBar.style.display = "none";
      }
    }else{
      ctxBar.style.display = "none";
    }
  }

  // عرض شاشة الدردشة وتحديث مسار الرجوع
  const chatOverlay = document.getElementById("userChatOverlay");
  if(chatOverlay) chatOverlay.classList.remove("hidden");
  const oldInboxOverlay = document.getElementById("userInboxOverlay");
  if(oldInboxOverlay) oldInboxOverlay.classList.add("hidden");
  pushNavState({ screen: 'chat' });

  // تصفير المحادثة السابقة والوسائط لضمان عدم تداخل الرسائل القديمة
  _activeChatMessages = [];
  window._chatAudioMap = {};

  // وضع علامة مقروءة على هذه المحادثة وتحديث الشارة فوراً
  try {
    localStorage.setItem("tasawuq_chat_last_seen", String(Date.now()));
    localStorage.setItem("tasawuq_chat_seen_" + convId, String(Date.now()));
  } catch(e){}
  if(typeof updateGlobalUnreadChatCount === 'function') updateGlobalUnreadChatCount();

  // تفعيل إذن الإشعارات بنعومة للمستخدم
  if("Notification" in window && Notification.permission === "default"){
    Notification.requestPermission().catch(()=>{});
  }

  // تركيز حقل الكتابة
  setTimeout(() => {
    const input = document.getElementById("chatMessageInput");
    if(input){
      input.focus();
      handleChatInputChange(input);
    }
  }, 100);

  // ضبط شاشة الدردشة لتتبع لوحة مفاتيح الآيفون فوراً وتثبيت شريط الكتابة
  if(window.visualViewport){
    const handleViewportResize = () => {
      const chat = document.getElementById("userChatOverlay");
      if(chat && !chat.classList.contains("hidden")){
        chat.style.height = window.visualViewport.height + "px";
        const box = document.getElementById("chatMessagesBox");
        if(box) box.scrollTop = box.scrollHeight;
      }
    };
    try {
      window.visualViewport.removeEventListener('resize', handleViewportResize);
      window.visualViewport.addEventListener('resize', handleViewportResize);
    } catch(e){}
  }

  // تحميل الرسائل المتبادلة وبدء التحديث التلقائي والاشتراك اللحظي المباشر
  await loadChatMessages(convId, false);

  // ⚡ اشتراك لحظي فوري عبر قنوات Supabase Realtime لاستقبال الرد في أجزاء من الثانية
  if(window._chatRealtimeChannel && window.supabase){
    try { window.supabase.removeChannel(window._chatRealtimeChannel); } catch(e){}
    window._chatRealtimeChannel = null;
  }
  if(window.supabase && typeof window.supabase.channel === 'function'){
    try {
      window._chatRealtimeChannel = window.supabase
        .channel('chat_room_' + convId)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'feedback'
        }, (payload) => {
          if(payload && payload.new && payload.new.type === 'chat_message' && payload.new.message && payload.new.message.includes(convId)){
            loadChatMessages(convId, true);
          }
        })
        .subscribe();
    } catch(e){}
  }

  // ⚡ تحديث فائق السرعة كل ثانية كضمان محكم للمحادثة المباشرة على شبكات الهاتف
  if(window._activeChat.pollTimer) clearInterval(window._activeChat.pollTimer);
  window._activeChat.pollTimer = setInterval(() => {
    const chat = document.getElementById("userChatOverlay");
    if(!window._activeChat || !chat || chat.classList.contains("hidden")){
      if(window._activeChat?.pollTimer) clearInterval(window._activeChat.pollTimer);
      return;
    }
    loadChatMessages(window._activeChat.convId, true);
  }, 1000);
}
window.openChatWithSeller = openChatWithSeller;

// 🔊 نغمة إرسال سريعة وفورية عند ضغط إرسال (مثل واتساب وتلغرام)
export function playChatSendSound(){
  try {
    const ctx = (typeof getSharedAudioCtx === 'function') ? getSharedAudioCtx() : null;
    if(!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.08);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  } catch(e){}
}
window.playChatSendSound = playChatSendSound;

// 🔊 نغمة تنبيه ناعمة عند وصول رسالة جديدة عبر Web Audio API
export function playChatChime(){
  try {
    const ctx = (typeof getSharedAudioCtx === 'function') ? getSharedAudioCtx() : null;
    if(!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  } catch(e){}
}
window.playChatChime = playChatChime;

// 🔔 إشعار هاتف رسمي يظهر في شريط إشعارات الهاتف حتى خارج الموقع
export async function sendSystemChatNotification(senderName, text, convId, targetUid){
  try {
    if(!("Notification" in window)) return;
    if(Notification.permission !== "granted"){
      if(Notification.permission !== "denied"){
        await Notification.requestPermission();
      }
    }
    if(Notification.permission === "granted"){
      const title = "💬 " + (senderName || "رسالة جديدة في تسوق الآن");
      const options = {
        body: text || "لديك رسالة جديدة",
        icon: "icon-192.png",
        badge: "icon-192.png",
        tag: "chat_" + (convId || "general"),
        renotify: true,
        data: { convId, targetUid }
      };

      if(navigator.serviceWorker && navigator.serviceWorker.ready){
        const reg = await navigator.serviceWorker.ready;
        if(reg && reg.showNotification){
          reg.showNotification(title, options);
          return;
        }
      }
      const notif = new Notification(title, options);
      notif.onclick = () => {
        try { window.focus(); } catch(e){}
        if(targetUid && typeof openChatWithSeller === "function"){
          openChatWithSeller(targetUid, null, null, senderName);
        }
      };
    }
  } catch(e){}
}
window.sendSystemChatNotification = sendSystemChatNotification;

export function closeUserChatDirect(){
  const chatOverlay = document.getElementById("userChatOverlay");
  if(chatOverlay) chatOverlay.classList.add("hidden");
  if(typeof cancelChatVoiceRecord === "function") cancelChatVoiceRecord();
  if(window._currentPlayingAudio && !window._currentPlayingAudio.paused){
    window._currentPlayingAudio.pause();
    window._currentPlayingAudio = null;
  }
  if(window._activeChat && window._activeChat.pollTimer){
    clearInterval(window._activeChat.pollTimer);
  }
  if(window._chatRealtimeChannel && window.supabase){
    try { window.supabase.removeChannel(window._chatRealtimeChannel); } catch(e){}
    window._chatRealtimeChannel = null;
  }
  window._activeChat = null;
  _activeChatMessages = [];
  window._chatAudioMap = {};
  const is = document.getElementById("inboxScreen");
  if(is && !is.classList.contains("hidden")){
    if(typeof openInbox === "function") openInbox(true);
  }
}
window.closeUserChatDirect = closeUserChatDirect;

export function closeUserChat(){
  if(!_isHistoryNavigating && window.history.state && window.history.state.screen === 'chat'){
    window.history.back();
    return;
  }
  closeUserChatDirect();
}
window.closeUserChat = closeUserChat;

export function handleChatInputChange(input){
  const text = (input ? input.value : "").trim();
  const sendBtn = document.getElementById("btnSendUserChat");
  const micBtn = document.getElementById("btnVoiceRecordChat");
  if(sendBtn){
    sendBtn.style.opacity = text.length > 0 ? "1" : "0.75";
  }
}
window.handleChatInputChange = handleChatInputChange;

let _activeChatMessages = [];

// 🔄 تحديث فوري لحالة تسليم الرسالة في الواجهة دون إعادة رسم كامل المحادثة
export function updateChatMessageStatus(msgId, newStatus){
  if(!msgId) return;
  if(_activeChatMessages){
    const found = _activeChatMessages.find(m => m.id === msgId);
    if(found) found.status = newStatus;
  }
  const el = document.getElementById("csi_" + msgId);
  if(el){
    if(newStatus === "sending"){
      el.innerHTML = `<span class="chatStatusSending">جاري الإرسال <span class="chatSpinDot">⏳</span></span>`;
    } else if(newStatus === "sent"){
      el.innerHTML = `<span class="chatStatusSent">تم الإرسال <span class="chatTicks">✓✓</span></span>`;
    } else if(newStatus === "failed"){
      el.innerHTML = `<span class="chatStatusFailed" onclick="retrySendChatMessage('${escapeHtml(msgId)}')">فشل الإرسال ⚠️ إعادة</span>`;
    }
  }
}
window.updateChatMessageStatus = updateChatMessageStatus;

// 🔁 إعادة إرسال الرسالة المتعثرة
export async function retrySendChatMessage(msgId){
  if(!_activeChatMessages) return;
  const m = _activeChatMessages.find(x => x.id === msgId);
  if(!m) return;
  m.status = "sending";
  updateChatMessageStatus(msgId, "sending");

  const serverPayload = { ...m, status: "sent" };

  try {
    const nowTs = Date.now();
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("انتهت مهلة الاتصال بالشبكة")), 15000));

    const sendOp = async () => {
      if(window.supabase){
        const { error } = await window.supabase.from("feedback").upsert({
          id: m.id,
          type: "chat_message",
          message: JSON.stringify(serverPayload),
          uid: m.senderUid,
          user_name: m.senderName,
          created_at: nowTs
        });
        if(error) throw error;
      } else {
        await setDoc(doc(db, "feedback", m.id), {
          id: m.id,
          type: "chat_message",
          message: JSON.stringify(serverPayload),
          uid: m.senderUid,
          user_name: m.senderName,
          created_at: nowTs
        }, { merge: true });
      }
    };

    await Promise.race([sendOp(), timeoutPromise]);

    m.status = "sent";
    updateChatMessageStatus(msgId, "sent");
    showToast("✅ تم إرسال الرسالة بنجاح", "success", 2000);
  } catch(e){
    m.status = "failed";
    updateChatMessageStatus(msgId, "failed");
    showToast("❌ تعذر الإرسال: " + (e.message || e), "error");
  }
}
window.retrySendChatMessage = retrySendChatMessage;

export async function sendUserChatMessage(){
  if(!window._activeChat){
    showToast("يرجى فتح المحادثة أولاً 💬", "warn");
    return;
  }
  if(!auth.currentUser){
    showToast("يرجى تسجيل الدخول أولاً لإرسال الرسالة", "warn");
    if(typeof openAuthModal === "function") openAuthModal();
    return;
  }
  const input = document.getElementById("chatMessageInput");
  if(!input) return;
  const text = (input.value || "").trim().slice(0, 500);
  if(!text) return;

  const me = auth.currentUser;
  const senderName = (myProfile && myProfile.name) || me.displayName || "مستخدم";
  const activeChat = window._activeChat;

  // تنظيف الحقل فوراً واستعادة التركيز
  input.value = "";
  handleChatInputChange(input);
  setTimeout(() => { if(input) input.focus(); }, 30);

  // تشغيل نغمة الإرسال الفورية
  playChatSendSound();

  const nowTs = Date.now();
  const msgId = "msg_" + nowTs + "_" + Math.floor(Math.random() * 10000);
  const msgPayload = {
    id: msgId,
    convId: activeChat.convId,
    senderUid: me.uid,
    senderName: senderName,
    receiverUid: activeChat.targetUid,
    text: text,
    postId: activeChat.postId,
    storeId: activeChat.storeId,
    status: "sending", // حالة الإرسال المبدئية: جاري الإرسال ⏳
    createdAt: nowTs
  };

  // إضافة الرسالة فورياً للذاكرة المحلية لمنع أي اختفاء وظهورها اللحظي المباشر
  if(!_activeChatMessages) _activeChatMessages = [];
  _activeChatMessages.push(msgPayload);
  if(window._activeChat){
    window._activeChat.lastMsgCount = _activeChatMessages.length;
    window._activeChat.lastMsgId = msgId;
  }
  renderChatMessagesList(_activeChatMessages);
  scrollChatToBottom(true);

  // ⚡ إرسال فوري متوازي (Parallel Send) إلى Supabase بدون أي تأخير زمني
  const convDocId = "conv_" + activeChat.convId;
  const postTitle = document.getElementById("chatContextTitle")?.textContent || "";
  const postPrice = document.getElementById("chatContextPrice")?.textContent || "";
  const postImage = document.getElementById("chatContextImg")?.src || "";

  const convSummary = {
    convId: activeChat.convId,
    participants: [me.uid, activeChat.targetUid],
    lastMessage: text,
    lastSenderUid: me.uid,
    lastSenderName: senderName,
    updatedAt: nowTs,
    postContext: activeChat.postId ? {
      id: activeChat.postId,
      title: postTitle,
      price: postPrice,
      image: postImage
    } : null,
    storeContext: activeChat.storeId ? {
      id: activeChat.storeId,
      name: postTitle
    } : null
  };

  try {
    const payloadForServer = { ...msgPayload, status: "sent" };
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("انتهت مهلة الاتصال بالشبكة")), 15000));

    let sendPromise;
    if(window.supabase){
      const pMsg = window.supabase.from("feedback").insert({
        id: msgId,
        type: "chat_message",
        message: JSON.stringify(payloadForServer),
        uid: me.uid,
        user_name: senderName,
        user_phone: me.phoneNumber || "",
        created_at: nowTs
      });

      const pConv = window.supabase.from("feedback").upsert({
        id: convDocId,
        type: "chat_conversation",
        message: JSON.stringify(convSummary),
        uid: me.uid,
        user_name: senderName,
        created_at: nowTs
      });

      sendPromise = Promise.all([pMsg, pConv]).then(([resMsg]) => {
        if(resMsg && resMsg.error) throw resMsg.error;
      });
    } else {
      sendPromise = Promise.all([
        addDoc(collection(db, "feedback"), {
          id: msgId,
          type: "chat_message",
          message: JSON.stringify(payloadForServer),
          uid: me.uid,
          user_name: senderName,
          user_phone: me.phoneNumber || "",
          created_at: nowTs
        }),
        setDoc(doc(db, "feedback", convDocId), {
          type: "chat_conversation",
          message: JSON.stringify(convSummary),
          uid: me.uid,
          user_name: senderName,
          created_at: nowTs
        }, { merge: true })
      ]);
    }

    await Promise.race([sendPromise, timeoutPromise]);

    // ✅ تأكيد التسليم الناجح فوراً وتحويل الحالة إلى "تم الإرسال"
    msgPayload.status = "sent";
    updateChatMessageStatus(msgId, "sent");
    if(window._activeChat){
      window._activeChat.lastFetchedTs = Math.max(window._activeChat.lastFetchedTs || 0, nowTs);
    }

  } catch(err) {
    console.error("Error sending chat message:", err);
    msgPayload.status = "failed";
    updateChatMessageStatus(msgId, "failed");
    showToast("تعذر إرسال الرسالة: " + (err.message || err), "error");
  }
}
window.sendUserChatMessage = sendUserChatMessage;

// 📜 نزول ذكي ومرن لأسفل الشات عبر دورات العرض لضمان رؤية الرسائل على كل الهواتف
export function scrollChatToBottom(smooth = false){
  const box = document.getElementById("chatMessagesBox");
  if(!box) return;
  const doScroll = () => {
    try {
      box.scrollTo({
        top: box.scrollHeight + 1000,
        behavior: smooth ? "smooth" : "auto"
      });
    } catch(e){
      box.scrollTop = box.scrollHeight + 1000;
    }
  };
  doScroll();
  if(window.requestAnimationFrame) requestAnimationFrame(doScroll);
  setTimeout(doScroll, 40);
  setTimeout(doScroll, 160);
}
window.scrollChatToBottom = scrollChatToBottom;

export function renderChatMessagesList(messages){
  const box = document.getElementById("chatMessagesBox");
  if(!box) return;

  const myUid = auth.currentUser ? auth.currentUser.uid : null;

  if(!messages || messages.length === 0){
    box.innerHTML = `
      <div style="text-align:center;padding:40px 20px;color:var(--muted)">
        <div style="font-size:36px;margin-bottom:8px">💬</div>
        <div style="font-weight:800;font-size:14px;color:var(--text);margin-bottom:4px">لا توجد رسائل سابقة</div>
        <div style="font-size:12px">ابدأ المحادثة الآن واكتب رسالتك بالأسفل!</div>
      </div>
    `;
    return;
  }

  if(!window._chatAudioMap) window._chatAudioMap = {};

  let lastDateStr = "";
  box.innerHTML = messages.map(m => {
    const isMe = m.senderUid === myUid;
    const d = new Date(m.createdAt || Date.now());
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    let dateDivider = "";
    const curDateStr = d.toLocaleDateString();
    if(curDateStr !== lastDateStr){
      lastDateStr = curDateStr;
      const todayStr = new Date().toLocaleDateString();
      const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString();
      const label = curDateStr === todayStr ? "اليوم" : curDateStr === yesterdayStr ? "أمس" : curDateStr;
      dateDivider = `<div class="chatDateDivider">${label}</div>`;
    }

    if(m.id && m.audioData){
      window._chatAudioMap[m.id] = m.audioData;
    }

    const deliveryStatusHtml = isMe ? `
      <span class="chatStatusIndicator" id="csi_${escapeHtml(m.id || '')}">
        ${m.status === 'sending' ? `
          <span class="chatStatusSending">جاري الإرسال <span class="chatSpinDot">⏳</span></span>
        ` : m.status === 'failed' ? `
          <span class="chatStatusFailed" onclick="retrySendChatMessage('${escapeHtml(m.id || '')}')">فشل الإرسال ⚠️ إعادة</span>
        ` : `
          <span class="chatStatusSent">تم الإرسال <span class="chatTicks">✓✓</span></span>
        `}
      </span>
    ` : '';

    return `
      ${dateDivider}
      <div class="chatBubble ${isMe ? 'outgoing' : 'incoming'}">
        ${(m.type === 'voice' || m.audioData) ? `
          <div class="chatBubbleContent">
            <div class="voicePlayerBubble" id="vpb_${m.id || ''}">
              <button type="button" class="voicePlayBtn" onclick="toggleVoicePlayback(this, '${escapeHtml(m.id || '')}')">▶</button>
              <div class="voiceWaveWrap">
                <div class="voiceWaveBar"></div><div class="voiceWaveBar"></div><div class="voiceWaveBar"></div>
                <div class="voiceWaveBar"></div><div class="voiceWaveBar"></div><div class="voiceWaveBar"></div>
              </div>
              <span class="voiceDuration">${m.duration ? m.duration + 's' : 'تسجيل صوتي'} 🎙️</span>
            </div>
          </div>
        ` : `
          <div class="chatBubbleContent">${escapeHtml(m.text || '')}</div>
        `}
        <div class="chatBubbleMeta">
          <span class="chatTime">${timeStr}</span>
          ${deliveryStatusHtml}
        </div>
      </div>
    `;
  }).join("");

  scrollChatToBottom(false);
}
window.renderChatMessagesList = renderChatMessagesList;

export async function loadChatMessages(convId, isPoll){
  const box = document.getElementById("chatMessagesBox");
  if(!box) return;
  const myUid = auth.currentUser ? auth.currentUser.uid : null;
  const targetUid = window._activeChat ? window._activeChat.targetUid : null;

  if(!isPoll && (!box.children.length || box.querySelector(".reportsEmpty"))){
    box.innerHTML = `<div class="reportsEmpty">⏳ جاري تحميل الرسائل...</div>`;
  }

  try {
    let rows = [];

    // ⚡ الفحص التزايدي الفائق الخفة (Incremental Delta Sync) أثناء المحادثة النشطة:
    // جلب الرسائل الجديدة فقط بعد آخر طابع زمني لتفادي استهلاك الإنترنت والبطارية نهائياً
    if(isPoll && window._activeChat && window._activeChat.convId === convId && window._activeChat.lastFetchedTs){
      const sinceTs = window._activeChat.lastFetchedTs - 1500;
      if(window.supabase){
        try {
          const { data, error } = await window.supabase
            .from("feedback")
            .select("*")
            .eq("type", "chat_message")
            .ilike("message", `%${convId}%`)
            .gt("created_at", sinceTs)
            .order("created_at", { ascending: true })
            .limit(30);
          if(!error && Array.isArray(data)){
            rows = data;
          }
        } catch(e){}
      }

      // إذا لم تصل أي رسالة جديدة من السيرفر، نتوقف فوراً دون أي إعادة رسم
      if(rows.length === 0){
        return;
      }

      let hasNewIncoming = false;
      let stateChanged = false;

      rows.forEach(d => {
        try {
          const parsed = JSON.parse(d.message || "{}");
          const matchConv = parsed.convId === convId;
          const matchUsers = targetUid && myUid && (
            (parsed.senderUid === myUid && parsed.receiverUid === targetUid) ||
            (parsed.senderUid === targetUid && parsed.receiverUid === myUid)
          );
          if(!matchConv && !matchUsers) return;

          const msgTs = Number(parsed.createdAt || d.created_at || Date.now());
          if(msgTs > window._activeChat.lastFetchedTs){
            window._activeChat.lastFetchedTs = msgTs;
          }

          const existingIdx = _activeChatMessages.findIndex(m => m.id === d.id || (m.createdAt === msgTs && m.text === parsed.text));
          if(existingIdx >= 0){
            // رسالتنا مسجلة محلياً، نؤكد تحويل حالتها فوراً إلى "تم الإرسال"
            if(_activeChatMessages[existingIdx].status !== "sent"){
              _activeChatMessages[existingIdx].status = "sent";
              updateChatMessageStatus(_activeChatMessages[existingIdx].id || d.id, "sent");
            }
          } else {
            // رسالة جديدة وصلت من الطرف الآخر أو جهاز آخر!
            const newMsg = {
              id: d.id,
              ...parsed,
              status: "sent",
              createdAt: msgTs
            };
            _activeChatMessages.push(newMsg);
            stateChanged = true;
            if(parsed.senderUid !== myUid){
              hasNewIncoming = true;
            }
          }
        } catch(e){}
      });

      if(stateChanged){
        _activeChatMessages.sort((a,b) => (a.createdAt || 0) - (b.createdAt || 0));
        renderChatMessagesList(_activeChatMessages);
        if(hasNewIncoming){
          playChatChime();
          if(document.hidden || document.getElementById("userChatOverlay")?.classList.contains("hidden")){
            const last = _activeChatMessages[_activeChatMessages.length - 1];
            sendSystemChatNotification(last?.senderName || window._activeChat?.targetName || "مستخدم", last?.text || "رسالة جديدة", convId, last?.senderUid);
          }
          scrollChatToBottom(true);
        } else {
          scrollChatToBottom(false);
        }
      }
      return;
    }

    // --- التحميل الأولي الكامل (Full Initial Load) عند فتح المحادثة لأول مرة ---
    if(window.supabase){
      try {
        const { data, error } = await window.supabase
          .from("feedback")
          .select("*")
          .eq("type", "chat_message")
          .ilike("message", `%${convId}%`)
          .order("created_at", { ascending: true })
          .limit(100);
        if(!error && Array.isArray(data) && data.length > 0){
          rows = data;
        }
      } catch(e){}
    }

    if(rows.length === 0 && window.supabase && targetUid){
      try {
        const { data } = await window.supabase
          .from("feedback")
          .select("*")
          .eq("type", "chat_message")
          .ilike("message", `%${targetUid}%`)
          .order("created_at", { ascending: true })
          .limit(100);
        if(Array.isArray(data) && data.length > 0){
          rows = data;
        }
      } catch(e){}
    }

    if(rows.length === 0 && window.supabase){
      try {
        let query = window.supabase
          .from("feedback")
          .select("*")
          .eq("type", "chat_message")
          .order("created_at", { ascending: false })
          .limit(60);
        if(myUid && targetUid){
          query = query.in("uid", [myUid, targetUid]);
        }
        const { data, error } = await query;
        if(!error && Array.isArray(data)){
          rows = data.reverse();
        }
      } catch(e){}
    }

    if(rows.length === 0 && !window.supabase){
      const qSnap = await getDocs(query(
        collection(db, "feedback"),
        where("type", "==", "chat_message"),
        limit(80)
      ));
      rows = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    const serverMessages = [];
    let maxTs = 0;

    rows.forEach(d => {
      try {
        const parsed = JSON.parse(d.message || "{}");
        const matchConv = parsed.convId === convId;
        const matchUsers = targetUid && myUid && (
          (parsed.senderUid === myUid && parsed.receiverUid === targetUid) ||
          (parsed.senderUid === targetUid && parsed.receiverUid === myUid)
        );
        if(matchConv || matchUsers){
          const msgTs = Number(parsed.createdAt || d.created_at || Date.now());
          if(msgTs > maxTs) maxTs = msgTs;
          serverMessages.push({
            id: d.id,
            ...parsed,
            status: "sent",
            createdAt: msgTs
          });
        }
      } catch(e){}
    });

    // دمج الرسائل السيرفر مع الرسائل المحلية لمنع اختفاء أي رسالة
    const msgMap = new Map();
    serverMessages.forEach(m => msgMap.set(m.id || (m.createdAt + "_" + m.text), m));
    if(_activeChatMessages){
      _activeChatMessages.forEach(m => {
        if(m.convId === convId){
          const k = m.id || (m.createdAt + "_" + m.text);
          if(!msgMap.has(k)) msgMap.set(k, m);
        }
      });
    }

    const merged = Array.from(msgMap.values());
    merged.sort((a,b) => (a.createdAt || 0) - (b.createdAt || 0));
    _activeChatMessages = merged;

    if(window._activeChat){
      window._activeChat.lastMsgCount = merged.length;
      window._activeChat.lastMsgId = merged.length > 0 ? (merged[merged.length - 1].id || "") : "";
      window._activeChat.lastFetchedTs = maxTs || Date.now();
    }

    renderChatMessagesList(_activeChatMessages);
    scrollChatToBottom(false);

  } catch(err) {
    console.error("Error loading chat messages:", err);
    if(!isPoll && box && (!box.children.length || box.querySelector(".reportsEmpty"))) {
      box.innerHTML = `<div class="reportsEmpty">⚠️ تعذر تحميل الرسائل</div>`;
    }
  }
}
window.loadChatMessages = loadChatMessages;

window._inboxConversationsCache = [];
window._inboxCurrentTab = "all";

export async function openInbox(isSilentRefresh = false){
  if(!auth.currentUser){
    showToast("يرجى تسجيل الدخول أولاً لعرض صندوق الرسائل 💬", "warn");
    if(typeof openAuthModal === "function") openAuthModal();
    return;
  }

  const myUid = auth.currentUser.uid;
  const screen = document.getElementById("inboxScreen");
  const fullList = document.getElementById("inboxFullList") || document.getElementById("userInboxList");
  if(!screen || !fullList) return;

  if(!isSilentRefresh){
    if(typeof closeOverlayDirect === "function") closeOverlayDirect();
    if(typeof hideFloatingButtons === "function") hideFloatingButtons();

    const homeEl = document.getElementById("home");
    const catScEl = document.getElementById("categoriesScreen");
    const formEl = document.getElementById("form");
    const storesScEl = document.getElementById("storesScreen");
    const storeScEl = document.getElementById("storeScreen");
    const accountScEl = document.getElementById("accountScreen");

    if(homeEl) homeEl.classList.add("hidden");
    if(catScEl) catScEl.classList.add("hidden");
    if(formEl) formEl.classList.add("hidden");
    if(storesScEl) storesScEl.classList.add("hidden");
    if(storeScEl) storeScEl.classList.add("hidden");
    if(accountScEl) accountScEl.classList.add("hidden");

    screen.classList.remove("hidden");
    window.scrollTo(0, 0);
    pushNavState({ screen: 'inbox' });

    try {
      localStorage.setItem("tasawuq_chat_last_seen", String(Date.now()));
    } catch(e){}
    if(typeof updateGlobalUnreadChatCount === 'function') updateGlobalUnreadChatCount();

    if(!window._inboxConversationsCache || window._inboxConversationsCache.length === 0){
      fullList.innerHTML = `<div class="reportsEmpty" style="padding:40px 20px">⏳ جاري تحميل المحادثات...</div>`;
    }
  }

  try {
    let rows = [];
    if(window.supabase){
      try {
        const { data, error } = await window.supabase
          .from("feedback")
          .select("*")
          .eq("type", "chat_conversation")
          .ilike("message", `%${myUid}%`)
          .order("created_at", { ascending: false })
          .limit(80);
        if(!error && Array.isArray(data)) rows = data;
      } catch(e){
        console.warn("Supabase fetch inbox err:", e);
      }
    }

    if(rows.length === 0 && window.supabase){
      try {
        const { data } = await window.supabase
          .from("feedback")
          .select("*")
          .eq("type", "chat_conversation")
          .order("created_at", { ascending: false })
          .limit(60);
        if(Array.isArray(data)) rows = data.filter(d => d.message && d.message.includes(myUid));
      } catch(e){}
    }

    if(rows.length === 0){
      try {
        const qSnap = await getDocs(query(
          collection(db, "feedback"),
          where("type", "==", "chat_conversation"),
          limit(60)
        ));
        rows = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch(e){
        console.warn("Firebase fetch inbox err:", e);
      }
    }

    const convMap = new Map();

    rows.forEach(d => {
      try {
        const c = JSON.parse(d.message || "{}");
        const hasMyUid = (c.convId && c.convId.includes(myUid)) ||
                         (Array.isArray(c.participants) && c.participants.includes(myUid)) ||
                         (d.uid === myUid);
        if(hasMyUid && (c.convId || d.id)){
          const k = c.convId || d.id;
          const upTime = c.updatedAt || d.created_at || 0;
          const existing = convMap.get(k);
          if(!existing || upTime > (existing.updatedAt || 0)){
            convMap.set(k, {
              id: d.id,
              ...c,
              convId: k,
              updatedAt: upTime
            });
          }
        }
      } catch(e){}
    });

    // جلب إضافي من الرسائل الفعلية لضمان ظهور أي محادثة وصلت رسائلها حتى لو تعطل حفظ الملخص
    if(window.supabase){
      try {
        const { data: msgRows } = await window.supabase
          .from("feedback")
          .select("*")
          .eq("type", "chat_message")
          .ilike("message", `%${myUid}%`)
          .order("created_at", { ascending: false })
          .limit(80);
        if(Array.isArray(msgRows)){
          msgRows.forEach(mr => {
            try {
              const m = JSON.parse(mr.message || "{}");
              const k = m.convId || [m.senderUid, m.receiverUid].filter(Boolean).sort().join("_");
              if(!k) return;
              const mTs = Number(m.createdAt || mr.created_at || 0);
              const otherUid = m.senderUid === myUid ? m.receiverUid : m.senderUid;
              const existing = convMap.get(k) || convMap.get("conv_" + k);
              if(!existing){
                convMap.set(k, {
                  id: "conv_" + k,
                  convId: k,
                  participants: [m.senderUid, m.receiverUid],
                  lastMessage: m.text || (m.type === "voice" ? "🎙️ تسجيل صوتي" : "رسالة جديدة"),
                  lastSenderUid: m.senderUid,
                  lastSenderName: m.senderName || "مستخدم",
                  postContext: m.postId ? { id: m.postId } : null,
                  storeContext: m.storeId ? { id: m.storeId } : null,
                  updatedAt: mTs
                });
              } else if(mTs > (existing.updatedAt || 0)){
                existing.lastMessage = m.text || (m.type === "voice" ? "🎙️ تسجيل صوتي" : existing.lastMessage);
                existing.lastSenderUid = m.senderUid;
                existing.lastSenderName = m.senderName || existing.lastSenderName;
                existing.updatedAt = mTs;
              }
            } catch(e){}
          });
        }
      } catch(e){}
    }

    const convs = Array.from(convMap.values());
    convs.sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    window._inboxConversationsCache = convs;

    // تحديث شارة العدد الكلي
    const badge = document.getElementById("inboxTotalCountBadge");
    if(badge){
      if(convs.length > 0){
        badge.style.display = "inline-block";
        badge.textContent = convs.length;
      } else {
        badge.style.display = "none";
      }
    }

    renderInboxFilteredList();

  } catch(err) {
    console.error("Error loading inbox:", err);
    if(!isSilentRefresh){
      fullList.innerHTML = `<div class="reportsEmpty" style="padding:40px 20px">⚠️ تعذر تحميل المحادثات، يرجى المحاولة لاحقاً</div>`;
    }
  }
}
window.openInbox = openInbox;

export function renderInboxFilteredList(){
  const fullList = document.getElementById("inboxFullList") || document.getElementById("userInboxList");
  if(!fullList) return;

  const myUid = auth.currentUser ? auth.currentUser.uid : null;
  const convs = window._inboxConversationsCache || [];
  const currentTab = window._inboxCurrentTab || "all";
  const searchInput = document.getElementById("inboxSearchInput");
  const queryText = (searchInput ? searchInput.value : "").trim().toLowerCase();
  const lastSeen = parseInt(localStorage.getItem("tasawuq_chat_last_seen") || "0", 10);

  // تصفية حسب التبويب
  let filtered = convs.filter(c => {
    const cleanConvId = (c.convId || c.id || "").replace(/^conv_/, "");
    const convLastSeen = parseInt(localStorage.getItem("tasawuq_chat_seen_" + cleanConvId) || "0", 10);
    const effLastSeen = Math.max(lastSeen, convLastSeen);
    const isUnread = (c.updatedAt || 0) > effLastSeen && c.lastSenderUid !== myUid;
    if(currentTab === "unread") return isUnread;
    if(currentTab === "posts") return !!(c.postContext && c.postContext.title);
    if(currentTab === "stores") return !!(c.storeContext && c.storeContext.name);
    return true; // "all"
  });

  // تصفية حسب نص البحث
  if(queryText){
    filtered = filtered.filter(c => {
      const cleanConvId = (c.convId || c.id || "").replace(/^conv_/, "");
      const parts = cleanConvId.split("_").filter(x => x && x !== "conv" && x !== myUid);
      const otherUid = (Array.isArray(c.participants) && c.participants.find(u => u && u !== myUid)) || parts[0] || null;
      
      let otherName = "";
      if(c.lastSenderUid !== myUid && c.lastSenderName){
        otherName = c.lastSenderName;
      } else if(c.postContext?.title){
        otherName = c.postContext.title;
      } else if(c.storeContext?.name){
        otherName = c.storeContext.name;
      }
      if(!otherName && otherUid){
        const s = (allStores || []).find(x => x.ownerUid === otherUid);
        if(s) otherName = s.name;
        else {
          const p = (allPosts || []).find(x => x.uid === otherUid);
          if(p) otherName = p.storeName || p.sellerName || "";
        }
      }

      const matchName = otherName.toLowerCase().includes(queryText);
      const matchMsg = (c.lastMessage || "").toLowerCase().includes(queryText);
      const matchPost = (c.postContext?.title || "").toLowerCase().includes(queryText);
      const matchStore = (c.storeContext?.name || "").toLowerCase().includes(queryText);
      return matchName || matchMsg || matchPost || matchStore;
    });
  }

  if(filtered.length === 0){
    if(queryText || currentTab !== "all"){
      fullList.innerHTML = `
        <div style="text-align:center;padding:50px 20px;background:var(--card);border-radius:18px;border:1px solid var(--border);margin-top:10px">
          <div style="font-size:46px;margin-bottom:10px">🔍</div>
          <div style="font-weight:900;font-size:16px;color:var(--text);margin-bottom:6px">لا توجد محادثات مطابقة للبحث</div>
          <div style="font-size:13px;color:var(--muted);margin-bottom:14px">جرب البحث بكلمة أخرى أو قم بتبديل التصنيف أعلاه.</div>
          <button class="btnMain" style="margin:auto;max-width:180px;font-size:13px;padding:8px 16px" onclick="setInboxTab('all'); if(document.getElementById('inboxSearchInput')) document.getElementById('inboxSearchInput').value=''; renderInboxFilteredList();">عرض كل الرسائل</button>
        </div>
      `;
    } else {
      fullList.innerHTML = `
        <div style="text-align:center;padding:50px 20px;background:var(--card);border-radius:18px;border:1px solid var(--border);margin-top:10px">
          <div style="font-size:48px;margin-bottom:10px">📭</div>
          <div style="font-weight:900;font-size:16px;color:var(--text);margin-bottom:6px">صندوق الرسائل فارغ</div>
          <div style="font-size:13px;color:var(--muted);margin-bottom:18px;line-height:1.6">لم تبدأ أي محادثة بعد. يمكنك التواصل مباشرة مع أي بائع أو صاحب متجر وسوف تظهر كل محادثاتك هنا بشكل أنيق ومنظم!</div>
          <button class="btnMain" style="margin:auto;max-width:220px;font-size:13px;padding:11px 20px;border-radius:12px" onclick="backFromInbox()">تصفح الإعلانات والمتاجر</button>
        </div>
      `;
    }
    return;
  }

  fullList.innerHTML = filtered.map(c => {
    const cleanConvId = (c.convId || c.id || "").replace(/^conv_/, "");
    const parts = cleanConvId.split("_").filter(x => x && x !== "conv" && x !== myUid);
    const otherUid = (Array.isArray(c.participants) && c.participants.find(u => u && u !== myUid)) || parts[0] || null;

    let otherName = "";
    if(c.lastSenderUid !== myUid && c.lastSenderName){
      otherName = c.lastSenderName;
    } else if(otherUid){
      const s = (allStores || []).find(x => x.ownerUid === otherUid || (c.storeContext && x.id === c.storeContext.id));
      if(s) otherName = s.name;
      else {
        const p = (allPosts || []).find(x => x.uid === otherUid || (c.postContext && x.id === c.postContext.id));
        if(p) otherName = p.storeName || p.sellerName || p.title;
      }
    }
    if(!otherName && c.postContext?.title) otherName = c.postContext.title;
    if(!otherName && c.storeContext?.name) otherName = c.storeContext.name;
    if(!otherName) otherName = "مستخدم تسوق الآن";

    const initial = otherName.trim() ? otherName.trim()[0].toUpperCase() : '👤';
    const postTag = c.postContext?.title 
      ? `<span style="font-size:11px;font-weight:700;color:#0284c7;background:#f0f9ff;border:1px solid #bae6fd;padding:2px 8px;border-radius:6px;display:inline-flex;align-items:center;gap:4px">📦 ${escapeHtml(c.postContext.title)}${c.postContext.price ? ' · ' + escapeHtml(c.postContext.price) : ''}</span>` 
      : '';
    const storeTag = c.storeContext?.name 
      ? `<span style="font-size:11px;font-weight:700;color:#16a34a;background:#f0fdf4;border:1px solid #bbf7d0;padding:2px 8px;border-radius:6px;display:inline-flex;align-items:center;gap:4px">🏪 ${escapeHtml(c.storeContext.name)}</span>` 
      : '';
    const tagHtml = postTag || storeTag;

    const convLastSeen = parseInt(localStorage.getItem("tasawuq_chat_seen_" + cleanConvId) || "0", 10);
    const effLastSeen = Math.max(lastSeen, convLastSeen);
    const isUnread = (c.updatedAt || 0) > effLastSeen && c.lastSenderUid !== myUid;
    const borderStyle = isUnread ? "border:2px solid #0284c7;background:rgba(2,132,199,0.03)" : "border:1.5px solid var(--border);background:var(--card)";

    return `
      <div class="inboxRow" style="${borderStyle};border-radius:16px;padding:14px;cursor:pointer;display:flex;align-items:center;gap:12px;box-shadow:0 2px 6px rgba(0,0,0,0.03)" onclick="openChatWithSeller('${escapeHtml(otherUid || '')}', '${escapeHtml(c.postContext?.id || '')}', '${escapeHtml(c.storeContext?.id || '')}', '${escapeHtml(otherName)}')">
        <div class="inboxAvatar" style="width:48px;height:48px;border-radius:50%;font-size:18px;font-weight:900;flex-shrink:0;box-shadow:0 2px 8px rgba(2,132,199,0.25)">
          ${escapeHtml(initial)}
        </div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <div style="font-weight:900;font-size:14.5px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:6px">
              ${escapeHtml(otherName)}
              ${isUnread ? '<span style="width:8px;height:8px;border-radius:50%;background:#0284c7;display:inline-block"></span>' : ''}
            </div>
            <div style="font-size:11.5px;color:var(--muted);white-space:nowrap;flex-shrink:0">${timeAgo(c.updatedAt)}</div>
          </div>
          ${tagHtml ? `<div style="margin-bottom:5px">${tagHtml}</div>` : ''}
          <div style="font-size:13px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.4">
            ${c.lastSenderUid === myUid ? '<span style="color:#0284c7;font-weight:700">أنت: </span>' : ''}${escapeHtml(c.lastMessage || 'بدء المحادثة')}
          </div>
        </div>
        <div style="font-size:16px;color:var(--muted);transform:rotate(180deg);padding-right:4px">➔</div>
      </div>
    `;
  }).join("");
}
window.renderInboxFilteredList = renderInboxFilteredList;
window.filterInboxScreenList = renderInboxFilteredList;

export function setInboxTab(tab){
  window._inboxCurrentTab = tab;
  ['all', 'unread', 'posts', 'stores'].forEach(t => {
    const btn = document.getElementById("inboxTab" + t.charAt(0).toUpperCase() + t.slice(1));
    if(btn){
      if(t === tab){
        btn.classList.add("active");
        btn.style.background = "#0284c7";
        btn.style.color = "#fff";
        btn.style.borderColor = "#0284c7";
      } else {
        btn.classList.remove("active");
        btn.style.background = "var(--card)";
        btn.style.color = "var(--text)";
        btn.style.borderColor = "var(--border)";
      }
    }
  });
  renderInboxFilteredList();
}
window.setInboxTab = setInboxTab;

export function backFromInboxDirect(){
  const is = document.getElementById("inboxScreen");
  if(is) is.classList.add("hidden");
  showCategoriesScreenDirect();
}
window.backFromInboxDirect = backFromInboxDirect;

export function backFromInbox(){
  if(!_isHistoryNavigating && window.history.state && window.history.state.screen === 'inbox'){
    window.history.back();
    return;
  }
  backFromInboxDirect();
}
window.backFromInbox = backFromInbox;

export function closeInbox(){
  const overlay = document.getElementById("userInboxOverlay");
  if(overlay) overlay.classList.add("hidden");
  const is = document.getElementById("inboxScreen");
  if(is) is.classList.add("hidden");
  if(typeof showCategoriesScreenDirect === "function"){
    showCategoriesScreenDirect();
  }
}
window.closeInbox = closeInbox;

export async function updateGlobalUnreadChatCount(){
  if(!auth.currentUser) return;
  const hBadge = document.getElementById("chatHeaderBadge");
  const aBadge = document.getElementById("accountChatBadge");

  try {
    const myUid = auth.currentUser.uid;
    let rows = [];
    if(window.supabase){
      try {
        const { data, error } = await window.supabase
          .from("feedback")
          .select("message")
          .eq("type", "chat_conversation")
          .ilike("message", `%${myUid}%`)
          .limit(40);
        if(!error && Array.isArray(data)) rows = data;
      } catch(e){}
    }

    if(rows.length === 0){
      const qSnap = await getDocs(query(
        collection(db, "feedback"),
        where("type", "==", "chat_conversation"),
        limit(40)
      ));
      rows = qSnap.docs.map(d => d.data());
    }

    let unreadCount = 0;
    const lastSeen = parseInt(localStorage.getItem("tasawuq_chat_last_seen") || "0", 10);

    rows.forEach(d => {
      try {
        const c = JSON.parse(d.message || "{}");
        const cleanConvId = (c.convId || d.id || "").replace(/^conv_/, "");
        const convLastSeen = parseInt(localStorage.getItem("tasawuq_chat_seen_" + cleanConvId) || "0", 10);
        const effLastSeen = Math.max(lastSeen, convLastSeen);
        if(c.convId && c.convId.includes(myUid) && c.lastSenderUid !== myUid && (c.updatedAt || 0) > effLastSeen){
          unreadCount++;
        }
      } catch(e){}
    });

    if(hBadge){
      if(unreadCount > 0){
        hBadge.style.display = "flex";
        hBadge.textContent = unreadCount > 9 ? "9+" : unreadCount;
      } else {
        hBadge.style.display = "none";
      }
    }
    if(aBadge){
      if(unreadCount > 0){
        aBadge.style.display = "inline-flex";
        aBadge.textContent = unreadCount > 9 ? "9+" : unreadCount;
      } else {
        aBadge.style.display = "none";
      }
    }

    // تنبيه بالصوت وإشعار النظام عند زيادة عدد الرسائل غير المقروءة في الخلفية
    if(typeof window._lastGlobalUnreadCount === "number" && unreadCount > window._lastGlobalUnreadCount){
      playChatChime();
      if(document.hidden){
        sendSystemChatNotification("رسالة جديدة", `لديك ${unreadCount} رسالة جديدة غير مقروءة`, "inbox", myUid);
      }
    }
    window._lastGlobalUnreadCount = unreadCount;
  } catch(e){}
}
window.updateGlobalUnreadChatCount = updateGlobalUnreadChatCount;

// ⚡ مراقب المحادثات اللحظي الشامل عبر كل الأجهزة (خفيف وسريع جداً بتقنية Delta Sync)
export function startGlobalChatPoller(){
  if(window._globalChatPollerTimer) return;
  if(!window._globalSeenMsgIds) window._globalSeenMsgIds = new Set();
  if(!window._globalLastChatCheckTs) window._globalLastChatCheckTs = Date.now() - 5000;

  if(!window._globalChatPollerInit && window.supabase){
    window._globalChatPollerInit = true;
    window.supabase.from("feedback").select("id, created_at").eq("type", "chat_message").order("created_at", { ascending: false }).limit(20).then(({ data }) => {
      if(Array.isArray(data)){
        data.forEach(r => {
          window._globalSeenMsgIds.add(r.id);
          const ts = Number(r.created_at || 0);
          if(ts > window._globalLastChatCheckTs) window._globalLastChatCheckTs = ts;
        });
      }
    }).catch(()=>{});
  }

  window._globalChatPollerTimer = setInterval(async () => {
    if(!auth.currentUser) return;
    const myUid = auth.currentUser.uid;

    try {
      if(window.supabase){
        // جلب الرسائل الجديدة فقط التي وصلت بعد آخر فحص زمني لتوفير باقة الهاتف والبطارية
        const sinceTs = (window._globalLastChatCheckTs || (Date.now() - 30000)) - 1000;
        const { data, error } = await window.supabase
          .from("feedback")
          .select("id, uid, user_name, created_at, message")
          .eq("type", "chat_message")
          .gt("created_at", sinceTs)
          .order("created_at", { ascending: true })
          .limit(15);

        if(!error && Array.isArray(data) && data.length > 0){
          let hasNewMsg = false;
          let latestIncoming = null;

          data.forEach(r => {
            const rTs = Number(r.created_at || Date.now());
            if(rTs > window._globalLastChatCheckTs){
              window._globalLastChatCheckTs = rTs;
            }
            if(window._globalSeenMsgIds.size > 500) window._globalSeenMsgIds.clear();
            if(window._globalSeenMsgIds.has(r.id)) return;
            window._globalSeenMsgIds.add(r.id);

            try {
              const m = JSON.parse(r.message || "{}");
              if(m.receiverUid === myUid && m.senderUid !== myUid){
                hasNewMsg = true;
                if(!latestIncoming || (m.createdAt || 0) > (latestIncoming.createdAt || 0)){
                  latestIncoming = m;
                }
              }
            } catch(e){}
          });

          if(hasNewMsg && latestIncoming){
            updateGlobalUnreadChatCount();

            const chatOverlay = document.getElementById("userChatOverlay");
            if(chatOverlay && !chatOverlay.classList.contains("hidden") && window._activeChat && window._activeChat.convId === latestIncoming.convId){
              loadChatMessages(window._activeChat.convId, true);
            } else {
              playChatChime();
              const sName = latestIncoming.senderName || "مستخدم";
              const msgPreview = (latestIncoming.text || (latestIncoming.type === "voice" ? "🎙️ تسجيل صوتي" : "رسالة جديدة")).slice(0, 35);
              showToast(`💬 رسالة من ${escapeHtml(sName)}: "${escapeHtml(msgPreview)}" (اضغط للرد 💬)`, "info", 7000, () => {
                openChatWithSeller(latestIncoming.senderUid, latestIncoming.postId, latestIncoming.storeId, sName);
              });
              sendSystemChatNotification(sName, msgPreview, latestIncoming.convId, latestIncoming.senderUid);
            }

            const inSc = document.getElementById("inboxScreen");
            if(inSc && !inSc.classList.contains("hidden")){
              openInbox(true);
            }
          }
        }
      }
    } catch(err){}
  }, 1500);
}
window.startGlobalChatPoller = startGlobalChatPoller;

// ⚡ مراقب طلبات المطعم والكاشير اللحظي الشامل للأدمن وأصحاب المطاعم
export function startGlobalRestaurantOrdersPoller(){
  if(window._globalOrdersPollerTimer) return;
  window._globalOrdersPollerTimer = setInterval(async () => {
    if(!auth.currentUser) return;
    const me = auth.currentUser;
    const isAdminUser = me && (me.email === ADMIN_EMAIL || isAdmin);
    const isRestOwner = (myStore && isRestaurantStore(myStore)) || isAdminUser;
    if(!isRestOwner) return;

    try {
      if(window.supabase){
        const { data, error } = await window.supabase
          .from("feedback")
          .select("*")
          .eq("type", "restaurant_order")
          .order("created_at", { ascending: false })
          .limit(10);

        if(!error && Array.isArray(data)){
          let latestPending = null;
          data.forEach(r => {
            try {
              const ord = JSON.parse(r.message || "{}");
              if(ord.status === "pending"){
                if(!latestPending || (ord.createdAt || 0) > (latestPending.createdAt || 0)){
                  latestPending = ord;
                }
              }
            } catch(e){}
          });

          if(latestPending && latestPending.orderNo !== window._globalLastSeenOrderNo){
            if(window._globalLastSeenOrderNo !== 0){
              playRestaurantBell("new_order");
              showToast(`🔔 طلبية جديدة وصلت للكاشير! طلب #${latestPending.orderNo} بقيمة ${formatPrice(latestPending.totalPrice)} د.ل`, "info", 5500);
            }
            window._globalLastSeenOrderNo = latestPending.orderNo;
          }

          const cashierSc = document.getElementById("restaurantCashierScreen") || document.getElementById("restaurantLiveOrdersOverlay");
          if(cashierSc && !cashierSc.classList.contains("hidden")){
            refreshCashierOrders(false);
          }
        }
      }
    } catch(e){}
  }, 3000);
}
window.startGlobalRestaurantOrdersPoller = startGlobalRestaurantOrdersPoller;

/* ============================================
   🎙️ نظام الرسائل الصوتية والشات بالفويس (Voice Notes)
   ============================================ */
window.sendQuickChatChip = function(text){
  const input = document.getElementById("chatMessageInput");
  if(!input) return;
  input.value = text;
  sendUserChatMessage();
};

let _voiceMediaRecorder = null;
let _voiceAudioChunks = [];
let _voiceTimerInterval = null;
let _voiceSeconds = 0;

export async function startChatVoiceRecord(){
  try {
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
      showToast("عذراً، متصفحك لا يدعم تسجيل الصوت المباشر", "warn");
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    _voiceAudioChunks = [];
    _voiceSeconds = 0;

    let mimeType = "";
    if(typeof MediaRecorder !== "undefined"){
      if(MediaRecorder.isTypeSupported("audio/webm;codecs=opus")){
        mimeType = "audio/webm;codecs=opus";
      } else if(MediaRecorder.isTypeSupported("audio/mp4")){
        mimeType = "audio/mp4";
      } else if(MediaRecorder.isTypeSupported("audio/ogg")){
        mimeType = "audio/ogg";
      }
    }

    const recOptions = { audioBitsPerSecond: 24000 };
    if(mimeType) recOptions.mimeType = mimeType;
    _voiceMediaRecorder = new MediaRecorder(stream, recOptions);
    
    _voiceMediaRecorder.ondataavailable = (e) => {
      if(e.data && e.data.size > 0) _voiceAudioChunks.push(e.data);
    };

    _voiceMediaRecorder.onstop = () => {
      try { stream.getTracks().forEach(t => t.stop()); } catch(e){}
    };

    _voiceMediaRecorder.start(200);

    const textInput = document.getElementById("chatMessageInput");
    const voiceBar = document.getElementById("chatVoiceActiveBar");
    const micBtn = document.getElementById("btnVoiceRecordChat");
    const timerEl = document.getElementById("voiceRecTimer");

    if(textInput) textInput.style.display = "none";
    if(voiceBar) voiceBar.style.display = "flex";
    if(micBtn) micBtn.style.color = "#ef4444";

    _voiceTimerInterval = setInterval(() => {
      _voiceSeconds++;
      const m = String(Math.floor(_voiceSeconds / 60)).padStart(2, "0");
      const s = String(_voiceSeconds % 60).padStart(2, "0");
      if(timerEl) timerEl.textContent = `${m}:${s}`;
      if(_voiceSeconds >= 60){
        stopAndSendChatVoiceRecord();
      }
    }, 1000);

  } catch(err) {
    console.error("Mic access error:", err);
    showToast("يرجى السماح بالوصول إلى المايكروفون لتسجيل الفويس", "warn");
  }
}
window.startChatVoiceRecord = startChatVoiceRecord;

export function cancelChatVoiceRecord(){
  if(_voiceTimerInterval) clearInterval(_voiceTimerInterval);
  if(_voiceMediaRecorder && _voiceMediaRecorder.state !== "inactive"){
    try { _voiceMediaRecorder.stop(); } catch(e){}
  }
  _voiceAudioChunks = [];
  _voiceSeconds = 0;
  
  const textInput = document.getElementById("chatMessageInput");
  const voiceBar = document.getElementById("chatVoiceActiveBar");
  const micBtn = document.getElementById("btnVoiceRecordChat");
  const timerEl = document.getElementById("voiceRecTimer");

  if(textInput) textInput.style.display = "block";
  if(voiceBar) voiceBar.style.display = "none";
  if(micBtn) micBtn.style.color = "var(--text)";
  if(timerEl) timerEl.textContent = "00:00";
}
window.cancelChatVoiceRecord = cancelChatVoiceRecord;

export function toggleChatVoiceRecord(){
  if(_voiceMediaRecorder && _voiceMediaRecorder.state === "recording"){
    stopAndSendChatVoiceRecord();
  } else {
    startChatVoiceRecord();
  }
}
window.toggleChatVoiceRecord = toggleChatVoiceRecord;

export async function stopAndSendChatVoiceRecord(){
  if(!_voiceMediaRecorder || _voiceMediaRecorder.state === "inactive") return;
  if(_voiceTimerInterval) clearInterval(_voiceTimerInterval);

  const duration = _voiceSeconds;
  const mime = _voiceMediaRecorder.mimeType || "audio/webm";

  _voiceMediaRecorder.onstop = async () => {
    try {
      const blob = new Blob(_voiceAudioChunks, { type: mime });
      if(blob.size < 500){
        cancelChatVoiceRecord();
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result;
        await sendVoiceChatMessage(base64Audio, duration);
      };
      reader.readAsDataURL(blob);
    } catch(err){
      console.error("Error processing voice note:", err);
    } finally {
      cancelChatVoiceRecord();
    }
  };

  try { _voiceMediaRecorder.stop(); } catch(e){}
}
window.stopAndSendChatVoiceRecord = stopAndSendChatVoiceRecord;

export async function sendVoiceChatMessage(audioBase64, duration){
  if(!window._activeChat || !auth.currentUser) return;
  const me = auth.currentUser;
  const senderName = (myProfile && myProfile.name) || me.displayName || "مستخدم";
  const activeChat = window._activeChat;

  const msgId = "voice_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
  const nowTs = Date.now();

  const msgPayload = {
    id: msgId,
    convId: activeChat.convId,
    senderUid: me.uid,
    senderName: senderName,
    receiverUid: activeChat.targetUid,
    type: "voice",
    audioData: audioBase64,
    duration: duration,
    text: "🎙️ رسالة صوتية (" + duration + " ثانية)",
    postId: activeChat.postId,
    storeId: activeChat.storeId,
    status: "sending", // جاري الإرسال ⏳
    createdAt: nowTs
  };

  if(!_activeChatMessages) _activeChatMessages = [];
  _activeChatMessages.push(msgPayload);
  if(window._activeChat){
    window._activeChat.lastMsgCount = _activeChatMessages.length;
    window._activeChat.lastMsgId = msgId;
  }
  renderChatMessagesList(_activeChatMessages);
  scrollChatToBottom(true);
  playChatSendSound();

  const convDocId = "conv_" + activeChat.convId;
  const convSummary = {
    convId: activeChat.convId,
    participants: [me.uid, activeChat.targetUid],
    lastMessage: "🎙️ رسالة صوتية (" + duration + " ث)",
    lastSenderUid: me.uid,
    lastSenderName: senderName,
    updatedAt: nowTs
  };

  try {
    const payloadForServer = { ...msgPayload, status: "sent" };
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("انتهت مهلة الاتصال بالشبكة")), 15000));

    let sendPromise;
    if(window.supabase){
      const pMsg = window.supabase.from("feedback").insert({
        id: msgId,
        type: "chat_message",
        message: JSON.stringify(payloadForServer),
        uid: me.uid,
        user_name: senderName,
        user_phone: me.phoneNumber || "",
        created_at: nowTs
      });

      const pConv = window.supabase.from("feedback").upsert({
        id: convDocId,
        type: "chat_conversation",
        message: JSON.stringify(convSummary),
        uid: me.uid,
        user_name: senderName,
        created_at: nowTs
      });

      sendPromise = Promise.all([pMsg, pConv]).then(([resMsg]) => {
        if(resMsg && resMsg.error) throw resMsg.error;
      });
    } else {
      sendPromise = Promise.all([
        addDoc(collection(db, "feedback"), {
          id: msgId,
          type: "chat_message",
          message: JSON.stringify(payloadForServer),
          uid: me.uid,
          user_name: senderName,
          user_phone: me.phoneNumber || "",
          created_at: nowTs
        }),
        setDoc(doc(db, "feedback", convDocId), {
          type: "chat_conversation",
          message: JSON.stringify(convSummary),
          uid: me.uid,
          user_name: senderName,
          created_at: nowTs
        }, { merge: true })
      ]);
    }

    await Promise.race([sendPromise, timeoutPromise]);

    // ✅ تأكيد التسليم الناجح فوراً وتحويل الحالة إلى "تم الإرسال"
    msgPayload.status = "sent";
    updateChatMessageStatus(msgId, "sent");
    if(window._activeChat){
      window._activeChat.lastFetchedTs = Math.max(window._activeChat.lastFetchedTs || 0, nowTs);
    }

  } catch(err) {
    console.error("Error sending voice note:", err);
    msgPayload.status = "failed";
    updateChatMessageStatus(msgId, "failed");
    showToast("تعذر إرسال التسجيل الصوتي: " + (err.message || err), "error");
  }
}
window.sendVoiceChatMessage = sendVoiceChatMessage;

window._currentPlayingAudio = null;
window._currentPlayingBtn = null;

export function toggleVoicePlayback(btn, audioSrcOrId){
  if(window._currentPlayingAudio && !window._currentPlayingAudio.paused){
    window._currentPlayingAudio.pause();
    if(window._currentPlayingBtn){
      window._currentPlayingBtn.innerHTML = "▶";
      window._currentPlayingBtn.closest(".voicePlayerBubble")?.classList.remove("playing");
    }
    if(window._currentPlayingBtn === btn){
      window._currentPlayingAudio = null;
      window._currentPlayingBtn = null;
      return;
    }
  }

  let finalSrc = audioSrcOrId;
  if(window._chatAudioMap && window._chatAudioMap[audioSrcOrId]){
    finalSrc = window._chatAudioMap[audioSrcOrId];
  } else if(!finalSrc || finalSrc.length < 30){
    const bubble = btn.closest(".voicePlayerBubble");
    finalSrc = bubble?.getAttribute("data-audio-src") || finalSrc;
  }
  if(!finalSrc){
    showToast("تعذر العثور على التسجيل الصوتي", "warn");
    return;
  }

  const audio = new Audio(finalSrc);
  window._currentPlayingAudio = audio;
  window._currentPlayingBtn = btn;
  btn.innerHTML = "⏸";
  btn.closest(".voicePlayerBubble")?.classList.add("playing");

  audio.onended = () => {
    btn.innerHTML = "▶";
    btn.closest(".voicePlayerBubble")?.classList.remove("playing");
    window._currentPlayingAudio = null;
    window._currentPlayingBtn = null;
  };
  audio.onerror = () => {
    btn.innerHTML = "▶";
    btn.closest(".voicePlayerBubble")?.classList.remove("playing");
    showToast("تعذر تشغيل التسجيل الصوتي", "warn");
  };

  audio.play().catch(e => {
    console.error("Audio playback error:", e);
    btn.innerHTML = "▶";
  });
}
window.toggleVoicePlayback = toggleVoicePlayback;

/* ============================================
   🎬 نظام الستوريات والريلز الفخم (Stories System)
   ============================================ */
let _storiesList = [];
let _currentStoryIndex = 0;
let _storyProgressTimer = null;
let _storyLikedMap = {};

export function renderHomeStoriesBar(){
  const bar = document.getElementById("homeStoriesBar");
  if(!bar) return;

  if(!window._customUserStoriesLoaded){
    window._customUserStoriesLoaded = true;
    setTimeout(() => { if(typeof loadCustomUserStories === "function") loadCustomUserStories(); }, 300);
  }

  // استدعاء الإعلانات بشكل سليم وسريع ومحدود لـ 15 قصة فقط
  const rawPosts = (typeof allPosts !== "undefined" && Array.isArray(allPosts)) ? allPosts : ((window.allPosts && Array.isArray(window.allPosts)) ? window.allPosts : []);
  const approved = [];
  for(let i = 0; i < rawPosts.length; i++){
    const p = rawPosts[i];
    if(getStatus(p) === "approved" && !isExpired(p)){
      approved.push(p);
      if(approved.length >= 15) break;
    }
  }

  const myStoryCircle = `
    <div class="storyCircleItem" onclick="handleMyStoryClick()" title="نشر فيديو في قصتك">
      <div class="storyRing seen" style="border:2px dashed #0284c7;background:transparent;display:flex;align-items:center;justify-content:center;position:relative">
        <span style="font-size:22px;color:#0284c7">➕</span>
      </div>
      <div class="storyTitle" style="color:#0284c7;font-weight:900">قصتك +</div>
    </div>
  `;

  // تحويل القصص إلى فيديوهات بالكامل (فيديو ريلز عمودي)
  const defaultStories = approved.map((p, idx) => ({
    id: p.id,
    title: p.title || "فيديو مميز",
    price: p.price ? formatPrice(p.price) + " د.ل" : "تواصل",
    image: (p.images && p.images[0]) || p.imageUrl || "car.png",
    videoUrl: p.videoUrl || "1000068463.mp4",
    mediaType: "video",
    userName: p.storeName || p.sellerName || p.user_name || "معلن موثوق",
    userAvatar: p.storeLogo || "icon-192.png",
    likes: (p.likesCount || 0) + (p.views ? Math.min(24, Math.floor(p.views / 5)) : 5),
    createdAt: p.createdAt || p.created_at || (Date.now() - (idx + 1) * 3600000),
    post: p
  }));

  const userStories = (window._customUserStories || []).filter(s => (s.expiresAt || 0) > Date.now());
  _storiesList = [...userStories, ...defaultStories];

  if(_storiesList.length === 0){
    bar.innerHTML = myStoryCircle;
    bar.style.display = "flex";
    return;
  }

  bar.style.display = "flex";
  bar.innerHTML = myStoryCircle + _storiesList.map((s, idx) => `
    <div class="storyCircleItem" onclick="openStoryViewer(${idx})">
      <div class="storyRing ${window._seenStories && window._seenStories.includes(s.id) ? 'seen' : ''}" style="position:relative">
        <img class="storyThumb" src="${escapeHtml(s.image)}" alt="${escapeHtml(s.title)}" loading="lazy" onerror="this.onerror=null;this.src='car.png'">
        <span class="storyVideoBadge">▶</span>
      </div>
      <div class="storyTitle">${escapeHtml(s.title)}</div>
    </div>
  `).join("");
}
window.renderHomeStoriesBar = renderHomeStoriesBar;

export function formatStoryTimeAgo(ts){
  if(!ts) return "الآن";
  const diffSec = Math.floor((Date.now() - Number(ts)) / 1000);
  if(diffSec < 60) return "الآن";
  const diffMin = Math.floor(diffSec / 60);
  if(diffMin === 1) return "منذ دقيقة";
  if(diffMin === 2) return "منذ دقيقتين";
  if(diffMin <= 10) return `منذ ${diffMin} دقائق`;
  if(diffMin < 60) return `منذ ${diffMin} دقيقة`;
  const diffHours = Math.floor(diffMin / 60);
  if(diffHours === 1) return "منذ ساعة";
  if(diffHours === 2) return "منذ ساعتين";
  if(diffHours <= 10) return `منذ ${diffHours} ساعات`;
  if(diffHours < 24) return `منذ ${diffHours} ساعة`;
  return "منذ يوم";
}
window.formatStoryTimeAgo = formatStoryTimeAgo;

export function openStoryViewer(idx, skipHistory = false){
  if(!_storiesList || _storiesList.length === 0) return;
  _currentStoryIndex = Math.max(0, Math.min(idx, _storiesList.length - 1));
  const s = _storiesList[_currentStoryIndex];
  
  const modal = document.getElementById("storyViewerOverlay");
  if(!modal) return;
  modal.classList.remove("hidden");
  if(!skipHistory) pushNavState({ screen: 'storyViewer' }, '#story');

  if(!window._seenStories) window._seenStories = [];
  if(!window._seenStories.includes(s.id)) window._seenStories.push(s.id);

  // ربط إيماءات السحب العمودي (Reels / TikTok Vertical Swiping)
  if(!window._storySwipeAttached){
    window._storySwipeAttached = true;
    let touchStartY = 0;
    let touchStartX = 0;

    modal.addEventListener("touchstart", (e) => {
      if(e.touches && e.touches.length > 0){
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
      }
    }, { passive: true });

    modal.addEventListener("touchend", (e) => {
      if(!e.changedTouches || e.changedTouches.length === 0) return;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const dx = e.changedTouches[0].clientX - touchStartX;

      // سحب عمودي مميز (Vertical Swipe)
      if(Math.abs(dy) > 40 && Math.abs(dy) > Math.abs(dx)){
        if(dy < -40){
          // سحب لأعلى (Swipe Up) -> الانتقال للفيديو التالي
          if(_currentStoryIndex < _storiesList.length - 1){
            _currentStoryIndex++;
            showStoryItem(_currentStoryIndex);
          } else {
            closeStoryViewer();
          }
        } else if(dy > 40){
          // سحب لأسفل (Swipe Down) -> الانتقال للفيديو السابق أو إغلاق
          if(_currentStoryIndex > 0){
            _currentStoryIndex--;
            showStoryItem(_currentStoryIndex);
          } else {
            closeStoryViewer();
          }
        }
      }
    }, { passive: true });
  }

  showStoryItem(_currentStoryIndex);
}
window.openStoryViewer = openStoryViewer;

function showStoryItem(idx){
  const s = _storiesList[idx];
  if(!s) return;

  const avatar = document.getElementById("storyUserAvatar");
  const name = document.getElementById("storyUserName");
  const time = document.getElementById("storyTimeAgo");
  const img = document.getElementById("storyMediaImg");
  const vid = document.getElementById("storyMediaVideo");
  const title = document.getElementById("storyBottomTitle");
  const price = document.getElementById("storyBottomPrice");
  const likeCount = document.getElementById("storyLikeCount");
  const progressBar = document.getElementById("storyProgressBarInner");
  const muteBtn = document.getElementById("storyMuteBtn");

  if(avatar) avatar.src = s.userAvatar;
  if(name) name.textContent = s.userName;
  if(time) time.textContent = formatStoryTimeAgo(s.createdAt);
  if(title) title.textContent = s.title;
  if(price) price.textContent = s.price;
  
  const isLiked = !!_storyLikedMap[s.id];
  if(likeCount) likeCount.textContent = s.likes + (isLiked ? 1 : 0);
  const icon = document.getElementById("storyLikeIcon");
  if(icon) icon.textContent = isLiked ? "💖" : "❤️";

  if(_storyProgressTimer) clearInterval(_storyProgressTimer);
  if(progressBar) progressBar.style.width = "0%";

  let videoSrc = s.videoUrl || (s.mediaType === 'video' ? s.image : '') || "1000068463.mp4";

  if(img) img.style.display = "none";
  if(vid){
    vid.style.display = "block";
    vid.currentTime = 0;
    vid.muted = (window._storyMuted !== false);
    if(muteBtn) muteBtn.textContent = vid.muted ? "🔇" : "🔊";

    if(s.hasLocalVideo){
      getStoryVideoBlob(s.id).then(blob => {
        if(blob){
          vid.src = URL.createObjectURL(blob);
        } else {
          vid.src = videoSrc;
        }
        vid.play().catch(()=>{});
      }).catch(() => {
        vid.src = videoSrc;
        vid.play().catch(()=>{});
      });
    } else {
      vid.src = videoSrc;
      vid.play().catch(()=>{});
    }

    vid.onloadedmetadata = () => {
      vid.play().catch(()=>{});
    };
    vid.ontimeupdate = () => {
      if(vid.duration && vid.duration > 0){
        const pct = Math.min(100, (vid.currentTime / vid.duration) * 100);
        if(progressBar) progressBar.style.width = pct + "%";
      }
    };
    vid.onended = () => {
      if(_currentStoryIndex < _storiesList.length - 1){
        _currentStoryIndex++;
        showStoryItem(_currentStoryIndex);
      } else {
        closeStoryViewer();
      }
    };
    vid.play().catch(()=>{});
  }
}

export function toggleStoryMute(event){
  if(event) event.stopPropagation();
  const vid = document.getElementById("storyMediaVideo");
  const btn = document.getElementById("storyMuteBtn");
  if(!vid) return;
  vid.muted = !vid.muted;
  window._storyMuted = vid.muted;
  if(btn) btn.textContent = vid.muted ? "🔇" : "🔊";
  showToast(vid.muted ? "تم كتم الصوت 🔇" : "تم تشغيل الصوت 🔊", "info", 1500);
}
window.toggleStoryMute = toggleStoryMute;

export function handleStoryTap(event){
  const vid = document.getElementById("storyMediaVideo");
  const rect = event.currentTarget.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  if(clickX < rect.width * 0.28){
    if(_currentStoryIndex > 0){
      _currentStoryIndex--;
      showStoryItem(_currentStoryIndex);
    }
  } else if(clickX > rect.width * 0.72){
    if(_currentStoryIndex < _storiesList.length - 1){
      _currentStoryIndex++;
      showStoryItem(_currentStoryIndex);
    } else {
      closeStoryViewer();
    }
  } else {
    if(vid){
      if(vid.paused){
        vid.play().catch(()=>{});
      } else {
        vid.pause();
      }
    }
  }
}
window.handleStoryTap = handleStoryTap;

export function closeStoryViewerDirect(){
  if(_storyProgressTimer) clearInterval(_storyProgressTimer);
  const modal = document.getElementById("storyViewerOverlay");
  if(modal) modal.classList.add("hidden");
  const vid = document.getElementById("storyMediaVideo");
  if(vid){
    vid.pause();
    vid.ontimeupdate = null;
    vid.onended = null;
    vid.src = "";
  }
}
window.closeStoryViewerDirect = closeStoryViewerDirect;

export function closeStoryViewer(){
  if (!_isHistoryNavigating && window.history.state && window.history.state.screen === 'storyViewer') {
    window.history.back();
    return;
  }
  closeStoryViewerDirect();
}
window.closeStoryViewer = closeStoryViewer;

export function toggleStoryLike(){
  const s = _storiesList[_currentStoryIndex];
  if(!s) return;
  _storyLikedMap[s.id] = !_storyLikedMap[s.id];
  const isLiked = _storyLikedMap[s.id];
  const countEl = document.getElementById("storyLikeCount");
  const icon = document.getElementById("storyLikeIcon");
  if(countEl) countEl.textContent = s.likes + (isLiked ? 1 : 0);
  if(icon) icon.textContent = isLiked ? "💖" : "❤️";
  showToast(isLiked ? "تم الإعجاب بالستوري ❤️" : "تم إلغاء الإعجاب");
}
window.toggleStoryLike = toggleStoryLike;

export function openStoryChat(){
  const s = _storiesList[_currentStoryIndex];
  if(!s) return;
  closeStoryViewer();
  if(s.post && typeof openPost === "function"){
    openPost(s.id);
  }
}
window.openStoryChat = openStoryChat;

export async function shareCurrentStory(){
  const s = _storiesList[_currentStoryIndex];
  if(!s) return;
  const url = `https://tasawuqnow.com/#post-${s.id}`;
  if(navigator.share){
    try {
      await navigator.share({
        title: s.title,
        text: `شاهد ستوري "${s.title}" على تسوق الآن:`,
        url: url
      });
      return;
    } catch(e){}
  }
  try {
    await navigator.clipboard.writeText(url);
    showToast("تم نسخ رابط الستوري بنجاح 🔗", "success");
  } catch(e){
    showToast(url);
  }
}
window.shareCurrentStory = shareCurrentStory;

export async function reportCurrentStory(){
  const s = _storiesList[_currentStoryIndex];
  if(!s) return;
  const reason = await showPromptModal("ما هو سبب الإبلاغ عن هذا الستوري؟", "", { title: "إبلاغ عن ستوري مخالف", icon: "🚩", confirmText: "إرسال البلاغ", placeholder: "مثال: محتوى غير لائق، إعلان احتيالي، سلعة مخالفة..." });
  if(!reason || !reason.trim()) return;

  try {
    await addDoc(collection(db, "feedback"), {
      type: "story_report",
      message: JSON.stringify({
        storyId: s.id,
        storyTitle: s.title,
        reason: reason.trim(),
        reporterUid: auth.currentUser ? auth.currentUser.uid : "زائر",
        timestamp: Date.now()
      }),
      created_at: Date.now()
    });
    showToast("شكراً لك، تم استلام بلاغك وستتم مراجعته فوراً من الإدارة 🛡️", "success");
  } catch(err){
    showToast("تم استلام بلاغك للإدارة");
  }
}
window.reportCurrentStory = reportCurrentStory;

export function viewAdFromStory(){
  const s = _storiesList[_currentStoryIndex];
  if(!s) return;
  closeStoryViewer();
  if(typeof openPost === "function") openPost(s.id);
}
window.viewAdFromStory = viewAdFromStory;

/* ============================================
   🎬 نظام الستوريات والريلز الفيديوهات الفاخرة (Video Stories System)
   ============================================ */
let _pendingStoryPost = null;

// قاعدة بيانات محلية لتخزين مقاطع الفيديو بأمان بدون استهلاك الذاكرة (IndexedDB)
function openStoryDb(){
  return new Promise((resolve, reject) => {
    if(typeof indexedDB === "undefined") return resolve(null);
    const req = indexedDB.open("tasawuq_story_videos", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if(!db.objectStoreNames.contains("videos")){
        db.createObjectStore("videos", { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

async function saveStoryVideoBlob(storyId, file){
  try {
    const db = await openStoryDb();
    if(!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction("videos", "readwrite");
      const store = tx.objectStore("videos");
      store.put({ id: storyId, blob: file, createdAt: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch(e){
    return false;
  }
}

async function getStoryVideoBlob(storyId){
  try {
    const db = await openStoryDb();
    if(!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction("videos", "readonly");
      const store = tx.objectStore("videos");
      const req = store.get(storyId);
      req.onsuccess = () => resolve(req.result ? req.result.blob : null);
      req.onerror = () => resolve(null);
    });
  } catch(e){
    return null;
  }
}

window.handleMyStoryClick = function(){
  if(!auth.currentUser){
    pendingAction = "mine";
    if(authOverlay) authOverlay.classList.remove("hidden");
    return;
  }
  const myApproved = allPosts.filter(p => p.uid === auth.currentUser.uid && getStatus(p) === "approved");
  if(myApproved.length > 0){
    publishPostToStory(myApproved[0].id);
  } else {
    publishPostToStory(null);
  }
};

window.publishPostToStory = function(postId, event){
  if(event) event.stopPropagation();
  const p = postId ? allPosts.find(x => x.id === postId) : null;
  _pendingStoryPost = p;

  const modal = document.getElementById("publishStoryModal");
  const imgEl = document.getElementById("pubStoryPostImg");
  const titleEl = document.getElementById("pubStoryPostTitle");
  const priceEl = document.getElementById("pubStoryPostPrice");
  const statusEl = document.getElementById("pubStoryUploadStatus");

  if(p){
    if(imgEl) imgEl.src = (p.images && p.images[0]) || p.imageUrl || "icon-192.png";
    if(titleEl) titleEl.textContent = p.title || "إعلانك المميز";
    if(priceEl) priceEl.textContent = p.price ? formatPrice(p.price) + " د.ل" : "تواصل";
  } else {
    const myName = (myProfile && myProfile.name) || auth.currentUser?.displayName || "قصتي";
    if(imgEl) imgEl.src = "icon-192.png";
    if(titleEl) titleEl.textContent = "فيديو ستوري جديد";
    if(priceEl) priceEl.textContent = myName;
  }

  if(statusEl) statusEl.style.display = "none";
  if(modal) modal.classList.remove("hidden");
};

window.closePublishStoryModal = function(){
  const modal = document.getElementById("publishStoryModal");
  if(modal) modal.classList.add("hidden");
  _pendingStoryPost = null;
};

window.handleStoryCustomFileSelected = async function(input){
  if(!input.files || input.files.length === 0) return;
  const file = input.files[0];
  const statusEl = document.getElementById("pubStoryUploadStatus");
  
  if(!file.type.startsWith("video/") && !file.name.match(/\.(mp4|mov|webm|m4v|3gp)$/i)){
    showToast("⚠️ الستوري يدعم مقاطع الفيديو فقط! يرجى اختيار ملف فيديو 🎥", "warn");
    input.value = "";
    return;
  }

  if(file.size > 15 * 1024 * 1024){
    showToast("⚠️ حجم الفيديو كبير، يرجى اختيار فيديو مدته 10-15 ثانية (أقل من 15MB) ليظهر بسرعة لجميع الزوار", "warn", 4500);
    return;
  }

  if(statusEl){
    statusEl.style.display = "block";
    statusEl.textContent = "⏳ جاري تحويل ورفع فيديو الستوري سحابياً لجميع الزوار... (يرجى الانتظار ثوانٍ)";
  }

  const p = _pendingStoryPost;
  const me = auth.currentUser;
  const storyId = "story_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

  // 1. تخزين ملف الفيديو في IndexedDB للمعاينة الفورية على هاتف الناشر
  try {
    await saveStoryVideoBlob(storyId, file);
  } catch(e){}

  // 2. تحويل ملف الفيديو إلى Data URL سحابي ليعمل على كافة الهواتف فوراً
  let videoDataUrl = null;
  try {
    videoDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  } catch(err){
    console.warn("Video convert error:", err);
  }

  const finalVideoUrl = videoDataUrl || "1000068463.mp4";

  // 3. إنشاء كائن الستوري
  const storyItem = {
    id: storyId,
    postId: p ? p.id : null,
    title: (p ? p.title : null) || "فيديو مميز",
    price: (p && p.price) ? formatPrice(p.price) + " د.ل" : "",
    image: (p && p.images && p.images[0]) || (p && p.imageUrl) || "icon-192.png",
    videoUrl: finalVideoUrl,
    hasLocalVideo: true,
    mediaType: "video",
    userName: (p ? (p.storeName || p.sellerName) : null) || (window.currentProfile && window.currentProfile.name) || (window.myProfile && window.myProfile.name) || "قصتي",
    userAvatar: (p && p.storeLogo) || "icon-192.png",
    likes: 1,
    timeAgo: "الآن",
    uid: me ? me.uid : "guest",
    isUserStory: true,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    createdAt: Date.now(),
    post: p || null
  };

  if(!window._customUserStories) window._customUserStories = [];
  window._customUserStories.unshift(storyItem);

  // حفظ في localStorage للاسترجاع الفوري عند تحديث الصفحة
  try {
    const existing = JSON.parse(localStorage.getItem("tasawuq_user_stories") || "[]");
    existing.unshift(storyItem);
    localStorage.setItem("tasawuq_user_stories", JSON.stringify(existing.slice(0, 15)));
  } catch(e){}

  // تسجيل في قاعدة البيانات سحابياً للظهور على كافة الهواتف فوراً
  const storyPayload = {
    id: storyId,
    postId: p ? p.id : null,
    title: storyItem.title,
    price: storyItem.price,
    image: storyItem.image,
    videoUrl: finalVideoUrl,
    userName: storyItem.userName,
    userAvatar: storyItem.userAvatar,
    expiresAt: storyItem.expiresAt,
    createdAt: storyItem.createdAt
  };

  try {
    if(window.supabase){
      await window.supabase.from("feedback").insert({
        id: storyId,
        type: "active_user_story",
        message: JSON.stringify(storyPayload),
        uid: me ? me.uid : "guest",
        user_name: storyItem.userName,
        created_at: storyItem.createdAt
      });
    }
  } catch(e){
    console.warn("Supabase save story error:", e);
  }

  try {
    await setDoc(doc(db, "feedback", storyId), {
      id: storyId,
      type: "active_user_story",
      message: JSON.stringify(storyPayload),
      uid: me ? me.uid : "guest",
      created_at: storyItem.createdAt
    });
  } catch(e){}

  closePublishStoryModal();
  renderHomeStoriesBar();
  showToast("🎉 تم نشر فيديو قصتك في الستوري بنجاح! سيظهر لجميع الهواتف والزوار لمدة 24 ساعة 🚀", "success", 4500);
};

// جلب الستوريات المحفوظة تلقائياً عند بدء التشغيل
export async function loadCustomUserStories(){
  let stories = [];
  try {
    const local = JSON.parse(localStorage.getItem("tasawuq_user_stories") || "[]");
    stories = local.filter(s => (s.expiresAt || 0) > Date.now());
  } catch(e){}

  try {
    if(window.supabase){
      const { data, error } = await window.supabase
        .from("feedback")
        .select("*")
        .eq("type", "active_user_story")
        .order("created_at", { ascending: false })
        .limit(20);
      if(!error && data){
        const now = Date.now();
        data.forEach(row => {
          try {
            const s = JSON.parse(row.message || "{}");
            if((s.expiresAt || 0) > now && !stories.some(x => x.id === s.id)){
              stories.push({
                ...s,
                mediaType: "video",
                hasLocalVideo: false,
                isUserStory: true
              });
            }
          }catch(e){}
        });
      }
    }
  } catch(e){}

  window._customUserStories = stories;
  renderHomeStoriesBar();
}
window.loadCustomUserStories = loadCustomUserStories;
