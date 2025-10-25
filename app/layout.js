// path: app/layout.js
import React from 'react';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import RootClientWrapper from '@/components/RootClientWrapper';
import { translations as fallbackTranslations } from '@/data/translations';
import '@/styles/globals.css';
import WhatsappButton from '@/components/WhatsappButton';
import TrpcProvider from '@/lib/trpc/Provider';
import NotificationProvider from '@/components/NotificationProvider';
import AnalyticsProvider from '@/components/AnalyticsProvider';
import { logger } from '@/lib/Logger';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

// KRİTİK GÜNCELLEME: SVG içeriği genel bir sembol olarak.
const SYMBOL_SVG_CONTENT = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6c-4 0-6 3-6 7s2 7 6 7" /> 
        <path d="M6 18c4 0-6-3-6-7s-2-7-6-7" />
        <circle cx="6" cy="18" r="2" fill="#4F46E5" stroke="none"/>
        <circle cx="18" cy="6" r="2" fill="#4F46E5" stroke="none"/>
    </svg>
`;
const INDIGO_SVG_DATA_URL = `data:image/svg+xml;base64,${Buffer.from(SYMBOL_SVG_CONTENT).toString('base64')}`;

// SEO GÜNCELLEMESİ 1: Temel meta verileri ve JSON-LD yapıları için sabitler
// BASE_URL www içerir (Canonical: https://www.synarasystem.com)
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.synarasystem.com'; 
const SITE_NAME = 'Synara System';
const T_TR = fallbackTranslations.tr; // TR çeviri objesini al
const SITE_DESCRIPTION = T_TR.seo_default_description;
const SITE_KEYWORDS = T_TR.seo_default_keywords;

const ORGANIZATION_JSON_LD = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Synara System',
    alternateName: 'Mesteg Teknoloji',
    url: BASE_URL,
    logo: `${BASE_URL}/synara_logo_hq.svg`,
    contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+90-532-649-9700',
        contactType: 'customer service',
        areaServed: 'TR',
        availableLanguage: ['Turkish'],
    },
    sameAs: [
        'https://x.com/SynaraSystem',
        'https://instagram.com/SynaraSystem',
        'https://facebook.com/SynaraSystem',
        'https://youtube.com/SynaraSystem',
        'https://linkedin.com/company/SynaraSystem',
    ],
};
const WEBSITE_JSON_LD = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: BASE_URL,
    potentialAction: {
        '@type': 'SearchAction',
        target: `${BASE_URL}/blog?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
    },
};

export const metadata = {
    metadataBase: new URL(BASE_URL), 
    title: {
        default: T_TR.seo_default_title,
        template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    keywords: SITE_KEYWORDS,
    authors: [{ name: 'Synara System', url: BASE_URL }],
    creator: 'Mesteg Teknoloji LTD. ŞTİ.',
    publisher: 'Synara System',
    // YENİ EKLEME: Kanonik linki global olarak ayarla
    alternates: {
        canonical: BASE_URL, 
    },
    icons: {
        icon: [
            { url: INDIGO_SVG_DATA_URL, type: 'image/svg+xml' },
            { url: '/favicon.ico', sizes: '32x32' },
        ],
        shortcut: '/favicon.ico',
        apple: INDIGO_SVG_DATA_URL,
    },
    // SEO GÜNCELLEMESİ 2: Open Graph meta verileri zenginleştirildi
    openGraph: {
        title: SITE_NAME,
        description: SITE_DESCRIPTION,
        url: BASE_URL, 
        siteName: SITE_NAME,
        // OG Görsel URL'si BASE_URL'den çekilir
        images: [
            {
                url: `${BASE_URL}/og-image.png`, // public/og-image.png beklenir
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
        title: SITE_NAME,
        description: SITE_DESCRIPTION,
        creator: '@SynaraSystem',
        // Twitter Görsel URL'si BASE_URL'den çekilir
        images: [`${BASE_URL}/twitter-image.png`], // public/twitter-image.png beklenir
    },
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
};

logger.info('RootLayout Rendered - System Initialization Started');

export default function RootLayout({ children }) {
    const initialTranslations = fallbackTranslations.tr;
    
    return (
        <html lang="tr" className="scroll-auto h-full"> 
            <head>
                 {/* Yapısal Veri (JSON-LD) script'leri */}
                 <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
                 />
                 <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD) }}
                 />
                 <link rel="preconnect" href="https://identitytoolkit.googleapis.com" />
                 <link rel="preconnect" href="https://firestore.googleapis.com" />
                 {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && <link rel="preconnect" href="https://www.googletagmanager.com" />}
            </head>
            <body className={`${inter.className} h-full`}> 
                <AnalyticsProvider>
                    <AuthProvider initialTranslations={initialTranslations}>
                        <TrpcProvider>
                            <NotificationProvider /> 
                            <RootClientWrapper>
                                {children}
                                <WhatsappButton />
                            </RootClientWrapper>
                        </TrpcProvider>
                    </AuthProvider>
                </AnalyticsProvider>
            </body>
        </html>
    );
}
