// path: components/vision/VisionClient.js
'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Icon from '@/components/Icon';
import useScrollAnimation from '@/hooks/useScrollAnimation';

const StepCard = ({ title, content, date, icon, index }) => {
    const [ref, isVisible] = useScrollAnimation(0.3);
    const isRight = index % 2 !== 0;

    const cardVariants = {
        hidden: { opacity: 0, x: isRight ? 100 : -100, scale: 0.9 },
        visible: { 
            opacity: 1, 
            x: 0,
            scale: 1,
            transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
        }
    };

    return (
        <div ref={ref} className={`flex ${isRight ? 'md:justify-start' : 'md:justify-end'} w-full md:w-1/2 ${isRight ? 'md:self-end' : 'md:self-start'}`}>
            <motion.div
                variants={cardVariants}
                initial="hidden"
                animate={isVisible ? "visible" : "hidden"}
                className={`relative w-full max-w-sm p-6 rounded-2xl border border-yellow-600/40 bg-gray-900/40 backdrop-blur-lg shadow-2xl shadow-yellow-800/50 hover:border-yellow-500/90 hover:shadow-yellow-700/60 transition-all duration-300 group
                    ${isRight ? 'md:ml-8' : 'md:mr-8'}`}
            >
                {/* Bağlantı Çizgisi */}
                <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 h-px w-8 bg-gradient-to-r from-yellow-600/50 to-transparent ${isRight ? '-left-8' : 'left-full rotate-180'}`}></div>
                 <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-gray-900 border-2 border-yellow-500 rounded-full group-hover:border-yellow-400 transition-colors duration-300 ${isRight ? '-left-[42px]' : '-right-[42px]'}`}>
                    <div className="w-full h-full bg-yellow-600/50 rounded-full animate-pulse group-hover:bg-yellow-500/50"></div>
                 </div>

                <div className="flex items-start space-x-4">
                    <div className="p-3 bg-yellow-900/40 rounded-xl border border-yellow-700/60 transition-colors">
                         <Icon name={icon} className="w-8 h-8 text-yellow-300 transition-colors" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-yellow-300 transition-colors">{title}</h3>
                        <span className="text-xs font-mono text-gray-500">{date}</span>
                    </div>
                </div>
                <p className="text-gray-300 leading-relaxed text-sm mt-4">{content}</p>
            </motion.div>
        </div>
    );
};


const VisionClient = ({ T }) => {
    
    const timelineData = useMemo(() => [
        { title: T.vision_section1_title, content: T.vision_section1_content, date: "1996", icon: 'cpu' },
        { title: T.vision_section2_title, content: T.vision_section2_content, date: "2014", icon: 'server' },
        { title: T.vision_section3_title, content: T.vision_section3_content, date: T.vision_section3_date, icon: 'alert-triangle' },
        { title: T.vision_section4_title, content: T.vision_section4_content, date: T.vision_section4_date, icon: 'boxes' },
    ], [T]);

    return (
        <main className="py-20 relative overflow-hidden">
            {/* Arka Plan Işık Efekti */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[600px] bg-radial-gradient-top from-yellow-700/30 to-transparent pointer-events-none -z-10 blur-3xl"></div>

            <div className="container mx-auto px-6 max-w-5xl">
                
                {/* Kurucu Notu */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="mb-20 bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-yellow-700/50 shadow-2xl shadow-yellow-900/40"
                >
                    <h2 className="text-2xl font-bold text-yellow-400 mb-4">{T.vision_founder_note_title}</h2>
                    <p className="text-gray-300 leading-relaxed italic">{T.vision_founder_note_content}</p>
                    <p className="text-sm font-semibold text-yellow-500 mt-4 text-right">- Baş Sistem Mimarı</p>
                </motion.div>


                {/* Yol Haritası Başlığı */}
                <div className="text-center mb-20">
                     <h2 className="text-3xl font-bold text-white mb-2">Synara Disiplin Yol Haritası</h2>
                     <p className="text-gray-400">Teknik tecrübenin piyasa kaosunu sisteme dönüştürme protokolü.</p>
                </div>

                {/* Zaman Tüneli */}
                <div className="relative flex flex-col items-center">
                    {/* Dikey çizgi */}
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-transparent via-yellow-500/70 to-transparent"></div>
                    
                    <div className="space-y-16 w-full flex flex-col items-center">
                        {timelineData.map((step, index) => (
                            <StepCard 
                                key={index} 
                                title={step.title} 
                                content={step.content} 
                                date={step.date} 
                                icon={step.icon} 
                                index={index}
                            />
                        ))}
                    </div>
                </div>
                
                {/* CTA */}
                <div className="text-center mt-20">
                    <Link href="/modules" className="synth-btn-secondary inline-flex items-center justify-center text-lg">
                        <Icon name="boxes" className="w-5 h-5 mr-3"/>
                        Tüm Sistem Mimarisine Git
                    </Link>
                </div>
            </div>
        </main>
    );
};

export default VisionClient;

