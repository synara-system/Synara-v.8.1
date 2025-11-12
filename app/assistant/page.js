// path: app/assistant/page.js
import React from 'react';
import SynaraAssistantClient from '@/components/SynaraAssistantClient';
import { translations } from '@/data/translations';

/**
 * Server Component'te SEO için metadata fonksiyonu kullanılır
 */
export async function generateMetadata() {
    const T = translations.tr;
    const pageTitle = `${T.nav_assistant || 'Synara AI Asistan'} | Bütünsel Zeka Sohbet Protokolü`;
    const pageDesc = "Synara Asistan ile sistemin mimarisi, modüller ve piyasa felsefesi hakkında sohbet edin.";
    
    return {
        title: pageTitle,
        description: pageDesc,
        alternates: {
            canonical: "https://synarasystem.com/assistant",
        },
    };
}

/**
 * Synara Asistan Ana Sayfası (Server Component)
 * Değişiklik: Tam ekran (h-screen) istemci bileşenini desteklemek için min-h-screen ve flex-col eklendi.
 */
const AssistantPage = () => {
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            <SynaraAssistantClient />
        </div>
    );
};

export default AssistantPage;
