// path: app/mesteg-referans/page.js

'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { MESTEG_CONTENT } from '@/data/mesteg-content';
import DynamicImage from '@/components/DynamicImage';
import Icon from '@/components/Icon';
// Head bileşenini App Router'da kullanmamalıyız.
// import Head from 'next/head'; 
import { motion, AnimatePresence } from 'framer-motion'; 
import useScrollAnimation from '@/hooks/useScrollAnimation';

// --- YARDIMCI BİLEŞENLER ---

const StatCard = ({ label, value, unit, description, index }) => {
    const cardRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = useCallback((e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setMousePos({ 
            x: e.clientX - rect.left, 
            y: e.clientY - rect.top 
        });
    }, []);

    const gradientStyle = {
        '--x': `${mousePos.x}px`,
        '--y': `${mousePos.y}px`,
    };
    
    return (
        <motion.div 
            ref={cardRef}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            onMouseMove={handleMouseMove}
            // KRİTİK STİL: Pembe/Sarı protokolüne uygun, mouse-hover efektli kart
            className="p-6 bg-pink-900/50 rounded-none border-b-4 border-l-4 border-pink-700/70 shadow-lg transition duration-300 hover:border-yellow-400/70 hover:shadow-2xl hover:shadow-pink-900/50 stat-card-light-fx edge-cut-card" 
            style={gradientStyle}
        >
             {/* Mouse Takip Efekti Katmanı (Işık geçişi) */}
             <div className="mouse-glow"></div>

            <p className="text-6xl font-extrabold text-yellow-400 mb-2 font-mono">{value}{unit}</p>
            <p className="text-lg font-semibold text-white uppercase border-b-2 border-yellow-500/50 pb-2">{label}</p>
            <p className="text-sm text-gray-400 mt-3">{description}</p>
            {/* Neon Vurgu Çizgisi (Sarı) */}
            <div className="absolute top-0 left-0 h-full w-0.5 bg-yellow-500 shadow-xl shadow-yellow-500/50"></div>
        </motion.div>
    );
};

// AKORDİYON/OKUMA BÖLGESİ BİLEŞENİ (YENİ GX PROTOKOLÜ)
const ReadingArticleSection = ({ icon, title, content, tag, index }) => {
    const [ref, isVisible] = useScrollAnimation(0.2);
    const [isOpen, setIsOpen] = useState(false);
    
    const contentVariants = {
        collapsed: { height: 0, opacity: 0 },
        open: { 
            height: "auto", 
            opacity: 1,
            transition: { duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] } 
        },
    };
    
    const sectionVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: index * 0.05 } }
    };
    
    const renderContent = content.split('\n').map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        
        if (line.startsWith('- **')) {
             const match = line.match(/- \*\*([^:]+):\*\* (.+)/);
             if (match) {
                 return (
                     // KRİTİK FİX: Madde listelerinden beyaz çizgiler kaldırıldı.
                     <motion.div 
                        key={i} 
                        className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 bg-transparent rounded-none transition-all duration-300 relative edge-cut-content-block hover:bg-gray-900/50 hover:shadow-yellow-500/30"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.05 + i * 0.05 }}
                    >
                        <span className="font-bold text-yellow-300 text-lg md:w-1/3">{match[1]}</span>
                        <span className="text-gray-400 text-sm md:text-base mt-1 md:mt-0 font-mono md:w-2/3">{match[2]}</span>
                    </motion.div>
                 );
             }
        }
        
        if (line.startsWith('**')) {
             return <p key={i} className="text-white font-extrabold mt-4 mb-2 text-xl border-b border-pink-500/30 pb-1">{line.replace(/\*\*/g, '')}</p>
        }
        
        return <p key={i} className="text-gray-300 leading-relaxed">{line}</p>;
    });
    
    return (
        <motion.section 
            ref={ref}
            variants={sectionVariants}
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            // KRİTİK DÜZELTME: Ana Section arkaplanı kaldırıldı (Pure Neon estetiği).
            className="rounded-none shadow-none overflow-hidden page-section-container"
        >
            <motion.header
                onClick={() => setIsOpen(!isOpen)}
                // KRİTİK GÜNCELLEME 1: Header'ın tamamı merkeze hizalandı (görseldeki gibi)
                // KRİTİK GÜNCELLEME 2: Neon efekti ve kesik kenar sınıfları kullanıldı
                className={`flex justify-between items-center p-4 md:p-6 cursor-pointer transition-all duration-300 relative rounded-none edge-cut-header-soft border-2 ${
                    isOpen 
                        ? 'bg-pink-900/50 text-yellow-400 border-yellow-400 header-pulse-pink' 
                        : 'bg-gray-900/80 hover:bg-gray-800/80 border-pink-700/50 hover:border-yellow-400/50'
                }`}
            >
                {/* Sol Taraf: İkon ve Başlık */}
                <div className="flex items-center">
                    <Icon name={icon} className={`w-6 h-6 mr-4 ${isOpen ? 'text-yellow-400' : 'text-pink-400'}`} /> 
                    <h2 className="text-xl font-bold text-white pr-4">{title}</h2>
                </div>
                 {/* Sağ Taraf: TAG ve Chevron İkonu */}
                 {/* KRİTİK GÜNCELLEME 3: Tag etrafına tam ortalama (görseldeki etiket hissi için) */}
                 <div className="flex items-center space-x-4">
                    {tag && 
                        <span className="text-xs font-mono text-gray-500 px-3 py-1 bg-gray-700 rounded-full border border-gray-600 accordion-tag-centered">
                            {tag}
                        </span>
                    }
                    <motion.div
                        animate={{ rotate: isOpen ? 90 : 0 }}
                        transition={{ duration: 0.3 }}
                    >
                         <Icon name="chevron-right" className="w-6 h-6 text-yellow-400" />
                    </motion.div>
                </div>
            </motion.header>
            
            {/* İçerik Gövdesi */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={contentVariants}
                        // KRİTİK DÜZELTME: Arkaplanı şeffaf yaptık, sadece border kaldı.
                        className="overflow-hidden bg-transparent relative edge-cut-content border-l-2 border-r-2 border-b-2 border-pink-900/50"
                    >
                        {/* Holografik Vurgu Katmanı - Pembe/Sarı odaklı */}
                        <div className="holographic-glow-pink absolute top-0 left-0 w-full h-full pointer-events-none opacity-10"></div>
                         
                         <div className="space-y-3 p-6 pt-4 pl-8 max-w-4xl mx-auto relative z-10">
                            {renderContent}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
        </motion.section>
    );
};

