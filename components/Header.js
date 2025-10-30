// path: components/Header.js
'use client'; 

// P29.0 FİX (Adım 1 - Revert P28.0): Çakışan P24.0 FİX import'ları (useRouter, signOut, auth, useQueryClient, useCallback) GERİ EKLENDİ.
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
// P29.0 FİX (Adım 1 - Revert P28.0): GERİ EKLENDİ.
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth'; // P29.0 FİX (Adım 1): GERİ EKLENDİ
import { auth } from '@/firebase'; // P29.0 FİX (Adım 1): GERİ EKLENDİ
import Icon from './Icon';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query'; // P29.0 FİX (Adım 1): GERİ EKLENDİ

// KRİTİK EKLENTİ: Aktif renge göre dinamik Tailwind sınıfları üreten fonksiyon
// Bu fonksiyon artık sadece renk adlarını döndürüyor, sınıf birleştirmesi JSX'te yapılacak.
const getDynamicActiveCls = (color = 'indigo') => {
    return {
        // Tailwind'in safelist'ine eklenen sınıflara güveniyoruz
        base: `text-${color}-400`,
        active: `text-white border-2 border-${color}-500/50 bg-${color}-900/70 shadow-lg shadow-${color}-900/50`,
    };
};

// Navigasyon Butonu
const NavBtn = ({ children, isActive, as = 'button', className = '', activeColor = 'indigo', 'aria-label': ariaLabel, ...props }) => {
    
    const baseCls = 'px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ease-in-out whitespace-nowrap transform hover:scale-[1.03] active:scale-[0.98]';
    
    // AKTİF DURUM STİLİ (Dinamik Renk)
    const dynamicActiveCls = getDynamicActiveCls(activeColor).active;
    
    // KRİTİK DÜZELTME: PASİF DURUM VARSAYILAN STİLİ (Safelist'te var olan sınıflar)
    const defaultInactiveCls = 'text-gray-400 border border-gray-700/50 hover:text-indigo-300 hover:bg-gray-700/50 hover:ring-2 hover:ring-indigo-500/50';

    let finalCls = `${baseCls} ${isActive ? dynamicActiveCls : defaultInactiveCls} ${className}`;
    
    // KRİTİK DÜZELTME: Link'lerde dinamik renkler kullanılacaksa `activeColor` prop'u kullanılır.
    const Component = as === 'link' ? Link : 'button';

    return <Component className={finalCls} role="button" aria-label={ariaLabel} {...props}>{children}</Component>;
};


// Mobil Navigasyon Öğesi
const MobileNavItem = ({ children, onClick, href, className, closeMenu, iconName }) => {
    const Component = href ? Link : 'button';
    const pathname = usePathname(); 
    
    const handleClick = (e) => {
        if (onClick) onClick(e);
        // KRİTİK FİX: Link'e tıklanınca menü kapanmalı
        if (closeMenu) closeMenu(); 
    };

    const isActive = href && (pathname === href || (href !== '/' && pathname.startsWith(href))); 
    
    // KRİTİK FİX: Mobil menüde Mesteg linkleri için sarı ikon rengini zorla
    const isMestegLink = href === '/about-us' || href === '/vision' || href === '/mesteg-referans'; // YENİ REFERANS EKLENDİ
    const iconColor = isActive ? 'text-yellow-400' : (isMestegLink ? 'text-yellow-400' : 'text-indigo-400');


    const content = (
        <span className="flex items-center gap-3">
             {iconName && <Icon name={iconName} className={`w-5 h-5 ${iconColor}`} aria-hidden="true" />}
             {children}
        </span>
    );

    return (
        <Component 
            href={href} 
            onClick={handleClick}
            role="menuitem" 
            className={`block w-full text-left px-3 py-2 rounded-full transition-colors ${ 
                isActive ? 'bg-indigo-900/70 text-white font-bold border border-indigo-600' : 'text-gray-300 hover:bg-gray-700/50'
            } ${className}`}
        >
            {content}
        </Component>
    );
};

