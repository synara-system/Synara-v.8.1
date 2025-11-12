// path: lib/RiskGateUtils.js

/**
 * Bu fonksiyon, Synara'nın Metis ve Engine modüllerinden geldiği varsayılan,
 * Korku & Açgözlülük Endeksi'ne dayalı anlık piyasa riskini döndürür.
 * * @param {object} T - Çeviri objesi.
 * @param {number} fearGreedValue - Anlık Korku & Açgözlülük Endeksi değeri.
 * @returns {{level: 'CRITICAL'|'HIGH'|'MEDIUM'|'LOW'|'UNKNOWN', color: 'red'|'yellow'|'orange'|'green'|'gray', labelKey: string, message: string}}
 */
export const getRiskGateStatus = (T, fearGreedValue) => {
    // T'nin varlığını kontrol et
    const T_FALLBACK = T && Object.keys(T).length > 0 ? T : { 
        risk_status_high: 'YÜKSEK', 
        risk_status_medium: 'ORTA', 
        risk_status_low: 'DÜŞÜK', 
        risk_status_unknown: 'BİLİNMEYEN',
        // Placeholder metinleri
        risk_high_message: "Aşırı açgözlülük veya korku. Yüksek oynaklık riski.",
        risk_medium_message: "Piyasa nötr bölgede. Orta düzeyde oynaklık riski.",
        risk_low_message: "Piyasa stabil. Düşük risk.",
    };

    const value = parseInt(fearGreedValue, 10);

    if (isNaN(value)) {
        return {
            level: 'UNKNOWN',
            color: 'gray',
            labelKey: T_FALLBACK.risk_status_unknown,
            message: T_FALLBACK.risk_unknown_message || "Piyasa risk verisi alınamadı. Lütfen Metis modülünü manuel olarak kontrol edin.",
        };
    }

    if (value > 70 || value < 10) { // Aşırı Uçlar: Aşırı Açgözlülük / Aşırı Korku
        return {
            level: 'CRITICAL',
            color: 'red',
            labelKey: T_FALLBACK.risk_status_critical || T_FALLBACK.risk_status_high,
            message: T_FALLBACK.risk_critical_message || "KRİTİK UYARI: Piyasada aşırı uçlarda duygu hakim. Hızlı düzeltme riski çok yüksek.",
        };
    }
    
    if (value > 60 || value < 20) { // Yüksek Risk: Açgözlülük / Korku
        return {
            level: 'HIGH',
            color: 'yellow',
            labelKey: T_FALLBACK.risk_status_high,
            message: T_FALLBACK.risk_high_message || "UYARI: Piyasada açgözlülük veya korku hakim. Oynaklık riski yüksek.",
        };
    } 
    
    if (value >= 40 && value <= 60) { // Nötr Bölge
        return {
            level: 'MEDIUM',
            color: 'orange',
            labelKey: T_FALLBACK.risk_status_medium,
            message: T_FALLBACK.risk_medium_message || "Piyasa nötr bölgede. Orta düzeyde oynaklık bekleniyor.",
        };
    }
    
    if (value >= 20 && value <= 40) { // Düşük Risk (Hafif Korku)
        return {
            level: 'LOW',
            color: 'green',
            labelKey: T_FALLBACK.risk_status_low,
            message: T_FALLBACK.risk_low_message || "Piyasa stabil. Düşük risk. Ancak alt bölgeye dikkat.",
        };
    }
    
    return {
        level: 'UNKNOWN',
        color: 'gray',
        labelKey: T_FALLBACK.risk_status_unknown,
        message: T_FALLBACK.risk_unknown_message || "Piyasa durumu bilinmiyor."
    };
};
