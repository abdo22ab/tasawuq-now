importScripts('https://www.gstatic.com/firebasejs/12.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBuhnSrkn6jXcCxUnbL-o14gd5pS9wRmnY",
  authDomain: "tasawuq-now-eb955.firebaseapp.com",
  projectId: "tasawuq-now-eb955",
  storageBucket: "tasawuq-now-eb955.firebasestorage.app",
  messagingSenderId: "786110830242",
  appId: "1:786110830242:web:15a4752cd9b5db3f0129fb"
});

// يستقبل هذا الملف الإشعارات ويعرضها حتى لو الموقع مسكر بالمتصفح
const messaging = firebase.messaging();
