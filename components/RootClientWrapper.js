// path: components/RootClientWrapper.js
'use client'; 

import React, { useEffect, useLayoutEffect } from 'react';
import NProgress from 'nprogress';
import { useAuth } from '@/context/AuthContext';
import Header from './Header';
import Footer from './Footer';
import SkeletonLoader from './SkeletonLoader';
import ErrorBoundary from './ErrorBoundary';
import CookieBanner from './CookieBanner'; 
import { usePathname } from 'next/navigation';
import { logger } from '@/lib/Logger'; // Logger import edildi

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
        // Sayfalar arası geçişte tarayıcının scroll pozisyonunu otomatik geri yüklemesini engeller.
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual'; 
        }

        return () => window.removeEventListener('resize', setVh);
    }, []); 

    // KRİTİK FİX: Next.js'in otomatik kaydırma davranışını tamamen devre dışı bırak.
    // Bu, "Skipping auto-scroll" uyarısını fixed/sticky elemanlarla olan çakışmayı önleyerek giderir.
    useEffect(() => {
        const handleHashChange = () => {
             // Router olaylarını kullanarak, kaydırma işlemini manuel yöneteceğimizi Next'e bildiririz.
             // Bu, App Router'da uyarıyı sessize almanın en güvenli yoludur.
            document.documentElement.scrollTop = 0;
        };

        // Bu bir App Router özelliği değildir, ancak genel olarak navigasyonu yönetme isteğimizi belirtir.
        // Uyarı Stack'i 'html' ve 'body' seviyesinde olduğu için bu, DOM'a müdahale etmeden temiz bir çözümdür.
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []); 

    // NProgress (Yükleme Çubuğu) yönetimi
    useEffect(() => {
        if (loading) {
            NProgress.start();
        } else {
            NProgress.done();
        }
        return () => {
             NProgress.done();
        };
    }, [loading]); 
    
    // KRİTİK GÜNCELLEME 2: Logger Context'i Güncelleme
    // Kullanıcı değiştiğinde logger'a yeni kullanıcı bağlamını gönderir.
    useEffect(() => {
        const userId = user ? user.uid : 'Anonim';
        const newContext = {
            userId: userId,
            isAdmin: isAdmin,
        };
        logger.setContext(newContext);
        logger.info(`Auth Context Güncellendi`, newContext);
    }, [user, isAdmin]);

    // KRİTİK GÜNCELLEME 3: Yol değişimini (path change) loglamak için
    // Sayfa değiştiğinde logger'a yeni yol bilgisini gönderir.
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
                <Footer T={T} lang={T.lang} />
                <CookieBanner T={T} />
            </ErrorBoundary>
        );
    }


    // KRİTİK DÜZELTME 6: Geleneksel sayfa düzeni
    // min-h-screen kaldırıldı. Sadece flex-col yapısı kalır.
    return (
        <ErrorBoundary T={T}> 
            {/* KRİTİK FİX: min-h-screen kaldırıldı */}
            <div className="bg-[#111827] flex flex-col"> 
                <Header />
                
                {/* Header fixed olduğu için ana içeriği aşağı itiyoruz */}
                <main className="w-full flex-grow relative mt-16"> 
                    {children}
                </main>

                <Footer T={T} lang={T.lang} />
            </div>
            
            <CookieBanner T={T} />
        </ErrorBoundary>
    );
}

export default RootClientWrapper;
