// path: middleware.js
// MADDE 6 (GÜVENLİK REFAKTÖRÜ): Dinamik CSP ve Nonce Üretimi (Report-Only Modu)
import { NextResponse } from 'next/server';
// KRİTİK FİX: Edge Runtime uyarısını çözmek için 'uuid' bağımlılığı kaldırıldı.
// import { v4 as uuidv4 } from 'uuid'; // KALDIRILDI

// GÜNCELLEME (SON FİX): Middleware'de authentication/getToken kullanılmadığı için,
// Module Not Found hatasını önlemek amacıyla NextAuth import'ları kaldırılmıştır.

/**
 * CSP (İçerik Güvenlik Politikası) kurallarını oluşturur.
 * @param {string} nonce - Her istek için üretilen tek kullanımlık kod
 * @returns {string} CSP başlık string'i
 */
function getCSP(nonce) {
    // NOT: Bu CSP, Report-Only modunda çalışacağı için geniş tutulmuştur.
    // İzleme fazı bittikten sonra 'unsafe-inline' ve 'unsafe-eval' kaldırılacaktır.

    // --- CSP DİREKTİFLERİ ---
    const cspConfig = {
        'default-src': ["'self'"],
        'script-src': [
            "'self'",
            `'nonce-${nonce}'`, // 'unsafe-inline' yerine 'nonce' kullan
            "'unsafe-eval'", // Firebase Auth/Plausible için (Mecburi)
            'https://www.gstatic.com',
            'https://apis.google.com',
            'https://www.google.com',
            'https://cdn.jsdelivr.net',
            'https://www.googletagmanager.com',
            'https://www.google-analytics.com',
            'https://plausible.io',
        ],
        'style-src': [
            "'self'",
            "'unsafe-inline'", // Tailwind utility sınıfları ve CDN fontları için (Mecburi)
            'https://fonts.googleapis.com',
        ],
        'img-src': [
            "'self'",
            'data:',
            'https:', // Wildcard 'https'
            '*.googleusercontent.com',
            'https://i.imgur.com',
            'https://m.imgur.com',
            'https://imgur.com',
            'https://img.youtube.com',
            'https://placehold.co',
            'https://s3.tradingview.com',
            'https://firebasestorage.googleapis.com',
            'https://www.google-analytics.com',
            'https://firebasestorage.googleapis.com',
        ],
        'connect-src': [
            "'self'",
            'wss://*.firebaseio.com',
            'https://www.googleapis.com',
            'https://identitytoolkit.googleapis.com',
            'https://securetoken.googleapis.com',
            'https://firestore.googleapis.com',
            'https://generativelanguage.googleapis.com', // AI
            'https://www.google-analytics.com',
            'https://firebase.googleapis.com',
            'https://firebaseinstallations.googleapis.com',
            'https://lh3.googleusercontent.com',
            'https://www.gstatic.com',
            'https://fonts.gstatic.com',
            'https://accounts.google.com',
            'https://fcmtoken.googleapis.com',
            'https://synara-system.firebaseapp.com',
            'https://plausible.io',
            // --- DÜZELTME (GOOGLE AUTH) ---
            // 'signInWithPopup' (Google ile Giriş) popup'ının
            // ihtiyaç duyduğu domain eklendi.
            'https://apis.google.com',
        ],
        'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
        'frame-src': [
            "'self'",
            'https://synara-system.firebaseapp.com',
            'https://apis.google.com',
            'https://www.youtube.com',
            'https://youtube.com',
            'https://www.youtube-nocookie.com',
            'accounts.google.com',
            'firebaseapp.com',
        ],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        // KRİTİK EKLENTİ: İhlal raporları için uç noktası (endpoint)
        'report-uri': ['/api/csp-report'], // İhlal raporları için (uygulanmalıdır)
    };

    // Direktifleri string formatına çevir
    const cspString = Object.entries(cspConfig)
        .map(([key, values]) => {
            return `${key} ${values.join(' ')}`;
        })
        .join('; ');

    return cspString;
}

export async function middleware(request) {
    // 1. Benzersiz Nonce Üret
    // KRİTİK FİX: Edge Runtime destekli crypto.randomUUID() kullanıldı.
    const nonce = crypto.randomUUID();
    
    // 2. CSP Başlığını Oluştur
    // Başlık adını Report-Only moduna çevir.
    const cspReportOnlyHeader = getCSP(nonce);

    // 3. Yanıt (Response) Başlıklarını Ayarla
    const responseHeaders = new Headers(request.headers);
    
    // Başlık adını Report-Only olarak ayarla.
    responseHeaders.set('Content-Security-Policy-Report-Only', cspReportOnlyHeader);

    // 4. Nonce değerini 'app/layout.js'in (Sunucu Bileşeni) okuyabilmesi
    //    için istek (Request) başlığına ekle.
    responseHeaders.set('x-nonce', nonce);

    // 5. Güncellenmiş başlıklarla yanıtı (response) devam ettir
    const response = NextResponse.next({
        request: {
            headers: responseHeaders,
        },
    });

    // 6. CSP başlığını yanıta (response) da ekle (Next.js 13+ için çift güvenlik)
    // Başlık adını Report-Only olarak ayarla.
    response.headers.set('Content-Security-Policy-Report-Only', cspReportOnlyHeader);
    
    // Güvenlik için eski başlığı kaldır (Report-Only modunda ikisi birden olmamalı)
    response.headers.delete('Content-Security-Policy'); 

    return response;
}

// Middleware'in hangi yollarda çalışacağını belirle
// (Artık sadece dinamik olması gereken yollarda çalışması gerekiyor ki statik sayfalar bozulmasın)
export const config = {
    matcher: [
        /*
         * DİKKAT: Sadece Üye Paneli ve Admin Yollarında çalışması için kısıtlandı.
         * Pazarlama sayfaları (/blog, /about-us vb.) statik olarak üretilebilir.
         */
        '/dashboard/:path*', // Dashboard ve alt yollar
        '/kokpit/:path*',    // Kokpit ve alt yollar
        '/kasa-yonetimi/:path*', // Kasa Yönetimi ve alt yollar
        '/analyses/:path*',  // Analizler ve alt yollar
        '/admin/:path*',     // Admin paneli ve alt yollar
        '/assistant/:path*', // Asistan sayfası
        '/lig/:path*',       // Lig sayfası
        '/market-pulse/:path*', // Market Pulse
    ],
};
