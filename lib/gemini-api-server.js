// path: fix31/lib/gemini-api-server.js

// (v4.0) DÜZELTME: Logger sınıfı yerine, Logger.js dosyasından export edilen tekil logger instance'ı import edildi.
import { logger } from '@/lib/Logger'; 

// const logger = new Logger('GeminiApiServer'); // ARTIK GEREKSİZ, TEKİL INSTANCE KULLANILIYOR

const API_KEY = process.env.GEMINI_API_KEY || ''; // .env'den anahtarı çeker

const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const MAX_RETRIES = 3;
const API_TIMEOUT_MS = 20000; // (v4.0) Timeout eklendi

/**
 * Üstel geri çekilme (exponential backoff) ile fetch çağrısı yapar.
 * (v4.0) Timeout (AbortSignal) eklendi
 * @param {string} url - API URL'si
 * @param {object} options - Fetch seçenekleri
 * @returns {Promise<Response>} API yanıtı
 */
async function fetchWithRetry(url, options) {
    logger.setContext({ path: 'GeminiApiServer' }); // (v4.0) Logger bağlamı ayarlandı
    let lastError = null;

    for (let i = 0; i < MAX_RETRIES; i++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
        
        // (v4.0) Sinyali fetch options'a ekle
        const fetchOptions = { ...options, signal: controller.signal };

        try {
            const response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId); // Başarılı olursa timeout'u temizle

            if (response.status === 429 && i < MAX_RETRIES - 1) {
                // Rate limit (429) durumunda bekle ve tekrar dene
                const delay = Math.pow(2, i) * 1000;
                logger.warn(`API Rate Limit uyarısı (429). ${delay}ms bekleniyor... (${url})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            if (!response.ok) {
                 // 429 dışındaki hatalı yanıtları (400, 403, 500) yakala
                const errorBody = await response.json().catch(() => ({})); 
                lastError = new Error(`API Hatası: ${response.status} ${response.statusText}. Yanıt: ${JSON.stringify(errorBody)}`);
                // (v4.0) Kalıcı hatalarda (403 vb) tekrar deneme (break)
                if (response.status !== 500 && response.status !== 503) {
                     break;
                }
                // 500/503 (Sunucu Hatası) ise tekrar denemeye devam et
                continue; 
            }
            return response; // Başarılı yanıt

        } catch (error) {
            clearTimeout(timeoutId); // Hata durumunda da timeout'u temizle
            lastError = error;

            // (v4.0) Timeout hatası
            if (error.name === 'AbortError') {
                logger.warn(`API Zaman Aşımı (${API_TIMEOUT_MS}ms). Deneme ${i + 1}/${MAX_RETRIES}. (${url})`);
                lastError = new Error(`API Zaman Aşımı: Yanıt ${API_TIMEOUT_MS}ms içinde alınamadı.`);
                // Timeout'ta tekrar deneme (isteğe bağlı, devam ediyor)
            } else {
                logger.warn(`Fetch hatası. Deneme ${i + 1}/${MAX_RETRIES}.`, error.message);
            }

            if (i < MAX_RETRIES - 1) {
                const delay = Math.pow(2, i) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    logger.error('Maksimum deneme sayısına ulaşıldı veya kalıcı hata.', lastError);
    throw lastError || new Error("API isteği maksimum deneme sayısından sonra başarısız oldu.");
}

/**
 * Gemini modelini kullanarak metin üretir.
 * @param {object} params
 * @param {string} params.systemPrompt - Modelin rolünü belirleyen sistem talimatı.
 * @param {string} params.userQuery - Kullanıcı sorgusu.
 * @param {Array} [params.tools] - Google Search grounding için araçlar.
 * @returns {Promise<{text: string, sources: Array<{uri: string, title: string}>}>}
 */
export async function generateContent({ systemPrompt, userQuery, tools = [] }) {
    logger.setContext({ path: 'GeminiApiServer' }); // Logger bağlamını ayarla

    if (!API_KEY) {
        logger.error("GEMINI_API_KEY environment değişkeni tanımlı değil.");
        return { 
            text: "Sistem yapılandırma hatası: Sunucu tarafı yapay zeka hizmeti kullanılamıyor (API Anahtarı Eksik).", 
            sources: [] 
        };
    }
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        // (v4.0) tools boş dizi ise, API'ye gönderme
        ...(tools.length > 0 && { tools: tools }),
    };
    
    try {
        const response = await fetchWithRetry(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        const candidate = result.candidates?.[0];

        if (candidate && candidate.content?.parts?.[0]?.text) {
            const text = candidate.content.parts[0].text;
            let sources = [];
            const groundingMetadata = candidate.groundingMetadata;
            
            if (groundingMetadata && groundingMetadata.groundingAttributions) {
                sources = groundingMetadata.groundingAttributions
                    .map(attribution => ({
                        uri: attribution.web?.uri,
                        title: attribution.web?.title,
                    }))
                    .filter(source => source.uri && source.title);
            }

            return { text, sources };

        } else if (result.error) {
            logger.error('Gemini API Hata Mesajı:', result.error.message);
            throw new Error(`API Hatası: ${result.error.message}`);
        } else {
            logger.error('Beklenmeyen API yanıt yapısı:', JSON.stringify(result, null, 2));
            throw new Error("API yanıtı beklenmedik bir yapıda.");
        }

    } catch (error) {
        logger.error("generateContent genel hata:", error.message);
        throw new Error("Yapay zeka içeriği oluşturulurken kritik hata oluştu: " + error.message);
    }
}

/**
 * Yapılandırılmış (JSON) içerik üretir.
 * @param {object} params
 * @param {string} params.systemPrompt - Modelin rolünü belirleyen sistem talimatı.
 * @param {string} params.userQuery - Kullanıcı sorgusu.
 * @param {object} params.responseSchema - JSON yanıt şeması (z.object().shape gibi).
 * @returns {Promise<any>} Çözümlenmiş JSON nesnesi.
 */
export async function generateStructuredContent({ systemPrompt, userQuery, responseSchema }) {
    logger.setContext({ path: 'GeminiApiServer' }); // Logger bağlamını ayarla
    
    if (!API_KEY) {
        logger.error("GEMINI_API_KEY environment değişkeni tanımlı değil.");
        throw new Error("Sistem yapılandırma hatası: API Anahtarı Eksik.");
    }
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        }
    };

    try {
        const response = await fetchWithRetry(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (jsonText) {
            // (v4.0) Gemini'nin JSON'u (bazen markdown ```json ... ``` bloğu içinde sarmalamasına karşın) güvenli parse etme
            const cleanedJsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
            try {
                return JSON.parse(cleanedJsonText);
            } catch (jsonError) {
                logger.error("KRİTİK JSON PARSE HATASI:", cleanedJsonText);
                throw new Error("Yapay zeka, beklenen JSON formatında çıktı üretemedi.");
            }
        } else if (result.error) {
            logger.error('Gemini API Yapısal Hata:', result.error.message);
            throw new Error(`API Hatası: ${result.error.message}`);
        } else {
            logger.error('Beklenmeyen API yapısal yanıtı:', JSON.stringify(result, null, 2));
            throw new Error("API yanıtı beklenmedik bir yapıda veya boş.");
        }
    } catch (error) {
        logger.error("generateStructuredContent genel hata:", error.message);
        throw new Error("Yapay zeka yapısal içeriği oluşturulurken kritik hata oluştu: " + error.message);
    }
}

