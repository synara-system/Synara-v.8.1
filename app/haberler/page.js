// path: app/haberler/page.js
import React from 'react';
import { translations } from '@/data/translations';
import dynamic from 'next/dynamic'; // Dynamic import eklendi
import SkeletonLoader from '@/components/SkeletonLoader';

const BlogIndexClient = dynamic(() => import('@/components/blog/BlogIndexClient'), { 
    ssr: false, // Client tarafında çalışması için 
    loading: () => <SkeletonLoader />, 
});


/**
 * Server Component'te SEO için metadata fonksiyonu kullanılır
 */
export async function generateMetadata() {
    const T = translations.tr; 
    
    // KRİTİK GÜNCELLEME: Yeni başlık ve açıklama kullanıldı
    const pageTitle = `${T.news_page_title} | Synara System`; 
    const pageDesc = T.news_page_subtitle;
    const canonicalUrl = "https://synarasystem.com/haberler";
    const uleImage = "https://placehold.co/1200x630/111827/4F46E5?text=SYNARA+TRADER+HABERLER";
    
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

/**
 * Haberler Ana Sayfası (Server Component)
 */
const HaberlerPage = () => {
    const T = translations.tr;
    
    // Yeni ve genişletilmiş sekmeleri tanımla (Bunlar, blog yazılarındaki `category` alanıyla eşleşmelidir)
    const newsCategories = [
        { key: 'Tümü', label: T.news_category_all },
        // Blog yazılarındaki Category alanına karşılık gelenler
        { key: 'Haberler', label: T.news_category_crypto },
        { key: 'Makroekonomi', label: T.news_category_macro },
        { key: 'Altın', label: T.news_category_gold },
        { key: 'Döviz', label: T.news_category_forex },
        { key: 'Borsa', label: T.news_category_stock },
        { key: 'Güncelleme', label: T.news_category_system },
    ];
    

    return (
        <div className="min-h-screen bg-[#111827] text-white py-12 px-4">
             <BlogIndexClient 
                // Haberler sayfasının özelleştirilmiş başlık ve alt başlıklarını kullan.
                pageTitle={T.news_page_title}
                pageSubtitle={T.news_page_subtitle}
                // Artık filtreleme için bu kategorileri kullanacağız.
                customCategories={newsCategories}
                // Bu modda filtreleme yapılmasını zorunlu kılıyoruz.
                isNewsMode={true} 
                // Haber teması için kırmızı/turuncu (orange) rengi kullan
                themeColor="orange"
             />
        </div>
    );
};

export default HaberlerPage;
