import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

export const SUPABASE_URL = "https://jtpfpqalibbwdbirzdnk.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_6N_kXZ3e5fB4XM7xKKfT-g_7AHN25Tp";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
window.supabase = supabase;

const TABLE_MAP = {
  posts: "posts",
  stores: "stores",
  profiles: "profiles",
  phones: "phones",
  usernames: "usernames",
  userLimits: "user_limits",
  user_limits: "user_limits",
  reports: "reports",
  feedback: "feedback",
  counters: "counters",
  ratings: "ratings",
  storeRatings: "store_ratings",
  store_ratings: "store_ratings",
  app_notifications: "app_notifications",
  settings: "settings",
  userPoints: "user_points",
  user_points: "user_points",
  userRedemptions: "user_redemptions",
  user_redemptions: "user_redemptions",
  user_follows: "user_follows"
};

function getTableName(col) {
  return TABLE_MAP[col] || col;
}

function toSnake(str) {
  if (str === "memberNo") return "member_no";
  if (str === "storeLimit") return "store_limit";
  if (str === "priceType") return "price_type";
  if (str === "originalPrice") return "original_price";
  if (str === "subCategory") return "sub_category";
  if (str === "imageUrl") return "image_url";
  if (str === "adType") return "ad_type";
  if (str === "rejectReason") return "reject_reason";
  if (str === "whatsappClicks") return "whatsapp_clicks";
  if (str === "favoritesCount") return "favorites_count";
  if (str === "featuredUntil") return "featured_until";
  if (str === "featuredPlan") return "featured_plan";
  if (str === "soldAt") return "sold_at";
  if (str === "createdAt") return "created_at";
  if (str === "expiresAt") return "expires_at";
  if (str === "termsAcceptedAt") return "terms_accepted_at";
  if (str === "storeId") return "store_id";
  if (str === "storeName") return "store_name";
  if (str === "storeCategory") return "store_category";
  if (str === "sellerName") return "seller_name";
  if (str === "sellerUsername") return "seller_username";
  if (str === "sellerMemberNo") return "seller_member_no";
  if (str === "wasEdited") return "was_edited";
  if (str === "editedAt") return "edited_at";
  if (str === "ownerUid") return "owner_uid";
  if (str === "ownerUsername") return "owner_username";
  if (str === "ownerMemberNo") return "owner_member_no";
  if (str === "ownerEmail") return "owner_email";
  if (str === "receiptPhone") return "receipt_phone";
  if (str === "workingHours") return "working_hours";
  if (str === "deliveryCompany") return "delivery_company";
  if (str === "bankInfo") return "bank_info";
  if (str === "approvedAt") return "approved_at";
  if (str === "phoneEditsCount") return "phone_edits_count";
  if (str === "localPhone") return "local_phone";
  if (str === "linkedAt") return "linked_at";
  if (str === "updatedAt") return "updated_at";
  if (str === "postId") return "post_id";
  if (str === "postTitle") return "post_title";
  if (str === "reporterUid") return "reporter_uid";
  if (str === "reporterName") return "reporter_name";
  if (str === "userName") return "user_name";
  if (str === "userPhone") return "user_phone";
  if (str === "lastNumber") return "last_number";
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function toCamel(str) {
  if (str === "member_no") return "memberNo";
  if (str === "store_limit") return "storeLimit";
  if (str === "price_type") return "priceType";
  if (str === "original_price") return "originalPrice";
  if (str === "sub_category") return "subCategory";
  if (str === "image_url") return "imageUrl";
  if (str === "ad_type") return "adType";
  if (str === "reject_reason") return "rejectReason";
  if (str === "whatsapp_clicks") return "whatsappClicks";
  if (str === "favorites_count") return "favoritesCount";
  if (str === "featured_until") return "featuredUntil";
  if (str === "featured_plan") return "featuredPlan";
  if (str === "sold_at") return "soldAt";
  if (str === "created_at") return "createdAt";
  if (str === "expires_at") return "expiresAt";
  if (str === "terms_accepted_at") return "termsAcceptedAt";
  if (str === "store_id") return "storeId";
  if (str === "store_name") return "storeName";
  if (str === "store_category") return "storeCategory";
  if (str === "seller_name") return "sellerName";
  if (str === "seller_username") return "sellerUsername";
  if (str === "seller_member_no") return "sellerMemberNo";
  if (str === "was_edited") return "wasEdited";
  if (str === "edited_at") return "editedAt";
  if (str === "owner_uid") return "ownerUid";
  if (str === "owner_username") return "ownerUsername";
  if (str === "owner_member_no") return "ownerMemberNo";
  if (str === "owner_email") return "ownerEmail";
  if (str === "receipt_phone") return "receiptPhone";
  if (str === "working_hours") return "workingHours";
  if (str === "delivery_company") return "deliveryCompany";
  if (str === "bank_info") return "bankInfo";
  if (str === "approved_at") return "approvedAt";
  if (str === "phone_edits_count") return "phoneEditsCount";
  if (str === "local_phone") return "localPhone";
  if (str === "linked_at") return "linkedAt";
  if (str === "updated_at") return "updatedAt";
  if (str === "post_id") return "postId";
  if (str === "post_title") return "postTitle";
  if (str === "reporter_uid") return "reporterUid";
  if (str === "reporter_name") return "reporterName";
  if (str === "user_name") return "userName";
  if (str === "user_phone") return "userPhone";
  if (str === "last_number") return "lastNumber";
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function objectToDb(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const res = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    const dbKey = toSnake(k);
    res[dbKey] = v;
  }
  return res;
}

export function objectFromDb(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const res = {};
  for (const [k, v] of Object.entries(obj)) {
    const appKey = toCamel(k);
    res[appKey] = v;
  }
  if (res.images && typeof res.images === "string") {
    if (res.images.startsWith("http")) {
      res.images = [res.images];
    } else {
      try {
        const parsed = JSON.parse(res.images);
        res.images = Array.isArray(parsed) ? parsed : [parsed];
      } catch(e) {
        res.images = [];
      }
    }
  }
  if (!Array.isArray(res.images)) {
    if (typeof res.images === "string" && res.images.startsWith("http")) {
      res.images = [res.images];
    } else {
      res.images = [];
    }
  }
  if ((!res.imageUrl || res.imageUrl.length < 5) && res.images.length > 0) {
    res.imageUrl = res.images[0];
  }
  if (res.images.length === 0 && res.imageUrl && res.imageUrl.startsWith("http")) {
    res.images = [res.imageUrl];
  }
  if (res.keywords && typeof res.keywords === "string") {
    try { res.keywords = JSON.parse(res.keywords); } catch(e){ res.keywords = []; }
  }
  if (!res.keywords) res.keywords = [];
  if (res.helpers && typeof res.helpers === "string") {
    try { res.helpers = JSON.parse(res.helpers); } catch(e){ res.helpers = []; }
  }
  if (res.originalData && typeof res.originalData === "string") {
    try { res.originalData = JSON.parse(res.originalData); } catch(e){}
  }
  if (res.specs && typeof res.specs === "string") {
    try { res.specs = JSON.parse(res.specs); } catch(e){ res.specs = {}; }
  }
  if (!res.specs && res.originalData && res.originalData.specs) {
    res.specs = res.originalData.specs;
  }
  if (res.price != null) res.price = Number(res.price);
  if (res.originalPrice != null) res.originalPrice = Number(res.originalPrice);
  if (res.views != null) res.views = Number(res.views);
  if (res.whatsappClicks != null) res.whatsappClicks = Number(res.whatsappClicks);
  if (res.favoritesCount != null) res.favoritesCount = Number(res.favoritesCount);
  if (res.createdAt != null) res.createdAt = Number(res.createdAt);
  if (res.expiresAt != null) res.expiresAt = Number(res.expiresAt);
  if (res.featuredUntil != null) res.featuredUntil = Number(res.featuredUntil);
  if (res.soldAt != null) res.soldAt = Number(res.soldAt);
  if (res.memberNo != null) res.memberNo = Number(res.memberNo);
  if (res.lastNumber != null) res.lastNumber = Number(res.lastNumber);
  return res;
}

function makeDocSnap(id, data) {
  const exists = !!data;
  return {
    id,
    exists: () => exists,
    data: () => (exists ? { ...data } : undefined)
  };
}

function makeQuerySnap(docsArray) {
  return {
    docs: docsArray,
    empty: docsArray.length === 0,
    size: docsArray.length,
    forEach: (cb) => docsArray.forEach(cb)
  };
}

export class DocRef {
  constructor(collectionName, id) {
    this.collectionName = collectionName;
    this.id = String(id || "");
    this.table = getTableName(collectionName);
    this.customFields = null;
  }
}

export class CollectionRef {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.table = getTableName(collectionName);
    this.defaultFilter = null;
  }
}

