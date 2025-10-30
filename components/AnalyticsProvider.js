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
 * * MADDE 6 (CSP DÜZELTMESİ): 'nonce' prop'u eklendi.
 * * INP FİX: Strateji 'afterInteractive' olarak ayarlandı (Mevcuttu, korundu).
 */
const AnalyticsProvider = ({ children, nonce }) => { // nonce prop'u eklendi
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

    // GA4 için gerekli window objesini global olarak tanımla
    useEffect(() => {
        if (GA_ID && typeof window !== 'undefined') {
            window.dataLayer = window.dataLayer || [];
            if (typeof window.gtag !== 'function') {
                window.gtag = function() {
                    window.dataLayer.push(arguments);
                };
            }
            window.gtag('js', new Date());
            window.gtag('config', GA_ID, {
                page_path: pathname,
            });
        }
    }, [pathname]); // pathname bağımlılığı eklendi (sayfa değişimlerinde yeniden config)


    return (
        <>
            {/* Google Analytics 4 (GA4) Scriptleri */}
            {GA_ID && (
                <>
                    {/* * INP FİX: Strateji 'afterInteractive' olarak ayarlandı.
                      * Bu, script'in sayfa interaktif hale geldikten SONRA yüklenmesini sağlar.
                      * Ana thread'i bloke etmez ve INP skorunu iyileştirir.
                      * 'nonce' (CSP) korundu.
                    */}
                    <Script
                        id="gtag-init"
                        strategy="afterInteractive" // INP FİX
                        nonce={nonce} // CSP FİX
                        dangerouslySetInnerHTML={{
                            __html: `
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', '${GA_ID}', {
                                page_path: window.location.pathname,
                            });
                            `,
                        }}
                    />
                    {/* INP FİX: Strateji 'afterInteractive' olarak ayarlandı. */}
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                        strategy="afterInteractive" // INP FİX
                        nonce={nonce} // CSP FİX
                    />
                </>
            )}

            {/* Plausible Analytics Scripti (Eğer kullanılıyorsa) */}
            {PLAUSIBLE_DOMAIN && (
                /* INP FİX: Strateji 'afterInteractive' olarak ayarlandı. */
                /* CSP FİX: nonce={nonce} eklendi */
                <Script
                    data-domain={PLAUSIBLE_DOMAIN}
                    src={`https://plausible.io/js/script.js`} // Plausible Cloud URL
                    strategy="afterInteractive" // INP FİX
                    nonce={nonce} // CSP FİX
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

// Global window objesine gtag'i Next.js'in tanıyacağı şekilde tanımla (TypeScript yok ama JS için yeterli)
if (typeof window !== 'undefined') {
    if (GA_ID && !window.gtag) {
        // window.gtag'i tanımla (Next.js Script'in yüklenmesini beklerken)
        window.gtag = function() {
            if (window.dataLayer) {
                window.dataLayer.push(arguments);
            }
        };
    }
}
