// path: app/kokpit/page.js
'use client';

import React, { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRequiredAuth } from '@/hooks/useRequiredAuth';
import { trpc } from '@/lib/trpc/client'; // EKLENDİ
import { usePerformanceAnalytics } from '@/hooks/usePerformanceAnalytics'; 
import Icon from '@/components/Icon';
import dynamic from 'next/dynamic';
import SkeletonLoader from '@/components/SkeletonLoader'; // KRİTİK: SkeletonLoader import edildi
import Link from 'next/link';

// Grafik bileşenini dinamik olarak yükle
const PerformanceChart = dynamic(() => import('@/components/PerformanceChart'), {
    ssr: false,
    loading: () => <div className="h-[300px] flex items-center justify-center text-gray-500 bg-gray-800/50 p-6 rounded-xl border border-gray-700">Performans grafiği yükleniyor...</div>
});

// Stat Kartı bileşeni
const StatCard = ({ title, value, icon, color, unit = '' }) => (
    // KRİTİK GÜNCELLEME: futuristic-card stili uygulandı
    <div className="futuristic-card p-6 border border-gray-700 flex flex-col justify-between h-full transition-all duration-300 hover:border-indigo-500/50 hover:shadow-indigo-900/40">
        <div className="flex items-start gap-4">
            <div className="bg-gray-700 p-3 rounded-lg flex-shrink-0">
                <Icon name={icon} className={`w-6 h-6 ${color}`} />
            </div>
            <div>
                <h3 className="text-sm font-semibold text-gray-400">{title}</h3>
                <p className="text-2xl font-bold text-white">{value}{unit}</p>
            </div>
        </div>
    </div>
);

// PnL/ROE Stat Kartı
const PnlStatCard = ({ title, value, icon, isPositive }) => {
    const color = isPositive === null ? 'text-indigo-400' : isPositive ? 'text-green-400' : 'text-red-400';
    const bgColor = isPositive === null ? 'bg-indigo-900/20' : isPositive ? 'bg-green-900/20' : 'bg-red-900/20';
    const borderColor = isPositive === null ? 'border-indigo-700/50' : isPositive ? 'border-green-700/50' : 'border-red-700/50';

    return (
         // KRİTİK GÜNCELLEME: futuristic-card-light stili uygulandı
         <div className={`p-4 rounded-xl border-2 ${borderColor} ${bgColor} shadow-md flex flex-col justify-between h-full`}>
            <h3 className="text-xs font-semibold text-gray-400">{title}</h3>
            <div className="flex items-center justify-between mt-2">
                <Icon name={icon} className={`w-6 h-6 ${color} flex-shrink-0`} />
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
        </div>
    );
};

