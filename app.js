/* ============================================================
   تسوق الآن — الجزء الأول: Firebase + Utilities + State + Points + Wheel + AI
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, setDoc, getDoc, getDocs, query, where, updateDoc, onSnapshot, deleteDoc, doc, increment, runTransaction } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { getAI, getGenerativeModel, GoogleAIBackend } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-ai.js";

/* ============================================================
   Firebase Init
   ============================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyBuhnSrkn6jXcCxUnbL-o14gd5pS9wRmnY",
  authDomain: "tasawuq-now-eb955.firebaseapp.com",
  projectId: "tasawuq-now-eb955",
  storageBucket: "tasawuq-now-eb955.firebasestorage.app",
  messagingSenderId: "786110830242",
  appId: "1:786110830242:web:15a4752cd9b5db3f0129fb"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

console.log('ℹ️ App Check متوقف — البوت يشتغل بدون حماية إضافية');

/* ✅ مشاركة Firebase مع parts 2 & 3 */
window.app = app;
window.auth = auth;
window.db = db;

/* ============================================================
   Constants
   ============================================================ */
window.IMGBB_API_KEY = "114eae2e3072c10adec45b174bd7e67a";
window.ADMIN_EMAIL = "abdoalk73@gmail.com";
window.ADMIN_WHATSAPP = "218928476784";
window.POST_DURATION_DAYS = 30;
window.POST_DURATION_MS = window.POST_DURATION_DAYS * 24 * 60 * 60 * 1000;
window.EXPIRED_GRACE_DAYS = 7;
window.RESTAURANT_CATEGORY = "مطاعم ومأكولات";
window.RESTAURANT_CATEGORY_LEGACY = "مطاعم وغداء";

window.isRestaurantCategory = function(cat) {
  return cat === window.RESTAURANT_CATEGORY || cat === window.RESTAURANT_CATEGORY_LEGACY;
};

window.CART_ALLOWED_CATEGORIES = ["دراجات هوائية","الخدمات","عقارات للبيع","عقارات للإيجار","موبايل وتابلت","لابتوب وكمبيوتر","ألعاب وألعاب الفيديو","أجهزة منزلية","ملابس رجالية","ملابس نسائية","ملابس أطفال","جمال وصحة","مكياج","مطاعم ومأكولات","مطاعم وغداء","إلكترونيات","الحيوانات والطيور","العطور"];

window.CAR_BRANDS = ["تويوتا","هيونداي","كيا","نيسان","هوندا","مازدا","ميتسوبيشي","شيفروليه","فورد","فولكس واجن","أودي","BMW","مرسيدس","لكزس","رينو","بيجو","سيتروين","جيب","لاند روفر","رينج روفر","كاديلاك","فيات","سكودا","سوزوكي","إيسوزو","ديهاتسو","إنفينيتي","أكيورا","BYD","شيري","جيلي","MG","هفال","شانجان","فوتون","جاك","بورش","فيراري","لامبورجيني","مازيراتي","بنتلي","جاكوار","سايبا","تاتا","سوبارو","أوبل","سيات","أخرى"];
window.MOTORCYCLE_BRANDS = ["هوندا","ياماها","سوزوكي","كاوازاكي","BMW","دوكاتي","KTM","هارلي ديفيدسون","تريومف","أبريليا","بياجيو","فيسبا","بولاريس","رويال إنفيلد","بينيللي","هوسكفارنا","CF Moto","بينجو","هوجان","دايون","أخرى"];
window.PHONE_BRANDS = ["Apple / آيفون","Samsung / سامسونج","Huawei / هواوي","Xiaomi / شاومي","Oppo / أوبو","Vivo / فيفو","Realme / ريلمي","Nokia / نوكيا","Infinix / إنفينكس","Tecno / تكنو","Honor / هونر","OnePlus / ون بلس","Google Pixel","Sony / سوني","LG / إل جي","Motorola","HTC","Lenovo","Asus","ZTE","itel","Wiko","Alcatel","TCL","Blackberry","آيباد","تابلت سامسونج","تابلت هواوي","تابلت لينوفو","أخرى"];
window.COMPUTER_BRANDS = ["HP / إتش بي","Dell / ديل","Lenovo / لينوفو","Asus / أسوس","Acer / إيسر","Toshiba / توشيبا","Apple MacBook","MSI","Samsung","Microsoft Surface","Sony Vaio","Fujitsu","Razer","Alienware","LG Gram","Huawei MateBook","Xiaomi Mi Notebook","Gigabyte","Panasonic","Compaq","IBM","ThinkPad","Chromebook","PC تجميع","أخرى"];
window.ANIMAL_TYPES = ["كلاب","قطط","طيور","أغنام ومواشي","أرانب وقوارض","أسماك وزينة","خيول ودواب","زواحف","أخرى"];
window.PERFUME_TYPES = ["عطور رجالية","عطور نسائية","عطور عربية","بخور وعود","مسك","ماركات عالمية","معطرات جسم","أخرى"];

window.SUB_CATEGORIES = {
  "سيارات ومركبات":{title:"🚗 اختر الماركة:",items:window.CAR_BRANDS},
  "دراجات نارية":{title:"🏍️ اختر الماركة:",items:window.MOTORCYCLE_BRANDS},
  "موبايل وتابلت":{title:"📱 اختر الماركة:",items:window.PHONE_BRANDS},
  "لابتوب وكمبيوتر":{title:"💻 اختر الماركة:",items:window.COMPUTER_BRANDS},
  "الحيوانات والطيور":{title:"🐾 اختر النوع:",items:window.ANIMAL_TYPES},
  "العطور":{title:"🌸 اختر النوع:",items:window.PERFUME_TYPES}
};

window.CATEGORIES = [
  {name:"الكل",icon:"✨",iconName:"layout-grid",color:"#38bdf8"},
  {name:"🏪 المتاجر",icon:"",isStore:true,iconName:"store",color:"#f59e0b"},
  {name:"سيارات ومركبات",icon:"🚗",iconName:"car",color:"#3b82f6",image:"car.png"},
  {name:"دراجات نارية",icon:"🏍️",iconName:"bike",color:"#ef4444",image:"motorcycle.png"},
  {name:"دراجات هوائية",icon:"🚲",iconName:"bike",color:"#22c55e",image:"bicycle.png"},
  {name:"الخدمات",icon:"🛠️",iconName:"wrench",color:"#ea580c",image:"services.png"},
  {name:"عقارات للبيع",icon:"🏠",iconName:"home",color:"#10b981",image:"house.png"},
  {name:"عقارات للإيجار",icon:"🔑",iconName:"key",color:"#059669",image:"house.png"},
  {name:"موبايل وتابلت",icon:"📱",iconName:"smartphone",color:"#a855f7",image:"phone.png"},
  {name:"لابتوب وكمبيوتر",icon:"💻",iconName:"laptop",color:"#0284c7",image:"laptop.png"},
  {name:"ألعاب وألعاب الفيديو",icon:"🎮",iconName:"gamepad-2",color:"#8b5cf6",image:"games.png"},
  {name:"أجهزة منزلية",icon:"🧊",iconName:"refrigerator",color:"#0891b2",image:"appliances.png"},
  {name:"ملابس رجالية",icon:"👔",iconName:"shirt",color:"#0f766e",image:"men-clothes.png"},
  {name:"ملابس نسائية",icon:"👗",iconName:"shirt",color:"#db2777",image:"women-clothes.png"},
  {name:"ملابس أطفال",icon:"👶",iconName:"baby",color:"#f59e0b",image:"kids-clothes.png"},
  {name:"جمال وصحة",icon:"💆",iconName:"sparkles",color:"#ec4899",image:"beauty.png"},
  {name:"مكياج",icon:"💄",iconName:"palette",color:"#e11d48",image:"makeup.png"},
  {name:"مطاعم ومأكولات",icon:"🍽️",iconName:"utensils-crossed",color:"#dc2626",image:"restaurant.png"},
  {name:"إلكترونيات",icon:"🔌",iconName:"plug",color:"#0ea5e9",image:"electronics.png"},
  {name:"الحيوانات والطيور",icon:"🐾",iconName:"paw-print",color:"#8b5cf6",image:"animals.png"},
  {name:"العطور",icon:"🌸",iconName:"spray-can",color:"#ec4899",image:"perfume.png"}
];

window.LIBYA_CITIES = {
  "الغرب":["طرابلس","جنزور","تاجوراء","القره بوللي","سوق الجمعة","أبوسليم","عين زارة","قصر بن غشير","العزيزية","الماية","الزاوية","صرمان","صبراتة","العجيلات","زوارة","الجميل","رقدالين","زلطن","الرياينة","الخمس","زليتن","مسلاتة","مصراتة","ترهونة","بني وليد","غريان","مزدة","يفرن","جادو","نالوت","غدامس","الزنتان","الرجبان","الرحيبات","القلعة","ككلة","تيجي","الشقيقة","الأصابعة","ورشفانة","القواليش"],
  "الشرق":["بنغازي","البيضاء","درنة","طبرق","المرج","شحات","سوسة","الأبرق","القبة","الأبيار","سلوق","توكرة","قمينس","إجدابيا","البريقة","رأس لانوف","العقيلة","أمساعد","بنينة"],
  "الوسط":["سرت","مرادة","بن جواد","النوفلية","أبوقرين","الوشكة","هون","ودان","سوكنة","زلة","الجفرة","أوجلة","جالو"],
  "الجنوب":["سبها","أوباري","مرزق","غات","الشاطئ","براك الشاطئ","تمنهنت","القطرون","تراغن","أدري","الكفرة","ربيانة","تازربو","الغريفة"]
};

window.FORBIDDEN_WORDS = ["إباحي","اباحي","جنس","جنسي","سكس","عارية","عاري","عريان","عريانة","ملط","دعارة","عاهر","عاهرة","شرموط","شرموطة","قحبة","زانية","زاني","للتعارف","شات جنسي","فتاة ليل","حشيش","كوكايين","هيروين","بانجو","ماريجوانا","ترامادول","كبتاجون","استروكس","مخدر","بندقية للبيع","كلاشنكوف","سلاح للبيع","مسدس للبيع","خرطوش","رصاص للبيع","تهريب","نصب","غش","وهمي","مزيف","porn","sex","nude","xxx","adult","escort","prostitute","whore","fuck","weed","cocaine","heroin","drugs","scam"];

window.detectForbidden = function(t){
  if(!t)return null;
  const s=String(t).toLowerCase();
  for(const w of window.FORBIDDEN_WORDS){if(s.includes(w.toLowerCase()))return w;}
  return null;
};
window.checkContent = function(t,d){
  const a=window.detectForbidden(t);
  if(a)return{word:a,field:"العنوان"};
  const b=window.detectForbidden(d);
  if(b)return{word:b,field:"الوصف"};
  return null;
};

window.RESERVED_USERNAMES = ["admin","administrator","root","support","help","tasawuq","tasawuqnow","owner","moderator","mod","official","system","api","www","mail","email"];
window.validateUsername = function(u){
  if(!u)return{ok:false,msg:"اكتب اسم المستخدم"};
  const s=String(u).trim().toLowerCase();
  if(s.length<3)return{ok:false,msg:"الاسم قصير جدًا (3 أحرف على الأقل)"};
  if(s.length>20)return{ok:false,msg:"الاسم طويل جدًا (20 حرف كحد أقصى)"};
  if(!/^[a-z][a-z0-9_]*$/.test(s))return{ok:false,msg:"لازم يبدأ بحرف إنجليزي، ويحتوي فقط a-z / 0-9 / _"};
  if(window.RESERVED_USERNAMES.includes(s))return{ok:false,msg:"هذا الاسم محجوز للنظام"};
  return{ok:true,value:s};
};

/* ============================================================
   Phone / Username Utilities
   ============================================================ */
window.normalizePhone = function(p){
  let s = String(p||"").replace(/[^0-9]/g,"");
  if(!s) return "";
  if(s.startsWith("218")){
    let rest = s.slice(3);
    if(rest.startsWith("0")) rest = rest.slice(1);
    return "218" + rest;
  }
  if(s.startsWith("0")) s = s.slice(1);
  return "218" + s;
};
window.validatePhone = function(p){
  if(!p) return {ok:false,msg:"اكتب رقم الواتساب"};
  const digits = String(p).replace(/[^0-9]/g,"");
  if(!digits) return {ok:false,msg:"اكتب رقم الواتساب"};
  const normalized = window.normalizePhone(digits);
  const rest = normalized.slice(3);
  if(rest.length < 8) return {ok:false,msg:"الرقم قصير جدًا"};
  if(rest.length > 12) return {ok:false,msg:"الرقم طويل جدًا"};
  return {ok:true, value:normalized};
};

window.normalizeUsernameInput = function(){
  const i=document.getElementById("myUsername");
  if(!i)return;
  i.value=i.value.toLowerCase().replace(/[^a-z0-9_]/g,"").slice(0,20);
};
window.normalizePhoneInput = function(){
  const i=document.getElementById("myPhone");
  if(!i)return;
  i.value=i.value.replace(/[^0-9]/g,"").slice(0,15);
};

/* ============================================================
   User Limits
   ============================================================ */
window.userLimitsCache = {};
window.DEFAULT_LIMIT = 3;
window.STORE_DEFAULT_LIMIT = 20;

window.getUserLimit = async function(uid){
  if(!uid)return window.DEFAULT_LIMIT;
  if(window.userLimitsCache[uid]!==undefined)return window.userLimitsCache[uid];
  try{
    const snap=await getDoc(doc(db,"userLimits",uid));
    if(snap.exists()){
      const l=snap.data().limit||window.DEFAULT_LIMIT;
      window.userLimitsCache[uid]=l;
      return l;
    }
  }catch(e){}
  window.userLimitsCache[uid]=window.DEFAULT_LIMIT;
  return window.DEFAULT_LIMIT;
};
window.getUserStoreLimit = async function(uid){
  if(!uid)return window.STORE_DEFAULT_LIMIT;
  try{
    const snap=await getDoc(doc(db,"userLimits",uid));
    if(snap.exists()){return snap.data().storeLimit||window.STORE_DEFAULT_LIMIT;}
  }catch(e){}
  return window.STORE_DEFAULT_LIMIT;
};
window.setUserLimit = async function(uid,limit,extra={}){
  try{
    const data={limit:Number(limit),email:extra.email||"",name:extra.name||"",username:extra.username||"",memberNo:extra.memberNo||null,updatedAt:Date.now()};
    if(extra.storeLimit!==undefined)data.storeLimit=Number(extra.storeLimit);
    await setDoc(doc(db,"userLimits",uid),data,{merge:true});
    window.userLimitsCache[uid]=Number(limit);
    return true;
  }catch(e){return false;}
};

/* ============================================================
   Global State
   ============================================================ */
window.isAdmin = false;
window.showOnlyMine = false;
window.showOnlyFavorites = false;
window.currentCategory = "الكل";
window.currentSubCategory = "الكل";
window.currentSort = "newest";
window.currentPriceMin = null;
window.currentPriceMax = null;
window.currentAdTypeFilter = "all";
window.currentCity = "الكل";
window.allPosts = [];
window.allStores = [];
window.currentStoreFilter = null;
window.pendingAction = null;
window.editingPostId = null;
window.myProfile = null;
window.myStore = null;
window.unsubProfile = null;
window.unsubStore = null;
window.profileCreateTried = false;
window.sellerPanelUid = null;
window.selectedStars = 0;
window.selectedImages = [];
window.storeLogoImage = null;
window.storeCoverImage = null;
window.pendingAutoUpgrade = null;
window.allReports = [];
window.reportsListenerStarted = false;
window.allLimits = [];
window.limitsListenerStarted = false;
window.storesListenerStarted = false;
window.unsubStores = null;
window.storesModTab = "all";
window.cart = {storeId:null, storeName:"", storePhone:"", items:[]};
window.myFollowing = [];
window.unsubFollowing = null;
window.allStoreRatings = {};
window.currentStoreSort = "newest";
window.currentStoreSearch = "";
window.currentStoreItems = [];
window.editStoreLogoImage = null;
window.editStoreCurrentId = null;
window._tempStoreData = null;
window.currentStoreHelpers = [];
window.compareList = [];
try{window.compareList = JSON.parse(localStorage.getItem('compareList')||'[]');}catch(e){window.compareList=[];}

window.saveCompare = function(){
  try{localStorage.setItem('compareList',JSON.stringify(window.compareList));}catch(e){}
};

window.isRestaurantStore = function(store){
  return !!(store && window.isRestaurantCategory(store.category));
};

/* ============================================================
   Toast
   ============================================================ */
window._toastTimer = null;
window.showToast = function(text,type="info",duration=2200){
  let t=document.getElementById("globalToast");
  if(!t){
    t=document.createElement("div");
    t.id="globalToast";
    t.className="toast";
    document.body.appendChild(t);
  }
  t.textContent=text;
  t.className="toast "+type;
  void t.offsetWidth;
  t.classList.add("show");
  if(window._toastTimer)clearTimeout(window._toastTimer);
  window._toastTimer=setTimeout(()=>{t.classList.remove("show");},duration);
};

/* ============================================================
   Floating Buttons
   ============================================================ */
window.showFloatingButtons = function(){
  const btn1 = document.getElementById('luckyWheelBtn');
  const btn2 = document.getElementById('aiChatBtn');
  if(btn1) btn1.style.display = 'flex';
  if(btn2) btn2.style.display = 'flex';
};
window.hideFloatingButtons = function(){
  const btn1 = document.getElementById('luckyWheelBtn');
  const btn2 = document.getElementById('aiChatBtn');
  if(btn1) btn1.style.display = 'none';
  if(btn2) btn2.style.display = 'none';
  const chatWin = document.getElementById('aiChatWindow');
  if(chatWin) chatWin.style.display = 'none';
};

/* ============================================================
   Lucide Icons
   ============================================================ */
window.refreshNavIcons = function(){
  if(window.lucide && typeof lucide.createIcons === 'function'){
    try{ lucide.createIcons(); }catch(e){ console.warn('Lucide error:', e); }
  }
};
window.refreshNavIcons();
setTimeout(window.refreshNavIcons, 300);
setTimeout(window.refreshNavIcons, 1500);

/* ============================================================
   Utilities
   ============================================================ */
window.escapeHtml = function(str){
  return String(str).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
};
window.formatPrice = function(n){
  if(n==null||n===""||isNaN(n))return"";
  return Number(n).toLocaleString('en-US');
};
window.buildEmptyState = function(icon, title, desc, btnLabel, btnOnclick, btnSecondary){
  var cls = btnSecondary ? 'esBtn esBtnSecondary' : 'esBtn';
  var btnHtml = btnLabel ? '<button class="' + cls + '" onclick="' + btnOnclick + '">' + btnLabel + '</button>' : '';
  return '<div class="emptyState">' +
    '<div class="esIcon">' + icon + '</div>' +
    '<div class="esTitle">' + title + '</div>' +
    '<div class="esDesc">' + desc + '</div>' +
    btnHtml +
  '</div>';
};
window.timeAgo = function(ts){
  if(!ts)return"";
  const d=Math.floor((Date.now()-ts)/1000);
  if(d<60)return"الآن";
  if(d<3600)return Math.floor(d/60)+" د";
  if(d<86400)return Math.floor(d/3600)+" س";
  return Math.floor(d/86400)+" يوم";
};

/* ============================================================
   Cart Storage
   ============================================================ */
window.loadCart = function(){
  try{
    const saved=localStorage.getItem('tasawuqCart');
    if(saved){
      const parsed=JSON.parse(saved);
      if(parsed && typeof parsed==="object" && Array.isArray(parsed.items)){
        window.cart=parsed;
      }
    }
  }catch(e){}
};
window.saveCart = function(){
  try{localStorage.setItem('tasawuqCart',JSON.stringify(window.cart));}catch(e){}
};
window.cartTotalCount = function(){
  return window.cart.items.reduce((s,i)=>s+(i.qty||1),0);
};
window.cartTotalPrice = function(){
  return window.cart.items.reduce((s,i)=>s+((i.price||0)*(i.qty||1)),0);
};
window.cartTotalItemsCount = function(){
  return window.cart.items.reduce((s,i)=>s+(i.qty||1),0);
};
window.loadCart();

/* ============================================================
   Dark Mode
   ============================================================ */
(function initDarkMode(){
  try{
    const saved=localStorage.getItem('theme');
    const prefersDark=window.matchMedia && window.matchMedia('(prefers-color-scheme:dark)').matches;
    const useDark=saved==='dark' || (saved===null && prefersDark);
    if(useDark)document.documentElement.classList.add('dark-mode');
    setTimeout(()=>{
      const icon=document.getElementById('darkModeIcon');
      if(icon){
        icon.setAttribute('data-lucide',useDark?'sun':'moon');
        if(window.lucide)lucide.createIcons();
      }
    },200);
  }catch(e){}
})();
window.toggleDarkMode = function(){
  const html=document.documentElement;
  const isDark=html.classList.toggle('dark-mode');
  try{localStorage.setItem('theme',isDark?'dark':'light');}catch(e){}
  const icon=document.getElementById('darkModeIcon');
  if(icon){icon.setAttribute('data-lucide',isDark?'sun':'moon');if(window.lucide)lucide.createIcons();}
  const metaTheme=document.getElementById('themeColorMeta');
  if(metaTheme)metaTheme.setAttribute('content',isDark?'#0c2942':'#38bdf8');
};

/* ============================================================
   Points System
   ============================================================ */
window.POINTS_TIERS = [
  { name: 'برونزي',  icon: '🥉', min: 0,    max: 499,   color: '#f59e0b', discount: 0 },
  { name: 'فضي',     icon: '🥈', min: 500,  max: 1999,  color: '#94a3b8', discount: 5 },
  { name: 'ذهبي',    icon: '🥇', min: 2000, max: 4999,  color: '#eab308', discount: 10 },
  { name: 'ماسي',    icon: '💎', min: 5000, max: 999999, color: '#6366f1', discount: 20 }
];

window.POINTS_REWARDS = [
  { id: 'featured_1',  icon: '⭐', category: 'featured', title: 'إعلان مميز — يوم واحد',  cost: 250,   desc: 'إعلانك في الأعلى لمدة 24 ساعة' },
  { id: 'featured_3',  icon: '⭐', category: 'featured', title: 'إعلان مميز — 3 أيام',    cost: 400,   desc: 'إعلانك في الأعلى 3 أيام كاملة' },
  { id: 'featured_7',  icon: '⭐', category: 'featured', title: 'إعلان مميز — 7 أيام',    cost: 500,   desc: 'إعلانك في الأعلى أسبوع كامل 🔥' },
  { id: 'featured_30', icon: '⭐', category: 'featured', title: 'إعلان مميز — 30 يوم',    cost: 1500,  desc: 'إعلانك في الأعلى شهر كامل — أفضل قيمة!' },
  { id: 'discount_50', icon: '🎟️', category: 'extra', title: 'خصم 50% على أي ترقية',     cost: 300,   desc: 'كود خصم لاستخدامه عند الترقية' },
  { id: 'extra_post',  icon: '💎', category: 'extra', title: 'إعلان إضافي (تجاوز الحد)',  cost: 250,   desc: 'انشر إعلان فوق الحد المسموح' },
  { id: 'custom_logo',   icon: '🎨', category: 'vip', title: 'شعار مخصص للمتجر',       cost: 3000,  desc: 'يصمم لك الأدمن شعار خاص لمتجرك' },
  { id: 'pin_post',      icon: '📌', category: 'vip', title: 'تثبيت إعلان أعلى قسم',    cost: 2000,  desc: 'إعلانك أول في القسم 3 أيام' },
  { id: 'home_banner',   icon: '🌟', category: 'vip', title: 'شريط إعلان في الرئيسية',  cost: 10000, desc: 'إعلانك في بانر الرئيسية أسبوع' },
  { id: 'premium_badge', icon: '🏅', category: 'vip', title: 'شارة "بائع مميز"',       cost: 8000,  desc: 'شارة ذهبية تظهر جنب اسمك شهر' }
];

window.myPoints = 0;
window.myTier = window.POINTS_TIERS[0];
window.myHistory = [];
window.unsubPoints = null;

window.openPoints = function(){
  if(!auth.currentUser){
    window.showToast('⚠️ سجّل دخولك لعرض نقاطك', 'warn');
    document.getElementById("authOverlay").classList.remove('hidden');
    return;
  }
  document.getElementById('pointsOverlay').classList.remove('hidden');
  document.getElementById("accountOverlay").classList.add('hidden');
  window.startPointsListener(auth.currentUser.uid);
  window.renderPoints();
};

window.startPointsListener = function(uid){
  if(window.unsubPoints){ window.unsubPoints(); window.unsubPoints = null; }
  window.unsubPoints = onSnapshot(doc(db, 'userPoints', uid), snap => {
    if(snap.exists()){
      const data = snap.data();
      window.myPoints = data.points || 0;
      window.myHistory = Array.isArray(data.history) ? data.history : [];
    } else {
      window.myPoints = 0;
      window.myHistory = [];
    }
    window.updateTier();
    window.renderPoints();
  }, err => {
    console.warn('خطأ في تحميل النقاط:', err);
    window.myPoints = 0;
    window.myHistory = [];
    window.updateTier();
    window.renderPoints();
  });
};

window.updateTier = function(){
  for(const t of window.POINTS_TIERS){
    if(window.myPoints >= t.min && window.myPoints <= t.max){
      window.myTier = t;
      return;
    }
  }
  window.myTier = window.POINTS_TIERS[0];
};

window.renderPoints = function(){
  const balEl = document.getElementById('pointsBalance');
  if(balEl) balEl.textContent = window.myPoints.toLocaleString();
  const tierEl = document.getElementById('pointsTier');
  if(tierEl) tierEl.textContent = `${window.myTier.icon} ${window.myTier.name}`;
  const idx = window.POINTS_TIERS.indexOf(window.myTier);
  const next = window.POINTS_TIERS[idx + 1];
  const progressText = document.getElementById('pointsProgressText');
  const progressBar = document.getElementById('pointsProgressBar');
  if(next){
    const needed = next.min - window.myTier.min;
    const current = window.myPoints - window.myTier.min;
    const percent = Math.min(100, (current / needed) * 100);
    if(progressText) progressText.textContent = `${window.myPoints.toLocaleString()} / ${next.min.toLocaleString()} لـ ${next.icon} ${next.name}`;
    if(progressBar) progressBar.style.width = percent + '%';
  } else {
    if(progressText) progressText.textContent = '🎉 وصلت لأعلى مستوى!';
    if(progressBar) progressBar.style.width = '100%';
  }
  window.updatePointsBadge();
  window.renderRewards();
  window.renderHistory();
};

window.updatePointsBadge = function(){
  const badge = document.getElementById('pointsBadge');
  if(!badge) return;
  if(window.myPoints > 0){
    badge.textContent = window.myPoints >= 1000 ? (Math.floor(window.myPoints/1000) + 'K') : window.myPoints;
    badge.style.display = 'block';
  } else {
    badge.style.display = 'none';
  }
};

