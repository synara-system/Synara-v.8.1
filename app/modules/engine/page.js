// path: app/modules/engine/page.js
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

const FeaturePanel = ({ icon, title, description, philosophy, children, color = 'indigo', index = 0 }) => {
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

// Engine Ana Sayfa Client Component
const EngineClient = () => {
    const { T } = useAuth();
    
    const metrics = useMemo(() => [
        { name: 'NEXUS-FIRST Tetikleme', value: 'OB Fill', detail: "Engine, sadece Nexus modülünden gelen yüksek kaliteli bir olayla tetiklenir.", icon: 'blocks', color: 'text-green-400', bgColor: 'bg-green-900/20' },
        { name: 'Risk Gate Durumu', value: 'NORMAL', detail: "Piyasa volatilitesi ve trend sıkışması kritik seviyede değil. Giriş izni var.", icon: 'shield-check', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20' },
        { name: 'Anchor TF Kararı', value: 'MÜHÜRLENDİ', detail: "Nihai karar, 4H bar kapanışında kilitlendi. Repaint riski sıfırlandı.", icon: 'alarm-clock', color: 'text-indigo-400', bgColor: 'bg-indigo-900/20' },
    ], []);

    if (!T) return null;

    return (
        <div className="bg-[#111827] text-white">
            <main>
                <section className="relative py-20 md:py-32 text-center overflow-hidden bg-gray-900 border-b border-indigo-700/50">
                    <div className="absolute inset-0 bg-grid-indigo-500/10 opacity-30"></div>
                     <div className="absolute inset-0" style={{
                        background: 'radial-gradient(ellipse at center, rgba(79, 70, 229, 0.15) 0%, rgba(17, 24, 39, 0) 70%)'
                    }}></div>
                    <div className="container mx-auto px-6 relative">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4">
                            Engine: <span className="gradient-text">{T.engine_page_title}</span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
                            {T.engine_tab_desc}
                        </p>
                    </div>
                </section>

                <section className="py-20">
                    <div className="container mx-auto px-6">
                        <div className="max-w-4xl mx-auto space-y-12">
                            <h2 className="text-3xl font-bold text-center mb-12">{"Engine'in 3 Aşamalı Disiplin Protokolü"}</h2>
                            
                            <div className="grid md:grid-cols-3 gap-8">
                                {metrics.map((m, i) => (
                                    <MetricBox key={i} {...m} />
                                ))}
                            </div>
                            
                            <FeaturePanel icon='boxes' title={T.engine_feat1_title} description={T.engine_feat1_desc} philosophy="**Çekirdek Felsefe:** Engine, Nexus'tan gelen tetiklemeyi (OB Fill/Re-Break) takiben Metis, RSI-HAN ve Visuals modüllerinden gelen verileri anlık piyasa koşullarına göre **ağırlıklandırarak** nihai Karar Skorunu hesaplar." index={0} color="indigo">
                                <div className="w-full text-center">
                                    <div className="flex justify-around items-center mb-4">
                                        <div className="text-center"><Icon name="blocks" className="w-8 h-8 mx-auto text-green-400" aria-hidden="true" /><span className="text-xs">Nexus</span></div>
                                        <div className="text-center"><Icon name="thermometer" className="w-8 h-8 mx-auto text-yellow-400" aria-hidden="true" /><span className="text-xs">Metis</span></div>
                                    </div>
                                    <div className="flex justify-center items-center my-4">
                                        <Icon name="arrow-right" className="w-6 h-6 text-gray-500" aria-hidden="true" />
                                        <div className="mx-4 p-4 bg-indigo-900/50 border-2 border-indigo-500 rounded-full"><Icon name="cpu" className="w-12 h-12 text-indigo-300" aria-hidden="true" /></div>
                                        <Icon name="arrow-left" className="w-6 h-6 text-gray-500" aria-hidden="true" />
                                    </div>
                                    <div className="flex justify-around items-center mt-4">
                                        <div className="text-center"><Icon name="activity" className="w-8 h-8 mx-auto text-orange-400" aria-hidden="true" /><span className="text-xs">RSI-HAN</span></div>
                                        <div className="text-center"><Icon name="layout-grid" className="w-8 h-8 mx-auto text-red-400" aria-hidden="true" /><span className="text-xs">Visuals</span></div>
                                    </div>
                                    <div className="mt-6 text-lg font-bold">HIM Puanı: <span className="text-indigo-400">92/100</span></div>
                                </div>
                            </FeaturePanel>

                            <FeaturePanel icon='alert-triangle' title={T.engine_feat2_title} description={T.engine_feat2_desc} philosophy="**Giriş Koruması:** Akıllı Risk Kapıları, ADX trend gücü zayıf olduğunda veya piyasa aşırı sıkışma (Squeeze) yaşadığında **giriş iznini otomatik olarak iptal eder**. Bu sayede sadece riskin kabul edilebilir olduğu anlarda işlem yapılır." color="red" index={1}>
                                <div className="w-full flex justify-center items-center gap-4">
                                     <div className="text-center p-4 bg-red-900/30 border-2 border-red-500 rounded-xl">
                                        <Icon name="shield-off" className="w-12 h-12 text-red-400 mx-auto" aria-hidden="true" />
                                        <p className="font-bold mt-2 text-red-300">GİRİŞ KİLİTLİ</p>
                                        <p className="text-xs text-gray-400">Yüksek Volatilite</p>
                                     </div>
                                      <div className="text-center p-4 bg-green-900/30 border-2 border-green-500 rounded-xl">
                                        <Icon name="shield-check" className="w-12 h-12 text-green-400 mx-auto" aria-hidden="true" />
                                        <p className="font-bold mt-2 text-green-300">GİRİŞ AÇIK</p>
                                        <p className="text-xs text-gray-400">Optimal Koşullar</p>
                                     </div>
                                </div>
                            </FeaturePanel>
                            
                            <FeaturePanel icon='shield-check' title={T.engine_feat3_title} description={T.engine_feat3_desc} philosophy="**Repaint İptali:** Sadece fitil ucuyla gerçekleşen kırılımların sinyal üretmesini önler. Tüm kararlar, gürültüyü filtrelemek için **daha yüksek bir Anchor TF** barının kapanışında mühürlenir. Bu zorunluluk, sinyalin geriye dönük değişmesini teknik olarak engeller." color="green" index={2}>
                                <div className="w-full text-center">
                                    <p className="text-sm font-bold mb-2">Karar Protokolü</p>
                                    <div className="flex items-center justify-center gap-2 font-mono text-xs">
                                        <span className="p-2 bg-gray-700 rounded">15m Sinyal</span>
                                        <Icon name="arrow-right" className="w-5 h-5 text-gray-500" aria-hidden="true" />
                                        <span className="p-2 bg-gray-700 rounded">4H Teyit Bekleniyor...</span>
                                        <Icon name="arrow-right" className="w-5 h-5 text-gray-500" aria-hidden="true" />
                                        <span className="p-2 bg-green-900/50 text-green-300 border border-green-500 rounded font-bold">KARAR MÜHÜRLENDİ</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-3">Bar kapandıktan sonra sinyal asla değişmez.</p>
                                </div>
                            </FeaturePanel>
                        </div>
                    </div>
                </section>
                
                <section className="py-20 bg-gray-900/50">
                    <div className="container mx-auto px-6 text-center">
                         <h2 className="text-3xl font-bold text-white mb-4">{T.pricing_cta_title || "Engine'i Anında Kullanmaya Başlayın"}</h2>
                         <p className="text-gray-400 max-w-2xl mx-auto mb-8">{T.pricing_section_subtitle || "Synara Engine, Nexus, Metis, RSI-HAN ve Visuals modüllerinden gelen verilere dayalı, repaint korumalı nihai karar motorudur."}</p>
                         <Link href="/register" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-lg transition-transform duration-300 transform hover:scale-105" aria-label="Synara System'e Hemen Kayıt Ol">
                            {T.pricing_cta_button}
                         </Link>
                    </div>
                </section>
            </main>
        </div>
    );
};

const EnginePage = () => {
    return <EngineClient />;
};

export default EnginePage;

