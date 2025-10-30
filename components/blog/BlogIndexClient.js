// path:components/blog/BlogIndexClient.js
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


// --- SABİT KATEGORİLER (DEFAULT) ---
const DEFAULT_THEME_COLOR = 'indigo';
const ALLOWED_BLOG_CATEGORIES = ['Analiz', 'Eğitim', 'Güncelleme', 'Sistem']; 


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

    switch (category) {
        case 'Eğitim': 
            categoryBg = 'bg-yellow-600/80 text-white';
            break;
        case 'Analiz': 
            categoryBg = 'bg-green-600/80 text-white';
            break;
        case 'Sistem':
        case 'Güncelleme':
             categoryBg = 'bg-sky-600/80 text-white';
             break;
        default:
            categoryBg = 'bg-indigo-600/80 text-white';
            break;
    }


    return {
        activeCls: 'relative text-white border-2 border-indigo-500/50 bg-indigo-900/40',
        inactiveCls: 'bg-gray-800 text-white hover:bg-gray-700/80 border border-gray-700',
        pageColor: baseColor,
        categoryBg,
        headerBorderClass: `border-${baseColor}-700/50`,
        gridGlowClass: `bg-grid-${baseColor}-500/10`,
    };
};


// KRİTİK FİX: getCategoryStyles dışarıya aktarıldı, BlogSidebar.js'te kullanılması için.
export { getCategoryStyles };


// Öne Çıkan (Featured) Blog Kartı - BLOG TEMASI İÇİN KORUNUR
const FeaturedBlogCard = ({ post, T }) => {
    // KRİTİK DÜZELTME: useMemo Hook'u, erken dönüş kontrolünden önce çağrılmalıdır.
    const imageUrl = useMemo(() => getPostMediaUrl(post), [post]);
    
    // KRİTİK KONTROL: Eğer post verisi eksikse render etme
    if (!post || !post.id || !post.slug) {
        return null;
    }
    
    const excerpt = cleanExcerpt(post.content || '', 250); 
    
    // KRİTİK: Featured kartın kategorisine göre stil belirlenmeli
    const styles = getCategoryStyles(post.category, DEFAULT_THEME_COLOR);
    
    return (
        <motion.div 
            // KRİTİK DÜZELTME 1: Ana içerik sütunu kadar yer kaplaması için lg:col-span-8 yapıldı
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
                        priority={true} // Öne çıkan görsel, viewport'ta olduğu için yüksek öncelikli
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors"></div>
                    <div className="absolute top-3 right-3 flex items-center gap-2 text-yellow-400 bg-yellow-900/70 px-3 py-1 rounded-full text-sm font-bold border border-yellow-500/50">
                        <Icon name="award" className="w-5 h-5"/>
                        <span>Öne Çıkan</span>
                    </div>
                </Link>
                <div>
                    <Link href={`/blog/${post.slug}`} className="group block">
                         {/* KRİTİK FİX: Kategori etiketinin rengini Featured postun kategorisine göre ayarla */}
                        <span className={`${styles.categoryBg} text-white text-sm font-bold px-3 py-1 rounded-full mb-3 inline-block border border-indigo-700/50`}>{post.category}</span>
                        <h3 className={`text-2xl lg:text-3xl font-extrabold text-white group-hover:text-indigo-300 transition-colors`}>{post.title}</h3>
                        <div className="flex flex-wrap items-center text-xs text-gray-400 gap-x-4 gap-y-1 mt-2">
                            <span>Yazar: <span className="font-semibold text-gray-300">{post.authorName}</span></span>
                            <span className="flex items-center gap-1"><Icon name="heart" className="w-4 h-4 text-red-400"/> {post.likes || 0}</span>
                        </div>
                    </Link>
                    {/* KRİTİK DÜZELTME: cleanExcerpt kullanıldı */}
                    <p className="text-sm text-gray-400 italic leading-relaxed line-clamp-3 mt-4">{excerpt}</p>
                </div>
            </div>
        </motion.div>
    );
};

