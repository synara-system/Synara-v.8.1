// path: app/dashboard/page.js
import DashboardClient from './DashboardClient';
import { translations } from '@/data/translations';

// Next.js Sunucu Bileşeni (Server Component) olarak meta veriyi güvenle dışa aktarıyoruz.
// Bu dosya 'use client' içermediği için bu işlem artık hata vermeyecektir.

// --- SEO GÜVENLİK PROTOKOLÜ: NOINDEX ---
export async function generateMetadata() {
    // Çeviri verisini sunucu tarafında çek
    const T = translations.tr;
    
    return {
        title: T.nav_dashboard + " | Synara System",
        description: T.dashboard_meta_description || "Kullanıcı paneli ve bütünsel risk izleme sistemi.",
        // KRİTİK FİX: Oturum gerektiren sayfaların dizine eklenmesini engelle
        robots: {
            index: false,
            follow: false,
        },
    };
}

const DashboardPageServer = () => {
    // DashboardClient, tüm 'use client' mantığını içerir ve burada çağrılır.
    return <DashboardClient />;
};

export default DashboardPageServer;
