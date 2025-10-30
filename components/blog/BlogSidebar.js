// path:components/blog/BlogSidebar.js
'use client'; 

import React, { useMemo } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc/client'; 
import SkeletonLoader from '@/components/SkeletonLoader'; 
import { getCategoryStyles } from './BlogIndexClient'; // Stil fonksiyonunu BlogIndexClient'tan çekiyoruz

// Blog Kategorileri (BlogIndexClient'tan sabit çekildi)
const ALLOWED_BLOG_CATEGORIES = ['Analiz', 'Eğitim', 'Güncelleme', 'Sistem']; 

// KRİTİK EKLENTİ: Kategoriye özel ikon haritası
const CATEGORY_ICON_MAP = {
    'Tümü': 'layers', // Tüm içerik
    'Analiz': 'line-chart', // Piyasa analizi, trendler
    'Eğitim': 'book-open', // Öğrenme materyalleri
    'Güncelleme': 'refresh-cw', // Yazılım/Sistem güncellemeleri
    'Sistem': 'cog', // Synara sistemleri, teknik konular
};

/**
 * Blog Kategorileri, Popüler Yazılar ve CTA içeren Sidebar.
 * Blog temasına (Indigo) ve Blog kategorilerine özeldir.
 */
const BlogSidebar = ({ T, activeCategoryKey, setActiveCategoryKey }) => {

    // 1. Veri Çekimi (En çok beğeni alan 5 postu bulmak için tüm postları çekiyoruz)
    const { data: allPosts, isLoading, error } = trpc.blog.getPosts.useQuery(undefined, {
        staleTime: 60000 * 5, // 5 dakikalık cache
    });

    // 2. Popüler Haberleri Hesapla (En çok beğeni alan ilk 5 Blog postu)
    const popularPosts = useMemo(() => {
        if (!allPosts) return [];
        
        return allPosts
            // Sadece Blog kategorisine ait postları filtreliyoruz.
            .filter(p => ALLOWED_BLOG_CATEGORIES.includes(p.category))
            .sort((a, b) => (b.likes || 0) - (a.likes || 0)) // Beğeniye göre azalan sıralama
            .slice(0, 5);
    }, [allPosts]);
    
    // Indigo temasına uygun stil sınıfları
    const styles = useMemo(() => getCategoryStyles(activeCategoryKey), [activeCategoryKey]);

    // KRİTİK DÜZELTME: Haberler Sidebar stilini tam taklit eden sınıflar (Border Vurgu)
    // Haberler sayfasındaki sade, border vurgulu, kutu stili
    const newActiveCls = `bg-gray-800/80 text-white border-2 border-indigo-500 shadow-lg synara-indigo-glow`;
    const newInactiveCls = `bg-gray-900/50 text-gray-400 border border-gray-700 hover:bg-gray-800/80 hover:border-indigo-500/50 hover:text-indigo-400`;
    
    // Sidebar ana konteyner stili (NewsSidebar ile tutarlı)
    const sidebarContainerCls = "bg-gray-900/70 p-6 rounded-2xl border border-gray-700/50 shadow-xl futuristic-card";

    if (isLoading) {
         // KRİTİK: Sidebar yüklenirken iskeleti ana konteyner stilinde göster
         return <SkeletonLoader className={sidebarContainerCls} count={7} height="h-10" />; 
    }
    if (error) {
         return <div className="p-4 text-red-400">Hata: Blog yazıları yüklenemedi.</div>
    }
    
    // Kategori listesi (BlogIndexClient ile aynı olmalı)
    const dynamicCategories = [
        { key: 'Tümü', label: T?.news_category_all || 'Tümü' },
        ...ALLOWED_BLOG_CATEGORIES.map(c => ({ key: c, label: c }))
    ];


    return (
        // KRİTİK DÜZELTME: Sticky top 24 yapısı korundu.
        <div className="space-y-8 h-fit lg:sticky lg:top-24">
            
            {/* 1. Kategori Sekmeleri (Sidebar) */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                // KRİTİK GÜNCELLEME: Yeni konteyner stili
                className={sidebarContainerCls}
            >
                <h3 className="text-xl font-bold text-white mb-4 border-b border-indigo-700/50 pb-3 flex items-center">
                    <Icon name="layout-grid" className="w-5 h-5 mr-3 text-indigo-400"/>
                    {T?.blog_categories_title || 'Blog Kategorileri'}
                </h3>
                
                <div className="flex flex-col space-y-3">
                    {dynamicCategories.map(category => (
                        <motion.button
                            key={category.key}
                            onClick={() => setActiveCategoryKey(category.key)}
                            className={`w-full text-left px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 border 
                                ${activeCategoryKey === category.key
                                ? newActiveCls
                                : newInactiveCls
                            }
                            flex items-center justify-between
                            `}
                             whileHover={{ scale: activeCategoryKey === category.key ? 1.0 : 1.01 }}
                             whileTap={{ scale: 0.98 }}
                        >
                            <span className="flex items-center gap-3">
                                {/* KRİTİK GÜNCELLEME: Kategoriye özel dinamik ikon eklendi. */}
                                <Icon 
                                    name={CATEGORY_ICON_MAP[category.key] || 'blocks'} // Kategoriye özel ikon kullan
                                    className={`w-5 h-5 ${activeCategoryKey === category.key ? 'text-white' : 'text-gray-500'} transition-colors`}
                                />
                                {category.label}
                            </span>
                            {activeCategoryKey === category.key && (
                                <Icon name="zap" className={`w-4 h-4 text-white animate-pulse`} />
                            )}
                        </motion.button>
                    ))}
                </div>
            </motion.div>
            
            {/* 2. Popüler Blog Yazıları */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={sidebarContainerCls} // KRİTİK GÜNCELLEME: Yeni konteyner stili
            >
                <h3 className="text-xl font-bold mb-5 text-white border-b border-indigo-700/50 pb-3 flex items-center">
                     <Icon name="trending-up" className="w-5 h-5 mr-3 text-yellow-400"/>
                    {T?.blog_popular_analysis || 'Popüler Analizler'}
                </h3>
                <div className="space-y-4">
                    {popularPosts.length === 0 ? (
                        <p className='text-sm text-gray-500 text-center p-4'>Henüz popüler bir analiz bulunmamaktadır. (En az 1 beğeni gerekiyor.)</p>
                    ) : (
                        popularPosts.map((item, i) => (
                            <Link 
                                key={item.id} 
                                href={`/blog/${item.slug}`} 
                                // KRİTİK GÜNCELLEME: Popüler linklere modern hover stili
                                className="flex items-start space-x-3 group cursor-pointer bg-gray-900/50 hover:bg-gray-700/60 p-2 -m-2 rounded-lg transition-colors border border-transparent hover:border-gray-600/50"
                            >
                                {/* Sıra Numarası (Sadeleştirildi) */}
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full bg-indigo-700/50 flex items-center justify-center text-xs font-semibold border border-indigo-500/50 text-indigo-300 shadow-md`}>
                                    {i + 1}
                                </div>
                                
                                {/* Başlık ve Kategori */}
                                <div>
                                    <p className="text-sm font-medium group-hover:text-white transition-colors">
                                        {item.title}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {/* Kategori ve beğeni sayısı sadeleştirildi */}
                                        <span className="font-semibold">{item.category}</span> - {item.likes} beğeni
                                    </p>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
                {/* CTA / Reklam Alanı (Blog teması) */}
                <div className="mt-8 p-4 bg-indigo-900/30 rounded-lg text-center border border-indigo-700/50 shadow-inner">
                    <p className="text-indigo-400 text-sm font-bold mb-1">
                         {T?.pricing_cta_title || 'Engine\'i Anında Kullanmaya Başlayın'}
                    </p>
                    <Link href="/register" className="text-xs font-semibold text-white bg-indigo-600 px-3 py-1 rounded-full hover:bg-indigo-500 transition-colors inline-flex items-center gap-1">
                        <Icon name="plus" className="w-4 h-4"/>
                        {T?.pricing_cta_button || 'Hemen Abone Ol'}
                    </Link>
                </div>
            </motion.div>
            
        </div>
    );
};

export default BlogSidebar;
