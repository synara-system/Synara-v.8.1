// path: app/vision/page.js
import React from 'react';
import { translations } from '@/data/translations';
import Icon from '@/components/Icon';
import dynamic from 'next/dynamic';

const VisionClient = dynamic(() => import('@/components/vision/VisionClient.js'), {
    ssr: false,
    loading: () => <div className="min-h-screen bg-[#111827] flex justify-center items-center"><p>Sistem Vizyonu Analiz Ediliyor...</p></div>
});


export async function generateMetadata() {
    const T = translations.tr;
    const pageTitle = `${T.nav_vision}: Bütünsel Zeka Mimarisi | Synara System`;
    const pageDesc = T.vision_hero_subtitle + " Donanım disiplininden piyasa kaosunu sisteme dönüştüren yolculuk.";
    
    return {
        title: pageTitle,
        description: pageDesc,
        alternates: {
            canonical: "https://synarasystem.com/vision",
        },
        openGraph: {
            title: pageTitle,
            description: pageDesc,
            url: "https://synarasystem.com/vision",
            images: [{ url: "https://placehold.co/1200x630/111827/FFCC00?text=SYNARA+S%C4%B0STEM+V%C4%B0ZYONU" }],
        },
    };
}

const VisionPage = () => {
    const T = translations.tr;

    return (
        <div className="bg-[#111827] text-white">
            <section className="relative py-20 md:py-32 text-center overflow-hidden bg-gray-900">
                <div className="absolute inset-0 holographic-grid opacity-30"></div>
                <div className="absolute inset-0" style={{
                    background: 'radial-gradient(ellipse at center, rgba(255, 204, 0, 0.15) 0%, rgba(17, 24, 39, 0) 70%)'
                }}></div>

                <div className="container mx-auto px-6 relative">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4">
                        <span className="text-yellow-400">{T.vision_page_title}</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
                        {T.vision_hero_subtitle}
                    </p>
                    <p className='text-md font-bold text-indigo-400 mt-6'>
                        {'"Disiplin, Duyguya Üstün Gelir. Piyasa Karmaşasını Sisteme Dönüştür."'}
                    </p>
                </div>
            </section>

            <VisionClient T={T} />
        </div>
    );
};

export default VisionPage;
