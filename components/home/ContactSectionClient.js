// path: components/home/ContactSectionClient.js
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion'; 
import Icon from '@/components/Icon';
import { useNotification } from '@/context/NotificationContext';
import Link from 'next/link';

// 7. CONTACT SECTION
const ContactSectionClient = ({ T }) => {
    const { showToast } = useNotification();
    const [formData, setFormData] = useState({ name: '', email: '', message: '', b_name: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
            showToast('KRİTİK HATA: Tüm alanlar zorunludur. Disiplin protokolü gereğidir.', 'error');
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Sistem bir hata ile karşılaştı. Lütfen daha sonra deneyin.');
            showToast('İletim Başarılı: Mesajınız Synara Komuta Merkezi\'ne ulaştı. En kısa sürede geri dönüş yapacağız.', 'success', 5000);
            setFormData({ name: '', email: '', message: '', b_name: '' });
        } catch (error) {
            showToast(`İletim Hatası: ${error.message}`, 'error', 8000);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.section 
            id="contact" 
            className="py-20 bg-[#111827] relative overflow-hidden"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8 }}
        >
             <div className="absolute inset-0" style={{
                background: 'radial-gradient(circle at 10% 90%, rgba(255, 204, 0, 0.1) 0%, rgba(17, 24, 39, 0) 60%)'
            }}></div>
            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-white">{T.contact_section_title}</h2>
                    <p className="text-gray-400 mt-2 text-lg">{T.contact_section_subtitle}</p>
                </div>
                
                <div className="max-w-5xl mx-auto bg-gray-800/80 backdrop-blur-md p-6 rounded-2xl shadow-2xl shadow-black/40 border border-indigo-700/50 grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    <div className="md:border-r border-gray-700/50 md:pr-8">
                        <h3 className="text-2xl font-bold text-indigo-400 mb-6 flex items-center">
                            <Icon name="mail" className="w-6 h-6 mr-3" />
                            {T.contact_form_title} (Komuta Merkezi)
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="absolute left-[-5000px]" aria-hidden="true">
                                <input type="text" name="b_name" tabIndex="-1" value={formData.b_name} onChange={handleInputChange} autoComplete="off" />
                            </div>
                            
                            <input type="text" name="name" value={formData.name} onChange={handleInputChange} disabled={isSubmitting} className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500" placeholder={T.form_name_placeholder} required />
                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} disabled={isSubmitting} className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500" placeholder={T.form_email_placeholder} required />
                            <textarea name="message" rows="4" value={formData.message} onChange={handleInputChange} disabled={isSubmitting} className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500" placeholder={T.form_message_placeholder} required ></textarea>
                            <button type="submit" disabled={isSubmitting} className="w-full glow-on-hover-btn-primary">
                                {isSubmitting ? 'Sistem İletiyor...' : T.form_submit_button}
                            </button>
                        </form>
                    </div>

                    <div className="flex flex-col justify-between">
                         <div className="space-y-4">
                            <h4 className="text-xl font-bold text-white mb-4">Mesteg Teknoloji (Kurumsal Protokol)</h4>
                            
                            <div className="flex items-center p-3 bg-gray-700/50 rounded-lg">
                                <Icon name="whatsapp" className="w-5 h-5 text-green-400 mr-3" />
                                <div>
                                    <span className="text-sm font-semibold block text-gray-300">Canlı Destek:</span>
                                    <a href="https://wa.me/905326499700" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-white transition-colors text-base font-bold">+90 532 649 97 00</a>
                                </div>
                            </div>
                            
                            <div className="flex items-center p-3 bg-gray-700/50 rounded-lg">
                                <Icon name="mail" className="w-5 h-5 text-yellow-400 mr-3" />
                                <div>
                                    <span className="text-sm font-semibold block text-gray-300">Kurumsal E-posta:</span>
                                    <span className="text-white text-base">info@mesteg.com.tr</span>
                                </div>
                            </div>

                             <div className="p-3 bg-gray-700/50 rounded-lg">
                                <Icon name="info" className="w-5 h-5 text-indigo-400 mr-3 inline-block" />
                                <span className="text-sm font-semibold text-gray-300">Adres:</span>
                                <p className="text-xs text-gray-400 mt-1">İstanbul Teknopark, Teknoloji Geliştirme Bölgesi</p>
                            </div>
                        </div>
                        
                        <Link href="/vision" className="mt-8 block group bg-indigo-900/50 p-4 rounded-xl border border-indigo-500/50 hover:bg-indigo-700/50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div>
                                     <h5 className="font-bold text-white group-hover:text-yellow-400 transition-colors">Vizyon Protokolünü İncele</h5>
                                     <p className="text-xs text-gray-400">Piyasa kaosu nasıl sisteme dönüştü?</p>
                                </div>
                                <Icon name="arrow-right" className="w-5 h-5 text-yellow-400"/>
                            </div>
                        </Link>
                    </div>

                </div>
            </div>
        </motion.section>
    );
};

export default ContactSectionClient;
