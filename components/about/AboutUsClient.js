// path: components/about/AboutUsClient.js
'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import useScrollAnimation from '@/hooks/useScrollAnimation';
import Image from 'next/image'; 
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

const MESTEG_VİZYON_IMAGE = "[https://placehold.co/1200x600/1F2937/FFCC00?text=MESTEG+TEKNOLOJI+YAPISAL+DISIPLIN](https://placehold.co/1200x600/1F2937/FFCC00?text=MESTEG+TEKNOLOJI+YAPISAL+DISIPLIN)"; 

const FeatureCard = ({ icon, title, description, isVisible, delay }) => (
    <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.7, delay }}
        className={`bg-gray-800/50 p-6 rounded-2xl border border-gray-700 transition-all duration-700 transform hover:shadow-2xl hover:border-yellow-600/50`}
    >
        <div className="bg-yellow-600/20 text-yellow-400 rounded-lg w-12 h-12 flex items-center justify-center mb-4 border border-yellow-500/50">
            <Icon name={icon} className="w-6 h-6"/>
        </div>
        <h3 className="text-xl font-bold text-yellow-400 mb-2">{title}</h3> 
        <p className="text-gray-400 leading-relaxed text-sm">{description}</p>
    </motion.div>
);

const MestegVisionInfo = () => {
    // BUILD HATASINI ÇÖZMEK İÇİN SORUNLU METİN TAMAMEN KALDIRILDI.

    return (
        <div className="text-center p-8 bg-gray-900/50 rounded-2xl border-4 border-dashed border-yellow-700/50 shadow-2xl shadow-yellow-900/40">
            <h2 className="text-3xl font-bold text-yellow-400 mb-4">Vizyon Protokolü: 1996&apos;dan Bugüne</h2>
            <div className='max-w-2xl mx-auto'>
                <p className='text-lg text-gray-300 mb-4'>
                    **Mesteg Teknoloji**, felsefesini kritik altyapı projeleri (2014) tecrübesi üzerine kurmuştur. Teorik değil, **sahada çalışan, hataya yer olmayan** sistemler inşa ederiz. 
                </p>
                {/* Hata veren metin kaldırıldı. */}
            </div>
            <div className='flex justify-center gap-6 mt-6'>
                <span className='text-sm text-gray-400 flex items-center'>
                    <Icon name="thermometer" className="w-4 h-4 mr-2 text-red-400"/>
                    DUYGU GÜRÜLTÜSÜ
                </span>
                <Icon name="arrow-right" className="w-5 h-5 text-yellow-400"/>
                <span className='text-sm text-gray-400 flex items-center'>
                    <Icon name="boxes" className="w-4 h-4 mr-2 text-indigo-400"/>
                    DİSİPLİN MATRİSİ
                </span>
            </div>
        </div>
    );
};

const AboutUsClient = ({ T }) => {
    const [ref, isVisible] = useScrollAnimation(0.1); 

    if (!T || !T.about_us_page_title) {
        return <div className="min-h-screen bg-[#111827] flex justify-center items-center"><p>Yükleniyor...</p></div>;
    }
    
    return (
        <>
            <section className="py-16 bg-gray-900/50">
                <div className="container mx-auto px-6 max-w-4xl text-center">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                        className="mx-auto mb-6"
                    >
                        <Icon name="mesteg" className="w-32 h-32 mx-auto" />
                    </motion.div>
                    
                    <h2 className="text-3xl font-bold text-white mb-2">{T.about_us_founder_title}</h2>
                    <blockquote className="text-xl italic font-medium text-gray-300 border-l-4 border-yellow-600 pl-4 pt-2 mx-auto max-w-2xl">
                         {`"${T.about_us_founder_message}"`}
                    </blockquote>
                    <p className="text-sm font-semibold text-white/50 mt-4">- Baş Sistem Mimarı, Mesteg Teknoloji LTD. ŞTİ.</p>
                </div>
            </section>
        
            <section ref={ref} id="kurumsal-degerler" className="py-20">
                <div className="container mx-auto px-6">
                    <div className="max-w-6xl mx-auto space-y-12">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                        >
                            <MestegVisionInfo />
                        </motion.div>

                        <h2 className="text-3xl font-bold text-center text-white pt-4">Kurumsal Değerler ve Felsefe</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" >
                            <FeatureCard 
                                icon="blocks" 
                                title={T.about_us_section1_title} 
                                description={T.about_us_section1_desc}
                                isVisible={isVisible}
                                delay={0.0}
                            />
                            <FeatureCard 
                                icon="activity" 
                                title={T.about_us_section2_title} 
                                description={T.about_us_section2_desc}
                                isVisible={isVisible}
                                delay={0.2}
                            />
                            <FeatureCard 
                                icon="shield-check" 
                                title={T.about_us_section3_title} 
                                description={T.about_us_section3_desc}
                                isVisible={isVisible}
                                delay={0.4}
                            />
                        </div>

                        <motion.div 
                            initial={{ opacity: 0, y: 50 }}
                            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                            transition={{ duration: 0.7, delay: 0.6 }}
                            className={`relative bg-gray-700/50 p-10 rounded-2xl border-2 border-yellow-600/50 text-center shadow-2xl shadow-yellow-900/40 overflow-hidden`}
                        >
                            <div className="absolute inset-0 z-0">
                                <div className="glow-pulse-system absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                            </div>
                            
                            <div className="relative z-10">
                                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 flex items-center justify-center">
                                    <Icon name="mesteg" className="w-8 h-8 text-yellow-400 inline-block mr-3"/> 
                                    {T.about_us_sa}
                                </h2>
                                <p className="text-gray-300 text-lg max-w-3xl mx-auto mb-6">
                                    {T.about_us_sa_desc}
                                </p>
                                <Link href="/#contact" className="inline-block bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-8 rounded-lg transition-transform duration-300 transform hover:scale-105">
                                    Kurumsal Çözüm Talep Edin
                                </Link>
                            </div>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 50 }}
                            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                            transition={{ duration: 0.7, delay: 0.8 }}
                            className={`pt-8 border-t border-gray-700 text-center space-y-4`}
                        >
                            <h3 className="text-2xl font-bold text-white">Sistem Detaylarını İnceleyin</h3>
                            <div className="flex justify-center flex-wrap gap-4">
                                <Link href="/modules" className="bg-gray-700 hover:bg-yellow-600 text-white transition-colors inline-flex items-center text-lg font-semibold py-2 px-4 rounded-lg">
                                    <Icon name="boxes" className="w-5 h-5 mr-2"/>
                                    Synara Sistem Mimarisi
                                </Link>
                                <Link href="/#pricing" className="bg-gray-700 hover:bg-yellow-600 text-white transition-colors inline-flex items-center text-lg font-semibold py-2 px-4 rounded-lg">
                                    <Icon name="wallet" className="w-5 h-5 mr-2"/>
                                    Abonelik ve Fiyatlandırma
                                </Link>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </section>
        </>
    );
};

export default AboutUsClient;