// En İyi/Kötü İşlem Kartı
const TradeHighlightCard = ({ trade, title, T }) => {
    if (!trade) {
        return (
             <div className="futuristic-card p-4 rounded-xl bg-gray-800/50 border border-gray-700 h-full flex flex-col justify-center items-center">
                 <p className="text-sm text-gray-500">Veri Yok</p>
             </div>
        );
    }
    const isWin = (trade.pnlUsd || 0) > 0;
    
    const pnlUsd = trade.pnlUsd || 0;
    const riskReward = trade.riskReward || 0;
    
    // KRİTİK GÜNCELLEME: Futuristic card stili ve hover eklendi
    const cardClass = `futuristic-card p-4 rounded-xl border-2 ${isWin ? 'bg-green-900/20 border-green-700/50 hover:shadow-green-900/50' : 'bg-red-900/20 border-red-700/50 hover:shadow-red-900/50'} h-full flex flex-col justify-between transition-all duration-300 hover:shadow-xl`;


    return (
        <div className={cardClass}>
            <h4 className={`text-sm font-bold ${isWin ? 'text-green-400' : 'text-red-400'}`}>{title}</h4>
            <div className="mt-2 text-xs font-mono space-y-1">
                <div className="flex justify-between"><span>{T.kasa_table_instrument}:</span> <span className="font-semibold">{trade.instrument} ({trade.direction})</span></div>
                <div className="flex justify-between"><span>PnL:</span> <span className={`font-semibold ${isWin ? 'text-green-300' : 'text-red-300'}`}>{pnlUsd >= 0 ? '+' : ''}${pnlUsd.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>R:R:</span> <span className="font-semibold">{riskReward.toFixed(2)}R</span></div>
                <div className="flex justify-between"><span>Tarih:</span> <span className="font-semibold">{new Date(trade.closeTimestamp).toLocaleDateString('tr-TR')}</span></div>
            </div>
        </div>
    );
};

// Enstrüman Dağılım Tablosu
const InstrumentTable = ({ instrumentStats, T }) => (
    // KRİTİK GÜNCELLEME: futuristic-card stili uygulandı
    <div className="futuristic-card p-6 rounded-2xl border border-gray-700 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-4">Enstrüman Kar/Zarar Dağılımı</h3>
        <div className="overflow-x-auto">
             <table className="w-full text-left table-auto">
                <thead>
                    <tr className="border-b border-gray-700 bg-gray-800/50">
                        <th className="py-2 px-3 text-xs text-gray-400">Enstrüman</th>
                        <th className="py-2 px-3 text-xs text-gray-400 text-right">Toplam PnL ($)</th>
                        <th className="py-2 px-3 text-xs text-gray-400 text-right">{T.kasa_summary_win_rate}</th>
                        <th className="py-2 px-3 text-xs text-gray-400 text-right">{T.kasa_summary_total_trades}</th>
                    </tr>
                </thead>
                <tbody>
                    {instrumentStats.map(stat => {
                        const isPositive = stat.pnl >= 0;
                        return (
                             // KRİTİK GÜNCELLEME: Tablo satırlarına hover eklendi
                             <tr key={stat.instrument} className="border-b border-gray-800 hover:bg-gray-700/50 transition-colors">
                                <td className="py-2 px-3 font-semibold text-sm">{stat.instrument}</td>
                                <td className={`py-2 px-3 font-bold text-right ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                    {isPositive ? '+' : ''}{stat.pnl.toFixed(2)}
                                </td>
                                <td className="py-2 px-3 text-right text-gray-300">{stat.winRate.toFixed(1)}%</td>
                                <td className="py-2 px-3 text-right text-gray-300">{stat.count}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    </div>
);


const DirectionStatsCard = ({ directionStats, T }) => {
    
    const longPnl = directionStats.L.pnl;
    const shortPnl = directionStats.S.pnl;
    const longWinRate = directionStats.L.winRate;
    const shortWinRate = directionStats.S.winRate;

    return (
        // KRİTİK GÜNCELLEME: futuristic-card stili uygulandı
        <div className="futuristic-card p-6 rounded-2xl border border-gray-700 space-y-4"> 
            <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-3">Yön Analizi (Long/Short)</h3>
            <div className="grid grid-cols-2 gap-4">
                {/* Long İstatistikleri */}
                <div className="p-4 rounded-xl bg-green-900/20 border border-green-700/50 space-y-2">
                    <div className="flex justify-between items-center"><span className="font-bold text-green-400">LONG ({T.kasa_long})</span> <Icon name="arrow-up-circle" className="w-5 h-5 text-green-400"/></div>
                    <p className="text-sm text-gray-300 flex justify-between">PnL: <span className={`font-bold ${longPnl >= 0 ? 'text-green-300' : 'text-red-300'}`}>{longPnl >= 0 ? '+' : ''}{longPnl.toFixed(2)}$</span></p>
                    <p className="text-sm text-gray-300 flex justify-between">Kazanma Oranı: <span className="font-bold text-white">{longWinRate.toFixed(1)}%</span></p>
                    <p className="text-sm text-gray-300 flex justify-between">Toplam İşlem: <span className="font-bold text-white">{directionStats.L.wins + directionStats.L.losses}</span></p>
                </div>

                {/* Short İstatistikleri */}
                <div className="p-4 rounded-xl bg-red-900/20 border border-red-700/50 space-y-2">
                    <div className="flex justify-between items-center"><span className="font-bold text-red-400">SHORT ({T.kasa_short})</span> <Icon name="arrow-down-circle" className="w-5 h-5 text-red-400"/></div>
                    <p className="text-sm text-gray-300 flex justify-between">PnL: <span className={`font-bold ${shortPnl >= 0 ? 'text-green-300' : 'text-red-300'}`}>{shortPnl >= 0 ? '+' : ''}{shortPnl.toFixed(2)}$</span></p>
                    <p className="text-sm text-gray-300 flex justify-between">Kazanma Oranı: <span className="font-bold text-white">{shortWinRate.toFixed(1)}%</span></p>
                    <p className="text-sm text-gray-300 flex justify-between">Toplam İşlem: <span className="font-bold text-white">{directionStats.S.wins + directionStats.S.losses}</span></p>
                </div>
            </div>
            
            <div className="p-3 bg-gray-700/50 rounded-lg text-xs text-gray-400 border border-gray-700 mt-auto">
                <p className="font-semibold text-indigo-400 mb-1">Analitik Yorum:</p>
                <p>{longPnl > shortPnl 
                    ? "Long pozisyonlar, kasanızın toplam PnL'sine daha fazla katkı sağlamış. Long setup'larınıza odaklanın."
                    : "Short pozisyonlar, Long'a göre daha başarılı bir getiri sağlamış. Düşüş rejimlerinde daha disiplinlisiniz."}
                </p>
            </div>
        </div>
    );
};


const KokpitPage = () => {
    const { T, user, userData, loading: authLoading } = useAuth();
    const { loading: authReqLoading, redirectPath } = useRequiredAuth({ requireLogin: true });
    
    // KRİTİK: Kasa verisi tRPC ile çekiliyor
    const { data: kasaData, isLoading: kasaLoading, error: kasaError } = trpc.kasa.getKasaData.useQuery(undefined, {
        enabled: !!user,
        staleTime: 60000 * 5,
    });

    // KRİTİK DÜZELTME: 'allTradesAndCashFlows' artık useMemo içinde. Bu, gereksiz render'ları önler.
    const allTradesAndCashFlows = useMemo(() => kasaData?.trades || [], [kasaData?.trades]);
    const initialBalanceValue = kasaData?.summary?.initialBalance || 0;
    
    // KRİTİK KORUMA: Sadece geçerli, kapalı trade'leri analize gönder.
    const closedTradesForAnalytics = useMemo(() => 
        allTradesAndCashFlows.filter(t => t.type === 'trade' && t.status === 'closed' && t.pnlUsd !== undefined && t.pnlUsd !== null)
    , [allTradesAndCashFlows]);
    
    const { analytics, chartData, loading: analyticsLoading } = usePerformanceAnalytics(closedTradesForAnalytics, initialBalanceValue);

    // KRİTİK FİX: Toplam yükleme durumu (Auth, Yetkilendirme, Kasa Verisi, Analitik Hesaplama)
    const isLoading = authLoading || authReqLoading || kasaLoading || analyticsLoading || !T;

    if (isLoading) {
        return <SkeletonLoader />; // Yüklenirken SkeletonLoader göster.
    }
    
    // KRİTİK DÜZELTME: tRPC hata durumunda genel bir hata mesajı göster.
    if (kasaError) {
        console.error("Kokpit tRPC hatası:", kasaError);
        return (
            <div className="min-h-screen bg-gray-900 flex justify-center items-center p-4">
                <div className="text-center p-8 bg-gray-800 rounded-xl border border-red-700">
                    <Icon name="alert-triangle" className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white">{T.notification_error_title}</h2>
                    <p className="text-gray-400 mt-2">{T.kokpit_error_fetch || "Veri yüklenirken kritik bir sistem hatası oluştu."}</p>
                </div>
            </div>
        );
    }

    // KRİTİK KORUMA: Eğer analiz verisi yoksa veya işlem sayısı 0 ise uyarı göster.
    if (!analytics || analytics.totalTrades === 0) {
         return (
            <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center text-center p-4">
                <Icon name="bar-chart-2" className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                <h1 className="text-3xl font-bold">{T.kokpit_no_data_title || "Analiz İçin Yetersiz Veri"}</h1>
                <p className="text-gray-400 mt-2">{T.kokpit_no_data_desc || "Performans kokpitini görüntülemek için en az bir kapalı işleminiz olmalıdır."}</p>
                <Link href="/kasa-yonetimi" className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                    Kasa Yönetimine Git
                </Link>
            </div>
        );
    }
    
    const displayName = userData?.displayName || user.email.split('@')[0];
    
    return (
        // KRİTİK GÜNCELLEME: Arka plana dashboard-bg eklendi
        <div className="min-h-screen dashboard-bg text-white p-4 md:p-8">
            <div className="container mx-auto max-w-6xl space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl md:text-4xl font-bold">{displayName}, {T.nav_kokpit || "Performans Kokpiti"}</h1>
                    <p className="text-gray-400 mt-1 text-center">{T.kokpit_subtitle || "İşlem geçmişinize dayalı derinlemesine performans analizi."}</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title={T.kasa_summary_win_rate} value={analytics.winRate.toFixed(1)} icon="check-circle-2" color="text-green-400" unit="%" />
                    <StatCard title={T.kasa_summary_avg_rr} value={analytics.averageRR.toFixed(2)} icon="activity" color="text-indigo-400" unit="R" />
                    <StatCard title="Reward/Risk Oranı" value={analytics.rewardToRiskRatio.toFixed(2)} icon="wallet" color="text-yellow-400" unit="R" />
                    <StatCard title="Profit Factor (PF)" value={analytics.profitFactor.toFixed(2)} icon="bar-chart-2" color="text-sky-400" />
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <PnlStatCard 
                        title="Toplam PnL" 
                        value={`${analytics.totalPnl >= 0 ? '+' : ''}${analytics.totalPnl.toFixed(2)}$`} 
                        icon="dollar-sign" 
                        isPositive={analytics.totalPnl >= 0}
                    />
                    <PnlStatCard 
                        title="Ortalama Kazanç" 
                        value={`+${analytics.avgWin.toFixed(2)}$`} 
                        icon="arrow-up-circle" 
                        isPositive={true}
                    />
                    <PnlStatCard 
                        title="Ortalama Kayıp" 
                        value={`-${analytics.avgLoss.toFixed(2)}$`} 
                        icon="arrow-down-circle" 
                        isPositive={false}
                    />
                    <PnlStatCard 
                        title="Max Win Streak" 
                        value={`${analytics.maxWinStreak} İşlem`} 
                        icon="award" 
                        isPositive={analytics.maxWinStreak > analytics.maxLossStreak ? true : (analytics.maxWinStreak === 0 ? null : true)}
                    />
                </div>

                {/* Grafik Alanı */}
                <div className="futuristic-card p-6 rounded-2xl border border-gray-700 shadow-xl">
                    <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-3">Kasa Büyüme Eğrisi</h2>
                    <PerformanceChart data={chartData} />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6"> 
                        <DirectionStatsCard directionStats={analytics.directionStats} T={T} />
                        <InstrumentTable instrumentStats={analytics.instrumentStats} T={T}/>
                    </div>
                    
                    <div className="space-y-6 flex flex-col">
                        <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-3">Kilit İşlem Örnekleri</h3>
                        <div className="flex flex-col gap-6 flex-grow">
                             <TradeHighlightCard trade={analytics.bestTrade} title="En İyi İşlem (R:R)" T={T}/>
                             <TradeHighlightCard trade={analytics.worstTrade} title="En Kötü İşlem (R:R)" T={T}/>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default KokpitPage;
