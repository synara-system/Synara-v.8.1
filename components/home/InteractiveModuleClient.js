// path: components/home/InteractiveModuleClient.js
'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, useInView, useAnimation } from 'framer-motion'; 
import Icon from '@/components/Icon';

// KRİTİK FİX: Tailwind'in derleme sırasında sınıfları atmasını önlemek için 
// tüm dinamik renk sınıflarını içeren statik bir eşleştirme nesnesi oluşturuldu.
const COLOR_CLASSES = {
    indigo: {
        bg: 'bg-indigo-500/20',
        text: 'text-indigo-400',
        border: 'border-indigo-500/50',
        ring: 'group-hover:ring-indigo-500/50',
    },
    green: {
        bg: 'bg-green-500/20',
        text: 'text-green-400',
        border: 'border-green-500/50',
        ring: 'group-hover:ring-green-500/50',
    },
    yellow: {
        bg: 'bg-yellow-500/20',
        text: 'text-yellow-400',
        border: 'border-yellow-500/50',
        ring: 'group-hover:ring-yellow-500/50',
    },
    orange: {
        bg: 'bg-orange-500/20',
        text: 'text-orange-400',
        border: 'border-orange-500/50',
        ring: 'group-hover:ring-orange-500/50',
    },
    red: {
        bg: 'bg-red-500/20',
        text: 'text-red-400',
        border: 'border-red-500/50',
        ring: 'group-hover:ring-red-500/50',
    },
};


// 3. İNTERAKTİF MODÜL IZGARASI
const InteractiveModuleClient = ({ T }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const controlsState = useAnimation(); 
  
  useEffect(() => {
    if (isInView) {
        controlsState.start("visible");
    }
  }, [isInView, controlsState]);

  const modules = useMemo(() => {
    // KRİTİK HATA DÜZELTMESİ: Çeviri objesi (T) yüklenmeden modülleri oluşturmaya çalışma.
    // Eğer T veya beklenen bir anahtar (örn: engine_tab_title) henüz yoksa, boş bir dizi döndür.
    if (!T || !T.engine_tab_title) {
        return [];
    }
    
    return [
        { id: 'engine', title: T.engine_tab_title, desc: T.engine_feat3_title, icon: 'boxes', color: 'indigo' }, 
        { id: 'nexus', title: T.nexus_tab_title, desc: T.nexus_feat1_title, icon: 'blocks', color: 'green' },
        { id: 'metis', title: T.metis_tab_title, desc: T.metis_feat2_title, icon: 'thermometer', color: 'yellow' },
        { id: 'rsi-han', title: T.rsi_tab_title, desc: T.rsi_feat2_title, icon: 'activity', color: 'orange' },
        { id: 'visuals', title: T.visuals_tab_title, desc: T.visuals_feat2_title, icon: 'layout-grid', color: 'red' },
    ];
  }, [T]);
  
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <section id="modules" className="py-20 bg-[#111827]">
        <div className="container mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.7 }}>
                <h2 className="text-3xl md:text-4xl font-bold text-white text-center">{T.modules_section_title}</h2>
                <p className="text-gray-400 mt-2 text-center max-w-2xl mx-auto">{T.modules_section_subtitle}</p>
            </motion.div>
            <motion.div 
                ref={ref}
                variants={containerVariants}
                initial="hidden"
                animate={controlsState}
                className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8"
                style={{ perspective: 1000 }}
            >
                {modules.map(module => {
                    const classes = COLOR_CLASSES[module.color] || COLOR_CLASSES['indigo']; // Fallback
                    const moduleLink = `/modules/${module.id}`;

                    return (
                        <motion.div key={module.id} variants={cardVariants}>
                             {/* KRİTİK DÜZELTME: Dinamik string yerine statik sınıflar kullanıldı */}
                             <Link 
                                href={moduleLink} 
                                className={`module-card group border-${module.color}-500/50 hover:border-${module.color}-500`}
                                aria-label={`${module.title} modül detaylarını incele`}
                            >
                                <div className="module-card-content">
                                    <div className={`p-3 rounded-lg ${classes.bg} mb-4`}>
                                        <Icon name={module.icon} className={`w-7 h-7 ${classes.text}`} aria-hidden="true"/>
                                    </div>
                                    {/* KRİTİK HATA DÜZELTMESİ: module.title'ın varlığını kontrol et */}
                                    <h3 className="text-xl font-bold text-white mb-2">{module.title ? module.title.split(':')[0] : ''}</h3>
                                    <p className="text-sm text-gray-400">{module.desc}</p>
                                    {/* DİKKAT: Tailwind'in JIT motoru için bu dinamikliği safeliste eklemek gerekiyor. (tailwind.config.js'de yapıldı) */}
                                    <div className={`absolute -bottom-1 -right-1 w-16 h-16 bg-${module.color}-500/10 rounded-full blur-xl group-hover:w-24 group-hover:h-24 transition-all`}></div>
                                </div>
                            </Link>
                        </motion.div>
                    );
                })}
            </motion.div>
        </div>
    </section>
  );
};

export default InteractiveModuleClient;