export function doc(dbInstance, ...paths) {
  if (paths.length === 1) {
    return new DocRef(paths[0], "doc_" + Date.now() + "_" + Math.random().toString(36).substr(2, 7));
  }
  if (paths.length === 2) {
    return new DocRef(paths[0], paths[1] || ("doc_" + Date.now() + "_" + Math.random().toString(36).substr(2, 7)));
  }
  if (paths.length >= 4 && paths[2] === "following") {
    const followerUid = paths[1];
    const sellerUid = paths[3];
    const ref = new DocRef("user_follows", `${followerUid}_${sellerUid}`);
    ref.customFields = { follower_uid: followerUid, seller_uid: sellerUid };
    return ref;
  }
  if (paths.length >= 4 && paths[2] === "followers") {
    const sellerUid = paths[1];
    const followerUid = paths[3];
    const ref = new DocRef("user_follows", `${followerUid}_${sellerUid}`);
    ref.customFields = { follower_uid: followerUid, seller_uid: sellerUid };
    return ref;
  }
  return new DocRef(paths[paths.length - 2], paths[paths.length - 1]);
}

export function collection(dbInstance, ...paths) {
  if (paths.length <= 1) {
    return new CollectionRef(paths[0] || "");
  }
  if (paths.length >= 3 && paths[2] === "following") {
    const col = new CollectionRef("user_follows");
    col.defaultFilter = { key: "follower_uid", op: "==", val: paths[1] };
    return col;
  }
  if (paths.length >= 3 && paths[2] === "followers") {
    const col = new CollectionRef("user_follows");
    col.defaultFilter = { key: "seller_uid", op: "==", val: paths[1] };
    return col;
  }
  return new CollectionRef(paths[paths.length - 1]);
}

