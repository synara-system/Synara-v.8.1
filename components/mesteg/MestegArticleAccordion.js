// path: components/mesteg/MestegArticleAccordion.js
"use client";

import React, { useState } from 'react';
import Icon from '@/components/Icon';

/**
 * MESTEG Protokol detaylarını akordiyon (Accordion) yapısında gösterir.
 * globals.css dosyasındaki özel sınıfları (mesteg-accordion-...) kullanır.
 * @param {object} props - Bileşen özellikleri.
 * @param {Array<object>} props.articles - Akordiyon içeriği: [{ title, content, icon }]
 */
const MestegArticleAccordion = ({ articles }) => {
    // Sadece bir öğenin açık olmasına izin veren state
    const [activeIndex, setActiveIndex] = useState(null);

    const toggleAccordion = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    if (!articles || articles.length === 0) {
        return <div className="text-gray-500 text-center py-10">Gösterilecek makale veya detay bulunamadı.</div>;
    }

    return (
        <div className="rounded-xl overflow-hidden bg-gray-800/70 shadow-xl border border-gray-700">
            {articles.map((article, index) => {
                const isActive = index === activeIndex;
                return (
                    <div key={index} className="mesteg-accordion-item">
                        {/* Akordiyon Başlığı/Tetikleyicisi */}
                        <div
                            className="mesteg-accordion-header"
                            onClick={() => toggleAccordion(index)}
                            role="button"
                            aria-expanded={isActive}
                            aria-controls={`accordion-content-${index}`}
                        >
                            <div className="flex items-center space-x-3">
                                <Icon name={article.icon} className={`h-6 w-6 transition-colors ${isActive ? 'text-yellow-400' : 'text-pink-400'}`} />
                                <span>{article.title}</span>
                            </div>
                            {/* Açma/Kapama İkonu */}
                            <Icon
                                name={isActive ? 'Minus' : 'Plus'}
                                className={`h-5 w-5 transition-transform duration-300 ${isActive ? 'transform rotate-180 text-yellow-400' : 'text-pink-400'}`}
                            />
                        </div>

                        {/* Akordiyon İçeriği */}
                        <div
                            id={`accordion-content-${index}`}
                            className="overflow-hidden transition-all duration-500 ease-in-out"
                            style={{
                                maxHeight: isActive ? '500px' : '0', // Maksimum yüksekliği geniş tutarak yumuşak geçiş sağlar
                                opacity: isActive ? 1 : 0,
                            }}
                            aria-hidden={!isActive}
                        >
                            <div className="mesteg-accordion-content whitespace-pre-line">
                                {article.content}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default MestegArticleAccordion;
