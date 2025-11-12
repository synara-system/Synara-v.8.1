// path: synarasystem/firebase-admin.js
// KRİTİK DÜZELTME v1.2.9 - Yapılandırma senkronizasyonu.
// Kullanıcının sağladığı "sorunsuz çalışan" sürüme (3-anahtar yöntemi) geri dönüldü.
// Bu sürüm, 'dogru.env.local.txt' (Canvas'taki) ile uyumludur.

import admin from 'firebase-admin';
// Not: 'firebase-admin.js' içinde 'Logger' import etmek, 'Logger' da 'firebase-admin.js'
// import ediyorsa 'circular dependency' (döngüsel bağımlılık) hatasına neden olabilir.
// Güvenlik için loglama basitleştirildi.

// --- ORTAM DEĞİŞKENLERİNİ OKUMA (3-Anahtar Yöntemi) ---
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

// --- EXPORT EDİLECEK DEĞİŞKENLER VE DURUM TAKİBİ ---
let adminAuth = null;
let adminDb = null;
let isInitialized = false; // Durum takibi

// --- PRIVATE KEY İŞLEME (Gelişmiş Temizlik Protokolü) ---
// KRİTİK FİX: Özel anahtardaki \\n karakterlerini tüm ortam senaryolarına karşı temizler.
const privateKey = privateKeyRaw
    ? String(privateKeyRaw)
        .replace(/^\"|\"$/g, '') // Başındaki/Sonundaki tırnakları kaldır
        .replace(/\\n/g, '\n') // Çift eğik çizgili \\n'leri gerçek satır sonuna çevir
        .replace(/\\\\n/g, '\n') // (Bazen Vercel'de olur) Dört eğik çizgili \\n'leri de çevir
    : undefined;

// --- BAŞLATMA MANTIĞI ---
// Değişkenlerin var olup olmadığını kontrol et
if (projectId && clientEmail && privateKey) {
    // Değişkenler doluysa, başlatmayı dene

    // Next.js HMR (Hot Module Replacement) nedeniyle birden fazla başlatmayı önle
    if (!admin.apps.length) {
        try {
            // Yeni uygulama başlat
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: projectId,
                    clientEmail: clientEmail,
                    privateKey: privateKey, // Temizlenmiş anahtarı kullan
                }),
                // Gerekirse veritabanı URL'si (genellikle projectId yeterlidir)
                // databaseURL: `https://${projectId}.firebaseio.com` 
            });
            
            console.log("[SYNARA PROTOCOL] Firebase Admin SDK (3-Anahtar) başarıyla başlatıldı.");

            // Servisleri al
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
    // Yapılandırma geçersizse (değişkenler eksikse) uyarı ver
    console.warn("[SYNARA KRİTİK UYARI] Firebase Admin SDK başlatılamadı. Gerekli ortam değişkenleri eksik veya geçersiz.", {
         has_project_id: !!projectId,
         has_client_email: !!clientEmail,
         has_private_key: (privateKey || '').length > 100 // Anahtarın varlığını (ama içeriğini değil) kontrol et
    });
}

/**
 * Global olarak başlatılan Firestore Admin DB örneğini döndürür.
 * @returns {FirebaseFirestore.Firestore | null}
 */
export function getAdminDb() {
    return adminDb;
}

/**
 * Global olarak başlatılan Firebase Admin Auth örneğini döndürür.
 * @returns {import('firebase-admin/auth').Auth | null}
 */
export function getAdminAuth() {
    return adminAuth;
}

// tRPC context (context.js) bu doğrudan export'ları kullanıyor.
export { adminAuth, adminDb, isInitialized };