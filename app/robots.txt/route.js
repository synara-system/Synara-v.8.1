// path: app/robots.txt/route.js
//
// --- BUILD HATASI DÜZELTMESİ (KRİTİK) ---
// Bu dosya, 'npm run build' loglarında çökmeye neden olan 
// tüm veritabanı ('db') bağımlılıklarından arındırıldı.
// 'robots.txt'nin 'sitemap.xml'in aksine dinamik 
// veritabanı sorgularına ihtiyacı yoktur.
// (Kullanıcının yapıştırdığı 'sitemap.xml' içeriği kaldırıldı ve
// doğru 'robots.txt' mantığı ile değiştirildi.)

import { getBaseUrl } from "@/lib/trpc/utils";

// Ortam değişkenini belirle (Vercel/Netlify veya lokal)
const ENV = process.env.VERCEL_ENV || process.env.NODE_ENV;
const baseUrl = getBaseUrl(); // Kanonik URL (www.synarasystem.com)

export async function GET() {
    let robotsText = "";

    if (ENV === 'production') {
        // Üretim ortamı: Taramaya izin ver, hassas yolları engelle
        robotsText = `
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /auth/
Disallow: /login/
Disallow: /register/
Disallow: /reset/
Disallow: /lig/
Disallow: /kasa-yonetimi/
Disallow: /assistant/
Disallow: /kokpit/
Disallow: /dashboard

Sitemap: ${baseUrl}/sitemap.xml
        `.trim();
    } else {
        // Geliştirme (development) veya Önizleme (preview) ortamları:
        // Tüm taramayı engelle
        robotsText = `
User-agent: *
Disallow: /
        `.trim();
    }

    return new Response(robotsText, {
        headers: {
            "Content-Type": "text/plain",
            // Cache süresi (1 gün)
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
        },
    });
}

