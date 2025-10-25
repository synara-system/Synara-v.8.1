// path: server/trpc/routers/ai.js
import { z } from 'zod';
import { protectedProcedure, router } from '@/server/trpc/trpc';
import { TRPCError } from '@trpc/server';

// --- SABİT KİŞİLİK TANIMLAMALARI ---
const SYSTEM_INSTRUCTION_CONTENT_CREATOR = `
    Sen, Synara System'in pazarlama ve içerik üretimi için çalışan bir yapay zeka metin yazarı olarak görev yapıyorsun.
    Amacın, verilen bağlam (context) ve mevcut metin ışığında, hedef kitle (aktif trader) için en ilgi çekici, teknik ve agresif (vurucu) metin alternatiflerini üretmektir.
    KURALLAR:
    1. TON VE ODAK: Piyasa karmaşasını acımasızca eleştiren, agresif, otoriter ve son derece disiplinli bir ton kullan. Synara'yı piyasa otoritesi olarak konumlandır. Metinler, duygusal trader'ın hatalarını vurgulamalı ve Synara'nın tek doğru, ezber bozan yol olduğunu öne sürmelidir.
    2. ANAHTAR KELİMELER (SEO & VURUCU): Mutlaka "Kripto Analizinde Çığır Açan", "Geri Dönmeyen Sinyal", "Anchor Bar Kapanışı", "Gerçek Risk Yönetimi", "Piyasa Otoritesi" ve "Yapay Zeka Sinyalleri" gibi ifadeleri kullan.
    3. FELSEFE VE TEKNİK TERİMLER: Synara'nın temel felsefesini ("Disiplin, duyguya üstün gelir. Piyasa karmaşasını sisteme dönüştür.") koru ve şu terimleri otoriter bir şekilde kullan: "Anchor TF", "Nexus-First", "Holistic Intelligence Matrix (HIM)", "Context Bridge".
    4. ÇIKTI SAYISI VE ÇEŞİTLİLİĞİ: Yalnızca 3 adet alternatif metin üret: 
        * ShortTitle (Kısa Başlık): Kısa ve vurucu başlık, maksimum 10 kelime.
        * MediumTitle (Orta Başlık): Orta uzunlukta teknik, SEO dostu başlık/açıklama, maksimum 20 kelime.
        * LongContent (Uzun İçerik): En uzun (min 500 kelimeye yakın), en açıklayıcı, SEO dostu bilgi içeriği. Bu alternatifte Markdown formatını kullan, başlıklar (##), listeler (-) ve kalınlaştırmalar (**\*\* \*\***) ekle. Metnin başlangıcına, içeriğe uygun bir **[GÖRSEL/ŞEMA: Açıklayıcı ve Detaylı Görselin Konumlandırılması]** placeholder metni ekle.
    5. FORMAT: Asla açıklama, giriş veya sonuç metni yazma. Sadece JSON formatında çıktı ver.
`;

const SYSTEM_INSTRUCTION_ASSISTANT = `
    Sen, Synara System'in resmi yapay zeka asistanı olarak görev yapıyorsun.
    Amacın, kullanıcıların sisteme ait modüller, piyasa felsefesi ve teknik terimler hakkındaki sorularını yanıtlamak ve onlara rehberlik etmektir.
    KURALLAR:
    1. KİŞİLİK VE TON: Otoriter, disiplinli, teknik ve güven verici bir ton kullan. Duygusal ifadelerden kaçın. Kendini bir sistem, bir protokol olarak konumlandır. Cevapların kısa, net ve doğrudan olmalı.
    2. ANA MESAJ: Her zaman Synara'nın temel felsefesini koru: "Disiplin, duyguya üstün gelir. Piyasa karmaşasını sisteme dönüştür."
    3. TEKNİK DİL: Cevaplarında sık sık şu terimleri kullan ve bu terimlerin Synara'nın disiplinini nasıl sağladığını açıkla: Anchor TF (kesinleşmiş karar), HIM (bütünsel zeka), Repaint (tekrar boyama) koruması, Context Bridge (modül iletişimi), Nexus-First (giriş tetikleme önceliği).
    4. CHAT GEÇMİŞİ: Verilen chat geçmişini (contents) dikkate alarak bağlamı koru.
    5. KİŞİSELLEŞTİRME (KRİTİK): Eğer kullanıcı performansı ('performanceData') sağlanmışsa, yanıtlarını bu veriyi (Win Rate, Ortalama R:R, Toplam PnL, vb.) baz alarak kişiselleştir. Kullanıcının zayıf yönlerini (örn: düşük R:R, Short'ta kayıp) disiplinle vurgula ve bu zayıflıkları gidermesi için Synara modüllerini (Nexus, Metis, RSI-HAN) önerek tavsiyelerde bulun. Performans verisi yoksa genel Synara felsefesiyle yanıt ver.
    6. DİL: Türkçe cevap ver.
`;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MAX_RETRIES = 3;
const API_TIMEOUT_MS = 20000; // 20 Saniye

