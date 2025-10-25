// path: components/blog/BlogIndexClient.js
'use client'; 

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Icon from '@/components/Icon';
import { trpc } from '@/lib/trpc/client';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import SkeletonLoader from '@/components/SkeletonLoader'; // Import eklendi

// --- SABİT KATEGORİLER (DEFAULT) ---
const DEFAULT_CATEGORIES = ['Tümü', 'Analiz', 'Eğitim', 'Güncelleme', 'Haberler'];

// KRİTİK FİX EKLENTİSİ: Medya URL'sini koşullu olarak oluşturan helper
const getPostMediaUrl = (post) => {
    const validYoutubeId = post.youtubeVideoId && typeof post.youtubeVideoId === 'string' && post.youtubeVideoId.length === 11 ? post.youtubeVideoId : null;
    
    // 1. Banner URL'si varsa onu kullan.
    if (post.bannerImageUrl) return post.bannerImageUrl;
    
    // 2. Geçerli YouTube ID'si varsa thumbnail'ını kullan.
    if (validYoutubeId) return `https://img.youtube.com/vi/${validYoutubeId}/maxresdefault.jpg`;
    
    // 3. Hiçbiri yoksa placeholder kullan.
    return `https://placehold.co/1280x720/1F2937/4F46E5?text=${encodeURIComponent(post.title || 'Synara Yazısı')}`;
}

// Helper: Kategori rengine göre dinamik Tailwind sınıflarını döndürür
const getCategoryStyles = (category, themeColor) => {
    // Haber modu için kırmızı/turuncu tonları
    if (themeColor === 'orange') {
        const baseColor = 'orange'; // Genel tema rengi
        const activeCls = `bg-${baseColor}-600 text-gray-900 shadow-lg shadow-${baseColor}-900/50`;
        const inactiveCls = 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700';

        let categoryBg = `bg-gray-800/50 text-gray-300`; 
        
        switch (category) {
            case 'Haberler': 
            case 'Kripto': 
                categoryBg = 'bg-orange-800/50 text-orange-300';
                break;
            case 'Makroekonomi': 
            case 'Döviz':
                categoryBg = 'bg-red-800/50 text-red-300';
                break;
            case 'Altın':
                categoryBg = 'bg-yellow-800/50 text-yellow-300';
                break;
            case 'Borsa':
                categoryBg = 'bg-green-800/50 text-green-300';
                break;
            default:
                categoryBg = 'bg-indigo-800/50 text-indigo-300';
                break;
        }

        return { activeCls, inactiveCls, pageColor: baseColor, categoryBg };

    } 
    
    // Varsayılan Blog Teması (Indigo)
    return {
        activeCls: 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50',
        inactiveCls: 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700',
        pageColor: 'indigo',
        categoryBg: 'bg-indigo-600/80 text-white',
    };
};


