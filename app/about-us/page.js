// path: app/about-us/page.js
import React from 'react';
import dynamic from 'next/dynamic';
import { translations } from '@/data/translations';
import Icon from '@/components/Icon';
import Link from 'next/link';
import SkeletonLoader from '@/components/SkeletonLoader'; // YENİ: Yükleyici eklendi

// Client Component'i SSR'sız (sunucu tarafında render edilmeden) yükle
const DynamicAboutUsClient = dynamic(() => import('@/components/about/AboutUsClient'), {
    ssr: false,
    // KRİTİK FİX: Yükleme sırasında görsel bütünlüğü korumak için yükleyici kullanıldı
    loading: () => <SkeletonLoader />,
});

export async function generateMetadata() {
    const T = translations.tr;
    const pageTitle = `${T.nav_about_us} | Synara System`;
    // KRİTİK HATA DÜZELTMESİ: 'about_us_hero_subtitle' anahtarı 'about_us_section1_desc' ile değiştirildi.
    const pageDesc = (T.about_us_section1_desc || "Synara System'in arkasındaki felsefe ve teknoloji.").substring(0, 157) + '...';
    const canonicalUrl = "https://synarasystem.com/about-us";
    const uleImage = "https://placehold.co/1200x630/FFCC00/111827?text=MESTEG+TEKNOLOJI+YAPISAL+DISIPLIN";

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

const AboutUsPage = () => {
    const T = translations.tr;

    return (
        <div className="bg-[#111827] text-white pt-16">

            <section id="founder-message" className="relative py-20 md:py-32 text-center overflow-hidden bg-gray-900 min-h-[400px] flex items-center justify-center">

                <div className="absolute inset-0 holographic-grid opacity-20"></div>
                <div className="absolute inset-0" style={{
                    background: 'radial-gradient(ellipse at center, rgba(255, 204, 0, 0.15) 0%, rgba(17, 24, 39, 0) 70%)'
                }}></div>

                <div className="container mx-auto px-6 relative z-10">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-8 max-w-4xl mx-auto">
                        Mesteg Teknoloji: <span className="text-yellow-400">Yapısal Disiplin Merkezi</span>
                    </h1>

                    <Link href="#kurumsal-degerler" className="inline-flex items-center justify-center gap-4 bg-yellow-600/90 text-gray-900 font-extrabold text-lg px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:bg-yellow-500 shadow-2xl shadow-yellow-900/50">
                        <Icon name="mesteg" className="w-8 h-8 text-gray-900" />
                        <span className="tracking-wider">KURUMSAL VİZYONU KEŞFET</span>
                        <Icon name="arrow-right" className="w-5 h-5 text-gray-900"/>
                    </Link>

                    <p className="text-sm text-gray-500 mt-6 max-w-2xl mx-auto">
                        Synara System, Mesteg Teknoloji&apos;nin sistem mühendisliği felsefesi üzerine inşa edilmiştir.
                    </p>
                </div>
            </section>

            {/* KRİTİK DÜZELTME: DynamicAboutUsClient kullanılır */}
            <DynamicAboutUsClient T={T} />
        </div>
    );
};

export default AboutUsPage;