export class QueryBuilder {
  constructor(target) {
    if (target instanceof CollectionRef) {
      this.collectionName = target.collectionName;
      this.table = target.table;
    } else if (target instanceof QueryBuilder) {
      this.collectionName = target.collectionName;
      this.table = target.table;
      this.filters = [...target.filters];
      this.orderBys = [...target.orderBys];
      this.limitVal = target.limitVal;
    }
    this.filters = this.filters || [];
    this.orderBys = this.orderBys || [];
    this.limitVal = this.limitVal || null;
  }
}

export function query(target, ...operations) {
  const qb = new QueryBuilder(target);
  for (const op of operations) {
    if (!op) continue;
    if (op.type === "where") qb.filters.push(op);
    else if (op.type === "orderBy") qb.orderBys.push(op);
    else if (op.type === "limit") qb.limitVal = op.value;
  }
  return qb;
}

export function where(field, op, value) {
  return { type: "where", field: toSnake(field), op, value };
}

export function orderBy(field, direction = "asc") {
  return { type: "orderBy", field: toSnake(field), ascending: String(direction).toLowerCase() !== "desc" };
}

export function limit(n) {
  return { type: "limit", value: n };
}

export function startAfter(docSnap) {
  return { type: "startAfter", doc: docSnap };
}

export async function getDoc(docRef) {
  if (!docRef || !docRef.id) return makeDocSnap("", null);
  const table = docRef.table;
  try {
    let req = supabase.from(table).select("*");
    if (table === "phones") req = req.eq("phone", docRef.id);
    else if (table === "usernames") req = req.eq("username", docRef.id);
    else if (table === "user_limits") req = req.eq("uid", docRef.id);
    else req = req.eq("id", docRef.id);

    const { data, error } = await req.maybeSingle();
    if (error || !data) return makeDocSnap(docRef.id, null);
    return makeDocSnap(docRef.id, objectFromDb(data));
  } catch (err) {
    return makeDocSnap(docRef.id, null);
  }
}

