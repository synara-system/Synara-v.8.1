// path: components/AnimatedCounter.js
'use client';

import React, { useState, useEffect, useRef } from 'react';
// KRİTİK FİX: framer-motion'dan bağımsız, stabil kaydırma hook'u kullanıldı.
import useScrollAnimation from '@/hooks/useScrollAnimation'; 

/**
 * Animasyonlu Sayaç Bileşeni.
 * Sadece component görünür olduğunda saymaya başlar (IntersectionObserver ile).
 */
const AnimatedCounter = ({ to, isPercent = false, isRatio = false }) => {
    const [count, setCount] = useState(0);
    // KRİTİK GÜNCELLEME: useInView yerine stabil useScrollAnimation kullanıldı.
    const [ref, isInView] = useScrollAnimation(0.5); // %50 görünürlükte tetikle

    // Sayacı sıfırlama ve başlatma mantığı
    useEffect(() => {
        if (!isInView) {
            setCount(0); // Görünmez olduğunda sıfırla
            return;
        }
        
        // Görünür olduğunda saymaya başla
        const DURATION = 1.5; // saniye (Daha hızlı ve vurucu)
        const STEPS = 50;
        const interval = DURATION * 1000 / STEPS;
        const increment = to / STEPS;
        let current = 0;
        
        // KRİTİK KONTROL: Eğer "to" değeri zaten 0 veya negatifse, animasyon yapma.
        if (to <= 0) {
             setCount(to);
             return;
        }

        const timer = setInterval(() => {
            current += increment;
            if (current >= to) {
                setCount(to);
                clearInterval(timer);
            } else {
                // isRatio'ya göre ondalık basamakları koru.
                setCount(isRatio ? parseFloat(current.toFixed(1)) : Math.ceil(current));
            }
        }, interval);
        
        return () => clearInterval(timer);
    }, [isInView, to, isRatio]); // isInView değiştiğinde yeniden çalıştır.
    
    // Formatlama: isRatio'ya göre 1 ondalık, aksi halde tam sayı.
    const formattedCount = isRatio ? count.toFixed(1) : Math.ceil(count).toLocaleString('tr-TR');
    
    return <span ref={ref}>{formattedCount}</span>;
};

export default AnimatedCounter;
