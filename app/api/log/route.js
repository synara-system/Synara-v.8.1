// path: app/api/log/route.js
// Madde 7.A: İstemci (Client-Side) Hata Loglama Endpoint'i
// app/error.js (Global Error Boundary) tarafından yakalanan
// 500 hatalarını 'fetch' ile alır ve sunucuya kaydeder.

import { NextResponse } from 'next/server';
import { logger } from '@/lib/Logger'; // Projenizdeki Logger sınıfı
import { headers } from 'next/headers';

/**
 * Geliştirme ortamı için basit bir test logu atar.
 * /api/log adresine GET isteği atıldığında çalışır.
 */
export async function GET(request) {
  logger.info("Test logu (GET /api/log)", {
    kullanici: "test_user",
    sayfa: "/test/page",
  });
  
  return NextResponse.json({ 
    message: "Test logu başarıyla atıldı. Sunucu konsolunu kontrol edin." 
  });
}

/**
 * İstemciden (app/error.js) gönderilen hataları yakalar ve loglar.
 * /api/log adresine POST isteği atıldığında çalışır.
 */
export async function POST(request) {
  try {
    // 1. İstemciden gelen hata verisini JSON olarak oku
    const errorData = await request.json();

    // 2. Güvenlik ve bilgi için ek meta verileri al
    const headerList = headers();
    const userAgent = headerList.get('user-agent') || 'Bilinmiyor';
    const ip = headerList.get('x-forwarded-for') || 'Bilinmiyor';

    // 3. Logger sınıfını kullanarak hatayı sunucu tarafına kaydet
    // Bu loglama, Sentry/Datadog/Logtail gibi harici bir hedefe yönlendirilebilir.
    logger.error('İstemci (Global Error Boundary) Hatası Algılandı', {
      // Hata detayları (app/error.js'den gelir)
      errorMessage: errorData.message,
      stackTrace: errorData.stack,
      path: errorData.path,
      // İstek detayları
      clientIp: ip,
      clientUserAgent: userAgent,
    });

    // 4. İstemciye (app/error.js) işlemin başarılı olduğunu bildir
    return NextResponse.json({ 
      success: true, 
      message: "Hata başarıyla sunucuya kaydedildi." 
    }, { status: 200 });

  } catch (e) {
    // Bu endpoint'in kendisi çökerse (örn: JSON parse hatası)
    // bunu konsola bas
    const errorMessage = (e instanceof Error) ? e.message : 'Bilinmeyen loglama hatası';
    console.error("[CRITICAL /api/log] Loglama endpoint'i çöktü:", errorMessage);

    return NextResponse.json({ 
      success: false, 
      message: "Sunucu loglama servisinde hata oluştu.",
      error: errorMessage
    }, { status: 500 });
  }
}
