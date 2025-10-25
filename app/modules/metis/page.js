// path: app/modules/metis/page.js
'use client';

import React, { useMemo } from 'react';
import Icon from '@/components/Icon';
import Link from 'next/link'; 
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import useScrollAnimation from '@/hooks/useScrollAnimation';

// --- YARDIMCI BİLEŞENLER ---

const MetricBox = ({ name, value, detail, icon, color, bgColor }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className={`p-5 rounded-2xl border border-gray-700/50 ${bgColor} shadow-lg space-y-2 h-full futuristic-card-light hover:border-yellow-500/50 transition-all duration-300`}
    >
        <div className='flex items-center gap-3'>
            <Icon name={icon} className={`w-6 h-6 ${color} flex-shrink-0`} aria-hidden="true" />
            <h3 className='text-lg font-bold text-white'>{name}</h3>
        </div>
        <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
        <p className='text-sm text-gray-400'>{detail}</p>
    </motion.div>
);

const FeaturePanel = ({ icon, title, description, philosophy, children, color = 'yellow', index = 0 }) => {
    const [ref, isVisible] = useScrollAnimation(0.3);
    const variants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay: index * 0.2 } }
    };
    const isOdd = index % 2 !== 0;

    const glowClass = `shadow-2xl shadow-${color}-900/40`;
    const hoverBorderClass = `hover:border-${color}-500/50`;
    const bgGradient = `bg-gradient-to-br from-gray-800/60 to-${color}-900/10`;

    return (
        <motion.div
            ref={ref}
            variants={variants}
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            className={`grid md:grid-cols-2 gap-8 items-center futuristic-card p-8 rounded-2xl border border-gray-700/50 ${bgGradient} ${glowClass} ${hoverBorderClass} transition-all duration-300`}
        >
            <div className={isOdd ? 'md:order-last' : ''}>
                <h3 className={`text-2xl font-bold text-${color}-400 mb-4 flex items-center`}>
                    <Icon name={icon} className='w-6 h-6 mr-3' aria-hidden="true" />
                    {title}
                </h3>
                <p className="text-gray-400 leading-relaxed text-base">{description}</p>
                <p className="text-sm font-semibold text-white border-t border-gray-700 pt-3 mt-4" dangerouslySetInnerHTML={{ __html: philosophy }} />
            </div>
            <div className={`relative flex items-center justify-center p-4 min-h-[200px] ${isOdd ? 'md:order-first' : ''}`}>
                {children}
            </div>
        </motion.div>
    );
};