window.renderRewards = function(){
  const list = document.getElementById('rewardsList');
  if(!list) return;
  const categories = {
    featured: { title: '⭐ التمييز', desc: 'خلّي إعلانك في الأعلى' },
    extra: { title: '🎁 مكافآت إضافية', desc: 'خصومات وعروض' },
    vip: { title: '🏆 مكافآت VIP', desc: 'ميزات خاصة للمميزين' }
  };
  let html = '';
  Object.keys(categories).forEach(cat => {
    const rewards = window.POINTS_REWARDS.filter(r => r.category === cat);
    if(rewards.length === 0) return;
    html += `
      <div style="margin-bottom:18px">
        <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:10px">
          <div style="font-weight:800;font-size:14px">${categories[cat].title}</div>
          <div style="font-size:11px;color:var(--muted)">— ${categories[cat].desc}</div>
        </div>
        ${rewards.map(r => {
          const canAfford = window.myPoints >= r.cost;
          const discountedCost = Math.round(r.cost * (100 - window.myTier.discount) / 100);
          const hasDiscount = window.myTier.discount > 0 && discountedCost < r.cost;
          return `
            <div style="background:var(--card);border:2px solid ${canAfford ? '#16a34a' : 'var(--border)'};border-radius:12px;padding:12px;margin-bottom:8px;display:flex;gap:10px;align-items:center">
              <div style="font-size:28px;flex:0 0 auto">${r.icon}</div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:800;font-size:13.5px;margin-bottom:2px">${r.title}</div>
                <div style="font-size:11px;color:var(--muted);margin-bottom:5px;line-height:1.4">${r.desc}</div>
                <div style="font-size:12.5px;font-weight:800;color:#f59e0b">
                  ${hasDiscount ? `<span style="text-decoration:line-through;color:var(--muted);font-weight:600;margin-left:6px">${r.cost}</span>${discountedCost}` : r.cost} نقطة
                  ${hasDiscount ? `<span style="background:#dcfce7;color:#166534;font-size:10px;padding:2px 6px;border-radius:5px;margin-right:6px">-${window.myTier.discount}%</span>` : ''}
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
};

window.renderHistory = function(){
  const list = document.getElementById('pointsHistoryList');
  if(!list) return;
  if(window.myHistory.length === 0){
    list.innerHTML = '<div style="text-align:center;padding:30px 20px;color:var(--muted);font-size:13px">📭 لا يوجد سجل بعد<br><small>ابدأ بفتح عجلة الحظ أو انشر إعلان!</small></div>';
    return;
  }
  list.innerHTML = window.myHistory.slice(0, 30).map(h => {
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
};

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

window.addPoints = async function(uid, amount, title, activity){
  if(!uid || !amount) return;
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
      window.showToast(`🏆 ${amount > 0 ? '+' : ''}${amount} نقطة — ${title}`, 'success', 2500);
    }
  } catch(e){
    console.warn('خطأ في إضافة النقاط:', e.message);
  }
};

window.redeemReward = async function(rewardId){
  if(!auth.currentUser){
    window.showToast('⚠️ سجّل دخولك أولاً', 'warn');
    return;
  }
  const reward = window.POINTS_REWARDS.find(r => r.id === rewardId);
  if(!reward) return;
  const discountedCost = Math.round(reward.cost * (100 - window.myTier.discount) / 100);
  if(window.myPoints < discountedCost){
    window.showToast(`⚠️ تحتاج ${discountedCost - window.myPoints} نقطة إضافية`, 'warn');
    return;
  }
  if(!confirm(`استبدال ${discountedCost} نقطة بـ "${reward.title}"؟`)) return;
  try{
    await window.addPoints(auth.currentUser.uid, -discountedCost, `استبدال: ${reward.title}`, 'redeem');
    await addDoc(collection(db, 'userRedemptions'), {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email || '',
      rewardId: reward.id,
      rewardTitle: reward.title,
      cost: discountedCost,
      status: 'pending',
      createdAt: Date.now()
    });
    window.showToast(`✅ تم! تواصل مع الإدارة لاستلام "${reward.title}"`, 'success', 4000);
    const adminMsg = `🏆 طلب استبدال نقاط\n\n👤 المستخدم: ${auth.currentUser.email}\n🎁 المكافأة: ${reward.title}\n💰 التكلفة: ${discountedCost} نقطة`;
    window.open(`https://wa.me/${window.ADMIN_WHATSAPP}?text=${encodeURIComponent(adminMsg)}`, '_blank');
  } catch(e){
    window.showToast('❌ خطأ: ' + e.message, 'error');
  }
};

window.giveWelcomePoints = async function(uid){
  try{
    const userRef = doc(db, 'userPoints', uid);
    const snap = await getDoc(userRef);
    if(!snap.exists()){
      await setDoc(userRef, {
        points: 20,
        history: [{ value: 20, title: '🎉 مكافأة الترحيب', activity: 'welcome', timestamp: Date.now() }],
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
  }catch(e){}
};

window.syncPendingPoints = async function(){
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
    window.showToast(`✅ تم استرجاع ${myPending.length} مكافأة معلقة`, 'success', 3000);
  }catch(e){
    console.warn('فشلت مزامنة النقاط المعلقة:', e);
  }
};

/* ============================================================
   Wheel System
   ============================================================ */
window.WHEEL_REWARDS = [
  { type: 'points', value: 5,     icon: '💎', title: '5 نقاط',       desc: 'أضفنا 5 نقاط لرصيدك',      weight: 25 },
  { type: 'points', value: 200,   icon: '💎', title: '200 نقطة',     desc: 'جاكبوت! ربحت 200 نقطة!',    weight: 2 },
  { type: 'points', value: 10,    icon: '💰', title: '10 نقاط',      desc: 'أضفنا 10 نقاط لرصيدك',      weight: 20 },
  { type: 'featured', value: 1,   icon: '⭐', title: 'إعلان مميز',   desc: 'إعلان مميز لمدة يوم مجاناً!',  weight: 3 },
  { type: 'points', value: 15,    icon: '💰', title: '15 نقطة',      desc: 'أضفنا 15 نقطة لرصيدك',      weight: 15 },
  { type: 'points', value: 50,    icon: '🥈', title: '50 نقطة',      desc: 'مكافأة نادرة! 50 نقطة',      weight: 12 },
  { type: 'points', value: 25,    icon: '🥉', title: '25 نقطة',      desc: 'أضفنا 25 نقطة لرصيدك',      weight: 15 },
  { type: 'points', value: 100,   icon: '🥇', title: '100 نقطة',     desc: 'مكافأة أسطورية! 100 نقطة',  weight: 8 }
];

window.WHEEL_COOLDOWN_MS = 24 * 60 * 60 * 1000;
window.WHEEL_STORAGE_KEY = 'luckyWheelLast';
window.wheelSpinning = false;
window.wheelRotation = 0;

window.getWheelStatus = function(){
  try{
    const data = JSON.parse(localStorage.getItem(window.WHEEL_STORAGE_KEY) || 'null');
    if(!data || !data.timestamp) return { canSpin: true, lastSpin: 0 };
    const elapsed = Date.now() - data.timestamp;
    return {
      canSpin: elapsed >= window.WHEEL_COOLDOWN_MS,
      lastSpin: data.timestamp,
      remaining: Math.max(0, window.WHEEL_COOLDOWN_MS - elapsed)
    };
  }catch(e){ return { canSpin: true, lastSpin: 0 }; }
};

window.saveWheelSpin = function(){
  try{ localStorage.setItem(window.WHEEL_STORAGE_KEY, JSON.stringify({ timestamp: Date.now() })); }catch(e){}
};

window.pickWheelReward = function(){
  const total = window.WHEEL_REWARDS.reduce((s, r) => s + r.weight, 0);
  let rand = Math.random() * total;
  for(let i = 0; i < window.WHEEL_REWARDS.length; i++){
    rand -= window.WHEEL_REWARDS[i].weight;
    if(rand <= 0) return { reward: window.WHEEL_REWARDS[i], index: i };
  }
  return { reward: window.WHEEL_REWARDS[0], index: 0 };
};

window.openLuckyWheel = function(){
  const overlay = document.getElementById('luckyWheelOverlay');
  const activeState = document.getElementById('wheelActiveState');
  const resultState = document.getElementById('wheelResultState');
  const cooldownState = document.getElementById('wheelCooldownState');
  activeState.style.display = 'none';
  resultState.style.display = 'none';
  cooldownState.style.display = 'none';
  const status = window.getWheelStatus();
  if(status.canSpin){
    activeState.style.display = 'block';
    const disc = document.getElementById('wheelDisc');
    disc.style.transition = 'none';
    disc.style.transform = 'rotate(0deg)';
    window.wheelRotation = 0;
    const btn = document.getElementById('wheelCenterBtn');
    btn.disabled = false;
    btn.textContent = '🎯';
  } else {
    cooldownState.style.display = 'block';
    window.startWheelCooldown();
  }
  overlay.classList.remove('hidden');
};

window.closeLuckyWheel = function(){
  document.getElementById('luckyWheelOverlay').classList.add('hidden');
  if(window._wheelCooldownInterval){
    clearInterval(window._wheelCooldownInterval);
    window._wheelCooldownInterval = null;
  }
};

window.startWheelCooldown = function(){
  const el = document.getElementById('wheelCooldownText');
  if(!el) return;
  function update(){
    const status = window.getWheelStatus();
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
};

window.spinLuckyWheel = async function(){
  if(window.wheelSpinning) return;
  const status = window.getWheelStatus();
  if(!status.canSpin){
    window.showToast('⏰ العجلة مغلقة، تعال بعد', 'warn');
    return;
  }
  window.wheelSpinning = true;
  const btn = document.getElementById('wheelCenterBtn');
  const disc = document.getElementById('wheelDisc');
  btn.disabled = true;
  btn.textContent = '...';
  const { reward, index } = window.pickWheelReward();
  const targetAngle = 360 - (index * 45 + 22.5);
  const fullSpins = 360 * 5;
  const totalRotation = window.wheelRotation + fullSpins + targetAngle;
  disc.style.transition = 'transform 4s cubic-bezier(.17,.67,.2,1)';
  disc.style.transform = `rotate(${totalRotation}deg)`;
  window.wheelRotation = totalRotation;
  await new Promise(r => setTimeout(r, 4200));
  window.saveWheelSpin();
  if(auth.currentUser){
    try{ await window.giveWheelReward(auth.currentUser.uid, reward); }catch(e){ console.warn(e); }
  }
  document.getElementById('wheelActiveState').style.display = 'none';
  document.getElementById('wheelResultState').style.display = 'block';
  document.getElementById('wheelRewardIcon').textContent = reward.icon;
  document.getElementById('wheelRewardText').textContent = reward.title;
  document.getElementById('wheelRewardDesc').textContent = reward.desc;
  window.showToast(`🎉 ربحت: ${reward.title}!`, 'success', 3500);
  window.wheelSpinning = false;
  window.updateWheelBadge();
};

window.giveWheelReward = async function(uid, reward){
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

    window.myPoints = newPoints;
    window.myHistory = history;
    const balEl = document.getElementById('pointsBalance');
    if(balEl) balEl.textContent = newPoints.toLocaleString();
    window.updatePointsBadge();
    window.updateTier();
    window.renderPoints();
  }catch(e){
    console.error('❌ فشل حفظ النقاط في Firestore:', e);
    window.showToast('⚠️ تم الفوز لكن تعذر حفظ النقاط — تحقق من اتصالك', 'warn', 4000);
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
};

window.updateWheelBadge = function(){
  const badge = document.getElementById('luckyWheelBadge');
  const btn = document.getElementById('luckyWheelBtn');
  if(!badge || !btn) return;
  const status = window.getWheelStatus();
  if(status.canSpin){
    btn.style.display = 'flex';
    badge.style.display = 'flex';
  } else {
    btn.style.display = 'none';
    badge.style.display = 'none';
  }
};
setInterval(window.updateWheelBadge, 60000);
setTimeout(window.updateWheelBadge, 2000);

/* ============================================================
   AI Chat
   ============================================================ */
const ai = getAI(app, { backend: new GoogleAIBackend() });

const AI_MODELS_LIST = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash"
];
let _workingModel = null;
try{ _workingModel = localStorage.getItem('aiWorkingModel') || null; }catch(e){}

let aiModel = null;
function createAIModel(modelName){
  return getGenerativeModel(ai, { model: modelName });
}

if(_workingModel){
  try{ aiModel = createAIModel(_workingModel); console.log('✅ موديل محفوظ:', _workingModel); }catch(e){ aiModel = null; }
}

async function generateAIContent(prompt){
  if(aiModel){
    try{
      const result = await aiModel.generateContent(prompt);
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

window.toggleAIChat = function(){
  const win = document.getElementById('aiChatWindow');
  const isOpen = win.style.display === 'flex';
  win.style.display = isOpen ? 'none' : 'flex';
  if(!isOpen) setTimeout(()=>document.getElementById('aiChatInput').focus(),100);
};

window.aiQuickAsk = function(question){
  document.getElementById('aiChatInput').value = question;
  window.sendAIChat();
};

window.sendAIChat = async function(){
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
    box.innerHTML += `<div style="text-align:left;"><span style="background:#8b5cf6;color:#fff;padding:10px 14px;border-radius:14px 14px 14px 0;display:inline-block;max-width:88%;font-size:13.5px;line-height:1.7;">${window.escapeHtml(msg)}</span></div>`;
    box.innerHTML += `<div style="text-align:right;"><span style="background:#fef3c7;color:#92400e;padding:12px 14px;border-radius:14px 14px 0 14px;display:inline-block;max-width:88%;font-size:13.5px;line-height:1.7;">🌸 آسف، أنا مساعد التسوق فقط.<br><br>اسألني عن:<br>• كيف أنشر إعلان<br>• كيف أفتح متجر<br>• 🎡 عجلة الحظ<br>• 🏆 نظام النقاط</span></div>`;
    box.scrollTop = box.scrollHeight;
    input.value='';
    return;
  }
  box.innerHTML += `<div style="text-align:left;"><span style="background:#8b5cf6;color:#fff;padding:10px 14px;border-radius:14px 14px 14px 0;display:inline-block;max-width:88%;font-size:13.5px;line-height:1.7;">${window.escapeHtml(msg)}</span></div>`;
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
    box.innerHTML += `<div style="text-align:right;"><span style="background:#e6f6fe;color:#0284c7;padding:12px 14px;border-radius:14px 14px 0 14px;display:inline-block;max-width:88%;font-size:13.5px;line-height:1.8;">${window.escapeHtml(response).replace(/\n/g,'<br>')}</span></div>`;
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

/* ============================================================
   ✅ Firebase Globals (مهمة جداً لـ parts 2 & 3)
   ============================================================ */
window.collection = collection;
window.doc = doc;
window.addDoc = addDoc;
window.setDoc = setDoc;
window.getDoc = getDoc;
window.getDocs = getDocs;
window.query = query;
window.where = where;
window.updateDoc = updateDoc;
window.onSnapshot = onSnapshot;
window.deleteDoc = deleteDoc;
window.increment = increment;
window.runTransaction = runTransaction;
window.onAuthStateChanged = onAuthStateChanged;
window.signOut = signOut;
window.GoogleAuthProvider = GoogleAuthProvider;
window.signInWithPopup = signInWithPopup;

/* ✅ التأكد من التحميل */
console.log('✅ js-part-1 loaded successfully');
console.log('✅ Firebase globals exported to window');
/* ============================================================
   تسوق الآن — الجزء الثاني: Posts + Cart + Search + Filters + Admin
   ============================================================ */

/* ============================================================
   DOM Refs (مشتركة مع part 3)
   ============================================================ */
window.home = document.getElementById("home");
window.form = document.getElementById("form");
window.postsBox = document.getElementById("posts");
window.homeTitle = document.getElementById("homeTitle");
window.categoriesScreen = document.getElementById("categoriesScreen");
window.mainTopbar = document.getElementById("mainTopbar");
window.authOverlay = document.getElementById("authOverlay");
window.accountOverlay = document.getElementById("accountOverlay");
window.reportsOverlay = document.getElementById("reportsOverlay");
window.reportsBtn = document.getElementById("reportsBtn");
window.moderationBtn = document.getElementById("moderationBtn");
window.moderationOverlay = document.getElementById("moderationOverlay");
window.limitsOverlay = document.getElementById("limitsOverlay");
window.sellerOverlay = document.getElementById("sellerOverlay");
window.postOverlay = document.getElementById("postOverlay");
window.warnOverlay = document.getElementById("warnOverlay");
window.upgradeOverlay = document.getElementById("upgradeOverlay");
window.adminChip = document.getElementById("adminChip");
window.navHome = document.getElementById("navHome");
window.navMine = document.getElementById("navMine");
window.navFav = document.getElementById("navFav");
window.navAccountLabel = document.getElementById("navAccountLabel");
window.subCatsRow = document.getElementById("subCatsRow");
window.postTypeOverlay = document.getElementById("postTypeOverlay");
window.openStoreOverlay = document.getElementById("openStoreOverlay");
window.storesModerationOverlay = document.getElementById("storesModerationOverlay");
window.expiredOverlay = document.getElementById("expiredOverlay");
window.cartOverlay = document.getElementById("cartOverlay");
window.termsOverlay = document.getElementById("termsOverlay");
window.privacyOverlay = document.getElementById("privacyOverlay");
window.editStoreOverlay = document.getElementById("editStoreOverlay");
window.feedbackOverlay = document.getElementById("feedbackOverlay");

/* ============================================================
   Post Utilities
   ============================================================ */
window.isPostFeatured = function(p){return !!(p&&p.featured&&p.featuredUntil&&p.featuredUntil>Date.now());};
window.featuredDaysLeft = function(p){if(!window.isPostFeatured(p))return 0;return Math.ceil((p.featuredUntil-Date.now())/(24*60*60*1000));};
window.getStatus = function(p){return p.status||"approved";};
window.getExpiresAt = function(p){if(p && p.expiresAt) return p.expiresAt;if(p && p.createdAt) return p.createdAt + window.POST_DURATION_MS;return null;};
window.isExpired = function(p){const e=window.getExpiresAt(p);if(!e)return false;return e < Date.now();};
window.daysLeft = function(p){const e=window.getExpiresAt(p);if(!e)return null;return Math.ceil((e-Date.now())/(24*60*60*1000));};
window.expiredGracePassed = function(p){const e=window.getExpiresAt(p);if(!e)return false;const graceEnd=e+window.EXPIRED_GRACE_DAYS*24*60*60*1000;return Date.now()>graceEnd;};
window.isWanted = function(p){return p && p.adType==="wanted";};

window.sortPosts = function(arr){
  const featuredFirst=(a,b)=>{const af=window.isPostFeatured(a)?1:0;const bf=window.isPostFeatured(b)?1:0;return bf-af;};
  return arr.slice().sort((a,b)=>{
    const ff=featuredFirst(a,b);
    if(ff!==0)return ff;
    switch(window.currentSort){
      case "cheapest":return (Number(a.price)||0)-(Number(b.price)||0);
      case "expensive":return (Number(b.price)||0)-(Number(a.price)||0);
      case "views":return (b.views||0)-(a.views||0);
      default:return (b.createdAt||0)-(a.createdAt||0);
    }
  });
};

/* ============================================================
   Images / Discount
   ============================================================ */
window.getImages = function(p){return (p.images&&p.images.length)?p.images:(p.imageUrl?[p.imageUrl]:[]);};
window.carouselHtml = function(images,lightbox){
  if(!images.length)return `<div class="carousel"><div class="slide"><span style="font-size:34px;opacity:.5">🖼️</span></div></div>`;
  return `<div class="carousel">${images.map(u=>`<div class="slide"${lightbox?` onclick="event.stopPropagation();openLightbox('${window.escapeHtml(u)}')" style="cursor:zoom-in"`:""}><img src="${window.escapeHtml(u)}" loading="lazy" onerror="this.parentElement.innerHTML='<span style=font-size:34px;opacity:.5>🖼️</span>'"></div>`).join("")}</div>`;
};
window.dotsHtml = function(images){if(images.length<=1)return"";return `<div class="dots">${images.map((_,i)=>`<span class="dot${i===0?" active":""}"></span>`).join("")}</div>`;};
window.getDiscountPercent = function(post){
  if(!post || !post.originalPrice || !post.price) return 0;
  const orig=Number(post.originalPrice);
  const curr=Number(post.price);
  if(!orig || orig<=curr) return 0;
  return Math.round(((orig-curr)/orig)*100);
};

document.addEventListener("scroll",e=>{
  const el=e.target;
  if(!el||!el.classList||!el.classList.contains("carousel"))return;
  const d=el.parentElement&&el.parentElement.querySelector(".dots");
  if(!d)return;
  const i=Math.round(el.scrollLeft/(el.clientWidth||1));
  Array.from(d.children).forEach((x,idx)=>x.classList.toggle("active",idx===i));
},true);

/* ============================================================
   Favorites
   ============================================================ */
window.getFavorites = function(){try{return JSON.parse(localStorage.getItem('favorites')||'[]');}catch(e){return[];}};
window.saveFavorites = function(arr){try{localStorage.setItem('favorites',JSON.stringify(arr));}catch(e){}};
window.isFavorite = function(id){return window.getFavorites().includes(id);};
window.toggleFavorite = function(id,event){
  if(event)event.stopPropagation();
  let favs=window.getFavorites();
  if(favs.includes(id)){favs=favs.filter(x=>x!==id);window.incrementFavoritesCount(id,-1);}
  else{favs.push(id);window.incrementFavoritesCount(id,1);}
  window.saveFavorites(favs);
  window.renderPosts();
};

/* ============================================================
   Views
   ============================================================ */
window.hasViewedOnDevice = function(id){try{const v=JSON.parse(localStorage.getItem('viewedPosts')||'[]');return v.includes(id);}catch(e){return false;}};
window.markViewedOnDevice = function(id){try{let v=JSON.parse(localStorage.getItem('viewedPosts')||'[]');if(!v.includes(id)){v.push(id);if(v.length>300)v=v.slice(-300);localStorage.setItem('viewedPosts',JSON.stringify(v));}}catch(e){}};
window.incrementViews = async function(id){try{if(window.hasViewedOnDevice(id))return;window.markViewedOnDevice(id);await updateDoc(doc(db,"posts",id),{views:increment(1)});}catch(e){}};
window.incrementWhatsappClick = async function(id,type){
  if(!id)return;
  type=type||'post';
  try{
    const coll=(type==='store')?'stores':'posts';
    await updateDoc(doc(db,coll,id),{whatsappClicks:increment(1)});
  }catch(e){}
};
window.incrementFavoritesCount = async function(postId,delta){if(!postId)return;try{await updateDoc(doc(db,"posts",postId),{favoritesCount:increment(delta)});}catch(e){}};

/* ============================================================
   Recent Views
   ============================================================ */
window.getRecentViews = function(){try{return JSON.parse(localStorage.getItem('recentViews')||'[]');}catch(e){return[];}};
window.addRecentView = function(id){try{let v=window.getRecentViews().filter(x=>x!==id);v.unshift(id);if(v.length>10)v=v.slice(0,10);localStorage.setItem('recentViews',JSON.stringify(v));}catch(e){}};
window.renderRecentlyViewed = function(){
  const section=document.getElementById("recentSection");
  const box=document.getElementById("recentScroll");
  if(!section||!box)return;
  const ids=window.getRecentViews();
  const items=ids.map(id=>window.allPosts.find(p=>p.id===id)).filter(p=>p && window.getStatus(p)==="approved" && !window.isExpired(p) && !p.sold);
  if(items.length===0){section.classList.remove("hasItems");box.innerHTML="";return;}
  section.classList.add("hasItems");
  box.innerHTML=items.map(p=>{
    const imgs=window.getImages(p);const th=imgs[0]||"";
    const priceTxt=p.priceType==="contact"?"📞 تواصل":(p.price!=null?window.formatPrice(p.price)+" د.ل":"");
    return `<div class="recentItem" onclick="openPost('${p.id}')"><div style="width:100%;aspect-ratio:1/1;background:var(--teal-light);overflow:hidden">${th?`<img src="${window.escapeHtml(th)}" class="recentThumb">`:`<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:24px;opacity:.5">🖼️</div>`}</div><div class="recentInfo"><div class="recentName">${window.escapeHtml(p.title||"بدون عنوان")}</div><div class="recentPrice">${priceTxt}</div></div></div>`;
  }).join("");
};

/* ============================================================
   Compare
   ============================================================ */
window.toggleCompare = function(postId,event){
  if(event){event.stopPropagation();event.preventDefault();}
  const idx=window.compareList.indexOf(postId);
  if(idx>=0){window.compareList.splice(idx,1);}
  else{
    if(window.compareList.length>=3){window.showToast("⚠️ الحد الأقصى 3 إعلانات","warn");return;}
    window.compareList.push(postId);
  }
  window.saveCompare();window.updateCompareUI();window.renderPosts();
};
window.updateCompareUI = function(){
  const fab=document.getElementById("compareFAB");
  if(!fab)return;
  if(window.compareList.length>0){
    fab.classList.remove("fabOff");
    fab.innerHTML=`⚖️ قارن (${window.compareList.length})`;
  }else{fab.classList.add("fabOff");}
};
window.openCompare = function(){
  const items=window.compareList.map(id=>window.allPosts.find(p=>p.id===id)).filter(Boolean);
  if(items.length<2){window.showToast("⚠️ اختر إعلانين على الأقل","warn");return;}
  const box=document.getElementById("compareContent");
  box.innerHTML=`<div style="display:grid;grid-template-columns:repeat(${items.length},1fr);gap:8px">${items.map(p=>{
    const imgs=window.getImages(p);const th=imgs[0]||"";
    const priceTxt=p.priceType==="contact"?"📞 تواصل":(p.price!=null?window.formatPrice(p.price)+" د.ل":"—");
    return `<div class="compareCol">
      ${th?`<img src="${window.escapeHtml(th)}">`:`<div style="aspect-ratio:1/1;background:var(--teal-light);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:30px;opacity:.5;margin-bottom:8px">🖼️</div>`}
      <h4>${window.escapeHtml(p.title||"بدون عنوان")}</h4>
      <div class="comparePrice">${priceTxt}</div>
      <div class="compareRow"><b>القسم:</b> ${window.escapeHtml(p.category||"—")}</div>
      <div class="compareRow"><b>المدينة:</b> ${window.escapeHtml(p.city||"—")}</div>
      ${p.brand?`<div class="compareRow"><b>الماركة:</b> ${window.escapeHtml(p.brand)}</div>`:""}
      <div class="compareRow"><b>المشاهدات:</b> ${p.views||0}</div>
      <div class="compareRow"><b>التاريخ:</b> ${window.timeAgo(p.createdAt)}</div>
      <button class="btnGhost" style="margin-top:8px;font-size:12px;padding:8px" onclick="closeOverlay();setTimeout(()=>openPost('${p.id}'),200)">👁️ عرض</button>
      <button class="btnGhost" style="background:#fdeceb;color:var(--danger);font-size:12px;padding:8px" onclick="toggleCompare('${p.id}');closeOverlay();setTimeout(openCompare,200)">✕ إزالة</button>
    </div>`;
  }).join("")}</div>`;
  document.getElementById("compareOverlay").classList.remove("hidden");
};
window.clearCompare = function(){
  window.compareList=[];
  window.saveCompare();
  window.updateCompareUI();
  window.renderPosts();
  window.showToast("✅ تم مسح المقارنة","success");
};

/* ============================================================
   Search
   ============================================================ */
const searchInputEl=document.getElementById("searchInput");
const clearSearchBtnEl=document.getElementById("clearSearchBtn");
try{const saved=localStorage.getItem('lastSearch');if(saved && searchInputEl){searchInputEl.value=saved;if(clearSearchBtnEl)clearSearchBtnEl.style.display='flex';}}catch(e){}
let _searchDebounceTimer=null;
if(searchInputEl){
  searchInputEl.addEventListener('input',function(){
    const v=this.value||"";
    try{localStorage.setItem('lastSearch',v);}catch(e){}
    if(clearSearchBtnEl)clearSearchBtnEl.style.display=v.length>0?'flex':'none';
    if(typeof window.showSearchDropdown==='function')window.showSearchDropdown();
    if(_searchDebounceTimer)clearTimeout(_searchDebounceTimer);
    _searchDebounceTimer=setTimeout(()=>{if(typeof window.renderPosts==='function')window.renderPosts();},300);
  });
  searchInputEl.addEventListener('focus',function(){if(typeof window.showSearchDropdown==='function')window.showSearchDropdown();});
}
if(clearSearchBtnEl){clearSearchBtnEl.addEventListener('click',function(e){e.preventDefault();if(searchInputEl)searchInputEl.value="";try{localStorage.removeItem('lastSearch');}catch(e){}this.style.display='none';if(typeof window.hideSearchDropdown==='function')window.hideSearchDropdown();if(typeof window.renderPosts==='function')window.renderPosts();});}

window.getSearchHistory = function(){try{return JSON.parse(localStorage.getItem('searchHistory')||'[]');}catch(e){return[];}};
window.addToSearchHistory = function(term){if(!term||term.trim().length<2)return;const t=term.trim();let h=window.getSearchHistory().filter(x=>x!==t);h.unshift(t);if(h.length>10)h=h.slice(0,10);try{localStorage.setItem('searchHistory',JSON.stringify(h));}catch(e){}};
window.removeFromHistory = function(term,event){if(event)event.stopPropagation();let h=window.getSearchHistory().filter(x=>x!==term);try{localStorage.setItem('searchHistory',JSON.stringify(h));}catch(e){}window.showSearchDropdown();};
window.clearSearchHistory = function(event){if(event)event.stopPropagation();if(!confirm("مسح كل سجل البحث؟"))return;try{localStorage.removeItem('searchHistory');}catch(e){}window.showSearchDropdown();};

window.getSuggestions = function(term){
  const t=(term||"").trim().toLowerCase();
  const seen=new Set();const results=[];
  window.allPosts.forEach(p=>{
    if(window.getStatus(p)!=="approved")return;
    if(window.isExpired(p))return;
    if(p.sold)return;
    const title=(p.title||"").trim();
    if(!title)return;
    const lower=title.toLowerCase();
    if(t && !lower.includes(t))return;
    const key=lower.slice(0,30);
    if(seen.has(key))return;
    seen.add(key);
    results.push({title,price:p.price,priceType:p.priceType,thumb:(p.images&&p.images[0])||p.imageUrl||""});
  });
  if(t){
    const allBrands=[...window.CAR_BRANDS,...window.MOTORCYCLE_BRANDS,...window.PHONE_BRANDS,...window.COMPUTER_BRANDS,...window.ANIMAL_TYPES,...window.PERFUME_TYPES];
    allBrands.forEach(b=>{if(b.toLowerCase().includes(t) && !seen.has(b.toLowerCase())){seen.add(b.toLowerCase());results.push({title:b,price:null,thumb:"",isBrand:true});}});
  }
  return results.slice(0,6);
};

window.showSearchDropdown = function(){
  const box=document.getElementById("searchDropdown"),input=document.getElementById("searchInput");
  if(!box||!input)return;
  const term=(input.value||"").trim();
  const history=window.getSearchHistory();
  const suggestions=window.getSuggestions(term);
  let html="";
  if(!term && history.length>0){
    html+=`<div class="sdSection">🕐 آخر ما بحثت عنه</div>`;
    html+=history.map(h=>{
      const safeH=window.escapeHtml(h).replace(/'/g,"&#39;");
      return `<div class="sdItem" onclick="pickSearch('${safeH}')"><span class="sdIcon">🕐</span><span class="sdText">${window.escapeHtml(h)}</span><button class="sdRemove" onclick="removeFromHistory('${safeH}',event)">✕</button></div>`;
    }).join("");
    html+=`<div class="sdClearAll" onclick="clearSearchHistory(event)">🗑️ مسح كل السجل</div>`;
  }
  if(suggestions.length>0){
    const label=term?"💡 مقترحات":"🔥 إعلانات مقترحة";
    html+=`<div class="sdSection">${label}</div>`;
    html+=suggestions.map(s=>{
      const safeTitle=window.escapeHtml(s.title).replace(/'/g,"&#39;");
      const priceTxt=s.priceType==="contact"?"📞 تواصل":(s.price!=null?window.formatPrice(s.price)+" د.ل":"");
      return `<div class="sdItem" onclick="pickSearch('${safeTitle}')"><span class="sdIcon">${s.isBrand?"🏷️":(s.thumb?"📦":"🔎")}</span><span class="sdText">${window.escapeHtml(s.title)}</span>${priceTxt?`<span style="font-size:11.5px;color:var(--teal-dark);font-weight:700">${priceTxt}</span>`:""}</div>`;
    }).join("");
  }
  if(!html)html=`<div class="sdSection" style="text-align:center;padding:20px;color:var(--muted)">اكتب للبحث...</div>`;
  box.innerHTML=html;
  box.classList.remove("hidden");
};
window.hideSearchDropdown = function(){const box=document.getElementById("searchDropdown");if(box)box.classList.add("hidden");};
window.pickSearch = function(term){
  const input=document.getElementById("searchInput");
  if(!input)return;
  input.value=term;
  window.addToSearchHistory(term);
  try{localStorage.setItem('lastSearch',term);}catch(e){}
  window.updateClearBtn();
  window.hideSearchDropdown();
  input.blur();
  window.renderPosts();
};
window.updateClearBtn = function(){
  const i=document.getElementById("searchInput");
  const b=document.getElementById("clearSearchBtn");
  if(!i||!b)return;
  b.style.display=(i.value&&i.value.length>0)?"flex":"none";
};
window.clearSearch = function(){
  const i=document.getElementById("searchInput");
  if(i){i.value="";i.focus();}
  try{localStorage.removeItem('lastSearch');}catch(e){}
  window.updateClearBtn();
  window.hideSearchDropdown();
  window.renderPosts();
};
document.addEventListener('click',(e)=>{const box=document.querySelector('.searchBox');if(box && !box.contains(e.target)){window.hideSearchDropdown();}});

/* ============================================================
   Filters
   ============================================================ */
window.setSort = function(type){
  window.currentSort=type;
  document.querySelectorAll(".filterBar .filterBtn").forEach(b=>{if(b.id && b.id.startsWith("sort"))b.classList.remove("active");});
  const el=document.getElementById(type==="newest"?"sortNewest":type==="cheapest"?"sortCheapest":type==="expensive"?"sortExpensive":"sortViews");
  if(el)el.classList.add("active");
  window.renderPosts();
};
window.togglePriceFilter = function(){
  const row=document.getElementById("priceFilterRow");
  const btn=document.getElementById("priceFilterToggle");
  if(!row)return;
  row.classList.toggle("open");
  if(btn)btn.classList.toggle("active",row.classList.contains("open"));
};
window.applyPriceFilter = function(){
  const mn=parseInt(document.getElementById("priceMin").value,10);
  const mx=parseInt(document.getElementById("priceMax").value,10);
  window.currentPriceMin=isNaN(mn)?null:mn;
  window.currentPriceMax=isNaN(mx)?null:mx;
  window.renderPosts();
};
window.clearPriceFilter = function(){
  document.getElementById("priceMin").value="";
  document.getElementById("priceMax").value="";
  window.currentPriceMin=null;
  window.currentPriceMax=null;
  window.renderPosts();
};
window.toggleAdTypeFilter = function(){
  const btn=document.getElementById("adTypeFilter");
  if(window.currentAdTypeFilter==="all"){window.currentAdTypeFilter="wanted";if(btn){btn.classList.add("wantedActive");btn.innerHTML="🎯 مطلوب فقط";}}
  else if(window.currentAdTypeFilter==="wanted"){window.currentAdTypeFilter="offer";if(btn){btn.classList.remove("wantedActive");btn.innerHTML="🛒 معروض فقط";}}
  else{window.currentAdTypeFilter="all";if(btn){btn.classList.remove("wantedActive");btn.innerHTML="🎯 مطلوب";}}
  window.renderPosts();
};
window.filterCity = function(){window.currentCity=document.getElementById("cityFilter").value;window.renderPosts();};
window.filterCityCat = function(){
  const v=document.getElementById("cityFilterCat").value;
  document.getElementById("cityFilter").value=v;
  window.currentCity=v;
  window.openCategory("الكل");
  setTimeout(()=>{document.getElementById("cityFilter").value=v;window.currentCity=v;window.renderPosts();},100);
};
window.filterCategory = function(cat){
  window.currentCategory=cat;
  window.currentSubCategory="الكل";
  window.currentStoreFilter=null;
  window.showOnlyMine=false;
  window.showOnlyFavorites=false;
  const titleEl=document.getElementById("categoryTitle");
  if(titleEl)titleEl.textContent=cat==="الكل"?"كل الإعلانات":cat;
  document.querySelectorAll(".catChip").forEach(b=>b.classList.toggle("active",b.dataset.cat===cat&&!b.classList.contains("storeChip")));
  window.renderSubCats();
  window.renderPosts();
};
window.filterSubCategory = function(sub){
  window.currentSubCategory=sub;
  window.renderSubCats();
  window.renderPosts();
};
window.renderSubCats = function(){
  if(!window.subCatsRow)return;
  const subs=window.SUB_CATEGORIES[window.currentCategory];
  if(!subs){window.subCatsRow.classList.add("hidden");window.subCatsRow.innerHTML="";return;}
  window.subCatsRow.classList.remove("hidden");
  window.subCatsRow.innerHTML=`<span class="subCatTitle">${subs.title}</span><button class="subCatChip ${window.currentSubCategory==="الكل"?"active":""}" onclick="filterSubCategory('الكل')">الكل</button>${subs.items.map(b=>`<button class="subCatChip ${window.currentSubCategory===b?"active":""}" onclick="filterSubCategory('${b.replace(/'/g,"\\'")}')">${b}</button>`).join("")}`;
};

/* ============================================================
   Navigation
   ============================================================ */
window.setTopbarMode = function(mode){
  if(!window.mainTopbar)return;
  if(mode==="scroll"){window.mainTopbar.classList.add("scrollAway");}
  else{window.mainTopbar.classList.remove("scrollAway");}
};
window.setActiveNav = function(w){
  window.navHome.classList.toggle("active",w==="home");
  window.navMine.classList.toggle("active",w==="mine");
  window.navFav.classList.toggle("active",w==="fav");
};

window.showCategoriesScreen = function(){
  window.showOnlyMine=false;
  window.showOnlyFavorites=false;
  window.currentSubCategory="الكل";
  window.currentStoreFilter=null;
  window.categoriesScreen.classList.remove("hidden");
  window.home.classList.add("hidden");
  window.form.classList.add("hidden");
  const ss=document.getElementById("storesScreen");if(ss)ss.classList.add("hidden");
  const sc=document.getElementById("storeScreen");if(sc)sc.classList.add("hidden");
  window.closeOverlay();
  window.setActiveNav("home");
  window.setTopbarMode("sticky");
  window.renderRecentlyViewed();
  window.updateCartUI();
  window.updateCompareUI();
  window.scrollTo(0,0);
  window.showFloatingButtons();
};

window.openCategory = function(cat){
  window.currentCategory=cat;
  window.currentSubCategory="الكل";
  window.currentStoreFilter=null;
  window.showOnlyMine=false;
  window.showOnlyFavorites=false;
  const titleEl=document.getElementById("categoryTitle");
  if(titleEl)titleEl.textContent=cat==="الكل"?"كل الإعلانات":cat;
  window.categoriesScreen.classList.add("hidden");
  window.home.classList.remove("hidden");
  window.form.classList.add("hidden");
  const ss=document.getElementById("storesScreen");if(ss)ss.classList.add("hidden");
  const sc=document.getElementById("storeScreen");if(sc)sc.classList.add("hidden");
  window.closeOverlay();
  window.setActiveNav("home");
  window.setTopbarMode("scroll");
  document.querySelectorAll(".catChip").forEach(b=>b.classList.toggle("active",b.dataset.cat===cat && !b.classList.contains("storeChip")));
  window.renderSubCats();
  window.renderPosts();
  window.updateCartUI();
  window.scrollTo(0,0);
  window.hideFloatingButtons();
};

window.backFromForm = function(){
  if(window.showOnlyMine){window.showMyPosts();}
  else if(window.showOnlyFavorites){window.showFavorites();}
  else if(window.currentCategory && window.currentCategory!=="الكل"){window.openCategory(window.currentCategory);}
  else{window.showCategoriesScreen();}
};

window.focusSearchInHome = function(){
  window.openCategory("الكل");
  setTimeout(()=>{const i=document.getElementById("searchInput");if(i)i.focus();},200);
};

window.showMyPosts = function(){
  if(!auth.currentUser){window.pendingAction="mine";window.authOverlay.classList.remove("hidden");return;}
  window.showOnlyMine=true;
  window.showOnlyFavorites=false;
  window.currentSubCategory="الكل";
  window.currentStoreFilter=null;
  window.renderSubCats();
  window.hideSearchDropdown();
  const titleEl=document.getElementById("categoryTitle");
  if(titleEl)titleEl.textContent="إعلاناتي";
  window.categoriesScreen.classList.add("hidden");
  window.home.classList.remove("hidden");
  window.form.classList.add("hidden");
  const ss=document.getElementById("storesScreen");if(ss)ss.classList.add("hidden");
  const sc=document.getElementById("storeScreen");if(sc)sc.classList.add("hidden");
  window.closeOverlay();
  window.setActiveNav("mine");
  window.setTopbarMode("scroll");
  window.renderPosts();
  window.updateCartUI();
  window.scrollTo(0,0);
  window.hideFloatingButtons();
};

window.showFavorites = function(){
  if(window.showOnlyFavorites && !window.showOnlyMine){window.showCategoriesScreen();return;}
  window.showOnlyFavorites=true;
  window.showOnlyMine=false;
  window.currentSubCategory="الكل";
  window.currentStoreFilter=null;
  window.renderSubCats();
  window.hideSearchDropdown();
  const titleEl=document.getElementById("categoryTitle");
  if(titleEl)titleEl.textContent="❤️ المفضلة";
  window.categoriesScreen.classList.add("hidden");
  window.home.classList.remove("hidden");
  window.form.classList.add("hidden");
  const ss=document.getElementById("storesScreen");if(ss)ss.classList.add("hidden");
  const sc=document.getElementById("storeScreen");if(sc)sc.classList.add("hidden");
  window.closeOverlay();
  window.setActiveNav("fav");
  window.setTopbarMode("scroll");
  window.renderPosts();
  window.updateCartUI();
  window.scrollTo(0,0);
  window.hideFloatingButtons();
};

window.showHome = function(){window.showCategoriesScreen();};

/* ============================================================
   Categories Grid + Chips
   ============================================================ */
window.catIconHtml = function(c){
  const color=c.color||"#38bdf8";
  if(c.image){
    return `<div class="catIconWrap catIconImg"><img src="${c.image}" alt="${c.name}" loading="lazy"></div>`;
  }
  return `<div class="catIconWrap" style="background:${color}"><i data-lucide="${c.iconName||'circle'}"></i></div>`;
};
window.buildCategoriesGrid = function(){
  const grid=document.getElementById("categoriesGrid");
  if(!grid)return;
  grid.innerHTML=window.CATEGORIES.map(c=>{
    if(c.isStore)return `<div class="catBox storeBox" onclick="openStores()">${window.catIconHtml(c)}<div class="catName">الشركات والمتاجر</div></div>`;
    if(c.name==="الكل")return `<div class="catBox allBox" onclick="openCategory('الكل')">${window.catIconHtml(c)}<div class="catName">الكل</div></div>`;
    return `<div class="catBox" onclick="openCategory('${c.name.replace(/'/g,"\\'")}')">${window.catIconHtml(c)}<div class="catName">${c.name}</div></div>`;
  }).join("");
  if(window.lucide) lucide.createIcons();
};

(function(){
  const cr=document.getElementById("catsRow");
  if(!cr)return;
  cr.innerHTML=window.CATEGORIES.map((c,i)=>{
    if(c.isStore)return `<button class="catChip storeChip" onclick="openStores()">🏢 الشركات والمتاجر</button>`;
    return `<button class="catChip${i===0?" active":""}" data-cat="${c.name}" onclick="filterCategory('${c.name.replace(/'/g,"\\'")}')"><span style="display:inline-flex;width:16px;height:16px;border-radius:50%;background:${c.color||'#38bdf8'};align-items:center;justify-content:center;margin-left:4px;flex:0 0 auto"><i data-lucide="${c.iconName||'circle'}" style="width:10px;height:10px;color:#fff"></i></span>${c.name}</button>`;
  }).join("");
  if(window.lucide) lucide.createIcons();
})();
setTimeout(window.updateClearBtn,500);
setTimeout(window.updateCompareUI,300);

/* ============================================================
   Skeletons + Listener
   ============================================================ */
window.renderSkeletons = function(){
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
};

window._postsLoadedOnce = false;

window.startPostsListener = function(){
  onSnapshot(collection(db,"posts"),snap=>{
    window.allPosts=snap.docs.map(d=>({id:d.id,...d.data()}));
    window.allPosts=window.sortPosts(window.allPosts);
    window._postsLoadedOnce=true;
    window.renderPosts();
    window.updateModBadge();
    window.renderRecentlyViewed();
    window.updateCartUI();
    window.updateCompareUI();
  },err=>{window.postsBox.innerHTML="<div class='empty'>تعذر تحميل الإعلانات.</div>";});
};

/* ============================================================
   renderPosts — with empty state
   ============================================================ */
window.renderPosts = function(){
  if(window.allPosts.length===0 && !window.showOnlyFavorites && !window._postsLoadedOnce){window.renderSkeletons();}
  const term=(document.getElementById("searchInput")?.value||"").trim().toLowerCase();
  const favs=window.getFavorites();
  const me=auth.currentUser;
  let list=window.allPosts.filter(p=>{
    const status=window.getStatus(p);
    const isOwner=me&&p.uid===me.uid;
    const isMyStorePost=window.myStore&&p.storeId===window.myStore.id;
    const expired=window.isExpired(p);
    if(expired && !isOwner && !window.isAdmin && !isMyStorePost)return false;
    if(status!=="approved" && !isOwner && !window.isAdmin && !isMyStorePost)return false;
    if(window.currentStoreFilter && p.storeId!==window.currentStoreFilter)return false;
    if(!window.currentStoreFilter && window.currentCategory!=="الكل"){
      if(window.isRestaurantCategory(window.currentCategory)){
        if(!window.isRestaurantCategory(p.category))return false;
      }else if(p.category!==window.currentCategory)return false;
    }
    if(window.currentSubCategory!=="الكل" && p.brand!==window.currentSubCategory)return false;
    if(window.currentCity!=="الكل" && p.city!==window.currentCity)return false;
    if(window.showOnlyMine && p.uid!==me?.uid)return false;
    if(window.showOnlyFavorites && !favs.includes(p.id))return false;
    if(term && !(p.title||"").toLowerCase().includes(term))return false;
    if(window.currentPriceMin!=null && (Number(p.price)||0)<window.currentPriceMin)return false;
    if(window.currentPriceMax!=null && (Number(p.price)||0)>window.currentPriceMax)return false;
    if(window.currentAdTypeFilter==="wanted" && !window.isWanted(p))return false;
    if(window.currentAdTypeFilter==="offer" && window.isWanted(p))return false;
    return true;
  });
  list=window.sortPosts(list);
  if(list.length===0){
    if(window.showOnlyFavorites){
      window.postsBox.innerHTML=window.buildEmptyState('❤️','المفضلة فاضية','اضغط على القلب 🤍 في أي إعلان<br>عشان تحفظه هنا','🏠 تصفح الإعلانات','showCategoriesScreen()',true);
    }else if(window.showOnlyMine){
      window.postsBox.innerHTML=window.buildEmptyState('📝','لسه ما نشرت إعلانات','ابدأ بنشر أول إعلان لك الآن<br>مجاناً وفي دقيقة','➕ أنشر إعلانك الأول','startAddPost()');
    }else if(term){
      window.postsBox.innerHTML=window.buildEmptyState('🔍','لا توجد نتائج','لم نجد إعلانات تطابق "'+window.escapeHtml(term)+'"<br>جرّب كلمة بحث أخرى','🔄 مسح البحث','clearSearch()',true);
    }else if(window.currentCity!=="الكل"){
      window.postsBox.innerHTML=window.buildEmptyState('📍','لا توجد إعلانات في '+window.escapeHtml(window.currentCity),'كن أول من ينشر إعلاناً<br>في هذه المدينة','➕ أنشر إعلان هنا','startAddPost()');
    }else{
      window.postsBox.innerHTML=window.buildEmptyState('📭','لا توجد إعلانات هنا حالياً','كن أول من ينشر إعلاناً في هذا القسم<br>مجاناً وفي ثوانٍ!','➕ كن أول من ينشر إعلاناً','startAddPost()');
    }
    return;
  }
  window.postsBox.innerHTML=list.map(p=>{
    const status=window.getStatus(p);
    const me=auth.currentUser;
    const isOwner=me&&p.uid===me.uid;
    const isMyStorePost=window.myStore&&p.storeId===window.myStore.id;
    const canDelete=window.isAdmin||isOwner||isMyStorePost;
    const expired=window.isExpired(p);
    const days=window.daysLeft(p);
    const isSold=!!p.sold;
    const wanted=window.isWanted(p);
    const images=window.getImages(p);
    const dots=window.dotsHtml(images);
    const postStore=p.storeId?window.allStores.find(s=>s.id===p.storeId):null;
    const isRestaurantPost=postStore?window.isRestaurantStore(postStore):window.isRestaurantCategory(p.category);
    const cleanPhone=String(p.phone||'').replace(/[^0-9+]/g,'');
    const contactBtn=(p.phone && !isSold)
      ? (isRestaurantPost
          ? `<a href="tel:${cleanPhone}" class="callBtn" style="background:var(--call);text-decoration:none;display:inline-flex;align-items:center;justify-content:center" onclick="event.stopPropagation();incrementWhatsappClick('${window.escapeHtml(p.id)}','post')">📞 اتصل</a>`
          : `<button class="waBtn" onclick="event.stopPropagation();contactSeller('${window.escapeHtml(p.id)}')">واتساب</button>
             <a href="tel:${cleanPhone}" class="callBtn" style="background:var(--call);text-decoration:none;display:inline-flex;align-items:center;justify-content:center" onclick="event.stopPropagation();incrementWhatsappClick('${window.escapeHtml(p.id)}','post')">اتصال</a>`)
      : "";
    const edit=canDelete?`<button class="iconBtn2 editBtn" onclick="editPost('${p.id}')">✏️</button>`:"";
    const del=canDelete?`<button class="iconBtn2 delBtn" onclick="deletePost('${p.id}')">🗑️</button>`:"";
    const renewBtn=canDelete && !isSold?`<button class="iconBtn2 renewBtn" onclick="renewPost('${p.id}',event)" title="تجديد 30 يوم">🔄</button>`:"";
    const soldToggle=canDelete?`<button class="iconBtn2 soldBtn" onclick="toggleSold('${p.id}',event)" title="${isSold?'إلغاء البيع':'تم البيع'}">${isSold?'↩️':'✅'}</button>`:"";
    const feat=window.isAdmin?`<button class="iconBtn2 featBtn ${window.isPostFeatured(p)?'on':''}" onclick="toggleFeatured('${p.id}',event)">${window.isPostFeatured(p)?'⭐':'☆'}</button>`:"";
    const fav=window.isFavorite(p.id);
    const inCompare=window.compareList.includes(p.id);
    const viewsLine=(isOwner||window.isAdmin||isMyStorePost)?`<div class="cardViews">👁️ ${p.views||0} مشاهدة</div>`:"";
    let cardClass="";
    if(isSold)cardClass="sold";
    else if(wanted)cardClass="wanted";
    else if(expired && (isOwner||window.isAdmin||isMyStorePost))cardClass="expired";
    else if(status==="approved" && window.isPostFeatured(p))cardClass="featured";
    else if(status==="pending")cardClass="pending";
    else if(status==="rejected")cardClass="rejected";
    const displayCategory=(p.category==="مطاعم وغداء")?"مطاعم ومأكولات":(p.category||"");
    const brandTag=p.brand?`<span class="brandTag">${window.escapeHtml(p.brand)}</span>`:`<span class="catTag">${window.escapeHtml(displayCategory)}</span>`;
    const memberTag=p.sellerMemberNo?`<span class="memberNoBadge" style="margin-left:6px">#${p.sellerMemberNo}</span>`:"";
    const userTag=p.sellerUsername?`<span class="usernameBadge" style="margin-left:6px">@${window.escapeHtml(p.sellerUsername)}</span>`:"";
    const storeTag=p.storeId?`<span class="storeBadge" style="margin-left:6px">🏪 ${window.escapeHtml(p.storeName||"متجر")}</span>`:"";
    const sellerPostsCount=!p.storeId && p.uid ? window.allPosts.filter(x=>x.uid===p.uid && window.getStatus(x)==="approved").length : 0;
    const tierTag=!p.storeId && sellerPostsCount>0 ? window.renderSellerTierBadge(p.uid,sellerPostsCount) : "";
    const sellerLineHtml=p.storeId?`<div class="sellerLine" onclick="event.stopPropagation();openStore('${p.storeId}',false,'home')">${storeTag} ›</div>`:(p.uid?`<div class="sellerLine" onclick="openSeller('${window.escapeHtml(p.uid)}')">👤 ${window.escapeHtml(p.sellerName||"البائع")} ${memberTag} ${userTag}${tierTag} ›</div>`:"");
    let expiryLine="";
    if(!isSold && (isOwner||window.isAdmin||isMyStorePost)&&days!=null){
      if(days<=0)expiryLine=`<div class="expiryLine expiryEnded">⏰ منتهي — يحتاج تجديد</div>`;
      else if(days<=5)expiryLine=`<div class="expiryLine expirySoon">⏳ باقي ${days} يوم فقط!</div>`;
      else expiryLine=`<div class="expiryLine expiryOk">⏳ باقي ${days} يوم</div>`;
    }
    const discPct=window.getDiscountPercent(p);
    const discBadge=discPct>0?`<span class="discountBadge">🔥 ${discPct}%</span>`:"";
    const negotiableBadge=p.negotiable?`<span style="background:#dcfce7;color:#166534;font-weight:800;padding:3px 9px;border-radius:7px;font-size:11px;border:1px solid #16a34a;margin-right:6px">🤝 قابل للنقاش</span>`:"";
    let priceHTML="";
    if(p.priceType==="contact"){
      priceHTML=`<div class="price" style="color:var(--teal-dark);font-size:13.5px">📞 تواصل لمعرفة السعر</div>`;
    }else if(discPct>0){
      priceHTML=`<div class="price"><span class="originalPrice">${window.formatPrice(p.originalPrice)} د.ل</span><span class="discountPrice">${window.formatPrice(p.price)} د.ل</span>${negotiableBadge}</div>`;
    }else{
      priceHTML=`<div class="price">${p.price!=null?window.formatPrice(p.price)+" د.ل":""}${negotiableBadge}</div>`;
    }
    return `<div class="card ${cardClass}" data-title="${window.escapeHtml(p.title||"")}"><div class="imgWrap" onclick="openPost('${p.id}')">${window.carouselHtml(images)}${dots}${discBadge}<button class="compareCheckbox ${inCompare?'active':''}" onclick="toggleCompare('${p.id}',event)">${inCompare?'✓':'⚖'}</button><button class="favBtn ${fav?'active':''}" onclick="toggleFavorite('${p.id}',event)">${fav?'❤️':'🤍'}</button></div><div class="body"><h4 style="cursor:pointer" onclick="openPost('${p.id}')">${window.escapeHtml(p.title||"بدون عنوان")}</h4>${priceHTML}${p.city?`<div class="cityLine">📍 ${window.escapeHtml(p.city)}</div>`:""}${sellerLineHtml}<div class="meta">${brandTag}<span class="time">${window.timeAgo(p.createdAt)}</span></div>${viewsLine}${expiryLine}<div class="actions">${contactBtn}${feat}${soldToggle}${edit}${del}${renewBtn}</div></div></div>`;
  }).join("");
};

/* ============================================================
   openPost
   ============================================================ */
window.openPost = function(id){
  const p=window.allPosts.find(x=>x.id===id);
  if(!p)return;
  const status=window.getStatus(p);
  const me=auth.currentUser;
  const isOwner=me&&me.uid===p.uid;
  const isMyStorePost=window.myStore&&p.storeId===window.myStore.id;
  const expired=window.isExpired(p);
  const isSold=!!p.sold;
  const wanted=window.isWanted(p);
  if(expired && !isOwner && !window.isAdmin && !isMyStorePost){window.showToast("⏰ هذا الإعلان منتهي.","warn");return;}
  if(status!=="approved" && !isOwner && !window.isAdmin && !isMyStorePost){window.showToast("هذا الإعلان غير متاح حالياً.","warn");return;}
  if(!isOwner && !isMyStorePost){window.incrementViews(id);window.addRecentView(id);}
  const days=window.daysLeft(p);
  const images=window.getImages(p);
  const dots=window.dotsHtml(images);
  const thumbsHtml=images.length>1?`<div class="thumbsRow" id="postThumbs">${images.map((u,i)=>`<div class="thumbItem${i===0?' active':''}" onclick="event.stopPropagation();scrollToPostImage('${p.id}',${i})"><img src="${window.escapeHtml(u)}" loading="lazy"></div>`).join("")}</div>`:"";
  const desc=p.description?`<div class="pDesc">${window.escapeHtml(p.description)}</div>`:`<div class="pDesc" style="color:var(--muted)">لا يوجد وصف.</div>`;
  const postStore=p.storeId?window.allStores.find(s=>s.id===p.storeId):null;
  const isRestaurantPost=postStore?window.isRestaurantStore(postStore):window.isRestaurantCategory(p.category);
  let sellerTags="";
  if(p.storeId){sellerTags+=` <span class="storeBadge">🏪 ${window.escapeHtml(p.storeName||"متجر")}</span>`;}
  else{
    if(p.sellerMemberNo)sellerTags+=` <span class="memberNoBadge">#${p.sellerMemberNo}</span>`;
    if(p.sellerUsername)sellerTags+=` <span class="usernameBadge">@${window.escapeHtml(p.sellerUsername)}</span>`;
  }
  const sellerHtml=p.storeId?`<div class="sellerLine" style="font-size:13px;margin:6px 0" onclick="closeOverlay();setTimeout(()=>openStore('${p.storeId}',false,'categories'),200)">${window.escapeHtml(p.storeName||"المتجر")}${sellerTags} ›</div>`:(p.uid?`<div class="sellerLine" style="font-size:13px;margin:6px 0" onclick="closeOverlay();setTimeout(()=>openSeller('${window.escapeHtml(p.uid)}'),200)">👤 ${window.escapeHtml(p.sellerName||"البائع")}${sellerTags} ›</div>`:"");
  const cleanPPhone=String(p.phone||'').replace(/[^0-9+]/g,'');
  const contactBtn=(p.phone && !isSold)
    ? (isRestaurantPost
        ? `<a href="tel:${cleanPPhone}" class="btnMain" style="background:var(--call);margin-bottom:8px;text-decoration:none;display:flex;align-items:center;justify-content:center" onclick="event.stopPropagation();incrementWhatsappClick('${window.escapeHtml(p.id)}','post')">📞 اتصل بالمطعم</a>`
        : `<button class="btnMain" style="background:var(--wa);margin-bottom:8px" onclick="event.stopPropagation();contactSeller('${window.escapeHtml(p.id)}')">💬 تواصل عبر واتساب</button>
           <a href="tel:${cleanPPhone}" class="btnMain" style="background:var(--call);margin-bottom:8px;text-decoration:none;display:flex;align-items:center;justify-content:center" onclick="event.stopPropagation();incrementWhatsappClick('${window.escapeHtml(p.id)}','post')">📞 اتصال هاتفي مباشر</a>`)
    : "";
  const cartBtn=(!isSold && window.canHaveCart(p))?`<button class="btnMain" style="background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#3a2500;margin-bottom:8px" onclick="addToCart('${p.id}',event);setTimeout(()=>openCart(),300)">🛒 أضف للسلة</button>`:"";
  const shareBtn=(status==="approved" && !expired)?`<button class="btnMain" style="background:var(--teal-dark);margin-bottom:8px" onclick="sharePost('${p.id}')">📤 مشاركة الإعلان</button>`:"";
  const viewsBadge=(isOwner||window.isAdmin||isMyStorePost)?`<div class="pViewsBadge">👁️ ${p.views||0} مشاهدة</div>`:"";
  let statusBadge="";
  if(isOwner||window.isAdmin||isMyStorePost){
    if(status==="pending")statusBadge=`<span class="statusBadge pending">⏳ قيد المراجعة</span>`;
    else if(status==="rejected")statusBadge=`<span class="statusBadge rejected">❌ مرفوض${p.rejectReason?' — '+window.escapeHtml(p.rejectReason):''}</span>`;
  }
  let soldBadge=isSold?`<span class="soldBadge">✅ تم البيع</span>`:"";
  let wantedBadge=wanted?`<span class="soldBadge" style="background:#fff7ed;color:#9a3412;border-color:#f97316">🎯 إعلان مطلوب</span>`:"";
  let expiryBadge="";
  if(!isSold && (isOwner||window.isAdmin||isMyStorePost)&&days!=null){
    if(days<=0)expiryBadge=`<span class="expiryBadge" style="background:#fdeceb;color:#b91c1c;border:1px solid #e5484d">⏰ منتهي</span>`;
    else if(days<=5)expiryBadge=`<span class="expiryBadge" style="background:#fef3c7;color:#92400e;border:1px solid #f59e0b">⏳ باقي ${days} يوم</span>`;
    else expiryBadge=`<span class="expiryBadge" style="background:#dcfce7;color:#166534;border:1px solid #16a34a">⏳ باقي ${days} يوم</span>`;
  }
  let brandBadge=p.brand?`<span class="brandBadge">🏷️ ${window.escapeHtml(p.brand)}</span>`:"";
  let featBadge="";
  if(status==="approved" && !expired && !isSold && window.isPostFeatured(p)){
    const daysF=window.featuredDaysLeft(p);
    if(isOwner)featBadge=`<span class="featBadgeOwner">⭐ مميز — ${daysF} ${daysF===1?'يوم':'أيام'} متبقية</span>`;
    else if(window.isAdmin)featBadge=`<span class="featBadge">⭐ مميز — ${daysF} ${daysF===1?'يوم':'أيام'}</span>`;
    else featBadge=`<span class="featBadge">⭐ إعلان مميز</span>`;
  }
  const renewBtnBig=(isOwner||window.isAdmin||isMyStorePost) && !isSold?`<button class="renewBtnBig" onclick="renewPost('${p.id}')">🔄 تجديد 30 يوم إضافية</button>`:"";
  const soldBtnBig=(isOwner||window.isAdmin||isMyStorePost)?(isSold?`<button class="unsoldBtnBig" onclick="toggleSold('${p.id}')">↩️ إلغاء (تم البيع)</button>`:`<button class="soldBtnBig" onclick="toggleSold('${p.id}')">✅ تم البيع</button>`):"";
  let upgradeBtn="";
  if(isOwner && status==="approved" && !expired && !isSold){
    if(window.isPostFeatured(p))upgradeBtn=`<button class="upgradeBtn" onclick="openUpgrade('${p.id}')">🔄 تجديد / تمديد الترقية</button>`;
    else upgradeBtn=`<button class="upgradeBtn" onclick="openUpgrade('${p.id}')">⭐ ترقية إعلاني</button>`;
  }
  let adminPanel="";
  if(window.isAdmin){
    if(status==="pending")adminPanel=`<div class="reviewBox"><div class="rbTitle">⏳ بانتظار المراجعة</div><div class="rbBtns"><button class="approve" onclick="approvePost('${p.id}')">✅ موافقة</button><button class="reject" onclick="rejectPost('${p.id}')">❌ رفض</button></div></div>`;
    else if(status==="rejected")adminPanel=`<div class="reviewBox" style="background:#fdeceb;border-color:#e5484d"><div class="rbTitle" style="color:#b91c1c">❌ إعلان مرفوض</div><div class="rbBtns"><button class="approve" onclick="approvePost('${p.id}')">✅ قبول الإعلان</button></div></div>`;
    adminPanel+=`<div style="background:#fff8e1;border:1px solid #f59e0b;border-radius:12px;padding:12px;margin-top:8px"><div style="font-weight:800;color:#92400e;margin-bottom:8px;font-size:13px">⭐ التحكم بالتمييز (أدمن)</div><div class="adminPlans"><button onclick="adminFeature('${p.id}',7)">7 أيام</button><button onclick="adminFeature('${p.id}',15)">15 يوم</button><button onclick="adminFeature('${p.id}',30)">30 يوم</button>${window.isPostFeatured(p)?`<button class="cancel" onclick="adminFeature('${p.id}',0)">❌ إلغاء التمييز</button>`:""}</div></div>`;
  }
  let analyticsHtml="";
  if(isOwner||window.isAdmin||isMyStorePost){
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
  const similar=window.allPosts.filter(x=>x.id!==p.id && x.category===p.category && window.getStatus(x)==="approved" && !window.isExpired(x) && !x.sold).slice(0,4);
  const similarHtml=similar.length?`<div style="margin-top:24px;padding-top:16px;border-top:2px dashed #edeff2"><div style="font-weight:800;font-size:15px;margin-bottom:12px">🔄 إعلانات مشابهة</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${similar.map(s=>{const imgs=window.getImages(s);const th=imgs[0]||"";const simPrice=s.priceType==="contact"?"📞 تواصل":(s.price!=null?window.formatPrice(s.price)+" د.ل":"");return `<div onclick="closeOverlay();setTimeout(()=>openPost('${s.id}'),200)" style="background:#fff;border:1px solid var(--border);border-radius:12px;overflow:hidden;cursor:pointer"><div style="width:100%;aspect-ratio:1/1;background:var(--teal-light);overflow:hidden">${th?`<img src="${window.escapeHtml(th)}" style="width:100%;height:100%;object-fit:cover">`:`<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:24px;opacity:.5">🖼️</div>`}</div><div style="padding:8px 10px"><div style="font-size:12.5px;font-weight:700;line-height:1.4;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.4em">${window.escapeHtml(s.title||"بدون عنوان")}</div><div style="font-size:13px;font-weight:800;color:var(--teal-dark)">${simPrice}</div></div></div>`;}).join("")}</div></div>`:"";
  const discPct=window.getDiscountPercent(p);
  const negotiableBadgeBig=p.negotiable?`<span style="background:#dcfce7;color:#166534;font-weight:800;padding:5px 12px;border-radius:9px;font-size:12.5px;border:1px solid #16a34a;margin-right:8px;display:inline-block;margin-top:6px">🤝 قابل للنقاش</span>`:"";
  let priceHtml="";
  if(p.priceType==="contact"){
    priceHtml=`<div style="margin:8px 0;background:var(--teal-light);border:2px solid var(--teal);border-radius:12px;padding:14px;text-align:center"><div style="font-size:22px;font-weight:900;color:var(--teal-dark)">📞 تواصل لمعرفة السعر</div><div style="font-size:12px;color:var(--muted);margin-top:4px">السعر متاح عند التواصل مع البائع</div>${negotiableBadgeBig}</div>`;
  }else if(discPct>0){
    priceHtml=`<div style="margin:6px 0"><span class="originalPrice" style="font-size:15px">${window.formatPrice(p.originalPrice)} د.ل</span><span class="discountPrice" style="font-size:24px">${window.formatPrice(p.price)} د.ل</span><span style="background:#e5484d;color:#fff;font-weight:800;padding:4px 10px;border-radius:8px;font-size:12px;margin-right:8px">🔥 خصم ${discPct}%</span>${negotiableBadgeBig}</div>`;
  }else{
    priceHtml=`<div class="price" style="font-size:20px">${p.price!=null?window.formatPrice(p.price)+" د.ل":""}${negotiableBadgeBig}</div>`;
  }
  window.updateSEOMeta(p);
  document.getElementById("postContent").innerHTML=`<div class="pImg"><button class="reportOnImg right" onclick="reportPost('${p.id}')">🚩</button>${window.carouselHtml(images,true)}${dots}</div>${thumbsHtml}<div class="pTitle">${window.escapeHtml(p.title||"بدون عنوان")}</div>${priceHtml}<div class="pMeta">${p.city?"📍 "+window.escapeHtml(p.city)+" · ":""}${window.escapeHtml(p.category||"")} · ${window.timeAgo(p.createdAt)}</div><div>${soldBadge}${wantedBadge}${featBadge}${brandBadge}${statusBadge}${viewsBadge}${expiryBadge}</div>${sellerHtml}${analyticsHtml}<div style="font-weight:800;margin:14px 0 4px">الوصف</div>${desc}<div style="height:14px"></div>${soldBtnBig}${cartBtn}${renewBtnBig}${upgradeBtn}${contactBtn}${shareBtn}${similarHtml}${adminPanel}`;
  window.postOverlay.classList.remove("hidden");
  window.scrollTo(0,0);
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

/* ============================================================
   SEO
   ============================================================ */
window.updateSEOMeta = function(post){
  if(!post){document.title="تسوق الآن — منصة إعلانات ليبية مجانية";return;}
  const title=post.title||"إعلان";
  const price=post.priceType==="contact"?"تواصل لمعرفة السعر":(post.price!=null?window.formatPrice(post.price)+" د.ل":"");
  const city=post.city||"";
  document.title=`${title}${price?" — "+price:""}${city?" — "+city:" | تسوق الآن"}`;
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
  const imgs=window.getImages(post);
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
};

/* ============================================================
   Lightbox
   ============================================================ */
window.openLightbox = function(url){
  if(!url)return;
  const lb=document.getElementById("lightbox");
  const img=document.getElementById("lightboxImg");
  if(!lb||!img)return;
  img.src=url;
  lb.classList.remove("hidden");
  document.body.style.overflow="hidden";
};
window.closeLightbox = function(e){
  if(e)e.stopPropagation();
  const lb=document.getElementById("lightbox");
  if(lb)lb.classList.add("hidden");
  document.body.style.overflow="";
};
window.scrollToPostImage = function(postId,idx){
  const carousel=document.querySelector("#postContent .carousel");
  if(!carousel)return;
  const slideW=carousel.clientWidth||1;
  carousel.scrollTo({left:idx*slideW,behavior:"smooth"});
  document.querySelectorAll(".thumbItem").forEach((t,i)=>t.classList.toggle("active",i===idx));
};

/* ============================================================
   Image Upload
   ============================================================ */
window.updateDescCount = function(){
  const d=document.getElementById("description");
  document.getElementById("descCount").textContent=d?d.value.length:0;
};
async function compressImage(file,maxSize=1600,quality=0.9){
  try{
    const bmp=await createImageBitmap(file);
    const scale=Math.min(1,maxSize/Math.max(bmp.width,bmp.height));
    const w=Math.round(bmp.width*scale),h=Math.round(bmp.height*scale);
    const c=document.createElement("canvas");
    c.width=w;c.height=h;
    const ctx=c.getContext("2d");
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
    ctx.drawImage(bmp,0,0,w,h);
    const b=await new Promise(r=>c.toBlob(r,"image/jpeg",quality));
    return b||file;
  }catch(e){return file;}
}
window.uploadToImgBB = async function(file){
  const fd=new FormData();
  const toSend=await compressImage(file);
  fd.append("image",toSend,"photo.jpg");
  const res=await fetch(`https://api.imgbb.com/1/upload?key=${window.IMGBB_API_KEY}`,{method:"POST",body:fd});
  const data=await res.json();
  if(!data.success)throw new Error("فشل رفع الصورة");
  return data.data.url;
};
window.renderImagePicker = function(){
  const box=document.getElementById("imgThumbs");
  box.innerHTML=window.selectedImages.map((item,i)=>{
    const src=item.type==="existing"?item.url:item.previewUrl;
    return `<div class="imgThumb"><img src="${window.escapeHtml(src)}"><button class="rm" onclick="removeImage(${i})">×</button></div>`;
  }).join("");
  document.getElementById("imgAddTile").classList.toggle("hidden",window.selectedImages.length>=5);
};
window.removeImage = function(i){
  window.selectedImages.splice(i,1);
  window.renderImagePicker();
};
window.handleFilesSelected = function(){
  const input=document.getElementById("imageFile");
  const files=Array.from(input.files);
  const remaining=5-window.selectedImages.length;
  files.slice(0,remaining).forEach(file=>{
    window.selectedImages.push({type:"new",file,previewUrl:URL.createObjectURL(file)});
  });
  input.value="";
  window.renderImagePicker();
};

/* ============================================================
   Form helpers
   ============================================================ */
window.onPriceTypeChange = function(){
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
  window.updateDiscountPreview();
};
window.toggleReceiptPhoneField = function(){
  const cat=document.getElementById("storeCategory")?.value;
  const field=document.getElementById("storeReceiptPhoneField");
  if(field)field.style.display=window.isRestaurantCategory(cat)?"block":"none";
};
window.toggleEditReceiptPhoneField = function(){
  const cat=document.getElementById("editStoreCategory")?.value;
  const field=document.getElementById("editStoreReceiptPhoneField");
  if(field)field.style.display=window.isRestaurantCategory(cat)?"block":"none";
};
window.updateDiscountPreview = function(){
  const orig=parseFloat(document.getElementById("originalPrice")?.value)||0;
  const curr=parseFloat(document.getElementById("price")?.value)||0;
  const box=document.getElementById("discountPreview");
  if(!box) return;
  if(orig>curr && curr>0){
    const pct=Math.round(((orig-curr)/orig)*100);
    box.textContent=`🔥 خصم ${pct}% — سيظهر شارة على المنتج`;
  } else { box.textContent=""; }
};
window.onAdTypeChange = function(){
  const val=document.querySelector('input[name="adType"]:checked')?.value||"offer";
  const offerL=document.getElementById("adTypeOfferLabel");
  const wantedL=document.getElementById("adTypeWantedLabel");
  if(offerL)offerL.style.borderColor=val==="offer"?"var(--teal)":"var(--border)";
  if(offerL)offerL.style.background=val==="offer"?"var(--teal-light)":"var(--card)";
  if(wantedL)wantedL.style.borderColor=val==="wanted"?"var(--wanted)":"var(--border)";
  if(wantedL)wantedL.style.background=val==="wanted"?"#fff7ed":"var(--card)";
};

window.populateCitySelects = function(){
  const g=Object.entries(window.LIBYA_CITIES).map(([r,c])=>`<optgroup label="${r}">${c.map(x=>`<option value="${x}">${x}</option>`).join("")}</optgroup>`).join("");
  const cf=document.getElementById("cityFilter");if(cf)cf.innerHTML=`<option value="الكل">📍 كل المدن</option>${g}`;
  const cfc=document.getElementById("cityFilterCat");if(cfc)cfc.innerHTML=`<option value="الكل">📍 كل المدن</option>${g}`;
  const cityEl=document.getElementById("city");if(cityEl)cityEl.innerHTML=`<option value="">اختر المدينة</option>${g}`;
  const sc=document.getElementById("storeCity");if(sc)sc.innerHTML=`<option value="">اختر المدينة</option>${g}`;
  const esc=document.getElementById("editStoreCity");if(esc)esc.innerHTML=`<option value="">اختر المدينة</option>${g}`;
};
window.populateCategorySelects = function(){
  const list = window.CATEGORIES.filter(c => !c.isStore && c.name !== "الكل").map(c => c.name);
  const opts = list.map(n => `<option>${n}</option>`).join("");
  ["category","storeCategory","editStoreCategory"].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.innerHTML = opts;
  });
};
window.populateBrandSelect = function(cat){
  const sel=document.getElementById("brand");if(!sel)return;
  let brands=[];
  if(cat==="سيارات ومركبات")brands=window.CAR_BRANDS;
  else if(cat==="دراجات نارية")brands=window.MOTORCYCLE_BRANDS;
  else if(cat==="موبايل وتابلت")brands=window.PHONE_BRANDS;
  else if(cat==="لابتوب وكمبيوتر")brands=window.COMPUTER_BRANDS;
  else if(cat==="الحيوانات والطيور")brands=window.ANIMAL_TYPES;
  else if(cat==="العطور")brands=window.PERFUME_TYPES;
  if(brands.length===0){sel.innerHTML='<option value="">اختر (اختياري)</option>';return;}
  sel.innerHTML=`<option value="">اختر (اختياري)</option>`+brands.map(b=>`<option value="${b}">${b}</option>`).join("");
};
window.onCategoryChange = function(){
  const cat=document.getElementById("category").value;
  const bf=document.getElementById("brandField");
  const bl=document.getElementById("brandLabel");
  if(cat==="سيارات ومركبات"||cat==="دراجات نارية"||cat==="موبايل وتابلت"||cat==="لابتوب وكمبيوتر"){
    bf.classList.remove("hidden");bl.textContent="الماركة";window.populateBrandSelect(cat);
  }else if(cat==="الحيوانات والطيور"||cat==="العطور"){
    bf.classList.remove("hidden");bl.textContent="النوع";window.populateBrandSelect(cat);
  }else{
    bf.classList.add("hidden");document.getElementById("brand").value="";
  }
};

/* ============================================================
   Save / Edit / Delete Post
   ============================================================ */
window.savePost = async function(){
  if(!auth.currentUser){window.pendingAction="form";window.authOverlay.classList.remove("hidden");return;}
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
  const wasEditing=!!window.editingPostId;
  const userPhone=(window.myProfile&&window.myProfile.phone)||"";
  const isStorePostFlag=!!window._isStorePost;
  const storeForPhone=isStorePostFlag && window._tempStoreData ? window._tempStoreData : window.myStore;
  const phone=(isStorePostFlag && storeForPhone && storeForPhone.phone) ? storeForPhone.phone : userPhone;
  const adType=document.querySelector('input[name="adType"]:checked')?.value||"offer";
  const originalPrice=parseFloat(document.getElementById("originalPrice")?.value)||0;
  if(!phone){window.showToast("❌ يجب تسجيل رقم الواتساب في حسابك أولاً.","error");return;}
  const sellerName=(window.myProfile&&window.myProfile.name)||window.defaultName(auth.currentUser);
  const sellerMemberNo=(window.myProfile&&window.myProfile.memberNo)||null;
  const sellerUsername=(window.myProfile&&window.myProfile.username)||"";
  if(!title){window.showToast("الرجاء إدخال العنوان","warn");return;}
  if(priceType==="fixed" && (!price || isNaN(Number(price)))){window.showToast("الرجاء إدخال السعر أو اختيار (تواصل لمعرفة السعر)","warn");return;}
  if(!city){window.showToast("الرجاء اختيار المدينة","warn");return;}
  if(!wasEditing && !document.getElementById("termsCheck").checked){window.showToast("⚠️ يجب الموافقة على الشروط والتعهد القانوني قبل النشر","warn");return;}
  const bad=window.checkContent(title,description);
  if(bad){window.showToast(`❌ لا يمكن نشر الإعلان — يحتوي على كلمة ممنوعة (${bad.word})`,"error");return;}

  if(isStore && !window._tempStoreData){
    try{
      const saved=sessionStorage.getItem('_tempStoreData');
      if(saved) window._tempStoreData=JSON.parse(saved);
    }catch(e){}
  }
  const storeToUse=isStore && window._tempStoreData ? window._tempStoreData : window.myStore;
  if(!wasEditing){
    if(isStore){
      if(!storeToUse||storeToUse.status!=="approved"){window.showToast("❌ المتجر غير معتمد","error");return;}
      const stCount=window.allPosts.filter(p=>p.storeId===storeToUse.id).length;
      const storeLimit=await window.getUserStoreLimit(auth.currentUser.uid);
      if(stCount>=storeLimit && !window.isAdmin){window.showToast(`⚠️ وصلت للحد الأقصى للمتجر (${storeLimit})`,"warn");return;}
    }else{
      const myCount=window.allPosts.filter(p=>p.uid===auth.currentUser.uid && !p.storeId).length;
      const limit=await window.getUserLimit(auth.currentUser.uid);
      if(myCount>=limit && !window.isAdmin){window.showToast(`وصلت للحد الأقصى (${limit})`,"warn");return;}
    }
  }
  saveBtn.disabled=true;saveBtn.textContent=wasEditing?"جاري الحفظ...":"جاري النشر...";
  try{
    const images=[];
    for(const item of window.selectedImages){
      if(item.type==="existing")images.push(item.url);
      else{saveBtn.textContent="جاري رفع الصور...";images.push(await window.uploadToImgBB(item.file));}
    }
    const finalOriginalPrice=(priceType==="fixed" && originalPrice>Number(price))?originalPrice:0;
    if(wasEditing){
      const oldPost=window.allPosts.find(p=>p.id===window.editingPostId);
      const originalData=oldPost?{title:oldPost.title,price:oldPost.price,category:oldPost.category,brand:oldPost.brand||"",city:oldPost.city,description:oldPost.description||"",phone:oldPost.phone}:null;
      const newExpires=Date.now()+window.POST_DURATION_MS;
      const upd={title,price:priceType==="contact"?null:Number(price),priceType:priceType,negotiable:negotiable,originalPrice:finalOriginalPrice,category,brand,city,description,phone,images,adType,status:"pending",rejectReason:null,wasEdited:true,originalData,editedAt:Date.now(),expiresAt:newExpires,sold:false,soldAt:null};
      if(!oldPost.storeId){upd.sellerName=sellerName;upd.sellerMemberNo=sellerMemberNo;upd.sellerUsername=sellerUsername;}
      await updateDoc(doc(db,"posts",window.editingPostId),upd);
    }else{
      const now=Date.now();
      const base={title,price:priceType==="contact"?null:Number(price),priceType:priceType,negotiable:negotiable,originalPrice:finalOriginalPrice,category,brand,city,description,phone,images,adType,status:"pending",createdAt:now,expiresAt:now+window.POST_DURATION_MS,views:0,whatsappClicks:0,favoritesCount:0,featured:false,featuredUntil:0,featuredPlan:null,termsAcceptedAt:now,sold:false,soldAt:null};
      if(isStore){
        base.storeId=storeToUse.id;
        base.storeName=storeToUse.name;
        base.storeCategory=storeToUse.category;
        base.storePhone=storeToUse.phone||"";
        base.phone=storeToUse.phone||"";
        base.uid=storeToUse.ownerUid||auth.currentUser.uid;
        base.email=storeToUse.ownerEmail||auth.currentUser.email||"";
        base.addedBy=auth.currentUser.uid;
      }else{
        base.uid=auth.currentUser.uid;
        base.email=auth.currentUser.email||"";
        base.sellerName=sellerName;
        base.sellerMemberNo=sellerMemberNo;
        base.sellerUsername=sellerUsername;
      }
      await addDoc(collection(db,"posts"),base);
      window.showToast(isStore?"✅ تم إرسال إعلان المتجر بنجاح":"✅ تم إرسال إعلانك بنجاح","success");
      window.addPoints(auth.currentUser.uid, 10, '📝 نشر إعلان جديد', 'post_create');
    }
    window.editingPostId=null;
    window._tempStoreData=null;
    try{sessionStorage.removeItem('_tempStoreData');}catch(e){}
    document.getElementById("title").value="";
    document.getElementById("price").value="";
    document.getElementById("phone").value="";
    if(document.getElementById("originalPrice"))document.getElementById("originalPrice").value="";
    if(document.getElementById("discountPreview"))document.getElementById("discountPreview").textContent="";
    const _cCb2=document.getElementById("contactPrice");if(_cCb2)_cCb2.checked=false;
    const _nCb2=document.getElementById("negotiablePrice");if(_nCb2)_nCb2.checked=false;
    window.onPriceTypeChange();
    window.selectedImages=[];
    window.renderImagePicker();
    if(window.showOnlyMine){window.showMyPosts();}
    else if(window.currentCategory && window.currentCategory!=="الكل"){window.openCategory(window.currentCategory);}
    else{window.showCategoriesScreen();}
  }catch(e){window.showToast("خطأ أثناء الحفظ: "+e.message,"error");}
  finally{
    saveBtn.disabled=false;
    saveBtn.textContent=window.editingPostId?"حفظ التعديلات":"نشر الإعلان";
    window._tempStoreData=null;
    try{sessionStorage.removeItem('_tempStoreData');}catch(e){}
  }
};

window.editPost = function(id){
  if(!auth.currentUser)return;
  const post=window.allPosts.find(p=>p.id===id);
  if(!post)return;
  window.editingPostId=id;
  window._isStorePost=!!post.storeId;
  if(post.storeId){
    const data={id:post.storeId,name:post.storeName||"",category:post.storeCategory||post.category||"سيارات ومركبات",city:post.city||"",phone:post.storePhone||post.phone||"",status:"approved"};
    window._tempStoreData=data;
    try{sessionStorage.setItem('_tempStoreData',JSON.stringify(data));}catch(e){}
  }
  document.getElementById("formHeaderTitle").textContent=post.storeId?"تعديل إعلان المتجر":"تعديل الإعلان";
  document.getElementById("saveBtn").textContent="حفظ التعديلات";
  document.getElementById("title").value=post.title||"";
  document.getElementById("price").value=(post.priceType==="contact"?"":(post.price||""));
  const _cCbE=document.getElementById("contactPrice");if(_cCbE)_cCbE.checked=(post.priceType==="contact");
  const _nCbE=document.getElementById("negotiablePrice");if(_nCbE)_nCbE.checked=!!post.negotiable;
  document.getElementById("originalPrice").value=post.originalPrice||"";
  document.getElementById("discountField").style.display="block";
  setTimeout(()=>{window.updateDiscountPreview();},100);
  document.getElementById("category").value=post.category||"سيارات ومركبات";
  document.getElementById("city").value=post.city||"";
  const userPhone=(window.myProfile&&window.myProfile.phone)||post.phone||"";
  document.getElementById("phone").value=userPhone||"⚠️ لم تسجل رقمك بعد";
  document.getElementById("phone").setAttribute("readonly","readonly");
  document.getElementById("description").value=post.description||"";
  window.updateDescCount();
  document.getElementById("termsBox").classList.add("hidden");
  const adTypeVal=post.adType||"offer";
  const radio=document.querySelector(`input[name="adType"][value="${adTypeVal}"]`);
  if(radio)radio.checked=true;
  window.onAdTypeChange();
  window.onCategoryChange();
  if(post.brand)document.getElementById("brand").value=post.brand;
  const existing=(post.images&&post.images.length)?post.images:(post.imageUrl?[post.imageUrl]:[]);
  window.selectedImages=existing.map(url=>({type:"existing",url}));
  window.renderImagePicker();
  window.onPriceTypeChange();
  window.openFormScreen();
  window.scrollTo(0,0);
};

window.showForm = async function(isStorePost){
  if(!auth.currentUser){window.pendingAction="form";window.authOverlay.classList.remove("hidden");return;}
  const isStore=!!isStorePost;
  if(isStore && !window._tempStoreData){
    try{
      const saved=sessionStorage.getItem('_tempStoreData');
      if(saved) window._tempStoreData=JSON.parse(saved);
    }catch(e){}
  }
  const storeForPost=isStore && window._tempStoreData ? window._tempStoreData : window.myStore;
  if(isStore && (!storeForPost || storeForPost.status!=="approved")){window.showToast("⚠️ لا يمكنك النشر كمتجر — المتجر غير معتمد","warn");return;}
  if(!isStore && !window.isAdmin){
    const myCount=window.allPosts.filter(p=>p.uid===auth.currentUser.uid && !p.storeId).length;
    const limit=await window.getUserLimit(auth.currentUser.uid);
    if(myCount>=limit){
      const msg=`🛒 طلب إعلانات إضافية\n\n👤 ${(window.myProfile&&window.myProfile.name)||'مستخدم'}\n📊 ${myCount}\n⚙️ ${limit}`;
      const waUrl=`https://wa.me/${window.ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`;
      if(confirm(`⚠️ وصلت للحد (${limit})\n\nطلب زيادة الحد؟`))window.open(waUrl,'_blank');
      return;
    }
  }else if(isStore && !window.isAdmin){
    const stCount=window.allPosts.filter(p=>p.storeId===storeForPost.id).length;
    const storeLimit=await window.getUserStoreLimit(auth.currentUser.uid);
    if(stCount>=storeLimit){
      const msg=`🛒 طلب إعلانات المتجر\n\n🏪 ${storeForPost.name}\n📊 ${stCount}\n⚙️ ${storeLimit}`;
      const waUrl=`https://wa.me/${window.ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`;
      if(confirm(`⚠️ وصلت للحد (${storeLimit})\n\nطلب زيادة الحد؟`))window.open(waUrl,'_blank');
      return;
    }
  }
  window.editingPostId=null;
  window._isStorePost=isStore;
  const activeStore=isStore ? storeForPost : null;
  document.getElementById("formHeaderTitle").textContent=isStore?("🏪 إعلان جديد لـ "+activeStore.name):"إضافة إعلان";
  document.getElementById("saveBtn").textContent="نشر الإعلان";
  document.getElementById("title").value="";
  document.getElementById("price").value="";
  document.getElementById("originalPrice").value="";
  document.getElementById("discountPreview").textContent="";
  document.getElementById("discountField").style.display="block";
  const userPhone=(window.myProfile&&window.myProfile.phone)||"";
  document.getElementById("phone").value=userPhone||"⚠️ لم تسجل رقمك بعد";
  document.getElementById("phone").setAttribute("readonly","readonly");
  document.getElementById("city").value=(isStore?activeStore.city:"");
  document.getElementById("description").value="";
  document.getElementById("category").value=(isStore?activeStore.category:"سيارات ومركبات");
  document.getElementById("brand").value="";
  window.updateDescCount();
  document.getElementById("termsCheck").checked=false;
  document.getElementById("termsBox").classList.remove("hidden");
  const offerRadio=document.querySelector('input[name="adType"][value="offer"]');
  if(offerRadio)offerRadio.checked=true;
  window.onAdTypeChange();
  const _cCbS=document.getElementById("contactPrice");if(_cCbS)_cCbS.checked=false;
  const _nCbS=document.getElementById("negotiablePrice");if(_nCbS)_nCbS.checked=false;
  window.onPriceTypeChange();
  window.selectedImages=[];
  window.renderImagePicker();
  window.onCategoryChange();
  window.openFormScreen();
  window.scrollTo(0,0);
};

window.openFormScreen = function(){
  const _preserved=window._tempStoreData;
  window.home.classList.add("hidden");
  window.form.classList.remove("hidden");
  window.categoriesScreen.classList.add("hidden");
  window.closeOverlay();
  window._tempStoreData=_preserved;
  window.hideFloatingButtons();
};

window.startAddPost = async function(){
  if(!auth.currentUser){window.pendingAction="postType";window.authOverlay.classList.remove("hidden");return;}
  const hasApprovedStore=window.myStore && window.myStore.status==="approved";
  const storeBtn=document.getElementById("storePostBtn");
  const openStoreBtn=document.getElementById("openStoreFromPlusBtn");
  if(storeBtn)storeBtn.style.display=hasApprovedStore?"flex":"none";
  if(openStoreBtn)openStoreBtn.style.display=(!window.myStore)?"flex":"none";
  window.postTypeOverlay.classList.remove("hidden");
};
window.chooseOpenStoreFromPlus = function(){window.closeOverlay();setTimeout(()=>window.startOpenStore(),300);};
window.chooseIndividualPost = function(){
  if(window.myStore && window.myStore.status==="approved"){
    if(!confirm("⚠️ عندك متجر معتمد.\n\nلو كملت كإعلان فردي:\n• مش هيظهر في صفحة المتجر\n• هيتحسب من الحد الشخصي (3 إعلانات)\n\nلو عايز إعلان داخل متجرك، اختر (إعلان متجر).\n\nهل تريد المتابعة كإعلان فردي؟")){
      return;
    }
  }
  window.closeOverlay();
  window._tempStoreData=null;
  try{sessionStorage.removeItem('_tempStoreData');}catch(e){}
  window.showForm();
};
window.chooseStorePost = function(){
  window.closeOverlay();
  if(window.myStore && window.myStore.status==="approved"){
    const data={id:window.myStore.id,name:window.myStore.name,category:window.myStore.category,city:window.myStore.city,phone:window.myStore.phone||"",status:window.myStore.status};
    window._tempStoreData=data;
    try{sessionStorage.setItem('_tempStoreData',JSON.stringify(data));}catch(e){}
  }
  window.showForm(true);
};

window.renewPost = async function(id,event){
  if(event)event.stopPropagation();
  const p=window.allPosts.find(x=>x.id===id);
  if(!p)return;
  const me=auth.currentUser;
  if(!me)return;
  const isMyStorePost=window.myStore&&p.storeId===window.myStore.id;
  const isOwner=me.uid===p.uid||isMyStorePost;
  if(!isOwner && !window.isAdmin){window.showToast("❌ هذا الإعلان ليس لك","error");return;}
  const expired=window.isExpired(p);
  const msg=expired?"⏰ هذا الإعلان منتهي. هل تريد تجديده 30 يوم إضافية؟":"🔄 هل تريد تمديد الإعلان 30 يوم إضافية؟";
  if(!confirm(msg))return;
  try{
    const now=Date.now();
    const currentExpires=window.getExpiresAt(p)||now;
    const base=currentExpires>now?currentExpires:now;
    const newExpires=base+window.POST_DURATION_MS;
    await updateDoc(doc(db,"posts",id),{expiresAt:newExpires,status:"pending",rejectReason:null});
    window.showToast("✅ تم التجديد 30 يوم إضافية","success");
  }catch(e){window.showToast("خطأ: "+e.message,"error");}
};

window.toggleSold = async function(id,event){
  if(event)event.stopPropagation();
  const p=window.allPosts.find(x=>x.id===id);
  if(!p)return;
  const me=auth.currentUser;
  if(!me)return;
  const isMyStorePost=window.myStore&&p.storeId===window.myStore.id;
  const isOwner=me.uid===p.uid||isMyStorePost;
  if(!isOwner && !window.isAdmin){window.showToast("❌ هذا الإعلان ليس لك","error");return;}
  const newSold=!p.sold;
  const msg=newSold?"✅ تم بيع المنتج؟":"↩️ إلغاء حالة (تم البيع)؟";
  if(!confirm(msg))return;
  try{
    await updateDoc(doc(db,"posts",id),{sold:newSold,soldAt:newSold?Date.now():null});
    if(newSold && window.cart.items.some(i=>i.postId===id)){
      window.cart.items=window.cart.items.filter(i=>i.postId!==id);
      if(window.cart.items.length===0){window.cart.storeId=null;window.cart.storeName="";window.cart.storePhone="";}
      window.saveCart();window.updateCartUI();
    }
    window.showToast(newSold?"✅ تم وضع علامة (تم البيع)":"✅ تم إلغاء العلامة","success");
  }catch(e){window.showToast("خطأ: "+e.message,"error");}
};

window.deletePost = async function(id){
  if(!confirm("حذف هذا الإعلان؟"))return;
  try{
    if(window.cart.items.some(i=>i.postId===id)){
      window.cart.items=window.cart.items.filter(i=>i.postId!==id);
      if(window.cart.items.length===0){window.cart.storeId=null;window.cart.storeName="";window.cart.storePhone="";}
      window.saveCart();window.updateCartUI();
    }
    await deleteDoc(doc(db,"posts",id));
  }catch(e){window.showToast("خطأ: "+e.message,"error");}
};

/* ============================================================
   Moderation
   ============================================================ */
window.approvePost = async function(id){
  if(!window.isAdmin)return;
  try{
    const post=window.allPosts.find(p=>p.id===id);
    await updateDoc(doc(db,"posts",id),{status:"approved",approvedAt:Date.now(),rejectReason:null,originalData:null,wasEdited:false});
    if(post && post.uid){ window.addPoints(post.uid, 5, '✅ تمت الموافقة على إعلانك', 'post_approved'); }
    window.showToast("✅ تم قبول الإعلان","success");
    window.closeOverlay();
  }catch(e){window.showToast("خطأ: "+e.message,"error");}
};

window.rejectPost = async function(id){
  if(!window.isAdmin)return;
  const reason=prompt("سبب الرفض:","محتوى غير مناسب");
  if(reason===null)return;
  try{
    await updateDoc(doc(db,"posts",id),{status:"rejected",rejectReason:reason||"محتوى غير مناسب",rejectedAt:Date.now()});
    window.showToast("✅ تم رفض الإعلان","success");
    window.closeOverlay();
  }catch(e){window.showToast("خطأ: "+e.message,"error");}
};

window.toggleFeatured = async function(id,event){
  if(event)event.stopPropagation();
  if(!window.isAdmin)return;
  const p=window.allPosts.find(x=>x.id===id);
  if(!p)return;
  const isFeat=window.isPostFeatured(p);
  if(!confirm(isFeat?"إلغاء التمييز؟":"تمييز الإعلان 7 أيام مجاناً؟"))return;
  try{
    if(isFeat){await updateDoc(doc(db,"posts",id),{featured:false,featuredUntil:0,featuredPlan:null});}
    else{await updateDoc(doc(db,"posts",id),{featured:true,featuredUntil:Date.now()+7*24*60*60*1000,featuredPlan:"admin"});}
    window.showToast("✅ تم","success");
  }catch(e){window.showToast("خطأ: "+e.message,"error");}
};

window.adminFeature = async function(id,days){
  if(!window.isAdmin)return;
  try{
    if(days===0){await updateDoc(doc(db,"posts",id),{featured:false,featuredUntil:0,featuredPlan:null});}
    else{await updateDoc(doc(db,"posts",id),{featured:true,featuredUntil:Date.now()+days*24*60*60*1000,featuredPlan:"admin",featuredBy:"admin"});}
    window.showToast("✅ تم تفعيل التمييز","success");
    window.closeOverlay();
  }catch(e){window.showToast("خطأ: "+e.message,"error");}
};

window.renderModeration = function(){
  const list=document.getElementById("moderationList");
  if(!list)return;
  const pending=window.allPosts.filter(p=>window.getStatus(p)==="pending");
  if(pending.length===0){list.innerHTML="<div class='reportsEmpty'>🎉 لا توجد إعلانات قيد المراجعة</div>";return;}
  const toolbar=`<div style="background:#eff6ff;border:1px solid #3b82f6;border-radius:12px;padding:12px;margin-bottom:12px"><div style="font-weight:800;color:#1e40af;margin-bottom:10px;font-size:14px">📊 يوجد ${pending.length} إعلان بانتظار المراجعة</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button onclick="approveAllPending()" style="padding:11px;border:none;border-radius:10px;background:#16a34a;color:#fff;font-family:inherit;font-size:13.5px;font-weight:800;cursor:pointer">✅ موافقة على الكل</button><button onclick="deleteAllPending()" style="padding:11px;border:none;border-radius:10px;background:#e5484d;color:#fff;font-family:inherit;font-size:13.5px;font-weight:800;cursor:pointer">❌ رفض الكل</button></div></div>`;
  const items=pending.map(p=>{
    const imgs=window.getImages(p);
    const imgsHtml=imgs.length?`<div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px">${imgs.map(u=>`<img src="${window.escapeHtml(u)}" style="width:130px;height:130px;border-radius:10px;object-fit:cover;flex:0 0 auto;border:1px solid var(--border)">`).join("")}</div>`:`<div style="padding:20px;text-align:center;color:var(--muted);background:#e6f6fe;border-radius:10px;font-size:13px">🖼️ لا توجد صور</div>`;
    const days=window.daysLeft(p);
    const expiryInfo=days!=null?`<div style="font-size:11.5px;font-weight:800;margin-top:8px;color:${days<=0?'#b91c1c':days<=5?'#92400e':'#166534'}">${days<=0?'⏰ منتهي':('⏳ باقي '+days+' يوم')}</div>`:"";
    const tags=(p.storeId?("🏪 "+window.escapeHtml(p.storeName||"متجر")):((p.sellerMemberNo?"· #"+p.sellerMemberNo:"")+(p.sellerUsername?" · @"+window.escapeHtml(p.sellerUsername):"")));
    const adTypeBadge=window.isWanted(p)?`<span style="background:#fff7ed;color:#9a3412;font-weight:800;padding:3px 9px;border-radius:7px;font-size:11.5px">🎯 مطلوب</span>`:`<span style="background:#e6f6fe;color:#0284c7;font-weight:800;padding:3px 9px;border-radius:7px;font-size:11.5px">🛒 معروض</span>`;
    const priceTxt=p.priceType==="contact"?"📞 تواصل لمعرفة السعر":(p.price!=null?window.formatPrice(p.price)+" د.ل":"");
    return `<div style="border:2px dashed #f59e0b;border-radius:14px;padding:12px;margin-bottom:14px;background:#fffbf0">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">${adTypeBadge}<span style="font-size:11.5px;color:var(--muted)">${window.timeAgo(p.createdAt)}</span></div>
<div style="font-weight:800;font-size:16px;margin-bottom:6px;line-height:1.4">${window.escapeHtml(p.title||"بدون عنوان")}</div>
<div style="font-weight:800;font-size:18px;color:var(--teal-dark);margin-bottom:10px">${priceTxt}</div>
${imgsHtml}
<div style="background:#fff;padding:12px;border-radius:10px;margin-top:10px;font-size:13.5px;line-height:1.9;white-space:pre-wrap;word-break:break-word;border:1px solid var(--border)">${window.escapeHtml(p.description||"لا يوجد وصف")}</div>
<div style="font-size:12px;color:var(--muted);margin-top:10px;line-height:1.8;background:#fff;padding:8px 10px;border-radius:8px;border:1px solid var(--border)">📁 ${window.escapeHtml(p.category||"")} ${p.brand?"· 🏷️ "+window.escapeHtml(p.brand):""}<br>📍 ${window.escapeHtml(p.city||"")}<br>${p.storeId?"🏪":""} ${p.storeId?window.escapeHtml(p.storeName||"متجر"):window.escapeHtml(p.sellerName||"البائع")} ${tags} · ☎️ ${window.escapeHtml(p.phone||"")}</div>
${expiryInfo}
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:12px">
<button onclick="approvePost('${p.id}');setTimeout(renderModeration,400)" style="padding:12px 4px;border:none;border-radius:9px;background:#16a34a;color:#fff;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer">✅ موافقة</button>
<button onclick="rejectPost('${p.id}');setTimeout(renderModeration,400)" style="padding:12px 4px;border:none;border-radius:9px;background:#e5484d;color:#fff;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer">❌ رفض</button>
<button onclick="closeOverlay();setTimeout(()=>openPost('${p.id}'),300)" style="padding:12px 4px;border:none;border-radius:9px;background:#0284c7;color:#fff;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer">👁️ عرض</button>
</div></div>`;
  }).join("");
  list.innerHTML=toolbar+items;
};

window.approveAllPending = async function(){
  if(!window.isAdmin)return;
  const pending=window.allPosts.filter(p=>window.getStatus(p)==="pending");
  if(pending.length===0){window.showToast("لا توجد إعلانات","info");return;}
  if(!confirm(`موافقة على ${pending.length} إعلان؟`))return;
  let ok=0,fail=0;
  for(const p of pending){
    try{await updateDoc(doc(db,"posts",p.id),{status:"approved",approvedAt:Date.now(),rejectReason:null,originalData:null,wasEdited:false});ok++;}
    catch(e){fail++;}
  }
  window.showToast(`✅ تم قبول ${ok}`,"success");
  window.renderModeration();
};

window.deleteAllPending = async function(){
  if(!window.isAdmin)return;
  const pending=window.allPosts.filter(p=>window.getStatus(p)==="pending");
  if(pending.length===0){window.showToast("لا توجد","info");return;}
  if(!confirm(`رفض ${pending.length} إعلان؟`))return;
  const reason=prompt("سبب الرفض:","محتوى غير مناسب");
  if(reason===null)return;
  let ok=0;
  for(const p of pending){
    try{await updateDoc(doc(db,"posts",p.id),{status:"rejected",rejectReason:reason||"محتوى غير مناسب",rejectedAt:Date.now()});ok++;}
    catch(e){}
  }
  window.showToast(`✅ تم رفض ${ok}`,"success");
  window.renderModeration();
};

window.updateModBadge = function(){
  if(!window.isAdmin||!window.moderationBtn)return;
  const c=window.allPosts.filter(p=>window.getStatus(p)==="pending").length;
  window.moderationBtn.textContent=c>0?`⏳ الإعلانات قيد المراجعة (${c})`:"⏳ الإعلانات قيد المراجعة";
};

/* ============================================================
   Reports
   ============================================================ */
window.reportPost = async function(id){
  if(!auth.currentUser){window.pendingAction={type:"report",postId:id};window.authOverlay.classList.remove("hidden");return;}
  const reason=prompt("سبب الإبلاغ (اختياري):");
  if(reason===null)return;
  try{
    const post=window.allPosts.find(p=>p.id===id);
    await addDoc(collection(db,"reports"),{postId:id,postTitle:post?post.title:"",reason:reason||"",reporterEmail:auth.currentUser.email||"",reporterUid:auth.currentUser.uid,createdAt:Date.now()});
    window.showToast("تم إرسال الإبلاغ، شكراً لك","success");
  }catch(e){window.showToast("تعذر إرسال الإبلاغ: "+e.message,"error");}
};

window.startReportsListener = function(){
  onSnapshot(collection(db,"reports"),snap=>{
    window.allReports=snap.docs.map(d=>({id:d.id,...d.data()}));
    window.allReports.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    window.renderReports();
    if(window.reportsBtn) window.reportsBtn.textContent=window.allReports.length?`🚩 الإبلاغات (${window.allReports.length})`:"🚩 الإبلاغات";
  });
};

window.renderReports = function(){
  const list=document.getElementById("reportsList");
  if(!list)return;
  if(window.allReports.length===0){list.innerHTML="<div class='reportsEmpty'>✅ لا توجد إبلاغات</div>";return;}
  const toolbar=`<div style="background:#fdeceb;border:1px solid #e5484d;border-radius:12px;padding:12px;margin-bottom:12px"><div style="font-weight:800;color:#b91c1c;margin-bottom:10px;font-size:14px">🚩 يوجد ${window.allReports.length} إبلاغ</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button onclick="dismissAllReports()" style="padding:11px 4px;border:none;border-radius:10px;background:#8a93a3;color:#fff;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer">🗑️ تجاهل الكل</button><button onclick="deleteAllReportedPosts()" style="padding:11px 4px;border:none;border-radius:10px;background:#e5484d;color:#fff;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer">❌ حذف الكل</button></div></div>`;
  const items=window.allReports.map(r=>{
    const p=window.allPosts.find(x=>x.id===r.postId);
    const imgs=p?window.getImages(p):[];
    const imgsHtml=imgs.length?`<div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px">${imgs.map(u=>`<img src="${window.escapeHtml(u)}" style="width:130px;height:130px;border-radius:10px;object-fit:cover;flex:0 0 auto;border:1px solid var(--border)">`).join("")}</div>`:"";
    const postInfo=p?`<div style="font-weight:800;font-size:16px;margin-bottom:6px">${window.escapeHtml(p.title||"بدون عنوان")}</div>${imgsHtml}`:`<div style="text-align:center;padding:20px;color:var(--muted);background:#fdeceb;border-radius:10px">⚠️ الإعلان محذوف</div>`;
    const safePid=window.escapeHtml(r.postId||"");
    const safeRid=window.escapeHtml(r.id||"");
    return `<div style="border:2px solid #e5484d;border-radius:14px;padding:12px;margin-bottom:14px;background:#fff"><div style="background:#fdeceb;color:#b91c1c;padding:8px 12px;border-radius:10px;font-size:12.5px;font-weight:800;margin-bottom:12px">🚩 <b>سبب:</b> ${window.escapeHtml(r.reason||"بدون سبب")}<br><b>من:</b> ${window.escapeHtml(r.reporterEmail||"زائر")} · ${window.timeAgo(r.createdAt)}</div>${postInfo}<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:12px"><button style="padding:12px 4px;border:none;border-radius:9px;background:#fdeceb;color:var(--danger);font-family:inherit;font-size:13px;font-weight:800;cursor:pointer" onclick="deleteReportedPost('${safePid}','${safeRid}')">🗑️ حذف</button><button style="padding:12px 4px;border:none;border-radius:9px;background:var(--bg);color:var(--muted);font-family:inherit;font-size:13px;font-weight:800;cursor:pointer" onclick="dismissReport('${safeRid}')">👁️ تجاهل</button><button style="padding:12px 4px;border:none;border-radius:9px;background:#e0f2fe;color:#0369a1;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer" onclick="closeOverlay();setTimeout(()=>openPost('${safePid}'),300)">📄 عرض</button></div></div>`;
  }).join("");
  list.innerHTML=toolbar+items;
};

window.dismissAllReports = async function(){
  if(!window.isAdmin)return;
  if(window.allReports.length===0){window.showToast("لا توجد","info");return;}
  if(!confirm(`تجاهل ${window.allReports.length} إبلاغ؟`))return;
  let ok=0;
  for(const r of window.allReports){try{await deleteDoc(doc(db,"reports",r.id));ok++;}catch(e){}}
  window.showToast(`✅ تم تجاهل ${ok}`,"success");
  window.renderReports();
};
window.deleteAllReportedPosts = async function(){
  if(!window.isAdmin)return;
  if(window.allReports.length===0){window.showToast("لا توجد","info");return;}
  const ids=[...new Set(window.allReports.map(r=>r.postId).filter(x=>x))];
  if(!confirm(`حذف ${ids.length} إعلان؟`))return;
  const c=prompt('اكتب "حذف" للتأكيد:');
  if(c!=="حذف"){window.showToast("تم الإلغاء","info");return;}
  let okP=0,okR=0;
  for(const pid of ids){try{await deleteDoc(doc(db,"posts",pid));okP++;}catch(e){}}
  for(const r of window.allReports){try{await deleteDoc(doc(db,"reports",r.id));okR++;}catch(e){}}
  window.showToast(`✅ حذف ${okP} إعلان + ${okR} إبلاغ`,"success");
  window.renderReports();
};
window.dismissReport = async function(id){try{await deleteDoc(doc(db,"reports",id));}catch(e){window.showToast("خطأ: "+e.message,"error");}};
window.deleteReportedPost = async function(pid,rid){
  if(!confirm("حذف الإعلان؟"))return;
  try{await deleteDoc(doc(db,"posts",pid));await deleteDoc(doc(db,"reports",rid));}
  catch(e){window.showToast("خطأ: "+e.message,"error");}
};
window.openReports = function(){
  window.renderReports();
  window.reportsOverlay.classList.remove("hidden");
  window.accountOverlay.classList.add("hidden");
};
window.openModeration = function(){
  window.renderModeration();
  window.moderationOverlay.classList.remove("hidden");
  window.accountOverlay.classList.add("hidden");
};

/* ============================================================
   Limits Admin
   ============================================================ */
window.openLimits = function(){
  if(!window.isAdmin)return;
  window.renderLimits();
  if(!window.limitsListenerStarted){
    window.limitsListenerStarted=true;
    onSnapshot(collection(db,"userLimits"),snap=>{
      window.allLimits=snap.docs.map(d=>({uid:d.id,...d.data()}));
      window.allLimits.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
      window.renderLimits();
    });
  }
  window.limitsOverlay.classList.remove("hidden");
  window.accountOverlay.classList.add("hidden");
};

window.renderLimits = function(){
  const list=document.getElementById("limitsList");
  if(!list)return;
  if(window.allLimits.length===0){list.innerHTML="<div class='reportsEmpty'>لا توجد حدود مخصصة بعد<br><span style='font-size:12px'>الحد الافتراضي: 3 إعلانات فردية · 20 إعلان متجر</span></div>";return;}
  list.innerHTML=window.allLimits.map(l=>{
    const storeLimit=l.storeLimit||20;
    return `<div class="reportItem" style="background:#f0f9ff;border-color:#0ea5e9"><div class="rTitle">👤 ${window.escapeHtml(l.name||"مستخدم")} ${l.username?`<span class="usernameBadge" style="margin-right:6px">@${window.escapeHtml(l.username)}</span>`:""} ${l.memberNo?`<span class="memberNoBadge" style="margin-right:6px">#${l.memberNo}</span>`:""}</div><div class="rMeta"><b>📋 فردي:</b> <span style="color:#0284c7;font-weight:800;font-size:15px">${l.limit}</span> إعلان<br><b>🏪 متجر:</b> <span style="color:#92400e;font-weight:800;font-size:15px">${storeLimit}</span> منتج</div><div class="rActions" style="grid-template-columns:1fr 1fr"><button class="rDismiss" style="background:#e0f2fe;color:#0369a1" onclick="editLimit('${window.escapeHtml(l.uid)}')">✏️ تعديل</button><button class="rDelete" onclick="removeLimit('${window.escapeHtml(l.uid)}')">🗑️ إلغاء</button></div></div>`;
  }).join("");
};

window.editLimit = function(uid){
  const l=window.allLimits.find(x=>x.uid===uid);
  if(!l)return;
  document.getElementById("limitSearch").value=l.username?l.username:(l.memberNo?String(l.memberNo):(l.email||""));
  document.getElementById("limitNumber").value=l.limit||3;
  document.getElementById("storeLimitNumber").value=l.storeLimit||20;
};

window.removeLimit = async function(uid){
  if(!confirm("إلغاء الحد المخصص؟"))return;
  try{
    await deleteDoc(doc(db,"userLimits",uid));
    delete window.userLimitsCache[uid];
    window.showToast("✅ تم الإلغاء","success");
  }catch(e){window.showToast("خطأ: "+e.message,"error");}
};

window.findUserByAny = async function(search){
  const s=String(search||"").trim();
  if(!s)return null;
  const clean=s.replace(/^@/,"").toLowerCase();
  try{
    const u=await getDoc(doc(db,"usernames",clean));
    if(u.exists())return{uid:u.data().uid};
  }catch(e){}
  const num=parseInt(s,10);
  if(!isNaN(num)){
    try{
      const q=query(collection(db,"profiles"),where("memberNo","==",num));
      const snap=await getDocs(q);
      if(!snap.empty)return{uid:snap.docs[0].id};
    }catch(e){}
  }
  return null;
};

window.applyUserLimit = async function(){
  if(!window.isAdmin)return;
  const search=document.getElementById("limitSearch").value.trim();
  const limitNum=parseInt(document.getElementById("limitNumber").value,10);
  const storeLimitNum=parseInt(document.getElementById("storeLimitNumber").value,10);
  if(!search){window.showToast("❌ اكتب اسم المستخدم أو الرقم","error");return;}
  if(!limitNum||limitNum<1||limitNum>999){window.showToast("❌ الحد الفردي غير صحيح","error");return;}
  if(!storeLimitNum||storeLimitNum<1||storeLimitNum>999){window.showToast("❌ حد المتجر غير صحيح","error");return;}
  const found=await window.findUserByAny(search);
  if(!found){window.showToast("❌ لم يتم العثور على المستخدم","error");return;}
  let prof=null;
  try{const p=await getDoc(doc(db,"profiles",found.uid));if(p.exists())prof=p.data();}catch(e){}
  const ok=await window.setUserLimit(found.uid,limitNum,{email:"",name:(prof&&prof.name)||"",username:(prof&&prof.username)||"",memberNo:(prof&&prof.memberNo)||null,storeLimit:storeLimitNum});
  if(ok){
    window.showToast(`✅ تم تحديد الحد: فردي ${limitNum} · متجر ${storeLimitNum}`,"success");
    document.getElementById("limitSearch").value="";
    document.getElementById("limitNumber").value="";
    document.getElementById("storeLimitNumber").value="";
  }else window.showToast("❌ فشل الحفظ","error");
};

/* ============================================================
   Expired
   ============================================================ */
window.openExpired = function(){
  if(!window.isAdmin)return;
  window.accountOverlay.classList.add("hidden");
  window.expiredOverlay.classList.remove("hidden");
  window.renderExpiredList();
};

window.autoDeleteOldExpired = async function(){
  if(!window.isAdmin)return;
  try{
    const toDelete=window.allPosts.filter(p=>window.expiredGracePassed(p));
    if(toDelete.length===0)return;
    let ok=0;
    for(const p of toDelete){try{await deleteDoc(doc(db,"posts",p.id));ok++;}catch(e){}}
  }catch(e){}
};

window.renderExpiredList = function(){
  const list=document.getElementById("expiredList");
  if(!list)return;
  const expired=window.allPosts.filter(p=>window.isExpired(p));
  if(expired.length===0){list.innerHTML="<div class='reportsEmpty'>✅ لا توجد إعلانات منتهية</div>";return;}
  expired.sort((a,b)=>(window.getExpiresAt(a)||0)-(window.getExpiresAt(b)||0));
  const toolbar=`<div style="background:#fdeceb;border:1px solid #e5484d;border-radius:12px;padding:12px;margin-bottom:12px"><div style="font-weight:800;color:#b91c1c;margin-bottom:10px;font-size:14px">⏰ يوجد ${expired.length} إعلان منتهي</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button onclick="deleteAllExpired()" style="padding:11px;border:none;border-radius:10px;background:#e5484d;color:#fff;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer">🗑️ حذف الكل</button><button onclick="deleteAutoReadyExpired()" style="padding:11px;border:none;border-radius:10px;background:#8a93a3;color:#fff;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer">⏰ حذف 7+ أيام</button></div></div>`;
  const items=expired.map(p=>{
    const days=window.daysLeft(p);
    const sinceExpired=Math.abs(days);
    const autoReady=window.expiredGracePassed(p);
    const imgs=window.getImages(p);
    const th=imgs[0]||"";
    const owner=p.storeId?(p.storeName||"متجر"):(p.sellerName||"بائع");
    return `<div style="border:2px solid ${autoReady?'#e5484d':'#f59e0b'};border-radius:12px;padding:10px;margin-bottom:10px;background:${autoReady?'#fdeceb':'#fffbf0'};display:flex;gap:10px;align-items:center"><div style="width:60px;height:60px;border-radius:10px;overflow:hidden;background:var(--teal-light);flex:0 0 auto">${th?`<img src="${window.escapeHtml(th)}" style="width:100%;height:100%;object-fit:cover">`:""}</div><div style="flex:1;min-width:0"><div style="font-weight:800;font-size:13.5px;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${window.escapeHtml(p.title||"بدون عنوان")}</div><div style="font-size:11px;color:var(--muted);line-height:1.6">👤 ${window.escapeHtml(owner)}<br>⏰ ${sinceExpired} يوم مضى</div></div><button onclick="deleteExpiredPost('${p.id}')" style="padding:8px 10px;border:none;border-radius:8px;background:#e5484d;color:#fff;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer">🗑️</button></div>`;
  }).join("");
  list.innerHTML=toolbar+items;
};

window.deleteExpiredPost = async function(id){
  if(!window.isAdmin)return;
  if(!confirm("حذف هذا الإعلان؟"))return;
  try{await deleteDoc(doc(db,"posts",id));window.renderExpiredList();}
  catch(e){window.showToast("خطأ: "+e.message,"error");}
};
window.deleteAllExpired = async function(){
  if(!window.isAdmin)return;
  const expired=window.allPosts.filter(p=>window.isExpired(p));
  if(expired.length===0){window.showToast("لا توجد","info");return;}
  if(!confirm(`حذف ${expired.length}؟`))return;
  const c=prompt('اكتب "حذف":');
  if(c!=="حذف"){return;}
  let ok=0;
  for(const p of expired){try{await deleteDoc(doc(db,"posts",p.id));ok++;}catch(e){}}
  window.showToast(`✅ تم حذف ${ok}`,"success");
  window.renderExpiredList();
};
window.deleteAutoReadyExpired = async function(){
  if(!window.isAdmin)return;
  const ready=window.allPosts.filter(p=>window.expiredGracePassed(p));
  if(ready.length===0){window.showToast("لا توجد","info");return;}
  if(!confirm(`حذف ${ready.length}؟`))return;
  let ok=0;
  for(const p of ready){try{await deleteDoc(doc(db,"posts",p.id));ok++;}catch(e){}}
  window.showToast(`✅ ${ok}`,"success");
  window.renderExpiredList();
};

/* ============================================================
   Dashboard
   ============================================================ */
window.openDashboard = async function(){
  if(!window.isAdmin)return;
  const box=document.getElementById("dashboardContent");
  box.innerHTML='<div class="reportsEmpty">جاري التحميل...</div>';
  document.getElementById("dashboardOverlay").classList.remove("hidden");
  window.accountOverlay.classList.add("hidden");
  try{
    const totalPosts=window.allPosts.length;
    const approved=window.allPosts.filter(p=>window.getStatus(p)==="approved").length;
    const pending=window.allPosts.filter(p=>window.getStatus(p)==="pending").length;
    const rejected=window.allPosts.filter(p=>window.getStatus(p)==="rejected").length;
    const soldCount=window.allPosts.filter(p=>p.sold).length;
    const expiredCount=window.allPosts.filter(p=>window.isExpired(p)).length;
    const featuredCount=window.allPosts.filter(p=>window.isPostFeatured(p)).length;
    const totalViews=window.allPosts.reduce((s,p)=>s+(p.views||0),0);
    const totalWa=window.allPosts.reduce((s,p)=>s+(p.whatsappClicks||0),0);
    const totalFavs=window.allPosts.reduce((s,p)=>s+(p.favoritesCount||0),0);
    const totalStores=window.allStores.length;
    const approvedStores=window.allStores.filter(s=>s.status==="approved").length;
    const pendingStores=window.allStores.filter(s=>s.status==="pending").length;
    const verifiedStores=window.allStores.filter(s=>s.verified).length;
    const totalReports=window.allReports.length;
    const cityCount={};
    window.allPosts.filter(p=>window.getStatus(p)==="approved").forEach(p=>{if(p.city)cityCount[p.city]=(cityCount[p.city]||0)+1;});
    const topCities=Object.entries(cityCount).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const catCount={};
    window.allPosts.filter(p=>window.getStatus(p)==="approved").forEach(p=>{if(p.category)catCount[p.category]=(catCount[p.category]||0)+1;});
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
      ${topCities.length?topCities.map(([c,n])=>`<div class="dashList"><span>${window.escapeHtml(c)}</span><b>${n} إعلان</b></div>`).join(""):'<div class="dashList"><span>لا توجد بيانات</span></div>'}
      <div style="font-weight:800;margin:16px 0 8px;font-size:14px">📁 أكثر الأقسام</div>
      ${topCats.length?topCats.map(([c,n])=>`<div class="dashList"><span>${window.escapeHtml(c)}</span><b>${n} إعلان</b></div>`).join(""):'<div class="dashList"><span>لا توجد بيانات</span></div>'}
    `;
  }catch(e){
    box.innerHTML=`<div class="reportsEmpty">❌ خطأ: ${window.escapeHtml(e.message)}</div>`;
  }
};

/* ============================================================
   Notifications Admin
   ============================================================ */
window.openSendNotification = function(){
  if(!window.isAdmin)return;
  document.getElementById("notifTitle").value="";
  document.getElementById("notifMessage").value="";
  document.getElementById("notifLink").value="";
  document.getElementById("sendNotifOverlay").classList.remove("hidden");
  window.accountOverlay.classList.add("hidden");
};

window.submitNotification = async function(){
  if(!window.isAdmin)return;
  const title=document.getElementById("notifTitle").value.trim();
  const message=document.getElementById("notifMessage").value.trim();
  const link=document.getElementById("notifLink").value.trim();
  if(!title||!message){window.showToast("⚠️ اكتب العنوان والرسالة","warn");return;}
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
    window.showToast("✅ تم إرسال الإشعار للمستخدمين بنجاح","success");
    window.closeOverlay();
  }catch(e){window.showToast("❌ خطأ: "+e.message,"error");}
  finally{btn.disabled=false;btn.textContent="📤 إرسال الإشعار الآن";}
};

/* ============================================================
   Upgrade
   ============================================================ */
window.openUpgrade = function(id){
  if(!auth.currentUser)return;
  window.postOverlay.classList.add("hidden");
  window.upgradeOverlay.classList.remove("hidden");
  window._upgradePostId=id;
};
window.selectPlan = function(days,label,price){
  const id=window._upgradePostId;
  const p=window.allPosts.find(x=>x.id===id);
  if(!p)return;
  const link=`${window.location.origin}${window.location.pathname}#post-${id}?plan=${days}&price=${price}`;
  const msg=`🛒 طلب ترقية إعلان\n\n📌 الإعلان: ${p.title||'بدون عنوان'}\n📦 الباقة: ${label}\n💵 المبلغ: ${price} د.ل\n🔗 الرابط: ${link}`;
  const waUrl=`https://wa.me/${window.ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl,'_blank');
  setTimeout(()=>{window.closeOverlay();window.showToast("✅ بعد الدفع، اضغط الرابط","info");},400);
};
window.tryApplyPendingUpgrade = function(){
  if(!window.pendingAutoUpgrade)return;
  if(!window.isAdmin)return;
  const d=window.pendingAutoUpgrade;
  window.pendingAutoUpgrade=null;
  setTimeout(()=>{
    const p=window.allPosts.find(x=>x.id===d.postId);
    if(!p){window.showToast("⚠️ الإعلان غير موجود","warn");history.replaceState(null,'',window.location.pathname);return;}
    const cm=`⭐ تفعيل الترقية\n\n📌 ${p.title}\n📦 ${d.days} يوم\n💵 ${d.price} د.ل\n\nهل تأكدت من استلام المبلغ؟`;
    if(confirm(cm)){window.adminFeature(d.postId,d.days);history.replaceState(null,'',window.location.pathname);}
    else{history.replaceState(null,'',window.location.pathname);}
  },1200);
};

/* ============================================================
   Cart UI
   ============================================================ */
window.canHaveCart = function(post){
  if(!post)return false;
  if(!post.storeId)return false;
  if(post.category==="سيارات ومركبات")return false;
  if(post.category==="دراجات نارية")return false;
  return window.CART_ALLOWED_CATEGORIES.includes(post.category);
};

window.updateCartUI = function(){
  const cnt=window.cartTotalCount();
  const hc=document.getElementById("cartHeaderCount");
  if(hc)hc.textContent=cnt;
  if(hc)hc.style.display=cnt>0?"flex":"none";
  const fab=document.getElementById("cartFAB");
  const fabCnt=document.getElementById("cartFABcount");
  if(fabCnt)fabCnt.textContent=cnt;
  if(fab){
    if(window.cart.storeId && cnt>0){fab.classList.remove("fabOff");}
    else{fab.classList.add("fabOff");}
  }
  document.querySelectorAll(".cartAddBtn").forEach(btn=>{
    const id=btn.dataset.id;
    const inCart=window.cart.items.some(i=>i.postId===id);
    if(inCart){btn.classList.add("added");btn.innerHTML="✅ في السلة";}
    else{btn.classList.remove("added");btn.innerHTML="🛒 أضف للسلة";}
  });
};

window.openCart = function(){
  window.renderCartUI();
  window.cartOverlay.classList.remove("hidden");
};

window.renderCartUI = function(){
  const box=document.getElementById("cartItemsBox");
  const storeLine=document.getElementById("cartStoreLine");
  const storeNameEl=document.getElementById("cartStoreName");
  const totalBox=document.getElementById("cartTotalBox");
  const totalEl=document.getElementById("cartTotal");
  const itemsCountEl=document.getElementById("cartItemsCount");
  const sendBtn=document.getElementById("cartSendBtn");
  const callBtn=document.getElementById("cartCallBtn");
  const clearBtn=document.getElementById("cartClearBtn");
  if(!box)return;
  if(window.cart.items.length===0){
    if(storeLine)storeLine.style.display="none";
    box.innerHTML=`<div class="cartEmptyBox"><div class="icon">🛒</div><div style="font-weight:700;font-size:15px">سلتك فاضية</div><div style="font-size:12.5px;margin-top:6px">أضف منتجات من أي متجر لتظهر هنا</div></div>`;
    if(totalBox)totalBox.style.display="none";
    if(sendBtn)sendBtn.classList.add("hidden");
    if(callBtn)callBtn.classList.add("hidden");
    if(clearBtn)clearBtn.classList.add("hidden");
    return;
  }
  const store=window.allStores.find(s=>s.id===window.cart.storeId);
  const isRestaurant=window.isRestaurantStore(store);
  if(storeLine){storeLine.style.display="flex";storeLine.classList.toggle("restaurant",isRestaurant);}
  if(storeNameEl)storeNameEl.textContent=(isRestaurant?"🍽️ ":"")+(window.cart.storeName||"");
  box.innerHTML=window.cart.items.map(item=>{
    const qty=item.qty||1;
    return `<div class="cartItemRow"><img class="cImg" src="${window.escapeHtml(item.image||"")}" onerror="this.style.background='#e6f6fe';this.src=''"><div class="cInfo"><div class="cTitle">${window.escapeHtml(item.title||"منتج")}</div><div class="cPrice">${window.formatPrice(item.price||0)} د.ل</div><div class="cartQtyRow"><button class="qtyBtn" onclick="changeQty('${item.postId}',-1)" ${qty<=1?"disabled":""}>−</button><span class="qtyVal">${qty}</span><button class="qtyBtn" onclick="changeQty('${item.postId}',1)">+</button></div></div><button class="cRemove" onclick="removeFromCart('${item.postId}')">🗑️</button></div>`;
  }).join("");
  const total=window.cartTotalPrice();const cnt=window.cartTotalCount();
  if(totalBox)totalBox.style.display="flex";
  if(totalEl)totalEl.textContent=window.formatPrice(total)+" د.ل";
  if(itemsCountEl)itemsCountEl.textContent=`(${cnt} قطعة)`;
  if(isRestaurant){if(callBtn)callBtn.classList.remove("hidden");if(sendBtn)sendBtn.classList.add("hidden");}
  else{if(sendBtn)sendBtn.classList.remove("hidden");if(callBtn)callBtn.classList.add("hidden");}
  if(clearBtn)clearBtn.classList.remove("hidden");
};

window.addToCart = async function(postId,event){
  if(event)event.stopPropagation();
  const p=window.allPosts.find(x=>x.id===postId);
  if(!p)return;
  if(!p.storeId){window.showToast("⚠️ السلة متاحة فقط لمنتجات المتاجر","warn");return;}
  if(p.category==="سيارات ومركبات" || p.category==="دراجات نارية"){window.showToast("⚠️ السيارات والدراجات النارية لا تدخل السلة","warn");return;}
  if(p.sold){window.showToast("⚠️ هذا المنتج تم بيعه","warn");return;}
  if(window.cart.storeId && window.cart.storeId!==p.storeId && window.cart.items.length>0){
    if(!confirm(`⚠️ سلتك فيها منتجات من متجر "${window.cart.storeName}"\n\nلإضافة منتج من متجر آخر، يجب إفراغ السلة أولاً.`))return;
    window.cart.items=[];
  }
  window.cart.storeId=p.storeId;
  window.cart.storeName=p.storeName||"متجر";
  window.cart.storePhone=p.storePhone||p.phone||"";
  const existing=window.cart.items.find(i=>i.postId===postId);
  if(existing){existing.qty=(existing.qty||1)+1;}
  else{
    const imgs=window.getImages(p);
    window.cart.items.push({postId:p.id,title:p.title||"",price:Number(p.price)||0,image:imgs[0]||"",qty:1});
  }
  window.saveCart();window.updateCartUI();window.renderCartUI();
  window.showToast(`✅ أُضيف: ${p.title||"منتج"}`,"success");
};

window.removeFromCart = function(postId){
  window.cart.items=window.cart.items.filter(i=>i.postId!==postId);
  if(window.cart.items.length===0){window.cart.storeId=null;window.cart.storeName="";window.cart.storePhone="";}
  window.saveCart();window.updateCartUI();window.renderCartUI();
};
window.changeQty = function(postId,delta){
  const item=window.cart.items.find(i=>i.postId===postId);
  if(!item)return;
  const newQty=(item.qty||1)+delta;
  if(newQty<1)return;
  item.qty=newQty;
  window.saveCart();window.updateCartUI();window.renderCartUI();
};
window.clearCart = function(){
  if(window.cart.items.length===0)return;
  if(!confirm("إفراغ السلة بالكامل؟"))return;
  window.cart={storeId:null,storeName:"",storePhone:"",items:[]};
  window.saveCart();window.updateCartUI();window.renderCartUI();
};
window.sendCartToWhats = function(){
  if(window.cart.items.length===0){window.showToast("السلة فاضية!","warn");return;}
  if(!window.cart.storePhone){window.showToast("⚠️ لا يوجد رقم هاتف للمتجر","warn");return;}
  const store=window.allStores.find(s=>s.id===window.cart.storeId);
  const isRestaurant=window.isRestaurantStore(store);
  const phone=window.cart.storePhone.replace(/[^0-9]/g,"");
  const total=window.cartTotalPrice();
  const cnt=window.cartTotalItemsCount();
  if(isRestaurant){
    let lines=window.cart.items.map((item,i)=>{const qty=item.qty||1;const sub=(item.price||0)*qty;return `${i+1}. ${item.title} × ${qty} = ${window.formatPrice(sub)} د.ل`;}).join("\n");
    alert(`📞 اتصل بالمطعم واطلب:\n\n${lines}\n\n━━━━━━━━━━━━━\n💰 المجموع: ${window.formatPrice(total)} د.ل\n📦 ${cnt} قطعة\n\nسيتم فتح الاتصال الآن...`);
    window.location.href=`tel:${phone}`;
    return;
  }
  let lines=window.cart.items.map((item,i)=>{const qty=item.qty||1;const sub=(item.price||0)*qty;return `${i+1}. ${item.title}\n   💰 ${window.formatPrice(item.price)} د.ل × ${qty} = ${window.formatPrice(sub)} د.ل`;}).join("\n\n");
  const msg=`السلام عليكم 👋\n\nشفت منتجاتك على موقع "تسوق الآن" وأنا مهتم بـ:\n\n${lines}\n\n━━━━━━━━━━━━━\n💰 المجموع: ${window.formatPrice(total)} د.ل\n📦 عدد القطع: ${cnt}\n\nهل ممكن نتفق؟`;
  const url=`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  window.open(url,"_blank");
};
window.sendCartToCall = function(){
  if(window.cart.items.length===0){window.showToast("السلة فاضية!","warn");return;}
  if(!window.cart.storePhone){window.showToast("⚠️ لا يوجد رقم هاتف للمطعم","warn");return;}
  const phone=window.cart.storePhone.replace(/[^0-9]/g,"");
  const total=window.cartTotalPrice();
  const cnt=window.cartTotalItemsCount();
  let lines=window.cart.items.map((item,i)=>{const qty=item.qty||1;const sub=(item.price||0)*qty;return `${i+1}. ${item.title} × ${qty} = ${window.formatPrice(sub)} د.ل`;}).join("\n");
  alert(`📞 اتصل بالمطعم واطلب:\n\n${lines}\n\n━━━━━━━━━━━━━\n💰 المجموع: ${window.formatPrice(total)} د.ل\n📦 ${cnt} قطعة\n\nسيتم فتح الاتصال الآن...`);
  window.location.href=`tel:${phone}`;
};

/* ============================================================
   Ad Popup
   ============================================================ */
window.AD_IMAGE_URL = "https://placehold.co/600x800/38bdf8/ffffff?text=اعلان+هنا";
window.AD_INTERVAL_DAYS = 30;
window.showAdIfDue = function(){
  try{
    const last=localStorage.getItem('adLastShownAt');
    const now=Date.now();
    const interval=window.AD_INTERVAL_DAYS*24*60*60*1000;
    if(!last||(now-parseInt(last,10))>=interval){
      const img=document.getElementById('adImage');
      if(img)img.src=window.AD_IMAGE_URL;
      const popup=document.getElementById('adPopup');
      if(popup)popup.classList.remove('hidden');
      localStorage.setItem('adLastShownAt',String(now));
    }
  }catch(e){}
};
window.closeAd = function(){
  const p=document.getElementById('adPopup');
  if(p)p.classList.add('hidden');
};
setTimeout(window.showAdIfDue,2600);

/* ============================================================
   Seller Tier
   ============================================================ */
window.getSellerTier = function(postCount){
  if(postCount>=50)return{tier:"diamond",label:"💎 ماسي"};
  if(postCount>=21)return{tier:"gold",label:"🥇 ذهبي"};
  if(postCount>=6)return{tier:"silver",label:"🥈 فضي"};
  if(postCount>=1)return{tier:"bronze",label:"🥉 برونزي"};
  return null;
};
window.renderSellerTierBadge = function(uid,postCount){
  const t=window.getSellerTier(postCount);
  if(!t)return "";
  return `<span class="sellerTier ${t.tier}">${t.label}</span>`;
};

/* ============================================================
   Contact / Share
   ============================================================ */
window.contactSeller = function(id){
  const p=window.allPosts.find(x=>x.id===id);
  if(!p||!p.phone)return;
  window.incrementWhatsappClick(id,'post');
  const cleanPhone=window.normalizePhone(p.phone);
  document.getElementById("warnGo").href="https://wa.me/"+cleanPhone;
  window.warnOverlay.classList.remove("hidden");
};
window.sharePost = async function(id){
  const p=window.allPosts.find(x=>x.id===id);
  if(!p)return;
  const url=window.location.origin+window.location.pathname+'#post-'+id;
  const priceText=p.priceType==="contact"?'📞 تواصل لمعرفة السعر':(p.price!=null?window.formatPrice(p.price)+' د.ل':'');
  const cityText=p.city?'\n📍 '+p.city:'';
  const text=`🛒 ${p.title||'إعلان'}\n💰 ${priceText}${cityText}\n\nشاهده على تسوق الآن:`;
  const shareData={title:p.title||'تسوق الآن',text,url};
  try{
    if(navigator.share)await navigator.share(shareData);
    else{const w='https://wa.me/?text='+encodeURIComponent(text+'\n'+url);window.open(w,'_blank');}
  }catch(e){
    if(e&&e.name!=='AbortError'){const w='https://wa.me/?text='+encodeURIComponent(text+'\n'+url);window.open(w,'_blank');}
  }
};

/* ============================================================
   Store QR + Receipt + Copy
   ============================================================ */
window.generateStoreQR = async function(storeId){
  const box=document.getElementById("storeQRBox");
  if(!box) return;
  const url=`${window.location.origin}${window.location.pathname}#store-${storeId}`;
  const qrImageUrl=`https://quickchart.io/qr?text=${encodeURIComponent(url)}&size=300&margin=1&ecLevel=M`;
  box.innerHTML=`<img src="${qrImageUrl}" alt="QR Code" style="max-width:220px;margin:8px auto;display:block;border-radius:8px" onerror="this.parentElement.innerHTML='<div style=color:#e5484d;padding:20px>تعذر تحميل QR</div>'"><div style="font-size:11.5px;color:var(--muted);margin-top:8px;word-break:break-all;direction:ltr">${url}</div><a download="store-qr-${storeId}.png" href="${qrImageUrl}" target="_blank" rel="noopener" class="storeQRBtn" style="margin-top:10px;text-decoration:none;display:inline-block">⬇️ تحميل QR</a>`;
};
window.toggleStoreQR = function(){
  const box=document.getElementById("storeQRBox");
  if(!box) return;
  if(box.style.display==="none"||!box.style.display){
    box.style.display="block";
    if(window._currentStoreId) window.generateStoreQR(window._currentStoreId);
  } else { box.style.display="none"; }
};
window.copyToClipboard = async function(text,label){
  try{
    await navigator.clipboard.writeText(text);
    window.showToast(`✅ تم نسخ ${label}`,"success",1500);
  }catch(e){
    const ta=document.createElement("textarea");
    ta.value=text;ta.style.position="fixed";ta.style.opacity="0";
    document.body.appendChild(ta);ta.select();
    try{document.execCommand("copy");window.showToast(`✅ تم نسخ ${label}`,"success",1500);}
    catch(err){window.showToast("❌ فشل النسخ","error");}
    document.body.removeChild(ta);
  }
};
window.sendReceiptToSeller = function(phone,storeName){
  const cleanPhone=String(phone||"").replace(/[^0-9]/g,"");
  if(!cleanPhone){window.showToast("⚠️ رقم المتجر غير متوفر","warn");return;}
  const msg=`السلام عليكم 👋\n\nحولت مبلغ لـ "${storeName}" على موقع تسوق الآن.\n\n📎 هذا إيصال التحويل 👇\n\n(أرفق صورة الإيصال هنا)`;
  const url=`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  window.open(url,"_blank");
};

/* ============================================================
   Terms & Privacy
   ============================================================ */
window.openTerms = function(){window.termsOverlay.classList.remove("hidden");};
window.openPrivacy = function(){window.privacyOverlay.classList.remove("hidden");};

/* ============================================================
   closeOverlay
   ============================================================ */
window.closeOverlay = function(){
  window.authOverlay.classList.add("hidden");
  window.accountOverlay.classList.add("hidden");
  window.reportsOverlay.classList.add("hidden");
  window.moderationOverlay.classList.add("hidden");
  window.limitsOverlay.classList.add("hidden");
  window.sellerOverlay.classList.add("hidden");
  window.warnOverlay.classList.add("hidden");
  window.postOverlay.classList.add("hidden");
  window.upgradeOverlay.classList.add("hidden");
  window.postTypeOverlay.classList.add("hidden");
  window.openStoreOverlay.classList.add("hidden");
  window.storesModerationOverlay.classList.add("hidden");
  window.expiredOverlay.classList.add("hidden");
  if(window.cartOverlay)window.cartOverlay.classList.add("hidden");
  if(window.termsOverlay)window.termsOverlay.classList.add("hidden");
  if(window.privacyOverlay)window.privacyOverlay.classList.add("hidden");
  if(window.feedbackOverlay)window.feedbackOverlay.classList.add("hidden");
  const pts=document.getElementById("pointsOverlay");if(pts)pts.classList.add("hidden");
  const whl=document.getElementById("luckyWheelOverlay");if(whl)whl.classList.add("hidden");
  const cmp=document.getElementById("compareOverlay");if(cmp)cmp.classList.add("hidden");
  const dsh=document.getElementById("dashboardOverlay");if(dsh)dsh.classList.add("hidden");
  const sno=document.getElementById("sendNotifOverlay");if(sno)sno.classList.add("hidden");
  const eso=document.getElementById("editStoreOverlay");
  if(eso)eso.classList.add("hidden");
  window.updateSEOMeta(null);
  window.pendingAction=null;
  document.body.style.overflow="";
};

/* ============================================================
   Init
   ============================================================ */
window.buildCategoriesGrid();
window.populateCitySelects();
window.populateCategorySelects();
window.populateBrandSelect("سيارات ومركبات");
window.updateCartUI();
window.addEventListener('load',()=>{setTimeout(window.updateCartUI,500);});

console.log('✅ js-part-2 loaded successfully');
   /* ============================================================
   تسوق الآن — الجزء الثالث: Stores + Account + Auth + Seller + Init
   ============================================================ */

/* ============================================================
   Store Helpers (مساعدين المتجر)
   ============================================================ */
window.loadStoreHelpers = function(storeId){
  const store=window.allStores.find(s=>s.id===storeId);
  if(!store){window.currentStoreHelpers=[];window.renderStoreHelpersList();return;}
  window.currentStoreHelpers=Array.isArray(store.helpers)?[...store.helpers]:[];
  window.renderStoreHelpersList();
};
window.renderStoreHelpersList = function(){
  const box=document.getElementById("storeHelpersList");
  if(!box)return;
  if(window.currentStoreHelpers.length===0){
    box.innerHTML='<div style="font-size:12px;color:var(--muted);text-align:center;padding:8px">لا يوجد مساعدين بعد</div>';
    return;
  }
  box.innerHTML=window.currentStoreHelpers.map((email,i)=>`
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:#fff;border-radius:8px;margin-bottom:6px;border:1px solid var(--border)">
      <span style="font-size:12.5px;direction:ltr;word-break:break-all;flex:1">${window.escapeHtml(email)}</span>
      <button onclick="removeStoreHelper(${i})" style="background:#fdeceb;color:#e5484d;border:none;padding:6px 10px;border-radius:8px;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer">🗑️</button>
    </div>
  `).join("");
};
window.addStoreHelper = function(){
  const input=document.getElementById("newHelperEmail");
  const email=(input.value||"").trim().toLowerCase();
  if(!email){window.showToast("⚠️ اكتب الإيميل","warn");return;}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){window.showToast("❌ إيميل غير صحيح","error");return;}
  if(window.currentStoreHelpers.includes(email)){window.showToast("⚠️ موجود مسبقاً","warn");return;}
  if(window.currentStoreHelpers.length>=10){window.showToast("⚠️ الحد الأقصى 10 مساعدين","warn");return;}
  window.currentStoreHelpers.push(email);
  input.value="";
  window.renderStoreHelpersList();
  window.showToast("✅ تم الإضافة — لا تنسى حفظ التعديلات","success",3000);
};
window.removeStoreHelper = function(index){
  if(!confirm("حذف هذا المساعد؟"))return;
  window.currentStoreHelpers.splice(index,1);
  window.renderStoreHelpersList();
  window.showToast("✅ تم الحذف — لا تنسى حفظ التعديلات","success",3000);
};
window.isStoreHelper = function(storeId,userEmail){
  if(!userEmail)return false;
  const store=window.allStores.find(s=>s.id===storeId);
  if(!store||!Array.isArray(store.helpers))return false;
  return store.helpers.includes(userEmail.toLowerCase());
};

/* ============================================================
   Feedback
   ============================================================ */
window.openFeedback = function(){
  const t=document.getElementById("fbType");
  const m=document.getElementById("fbMessage");
  const c=document.getElementById("fbContact");
  if(t)t.value="bug";
  if(m)m.value="";
  if(c)c.value="";
  window.feedbackOverlay.classList.remove("hidden");
};
window.submitFeedback = async function(){
  const type=document.getElementById("fbType").value;
  const message=(document.getElementById("fbMessage").value||"").trim();
  const contact=(document.getElementById("fbContact").value||"").trim();
  if(message.length<10){window.showToast("⚠️ اكتب رسالة (10 أحرف على الأقل)","warn");return;}
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
    window.showToast("✅ وصلتنا رسالتك، شكراً لك!","success",3000);
    window.closeOverlay();
  }catch(e){window.showToast("❌ خطأ: "+e.message,"error");}
  finally{btn.disabled=false;btn.textContent="📤 إرسال الرسالة";}
};

/* ============================================================
   Store Hours + Ratings
   ============================================================ */
window.isStoreOpen = function(store){
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
};
window.formatStoreHours = function(store){
  if(!store || !store.workingHours) return "";
  const wh=store.workingHours;
  if(wh.alwaysOpen) return "24 ساعة";
  return `${wh.openTime} - ${wh.closeTime}`;
};
window.openBadgeHTML = function(store){
  const open=window.isStoreOpen(store);
  if(open===null) return "";
  if(open) return `<span class="openBadgeGreen">🟢 مفتوح الآن</span>`;
  return `<span class="openBadgeRed">🔴 مغلق حالياً</span>`;
};

window.loadStoreRatings = async function(storeId){
  if(window.allStoreRatings[storeId]) return window.allStoreRatings[storeId];
  try{
    const snap=await getDocs(query(collection(db,"storeRatings"),where("storeId","==",storeId)));
    const ratings=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    window.allStoreRatings[storeId]=ratings;
    return ratings;
  }catch(e){window.allStoreRatings[storeId]=[];return [];}
};
window.openStoreRating = async function(storeId){
  const me=auth.currentUser;
  if(!me){window.pendingAction={type:"storeRating",storeId};window.authOverlay.classList.remove("hidden");return;}
  const ratings=await window.loadStoreRatings(storeId);
  const mine=ratings.find(r=>r.raterUid===me.uid);
  const stars=prompt(`⭐ قيّم المتجر (1-5)\n${mine?"تقييمك الحالي: "+mine.stars:"لم تقيّم بعد"}`,mine?String(mine.stars):"5");
  if(stars===null) return;
  const s=parseInt(stars,10);
  if(isNaN(s)||s<1||s>5){window.showToast("⚠️ اختر من 1 إلى 5","warn");return;}
  const comment=prompt("💬 تعليق (اختياري):",mine?(mine.comment||""):"")||"";
  try{
    await setDoc(doc(db,"storeRatings",storeId+"_"+me.uid),{
      storeId,raterUid:me.uid,
      raterName:(window.myProfile&&window.myProfile.name)||me.displayName||"مستخدم",
      stars:s,comment:comment.trim().slice(0,300),createdAt:Date.now()
    });
    delete window.allStoreRatings[storeId];
    await window.loadStoreRatings(storeId);
    window.showToast("✅ تم حفظ تقييمك","success");
    if(window._currentStoreId===storeId) window.openStore(storeId,true);
  }catch(e){window.showToast("خطأ: "+e.message,"error");}
};

/* ============================================================
   Stores Listener
   ============================================================ */
window.startStoresListener = function(){
  if(window.unsubStores)return;
  window.unsubStores=onSnapshot(collection(db,"stores"),snap=>{
    window.allStores=snap.docs.map(d=>({id:d.id,...d.data()}));
    window.renderStoresList();
    if(window.storesModerationOverlay && !window.storesModerationOverlay.classList.contains("hidden"))window.renderStoresModeration();
    const sc=document.getElementById("storeScreen");
    if(sc && !sc.classList.contains("hidden")){
      const openStoreId=window._currentStoreId;
      if(openStoreId)setTimeout(()=>window.refreshOpenStore(openStoreId),300);
    }
  },err=>{});
};

window.startStoreListener = function(uid){
  window.stopStoreListener();
  window.unsubStore=onSnapshot(query(collection(db,"stores"),where("ownerUid","==",uid)),snap=>{
    if(!snap.empty){const d=snap.docs[0];window.myStore={id:d.id,...d.data()};}
    else{window.myStore=null;}
  },err=>{});
};
window.stopStoreListener = function(){
  if(window.unsubStore){window.unsubStore();window.unsubStore=null;}
  window.myStore=null;
};

/* ============================================================
   Stores Screen
   ============================================================ */
window.openStores = function(){
  document.querySelectorAll(".catChip").forEach(b=>b.classList.remove("active"));
  window.categoriesScreen.classList.add("hidden");
  window.home.classList.add("hidden");
  window.form.classList.add("hidden");
  const sc=document.getElementById("storeScreen");if(sc)sc.classList.add("hidden");
  const ss=document.getElementById("storesScreen");
  if(ss)ss.classList.remove("hidden");
  window.renderStoresList();
  window.scrollTo(0,0);
  window.hideFloatingButtons();
};

window.renderStoresList = function(){
  const list=document.getElementById("storesList");
  if(!list)return;
  const term=(document.getElementById("storeSearch")?.value||"").trim().toLowerCase();
  const approved=window.allStores.filter(s=>s.status==="approved").filter(s=>!term || (s.name||"").toLowerCase().includes(term) || (s.category||"").toLowerCase().includes(term) || (s.city||"").toLowerCase().includes(term));
  if(approved.length===0){list.innerHTML="<div class='reportsEmpty'>لا توجد متاجر معتمدة بعد</div>";return;}
  list.innerHTML=approved.map(s=>{
    const logo=s.logo?`<img src="${window.escapeHtml(s.logo)}" onerror="this.parentElement.innerHTML='🏪'">`:"🏪";
    const count=window.allPosts.filter(p=>p.storeId===s.id && window.getStatus(p)==="approved" && !window.isExpired(p) && !p.sold).length;
    const openBadge=window.openBadgeHTML(s);
    const hoursText=window.formatStoreHours(s);
    const verifiedBadge=s.verified?`<span class="verifiedBadge" title="متجر موثق"></span>`:"";
    const isRest=window.isRestaurantStore(s);
    const badgeHTML=isRest?`<span class="restaurantBadge">🍽️ مطعم</span>`:`<span class="storeBadge">🏢 شركة/متجر</span>`;
    const storePostsCount=window.allPosts.filter(p=>p.storeId===s.id && window.getStatus(p)==="approved").length;
    const storeTier=window.renderSellerTierBadge(s.ownerUid,storePostsCount);
    return `<div class="storeCard" onclick="openStore('${s.id}',false,'stores')"><div class="storeLogo">${logo}</div><div class="storeInfo"><div class="storeName">${window.escapeHtml(s.name||"متجر")} ${verifiedBadge} ${badgeHTML} ${openBadge} ${storeTier}</div><div class="storeMeta">📁 ${window.escapeHtml(s.category||"")}${s.city?" · 📍 "+window.escapeHtml(s.city):""}${hoursText?" · 🕐 "+hoursText:""}</div><div class="storeStats">📦 ${count} منتج · 👤 ${window.escapeHtml(s.ownerUsername?('@'+s.ownerUsername):(s.ownerMemberNo?('#'+s.ownerMemberNo):'بائع'))}</div></div></div>`;
  }).join("");
};

window.refreshOpenStore = async function(storeId){
  const formScreen=document.getElementById("form");
  if(formScreen && !formScreen.classList.contains("hidden")) return;
  const sc=document.getElementById("storeScreen");
  if(!sc || sc.classList.contains("hidden"))return;
  if(window._currentStoreId!==storeId)return;
  await window.openStore(storeId,true);
};

/* ============================================================
   Store Products
   ============================================================ */
window.setStoreSort = function(sort){
  window.currentStoreSort=sort;
  ["ssortNewest","ssortCheapest","ssortExpensive","ssortViews"].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.classList.remove("active");
  });
  const map={newest:"ssortNewest",cheapest:"ssortCheapest",expensive:"ssortExpensive",views:"ssortViews"};
  const active=document.getElementById(map[sort]);
  if(active) active.classList.add("active");
  window.renderStoreProducts();
};
window.applyStoreProductFilter = function(){
  const input=document.getElementById("storeProductSearch");
  window.currentStoreSearch=(input?.value||"").toLowerCase();
  window.renderStoreProducts();
};
window.applyStoreProductFilterClear = function(){
  const input=document.getElementById("storeProductSearch");
  if(input)input.value="";
  window.currentStoreSearch="";
  window.renderStoreProducts();
};

window.renderStoreProducts = function(){
  const box=document.getElementById("storeProductsBox");
  if(!box) return;
  let items=window.currentStoreItems.slice();
  if(window.currentStoreSearch){
    items=items.filter(p=>(p.title||"").toLowerCase().includes(window.currentStoreSearch));
  }
  items.sort((a,b)=>{
    switch(window.currentStoreSort){
      case "cheapest":return (Number(a.price)||0)-(Number(b.price)||0);
      case "expensive":return (Number(b.price)||0)-(Number(a.price)||0);
      case "views":return (b.views||0)-(a.views||0);
      default:return (b.createdAt||0)-(a.createdAt||0);
    }
  });
  if(items.length===0){
    const isSearch=window.currentStoreSearch.length>0;
    const canManage=window._canManageStoreItems;
    const storeId=window._currentStoreId||"";
    if(isSearch){
      box.innerHTML=window.buildEmptyState('📦','لا توجد منتجات مطابقة','جرّب كلمة بحث أخرى', '🔄 مسح البحث', 'applyStoreProductFilterClear()', true);
    } else if(canManage){
      box.innerHTML=window.buildEmptyState('📦','لا توجد منتجات بعد','أضف أول منتج لمتجرك الآن','➕ أضف منتج جديد',"goAddStorePost('"+storeId+"')");
    } else {
      box.innerHTML=window.buildEmptyState('📦','لا توجد منتجات بعد','هذا المتجر لم ينشر منتجات بعد','', '', false);
    }
    return;
  }
  const canManage=window._canManageStoreItems;
  box.innerHTML=`<div class="grid" style="padding:0;grid-template-columns:1fr 1fr;gap:10px">${items.map(p=>{
    const imgs=window.getImages(p);const th=imgs[0]||"";
    const expired=window.isExpired(p);const isSold=!!p.sold;
    const canCart=!isSold && window.canHaveCart(p);
    const inCart=window.cart.items.some(i=>i.postId===p.id);
    const cartBtnHtml=canCart?`<button class="cartAddBtn${inCart?' added':''}" data-id="${p.id}" onclick="event.stopPropagation();addToCart('${p.id}',event)">${inCart?'✅ في السلة':'🛒 أضف للسلة'}</button>`:"";
    const actionsHtml=canManage?`<div style="display:flex;gap:4px;margin-top:6px"><button onclick="event.stopPropagation();closeOverlay();setTimeout(()=>editPost('${p.id}'),200)" style="flex:1;padding:8px;border:none;border-radius:8px;background:#eef2ff;color:#0284c7;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer">✏️</button><button onclick="event.stopPropagation();deleteStoreProduct('${p.id}')" style="flex:1;padding:8px;border:none;border-radius:8px;background:#fdeceb;color:#e5484d;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer">🗑️</button></div>`:"";
    let cls="card";if(isSold)cls+=" sold";else if(expired)cls+=" expired";
    const discPct=window.getDiscountPercent(p);
    const discBadge=discPct>0?`<span class="discountBadge">🔥 ${discPct}%</span>`:"";
    const negotiableBadge=p.negotiable?`<span style="background:#dcfce7;color:#166534;font-weight:800;padding:3px 9px;border-radius:7px;font-size:11px;border:1px solid #16a34a;margin-right:6px">🤝 قابل للنقاش</span>`:"";
    let priceHTML="";
    if(p.priceType==="contact"){
      priceHTML=`<div class="price" style="color:var(--teal-dark);font-size:13.5px">📞 تواصل لمعرفة السعر</div>`;
    }else if(discPct>0){
      priceHTML=`<div class="price"><span class="originalPrice">${window.formatPrice(p.originalPrice)} د.ل</span><span class="discountPrice">${window.formatPrice(p.price)} د.ل</span>${negotiableBadge}</div>`;
    }else{
      priceHTML=`<div class="price">${p.price!=null?window.formatPrice(p.price)+" د.ل":""}${negotiableBadge}</div>`;
    }
    const cartRow=cartBtnHtml?`<div style="display:flex;gap:6px;margin-top:6px;align-items:center">${cartBtnHtml}</div>`:"";
    const viewsLine=canManage?`<div class="cardViews">👁️ ${p.views||0} مشاهدة</div>`:"";
    return `<div class="${cls}" data-title="${window.escapeHtml(p.title||"")}"><div class="imgWrap" onclick="closeOverlay();setTimeout(()=>openPost('${p.id}'),200)" style="cursor:pointer">${th?`<img src="${window.escapeHtml(th)}">`:`<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:24px;opacity:.5">🖼️</div>`}${discBadge}</div><div class="body"><h4 style="cursor:pointer" onclick="closeOverlay();setTimeout(()=>openPost('${p.id}'),200)">${window.escapeHtml(p.title||"بدون عنوان")}</h4>${priceHTML}${viewsLine}${cartRow}${actionsHtml}</div></div>`;
  }).join("")}</div>`;
};

/* ============================================================
   Open Store
   ============================================================ */
window.openStore = async function(storeId,keepScroll,backTo){
  if(!keepScroll){window._currentStoreId=storeId;}
  window._storeBackTo=backTo||"categories";
  window.closeOverlay();
  const ss=document.getElementById("storesScreen");if(ss)ss.classList.add("hidden");
  window.categoriesScreen.classList.add("hidden");
  window.home.classList.add("hidden");
  window.form.classList.add("hidden");
  const sc=document.getElementById("storeScreen");if(sc)sc.classList.remove("hidden");
  const box=document.getElementById("storeContent");
  if(!keepScroll)box.innerHTML="<div class='reportsEmpty'>جاري التحميل...</div>";
  let store=window.allStores.find(s=>s.id===storeId);
  if(!store){
    try{const snap=await getDoc(doc(db,"stores",storeId));if(snap.exists())store={id:snap.id,...snap.data()};}catch(e){}
  }
  if(!store){box.innerHTML="<div class='reportsEmpty'>❌ المتجر غير موجود</div>";return;}
  window._currentStoreId=storeId;
  const isOwnerStore=auth.currentUser && auth.currentUser.uid===store.ownerUid;
  const isAdminUser=auth.currentUser && auth.currentUser.email===window.ADMIN_EMAIL;
  const isStoreHelperNow=auth.currentUser && window.isStoreHelper(storeId,auth.currentUser.email);
  if(store.status!=="approved" && !isOwnerStore && !isAdminUser){box.innerHTML="<div class='reportsEmpty'>❌ المتجر غير متاح</div>";return;}
  const items=window.allPosts.filter(p=>p.storeId===storeId && (window.getStatus(p)==="approved" || (auth.currentUser && (auth.currentUser.uid===store.ownerUid||isAdminUser||isStoreHelperNow))) && (!window.isExpired(p) || isOwnerStore || isAdminUser || isStoreHelperNow));
  window.currentStoreItems=items.slice();
  window._canManageStoreItems=isAdminUser||isOwnerStore||isStoreHelperNow;
  const isRestaurant=window.isRestaurantStore(store);
  const coverHtml=store.cover?`<img src="${window.escapeHtml(store.cover)}" onerror="this.parentElement.innerHTML='🏪'">`:"🏪";
  const logoHtml=store.logo?`<img src="${window.escapeHtml(store.logo)}">`:"<div class='placeholder'>🏪</div>";

  const cleanStorePhone=String(store.phone||'').replace(/[^0-9+]/g,'');
  const contactStoreBtn=store.phone
    ? (isRestaurant
        ? `<a href="tel:${cleanStorePhone}" class="btnMain" style="background:var(--call);margin-bottom:8px;text-decoration:none;display:flex;align-items:center;justify-content:center" onclick="event.stopPropagation();incrementWhatsappClick('${window.escapeHtml(store.id)}','store')">📞 اتصل بالمطعم</a>`
        : `<button class="btnMain" style="background:var(--wa);margin-bottom:8px" onclick="event.stopPropagation();openStoreWhatsapp('${window.escapeHtml(cleanStorePhone)}')">💬 تواصل عبر واتساب</button>
           <a href="tel:${cleanStorePhone}" class="btnMain" style="background:var(--call);margin-bottom:8px;text-decoration:none;display:flex;align-items:center;justify-content:center" onclick="event.stopPropagation();incrementWhatsappClick('${window.escapeHtml(store.id)}','store')">📞 اتصال هاتفي بالمتجر</a>`)
    : "";

  const bi=store.bankInfo || {};
  const hasIban=bi.iban && bi.iban.trim();
  const hasAccount=bi.accountNumber && bi.accountNumber.trim();
  const hasBankInfo=hasIban || hasAccount;
  let bankInfoHtml="";
  if(hasBankInfo){
    const copyBtn=(val,label)=>`<button onclick="copyToClipboard('${window.escapeHtml(val)}','${label}')" style="background:#0284c7;color:#fff;border:none;padding:6px 12px;border-radius:8px;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;margin-right:6px;white-space:nowrap">📋 نسخ</button>`;
    bankInfoHtml=`<div style="background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border:2px solid #0ea5e9;border-radius:14px;padding:14px;margin:12px 0">
      <div style="font-weight:800;color:#0369a1;font-size:14px;margin-bottom:10px">💳 معلومات الدفع</div>
      <div style="font-size:12px;color:#0369a1;margin-bottom:12px;line-height:1.7">💡 حوّل المبلغ على أي من هذه الحسابات، ثم أرسل صورة الإيصال للبائع على واتساب.</div>
      ${bi.accountOwner?`<div style="background:#fff;border-radius:10px;padding:10px;margin-bottom:8px"><div style="font-size:11.5px;font-weight:700;color:var(--muted);margin-bottom:4px">👤 اسم صاحب الحساب</div><div style="font-weight:800;font-size:14px">${window.escapeHtml(bi.accountOwner)}</div></div>`:""}
      ${bi.bankName?`<div style="background:#fff;border-radius:10px;padding:10px;margin-bottom:8px"><div style="font-size:11.5px;font-weight:700;color:var(--muted);margin-bottom:4px">🏛️ اسم المصرف</div><div style="font-weight:800;font-size:14px">${window.escapeHtml(bi.bankName)}</div></div>`:""}
      ${hasIban?`<div style="background:#fff;border-radius:10px;padding:10px;margin-bottom:8px"><div style="font-size:11.5px;font-weight:700;color:var(--muted);margin-bottom:4px">🏦 رقم الآيبان (IBAN)</div><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span style="font-family:monospace;font-size:13px;direction:ltr;word-break:break-all;flex:1;min-width:150px">${window.escapeHtml(bi.iban)}</span>${copyBtn(bi.iban,'IBAN')}</div></div>`:""}
      ${hasAccount?`<div style="background:#fff;border-radius:10px;padding:10px;margin-bottom:8px"><div style="font-size:11.5px;font-weight:700;color:var(--muted);margin-bottom:4px">💳 رقم الحساب</div><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span style="font-family:monospace;font-size:13px;direction:ltr;flex:1;min-width:150px">${window.escapeHtml(bi.accountNumber)}</span>${copyBtn(bi.accountNumber,'رقم الحساب')}</div></div>`:""}
      ${store.phone?`<button class="btnMain" style="background:var(--wa);margin-top:10px;margin-bottom:0" onclick="sendReceiptToSeller('${window.escapeHtml(String(store.receiptPhone||store.phone||'').replace(/[^0-9]/g,''))}','${window.escapeHtml(store.name||'المتجر')}')">📤 أرسل الإيصال للبائع على واتساب</button>`:""}
    </div>`;
  }

  const myIndividualCount=(auth.currentUser && (isOwnerStore||isAdminUser)) ? window.allPosts.filter(p=>p.uid===store.ownerUid && !p.storeId).length : 0;
  const transferBtn=myIndividualCount>0?`<button class="storeQRBtn" onclick="transferMyPostsToStore('${store.id}')" style="background:#0284c7;color:#fff">📥 نقل إعلاناتي (${myIndividualCount})</button>`:"";

  const storeCartCount=window.cart.storeId===storeId?window.cartTotalCount():0;
  const showCartBtn=storeCartCount>0?`<button class="btnMain" style="background:linear-gradient(135deg,#f59e0b,#fbbf24);color:#3a2500;margin-bottom:8px" onclick="openCart()">🛒 عرض سلتك (${storeCartCount})</button>`:"";
  const storeFilterBar=`<div style="display:flex;gap:6px;margin:10px 0;flex-wrap:wrap"><input type="text" id="storeProductSearch" placeholder="🔍 ابحث في المنتجات..." oninput="applyStoreProductFilter()" style="flex:1;min-width:150px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;font-family:inherit;font-size:14px;background:var(--card);color:var(--text)"><button class="filterBtn active" onclick="setStoreSort('newest')" id="ssortNewest" style="font-size:12px">🆕 الأحدث</button><button class="filterBtn" onclick="setStoreSort('cheapest')" id="ssortCheapest" style="font-size:12px">💰 الأرخص</button><button class="filterBtn" onclick="setStoreSort('expensive')" id="ssortExpensive" style="font-size:12px">💎 الأغلى</button><button class="filterBtn" onclick="setStoreSort('views')" id="ssortViews" style="font-size:12px">👁️ الأكثر مشاهدة</button></div>`;
  const statusNote=store.status==="pending"?`<div style="background:#fef3c7;color:#92400e;padding:8px;border-radius:10px;text-align:center;font-weight:800;margin-bottom:10px">⏳ متجرك قيد المراجعة</div>`:"";
  const statusNote2=store.status==="rejected"?`<div style="background:#fdeceb;color:#b91c1c;padding:8px;border-radius:10px;text-align:center;font-weight:800;margin-bottom:10px">❌ متجرك مرفوض${store.rejectReason?" — "+window.escapeHtml(store.rejectReason):""}</div>`:"";
  const verifiedBadgeLg=store.verified?`<span class="verifiedBadge verifiedBadgeLg" title="متجر موثق"></span>`:"";
  const deliveryBadge=store.deliveryCompany?`<span style="font-size:12px;color:#166534;padding:3px 9px;background:#f0fdf4;border-radius:7px;font-weight:700;border:1px solid #bbf7d0">🛵 التوصيل: ${window.escapeHtml(store.deliveryCompany)}</span>`:"";
  const restaurantBadge=isRestaurant?`<span class="restaurantBadge">🍽️ مطعم</span>`:`<span class="storeBadge">🏢 شركة/متجر</span>`;
  const storePostsCountAll=window.allPosts.filter(p=>p.storeId===storeId && window.getStatus(p)==="approved").length;
  const storeTierBadge=window.renderSellerTierBadge(store.ownerUid,storePostsCountAll);
  box.innerHTML=`${statusNote}${statusNote2}<div class="storeHeader"><div class="cover">${coverHtml}</div><div class="logoWrap">${logoHtml}</div></div><div class="storeTitle">${window.escapeHtml(store.name||"متجر")} ${verifiedBadgeLg} ${restaurantBadge} ${storeTierBadge}</div><div class="storeMetaLine">📁 ${window.escapeHtml(store.category||"")}${store.city?" · 📍 "+window.escapeHtml(store.city):""}${store.ownerUsername?" · 👤 @"+window.escapeHtml(store.ownerUsername):""}${store.ownerMemberNo?" · #"+store.ownerMemberNo:""}</div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0">${window.openBadgeHTML(store)}${window.formatStoreHours(store)?`<span style="font-size:12px;color:var(--muted);padding:3px 9px;background:#f0f9ff;border-radius:7px">🕐 ${window.formatStoreHours(store)}</span>`:""}${deliveryBadge}<span id="storeRatingInline"></span></div>${store.description?`<div class="storeDesc">${window.escapeHtml(store.description)}</div>`:""}${contactStoreBtn}${bankInfoHtml}${showCartBtn}<div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0">${transferBtn}<button class="storeQRBtn" onclick="openStoreRating('${store.id}')">⭐ قيّم المتجر</button><button class="storeQRBtn" onclick="toggleStoreQR()" style="background:#16a34a">📱 QR Code</button>${isOwnerStore||isAdminUser?`<button class="storeQRBtn" onclick="openEditStore('${store.id}')" style="background:#8b5cf6">⚙️ تعديل المتجر</button>`:""}${(isOwnerStore||isAdminUser||isStoreHelperNow)&&store.status==="approved"?`<button class="storeQRBtn" onclick="goAddStorePost('${store.id}')" style="background:#f59e0b;color:#3a2500">➕ إضافة منتج</button>`:""}</div><div class="storeQRBox" id="storeQRBox" style="display:none"></div><div class="storeRatingSection" id="storeRatingSection"></div><div style="font-weight:800;font-size:16px;margin:16px 0 8px">📦 المنتجات (${items.length})</div>${storeFilterBar}<div id="storeProductsBox"></div>`;
  window.renderStoreProducts();
  window.updateCartUI();
  window.loadStoreRatings(storeId).then(()=>{
    const sec=document.getElementById("storeRatingSection");
    const inline=document.getElementById("storeRatingInline");
    const ratings=window.allStoreRatings[storeId]||[];
    if(inline && ratings.length>0){
      const avg=ratings.reduce((s,r)=>s+(r.stars||0),0)/ratings.length;
      inline.innerHTML=`<span class="storeRatingBadge">⭐ ${avg.toFixed(1)} (${ratings.length})</span>`;
    }
    if(!sec) return;
    if(ratings.length===0){ sec.innerHTML='<h4>⭐ التقييمات</h4><div style="color:var(--muted);font-size:13px">لا توجد تقييمات بعد</div>'; return; }
    const avg=ratings.reduce((s,r)=>s+(r.stars||0),0)/ratings.length;
    sec.innerHTML=`<h4>⭐ التقييمات (${ratings.length}) — متوسط ${avg.toFixed(1)}/5</h4>`+ratings.map(r=>`<div style="padding:10px 0;border-bottom:1px solid var(--border)"><div style="display:flex;justify-content:space-between;font-size:12.5px"><b>${window.escapeHtml(r.raterName||"مستخدم")}</b><span style="color:#f5a623">${"★".repeat(r.stars||0)}${"☆".repeat(5-(r.stars||0))}</span></div>${r.comment?`<div style="font-size:13px;margin-top:4px">${window.escapeHtml(r.comment)}</div>`:""}</div>`).join("");
  });
  window.hideFloatingButtons();
};

window.backFromStore = function(){
  const sc=document.getElementById("storeScreen");
  if(sc)sc.classList.add("hidden");
  if(window._storeBackTo==="stores"){const ss=document.getElementById("storesScreen");if(ss)ss.classList.remove("hidden");}
  else if(window._storeBackTo==="home"){window.home.classList.remove("hidden");window.showFloatingButtons();}
  else if(window._storeBackTo==="post"){window.postOverlay.classList.remove("hidden");}
  else{window.showCategoriesScreen();}
};

window.openStoreWhatsapp = function(phone){
  const url="https://wa.me/"+encodeURIComponent(String(phone||'').replace(/[^0-9]/g,""));
  document.getElementById("warnGo").href=url;
  window.warnOverlay.classList.remove("hidden");
};

window.goAddStorePost = function(storeId){
  const store=window.allStores.find(s=>s.id===storeId);
  if(!store){window.showToast("❌ المتجر غير موجود","error");return;}
  const me=auth.currentUser;
  if(!me){window.authOverlay.classList.remove("hidden");return;}
  const isOwner=me.uid===store.ownerUid;
  const isAdminUser=me.email===window.ADMIN_EMAIL;
  const isHelper=me.email && window.isStoreHelper(storeId,me.email);
  if(!isOwner && !isAdminUser && !isHelper){window.showToast("❌ ليس لديك صلاحية لهذا المتجر","error");return;}
  if(store.status!=="approved"){window.showToast("❌ المتجر غير معتمد","error");return;}
  window.closeOverlay();
  const data={id:store.id,name:store.name||"",category:store.category||"سيارات ومركبات",city:store.city||"",phone:store.phone||store.storePhone||"",status:store.status,ownerUid:store.ownerUid,ownerEmail:store.ownerEmail||""};
  window._tempStoreData=data;
  try{sessionStorage.setItem('_tempStoreData',JSON.stringify(data));}catch(e){}
  setTimeout(()=>window.showForm(true),200);
};

window.openMyStore = function(){
  if(!window.myStore){window.showToast("لا يوجد متجر","info");return;}
  window.openStore(window.myStore.id);
};

window.deleteStoreProduct = async function(id){
  if(!confirm("حذف هذا المنتج؟"))return;
  try{
    if(window.cart.items.some(i=>i.postId===id)){
      window.cart.items=window.cart.items.filter(i=>i.postId!==id);
      if(window.cart.items.length===0){window.cart.storeId=null;window.cart.storeName="";window.cart.storePhone="";}
      window.saveCart();window.updateCartUI();
    }
    await deleteDoc(doc(db,"posts",id));
    setTimeout(()=>{if(window._currentStoreId)window.openStore(window._currentStoreId,true);},300);
  }catch(e){window.showToast("خطأ: "+e.message,"error");}
};

/* ============================================================
   Transfer Posts to Store
   ============================================================ */
window.transferMyPostsToStore = async function(storeId){
  if(!auth.currentUser){window.showToast("⚠️ سجّل دخولك أولاً","warn");return;}
  const store=window.allStores.find(s=>s.id===storeId);
  if(!store){window.showToast("❌ المتجر غير موجود","error");return;}
  const isOwner=auth.currentUser.uid===store.ownerUid;
  if(!isOwner && !window.isAdmin){window.showToast("❌ ليس لديك صلاحية","error");return;}
  const myPosts=window.allPosts.filter(p=>p.uid===store.ownerUid && !p.storeId);
  if(myPosts.length===0){window.showToast("ℹ️ مفيش إعلانات فردية للنقل","info");return;}

  const overlay=document.createElement('div');
  overlay.id='transferPostsOverlay';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(15,23,42,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s ease-out;overflow-y:auto';

  let listHtml='';
  for(const p of myPosts){
    const imgArr=window.getImages(p);
    const thumb=imgArr[0]||'';
    const priceTxt=p.priceType==='contact'?'📞 تواصل':(p.price!=null?window.formatPrice(p.price)+' د.ل':'');
    const safeTitle=window.escapeHtml(p.title||'بدون عنوان');
    const thumbHtml=thumb
      ?'<img src="'+window.escapeHtml(thumb)+'" style="width:100%;height:100%;object-fit:cover">'
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
        '<div style="font-size:12.5px;color:#6b7280">اختر الإعلانات اللي تحب تنقلها لمتجر "<b>'+window.escapeHtml(store.name)+'</b>"</div>'+
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
    if(checked.length===0){window.showToast('⚠️ اختر إعلان واحد على الأقل','warn');return;}
    const ids=Array.from(checked).map(c=>c.getAttribute('data-post-id'));
    const btn=overlay.querySelector('#transferConfirmBtn');
    btn.disabled=true;
    btn.textContent='⏳ جاري النقل...';
    let ok=0,fail=0;
    for(const pid of ids){
      try{
        const p=myPosts.find(x=>x.id===pid);
        await updateDoc(doc(db,'posts',pid),{
          storeId:store.id,
          storeName:store.name,
          storeCategory:store.category,
          storePhone:store.phone||'',
          phone:store.phone||(p&&p.phone)||''
        });
        ok++;
      }catch(e){fail++;}
    }
    overlay.remove();
    window.showToast('✅ تم نقل '+ok+' إعلان للمتجر'+(fail>0?' (فشل '+fail+')':''),'success',3500);
    if(window._currentStoreId===store.id){setTimeout(()=>window.openStore(store.id,true),500);}
  };

  updateBtn();
};

/* ============================================================
   Edit Store
   ============================================================ */
window.openEditStore = function(storeId){
  const me=auth.currentUser;
  if(!me){window.authOverlay.classList.remove("hidden");return;}
  const store=window.allStores.find(s=>s.id===storeId);
  if(!store){window.showToast("❌ المتجر غير موجود","error");return;}
  const isOwnerStore=me.uid===store.ownerUid;
  if(!isOwnerStore && !window.isAdmin){window.showToast("❌ هذا المتجر ليس لك","error");return;}
  window.editStoreCurrentId=storeId;
  window.editStoreLogoImage=null;
  document.getElementById("editStoreName").value=store.name||"";
  document.getElementById("editStoreCategory").value=store.category||"سيارات ومركبات";
  document.getElementById("editStoreCity").value=store.city||"";
  document.getElementById("editStoreDescription").value=store.description||"";
  const _erp=document.getElementById("editStoreReceiptPhone");if(_erp)_erp.value=store.receiptPhone||"";
  window.toggleEditReceiptPhoneField();
  const wh=store.workingHours||{openTime:"09:00",closeTime:"23:00",alwaysOpen:false};
  document.getElementById("editStoreOpenTime").value=wh.openTime||"09:00";
  document.getElementById("editStoreCloseTime").value=wh.closeTime||"23:00";
  document.getElementById("editStoreAlwaysOpen").checked=!!wh.alwaysOpen;
  const bi=store.bankInfo||{};
  document.getElementById("editStoreBankOwner").value=bi.accountOwner||"";
  document.getElementById("editStoreBankName").value=bi.bankName||"";
  document.getElementById("editStoreBankIban").value=bi.iban||"";
  document.getElementById("editStoreBankAccount").value=bi.accountNumber||"";
  window.loadStoreHelpers(storeId);
  window.renderEditStoreLogo();
  window.closeOverlay();
  window.editStoreOverlay.classList.remove("hidden");
};
window.handleEditStoreLogo = function(){
  const input=document.getElementById("editStoreLogoFile");
  const f=input.files[0];
  if(!f)return;
  window.editStoreLogoImage={file:f,previewUrl:URL.createObjectURL(f)};
  input.value="";
  window.renderEditStoreLogo();
};
window.renderEditStoreLogo = function(){
  const box=document.getElementById("editStoreLogoThumbs");
  if(!box)return;
  box.innerHTML=window.editStoreLogoImage?`<div class="imgThumb"><img src="${window.editStoreLogoImage.previewUrl}"><button class="rm" onclick="editStoreLogoImage=null;renderEditStoreLogo()">×</button></div>`:"";
  const tile=document.getElementById("editStoreLogoAddTile");
  if(tile)tile.classList.toggle("hidden",!!window.editStoreLogoImage);
};
window.saveStoreEdits = async function(){
  if(!window.editStoreCurrentId){window.showToast("خطأ","error");return;}
  const store=window.allStores.find(s=>s.id===window.editStoreCurrentId);
  if(!store){window.showToast("❌ المتجر غير موجود","error");return;}
  const me=auth.currentUser;
  if(!me){window.authOverlay.classList.remove("hidden");return;}
  const isOwnerStore=me.uid===store.ownerUid;
  if(!isOwnerStore && !window.isAdmin){window.showToast("❌ غير مصرح","error");return;}
  const newName=document.getElementById("editStoreName").value.trim();
  const newCategory=document.getElementById("editStoreCategory").value;
  const newCity=document.getElementById("editStoreCity").value;
  const newDescription=document.getElementById("editStoreDescription").value.trim().slice(0,500);
  const newReceiptPhone=(document.getElementById("editStoreReceiptPhone")?.value||"").trim();
  const openTime=document.getElementById("editStoreOpenTime").value||"09:00";
  const closeTime=document.getElementById("editStoreCloseTime").value||"23:00";
  const alwaysOpen=document.getElementById("editStoreAlwaysOpen").checked;
  if(newName.length<2||newName.length>40){window.showToast("اسم المتجر بين 2 و40 حرف","warn");return;}
  if(!newCity){window.showToast("اختر المدينة","warn");return;}
  if(window.isRestaurantCategory(newCategory) && newReceiptPhone && newReceiptPhone.length<9){window.showToast("⚠️ رقم استلام الإيصالات قصير جداً","warn");return;}
  const bad=window.checkContent(newName,newDescription);
  if(bad){window.showToast("❌ كلمة ممنوعة: "+bad.word,"error");return;}
  const btn=document.getElementById("editStoreSubmitBtn");
  btn.disabled=true;btn.textContent="⏳ جاري الحفظ...";
  try{
    const updates={name:newName,category:newCategory,city:newCity,receiptPhone:(window.isRestaurantCategory(newCategory)?newReceiptPhone:""),description:newDescription,workingHours:{openTime,closeTime,alwaysOpen},helpers:window.currentStoreHelpers,bankInfo:{
      accountOwner:(document.getElementById("editStoreBankOwner")?.value||"").trim().slice(0,60),
      bankName:(document.getElementById("editStoreBankName")?.value||"").trim().slice(0,50),
      iban:(document.getElementById("editStoreBankIban")?.value||"").trim().slice(0,34),
      accountNumber:(document.getElementById("editStoreBankAccount")?.value||"").trim().slice(0,30)
    }};
    if(window.editStoreLogoImage){btn.textContent="⏳ جاري رفع الشعار...";updates.logo=await window.uploadToImgBB(window.editStoreLogoImage.file);}
    btn.textContent="⏳ جاري الحفظ...";
    await updateDoc(doc(db,"stores",window.editStoreCurrentId),updates);
    if(store.name!==newName){
      try{
        const storePosts=window.allPosts.filter(p=>p.storeId===window.editStoreCurrentId);
        for(const p of storePosts){try{await updateDoc(doc(db,"posts",p.id),{storeName:newName});}catch(e){}}
      }catch(e){}
    }
    window.showToast("✅ تم حفظ التعديلات بنجاح","success");
    window.closeOverlay();
    if(window._currentStoreId===window.editStoreCurrentId){setTimeout(()=>window.openStore(window.editStoreCurrentId,true),300);}
  }catch(e){window.showToast("❌ خطأ: "+e.message,"error");}
  finally{btn.disabled=false;btn.textContent="💾 حفظ التعديلات";}
};

/* ============================================================
   Open New Store
   ============================================================ */
window.startOpenStore = async function(){
  if(!auth.currentUser){window.authOverlay.classList.remove("hidden");return;}
  if(window.myStore){window.showToast("⚠️ لديك متجر بالفعل","warn");return;}
  const userPhone=(window.myProfile&&window.myProfile.phone)||"";
  if(!userPhone){window.showToast("❌ يجب تسجيل رقم الواتساب في حسابك أولاً.","error");return;}
  const myCount=window.allPosts.filter(p=>p.uid===auth.currentUser.uid && !p.storeId).length;
  if(myCount>0){
    window.showToast(`ℹ️ عندك ${myCount} إعلان فردي — تقدر تنقلهم لمتجرك بضغطة زر من صفحة المتجر بعد الموافقة`,"info",5000);
  }
  window.accountOverlay.classList.add("hidden");
  window.openStoreOverlay.classList.remove("hidden");
  window.storeLogoImage=null;window.storeCoverImage=null;
  document.getElementById("storeName").value="";
  document.getElementById("storeCategory").value="سيارات ومركبات";
  const _srp=document.getElementById("storeReceiptPhone");if(_srp)_srp.value="";
  window.toggleReceiptPhoneField();
  document.getElementById("storeCity").value="";
  document.getElementById("storePhone").value=userPhone;
  document.getElementById("storeDescription").value="";
  document.getElementById("storeOpenTime").value="09:00";
  document.getElementById("storeCloseTime").value="23:00";
  document.getElementById("storeAlwaysOpen").checked=false;
  document.getElementById("storeBankOwner").value="";
  document.getElementById("storeBankName").value="";
  document.getElementById("storeBankIban").value="";
  document.getElementById("storeBankAccount").value="";
  const delivEl=document.getElementById("storeDelivery");if(delivEl)delivEl.value="";
  window.renderStoreLogo();
  window.renderStoreCover();
};
window.handleStoreLogoSelected = function(){
  const input=document.getElementById("storeLogoFile");
  const f=input.files[0];
  if(!f)return;
  window.storeLogoImage={file:f,previewUrl:URL.createObjectURL(f)};
  input.value="";
  window.renderStoreLogo();
};
window.handleStoreCoverSelected = function(){
  const input=document.getElementById("storeCoverFile");
  const f=input.files[0];
  if(!f)return;
  window.storeCoverImage={file:f,previewUrl:URL.createObjectURL(f)};
  input.value="";
  window.renderStoreCover();
};
window.renderStoreLogo = function(){
  const box=document.getElementById("storeLogoThumbs");
  box.innerHTML=window.storeLogoImage?`<div class="imgThumb"><img src="${window.storeLogoImage.previewUrl}"><button class="rm" onclick="storeLogoImage=null;renderStoreLogo()">×</button></div>`:"";
  document.getElementById("storeLogoAddTile").classList.toggle("hidden",!!window.storeLogoImage);
};
window.renderStoreCover = function(){
  const box=document.getElementById("storeCoverThumbs");
  box.innerHTML=window.storeCoverImage?`<div class="imgThumb"><img src="${window.storeCoverImage.previewUrl}"><button class="rm" onclick="storeCoverImage=null;renderStoreCover()">×</button></div>`:"";
  document.getElementById("storeCoverAddTile").classList.toggle("hidden",!!window.storeCoverImage);
};

window.submitStore = async function(){
  if(!auth.currentUser)return;
  const name=document.getElementById("storeName").value.trim();
  const category=document.getElementById("storeCategory").value;
  const city=document.getElementById("storeCity").value;
  const description=document.getElementById("storeDescription").value.trim().slice(0,500);
  const userPhone=(window.myProfile&&window.myProfile.phone)||"";
  const receiptPhone=document.getElementById("storeReceiptPhone")?.value.trim()||"";
  if(!userPhone){window.showToast("❌ يجب تسجيل رقم الواتساب أولاً","error");return;}
  if(window.isRestaurantCategory(category) && receiptPhone && receiptPhone.length<9){window.showToast("⚠️ رقم استلام الإيصالات قصير جداً","warn");return;}
  const phone=userPhone;
  if(name.length<2||name.length>40){window.showToast("اسم المتجر بين 2 و40 حرف","warn");return;}
  if(!city){window.showToast("اختر المدينة","warn");return;}
  if(!window.storeLogoImage){window.showToast("أضف شعار المتجر","warn");return;}
  const bad=window.checkContent(name,description);
  if(bad){window.showToast("❌ يحتوي على كلمة ممنوعة: "+bad.word,"error");return;}
  const openTime=document.getElementById("storeOpenTime")?.value||"09:00";
  const closeTime=document.getElementById("storeCloseTime")?.value||"23:00";
  const alwaysOpen=document.getElementById("storeAlwaysOpen")?.checked||false;
  const deliveryCompany=document.getElementById("storeDelivery")?.value||"";
  const btn=document.getElementById("storeSubmitBtn");
  btn.disabled=true;btn.textContent="جاري الإرسال...";
  try{
    const logoUrl=await window.uploadToImgBB(window.storeLogoImage.file);
    let coverUrl="";
    if(window.storeCoverImage)coverUrl=await window.uploadToImgBB(window.storeCoverImage.file);
    const bankInfo={
      accountOwner:(document.getElementById("storeBankOwner")?.value||"").trim().slice(0,60),
      bankName:(document.getElementById("storeBankName")?.value||"").trim().slice(0,50),
      iban:(document.getElementById("storeBankIban")?.value||"").trim().slice(0,34),
      accountNumber:(document.getElementById("storeBankAccount")?.value||"").trim().slice(0,30)
    };
    const storeData={ownerUid:auth.currentUser.uid,ownerUsername:(window.myProfile&&window.myProfile.username)||"",ownerMemberNo:(window.myProfile&&window.myProfile.memberNo)||null,name,category,city,phone,receiptPhone:(window.isRestaurantCategory(category)?receiptPhone:""),description,logo:logoUrl,cover:coverUrl,workingHours:{openTime,closeTime,alwaysOpen},deliveryCompany,bankInfo,helpers:[],status:"pending",rejectReason:"",createdAt:Date.now(),approvedAt:null,verified:false};
    const ref=await addDoc(collection(db,"stores"),storeData);
    try{await updateDoc(doc(db,"profiles",auth.currentUser.uid),{storeId:ref.id});}catch(e){}
    window.showToast("✅ تم إرسال طلب فتح المتجر — سيظهر بعد موافقة الإدارة","success");
    window.closeOverlay();
  }catch(e){window.showToast("خطأ: "+e.message,"error");}
  finally{btn.disabled=false;btn.textContent="📤 إرسال طلب الفتح";}
};

/* ============================================================
   Stores Admin
   ============================================================ */
window.switchStoresTab = function(tab){window.storesModTab=tab;window.renderStoresModeration();};

window.toggleStoreVerify = async function(id){
  if(!window.isAdmin)return;
  const store=window.allStores.find(s=>s.id===id);
  if(!store){window.showToast("❌ المتجر غير موجود","error");return;}
  const isVerified=!!store.verified;
  const msg=isVerified ? `إلغاء توثيق المتجر: ${store.name}؟` : `توثيق المتجر: ${store.name}؟\n\nراح تظهر العلامة الزرقاء ✓ على المتجر.`;
  if(!confirm(msg))return;
  try{
    await updateDoc(doc(db,"stores",id),{
      verified:!isVerified,
      verifiedAt:!isVerified?Date.now():null,
      verifiedBy:!isVerified?(auth.currentUser&&auth.currentUser.email)||"admin":null
    });
    window.showToast(isVerified?"✅ تم إلغاء التوثيق":"✅ تم توثيق المتجر بنجاح","success");
    window.renderStoresModeration();
  }catch(e){window.showToast("خطأ: "+e.message,"error");}
};

window.renderStoresModeration = function(){
  const list=document.getElementById("storesModerationList");
  if(!list)return;
  const tabs={all:"smTabAll",pending:"smTabPending",approved:"smTabApproved",rejected:"smTabRejected"};
  Object.entries(tabs).forEach(([k,id])=>{
    const b=document.getElementById(id);
    if(!b)return;
    const active=window.storesModTab===k;
    b.style.border=active?"3px solid #0284c7":"2px solid transparent";
    b.style.transform=active?"scale(1.05)":"scale(1)";
  });
  let filtered=window.allStores;
  if(window.storesModTab==="pending")filtered=window.allStores.filter(s=>s.status==="pending");
  else if(window.storesModTab==="approved")filtered=window.allStores.filter(s=>s.status==="approved");
  else if(window.storesModTab==="rejected")filtered=window.allStores.filter(s=>s.status==="rejected");
  filtered=filtered.slice().sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  if(filtered.length===0){list.innerHTML="<div class='reportsEmpty'>لا توجد متاجر في هذا القسم</div>";return;}
  list.innerHTML=filtered.map(s=>{
    const logo=s.logo?`<img src="${window.escapeHtml(s.logo)}" style="width:70px;height:70px;border-radius:12px;object-fit:cover;border:1px solid var(--border)">`:`<div style="width:70px;height:70px;border-radius:12px;background:#e6f6fe;display:flex;align-items:center;justify-content:center;font-size:30px">🏪</div>`;
    let border="2px dashed #f59e0b",bg="#fffbf0",label="⏳ قيد المراجعة";
    if(s.status==="approved"){border="2px solid #16a34a";bg="#f0fdf4";label="✅ معتمد";}
    else if(s.status==="rejected"){border="2px solid #e5484d";bg="#fdeceb";label="❌ مرفوض";}
    const count=window.allPosts.filter(p=>p.storeId===s.id).length;
    const verifiedBadge=s.verified?`<span class="verifiedBadge" title="موثق"></span>`:"";
    const isRest=window.isRestaurantStore(s);
    const badgeHTML=isRest?`<span class="restaurantBadge">🍽️ مطعم</span>`:`<span class="storeBadge">🏢 شركة/متجر</span>`;
    return `<div style="border:${border};border-radius:14px;padding:12px;margin-bottom:14px;background:${bg}"><div style="font-size:12px;font-weight:800;margin-bottom:8px">${label} · 📦 ${count} منتج · ${badgeHTML} ${s.verified?'· <span style="color:#1877F2">✓ موثق</span>':''}</div><div style="display:flex;gap:12px;align-items:center">${logo}<div style="flex:1"><div style="font-weight:800;font-size:16px">${window.escapeHtml(s.name)} ${verifiedBadge}</div><div style="font-size:12px;color:var(--muted);margin-top:4px">📁 ${window.escapeHtml(s.category)} · 📍 ${window.escapeHtml(s.city)}</div></div></div><div style="background:#fff;padding:10px;border-radius:10px;margin-top:10px;font-size:13px;line-height:1.8;border:1px solid var(--border)">${window.escapeHtml(s.description||"لا يوجد وصف")}</div><div style="font-size:12px;color:var(--muted);margin-top:8px;line-height:1.7">👤 ${window.escapeHtml(s.ownerUsername?"@"+s.ownerUsername:(s.ownerMemberNo?"#"+s.ownerMemberNo:"—"))} · ☎️ ${window.escapeHtml(s.phone||"")} · ⏰ ${window.timeAgo(s.createdAt)}${s.deliveryCompany?"<br>🛵 التوصيل: "+window.escapeHtml(s.deliveryCompany):""}${s.rejectReason?"<br>📝 <b>سبب الرفض:</b> "+window.escapeHtml(s.rejectReason):""}${s.receiptPhone?"<br>🧾 واتساب الإيصالات: "+window.escapeHtml(s.receiptPhone):""}</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:12px">${s.status!=="approved"?`<button onclick="approveStore('${s.id}')" style="padding:12px;border:none;border-radius:9px;background:#16a34a;color:#fff;font-family:inherit;font-size:13.5px;font-weight:800;cursor:pointer">✅ موافقة</button>`:""}${s.status!=="rejected"?`<button onclick="rejectStore('${s.id}')" style="padding:12px;border:none;border-radius:9px;background:#f59e0b;color:#3a2500;font-family:inherit;font-size:13.5px;font-weight:800;cursor:pointer">🚫 رفض</button>`:""}<button onclick="openStore('${s.id}',false,'categories')" style="padding:12px;border:none;border-radius:9px;background:#0284c7;color:#fff;font-family:inherit;font-size:13.5px;font-weight:800;cursor:pointer">👁️ عرض</button><button onclick="toggleStoreVerify('${s.id}')" style="padding:12px;border:none;border-radius:9px;background:${s.verified?'#8a93a3':'#1877F2'};color:#fff;font-family:inherit;font-size:13.5px;font-weight:800;cursor:pointer">${s.verified?'✕ إلغاء':'✓ توثيق'}</button><button onclick="deleteStore('${s.id}')" style="padding:12px;border:none;border-radius:9px;background:#e5484d;color:#fff;font-family:inherit;font-size:13.5px;font-weight:800;cursor:pointer">🗑️ حذف</button></div></div>`;
  }).join("");
};

window.approveStore = async function(id){
  if(!window.isAdmin)return;
  try{
    await updateDoc(doc(db,"stores",id),{status:"approved",approvedAt:Date.now(),rejectReason:""});
    window.showToast("✅ تم قبول المتجر","success");
    window.renderStoresModeration();
  }catch(e){window.showToast("خطأ: "+e.message,"error");}
};
window.rejectStore = async function(id){
  if(!window.isAdmin)return;
  const reason=prompt("سبب الرفض:","معلومات غير كافية");
  if(reason===null)return;
  try{
    await updateDoc(doc(db,"stores",id),{status:"rejected",rejectReason:reason||"مرفوض",rejectedAt:Date.now()});
    window.showToast("✅","success");
    window.renderStoresModeration();
  }catch(e){window.showToast("خطأ: "+e.message,"error");}
};
window.deleteStore = async function(id){
  if(!window.isAdmin)return;
  const store=window.allStores.find(s=>s.id===id);
  if(!store)return;
  const count=window.allPosts.filter(p=>p.storeId===id).length;
  if(!confirm(`⚠️ حذف نهائي\n\n🏪 ${store.name}\n📦 ${count} منتج`))return;
  const c=prompt('اكتب "حذف" للتأكيد:');
  if(c!=="حذف"){window.showToast("تم الإلغاء","info");return;}
  try{
    let okP=0;
    for(const p of window.allPosts.filter(p=>p.storeId===id)){try{await deleteDoc(doc(db,"posts",p.id));okP++;}catch(e){}}
    await deleteDoc(doc(db,"stores",id));
    if(store.ownerUid){try{await updateDoc(doc(db,"profiles",store.ownerUid),{storeId:null});}catch(e){}}
    if(window.cart.storeId===id){window.cart={storeId:null,storeName:"",storePhone:"",items:[]};window.saveCart();window.updateCartUI();}
    window.showToast(`✅ تم الحذف + ${okP} منتج`,"success");
    window.renderStoresModeration();
  }catch(e){window.showToast("خطأ: "+e.message,"error");}
};

window.openStoresModeration = function(){
  window.renderStoresModeration();
  window.storesModerationOverlay.classList.remove("hidden");
  window.accountOverlay.classList.add("hidden");
};

/* ============================================================
   Account Overlay
   ============================================================ */
window.openAccount = function(){
  if(auth.currentUser){
    document.getElementById("accountEmail").textContent="";
    const dn=(window.myProfile&&window.myProfile.name)||auth.currentUser.displayName||"مستخدم";
    document.getElementById("accountName").textContent="👤 "+dn;
    document.getElementById("myName").value=(window.myProfile&&window.myProfile.name)||auth.currentUser.displayName||"";
    const mnEl=document.getElementById("accountMemberNo");
    if(mnEl){
      if(window.myProfile&&window.myProfile.memberNo!=null){mnEl.textContent="🔢 رقم العضوية: #"+window.myProfile.memberNo;mnEl.style.display="block";}
      else{mnEl.textContent="⏳ جاري تعيين رقم العضوية...";mnEl.style.display="block";}
    }
    const unEl=document.getElementById("accountUsername");
    if(unEl){
      if(window.myProfile&&window.myProfile.username){unEl.textContent="🏷️ @"+window.myProfile.username;unEl.style.display="block";}
      else{unEl.textContent="⚠️ لم تختر اسم مستخدم بعد";unEl.style.display="block";}
    }
    const stEl=document.getElementById("accountStore");
    if(stEl){
      if(window.myStore){
        const st=window.myStore.status==="approved"?"✅ متجر: ":window.myStore.status==="pending"?"⏳ متجر (قيد المراجعة): ":"❌ متجر (مرفوض): ";
        stEl.textContent=st+window.myStore.name;
        stEl.style.display="block";
      }else{stEl.style.display="none";}
    }
    const myUserInput=document.getElementById("myUsername");if(myUserInput)myUserInput.value=(window.myProfile&&window.myProfile.username)||"";
    const myPhoneInput=document.getElementById("myPhone");if(myPhoneInput)myPhoneInput.value=(window.myProfile&&window.myProfile.phone)||"";
    const openBtn=document.getElementById("openStoreBtn");
    const myBtn=document.getElementById("myStoreBtn");
    if(window.myStore){
      if(openBtn)openBtn.style.display="none";
      if(myBtn){myBtn.style.display="block";myBtn.textContent=window.myStore.status==="approved"?"🏪 متجري":window.myStore.status==="pending"?"⏳ متجري (قيد المراجعة)":"❌ متجري (مرفوض)";}
    }else{
      if(openBtn)openBtn.style.display="block";
      if(myBtn)myBtn.style.display="none";
    }
    window.reportsBtn.classList.toggle("hidden",!window.isAdmin);
    if(window.moderationBtn)window.moderationBtn.classList.toggle("hidden",!window.isAdmin);
    const lb=document.getElementById("limitsBtn");if(lb)lb.classList.toggle("hidden",!window.isAdmin);
    const smb=document.getElementById("storesModerationBtn");if(smb)smb.classList.toggle("hidden",!window.isAdmin);
    const eb=document.getElementById("expiredBtn");if(eb)eb.classList.toggle("hidden",!window.isAdmin);
    const notifBtn=document.getElementById("sendNotifBtn");if(notifBtn)notifBtn.classList.toggle("hidden",!window.isAdmin);
    const dash=document.getElementById("dashboardBtn");if(dash)dash.classList.toggle("hidden",!window.isAdmin);
    window.accountOverlay.classList.remove("hidden");
  }else{
    window.pendingAction=null;
    window.authOverlay.classList.remove("hidden");
  }
};

/* ============================================================
   Save Name / Username / Phone
   ============================================================ */
window.saveMyName = async function(){
  const me=auth.currentUser;
  if(!me)return;
  const name=document.getElementById("myName").value.trim();
  if(name.length<2||name.length>30){window.showToast("الاسم بين 2 و30 حرفاً","warn");return;}
  try{
    if(window.myProfile && window.myProfile.memberNo!=null)await updateDoc(doc(db,"profiles",me.uid),{name});
    else await window.assignMemberNumber(me,name);
    const mine=window.allPosts.filter(p=>p.uid===me.uid);
    await Promise.all(mine.map(p=>updateDoc(doc(db,"posts",p.id),{sellerName:name})));
    if(window.myStore){await updateDoc(doc(db,"stores",window.myStore.id),{ownerUsername:(window.myProfile&&window.myProfile.username)||""});}
    window.showToast("✅ تم حفظ الاسم","success");
  }catch(e){window.showToast("تعذر حفظ الاسم: "+e.message,"error");}
};

window.saveMyUsername = async function(){
  const me=auth.currentUser;
  if(!me){window.authOverlay.classList.remove("hidden");return;}
  const input=document.getElementById("myUsername");
  const raw=(input.value||"").trim().toLowerCase();
  const oldUsername=(window.myProfile&&window.myProfile.username)||"";
  if(!raw){window.showToast("اكتب اسم المستخدم أولاً","warn");return;}
  if(raw===oldUsername){window.showToast("هذا اسمك الحالي بالفعل","info");return;}
  if(!confirm(`هل تريد حفظ اسم المستخدم: @${raw}؟`))return;
  const res=await window.reserveUsername(me,raw,oldUsername);
  if(res.ok){
    window.showToast("✅ تم حفظ اسم المستخدم: @"+res.value,"success");
    if(input)input.value=res.value;
    if(window.myStore){try{await updateDoc(doc(db,"stores",window.myStore.id),{ownerUsername:res.value});}catch(e){}}
  }else{window.showToast("❌ "+res.msg,"error");}
};

window.saveMyPhone = async function(){
  const me=auth.currentUser;
  if(!me){window.authOverlay.classList.remove("hidden");return;}
  const input=document.getElementById("myPhone");
  const v=window.validatePhone(input.value);
  if(!v.ok){window.showToast("❌ "+v.msg,"error");return;}
  const oldPhone=(window.myProfile&&window.myProfile.phone)||"";
  const editsCount=(window.myProfile&&window.myProfile.phoneEditsCount)||0;
  if(oldPhone && window.normalizePhone(oldPhone)===v.value){window.showToast("هذا رقمك الحالي بالفعل","info");return;}
  if(oldPhone && editsCount>=1){
    const msg=`📱 طلب تعديل رقم واتساب\n\n👤 الاسم: ${(window.myProfile&&window.myProfile.name)||''}\n🔢 رقم العضوية: #${(window.myProfile&&window.myProfile.memberNo)||''}\n🏷️ اسم المستخدم: @${(window.myProfile&&window.myProfile.username)||'—'}\n📱 الرقم الحالي: ${oldPhone}\n📱 الرقم الجديد: ${v.value}`;
    if(confirm(`⚠️ لقد استخدمت فرصتك الوحيدة لتعديل الرقم.\n\n💬 للتواصل مع الإدارة عبر واتساب؟`)){
      window.open(`https://wa.me/${window.ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`,'_blank');
    }
    return;
  }
  let confirmMsg,updates;
  if(!oldPhone){confirmMsg=`هل تريد حفظ رقم الواتساب: ${v.value}؟\n\n⚠️ سيظهر في كل إعلاناتك.`;updates={phone:v.value};}
  else{confirmMsg=`هل تريد تغيير رقم الواتساب من ${oldPhone} إلى ${v.value}؟\n\n⚠️ هذه فرصتك الوحيدة للتعديل!`;updates={phone:v.value,phoneEditsCount:1};}
  if(!confirm(confirmMsg))return;
  try{
    await updateDoc(doc(db,"profiles",me.uid),updates);
    const mine=window.allPosts.filter(p=>p.uid===me.uid);
    await Promise.all(mine.map(p=>updateDoc(doc(db,"posts",p.id),{phone:v.value})));
    if(window.myStore){try{await updateDoc(doc(db,"stores",window.myStore.id),{phone:v.value});}catch(e){}}
    if(input)input.value=v.value;
    window.showToast("✅ تم حفظ رقم الواتساب: "+v.value,"success");
  }catch(e){window.showToast("❌ خطأ: "+e.message,"error");}
};

/* ============================================================
   Following + Ratings
   ============================================================ */
window.startFollowingListener = function(user){
  window.stopFollowingListener();
  window.unsubFollowing=onSnapshot(collection(db,"users",user.uid,"following"),snap=>{
    window.myFollowing=snap.docs.map(d=>({uid:d.id,...d.data()}));
  },err=>{});
};
window.stopFollowingListener = function(){
  if(window.unsubFollowing){window.unsubFollowing();window.unsubFollowing=null;}
  window.myFollowing=[];
};
window.isFollowing = function(uid){return window.myFollowing.some(f=>f.uid===uid);};

window.toggleFollow = async function(sellerUid,event){
  if(event)event.stopPropagation();
  const me=auth.currentUser;
  if(!me){window.pendingAction={type:"follow",sellerUid};window.authOverlay.classList.remove("hidden");return;}
  if(me.uid===sellerUid){window.showToast("لا يمكنك متابعة نفسك 😊","warn");return;}
  const followRef=doc(db,"users",me.uid,"following",sellerUid);
  const followerRef=doc(db,"users",sellerUid,"followers",me.uid);
  try{
    if(window.isFollowing(sellerUid)){
      await deleteDoc(followRef).catch(()=>{});
      await deleteDoc(followerRef).catch(()=>{});
      if(window.sellerPanelUid===sellerUid){setTimeout(()=>window.openSeller(sellerUid),300);}
    }else{
      const now=Date.now();
      await setDoc(followRef,{followedAt:now});
      await setDoc(followerRef,{followedAt:now,followerName:(window.myProfile&&window.myProfile.name)||me.displayName||"مستخدم"});
      if(window.sellerPanelUid===sellerUid){setTimeout(()=>window.openSeller(sellerUid),300);}
    }
  }catch(e){window.showToast("خطأ: "+e.message,"error");}
};

window.starsText = function(n){
  const r=Math.max(0,Math.min(5,Math.round(n)));
  return "★".repeat(r)+"☆".repeat(5-r);
};
window.loginToRate = function(){window.closeOverlay();window.authOverlay.classList.remove("hidden");};
window.openMySeller = function(){if(auth.currentUser)window.openSeller(auth.currentUser.uid);};

window.openSeller = async function(uid){
  window.sellerPanelUid=uid;
  window.accountOverlay.classList.add("hidden");
  window.postOverlay.classList.add("hidden");
  window.sellerOverlay.classList.remove("hidden");
  const box=document.getElementById("sellerContent");
  box.innerHTML="<div class='reportsEmpty'>جاري التحميل...</div>";
  const pP=getDoc(doc(db,"profiles",uid)).catch(()=>null);
  const rP=getDocs(query(collection(db,"ratings"),where("sellerUid","==",uid))).catch(()=>null);
  const fP=getDocs(collection(db,"users",uid,"followers")).catch(()=>null);
  const [pS,rS,fS]=await Promise.all([pP,rP,fP]);
  const prof=(pS&&pS.exists())?pS.data():null;
  const ratings=rS?rS.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)):[];
  const followersCount=fS?fS.size:0;
  window.renderSeller(uid,prof,ratings,!!fS,ratings,followersCount);
};

window.renderSeller = function(uid,prof,ratings,ratingsFailed,allRatings,followersCount){
  const box=document.getElementById("sellerContent");
  const posts=window.allPosts.filter(p=>p.uid===uid && window.getStatus(p)==="approved" && !window.isExpired(p) && !p.sold);
  const totalPostsBySeller=window.allPosts.filter(p=>p.uid===uid && window.getStatus(p)==="approved").length;
  const tierBadge=window.renderSellerTierBadge(uid,totalPostsBySeller);
  const name=(prof&&prof.name)||(posts[0]&&posts[0].sellerName)||"بائع";
  const memberNo=prof&&prof.memberNo;
  const uname=prof&&prof.username;
  const ph=prof&&prof.phone;
  const count=ratings.length;
  const avg=count?ratings.reduce((s,r)=>s+(r.stars||0),0)/count:0;
  const me=auth.currentUser;
  const isMe=!!me&&me.uid===uid;
  const mine=me?ratings.find(r=>r.raterUid===me.uid):null;
  const following=window.isFollowing(uid);
  window.selectedStars=mine?(mine.stars||0):0;
  let rateHtml="";
  if(isMe)rateHtml="";
  else if(!me)rateHtml=`<button class="btnGhost" onclick="loginToRate()">سجّل دخولك لتقييم البائع</button>`;
  else rateHtml=`<div style="font-weight:800;margin:12px 0 4px">${mine?"تحديث تقييمك":"قيّم هذا البائع"}</div><div class="starPick" id="starPick">${[1,2,3,4,5].map(n=>`<button class="${n<=window.selectedStars?"on":""}" onclick="setStars(${n})">★</button>`).join("")}</div><textarea id="ratingComment" rows="3" maxlength="300" placeholder="تعليق (اختياري)">${window.escapeHtml(mine?(mine.comment||""):"")}</textarea><button class="btnMain" onclick="submitRating()">${mine?"تحديث التقييم":"إرسال التقييم"}</button>`;
  const reviewsHtml=count?ratings.map(r=>{
    const canDel=window.isAdmin||(me&&r.raterUid===me.uid);
    return `<div class="reviewItem"><div class="rvTop"><span><b>${window.escapeHtml(r.raterName||"مستخدم")}</b> <span class="starsRow">${window.starsText(r.stars||0)}</span></span><span>${canDel?`<button class="rvDel" onclick="deleteRating('${window.escapeHtml(r.id)}')">حذف</button> `:""}${window.timeAgo(r.createdAt)}</span></div>${r.comment?`<div class="rvText">${window.escapeHtml(r.comment)}</div>`:""}</div>`;
  }).join(""):`<div class="reportsEmpty">لا توجد تقييمات بعد</div>`;
  let badges="";
  if(uname)badges+=`<span class="usernameBadge" style="margin:4px 4px 0 0;font-size:13px;padding:5px 12px">@${window.escapeHtml(uname)}</span>`;
  if(memberNo)badges+=`<span class="memberNoBadge" style="margin:4px 4px 0 0;font-size:13px;padding:5px 12px">#${memberNo}</span>`;
  if(ph)badges+=`<span class="phoneBadge" style="margin:4px 4px 0 0;font-size:13px;padding:5px 12px">📱 ${window.escapeHtml(window.normalizePhone(ph))}</span>`;
  let followHtml="";
  if(!isMe){
    if(following){followHtml=`<button class="followBtn following" onclick="toggleFollow('${uid}',event)">✓ متابَع</button>`;}
    else{followHtml=`<button class="followBtn" onclick="toggleFollow('${uid}',event)">+ متابعة</button>`;}
  }
  box.innerHTML=`<div class="sHead"><div class="sName">👤 ${window.escapeHtml(name)}${tierBadge}</div><div>${badges}</div><div class="starsRow" style="font-size:18px;margin-top:6px">${window.starsText(avg)} <span style="font-size:13px;color:var(--muted)">${count?avg.toFixed(1)+" ("+count+" تقييم)":"بدون تقييمات"}</span></div><div style="margin-top:10px">${followHtml}</div></div><div class="sStats"><div class="sStat"><b>${posts.length}</b><span>إعلانات</span></div><div class="sStat"><b>${followersCount}</b><span>متابع</span></div><div class="sStat"><b>${count}</b><span>تقييمات</span></div></div>${rateHtml}<div style="font-weight:800;margin:14px 0 2px">التقييمات</div>${reviewsHtml}`;
};

window.setStars = function(n){
  window.selectedStars=n;
  document.querySelectorAll("#starPick button").forEach((b,i)=>b.classList.toggle("on",i<n));
};
window.submitRating = async function(){
  const me=auth.currentUser;
  if(!me){window.loginToRate();return;}
  const uid=window.sellerPanelUid;
  if(!uid||uid===me.uid)return;
  if(!window.selectedStars){window.showToast("اختر النجوم","warn");return;}
  const comment=(document.getElementById("ratingComment").value||"").trim().slice(0,300);
  const raterName=(window.myProfile&&window.myProfile.name)||window.defaultName(me);
  try{
    await setDoc(doc(db,"ratings",uid+"_"+me.uid),{sellerUid:uid,raterUid:me.uid,raterName,stars:window.selectedStars,comment,createdAt:Date.now()});
    window.addPoints(me.uid, 3, '⭐ قيّمت بائعاً', 'rating');
    await window.openSeller(uid);
  }catch(e){window.showToast("تعذر إرسال التقييم: "+e.message,"error");}
};
window.deleteRating = async function(id){
  if(!confirm("حذف هذا التقييم؟"))return;
  try{await deleteDoc(doc(db,"ratings",id));await window.openSeller(window.sellerPanelUid);}
  catch(e){window.showToast("خطأ: "+e.message,"error");}
};

/* ============================================================
   Profile + Member Number + Username Reservation
   ============================================================ */
window.defaultName = function(u){
  const dn=(u.displayName||"").trim().slice(0,30);
  if(dn.length>=2)return dn;
  if(u.phoneNumber)return "مستخدم "+u.phoneNumber.slice(-4);
  const e=(u.email||"").split("@")[0].slice(0,30);
  if(e.length>=2)return e;
  return "مستخدم "+u.uid.slice(0,4);
};
window.profileCreatedAt = function(u){
  const t=Date.parse(u.metadata&&u.metadata.creationTime);
  return isNaN(t)?Date.now():t;
};

window.assignMemberNumber = async function(user,customName){
  if(!user)return null;
  const counterRef=doc(db,"counters","users");
  const profileRef=doc(db,"profiles",user.uid);
  try{
    const memberNo=await runTransaction(db,async (transaction)=>{
      const profileSnap=await transaction.get(profileRef);
      const counterSnap=await transaction.get(counterRef);
      if(profileSnap.exists() && profileSnap.data().memberNo!=null){return profileSnap.data().memberNo;}
      let currentNumber=1000;
      if(counterSnap.exists() && typeof counterSnap.data().lastNumber==="number"){currentNumber=counterSnap.data().lastNumber;}
      const newNumber=currentNumber+1;
      if(counterSnap.exists()){transaction.update(counterRef,{lastNumber:newNumber});}else{transaction.set(counterRef,{lastNumber:newNumber});}
      if(profileSnap.exists()){
        const updates={memberNo:newNumber};
        if(customName)updates.name=customName;
        transaction.update(profileRef,updates);
      }else{
        const name=customName||window.defaultName(user);
        transaction.set(profileRef,{name,createdAt:window.profileCreatedAt(user),memberNo:newNumber,username:"",storeId:null,phone:"",phoneEditsCount:0});
      }
      return newNumber;
    });
    return memberNo;
  }catch(e){return null;}
};

window.reserveUsername = async function(user,newUsername,oldUsername){
  if(!user)return{ok:false,msg:"لست مسجلاً"};
  const v=window.validateUsername(newUsername);
  if(!v.ok)return{ok:false,msg:v.msg};
  const u=v.value;
  const usernameRef=doc(db,"usernames",u);
  const profileRef=doc(db,"profiles",user.uid);
  try{
    await runTransaction(db,async (transaction)=>{
      const uSnap=await transaction.get(usernameRef);
      const pSnap=await transaction.get(profileRef);
      if(uSnap.exists() && uSnap.data().uid!==user.uid){throw new Error("TAKEN");}
      const now=Date.now();
      if(!uSnap.exists()){transaction.set(usernameRef,{uid:user.uid,createdAt:now});}
      if(pSnap.exists()){transaction.update(profileRef,{username:u});}
      else{transaction.set(profileRef,{name:window.defaultName(user),createdAt:window.profileCreatedAt(user),memberNo:1001,username:u,storeId:null,phone:"",phoneEditsCount:0});}
    });
    if(oldUsername && oldUsername!==u){
      try{
        const oldRef=doc(db,"usernames",oldUsername);
        const oldSnap=await getDoc(oldRef);
        if(oldSnap.exists() && oldSnap.data().uid===user.uid){await deleteDoc(oldRef);}
      }catch(e){}
    }
    try{
      const mine=window.allPosts.filter(p=>p.uid===user.uid);
      await Promise.all(mine.map(p=>updateDoc(doc(db,"posts",p.id),{sellerUsername:u})));
    }catch(e){}
    return{ok:true,value:u};
  }catch(e){
    if(e.message==="TAKEN")return{ok:false,msg:"هذا الاسم محجوز، جرّب اسم ثاني"};
    return{ok:false,msg:"تعذر حفظ اسم المستخدم: "+(e.message||"خطأ")};
  }
};

window.startProfileListener = function(user){
  window.stopProfileListener();
  window.profileCreateTried=false;
  let assignAttempted=false;
  window.unsubProfile=onSnapshot(doc(db,"profiles",user.uid),snap=>{
    if(snap.exists()){
      window.myProfile=snap.data();
      const i=document.getElementById("myName");
      if(i && document.activeElement!==i)i.value=window.myProfile.name||"";
      const ui=document.getElementById("myUsername");
      if(ui && document.activeElement!==ui)ui.value=window.myProfile.username||"";
      const pi=document.getElementById("myPhone");
      if(pi && document.activeElement!==pi)pi.value=window.myProfile.phone||"";
      if(window.myProfile.memberNo==null && !assignAttempted){
        assignAttempted=true;
        window.assignMemberNumber(user).catch(e=>{});
      }
      if(!window.unsubStore){window.startStoreListener(user.uid);}
    }else if(!window.profileCreateTried){
      window.profileCreateTried=true;
      window.assignMemberNumber(user).catch(e=>{});
    }
  },err=>{});
};
window.stopProfileListener = function(){
  if(window.unsubProfile){window.unsubProfile();window.unsubProfile=null;}
  window.myProfile=null;
};

/* ============================================================
   Banner
   ============================================================ */
window.bannerImages=[];
window.bannerCurrentIndex=0;
window.bannerTimer=null;
window.loadBanner = async function(){
  try{
    const snap=await getDoc(doc(db,"settings","banner"));
    if(snap.exists()){const data=snap.data();window.bannerImages=Array.isArray(data.images)?data.images:[];}
    else{window.bannerImages=[];}
  }catch(e){window.bannerImages=[];}
  window.renderBanner();
};
window.renderBanner = function(){
  const carousel=document.getElementById("bannerCarousel");
  const empty=document.getElementById("bannerEmpty");
  const slidesBox=document.getElementById("bannerSlides");
  const dotsBox=document.getElementById("bannerDots");
  if(!carousel||!empty||!slidesBox||!dotsBox)return;
  const validImgs=window.bannerImages.filter(x=>x && x.url);
  if(validImgs.length===0){carousel.classList.add("hidden");empty.classList.remove("hidden");return;}
  carousel.classList.remove("hidden");empty.classList.add("hidden");
  slidesBox.innerHTML=validImgs.map(img=>{
    const imgTag=`<img src="${window.escapeHtml(img.url)}" onerror="this.parentElement.innerHTML=''" loading="lazy">`;
    if(img.link && img.link.trim()){return `<div class="bSlide" onclick="window.open('${window.escapeHtml(img.link)}','_blank')">${imgTag}</div>`;}
    return `<div class="bSlide">${imgTag}</div>`;
  }).join("");
  if(validImgs.length>1){
    dotsBox.innerHTML=validImgs.map((_,i)=>`<span class="bDot${i===0?' active':''}" onclick="goToBannerSlide(${i})"></span>`).join("");
    dotsBox.style.display="flex";
    window.startBannerAuto();
    slidesBox.onscroll=()=>{
      const idx=Math.round(slidesBox.scrollLeft/(slidesBox.clientWidth||1));
      window.updateBannerDots(idx);
    };
  }else{
    dotsBox.innerHTML="";
    dotsBox.style.display="none";
    if(window.bannerTimer){clearInterval(window.bannerTimer);window.bannerTimer=null;}
  }
};
window.goToBannerSlide = function(i){
  const slidesBox=document.getElementById("bannerSlides");
  if(!slidesBox)return;
  slidesBox.scrollTo({left:i*slidesBox.clientWidth,behavior:"smooth"});
  window.bannerCurrentIndex=i;
  window.updateBannerDots(i);
};
window.updateBannerDots = function(i){
  window.bannerCurrentIndex=i;
  document.querySelectorAll("#bannerDots .bDot").forEach((d,idx)=>d.classList.toggle("active",idx===i));
};
window.startBannerAuto = function(){
  if(window.bannerTimer)clearInterval(window.bannerTimer);
  const validCount=window.bannerImages.filter(x=>x&&x.url).length;
  if(validCount<=1)return;
  window.bannerTimer=setInterval(()=>{
    const slidesBox=document.getElementById("bannerSlides");
    if(!slidesBox)return;
    const next=(window.bannerCurrentIndex+1)%validCount;
    slidesBox.scrollTo({left:next*slidesBox.clientWidth,behavior:"smooth"});
    window.updateBannerDots(next);
  },4500);
};

/* ============================================================
   GPS + Notifications
   ============================================================ */
window.detectCity = async function(){
  const btn=event?.target;
  if(!btn)return;
  const oldText=btn.textContent;
  if(!navigator.geolocation){window.showToast("❌ المتصفح لا يدعم تحديد الموقع","error");return;}
  btn.disabled=true;btn.textContent="⏳ جاري تحديد موقعك...";
  navigator.geolocation.getCurrentPosition(async(pos)=>{
    try{
      const {latitude,longitude}=pos.coords;
      const res=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`);
      const data=await res.json();
      const cityName=data.address?.city||data.address?.town||data.address?.village||data.address?.state||"";
      const allCities=Object.values(window.LIBYA_CITIES).flat();
      let match=allCities.find(c=>cityName.includes(c)||c.includes(cityName));
      if(!match){
        let minDist=Infinity;
        allCities.forEach(c=>{
          if(typeof c==="string"){
            const dist=Math.abs(c.length-cityName.length);
            if(dist<minDist && cityName.length>2){minDist=dist;match=c;}
          }
        });
      }
      if(match){
        document.getElementById("city").value=match;
        window.showToast(`✅ تم تحديد: ${match}`,"success");
      }else{
        window.showToast("⚠️ لم نتعرف على مدينتك — اخترها يدوياً","warn");
      }
    }catch(e){window.showToast("⚠️ فشل تحديد الموقع","error");}
    finally{btn.disabled=false;btn.textContent=oldText;}
  },(err)=>{
    btn.disabled=false;btn.textContent=oldText;
    if(err.code===1)window.showToast("❌ رفضت إذن الموقع","error");
    else window.showToast("⚠️ تعذر تحديد الموقع","warn");
  },{timeout:10000});
};

window.enableNotifications = async function(){
  try{
    let tries=0;
    while(!window.OneSignal && tries<25){await new Promise(r=>setTimeout(r,200));tries++;}
    if(!window.OneSignal){window.showToast("⚠️ خدمة الإشعارات لم تُحمّل بعد.","warn");return;}
    const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone=window.matchMedia('(display-mode:standalone)').matches || window.navigator.standalone===true;
    if(isIOS && !isStandalone){
      alert("📱 على iPhone:\n\n1. افتح Safari\n2. اضغط زر المشاركة\n3. اختر: إضافة إلى الشاشة الرئيسية\n4. افتح من الأيقونة الجديدة\n5. اضغط 🔔 مرة ثانية");
      return;
    }
    await window.OneSignal.Notifications.requestPermission();
    if(window.OneSignal.Notifications.permission){window.showToast("✅ تم تفعيل الإشعارات بنجاح","success");}
    else{window.showToast("⚠️ لم يتم منح إذن الإشعارات","warn");}
  }catch(e){window.showToast("تعذر تفعيل الإشعارات: "+e.message,"error");}
};

/* ============================================================
   Auth
   ============================================================ */
onAuthStateChanged(auth,user=>{
  if(user){
    window.isAdmin=user.email===window.ADMIN_EMAIL;
    window.adminChip.classList.toggle("hidden",!window.isAdmin);
    window.navAccountLabel.textContent="حسابي";
    window.startProfileListener(user);
    window.startFollowingListener(user);
    window.giveWelcomePoints(user.uid);
    window.startPointsListener(user.uid);
    setTimeout(()=>window.syncPendingPoints(),2000);
    if(window.isAdmin && !window.reportsListenerStarted){window.reportsListenerStarted=true;window.startReportsListener();}
    if(window.moderationBtn)window.moderationBtn.classList.toggle("hidden",!window.isAdmin);
    const smb=document.getElementById("storesModerationBtn");if(smb)smb.classList.toggle("hidden",!window.isAdmin);
    const eb=document.getElementById("expiredBtn");if(eb)eb.classList.toggle("hidden",!window.isAdmin);
    const limitsBtn=document.getElementById("limitsBtn");
    if(limitsBtn)limitsBtn.classList.toggle("hidden",!window.isAdmin);
    const dashBtn=document.getElementById("dashboardBtn");
    if(dashBtn)dashBtn.classList.toggle("hidden",!window.isAdmin);
    window.updateModBadge();
    window.closeOverlay();
    if(window.isAdmin && window.pendingAutoUpgrade){
      const checkUpgrade=()=>{if(window.allPosts.length>0){window.tryApplyPendingUpgrade();}else{setTimeout(checkUpgrade,500);}};
      setTimeout(checkUpgrade,1500);
    }
    if(window.isAdmin){
      const checkAutoDelete=()=>{if(window.allPosts.length>0){window.autoDeleteOldExpired();}else{setTimeout(checkAutoDelete,1000);}};
      setTimeout(checkAutoDelete,3000);
    }
    if(window.pendingAction==="form"){window.pendingAction=null;window.showForm();}
    else if(window.pendingAction==="postType"){window.pendingAction=null;setTimeout(()=>window.startAddPost(),300);}
    else if(window.pendingAction==="mine"){window.pendingAction=null;window.showMyPosts();}
    else if(window.pendingAction==="favorites"){window.pendingAction=null;window.showFavorites();}
    else if(window.pendingAction==="following"){window.pendingAction=null;window.showFollowingPosts();}
    else if(window.pendingAction && typeof window.pendingAction==="object" && window.pendingAction.type==="report"){
      const pid=window.pendingAction.postId;
      window.pendingAction=null;
      setTimeout(()=>{window.reportPost(pid);},500);
    }
    else if(window.pendingAction && typeof window.pendingAction==="object" && window.pendingAction.type==="follow"){
      const suid=window.pendingAction.sellerUid;
      window.pendingAction=null;
      setTimeout(()=>{window.toggleFollow(suid);},500);
    }
    else if(window.pendingAction && typeof window.pendingAction==="object" && window.pendingAction.type==="storeRating"){
      const sid=window.pendingAction.storeId;
      window.pendingAction=null;
      setTimeout(()=>{window.openStoreRating(sid);},500);
    }
    else{window.renderPosts();}
    window.updateCartUI();
  }else{
    window.isAdmin=false;
    window.adminChip.classList.add("hidden");
    window.navAccountLabel.textContent="دخول";
    window.stopProfileListener();
    window.stopStoreListener();
    window.stopFollowingListener();
    if(window.showOnlyMine)window.showHome();
    window.renderPosts();
  }
});

window.logout = function(){
  Object.keys(window.userLimitsCache).forEach(k=>delete window.userLimitsCache[k]);
  try{sessionStorage.removeItem('_tempStoreData');}catch(e){}
  signOut(auth);
};

const googleProvider=new GoogleAuthProvider();
googleProvider.setCustomParameters({prompt:'select_account'});
window.loginWithGoogle = async function(){
  try{await signInWithPopup(auth,googleProvider);}
  catch(e){
    if(e.code==="auth/popup-closed-by-user"){}
    else if(e.code==="auth/popup-blocked")window.showToast("الرجاء السماح بالنوافذ المنبثقة","warn");
    else if(e.code==="auth/unauthorized-domain")window.showToast("هذا النطاق غير مصرح به","error");
    else window.showToast("تعذر تسجيل الدخول: "+e.code,"error");
  }
};

/* ============================================================
   Show Following Posts
   ============================================================ */
window.showFollowingPosts = function(){
  const me=auth.currentUser;
  if(!me){window.pendingAction="following";window.authOverlay.classList.remove("hidden");return;}
  if(window.myFollowing.length===0){window.showToast("👥 لم تتابع أي بائع بعد","info");return;}
  const ids=window.myFollowing.map(f=>f.uid);
  window.showOnlyMine=false;
  window.showOnlyFavorites=false;
  window.currentSubCategory="الكل";
  window.currentStoreFilter=null;
  const titleEl=document.getElementById("categoryTitle");
  if(titleEl)titleEl.textContent="👥 إعلانات متابَعينك";
  window.categoriesScreen.classList.add("hidden");
  window.home.classList.remove("hidden");
  window.form.classList.add("hidden");
  window.closeOverlay();
  window.setActiveNav("home");
  window.setTopbarMode("scroll");
  window.renderSubCats();
  const originalList=window.allPosts;
  const posts=window.allPosts.filter(p=>ids.includes(p.uid) && window.getStatus(p)==="approved" && !window.isExpired(p) && !p.sold);
  if(posts.length===0){window.postsBox.innerHTML="<div class='empty'>لا توجد إعلانات من متابَعيك</div>";}
  else{
    window.allPosts=window.sortPosts(posts);
    window.renderPosts();
    window.allPosts=originalList;
  }
  window.updateCartUI();
  window.scrollTo(0,0);
  window.hideFloatingButtons();
};

/* ============================================================
   In-App Notifications
   ============================================================ */
window.listenToAppNotifications = function(){
  onSnapshot(collection(db,"app_notifications"), snap => {
    if(snap.empty) return;
    const notifs = snap.docs.map(d=>({id:d.id, ...d.data()})).sort((a,b)=>b.createdAt-a.createdAt);
    const latest = notifs[0];
    const seen = JSON.parse(localStorage.getItem("seenAppNotifs") || "[]");
    if(seen.includes(latest.id)) return;
    window.showInAppBanner(latest);
  });
};

window.showInAppBanner = function(notif){
  const oldBanner = document.getElementById("inAppNotifBanner");
  if(oldBanner) oldBanner.remove();

  const banner = document.createElement("div");
  banner.id = "inAppNotifBanner";
  banner.style.cssText = "position:fixed;top:70px;right:12px;left:12px;z-index:99998;background:linear-gradient(135deg,#0284c7,#38bdf8);color:#fff;padding:14px 16px;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.25);display:flex;gap:12px;align-items:flex-start;animation:slideDown .3s ease-out;max-width:480px;margin:0 auto;font-family:'Cairo',sans-serif;";

  const linkHtml = notif.link ? '<a href="'+window.escapeHtml(notif.link)+'" target="_blank" style="display:inline-block;margin-top:8px;background:rgba(255,255,255,.25);color:#fff;padding:6px 14px;border-radius:8px;font-size:12px;font-weight:800;text-decoration:none">👉 اضغط هنا</a>' : "";

  banner.innerHTML =
    '<div style="font-size:24px;flex:0 0 auto;line-height:1">🔔</div>' +
    '<div style="flex:1;min-width:0">' +
      '<div style="font-weight:800;font-size:14.5px;margin-bottom:3px;line-height:1.4">'+window.escapeHtml(notif.title)+'</div>' +
      '<div style="font-size:12.5px;line-height:1.6;opacity:.95">'+window.escapeHtml(notif.message)+'</div>' +
      linkHtml +
    '</div>' +
    '<button onclick="dismissInAppBanner(\''+notif.id+'\')" style="background:rgba(255,255,255,.25);border:none;color:#fff;width:30px;height:30px;border-radius:50%;font-size:16px;font-weight:800;cursor:pointer;flex:0 0 auto;display:flex;align-items:center;justify-content:center;line-height:1;padding:0">×</button>';

  document.body.appendChild(banner);

  setTimeout(() => {
    if(document.getElementById("inAppNotifBanner")) window.dismissInAppBanner(notif.id);
  }, 15000);
};

window.dismissInAppBanner = function(id){
  const banner = document.getElementById("inAppNotifBanner");
  if(banner) banner.remove();
  try{
    const seen = JSON.parse(localStorage.getItem("seenAppNotifs") || "[]");
    if(!seen.includes(id)){
      seen.push(id);
      if(seen.length > 20) seen.shift();
      localStorage.setItem("seenAppNotifs", JSON.stringify(seen));
    }
  }catch(e){}
};

/* ============================================================
   START
   ============================================================ */
window.startPostsListener();
window.startStoresListener();
window.loadBanner();
window.listenToAppNotifications();

setTimeout(()=>{
  if(!window.categoriesScreen.classList.contains('hidden')){
    window.showFloatingButtons();
  } else {
    window.hideFloatingButtons();
  }
}, 800);

/* ============================================================
   Hash routing (#store-...#post-...)
   ============================================================ */
window.addEventListener('load',()=>{
  const hash=window.location.hash;
  if(hash&&hash.startsWith('#store-')){
    const sid=hash.substring(7);
    let t=0;
    const iv=setInterval(()=>{
      t++;
      if(window.allStores.find(s=>s.id===sid) || t>20){
        clearInterval(iv);
        if(window.allStores.find(s=>s.id===sid)) window.openStore(sid,false,'categories');
      }
    },500);
  }
  if(hash&&hash.startsWith('#post-')){
    const [pp,qp]=hash.split('?');
    const id=pp.substring(6);
    const params=new URLSearchParams(qp||'');
    const pd=parseInt(params.get('plan')||'0',10);
    const pr=parseInt(params.get('price')||'0',10);
    if(pd>0){window.pendingAutoUpgrade={postId:id,days:pd,price:pr};}
    let t=0;
    const iv=setInterval(()=>{
      t++;
      if(window.allPosts.find(p=>p.id===id)){clearInterval(iv);window.openPost(id);setTimeout(window.tryApplyPendingUpgrade,1500);}
      else if(t>20){clearInterval(iv);setTimeout(window.tryApplyPendingUpgrade,500);}
    },500);
  }
});

setTimeout(window.refreshNavIcons, 500);
setTimeout(window.refreshNavIcons, 1500);
setTimeout(window.refreshNavIcons, 3000);

console.log('✅ js-part-3 loaded successfully');
