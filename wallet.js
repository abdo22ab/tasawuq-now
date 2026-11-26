/**
 * 💳 نظام المحفظة الإلكترونية وكروت الشحن والسجل المالي للأدمن
 * وحدة مستقلة (wallet.js) تعمل عبر Supabase RPC + جسر الحالة من app.js
 */
import {
  supabase,
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  collection,
  onSnapshot
} from "./supabase-adapter.js?v=8";

const WALLET_THROTTLE_KEY = "tasawuq_wallet_throttle";
const DEFAULT_ADMIN_EMAIL = "abdoalk73@gmail.com";
const DEFAULT_ADMIN_PHONES = ["218928476784", "0928476784", "218928476781", "0928476781", "218928476783", "0928476783", "218928476785", "0928476785"];
const DEFAULT_ABDO_UIDS = ["zoSxkP0PGPWx37J6GMQiOjVgiMC3", "NrYY8We8VDgBiEk98bbxvkyfq2N2", "admin_client_1792952590074", "WSnolayKdiTgDvAj5psB4YRtZuG3"];
const DEFAULT_ABDO_CANONICAL_WALLET_UID = "NrYY8We8VDgBiEk98bbxvkyfq2N2";

let _userWalletBalance = 0;
let _walletUnsub = null;
let _userPayOrderUnavailable = false;
let _admWalActiveTab = "cards";
let _admAllCards = [];
let _admAllLedger = [];
let _admCardsFilter = "all";
let _admDepTargetUser = null;

let _bridge = {};

/**
 * تهيئة جسر الاتصال بين وحدة المحفظة وبقية التطبيق
 */
export function initWalletBridge(ctx = {}) {
  _bridge = { ..._bridge, ...ctx };
}

function getMyProfile() {
  return typeof _bridge.getMyProfile === "function" ? _bridge.getMyProfile() : (window.myProfile || null);
}

function getIsAdminFlag() {
  return typeof _bridge.getIsAdmin === "function" ? !!_bridge.getIsAdmin() : !!window.isAdmin;
}

function getAdminEmail() {
  return _bridge.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
}

function getAdminPhones() {
  return _bridge.ADMIN_PHONES || DEFAULT_ADMIN_PHONES;
}

function getAbdoUids() {
  return _bridge.ABDO_UIDS || DEFAULT_ABDO_UIDS;
}

function getAbdoCanonicalWalletUid() {
  return _bridge.ABDO_CANONICAL_WALLET_UID || DEFAULT_ABDO_CANONICAL_WALLET_UID;
}

function callShowToast(text, type = "info", duration = 2200) {
  if (typeof _bridge.showToast === "function") return _bridge.showToast(text, type, duration);
  if (typeof window.showToast === "function") return window.showToast(text, type, duration);
}

function callEscapeHtml(str) {
  if (typeof _bridge.escapeHtml === "function") return _bridge.escapeHtml(str);
  if (typeof window.escapeHtml === "function") return window.escapeHtml(str);
  return String(str == null ? "" : str).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
}

function callFormatCallPhone(p) {
  if (typeof _bridge.formatCallPhone === "function") return _bridge.formatCallPhone(p);
  if (typeof window.formatCallPhone === "function") return window.formatCallPhone(p);
  return String(p || "");
}

function callPlayRestaurantBell(type = "new_order") {
  if (typeof _bridge.playRestaurantBell === "function") return _bridge.playRestaurantBell(type);
  if (typeof window.playRestaurantBell === "function") return window.playRestaurantBell(type);
}

function callShowDeviceNotification(title, options = {}) {
  if (typeof _bridge.showDeviceNotification === "function") return _bridge.showDeviceNotification(title, options);
  if (typeof window.showDeviceNotification === "function") return window.showDeviceNotification(title, options);
}

function callOpenAccount(skipHistory) {
  if (typeof _bridge.openAccount === "function") return _bridge.openAccount(skipHistory);
  if (typeof window.openAccount === "function") return window.openAccount(skipHistory);
}

function getCartTotalPrice() {
  if (typeof _bridge.cartTotalPrice === "function") return _bridge.cartTotalPrice();
  if (typeof window.cartTotalPrice === "function") return window.cartTotalPrice();
  return 0;
}

function checkIsAbdoUser(uid) {
  if (typeof _bridge.isAbdoUser === "function") return _bridge.isAbdoUser(uid);
  if (typeof window.isAbdoUser === "function") return window.isAbdoUser(uid);
  return getAbdoUids().includes(uid);
}

function checkIsAbdoAccount(user, prof) {
  if (typeof _bridge.isAbdoAccount === "function") return _bridge.isAbdoAccount(user, prof);
  if (typeof window.isAbdoAccount === "function") return window.isAbdoAccount(user, prof);
  return false;
}

function getCanonWalletUid(uid, user, prof) {
  if (typeof _bridge.getCanonicalWalletUid === "function") return _bridge.getCanonicalWalletUid(uid, user, prof);
  if (typeof window.getCanonicalWalletUid === "function") return window.getCanonicalWalletUid(uid, user, prof);
  return uid;
}

function getCandUids(uid) {
  if (typeof _bridge.getCandidateUids === "function") return _bridge.getCandidateUids(uid);
  if (typeof window.getCandidateUids === "function") return window.getCandidateUids(uid);
  return uid ? [uid] : [];
}

function hasAdminPrivilege() {
  const prof = getMyProfile();
  const me = auth.currentUser;
  return (
    getIsAdminFlag() ||
    (typeof _bridge.isUserAdmin === "function" && _bridge.isUserAdmin(me, prof)) ||
    (typeof window.isUserAdmin === "function" && window.isUserAdmin(me, prof)) ||
    checkIsAbdoAccount(me, prof) ||
    Boolean(
      me && (
        me.email === getAdminEmail() ||
        (me.email && me.email.toLowerCase() === "abdoalk73@gmail.com") ||
        (me.email && me.email.includes("928476784")) ||
        getAdminPhones().includes((prof && prof.phone) || "")
      )
    )
  );
}

function getSupabaseClient() {
  return window.supabase || supabase || null;
}

function getActiveAdminRpcUid() {
  const me = auth.currentUser;
  if (me && (getAbdoUids().includes(me.uid) || (me.email && me.email.toLowerCase() === "abdoalk73@gmail.com"))) {
    return me.uid;
  }
  return "zoSxkP0PGPWx37J6GMQiOjVgiMC3";
}

