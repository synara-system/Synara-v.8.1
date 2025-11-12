// path: components/market/FearGreedWidget.js
'use client';
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Info, ChevronDown, ChevronUp, Zap, Loader2 } from 'lucide-react';

// === FÜTÜRİSTİK TEMA SABİTLERİ (v1.5) ===
const WIDGET_BASE_CLASSES = "bg-[#111827]/70 backdrop-blur-sm p-6 rounded-xl shadow-2xl transition-all duration-300 border border-indigo-700/50 hover:shadow-cyan-500/50";
const WIDGET_HEADER_CLASSES = "flex items-center space-x-3 border-b border-indigo-700/50 pb-4 mb-4";
// === STİL SONU ===

// --- YAPAY ZEKA YORUMU VE DUYARLILIK MANTIĞI ---

// Endeks seviyesine göre duyarlılık sınıflandırması ve AI yorumu döndürür.
const getSentiment = (value) => {
    let sentiment, color, progressColor, comment;

    if (value == null) {
        sentiment = 'Veri Bekleniyor';
        color = 'text-gray-500';
        progressColor = '#6b7280';
        comment = "Synara Nexus motoru piyasa duyarlılık verilerini topluyor. Anlık veri akışı için lütfen bekleyin.";
    } else if (value <= 20) {
        sentiment = 'Aşırı Korku';
        color = 'text-red-500';
        progressColor = '#ef4444';
        comment = "Piyasa Aşırı Korku seviyesinde. Bu, genellikle piyasanın aşırı satış bölgesine girdiğini ve potansiyel bir dip noktasının yaklaştığını gösterir. Synara Analizi: Akıllı para girişlerini izleyin; kısa vadeli fırsatlar doğabilir, ancak volatilite yüksektir.";
    } else if (value <= 40) {
        sentiment = 'Korku';
        color = 'text-orange-500';
        progressColor = '#f97316';
        comment = "Piyasa Korku seviyesinde. Yatırımcılar temkinli hareket ediyor ve belirsizlik hakim. Bu seviyeden kararlı alımlar riskli olabilir. Synara Analizi: Defansif sektörler ve düşük beta hisseleri direnç gösterebilir. Genel risk iştahı düşük.";
    } else if (value <= 60) {
        sentiment = 'Nötr';
        color = 'text-gray-400';
        progressColor = '#6b7280';
        comment = "Piyasa Nötr bölgede. Yatırımcılar net bir yön belirleyemiyor. Bu, konsolidasyon veya kararsızlık dönemine işaret eder. Synara Analizi: Yüksek işlem hacmi ile gelen kırılmaları takip edin. Düşük volatilite nedeniyle yatay hareketler beklenir.";
    } else if (value <= 80) {
        sentiment = 'Hırs (Greed)';
        color = 'text-lime-500';
        progressColor = '#84cc16';
        comment = "Piyasa Hırs seviyesinde. Bu, kısa vadede aşırı ısınma riskini artırır ve kar realizasyonunun başlayabileceğini gösterir. Synara Analizi: Risk yönetimi seviyelerini sıkılaştırın ve pozisyon büyüklüğünü ayarlayın. FOMO (Fırsatı kaçırma korkusu) artıyor olabilir.";
    } else {
        sentiment = 'Aşırı Hırs (Extreme Greed)';
        color = 'text-green-500';
        progressColor = '#10b981';
        comment = "Piyasa Aşırı Hırs seviyesinde. Genellikle zirve noktalarının yaklaştığına ve düzeltme riskinin çok yüksek olduğuna işaret eder. Synara Analizi: Korunma (hedging) stratejileri uygulayın veya pozisyon büyüklüklerini agresif şekilde azaltın. Tersine dönüş riski zirvededir.";
    }
    
    return { sentiment, color, progressColor, comment };
};

