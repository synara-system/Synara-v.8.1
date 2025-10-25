// path: components/DynamicImage.js
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Icon from '@/components/Icon'; // KRİTİK FİX: Mutlak alias import kullanıldı

const DynamicImage = ({ src, alt, width, height, className = '', priority = false, fallbackSrc, ...props }) => { // KRİTİK FİX: fallbackSrc prop'u ...props'tan ayrıldı
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    // KRİTİK FİX: Hata durumunda veya URL gelmediğinde kullanılacak nihai kaynak
    const finalFallbackSrc = fallbackSrc || `https://placehold.co/${width || 100}x${height || 100}/1F2937/4F46E5?text=Synara`;
    const errorSrc = finalFallbackSrc; // Hata olduğunda da aynı falllback'i kullan

    // Next/Image'in `src` prop'u `null` olamaz. Eğer gelen src geçersizse (null/undefined/boş), fallback kullan.
    const imageSource = src && typeof src === 'string' && src.length > 0 ? src : finalFallbackSrc;


    return (
        <div 
            className={`relative overflow-hidden ${className}`} 
            style={{ width: width ? `${width}px` : '100%', height: height ? `${height}px` : '100%' }}
        >
            <Image
                // Hata oluştuysa veya kaynak geçersizse hata kaynağını kullan.
                src={error ? errorSrc : imageSource}
                alt={alt || ''} 
                width={width}
                height={height}
                priority={priority}
                className={`transition-opacity duration-500 ease-in-out ${isLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
                onLoad={() => setIsLoading(false)}
                // KRİTİK: Next/Image hata aldığında `error` state'ini true yap.
                onError={() => {
                    setIsLoading(false);
                    setError(true);
                }}
                unoptimized={props.unoptimized || false} // unoptimized'ı da props'tan ayırarak Next.js'e uygun hale getiriyoruz
                // NOT: Diğer tüm proplar (props), Next.js Image bileşeninin kabul ettiği proplardır.
                {...props} 
            />
            {/* KRİTİK: Yüklenirken DynamicImage kendi boyutlarında bir placeholder gösterir. */}
             {isLoading && (
                 <div className="absolute inset-0 bg-gray-900/80 animate-pulse flex items-center justify-center">
                     <Icon name="loader" className="w-8 h-8 text-indigo-500 animate-spin" />
                 </div>
             )}
        </div>
    );
};

export default DynamicImage;