// 1. استرجاع وتوحيد محفظة المستخدم ومعرفها الحقيقي المرجعي
export async function resolveUserWalletState(uid, meta = {}) {
  const fallback = { balance: 0.00, updatedAt: Date.now(), targetUid: uid || "", candUids: uid ? [uid] : [] };
  if (!uid) return fallback;

  const sb = getSupabaseClient();
  const candSet = new Set(getCandUids(uid));
  const abdoUids = getAbdoUids();
  const abdoCanon = getAbdoCanonicalWalletUid();

  const cachedProf = (window.sellersProfileCache && window.sellersProfileCache[uid]) || null;
  const currentProf = getMyProfile();
  const selfProf = (auth.currentUser && auth.currentUser.uid === uid) ? currentProf : null;
  const effectiveProf = selfProf || cachedProf || (meta.userPhone ? { phone: meta.userPhone, name: meta.userName } : null);

  const isTargetAbdo =
    checkIsAbdoUser(uid) ||
    Array.from(candSet).some(u => abdoUids.includes(u)) ||
    (auth.currentUser && auth.currentUser.uid === uid && checkIsAbdoAccount(auth.currentUser, effectiveProf)) ||
    String((effectiveProf && (effectiveProf.phone || effectiveProf.userPhone)) || meta.userPhone || "").replace(/[^0-9]/g, "").endsWith("928476784") ||
    (effectiveProf && String(effectiveProf.email || "").toLowerCase().trim() === "abdoalk73@gmail.com");

  let primaryUid = isTargetAbdo ? abdoCanon : null;

  if (isTargetAbdo) {
    abdoUids.forEach(au => candSet.add(au));
  } else if (sb) {
    // توسيع قائمة المعرفات المربوطة من جداول phones و profiles
    try {
      let cleanPh = String((effectiveProf && (effectiveProf.phone || effectiveProf.local_phone || effectiveProf.localPhone)) || meta.userPhone || "").replace(/[^0-9]/g, "");
      if (!cleanPh && auth.currentUser && auth.currentUser.uid === uid && auth.currentUser.email) {
        const m = auth.currentUser.email.match(/(?:wa_)?(\d{9,14})/);
        if (m) cleanPh = m[1];
      }
      if (cleanPh && cleanPh.startsWith("0")) cleanPh = "218" + cleanPh.slice(1);

      let realEmail = (effectiveProf && effectiveProf.email && !String(effectiveProf.email).toLowerCase().startsWith("wa_")) ? String(effectiveProf.email).toLowerCase().trim() : "";
      if (!realEmail && auth.currentUser && auth.currentUser.uid === uid && auth.currentUser.email && !auth.currentUser.email.toLowerCase().startsWith("wa_")) {
        realEmail = auth.currentUser.email.toLowerCase().trim();
      }

      if (!cleanPh || !realEmail) {
        const { data: uProfs } = await sb.from("profiles").select("id,phone,email,member_no,name").eq("id", uid).limit(1);
        if (Array.isArray(uProfs) && uProfs[0]) {
          if (!cleanPh && uProfs[0].phone) cleanPh = String(uProfs[0].phone).replace(/[^0-9]/g, "");
          if (!realEmail && uProfs[0].email && !String(uProfs[0].email).toLowerCase().startsWith("wa_")) {
            realEmail = String(uProfs[0].email).toLowerCase().trim();
          }
        }
      }

      if (cleanPh && cleanPh.startsWith("0")) cleanPh = "218" + cleanPh.slice(1);

      if (cleanPh) {
        const { data: pRows } = await sb.from("phones").select("uid,email").eq("phone", cleanPh).limit(5);
        if (Array.isArray(pRows)) {
          pRows.forEach(r => {
            if (r && r.uid) {
              candSet.add(r.uid);
              if (!primaryUid) primaryUid = r.uid;
            }
            if (!realEmail && r && r.email && !String(r.email).toLowerCase().startsWith("wa_")) {
              realEmail = String(r.email).toLowerCase().trim();
            }
          });
        }
      }

      const orFilters = [];
      if (cleanPh) orFilters.push(`phone.eq.${cleanPh}`);
      if (realEmail) orFilters.push(`email.eq.${realEmail}`);
      if (orFilters.length > 0) {
        const { data: relProfs } = await sb.from("profiles").select("id,email,member_no,name").or(orFilters.join(",")).limit(15);
        if (Array.isArray(relProfs) && relProfs.length > 0) {
          relProfs.forEach(r => { if (r && r.id) candSet.add(r.id); });
          const googleMaster = relProfs.find(r => r.email && !String(r.email).toLowerCase().startsWith("wa_") && r.name && r.name !== "مستخدم");
          if (!primaryUid && googleMaster && googleMaster.id) primaryUid = googleMaster.id;
        }
      }
    } catch (e) {}
  }

  const candUids = Array.from(candSet);
  const canonicalFallbackUid = primaryUid || getCanonWalletUid(uid, auth.currentUser?.uid === uid ? auth.currentUser : null, effectiveProf) || uid;
  const foundRows = [];

  try {
    if (sb && candUids.length > 0) {
      const walletIds = candUids.map(u => "wallet_" + u);
      const { data: rows } = await sb.from("feedback").select("id, uid, message, updated_at, created_at").in("id", walletIds).limit(20);
      if (Array.isArray(rows)) {
        for (const r of rows) {
          if (!r || !r.message) continue;
          try {
            const p = JSON.parse(r.message);
            if (p && typeof p.balance === "number" && !isNaN(p.balance)) {
              const rowUid = String(r.id || "").replace(/^wallet_/, "") || r.uid || uid;
              const ts = Number(p.updatedAt || r.updated_at || r.created_at || 0);
              foundRows.push({
                uid: rowUid,
                balance: Math.max(0, Math.round(p.balance * 100) / 100),
                updatedAt: ts
              });
            }
          } catch (e) {}
        }
      }
    }
  } catch (e) {
    console.warn("resolveUserWalletState error:", e);
  }

  if (isTargetAbdo) {
    const canonRow = foundRows.find(r => r.uid === abdoCanon);
    if (canonRow) {
      return { balance: canonRow.balance, updatedAt: canonRow.updatedAt, targetUid: abdoCanon, candUids };
    }
    const positiveRows = foundRows.filter(r => r.balance > 0).sort((a, b) => b.updatedAt - a.updatedAt);
    if (positiveRows.length > 0) {
      return { balance: positiveRows[0].balance, updatedAt: positiveRows[0].updatedAt, targetUid: abdoCanon, candUids };
    }
    return { balance: 0.00, updatedAt: Date.now(), targetUid: abdoCanon, candUids };
  }

  // لباقي المستخدمين: إعطاء الأولوية للمحفظة الموجبة حتى لا يطغى صف 0.00 قديم على الرصيد الفعلي
  const positiveRows = foundRows.filter(r => r.balance > 0);
  if (positiveRows.length > 0) {
    const masterPos = primaryUid ? positiveRows.find(r => r.uid === primaryUid) : null;
    positiveRows.sort((a, b) => b.updatedAt - a.updatedAt);
    const chosen = (positiveRows.length === 1) ? positiveRows[0] : (positiveRows[0] || masterPos);
    return { balance: chosen.balance, updatedAt: chosen.updatedAt, targetUid: chosen.uid, candUids };
  }

  if (foundRows.length > 0) {
    const masterZero = primaryUid ? foundRows.find(r => r.uid === primaryUid) : null;
    foundRows.sort((a, b) => b.updatedAt - a.updatedAt);
    const chosen = masterZero || foundRows[0];
    return { balance: chosen.balance, updatedAt: chosen.updatedAt, targetUid: primaryUid || chosen.uid, candUids };
  }

  return { balance: 0.00, updatedAt: Date.now(), targetUid: canonicalFallbackUid, candUids };
}

export async function getUserWallet(uid) {
  return await resolveUserWalletState(uid);
}

// 2. تسجيل حركة في السجل المالي العام (Audit Ledger)
export async function recordWalletTx(uid, txType, amount, balanceBefore, balanceAfter, reason, meta = {}) {
  try {
    const prof = getMyProfile();
    const txId = "TX" + Date.now().toString(36).toUpperCase() + Math.floor(100 + Math.random() * 900);
    const uName = meta.userName || (prof && prof.name) || auth.currentUser?.displayName || "مستخدم";
    const uPhone = meta.userPhone || (prof && prof.phone) || "";
    const txDocId = "tx_" + Date.now() + "_" + Math.floor(Math.random() * 10000);

    const txData = {
      txId,
      uid,
      userName: uName,
      userPhone: uPhone,
      txType,
      amount: Math.round(Number(amount) * 100) / 100,
      balanceBefore: Math.round(Number(balanceBefore) * 100) / 100,
      balanceAfter: Math.round(Number(balanceAfter) * 100) / 100,
      reason: String(reason || ""),
      meta: meta || {},
      timestamp: Date.now()
    };

    await addDoc(collection(db, "feedback"), {
      id: txDocId,
      type: "wallet_transaction",
      uid,
      userName: uName,
      userPhone: uPhone,
      message: JSON.stringify(txData),
      createdAt: Date.now()
    });

    return txId;
  } catch (e) {
    console.error("recordWalletTx error:", e);
    return null;
  }
}