export async function getDocs(target) {
  let table = "";
  let filters = [];
  let orderBys = [];
  let limitVal = null;

  if (target instanceof CollectionRef) {
    table = target.table;
    if (target.defaultFilter) {
      filters.push({ type: "where", field: target.defaultFilter.key, op: target.defaultFilter.op, value: target.defaultFilter.val });
    }
  } else if (target instanceof QueryBuilder) {
    table = target.table;
    filters = target.filters;
    orderBys = target.orderBys;
    limitVal = target.limitVal;
  } else {
    return makeQuerySnap([]);
  }

  try {
    let req = supabase.from(table).select("*");

    for (const f of filters) {
      if (f.op === "==") req = req.eq(f.field, f.value);
      else if (f.op === "!=") req = req.neq(f.field, f.value);
      else if (f.op === ">") req = req.gt(f.field, f.value);
      else if (f.op === ">=") req = req.gte(f.field, f.value);
      else if (f.op === "<") req = req.lt(f.field, f.value);
      else if (f.op === "<=") req = req.lte(f.field, f.value);
      else if (f.op === "array-contains") req = req.contains(f.field, [f.value]);
    }

    for (const o of orderBys) {
      req = req.order(o.field, { ascending: o.ascending });
    }

    if (limitVal) {
      req = req.limit(limitVal);
    }

    const { data, error } = await req;
    if (error || !data) return makeQuerySnap([]);

    const docs = data.map(item => {
      const id = item.id || item.phone || item.username || item.uid;
      return makeDocSnap(id, objectFromDb(item));
    });
    return makeQuerySnap(docs);
  } catch (err) {
    return makeQuerySnap([]);
  }
}

export async function setDoc(docRef, data, options = {}) {
  const row = objectToDb(data);
  const table = docRef.table;

  if (table === "phones") row.phone = docRef.id;
  else if (table === "usernames") row.username = docRef.id;
  else if (table === "user_limits") row.uid = docRef.id;
  else row.id = docRef.id;

  if (docRef.customFields) {
    Object.assign(row, docRef.customFields);
  }

  let payload = { ...row };
  if (table === "profiles") {
    if (payload.username === "" || payload.username === undefined) {
      delete payload.username;
    }
  }
  for (let attempt = 0; attempt < 6; attempt++) {
    const { error } = await supabase.from(table).upsert(payload);
    if (!error) return true;
    const match = error.message && error.message.match(/Could not find the '([^']+)' column/);
    if (match && match[1] && match[1] in payload) {
      delete payload[match[1]];
      continue;
    }
    throw new Error(error.message);
  }
  return true;
}

export async function addDoc(colRef, data) {
  const row = objectToDb(data);
  const table = colRef.table;
  const newId = row.id || ("doc_" + Date.now() + "_" + Math.random().toString(36).substr(2, 7));
  row.id = newId;

  let payload = { ...row };
  if (table === "profiles") {
    if (payload.username === "" || payload.username === undefined) {
      delete payload.username;
    }
  }
  for (let attempt = 0; attempt < 6; attempt++) {
    const { error } = await supabase.from(table).insert(payload);
    if (!error) return new DocRef(colRef.collectionName, newId);
    const match = error.message && error.message.match(/Could not find the '([^']+)' column/);
    if (match && match[1] && match[1] in payload) {
      delete payload[match[1]];
      continue;
    }
    throw new Error(error.message);
  }
  return new DocRef(colRef.collectionName, newId);
}

