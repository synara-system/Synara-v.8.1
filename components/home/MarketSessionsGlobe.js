// path: components/home/MarketSessionsGlobe.js
'use client';

// FİX: Kullanılmayan 'useMemo' ve 'Icon' import'ları kaldırıldı.
import React, { useState, useEffect } from 'react';

// Saat ve gün bilgilerini Türkiye saatine göre (UTC+3) alan yardımcı fonksiyon
const getTurkeyTime = () => {
    const now = new Date();
    // Türkiye saat dilimine göre ayarla (UTC+3)
    const turkeyTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
    return {
        day: turkeyTime.getDay(), // 0=Pazar, 1=Pazartesi...
        hour: turkeyTime.getHours(),
        minute: turkeyTime.getMinutes()
    };
};

// New York için Yaz Saati Uygulamasının (DST) geçerli olup olmadığını kontrol eder.
// Mart'ın ikinci Pazar'ı başlar, Kasım'ın ilk Pazar'ı biter.
const isNewYorkDST = (date) => {
    const year = date.getFullYear();
    // Mart'ın ikinci Pazar'ını bul
    const marchStart = new Date(year, 2, 1);
    const firstSundayMarch = 7 - marchStart.getDay() + 1;
    const secondSundayMarch = firstSundayMarch + 7;
    const dstStartDate = new Date(year, 2, secondSundayMarch, 2); // 02:00'de başlar

    // Kasım'ın ilk Pazar'ını bul
    const novStart = new Date(year, 10, 1);
    const firstSundayNov = 7 - novStart.getDay() + 1;
    const dstEndDate = new Date(year, 10, firstSundayNov, 2); // 02:00'de biter

    return date >= dstStartDate && date < dstEndDate;
};


const MarketSessionsGlobe = ({ T }) => {
    const [activeMarkets, setActiveMarkets] = useState({
        asya: false,
        londra: false,
        newyork: false,
    });

    useEffect(() => {
        const updateMarketStatus = () => {
            const { day, hour, minute } = getTurkeyTime();
            const now = new Date(); // DST kontrolü için güncel tarih

            // New York açılış saatini DST'ye göre belirle
            const nyOpenHour = isNewYorkDST(now) ? 15 : 16;
            const nyOpenMinute = isNewYorkDST(now) ? 30 : 30; // Yaz/Kış 16:30
            const nyCloseHour = isNewYorkDST(now) ? 24 : 1; // Yaz 24:00, Kış 01:00

            const isWeekday = day >= 1 && day <= 5; // Pazartesi - Cuma

            const sessions = {
                asya: isWeekday && hour >= 2 && hour < 10, // 02:00 - 10:00
                londra: isWeekday && hour >= 11 && hour < 19, // 11:00 - 19:00
                newyork: isWeekday && 
                         ((hour > nyOpenHour || (hour === nyOpenHour && minute >= nyOpenMinute)) && hour < nyCloseHour)
            };
            
            // Cuma günü New York kapanışı
            if (day === 5) {
                sessions.newyork = (hour > nyOpenHour || (hour === nyOpenHour && minute >= nyOpenMinute)) && hour < (isNewYorkDST(now) ? 24: 1);
            }


            setActiveMarkets(sessions);
        };

        updateMarketStatus();
        const interval = setInterval(updateMarketStatus, 1000 * 60); // Her dakika kontrol et

        return () => clearInterval(interval);
    }, []);

    const markets = [
        { name: 'Asya', top: '42%', left: '85%', active: activeMarkets.asya },
        { name: 'Londra', top: '35%', left: '48%', active: activeMarkets.londra },
        { name: 'New York', top: '40%', left: '25%', active: activeMarkets.newyork },
    ];

    return (
        <section id="market-map" className="py-20 bg-gray-900/50 overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        {/* * SEMRUSH H2-H6 FİX: 
                          * Başlık, diğer ana sayfa bileşenleriyle (Modüller, Fiyatlandırma) tutarlı olması 
                          * için statik metinden dinamik çeviri (T) prop'una geçirildi.
                          * T prop'u gelmezse (fallback) eski statik metin korunur.
                        */}
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            {T?.globe?.title || (
                                <>Piyasanın Kalbi, <span className="gradient-text">7/24 Sizinle.</span></>
                            )}
                        </h2>
                        {/* * FİX: Açıklama, çeviri prop'una geçirildi.
                        */}
                        <p className="text-gray-400 mb-6">
                            {T?.globe?.subtitle || "Synara, küresel piyasa seanslarını ve likidite avlarını anlık olarak takip eder. Metis modülümüz, piyasa yapıcıların zihniyetiyle hareket ederek sizi her zaman bir adım önde tutar."}
                        </p>
                    </div>
                    <div className="relative h-96 md:h-[450px]">
                        {/* KRİTİK DÜZELTME: globe sınıfına dönme animasyonu eklendi */}
                        <div className="globe animate-rotate-globe">
                            <div className="globe-overlay"></div>
                            {markets.map((market, index) => (
                                <div key={index} className="market-point-container" style={{ top: market.top, left: market.left }}>
                                    {/* KRİTİK DÜZELTME: aktif noktalara parıldama efekti eklendi */}
                                    <div className={`market-point ${market.active ? 'active animate-pulse' : ''}`}></div>
                                    <div className="market-label">
                                        {market.name} 
                                        <span className={market.active ? 'text-green-400' : 'text-red-400'}>
                                            {/* T Çevirisi eklendi (fallback ile) */}
                                            {market.active ? (T?.globe?.open || ' Açık') : (T?.globe?.closed || ' Kapalı')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MarketSessionsGlobe;

