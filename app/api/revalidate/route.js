// path: app/api/revalidate/route.js

// Next.js Server Actions ve Cache yardımcılarını import ediyoruz.
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

/**
 * Next.js'in statik oluşturulmuş sayfalarının önbelleğini temizlemek için kullanılan API rotası.
 * Bir blog yazısı güncellendiğinde veya oluşturulduğunda çağrılmalıdır.
 */
export async function POST(request) {
    // 1. GÜVENLİK PROTOKOLÜ: Yetkilendirme Kontrolü
    const requestUrl = new URL(request.url);
    const token = requestUrl.searchParams.get('token');
    
    // NOT: process.env.NEXT_REVALIDATE_TOKEN değişkenini .env.local dosyana eklemelisin!
    const secret = process.env.NEXT_REVALIDATE_TOKEN;

    if (!secret) {
        // Loglama: Yöneticinin .env dosyasını kontrol etmesi için kritik uyarı
        console.error("🔴 [KRİTİK HATA PROTOKOLÜ] NEXT_REVALIDATE_TOKEN ÇEVRE DEĞİŞKENİ TANIMLANMAMIŞ!");
        return NextResponse.json({ error: 'Sunucu yapılandırma hatası.' }, { status: 500 });
    }

    if (!token || token !== secret) {
        // Yetkisiz erişim denemesi
        return NextResponse.json({ error: 'Yetkisiz önbellek temizleme isteği.' }, { status: 401 });
    }

    // 2. YOL VERİSİ PROTOKOLÜ: Hangi yollar temizlenecek
    let paths;
    try {
        const body = await request.json();
        paths = body.paths;
    } catch (e) {
        return NextResponse.json({ error: 'Geçersiz JSON formatı.' }, { status: 400 });
    }

    if (!paths || !Array.isArray(paths)) {
        return NextResponse.json({ error: 'Geçersiz yollar listesi belirtildi.' }, { status: 400 });
    }

    // 3. İŞLEM PROTOKOLÜ: Önbelleği temizle
    try {
        for (const path of paths) {
            // revalidatePath: Verilen yolu (örneğin '/blog' veya '/blog/[slug]') yeniden oluşturur.
            revalidatePath(path, 'page'); // 'page' parametresi ile sadece sayfa içeriğinin temizlenmesini garanti ediyoruz.
        }

        return NextResponse.json({ revalidated: true, now: Date.now(), paths }, { status: 200 });

    } catch (err) {
        // 500 hatası: Next.js bir hata fırlattı (örneğin hatalı yol)
        return NextResponse.json({ error: 'Önbellek temizleme başarısız oldu.', details: err.message }, { status: 500 });
    }
}

// Bu API rotası, Next.js tarafından Server Action olarak işlenecektir.
// Dinamik çalıştığı için 'edge' runtime kullanılabilir.
export const runtime = 'edge'; 

// Next.js'in bu API rotasını cache'lemesini önlemek için:
export const dynamic = 'force-dynamic';
