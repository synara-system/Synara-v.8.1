// path: app/modules/nexus/page.js
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
        className={`p-5 rounded-2xl border border-gray-700/50 ${bgColor} shadow-lg space-y-2 h-full futuristic-card-light hover:border-indigo-500/50 transition-all duration-300`}
    >
        <div className='flex items-center gap-3'>
            <Icon name={icon} className={`w-6 h-6 ${color} flex-shrink-0`} aria-hidden="true" />
            <h3 className='text-lg font-bold text-white'>{name}</h3>
        </div>
        <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
        <p className='text-sm text-gray-400'>{detail}</p>
    </motion.div>
);

const FeaturePanel = ({ icon, title, description, philosophy, children, color = 'green', index = 0 }) => {
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

// Nexus Ana Sayfa Client Component
const NexusClient = () => {
    const { T } = useAuth();
    
    const metrics = useMemo(() => T ? [
        { name: 'Aktif Yapı', value: 'Bullish CHoCH', detail: 'Yükseliş yönünde piyasa yapısı değişimi tespit edildi.', icon: 'arrow-up-circle', color: 'text-green-400', bgColor: 'bg-green-900/20' },
        { name: 'OB Kalite Skoru', value: '9.2/10', detail: 'Likidite Süpürme ve Güçlü Kopuş filtreleri başarıyla geçti.', icon: 'shield-check', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20' },
        { name: 'Potansiyel R:R', value: '2.8 R', detail: 'Dinamik ATR hedeflerine göre makul Risk/Ödül oranı.', icon: 'award', color: 'text-indigo-400', bgColor: 'bg-indigo-900/20' },
    ] : [], [T]);

    if (!T) return null;

    return (
        <div className="bg-[#111827] text-white">
            <main>
                <section className="relative py-20 md:py-32 text-center overflow-hidden bg-gray-900 border-b border-green-700/50">
                    <div className="absolute inset-0 bg-grid-green-500/10 opacity-30"></div>
                     <div className="absolute inset-0" style={{
                        background: 'radial-gradient(ellipse at center, rgba(74, 222, 128, 0.1) 0%, rgba(17, 24, 39, 0) 70%)'
                    }}></div>
                    <div className="container mx-auto px-6 relative">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4">
                            Nexus: <span className="text-green-400">{T.nexus_page_title}</span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
                            {T.nexus_tab_desc}
                        </p>
                    </div>
                </section>

                <section className="py-20">
                    <div className="container mx-auto px-6">
                        <div className="max-w-4xl mx-auto space-y-12">
                            <h2 className="text-3xl font-bold text-center mb-12">{"Nexus'un Giriş Tetikleme Protokolü"}</h2>
                            
                            <div className="grid md:grid-cols-3 gap-8">
                                {metrics.map((m, i) => (
                                    <MetricBox key={i} {...m} />
                                ))}
                            </div>
                            
                            <FeaturePanel icon='blocks' title={T.nexus_feat1_title} description={T.nexus_feat1_desc} philosophy="**Disiplinli OB Seçimi:** Nexus, sadece **Likidite Süpürme (Sweep)** ve **Güçlü Kopuş (Displacement)** teyidi olan Order Block'ları Engine'e iletir. Fiyat Boşluğu (FVG) gibi ikincil filtreler de kaliteyi artırır." index={0} color="green">
                                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 w-full">
                                    <p className="text-sm font-bold text-center mb-3">Order Block Kalite Kontrolü</p>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex items-center"><Icon name="check-circle-2" className="w-5 h-5 text-green-400 mr-2" aria-hidden="true" /> Likidite Süpürme (Sweep): <span className="ml-auto font-mono text-green-300">GEÇTİ</span></li>
                                        <li className="flex items-center"><Icon name="check-circle-2" className="w-5 h-5 text-green-400 mr-2" aria-hidden="true" /> Güçlü Kopuş (Displacement): <span className="ml-auto font-mono text-green-300">GEÇTİ</span></li>
                                        <li className="flex items-center"><Icon name="check-circle-2" className="w-5 h-5 text-green-400 mr-2" aria-hidden="true" /> Fiyat Boşluğu (FVG): <span className="ml-auto font-mono text-green-300">GEÇTİ</span></li>
                                    </ul>
                                    <div className="mt-3 pt-2 border-t border-gray-600 text-center font-bold text-green-400">SONUÇ: YÜKSEK KALİTE</div>
                                </div>
                            </FeaturePanel>

                            <FeaturePanel icon='spline' title={T.nexus_feat2_title} description={T.nexus_feat2_desc} philosophy="**Çıkış Disiplini:** Giriş tetiklendikten sonra kar alma (TP) hedefleri, piyasanın anlık **Volatilitesi (ATR)** veya kırılan **Eksen Boyutu**na göre dinamik olarak belirlenir. Bu, Engine'in tutarlı ve matematiksel çıkışlar yapmasını sağlar." index={1} color="green">
                                <div className="w-full space-y-3">
                                    <div className="relative p-2 pl-10 bg-gray-700 rounded-lg text-sm"><span className="absolute left-2 top-2 text-xs font-bold text-gray-400">GİRİŞ</span> 21.500</div>
                                    <div className="relative p-2 pl-10 bg-green-900/50 rounded-lg text-sm"><span className="absolute left-2 top-2 text-xs font-bold text-green-400">TP1</span> 21.850 (ATR x1.5)</div>
                                    <div className="relative p-2 pl-10 bg-green-900/50 rounded-lg text-sm"><span className="absolute left-2 top-2 text-xs font-bold text-green-400">TP2</span> 22.150 (ATR x2.5)</div>
                                    <div className="relative p-2 pl-10 bg-red-900/50 rounded-lg text-sm"><span className="absolute left-2 top-2 text-xs font-bold text-red-400">SL</span> 21.300</div>
                                </div>
                            </FeaturePanel>
                            
                            <FeaturePanel icon='check-circle-2' title={T.nexus_feat3_title} description={T.nexus_feat3_desc} philosophy="**Non-Repaint Yapı:** Sadece fitil ucuyla gerçekleşen **sahte kırılımlar (flip-flop)** Engine'i tetiklemez. Nexus, kırılımın teyidi için dinamik bir **ATR Tamponu** uygulayarak gürültüyü engeller." index={2} color="green">
                                <div className="w-full flex justify-center items-start gap-4 text-center">
                                     <div className="p-3 bg-red-900/30 border border-red-500 rounded-lg">
                                        <p className="font-bold text-red-300">SAHTE KIRILIM</p>
                                        <svg viewBox="0 0 100 50" className="w-24 h-12" aria-hidden="true"><path d="M0 25 H 40" stroke="#7f8c8d" strokeWidth="2"/><path d="M40 25 H 60" stroke="#f1c40f" strokeWidth="2" strokeDasharray="4 2"/><path d="M50 25 V 10 L 50 25" stroke="#e74c3c" strokeWidth="3"/><path d="M60 25 H 100" stroke="#7f8c8d" strokeWidth="2"/></svg>
                                        <p className="text-xs text-gray-400">Sadece Fitil (Wick)</p>
                                     </div>
                                      <div className="p-3 bg-green-900/30 border border-green-500 rounded-lg">
                                        <p className="font-bold text-green-300">TEYİTLİ KIRILIM</p>
                                        <svg viewBox="0 0 100 50" className="w-24 h-12" aria-hidden="true"><path d="M0 25 H 40" stroke="#7f8c8d" strokeWidth="2"/><path d="M40 25 H 60" stroke="#f1c40f" strokeWidth="2" strokeDasharray="4 2"/><rect x="48" y="5" width="4" height="20" fill="#2ecc71" /><path d="M60 25 H 100" stroke="#7f8c8d" strokeWidth="2"/></svg>
                                        <p className="text-xs text-gray-400">Gövde Kapanışı</p>
                                     </div>
                                </div>
                            </FeaturePanel>
                        </div>
                    </div>
                </section>

                <section className="py-20 bg-gray-900/50">
                    <div className="container mx-auto px-6 text-center">
                         <h2 className="text-3xl font-bold text-white mb-4">{T.pricing_cta_title || "Nexus'un Gücünü Engine ile Birleştirin"}</h2>
                         <p className="text-gray-400 max-w-2xl mx-auto mb-8">{T.pricing_section_subtitle || "Nexus, Engine'in giriş ve çıkış tetikleyicisidir. Gürültüsüz, yüksek kaliteli Order Block ve Yapı Kırılım sinyalleriyle Engine'in disiplinini başlatır."}</p>
                         <Link href="/register" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-lg transition-transform duration-300 transform hover:scale-105" aria-label="Synara System'e Hemen Kayıt Ol">
                            {T.pricing_cta_button}
                         </Link>
                    </div>
                </section>
            </main>
        </div>
    );
};

const NexusPage = () => {
    return <NexusClient />;
}

export default NexusPage;
