// path: app/error.js
'use client'; // Bu, bir İstemci Bileşenidir (Error Boundary için zorunlu)

import React, { useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon'; // Projenizdeki Icon bileşenini kullan

/**
 * Global Hata Sınırı (Error Boundary)
 * Next.js App Router'da 'app' dizinindeki 'layout.js' tarafından kapsanan
 * tüm sayfalarda (route) meydana gelen istemci (client-side) çalışma zamanı
 * hatalarını yakalar.
 * * @param {object} props
 * @param {Error} props.error - Yakalanan JavaScript hatası
 * @param {function} props.reset - Hata sınırını sıfırlamayı deneyen fonksiyon
 */
export default function GlobalError({ error, reset }) {
  
  // Hata oluştuğunda, bu hatayı sunucuya logla (Madde 7.A)
  useEffect(() => {
    if (error) {
      logErrorToService(error);
    }
  }, [error]);

  /**
   * Hatayı sunucu tarafındaki /api/log endpoint'ine gönderir.
   * @param {Error} error - Yakalanan hata objesi
   */
  const logErrorToService = async (error) => {
    try {
      // Hata objesini sunucunun anlayacağı JSON formatına çevir
      const errorData = {
        message: error.message || 'Bilinmeyen istemci hatası',
        stack: error.stack || 'Stack trace mevcut değil',
        // URL veya kullanıcı bilgisi gibi ek veriler buraya eklenebilir
        path: window.location.href,
      };

      // 'fetch' ile /api/log adresine POST isteği at
      await fetch('/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      });
    } catch (apiError) {
      console.error("GlobalError: Hata log servisine gönderilirken bir hata oluştu:", apiError);
    }
  };

  return (
    <html lang="tr">
      <body>
        <main className="flex min-h-screen w-full items-center justify-center bg-gray-900 text-white p-4">
          <div className="flex max-w-lg flex-col items-center rounded-lg border border-gray-700 bg-gray-800 p-8 shadow-xl md:p-12">
            <div className="rounded-full bg-red-500/10 p-4 text-red-500">
              <Icon name="AlertTriangle" size={40} />
            </div>
            
            <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-red-400">
              Bir Sorun Oluştu (Hata 500)
            </h1>
            
            <p className="mt-4 text-center text-gray-300">
              Sistemde beklenmedik bir hata meydana geldi. Teknik ekibimiz durumdan haberdar edildi.
            </p>
            
            {/* Hata Mesajı (Geliştirme ortamı için faydalı olabilir) */}
            {/* <details className="mt-4 w-full rounded bg-gray-700 p-3 text-xs">
              <summary className="cursor-pointer font-medium">Hata Detayları</summary>
              <pre className="mt-2 whitespace-pre-wrap break-all opacity-80">
                {error?.message || 'Detay yok'}
              </pre>
            </details>
            */}

            <div className="mt-8 flex w-full flex-col gap-4 sm:flex-row sm:justify-center">
              <button
                onClick={() => reset()}
                className="w-full rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:w-auto"
              >
                Tekrar Dene
              </button>
              <Link
                href="/"
                className="w-full rounded-md border border-gray-600 px-5 py-3 text-center text-sm font-semibold text-gray-200 shadow-sm transition-all hover:bg-gray-700 sm:w-auto"
              >
                Anasayfaya Dön
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
