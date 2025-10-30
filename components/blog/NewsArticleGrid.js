// path:components/blog/NewsArticleGrid.js
'use client'; 

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import DynamicImage from '@/components/DynamicImage'; // DynamicImage kullanılıyor
import Icon from '@/components/Icon';
import { trpc } from '@/lib/trpc/client';
import { useAuth } from '@/context/AuthContext';
// KRİTİK FİX: motion ve AnimatePresence kaldırıldı, flickering'i engeller
// import { motion, AnimatePresence } from 'framer-motion'; 
import SkeletonLoader from '@/components/SkeletonLoader'; 
import { marked } from 'marked'; 
import { getPostMediaUrl } from '@/lib/blog-client-utils'; // KRİTİK FİX: Yeni ortak dosyadan çekildi

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
    
    const isPriority = index < 4;
    // KRİTİK FİX: post.category veya varsayılan Tümü'nün stilini al
    const postCategoryStyles = getCategoryStyles(post.category) || getCategoryStyles('Tümü'); 
    
    const pageColor = postCategoryStyles.pageColor;
    const imagePlaceholder = postCategoryStyles.imagePlaceholder;

    // Dinamik iç görsel çerçeve renk haritası (Kaldırıldığı için artık kullanılmayacak, ancak mantık temizliği için yorum satırında bırakıldı)
    // const imageBorderMap = {
    //     'red': 'border-red-600/50 hover:border-red-400/70', 
    //     'orange': 'border-orange-600/50 hover:border-orange-400/70',
    //     'sky': 'border-sky-600/50 hover:border-sky-400/70', 
    //     'yellow': 'border-yellow-600/50 hover:border-yellow-400/70',
    //     'green': 'border-green-600/50 hover:border-green-400/70', 
    //     'indigo': 'border-indigo-600/50 hover:border-indigo-400/70',
    // };
    
    // KRİTİK FİX 4: Görsel alanı için dinamik çerçeve sınıfı (Kaldırıldı)
    // const imageBorderClass = imageBorderMap[pageColor] || 'border-indigo-600/50 hover:border-indigo-400/70';

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
        // KRİTİK FİX: Ana sarmalayıcı Link olarak geri getirildi ve cardClass uygulandı
        <Link href={`/blog/${post.slug}`} className={cardClass}>
             {/* Kart Container: Flex column yapısı */}
            <div className="flex flex-col h-full group p-4">
                
                {/* GÖRSEL ALANI - DynamicImage */}
                {/* KRİTİK DEĞİŞİKLİK: border-2 ve imageBorderClass tamamen KALDIRILDI. */}
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
    );
}

const MemoizedNewsCard = React.memo(NewsCard);


function NewsArticleGrid({ T, activeCategoryKey }) {
    const [lastSuccessfulPosts, setLastSuccessfulPosts] = useState([]); // KRİTİK FİX 1: Stabil veri için state

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


    // Kategoriye göre filtrele
    const filteredPosts = useMemo(() => {
        const basePosts = lastSuccessfulPosts || []; // KRİTİK FİX 3: Stabil veriyi kullan
        
        // Eğer Tümü seçiliyse, tüm Haberler kategorilerini içeren postları döndür
        if (activeCategoryKey === 'Tümü' || !activeCategoryKey) {
            const newsPageCategories = CATEGORY_MAP['Tümü'].dbKeys;
            
            // Postun kategorisi, haberler sayfasında görünmesi gereken kategorilerden biri mi?
            return basePosts.filter(p => p.category && newsPageCategories.includes(p.category));
        }

        // Seçili kategoriye ait veritabanı anahtarlarını al
        const categoryMapping = getCategoryStyles(activeCategoryKey);

        if (!categoryMapping || !categoryMapping.dbKeys || categoryMapping.dbKeys.length === 0) {
            console.warn(`WARN: Cannot filter, missing dbKeys for category: ${activeCategoryKey}`);
            return [];
        }

        const targetCategories = categoryMapping.dbKeys;

        // Filtreleme: post.category, targetCategories listesinin içinde mi?
        return basePosts.filter(p => p.category && targetCategories.includes(p.category));

    }, [lastSuccessfulPosts, activeCategoryKey]); // KRİTİK FİX 4: Bağımlılıkları güncelle
    
    
    if (isLoading && lastSuccessfulPosts.length === 0) {
        // İlk yüklemede ve veri yokken iskelet göster
        return <SkeletonLoader count={6} height="h-64" />; 
    }
    
    if (error) {
        return <div className="p-8 text-red-400">Hata: {error.message}</div>;
    }
    
    const allPosts = filteredPosts;

    return (
        <div className="w-full">
            {/* KRİTİK FİX 5: DOM sıfırlama (Key prop'u ile DOM sıfırlandı) */}
            <div key={activeCategoryKey} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"> 
                {allPosts.map((post, index) => (
                    <MemoizedNewsCard 
                        post={post} 
                        key={post.id || post.slug || index} // GÜVENLİ KEY KULLANIMI
                        index={index} 
                        T={T} // KRİTİK FİX 3: T prop'u geri gönderildi
                        activeCategoryKey={activeCategoryKey} 
                    />
                ))}
            </div>
            
            {/* KRİTİK KONTROL: Veri geldi, filtreden sonra post kalmadıysa bilgilendirme göster */}
            {filteredPosts.length === 0 && !isLoading && (
                 <div className="text-center p-12 bg-gray-800/50 rounded-2xl border border-dashed border-gray-700 mt-8">
                    <Icon name="bell" className="w-12 h-12 text-indigo-400 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">{T?.blog_no_posts_title || 'Bu alanda henüz yayın yok.'}</h3>
                    <p className="text-gray-400">{T?.blog_no_posts_desc || 'Filtreleme kriterlerinizi değiştirin veya yeni yayınları bekleyin.'}</p>
                 </div>
            )}
        </div>
    );
}

export default NewsArticleGrid;
