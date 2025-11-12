'use client'; 

import React, { useState, useMemo, useEffect } from 'react'; 
import Link from 'next/link';
import DynamicImage from '@/components/DynamicImage'; 
import Icon from '@/components/Icon';
import { trpc } from '@/lib/trpc/client';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion'; 
import SkeletonLoader from '@/components/SkeletonLoader'; 
import BlogSidebar from './BlogSidebar'; 
import { marked } from 'marked'; 

// --- YENİ YARDIMCI FONKSİYON: Okunma Süresi Hesaplama ---
const calculateReadingTime = (text, wordsPerMinute = 200) => {
    if (!text) return 0;
    // HTML etiketlerini kaldır
    const cleanText = text.replace(/<[^>]+>/g, '');
    const wordCount = cleanText.split(/\s+/).filter(word => word.length > 0).length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    return readingTime;
};

// --- v1.0.5 GÖRSEL İYİLEŞTİRME (POLISH) ---
const PaginationControls = ({ currentPage, totalPageCount, onPageChange, postsPerPage, onPostsPerPageChange, T }) => {
    
    const pageNumbers = useMemo(() => {
        const pages = [];
        const maxPagesToShow = 5; 
        
        if (totalPageCount <= maxPagesToShow + 2) { 
            for (let i = 1; i <= totalPageCount; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            if (currentPage > maxPagesToShow - 1) {
                pages.push('...');
            }
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
            if (currentPage < totalPageCount - (maxPagesToShow - 2)) {
                pages.push('...');
            }
            pages.push(totalPageCount);
        }
        return pages;
    }, [currentPage, totalPageCount]);

    if (totalPageCount <= 1 && postsPerPage === 0) { 
        return null; 
    }

    // v1.0.5 - Stil Değişkenleri
    const baseButtonCls = "px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200";
    const arrowButtonCls = "p-2 rounded-lg transition-all duration-200";
    
    const activeCls = "bg-indigo-600 text-white border border-indigo-500 shadow-lg shadow-indigo-900/50";
    const inactiveCls = "bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:bg-gray-700/50 hover:border-indigo-500/50";
    const arrowInactiveCls = "bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:bg-indigo-600/50 hover:text-white hover:border-indigo-500/50";
    const disabledCls = "bg-gray-800/30 text-gray-600 opacity-50 cursor-not-allowed border border-gray-800/50";
    const ellipsisCls = "bg-transparent text-gray-600 cursor-default px-2 py-2";

    return (
        <div className="flex flex-col md:flex-row items-center justify-between mt-12 pt-6 border-t border-gray-700/50">
            {/* Sayfa Başına Gösterim Ayarı (v1.0.5 İKON EKLENDİ) */}
            <div className="flex items-center space-x-2 text-sm text-gray-400 mb-4 md:mb-0">
                <Icon name="layout-grid" className="w-5 h-5 text-indigo-400" /> {/* İkon Eklendi */}
                <label htmlFor="postsPerPage" className="font-semibold text-gray-300">Gösterim:</label>
                <select 
                    id="postsPerPage"
                    value={postsPerPage === 0 ? 'all' : postsPerPage} // 'Tümü' için '0' kullanıyoruz
                    onChange={(e) => onPostsPerPageChange(e.target.value === 'all' ? 0 : Number(e.target.value))}
                    className="bg-gray-800/50 text-white border border-indigo-700/50 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 hover:bg-gray-700/70 transition-colors"
                >
                    <option value={12}>12 Yazı</option>
                    <option value={24}>24 Yazı</option>
                    <option value={48}>48 Yazı</option>
                    <option value="all">Tümü (Tümünü Yükle)</option>
                </select>
            </div>

            {/* Sayfalama Kontrolleri (Sadece 'Tümü' seçili değilse göster) */}
            {postsPerPage > 0 && totalPageCount > 1 && (
                <div className="flex items-center space-x-2">
                    {/* Önceki Butonu (v1.0.5 Stil) */}
                    <button
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`${arrowButtonCls} ${currentPage === 1 ? disabledCls : arrowInactiveCls}`}
                        aria-label="Önceki Sayfa"
                    >
                        <Icon name="chevron-left" className="w-5 h-5" />
                    </button>

                    {/* Sayfa Numaraları (v1.0.5 Stil) */}
                    {pageNumbers.map((num, index) => (
                        <button
                            key={index}
                            onClick={() => (typeof num === 'number' ? onPageChange(num) : null)}
                            disabled={typeof num !== 'number'}
                            className={`${baseButtonCls} ${
                                currentPage === num 
                                ? activeCls
                                : (typeof num === 'number' ? inactiveCls : ellipsisCls)
                            }`}
                             aria-label={typeof num === 'number' ? `Sayfa ${num}` : `Daha Fazla Sayfa`}
                        >
                            {num}
                        </button>
                    ))}

                    {/* Sonraki Butonu (v1.0.5 Stil) */}
                    <button
                        onClick={() => onPageChange(Math.min(totalPageCount, currentPage + 1))}
                        disabled={currentPage === totalPageCount}
                        className={`${arrowButtonCls} ${currentPage === totalPageCount ? disabledCls : arrowInactiveCls}`}
                        aria-label="Sonraki Sayfa"
                    >
                        <Icon name="chevron-right" className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
};
// --- v1.0.5 GÜNCELLEME SONU ---


// --- SABİT KATEGORİLER (DEFAULT) ---
const DEFAULT_THEME_COLOR = 'indigo';
const ALLOWED_BLOG_CATEGORIES = ['Analiz', 'Eğitim', 'Güncelleme', 'Sistem']; 

// v1.0.5 - KATEGORİ İKONLARI EKLENDİ
const CATEGORY_ICONS = {
    'Analiz': 'chart-bar',
    'Eğitim': 'book-open',
    'Güncelleme': 'zap',
    'Sistem': 'server',
    'Tümü': 'package', // Blog ana sayfası için varsayılan ikon
};

// KRİTİK FİKS: HTML etiketlerini temizleyen ve özeti kısaltan fonksiyon
const cleanExcerpt = (html, maxLength = 150) => {
    if (!html) return '';
    // 1. Strip HTML tags (tüm etiketler dahil)
    const text = html.replace(/<[^>]+>/g, '');
    // 2. Trim whitespace
    const trimmedText = text.trim();
    // 3. Truncate to max length and add ellipsis if needed
    if (trimmedText.length > maxLength) {
        return trimmedText.substring(0, maxLength).trim() + '...';
    }
    return trimmedText;
};


// KRİTİK FİX GÜNCELLEMESİ: Medya Öncelik Protokolü 
const getPostMediaUrl = (post) => {
    let url = post.bannerImageUrl;

    // 1. Banner Image Kontrolü ve Güvenlik Filtresi
    if (url && typeof url === 'string' && url.length > 0 && url.startsWith('https://')) {
        
        // KRİTİK FİLTRE: Imgur sayfa/albüm linklerini REDDET. Sadece i.imgur.com'a izin ver (direkt görsel).
        if (url.includes('imgur.com') && !url.includes('i.imgur.com')) {
             // Bu bir sayfa linkidir. Geçersiz kabul et ve placeholder'a düş.
             url = null;
        } else if (url.includes('i.imgur.com')) {
             // PERFORMANS FİKSİ: Imgur'dan çekilen görsellere thumbnail parametresi ekleniyor.
             // maxwidth=500: Maksimum genişliği 500 piksel olarak sınırlar.
             return `${url}?maxwidth=500&fidelity=true`;
        } else {
             // Diğer tüm geçerli HTTPS URL'lerini (i.imgur.com dahil) kullan.
             return url;
        }
    }
    
    // 2. YouTube Video Küçük Resmi Kontrolü
    const validYoutubeId = post.youtubeVideoId && typeof post.youtubeVideoId === 'string' && post.youtubeVideoId.length === 11 ? post.youtubeVideoId : null;
    if (validYoutubeId) {
        // En yüksek çözünürlüklü YouTube küçük resmini kullan
        return `https://img.youtube.com/vi/${validYoutubeId}/maxresdefault.jpg`;
    }
    
    // 3. Kategori Temalı Placeholder (Yoksa)
    const category = post.category || 'Synara Yazısı';
    let themeColor = '4F46E5'; // Indigo (Varsayılan Blog Rengi)

    const textColor = 'FFFFFF';
    const textContent = encodeURIComponent(category);

    return `https://placehold.co/1280x720/${themeColor}/${textColor}?text=${textContent}`;
}

// Helper: Kategori rengine göre dinamik Tailwind sınıflarını döndürür
const getCategoryStyles = (category, themeColor = DEFAULT_THEME_COLOR) => {
    // BURASI ARTIK SADECE DEFAULT BLOG TEMASINI (INDIGO) YÖNETİYOR.
    const baseColor = 'indigo';
    
    // Kategoriye özel stil yoksa, varsayılanı döndür.
    let categoryBg = 'bg-indigo-600/80 text-white';
    let categoryBorder = 'border-indigo-700/50';

    switch (category) {
        case 'Eğitim': 
            categoryBg = 'bg-yellow-600/80 text-white';
            categoryBorder = 'border-yellow-700/50';
            break;
        case 'Analiz': 
            categoryBg = 'bg-green-600/80 text-white';
            categoryBorder = 'border-green-700/50';
            break;
        case 'Sistem':
        case 'Güncelleme':
             categoryBg = 'bg-sky-600/80 text-white';
             categoryBorder = 'border-sky-700/50';
             break;
        default:
            categoryBg = 'bg-indigo-600/80 text-white';
            categoryBorder = 'border-indigo-700/50';
            break;
    }


    return {
        activeCls: 'relative text-white border-2 border-indigo-500/50 bg-indigo-900/40',
        inactiveCls: 'bg-gray-800 text-white hover:bg-gray-700/80 border border-gray-700',
        pageColor: baseColor, // Ana renk (örneğin başlık hover rengi için)
        categoryBg, // Arka plan (etiket için)
        categoryBorder, // Kenarlık rengi
        headerBorderClass: `border-${baseColor}-700/50`,
        gridGlowClass: `bg-grid-${baseColor}-500/10`,
        icon: CATEGORY_ICONS[category] || CATEGORY_ICONS['Tümü'], // v1.0.5 - Kategori ikonu eklendi
    };
};


// KRİTİK FİX: getCategoryStyles dışarıya aktarıldı, BlogSidebar.js'te kullanılması için.
export { getCategoryStyles, CATEGORY_ICONS }; // v1.0.5 - CATEGORY_ICONS da export edildi


// Öne Çıkan (Featured) Blog Kartı - BLOG TEMASI İÇİN KORUNUR
const FeaturedBlogCard = ({ post, T }) => {
    const imageUrl = useMemo(() => getPostMediaUrl(post), [post]);
    
    if (!post || !post.id || !post.slug) {
        return null;
    }
    
    const excerpt = cleanExcerpt(post.content || '', 250); 
    const styles = getCategoryStyles(post.category, DEFAULT_THEME_COLOR);
    const readingTime = calculateReadingTime(post.content); // v1.0.5 - Okunma Süresi
    const formattedDate = new Date(post.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }); // v1.0.5 - Tarih

    return (
        <motion.div 
            className="lg:col-span-full bg-gradient-to-br from-indigo-900/50 to-gray-900/50 p-6 rounded-3xl border-2 border-indigo-500/50 shadow-2xl shadow-indigo-900/40 mb-12"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            whileHover={{ scale: 1.005 }}
        >
            <div className="grid md:grid-cols-2 gap-8 items-center">
                <Link href={`/blog/${post.slug}`} className="group block relative aspect-video rounded-xl overflow-hidden">
                    <DynamicImage 
                        src={imageUrl} 
                        alt={post.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        unoptimized={true} 
                        priority={true} 
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors"></div>
                    {/* v1.0.5 - Öne Çıkan etiketi daha şık */}
                    <div className="absolute top-3 right-3 flex items-center gap-2 text-yellow-400 bg-yellow-900/70 px-3 py-1 rounded-full text-sm font-bold border border-yellow-500/50 shadow-md">
                        <Icon name="award" className="w-5 h-5"/>
                        <span>{T?.blog_featured_label || 'Öne Çıkan'}</span>
                    </div>
                </Link>
                <div>
                    <Link href={`/blog/${post.slug}`} className="group block">
                        <span className={`${styles.categoryBg} text-white text-sm font-bold px-3 py-1 rounded-full mb-3 inline-block border ${styles.categoryBorder}`}>{post.category}</span>
                        <h3 className={`text-2xl lg:text-3xl font-extrabold text-white group-hover:text-indigo-300 transition-colors`}>{post.title}</h3>
                        {/* v1.0.5 - Yazar, Tarih, Okunma Süresi ve Beğeni/Yorum Metrikleri */}
                        <div className="flex flex-wrap items-center text-xs text-gray-400 gap-x-4 gap-y-1 mt-2">
                            <span className="flex items-center gap-1"><Icon name="user" className="w-4 h-4 text-gray-500"/> Yazar: <span className="font-semibold text-gray-300">{post.authorName}</span></span>
                            <span className="flex items-center gap-1"><Icon name="calendar" className="w-4 h-4 text-gray-500"/> {formattedDate}</span>
                            {readingTime > 0 && <span className="flex items-center gap-1"><Icon name="book-open" className="w-4 h-4 text-gray-500"/> {readingTime} dk. okunma</span>}
                            <span className="flex items-center gap-1"><Icon name="heart" className="w-4 h-4 text-red-400"/> {post.likes || 0}</span>
                            <span className="flex items-center gap-1"><Icon name="message-square" className="w-4 h-4 text-sky-400"/> {post.commentCount || 0}</span>
                        </div>
                    </Link>
                    <p className="text-sm text-gray-400 italic leading-relaxed line-clamp-3 mt-4">{excerpt}</p>
                </div>
            </div>
        </motion.div>
    );
};

// Standart Blog Kartı
const BlogCard = ({ post, index, T, themeColor = DEFAULT_THEME_COLOR }) => {
    const imageUrl = useMemo(() => getPostMediaUrl(post), [post]);
    
    if (!post || !post.id || !post.slug) {
        return null; 
    }
    
    const excerpt = cleanExcerpt(post.content || '', 120); 
    const styles = getCategoryStyles(post.category, themeColor);
    const hoverBorderClass = 'hover:border-indigo-500/50'; 
    const glowClass = ''; 
    const isPriority = index < 4;

    const readingTime = calculateReadingTime(post.content); // v1.0.5 - Okunma Süresi
    const formattedDate = new Date(post.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }); // v1.0.5 - Tarih

    return (
        <motion.div
            variants={{ hidden: { y: 20, opacity: 0 }, visible: { opacity: 1, y: 0 } }} 
            className="h-full"
        >
            <Link href={`/blog/${post.slug}`} className="group block h-full">
                <article className={`bg-gray-800/50 rounded-2xl border border-gray-700 ${hoverBorderClass} transition-all duration-300 transform hover:-translate-y-1 overflow-hidden h-full flex flex-col ${glowClass}`}>
                    <div className="relative h-48 w-full">
                        <DynamicImage 
                            src={imageUrl} 
                            alt={post.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            unoptimized={true} 
                            priority={isPriority} 
                            loading={isPriority ? 'eager' : 'lazy'} 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                         {/* v1.0.5 - Kategori etiketi ve ikonu */}
                         <div className="absolute top-3 left-3 flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${styles.categoryBg} border ${styles.categoryBorder}`}>
                                {post.category}
                            </span>
                            {styles.icon && (
                                <Icon name={styles.icon} className="w-5 h-5 text-white bg-gray-900/50 p-1 rounded-full border border-gray-700 shadow-sm" />
                            )}
                        </div>
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                        <h2 className={`text-lg font-bold text-white group-hover:text-${styles.pageColor}-400 transition-colors line-clamp-2 mb-2 flex-grow`}>
                            {post.title}
                        </h2>
                        <p className="text-sm text-gray-400 line-clamp-3 mb-4 flex-grow">
                             {cleanExcerpt(post.content, 120)}
                        </p>
                        {/* v1.0.5 - Footer güncellendi: Tarih, Okunma Süresi, Yazar, Beğeni, Yorum */}
                        <div className="flex flex-wrap items-center justify-between text-xs text-gray-400 border-t border-gray-700/50 pt-3 mt-auto">
                            <div className='flex items-center gap-3'>
                                <span className="flex items-center gap-1" title="Yayın Tarihi">
                                    <Icon name="calendar" className="w-4 h-4 text-gray-500"/> 
                                    {formattedDate}
                                </span>
                                {readingTime > 0 && (
                                    <span className="flex items-center gap-1" title="Tahmini Okunma Süresi">
                                        <Icon name="book-open" className="w-4 h-4 text-gray-500"/> 
                                        {readingTime} dk.
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 mt-2 sm:mt-0">
                                <div className="flex items-center gap-1" title="Beğeniler">
                                    <Icon name="heart" className="w-4 h-4 text-red-400"/>
                                    <span className="font-semibold">{post.likes || 0}</span>
                                </div>
                                <div className="flex items-center gap-1" title="Yorum Sayısı">
                                    <Icon name="message-square" className="w-4 h-4 text-sky-400"/>
                                    <span className="font-semibold">{post.commentCount || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </article>
            </Link>
        </motion.div>
    );
};


// --- ANA BİLEŞEN ---
const BlogIndexClient = ({
    initialPosts,
    pageTitle,
    pageSubtitle,
    customCategories = ['Analiz', 'Eğitim', 'Güncelleme', 'Sistem'].map(c => ({ key: c, label: c })), 
}) => {
    
    const { user, T } = useAuth(); 
    const [activeCategoryKey, setActiveCategoryKey] = useState('Tümü'); 
    const [lastSuccessfulPosts, setLastSuccessfulPosts] = useState(initialPosts || []);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [postsPerPage, setPostsPerPage] = useState(12); 

    const { data: rawPosts, isLoading, error, isSuccess } = trpc.blog.getPosts.useQuery(undefined, {
        initialData: initialPosts,
        staleTime: 60000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
    
    const ALLOWED_BLOG_CATEGORIES_KEYS = useMemo(() => ['Analiz', 'Eğitim', 'Güncelleme', 'Sistem'], []);

    const dynamicCategories = useMemo(() => {
        return [
            { key: 'Tümü', label: T?.news_category_all || 'Tümü' },
            ...ALLOWED_BLOG_CATEGORIES_KEYS.map(c => ({ key: c, label: c }))
        ];
    }, [T, ALLOWED_BLOG_CATEGORIES_KEYS]);

    const allFilteredPosts = useMemo(() => {
        const postsToFilter = rawPosts || lastSuccessfulPosts; 

        if (!postsToFilter || postsToFilter.length === 0) return [];
        
        let basePosts = postsToFilter;
        
        basePosts = basePosts.filter(p => ALLOWED_BLOG_CATEGORIES_KEYS.includes(p.category));

        const sortedPosts = [...basePosts].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA; 
        });

        const allKey = T?.news_category_all || 'Tümü';
        if (activeCategoryKey === 'Tümü' || activeCategoryKey === allKey) {
             return sortedPosts; 
        }
        
        return sortedPosts.filter(p => p.category === activeCategoryKey);

    }, [rawPosts, lastSuccessfulPosts, activeCategoryKey, T, ALLOWED_BLOG_CATEGORIES_KEYS]);

    const { featuredPost, paginatedPosts, totalPageCount } = useMemo(() => {
        const featured = (currentPage === 1 && allFilteredPosts.length > 0) ? allFilteredPosts[0] : null;
        const otherPosts = featured ? allFilteredPosts.slice(1) : allFilteredPosts;

        if (postsPerPage === 0) {
            return {
                featuredPost: featured, 
                paginatedPosts: otherPosts, 
                totalPageCount: 1,
            };
        }

        const totalPosts = otherPosts.length;
        const totalPages = Math.ceil(totalPosts / postsPerPage);
        
        const startIndex = (currentPage - 1) * postsPerPage;
        const paginated = otherPosts.slice(startIndex, startIndex + postsPerPage);
        
        return {
            featuredPost: featured,
            paginatedPosts: paginated,
            totalPageCount: totalPages,
        };

    }, [allFilteredPosts, currentPage, postsPerPage]);
    

    useEffect(() => {
        if (isSuccess && rawPosts) {
            setLastSuccessfulPosts(rawPosts);
        }
    }, [isSuccess, rawPosts]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeCategoryKey, postsPerPage]);


    if (isLoading && allFilteredPosts.length === 0) {
        return <SkeletonLoader />;
    }
    
    if (!T || (allFilteredPosts.length === 0 && !isLoading)) {
         return (
             <div className="min-h-screen bg-gray-900/50 flex flex-col justify-center items-center p-4">
                 <Icon name="bell" className="w-12 h-12 text-yellow-400 mx-auto mb-4"/>
                 <p className="text-xl text-gray-400">{T?.blog_no_posts_in_category || 'Bu kategoride henüz yayınlanmış blog/analiz yazısı bulunmamaktadır.'}</p>
                 <p className="text-sm text-gray-500 mt-2">Veri bulunamadı veya yükleme hatası.</p>
             </div>
         );
    }
    
    if (error) {
        return <div className="min-h-screen bg-[#111827] flex justify-center items-center"><p className="text-red-400">Hata: {error.message}</p></div>;
    }
    
    const themeColor = DEFAULT_THEME_COLOR;
    const styles = getCategoryStyles(activeCategoryKey, themeColor);
    const headerBorderClass = styles.headerBorderClass;
    const headerGlowClass = 'radial-gradient(ellipse_at_center,rgba(79,70,229,0.1)_0%,rgba(17,24,39,0)_70%)';
    const gridGlowClass = styles.gridGlowClass;


    return (
        <div className="w-full">
             <motion.section 
                className={`relative pt-12 pb-16 text-center overflow-hidden bg-gray-900/50 border-b ${headerBorderClass} `}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
             >
                <div className="absolute inset-0" style={{ background: headerGlowClass }}></div>
                <div className={`absolute inset-0 ${gridGlowClass} bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_at_center,transparent_0%,black_100%)]`}></div>
                
                <div className="container mx-auto px-6 relative z-10">
                    <motion.h1 
                        className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-2"
                        initial={{ y: 20 }}
                        animate={{ y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {pageTitle || T.nav_blog} 
                    </motion.h1>
                    <motion.p 
                        className="text-lg text-gray-400 max-w-3xl mx-auto mb-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        {pageSubtitle}
                    </motion.p>
                </div>
             </motion.section>
             
             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
                 
                 <div className="lg:col-span-8">
                     
                     <AnimatePresence mode="wait">
                         <motion.div 
                             key={activeCategoryKey + currentPage + postsPerPage} 
                             initial="hidden"
                             animate="visible"
                             exit="hidden"
                             variants={{ 
                                 hidden: { opacity: 0, transition: { duration: 0.3 } }, 
                                 visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } } 
                             }}
                             className="grid grid-cols-1 md:grid-cols-2 gap-8" 
                         >
                             {featuredPost && (
                                 <motion.div 
                                     className="md:col-span-2"
                                     variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
                                 >
                                     <FeaturedBlogCard post={featuredPost} T={T} />
                                 </motion.div>
                             )}
                             
                             {paginatedPosts.map((post, index) => (
                                 <BlogCard 
                                     post={post} 
                                     key={post.id} 
                                     index={index} 
                                     T={T} 
                                     themeColor={themeColor} 
                                 />
                             ))}
                         </motion.div>
                     </AnimatePresence>
                     
                     
                     {allFilteredPosts.length === 0 && !isLoading && (
                         <div className="text-center p-12 bg-gray-800/50 rounded-2xl border border-dashed border-gray-700 mt-8">
                             <Icon name="bell" className="w-12 h-12 text-yellow-400 mx-auto mb-4"/>
                             <p className="text-lg text-gray-400">{T?.blog_no_posts_in_category || "Bu kategoride henüz yayınlanmış blog/analiz yazısı bulunmamaktadır."}</p>
                         </div>
                     )}
                     {isLoading && allFilteredPosts.length > 0 && (
                         <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                              <SkeletonLoader count={2} height="h-64" />
                         </div>
                     )}

                     <PaginationControls
                        currentPage={currentPage}
                        totalPageCount={totalPageCount}
                        onPageChange={(page) => setCurrentPage(page)}
                        postsPerPage={postsPerPage}
                        onPostsPerPageChange={(value) => setPostsPerPage(value)}
                        T={T}
                     />

                 </div>
                 
                 <div className="lg:col-span-4">
                     <BlogSidebar
                         T={T}
                         activeCategoryKey={activeCategoryKey}
                         setActiveCategoryKey={setActiveCategoryKey}
                     />
                 </div>
             </div>
        </div>
    );
};


export default BlogIndexClient;