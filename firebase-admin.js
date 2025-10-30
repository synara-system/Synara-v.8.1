// path: tamir/firebase-admin.js
import admin from 'firebase-admin';
// Not: 'firebase-admin.js' içinde 'Logger' import etmek, 'Logger' da 'firebase-admin.js'
// import ediyorsa 'circular dependency' (döngüsel bağımlılık) hatasına neden olabilir.
// Güvenlik için loglama basitleştirildi.
// import { logger } from './lib/Logger'; // Döngüsel bağımlılık riski nedeniyle kaldırıldı.

// --- ORTAM DEĞİŞKENLERİNİ OKUMA ---
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

// --- EXPORT EDİLECEK DEĞİŞKENLER VE DURUM TAKİBİ ---
let adminAuth = null;
let adminDb = null;
let isInitialized = false; // Yeni durum takibi değişkeni

// --- PRIVATE KEY İŞLEME (SADELEŞTİRME VE TEMİZLİK PROTOKOLÜ) ---
// KRİTİK FİX: Özel anahtardaki \n karakterlerini tüm canlı ortam senaryolarına karşı temizler.
const privateKey = privateKeyRaw
    ? String(privateKeyRaw)
        .replace(/^"|"$/g, '') // Başındaki/Sonundaki tırnakları kaldır
        .replace(/\\n/g, '\n') // Tek ters eğik çizgili \n'leri gerçek satır sonuna çevir (KRİTİK)
    : undefined;

const serviceAccount = {
    projectId: projectId,
    clientEmail: clientEmail,
    privateKey: privateKey,
};

// --- BAŞLATMA MANTIĞI ---
if (projectId && clientEmail && privateKey) {
    // Uygulama daha önce başlatılmamışsa başlat
    if (!admin.apps.length) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });

            console.log("[SYNARA PROTOCOL] Firebase Admin SDK başarıyla başlatıldı. AUTH & DB hizmetleri aktif.");

            // Servisleri export için ata
            adminAuth = admin.auth();
            adminDb = admin.firestore();
            isInitialized = true; // Başlatma başarılı!

        } catch (e) {
            console.error(`[SYNARA KRİTİK HATA] Firebase Admin SDK başlatılamadı. Hata: ${e.message}`, e);
            console.error("Lütfen .env.local veya dağıtım platformundaki ortam değişkenlerini kontrol edin.");
        }
    } else {
        // HMR (Hot Module Reload) için mevcut app'ten al
        const currentApp = admin.app();
        adminAuth = currentApp.auth();
        adminDb = currentApp.firestore();
        isInitialized = true;
    }
} else {
    // Yapılandırma geçersizse uyarı ver ve değişkenleri null/undefined bırak
    console.warn("[SYNARA KRİTİK UYARI] Firebase Admin SDK başlatılamadı. Gerekli ortam değişkenleri eksik veya geçersiz.", {
         has_project_id: !!projectId,
         has_client_email: !!clientEmail,
         has_private_key: (privateKey || '').length > 100
    });
}

// --- BUILD HATASI DÜZELTMESİ (KRİTİK) ---
// 'npm run build' log kaydında belirtilen 'getAdminDb' export hatasını düzeltir.
/**
 * Global olarak başlatılan Firestore Admin DB örneğini döndürür.
 * @returns {FirebaseFirestore.Firestore | null}
 */
export function getAdminDb() {
    return adminDb;
}

/**
 * Global olarak başlatılan Firebase Admin Auth örneğini döndürür.
 * @returns {admin.auth.Auth | null}
 */
export function getAdminAuth() {
    return adminAuth;
}

// Güvenlik açısından adminAuth ve isInitialized da dışa aktarılıyor.
export { adminAuth, adminDb, isInitialized };
