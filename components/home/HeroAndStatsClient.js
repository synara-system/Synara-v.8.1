// path: components/home/HeroAndStatsClient.js
'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Icon from '@/components/Icon';
import AnimatedCounter from '@/components/AnimatedCounter';
import Image from 'next/image';
// import useScrollAnimation from '@/hooks/useScrollAnimation'; // Hata kaynağı olduğu için kaldırıldı

// --- YARDIMCI BİLEŞENLER ---

const SatelliteNode = ({ name, color, style }) => (
  // KRİTİK FİX: framer-motion'dan bağımsız, stabil kaydırma hook'u kullanıldı.
  <div className="satellite-wrapper" style={style}>
    {/* Bu eleman yörünge animasyonunu üstlenir. */}
    <motion.div 
        className={`satellite-node ${color}`} 
        // Yörüngede hareket eden dairenin kendisi
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
    >
        {/* r:undefined hatasını ortadan kaldırmak için iç içe div yapısı kullanıldı. */}
        <div className={`w-5 h-5 rounded-full shadow-lg cursor-pointer ${color}`} />
        <div className="satellite-label">{name}</div>
    </motion.div>
  </div>
);


// 1. YENİ HERO BÖLÜMÜ (UZAY TEMALI & GÜNEŞ SİSTEMİ ANİMASYONU)
// KRİTİK DÜZELTME: Bu bir named export olarak kalmalı, app/page.js'e taşınacak.
export const HeroClient = ({ T }) => {
  // KRİTİK DÜZELTME: 4 yörünge modülü ve renkleri
  const nexusColor = 'bg-green-400';
  const metisColor = 'bg-yellow-400';
  const rsiHanColor = 'bg-orange-400';
  const visualsColor = 'bg-red-400';
  const engineColor = 'text-indigo-300'; // Merkezdeki Engine
    
  // Animasyon hook'u (varsayımsal)
  // const { ref: heroRef, controls: heroControls } = useScrollAnimation(0.2); // Kaldırıldı

  // Framer Motion Varyantları
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15, // Çocuk elemanlar arası gecikme süresi
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <section 
        // ref={heroRef} // Ref kaldırıldı
        id="hero" 
        // mt-16 ekleyerek Header'ın altında kalmasını sağlıyoruz
        className="relative bg-gray-900 overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24 mt-16" 
    >
        {/* KRİTİK FİX: Arka plan için Image kaldırıldı. */}
        <div className="absolute inset-0 z-0 bg-gray-900 opacity-90">
            {/* Boş Div: Görsel yerine sadece opak koyu renk katman kalmıştır. */}
        </div>
        
        {/* Yıldız animasyonları tekrar eklendi. (globals.css'te tanımlı) */}
        <div className="stars-container absolute inset-0 z-0">
            <div id="stars1"></div>
            <div id="stars2"></div>
            <div id="stars3"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 max-w-7xl text-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Sol Taraf: İçerik (Framer Motion ile Sarıldı) */}
            <motion.div 
              className="text-center lg:text-left"
              initial="hidden"
              animate="visible"
              variants={containerVariants} // Ana konteyner varyantı
            >
              <motion.span 
                className="inline-block bg-indigo-500/20 text-indigo-300 text-sm font-semibold px-4 py-1 rounded-full"
                variants={itemVariants}
              >
                {T.hero_tag}
              </motion.span>
              <motion.h1 
                className="text-4xl md:text-5xl font-extrabold text-white mt-4 leading-tight"
                variants={itemVariants}
              >
                {T.hero_title_part1} <span className="gradient-text">{T.hero_title_part2}</span>
              </motion.h1>
              <motion.p 
                className="mt-6 text-gray-400 max-w-xl mx-auto lg:mx-0 text-lg"
                variants={itemVariants}
              >
                {T.hero_subtitle_new}
              </motion.p>
              
              {/* Butonlar için Ayrı Motion.div (Sıralı animasyonun parçası) */}
              <motion.div 
                className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
                variants={itemVariants}
              >
                <Link href="/register" className="glow-on-hover-btn-primary w-full sm:w-auto inline-flex items-center justify-center">
                  {T.pricing_cta_button}
                </Link>
                <Link href="/modules" className="synth-btn-secondary w-full sm:w-auto inline-flex items-center justify-center">
                  Sistem Mimarisi
                </Link>
              </motion.div>
              
              <motion.div 
                className="mt-8 flex items-center justify-center lg:justify-start gap-4"
                variants={itemVariants}
              >
                <div className="flex -space-x-2">
                  {/* ... İmajlar (unoptimized ile korundu) ... */}
                  <Image 
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-gray-800" 
                      src="https://placehold.co/32x32/E9D5FF/9333EA?text=A" 
                      alt="Kullanıcı A"
                      width={32}
                      height={32}
                      unoptimized={true} 
                  />
                  <Image 
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-gray-800" 
                      src="https://placehold.co/32x32/A7F3D0/059669?text=B" 
                      alt="Kullanıcı B"
                      width={32}
                      height={32}
                      unoptimized={true} 
                  />
                  <Image 
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-gray-800" 
                      src="https://placehold.co/32x32/BAE6FD/0284C7?text=C" 
                      alt="Kullanıcı C"
                      width={32}
                      height={32}
                      unoptimized={true} 
                  />
                </div>
                <p className="text-sm text-gray-400">{T.hero_social_proof}</p>
              </motion.div>
            </motion.div>

            {/* Sağ Taraf: Sistem Çekirdeği Animasyonu */}
            <div className="relative h-[450px] lg:h-[500px] flex items-center justify-center">
              <div className="w-full h-full">
                {/* KRİTİK EKLENTİ: Yörünge kapsayıcısına fade-in animasyonu */}
                <motion.div 
                    className="simplified-orbit-container"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                >
                  {/* Merkez: Engine Modülü */}
                  <div className="system-core">
                    <Icon name="boxes" className={`w-8 h-8 ${engineColor}`} />
                  </div>
                  {/* Yörüngeler: 4 Ana Modül (SatelliteNode içindeki motion ile canlanıyor) */}
                  <SatelliteNode name="Nexus" color={nexusColor} style={{'--orbit-radius': '140px', '--orbit-duration': '20s', '--orbit-delay': '0s'}} />
                  <SatelliteNode name="Metis" color={metisColor} style={{'--orbit-radius': '200px', '--orbit-duration': '30s', '--orbit-delay': '-5s'}}/>
                  <SatelliteNode name="RSI-HAN" color={rsiHanColor} style={{'--orbit-radius': '260px', '--orbit-duration': '40s', '--orbit-delay': '-20s'}}/>
                  <SatelliteNode name="Visuals" color={visualsColor} style={{'--orbit-radius': '320px', '--orbit-duration': '50s', '--orbit-delay': '-10s'}} />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>
  );
};

// 2. CANLI İSTATİSTİK BARI
export const StatsBarClient = ({ T }) => {
    const stats = [
        { label: "Aktif Sinyal", value: 37, icon: "activity" },
        { label: "Başarı Oranı", value: 82, isPercent: true, icon: "check-circle-2" },
        { label: "Toplam Üye", value: 400, icon: "user-circle-2" },
        { label: "Ort. R:R", value: 3.2, isRatio: true, icon: "award" }
    ];

    return (
        <section className="bg-gray-900/50 py-8 border-y border-indigo-900/50">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, index) => (
                        <motion.div 
                            key={stat.label} 
                            className="text-center"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.5 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <Icon name={stat.icon} className="w-8 h-8 mx-auto text-indigo-400 mb-2"/>
                            <p className="text-3xl font-extrabold text-white">
                                <AnimatedCounter to={stat.value} isPercent={stat.isPercent} isRatio={stat.isRatio} />
                                {stat.isRatio ? 'R' : ''}
                            </p>
                            <p className="text-sm text-gray-400">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
