// path: app/market-pulse/page.js
'use client';

// React ve AuthContext (sadece 'T' için) import edildi
import React from 'react'; 
import { useAuth } from '@/context/AuthContext';

// Market Ticker ve Yeni MemberDashboard import edildi
import MarketTicker from '@/components/blog/MarketTicker'; 
import MemberDashboard from '@/components/market/MemberDashboard';

// GÜNCELLENDİ: Güvenlik ve yönlendirme için zorunlu auth hook'u
import { useRequiredAuth } from '@/hooks/useRequiredAuth';
// GÜNCELLENDİ: Yükleme ekranı için SkeletonLoader eklendi
import SkeletonLoader from '@/components/SkeletonLoader';

// === KRİTİK DÜZELTME (DRY FIX): WIDGET_BASE_CLASSES ARTIK IMPORT EDİLİYOR ===
// Yerel tanım kaldırıldı, MemberDashboard'dan import ediliyor.
import { WIDGET_BASE_CLASSES } from '@/components/market/MemberDashboard';
// === KRİTİK DÜZELTME SONU ===


// --- ANA KOMPONENT ---
export default function MarketPulsePage() {
    // Çeviriler (T) alındı
    const { T } = useAuth();
    
    // 'useRequiredAuth' hook'u 'requireSubscription: true' parametresi ile
    // hem oturumu hem de aktif aboneliği kontrol eder.
    const { user, loading } = useRequiredAuth({ requireSubscription: true });

    // Fütüristik Arka Plan ve Düzenleme
    return (
        <div className="min-h-screen bg-[#060914] text-white overflow-x-hidden relative p-4 md:p-8">
            {/* Holografik Grid Arka Plan Efekti */}
            <div className="absolute inset-0 bg-grid-indigo-500/10 bg-[size:3rem_3rem] opacity-30"></div>
            <div className="absolute inset-0" style={{
                    background: 'radial-gradient(ellipse at center, rgba(30, 64, 175, 0.1) 0%, rgba(6, 9, 20, 1) 70%)' 
                }}></div>
            
            {/* max-w-7xl ile sayfa genişletildi */}
            <div className="container max-w-7xl mx-auto relative z-10">
                {/* Başlık ve Alt Başlık */}
                <h1 className="text-3xl md:text-4xl font-bold mb-3 text-center text-cyan-400 tracking-wider">
                     {T.market_pulse_page_title || "SYNARA KOMUTA MERKEZİ"}
                </h1>
                <p className='text-center text-gray-400 mb-8 max-w-3xl mx-auto'>
                    {T.market_pulse_page_subtitle || "Synara'nın Holistik Zeka Matrisi'nden anlık piyasa nabzı, duyarlılık haritaları ve kritik anomali uyarıları."}
                </p>
                
                {/* Market Ticker Bandı */}
                <div className="w-full mb-8 overflow-x-auto">
                    <MarketTicker T={T} /> 
                </div>

                {/* Yükleme Kontrolü */}
                { (loading || !user) ? (
                    // WIDGET_BASE_CLASSES artık import edildi.
                    <div className={WIDGET_BASE_CLASSES.replace('p-6', 'p-4') + " h-96"}>
                         <SkeletonLoader count={8} />
                    </div>
                ) : (
                    // Yükleme tamamlandıysa ve kullanıcı yetkiliyse Dashboard'u render et
                    <MemberDashboard />
                )}


                <div className='mt-16 text-center text-gray-500 text-sm'>
                    {T.market_pulse_disclaimer || "Bu veriler yalnızca bilgilendirme amaçlıdır ve yatırım tavsiyesi değildir."}
                </div>
            </div>

            {/* Global Stiller (Mevcut yapı korundu) */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #6366f1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #1f2937; }
            `}</style>
        </div>
    );
}
