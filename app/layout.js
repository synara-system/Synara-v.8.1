// path: app/layout.js
import React from 'react';
// MADDE 6 (GÜNCELLEME): headers, nonce'ı okumak için eklendi (Korundu)
import { headers } from 'next/headers';
import { AuthProvider } from '@/context/AuthContext';
import RootClientWrapper from '@/components/RootClientWrapper';
import { translations as fallbackTranslations } from '@/data/translations';
import '@/styles/globals.css';
// import WhatsappButton from '@/components/WhatsappButton'; // INP FİX: Statik import kaldırıldı
import TrpcProvider from '@/lib/trpc/Provider';
import NotificationProvider from '@/components/NotificationProvider';
// PageSpeed FİX (Kullanılmayan JS): Statik import kaldırıldı, dinamik import eklendi.
// import AnalyticsProvider from '@/components/AnalyticsProvider'; 
import { getBaseUrl } from '@/lib/trpc/utils'; 
import dynamic from 'next/dynamic'; // INP FİX: Dinamik import için eklendi

// KRİTİK FİX: Next.js Font Optimizasyonu (Uyarıyı Giderir)
import { Inter } from 'next/font/google';

const inter = Inter({ 
    subsets: ['latin'],
    display: 'optional', // PageSpeed FİX: 'swap' idi, render-blocking için 'optional' yapıldı.
    variable: '--font-inter', 
});
// (P5.0 FİX: 'next/font' optimizasyonu kaldırıldı - ARTIK DÜZELTİLDİ)

// --- INP FİX (Interaction to Next Paint) ---
// WhatsappButton (3. parti widget) 'next/dynamic' ile erteleniyor.
// Ana thread'i bloke etmemesi için 'ssr: false' kullanıldı.
const DynamicWhatsappButton = dynamic(() => import('@/components/WhatsappButton'), {
    ssr: false,
    // Yüklenirken (çok kısa bir an) hiçbir şey gösterme
    loading: () => null 
});
// --- INP FİX SONU ---

// --- PageSpeed FİX (Kullanılmayan JS) ---
// AnalyticsProvider (GTM) 'next/dynamic' ile erteleniyor.
// Ana thread'i bloke etmemesi için 'ssr: false' kullanıldı.
const DynamicAnalyticsProvider = dynamic(() => import('@/components/AnalyticsProvider'), {
    ssr: false,
    loading: () => null
});
// --- PageSpeed FİX SONU ---


// --- KRİTİK GÜVENLİK FİXİ (ÇÖKMEYİ ENGELLER) ---
// getBaseUrl() boş dönerse statik bir fallback (yedek) adres kullan. 
// Bu, metadataBase'in new URL() çağrısında çökmesini engeller.
const SAFE_BASE_URL = getBaseUrl() || 'https://synara.com'; 

// --- P3.0 FİX: Global SEO Metadata (GÜNCELLEMELER KORUNDU) ---
// SEMRUSH DÜZELTMESİ: Daha güçlü, anahtar kelime ve vizyon odaklı başlıklar
const siteTitle = 'Synara System | Yapay Zeka Destekli Finansal Bütünsel Analiz Platformu';
const siteDescription = 'Karmaşık Piyasaları Tek Bir Karara İndirgeyin. Synara’nın Bütünsel Zeka Matrisi, yüzlerce veriyi analiz ederek bar kapanışında teyitli, güvenilir sinyaller sunar. Kripto ve Finans piyasalarında disiplinli kararlar alın.';

export const metadata = {
    // KRİTİK FİX UYGULANDI: new URL() güvenli BASE URL ile çağrılıyor.
    metadataBase: new URL(SAFE_BASE_URL), 
    title: {
        default: siteTitle,
        template: `%s | Synara System`, 
    },
    // SEMRUSH FİX: Global description eklendi/güçlendirildi.
    description: siteDescription,
    
    // YENİ EKLENEN CANONICAL VE RSS ALTERNATE
    alternates: {
      canonical: SAFE_BASE_URL, // Canonical URL güvenli BASE URL'i kullanır. (Semrush Fix)
      types: {
        'application/rss+xml': `${SAFE_BASE_URL}/feed.xml`,
      },
    },
    // YENİ EKLENEN RSS ALTERNATE SONU
    
    openGraph: {
        title: siteTitle,
        description: siteDescription,
        url: SAFE_BASE_URL, // URL SAFE_BASE_URL kullanır.
        siteName: 'Synara System',
        images: [
            {
                url: `${SAFE_BASE_URL}/synara_og_image.png`, // OG Image URL'i SAFE_BASE_URL kullanır.
                width: 1200,
                height: 630,
                alt: 'Synara System Bütünsel Zeka Matrisi',
            },
        ],
        locale: 'tr_TR',
        type: 'website',
    },

    twitter: {
        card: 'summary_large_image',
        title: siteTitle,
        description: siteDescription,
        images: [`${SAFE_BASE_URL}/synara_og_image.png`], // Twitter Image URL'i SAFE_BASE_URL kullanır.
    },
    
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};
// --- P3.0 FİX Sonu ---