// Modül Açılır Menüsü
const ModulesDropdown = ({ T, pathname, closeMobileMenu }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const buttonId = "modules-button";
    const menuId = "modules-menu";

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const moduleItems = useMemo(() => [
        { path: '/modules/engine', label: T.engine_tab_title || 'Engine: Karar Merkezi', icon: 'boxes', color: 'indigo' },
        { path: '/modules/metis', label: T.metis_tab_title || 'Metis: Makro/Likidite', icon: 'thermometer', color: 'yellow' },
        { path: '/modules/nexus', label: T.nexus_tab_title || 'Nexus: Piyasa Yapısı/OB', icon: 'blocks', color: 'green' },
        { path: '/modules/rsi-han', label: T.rsi_tab_title || 'RSI-HAN: Momentum', icon: 'activity', color: 'orange' },
        { path: '/modules/visuals', label: T.visuals_tab_title || 'Visuals: Konsensüs Skoru', icon: 'layout-grid', color: 'red' },
    ], [T]);

    const activeModule = useMemo(() => {
        const specificMatch = moduleItems.find(item => pathname.startsWith(item.path));
        if (specificMatch) return specificMatch;
        if (pathname === '/modules') {
             return { path: '/modules', label: T.nav_modules, icon: 'boxes', color: 'indigo' };
        }
        return null;
    }, [pathname, moduleItems, T.nav_modules]);

    const activeColor = activeModule?.color || 'indigo';
    const buttonIcon = activeModule?.icon || 'boxes';
    
    const isActive = pathname.startsWith('/modules'); 
    
    // KRİTİK DÜZELTME: Dinamik renk sınıfı kullanımı (Safelist'te tanımlı olanlar)
    const buttonActiveCls = `text-white shadow-lg border-2 border-${activeColor}-500/50 bg-${activeColor}-900/70 shadow-${activeColor}-900/50`;
    const buttonInactiveCls = 'text-gray-400 border border-gray-700/50 hover:text-indigo-300 hover:bg-indigo-900/30 hover:ring-2 hover:ring-indigo-500/50';

    const buttonCls = `flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl transition-all duration-300 whitespace-nowrap transform hover:scale-[1.03] active:scale-[0.98] border ${
        isActive 
            ? buttonActiveCls
            : buttonInactiveCls
    }`;
    
    const handleLinkClick = () => {
        setIsOpen(false);
        if(closeMobileMenu) closeMobileMenu();
    }

    return (
        <div ref={dropdownRef} className="relative z-50">
            <button
                id={buttonId}
                onClick={() => setIsOpen(!isOpen)}
                className={buttonCls}
                aria-expanded={isOpen}
                aria-controls={menuId}
                aria-haspopup="menu"
            >
                 <Icon name={buttonIcon} className="w-4 h-4" aria-hidden="true" />
                 {T.nav_modules}
                 <Icon name="chevron-down" className={`w-4 h-4 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} aria-hidden="true" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        id={menuId}
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 origin-top bg-gray-900/95 backdrop-blur-lg rounded-xl shadow-2xl ring-1 ring-indigo-500/30 divide-y divide-gray-700/50 p-2"
                        role="menu" 
                        aria-labelledby={buttonId}
                    >
                        <div className="p-1">
                            <Link
                                href="/modules"
                                className={`flex items-center px-3 py-2 text-sm transition-all duration-300 rounded-lg space-x-3 
                                    ${pathname === '/modules' 
                                        ? 'bg-indigo-700/80 text-white font-bold border border-indigo-500/50' 
                                        : 'text-indigo-400 hover:bg-indigo-700/50 hover:text-white'}`
                                }
                                onClick={handleLinkClick}
                                role="menuitem"
                            >
                                <Icon name="layout-grid" className="w-4 h-4 flex-shrink-0 text-white" aria-hidden="true" />
                                <span>Tüm Sistem Mimarisi</span>
                            </Link>
                        </div>
                        <div className="p-1 space-y-1 pt-2">
                            {moduleItems.map(item => {
                                const isItemActive = pathname.startsWith(item.path);
                                
                                const itemColor = item.color; 
                                // KRİTİK DÜZELTME: Dinamik renk sınıfı kullanımı (Safelist'te tanımlı olanlar)
                                const activeItemCls = `bg-${itemColor}-700/80 text-white font-bold border border-${itemColor}-500/50 shadow-md shadow-black/30`;
                                const inactiveItemCls = `text-gray-300 hover:bg-gray-700/70 hover:text-white`;
                                const itemClass = isItemActive ? activeItemCls : inactiveItemCls;
                                // KRİTİK DÜZELTME: Dinamik ikon rengi sınıfı kullanımı (Safelist'te tanımlı olanlar)
                                const itemIconColor = isItemActive ? 'text-white' : `text-${itemColor}-400`;

                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        className={`flex items-center px-3 py-2 text-sm transition-all duration-300 rounded-lg space-x-3 ${itemClass}`}
                                        onClick={handleLinkClick}
                                        role="menuitem" 
                                    >
                                        <Icon name={item.icon} className={`w-4 h-4 flex-shrink-0 ${itemIconColor}`} aria-hidden="true" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// YENİ: Blog/Haberler Açılır Menüsü
const BlogDropdown = ({ T, pathname, closeMobileMenu }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const buttonId = "blog-button";
    const menuId = "blog-menu";

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const blogItems = useMemo(() => [
        { path: '/blog', label: T.blog_page_title_header || 'Analizler', icon: 'align-left', color: 'indigo' },
        { path: '/haberler', label: T.nav_news || 'Haberler', icon: 'bell', color: 'orange' }, 
    ], [T]);

    const activeBlogItem = useMemo(() => {
        return blogItems.find(item => pathname.startsWith(item.path));
    }, [pathname, blogItems]);

    const activeColor = activeBlogItem?.color || 'indigo';
    const buttonIcon = activeBlogItem ? activeBlogItem.icon : 'align-left'; 
    
    const isActive = pathname.startsWith('/blog') || pathname.startsWith('/haberler');
    
    // KRİTİK DÜZELTME: Dinamik renk sınıfı kullanımı (Safelist'te tanımlı olanlar)
    const buttonActiveCls = `text-white shadow-lg border-2 border-${activeColor}-500/50 bg-${activeColor}-900/70 shadow-${activeColor}-900/50`;
    const buttonInactiveCls = 'text-gray-400 border border-gray-700/50 hover:text-indigo-300 hover:bg-indigo-900/30 hover:ring-2 hover:ring-indigo-500/50';

    const buttonCls = `flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl transition-all duration-300 whitespace-nowrap transform hover:scale-[1.03] active:scale-[0.98] border ${
        isActive 
            ? buttonActiveCls
            : buttonInactiveCls
    }`;
    
    const handleLinkClick = () => {
        setIsOpen(false);
        if(closeMobileMenu) closeMobileMenu();
    }

    return (
        <div ref={dropdownRef} className="relative z-50">
            <button
                id={buttonId}
                onClick={() => setIsOpen(!isOpen)}
                className={buttonCls}
                aria-expanded={isOpen}
                aria-controls={menuId}
                aria-haspopup="menu"
            >
                 <Icon name={buttonIcon} className="w-4 h-4" aria-hidden="true" />
                 {T.nav_blog}
                 <Icon name="chevron-down" className={`w-4 h-4 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} aria-hidden="true" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        id={menuId}
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 origin-top bg-gray-900/95 backdrop-blur-lg rounded-xl shadow-2xl ring-1 ring-indigo-500/30 p-2"
                        role="menu" 
                        aria-labelledby={buttonId}
                    >
                        <div className="p-1 space-y-1">
                            {blogItems.map(item => {
                                const isItemActive = pathname.startsWith(item.path);
                                const itemColor = item.color;
                                
                                // KRİTİK DÜZELTME: Dinamik renk sınıfı kullanımı (Safelist'te tanımlı olanlar)
                                const activeItemCls = `bg-${itemColor}-700/80 text-white font-bold border border-${itemColor}-500/50 shadow-md shadow-black/30`;
                                const inactiveItemCls = `text-gray-300 hover:bg-gray-700/70 hover:text-white`;
                                const itemClass = isItemActive ? activeItemCls : inactiveItemCls;
                                // KRİTİK DÜZELTME: Dinamik ikon rengi sınıfı kullanımı (Safelist'te tanımlı olanlar)
                                const itemIconColor = isItemActive ? 'text-white' : `text-${itemColor}-400`;

                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        className={`flex items-center px-3 py-2 text-sm transition-all duration-300 rounded-lg space-x-3 ${itemClass}`}
                                        onClick={handleLinkClick}
                                        role="menuitem" 
                                    >
                                        <Icon name={item.icon} className={`w-4 h-4 flex-shrink-0 ${itemIconColor}`} aria-hidden="true" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Mesteg / Vizyon Açılır Menüsü
const MestegDropdown = ({ T, pathname, closeMobileMenu }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const buttonId = "mesteg-button";
    const menuId = "mesteg-menu";

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const mestegItems = useMemo(() => [
        // YENİ EKLEME: Kurumsal Referans Sekmesi
        { path: '/mesteg-referans', label: 'Synara Alt Yapısı', icon: 'award', color: 'sky' }, 
        { path: '/about-us', label: T.nav_about_us || 'Mesteg Teknoloji', icon: 'info', color: 'amber' }, 
        { path: '/vision', label: T.nav_vision || 'Vizyon', icon: 'eye', color: 'orange' },
    ], [T]);

    // KRİTİK DÜZELTME: Aktiflik kontrolü artık yeni referans sayfasını da içeriyor.
    const isActive = pathname.startsWith('/about-us') || pathname.startsWith('/vision') || pathname.startsWith('/mesteg-referans');
    const activeItem = mestegItems.find(item => pathname.startsWith(item.path));
    const activeColor = activeItem?.color || 'amber';

    const inactiveCls = 'text-amber-300 border border-amber-800/60 bg-black/20 hover:bg-amber-900/40 hover:border-amber-700/70 shadow-md shadow-amber-950/20';
    // KRİTİK DÜZELTME: Dinamik renk sınıfı kullanımı (Safelist'te tanımlı olanlar)
    const activeCls = `text-white shadow-lg border-2 border-${activeColor}-500/50 bg-${activeColor}-900/70 shadow-lg shadow-${activeColor}-900/50`;
    
    const buttonCls = `flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl transition-all duration-300 whitespace-nowrap transform hover:scale-[1.03] active:scale-[0.98] border ${
        isActive ? activeCls : inactiveCls
    }`;
    
    const handleLinkClick = () => {
        setIsOpen(false);
        if(closeMobileMenu) closeMobileMenu();
    }

    return (
        <div ref={dropdownRef} className="relative z-50">
            <button
                id={buttonId}
                onClick={() => setIsOpen(!isOpen)}
                className={buttonCls}
                aria-expanded={isOpen}
                aria-controls={menuId}
                aria-haspopup="menu"
            >
                 <Icon name="mesteg" className="w-4 h-4" aria-hidden="true" />
                 {T.nav_about_us}
                 <Icon name="chevron-down" className={`w-4 h-4 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} aria-hidden="true" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        id={menuId}
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 origin-top bg-gray-900/95 backdrop-blur-lg rounded-xl shadow-2xl ring-1 ring-amber-500/30 p-2"
                        role="menu"
                        aria-labelledby={buttonId}
                    >
                        <div className="p-1 space-y-1">
                            {mestegItems.map(item => {
                                const isItemActive = pathname.startsWith(item.path);
                                const itemColor = item.color;
                                
                                // KRİTİK DÜZELTME: Dinamik renk sınıfı kullanımı (Safelist'te tanımlı olanlar)
                                const activeItemCls = `bg-${itemColor}-700/80 text-white font-bold border border-${itemColor}-500/50 shadow-md shadow-black/30`;
                                const inactiveItemCls = `text-gray-300 hover:bg-gray-700/70 hover:text-white`;
                                const itemClass = isItemActive ? activeItemCls : inactiveItemCls;
                                // KRİTİK DÜZELTME: Dinamik ikon rengi sınıfı kullanımı (Safelist'te tanımlı olanlar)
                                const itemIconColor = isItemActive ? 'text-white' : `text-${itemColor}-400`;

                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        className={`flex items-center px-3 py-2 text-sm transition-all duration-300 rounded-lg space-x-3 ${itemClass}`}
                                        onClick={handleLinkClick}
                                        role="menuitem" 
                                    >
                                        <Icon name={item.icon} className={`w-4 h-4 flex-shrink-0 ${itemIconColor}`} aria-hidden="true" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Panel Açılır Menüsü
const DashboardDropdown = ({ T, pathname, isAdmin, handleLogout, closeMobileMenu }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const buttonId = "dashboard-button";
    const menuId = "dashboard-menu";


    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);
    
    const navGroups = useMemo(() => [
        { 
            title: T.nav_dashboard || 'ANA PANEL & YÖNETİM', 
            items: [
                { path: '/dashboard', label: T.nav_dashboard, icon: 'user-circle-2', color: 'indigo' },
                { path: '/admin', label: T.nav_admin, icon: 'shield-check', color: 'amber', isAdmin: true, textColor: 'text-gray-900' }, 
            ].filter(item => !item.isAdmin || isAdmin)
        },
        {
            title: 'AI PROTOKOLÜ & DİSİPLİN',
            items: [
                { path: '/assistant', label: T.nav_assistant, icon: 'send', color: 'sky' }, 
                { path: '/kokpit', label: T.nav_kokpit, icon: 'bar-chart-2', color: 'green' },
                { path: '/lig', label: T.nav_lig, icon: 'award', color: 'amber' },
            ]
        },
        {
            title: 'TEKNİK ARAÇLAR',
            items: [
                { path: '/kasa-yonetimi', label: T.nav_kasa_yonetimi, icon: 'wallet', color: 'yellow' },
                { path: '/market-pulse', label: T.nav_live_chart, icon: 'activity', color: 'indigo' },
            ]
        },
    ], [T, isAdmin]);
    
    const allNavItems = navGroups.flatMap(group => group.items);
    
    const isAnyPanelPageActive = useMemo(() => {
        return allNavItems.some(item => pathname.startsWith(item.path));
    }, [pathname, allNavItems]);
    
    const activeItem = useMemo(() => {
        const specificMatch = allNavItems.slice().sort((a, b) => b.path.length - a.path.length).find(item => pathname.startsWith(item.path));
        if (specificMatch) return specificMatch;
        if (isAnyPanelPageActive) {
            return allNavItems.find(item => item.path === '/dashboard');
        }
        return null;
    }, [pathname, allNavItems, isAnyPanelPageActive]);
    
    
    const buttonText = T.nav_dashboard;
    const buttonIcon = activeItem?.icon || 'user-circle-2';
    const activeColor = activeItem?.color || 'indigo';
    
    // KRİTİK DÜZELTME: Dinamik renk sınıfı kullanımı (Safelist'te tanımlı olanlar)
    const buttonActiveCls = `text-white shadow-lg border-2 border-${activeColor}-500/50 bg-${activeColor}-900/70 shadow-${activeColor}-900/50`;
    const buttonInactiveCls = 'text-gray-400 border border-gray-700/50 hover:text-indigo-300 hover:bg-indigo-900/30 hover:ring-2 hover:ring-indigo-500/50';

    const buttonCls = `flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98] border whitespace-nowrap ${
        isOpen || isAnyPanelPageActive 
            ? buttonActiveCls
            : buttonInactiveCls
    }`;


    const handleLinkClick = () => {
        setIsOpen(false);
        if(closeMobileMenu) closeMobileMenu();
    }


    return (
        <div ref={dropdownRef} className="relative z-50">
            <button
                id={buttonId}
                onClick={() => setIsOpen(!isOpen)}
                className={buttonCls}
                aria-expanded={isOpen}
                aria-controls={menuId}
                aria-haspopup="menu"
            >
                <Icon name={buttonIcon} className={`w-4 h-4`} aria-hidden="true" />
                {buttonText}
                <Icon name="chevron-down" className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} aria-hidden="true" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        id={menuId}
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-64 origin-top-right bg-gray-900/95 backdrop-blur-lg rounded-xl shadow-2xl ring-1 ring-indigo-500/30 p-2 divide-y divide-gray-700/50"
                        role="menu" 
                        aria-labelledby={buttonId}
                    >
                         {navGroups.map((group, groupIndex) => (
                            <div key={groupIndex} className="space-y-1 pb-1">
                                <h5 className={`text-xs font-bold uppercase text-gray-500 px-3 pt-3 `}>
                                    {group.title}
                                </h5>
                                <div className="space-y-1 pb-1">
                                    {group.items.map(item => {
                                        const isItemActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
                                        
                                        const itemColor = item.color;
                                        // KRİTİK DÜZELTME: Dinamik renk sınıfı kullanımı (Safelist'te tanımlı olanlar)
                                        const activeItemCls = `bg-${itemColor}-700/80 ${item.textColor || 'text-white'} font-bold border border-${itemColor}-500/50 shadow-md shadow-black/30`;
                                        const inactiveItemCls = `text-gray-300 hover:bg-gray-700/70 hover:text-white`;
                                        const itemClass = isItemActive ? activeItemCls : inactiveItemCls;
                                        // KRİTİK DÜZELTME: Dinamik ikon rengi sınıfı kullanımı (Safelist'te tanımlı olanlar)
                                        const itemIconColor = isItemActive && item.textColor === 'text-gray-900' ? 'text-gray-900' : (isItemActive ? 'text-white' : `text-${itemColor}-400`); 

                                        return (
                                            <Link
                                                key={item.path}
                                                href={item.path}
                                                className={`flex items-center px-3 py-2 text-sm transition-all duration-300 rounded-lg space-x-3 ${itemClass}`}
                                                onClick={handleLinkClick}
                                                role="menuitem" 
                                            >
                                                <Icon name={item.icon} className={`w-4 h-4 flex-shrink-0 ${itemIconColor}`} aria-hidden="true" />
                                                <span>{item.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                         <div className="py-1">
                             <button 
                                 // P28.0 FİX: 'handleLogout()' (lokal) yerine 'handleLogout' (prop) çağrılıyor.
                                 // (Bu prop zaten 'authHandleLogout'u taşıyordu, P28.0 FİX (Adım 1)'e gerek kalmadı).
                                 onClick={() => { handleLogout(); handleLinkClick(); }} 
                                 className="flex items-center w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-900/50 transition-colors rounded-lg" 
                                 role="menuitem" 
                             >
                                <Icon name="log-out" className="w-4 h-4 mr-3" aria-hidden="true" />
                                {T.nav_logout}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Ana Header Bileşeni
const Header = () => {
    // P30.0 FİX (Kök Neden Düzeltmesi): 'handleLogout' (hatalı) import anahtarı,
    // 'hooks/useSynaraAuth.js' (P29.0 Adım 3) export anahtarı olan 'logout' ile eşleştirildi.
    const { T, user, isAdmin, logout: authHandleLogout } = useAuth(); // P30.0 FİX
    const pathname = usePathname(); 
    // P29.0 FİX (Adım 1 - Revert P28.0): Çakışan P24.0 FİX hook'ları (useRouter, useQueryClient) GERİ EKLENDİ.
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [elevated, setElevated] = useState(false);
    const headerRef = useRef(null);

    // P29.0 FİX (Adım 1 - Revert P28.0): Çakışan P24.0 FİX lokal 'handleLogout' fonksiyonu GERİ EKLENDİ.
    // Bu fonksiyon, 'hooks/useSynaraAuth.js' (P27.0 FİX) çökmesini (P29.0 Kök Neden)
    // önlemek için GEREKLİDİR.
    const handleLogout = useCallback(async () => {
        if(authHandleLogout) {
            await authHandleLogout(); 
            // P29.0 FİX (Adım 1 - Revert P28.0): Cache (Önbellek) temizleme GERİ EKLENDİ.
            queryClient.clear();
            
            // P29.0 FİX (Adım 2 - Düzeltme): "Çift Yönlendirme" (Double Redirect) çakışması (P28.0 Kök Neden) düzeltildi.
            // Yönlendirme P24.0 FİX ('/') yerine P29.0 FİX ('/login') olarak güncellendi.
            router.push('/login');
            // router.refresh(); // P24.0 FİX (Refresh kaldırıldı, P29.0 FİX)
        }
    }, [authHandleLogout, router, queryClient]); // P29.0 FİX (Adım 1): Bağımlılıklar GERİ EKLENDİ.
    // P29.0 FİX Sonu

    useEffect(() => {
        const onScroll = () => {
            setElevated(window.scrollY > 50); 
        };
        const isRootPage = pathname === '/';
        if (isRootPage) {
            onScroll();
            window.addEventListener('scroll', onScroll, { passive: true });
        } else {
             setElevated(true); 
        }
        return () => window.removeEventListener('scroll', onScroll);
    }, [pathname]); 

    const isRootPage = pathname === '/';
    // KRİTİK DÜZELTME: isMestegPage kontrolüne yeni sayfa eklendi.
    const isMestegPage = pathname.startsWith('/about-us') || pathname.startsWith('/vision') || pathname.startsWith('/mesteg-referans');
    
    const isPanelPage = 
        pathname.startsWith('/dashboard') || 
        pathname.startsWith('/kokpit') || 
        pathname.startsWith('/kasa-yonetimi') || 
        pathname.startsWith('/lig') || 
        pathname.startsWith('/market-pulse') || 
        pathname.startsWith('/admin') || 
        pathname.startsWith('/assistant');

    const showMestegBranding = isMestegPage || (isRootPage && elevated);

    const headerTitle = showMestegBranding ? (T.header_scroll_logo || "Mesteg Disiplin") : "Synara System";
    const logoIconName = showMestegBranding ? 'mesteg' : 'synara';
    const logoColorClass = showMestegBranding ? 'text-yellow-400' : 'text-indigo-400';
    const isSolidBackground = isPanelPage || isMestegPage || elevated;

    const shellCls = isSolidBackground
        ? `bg-gray-900/95 border-b shadow-xl backdrop-blur-md ${isMestegPage ? 'border-amber-700/50' : 'border-indigo-700/50 border-gray-700'}` 
        : `glass-effect ${elevated 
            ? 'bg-[#0b1220]/90 shadow-2xl border-b border-indigo-700/50 backdrop-blur-md' 
            : 'bg-transparent border-b border-transparent'
          }`;
    
    const headerWrapCls = `fixed inset-x-0 top-0 z-[999] transition-all duration-300`; 

    const NavItem = ({ href, children, className, onClick }) => {
        let finalHref = href;
        let isActive = false;
        
        const isHashLink = finalHref && finalHref.startsWith('/#');
        
        if (isHashLink) {
             isActive = false; 
        } else {
             finalHref = href;
             isActive = pathname === finalHref || (finalHref !== '/' && pathname.startsWith(finalHref));
             if (finalHref === '/analyses' && pathname.startsWith('/analyses')) isActive = true;
             if (finalHref === '/modules' && pathname.startsWith('/modules')) isActive = true;
        }

        // KRİTİK DÜZELTME: isMestegLink kontrolüne yeni sayfa eklendi.
        const isMestegLink = finalHref === '/about-us' || finalHref === '/vision' || finalHref === '/mesteg-referans';
        const isAnalysisPortal = finalHref === '/analyses';
        
        let activeColor = 'indigo';
        if (isMestegLink) {
            activeColor = 'amber';
        } else if (isAnalysisPortal) {
            activeColor = 'indigo';
        }
        
        // KRİTİK DÜZELTME: Dinamik renk sınıfı kullanımı (Safelist'te tanımlı olanlar)
        const activeCls = `text-white border-2 border-${activeColor}-500/50 bg-${activeColor}-900/70 shadow-lg shadow-${activeColor}-900/50`;
        
        const mestegInactiveCls = 'text-amber-300 border border-amber-800/60 bg-black/20 hover:bg-amber-900/40 hover:border-amber-700/70 shadow-md shadow-amber-950/20';
        const defaultInactiveCls = 'text-gray-400 border border-gray-700/50 hover:text-indigo-300 hover:bg-gray-700/50 hover:ring-2 hover:ring-indigo-500/50';
        
        const inactiveCls = isMestegLink ? mestegInactiveCls : defaultInactiveCls;


        if (onClick) {
             return (<NavBtn 
                 as="button" 
                 onClick={onClick} 
                 isActive={isActive} 
                 className={`${isActive ? activeCls : inactiveCls} ${className}`}
                 aria-label={children.toString() + " bölümüne git"}
                 activeColor={activeColor}
             >
                 {children}
             </NavBtn>);
        }
        
        return (<NavBtn 
            as="link" 
            href={finalHref} 
            isActive={isActive} 
            className={`${isActive ? activeCls : inactiveCls} ${className}`}
            aria-label={children.toString() + " sayfasına git"}
            activeColor={activeColor}
        >
            {children}
        </NavBtn>);
    };
    
    if (!T || Object.keys(T).length === 0) {
        return <header ref={headerRef} className={headerWrapCls}><div className={shellCls} style={{ height: '64px' }}></div></header>;
    }

    return (
        <header ref={headerRef} className={headerWrapCls}>
            <div className={shellCls}>
                <nav className="container mx-auto px-6 h-16 flex items-center justify-between" role="navigation" aria-label="Ana Navigasyon">
                    <Link href="/" className="flex items-center gap-3 group flex-shrink-0" aria-label="Ana Sayfa, Synara System">
                        <div className="flex items-center gap-2 mr-8"> 
                            <Icon name={logoIconName} className={`w-8 h-8 ${logoColorClass} group-hover:text-yellow-300 transition-all duration-500 transform ${elevated ? 'rotate-12' : 'rotate-0'}`} aria-hidden="true" />
                            <span className="text-white font-bold text-xl tracking-tight transition-colors duration-500">{headerTitle}</span>
                        </div>
                    </Link>
                    
                    {/* PageSpeed FİX (Erişilebilirlik - ARIA): Hatalı 'role="menubar"' kaldırıldı. */}
                    <div className="hidden md:flex items-center gap-2"> 
                        <NavItem href="/">{T.nav_home}</NavItem>
                        <ModulesDropdown T={T} pathname={pathname} closeMobileMenu={() => setIsMobileMenuOpen(false)} /> 
                        <MestegDropdown T={T} pathname={pathname} closeMobileMenu={() => setIsMobileMenuOpen(false)} /> 
                        <NavItem href="/analyses">{T.nav_analysis_portal}</NavItem>
                        <BlogDropdown T={T} pathname={pathname} closeMobileMenu={() => setIsMobileMenuOpen(false)} />
                    </div>

                    <div className="hidden md:flex items-center gap-4 flex-shrink-0">
                        {user ? (
                            <DashboardDropdown 
                                T={T} 
                                pathname={pathname} 
                                isAdmin={isAdmin} 
                                // P29.0 FİX (Adım 1 - Revert P28.0): 'handleLogout' (lokal P29.0 FİX) geçiriliyor.
                                handleLogout={handleLogout} 
                                closeMobileMenu={() => setIsMobileMenuOpen(false)}
                            />
                        ) : (
                            <>
                                <NavBtn as="link" href="/login" isActive={pathname === '/login'} aria-label="Giriş Yap" activeColor="indigo">
                                    {T.nav_login}
                                </NavBtn>
                                <Link
                                    href="/register"
                                    className="group relative inline-flex items-center justify-center px-4 py-2 text-sm font-bold text-black bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl overflow-hidden transition-all duration-300 shadow-lg hover:shadow-yellow-500/50 transform hover:scale-105"
                                    aria-label="Hemen Kayıt Ol"
                                >
                                    <span className="absolute inset-0 bg-white opacity-20 group-hover:opacity-0 transition-opacity duration-300"></span>
                                    <span className="relative flex items-center">
                                        {T.nav_register}
                                        <Icon name="arrow-right" className="w-4 h-4 ml-2" aria-hidden="true" />
                                    </span
                                ></Link>
                            </>
                        )}
                    </div>

                    <button
                        className="md:hidden p-2 text-gray-300 hover:text-white"
                        onClick={() => setIsMobileMenuOpen(v => !v)}
                        aria-label={isMobileMenuOpen ? "Menüyü Kapat" : "Menüyü Aç"}
                        aria-expanded={isMobileMenuOpen}
                        aria-controls="mobile-menu-list"
                    >
                        <Icon name={isMobileMenuOpen ? 'x' : 'align-left'} className="w-6 h-6" aria-hidden="true" />
                    </button>
                </nav>
            </div>
            
            {/* MOBİL MENÜ FİX: Kaydırma sorununu çözmek için `max-h` tabanlı geçişten `fixed` ve `h-full` tabanlı geçişe geçildi. */}
            <div 
                id="mobile-menu-list"
                // YENİ KONUMLANDIRMA: Header'ın altından başla, tüm ekranı kapla.
                className={`md:hidden fixed top-16 left-0 right-0 z-[998] h-[calc(100vh-4rem)] 
                            bg-[#0b1220]/95 backdrop-blur-sm border-b border-white/5 
                            overflow-y-auto transition-all duration-300 ease-in-out
                            ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}` // Opaklık/Görünürlük geçişi eklendi
                            // ESKİ: ${isMobileMenuOpen ? 'max-h-screen' : 'max-h-0'}
                        }
                role="menu"
            >
                <div className="px-4 py-3 space-y-2">
                    <MobileNavItem href="/" closeMenu={() => setIsMobileMenuOpen(false)} iconName="compass">{T.nav_home}</MobileNavItem>
                    <MobileNavItem href="/modules" closeMenu={() => setIsMobileMenuOpen(false)} iconName="boxes">{T.nav_modules}</MobileNavItem>
                    <MobileNavItem href="/analyses" closeMenu={() => setIsMobileMenuOpen(false)} iconName="users">{T.nav_analysis_portal}</MobileNavItem>
                    <MobileNavItem href="/blog" closeMenu={() => setIsMobileMenuOpen(false)} iconName="align-left">{T.blog_page_title_header}</MobileNavItem>
                    <MobileNavItem href="/haberler" closeMenu={() => setIsMobileMenuOpen(false)} iconName="bell">{T.nav_news}</MobileNavItem>
                    <MobileNavItem href="/about-us" closeMenu={() => setIsMobileMenuOpen(false)} iconName="info">{T.nav_about_us}</MobileNavItem>
                    <MobileNavItem href="/vision" closeMenu={() => setIsMobileMenuOpen(false)} iconName="eye">{T.nav_vision}</MobileNavItem>
                    {/* YENİ MOBİL REFERANS LİNKİ */}
                    <MobileNavItem href="/mesteg-referans" closeMenu={() => setIsMobileMenuOpen(false)} iconName="award">Kurumsal Referans</MobileNavItem>
                </div>
                
                <div className="px-4 py-3 border-t border-white/5 space-y-2">
                    {user ? (
                        <>
                            <MobileNavItem href="/assistant" closeMenu={() => setIsMobileMenuOpen(false)} iconName="send">{T.nav_assistant}</MobileNavItem> 
                            {isAdmin && <MobileNavItem href="/admin" closeMenu={() => setIsMobileMenuOpen(false)} iconName="shield-check">{T.nav_admin}</MobileNavItem>}
                            <MobileNavItem href="/dashboard" closeMenu={() => setIsMobileMenuOpen(false)} iconName="bar-chart-2">{T.nav_dashboard}</MobileNavItem>
                            <MobileNavItem href="/kokpit" closeMenu={() => setIsMobileMenuOpen(false)} iconName="compass">{T.nav_kokpit}</MobileNavItem>
                            <MobileNavItem href="/lig" closeMenu={() => setIsMobileMenuOpen(false)} iconName="award">{T.nav_lig}</MobileNavItem>
                            <MobileNavItem href="/kasa-yonetimi" closeMenu={() => setIsMobileMenuOpen(false)} iconName="wallet">{T.nav_kasa_yonetimi}</MobileNavItem>
                            <MobileNavItem href="/market-pulse" closeMenu={() => setIsMobileMenuOpen(false)} iconName="activity">{T.nav_live_chart}</MobileNavItem>
                            {/* P29.0 FİX (Adım 1 - Revert P28.0): 'handleLogout' (lokal P29.0 FİX) çağrılıyor. */}
                            <MobileNavItem onClick={handleLogout} closeMenu={() => setIsMobileMenuOpen(false)} iconName="log-out">{T.nav_logout}</MobileNavItem>
                        </>
                    ) : (
                        <>
                            <MobileNavItem href="/login" closeMenu={() => setIsMobileMenuOpen(false)} iconName="log-in">{T.nav_login}</MobileNavItem>
                            <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-2 text-center px-3 py-2 rounded-md font-medium text-black bg-yellow-600 hover:bg-yellow-500" role="menuitem" aria-label="Kayıt Ol">
                                {T.nav_register}
                                <Icon name="arrow-right" className="w-4 h-4" aria-hidden="true" />
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
