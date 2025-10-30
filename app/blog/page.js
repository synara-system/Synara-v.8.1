// path: app/blog/page.js
import React from 'react';
import BlogIndexClient from '@/components/blog/BlogIndexClient';
import { translations } from '@/data/translations';
// YENİ: Sunucu tarafı veri çekme fonksiyonu import edildi
import { getPosts } from '@/lib/blog-server';
// P13.0 FİX: Dinamik URL oluşturmak için getBaseUrl import edildi.
import { getBaseUrl } from '@/lib/trpc/utils';
// KRİTİK FİX: Header ve Footer kaldırıldı, layout'a bırakıldı.

// KRİTİK NİHAİ FİX: Force dynamic rendering to bypass aggressive Vercel/CDN caching.
// Bu, her istekte sayfanın yeniden oluşturulmasını garanti eder.
export const dynamic = 'force-dynamic'; 

/**
 * P13.0 FİX: Hardcoded (sabit) URL'ler dinamik hale getirildi ve OG imajı
 * placeholder yerine global imajla değiştirildi.
 */
export async function generateMetadata() {
    const T = translations.tr; 
    
    // P13.0 FİX: BASE_URL dinamik olarak alınmalı.
    const BASE_URL = getBaseUrl();
    
    // KRİTİK FİX: Sayfa başlığı artık çeviri dosyasından geliyor.
    const pageTitle = `${T.nav_blog} | Synara System`; 
    const pageDesc = T.blog_page_subtitle || "Sistem ve piyasalar üzerine en son analizler, eğitimler ve güncellemeler."; // Fallback eklendi
    
    // P13.0 FİX: URL dinamik hale getirildi.
    // HATA: const canonicalUrl = "https://synarasystem.com/blog";
    const canonicalUrl = `${BASE_URL}/blog`;
    
    // P13.0 FİX: İmaj, global OG imajı ile değiştirildi.
    // HATA: const uleImage = "https://placehold.co/1200x630/111827/4F46E5?text=SYNARA+ANALIZLER";
    const ogImageUrl = `${BASE_URL}/synara_og_image.png`;
    
    return {
        title: pageTitle,
        description: pageDesc,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title: pageTitle,
            description: pageDesc,
            url: canonicalUrl,
            images: [{ url: ogImageUrl, alt: pageTitle }], // P13.0 FİX
        },
        twitter: {
            card: 'summary_large_image',
            title: pageTitle,
            description: pageDesc,
            images: [ogImageUrl], // P13.0 FİX
        },
    };
}

// YENİ: Sayfa artık 'async' ve sunucuda veri çekiyor.
const BlogPage = async () => {
    const T = translations.tr;
    // Veriyi sunucu tarafında çek
    const posts = await getPosts();

    return (
        <div className="min-h-screen bg-[#111827] text-white">
            <BlogIndexClient 
                // Çekilen veriyi client component'e prop olarak gönder
                // KRİTİK DÜZELTME: Büyük başlık için T.blog_page_title_header kullanıldı.
                T={T}
                initialPosts={posts} 
                pageTitle={T.blog_page_title_header || "Synara Analiz ve Raporlar"} 
                pageSubtitle={T.blog_page_subtitle || "Sistem ve piyasalar üzerine en son analizler, eğitimler ve güncellemeler."}
            />
        </div>
    );
};

export default BlogPage;
