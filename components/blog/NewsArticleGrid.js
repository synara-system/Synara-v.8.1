'use client'; 

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import DynamicImage from '@/components/DynamicImage'; // DynamicImage kullanılıyor
import Icon from '@/components/Icon';
import { trpc } from '@/lib/trpc/client';
import { useAuth } from '@/context/AuthContext';
// KRİTİK FİX: motion ve AnimatePresence kaldırıldı, flickering'i engeller
import { motion, AnimatePresence } from 'framer-motion'; // v1.0.3 - Sayfalama için geri eklendi
import SkeletonLoader from '@/components/SkeletonLoader'; 
import { marked } from 'marked'; 
import { getPostMediaUrl } from '@/lib/blog-client-utils'; // KRİTİK FİX: Yeni ortak dosyadan çekildi


// --- v1.0.3 SAYFALAMA KONTROL BİLEŞENİ ---
const PaginationControls = ({ currentPage, totalPageCount, onPageChange, postsPerPage, onPostsPerPageChange, T }) => {
    
    // Sayfa numaralarını oluştur (örn: [1, '...', 4, 5, 6, '...', 10])
    const pageNumbers = useMemo(() => {
        const pages = [];
        const maxPagesToShow = 5; // Gösterilecek maksimum sayfa sayısı (ortada)
        
        if (totalPageCount <= maxPagesToShow + 2) { // 7 veya daha az sayfa varsa hepsini göster
            for (let i = 1; i <= totalPageCount; i++) {
                pages.push(i);
            }
        } else {
            // 1. Her zaman ilk sayfayı ekle
            pages.push(1);

            // 2. Başlangıç '...'
            if (currentPage > maxPagesToShow - 1) {
                pages.push('...');
            }

            // 3. Ortadaki sayfalar
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPageCount - 1, currentPage + 1);

            if (currentPage <= maxPagesToShow - 2) {
                end = maxPagesToShow - 1;
            }
            if (currentPage >= totalPageCount - (maxPagesToShow - 2)) {
                start = totalPageCount - (maxPagesToShow - 2);
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            // 4. Bitiş '...'
            if (currentPage < totalPageCount - (maxPagesToShow - 2)) {
                pages.push('...');
            }

            // 5. Her zaman son sayfayı ekle
            pages.push(totalPageCount);
        }
        return pages;
    }, [currentPage, totalPageCount]);

    if (totalPageCount <= 1 && postsPerPage === 0) { // postsPerPage === 0 'Tümü' anlamına gelir
        return null; // Eğer 1 sayfa veya daha azı varsa (veya Tümü seçiliyse) hiçbir şey gösterme
    }

    return (
        <div className="flex flex-col md:flex-row items-center justify-between mt-12 pt-6 border-t border-gray-700">
            {/* Sayfa Başına Gösterim Ayarı */}
            <div className="flex items-center space-x-2 text-sm text-gray-400 mb-4 md:mb-0">
                <label htmlFor="postsPerPage" className="font-semibold">Gösterim:</label>
                <select 
                    id="postsPerPage"
                    value={postsPerPage === 0 ? 'all' : postsPerPage} // 'Tümü' için '0' kullanıyoruz
                    onChange={(e) => onPostsPerPageChange(e.target.value === 'all' ? 0 : Number(e.target.value))}
                    className="bg-gray-800 text-white border border-gray-700 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                    <option value={12}>12 Haber</option>
                    <option value={24}>24 Haber</option>
                    <option value={48}>48 Haber</option>
                    <option value="all">Tümü (Tümünü Yükle)</option>
                </select>
            </div>

            {/* Sayfalama Kontrolleri (Sadece 'Tümü' seçili değilse göster) */}
            {postsPerPage > 0 && totalPageCount > 1 && (
                <div className="flex items-center space-x-2">
                    {/* Önceki Butonu */}
                    <button
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Önceki Sayfa"
                    >
                        <Icon name="chevron-left" className="w-5 h-5" />
                    </button>

                    {/* Sayfa Numaraları */}
                    {pageNumbers.map((num, index) => (
                        <button
                            key={index}
                            onClick={() => (typeof num === 'number' ? onPageChange(num) : null)}
                            disabled={typeof num !== 'number'}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                                currentPage === num 
                                ? 'bg-indigo-600 text-white' 
                                : (typeof num === 'number' ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-transparent text-gray-500 cursor-default')
                            }`}
                        >
                            {num}
                        </button>
                    ))}

                    {/* Sonraki Butonu */}
                    <button
                        onClick={() => onPageChange(Math.min(totalPageCount, currentPage + 1))}
                        disabled={currentPage === totalPageCount}
                        className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Sonraki Sayfa"
                    >
                        <Icon name="chevron-right" className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
};
// --- v1.0.3 SAYFALAMA BİLEŞENİ SONU ---


// --- Yardımcı Fonksiyonlar (Aynı Kalır) ---
const cleanExcerpt = (html, maxLength = 150) => {
    if (!html) return '';
    const text = html.replace(/<[^>]+>/g, '');
    const trimmedText = text.trim();
    if (trimmedText.length > maxLength) {
        return trimmedText.substring(0, maxLength).trim() + '...';
    }
    return trimmedText;
};

// KRİTİK FİX: activeCategoryKey'den (Haberler/page.js) gelen anahtarların
// veritabanındaki olası karşılıklarını eşleyen harita.
// Kategori tuşları (soldaki) buradaki anahtarlardır.
export const CATEGORY_MAP = { // KRİTİK EXPORT
    'Tümü': {
        dbKeys: ['Haberler', 'Kripto', 'Makroekonomi', 'Altın', 'Döviz', 'Borsa'], // Sadece Haberler sayfasında gösterilecek kategoriler.
        pageColor: 'indigo',
        imagePlaceholder: 'Synara Genel Haber Protokolü',
    },
    'Kripto': {
        dbKeys: ['Kripto'],
        pageColor: 'orange', // Kripto teması
        imagePlaceholder: 'Kripto Piyasa Zekası',
    },
    'Makroekonomi': {
        dbKeys: ['Makroekonomi'],
        pageColor: 'sky', // Makro teması
        imagePlaceholder: 'Makroekonomik Veri Analizi',
    },
    'Altın': {
        dbKeys: ['Altın'],
        pageColor: 'yellow', // Altın teması
        imagePlaceholder: 'Altın Piyasa Analizi',
    },
    'Döviz': {
        dbKeys: ['Döviz'],
        pageColor: 'green', // Döviz teması
        imagePlaceholder: 'Döviz Kuru Matrisi',
    },
    'Borsa': {
        dbKeys: ['Borsa'],
        pageColor: 'red', // Borsa teması
        imagePlaceholder: 'Borsa Sinyal Protokolü',
    },
};

// KRİTİK EXPORT
export const getCategoryStyles = (categoryKey) => { 
    // Haritada kategori anahtarı varsa onu kullan
    if (CATEGORY_MAP[categoryKey]) {
        return CATEGORY_MAP[categoryKey];
    }
    // Eşleşme yoksa (veya Tümü dışındaki bir varsayılan aranıyorsa) Tümü'nü (indigo) döndür
    return CATEGORY_MAP['Tümü'] || {
        dbKeys: [],
        pageColor: 'indigo',
        imagePlaceholder: 'Hata/Varsayılan Protokol',
    };
};

// Tailwind'in atmasını engellemek için başlık rengini statik haritadan al
const getTitleHoverColor = (color) => {
    const colorMap = {
        'red': 'group-hover:text-red-400',
        'orange': 'group-hover:text-orange-400',
        'sky': 'group-hover:text-sky-400',
        'yellow': 'group-hover:text-yellow-400',
        'green': 'group-hover:text-green-400',
        'indigo': 'group-hover:text-indigo-400',
    };
    // KRİTİK FİX: Varsayılan rengi red yerine indigo yap
    return colorMap[color] || 'group-hover:text-indigo-400';
};

// Tailwind'in atmasını engellemek için glow sınıfını statik haritadan al
const getSafeTailwindClasses = (color) => {
    const colorMap = {
        'red': 'synara-red-glow',
        'orange': 'synara-orange-glow',
        'sky': 'synara-sky-glow',
        'yellow': 'synara-yellow-glow',
        'green': 'synara-green-glow',
        'indigo': 'synara-indigo-glow',
    };
    // KRİTİK FİX: Varsayılan rengi red yerine indigo yap
    const glowClass = colorMap[color] || 'synara-indigo-glow';
    
    // Güvenli border renkleri
    const borderColorMap = {
        // border-2 kullanıldığı için yoğunluklar daha koyu seçildi
        'red': 'border-red-700/70', 'orange': 'border-orange-700/70', 'sky': 'border-sky-700/70', 
        'yellow': 'border-yellow-700/70', 'green': 'border-green-700/70', 'indigo': 'border-indigo-700/70'
    };
    const hoverBorderColorMap = {
        'red': 'hover:border-red-500/70', 'orange': 'hover:border-orange-500/70', 'sky': 'hover:border-sky-500/70',
        'yellow': 'hover:border-yellow-500/70', 'green': 'hover:border-green-500/70', 'indigo': 'hover:border-indigo-500/70'
    };

    // KRİTİK FİX: Varsayılan rengi red yerine indigo yap
    const borderColor = borderColorMap[color] || 'border-indigo-700/70';
    const hoverBorderClass = hoverBorderColorMap[color] || 'hover:border-indigo-500/70';

    // KRİTİK FİX: Asimetrik Çerçeve ve Fütüristik Köşeler Eklendi (KORUNDU)
    // border-2 yerine: border-t border-b border-l-4 border-r-4 (Asimetri)
    // rounded-2xl yerine: rounded-tl-xl rounded-br-xl rounded-bl-3xl rounded-tr-3xl (Özel Köşeler)
    // KRİTİK GÖRSEL DÜZELTME: hover:-translate-y-1 transformu eklendi
    return `block h-full cursor-pointer ${glowClass} bg-gray-900/60 border-t border-b border-l-4 border-r-4 ${borderColor} rounded-tl-xl rounded-br-xl rounded-bl-3xl rounded-tr-3xl transition-all duration-300 transform group hover:-translate-y-1 ${hoverBorderClass}`;
};

// KRİTİK FİX 1: T prop'u NewsCard'a eklendi
function NewsCard({ post, index, T, activeCategoryKey }) { 
    if (!post || (!post.id && !post.slug)) {
        return null; 
    }
    
    // v1.0.3 - Sayfalama eklendiği için isPriority artık 'index'e değil, 'currentPage'e bağlı olmalı.
    // Ancak index (0-11 arası) hala LCP için geçerli, bu yüzden 'isPriority' mantığı korunur.
    const isPriority = index < 4;
    
    // KRİTİK FİX: post.category veya varsayılan Tümü'nün stilini al
    const postCategoryStyles = getCategoryStyles(post.category) || getCategoryStyles('Tümü'); 
    
    const pageColor = postCategoryStyles.pageColor;
    const imagePlaceholder = postCategoryStyles.imagePlaceholder;

    const cardClass = getSafeTailwindClasses(pageColor);
    const titleHoverClass = getTitleHoverColor(pageColor);
    
    // Kategori etiketi için arka plan rengi sınıfı (Güvenli sınıf üretimi)
    const categoryBgMap = {
        'red': 'bg-red-600/50 text-red-100 border-red-500/50', 'orange': 'bg-orange-600/50 text-orange-100 border-orange-500/50',
        'sky': 'bg-sky-600/50 text-sky-100 border-sky-500/50', 'yellow': 'bg-yellow-600/50 text-yellow-100 border-yellow-500/50',
        'green': 'bg-green-600/50 text-green-100 border-green-500/50', 'indigo': 'bg-indigo-600/50 text-indigo-100 border-indigo-500/50'
    };
    // KRİTİK FİX: Varsayılan rengi red yerine indigo yap
    const categoryBgClass = categoryBgMap[pageColor] || 'bg-indigo-600/50 text-indigo-100 border-indigo-500/50';

    // KRİTİK FİX 2: readMoreText T prop'undan içeride hesaplandı
    const readMoreText = T?.blog_read_more || 'Detaylı Oku';

    return (
        // v1.0.3 - Animasyon için motion.div eklendi
        <motion.div
            variants={{ 
                hidden: { opacity: 0, y: 20 }, 
                visible: { opacity: 1, y: 0 } 
            }}
            className="h-full"
        >
            <Link href={`/blog/${post.slug}`} className={cardClass}>
                {/* Kart Container: Flex column yapısı */}
                <div className="flex flex-col h-full group p-4">
                    
                    {/* GÖRSEL ALANI - DynamicImage */}
                    <div className={`relative w-full aspect-video overflow-hidden rounded-xl mb-4 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-gray-700/10`}>
                        <DynamicImage
                            src={getPostMediaUrl(post)} // post objesinin tamamı gönderildi
                            alt={post.title}
                            placeholderText={imagePlaceholder}
                            priority={isPriority}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03] group-hover:brightness-105"
                        />
                    </div>
                    
                    {/* İçerik */}
                    <div className="flex flex-col flex-grow">
                        {/* Üst Bilgiler */}
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                            <span className={`px-2 py-1 rounded-full text-sm font-semibold border shadow-md transition-colors ${categoryBgClass}`}>
                                {post.category}
                            </span>
                            <span className='font-mono'>{new Date(post.createdAt).toLocaleDateString('tr-TR')}</span>
                        </div>

                        {/* Başlık (Dinamik Renk Sınıfı Eklendi) */}
                        <h2 className={`text-lg font-bold text-white ${titleHoverClass} transition-colors line-clamp-2 mb-2 flex-grow`}>
                            {post.title}
                        </h2>
                        
                        {/* Özet */}
                        <p className="text-sm text-gray-400 line-clamp-3 mb-4">
                            {cleanExcerpt(post.content || '', 150)}
                        </p>

                        {/* Footer (YENİ GÖRSEL DÜZELTME) */}
                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-800/50 text-xs text-gray-500">
                            
                            {/* Soldaki Metrikler */}
                            <div className='flex items-center space-x-3'>
                                <span className="flex items-center gap-1">
                                    <Icon name="heart" className="w-4 h-4 text-red-500" />
                                    {post.likes || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Icon name="message-square" className="w-4 h-4 text-sky-400" />
                                    {post.commentCount || 0}
                                </span>
                            </div>

                            {/* Devamını Oku Butonu */}
                            <span className={`font-bold text-sm flex items-center transition-colors text-${pageColor}-400 group-hover:text-white`}>
                                {readMoreText} 
                                {/* KRİTİK GÖRSEL DÜZELTME: Ok ikonu */}
                                <Icon name="arrow-right" className={`w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1 text-${pageColor}-400 group-hover:text-white`} />
                            </span>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

const MemoizedNewsCard = React.memo(NewsCard);


function NewsArticleGrid({ T, activeCategoryKey }) {
    const [lastSuccessfulPosts, setLastSuccessfulPosts] = useState([]); // KRİTİK FİX 1: Stabil veri için state

    // v1.0.3 - SAYFALAMA STATE'LERİ
    const [currentPage, setCurrentPage] = useState(1);
    const [postsPerPage, setPostsPerPage] = useState(12); // Varsayılan 12 (3'lü grid)

    // Haberleri çek
    const { data: rawPosts, isLoading, error, isSuccess } = trpc.blog.getPosts.useQuery(undefined, {
        staleTime: 60000 * 5, // 5 dakikalık cache
    });
    
    // KRİTİK FİX 2: Başarılı veri geldiğinde state'i güncelle
    useEffect(() => {
        if (isSuccess && rawPosts) {
            setLastSuccessfulPosts(rawPosts);
        }
    }, [isSuccess, rawPosts]);

    // v1.0.3 - Kategori veya Gösterim ayarı değiştiğinde 1. sayfaya dön
    useEffect(() => {
        setCurrentPage(1);
    }, [activeCategoryKey, postsPerPage]);


    // v1.0.3 - FİLTRELENMİŞ VE SIRALANMIŞ *TÜM* YAZILAR
    // Bu 'useMemo' artık sayfalama yapmaz, sadece tam listeyi hazırlar.
    const allFilteredPosts = useMemo(() => {
        const basePosts = lastSuccessfulPosts || []; // KRİTİK FİX 3: Stabil veriyi kullan
        
        let categorizedPosts = [];

        // Eğer Tümü seçiliyse, tüm Haberler kategorilerini içeren postları döndür
        if (activeCategoryKey === 'Tümü' || !activeCategoryKey) {
            const newsPageCategories = CATEGORY_MAP['Tümü'].dbKeys;
            
            // Postun kategorisi, haberler sayfasında görünmesi gereken kategorilerden biri mi?
            categorizedPosts = basePosts.filter(p => p.category && newsPageCategories.includes(p.category));
        } else {
            // Seçili kategoriye ait veritabanı anahtarlarını al
            const categoryMapping = getCategoryStyles(activeCategoryKey);

            if (!categoryMapping || !categoryMapping.dbKeys || categoryMapping.dbKeys.length === 0) {
                console.warn(`WARN: Cannot filter, missing dbKeys for category: ${activeCategoryKey}`);
                categorizedPosts = [];
            } else {
                const targetCategories = categoryMapping.dbKeys;
                // Filtreleme: post.category, targetCategories listesinin içinde mi?
                categorizedPosts = basePosts.filter(p => p.category && targetCategories.includes(p.category));
            }
        }

        // v1.0.2 - KÖK NEDEN DÜZELTMESİ (Sıralama)
        return [...categorizedPosts].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA; // b - a = Azalan (desc) sıra
        });

    }, [lastSuccessfulPosts, activeCategoryKey]); // KRİTİK FİX 4: Bağımlılıkları güncelle
    
    // v1.0.3 - SAYFALAMA MANTIĞI
    const { paginatedPosts, totalPageCount } = useMemo(() => {
        // 1. Sayfa başına 'Tümü' seçildiyse (postsPerPage === 0)
        if (postsPerPage === 0) {
            return {
                paginatedPosts: allFilteredPosts, // Tümü
                totalPageCount: 1,
            };
        }

        // 2. Sayfalama hesaplamaları
        const totalPosts = allFilteredPosts.length;
        const totalPages = Math.ceil(totalPosts / postsPerPage);
        
        // 3. Mevcut sayfa için yazıları dilimle (.slice())
        const startIndex = (currentPage - 1) * postsPerPage;
        const paginated = allFilteredPosts.slice(startIndex, startIndex + postsPerPage);
        
        return {
            paginatedPosts: paginated,
            totalPageCount: totalPages,
        };

    }, [allFilteredPosts, currentPage, postsPerPage]);
    
    
    if (isLoading && lastSuccessfulPosts.length === 0) {
        // İlk yüklemede ve veri yokken iskelet göster
        return <SkeletonLoader count={6} height="h-64" />; 
    }
    
    if (error) {
        return <div className="p-8 text-red-400">Hata: {error.message}</div>;
    }
    
    // v1.0.3 - allPosts artık paginatedPosts'u kullanır
    const allPosts = paginatedPosts;

    return (
        <div className="w-full">
            {/* v1.0.3 - AnimatePresence eklendi */}
            <AnimatePresence mode="wait">
                <motion.div 
                    key={activeCategoryKey + currentPage + postsPerPage} // Kategori VEYA sayfa değiştiğinde animasyonu tetikle
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={{ 
                        hidden: { opacity: 0 }, 
                        visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } } 
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
                > 
                    {allPosts.map((post, index) => (
                        <MemoizedNewsCard 
                            post={post} 
                            key={post.id || post.slug || index} // GÜVENLİ KEY KULLANIMI
                            index={index} 
                            T={T} // KRİTİK FİX 3: T prop'u geri gönderildi
                            activeCategoryKey={activeCategoryKey} 
                        />
                    ))}
                </motion.div>
            </AnimatePresence>
            
            {/* v1.0.3 - Hata/Boş Durum Kontrolü (Tüm filtrelenmiş listeye bakar) */}
            {allFilteredPosts.length === 0 && !isLoading && (
                 <div className="text-center p-12 bg-gray-800/50 rounded-2xl border border-dashed border-gray-700 mt-8">
                    <Icon name="bell" className="w-12 h-12 text-indigo-400 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">{T?.blog_no_posts_title || 'Bu alanda henüz yayın yok.'}</h3>
                    <p className="text-gray-400">{T?.blog_no_posts_desc || 'Filtreleme kriterlerinizi değiştirin veya yeni yayınları bekleyin.'}</p>
                 </div>
            )}

            {/* v1.0.3 - SAYFALAMA KONTROLLERİ EKLENDİ */}
            <PaginationControls
                currentPage={currentPage}
                totalPageCount={totalPageCount}
                onPageChange={(page) => setCurrentPage(page)}
                postsPerPage={postsPerPage}
                onPostsPerPageChange={(value) => setPostsPerPage(value)}
                T={T}
            />
        </div>
    );
}

export default NewsArticleGrid;