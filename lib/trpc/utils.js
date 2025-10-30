// path: lib/trpc/utils.js

/**
 * Next.js App Router yapısı için tRPC istemcisinin
 * doğru API yolunu dinamik olarak belirler.
 * * Bu fonksiyon, ortam değişkeni erişimi nedeniyle sunucu tarafında (SSR) çalıştırılmalıdır.
 * @returns {string} API base URL'i
 */
export const getBaseUrl = () => {
  // Varsayılan kanonik URL (www ile)
  const DEFAULT_URL = 'https://www.synarasystem.com';

  // SADECE sunucu tarafında (Node.js/Edge Runtime) çalışıyorsa process.env kullan.
  if (typeof window === 'undefined') {
    
    // 1. VERCEL ortamını kontrol et (Canlı veya Preview)
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '');
    }

    // 2. LOKAL GELİŞTİRME ('npm run dev')
    if (process.env.NODE_ENV === 'development') {
        return `http://localhost:${process.env.PORT ?? 3000}`;
    }

    // 3. LOKAL ÜRETİM BUILD'i ('npm run build') veya 'next start'
    // .env.local dosyasındaki NEXT_PUBLIC_APP_URL'ye güven. Eğer yoksa DEFAULT kullan.
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, ''); // Sonundaki slash'ı kaldır
    }

    // GÜVENLİ FALLBACK:
    return DEFAULT_URL;
  }

  // Tarayıcı tarafında (Client-side) çalışıyorsak, göreceli yolu (relative path) kullanmak yeterlidir.
  return '';
};

/**
 * tRPC Client'ın API endpoint'ini oluşturur.
 * App Router'da bu her zaman "/api/trpc" olmalıdır.
 * @returns {string} API endpoint yolu
 */
export const getApiUrl = () => {
  // getBaseUrl'den dönen değeri (Sunucu: Tam URL, İstemci: Boş string) kullanır ve
  // API yolunu ekler.
  return `${getBaseUrl()}/api/trpc`;
}

/**
 * Geliştirme ortamında olup olmadığımızı kontrol eder.
 * @returns {boolean}
 */
export const isDev = process.env.NODE_ENV === 'development';
