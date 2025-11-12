// path: components/home/PricingSectionClient.js
'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion'; 
import Icon from '@/components/Icon';

const PricingSectionClient = ({ T }) => {
    // KRİTİK GÜNCELLEME: SEO'ya odaklanan özellikler listesi
    const features = [
        T.pricing_feature1, // Engine: Karar Motoru
        T.pricing_feature2, // Nexus: OB Tespiti
        T.pricing_feature3, // Metis: Makro Analiz
        T.pricing_feature4, // RSI-HAN: Momentum Analizi
        T.pricing_feature5, // Visuals: Konsensüs Skoru
        T.pricing_feature6 + " (Anchor TF Koruması)", // Repaint yapmayan sinyal
        T.pricing_feature7 + " (Disiplin Ligi Erişimi)", // Topluluk ve Lig
    ];

    return (
        <motion.section 
            id="pricing" 
            className="py-20 bg-[#111827]"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8 }}
        >
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    {/* SEO BAŞLIĞI: Kripto Sinyalleri ve Yapay Zeka Vurgusu */}
                    <h2 className="text-4xl md:text-5xl font-bold text-white max-w-2xl mx-auto">
                        <span className="gradient-text">Kripto Sinyallerinde Çığır Açan</span> Abonelik Modeli
                    </h2>
                    <p className="text-gray-400 mt-3 max-w-3xl mx-auto text-lg">
                        {T.pricing_section_subtitle}. Sadece **Anchor TF Kapanışında** mühürlenen, repaint yapmayan sinyallere erişin.
                    </p>
                </div>
                
                {/* YENİ FİYATLANDIRMA DÜZENİ: AI Felsefesini Vurgulayan Tek Kart */}
                <div className="max-w-4xl mx-auto relative p-px rounded-2xl shadow-2xl shadow-indigo-900/50" style={{ backgroundImage: 'linear-gradient(90deg, #4F46E5, #818CF8, #4F46E5)' }}>
                    
                    <div className="bg-gray-800/90 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 backdrop-blur-sm relative z-10">
                        {/* Sol Taraf: Fiyat ve CTA (Daha Vurucu) */}
                        <div className="p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-indigo-700/50">
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-3xl font-extrabold text-white">{T.pricing_plan_title}</h3>
                                    <span className="bg-yellow-600/30 text-yellow-300 text-sm font-semibold px-3 py-1 rounded-full border border-yellow-500/50 glow-pulse">{T.pricing_badge}: HOLİSTİK ZEKA</span>
                                </div>
                                <p className="text-gray-400 mt-2 text-sm leading-relaxed">
                                    Tüm 5 Uzman Modül, Context Bridge ve Repaint Korumalı **Anchor TF** Lisansı dahil.
                                </p>

                                <div className="mt-12 flex items-baseline">
                                    <span className="text-6xl font-extrabold text-white">{T.pricing_price}</span>
                                    <span className="ml-3 text-xl font-medium text-gray-400">{T.pricing_period_monthly}</span>
                                </div>
                            </div>
                            {/* Ana CTA */}
                            <div className="flex justify-center items-center mt-8">
                                {/* KRİTİK DÜZELTME: Metni ve ikonu tam ortalamak için `inline-flex items-center justify-center` eklendi */}
                                <Link href="/register" className="cursor-pointer block w-full sm:w-auto glow-on-hover-btn-primary text-xl inline-flex items-center justify-center">
                                    {T.pricing_cta_button}
                                </Link>
                            </div>
                        </div>

                        {/* Sağ Taraf: Özellikler (Daha Detaylı ve Tematik) */}
                        <div className="p-8">
                            <h4 className="font-extrabold text-white text-xl border-b border-gray-700/50 pb-2 mb-4">{T.pricing_includes_title}</h4>
                            <ul className="space-y-3 text-gray-300">
                                {features.map((feature, i) => (
                                    <li key={i} className="flex items-start">
                                        <Icon name="shield-check" className="w-5 h-5 text-green-400 mr-3 flex-shrink-0 mt-0.5"/>
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
                
                {/* Ek Not/Uyarı */}
                 <p className="text-center text-xs text-red-400/70 mt-12 max-w-xl mx-auto leading-relaxed font-semibold">
                     {T.footer_disclaimer}
                 </p>
            </div>
        </motion.section>
    );
};

export default PricingSectionClient;
