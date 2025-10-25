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

// Markdown'ı HTML'e çeviren yardımcı fonksiyon
import { marked } from 'marked'; 

// Skeleton Loader'ı dinamik yükle (Hata durumunda veya veri beklenirken gösterilir)
const SkeletonLoader = dynamic(() => import('@/components/SkeletonLoader'), { ssr: false });

/**
 * Blog yazısı detay sayfasının Client Component'e sarılması.
 * Temel görevi:
 * 1. Post verisini çekmek ve güncel tutmak (Comments, Likes, Views).
 * 2. `recordView` mutasyonunu sadece bir kez tetikleyerek görüntülenmeyi kaydetmek.
 * 3. Sunucu tarafında çekilen verinin (postData) client'ta yeniden sorgulanmasını sağlamak.
 * 4. KRİTİK: Başlık ve meta bilgileri render etme sorumluluğunu tamamen BlogArticle'a bırakır.
 */
const BlogPostClient = ({ initialPostData, slug, T }) => {
    const utils = trpc.useContext();
    const { user } = useAuth();
    
    // Görüntülenme kaydını sadece bir kez tetiklemek için ref kullanıldı
    const [viewRecorded, setViewRecorded] = useState(false);
    
    // YENİ: Post verisini hem initialData olarak alıp hem de sorgulamak
    const { data, isLoading, error } = trpc.blog.getPostBySlug.useQuery(
        { slug },
        {
            initialData: initialPostData,
            enabled: !!slug,
            staleTime: 60000, // Post içeriği nadiren değişeceği için 1 dakika süre verildi
            refetchOnWindowFocus: true,
        }
    );
    
    // KRİTİK: Görüntülenmeyi kaydeden mutasyon
    const recordViewMutation = trpc.blog.recordView.useMutation({
        onError: (e) => console.error("Görüntülenme kaydı başarısız:", e.message),
    });

    // --- EFFECT: GÖRÜNTÜLENMEYİ KAYDET ---
    useEffect(() => {
        if (data?.post?.id && !viewRecorded) {
            // Yalnızca post verisi mevcutsa ve henüz kaydedilmemişse mutasyonu tetikle
            recordViewMutation.mutate({ postId: data.post.id });
            setViewRecorded(true);
        }
    }, [data?.post?.id, viewRecorded, recordViewMutation]);
    
    // --- MEMO: CONTENT VE POST VERİSİNİ HAZIRLA ---
    const post = data?.post;
    const comments = data?.comments || [];
    
    const postWithHtml = useMemo(() => {
        if (!post) return null;
        // Markdown içeriğini HTML'e çevir
        const contentHtml = post.content ? marked.parse(post.content) : '';
        // HTML'deki tüm table etiketlerini saracak ek div'ler ekle (CSS için)
        const finalHtml = contentHtml.replace(/<table/g, '<div class="table-wrapper"><table class="w-full text-left table-auto">').replace(/<\/table>/g, '</table></div>');
        
        return {
            ...post,
            content: finalHtml, // HTML içeriği artık burada
            // `BlogArticle` component'i bu yapıyı kullanacak şekilde güncellendi.
        };
    }, [post]);
    
    // Okunma süresini hesaplayan yardımcı fonksiyon
    // Sadece iskelet render (loading) için tutuldu, kullanılmıyor.
    // Ancak hata olmaması için bu fonksiyonda değişiklik yapılmadı.
    const calculateReadingTime = (content) => {
        if (!content) return 0;
        const wordsPerMinute = 200;
        // HTML etiketlerini temizleyerek kelime sayısını bul
        const plainText = content.replace(/<[^>]+>/g, '').trim(); 
        const wordCount = plainText.split(/\s+/).length;
        const minutes = wordCount / wordsPerMinute;
        return Math.ceil(minutes);
    };

    if (isLoading || !T || !post) {
        return <SkeletonLoader />; 
    }
    
    if (error) {
        return (
             <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center p-4">
                <Icon name="alert-triangle" className="w-12 h-12 text-red-400" />
                <p className="mt-4 text-lg text-red-300">{error.message || "Yazı yüklenirken hata oluştu."}</p>
                <Link href="/blog" className="mt-6 text-sm text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center">
                    <Icon name="arrow-left" className="w-4 h-4 mr-2" />
                    Tüm Yazılara Geri Dön
                </Link>
            </div>
        );
    }
    
    // KRİTİK: Başlık ve meta bilgileri için bu client component artık sadece navigasyonu tutacak.
    
    return (
        <div className="container mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            
            {/* 1. Kısım: Makale İçeriği */}
            <div className="lg:col-span-2 order-1 space-y-8">
                
                 {/* KRİTİK FİX: ÇİFT BAŞLIK SORUNU GİDERİLDİ. 
                     Buradaki h1, summary ve meta bilgileri kaldırıldı. 
                     Sadece BlogArticle içinde render edilecekler. 
                 */}

                 {/* Geri Dön Linki - Navigasyon elemanı olarak korundu */}
                 <div className="mb-8 flex justify-between items-center">
                    <Link href="/blog" className="text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center">
                        <Icon name="arrow-left" className="w-4 h-4 mr-2" />
                        {T?.nav_back_to_blog || "Tüm Yazılara Geri Dön"}
                    </Link>
                 </div>
                
                {/* BlogArticle'ın içeriği postWithHtml'den çekilir */}
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
