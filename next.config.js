// path:next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // MADDE 6 GÜNCELLEMESİ: X-Powered-By başlığını gizler
  poweredByHeader: false,
  reactStrictMode: true,
  compiler: {}, // Mevcut çalışan yapı korundu
  images: {
    unoptimized: false,
    remotePatterns: [
        // KRİTİK DÜZELTME: Imgur izinleri ayrıldı ve JSON sözdizimine uygun hale getirildi.
        {
            protocol: 'https',
            hostname: 'i.imgur.com', // Doğrudan görsel hosting alanı
        },
        // Imgur ana domain'i (bazı yönlendirmeler için gerekli olabilir, ayrı obje olarak tutuldu)
        {
            protocol: 'https',
            hostname: 'imgur.com',
        },
        {
            protocol: 'https',
            hostname: 'm.imgur.com', // EKLENDİ: Mobil Imgur domaini eklendi (BlogIndexClient'te kullanılıyor)
        },
        {
            protocol: 'https',
            hostname: 'img.youtube.com',
        },
        {
            protocol: 'https',
            hostname: 'placehold.co',
        },
        {
            protocol: 'https',
            hostname: 's3.tradingview.com',
        },
        // Google, Firebase görselleri için Wildcard'lar
        {
            protocol: 'https',
            hostname: '*.googleusercontent.com', 
        },
        {
            protocol: 'https',
            hostname: 'avatars.githubusercontent.com',
        },
         {
            protocol: 'https',
            hostname: 'lh3.googleusercontent.com', 
        },
        {
            // HATA DÜZELTMESİ: 'https.' (noktalı) idi, 'https' (noktasız) olarak düzeltildi.
            protocol: 'https',
            hostname: 'firebasestorage.googleapis.com', 
        },
    ]
  },
  webpack: (config, { isServer }) => {
    // (Kullanıcının son çalışan sürümündeki webpack ayarları korundu)
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        dns: false,
        tls: false,
        path: false,
        encoding: false,
      };
    }
    return config;
  },

  /**
   * YÖNLENDİRME (MADDE 1 EKLENDİ) - Korundu
   */
  async redirects() {
    const redirectRules = [];

    if (process.env.NODE_ENV === 'production') {
      redirectRules.push({
        source: '/:path*', // Gelen tüm yolları yakala
        has: [
          {
            type: 'host',
            // Negatif lookahead: Host www.synarasystem.com DEĞİLSE eşleşir.
            value: '^(?!www\\.synarasystem.com$).*$',
          },
        ],
        destination: 'https://www.synarasystem.com/:path*', // www'li kanonik adrese yönlendir
        permanent: true, // 301 Kalıcı Yönlendirme
      });
    }

    return redirectRules;
  },

  async headers() {
    
    // MADDE 6 GÜNCELLEMESİ: Dinamik CSP (İçerik Güvenlik Politikası) bloğu
    // buradan kaldırıldı. Bu görev artık 'middleware.js' tarafından
    // 'nonce' (tek kullanımlık kod) ile daha güvenli bir şekilde yönetilmektedir.
    /*
    const csp = "default-src 'self' synarasystem.com; ..."; // BLOK SİLİNDİ
    */
    
    return [
      {
        source: '/:path*',
        headers: [
          // Diğer güvenlik başlıkları (HSTS, X-Frame vb.) korundu.
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), midi=(), camera=(), microphone=(), payment=(), usb=()',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // MADDE 6 GÜNCELLEMESİ: 'Content-Security-Policy' başlığı buradan kaldırıldı.
          /*
          {
            key: 'Content-Security-Policy', // SATIR SİLİNDİ
            value: csp,
          },
          */
        ],
      },
    ]
  },
};

module.exports = nextConfig; // Mevcut çalışan yapı korundu

