// path: components/home/StatsBarClient.js
'use client';

import React, { useMemo } from 'react';
import Icon from '@/components/Icon';
import { motion } from 'framer-motion';

// --- YENİ BİLEŞEN: Ticker Bar (Kayar Bant) ---
const TickerBarClient = ({ T }) => {
    // Synara'nın temel felsefesini ve modül vurgularını içeren mesajlar
    const messages = useMemo(() => [
        { text: "DİSİPLİN, DUYGUYA ÜSTÜN GELİR", color: 'text-indigo-400', icon: 'shield-check' },
        { text: "ANCHOR TF: Sinyal Asla Geri Dönmez (Non-Repaint Garanti)", color: 'text-yellow-400', icon: 'alarm-clock' },
        { text: "NEXUS-FIRST: En Yüksek Kaliteli Order Block Tetikleyicisi", color: 'text-green-400', icon: 'blocks' },
        { text: "HIM PROTOKOLÜ: Yüzlerce Veri Tek Bir Karara İndirgenir", color: 'text-sky-400', icon: 'cpu' },
        { text: "RİSK KAPILARI: Volatilite Yoğunluğunda Giriş İptali", color: 'text-red-400', icon: 'shield-alert' },
        { text: "MESTEG TEKNOLOJİ: 2014'ten Beri Kritik Sistem Mimarisi", color: 'text-orange-400', icon: 'mesteg' },
    ], []);
    
    // Yeterli içeriği sağlamak için mesajları çoğalt
    const duplicatedMessages = useMemo(() => [...messages, ...messages, ...messages], [messages]);


    return (
        // KRİTİK DÜZELTME: Eski stat bar yerine yeni yapı
        <section className="bg-gray-900/50 py-4 border-y border-indigo-900/50 overflow-hidden relative">
            <div className="ticker-container" aria-hidden="true">
                <div className="ticker-content">
                    {duplicatedMessages.map((msg, index) => (
                        <span 
                            key={index} 
                            className={`flex items-center gap-2 mx-6 text-lg font-bold whitespace-nowrap ${msg.color}`}
                        >
                            <Icon name={msg.icon} className={`w-6 h-6 ${msg.color} flex-shrink-0`} />
                            {msg.text}
                        </span>
                    ))}
                </div>
            </div>
            
            {/* Kenar Gradyanları */}
            <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#0b1220] to-transparent z-10 pointer-events-none"></div>
            <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#0b1220] to-transparent z-10 pointer-events-none"></div>
        </section>
    );
};

export default TickerBarClient;
