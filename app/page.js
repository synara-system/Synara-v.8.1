// path: app/page.js
import React, { useMemo } from 'react';
import { translations } from '@/data/translations';
import dynamic from 'next/dynamic';
import Link from 'next/link'; 
import Icon from '@/components/Icon'; 
import Image from 'next/image';
import SkeletonLoader from '@/components/SkeletonLoader'; 
import { getBaseUrl } from '@/lib/trpc/utils'; // BASE_URL için eklendi

// --- Client Component Importları ---
import { HeroClient } from '@/components/home/HeroAndStatsClient'; 

const TickerBarClient = dynamic(() => import('@/components/home/StatsBarClient'), { 
    ssr: false, 
    loading: () => <SkeletonLoader /> 
}); 

const InteractiveModuleClient = dynamic(() => import('@/components/home/InteractiveModuleClient'), { 
    ssr: false, 
    loading: () => <SkeletonLoader /> 
});

const PricingSectionClient = dynamic(() => import('@/components/home/PricingSectionClient'), { 
    ssr: false, 
    loading: () => <SkeletonLoader /> 
});

const FaqSectionClient = dynamic(() => import('@/components/home/FaqSectionClient'), { 
    ssr: false, 
    loading: () => <SkeletonLoader /> 
});

const ContactSectionClient = dynamic(() => import('@/components/home/ContactSectionClient'), { 
    ssr: false, 
    loading: () => <SkeletonLoader /> 
});

const MarketSessionsGlobe = dynamic(() => import('@/components/home/MarketSessionsGlobe'), { 
    ssr: false, 
    loading: () => <div className="h-[400px] w-full bg-gray-900/50 rounded-xl animate-pulse flex items-center justify-center">Küresel Harita Yükleniyor...</div> 
});

const MarketTimeline = dynamic(() => import('@/components/home/MarketTimeline'), { 
    ssr: false, 
    loading: () => <div className="h-24 w-full bg-gray-900/50 rounded-xl animate-pulse">Zaman Tüneli Yükleniyor...</div> 
});

// KRİTİK EKLENTİ: FAQPage Schema Generator (Sunucu Tarafında)
const generateFaqSchema = () => {
    // Soru-Cevap verileri (FaqSectionClient.js'dekiyle eşleşmeli)
    const faqs = [
        { q: "Synara sinyalleri geriye dönük değişir mi (Repaint İllüzyonu)?", a: "**Kesinlikle Hayır.** Synara&apos;nın çekirdek felsefesi olan **Anchor TF Kapanış Protokolü** sayesinde sinyallerimiz bar kapandıktan sonra mühürlenir ve bu karar teknik olarak değiştirilemez. **Repaint sorununa karşı kurumsal garantidir.**" },
        { q: "Synara&apos;nın performansı geçmiş verilerle mi hesaplanmıştır?", a: "Hayır. Performans ve simülasyonlarımız, **canlı piyasa koşullarına** göre ayarlanmış, **Holistic Intelligence Matrix (HIM)** yapısına dayanır. Geçmiş veriye değil, anlık teyitli disipline odaklanıyoruz." },
        { q: "Aboneliğimi dilediğim zaman iptal edebilir miyim?", a: "Evet. Aboneliğinizi dilediğiniz zaman, herhangi bir ek taahhüt olmaksızın iptal edebilirsiniz. Erişiminiz, ödemesini yaptığınız dönemin sonuna kadar devam edecektir." },
        { q: "Synara Engine hangi piyasalarda (Kripto, Forex vb.) çalışır?", a: "Synara, piyasadan bağımsız, **saf fiyat hareketi ve likidite** mantığı üzerine kurulmuştur. Bu sayede **kripto, forex, emtia ve hisse senedi** piyasalarında aynı disiplinle çalışır." },
    ];

    const faqItems = faqs.map(faq => ({
        "@type": "Question",
        "name": faq.q.replace(/&apos;/g, "'"), // HTML kaçışlarını temizle
        "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.a.replace(/&apos;/g, "'") // HTML kaçışlarını temizle
        }
    }));

    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqItems
    };
};


// KRİTİK EKLENTİ: Ana Sayfa SEO Metadata
export async function generateMetadata() {
    const T = translations.tr; 
    const URL = getBaseUrl();
    const pageTitle = T.seo_default_title; 
    const pageDesc = T.seo_default_description;
    const canonicalUrl = URL;
    const uleImage = `${URL}/og-image.png`;
    
    return {
        title: pageTitle,
        description: pageDesc,
        // KRİTİK: Kanonik link eklendi
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


// --- ANA SAYFA (SERVER COMPONENT) ---
const HomePage = ({ T }) => {
    
    // Schema'yı server component'te render et
    const faqSchema = useMemo(() => JSON.stringify(generateFaqSchema()), []);
    
    return (
        <main>
             {/* KRİTİK EKLEME: FAQPage Schema JSON-LD */}
             <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: faqSchema,
                }}
            />

            {/* 1. HERO */}
            <HeroClient T={T} />
            
            {/* KRİTİK DÜZELTME: Statik istatistik çubuğu yerine kayar bant eklendi */}
            <TickerBarClient T={T} />
            
            {/* 2. MODÜL IZGARASI */}
            <InteractiveModuleClient T={T} />
            
            {/* 3. DİNAMİK DÜNYA VE ZAMAN TÜNELİ */}
            <MarketSessionsGlobe T={T} />
            <MarketTimeline T={T} />
            
            {/* 4. PRICING */}
            <PricingSectionClient T={T} />
            
            {/* 5. FAQ */}
            <FaqSectionClient T={T} />
            
            {/* 6. CONTACT */}
            <ContactSectionClient T={T} />
        </main>
    );
};

export default function IndexPageWrapper() {
    const T = translations.tr; 
    return <HomePage T={T} />;
}
