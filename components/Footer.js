// path: components/Footer.js
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Icon from './Icon';
import { useAuth } from '@/context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

const Footer = () => {
    // KRİTİK DÜZELTME: useAuth hook'u koşulsuz çağrılmalı.
    const { T, user } = useAuth(); 

    // KRİTİK FİX 1: navigationSections useMemo hook'u koşulsuz çağrılmalı (if'ten önce).
    // T objesi henüz yüklenmediyse (null/empty), güvenli varsayılan değerler kullanılır.
    const navigationSections = useMemo(() => [
        {
            title: T?.footer_architecture || "Sistem Mimarisi",
            links: [
                { href: '/modules/engine', label: T?.engine_tab_title || 'Engine: Karar Merkezi' },
                { href: '/modules/nexus', label: T?.nexus_tab_title || 'Nexus: Piyasa Yapısı/OB' },
                { href: '/modules/metis', label: T?.metis_tab_title || 'Metis: Makro/Likidite' },
                { href: '/modules/rsi-han', label: T?.rsi_tab_title || 'RSI-HAN: Momentum' },
                { href: '/modules/visuals', label: T?.visuals_tab_title || 'Visuals: Konsensüs' },
            ],
        },
        {
            title: T?.footer_quick_links || "Hızlı Erişim",
            links: [
                { href: '/dashboard', label: T?.nav_dashboard || 'Panelim', authRequired: true },
                { href: '/kasa-yonetimi', label: T?.nav_kasa_yonetimi || 'Kasa Yönetimi', authRequired: true },
                { href: '/lig', label: T?.nav_lig || 'Disiplin Ligi', authRequired: true },
                { href: '/market-pulse', label: T?.nav_live_chart || 'Piyasa Nabzı', authRequired: true },
                { href: '/analyses', label: T?.nav_analysis_portal || 'Analiz Portalı' },
                { href: '/blog', label: T?.blog_page_title_header || 'Analizler & Blog' },
            ],
        },
        {
            title: T?.footer_corporate_legal || "Kurumsal ve Yasal",
            links: [
                { href: '/about-us', label: T?.nav_about_us || 'Mesteg Teknoloji' },
                { href: '/vision', label: T?.nav_vision || 'Vizyon Protokolü' },
                { href: '/terms-of-service', label: T?.footer_terms || 'Hizmet Şartları' },
                { href: '/privacy-policy', label: T?.footer_privacy || 'Gizlilik Politikası' },
            ],
        },
        {
            title: T?.footer_contact_vision || "İletişim ve Destek",
            info: [
                { icon: 'phone', text: '+90 532 649 97 00', link: 'tel:+905326499700' },
                { icon: 'mail', text: 'info@mesteg.com', link: 'mailto:info@mesteg.com' },
                { icon: 'map-pin', text: 'Mesteg Teknoloji Ltd. Şti.', link: '/about-us' },
            ]
        }
    ], [T]);

    // KRİTİK FİX 2: filteredSections useMemo hook'u koşulsuz çağrılmalı (if'ten önce).
    const filteredSections = useMemo(() => {
        return navigationSections.map(section => {
            if (section.links) {
                return {
                    ...section,
                    // user kontrolü burada yapılıyor.
                    links: section.links.filter(link => !link.authRequired || user),
                };
            }
            return section;
        });
    }, [navigationSections, user]);
    
    // KRİTİK FİX 3: socialLinks useMemo hook'u koşulsuz çağrılmalı (if'ten önce).
    const socialLinks = useMemo(() => [
        { icon: 'x', href: 'https://x.com/SynaraSystem', label: 'X (Twitter)' },
        { icon: 'youtube', href: 'https://youtube.com/@SynaraSystem', label: 'YouTube' },
        { icon: 'linkedin', href: 'https://linkedin.com/company/synara-system', label: 'LinkedIn' },
        { icon: 'instagram', href: 'https://instagram.com/synarasystem', label: 'Instagram' },
    ], []);


    // Çeviri objesi henüz yüklenmediyse (SSR sırasında nadiren) boş döndür.
    // Hook'lar bu if bloğundan önce çağrıldığı için kural ihlali oluşmaz.
    if (!T || Object.keys(T).length === 0) {
        return <footer className="bg-gray-950 py-12"><div className="container mx-auto px-6 text-gray-500 text-center">{T?.loading || 'Yükleniyor...'}</div></footer>;
    }

    return (
        <AnimatePresence>
            <motion.footer
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-gray-950/95 text-gray-400 border-t border-indigo-900/40 backdrop-blur-sm"
                role="contentinfo"
            >
                <div className="container mx-auto px-6 py-12">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                        {/* Kolon 1: Logo ve İletişim */}
                        <div className="col-span-2 md:col-span-2 space-y-4">
                            <Link href="/" className="flex items-center gap-2 text-white" aria-label="Synara System Ana Sayfa">
                                <Icon name="synara" className="w-8 h-8 text-indigo-400" aria-hidden="true" />
                                <span className="font-extrabold text-2xl tracking-tight">Synara System</span>
                            </Link>
                            <p className="text-sm pr-8">{T.footer_contact_info || "Destek ve kurumsal talepleriniz için bize ulaşabilirsiniz."}</p>
                            
                            <div className="space-y-2">
                                {/* İletişim Bilgileri */}
                                {filteredSections[3].info.map((item, index) => (
                                    <div key={index} className="flex items-center space-x-2 text-sm">
                                        <Icon name={item.icon} className="w-4 h-4 text-indigo-400 flex-shrink-0" aria-hidden="true" />
                                        {item.link ? (
                                            <a href={item.link} className="hover:text-white transition-colors">
                                                {item.text}
                                            </a>
                                        ) : (
                                            <span>{item.text}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            {/* Sosyal Medya */}
                            <div className="flex space-x-4 pt-2">
                                {socialLinks.map(link => (
                                    <a 
                                        key={link.icon}
                                        href={link.href} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-gray-500 hover:text-indigo-400 transition-colors p-1"
                                        aria-label={link.label}
                                    >
                                        <Icon name={link.icon} className="w-6 h-6" aria-hidden="true" />
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Navigasyon Kolonları */}
                        {filteredSections.slice(0, 3).map((section, index) => (
                            <div key={index} className="col-span-1 space-y-4">
                                <h4 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-indigo-700/50 pb-1">
                                    {section.title}
                                </h4>
                                <ul className="space-y-2 text-sm">
                                    {section.links.map(link => (
                                        <li key={link.href}>
                                            <Link 
                                                href={link.href} 
                                                className="hover:text-white transition-colors hover:underline"
                                            >
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* SEO ve Yasal Dipnot */}
                    <div className="mt-12 pt-8 border-t border-gray-800/50 space-y-4">
                        <p className="text-xs text-center text-gray-500">
                            &copy; {new Date().getFullYear()} Mesteg Teknoloji LTD. ŞTİ. | {T.footer_rights || "Tüm hakları saklıdır."}
                        </p>
                        
                        {/* KRİTİK DÜZELTME: YASAL UYARI metni çeviri dosyasından çekildi */}
                        <div className="text-xs text-center text-red-400/80 bg-red-900/10 p-3 rounded-xl border border-red-900/50">
                            <span className="font-bold">{T.footer_disclaimer_title || "YASAL UYARI:"}</span> {T.footer_disclaimer}
                        </div>
                        
                        {/* KRİTİK DÜZELTME: SEO Anahtar Kelimeleri görünmez bir alana yerleştirildi */}
                        <div className="hidden">
                            {T.footer_seo_keywords}
                        </div>
                    </div>
                </div>
            </motion.footer>
        </AnimatePresence>
    );
};

export default Footer;
