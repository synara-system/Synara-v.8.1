// path: app/page.js
import React from 'react'; // useMemo kaldırıldığı için artık tek başına yeterli
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


// KRİTİK EKLENTİ: Ana Sayfa SEO Metadata (GÜNCEL VE GÜVENLİ)
export async function generateMetadata() {
    // KRİTİK GÜVENLİK FİXİ: BASE_URL boş gelirse çökmeyi engellemek için yedek (fallback) URL kullanıldı.
    const SAFE_BASE_URL = getBaseUrl() || 'https://synara.com';
    
    // SEMRUSH FİX: Optimize edilmiş statik metinler
    const pageTitle = "Synara System: Kripto ve Finans İçin Yapay Zeka Sinyalleri & Analiz Platformu";
    const pageDesc = "Karmaşık Piyasaları Tek Bir Karara İndirgeyin. Synara, alım satım kararlarınız için bar kapanışında teyitli, güvenilir sinyaller ve derinlemesine analizler sunar. Hemen keşfedin.";
    
    const canonicalUrl = SAFE_BASE_URL;
    const uleImage = `${SAFE_BASE_URL}/og-1920x1080.png`; 
    
    return {
        // SEMRUSH FİX: Title ve Description güncellendi
        title: pageTitle,
        description: pageDesc,
        // KRİTİK: Kanonik link eklendi (Güvenli URL kullanıldı)
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title: pageTitle,
            description: pageDesc,
            url: canonicalUrl,
            images: [{ 
                url: uleImage,
                width: 1920,
                height: 1080,
                alt: 'Synara System Yapay Zeka Analizi'
            }],
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
    
    // KRİTİK TEMİZLİK: useMemo, Server Component'te gereksiz olduğu için kaldırıldı.
    const faqSchema = JSON.stringify(generateFaqSchema());
    
    return (
        <main>
             {/* KRİTİK EKLEME: FAQPage Schema JSON-LD */}
             <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: faqSchema,
                }}
            />
            {/* H1 KONTROL NOTU: Semrush'un H1 hatasını çözmek için,
               HeroClient bileşeninde tek bir <h1> etiketinin kullanıldığından emin olunmalıdır. 
               Bu dosyada sadece Meta Title ve Description düzeltilmiştir.
            */}

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
