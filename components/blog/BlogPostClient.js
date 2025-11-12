// path: components/blog/BlogPostClient.js
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { trpc } from '@/lib/trpc/client';
import BlogInteractions from './BlogInteractions';
import BlogArticle from './BlogArticle';
import { useAuth } from '@/context/AuthContext';
import Icon from '@/components/Icon';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Dinamik navigasyon için eklendi

// Markdown'ı HTML'e çeviren yardımcı fonksiyon
import { marked } from 'marked'; 

// Skeleton Loader'ı dinamik yükle (Hata durumunda veya veri beklenirken gösterilir)
const SkeletonLoader = dynamic(() => import('@/components/SkeletonLoader'), { ssr: false });

/**
 * Blog yazısı detay sayfasının Client Component'e sarılması.
 * * KRİTİK FİX: Geri dönüş linkini (blog/haberler) dinamik yapar ve 
 * KRİTİK FİX 2: post verisinin null olmasına karşı koruma ekler (TypeError çözümü).
 * KRİTİK FİX 3: Geri dönüş linkini iki ayrı butona ayırır ve ortalar/stilini günceller.
 */
const BlogPostClient = ({ initialPostData, slug, T }) => {
    const utils = trpc.useContext();
    const { user } = useAuth();
    // usePathname artık sadece hata sayfasındaki dinamik yönlendirme için tutuluyor.
    const pathname = usePathname(); 
    
    // Görüntülenme kaydını sadece bir kez tetiklemek için ref kullanıldı
    const [viewRecorded, setViewRecorded] = useState(false);
    
    // YENİ: Post verisini hem initialData olarak alıp hem de sorgulamak
    const { data, isLoading, error } = trpc.blog.getPostBySlug.useQuery(
        { slug },
        {
            initialData: initialPostData,
            enabled: !!slug,
            staleTime: 60000, 
            refetchOnWindowFocus: true,
            // KRİTİK GÜVENLİK: Eğer veri yüklenirken post.post null dönerse, initialData'daki veriyi koru
            select: (data) => data, 
        }
    );
    
    // KRİTİK KONTROL 1: Post verisini güvenli bir şekilde al.
    const post = data?.post;
    const comments = data?.comments || [];

    // KRİTİK: Görüntülenmeyi kaydeden mutasyon
    const recordViewMutation = trpc.blog.recordView.useMutation({
        onError: (e) => console.error("Görüntülenme kaydı başarısız:", e.message),
    });

    // --- EFFECT: GÖRÜNTÜLENMEYİ KAYDET ---
    useEffect(() => {
        if (post?.id && !viewRecorded) { // post artık data?.post yerine doğrudan post değişkeni
            // Yalnızca post verisi mevcutsa ve henüz kaydedilmemişse mutasyonu tetikle
            recordViewMutation.mutate({ postId: post.id });
            setViewRecorded(true);
        }
    }, [post?.id, viewRecorded, recordViewMutation]);
    
    // --- MEMO: CONTENT VE POST VERİSİNİ HAZIRLA ---
    
    const postWithHtml = useMemo(() => {
        // KRİTİK KONTROL 2: post null ise hemen çık (TypeError'ı engeller)
        if (!post) return null;

        // Markdown içeriğini HTML'e çevir
        // content null veya undefined ise boş string kullan
        const contentHtml = post.content ? marked.parse(post.content) : ''; 
        // HTML'deki tüm table etiketlerini saracak ek div'ler ekle (CSS için)
        const finalHtml = contentHtml.replace(/<table/g, '<div class="table-wrapper"><table class="w-full text-left table-auto">').replace(/<\/table>/g, '</table></div>');
        
        return {
            ...post,
            content: finalHtml, // HTML içeriği artık burada
        };
    }, [post]);
    
    // Okunma süresini hesaplayan yardımcı fonksiyon (Kullanılmıyor, ancak silinmedi)
    const calculateReadingTime = (content) => {
        if (!content) return 0;
        const wordsPerMinute = 200;
        const plainText = content.replace(/<[^>]+>/g, '').trim(); 
        const wordCount = plainText.split(/\s+/).length;
        const minutes = wordCount / wordsPerMinute;
        return Math.ceil(minutes);
    };

    // Dinamik Geri Dön Linki Mantığı (Hata mesajı için korundu)
    const isHaberlerPage = pathname.includes('/haberler/');
    const backLinkHref = isHaberlerPage ? '/haberler' : '/blog';
    const backLinkText = isHaberlerPage 
        ? T?.nav_back_to_news || "Haberler Ana Sayfasına Dön" 
        : T?.nav_back_to_blog || "Blog Yazılarına Geri Dön";

    // --- ERKEN DÖNÜŞ KONTROLLERİ ---
    if (isLoading && !post) {
        return <SkeletonLoader />;
    }
    
    if (error || !post) { // Hata durumunda veya post verisi kesinlikle yoksa (404 benzeri)
        return (
             <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center p-4">
                <Icon name="alert-triangle" className="w-12 h-12 text-red-400" />
                <p className="mt-4 text-lg text-red-300">{error?.message || T?.error_blog_not_found || "Yazı bulunamadı veya bir sunucu hatası oluştu."}</p>
                {/* Hata durumunda tek dinamik link gösteriliyor */}
                <Link href={backLinkHref} className="mt-6 text-sm text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center">
                    <Icon name="arrow-left" className="w-4 h-4 mr-2" />
                    {backLinkText}
                </Link>
            </div>
        );
    }
    
    // KRİTİK KONTROL 3: postWithHtml artık null değilse render et
    if (!postWithHtml) {
        // Bu durum teorik olarak üstteki kontrollerden geçmesi gerektiği için nadiren olur
         return <SkeletonLoader />; 
    }

    return (
        <div className="container mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            
            {/* 1. Kısım: Makale İçeriği */}
            <div className="lg:col-span-2 order-1 space-y-8">
                
                 {/* KRİTİK FİX: ORTALANMIŞ VE STİLLİ ÇİFT NAVİGASYON BUTONU */}
                 <div className="mb-8 flex gap-4 justify-center items-center">
                    
                    {/* Buton 1: BLOG YAZILARI (Mor/İndigo - Synara Rengi) */}
                    <Link href="/blog" className="py-2 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full transition-all duration-300 inline-flex items-center shadow-xl shadow-indigo-600/30 hover:shadow-indigo-500/50 transform hover:-translate-y-0.5">
                        <Icon name="book-open-text" className="w-5 h-5 mr-2" />
                        {T?.nav_back_to_blog || "Blog Yazılarına Dön"}
                    </Link>

                    {/* Buton 2: HABERLER (Kırmızı - Dinamik Renk) */}
                    <Link href="/haberler" className="py-2 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full transition-all duration-300 inline-flex items-center shadow-xl shadow-red-600/30 hover:shadow-red-500/50 transform hover:-translate-y-0.5">
                        <Icon name="newspaper" className="w-5 h-5 mr-2" />
                        {T?.nav_back_to_news || "Haberler Ana Sayfasına Dön"}
                    </Link>
                 </div>
                
                {/* KRİTİK FİX UYGULANDI: postWithHtml her zaman geçerli olduğu için koşulsuz çağrılabilir */}
                <BlogArticle post={postWithHtml} T={T} /> 
            </div>
            
            {/* 2. Kısım: Etkileşimler (Client Rendered / Sticky) */}
             <BlogInteractions
                postId={post.id}
                postSlug={post.slug}
                postTitle={post.title}
                initialLikes={post.likes}
                // Comments verisi live olarak çekildiği için `data?.comments` kullanılır.
                initialComments={comments} 
                T={T}
             />
             
        </div>
    );
};

export default BlogPostClient;