// --- GÖSTERGE (GAUGE) BİLEŞENİ ---
const FearGreedGauge = ({ value, progressColor }) => {
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    // Değere göre ilerlemeyi hesapla (0'dan 100'e)
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
        <svg viewBox="0 0 200 120" className="w-full h-auto" style={{ transform: 'rotateX(180deg) rotate(180deg)' }}>
            {/* Arkaplan Yayı (0'dan 100'e) */}
            <defs>
                <linearGradient id="gradientGauge" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{stopColor: "#ef4444"}} /> {/* Kırmızı - Korku */}
                    <stop offset="50%" style={{stopColor: "#6b7280"}} /> {/* Gri - Nötr */}
                    <stop offset="100%" style={{stopColor: "#10b981"}} /> {/* Yeşil - Hırs */}
                </linearGradient>
            </defs>
            <path
                d={`M 10 100 A ${radius} ${radius} 0 0 1 190 100`}
                fill="none"
                stroke="url(#gradientGauge)"
                strokeWidth="15"
                strokeLinecap="round"
                className="opacity-20"
            />
            
            {/* İlerleme Yayı (Dinamik) */}
            <path
                d={`M 10 100 A ${radius} ${radius} 0 0 1 190 100`}
                fill="none"
                stroke={progressColor}
                strokeWidth="15"
                strokeLinecap="round"
                strokeDasharray={circumference / 2}
                strokeDashoffset={strokeDashoffset / 2}
                className="transition-all duration-1000 ease-out"
                style={{ filter: `drop-shadow(0 0 8px ${progressColor}55)` }}
            />
            
            {/* İşaretçi Noktası (Dinamik) */}
            <g transform={`rotate(${180 * (value / 100)}, 100, 100)`}>
                <circle cx="100" cy="10" r="10" fill={progressColor} className="transition-all duration-1000 ease-out" style={{ filter: `drop-shadow(0 0 10px ${progressColor}bb)` }} />
            </g>
        </svg>
    );
}

// --- ANA BİLEŞEN ---
const FearGreedWidget = ({ fearGreedData }) => {
    const [isInfoOpen, setIsInfoOpen] = useState(false);

    // V1.8: fearGreedData'nın Object olduğundan emin olunur.
    const data = fearGreedData || {};
    const value = data.value ? parseInt(data.value, 10) : 50;
    const timestamp = data.timestamp;


    const { sentiment, color, progressColor, comment } = useMemo(() => getSentiment(value), [value]);
    
    // Yükleme durumu
    if (!fearGreedData || value === null) {
        return (
            <div className={WIDGET_BASE_CLASSES + " h-52 flex items-center justify-center"}>
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                <span className="ml-3 text-gray-400">Duyarlılık Verisi Yükleniyor...</span>
            </div>
        );
    }

    return (
        <div className={WIDGET_BASE_CLASSES + " lg:col-span-1"}>
            <h3 className={WIDGET_HEADER_CLASSES}>
                <Zap className="w-5 h-5 mr-3 text-red-500" /> 
                <span className="text-gray-200 text-lg font-semibold">Hırs ve Korku Endeksi</span>
            </h3>

            {/* Endeks Göstergesi */}
            <div className="flex flex-col items-center justify-center p-2 pt-0">
                <FearGreedGauge value={value} progressColor={progressColor} />
                
                <div className="-mt-16 text-center">
                    <div className="text-4xl font-extrabold text-cyan-400 tracking-wider font-mono">
                        {value !== null ? value.toFixed(0) : '--'}
                    </div>
                    <div className={`text-lg font-bold ${color} transition-colors duration-500`}>
                        {sentiment}
                    </div>
                </div>
            </div>
            
            {/* Ölçek Etiketleri */}
            <div className="flex justify-between text-xs font-semibold text-gray-500 px-2 mt-4">
                <span className="text-red-500">Aşırı Korku</span>
                <span className="text-lime-500">Aşırı Hırs</span>
            </div>

            <div className="text-xs text-gray-600 text-center mt-3 border-t border-gray-700/50 pt-3">
                <span className="mr-1">Güncel Veri:</span>
                {timestamp ? new Date(timestamp).toLocaleTimeString('tr-TR') : '--:--'} TRT
            </div>

            {/* === AI INSIGHT PANELİ (v3.0) === */}
            <div 
                className={`mt-4 pt-3 cursor-pointer p-3 -mx-3 rounded-md transition-colors ${isInfoOpen ? 'bg-indigo-700/30' : 'hover:bg-gray-800/50'}`}
                onClick={() => setIsInfoOpen(!isInfoOpen)}
            >
                <div className="flex items-center justify-between">
                    <span className="flex items-center text-md font-semibold text-indigo-400">
                        <BrainCircuit className="w-5 h-5 mr-2" />
                        Synara AI Duyarlılık Analizi
                    </span>
                    {isInfoOpen ? (
                        <ChevronUp className="w-4 h-4 text-cyan-400" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                </div>
            </div>
            
            <AnimatePresence>
                {isInfoOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden mt-2"
                    >
                        <p className="text-sm text-gray-300 border-l-4 border-indigo-500 pl-3 py-1 bg-indigo-900/10 whitespace-pre-wrap">
                            {comment}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* === AI INSIGHT PANELİ SONU === */}
        </div>
    );
};

export default FearGreedWidget;
