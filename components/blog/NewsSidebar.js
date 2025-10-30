// path:components/blog/NewsSidebar.js
'use client'; 

import React, { useMemo } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc/client'; 
import SkeletonLoader from '@/components/SkeletonLoader'; 
// KRİTİK İTHALAT: Renk eşleşme mantığı ve kategori haritası buradan alındı.
import { CATEGORY_MAP, getCategoryStyles } from '@/components/blog/NewsArticleGrid'; 

// KRİTİK GÜNCELLEME: Haber kategorilerine özel ikon haritası (Makroekonomi güncellendi)
const NEWS_ICON_MAP = {
    'Tümü': 'layout-grid',      // Grid/Genel görünüm (Korundu)
    'Kripto': 'scale',          // Denge, tartı (Korundu)
    'Makroekonomi': 'bar-chart-2', // YENİ: Veri/Ekonomi Gösterimi
    'Altın': 'dollar-sign',     // Mücevher/Değer (Korundu)
    'Döviz': 'credit-card',     // Ödeme/Transfer (Korundu)
    'Borsa': 'trending-up',     // Trend/Büyüme (Korundu)
};

// Helper: Tailwind'in atmasını engellemek için dinamik renk sınıflarını güvenli harita ile döndür
const getSafeButtonClasses = (color, isActive) => {
    // Tüm olası sınıfları statik olarak burada tanımlıyoruz.
    const colorMap = {
        'red': {
            border: isActive ? 'border-red-500/70' : 'border-gray-700/50',
            text: isActive ? 'text-red-400' : 'text-gray-400',
            glow: isActive ? 'synara-red-glow' : '',
            bgHover: 'hover:bg-red-900/40',
        },
        'orange': {
            border: isActive ? 'border-orange-500/70' : 'border-gray-700/50',
            text: isActive ? 'text-orange-400' : 'text-gray-400',
            glow: isActive ? 'synara-orange-glow' : '',
            bgHover: 'hover:bg-orange-900/40',
        },
        'sky': {
            border: isActive ? 'border-sky-500/70' : 'border-gray-700/50',
            text: isActive ? 'text-sky-400' : 'text-gray-400',
            glow: isActive ? 'synara-sky-glow' : '',
            bgHover: 'hover:bg-sky-900/40',
        },
        'yellow': {
            border: isActive ? 'border-yellow-500/70' : 'border-gray-700/50',
            text: isActive ? 'text-yellow-400' : 'text-gray-400',
            glow: isActive ? 'synara-yellow-glow' : '',
            bgHover: 'hover:bg-yellow-900/40',
        },
        'green': {
            border: isActive ? 'border-green-500/70' : 'border-gray-700/50',
            text: isActive ? 'text-green-400' : 'text-gray-400',
            glow: isActive ? 'synara-green-glow' : '',
            bgHover: 'hover:bg-green-900/40',
        },
        'indigo': {
            border: isActive ? 'border-indigo-500/70' : 'border-gray-700/50',
            text: isActive ? 'text-indigo-400' : 'text-gray-400',
            glow: isActive ? 'synara-indigo-glow' : '',
            bgHover: 'hover:bg-indigo-900/40',
        }
    };

    // Renk bulunamazsa varsayılanı kullan (red)
    return colorMap[color] || colorMap['red'];
};


