// path: app/blog/page.js
import React from 'react';
import BlogIndexClient from '@/components/blog/BlogIndexClient';
import { translations } from '@/data/translations';
// YENİ: Sunucu tarafı veri çekme fonksiyonu import edildi
import { getPosts } from '@/lib/blog-server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// KRİTİK FİX: Next.js'in Global CDN önbelleğini tamamen bypass etmek için
// Bu sayfayı Server-Side-Rendered (SSR) olarak zorla.
// Bu, her istekte sayfanın yeniden oluşturulmasını garanti eder ve eski içeriğin geri gelmesini engeller.
export const dynamic = 'force-dynamic'; 

export async function generateMetadata() {
    const T = translations.tr; 
    // KRİTİK FİX: Sayfa başlığı artık çeviri dosyasından geliyor.
    const pageTitle = `${T.nav_blog} | Synara System`; 
    const pageDesc = "Sistem ve piyasalar üzerine en son analizler, eğitimler ve güncellemeler.";
    const canonicalUrl = "https://synarasystem.com/blog";
    const uleImage = "https://placehold.co/1200x630/111827/4F46E5?text=SYNARA+ANALIZLER";
    
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
            images: [{ url: uleImage }],
        },
        twitter: {
            card: 'summary_large_image',
            title: pageTitle,
            description: pageDesc,
            images: [uleImage],
        },
    };
}

// YENİ: Sayfa artık 'async' ve sunucuda veri çekiyor.
const BlogPage = async () => {
    const T = translations.tr;
    // Veriyi sunucu tarafında çek
    const posts = await getPosts();

    return (
        <>
            <Header T={T} />
            <div className="min-h-screen bg-[#111827] text-white py-12 px-4">
                <BlogIndexClient 
                    // Çekilen veriyi client component'e prop olarak gönder
                    // KRİTİK DÜZELTME: Büyük başlık için T.blog_page_title_header kullanıldı.
                    initialPosts={posts}
                    pageTitle={T.blog_page_title_header} 
                    T={T}
                />
            </div>
            <Footer T={T} />
        </>
    );
};

export default BlogPage;