export async function updateDoc(docRef, data) {
  const row = objectToDb(data);
  const table = docRef.table;

  // Handle increment fields:
  for (const [k, v] of Object.entries(row)) {
    if (v && v.__type === "increment") {
      const { data: cur } = await supabase.from(table).select(k).eq("id", docRef.id).maybeSingle();
      const curVal = cur && cur[k] != null ? Number(cur[k]) : 0;
      row[k] = curVal + v.value;
    }
  }

  let payload = { ...row };
  if (table === "profiles") {
    if (payload.username === "" || payload.username === undefined) {
      delete payload.username;
    }
  }
  for (let attempt = 0; attempt < 6; attempt++) {
    let req = supabase.from(table).update(payload);
    if (table === "phones") req = req.eq("phone", docRef.id);
    else if (table === "usernames") req = req.eq("username", docRef.id);
    else if (table === "user_limits") req = req.eq("uid", docRef.id);
    else req = req.eq("id", docRef.id);

    const { data: resData, error } = await req.select();
    if (!error) {
      if (!resData || resData.length === 0) {
        return await setDoc(docRef, payload, { merge: true });
      }
      return true;
    }

    const match = error.message && error.message.match(/Could not find the '([^']+)' column/);
    if (match && match[1] && match[1] in payload) {
      delete payload[match[1]];
      continue;
    }
    throw new Error(error.message);
  }
  return true;
}

export async function deleteDoc(docRef) {
  const table = docRef.table;
  let req = supabase.from(table).delete();
  if (table === "phones") req = req.eq("phone", docRef.id);
  else if (table === "usernames") req = req.eq("username", docRef.id);
  else if (table === "user_limits") req = req.eq("uid", docRef.id);
  else req = req.eq("id", docRef.id);

  const { error } = await req;
  if (error) throw new Error(error.message);
  return true;
}

export function onSnapshot(target, onNext, onError) {
  const isDoc = target instanceof DocRef;
  const table = isDoc ? target.table : (target instanceof CollectionRef ? target.table : target.table);

  const doFetch = async () => {
    try {
      if (isDoc) {
        const snap = await getDoc(target);
        onNext(snap);
      } else {
        const snap = await getDocs(target);
        onNext(snap);
      }
    } catch (e) {
      if (onError) onError(e);
    }
  };

  doFetch();

  const channelName = "rt_" + table + "_" + Math.random().toString(36).substr(2, 6);
  const channel = supabase
    .channel(channelName)
    .on("postgres_changes", { event: "*", schema: "public", table }, () => {
      doFetch();
    })
    .subscribe();

  return () => {
    try { supabase.removeChannel(channel); } catch(e){}
  };
}

export function increment(n) {
  return { __type: "increment", value: n };
}

export async function runTransaction(dbInstance, updateFunction) {
  const pending = [];
  const transaction = {
    get: async (ref) => await getDoc(ref),
    set: (ref, data, opts) => {
      const p = setDoc(ref, data, opts);
      pending.push(p);
      return p;
    },
    update: (ref, data) => {
      const p = updateDoc(ref, data);
      pending.push(p);
      return p;
    },
    delete: (ref) => {
      const p = deleteDoc(ref);
      pending.push(p);
      return p;
    }
  };
  const result = await updateFunction(transaction);
  if (pending.length > 0) {
    await Promise.all(pending);
  }
  return result;
}

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-ai.js";

const firebaseConfig = {
  apiKey: "AIzaSyBuhnSrkn6jXcCxUnbL-o14gd5pS9wRmnY",
  authDomain: "tasawuq-now-eb955.firebaseapp.com",
  projectId: "tasawuq-now-eb955",
  storageBucket: "tasawuq-now-eb955.firebasestorage.app",
  messagingSenderId: "786110830242",
  appId: "1:786110830242:web:15a4752cd9b5db3f0129fb"
};

const fbApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(fbApp);
export { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup };

let aiInstance = null;
try {
  aiInstance = getAI(fbApp, { backend: new GoogleAIBackend() });
} catch(e) {
  console.warn("AI init warning:", e);
}
export const ai = aiInstance;
export { getGenerativeModel };

export const db = {};