// KRİTİK: Bu bileşen dışarıdan activeCategoryKey ve setActiveCategoryKey alır.
const NewsSidebar = ({ T, newsCategories, activeCategoryKey, setActiveCategoryKey }) => {

    // 1. Veri Çekimi (En çok beğeni alan 5 postu bulmak için tüm postları çekiyoruz)
    const { data: allPosts, isLoading, error } = trpc.blog.getPosts.useQuery(undefined, {
        staleTime: 60000 * 5, // 5 dakikalık cache
    });

    // 2. Popüler Haberleri Hesapla (En çok beğeni alan ilk 5 post)
    const popularPosts = useMemo(() => {
        if (!allPosts) return [];
        
        // KRİTİK FİX: newsCategoriesFilter'ı CATEGORY_MAP'ten güvenli bir şekilde al.
        const safeCategoryMap = CATEGORY_MAP || {};
        // Tüm kategorileri (haberler ve blog) popüler listesine dahil et
        const newsCategoriesFilter = safeCategoryMap['Tümü']?.dbKeys || ['Haberler', 'Kripto', 'Makroekonomi', 'Altın', 'Döviz', 'Borsa', 'Analiz', 'Eğitim', 'Güncelleme', 'Sistem']; // Hardcoded fallback

        
        return allPosts
            // Filtreleme yaparken, postun category alanının newsCategoriesFilter'daki herhangi bir değeri içermesini sağlıyoruz.
            .filter(post => newsCategoriesFilter.includes(post.category))
            // Beğeni sayısına göre sıralama
            .sort((a, b) => (b.likes || 0) - (a.likes || 0))
            // İlk 5'i al
            .slice(0, 5);
    }, [allPosts]); // allPosts değiştiğinde yeniden hesapla

    const variants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };
    
    // YENİ EK: Tümü (All) butonu için kategorileri birleştiriyoruz.
    const categoryKeys = useMemo(() => {
        const allKey = T?.news_category_all || 'Tümü';
        
        // KRİTİK HATA FİX 1: CATEGORY_MAP'in yüklenip yüklenmediğini kontrol et. 
        const safeCategoryMap = CATEGORY_MAP || {};

        // KRİTİK HATA FİX 2: Object.keys listesinden 'Tümü' (allKey) anahtarını çıkar. 
        // Blog'a ait kategorileri (Analiz, Eğitim, Güncelleme, Sistem) de çıkar.
        const filteredKeys = Object.keys(safeCategoryMap).filter(key => 
            key !== 'Analiz' && 
            key !== 'Eğitim' &&
            key !== 'Güncelleme' &&
            key !== 'Sistem' &&
            key !== allKey 
        );

        return [allKey, ...filteredKeys];
    }, [T]);

    // Helper: Dinamik Tailwind sınıflarını güvenli bir şekilde oluşturur
    const getSafeDynamicClasses = (color) => {
        // Tailwind'in atmasını engellemek için tüm sınıfları haritala
        const dynamicMap = {
            'red': {
                bgNumber: 'bg-red-600/50', border: 'border-red-500/50', hoverText: 'group-hover:text-red-400', categoryText: 'text-red-400'
            },
            'orange': {
                bgNumber: 'bg-orange-600/50', border: 'border-orange-500/50', hoverText: 'group-hover:text-orange-400', categoryText: 'text-orange-400'
            },
            'sky': {
                bgNumber: 'bg-sky-600/50', border: 'border-sky-500/50', hoverText: 'group-hover:text-sky-400', categoryText: 'text-sky-400'
            },
            'yellow': {
                bgNumber: 'bg-yellow-600/50', border: 'border-yellow-500/50', hoverText: 'group-hover:text-yellow-400', categoryText: 'text-yellow-400'
            },
            'green': {
                bgNumber: 'bg-green-600/50', border: 'border-green-500/50', hoverText: 'group-hover:text-green-400', categoryText: 'text-green-400'
            },
            'indigo': {
                bgNumber: 'bg-indigo-600/50', border: 'border-indigo-500/50', hoverText: 'group-hover:text-indigo-400', categoryText: 'text-indigo-400'
            },
        };
        return dynamicMap[color] || dynamicMap['red'];
    };


    return (
        <div className="lg:sticky lg:top-24 w-full lg:w-72 mt-8 lg:mt-0 space-y-8">
            
            {/* 1. KATEGORİ FİLTRELEME PANELİ (GÖRSEL ŞÖLEN) */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={variants}
                className="bg-gray-900/70 p-6 rounded-2xl border border-gray-700/50 shadow-xl"
            >
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-400">
                    <Icon name="layout-grid" className="w-5 h-5"/>
                    {T?.sidebar_categories_title || 'Kategori Protokolü'}
                </h3>
                
                {/* KRİTİK: FÜTÜRİSTİK KATEGORİ LİSTESİ */}
                <div className="space-y-3">
                    {categoryKeys.map((key) => {
                        // Kategori stilini belirle (Örneğin 'orange' veya 'red')
                        const styles = getCategoryStyles(key);
                        const isActive = activeCategoryKey === key;
                        const allKey = T?.news_category_all || 'Tümü';
                        
                        // Tüm kategorisinin rengini indigo yap (kurumsal renk)
                        const finalColor = key === allKey ? 'indigo' : styles.pageColor;
                        const finalClasses = getSafeButtonClasses(finalColor, isActive);
                        
                        // KRİTİK DEĞİŞİKLİK: Dinamik ikon adını çek
                        const iconName = NEWS_ICON_MAP[key] || 'blocks';


                        return (
                            <button
                                key={key}
                                onClick={() => setActiveCategoryKey(key)}
                                className={`w-full text-left py-3 px-4 rounded-xl transition-all duration-300 transform border text-sm font-semibold 
                                    ${isActive 
                                        ? `bg-${finalColor}-900/50 border-2 ${finalClasses.border} ${finalClasses.text} ${finalClasses.glow} shadow-lg` 
                                        : `bg-gray-800/50 ${finalClasses.border} ${finalClasses.text} ${finalClasses.bgHover}`
                                    }
                                    flex items-center justify-between
                                `}
                            >
                                <span className="flex items-center gap-3">
                                    {/* KRİTİK GÜNCELLEME: Dinamik İkon Kullanımı */}
                                    <Icon 
                                        name={iconName} 
                                        className={`w-5 h-5 ${isActive ? `text-${finalColor}-400` : 'text-gray-500'} transition-colors`}
                                    />
                                    {key}
                                </span>
                                {isActive && (
                                    <Icon name="zap" className={`w-4 h-4 ${finalClasses.text} animate-pulse`} />
                                )}
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            {/* 2. POPÜLER HABERLER (DİNAMİK RENKLENDİRME) */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={variants}
                transition={{ delay: 0.2 }}
                className="bg-gray-900/70 p-6 rounded-2xl border border-gray-700/50 shadow-xl"
            >
                <h3 className="text-xl font-bold mb-5 flex items-center gap-2 text-yellow-400">
                    <Icon name="trending-up" className="w-5 h-5"/>
                    {T?.sidebar_popular_posts_title || 'Yüksek Frekanslı Popülerler'}
                </h3>
                
                <div className="space-y-5">
                    {isLoading && <SkeletonLoader count={5} height="h-16" />}
                    {error && <p className="text-red-400 text-sm">Hata: Popüler haberler yüklenemedi.</p>}
                    
                    {!isLoading && popularPosts.length === 0 && (
                        <p className="text-gray-500 text-sm">{T?.sidebar_no_popular_posts || 'Henüz popüler haber yok.'}</p>
                    )}

                    {!isLoading && popularPosts.length > 0 && (
                        popularPosts.map((item, i) => {
                            // KRİTİK FİX: Post'un rengini al
                            const { pageColor } = getCategoryStyles(item.category);
                            const dynamicClasses = getSafeDynamicClasses(pageColor);

                            return (
                                <Link 
                                    href={`/blog/${item.slug}`} 
                                    key={item.id} 
                                    className="flex items-start space-x-3 group bg-gray-900/50 border border-gray-700/50 p-2 -m-2 rounded-lg transition-colors hover:bg-gray-700/50"
                                >
                                    {/* İkon ve Sıralama Numarası - DİNAMİKLEŞTİRİLDİ */}
                                    <div className={`flex-shrink-0 w-6 h-6 rounded-full ${dynamicClasses.bgNumber} flex items-center justify-center text-sm font-semibold ${dynamicClasses.border} text-white shadow-md`}>
                                        {i + 1}
                                    </div>
                                    
                                    {/* Başlık ve Kategori - DİNAMİKLEŞTİRİLDİ */}
                                    <div>
                                        <p className={`text-sm font-medium ${dynamicClasses.hoverText} transition-colors`}>
                                            {item.title}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            <span className={`${dynamicClasses.categoryText} font-semibold`}>{item.category}</span> - {item.likes} {T?.blog_likes || 'beğeni'}
                                        </p>
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>
                {/* Görseldeki Reklam Alanı (Placeholder) */}
                <div className="mt-8 p-4 bg-gray-900 rounded-lg text-center border border-dashed border-gray-700">
                    <p className="text-gray-400 text-sm">
                         {T?.sidebar_ad_placeholder || 'Kurumsal Reklam: Synara Data Bridge'}
                    </p>
                </div>
            </motion.div>
            
        </div>
    );
};

export default NewsSidebar;