// 3. إضافة رصيد للمحفظة (Credit) - محمي عبر RPC
export async function creditUserWallet(uid, amount, reason, meta = {}) {
  if (!auth.currentUser) return { ok: false, error: "يجب تسجيل الدخول أولاً" };
  amount = Math.max(0, Number(amount) || 0);
  if (amount <= 0 || isNaN(amount)) return { ok: false, error: "المبلغ غير صحيح" };

  const prof = getMyProfile();
  const isEffectiveAdmin = hasAdminPrivilege();

  const allowedTxTypes = ["card_recharge", "order_refund", "admin_credit"];
  if (!allowedTxTypes.includes(meta.txType)) {
    return { ok: false, error: "نوع العملية غير مصرح به" };
  }
  if (meta.txType === "admin_credit" && !isEffectiveAdmin) {
    return { ok: false, error: "هذا الإجراء مخصص للأدمن فقط" };
  }
  if (meta.txType === "card_recharge" && !meta.cardCode) {
    return { ok: false, error: "رمز الكارت مطلوب لإتمام الشحن" };
  }

  const wState = await resolveUserWalletState(uid, meta);
  uid = wState.targetUid || getCanonWalletUid(uid, auth.currentUser?.uid === uid ? auth.currentUser : null, { phone: meta.userPhone, name: meta.userName });
  const targetCandUids = (wState.candUids && wState.candUids.length) ? wState.candUids : [uid];

  const sb = getSupabaseClient();
  if (sb && typeof sb.rpc === "function") {
    try {
      const { data: rpcRes, error: rpcErr } = await sb.rpc("admin_deposit_wallet", {
        p_admin_uid: getActiveAdminRpcUid(),
        p_target_uid: uid,
        p_amount: amount,
        p_type: "credit",
        p_note: reason || meta.adminNote || (meta.txType === "order_refund" ? (`استرجاع قيمة طلبية #${meta.orderNo || ""} (${meta.storeName || "المطعم"})`) : "إيداع يدوي من الإدارة"),
        p_user_name: meta.userName || (prof && prof.name) || auth.currentUser?.displayName || "مستخدم",
        p_user_phone: meta.userPhone || (prof && prof.phone) || ""
      });
      if (rpcErr) return { ok: false, error: rpcErr.message || "تعذر تحديث المحفظة في الخادم" };
      if (rpcRes && rpcRes.ok) {
        const finalBal = Number(rpcRes.balance);
        const myCandUids = getCandUids(auth.currentUser?.uid);
        if (auth.currentUser && targetCandUids.some(u => myCandUids.includes(u))) {
          updateWalletUI(finalBal);
        }
        return { ok: true, balance: finalBal, oldBalance: rpcRes.oldBalance, txId: rpcRes.txId };
      }
      return { ok: false, error: (rpcRes && rpcRes.error) || "فشل تحديث المحفظة" };
    } catch (rpcE) {
      console.error("creditUserWallet RPC error:", rpcE);
      return { ok: false, error: rpcE.message || "خطأ في الاتصال بالمحفظة" };
    }
  }
  return { ok: false, error: "خدمة المحفظة غير متصلة حالياً" };
}

function isRpcMissingError(err) {
  if (!err) return false;
  const code = String(err.code || "").toUpperCase();
  const msg = String(err.message || "").toLowerCase();
  return code === "PGRST202" || err.status === 404 || msg.includes("could not find the function") || msg.includes("schema cache");
}

// 4. خصم رصيد من المحفظة (Debit) - ذري ومحمي ضد إنشاء أرصدة صفرية
export async function debitUserWallet(uid, amount, reason, meta = {}) {
  if (!auth.currentUser) return { ok: false, error: "يجب تسجيل الدخول أولاً" };
  amount = Math.max(0, Number(amount) || 0);
  if (amount <= 0 || isNaN(amount)) return { ok: false, error: "المبلغ غير صحيح" };

  const prof = getMyProfile();
  const isEffectiveAdmin = hasAdminPrivilege();

  const wState = await resolveUserWalletState(uid, meta);
  uid = wState.targetUid || getCanonWalletUid(uid, auth.currentUser?.uid === uid ? auth.currentUser : null, { phone: meta.userPhone, name: meta.userName });
  const targetCandUids = (wState.candUids && wState.candUids.length) ? wState.candUids : [uid];

  const myCandUids = getCandUids(auth.currentUser?.uid);
  const isSelf = targetCandUids.some(u => myCandUids.includes(u));

  if (!isSelf && !isEffectiveAdmin) {
    return { ok: false, error: "لا يمكنك الخصم من محفظة غير محفظتك" };
  }

  const oldBalCheck = Number(wState.balance || 0);
  if (oldBalCheck < amount && (!isEffectiveAdmin || meta.txType === "order_payment")) {
    return { ok: false, error: `الرصيد غير كافٍ (${oldBalCheck.toFixed(2)} د.ل لا تكفي لخصم ${amount.toFixed(2)} د.ل)`, balance: oldBalCheck };
  }

  const sb = getSupabaseClient();
  if (!sb || typeof sb.rpc !== "function") {
    return { ok: false, error: "خدمة الدفع الإلكتروني غير متصلة حالياً" };
  }

  try {
    if (meta.txType === "order_payment" && !_userPayOrderUnavailable) {
      const { data: payRes, error: payErr } = await sb.rpc("user_pay_order", {
        p_customer_uid: uid,
        p_amount: amount,
        p_order_no: String(meta.orderNo || ""),
        p_store_name: String(meta.storeName || "المطعم")
      });

      if (!payErr && payRes) {
        if (payRes.ok) {
          const finalBal = Number(payRes.balance);
          if (auth.currentUser && isSelf) updateWalletUI(finalBal);
          return { ok: true, balance: finalBal, oldBalance: payRes.oldBalance, txId: payRes.txId };
        }
        return { ok: false, error: payRes.error || "الرصيد غير كافٍ لإتمام الطلب", balance: payRes.balance };
      }

      if (payErr && !isRpcMissingError(payErr)) {
        return { ok: false, error: payErr.message || "تعذر إتمام السداد من المحفظة" };
      }
      if (payErr && isRpcMissingError(payErr)) {
        _userPayOrderUnavailable = true;
      }
    }

    if (meta.txType !== "order_payment" && !isEffectiveAdmin) {
      return { ok: false, error: "نوع عملية الخصم غير مصرح به" };
    }

    // استدعاء admin_deposit_wallet بعد التحقق القطعي من وجود الرصيد في نفس targetUid
    const debitNote = reason || meta.adminNote || (meta.txType === "order_payment" ? `دفع قيمة طلبية مطعم (${meta.storeName || "المطعم"})` : "خصم يدوي من الإدارة");
    const { data: rpcRes, error: rpcErr } = await sb.rpc("admin_deposit_wallet", {
      p_admin_uid: getActiveAdminRpcUid(),
      p_target_uid: uid,
      p_amount: amount,
      p_type: "debit",
      p_note: debitNote,
      p_user_name: meta.userName || (prof && prof.name) || auth.currentUser?.displayName || "مستخدم",
      p_user_phone: meta.userPhone || (prof && prof.phone) || ""
    });

    if (rpcErr) {
      return { ok: false, error: rpcErr.message || "تعذر تنفيذ الخصم في قاعدة البيانات" };
    }
    if (rpcRes && rpcRes.ok) {
      if (Number(rpcRes.oldBalance || 0) < amount && meta.txType === "order_payment") {
        return { ok: false, error: "الرصيد الفعلي في المحفظة لا يكفي لإتمام الطلب", balance: rpcRes.oldBalance };
      }
      const finalBal = Number(rpcRes.balance);
      if (auth.currentUser && isSelf) updateWalletUI(finalBal);
      return { ok: true, balance: finalBal, oldBalance: rpcRes.oldBalance, txId: rpcRes.txId };
    }
    return { ok: false, error: (rpcRes && rpcRes.error) || "فشلت عملية الخصم" };
  } catch (rpcE) {
    console.error("debitUserWallet RPC error:", rpcE);
    return { ok: false, error: rpcE.message || "خطأ في الاتصال بخادم المحفظة" };
  }
}

// 5. استرجاع قيمة طلبية ملغاة (Refund)
export async function refundOrderToWallet(uid, amount, orderNo, storeName, orderData = null) {
  if (orderData) {
    if (orderData.status === "completed" || orderData.completedAt || orderData.status === "ready") {
      return { ok: false, error: "لا يمكن استرجاع رصيد طلبية مكتملة أو تم تسليمها للزبون بالفعل" };
    }
    if (orderData.isRefunded) {
      return { ok: false, error: "تم استرجاع رصيد هذه الطلبية بالفعل مسبقاً" };
    }
  }

  return creditUserWallet(
    uid,
    amount,
    `استرجاع قيمة طلبية ملغاة رقم #${orderNo || "—"} (${storeName || "المطعم"})`,
    { txType: "order_refund", orderNo, storeName }
  );
}

// 6. حماية الشحن من المحاولات العشوائية (Brute-Force Throttle)
function checkWalletThrottle() {
  try {
    const raw = localStorage.getItem(WALLET_THROTTLE_KEY);
    if (!raw) return { allowed: true, attempts: 0, waitMinutes: 0 };
    const data = JSON.parse(raw);
    const now = Date.now();
    if (data.lockedUntil && now < data.lockedUntil) {
      const waitMinutes = Math.ceil((data.lockedUntil - now) / 60000);
      return { allowed: false, attempts: data.attempts || 0, waitMinutes };
    }
    if (data.lockedUntil && now >= data.lockedUntil) {
      localStorage.removeItem(WALLET_THROTTLE_KEY);
      return { allowed: true, attempts: 0, waitMinutes: 0 };
    }
    return { allowed: true, attempts: data.attempts || 0, waitMinutes: 0 };
  } catch (e) {
    return { allowed: true, attempts: 0, waitMinutes: 0 };
  }
}

