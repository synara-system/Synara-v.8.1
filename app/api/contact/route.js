// path: app/api/contact/route.js
import { NextResponse } from 'next/server';
import { adminDb } from '@/firebase-admin';
import { logger } from '@/lib/Logger';

/**
 * Bu rota, istemci tarafından gönderilen iletişim mesajlarını Firestore'a kaydeder.
 * Not: Sunucusuz ortamda in-memory rate limiting güvenilir değildir.
 * Bu nedenle sadece honeypot ve temel doğrulama mantığı korunmuştur.
 */
export async function POST(request) {
    try {
        const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
        
        // Form verilerini al
        const { name, email, message, b_name } = await request.json(); // KRİTİK: b_name honeypot alanı olarak eklendi.

        // Basit Honeypot kontrolü (b_name alanı doluysa bot olarak işaretle)
        if (b_name) {
            logger.warn(`[Honeypot] Bot tespit edildi: IP=${ip}`, { ip, name, email });
            return NextResponse.json({ message: 'Spam tespit edildi.' }, { status: 400 });
        }

        if (!name || !email || !message) {
            return NextResponse.json({ message: 'Tüm alanlar zorunludur.' }, { status: 400 });
        }

        const contactMessage = {
            name,
            email,
            message,
            createdAt: new Date(),
            ipAddress: ip,
            status: 'new'
        };

        // Veritabanı bağlantısı yoksa logla ve hata döndür
        if (!adminDb) {
            logger.error('[API Hatası] Firestore bağlantısı kurulamadı.', { ip, email });
            return NextResponse.json({ message: 'Sunucu yapılandırma hatası.' }, { status: 500 });
        }

        await adminDb.collection('contact_messages').add(contactMessage);
        
        logger.info(`[İletişim Formu] Yeni mesaj alındı: ${email}`, { email, name });

        return NextResponse.json({ message: 'Mesajınız başarıyla gönderildi!' }, { status: 200 });

    } catch (error) {
        logger.error('[API Hatası] İletişim formu işlenemedi.', error);
        return NextResponse.json({ message: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.' }, { status: 500 });
    }
}

export async function GET() { return NextResponse.json({ message: "Log API (POST only)" }); }
// KRİTİK DÜZELTME: İletişim formu için Node.js çalışma zamanı zorlanmıştır.
export const runtime = 'nodejs';
