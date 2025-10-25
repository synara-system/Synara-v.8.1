// path: app/modules/page.js
'use client'; 

import React, { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Icon from '@/components/Icon';
import { useAuth } from '@/context/AuthContext';
import { useRequiredAuth } from '@/hooks/useRequiredAuth';
import SkeletonLoader from '@/components/SkeletonLoader';

// --- YARDIMCI BİLEŞEN: MODÜL KARTI (Pure Client Logic) ---

const ModuleCard = ({ module, index, T }) => {
  const { name, description, icon, color, link, status, disabled, contributes } = module;
  
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: index * 0.1 } },
    hover: { scale: 1.03, boxShadow: `0 0 25px rgba(255, 255, 255, 0.05), 0 0 40px var(--glow-color-${color})` },
  };

  const iconColorClass = `text-${color}-400`;
  const statusColorClass = status === (T.dashboard_sub_status_active || 'Aktif') ? 'text-green-400' : 'text-gray-500';
  
  const borderClass = `border-${color}-500/50`;
  const bgColorClass = `bg-${color}-500/20`;
  const glowHoverClass = `group-hover:ring-2 group-hover:ring-${color}-500/50`;
  
  const gradientClass = `bg-gradient-to-br from-gray-900/80 to-gray-900/50`;
  const linkText = module.id === 'kasa-yonetimi' || module.id === 'lig' || module.id === 'assistant' || module.id === 'analyses' ? 'Panele Git' : 'Detayı İncele';

  const content = (
    <motion.div 
        className={`module-card relative group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover={disabled ? {} : "hover"}
        style={{ 
             '--glow-color-indigo': '#818cf8', 
             '--glow-color-green': '#4ade80', 
             '--glow-color-yellow': '#facc15', 
             '--glow-color-sky': '#38bdf8', 
             '--glow-color-orange': '#fb923c', 
             '--glow-color-red': '#f87171', 
             '--glow-color-amber': '#fbbf24',
             '--glow-color-gray': '#9ca3af',
             '--glow-color-purple': '#a855f7',
        }}
    >
      <div className={`absolute inset-0.5 rounded-[15px] blur-sm transition-all duration-300 ${disabled ? 'hidden' : glowHoverClass}`} />
      
      <div className={`module-card-content ${gradientClass} border ${borderClass} rounded-2xl p-6 transition-all duration-300 transform-gpu`}>
        
        <div className="flex items-start justify-between">
            <div className={`p-3 rounded-full ${bgColorClass} transition-colors duration-300`}>
                <Icon name={icon} className={`w-8 h-8 ${iconColorClass}`} aria-hidden="true" />
            </div>
            <span className={`text-sm font-semibold ${statusColorClass}`}>{status}</span>
        </div>

        <h3 className="mt-5 text-xl font-bold text-white transition-colors duration-300 group-hover:text-white/90">
          {/* KRİTİK HATA DÜZELTMESİ: 'name' özelliğinin varlığını kontrol et */}
          {name ? name.split(':')[0].trim() : ''}
        </h3>
        
        <p className="mt-2 text-gray-400 text-sm flex-grow">
          {description}
        </p>
        
        <div className="mt-5 pt-4 border-t border-gray-800/50">
            <p className="text-xs font-semibold text-indigo-400 mb-1">{"Engine'e Katkısı:"}</p>
            <p className="text-sm font-bold text-white">{contributes}</p>
        </div>
        
        <div className="mt-5 flex justify-between items-center">
            <span className="text-xs font-mono text-gray-500">Sistem Protokolü</span>
            <div className="flex items-center text-sm font-medium text-indigo-400 group-hover:text-indigo-300 transition-colors">
                {linkText} <Icon name="arrow-right" className="w-4 h-4 ml-1" aria-hidden="true" />
            </div>
        </div>
      </div>
    </motion.div>
  );

  return disabled ? (
    <div className='pointer-events-none'>{content}</div> 
  ) : (
    <Link href={link} passHref legacyBehavior aria-label={`${module.name} Modülüne Git`}>
        {content}
    </Link>
  );
};


// --- Modül Ana Sayfası Bileşeni ---
const ModulesPage = () => {
  useRequiredAuth({ requireLogin: false }); 
  const { T, loading: authLoading } = useAuth();

  const MODULES = useMemo(() => {
    // KRİTİK HATA DÜZELTMESİ: T objesi veya anahtarları yüklenmediyse boş dizi döndür.
    if (!T || !T.engine_tab_title) {
        return [];
    }
    
    return [
      {
        id: 'engine', name: T.engine_tab_title, description: T.engine_tab_desc, 
        icon: 'boxes', color: 'indigo', link: '/modules/engine', status: T.dashboard_sub_status_active,
        contributes: 'Nihai AL/SAT/Çıkış Kararı',
      },
      {
        id: 'nexus', name: T.nexus_tab_title, description: T.nexus_tab_desc, 
        icon: 'blocks', color: 'green', link: '/modules/nexus', status: T.dashboard_sub_status_active,
        contributes: 'Giriş Tetikleyicisi (OB Fill / Re-Break)',
      },
      {
        id: 'metis', name: T.metis_tab_title, description: T.metis_tab_desc, 
        icon: 'thermometer', color: 'yellow', link: '/modules/metis', status: T.dashboard_sub_status_active,
        contributes: 'Makro Rejim (Trend/Range) ve Risk Uyarısı',
      },
      {
        id: 'rsi-han', name: T.rsi_tab_title, description: T.rsi_tab_desc, 
        icon: 'activity', color: 'orange', link: '/modules/rsi-han', status: T.dashboard_sub_status_active,
        contributes: 'Momentum Gücü ve Volatilite Sıkışması',
      },
      {
        id: 'visuals', name: T.visuals_tab_title, description: T.visuals_tab_desc, 
        icon: 'layout-grid', color: 'red', link: '/modules/visuals', status: T.dashboard_sub_status_active,
        contributes: 'Çoklu TF Konsensüs Skoru',
      },
      {
        id: 'assistant', name: T.nav_assistant || 'Synara AI Asistan', description: "Synara'nın tüm modül verilerine ve kasa performansınıza erişen bütünsel zeka asistanı.",
        icon: 'send', color: 'sky', link: '/assistant', status: T.dashboard_sub_status_active,
        contributes: 'Kişiselleştirilmiş Disiplin Yorumu ve Teknik Destek',
      },
      {
        id: 'analyses', name: T.nav_analysis_portal || 'Analiz Portalı', description: 'Topluluk tarafından paylaşılan, oylanan ve kalitesi AI tarafından değerlendirilen analizleri inceleyin.',
        icon: 'users', color: 'purple', link: '/analyses', status: T.dashboard_sub_status_active,
        contributes: 'Topluluk Teyidi ve Kalite Kontrolü',
      },
      {
        id: 'kasa-yonetimi', name: T.nav_kasa_yonetimi, description: 'Kişisel işlem geçmişinizi disiplinle kaydedin, performansı analiz edin.',
        icon: 'wallet', color: 'sky', link: '/kasa-yonetimi', status: T.dashboard_sub_status_active,
        contributes: 'Disiplin Skoru ve Kasa Büyüme Analizi',
      },
      {
        id: 'lig', name: T.nav_lig, description: 'Anonimleştirilmiş topluluk performansı ile kendi disiplininizi karşılaştırın.',
        icon: 'award', color: 'amber', link: '/lig', status: T.dashboard_sub_status_active,
        contributes: 'Anonim Liderlik ve Performans Motivasyonu',
      },
    ];
  }, [T]);
  
  // KRİTİK HATA DÜZELTMESİ: Yükleme sırasında iskelet göster.
  if (authLoading || !T || Object.keys(T).length === 0) {
     return <SkeletonLoader />;
  }


  return (
    <main className="relative min-h-screen pt-24 pb-16 bg-[#0b1220] overflow-hidden">
      
      <div className="container mx-auto px-6 relative z-10">
        
        <header className="text-center max-w-3xl mx-auto mb-16 pt-8">
            <p className="text-sm font-semibold uppercase text-indigo-400 flex items-center justify-center tracking-widest mb-3">
                <Icon name="boxes" className="w-5 h-5 mr-2" aria-hidden="true" />
                {T.modules_page_header_tag || "SİSTEM ÇEKİRDEK MİMARİSİ"}
            </p>
            <h1 className="text-5xl font-extrabold text-white leading-tight">
                {(T.modules_page_title_part1 || "Disiplinli Karar Alma")} <span className="gradient-text">{T.modules_page_title_part2 || "Protokolü"}</span>
            </h1>
            <p className="mt-4 text-lg text-gray-400">
                {T.modules_page_subtitle || "Synara Engine'i besleyen 5 uzman modülün çalışma prensibini ve Context Bridge yapısını keşfedin."}
            </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-12">
            {MODULES.map((module, index) => (
              <ModuleCard key={module.id} module={module} index={index} T={T} />
            ))}
        </div>

      </div>
    </main>
  );
};

export default ModulesPage;
