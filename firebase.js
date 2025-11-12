// path: firebase.js
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { logger } from './lib/Logger';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let app;
let auth;
let db;
let analytics;

// KRİTİK DÜZELTME (BULGU 3): Firebase başlatma protokolü güncellendi.
// Bu yapı, Next.js'in Hızlı Yenileme (Fast Refresh) özelliğinde uygulamanın
// birden çok kez başlatılmasını engelleyerek hataları önler.
try {
    if (!getApps().length) {
        // Henüz bir uygulama başlatılmadıysa, yenisini başlat.
        app = initializeApp(firebaseConfig);
        logger.info("[Firebase Protokolü] - Sistem başarıyla başlatıldı.");
    } else {
        // Zaten bir uygulama varsa, onu kullan.
        app = getApps()[0];
        logger.info("[Firebase Protokolü] - Mevcut sistem bağlantısı kullanılıyor.");
    }
    
    auth = getAuth(app);
    db = getFirestore(app);

    // Analytics sadece tarayıcı ortamında ve destekleniyorsa başlatılır.
    if (typeof window !== 'undefined') {
        isSupported().then((supported) => {
            if (supported) {
                analytics = getAnalytics(app);
                logger.info("[Firebase Protokolü] - Analytics servisi aktif.");
            }
        });
    }

} catch (error) {
    logger.error("[KRİTİK HATA] Firebase Başlatılamadı!", error);
    
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        const errorMessage = "Firebase başlatma hatası: .env.local dosyasındaki NEXT_PUBLIC_FIREBASE_* değişkenleri eksik veya hatalı. Lütfen konfigürasyonu kontrol edin.";
        console.error(errorMessage);
        logger.fatal(new Error(errorMessage), {});
    }
}


export { app, auth, db, analytics };
