// path: app/analyses/page.js
'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { useAuth } from '@/context/AuthContext';
import { trpc } from '@/lib/trpc/client';
import { motion } from 'framer-motion';
import Image from 'next/image'; // next/image import edildi

// URL'den resim bilgisi alan yardımcı fonksiyon
const getUrlInfo = (url) => {
    if (!url) return null;
    try {
        const urlObject = new URL(url);
        const snapshotMatch = urlObject.pathname.match(/^\/x\/([a-zA-Z0-9]+)/);
        if (snapshotMatch && snapshotMatch[1]) {
            const id = snapshotMatch[1];
            const firstLetter = id.charAt(0).toLowerCase();
            return {
                type: 'image',
                src: `https://s3.tradingview.com/snapshots/${firstLetter}/${id}.png`
            };
        }
    } catch (e) { return null; }
    return null;
};

// Analiz Kartı Bileşeni
const AnalysisCard = ({ analysis, index, T }) => {
    const urlInfo = getUrlInfo(analysis.tradingViewChartUrl);
    const imageUrl = urlInfo?.src || `https://placehold.co/600x400/1F2937/4F46E5?text=${encodeURIComponent(analysis.title)}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className="h-full"
        >
            <Link href={`/analyses/${analysis.id}`} className="group block h-full">
                <article className="bg-gray-800/50 rounded-2xl border border-gray-700 hover:border-indigo-500/50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl overflow-hidden h-full flex flex-col">
                    <div className="relative h-48 w-full">
                        <Image
                            src={imageUrl}
                            alt={analysis.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                        <h2 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-2 mb-2 flex-grow">
                            {analysis.title}
                        </h2>
                        <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-700 pt-3 mt-auto">
                            <span>{analysis.authorName}</span>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1" title={T.analysis_rating_label || "Ortalama Puan"}>
                                    <Icon name="star" className="w-4 h-4 text-yellow-400"/>
                                    <span className="font-semibold">{analysis.rating.average.toFixed(1)}</span>
                                </div>
                                <div className="flex items-center gap-1" title={T.analysis_synara_score || "Synara Puanı"}>
                                    <Icon name="zap" className="w-4 h-4 text-sky-400"/>
                                    <span className="font-semibold">{analysis.score.toFixed(0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </article>
            </Link>
        </motion.div>
    );
};

// Öne Çıkan Analiz Kartı Bileşeni (Resim eklendi)
const FeaturedAnalysisCard = ({ analysis, T }) => {
    if (!analysis) return null;
    const urlInfo = getUrlInfo(analysis.tradingViewChartUrl);
    const imageUrl = urlInfo?.src || `https://placehold.co/1280x720/1F2937/4F46E5?text=${encodeURIComponent(analysis.title)}`;

    return (
        <motion.div
            className="lg:col-span-full bg-gradient-to-br from-indigo-900/50 to-gray-900/50 p-6 rounded-3xl border-2 border-indigo-500/50 shadow-2xl shadow-indigo-900/40 mb-12"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
        >
            <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Sol Taraf: Resim */}
                <Link href={`/analyses/${analysis.id}`} className="group block relative aspect-video rounded-xl overflow-hidden">
                    <Image
                        src={imageUrl}
                        alt={analysis.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors"></div>
                    <div className="absolute top-3 right-3 flex items-center gap-2 text-yellow-400 bg-yellow-900/70 px-3 py-1 rounded-full text-sm font-bold border border-yellow-500/50">
                        <Icon name="award" className="w-5 h-5"/>
                        <span>{T.analysis_highest_score || "En Yüksek Puanlı"}</span>
                    </div>
                </Link>
                {/* Sağ Taraf: İçerik */}
                <div>
                    <Link href={`/analyses/${analysis.id}`} className="group block">
                        <h3 className="text-2xl lg:text-3xl font-extrabold text-white group-hover:text-indigo-300 transition-colors">{analysis.title}</h3>
                        <div className="flex flex-wrap items-center text-xs text-gray-400 gap-x-4 gap-y-1 mt-2">
                            <span>Yazar: <span className="font-semibold text-gray-300">{analysis.authorName}</span></span>
                            <span className="flex items-center gap-1"><Icon name="star" className="w-4 h-4 text-yellow-400"/> {analysis.rating.average.toFixed(2)} ({analysis.rating.count} oy)</span>
                            <span className="flex items-center gap-1"><Icon name="zap" className="w-4 h-4 text-sky-400"/> {analysis.score.toFixed(0)} {T.analysis_synara_score || "Puan"}</span>
                        </div>
                    </Link>
                    {analysis.aiCommentary && (
                        <div className="mt-4 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-indigo-300 mb-2">
                                <Icon name="zap" className="w-4 h-4"/>
                                {T.analysis_ai_take || "Synara Yapay Zeka Değerlendirmesi"}
                            </h4>
                            <p className="text-sm text-gray-300 italic leading-relaxed line-clamp-4">{analysis.aiCommentary}</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};


const AnalysesPortalPage = () => {
    const { T, loading: authLoading, user } = useAuth();
    const { data: analyses, isLoading, error } = trpc.analysis.getAnalyses.useQuery();

    if (isLoading || authLoading || !T) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center">
                 <div className="loader"></div>
            </div>
        );
    }

    if (error) {
         return (
            <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center">
                <p className="text-red-400">Hata: {error.message}</p>
            </div>
        );
    }

    const sortedAnalyses = analyses || [];
    const featuredAnalysis = sortedAnalyses.length > 0 ? sortedAnalyses[0] : null;
    const otherAnalyses = sortedAnalyses.length > 1 ? sortedAnalyses.slice(1) : [];


    return (
        <div className="min-h-screen bg-[#111827] text-white">
             {/* KRİTİK GÜNCELLEME: Hero Section stili diğer sayfalarla uyumlu hale getirildi */}
            <section className="relative py-20 md:py-24 text-center overflow-hidden bg-gray-900 border-b border-indigo-700/50">
                <div className="absolute inset-0 bg-grid-indigo-500/10 bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_at_center,transparent_0%,black_100%)]"></div>
                <div className="absolute inset-0" style={{
                    background: 'radial-gradient(ellipse at center, rgba(79, 70, 229, 0.1) 0%, rgba(17, 24, 39, 0) 70%)'
                }}></div>
                <div className="container mx-auto px-6 relative">
                    <motion.h1
                        className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="gradient-text">{T.analysis_portal_title}</span>
                    </motion.h1>
                    <motion.p
                        className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        {T.analysis_portal_subtitle}
                    </motion.p>
                    {user && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                             {/* KRİTİK GÜNCELLEME: Buton, fütüristik glow-on-hover stiline geçirildi */}
                            <Link href="/analyses/create" className="glow-on-hover-btn-primary inline-flex items-center justify-center gap-2">
                                <Icon name="plus" className="w-5 h-5"/>
                                {T.analysis_create_new}
                            </Link>
                        </motion.div>
                    )}
                </div>
            </section>

            {/* Analiz Kartları */}
            <div className="py-12 px-4">
                <div className="container mx-auto max-w-7xl">
                    {sortedAnalyses && sortedAnalyses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            <FeaturedAnalysisCard analysis={featuredAnalysis} T={T} />
                            {otherAnalyses.map((analysis, index) => (
                                <AnalysisCard key={analysis.id} analysis={analysis} index={index} T={T} />
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-16">
                            <Icon name="align-left" className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                            <p className="text-lg text-gray-500">{T.analysis_no_analyses}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalysesPortalPage;
