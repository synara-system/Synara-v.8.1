// path: app/haberler/page.js
'use client'; // Bu sayfa artık Client Component'tir

import React, { useState, useMemo } from 'react';
// translations import'u kaldırıldı (generateMetadata ile birlikte metadata.js'e taşındı).
// KRİTİK DÜZELTME 1: getPosts import'u kaldırıldı.
import dynamic from 'next/dynamic'; 
import SkeletonLoader from '@/components/SkeletonLoader';
// import { getPosts } from '@/lib/blog-server'; // <-- KRİTİK: Kaldırıldı
import { trpc } from '@/lib/trpc/client';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';

// KRİTİK NOT: generateMetadata ve translations import'ları app/haberler/metadata.js dosyasındadır.

// --- Dinamik Bileşenler (Kategori barı olmayanlar) ---
const MarketTicker = dynamic(() => import('@/components/blog/MarketTicker'), {
    ssr: false, 
    loading: () => <div className="w-full h-12 bg-gray-900 border-b border-gray-700" />,
});

// Yeni oluşturduğumuz kategori barı olmayan haber gridi
const NewsArticleGrid = dynamic(() => import('@/components/blog/NewsArticleGrid'), { 
    ssr: false, 
    loading: () => <SkeletonLoader />, 
});

// Yeni oluşturduğumuz yan sütun bileşeni
const NewsSidebar = dynamic(() => import('@/components/blog/NewsSidebar'), { 
    ssr: false, 
    loading: () => <div className="h-[500px] w-full bg-gray-800/70 rounded-xl animate-pulse"></div>, 
});


/**
 * Haberler Ana Sayfası (Client Component)
 */
const HaberlerPage = () => {
    const { T } = useAuth();
    
    // KRİTİK: Kategori yönetimi state'e taşınıyor
    const newsCategories = useMemo(() => [
        { key: 'Tümü', label: T?.news_category_all || 'Tümü' }, 
        { key: 'Haberler', label: T?.news_category_crypto || 'Kripto Paralar' },
        { key: 'Makroekonomi', label: T?.news_category_macro || 'Makroekonomi' },
        { key: 'Altın', label: T?.news_category_gold || 'Altın' },
        { key: 'Döviz', label: T?.news_category_forex || 'Döviz Piyasaları' },
        { key: 'Borsa', label: T?.news_category_stock || 'Borsa & Hisseler' },
        { key: 'Güncelleme', label: T?.news_category_system || 'Sistem' },
    ], [T]);

    // Varsayılan aktif kategori (Tümü)
    const [activeCategoryKey, setActiveCategoryKey] = useState('Tümü');
    
    // T yüklendiğinde varsayılan kategoriyi doğru şekilde ayarla
    React.useEffect(() => {
        if (T && newsCategories.length > 0) {
            setActiveCategoryKey(newsCategories[0].key);
        }
    }, [T, newsCategories]);

    // Kategori anahtarları yüklenene kadar bekle
    if (!T || newsCategories.length === 0) {
        return <SkeletonLoader />;
    }

    return (
        <div className="min-h-screen bg-[#111827] text-white pt-0 pb-0 px-0">
             
             {/* KRİTİK EKLENTİ: Ticker Bandı */}
             <MarketTicker />
             
             {/* BAŞLIK (TRADER HABER MERKEZİ BAŞLIĞI YERİNE SADECE BAŞLIK) */}
             <section className="relative py-12 md:py-16 text-center overflow-hidden bg-gray-900 border-b border-red-700/50">
                 <div className="absolute inset-0" style={{
                    background: 'radial-gradient(ellipse at center, rgba(239, 68, 68, 0.15) 0%, rgba(17, 24, 39, 0) 70%)'
                 }}></div>
                 <div className="absolute inset-0 bg-grid-red-500/10 bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_at_center,transparent_0%,black_100%)]"></div>
                 
                 <div className="container mx-auto px-6 relative z-10">
                     <motion.h1 
                        className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-2"
                        initial={{ y: 20 }}
                        animate={{ y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {T.news_page_title || "HABER MERKEZİ"}
                    </motion.h1>
                    <motion.p 
                        className="text-lg text-gray-400 max-w-3xl mx-auto"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        {T.news_page_subtitle || "Synara'nın bütünsel zeka matrisi, piyasayı anlık analiz ederek en kritik gelişmeleri sunar."}
                    </motion.p>
                 </div>
             </section>
             
             
             {/* KRİTİK GÜNCELLEME: 12 KOLONLU ANA İÇERİK GRİDİ */}
             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* 1. Sütun: HABER AKIŞI (8/12 genişlik) */}
                <div className="lg:col-span-8">
                    {/* KRİTİK: NewsArticleGrid, filtreleme anahtarını dışarıdan alıyor */}
                    <NewsArticleGrid 
                        initialPosts={null} 
                        activeCategoryKey={activeCategoryKey} 
                        themeColor="red" 
                    />
                </div>
                
                {/* 2. Sütun: KATEGORİ VE POPÜLER HABERLER (4/12 genişlik) */}
                <div className="lg:col-span-4">
                    <NewsSidebar 
                        T={T}
                        newsCategories={newsCategories}
                        activeCategoryKey={activeCategoryKey}
                        setActiveCategoryKey={setActiveCategoryKey}
                    />
                </div>
            </div>
        </div>
    );
};

export default HaberlerPage;