// YENİ BİLEŞEN: Data Stream Simülasyonu (Pembe/Sarı Protokolü) - KURUMSAL VURGU
const DataStreamViz = () => {
    // Veri noktaları, Pembe (#FF007F) ve Sarı (#FFC107) renklerinde simüle edilecek
    const dataPoints = useMemo(() => Array(30).fill(0).map((_, i) => {
        const isPink = Math.random() > 0.5;
        return {
            id: i,
            height: Math.random() * 80 + 20, // 20% to 100% height
            // KRİTİK FİX: Sadece Pembe ve Sarı kullanıldı.
            color: isPink ? 'bg-pink-500 shadow-pink-500/50' : 'bg-yellow-500 shadow-yellow-500/50', 
            delay: Math.random() * 2 // Random delay for animation
        };
    }), []);

    return (
        <motion.div 
            className="w-full h-64 bg-gray-900/50 border border-gray-700 shadow-xl overflow-hidden relative flex items-end px-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
        >
             {/* Arkaplan Mesh Izgarası (Daha koyu) */}
            <div className="absolute inset-0 holographic-grid opacity-20"></div>
            
            {dataPoints.map(point => (
                 <motion.div
                    key={point.id}
                    className={`w-1.5 mx-1 mb-1 rounded-t-full ${point.color} transition-colors duration-1000`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: `${point.height}%`, opacity: 1 }}
                    transition={{ 
                        duration: 1, 
                        delay: point.delay,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                    }}
                 />
            ))}
            
            <motion.div 
                className="absolute inset-0 border-t-2 border-yellow-400/80"
                style={{ top: '50%' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <span className="absolute left-2 -top-3 text-xs font-mono text-yellow-400">Kurumsal Ortalaması (Simülasyon)</span>
            </motion.div>
            
        </motion.div>
    );
}

// KRİTİK DÜZELTME: Artık Head içeriğini Next.js'in statik metadata yapısına bıraktık.
const MestegReferansPage = () => {
    
    // KRİTİK CSS ENJEKSİYONU: Edge-Cut, Neon Efektleri ve Opera Renk Protokolü
    const customStyles = `
        /* KRİTİK CSS: Edge-Cut (Kesikli Kenar) Estetiği */
        
        /* Edge-Cut Header - Ok şekli kaldırıldı, sadece keskin bir köşe bırakıldı */
        .edge-cut-header-soft {
            clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0); /* Basit dörtgen */
            margin-right: 0; /* Margin kaldırıldı */
            border-left: 2px solid transparent !important;
            border-bottom: 2px solid #374151;
            /* KRİTİK: Sağ üst köşeye yumuşak kesik */
            border-top-right-radius: 1.5rem; 
            border-top-left-radius: 0.5rem;
        }
        .edge-cut-header-soft:hover {
            border-color: #FF007F !important; /* Pembe (Opera GX) */
        }
        .edge-cut-header-soft.bg-pink-900\\/50 {
            /* Açık durumda daha belirgin bir pembe border */
            border: 2px solid #FF007F !important;
            border-top-right-radius: 1.5rem;
        }

        /* Edge-Cut Content (İçerik) - Arkaplansız kalmalı */
        .edge-cut-content {
            /* Aggressive alt köşe kesiği kaldırıldı */
            clip-path: none; 
            border: none; /* Dışarıdan gelen tüm border'ları kaldır */
            margin-left: 0; /* Margin kaldırıldı */
            margin-bottom: 0;
            background: transparent !important;
        }
        
        /* Edge-Cut Stat Card (Stat Kartlarına agresif kesik) */
        .edge-cut-card {
            /* Sol alt ve sağ üst köşelerde kesik */
            clip-path: polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0% 10%);
            border: 1px solid #4B5563; /* Gray-600 */
        }
        
        /* KRİTİK YENİ EKLEME: Akordiyon başlığındaki tag'in ortalanması */
        .accordion-tag-centered {
             display: flex;
             align-items: center;
             justify-content: center;
             /* Görseldeki gibi karanlık border ve hafif neon gölge */
             border: 1px solid #FF007F !important;
             box-shadow: 0 0 5px #FF007F55;
             height: 30px; /* Görselle uyum sağlaması için sabit yükseklik */
        }

        /* --- NEON/IŞIK EFEKTLERİ --- */

        /* KRİTİK: Pembe Pulse Animasyonu (Header Pulse) */
        .header-pulse-pink {
            animation: neon-pulse-pink 1.5s infinite alternate;
        }
        @keyframes neon-pulse-pink {
            0% { box-shadow: 0 0 5px #ff007f55; border-color: #ff007f; } /* Pembe/FF007F */
            100% { box-shadow: 0 0 20px #ff007f99, 0 0 30px #ff007f55; border-color: #ff007f; }
        }

        /* KRİTİK: Sarı Pulse Animasyonu (Header Pulse) */
        .header-pulse {
            animation: neon-pulse 1.5s infinite alternate;
        }
        @keyframes neon-pulse {
            0% { box-shadow: 0 0 5px #facc1555; border-color: #facc15; } /* Sarı/Yellow-400 */
            100% { box-shadow: 0 0 20px #facc1599, 0 0 30px #facc1555; border-color: #facc15; }
        }

        /* 3. Holografik Grid ve Glow */
        .holographic-grid {
            background-size: 50px 50px;
            background-image: linear-gradient(to right, #374151 1px, transparent 1px),
                              linear-gradient(to bottom, #374151 1px, transparent 1px);
        }
        /* Holografik Vurgu Katmanı - Pembe/Sarı Karışımı */
        .holografik-glow-pink {
            /* Kayan neon gradyan - Pembe ve Sarı karışımı */
            background: radial-gradient(circle at 100% 0%, rgba(255, 0, 127, 0.2) 0%, rgba(255, 193, 7, 0.2) 50%, transparent 80%);
            animation: glow-shift 10s linear infinite alternate;
        }

        /* KRİTİK: Sadece Neon Hatlar için Konteyner Stillerini Kaldırıyoruz */
        .page-section-container {
             background: transparent !important; /* Arkaplanı tamamen kaldır */
             border: none !important; /* Standart bordürü kaldır */
             box-shadow: none !important; /* Gölgeyi kaldır */
        }
        
        /* KRİTİK FİX: Mouse Glow Efekti */
        .stat-card-light-fx {
            position: relative;
            z-index: 10;
            overflow: hidden;
             box-shadow: 0 0 10px rgba(255, 193, 7, 0.1); 
        }
        .stat-card-light-fx::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            /* Pembe/Mor gradyanı zorla */
            background: radial-gradient(circle 400px at var(--x) var(--y), rgba(255, 0, 127, 0.35) 0%, transparent 80%); 
            opacity: 0;
            transition: opacity 0.5s;
        }
        .stat-card-light-fx:hover::before {
            opacity: 1;
        }
        .stat-card-light-fx * {
            position: relative; /* İçerik Z-index 1'in üzerinde kalmalı */
            z-index: 2;
        }

        /* KRİTİK DÜZELTME: DataStreamViz'in konteyner arkaplanı şeffaf ve border'ı pembe/sarı */
        .data-viz-container {
            background: transparent !important;
            border: 2px solid #FF007F !important;
            box-shadow: 0 0 15px rgba(255, 0, 127, 0.4);
        }
        
        /* KRİTİK YENİ STİL: Hero'daki büyük başlık ve logonun neon görünümü */
        .hero-title-neon {
            /* Görseldeki gibi sarı bir iç glow ve pembe dış glow */
            text-shadow: 0 0 15px #FFC107, 0 0 30px #FF007F; /* Sarı ve Pembe Neon */
            color: #FFC107; /* Sarı */
            transition: all 0.5s;
        }
        .hero-subtitle-neon {
            /* Alt başlığa daha hafif pembe bir gölge */
            text-shadow: 0 0 5px #FF007F80; 
        }
    `;


    return (
        <div className="bg-gray-900 min-h-screen">
            {/* Özel stilleri enjekte et */}
            <style dangerouslySetInnerHTML={{ __html: customStyles }} />

            {/* Hero Section (Görseldeki gibi merkezi ve büyük) */}
            <section className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8 text-center overflow-hidden bg-gray-900 border-b border-gray-800">
                {/* Holografik Izgara ve Gradient Arka Plan */}
                <div className="absolute inset-0 holographic-grid opacity-20"></div>
                <div className="absolute inset-0" style={{
                    background: 'radial-gradient(ellipse at center, rgba(255, 204, 0, 0.15) 0%, rgba(17, 24, 39, 0) 70%)'
                }}></div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
                        className="mb-6"
                    >
                        {/* KRİTİK: Logo Icon ve Neon Class eklendi */}
                        <Icon name="mesteg" className="w-20 h-20 mx-auto text-yellow-400 animate-pulse-slow hero-title-neon" />
                    </motion.div>
                    
                    {/* ANA BAŞLIK */}
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        // KRİTİK GÜNCELLEME: Daha büyük font (6xl) ve daha geniş aralık (tracking-widest) kullanıldı.
                        className="text-5xl sm:text-6xl font-extrabold hero-title-neon leading-tight mb-4 tracking-widest"
                    >
                        {MESTEG_CONTENT.hero.title}
                    </motion.h1>
                    
                    {/* ALT BAŞLIK */}
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        // KRİTİK GÜNCELLEME: Pembe (pink-400) font ve neon efekti kullanıldı.
                        className="text-xl text-pink-400 font-mono mb-8 hero-subtitle-neon"
                    >
                        {MESTEG_CONTENT.hero.subtitle}
                    </motion.p>
                    
                    {/* AÇIKLAMA */}
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="text-lg text-gray-300 max-w-3xl mx-auto"
                    >
                        {MESTEG_CONTENT.hero.description}
                    </motion.p>
                </div>
            </section>
            
            {/* 1. YENİ PROTOKOL MATRİSİ (Operasyonel Veri) - Geri Eklendi */}
            <div className="container mx-auto py-16">
                 {/* KRİTİK FİX: Arkaplan/Border sınıfları kaldırıldı */}
                 <section className="page-section-container"> 
                    <h2 className="text-3xl font-bold text-white mb-8 border-b pb-4 border-gray-700">
                        Operasyonel Protokol Yönetimi
                    </h2>
                    <DataStreamViz />
                </section>
            </div>

            {/* 2. STAT KARTLARI */}
            <div className="container mx-auto pb-16"> 
                 {/* STAT KARTLARI BURADA KALIYOR */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-0">
                    {MESTEG_CONTENT.stats.map((stat, i) => (
                        <StatCard key={i} {...stat} index={i} />
                    ))}
                </div>
            </div>

            {/* 3. ANA İÇERİK BÖLÜMLERİ (ACCORDION) */}
            <div className="container mx-auto pb-16">
                <div className="space-y-8">
                    
                    {/* PDF TEMELLİ TEKNİK OKUMA BÖLGESİ (ACCORDION) */}
                    <section className="page-section-container"> 
                         <h2 className="text-3xl font-bold text-white mb-0 p-6 border-b border-gray-700">
                            TEKNİK MAKALE: Synara System&apos;ın Modern ve Güçlü Web Altyapısı
                         </h2>
                        <div className="space-y-2">
                            {MESTEG_CONTENT.sections.map((section, i) => (
                                <ReadingArticleSection 
                                    key={section.id} 
                                    {...section} 
                                    index={i}
                                />
                            ))}
                        </div>
                    </section>
                </div>
            </div>
            
            <div className="text-center py-10 text-gray-500 border-t border-gray-800 mt-16">
                <p>Mesteg Teknoloji, Synara System&apos;in fikri mülkiyet ve teknik güvencesidir. (v1.0)</p>
            </div>
        </div>
    );
};

export default MestegReferansPage;