function registerWalletFail() {
  try {
    const current = checkWalletThrottle();
    const attempts = (current.attempts || 0) + 1;
    let lockedUntil = null;
    if (attempts >= 3) {
      lockedUntil = Date.now() + 30 * 60 * 1000;
    }
    localStorage.setItem(WALLET_THROTTLE_KEY, JSON.stringify({ attempts, lockedUntil, lastAttempt: Date.now() }));
    return { attempts, lockedUntil };
  } catch (e) {
    return { attempts: 1, lockedUntil: null };
  }
}

function resetWalletThrottle() {
  try { localStorage.removeItem(WALLET_THROTTLE_KEY); } catch (e) {}
}

// 7. تحديث واجهات المحفظة محلياً
export function updateWalletUI(balance) {
  _userWalletBalance = Math.max(0, Number(balance) || 0);
  const balText = _userWalletBalance.toFixed(2);

  const headerBadge = document.getElementById("walletHeaderBadge");
  if (headerBadge) headerBadge.textContent = balText + " د.ل";

  const cardBal = document.getElementById("userWalletBalanceText");
  if (cardBal) cardBal.textContent = balText;

  const histBal = document.getElementById("myHistoryCurrentBalance");
  if (histBal) histBal.textContent = balText;

  const cartBal = document.getElementById("cartWalletCurrentBalanceBadge");
  if (cartBal) cartBal.textContent = "رصيدك: " + balText + " د.ل";
}

// 8. الاستماع المباشر الفوري للرصيد عبر Supabase + التصفية عند الخروج
export function clearWalletSession() {
  if (_walletUnsub) {
    try { _walletUnsub(); } catch (e) {}
    _walletUnsub = null;
  }
  updateWalletUI(0);
}

export function setupUserWalletListener(uid) {
  if (_walletUnsub) {
    try { _walletUnsub(); } catch (e) {}
    _walletUnsub = null;
  }
  if (!uid) return;

  const refreshBalance = async () => {
    try {
      const w = await getUserWallet(uid);
      const bal = (w && typeof w.balance === "number") ? w.balance : 0;
      updateWalletUI(bal);
    } catch (e) {
      console.warn("refreshBalance error:", e);
    }
  };

  refreshBalance();

  const prof = getMyProfile();
  const targetUid = getCanonWalletUid(uid, auth.currentUser?.uid === uid ? auth.currentUser : null, auth.currentUser?.uid === uid ? prof : null);
  try {
    _walletUnsub = onSnapshot(doc(db, "feedback", "wallet_" + targetUid), () => {
      refreshBalance();
    });
  } catch (e) {
    console.warn("setupUserWalletListener error:", e);
  }
}

// 9. فتح نافذة المحفظة
window.openWalletModal = () => {
  if (!auth.currentUser) {
    callShowToast("⚠️ يرجى تسجيل الدخول للوصول إلى المحفظة", "warn");
    callOpenAccount();
    return;
  }
  callOpenAccount();
  const c = document.getElementById("accountWalletCard");
  if (c) c.scrollIntoView({ behavior: "smooth" });
};

// 10. فتح وإغلاق نافذة شحن الرصيد
window.openRechargeModal = () => {
  if (!auth.currentUser) {
    callShowToast("⚠️ يرجى تسجيل الدخول أولاً لشحن المحفظة", "warn");
    callOpenAccount();
    return;
  }
  const ov = document.getElementById("rechargeWalletOverlay");
  if (ov) {
    ov.classList.remove("hidden");
    window.switchRechargeTab("card");
    const st = document.getElementById("rechargeStatusBox");
    if (st) st.style.display = "none";
    const inp = document.getElementById("walletCardCodeInput");
    if (inp) { inp.value = ""; setTimeout(() => inp.focus(), 200); }
  }
};

window.closeRechargeModal = () => {
  const ov = document.getElementById("rechargeWalletOverlay");
  if (ov) ov.classList.add("hidden");
};

window.switchRechargeTab = (tab) => {
  const btnCard = document.getElementById("tabBtnRechargeCard");
  const btnTr = document.getElementById("tabBtnRechargeTransfer");
  const secCard = document.getElementById("rechargeTabCardBox");
  const secTr = document.getElementById("rechargeTabTransferBox");

  if (tab === "transfer") {
    if (btnTr) btnTr.classList.add("active");
    if (btnCard) btnCard.classList.remove("active");
    if (secTr) secTr.style.display = "block";
    if (secCard) secCard.style.display = "none";
  } else {
    if (btnCard) btnCard.classList.add("active");
    if (btnTr) btnTr.classList.remove("active");
    if (secCard) secCard.style.display = "block";
    if (secTr) secTr.style.display = "none";
  }
};

window.copyTransferNumber = (num) => {
  try {
    navigator.clipboard.writeText(num);
    callShowToast(`📋 تم نسخ الرقم (${num}) بنجاح`, "success");
  } catch (e) {
    prompt("انسخ رقم التحويل:", num);
  }
};

// 11. شحن الرصيد بكارت رقمي (Redeem Card)
window.submitCardRecharge = async () => {
  if (!auth.currentUser) {
    callShowToast("⚠️ يجب تسجيل الدخول لشحن الرصيد", "warn");
    return;
  }

  const throttle = checkWalletThrottle();
  if (!throttle.allowed) {
    callShowToast(`⚠️ تم قفل محاولات الشحن مؤقتاً لحماية الحساب. يرجى الانتظار ${throttle.waitMinutes} دقيقة قبل المحاولة مجدداً`, "error", 6000);
    return;
  }

  const inputEl = document.getElementById("walletCardCodeInput");
  const statusBox = document.getElementById("rechargeStatusBox");
  const btn = document.getElementById("btnSubmitCardRecharge");
  const rawCode = (inputEl ? inputEl.value : "").trim();

  let cleanCode = rawCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleanCode.startsWith("TK")) cleanCode = cleanCode.substring(2);
  if (cleanCode.length === 12) {
    cleanCode = `TK-${cleanCode.substring(0, 4)}-${cleanCode.substring(4, 8)}-${cleanCode.substring(8, 12)}`;
  } else {
    cleanCode = rawCode.toUpperCase();
  }

  if (!cleanCode || cleanCode.length < 8) {
    if (statusBox) {
      statusBox.style.display = "block";
      statusBox.style.background = "#fef2f2";
      statusBox.style.color = "#991b1b";
      statusBox.style.border = "1px solid #fecaca";
      statusBox.textContent = "⚠️ يرجى إدخال رمز كارت صحيح مكون من 12 رقم";
    }
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = "⏳ جاري التحقق وشحن الكارت..."; }
  if (statusBox) statusBox.style.display = "none";

  try {
    const sb = getSupabaseClient();
    if (sb && typeof sb.rpc === "function") {
      try {
        const wState = await resolveUserWalletState(auth.currentUser.uid);
        const myWalletUid = wState.targetUid || getCanonWalletUid(auth.currentUser.uid, auth.currentUser, getMyProfile());
        const { data: rpcRes, error: rpcErr } = await sb.rpc("redeem_wallet_card", {
          p_code: cleanCode,
          p_uid: myWalletUid
        });
        if (!rpcErr && rpcRes) {
          if (rpcRes.ok) {
            resetWalletThrottle();
            const cardAmount = Number(rpcRes.amount || 0);
            const newBal = Number(rpcRes.balance || 0);
            updateWalletUI(newBal);

            if (inputEl) inputEl.value = "";
            if (statusBox) {
              statusBox.style.display = "block";
              statusBox.style.background = "#f0fdf4";
              statusBox.style.color = "#166534";
              statusBox.style.border = "1.5px solid #22c55e";
              statusBox.innerHTML = `🎉 <b>ألف مبروك!</b> تم شحن محفظتك بنجاح بمبلغ <b>${cardAmount} د.ل</b>.<br>رصيدك الجديد: <b>${newBal.toFixed(2)} د.ل</b>`;
            }
            callShowToast(`🎉 تم شحن ${cardAmount} د.ل في محفظتك بنجاح!`, "success", 4000);
            callPlayRestaurantBell("ready");
            callShowDeviceNotification("💳 شحن المحفظة بنجاح", {
              body: `تم شحن ${cardAmount} د.ل في محفظتك بنجاح! رصيدك الجديد: ${newBal.toFixed(2)} د.ل`,
              icon: "/icon-192.png"
            });
            return;
          } else {
            registerWalletFail();
            if (statusBox) {
              statusBox.style.display = "block";
              statusBox.style.background = "#fef2f2";
              statusBox.style.color = "#991b1b";
              statusBox.style.border = "1px solid #fecaca";
              statusBox.textContent = rpcRes.error || "❌ رمز الكارت غير صحيح";
            }
            return;
          }
        }
      } catch (rpcE) {
        console.warn("RPC redeem_wallet_card notice:", rpcE);
      }
    }

    if (statusBox) {
      statusBox.style.display = "block";
      statusBox.style.background = "#fef2f2";
      statusBox.style.color = "#991b1b";
      statusBox.style.border = "1px solid #fecaca";
      statusBox.textContent = "❌ تعذر التحقق من الكارت عبر الخادم، حاول مجدداً";
    }
  } catch (e) {
    console.error("submitCardRecharge error:", e);
    if (statusBox) {
      statusBox.style.display = "block";
      statusBox.style.background = "#fef2f2";
      statusBox.style.color = "#991b1b";
      statusBox.textContent = "حدث خطأ: " + e.message;
    }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "⚡ شحن الرصيد الآن"; }
  }
};

