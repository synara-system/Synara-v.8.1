// path: app/api/log/route.js
// Bu dosya, istemci hatalarının sunucuya structured log olarak gönderilmesi için bir API simülasyonudur.

import { NextResponse } from 'next/server';

/**
 * Bu rota, istemci tarafında yakalanan logları/hataları sunucuda işlemek için tasarlanmıştır.
 */
export async function POST(request) {
  try {
    const logData = await request.json();

    // KRİTİK LOGLAMA PROTOKOLÜ:
    // Bu noktada logData, yapılandırılmış bir log objesidir.
    // Gerçek bir uygulamada bu logu Sentry'ye, Datadog'a veya bir veritabanına kaydetmelisiniz.
    
    // Şimdilik sadece sunucu konsoluna (vurgulu) yazdırıyoruz.
    const { level, message, context } = logData;
    console.error(`\n🚨 [CLIENT CRITICAL LOG - API] ${level}: ${message} (User: ${context.userId})`);
    console.dir(logData, { depth: 5 });

    return NextResponse.json({ status: 'Log received' }, { status: 200 });

  } catch (error) {
    console.error('API Log Alma Hatası:', error);
    return NextResponse.json({ error: 'Log işleme hatası.' }, { status: 500 });
  }
}

export async function GET() { return NextResponse.json({ message: "Log API (POST only)" }); }
export const runtime = 'nodejs';
