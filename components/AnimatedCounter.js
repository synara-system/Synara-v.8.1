// path: components/AnimatedCounter.js
'use client';

import React, { useState, useEffect, useRef } from 'react';
// KRİTİK FİX: framer-motion'dan bağımsız, stabil kaydırma hook'u kullanıldı.
import useScrollAnimation from '@/hooks/useScrollAnimation'; 

/**
 * Animasyonlu Sayaç Bileşeni.
 * Sadece component görünür olduğunda saymaya başlar (IntersectionObserver ile).
 * @param {object} props - Bileşen özellikleri.
 * @param {number} props.to - Saymanın biteceği hedef değer.
 * @param {boolean} [props.isPercent] - Değerin yüzde (%) olarak gösterilip gösterilmeyeceği.
 * @param {boolean} [props.isRatio] - Değerin R:R (1 ondalık) olarak gösterilip gösterilmeyeceği.
 * @returns {JSX.Element} Sayılan değeri gösteren span elementi.
 */
const AnimatedCounter = ({ to, isPercent = false, isRatio = false }) => {
    const [count, setCount] = useState(0);
    // KRİTİK GÜNCELLEME: useInView yerine stabil useScrollAnimation kullanıldı.
    const [ref, isInView] = useScrollAnimation(0.5); // %50 görünürlükte tetikle

    // Sayacı sıfırlama ve başlatma mantığı
    useEffect(() => {
        if (!isInView) {
            // Görünmez olduğunda sıfırla, böylece tekrar göründüğünde yeniden sayar
            setCount(0); 
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
                // Hedefe ulaşıldığında animasyonu durdur ve tam hedef değeri ayarla
                setCount(to);
                clearInterval(timer);
            } else {
                // isRatio'ya göre 1 ondalık basamak hassasiyeti koru, aksi halde yuvarla
                if (isRatio || isPercent) {
                    setCount(parseFloat(current.toFixed(isRatio ? 2 : 1)));
                } else {
                    setCount(Math.ceil(current));
                }
            }
        }, interval);
        
        // Temizleme: Component kaldırıldığında veya 'isInView' değiştiğinde zamanlayıcıyı durdur
        return () => clearInterval(timer);
    }, [isInView, to, isRatio, isPercent]); // Bağımlılıklar: isInView, to, isRatio, isPercent
    
    // Formatlama: Ondalık hassasiyetini koru
    let formattedCount;
    if (isRatio) {
        // R:R için 2 ondalık hassasiyet (Örn: 3.25)
        formattedCount = count.toFixed(2);
    } else if (isPercent) {
        // Yüzde için 1 ondalık hassasiyet (Örn: 89.4%)
        formattedCount = count.toFixed(1);
    } else {
        // Tam sayı veya virgülsüz (Örn: 1.540)
        formattedCount = Math.ceil(count).toLocaleString('tr-TR');
    }
    
    return <span ref={ref}>{formattedCount}</span>;
};

export default AnimatedCounter;