// (P7.0 FİX: 'SYMBOL_SVG_CONTENT' kaldırıldı - Korundu)

// KRİTİK GÜNCELLEME 3: Organization JSON-LD (Madde 5 - Korundu)
const ORGANIZATION_JSON_LD = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Synara System",
    "url": SAFE_BASE_URL, // SAFE_BASE_URL kullanıldı
    "logo": `${SAFE_BASE_URL}/synara_logo_hq.svg`, // SAFE_BASE_URL kullanıldı
    "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+905326499700", // Korundu
        "contactType": "customer service"
    },
    "sameAs": [
        "https://x.com/synarasystem", // Korundu
        "https://www.linkedin.com/company/synarasystem" // Korundu
    ]
};
// --- MADDE 5 SONU ---

// KRİTİK GÜNCELLEME 4: Website JSON-LD (Korundu)
const WEBSITE_JSON_LD = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Synara System",
    "url": SAFE_BASE_URL, // SAFE_BASE_URL kullanıldı
    "potentialAction": {
        "@type": "SearchAction",
        "target": `${SAFE_BASE_URL}/search?q={search_term_string}`, // SAFE_BASE_URL kullanıldı
        "query-input": "required name=search_term_string"
    }
};

// --- P4.0 FİX: Dinamik dil yükleme fonksiyonu kaldırıldı --- (Korundu)

export default async function RootLayout({ children }) {
    
    // MADDE 6 (GÜNCELLEME): Nonce (tek kullanımlık kod) (Korundu)
    const nonce = headers().get('x-nonce') || '';

    // P4.0 FİX: Dil tespiti kaldırıldı (Korundu)
    const lang = 'tr'; 
    const initialTranslations = fallbackTranslations; 

    return (
        // KRİTİK FİX: Font sınıfı <html> etiketine uygulandı.
        <html lang={lang} className={`${inter.variable}`}>
             <head>
                 {/* MOBİL UYUMLULUK ACİL DÜZELTME (HOTFIX): 
                   Hatalı 'initial-scale-1.0' (tire) -> 'initial-scale=1.0' (eşittir) olarak düzeltildi.
                 */}
                 <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            
                 {/* P5.0 FİX: Stabil font yüklemesi (CDN) kaldırıldı, Next/font devraldı. 
                   PageSpeed FİX (Kritik Zincir): Google Fonts preconnect linkleri `next/font` kullandığımız için kaldırıldı.
                 */}
                 
                 {/* Yapısal Veri (JSON-LD) script'leri */}
                 
                 {/* MADDE 6 (GÜNCELLEME): nonce={nonce} özelliği eklendi (Korundu) */}
                 <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
                    nonce={nonce}
                 />
                 <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD) }}
                    nonce={nonce}
                 />
                 
                 {/* Preconnect linkleri (Korundu) */}
                 <link rel="preconnect" href="https://identitytoolkit.googleapis.com" />
                 <link rel="preconnect" href="https://firestore.googleapis.com" />
                 {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && <link rel="preconnect" href="https://www.googletagmanager.com" />}
            </head>
            
            {/* KRİTİK FİX: font-sans, Tailwind'in font-variable'ı kullanmasını sağlar. */}
            <body className="font-sans"> 
                {/* * MADDE 6 (CSP DÜZELTMESİ): 
                  * Sunucuda (middleware) oluşturulan 'nonce' kodu, istemci 
                  * bileşeni olan AnalyticsProvider'a aktarılıyor.
                  * Bu, GA4 ve Plausible script'lerinin CSP'yi geçmesini sağlar.
                */}
                {/* PageSpeed FİX (Kullanılmayan JS): Statik provider, dinamik provider ile değiştirildi. */}
                <DynamicAnalyticsProvider nonce={nonce}>
                    {/* P4.0 FİX: AuthProvider (Korundu) */}
                    <AuthProvider initialTranslations={initialTranslations}>
                        <TrpcProvider>
                            <NotificationProvider /> 
                            <RootClientWrapper>
                                {children}
                                {/* INP FİX: Statik buton yerine dinamik (ertelenmiş) buton yüklendi */}
                                <DynamicWhatsappButton />
                            </RootClientWrapper>
                        </TrpcProvider>
                    </AuthProvider>
                </DynamicAnalyticsProvider>
            </body>
        </html>
    );
}

