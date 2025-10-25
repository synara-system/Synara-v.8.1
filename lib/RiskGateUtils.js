// path: lib/RiskGateUtils.js

/**
 * Bu fonksiyon, Synara'nın Metis ve Engine modüllerinden geldiği varsayılan,
 * Korku & Açgözlülük Endeksi'ne dayalı anlık piyasa riskini döndürür.
 * @param {number} fearGreedValue - Anlık Korku & Açgözlülük Endeksi değeri.
 * @returns {{status: 'DÜŞÜK'|'ORTA'|'YÜKSEK', message: string}}
 */
export const getRiskGateStatus = (fearGreedValue) => {
    const value = parseInt(fearGreedValue, 10);

    if (isNaN(value)) {
        return {
            status: 'ORTA',
            message: "Piyasa risk verisi alınamadı. Lütfen Metis modülünü manuel olarak kontrol edin.",
        };
    }

    if (value > 65) { // Açgözlülük hakim
        return {
            status: 'YÜKSEK',
            message: "KRİTİK UYARI: Piyasada aşırı açgözlülük hakim. Düzeltme riski yüksek. Engine, long pozisyon girişlerini kısıtlayabilir."
        };
    } else if (value < 30) { // Korku hakim
        return {
            status: 'YÜKSEK',
            message: "KRİTİK UYARI: Piyasada aşırı korku hakim. Volatilite artışı bekleniyor. Engine, short pozisyon girişlerini kısıtlayabilir."
        };
    } else if (value >= 30 && value <= 45) { // Nötr'den Korku'ya geçiş
        return {
            status: 'ORTA',
            message: "Dikkat: Piyasa duyarlılığı korkuya dönüyor. Lütfen TradingView'de momentum ve likidite durumunu teyit edin.",
        };
    } else { // Nötr veya hafif açgözlülük
        return {
            status: 'DÜŞÜK',
            message: "Mevcut piyasa koşulları disiplin protokolü için optimaldir. Nexus-First tetiklemesini kontrol etmeniz yeterlidir."
        };
    }
};
