// path: components/Icon.js
import React from 'react';

const Icon = ({ name, className = '', ...props }) => {
    // Tüm ikonlar (Lucide ve Sosyal Medya) tek bir object içinde tanımlandı.
    const icons = {
        // --- LOGOLAR ---
        synara: (
            <>
                {/* LOGO TEMİZLİĞİ: Ikonun görsel kalitesini artırmak için path'ler sadeleştirildi. */}
                <path d="M18 6c-4 0-6 3-6 7s2 7 6 7" /> 
                <path d="M6 18c4 0 6-3 6-7s-2-7-6-7" />
                {/* KRİTİK: Uç noktalar */}
                <circle cx="6" cy="18" r="2" fill="currentColor"/>
                <circle cx="18" cy="6" r="2" fill="currentColor"/>
            </>
        ),
        mesteg: (
            <>
                <rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M19 5 L20 4 M4 4 L5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 5 L12 19" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />
                <path d="M5 12 L19 12" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />
                <circle cx="12" cy="12" r="11" fill="none" stroke="#4F46E5" strokeWidth="1.5" strokeOpacity="0.1" />
            </>
        ),

        // --- BLOG KATEGORİ İKONLARI (EKSİKSİZ EKLENDİ) ---
        layers: (
            <>
                {/* Tümü (All) */}
                <path d="m12.83 2.18c-.37-.5-.98-.82-1.63-.82s-1.26.32-1.63.82L1 10.37V21a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-10.63Z" />
                <path d="M12 21V12" />
            </>
        ),
        'line-chart': (
            <>
                {/* Analiz */}
                <path d="M3 3v18h18" />
                <path d="m18 8-5 5-2-2-5 5" />
            </>
        ),
        'book-open': (
            <>
                {/* Eğitim */}
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </>
        ),
        'refresh-cw': (
            <>
                {/* Güncelleme */}
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.52 14C2.35 12.5 2 11.23 2 10c0-4.42 3.58-8 8-8s8 3.58 8 8c0 1.23-.35 2.5-1.52 4H16" />
            </>
        ),
        cog: (
            <>
                {/* Sistem */}
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.43 1.43 0 0 0 0 1.4L21 17.5a1 1 0 0 1-1.47 1.4L18 17.5a1.43 1.43 0 0 0-2.86 0L14.47 19a1 1 0 0 1-1.47 0L12 17.5a1.43 1.43 0 0 0-2.86 0L8 19a1 1 0 0 1-1.47 0L6 17.5a1.43 1.43 0 0 0-2.86 0L2 19a1 1 0 0 1-1.47 0L0 17.5a1.43 1.43 0 0 0 0-1.4L1.5 15a1.43 1.43 0 0 0 0-1.4L0 12.5a1 1 0 0 1 1.47-1.4L3 12.5a1.43 1.43 0 0 0 2.86 0L6 10a1 1 0 0 1 1.47 0L8 11.5a1.43 1.43 0 0 0 2.86 0L12 10a1 1 0 0 1 1.47 0L14.47 11.5a1.43 1.43 0 0 0 2.86 0L18 10a1 1 0 0 1 1.47 0L21 12.5a1.43 1.43 0 0 0 0 1.4L19.4 15Z" />
            </>
        ),
        
        // --- ANA MODÜL İKONLARI ---
        boxes: <><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></>,
        cpu: <><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 1v3"/><path d="M15 1v3"/><path d="M9 20v3"/><path d="M15 20v3"/><path d="M23 9h-3"/><path d="M23 15h-3"/><path d="M1 9h3"/><path d="M1 15h3"/><path d="M9 9h6v6H9z"/></>,
        compass: <><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></>,
        blocks: <><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="3" rx="1"/></>,
        activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>,
        thermometer: <><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></>,
        map: <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" x2="8" y1="2" y2="18"/><line x1="16" x2="16" y1="6" y2="22"/></>,
        'layout-grid': <><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/></>,
        spline: <><path d="M20 3c-2.2 2.2-2.2 5.8-2.2 5.8s3.6 0 5.8-2.2"/><path d="M4 21c2.2-2.2 2.2-5.8 2.2-5.8s0-3.6 2.2-5.8 5.8-2.2 5.8-2.2 0 3.6-2.2 5.8z"/></>,
        server: <><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></>, 
        
        // --- KONTROL VE DURUM İKONLARI ---
        settings: <><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/></>,
        'check-circle-2': <><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></>,
        check: <polyline points="20 6 9 17 4 12"/>,
        'chevron-down': <path d="m6 9 6 6 6-6"/>,
        'chevron-right': <path d="m9 18 6-6-6-6"/>,
        mail: <><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></>,
        'alarm-clock': <><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 4 21"/><path d="M17.64 18.67 20 21"/></>,
        bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
        'arrow-up-circle': <><circle cx="12" cy="12" r="10"/><path d="m8 12 4-4 4 4"/><path d="M12 16V8"/></>,
        'arrow-down-circle': <><circle cx="12" cy="12" r="10"/><path d="m8 12 4 4 4-4"/><path d="M12 8v8"/></>,
        'arrow-left': <path d="m12 19-7-7 7-7"/>,
        'arrow-right': <path d="m6 17 5-5-5-5"/>,
        'share-2': <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
        star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 9.27 12 2"/>,
        'dollar-sign': <><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
        scale: <><path d="m16 16 3-8 3 8c-2 1-4 1-6 0"/><path d="M2 16l3-8 3 8c-2 1-4 1-6 0"/><path d="M12 3v18"/><path d="M3 7h18"/><path d="M3 12h18"/></>,
        'trending-up': <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>,
        'trending-down': <><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></>,
        'shield-off': <><path d="M19.69 14a6.9 6.9 0 0 1-2.61 5.93M6.71 6.71A7 7 0 0 0 4 12v3c0 2.2 1.2 4.3 3 5.7"/><path d="M2 2 22 22"/><path d="M4.73 4.73 4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.66-3.27"/></>,
        'shield-alert': <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></>,
        'shield-check': <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></>,
        download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></>,
        'zoom-in': <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></>,
        'zoom-out': <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></>,
        search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
        clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
        loader: <line x1="12" y1="2" x2="12" y2="6"/>, // Basit bir loader
        
        // --- BİLDİRİM VE HATA İKONLARI ---
        info: <><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></>,
        'help-circle': <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></>,
        // KRİTİK DÜZELTME 2: Kapatma ikonu (düzgün Lucide X)
        x: <path d="M18 6 6 18M6 6l12 12" />, 
        'x-circle': <><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></>,
        plus: <><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></>,
        minus: <line x1="5" y1="12" x2="19" y2="12"/>,
        'align-left': <><line x1="17" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="3" y2="12"/><line x1="15" y1="18" x2="3" y2="18"/></>,
        'align-center': <><line x1="18" y1="6" x2="6" y2="6"/><line x1="22" y1="12" x2="2" y2="12"/><line x1="16" y1="18" x2="8" y2="18"/></>,
        
        // KRİTİK DÜZELTME 3: Sliders ikonu (Ayarlar için)
        sliders: <><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/></>,

        // --- GİRİŞ EKRANI İKONLARI ---
        'log-in': <><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></>,
        'log-out': <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
        eye: <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>,
        'eye-off': <><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></>,
        
        // --- BLOG & KULLANICI İKONLARI ---
        'user-circle-2': <><path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/><circle cx="12" cy="12" r="10"/></>,
        users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
        heart: <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.77-.77-.77a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/>,
        'message-square': <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>,
        pencil: <><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></>,
        'trash-2': <><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></>,
        
        // --- LİG SAYFASI ---
        award: <><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 22 12 17 17 22 15.79 13.88"/></>,
        
        // --- KASA & DASHBOARD İKONLARI ---
        wallet: <><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h14Z"/><path d="M3 5v14"/><path d="M21 17v.01"/></>,
        'bar-chart-2': <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
        'calendar-days': <><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" /></>,
        'credit-card': <><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></>,
        'refresh-cw': <><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.5 14a8 8 0 1 0 0-4"/><path d="M20.5 10a8 8 0 1 0 0 4"/></>,

        // --- SOSYAL MEDYA & İLETİŞİM (Sosyal medya ikonları sadece fill="currentColor" kullanır) ---
        whatsapp: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>,
        send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="m22 2-11 11"/></>,
        google: (
            <>
                <path d="M20.94 11.0001C20.94 10.2901 20.88 9.59009 20.76 8.91009H12V12.8101H17.04C16.83 14.1201 16.14 15.2201 15.13 15.9101V18.3301H18.09C19.92 16.6501 20.94 14.0801 20.94 11.0001Z" fill="#4285F4"/>
                <path d="M12 21.0001C14.73 21.0001 16.98 20.1101 18.09 18.3301L15.13 15.9101C14.28 16.5201 13.21 16.9001 12 16.9001C9.6 16.9001 7.57 15.3001 6.78 13.1101H3.79V15.5801C4.9 17.7301 6.85 19.2601 9.24 20.1801L9.25 20.19C9.82 20.41 10.41 20.59 11.03 20.74L12 21.0001Z" fill="#34A853"/>
                <path d="M6.78 13.1101C6.58 12.5101 6.47 11.8801 6.47 11.2501C6.47 10.6201 6.58 9.99009 6.78 9.39009V6.92009H3.79C3.28 8.00009 3 9.17009 3 10.5001V11.2501C3 12.8301 3.28 14.0001 3.79 15.0801L6.78 13.1101Z" fill="#FBBC05"/>
                <path d="M12 5.59991C13.44 5.59991 14.82 6.13991 15.82 7.07991L18.15 4.74991C16.97 3.66991 15.15 2.99991 12.75 2.99991L12 3.00009C8.98 3.00009 6.4 4.50009 4.9 6.92009L6.78 9.39009C7.57 7.20009 9.6 5.59991 12 5.59991Z" fill="#EA4335"/>
            </>
        ),
        // KRİTİK DÜZELTME 2: Kapatma ikonu (düzgün Lucide X)
        x: <path d="M18 6 6 18M6 6l12 12" />, 
        // KRİTİK FİX: Twitter X logosu
        x_twitter: <path d="M20.447 20.452h-3.554V13.001c0-1.806-.927-2.82-2.176-2.82-1.25 0-1.887.85-2.2 1.597-.115.268-.143.64-.143 1.014v7.66h-3.554s.046-10.287 0-11.33h3.554v1.56c.456-.84 1.41-2.035 3.203-2.035 2.333 0 4.137 1.528 4.137 4.792v7.014zM2.08 7.075h-.028C.843 7.075 0 6.225 0 5.062c0-1.19.87-2.086 2.108-2.086 1.238 0 2.08.895 2.08 2.086 0 1.164-.842 2.013-2.108 2.013zm1.777 13.377H.302V9.122h3.554v11.33z"/>,
        youtube: <path d="M21.582 7.683c-.22-.81-.86-1.45-1.67-1.67C18.422 5.5 12 5.5 12 5.5s-6.422 0-7.912.513c-.81.22-1.45.86-1.67 1.67C2 9.173 2 12 2 12s0 2.827.518 4.317c.22.81.86 1.45 1.67 1.67C5.578 18.5 12 18.5 12 18.5s6.422 0 7.912-.513c.81-.22 1.45-.86 1.67-1.67C22 14.827 22 12 22 12s0-2.827-.418-4.317zM9.545 14.558V9.442L14.77 12l-5.225 2.558z"/>,
        instagram: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.069-1.645-.069-4.85s.011-3.584.069-4.85c.149-3.225 1.664 4.771 4.919-4.919C8.416 2.175 8.796 2.163 12 2.163m0-2.163C8.74 0 8.333.012 7.053.072 2.695.272.273 2.69.073 7.052.012 8.333 0 8.74 0 12s.012 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98C8.333 23.988 8.74 24 12 24s3.667-.012 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.06-1.28.072-1.687.072-4.947s-.012-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98C15.667.012 15.26 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z"/>,
        facebook: <path d="M22.675 0h-21.35C.59 0 0 .59 0 1.325v21.35C0 23.41.59 24 1.325 24H12.82v-9.29h-3.128V11.41h3.128V8.63c0-3.1 1.893-4.788 4.658-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.29h-3.12V24h5.713c.735 0 1.325-.59 1.325-1.325V1.325C24 .59 23.41 0 22.675 0z"/>,
        linkedin: <path d="M20.447 20.452h-3.554V13.001c0-1.806-.927-2.82-2.176-2.82-1.25 0-1.887.85-2.2 1.597-.115.268-.143.64-.143 1.014v7.66h-3.554s.046-10.287 0-11.33h3.554v1.56c.456-.84 1.41-2.035 3.203-2.035 2.333 0 4.137 1.528 4.137 4.792v7.014zM2.08 7.075h-.028C.843 7.075 0 6.225 0 5.062c0-1.19.87-2.086 2.108-2.086 1.238 0 2.08.895 2.08 2.086 0 1.164-.842 2.013-2.108 2.013zm1.777 13.377H.302V9.122h3.554v11.33z"/>,
    };

    const socialIcons = ['x_twitter', 'youtube', 'instagram', 'facebook', 'linkedin', 'whatsapp', 'google'];
    
    // KRİTİK FİX: Eğer istenen isim sosyal medya ikonu değilse, normal ikon adını kullanır.
    const finalIconName = socialIcons.includes(name) ? name : (icons[name] ? name : (name === 'x' ? 'x' : 'help-circle'));
    const iconPath = icons[finalIconName];

    if (!iconPath) {
        // İkon bulunamazsa yardım ikonu döndürülür
        return (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-help-circle ${className}`} {...props}>
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
        );
    }

    const isSocial = socialIcons.includes(finalIconName);
    const isSynara = finalIconName === 'synara'; 
    const isModalClose = finalIconName === 'x'; // KRİTİK: Modal kapatma ikonu için

    let svgProps = {
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "24",
        viewBox: "0 0 24 24",
        className: `lucide lucide-${finalIconName} ${className}`, 
        ...props
    };

    if (isSocial && !isModalClose) {
        // Sosyal medya ikonları (Google hariç) fill ile renklendirilir
        if (finalIconName !== 'google') {
            svgProps.fill = "currentColor";
        }
        svgProps.stroke = "none"; // Sosyal medya ikonları genellikle stroke kullanmaz.
    } else if (isSynara) {
         // Synara Logosu
         svgProps.fill = "none";
         svgProps.stroke = "currentColor";
         svgProps.strokeWidth = "2";
         svgProps.strokeLinecap = "round";
         svgProps.strokeLinejoin = "round";
    } else {
        // Varsayılan Lucide stilini kullan
        svgProps.fill = "none";
        svgProps.stroke = "currentColor";
        svgProps.strokeWidth = "2";
        svgProps.strokeLinecap = "round";
        svgProps.strokeLinejoin = "round";
    }
    
    // KRİTİK DÜZELTME 5: Modal kapatma ikonu (x) sadece stroke kullanmalı
    if (isModalClose) {
         svgProps.fill = "none";
         svgProps.stroke = "currentColor";
         svgProps.strokeWidth = "2";
         svgProps.strokeLinecap = "round";
         svgProps.strokeLinejoin = "round";
    }

    return React.createElement('svg', svgProps, iconPath);
};

export default Icon;
