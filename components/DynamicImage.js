// path: components/DynamicImage.js
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import Icon from './Icon';

const DEFAULT_FALLBACK_SRC = 'https://placehold.co/1280x720/1f2937/d1d5db?text=Gorsel+Yuklenemedi';

/**
 * Next/Image bileşenini sarmalayan, stabil görsel yükleme ve hata yönetimi sağlar.
 * unoptimized prop'u varsayılan olarak FALSE'dur, yani Next.js optimizasyonu zorlanır.
 */
const DynamicImage = ({ 
    src, 
    alt, 
    className = '', 
    fallbackSrc, 
    unoptimized = false, // KRİTİK: Next.js optimizasyonunu aktif etmek için varsayılan FALSE
    priority = false, 
    // fill layout kullanıldığında width ve height gerekmez.
    fill = true,
    sizes = '(max-width: 768px) 100vw, 50vw' 
}) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [error, setError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Dışarıdan gelen src değiştiğinde state'i sıfırla
    useEffect(() => {
        setImgSrc(src);
        setError(false);
        setIsLoaded(false);
    }, [src]);

    // Yükleme hatası olursa fallbackSrc'ye geçmek için
    const handleError = () => {
        if (!error) {
            setError(true);
            setIsLoaded(true); 

            if (fallbackSrc) {
                setImgSrc(fallbackSrc);
            } else {
                setImgSrc(DEFAULT_FALLBACK_SRC);
            }
        } else if (imgSrc !== DEFAULT_FALLBACK_SRC) {
            setImgSrc(DEFAULT_FALLBACK_SRC);
        }
    };

    // Resim başarıyla yüklendikten sonra yüklendi olarak işaretle
    const handleLoad = () => {
        setIsLoaded(true);
        if (error) {
            setError(false);
        }
    };
    
    // Eğer src null, boş veya hata durumu kesinleşmişse, placeholder göster
    if (!src || typeof src !== 'string' || src.trim() === '' || (error && imgSrc === DEFAULT_FALLBACK_SRC)) {
        return (
            <div className={`flex items-center justify-center bg-gray-700/50 rounded-lg ${className}`} style={{ position: 'relative', width: '100%', height: '100%' }}>
                <Icon name="image-off" className="w-8 h-8 text-gray-400" />
            </div>
        );
    }

    return (
        <div className={`w-full h-full relative ${className}`}>
            <Image
                src={imgSrc}
                alt={alt || 'Blog Görseli'}
                fill={fill} 
                unoptimized={unoptimized} // unoptimized=false Next.js optimizasyonunu aktif eder
                priority={priority}
                sizes={sizes}
                className={`transition-opacity duration-500 ease-in-out ${!isLoaded ? 'opacity-0' : 'opacity-100'}`} 
                style={{ objectFit: 'cover' }} 
                onError={handleError}
                onLoad={handleLoad}
                // loading prop'u set edilmediğinde, priority=false ise varsayılan olarak 'lazy' kullanılır.
            />
             {/* Yükleme animasyonu (Hız fiksi için) */}
             {!isLoaded && (
                <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center">
                    <Icon name="loader" className="w-6 h-6 animate-spin text-yellow-400" />
                </div>
            )}
        </div>
    );
};


export default DynamicImage;