// 12. كشف حساب المستخدم وسجل عملياته الشخصية
window.openMyWalletHistory = async () => {
  if (!auth.currentUser) {
    callShowToast("⚠️ يرجى تسجيل الدخول أولاً", "warn");
    return;
  }

  const ov = document.getElementById("myWalletHistoryOverlay");
  const listEl = document.getElementById("myWalletTxList");
  if (ov) ov.classList.remove("hidden");
  if (listEl) listEl.innerHTML = `<div class="reportsEmpty">⏳ جاري جلب سجل المعاملات...</div>`;

  const cur = await getUserWallet(auth.currentUser.uid);
  updateWalletUI(cur.balance);

  try {
    let txs = [];
    const sb = getSupabaseClient();
    if (sb) {
      const wStateHist = await resolveUserWalletState(auth.currentUser.uid);
      const myCandUids = (wStateHist.candUids && wStateHist.candUids.length)
        ? wStateHist.candUids
        : getCandUids(auth.currentUser.uid);
      const { data, error } = await sb
        .from("feedback")
        .select("*")
        .eq("type", "wallet_transaction")
        .in("uid", myCandUids)
        .order("created_at", { ascending: false })
        .limit(60);
      if (!error && data) txs = data;
    }

    if (txs.length === 0) {
      if (listEl) {
        listEl.innerHTML = `
          <div class="cartEmptyBox" style="padding:20px 0">
            <div class="icon">💳</div>
            <div style="font-weight:700;font-size:14px">لا توجد حركات مالية بعد</div>
            <div style="font-size:12px;margin-top:4px">اشحن محفظتك أو اطلب من المطاعم وستظهر جميع عملياتك هنا</div>
          </div>
        `;
      }
      return;
    }

    if (listEl) {
      listEl.innerHTML = txs.map(row => {
        let parsed = {};
        try { parsed = JSON.parse(row.message || "{}"); } catch (e) {}
        const isIncome = (parsed.amount || 0) >= 0;
        const icon = isIncome ? "➕" : "🛒";
        const sign = isIncome ? "+" : "";
        const cls = isIncome ? "in" : "out";
        const txDate = row.created_at ? new Date(row.created_at).toLocaleString("ar-LY", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

        return `
          <div class="walletTxCard">
            <div class="txLeft">
              <div class="txIcon ${cls}">${icon}</div>
              <div class="txDetails">
                <div class="txTitle">${callEscapeHtml(parsed.reason || "حركة مالية")}</div>
                <div class="txTime">🕒 ${txDate} — رقم: #${callEscapeHtml(parsed.txId || row.id)}</div>
              </div>
            </div>
            <div class="txRight">
              <div class="txAmount ${cls}">${sign}${parsed.amount} د.ل</div>
              <div class="txBalanceAfter">الرصيد: ${parsed.balanceAfter != null ? parsed.balanceAfter + " د.ل" : ""}</div>
            </div>
          </div>
        `;
      }).join("");
    }
  } catch (e) {
    console.error("openMyWalletHistory error:", e);
    if (listEl) listEl.innerHTML = `<div class="reportsEmpty">خطأ في جلب البيانات: ${e.message}</div>`;
  }
};

window.closeMyWalletHistory = () => {
  const ov = document.getElementById("myWalletHistoryOverlay");
  if (ov) ov.classList.add("hidden");
};

// 13. لوحة الإدارة المالية للأدمن
window.openAdminWallet = () => {
  if (!hasAdminPrivilege()) {
    callShowToast("❌ غير مصرح لك", "error");
    return;
  }
  const ov = document.getElementById("adminWalletOverlay");
  if (ov) {
    ov.classList.remove("hidden");
    window.switchAdmWalTab("cards");
  }
};

window.closeAdminWallet = () => {
  const ov = document.getElementById("adminWalletOverlay");
  if (ov) ov.classList.add("hidden");
};

window.switchAdmWalTab = (tab) => {
  _admWalActiveTab = tab;
  ["Cards", "Ledger", "Deposit", "Stores"].forEach(t => {
    const btn = document.getElementById("btnAdmWalTab" + t);
    const sec = document.getElementById("admWalSec" + t);
    const active = (t.toLowerCase() === tab.toLowerCase());
    if (btn) btn.classList.toggle("active", active);
    if (sec) sec.style.display = active ? "block" : "none";
  });

  if (tab === "cards") loadAdminCardsList();
  else if (tab === "ledger") loadAdminLedger();
  else if (tab === "stores") loadAdminStoresPayouts();
};

window.toggleAdmCustomDenom = () => {
  const sel = document.getElementById("admCardDenom");
  const cust = document.getElementById("admCardCustomDenom");
  if (sel && cust) {
    cust.style.display = (sel.value === "custom") ? "block" : "none";
    if (sel.value === "custom") cust.focus();
  }
};

window.adminGenerateCardsBatch = async () => {
  if (!hasAdminPrivilege()) {
    callShowToast("❌ غير مصرح لك", "error");
    return;
  }

  const selDenom = document.getElementById("admCardDenom")?.value || "20";
  let denom = 20;
  if (selDenom === "custom") {
    denom = parseInt(document.getElementById("admCardCustomDenom")?.value || "0", 10);
    if (isNaN(denom) || denom < 1 || denom > 5000) {
      callShowToast("⚠️ يرجى إدخال قيمة فئة مخصصة صحيحة (من 1 إلى 5000 د.ل)", "warn");
      return;
    }
  } else {
    denom = parseInt(selDenom, 10);
  }

  const countInput = document.getElementById("admCardCount");
  const count = parseInt(countInput?.value || "10", 10);
  if (isNaN(count) || count < 1 || count > 500) {
    callShowToast("⚠️ يرجى إدخال عدد كروت صحيح بين 1 و 500 كارت في الدفعة الواحدة", "warn");
    return;
  }

  const btn = document.getElementById("btnAdmGenCards");
  const outBox = document.getElementById("admGeneratedCardsOutput");
  const outText = document.getElementById("admGeneratedCardsText");

  if (!confirm(`هل تريد توليد وحفظ ${count} كارت من فئة ${denom} د.ل في المنظومة؟`)) return;
  if (btn) { btn.disabled = true; btn.textContent = "⏳ جاري توليد وحفظ الكروت..."; }

  try {
    const batchId = "batch_" + Date.now();
    let generated = [];
    const sb = getSupabaseClient();

    if (sb && typeof sb.rpc === "function") {
      try {
        const { data: rpcRes, error: rpcErr } = await sb.rpc("admin_generate_cards", {
          p_admin_uid: getActiveAdminRpcUid(),
          p_count: count,
          p_denom: denom,
          p_batch_id: batchId
        });
        if (!rpcErr && rpcRes && rpcRes.ok && Array.isArray(rpcRes.codes)) {
          generated = rpcRes.codes;
        }
      } catch (rpcE) {
        console.warn("RPC admin_generate_cards fallback:", rpcE);
      }
    }

    if (generated.length === 0) {
      callShowToast("❌ تعذر توليد الكروت عبر الخادم", "error");
      return;
    }

    if (outBox) outBox.style.display = "block";
    if (outText) {
      outText.value = `🌟 كروت شحن تسوق الآن (فئة ${denom} د.ل - إجمالي ${count} كارت):\n` + generated.map((c, idx) => `${idx + 1}. ${c} (${denom} د.ل)`).join("\n");
    }

    callShowToast(`✅ تم بنجاح توليد وحفظ ${count} كارت في قاعدة البيانات!`, "success", 4000);
    loadAdminCardsList();
  } catch (e) {
    callShowToast("خطأ: " + e.message, "error");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "⚡ توليد وحفظ الكروت في قاعدة البيانات"; }
  }
};

