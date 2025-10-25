// path: app/modules/visuals/page.js
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
        className={`p-5 rounded-2xl border border-gray-700/50 ${bgColor} shadow-lg space-y-2 h-full futuristic-card-light hover:border-red-500/50 transition-all duration-300`}
    >
        <div className='flex items-center gap-3'>
            <Icon name={icon} className={`w-6 h-6 ${color} flex-shrink-0`} aria-hidden="true" />
            <h3 className='text-lg font-bold text-white'>{name}</h3>
        </div>
        <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
        <p className='text-sm text-gray-400'>{detail}</p>
    </motion.div>
);

const FeaturePanel = ({ icon, title, description, philosophy, children, color = 'red', index = 0 }) => {
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

// KRİTİK DÜZELTME: Component adı `VisualsPage` olarak değiştirildi ve default olarak export edildi.
const VisualsPage = () => {
    const { T } = useAuth();
    
    const metrics = useMemo(() => [
        { name: 'Konsensüs Skoru', value: '0.82', detail: 'Tüm modüllerin uyumu yüksek. Güvenli giriş sinyali bekleniyor.', icon: 'zap', color: 'text-red-400', bgColor: 'bg-red-900/20' },
        { name: 'Trend Uyumsuzluğu', value: 'DÜŞÜK', detail: '5 TF’de uyumsuzluk yok. Yanlış sinyal riski azaldı.', icon: 'shield-check', color: 'text-green-400', bgColor: 'bg-green-900/20' },
        { name: 'Ana Trend', value: 'YÜKSELİŞ', detail: 'Pivot, EMA ve Kanal trendleri yükselişi işaret ediyor.', icon: 'arrow-up-circle', color: 'text-indigo-400', bgColor: 'bg-indigo-900/20' },
    ], []);

    if (!T) return null;

    return (
        <div className="bg-[#111827] text-white">
            <main>
                <section className="relative py-20 md:py-32 text-center overflow-hidden bg-gray-900 border-b border-red-700/50">
                    <div className="absolute inset-0 bg-grid-red-500/10 opacity-30"></div>
                     <div className="absolute inset-0" style={{
                        background: 'radial-gradient(ellipse at center, rgba(248, 113, 113, 0.1) 0%, rgba(17, 24, 39, 0) 70%)'
                    }}></div>
                    <div className="container mx-auto px-6 relative">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4">
                            Visuals: <span className="gradient-text-orange">{T.visuals_page_title}</span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
                            {T.visuals_tab_desc}
                        </p>
                    </div>
                </section>

                <section className="py-20">
                    <div className="container mx-auto px-6">
                        <div className="max-w-4xl mx-auto space-y-12">
                            <h2 className="text-3xl font-bold text-center mb-12">Visuals Konsensüs Protokolü</h2>
                            
                            <div className="grid md:grid-cols-3 gap-8">
                                {metrics.map((m, i) => (
                                    <MetricBox key={i} {...m} />
                                ))}
                            </div>
                            
                            <FeaturePanel icon='layout-grid' title={T.visuals_feat1_title} description={T.visuals_feat1_desc} philosophy="**Trend Disiplini:** Trend Atlası, 4 farklı EMA, kanal ve ana yapı trendini tek bir ekranda yorumlar. Engine'in **Makro Rejim (Metis)** bilgisini teyit etmesini sağlayan görsel bir trend haritasıdır." index={0} color="red">
                                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 w-full space-y-2">
                                    <p className="text-center font-bold text-lg text-green-400">ANA TREND: YÜKSELİŞ</p>
                                    <div className="flex justify-between items-center text-sm"><span className="text-gray-400">EMA Kesişimi:</span> <span className="font-bold text-green-300">Bullish</span></div>
                                    <div className="flex justify-between items-center text-sm"><span className="text-gray-400">Kanal Yönü:</span> <span className="font-bold text-green-300">Yukarı</span></div>
                                    <div className="flex justify-between items-center text-sm"><span className="text-gray-400">Piyasa Yapısı:</span> <span className="font-bold text-green-300">HH/HL</span></div>
                                </div>
                            </FeaturePanel>

                            <FeaturePanel icon='blocks' title={T.visuals_feat2_title} description={T.visuals_feat2_desc} philosophy="**Uyum Kontrolü:** Farklı zaman dilimlerinin (5m, 1H, 4H, 1D) kritik metriklerini (Yapı, Ichimoku, RSI) tek bir matriste toplar. Engine'in bir pozisyona girmeden önce **tüm zaman dilimlerinin aynı hikayeyi anlattığından emin olmasını** sağlar." index={1} color="red">
                                <div className="p-2 bg-gray-900/50 rounded-lg border border-gray-700 w-full text-xs font-mono">
                                    <div className="grid grid-cols-4 gap-1 text-center font-bold">
                                        <div className="p-1">TF</div><div className="p-1">Yapı</div><div className="p-1">RSI</div><div className="p-1">Trend</div>
                                        <div className="p-1 text-gray-400">5m</div><div className="p-1 bg-green-900/50 text-green-300 rounded">BULL</div><div className="p-1 bg-red-900/50 text-red-300 rounded">BEAR</div><div className="p-1 bg-green-900/50 text-green-300 rounded">BULL</div>
                                        <div className="p-1 text-gray-400">1H</div><div className="p-1 bg-green-900/50 text-green-300 rounded">BULL</div><div className="p-1 bg-green-900/50 text-green-300 rounded">BULL</div><div className="p-1 bg-green-900/50 text-green-300 rounded">BULL</div>
                                        <div className="p-1 text-gray-400">4H</div><div className="p-1 bg-green-900/50 text-green-300 rounded">BULL</div><div className="p-1 bg-green-900/50 text-green-300 rounded">BULL</div><div className="p-1 bg-green-900/50 text-green-300 rounded">BULL</div>
                                    </div>
                                </div>
                            </FeaturePanel>
                            
                            <FeaturePanel icon='share-2' title={T.visuals_feat3_title} description={T.visuals_feat3_desc} philosophy="**Konsensüs Skoru:** Diğer modüllerden gelen verilerin ne kadar uyumlu olduğunu ölçer. Engine'in karar kalitesini mühürleyen nihai bir skor (0-1 arası) gönderir." index={2} color="red">
                               <div className="w-full text-center">
                                    <p className="font-bold text-red-400 mb-2">SV-BRIDGE KONSENSÜS SKORU</p>
                                    <div className="relative w-40 h-40 mx-auto">
                                        <svg className="w-full h-full" viewBox="0 0 36 36" aria-hidden="true"><path className="text-gray-700" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /><path className="text-red-500" strokeWidth="3" fill="none" strokeDasharray="82, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /></svg>
                                        <div className="absolute inset-0 flex items-center justify-center text-4xl font-extrabold text-white">82%</div>
                                    </div>
                                    <p className="text-sm font-semibold mt-2 text-white">Yüksek Uyum</p>
                               </div>
                            </FeaturePanel>
                        </div>
                    </div>
                </section>
                
                <section className="py-20 bg-gray-900/50">
                    <div className="container mx-auto px-6 text-center">
                         <h2 className="text-3xl font-bold text-white mb-4">{T.pricing_cta_title || "Visuals'ın Gücünü Engine ile Birleştirin"}</h2>
                         <p className="text-gray-400 max-w-2xl mx-auto mb-8">{T.pricing_section_subtitle || "Visuals, Engine'e tüm modüllerin uyumunu kanıtlayan nihai Konsensüs Skorunu sağlar. Bu, Engine'in kararlarını asla zayıf bir trendde vermemesini garanti eder."}</p>
                         <Link href="/register" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-lg transition-transform duration-300 transform hover:scale-105" aria-label="Synara System'e Hemen Kayıt Ol">
                            {T.pricing_cta_button}
                         </Link>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default VisualsPage;
