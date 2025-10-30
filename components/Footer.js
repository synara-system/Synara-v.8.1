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
    const navigationSections = useMemo(() => [
        {
            title: T?.footer_architecture || "SİSTEM MİMARİSİ",
            links: [
                { href: '/modules/engine', label: T?.engine_tab_title || 'Engine: Karar Merkezi' },
                { href: '/modules/nexus', label: T?.nexus_tab_title || 'Nexus: Piyasa Yapısı/OB' },
                { href: '/modules/metis', label: T?.metis_tab_title || 'Metis: Makro/Likidite' },
                { href: '/modules/rsi-han', label: T?.rsi_tab_title || 'RSI-HAN: Momentum' },
                { href: '/modules/visuals', label: T?.visuals_tab_title || 'Visuals: Konsensüs' },
            ],
        },
        {
            title: T?.footer_quick_links || "HIZLI ERİŞİM",
            links: [
                // Yeni referans linki eklendi (Kurumsal)
                { href: '/mesteg-referans', label: 'Synara Altyapısı', authRequired: false }, 
                { href: '/dashboard', label: T?.nav_dashboard || 'Panelim', authRequired: true },
                { href: '/kasa-yonetimi', label: T?.nav_kasa_yonetimi || 'Kasa Yönetimi', authRequired: true },
                { href: '/lig', label: T?.nav_lig || 'Disiplin Ligi', authRequired: true },
                { href: '/market-pulse', label: T?.nav_live_chart || 'Piyasa Nabzı', authRequired: true },
                { href: '/analyses', label: T?.nav_analysis_portal || 'Analiz Portalı' },
                { href: '/blog', label: T?.blog_page_title_header || 'Blog & Yönetim' },
            ],
        },
        {
            title: T?.footer_corporate_legal || "KURUMSAL VE YASAL",
            links: [
                { href: '/about-us', label: T?.nav_about_us || 'Mesteg Teknoloji' },
                { href: '/vision', label: T?.nav_vision || 'Vizyon Protokolü' },
                { href: '/terms-of-service', label: T?.footer_terms || 'Hizmet Şartları' },
                { href: '/privacy-policy', label: T?.footer_privacy || 'Gizlilik Politikası' },
                
            ],
        },
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
        { icon: 'linkedin', href: 'https://linkedin.com/company/synara-system', label: 'LinkedIn' },
        { icon: 'instagram', href: 'https://instagram.com/synarasystem', label: 'Instagram' },
    ], []);

    // İletişim Bilgileri (Görseldeki gibi)
    const contactInfo = useMemo(() => [
        { icon: 'phone', text: '+90 532 649 97 00', link: 'tel:+905326499700' },
        { icon: 'mail', text: 'info@mesteg.com', link: 'mailto:info@mesteg.com' },
        { icon: 'map-pin', text: 'Mesteg Teknoloji Ltd. Şti.', link: '/about-us' },
    ], []);


    // Çeviri objesi henüz yüklenmediyse (SSR sırasında nadiren) boş döndür.
    if (!T || Object.keys(T).length === 0) {
        return <footer className="bg-gray-950 py-12"><div className="container mx-auto px-6 text-gray-500 text-center">{T?.loading || 'Yükleniyor...'}</div></footer>;
    }

    return (
        <AnimatePresence>
            <motion.footer
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                // KRİTİK: Daha koyu, fütüristik arkaplan (Görselle uyumlu)
                className="bg-[#0e0e1a] text-gray-400 border-t border-indigo-900/40 backdrop-blur-sm"
                role="contentinfo"
            >
                <div className="container mx-auto px-6 py-12">
                    {/* KRİTİK: Grid yapısı 5 sütuna ayarlandı (2:1:1:1:X) */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                        
                        {/* Kolon 1 (Geniş: Logo, İletişim, Sosyal) */}
                        <div className="col-span-2 md:col-span-2 space-y-4">
                            <Link href="/" className="flex items-center gap-2 text-white" aria-label="Synara System Ana Sayfa">
                                {/* Logo: Yüksek Kontrastlı ve Neon Vurgu */}
                                <Icon name="synara" className="w-8 h-8 text-indigo-400" aria-hidden="true" />
                                <span className="font-extrabold text-2xl tracking-tight">Synara System</span>
                            </Link>
                            <p className="text-sm pr-8">{T.footer_contact_info || "Destek ve kurumsal talepleriniz için bize ulaşabilirsiniz."}</p>
                            
                            {/* İletişim Bilgileri (Sarı Neon Vurgu) */}
                            <div className="space-y-2 pt-2">
                                {contactInfo.map((item, index) => (
                                    <div key={index} className="flex items-center space-x-2 text-sm">
                                        {/* İkonlar Sarı (Görselle uyumlu) */}
                                        <Icon name={item.icon} className="w-4 h-4 text-yellow-400 flex-shrink-0" aria-hidden="true" />
                                        {item.link ? (
                                            <a href={item.link} className="hover:text-yellow-300 transition-colors">
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
                                        // KRİTİK: Hover'da Indigo rengi (Sistem rengi)
                                        className="text-gray-500 hover:text-indigo-400 transition-colors p-1"
                                        aria-label={link.label}
                                    >
                                        <Icon name={link.icon} className="w-6 h-6" aria-hidden="true" />
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Navigasyon Kolonları (3 Sütun) */}
                        {filteredSections.slice(0, 3).map((section, index) => (
                            <div key={index} className="col-span-1 space-y-4">
                                {/* KRİTİK BAŞLIK STİLİ: footer-heading-line sınıfı globals.css'ten çekilir. */}
                                <h4 className="text-sm font-semibold text-white uppercase tracking-wider footer-heading-line">
                                    {section.title}
                                </h4>
                                <ul className="space-y-2 text-sm">
                                    {section.links.map(link => (
                                        <li key={link.href}>
                                            <Link 
                                                href={link.href} 
                                                // KRİTİK: Linkler için beyaz/neon sarı hover
                                                className="hover:text-yellow-400 transition-colors"
                                            >
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* SEO ve Yasal Dipnot (Ayrı ve Vurgulu) */}
                    <div className="mt-8 pt-6 border-t border-gray-800/50 space-y-4">
                         
                        {/* REFACTOR (Kırmızı Çerçeve Kaldırıldı): 
                          İsteğiniz üzerine 'legal-disclaimer-box' kaldırıldı. 
                          'text-red-400' (agresif) -> 'text-yellow-500' (vurgu) olarak değiştirildi.
                          'text-gray-300' -> 'text-gray-400' (kontrast) olarak değiştirildi.
                        */}
                        <p className="text-xs text-center mx-auto max-w-4xl text-gray-400">
                            <span className="font-bold text-yellow-500">YASAL UYARI: </span> 
                            <span className="ml-1">
                                {T.footer_disclaimer}
                            </span>
                        </p>
                        
                        {/* Copyright ve Kurumsal İsim 
                          PageSpeed FİX (Erişilebilirlik - Kontrast):
                          'text-gray-500' (düşük kontrast) -> 'text-gray-400' (yeterli kontrast) 
                        */}
                        <p className="text-xs text-center text-gray-400">
                            &copy; {new Date().getFullYear()} Mesteg Teknoloji LTD. ŞTİ. | {T.footer_rights || "Tüm hakları saklıdır. Synara System bir Mesteg Teknoloji Markasıdır."}
                        </p>
                        
                        {/* SEO Anahtar Kelimeleri */}
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

