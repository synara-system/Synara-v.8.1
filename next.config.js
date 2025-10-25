// path: next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {},
  images: {
    unoptimized: false,
    remotePatterns: [
        {
            protocol: 'https',
            hostname: 'i.imgur.com',
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
        // KRİTİK DÜZELTME: Wildcard kullanımı (Google, Firebase görselleri için)
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
            protocol: 'https',
            hostname: 'firebasestorage.googleapis.com', 
        },
    ]
  },
  webpack: (config, { isServer }) => {
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

  async headers() {
    // KRİTİK GÜVENLİK GÜNCELLEMESİ (HATA-08 / COOP DÜZELTMESİ):
    // Firebase Pop-up ile oturum açmanın (Sign in with Google) çalışması için COOP ayarı kaldırıldı.
    
    const csp = `default-src 'self' synarasystem.com; 
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://apis.google.com https://www.google.com https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.google-analytics.com https://plausible.io; 
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
      img-src 'self' data: blob: i.imgur.com img.youtube.com placehold.co s3.tradingview.com *.googleusercontent.com avatars.githubusercontent.com lh3.googleusercontent.com firebasestorage.googleapis.com;
      connect-src 'self' wss://*.firebaseio.com https://www.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://generativelanguage.googleapis.com https://www.google-analytics.com https://firebase.googleapis.com https://firebaseinstallations.googleapis.com https://lh3.googleusercontent.com https://www.gstatic.com https://fonts.gstatic.com https://accounts.google.com https://fcmtoken.googleapis.com https://synara-system.firebaseapp.com https://plausible.io;
      font-src 'self' https://fonts.gstatic.com data:;
      frame-src 'self' https://synara-system.firebaseapp.com https://apis.google.com https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com accounts.google.com firebaseapp.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
    `.replace(/\s{2,}/g, ' ').trim();

    return [
      {
        source: '/:path*',
        headers: [
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
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
        ],
      },
    ]
  },
};

module.exports = nextConfig;