// Metis Ana Sayfa Client Component
const MetisClient = () => {
    const { T } = useAuth();
    
    const metrics = useMemo(() => T ? [
        { name: 'ULE Seviyesi', value: 'KRİTİK', detail: 'Günlük Zirve (PDH) test ediliyor. Likidite avı bekleniyor.', icon: 'thermometer', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20' },
        { name: 'Seans Aktivitesi', value: 'LONDRA SWEEP', detail: 'Asya seansının zirvesi (High) avlandı. Tersine dönüş potansiyeli.', icon: 'spline', color: 'text-red-400', bgColor: 'bg-red-900/20' },
        { name: 'Piyasa Rejimi', value: 'ARALIK (RANGE)', detail: 'Trend gücü zayıf. Aralık içi işlem stratejisi aktif.', icon: 'shield-check', color: 'text-indigo-400', bgColor: 'bg-indigo-900/20' },
    ] : [], [T]);

    if (!T) return null;

    return (
        <div className="bg-[#111827] text-white">
            <main>
                <section className="relative py-20 md:py-32 text-center overflow-hidden bg-gray-900 border-b border-yellow-700/50">
                    <div className="absolute inset-0 bg-grid-yellow-500/10 opacity-30"></div>
                     <div className="absolute inset-0" style={{
                        background: 'radial-gradient(ellipse at center, rgba(252, 211, 77, 0.1) 0%, rgba(17, 24, 39, 0) 70%)'
                    }}></div>
                    <div className="container mx-auto px-6 relative">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4">
                            Metis: <span className="text-yellow-400">{T.metis_page_title}</span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
                            {T.metis_tab_desc}
                        </p>
                    </div>
                </section>

                <section className="py-20">
                    <div className="container mx-auto px-6">
                        <div className="max-w-4xl mx-auto space-y-12">
                            <h2 className="text-3xl font-bold text-center mb-12">{"Metis'in Makro Protokolü"}</h2>
                            
                            <div className="grid md:grid-cols-3 gap-8">
                                {metrics.map((m, i) => (
                                    <MetricBox key={i} {...m} />
                                ))}
                            </div>
                            
                            <FeaturePanel icon='thermometer' title={T.metis_feat1_title} description={T.metis_feat1_desc} philosophy="**Felsefe:** Piyasa, likiditeye (durağan seviyeler) karşı bir mıknatıs gibi davranır. ULE 2.0, bu seviyeleri **tek bir bar kapanışında** kesinleştirir, böylece repaint sorunu yaşanmaz ve Engine'e güvenilir hedefler sunulur." index={0} color="yellow">
                                <div className="w-full h-40 bg-gray-900/50 rounded-lg border border-gray-700 relative p-4 font-mono text-xs">
                                    <div className="absolute top-4 left-0 right-0 border-t-2 border-dashed border-red-500/50"><span className="absolute -top-2 left-2 text-red-400 bg-gray-900/50 pr-2">PDH (21.540)</span></div>
                                    <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-gray-600"><span className="absolute -top-2 left-2 text-gray-400 bg-gray-900/50 pr-2">EQ</span></div>
                                    <div className="absolute bottom-4 left-0 right-0 border-t-2 border-dashed border-green-500/50"><span className="absolute -top-2 left-2 text-green-400 bg-gray-900/50 pr-2">PDL (20.980)</span></div>
                                    <div className="absolute right-4 top-8 flex items-center">
                                        <span className="text-yellow-400 font-bold">Fiyat →</span>
                                        <div className="w-4 h-4 rounded-full bg-yellow-400 ml-2 animate-pulse"></div>
                                    </div>
                                </div>
                            </FeaturePanel>

                            <FeaturePanel icon='spline' title={T.metis_feat2_title} description={T.metis_feat2_desc} philosophy="**Seans Dinamiği:** Piyasalar, seanslar arası **düşük/yüksek (Low/High)** seviyeleri hedefleyerek stop emirlerini toplar. Metis, bu likidite avı (Sweep) hareketlerini anlık olarak Engine'e raporlar ve Engine'in ters işlem yapmasını sağlayacak kritik bağlamı sunar." index={1} color="yellow">
                                <div className="w-full space-y-2">
                                    <div className="p-2 bg-gray-700/50 rounded-lg flex justify-between items-center">
                                        <span className="font-bold text-blue-400">Asya Seansı</span>
                                        <div className="flex items-center"><span className="text-xs mr-2">High: 21.450</span> <div className="w-16 h-2 bg-blue-800 rounded-full"></div></div>
                                    </div>
                                    <div className="p-2 bg-gray-700/50 rounded-lg flex justify-between items-center">
                                        <span className="font-bold text-green-400">Londra Seansı</span>
                                        <div className="flex items-center"><span className="text-xs mr-2">High: 21.580</span> <div className="w-24 h-2 bg-green-800 rounded-full"></div></div>
                                    </div>
                                    <div className="relative p-2 bg-red-900/30 rounded-lg border border-red-500 animate-pulse">
                                        <span className="font-bold text-red-300">LONDRA SWEEP</span>
                                        <p className="text-xs text-gray-400">Asya Zirvesi Avlandı!</p>
                                    </div>
                                </div>
                            </FeaturePanel>
                            
                            <FeaturePanel icon='shield-check' title={T.metis_feat3_title} description={T.metis_feat3_desc} philosophy="**Risk Kalkanı:** Ani haberler, borsa kapanışları veya yoğun piyasa yapıcı aktivitesi (Whipsaw) tespit edildiğinde Engine'e anlık **TEHLİKE** uyarısı gönderilir. Bu, düşük olasılıklı ve yüksek riskli anlarda pozisyon açılmasını engeller." index={2} color="yellow">
                                <div className="w-48 h-48 rounded-full bg-gray-900 border-4 border-yellow-700 flex flex-col items-center justify-center text-center shadow-2xl shadow-yellow-900/50">
                                    <Icon name="shield-check" className="w-16 h-16 text-yellow-400" aria-hidden="true" />
                                    <p className="font-bold text-lg text-white mt-2">RİSK KALKANI</p>
                                    <p className="text-xs text-yellow-300">AKTİF</p>
                                </div>
                            </FeaturePanel>
                        </div>
                    </div>
                </section>
                
                <section className="py-20 bg-gray-900/50">
                    <div className="container mx-auto px-6 text-center">
                         <h2 className="text-3xl font-bold text-white mb-4">{"Metis'in Gücünü Engine ile Birleştirin"}</h2>
                         <p className="text-gray-400 max-w-2xl mx-auto mb-8">{"Metis, Engine'e makro rejim ve likidite avı bilgilerini sağlayarak, pozisyonlarınızı piyasa yapıcıların zihniyetiyle uyumlu hale getirir."}</p>
                         <Link href="/register" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-lg transition-transform duration-300 transform hover:scale-105" aria-label="Synara System'e Hemen Kayıt Ol">
                            {T.pricing_cta_button}
                         </Link>
                    </div>
                </section>
            </main>
        </div>
    );
};

const MetisPage = () => {
    return <MetisClient />;
}

export default MetisPage;
