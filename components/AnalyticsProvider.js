// path: components/AnalyticsProvider.js
'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';
import React, { useEffect } from 'react';

// Ortam değişkenlerini doğrudan oku
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

/**
 * İstemci tarafı analitik izleme ve GA4/Plausible entegrasyonunu yönetir.
 * Sayfa geçişlerinde izleme event'lerini tetikler.
 */
const AnalyticsProvider = ({ children }) => {
    const pathname = usePathname();

    // GA4 Sayfa İzleme
    useEffect(() => {
        if (GA_ID && typeof window !== 'undefined' && window.gtag) {
            window.gtag('config', GA_ID, {
                page_path: pathname,
            });
        }
        
        // Plausible Sayfa İzleme (Eğer entegre edilmişse)
        // Next.js App Router'da Plausible script'i otomatik olarak sayfa geçişlerini yakalar.
        // Manuel event gönderme sadece özel aksiyonlar için gereklidir.

    }, [pathname]);

    // GA4 için gerekli window objesini global olarak tanımlar
    // Google Analytics 4 (GA4) - Pazarlama ve Derin Analiz için
    const gaScript = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
            send_page_view: false // İlk yüklemeyi manuel kontrol ediyoruz
        });
    `;

    return (
        <>
            {/* GA4 Script Yükleme */}
            {GA_ID && (
                <>
                    <Script 
                        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} 
                        strategy="afterInteractive" 
                    />
                    <Script 
                        id="google-analytics-init" 
                        dangerouslySetInnerHTML={{ __html: gaScript }} 
                        strategy="afterInteractive"
                    />
                </>
            )}

            {/* Plausible Analytics Script Yükleme (Gizlilik Odaklı) */}
            {PLAUSIBLE_DOMAIN && (
                <Script
                    data-domain={PLAUSIBLE_DOMAIN}
                    src={`https://plausible.io/js/script.js`} // Plausible Cloud URL
                    strategy="afterInteractive"
                />
            )}

            {children}
        </>
    );
};

export default AnalyticsProvider;

// Harici Event Fonksiyonu (Dışarıdan özel event göndermek için)
// Örn: logger.trackEvent('kasa_islem_eklendi', { instrument: 'BTCUSDT' })
export const trackEvent = (eventName, data = {}) => {
    if (GA_ID && typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, { ...data, send_to: GA_ID });
    }
    // Plausible custom event simülasyonu
    if (PLAUSIBLE_DOMAIN && typeof window !== 'undefined' && window.plausible) {
         window.plausible(eventName, { props: data });
    }
};

// Global window objesine gtag'i Next.js'in tanıyacağı şekilde tanımla (TypeScript yok ama JS için faydalı)
if (typeof window !== 'undefined') {
    window.gtag = window.gtag || function() { window.dataLayer.push(arguments); };
    window.plausible = window.plausible || function() { /* Plausible Function */ };
}
