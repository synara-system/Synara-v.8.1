// path: lib/Logger.js
import { getBaseUrl } from './trpc/utils'; // Sunucu URL'sini almak için
import { isDev } from './trpc/utils'; // Ortam kontrolü için basit bir helper

/**
 * Global Loglama ve Hata Yakalama Protokolü (Structured Logging)
 * İstemci ve Sunucu hatalarını ayrıştırılmış (structured) formatta kaydeder.
 * Sentry/GA4 gibi harici servislere gönderme simülasyonunu içerir.
 */
class Logger {
    constructor() {
        this.context = {
            userId: 'Anonim',
            isAdmin: false,
            path: 'unknown',
            level: 'info',
        };
        this.appName = 'Synara-Web-Coder';
    }

    /**
     * Loglama context'ini günceller (Kullanıcı ID, Admin durumu vb.)
     * Bu, RootClientWrapper'da oturum açıldıktan sonra çağrılmalıdır.
     * @param {object} newContext
     */
    setContext(newContext) {
        this.context = { ...this.context, ...newContext };
    }

    /**
     * Yapılandırılmış log nesnesini oluşturur.
     * @param {string} message 
     * @param {string} level - 'info', 'warn', 'error', 'fatal'
     * @param {object} details - Ek detaylar (error stack vb.)
     */
    _createLogObject(message, level, details = {}) {
        return {
            timestamp: new Date().toISOString(),
            application: this.appName,
            environment: process.env.NODE_ENV,
            level: level.toUpperCase(),
            message,
            context: this.context,
            details,
        };
    }
    
    /**
     * Log'u sunucu konsoluna basar ve kritik hataları harici servise (simülasyon) gönderir.
     * @param {object} logObject 
     */
    _publishLog(logObject) {
        const { level, message, details, context } = logObject;
        const formattedLog = `[${logObject.application} | ${level}] - ${message} (User: ${context.userId}, Path: ${context.path})`;

        // KRİTİK GÖRSELLEŞTİRME PROTOKOLÜ UYGULANDI
        switch (level) {
            case 'FATAL':
            case 'ERROR':
                // Kırmızı renkli emoji ve vurgulu başlık
                console.error(`\n🔴 [KRİTİK HATA PROTOKOLÜ] ${formattedLog}`);
                // this._sendToExternalService(logObject); // Harici servislere gönderme simülasyonu
                break;
            case 'WARN':
                // Sarı renkli emoji ve uyarı başlığı
                console.warn(`\n🟡 [DİKKAT PROTOKOLÜ] ${formattedLog}`);
                break;
            default:
                // Yeşil/Mavi renkli emoji ve bilgi başlığı
                console.info(`\n🟢 [BİLGİ PROTOKOLÜ] ${formattedLog}`);
        }
        
        // Detayları sadece geliştirme ortamında bas
        if (isDev) {
            console.dir(details, { depth: null });
        }
    }
    
    // --- Kamu API'ları ---

    info(message, details = {}) {
        const log = this._createLogObject(message, 'info', details);
        this._publishLog(log);
    }

    warn(message, details = {}) {
        const log = this._createLogObject(message, 'warn', details);
        this._publishLog(log);
    }

    error(message, error, details = {}) {
        const log = this._createLogObject(message, 'error', { 
            ...details,
            error: error?.message,
            stack: error?.stack,
        });
        this._publishLog(log);
    }
    
    /**
     * Hata Sınırından (ErrorBoundary) gelen kritik hatalar için kullanılır.
     * @param {Error} error 
     * @param {object} errorInfo 
     */
    fatal(error, errorInfo) {
         const log = this._createLogObject('İstemci Tarafında Kritk Hata (ErrorBoundary)', 'FATAL', { 
            error: error?.message,
            stack: error?.stack,
            componentStack: errorInfo?.componentStack,
        });
        this._publishLog(log);
    }
    
    // İstemci hatalarını (örn: fetch hataları) sunucuya iletmek için API çağrısı
    // (Şimdilik sunucuda loglanıyor, gerekirse API rotası üzerinden iletilebilir)
    _sendToExternalService(logObject) {
        // const apiUrl = `${getBaseUrl()}/api/log`;
        // fetch(apiUrl, { method: 'POST', body: JSON.stringify(logObject), headers: { 'Content-Type': 'application/json' } }).catch(e => console.error("Log gönderme hatası:", e));
    }
}

// Global Logger instance'ını export et
export const logger = new Logger();
