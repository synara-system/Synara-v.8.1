// path: app/lig/page.js
'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRequiredAuth } from '@/hooks/useRequiredAuth';
import Icon from '@/components/Icon';
import { trpc } from '@/lib/trpc/client';
import { motion, AnimatePresence } from 'framer-motion'; 

// --- YARDIMCI BİLEŞENLER ---

// KRİTİK GÜNCELLEME: StatCard - Daha fütüristik ve renkli
const StatCard = ({ title, value, icon, color, unit = '' }) => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        // KRİTİK STİL: futuristic-card ve hover efekti eklendi
        className="futuristic-card p-6 border-2 border-gray-700/50 flex flex-col justify-between h-full transition-all duration-300 hover:border-indigo-500/50 hover:shadow-indigo-900/40"
    >
        <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg flex-shrink-0 bg-gray-900/50 border border-gray-700`}>
                <Icon name={icon} className={`w-6 h-6 ${color}`} />
            </div>
            <div>
                <h3 className="text-sm font-semibold text-gray-400">{title}</h3>
                <p className={`text-2xl font-bold text-white`}>{value}{unit}</p>
            </div>
        </div>
    </motion.div>
);

// KRİTİK GÜNCELLEME: UserRankCard - Vurgu ve efektler eklendi
const UserRankCard = ({ rankData, T }) => {
    const bestRank = rankData.reduce((best, current) => {
        if (current.rank !== null && (best.rank === null || current.rank < best.rank)) {
            return current;
        }
        return best;
    }, { rank: null });

    const isTop10 = bestRank.rank !== null && bestRank.rank <= 10;
    
    const cardClass = isTop10 
        ? 'border-yellow-500/70 shadow-2xl shadow-yellow-900/50 bg-gray-800/80'
        : 'border-indigo-700/50 shadow-indigo-900/40 bg-gray-800/70';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={`futuristic-card p-6 rounded-2xl border-2 ${cardClass} flex flex-col justify-center items-center h-full transition-all duration-300 hover:scale-[1.01]`}
        >
            <Icon name={isTop10 ? 'award' : 'compass'} className={`w-12 h-12 ${isTop10 ? 'text-yellow-400 animate-pulse' : 'text-indigo-400'} mb-2`} />
            <h3 className="text-sm font-semibold text-gray-400 text-center">{T.nav_lig} Statüsü</h3>
            <p className="text-2xl font-extrabold text-white mt-1">
                {bestRank.rank === null 
                    ? T.lig_no_data || 'Veri Yetersiz'
                    : isTop10 
                    ? `${bestRank.rank}. Sıradasınız! (TOP 10)`
                    : `Sıra: ${bestRank.rank}. (Gelişim Alanı)`}
            </p>
            {bestRank.rank !== null && <p className="text-sm text-indigo-300 mt-2">En İyi Disiplin: {bestRank.label}</p>}
        </motion.div>
    );
};

// KRİTİK GÜNCELLEME: ComparisonBar - Daha vurgulu renkler ve metin
const ComparisonBar = ({ title, userValue, leaderValue, unit = '' }) => {
    const safeUserValue = userValue || 0;
    const safeLeaderValue = leaderValue || 0.0001;
    
    let progress = 0;
    let comparisonText = 'VERİ İŞLENİYOR';
    let color = 'bg-gray-600';
    let textColor = 'text-gray-400';
    
    if (safeUserValue > 0 || safeLeaderValue > 0) {
        progress = Math.min(100, (safeUserValue / safeLeaderValue) * 100);
        
        if (safeUserValue >= safeLeaderValue) {
            comparisonText = 'LİDERİ GEÇTİNİZ! (PROTOKOL MÜHÜRLENDİ)';
            color = 'bg-green-600';
            textColor = 'text-green-400';
        } else if (progress >= 90) {
             comparisonText = 'LİDERE ÇOK YAKIN! (%' + progress.toFixed(0) + ' BAŞARI)';
             color = 'bg-indigo-600';
             textColor = 'text-indigo-400';
        } else if (progress >= 50) {
             comparisonText = 'GELİŞİM SÜRÜYOR. (DISIPLİN AKTİF)';
             color = 'bg-yellow-600';
             textColor = 'text-yellow-400';
        } else if (progress > 0) {
             comparisonText = 'TEMEL DİSİPLİN BAŞLANGICI';
             color = 'bg-red-600';
             textColor = 'text-red-400';
        } else {
             comparisonText = 'BAŞLANGIÇ';
             color = 'bg-gray-600';
             textColor = 'text-gray-400';
        }
    }
    
    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="p-4 bg-gray-900/50 rounded-xl border border-gray-700 hover:border-indigo-500/50 transition-colors"
        >
            <h4 className="text-base font-bold text-white mb-2">{title}</h4>
            <div className="flex justify-between text-xs font-mono mb-1">
                <span className={`font-bold ${textColor}`}>{safeUserValue.toFixed(title.includes('R:R') ? 2 : 1)}{unit} (SİZ)</span>
                <span className="text-gray-400">{leaderValue.toFixed(title.includes('R:R') ? 2 : 1)}{unit} (LİDER)</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
                <div className={`${color} h-3 rounded-full transition-all duration-1000`} style={{ width: `${progress}%` }}></div>
            </div>
             <p className={`text-center text-xs font-semibold mt-2 ${textColor}`}>{comparisonText}</p>
        </motion.div>
    );
}

const LeaderboardTable = ({ data, category, T, currentUserDisplayName, activeTab }) => {
    if (!data || data.length === 0) {
        return <p className="text-gray-500 text-center py-8">{T.lig_no_data || "Bu kategoride henüz veri yok."}</p>;
    }

    const getUnit = (key) => {
        if (key === 'winRate') return '%';
        if (key === 'averageRR') return ' R';
        return '';
    };
    
    // KRİTİK GÜNCELLEME: Sıralama ikonları ve renkleri
    const getRankIcon = (index) => {
        if (index === 0) return { icon: '🏆', color: 'text-yellow-400', bg: 'bg-yellow-900/50' };
        if (index === 1) return { icon: '🥈', color: 'text-gray-300', bg: 'bg-gray-700/50' };
        if (index === 2) return { icon: '🥉', color: 'text-amber-700', bg: 'bg-amber-900/50' };
        return { icon: index + 1, color: 'text-gray-500', bg: 'bg-gray-800/50' };
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-gray-700 bg-gray-800">
                        <th className="p-4 text-sm font-semibold text-gray-400"># Sıra</th>
                        <th className="p-4 text-sm font-semibold text-gray-400">Komuta Adı</th>
                        <th className="p-4 text-sm font-semibold text-gray-400 text-right">{category}</th>
                    </tr>
                </thead>
                <tbody>
                    {/* KRİTİK FİX: AnimatePresence burada kapalı olmalıydı */}
                    <AnimatePresence> 
                        {data.map((trader, index) => {
                            const isCurrentUser = currentUserDisplayName && trader.displayName === currentUserDisplayName;
                            const value = trader[activeTab]; 
                            const rank = getRankIcon(index);

                            return (
                                <motion.tr 
                                    key={`${trader.displayName}-${index}`} 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={`border-b border-gray-800 transition-colors ${
                                        isCurrentUser
                                        ? 'bg-indigo-900/50 border-2 border-indigo-500/50 shadow-xl' 
                                        : 'hover:bg-gray-800/50'
                                    }`}
                                >
                                    <td className="p-4 font-bold text-lg flex items-center">
                                        <span className={`w-8 h-8 flex items-center justify-center rounded-full ${rank.bg} ${rank.color}`}>
                                            {typeof rank.icon === 'string' ? rank.icon : <span className='text-sm'>{rank.icon}</span>}
                                        </span>
                                    </td>
                                    <td className="p-4 font-semibold text-indigo-400 flex items-center">
                                        {trader.displayName}
                                        {isCurrentUser && <span className="ml-2 text-xs bg-yellow-500/50 text-gray-900 px-2 py-0.5 rounded-full font-bold">SİZ</span>}
                                    </td>
                                    <td className={`p-4 font-bold text-right text-lg ${index < 3 ? 'text-white' : 'text-gray-300'}`}>
                                        {typeof value === 'number' ? value.toFixed(2) : value}{getUnit(activeTab)}
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </AnimatePresence>
                    {/* KRİTİK FİX: AnimatePresence kapanış etiketi silindi (Hatanın kaynağı buydu, LeaderboardTable'ın dışına taşındı) */}
                </tbody>
            </table>
        </div>
    );
};

// --- ANA SAYFA BİLEŞENİ ---
const LigPage = () => {
    const { T, userData, loading: authLoading } = useAuth();
    const { redirectPath } = useRequiredAuth({ requireLogin: true }); 

    const [activeTab, setActiveTab] = useState('winRate');
    
    const tabs = useMemo(() => [
        { key: 'winRate', label: T.kasa_summary_win_rate || 'Kazanma Oranı' },
        { key: 'averageRR', label: T.kasa_summary_avg_rr || 'Ortalama R:R' },
        { key: 'profitFactor', label: 'Profit Factor' },
    ], [T]);
    
    const { data: leaderboardData, isLoading: loading, error } = trpc.leaderboard.getLeaderboard.useQuery(undefined, {
        enabled: !authLoading && !redirectPath, 
        staleTime: 3600000, 
    });

    const currentUserDisplayName = userData ? (userData.displayName || userData.email?.split('@')[0]) : null;
    
    const userMetrics = useMemo(() => {
        if (!leaderboardData || !currentUserDisplayName) return null;
        
        // Kullanıcının metriklerini tek bir yerde bul
        const findMetrics = (key) => leaderboardData[key]?.find(t => t.displayName === currentUserDisplayName);

        return {
            winRate: findMetrics('winRate')?.winRate || 0,
            averageRR: findMetrics('averageRR')?.averageRR || 0,
            profitFactor: findMetrics('profitFactor')?.profitFactor || 0,
            tradeCount: findMetrics('winRate')?.tradeCount || 0,
        };
    }, [leaderboardData, currentUserDisplayName]);

    const userRanks = useMemo(() => {
        if (!leaderboardData || !currentUserDisplayName) return [];
        return Object.keys(leaderboardData).map(key => {
            const index = leaderboardData[key].findIndex(t => t.displayName === currentUserDisplayName);
            return {
                key,
                rank: index !== -1 ? index + 1 : null,
                label: tabs.find(t => t.key === key)?.label || key,
            };
        }).filter(r => r.rank !== null && r.rank !== undefined);
    }, [leaderboardData, currentUserDisplayName, tabs]);

    const leaderMetrics = useMemo(() => {
        if (!leaderboardData) return null;
        return {
            winRate: leaderboardData.winRate[0],
            averageRR: leaderboardData.averageRR[0],
            profitFactor: leaderboardData.profitFactor[0],
        };
    }, [leaderboardData]);
    
    if (authLoading || !T || redirectPath) {
        return <div className="min-h-screen bg-gray-900 flex justify-center items-center"><p>{T?.kasa_loading || "Sistem verisi analiz ediliyor..."}</p></div>;
    }
    
    // KRİTİK DÜZELTME: tRPC hata durumunda genel bir hata mesajı göster.
    if (error) {
        console.error("tRPC Liderlik verisi hatası:", error);
         return (
            <div className="min-h-screen dashboard-bg flex justify-center items-center p-4">
                <div className="text-center p-8 bg-gray-800 rounded-xl border border-red-700">
                    <Icon name="alert-triangle" className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white">{T.notification_error_title}</h2>
                    <p className="text-gray-400 mt-2">{T.lig_error_fetch || "Veri yüklenirken kritik bir sistem hatası oluştu."}</p>
                </div>
            </div>
        );
    }
    
    const activeData = leaderboardData ? leaderboardData[activeTab] || [] : [];
    
    const cardData = [
        { title: T.kasa_summary_win_rate, value: userMetrics?.winRate?.toFixed(1) || '0.0', unit: '%', icon: 'check-circle-2', color: 'text-green-400' },
        { title: T.kasa_summary_avg_rr, value: userMetrics?.averageRR?.toFixed(2) || '0.00', unit: ' R', icon: 'award', color: 'text-indigo-400' },
        { title: 'Profit Factor', value: userMetrics?.profitFactor?.toFixed(2) || '0.00', unit: '', icon: 'bar-chart-2', color: 'text-yellow-400' },
        { title: T.kasa_summary_total_trades, value: userMetrics?.tradeCount || '0', unit: '', icon: 'blocks', color: 'text-sky-400' },
    ];
    
    // KRİTİK KORUMA: Eğer kullanıcının hiç trade'i yoksa
    const noUserMetrics = !userMetrics || userMetrics.tradeCount === 0;

    return (
        // KRİTİK GÜNCELLEME: Dashboard arkaplan stili uygulandı.
        <div className="min-h-screen dashboard-bg text-white p-4 md:p-8">
            <div className="container mx-auto max-w-6xl space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold">
                        <span className="gradient-text">{T.nav_lig || "Disiplin Ligi"}</span> Protokolü
                    </h1>
                    <p className="text-gray-400 mt-2 max-w-4xl mx-auto">{T.lig_subtitle || "Synara trader'ları arasındaki disiplin metriklerine dayalı anonim liderlik tablosu."}</p>
                </div>
                
                {/* 1. KRİTİK METRİKLER VE RANK (Grid yapısında birleştirildi) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Metrik Kartları */}
                    <div className="md:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-6">
                         {cardData.map(data => (
                            <StatCard 
                                key={data.title} 
                                title={data.title} 
                                value={data.value}
                                icon={data.icon}
                                color={data.color}
                                unit={data.unit}
                            />
                        ))}
                    </div>
                     {/* Rank Kartı */}
                    <div className="md:col-span-1">
                        <UserRankCard rankData={userRanks} T={T} />
                    </div>
                </div>

                {/* 2. LİDERLİK KARŞILAŞTIRMASI (Holografik Çubuklar) */}
                {!loading && !noUserMetrics && leaderMetrics && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="futuristic-card p-6 rounded-2xl border-2 border-yellow-700/50 shadow-2xl shadow-yellow-900/40"
                    >
                        <h2 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center">
                            <Icon name="activity" className="w-6 h-6 mr-3" />
                            Liderlik Karşılaştırma Protokolü
                        </h2>
                        <div className="space-y-4">
                            <ComparisonBar 
                                title={T.kasa_summary_win_rate} 
                                userValue={userMetrics.winRate} 
                                leaderValue={leaderMetrics.winRate.winRate} 
                                unit="%"
                            />
                            <ComparisonBar 
                                title={T.kasa_summary_avg_rr} 
                                userValue={userMetrics.averageRR} 
                                leaderValue={leaderMetrics.averageRR.averageRR} 
                                unit=" R"
                            />
                            <ComparisonBar 
                                title="Profit Factor" 
                                userValue={userMetrics.profitFactor} 
                                leaderValue={leaderMetrics.profitFactor.profitFactor} 
                                unit=""
                            />
                        </div>
                    </motion.div>
                )}
                
                {/* 3. LİDERLİK TABLOSU (Sekmeli ve Dinamik) */}
                <div className="futuristic-card rounded-2xl border border-gray-700 shadow-xl">
                    <div className="p-2 border-b border-gray-700">
                        <div className="flex justify-center space-x-2">
                            {tabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    // KRİTİK STİL: Fütüristik sekme stili
                                    className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 transform hover:scale-[1.03] ${
                                        activeTab === tab.key 
                                        ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/50' 
                                        : 'text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {loading ? (
                         <div className="h-64 flex justify-center items-center"><p>{T?.kasa_loading || 'Liderlik tablosu analizi sürüyor...'}</p></div>
                    ) : (
                        <LeaderboardTable 
                            data={activeData.slice(0, 50)} // İlk 50'yi göstererek performans artışı
                            category={tabs.find(t=>t.key === activeTab).label} 
                            T={T}
                            currentUserDisplayName={currentUserDisplayName}
                            activeTab={activeTab}
                        />
                    )}
                </div>

                 <div className="text-center text-xs text-gray-500 p-4 bg-gray-800/50 rounded-lg">
                    <p>{T.lig_disclaimer || "Liderlik tablosu, tüm kullanıcıların verileri anonimleştirilerek oluşturulur ve saatte bir güncellenir."}</p>
                </div>
            </div>
        </div>
    );
};

export default LigPage;