// Öne Çıkan (Featured) Blog Kartı - BLOG TEMASI İÇİN KORUNUR
const FeaturedBlogCard = ({ post, T }) => {
    if (!post) return null;

    // KRİTİK FİX UYGULANDI: getPostMediaUrl ile görsel URL'si güvenli bir şekilde çekildi
    const imageUrl = getPostMediaUrl(post);
    const excerpt = post.content ? post.content.substring(0, 150).replace(/[#*`]/g, '') + '...' : post.title;

    return (
        <motion.div 
            className="lg:col-span-full bg-gradient-to-br from-indigo-900/50 to-gray-900/50 p-6 rounded-3xl border-2 border-indigo-500/50 shadow-2xl shadow-indigo-900/40 mb-12"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
        >
            <div className="grid md:grid-cols-2 gap-8 items-center">
                <Link href={`/blog/${post.slug}`} className="group block relative aspect-video rounded-xl overflow-hidden">
                    <Image 
                        src={imageUrl} 
                        alt={post.title} 
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        priority
                        unoptimized={true}
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors"></div>
                    <div className="absolute top-3 right-3 flex items-center gap-2 text-yellow-400 bg-yellow-900/70 px-3 py-1 rounded-full text-sm font-bold border border-yellow-500/50">
                        <Icon name="award" className="w-5 h-5"/>
                        <span>Öne Çıkan</span>
                    </div>
                </Link>
                <div>
                    <Link href={`/blog/${post.slug}`} className="group block">
                        <span className="bg-indigo-600/90 text-white text-sm font-bold px-3 py-1 rounded-full mb-3 inline-block">{post.category}</span>
                        <h3 className="text-2xl lg:text-3xl font-extrabold text-white group-hover:text-indigo-300 transition-colors">{post.title}</h3>
                        <div className="flex flex-wrap items-center text-xs text-gray-400 gap-x-4 gap-y-1 mt-2">
                            <span>Yazar: <span className="font-semibold text-gray-300">{post.authorName}</span></span>
                            <span className="flex items-center gap-1"><Icon name="heart" className="w-4 h-4 text-red-400"/> {post.likes || 0}</span>
                        </div>
                    </Link>
                    <p className="text-sm text-gray-400 italic leading-relaxed line-clamp-3 mt-4">{excerpt}</p>
                </div>
            </div>
        </motion.div>
    );
};

// Standart Blog Kartı
const BlogCard = ({ post, index, T, themeColor = 'indigo' }) => {
    // KRİTİK FİX UYGULANDI: getPostMediaUrl ile görsel URL'si güvenli bir şekilde çekildi
    const imageUrl = getPostMediaUrl(post);
    
    // KRİTİK GÜNCELLEME: Haber/Blog temasına göre stil seçimi
    const styles = getCategoryStyles(post.category, themeColor);
    const hoverBorderClass = themeColor === 'orange' ? 'hover:border-orange-500/50' : 'hover:border-indigo-500/50';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className="h-full"
        >
            <Link href={`/blog/${post.slug}`} className="group block h-full">
                <article className={`bg-gray-800/50 rounded-2xl border border-gray-700 ${hoverBorderClass} transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl overflow-hidden h-full flex flex-col`}>
                    <div className="relative h-48 w-full">
                        <Image 
                            src={imageUrl} 
                            alt={post.title} 
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy" 
                            unoptimized={true}
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


const BlogIndexClient = ({
    initialPosts,
    pageTitle,
    pageSubtitle,
    customCategories = DEFAULT_CATEGORIES.map(c => ({ key: c, label: c })), 
    isNewsMode = false,
    themeColor = 'indigo', // Yeni prop: Genel tema rengini belirler (indigo veya orange)
}) => {
    
    // KRİTİK FİX 1: useQuery'ye initialData verisi iletiliyor. Bu, Sunucu Component'ten gelen verinin
    // client'ta ilk yüklenmesini sağlar ve tRPC query'nin yalnızca güncellemeler için çalışmasını sağlar.
    const { data: rawPosts, isLoading, error } = trpc.blog.getPosts.useQuery(undefined, {
        initialData: initialPosts,
        staleTime: 60000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
    const { T } = useAuth();
    
    const [activeCategoryKey, setActiveCategoryKey] = useState(customCategories[0]?.key || 'Tümü');

    const dynamicCategories = useMemo(() => {
        // Eğer customCategories varsa onu kullan (Haberler sayfasında olduğu gibi)
        if (customCategories && customCategories.length > 0) return customCategories;
        
        // Eğer customCategories yoksa, mevcut postlardan dinamik kategorileri çıkar
        if (!rawPosts) return DEFAULT_CATEGORIES.map(c => ({ key: c, label: c }));
        
        const allCats = ['Tümü', ...new Set(rawPosts.map(p => p.category).filter(Boolean))];
        return allCats.map(c => ({ key: c, label: T[c.toLowerCase().replace(/\s/g, '_')] || c }));
    }, [rawPosts, customCategories, T]);

    const filteredPosts = useMemo(() => {
        if (!rawPosts) return [];
        let basePosts = rawPosts;

        // KRİTİK FİX 2: isNewsMode'a göre kategori filtrelemesi.
        const allowedBlogCategories = ['Analiz', 'Eğitim', 'Güncelleme', 'Sistem']; // Bloglar için temel kategori
        const allowedNewsCategories = ['Haberler', 'Kripto', 'Makroekonomi', 'Altın', 'Döviz', 'Borsa']; // Haberler için temel kategori
        
        if (isNewsMode) {
             // Haber Modu: Sadece Haber kategorilerini filtrele
             basePosts = basePosts.filter(p => allowedNewsCategories.includes(p.category));
        } else {
             // Blog Modu: Sadece Blog kategorilerini filtrele
             basePosts = basePosts.filter(p => allowedBlogCategories.includes(p.category));
        }
        
        if (activeCategoryKey === 'Tümü' || activeCategoryKey === (T?.news_category_all || 'Tümü')) {
            return basePosts;
        }
        
        // Seçili kategoriye göre filtrele
        return basePosts.filter(p => p.category === activeCategoryKey);
    }, [rawPosts, activeCategoryKey, isNewsMode, T]);

    if (isLoading || !T) {
        return <SkeletonLoader />;
    }
    if (error) {
        return <div className="min-h-screen bg-[#111827] flex justify-center items-center"><p className="text-red-400">Hata: {error.message}</p></div>;
    }
    
    // Haber sayfasında öne çıkan post göstermiyoruz (Daha akış odaklı)
    const featuredPost = !isNewsMode && filteredPosts.length > 0 ? filteredPosts[0] : null;
    const otherPosts = featuredPost ? filteredPosts.slice(1) : filteredPosts;
    
    // KRİTİK GÜNCELLEME: Dinamik Tema Stilleri
    const styles = getCategoryStyles(activeCategoryKey, themeColor);
    const headerBorderClass = themeColor === 'orange' ? 'border-orange-700/50' : 'border-indigo-700/50';
    const headerGlowClass = themeColor === 'orange' ? 'radial-gradient(ellipse at center, rgba(251, 146, 60, 0.1) 0%, rgba(17, 24, 39, 0) 70%)' : 'radial-gradient(ellipse at center, rgba(79, 70, 229, 0.1) 0%, rgba(17, 24, 39, 0) 70%)';
    const gridGlowClass = themeColor === 'orange' ? 'bg-grid-orange-500/10' : 'bg-grid-indigo-500/10';
    const headerTitleColor = themeColor === 'orange' ? 'text-orange-400' : 'text-indigo-400';


    return (
        <div className="w-full">
             <motion.section 
                className={`relative py-20 md:py-24 text-center overflow-hidden bg-gray-900/50 mb-12 border-b ${headerBorderClass}`}
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
                    
                    {/* KRİTİK GÜNCELLEME: Sekme Navigasyonu */}
                    {dynamicCategories.length > 1 && (
                        <div className="flex justify-center flex-wrap gap-3">
                            {dynamicCategories.map(category => (
                                <motion.button
                                    key={category.key}
                                    onClick={() => setActiveCategoryKey(category.key)}
                                    // KRİTİK DÜZELTME: Dinamik Sekme Stilleri
                                    className={`px-5 py-2.5 text-sm font-semibold rounded-full transition-all duration-300 transform hover:scale-[1.05] ${
                                        activeCategoryKey === category.key
                                        ? styles.activeCls
                                        : styles.inactiveCls
                                    }`}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.5 + dynamicCategories.indexOf(category) * 0.1 }}
                                >
                                    {category.label}
                                </motion.button>
                            ))}
                        </div>
                    )}
                </div>
            </motion.section>
            
            <div className="container mx-auto max-w-7xl px-4">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={activeCategoryKey} 
                        initial="hidden"
                        animate="visible"
                        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                    >
                        {featuredPost && (
                            <FeaturedBlogCard post={featuredPost} T={T} />
                        )}
                        
                        {otherPosts.map((post, index) => (
                            <BlogCard post={post} key={post.id} index={index} T={T} themeColor={themeColor} />
                        ))}
                    </motion.div>
                </AnimatePresence>
                
                {filteredPosts.length === 0 && (
                     <div className="text-center p-12 bg-gray-800/50 rounded-2xl border border-dashed border-gray-700 mt-8">
                        <Icon name="bell" className="w-12 h-12 text-yellow-400 mx-auto mb-4"/>
                        <p className="text-lg text-gray-400">Bu kategoride henüz yayınlanmış haber bulunmamaktadır.</p>
                     </div>
                )}
            </div>
        </div>
    );
};

export default BlogIndexClient;