window.copyAllGeneratedCards = () => {
  const t = document.getElementById("admGeneratedCardsText");
  if (!t || !t.value) return;
  try {
    navigator.clipboard.writeText(t.value);
    callShowToast("📋 تم نسخ قائمة الكروت بنجاح!", "success");
  } catch (e) {
    t.select();
    document.execCommand("copy");
    callShowToast("📋 تم النسخ!", "success");
  }
};

window.filterAdminCardsList = (filter) => {
  _admCardsFilter = filter;
  ["all", "unused", "used"].forEach(f => {
    const b = document.getElementById("btnFilterCard" + f.charAt(0).toUpperCase() + f.slice(1));
    if (b) b.classList.toggle("active", f === filter);
  });
  renderAdminCardsTable();
};

async function loadAdminCardsList() {
  const box = document.getElementById("admCardsListTable");
  if (!box) return;
  box.innerHTML = `<div class="reportsEmpty">⏳ جاري تحميل الكروت بأمان...</div>`;

  try {
    const sb = getSupabaseClient();
    if (sb && typeof sb.rpc === "function") {
      const { data: rpcRes, error: rpcErr } = await sb.rpc("admin_get_cards", {
        p_admin_uid: getActiveAdminRpcUid(),
        p_limit: 150
      });
      if (!rpcErr && rpcRes && rpcRes.ok && Array.isArray(rpcRes.cards)) {
        _admAllCards = rpcRes.cards.map(r => {
          let parsed = {};
          try { parsed = JSON.parse(r.message || "{}"); } catch (e) {}
          return { ...parsed, _rowId: r._rowId, _created: r._created };
        });
      }
    }
    renderAdminCardsTable();
  } catch (e) {
    box.innerHTML = `<div class="reportsEmpty">خطأ: ${e.message}</div>`;
  }
}

function renderAdminCardsTable() {
  const box = document.getElementById("admCardsListTable");
  if (!box) return;

  let filtered = _admAllCards;
  if (_admCardsFilter === "unused") filtered = _admAllCards.filter(c => !c.isUsed);
  else if (_admCardsFilter === "used") filtered = _admAllCards.filter(c => c.isUsed);

  if (filtered.length === 0) {
    box.innerHTML = `<div class="reportsEmpty">لا توجد كروت مطابقة لهذا الفلتر</div>`;
    return;
  }

  box.innerHTML = filtered.map(c => {
    const badge = c.isUsed
      ? `<span style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;padding:2px 8px;border-radius:6px;font-weight:800;font-size:11px">🔴 استُخدم بواسطة: ${callEscapeHtml(c.usedByName || "زبون")} (${callEscapeHtml(c.usedByPhone || "")})</span>`
      : `<span style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;padding:2px 8px;border-radius:6px;font-weight:800;font-size:11px">🟢 صالحة للاستخدام</span>`;

    return `
      <div class="admCardRow">
        <div>
          <div class="admCardCode">${callEscapeHtml(c.code)} — <b>${c.amount} د.ل</b></div>
          <div style="font-size:11px;color:var(--muted);margin-top:3px">${badge}</div>
        </div>
        <button type="button" class="btnGhost" onclick="copyTransferNumber('${callEscapeHtml(c.code)}')" style="padding:4px 8px;font-size:11px;border:1px solid var(--border)">📋 نسخ</button>
      </div>
    `;
  }).join("");
}

window.onAdmLedgerSearchChange = () => {
  renderAdminLedgerTable();
};