// Standart Blog Kartı
const BlogCard = ({ post, index, T, themeColor = DEFAULT_THEME_COLOR }) => {
    // KRİTİK DÜZELTME: useMemo Hook'u, erken dönüş kontrolünden önce çağrılmalıdır.
    const imageUrl = useMemo(() => getPostMediaUrl(post), [post]);
    
    // KRİTİK KONTROL: Eğer post verisi yoksa veya eksikse render etme
    if (!post || !post.id || !post.slug) {
        return null; 
    }
    
    const excerpt = cleanExcerpt(post.content || '', 120); 

    // KRİTİK GÜNCELLEME: Haber/Blog temasına göre stil seçimi
    const styles = getCategoryStyles(post.category, themeColor);
    const hoverBorderClass = 'hover:border-indigo-500/50'; // Blog için sabit
    const glowClass = ''; // Blog için glow yok
    
    // PERFORMANS FİKSİ: İlk 4 görseli öncelikli yükle, diğerlerini yavaş yükle
    const isPriority = index < 4;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
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
                            priority={isPriority} // PERFORMANS FİKSİ: İlk 4 karta öncelik ver
                            loading={isPriority ? 'eager' : 'lazy'} // İlk 4 kart hemen yüklenir, diğerleri kaydırılınca
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                         <div className="absolute top-3 left-3">
                            {/* KRİTİK DÜZELTME: Kategori stili dinamik olarak çekildi */}
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${styles.categoryBg}`}>{post.category}</span>
                        </div>
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                        <h2 className={`text-lg font-bold text-white group-hover:text-${styles.pageColor}-400 transition-colors line-clamp-2 mb-2 flex-grow`}>
                            {post.title}
                        </h2>
                        {/* KRİTİK EKLENTİ: Temizlenmiş özet eklendi */}
                        <p className="text-sm text-gray-400 line-clamp-3 mb-4 flex-grow">
                             {cleanExcerpt(post.content, 120)}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-700 pt-3 mt-auto">
                            <span>{post.authorName}</span>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1" title="Beğeniler">
                                    <Icon name="heart" className="w-4 h-4 text-red-400"/>
                                    <span className="font-semibold">{post.likes || 0}</span>
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
    
    // 1. KRİTİK HOOKS: AUTH & STATE (KOŞULSUZ)
    const { user, T } = useAuth(); // KRİTİK DÜZELTME 1: useAuth() tek bir çağrıda birleştirildi
    const [activeCategoryKey, setActiveCategoryKey] = useState('Tümü'); 
    // KRİTİK FİX 4: Veri stabilizasyon state'i eklendi
    const [lastSuccessfulPosts, setLastSuccessfulPosts] = useState(initialPosts || []);
    
    // KRİTİK FİX 1: useQuery'ye initialData verisi iletiliyor.
    const { data: rawPosts, isLoading, error, isSuccess } = trpc.blog.getPosts.useQuery(undefined, {
        initialData: initialPosts,
        staleTime: 60000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
    
    // 2. KRİTİK HOOKS: MEMOIZATIONS (KOŞULSUZ)
    // KRİTİK DÜZELTME 2: Tüm useMemo çağrıları en üste taşındı.
    const ALLOWED_BLOG_CATEGORIES_KEYS = useMemo(() => ['Analiz', 'Eğitim', 'Güncelleme', 'Sistem'], []);

    const dynamicCategories = useMemo(() => {
        // Blog Index Client için sadece izin verilen kategorileri getiriyoruz.
        return [
            { key: 'Tümü', label: T?.news_category_all || 'Tümü' },
            ...ALLOWED_BLOG_CATEGORIES_KEYS.map(c => ({ key: c, label: c }))
        ];
    }, [T, ALLOWED_BLOG_CATEGORIES_KEYS]);

    const filteredPosts = useMemo(() => {
        // KRİTİK FİX 6: isLoading sırasında bile son başarılı veriyi kullan
        const postsToFilter = rawPosts || lastSuccessfulPosts; 

        if (!postsToFilter || postsToFilter.length === 0) return [];
        
        let basePosts = postsToFilter;
        
        // 1. Sadece izin verilen blog kategorilerini filtrele
        basePosts = basePosts.filter(p => ALLOWED_BLOG_CATEGORIES_KEYS.includes(p.category));

        // 2. Seçili kategoriye göre filtreleme mantığı
        const allKey = T?.news_category_all || 'Tümü';
        if (activeCategoryKey === 'Tümü' || activeCategoryKey === allKey) {
             return basePosts;
        }
        
        // KRİTİK DÜZELTME: Kategori eşleşmesini kesinleştiriyoruz.
        return basePosts.filter(p => p.category === activeCategoryKey);

    }, [rawPosts, lastSuccessfulPosts, activeCategoryKey, T, ALLOWED_BLOG_CATEGORIES_KEYS]);

    // 3. KRİTİK HOOKS: EFFECTS (KOŞULSUZ)
    // KRİTİK FİX 5: Başarılı veri geldiğinde lastSuccessfulPosts'u güncelle
    useEffect(() => {
        if (isSuccess && rawPosts) {
            setLastSuccessfulPosts(rawPosts);
        }
    }, [isSuccess, rawPosts]);


    // 4. DERIVED & EARLY RETURNS (Hook çağrılarından sonra)
    
    // KRİTİK FİX: Yükleme durumunda ve veri yoksa iskelet göster
    if (isLoading && filteredPosts.length === 0) {
        return <SkeletonLoader />;
    }
    
    // Veri yoksa ve yükleme tamamlandıysa (boş sonuç)
    // T objesi yüklenene kadar kontrolü dışarıda yapıyoruz
    if (!T || (filteredPosts.length === 0 && !isLoading)) {
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
    
    // FEATURED POST DERIVATION
    const featuredPost = filteredPosts.length > 0 ? filteredPosts[0] : null;
    const otherPosts = featuredPost ? filteredPosts.slice(1) : filteredPosts; 
    
    const themeColor = DEFAULT_THEME_COLOR;
    const styles = getCategoryStyles(activeCategoryKey, themeColor);
    const headerBorderClass = styles.headerBorderClass;
    const headerGlowClass = 'radial-gradient(ellipse_at_center,rgba(79,70,229,0.1)_0%,rgba(17,24,39,0)_70%)';
    const gridGlowClass = styles.gridGlowClass;


    return (
        <div className="w-full">
             <motion.section 
                // KRİTİK GÜNCELLEME: Header stili korundu
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
                    
                    {/* KRİTİK KALDIRMA: Kategori Çubuğu (Sade ve Görseldeki Gibi) */}
                    {/* dynamicCategories.length > 0 && (
                        <div className="flex justify-center flex-wrap gap-3 pt-4 mx-auto max-w-7xl px-4 overflow-hidden">
                            {dynamicCategories.map(category => {
                                const finalCls = `px-5 py-2.5 text-sm font-semibold rounded-full transition-all duration-300 transform hover:scale-[1.05] ${
                                    activeCategoryKey === category.key
                                    ? styles.activeCls // Indigo arkaplan ve shadow
                                    : styles.inactiveCls // Koyu arkaplan
                                }`;
                                
                                return (
                                    <motion.button
                                        key={category.key}
                                        onClick={() => setActiveCategoryKey(category.key)}
                                        className={finalCls}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.5 + dynamicCategories.indexOf(category) * 0.1 }}
                                    >
                                        <span className="relative z-10">{category.label}</span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    ) */}
                </div>
            </motion.section>
            
            {/* KRİTİK YENİ DÜZEN: 12 KOLONLU ANA İÇERİK GRİDİ (8/12 - 4/12) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* 1. Sütun: BLOG AKIŞI (8/12 genişlik) */}
                <div className="lg:col-span-8">
                    {/* KRİTİK KALDIRMA: AnimatePresence kaldırıldı */}
                    {/* <AnimatePresence mode="wait"> */}
                        <motion.div 
                            key={activeCategoryKey} 
                            initial="hidden"
                            animate="visible"
                            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                            // KRİTİK DÜZELTME 2: İçerik akışı gridi, 8 birimlik alana sığması için 2 sütuna indirildi.
                            className="grid grid-cols-1 md:grid-cols-2 gap-8" 
                        >
                            {featuredPost && (
                                // KRİTİK DÜZELTME 3: Featured Card'ın sadece bu 8 birimlik alanda tam genişlik (col-span-2) kaplaması sağlandı.
                                <motion.div 
                                    className="md:col-span-2"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <FeaturedBlogCard post={featuredPost} T={T} />
                                </motion.div>
                            )}
                            
                            {otherPosts.map((post, index) => (
                                <BlogCard post={post} key={post.id} index={index} T={T} themeColor={themeColor} />
                            ))}
                        </motion.div>
                    {/* </AnimatePresence> */}
                    
                    {/* Filtreleme sırasında veri gelmezse ve yükleme bittiyse bu kutuyu göster. */}
                    {filteredPosts.length === 0 && !isLoading && (
                         <div className="text-center p-12 bg-gray-800/50 rounded-2xl border border-dashed border-gray-700 mt-8">
                            <Icon name="bell" className="w-12 h-12 text-yellow-400 mx-auto mb-4"/>
                            <p className="text-lg text-gray-400">{T?.blog_no_posts_in_category || "Bu kategoride henüz yayınlanmış blog/analiz yazısı bulunmamaktadır."}</p>
                         </div>
                    )}
                    {/* Yükleme sırasında iskelet göster (Veri kaybolmasını önler) */}
                    {isLoading && filteredPosts.length > 0 && (
                         <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                             <SkeletonLoader count={2} height="h-64" />
                         </div>
                    )}
                </div>
                
                {/* 2. Sütun: BLOG SIDEBAR (4/12 genişlik) */}
                <div className="lg:col-span-4">
                    {/* KRİTİK EKLENTİ: BlogSidebar bileşeni */}
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
