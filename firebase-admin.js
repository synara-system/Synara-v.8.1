// path: firebase-admin.js
import admin from 'firebase-admin';
import { logger } from './lib/Logger'; // Logger eklendi

// --- ORTAM DEĞİŞKENLERİNİ OKUMA ---
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

// --- PRIVATE KEY İŞLEME ---
// .env dosyasından gelen anahtarın başındaki/sonundaki tırnakları temizler ve
// \\n kaçış karakterlerini gerçek yeni satır karakterine (\n) dönüştürür.
const privateKey = privateKeyRaw
    ? String(privateKeyRaw)
        .replace(/^"|"$/g, '')
        .replace(/\\n/g, '\n')
        .trim()
    : undefined;

// --- HİZMET HESABI YAPILANDIRMASI ---
const serviceAccount = {
    projectId: projectId,
    clientEmail: clientEmail,
    privateKey: privateKey,
};

// --- YAPILANDIRMA DOĞRULAMA ---
// Tüm değişkenlerin dolu ve private key'in makul bir uzunlukta olup olmadığını kontrol et.
const isConfigComplete = projectId && clientEmail && privateKey && privateKey.length > 100;

let adminDb = null;
let adminAuth = null;

// --- FIREBASE ADMIN SDK BAŞLATMA ---
if (isConfigComplete) {
    // Uygulama daha önce başlatılmamışsa başlat
    if (!admin.apps.length) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            // KRİTİK DÜZELTME: console.log yerine logger kullanıldı.
            logger.info("[SYNARA PROTOCOL] Firebase Admin SDK başarıyla başlatıldı. AUTH & DB hizmetleri aktif.");

            // Servisleri export için ata
            adminAuth = admin.auth();
            adminDb = admin.firestore();

        } catch (e) {
            // Başlatma sırasında kritik bir hata oluşursa, detaylı log bas.
            logger.fatal(new Error(`[SYNARA KRİTİK HATA] Firebase Admin SDK başlatılamadı. Hata: ${e.message}`), {
                 config_status: 'complete',
                 error_details: e
            });
            console.error("Lütfen .env.local veya dağıtım platformundaki (Vercel, Netlify vb.) ortam değişkenlerini kontrol edin.");
        }
    } else {
        // Uygulama zaten başlatılmışsa, mevcut app'ten servisleri al (Next.js HMR için önemli)
        const currentApp = admin.app();
        adminAuth = currentApp.auth();
        adminDb = currentApp.firestore();
        logger.info("[SYNARA PROTOCOL] Firebase Admin SDK mevcut app üzerinden alındı.");
    }
} else {
    // Yapılandırma eksikse, hangi değişkenin eksik olduğunu belirten bir uyarı bas.
    logger.warn("[SYNARA KRİTİK UYARI] Firebase Admin SDK başlatılamadı. Gerekli ortam değişkenleri eksik veya geçersiz.", {
         has_project_id: !!projectId,
         has_client_email: !!clientEmail,
         has_private_key: !!privateKey,
    });
}

export { adminDb, adminAuth };
