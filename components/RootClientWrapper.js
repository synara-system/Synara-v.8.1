// path: components/RootClientWrapper.js

'use client'; 

import React, { useEffect, useLayoutEffect } from 'react';
import NProgress from 'nprogress';
import { useAuth } from '@/context/AuthContext';
import Header from './Header';
// import Footer from './Footer'; // PLANLA v2: Statik import kaldırıldı
import SkeletonLoader from './SkeletonLoader';
import ErrorBoundary from './ErrorBoundary';
// import CookieBanner from './CookieBanner'; // PLANLA v2: Statik import kaldırıldı
import { usePathname } from 'next/navigation';
import { logger } from '@/lib/Logger'; // Logger import edildi
import dynamic from 'next/dynamic'; // PLANLA v2: Dinamik import için eklendi

// --- PLANLA v2 (Yeniden Uygulama): Dinamik JS Yükleme ---
// "Above the fold" olmayan global bileşenler ertelendi.
const DynamicFooter = dynamic(() => import('./Footer'), { 
    ssr: false, 
    loading: () => null 
});

const DynamicCookieBanner = dynamic(() => import('./CookieBanner'), {
    ssr: false, 
    loading: () => null
});
// --- PLANLA v2 Sonu ---

/**
 * Bu bileşen, AuthContext'i ve diğer global Hook'ları kullanan tüm Client mantığını sarmalar.
 * app/layout.js'e dahil edilir.
 */
function RootClientWrapper({ children }) {
    
    const { user, isAdmin, T, loading } = useAuth();
    const pathname = usePathname(); 
    
    // KRİTİK GÜNCELLEME 1: DVH/VH Mobil Fixi ve Router Scroll Restorasyonu
    useLayoutEffect(() => {
        // A. Mobil VH (View Height) Fixi (dvh desteği olmayan/zıplama yapan mobil tarayıcılar için)
        const setVh = () => {
             // CSS değişkenini, mevcut viewport yüksekliğinin %1'i olarak ayarlar.
            document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
        };
        
        setVh();
        window.addEventListener('resize', setVh);
        
        // B. Router Scroll Restorasyonu Fixi (Tek Scroll Alanı için)
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual'; 
        }

        return () => window.removeEventListener('resize', setVh);
    }, []); 

    // KRİTİK FİX: Next.js "Skipping auto-scroll" uyarısı için
    useEffect(() => {
        const handleHashChange = () => {
            document.documentElement.scrollTop = 0;
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []); 

    // --- PLANLA v4 (Yeniden Uygulama): Render-Blocking CSS Düzeltmesi ---
    // NProgress (Yükleme Çubuğu) yönetimi
    useEffect(() => {
        if (loading) {
            // KRİTİK FİX: NProgress'in kendi CSS'ini (paket içinden)
            // sadece 'loading' başladığında dinamik olarak yükle.
            import('nprogress/nprogress.css');
            
            NProgress.start();
        } else {
            NProgress.done();
        }
        return () => {
             NProgress.done();
        };
    }, [loading]); // Bağımlılık doğru: [loading]
    // --- PLANLA v4 Sonu ---
    
    // KRİTİK GÜNCELLEME 2: Logger Context'i Güncelleme
    useEffect(() => {
        const userId = user ? user.uid : 'Anonim';
        const newContext = {
            userId: userId,
            isAdmin: isAdmin,
        };
        logger.setContext(newContext);
        logger.info(`Auth Context Güncellendi`, newContext);
    }, [user, isAdmin]);

    // KRİTİK GÜNCELLEME 3: Yol değişimini (path change) loglamak
    useEffect(() => {
        logger.setContext({ path: pathname });
        logger.info(`Navigasyon: Yeni yol yüklendi`, { pathname });
    }, [pathname]);

    const isReady = !loading && T && Object.keys(T).length > 10;
    
    const isChatPage = pathname.startsWith('/assistant');

    if (!isReady) {
         return <SkeletonLoader />; 
    }
    
    if (isChatPage) {
        // Chat sayfası tam yükseklik almalı ve kendi içinde kaymalıdır.
        return (
            <ErrorBoundary T={T}> 
                <Header />
                {/* Header fixed olduğu için mt-16 ile içerik aşağı itilir. */}
                <main className="w-full flex-grow relative mt-16">
                    {children} 
                </main>
                {/* PLANLA v2: Dinamik bileşen kullanıldı */}
                <DynamicFooter T={T} lang={T.lang} />
                {/* PLANLA v2: Dinamik bileşen kullanıldı */}
                <DynamicCookieBanner T={T} />
            </ErrorBoundary>
        );
    }


    // KRİTİK DÜZELTME 6: Geleneksel sayfa düzeni
    return (
        <ErrorBoundary T={T}> 
            {/* KRİTİK FİX: min-h-screen kaldırıldı */}
            <div className="bg-[#111827] flex flex-col"> 
                <Header />
                
                {/* Header fixed olduğu için ana içeriği aşağı itiyoruz */}
                <main className="w-full flex-grow relative mt-16"> 
                    {children}
                </main>

                {/* PLANLA v2: Dinamik bileşen kullanıldı */}
                <DynamicFooter T={T} lang={T.lang} />
            </div>
            
            {/* PLANLA v2: Dinamik bileşen kullanıldı */}
            <DynamicCookieBanner T={T} />
        </ErrorBoundary>
    );
}

export default RootClientWrapper;

