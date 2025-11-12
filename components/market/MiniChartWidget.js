// path: tamir/components/market/MiniChartWidget.js
'use client';
import React from 'react';
import { useMemo } from 'react';
// Recharts kütüphanesi grafik çizimi için gerekli
import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
// KRİTİK DÜZELTME: Hata veren '@/lib/trpc/utils' import'ları tamamen kaldırıldı. 
// Formatlama fonksiyonları artık bu dosya içinde tanımlanmıştır.
import SkeletonLoader from '@/components/SkeletonLoader';

// === FÜTÜRİSTİK TEMA SABİTLERİ ===
const WIDGET_BASE_CLASSES = "bg-[#111827]/70 backdrop-blur-sm p-6 rounded-xl shadow-2xl transition-all duration-300 border border-indigo-700/50 hover:shadow-cyan-500/50";
const WIDGET_HEADER_CLASSES = "flex items-center space-x-3 border-b border-indigo-700/50 pb-4 mb-4";
// === STİL SONU ===

/**
 * Anlık fiyatı, 48 saatlik değişimi ve mini grafiği gösteren yeniden kullanılabilir widget.
 * @param {{title: string, symbol: string, chartData: Array, colorClass: string}} props Piyasa verilerini içerir.
 */
const MiniChartWidget = ({ title, symbol, chartData, colorClass = "text-blue-400" }) => {
    // KRİTİK DÜZELTME: 'data' değişkeni, `chartData` prop'unun stabil hale getirilmesi için useMemo'ya alındı.
    const data = useMemo(() => Array.isArray(chartData) ? chartData : [], [chartData]);
    
    // --- YEREL FORMATLAMA FONKSİYONLARI (Kritik Çözüm) ---
    // Harici utils dosyasına bağımlılığı ortadan kaldırmak için yerel olarak tanımlandı.
    const currencyFormatter = (price) => {
        const prefix = symbol.includes('USD') ? '$' : '';
        // BTC gibi yüksek değerli varlıklar için ondalık sayıyı koru, aksi halde 2 ondalık hane
        const fractionDigits = (price > 1000) ? 2 : 2; 
        // toLocaleString() global bir fonksiyon olduğu için sorunsuzdur.
        return `${prefix}${price.toFixed(fractionDigits).toLocaleString()}`;
    };

    const percentageFormatter = (percent) => {
        return `${percent.toFixed(2)}%`;
    };
    // --- YEREL FORMATLAMA SONU ---


    // Mini grafik için sadece close fiyatı ve zamanı kullan
    const chartDataForRecharts = useMemo(() => {
        // Data yapısı {date: string, close: number} varsayılıyor
        return data.map(d => ({
            // Saat ve dakikayı kullanarak zaman ekseni oluştur
            time: new Date(d.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            price: d.close,
        }));
    }, [data]);

    // Değişim hesaplamaları (48 saatlik değişim)
    const latestPoint = data && data.length > 0 ? data[data.length - 1] : null;
    const firstPoint = data && data.length > 0 ? data[0] : null;

    let change = 0;
    if (latestPoint && firstPoint && firstPoint.close > 0) {
        change = ((latestPoint.close - firstPoint.close) / firstPoint.close) * 100;
    }
    const isUp = change >= 0;
    const changeColor = isUp ? 'text-green-500' : 'text-red-500';
    const trendIcon = isUp ? TrendingUp : TrendingDown;
    const trendColor = isUp ? '#22c55e' : '#ef4444'; // Green or Red hex
    const currentPrice = latestPoint?.close || 0;

    // Başlık sadeleştirme kuralı uygulandı
    const headerTitleClass = 'text-white text-lg font-bold';

    if (data.length === 0) {
        return <SkeletonLoader className={WIDGET_BASE_CLASSES} height="150px" title={title} />;
    }


    return (
        <div className={WIDGET_BASE_CLASSES}>
            <h3 className={WIDGET_HEADER_CLASSES}>
                <DollarSign className="w-5 h-5 mr-3 text-cyan-400" />
                <span className={headerTitleClass}>{title}</span>
            </h3>

            <div className="flex justify-between items-center mb-4">
                {/* Anlık Fiyat */}
                <div>
                    <div className={`text-xl sm:text-2xl font-extrabold ${colorClass}`}>
                        {/* GÜNCELLEME: Yerel formatter kullanımı */}
                        {currencyFormatter(currentPrice)} 
                    </div>
                    <div className="text-sm text-gray-400">
                        {symbol} (48h Değişim)
                    </div>
                </div>

                {/* Değişim Yüzdesi */}
                <div className={`flex items-center space-x-2 ${changeColor} font-bold text-lg`}>
                    {React.createElement(trendIcon, { className: "w-5 h-5" })}
                    <span>
                         {/* GÜNCELLEME: Yerel formatter kullanımı */}
                        {percentageFormatter(change)}
                    </span>
                </div>
            </div>

            {/* Mini Grafik Alanı (Recharts) */}
            <div className="h-20 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartDataForRecharts} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <defs>
                            <linearGradient id={`colorTrend-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={trendColor} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={trendColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Line
                            type="monotone"
                            dataKey="price"
                            stroke={`url(#colorTrend-${symbol})`} 
                            strokeWidth={2}
                            dot={false}
                            animationDuration={1500}
                        />
                        <Tooltip
                            content={({ payload }) => {
                                if (payload && payload.length) {
                                    return (
                                        <div className="p-1.5 bg-gray-900 border border-indigo-500 rounded-md text-xs text-white shadow-lg">
                                            {/* GÜNCELLEME: Yerel formatter kullanımı */}
                                            {currencyFormatter(payload[0].value)}
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default MiniChartWidget;