async function makeGeminiRequest(payload) {
    if (!GEMINI_API_KEY) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Gemini API anahtarı (GEMINI_API_KEY) sunucu ortamında yapılandırılmamış.' });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;
    let lastError = null; 

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = new Error(`Gemini API Hatası: ${response.status}`);
                error.status = response.status;
                
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorBody = await response.json();
                    error.message = `Gemini API Hatası (${response.status}): ${JSON.stringify(errorBody.error || errorBody)}`;
                } else {
                    const errorBodyText = await response.text();
                    if (errorBodyText.startsWith('<!DOCTYPE')) {
                       error.message = `API Sunucu Hatası (${response.status}): Beklenmeyen HTML yanıtı alındı. (API Anahtarını/Yetkilendirmeyi Kontrol Edin)`;
                    } else {
                       error.message = `API Yanıt Hatası (${response.status}): ${errorBodyText.substring(0, 100)}...`;
                    }
                }
                throw error;
            }

            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                throw new Error('Gemini API\'den geçerli bir yanıt alınamadı.');
            }

            return text;

        } catch (e) {
            clearTimeout(timeoutId);
            lastError = e;

            if (e.name === 'AbortError') {
                 console.error(`Gemini API Çağrısı Zaman Aşımı (Deneme ${attempt + 1})`);
            } else if (e.status === 503) {
                 console.warn(`Gemini API 503 Hatası (Deneme ${attempt + 1}). Tekrar denenecek.`);
            } else {
                 console.error(`Gemini API Çağrısı Hatası (Deneme ${attempt + 1}):`, e.message);
            }

            if (attempt < MAX_RETRIES - 1) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
    }
    
    if (lastError?.status === 503) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: "AI modeli şu anda yoğun. Lütfen birkaç dakika sonra tekrar deneyin." });
    }
    
    if (lastError?.name === 'AbortError') {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: "AI Protokolü Zaman Aşımı: Yanıt 20 saniye içinde alınamadı. (Server Koruması)" });
    }

    const errorMessage = lastError?.message.includes('API Anahtarını/Yetkilendirmeyi Kontrol Edin') 
        ? 'Kritik Yetkilendirme Hatası: Gemini API anahtarınız (GEMINI_API_KEY) geçersiz veya yapılandırma hatalı.'
        : `Yapay zeka yanıtı alınamadı: ${lastError?.message || 'Bilinmeyen hata'}`;

    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: errorMessage });
}


export const aiRouter = router({
  generateContentAlternatives: protectedProcedure
    .input(z.object({
        currentText: z.string(),
        targetType: z.enum(['title', 'content']),
    }))
    .mutation(async ({ input }) => {
        let context = "";
        if (input.targetType === 'title') {
            context = `Kısa ve orta uzunlukta (ShortTitle, MediumTitle) 2 vurucu başlık, ayrıca bu başlıklarla ilgili uzun bir içerik (LongContent) üret. Mevcut başlık: "${input.currentText}".`;
        } else {
            context = `Sadece LongContent tipinde, mevcut metne dayalı (Mevcut Metin: "${input.currentText}") en iyi içeriği üret. ShortTitle ve MediumTitle alanlarını da doldur.`;
        }

        const payload = {
            contents: [{ parts: [{ text: `Bu metin için bağlam: "${context}"` }] }],
            systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION_CONTENT_CREATOR }] },
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        ShortTitle: { type: "STRING" },
                        MediumTitle: { type: "STRING" },
                        LongContent: { type: "STRING" }
                    },
                    required: ["ShortTitle", "MediumTitle", "LongContent"]
                },
            },
        };
        
        const rawText = await makeGeminiRequest(payload);
        try {
            const cleanedJsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanedJsonText);
        } catch (jsonError) {
            console.error("KRİTİK JSON PARSE HATASI:", cleanedJsonText);
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: "Yapay zeka, beklenen JSON formatında çıktı üretemedi." });
        }
    }),

  getAssistantResponse: protectedProcedure
    .input(z.object({
        chatHistory: z.array(z.object({ role: z.enum(['user', 'model']), text: z.string() })),
        userMessage: z.string(),
        performanceData: z.any().nullable(),
    }))
    .mutation(async ({ input }) => {
        
        let performanceContext = "Kullanıcı performansı için geçerli veri bulunamadı. Genel Synara felsefesiyle yanıt ver.";
        if (input.performanceData) {
            performanceContext = `[KRİTİK BAĞLAM: Lütfen bu veriyi cevabına entegre et: Kullanıcı Performansı: ${JSON.stringify(input.performanceData)}]`;
        }

        const mappedHistory = input.chatHistory.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }));
        
        const finalUserMessage = `${performanceContext}\n\n[ASIL SORU]: ${input.userMessage}`;

        const userMessagePart = { 
            role: 'user', 
            parts: [{ text: finalUserMessage }] 
        };

        const contents = [
            ...mappedHistory.slice(-10),
            userMessagePart,
        ];

        const payload = {
            contents,
            systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION_ASSISTANT }] },
        };
        
        const responseText = await makeGeminiRequest(payload);
        return { response: responseText };
    }),
});
