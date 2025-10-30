// path: hooks/useScrollAnimation.js
'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Bir elementin viewport'a girip girmediğini takip eden bir React Hook'u.
 * IntersectionObserver API'ını kullanır.
 * @param {number} threshold - Elementin ne kadarının göründüğünde tetikleneceğini belirler (0 ile 1 arası).
 * @returns {[React.RefObject, boolean]} - Gözlemlenecek elemente atanacak bir ref ve elementin görünür olup olmadığını belirten bir boolean.
 */
const useScrollAnimation = (threshold = 0.1) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // Element görünür hale geldiğinde state'i güncelle.
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    // Bir kere tetiklendikten sonra observer'ı kaldırarak performansı artır.
                    observer.unobserve(entry.target);
                }
            },
            {
                threshold,
            }
        );

        const currentRef = ref.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [ref, threshold]);

    return [ref, isVisible];
};

export default useScrollAnimation;