async function loadAdminLedger() {
  const box = document.getElementById("admLedgerListTable");
  if (!box) return;
  box.innerHTML = `<div class="reportsEmpty">⏳ جاري تحميل السجل المالي...</div>`;

  try {
    const sb = getSupabaseClient();
    if (sb) {
      const { data, error } = await sb
        .from("feedback")
        .select("*")
        .eq("type", "wallet_transaction")
        .order("created_at", { ascending: false })
        .limit(250);

      if (!error && data) {
        _admAllLedger = data.map(r => {
          let parsed = {};
          try { parsed = JSON.parse(r.message || "{}"); } catch (e) {}
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
  } catch (e) {
    box.innerHTML = `<div class="reportsEmpty">خطأ في جلب السجل: ${e.message}</div>`;
  }
}

function updateAdminLedgerStats() {
  let totalRecharges = 0;
  let totalOrders = 0;
  let totalRefunds = 0;

  _admAllLedger.forEach(tx => {
    const amt = Number(tx.amount || 0);
    if (tx.txType === "card_recharge" || tx.txType === "admin_credit") totalRecharges += Math.abs(amt);
    else if (tx.txType === "order_payment" || (tx.txType === "admin_debit" && String(tx.reason || "").includes("طلبية"))) totalOrders += Math.abs(amt);
    else if (tx.txType === "order_refund") totalRefunds += Math.abs(amt);
  });

  const elR = document.getElementById("admStatRecharges");
  if (elR) elR.textContent = totalRecharges.toFixed(2) + " د.ل";

  const elO = document.getElementById("admStatOrders");
  if (elO) elO.textContent = totalOrders.toFixed(2) + " د.ل";

  const elF = document.getElementById("admStatRefunds");
  if (elF) elF.textContent = totalRefunds.toFixed(2) + " د.ل";
}

function populateLedgerStoreFilter(storesList = null) {
  const sel = document.getElementById("admLedgerStoreFilter");
  if (!sel) return;
  const currentVal = sel.value || "all";
  const stores = {};

  if (storesList && storesList.length) {
    storesList.forEach(s => {
      if (s.storeId) stores[s.storeId] = s.storeName || "مطعم";
    });
  }

  if (Array.isArray(_admAllLedger)) {
    _admAllLedger.forEach(tx => {
      const sId = tx._storeId || tx.meta?.storeId;
      const sName = tx._storeName || tx.meta?.storeName;
      if (sId && sName && !stores[sId]) stores[sId] = sName;
    });
  }

  let html = `<option value="all">🍽️ كل المطاعم</option>`;
  Object.keys(stores).forEach(sId => {
    html += `<option value="${callEscapeHtml(sId)}">🍽️ ${callEscapeHtml(stores[sId])}</option>`;
  });
  sel.innerHTML = html;
  if (stores[currentVal] || currentVal === "all") sel.value = currentVal;
}

function renderAdminLedgerTable() {
  const box = document.getElementById("admLedgerListTable");
  if (!box) return;

  const q = (document.getElementById("admLedgerSearchInput")?.value || "").trim().toLowerCase();
  const typeFilter = document.getElementById("admLedgerTypeFilter")?.value || "all";
  const storeFilter = document.getElementById("admLedgerStoreFilter")?.value || "all";

  let filtered = _admAllLedger;
  if (typeFilter !== "all") {
    filtered = filtered.filter(tx => {
      if (typeFilter === "order_payment") {
        return tx.txType === "order_payment" || (tx.txType === "admin_debit" && String(tx.reason || "").includes("طلبية"));
      }
      return tx.txType === typeFilter;
    });
  }
  if (storeFilter !== "all") {
    filtered = filtered.filter(tx => (tx._storeId || tx.meta?.storeId) === storeFilter);
  }
  if (q) {
    filtered = filtered.filter(tx => {
      const u = (tx._uName || "").toLowerCase();
      const p = (tx._uPhone || "").toLowerCase();
      const r = (tx.reason || "").toLowerCase();
      const id = (tx.txId || "").toLowerCase();
      const sn = (tx._storeName || tx.meta?.storeName || "").toLowerCase();
      return u.includes(q) || p.includes(q) || r.includes(q) || id.includes(q) || sn.includes(q);
    });
  }

  if (filtered.length === 0) {
    box.innerHTML = `<div class="reportsEmpty">لا توجد حركات مالية مطابقة للبحث والفلترة</div>`;
    return;
  }

  box.innerHTML = filtered.map(tx => {
    const amt = Number(tx.amount || 0);
    const isIncome = amt >= 0;
    const sign = isIncome ? "+" : "";
    const color = isIncome ? "#16a34a" : "#dc2626";
    const txDate = tx._created ? new Date(tx._created).toLocaleString("ar-LY", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
    const storeBadge = (tx._storeName || tx.meta?.storeName)
      ? `<span style="background:#fef3c7;color:#92400e;border:1px solid #fde68a;padding:1px 6px;border-radius:4px;font-size:10.5px;font-weight:800;margin-left:4px">🍽️ ${callEscapeHtml(tx._storeName || tx.meta?.storeName)}</span>`
      : "";

    return `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:10px 12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <div style="font-weight:800;font-size:13px;color:var(--text)">
            ${storeBadge}
            ${callEscapeHtml(tx.reason || "معاملة مالية")}
          </div>
          <div style="font-weight:900;font-size:14px;color:${color};direction:ltr">${sign}${amt} د.ل</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:11.5px;color:var(--muted)">
          <div>👤 ${callEscapeHtml(tx._uName || "مستخدم")} ${tx._uPhone ? `— <a href="tel:${callFormatCallPhone(tx._uPhone)}" style="color:#0284c7;text-decoration:none;font-weight:700">📞 ${callEscapeHtml(tx._uPhone)}</a>` : ""}</div>
          <div>🕒 ${txDate}</div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:4px;padding-top:4px;border-top:1px dashed var(--border);font-size:11px;color:var(--muted)">
          <span>كود الحركة: <b style="direction:ltr;display:inline-block">${callEscapeHtml(tx.txId || "")}</b></span>
          <span>الرصيد: ${tx.balanceBefore != null ? tx.balanceBefore + " ➔ " : ""}<b>${tx.balanceAfter != null ? tx.balanceAfter + " د.ل" : ""}</b></span>
        </div>
      </div>
    `;
  }).join("");
}

// فحص وإيداع يدوي لأي مستخدم
window.onAdmDepPhoneInputChanged = () => {
  const rawQuery = (document.getElementById("admDepPhone")?.value || "").trim();
  if (!rawQuery) {
    _admDepTargetUser = null;
    const box = document.getElementById("admDepUserInfoBox");
    if (box) {
      box.style.display = "none";
      box.innerHTML = "";
    }
  }
};

window.admLookupUserByPhone = async () => {
  _admDepTargetUser = null;
  const rawQuery = (document.getElementById("admDepPhone")?.value || "").trim();
  const box = document.getElementById("admDepUserInfoBox");
  const btn = document.getElementById("btnAdmLookupPhone");
  if (!box) return;

  if (!rawQuery || rawQuery.length < 2) {
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

  if (btn) { btn.disabled = true; btn.textContent = "⏳..."; }
  box.style.display = "block";
  box.style.background = "#f8fafc";
  box.style.color = "var(--text)";
  box.style.border = "1.5px solid var(--border)";
  box.style.borderRadius = "10px";
  box.style.padding = "12px 14px";
  box.style.fontSize = "13px";
  box.textContent = "⏳ جاري البحث عن صاحب الحساب في قاعدة البيانات...";

  try {
    let target = null;
    const sb = getSupabaseClient();
    const cleanDigits = rawQuery.replace(/[^0-9]/g, "");
    const cleanUsername = rawQuery.replace(/^@/, "").toLowerCase();

    if (cleanDigits.length >= 8 && sb) {
      const last8 = cleanDigits.slice(-8);
      const { data: pRows } = await sb.from("profiles").select("*").ilike("phone", `%${last8}%`).limit(5);
      if (Array.isArray(pRows) && pRows[0]) target = pRows[0];

      if (!target) {
        const { data: phRows } = await sb.from("phones").select("*").ilike("phone", `%${last8}%`).limit(5);
        if (Array.isArray(phRows) && phRows[0] && phRows[0].uid) {
          const { data: profRows } = await sb.from("profiles").select("*").eq("id", phRows[0].uid).limit(1);
          if (Array.isArray(profRows) && profRows[0]) target = profRows[0];
        }
      }
    }

    if (!target && cleanDigits.length >= 1 && cleanDigits.length <= 6 && !isNaN(parseInt(rawQuery, 10)) && sb) {
      const memNo = parseInt(rawQuery, 10);
      const { data: mRows } = await sb.from("profiles").select("*").eq("member_no", memNo).limit(1);
      if (Array.isArray(mRows) && mRows[0]) target = mRows[0];
    }

    if (!target && cleanUsername.length >= 2 && sb) {
      const { data: uRows } = await sb.from("profiles").select("*").ilike("username", cleanUsername).limit(1);
      if (Array.isArray(uRows) && uRows[0]) target = uRows[0];

      if (!target) {
        const { data: unRows } = await sb.from("usernames").select("*").ilike("username", cleanUsername).limit(1);
        if (Array.isArray(unRows) && unRows[0] && unRows[0].uid) {
          const { data: profRows } = await sb.from("profiles").select("*").eq("id", unRows[0].uid).limit(1);
          if (Array.isArray(profRows) && profRows[0]) target = profRows[0];
        }
      }
    }

    if (!target && rawQuery.length >= 4 && sb) {
      const { data: anyRows } = await sb.from("profiles").select("*").or(`id.eq.${rawQuery},name.ilike.%${rawQuery}%`).limit(5);
      if (Array.isArray(anyRows) && anyRows[0]) target = anyRows[0];
    }

    if (!target) {
      box.style.background = "#fffbeb";
      box.style.color = "#92400e";
      box.style.border = "1.5px solid #fde68a";
      box.innerHTML = `⚠️ لم يتم العثور على أي حساب مسجل بـ "<b>${callEscapeHtml(rawQuery)}</b>". تأكد من رقم الهاتف أو اسم المستخدم.`;
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
          <div style="font-size:13.5px;font-weight:900;color:var(--text);margin-top:2px">${callEscapeHtml(target.name || "مستخدم")}</div>
        </div>
        <div style="background:#fff;border:1px solid #bbf7d0;border-radius:10px;padding:8px 12px">
          <div style="font-size:11px;color:var(--muted);font-weight:700">🏷️ اسم المستخدم:</div>
          <div style="font-size:13.5px;font-weight:900;color:var(--text);margin-top:2px">@${callEscapeHtml(target.username || "—")}</div>
        </div>
        <div style="background:#fff;border:1px solid #bbf7d0;border-radius:10px;padding:8px 12px">
          <div style="font-size:11px;color:var(--muted);font-weight:700">📞 رقم الهاتف:</div>
          <div style="font-size:13.5px;font-weight:900;color:#0284c7;margin-top:2px;direction:ltr;text-align:right">${callEscapeHtml(target.phone || "—")}</div>
        </div>
        <div style="background:linear-gradient(135deg,#dcfce7,#bbf7d0);border:1.5px solid #22c55e;border-radius:10px;padding:8px 12px">
          <div style="font-size:11px;color:#15803d;font-weight:800">💳 الرصيد الحالي:</div>
          <div style="font-size:15px;font-weight:900;color:#166534;margin-top:2px">${wal.balance.toFixed(2)} د.ل</div>
        </div>
      </div>
    `;
  } catch (e) {
    box.style.background = "#fef2f2";
    box.style.color = "#991b1b";
    box.style.border = "1.5px solid #fecaca";
    box.textContent = "خطأ في البحث: " + e.message;
    _admDepTargetUser = null;
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "🔍 فحص"; }
  }
};

window.adminExecuteDeposit = async () => {
  if (window._isAdmExecutingDeposit) return;

  if (!hasAdminPrivilege()) {
    callShowToast("❌ ليس لديك صلاحية أدمن", "error");
    return;
  }

  const amt = parseFloat(document.getElementById("admDepAmount")?.value || "0");
  const type = document.getElementById("admDepType")?.value || "credit";
  const note = (document.getElementById("admDepNote")?.value || "").trim();
  const btn = document.getElementById("btnAdmExecuteDeposit");

  if (isNaN(amt) || amt <= 0) {
    callShowToast("⚠️ يرجى إدخال مبلغ صحيح أكبر من 0", "warn");
    return;
  }
  if (!_admDepTargetUser) {
    callShowToast("⚠️ يرجى الضغط على 'فحص' للتأكد من حساب الزبون أولاً", "warn");
    return;
  }

  const rawTargetUid = _admDepTargetUser.id || _admDepTargetUser.uid;
  const targetUid = getCanonWalletUid(rawTargetUid, null, _admDepTargetUser);
  if (!targetUid) {
    callShowToast("⚠️ تعذر تحديد معرف المستخدم، أعد فحصه بالرقم أو اليوزر", "warn");
    return;
  }

  const opLabel = type === "credit" ? `إيداع مبلغ +${amt} د.ل` : `خصم مبلغ -${amt} د.ل`;
  if (!confirm(`هل أنت متأكد من ${opLabel} لحساب الزبون (${_admDepTargetUser.name || _admDepTargetUser.phone})؟`)) return;

  window._isAdmExecutingDeposit = true;
  if (btn) { btn.disabled = true; btn.textContent = "⏳ جاري تنفيذ العملية وتحديث الرصيد..."; }

  try {
    const finalNote = note || (type === "credit" ? "إيداع يدوي من الإدارة" : "خصم يدوي من الإدارة");
    const res = type === "credit"
      ? await creditUserWallet(targetUid, amt, finalNote, {
          txType: "admin_credit",
          userName: _admDepTargetUser.name,
          userPhone: _admDepTargetUser.phone,
          adminNote: finalNote
        })
      : await debitUserWallet(targetUid, amt, finalNote, {
          txType: "admin_debit",
          userName: _admDepTargetUser.name,
          userPhone: _admDepTargetUser.phone,
          adminNote: finalNote
        });

    if (!res || !res.ok) {
      callShowToast("❌ فشلت العملية: " + ((res && res.error) || "خطأ غير متوقع"), "error");
      return;
    }

    callShowToast(`✅ تمت العملية بنجاح! الرصيد الجديد: ${res.balance.toFixed(2)} د.ل`, "success", 4000);
    const amtInp = document.getElementById("admDepAmount");
    if (amtInp) amtInp.value = "";
    const noteInp = document.getElementById("admDepNote");
    if (noteInp) noteInp.value = "";

    const myCandUids = getCandUids(auth.currentUser?.uid);
    if (auth.currentUser && (auth.currentUser.uid === targetUid || myCandUids.includes(targetUid))) {
      updateWalletUI(res.balance);
    }

    await window.admLookupUserByPhone();
  } catch (e) {
    callShowToast("خطأ: " + e.message, "error");
  } finally {
    window._isAdmExecutingDeposit = false;
    if (btn) { btn.disabled = false; btn.textContent = "💾 تنفيذ العملية وتحديث الرصيد فوراً"; }
  }
};

// مستحقات المطاعم
window.filterLedgerByStore = (storeId, storeName) => {
  window.switchAdmWalTab("ledger");
  const sel = document.getElementById("admLedgerStoreFilter");
  if (sel) {
    let opt = Array.from(sel.options).find(o => o.value === storeId);
    if (!opt) {
      opt = document.createElement("option");
      opt.value = storeId;
      opt.textContent = `🍽️ ${storeName}`;
      sel.appendChild(opt);
    }
    sel.value = storeId;
  }
  renderAdminLedgerTable();
};

async function loadAdminStoresPayouts() {
  const box = document.getElementById("admStoresPayoutsList");
  if (!box) return;
  box.innerHTML = `<div class="reportsEmpty">⏳ جاري حساب مبيعات ومستحقات المطاعم (أسبوعياً وشهرياً)...</div>`;

  try {
    let orders = [];
    const sb = getSupabaseClient();
    if (sb) {
      const { data, error } = await sb
        .from("feedback")
        .select("*")
        .eq("type", "restaurant_order")
        .order("created_at", { ascending: false })
        .limit(500);
      if (!error && data) orders = data;
    }

    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
    const storesMap = {};

    orders.forEach(r => {
      let ord = {};
      try { ord = JSON.parse(r.message || "{}"); } catch (e) {}
      if (ord.paymentMethod === "wallet" && ord.isPaid && ord.status !== "rejected") {
        const sId = ord.storeId || "unknown";
        if (!storesMap[sId]) {
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
        if (orderTime >= oneWeekAgo) {
          storesMap[sId].countWeek += 1;
          storesMap[sId].revenueWeek += amt;
        }
        if (orderTime >= oneMonthAgo) {
          storesMap[sId].countMonth += 1;
          storesMap[sId].revenueMonth += amt;
        }
      }
    });

    const list = Object.values(storesMap);
    populateLedgerStoreFilter(list);

    if (list.length === 0) {
      box.innerHTML = `<div class="reportsEmpty">لا توجد طلبيات مطاعم مدفوعة بالمحفظة حتى الآن</div>`;
      return;
    }

    box.innerHTML = list.map(st => `
      <div style="background:var(--card);border:1.5px solid var(--border);border-radius:12px;padding:12px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
          <div>
            <div style="font-weight:900;font-size:15px;color:var(--text)">🍽️ ${callEscapeHtml(st.storeName)}</div>
            <div style="font-size:11.5px;color:var(--muted);margin-top:2px">
              ${st.storePhone ? `📞 <a href="tel:${callFormatCallPhone(st.storePhone)}" style="color:#0284c7;text-decoration:none;font-weight:700">${callEscapeHtml(st.storePhone)}</a> — ` : ""}
              إجمالي الطلبات المدفوعة بالمحفظة: <b>${st.countAll}</b> طلب
            </div>
          </div>
          <button type="button" class="btnGhost" onclick="filterLedgerByStore('${callEscapeHtml(st.storeId)}', '${callEscapeHtml(st.storeName)}')" style="padding:6px 12px;font-size:11.5px;font-weight:800;border:1.5px solid var(--teal);color:var(--teal-dark);background:var(--teal-light);border-radius:8px;cursor:pointer">
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
  } catch (e) {
    box.innerHTML = `<div class="reportsEmpty">خطأ: ${e.message}</div>`;
  }
}

// 14. دوال التحكم بالدفع من السلة
window.toggleRestPaymentMethod = () => {
  const pMethod = document.querySelector('input[name="restPaymentMethod"]:checked')?.value || "cash";
  const lblCash = document.getElementById("lblPayCash");
  const lblWallet = document.getElementById("lblPayWallet");

  if (lblCash) {
    lblCash.style.borderColor = (pMethod === "cash") ? "var(--teal)" : "var(--border)";
    lblCash.style.borderWidth = (pMethod === "cash") ? "2px" : "1px";
  }
  if (lblWallet) {
    lblWallet.style.borderColor = (pMethod === "wallet") ? "var(--teal)" : "var(--border)";
    lblWallet.style.borderWidth = (pMethod === "wallet") ? "2px" : "1px";
  }

  updateCartWalletBalance();
};

export async function updateCartWalletBalance() {
  const noticeBox = document.getElementById("cartWalletNotice");
  const pMethod = document.querySelector('input[name="restPaymentMethod"]:checked')?.value || "cash";
  const total = getCartTotalPrice();

  if (!auth.currentUser) {
    const cartBal = document.getElementById("cartWalletCurrentBalanceBadge");
    if (cartBal) cartBal.textContent = "سجّل دخولك للدفع بالمحفظة";
    if (pMethod === "wallet" && noticeBox) {
      noticeBox.style.display = "block";
      noticeBox.style.background = "#fffbeb";
      noticeBox.style.color = "#92400e";
      noticeBox.style.border = "1px solid #fde68a";
      noticeBox.innerHTML = `⚠️ يرجى تسجيل الدخول أولاً لتتمكن من الدفع الفوري من محفظتك الإلكترونية.`;
    } else if (noticeBox) {
      noticeBox.style.display = "none";
    }
    return;
  }

  const wal = await getUserWallet(auth.currentUser.uid);
  updateWalletUI(wal.balance);

  if (!noticeBox) return;

  if (pMethod === "wallet") {
    noticeBox.style.display = "block";
    if (wal.balance < total) {
      noticeBox.style.background = "#fef2f2";
      noticeBox.style.color = "#991b1b";
      noticeBox.style.border = "1px solid #fecaca";
      noticeBox.innerHTML = `
        <div style="font-weight:800;margin-bottom:4px">⚠️ رصيدك (${wal.balance.toFixed(2)} د.ل) لا يكفي لدفع قيمة الطلب (${total} د.ل).</div>
        <button type="button" class="btnMain" onclick="openRechargeModal()" style="padding:6px 12px;font-size:12px;background:#0284c7;color:#fff;margin-top:4px;margin-bottom:0">⚡ اشحن محفظتك الآن بكارت أو تحويل</button>
      `;
    } else {
      noticeBox.style.background = "#f0fdf4";
      noticeBox.style.color = "#166534";
      noticeBox.style.border = "1px solid #bbf7d0";
      noticeBox.innerHTML = `🟢 <b>رصيدك كافٍ!</b> سيتم خصم <b>${total} د.ل</b> من محفظتك فوراً، وستصل طلبيتك للكاشير كطلبية مدفوعة مسبقاً وخالصة.`;
    }
  } else {
    noticeBox.style.display = "none";
  }
}

window.resolveUserWalletState = resolveUserWalletState;
window.getUserWallet = getUserWallet;
window.refundOrderToWallet = refundOrderToWallet;
window.updateWalletUI = updateWalletUI;
window.setupUserWalletListener = setupUserWalletListener;
window.loadAdminStoresPayouts = loadAdminStoresPayouts;
window.updateCartWalletBalance = updateCartWalletBalance;
