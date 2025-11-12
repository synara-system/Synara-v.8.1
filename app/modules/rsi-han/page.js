// path: app/modules/rsi-han/RsiHanClient.js
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
        // KRİTİK GÜNCELLEME: futuristic-card-light stili ve hover efektleri eklendi
        className={`p-5 rounded-2xl border border-gray-700/50 ${bgColor} shadow-lg space-y-2 h-full futuristic-card-light hover:border-orange-500/50 transition-all duration-300`}
    >
        <div className='flex items-center gap-3'>
            <Icon name={icon} className={`w-6 h-6 ${color} flex-shrink-0`} aria-hidden="true" />
            <h3 className='text-lg font-bold text-white'>{name}</h3>
        </div>
        <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
        <p className='text-sm text-gray-400'>{detail}</p>
    </motion.div>
);

const FeaturePanel = ({ icon, title, description, philosophy, children, color = 'orange', index = 0 }) => {
    const [ref, isVisible] = useScrollAnimation(0.3);
    const variants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay: index * 0.2 } }
    };
    const isOdd = index % 2 !== 0;

    // KRİTİK GÜNCELLEME: Dinamik arkaplan stili ve gölge sınıfları
    const glowClass = `shadow-2xl shadow-${color}-900/40`;
    const hoverBorderClass = `hover:border-${color}-500/50`;
    const bgGradient = `bg-gradient-to-br from-gray-800/60 to-${color}-900/10`;

    return (
        <motion.div
            ref={ref}
            variants={variants}
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            // KRİTİK GÜNCELLEME: futuristic-card stili, dinamik arkaplan, gölge ve border eklendi
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

// RSI-HAN Ana Sayfa Client Component
const RsiHanClient = () => {
    const { T } = useAuth();
    
    const metrics = useMemo(() => [
        { name: 'Momentum Durumu', value: 'ZAYIF', detail: 'Momentum hızı düşüşe geçti. Geri çekilme bekleniyor.', icon: 'activity', color: 'text-orange-400', bgColor: 'bg-orange-900/20' },
        { name: 'Uyumsuzluk', value: 'Neg. Diverjans', detail: 'Fiyat yeni zirve yaparken RSI geride kaldı. Kritik dönüş sinyali.', icon: 'arrow-down-circle', color: 'text-red-400', bgColor: 'bg-red-900/20' },
        { name: 'Kanal Sıkışması', value: '101.4%', detail: 'RSI kanalı sıkışma yaşıyor. Volatilite artışı beklenir.', icon: 'thermometer', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20' },
    ], []);

    if (!T) return null;

    return (
        <div className="bg-[#111827] text-white">
            <main>
                <section className="relative py-20 md:py-32 text-center overflow-hidden bg-gray-900 border-b border-orange-700/50">
                    <div className="absolute inset-0 bg-grid-orange-500/10 opacity-30"></div>
                     <div className="absolute inset-0" style={{
                        background: 'radial-gradient(ellipse at center, rgba(251, 146, 60, 0.1) 0%, rgba(17, 24, 39, 0) 70%)'
                    }}></div>
                    <div className="container mx-auto px-6 relative">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4">
                            RSI-HAN: <span className="text-orange-400">{T.rsi_page_title}</span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
                            {T.rsi_tab_desc}
                        </p>
                    </div>
                </section>

                <section className="py-20">
                    <div className="container mx-auto px-6">
                        <div className="max-w-4xl mx-auto space-y-12">
                            <h2 className="text-3xl font-bold text-center mb-12">RSI-HAN Momentum Protokolü</h2>
                            
                            <div className="grid md:grid-cols-3 gap-8">
                                {metrics.map((m, i) => (
                                    <MetricBox key={i} {...m} />
                                ))}
                            </div>
                            
                            <FeaturePanel icon='map' title={T.rsi_feat1_title} description={T.rsi_feat1_desc} philosophy="**Volatilite Çapası:** Cobra Kanalı, RSI'ın aşırı alım/satım seviyelerini piyasa volatilitesine göre **dinamik** olarak ayarlar. Bu, Engine'in sadece gerçekten aşırı koşullarda sinyal almasını sağlar." index={0} color="orange">
                                <div className="w-full h-32 bg-gray-900/50 rounded-lg border border-gray-700 relative overflow-hidden">
                                     <svg width="100%" height="100%" viewBox="0 0 300 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 30 C 50 10, 100 50, 150 30 S 250 10, 300 30" stroke="#fb923c" fill="none" strokeWidth="2" /><path d="M0 90 C 50 110, 100 70, 150 90 S 250 110, 300 90" stroke="#fb923c" fill="none" strokeWidth="2" /><path d="M0 60 C 50 40, 100 80, 150 60 S 250 40, 300 60" stroke="white" fill="none" strokeWidth="1.5" /></svg>
                                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"><p className="text-sm font-bold text-orange-400">COBRA KANALI</p><p className="text-xs text-gray-400">Dinamik Volatilite</p></div>
                                </div>
                            </FeaturePanel>

                            <FeaturePanel icon='zap' title={T.rsi_feat2_title} description={T.rsi_feat2_desc} philosophy="**Erken Uyarı:** Hem normal hem de **Gizli Uyumsuzlukları** tespit ederek Engine'e potansiyel trend dönüşleri hakkında erken sinyal gönderir. Sinyal, hacimle teyit edildiğinde Engine aksiyon alır." index={1} color="orange">
                                <div className="w-full h-40 bg-gray-900/50 rounded-lg border border-gray-700 p-2">
                                     <p className="text-xs font-bold text-center text-red-400 mb-1">Negatif Uyumsuzluk Tespiti</p>
                                     <svg width="100%" height="50%" viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true"><path d="M20 40 L 100 20 L 180 30 L 280 10" stroke="white" fill="none" strokeWidth="1.5" /><path d="M100 20 L 280 10" stroke="red" strokeDasharray="4 2" strokeWidth="1" /></svg>
                                     <div className="border-t border-gray-700 mt-1 pt-1">
                                        <svg width="100%" height="50%" viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true"><path d="M20 20 L 100 10 L 180 15 L 280 40" stroke="#fb923c" fill="none" strokeWidth="1.5" /><path d="M100 10 L 280 40" stroke="red" strokeDasharray="4 2" strokeWidth="1" /></svg>
                                     </div>
                                </div>
                            </FeaturePanel>
                            
                            <FeaturePanel icon='bar-chart-2' title={T.rsi_feat3_title} description={T.rsi_feat3_desc} philosophy="**Hacim Teyidi:** Momentum sinyallerinin arkasındaki alıcı/satıcı gücünü hacim verileriyle ölçer. Güçlü Momentum sinyallerini zayıf veya manipülatif hacimde Engine'in dikkate almasını engeller." index={2} color="orange">
                                <div className="w-full flex justify-around items-end h-24">
                                    <div className="w-8 bg-red-800" style={{height: '40%'}}></div>
                                    <div className="w-8 bg-red-800" style={{height: '30%'}}></div>
                                    <div className="w-8 bg-green-800" style={{height: '50%'}}></div>
                                    <div className="w-8 bg-green-600 border-2 border-green-400" style={{height: '80%'}}><p className="text-xs -mt-4 text-center font-bold">Teyit</p></div>
                                    <div className="w-8 bg-green-800" style={{height: '60%'}}></div>
                                </div>
                            </FeaturePanel>
                        </div>
                    </div>
                </section>
                
                <section className="py-20 bg-gray-900/50">
                    <div className="container mx-auto px-6 text-center">
                         <h2 className="text-3xl font-bold text-white mb-4">{T.pricing_cta_title || "RSI-HAN'ın Gücünü Engine ile Birleştirin"}</h2>
                         <p className="text-gray-400 max-w-2xl mx-auto mb-8">{T.pricing_section_subtitle || "RSI-HAN, Engine'e anlık Momentum Gücü ve Volatilite Sıkışması bilgisini sağlar. Bu, Engine'in geri çekilme ve dönüş kurulumlarını güvenle yakalamasını mümkün kılar."}</p>
                         <Link href="/register" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-lg transition-transform duration-300 transform hover:scale-105" aria-label="Synara System'e Hemen Kayıt Ol">
                            {T.pricing_cta_button}
                         </Link>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default RsiHanClient;
