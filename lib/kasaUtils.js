// path: lib/kasaUtils.js
/**
 * Verilen timestamp'ten bu yana geçen süreyi formatlar.
 * @param {Date | string | {toDate: () => Date}} timestamp - Başlangıç zamanı (Date objesi, ISO string veya Firestore Timestamp).
 * @returns {string} Formatlanmış süre (örn: "01:23:45" veya "2 Gün").
 */
export const formatElapsedTime = (timestamp) => {
    if (!timestamp) return '---';
    // Firestore timestamp objeleri için .toDate() metodunu kontrol et
    const openTime = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - openTime.getTime();
    if (diffMs < 0) return '00:00:00';
    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} Gün`;
    // Saat, dakika, saniye formatını döndürür
    return new Date(diffMs).toISOString().substr(11, 8);
};

/**
 * @typedef {object} TradePnLResult
 * @property {number} pnlUsd - Dolar cinsinden Kar/Zarar.
 * @property {number} pnlPercent - Yüzdesel Kar/Zarar (ROE).
 * @property {number} riskReward - Risk/Ödül oranı.
 * @property {number} riskUsd - Pozisyon için riske edilen dolar miktarı.
 * @property {number} positionSize - Pozisyonun toplam büyüklüğü (kaldıraçlı).
 * @property {number} marginUsed - Kullanılan teminat.
 * @property {number} entryPrice - Giriş fiyatı.
 * @property {number} exitPrice - Çıkış/Hedef fiyat.
 * @property {number} margin - Kaldıraç oranı.
 * @property {number} stopLoss - Stop-loss fiyatı.
 * @property {boolean} error - Hesaplamada hata olup olmadığı.
 * @property {string} [errorMessage] - Hata mesajı (eğer varsa).
 */

/**
 * Bir işlemin PnL ve Risk/Ödül (R:R) metriklerini İSTEMCİ TARAFINDA ÖNİZLEME için hesaplar.
 * Bu fonksiyon, sunucu tarafı mantığını taklit ederek arayüzde anlık geri bildirim sağlar.
 *
 * @param {{
 * direction: 'L' | 'S';
 * entryPrice: number | string;
 * stopLoss: number | string;
 * margin: number | string;
 * marginUsed?: number | string;
 * quantity?: number | string;
 * }} trade - İşlem verisi. `marginUsed` veya eski `quantity` alanını içermelidir.
 * @param {number} targetPrice - Hesaplama için kullanılacak hedef fiyat (Kapanış fiyatı veya TP fiyatı).
 * @returns {TradePnLResult | {error: true, errorMessage: string}} Hesaplama sonuçları veya hata objesi.
 */
export const calculateTradePnL = (trade, targetPrice) => {
    try {
        const sl = parseFloat(trade.stopLoss) || 0;
        const direction = trade.direction;
        const entryPrice = parseFloat(trade.entryPrice) || 0;
        const margin = parseFloat(trade.margin) || 0;
        // Hem `marginUsed` hem de eski `quantity` alanını kontrol et.
        const marginUsed = parseFloat(trade.marginUsed || trade.quantity) || 0;
        const price = parseFloat(targetPrice) || 0;

        if (!direction || marginUsed <= 0 || entryPrice <= 0 || price <= 0 || margin <= 0 || sl <= 0) {
            return { error: true, errorMessage: "Girdi hatası: Tüm finansal değerler pozitif olmalıdır." };
        }

        const positionSize = marginUsed * margin;
        const coinQuantity = positionSize / entryPrice;
        
        const pnlRaw = direction === 'L' ? (price - entryPrice) * coinQuantity : (entryPrice - price) * coinQuantity;
        const pnlUsd = parseFloat(pnlRaw.toFixed(2));
        const pnlPercent = parseFloat(((pnlUsd / marginUsed) * 100).toFixed(2));

        const riskPriceDiff = Math.abs(entryPrice - sl);
        const riskUsd = parseFloat((riskPriceDiff * coinQuantity).toFixed(2));

        // KRİTİK DÜZELTME: Sunucu mantığıyla senkronize edildi.
        let riskReward = 0;
        if (riskUsd > 0.0001) {
            riskReward = parseFloat((pnlUsd / riskUsd).toFixed(2));
        } else if (pnlUsd > 0) {
            riskReward = 9999.99; // Risk sıfırsa ve kar varsa R:R sonsuzdur.
        }
        
        if (Math.abs(riskReward) > 9999.99 || isNaN(riskReward)) riskReward = 9999.99;
        
        return {
            pnlUsd, pnlPercent, riskReward, riskUsd,
            positionSize: parseFloat(positionSize.toFixed(2)),
            marginUsed: parseFloat(marginUsed.toFixed(2)),
            entryPrice: entryPrice,
            exitPrice: price, 
            margin: margin,
            stopLoss: sl,
            error: false
        };
    } catch {
        return { error: true, errorMessage: "Hesaplama hatası." };
    }
};
